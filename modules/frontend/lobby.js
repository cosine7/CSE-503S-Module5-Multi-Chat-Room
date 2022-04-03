export default function loadLobby(user, rooms, socket) {
  const nav = document.createElement('nav');
  const main = document.createElement('main');
  const chatBoxes = new Map();
  let currentActiveRoomSection = null;

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

  function joinRoom(room) {
    socket.emit('joinRoom', room.id);
    socket.on('roomJoined', () => {
      createChatBox(room);
      showChatBox(room.id);
      addAnnouncement(room.id, 'You joined the room');
      addMemberToList(room.id, user);
    });
  }

  socket.on('isInRoom', (isInRoom, room) => {
    if (isInRoom) {
      showChatBox(room.id);
    } else {
      const button = document.createElement('button');
      button.className = 'btn-join';
      button.textContent = `Join Room ${room.name}`;
      button.addEventListener('click', joinRoom.bind(null, room));
      main.innerHTML = '';
      main.className = 'flex-center';
      main.appendChild(button);
    }
  });

  function createSection(name, room) {
    const section = document.createElement('div');
    const avatar = document.createElement('div');
    if (room) {
      section.className = 'room';
      if (room.owner.id === user.id) {
        section.classList.add('room-active');
        currentActiveRoomSection && currentActiveRoomSection.classList.toggle('room-active');
        currentActiveRoomSection = section;
      }
      section.addEventListener('click', () => {
        if (currentActiveRoomSection === section) {
          return;
        }
        socket.emit('roomClicked', room.id);
        currentActiveRoomSection && currentActiveRoomSection.classList.toggle('room-active');
        section.classList.toggle('room-active');
        currentActiveRoomSection = section;
      });
      avatar.style.backgroundColor = room.color;
    } else {
      avatar.style.backgroundColor = user.color;
    }
    const nameText = document.createElement('p');
    nameText.textContent = name;
    section.append(avatar, nameText);
    return section;
  }

  function createMemberRow(member) {
    const avatar = document.createElement('div');
    avatar.style.backgroundColor = member.color;
    const name = document.createElement('p');
    name.textContent = member.nickname;
    const li = document.createElement('li');
    li.append(avatar, name);
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
    chatBoxes.set(room.id, [chatBox, memberList, inputBox]);
  }

  function addAnnouncement(roomId, announcement) {
    const message = document.createElement('p');
    message.className = 'announcement';
    message.textContent = announcement;
    chatBoxes.get(roomId)[0].appendChild(message);
  }

  function addRoomSection(room) {
    nav.appendChild(createSection(room.name, room));
    if (room.owner.id === user.id) {
      createChatBox(room);
      showChatBox(room.id);
      addAnnouncement(room.id, 'You created the room');
    }
  }

  function addMemberToList(roomId, member) {
    chatBoxes.get(roomId)[1].appendChild(createMemberRow(member));
  }

  socket.on('newRoom', addRoomSection);

  socket.on('newMember', (roomId, member) => {
    if (member.id === user.id) {
      return;
    }
    addAnnouncement(roomId, `${member.nickname} joined the room`);
    addMemberToList(roomId, member);
  });

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
