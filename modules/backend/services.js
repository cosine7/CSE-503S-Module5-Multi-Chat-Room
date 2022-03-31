const users = [];
const rooms = [];
let userIds = 0;
let roomIds = 0;

export default function startService(socket) {
  socket.on('newUser', (nickname) => {
    const user = {
      id: userIds++,
      nickname,
    };
    users.push(user);
    socket.emit('userAdded', user);
  });

  socket.on('createRoom', (owner, roomName) => {
    const room = {
      id: roomIds++,
      name: roomName,
      owner,
    };
    rooms.push(room);
    this.emit('newRoom', room);
  });
}
