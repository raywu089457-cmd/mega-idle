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

  /* ---------- 世界資料：Voronoi 不規則地形（接近現實世界樣貌） ---------- */
  // 各區中心（等角網格座標）＋村莊
  const CENTERS = [
    { c: 10.5, r: 19.5 },  // 0 grass 翠綠草原（村莊東側）
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
  const VILLAGE = { c0: 1, c1: 8, r0: 17, r1: 24 };  // 村莊正方形 8×8（左下）
  const WORLD_R = 24;  // 距中心超過此值 = 海洋

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
        if (n(c, r) > 0.5) { ctx.fillStyle = "#ff9a4d"; ctx.fillRect(x - 7, y - 1, 5, 2); ctx.fillStyle = "#ffd166"; ctx.fillRect(x - 7, y - 1, 2, 2); }
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

  function buildBase() {
    base = document.createElement("canvas");
    base.width = BASE_W; base.height = BASE_H;
    const bctx = base.getContext("2d");
    // 海洋底色
    bctx.fillStyle = "#121a30"; bctx.fillRect(0, 0, BASE_W, BASE_H);
    const saved = ctx; ctx = bctx;
    const st = S();
    const maxReached = st.stats.maxRegionReached || 0;
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
    // 道路：村莊 → 草原 → 森林 …（各區名牌間，沿線性順序連線 tile）
    bctx.save();
    bctx.fillStyle = "#8a6a4a";
    const stops = [[5, 24], [11, 20], [14, 16], [18, 12], [22, 9], [26, 6], [30, 5], [34, 6], [38, 5], [41, 4], [44, 2]];
    for (let i = 0; i < stops.length - 1; i++) {
      const [c0, r0] = stops[i], [c1, r1] = stops[i + 1];
      let c = c0, r = r0;
      while (c !== c1 || r !== r1) {
        const x = isoX(c, r), y = isoY(c, r);
        dia(x, y, 5, 2.5, "rgba(0,0,0,0.18)");
        dia(x, y, 4, 2, "#8a6a4a");
        if (c < c1) c++;
        else if (c > c1) c--;
        if (r > r1) r--;
        else if (r < r1) r++;
      }
    }
    bctx.restore();
    // 村莊建築立牌
    drawVillage(bctx);
    ctx = saved;
  }

  function drawVillage(bctx) {
    const st = S();
    const cc = (VILLAGE.c0 + VILLAGE.c1) / 2, cr = (VILLAGE.r0 + VILLAGE.r1) / 2;
    const cx = isoX(cc, cr), cy = isoY(cc, cr);
    const saved = ctx; ctx = bctx;
    // 石板大廣場（村莊全境，TheoTown 灰階）
    dia(cx, cy, (VILLAGE.c1 - VILLAGE.c0) * TW / 2 + 8, (VILLAGE.r1 - VILLAGE.r0) * TH / 2 + 4, "#5c5c66");
    dia(cx, cy, (VILLAGE.c1 - VILLAGE.c0) * TW / 2 + 2, (VILLAGE.r1 - VILLAGE.r0) * TH / 2 - 1, "#6a6a74");
    // 十字石板路
    bctx.fillStyle = "#7a7a84";
    bctx.fillRect(cx - 4, isoY(cc, VILLAGE.r0) + 4, 8, isoY(cc, VILLAGE.r1) - isoY(cc, VILLAGE.r0) - 8);
    bctx.fillRect(isoX(VILLAGE.c0, cr) + 4, cy - 4, isoX(VILLAGE.c1, cr) - isoX(VILLAGE.c0, cr) - 8, 8);
    bctx.fillStyle = "rgba(0,0,0,0.18)";
    bctx.fillRect(cx - 4, isoY(cc, VILLAGE.r0) + 4, 2, isoY(cc, VILLAGE.r1) - isoY(cc, VILLAGE.r0) - 8);
    bctx.fillRect(isoX(VILLAGE.c0, cr) + 4, cy - 4, isoX(VILLAGE.c1, cr) - isoX(VILLAGE.c0, cr) - 8, 2);
    // 正方形城牆（沿村莊 tile 邊界 + 四角塔樓）
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
    // 中央城堡（b_castle_iso 俯視等角 64×48，scale 1.5）
    const cw = 64 * 1.5, chh = 48 * 1.5;
    MG.ui.render.draw(bctx, "b_castle_iso", cx - cw / 2, cy - chh / 2 + 10, 1, { scale: 1.5, t: 0 });
    // 民房 3 棟（等角小屋，城內南側 + 北側）
    const hw = 20 * 1.3, hh = 16 * 1.3;
    MG.ui.render.draw(bctx, "b_house_iso", cx - 30 - hw / 2, cy + 14 - hh / 2, 1, { scale: 1.3, t: 0 });
    MG.ui.render.draw(bctx, "b_house_iso", cx + 26 - hw / 2, cy + 16 - hh / 2, 1, { scale: 1.3, t: 0 });
    MG.ui.render.draw(bctx, "b_house_iso", cx + 8 - hw / 2, cy - 26 - hh / 2, 1, { scale: 1.3, t: 0 });
    ctx = saved;
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
    // 村莊名牌
    mk("梅根王國 Lv" + st.kingdom.level, isoX(4.5, 20.5), isoY(4.5, 16.5), -1, true, false);
    // 區名牌
    for (let i = 0; i < rs.length; i++) {
      const b = CENTERS[i];
      const cx = isoX(b.c, b.r);
      const cy = isoY(b.c, b.r);
      const locked = i > (st.stats.maxRegionReached || 0);
      const prog = (st.stats.maxStageByRegion && st.stats.maxStageByRegion[i]) || 0;
      mk(locked ? "？？？" : (rs[i].name + "  " + prog + "/10"), cx, cy - 10, i, false, locked);
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
    ctx.drawImage(base, Math.round(offX), Math.round(offY), cw, ch, 0, 0, canvas.width, canvas.height);
  }
  function loop() {
    renderFrame();
    rafId = requestAnimationFrame(loop);
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
      offX = Math.max(0, isoX(4.5, 20.5) - VW / 2);
      offY = Math.max(0, isoY(4.5, 20.5) - VH / 2);
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
