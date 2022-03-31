let nickname;

export default function loadDashboard(name) {
  nickname = name;
  const sidebar = document.createElement('aside');
  const nav = document.createElement('nav');
  const main = document.createElement('main');
  document.body.append(sidebar, nav, main);
}
