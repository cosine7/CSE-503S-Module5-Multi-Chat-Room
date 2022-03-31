const users = [];

export default function startService(socket) {
  socket.on('newUser', (nickname) => {
    users.push({
      id: users.length,
      nickname,
    });
    socket.emit('userAdded');
  });
}
