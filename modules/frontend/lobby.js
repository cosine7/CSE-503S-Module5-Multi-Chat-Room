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
    roomInput.id = 'roomName';
    const label = document.createElement('label');
    label.htmlFor = 'roomName';
    label.textContent = 'Room Name';
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Create Room';
    const select = document.createElement('select');
    select.id = 'room-options';
    const optionLabel = document.createElement('label');
    optionLabel.htmlFor = 'room-options';
    optionLabel.textContent = 'Option:';
    const publicOption = document.createElement('option');
    publicOption.value = 'public';
    publicOption.textContent = 'Everyone Can Join';
    publicOption.selected = true;
    const privateOption = document.createElement('option');
    privateOption.value = 'private';
    privateOption.textContent = 'Password Required';
    select.append(publicOption, privateOption);
    const selectWrapper = document.createElement('div');
    selectWrapper.append(optionLabel, select);
    selectWrapper.className = 'select-wrapper';
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'create-room-content-wrapper';
    contentWrapper.append(roomInput, label, selectWrapper);
    const password = document.createElement('input');
    password.type = 'password';
    password.required = true;
    password.id = 'roomPassword';
    const passwordLabel = document.createElement('label');
    passwordLabel.htmlFor = 'roomPassword';
    passwordLabel.textContent = 'Password';
    select.addEventListener('change', () => {
      if (select.value === 'public') {
        password.value = '';
        password.remove();
        passwordLabel.remove();
      } else {
        contentWrapper.append(password, passwordLabel);
      }
    });
    const form = document.createElement('form');
    form.className = 'form-wrapper create-room-form';
    form.append(closeBtn, contentWrapper, submitButton);
    form.addEventListener('click', (e) => { e.stopPropagation(); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      socket.emit('createRoom', user, roomInput.value, password.value);
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

  function createJoinRoomButton(room) {
    main.innerHTML = '';
    main.className = 'flex-center';
    const button = document.createElement('button');
    button.className = 'btn-join';
    button.textContent = `Join Room ${room.name}`;
    return button;
  }

  socket.on('roomClickStatusChecked', (status, room) => {
    if (status === 'isInRoom') {
      createChatBox(room.id);
    } else if (status === 'joinRequired') {
      const button = createJoinRoomButton(room);
      button.addEventListener('click', () => socket.emit('joinRoom', room.id));
      main.appendChild(button);
    } else if (status === 'blocked') {
      main.innerHTML = '';
      main.className = 'flex-center';
      main.append('You are blocked by this room\'s owner');
    } else {
      const input = document.createElement('input');
      input.placeholder = 'Password';
      input.type = 'password';
      input.required = true;
      const button = createJoinRoomButton(room);
      const form = document.createElement('form');
      form.append(input, button);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        socket.emit('joinRoom', room.id, input.value);
      });
      main.append(form);
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
      if (!window.confirm('Are you sure you want to block this member?')) {
        return;
      }
      socket.emit('kickOut', roomId, member, true);
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
      chatBox.appendChild(item);
      return;
    }
    const avatar = document.createElement('div');
    avatar.style.backgroundColor = message.sender.color;
    const content = document.createElement('div');
    content.className = `message-${message.sender.id === user.id ? 'right' : 'left'}`;
    content.appendChild(avatar);
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
    if (message.type === 'text') {
      const text = document.createElement('p');
      text.textContent = message.data;
      content.appendChild(text);
    } else if (message.type === 'image') {
      const image = new Image();
      image.src = `data:image/*;base64,${message.data}`;
      content.appendChild(image);
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
    label.htmlFor = 'options';
    const imageLabel = document.createElement('label');
    imageLabel.textContent = 'Image: ';
    imageLabel.htmlFor = 'image-input';
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.id = 'image-input';
    const sendImageButton = document.createElement('button');
    sendImageButton.textContent = 'Send Image';
    sendImageButton.type = 'button';
    sendImageButton.className = 'btn-send-image';
    sendImageButton.addEventListener('click', () => {
      if (imageInput.files.length === 0) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        socket.emit('newMessageTo', roomId, select.value, {
          sender: user,
          type: 'image',
          data: event.target.result,
        });
      };
      reader.readAsArrayBuffer(imageInput.files[0]);
      imageInput.value = '';
    });
    const leaveRoomButton = document.createElement('button');
    leaveRoomButton.textContent = 'Leave Room';
    leaveRoomButton.className = 'btn-leave-room';
    leaveRoomButton.type = 'button';
    leaveRoomButton.addEventListener('click', () => {
      socket.emit('leaveRoom', roomId, user);
    });
    toolbar.append(label, select, imageLabel, imageInput, sendImageButton, leaveRoomButton);
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

  socket.on('error', (error) => window.alert(error));

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

  function leaveRoom(roomId) {
    if (currentActiveRoomSection && currentActiveRoomSection.roomId === roomId) {
      main.innerHTML = '';
      currentActiveRoomSection.classList.toggle('room-active');
      currentActiveRoomSection = null;
    }
    joinedRooms.delete(roomId);
  }

  socket.on('didLeaveRoom', leaveRoom);

  socket.on('beenKickedOutFrom', (roomId, message) => {
    window.alert(message);
    leaveRoom(roomId);
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
