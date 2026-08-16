/* 放置王國 MEGA IDLE — iso 村莊建築 sprite 生成器（v569 TheoTown 2.5D 角度重作）
   修正：v564 的建築是「對稱 2:1 等角盒」（菱形四坡屋頂），與 TheoTown 建築角度不符 —
   TheoTown = 前牆垂直矩形（門窗直立）＋右側牆（2:1 斜）＋山牆屋頂（前坡+右坡、脊線）。
   村外地標（box/tri）已是此角度，村莊建築全面對齊重作。
   風格規則同 v564：低飽和（屋頂 sat 50-70%、牆 15-35%）、無黑輪廓（同系深階）、
   左上受光（左坡/前牆亮、右坡/側牆暗、脊線亮）、底部兩階漸暗、seeded 面雜訊。
   用法：node tools/gen-iso-art.cjs → 產出 js/data/art/buildings_iso.js */
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
      if (g.c[y] && g.c[y][x] === baseKey && rnd() < 0.16) {
        g.c[y][x] = speckKeys[(rnd() * speckKeys.length) | 0];
      }
    }
  }
}

/* ---------- TheoTown 2.5D 骨架（v569）
   前牆：矩形（垂直邊），x cx-W..cx+W，y top..top+H，亮
   右側牆：平行四邊形 (x1,top)→(xr,sTop)→(xr,sTop+H)→(x1,top+H)，2:1 斜，暗
   屋頂：山牆 — 前坡三角（左半亮右半亮）＋右坡四邊（暗）＋前脊亮
   roofStyle "gable" | "flat"（平台＋齒緣） */
function ttBox(g, cx, ty, W, D, H, cols, roofStyle) {
  const top = ty + D, sTop = top - Math.round(D / 2);
  const x0 = cx - W, x1 = cx + W, xr = x1 + D;
  if (roofStyle === "flat") {
    rect(g, x0 - 1, top - 3, W * 2 + D + 2, 2, cols.roofL);        // 平台
    rect(g, x0 - 1, top - 1, W * 2 + D + 2, 1, cols.roofR);        // 平台前緣暗
    rect(g, x0 - 1, top - 5, W * 2 + D + 2, 1, cols.ridge);        // 頂緣受光
    for (let i = 0; i < 5; i++) rect(g, x0 - 1 + i * 5, top - 5, 3, 2, cols.merlon);  // 齒緣
  } else {
    fillPoly(g, [[cx, ty], [x0, top], [cx, top]], cols.roofL);      // 前坡左半
    fillPoly(g, [[cx, ty], [cx, top], [x1, top]], cols.roofL);      // 前坡右半
    fillPoly(g, [[cx, ty], [cx + D, ty + Math.round(D / 2)], [xr, sTop], [x1, top]], cols.roofR); // 右坡
    rect(g, cx, ty, 1, top - ty, cols.ridge);                       // 前脊
    rect(g, cx - 1, ty, 2, 1, cols.ridge);
  }
  // 前牆＋側牆
  rect(g, x0, top, W * 2, H, cols.wallL);
  fillPoly(g, [[x1, top], [xr, sTop], [xr, sTop + H], [x1, top + H]], cols.wallR);
  // 屋檐陰影（前牆頂）
  rect(g, x0, top, W * 2, 1, cols.wallEdge);
  // 底兩階漸暗
  rect(g, x0 + 1, top + H - 1, W * 2 - 2, 1, cols.base);
  rect(g, x0 + 1, top + H, W * 2 - 2, 1, cols.baseHi);
  fillPoly(g, [[x1 + 1, top + H - 1], [xr, sTop + H - 1], [xr, sTop + H], [x1 + 1, top + H]], cols.base);
}

/* 矩形塔（城堡附屬）：前牆＋側牆＋錐頂 */
function tower(g, cx, ty, W, D, H, C) {
  const top = ty + D, sTop = top - Math.round(D / 2);
  const x0 = cx - W, x1 = cx + W, xr = x1 + D;
  fillPoly(g, [[cx - 3, top], [cx + 3, top], [cx, ty]], C.roofL);
  fillPoly(g, [[cx, top], [cx + 3, top], [cx, ty]], C.roofR);
  rect(g, cx - 1, ty, 2, 2, C.ridge);
  rect(g, x0, top, W * 2, H, C.wallL);
  fillPoly(g, [[x1, top], [xr, sTop], [xr, sTop + H], [x1, top + H]], C.wallR);
  rect(g, x0 + 1, top + H - 1, W * 2 - 2, 1, C.base);
  rect(g, x0 + 1, top + H, W * 2 - 2, 1, C.baseHi);
  win(g, cx, top + 8, 2, 3, C);
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

/* ---------- 城堡 64×48：主樓（大 gable）＋左右矩形塔＋雉堞＋大門＋旗 ---------- */
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
  // 左右塔（後層）：cx 14/50，錐頂 ty 8、塔身 top 12..32
  tower(g, 14, 8, 4, 4, 20, C);
  tower(g, 50, 8, 4, 4, 20, C);
  // 主樓：cx 32, ty 10, W 15, D 7, H 20 → 屋檐 17、前牆 17..37
  ttBox(g, 32, 10, 15, 7, 20, C, "gable");
  // 雉堞：屋檐線上方齒（前牆頂 5 齒）
  for (let i = 0; i < 6; i++) {
    const x = 18 + i * 5;
    rect(g, x, 15, 3, 2, C.merlon);
    rect(g, x, 15, 3, 1, C.merlonHi);
  }
  // 窗（前牆矩形上：直立）
  win(g, 24, 21, 3, 5, C);
  win(g, 40, 21, 3, 5, C);
  win(g, 32, 27, 3, 5, C);
  // 大門（前牆中央）
  door(g, 32, 37, 8, 11, C);
  // 主樓脊旗
  flag(g, 32, 10, 5, C.flag, C.flagPole);
  // 面雜訊
  speck(g, 11, 17, 18, 47, 36, C.wallL, [hsl(225, 20, 70), hsl(225, 10, 58)]);
  speck(g, 12, 48, 14, 54, 32, C.wallR, [hsl(225, 16, 56), hsl(225, 8, 44)]);
  speck(g, 13, 8, 14, 18, 32, C.wallL, [hsl(225, 20, 70), hsl(225, 10, 58)]);
  speck(g, 14, 8, 14, 18, 32, C.wallR, [hsl(225, 16, 56), hsl(225, 8, 44)]);
  speck(g, 15, 48, 14, 56, 32, C.wallL, [hsl(225, 20, 70), hsl(225, 10, 58)]);
  speck(g, 16, 48, 14, 56, 32, C.wallR, [hsl(225, 16, 56), hsl(225, 8, 44)]);
  return { g, C };
}

/* ---------- 通用 32×32 建築（TheoTown 2.5D：前牆矩形＋側牆＋山牆）
   cfg: { roofHue, roofSat, wallHue, wallSat, doorW, doorH, doorCX, doorBottom,
          windows:[[x,y,w,h]], seed, speckL, speckR, flag, chimney, custom, roofStyle,
          W, D, H, ty } */
function drawBuilding(cfg) {
  // 形體錨點:from 繼承已驗證建築的全部參數(形體/窗位/門位),覆蓋處僅換色票/飾件
  // — 新建築形體觀感直接複用「已驗證良好區」,不必憑空推導形體
  if (cfg.from) {
    const base = BUILDINGS[cfg.from];
    if (!base) throw new Error("from 錨點不存在: " + cfg.from);
    cfg = Object.assign({}, base, cfg);
  }
  const g = grid(cfg.w || 32, cfg.h || 32);
  const W = cfg.W || 10, D = cfg.D || 5, H = cfg.H || 13, ty = cfg.ty !== undefined ? cfg.ty : 8;
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
    merlon: hsl(cfg.wallHue, 16, 56),
  };
  if (cfg.custom) cfg.custom(g, C);
  else {
    ttBox(g, 16, ty, W, D, H, C, cfg.roofStyle);
    if (cfg.windows) for (const [x, y, w2, h2] of cfg.windows) win(g, x, y, w2, h2, C);
    if (cfg.door !== false) door(g, cfg.doorCX || 16, cfg.doorBottom || 26, cfg.doorW || 5, cfg.doorH || 8, C);
    if (cfg.chimney) chimney(g, cfg.chimney, ty + D, C);
    if (cfg.flag) flag(g, 16, ty, 4, C.flag, C.flagPole);
    if (cfg.extras) cfg.extras(g, C);
    if (cfg.speck) {
      speck(g, cfg.seed, 6, 14, 26, 25, C.wallL, cfg.speckL);
      speck(g, cfg.seed + 1, 26, 14, 32, 25, C.wallR, cfg.speckR);
    }
  }
  return { g, C };
}

/* ---------- 各建築（v569：窗/門直立於前牆矩形） ---------- */
const BUILDINGS = {
  /* 公會：紅瓦 + 米牆 + 大門 + 脊旗 */
  b_guild_iso: {
    roofHue: 14, roofSat: 60, wallHue: 38, wallSat: 28,
    doorW: 6, doorH: 9, doorCX: 16, doorBottom: 26, flag: true,
    windows: [[9, 17, 3, 4], [22, 17, 3, 4]],
    seed: 21, speckL: [hsl(38, 32, 72), hsl(38, 22, 60)], speckR: [hsl(38, 26, 58), hsl(38, 16, 46)],
  },
  /* 訓練場：平頂平台 + 齒緣 + 寬門 */
  b_training_iso: {
    roofHue: 210, roofSat: 18, wallHue: 30, wallSat: 34, roofStyle: "flat",
    doorW: 7, doorH: 9, doorCX: 16, doorBottom: 26,
    windows: [[8, 17, 2, 3], [23, 17, 2, 3]],
    seed: 22, speckL: [hsl(30, 38, 72), hsl(30, 28, 60)], speckR: [hsl(30, 32, 58), hsl(30, 22, 46)],
  },
  /* 圖書館：藍灰屋頂 + 石牆 + 大窗 */
  b_library_iso: {
    roofHue: 225, roofSat: 24, wallHue: 40, wallSat: 16,
    doorW: 5, doorH: 9, doorCX: 16, doorBottom: 26,
    windows: [[8, 15, 4, 6], [22, 15, 4, 6]],
    seed: 23, speckL: [hsl(40, 20, 74), hsl(40, 12, 62)], speckR: [hsl(40, 16, 60), hsl(40, 8, 48)],
  },
  /* 鐵匠鋪：暗石牆 + 煙囪煙 + 爐火窗 */
  b_forge_iso: {
    roofHue: 28, roofSat: 22, wallHue: 225, wallSat: 12,
    doorW: 5, doorH: 8, doorCX: 16, doorBottom: 25, chimney: 24,
    windows: [],
    seed: 24, speckL: [hsl(225, 16, 72), hsl(225, 8, 60)], speckR: [hsl(225, 12, 58), hsl(225, 6, 46)],
    extras: extrasForge,
  },
  /* 煉金坊：綠屋頂 + 藥瓶 + 綠窗 */
  b_alchemy_iso: {
    roofHue: 140, roofSat: 34, wallHue: 90, wallSat: 20, glassHue: 140,
    doorW: 5, doorH: 8, doorCX: 16, doorBottom: 25,
    windows: [[9, 17, 3, 4], [22, 17, 3, 4]],
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
  /* 祭壇：開放石台 + 聖火（custom 全自繪，2.5D 台階） */
  b_altar_iso: { roofHue: 30, roofSat: 46, wallHue: 225, wallSat: 14, door: false, windows: [], custom: customAltar },
  /* 寶石坊：屋頂紫水晶簇 */
  b_gemworks_iso: {
    roofHue: 265, roofSat: 34, wallHue: 225, wallSat: 14,
    doorW: 5, doorH: 8, doorCX: 16, doorBottom: 25,
    windows: [[9, 17, 3, 4], [22, 17, 3, 4]],
    seed: 28, speckL: [hsl(225, 18, 72), hsl(225, 10, 60)], speckR: [hsl(225, 14, 58), hsl(225, 8, 46)],
    extras: extrasGem,
  },
  /* 倉庫：大棕頂 + 雙門 + 側窗 */
  b_warehouse_iso: {
    roofHue: 32, roofSat: 28, wallHue: 28, wallSat: 28,
    doorW: 7, doorH: 9, doorCX: 16, doorBottom: 26,
    windows: [[8, 17, 3, 3], [22, 17, 3, 3]],
    seed: 29, speckL: [hsl(28, 32, 72), hsl(28, 22, 60)], speckR: [hsl(28, 26, 58), hsl(28, 16, 46)],
  },
};

/* 鐵匠鋪：煙（屋頂右坡上方）＋爐火窗（前牆大窗橙光） */
function extrasForge(g, C) {
  rect(g, 24, 5, 2, 2, hsl(0, 0, 70));
  rect(g, 25, 2, 2, 2, hsl(0, 0, 62));
  win(g, 10, 17, 3, 4, C);
  rect(g, 9, 17, 5, 4, hsl(26, 62, 52));
  rect(g, 9, 17, 5, 1, hsl(40, 78, 68));
}
/* 煉金坊：屋頂藥瓶（apex 上）＋綠液 */
function extrasAlchemy(g, C) {
  rect(g, 14, 3, 4, 4, C.glass);
  rect(g, 13, 2, 6, 1, C.frame);
  rect(g, 14, 4, 4, 2, hsl(140, 42, 38));
  rect(g, 15, 2, 2, 1, C.glassHi);
}
/* 寶石坊：紫水晶簇（apex 上方） */
function extrasGem(g, C) {
  const cry = [hsl(265, 38, 54), hsl(265, 34, 66), hsl(275, 32, 46)];
  const pts = [[16, 1], [14, 4], [17, 3], [19, 5], [12, 5]];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    fillPoly(g, [[x, y + 3], [x - 1, y], [x + 1, y], [x + 1, y + 3]], cry[i % 3]);
  }
}
/* 市集：攤台（前牆前）＋遮陽棚條紋＋支柱 */
function extrasMarket(g, C) {
  rect(g, 7, 20, 5, 6, hsl(38, 32, 50));
  rect(g, 7, 20, 5, 1, hsl(38, 36, 62));
  rect(g, 20, 20, 5, 6, hsl(38, 32, 50));
  rect(g, 20, 20, 5, 1, hsl(38, 36, 62));
  for (const [x, y, c] of [[8, 21, hsl(12, 48, 48)], [10, 22, hsl(90, 38, 46)], [21, 21, hsl(48, 54, 54)], [23, 22, hsl(210, 38, 50)]]) {
    rect(g, x, y, 2, 2, c);
    rect(g, x, y, 2, 1, hsl(40, 30, 64));
  }
  for (let i = 0; i < 4; i++) {
    const x = 4 + i * 6;
    rect(g, x, 15, 3, 2, i % 2 ? hsl(12, 50, 76) : hsl(12, 54, 44));
  }
  rect(g, 6, 17, 1, 5, hsl(28, 28, 38));
  rect(g, 25, 17, 1, 5, hsl(28, 28, 38));
}
/* 祭壇：2.5D 石台（前牆矩形兩階＋側牆）＋聖火 */
function customAltar(g, C) {
  rect(g, 6, 22, 20, 4, C.wallL);                    // 下台
  rect(g, 6, 25, 20, 1, C.base);
  fillPoly(g, [[26, 22], [31, 20], [31, 24], [26, 26]], C.wallR);
  rect(g, 9, 17, 14, 5, C.wallL);                    // 上台
  rect(g, 9, 21, 14, 1, C.base);
  fillPoly(g, [[23, 17], [27, 16], [27, 20], [23, 21]], C.wallR);
  rect(g, 15, 15, 2, 2, C.ridge);                    // 台面飾紋
  fillPoly(g, [[16, 6], [13, 12], [19, 12]], hsl(28, 66, 58));   // 聖火
  fillPoly(g, [[16, 6], [14, 11], [18, 11]], hsl(42, 78, 68));
  speck(g, 27, 7, 22, 25, 24, C.wallL, [hsl(225, 18, 72), hsl(225, 10, 60)]);
}

/* ---------- 民房 20×16（TheoTown 小屋：前牆＋側牆＋山牆） ---------- */
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
  ttBox(g, 10, 5, 6, 3, 8, C, "gable");   // apex 5、屋檐 8、前牆 4..16 × y 8..16
  win(g, 7, 10, 2, 3, C);
  win(g, 13, 10, 2, 3, C);
  door(g, 10, 16, 4, 6, C);
  chimney(g, 15, 8, C);
  speck(g, 31, 4, 9, 16, 15, C.wallL, [hsl(40, 26, 74), hsl(40, 16, 62)]);
  speck(g, 32, 16, 8, 19, 15, C.wallR, [hsl(40, 20, 60), hsl(40, 10, 48)]);
  return { g, C };
}

/* ---------- 輸出 ---------- */
function emit() {
  const out = {};
  const keyAt = i => i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(97 + i - 26);
  function finalize(name, { g, C }) {
    const order = [];
    const seen = new Set();
    g.c.forEach(row => row.forEach(ch => { if (ch !== "." && !seen.has(ch)) { seen.add(ch); order.push(ch); } }));
    if (order.length > 52) throw new Error("palette keys exhausted: " + name + " (" + order.length + ")");
    const keyMap = {};
    order.forEach((hex, i) => { keyMap[hex] = keyAt(i); });
    const rowsK = g.c.map(row => row.map(ch => (ch === "." ? "." : keyMap[ch])).join(""));
    const pal = {};
    order.forEach((hex, i) => { pal[keyAt(i)] = hex; });
    // R4 光源驗證樣本:牆面色票(drawBuilding/drawCastle/drawHouse 的 C 帶 wallL/wallR)
    const wallL = C && C.wallL && C.wallL.startsWith("#") ? C.wallL : null;
    const wallR = C && C.wallR && C.wallR.startsWith("#") ? C.wallR : null;
    out[name] = { w: g.w, h: g.h, rate: 0, rows: rowsK, pal, wallL, wallR };
  }
  finalize("b_castle_iso", drawCastle());
  for (const name in BUILDINGS) finalize(name, drawBuilding(BUILDINGS[name]));
  finalize("b_house_iso", drawHouse());
  return out;
}

/* ---------- 寫檔 ---------- */
const out = emit();

/* ---------- TheoTown 規則自動驗收(R1-R4) — 任一 FAIL 不寫檔 ---------- */
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
  // R4 光源(色票級):牆面左亮右暗 — 繪製以 wallL/wallR 著色,驗色定義即驗結構
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
  "/* 放置王國 MEGA IDLE — iso 村莊建築 pixel art（v569 由 tools/gen-iso-art.cjs 生成）",
  "   TheoTown 2.5D 角度：前牆矩形＋右側牆（2:1 斜）＋山牆屋頂；低飽和、無黑輪廓、",
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
