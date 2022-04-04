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

  socket.on('createRoom', (owner, roomName) => {
    const room = {
      id: `room${Date.now().toString()}`,
      name: roomName,
      owner,
      color: getRandomColor(),
    };
    socket.join(room.id);
    rooms.set(room.id, room);
    io.emit('newRoom', room);
  });

  socket.on('roomClicked', (roomId) => {
    const sockets = io.of('/').adapter.rooms.get(roomId);
    socket.emit('isInRoom', sockets && sockets.has(socket.id), rooms.get(roomId));
  });

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    const members = [];
    const room = rooms.get(roomId);
    io.of('/').adapter.rooms.get(roomId).forEach((memberId) => {
      if (memberId !== room.owner.id) {
        members.push(users.get(memberId));
      }
    });
    socket.emit('roomJoined', members, room);
  });

  socket.on('newMessageTo', (roomId, receiver, message) => {
    if (receiver.startsWith('room')) {
      message.receiver = { nickname: 'everyone' };
    } else {
      message.receiver = users.get(receiver);
      socket.emit('newMessageFrom', roomId, message);
    }
    io.to(receiver).emit('newMessageFrom', roomId, message);
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
