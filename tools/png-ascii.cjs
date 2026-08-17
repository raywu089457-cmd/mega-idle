/* 最小 PNG 解碼器：解 IHDR/IDAT → inflate → unfilter → RGBA 像素 */
"use strict";
const zlib = require("zlib");
const fs = require("fs");

function decodePNG(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error("not png");
  let pos = 8, w = 0, h = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (pos < b.length) {
    const len = b.readUInt32BE(pos);
    const type = b.toString("ascii", pos + 4, pos + 8);
    const data = b.slice(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : colorType === 3 ? 1 : 0;
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let rp = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const filter = raw[rp++];
    const row = out.slice(y * stride, (y + 1) * stride);
    const cur = raw.slice(rp, rp + stride); rp += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp] : 0;
      const bv = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = cur[x];
      if (filter === 1) v = (v + a) & 255;
      else if (filter === 2) v = (v + bv) & 255;
      else if (filter === 3) v = (v + ((a + bv) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + bv - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - bv), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? bv : c)) & 255;
      }
      row[x] = v;
    }
    prev = Buffer.from(row);
  }
  // 調色板
  let pal = null;
  if (colorType === 3) {
    // 需要 PLTE——簡化：直接回傳索引（對 ASCII 用）
  }
  return { w, h, bitDepth, colorType, stride, out };
}

/* ASCII 呈現：降採樣到 maxW 寬；非透明 → 依亮度給字符 */
function ascii(img, maxW, maxH) {
  const { w, h, colorType, stride, out } = img;
  const sw = Math.min(w, maxW || 120), sh = Math.min(h, maxH || 60);
  const rows = [];
  for (let j = 0; j < sh; j++) {
    const sy = Math.floor(j * h / sh);
    let line = "";
    for (let i = 0; i < sw; i++) {
      const sx = Math.floor(i * w / sw);
      const o = sy * stride + sx * (colorType === 6 ? 4 : colorType === 2 ? 3 : 1);
      let r, g, b, a = 255;
      if (colorType === 6) { r = out[o]; g = out[o+1]; b = out[o+2]; a = out[o+3]; }
      else if (colorType === 2) { r = out[o]; g = out[o+1]; b = out[o+2]; }
      else { r = g = b = out[o]; }
      if (a < 40) { line += " "; continue; }
      const lum = (r + g + b) / 3;
      // 色調分組（紅/黃/綠/藍/灰/暗）
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      if (lum < 40) line += "@";
      else if (lum > 230) line += ".";
      else if (sat > 0.25) {
        if (r > g && r > b) line += "R";
        else if (g > r && g > b) line += "G";
        else if (b > r && b > g) line += "B";
        else line += "Y";
      } else if (lum > 160) line += "#";
      else if (lum > 100) line += "=";
      else line += "+";
    }
    rows.push(line);
  }
  return rows.join("\n");
}

if (require.main === module) {
  const file = process.argv[2];
  const img = decodePNG(file);
  console.log(`=== ${file} ${img.w}x${img.h} colorType=${img.colorType} ===`);
  console.log(ascii(img, parseInt(process.argv[3] || 0), parseInt(process.argv[4] || 0)));
}
module.exports = { decodePNG, ascii };
