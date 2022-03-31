const user = {};

export default function loadLobby(id, nickname) {
  user.id = id;
  user.nickname = nickname;
  const sidebar = document.createElement('aside');
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
