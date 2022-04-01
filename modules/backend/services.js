export default function startService(socket) {
  const users = [];
  const rooms = [];

  socket.on('newUser', (nickname) => {
    const user = {
      id: socket.id,
      nickname,
    };
    users.push(user);
    socket.emit('userAdded', user);
  });

  socket.on('createRoom', (owner, roomName) => {
    const room = {
      id: Date.now().toString(),
      name: roomName,
      owner,
    };
    rooms.push(room);
    this.emit('newRoom', room);
  });
}
