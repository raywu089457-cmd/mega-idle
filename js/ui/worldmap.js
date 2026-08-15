/* 放置王國 MEGA IDLE — 開放世界大地圖（v271・A1-3 落地）：1600×1000 世界、480×320 視口、
   拖曳捲動＋邊緣方向鈕、靜態地形 chunk 惰性烘焙、19 座入口（10 狩獵區＋9 模式地標）。
   確定性契約：全模組無 Math.random，雜訊一律以全球世界座標經 render.hsh 推導（跨 chunk 接縫無痕）。
   reducedMotion：入口呼吸光暈恆亮、旗幟固定幀。
   battle.js / 存檔 schema 零觸碰；既有王國分頁 DOM 由其自行改寫。 */
"use strict";
MG.ui = MG.ui || {};
MG.ui.worldmap = (function () {
  const hsh = MG.ui.render.hsh;
  const S = () => MG.game.state;
  const draw = MG.ui.render.draw;
  const WORLD = { w: 1600, h: 1000 };
  const VILLAGE = { x: 560, y: 400, w: 480, h: 200 };
  const VIEW = { w: 480, h: 320 };
  const CHUNK = { w: 400, h: 250 };
  const CX = WORLD.w / 2, CY = WORLD.h / 2;
  const PAN_STEP = 140;
  const cam = { x: 560, y: 340 }; // 初始：村莊置中（VILLAGE.x 於螢幕 x0、y 偏移 60）
  const chunks = {};
  let bakeCount = 0;
  let badgeSnap = null, badgeAt = 0;
  const STONE = "#3a3442", STONE_IN = "#2b2735", HOLE = "#0c0e1a";

  /* ---- 狩獵區落座（色票：REGION_THEME[palIdx] 夜色壓暗 — base=ground×0.45+#141524×0.55、
          mid=ground×0.6+#141524×0.4、acc=accent×0.55+#141524×0.45；由 K3 規劃核對 config.js） ---- */
  const HUNTS = [
    { id: "grass",   name: "翠綠草原", x: 810,  y: 800, seed: 41, r: 130, base: "#2d492e", mid: "#365b34", acc: "#95845b", prop: "tuft" },
    { id: "forest",  name: "幽暗森林", x: 1180, y: 640, seed: 43, r: 135, base: "#232f26", mid: "#283828", acc: "#5d8452", prop: "trees" },
    { id: "cave",    name: "灰燼洞穴", x: 830,  y: 180, seed: 45, r: 115, base: "#26262d", mid: "#2c2c32", acc: "#955d39", prop: "ash" },
    { id: "volcano", name: "烈焰火山", x: 250,  y: 200, seed: 47, r: 125, base: "#2c1e1e", mid: "#34211d", acc: "#956c42", prop: "ember" },
    { id: "glacier", name: "冰封高原", x: 1200, y: 140, seed: 49, r: 120, base: "#6f7780", mid: "#8b97a1", acc: "#4e778f", prop: "snow" },
    { id: "desert",  name: "黃沙荒漠", x: 160,  y: 540, seed: 51, r: 125, base: "#654e33", mid: "#80643a", acc: "#958870", prop: "dune" },
    { id: "swamp",   name: "詛咒沼澤", x: 380,  y: 870, seed: 53, r: 120, base: "#202c25", mid: "#243427", acc: "#5d955b", prop: "water" },
    { id: "tower",   name: "蒼穹之塔", x: 1360, y: 350, seed: 55, r: 115, base: "#25233d", mid: "#2b2848", acc: "#6a559b", prop: "spire" },
    { id: "abyss",   name: "深淵裂谷", x: 1300, y: 840, seed: 57, r: 125, base: "#1e1323", mid: "#211325", acc: "#953c5b", prop: "crack" },
    { id: "mythos",  name: "神話之域", x: 640,  y: 90,  seed: 59, r: 120, base: "#74695a", mid: "#93856e", acc: "#95959b", prop: "star" }
  ];
  /* ---- 模式地標（gate 返回 null = 無門檻；badge key 對照 badges.js） ---- */
  const MODES = [
    { id: "arena",     name: "競技場",   x: 1120, y: 470, seed: 61, shape: "ring",   gate: null,                                    badge: "arena" },
    { id: "royal",     name: "王者競技場", x: 1060, y: 360, seed: 63, shape: "podium", gate: () => (S().kingdom.level || 1) >= 12,     badge: "royal" },
    { id: "dungeon",   name: "試煉秘境", x: 480,  y: 660, seed: 65, shape: "stele",   gate: null,                                    badge: "dungeon" },
    { id: "worldboss", name: "世界首領", x: 1060, y: 740, seed: 67, shape: "bone",    gate: null,                                    badge: "worldboss" },
    { id: "tower",     name: "元素試煉塔", x: 1310, y: 300, seed: 69, shape: "spire",  gate: null,                                    badge: "tower" },
    { id: "maze",      name: "奇境迷宮", x: 470,  y: 150, seed: 71, shape: "hedge",   gate: () => (S().kingdom.level || 1) >= 14,     badge: "maze" },
    { id: "guild",     name: "公會盛宴", x: 530,  y: 470, seed: 73, shape: "hall",    gate: null,                                    badge: null },
    { id: "events",    name: "限時活動", x: 950,  y: 620, seed: 75, shape: "notice",  gate: null,                                    badge: "events" },
    { id: "abyss",     name: "無盡深淵", x: 1380, y: 880, seed: 77, shape: "stairs",  gate: () => !!(MG.sys.abyss && MG.sys.abyss.unlocked()), badge: "abyss" },
    { id: "exped",     name: "委託遠征營", x: 350, y: 320, seed: 79, shape: "camp",    gate: () => (S().kingdom.level || 1) >= 16,                badge: "exped" } // v273：遠征營世界地標（Lv16 gate＋soft 藍點）
  ];
  const ENTRANCES = [
    ...HUNTS.map(h => ({ kind: "hunt", ...h })),
    ...MODES.map(m => ({ kind: "mode", ...m }))
  ];
  const GATES = { E: [1040, 500], W: [560, 500], S: [800, 600], N: [800, 400] };

  /* ---- 確定性輔助 ---- */
  function nearestGate(x, y) {
    let best = "E", bd = Infinity;
    for (const k of Object.keys(GATES)) {
      const [gx, gy] = GATES[k];
      const d = (gx - x) * (gx - x) + (gy - y) * (gy - y);
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }
  /* 道路折線（村莊四門 → 各入口，hsh 蜿蜒）：烘焙時逐段繪製（3px 現有路色）
     D4：起點含村莊門座標（原 t=1/6 起跳 — 村莊邊緣到道路起點留 13-67px 空洞） */
  const ROADS = [];
  (function buildRoads() {
    for (const e of ENTRANCES) {
      const [gx, gy] = GATES[nearestGate(e.x, e.y)];
      const segs = [[gx, gy]];
      const n = 6, ph = e.seed * 3 + 1;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        const bx = gx + (e.x - gx) * t;
        const by = gy + (e.y - gy) * t;
        const sway = Math.round((hsh(i + ph, 17) % 7) - 3);
        segs.push([Math.round(bx) + sway, Math.round(by) + (i % 2 ? sway : 0)]);
      }
      segs.push([e.x, e.y]);
      ROADS.push(segs);
    }
  })();

  /* ---- 相機 ---- */
  function clampCam() {
    cam.x = Math.min(Math.max(0, Math.round(cam.x)), WORLD.w - VIEW.w);
    cam.y = Math.min(Math.max(0, Math.round(cam.y)), WORLD.h - VIEW.h);
  }
  function panBy(dx, dy) { cam.x += dx; cam.y += dy; clampCam(); }
  function centerHome() { cam.x = VILLAGE.x; cam.y = VILLAGE.y - 60; clampCam(); }
  function camPos() { return { x: cam.x, y: cam.y }; }
  /* ---- v273 導航：jumpTo/nearestLabel/drawMinimap（小地圖＋位置感知 — 純計算零隨機） ---- */
  function jumpTo(wx, wy) {
    cam.x = Math.round(wx - VIEW.w / 2);
    cam.y = Math.round(wy - VIEW.h / 2);
    clampCam();
  }
  /* 視口中心最近入口名（breadcrumb「世界地圖・翠綠草原」；村莊帶內回「王國村莊」） */
  function nearestLabel() {
    const cx = cam.x + VIEW.w / 2, cy = cam.y + VIEW.h / 2;
    if (cx >= VILLAGE.x && cx <= VILLAGE.x + VILLAGE.w && cy >= VILLAGE.y && cy <= VILLAGE.y + VILLAGE.h) return "王國村莊";
    let best = null, bd = Infinity;
    for (const e of ENTRANCES) {
      const d = (e.x - cx) * (e.x - cx) + (e.y - cy) * (e.y - cy);
      if (d < bd) { bd = d; best = e; }
    }
    return best ? "世界地圖・" + best.name : "世界地圖";
  }
  const MINI = { w: 96, h: 60 };
  /* 小地圖：1600×1000 縮影 96×60 — 底色/村莊金框/19 入口色點/視口框；確定性（呼吸用 t 參數） */
  function drawMinimap(ctx, t) {
    const rm = !!(S().settings && S().settings.reducedMotion);
    const sx = WORLD.w / MINI.w, sy = WORLD.h / MINI.h;
    ctx.fillStyle = "#10131f";
    ctx.fillRect(0, 0, MINI.w, MINI.h);
    // 村莊金框
    ctx.fillStyle = "rgba(232,216,168,0.25)";
    ctx.fillRect(Math.round(VILLAGE.x / sx) - 1, Math.round(VILLAGE.y / sy) - 1, Math.round(VILLAGE.w / sx) + 2, Math.round(VILLAGE.h / sy) + 2);
    ctx.fillStyle = "#e8d8a8";
    ctx.fillRect(Math.round(VILLAGE.x / sx), Math.round(VILLAGE.y / sy), Math.max(1, Math.round(VILLAGE.w / sx)), Math.max(1, Math.round(VILLAGE.h / sy)));
    // 入口色點
    for (const e of ENTRANCES) {
      const mx = Math.round(e.x / sx), my = Math.round(e.y / sy);
      ctx.fillStyle = e.kind === "hunt" ? e.acc : "#e8d8a8";
      ctx.fillRect(mx, my, 2, 2);
    }
    // 視口框（呼吸 1px 微亮 — rm 恆亮）
    const vx = Math.round(cam.x / sx), vy = Math.round(cam.y / sy), vw = Math.round(VIEW.w / sx), vh = Math.round(VIEW.h / sy);
    ctx.fillStyle = "rgba(255,209,102," + (rm ? 0.5 : 0.35 + 0.12 * (0.5 + 0.5 * Math.sin(t * 2))) + ")";
    ctx.fillRect(vx, vy, vw, vh);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(vx, vy, vw, 1);
    ctx.fillRect(vx, vy + vh - 1, vw, 1);
    ctx.fillRect(vx, vy, 1, vh);
    ctx.fillRect(vx + vw - 1, vy, 1, vh);
  }

  /* ---- 入口命中（44×44 觸控下限） ---- */
  function hitEntrance(wx, wy) {
    for (const e of ENTRANCES) {
      if (Math.abs(wx - e.x) <= 22 && Math.abs(wy - e.y) <= 22) return e;
    }
    return null;
  }
  function lockedOf(e) {
    if (e.kind === "hunt") {
      const i = MG.data.monsters.regions.findIndex(r => r.id === e.id);
      return i > (S().stats.maxRegionReached || 0);
    }
    return e.gate ? !e.gate() : false;
  }
  function actionOf(e) {
    if (e.kind === "hunt") {
      const i = MG.data.monsters.regions.findIndex(r => r.id === e.id);
      MG.ui.hunt.gotoMonster(i, 1, true); // v273FIX：地圖入口標記（hunt 顯示回大地圖鈕 — 圖鑑深鏈不傳）
      return;
    }
    // D7：鎖定地標點擊 → 地圖側 toast（原直開 open* — 深淵等鎖定時開出空狀態 modal，與 hunt 入口 toast 契約不一致）
    if (lockedOf(e)) {
      const hint = { royal: "王者競技場需王國 Lv12", maze: "奇境迷宮需王國 Lv14", abyss: "深淵尚未開啟（攻略第 5 區域後解鎖）" }[e.id]
        || e.name + " 尚未開啟";
      MG.ui.dom.toast(hint, "bad", "icon_lock");
      return;
    }
    const M = MG.ui.more;
    const map = { arena: M.openArena, royal: M.openRoyal, dungeon: M.openDungeon, worldboss: M.openWorldboss, tower: M.openTower, maze: M.openMaze, guild: M.openGuild, events: M.openEvents, abyss: M.openAbyss, exped: M.openExpedition }; // v273 遠征營地標
    (map[e.id] || (() => {})).call(M);
  }

  /* ---- 地形烘焙 ---- */
  function paintChunk(col, row) {
    const x0 = col * CHUNK.w, y0 = row * CHUNK.h;
    const c = document.createElement("canvas");
    c.width = CHUNK.w; c.height = CHUNK.h;
    const g = c.getContext("2d");
    // L0 世界底色（外圍草）
    g.fillStyle = "#1e2434";
    g.fillRect(0, 0, CHUNK.w, CHUNK.h);
    // 遠景環：外緣 50px 壓暗
    const dark = (x, y, w, h) => {
      if (x < WORLD.w && y < WORLD.h && x + w > 0 && y + h > 0) {
        g.fillStyle = "#1a1d2e";
        g.fillRect(Math.max(0, x - x0), Math.max(0, y - y0), Math.min(w, CHUNK.w), Math.min(h, CHUNK.h));
      }
    };
    if (col === 0) dark(0, 0, 50, WORLD.h);
    if (col === 3) dark(WORLD.w - 50, 0, 50, WORLD.h);
    if (row === 0) dark(0, 0, WORLD.w, 50);
    if (row === 3) dark(0, WORLD.h - 50, WORLD.w, 50);
    // 北緣山脈剪影（render.js 山巒 4 級語彙 — 全球座標 hsh）
    if (row === 0) {
      for (let mx = 0; mx < 8; mx++) {
        const rnd = hsh(mx, 101);
        const cx = 60 + mx * 210 + ((rnd >> 4) % 80);
        const halfW = 60 + (rnd % 50);
        const ht = 24 + ((rnd >> 8) % 26);
        for (let dy = -ht; dy <= 0; dy += 2) {
          const y = 50 + dy;
          const hw = Math.max(1, Math.round(halfW * Math.sqrt(1 - Math.pow(dy / ht, 2))));
          g.fillStyle = dy < -ht * 0.55 ? "#20243a" : (dy < -ht * 0.25 ? "#1b1e30" : "#171a29");
          g.fillRect(cx - hw - x0, y - y0, hw * 2 + 1, 2);
        }
      }
    }
    // 農田自然帶（r 260-420 不規則田塊＋樹叢 — A2 語彙：hsh 抖邊、禁整齊矩形）
    const d2c = (x, y) => Math.sqrt((x - CX) * (x - CX) + (y - CY) * (y - CY));
    for (let i = 0; i < 64; i++) {
      const r1 = hsh(i, 201);
      const ang = (i / 64) * Math.PI * 2 + ((r1 % 5) - 2) * 0.06;
      const rad = 300 + (hsh(i + 7, 201) % 120);
      const fx = Math.round(CX + Math.cos(ang) * rad);
      const fy = Math.round(CY + Math.sin(ang) * rad);
      if (fx < x0 - 24 || fx >= x0 + CHUNK.w + 24 || fy < y0 - 24 || fy >= y0 + CHUNK.h + 24) continue; // D5：±24 邊距（原零邊距 — 田塊在 chunk 接縫被硬切）
      const bw = 8 + (hsh(i + 13, 201) % 14), bh = 6 + (hsh(i + 19, 201) % 8);
      g.fillStyle = (hsh(i + 31, 201) % 3 === 0) ? "#33302a" : "#232a3d";
      g.fillRect(fx - x0 - Math.floor(bw / 2), fy - y0 - Math.floor(bh / 2), bw, bh);
      if (g.fillStyle === "#33302a") { // 田塊緣 1px 抖邊
        g.fillStyle = "#2b2a30";
        g.fillRect(fx - x0 - Math.floor(bw / 2) - 1 + (hsh(i + 41, 201) % 2), fy - y0 - Math.floor(bh / 2), bw, 1);
      }
    }
    // 果園/樹叢（叢生 — 疏密有致）
    for (let i = 0; i < 22; i++) {
      const r1 = hsh(i, 203);
      const ang = (i / 22) * Math.PI * 2 + ((r1 % 5) - 2) * 0.09;
      const rad = 270 + (hsh(i + 5, 203) % 130);
      const fx = Math.round(CX + Math.cos(ang) * rad);
      const fy = Math.round(CY + Math.sin(ang) * rad);
      if (fx < x0 - 20 || fx >= x0 + CHUNK.w + 20 || fy < y0 - 20 || fy >= y0 + CHUNK.h + 20) continue;
      draw(g, (r1 % 2) ? "deco_tree1" : "deco_tree2", fx - x0, fy - y0, 1, { scale: 0.55 + (hsh(i + 9, 203) % 4) * 0.1 });
    }
    // 冒險帶：狩獵區地形塊（不規則團 — 逐 2px 行、hsh 半寬/色階）
    for (const h of HUNTS) {
      const r = h.r;
      if (h.x + r + 10 < x0 || h.x - r - 10 >= x0 + CHUNK.w || h.y + r + 10 < y0 || h.y - r - 10 >= y0 + CHUNK.h) continue;
      for (let dy = -r; dy <= r; dy += 2) {
        const base = Math.sqrt(1 - Math.pow(dy / r, 2));
        const hw = Math.max(1, Math.round(base * r * (0.78 + (hsh(h.seed + dy, 205) % 40) / 100)));
        const y = h.y + dy;
        const x1 = Math.max(x0, h.x - hw), x2 = Math.min(x0 + CHUNK.w, h.x + hw);
        if (y < y0 || y >= y0 + CHUNK.h || x2 <= x1) continue;
        // D6：中/底色階分界逐列抖動（原 |dy|<r*0.55 硬緯線 — 每區一條水平直帶）
        const midR = r * (0.45 + (hsh(h.seed + dy * 3, 207) % 25) / 100);
        const useMid = Math.abs(dy) < midR;
        g.fillStyle = useMid ? h.mid : h.base;
        g.fillRect(x1 - x0, y - y0, x2 - x1, 2);
        if (dy % 6 === 0 && hsh(h.seed + dy + 99, 205) % 3 === 0) { // 外緣 1px 過渡（2-3 級色階）
          g.fillStyle = "#1e2434";
          g.fillRect(x1 - x0, y - y0, 1, 2);
          g.fillRect(x2 - x0 - 1, y - y0, 1, 2);
        }
      }
      // 區主題小物
      const px = h.x, py = h.y + h.r * 0.55;
      if (h.prop === "tuft") {
        for (let k = 0; k < 8; k++) {
          const tx = px - h.r * 0.6 + (hsh(k, h.seed + 1) % (h.r * 1.2));
          const ty = py - h.r * 0.3 + (hsh(k + 5, h.seed + 1) % (h.r * 0.6));
          g.fillStyle = "#3a5c3c"; g.fillRect(tx - x0, ty - y0, 2, 1);
        }
      } else if (h.prop === "trees") {
        for (let k = 0; k < 6; k++) {
          const tx = px - h.r * 0.55 + (hsh(k, h.seed + 1) % (h.r * 1.1));
          const ty = py - h.r * 0.4 + (hsh(k + 3, h.seed + 1) % (h.r * 0.5));
          draw(g, (k % 2) ? "deco_tree2" : "deco_tree1", tx - x0, ty - y0, 1, { scale: 0.7 + (hsh(k + 7, h.seed + 1) % 3) * 0.1 });
        }
      } else if (h.prop === "ash" || h.prop === "ember") {
        for (let k = 0; k < 10; k++) {
          const tx = px - h.r * 0.6 + (hsh(k, h.seed + 1) % (h.r * 1.2));
          const ty = py - h.r * 0.3 + (hsh(k + 5, h.seed + 1) % (h.r * 0.6));
          g.fillStyle = h.prop === "ember" ? "#ff9a4d" : "#3a3a44";
          g.fillRect(tx - x0, ty - y0, 1, 1);
        }
      } else if (h.prop === "snow" || h.prop === "star") {
        for (let k = 0; k < 12; k++) {
          const tx = px - h.r * 0.6 + (hsh(k, h.seed + 1) % (h.r * 1.2));
          const ty = py - h.r * 0.3 + (hsh(k + 5, h.seed + 1) % (h.r * 0.6));
          g.fillStyle = h.prop === "star" ? "#e8e8f0" : "#b8c4d0";
          g.fillRect(tx - x0, ty - y0, 1, 1);
        }
      } else if (h.prop === "dune" || h.prop === "crack") {
        for (let k = 0; k < 5; k++) {
          const tx = px - h.r * 0.6 + (hsh(k, h.seed + 1) % (h.r * 1.2));
          const ty = py - h.r * 0.3 + (hsh(k + 5, h.seed + 1) % (h.r * 0.6));
          g.fillStyle = h.prop === "crack" ? "#0c0e1a" : "#8a7448";
          g.fillRect(tx - x0, ty - y0, 6 + (hsh(k + 9, h.seed + 1) % 5), 1);
        }
      } else if (h.prop === "water") {
        for (let k = 0; k < 8; k++) {
          const tx = px - h.r * 0.6 + (hsh(k, h.seed + 1) % (h.r * 1.2));
          const ty = py - h.r * 0.3 + (hsh(k + 5, h.seed + 1) % (h.r * 0.6));
          g.fillStyle = "#2a3d68"; g.fillRect(tx - x0, ty - y0, 2, 1);
        }
      } else if (h.prop === "spire") {
        g.fillStyle = "#2b2848";
        g.fillRect(px - 3 - x0, py - 34 - y0, 6, 34);
        g.fillRect(px - 5 - x0, py - 40 - y0, 10, 8);
        g.fillStyle = "#6a559b";
        g.fillRect(px - 1 - x0, py - 38 - y0, 2, 2);
      }
    }
    // 道路（烘焙層 — 逐點 3px 寬 #2b3046 現有路色；對角段以線步進避免矩形填滿；D9：段級 bbox 預裁）
    for (const segs of ROADS) {
      for (let i = 0; i < segs.length - 1; i++) {
        const [ax, ay] = segs[i], [bx, by] = segs[i + 1];
        const sx1 = Math.min(ax, bx) - 1, sx2 = Math.max(ax, bx) + 1;
        const sy1 = Math.min(ay, by) - 1, sy2 = Math.max(ay, by) + 1;
        if (sx2 < x0 || sx1 >= x0 + CHUNK.w || sy2 < y0 || sy1 >= y0 + CHUNK.h) continue; // D9
        const len = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
        for (let k = 0; k <= len; k++) {
          const px = Math.round(ax + (bx - ax) * k / len);
          const py = Math.round(ay + (by - ay) * k / len);
          if (px < x0 - 1 || px >= x0 + CHUNK.w + 1 || py < y0 - 1 || py >= y0 + CHUNK.h + 1) continue;
          g.fillRect(px - x0, py - y0, 3, 3);
        }
      }
    }
    // 入口靜態石框／地標本體（動態光暈/鎖/紅點由 drawEntrances 疊）
    for (const e of ENTRANCES) {
      const bx = e.x, by = e.y;
      if (bx + 24 < x0 || bx - 24 >= x0 + CHUNK.w || by + 24 < y0 || by - 24 >= y0 + CHUNK.h) continue;
      if (e.kind === "hunt") {
        g.fillStyle = STONE; g.fillRect(bx - 7 - x0, by + 4 - y0, 14, 6);
        g.fillRect(bx - 4 - x0, by - y0, 8, 4);
        g.fillStyle = STONE_IN; g.fillRect(bx - 5 - x0, by + 5 - y0, 10, 4);
        g.fillStyle = HOLE; g.fillRect(bx - 4 - x0, by + 3 - y0, 8, 6);
        g.fillStyle = e.acc; g.fillRect(bx - 1 - x0, by + 5 - y0, 2, 2);
      } else {
        const sh = (rx, ry, w, h, col) => { g.fillStyle = col; g.fillRect(rx - x0, ry - y0, w, h); };
        if (e.shape === "ring") { sh(bx - 10, by - 6, 20, 12, "#5a5a68"); sh(bx - 8, by - 4, 16, 8, "#8a8468"); }
        else if (e.shape === "podium") { sh(bx - 8, by - 5, 16, 10, "#6a5a2a"); sh(bx - 6, by - 3, 12, 6, "#d8b45a"); sh(bx - 1, by - 12, 2, 9, "#5c4a34"); }
        else if (e.shape === "stele") { sh(bx - 6, by - 8, 12, 16, "#4a4a58"); sh(bx - 4, by - 6, 8, 12, "#6a6a78"); sh(bx - 10, by + 8, 20, 4, "#3a3a48"); }
        else if (e.shape === "bone") { sh(bx - 8, by - 5, 16, 10, "#5a5a66"); sh(bx - 10, by - 2, 20, 4, "#c8c4b8"); sh(bx - 4, by - 9, 8, 4, "#7a5a3a"); }
        else if (e.shape === "spire") { sh(bx - 4, by - 28, 8, 28, "#3a3558"); sh(bx - 6, by - 34, 12, 8, "#4a4470"); sh(bx - 1, by - 32, 2, 2, "#8a7ac0"); }
        else if (e.shape === "hedge") { sh(bx - 7, by - 7, 14, 14, "#2a3d2a"); sh(bx - 4, by - 4, 8, 8, "#3a553a"); sh(bx - 1, by - 9, 2, 5, "#5c4a34"); }
        else if (e.shape === "hall") { sh(bx - 8, by - 6, 16, 12, "#4a3a2a"); sh(bx - 5, by - 4, 10, 8, "#6a4a2a"); sh(bx - 1, by - 12, 2, 8, "#5c4a34"); sh(bx - 3, by - 16, 6, 4, "#b8433f"); }
        else if (e.shape === "notice") { sh(bx - 5, by - 7, 10, 14, "#4a3a28"); sh(bx - 1, by - 12, 2, 6, "#5c4a34"); sh(bx - 6, by - 16, 12, 4, "#e8a28c"); }
        else if (e.shape === "stairs") { for (let k = 0; k < 4; k++) sh(bx - 8 + k * 2, by + 4 - k * 3, 16 - k * 4, 3, "#3a2a3a"); }
        else if (e.shape === "camp") { // v273 遠征營帳篷（三角篷＋旗桿 — sh 語彙）
          sh(bx - 7, by - 8, 14, 10, "#3d3a4a"); sh(bx - 5, by - 6, 10, 8, "#6a5a4a"); sh(bx - 3, by - 4, 6, 6, "#a89878");
          sh(bx - 1, by - 14, 2, 8, "#5c4a34"); sh(bx + 1, by - 14, 5, 3, "#b8433f"); sh(bx - 1, by - 14, 5, 1, "#e8a28c");
        }
      }
    }
    chunks[col + row * 4] = c;
    bakeCount++;
  }
  function chunkFor(col, row) {
    const key = col + row * 4;
    if (!chunks[key]) paintChunk(col, row);
    return chunks[key];
  }
  /* 地面層：底色 + 可見 chunk（≤6 次 drawImage） */
  function drawGround(ctx) {
    ctx.fillStyle = "#1e2434";
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    const c0 = Math.max(0, Math.floor(cam.x / CHUNK.w));
    const c1 = Math.min(3, Math.floor((cam.x + VIEW.w - 1) / CHUNK.w));
    const r0 = Math.max(0, Math.floor(cam.y / CHUNK.h));
    const r1 = Math.min(3, Math.floor((cam.y + VIEW.h - 1) / CHUNK.h));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        ctx.drawImage(chunkFor(c, r), c * CHUNK.w - cam.x, r * CHUNK.h - cam.y);
      }
    }
  }

  /* ---- 動態入口層（呼吸光暈＋鎖＋徽章點＋標籤） ---- */
  function drawEntrances(ctx, t) {
    const rm = !!(S().settings && S().settings.reducedMotion);
    const now = performance.now();
    if (now - badgeAt > 500) { badgeAt = now; badgeSnap = MG.sys.badges.check(); }
    const vx0 = cam.x, vy0 = cam.y, vx1 = cam.x + VIEW.w, vy1 = cam.y + VIEW.h;
    ctx.textAlign = "center";
    for (const e of ENTRANCES) {
      if (e.x < vx0 - 30 || e.x > vx1 + 30 || e.y < vy0 - 30 || e.y > vy1 + 30) continue;
      const sx = e.x - cam.x, sy = e.y - cam.y;
      const locked = lockedOf(e);
      // 呼吸光暈（A3 模式 — rm 恆亮）
      const glow = rm ? 0.3 : 0.2 + 0.15 * (0.5 + 0.5 * Math.sin(t * 1.6 + e.seed));
      ctx.globalAlpha = glow;
      ctx.fillStyle = e.kind === "hunt" ? e.acc : "#e8d8a8";
      ctx.fillRect(sx - 1, sy - 2, 3, 3);
      ctx.globalAlpha = rm ? 0.12 : 0.08 * (0.5 + 0.5 * Math.sin(t * 1.6 + e.seed + 0.5));
      ctx.fillRect(sx - 4, sy - 5, 9, 9);
      ctx.globalAlpha = 1;
      if (locked) {
        ctx.fillStyle = "rgba(10,10,20,0.55)";
        ctx.fillRect(sx - 12, sy - 12, 24, 24);
        draw(ctx, "icon_lock", sx - 8, sy - 8, 1, { scale: 1 });
      }
      // 徽章點（badges 快照節流 500ms — claim 紅：events/abyss；soft 藍：其餘次數型）
      if (e.badge && badgeSnap) {
        if (badgeSnap[e.badge]) {
          ctx.fillStyle = (e.badge === "events" || e.badge === "abyss") ? "#ff5c5c" : "#4fc3f7";
          ctx.fillRect(sx + 12, sy - 14, 4, 4);
        }
      }
      // 標籤（地標/入口名 — 10px mono 同建築標籤語彙）
      ctx.font = "9px monospace";
      ctx.fillStyle = locked ? "rgba(139,144,181,0.8)" : "rgba(232,234,246,0.65)";
      ctx.fillText(e.name, sx, sy + 22);
    }
  }

  /* ---- 輸入：拖曳捲動＋點擊命中（tap vs drag 6px / 400ms） ---- */
  function attachInput(townCanvas, handlers) {
    const { hitBuilding, onBuilding } = handlers || {};
    let downX = 0, downY = 0, downT = 0, dragging = false, pid = null, dragK = 1;
    const toWorld = (px, py) => {
      const rect = townCanvas.getBoundingClientRect();
      return [Math.round((px - rect.left) * (VIEW.w / rect.width) + cam.x),
              Math.round((py - rect.top) * (VIEW.h / rect.height) + cam.y)];
    };
    townCanvas.addEventListener("pointerdown", (ev) => {
      pid = ev.pointerId;
      downX = ev.clientX; downY = ev.clientY; downT = performance.now();
      dragging = false;
      // D2：拖曳位移需 CSS→世界座標換算（390px 窄屏 rect.width≠480 — tap 路徑已換算、drag 路徑此前漏算）
      dragK = VIEW.w / townCanvas.getBoundingClientRect().width;
      try { townCanvas.setPointerCapture(pid); } catch (e) { /* 合成事件/已釋放指標 — 不影響拖曳判定 */ }
    });
    townCanvas.addEventListener("pointermove", (ev) => {
      if (ev.pointerId !== pid) return;
      const dx = ev.clientX - downX, dy = ev.clientY - downY;
      // D1：垂直拖曳判定（原只檢查 dx — 純垂直手勢被整個吞掉）
      if (!dragging && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) { dragging = true; }
      if (dragging) {
        cam.x = Math.round(cam.x - dx * dragK); cam.y = Math.round(cam.y - dy * dragK); clampCam();
        downX = ev.clientX; downY = ev.clientY;
      }
    });
    townCanvas.addEventListener("pointerup", (ev) => {
      if (ev.pointerId !== pid) return;
      pid = null;
      const dt = performance.now() - downT;
      const dx = ev.clientX - downX, dy = ev.clientY - downY;
      if (!dragging && Math.abs(dx) <= 6 && Math.abs(dy) <= 6 && dt <= 400) {
        const [wx, wy] = toWorld(ev.clientX, ev.clientY);
        if (hitBuilding) {
          const id = hitBuilding(wx, wy);
          if (id) { if (onBuilding) onBuilding(id); return; }
        }
        const e = hitEntrance(wx, wy);
        if (e) actionOf(e);
      }
      dragging = false;
    });
    townCanvas.addEventListener("pointercancel", () => { pid = null; dragging = false; });
    townCanvas.style.touchAction = "none";
  }
  function screenToWorld(px, py, rect) {
    return [Math.round((px - rect.left) * (VIEW.w / rect.width) + cam.x),
            Math.round((py - rect.top) * (VIEW.h / rect.height) + cam.y)];
  }

  return {
    WORLD, VILLAGE, VIEW, PAN_STEP, ENTRANCES,
    cam: camPos, panBy, centerHome, jumpTo, nearestLabel, drawMinimap, MINI, drawGround, drawEntrances, attachInput, screenToWorld,
    hitEntrance, lockedOf,
    _bakeCount: () => bakeCount
  };
})();
