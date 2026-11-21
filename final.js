const WIDTH = 1176, HEIGHT = 1470;
const SLOT_1 = { x: 106, y: 168, w: 938, h: 591 };
const SLOT_2 = { x: 106, y: 766, w: 938, h: 573 };

const canvas = document.getElementById('finalCanvas'),
      ctx = canvas.getContext('2d'),
      addFishBtn = document.getElementById('addFish'),
      addOctopusBtn = document.getElementById('addOctopus'),
      addSeaweedBtn = document.getElementById('addSeaweed'),
      addAxBtn = document.getElementById('addAx'),
      addBubbleBtn = document.getElementById('addBubble'),
      downloadBtn = document.getElementById('downloadBtn'),
      homeBtn = document.getElementById('homeBtn'),
      resetBtn = document.getElementById('reset');

let stickers = [], dragOffset = { x: 0, y: 0 }, selectedSticker = null;

// Offscreen canvas untuk bingkai yang tengah kotaknya transparan
const processedFrameCanvas = document.createElement('canvas');
processedFrameCanvas.width = WIDTH;
processedFrameCanvas.height = HEIGHT;
const pCtx = processedFrameCanvas.getContext('2d');
let isFrameReady = false;

const frameImg = new Image();
const photoLayerImg = new Image();
const savedPhotoLayer = localStorage.getItem('photoLayer');

frameImg.onload = () => {
  pCtx.clearRect(0, 0, WIDTH, HEIGHT);
  pCtx.drawImage(frameImg, 0, 0, WIDTH, HEIGHT);

  try {
    const clearWhiteInSlot = slot => {
      const pad = 6;
      const sx = slot.x + pad;
      const sy = slot.y + pad;
      const sw = slot.w - pad * 2;
      const sh = slot.h - pad * 2;
      const imgData = pCtx.getImageData(sx, sy, sw, sh);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 242 && data[i + 1] > 242 && data[i + 2] > 242) {
          data[i + 3] = 0;
        }
      }
      pCtx.putImageData(imgData, sx, sy);
    };

    clearWhiteInSlot(SLOT_1);
    clearWhiteInSlot(SLOT_2);
  } catch (e) {}

  isFrameReady = true;
  drawCanvas();
};

photoLayerImg.onload = drawCanvas;

frameImg.src = 'Images/photostrip-straight.png';
if (savedPhotoLayer) {
  photoLayerImg.src = savedPhotoLayer;
} else {
  alert('Foto belum ditemukan! Silakan ambil atau unggah foto terlebih dahulu.');
}

// Urutan gambar: Background Putih -> Foto -> Bingkai & Pasir Cokelat -> Stiker
function drawCanvas() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (photoLayerImg.complete && photoLayerImg.naturalWidth > 0) {
    ctx.drawImage(photoLayerImg, 0, 0, WIDTH, HEIGHT);
  }
  if (isFrameReady) {
    ctx.drawImage(processedFrameCanvas, 0, 0, WIDTH, HEIGHT);
  }

  stickers.forEach(s => ctx.drawImage(s.img, s.x, s.y, s.width, s.height));
}

function addSticker(src, maxSize = null) {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    let w = img.width / 2.2;
    let h = img.height / 2.2;

    if (maxSize) {
      const ratio = maxSize / Math.max(img.width, img.height);
      w = img.width * ratio;
      h = img.height * ratio;
    }

    stickers.push({
      img,
      x: WIDTH / 2 - w / 2,
      y: HEIGHT / 2 - h / 2,
      width: w,
      height: h,
      dragging: false
    });
    drawCanvas();
  };
}

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect(),
        scaleX = canvas.width / rect.width,
        scaleY = canvas.height / rect.height;
  const clientX = e.touches?.[0]?.clientX ?? e.clientX,
        clientY = e.touches?.[0]?.clientY ?? e.clientY;
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

function pointerDown(e) {
  const { x: mouseX, y: mouseY } = getPointerPos(e);
  for (let i = stickers.length - 1; i >= 0; i--) {
    const s = stickers[i];
    if (mouseX >= s.x && mouseX <= s.x + s.width && mouseY >= s.y && mouseY <= s.y + s.height) {
      selectedSticker = s;
      s.dragging = true;
      dragOffset.x = mouseX - s.x;
      dragOffset.y = mouseY - s.y;
      stickers.splice(i, 1);
      stickers.push(s);
      drawCanvas();
      e.preventDefault();
      break;
    }
  }
}

function pointerMove(e) {
  if (!selectedSticker?.dragging) return;
  const { x: mouseX, y: mouseY } = getPointerPos(e);
  selectedSticker.x = mouseX - dragOffset.x;
  selectedSticker.y = mouseY - dragOffset.y;
  drawCanvas();
  e.preventDefault();
}

function pointerUp() {
  if (selectedSticker) selectedSticker.dragging = false;
  selectedSticker = null;
}

canvas.addEventListener('mousedown', pointerDown);
canvas.addEventListener('mousemove', pointerMove);
canvas.addEventListener('mouseup', pointerUp);
canvas.addEventListener('mouseleave', pointerUp);
canvas.addEventListener('touchstart', pointerDown, { passive: false });
canvas.addEventListener('touchmove', pointerMove, { passive: false });
canvas.addEventListener('touchend', pointerUp);
canvas.addEventListener('touchcancel', pointerUp);

addFishBtn.addEventListener('click', () => addSticker('Images/fish.png'));
addOctopusBtn.addEventListener('click', () => addSticker('Images/octopus.png'));

const seaweedImages = ['Images/seaweed1.png', 'Images/seaweed2.png'],
      bubbleImages = ['Images/bubble12.png', 'Images/bubble22.png', 'Images/bubble3.png'];
let seaweedIndex = 0, bubbleIndex = 0;

addSeaweedBtn.addEventListener('click', () => {
  addSticker(seaweedImages[seaweedIndex]);
  seaweedIndex = (seaweedIndex + 1) % seaweedImages.length;
});
addAxBtn.addEventListener('click', () => addSticker('Images/axolotl.png', 125));
addBubbleBtn.addEventListener('click', () => {
  addSticker(bubbleImages[bubbleIndex]);
  bubbleIndex = (bubbleIndex + 1) % bubbleImages.length;
});

resetBtn.addEventListener('click', () => {
  stickers = [];
  drawCanvas();
});

downloadBtn.addEventListener('click', () => {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'chestabooth-photostrip.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    alert('Jalankan proyek lewat Live Server di VS Code agar tombol Download berfungsi.');
  }
});

homeBtn.addEventListener('click', () => window.location.href = 'index.html');
document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.logo');
  if (logo) logo.addEventListener('click', () => window.location.href = 'index.html');
});