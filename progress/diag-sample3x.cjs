/* 診斷:3x 官方樣張 ASCII 形體 — 決定結構基準 */
"use strict";
const fs = require("fs");
const zlib = require("zlib");
function decodePNG(buf) {
  let pos = 8, w = 0, h = 0, bit = 0, color = 0, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const t = buf.toString("ascii", pos + 4, pos + 8);
    const d = buf.subarray(pos + 8, pos + 8 + len);
    if (t === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bit = d[8]; color = d[9]; }
    else if (t === "IDAT") idat.push(d);
    else if (t === "IEND") break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = { 2: 3, 6: 4 }[color];
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let rp = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[rp++];
    const line = raw.subarray(rp, rp + stride); rp += stride;
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (ft === 1) v = (v + a) & 255;
      else if (ft === 2) v = (v + b) & 255;
      else if (ft === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (ft === 4) { const p = a + b - c; const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255; }
      out[y * stride + i] = v;
    }
  }
  return { w, h, px: (x, y) => { const i = (y * w + x) * bpp; return [out[i], out[i + 1], out[i + 2], bpp === 4 ? out[i + 3] : 255]; } };
}
function cls(c) {
  const r = c[0], g = c[1], b = c[2];
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (l < 50 && d < 30) return "#";
  if (r > 90 && r >= g && r >= b) return "R";
  if (g >= r && g >= b) return d < 28 && l < 75 ? "g" : "G";
  if (b >= r && b >= g) return b > 110 && g > 90 ? "W" : "B";
  if (Math.abs(r - g) < 22 && Math.abs(g - b) < 22) return l < 75 ? "S" : "s";
  return "?";
}
const img = decodePNG(fs.readFileSync("progress/theo-steps/3x_sample10_1.png"));
for (let y = 0; y < img.h; y++) {
  let line = "";
  for (let x = 0; x < img.w; x++) { const p = img.px(x, y); line += p[3] < 128 ? "." : cls(p); }
  console.log(line);
}