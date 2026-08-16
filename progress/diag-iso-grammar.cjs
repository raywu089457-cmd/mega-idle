/* 診斷:解碼官方 sample10 PNG + 本遊戲 buildings_iso sprites,輸出顏色文法比對 */
"use strict";
const fs = require("fs");
const zlib = require("zlib");

function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not png");
  let pos = 8, w = 0, h = 0, bit = 0, color = 0, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bit = data[8]; color = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = { 2: 3, 6: 4 }[color]; // RGB / RGBA
  if (bit !== 8 || !bpp) throw new Error("unsupported png fmt bit=" + bit + " color=" + color);
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
  return { w, h, bpp, px: (x, y) => { const i = (y * w + x) * bpp; return [out[i], out[i + 1], out[i + 2], bpp === 4 ? out[i + 3] : 255]; } };
}

function hex(c) { const f = (v) => v.toString(16).padStart(2, "0"); return "#" + f(c[0]) + f(c[1]) + f(c[2]); }
function hsl(c) {
  const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  const l = (mx + mn) / 2, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// 1) 官方 sample
const sample = decodePNG(fs.readFileSync("progress/theo-steps/sample10_2.png"));
console.log("== 官方 sample10_2.png", sample.w + "x" + sample.h, "bpp", sample.bpp);
const scount = {};
for (let y = 0; y < sample.h; y++) for (let x = 0; x < sample.w; x++) {
  const p = sample.px(x, y);
  if (p[3] === 0) continue;
  const k = hex(p);
  scount[k] = (scount[k] || 0) + 1;
}
const sSorted = Object.entries(scount).sort((a, b) => b[1] - a[1]);
console.log("官方色數:", sSorted.length, " 前20色:");
for (const [k, n] of sSorted.slice(0, 20)) { const c = [parseInt(k.slice(1,3),16), parseInt(k.slice(3,5),16), parseInt(k.slice(5,7),16)]; const h = hsl(c); console.log(" ", k, n, "hsl(" + h.h + "," + h.s + "%," + h.l + "%)"); }
console.log("官方最暗10色:");
const sDark = sSorted.map(([k, n]) => { const c = [parseInt(k.slice(1,3),16), parseInt(k.slice(3,5),16), parseInt(k.slice(5,7),16)]; return { k, n, lum: 0.299*c[0]+0.587*c[1]+0.114*c[2], h: hsl(c) }; }).sort((a,b) => a.lum - b.lum).slice(0, 10);
for (const d of sDark) console.log(" ", d.k, "n=" + d.n, "lum=" + Math.round(d.lum), "hsl(" + d.h.h + "," + d.h.s + "%," + d.h.l + "%)");

// 2) 本遊戲 sprite 裝載
global.MG = {};
const code = fs.readFileSync("js/data/art/buildings_iso.js", "utf8");
new Function("MG", code)(MG);
const arts = MG.art.buildings_iso;
console.log("\n== 本遊戲 buildings_iso sprites");
for (const name of Object.keys(arts)) {
  const sp = arts[name];
  const count = {};
  const palHex = {};
  for (const k in sp.pal) palHex[k] = sp.pal[k];
  for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) {
    const ch = sp.rows[y][x];
    if (ch === "." || ch === undefined) continue;
    const k = palHex[ch];
    if (!k) continue;
    count[k] = (count[k] || 0) + 1;
  }
  const dark = Object.entries(count).map(([k, n]) => { const c = [parseInt(k.slice(1,3),16), parseInt(k.slice(3,5),16), parseInt(k.slice(5,7),16)]; return { k, n, lum: 0.299*c[0]+0.587*c[1]+0.114*c[2], h: hsl(c) }; }).sort((a, b) => a.lum - b.lum).slice(0, 3);
  const total = Object.values(count).reduce((s, n) => s + n, 0);
  console.log(" ", name, sp.w + "x" + sp.h, "色數", Object.keys(count).length, "px", total, "| 最暗:", dark.map(d => d.k + "(lum" + Math.round(d.lum) + ")").join(" "));
}