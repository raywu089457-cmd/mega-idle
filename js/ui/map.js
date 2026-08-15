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
  function drawTile(c, r) {
    const kind = tileOf(c, r);
    const x = isoX(c, r), y = isoY(c, r);
    const a = TW / 2, b = TH / 2;
    const n = (c, r) => rr(c, r, kind);
    if (kind === -1) {           // 海洋
      dia(x, y, a, b, "#1a2a4a");
      dia(x, y, a - 4, b - 2, "#1f345c");
      oceanTiles.push({ x, y, s: n(c, r) });   // 動態波紋層
      ctx.fillStyle = "rgba(140,190,255,0.25)";
      if (n(c, r) > 0.75) ctx.fillRect(x + 2 - 8 * n(c, r), y - 1, 6, 2);  // 波紋
      return;
    }
    if (kind === -2) {           // 村莊草地
      dia(x, y, a, b, "#4c8a3f");
      if (n(c, r) > 0.6) { ctx.fillStyle = "#5c9c4a"; ctx.fillRect(x - 6, y - 1, 3, 2); }
      if (n(c, r) < 0.35) { ctx.fillStyle = "#3a7a33"; ctx.fillRect(x + 3, y + 1, 3, 2); }
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
    // 海洋底色
    bctx.fillStyle = "#121a30"; bctx.fillRect(0, 0, BASE_W, BASE_H);
    const saved = ctx; ctx = bctx;
    const st = S();
    const maxReached = st.stats.maxRegionReached || 0;
    oceanTiles = []; lavaTiles = [];
    // 迷霧遮罩：未解鎖區域畫暗色
    for (let r = GH - 1; r >= 0; r--) {
      for (let c = 0; c < GW; c++) {
        drawTile(c, r);
        const kind = tileOf(c, r);
        if (kind >= 0 && kind > maxReached) {
          // 戰爭迷霧：灰暗半透明覆蓋
          const x = isoX(c, r), y = isoY(c, r);
          bctx.save();
          pathD(x, y, TW / 2, TH / 2);
          bctx.fillStyle = "rgba(10,12,26,0.62)";
          bctx.fill();
          bctx.restore();
        }
      }
    }
    // 道路：村莊東門 → 草原 → 森林 …（蜿蜒路徑：每段插中間點＋fbm 垂直偏移）
    const drawRoadSeg = (c0, r0, c1, r1) => {
      let c = c0, r = r0;
      while (Math.abs(c - c1) + Math.abs(r - r1) > 0.01) {
        const x = isoX(c, r), y = isoY(c, r);
        dia(x, y, 5, 2.5, "rgba(0,0,0,0.18)");
        dia(x, y, 4, 2, "#8a6a4a");
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

    // ---------- 街道網（v171：兩縱＋中街＋南街＋南北巷，與道路圖 VEDGES 一致） ----------
    const street = (c0, r0, c1, r1) => {
      const n = Math.round((Math.abs(c1 - c0) + Math.abs(r1 - r0)) * 4);
      for (let i = 0; i <= n; i++) {
        const cc0 = c0 + (c1 - c0) * i / n, rr = r0 + (r1 - r0) * i / n;
        const x = isoX(cc0, rr), y = isoY(cc0, rr);
        dia(x, y, 6, 3, "rgba(0,0,0,0.2)");
        dia(x, y, 5, 2.5, "#7a7a84");
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
      bctx.strokeStyle = "#8a8a9a"; bctx.lineWidth = 5;
      bctx.beginPath();
      bctx.moveTo(isoX(c0, r0), isoY(c0, r0));
      bctx.lineTo(isoX(c1, r1), isoY(c1, r1));
      bctx.stroke();
      bctx.strokeStyle = "#4a4a5a"; bctx.lineWidth = 1.5;
      bctx.stroke();
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
      bctx.fillStyle = "#c84848";
      bctx.fillRect(tx - 6, ty - 8, 12, 4);
      bctx.strokeStyle = "#14121f"; bctx.lineWidth = 1;
      bctx.strokeRect(tx - 5.5, ty - 6.5, 11, 12);
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
    // ---------- v292 生活感：路燈（街道兩側，暖黃燈罩）＋攤位（南廣場集市） ----------
    const lamps = [[3.6, 16.5], [3.6, 24.5], [13.9, 16.5], [13.9, 24.5], [6.4, 21.4], [11.6, 21.4]];
    for (const [lc, lr] of lamps) {
      const lx = isoX(lc, lr), ly = isoY(lc, lr);
      bctx.fillStyle = "#3a3a42"; bctx.fillRect(lx - 1, ly - 8, 2, 8);
      bctx.fillStyle = "#2a2a30"; bctx.fillRect(lx - 3, ly - 11, 6, 4);
      bctx.fillStyle = "#ffd166"; bctx.fillRect(lx - 2, ly - 10, 4, 2);   // 燈罩暖光
    }
    const stalls = [[7.0, 23.0], [9.4, 23.0], [8.2, 24.4]];   // 南廣場 3 攤
    for (const [sc, sr] of stalls) {
      const sx = isoX(sc, sr), sy = isoY(sc, sr);
      bctx.fillStyle = "#4a3520"; bctx.fillRect(sx - 6, sy - 7, 12, 7);   // 攤台
      bctx.fillStyle = "#6a4a2a"; bctx.fillRect(sx - 5, sy - 6, 10, 5);
      bctx.fillStyle = "#8a6a3a"; bctx.fillRect(sx - 4, sy - 5, 3, 3);    // 貨物
      bctx.fillStyle = "#c8402f"; bctx.fillRect(sx + 1, sy - 5, 3, 3);
      bctx.fillStyle = "#4a3520"; bctx.fillRect(sx - 6, sy - 10, 2, 3);   // 遮陽棚柱
      bctx.fillStyle = "#4a3520"; bctx.fillRect(sx + 4, sy - 10, 2, 3);
      bctx.fillStyle = "#c8402f"; bctx.fillRect(sx - 7, sy - 12, 14, 2);  // 棚頂
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
    ctx = saved;
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
  function box(x, y, w, h, c) {
    ctx.fillStyle = c; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#101018"; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }
  function tri(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x, y - h); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#101018"; ctx.lineWidth = 2; ctx.stroke();
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
  function lmShadow(x, y, w) { ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(x - w / 2, y, w, 4); }

  // 0 風車磨坊（草原）：石塔＋紅錐頂＋風車葉片（fx 轉動）；tier 金旗
  function lmWindmill(ax, ay, tier) {
    lmShadow(ax, ay - 2, 26);
    box(ax - 7, ay - 22, 14, 22, "#d8d0c0");
    ctx.fillStyle = "#b8b0a0";
    ctx.fillRect(ax - 7, ay - 18, 14, 2); ctx.fillRect(ax - 7, ay - 10, 14, 2);
    ctx.fillRect(ax - 7, ay - 6, 5, 2); ctx.fillRect(ax + 2, ay - 6, 5, 2);
    box(ax - 3, ay - 6, 6, 6, "#5a4a34");
    ctx.fillStyle = "#7a6a54"; ctx.fillRect(ax - 5, ay - 19, 2, 4); ctx.fillRect(ax + 3, ay - 19, 2, 4);
    tri(ax, ay - 22, 18, 14, tier ? "#b83020" : "#c8402f");
    ctx.fillStyle = "#4a3a2a"; ctx.fillRect(ax - 1, ay - 38, 2, 6);   // 旗杆
  }
  // 1 獵人小屋（森林）：原木牆＋茅草頂＋煙囪（fx 煙）；tier 窗亮燈＋鹿角
  function lmCabin(ax, ay, tier) {
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
  }
  // 2 礦坑口（洞穴）：岩壁拱口＋木支架＋軌道礦車；tier 金礦＋第二台車
  function lmMine(ax, ay, tier) {
    lmShadow(ax, ay - 2, 32);
    ctx.fillStyle = "#2a2a38";
    ctx.fillRect(ax - 13, ay - 12, 26, 12);
    ctx.fillRect(ax - 10, ay - 15, 8, 4); ctx.fillRect(ax + 4, ay - 14, 6, 3);
    ctx.strokeStyle = "#101018"; ctx.lineWidth = 2; ctx.strokeRect(ax - 13, ay - 12, 26, 12);
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
  }
  // 3 火山祭壇（火山）：黑曜石壇＋熔岩渠＋火盆（fx 烈焰）；tier 金邊
  function lmShrine(ax, ay, tier) {
    lmShadow(ax, ay - 2, 30);
    box(ax - 14, ay - 6, 28, 6, "#2a2a3a");
    if (tier) { ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 14, ay - 6, 28, 2); }
    box(ax - 9, ay - 8, 18, 3, "#3a3a4a");
    box(ax - 6, ay - 16, 12, 10, "#26263a");
    ctx.fillStyle = "#ff9a4d"; ctx.fillRect(ax - 2, ay - 13, 4, 4);      // 熔岩符文
    ctx.fillStyle = "#4a1a0a"; ctx.fillRect(ax - 10, ay - 2, 20, 3);     // 熔岩渠
    ctx.fillStyle = "#ff6a2a"; ctx.fillRect(ax - 9, ay - 1, 18, 1);
    box(ax - 4, ay - 20, 8, 4, "#3a3a4a");                              // 火盆
  }
  // 4 冰晶祭壇（冰原）：雪台＋三根水晶（tier 中央加高＋金環）
  function lmIce(ax, ay, tier) {
    lmShadow(ax, ay - 2, 24);
    box(ax - 11, ay - 4, 22, 4, "#d8eef5");
    if (tier) { ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 11, ay - 4, 22, 2); }
    tri(ax, ay - 4, 10, tier ? 24 : 20, "#bfe8ff");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(ax - 1, ay - (tier ? 20 : 16), 2, 8);
    tri(ax - 8, ay - 4, 6, 8, "#9fd8e8");
    tri(ax + 8, ay - 4, 5, 6, "#9fd8e8");
  }
  // 5 綠洲帳篷（荒漠）：水池＋帳棚＋棕櫚（tier 金邊帳棚）
  function lmOasis(ax, ay, tier) {
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
  }
  // 6 巫婆小屋（沼澤）：高腳歪屋＋藥鍋火堆（fx 泡泡＋窗光）；tier 紫光藥水
  function lmWitch(ax, ay, tier) {
    lmShadow(ax, ay - 2, 26);
    ctx.fillStyle = "#3a2a1a"; ctx.fillRect(ax - 10, ay - 3, 3, 8); ctx.fillRect(ax + 7, ay - 3, 3, 8);
    box(ax - 11, ay - 15, 22, 12, "#4a3a2a");
    ctx.fillStyle = "#3a2a1a"; ctx.fillRect(ax - 11, ay - 12, 22, 2); ctx.fillRect(ax - 11, ay - 8, 22, 2);
    ctx.fillStyle = "#5a6a3a";
    ctx.beginPath(); ctx.moveTo(ax - 13, ay - 15); ctx.lineTo(ax - 1, ay - 26); ctx.lineTo(ax + 12, ay - 15); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#101018"; ctx.lineWidth = 2; ctx.stroke();
    box(ax - 9, ay - 9, 5, 9, "#2a1f16");
    ctx.fillStyle = tier ? "#b08aff" : "#1a2a1a"; ctx.fillRect(ax + 3, ay - 12, 5, 5);
    box(ax - 4, ay - 9, 8, 6, "#3a3a3a");                               // 藥鍋
    ctx.fillStyle = tier ? "#b08aff" : "#4a8a3a"; ctx.fillRect(ax - 3, ay - 8, 6, 2);
    ctx.fillStyle = "#ff6a2a"; ctx.fillRect(ax - 3, ay - 5, 6, 2);       // 火堆
  }
  // 7 瞭望塔（蒼穹）：高腳木塔＋十字支撐＋旗杆（fx 旗飄＋tier 燈塔光）
  function lmTower(ax, ay, tier) {
    lmShadow(ax, ay - 2, 22);
    box(ax - 8, ay - 14, 3, 14, "#6a4a2a"); box(ax + 5, ay - 14, 3, 14, "#6a4a2a");
    lmLine(ax - 5, ay - 14, ax + 6, ay - 2, "#4a3220");
    box(ax - 10, ay - 16, 20, 3, "#7a5a3a");
    box(ax - 7, ay - 30, 14, 14, "#8a6a4a");
    ctx.fillStyle = "#5a3a2a"; ctx.fillRect(ax - 7, ay - 27, 14, 2); ctx.fillRect(ax - 7, ay - 22, 14, 2); ctx.fillRect(ax - 7, ay - 17, 14, 2);
    ctx.fillStyle = "#2a1a10"; ctx.fillRect(ax - 4, ay - 26, 2, 6); ctx.fillRect(ax + 2, ay - 26, 2, 6);
    tri(ax, ay - 30, 16, 10, "#5a3a2a");
    ctx.fillStyle = "#6a4a2a"; ctx.fillRect(ax - 1, ay - 42, 2, 6);
  }
  // 8 裂谷哨站（深淵）：懸崖木柵＋燈籠（fx 搖曳）；tier 紅旗＋繩橋
  function lmOutpost(ax, ay, tier) {
    lmShadow(ax, ay - 2, 32);
    ctx.fillStyle = "#1a1020";
    ctx.fillRect(ax - 15, ay - 8, 30, 8);
    ctx.fillRect(ax - 15, ay - 11, 6, 3); ctx.fillRect(ax - 6, ay - 12, 5, 4); ctx.fillRect(ax + 4, ay - 10, 6, 2);
    ctx.strokeStyle = "#101018"; ctx.lineWidth = 2; ctx.strokeRect(ax - 15, ay - 8, 30, 8);
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
  }
  // 9 遺跡拱門（神話）：石拱＋符文＋浮球（fx 脈動）；tier 金球
  function lmRuins(ax, ay, tier) {
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
      LM_DRAW[i](ax, ay, i < maxReached ? 1 : 0);   // 擊敗守關 BOSS 升級
    }
    ctx = saved;
  }

  /* v307：小碼頭（燈塔旁 — 木板伸入海面＋樁柱；漁船停靠點）烘焙進 base */
  function drawDock(bctx) {
    const dx = isoX(45.5, 25.2), dy = isoY(45.5, 25.2);
    // 樁柱
    bctx.fillStyle = "#4a3520";
    bctx.fillRect(dx - 1, dy - 6, 2, 6);
    bctx.fillRect(dx + 5, dy - 6, 2, 6);
    // 木板（伸向海面）
    bctx.fillStyle = "#6a4a2a";
    bctx.fillRect(dx - 8, dy - 4, 18, 4);
    bctx.fillStyle = "#8a6a3a";
    bctx.fillRect(dx - 8, dy - 3, 18, 1);
    bctx.fillStyle = "#5a3a20";
    bctx.fillRect(dx - 8, dy - 1, 18, 1);
    // 纜繩柱
    bctx.fillStyle = "#3a2a1a";
    bctx.fillRect(dx + 6, dy - 8, 2, 4);
  }

  /* v293：海岸燈塔（蒼穹之塔東南角，面向右下海域）— 烘焙進 base */
  function drawLighthouse(bctx) {
    const lx = isoX(44.5, 24.2), ly = isoY(44.5, 24.2);
    // 石基
    bctx.fillStyle = "#5a5a6a"; bctx.fillRect(lx - 6, ly - 3, 12, 3);
    // 塔身（白/紅橫紋）
    for (let i = 0; i < 5; i++) {
      bctx.fillStyle = i % 2 === 0 ? "#e8e8f0" : "#c8402f";
      bctx.fillRect(lx - 4, ly - 4 - i * 5, 8, 5);
    }
    // 燈室（頂部）
    bctx.fillStyle = "#2a2a30"; bctx.fillRect(lx - 5, ly - 30, 10, 3);
    bctx.fillStyle = "#ffd166"; bctx.fillRect(lx - 3, ly - 27, 6, 4);   // 燈窗
    bctx.fillStyle = "#c8402f"; bctx.fillRect(lx - 6, ly - 34, 12, 3);   // 屋頂
    bctx.fillStyle = "#ffd166"; bctx.fillRect(lx - 1, ly - 37, 2, 3);    // 頂燈
  }

  /* ---------- 模式地標（v278 合併移植：worldmap.js 入口 → 等角像素地標）
     繪製於村莊東方草原帶 — 石基＋主題小建築，與區域地標同語彙（box/tri/lmShadow） ---------- */
  function mdRing(ax, ay) {        // 0 競技場：石環鬥場
    lmShadow(ax, ay - 2, 30);
    box(ax - 13, ay - 10, 26, 10, "#9a8a7a");
    box(ax - 9, ay - 7, 18, 6, "#6a5a4a");
    ctx.fillStyle = "#4a3a2a"; ctx.fillRect(ax - 6, ay - 5, 12, 3);
    ctx.fillStyle = "#c8b090"; ctx.fillRect(ax - 2, ay - 12, 4, 3);
  }
  function mdPodium(ax, ay) {      // 1 王者競技場：三層頒獎台＋金冠
    lmShadow(ax, ay - 2, 26);
    box(ax - 12, ay - 5, 24, 5, "#8a8a9a");
    box(ax - 8, ay - 9, 16, 4, "#a8a8b8");
    box(ax - 4, ay - 13, 8, 4, "#c8c8d8");
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 2, ay - 16, 4, 3);
    ctx.fillStyle = "#ff9f43"; ctx.fillRect(ax - 1, ay - 15, 2, 1);
  }
  function mdStele(ax, ay) {       // 2 試煉秘境：符文石碑
    lmShadow(ax, ay - 2, 20);
    box(ax - 5, ay - 18, 10, 18, "#7a7a8a");
    ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 2, ay - 15, 4, 2);
    ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 2, ay - 10, 4, 2);
    ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 2, ay - 5, 4, 2);
    box(ax - 7, ay - 2, 14, 3, "#5a5a6a");
  }
  function mdBone(ax, ay) {        // 3 世界首領：交叉獸骨
    lmShadow(ax, ay - 2, 26);
    ctx.fillStyle = "#d8d0c0";
    ctx.fillRect(ax - 10, ay - 12, 3, 14); ctx.fillRect(ax + 7, ay - 12, 3, 14);
    ctx.fillRect(ax - 12, ay - 8, 24, 3);
    ctx.fillStyle = "#a09080"; ctx.fillRect(ax - 10, ay - 12, 3, 3); ctx.fillRect(ax + 7, ay - 12, 3, 3);
    ctx.fillStyle = "#5a4a3a"; ctx.fillRect(ax - 2, ay - 6, 4, 6);
  }
  function mdSpire(ax, ay) {       // 4 元素試煉塔：高塔＋元素四色
    lmShadow(ax, ay - 2, 18);
    box(ax - 5, ay - 20, 10, 20, "#8a7a9a");
    tri(ax, ay - 26, 10, 8, "#c96a4a");
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 1, ay - 27, 2, 2);
    ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 8, ay - 6, 3, 3);
    ctx.fillStyle = "#ff6a4a"; ctx.fillRect(ax + 5, ay - 6, 3, 3);
    ctx.fillStyle = "#7ee787"; ctx.fillRect(ax - 3, ay - 12, 6, 2);
  }
  function mdHedge(ax, ay) {       // 5 奇境迷宮：綠籬迷宮
    lmShadow(ax, ay - 2, 30);
    box(ax - 13, ay - 12, 26, 12, "#2a5a2a");
    ctx.fillStyle = "#3a7a3a"; ctx.fillRect(ax - 10, ay - 10, 5, 8); ctx.fillRect(ax - 2, ay - 8, 5, 6); ctx.fillRect(ax + 6, ay - 10, 5, 8);
    ctx.fillStyle = "#7ee787"; ctx.fillRect(ax - 9, ay - 11, 3, 2); ctx.fillRect(ax - 1, ay - 9, 3, 2); ctx.fillRect(ax + 7, ay - 11, 3, 2);
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 2, ay - 4, 4, 4);
  }
  function mdHall(ax, ay) {        // 6 公會盛宴：長桌＋旗幟
    lmShadow(ax, ay - 2, 34);
    box(ax - 15, ay - 9, 30, 9, "#6a4a2a");
    box(ax - 13, ay - 7, 26, 5, "#8a6a3a");
    ctx.fillStyle = "#c8a060"; ctx.fillRect(ax - 11, ay - 6, 22, 2);
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 1, ay - 13, 2, 5);
    ctx.fillStyle = "#c8402f"; ctx.fillRect(ax - 3, ay - 15, 6, 4);
  }
  function mdNotice(ax, ay) {      // 7 限時活動：公告板
    lmShadow(ax, ay - 2, 24);
    box(ax - 11, ay - 14, 22, 14, "#6a4a2a");
    box(ax - 9, ay - 12, 18, 10, "#c8b090");
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 6, ay - 10, 12, 2);
    ctx.fillStyle = "#4fc3f7"; ctx.fillRect(ax - 6, ay - 6, 8, 2);
    box(ax - 1, ay - 2, 2, 3, "#3a2a1a");
  }
  function mdStairs(ax, ay) {      // 8 無盡深淵：下沉階梯
    lmShadow(ax, ay - 2, 28);
    box(ax - 13, ay - 3, 26, 3, "#5a5a6a");
    box(ax - 10, ay - 6, 20, 3, "#4a4a58");
    box(ax - 7, ay - 9, 14, 3, "#3a3a48");
    box(ax - 4, ay - 12, 8, 3, "#2a2a38");
    ctx.fillStyle = "#a78bfa"; ctx.fillRect(ax - 1, ay - 16, 2, 4);
  }
  function mdCamp(ax, ay) {        // 9 委託遠征營：帳篷＋營火
    lmShadow(ax, ay - 2, 26);
    tri(ax - 7, ay - 4, 12, 10, "#5a7a9a");
    tri(ax + 7, ay - 4, 12, 10, "#4a6a8a");
    ctx.fillStyle = "#3a4a5a"; ctx.fillRect(ax - 2, ay - 3, 4, 3);
    ctx.fillStyle = "#ff9a4d"; ctx.fillRect(ax - 2, ay - 8, 4, 4);
    ctx.fillStyle = "#ffd166"; ctx.fillRect(ax - 1, ay - 7, 2, 2);
  }
  const MODE_LM = [mdRing, mdPodium, mdStele, mdBone, mdSpire, mdHedge, mdHall, mdNotice, mdStairs, mdCamp];

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
      ctx.strokeStyle = "#101018"; ctx.lineWidth = 1; ctx.strokeRect(ax + 1 + dx, ay - 40, 6, 4);
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
      ctx.strokeStyle = "#101018"; ctx.lineWidth = 1; ctx.strokeRect(ax + 1 + dx, ay - 42, 6, 4);
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
      ctx.strokeStyle = "#101018"; ctx.lineWidth = 1; ctx.strokeRect(lx - 2, ay - 20, 4, 4);
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
    const mkHit = (x, y, fn) => {
      const el = MG.ui.dom.h("div", { class: "map-hit", style: {
        position: "absolute", left: "0px", top: "0px", width: 44, height: 44,
        transform: "translate(-50%,-50%)", zIndex: 2, cursor: "pointer"
      }, on: { click: () => { if (suppressClick) { suppressClick = false; return; } fn(); } } });
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
    // 村莊名牌（北牆外上方）＋本體熱區（城中心）
    mk("梅根王國 Lv" + st.kingdom.level, isoX(8.5, 20.5), isoY(8.5, 13), -1, true, false);
    mkHit(isoX(8.5, 20.5), isoY(8.5, 20.5), () => MG.ui.screens.show("kingdom"));
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
      mk(locked ? "？？？" : (rs[i].name + " " + prog), cx, cy - 52, i, false, locked, undefined, false, locked ? null : ("前往「" + rs[i].name + "」討伐" + (boss ? " · BOSS「" + boss + "」" : "") + "（進度 " + prog + "/10）"));
      // v283：區域地標本體熱區（點地標圖示＝前往討伐；鎖定區也給回饋 toast）
      mkHit(cx, cy, () => clickRegion(i));
    }
    // 模式地標名牌（v278：名稱在地標下方；偶數在上方交錯避重疊；鎖定門檻顯示 🔒）
    for (let i = 0; i < MODES.length; i++) {
      const m = MODES[i];
      const mx = isoX(m.c, m.r), my = isoY(m.c, m.r);
      const locked = m.gate ? !m.gate() : false;
      // v286：狀態 pin — 世界首領剩餘戰數／限時活動剩餘天數（重訪動機一眼可見）
      mk((locked ? "🔒 " : "") + m.name + modeState(i), mx, my + (i % 2 ? 26 : -46), -1, false, locked, i, !!(i % 2));
      mkHit(mx, my, () => clickMode(i));   // v283：模式地標本體熱區
    }
  }

  /* v286：模式狀態 pin（純顯示；系統異常時回空字串） */
  function modeState(i) {
    const m = MODES[i];
    try {
      if (m.id === "worldboss" && MG.sys.worldboss && MG.sys.worldboss.left) {
        const l = MG.sys.worldboss.left();
        return l > 0 ? " · 剩" + l + "戰" : " · 已討伐";
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
    const kx = VW / cw, ky = VH / ch;
    const rects = [];
    for (const lb of labels) {
      const x = (lb.x - offX) * kx;
      const y = (lb.y - offY) * ky;
      lb.el.style.left = x + "px";
      lb.el.style.top = y + "px";
      rects.push({ lb, x, y, w: lb.el.offsetWidth, h: lb.el.offsetHeight });
    }
    // v283：地標熱區跟隨捲動（與名牌同一座標映射）
    for (const hz of hitZones) {
      hz.el.style.left = ((hz.x - offX) * kx) + "px";
      hz.el.style.top = ((hz.y - offY) * ky) + "px";
    }
    // v280：名牌防碰撞 — 依錨點 y 排序掃描，重疊則把後者下推（below 名牌錨點在頂部）
    rects.sort((a, b) => a.y - b.y);
    for (let pass = 0; pass < 8; pass++) {
      let moved = false;
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
      if (!moved) break;
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
    const cw = canvas.clientWidth || VW, ch = canvas.clientHeight || VH;
    const maxX = Math.max(0, BASE_W - cw), maxY = Math.max(0, BASE_H - ch);
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
    const cw = canvas.clientWidth || VW, ch = canvas.clientHeight || VH;
    ctx.fillStyle = "#0d0e1a";
    ctx.fillRect(0, 0, VW, VH);
    // 源區塊 (offX..offX+cw) → 全畫布邏輯 VW×VH（dpr 由 ctx.scale 處理，目標固定邏輯單位）
    ctx.drawImage(base, Math.round(offX), Math.round(offY), cw, ch, 0, 0, VW, VH);
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
    // 視口白框
    const vx = offX * kx, vy = offY * ky;
    const vw = Math.min(mw - vx, (canvas.clientWidth || VW) * kx);
    const vh = Math.min(mh - vy, (canvas.clientHeight || VH) * ky);
    mmCtx.strokeStyle = "rgba(255,255,255,0.85)";
    mmCtx.lineWidth = 1;
    mmCtx.strokeRect(vx + 0.5, vy + 0.5, Math.max(4, vw - 1), Math.max(3, vh - 1));
  }

  let celebPan = null;   // v284：解鎖慶祝自動捲到新區 {x0,y0,x1,y1,t0}
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
        const txc = Math.max(0, Math.min(BASE_W - (canvas.clientWidth || VW), isoX(c.c, c.r) - VW / 2));
        const tyc = Math.max(0, Math.min(BASE_H - (canvas.clientHeight || VH), isoY(c.c, c.r) - VH / 2));
        const st2 = S();
        const rm2 = !!(st2.settings && st2.settings.reducedMotion);
        if (rm2) { offX = txc; offY = tyc; placeLabels(); }
        else celebPan = { x0: offX, y0: offY, x1: txc, y1: tyc, t0: performance.now() };
      }
    }
    lastMaxRegionSeen = mr;
    const cw = canvas.clientWidth || VW, ch = canvas.clientHeight || VH;
    const kx = VW / cw, ky = VH / ch;   // 與 drawImage 相同的座標映射
    const sx = wx => (wx - offX) * kx;
    const sy = wy => (wy - offY) * ky;
    drawUnlockFx(t, sx, sy);
    drawChest(t, sx, sy);   // v296：每日寶箱（rm 定幀呼吸）
    drawFarmHarvestFx(t, sx, sy);   // v298：農田收穫粒子
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
        ctx.fillStyle = "rgba(10,10,20,0.55)";
        ctx.fillRect(px - 12, py - 12, 24, 24);
        MG.ui.render.draw(ctx, "icon_lock", px - 8, py - 8, 1, { scale: 1 });
      }
      if (m.badge && badgeSnap && badgeSnap[m.badge]) {
        ctx.fillStyle = (m.badge === "events" || m.badge === "abyss") ? "#ff5c5c" : "#4fc3f7";
        ctx.fillRect(px + 12, py - 14, 4, 4);
      }
      // v285：模式地標主題動畫（對齊區域地標動態水準；rm 靜止幀）
      MODE_FX[i](t, px, py, rm);
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
    }
    // 2. 漁船：沿右下海域巡航（東→西→東，微擺）
    const f = rm ? 0.5 : ((t / 16000) % 1);
    const dir = Math.floor((t / 16000) % 2);   // 0 去 1 回
    const fx = rm ? 0.5 : (dir === 0 ? f : 1 - f);
    // v307：路線 = 碼頭(45.5,25.2) → 外海(40.5,26.5) 往返
    const bx = isoX(45.5 - fx * 5, 25.2 + fx * 1.3), by = isoY(45.5 - fx * 5, 25.2 + fx * 1.3);
    const bpx = sx(bx), bpy = sy(by);
    if (bpx > -40 && bpx < VW + 40 && bpy > -40 && bpy < VH + 40) {
      const bob = rm ? 0 : Math.sin(t / 420 + fx * 8) * 1.2;   // 船身起伏
      // 船體（木色）＋帆（米白）
      ctx.fillStyle = "#6a4a2a";
      ctx.fillRect(bpx - 6, bpy + bob - 3, 12, 4);
      ctx.fillStyle = "#4a3520";
      ctx.fillRect(bpx - 6, bpy + bob - 1, 12, 1);
      ctx.fillStyle = "#e8e0c8";
      ctx.fillRect(dir === 0 ? bpx - 5 : bpx + 2, bpy + bob - 9, 3, 6);
      ctx.fillStyle = "#c8402f";
      ctx.fillRect(dir === 0 ? bpx - 5 : bpx + 2, bpy + bob - 9, 3, 1);
    }
  }

  /* v285：模式地標主題小動畫 — 每個模式 1 個辨識動態（rm 時畫靜止幀） */
  function fxFlag(t, px, py, rm) {          // 競技場/公會：旗幟飄動
    const sw = rm ? 0 : Math.sin(t / 380 + px) * 1.6;
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(px - 1, py - 22, 2, 3);
    ctx.fillStyle = rm ? "#c8402f" : (0.5 + 0.5 * Math.sin(t / 380 + px) < 0 ? "#c8402f" : "#d8584a");
    ctx.fillRect(px - 1 + Math.round(sw), py - 24, 4, 3);
  }
  function fxCrown(t, px, py, rm) {         // 王者：金冠閃爍
    const a = rm ? 0.9 : 0.55 + 0.45 * Math.sin(t / 300 + px);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(px - 2, py - 19, 5, 2);
    ctx.fillRect(px - 2, py - 21, 2, 2); ctx.fillRect(px + 1, py - 21, 2, 2);
    ctx.globalAlpha = 1;
  }
  function fxRune(t, px, py, rm) {          // 試煉：符文脈動
    const a = rm ? 0.7 : 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t / 260 + px));
    ctx.globalAlpha = a;
    ctx.fillStyle = "#4fc3f7";
    ctx.fillRect(px - 2, py - 18, 4, 2); ctx.fillRect(px - 2, py - 11, 4, 2); ctx.fillRect(px - 2, py - 6, 4, 2);
    ctx.globalAlpha = 1;
  }
  function fxBonePulse(t, px, py, rm) {     // 世界首領：紅點脈動（倒數感）
    const a = rm ? 0.8 : 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t / 220 + px));
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ff5c5c";
    ctx.fillRect(px - 1, py - 10, 3, 3);
    ctx.globalAlpha = 1;
  }
  function fxSpireGlow(t, px, py, rm) {     // 元素塔：塔尖光芒脈動
    const r = rm ? 3 : 3 + Math.round((0.5 + 0.5 * Math.sin(t / 340 + px)) * 2);
    const a = rm ? 0.7 : 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t / 340 + px));
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(px - 1, py - 30 - r, 2, 2);
    ctx.fillRect(px - 1, py - 30 + r, 2, 2);
    ctx.fillRect(px - 1 - r, py - 30, 2, 2);
    ctx.fillRect(px - 1 + r, py - 30, 2, 2);
    ctx.globalAlpha = 1;
  }
  function fxHedgeLight(t, px, py, rm) {    // 迷宮：入口金燈呼吸
    const a = rm ? 0.8 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t / 320 + px));
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(px - 1, py - 6, 3, 3);
    ctx.globalAlpha = 1;
  }
  function fxNoticeFlash(t, px, py, rm) {   // 活動：公告紙張閃爍
    const on = rm ? true : Math.sin(t / 500 + px) > 0;
    if (on) {
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(px - 6, py - 10, 12, 2);
    }
  }
  function fxStairsGlow(t, px, py, rm) {    // 深淵：紫色幽光上浮
    const ph = rm ? 0.5 : ((t / 900 + (px % 7) / 7) % 1);
    ctx.globalAlpha = rm ? 0.4 : 0.65 * (1 - ph);
    ctx.fillStyle = "#a78bfa";
    ctx.fillRect(px - 1, py - 14 - Math.round(ph * 10), 2, 2);
    ctx.globalAlpha = 1;
  }
  function fxCampFire(t, px, py, rm) {      // 遠征：營火跳動
    const h = rm ? 0 : Math.round((0.5 + 0.5 * Math.sin(t / 180 + px)) * 2);
    ctx.fillStyle = "#ff9a4d";
    ctx.fillRect(px - 2, py - 10 - h, 4, 4);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(px - 1, py - 9 - h, 2, 2);
  }
  const MODE_FX = [fxFlag, fxCrown, fxRune, fxBonePulse, fxSpireGlow, fxHedgeLight, fxFlag, fxNoticeFlash, fxStairsGlow, fxCampFire];

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
          MG.ui.dom.h("button", { class: "btn sm", style: { minHeight: 26, padding: "2px 10px", fontSize: 10 }, on: { click: (e) => { zoomLevel = zoomLevel >= 2 ? 1 : (zoomLevel === 1 ? 1.5 : 2); VW = 460 / zoomLevel; VH = 500 / zoomLevel; const dpr2 = Math.min(1.5, window.devicePixelRatio || 1); canvas.width = VW * dpr2; canvas.height = VH * dpr2; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr2, dpr2); clamp(); renderFrame(); placeLabels(); e.currentTarget.textContent = "🔍 " + zoomLevel + "×"; } } }, "🔍 1×"),
          MG.ui.dom.h("button", { class: "btn sm", on: { click: () => MG.ui.screens.show(returnId) } }, "返回"))));
      // v301：探索度顯示（已解鎖區 /10 ＋ 深淵額外）
      const maxR = Math.max(0, (S().stats.maxRegionReached || 0));
      const abyssOn = !!(MG.sys.abyss && MG.sys.abyss.unlocked && MG.sys.abyss.unlocked());
      const exploredTxt = "探索 " + (maxR + 1) + "/10 區" + (abyssOn ? " ＋深淵" : "");
      root.appendChild(MG.ui.dom.h("div", { class: "sub", style: { padding: "0 14px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" } },
        MG.ui.dom.h("span", null, "拖曳捲動探索世界 · 點名前往討伐 · 灰霧＝尚未解鎖"),
        MG.ui.dom.h("span", { style: { color: "var(--gold)", fontWeight: 800, fontSize: 11 } }, exploredTxt)));
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
      // v295：野外遭遇彩蛋 — 點野生怪物給小獎勵（60s 冷卻；拖曳後不觸發）
      wrap.addEventListener("click", (e) => {
        if (suppressClick) { suppressClick = false; return; }
        const r = wrap.getBoundingClientRect();
        const mx = e.clientX - r.left, my = e.clientY - r.top;
        const now = performance.now();
        // v298：農田收穫（點麥田 — 金幣＋粒子；15s 冷卻）
        const now2 = performance.now();
        const fkx = VW / (canvas.clientWidth || VW), fky = VH / (canvas.clientHeight || VH);
        for (const [cx0, cr0] of WHEAT_TILES) {
          const wx = isoX(cx0, cr0), wy = isoY(cx0, cr0);
          const wpx = (wx - offX) * fkx, wpy = (wy - offY) * fky;
          if (Math.abs(wpx - mx) < 14 && Math.abs(wpy - my) < 14) {
            const key = cx0 + ":" + cr0;
            if (farmHarvestCd.get(key) > now2) break;
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
      wrap.appendChild(mmCanvas);
      mmCanvas.addEventListener("click", (e) => {
        const r = mmCanvas.getBoundingClientRect();
        const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
        offX = Math.max(0, Math.min(BASE_W - (canvas.clientWidth || VW), fx * BASE_W - VW / 2));
        offY = Math.max(0, Math.min(BASE_H - (canvas.clientHeight || VH), fy * BASE_H - VH / 2));
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
