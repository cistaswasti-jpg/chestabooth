const WIDTH = 1176, HEIGHT = 1470;

// Koordinat kedua kotak di dalam photostrip-straight.png
const SLOT_1 = { x: 106, y: 168, w: 938, h: 591 };
const SLOT_2 = { x: 106, y: 766, w: 938, h: 573 };

const elements = {
  video: document.getElementById('liveVideo'),
  canvas: document.getElementById('finalCanvas'),
  ctx: document.getElementById('finalCanvas').getContext('2d'),
  frameCanvas: document.getElementById('frameOverlayCanvas'),
  frameCtx: document.getElementById('frameOverlayCanvas').getContext('2d'),
  takePhotoBtn: document.getElementById('takePhoto'),
  retakeBtn: document.getElementById('retakeBtn'),
  doneBtn: document.getElementById('doneBtn'),
  countdownEl: document.querySelector('.countdown-timer')
};

let photoStage = 0; // 0 = Atas, 1 = Bawah, 2 = Selesai

// Memuat photostrip-straight.png dan membuat area putih di dalam kotak menjadi transparan
// sehingga pasir cokelat di bagian bawah kotak tetap muncul di depan foto
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
          // Hanya bagian putih polos yang dibuat transparan; pasir cokelat & gelembung tetap utuh
          if (data[i] > 242 && data[i + 1] > 242 && data[i + 2] > 242) {
            data[i + 3] = 0;
          }
        }
        frameCtx.putImageData(imgData, sx, sy);
      };

      clearWhiteInSlot(SLOT_1);
      clearWhiteInSlot(SLOT_2);
    } catch (e) {
      // Fallback jika dibuka langsung lewat file:///
    }
  };
};

// Memindahkan live video ke kotak aktif
const moveVideoToSlot = stage => {
  const { video } = elements;
  video.style.display = 'block';
  video.style.left = '9.01%';
  video.style.width = '79.76%';

  if (stage === 0) {
    video.style.top = '11.43%';
    video.style.height = '40.20%';
  } else if (stage === 1) {
    video.style.top = '52.11%';
    video.style.height = '38.98%';
  }
};

// Hitung mundur 3-2-1
const startCountdown = callback => {
  let count = 3;
  const { countdownEl } = elements;
  countdownEl.textContent = count;
  countdownEl.style.display = 'flex';
  const intervalId = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
    } else {
      clearInterval(intervalId);
      countdownEl.style.display = 'none';
      callback();
    }
  }, 1000);
};

// Mengambil foto ke kanvas (berada di belakang layer bingkai & pasir cokelat)
const capturePhoto = () => {
  const { video, ctx, takePhotoBtn } = elements;
  const slot = photoStage === 0 ? SLOT_1 : SLOT_2;

  const vW = video.videoWidth || 640;
  const vH = video.videoHeight || 480;
  const targetAspect = slot.w / slot.h;
  const vAspect = vW / vH;
  let sx, sy, sw, sh;

  if (vAspect > targetAspect) {
    sh = vH;
    sw = vH * targetAspect;
    sx = (vW - sw) / 2;
    sy = 0;
  } else {
    sw = vW;
    sh = vW / targetAspect;
    sx = 0;
    sy = (vH - sh) / 2;
  }

  ctx.save();
  ctx.translate(slot.x + slot.w, slot.y);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, slot.w, slot.h);
  ctx.restore();

  photoStage++;
  if (photoStage === 1) {
    moveVideoToSlot(1);
    takePhotoBtn.disabled = false;
  } else if (photoStage === 2) {
    finalizePhotoStrip();
  }
};

// Selesai 2 foto -> tampilkan tombol Retake & Done
const finalizePhotoStrip = () => {
  const { video, takePhotoBtn, retakeBtn, doneBtn } = elements;
  video.style.display = 'none';

  takePhotoBtn.style.display = 'none';
  retakeBtn.style.display = 'flex';
  doneBtn.style.display = 'flex';
};

// Ulangi foto (Retake)
const resetPhotoBooth = () => {
  const { ctx, takePhotoBtn, retakeBtn, doneBtn } = elements;
  photoStage = 0;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  moveVideoToSlot(0);

  takePhotoBtn.disabled = false;
  takePhotoBtn.style.display = 'flex';
  retakeBtn.style.display = 'none';
  doneBtn.style.display = 'none';
};

// Inisialisasi kamera
const setupCamera = () => {
  renderFrameOverlay();
  navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 2560 }, height: { ideal: 1440 }, facingMode: 'user' },
    audio: false
  })
  .then(stream => {
    elements.video.srcObject = stream;
    elements.video.play();
    moveVideoToSlot(0);
  })
  .catch(err => alert('Kamera gagal diakses: ' + err));
};

// Event Listeners
const setupEventListeners = () => {
  const { takePhotoBtn, retakeBtn, doneBtn, canvas } = elements;

  takePhotoBtn.addEventListener('click', () => {
    if (photoStage > 1) return;
    takePhotoBtn.disabled = true;
    startCountdown(capturePhoto);
  });

  retakeBtn.addEventListener('click', resetPhotoBooth);

  doneBtn.addEventListener('click', () => {
    localStorage.setItem('photoLayer', canvas.toDataURL('image/png'));
    window.location.href = 'final.html';
  });
};

setupCamera();
setupEventListeners();

document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.logo');
  if (logo) logo.addEventListener('click', () => window.location.href = 'index.html');
});