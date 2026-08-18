/* 放置王國 MEGA IDLE — iso 村莊建築 sprite 生成器（v576 官方規格逐像素重測）
   規格來源：Theo 官方教學「How to create a small building in 10 steps」(forum t=1233)
   2026-08-16 重新解碼 sample10 成品 32×25 + 光影模板 32×24 + 步驟1-9 全文，修正 v575 偏差：
   - 陰影：官方 step9「black 20% coverage」= 疊在草地上的半透明黑 = 深綠（v575 誤用近純黑 #14161f）
   - 陰影長度：官方「length = object height」= 右牆高 H（v575 誤用 40%）
   - 比例：官方樣張屋頂佔建築本體 ~68%（屋頂:牆 ≈ 2.4:1）（v575 誤用 1.25:1）
   - 草地：官方 step8「grass added to front yard」= 完整菱形前院草，左亮右暗（v575 為窄帶）
   - 祭壇：v575 無屋頂無草地（7 色），v576 補回官方文法四部件
   用法：node tools/gen-iso-art.cjs → 產出 js/data/art/buildings_iso.js */
"use strict";
const fs = require("fs");
const path = require("path");

/* ---------- 色彩工具 ---------- */
function hsl(h, s, l) {
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

/* ---------- 網格 ---------- */
function grid(w, h) { return { w, h, c: Array.from({ length: h }, () => Array(w).fill(".")) }; }
function set(g, x, y, k) { if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.c[y][x] = k; }
function rect(g, x, y, w, h, k) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(g, i, j, k); }
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
function speck(g, seed, x0, y0, x1, y1, baseKey, speckKeys) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (g.c[y] && g.c[y][x] === baseKey && rnd() < 0.14) {
        g.c[y][x] = speckKeys[(rnd() * speckKeys.length) | 0];
      }
    }
  }
}
/* 覆蓋非透明像素（疊繪用：石板縫/瓦排只著色既有像素，不新增漂浮點） */
function retint(g, x, y, w, h, k) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (g.c[j] && g.c[j][i] !== ".") set(g, i, j, k);
    }
  }
}

/* ---------- 官方規格骨架（v576，t=1233 樣張 sample10 逐像素重測）
   官方 32×25 成品樣張測量（2026-08-16 重新解碼，非 v575 的近似值）：
   - 屋頂菱形：頂 (cx,ty)、左 (cx-W, ty+D)、右 (cx+W, ty+D)、底 (cx, ty+2D)；
     apex 貼頂、屋頂高約 2D，佔建築本體高 ~68%（屋頂:牆 ≈ 2.4:1）
   - 牆：菱形盒下半，只露 ~5px（被大屋頂蓋住），左亮右暗、中稜線
   - 草地：完整菱形前院草（左亮右暗漸層），從建築底邊延伸到 sprite 底部
   - 陰影：黑 20% 覆蓋疊在草地右半 = 草地暗化（官方明文「black 20% coverage」）
     → 陰影色是深綠家族，不是黑藍灰；長度 = 右牆高（官方「length = object height」）
   cols: { roofL, roofR, ridge, wallL, wallR, wallEdge, grass, grassHi, shade,
          frame, glass, glassHi, sill, sillHi, base, roofShade } */
function ttTheo(g, cx, ty, W, D, H, cols) {
  const ly = ty + D, fy = ty + D * 2;          // 屋頂側點 y / 屋頂前角 y
  // ---- 草地（完整菱形前院草，先畫在底層；左半亮、右半暗 = 光影模板 D/F→G/H） ----
  const gy = fy + H, gd = Math.max(2, Math.min(Math.round(D * 1.5), g.h - gy - 0)); // 建築底邊 y / 草地深（clamp 不超 sprite）
  fillPoly(g, [[cx - W - 2, ly + H], [cx, gy], [cx, gy + gd], [cx - W - 2, gy + gd - Math.round(D * 0.2)]], cols.grassHi); // 左半（受光）
  fillPoly(g, [[cx + W + 2, ly + H], [cx, gy], [cx, gy + gd], [cx + W + 2, gy + gd - Math.round(D * 0.2)]], cols.grass);  // 右半（背光）
  // ---- 陰影（右下長陰影，疊在草地右半；黑 20% 覆蓋 = 草地暗化；長度 = 右牆高 H） ----
  {
    const shLen = Math.max(2, H);
    const x0 = cx + Math.round(W * 0.55), y0 = ly + H;
    fillPoly(g, [[x0, y0], [x0 + shLen, y0 + Math.round(shLen / 2)], [x0 + shLen, y0 + Math.round(shLen / 2) + 2], [x0, y0 + 2]], cols.shade);
  }
  // ---- 屋頂（菱形四坡，大比例 ~68%） ----
  fillPoly(g, [[cx, ty], [cx - W, ly], [cx, fy], [cx + W, ly]], cols.roofL);
  fillPoly(g, [[cx, ty], [cx, fy], [cx + W, ly]], cols.roofR);
  // 脊線（頂→前角 亮）
  for (let i = 0; i <= D * 2; i++) set(g, cx, ty + i, cols.ridge);
  // 屋頂右側暗化（官方光影模板：左坡亮、右坡暗 — 用屋頂色×0.8 的暗階，非黑）
  fillPoly(g, [[cx + Math.round(W * 0.72), ly - 1], [cx + W, ly], [cx, fy], [cx + Math.round(W * 0.72), ly + Math.round(D * 0.7)]], cols.roofShade);
  // ---- 牆（菱形盒下半露出，僅 ~H px） ----
  fillPoly(g, [[cx - W, ly], [cx, fy], [cx, fy + H], [cx - W, ly + H]], cols.wallL);
  fillPoly(g, [[cx, fy], [cx + W, ly], [cx + W, ly + H], [cx, fy + H]], cols.wallR);
  fillPoly(g, [[cx, fy], [cx + 1, fy], [cx + 1, fy + H], [cx, fy + H]], cols.wallEdge);
  // 底兩階
  fillPoly(g, [[cx - W + 1, ly + H - 1], [cx, fy + H - 1], [cx, fy + H], [cx - W + 1, ly + H]], cols.base);
  fillPoly(g, [[cx, fy + H - 1], [cx + W - 1, ly + H - 1], [cx + W - 1, ly + H], [cx, fy + H]], cols.base);
}

/* 窗（官方規則：亮側暗框、暗側亮框；窗台深度） */
function win(g, cx, cy, wpx, hpx, C, onDark) {
  const fx = cx - Math.floor(wpx / 2);
  const fr = onDark ? C.frameLight : C.frame;
  rect(g, fx - 1, cy - 1, wpx + 2, hpx + 2, fr);
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
  // 煙囪投影在屋頂（官方 step9「chimney throws its shadow on the roof」= 屋頂暗化，非黑）
  fillPoly(g, [[x + 2, baseY - 4], [x + 5, baseY - 6], [x + 5, baseY - 5], [x + 2, baseY - 3]], cols.roofShade);
}

/* ---------- 城堡 64×48（v582 重繪）：亮石板牆＋藍石板坡頂＋亮脊線＋左右多塔＋連續雉堞＋拱門台階
   對齊官方範例宅邸 b_tt_demo 石牆色族（#90a0c0–#c0c0c0，明度 66–84%）與 R1-R6 文法：
   屋頂中調勿近黑、左上受光、石板縫結構雜訊、貼地斜影、無黑輪廓 ---------- */
function drawCastle() {
  const g = grid(64, 48);
  const C = {
    roofL: hsl(224, 26, 56), roofR: hsl(230, 24, 45), roofShade: hsl(238, 22, 40), ridge: hsl(223, 30, 64),
    wallL: hsl(220, 25, 72), wallR: hsl(230, 22, 60), wallEdge: hsl(235, 20, 48), seam: hsl(228, 18, 52),
    frame: hsl(243, 10, 22), frameLight: hsl(225, 10, 70), glass: hsl(215, 30, 32), glassHi: hsl(215, 35, 44),
    sill: hsl(237, 10, 50), sillHi: hsl(237, 14, 64),
    base: hsl(240, 18, 42),
    grass: hsl(105, 32, 30), grassHi: hsl(100, 36, 38), shade: hsl(105, 28, 21),
    door: hsl(24, 38, 32), doorHi: hsl(24, 42, 44), doorKnob: hsl(40, 56, 68), doorArch: hsl(20, 30, 22),
    chimney: hsl(0, 0, 18), chimneyHi: hsl(0, 0, 32),
    flag: hsl(2, 60, 46), flagPole: hsl(28, 28, 36),
    merlon: hsl(220, 26, 66), merlonHi: hsl(220, 30, 80),
  };
  // 左右塔（後層）：加粗加高 8px 塔身 + 錐頂（roofL/roofR 雙面 + 1px 亮脊）+ 塔頂雉堞圈 + 窗 + 錐頂小旗
  for (const tx of [13, 51]) {
    // 錐頂：apex y6 → 基底 y14
    fillPoly(g, [[tx, 6], [tx - 4, 14], [tx, 14]], C.roofL);
    fillPoly(g, [[tx, 6], [tx, 14], [tx + 4, 14]], C.roofR);
    rect(g, tx, 6, 1, 8, C.ridge);
    // 塔身：top 前緣 y14 → 底 y34
    fillPoly(g, [[tx - 4, 14], [tx, 18], [tx, 34], [tx - 4, 30]], C.wallL);
    fillPoly(g, [[tx, 18], [tx + 4, 14], [tx + 4, 30], [tx, 34]], C.wallR);
    rect(g, tx, 18, 1, 16, C.wallEdge);
    // 塔頂雉堞圈（y15–16：2px 垛 + 1px 口）
    for (let mx = tx - 4; mx <= tx + 2; mx += 3) {
      rect(g, mx, 15, 2, 2, C.merlon);
      rect(g, mx, 15, 2, 1, C.merlonHi);
    }
    win(g, tx, 24, 2, 3, C, false);
    flag(g, tx, 6, 5, C.flag, C.flagPole);
  }
  // 主樓（官方比例：大菱形屋頂 + 石板牆 + 草地 + 貼地斜影）
  ttTheo(g, 32, 6, 16, 7, 18, C);
  // 石板縫（每 ~4px 一橫縫 + 交錯 1px 直縫；只著色既有像素）
  for (const [sy, svx] of [[23, 22], [27, 26], [31, 22], [35, 26]]) {
    retint(g, 17, sy, 31, 1, C.seam);
    set(g, svx, sy + 1, C.seam);
  }
  // 主樓屋頂瓦排（左坡 2 條橫紋：亮/暗 ±6% 明度）
  retint(g, 19, 15, 12, 1, hsl(225, 26, 66));
  retint(g, 20, 11, 11, 1, hsl(232, 24, 38));
  // 前簷雉堞帶（本次最關鍵「城堡感」：前牆頂緣 y19–21、x18–45，垛2px+口1px，≥7 垛）＋左右角垛
  for (let mx = 18; mx <= 44; mx += 3) {
    rect(g, mx, 19, 2, 3, C.merlon);
    rect(g, mx, 19, 2, 1, C.merlonHi);
  }
  rect(g, 15, 18, 2, 3, C.merlon); rect(g, 15, 18, 2, 1, C.merlonHi);
  rect(g, 47, 18, 2, 3, C.merlon); rect(g, 47, 18, 2, 1, C.merlonHi);
  // 主樓窗（牆上，左亮右暗）
  win(g, 24, 24, 3, 4, C, false);
  win(g, 40, 24, 3, 4, C, true);
  // 拱門（5×7，cx=32，底貼牆底 y38；拱頂削兩角＋拱內暗影）＋門上氣窗＋門下兩階石階
  {
    const fx = 30, fy = 32;
    // 拱內暗影（進深）
    for (let y = fy; y <= 38; y++) {
      let x0 = fx, x1 = fx + 4;
      if (y === fy) { x0 = fx + 1; x1 = fx + 3; }
      for (let x = x0; x <= x1; x++) set(g, x, y, C.doorArch);
    }
    // 門板（拱內縮 1px）
    for (let y = fy + 1; y <= 37; y++) {
      let x0 = fx + 1, x1 = fx + 3;
      if (y === fy + 1) { x0 = fx + 2; x1 = fx + 2; }   // 拱心
      for (let x = x0; x <= x1; x++) set(g, x, y, C.door);
    }
    rect(g, fx + 1, fy + 1, 3, 1, C.doorHi);
    set(g, fx + 2, fy + 4, C.doorKnob);
    // 兩階石階（受光）
    rect(g, fx - 2, 39, 9, 1, C.sillHi);
    rect(g, fx - 1, 40, 7, 1, C.sill);
    rect(g, fx - 1, 40, 7, 1, C.sill);
    // 門上氣窗 2×2
    rect(g, 30, 29, 4, 3, C.frame);
    rect(g, 31, 30, 2, 2, C.glass);
    rect(g, 31, 30, 2, 1, C.glassHi);
  }
  // 脊旗
  flag(g, 32, 6, 5, C.flag, C.flagPole);
  speck(g, 11, 17, 21, 47, 30, C.wallL, [hsl(223, 20, 66), hsl(226, 18, 76)]);
  return { g, C };
}

/* ---------- 通用 32×32 建築（官方比例 v576：屋頂:牆 ≈ 2.4:1，牆只露 ~5px） ---------- */
function drawBuilding(cfg) {
  const g = grid(32, 32);
  const W = cfg.W || 11, D = cfg.D || 7, H = cfg.H || 5, ty = cfg.ty !== undefined ? cfg.ty : 1;
  const wh = cfg.wallHue, ws = cfg.wallSat;
  const C = {
    roofL: hsl(cfg.roofHue, cfg.roofSat, 34), roofR: hsl(cfg.roofHue + 8, cfg.roofSat - 6, 22), roofShade: hsl(cfg.roofHue + 10, cfg.roofSat - 8, 15), ridge: hsl(cfg.roofHue + 8, cfg.roofSat, 50),
    wallL: hsl(wh, ws, 62), wallR: hsl(wh + 12, ws - 2, 48), wallEdge: hsl(wh + 18, ws - 4, 34),
    frame: hsl(wh + 16, 10, 24), frameLight: hsl(wh + 8, 8, 72), glass: hsl(cfg.glassHue || 215, 30, 32), glassHi: hsl(cfg.glassHue || 215, 35, 44),
    sill: hsl(wh + 10, 10, 50), sillHi: hsl(wh + 12, 14, 64),
    base: hsl(wh + 20, 12, 38),
    grass: hsl(105, 32, 30), grassHi: hsl(100, 36, 38), shade: hsl(105, 28, 21),   // 黑 20% 疊草地 = 深綠（官方 step9）
    door: hsl(24, 42, 34), doorHi: hsl(24, 46, 46), doorKnob: hsl(40, 60, 72),
    chimney: hsl(0, 0, 18), chimneyHi: hsl(0, 0, 32),
    flag: hsl(2, 62, 48), flagPole: hsl(28, 30, 38),
  };
  if (cfg.custom) cfg.custom(g, C);
  else {
    ttTheo(g, 16, ty, W, D, H, C);
    if (cfg.windows) for (const [x, y, w2, h2, dk] of cfg.windows) win(g, x, y, w2, h2, C, dk);
    if (cfg.door !== false) door(g, cfg.doorCX || 16, cfg.doorBottom || (ty + 2 * D + H), cfg.doorW || 5, cfg.doorH || 5, C);
    if (cfg.chimney) chimney(g, cfg.chimney, ty + D, C);
    if (cfg.flag) flag(g, 16, ty + 3, 4, C.flag, C.flagPole);
    if (cfg.extras) cfg.extras(g, C);
    if (cfg.speck) speck(g, cfg.seed, 5, 15, 16, ty + 2 * D + H - 1, C.wallL, [C.sillHi, C.wallR]);
  }
  return { g, C };
}

/* ---------- 各建築（v576 官方比例配置：ty=1, D=7, H=5 → 牆底 y=20、門底 20） ---------- */
const BUILDINGS = {
  /* 公會：深紅大屋頂 + 米牆 + 大門 + 脊旗 */
  b_guild_iso: {
    wallHue: 38, wallSat: 22, roofHue: 14, roofSat: 50,
    doorW: 5, doorH: 5, doorCX: 16, flag: true,
    windows: [[9, 16, 3, 3, false], [23, 16, 3, 3, true]],
    seed: 21,
  },
  /* 訓練場：深藍大屋頂 + 木牆 + 寬門 */
  b_training_iso: {
    wallHue: 30, wallSat: 26, roofHue: 210, roofSat: 22,
    doorW: 6, doorH: 5, doorCX: 16,
    windows: [[8, 16, 3, 3, false], [24, 16, 3, 3, true]],
    seed: 22,
  },
  /* 圖書館：深藍屋頂 + 石牆 + 大窗 */
  b_library_iso: {
    wallHue: 40, wallSat: 14, roofHue: 225, roofSat: 26,
    doorW: 5, doorH: 5, doorCX: 16,
    windows: [[8, 15, 4, 4, false], [24, 15, 4, 4, true]],
    seed: 23,
  },
  /* 鐵匠鋪：深棕屋頂 + 暗牆 + 黑煙囪 + 爐火窗 */
  b_forge_iso: {
    wallHue: 225, wallSat: 10, roofHue: 28, roofSat: 24,
    doorW: 5, doorH: 5, doorCX: 16, chimney: 24,
    windows: [],
    seed: 24, extras: extrasForge,
  },
  /* 煉金坊：深綠屋頂 + 綠牆 + 藥瓶 + 綠窗 */
  b_alchemy_iso: {
    wallHue: 90, wallSat: 16, roofHue: 140, roofSat: 32, glassHue: 140,
    doorW: 5, doorH: 5, doorCX: 16,
    windows: [[9, 16, 3, 3, false], [23, 16, 3, 3, true]],
    seed: 25, extras: extrasAlchemy,
  },
  /* 市集：開放棚（無門）+ 條紋遮陽棚 + 攤台 */
  b_market_iso: {
    wallHue: 42, wallSat: 18, roofHue: 12, roofSat: 48, door: false,
    windows: [],
    seed: 26, extras: extrasMarket,
  },
  /* 祭壇：開放石台 + 聖火（custom） */
  b_altar_iso: { wallHue: 225, wallSat: 10, roofHue: 30, roofSat: 40, door: false, windows: [], custom: customAltar },
  /* 寶石坊：深紫屋頂 + 石牆 + 水晶 */
  b_gemworks_iso: {
    wallHue: 225, wallSat: 10, roofHue: 265, roofSat: 32,
    doorW: 5, doorH: 5, doorCX: 16,
    windows: [[9, 16, 3, 3, false], [23, 16, 3, 3, true]],
    seed: 28, extras: extrasGem,
  },
  /* 倉庫：深棕屋頂 + 木牆 + 雙門 */
  b_warehouse_iso: {
    wallHue: 28, wallSat: 22, roofHue: 32, roofSat: 28,
    doorW: 6, doorH: 5, doorCX: 16,
    windows: [[8, 16, 3, 3, false], [24, 16, 3, 3, true]],
    seed: 29,
  },
};

/* 鐵匠鋪：煙＋爐火窗 */
function extrasForge(g, C) {
  rect(g, 24, 2, 2, 2, hsl(0, 0, 70));
  rect(g, 25, 0, 2, 2, hsl(0, 0, 62));
  win(g, 9, 16, 3, 3, C, false);
  rect(g, 8, 16, 5, 3, hsl(26, 62, 52));
  rect(g, 8, 16, 5, 1, hsl(40, 78, 68));
}
/* 煉金坊：屋頂藥瓶 */
function extrasAlchemy(g, C) {
  rect(g, 14, 0, 4, 3, C.glass);
  rect(g, 13, -1, 6, 1, C.frame);
  rect(g, 14, 1, 4, 2, hsl(140, 42, 38));
}
/* 寶石坊：紫水晶簇 */
function extrasGem(g, C) {
  const cry = [hsl(265, 38, 54), hsl(265, 34, 66), hsl(275, 32, 46)];
  const pts = [[16, 0], [14, 3], [17, 2], [19, 4], [12, 4]];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    fillPoly(g, [[x, y + 3], [x - 1, y], [x + 1, y], [x + 1, y + 3]], cry[i % 3]);
  }
}
/* 市集：攤台＋遮陽棚＋支柱（屋頂下方，牆前） */
function extrasMarket(g, C) {
  rect(g, 7, 18, 5, 5, C.wallR);
  rect(g, 7, 18, 5, 1, C.wallL);
  rect(g, 20, 18, 5, 5, C.wallR);
  rect(g, 20, 18, 5, 1, C.wallL);
  for (const [x, y, c] of [[8, 19, hsl(12, 48, 48)], [10, 20, hsl(90, 38, 46)], [21, 19, hsl(48, 54, 54)], [23, 20, hsl(210, 38, 50)]]) {
    rect(g, x, y, 2, 2, c);
    rect(g, x, y, 2, 1, hsl(40, 30, 64));
  }
  for (let i = 0; i < 4; i++) {
    const x = 4 + i * 6;
    rect(g, x, 12, 3, 2, i % 2 ? hsl(12, 50, 76) : hsl(12, 54, 44));
  }
  rect(g, 6, 15, 1, 5, hsl(28, 28, 38));
  rect(g, 25, 15, 1, 5, hsl(28, 28, 38));
}
/* 祭壇：官方文法四部件（大屋頂＋石牆＋草地＋陰影）＋開放石台聖火 */
function customAltar(g, C) {
  ttTheo(g, 16, 1, 9, 6, 5, C);
  rect(g, 9, 17, 14, 3, C.wallL);
  rect(g, 9, 20, 14, 1, C.base);
  rect(g, 13, 14, 6, 3, C.wallL);
  rect(g, 13, 17, 6, 1, C.base);
  fillPoly(g, [[19, 14], [22, 13], [22, 16], [19, 17]], C.wallR);
  rect(g, 15, 12, 2, 2, C.ridge);
  fillPoly(g, [[16, 4], [13, 10], [19, 10]], hsl(28, 66, 58));
  fillPoly(g, [[16, 4], [14, 9], [18, 9]], hsl(42, 78, 68));
}

/* ---------- 民房 20×16（官方小屋縮影：大屋頂+小牆+草地+陰影） ---------- */
function drawHouse() {
  const g = grid(20, 16);
  const C = {
    roofL: hsl(12, 50, 34), roofR: hsl(20, 44, 22), roofShade: hsl(28, 40, 14), ridge: hsl(20, 54, 50),
    wallL: hsl(40, 18, 64), wallR: hsl(52, 16, 50), wallEdge: hsl(58, 14, 36),
    frame: hsl(56, 10, 24), frameLight: hsl(48, 8, 74), glass: hsl(215, 30, 32), glassHi: hsl(215, 35, 44),
    sill: hsl(50, 10, 50), sillHi: hsl(52, 14, 64),
    base: hsl(60, 12, 38),
    grass: hsl(105, 32, 30), grassHi: hsl(100, 36, 38), shade: hsl(105, 28, 21),
    door: hsl(24, 42, 34), doorHi: hsl(24, 46, 46), doorKnob: hsl(40, 60, 72),
    chimney: hsl(0, 0, 18), chimneyHi: hsl(0, 0, 32),
  };
  ttTheo(g, 10, 1, 6, 3, 4, C);
  win(g, 6, 8, 2, 3, C, false);
  win(g, 14, 8, 2, 3, C, true);
  door(g, 10, 11, 4, 4, C);
  chimney(g, 14, 4, C);
  speck(g, 31, 4, 9, 16, 12, C.wallL, [C.sillHi, C.wallR]);
  return { g, C };
}

/* ---------- 輸出 ---------- */
function emit() {
  const out = {};
  const keyAt = i => i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(97 + i - 26);
  function finalize(name, { g }) {
    const order = [];
    const seen = new Set();
    g.c.forEach(row => row.forEach(ch => { if (ch !== "." && !seen.has(ch)) { seen.add(ch); order.push(ch); } }));
    if (order.length > 52) throw new Error("palette keys exhausted: " + name + " (" + order.length + ")");
    const keyMap = {};
    order.forEach((hex, i) => { keyMap[hex] = keyAt(i); });
    const rowsK = g.c.map(row => row.map(ch => (ch === "." ? "." : keyMap[ch])).join(""));
    const pal = {};
    order.forEach((hex, i) => { pal[keyAt(i)] = hex; });
    out[name] = { w: g.w, h: g.h, rate: 0, rows: rowsK, pal };
  }
  finalize("b_castle_iso", drawCastle());
  for (const name in BUILDINGS) finalize(name, drawBuilding(BUILDINGS[name]));
  finalize("b_house_iso", drawHouse());
  return out;
}

/* ---------- 寫檔 ---------- */
const out = emit();
const lines = [
  "/* 放置王國 MEGA IDLE — iso 村莊建築 pixel art（v576 由 tools/gen-iso-art.cjs 生成）",
  "   官方規格（Theo 10-step 教學 t=1233 sample10 32×25 成品重新像素解碼）：大菱形四坡屋頂（佔~68%）＋",
  "   小牆（屋頂:牆≈2.4:1）＋完整菱形草地（左亮右暗）＋右下深綠陰影（黑 20% 覆蓋）＋亮側暗框/暗側亮框。",
  "   靜態 rows/pal，與 art/*.js 契約一致。重新生成：node tools/gen-iso-art.cjs */",
  '"use strict";',
  "MG.art = MG.art || {};",
  "MG.art.buildings_iso = {",
];
const names = Object.keys(out);
names.forEach((name, ni) => {
  const s = out[name];
  lines.push(`  ${name}: {`);
  lines.push(`    w: ${s.w}, h: ${s.h}, rate: 0,`);
  lines.push("    pal: " + JSON.stringify(s.pal) + ",");
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
