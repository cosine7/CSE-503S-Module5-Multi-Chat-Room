export default function loadLobby(user, rooms, socket) {
  const nav = document.createElement('nav');
  const main = document.createElement('main');
  const chatBoxes = new Map();
  let activeRoomDiv = null;

  function closePopover() {
    document.getElementById('popover').remove();
  }

  function createRoom(event) {
    event.preventDefault();
    socket.emit('createRoom', user, document.getElementById('roomName').value);
    closePopover();
  }

  function createRoomButtonDidClick(event) {
    event.preventDefault();
    const popover = document.createElement('div');
    popover.id = 'popover';
    const closeBtn = document.createElement('i');
    closeBtn.className = 'iconfont icon-close';
    closeBtn.addEventListener('click', closePopover);
    const roomInput = document.createElement('input');
    roomInput.type = 'text';
    roomInput.id = 'roomName';
    roomInput.required = true;
    const label = document.createElement('label');
    label.for = 'roomName';
    label.textContent = 'Room Name';
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Create Room';
    const form = document.createElement('form');
    form.className = 'form-wrapper';
    form.append(closeBtn, roomInput, label, submitButton);
    form.addEventListener('click', (e) => { e.stopPropagation(); });
    form.addEventListener('submit', createRoom);
    // const content = document.createElement('div');
    // content.className = 'popover-content';
    popover.addEventListener('click', closePopover);
    popover.appendChild(form);
    document.body.appendChild(popover);
  }

  function showChatBox(roomId) {
    main.innerHTML = '';
    main.className = 'grid';
    chatBoxes.get(roomId).forEach((element) => {
      main.appendChild(element);
    });
  }

  function joinRoom(roomId) {
    socket.emit('joinRoom', roomId);
  }

  function roomDidClick(event) {
    event.preventDefault();
    if (activeRoomDiv === this) {
      return;
    }
    activeRoomDiv = this;
    const roomId = this.room.id;
    socket.emit('roomClicked', roomId);
    socket.on('isInRoom', (isInRoom) => {
      if (isInRoom) {
        showChatBox(roomId);
      } else {
        const button = document.createElement('button');
        button.className = 'btn-join';
        button.textContent = `Join Room ${this.textContent}`;
        button.addEventListener('click', joinRoom.bind(null, roomId));
        main.innerHTML = '';
        main.className = 'flex-center';
        main.appendChild(button);
      }
    });
  }

  function createSection(name, room) {
    const section = document.createElement('div');
    const avatar = document.createElement('div');
    if (room) {
      section.room = room;
      section.className = 'room';
      section.addEventListener('click', roomDidClick, true);
      avatar.style.backgroundColor = room.color;
    } else {
      avatar.style.backgroundColor = user.color;
    }
    section.append(avatar, name);
    return section;
  }

  function createMemberRow(member) {
    const avatar = document.createElement('div');
    avatar.style.backgroundColor = member.color;
    const li = document.createElement('li');
    li.append(avatar, member.nickname);
    return li;
  }

  function createChatBox(room) {
    const chatBox = document.createElement('div');
    chatBox.className = 'chat-box';
    const ownerText = document.createElement('p');
    ownerText.textContent = 'Owner';
    const memberText = document.createElement('p');
    memberText.textContent = 'Member';
    const memberList = document.createElement('ul');
    memberList.className = 'member-list';
    memberList.appendChild(ownerText);
    memberList.appendChild(createMemberRow(room.owner));
    memberList.appendChild(memberText);
    const inputBox = document.createElement('div');
    inputBox.className = 'input-box';
    const message = document.createElement('p');
    message.className = 'message';
    message.textContent = 'You Created the Room';
    chatBox.appendChild(message);
    chatBoxes.set(room.id, [chatBox, memberList, inputBox]);
    showChatBox(room.id);
  }

  function addRoomSection(room) {
    nav.appendChild(createSection(room.name, room));
    room.owner.id === user.id && createChatBox(room);
  }

  socket.on('newRoom', addRoomSection);

  (async () => {
    const sidebar = document.createElement('aside');
    const createRoomButton = document.createElement('button');
    createRoomButton.className = 'iconfont icon-plus';
    createRoomButton.addEventListener('click', createRoomButtonDidClick);
    sidebar.append(createRoomButton);
    const youText = document.createElement('p');
    youText.textContent = 'You';
    const roomText = document.createElement('p');
    roomText.textContent = 'Room';
    nav.append(youText, createSection(user.nickname), roomText);
    rooms.forEach(addRoomSection);
    document.body.className = 'container';
    document.body.append(sidebar, nav, main);
  })();
}
