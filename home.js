// DOM References
const selectButton = document.getElementById('select-button');
const cameraBtn = document.getElementById('menu-camera-button');
const uploadBtn = document.getElementById('menu-upload-button');
const logoEl = document.querySelector('.logo');

// Fungsi navigasi halaman
function addSafeNavigation(button, url) {
  if (!button) return;
  button.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = url;
  });
}

// Navigasi aktif
addSafeNavigation(selectButton, 'menu.html');
addSafeNavigation(cameraBtn, 'camera.html');
addSafeNavigation(uploadBtn, 'uploud.html');
addSafeNavigation(logoEl, 'index.html');