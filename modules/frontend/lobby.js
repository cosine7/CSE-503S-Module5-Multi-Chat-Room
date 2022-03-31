const user = {};

function closePopover() {
  document.getElementById('popover').remove();
}

function createRoomButtonDidClick(event) {
  event.preventDefault();
  const popover = document.createElement('div');
  popover.id = 'popover';
  const closeBtn = document.createElement('i');
  closeBtn.className = 'iconfont icon-close';
  closeBtn.addEventListener('click', closePopover);
  const roomInput = document.createElement('input');
  roomInput.type = 'text';
  roomInput.id = 'roomName';
  roomInput.required = true;
  const label = document.createElement('label');
  label.for = 'roomName';
  label.textContent = 'Room Name';
  const submitButton = document.createElement('button');
  submitButton.textContent = 'Create Room';
  const form = document.createElement('form');
  form.className = 'form-wrapper';
  form.addEventListener('click', (e) => { e.stopPropagation(); });
  form.append(closeBtn, roomInput, label, submitButton);
  // const content = document.createElement('div');
  // content.className = 'popover-content';
  popover.addEventListener('click', closePopover);
  popover.appendChild(form);
  document.body.appendChild(popover);
}

export default function loadLobby(id, nickname) {
  user.id = id;
  user.nickname = nickname;
  const sidebar = document.createElement('aside');
  const createRoomButton = document.createElement('button');
  createRoomButton.className = 'iconfont icon-plus';
  createRoomButton.addEventListener('click', createRoomButtonDidClick);
  sidebar.append(createRoomButton);
  const nav = document.createElement('nav');
  const main = document.createElement('main');
  const youText = document.createElement('p');
  youText.textContent = 'You';
  const profile = document.createElement('div');
  profile.className = 'profile';
  const avatar = document.createElement('div');
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  avatar.style.backgroundColor = `#${randomColor}`;
  profile.append(avatar, nickname);
  const roomText = document.createElement('p');
  roomText.textContent = 'Room';
  nav.append(youText, profile, roomText);
  document.body.className = 'container';
  document.body.append(sidebar, nav, main);
}
