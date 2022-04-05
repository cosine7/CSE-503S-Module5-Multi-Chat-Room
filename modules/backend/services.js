const users = new Map();
const rooms = new Map();

function getRandomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export default function startService(socket, io) {
  socket.on('newUser', (nickname) => {
    const user = {
      id: socket.id,
      nickname,
      color: getRandomColor(),
    };
    users.set(user.id, user);
    socket.emit('userAdded', user, Array.from(rooms.values()));
  });

  socket.on('createRoom', async (owner, roomName, password) => {
    const room = {
      id: `room${Date.now().toString()}`,
      name: roomName,
      owner,
      color: getRandomColor(),
      block: [],
    };
    if (password) {
      room.isPrivate = true;
      room.password = password;
    }
    await socket.join(room.id);
    rooms.set(room.id, room);
    io.emit('newRoom', room);
  });

  socket.on('roomClicked', (roomId) => {
    const sockets = io.of('/').adapter.rooms.get(roomId);
    const room = rooms.get(roomId);
    let status;
    if (sockets && sockets.has(socket.id)) {
      status = 'isInRoom';
    } else if (room.block.includes(socket.id)) {
      status = 'blocked';
    } else if (room.password) {
      status = 'passwordRequired';
    } else {
      status = 'joinRequired';
    }
    socket.emit('roomClickStatusChecked', status, room);
  });

  socket.on('joinRoom', async (roomId, password) => {
    const room = rooms.get(roomId);
    if (room.password) {
      if (!password || room.password !== password) {
        socket.emit('error', 'Incorrect Password');
        return;
      }
    }
    await socket.join(roomId);
    const members = [];
    io.of('/').adapter.rooms.get(roomId).forEach((memberId) => {
      if (memberId !== room.owner.id) {
        members.push(users.get(memberId));
      }
    });
    socket.emit('roomJoined', members, room);
  });

  socket.on('newMessageTo', (roomId, receiver, message) => {
    if (message.type === 'image') {
      message.data = Buffer.from(message.data).toString('base64');
    }
    if (receiver.startsWith('room')) {
      message.receiver = { nickname: 'everyone' };
    } else {
      message.receiver = users.get(receiver);
      socket.emit('newMessageFrom', roomId, message);
    }
    io.to(receiver).emit('newMessageFrom', roomId, message);
  });

  socket.on('kickOut', async (roomId, member, block) => {
    const memberSocket = (await io.in(member.id).fetchSockets())[0];
    await memberSocket.leave(roomId);
    const room = rooms.get(roomId);
    if (block) {
      room.block.push(member.id);
    }
    io.to(roomId).emit('newMessageFrom', roomId, {
      type: 'announcement',
      data: `${member.nickname} has been ${block ? 'blocked' : 'kicked out'} by room owner`,
    });
    io.to(roomId).emit('removeMember', roomId, member);
    io.to(member.id).emit(
      'beenKickedOutFrom',
      roomId,
      `You have been ${block ? 'blocked' : 'kicked out'} by room ${room.name}'s owner ${room.owner.nickname}`,
    );
  });
}

export function startGlobalService(io) {
  io.of('/').adapter.on('join-room', (roomId, memberId) => {
    if (!roomId.startsWith('room')) {
      return;
    }
    io.to(roomId).emit('newMember', roomId, users.get(memberId));
  });
}
