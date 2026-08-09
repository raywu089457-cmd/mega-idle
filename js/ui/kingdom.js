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
  let canvas, ctx, fxCanvas, fxCtx, root, cardsEl, hintEl, townCanvas, overlayCells = [], wanderEl = null;
  const cardEls = {}; // id -> card DOM (for upgrade flash)
  let burst = null;   // { t0, x, y } 升級瞬間的金環爆點
  const ORDER = ["castle", "guild", "training", "forge", "gemworks", "alchemy", "library", "warehouse", "altar", "market"];
  const CELLS = [ // 5 cols × 2 rows (x, y on 480×200 canvas, ground at y=166)
    [16, 52], [112, 52], [208, 52], [304, 52], [400, 52],
    [40, 120], [136, 120], [232, 120], [328, 120], [424, 120]
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
      return { id, lvl: lv, x, y, scale: lv > 0 ? 2.4 : 1.6, locked: lv === 0, sprite: tierSprite(id, lv), name: D[id].name };
    });
  }
  function drawTown() {
    MG.ui.render.drawTown(ctx, {
      h: 200, t: Date.now() / 1000,
      buildings: townView()
    });
  }
  // 供狩獵分頁在「回城休息/待機」時重用同一城鎮場景（480×270 畫布用）
  function townView() {
    return layout().map(b => ({ ...b, y: b.y - (b.scale - 1.6) * 16 }));
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
    // 火把：王城與獵人公會門前的橘紅火光（reducedMotion 時恆亮）
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
    // 流浪英雄：在城內漫步 + 對話氣泡
    const ws = (st.wanderers || []).filter(w => !w.dead);
    for (const w of ws) {
      const dir = Math.sin(t * 0.9 + w.uid.length) > 0;
      MG.ui.render.draw(fxCtx, MG.sys.wanderers.spriteOf(w), w.x - 11, 158, 1, { scale: 1.4, frame: rm ? 0 : Math.floor(t * 3 + w.uid.length) % 2, flip: dir });
      if (w.bubble && w.bubbleUntil > Date.now()) {
        const bx = Math.max(24, Math.min(456 - 120, w.x - 55));
        fxCtx.font = "9px monospace";
        fxCtx.textAlign = "center";
        const txt = w.bubble.icon + " " + w.bubble.text;
        const tw = Math.min(110, fxCtx.measureText(txt).width + 10);
        fxCtx.fillStyle = "rgba(10,10,20,0.85)";
        fxCtx.fillRect(bx, 134, tw, 16);
        fxCtx.strokeStyle = "rgba(255,209,102,0.7)";
        fxCtx.strokeRect(bx, 134, tw, 16);
        fxCtx.fillStyle = "#ffe08a";
        fxCtx.fillText(txt.slice(0, 14), bx + tw / 2, 146);
      }
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
    renderCards();
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
    if (id === "market" && lv > 0) { MG.ui.more.openShop(); return; }
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
      MG.ui.dom.h("div", { style: { color: "var(--dim)", fontSize: 13, marginBottom: 10 } }, d.desc),
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
  function render(root) {
    root.innerHTML = "";
    root.appendChild(MG.ui.dom.h("div", { style: { padding: "10px 10px 4px" } },
      MG.ui.dom.h("div", { class: "title", style: { fontSize: 19 } }, "梅根王國"),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 12 } }, "重建祖父的榮光，讓獵人公會再次偉大。")));
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
    // 流浪英雄區（完整版：走動於城鎮圖層，此處可點擊招募）
    wanderEl = MG.ui.dom.h("div", { style: { padding: "0 10px 6px" } });
    root.appendChild(wanderEl);
    renderWanderers();
    // next unlock hint
    hintEl = MG.ui.dom.h("div", { class: "panel2", style: { margin: "6px 10px", padding: "6px 10px", fontSize: 12, color: "var(--dim)" } });
    renderHint();
    root.appendChild(hintEl);
    // building cards
    cardsEl = MG.ui.dom.h("div", { style: { padding: "4px 10px 8px" } });
    root.appendChild(cardsEl);
    renderCards();
    // awakening banner
    if (MG.sys.meta.canAwaken()) {
      const honor = Math.floor((100 + 25 * (S().awakenings || 0)) * B.effects().honorMul);
      root.appendChild(MG.ui.dom.h("div", { class: "panel", style: { margin: "0 10px 10px", borderColor: "var(--r6)", textAlign: "center", padding: "10px 12px" } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, color: "var(--r6)", fontSize: 15, letterSpacing: 1 } }, "覺醒時刻來臨"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 12, marginTop: 2 } }, "王國已然茁壯。獻上一切，換取神話之力。"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, color: "var(--gold)", marginTop: 4 } },
          "預期收穫：+" + MG.util.fmt(honor) + " 榮譽 · 攻擊 +25% · 金幣 +25% · 經驗 +5%（永久）"),
        MG.ui.dom.h("button", { class: "btn pink sm", style: { marginTop: 8 }, on: { click: () => MG.ui.more.openAltar() } }, "前往覺醒祭壇")));
    }
  }
  function renderCards() {
    if (!cardsEl) return;
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
  function renderWanderers() {
    if (!wanderEl) return;
    wanderEl.innerHTML = "";
    const st = S();
    const list = (st.wanderers || []).filter(w => !w.dead);
    if (!list.length) {
      wanderEl.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, textAlign: "center", padding: "4px 0" } },
        "流浪英雄會在村中徘徊……（升級獵人公會可提升來訪者品質）"));
      return;
    }
    for (const w of list) {
      const rar = MG.config.RARITY[w.rarity - 1];
      const cost = MG.sys.wanderers.recruitCost(w);
      const can = MG.sys.wanderers.canRecruit(w);
      const spr = MG.sys.wanderers.spriteOf(w);
      const row = MG.ui.dom.h("div", { class: "row", style: { borderColor: rar.color, opacity: w.hp <= 0 ? 0.5 : 1 } },
        MG.ui.dom.h("div", { style: { textAlign: "center" } },
          MG.ui.dom.icon(spr, 30),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, color: rar.color, fontWeight: 700 } }, rar.name)),
        MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } },
            w.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } },
              MG.data.hunters.classes[w.cls].name + "・Lv" + w.level),
            w.stars > 1 ? MG.ui.dom.h("span", { class: "rar" + Math.min(6, w.stars + 2), style: { marginLeft: 4, fontSize: 9 } }, "★".repeat(w.stars)) : null),
          MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 2 } },
            MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9 } }, MG.sys.wanderers.stateLabel(w) + "・心情 " + Math.round(w.mood)),
            MG.ui.dom.h("div", { class: "pbar", style: { height: 4, flex: 1 } }, MG.ui.dom.h("i", { style: { width: Math.max(0, w.mood) + "%" } })),
            w.hp < w.maxHp ? MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9 } }, "HP " + Math.round(w.hp / w.maxHp * 100) + "%") : null),
          w.bubble ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, color: "var(--gold)", marginTop: 2 } }, w.bubble.icon + " " + w.bubble.text) : null),
        MG.ui.dom.h("button", {
          class: "btn sm " + (can.ok ? "gold" : ""), disabled: !can.ok,
          on: { click: (e) => { e.stopPropagation(); openRecruit(w); } }
        }, "招募 " + MG.util.fmt(cost) + "金"));
      wanderEl.appendChild(row);
    }
  }
  function openRecruit(w) {
    const rar = MG.config.RARITY[w.rarity - 1];
    const cost = MG.sys.wanderers.recruitCost(w);
    const m = MG.ui.dom.modal("招募流浪英雄", null, { icon: MG.sys.wanderers.spriteOf(w) });
    m.panel.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 12 } },
      MG.ui.dom.icon(MG.sys.wanderers.spriteOf(w), 48),
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 17, marginTop: 4 } }, w.name,
        MG.ui.dom.h("span", { class: "rar" + w.rarity, style: { marginLeft: 4, fontSize: 12 } }, MG.ui.dom.stars(w.rarity))),
      MG.ui.dom.h("div", { class: "sub" }, rar.name + "・" + MG.data.hunters.classes[w.cls].name + "・Lv " + w.level + "・心情 " + Math.round(w.mood)),
      MG.ui.dom.h("div", { style: { fontSize: 12, color: "var(--dim)", marginTop: 6 } },
        "「" + (w.bubble ? w.bubble.text : "帶上我吧，我會證明自己的價值！") + "」")));
    m.panel.appendChild(MG.ui.dom.h("button", {
      class: "btn gold", style: { width: "100%" },
      disabled: !MG.sys.wanderers.canRecruit(w).ok,
      on: { click: () => { const h = MG.sys.wanderers.recruit(w.uid); if (h) { m.close(); renderWanderers(); MG.ui.screens.tick(); } } }
    }, "招募（" + MG.util.fmt(cost) + " 金幣）"));
    m.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "放他離開"));
  }
  const screen = {
    render,
    refresh: () => { renderCards(); renderWanderers(); },
    onShow: drawTown,
    raf: (now) => { drawTierFx(now / 1000); drawTownLife(now / 1000); }
  };
  MG.ui.screens.register("kingdom", screen);
  return Object.assign(screen, { townView });
})();
