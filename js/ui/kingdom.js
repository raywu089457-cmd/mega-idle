/* 放置王國 MEGA IDLE — kingdom screen: town scene + building cards (slice B4 owns)
 *
 * Town juice (tier glow): drawTown 的底景由 Main 的 MG.ui.render.drawTown 繪製；
 * B4 在後另疊一層透明 fxCanvas，依同一 layout() 座標於 lvl>=5 的建築上覆繪
 * 「銀階/金階」飾邊光點、飄升火花與金階光暈，並以 screen.raf 隨時間閃爍。
 * 不更動 render.js，也不改底景快取。
 */
"use strict";
MG.ui = MG.ui || {};
MG.ui.kingdom = (function () {
  const D = MG.data.buildings;
  const S = () => MG.game.state;
  const B = MG.sys.buildings;
  let canvas, ctx, fxCanvas, fxCtx, root, cardsEl, hintEl, townCanvas, overlayCells = [];
  let resSpans = {}; // v137 資源總覽數字 span（key: gold/gems/ticket/honor/book）
  const cardEls = {}; // id -> card DOM (for upgrade flash)
  let burst = null;   // { t0, x, y } 升級瞬間的金環爆點
  let castleUp = null; // v207：王國升級儀式 { t0, lv } — 王城金環＋金粒子＋banner（合併版移植）
  let castleBanner = null; // v271 D3：banner 狀態暫存 { lv, ba }

  /* v207 王國升級里程碑儀式（成長主軸 — AFK Arena 城堡升級慶祝；reduced-motion 跳過）
     v207FIX：pending 旗標 — 升級發生在非王國畫面時，回王國 5 秒內仍播完整儀式 */
  function showCastleLevelUp(lv) {
    if (S().settings && S().settings.reducedMotion) return;
    castleUp = { t0: performance.now() / 1000, lv, pending: true };
  }
  const ORDER = ["castle", "guild", "training", "forge", "gemworks", "alchemy", "library", "warehouse", "altar", "market"];
  const CELLS = [ // v247 A1 村莊置中：5 cols × 2 rows（x, y on 480×200 canvas, ground at y=166）
    // 縮小置中（scale 2.4→2.0、footprint 60..420 水平置中 240）— 外圍空出環狀地形帶
    [60, 58], [134, 58], [208, 58], [282, 58], [356, 58],
    [70, 116], [144, 116], [218, 116], [292, 116], [366, 116]
  ];
  const TIER_NAME = { 1: "銀階", 2: "金階" };
  const TINT = {
    1: { dot: "#ffe08a", halo: "rgba(255,224,138,0.13)", edge: "rgba(255,224,138,0.85)" },
    2: { dot: "#ffd166", halo: "rgba(255,205,120,0.26)", edge: "rgba(255,209,102,0.95)" }
  };
  function tierSprite(id, lvl) {
    // b_<id>_t1 (lvl<5) / _t2 (5-9) / _t3 (10+)，由 art/buildings.js 的衍生變體提供
    return "b_" + id + "_t" + (B.buildingTier(lvl) + 1);
  }
  function layout() {
    const st = S();
    return ORDER.map((id, i) => {
      const lv = st.buildings[id] || 0;
      const [x, y] = CELLS[i];
      return { id, lvl: lv, x, y, scale: lv > 0 ? 2.0 : 1.6, locked: lv === 0, sprite: tierSprite(id, lv), name: D[id].name }; // v247：建成 2.4→2.0（置中收斂）
    });
  }
  function drawTown() {
    // v207FIX：pending 升級儀式 — 回王國 5 秒內重設 t0 播完整慶祝（升級常發生在戰鬥畫面）
    if (castleUp && castleUp.pending) {
      if (performance.now() / 1000 - castleUp.t0 < 5) castleUp.t0 = performance.now() / 1000;
      castleUp.pending = false;
    }
    MG.ui.render.drawTown(ctx, {
      h: 200, t: Date.now() / 1000,
      buildings: townView()
    });
  }
  // 供副本分頁在「回城休息/待機」時重用同一城鎮場景（480×270 畫布用）
  function townView() {
    // v242FIX：far 旗標（ORDER 前 5 格 = 遠排）— drawTown 霧罩/標籤降調兩畫布一致（原 b.y<100 對 270 畫布失效）
    return layout().map((b, i) => ({ ...b, far: i < 5, y: b.y - (b.scale - 1.6) * 16 }));
  }
  /* ---- tier glow overlay（B4 畫布飾邊，底景不動） ---- */
  function drawTierFx(t) {
    if (!fxCtx) return;
    fxCtx.clearRect(0, 0, 480, 200);
    const rm = !!S().settings.reducedMotion;
    for (const b of layout()) {
      if (b.locked || b.lvl < 5) continue;
      const tier = B.buildingTier(b.lvl);
      const T = TINT[tier];
      const scale = b.scale, w = 32 * scale, h = w;
      const x = b.x, y = b.y - (scale - 1.6) * 16;
      // 金階：建築後方一輪柔和光暈
      if (tier === 2) {
        const g = fxCtx.createRadialGradient(x + w / 2, y + h * 0.3, 4, x + w / 2, y + h * 0.3, w * 0.95);
        g.addColorStop(0, T.halo);
        g.addColorStop(1, "rgba(255,209,102,0)");
        fxCtx.fillStyle = g;
        fxCtx.fillRect(x - 10, y - 16, w + 20, w + 20);
      }
      // 屋脊飾邊光點：5 顆沿屋簷閃爍（reducedMotion 時恆亮）
      const n = 5, tw = t * 2.4;
      for (let i = 0; i < n; i++) {
        const dx = w * (i + 0.5) / n;
        fxCtx.globalAlpha = rm ? 0.8 : 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(tw + i * 1.7));
        fxCtx.fillStyle = T.dot;
        fxCtx.fillRect(x + dx - 1, y + 2, 2, 2);
      }
      // 階級光點於屋頂中央綻放（T2 更亮更大）
      fxCtx.globalAlpha = rm ? 0.9 : 0.6 + 0.4 * Math.sin(tw * 1.3);
      fxCtx.fillStyle = T.edge;
      fxCtx.fillRect(x + w / 2 - 1, y - 2, 3, 3);
      // 飄升火花
      if (!rm) {
        const sp = tier === 2 ? 4 : 2;
        for (let i = 0; i < sp; i++) {
          const ph = (t * 0.45 + i / sp) % 1;
          const sx = x + w * (0.18 + 0.64 * ((i * 53 + 7) % 100) / 100);
          const sy = y - 4 - ph * 15;
          fxCtx.globalAlpha = (1 - ph) * 0.9;
          fxCtx.fillStyle = T.edge;
          fxCtx.fillRect(sx, sy, 2, 2);
        }
      }
      fxCtx.globalAlpha = 1;
    }
    // 升級瞬間：金環爆點
    if (burst) {
      const dt = (t - burst.t0) / 0.7;
      if (dt >= 1) { burst = null; }
      else {
        const r = 8 + dt * 32;
        fxCtx.globalAlpha = (1 - dt) * 0.9;
        fxCtx.strokeStyle = "#ffd166";
        fxCtx.lineWidth = 2;
        fxCtx.beginPath(); fxCtx.arc(burst.x, burst.y, r, 0, 7); fxCtx.stroke();
        fxCtx.globalAlpha = (1 - dt) * 0.75;
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * Math.PI * 2;
          const d = 10 + dt * 28;
          fxCtx.fillStyle = i % 2 ? "#ffe08a" : "#ffd166";
          fxCtx.fillRect(burst.x + Math.cos(a) * d - 1, burst.y + Math.sin(a) * d - 1, 2, 2);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v207 王國升級儀式：王城金環＋金粒子四散＋「王國 Lv X 達成」banner（2.2s）
    if (castleUp && !rm) {
      const dt = (t - castleUp.t0) / 2.2;
      if (dt >= 1) { castleUp = null; }
      else {
        const castle = layout().find(o => o.id === "castle");
        if (castle && castle.lvl > 0) {
          const cx = castle.x + 8 * castle.scale;
          const cy = castle.y + 8 * castle.scale;
          // 金環（0.7s 擴張）
          if (dt < 0.7) {
            const p = dt / 0.7;
            const r = 10 + p * 44;
            fxCtx.globalAlpha = (1 - p) * 0.85;
            fxCtx.strokeStyle = "#ffd166";
            fxCtx.lineWidth = 2;
            fxCtx.beginPath(); fxCtx.arc(cx, cy, r, 0, 7); fxCtx.stroke();
            fxCtx.globalAlpha = 1;
          }
          // 金粒子四散（1.6s）
          if (dt < 1.6) {
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2 + castleUp.t0 * 1.3;
              const d = 14 + dt * 40;
              fxCtx.globalAlpha = (1 - dt / 1.6) * 0.9;
              fxCtx.fillStyle = i % 2 ? "#ffe08a" : "#ffd166";
              fxCtx.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), 2, 2);
            }
            fxCtx.globalAlpha = 1;
          }
        }
        // banner 狀態暫存（固定於畫布頂部）
        castleBanner = { lv: castleUp.lv, ba: Math.max(0, Math.min(1, dt < 0.12 ? dt / 0.12 : dt > 0.88 ? (1 - dt) / 0.12 : 1)) };
      }
    }
    // v207：王國升級 banner 固定於畫布頂部
    if (castleBanner) {
      fxCtx.globalAlpha = castleBanner.ba * 0.95;
      fxCtx.font = "bold 13px monospace";
      fxCtx.textAlign = "center";
      fxCtx.lineWidth = 3;
      fxCtx.strokeStyle = "rgba(8,10,22,0.9)";
      fxCtx.strokeText("王國 Lv " + castleBanner.lv + " 達成！", 240, 24);
      fxCtx.fillStyle = "#ffd166";
      fxCtx.fillText("王國 Lv " + castleBanner.lv + " 達成！", 240, 24);
      fxCtx.globalAlpha = 1;
      castleBanner = null;
    }
  }
  /* ---- town life（B4 疊層：村民散步、火把閃爍、雲影漂移） ---- */
  const VL_SCALE = 1.4;
  const VILLAGERS = [
    { s: "h_villager_1", y: 179, spd: 11, dir: 1, x0: 16, ph: 0 },
    { s: "h_villager_2", y: 182, spd: 8, dir: -1, x0: 448, ph: 0.4 },
    { s: "h_villager_1", y: 180, spd: 14, dir: 1, x0: 236, ph: 0.8 }
  ];
  const CLOUDS = [
    { y: 14, spd: 5, w: 6, x0: 60 },
    { y: 27, spd: 8, w: 4, x0: 210 },
    { y: 40, spd: 6, w: 5, x0: 380 }
  ];
  function drawTownLife(t) {
    if (!fxCtx) return;
    const rm = !!S().settings.reducedMotion;
    // 雲影：細長雲絲在夜空緩慢右飄（reducedMotion 時靜止）
    fxCtx.fillStyle = "rgba(139,144,181,0.5)";
    for (let i = 0; i < CLOUDS.length; i++) {
      const c = CLOUDS[i];
      const x = rm ? c.x0 : ((c.x0 + t * c.spd) % 500) - 10;
      for (let k = 0; k < c.w; k++) {
        fxCtx.fillRect(x + k, c.y, 1, 1);
        if (k > 0 && k < c.w - 1) fxCtx.fillRect(x + k, c.y + 1, 1, 1);
      }
    }
    // 火把：王城與酒館門前的橘紅火光（reducedMotion 時恆亮）
    const st = S();
    const torches = [];
    if ((st.buildings.castle || 0) > 0) torches.push(54);
    if ((st.buildings.guild || 0) > 0) torches.push(150);
    for (const tx of torches) {
      const a = rm ? 0.8 : Math.max(0.35, Math.min(1, 0.55 + 0.3 * Math.sin(t * 13 + tx) + 0.15 * Math.sin(t * 29 + tx * 2)));
      fxCtx.globalAlpha = a;
      fxCtx.fillStyle = "#ff7a2a";
      fxCtx.fillRect(tx - 1, 117, 2, 2);
      fxCtx.fillStyle = "#ffd166";
      fxCtx.fillRect(tx, 117, 1, 1);
    }
    fxCtx.globalAlpha = 1;
    // v327：王城旗幟飄動（城堡塔頂 — 金色三角旗；rm 定幀）
    if ((st.buildings.castle || 0) > 0) {
      const cx0 = CELLS[0][0], cy0 = CELLS[0][1] - 24;
      if (rm) {
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(cx0 - 1, cy0 - 4, 2, 4);
        fxCtx.fillRect(cx0 - 1, cy0 - 4, 4, 2);
      } else {
        const sway = Math.sin(t * 3.4) * 2;
        fxCtx.fillStyle = "#8a6a2a";
        fxCtx.fillRect(cx0 - 1, cy0 - 4, 2, 4);
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(cx0 - 1 + Math.round(sway), cy0 - 4, 5 + Math.round(sway * 0.5), 2);
        fxCtx.fillRect(cx0 - 1 + Math.round(sway), cy0 - 2, 3, 1);
      }
    }
    // v326：花圃蝴蝶（城堡南側 — 兩隻蝴蝶繞花圃飛舞；rm 定幀停在花上）
    const btfy = [[88, 160, 1.3], [120, 172, 0.9]];
    for (let i = 0; i < btfy.length; i++) {
      const bf = btfy[i];
      if (rm) {
        fxCtx.fillStyle = "#ff9ac8";
        fxCtx.fillRect(bf[0], bf[1], 3, 2);
        continue;
      }
      const ph = (t / 4 + i * 1.7) % 1;
      const bx = bf[0] + Math.sin(ph * 6.28) * 14;
      const by = bf[1] + Math.cos(ph * 9) * 6 - 6;
      const flap = Math.floor(t / 120 + i) % 2;
      fxCtx.fillStyle = "#ff9ac8";
      if (flap) { fxCtx.fillRect(bx, by - 2, 2, 2); fxCtx.fillRect(bx + 2, by - 2, 2, 2); }
      else { fxCtx.fillRect(bx, by - 1, 3, 2); fxCtx.fillRect(bx + 1, by - 2, 1, 1); }
    }
    // v320：煙囪煙（鐵匠鋪/煉金坊 — 灰白煙縷上升消散；rm 定幀）
    const chimneys = [];
    if ((st.buildings.forge || 0) > 0) chimneys.push({ x: 92, y: 62, ph: 0.7 });
    if ((st.buildings.alchemy || 0) > 0) chimneys.push({ x: 236, y: 58, ph: 2.1 });
    for (const ch of chimneys) {
      if (rm) {
        fxCtx.fillStyle = "rgba(170,170,180,0.4)";
        fxCtx.fillRect(ch.x, ch.y - 4, 3, 3);
        continue;
      }
      for (let k = 0; k < 3; k++) {
        const ph = ((t / 5 + ch.ph + k / 3) % 1);
        const sx2 = ch.x + Math.sin(ph * 6.28 + ch.ph) * 3;
        const sy2 = ch.y - ph * 14 - k * 2;
        fxCtx.fillStyle = "rgba(170,170,180," + (0.5 * (1 - ph)).toFixed(3) + ")";
        fxCtx.fillRect(sx2 - 1, sy2 - 1, 3, 3);
      }
    }
    // 村民：在建築前方往返漫步（reducedMotion 時定點佇立）
    for (let i = 0; i < VILLAGERS.length; i++) {
      const v = VILLAGERS[i];
      const range = 480 - 20;
      let x, flip;
      if (rm) { x = v.x0; flip = v.dir < 0; }
      else {
        const span = range * 2;
        let p = (v.x0 + t * v.spd * v.dir) % span;
        if (p < 0) p += span;
        if (p < range) { x = 10 + p; flip = v.dir > 0; }
        else { x = 10 + (span - p); flip = v.dir < 0; }
      }
      const frame = rm ? 0 : Math.floor(t * 3.2 + v.ph) % 2;
      MG.ui.render.draw(fxCtx, v.s, x, v.y, 1, { scale: VL_SCALE, frame, flip });
    }
    // 流浪英雄：依目標在建築區走動（對話泡泡只顯示在下方卡片，避免遮擋）
    const ws = (st.wanderers || []).filter(w => !w.dead);
    for (const w of ws) {
      const wy = w.y !== undefined ? w.y : 158;
      const flip = (w.lastDir || 1) < 0;
      MG.ui.render.draw(fxCtx, MG.sys.wanderers.spriteOf(w), w.x - 11, wy, 1, { scale: 1.4, frame: rm ? 0 : Math.floor(t * 3 + w.uid.length) % 2, flip });
    }
  }
  /* ---- building cards ---- */
  function tierChip(lv) {
    const tier = B.buildingTier(lv);
    if (tier === 0) return null;
    const gold = tier === 2;
    return MG.ui.dom.h("span", {
      class: "chip", style: {
        marginLeft: 6, padding: "2px 8px", minHeight: 0, fontSize: 10,
        color: gold ? "#3a2500" : "var(--gold)",
        background: gold ? "linear-gradient(180deg,#ffd166,#f0a83a)" : "var(--panel2)",
        borderColor: gold ? "var(--gold2)" : "var(--gold)",
        cursor: "default"
      }
    }, TIER_NAME[tier]);
  }
  function miniChip(text, gold) {
    return MG.ui.dom.h("span", {
      class: "chip", style: {
        padding: "2px 8px", minHeight: 0, fontSize: 10,
        color: gold ? "var(--gold)" : "var(--dim)",
        borderColor: gold ? "var(--gold)" : "var(--line)",
        cursor: "default", whiteSpace: "nowrap"
      }
    }, text);
  }
  function buildingCard(b) {
    const st = S();
    const lv = st.buildings[b.id] || 0;
    const d = D[b.id];
    const locked = lv === 0;
    const unlocked = B.available(b.id);
    const maxed = lv >= d.max;
    const cost = B.nextCost(b.id);
    const afford = st.currencies.gold >= cost.gold && Object.entries(cost.mats || {}).every(([m, n]) => (st.mats[m] || 0) >= n);
    const row = MG.ui.dom.h("div", {
      class: "row", style: locked && !unlocked ? { opacity: 0.62 } : {},
      title: (locked ? (unlocked ? "建造「" + d.name + "」— " + d.desc : "「" + d.name + "」需王國 Lv " + d.unlock + " 解鎖 — " + d.desc) : (maxed ? "「" + d.name + "」已達最高等級 Lv " + lv : "「" + d.name + "」Lv " + lv + " — " + d.effect(lv))),
      on: { click: () => openDetail(b.id) }
    },
      MG.ui.dom.icon("b_" + b.id, 30),
      MG.ui.dom.h("div", { class: "grow" },
        MG.ui.dom.h("div", { style: { fontWeight: 800, display: "flex", alignItems: "center", flexWrap: "wrap" } },
          d.name,
          lv > 0 ? MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 6 } }, "Lv " + lv) : null,
          lv > 0 ? tierChip(lv) : null),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } },
          locked ? d.desc : (maxed ? "此建築已達最高等級，榮光永駐。" : d.effect(lv))),
        !locked && !maxed ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, color: "var(--dim2)" } }, costText(cost)) : null),
      locked ? (unlocked
        ? MG.ui.dom.h("button", {
          class: "btn sm " + (afford ? "gold" : ""), disabled: !afford,
          on: { click: (e) => { e.stopPropagation(); buy(b.id); } }
        }, "建造")
        : miniChip("王國 Lv " + d.unlock, false))
        : (maxed ? miniChip("已達最高等級", true) :
          MG.ui.dom.h("button", {
            class: "btn sm " + (afford ? "gold" : ""), disabled: !afford,
            on: { click: (e) => { e.stopPropagation(); buy(b.id); } }
          }, "升級")));
    cardEls[b.id] = row;
    return row;
  }
  function costText(cost) {
    const parts = ["金幣 " + MG.util.fmt(cost.gold)];
    for (const m in (cost.mats || {})) parts.push(MG.config.MATS[m].name + " " + MG.util.fmt(cost.mats[m]));
    return parts.join(" · ");
  }
  function flashCard(id) {
    const el = cardEls[id];
    if (!el || !el.animate) return;
    el.animate([
      { boxShadow: "0 0 0 rgba(255,209,102,0)", transform: "scale(1)" },
      { boxShadow: "0 0 0 2px rgba(255,209,102,.28), 0 0 18px rgba(255,209,102,.9)", transform: "scale(1.015)", offset: 0.4 },
      { boxShadow: "0 0 0 rgba(255,209,102,0)", transform: "scale(1)" }
    ], { duration: 680, easing: "ease-out" });
  }
  function buy(id) {
    const prev = S().buildings[id] || 0;
    if (!B.buy(id)) {
      MG.ui.dom.toast("資源不足，無法升級", "bad", "icon_coin");
      return false;
    }
    const now = S().buildings[id] || 0;
    const d = D[id];
    const tier = B.buildingTier(now);
    if (now === 1) {
      MG.ui.dom.toast("「" + d.name + "」建造完成，王國氣象一新！", "good", "b_" + id);
    } else if (tier > B.buildingTier(prev)) {
      MG.ui.dom.toast("「" + d.name + "」晉升" + TIER_NAME[tier] + "！全城為之讚嘆", "gold", "b_" + id);
    } else {
      MG.ui.dom.toast("「" + d.name + "」升級至 Lv " + now, "good", "b_" + id);
    }
    renderCards(true);
    drawTown();
    flashCard(id);
    if (tier > B.buildingTier(prev) && now > 1) {
      const b = layout().find(o => o.id === id);
      if (b) burst = { t0: performance.now() / 1000, x: b.x + 16 * b.scale, y: b.y - (b.scale - 1.6) * 16 };
    }
    return true;
  }
  function openDetail(id) {
    const st = S();
    const lv = st.buildings[id] || 0;
    const d = D[id];
    if (id === "forge" && lv > 0) { MG.ui.more.openForge(); return; }
    if (id === "market" && lv > 0) { MG.ui.more.openMarket(); return; }
    if (id === "altar" && lv > 0) { MG.ui.more.openAltar(); return; }
    const maxed = lv >= d.max;
    const m = MG.ui.dom.modal(d.name, null, { icon: "b_" + id });
    const body = MG.ui.dom.h("div", null,
      MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 8 } },
        MG.ui.dom.icon("b_" + id, 64),
        MG.ui.dom.h("div", { style: { marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 } },
          MG.ui.dom.h("span", { class: "sub" }, lv > 0 ? "Lv " + lv : "尚未建造"),
          lv > 0 ? tierChip(lv) : null)),
      MG.ui.dom.h("div", { style: { textAlign: "center", fontSize: 12, color: "var(--dim)", marginBottom: 10 } },
        d.flavor ? "「" + d.flavor + "」" : ""),
      lv > 0 ? MG.ui.dom.h("div", { style: { fontWeight: 800, color: "var(--gold)", marginBottom: 4 } }, d.effect(lv)) : null,
      lv > 0 && !maxed ? MG.ui.dom.h("div", { class: "sub", style: { marginBottom: 10 } },
        "下一級：", MG.ui.dom.h("b", { style: { color: "var(--gold)" } }, d.effect(lv + 1))) : null,
      MG.ui.dom.h("div", { style: { background: "var(--panel2)", borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 11, lineHeight: 1.8 } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, color: "var(--gold)", marginBottom: 2 } }, "等級效果一覽"),
        [1, 5, 10, 15, 20, 30, 40].filter(n => n <= d.max).map(n => MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", gap: 8 } },
          MG.ui.dom.h("span", { style: { color: n === lv ? "var(--gold)" : "var(--dim)", fontWeight: n === lv ? 900 : 500 } }, "Lv " + n + (n === lv ? "（目前）" : "")),
          MG.ui.dom.h("span", { style: { textAlign: "right", color: n === lv ? "var(--text)" : "var(--dim)" } }, d.effect(n))))) ,
      MG.ui.dom.h("div", { style: { color: "var(--dim)", fontSize: 13, marginBottom: 10 } }, d.desc),
      // 技能研讀（圖書館專屬）：消耗技能書永久強化技能威力
      id === "library" && lv > 0 ? MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 8, padding: 8, marginBottom: 10 } },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, "技能研讀：Lv " + (st.studyLvl || 0) + "/10"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, margin: "2px 0 6px" } },
          "每級技能威力 +1%（永久）。持有技能書：" + (st.currencies.book || 0) + " 本。"),
        MG.ui.dom.h("button", {
          class: "btn sm " + (MG.sys.meta.studyCost() > 0 && (st.currencies.book || 0) >= MG.sys.meta.studyCost() ? "gold" : ""),
          disabled: MG.sys.meta.studyCost() < 0 || (st.currencies.book || 0) < MG.sys.meta.studyCost(),
          on: { click: () => { if (MG.sys.meta.buyStudy()) { MG.ui.dom.toast("研讀完成！技能威力 +1%", "good", "icon_book"); openDetail("library"); m.close(); } } }
        }, MG.sys.meta.studyCost() < 0 ? "已研讀至最高境界" : "研讀（消耗 " + MG.sys.meta.studyCost() + " 本技能書）")) : null,
      !lv ? MG.ui.dom.h("div", { class: "sub", style: { marginBottom: 10 } },
        B.available(id) ? "解鎖條件已滿足，在此動工吧！" : "解鎖條件：王國 Lv " + d.unlock + "，屆時即可在此動工。") : null,
      !lv && B.available(id) ? MG.ui.dom.h("button", {
        class: "btn gold", style: { width: "100%" },
        on: { click: () => { if (buy(id)) m.close(); } }
      }, "建造　" + costText(B.nextCost(id))) : null,
      lv > 0 && !maxed ? MG.ui.dom.h("button", {
        class: "btn gold", style: { width: "100%" },
        on: { click: () => { if (buy(id)) m.close(); } }
      }, "升級至 Lv " + (lv + 1) + "　" + costText(B.nextCost(id))) :
        (maxed ? MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 6 } },
          "此建築已達最高等級，榮光永駐。") : null));
    m.panel.appendChild(body);
  }
  /* 王國概覽：勢力／副本／生產／圖鑑 四卡 + 建築橫幅 */
  let overviewEl = null, overviewBodyEl = null;
  function line(label, val, color) {
    return MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", gap: 4 } },
      MG.ui.dom.h("span", null, label),
      MG.ui.dom.h("span", { style: { fontWeight: 800, color: color || "var(--text)" } }, val));
  }
  function mkCard(title, icon, ...rows) {
    const c = MG.ui.dom.h("div", { class: "panel2", style: { padding: 8 } },
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 12, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 } },
        MG.ui.dom.icon(icon, 13), title),
      MG.ui.dom.h("div", { style: { fontSize: 11, color: "var(--dim)", lineHeight: 1.7 } }, rows));
    return c;
  }
  // 效能：概覽每 500ms 全量重建（40 英雄 power 計算 + DOM）→ 簽名沒變就跳過；王國經驗條獨立更新
  let ovSig = "", lastOvAt = 0, kePctEl = null, keNumEl = null;
  function overviewSignature() {
    const st = S();
    let s = st.hunters.length + ":" + st.kingdom.level + ":" + st.formation.join(",")
      + ":" + (st.hunt.dispatchIds || []).join(",") + ":" + st.hunt.region + ":" + st.hunt.stage
      + ":" + (st.hunt.difficulty || 0) + ":" + st.stats.maxStage + ":" + (st.wanderers || []).length
      + ":" + (st.buffs.potAtk || 0) + ":" + (st.buffs.potGold || 0) + ":" + (st.buffs.potExp || 0) + ":" + (st.buffs.boostUntil || 0)
      + ":" + Math.floor(MG.sys.battle.rates().goldPerSec) + ":" + (st.awakenings || 0) + ":" + (st.studyLvl || 0);
    return s;
  }
  function renderOverview(force) {
    if (!overviewBodyEl) return;
    const st = S();
    // v137：資源總覽數字獨立更新（每秒跳動，不觸發全量重建）
    for (const k in resSpans) {
      const span = resSpans[k];
      if (!span) continue;
      const txt = MG.util.fmt(st.currencies[k] || 0);
      if (span.textContent !== txt) span.textContent = txt;
    }
    // 王國經驗條獨立更新（每秒跳動，不觸發全量重建）
    if (kePctEl && keNumEl) {
      const ke = MG.sys.game.kingdomExpNeed(st.kingdom.level);
      const pct = Math.min(100, st.kingdom.exp / ke * 100);
      kePctEl.style.width = pct + "%";
      keNumEl.textContent = MG.util.fmt(Math.floor(st.kingdom.exp)) + " / " + MG.util.fmt(ke) + "　(" + Math.floor(pct) + "%)";
    }
    const sig = overviewSignature();
    if (!force && sig === ovSig && Date.now() - lastOvAt < 1000) return; // 狀態沒變 → 跳過全量重建
    ovSig = sig; lastOvAt = Date.now();
    const B = MG.sys.buildings;
    const eff = B.effects();
    overviewBodyEl.innerHTML = "";
    const grid = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } });
    // 勢力
    const cap = eff.rosterCap;
    const formed = (st.formation || []).filter(Boolean).length;
    const best = st.hunters.reduce((a, h) => (!a || MG.sys.hunters.power(h) > a.p) ? { h, p: MG.sys.hunters.power(h) } : a, null);
    grid.appendChild(mkCard("勢力", "icon_sword",
      line("名冊", st.hunters.length + " / " + cap),
      line("出戰中", formed + " 人"),
      best ? line("最強戰力", best.h.name + " · " + MG.util.fmt(best.p), "var(--gold)") : line("最強戰力", "尚無英雄"),
      line("流浪英雄", (st.wanderers || []).filter(w => !w.dead).length + " 人")));
    // 副本
    const r = MG.sys.loot.region(st.hunt.region);
    const diff = MG.config.DIFFICULTY[st.hunt.difficulty || 0] || MG.config.DIFFICULTY[0];
    grid.appendChild(mkCard("副本", "icon_chest",
      line("目前地圖", r.name + " 第 " + st.hunt.stage + " 關"),
      line("難度", diff.name),
      line("最遠紀錄", "第 " + st.stats.maxStage + " 關", "var(--gold)"),
      line("討伐", MG.util.fmt(st.stats.kills) + " 隻 · BOSS " + st.stats.bossKills + " 隻")));
    // 生產
    const rates = MG.sys.battle.rates();
    const now = Date.now();
    const buffNames = [];
    if (st.buffs.potAtk > now) buffNames.push("攻擊");
    if (st.buffs.potGold > now) buffNames.push("金幣");
    if (st.buffs.potExp > now) buffNames.push("經驗");
    if (st.buffs.boostUntil > now) buffNames.push("加速");
    grid.appendChild(mkCard("生產", "icon_coin",
      line("金幣", "+" + MG.util.fmt(Math.floor(rates.goldPerSec)) + "/秒", rates.goldPerSec > 0 ? "var(--gold)" : "var(--dim2)"),
      line("經驗", "+" + MG.util.fmt(Math.floor(rates.expPerSec)) + "/秒", rates.expPerSec > 0 ? "#7ee787" : "var(--dim2)"),
      line("產出加成", "金幣 x" + eff.goldMul.toFixed(1) + " · 經驗 x" + eff.expMul.toFixed(1)),
      line("啟用效果", buffNames.length ? buffNames.join("、") : "無", buffNames.length ? "var(--gold)" : "var(--dim2)")));
    // 圖鑑與成就
    const codex = Math.floor(MG.sys.meta.codexPct() * 100);
    const ach = Object.keys(st.achievements || {}).length;
    grid.appendChild(mkCard("圖鑑", "icon_book",
      line("魔物圖鑑", codex + "%", codex >= 100 ? "var(--gold)" : undefined),
      line("成就", ach + " / " + MG.data.quests.ACH.length),
      line("技能研讀", "Lv " + (st.studyLvl || 0)),
      line("昇華", (st.awakenings || 0) + " 次")));
    overviewBodyEl.appendChild(grid);
    // 王國經驗詳細條（王國總覽下方）
    const ke = MG.sys.game.kingdomExpNeed(st.kingdom.level);
    const pct = Math.min(100, st.kingdom.exp / ke * 100);
    const kePct = MG.ui.dom.h("i", { style: { width: pct + "%", background: "linear-gradient(90deg,#f0a83a,#ffd166)" } });
    kePctEl = kePct;
    const keNum = MG.ui.dom.h("span", { style: { fontWeight: 800, fontSize: 12, color: "var(--gold)" } },
      MG.util.fmt(Math.floor(st.kingdom.exp)) + " / " + MG.util.fmt(ke) + "　(" + Math.floor(pct) + "%)");
    keNumEl = keNum;
    overviewBodyEl.appendChild(MG.ui.dom.h("div", { class: "panel2", style: { padding: "8px 10px", marginTop: 8 } },
      MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 } },
        MG.ui.dom.h("span", { style: { fontWeight: 900, fontSize: 13 } },
          "王國 Lv " + st.kingdom.level, MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10 } }, "　經驗條")),
        keNum),
      MG.ui.dom.h("div", { class: "pbar", style: { height: 12 } },
        kePct),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 3 } },
        st.kingdom.level >= 50 ? "王國已達最高等級，榮光永駐。" :
          "每級：全隊攻擊/金幣/經驗 +1%（目前 +" + Math.round((st.kingdom.level - 1)) + "%）・升級送禮金，每 5 級加贈鑽石。來源：英雄升級、建築升級、討伐BOSS、離線掛機")));
    // 建築橫幅
    const built = B.unlockedList();
    const chips = built.length ? built.map(id => {
      const d = B.def(id);
      return MG.ui.dom.h("span", { class: "chip", style: { padding: "2px 8px", minHeight: 24, fontSize: 11 } },
        d.name + " Lv" + (st.buildings[id] || 0));
    }) : [MG.ui.dom.h("span", { class: "sub" }, "尚未建造建築")];
    const nu = B.nextUnlock();
    const banner = MG.ui.dom.h("div", { class: "panel2", style: { padding: "6px 10px", marginTop: 8 } },
      MG.ui.dom.h("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } }, chips),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 4 } },
        "已建 " + built.length + " / " + Object.keys(MG.data.buildings).length + " 種建築" +
        (nu ? " · 下一座：「" + nu.name + "」需王國 Lv " + nu.unlock : "")));
    overviewBodyEl.appendChild(banner);
  }
  /* 素材倉庫：展開式列表（收合=名稱+數量；點開=細項來源） */
  let matsEl = null, matsQtyEls = {};
  function renderMats() {
    if (!matsEl) return;
    const st = S();
    // 更新既有數量（不重建 → 展開狀態保留）
    for (const mid in matsQtyEls) {
      const el = matsQtyEls[mid];
      if (el) el.textContent = MG.util.fmt(st.mats[mid] || 0);
    }
  }
  function buildMats() {
    if (!matsEl) return;
    const st = S();
    matsEl.innerHTML = "";
    matsQtyEls = {};
    for (const mid of Object.keys(MG.config.MATS)) {
      const d = MG.config.MATS[mid];
      const qtyEl = MG.ui.dom.h("span", { style: { fontWeight: 900, fontSize: 13, color: "var(--gold)" } });
      const arrow = MG.ui.dom.h("span", { style: { color: "var(--dim2)", fontSize: 11, transition: "transform .2s" } }, "▸");
      const detail = MG.ui.dom.h("div", { style: { display: "none", padding: "2px 10px 8px 44px", fontSize: 11, color: "var(--dim)", lineHeight: 1.6 } });
      let open = false;
      const row = MG.ui.dom.h("div", { class: "row", style: { padding: "8px 10px", cursor: "pointer" }, title: d.name + "（" + MG.config.tierLabel(d.tier) + "）— " + (d.desc || "素材") + "。來源：" + (d.src || "分解裝備・離線獎勵") + "。用途：建築升級・英雄突破・裝備合成", on: { click: () => {
        open = !open;
        detail.style.display = open ? "" : "none";
        arrow.textContent = open ? "▾" : "▸";
        MG.core.audio.SFX.click();
      } } },
        MG.ui.dom.icon(d.icon, 22),
        MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
            d.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, MG.config.tierLabel(d.tier))),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "持有數量")),
        qtyEl,
        MG.ui.dom.h("button", { class: "btn sm gold", style: { padding: "4px 9px", minHeight: 28, fontSize: 11, flexShrink: 0 }, on: { click: (e) => { e.stopPropagation(); openSellMat(mid); } } }, "賣出"),
        MG.ui.dom.h("span", { style: { width: 14, textAlign: "center" } }, arrow));
      qtyEl.textContent = MG.util.fmt(st.mats[mid] || 0);
      matsQtyEls[mid] = qtyEl;
      detail.appendChild(MG.ui.dom.h("div", null, "來源：" + (d.src || "分解裝備・離線獎勵")));
      detail.appendChild(MG.ui.dom.h("div", null, "用途：建築升級・英雄突破・裝備合成"));
      matsEl.appendChild(row);
      matsEl.appendChild(detail);
    }
  }
  function render(root) {
    root.innerHTML = "";
    root.appendChild(MG.ui.dom.h("div", { style: { padding: "10px 10px 4px" } },
      MG.ui.dom.h("div", { class: "title", style: { fontSize: 19 } }, S().kingdomName || "梅根王國"),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 12 } }, "重建祖父的榮光，讓這座酒館再次熱鬧。")));
    // town canvas + tier-glow overlay canvas
    const wrap = MG.ui.dom.h("div", { style: { position: "relative", margin: "8px 10px 4px", border: "2px solid var(--line)", borderRadius: 10, overflow: "hidden" } });
    townCanvas = document.createElement("canvas");
    townCanvas.width = 480; townCanvas.height = 200;
    townCanvas.style.width = "100%"; townCanvas.style.display = "block";
    ctx = townCanvas.getContext("2d");
    wrap.appendChild(townCanvas);
    fxCanvas = document.createElement("canvas");
    fxCanvas.width = 480; fxCanvas.height = 200;
    fxCanvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
    fxCtx = fxCanvas.getContext("2d");
    wrap.appendChild(fxCanvas);
    // tap overlay cells（透明點擊區，置於最上層）
    overlayCells = [];
    ORDER.forEach((id, i) => {
      const [x, y] = CELLS[i];
      const cell = MG.ui.dom.h("div", {
        style: { position: "absolute", left: (x / 480 * 100) + "%", top: (y / 200 * 100) + "%", width: "21%", height: "28%", cursor: "pointer", zIndex: 2 },
        on: { click: () => openDetail(id) }
      });
      wrap.appendChild(cell);
      overlayCells.push(cell);
    });
    root.appendChild(wrap);
    drawTown();
    // v137：資源總覽（原頂欄全部貨幣移入：金幣/鑽石/招募券/榮譽/書）
    const resWrap = MG.ui.dom.h("div", { style: { margin: "0 10px 10px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 } });
    const RES = [
      ["icon_coin", "金幣", "gold", "var(--gold)"],
      ["icon_gem", "鑽石", "gems", "var(--blue)"],
      ["icon_ticket", "招募券", "ticket", "var(--r5)"],
      ["icon_honor", "榮譽", "honor", "var(--r5)"],
      ["icon_book", "魔法書", "book", "var(--gold)"]
    ];
    resSpans = {};
    for (const [icon, label, key, color] of RES) {
      const cell = MG.ui.dom.h("div", { class: "panel2", style: { display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", fontSize: 12 } },
        MG.ui.dom.icon(icon, 16),
        MG.ui.dom.h("span", { style: { color: "var(--dim)", fontSize: 11 } }, label),
        MG.ui.dom.h("span", { class: "grow" }, null),
        MG.ui.dom.h("b", { style: { color, fontVariantNumeric: "tabular-nums" } }, "0"));
      resSpans[key] = cell.lastElementChild;
      resWrap.appendChild(cell);
    }
    root.appendChild(MG.ui.dom.h("div", { style: { margin: "0 10px" } },
      MG.ui.dom.h("div", { class: "section-h", style: { margin: "2px 0" } },
        MG.ui.dom.h("span", { class: "t" }, "資源總覽"))));
    root.appendChild(resWrap);
    // 王國概覽（勢力/狩獵/生產/圖鑑 + 建築橫幅）：標題固定，內容區每次重建
    overviewEl = MG.ui.dom.h("div", { style: { margin: "0 10px 10px" } },
      MG.ui.dom.h("div", { class: "section-h", style: { margin: "2px 0" } },
        MG.ui.dom.h("span", { class: "t" }, "王國概覽")));
    overviewBodyEl = MG.ui.dom.h("div", null);
    overviewEl.appendChild(overviewBodyEl);
    root.appendChild(overviewEl);
    renderOverview(true);
    // 素材倉庫（展開式列表）
    root.appendChild(MG.ui.dom.h("div", { style: { margin: "0 10px 0" } },
      MG.ui.dom.h("div", { class: "section-h", style: { margin: "2px 0" } },
        MG.ui.dom.h("span", { class: "t" }, "素材倉庫")),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, padding: "0 2px 6px" } },
        "素材用於建築升級、英雄突破與裝備合成。點開素材查看獲取來源。")));
    matsEl = MG.ui.dom.h("div", { style: { margin: "0 10px 10px" } });
    root.appendChild(matsEl);
    buildMats();
    // awakening banner
    if (MG.sys.meta.canAwaken()) {
      const honor = Math.floor((100 + 25 * (S().awakenings || 0)) * B.effects().honorMul);
      root.appendChild(MG.ui.dom.h("div", { class: "panel", style: { margin: "0 10px 10px", borderColor: "var(--r6)", textAlign: "center", padding: "10px 12px" } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, color: "var(--r6)", fontSize: 15, letterSpacing: 1 } }, "昇華時刻來臨"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 12, marginTop: 2 } }, "王國已然茁壯。獻上一切，換取神話之力。"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, color: "var(--gold)", marginTop: 4 } },
          "預期收穫：+" + MG.util.fmt(honor) + " 榮譽 · 攻擊 +25% · 金幣 +25% · 經驗 +5%（永久）"),
        MG.ui.dom.h("button", { class: "btn pink sm", style: { marginTop: 8 }, on: { click: () => MG.ui.more.openAltar() } }, "前往昇華祭壇")));
    }
  }
  // 效能：2Hz refresh 全量重建 10 建築卡（12ms）→ 等級/可用性/金幣沒變就跳過
  let cardsSig = "", lastCardsAt = 0;
  function cardsSignature() {
    const st = S();
    let s = st.buildings ? Object.keys(st.buildings).map(k => k + ":" + st.buildings[k]).join(",") : "";
    s += "|K" + st.kingdom.level + "|G" + st.currencies.gold;
    s += "|M" + (st.mats ? Object.keys(st.mats).map(k => st.mats[k]).join(",") : "");
    return s;
  }
  function renderCards(force) {
    if (!cardsEl) return;
    if (!force) {
      const sig = cardsSignature();
      if (sig === cardsSig && Date.now() - lastCardsAt < 1000) return; // 狀態沒變 → 跳過
      cardsSig = sig; lastCardsAt = Date.now();
    }
    cardsEl.innerHTML = "";
    for (const id of ORDER) cardsEl.appendChild(buildingCard({ id }));
    renderHint();
  }
  function renderHint() {
    if (!hintEl) return;
    hintEl.innerHTML = "";
    const nu = B.nextUnlock();
    if (nu) hintEl.appendChild(MG.ui.dom.h("span", null, "下一建築：", MG.ui.dom.h("b", { style: { color: "var(--gold)" } }, "「" + nu.name + "」"), " 需王國 Lv " + nu.unlock));
  }
  function renderBuildings(root) {
    root.innerHTML = "";
    // v136：移除頂部標題空白與「下一建築」橫條，直接顯示建築清單
    hintEl = null; // 橫條移除
    cardsEl = MG.ui.dom.h("div", { style: { padding: "10px 10px 20px" } });
    root.appendChild(cardsEl);
    renderCards();
  }
  /* v138 素材賣出：數量編輯（− / 手動輸入 / ＋），邏輯與市場批量購買一致 */
  function openSellMat(mid) {
    const st = S();
    const d = MG.config.MATS[mid];
    const have = st.mats[mid] || 0;
    if (have <= 0) { MG.ui.dom.toast("沒有「" + d.name + "」可賣出", "bad", d.icon); return; }
    const price = d.tier === 1 ? 5 : d.tier === 2 ? 20 : 80; // T1=5 / T2=20 / T3=80 金
    const m = MG.ui.dom.modal("賣出素材", null, { icon: d.icon });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    body.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 8 } },
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 14 } }, d.name),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } },
        "持有 " + MG.util.fmt(have) + " 個 ・ 單價 " + MG.util.fmt(price) + " 金")));
    let qty = Math.min(1, have);
    const max = Math.min(have, 100000); // v139：賣出上限 100000
    const qtyEl = MG.ui.dom.h("button", { class: "chip", style: { minWidth: 46, justifyContent: "center", padding: "2px 6px", minHeight: 30, fontWeight: 900, fontSize: 13, color: "var(--gold)" }, title: "點擊手動輸入數量", on: { click: () => {
      const v = prompt("輸入賣出數量（1-" + max + "）", ""); // v139：輸入框預設清空
      const n = parseInt(v, 10);
      if (!isNaN(n) && n >= 1 && n <= max) { qty = Math.floor(n); refresh(); }
    } } }, "x1");
    const stepBtn = (txt, fn) => MG.ui.dom.h("button", { class: "chip", style: { padding: "2px 10px", minHeight: 30 }, on: { click: fn } }, txt);
    const dec = stepBtn("−", () => { qty = Math.max(1, qty - 1); refresh(); });
    const inc = stepBtn("+", () => { qty = Math.min(max, qty + 1); refresh(); });
    const totalEl = MG.ui.dom.h("div", { style: { textAlign: "center", fontWeight: 900, fontSize: 13, color: "var(--gold)", margin: "8px 0" } });
    function refresh() {
      qtyEl.textContent = "x" + qty;
      totalEl.textContent = "預估獲得 " + MG.util.fmt(qty * price) + " 金";
      go.textContent = "賣出　x" + qty;
      go.disabled = qty <= 0;
    }
    const qtyRow = MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } }, dec, qtyEl, inc);
    body.appendChild(qtyRow);
    body.appendChild(totalEl);
    const go = MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, on: { click: () => {
      const n = Math.min(qty, st.mats[mid] || 0);
      if (n <= 0) return;
      st.mats[mid] -= n;
      st.currencies.gold += n * price;
      MG.core.audio.SFX.click();
      MG.ui.dom.toast("賣出 " + d.name + " ×" + n + "，獲得 " + MG.util.fmt(n * price) + " 金", "", "icon_coin");
      m.close();
      renderMats();        // 更新素材數量
      renderOverview(true); // 更新資源總覽金幣
    } } }, "賣出　x1");
    body.appendChild(go);
    refresh();
  }
  const screen = {
    render,
    refresh: () => { renderOverview(); renderMats(); },
    onShow: drawTown,
    raf: (now) => { drawTierFx(now / 1000); drawTownLife(now / 1000); }
  };
  MG.ui.screens.register("kingdom", screen);
  MG.ui.screens.register("buildings", {
    render: renderBuildings,
    refresh: renderCards
  });
  return Object.assign(screen, { townView, showCastleLevelUp });
})();
