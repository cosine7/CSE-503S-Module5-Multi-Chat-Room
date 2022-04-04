export default function loadLobby(user, rooms, socket) {
  const nav = document.createElement('nav');
  const main = document.createElement('main');
  const joinedRooms = new Map();
  let currentActiveRoomSection = null;

  function closePopover() {
    document.getElementById('popover').remove();
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
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      socket.emit('createRoom', user, roomInput.value);
      closePopover();
    });
    popover.addEventListener('click', closePopover);
    popover.appendChild(form);
    document.body.appendChild(popover);
  }

  socket.on('roomJoined', (members, room) => {
    joinedRooms.set(room.id, {
      owner: room.owner,
      name: room.name,
      members,
      messages: [
        {
          sender: user,
          type: 'announcement',
          data: 'You joined the room',
        },
      ],
    });
    createChatBox(room.id);
  });

  socket.on('isInRoom', (isInRoom, room) => {
    if (isInRoom) {
      createChatBox(room.id);
    } else {
      const button = document.createElement('button');
      button.className = 'btn-join';
      button.textContent = `Join Room ${room.name}`;
      button.addEventListener('click', () => socket.emit('joinRoom', room.id));
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
      section.roomId = room.id;
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

  function showMessage(chatBox, message) {
    let item;
    if (message.type === 'announcement') {
      item = document.createElement('p');
      item.className = 'announcement';
      item.textContent = message.data;
    } else if (message.type === 'text') {
      const avatar = document.createElement('div');
      avatar.style.backgroundColor = message.sender.color;
      const text = document.createElement('p');
      text.textContent = message.data;
      item = document.createElement('div');
      item.className = `message-wrapper message-${message.sender.id === user.id ? 'right' : 'left'}`;
      item.append(avatar, text);
    }
    chatBox.appendChild(item);
  }

  function createChatBox(roomId) {
    const chatBox = document.createElement('div');
    chatBox.className = 'chat-box';
    const room = joinedRooms.get(roomId);
    room.messages.forEach((message) => {
      showMessage(chatBox, message);
    });
    const ownerText = document.createElement('p');
    ownerText.textContent = 'Owner';
    const memberText = document.createElement('p');
    memberText.textContent = 'Member';
    const memberList = document.createElement('ul');
    memberList.className = 'member-list';
    memberList.append(ownerText, createMemberRow(room.owner), memberText);
    room.members.forEach((member) => {
      memberList.appendChild(createMemberRow(member));
    });
    const toolbar = document.createElement('div');
    toolbar.className = 'tool-bar';
    toolbar.append('this is a tool bar');
    const textarea = document.createElement('textarea');
    textarea.required = true;
    const button = document.createElement('button');
    button.textContent = 'Send';
    const inputBox = document.createElement('form');
    inputBox.className = 'input-box';
    inputBox.append(toolbar, textarea, button);
    inputBox.addEventListener('submit', (event) => {
      event.preventDefault();
      socket.emit('newMessageTo', roomId, {
        sender: user,
        type: 'text',
        data: textarea.value,
      });
      textarea.value = '';
    });
    main.innerHTML = '';
    main.className = 'grid';
    main.append(chatBox, memberList, inputBox);
  }

  function addRoomSection(room) {
    nav.appendChild(createSection(room.name, room));
  }

  socket.on('newRoom', (room) => {
    addRoomSection(room);
    if (room.owner.id !== user.id) {
      return;
    }
    joinedRooms.set(room.id, {
      owner: room.owner,
      name: room.name,
      members: [],
      messages: [
        {
          sender: user,
          type: 'announcement',
          data: 'You created the room',
        },
      ],
    });
    createChatBox(room.id);
  });

  socket.on('newMember', (roomId, member) => {
    if (member.id === user.id) {
      return;
    }
    const room = joinedRooms.get(roomId);
    room.members.push(member);
    const message = {
      sender: member,
      type: 'announcement',
      data: `${member.nickname} joined the room`,
    };
    room.messages.push(message);
    if (currentActiveRoomSection && currentActiveRoomSection.roomId === roomId) {
      main.children[1].appendChild(createMemberRow(member));
      showMessage(main.firstChild, message);
    }
  });

  socket.on('newMessageFrom', (roomId, message) => {
    const room = joinedRooms.get(roomId);
    room.messages.push(message);
    if (currentActiveRoomSection && currentActiveRoomSection.roomId === roomId) {
      showMessage(main.firstChild, message);
    }
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
