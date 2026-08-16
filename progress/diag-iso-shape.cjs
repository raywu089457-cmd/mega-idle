/* 診斷:官方 sample10 與本遊戲建築 ASCII 形體並排 — 驗證 v577 官方比例(屋頂:牆≈2.4:1、草座、右下深綠陰影) */
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
  // 依色系分類:紅/橙(屋頂)、灰(牆)、綠(草/影)、藍(窗/影)、暗(深綠影)、其他
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (l < 45 && d < 20) return "#";     // 近黑
  if (r > g && r > b && r > 80) return "R";  // 紅/橙
  if (g > r && g >= b) return d < 25 ? (l < 60 ? "G" : "g") : "G";  // 綠系: 深綠 g / 亮綠 G
  if (b > r && b >= g) return "B";      // 藍系
  if (Math.abs(r - g) < 25 && Math.abs(g - b) < 25) return l < 70 ? "S" : "s";  // 灰系: 深灰 S / 亮灰 s
  return "?";                           // 土/木/其他
}

function ascii(img, label) {
  console.log("-- " + label + " " + img.w + "x" + img.h + " --");
  const lines = [];
  let roofTop = null, roofBot = null, wallTop = null, wallBot = null;
  for (let y = 0; y < img.h; y++) {
    let line = "";
    for (let x = 0; x < img.w; x++) {
      const p = img.px(x, y);
      if (p[3] < 128) { line += "."; continue; }
      line += cls(p);
    }
    lines.push(line);
    if (/[RGgB]/.test(line)) { if (roofTop === null) roofTop = y; roofBot = y; }
    if (/[SsS]/.test(line) && roofBot !== null && !/[RGgB]/.test(line)) { if (wallTop === null) wallTop = y; wallBot = y; }
  }
  console.log(lines.join("\n"));
  return { roofTop, roofBot, wallTop, wallBot };
}

const sample = decodePNG(fs.readFileSync("progress/theo-steps/sample10_2.png"));
const s = ascii(sample, "官方 sample10_2");
console.log("官方: 屋頂 y", s.roofTop, "-", s.roofBot, " 牆 y", s.wallTop, "-", s.wallBot);

global.MG = {};
new Function("MG", fs.readFileSync("js/data/art/buildings_iso.js", "utf8"))(MG);
const arts = MG.art.buildings_iso;
function spriteAscii(name) {
  const sp = arts[name];
  const img = { w: sp.w, h: sp.h, px: (x, y) => { const ch = sp.rows[y] && sp.rows[y][x]; if (!ch || ch === ".") return [0, 0, 0, 0]; const k = sp.pal[ch]; return [parseInt(k.slice(1, 3), 16), parseInt(k.slice(3, 5), 16), parseInt(k.slice(5, 7), 16), 255]; } };
  return img;
}
for (const n of ["b_house_iso", "b_guild_iso", "b_forge_iso"]) {
  const img = spriteAscii(n);
  const r = ascii(img, "本遊戲 " + n);
  console.log(n + ": 屋頂 y", r.roofTop, "-", r.roofBot, " 牆 y", r.wallTop, "-", r.wallBot);
}