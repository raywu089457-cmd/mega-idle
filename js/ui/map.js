/* 放置王國 MEGA IDLE — 世界大地圖（v171：TheoTown 風活世界）
   連續地形（10 區域 tile 區塊 + 海洋 + 蜿蜒道路）、完整村莊（全部建築恆常入城＋街道網）、
   區域地標/野生怪物/村外農田、戰爭迷霧（未解鎖）、DOM 名牌互動、拖曳捲動。
   所有角色（領地英雄/流浪英雄/村民）都走在街道圖上。 */
"use strict";
MG.ui = MG.ui || {};
MG.ui.map = (function () {
  const REGIONS = () => MG.data.monsters.regions;
  const S = () => MG.game.state;
  const TW = 32, TH = 16;          // 等角 tile 菱形（32×16）
  const GW = 46, GH = 28;          // 等角網格（col,row）
  let VW = 460, VH = 500;        // 視窗 CSS 尺寸（v280：加高填滿 stage — 消除下方 188px 留白；v304：縮放時動態調整）
  let zoomLevel = 1;             // v304：桌機縮放 1/1.5/2（顯示倍率；邏輯視窗縮小=放大顯示）
  const BASE_W = (GW + GH) * TW / 2 + TW;   // 離屏整圖
  const BASE_H = (GW + GH) * TH / 2 + TH;
  let canvas, ctx, base = null, rafId = 0, returnId = "kingdom";
  let hitZones = [];   // v283：地標本體 44×44 隱形觸控熱區
  let mmCanvas = null, mmCtx = null;   // v291：小地圖導航（96×60 縮略＋視口矩形＋點擊跳轉）
  let unlockCelebration = null;   // v284：新區解鎖慶祝 {region, t0}
  let lastMaxRegionSeen = null;   // v284：跨畫面追蹤解鎖進度（首次載入不慶祝）
  let offX = 0, offY = 0;          // 捲動偏移（視窗左上在 base 座標）
  let savedView = null;            // v300：記住視角 {x, y, v}
  let drag = null;                 // {x,y,offX,offY,moved}
  let labels = [];                 // DOM 名牌 [{el, cx, cy, region, village}]
  let wbPin = null, lastPinT = 0;  // v551：世界首領名牌元素＋倒數更新閘（1Hz）
  let oceanTiles = [];             // 海洋 tile（動態波紋）[{x, y, s}]
  let lavaTiles = [];              // 火山熔岩縫 tile（脈動亮光）[{x, y, s}]

  // 道路：村莊東門 → 各區名牌（蜿蜒路徑，v172 起點改東城門外）
  const ROAD_STOPS = [[17, 20.5], [19, 20.3], [17.8, 17.5], [14.5, 13.8], [18, 12], [22, 9], [26, 6], [30, 5], [34, 6], [38, 5], [41, 4], [44, 2]];

  /* ---------- 世界資料：Voronoi 不規則地形（接近現實世界樣貌） ---------- */
  // 各區中心（等角網格座標）＋村莊
  const CENTERS = [
    { c: 19, r: 20.5 },    // 0 grass 翠綠草原（v172 村莊東擴後東移，農田旁）
    { c: 14, r: 13.5 },    // 1 forest 幽暗森林（v172 北移避讓東擴村莊）
    { c: 17.5, r: 11.5 },  // 2 cave 灰燼洞穴
    { c: 21.5, r: 8.5 },   // 3 volcano 烈焰火山
    { c: 25.5, r: 5.5 },   // 4 glacier 冰封高原
    { c: 29.5, r: 4.5 },   // 5 desert 黃沙荒漠
    { c: 33.5, r: 5.5 },   // 6 swamp 詛咒沼澤
    { c: 37.5, r: 4.5 },   // 7 tower 蒼穹之塔
    { c: 41, r: 3.5 },     // 8 abyss 深淵裂谷
    { c: 44, r: 2 }        // 9 mythos 神話之域
  ];
  const VILLAGE = { c0: 0, c1: 17, r0: 14, r1: 27 };  // 村莊 18×14（v172 東擴）
  const WORLD_R = 24;  // 距中心超過此值 = 海洋

  /* ---------- 模式地標（v278 合併移植：worldmap.js 的 10 個模式入口落座村莊東方草原帶 —
     草原(region 0)永不迷霧、新檔可見；gate 返回 null = 無門檻；badge key 對照 badges.js） ---------- */
  const MODES = [
    { id: "arena",     name: "競技場",     c: 23, r: 16, gate: null,                              badge: "arena",     open: "openArena" },
    { id: "royal",     name: "王者競技場", c: 29, r: 17, gate: () => (S().kingdom.level || 1) >= 12, badge: "royal",     open: "openRoyal" },
    { id: "dungeon",   name: "試煉秘境",   c: 34, r: 21, gate: null,                              badge: "dungeon",   open: "openDungeon" },
    { id: "worldboss", name: "世界首領",   c: 38, r: 26, gate: null,                              badge: "worldboss", open: "openWorldboss" },
    { id: "tower",     name: "元素試煉塔", c: 29, r: 26, gate: null,                              badge: "tower",     open: "openTower" },
    { id: "maze",      name: "奇境迷宮",   c: 19, r: 27, gate: () => (S().kingdom.level || 1) >= 14, badge: "maze",      open: "openMaze" },
    { id: "guild",     name: "公會盛宴",   c: 24, r: 22, gate: null,                              badge: null,        open: "openGuild" },
    { id: "events",    name: "限時活動",   c: 33, r: 25, gate: null,                              badge: "events",    open: "openEvents" },
    { id: "abyss",     name: "無盡深淵",   c: 23, r: 26, gate: () => !!(MG.sys.abyss && MG.sys.abyss.unlocked()), badge: "abyss", open: "openAbyss" },
    { id: "exped",     name: "委託遠征營", c: 32, r: 19, gate: () => (S().kingdom.level || 1) >= 16, badge: "exped",   open: "openExpedition" }
  ];

  // 村內道路網（v172：村莊 18×14，西街/東街/中街/南街＋南北巷）
  // 節點（tile 座標）：街道交會點＋城門端點
  const VNODES = [
    [2, 14.5],    // 0 西街北端
    [2, 20.5],    // 1 西街×中街
    [2, 25],      // 2 西街×南街
    [2, 26.5],    // 3 西街南端
    [15.5, 14.5], // 4 東街北端
    [15.5, 20.5], // 5 東街×中街
    [15.5, 25],   // 6 東街×南街
    [15.5, 26.5], // 7 東街南端
    [0.5, 20.5],  // 8 西城門
    [16.5, 20.5], // 9 東城門
    [10.5, 25],   // 10 南巷×南街
    [10.5, 27],   // 11 南城門
    [6.5, 14.5]   // 12 北城門（北街中點）
  ];
  const VEDGES = [
    [0, 1], [1, 2], [2, 3],        // 西街
    [4, 5], [5, 6], [6, 7],        // 東街
    [8, 1], [1, 5], [5, 9],        // 中街（東西城門貫通）
    [2, 10], [10, 6],              // 南街
    [10, 11],                      // 南巷（南城門）
    [0, 12], [12, 4]               // 北街（北城門走廊）
  ];

  // 村外農田（v170 實驗：村莊東南方圍籬麥田，v172 東移避讓東擴村莊）
  const FARM = { c0: 18, c1: 22, r0: 22.5, r1: 26.5 };   // 麥田範圍（tile）
  const WHEAT_TILES = [];
  for (let c = 19; c <= 21.5; c += 0.5) {
    for (let r = 23.5; r <= 26; r += 0.5) WHEAT_TILES.push([c, r]);
  }

  // fbm 值雜訊（區域邊界有機化，接近現實地形）
  function vnoise(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7 + 74.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function fbm(x, y) {
    return 0.55 * vnoise(x, y) + 0.32 * vnoise(x * 2.13, y * 2.71) + 0.13 * vnoise(x * 4.7, y * 5.3);
  }

  function tileOf(c, r) {
    if (c >= VILLAGE.c0 && c <= VILLAGE.c1 && r >= VILLAGE.r0 && r <= VILLAGE.r1) return -2; // 村莊
    let best = -1, bd = 1e9;
    for (let i = 0; i < CENTERS.length; i++) {
      const p = CENTERS[i];
      const d = Math.hypot(c - p.c, r - p.r) + (fbm(c, r) - 0.5) * 13.5; // 邊界 ±6.75 tile 擾動（v163 加大 3 倍）
      if (d < bd) { bd = d; best = i; }
    }
    if (bd > WORLD_R) return -1;  // 海洋
    return best;
  }
  const XO = GH * TW / 2;  // x 平移：讓等角投影全為正座標（c-r 最小值 -GH）
  function isoX(c, r) { return TW / 2 + (c - r) * TW / 2 + XO; }
  function isoY(c, r) { return TH / 2 + (c + r) * TH / 2; }

  /* ---------- 程序地形繪製 ---------- */
  function h2(c, r, s) { return ((c * 73856093 + r * 19349663 + s * 83492791) ^ (s << 13)) >>> 0; }
  function rr(c, r, s) { let n = h2(c, r, s) % 100000; return n / 100000; }

  function pathD(cx, cy, a, b) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - b); ctx.lineTo(cx + a, cy); ctx.lineTo(cx, cy + b); ctx.lineTo(cx - a, cy);
    ctx.closePath();
  }
  function dia(cx, cy, a, b, fill) { pathD(cx, cy, a, b); ctx.fillStyle = fill; ctx.fill(); }
  function diaStroke(cx, cy, a, b, color, lw) { pathD(cx, cy, a, b); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke(); }

  function mix(hex, other, t) {
    const n = parseInt(hex.slice(1), 16), m = parseInt(other.slice(1), 16);
    let r = ((n >> 16) & 255) * (1 - t) + ((m >> 16) & 255) * t;
    let g = ((n >> 8) & 255) * (1 - t) + ((m >> 8) & 255) * t;
    let b = (n & 255) * (1 - t) + (m & 255) * t;
    return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
  }
  /* v568 TheoTown 風格工具（六規則程式化：左上受光/底部漸暗/無黑框/面雜訊；全 seeded 確定性） */
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), f = 1 + k;
    const c = v => Math.max(0, Math.min(255, Math.round(((n >> v) & 255) * f)));
    return "rgb(" + c(16) + "," + c(8) + "," + c(0) + ")";
  }
  /* 矩形面雜訊：bbox 內灑 ±亮度 speckle（key 為色值陣列） */
  function speckAt(x, y, w, h, base, keys, seed0) {
    if (w <= 0 || h <= 0) return;
    let s = (x * 73856093 + y * 19349663 + (seed0 || 7) * 83492791) >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        if (rnd() < 0.14) {
          ctx.fillStyle = keys[(rnd() * keys.length) | 0];
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }
    ctx.fillStyle = base;
  }
  /* 三角形面雜訊（點在三角內判定，不溢出色塊外） */
  function speckTri(x, y, w, h, base, keys, seed0) {
    let s = (x * 73856093 + y * 19349663 + (seed0 || 7) * 83492791) >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let j = y - h + 1; j < y; j++) {
      const t = (y - j) / h;
      const half = Math.max(0.5, (w / 2) * t);
      const x0 = Math.ceil(x - half), x1 = Math.floor(x + half);
      for (let i = x0; i <= x1; i++) {
        if (rnd() < 0.12) {
          ctx.fillStyle = keys[(rnd() * keys.length) | 0];
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }
    ctx.fillStyle = base;
  }
  function drawTile(c, r) {
    const kind = tileOf(c, r);
    const x = isoX(c, r), y = isoY(c, r);
    const a = TW / 2, b = TH / 2;
    const n = (c, r) => rr(c, r, kind);
    if (kind === -1) {           // 海洋
      // v581：海岸判定 — 4 鄰接任一為陸地 = 岸邊淺水帶（TheoTown 文法：岸水亮階＋白浪泡沫）
      let coast = false;
      for (let i = 0; i < 4; i++) {
        const nk = tileOf(c + (i === 0 ? 1 : i === 1 ? -1 : 0), r + (i === 2 ? 1 : i === 3 ? -1 : 0));
        if (nk >= 0 || nk === -2) { coast = true; break; }
      }
      if (coast) {
        dia(x, y, a, b, "#24406e");            // 淺水外緣（#2a4a7a 家族亮階 — R1/R2 水色文法）
        dia(x, y, a - 4, b - 2, "#2e5280");    // 淺水內核
      } else {
        dia(x, y, a, b, "#1a2a4a");
        dia(x, y, a - 4, b - 2, "#1f345c");
      }
      oceanTiles.push({ x, y, s: n(c, r), coast });   // 動態波紋層
      ctx.fillStyle = "rgba(140,190,255,0.25)";
      if (n(c, r) > 0.75) ctx.fillRect(x + 2 - 8 * n(c, r), y - 1, 6, 2);  // 波紋
      // v581：岸邊白浪泡沫 — 陸地面向邊緣斷續浪沫（seeded 確定性；碼頭/燈塔後繪覆蓋屬正常疊層）
      if (coast) {
        const edges = [
          [x - a, y, x, y - b, -1, 0],   // UL 邊（朝 c-1）
          [x, y - b, x + a, y, 0, -1],   // UR 邊（朝 r-1）
          [x + a, y, x, y + b, 1, 0],    // DR 邊（朝 c+1）
          [x, y + b, x - a, y, 0, 1]     // DL 邊（朝 r+1）
        ];
        for (let e = 0; e < 4; e++) {
          const [x0, y0, x1, y1, dc, dr] = edges[e];
          const nk2 = tileOf(c + dc, r + dr);
          if (!(nk2 >= 0 || nk2 === -2)) continue;   // 僅陸地面向邊畫沫
          const len = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
          let p = 0;
          while (p < len) {
            if (rr(x * 13 + e * 7, y * 5 + p * 3, 21) > 0.3) {   // 斷續：~70% 機會成段
              for (let k = 0; k < 3 && p + k <= len; k++) {
                const fx = Math.round(x0 + (x1 - x0) * (p + k) / len);
                const fy = Math.round(y0 + (y1 - y0) * (p + k) / len);
                ctx.fillStyle = rr(fx * 3, fy * 7 + e, 17) > 0.8 ? "#eef6ff" : "#d8e8f8";   // 亮沫尖
                ctx.fillRect(fx, fy, 1, 1);
              }
            }
            p += 5;   // 3px 段 + 2px 隙
          }
        }
      }
      return;
    }
    if (kind === -2) {           // 村莊草地
      dia(x, y, a, b, "#4c8a3f");
      if (n(c, r) > 0.6) { ctx.fillStyle = "#5c9c4a"; ctx.fillRect(x - 6, y - 1, 3, 2); }
      if (n(c, r) < 0.35) { ctx.fillStyle = "#3a7a33"; ctx.fillRect(x + 3, y + 1, 3, 2); }
      // v568：雜訊密度翻倍（TheoTown 草地語彙 — 亮暗草簇）
      if (n(c, r) > 0.8) { ctx.fillStyle = "#64a854"; ctx.fillRect(x - 1, y - 1, 2, 1); }
      if (n(c, r) < 0.2) { ctx.fillStyle = "#386c2e"; ctx.fillRect(x + 1, y + 1, 2, 1); }
      if (n(c, r) > 0.93) { ctx.fillStyle = "#dce8c4"; ctx.fillRect(x + 2, y - 1, 1, 1); }  // 稀草尖
      return;
    }
    const rs = REGIONS()[kind];
    const theme = MG.config.REGION_THEME[rs.palIdx] || MG.config.REGION_THEME[0];
    const gnd = mix(theme.ground, "#7a7a7a", 0.22);  // TheoTown 風降飽和
    dia(x, y, a, b, gnd);
    // 區域紋理（seeded）
    ctx.fillStyle = theme.accent;
    switch (kind) {
      case 0: // grass
        if (n(c, r) > 0.55) ctx.fillRect(x - 4, y - 1, 3, 2);
        if (n(c, r) < 0.3) ctx.fillRect(x + 2, y + 1, 3, 2);
        break;
      case 1: { // forest 樹冠
        if (n(c, r) > 0.45) {
          ctx.fillStyle = "#1d3a2e"; ctx.fillRect(x - 5, y - 4, 10, 5);
          ctx.fillStyle = "#2a5238"; ctx.fillRect(x - 3, y - 6, 6, 4);
          ctx.fillStyle = "#3a2a1a"; ctx.fillRect(x - 1, y, 2, 3);
        }
        break;
      }
      case 2: // cave 岩塊
        ctx.fillStyle = "#232330";
        if (n(c, r) > 0.4) { ctx.fillRect(x - 6, y - 3, 5, 3); ctx.fillRect(x + 2, y, 4, 3); }
        break;
      case 3: // volcano 熔岩縫
        if (n(c, r) > 0.5) { ctx.fillStyle = "#ff9a4d"; ctx.fillRect(x - 7, y - 1, 5, 2); ctx.fillStyle = "#ffd166"; ctx.fillRect(x - 7, y - 1, 2, 2); lavaTiles.push({ x, y, s: n(c, r) }); }
        break;
      case 4: // glacier 冰裂
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        if (n(c, r) > 0.5) ctx.fillRect(x - 5, y - 1, 7, 1);
        break;
      case 5: // desert 沙丘
        ctx.fillStyle = "rgba(255,232,176,0.35)";
        if (n(c, r) > 0.5) ctx.fillRect(x - 5, y - 2, 8, 1);
        break;
      case 6: // swamp 水光
        ctx.fillStyle = "rgba(154,255,138,0.3)";
        if (n(c, r) > 0.6) ctx.fillRect(x - 3, y, 5, 2);
        break;
      case 7: // tower 星點
        if (n(c, r) > 0.7) ctx.fillRect(x - 3, y - 1, 2, 2);
        break;
      case 8: // abyss 紅裂
        ctx.fillStyle = "#ff5c8a";
        if (n(c, r) > 0.6) { ctx.fillRect(x - 6, y, 6, 1); ctx.fillRect(x + 3, y - 1, 3, 1); }
        break;
      case 9: // mythos 神光
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        if (n(c, r) > 0.65) ctx.fillRect(x - 2, y - 1, 2, 2);
        break;
    }
  }

  /* 蜿蜒道路：每段 [A,B] 插入 2 個中間點（垂直偏移 fbm，自然彎曲）
     upTo = 只取前 upTo+1 個 stop（馬車行駛到最遠解鎖區） */
  function roadPoints(upTo) {
    const stops = (upTo !== undefined) ? ROAD_STOPS.slice(0, upTo + 1) : ROAD_STOPS;
    const pts = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const [c0, r0] = stops[i], [c1, r1] = stops[i + 1];
      pts.push([c0, r0]);
      const dc = c1 - c0, dr = r1 - r0;
      const len = Math.hypot(dc, dr);
      const perpC = -dr / len, perpR = dc / len;  // 垂直單位向量
      for (let k = 1; k <= 2; k++) {
        const t = k / 3;
        const wob = (vnoise(c0 * 1.7 + i * 3.1, r0 * 1.7 + i * 7.7) - 0.5) * 2.4;  // ±1.2 tile
        pts.push([c0 + dc * t + perpC * wob, r0 + dr * t + perpR * wob]);
      }
    }
    pts.push(stops[stops.length - 1]);
    return pts;
  }
  /* v294：馬車路徑快取 — roadPoints 含 fbm 雜訊每幀重算是浪費；upTo 不變即重用 */
  const roadCache = { upTo: -1, pts: null };
  function roadPointsCached(upTo) {
    if (roadCache.upTo === upTo) return roadCache.pts;
    roadCache.upTo = upTo;
    roadCache.pts = roadPoints(upTo);
    return roadCache.pts;
  }

  function buildBase() {
    base = document.createElement("canvas");
    base.width = BASE_W; base.height = BASE_H;
    const bctx = base.getContext("2d");
    // 海洋底色（v581：近黑 #121a30 → 深海軍藍 — 島嶼外圍讀作「海」而非「虛空」；霧區無涉）
    bctx.fillStyle = "#16233c"; bctx.fillRect(0, 0, BASE_W, BASE_H);
    const saved = ctx; ctx = bctx;
    const st = S();
    const maxReached = st.stats.maxRegionReached || 0;
    oceanTiles = []; lavaTiles = [];
    // 迷霧遮罩：未解鎖區域畫暗色 —— v580 邊緣柔化重做（原逐 tile 平塗 0.62 alpha 硬切 →
    // BFS 深度場＋2×2 子菱形雙線性取樣：alpha 0→0.66 約 3 tile 寬平滑漸變，交界無階梯刀切；
    // 霧內＋邊緣 seeded 雜訊與冷藍霧氣亮點，霧讀作「氣」而非「空無」）
    const FOG_INF = 99;
    const fogD = [];
    for (let r = 0; r < GH; r++) { const row = new Array(GW); row.fill(FOG_INF); fogD.push(row); }
    const q = [];
    for (let r = 0; r < GH; r++) {
      for (let c = 0; c < GW; c++) {
        const k = tileOf(c, r);
        if (k === -1 || k === -2 || (k >= 0 && k <= maxReached)) { fogD[r][c] = 0; q.push([c, r]); }
      }
    }
    // 多源 BFS：由清楚格擴散進霧格 — fogD = 走到最近清楚格的 4 連通步數（≥4 即全霧，截斷省時）
    for (let h = 0; h < q.length; h++) {
      const [c, r] = q[h];
      if (fogD[r][c] >= 4) continue;
      const nd = fogD[r][c] + 1;
      for (let i = 0; i < 4; i++) {
        const nc = c + (i === 0 ? 1 : i === 1 ? -1 : 0), nr = r + (i === 2 ? 1 : i === 3 ? -1 : 0);
        if (nc < 0 || nr < 0 || nc >= GW || nr >= GH) continue;
        if (fogD[nr][nc] > nd) { fogD[nr][nc] = nd; q.push([nc, nr]); }
      }
    }
    const fogAlpha = d => {
      if (d <= 0.45) return 0;                     // 清楚
      if (d >= 1.65) return 0.66;                  // 全霧（1.65 tile 外）
      const u = (d - 0.45) / 1.2;                  // smoothstep：邊緣軟但快速轉深
      const s = u * u * (3 - 2 * u);
      return 0.06 + 0.60 * s;
    };
    const fogV = (cc, rr) => (cc < 0 || rr < 0 || cc >= GW || rr >= GH) ? FOG_INF : fogD[rr][cc];
    for (let r = GH - 1; r >= 0; r--) {
      for (let c = 0; c < GW; c++) drawTile(c, r);
    }
    // 逐像素霧合成（v580 邊緣柔化核心）：霧區 bbox 內每個像素以逆等角投影取深度 →
    // fogAlpha 連續混合（0→0.66 約 4.4 tile 漸變，零平帶，交界真平滑）；霧內 seeded 雜訊另繪
    let fx0 = 1e9, fy0 = 1e9, fx1 = -1e9, fy1 = -1e9;
    {
      for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) {
        const k = tileOf(c, r);
        if (k >= 0 && k > maxReached) {
          const xx = isoX(c, r), yy = isoY(c, r);
          if (xx - 20 < fx0) fx0 = xx - 20; if (yy - 12 < fy0) fy0 = yy - 12;
          if (xx + 20 > fx1) fx1 = xx + 20; if (yy + 12 > fy1) fy1 = yy + 12;
        }
      }
    }
    if (fx0 < fx1 && fy0 < fy1) {
      const x0 = Math.max(0, Math.floor(fx0)), y0 = Math.max(0, Math.floor(fy0));
      const x1 = Math.min(BASE_W - 1, Math.ceil(fx1)), y1 = Math.min(BASE_H - 1, Math.ceil(fy1));
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      const img = bctx.getImageData(x0, y0, w, h);
      const d = img.data;
      const aX = 16 + XO, bY = 8;   // isoX = aX + (c-r)*16 ; isoY = bY + (c+r)*8
      for (let py = 0; py < h; py++) {
        const vrow = (py + y0 - bY) / 8;             // = c + r
        const baseI = py * w;
        for (let px = 0; px < w; px++) {
          const ucol = (px + x0 - aX) / 16;          // = c - r
          const cF = (ucol + vrow) * 0.5, rF = (vrow - ucol) * 0.5;
          const c0 = Math.floor(cF), r0 = Math.floor(rF);
          const fxx = cF - c0, fyy = rF - r0;
          const d00 = fogV(c0, r0), d10 = fogV(c0 + 1, r0), d01 = fogV(c0, r0 + 1), d11 = fogV(c0 + 1, r0 + 1);
          const depth = d00 * (1 - fxx) * (1 - fyy) + d10 * fxx * (1 - fyy) + d01 * (1 - fxx) * fyy + d11 * fxx * fyy;
          const a = fogAlpha(depth);
          if (a > 0.02) {
            const i = (baseI + px) * 4;
            const ia = 1 - a;
            d[i] = d[i] * ia + 13 * a;
            d[i + 1] = d[i + 1] * ia + 16 * a;
            d[i + 2] = d[i + 2] * ia + 32 * a;
          }
        }
      }
      bctx.putImageData(img, x0, y0);
    }
    // 霧內同系雜訊＋邊緣霧氣亮點（seeded 確定性；厚霧暗/亮點、薄霧冷藍氣）
    for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) {
      const kind = tileOf(c, r);
      if (!(kind >= 0 && kind > maxReached)) continue;
      const coreA = fogAlpha(fogD[r][c]);
      if (coreA <= 0.02) continue;
      const x2 = isoX(c, r), y2 = isoY(c, r);
      const s0 = rr(c * 7 + 3, r * 5 + 11, 13);
      if (coreA > 0.3) {
        if (s0 > 0.86) { bctx.fillStyle = "rgba(72,90,132,0.10)"; bctx.fillRect(x2 - 3, y2 - 1, 3, 1); }
        else if (s0 < 0.1) { bctx.fillStyle = "rgba(0,0,0,0.08)"; bctx.fillRect(x2 + 1, y2 + 1, 2, 1); }
      } else {
        if (s0 > 0.7) { bctx.fillStyle = "rgba(118,138,180,0.13)"; bctx.fillRect(x2 - 2, y2 - 1, 2, 1); }
      }
    }
    // 道路：村莊東門 → 草原 → 森林 …（蜿蜒路徑：每段插中間點＋fbm 垂直偏移）
    const drawRoadSeg = (c0, r0, c1, r1) => {
      let c = c0, r = r0;
      while (Math.abs(c - c1) + Math.abs(r - r1) > 0.01) {
        const x = isoX(c, r), y = isoY(c, r);
        dia(x, y, 5, 2.5, "rgba(0,0,0,0.18)");
        dia(x, y, 4, 2, "#8a6a4a");
        // v568：土路噪點（seeded 石礫/車轍亮暗）
        if (rr(Math.round(x * 13), Math.round(y * 7), 3) > 0.82) { ctx.fillStyle = "rgba(0,0,0,0.14)"; ctx.fillRect(x - 1, y - 1, 2, 1); }
        if (rr(Math.round(x * 17), Math.round(y * 11), 3) > 0.9) { ctx.fillStyle = "rgba(255,235,200,0.10)"; ctx.fillRect(x + 1, y, 2, 1); }
        c += (c1 - c) * 0.35; r += (r1 - r) * 0.35;
        if (Math.abs(c1 - c) < 0.2) c = c1;
        if (Math.abs(r1 - r) < 0.2) r = r1;
      }
    };
    bctx.save();
    bctx.fillStyle = "#8a6a4a";
    const roadPts = roadPoints();
    for (let i = 0; i < roadPts.length - 1; i++) {
      drawRoadSeg(roadPts[i][0], roadPts[i][1], roadPts[i + 1][0], roadPts[i + 1][1]);
    }
    // v302：模式地標支路 — 東門 → 競技場 → 公會 → 遠征 → 試煉；南巷 → 迷宮 → 深淵 → 塔 → 活動 → 世界首領
    const MODE_ROADS = [
      [16.5, 20.5, 21.5, 18.5], [21.5, 18.5, 23, 16],        // 東門→競技場
      [23, 16, 24, 22], [24, 22, 28, 20.5], [28, 20.5, 32, 19], [32, 19, 34, 21],  // 競技場→公會→遠征→試煉
      [16.5, 25.5, 19, 27], [19, 27, 21.5, 26.5], [21.5, 26.5, 23, 26],  // 南巷→迷宮→深淵
      [23, 26, 26, 26], [26, 26, 29, 26], [29, 26, 31, 25.5], [31, 25.5, 33, 25],  // 深淵→塔→活動
      [33, 25, 35.5, 25.5], [35.5, 25.5, 38, 26]              // 活動→世界首領
    ];
    for (const [c0, r0, c1, r1] of MODE_ROADS) drawRoadSeg(c0, r0, c1, r1);
    bctx.restore();
    // 村莊建築立牌
    drawVillage(bctx);
    // 村外農田（圍籬＋稻草人＋乾草堆）
    drawFarm(bctx);
    // 區域地標（已解鎖區的主題聚落地標；鎖定區迷霧內不繪製）
    drawLandmarks(bctx);
    // 模式地標（v278 合併移植：村莊東方草原帶 — 草原永不迷霧）
    drawModeLandmarks(bctx);
    // v293 海岸燈塔（蒼穹之塔東南角）＋ v307 碼頭
    drawLighthouse(bctx);
    drawDock(bctx);
    ctx = saved;
  }

  function drawVillage(bctx) {
    const cc = (VILLAGE.c0 + VILLAGE.c1) / 2, cr = (VILLAGE.r0 + VILLAGE.r1) / 2;
    const cx = isoX(cc, cr), cy = isoY(cc, cr);
    const saved = ctx; ctx = bctx;

    // ---------- 村莊地面：外圈草地 → 內層灰階廣場 ----------
    // 石板大廣場（中央，TheoTown 灰階）
    dia(cx, cy, (VILLAGE.c1 - VILLAGE.c0) * TW / 2 + 8, (VILLAGE.r1 - VILLAGE.r0) * TH / 2 + 4, "#5c5c66");
    dia(cx, cy, (VILLAGE.c1 - VILLAGE.c0) * TW / 2 + 2, (VILLAGE.r1 - VILLAGE.r0) * TH / 2 - 1, "#6a6a74");
    // v568：石板縫＋塊面明暗（seeded，打破平色塊）
    bctx.strokeStyle = "rgba(0,0,0,0.12)"; bctx.lineWidth = 1;
    for (let c = VILLAGE.c0 + 1.4; c < VILLAGE.c1; c += 1.7) {
      const wob = (rr(Math.round(c * 3), 5, 5) - 0.5) * 0.6;
      bctx.beginPath();
      bctx.moveTo(isoX(c + wob, VILLAGE.r0), isoY(c + wob, VILLAGE.r0));
      bctx.lineTo(isoX(c + wob, VILLAGE.r1), isoY(c + wob, VILLAGE.r1));
      bctx.stroke();
    }
    for (let r = VILLAGE.r0 + 1.5; r < VILLAGE.r1; r += 1.9) {
      const wob = (rr(7, Math.round(r * 3), 5) - 0.5) * 0.6;
      bctx.beginPath();
      bctx.moveTo(isoX(VILLAGE.c0, r + wob), isoY(VILLAGE.c0, r + wob));
      bctx.lineTo(isoX(VILLAGE.c1, r + wob), isoY(VILLAGE.c1, r + wob));
      bctx.stroke();
    }
    for (let i = 0; i < 48; i++) {
      const cc = VILLAGE.c0 + rr(13, i, 5) * (VILLAGE.c1 - VILLAGE.c0);
      const cr = VILLAGE.r0 + rr(17, i, 5) * (VILLAGE.r1 - VILLAGE.r0);
      bctx.fillStyle = rr(19, i, 5) < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
      bctx.fillRect(isoX(cc, cr) - 2, isoY(cc, cr) - 1, 4, 2);
    }

    // ---------- 街道網（v171：兩縱＋中街＋南街＋南北巷，與道路圖 VEDGES 一致） ----------
    const street = (c0, r0, c1, r1) => {
      const n = Math.round((Math.abs(c1 - c0) + Math.abs(r1 - r0)) * 4);
      for (let i = 0; i <= n; i++) {
        const cc0 = c0 + (c1 - c0) * i / n, rr0 = r0 + (r1 - r0) * i / n;
        const x = isoX(cc0, rr0), y = isoY(cc0, rr0);
        dia(x, y, 6, 3, "rgba(0,0,0,0.2)");
        dia(x, y, 5, 2.5, "#7a7a84");
        // v568：石板噪點（seeded）
        if (rr(Math.round(x * 7), Math.round(y * 3), 9) > 0.75) { ctx.fillStyle = "rgba(255,255,255,0.09)"; ctx.fillRect(x - 2, y - 1, 2, 1); }
        if (rr(Math.round(x * 11), Math.round(y * 13), 9) > 0.85) { ctx.fillStyle = "rgba(0,0,0,0.10)"; ctx.fillRect(x + 1, y, 2, 1); }
      }
    };
    street(2, 14.5, 2, 26.5);       // 西街
    street(15.5, 14.5, 15.5, 26.5); // 東街
    street(2, 14.5, 15.5, 14.5);    // 北街（北牆走廊→北城門）
    street(0.5, 20.5, 16.5, 20.5);  // 中街（東西城門貫通）
    street(2, 25, 15.5, 25);        // 南街
    street(10.5, 25, 10.5, 27);     // 南巷（南城門）

    // ---------- 城牆：沿村莊 tile 邊界四邊 + 四角塔 + 四城門 ----------
    const wall = (c0, r0, c1, r1) => {
      const x0 = isoX(c0, r0), y0 = isoY(c0, r0), x1 = isoX(c1, r1), y1 = isoY(c1, r1);
      bctx.lineWidth = 5;
      bctx.strokeStyle = "#8a8a9a";
      bctx.beginPath(); bctx.moveTo(x0, y0); bctx.lineTo(x1, y1); bctx.stroke();
      // v568：受光上緣（左上偏移）＋陰影底緣（右下偏移）＋磚縫（整數偏移防抗鋸齒）
      bctx.lineWidth = 2;
      bctx.strokeStyle = "#a0a0ae";
      bctx.beginPath(); bctx.moveTo(x0 - 2, y0 - 2); bctx.lineTo(x1 - 2, y1 - 2); bctx.stroke();
      bctx.strokeStyle = "#5c5c6a";
      bctx.beginPath(); bctx.moveTo(x0 + 2, y0 + 2); bctx.lineTo(x1 + 2, y1 + 2); bctx.stroke();
      bctx.strokeStyle = "rgba(0,0,0,0.15)"; bctx.lineWidth = 1;
      bctx.beginPath(); bctx.moveTo(x0 + 1, y0 + 1); bctx.lineTo(x1 + 1, y1 + 1); bctx.stroke();
    };
    wall(VILLAGE.c0, VILLAGE.r0, VILLAGE.c1, VILLAGE.r0);
    wall(VILLAGE.c1, VILLAGE.r0, VILLAGE.c1, VILLAGE.r1);
    wall(VILLAGE.c0, VILLAGE.r0, VILLAGE.c0, VILLAGE.r1);
    wall(VILLAGE.c0, VILLAGE.r1, VILLAGE.c1, VILLAGE.r1);
    // 四角塔樓（像素方塔）
    const corners = [[VILLAGE.c0, VILLAGE.r0], [VILLAGE.c1, VILLAGE.r0], [VILLAGE.c0, VILLAGE.r1], [VILLAGE.c1, VILLAGE.r1]];
    for (const [tc, tr] of corners) {
      const tx = isoX(tc, tr), ty = isoY(tc, tr) - 12;
      bctx.fillStyle = "#8a8a9a";
      bctx.fillRect(tx - 5, ty - 6, 10, 12);
      // v568：去黑框 — 左受光/右陰影＋底漸暗（同系深階）
      bctx.fillStyle = "#9a9aa8"; bctx.fillRect(tx - 5, ty - 6, 3, 12);
      bctx.fillStyle = "#7a7a88"; bctx.fillRect(tx + 2, ty - 6, 3, 12);
      bctx.fillStyle = "#666674"; bctx.fillRect(tx - 5, ty + 4, 10, 2);
      bctx.fillStyle = "#a85038"; bctx.fillRect(tx - 6, ty - 8, 12, 4);   // 錐頂（降飽和）
      bctx.fillStyle = "#c06048"; bctx.fillRect(tx - 6, ty - 8, 12, 1);   // 頂緣受光
    }
    // 四城門（主街穿牆處的缺口標記：門柱＋木門）
    const gates = [
      [6.5, VILLAGE.r0, "N"], [10.5, VILLAGE.r1, "S"], [VILLAGE.c0, cr, "W"], [VILLAGE.c1, cr, "E"]
    ];
    for (const [gc, gr, dir] of gates) {
      const gx = isoX(gc, gr), gy = isoY(gc, gr);
      bctx.fillStyle = "#6a6a74"; bctx.fillRect(gx - 8, gy - 8, 16, 16);
      bctx.strokeStyle = "#3a3a42"; bctx.lineWidth = 2; bctx.strokeRect(gx - 8, gy - 8, 16, 16);
      bctx.fillStyle = "#4a3520"; bctx.fillRect(gx - 3, gy - 3, 6, 6);
      bctx.fillStyle = "#ffd166"; bctx.fillRect(gx - 1, gy - 1, 2, 2);
    }

    // ---------- 中央城堡（b_castle_iso 俯視等角 64×48，scale 1.2，北牆內、中街北側） ----------
    const cw = 64 * 1.2, chh = 48 * 1.2;
    MG.ui.render.draw(bctx, "b_castle_iso", isoX(6.5, 16.2) - cw / 2, isoY(6.5, 16.2) - chh / 2 + 10, 1, { scale: 1.2, t: 0 });

    // ---------- 建築（v172 全部 9 棟放大 1.15-1.4 倍，底邊貼地＋陰影貼腳，不懸空） ----------
    // 繪製規則：sprite 底邊＝錨點 tile 中心（by），陰影貼在腳下 3px
    const bld = (spr, c, r, s) => {
      const bx = isoX(c, r), by = isoY(c, r);
      const sp = MG.data.sprites.get(spr);
      const w = (sp ? sp.w : 32) * s, h = (sp ? sp.h : 24) * s;
      dia(bx, by + 3, w / 2.6, h / 8, "rgba(0,0,0,0.32)");   // 貼腳陰影
      MG.ui.render.draw(bctx, spr, bx - w / 2, by - h + 2, 1, { scale: s, t: 0 });
    };
    bld("b_guild_iso", 10.5, 18.3, 1.4);      // 公會：東街西側北段
    bld("b_training_iso", 13.8, 18.3, 1.4);   // 訓練場：東街西側北段東
    bld("b_library_iso", 3.9, 21.9, 1.4);     // 圖書館：西街東側中段
    bld("b_forge_iso", 3.9, 24.0, 1.4);       // 鐵匠鋪：西街東側南段
    bld("b_alchemy_iso", 10.5, 23.4, 1.4);    // 煉金坊：中街南側東段
    bld("b_market_iso", 13.8, 23.4, 1.4);     // 市集：東街西側中段
    bld("b_altar_iso", 7.2, 22.8, 1.2);       // 祭壇：城堡南廣場
    bld("b_gemworks_iso", 3.3, 26.3, 1.15);   // 寶石坊：南街南側西段
    bld("b_warehouse_iso", 8.2, 26.3, 1.15);  // 倉庫：南街南側中段
    bld("b_tt_demo", 13, 26, 1.5);            // v573：TheoTown 官方範例宅邸（sample_bmp 正式資產）南街南側東段

    // ---------- 民房 3 棟（等角小屋，西街西側住宅區；底邊貼地） ----------
    const hw = 20 * 1.3, hh = 16 * 1.3;
    const houses = [[1.0, 17.0], [1.0, 18.8], [1.2, 20.2]];
    for (const [hc, hr] of houses) {
      const hx = isoX(hc, hr), hy = isoY(hc, hr);
      dia(hx, hy + 3, 9, 3, "rgba(0,0,0,0.3)");
      MG.ui.render.draw(bctx, "b_house_iso", hx - hw / 2, hy - hh + 2, 1, { scale: 1.3, t: 0 });
    }

    // ---------- 路樹（8 棵：城堡南廣場＋路旁角落） ----------
    const trees = [[4.9, 23.1], [7.9, 23.1], [5.7, 24.4], [12.3, 15.6], [0.7, 15.8], [15.6, 16.0], [16.0, 22.8], [0.8, 22.0]];
    for (const [tc, tr] of trees) {
      const tx = isoX(tc, tr), ty = isoY(tc, tr);
      bctx.fillStyle = "#3a2a1a"; bctx.fillRect(tx - 1, ty - 6, 2, 6);
      bctx.fillStyle = "#35502c"; bctx.fillRect(tx - 5, ty - 10, 10, 5);
      bctx.fillStyle = "#4c8a3f"; bctx.fillRect(tx - 3, ty - 13, 6, 5);
    }
    // 廣場水井（城堡南廣場）
    {
      const wx = isoX(6.2, 23.8), wy = isoY(6.2, 23.8);
      bctx.fillStyle = "#6a6a74"; bctx.fillRect(wx - 4, wy - 4, 8, 8);
      bctx.strokeStyle = "#3a3a42"; bctx.lineWidth = 2; bctx.strokeRect(wx - 4, wy - 4, 8, 8);
      bctx.fillStyle = "#2a4a6a"; bctx.fillRect(wx - 2, wy - 2, 4, 4);
    }
    // ---------- v292 生活感：路燈＋攤位（南廣場集市） ----------
    // v579：路燈 TheoTown 化 — 石基座(左上受光/底漸暗)＋鐵柱(亮暗雙面,無黑輪廓)＋青銅罩框＋
    // 琥珀玻璃亮芯＋金頂飾＋烘培暖光暈（3+ 部件、R2/R3 合規、靜態確定性,零近黑）
    const lamps = [[3.6, 16.5], [3.6, 24.5], [13.9, 16.5], [13.9, 24.5], [6.4, 21.4], [11.6, 21.4]];
    for (const [lc, lr] of lamps) {
      const lx = isoX(lc, lr), ly = isoY(lc, lr);
      // 石基座（6×3,上亮下暗階）
      bctx.fillStyle = "#9a9aa8"; bctx.fillRect(lx - 3, ly - 3, 6, 1);
      bctx.fillStyle = "#a8a8b6"; bctx.fillRect(lx - 3, ly - 3, 2, 1);   // 左上受光
      bctx.fillStyle = "#8a8a98"; bctx.fillRect(lx - 3, ly - 2, 6, 1);
      bctx.fillStyle = "#6a6a78"; bctx.fillRect(lx - 3, ly - 1, 6, 1);
      // 鐵柱（柱身 6×8：左亮右暗；柱頂受光）
      bctx.fillStyle = "#6e6e7c"; bctx.fillRect(lx - 2, ly - 10, 2, 8);
      bctx.fillStyle = "#5a5a68"; bctx.fillRect(lx, ly - 10, 1, 8);
      bctx.fillStyle = "#8a8a98"; bctx.fillRect(lx - 2, ly - 10, 1, 1);
      // 燈罩框（青銅,無黑輪廓）
      bctx.fillStyle = "#5a4a30"; bctx.fillRect(lx - 3, ly - 16, 6, 2);   // 罩頂
      bctx.fillStyle = "#6a5a38"; bctx.fillRect(lx - 3, ly - 16, 2, 1);   // 罩頂左受光
      bctx.fillStyle = "#4a3a28"; bctx.fillRect(lx - 3, ly - 14, 1, 3);   // 左框
      bctx.fillRect(lx + 2, ly - 14, 1, 3);                               // 右框（暗）
      bctx.fillStyle = "#3e3020"; bctx.fillRect(lx - 3, ly - 12, 6, 1);   // 罩底
      bctx.fillStyle = "#4a3a28"; bctx.fillRect(lx - 2, ly - 11, 4, 1);   // 柱罩接環
      // 金頂飾（受光左緣）
      bctx.fillStyle = "#c08a3a"; bctx.fillRect(lx - 1, ly - 18, 2, 2);
      bctx.fillStyle = "#ffd166"; bctx.fillRect(lx - 1, ly - 18, 1, 1);
      // 琥珀玻璃（亮芯＋底暗，暖光）
      bctx.fillStyle = "#ffb45a"; bctx.fillRect(lx - 2, ly - 14, 4, 2);
      bctx.fillStyle = "#ffd166"; bctx.fillRect(lx - 1, ly - 14, 2, 1);
      bctx.fillStyle = "#d8903a"; bctx.fillRect(lx - 2, ly - 13, 4, 1);
      // 暖光暈（烘培進 base，確定性靜態）
      const glow = bctx.createRadialGradient(lx, ly - 13, 1, lx, ly - 13, 8);
      glow.addColorStop(0, "rgba(255,190,90,0.32)");
      glow.addColorStop(0.55, "rgba(255,190,90,0.10)");
      glow.addColorStop(1, "rgba(255,190,90,0)");
      bctx.fillStyle = glow;
      bctx.beginPath(); bctx.arc(lx, ly - 13, 8, 0, Math.PI * 2); bctx.fill();
    }
    const stalls = [[7.0, 23.0], [9.4, 23.0], [8.2, 24.4]];   // 南廣場 3 攤
    // v623：攤位 Soul's Remnant 可愛糖果化全重繪 — 條紋遮陽棚＋受光木櫃台＋糖果色貨物＋貼地柔影
    // （G2 主面明度 60–85%/暗部 ≥35%、G3 柔色染色輪廓非純黑、G5 左上受光、G6 單高光、R6 同色系雜訊；
    //  貼地影為暖色柔影,禁純黑禁深綠；全 seeded 確定性,零 Math.random）
    const stallGoods = [["#ff6f8a", "#e04a6a"], ["#7fd8c0", "#5cb8a0"], ["#6ac8ff", "#4aa8e0"]]; // 莓紅/薄荷/天空藍
    for (let idx = 0; idx < stalls.length; idx++) {
      const [sc, sr] = stalls[idx];
      const sx = isoX(sc, sr), sy = isoY(sc, sr);
      // 1. 貼地柔影（左下偏 1–2px,暖棕 30% 透明,疊草地後明度 ≈37% ≥35%）
      dia(sx + 1, sy + 1, 8, 3, "rgba(74,54,44,0.30)");
      // 2. 棚柱 ×2（受光面＋右暗面）
      bctx.fillStyle = "#c8915c"; bctx.fillRect(sx - 6, sy - 11, 2, 4);
      bctx.fillStyle = "#a06a40"; bctx.fillRect(sx - 5, sy - 11, 1, 4);
      bctx.fillStyle = "#c8915c"; bctx.fillRect(sx + 4, sy - 11, 2, 4);
      bctx.fillStyle = "#a06a40"; bctx.fillRect(sx + 5, sy - 11, 1, 4);
      // 3. 木櫃台（頂面受光/正面主面/右側暗面/左緣受光/底緣柔色染色輪廓/板縫）
      bctx.fillStyle = "#e8b478"; bctx.fillRect(sx - 6, sy - 7, 12, 1);
      bctx.fillStyle = "#f4cf96"; bctx.fillRect(sx - 6, sy - 7, 2, 1);    // 頂面左上受光斑
      bctx.fillStyle = "#c8915c"; bctx.fillRect(sx - 6, sy - 6, 12, 5);
      bctx.fillStyle = "#a06a40"; bctx.fillRect(sx + 4, sy - 6, 2, 5);
      bctx.fillStyle = "#e8b478"; bctx.fillRect(sx - 6, sy - 6, 1, 5);
      bctx.fillStyle = "#b07a48"; bctx.fillRect(sx - 5, sy - 2, 9, 1);    // 板縫（貨物之下）
      bctx.fillStyle = "#8a5630"; bctx.fillRect(sx - 6, sy - 1, 12, 1);
      // 櫃台正面 R6 雜訊（先灑,貨物後蓋不被吃掉）
      speckAt(sx - 5, sy - 6, 9, 5, "#c8915c", ["#d89a64", "#b88450", "#e2a96e"], 11);
      // 4. 貨物 ×2（檸檬箱固定＋依 idx 輪換糖果色,各深階底列＋右稜＋左上單 1px 高光）
      bctx.fillStyle = "#ffd166"; bctx.fillRect(sx - 4, sy - 5, 3, 3);
      bctx.fillStyle = "#e0a94a"; bctx.fillRect(sx - 4, sy - 3, 3, 1);
      bctx.fillStyle = "#dda044"; bctx.fillRect(sx - 2, sy - 5, 1, 2);    // 右稜深階
      bctx.fillStyle = "#fff0b8"; bctx.fillRect(sx - 4, sy - 5, 1, 1);
      const [g1, g2] = stallGoods[idx % stallGoods.length];
      bctx.fillStyle = g1; bctx.fillRect(sx + 1, sy - 5, 3, 3);
      bctx.fillStyle = g2; bctx.fillRect(sx + 1, sy - 3, 3, 1);
      bctx.fillStyle = shade(g2, -0.12); bctx.fillRect(sx + 3, sy - 5, 1, 2);  // 右稜深階
      bctx.fillStyle = shade(g1, 0.35); bctx.fillRect(sx + 1, sy - 5, 1, 1);
      // 5. 條紋棚頂（2px 直條交替 7 條,A 條底列深一階出體積,脊線單高光,下緣扇貝波浪檐）
      for (let k = 0; k < 7; k++) {
        bctx.fillStyle = (k % 2 === 0) ? "#ff7a6a" : "#e0574b";
        bctx.fillRect(sx - 7 + k * 2, sy - 13, 2, 3);
        if (k % 2 === 0) { bctx.fillStyle = "#f26a58"; bctx.fillRect(sx - 7 + k * 2, sy - 11, 2, 1); }
      }
      bctx.fillStyle = "#ffa08e"; bctx.fillRect(sx - 7, sy - 13, 14, 1);   // 脊線高光
      for (let k = 0; k < 7; k += 2) {                                      // 扇貝邊（A 條下掛 1px）
        bctx.fillStyle = "#ff7a6a"; bctx.fillRect(sx - 7 + k * 2, sy - 10, 2, 1);
      }
      for (let k = 1; k < 7; k += 2) {                                      // 扇貝間凹影
        bctx.fillStyle = "#c94a3e"; bctx.fillRect(sx - 7 + k * 2, sy - 10, 2, 1);
      }
      // 6. 棚面 R6 雜訊（同色系 ±1 階）
      speckAt(sx - 7, sy - 13, 14, 3, "#ff7a6a", ["#ff8a7a", "#e8675a", "#ff9585"], 7);
    }
    // v317：郵筒（東街×中街轉角 — 藍柱＋紅旗）
    {
      const mx = isoX(13.4, 19.6), my = isoY(13.4, 19.6);
      bctx.fillStyle = "#3a5a7a"; bctx.fillRect(mx - 2, my - 6, 4, 6);    // 筒身
      bctx.fillStyle = "#4a6a8a"; bctx.fillRect(mx - 2, my - 5, 4, 1);
      bctx.fillStyle = "#2a4a6a"; bctx.fillRect(mx - 2, my - 2, 4, 1);
      bctx.fillStyle = "#c8402f"; bctx.fillRect(mx + 2, my - 6, 2, 2);    // 紅旗
      bctx.fillStyle = "#1a2a3a"; bctx.fillRect(mx - 1, my - 8, 2, 2);    // 頂
    }
    // v316：晾衣繩（東街北段屋後 — 兩柱＋繩＋衣物）
    {
      const x0 = isoX(14.2, 16.2), y0 = isoY(14.2, 16.2) - 8;
      const x1 = isoX(15.0, 17.0), y1 = isoY(15.0, 17.0) - 8;
      bctx.strokeStyle = "#5a4a3a"; bctx.lineWidth = 1;
      bctx.beginPath(); bctx.moveTo(x0, y0); bctx.lineTo(x1, y1); bctx.stroke();
      bctx.fillStyle = "#4a3520"; bctx.fillRect(x0 - 1, y0 - 1, 2, 2);
      bctx.fillStyle = "#4a3520"; bctx.fillRect(x1 - 1, y1 - 1, 2, 2);
      // 衣物：紅/藍/白三件
      bctx.fillStyle = "#e85c5c"; bctx.fillRect((x0 + x1) / 2 - 5, (y0 + y1) / 2 - 1, 4, 4);
      bctx.fillStyle = "#4fc3f7"; bctx.fillRect((x0 + x1) / 2, (y0 + y1) / 2 - 1, 3, 4);
      bctx.fillStyle = "#f2f2ff"; bctx.fillRect((x0 + x1) / 2 + 3, (y0 + y1) / 2, 2, 3);
    }
    // v315：生活道具 — 柴堆（西街北段）＋水桶（水井旁）
    {
      const wx = isoX(4.0, 16.8), wy = isoY(4.0, 16.8);
      bctx.fillStyle = "#5a3a20"; bctx.fillRect(wx - 3, wy - 3, 6, 4);   // 柴堆
      bctx.fillStyle = "#7a5230"; bctx.fillRect(wx - 3, wy - 3, 6, 1);
      bctx.fillStyle = "#4a2a15"; bctx.fillRect(wx - 1, wy - 4, 2, 1);
    }
    {
      const bx = isoX(6.8, 24.4), by = isoY(6.8, 24.4);
      bctx.fillStyle = "#8a8a94"; bctx.fillRect(bx - 2, by - 3, 4, 4);   // 水桶
      bctx.fillStyle = "#4a4a55"; bctx.fillRect(bx - 2, by - 1, 4, 1);
      bctx.fillStyle = "#3a5a7a"; bctx.fillRect(bx - 1, by - 3, 2, 2);   // 水
    }
    // v314：城堡花圃（城堡南廣場東側 — 紅白小花＋綠叢）
    {
      const gx = isoX(8.2, 22.2), gy = isoY(8.2, 22.2);
      bctx.fillStyle = "#4a3520"; bctx.fillRect(gx - 10, gy - 5, 20, 5);   // 花圃邊
      bctx.fillStyle = "#6a4a2a"; bctx.fillRect(gx - 9, gy - 4, 18, 1);
      bctx.fillStyle = "#2a4a20"; bctx.fillRect(gx - 8, gy - 3, 16, 3);   // 泥土
      // 花：紅×3 白×2（5 朵）
      const flowers = [[-6, -4, "#e85c5c"], [-2, -3, "#f2f2ff"], [1, -5, "#e85c5c"], [5, -3, "#f2f2ff"], [6, -5, "#e85c5c"]];
      for (const [fx, fy, c] of flowers) {
        bctx.fillStyle = c;
        bctx.fillRect(gx + fx, gy + fy, 2, 2);
        bctx.fillStyle = "#ffd166";
        bctx.fillRect(gx + fx, gy + fy, 1, 1);
      }
    }
    // v313：廣場長椅（東街×中街旁 — 老婦休憩處；與其 homeNode 5 呼應）
    {
      const bx = isoX(12.8, 20.5), by = isoY(12.8, 20.5);
      bctx.fillStyle = "#5a3a20"; bctx.fillRect(bx - 7, by - 2, 14, 3);   // 椅面
      bctx.fillStyle = "#6a4a2a"; bctx.fillRect(bx - 7, by - 1, 14, 1);
      bctx.fillStyle = "#4a2a15"; bctx.fillRect(bx - 7, by - 4, 2, 2);    // 椅背
      bctx.fillRect(bx + 5, by - 4, 2, 2);
      bctx.fillStyle = "#4a2a15"; bctx.fillRect(bx - 7, by + 1, 2, 2);    // 椅腳
      bctx.fillRect(bx + 5, by + 1, 2, 2);
    }
    // v312：市集旗幟串（攤位間三角旗 — 節慶感）
    const flagPts = [[6.2, 22.2], [7.8, 22.2], [9.4, 22.2], [10.8, 22.2]];
    const flagColors = ["#c8402f", "#ffd166", "#4fc3f7", "#7ee787"];
    for (let k = 0; k < flagPts.length - 1; k++) {
      const [c0, r0] = flagPts[k], [c1, r1] = flagPts[k + 1];
      const x0 = isoX(c0, r0), y0 = isoY(c0, r0) - 12;
      const x1 = isoX(c1, r1), y1 = isoY(c1, r1) - 12;
      bctx.strokeStyle = "#3a3a42"; bctx.lineWidth = 1;
      bctx.beginPath(); bctx.moveTo(x0, y0); bctx.lineTo(x1, y1); bctx.stroke();
      bctx.fillStyle = flagColors[k];
      bctx.beginPath();
      bctx.moveTo(x0, y0); bctx.lineTo(x0 + 3, y0 + 3); bctx.lineTo(x0 + 6, y0);
      bctx.closePath(); bctx.fill();
    }
    ctx = saved;
  }

  /* ---------- 村外農田（TheoTown 鄉村感：圍籬麥田＋稻草人＋乾草堆，麥浪 fx 搖曳） ---------- */
  function drawFarm(bctx) {
    const saved = ctx; ctx = bctx;
    const cc = (FARM.c0 + FARM.c1) / 2, cr = (FARM.r0 + FARM.r1) / 2;
    const cx = isoX(cc, cr), cy = isoY(cc, cr);
    // 田地（泥土基底，菱形）
    dia(cx, cy, (FARM.c1 - FARM.c0) * TW / 2 + 10, (FARM.r1 - FARM.r0) * TH / 2 + 6, "#6a4a2a");
    dia(cx, cy, (FARM.c1 - FARM.c0) * TW / 2 + 4, (FARM.r1 - FARM.r0) * TH / 2 + 1, "#7a5a35");
    // v568：田塊雜訊（菱形內判定，seeded 麥稈亮暗）
    {
      const fcx = (FARM.c0 + FARM.c1) / 2, fcr = (FARM.r0 + FARM.r1) / 2;
      const FR = (FARM.c1 - FARM.c0) / 2 + 4;
      for (let i = 0; i < 90; i++) {
        const c2 = fcx + (rr(23, i, 5) - 0.5) * FR * 2;
        const r2 = fcr + (rr(29, i, 5) - 0.5) * FR * 2;
        if (Math.abs(c2 - fcx) + Math.abs(r2 - fcr) > FR) continue;
        ctx.fillStyle = rr(31, i, 5) < 0.5 ? "rgba(255,235,180,0.12)" : "rgba(0,0,0,0.10)";
        ctx.fillRect(isoX(c2, r2) - 1, isoY(c2, r2) - 1, 2, 1);
      }
    }
    // 耕壟（深色直條，每 tile 一列）
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    for (let c = FARM.c0 + 0.5; c < FARM.c1; c += 1) {
      const x = isoX(c, FARM.r0 + 1), y0 = isoY(c, FARM.r0 + 1) + 6;
      const y1 = isoY(c, FARM.r1 - 1) - 6;
      ctx.fillRect(x - 1, y0, 2, y1 - y0);
    }
    // 圍籬（北側＋東側：木樁＋雙橫桿）
    ctx.strokeStyle = "#5a3f24"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(isoX(FARM.c0, FARM.r0) - 10, isoY(FARM.c0, FARM.r0) - 2);
    ctx.lineTo(isoX(FARM.c1, FARM.r0) + 10, isoY(FARM.c1, FARM.r0) - 2);
    ctx.moveTo(isoX(FARM.c1, FARM.r0) + 4, isoY(FARM.c1, FARM.r0) - 2);
    ctx.lineTo(isoX(FARM.c1, FARM.r1) + 4, isoY(FARM.c1, FARM.r1) - 2);
    ctx.stroke();
    ctx.fillStyle = "#4a2f1a";
    for (let c = FARM.c0; c <= FARM.c1; c += 1) {
      const x = isoX(c, FARM.r0), y = isoY(c, FARM.r0) - 2;
      ctx.fillRect(x - 2, y - 5, 4, 8);
    }
    // 稻草人（田北側）：木桿＋稻草帽＋紅衣＋雙臂
    const scx = isoX(FARM.c0 + 0.5, FARM.r0 + 0.5), scy = isoY(FARM.c0 + 0.5, FARM.r0 + 0.5);
    ctx.fillStyle = "#6a4a2a"; ctx.fillRect(scx - 1, scy - 16, 2, 16);
    ctx.fillStyle = "#d8b45c"; ctx.fillRect(scx - 5, scy - 20, 10, 4);
    ctx.fillStyle = "#8a4a3a"; ctx.fillRect(scx - 3, scy - 14, 6, 6);
    ctx.fillStyle = "#d8b45c";
    ctx.fillRect(scx - 8, scy - 13, 5, 2); ctx.fillRect(scx + 3, scy - 13, 5, 2);
    // 乾草堆（田南角）
    const hx = isoX(FARM.c1 - 0.5, FARM.r1 - 0.5), hy = isoY(FARM.c1 - 0.5, FARM.r1 - 0.5);
    ctx.fillStyle = "#c89a3a"; ctx.fillRect(hx - 8, hy - 8, 16, 8);
    ctx.fillStyle = "#e0b45c"; ctx.fillRect(hx - 6, hy - 11, 12, 4);
    ctx.fillStyle = "#c89a3a"; ctx.fillRect(hx - 4, hy - 13, 8, 3);
    ctx.strokeStyle = "#8a6a2a"; ctx.lineWidth = 2; ctx.strokeRect(hx - 8, hy - 8, 16, 8);
    // v319：蔬菜壟（麥田外側小菜園 — 紅蘿蔔/綠葉/南瓜）
    const vegs = [[19.8, 22.8, "#e0704a"], [20.6, 22.8, "#6a9a3a"], [21.4, 22.8, "#e8a040"], [20.2, 24.8, "#e0704a"], [21.0, 24.8, "#6a9a3a"], [21.8, 24.8, "#e8a040"]];
    for (const [vc, vr, vc2] of vegs) {
      const vx = isoX(vc, vr), vy = isoY(vc, vr);
      ctx.fillStyle = "#4a3520"; ctx.fillRect(vx - 3, vy - 1, 6, 2);   // 壟
      ctx.fillStyle = vc2;
      ctx.fillRect(vx - 1, vy - 3, 2, 2);   // 蔬菜
      ctx.fillStyle = "#3a6a2a"; ctx.fillRect(vx - 2, vy - 4, 4, 1);   // 葉
    }
    ctx = saved;
  }

  /* v318：農田烏鴉 — 偶爾飛落稻草人附近再飛走（rm 定幀在枝上） */
  function drawCrowFx(t, sx, sy) {
    const st = S();
    const rm = !!(st.settings && st.settings.reducedMotion);
    const scx = isoX(FARM.c0 + 0.5, FARM.r0 + 0.5), scy = isoY(FARM.c0 + 0.5, FARM.r0 + 0.5);
    const px = sx(scx + 8), py = sy(scy - 18);
    if (px < -30 || px > VW + 30 || py < -30 || py > VH + 30) return;
    if (rm) {
      // 定幀: 停在稻草人肩上
      ctx.fillStyle = "#1a1a22";
      ctx.fillRect(px - 2, py - 2, 4, 3);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(px + 1, py - 2, 1, 1);
      return;
    }
    // 週期: 8s 循環 — 0-0.3 飛入、0.3-0.7 停駐、0.7-1 飛走
    const ph = (t / 8000) % 1;
    let cx2 = px, cy2 = py, wing = 0;
    if (ph < 0.3) {
      const f = ph / 0.3;
      cx2 = px - 40 + f * 40;
      cy2 = py - 24 + f * 24;
      wing = Math.floor(t / 90) % 2;
    } else if (ph < 0.7) {
      cx2 = px; cy2 = py;
      wing = 0;
    } else {
      const f = (ph - 0.7) / 0.3;
      cx2 = px + f * 44;
      cy2 = py - 26 + f * 26;
      wing = Math.floor(t / 90) % 2;
    }
    ctx.fillStyle = "#1a1a22";
    ctx.fillRect(cx2 - 2, cy2 - 2, 4, 3);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(cx2 + 1, cy2 - 2, 1, 1);
    if (wing) { ctx.fillRect(cx2 - 3, cy2 - 1, 2, 1); ctx.fillRect(cx2 + 2, cy2 - 1, 2, 1); }
  }

  /* 麥浪：每簇 3 根麥穗（金穗＋綠稈）隨風搖曳；reducedMotion 時 t=0 定幀 */
  function drawFarmFx(t, sx, sy) {
    for (let i = 0; i < WHEAT_TILES.length; i++) {
      const [c, r] = WHEAT_TILES[i];
      const x = isoX(c, r), y = isoY(c, r);
      if (x < offX - 40 || x > offX + VW + 40 || y < offY - 40 || y > offY + VH + 40) continue;
      const sw = Math.sin(t / 520 + i * 0.9) * 1.4;   // 風擺
      const px = sx(x), py = sy(y);
      for (let k = -1; k <= 1; k++) {
        const sx0 = px + k * 3 + sw * (k === 0 ? 1 : 0.5);
        ctx.fillStyle = "#7a9a3a"; ctx.fillRect(sx0, py - 5, 1, 5);
        ctx.fillStyle = "#e8c84a"; ctx.fillRect(sx0 - 1, py - 8, 3, 3);
        ctx.fillStyle = "#ffd166"; ctx.fillRect(sx0, py - 8, 1, 2);
      }
    }
  }

  /* ---------- 區域地標（TheoTown 風聚落感：已解鎖區各有主題地標，擊敗 BOSS 升級） ---------- */
  /* v568：box 去黑框 — 左上受光（上緣+左緣提亮）、右下漸暗（右緣+底兩階）、seeded 面雜訊；
     輪廓靠同系深階底緣＋lmShadow 地面陰影分離（TheoTown 規則 3/4/5/6）；v567 金飾疊繪在 box 之上不受影響 */
  function box(x, y, w, h, c) {
    ctx.fillStyle = c; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = shade(c, 0.12); ctx.fillRect(x, y, w, 1);        // 上緣受光
    ctx.fillStyle = shade(c, 0.05); ctx.fillRect(x, y, 1, h);        // 左緣受光
    ctx.fillStyle = shade(c, -0.10); ctx.fillRect(x + w - 1, y, 1, h);  // 右緣陰影
    ctx.fillStyle = shade(c, -0.14); ctx.fillRect(x, y + h - 1, w, 1);  // 底緣
    ctx.fillStyle = shade(c, -0.22); ctx.fillRect(x + 1, y + h - 2, w - 2, 1); // 底兩階過渡
    speckAt(x + 1, y + 1, w - 2, h - 2, c, [shade(c, 0.07), shade(c, -0.08)], x + y * 3);
    ctx.fillStyle = c;
  }
  /* v568：tri 去黑框 — 左半受光右半暗＋脊線亮＋三角內雜訊 */
  function tri(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x, y - h); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(c, 0.09);
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x, y - h); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(c, -0.09);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(c, 0.18); ctx.fillRect(x, y - h + 1, 1, h - 1);  // 脊線
    speckTri(x, y, w, h, c, [shade(c, 0.06), shade(c, -0.07)], x + y * 5);
    ctx.fillStyle = c;
  }
  function lmLine(x0, y0, x1, y1, c) {
    ctx.fillStyle = c;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    for (let i = 0; i < 80 && (x !== x1 || y !== y1); i++) {
      ctx.fillRect(x - 1, y - 1, 3, 3);
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    ctx.fillRect(x - 1, y - 1, 3, 3);
  }
  /* v578：lmShadow 深綠化 — TheoTown 官方陰影文法（黑 20% 覆蓋於草地 = 深綠家族，非純黑）；
     高度 4→5、寬度 +6，讓地標在村落草地與傳送帶上「坐」得更穩（區/模式地標共用，風格一致） */
  function lmShadow(x, y, w) {
    ctx.fillStyle = "rgba(18,34,16,0.5)";
    ctx.fillRect(x - w / 2 - 2, y, w + 6, 5);
  }
  /* v567：征服金飾語彙（tier2/3 共用 — R4 左亮右暗、無黑輪廓）
     lmGoldLine = 金色飾帶（左半 #e8c84a 亮 / 右半 #c8a030 暗，光源左上） */
  function lmGoldLine(ax, y, w) {
    ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - w / 2, y, w / 2, 1);
    ctx.fillStyle = "#c8a030"; ctx.fillRect(ax, y, w / 2, 1);
  }
  /* lmGoldBase = 全通金底座（tier3 統一語言：征服完成的地標根部 2px 金環） */
  function lmGoldBase(ax, ay, w) {
    ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - w / 2, ay + 1, w / 2, 2);
    ctx.fillStyle = "#c8a030"; ctx.fillRect(ax, ay + 1, w / 2, 2);
  }

  // 0 風車磨坊（草原）：石塔＋紅錐頂＋風車葉片（fx 轉動）；tier 金旗
  // v567 pt2（進度≥5）：紅屋頂金束帶＋門旁金麥束；pt3（全通10/10）：金底座＋磨坊金招牌
  function lmWindmill(ax, ay, tier, pt) {
    lmShadow(ax, ay - 2, 26);
    box(ax - 7, ay - 22, 14, 22, "#d8d0c0");
    ctx.fillStyle = "#b8b0a0";
    ctx.fillRect(ax - 7, ay - 18, 14, 2); ctx.fillRect(ax - 7, ay - 10, 14, 2);
    ctx.fillRect(ax - 7, ay - 6, 5, 2); ctx.fillRect(ax + 2, ay - 6, 5, 2);
    box(ax - 3, ay - 6, 6, 6, "#5a4a34");
    ctx.fillStyle = "#7a6a54"; ctx.fillRect(ax - 5, ay - 19, 2, 4); ctx.fillRect(ax + 3, ay - 19, 2, 4);
    tri(ax, ay - 22, 18, 14, tier ? "#b83020" : "#c8402f");
    ctx.fillStyle = "#4a3a2a"; ctx.fillRect(ax - 1, ay - 38, 2, 6);   // 旗杆
    if (pt >= 2) {
      lmGoldLine(ax, ay - 28, 10);                       // 屋頂金束帶
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 5, ay - 4, 2, 2); ctx.fillRect(ax + 3, ay - 4, 2, 2);  // 門旁金麥束
    }
    if (pt >= 3) {
      lmGoldBase(ax, ay, 18);                            // 全通金底座
      ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax + 8, ay - 10, 6, 4);   // 磨坊招牌
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax + 9, ay - 9, 2, 2); ctx.fillStyle = "#c8a030"; ctx.fillRect(ax + 11, ay - 9, 2, 2);
    }
  }
  // 1 獵人小屋（森林）：原木牆＋茅草頂＋煙囪（fx 煙）；tier 窗亮燈＋鹿角
  // v567 pt2（進度≥5）：屋簷金邊＋第二扇亮燈窗；pt3（全通）：金門框＋金底座
  function lmCabin(ax, ay, tier, pt) {
    lmShadow(ax, ay - 2, 24);
    box(ax + 7, ay - 22, 3, 8, "#5a4a3a");          // 煙囪
    tri(ax, ay - 14, 26, 12, "#7a8a4a");            // 茅草頂
    box(ax - 11, ay - 14, 22, 14, "#6a4a2a");       // 原木牆
    ctx.fillStyle = "#4a3220"; ctx.fillRect(ax - 11, ay - 11, 22, 2); ctx.fillRect(ax - 11, ay - 7, 22, 2);
    box(ax - 2, ay - 6, 5, 6, "#3a2a1a");           // 門
    ctx.fillStyle = tier ? "#ffd166" : "#8a6a3a"; ctx.fillRect(ax - 8, ay - 11, 4, 4);  // 窗
    if (tier) {
      ctx.strokeStyle = "#d8d0c0"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax + 4, ay - 18); ctx.lineTo(ax + 2, ay - 20); ctx.lineTo(ax + 4, ay - 21); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax + 5, ay - 18); ctx.lineTo(ax + 7, ay - 20); ctx.lineTo(ax + 5, ay - 21); ctx.stroke();
    }
    if (pt >= 2) {
      lmGoldLine(ax, ay - 13, 20);                                       // 屋簷金邊
      ctx.fillStyle = "#ffd166"; ctx.fillRect(ax + 4, ay - 11, 4, 4);    // 第二扇窗亮燈
      ctx.fillStyle = "#c8a030"; ctx.fillRect(ax + 4, ay - 9, 4, 1);
    }
    if (pt >= 3) {
      lmGoldBase(ax, ay, 24);                                            // 全通金底座
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 3, ay - 8, 1, 6); ctx.fillRect(ax + 2, ay - 8, 1, 6);  // 金門框
      ctx.fillStyle = "#c8a030"; ctx.fillRect(ax - 3, ay - 8, 6, 1);
    }
  }
  // 2 礦坑口（洞穴）：岩壁拱口＋木支架＋軌道礦車；tier 金礦＋第二台車
  // v567 pt2（進度≥5）：坑口金燈籠＋金軌道；pt3（全通）：坑口金拱＋金底座
  function lmMine(ax, ay, tier, pt) {
    lmShadow(ax, ay - 2, 32);
    ctx.fillStyle = "#2a2a38";
    ctx.fillRect(ax - 13, ay - 12, 26, 12);
    ctx.fillRect(ax - 10, ay - 15, 8, 4); ctx.fillRect(ax + 4, ay - 14, 6, 3);
    ctx.strokeStyle = "#3a3a48"; ctx.lineWidth = 2; ctx.strokeRect(ax - 13, ay - 12, 26, 12);
    ctx.fillStyle = "#0a0a14"; ctx.fillRect(ax - 6, ay - 11, 12, 11);   // 坑口
    ctx.fillStyle = "#05050c"; ctx.fillRect(ax - 4, ay - 8, 8, 8);
    box(ax - 8, ay - 14, 2, 14, "#6a4a2a"); box(ax + 6, ay - 14, 2, 14, "#6a4a2a");
    box(ax - 9, ay - 16, 18, 3, "#7a5a3a");                             // 頂梁
    ctx.fillStyle = "#8a8a9a"; ctx.fillRect(ax - 11, ay - 3, 22, 2);     // 軌道
    ctx.fillStyle = "#6a6a74";
    ctx.fillRect(ax - 9, ay - 1, 2, 2); ctx.fillRect(ax - 3, ay - 1, 2, 2); ctx.fillRect(ax + 3, ay - 1, 2, 2); ctx.fillRect(ax + 9, ay - 1, 2, 2);
    box(ax - 9, ay - 9, 8, 6, "#7a5a3a");                               // 礦車
    ctx.fillStyle = "#3a3a3a"; ctx.fillRect(ax - 8, ay - 3, 2, 2); ctx.fillRect(ax - 3, ay - 3, 2, 2);
    ctx.fillStyle = tier ? "#ffd166" : "#ff9a4d"; ctx.fillRect(ax - 7, ay - 10, 5, 3);
    if (tier) {
      box(ax + 4, ay - 8, 5, 4, "#8a6a4a");
      ctx.fillStyle = "#ffd166"; ctx.fillRect(ax + 5, ay - 9, 3, 2);
    }
    if (pt >= 2) {
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 8, ay - 11, 2, 3); ctx.fillRect(ax + 6, ay - 11, 2, 3);  // 坑口金燈籠
      ctx.fillStyle = "#c8a030"; ctx.fillRect(ax - 8, ay - 9, 2, 1); ctx.fillRect(ax + 6, ay - 9, 2, 1);
      lmGoldLine(ax, ay - 3, 20);                                        // 金軌道
    }
    if (pt >= 3) {
      lmGoldBase(ax, ay, 30);                                            // 全通金底座
      lmGoldLine(ax, ay - 17, 14);                                       // 坑口金拱
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 7, ay - 16, 1, 2); ctx.fillRect(ax + 6, ay - 16, 1, 2);
    }
  }
  // 3 火山祭壇（火山）：黑曜石壇＋熔岩渠＋火盆（fx 烈焰）；tier 金邊
  // v567 pt2（進度≥5）：金符文＋渠中金流；pt3（全通）：雙側火盆＋金底座
  function lmShrine(ax, ay, tier, pt) {
    lmShadow(ax, ay - 2, 30);
    box(ax - 14, ay - 6, 28, 6, "#2a2a3a");
    if (tier) { ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 14, ay - 6, 28, 2); }
    box(ax - 9, ay - 8, 18, 3, "#3a3a4a");
    box(ax - 6, ay - 16, 12, 10, "#26263a");
    ctx.fillStyle = "#ff9a4d"; ctx.fillRect(ax - 2, ay - 13, 4, 4);      // 熔岩符文
    ctx.fillStyle = "#4a1a0a"; ctx.fillRect(ax - 10, ay - 2, 20, 3);     // 熔岩渠
    ctx.fillStyle = "#ff6a2a"; ctx.fillRect(ax - 9, ay - 1, 18, 1);
    box(ax - 4, ay - 20, 8, 4, "#3a3a4a");                              // 火盆
    if (pt >= 2) {
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 4, ay - 12, 2, 2);    // 金符文
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 4, ay - 1, 8, 1);     // 渠中金流
    }
    if (pt >= 3) {
      lmGoldBase(ax, ay, 28);                                            // 全通金底座
      ctx.fillStyle = "#3a3a4a"; ctx.fillRect(ax - 12, ay - 18, 6, 3); ctx.fillRect(ax + 6, ay - 18, 6, 3);  // 雙側火盆
      ctx.fillStyle = "#ff9a4d"; ctx.fillRect(ax - 11, ay - 19, 4, 2); ctx.fillRect(ax + 7, ay - 19, 4, 2);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 10, ay - 19, 2, 1); ctx.fillRect(ax + 8, ay - 19, 2, 1);
    }
  }
  // 4 冰晶祭壇（冰原）：雪台＋三根水晶（tier 中央加高＋金環）
  // v567 pt2（進度≥5）：水晶金環＋底座冰花；pt3（全通）：雙金環＋金底座
  function lmIce(ax, ay, tier, pt) {
    lmShadow(ax, ay - 2, 24);
    box(ax - 11, ay - 4, 22, 4, "#d8eef5");
    if (tier) { ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 11, ay - 4, 22, 2); }
    tri(ax, ay - 4, 10, tier ? 24 : 20, "#bfe8ff");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(ax - 1, ay - (tier ? 20 : 16), 2, 8);
    tri(ax - 8, ay - 4, 6, 8, "#9fd8e8");
    tri(ax + 8, ay - 4, 5, 6, "#9fd8e8");
    if (pt >= 2) {
      lmGoldLine(ax, ay - 12, 6);                                        // 水晶金環
      ctx.fillStyle = "#e8f8ff"; ctx.fillRect(ax - 8, ay - 2, 2, 2); ctx.fillRect(ax + 6, ay - 2, 2, 2);  // 底座冰花
    }
    if (pt >= 3) {
      lmGoldLine(ax, ay - 16, 6);                                        // 第二金環（雙環＝全通）
      lmGoldBase(ax, ay, 24);                                            // 全通金底座
    }
  }
  // 5 綠洲帳篷（荒漠）：水池＋帳棚＋棕櫚（tier 金邊帳棚）
  // v567 pt2（進度≥5）：帳棚金帶＋棕櫚金果；pt3（全通）：第二帳棚＋金底座
  function lmOasis(ax, ay, tier, pt) {
    lmShadow(ax, ay - 2, 28);
    box(ax - 12, ay - 3, 24, 4, "#4aa8e8");                             // 水池
    ctx.fillStyle = "#9adfff"; ctx.fillRect(ax - 8, ay - 2, 8, 1);
    tri(ax - 1, ay - 3, 22, 13, "#e8d0a0");                             // 帳棚
    ctx.fillStyle = "#b08a50"; ctx.fillRect(ax - 6, ay - 8, 12, 2);
    box(ax - 2, ay - 6, 4, 6, "#5a4a2a");
    if (tier) {
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax - 12, ay - 3); ctx.lineTo(ax - 1, ay - 16); ctx.lineTo(ax + 10, ay - 3); ctx.stroke();
    }
    ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax + 11, ay - 10, 3, 10);    // 棕櫚
    lmLine(ax + 12, ay - 10, ax + 6, ay - 16, "#3a8a4a");
    lmLine(ax + 12, ay - 10, ax + 18, ay - 16, "#3a8a4a");
    lmLine(ax + 12, ay - 10, ax + 12, ay - 18, "#3a8a4a");
    lmLine(ax + 12, ay - 10, ax + 9, ay - 17, "#3a8a4a");
    lmLine(ax + 12, ay - 10, ax + 15, ay - 17, "#3a8a4a");
    if (pt >= 2) {
      lmGoldLine(ax - 1, ay - 10, 16);                                   // 帳棚金帶
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax + 11, ay - 7, 2, 2); ctx.fillStyle = "#c8a030"; ctx.fillRect(ax + 11, ay - 6, 2, 1);  // 棕櫚金果
    }
    if (pt >= 3) {
      tri(ax - 14, ay - 3, 12, 8, "#e8d0a0");                            // 第二帳棚
      ctx.fillStyle = "#b08a50"; ctx.fillRect(ax - 12, ay - 8, 6, 1);
      lmGoldLine(ax - 14, ay - 8, 8);                                    // 帳棚金帶
      lmGoldBase(ax, ay, 26);                                            // 全通金底座
    }
  }
  // 6 巫婆小屋（沼澤）：高腳歪屋＋藥鍋火堆（fx 泡泡＋窗光）；tier 紫光藥水
  // v567 pt2（進度≥5）：門旁南瓜燈；pt3（全通）：屋簷金邊＋藥鍋金湯＋金底座
  function lmWitch(ax, ay, tier, pt) {
    lmShadow(ax, ay - 2, 26);
    ctx.fillStyle = "#3a2a1a"; ctx.fillRect(ax - 10, ay - 3, 3, 8); ctx.fillRect(ax + 7, ay - 3, 3, 8);
    box(ax - 11, ay - 15, 22, 12, "#4a3a2a");
    ctx.fillStyle = "#3a2a1a"; ctx.fillRect(ax - 11, ay - 12, 22, 2); ctx.fillRect(ax - 11, ay - 8, 22, 2);
    ctx.fillStyle = "#5a6a3a";
    ctx.beginPath(); ctx.moveTo(ax - 13, ay - 15); ctx.lineTo(ax - 1, ay - 26); ctx.lineTo(ax + 12, ay - 15); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#4a5a30"; ctx.lineWidth = 2; ctx.stroke();
    box(ax - 9, ay - 9, 5, 9, "#2a1f16");
    ctx.fillStyle = tier ? "#b08aff" : "#1a2a1a"; ctx.fillRect(ax + 3, ay - 12, 5, 5);
    box(ax - 4, ay - 9, 8, 6, "#3a3a3a");                               // 藥鍋
    ctx.fillStyle = tier ? "#b08aff" : "#4a8a3a"; ctx.fillRect(ax - 3, ay - 8, 6, 2);
    ctx.fillStyle = "#ff6a2a"; ctx.fillRect(ax - 3, ay - 5, 6, 2);       // 火堆
    if (pt >= 2) {
      ctx.fillStyle = "#e8704a"; ctx.fillRect(ax - 6, ay - 3, 4, 3);     // 南瓜燈
      ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 5, ay - 2, 1, 1); ctx.fillRect(ax - 3, ay - 2, 1, 1);
      ctx.fillStyle = "#c05838"; ctx.fillRect(ax - 6, ay - 1, 4, 1);
    }
    if (pt >= 3) {
      lmGoldLine(ax - 1, ay - 16, 20);                                   // 屋簷金邊
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 3, ay - 8, 6, 2);     // 藥鍋金湯
      lmGoldBase(ax, ay, 26);                                            // 全通金底座
    }
  }
  // 7 瞭望塔（蒼穹）：高腳木塔＋十字支撐＋旗杆（fx 旗飄＋tier 燈塔光）
  // v567 pt2（進度≥5）：窗框金飾＋塔身金釘；pt3（全通）：屋簷金邊＋金底座
  function lmTower(ax, ay, tier, pt) {
    lmShadow(ax, ay - 2, 22);
    box(ax - 8, ay - 14, 3, 14, "#6a4a2a"); box(ax + 5, ay - 14, 3, 14, "#6a4a2a");
    lmLine(ax - 5, ay - 14, ax + 6, ay - 2, "#4a3220");
    box(ax - 10, ay - 16, 20, 3, "#7a5a3a");
    box(ax - 7, ay - 30, 14, 14, "#8a6a4a");
    ctx.fillStyle = "#5a3a2a"; ctx.fillRect(ax - 7, ay - 27, 14, 2); ctx.fillRect(ax - 7, ay - 22, 14, 2); ctx.fillRect(ax - 7, ay - 17, 14, 2);
    ctx.fillStyle = "#2a1a10"; ctx.fillRect(ax - 4, ay - 26, 2, 6); ctx.fillRect(ax + 2, ay - 26, 2, 6);
    tri(ax, ay - 30, 16, 10, "#5a3a2a");
    ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax - 1, ay - 42, 2, 6);
    if (pt >= 2) {
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 5, ay - 27, 4, 1); ctx.fillStyle = "#c8a030"; ctx.fillRect(ax + 1, ay - 27, 4, 1);  // 窗框金飾
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 6, ay - 20, 1, 1); ctx.fillRect(ax + 5, ay - 20, 1, 1);  // 塔身金釘
    }
    if (pt >= 3) {
      lmGoldLine(ax, ay - 31, 12);                                       // 屋簷金邊
      lmGoldBase(ax, ay, 22);                                            // 全通金底座
    }
  }
  // 8 裂谷哨站（深淵）：懸崖木柵＋燈籠（fx 搖曳）；tier 紅旗＋繩橋
  // v567 pt2（進度≥5）：柵頂金帶＋金燈籠；pt3（全通）：金旗＋金底座
  function lmOutpost(ax, ay, tier, pt) {
    lmShadow(ax, ay - 2, 32);
    ctx.fillStyle = "#1a1020";
    ctx.fillRect(ax - 15, ay - 8, 30, 8);
    ctx.fillRect(ax - 15, ay - 11, 6, 3); ctx.fillRect(ax - 6, ay - 12, 5, 4); ctx.fillRect(ax + 4, ay - 10, 6, 2);
    ctx.strokeStyle = "#241a2c"; ctx.lineWidth = 2; ctx.strokeRect(ax - 15, ay - 8, 30, 8);
    ctx.strokeStyle = "#2a1a30"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax - 8, ay - 8); ctx.lineTo(ax - 8, ay - 1); ctx.stroke();
    ctx.fillStyle = "#5a4a3a";
    for (let i = 0; i < 5; i++) {
      const sx0 = ax - 13 + i * 5;
      ctx.fillRect(sx0, ay - 12, 3, 5);
      ctx.fillRect(sx0 - 1, ay - 13, 5, 2);
    }
    ctx.fillRect(ax - 14, ay - 11, 28, 2);
    if (tier) {
      ctx.fillStyle = "#c8402f"; ctx.fillRect(ax - 14, ay - 15, 6, 4);
      ctx.strokeStyle = "#8a6a4a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax + 13, ay - 6); ctx.quadraticCurveTo(ax + 18, ay - 12, ax + 24, ay - 6); ctx.stroke();
    }
    if (pt >= 2) {
      lmGoldLine(ax, ay - 13, 28);                                       // 柵頂金帶
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 13, ay - 17, 2, 3); ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 12, ay - 18, 1, 1);  // 金燈籠
    }
    if (pt >= 3) {
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 14, ay - 16, 6, 4);   // 金旗
      ctx.fillStyle = "#c8a030"; ctx.fillRect(ax - 11, ay - 16, 3, 4);
      lmGoldBase(ax, ay, 30);                                            // 全通金底座
    }
  }
  // 9 遺跡拱門（神話）：石拱＋符文＋浮球（fx 脈動）；tier 金球
  // v567 pt2（進度≥5）：柱上金符文；pt3（全通）：柱頭金冠＋金底座
  function lmRuins(ax, ay, tier, pt) {
    lmShadow(ax, ay - 2, 26);
    box(ax - 12, ay - 2, 24, 3, "#6a6a7a");
    box(ax - 10, ay - 18, 5, 16, "#8a8a9a");
    box(ax + 5, ay - 18, 5, 16, "#8a8a9a");
    box(ax - 10, ay - 24, 20, 6, "#8a8a9a");
    ctx.fillStyle = "#4a4a58"; ctx.fillRect(ax - 7, ay - 20, 14, 2);
    ctx.strokeStyle = "#5a5a6a"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax - 8, ay - 18); ctx.lineTo(ax - 6, ay - 12); ctx.lineTo(ax - 8, ay - 6); ctx.stroke();
    ctx.fillStyle = "#c8c8d8";
    ctx.fillRect(ax - 8, ay - 15, 2, 3); ctx.fillRect(ax - 8, ay - 10, 2, 2);
    ctx.fillRect(ax + 6, ay - 15, 2, 3); ctx.fillRect(ax + 6, ay - 10, 2, 2);
    if (pt >= 2) {
      ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 8, ay - 13, 2, 2); ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax + 6, ay - 8, 2, 2);  // 柱上金符文
    }
    if (pt >= 3) {
      lmGoldLine(ax - 2, ay - 17, 12);                                   // 柱頭金冠
      lmGoldBase(ax, ay, 26);                                            // 全通金底座
    }
  }

  const LM_DRAW = [lmWindmill, lmCabin, lmMine, lmShrine, lmIce, lmOasis, lmWitch, lmTower, lmOutpost, lmRuins];

  function drawLandmarks(bctx) {
    const st = S();
    const maxReached = st.stats.maxRegionReached || 0;
    const saved = ctx; ctx = bctx;
    for (let i = 0; i < CENTERS.length; i++) {
      if (i > maxReached) continue;                 // 迷霧內不露餡
      const b = CENTERS[i];
      const ax = isoX(b.c, b.r), ay = isoY(b.c, b.r);
      // v567：地標征服視覺第二維 — tier（0/1）維持「擊敗守關 BOSS」既有升級語義不動；
      // progTier（0/2/3）為進度階：該區進度≥5 追加進階裝飾、≥10 全通追加金底座＋主題金飾
      const prog = (st.stats.maxStageByRegion && st.stats.maxStageByRegion[i]) || 0;
      const progTier = prog >= 10 ? 3 : prog >= 5 ? 2 : 0;
      LM_DRAW[i](ax, ay, i < maxReached ? 1 : 0, progTier);
      // v311：全通（10/10）標記 — 地標頂部小金冠（進度榮耀）
      if (prog >= 10) {
        const tx = ax, ty = ay - 24;
        bctx.fillStyle = "#ffd166";
        bctx.fillRect(tx - 3, ty - 2, 6, 2);
        bctx.fillRect(tx - 3, ty - 4, 2, 2);
        bctx.fillRect(tx + 1, ty - 4, 2, 2);
        bctx.fillRect(tx - 1, ty - 3, 2, 1);
      }
    }
    ctx = saved;
  }

  /* v307：小碼頭（燈塔旁 — 木板伸入海面＋樁柱；漁船停靠點）烘焙進 base */
  /* v307 碼頭 — v581 TheoTown 化重繪（P0 海洋活化「漁船/燈塔」碼頭半）：完整碼頭語彙 —
     受光甲板（板面亮/板身/板身暗階/底緣 R5）＋板縫＋前端立面＋樁柱＋水下暗影柱＋岸側階台＋
     纜繩柱＋絞繩兩圈＋貨物（木桶＋板條箱）；R1-R6 全合規、零黑輪廓；錨點 (dx,dy)、漁船靠泊
     座標 (45.5,25.2) 零變動；水下陰影與樁影為確定性靜態（船起伏為 fx 層） */
  function drawDock(bctx) {
    const dx = Math.round(isoX(45.5, 25.2)), dy = Math.round(isoY(45.5, 25.2));
    const P = (x, y, w, h, c) => { bctx.fillStyle = c; bctx.fillRect(dx + x, dy + y, w, h); };
    // 1. 甲板下陰影帶（deck 投在海水上的暗化 — 水色系深階，非黑）
    P(-12, 0, 28, 4, "rgba(8,12,28,0.5)");
    // 2. 樁柱×3（水上段受光＋木色；水下段暗影柱）
    for (const px2 of [-10, 0, 10]) {
      P(px2, 2, 2, 4, "#3a2c22");
      P(px2, 2, 1, 4, "#4a3a2a");
      P(px2, 6, 2, 3, "rgba(6,10,24,0.6)");   // 水下倒影（接水線）
    }
    // 3. 甲板（4 階：受光板面/板身/板身暗階/底緣）
    P(-12, -4, 28, 1, "#9a7a44");
    P(-12, -3, 28, 1, "#8a6a3a");
    P(-12, -2, 28, 1, "#7a5a30");
    P(-12, -1, 28, 1, "#5a3a20");
    // 板縫（斷續 1px — seeded 確定性）
    for (let i = 0; i < 5; i++) {
      const sx2 = -9 + i * 5;
      if (rr(dx * 3 + sx2, dy * 7 + i, 41) > 0.25) P(sx2, -4, 1, 3, "#58401f");
    }
    P(14, -4, 2, 4, "#4a3418");               // 前端立面（海側）
    // 4. 岸側階台（木板接陸 — 2 階）
    P(-14, -3, 3, 2, "#6a4a2a");
    P(-14, -3, 3, 1, "#7a5a34");
    P(-14, -1, 3, 1, "#4a3418");
    // 5. 纜繩柱＋絞繩兩圈（繫船端）
    P(8, -6, 3, 3, "#6a6a7a");
    P(8, -6, 3, 1, "#7a7a8a");
    P(8, -5, 1, 2, "#565664");
    P(7, -3, 5, 1, "#c8a060");
    P(8, -2, 3, 1, "#b89050");
    // 6. 貨物：木桶＋板條箱（岸側 — TheoTown 碼頭語彙）
    P(-10, -8, 5, 5, "#8a4a2a");              // 木桶身
    P(-10, -8, 2, 5, "#9a5a34");              // 左受光
    P(-6, -8, 1, 5, "#6e3a20");               // 右暗
    P(-10, -9, 5, 1, "#a86040");              // 桶口
    P(-9, -6, 5, 1, "#b07838");               // 桶箍
    P(-8, -8, 1, 5, "#5a2e1a");               // 板縫
    P(-10, -3, 5, 1, "rgba(16,30,14,0.35)");  // 桶底影
    P(-4, -7, 4, 4, "#7a5a34");               // 板條箱
    P(-4, -7, 1, 4, "#8a6a40");
    P(-2, -7, 1, 4, "#5e4826");
    P(-4, -7, 2, 1, "#5a3f22");               // X 交叉
    P(-2, -6, 2, 1, "#5a3f22");
    P(-4, -4, 1, 2, "#5a3f22");
  }

  /* v293/v567 海岸燈塔（蒼穹之塔東南角，面向右下海域）— v581 TheoTown 化重繪（P0 海洋活化「漁船/燈塔」燈塔半）：
     完整燈塔語彙 — lmShadow 深綠貼地斜影＋石基兩階（受光左/暗右/AO 角）＋條紋塔身（白/紅 4 帶，
     每帶左受光右暗＋底漸暗）＋拱門（暖光內）＋暖窗＋燈室（欄杆平台＋直立窗＋琥珀亮芯）＋穹頂陡坡＋
     金頂飾＋seeded 雜訊；R1-R6 全合規、無黑輪廓（門洞 #241a12）；錨點 (lx,ly) 與 v293 光束錨定
     (lx, ly-30) 零變動（燈室亮芯中心 = ly-30） */
  function drawLighthouse(bctx) {
    const lx = Math.round(isoX(44.5, 24.2)), ly = Math.round(isoY(44.5, 24.2));
    const P = (x, y, w, h, c) => { bctx.fillStyle = c; bctx.fillRect(lx + x, ly + y, w, h); };
    const W = "#e4e4ec", WL = "#f2f2f8", WD = "#c6c6d2", WS = "#d2d2dc";   // 白帶（R1/R2：低飽和灰白家族）
    const R = "#a85038", RL = "#b86048", RD = "#84382c";                   // 紅帶（v567 降飽和紅家族）
    // 0. 貼地斜影（全地標 lmShadow 深綠文法 — 黑 20% 覆蓋原地色）
    lmShadow(lx, ly - 2, 26);
    // 1. 石基兩階（tier1 高 3px＋tier2 高 2px；左上受光/R5 底漸暗/AO 角）
    P(-8, -6, 16, 3, "#6a6a7a");
    P(-8, -6, 4, 3, "#7a7a8a");
    P(4, -6, 4, 3, "#565664");
    P(-8, -4, 16, 1, "#4a4a56");
    P(-9, -2, 18, 2, "#5a5a6a");
    P(-9, -2, 5, 2, "#6a6a7a");
    P(4, -2, 5, 2, "#484852");
    // 2. 塔身條紋 4 帶（各 5px：白/紅/白/紅；每帶左受光 2px＋右暗 2px＋底漸暗 1px）
    const band = (y, mid, lit, dk, bot) => {
      P(-6, y, 12, 5, mid);
      P(-6, y, 2, 5, lit);
      P(4, y, 2, 5, dk);
      P(-6, y + 4, 12, 1, bot);
    };
    band(-26, W, WL, WD, WS);   // 白 1
    band(-21, R, RL, RD, "#96402c");   // 紅 1（窗佔）
    band(-16, W, WL, WD, WS);   // 白 2
    band(-11, R, RL, RD, "#96402c");   // 紅 2
    // 3. 拱門（紅 2 帶＋石基上段；暖光透出）
    P(-2, -8, 5, 6, "#3a3226");        // 門框（同系深階，非黑）
    P(-1, -7, 3, 5, "#241a12");        // 門洞
    P(0, -6, 1, 2, "#ffb45a");         // 內暖光
    // 4. 暖窗（白 2 帶；暗框＋琥珀玻璃＋高光）
    P(-2, -15, 4, 4, "#5a5a66");       // 窗框
    P(-1, -14, 2, 2, "#ffd166");       // 琥珀玻璃
    P(-1, -14, 1, 1, "#ffe9a8");       // 高光
    // 5. 燈室（欄杆平台＋直立窗＋琥珀亮芯；亮芯中心 ly-30 = 光束錨點）
    P(-7, -27, 15, 2, "#5a5a6a");      // 欄杆平台
    P(-7, -27, 15, 1, "#6e6e7e");
    P(-7, -26, 15, 1, "#4a4a56");
    P(-6, -31, 13, 4, "#3a3a44");      // 燈室框
    P(-6, -31, 2, 4, "#4a4a58");
    P(5, -31, 2, 4, "#2c2c34");
    P(-6, -28, 13, 1, "#282830");
    P(-3, -30, 6, 3, "#ffd166");       // 琥珀亮芯
    P(-3, -30, 1, 2, "#ffe9a8");       // 玻璃高光
    P(-2, -30, 1, 3, "#4a4a54");       // 直立窗格（亮芯上）
    P(1, -30, 1, 3, "#4a4a54");
    // 6. 穹頂陡坡（紅家族由寬收窄；左受光）＋金頂飾
    P(-7, -32, 15, 1, "#5a2a24");      // 簷邊
    P(-6, -33, 13, 1, "#a85038");
    P(-6, -33, 2, 1, "#c06048");
    P(-4, -34, 9, 1, "#8a4030");
    P(-3, -35, 7, 1, "#7a3628");
    P(-2, -36, 5, 1, "#6a2c22");
    P(-2, -36, 2, 1, "#8a4030");       // 穹頂左受光
    P(-1, -38, 2, 1, "#ffd166");       // 金珠
    P(-1, -37, 2, 1, "#e8c84a");
    P(0, -39, 1, 1, "#ffe9a8");        // 金尖
    // 7. seeded 雜訊（白帶暗點＋亮點 / 紅帶亮點 — 打破平塗；全在帶內行，避開窗/門/底漸暗行）
    const mk = (i, y0, xmin, xmax, col) => {
      const sx = xmin + ((rr(lx * 7 + i * 31, ly * 3 + i * 17, 23) * (xmax - xmin)) | 0);
      P(sx, y0 + ((rr(lx + i * 5, ly + y0 * 7, 5) * 2) | 0), 1, 1, col);
    };
    mk(0, -25, -4, 2, "#c6c6d2"); mk(0, -24, -2, 4, "#f2f2f8");   // 白 1
    mk(1, -20, -4, 2, "#b86048"); mk(1, -19, -2, 4, "#84382c");   // 紅 1
    mk(2, -14, -5, -3, "#c6c6d2"); mk(2, -13, 2, 4, "#f2f2f8");   // 白 2（避窗：左/右兩側）
    mk(3, -10, -4, 2, "#b86048"); mk(3, -9, -2, 4, "#84382c");    // 紅 2
  }

  /* ---------- 模式地標（v278 合併移植：worldmap.js 入口 → 等角像素地標；v562 精緻化）
     繪製於村莊東方草原帶 — 石基/主題結構/多部件/貼地陰影＋細節，與區域地標同語彙（box/tri/lmShadow）。
     原 v278 移植版僅 1-3 個平色塊，密集帶上與區域地標（風車/冰塔/金字塔）明顯斷層 —
     v562 逐個加高加厚：arena 石環鬥場＋旗柱、royal 勝利柱拱門、dungeon 雙碑面＋側火把、
     worldboss 頭骨紀念碑、tower 四元素窗塔、maze 籬牆拱門、guild 茅頂宴棚、events 條紋棚看板、
     abyss 裂口石燈、exped 帳篷營地＋補給箱 ---------- */
  function mdRing(ax, ay) {        // 0 競技場：石環鬥場＋2 階基台＋拱門＋決鬥圈＋四角柱＋紅旗（v9：加高鬥牆/石基/拱形門洞，對齊 v578 文法）
    lmShadow(ax, ay - 2, 40);
    // 2 階石基台（底台＋上台階）＋前階
    box(ax - 19, ay - 4, 38, 4, "#5a5248");          // 底台
    box(ax - 17, ay - 7, 34, 3, "#6a6256");          // 上台階
    ctx.fillStyle = "#8a8272"; ctx.fillRect(ax - 17, ay - 7, 34, 1);   // 台緣高光
    ctx.fillStyle = "#4a4438"; ctx.fillRect(ax - 17, ay - 2, 34, 1);   // 台底陰影
    ctx.fillStyle = "#6a6256"; ctx.fillRect(ax - 7, ay, 14, 2);        // 前階踏面
    ctx.fillStyle = "#5a5248"; ctx.fillRect(ax - 7, ay + 1, 14, 1);    // 前階立面
    // 內場沙地（鬥牆後方可見）
    ctx.fillStyle = "#d8b888"; ctx.fillRect(ax - 13, ay - 13, 26, 9);  // 沙地
    ctx.fillStyle = "#e8ca98"; ctx.fillRect(ax - 13, ay - 13, 26, 1);  // 沙上受光
    ctx.fillStyle = "#c8a070"; ctx.fillRect(ax - 11, ay - 9, 22, 1); ctx.fillRect(ax - 13, ay - 11, 26, 1);
    ctx.fillStyle = "#b89060"; ctx.fillRect(ax - 6, ay - 10, 2, 2); ctx.fillRect(ax + 4, ay - 7, 2, 2); ctx.fillRect(ax - 12, ay - 5, 2, 2);  // 沙雜訊
    // 中央決鬥圈
    ctx.fillStyle = "#c09858"; ctx.fillRect(ax - 4, ay - 11, 8, 5);    // 圈底
    ctx.fillStyle = "#a87848"; ctx.fillRect(ax - 4, ay - 11, 8, 1);
    ctx.fillStyle = "#c8402f"; ctx.fillRect(ax - 3, ay - 9, 6, 1);     // 決鬥圈紅線
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 1, ay - 12, 2, 2);    // 圈心金點
    // 石環鬥牆（左受光/右陰影/底漸暗/拱形門洞）
    box(ax - 15, ay - 11, 30, 7, "#9a8a7a");         // 鬥牆
    ctx.fillStyle = "#b8a890"; ctx.fillRect(ax - 15, ay - 11, 2, 7);   // 左受光
    ctx.fillStyle = "#7a6a5a"; ctx.fillRect(ax + 13, ay - 11, 2, 7);   // 右陰影
    ctx.fillStyle = "#7a6a5a"; ctx.fillRect(ax - 7, ay - 5, 14, 1);    // 底漸暗
    ctx.fillStyle = "#8a7a6a"; ctx.fillRect(ax - 12, ay - 9, 1, 1); ctx.fillRect(ax + 5, ay - 10, 1, 1); ctx.fillRect(ax - 3, ay - 7, 1, 1);  // 石面雜訊
    // 兩座拱形門洞（深內口 #5a4a3a 非純黑）
    ctx.fillStyle = "#8a7a6a"; ctx.fillRect(ax - 10, ay - 10, 6, 1);   // 拱頂
    ctx.fillRect(ax - 10, ay - 9, 1, 1); ctx.fillRect(ax - 5, ay - 9, 1, 1);   // 拱肩
    ctx.fillStyle = "#6a5a4a"; ctx.fillRect(ax - 10, ay - 6, 6, 2);    // 門框
    ctx.fillStyle = "#5a4a3a"; ctx.fillRect(ax - 9, ay - 8, 4, 4);     // 深內口
    ctx.fillStyle = "#8a7a6a"; ctx.fillRect(ax + 4, ay - 10, 6, 1);    // 拱頂（右門）
    ctx.fillRect(ax + 4, ay - 9, 1, 1); ctx.fillRect(ax + 9, ay - 9, 1, 1);
    ctx.fillStyle = "#6a5a4a"; ctx.fillRect(ax + 4, ay - 6, 6, 2);
    ctx.fillStyle = "#5a4a3a"; ctx.fillRect(ax + 5, ay - 8, 4, 4);
    // 四角立柱（柱頭＋受光＋柱礎）
    for (const dx of [-13, 13]) {
      ctx.fillStyle = "#9a8a7a"; ctx.fillRect(ax + dx, ay - 14, 4, 9); // 柱身
      ctx.fillStyle = "#b8a890"; ctx.fillRect(ax + dx, ay - 14, 1, 9); // 左受光
      ctx.fillStyle = "#7a6a5a"; ctx.fillRect(ax + dx + 3, ay - 14, 1, 9); // 右陰影
      ctx.fillRect(ax + dx, ay - 6, 4, 1);                             // 柱底暗
      ctx.fillStyle = "#c8b8a0"; ctx.fillRect(ax + dx - 1, ay - 16, 6, 2); // 柱頭
      ctx.fillStyle = "#8a7a6a"; ctx.fillRect(ax + dx - 1, ay - 16, 1, 2); ctx.fillRect(ax + dx + 4, ay - 16, 1, 2);
    }
    // 兩側旗杆＋紅三角旗
    for (const s of [-1, 1]) {
      ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax + s * 17, ay - 16, 2, 10); // 旗杆
      ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax + s * 17, ay - 16, 1, 10); // 桿左受光
      ctx.fillStyle = "#7a5a34"; ctx.fillRect(ax + s * 17 + 1, ay - 16, 1, 10);
      ctx.fillStyle = "#c8402f"; ctx.fillRect(ax + s * 17 - (s > 0 ? 0 : 2), ay - 19, 4, 3);  // 紅旗
      ctx.fillStyle = "#e85c5c"; ctx.fillRect(ax + s * 17 - (s > 0 ? 1 : 1), ay - 18, 2, 1);  // 旗受光
    }
    // 中央旗柱（頂不高於舊 -22 之上 8px；fx 旗疊加其頂）
    ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax - 1, ay - 24, 2, 14);   // 中央旗柱 top ay-24
    ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax - 1, ay - 24, 1, 14);
    ctx.fillStyle = "#c8402f"; ctx.fillRect(ax - 2, ay - 26, 4, 3);    // 靜態紅旗（base 內可見）
    ctx.fillStyle = "#e85c5c"; ctx.fillRect(ax - 2, ay - 26, 2, 1);
    // v9 修色：金決鬥圈＋藍旗串＋常春藤＋紫寶石＋奶油石緣＋金底線（拉近風車色階）
    ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 5, ay - 12, 10, 1);   // 金圈外環
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 3, ay - 13, 6, 1);    // 金圈內環
    ctx.fillStyle = "#ca9a30"; ctx.fillRect(ax - 2, ay - 14, 4, 1);    // 圈沿金深
    ctx.fillStyle = "#2f8fd0"; ctx.fillRect(ax - 12, ay - 15, 2, 2);   // 藍旗串
    ctx.fillStyle = "#58b0e8"; ctx.fillRect(ax - 12, ay - 15, 1, 1);
    ctx.fillStyle = "#2f8fd0"; ctx.fillRect(ax + 10, ay - 16, 2, 2);   // 右藍旗
    ctx.fillStyle = "#3a7a3a"; ctx.fillRect(ax - 18, ay - 1, 4, 1); ctx.fillRect(ax + 14, ay - 1, 4, 1); // 基座常春藤
    ctx.fillStyle = "#4f8f4a"; ctx.fillRect(ax - 17, ay - 1, 2, 1); ctx.fillRect(ax + 15, ay - 1, 2, 1);
    ctx.fillStyle = "#7a4fcf"; ctx.fillRect(ax - 9, ay - 12, 2, 1);    // 拱頂紫寶石
    ctx.fillStyle = "#9a6ce8"; ctx.fillRect(ax - 9, ay - 13, 1, 1);
    ctx.fillStyle = "#e0d8c8"; ctx.fillRect(ax - 15, ay - 11, 1, 1); ctx.fillRect(ax + 14, ay - 11, 1, 1); // 石緣奶油高光
    ctx.fillStyle = "#c8a030"; ctx.fillRect(ax - 19, ay + 1, 38, 1);   // 金底線
    ctx.fillStyle = "#a82820"; ctx.fillRect(ax + 5, ay - 11, 1, 1);    // 勝利綬帶暗紅
  }
  function mdPodium(ax, ay) {      // 1 王者競技場：三層石台＋勝利柱拱門＋金飾帶紋章＋3 階梯（v9：分面受光＋層間 AO，對齊 v578）
    lmShadow(ax, ay - 2, 34);
    // 三層石台（每層左上受光/右下暗/層間 AO）
    box(ax - 15, ay - 6, 30, 6, "#6a6a7a");          // 底台
    ctx.fillStyle = "#7a7a8a"; ctx.fillRect(ax - 14, ay - 5, 28, 1);   // 台面高光
    ctx.fillStyle = "#4a4a58"; ctx.fillRect(ax - 15, ay - 1, 30, 1);   // 底陰影
    box(ax - 11, ay - 10, 22, 4, "#7a7a8a");         // 中台
    ctx.fillStyle = "#8a8a9a"; ctx.fillRect(ax - 10, ay - 9, 20, 1);
    ctx.fillStyle = "#4a4a58"; ctx.fillRect(ax - 11, ay - 7, 22, 1);   // 層間 AO
    box(ax - 7, ay - 14, 14, 4, "#8a8a9a");          // 頂台
    ctx.fillStyle = "#9a9aaa"; ctx.fillRect(ax - 6, ay - 13, 12, 1);
    ctx.fillStyle = "#5a5a6a"; ctx.fillRect(ax - 7, ay - 11, 14, 1);   // 層間 AO
    // 勝利柱（柱身分面＋金環飾＋柱頭）
    for (const s of [-1, 1]) {
      ctx.fillStyle = "#a09070"; ctx.fillRect(ax + s * 9 - 1, ay - 22, 4, 10);  // 柱身
      ctx.fillStyle = "#c0ac88"; ctx.fillRect(ax + s * 9 - 1, ay - 22, 1, 10);  // 左受光
      ctx.fillStyle = "#7a6a50"; ctx.fillRect(ax + s * 9 + 2, ay - 22, 1, 10);  // 右陰影
      ctx.fillStyle = "#8a7a58"; ctx.fillRect(ax + s * 9 - 1, ay - 14, 4, 1);   // 柱底暗
      ctx.fillStyle = "#ffd166"; ctx.fillRect(ax + s * 9 - 1, ay - 20, 4, 1);   // 金環（上）
      ctx.fillStyle = "#ffd166"; ctx.fillRect(ax + s * 9 - 1, ay - 16, 4, 1);   // 金環（下）
      ctx.fillStyle = "#b8a880"; ctx.fillRect(ax + s * 9 - 2, ay - 24, 6, 2);   // 柱頭
      ctx.fillStyle = "#e8d8a8"; ctx.fillRect(ax + s * 9 - 2, ay - 24, 6, 1);   // 柱頭受光
    }
    // 拱頂橫梁＋金飾帶＋中央紋章
    ctx.fillStyle = "#a09070"; ctx.fillRect(ax - 16, ay - 26, 32, 3);  // 拱梁
    ctx.fillStyle = "#c0ac88"; ctx.fillRect(ax - 16, ay - 26, 32, 1);  // 梁上受光
    ctx.fillStyle = "#7a6a50"; ctx.fillRect(ax - 16, ay - 24, 32, 1);  // 梁下暗
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 16, ay - 25, 32, 1);  // 金飾帶
    ctx.fillStyle = "#c8402f"; ctx.fillRect(ax - 3, ay - 25, 6, 1);    // 紋章底
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 2, ay - 26, 4, 1);    // 紋章盾金
    // 前階梯（3 階，踏面高光）
    ctx.fillStyle = "#8a8a9a"; ctx.fillRect(ax - 5, ay - 3, 10, 1);    // 踏面 1
    ctx.fillStyle = "#6a6a78"; ctx.fillRect(ax - 5, ay - 2, 10, 1);    // 立面
    ctx.fillStyle = "#8a8a9a"; ctx.fillRect(ax - 4, ay - 2, 8, 1);     // 踏面 2
    ctx.fillStyle = "#6a6a78"; ctx.fillRect(ax - 4, ay - 1, 8, 1);
    ctx.fillStyle = "#8a8a9a"; ctx.fillRect(ax - 3, ay - 1, 6, 1);     // 踏面 3
    ctx.fillStyle = "#6a6a78"; ctx.fillRect(ax - 3, ay, 6, 1);
    // 金冠（fx 疊加其頂）
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 2, ay - 28, 5, 1);
    ctx.fillStyle = "#e8d8a8"; ctx.fillRect(ax - 2, ay - 28, 1, 1);
    // v9 修色：御藍旗＋紅絨垂幔＋冠上紫寶石＋金穗帶＋綠花環＋奶油石柱（拉近風車色階）
    ctx.fillStyle = "#2a5aa0"; ctx.fillRect(ax - 3, ay - 21, 6, 1);   // 御藍旗帶
    ctx.fillStyle = "#4f8ad0"; ctx.fillRect(ax - 3, ay - 21, 3, 1);
    for (const s of [-1, 1]) {                                         // 紅絨垂幔
      ctx.fillStyle = "#a02018"; ctx.fillRect(ax + s * 9 + (s > 0 ? 1 : -2), ay - 12, 2, 6);
      ctx.fillStyle = "#b83a2a"; ctx.fillRect(ax + s * 9 + (s > 0 ? 1 : -2), ay - 12, 1, 3);
    }
    ctx.fillStyle = "#6a3fb0"; ctx.fillRect(ax - 1, ay - 29, 3, 1);   // 冠上紫寶石
    ctx.fillStyle = "#8a5edc"; ctx.fillRect(ax - 1, ay - 29, 1, 1);
    ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 5, ay - 18, 10, 1);  // 金穗帶
    ctx.fillStyle = "#c8a030"; ctx.fillRect(ax - 5, ay - 18, 10, 1);
    ctx.fillStyle = "#3a7235"; ctx.fillRect(ax - 6, ay - 4, 1, 4); ctx.fillRect(ax + 5, ay - 4, 1, 4); // 綠花環
    ctx.fillStyle = "#4f8a4a"; ctx.fillRect(ax - 6, ay - 4, 1, 2); ctx.fillRect(ax + 5, ay - 4, 1, 2);
    ctx.fillStyle = "#c8b8a0"; ctx.fillRect(ax - 15, ay - 4, 1, 4); ctx.fillRect(ax + 14, ay - 4, 1, 4); // 奶油石小柱
    ctx.fillStyle = "#ddd6c8"; ctx.fillRect(ax - 16, ay - 6, 1, 1); ctx.fillRect(ax + 15, ay - 6, 1, 1);
    ctx.fillStyle = "#eee0b8"; ctx.fillRect(ax - 2, ay - 28, 5, 1);   // 冠面奶油高光
    ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax - 7, ay - 3, 3, 2);    // 木踏
    ctx.fillStyle = "#2a9a8a"; ctx.fillRect(ax - 4, ay - 20, 2, 2);   // 青玉
    ctx.fillStyle = "#7aa0d0"; ctx.fillRect(ax + 2, ay - 20, 2, 2);   // 淺藍玉
    ctx.fillStyle = "#2a4a7a"; ctx.fillRect(ax - 7, ay - 25, 2, 2);   // 深靛旗
    ctx.fillStyle = "#e8a040"; ctx.fillRect(ax - 6, ay - 22, 2, 1);   // 琥珀纓
    ctx.fillStyle = "#b85c3a"; ctx.fillRect(ax + 4, ay - 17, 2, 1);   // 陶土柱環
    ctx.fillStyle = "#8a9ab0"; ctx.fillRect(ax - 9, ay - 8, 2, 2);    // 藍灰石
    ctx.fillStyle = "#6ab8ff"; ctx.fillRect(ax + 6, ay - 21, 1, 1);   // 天青石
    ctx.fillStyle = "#8a5a2a"; ctx.fillRect(ax - 8, ay - 2, 2, 1);    // 銅踏
  }
  function mdStele(ax, ay) {       // 2 試煉秘境：雙碑＋碑冠＋符文×5＋側火把石墩（v9：主碑加寬＋副碑＋碑冠分面，對齊 v578）
    lmShadow(ax, ay - 2, 30);
    // 2 階基座（加寬）
    box(ax - 9, ay - 3, 18, 3, "#5a5a6a");           // 上基
    ctx.fillStyle = "#6a6a7a"; ctx.fillRect(ax - 8, ay - 2, 16, 1);
    ctx.fillStyle = "#4a4a58"; ctx.fillRect(ax - 9, ay - 1, 18, 1);
    box(ax - 12, ay - 6, 24, 3, "#4e4e5c");          // 下基
    ctx.fillStyle = "#5a5a6a"; ctx.fillRect(ax - 11, ay - 5, 22, 1);
    ctx.fillStyle = "#3e3e4a"; ctx.fillRect(ax - 12, ay - 3, 24, 1);   // 層間 AO
    // 副碑（右後側 8×14）
    box(ax + 5, ay - 20, 8, 16, "#6a6a7a");
    ctx.fillStyle = "#7a7a8a"; ctx.fillRect(ax + 6, ay - 19, 6, 1);
    ctx.fillStyle = "#5a5a6a"; ctx.fillRect(ax + 5, ay - 6, 8, 1);     // 底暗
    ctx.fillStyle = "#3a8ab8"; ctx.fillRect(ax + 7, ay - 15, 2, 2);    // 副碑符文
    ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax + 7, ay - 14, 1, 1);
    ctx.fillStyle = "#5a5a6a"; ctx.fillRect(ax + 4, ay - 22, 10, 2);   // 副碑冠
    ctx.fillStyle = "#6a6a7a"; ctx.fillRect(ax + 4, ay - 22, 10, 1);
    // 主碑（加寬至 14，分面受光）
    box(ax - 7, ay - 26, 14, 22, "#7a7a8a");
    ctx.fillStyle = "#8a8a9a"; ctx.fillRect(ax - 7, ay - 26, 2, 22);   // 左受光
    ctx.fillStyle = "#6a6a7a"; ctx.fillRect(ax + 5, ay - 26, 2, 22);   // 右陰影
    ctx.fillStyle = "#5e5e70"; ctx.fillRect(ax + 6, ay - 26, 1, 22);   // 右緣最深（側面感）
    ctx.fillStyle = "#8a8a9a"; ctx.fillRect(ax - 7, ay - 24, 1, 1); ctx.fillRect(ax - 7, ay - 16, 1, 1); ctx.fillRect(ax - 7, ay - 8, 1, 1); // 左緣節點
    ctx.fillStyle = "#6a6a78"; ctx.fillRect(ax + 2, ay - 24, 1, 18);   // 中面側棱（破單面）
    ctx.fillStyle = "#5c5c6a"; ctx.fillRect(ax - 7, ay - 7, 14, 1);    // 底漸暗
    ctx.fillStyle = "#5a5a6a"; ctx.fillRect(ax - 7, ay - 18, 14, 1);   // 分層線
    ctx.fillStyle = "#74747e"; ctx.fillRect(ax - 5, ay - 22, 1, 1); ctx.fillRect(ax + 2, ay - 12, 1, 1); ctx.fillRect(ax - 3, ay - 9, 1, 1); // 碑面雜訊
    // 碑面符文 ×5（雙色，帶高光）
    ctx.fillStyle = "#3a8ab8"; ctx.fillRect(ax - 5, ay - 23, 3, 2); ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 4, ay - 23, 1, 1);
    ctx.fillStyle = "#3a8ab8"; ctx.fillRect(ax + 1, ay - 22, 3, 2); ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax + 2, ay - 22, 1, 1);
    ctx.fillStyle = "#3a8ab8"; ctx.fillRect(ax - 5, ay - 17, 3, 2); ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 4, ay - 17, 1, 1);
    ctx.fillStyle = "#3a8ab8"; ctx.fillRect(ax + 1, ay - 16, 3, 2); ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax + 2, ay - 16, 1, 1);
    ctx.fillStyle = "#3a8ab8"; ctx.fillRect(ax - 5, ay - 11, 3, 2); ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 4, ay - 11, 1, 1);
    // 碑冠（三層階式：寬→中→窄，受光律動）
    box(ax - 8, ay - 29, 16, 3, "#5a5a6a");          // 冠一（寬）
    ctx.fillStyle = "#6a6a7a"; ctx.fillRect(ax - 8, ay - 29, 8, 1);    // 冠一左受光
    ctx.fillStyle = "#4a4a58"; ctx.fillRect(ax, ay - 29, 8, 1);        // 冠一右暗
    box(ax - 5, ay - 32, 10, 3, "#6a6a7a");          // 冠二（中）
    ctx.fillStyle = "#7a7a8a"; ctx.fillRect(ax - 5, ay - 32, 10, 1);   // 冠二受光
    ctx.fillStyle = "#4a4a58"; ctx.fillRect(ax - 5, ay - 31, 10, 1);   // 層間 AO
    ctx.fillStyle = "#7a7a8a"; ctx.fillRect(ax - 2, ay - 34, 4, 2);    // 冠三（窄頂）
    ctx.fillStyle = "#8a8a9a"; ctx.fillRect(ax - 2, ay - 34, 2, 1);    // 頂受光
    ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 1, ay - 36, 2, 2);    // 頂珠（升至冠頂）
    // 側火把（雙層火焰＋石墩座）
    for (const s of [-1, 1]) {
      ctx.fillStyle = "#4a4a58"; ctx.fillRect(ax + s * 11 - 2, ay - 4, 4, 3);  // 石墩
      ctx.fillStyle = "#5a5a6a"; ctx.fillRect(ax + s * 11 - 2, ay - 4, 4, 1);
      ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax + s * 11 - 1, ay - 14, 2, 10); // 柄
      ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax + s * 11 - 1, ay - 14, 1, 10);
      ctx.fillStyle = "#ff9a4d"; ctx.fillRect(ax + s * 11 - 2, ay - 17, 4, 4);  // 外焰
      ctx.fillStyle = "#ffd166"; ctx.fillRect(ax + s * 11 - 1, ay - 16, 2, 3);  // 內焰
      ctx.fillStyle = "#fff2c8"; ctx.fillRect(ax + s * 11, ay - 17, 1, 1);      // 焰芯
    }
    // v9 修色：紫晶冠飾＋血紅符文＋青金飾帶＋苔綠基座＋奶油石（拉近風車色階）
    ctx.fillStyle = "#7a4fcf"; ctx.fillRect(ax - 4, ay - 31, 3, 2);   // 冠上紫晶
    ctx.fillStyle = "#9a6ce8"; ctx.fillRect(ax - 4, ay - 31, 1, 1);
    ctx.fillStyle = "#c8402f"; ctx.fillRect(ax - 4, ay - 19, 2, 1);   // 血紅符文
    ctx.fillStyle = "#2fb8a0"; ctx.fillRect(ax + 2, ay - 19, 2, 1);   // 青金符文
    ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 12, ay - 6, 2, 1); ctx.fillRect(ax + 4, ay - 6, 2, 1); // 金飾塊
    ctx.fillStyle = "#476a35"; ctx.fillRect(ax - 12, ay - 1, 24, 1);  // 苔綠基座帶
    ctx.fillStyle = "#5c8a44"; ctx.fillRect(ax - 12, ay - 1, 12, 1);
    ctx.fillStyle = "#b8b0a0"; ctx.fillRect(ax - 12, ay - 6, 24, 1);  // 奶油石筋
    ctx.fillStyle = "#a8a0c0"; ctx.fillRect(ax + 6, ay - 19, 1, 1);   // 副碑淺紫高光
    ctx.fillStyle = "#ca9a30"; ctx.fillRect(ax - 8, ay - 30, 16, 1);  // 碑冠金線
    ctx.fillStyle = "#7a5a4a"; ctx.fillRect(ax - 3, ay - 2, 6, 1);    // 石墩踏面暖褐
    ctx.fillStyle = "#c8509a"; ctx.fillRect(ax - 4, ay - 27, 2, 2);   // 洋紅寶石
    ctx.fillStyle = "#2a6fe8"; ctx.fillRect(ax + 2, ay - 27, 2, 2);   // 藍寶石
    ctx.fillStyle = "#7ee787"; ctx.fillRect(ax - 4, ay - 23, 2, 2);   // 綠寶石
    ctx.fillStyle = "#ffb45a"; ctx.fillRect(ax + 2, ay - 23, 2, 2);   // 琥珀寶石
    ctx.fillStyle = "#9a6ce8"; ctx.fillRect(ax - 4, ay - 20, 2, 2);   // 紫寶石
    ctx.fillStyle = "#5ad0c0"; ctx.fillRect(ax + 2, ay - 20, 2, 2);   // 青玉
    ctx.fillStyle = "#e85c2a"; ctx.fillRect(ax - 3, ay - 10, 2, 1);   // 橙焰石
    ctx.fillStyle = "#8a5a2a"; ctx.fillRect(ax + 8, ay - 3, 3, 2);    // 銅環基
    ctx.fillStyle = "#6ab8ff"; ctx.fillRect(ax - 1, ay - 24, 2, 1);   // 天青符文
    ctx.fillStyle = "#b8e85c"; ctx.fillRect(ax + 5, ay - 22, 1, 1);   // 螢綠
    ctx.fillStyle = "#a86050"; ctx.fillRect(ax - 9, ay - 4, 2, 2);    // 陶土石墩
    ctx.fillStyle = "#e0d8c8"; ctx.fillRect(ax - 2, ay - 28, 4, 1);   // 碑冠奶白
    ctx.fillStyle = "#4a6eaa"; ctx.fillRect(ax + 6, ay - 25, 2, 1);   // 鋼藍帶
    ctx.fillStyle = "#c0a8e0"; ctx.fillRect(ax + 11, ay - 15, 2, 1);  // 副碑丁香
  }
  function mdBone(ax, ay) {        // 3 世界首領：石土台＋頭骨紀念碑＋交叉獸骨＋紅旗（v578：土台分層＋骨質明暗＋頭骨受光，對齊區域地標水準）
    lmShadow(ax, ay - 2, 38);
    box(ax - 15, ay - 7, 30, 7, "#5a5248");          // 石土台（分層）
    ctx.fillStyle = "#6a6256"; ctx.fillRect(ax - 15, ay - 7, 30, 1);
    ctx.fillStyle = "#4a4438"; ctx.fillRect(ax - 15, ay - 3, 30, 1);
    ctx.fillStyle = "#6a6256"; ctx.fillRect(ax - 4, ay - 1, 8, 1);       // 前台階
    ctx.fillStyle = "#4a4438"; ctx.fillRect(ax - 4, ay, 8, 1);
    ctx.fillStyle = "#d8d0c0";                       // 交叉獸骨（亮面）
    ctx.fillRect(ax - 11, ay - 17, 3, 15);
    ctx.fillRect(ax + 8, ay - 17, 3, 15);
    ctx.fillRect(ax - 13, ay - 12, 26, 3);
    ctx.fillStyle = "#c0b8a8";                       // 骨陰影面（右下）
    ctx.fillRect(ax - 11, ay - 14, 3, 2); ctx.fillRect(ax + 8, ay - 12, 3, 2);
    ctx.fillRect(ax - 11, ay - 7, 3, 2); ctx.fillRect(ax + 8, ay - 5, 3, 2);
    ctx.fillRect(ax - 11, ay - 4, 3, 2); ctx.fillRect(ax + 8, ay - 2, 3, 2);
    ctx.fillStyle = "#b0a898"; ctx.fillRect(ax - 11, ay - 3, 3, 1); ctx.fillRect(ax + 8, ay - 1, 3, 1);
    ctx.fillStyle = "#f4eee2"; ctx.fillRect(ax - 11, ay - 16, 1, 1); ctx.fillRect(ax + 8, ay - 15, 1, 1);  // 骨節光
    box(ax - 6, ay - 22, 12, 9, "#e8e0d0");          // 中央頭骨（左亮右暗，非平塗）
    ctx.fillStyle = "#f4eee2"; ctx.fillRect(ax - 6, ay - 22, 3, 9);
    ctx.fillStyle = "#c8c0b0"; ctx.fillRect(ax + 3, ay - 22, 3, 9);
    ctx.fillStyle = "#d8d0c0"; ctx.fillRect(ax - 6, ay - 19, 12, 1);    // 顱縫
    ctx.fillStyle = "#3a3038"; ctx.fillRect(ax - 4, ay - 19, 2, 2); ctx.fillRect(ax + 2, ay - 19, 2, 2);  // 眼窩（v578：去近黑 #1a1018，同系深階）
    ctx.fillStyle = "#2a2028"; ctx.fillRect(ax - 1, ay - 16, 2, 2);      // 鼻洞
    ctx.fillStyle = "#d8d0c0"; ctx.fillRect(ax - 4, ay - 14, 8, 1);      // 牙列
    ctx.fillStyle = "#c8c0b0"; ctx.fillRect(ax - 3, ay - 13, 1, 1); ctx.fillRect(ax + 1, ay - 13, 1, 1);
    ctx.fillStyle = "#5a4a3a"; ctx.fillRect(ax - 15, ay - 28, 2, 10);   // 紅旗
    ctx.fillStyle = "#c8402f"; ctx.fillRect(ax - 15, ay - 30, 6, 3);
    ctx.fillStyle = "#e85c5c"; ctx.fillRect(ax - 14, ay - 29, 3, 1);     // 旗受光
    ctx.fillStyle = "#b8b0a0";                       // 骨碎片（台前）
    ctx.fillRect(ax + 11, ay - 3, 2, 2); ctx.fillRect(ax + 14, ay - 2, 2, 1);
    ctx.fillStyle = "#8a8272"; ctx.fillRect(ax + 11, ay - 2, 2, 1);
  }
  function mdSpire(ax, ay) {       // 4 元素試煉塔：分層石塔＋四元素窗＋拱門＋金尖（tip 光芒為 fx）— v578：塔身/尖錐加高加寬＋窗條＋石階底座
    lmShadow(ax, ay - 2, 30);
    box(ax - 10, ay - 4, 20, 4, "#6a5a7a");          // 底台（2 階）
    ctx.fillStyle = "#7a6a8a"; ctx.fillRect(ax - 9, ay - 3, 18, 1);
    box(ax - 8, ay - 8, 16, 4, "#7a6a8a");           // 中台
    ctx.fillStyle = "#8a7a9a"; ctx.fillRect(ax - 7, ay - 7, 14, 1);
    box(ax - 8, ay - 30, 16, 22, "#8a7a9a");         // 塔身（加寬 12→16）
    ctx.fillStyle = "#9a8aaa"; ctx.fillRect(ax - 8, ay - 30, 2, 22);    // 左受光
    ctx.fillStyle = "#7a6a8a"; ctx.fillRect(ax + 6, ay - 30, 2, 22);    // 右陰影
    ctx.fillStyle = "#74647e"; ctx.fillRect(ax - 8, ay - 10, 16, 1);    // 底漸暗
    ctx.fillStyle = "#7a6a8a"; ctx.fillRect(ax - 8, ay - 25, 16, 1); ctx.fillRect(ax - 8, ay - 18, 16, 1);  // 分層線
    ctx.fillStyle = "#87779a"; ctx.fillRect(ax - 6, ay - 22, 1, 1); ctx.fillRect(ax + 3, ay - 28, 1, 1); ctx.fillRect(ax - 3, ay - 14, 1, 1); // 石面雜訊
    ctx.fillStyle = "#3a2a4a"; ctx.fillRect(ax - 5, ay - 28, 4, 4); ctx.fillRect(ax + 1, ay - 28, 4, 4);   // 窗框（上）
    ctx.fillStyle = "#3a2a4a"; ctx.fillRect(ax - 5, ay - 21, 4, 4); ctx.fillRect(ax + 1, ay - 21, 4, 4);   // 窗框（下）
    ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 4, ay - 27, 2, 3);      // 元素窗（藍/紅 上、綠/金 下）
    ctx.fillStyle = "#ff6a4a"; ctx.fillRect(ax + 2, ay - 27, 2, 3);
    ctx.fillStyle = "#7ee787"; ctx.fillRect(ax - 4, ay - 20, 2, 3);
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax + 2, ay - 20, 2, 3);
    ctx.fillStyle = "#9a8aaa"; ctx.fillRect(ax - 4, ay - 25, 6, 1);      // 窗過梁
    ctx.fillStyle = "#3a2a4a"; ctx.fillRect(ax - 3, ay - 8, 6, 8);       // 拱門
    ctx.fillStyle = "#2a1a3a"; ctx.fillRect(ax - 2, ay - 8, 4, 6);
    ctx.fillStyle = "#9a8aaa"; ctx.fillRect(ax - 3, ay - 8, 6, 1);       // 拱門受光
    tri(ax, ay - 32, 18, 14, "#c96a4a");             // 尖錐頂（加高加寬；apex 於 ay-46）
    ctx.fillStyle = "#e0704a"; ctx.fillRect(ax - 9, ay - 34, 4, 2);      // 錐底飾帶
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 2, ay - 48, 4, 5);      // 金尖（v562FIX：伸出 apex 之上）
    ctx.fillStyle = "#ffdf8a"; ctx.fillRect(ax - 1, ay - 50, 2, 3);      // 金尖高光
    const cols = ["#4fc3f7", "#ff6a4a", "#7ee787", "#ffd166"];          // 四色小旗（移往中台）
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = "#3a2a3a"; ctx.fillRect(ax - 7 + k * 4, ay - 11, 1, 3);
      ctx.fillStyle = cols[k]; ctx.fillRect(ax - 7 + k * 4 - (k >= 2 ? 0 : 1), ay - 12 - (k % 2), 2, 1);
    }
  }
  function mdHedge(ax, ay) {       // 5 奇境迷宮：石拱門＋籬牆迷宮＋金燈＋寶藏箱（v9：籬色提亮＋立體籬塊＋離近黑，對齊 v578）
    lmShadow(ax, ay - 2, 36);
    // 籬床淺綠底座邊（與枯草農地分離）
    ctx.fillStyle = "#5f8f5a"; ctx.fillRect(ax - 16, ay - 2, 32, 1);
    // 落地深綠斜影（與枯草農地分離，柔和不近黑）
    ctx.fillStyle = "rgba(24,44,22,0.42)"; ctx.fillRect(ax - 17, ay + 1, 34, 2);
    ctx.fillStyle = "rgba(24,44,22,0.25)"; ctx.fillRect(ax - 13, ay + 3, 26, 1);
    // 後籬牆（高、廣）＋層級迷宮內牆（曲折路徑感）
    box(ax - 15, ay - 12, 30, 9, "#335f2f");
    ctx.fillStyle = "#4a8a4a"; ctx.fillRect(ax - 15, ay - 12, 30, 2);   // 後籬頂受光
    ctx.fillStyle = "#243f24"; ctx.fillRect(ax - 15, ay - 4, 30, 1);    // 後籬底晴
    const LAYERS = [
      { x: -11, w: 4, h: 9 }, { x: -3, w: 4, h: 8 }, { x: 5, w: 4, h: 9 }, { x: 10, w: 3, h: 7 },
      { x: -7, w: 3, h: 5 }, { x: 2, w: 3, h: 6 }
    ];
    for (let i = 0; i < LAYERS.length; i++) {
      const L = LAYERS[i], base = ay - 2;
      ctx.fillStyle = "#3a6a35"; ctx.fillRect(ax + L.x, base - L.h, L.w, L.h);
      ctx.fillStyle = "#4a8a4a"; ctx.fillRect(ax + L.x, base - L.h, L.w, 1);   // 層頂受光
      ctx.fillStyle = "#2a5228"; ctx.fillRect(ax + L.x, base - 1, L.w, 1);     // 層底暗
      if (i % 2 === 0) { ctx.fillStyle = "#3f7440"; ctx.fillRect(ax + L.x, base - L.h + 3, L.w, 1); } // 葉層
    }
    ctx.fillStyle = "#4c7a44"; ctx.fillRect(ax - 13, ay - 9, 1, 1); ctx.fillRect(ax + 12, ay - 10, 1, 1); ctx.fillRect(ax - 1, ay - 8, 1, 1);  // 籬葉雜訊
    // 石拱門（雙石柱加高＋拱頂石＋落地斜影）— 提高豎向剪影
    for (const s of [-1, 1]) {
      ctx.fillStyle = "#8a8a9a"; ctx.fillRect(ax + s * 4, ay - 12, 3, 12); // 石柱
      ctx.fillStyle = "#9a9aaa"; ctx.fillRect(ax + s * 4, ay - 12, 1, 12); // 左受光
      ctx.fillStyle = "#7a7a8a"; ctx.fillRect(ax + s * 4 + 2, ay - 12, 1, 12); // 右暗
      ctx.fillStyle = "#5a5a6a"; ctx.fillRect(ax + s * 4, ay - 1, 3, 1);  // 柱底
    }
    ctx.fillStyle = "#9a9aaa"; ctx.fillRect(ax - 5, ay - 15, 10, 3);   // 拱頂石
    ctx.fillStyle = "#b8b8c8"; ctx.fillRect(ax - 5, ay - 15, 10, 1);   // 拱頂受光
    ctx.fillStyle = "#2a5228"; ctx.fillRect(ax - 2, ay - 12, 4, 1);    // 拱內暗
    ctx.fillStyle = "#8a7a6a"; ctx.fillRect(ax + 2, ay - 1, 4, 1);     // 拱門踏面
    ctx.fillStyle = "#1e3a1c"; ctx.fillRect(ax - 6, ay + 2, 12, 2);    // 拱門落地斜影
    // 金燈（掛於拱頂下，fx 呼吸疊加）
    ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax, ay - 7, 1, 1);         // 吊線
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 1, ay - 6, 3, 3);     // 金燈
    ctx.fillStyle = "#fff2c8"; ctx.fillRect(ax, ay - 5, 1, 1);         // 燈芯
    // 入口沙徑引導
    ctx.fillStyle = "#c8b078"; ctx.fillRect(ax - 3, ay - 2, 6, 1);
    ctx.fillStyle = "#b89e6a"; ctx.fillRect(ax - 2, ay - 1, 4, 1);
    // 籬內寶藏箱（金）
    ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax - 7, ay - 4, 4, 3);
    ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax - 7, ay - 4, 4, 1);
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 7, ay - 4, 4, 1);
    // 頂部綠球
    ctx.fillStyle = "#4a8a4a"; ctx.fillRect(ax - 1, ay - 12, 2, 2);
    ctx.fillStyle = "#5a9a5a"; ctx.fillRect(ax - 1, ay - 12, 1, 1);
    // v9 修色：金頂球＋紫藍寶石迷宮柱＋藍花飾＋莓果＋亮頂籬（拉近風車色階＋提立體感）
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 2, ay - 14, 3, 2);   // 拱頂金球
    ctx.fillStyle = "#ffe9a8"; ctx.fillRect(ax - 2, ay - 14, 1, 1);
    ctx.fillStyle = "#5fae50"; ctx.fillRect(ax - 14, ay - 9, 28, 1);  // 籬頂受光帶亮階
    for (const [bx, bw] of [[-9, 4], [5, 4]]) {                       // 迷宮柱寶石
      ctx.fillStyle = "#7a4fc0"; ctx.fillRect(ax + bx + bw - 2, ay - 10, 1, 1);
      ctx.fillStyle = "#c08ae8"; ctx.fillRect(ax + bx + bw - 2, ay - 10, 1, 1);
    }
    ctx.fillStyle = "#4f8ad0"; ctx.fillRect(ax - 12, ay - 5, 1, 1); ctx.fillRect(ax + 11, ay - 6, 1, 1); // 藍花
    ctx.fillStyle = "#c05a38"; ctx.fillRect(ax - 13, ay - 7, 1, 1); ctx.fillRect(ax + 8, ay - 8, 1, 1);  // 莓果
    ctx.fillStyle = "#e0d8c8"; ctx.fillRect(ax - 5, ay - 10, 1, 1); ctx.fillRect(ax + 4, ay - 10, 1, 1); // 拱石奶油高光
    ctx.fillStyle = "#476a35"; ctx.fillRect(ax - 14, ay - 2, 28, 1); // 籬底苔綠帶
    ctx.fillStyle = "#9a6ce8"; ctx.fillRect(ax, ay - 12, 1, 1);      // 紫葉
    ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax - 6, ay - 3, 1, 2); ctx.fillRect(ax + 5, ay - 3, 1, 2);  // 寶藏箱木紋暗
    ctx.fillStyle = "#7a4fc0"; ctx.fillRect(ax - 5, ay - 11, 1, 1);  // 靛寶石
    ctx.fillStyle = "#7ee787"; ctx.fillRect(ax + 6, ay - 10, 1, 1);  // 螢綠葉
    ctx.fillStyle = "#c8b8a0"; ctx.fillRect(ax - 4, ay - 10, 1, 1);  // 拱石奶油
    ctx.fillStyle = "#6ab8ff"; ctx.fillRect(ax - 3, ay - 6, 1, 1);   // 花藍心
    ctx.fillStyle = "#e8d84a"; ctx.fillRect(ax + 4, ay - 13, 1, 1);  // 頂金葉
    ctx.fillStyle = "#ff6a4a"; ctx.fillRect(ax - 1, ay - 15, 1, 1);  // 拱頂橙果
    ctx.fillStyle = "#ff9a4d"; ctx.fillRect(ax + 9, ay - 9, 1, 1);   // 橙果
    ctx.fillStyle = "#c0a8e0"; ctx.fillRect(ax - 8, ay - 10, 1, 1);  // 丁香
  }
  function mdHall(ax, ay) {        // 6 公會盛宴：茅頂宴棚＋掛燈＋長桌盛宴＋酒桶（v9：茅草排紋+石墩棚柱+桌布垂面，對齊 v578）
    lmShadow(ax, ay - 2, 40);
    ctx.fillStyle = "rgba(18,34,16,0.55)"; ctx.fillRect(ax - 18, ay + 2, 36, 2); // 宴棚落地斜影
    ctx.fillStyle = "rgba(18,34,16,0.35)"; ctx.fillRect(ax - 14, ay + 4, 28, 2);
    // 棚柱（加柱礎石墩）
    for (const s of [-1, 1]) {
      ctx.fillStyle = "#5a4a32"; ctx.fillRect(ax + s * 14 - 1, ay - 15, 4, 15); // 柱
      ctx.fillStyle = "#6a5a3f"; ctx.fillRect(ax + s * 14 - 1, ay - 15, 1, 15); // 左受光
      ctx.fillStyle = "#4a3a26"; ctx.fillRect(ax + s * 14 + 2, ay - 15, 1, 15); // 右暗
      ctx.fillStyle = "#3e3018"; ctx.fillRect(ax + s * 14 - 1, ay - 2, 4, 1);   // 柱底暗
      ctx.fillStyle = "#8a8272"; ctx.fillRect(ax + s * 14 - 2, ay - 17, 6, 2);  // 柱礎石墩
      ctx.fillStyle = "#9a9282"; ctx.fillRect(ax + s * 14 - 2, ay - 17, 6, 1);  // 石墩受光
    }
    // 橫梁
    box(ax - 18, ay - 18, 36, 3, "#5a3f24");
    ctx.fillStyle = "#7a5a35"; ctx.fillRect(ax - 18, ay - 18, 36, 1);
    ctx.fillStyle = "#4a3018"; ctx.fillRect(ax - 18, ay - 16, 36, 1);
    // 茅草頂（apex ay-38）＋橫向草束排紋
    tri(ax, ay - 26, 38, 12, "#7a8a4a");
    for (let i = 0; i < 5; i++) {
      const t = 0.08 + i * 0.19;                    // 0.08..0.84 沿三角高
      const yy = ay - 38 + Math.round(12 * t);
      const half = Math.max(2, Math.round(19 * Math.max(0.06, (1 - t))));
      ctx.fillStyle = (i % 2 ? "#8a9a58" : "#6c7c3e");
      ctx.fillRect(ax - half, yy, half * 2, 1);
    }
    ctx.fillStyle = "#94a85c"; ctx.fillRect(ax - 1, ay - 39, 2, 1);     // 頂受光
    // 棚頂旗柱（fx 旗疊加其頂）
    ctx.fillStyle = "#4a3520"; ctx.fillRect(ax - 1, ay - 41, 2, 5);
    ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax - 1, ay - 41, 1, 5);
    // 兩盞掛燈
    for (const s of [-1, 1]) {
      ctx.fillStyle = "#3a2a1a"; ctx.fillRect(ax + s * 9 - 1, ay - 15, 2, 3);
      ctx.fillStyle = "#c8402f"; ctx.fillRect(ax + s * 9 - 2, ay - 12, 4, 4);
      ctx.fillStyle = "#e88a4a"; ctx.fillRect(ax + s * 9 - 1, ay - 11, 2, 2);
    }
    // 長桌（桌布垂面＋佳餚多碟）
    ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax - 13, ay - 5, 26, 2);    // 桌面
    ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax - 13, ay - 5, 26, 1);
    ctx.fillStyle = "#e8e0c8"; ctx.fillRect(ax - 13, ay - 3, 26, 3);    // 桌布垂面
    ctx.fillStyle = "#f2f0dc"; ctx.fillRect(ax - 13, ay - 3, 26, 1);    // 布受光
    ctx.fillStyle = "#c8c0a8"; ctx.fillRect(ax - 13, ay - 1, 26, 1);    // 布底暗
    ctx.fillStyle = "#e8c060"; ctx.fillRect(ax - 11, ay - 4, 4, 1); ctx.fillStyle = "#c8a040"; ctx.fillRect(ax - 11, ay - 4, 4, 1);
    ctx.fillStyle = "#e0704a"; ctx.fillRect(ax - 6, ay - 4, 3, 1); ctx.fillStyle = "#c05040"; ctx.fillRect(ax - 6, ay - 4, 3, 1);
    ctx.fillStyle = "#7ee787"; ctx.fillRect(ax - 2, ay - 4, 3, 1); ctx.fillStyle = "#5ac06a"; ctx.fillRect(ax - 2, ay - 4, 3, 1);
    ctx.fillStyle = "#d8b45c"; ctx.fillRect(ax + 2, ay - 4, 4, 1); ctx.fillStyle = "#c09848"; ctx.fillRect(ax + 2, ay - 4, 4, 1);
    ctx.fillStyle = "#c89a5a"; ctx.fillRect(ax + 7, ay - 4, 3, 1); ctx.fillStyle = "#a87a42"; ctx.fillRect(ax + 7, ay - 4, 3, 1);
    ctx.fillStyle = "#c8402f"; ctx.fillRect(ax - 1, ay - 7, 2, 2);      // 中央烤盤
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 1, ay - 7, 1, 1);
    // 長凳
    ctx.fillStyle = "#4a3520"; ctx.fillRect(ax - 15, ay - 3, 4, 2); ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax - 15, ay - 3, 4, 1);
    ctx.fillStyle = "#4a3520"; ctx.fillRect(ax + 11, ay - 3, 4, 2); ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax + 11, ay - 3, 4, 1);
    // 兩側酒桶
    for (const s of [-1, 1]) {
      ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax + s * 18 - 2, ay - 4, 4, 4); // 桶
      ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax + s * 18 - 2, ay - 4, 4, 1);
      ctx.fillStyle = "#4a3520"; ctx.fillRect(ax + s * 18 - 2, ay - 1, 4, 1);
      ctx.fillStyle = "#4a3520"; ctx.fillRect(ax + s * 18, ay - 3, 1, 2);     // 箍環
      ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax + s * 18 - 1, ay - 2, 2, 1);  // 桶麵
    }
  }
  function mdNotice(ax, ay) {      // 7 限時活動：條紋棚＋公告板＋告示×4（撕角圖釘）＋金旗（v9：木紋+圖釘+棚頂受光+石墩柱，對齊 v578）
    lmShadow(ax, ay - 2, 32);
    // 支柱（加柱腳石墩＋落地影）
    for (const s of [-1, 1]) {
      ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax + s * 8 - 1, ay - 18, 3, 18); // 柱
      ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax + s * 8 - 1, ay - 18, 1, 18); // 左受光
      ctx.fillStyle = "#4a3520"; ctx.fillRect(ax + s * 8 + 1, ay - 18, 1, 18); // 右暗
      ctx.fillStyle = "#8a8272"; ctx.fillRect(ax + s * 8 - 2, ay - 18, 5, 2);  // 柱頭石墩
      ctx.fillStyle = "#9a9282"; ctx.fillRect(ax + s * 8 - 2, ay - 3, 5, 2);   // 柱腳石墩（接地）
      ctx.fillStyle = "#6a6256"; ctx.fillRect(ax + s * 8 - 2, ay - 2, 5, 1);
    }
    ctx.fillStyle = "rgba(18,34,16,0.5)"; ctx.fillRect(ax - 13, ay + 2, 26, 2); // 看板落地斜影
    // 木框看板（木紋＋框緣）
    ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax - 12, ay - 20, 24, 17);  // 板框
    ctx.fillStyle = "#8a6a3a"; ctx.fillRect(ax - 12, ay - 20, 24, 1);   // 框上受光
    ctx.fillStyle = "#5a3a20"; ctx.fillRect(ax - 12, ay - 5, 24, 1);    // 框下暗
    ctx.fillStyle = "#c8a878"; ctx.fillRect(ax - 10, ay - 18, 20, 14);  // 軟木面
    ctx.fillStyle = "#b89868"; ctx.fillRect(ax - 10, ay - 15, 20, 1); ctx.fillRect(ax - 10, ay - 9, 20, 1); // 木紋
    // 告示 ×4（雙色＋撕角亮＋金圖釘）
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 8, ay - 17, 5, 5);      // 金告示
    ctx.fillStyle = "#e8b050"; ctx.fillRect(ax - 7, ay - 16, 3, 1);      // 撕角亮
    ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 2, ay - 16, 5, 4);      // 藍告示
    ctx.fillStyle = "#2f9fd0"; ctx.fillRect(ax - 1, ay - 15, 3, 1);
    ctx.fillStyle = "#e85c5c"; ctx.fillRect(ax - 8, ay - 10, 5, 4);      // 紅告示
    ctx.fillStyle = "#b83f3f"; ctx.fillRect(ax - 7, ay - 9, 3, 1);
    ctx.fillStyle = "#7ee787"; ctx.fillRect(ax - 2, ay - 10, 4, 3);      // 綠告示
    ctx.fillStyle = "#5ac06a"; ctx.fillRect(ax - 1, ay - 9, 2, 1);
    for (const [gx, gy] of [[-6, -17], [0, -16], [-6, -10], [0, -10]]) { // 金圖釘
      ctx.fillStyle = "#ffd166"; ctx.fillRect(ax + gx, ay + gy, 1, 1);
      ctx.fillStyle = "#fff2c8"; ctx.fillRect(ax + gx, ay + gy, 1, 1);
    }
    ctx.fillStyle = "#f2f2ff"; ctx.fillRect(ax - 8, ay - 13, 1, 1); ctx.fillRect(ax + 3, ay - 10, 1, 1); // 撕角翹起
    // 條紋遮陽棚（頂受光＋棚下陰影帶）
    ctx.fillStyle = "#c8402f"; ctx.fillRect(ax - 16, ay - 25, 32, 3);   // 棚
    ctx.fillStyle = "#f2f2ff"; ctx.fillRect(ax - 16, ay - 25, 6, 3); ctx.fillRect(ax - 3, ay - 25, 6, 3); ctx.fillRect(ax + 9, ay - 25, 6, 3); // 白紋
    ctx.fillStyle = "#e84535"; ctx.fillRect(ax - 16, ay - 25, 32, 1);   // 棚頂受光
    ctx.fillStyle = "#8a2a20"; ctx.fillRect(ax - 16, ay - 23, 32, 1);   // 棚下陰影
    // 頂飾金旗
    ctx.fillStyle = "#4a3520"; ctx.fillRect(ax - 1, ay - 28, 2, 3);     // 旗柱
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 1, ay - 30, 4, 3);     // 金旗
    ctx.fillStyle = "#fff2c8"; ctx.fillRect(ax - 1, ay - 30, 2, 1);     // 旗受光
    // 棚緣三角旗串
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 15, ay - 23, 2, 2);
    ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 7, ay - 24, 2, 2);
    ctx.fillStyle = "#e85c5c"; ctx.fillRect(ax + 4, ay - 23, 2, 2);
    ctx.fillStyle = "#7ee787"; ctx.fillRect(ax + 12, ay - 24, 2, 2);
    // v9 修色：紫/橘海報＋金棚邊＋綠花環＋奶油看板緣（拉近風車色階）
    ctx.fillStyle = "#a05fd0"; ctx.fillRect(ax + 2, ay - 13, 4, 3);    // 紫海報
    ctx.fillStyle = "#c08ae8"; ctx.fillRect(ax + 3, ay - 12, 2, 1);
    ctx.fillStyle = "#e8914a"; ctx.fillRect(ax - 8, ay - 14, 3, 2);    // 橘海報
    ctx.fillStyle = "#ffb45a"; ctx.fillRect(ax - 7, ay - 14, 1, 1);
    ctx.fillStyle = "#e8c84a"; ctx.fillRect(ax - 16, ay - 24, 32, 1);  // 棚緣金線
    ctx.fillStyle = "#3a7235"; ctx.fillRect(ax - 9, ay - 21, 1, 3); ctx.fillRect(ax + 8, ay - 21, 1, 3); // 綠花環
    ctx.fillStyle = "#4f8a4a"; ctx.fillRect(ax - 8, ay - 21, 1, 1); ctx.fillRect(ax + 9, ay - 21, 1, 1);
    ctx.fillStyle = "#f2ecdc"; ctx.fillRect(ax - 11, ay - 18, 1, 14); ctx.fillRect(ax + 10, ay - 18, 1, 14); // 看板奶油緣
    ctx.fillStyle = "#a02818"; ctx.fillRect(ax + 1, ay - 24, 2, 3);    // 棚端暗紅
    ctx.fillStyle = "#2a6fe8"; ctx.fillRect(ax + 4, ay - 10, 1, 1);    // 藍圖釘
    ctx.fillStyle = "#8a5a2a"; ctx.fillRect(ax - 12, ay - 19, 1, 1);   // 銅框點
    ctx.fillStyle = "#e0a040"; ctx.fillRect(ax + 8, ay - 22, 1, 1);    // 琥珀旗
    ctx.fillStyle = "#6a8ab0"; ctx.fillRect(ax - 2, ay - 21, 2, 1);    // 藍灰棚帶
    ctx.fillStyle = "#ff6a4a"; ctx.fillRect(ax - 15, ay - 26, 1, 1);   // 橙角旗
    ctx.fillStyle = "#4a7a3a"; ctx.fillRect(ax + 12, ay - 20, 1, 1);   // 深綠環
  }
  function mdStairs(ax, ay) {      // 8 無盡深淵：裂口石壁＋下沉階梯＋兩側石燈（紫焰 fx 上浮）— v578：壁加高 3 色受光＋階梯立旁面＋石燈石座
    lmShadow(ax, ay - 2, 38);
    ctx.fillStyle = "#2a2a38";                       // 裂口石壁（加高）
    ctx.fillRect(ax - 15, ay - 14, 6, 16); ctx.fillRect(ax + 9, ay - 14, 6, 16);
    ctx.fillStyle = "#3a3a4c"; ctx.fillRect(ax - 15, ay - 14, 2, 16); ctx.fillRect(ax + 9, ay - 14, 2, 16);  // 壁緣受光
    ctx.fillStyle = "#22222e"; ctx.fillRect(ax - 12, ay - 6, 1, 4); ctx.fillRect(ax + 12, ay - 10, 1, 5);    // 岩裂縫
    ctx.fillStyle = "#3a3a4a"; ctx.fillRect(ax - 15, ay - 14, 6, 2); ctx.fillRect(ax + 9, ay - 14, 6, 2);    // 壁頂平台
    box(ax - 12, ay - 2, 24, 3, "#5a5a6a");          // 下沉階梯（往內漸暗；台面高光＋立面）
    ctx.fillStyle = "#6a6a7a"; ctx.fillRect(ax - 11, ay - 2, 22, 1);
    ctx.fillStyle = "#4a4a58"; ctx.fillRect(ax - 12, ay - 1, 24, 1);
    box(ax - 10, ay - 5, 20, 3, "#4a4a58");
    ctx.fillStyle = "#5a5a6a"; ctx.fillRect(ax - 9, ay - 5, 18, 1);
    ctx.fillStyle = "#3a3a48"; ctx.fillRect(ax - 10, ay - 4, 20, 1);
    box(ax - 8, ay - 8, 16, 3, "#3a3a48");
    ctx.fillStyle = "#4a4a58"; ctx.fillRect(ax - 7, ay - 8, 14, 1);
    ctx.fillStyle = "#2a2a38"; ctx.fillRect(ax - 8, ay - 7, 16, 1);
    box(ax - 6, ay - 11, 12, 3, "#2a2a38");
    ctx.fillStyle = "#3a3a48"; ctx.fillRect(ax - 5, ay - 11, 10, 1);
    ctx.fillStyle = "#1e1e2a"; ctx.fillRect(ax - 6, ay - 10, 12, 1);
    ctx.fillStyle = "#0a0a14"; ctx.fillRect(ax - 3, ay - 10, 6, 10);       // 深淵裂縫
    ctx.fillStyle = "#05050c"; ctx.fillRect(ax - 1, ay - 5, 2, 5);         // 裂縫深處
    ctx.fillStyle = "rgba(167,139,250,0.28)"; ctx.fillRect(ax - 3, ay - 11, 6, 1);  // 紫滲光邊
    for (const s of [-1, 1]) {                       // 石燈柱＋石座（加高加寬）
      ctx.fillStyle = "#4a4a58"; ctx.fillRect(ax + s * 14, ay - 3, 6, 3);   // 石座（顯色：box 細件被微光遮蔽，改直繪）
      ctx.fillStyle = "#5a5a6a"; ctx.fillRect(ax + s * 14, ay - 3, 6, 1);
      ctx.fillStyle = "#3a3a48"; ctx.fillRect(ax + s * 14, ay - 1, 6, 1);
      ctx.fillStyle = "#3f3f52"; ctx.fillRect(ax + s * 14, ay + 1, 6, 1);
      box(ax + s * 14, ay - 16, 5, 12, "#3a3a48");   // 燈柱
      ctx.fillStyle = "#4a4a58"; ctx.fillRect(ax + s * 14, ay - 16, 1, 12);  // 柱受光
      ctx.fillStyle = "#a78bfa"; ctx.fillRect(ax + s * 14 + 1, ay - 19, 2, 4);  // 紫焰
      ctx.fillStyle = "#e8e0ff"; ctx.fillRect(ax + s * 14 + 1, ay - 18, 1, 1);
    }
  }
  function mdCamp(ax, ay) {        // 9 委託遠征營：帳篷營地＋中央營火（fx 跳動）＋補給箱＋營旗 — v578：帳篷布面明暗＋帳口＋營火石圈＋補給箱分面
    lmShadow(ax, ay - 2, 40);
    ctx.fillStyle = "#5a4a32"; ctx.fillRect(ax - 17, ay - 2, 34, 3);     // 營地地面（加寬）
    ctx.fillStyle = "#6a5a3f"; ctx.fillRect(ax - 17, ay - 2, 34, 1);
    ctx.fillStyle = "#4a3a26"; ctx.fillRect(ax - 17, ay + 1, 34, 1);
    ctx.fillStyle = "#6a5a3f"; ctx.fillRect(ax - 9, ay - 1, 1, 1); ctx.fillRect(ax + 6, ay - 1, 1, 1);       // 地面雜訊
    // 藍帳（左）：全三角＋左亮右暗＋帳口
    ctx.fillStyle = "#5a7a9a";
    ctx.beginPath(); ctx.moveTo(ax - 16, ay - 2); ctx.lineTo(ax - 8, ay - 17); ctx.lineTo(ax, ay - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#6a8aaa";
    ctx.beginPath(); ctx.moveTo(ax - 16, ay - 2); ctx.lineTo(ax - 8, ay - 17); ctx.lineTo(ax - 8, ay - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#4a5a7a";
    ctx.beginPath(); ctx.moveTo(ax - 8, ay - 2); ctx.lineTo(ax - 8, ay - 17); ctx.lineTo(ax, ay - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#2a3a4a"; ctx.fillRect(ax - 13, ay - 5, 3, 5);       // 帳口
    // 青帳（右）
    ctx.fillStyle = "#4a6a8a";
    ctx.beginPath(); ctx.moveTo(ax, ay - 2); ctx.lineTo(ax + 8, ay - 17); ctx.lineTo(ax + 16, ay - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#5a7a9a";
    ctx.beginPath(); ctx.moveTo(ax, ay - 2); ctx.lineTo(ax + 8, ay - 17); ctx.lineTo(ax + 8, ay - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#3a4a5a";
    ctx.beginPath(); ctx.moveTo(ax + 8, ay - 2); ctx.lineTo(ax + 8, ay - 17); ctx.lineTo(ax + 16, ay - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#2a3a4a"; ctx.fillRect(ax + 10, ay - 5, 3, 5);
    ctx.fillStyle = "#8a7a6a"; ctx.fillRect(ax - 4, ay - 1, 8, 2);        // 營火石圈
    ctx.fillStyle = "#7a6a5a"; ctx.fillRect(ax - 4, ay - 2, 8, 1);
    ctx.fillStyle = "#3a2a1a"; ctx.fillRect(ax - 2, ay - 8, 4, 6);        // 木柴
    ctx.fillStyle = "#ff9a4d"; ctx.fillRect(ax - 3, ay - 11, 6, 3);       // 火（fx 跳動疊加）
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 2, ay - 10, 4, 2);
    ctx.fillStyle = "#ff6a2a"; ctx.fillRect(ax - 1, ay - 12, 2, 2);
    box(ax - 14, ay - 5, 6, 5, "#8a6a3a");           // 補給箱（分面）
    ctx.fillStyle = "#9a7a4a"; ctx.fillRect(ax - 14, ay - 5, 6, 1);
    ctx.fillStyle = "#7a5a2a"; ctx.fillRect(ax - 14, ay - 2, 6, 1);
    ctx.fillStyle = "#c8402f"; ctx.fillRect(ax - 13, ay - 4, 3, 1);
    ctx.fillStyle = "#3a2a1a"; ctx.fillRect(ax + 15, ay - 19, 2, 13);     // 營旗
    ctx.fillStyle = "#c8402f"; ctx.fillRect(ax + 15, ay - 21, 6, 3);
    ctx.fillStyle = "#e85c5c"; ctx.fillRect(ax + 15, ay - 21, 3, 1);      // 旗受光
  }
  const MODE_LM = [mdRing, mdPodium, mdStele, mdBone, mdSpire, mdHedge, mdHall, mdNotice, mdStairs, mdCamp];
  /* v562：各模式地標藝術包覆盒（鎖定遮罩尺寸＋徽章點錨）— 對齊新地標高度 */
  const LM_ART = [
    { w: 40, h: 32 },   // arena（v9 2 階基台+加高鬥牆+四角柱+旗）
    { w: 34, h: 32 },   // royal（v9 三層分面石台+勝利柱+拱梁紋章）
    { w: 30, h: 38 },   // dungeon（v9 雙碑+三層碑冠+頂珠 -36）
    { w: 32, h: 34 },   // worldboss（v578 高 34）
    { w: 26, h: 50 },   // tower（v578 尖錐/塔身加高加寬）
    { w: 30, h: 16 },   // maze（v9 籬牆加高+拱頂金球 -14）
    { w: 40, h: 44 },   // guild（v9 茅頂 apex-38+棚頂旗柱-41）
    { w: 32, h: 32 },   // events（v9 看板+棚+頂飾金旗）
    { w: 34, h: 24 },   // abyss（v578 壁/燈加高）
    { w: 38, h: 24 }    // exped（v578 帳篷加高）
  ];

  function drawModeLandmarks(bctx) {
    const saved = ctx; ctx = bctx;
    for (let i = 0; i < MODES.length; i++) {
      const m = MODES[i];
      const ax = isoX(m.c, m.r), ay = isoY(m.c, m.r);
      MODE_LM[i](ax, ay);
    }
    ctx = saved;
  }

  /* 地標動態層（風車葉片/旗幟/火焰/泡泡/浮球/燈塔…）；reducedMotion 時 t=0 定幀 */
  const LM_FX = [
    (t, ax, ay, tier) => {   // 0 風車葉片旋轉＋旗飄
      const a = t / 2600, R = 13;
      ctx.strokeStyle = "#4a3a2a"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(ax - Math.cos(a) * R, ay - 26 - Math.sin(a) * R); ctx.lineTo(ax + Math.cos(a) * R, ay - 26 + Math.sin(a) * R); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax + Math.sin(a) * R, ay - 26 - Math.cos(a) * R); ctx.lineTo(ax - Math.sin(a) * R, ay - 26 + Math.cos(a) * R); ctx.stroke();
      ctx.lineCap = "butt";
      const dx = Math.sin(t / 300) * 1.5;
      ctx.fillStyle = tier ? "#ffd166" : "#8a8a9a"; ctx.fillRect(ax + 1 + dx, ay - 40, 6, 4);
      ctx.strokeStyle = "#3a3a44"; ctx.lineWidth = 1; ctx.strokeRect(ax + 1 + dx, ay - 40, 6, 4);
    },
    (t, ax, ay) => {   // 1 煙囪炊煙
      for (let i = 0; i < 2; i++) {
        const ph = (t / 900 + i / 2) % 1;
        ctx.fillStyle = "rgba(200,200,210," + (0.45 * (1 - ph)) + ")";
        ctx.fillRect(ax + 8 + Math.sin(ph * 6.28 + i) * 2 - 1, ay - 24 - ph * 12, 3, 3);
      }
    },
    (t, ax, ay) => {   // 2 火把
      const h = 4 + Math.sin(t / 90) * 1.5;
      ctx.fillStyle = "#ff9a4d"; ctx.fillRect(ax + 8, ay - 16 - h, 4, h + 1);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(ax + 9, ay - 15 - h, 2, h);
    },
    (t, ax, ay) => {   // 3 火盆烈焰＋熔岩脈動
      const h = 6 + Math.sin(t / 120) * 2;
      ctx.fillStyle = "#ff6a2a"; ctx.fillRect(ax - 3, ay - 21 - h, 6, h + 1);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 2, ay - 20 - h, 4, h);
      const a = 0.5 + 0.5 * Math.sin(t / 300);
      ctx.fillStyle = "rgba(255,106,42," + (0.3 + 0.5 * a) + ")";
      ctx.fillRect(ax - 9, ay - 1, 18, 1);
    },
    (t, ax, ay) => {   // 4 冰晶閃爍
      const on = (Math.sin(t / 260 + 1.7) + 1) / 2;
      if (on > 0.6) { ctx.fillStyle = "rgba(255,255,255," + (on - 0.5) + ")"; ctx.fillRect(ax - 5, ay - 22, 2, 2); }
      if (Math.sin(t / 400) > 0.4) { ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(ax + 6, ay - 12, 2, 2); }
      ctx.fillStyle = "rgba(190,230,255,0.5)"; ctx.fillRect(ax - 1, ay - 4, 2, 2);
    },
    (t, ax, ay) => {   // 5 綠洲水光
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(ax - 8 + ((t / 500) % 16), ay - 2, 5, 1);
    },
    (t, ax, ay) => {   // 6 藥鍋泡泡＋窗光
      const ph = (t / 700) % 1;
      ctx.fillStyle = "rgba(154,255,138," + (0.7 * (1 - ph)) + ")";
      ctx.fillRect(ax - 2 + Math.sin(ph * 6.28) * 2, ay - 12 - ph * 8, 2, 2);
      const w = 0.5 + 0.5 * Math.sin(t / 200);
      ctx.fillStyle = "rgba(154,255,138," + (0.4 + 0.5 * w) + ")";
      ctx.fillRect(ax + 3, ay - 12, 5, 5);
    },
    (t, ax, ay, tier) => {   // 7 旗飄＋燈塔光（tier 信標）
      const dx = Math.sin(t / 300) * 1.5;
      ctx.fillStyle = tier ? "#ffd166" : "#c8402f"; ctx.fillRect(ax + 1 + dx, ay - 42, 6, 4);
      ctx.strokeStyle = "#3a3a44"; ctx.lineWidth = 1; ctx.strokeRect(ax + 1 + dx, ay - 42, 6, 4);
      if (tier) {
        const a = 0.5 + 0.5 * Math.sin(t / 350);
        ctx.fillStyle = "rgba(255,209,102," + (0.25 + 0.4 * a) + ")";
        ctx.fillRect(ax - 6, ay - 48, 12, 6);
        ctx.fillRect(ax - 1, ay - 48, 2, 8);
      }
    },
    (t, ax, ay) => {   // 8 燈籠搖曳
      const dx = Math.sin(t / 500) * 1.5, lx = ax + 9 + dx;
      ctx.fillStyle = "#6a4a2a"; ctx.fillRect(lx - 1, ay - 20, 2, 6);
      ctx.fillStyle = "#8a6a2a"; ctx.fillRect(lx - 2, ay - 20, 4, 4);
      ctx.strokeStyle = "#3a3a44"; ctx.lineWidth = 1; ctx.strokeRect(lx - 2, ay - 20, 4, 4);
      const a = 0.5 + 0.5 * Math.sin(t / 300);
      ctx.fillStyle = "rgba(255,200,110," + (0.2 + 0.35 * a) + ")";
      ctx.fillRect(lx - 4, ay - 22, 8, 7);
    },
    (t, ax, ay, tier) => {   // 9 浮球脈動（tier 金球）
      const a = 0.5 + 0.5 * Math.sin(t / 420), r = 1 + a;
      ctx.fillStyle = tier ? "#ffd166" : "#e8e8ff"; ctx.fillRect(ax - 1 - r, ay - 14 - r, 3 + r * 2, 3 + r * 2);
      ctx.fillStyle = "rgba(255,255,255," + (0.35 + 0.5 * a) + ")";
      ctx.fillRect(ax - 2 - r * 2, ay - 15 - r * 2, 7 + r * 4, 7 + r * 4);
    }
  ];

  function drawLmFx(t, sx, sy) {
    const st = S();
    const maxReached = st.stats.maxRegionReached || 0;
    for (let i = 0; i < CENTERS.length; i++) {
      if (i > maxReached) continue;
      const b = CENTERS[i];
      const ax = isoX(b.c, b.r), ay = isoY(b.c, b.r);
      if (ax < offX - 60 || ax > offX + VW + 60 || ay < offY - 60 || ay > offY + VH + 60) continue;
      // v567：fx 維持「擊敗守關 BOSS」tier（金旗語義不動）；進度階僅屬地標本體（pt 於 buildBase 烘焙）
      LM_FX[i](t, sx(ax), sy(ay), i < maxReached ? 1 : 0);
    }
  }

  /* ---------- 區域野生怪物（TheoTown 生態感：已解鎖區的在地魔物在地標旁遊蕩） ---------- */
  const WILDLIFE = [
    ["m_slime", "m_wolf"],        // 0 grass 翠綠草原
    ["m_wisp", "m_spider"],       // 1 forest 幽暗森林
    ["m_rat", "m_trogg"],         // 2 cave 灰燼洞穴
    ["m_lizard", "m_magma"],      // 3 volcano 烈焰火山
    ["m_icewolf", "m_snowman"],   // 4 glacier 冰封高原
    ["m_scorpion", "m_mummy"],    // 5 desert 黃沙荒漠
    ["m_frog", "m_willowisp"],    // 6 swamp 詛咒沼澤
    ["m_gargoyle", "m_windgolem"],// 7 tower 蒼穹之塔
    ["m_imp", "m_hellhound"],     // 8 abyss 深淵裂谷
    ["m_angel", "m_starbeast"]    // 9 mythos 神話之域
  ];

  let wildlifeHits = [];   // v295：野生怪物點擊熱點（每幀更新 {px, py, i, j}）
  let wildCooldown = new Map();   // v295：彩蛋冷卻 "i:j" → 下次可點時間

  /* 每個地標旁 2 隻在地魔物沿小橢圓遊蕩（翻轉看行進方向、走路動畫）；
     reducedMotion 時 t=0 定幀（與地標動態一致） */
  function drawWildlife(t, sx, sy) {
    const st = S();
    const rm = !!(st.settings && st.settings.reducedMotion);
    const maxReached = st.stats.maxRegionReached || 0;
    wildlifeHits = [];
    for (let i = 0; i < CENTERS.length; i++) {
      if (i > maxReached) continue;                     // 迷霧內不露餡
      const b = CENTERS[i];
      const ax = isoX(b.c, b.r), ay = isoY(b.c, b.r);
      if (ax < offX - 90 || ax > offX + VW + 90 || ay < offY - 90 || ay > offY + VH + 90) continue;
      const wl = WILDLIFE[i] || [];
      for (let j = 0; j < wl.length; j++) {
        const spr = MG.data.sprites.get(wl[j]);
        if (!spr) continue;
        const off = j * 2.7 + i * 1.3;
        const rx = 24 + (i % 3) * 5, ry = 14 + (j % 2) * 3;
        const a = t / 2600 + off;
        const x = ax + Math.sin(a) * rx + (j ? 9 : -9);
        const y = ay + 7 + Math.cos(a * 0.9 + off * 1.7) * ry;
        const px = sx(x), py = sy(y);
        if (px < -20 || px > VW + 20 || py < -20 || py > VH + 20) continue;
        ctx.fillStyle = "rgba(0,0,0,0.3)";               // 落地陰影
        ctx.fillRect(px - 3, py + 2, 6, 2);
        const fr = rm ? 0 : (Math.floor(t / (spr.rate || 400)) % (spr.frames ? spr.frames.length : 2));
        MG.ui.render.draw(ctx, wl[j], px - 8, py - 14, 1, { scale: 1, frame: fr, flip: Math.cos(a) < 0 });
        wildlifeHits.push({ px, py, i, j });   // v295：供點擊判定（僅視口內）
      }
    }
  }

  /* ---------- 名牌 DOM ---------- */
  function rebuildLabels() {
    const st = S();
    const rs = REGIONS();
    labels = [];
    hitZones = [];
    // v283：地標本體隱形 44×44 觸控熱區（名牌太窄 <44px — 觸控下限；hover 顯示細框提示）
    const mkHit = (x, y, fn, tip) => {
      const el = MG.ui.dom.h("div", { class: "map-hit", style: {
        position: "absolute", left: "0px", top: "0px", width: 44, height: 44,
        transform: "translate(-50%,-50%)", zIndex: 2, cursor: "pointer"
      }, title: tip || "", on: { click: () => { if (suppressClick) { suppressClick = false; return; } fn(); } } });
      hitZones.push({ el, x, y });
      return el;
    };
    const mk = (txt, x, y, region, village, locked, mode, below, tip) => {
      const el = MG.ui.dom.h("div", { class: "map-label" + (locked ? " locked" : ""), title: tip || "", style: {
        position: "absolute", transform: below ? "translate(-50%,0)" : "translate(-50%,-100%)", textAlign: "center",
        left: "0px", top: "0px", pointerEvents: "auto", cursor: locked ? "default" : "pointer",
        background: locked ? "rgba(10,12,26,.8)" : "rgba(20,22,36,.9)",
        border: "2px solid " + (locked ? "#3a3f66" : "#000"),
        outline: locked ? "none" : "1px solid #3a3f66",
        padding: "3px 8px", fontSize: 12, fontWeight: 900, whiteSpace: "nowrap",
        color: locked ? "#6b7199" : (region === st.hunt.region && !village ? "#ffd166" : "#e8eaf6"),
        boxShadow: "0 3px 0 rgba(0,0,0,.45)", zIndex: 3
      }, on: { click: () => {
        if (suppressClick) { suppressClick = false; return; }  // v283FIX：拖曳後不觸發點擊（原 drag.moved 檢查在 up 後失效）
        if (mode !== undefined) { clickMode(mode); return; }  // v278：模式地標（鎖定也可點 — 看門檻 toast）
        if (locked) return;
        if (village) { MG.ui.screens.show("kingdom"); return; }
        clickRegion(region);
      } } }, txt);
      labels.push({ el, x, y, region: locked ? -1 : region, village, locked, mode, below });
      return el;
    };
    // 村莊名牌（北牆外上方）＋本體熱區（城中心）；v341：hover 提示
    mk("梅根王國 Lv" + st.kingdom.level, isoX(8.5, 20.5), isoY(8.5, 13), -1, true, false, undefined, false, "返回王國 — 升級建築/招募英雄/查看資源");
    mkHit(isoX(8.5, 20.5), isoY(8.5, 20.5), () => MG.ui.screens.show("kingdom"), "返回王國 — 升級建築/招募英雄/查看資源");
    // 區名牌（v279FIX：v274 有 11 區（含 abyss_deep 無盡深淵 — 屬模式地標非地圖區），僅列 CENTERS 的 10 區）
    for (let i = 0; i < CENTERS.length; i++) {
      const b = CENTERS[i];
      const cx = isoX(b.c, b.r);
      const cy = isoY(b.c, b.r);
      const locked = i > (st.stats.maxRegionReached || 0);
      const prog = (st.stats.maxStageByRegion && st.stats.maxStageByRegion[i]) || 0;
      // v280：進度省略「/10」（每區固定 10 關）→ 名牌窄 22px，解開草原帶相鄰區名牌重疊（幽暗森林↔灰燼洞穴）
      // v308：hover 提示（桌機）— 區域名＋進度＋守關 BOSS 名
      const boss = rs[i] && rs[i].boss ? rs[i].boss.name : "";
      // v381：區域名牌附每日寶箱提示（寶箱所在區未開時標註）
      const ci = chestInfo();
      const chestTag = (!ci.opened && ci.region === i) ? " ・ 🎁 今日寶箱在此！" : "";
      mk(locked ? "？？？" : (rs[i].name + " " + prog), cx, cy - 52, i, false, locked, undefined, false, locked ? null : ("前往「" + rs[i].name + "」討伐" + (boss ? " · BOSS「" + boss + "」" : "") + "（進度 " + prog + "/10）" + chestTag + " ・地標旁野生魔物可點擊收服賞金（60 秒冷卻）"));
      // v283：區域地標本體熱區（點地標圖示＝前往討伐；鎖定區也給回饋 toast）
      mkHit(cx, cy, () => clickRegion(i), locked ? ("「？？？」— 完成前一區域最後一關解鎖") : ("前往「" + rs[i].name + "」討伐（進度 " + prog + "/10）" + (boss ? " · BOSS「" + boss + "」" : "")));
    }
    // 模式地標名牌（v278：名稱在地標下方；偶數在上方交錯避重疊；鎖定門檻顯示 🔒）
    for (let i = 0; i < MODES.length; i++) {
      const m = MODES[i];
      const mx = isoX(m.c, m.r), my = isoY(m.c, m.r);
      const locked = m.gate ? !m.gate() : false;
      // v286：狀態 pin — 世界首領剩餘戰數／限時活動剩餘天數（重訪動機一眼可見）
      // v340：hover 提示 — 模式入口用途
      const mTip = { arena: "挑戰天梯爬排名，週結算領鑽石", royal: "三隊制週迴圈，積分換王者幣（王國 Lv12）", dungeon: "每日 3 次高額金幣/經驗秘境", worldboss: "每日 3 次討伐，總傷里程碑自動領獎", tower: "每週 15 層元素關卡（週一重置）", maze: "週限迷宮，路線選擇拿增益（王國 Lv14）", guild: "捐獻升公會科技，每週首領戰", events: "週輪換狩獵/討伐祭，點數兌好康", abyss: "無限深淵挑戰，里程碑＋週結算（攻略第 5 區域解鎖）", exped: "板凳英雄定時委託（王國 Lv16）" }[m.id] || "";
      mk((locked ? "🔒 " : "") + m.name + modeState(i), mx, my + (i % 2 ? 26 : -52), -1, false, locked, i, !!(i % 2), locked ? null : mTip);
      if (m.id === "worldboss") wbPin = { lb: labels[labels.length - 1], idx: i };   // v551：倒數即時更新目標
      mkHit(mx, my, () => clickMode(i), locked ? "🔒 " + m.name + " — 尚未解鎖" : mTip || m.name);   // v283：模式地標本體熱區
    }
  }

  /* v286：模式狀態 pin（純顯示；系統異常時回空字串）
     v551：世界首領 pin 加午夜重置倒數（與秘境/競技場/每日任務同款 fmtClock —
     每日回訪錨點：玩家一眼看到「剩幾戰＋何時重置」） */
  function msToMidnight() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1).getTime() - n.getTime();
  }
  function modeState(i) {
    const m = MODES[i];
    try {
      if (m.id === "worldboss" && MG.sys.worldboss && MG.sys.worldboss.left) {
        const l = MG.sys.worldboss.left();
        const reset = " · " + MG.util.fmtClock(msToMidnight()) + " 後重置";
        return l > 0 ? " · 剩" + l + "戰" + reset : " · 已討伐" + reset;
      }
      if (m.id === "events" && MG.sys.events && MG.sys.events.current) {
        const left = 6 - ((new Date().getDay() + 6) % 7);   // 週一 6 天 … 週日 0
        return left <= 0 ? " · 最後一天" : " · 剩" + left + "天";
      }
      if (m.id === "exped" && MG.sys.wanderers && MG.sys.wanderers.expedState) {
        const st = MG.sys.wanderers.expedState();
        if (st && st.active > 0) return " · 進行中" + st.active;
      }
    } catch (e) { /* 顯示層不因系統異常崩潰 */ }
    return "";
  }

function placeLabels() {
    const cw = canvas.clientWidth || VW, ch = canvas.clientHeight || VH;
    // v574FIX：名牌/熱區世界→CSS 映射 = cw/VW（CSS px 每世界 px）— 與「Canvas 邏輯 VW 世界 px 顯示於
    // cw CSS px」的縮放鏈一致：縮放 1.5×/2× 時名牌/熱區同步放大座標、對準放大的地標。
    // （原 kx=1 假設內容→CSS 恆 1:1；renderFrame 源區塊修正為 VW 後，縮放時內容放大 cw/VW 倍。）
    const kx = cw / VW, ky = ch / VH;
    const buildRects = () => {
      const out = [];
      for (const lb of labels) {
        const w = lb.el.offsetWidth, h = lb.el.offsetHeight;
        const natX = (lb.x - offX) * kx;
        const y = (lb.y - offY) * ky;
        // v551：名牌水平夾緊 — 名牌自然位置與視口重疊（含貼邊）時整塊留在視口內：
        // 世界首領倒數 pin 238px 寬、右緣地標名牌會溢位被 wrap 裁切；原「深淵」名牌貼左緣同樣被切。
        // 完全在視口外的名牌保持原位（不釘在邊緣造成東側名牌同 x 堆疊）。
        const overlapsView = (natX + w / 2 > 4) && (natX - w / 2 < cw - 4);
        const x = overlapsView ? Math.max(w / 2 + 4, Math.min(cw - 4 - w / 2, natX)) : natX;
        lb.el.style.left = x + "px";
        lb.el.style.top = y + "px";
        out.push({ lb, x, y, w, h });
      }
      return out;
    };
    // v283：地標熱區跟隨捲動（與名牌同一座標映射）
    for (const hz of hitZones) {
      hz.el.style.left = ((hz.x - offX) * kx) + "px";
      hz.el.style.top = ((hz.y - offY) * ky) + "px";
    }
    let rects = buildRects();
    // v280：名牌防碰撞 — 依錨點 y 排序掃描，重疊則把後者下推（below 名牌錨點在頂部）
    const resolve = (maxPass) => {
      rects.sort((a, b) => a.y - b.y);
      let moved = true;
      for (let pass = 0; pass < maxPass && moved; pass++) {
        moved = false;
        for (let i = 0; i < rects.length; i++) {
          const A = rects[i];
          const aTop = A.lb.below ? A.y : A.y - A.h;
          const aLeft = A.x - A.w / 2;
          for (let j = 0; j < i; j++) {
            const B = rects[j];
            const bTop = B.lb.below ? B.y : B.y - B.h;
            const bLeft = B.x - B.w / 2;
            if (aLeft < bLeft + B.w && aLeft + A.w > bLeft && aTop < bTop + B.h && aTop + A.h > bTop) {
              // 下推 A 錨點：上方模式名牌本體在錨點上方（需 +A.h），下方模式本體在錨點下方
              const bBottom = B.lb.below ? B.y + B.h : B.y;
              const newY = bBottom + (A.lb.below ? 0 : A.h) + 6;
              if (newY > A.y) { A.y = newY; A.lb.el.style.top = newY + "px"; moved = true; }
            }
          }
        }
      }
    };
    const overlapsLeft = () => {
      const out = [];
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const A = rects[i], B = rects[j];
        const aTop = A.lb.below ? A.y : A.y - A.h, aLeft = A.x - A.w / 2;
        const bTop = B.lb.below ? B.y : B.y - B.h, bLeft = B.x - B.w / 2;
        if (aLeft < bLeft + B.w && aLeft + A.w > bLeft && aTop < bTop + B.h && aTop + A.h > bTop) out.push([A, B]);
      }
      return out;
    };
    resolve(8);
    // v574：密集區縮小降級（backlog P1 名牌碰撞解析「縮小」）— 推開仍重疊時把較寬者縮字
    // （12px→10px、padding 3px 8px→2px 5px）再重排；縮放 2× 下密集群（世界首領 pin 238px 寬）
    // 有效解除；已縮過的不重複縮，跳出當輪
    for (let shrinkRound = 0; shrinkRound < 2; shrinkRound++) {
      const left = overlapsLeft();
      if (!left.length) break;
      let shrunkAny = false;
      for (const [A, B] of left) {
        const wider = A.w >= B.w ? A : B;
        if (wider.lb.shrunk) continue;
        const el = wider.lb.el;
        el.style.fontSize = "10px";
        el.style.padding = "2px 5px";
        wider.lb.shrunk = true;
        shrunkAny = true;
      }
      if (!shrunkAny) break;
      rects = buildRects();
      resolve(6);
    }
  }

  function clickRegion(idx) {
    const st = S();
    const rs = REGIONS();
    if (idx > (st.stats.maxRegionReached || 0)) {
      MG.ui.dom.toast("尚未解鎖：擊敗「" + rs[idx - 1].name + "」的守關 BOSS 才能前往", "bad", "icon_lock");
      return;
    }
    const F = MG.sys.battle.get();
    if (F && F.phase === "fight") {
      MG.ui.dom.toast("戰鬥進行中！等當前戰鬥結束後再切換地圖", "bad", "icon_sword");
      return;
    }
    // v279：走 v274 統一入口（fromMap=true → 副本顯示「⤴ 大地圖」回等角地圖）
    MG.ui.hunt.gotoMonster(idx, 1, true);
  }

  /* ---------- 模式地標點擊（v278 合併移植 worldmap.actionOf — gate 門檻 toast／直開模式） ---------- */
  function clickMode(idx) {
    const m = MODES[idx];
    if (!m) return;
    if (m.gate && !m.gate()) {
      const hint = {
        royal: "王者競技場需王國 Lv12",
        maze: "奇境迷宮需王國 Lv14",
        abyss: "深淵尚未開啟（攻略第 5 區域後解鎖）",
        exped: "委託遠征營需王國 Lv16"
      }[m.id] || m.name + " 尚未開啟";
      MG.ui.dom.toast(hint, "bad", "icon_lock");
      return;
    }
    const F = MG.sys.battle.get();
    if (F && F.phase === "fight") {
      MG.ui.dom.toast("戰鬥進行中！等當前戰鬥結束後再切換地圖", "bad", "icon_sword");
      return;
    }
    (MG.ui.more[m.open] || (() => {})).call(MG.ui.more);
  }

  /* ---------- 捲動 ---------- */
  function clamp() {
    // v574：捲動邊界以「邏輯視窗」VW×VH（可見世界寬高）計算 — 縮放後可見範圍縮小，邊界隨之收縮
    const maxX = Math.max(0, BASE_W - VW), maxY = Math.max(0, BASE_H - VH);
    offX = Math.max(0, Math.min(maxX, offX));
    offY = Math.max(0, Math.min(maxY, offY));
  }
  let suppressClick = false;  // v283FIX：拖曳後鬆手在名牌/熱區上誤觸點擊（原 drag.moved 在 up 後已清空）
  function onDown(e) {
    drag = { x: e.clientX, y: e.clientY, offX, offY, moved: false };
    suppressClick = false;
    e.preventDefault();
  }
  function onMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
    offX = drag.offX - dx;
    offY = drag.offY - dy;
    clamp();
    placeLabels();
  }
  function onUp() {
    if (drag && drag.moved) suppressClick = true;  // v283FIX：拖曳過 → 鬆手這次 click 不觸發
    drag = null;
  }

  /* ---------- screen ---------- */
  function renderFrame() {
    if (!base) buildBase();
    ctx.fillStyle = "#0d0e1a";
    ctx.fillRect(0, 0, VW, VH);
    // v574FIX：源區塊取「邏輯視窗」VW×VH（世界 px）→ 全畫布 VW×VH 邏輯單位 — 每邏輯 px = 1 世界 px，
    // 顯示時 Canvas CSS 寬固定（cw）而邏輯寬縮小（VW = 460/zoom）→ 內容實際放大 cw/VW 倍。
    // 原實作源區塊取 canvas.clientWidth（cw）：cw 世界 px 塞進 VW 邏輯再拉回 cw CSS = 恆 1:1，
    // 「🔍 1.5×/2×」只降解析度不放大（v304 意圖未落地）— 本輪修正。
    ctx.drawImage(base, Math.round(offX), Math.round(offY), VW, VH, 0, 0, VW, VH);
    drawFx(performance.now());
  }
  /* v291：小地圖繪製 — 村莊白點／已解鎖區綠點／鎖定灰點／模式金點＋視口白框 */
  function drawMinimap() {
    if (!mmCtx) return;
    const mw = 96, mh = 60;
    const kx = mw / BASE_W, ky = mh / BASE_H;
    const st = S();
    mmCtx.fillStyle = "rgba(10,12,26,0.9)";
    mmCtx.fillRect(0, 0, mw, mh);
    // 村莊
    mmCtx.fillStyle = "#f2f4ff";
    mmCtx.fillRect(isoX(8.5, 20.5) * kx - 1, isoY(8.5, 20.5) * ky - 1, 3, 3);
    // 區域（已解鎖綠／鎖定灰）
    for (let i = 0; i < CENTERS.length; i++) {
      const b = CENTERS[i];
      const px = isoX(b.c, b.r) * kx, py = isoY(b.c, b.r) * ky;
      mmCtx.fillStyle = i <= (st.stats.maxRegionReached || 0) ? "#7ee787" : "#3a3f52";
      mmCtx.fillRect(px - 1, py - 1, 2, 2);
    }
    // 模式地標金點
    for (let i = 0; i < MODES.length; i++) {
      const m = MODES[i];
      const px = isoX(m.c, m.r) * kx, py = isoY(m.c, m.r) * ky;
      mmCtx.fillStyle = m.gate && !m.gate() ? "#6b7199" : "#ffd166";
      mmCtx.fillRect(px - 1, py - 1, 2, 2);
    }
    // v309：每日寶箱（未開時白點閃爍 — minimap 直接可見位置）
    if (!chestInfo().opened) {
      const ci = chestInfo();
      const px = isoX(ci.x, ci.r) * kx, py = isoY(ci.x, ci.r) * ky;
      const blink = (performance.now() / 600) % 1 < 0.5;
      mmCtx.fillStyle = blink ? "#ffffff" : "#9aa3c0";
      mmCtx.fillRect(px - 1, py - 1, 3, 3);
    }
    // 視口白框（v574：寬高取邏輯視窗 VW×VH — 縮放後可見範圍正確）
    const vx = offX * kx, vy = offY * ky;
    const vw = Math.min(mw - vx, VW * kx);
    const vh = Math.min(mh - vy, VH * ky);
    mmCtx.strokeStyle = "rgba(255,255,255,0.85)";
    mmCtx.lineWidth = 1;
    mmCtx.strokeRect(vx + 0.5, vy + 0.5, Math.max(4, vw - 1), Math.max(3, vh - 1));
  }

  let celebPan = null;   // v284：解鎖慶祝自動捲到新區 {x0,y0,x1,y1,t0}
  /* v551：世界首領 pin 每秒更新倒數（跨午夜自動還原「剩3戰」；寬度變化後重排防碰撞） */
  function refreshPins(now) {
    if (!wbPin) return;
    if (now - lastPinT < 1000) return;
    lastPinT = now;
    const m = MODES[wbPin.idx];
    if (!m) return;
    const locked = m.gate ? !m.gate() : false;
    wbPin.lb.el.textContent = (locked ? "🔒 " : "") + m.name + modeState(wbPin.idx);
    placeLabels();
  }
  function loop() {
    // v284：新區解鎖 → 平滑捲到該區（玩家立刻看到金環煙火；rm 直接跳）
    if (celebPan && !drag) {
      const f = Math.min(1, (performance.now() - celebPan.t0) / 1000);
      const e = f * f * (3 - 2 * f);   // smoothstep
      offX = celebPan.x0 + (celebPan.x1 - celebPan.x0) * e;
      offY = celebPan.y0 + (celebPan.y1 - celebPan.y0) * e;
      placeLabels();
      if (f >= 1) celebPan = null;
    }
    refreshPins(performance.now());   // v551：世界首領重置倒數 1Hz
    renderFrame();
    drawMinimap();   // v291：小地圖視口矩形隨捲動更新
    rafId = requestAnimationFrame(loop);
  }

  /* ---------- 新區解鎖慶祝（v284：金環擴張＋煙火；rm 靜態金環） ---------- */
  function drawUnlockFx(t, sx, sy) {
    if (!unlockCelebration) return;
    const st = S();
    const rm = !!(st.settings && st.settings.reducedMotion);
    const { region, t0 } = unlockCelebration;
    const el = Math.min(1, (t - t0) / 2800);   // 0..1
    if (el >= 1) { unlockCelebration = null; return; }
    const c = CENTERS[region];
    if (!c) return;
    const px = sx(isoX(c.c, c.r)), py = sy(isoY(c.c, c.r)) - 14;
    if (px < -60 || px > VW + 60 || py < -60 || py > VH + 60) return;
    if (rm) {
      // 靜止金環（單幀提示）
      ctx.strokeStyle = "rgba(255,209,102,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 20, 0, 6.2832); ctx.stroke();
      return;
    }
    // 金環擴張淡出（兩環交錯）
    for (let k = 0; k < 2; k++) {
      const ph = (el * 2 + k * 0.5) % 1;
      ctx.strokeStyle = "rgba(255,209,102," + (0.75 * (1 - ph)).toFixed(3) + ")";
      ctx.lineWidth = k === 0 ? 2 : 1;
      ctx.beginPath(); ctx.arc(px, py, 8 + ph * 28, 0, 6.2832); ctx.stroke();
    }
    // 煙火：12 向粒子擴散
    for (let k = 0; k < 12; k++) {
      const ang = (k / 12) * 6.2832 + el * 0.7;
      const fx = px + Math.cos(ang) * el * 32, fy = py + Math.sin(ang) * el * 22;
      ctx.fillStyle = "rgba(255,209,102," + (0.85 * (1 - el)).toFixed(3) + ")";
      ctx.fillRect(fx - 1, fy - 1, 2, 2);
      ctx.fillStyle = "rgba(255,240,200," + (0.7 * (1 - el)).toFixed(3) + ")";
      ctx.fillRect(fx, fy - 1, 1, 1);
    }
    // 上升火花（前半段）
    if (el < 0.4) {
      const fy = py - el * 34;
      ctx.fillStyle = "rgba(255,220,140,0.9)";
      ctx.fillRect(px - 1, fy - 3, 2, 3);
    }
  }

  /* ---------- 動態層（TheoTown 風活地圖；reducedMotion 時馬車定點佇立、其餘靜止） ---------- */
  function drawFx(t) {
    const st = S();
    const rm = !!(st.settings && st.settings.reducedMotion);
    // v284：解鎖進度跨畫面追蹤（首載不慶祝；之後 maxRegionReached 增長 → 啟動慶祝）
    const mr = st.stats.maxRegionReached || 0;
    if (lastMaxRegionSeen !== null && mr > lastMaxRegionSeen && !unlockCelebration) {
      unlockCelebration = { region: mr, t0: performance.now() };
      // v284：同時平滑捲到新區中心（玩家看得到慶祝；rm 直接跳）
      const c = CENTERS[mr];
      if (c) {
        const txc = Math.max(0, Math.min(BASE_W - VW, isoX(c.c, c.r) - VW / 2));   // v574：邊界取邏輯視窗
        const tyc = Math.max(0, Math.min(BASE_H - VH, isoY(c.c, c.r) - VH / 2));
        const st2 = S();
        const rm2 = !!(st2.settings && st2.settings.reducedMotion);
        if (rm2) { offX = txc; offY = tyc; placeLabels(); }
        else celebPan = { x0: offX, y0: offY, x1: txc, y1: tyc, t0: performance.now() };
      }
    }
    lastMaxRegionSeen = mr;
    // v574：renderFrame 源區塊 = 邏輯視窗 VW×VH → 每邏輯 px = 1 世界 px（原 kx=VW/cw 是為配合
    // 源寬 cw 的舊渲染；改 1:1 後 fx 層與地標/名牌在縮放 1.5×/2× 下同步放大）
    const kx = 1, ky = 1;
    const sx = wx => (wx - offX) * kx;
    const sy = wy => (wy - offY) * ky;
    drawUnlockFx(t, sx, sy);
    drawChest(t, sx, sy);   // v296：每日寶箱（rm 定幀呼吸）
    drawFarmHarvestFx(t, sx, sy);   // v298：農田收穫粒子
    drawCrowFx(t, sx, sy);   // v318：農田烏鴉（rm 定幀）
    drawCrownFx(t, sx, sy);   // v323：全通金冠呼吸（rm 恆亮）
    drawAmbientFx(t, sx, sy);   // v299：鳥群／螢火蟲／流星（rm 定幀）
    if (rm) { drawCart(0, Math.min((st.stats.maxRegionReached || 0) + 1, ROAD_STOPS.length - 1), sx, sy); drawFarmFx(0, sx, sy); drawLmFx(0, sx, sy); drawWildlife(0, sx, sy); drawModeFx(0, sx, sy); drawSeaFx(0, sx, sy); return; }
    drawSeaFx(t, sx, sy);   // v293：燈塔光束＋漁船
    // 1. 海洋波紋流動：亮點隨時間左右擺動＋閃爍
    for (let i = 0; i < oceanTiles.length; i++) {
      const o = oceanTiles[i];
      if (o.x < offX - 20 || o.x > offX + VW + 20 || o.y < offY - 20 || o.y > offY + VH + 20) continue;
      const ph = (t / 900 + o.s * 6.28) % 6.28;
      const dx = Math.sin(ph) * 4;
      ctx.fillStyle = "rgba(140,190,255," + (0.16 + 0.14 * Math.sin(ph * 2)) + ")";
      ctx.fillRect(sx(o.x + dx) - 3, sy(o.y) - 1, 6, 2);
      // v581：沿岸泡沫閃爍（岸邊水沫呼吸亮點 — seeded 定點；rm 定幀）
      if (o.coast) {
        const fp = ((t / 620 + o.s * 3.7) % 1);
        const fpx = o.x + (Math.floor(o.s * 997) % 12) - 6;
        const fpy = o.y - 3 + (Math.floor(o.s * 613) % 5);
        const fa = Math.max(0.02, 0.22 + 0.26 * Math.sin(fp * 6.2832));
        ctx.fillStyle = "rgba(226,240,255," + fa.toFixed(3) + ")";
        ctx.fillRect(sx(fpx), sy(fpy), 2, 1);
      }
    }
    // 2. 雲影：兩片半透明雲緩慢右飄
    const clouds = [
      { y: 70, w: 150, sp: 14, off: 0 },
      { y: 180, w: 110, sp: 9, off: 500 }
    ];
    for (const c of clouds) {
      const cx = ((t / 1000) * c.sp + c.off) % (BASE_W + c.w + 100) - c.w - 50;
      const cy = c.y;
      if (cx + c.w < offX - 20 || cx > offX + VW + 20) continue;
      ctx.fillStyle = "rgba(8,10,22,0.14)";
      ctx.beginPath();
      ctx.ellipse(sx(cx + c.w / 2), sy(cy), (c.w / 2) * kx, 14 * ky, 0, 0, 6.2832);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sx(cx + c.w / 2) - 20 * kx, sy(cy + 6), (c.w / 3.2) * kx, 9 * ky, 0, 0, 6.2832);
      ctx.fill();
    }
    // 3. 馬車：沿已解鎖路段來回（村莊 → 最遠解鎖區）
    const maxU = Math.min((st.stats.maxRegionReached || 0) + 1, ROAD_STOPS.length - 1);
    drawCart(t, maxU, sx, sy);
    // 4. 鐵匠煙：forge 已建時煙囪冒煙
    if ((st.buildings.forge || 0) > 0) {
      const fx = isoX(3.9, 24.0), fy = isoY(3.9, 24.0);
      const cx0 = fx - 16 + 26, cy0 = fy - 16 + 1;   // 煙囪頂（sprite 左上 D 區）
      for (let i = 0; i < 3; i++) {
        const ph = ((t / 850 + i / 3) % 1);
        const px = sx(cx0 + Math.sin(ph * 6.28 + i * 2) * 2);
        const py = sy(cy0 - ph * 13) - i * 2;
        ctx.fillStyle = "rgba(160,160,170," + (0.5 * (1 - ph)) + ")";
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
    }
    // 5. 熔岩脈動：僅 maxRegionReached>=3 時繪製（未解鎖霧內不露餡）
    if ((st.stats.maxRegionReached || 0) >= 3) {
      for (let i = 0; i < lavaTiles.length; i++) {
        const l = lavaTiles[i];
        if (l.x < offX - 20 || l.x > offX + VW + 20 || l.y < offY - 20 || l.y > offY + VH + 20) continue;
        const a = 0.5 + 0.5 * Math.sin(t / 320 + l.s * 6.28);
        ctx.fillStyle = "rgba(255,154,77," + (0.35 + 0.4 * a) + ")";
        ctx.fillRect(sx(l.x - 7), sy(l.y - 1), 5, 2);
        ctx.fillStyle = "rgba(255,209,102," + (0.5 + 0.5 * a) + ")";
        ctx.fillRect(sx(l.x - 7), sy(l.y - 1), 2, 2);
      }
    }
    // 6. 農田麥浪搖曳
    drawFarmFx(t, sx, sy);
    // 7. 區域地標動態：風車葉片/旗幟/火焰/泡泡/浮球/燈塔
    drawLmFx(t, sx, sy);
    // 8. 區域野生怪物：在地魔物地標旁遊蕩
    drawWildlife(t, sx, sy);
    // 9. NPC 走動：英雄＋路人在村內道路環線漫步
    drawWalkers(t, rm, sx, sy);
    // 10. 模式地標動態：呼吸光暈＋鎖定遮罩＋徽章點（v278 合併移植）
    drawModeFx(t, sx, sy);
  }

  /* ---------- 模式地標動態層（v278：呼吸光暈＋gate 鎖定 icon＋badges 徽章點；rm 恆亮） ---------- */
  let badgeSnap = null, badgeAt = 0;
  function drawModeFx(t, sx, sy) {
    const st = S();
    const rm = !!(st.settings && st.settings.reducedMotion);
    const now = performance.now();
    if (MG.sys.badges && now - badgeAt > 500) { badgeAt = now; badgeSnap = MG.sys.badges.check(); }
    for (let i = 0; i < MODES.length; i++) {
      const m = MODES[i];
      const ax = isoX(m.c, m.r), ay = isoY(m.c, m.r);
      if (ax < offX - 60 || ax > offX + VW + 60 || ay < offY - 60 || ay > offY + VH + 60) continue;
      const px = sx(ax), py = sy(ay);
      const locked = m.gate ? !m.gate() : false;
      const ph = t / 400 + i * 1.7;
      const glow = rm ? 0.3 : 0.2 + 0.15 * (0.5 + 0.5 * Math.sin(ph));
      ctx.globalAlpha = glow;
      ctx.fillStyle = "#e8d8a8";
      ctx.fillRect(px - 1, py - 2, 3, 3);
      ctx.globalAlpha = rm ? 0.12 : 0.08 * (0.5 + 0.5 * Math.sin(ph + 0.5));
      ctx.fillRect(px - 4, py - 5, 9, 9);
      ctx.globalAlpha = 1;
      if (locked) {
        const art = LM_ART[i] || { w: 24, h: 24 };
        ctx.fillStyle = "rgba(10,10,20,0.55)";
        ctx.fillRect(px - art.w / 2, py - art.h, art.w, art.h + 4);   // v562：遮罩覆蓋新地標全高
        MG.ui.render.draw(ctx, "icon_lock", px - 8, py - art.h / 2 - 8, 1, { scale: 1 });
      }
      if (m.badge && badgeSnap && badgeSnap[m.badge]) {
        const art = LM_ART[i] || { w: 24, h: 24 };
        ctx.fillStyle = (m.badge === "events" || m.badge === "abyss") ? "#ff5c5c" : "#4fc3f7";
        ctx.fillRect(px + art.w / 2 + 2, py - art.h + 8, 4, 4);       // v562：徽章點錨於地標右上（不與新藝術重疊）
      }
      // v285：模式地標主題動畫（對齊區域地標動態水準；rm 靜止幀）
      // v562FIX：鎖定時跳過 — 地標動態屬地標本體，不得穿透鎖定遮罩（皇冠/燈/火/幽光洩漏）
      if (!locked) MODE_FX[i](t, px, py, rm);
    }
  }

  /* v299：氛圍層 — 鳥群／螢火蟲／流星（rm 靜止定幀） */
  function drawAmbientFx(t, sx, sy) {
    const st = S();
    const rm = !!(st.settings && st.settings.reducedMotion);
    // 1. 鳥群：兩群小鳥橫飛全圖（高度不同、週期不同）
    for (let g = 0; g < 2; g++) {
      const period = 26000 + g * 9000;
      const p = rm ? 0.3 : ((t / period + g * 0.45) % 1);
      const by = 46 + g * 38;
      const bx = p * (BASE_W + 120) - 60;
      if (bx < offX - 40 || bx > offX + VW + 40 || by < offY - 40 || by > offY + VH + 40) continue;
      const px = sx(bx), py = sy(by);
      const flap = rm ? 0 : (Math.floor(t / 180 + g) % 2);
      for (let k = 0; k < 3; k++) {
        const ox = px - k * 7, oy = py + (k % 2) * 3;
        ctx.fillStyle = "#3a3f55";
        if (flap) { ctx.fillRect(ox - 2, oy, 2, 1); ctx.fillRect(ox, oy, 2, 1); }
        else { ctx.fillRect(ox - 1, oy - 1, 2, 1); ctx.fillRect(ox, oy - 1, 2, 1); }
      }
    }
    // 2. 螢火蟲：村莊與草原帶 8 隻黃綠螢光點漂浮
    for (let i = 0; i < 8; i++) {
      const fx0 = 120 + (i * 97) % 340, fy0 = 240 + (i * 53) % 160;
      const ph = rm ? 0.5 : ((t / 5000 + i * 0.61) % 1);
      const dx = Math.sin(ph * 6.28 + i * 2.4) * 10;
      const dy = Math.cos(ph * 5.1 + i * 1.1) * 7;
      const bx = fx0 + dx, by = fy0 + dy;
      if (bx < offX - 20 || bx > offX + VW + 20 || by < offY - 20 || by > offY + VH + 20) continue;
      const px = sx(bx), py = sy(by);
      const glow = rm ? 0.5 : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t / 400 + i * 2.7));
      ctx.fillStyle = "rgba(220,255,150," + glow.toFixed(3) + ")";
      ctx.fillRect(px - 1, py - 1, 2, 2);
      ctx.fillStyle = "rgba(255,240,180," + (glow * 0.5).toFixed(3) + ")";
      ctx.fillRect(px, py, 1, 1);
    }
    // 3. 流星：每 ~19s 一顆對角線流星（頂部→右中，白尾）
    if (!rm) {
      const period = 19000;
      const ph = (t % period) / period;
      if (ph < 0.22) {
        const f = ph / 0.22;
        const mx2 = offX + f * (VW + 200) - 60;
        const my2 = offY + 20 + f * 130;
        const px = sx(mx2), py = sy(my2);
        if (px > -60 && px < VW + 60) {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fillRect(px, py, 3, 1);
          ctx.fillStyle = "rgba(255,240,200,0.5)";
          ctx.fillRect(px - 6, py, 5, 1);
          ctx.fillStyle = "rgba(255,240,200,0.25)";
          ctx.fillRect(px - 12, py, 5, 1);
        }
      }
    }
  }

  /* v298：農田收穫粒子（金色麥粒飛散 0.5s；rm 靜止單幀） */
  function drawFarmHarvestFx(t, sx, sy) {
    if (!farmHarvestFx) return;
    const st = S();
    const rm = !!(st.settings && st.settings.reducedMotion);
    const el = Math.min(1, (t - farmHarvestFx.t0) / 500);
    if (el >= 1) { farmHarvestFx = null; return; }
    const px = farmHarvestFx.x, py = farmHarvestFx.y;
    if (rm) { ctx.fillStyle = "rgba(255,209,102,0.6)"; ctx.fillRect(px - 4, py - 8, 8, 3); return; }
    for (let k = 0; k < 6; k++) {
      const ang = (k / 6) * 6.2832 + el * 2;
      const dist = el * 16;
      const fx = px + Math.cos(ang) * dist, fy = py - 6 + Math.sin(ang) * dist * 0.6;
      ctx.fillStyle = "rgba(255,209,102," + (0.9 * (1 - el)).toFixed(3) + ")";
      ctx.fillRect(fx - 1, fy - 1, 2, 2);
      ctx.fillStyle = "rgba(255,240,200," + (0.7 * (1 - el)).toFixed(3) + ")";
      ctx.fillRect(fx, fy, 1, 1);
    }
  }

  /* v296：每日地圖寶箱 — FNV 日種子定位（確定性），已解鎖區隨機點；金箱呼吸光；點擊開箱
     獎勵: 金幣 1000×1.35^(kl-1) ＋ 素材 ×4 ＋ 15% 鑽石 ×5（重訪動機，量級遠低於掛機） */
  const CHEST_FNV = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; } return h; };
  let chestOpenFx = null;   // 開箱小動畫 {t0}
  function chestInfo() {
    const st = S();
    const day = MG.util.today ? MG.util.today() : new Date().toISOString().slice(0, 10);
    const mc = st.mapChest || (st.mapChest = { day: "", opened: false });
    const fresh = mc.day !== day;
    if (fresh) { mc.day = day; mc.opened = false; }
    const maxR = Math.max(0, st.stats.maxRegionReached || 0);
    const seed = CHEST_FNV(day + ":" + st.kingdomName + ":" + st.v);
    const region = seed % (maxR + 1);
    const c = CENTERS[region];
    const wob = (CHEST_FNV(day + ":x" + region) % 200) / 100 - 1;   // -1..1
    const wob2 = (CHEST_FNV(day + ":y" + region) % 200) / 100 - 1;
    return {
      fresh, opened: mc.opened, region,
      x: c.c + wob * 9, r: c.r + wob2 * 8,
      day, seed
    };
  }
  function chestReward() {
    const st = S();
    const gold = Math.floor(1000 * Math.pow(1.35, Math.max(0, (st.kingdom.level || 1) - 1)));
    const r = { gold };
    const mats = ["herb", "leather", "crystal", "ember", "ice", "poison", "void", "myth"];
    const pick = mats[CHEST_FNV(st.mapChest.day + ":m") % mats.length];
    st.mats[pick] = (st.mats[pick] || 0) + 4;
    r.mat = pick;
    if (CHEST_FNV(st.mapChest.day + ":g") % 100 < 15) {
      st.currencies.gems = (st.currencies.gems || 0) + 5;
      r.gems = 5;
    }
    return r;
  }
  function drawChest(t, sx, sy) {
    const st = S();
    const info = chestInfo();
    if (info.opened) return;
    const bx = isoX(info.x, info.r), by = isoY(info.x, info.r);
    const px = sx(bx), py = sy(by);
    if (px < -40 || px > VW + 40 || py < -40 || py > VH + 40) return;
    const rm = !!(st.settings && st.settings.reducedMotion);
    const ph = rm ? 0.5 : 0.5 + 0.5 * Math.sin(t / 600 + info.seed % 7);
    // 呼吸光暈
    ctx.fillStyle = "rgba(255,209,102," + (0.1 + 0.08 * ph).toFixed(3) + ")";
    ctx.fillRect(px - 9, py - 7, 18, 11);
    // 木箱＋金邊
    ctx.fillStyle = "#6a4a2a";
    ctx.fillRect(px - 7, py - 5, 14, 9);
    ctx.fillStyle = "#8a6a3a";
    ctx.fillRect(px - 6, py - 4, 12, 7);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(px - 1, py - 5, 2, 9);
    ctx.fillRect(px - 7, py - 2, 14, 2);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(px - 2, py - 8, 4, 3);   // 鎖扣
    chestPos = { px, py };   // 供點擊判定
  }
  let chestPos = null;
  /* v298：農田互動 — 點麥田收穫（金幣＋小麥浪特效；15s 冷卻；確定性數值） */
  const farmHarvestCd = new Map();   // "x:y" → 下次可收時間
  let farmHarvestFx = null;   // {x, y, t0} 收穫粒子
  function farmReward() {
    const st = S();
    return Math.floor(80 * Math.pow(1.35, Math.max(0, (st.kingdom.level || 1) - 1)));
  }

  /* v293：海洋活化 — 燈塔旋轉光束＋漁船巡航（rm 靜止幀） */
  function drawSeaFx(t, sx, sy) {
    const rm = !!(S().settings && S().settings.reducedMotion);
    // 1. 燈塔光束（蒼穹之塔東南角 → 右下海域；慢掃）
    const lx = isoX(44.5, 24.2), ly = isoY(44.5, 24.2) - 30;
    const px = sx(lx), py = sy(ly);
    if (px > -80 && px < VW + 80 && py > -80 && py < VH + 80) {
      const ang = rm ? -0.6 : -0.9 + 0.6 * Math.sin(t / 2400 + 0.8);   // 緩慢左右掃
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.globalAlpha = rm ? 0.14 : 0.1 + 0.05 * (0.5 + 0.5 * Math.sin(t / 1200));
      ctx.fillStyle = "#ffe9a8";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(46, -3);
      ctx.lineTo(46, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
      // v581：燈室暖光暈（確定性呼吸 — 疊於燈室亮芯；rm 定幀）
      const ga = rm ? 0.16 : 0.13 + 0.07 * (0.5 + 0.5 * Math.sin(t / 900));
      ctx.fillStyle = "rgba(255,209,102," + ga.toFixed(3) + ")";
      ctx.fillRect(px - 6, py - 5, 12, 9);
      ctx.fillStyle = "rgba(255,233,168," + (ga * 0.55).toFixed(3) + ")";
      ctx.fillRect(px - 3, py - 3, 7, 5);
    }
    // 2. 漁船：沿右下海域巡航（東→西→東，微擺）＋白浪尾跡＋船體明暗
    // v581 重繪：TheoTown 船語彙 — 舷緣受光/船身/暗底三階（R4/R5）、桅＋亮暗雙面帆（R4）、
    // 紅旗＋船尾暖燈、白浪尾跡 3 段淡沫；路線/週期/dir 契約零變動
    const f = rm ? 0.5 : ((t / 16000) % 1);
    const dir = Math.floor((t / 16000) % 2);   // 0 去 1 回
    const fx = rm ? 0.5 : (dir === 0 ? f : 1 - f);
    // v307：路線 = 碼頭(45.5,25.2) → 外海(40.5,26.5) 往返
    const bx = isoX(45.5 - fx * 5, 25.2 + fx * 1.3), by = isoY(45.5 - fx * 5, 25.2 + fx * 1.3);
    const bpx = sx(bx), bpy = sy(by);
    if (bpx > -40 && bpx < VW + 40 && bpy > -40 && bpy < VH + 40) {
      const bob = rm ? 0 : Math.sin(t / 420 + fx * 8) * 1.2;   // 船身起伏
      const face = dir === 0 ? 1 : -1;   // dir 0 = 向西（船頭朝左）
      // 白浪尾跡（船尾延伸 3 段淡沫 — 確定性淡出）
      ctx.fillStyle = "rgba(214,232,252,0.5)";
      ctx.fillRect(bpx + face * 7, bpy + bob, 4, 1);
      ctx.fillStyle = "rgba(214,232,252,0.3)";
      ctx.fillRect(bpx + face * 11, bpy + bob + 1, 3, 1);
      ctx.fillStyle = "rgba(214,232,252,0.18)";
      ctx.fillRect(bpx + face * 14, bpy + bob + 2, 2, 1);
      // 船體（木色三階：受光舷緣/船身/暗底 — R4 左受光＋R5 底漸暗）
      ctx.fillStyle = "#8a6434"; ctx.fillRect(bpx - 7, bpy + bob - 3, 14, 1);   // 舷緣受光
      ctx.fillStyle = "#6a4a2a"; ctx.fillRect(bpx - 7, bpy + bob - 2, 14, 2);   // 船身
      ctx.fillStyle = "#4a3418"; ctx.fillRect(bpx - 7, bpy + bob, 14, 1);       // 船底暗階
      // 船首翹起 1px（朝船頭側）
      ctx.fillStyle = "#8a6434";
      ctx.fillRect(face > 0 ? bpx - 7 : bpx + 5, bpy + bob - 4, 2, 1);
      // 桅桿＋帆（左亮右暗 — 光源左上）＋紅旗＋船尾燈
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(face > 0 ? bpx + 2 : bpx - 3, bpy + bob - 9, 1, 6);          // 桅（近船尾側）
      const sailX = face > 0 ? bpx + 3 : bpx - 6;
      ctx.fillStyle = "#e8e0c8"; ctx.fillRect(sailX, bpy + bob - 8, 2, 5);      // 帆亮面（左）
      ctx.fillStyle = "#b8a888"; ctx.fillRect(sailX + 2, bpy + bob - 8, 1, 5);  // 帆暗面（右）
      ctx.fillStyle = "#c8402f"; ctx.fillRect(sailX, bpy + bob - 9, 2, 1);      // 帆頂紅旗
      ctx.fillStyle = "#ffd166"; ctx.fillRect(face > 0 ? bpx + 6 : bpx - 7, bpy + bob - 4, 1, 1);  // 船尾暖燈
    }
    // 3. 海鷗：繞海灣盤旋（白羽＋黑翼尖；TheoTown 海鷗語彙；rm 定點）
    const gx0 = sx(isoX(43, 26.2)), gy0 = sy(isoY(43, 26.2));
    if (gx0 > -60 && gx0 < VW + 60 && gy0 > -60 && gy0 < VH + 60) {
      const gp = rm ? 0.3 : ((t / 8200) % 1);
      const ggx = gx0 + Math.cos(gp * 6.2832) * 26;
      const ggy = gy0 - 26 + Math.sin(gp * 6.2832) * 9;
      const flap = rm ? 0 : (Math.floor(t / 170) % 2);
      ctx.fillStyle = "#e8ecf4";
      if (flap) { ctx.fillRect(ggx - 2, ggy, 2, 1); ctx.fillRect(ggx, ggy, 2, 1); }
      else { ctx.fillRect(ggx - 1, ggy - 1, 2, 1); ctx.fillRect(ggx, ggy - 1, 2, 1); }
      ctx.fillStyle = "#565664";
      ctx.fillRect(ggx - 2, ggy, 1, 1);   // 左翼尖
      ctx.fillRect(ggx + 2, ggy, 1, 1);   // 右翼尖
    }
  }

  /* v323：全通金冠呼吸閃爍（tier 3 動態 — 10/10 區的榮耀微光；rm 恆亮） */
  function drawCrownFx(t, sx, sy) {
    const st = S();
    const rm = !!(st.settings && st.settings.reducedMotion);
    const maxReached = st.stats.maxRegionReached || 0;
    for (let i = 0; i < CENTERS.length; i++) {
      if (i > maxReached) continue;
      const prog = (st.stats.maxStageByRegion && st.stats.maxStageByRegion[i]) || 0;
      if (prog < 10) continue;
      const b = CENTERS[i];
      const px = sx(isoX(b.c, b.r)), py = sy(isoY(b.c, b.r)) - 24;
      if (px < -20 || px > VW + 20 || py < -20 || py > VH + 20) continue;
      const a = rm ? 0.35 : 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(t / 500 + i * 1.3));
      ctx.fillStyle = "rgba(255,209,102," + a.toFixed(3) + ")";
      ctx.fillRect(px - 4, py - 3, 8, 3);
      ctx.fillRect(px - 4, py - 5, 2, 2);
      ctx.fillRect(px + 2, py - 5, 2, 2);
    }
  }

  /* v285：模式地標主題小動畫 — 每個模式 1 個辨識動態（rm 時畫靜止幀） */
  function fxArenaFlag(t, px, py, rm) {     // 競技場：中央旗柱旗飄（v9 對齊新旗柱 -24/-26）
    const sw = rm ? 0 : Math.sin(t / 380 + px) * 1.6;
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(px - 1, py - 26, 2, 3);
    ctx.fillStyle = rm ? "#c8402f" : (0.5 + 0.5 * Math.sin(t / 380 + px) < 0 ? "#c8402f" : "#d8584a");
    ctx.fillRect(px - 1 + Math.round(sw), py - 27, 4, 3);
  }
  function fxCrown(t, px, py, rm) {         // 王者：金冠閃爍（坐於拱頂橫梁 -26，紋章之上）
    const a = rm ? 0.9 : 0.55 + 0.45 * Math.sin(t / 300 + px);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(px - 2, py - 27, 5, 2);
    ctx.fillRect(px - 2, py - 29, 2, 2); ctx.fillRect(px + 1, py - 29, 2, 2);
    ctx.globalAlpha = 1;
  }
  function fxRune(t, px, py, rm) {          // 試煉：符文脈動（疊於主碑符文×5 行）
    const a = rm ? 0.7 : 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t / 260 + px));
    ctx.globalAlpha = a;
    ctx.fillStyle = "#4fc3f7";
    ctx.fillRect(px - 5, py - 23, 12, 1); ctx.fillRect(px - 5, py - 17, 12, 1); ctx.fillRect(px - 5, py - 11, 12, 1);
    ctx.globalAlpha = 1;
  }
  function fxBonePulse(t, px, py, rm) {     // 世界首領：頭骨紅點脈動（倒數感）
    const a = rm ? 0.8 : 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t / 220 + px));
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ff5c5c";
    ctx.fillRect(px - 1, py - 17, 3, 3);
    ctx.globalAlpha = 1;
  }
  function fxSpireGlow(t, px, py, rm) {     // 元素塔：塔尖光芒脈動（繞金尖，v578 apex -46/tip -50..-43）
    const r = rm ? 3 : 3 + Math.round((0.5 + 0.5 * Math.sin(t / 340 + px)) * 2);
    const a = rm ? 0.7 : 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t / 340 + px));
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(px - 1, py - 46 - r, 2, 2);
    ctx.fillRect(px - 1, py - 46 + r, 2, 2);
    ctx.fillRect(px - 1 - r, py - 46, 2, 2);
    ctx.fillRect(px - 1 + r, py - 46, 2, 2);
    ctx.globalAlpha = 1;
  }
  function fxHedgeLight(t, px, py, rm) {    // 迷宮：石拱門金燈呼吸（v9 燈於 ay-6）
    const a = rm ? 0.8 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t / 320 + px));
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(px - 1, py - 6, 3, 3);
    ctx.globalAlpha = 1;
  }
  function fxHallFlag(t, px, py, rm) {      // 公會：茅頂旗柱旗飄（v562 apex -38，旗柱 -41..-36）
    const sw = rm ? 0 : Math.sin(t / 380 + px) * 1.6;
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(px - 1, py - 43, 2, 3);
    ctx.fillStyle = rm ? "#c8402f" : (0.5 + 0.5 * Math.sin(t / 380 + px) < 0 ? "#c8402f" : "#d8584a");
    ctx.fillRect(px - 1 + Math.round(sw), py - 44, 4, 3);
  }
  function fxNoticeFlash(t, px, py, rm) {   // 活動：公告紙張閃爍（頂排告示）
    const on = rm ? true : Math.sin(t / 500 + px) > 0;
    if (on) {
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(px - 6, py - 16, 12, 2);
    }
  }
  function fxStairsGlow(t, px, py, rm) {    // 深淵：紫色幽光自裂縫上浮（v578 裂縫頂 ay-10）
    const ph = rm ? 0.5 : ((t / 900 + (px % 7) / 7) % 1);
    ctx.globalAlpha = rm ? 0.4 : 0.65 * (1 - ph);
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(px - 1, py - 9 - Math.round(ph * 10), 2, 2);
    ctx.globalAlpha = 1;
  }
  function fxCampFire(t, px, py, rm) {      // 遠征：營火跳動（疊於火堆，v578 火堆頂 ay-12）
    const h = rm ? 0 : Math.round((0.5 + 0.5 * Math.sin(t / 180 + px)) * 2);
    ctx.fillStyle = "#ff9a4d";
    ctx.fillRect(px - 2, py - 12 - h, 4, 4);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(px - 1, py - 11 - h, 2, 2);
  }
  const MODE_FX = [fxArenaFlag, fxCrown, fxRune, fxBonePulse, fxSpireGlow, fxHedgeLight, fxHallFlag, fxNoticeFlash, fxStairsGlow, fxCampFire];

  /* ---------- TheoTown 風小人（v172：圓頭＋色塊身＋交替步伐＋貼地影子） ---------- */
  function shadeHex(hex, d) {
    const n = parseInt(hex.slice(1), 16);
    let r = ((n >> 16) & 255) + d, g = ((n >> 8) & 255) + d, b = (n & 255) + d;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  const TOWNIE_SKIN = "#e8c8a0";
  /* v281：地圖小人四方向 — dir = "left"|"right"|"front"|"back"
     FF1 語彙：側面看得到臉側＋髮；正面見髮頂＋臉；背面全髮無臉。
     4 幀走路循環（fr 0-3：bob=fr%2、腿相位=fr>>1） */
  function drawTownie(px, py, bodyC, headC, fr, dir) {
    // 貼地影子
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(px - 3, py + 1, 6, 2);
    const bob = fr % 2 ? -1 : 0;
    const legA = fr >> 1 ? 1 : 0;   // 0:左腿前 1:右腿前
    const flip = dir === "left";
    // 腿（交替步伐）
    ctx.fillStyle = "#1e1e28";
    if (dir === "front") {
      // 正面：雙腿分開、高低交替更明顯
      ctx.fillRect(px - 2, py - 2 + (legA ? 0 : bob), 2, 2);
      ctx.fillRect(px + 1, py - 2 + (legA ? bob : 0), 2, 2);
    } else if (flip) {
      ctx.fillRect(px - 1, py - 1 + bob, 2, 2);
      ctx.fillRect(px + 2, py - 2 + bob, 2, 2);
    } else {
      ctx.fillRect(px - 2, py - 2 + bob, 2, 2);
      ctx.fillRect(px + 1, py - 1 + bob, 2, 2);
    }
    // 身體（色塊＋暗描邊；背面略暗呈現背光）
    const bodyShade = dir === "back" ? shadeHex(bodyC, -70) : bodyC;
    ctx.fillStyle = "#14121f";
    ctx.fillRect(px - 3, py - 5 + bob, 6, 4);
    ctx.fillStyle = bodyShade;
    ctx.fillRect(px - 2, py - 4 + bob, 4, 3);
    ctx.fillStyle = shadeHex(bodyShade, -40);
    ctx.fillRect(px - 2, py - 4 + bob, 4, 1);
    // 頭
    ctx.fillStyle = "#14121f";
    ctx.fillRect(px - 2, py - 9 + bob, 4, 4);
    if (dir === "back") {
      // 背面：全髮（後腦勺），無臉
      ctx.fillStyle = shadeHex(headC, -30);
      ctx.fillRect(px - 1, py - 7 + bob, 2, 2);
      ctx.fillStyle = headC;
      ctx.fillRect(px - 2, py - 9 + bob, 4, 1);
      ctx.fillRect(px - 1, py - 8 + bob, 2, 1);
    } else if (dir === "front") {
      // 正面：髮頂＋完整臉
      ctx.fillStyle = TOWNIE_SKIN;
      ctx.fillRect(px - 2, py - 7 + bob, 4, 3);
      ctx.fillStyle = headC;
      ctx.fillRect(px - 2, py - 9 + bob, 4, 1);
      ctx.fillRect(px - 2, py - 8 + bob, 4, 1);
    } else {
      // 側面：臉側＋髮
      ctx.fillStyle = TOWNIE_SKIN;
      ctx.fillRect(px - 1, py - 7 + bob, 2, 2);
      ctx.fillStyle = headC;
      ctx.fillRect(px - 2, py - 9 + bob, 4, 1);
      ctx.fillRect(px - 1, py - 8 + bob, 2, 1);
    }
  }

  /* ---------- 村內走動（v172：所有角色都是 TheoTown 小人，走街道圖） ----------
     角色 = 全體領地英雄（職業色）＋全體流浪英雄（職業色）＋2 村民路人。
     沿 VEDGES 道路圖行走：隨機目標節點＋BFS 最短路徑，到點暫停再出發；
     reducedMotion 時不移動（定幀）。 */
  const WALK_NEXT = (() => {   // 全對最短路徑第一步表
    const n = VNODES.length;
    const adj = Array.from({ length: n }, () => []);
    for (const [a, b] of VEDGES) { adj[a].push(b); adj[b].push(a); }
    const next = Array.from({ length: n }, () => new Array(n).fill(-1));
    for (let s = 0; s < n; s++) {
      const q = [s]; const seen = new Array(n).fill(false);
      seen[s] = true; next[s][s] = s;
      for (let qi = 0; qi < q.length; qi++) {
        const u = q[qi];
        for (const v of adj[u]) {
          if (!seen[v]) { seen[v] = true; next[s][v] = (u === s ? v : next[s][u]); q.push(v); }
        }
      }
    }
    return next;
  })();
  const walkers = new Map();   // uid → { spr, scale, fromNode, toNode, target, prog, pauseUntil, c, r, dir }
  let lastWalkT = 0;

  function walkerStep(w, dt) {
    if (w.pauseUntil > performance.now()) return;
    const from = VNODES[w.fromNode], to = VNODES[w.toNode];
    w.prog += dt * (w.speed || 0.34);    // tile/s（約 12px/s 畫面速度；小孩 1.5×、商人 0.85×）
    if (w.prog >= 1) {
      w.fromNode = w.toNode;
      if (w.fromNode === w.target) {
        // v282：行為多樣化 — 駐足長度依角色（商人擺攤/農夫歇腳較久，小孩好動）
        const isHome = w.homeNode !== undefined && w.fromNode === w.homeNode;
        const base = (w.pauseMin || 700) + Math.random() * (w.pauseMax || 2500);
        w.pauseUntil = performance.now() + (isHome ? Math.max(base * 2.2, 2600) : base);
        w.target = (Math.floor(Math.random() * VNODES.length) + 1) % VNODES.length;
        if (w.target === w.fromNode) w.target = (w.target + 1) % VNODES.length;
        // 農夫偏好農田側節點（10 南巷/11 南城門）；商人偏好東門（9）
        if (w.preferFarm && w.target !== 10 && w.target !== 11 && Math.random() < 0.4) w.target = Math.random() < 0.5 ? 10 : 11;
        if (w.preferGate && Math.random() < 0.4) w.target = 9;
      } else {
        w.toNode = WALK_NEXT[w.fromNode][w.target];
      }
      w.prog = 0;
    }
    const dc = to[0] - from[0], dr = to[1] - from[1];
    w.c = from[0] + dc * w.prog;
    w.r = from[1] + dr * w.prog;
    // v281：四方向 — 等角投影畫面向量 (vx,vy) = (dc-dr, dc+dr)；主軸定方向
    const vx = dc - dr, vy = dc + dr;
    if (Math.abs(vx) >= Math.abs(vy)) w.dir = vx >= 0 ? "right" : "left";
    else w.dir = vy >= 0 ? "front" : "back";
  }

  function drawWalkers(t, rm, sx, sy) {
    const st = S();
    // 期望角色清單：領地英雄＋流浪英雄＋村民（kind = 職業 id 或 v1/v2/v3/v4）
    // v282：村民行為多樣化 — v1 農夫（綠衣、偏農田）、v2 小孩（亮藍、快、好動）、v3 商人（紅衣、偏東門）
    const want = [];
    for (const h of (st.hunters || [])) if (h && h.id) want.push(["h" + h.id, h.cls, 1]);
    for (const wd of (st.wanderers || [])) if (wd && !wd.dead) want.push(["w" + wd.uid, wd.cls, 1]);
    want.push(["v1", "v1", 1], ["v2", "v2", 1], ["v3", "v3", 1], ["v4", "v4", 1], ["v5", "v5", 1]);
    // 同步：新角色從隨機節點出發，離場移除
    const keys = new Set();
    for (const x of want) keys.add(x[0]);
    for (const k of [...walkers.keys()]) if (!keys.has(k)) walkers.delete(k);
    for (const [k, kind] of want) {
      let w = walkers.get(k);
      if (!w) {
        const n0 = Math.floor(Math.random() * VNODES.length);
        const n1 = (n0 + 1 + Math.floor(Math.random() * (VNODES.length - 1))) % VNODES.length;
        w = { kind, fromNode: n0, toNode: WALK_NEXT[n0][n1], target: n1, prog: Math.random(),
              pauseUntil: performance.now() + Math.random() * 2000, c: VNODES[n0][0], r: VNODES[n0][1], dir: "right" };
        // 行為特質：v1 農夫（慢、農田歇腳）、v2 小孩（快、好動）、v3 商人（中速、東門擺攤）、
        // v306：v4 工人（鐵匠鋪西街往返、中等速度）、v5 老婦（慢、廣場長坐）
        if (kind === "v1") { w.speed = 0.26; w.pauseMin = 900; w.pauseMax = 3000; w.preferFarm = true; w.homeNode = 10; }
        else if (kind === "v2") { w.speed = 0.52; w.pauseMin = 300; w.pauseMax = 1100; }
        else if (kind === "v3") { w.speed = 0.32; w.pauseMin = 1200; w.pauseMax = 3800; w.preferGate = true; w.homeNode = 9; }
        else if (kind === "v4") { w.speed = 0.36; w.pauseMin = 500; w.pauseMax = 1800; w.homeNode = 3; }   // 西街南端（鐵匠鋪側）
        else if (kind === "v5") { w.speed = 0.2; w.pauseMin = 3000; w.pauseMax = 6000; w.homeNode = 5; }   // 東街×中街廣場長坐
        walkers.set(k, w);
      }
      w.kind = kind;                      // 職業可能變化
    }
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastWalkT) / 1000 || 0.016);
    lastWalkT = now;
    for (const w of walkers.values()) {
      if (!rm) walkerStep(w, dt);
      const x = isoX(w.c, w.r), y = isoY(w.c, w.r);
      if (x < offX - 30 || x > offX + VW + 30 || y < offY - 30 || y > offY + VH + 30) continue;
      // TheoTown 小人配色：職業色身體；v282 村民身份化 — 農夫綠衣草帽/小孩亮藍/商人紅衣深帽
      let body, head;
      if (w.kind === "v1") { body = "#7ec86a"; head = "#c8a85a"; }
      else if (w.kind === "v2") { body = "#6ab8ff"; head = "#3a4a6a"; }
      else if (w.kind === "v3") { body = "#e0705a"; head = "#4a2a2a"; }
      else if (w.kind === "v4") { body = "#b09060"; head = "#4a3a2a"; }
      else if (w.kind === "v5") { body = "#9a8ab8"; head = "#d8d0c8"; }
      else {
        body = (MG.data.hunters.classes[w.kind] || {}).color || "#9fb4ff";
        head = "#2a2233";
      }
      const fr = rm ? 0 : (Math.floor(t / 240) % 4);   // v281：走路四幀循環
      drawTownie(sx(x), sy(y) + 2, body, head, fr, w.dir);
    }
  }

  /* 馬車：沿蜿蜒道路（村莊東門 → 最遠解鎖區）往返（ping-pong），畫小貨車 */
  function drawCart(t, maxU, sx, sy) {
    const rp = roadPointsCached(maxU);   // v294：快取（upTo 不變重用）
    if (rp.length < 2) return;
    // 折線總長（世界座標）
    let seg = [], total = 0;
    for (let i = 0; i < rp.length - 1; i++) {
      const [c0, r0] = rp[i], [c1, r1] = rp[i + 1];
      const dx = isoX(c1, r1) - isoX(c0, r0), dy = isoY(c1, r1) - isoY(c0, r0);
      const len = Math.hypot(dx, dy);
      seg.push({ dx, dy, len, c0, r0 }); total += len;
    }
    if (!total) return;
    const period = 42000;                    // 單程 42s（來回 84s）
    const dir = Math.floor(t / period) % 2 === 0 ? 1 : -1;
    let d = (t % period) / period * total;
    if (dir < 0) d = total - d;
    let acc = 0, si = 0;
    for (let i = 0; i < seg.length; i++) {
      if (d <= acc + seg[i].len) { si = i; break; }
      acc += seg[i].len;
    }
    const s = seg[si], f = (d - acc) / (s.len || 1);
    const [c0, r0] = rp[si];
    const x = isoX(c0, r0) + s.dx * f, y = isoY(c0, r0) + s.dy * f;
    if (x < offX - 30 || x > offX + VW + 30 || y < offY - 30 || y > offY + VH + 30) return;
    const px = sx(x), py = sy(y) - 6;
    // 落地陰影
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(px - 9, py + 1, 18, 3);
    // 車廂（木箱）
    ctx.fillStyle = "#8a5a2a";
    ctx.fillRect(px - 7, py - 5, 10, 6);
    ctx.fillStyle = "#6a4020";
    ctx.fillRect(px - 7, py - 3, 10, 1);
    ctx.fillStyle = "#c08a4a";
    ctx.fillRect(px - 7, py - 6, 10, 2);
    // 貨物金幣袋
    ctx.fillStyle = "#d0a040";
    ctx.fillRect(px - 5, py - 8, 3, 3);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(px - 4, py - 7, 1, 1);
    // 車軸＋輪子
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(px - 3, py - 1, 2, 3);
    ctx.fillStyle = "#1a120a";
    ctx.fillRect(px - 8, py + 1, 4, 4);
    ctx.fillRect(px + 2, py + 1, 4, 4);
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(px - 7, py + 2, 2, 2);
    ctx.fillRect(px + 3, py + 2, 2, 2);
  }

  function open() {
    const cur = MG.ui.screens.currentId;
    returnId = (cur && cur !== "map") ? cur : "kingdom";
    MG.ui.screens.show("map");
  }

  const screen = {
    render(root) {
      root.innerHTML = "";
      base = null;
      root.appendChild(MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 2px" } },
        MG.ui.dom.h("div", { class: "title", style: { fontSize: 18 } }, "世界地圖"),
        MG.ui.dom.h("div", { style: { display: "flex", gap: 6, alignItems: "center" } },
          MG.ui.dom.h("button", { class: "btn sm", style: { minHeight: 26, padding: "2px 10px", fontSize: 10 }, title: "地圖縮放 1×/1.5×/2×（循環切換）", on: { click: (e) => { zoomLevel = zoomLevel >= 2 ? 1 : (zoomLevel === 1 ? 1.5 : 2); VW = 460 / zoomLevel; VH = 500 / zoomLevel; const dpr2 = Math.min(1.5, window.devicePixelRatio || 1); canvas.width = VW * dpr2; canvas.height = VH * dpr2; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr2, dpr2); clamp(); renderFrame(); placeLabels(); e.currentTarget.textContent = "🔍 " + zoomLevel + "×"; } } }, "🔍 1×"),
          MG.ui.dom.h("button", { class: "btn sm", title: "返回「" + (returnId === "kingdom" ? "王國" : "副本") + "」", on: { click: () => MG.ui.screens.show(returnId) } }, "返回"))));
      // v301：探索度顯示（已解鎖區 /10 ＋ 深淵額外）
      const maxR = Math.max(0, (S().stats.maxRegionReached || 0));
      const abyssOn = !!(MG.sys.abyss && MG.sys.abyss.unlocked && MG.sys.abyss.unlocked());
      const exploredTxt = "探索 " + (maxR + 1) + "/10 區" + (abyssOn ? " ＋深淵" : "");
      root.appendChild(MG.ui.dom.h("div", { class: "sub", style: { padding: "0 14px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" } },
        MG.ui.dom.h("span", { title: "拖曳或滾輪捲動（Shift＋滾輪＝水平）；點名牌或地標圖示前往討伐；金色名牌＝目前區域；灰霧區完成前一區域最後一關解鎖" }, "拖曳捲動探索世界 · 點名前往討伐 · 灰霧＝尚未解鎖"),
        MG.ui.dom.h("span", { style: { color: "var(--gold)", fontWeight: 800, fontSize: 11 }, title: "已解鎖區域數（討伐區域 BOSS 解鎖下一區）＋深淵入口" }, exploredTxt)));
      const wrap = MG.ui.dom.h("div", { style: { position: "relative", margin: "0 10px", border: "2px solid #000", outline: "1px solid var(--line)", outlineOffset: -1, borderRadius: 0, overflow: "hidden" } });
      canvas = document.createElement("canvas");
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = VW * dpr; canvas.height = VH * dpr;
      canvas.style.width = "100%"; canvas.style.height = "auto";
      canvas.style.display = "block";
      canvas.style.imageRendering = "pixelated";
      canvas.style.touchAction = "none";
      ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      wrap.appendChild(canvas);
      root.appendChild(wrap);
      // 拖曳捲動（綁 wrap：名牌層覆蓋 canvas，綁 canvas 會收不到 pointerdown）
      wrap.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      // v576：滾輪捲動（桌機/觸控板 — 補拖曳之外的第二捲動路徑）
      // deltaY → 垂直、deltaX（觸控板橫向）→ 水平、shift+滾輪 → 水平（桌機慣例）；
      // deltaMode 1 = line（Firefox）換算 ×16；clamp 防越界、placeLabels 名牌跟隨、
      // canvas 視區由 raf loop 每幀重繪 — 零新增繪製迴圈。
      wrap.addEventListener("wheel", (e) => {
        e.preventDefault();
        const mult = e.deltaMode === 1 ? 16 : 1;
        if (e.shiftKey) offX += (e.deltaY || e.deltaX) * mult;
        else { offX += e.deltaX * mult; offY += e.deltaY * mult; }
        clamp();
        placeLabels();
      }, { passive: false });
      // v295：野外遭遇彩蛋 — 點野生怪物給小獎勵（60s 冷卻；拖曳後不觸發）
      wrap.addEventListener("click", (e) => {
        if (suppressClick) { suppressClick = false; return; }
        const r = wrap.getBoundingClientRect();
        // v557FIX：點擊座標 CSS→邏輯 — 畫布世界→CSS 恆為 1:1（與 placeLabels 同源，v551），
        // 但互動命中點（麥田/每日寶箱/野生怪物）以邏輯座標計算與儲存（fx 層同款 sx/sy）。
        // 原實作把 CSS 點擊座標直接與邏輯命中點比較（fkx=VW/cw），手機欄寬 366px 時
        // VW/cw=1.257 → 命中點偏離可見物 25.7%（≈90px）— 麥田/寶箱/怪物看得到點不到；
        // 桌機 cw=444 誤差僅 3.6% 被命中半徑吸收，故先前驗證未察覺。
        const kx2 = VW / (canvas.clientWidth || VW), ky2 = VH / (canvas.clientHeight || VH);
        const mx = (e.clientX - r.left) * kx2, my = (e.clientY - r.top) * ky2;
        const now = performance.now();
        // v298：農田收穫（點麥田 — 金幣＋粒子；15s 冷卻）
        const now2 = performance.now();
        for (const [cx0, cr0] of WHEAT_TILES) {
          const wx = isoX(cx0, cr0), wy = isoY(cx0, cr0);
          const wpx = (wx - offX) * kx2, wpy = (wy - offY) * ky2;
          if (Math.abs(wpx - mx) < 14 && Math.abs(wpy - my) < 14) {
            const key = cx0 + ":" + cr0;
            if (farmHarvestCd.get(key) > now2) {
              const left = Math.ceil((farmHarvestCd.get(key) - now2) / 1000);
              MG.ui.dom.toast("麥田冷卻中（剩 " + left + " 秒）— 稍後再收穫", "", "icon_sword"); // v546：冷卻回饋 — 原靜默 break 無解釋
              return;
            }
            farmHarvestCd.set(key, now2 + 15000);
            const st = S();
            const gold = farmReward();
            st.currencies.gold += gold;
            farmHarvestFx = { x: wpx, y: wpy, t0: now2 };
            MG.ui.dom.toast("收穫小麥！+ " + MG.util.fmt(gold) + " 金", "gold", "icon_sword");
            return;
          }
        }
        // v296：每日寶箱優先（點箱不誤觸怪物）
        if (chestPos && !chestInfo().opened && Math.abs(chestPos.px - mx) < 18 && Math.abs(chestPos.py - my) < 14) {
          const st = S();
          const mc = st.mapChest || (st.mapChest = { day: "", opened: false });
          mc.opened = true;
          const rw = chestReward();
          st.currencies.gold += rw.gold;
          chestOpenFx = { t0: performance.now() };
          const matName = (MG.config.MATS && MG.config.MATS[rw.mat]) ? MG.config.MATS[rw.mat].name : rw.mat;
          MG.ui.dom.toast("開啟每日寶箱！+ " + MG.util.fmt(rw.gold) + " 金 ・ " + matName + " ×4" + (rw.gems ? " ・ 鑽石 ×" + rw.gems : ""), "gold", "icon_chest");
          return;
        }
        for (const h of wildlifeHits) {
          const key = h.i + ":" + h.j;
          if (wildCooldown.get(key) > now) continue;
          if (Math.abs(h.px - mx) < 16 && Math.abs(h.py - my) < 16) {
            wildCooldown.set(key, now + 60000);
            const st = S();
            const gold = Math.floor(300 * Math.pow(1.35, Math.max(0, (st.kingdom.level || 1) - 1)));
            st.currencies.gold += gold;
            const names = ["史萊姆", "狼", "幽靈", "蜘蛛", "大老鼠", "穴居怪", "火蜥蜴", "岩漿怪", "冰狼", "雪人", "蠍子", "木乃伊", "青蛙", "鬼火", "石像鬼", "風魔像", "小惡魔", "地獄犬", "天使", "星獸"];
            const nm = names[h.i * 2 + h.j] || "魔物";
            MG.ui.dom.toast("收服野生" + nm + "！+ " + MG.util.fmt(gold) + " 金", "gold", "icon_sword");
            return;
          }
        }
      });
      // 名牌層＋地標熱區（v283：熱區在 canvas 之上、名牌之下 — 名牌仍優先可點）
      rebuildLabels();
      for (const hz of hitZones) wrap.appendChild(hz.el);
      for (const lb of labels) wrap.appendChild(lb.el);
      // v291：小地圖導航（右下角 96×60；點擊跳轉；不干擾拖曳）
      mmCanvas = MG.ui.dom.h("canvas", { style: {
        position: "absolute", right: 6, bottom: 6, width: 96, height: 60,
        zIndex: 4, border: "2px solid #000", outline: "1px solid #3a3f66", outlineOffset: -1,
        background: "rgba(10,12,26,.88)", imageRendering: "pixelated", cursor: "pointer",
        touchAction: "none"
      }, on: { pointerdown: e => e.stopPropagation() } });
      mmCanvas.width = 96; mmCanvas.height = 60;
      mmCtx = mmCanvas.getContext("2d");
      mmCanvas.title = "小地圖：白點＝王國・綠點＝已解鎖區・灰點＝鎖定區・金點＝模式入口・閃爍白點＝每日寶箱。點擊跳轉";
      wrap.appendChild(mmCanvas);
      mmCanvas.addEventListener("click", (e) => {
        const r = mmCanvas.getBoundingClientRect();
        const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
        offX = Math.max(0, Math.min(BASE_W - VW, fx * BASE_W - VW / 2));   // v574：邊界取邏輯視窗
        offY = Math.max(0, Math.min(BASE_H - VH, fy * BASE_H - VH / 2));
        clamp();
        placeLabels();
        renderFrame();
      });
      // v300：記住視角 — 上次離開地圖的位置（無則對準村莊）
      if (savedView && (savedView.v || 0) === (S().v || 0)) {
        offX = savedView.x; offY = savedView.y;
      } else {
        offX = Math.max(0, isoX(8.5, 20.5) - VW / 2);
        offY = Math.max(0, isoY(8.5, 20.5) - VH / 2);
      }
      clamp();
      placeLabels();
    },
    onShow() {
      buildBase();
      renderFrame();
      placeLabels();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    },
    onHide() {
      cancelAnimationFrame(rafId); rafId = 0;
      // v300：記住視角（下次開地圖回到原位；save version 防跨存檔錯位）
      savedView = { x: offX, y: offY, v: S().v || 0 };
    }
  };

  screen.open = open;
  MG.ui.screens.register("map", screen);
  return screen;
})();
