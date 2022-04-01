const users = [];
const rooms = [];

export default function startService(socket, io) {
  socket.on('newUser', (nickname) => {
    const user = {
      id: socket.id,
      nickname,
    };
    users.push(user);
    socket.emit('userAdded', user, rooms);
  });

  socket.on('createRoom', (owner, roomName) => {
    const room = {
      id: `room${Date.now().toString()}`,
      name: roomName,
      owner,
    };
    socket.join(room.id);
    rooms.push(room);
    io.emit('newRoom', room);
  });

  // io.of('/').adapter.on('create-room', (room) => {
  //   if (!room.startsWith('room')) {
  //     return;
  //   }
  //   console.log(`room created${room}`);
  // });
}
