/* 放置王國 MEGA IDLE — 世界大地圖 v2（v161 實驗：開放式等角 tile 世界）
   連續地形（10 區域 tile 區塊 + 海洋 + 道路）、完整村莊區（現有建築立牌）、
   戰爭迷霧（未解鎖）、DOM 名牌互動、拖曳捲動。TheoTown 風。 */
"use strict";
MG.ui = MG.ui || {};
MG.ui.map = (function () {
  const REGIONS = () => MG.data.monsters.regions;
  const S = () => MG.game.state;
  const TW = 32, TH = 16;          // 等角 tile 菱形（32×16）
  const GW = 46, GH = 28;          // 等角網格（col,row）
  const VW = 460, VH = 350;        // 視窗 CSS 尺寸
  const BASE_W = (GW + GH) * TW / 2 + TW;   // 離屏整圖
  const BASE_H = (GW + GH) * TH / 2 + TH;
  let canvas, ctx, base = null, rafId = 0, returnId = "kingdom";
  let offX = 0, offY = 0;          // 捲動偏移（視窗左上在 base 座標）
  let drag = null;                 // {x,y,offX,offY,moved}
  let labels = [];                 // DOM 名牌 [{el, cx, cy, region, village}]
  let oceanTiles = [];             // 海洋 tile（動態波紋）[{x, y, s}]
  let lavaTiles = [];              // 火山熔岩縫 tile（脈動亮光）[{x, y, s}]

  // 道路：村莊東門 → 各區名牌（蜿蜒路徑，v167 起點改東門）
  const ROAD_STOPS = [[9.5, 20.5], [13.5, 20], [15.5, 19.5], [14, 16], [18, 12], [22, 9], [26, 6], [30, 5], [34, 6], [38, 5], [41, 4], [44, 2]];

  /* ---------- 世界資料：Voronoi 不規則地形（接近現實世界樣貌） ---------- */
  // 各區中心（等角網格座標）＋村莊
  const CENTERS = [
    { c: 15.5, r: 20 },      // 0 grass 翠綠草原（村莊東側，v167 東移避讓擴大村莊）
    { c: 14, r: 15.5 },    // 1 forest 幽暗森林
    { c: 17.5, r: 11.5 },  // 2 cave 灰燼洞穴
    { c: 21.5, r: 8.5 },   // 3 volcano 烈焰火山
    { c: 25.5, r: 5.5 },   // 4 glacier 冰封高原
    { c: 29.5, r: 4.5 },   // 5 desert 黃沙荒漠
    { c: 33.5, r: 5.5 },   // 6 swamp 詛咒沼澤
    { c: 37.5, r: 4.5 },   // 7 tower 蒼穹之塔
    { c: 41, r: 3.5 },     // 8 abyss 深淵裂谷
    { c: 44, r: 2 }        // 9 mythos 神話之域
  ];
  const VILLAGE = { c0: 0, c1: 13, r0: 14, r1: 27 };  // 村莊 14×14（v167 擴大裝下全部建築）
  const WORLD_R = 24;  // 距中心超過此值 = 海洋

  // 村內道路環線（tile 座標，NPC 走動路徑）：東門→廣場東→南→西南→西門→北→東門（繞城堡一圈）
  const WALK_PATH = [[13, 20.5], [8, 20.5], [8, 23], [5.5, 25.5], [3, 23], [3, 20.5], [1, 20.5], [3, 17.5], [5.5, 15.5], [8, 17.5], [13, 20.5]];

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
    bctx.save();
    bctx.fillStyle = "#8a6a4a";
    const roadPts = roadPoints();
    for (let i = 0; i < roadPts.length - 1; i++) {
      const [c0, r0] = roadPts[i], [c1, r1] = roadPts[i + 1];
      let c = c0, r = r0;
      while (Math.abs(c - c1) + Math.abs(r - r1) > 0.01) {
        const x = isoX(c, r), y = isoY(c, r);
        dia(x, y, 5, 2.5, "rgba(0,0,0,0.18)");
        dia(x, y, 4, 2, "#8a6a4a");
        c += (c1 - c) * 0.35; r += (r1 - r) * 0.35;
        if (Math.abs(c1 - c) < 0.2) c = c1;
        if (Math.abs(r1 - r) < 0.2) r = r1;
      }
    }
    bctx.restore();
    // 村莊建築立牌
    drawVillage(bctx);
    // 區域地標（已解鎖區的主題聚落地標；鎖定區迷霧內不繪製）
    drawLandmarks(bctx);
    ctx = saved;
  }

  function drawVillage(bctx) {
    const st = S();
    const cc = (VILLAGE.c0 + VILLAGE.c1) / 2, cr = (VILLAGE.r0 + VILLAGE.r1) / 2;
    const cx = isoX(cc, cr), cy = isoY(cc, cr);
    const saved = ctx; ctx = bctx;

    // ---------- 村莊地面：外圈草地 → 內層灰階廣場 ----------
    // 石板大廣場（中央，TheoTown 灰階）
    dia(cx, cy, (VILLAGE.c1 - VILLAGE.c0) * TW / 2 + 8, (VILLAGE.r1 - VILLAGE.r0) * TH / 2 + 4, "#5c5c66");
    dia(cx, cy, (VILLAGE.c1 - VILLAGE.c0) * TW / 2 + 2, (VILLAGE.r1 - VILLAGE.r0) * TH / 2 - 1, "#6a6a74");

    // ---------- 道路網：南北主街 c=4.5、東西主街 r=20.5，石板鋪面 ----------
    bctx.fillStyle = "#7a7a84";
    // 南北主街（c 固定 4.5，r 15→26）
    const northY = isoY(cc, VILLAGE.r0) + 4, southY = isoY(cc, VILLAGE.r1) - 4;
    bctx.fillRect(cx - 6, northY, 12, southY - northY);
    // 東西主街（r 固定 20.5，c 0→9）
    const westX = isoX(VILLAGE.c0, cr) + 4, eastX = isoX(VILLAGE.c1, cr) - 4;
    bctx.fillRect(westX, cy - 6, eastX - westX, 12);
    bctx.fillStyle = "rgba(0,0,0,0.18)";
    bctx.fillRect(cx - 6, northY, 2, southY - northY);
    bctx.fillRect(westX, cy - 6, eastX - westX, 2);

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
      [cc, VILLAGE.r0, "N"], [cc, VILLAGE.r1, "S"], [VILLAGE.c0, cr, "W"], [VILLAGE.c1, cr, "E"]
    ];
    for (const [gc, gr, dir] of gates) {
      const gx = isoX(gc, gr), gy = isoY(gc, gr);
      bctx.fillStyle = "#6a6a74"; bctx.fillRect(gx - 8, gy - 8, 16, 16);
      bctx.strokeStyle = "#3a3a42"; bctx.lineWidth = 2; bctx.strokeRect(gx - 8, gy - 8, 16, 16);
      bctx.fillStyle = "#4a3520"; bctx.fillRect(gx - 3, gy - 3, 6, 6);
      bctx.fillStyle = "#ffd166"; bctx.fillRect(gx - 1, gy - 1, 2, 2);
    }

    // ---------- 中央城堡（b_castle_iso 俯視等角 64×48，scale 1.2） ----------
    const cw = 64 * 1.2, chh = 48 * 1.2;
    MG.ui.render.draw(bctx, "b_castle_iso", cx - cw / 2, cy - chh / 2 + 10, 1, { scale: 1.2, t: 0 });

    // ---------- 建築（依已建等級，沿主街兩側排開；落地陰影） ----------
    const blds = [
      { spr: "b_library_iso", c: 1.5, r: 16.5, key: "library" },
      { spr: "b_altar_iso", c: 4.5, r: 16, key: "altar" },
      { spr: "b_guild_iso", c: 7.5, r: 16.5, key: "guild" },
      { spr: "b_market_iso", c: 8.5, r: 20, key: "market" },
      { spr: "b_training_iso", c: 8, r: 23.5, key: "training" },
      { spr: "b_gemworks_iso", c: 1.5, r: 23.5, key: "gemworks" },
      { spr: "b_warehouse_iso", c: 4.5, r: 24.5, key: "warehouse" },
      { spr: "b_alchemy_iso", c: 7.5, r: 24, key: "alchemy" },
      { spr: "b_forge_iso", c: 1, r: 20, key: "forge" }
    ];
    for (const b of blds) {
      const lvl = st.buildings[b.key] || 0;
      if (lvl <= 0) continue;
      const bx = isoX(b.c, b.r), by = isoY(b.c, b.r);
      dia(bx, by + 12, 17, 4, "rgba(0,0,0,0.28)");  // 落地陰影
      MG.ui.render.draw(bctx, b.spr, bx - 16, by - 16, 1, { scale: 1, t: 0 });
    }

    // ---------- 民房 3 棟（等角小屋，城內西南角住宅區） ----------
    const hw = 20 * 1.3, hh = 16 * 1.3;
    const houses = [[0.8, 25.5], [1.8, 26.2], [2.8, 25.6]];
    for (const [hc, hr] of houses) {
      MG.ui.render.draw(bctx, "b_house_iso", isoX(hc, hr) - hw / 2, isoY(hc, hr) - hh / 2, 1, { scale: 1.3, t: 0 });
    }

    // ---------- 道路旁像素樹（12 棵，沿街與角落） ----------
    const trees = [[2, 18.5], [11, 18], [2, 22], [11.5, 22], [6, 15], [6.5, 26], [0.5, 18], [13, 17.5], [13.5, 23.5], [0.5, 22.8], [10, 15.5], [10, 25.5]];
    for (const [tc, tr] of trees) {
      const tx = isoX(tc, tr), ty = isoY(tc, tr);
      bctx.fillStyle = "#3a2a1a"; bctx.fillRect(tx - 1, ty - 6, 2, 6);
      bctx.fillStyle = "#35502c"; bctx.fillRect(tx - 5, ty - 10, 10, 5);
      bctx.fillStyle = "#4c8a3f"; bctx.fillRect(tx - 3, ty - 13, 6, 5);
    }
    // 廣場水井（主街旁）
    {
      const wx = isoX(5, 22), wy = isoY(5, 22);
      bctx.fillStyle = "#6a6a74"; bctx.fillRect(wx - 4, wy - 4, 8, 8);
      bctx.strokeStyle = "#3a3a42"; bctx.lineWidth = 2; bctx.strokeRect(wx - 4, wy - 4, 8, 8);
      bctx.fillStyle = "#2a4a6a"; bctx.fillRect(wx - 2, wy - 2, 4, 4);
    }
    ctx = saved;
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

  /* 每個地標旁 2 隻在地魔物沿小橢圓遊蕩（翻轉看行進方向、走路動畫）；
     reducedMotion 時 t=0 定幀（與地標動態一致） */
  function drawWildlife(t, sx, sy) {
    const st = S();
    const rm = !!(st.settings && st.settings.reducedMotion);
    const maxReached = st.stats.maxRegionReached || 0;
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
      }
    }
  }

  /* ---------- 名牌 DOM ---------- */
  function rebuildLabels() {
    const st = S();
    const rs = REGIONS();
    labels = [];
    const mk = (txt, x, y, region, village, locked) => {
      const el = MG.ui.dom.h("div", { class: "map-label" + (locked ? " locked" : ""), style: {
        position: "absolute", transform: "translate(-50%,-100%)", textAlign: "center",
        left: "0px", top: "0px", pointerEvents: "auto", cursor: locked ? "default" : "pointer",
        background: locked ? "rgba(10,12,26,.8)" : "rgba(20,22,36,.9)",
        border: "2px solid " + (locked ? "#3a3f66" : "#000"),
        outline: locked ? "none" : "1px solid #3a3f66",
        padding: "3px 8px", fontSize: 12, fontWeight: 900, whiteSpace: "nowrap",
        color: locked ? "#6b7199" : (region === st.hunt.region && !village ? "#ffd166" : "#e8eaf6"),
        boxShadow: "0 3px 0 rgba(0,0,0,.45)", zIndex: 3
      }, on: { click: () => {
        if (drag && drag.moved) return;  // 拖曳後不觸發點擊
        if (locked) return;
        if (village) { MG.ui.screens.show("kingdom"); return; }
        clickRegion(region);
      } } }, txt);
      labels.push({ el, x, y, region: locked ? -1 : region, village, locked });
      return el;
    };
    // 村莊名牌（北牆外上方）
    mk("梅根王國 Lv" + st.kingdom.level, isoX(6.5, 20.5), isoY(6.5, 13), -1, true, false);
    // 區名牌
    for (let i = 0; i < rs.length; i++) {
      const b = CENTERS[i];
      const cx = isoX(b.c, b.r);
      const cy = isoY(b.c, b.r);
      const locked = i > (st.stats.maxRegionReached || 0);
      const prog = (st.stats.maxStageByRegion && st.stats.maxStageByRegion[i]) || 0;
      mk(locked ? "？？？" : (rs[i].name + "  " + prog + "/10"), cx, cy - 52, i, false, locked);
    }
  }

  function placeLabels() {
    for (const lb of labels) {
      lb.el.style.left = (lb.x - offX) * (VW / canvas.clientWidth) + "px";
      lb.el.style.top = (lb.y - offY) * (VH / canvas.clientHeight) + "px";
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
    if (idx !== st.hunt.region) {
      st.hunt.region = idx; st.hunt.stage = Math.min(st.hunt.stage, 10);
      st.hunt.wipeStreak = 0;
      MG.sys.battle.reset();
    }
    MG.ui.screens.show("hunt");
  }

  /* ---------- 捲動 ---------- */
  function clamp() {
    const cw = canvas.clientWidth || VW, ch = canvas.clientHeight || VH;
    const maxX = Math.max(0, BASE_W - cw), maxY = Math.max(0, BASE_H - ch);
    offX = Math.max(0, Math.min(maxX, offX));
    offY = Math.max(0, Math.min(maxY, offY));
  }
  function onDown(e) {
    drag = { x: e.clientX, y: e.clientY, offX, offY, moved: false };
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
  function onUp() { drag = null; }

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
  function loop() {
    renderFrame();
    rafId = requestAnimationFrame(loop);
  }

  /* ---------- 動態層（TheoTown 風活地圖；reducedMotion 時馬車定點佇立、其餘靜止） ---------- */
  function drawFx(t) {
    const st = S();
    const rm = !!(st.settings && st.settings.reducedMotion);
    const cw = canvas.clientWidth || VW, ch = canvas.clientHeight || VH;
    const kx = VW / cw, ky = VH / ch;   // 與 drawImage 相同的座標映射
    const sx = wx => (wx - offX) * kx;
    const sy = wy => (wy - offY) * ky;
    if (rm) { drawCart(0, Math.min((st.stats.maxRegionReached || 0) + 1, ROAD_STOPS.length - 1), sx, sy); drawLmFx(0, sx, sy); drawWildlife(0, sx, sy); return; }
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
      const fx = isoX(1, 20), fy = isoY(1, 20);
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
    // 6. 區域地標動態：風車葉片/旗幟/火焰/泡泡/浮球/燈塔
    drawLmFx(t, sx, sy);
    // 7. 區域野生怪物：在地魔物地標旁遊蕩
    drawWildlife(t, sx, sy);
    // 8. NPC 走動：英雄＋路人在村內道路環線漫步
    drawWalkers(t, rm, sx, sy);
  }

  /* 村內走動角色：已招募英雄（職業 sprite）＋村民路人，沿 WALK_PATH 折線循環
     reducedMotion 時定點佇立（幀 0、位置固定） */
  function drawWalkers(t, rm, sx, sy) {
    const st = S();
    const hunts = (st.hunters || []).filter(h => h).slice(0, 3);
    const heroSprites = hunts.length ? hunts.map(h => "h_" + h.cls) : ["h_sword", "h_archer", "h_mage"];
    const walkers = heroSprites.map((spr, i) => ({ spr, off: i * 0.27, scale: 1.2 }));
    walkers.push({ spr: "h_villager_1", off: 0.61, scale: 1.15 });
    walkers.push({ spr: "h_villager_2", off: 0.88, scale: 1.15 });
    // WALK_PATH 折線段
    const segs = []; let total = 0;
    for (let i = 0; i < WALK_PATH.length - 1; i++) {
      const [c0, r0] = WALK_PATH[i], [c1, r1] = WALK_PATH[i + 1];
      const dx = isoX(c1, r1) - isoX(c0, r0), dy = isoY(c1, r1) - isoY(c0, r0);
      const len = Math.hypot(dx, dy);
      segs.push({ dx, dy, len, c0, r0 }); total += len;
    }
    if (!total) return;
    const dur = 16000;   // 一圈 16 秒
    for (const w of walkers) {
      const phase = (t + w.off * dur) % dur;
      let d = phase / dur * total;
      let acc = 0, si = 0;
      for (let i = 0; i < segs.length; i++) { if (d <= acc + segs[i].len) { si = i; break; } acc += segs[i].len; }
      const s = segs[si], f = (s.len ? (d - acc) / s.len : 0);
      const x = isoX(s.c0, s.r0) + s.dx * f;
      const y = isoY(s.c0, s.r0) + s.dy * f;
      if (x < offX - 30 || x > offX + VW + 30 || y < offY - 30 || y > offY + VH + 30) continue;
      const px = sx(x), py = sy(y);
      // 落地陰影
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(px - 3, py + 2, 6, 2);
      const sp = MG.data.sprites.get(w.spr);
      const wp = (sp ? sp.w : 16) * w.scale, hp = (sp ? sp.h : 16) * w.scale;
      const fr = rm ? 0 : (Math.floor(t / 280) % 2);   // idle/bob 走路兩幀
      MG.ui.render.draw(ctx, w.spr, px - wp / 2, py - hp + 2, 1, { scale: w.scale, frame: fr, flip: s.dx < 0 });
    }
  }

  /* 馬車：沿蜿蜒道路（村莊東門 → 最遠解鎖區）往返（ping-pong），畫小貨車 */
  function drawCart(t, maxU, sx, sy) {
    const rp = roadPoints(maxU);   // 蜿蜒點列
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
        MG.ui.dom.h("button", { class: "btn sm", on: { click: () => MG.ui.screens.show(returnId) } }, "返回")));
      root.appendChild(MG.ui.dom.h("div", { class: "sub", style: { padding: "0 14px 6px" } },
        "拖曳捲動探索世界 · 點名前往討伐 · 灰霧＝尚未解鎖"));
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
      // 名牌層
      rebuildLabels();
      for (const lb of labels) wrap.appendChild(lb.el);
      // 初始視角：對準村莊
      offX = Math.max(0, isoX(6.5, 20.5) - VW / 2);
      offY = Math.max(0, isoY(6.5, 20.5) - VH / 2);
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
    onHide() { cancelAnimationFrame(rafId); rafId = 0; }
  };

  screen.open = open;
  MG.ui.screens.register("map", screen);
  return screen;
})();
