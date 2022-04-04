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

  function toggleMenu(menu) {
    menu.classList.toggle('hidden');
    menu.classList.toggle('visible');
  }

  function createMemberRow(ownerId, roomId, member) {
    const avatar = document.createElement('div');
    avatar.style.backgroundColor = member.color;
    avatar.className = 'avatar';
    const name = document.createElement('p');
    name.textContent = member.nickname;
    const li = document.createElement('li');
    li.append(avatar, name);
    li.memberId = member.id;
    if (ownerId !== user.id || member.id === ownerId) {
      return li;
    }
    const option = document.createElement('i');
    option.className = 'iconfont icon-dots option';
    const menu = document.createElement('div');
    menu.className = 'option-menu hidden';
    const kickOut = document.createElement('button');
    kickOut.textContent = 'Kick Out';
    const block = document.createElement('button');
    block.textContent = 'Block';
    menu.append(kickOut, block);
    option.addEventListener('click', () => toggleMenu(menu));
    kickOut.addEventListener('click', () => {
      toggleMenu(menu);
      if (!window.confirm('Are you sure you want to kick out this member?')) {
        return;
      }
      socket.emit('kickOut', roomId, member);
    });
    block.addEventListener('click', () => {
      toggleMenu(menu);
      socket.emit('block', roomId, member);
    });
    li.append(option, menu);
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
      const content = document.createElement('div');
      content.className = `message-${message.sender.id === user.id ? 'right' : 'left'}`;
      content.append(avatar, text);
      const title = document.createElement('p');
      title.textContent = `From ${message.sender.nickname} to ${message.receiver}`;
      if (message.sender.id === user.id) {
        title.className = 'title-right';
        title.textContent = `From you to ${message.receiver.nickname}`;
      } else if (message.receiver.nickname === 'everyone') {
        title.textContent = `From ${message.sender.nickname} to everyone`;
      } else {
        title.textContent = `From ${message.sender.nickname} to you`;
      }
      item = document.createElement('div');
      item.className = 'message-wrapper';
      item.append(title, content);
    }
    chatBox.appendChild(item);
  }

  function createOption(member) {
    const option = document.createElement('option');
    option.textContent = member.nickname;
    option.value = member.id;
    return option;
  }

  function loadMemberListAndSelection(select, memberList, roomId) {
    select.innerHTML = '';
    memberList.innerHTML = '';
    const room = joinedRooms.get(roomId);
    const ownerText = document.createElement('p');
    ownerText.textContent = 'Owner';
    const memberText = document.createElement('p');
    memberText.textContent = 'Member';
    memberList.className = 'member-list';
    memberList.append(ownerText, createMemberRow(room.owner.id, roomId, room.owner), memberText);
    const everyoneOption = document.createElement('option');
    everyoneOption.textContent = 'Everyone';
    everyoneOption.value = roomId;
    everyoneOption.selected = true;
    select.appendChild(everyoneOption);
    if (room.owner.id !== user.id) {
      select.appendChild(createOption(room.owner));
    }
    room.members.forEach((member) => {
      memberList.appendChild(createMemberRow(room.owner.id, roomId, member));
      if (member.id !== user.id) {
        select.appendChild(createOption(member));
      }
    });
  }

  function createChatBox(roomId) {
    const chatBox = document.createElement('div');
    chatBox.className = 'chat-box';
    const room = joinedRooms.get(roomId);
    room.messages.forEach((message) => {
      showMessage(chatBox, message);
    });
    const memberList = document.createElement('ul');
    const select = document.createElement('select');
    select.id = 'options';
    loadMemberListAndSelection(select, memberList, roomId);
    const toolbar = document.createElement('div');
    toolbar.className = 'tool-bar';
    const label = document.createElement('label');
    label.textContent = 'Send Message To: ';
    label.for = 'options';
    toolbar.append(label, select);
    const textarea = document.createElement('textarea');
    textarea.required = true;
    const button = document.createElement('button');
    button.textContent = 'Send';
    const inputBox = document.createElement('form');
    inputBox.className = 'input-box';
    inputBox.append(toolbar, textarea, button);
    inputBox.addEventListener('submit', (event) => {
      event.preventDefault();
      socket.emit('newMessageTo', roomId, select.value, {
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
      main.children[1].appendChild(createMemberRow(room.owner.id, roomId, member));
      document.getElementById('options').appendChild(createOption(member));
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

  socket.on('removeMember', async (roomId, member) => {
    const room = joinedRooms.get(roomId);
    room.members = await room.members.filter((element) => element.id !== member.id);
    if (currentActiveRoomSection && currentActiveRoomSection.roomId === roomId) {
      loadMemberListAndSelection(
        document.getElementById('options'),
        main.children[1],
        roomId,
      );
    }
  });

  socket.on('beenKickedOutFrom', (roomId) => {
    const room = joinedRooms.get(roomId);
    window.alert(`You have been kicked out from room ${room.name}`);
    if (currentActiveRoomSection && currentActiveRoomSection.roomId === roomId) {
      main.innerHTML = '';
      currentActiveRoomSection.classList.toggle('room-active');
      currentActiveRoomSection = null;
    }
    joinedRooms.delete(roomId);
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
