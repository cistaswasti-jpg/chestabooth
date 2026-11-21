window.addEventListener('DOMContentLoaded', () => localStorage.removeItem('photoLayer'));

const WIDTH = 1176, HEIGHT = 1470;
const SLOT_1 = { x: 106, y: 168, w: 938, h: 591 };
const SLOT_2 = { x: 106, y: 766, w: 938, h: 573 };

const elements = {
  canvas: document.getElementById('finalCanvas'),
  ctx: document.getElementById('finalCanvas').getContext('2d'),
  frameCtx: document.getElementById('frameOverlayCanvas').getContext('2d'),
  uploadInput: document.getElementById('uploadPhotoInput'),
  uploadBtn: document.getElementById('uploadPhoto'),
  retakeBtn: document.getElementById('retakeBtn'),
  readyBtn: document.getElementById('readyButton')
};

let photoStage = 0;

const renderFrameOverlay = () => {
  const img = new Image();
  img.src = 'Images/photostrip-straight.png';
  img.onload = () => {
    const { frameCtx } = elements;
    frameCtx.clearRect(0, 0, WIDTH, HEIGHT);
    frameCtx.drawImage(img, 0, 0, WIDTH, HEIGHT);

    try {
      const clearWhiteInSlot = slot => {
        const pad = 6;
        const sx = slot.x + pad;
        const sy = slot.y + pad;
        const sw = slot.w - pad * 2;
        const sh = slot.h - pad * 2;
        const imgData = frameCtx.getImageData(sx, sy, sw, sh);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 242 && data[i + 1] > 242 && data[i + 2] > 242) {
            data[i + 3] = 0;
          }
        }
        frameCtx.putImageData(imgData, sx, sy);
      };

      clearWhiteInSlot(SLOT_1);
      clearWhiteInSlot(SLOT_2);
    } catch (e) {}
  };
};

const drawPhoto = img => {
  const { ctx, uploadBtn, retakeBtn, readyBtn } = elements;
  const slot = photoStage === 0 ? SLOT_1 : SLOT_2;
  const imgAspect = img.width / img.height;
  const targetAspect = slot.w / slot.h;
  let sx, sy, sw, sh;

  if (imgAspect > targetAspect) {
    sh = img.height;
    sw = img.height * targetAspect;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = img.width / targetAspect;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, slot.x, slot.y, slot.w, slot.h);

  photoStage++;
  if (photoStage === 1) {
    uploadBtn.textContent = 'Upload Photo (2/2)';
  } else if (photoStage === 2) {
    uploadBtn.style.display = 'none';
    retakeBtn.style.display = 'flex';
    readyBtn.style.display = 'flex';
    readyBtn.disabled = false;
  }
};

elements.retakeBtn.addEventListener('click', () => {
  photoStage = 0;
  elements.ctx.clearRect(0, 0, WIDTH, HEIGHT);
  elements.uploadBtn.textContent = 'Upload Photo (1/2)';
  elements.uploadBtn.style.display = 'flex';
  elements.retakeBtn.style.display = 'none';
  elements.readyBtn.style.display = 'none';
  elements.readyBtn.disabled = true;
});

elements.readyBtn.addEventListener('click', () => {
  localStorage.setItem('photoLayer', elements.canvas.toDataURL('image/png'));
  window.location.href = 'final.html';
});

elements.uploadBtn.addEventListener('click', () => elements.uploadInput.click());

elements.uploadInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => drawPhoto(img);
  img.src = URL.createObjectURL(file);
  elements.uploadInput.value = '';
});

document.addEventListener('DOMContentLoaded', () => {
  renderFrameOverlay();
  const logo = document.querySelector('.logo');
  if (logo) logo.addEventListener('click', () => window.location.href = 'index.html');
});