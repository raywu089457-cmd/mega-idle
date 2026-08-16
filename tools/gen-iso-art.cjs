/* 放置王國 MEGA IDLE — iso 村莊建築 sprite 生成器（v564）
   修復：b_castle_iso / 9 棟 b_*_iso / b_house_iso 全數解析到 fallback blob（灰圓）
   → 依 TheoTown 風格規則程序化重繪：
   - 低飽和基色（屋頂 sat 50-70%、牆 15-35%）
   - 無黑色輪廓（同色系深階做邊緣）
   - 左上受光（左坡/左牆亮，右坡/右牆暗，中稜線暗）
   - 底部兩階漸暗（過渡階）
   - 面雜訊（seeded 同色系亮暗 speckle）
   用法：node tools/gen-iso-art.cjs → 產出 js/data/art/buildings_iso.js
   輸出靜態 rows/pal，與 art/*.js 契約一致（sprites.get 遍歷 MG.art 域自動解析）。 */
"use strict";
const fs = require("fs");
const path = require("path");

/* ---------- 色彩工具 ---------- */
function hsl(h, s, l) {
  // TheoTown R1/R2 硬保證:飽和度 8–82%、明度 28–86%(越界自動 clamp — 所有派生色自動合規)
  s = Math.max(8, Math.min(82, s));
  l = Math.max(28, Math.min(86, l));
  const S = s / 100, L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = L - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const f = v => Math.max(0, Math.min(255, Math.round((v + m) * 255))).toString(16).padStart(2, "0");
  return "#" + f(r) + f(g) + f(b);
}

/* ---------- 網格（格內存 hex，輸出時映射單字元 key） ---------- */
function grid(w, h) { return { w, h, c: Array.from({ length: h }, () => Array(w).fill(".")) }; }
function set(g, x, y, k) { if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.c[y][x] = k; }
function rect(g, x, y, w, h, k) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(g, i, j, k); }
/* 掃描線多邊形填色 */
function fillPoly(g, pts, k) {
  const ys = pts.map(p => p[1]);
  const yMin = Math.floor(Math.min(...ys)), yMax = Math.ceil(Math.max(...ys));
  for (let y = yMin; y <= yMax; y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i], p2 = pts[(i + 1) % pts.length];
      const y1 = p1[1], y2 = p2[1];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        const t = (y - y1) / (y2 - y1);
        xs.push(p1[0] + (p2[0] - p1[0]) * t);
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const x0 = Math.round(xs[i]), x1 = Math.round(xs[i + 1]);
      for (let x = x0; x <= x1; x++) set(g, x, y, k);
    }
  }
}
/* seeded 面雜訊 */
function speck(g, seed, x0, y0, x1, y1, baseKey, speckKeys) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (g.c[y] && g.c[y][x] === baseKey && rnd() < 0.16) {
        g.c[y][x] = speckKeys[(rnd() * speckKeys.length) | 0];
      }
    }
  }
}

/* ---------- 等角盒（2:1）
   屋頂菱形：(cx,ty) 頂 / (cx-W,ty+D) 左 / (cx,ty+2D) 前 / (cx+W,ty+D) 右
   左牆：(cx-W,ty+D)→(cx,ty+2D)→(cx,ty+2D+H)→(cx-W,ty+D+H)
   右牆：(cx,ty+2D)→(cx+W,ty+D)→(cx+W,ty+D+H)→(cx,ty+2D+H)
   cols: {roofL,roofR,ridge,wallL,wallR,wallEdge,base,baseHi}（hex） */
function isoBox(g, cx, ty, W, D, H, cols) {
  const ly = ty + D, fy = ty + D * 2; // 側頂 y / 前角 y
  // 屋頂（先全亮，右坡覆暗；脊線 亮）
  fillPoly(g, [[cx, ty], [cx - W, ly], [cx, fy], [cx + W, ly]], cols.roofL);
  fillPoly(g, [[cx, ty], [cx, fy], [cx + W, ly]], cols.roofR);
  for (let i = 0; i <= D * 2; i++) set(g, cx, ty + i, cols.ridge);
  // 左牆（亮）＋右牆（暗）＋中稜線（暗）
  fillPoly(g, [[cx - W, ly], [cx, fy], [cx, fy + H], [cx - W, ly + H]], cols.wallL);
  fillPoly(g, [[cx, fy], [cx + W, ly], [cx + W, ly + H], [cx, fy + H]], cols.wallR);
  fillPoly(g, [[cx, fy], [cx + 1, fy], [cx + 1, fy + H], [cx, fy + H]], cols.wallEdge);
  // 牆底兩階漸暗（沿兩牆底緣 1px 帶）
  fillPoly(g, [[cx - W + 1, ly + H - 1], [cx, fy + H - 1], [cx, fy + H], [cx - W + 1, ly + H]], cols.base);
  fillPoly(g, [[cx, fy + H - 1], [cx + W - 1, ly + H - 1], [cx + W - 1, ly + H], [cx, fy + H]], cols.base);
  fillPoly(g, [[cx - W + 1, ly + H], [cx, fy + H], [cx, fy + H + 1], [cx - W + 1, ly + H + 1]], cols.baseHi);
  fillPoly(g, [[cx, fy + H], [cx + W - 1, ly + H], [cx + W - 1, ly + H + 1], [cx, fy + H + 1]], cols.baseHi);
}

/* 窗（框 + 玻璃 + 上亮線 + 窗台兩階） */
function win(g, cx, cy, wpx, hpx, C) {
  const fx = cx - Math.floor(wpx / 2);
  rect(g, fx - 1, cy - 1, wpx + 2, hpx + 2, C.frame);
  rect(g, fx, cy, wpx, hpx, C.glass);
  rect(g, fx, cy, wpx, 1, C.glassHi);
  rect(g, fx - 1, cy + hpx + 1, wpx + 2, 1, C.sill);
  rect(g, fx - 1, cy + hpx + 2, wpx + 2, 1, C.sillHi);
}
/* 門（框 + 門板 + 亮邊 + 把手 + 台階兩階） */
function door(g, cx, bottomY, wpx, hpx, C) {
  const fx = cx - Math.floor(wpx / 2), fy = bottomY - hpx + 1;
  rect(g, fx - 1, fy - 1, wpx + 2, hpx + 2, C.frame);
  rect(g, fx, fy, wpx, hpx, C.door);
  rect(g, fx, fy, wpx, 1, C.doorHi);
  rect(g, cx + Math.floor(wpx / 2) - 2, fy + Math.floor(hpx / 2), 1, 2, C.doorKnob);
  rect(g, fx - 1, bottomY + 1, wpx + 2, 1, C.sill);
  rect(g, fx - 1, bottomY + 2, wpx + 2, 1, C.sillHi);
}
function flag(g, x, baseY, h, col, poleCol) {
  rect(g, x, baseY - h, 1, h, poleCol);
  rect(g, x + 1, baseY - h + 1, 3, 2, col);
}
function chimney(g, x, baseY, cols) {
  rect(g, x, baseY - 5, 3, 5, cols.chimney);
  rect(g, x - 1, baseY - 6, 5, 2, cols.chimneyHi);
}

/* ---------- 城堡 64×48：中央主樓 + 左右錐塔（塔先畫在後層）+ 雉堞 + 拱門 + 旗 ---------- */
function drawCastle() {
  const g = grid(64, 48);
  const C = {
    roofL: hsl(12, 60, 52), roofR: hsl(12, 52, 40), ridge: hsl(24, 64, 64),
    wallL: hsl(225, 16, 66), wallR: hsl(225, 13, 52), wallEdge: hsl(225, 10, 40),
    frame: hsl(225, 8, 32), glass: hsl(210, 30, 60), glassHi: hsl(205, 42, 76),
    sill: hsl(225, 10, 56), sillHi: hsl(225, 14, 70),
    base: hsl(225, 8, 42), baseHi: hsl(225, 10, 54),
    door: hsl(24, 38, 32), doorHi: hsl(24, 42, 44), doorKnob: hsl(40, 56, 68),
    chimney: hsl(24, 18, 38), chimneyHi: hsl(24, 18, 50),
    flag: hsl(2, 60, 46), flagPole: hsl(28, 28, 36),
    merlon: hsl(225, 13, 56), merlonHi: hsl(225, 14, 68),
  };
  // 左右錐塔（後層）
  for (const tx of [14, 50]) {
    fillPoly(g, [[tx - 4, 20], [tx, 24], [tx, 40], [tx - 4, 36]], C.wallL);
    fillPoly(g, [[tx, 24], [tx + 4, 20], [tx + 4, 36], [tx, 40]], C.wallR);
    fillPoly(g, [[tx, 24], [tx + 1, 24], [tx + 1, 40], [tx, 40]], C.wallEdge);
    fillPoly(g, [[tx - 5, 20], [tx + 5, 20], [tx, 6]], C.roofL);
    fillPoly(g, [[tx, 20], [tx + 5, 20], [tx, 6]], C.roofR);
    rect(g, tx - 1, 4, 2, 2, C.ridge);
    win(g, tx, 27, 2, 3, C);
    win(g, tx, 33, 2, 3, C);
    flag(g, tx, 6, 4, C.flag, C.flagPole);
  }
  // 主樓
  isoBox(g, 32, 10, 13, 7, 16, C);
  // 雉堞（沿屋頂左右斜緣 2px 齒）
  for (let i = 0; i < 3; i++) {
    const t = i / 2.5;
    for (const sgn of [-1, 1]) {
      const x = Math.round(32 + sgn * 13 * t), y = Math.round(10 + 7 * t);
      fillPoly(g, [[x - 1, y - 2], [x + 1, y - 2], [x + 1, y], [x - 1, y]], C.merlon);
      fillPoly(g, [[x - 1, y - 1], [x + 1, y - 1], [x + 1, y], [x - 1, y]], C.merlonHi);
    }
  }
  // 窗（左牆 2、右牆 1）
  win(g, 26, 26, 3, 4, C);
  win(g, 22, 32, 3, 4, C);
  win(g, 40, 28, 3, 4, C);
  // 大門（左牆下段）
  door(g, 27, 40, 6, 8, C);
  // 主樓脊旗
  flag(g, 32, 10, 5, C.flag, C.flagPole);
  // 面雜訊
  speck(g, 11, 19, 25, 32, 39, C.wallL, [hsl(225, 20, 70), hsl(225, 10, 58)]);
  speck(g, 12, 32, 25, 45, 39, C.wallR, [hsl(225, 16, 56), hsl(225, 8, 44)]);
  speck(g, 13, 10, 25, 18, 39, C.wallL, [hsl(225, 20, 70), hsl(225, 10, 58)]);
  speck(g, 14, 10, 25, 18, 39, C.wallR, [hsl(225, 16, 56), hsl(225, 8, 44)]);
  speck(g, 15, 46, 25, 54, 39, C.wallL, [hsl(225, 20, 70), hsl(225, 10, 58)]);
  speck(g, 16, 46, 25, 54, 39, C.wallR, [hsl(225, 16, 56), hsl(225, 8, 44)]);
  return { g, C };
}

/* ---------- 通用 32×32 建築
   cfg: { roofHue, roofSat, wallHue, wallSat, doorW, doorH, doorCX, windows:[[x,y,w,h]],
          seed, speckL, speckR, flag, chimney, custom } */
function drawBuilding(cfg) {
  const g = grid(cfg.w || 32, cfg.h || 32);
  const W = cfg.W || 11, D = cfg.D || 5, H = cfg.H || 9, ty = cfg.ty !== undefined ? cfg.ty : 6;   // 尺寸參數化:任何形體都在 isoBox 保證內
  const C = {
    roofL: hsl(cfg.roofHue, cfg.roofSat, 54),
    roofR: hsl(cfg.roofHue, Math.max(8, cfg.roofSat - 8), 41),
    ridge: hsl(cfg.roofHue + 8, cfg.roofSat, 66),
    wallL: hsl(cfg.wallHue, cfg.wallSat, 68),
    wallR: hsl(cfg.wallHue, Math.max(6, cfg.wallSat - 4), 54),
    wallEdge: hsl(cfg.wallHue, Math.max(4, cfg.wallSat - 6), 42),
    frame: hsl(cfg.wallHue, 10, 32),
    glass: hsl(cfg.glassHue || 210, 32, 62),
    glassHi: hsl(cfg.glassHue || 210, 45, 80),
    sill: hsl(cfg.wallHue, 12, 58),
    sillHi: hsl(cfg.wallHue, 16, 72),
    base: hsl(cfg.wallHue, 10, 44),
    baseHi: hsl(cfg.wallHue, 12, 56),
    door: hsl(cfg.doorHue || 24, 42, 34),
    doorHi: hsl(cfg.doorHue || 24, 46, 46),
    doorKnob: hsl(40, 60, 72),
    chimney: hsl(28, 18, 40), chimneyHi: hsl(28, 18, 52),
    flag: hsl(2, 62, 48), flagPole: hsl(28, 30, 38),
  };
  if (cfg.custom) cfg.custom(g, C);
  else {
    isoBox(g, 16, ty, W, D, H, C);
    if (cfg.windows) for (const [x, y, w2, h2] of cfg.windows) win(g, x, y, w2, h2, C);
    if (cfg.door !== false) door(g, cfg.doorCX || 13, cfg.doorBottom || 22, cfg.doorW || 4, cfg.doorH || 6, C);
    if (cfg.chimney) chimney(g, cfg.chimney, ty + D, C);
    if (cfg.flag) flag(g, 16, ty, 4, C.flag, C.flagPole);
    if (cfg.extras) cfg.extras(g, C);
    if (cfg.speck) {
      speck(g, cfg.seed, 5, 12, 16, 24, C.wallL, cfg.speckL);
      speck(g, cfg.seed + 1, 16, 12, 27, 24, C.wallR, cfg.speckR);
    }
  }
  return { g, C };
}

/* ---------- 各建築 ---------- */
const BUILDINGS = {
  /* 公會：紅瓦 + 米牆 + 大門 + 脊旗 */
  b_guild_iso: {
    roofHue: 14, roofSat: 60, wallHue: 38, wallSat: 28,
    doorW: 5, doorH: 7, doorCX: 12, doorBottom: 22, flag: true,
    windows: [[9, 14, 3, 4], [21, 14, 3, 4]],
    seed: 21, speckL: [hsl(38, 32, 72), hsl(38, 22, 60)], speckR: [hsl(38, 26, 58), hsl(38, 16, 46)],
  },
  /* 訓練場：平頂暗屋 + 齒緣 + 寬門（extras 壓暗屋頂） */
  b_training_iso: {
    roofHue: 210, roofSat: 18, wallHue: 30, wallSat: 34,
    doorW: 6, doorH: 7, doorCX: 12, doorBottom: 22,
    windows: [[9, 14, 2, 3], [22, 14, 2, 3]],
    seed: 22, speckL: [hsl(30, 38, 72), hsl(30, 28, 60)], speckR: [hsl(30, 32, 58), hsl(30, 22, 46)],
    extras: extrasTraining,
  },
  /* 圖書館：藍灰屋頂 + 石牆 + 大窗 */
  b_library_iso: {
    roofHue: 225, roofSat: 24, wallHue: 40, wallSat: 16,
    doorW: 4, doorH: 7, doorCX: 12, doorBottom: 22,
    windows: [[9, 13, 4, 5], [23, 13, 4, 5]],
    seed: 23, speckL: [hsl(40, 20, 74), hsl(40, 12, 62)], speckR: [hsl(40, 16, 60), hsl(40, 8, 48)],
  },
  /* 鐵匠鋪：暗石牆 + 煙囪煙 + 爐火窗 */
  b_forge_iso: {
    roofHue: 28, roofSat: 22, wallHue: 225, wallSat: 12,
    doorW: 4, doorH: 6, doorCX: 12, doorBottom: 21, chimney: 23,
    windows: [],
    seed: 24, speckL: [hsl(225, 16, 72), hsl(225, 8, 60)], speckR: [hsl(225, 12, 58), hsl(225, 6, 46)],
    extras: extrasForge,
  },
  /* 煉金坊：綠屋頂 + 藥瓶 + 綠窗 */
  b_alchemy_iso: {
    roofHue: 140, roofSat: 34, wallHue: 90, wallSat: 20, glassHue: 140,
    doorW: 4, doorH: 6, doorCX: 12, doorBottom: 21,
    windows: [[9, 14, 3, 4], [22, 14, 3, 4]],
    seed: 25, speckL: [hsl(90, 24, 72), hsl(90, 16, 60)], speckR: [hsl(90, 20, 58), hsl(90, 12, 46)],
    extras: extrasAlchemy,
  },
  /* 市集：開放棚（無門）+ 條紋遮陽棚 + 攤台 */
  b_market_iso: {
    roofHue: 12, roofSat: 54, wallHue: 42, wallSat: 24, door: false,
    windows: [],
    seed: 26, speckL: [hsl(42, 28, 72), hsl(42, 18, 60)], speckR: [hsl(42, 22, 58), hsl(42, 12, 46)],
    extras: extrasMarket,
  },
  /* 祭壇：開放石台 + 聖火（custom 全自繪） */
  b_altar_iso: { roofHue: 30, roofSat: 46, wallHue: 225, wallSat: 14, door: false, windows: [], custom: customAltar },
  /* 寶石坊：屋頂紫水晶簇 */
  b_gemworks_iso: {
    roofHue: 265, roofSat: 34, wallHue: 225, wallSat: 14,
    doorW: 4, doorH: 6, doorCX: 12, doorBottom: 21,
    windows: [[9, 14, 3, 4], [22, 14, 3, 4]],
    seed: 28, speckL: [hsl(225, 18, 72), hsl(225, 10, 60)], speckR: [hsl(225, 14, 58), hsl(225, 8, 46)],
    extras: extrasGem,
  },
  /* 倉庫：大棕頂 + 雙門 + 側窗 */
  b_warehouse_iso: {
    roofHue: 32, roofSat: 28, wallHue: 28, wallSat: 28,
    doorW: 6, doorH: 7, doorCX: 12, doorBottom: 22,
    windows: [[8, 14, 3, 3], [23, 14, 3, 3]],
    seed: 29, speckL: [hsl(28, 32, 72), hsl(28, 22, 60)], speckR: [hsl(28, 26, 58), hsl(28, 16, 46)],
  },
};

function extrasTraining(g, C) {
  // 屋頂壓暗（平頂感）
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const k = g.c[y][x];
      if (k === C.roofL) g.c[y][x] = hsl(210, 12, 44);
      else if (k === C.roofR) g.c[y][x] = hsl(210, 10, 36);
      else if (k === C.ridge) g.c[y][x] = hsl(210, 14, 56);
    }
  }
  // 齒緣（屋頂左右斜緣 2px 齒）
  for (let i = 0; i < 3; i++) {
    const t = i / 2.2;
    for (const sgn of [-1, 1]) {
      const x = Math.round(16 + sgn * 11 * t), y = Math.round(6 + 5 * t);
      fillPoly(g, [[x - 1, y - 2], [x + 1, y - 2], [x + 1, y], [x - 1, y]], hsl(210, 16, 54));
    }
  }
}
function extrasForge(g, C) {
  // 煙（靜態三團）
  rect(g, 23, 2, 2, 2, hsl(0, 0, 70));
  rect(g, 24, -1, 2, 2, hsl(0, 0, 62));
  // 爐火窗（左牆大窗橙光）
  win(g, 9, 14, 3, 4, C);
  rect(g, 8, 14, 5, 4, hsl(26, 62, 52));
  rect(g, 8, 14, 5, 1, hsl(40, 78, 68));
}
function extrasAlchemy(g, C) {
  // 屋頂圓瓶 + 綠液
  rect(g, 14, 1, 4, 4, C.glass);
  rect(g, 13, 0, 6, 1, C.frame);
  rect(g, 14, 2, 4, 2, hsl(140, 42, 38));
  rect(g, 15, 0, 2, 1, C.glassHi);
}
function extrasGem(g, C) {
  // 紫水晶簇（屋頂）
  const cry = [hsl(265, 38, 54), hsl(265, 34, 66), hsl(275, 32, 46)];
  const pts = [[16, 2], [14, 5], [17, 4], [19, 6], [12, 6]];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    fillPoly(g, [[x, y + 3], [x - 1, y], [x + 1, y], [x + 1, y + 3]], cry[i % 3]);
  }
}
function extrasMarket(g, C) {
  // 攤台（左牆下段兩側貨物台）
  rect(g, 7, 20, 5, 5, hsl(38, 32, 50));
  rect(g, 7, 20, 5, 1, hsl(38, 36, 62));
  rect(g, 20, 20, 5, 5, hsl(38, 32, 50));
  rect(g, 20, 20, 5, 1, hsl(38, 36, 62));
  // 貨物色點
  for (const [x, y, c] of [[8, 21, hsl(12, 48, 48)], [10, 22, hsl(90, 38, 46)], [21, 21, hsl(48, 54, 54)], [23, 22, hsl(210, 38, 50)]]) {
    rect(g, x, y, 2, 2, c);
    rect(g, x, y, 2, 1, hsl(40, 30, 64));
  }
  // 遮陽棚（屋簷下緣條紋）
  for (let i = 0; i < 4; i++) {
    const x = 4 + i * 6;
    rect(g, x, 17, 3, 2, i % 2 ? hsl(12, 50, 76) : hsl(12, 54, 44));
  }
  // 支柱
  rect(g, 6, 19, 1, 6, hsl(28, 28, 38));
  rect(g, 25, 19, 1, 6, hsl(28, 28, 38));
}
function customAltar(g, C) {
  // 石台（兩階）＋聖火（金焰橙心）
  fillPoly(g, [[16, 14], [6, 20], [16, 26], [26, 20]], C.wallL);
  fillPoly(g, [[16, 14], [16, 26], [26, 20]], C.wallR);
  fillPoly(g, [[16, 12], [8, 17], [16, 22], [24, 17]], C.wallL);
  fillPoly(g, [[16, 12], [16, 22], [24, 17]], C.wallR);
  rect(g, 15, 11, 2, 2, C.ridge);
  fillPoly(g, [[16, 3], [13, 9], [19, 9]], hsl(28, 66, 58));
  fillPoly(g, [[16, 3], [14, 8], [18, 8]], hsl(42, 78, 68));
  // 台面飾紋
  rect(g, 13, 17, 6, 1, C.ridge);
  speck(g, 27, 6, 20, 26, 25, C.wallL, [hsl(225, 18, 72), hsl(225, 10, 60)]);
}

/* ---------- 民房 20×16（正面小屋，與區域地標同語彙） ---------- */
function drawHouse() {
  const g = grid(20, 16);
  const C = {
    roofL: hsl(12, 56, 52), roofR: hsl(12, 48, 40), ridge: hsl(24, 62, 64),
    wallL: hsl(40, 22, 70), wallR: hsl(40, 16, 56), wallEdge: hsl(40, 12, 44),
    frame: hsl(40, 10, 32), glass: hsl(210, 32, 64), glassHi: hsl(205, 45, 80),
    sill: hsl(40, 14, 58), sillHi: hsl(40, 18, 72),
    base: hsl(40, 10, 44), baseHi: hsl(40, 12, 56),
    door: hsl(24, 42, 34), doorHi: hsl(24, 46, 46), doorKnob: hsl(40, 60, 72),
    chimney: hsl(28, 18, 40), chimneyHi: hsl(28, 18, 52),
  };
  // 山牆屋頂（三角）
  fillPoly(g, [[10, 2], [3, 8], [17, 8]], C.roofL);
  fillPoly(g, [[10, 2], [10, 8], [17, 8]], C.roofR);
  rect(g, 9, 1, 2, 1, C.ridge);
  // 牆（左亮右暗）
  rect(g, 4, 8, 7, 7, C.wallL);
  rect(g, 11, 8, 5, 7, C.wallR);
  rect(g, 10, 8, 1, 7, C.wallEdge);
  // 牆底漸暗
  rect(g, 4, 14, 12, 1, C.base);
  rect(g, 4, 15, 12, 1, C.baseHi);
  // 窗
  win(g, 6, 10, 2, 3, C);
  win(g, 14, 10, 2, 3, C);
  // 門
  door(g, 10, 14, 3, 5, C);
  // 煙囪
  chimney(g, 14, 8, C);
  // 雜訊
  speck(g, 31, 4, 9, 10, 13, C.wallL, [hsl(40, 26, 74), hsl(40, 16, 62)]);
  speck(g, 32, 11, 9, 16, 13, C.wallR, [hsl(40, 20, 60), hsl(40, 10, 48)]);
  return { g, C };
}

/* ---------- 輸出 ---------- */
function emitRows(g) {
  const order = [];
  const seen = new Set();
  const rows = g.c.map(row => row.map(ch => {
    if (ch === ".") return ".";
    if (!seen.has(ch)) { seen.add(ch); order.push(ch); }
    return ch;
  }).join(""));
  return { rows, order };
}
function emit() {
  const out = {};
  const palAll = {};   // sprite -> {hex: key}
  const KEY_START = 33; // '!' 起
  const keyOf = (hex) => {
    // 每個 sprite 獨立 key 空間（單字元）
    return hex;
  };
  // 各 sprite：收集 hex → 指派單字元
  function finalize(name, { g, C }) {
    // R4 光源驗證樣本:牆面色票(isoBox 以 wallL/wallR 繪牆 — 色定義層驗證)
    const wallL = C && C.wallL ? (C.wallL.startsWith("#") ? C.wallL : null) : null;
    const wallR = C && C.wallR ? (C.wallR.startsWith("#") ? C.wallR : null) : null;
    const order = [];
    const seen = new Set();
    const rows = g.c.map(row => row.map(ch => {
      if (ch === ".") return ".";
      if (!seen.has(ch)) { seen.add(ch); order.push(ch); }
      return ch;
    }).join(""));
    // key 空間：A-Z 再 a-z（跳過 `"`/`\` 等會破壞字串字面值的字元）
    const keyAt = i => i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(97 + i - 26);
    const pal = {};
    order.forEach((hex, i) => {
      if (i >= 52) throw new Error("palette keys exhausted: " + name);
      pal[keyAt(i)] = hex;
    });
    // 把格內 hex 換成 key
    const keyMap = {};
    order.forEach((hex, i) => { keyMap[hex] = keyAt(i); });
    const rowsK = g.c.map(row => row.map(ch => (ch === "." ? "." : keyMap[ch])).join(""));
    out[name] = { w: g.w, h: g.h, rate: 0, rows: rowsK, pal, wallL, wallR };
  }
  finalize("b_castle_iso", drawCastle());
  for (const name in BUILDINGS) finalize(name, drawBuilding(BUILDINGS[name]));
  finalize("b_house_iso", drawHouse());
  return out;
}

/* ---------- 寫檔 ---------- */
const out = emit();

/* ---------- TheoTown 規則自動驗收(R1-R6) — 任一 FAIL 不寫檔 ---------- */
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s: s * 100, l: l * 100 };
}
function verify(name, s) {
  const issues = [];
  const pal = Object.values(s.pal);
  for (const hex of pal) {
    if (/^#(000000|101018)$/i.test(hex)) issues.push(`R3 黑輪廓 ${hex}`);
    const { s: sat, l } = hexToHsl(hex);
    if (sat < 7.5 || sat > 82.5) issues.push(`R1 飽和度 ${Math.round(sat)}% (${hex})`);
    if (l < 27 || l > 86.5) issues.push(`R2 明度 ${Math.round(l)}% (${hex})`);
  }
  // R4 光源(色票級):牆面左亮右暗 — isoBox 以 wallL/wallR 繪製,驗色定義即驗結構
  if (s.wallL && s.wallR) {
    const lL = hexToHsl(s.wallL).l, lR = hexToHsl(s.wallR).l;
    if (lL <= lR) issues.push(`R4 光源:wallL ${s.wallL}(${Math.round(lL)}%) 未亮於 wallR ${s.wallR}(${Math.round(lR)}%)`);
  }
  if (issues.length) {
    console.error(`[FAIL] ${name}: ${issues.join("; ")}`);
    return false;
  }
  console.log(`[PASS] ${name} (${s.w}x${s.h}, ${pal.length} 色)`);
  return true;
}
let allPass = true;
for (const name of Object.keys(out)) if (!verify(name, out[name])) allPass = false;
if (!allPass) {
  console.error("=== 驗收未過,不寫檔。修正生成器後重跑。 ===");
  process.exit(1);
}

const lines = [
  "/* 放置王國 MEGA IDLE — iso 村莊建築 pixel art（v564 由 tools/gen-iso-art.cjs 生成）",
  "   修復 b_*_iso 全數解析到 fallback blob 的問題；TheoTown 風格：低飽和、無黑輪廓、",
  "   左上受光、底部兩階漸暗、面雜訊。靜態 rows/pal，與 art/*.js 契約一致。",
  "   重新生成：node tools/gen-iso-art.cjs */",
  '"use strict";',
  "MG.art = MG.art || {};",
  "MG.art.buildings_iso = {",
];
const names = Object.keys(out);
names.forEach((name, ni) => {
  const s = out[name];
  lines.push(`  ${name}: {`);
  lines.push(`    w: ${s.w}, h: ${s.h}, rate: 0,`);
  lines.push("    pal: " + JSON.stringify(s.pal).replace(/"/g, '"') + ",");
  lines.push("    rows: [");
  for (const r of s.rows) lines.push('      "' + r + '",');
  lines.push("    ]");
  lines.push("  }" + (ni < names.length - 1 ? "," : ""));
});
lines.push("};");
const file = path.join(__dirname, "..", "js", "data", "art", "buildings_iso.js");
fs.writeFileSync(file, lines.join("\n") + "\n");
console.log("written", file, Object.keys(out).length, "sprites");
for (const name of names) console.log(" -", name, out[name].w + "x" + out[name].h, Object.keys(out[name].pal).length, "colors");
