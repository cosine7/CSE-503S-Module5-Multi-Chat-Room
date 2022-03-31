// eslint-disable-next-line import/no-unresolved
import { io } from 'https://cdn.socket.io/4.3.2/socket.io.esm.min.js';
import loadDashboard from './dashboard.js';

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

  socket.on('userAdded', () => {
    form.remove();
    loadDashboard(nickname.value);
  });
});
