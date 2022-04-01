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

  function generateColorFor(element) {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    element.style.backgroundColor = `#${randomColor}`;
  }

  function showChatBox(roomId) {
    main.innerHTML = '';
    main.className = 'vbox';
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
    if (room) {
      section.room = room;
      section.className = 'room';
      section.addEventListener('click', roomDidClick, true);
    }
    const avatar = document.createElement('div');
    generateColorFor(avatar);
    section.append(avatar, name);
    return section;
  }

  function addRoomSection(room) {
    nav.appendChild(createSection(room.name, room));
    if (room.owner.id !== user.id) {
      return;
    }
    const chatBox = document.createElement('div');
    chatBox.className = 'chat-box';
    const inputBox = document.createElement('div');
    inputBox.className = 'input-box';
    chatBox.append(room.name);
    chatBoxes.set(room.id, [chatBox, inputBox]);
    showChatBox(room.id);
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
