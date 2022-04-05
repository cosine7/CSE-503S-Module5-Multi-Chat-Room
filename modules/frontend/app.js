import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js';
import loadLobby from './lobby.js';

const socket = io();
const form = document.getElementById('nickname-wrapper');
const nickname = document.getElementById('nickname');

socket.on('userAdded', (user, rooms) => {
  form.remove();
  loadLobby(user, rooms, socket);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  socket.emit('newUser', nickname.value);
});
