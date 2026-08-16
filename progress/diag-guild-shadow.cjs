/* 診斷:b_guild_iso 完整色塊 → 陰影位置/長度 vs 官方法則(陰影=物高) */
"use strict";
const fs = require("fs");
global.MG = {};
new Function("MG", fs.readFileSync("js/data/art/buildings_iso.js", "utf8"))(MG);
const sp = MG.art.buildings_iso.b_guild_iso;
const inv = {};
for (const k in sp.pal) inv[k] = sp.pal[k];
for (let y = 0; y < sp.h; y++) {
  let line = "";
  for (let x = 0; x < sp.w; x++) {
    const ch = sp.rows[y][x];
    if (!ch || ch === ".") { line += ".."; continue; }
    const c = inv[ch];
    const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16);
    const lum = Math.round(0.299*r + 0.587*g + 0.114*b);
    // 類別: 深綠影(<80)、綠(草)、屋頂紅/棕、牆、窗、暗
    if (g > r + 5 && g > b && lum < 80) line += "影";
    else if (g > r && g > b) line += "草";
    else if (r > g + 10 && r > b) line += "頂";
    else if (b > g && b > r && lum < 70) line += "窗";
    else if (r > 100 && g > 70 && b > 50 && r < 200) line += "木";
    else if (lum > 130) line += "亮";
    else if (lum > 70) line += "中";
    else line += "暗";
  }
  console.log(line);
}
console.log("---- 色表 ----");
for (const k in sp.pal) {
  const c = sp.pal[k];
  const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16);
  let n = 0;
  for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) if (sp.rows[y][x] === k) n++;
  if (n > 2) console.log(c, "n" + n, "lum" + Math.round(0.299*r+0.587*g+0.114*b));
}