// Pure Node.js PNG generator with zero dependencies (uses built-in zlib)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, pixelData) {
  // pixelData is Buffer of RGBA values, size width * height * 4
  const scanlines = [];
  for (let y = 0; y < height; y++) {
    scanlines.push(0); // Filter type 0: None
    const rowStart = y * width * 4;
    for (let x = 0; x < width * 4; x++) {
      scanlines.push(pixelData[rowStart + x]);
    }
  }

  const compressedData = zlib.deflateSync(Buffer.from(scanlines));

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // color type 6: RGBA
  ihdr.writeUInt8(0, 10); // compression method 0
  ihdr.writeUInt8(0, 11); // filter method 0
  ihdr.writeUInt8(0, 12); // interlace method 0

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
      const byte = buf[i];
      crc ^= byte;
      for (let j = 0; j < 8; j++) {
        const mask = -(crc & 1);
        crc = (crc >>> 1) ^ (0xedb88320 & mask);
      }
    }
    return (crc ^ 0xffffffff) | 0;
  }

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawMultiClipIcon(size) {
  const buf = Buffer.alloc(size * size * 4);

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    // Alpha blending with existing pixel
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

  // Antialiased circle/rounded rect helper
  function fillRoundedRect(x0, y0, w, h, radius, r, g, b, a = 255) {
    const x1 = x0 + w;
    const y1 = y0 + h;
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
      for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
        let inside = true;
        let dist = 0;

        const left = x0 + radius;
        const right = x1 - radius;
        const top = y0 + radius;
        const bottom = y1 - radius;

        if (x < left && y < top) dist = Math.hypot(x - left, y - top);
        else if (x > right && y < top) dist = Math.hypot(x - right, y - top);
        else if (x < left && y > bottom) dist = Math.hypot(x - left, y - bottom);
        else if (x > right && y > bottom) dist = Math.hypot(x - right, y - bottom);
        else dist = 0;

        if (dist > radius) continue;
        const alphaFactor = dist > radius - 1 ? Math.max(0, Math.min(1, radius - dist)) : 1;
        setPixel(x, y, r, g, b, Math.round(a * alphaFactor));
      }
    }
  }

  const s = size;
  // Background rounded rectangle (Squircle/Modern app icon background)
  const pad = s * 0.04;
  const bgRadius = s * 0.22;
  // Gradient from deep indigo (30, 64, 175) to vibrant blue (59, 130, 246)
  for (let y = 0; y < s; y++) {
    const t = y / s;
    const r = Math.round(37 + (29 - 37) * t);
    const g = Math.round(99 + (78 - 99) * t);
    const b = Math.round(235 + (216 - 235) * t);
    // Draw row for rounded rect
    fillRoundedRect(pad, pad, s - pad * 2, s - pad * 2, bgRadius, r, g, b, 255);
  }

  // Back clipboard layer (darker sheet)
  const clipWidth = s * 0.54;
  const clipHeight = s * 0.64;
  const clipX = (s - clipWidth) / 2;
  const clipY = s * 0.22;
  const clipRadius = s * 0.08;

  // Background clipboard layer (shadow/underlay sheet)
  fillRoundedRect(clipX + s * 0.04, clipY + s * 0.04, clipWidth, clipHeight, clipRadius, 14, 116, 144, 180);

  // Main white clipboard paper
  fillRoundedRect(clipX, clipY, clipWidth, clipHeight, clipRadius, 255, 255, 255, 255);

  // Top clip header (metal clip)
  const headerW = clipWidth * 0.44;
  const headerH = s * 0.12;
  const headerX = (s - headerW) / 2;
  const headerY = clipY - headerH * 0.35;
  fillRoundedRect(headerX, headerY, headerW, headerH, headerH * 0.4, 203, 213, 225, 255); // Slate 300
  fillRoundedRect(headerX + headerW * 0.15, headerY + headerH * 0.2, headerW * 0.7, headerH * 0.55, headerH * 0.2, 51, 65, 85, 255); // Slate 700

  // Multi-clip stacked lines on the sheet (representing aggregated items)
  const linePadX = clipWidth * 0.18;
  const lineWidth = clipWidth - linePadX * 2;
  const lineH = Math.max(1, Math.round(s * 0.055));
  const lineStartY = clipY + clipHeight * 0.28;
  const lineSpacing = s * 0.105;

  // Line 1: Blue highlight (Clip #1)
  fillRoundedRect(clipX + linePadX, lineStartY, lineWidth, lineH, lineH * 0.4, 37, 99, 235, 255);

  // Line 2: Emerald/Cyan highlight (Clip #2)
  fillRoundedRect(clipX + linePadX, lineStartY + lineSpacing, lineWidth * 0.85, lineH, lineH * 0.4, 16, 185, 129, 255);

  // Line 3: Violet highlight (Clip #3)
  fillRoundedRect(clipX + linePadX, lineStartY + lineSpacing * 2, lineWidth * 0.65, lineH, lineH * 0.4, 139, 92, 246, 255);

  // Stack/Plus indicator badge on bottom-right corner
  const badgeSize = s * 0.30;
  const badgeX = s - badgeSize - pad * 1.5;
  const badgeY = s - badgeSize - pad * 1.5;
  fillRoundedRect(badgeX, badgeY, badgeSize, badgeSize, badgeSize / 2, 16, 185, 129, 255); // Emerald 500

  // Plus symbol inside badge
  const plusThick = Math.max(1, Math.round(badgeSize * 0.18));
  const plusLen = badgeSize * 0.55;
  const plusCenterX = badgeX + badgeSize / 2;
  const plusCenterY = badgeY + badgeSize / 2;

  // Horizontal bar
  fillRoundedRect(plusCenterX - plusLen / 2, plusCenterY - plusThick / 2, plusLen, plusThick, 1, 255, 255, 255, 255);
  // Vertical bar
  fillRoundedRect(plusCenterX - plusThick / 2, plusCenterY - plusLen / 2, plusThick, plusLen, 1, 255, 255, 255, 255);

  return createPNG(size, size, buf);
}

const sizes = [16, 32, 48, 128];
const iconsDir = path.resolve(__dirname);

for (const size of sizes) {
  const pngData = drawMultiClipIcon(size);
  const outPath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(outPath, pngData);
  console.log(`Generated ${outPath} (${pngData.length} bytes)`);
}
