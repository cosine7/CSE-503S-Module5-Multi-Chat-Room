import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js';
import loadLobby from './lobby.js';

const socket = io();
const form = document.getElementById('nickname-wrapper');
const nickname = document.getElementById('nickname');
let isEmitting = false;

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (isEmitting) {
    return;
  }
  isEmitting = true;
  socket.emit('newUser', nickname.value);

  socket.on('userAdded', (user, rooms) => {
    form.remove();
    loadLobby(user, rooms, socket);
  });
});
