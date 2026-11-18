// Generator for Chrome Web Store Screenshot (1280x800) and Promo Tile (440x280)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, pixelData) {
  const scanlines = [];
  for (let y = 0; y < height; y++) {
    scanlines.push(0); // Filter type 0
    const rowStart = y * width * 4;
    for (let x = 0; x < width * 4; x++) {
      scanlines.push(pixelData[rowStart + x]);
    }
  }

  const compressedData = zlib.deflateSync(Buffer.from(scanlines), { level: 6 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.slice(4, 8 + len));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) | 0;
  }

  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressedData),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

function renderGraphic(width, height, isPromoTile) {
  const buf = Buffer.alloc(width * height * 4);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    const existingA = buf[idx + 3] / 255;
    const newA = a / 255;
    const outA = newA + existingA * (1 - newA);
    if (outA > 0) {
      buf[idx] = Math.round((r * newA + buf[idx] * existingA * (1 - newA)) / outA);
      buf[idx + 1] = Math.round((g * newA + buf[idx + 1] * existingA * (1 - newA)) / outA);
      buf[idx + 2] = Math.round((b * newA + buf[idx + 2] * existingA * (1 - newA)) / outA);
      buf[idx + 3] = Math.round(outA * 255);
    }
  }

  function fillRect(x0, y0, w, h, r, g, b, a = 255) {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(height, Math.ceil(y0 + h)); y++) {
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(width, Math.ceil(x0 + w)); x++) {
        setPixel(x, y, r, g, b, a);
      }
    }
  }

  function fillRoundedRect(x0, y0, w, h, radius, r, g, b, a = 255) {
    const x1 = x0 + w;
    const y1 = y0 + h;
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(height, Math.ceil(y1)); y++) {
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(width, Math.ceil(x1)); x++) {
        const left = x0 + radius;
        const right = x1 - radius;
        const top = y0 + radius;
        const bottom = y1 - radius;

        let dist = 0;
        if (x < left && y < top) dist = Math.hypot(x - left, y - top);
        else if (x > right && y < top) dist = Math.hypot(x - right, y - top);
        else if (x < left && y > bottom) dist = Math.hypot(x - left, y - bottom);
        else if (x > right && y > bottom) dist = Math.hypot(x - right, y - bottom);
        else dist = 0;

        if (dist <= radius) {
          const alphaFactor = dist > radius - 1 ? Math.max(0, Math.min(1, radius - dist)) : 1;
          setPixel(x, y, r, g, b, Math.round(a * alphaFactor));
        }
      }
    }
  }

  // Draw background gradient (slate 950 to indigo 950)
  for (let y = 0; y < height; y++) {
    const t = y / height;
    const r = Math.round(11 + (15 - 11) * t);
    const g = Math.round(15 + (23 - 15) * t);
    const b = Math.round(25 + (42 - 25) * t);
    fillRect(0, y, width, 1, r, g, b, 255);
  }

  // Draw top glowing accent line
  for (let x = 0; x < width; x++) {
    const t = Math.sin((x / width) * Math.PI);
    const a = Math.round(t * 220);
    fillRect(x, 0, 1, 3, 37, 99, 235, a);
  }

  if (isPromoTile) {
    // 440 x 280 Promo Tile layout
    // Center Card
    const cardW = 380;
    const cardH = 220;
    const cardX = (width - cardW) / 2;
    const cardY = (height - cardH) / 2;
    fillRoundedRect(cardX, cardY, cardW, cardH, 16, 30, 41, 59, 240); // Slate 800
    fillRoundedRect(cardX, cardY, cardW, 4, 2, 59, 130, 246, 255); // Top blue border

    // Icon representation
    const iconSize = 48;
    fillRoundedRect(cardX + 24, cardY + 28, iconSize, iconSize, 12, 37, 99, 235, 255);
    fillRoundedRect(cardX + 34, cardY + 38, iconSize - 20, iconSize - 20, 4, 255, 255, 255, 255);

    // MultiClip Title text representation bars
    fillRoundedRect(cardX + 86, cardY + 34, 140, 16, 4, 248, 250, 252, 255);
    fillRoundedRect(cardX + 86, cardY + 56, 220, 10, 3, 148, 163, 184, 255);

    // Three stacked multi-copy cards
    const stepW = (cardW - 48 - 16) / 3;
    const stepH = 90;
    const stepY = cardY + 95;

    // Card 1
    fillRoundedRect(cardX + 24, stepY, stepW, stepH, 8, 15, 23, 42, 220);
    fillRoundedRect(cardX + 34, stepY + 16, 40, 8, 3, 59, 130, 246, 255);
    fillRoundedRect(cardX + 34, stepY + 32, stepW - 20, 6, 2, 100, 116, 139, 255);
    fillRoundedRect(cardX + 34, stepY + 44, stepW - 30, 6, 2, 100, 116, 139, 255);

    // Card 2
    fillRoundedRect(cardX + 24 + stepW + 8, stepY, stepW, stepH, 8, 15, 23, 42, 220);
    fillRoundedRect(cardX + 24 + stepW + 18, stepY + 16, 40, 8, 3, 16, 185, 129, 255);
    fillRoundedRect(cardX + 24 + stepW + 18, stepY + 32, stepW - 20, 6, 2, 100, 116, 139, 255);
    fillRoundedRect(cardX + 24 + stepW + 18, stepY + 44, stepW - 30, 6, 2, 100, 116, 139, 255);

    // Card 3 (Result)
    fillRoundedRect(cardX + 24 + (stepW + 8) * 2, stepY, stepW, stepH, 8, 37, 99, 235, 180);
    fillRoundedRect(cardX + 24 + (stepW + 8) * 2 + 10, stepY + 16, 50, 8, 3, 255, 255, 255, 255);
    fillRoundedRect(cardX + 24 + (stepW + 8) * 2 + 10, stepY + 32, stepW - 20, 6, 2, 224, 231, 255, 255);
    fillRoundedRect(cardX + 24 + (stepW + 8) * 2 + 10, stepY + 44, stepW - 24, 6, 2, 224, 231, 255, 255);
    fillRoundedRect(cardX + 24 + (stepW + 8) * 2 + 10, stepY + 56, stepW - 32, 6, 2, 224, 231, 255, 255);

  } else {
    // 1280 x 800 Full Store Screenshot
    // Header Bar
    const headerY = 50;
    fillRoundedRect(120, headerY, 64, 64, 16, 37, 99, 235, 255);
    fillRoundedRect(136, headerY + 16, 32, 32, 6, 255, 255, 255, 255);

    // Main Title & Subtitle bars
    fillRoundedRect(205, headerY + 10, 240, 24, 6, 248, 250, 252, 255);
    fillRoundedRect(205, headerY + 42, 420, 14, 4, 148, 163, 184, 255);

    // Feature Badges
    fillRoundedRect(120, 145, 180, 32, 16, 30, 41, 59, 240);
    fillRoundedRect(135, 156, 150, 10, 4, 59, 130, 246, 255);

    fillRoundedRect(315, 145, 210, 32, 16, 30, 41, 59, 240);
    fillRoundedRect(330, 156, 180, 10, 4, 16, 185, 129, 255);

    fillRoundedRect(540, 145, 170, 32, 16, 30, 41, 59, 240);
    fillRoundedRect(555, 156, 140, 10, 4, 168, 85, 247, 255);

    // Center Stage: Left Side Mockup of Extension Popup UI
    const popupW = 380;
    const popupH = 520;
    const popupX = 120;
    const popupY = 210;

    // Outer popup container
    fillRoundedRect(popupX, popupY, popupW, popupH, 16, 15, 23, 42, 255); // Slate 900
    fillRoundedRect(popupX, popupY, popupW, popupH, 16, 51, 65, 85, 100); // Border

    // Popup Header
    fillRoundedRect(popupX + 20, popupY + 20, 28, 28, 6, 37, 99, 235, 255);
    fillRoundedRect(popupX + 58, popupY + 26, 90, 14, 4, 248, 250, 252, 255);

    // Master Toggle Card
    fillRoundedRect(popupX + 20, popupY + 65, popupW - 40, 52, 10, 30, 41, 59, 255);
    fillRoundedRect(popupX + 36, popupY + 84, 12, 12, 6, 16, 185, 129, 255); // Green dot
    fillRoundedRect(popupX + 58, popupY + 83, 110, 14, 3, 248, 250, 252, 255);
    fillRoundedRect(popupX + popupW - 84, popupY + 77, 44, 24, 12, 37, 99, 235, 255); // Switch

    // Delimiter Buttons (3 segmented)
    const btnW = (popupW - 40 - 12) / 3;
    fillRoundedRect(popupX + 20, popupY + 130, btnW, 40, 6, 37, 99, 235, 240); // Active button
    fillRoundedRect(popupX + 20 + btnW + 6, popupY + 130, btnW, 40, 6, 30, 41, 59, 255);
    fillRoundedRect(popupX + 20 + (btnW + 6) * 2, popupY + 130, btnW, 40, 6, 30, 41, 59, 255);

    // Clip items list
    for (let i = 0; i < 3; i++) {
      const itemY = popupY + 185 + i * 85;
      fillRoundedRect(popupX + 20, itemY, popupW - 40, 75, 8, 30, 41, 59, 255);
      fillRoundedRect(popupX + 32, itemY + 12, 26, 18, 4, 37, 99, 235, 220); // Badge #
      fillRoundedRect(popupX + 66, itemY + 14, popupW - 140, 10, 2, 248, 250, 252, 255);
      fillRoundedRect(popupX + 32, itemY + 40, popupW - 70, 8, 2, 148, 163, 184, 255);
      fillRoundedRect(popupX + 32, itemY + 54, popupW - 120, 8, 2, 148, 163, 184, 255);
    }

    // Right Side: Workflow Explanation Illustration
    const rightX = 540;
    const rightY = 210;
    const rightW = 620;
    const rightH = 520;

    fillRoundedRect(rightX, rightY, rightW, rightH, 16, 15, 23, 42, 180);

    // Step 1 Card: Tab A
    fillRoundedRect(rightX + 35, rightY + 35, rightW - 70, 105, 10, 30, 41, 59, 240);
    fillRoundedRect(rightX + 55, rightY + 50, 70, 20, 4, 59, 130, 246, 255); // Step 1 tag
    fillRoundedRect(rightX + 135, rightY + 55, 240, 12, 3, 248, 250, 252, 255);
    fillRoundedRect(rightX + 55, rightY + 85, rightW - 110, 10, 2, 148, 163, 184, 255);
    fillRoundedRect(rightX + 55, rightY + 102, rightW - 200, 10, 2, 148, 163, 184, 255);

    // Step 2 Card: Tab B
    fillRoundedRect(rightX + 35, rightY + 160, rightW - 70, 105, 10, 30, 41, 59, 240);
    fillRoundedRect(rightX + 55, rightY + 175, 70, 20, 4, 16, 185, 129, 255); // Step 2 tag
    fillRoundedRect(rightX + 135, rightY + 180, 260, 12, 3, 248, 250, 252, 255);
    fillRoundedRect(rightX + 55, rightY + 210, rightW - 110, 10, 2, 148, 163, 184, 255);
    fillRoundedRect(rightX + 55, rightY + 227, rightW - 170, 10, 2, 148, 163, 184, 255);

    // Step 3 Card: Combined Output Paste Result
    fillRoundedRect(rightX + 35, rightY + 285, rightW - 70, 195, 10, 23, 37, 84, 240);
    fillRoundedRect(rightX + 55, rightY + 305, 80, 22, 4, 37, 99, 235, 255); // Step 3 tag
    fillRoundedRect(rightX + 145, rightY + 310, 290, 14, 4, 255, 255, 255, 255);

    // Output formatted block
    fillRoundedRect(rightX + 55, rightY + 345, rightW - 110, 110, 6, 15, 23, 42, 255);
    fillRoundedRect(rightX + 70, rightY + 360, rightW - 140, 10, 2, 96, 165, 250, 255);
    fillRoundedRect(rightX + 70, rightY + 378, rightW - 160, 10, 2, 96, 165, 250, 255);
    fillRoundedRect(rightX + 70, rightY + 402, rightW - 140, 10, 2, 52, 211, 153, 255);
    fillRoundedRect(rightX + 70, rightY + 420, rightW - 180, 10, 2, 52, 211, 153, 255);
  }

  return createPNG(width, height, buf);
}

const assetsDir = path.resolve(__dirname);

// 1. Screenshot 1280x800
const screenshot = renderGraphic(1280, 800, false);
fs.writeFileSync(path.join(assetsDir, 'screenshot_1280x800.png'), screenshot);
console.log(`Generated screenshot_1280x800.png (${screenshot.length} bytes)`);

// 2. Promo Tile 440x280
const promoTile = renderGraphic(440, 280, true);
fs.writeFileSync(path.join(assetsDir, 'promo_tile_440x280.png'), promoTile);
console.log(`Generated promo_tile_440x280.png (${promoTile.length} bytes)`);
