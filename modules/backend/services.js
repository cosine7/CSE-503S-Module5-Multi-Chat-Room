const users = [];
let ids = 0;

export default function startService(socket) {
  socket.on('newUser', (nickname) => {
    const user = {
      id: ids++,
      nickname,
    };
    users.push(user);
    socket.emit('userAdded', user);
  });
}
