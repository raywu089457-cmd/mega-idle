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
  let chestBtnEl = null; // v627：每日寶箱（村莊框右下 — 世界地圖移除後遷入）
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
      buildings: townView(),
      period: townPeriod(), // v649：夜景/黃昏時段色票
      season: townSeason() // v669：四季色票
    });
  }
  /* v649／v665 村莊時段：6–17 白天・17–20 黃昏・其餘夜景；可 _periodOverride 強制 */
  let _periodOverride = null;
  function townPeriod() {
    if (_periodOverride === "dusk" || _periodOverride === "night" || _periodOverride === "day") return _periodOverride;
    const h = new Date().getHours();
    if (h >= 6 && h < 17) return "day";
    if (h >= 17 && h < 20) return "dusk";
    return "night";
  }
  /* v669 村莊季節：3–5 春・6–8 夏・9–11 秋・其餘冬；可 _seasonOverride 強制 */
  let _seasonOverride = null;
  function townSeason() {
    if (_seasonOverride === "spring" || _seasonOverride === "summer" || _seasonOverride === "autumn" || _seasonOverride === "winter") return _seasonOverride;
    const m = new Date().getMonth(); // 0–11
    if (m >= 2 && m <= 4) return "spring";
    if (m >= 5 && m <= 7) return "summer";
    if (m >= 8 && m <= 10) return "autumn";
    return "winter";
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
      if (b.locked) continue;
      const scale = b.scale, w = 32 * scale, h = w;
      const x = b.x, y = b.y - (scale - 1.6) * 16;
      // v661：銅階中間飾（lvl 3–4）— 銀/金之前可見屋脊銅點，補升級視覺階梯
      // v673：銅階屋檐風鈴微晃（對稱銀階掛燈語彙）
      if (b.lvl >= 3 && b.lvl < 5) {
        const tw = t * 2.1;
        for (let i = 0; i < 3; i++) {
          const dx = w * (0.25 + i * 0.25);
          fxCtx.globalAlpha = rm ? 0.75 : 0.4 + 0.45 * (0.5 + 0.5 * Math.sin(tw + i * 1.9));
          fxCtx.fillStyle = "#c8915c";
          fxCtx.fillRect(x + dx - 1, y + 3, 2, 2);
        }
        for (const side of [-1, 1]) {
          const lx = Math.round(x + w / 2 + side * (w * 0.30));
          const sway = rm ? 0 : Math.round(Math.sin(t * 3.5 + side * 1.2) * 1);
          const ly = Math.round(y + h * 0.40);
          fxCtx.globalAlpha = 1;
          fxCtx.fillStyle = "#a07040"; // 吊線
          fxCtx.fillRect(lx, ly - 5, 1, 4);
          fxCtx.fillStyle = "#e0a060"; // 銅鈴
          fxCtx.fillRect(lx - 1 + sway, ly, 3, 3);
          fxCtx.fillStyle = "#ffe0a8"; // 高光
          fxCtx.fillRect(lx + sway, ly + 1, 1, 1);
        }
        fxCtx.globalAlpha = 1;
        continue;
      }
      if (b.lvl < 5) continue;
      const tier = B.buildingTier(b.lvl);
      const T = TINT[tier];
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
      // v665：銀階屋檐掛燈（左右各一・微晃；rm 定幀）
      if (tier === 1) {
        for (const side of [-1, 1]) {
          const lx = Math.round(x + w / 2 + side * (w * 0.32));
          const sway = rm ? 0 : Math.round(Math.sin(t * 3.2 + side) * 1);
          const ly = Math.round(y + h * 0.42);
          fxCtx.globalAlpha = 1;
          fxCtx.fillStyle = "#8a9ab8"; // 吊鍊
          fxCtx.fillRect(lx, ly - 6, 1, 5);
          fxCtx.fillStyle = "#c8d6f0"; // 燈罩
          fxCtx.fillRect(lx - 1 + sway, ly, 3, 3);
          fxCtx.fillStyle = "#ffe9a0"; // 暖芯
          fxCtx.fillRect(lx + sway, ly + 1, 1, 1);
        }
      }
      // v665：金階雙角飄旗（屋頂兩側三角旗微晃；rm 定幀）
      if (tier === 2) {
        for (const side of [-1, 1]) {
          const px = Math.round(x + w / 2 + side * (w * 0.38));
          const py = Math.round(y + 4);
          const sway = rm ? 0 : Math.round(Math.sin(t * 2.8 + side * 1.4) * 2);
          fxCtx.globalAlpha = 1;
          fxCtx.fillStyle = "#8a6a2a"; // 旗桿
          fxCtx.fillRect(px, py, 1, 6);
          fxCtx.fillStyle = "#ffd166";
          fxCtx.fillRect(px + (side > 0 ? 1 : -4) + sway, py, 4, 2);
          fxCtx.fillRect(px + (side > 0 ? 1 : -2) + sway, py + 2, 2, 1);
        }
      }
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
    // 火把：王城與酒館門前的橘紅火光（reducedMotion 時恆亮定幀）
    // v625：火焰 2×2 → 約 3×5 火舌（底 3 寬 #ff7a2a／中 2 寬含熱核／頂 1 寬 #ffd166 尖）＋1px 水平擺動＋焰下微光暈；
    //       火焰 x 為光池錨點權威（js/ui/render.js drawTown 暖光池段同 x，改一邊必改另一邊）
    const st = S();
    const torches = [];
    if ((st.buildings.castle || 0) > 0) torches.push(54);
    if ((st.buildings.guild || 0) > 0) torches.push(150);
    for (const tx of torches) {
      const a = rm ? 0.8 : Math.max(0.35, Math.min(1, 0.55 + 0.3 * Math.sin(t * 13 + tx) + 0.15 * Math.sin(t * 29 + tx * 2)));
      const sx = rm ? tx : tx + Math.round(Math.sin(t * 7 + tx)); // 火舌 1px 擺動（rm 不擺）
      // 焰下微光暈（與地面光池呼應；rm 恆定）
      const grd = fxCtx.createRadialGradient(sx, 117, 1, sx, 117, 7);
      grd.addColorStop(0, "rgba(255,150,70," + (rm ? 0.14 : 0.14 + 0.04 * Math.sin(t * 11 + tx)).toFixed(3) + ")");
      grd.addColorStop(1, "rgba(255,150,70,0)");
      fxCtx.fillStyle = grd;
      fxCtx.fillRect(sx - 7, 110, 14, 14);
      // 火舌（底→頂 3/3/2/2/1：橙邊包金黃熱核,沿用既有 #ff7a2a/#ffd166 兩色）
      fxCtx.globalAlpha = a;
      fxCtx.fillStyle = "#ff7a2a";
      fxCtx.fillRect(sx - 1, 117, 3, 2); // 底部 3 寬 ×2 列（橙邊）
      fxCtx.fillStyle = "#ffd166";
      fxCtx.fillRect(sx - 1, 117, 2, 2); // 底列熱核 2 寬
      fxCtx.fillRect(sx - 1, 115, 2, 2); // 中段 2 寬 ×2 列
      fxCtx.fillRect(sx, 114, 1, 1);     // 頂尖（右斜上火勢）
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
    // v641 村莊動物（雞×2＋豬×1 — 確定性時基動畫 fps 8；rm 定幀第 0 幀）
    // 位置：左農田帶(24..50)、右農田帶(424..450)、廣場右緣(280)；避 CELLS ±6px 熱區
    const ANIMALS = [
      { s: "a_chicken", x: 35,  y: 170, ph: 0    }, // 雞 A：左農田
      { s: "a_chicken", x: 435, y: 170, ph: 0.37 }, // 雞 B：右農田（相位錯開）
      { s: "a_pig",     x: 280, y: 170, ph: 0.71 }  // 豬 C：廣場右緣
    ];
    for (const a of ANIMALS) {
      const frame = rm ? 0 : MG.ui.render.animFrame(t, 8, 2, a.ph);
      MG.ui.render.draw(fxCtx, a.s, a.x, a.y, 1, { scale: 2.0, frame });
    }
    // v653 廣場小狗（程序像素 — 棕身往返＋尾擺；rm 定幀佇立）
    // 錨帶 x200..320 y=172：避 CELLS 熱區與豬 C(280,170) 略錯開 y
    {
      const dogY = 172;
      let dogX, flip;
      if (rm) { dogX = 240; flip = false; }
      else {
        const span = 120 * 2;
        let p = (t * 18) % span;
        if (p < 120) { dogX = 200 + p; flip = false; }
        else { dogX = 200 + (span - p); flip = true; }
      }
      dogX = Math.round(dogX);
      const tail = rm ? 0 : Math.round(Math.sin(t * 10) * 1);
      // 身
      fxCtx.fillStyle = "#c8915c";
      fxCtx.fillRect(dogX + (flip ? -2 : 0), dogY, 7, 4);
      // 頭
      fxCtx.fillRect(dogX + (flip ? -4 : 5), dogY - 1, 4, 4);
      // 耳
      fxCtx.fillStyle = "#a06a40";
      fxCtx.fillRect(dogX + (flip ? -4 : 7), dogY - 2, 2, 2);
      // 腿
      fxCtx.fillRect(dogX + 1, dogY + 4, 1, 2);
      fxCtx.fillRect(dogX + 4, dogY + 4, 1, 2);
      // 尾
      fxCtx.fillStyle = "#c8915c";
      fxCtx.fillRect(dogX + (flip ? 6 : -2), dogY + 1 + tail, 2, 1);
      // 眼高光
      fxCtx.fillStyle = "#fff3c8";
      fxCtx.fillRect(dogX + (flip ? -3 : 7), dogY, 1, 1);
    }
    // v661 廣場小貓（程序像素 — 灰身蹲坐＋尾輕擺；rm 定幀）
    // 錨點 x=255 y=174：狗路徑(200–320,y172) 右側錯開，避豬 C(280,170)
    {
      const catX = 255, catY = 174;
      const tail = rm ? 0 : Math.round(Math.sin(t * 7) * 1);
      fxCtx.fillStyle = "#a8a8b8";
      fxCtx.fillRect(catX, catY, 6, 4); // 身
      fxCtx.fillRect(catX + 5, catY - 1, 3, 3); // 頭
      fxCtx.fillStyle = "#8888a0";
      fxCtx.fillRect(catX + 5, catY - 2, 1, 2); // 耳
      fxCtx.fillRect(catX + 7, catY - 2, 1, 2);
      fxCtx.fillStyle = "#a8a8b8";
      fxCtx.fillRect(catX - 2, catY + 1 + tail, 2, 1); // 尾
      fxCtx.fillStyle = "#fff3c8";
      fxCtx.fillRect(catX + 6, catY, 1, 1); // 眼
    }
    // v669 廣場小鴨（程序像素 — 黃身＋橙嘴；偶發點頭；rm 定幀）
    // 錨點 x=295 y=176：豬 C(280,170)／貓(255,174) 右側錯開
    {
      const dx = 295, dy = 176;
      const bob = rm ? 0 : (Math.sin(t * 4.2) > 0.6 ? 1 : 0);
      fxCtx.fillStyle = "#ffd166";
      fxCtx.fillRect(dx, dy + bob, 7, 4); // 身
      fxCtx.fillRect(dx + 5, dy - 1 + bob, 4, 3); // 頭
      fxCtx.fillStyle = "#ff9a4a";
      fxCtx.fillRect(dx + 8, dy + bob, 2, 1); // 嘴
      fxCtx.fillStyle = "#5a5038";
      fxCtx.fillRect(dx + 1, dy + 4 + bob, 1, 2);
      fxCtx.fillRect(dx + 4, dy + 4 + bob, 1, 2);
      fxCtx.fillStyle = "#2a2a38";
      fxCtx.fillRect(dx + 7, dy + bob, 1, 1); // 眼
    }
    // v669 天空飛鳥群（3 隻「く」剪影右飄；rm 定幀）
    {
      const birds = [
        { x0: 40, y: 28, spd: 22, ph: 0 },
        { x0: 120, y: 42, spd: 18, ph: 0.4 },
        { x0: 220, y: 22, spd: 26, ph: 0.7 }
      ];
      const per = townPeriod();
      fxCtx.fillStyle = per === "day" ? "#3a4058" : (per === "dusk" ? "#2a2030" : "#1a1c28");
      for (const b of birds) {
        let bx = rm ? b.x0 : ((b.x0 + t * b.spd) % 520) - 20;
        const by = b.y + (rm ? 0 : Math.round(Math.sin(t * 3 + b.ph * 6.28) * 1));
        const flap = rm ? 0 : Math.floor(t * 8 + b.ph * 10) % 2;
        bx = Math.round(bx);
        fxCtx.fillRect(bx, by, 2, 1);
        fxCtx.fillRect(bx + 2, by + (flap ? -1 : 1), 2, 1);
        fxCtx.fillRect(bx - 2, by + (flap ? -1 : 1), 2, 1);
      }
    }
    // v657 市場蔬果攤（程序像素 — 棚＋桌＋3 貨物微晃；rm 定幀）
    // 錨點 x=338 y=168：祭壇[292]/市場[366] 間空地，避 CELLS ±6px 與豬 C(280)
    {
      const sx = 338, sy = 168;
      // 棚柱
      fxCtx.fillStyle = "#8a6238";
      fxCtx.fillRect(sx, sy - 10, 2, 16);
      fxCtx.fillRect(sx + 22, sy - 10, 2, 16);
      // 棚布（莓紅）
      fxCtx.fillStyle = "#e07070";
      fxCtx.fillRect(sx - 1, sy - 12, 26, 4);
      fxCtx.fillStyle = "#fff3c8"; // 左上高光
      fxCtx.fillRect(sx - 1, sy - 12, 8, 1);
      // 桌面
      fxCtx.fillStyle = "#c8a060";
      fxCtx.fillRect(sx + 1, sy + 2, 22, 3);
      // 貨物微晃（確定性）
      const goods = [
        { x: 4, c: "#ff7a6a", ph: 0 },    // 蘋果
        { x: 11, c: "#ffd166", ph: 0.37 }, // 麵包
        { x: 17, c: "#6ac8ff", ph: 0.71 }  // 瓶
      ];
      for (const g of goods) {
        const bob = rm ? 0 : Math.round(Math.sin(t * 3.1 + g.ph * 6.28) * 1);
        fxCtx.fillStyle = g.c;
        fxCtx.fillRect(sx + g.x, sy - 1 + bob, 4, 3);
        fxCtx.fillStyle = "rgba(255,255,255,0.4)";
        fxCtx.fillRect(sx + g.x, sy - 1 + bob, 1, 2);
      }
    }
    // v645 晾衣繩（倉庫南側空地 — 兩柱＋橫繩＋3 件衣物微擺；rm 定幀）
    // 錨點 x=155..215 y≈152：避開 CELLS 熱區(倉庫[144,116]/圖書館[70,116])±6px
    {
      const x0 = 155, x1 = 215, y = 152;
      fxCtx.fillStyle = "#8a6238"; // 木柱
      fxCtx.fillRect(x0 - 1, y - 2, 2, 18);
      fxCtx.fillRect(x1 - 1, y - 2, 2, 18);
      fxCtx.fillStyle = "#c8b090"; // 繩
      fxCtx.fillRect(x0, y, x1 - x0, 1);
      const cloths = [
        { x: 162, w: 6, h: 9, c: "#ff7a6a", ph: 0 },
        { x: 176, w: 7, h: 10, c: "#6ac8ff", ph: 0.37 },
        { x: 192, w: 5, h: 8, c: "#6fe0a8", ph: 0.71 }
      ];
      for (const cl of cloths) {
        const sway = rm ? 0 : Math.round(Math.sin(t * 2.6 + cl.ph * 6.28) * 1);
        fxCtx.fillStyle = cl.c;
        fxCtx.fillRect(cl.x + sway, y + 1, cl.w, cl.h);
        fxCtx.fillStyle = "rgba(255,255,255,0.35)"; // 左上高光 1px
        fxCtx.fillRect(cl.x + sway, y + 1, 1, Math.max(2, cl.h - 2));
      }
    }
    // v673 夜／黃昏窗暖光（建成建築正面 2 窗；day 不畫）
    {
      const per = townPeriod();
      if (per === "night" || per === "dusk") {
        const glow = per === "dusk" ? "rgba(255,200,120,0.55)" : "rgba(255,220,140,0.75)";
        for (const b of layout()) {
          if (b.locked || !(b.lvl > 0)) continue;
          const scale = b.scale, w = 32 * scale;
          const bx = b.x, by = b.y - (scale - 1.6) * 16;
          const wy = Math.round(by + w * 0.55);
          fxCtx.fillStyle = glow;
          fxCtx.fillRect(Math.round(bx + w * 0.28), wy, 3, 3);
          fxCtx.fillRect(Math.round(bx + w * 0.62), wy, 3, 3);
          if (!rm && per === "night") {
            const pulse = 0.15 + 0.1 * Math.sin(t * 2.4 + bx);
            fxCtx.fillStyle = "rgba(255,230,160," + pulse.toFixed(3) + ")";
            fxCtx.fillRect(Math.round(bx + w * 0.28) - 1, wy - 1, 5, 5);
          }
        }
      }
    }
    // v673 黃昏／夜螢火蟲（6 點漂浮；rm 定幀）
    {
      const per = townPeriod();
      if (per === "dusk" || per === "night") {
        for (let i = 0; i < 6; i++) {
          const baseX = 40 + i * 70 + (i % 3) * 8;
          const baseY = 90 + (i % 4) * 18;
          let fx = baseX, fy = baseY;
          if (!rm) {
            fx = baseX + Math.sin(t * 1.7 + i * 1.3) * 10;
            fy = baseY + Math.cos(t * 2.1 + i * 0.9) * 6;
          }
          const a = rm ? 0.7 : 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 5 + i));
          fxCtx.globalAlpha = a;
          fxCtx.fillStyle = "#ffe08a";
          fxCtx.fillRect(Math.round(fx), Math.round(fy), 2, 2);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v677 季節落物（春花瓣／秋落葉／冬細雪 — 夏不畫；rm 定幀）
    {
      const season = townSeason();
      if (season === "spring") {
        fxCtx.fillStyle = "#ff9ac8";
        for (let i = 0; i < 5; i++) {
          let px = 30 + i * 85, py = 40 + (i % 3) * 20;
          if (!rm) {
            px = (30 + i * 85 + t * (10 + i * 2)) % 500 - 10;
            py = 30 + ((t * (8 + i) + i * 40) % 140);
          }
          fxCtx.globalAlpha = rm ? 0.75 : 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 3 + i));
          fxCtx.fillRect(Math.round(px), Math.round(py), 2, 2);
          fxCtx.fillRect(Math.round(px) + 1, Math.round(py) + 1, 1, 1);
        }
        fxCtx.globalAlpha = 1;
      } else if (season === "autumn") {
        const leafC = ["#e07040", "#ffd166", "#c86030"];
        for (let i = 0; i < 5; i++) {
          let px = 50 + i * 80, py = 50 + (i % 2) * 24;
          if (!rm) {
            px = (50 + i * 80 + t * (8 + i * 1.5) + Math.sin(t * 2 + i) * 6) % 500 - 10;
            py = 35 + ((t * (7 + i * 0.8) + i * 50) % 145);
          }
          fxCtx.globalAlpha = rm ? 0.8 : 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.5 + i));
          fxCtx.fillStyle = leafC[i % 3];
          fxCtx.fillRect(Math.round(px), Math.round(py), 3, 2);
        }
        fxCtx.globalAlpha = 1;
      } else if (season === "winter") {
        fxCtx.fillStyle = "#e8f0ff";
        for (let i = 0; i < 8; i++) {
          let px = 20 + i * 55, py = 20 + (i % 4) * 16;
          if (!rm) {
            px = (20 + i * 55 + t * (6 + (i % 3))) % 500 - 8;
            py = 12 + ((t * (11 + i * 0.6) + i * 30) % 160);
          }
          fxCtx.globalAlpha = rm ? 0.85 : 0.5 + 0.45 * (0.5 + 0.5 * Math.sin(t * 4 + i * 0.7));
          fxCtx.fillRect(Math.round(px), Math.round(py), 2, 2);
        }
        fxCtx.globalAlpha = 1;
      } else if (season === "summer") {
        // v681：夏蜻蜓（3 隻細長剪影緩飛；rm 定幀）
        fxCtx.fillStyle = "#4a6a58";
        for (let i = 0; i < 3; i++) {
          let dx = 60 + i * 120, dy = 50 + i * 12;
          if (!rm) {
            dx = (60 + i * 120 + t * (14 + i * 3)) % 520 - 20;
            dy = 45 + i * 12 + Math.round(Math.sin(t * 2.2 + i) * 3);
          }
          const flap = rm ? 0 : Math.floor(t * 10 + i) % 2;
          dx = Math.round(dx); dy = Math.round(dy);
          fxCtx.fillRect(dx, dy, 3, 1); // 身
          fxCtx.fillRect(dx + 1, dy - 1 - flap, 2, 1); // 翅上
          fxCtx.fillRect(dx + 1, dy + 1 + flap, 2, 1); // 翅下
        }
      }
    }
    // v681 水井波光（錨 x≈181 y≈175 — 對齊 render 水井道具；rm 定幀）
    {
      const wx = 181, wy = 175;
      for (let i = 0; i < 3; i++) {
        const a = rm ? 0.55 : 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 3.5 + i * 2.1));
        fxCtx.globalAlpha = a;
        fxCtx.fillStyle = "#9ad8f0";
        const ox = rm ? (i - 1) * 3 : Math.round(Math.sin(t * 2 + i) * 2) + (i - 1) * 3;
        fxCtx.fillRect(wx + ox, wy + (i % 2), 2, 1);
      }
      fxCtx.globalAlpha = 1;
    }
    // v681 花圃蜜蜂（錨帶 x230..270 y160 — 對齊 flowers 道具；rm 定幀停花上）
    {
      const baseX = 248, baseY = 162;
      let bx = baseX, by = baseY;
      if (!rm) {
        const ph = (t / 3.5) % 1;
        bx = baseX + Math.sin(ph * 6.28) * 12;
        by = baseY + Math.cos(ph * 9.2) * 5;
      }
      bx = Math.round(bx); by = Math.round(by);
      fxCtx.fillStyle = "#ffd166";
      fxCtx.fillRect(bx, by, 3, 2); // 身
      fxCtx.fillStyle = "#2a2a38";
      fxCtx.fillRect(bx + 1, by, 1, 2); // 紋
      fxCtx.fillStyle = "rgba(200,220,255,0.7)";
      const flap = rm ? 0 : Math.floor(t * 12) % 2;
      fxCtx.fillRect(bx - 1, by - 1 - flap, 2, 1);
      fxCtx.fillRect(bx + 2, by - 1 - flap, 2, 1);
    }
    // v685 長椅麻雀（錨 bench@278 — 對齊 render props；2 隻佇／跳；rm 定幀）
    {
      const seats = [[276, 168, 0.0], [286, 169, 1.7]];
      for (let i = 0; i < seats.length; i++) {
        const s = seats[i];
        let sx = s[0], sy = s[1];
        if (!rm) {
          const hop = ((t * 1.8 + s[2]) % 3.2) < 0.35;
          if (hop) sy -= 2 + Math.floor((t * 14 + i) % 2);
          sx += Math.round(Math.sin(t * 0.7 + s[2]) * 1);
        }
        sx = Math.round(sx); sy = Math.round(sy);
        fxCtx.fillStyle = "#5a5048";
        fxCtx.fillRect(sx, sy, 3, 2); // 身
        fxCtx.fillStyle = "#2a2824";
        fxCtx.fillRect(sx + 2, sy, 1, 1); // 頭
        fxCtx.fillStyle = "#c87040";
        fxCtx.fillRect(sx + 3, sy, 1, 1); // 喙
      }
    }
    // v685 農田稻草人（左農田帶 x≈48 — 避雞 A@35；杆＋十字臂＋頭；rm 定幀）
    {
      const cx = 48, cy = 166;
      const sway = rm ? 0 : Math.round(Math.sin(t * 1.6) * 1);
      fxCtx.fillStyle = "#8a6a3a";
      fxCtx.fillRect(cx, cy - 14, 2, 14); // 杆
      fxCtx.fillRect(cx - 4 + sway, cy - 10, 10, 2); // 臂
      fxCtx.fillStyle = "#e8c878";
      fxCtx.fillRect(cx - 1 + sway, cy - 18, 4, 4); // 頭
      fxCtx.fillStyle = "#c86030";
      fxCtx.fillRect(cx - 2 + sway, cy - 19, 6, 2); // 帽檐
    }
    // v685 白天屋頂反光（day only — 與夜窗暖光對稱；建成建築屋頂 2 點；rm 恆亮）
    {
      const per = townPeriod();
      if (per === "day") {
        for (const b of layout()) {
          if (b.locked || !(b.lvl > 0)) continue;
          const scale = b.scale, w = 32 * scale;
          const bx = b.x, by = b.y - (scale - 1.6) * 16;
          const ry = Math.round(by + w * 0.18);
          const a = rm ? 0.55 : 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.8 + bx * 0.05));
          fxCtx.globalAlpha = a;
          fxCtx.fillStyle = "#fff8d0";
          fxCtx.fillRect(Math.round(bx + w * 0.32), ry, 2, 1);
          fxCtx.fillRect(Math.round(bx + w * 0.58), ry + 1, 2, 1);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v689 木桶老鼠（錨 barrel@97 — 對齊 render props；左右短竄；rm 定幀蹲桶旁）
    {
      const baseX = 102, baseY = 172;
      let mx = baseX, my = baseY;
      if (!rm) {
        const ph = (t / 2.8) % 1;
        mx = baseX + Math.round(Math.sin(ph * 6.28) * 8);
        my = baseY + ((ph > 0.35 && ph < 0.55) ? -1 : 0);
      }
      mx = Math.round(mx); my = Math.round(my);
      fxCtx.fillStyle = "#6a5a48";
      fxCtx.fillRect(mx, my, 4, 2); // 身
      fxCtx.fillStyle = "#4a4038";
      fxCtx.fillRect(mx + 3, my, 2, 2); // 頭
      fxCtx.fillStyle = "#8a7a68";
      fxCtx.fillRect(mx - 2, my + 1, 2, 1); // 尾
    }
    // v689 乾草飛絮（錨 hay@171 — 4 點輕飄；rm 定幀）
    {
      fxCtx.fillStyle = "#e8d090";
      for (let i = 0; i < 4; i++) {
        let px = 165 + i * 6, py = 155 + (i % 2) * 4;
        if (!rm) {
          px = 160 + i * 7 + Math.round(Math.sin(t * 1.4 + i) * 4);
          py = 150 + ((t * (6 + i) + i * 20) % 28);
        }
        fxCtx.globalAlpha = rm ? 0.7 : 0.4 + 0.4 * (0.5 + 0.5 * Math.sin(t * 3 + i));
        fxCtx.fillRect(Math.round(px), Math.round(py), 1, 1);
      }
      fxCtx.globalAlpha = 1;
    }
    // v689 夜間蝙蝠（night only — 3 隻「M」剪影緩飛；與螢火蟲分層；rm 定幀）
    {
      const per = townPeriod();
      if (per === "night") {
        fxCtx.fillStyle = "#2a2838";
        for (let i = 0; i < 3; i++) {
          let dx = 80 + i * 130, dy = 55 + i * 8;
          if (!rm) {
            dx = (80 + i * 130 + t * (18 + i * 4)) % 520 - 20;
            dy = 50 + i * 8 + Math.round(Math.sin(t * 3.5 + i) * 4);
          }
          const flap = rm ? 0 : Math.floor(t * 8 + i) % 2;
          dx = Math.round(dx); dy = Math.round(dy);
          fxCtx.fillRect(dx, dy, 2, 1); // 身
          fxCtx.fillRect(dx - 2 - flap, dy - 1, 2, 1); // 左翼
          fxCtx.fillRect(dx + 2 + flap, dy - 1, 2, 1); // 右翼
        }
      }
    }
    // v693 石堆蜥蜴（錨 stone@319 — 晒陽＋偶發短竄；rm 定幀趴石上）
    {
      const baseX = 322, baseY = 171;
      let lx = baseX, ly = baseY;
      if (!rm) {
        const ph = (t / 3.2) % 1;
        const dart = ph > 0.72 && ph < 0.88;
        lx = baseX + (dart ? Math.round(Math.sin(ph * 40) * 5) : Math.round(Math.sin(t * 0.6) * 1));
        ly = baseY + (dart ? -1 : 0);
      }
      lx = Math.round(lx); ly = Math.round(ly);
      fxCtx.fillStyle = "#6a8a58";
      fxCtx.fillRect(lx, ly, 5, 2); // 身
      fxCtx.fillStyle = "#4a6a40";
      fxCtx.fillRect(lx + 4, ly, 2, 2); // 頭
      fxCtx.fillStyle = "#8aaa70";
      fxCtx.fillRect(lx - 2, ly + 1, 2, 1); // 尾
    }
    // v693 水井青蛙（錨 well@181 — 井緣蹲＋偶發跳；rm 定幀）
    {
      const baseX = 188, baseY = 170;
      let fx = baseX, fy = baseY;
      if (!rm) {
        const hop = ((t * 1.4) % 4.5) < 0.45;
        fy = baseY - (hop ? 3 + Math.floor((t * 16) % 2) : 0);
        fx = baseX + Math.round(Math.sin(t * 0.5) * 1);
      }
      fx = Math.round(fx); fy = Math.round(fy);
      fxCtx.fillStyle = "#3a7a48";
      fxCtx.fillRect(fx, fy, 4, 3); // 身
      fxCtx.fillStyle = "#2a5a38";
      fxCtx.fillRect(fx + 1, fy - 1, 2, 2); // 頭
      fxCtx.fillStyle = "#c8e878";
      fxCtx.fillRect(fx + 1, fy, 1, 1); // 眼點
      fxCtx.fillRect(fx + 3, fy, 1, 1);
    }
    // v693 稻草人烏鴉（錨 scarecrow@48 肩 — 佇立＋振翅；rm 定幀）
    {
      const cx = 48, cy = 166;
      const sway = rm ? 0 : Math.round(Math.sin(t * 1.6) * 1);
      let bx = cx + 5 + sway, by = cy - 16;
      const flap = rm ? 0 : Math.floor(t * 6) % 2;
      if (!rm && ((t * 0.9) % 5.5) < 0.6) by -= 1;
      bx = Math.round(bx); by = Math.round(by);
      fxCtx.fillStyle = "#2a2830";
      fxCtx.fillRect(bx, by, 3, 2); // 身
      fxCtx.fillRect(bx + 2, by - 1, 2, 2); // 頭
      fxCtx.fillStyle = "#ffd166";
      fxCtx.fillRect(bx + 4, by, 1, 1); // 喙
      fxCtx.fillStyle = "#3a3848";
      fxCtx.fillRect(bx - 1 - flap, by, 2, 1); // 翼
      fxCtx.fillRect(bx + 2 + flap, by + 1, 2, 1);
    }
    // v697 右田野兔（錨右農田帶 x≈425 — 避雞 B@435；偶發跳；rm 定幀蹲）
    {
      const baseX = 418, baseY = 172;
      let rx = baseX, ry = baseY;
      if (!rm) {
        const hop = ((t * 1.1 + 0.7) % 5.2) < 0.4;
        ry = baseY - (hop ? 3 + Math.floor((t * 14) % 2) : 0);
        rx = baseX + Math.round(Math.sin(t * 0.45) * 2);
      }
      rx = Math.round(rx); ry = Math.round(ry);
      fxCtx.fillStyle = "#d8c8a8";
      fxCtx.fillRect(rx, ry, 4, 3); // 身
      fxCtx.fillStyle = "#c8b898";
      fxCtx.fillRect(rx + 3, ry - 1, 2, 2); // 頭
      fxCtx.fillStyle = "#ead8b8";
      fxCtx.fillRect(rx + 3, ry - 3, 1, 2); // 耳
      fxCtx.fillRect(rx + 5, ry - 3, 1, 2);
      fxCtx.fillStyle = "#b8a888";
      fxCtx.fillRect(rx - 1, ry + 1, 2, 1); // 尾
    }
    // v697 黃昏飛蛾（dusk only — 火把旁 3 隻灰褐點；與螢火蟲分層；rm 定幀）
    {
      const per = townPeriod();
      if (per === "dusk") {
        const torches = [];
        if ((st.buildings.castle || 0) > 0) torches.push(54);
        if ((st.buildings.guild || 0) > 0) torches.push(150);
        if (!torches.length) torches.push(100);
        fxCtx.fillStyle = "#c8b898";
        for (let i = 0; i < 3; i++) {
          const tx = torches[i % torches.length];
          let mx = tx + (i - 1) * 8, my = 108 + (i % 2) * 4;
          if (!rm) {
            mx = tx + Math.round(Math.sin(t * 4.2 + i * 1.7) * 10);
            my = 105 + Math.round(Math.cos(t * 3.1 + i) * 5) + (i % 2) * 3;
          }
          const flap = rm ? 0 : Math.floor(t * 11 + i) % 2;
          mx = Math.round(mx); my = Math.round(my);
          fxCtx.globalAlpha = rm ? 0.75 : 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(t * 6 + i));
          fxCtx.fillRect(mx, my, 2, 1);
          fxCtx.fillRect(mx - 1 - flap, my - 1, 1, 1);
          fxCtx.fillRect(mx + 2 + flap, my - 1, 1, 1);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v697 風車鴿子（錨風車 x≈440 — 2 隻緩飛／rm 定幀停屋頂）
    {
      for (let i = 0; i < 2; i++) {
        let px = 430 + i * 12, py = 78 + i * 6;
        if (!rm) {
          const ph = (t / 4.5 + i * 0.55) % 1;
          px = 428 + Math.sin(ph * 6.28) * 18 + i * 4;
          py = 72 + i * 5 + Math.cos(ph * 9) * 4;
        }
        px = Math.round(px); py = Math.round(py);
        const flap = rm ? 0 : Math.floor(t * 7 + i) % 2;
        fxCtx.fillStyle = "#b8b0a8";
        fxCtx.fillRect(px, py, 3, 2); // 身
        fxCtx.fillStyle = "#908880";
        fxCtx.fillRect(px + 2, py, 2, 2); // 頭
        fxCtx.fillStyle = "#d8d0c8";
        fxCtx.fillRect(px - 1 - flap, py - 1, 2, 1); // 翼
        fxCtx.fillRect(px + 2 + flap, py - 1, 2, 1);
      }
    }
    // v701 鐵匠火花（錨 forge 屋頂 — 橙黃點上飄；建成才畫；rm 定幀）
    {
      if ((st.buildings.forge || 0) > 0) {
        const fx0 = 290, fy0 = 68;
        fxCtx.fillStyle = "#ff9a4a";
        for (let i = 0; i < 4; i++) {
          let px = fx0 + (i - 1.5) * 3, py = fy0 - i * 3;
          if (!rm) {
            px = fx0 + Math.round(Math.sin(t * 5 + i * 1.3) * 4) + (i % 2) * 2;
            py = fy0 - ((t * (14 + i * 3) + i * 17) % 22);
          }
          fxCtx.globalAlpha = rm ? 0.7 : 0.4 + 0.45 * (0.5 + 0.5 * Math.sin(t * 7 + i));
          fxCtx.fillStyle = i % 2 ? "#ffd166" : "#ff7a2a";
          fxCtx.fillRect(Math.round(px), Math.round(py), 1, 1);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v701 倉庫夜貓頭鷹（night only — 錨 warehouse[218,116] 屋脊；佇立＋偶眨眼；rm 定幀）
    {
      const per = townPeriod();
      if (per === "night" && (st.buildings.warehouse || 0) > 0) {
        const ox = 232, oy = 98;
        const blink = !rm && ((t * 0.7) % 4.8) < 0.2;
        fxCtx.fillStyle = "#5a4a38";
        fxCtx.fillRect(ox, oy, 5, 4); // 身
        fxCtx.fillStyle = "#4a3a2c";
        fxCtx.fillRect(ox + 1, oy - 2, 3, 3); // 頭
        fxCtx.fillStyle = "#6a5a48";
        fxCtx.fillRect(ox, oy - 3, 2, 2); // 耳簇
        fxCtx.fillRect(ox + 3, oy - 3, 2, 2);
        if (!blink) {
          fxCtx.fillStyle = "#ffd166";
          fxCtx.fillRect(ox + 1, oy - 1, 1, 1);
          fxCtx.fillRect(ox + 3, oy - 1, 1, 1);
        }
        fxCtx.fillStyle = "#c89040";
        fxCtx.fillRect(ox + 2, oy, 1, 1); // 喙
      }
    }
    // v701 晾衣繩松鼠（錨 laundry x155–215 — 柱間短竄；避井蛙；rm 定幀蹲左柱旁）
    {
      const baseX = 160, baseY = 170;
      let sx = baseX, sy = baseY;
      if (!rm) {
        const ph = (t / 3.6) % 1;
        const dart = ph > 0.55 && ph < 0.85;
        sx = baseX + (dart ? Math.round((ph - 0.55) / 0.3 * 40) : Math.round(Math.sin(t * 0.5) * 1));
        sy = baseY + (dart ? -1 : 0);
      }
      sx = Math.round(sx); sy = Math.round(sy);
      fxCtx.fillStyle = "#c88848";
      fxCtx.fillRect(sx, sy, 4, 3); // 身
      fxCtx.fillStyle = "#a86830";
      fxCtx.fillRect(sx + 3, sy - 1, 2, 2); // 頭
      fxCtx.fillStyle = "#e8a868";
      fxCtx.fillRect(sx - 2, sy, 2, 2); // 尾蓬
      fxCtx.fillRect(sx - 3, sy - 1, 2, 2);
      fxCtx.fillStyle = "#2a2a28";
      fxCtx.fillRect(sx + 4, sy, 1, 1); // 眼
    }
    // v705 寶石工坊閃點（錨 gemworks[356,58] 屋頂 — 青藍微閃；建成才畫；rm 定幀）
    {
      if ((st.buildings.gemworks || 0) > 0) {
        const gx = 368, gy = 66;
        for (let i = 0; i < 4; i++) {
          let px = gx + (i - 1.5) * 4, py = gy + (i % 2);
          if (!rm) {
            px = gx + Math.round(Math.sin(t * 3.2 + i * 1.5) * 5) + i * 2;
            py = gy - Math.round(Math.abs(Math.sin(t * 4 + i)) * 3);
          }
          fxCtx.globalAlpha = rm ? 0.75 : 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * 8 + i * 2));
          fxCtx.fillStyle = i % 2 ? "#9ad8ff" : "#e8f4ff";
          fxCtx.fillRect(Math.round(px), Math.round(py), 1, 1);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v705 左花圃蝸牛（錨 flowers@97 — 慢爬；rm 定幀趴）
    {
      const baseX = 92, baseY = 174;
      let sx = baseX, sy = baseY;
      if (!rm) {
        const ph = (t / 8.5) % 1;
        sx = baseX + Math.round(ph * 18);
        sy = baseY + ((ph > 0.4 && ph < 0.55) ? -1 : 0);
      }
      sx = Math.round(sx); sy = Math.round(sy);
      fxCtx.fillStyle = "#8aaa70";
      fxCtx.fillRect(sx, sy, 4, 2); // 殼底
      fxCtx.fillStyle = "#c8a060";
      fxCtx.fillRect(sx + 1, sy - 2, 3, 3); // 殼
      fxCtx.fillStyle = "#6a8a58";
      fxCtx.fillRect(sx + 4, sy, 2, 1); // 頭伸
      fxCtx.fillStyle = "#2a3a28";
      fxCtx.fillRect(sx + 5, sy - 1, 1, 1); // 觸角點
    }
    // v705 祭壇香煙（錨 altar[292,116] — 淡灰煙縷；建成才畫；rm 定幀）
    {
      if ((st.buildings.altar || 0) > 0) {
        const ax = 304, ay = 102;
        fxCtx.fillStyle = "rgba(180,180,190,0.55)";
        for (let i = 0; i < 3; i++) {
          let px = ax + (i - 1) * 3, py = ay - i * 4;
          if (!rm) {
            px = ax + Math.round(Math.sin(t * 1.8 + i) * 3) + (i - 1) * 2;
            py = ay - ((t * (5 + i * 2) + i * 11) % 18);
          }
          fxCtx.globalAlpha = rm ? 0.5 : 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.5 + i));
          fxCtx.fillRect(Math.round(px), Math.round(py), 2, 2);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v709 圖書館書頁飄（錨 library[144,116] 屋脊 — 米色紙片；建成才畫；rm 定幀）
    {
      if ((st.buildings.library || 0) > 0) {
        const lx = 156, ly = 100;
        for (let i = 0; i < 3; i++) {
          let px = lx + (i - 1) * 5, py = ly - i * 3;
          if (!rm) {
            px = lx + Math.round(Math.sin(t * 1.4 + i * 1.7) * 6) + i * 3;
            py = ly - ((t * (3.5 + i) + i * 9) % 16);
          }
          fxCtx.globalAlpha = rm ? 0.7 : 0.4 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.2 + i));
          fxCtx.fillStyle = i % 2 ? "#e8d8b0" : "#f0e8d0";
          fxCtx.fillRect(Math.round(px), Math.round(py), 3, 2);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v709 市場掛燈搖（錨 market[366,116] 簷下 — 暖黃燈；建成才畫；rm 定幀）
    {
      if ((st.buildings.market || 0) > 0) {
        const mx = 378, my = 108;
        const sway = rm ? 0 : Math.round(Math.sin(t * 2.6) * 2);
        fxCtx.fillStyle = "#8a6a30";
        fxCtx.fillRect(mx + sway, my - 4, 1, 4); // 吊繩
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(mx - 2 + sway, my, 5, 4); // 燈體
        fxCtx.fillStyle = "#ff9a4a";
        fxCtx.fillRect(mx - 1 + sway, my + 1, 3, 2); // 熱核
        if (!rm) {
          fxCtx.globalAlpha = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin(t * 5));
          fxCtx.fillStyle = "#ffe08a";
          fxCtx.fillRect(mx - 3 + sway, my + 4, 7, 2); // 微光
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v709 訓練場木屑（錨 training[208,58] 場前 — 棕屑揚；建成才畫；rm 定幀）
    {
      if ((st.buildings.training || 0) > 0) {
        const tx = 220, ty = 98;
        for (let i = 0; i < 4; i++) {
          let px = tx + (i - 1.5) * 4, py = ty + (i % 2);
          if (!rm) {
            px = tx + Math.round(Math.sin(t * 4.5 + i * 1.3) * 7) + i * 2;
            py = ty - Math.round(Math.abs(Math.sin(t * 5.5 + i * 0.8)) * 5);
          }
          fxCtx.globalAlpha = rm ? 0.7 : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 6 + i));
          fxCtx.fillStyle = i % 2 ? "#a87848" : "#c89868";
          fxCtx.fillRect(Math.round(px), Math.round(py), 2, 1);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v713 煉金坊藥泡（錨 alchemy[70,116] 簷前 — 綠紫泡上升；建成才畫；rm 定幀）
    {
      if ((st.buildings.alchemy || 0) > 0) {
        const ax = 82, ay = 108;
        for (let i = 0; i < 3; i++) {
          let px = ax + (i - 1) * 4, py = ay - i * 3;
          if (!rm) {
            px = ax + Math.round(Math.sin(t * 2.1 + i * 1.4) * 4) + (i - 1) * 3;
            py = ay - ((t * (4 + i * 1.5) + i * 8) % 16);
          }
          fxCtx.globalAlpha = rm ? 0.7 : 0.4 + 0.4 * (0.5 + 0.5 * Math.sin(t * 3.5 + i));
          fxCtx.fillStyle = i % 2 ? "#7ee787" : "#c792ea";
          fxCtx.fillRect(Math.round(px), Math.round(py), 2, 2);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v713 酒館熱氣（錨 guild[134,58] 門楣 — 乳白蒸汽；建成才畫；rm 定幀）
    {
      if ((st.buildings.guild || 0) > 0) {
        const gx = 146, gy = 72;
        for (let i = 0; i < 3; i++) {
          let px = gx + (i - 1) * 3, py = gy - i * 3;
          if (!rm) {
            px = gx + Math.round(Math.sin(t * 1.6 + i) * 3) + (i - 1) * 2;
            py = gy - ((t * (3.5 + i) + i * 7) % 14);
          }
          fxCtx.globalAlpha = rm ? 0.45 : 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.8 + i));
          fxCtx.fillStyle = "#e8e8f0";
          fxCtx.fillRect(Math.round(px), Math.round(py), 2, 2);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v713 王城屋脊鴿（錨 castle[60,58] 塔頂 — 白鴿佇／振翅；建成才畫；rm 定幀）
    {
      if ((st.buildings.castle || 0) > 0) {
        const cx = 72, cy = 48;
        const flap = rm ? 0 : (Math.sin(t * 6) > 0.3 ? 1 : 0);
        fxCtx.fillStyle = "#f0f0f8";
        fxCtx.fillRect(cx, cy, 5, 3); // 身
        fxCtx.fillRect(cx + 4, cy - 1, 3, 2); // 頭
        fxCtx.fillStyle = "#c8c8d8";
        if (flap) {
          fxCtx.fillRect(cx - 2, cy - 1, 2, 2); // 左翅上
          fxCtx.fillRect(cx + 5, cy - 1, 2, 2); // 右翅上
        } else {
          fxCtx.fillRect(cx - 1, cy + 1, 2, 1);
          fxCtx.fillRect(cx + 4, cy + 1, 2, 1);
        }
        fxCtx.fillStyle = "#ff9a4a";
        fxCtx.fillRect(cx + 6, cy, 2, 1); // 嘴
        fxCtx.fillStyle = "#2a2a38";
        fxCtx.fillRect(cx + 5, cy - 1, 1, 1); // 眼
      }
    }
    // v717 倉庫白天揚塵（錨 warehouse[218,116] 簷下 — 米色塵點；建成＋白天；rm 定幀）
    {
      if ((st.buildings.warehouse || 0) > 0 && townPeriod() === "day") {
        const wx = 230, wy = 108;
        for (let i = 0; i < 4; i++) {
          let px = wx + (i - 1.5) * 4, py = wy + (i % 2);
          if (!rm) {
            px = wx + Math.round(Math.sin(t * 1.8 + i * 1.1) * 5) + i * 2;
            py = wy - ((t * (2.5 + i * 0.6) + i * 6) % 12);
          }
          fxCtx.globalAlpha = rm ? 0.55 : 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.4 + i));
          fxCtx.fillStyle = i % 2 ? "#d8c8a0" : "#e8dcc0";
          fxCtx.fillRect(Math.round(px), Math.round(py), 2, 2);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v717 祭壇燭火（錨 altar[292,116] 台前 — 暖橙焰芯；建成才畫；rm 定幀）
    {
      if ((st.buildings.altar || 0) > 0) {
        const ax = 304, ay = 108;
        const flicker = rm ? 0 : Math.round(Math.sin(t * 8) * 1);
        fxCtx.fillStyle = "#8a6a40";
        fxCtx.fillRect(ax, ay + 4, 2, 3); // 燭身
        fxCtx.fillStyle = "#ff9a4a";
        fxCtx.fillRect(ax - 1 + flicker, ay + flicker, 4, 3); // 焰外
        fxCtx.fillStyle = "#ffe08a";
        fxCtx.fillRect(ax + flicker, ay - 1 + flicker, 2, 2); // 焰芯
        if (!rm) {
          fxCtx.globalAlpha = 0.3 + 0.25 * (0.5 + 0.5 * Math.sin(t * 7));
          fxCtx.fillStyle = "#ffd166";
          fxCtx.fillRect(ax - 2, ay + 5, 6, 2); // 微光
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v717 鐵匠淬火白汽（錨 forge[282,58] 砧旁 — 乳白汽團；建成才畫；rm 定幀）
    {
      if ((st.buildings.forge || 0) > 0) {
        const fx0 = 294, fy0 = 88;
        for (let i = 0; i < 3; i++) {
          let px = fx0 + (i - 1) * 3, py = fy0 - i * 3;
          if (!rm) {
            px = fx0 + Math.round(Math.sin(t * 2.2 + i * 1.5) * 3) + (i - 1) * 2;
            py = fy0 - ((t * (4 + i) + i * 5) % 14);
          }
          fxCtx.globalAlpha = rm ? 0.5 : 0.2 + 0.4 * (0.5 + 0.5 * Math.sin(t * 3.2 + i));
          fxCtx.fillStyle = "#e8f0f8";
          fxCtx.fillRect(Math.round(px), Math.round(py), 2, 2);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v721 訓練場木人樁（錨 training[208,58] 場前 — 棕樁＋草頭；建成才畫；rm 定幀）
    {
      if ((st.buildings.training || 0) > 0) {
        const dx = 228, dy = 96;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(dx, dy, 3, 10); // 樁身
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(dx - 1, dy + 10, 5, 2); // 底座
        fxCtx.fillStyle = "#c8b070";
        fxCtx.fillRect(dx - 1, dy - 3, 5, 4); // 草頭
        fxCtx.fillStyle = "#5a7a38";
        fxCtx.fillRect(dx, dy - 4, 3, 2); // 草頂
        const hit = !rm && ((t * 1.7) % 2.4) < 0.18;
        if (hit || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#ffd166";
          fxCtx.fillRect(dx + 3, dy + 2, 2, 2); // 擊閃
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v721 市場果籃（錨 market[366,116] 簷前 — 編籃＋紅果；建成才畫；rm 定幀）
    {
      if ((st.buildings.market || 0) > 0) {
        const mx = 378, my = 148;
        const wob = rm ? 0 : Math.round(Math.sin(t * 2.6) * 1);
        fxCtx.fillStyle = "#a8804e";
        fxCtx.fillRect(mx, my + 3, 8, 4); // 籃身
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(mx + 1, my + 2, 6, 1); // 籃緣
        fxCtx.fillStyle = "#e05050";
        fxCtx.fillRect(mx + 1 + wob, my, 3, 3); // 紅果 A
        fxCtx.fillRect(mx + 4 - wob, my + 1, 3, 3); // 紅果 B
        fxCtx.fillStyle = "#7ec86a";
        fxCtx.fillRect(mx + 3, my - 1 + (rm ? 0 : Math.round(Math.sin(t * 3.1) * 1)), 2, 2); // 綠葉
      }
    }
    // v721 寶石工坊晶錐（錨 gemworks[356,58] 簷前 — 青晶脈動；建成才畫；rm 定幀）
    {
      if ((st.buildings.gemworks || 0) > 0) {
        const gx = 370, gy = 86;
        const pulse = rm ? 0.55 : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3.4));
        fxCtx.fillStyle = "#3a5a78";
        fxCtx.fillRect(gx + 1, gy + 6, 3, 3); // 座
        fxCtx.globalAlpha = pulse;
        fxCtx.fillStyle = "#6ac8ff";
        fxCtx.fillRect(gx + 1, gy + 2, 3, 4); // 晶身
        fxCtx.fillStyle = "#c8f0ff";
        fxCtx.fillRect(gx + 2, gy, 1, 3); // 尖
        fxCtx.fillRect(gx + 2, gy + 3, 1, 2); // 高光
        fxCtx.globalAlpha = 1;
      }
    }
    // v725 圖書館攤開書（錨 library[144,116] 簷前 — 米頁＋褐皮；建成才畫；rm 定幀）
    {
      if ((st.buildings.library || 0) > 0) {
        const bx = 156, by = 148;
        const flip = rm ? 0 : Math.round(Math.sin(t * 2.2) * 1);
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(bx, by + 3, 10, 2); // 書皮底
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(bx + 1, by + flip, 4, 4); // 左頁
        fxCtx.fillRect(bx + 5 - flip, by, 4, 4); // 右頁
        fxCtx.fillStyle = "#8a6a40";
        fxCtx.fillRect(bx + 4, by, 2, 5); // 書脊
        fxCtx.fillStyle = "#5a7a98";
        fxCtx.fillRect(bx + 2, by + 1 + flip, 2, 1); // 字行
        fxCtx.fillRect(bx + 6, by + 2, 2, 1);
      }
    }
    // v725 煉金坊藥瓶（錨 alchemy[70,116] 簷前 — 綠瓶＋微泡；建成才畫；rm 定幀）
    {
      if ((st.buildings.alchemy || 0) > 0) {
        const vx = 82, vy = 148;
        const bub = !rm && ((t * 2.8) % 1.6) < 0.5;
        fxCtx.fillStyle = "#4a6a58";
        fxCtx.fillRect(vx + 1, vy + 6, 4, 2); // 座
        fxCtx.fillStyle = "#3a8a5a";
        fxCtx.fillRect(vx + 1, vy + 2, 4, 5); // 瓶身
        fxCtx.fillStyle = "#7ec86a";
        fxCtx.fillRect(vx + 2, vy + 3, 2, 3); // 藥液
        fxCtx.fillStyle = "#c8e8d0";
        fxCtx.fillRect(vx + 2, vy, 2, 2); // 瓶頸
        if (bub || rm) {
          fxCtx.globalAlpha = rm ? 0.45 : 0.75;
          fxCtx.fillStyle = "#e8ffe8";
          fxCtx.fillRect(vx + 2, vy + 1, 1, 1); // 微泡
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v725 酒館門前酒杯（錨 guild[134,58] 門前 — 褐杯＋白沫；建成才畫；rm 定幀）
    {
      if ((st.buildings.guild || 0) > 0) {
        const mx = 148, my = 96;
        const wob = rm ? 0 : Math.round(Math.sin(t * 3.0) * 1);
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(mx, my + 3, 5, 5); // 杯身
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(mx - 1, my + 7, 7, 2); // 杯底
        fxCtx.fillStyle = "#d8a060";
        fxCtx.fillRect(mx + 1, my + 4, 3, 3); // 酒液
        fxCtx.fillStyle = "#f0f0e8";
        fxCtx.fillRect(mx + wob, my + 1, 5, 2); // 白沫
        fxCtx.fillStyle = "#c8c8b8";
        fxCtx.fillRect(mx + 1 + wob, my, 3, 1); // 沫頂
      }
    }
    // v729 倉庫木箱堆（錨 warehouse[218,116] 簷前 — 褐箱疊；建成才畫；rm 定幀）
    {
      if ((st.buildings.warehouse || 0) > 0) {
        const cx = 240, cy = 148;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(cx, cy + 4, 7, 5); // 下箱
        fxCtx.fillStyle = "#a8804e";
        fxCtx.fillRect(cx + 1, cy + 5, 5, 3);
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(cx + 3, cy + 4, 1, 5); // 箱縫
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(cx + 2, cy, 6, 5); // 上箱
        fxCtx.fillStyle = "#c8a060";
        fxCtx.fillRect(cx + 3, cy + 1, 4, 3);
        fxCtx.fillStyle = "#5a3a18";
        fxCtx.fillRect(cx + 4, cy, 1, 5);
      }
    }
    // v729 祭壇花束（錨 altar[292,116] 台側 — 粉瓣微晃；建成才畫；rm 定幀）
    {
      if ((st.buildings.altar || 0) > 0) {
        const fx0 = 318, fy0 = 148;
        const wob = rm ? 0 : Math.round(Math.sin(t * 2.4) * 1);
        fxCtx.fillStyle = "#5a7a38";
        fxCtx.fillRect(fx0 + 2, fy0 + 4, 2, 4); // 莖
        fxCtx.fillStyle = "#e878a0";
        fxCtx.fillRect(fx0 + wob, fy0, 3, 3); // 花 A
        fxCtx.fillRect(fx0 + 3 - wob, fy0 + 1, 3, 3); // 花 B
        fxCtx.fillStyle = "#ffd0e0";
        fxCtx.fillRect(fx0 + 1 + wob, fy0 + 1, 1, 1); // 芯
        fxCtx.fillStyle = "#7ec86a";
        fxCtx.fillRect(fx0 + 1, fy0 + 3, 2, 2); // 葉
      }
    }
    // v729 鐵匠砧（錨 forge[282,58] 場前 — 鐵灰砧座；建成才畫；rm 定幀）
    {
      if ((st.buildings.forge || 0) > 0) {
        const ax = 300, ay = 96;
        const spark = !rm && ((t * 2.1) % 2.8) < 0.2;
        fxCtx.fillStyle = "#4a4a58";
        fxCtx.fillRect(ax, ay + 4, 8, 3); // 砧面
        fxCtx.fillStyle = "#3a3a48";
        fxCtx.fillRect(ax + 2, ay + 7, 4, 3); // 腳
        fxCtx.fillStyle = "#6a6a78";
        fxCtx.fillRect(ax + 1, ay + 3, 6, 2); // 面亮
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(ax + 6, ay + 4, 3, 2); // 角
        if (spark || rm) {
          fxCtx.globalAlpha = rm ? 0.4 : 0.8;
          fxCtx.fillStyle = "#ffd166";
          fxCtx.fillRect(ax + 3, ay + 1, 2, 2); // 擊火
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v733 王城紋章盾（錨 castle[60,58] 門前 — 藍盾＋金紋；建成才畫；rm 定幀）
    {
      if ((st.buildings.castle || 0) > 0) {
        const sx = 82, sy = 94;
        fxCtx.fillStyle = "#3a5a9a";
        fxCtx.fillRect(sx + 1, sy, 6, 7); // 盾身
        fxCtx.fillStyle = "#2a4a7a";
        fxCtx.fillRect(sx + 2, sy + 7, 4, 2); // 尖底
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(sx + 3, sy + 2, 2, 3); // 金紋豎
        fxCtx.fillRect(sx + 2, sy + 3, 4, 1); // 金紋橫
        fxCtx.fillStyle = "#c8a040";
        fxCtx.fillRect(sx, sy + 1, 1, 5); // 左緣
        fxCtx.fillRect(sx + 7, sy + 1, 1, 5); // 右緣
      }
    }
    // v733 訓練場兵器架（錨 training[208,58] 場前 — 棕架＋交叉矛；建成才畫；rm 定幀）
    {
      if ((st.buildings.training || 0) > 0) {
        const rx = 232, ry = 94;
        const wob = rm ? 0 : Math.round(Math.sin(t * 1.8) * 1);
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(rx, ry + 6, 8, 2); // 架底
        fxCtx.fillRect(rx + 1, ry + 2, 2, 5); // 左柱
        fxCtx.fillRect(rx + 5, ry + 2, 2, 5); // 右柱
        fxCtx.fillStyle = "#a8a8b8";
        fxCtx.fillRect(rx + 1 + wob, ry, 2, 7); // 左矛
        fxCtx.fillRect(rx + 5 - wob, ry, 2, 7); // 右矛
        fxCtx.fillStyle = "#d0d0e0";
        fxCtx.fillRect(rx + wob, ry - 1, 3, 2); // 左刃
        fxCtx.fillRect(rx + 5 - wob, ry - 1, 3, 2); // 右刃
      }
    }
    // v733 圖書館墨水瓶（錨 library[144,116] 簷前 — 靛瓶＋羽筆；建成才畫；rm 定幀）
    {
      if ((st.buildings.library || 0) > 0) {
        const ix = 170, iy = 148;
        const drip = !rm && ((t * 1.6) % 3.2) < 0.25;
        fxCtx.fillStyle = "#3a3a6a";
        fxCtx.fillRect(ix, iy + 3, 5, 5); // 瓶身
        fxCtx.fillStyle = "#2a2a4a";
        fxCtx.fillRect(ix + 1, iy + 1, 3, 2); // 瓶頸
        fxCtx.fillStyle = "#5a5a9a";
        fxCtx.fillRect(ix + 1, iy + 4, 3, 3); // 墨液
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(ix + 4, iy, 1, 6); // 羽筆桿
        fxCtx.fillStyle = "#e8e0d0";
        fxCtx.fillRect(ix + 3, iy - 1, 3, 2); // 羽尖
        if (drip || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#4a4a8a";
          fxCtx.fillRect(ix + 2, iy + 8, 1, 2); // 墨滴
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v737 酒館木牌（錨 guild[134,58] 門前 — 褐牌＋金字點；建成才畫；rm 定幀）
    {
      if ((st.buildings.guild || 0) > 0) {
        const sx = 156, sy = 92;
        const sway = rm ? 0 : Math.round(Math.sin(t * 2.0) * 1);
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(sx + 3, sy - 2, 1, 4); // 掛鉤
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(sx + sway, sy + 2, 8, 7); // 牌身
        fxCtx.fillStyle = "#c8a060";
        fxCtx.fillRect(sx + 1 + sway, sy + 3, 6, 5); // 面
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(sx + 2 + sway, sy + 4, 4, 2); // 金字
        fxCtx.fillStyle = "#5a3a18";
        fxCtx.fillRect(sx + sway, sy + 2, 8, 1); // 上緣
      }
    }
    // v737 煉金研缽（錨 alchemy[70,116] 簷前 — 石缽＋杵；建成才畫；rm 定幀）
    {
      if ((st.buildings.alchemy || 0) > 0) {
        const mx = 94, my = 148;
        const grind = !rm && ((t * 1.9) % 2.6) < 0.3;
        fxCtx.fillStyle = "#7a7a88";
        fxCtx.fillRect(mx, my + 4, 7, 4); // 缽底
        fxCtx.fillStyle = "#9a9aa8";
        fxCtx.fillRect(mx + 1, my + 3, 5, 2); // 缽口
        fxCtx.fillStyle = "#5a5a68";
        fxCtx.fillRect(mx + 2, my + 5, 3, 2); // 內影
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(mx + 5, my, 2, 6); // 杵
        fxCtx.fillStyle = "#e8d0a0";
        fxCtx.fillRect(mx + 4, my - 1, 3, 2); // 杵頭
        if (grind || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#57c96b";
          fxCtx.fillRect(mx + 2, my + 2, 2, 1); // 藥粉
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v737 市場天秤（錨 market[366,116] 簷前 — 銅臂＋雙盤；建成才畫；rm 定幀）
    {
      if ((st.buildings.market || 0) > 0) {
        const bx = 390, by = 146;
        const tip = rm ? 0 : Math.round(Math.sin(t * 2.2) * 1);
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(bx + 3, by + 6, 2, 3); // 座
        fxCtx.fillStyle = "#c89040";
        fxCtx.fillRect(bx, by + 2 + tip, 8, 1); // 臂
        fxCtx.fillStyle = "#a87030";
        fxCtx.fillRect(bx + 3, by, 2, 3); // 柱
        fxCtx.fillStyle = "#d8a858";
        fxCtx.fillRect(bx - 1, by + 3 + tip, 3, 2); // 左盤
        fxCtx.fillRect(bx + 6, by + 3 - tip, 3, 2); // 右盤
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(bx + 4, by + 1, 1, 1); // 樞紐
      }
    }
    // v741 寶石工坊托盤（錨 gemworks[356,58] 簷前 — 木托＋青晶；建成才畫；rm 定幀）
    {
      if ((st.buildings.gemworks || 0) > 0) {
        const gx = 378, gy = 94;
        const twinkle = !rm && ((t * 2.4) % 2.2) < 0.35;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(gx, gy + 5, 9, 3); // 托盤
        fxCtx.fillStyle = "#c8a060";
        fxCtx.fillRect(gx + 1, gy + 4, 7, 2); // 面
        fxCtx.fillStyle = "#4ec4e8";
        fxCtx.fillRect(gx + 2, gy + 2, 2, 2); // 晶 A
        fxCtx.fillStyle = "#7ee0ff";
        fxCtx.fillRect(gx + 5, gy + 1, 2, 3); // 晶 B
        if (twinkle || rm) {
          fxCtx.globalAlpha = rm ? 0.4 : 0.85;
          fxCtx.fillStyle = "#ffffff";
          fxCtx.fillRect(gx + 3, gy + 1, 1, 1); // 閃
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v741 倉庫糧袋（錨 warehouse[218,116] 簷前 — 麻袋＋束口；建成才畫；rm 定幀）
    {
      if ((st.buildings.warehouse || 0) > 0) {
        const sx = 252, sy = 148;
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(sx, sy + 2, 7, 7); // 袋身
        fxCtx.fillStyle = "#a88858";
        fxCtx.fillRect(sx + 1, sy + 3, 5, 5); // 影
        fxCtx.fillStyle = "#8a6840";
        fxCtx.fillRect(sx + 1, sy, 5, 3); // 束口
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(sx + 2, sy + 1, 3, 1); // 繩
        fxCtx.fillStyle = "#e8d0a0";
        fxCtx.fillRect(sx + 2, sy + 4, 2, 2); // 亮
      }
    }
    // v741 鐵匠風箱（錨 forge[282,58] 場前 — 皮箱＋木柄；建成才畫；rm 定幀）
    {
      if ((st.buildings.forge || 0) > 0) {
        const bx = 312, by = 96;
        const puff = !rm && ((t * 1.7) % 2.4) < 0.3;
        fxCtx.fillStyle = "#5a3a28";
        fxCtx.fillRect(bx, by + 3, 8, 5); // 箱身
        fxCtx.fillStyle = "#8a5a40";
        fxCtx.fillRect(bx + 1, by + 4, 6, 3); // 皮面
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(bx + 7, by + 1, 2, 6); // 柄
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(bx + 6, by, 3, 2); // 柄頭
        if (puff || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.65;
          fxCtx.fillStyle = "#d8d0c8";
          fxCtx.fillRect(bx + 2, by, 3, 2); // 氣
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v745 祭壇銀供碗（錨 altar[292,116] 台前 — 銀碗＋金供；建成才畫；rm 定幀）
    {
      if ((st.buildings.altar || 0) > 0) {
        const ox = 318, oy = 148;
        const glint = !rm && ((t * 2.1) % 2.6) < 0.3;
        fxCtx.fillStyle = "#a8b0c0";
        fxCtx.fillRect(ox, oy + 4, 8, 3); // 碗身
        fxCtx.fillStyle = "#c8d0e0";
        fxCtx.fillRect(ox + 1, oy + 3, 6, 2); // 碗口
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(ox + 2, oy + 2, 4, 2); // 金供
        fxCtx.fillStyle = "#8a9098";
        fxCtx.fillRect(ox + 3, oy + 7, 2, 1); // 座
        if (glint || rm) {
          fxCtx.globalAlpha = rm ? 0.4 : 0.8;
          fxCtx.fillStyle = "#ffffff";
          fxCtx.fillRect(ox + 5, oy + 3, 1, 1); // 閃
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v745 圖書館捲軸堆（錨 library[144,116] 簷前 — 米捲＋褐帶；建成才畫；rm 定幀）
    {
      if ((st.buildings.library || 0) > 0) {
        const sx = 156, sy = 150;
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(sx, sy + 3, 7, 3); // 下捲
        fxCtx.fillRect(sx + 1, sy, 7, 3); // 上捲
        fxCtx.fillStyle = "#d0c4a8";
        fxCtx.fillRect(sx + 1, sy + 4, 5, 1); // 下影
        fxCtx.fillRect(sx + 2, sy + 1, 5, 1); // 上影
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(sx + 2, sy + 3, 3, 1); // 帶
        fxCtx.fillRect(sx + 3, sy, 3, 1); // 上帶
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(sx + 6, sy + 2, 2, 2); // 軸頭
      }
    }
    // v745 酒館橡木酒桶（錨 guild[134,58] 門側 — 桶身＋鐵箍；建成才畫；rm 定幀）
    {
      if ((st.buildings.guild || 0) > 0) {
        const kx = 148, ky = 98;
        const drip = !rm && ((t * 1.5) % 3.0) < 0.22;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(kx, ky + 1, 7, 8); // 桶身
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(kx + 1, ky + 2, 5, 6); // 面
        fxCtx.fillStyle = "#a8a8b0";
        fxCtx.fillRect(kx, ky + 3, 7, 1); // 箍上
        fxCtx.fillRect(kx, ky + 6, 7, 1); // 箍下
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(kx + 2, ky, 3, 2); // 塞
        if (drip || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#c8a040";
          fxCtx.fillRect(kx + 5, ky + 8, 1, 2); // 酒滴
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v749 訓練場水桶（錨 training[208,58] 場側 — 木桶＋水面；建成才畫；rm 定幀）
    {
      if ((st.buildings.training || 0) > 0) {
        const wx = 218, wy = 100;
        const ripple = !rm && ((t * 1.9) % 2.8) < 0.28;
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(wx, wy + 2, 7, 7); // 桶身
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(wx + 1, wy + 3, 5, 5); // 面
        fxCtx.fillStyle = "#4a8ab8";
        fxCtx.fillRect(wx + 1, wy + 1, 5, 2); // 水面
        fxCtx.fillStyle = "#a8a8b0";
        fxCtx.fillRect(wx, wy + 5, 7, 1); // 箍
        if (ripple || rm) {
          fxCtx.globalAlpha = rm ? 0.4 : 0.75;
          fxCtx.fillStyle = "#7ec8e8";
          fxCtx.fillRect(wx + 2, wy, 3, 1); // 波光
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v749 鐵匠掛鉗（錨 forge[282,58] 場側 — 鐵鉗＋掛釘；建成才畫；rm 定幀）
    {
      if ((st.buildings.forge || 0) > 0) {
        const tx = 298, ty = 90;
        const sway = rm ? 0 : Math.round(Math.sin(t * 2.2) * 1);
        fxCtx.fillStyle = "#6a6a78";
        fxCtx.fillRect(tx + 3, ty - 1, 2, 2); // 掛釘
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(tx + 1 + sway, ty + 1, 2, 7); // 左臂
        fxCtx.fillRect(tx + 4 + sway, ty + 1, 2, 7); // 右臂
        fxCtx.fillStyle = "#5a5a68";
        fxCtx.fillRect(tx + sway, ty + 7, 3, 2); // 左鉗口
        fxCtx.fillRect(tx + 4 + sway, ty + 7, 3, 2); // 右鉗口
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(tx + 2 + sway, ty + 3, 3, 2); // 樞
      }
    }
    // v749 市場價目板（錨 market[366,116] 簷側 — 木板＋ chalk 字點；建成才畫；rm 定幀）
    {
      if ((st.buildings.market || 0) > 0) {
        const cx = 390, cy = 146;
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(cx + 3, cy - 2, 1, 3); // 掛鉤
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(cx, cy + 1, 9, 8); // 板
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(cx + 1, cy + 2, 7, 6); // 面
        fxCtx.fillStyle = "#e8e0d0";
        fxCtx.fillRect(cx + 2, cy + 3, 5, 1); // 字行1
        fxCtx.fillRect(cx + 2, cy + 5, 4, 1); // 字行2
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(cx + 6, cy + 5, 1, 1); // 金點價
      }
    }
    // v753 煉金懸掛藥草（錨 alchemy[70,116] 簷側 — 綠束＋褐繩；建成才畫；rm 定幀）
    {
      if ((st.buildings.alchemy || 0) > 0) {
        const hx = 78, hy = 140;
        const sway = rm ? 0 : Math.round(Math.sin(t * 1.7) * 1);
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(hx + 3, hy - 2, 1, 3); // 掛釘
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(hx + 2 + sway, hy + 1, 3, 2); // 繩結
        fxCtx.fillStyle = "#3a9a4a";
        fxCtx.fillRect(hx + sway, hy + 3, 3, 5); // 葉左
        fxCtx.fillRect(hx + 4 + sway, hy + 3, 3, 5); // 葉右
        fxCtx.fillStyle = "#57c96b";
        fxCtx.fillRect(hx + 2 + sway, hy + 4, 3, 4); // 葉心
        fxCtx.fillStyle = "#2a7a38";
        fxCtx.fillRect(hx + 1 + sway, hy + 7, 5, 1); // 尖
      }
    }
    // v753 王城門側壁燈（錨 castle[60,58] 門右 — 鐵架＋暖焰；建成才畫；rm 定幀）
    {
      if ((st.buildings.castle || 0) > 0) {
        const lx = 98, ly = 90;
        const flicker = !rm && ((t * 3.1) % 1.8) < 0.4;
        fxCtx.fillStyle = "#5a5a68";
        fxCtx.fillRect(lx, ly + 2, 2, 6); // 支架
        fxCtx.fillStyle = "#6a6a78";
        fxCtx.fillRect(lx + 2, ly + 1, 5, 2); // 臂
        fxCtx.fillStyle = "#4a4a58";
        fxCtx.fillRect(lx + 5, ly + 3, 4, 5); // 燈籠框
        fxCtx.fillStyle = "#ff9a4d";
        fxCtx.fillRect(lx + 6, ly + 4, 2, 3); // 焰
        if (flicker || rm) {
          fxCtx.globalAlpha = rm ? 0.4 : 0.85;
          fxCtx.fillStyle = "#ffd166";
          fxCtx.fillRect(lx + 6, ly + 3, 2, 2); // 熱核
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v753 寶石工坊放大鏡（錨 gemworks[356,58] 簷側 — 銅柄＋青鏡；建成才畫；rm 定幀）
    {
      if ((st.buildings.gemworks || 0) > 0) {
        const gx = 366, gy = 92;
        const glint = !rm && ((t * 2.3) % 2.5) < 0.28;
        fxCtx.fillStyle = "#c89040";
        fxCtx.fillRect(gx, gy + 5, 6, 2); // 柄
        fxCtx.fillStyle = "#a87030";
        fxCtx.fillRect(gx + 5, gy + 1, 2, 5); // 接環
        fxCtx.fillStyle = "#4ec4e8";
        fxCtx.fillRect(gx + 5, gy, 5, 5); // 鏡框外
        fxCtx.fillStyle = "#7ee0ff";
        fxCtx.fillRect(gx + 6, gy + 1, 3, 3); // 鏡面
        if (glint || rm) {
          fxCtx.globalAlpha = rm ? 0.4 : 0.8;
          fxCtx.fillStyle = "#ffffff";
          fxCtx.fillRect(gx + 7, gy + 1, 1, 1); // 閃
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v757 倉庫木梯（錨 warehouse[218,116] 簷側 — 褐梯＋橫檔；建成才畫；rm 定幀）
    {
      if ((st.buildings.warehouse || 0) > 0) {
        const lx = 236, ly = 144;
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(lx, ly, 2, 10); // 左柱
        fxCtx.fillRect(lx + 5, ly, 2, 10); // 右柱
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(lx, ly + 2, 7, 1); // 檔1
        fxCtx.fillRect(lx, ly + 5, 7, 1); // 檔2
        fxCtx.fillRect(lx, ly + 8, 7, 1); // 檔3
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(lx + 1, ly + 2, 1, 1); // 亮
      }
    }
    // v757 祭壇香火（錨 altar[292,116] 台側 — 紫煙＋香桿；建成才畫；rm 定幀）
    {
      if ((st.buildings.altar || 0) > 0) {
        const ix = 332, iy = 146;
        const smoke = !rm && ((t * 1.8) % 2.4) < 0.35;
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(ix + 2, iy + 4, 2, 5); // 香桿
        fxCtx.fillStyle = "#a06ad8";
        fxCtx.fillRect(ix + 2, iy + 2, 2, 2); // 香頭
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(ix + 1, iy + 8, 4, 1); // 座
        if (smoke || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#d8b8f0";
          fxCtx.fillRect(ix + 1, iy, 2, 2); // 煙
          fxCtx.fillRect(ix + 3, iy - 1, 1, 2);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v757 市場果籃（錨 market[366,116] 簷前 — 藤籃＋紅果；建成才畫；rm 定幀）
    {
      if ((st.buildings.market || 0) > 0) {
        const bx = 376, by = 150;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(bx, by + 4, 8, 4); // 籃身
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(bx + 1, by + 3, 6, 2); // 沿
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(bx + 2, by + 2, 4, 1); // 提把影
        fxCtx.fillStyle = "#e05c5c";
        fxCtx.fillRect(bx + 1, by + 1, 2, 2); // 果A
        fxCtx.fillRect(bx + 4, by, 2, 2); // 果B
        fxCtx.fillStyle = "#ff9a4d";
        fxCtx.fillRect(bx + 3, by + 1, 2, 2); // 果C
      }
    }
    // v761 圖書館蠟燭（錨 library[144,116] 簷側 — 蠟柱＋暖焰；建成才畫；rm 定幀）
    {
      if ((st.buildings.library || 0) > 0) {
        const cx = 186, cy = 142;
        const flicker = !rm && ((t * 2.9) % 1.7) < 0.45;
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(cx + 2, cy + 4, 3, 6); // 蠟柱
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(cx + 1, cy + 9, 5, 2); // 座
        fxCtx.fillStyle = "#ff9a4d";
        fxCtx.fillRect(cx + 2, cy + 1, 3, 3); // 焰
        if (flicker || rm) {
          fxCtx.globalAlpha = rm ? 0.4 : 0.85;
          fxCtx.fillStyle = "#ffd166";
          fxCtx.fillRect(cx + 3, cy, 1, 2); // 熱核
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v761 鐵匠煤堆（錨 forge[282,58] 場側 — 炭灰＋餘燼；建成才畫；rm 定幀）
    {
      if ((st.buildings.forge || 0) > 0) {
        const cx = 286, cy = 102;
        const glow = !rm && ((t * 2.0) % 2.2) < 0.35;
        fxCtx.fillStyle = "#3a3a48";
        fxCtx.fillRect(cx, cy + 3, 8, 4); // 煤堆
        fxCtx.fillStyle = "#2a2a38";
        fxCtx.fillRect(cx + 1, cy + 5, 6, 2); // 底影
        fxCtx.fillStyle = "#5a5a68";
        fxCtx.fillRect(cx + 2, cy + 2, 3, 2); // 塊
        fxCtx.fillStyle = "#e05c3c";
        fxCtx.fillRect(cx + 4, cy + 3, 2, 2); // 餘燼
        if (glow || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.75;
          fxCtx.fillStyle = "#ff9a4d";
          fxCtx.fillRect(cx + 3, cy + 2, 2, 2); // 熱點
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v761 訓練場靶（錨 training[208,58] 場側 — 草靶＋紅心；建成才畫；rm 定幀）
    {
      if ((st.buildings.training || 0) > 0) {
        const tx = 248, ty = 98;
        const sway = rm ? 0 : Math.round(Math.sin(t * 1.6) * 1);
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(tx + 3, ty + 8, 2, 4); // 樁
        fxCtx.fillStyle = "#c8b070";
        fxCtx.fillRect(tx + sway, ty, 8, 8); // 靶面
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(tx + 1 + sway, ty + 1, 6, 6); // 內圈
        fxCtx.fillStyle = "#e05c5c";
        fxCtx.fillRect(tx + 3 + sway, ty + 3, 2, 2); // 紅心
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(tx + sway, ty, 8, 1); // 上緣
      }
    }
    // v765 酒館掃帚（錨 guild[134,58] 門側 — 褐柄＋草帚；建成才畫；rm 定幀）
    {
      if ((st.buildings.guild || 0) > 0) {
        const bx = 172, by = 100;
        const lean = rm ? 0 : Math.round(Math.sin(t * 1.4) * 1);
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(bx + 3 + lean, by, 2, 8); // 柄
        fxCtx.fillStyle = "#c8b070";
        fxCtx.fillRect(bx + lean, by + 7, 8, 4); // 帚頭
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(bx + 1 + lean, by + 8, 6, 2); // 束
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(bx + 2 + lean, by + 7, 2, 1); // 亮
      }
    }
    // v765 祭壇花束（錨 altar[292,116] 台側 — 綠莖＋粉瓣；建成才畫；rm 定幀）
    {
      if ((st.buildings.altar || 0) > 0) {
        const fx = 348, fy = 148;
        const bob = !rm && ((t * 2.1) % 2.6) < 0.3;
        fxCtx.fillStyle = "#3a7a48";
        fxCtx.fillRect(fx + 3, fy + 4, 2, 5); // 莖
        fxCtx.fillStyle = "#57c96b";
        fxCtx.fillRect(fx + 1, fy + 5, 2, 2); // 葉L
        fxCtx.fillRect(fx + 5, fy + 6, 2, 2); // 葉R
        fxCtx.fillStyle = "#e878a0";
        fxCtx.fillRect(fx + 1, fy + 1, 3, 3); // 瓣A
        fxCtx.fillRect(fx + 4, fy, 3, 3); // 瓣B
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(fx + 3, fy + 2, 2, 2); // 蕊
        if (bob || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#ffb0c8";
          fxCtx.fillRect(fx + 2, fy, 2, 1); // 亮瓣
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v765 倉庫木箱（錨 warehouse[218,116] 簷前 — 褐箱＋鐵釘；建成才畫；rm 定幀）
    {
      if ((st.buildings.warehouse || 0) > 0) {
        const cx = 252, cy = 150;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(cx, cy + 2, 9, 7); // 箱身
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(cx + 1, cy + 3, 7, 5); // 面
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(cx, cy + 1, 9, 2); // 蓋
        fxCtx.fillStyle = "#a8a8b0";
        fxCtx.fillRect(cx + 2, cy + 5, 1, 1); // 釘L
        fxCtx.fillRect(cx + 6, cy + 5, 1, 1); // 釘R
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(cx + 1, cy + 2, 3, 1); // 亮
      }
    }
    // v769 煉金藥瓶架（錨 alchemy[70,116] 簷前 — 木架＋綠／紫瓶；建成才畫；rm 定幀）
    {
      if ((st.buildings.alchemy || 0) > 0) {
        const rx = 100, ry = 146;
        const glint = !rm && ((t * 2.4) % 2.2) < 0.3;
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(rx, ry + 6, 10, 2); // 架底
        fxCtx.fillRect(rx + 1, ry + 2, 2, 5); // 左柱
        fxCtx.fillRect(rx + 7, ry + 2, 2, 5); // 右柱
        fxCtx.fillStyle = "#3a8a5a";
        fxCtx.fillRect(rx + 2, ry, 3, 5); // 綠瓶
        fxCtx.fillStyle = "#7ec86a";
        fxCtx.fillRect(rx + 3, ry + 1, 1, 3); // 綠液
        fxCtx.fillStyle = "#7a4aa8";
        fxCtx.fillRect(rx + 6, ry + 1, 3, 4); // 紫瓶
        fxCtx.fillStyle = "#c792ea";
        fxCtx.fillRect(rx + 7, ry + 2, 1, 2); // 紫液
        if (glint || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.75;
          fxCtx.fillStyle = "#e8ffe8";
          fxCtx.fillRect(rx + 3, ry, 1, 1); // 閃
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v769 王城豎旗（錨 castle[60,58] 門左 — 旗杆＋藍布；建成才畫；rm 定幀）
    {
      if ((st.buildings.castle || 0) > 0) {
        const fx = 70, fy = 86;
        const flap = rm ? 0 : Math.round(Math.sin(t * 2.0) * 1);
        fxCtx.fillStyle = "#5a5a68";
        fxCtx.fillRect(fx, fy, 2, 14); // 杆
        fxCtx.fillStyle = "#3a5a9a";
        fxCtx.fillRect(fx + 2, fy + 1 + flap, 7, 5); // 旗
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(fx + 3, fy + 2 + flap, 3, 2); // 金紋
        fxCtx.fillStyle = "#2a4a7a";
        fxCtx.fillRect(fx + 8 + flap, fy + 2, 2, 3); // 尾
      }
    }
    // v769 市場木凳（錨 market[366,116] 簷前 — 褐面＋腳；建成才畫；rm 定幀）
    {
      if ((st.buildings.market || 0) > 0) {
        const sx = 360, sy = 152;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(sx, sy + 2, 9, 2); // 面
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(sx + 1, sy + 4, 2, 4); // 左腳
        fxCtx.fillRect(sx + 6, sy + 4, 2, 4); // 右腳
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(sx + 1, sy + 1, 7, 2); // 面亮
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(sx + 2, sy + 2, 3, 1); // 高光
      }
    }
    // v773 寶石工坊紫晶架（錨 gemworks[356,58] 簷側 — 木座＋紫晶；建成才畫；rm 定幀）
    {
      if ((st.buildings.gemworks || 0) > 0) {
        const gx = 348, gy = 88;
        const spark = !rm && ((t * 2.1) % 2.4) < 0.28;
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(gx, gy + 8, 9, 2); // 座
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(gx + 1, gy + 6, 7, 2); // 座亮
        fxCtx.fillStyle = "#6a3a9a";
        fxCtx.beginPath();
        fxCtx.moveTo(gx + 4, gy);
        fxCtx.lineTo(gx + 8, gy + 5);
        fxCtx.lineTo(gx + 4, gy + 7);
        fxCtx.lineTo(gx, gy + 5);
        fxCtx.closePath();
        fxCtx.fill(); // 紫晶
        fxCtx.fillStyle = "#c792ea";
        fxCtx.fillRect(gx + 3, gy + 2, 2, 3); // 晶面
        if (spark || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.8;
          fxCtx.fillStyle = "#f0e8ff";
          fxCtx.fillRect(gx + 4, gy + 1, 1, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v773 訓練場水壺（錨 training[208,58] 場側 — 陶壺＋藍水；建成才畫；rm 定幀）
    {
      if ((st.buildings.training || 0) > 0) {
        const jx = 228, jy = 100;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(jx + 1, jy + 2, 6, 7); // 壺身
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(jx + 2, jy, 4, 2); // 壺口
        fxCtx.fillStyle = "#4a7aaa";
        fxCtx.fillRect(jx + 2, jy + 4, 4, 3); // 水
        fxCtx.fillStyle = "#7ab0d8";
        fxCtx.fillRect(jx + 3, jy + 5, 2, 1); // 水亮
        fxCtx.fillStyle = "#5a3a1a";
        fxCtx.fillRect(jx + 7, jy + 4, 2, 1); // 把
        fxCtx.fillRect(jx + 8, jy + 5, 1, 2);
      }
    }
    // v773 倉庫麻袋堆（錨 warehouse[218,116] 簷前 — 米袋＋縫線；建成才畫；rm 定幀）
    {
      if ((st.buildings.warehouse || 0) > 0) {
        const bx = 236, by = 148;
        fxCtx.fillStyle = "#c8b878";
        fxCtx.fillRect(bx, by + 3, 7, 6); // 後袋
        fxCtx.fillStyle = "#b8a868";
        fxCtx.fillRect(bx + 4, by + 5, 7, 6); // 前袋
        fxCtx.fillStyle = "#8a7040";
        fxCtx.fillRect(bx + 1, by + 5, 5, 1); // 縫
        fxCtx.fillRect(bx + 5, by + 7, 5, 1);
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(bx + 5, by + 6, 3, 2); // 亮
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(bx + 2, by + 2, 3, 2); // 綁口
        fxCtx.fillRect(bx + 6, by + 4, 3, 2);
      }
    }
    // v777 圖書館書立（錨 library[144,116] 簷側 — 褐立＋米書；建成才畫；rm 定幀）
    {
      if ((st.buildings.library || 0) > 0) {
        const ix = 160, iy = 140;
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(ix, iy + 2, 2, 8); // 左立
        fxCtx.fillRect(ix + 7, iy + 2, 2, 8); // 右立
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(ix + 1, iy + 8, 7, 2); // 底
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(ix + 2, iy + 3, 5, 5); // 書
        fxCtx.fillStyle = "#3a5a9a";
        fxCtx.fillRect(ix + 2, iy + 3, 1, 5); // 書脊
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(ix + 3, iy + 4, 3, 1); // 線
      }
    }
    // v777 鐵匠火鉗（錨 forge[282,58] 場側 — 灰鉗＋紅熱；建成才畫；rm 定幀）
    {
      if ((st.buildings.forge || 0) > 0) {
        const tx = 268, ty = 96;
        const glow = !rm && ((t * 2.6) % 2.0) < 0.35;
        fxCtx.fillStyle = "#6a6a78";
        fxCtx.fillRect(tx, ty + 2, 8, 2); // 柄
        fxCtx.fillRect(tx + 7, ty, 2, 5); // 鉗口
        fxCtx.fillStyle = "#ff6b4a";
        fxCtx.fillRect(tx + 8, ty + 1, 2, 3); // 熱端
        if (glow || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.75;
          fxCtx.fillStyle = "#ffd0a0";
          fxCtx.fillRect(tx + 8, ty + 1, 1, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v777 祭壇香爐（錨 altar[292,116] 台側 — 銅爐＋煙；建成才畫；rm 定幀）
    {
      if ((st.buildings.altar || 0) > 0) {
        const ax = 310, ay = 146;
        const smoke = rm ? 0 : Math.round(Math.sin(t * 1.8) * 1);
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(ax + 1, ay + 5, 6, 4); // 爐身
        fxCtx.fillStyle = "#c8a050";
        fxCtx.fillRect(ax, ay + 4, 8, 2); // 沿
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(ax + 2, ay + 8, 4, 2); // 腳
        fxCtx.fillStyle = "#b8b8c8";
        fxCtx.fillRect(ax + 3, ay + smoke, 2, 4); // 煙
        fxCtx.fillStyle = "#e8e8f0";
        fxCtx.fillRect(ax + 3, ay - 1 + smoke, 2, 2);
      }
    }
    // v781 酒館麵包板（錨 guild[134,58] 簷前 — 木板＋金黃麵包；建成才畫；rm 定幀）
    {
      if ((st.buildings.guild || 0) > 0) {
        const bx = 156, by = 112;
        const steam = !rm && ((t * 2.0) % 2.4) < 0.3;
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(bx, by + 6, 10, 2); // 板
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(bx + 1, by + 5, 8, 2); // 板亮
        fxCtx.fillStyle = "#d4a04a";
        fxCtx.fillRect(bx + 2, by + 2, 6, 4); // 麵包
        fxCtx.fillStyle = "#f0c878";
        fxCtx.fillRect(bx + 3, by + 3, 4, 2); // 麵包亮
        fxCtx.fillStyle = "#a87830";
        fxCtx.fillRect(bx + 4, by + 2, 2, 1); // 裂紋
        if (steam || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#fff8e8";
          fxCtx.fillRect(bx + 4, by, 2, 2); // 熱氣
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v781 王城門環（錨 castle[60,58] 門右 — 鐵環＋釘；建成才畫；rm 定幀）
    {
      if ((st.buildings.castle || 0) > 0) {
        const kx = 88, ky = 98;
        fxCtx.fillStyle = "#5a5a68";
        fxCtx.fillRect(kx + 3, ky + 1, 2, 2); // 釘心
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(kx + 1, ky, 6, 2); // 環上
        fxCtx.fillRect(kx, ky + 2, 2, 5); // 環左
        fxCtx.fillRect(kx + 6, ky + 2, 2, 5); // 環右
        fxCtx.fillRect(kx + 1, ky + 6, 6, 2); // 環下
        fxCtx.fillStyle = "#c8c8d0";
        fxCtx.fillRect(kx + 2, ky + 1, 2, 1); // 高光
      }
    }
    // v781 市場錢袋（錨 market[366,116] 簷側 — 褐袋＋金口；建成才畫；rm 定幀）
    {
      if ((st.buildings.market || 0) > 0) {
        const px = 400, py = 138;
        const glint = !rm && ((t * 2.3) % 2.2) < 0.28;
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(px + 1, py + 3, 7, 7); // 袋身
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(px + 2, py + 4, 5, 4); // 袋亮
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(px + 2, py + 1, 5, 3); // 金口／繩
        fxCtx.fillStyle = "#c8a050";
        fxCtx.fillRect(px + 3, py, 3, 2); // 束口
        if (glint || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.8;
          fxCtx.fillStyle = "#fff0b0";
          fxCtx.fillRect(px + 4, py + 2, 1, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v785 煉金藥草束（錨 alchemy[70,116] 簷側 — 綠莖＋葉；建成才畫；rm 定幀）
    {
      if ((st.buildings.alchemy || 0) > 0) {
        const hx = 78, hy = 128;
        const sway = rm ? 0 : Math.round(Math.sin(t * 1.6) * 1);
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(hx + 3, hy + 8, 4, 2); // 束帶
        fxCtx.fillStyle = "#3a7a48";
        fxCtx.fillRect(hx + 4 + sway, hy + 2, 2, 7); // 莖
        fxCtx.fillStyle = "#57c96b";
        fxCtx.fillRect(hx + 1 + sway, hy + 1, 3, 3); // 葉L
        fxCtx.fillRect(hx + 6 + sway, hy + 2, 3, 3); // 葉R
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(hx + 2, hy + 9, 6, 1); // 底
        fxCtx.globalAlpha = rm ? 0.4 : 0.75;
        fxCtx.fillStyle = "#a8e878";
        fxCtx.fillRect(hx + 3 + sway, hy, 2, 2); // 嫩尖
        fxCtx.globalAlpha = 1;
      }
    }
    // v785 訓練場劍架（錨 training[208,58] 場側 — 木架＋銀刃；建成才畫；rm 定幀）
    {
      if ((st.buildings.training || 0) > 0) {
        const sx = 252, sy = 110;
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(sx, sy + 6, 10, 2); // 架底
        fxCtx.fillRect(sx + 1, sy + 2, 2, 5); // 左柱
        fxCtx.fillRect(sx + 7, sy + 2, 2, 5); // 右柱
        fxCtx.fillStyle = "#c8c8d0";
        fxCtx.fillRect(sx + 3, sy, 2, 8); // 刃
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(sx + 2, sy + 7, 4, 2); // 護手
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(sx + 3, sy + 8, 2, 2); // 柄
        fxCtx.fillStyle = "#e8e8f0";
        fxCtx.fillRect(sx + 3, sy + 1, 1, 3); // 刃亮
      }
    }
    // v785 寶石工坊放大鏡（錨 gemworks[356,58] 簷前 — 銅柄＋青鏡；建成才畫；rm 定幀）
    {
      if ((st.buildings.gemworks || 0) > 0) {
        const lx = 418, ly = 80;
        const spark = !rm && ((t * 2.2) % 2.3) < 0.28;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(lx + 6, ly + 5, 5, 2); // 柄
        fxCtx.fillStyle = "#c8a050";
        fxCtx.fillRect(lx + 5, ly + 4, 2, 3); // 柄接
        fxCtx.fillStyle = "#4da3ff";
        fxCtx.fillRect(lx, ly + 1, 6, 6); // 鏡框外
        fxCtx.fillStyle = "#a8d4ff";
        fxCtx.fillRect(lx + 1, ly + 2, 4, 4); // 鏡面
        fxCtx.fillStyle = "#e8f4ff";
        fxCtx.fillRect(lx + 2, ly + 3, 2, 2); // 高光
        if (spark || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.8;
          fxCtx.fillStyle = "#ffffff";
          fxCtx.fillRect(lx + 3, ly + 2, 1, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v789 圖書館捲軸（錨 library[144,116] 簷前 — 米軸＋藍帶；建成才畫；rm 定幀）
    {
      if ((st.buildings.library || 0) > 0) {
        const rx = 148, ry = 126;
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(rx + 1, ry + 2, 8, 5); // 紙
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(rx, ry + 1, 2, 7); // 左軸
        fxCtx.fillRect(rx + 8, ry + 1, 2, 7); // 右軸
        fxCtx.fillStyle = "#3a5a9a";
        fxCtx.fillRect(rx + 3, ry + 3, 4, 1); // 字線
        fxCtx.fillRect(rx + 3, ry + 5, 3, 1);
        fxCtx.fillStyle = "#4da3ff";
        fxCtx.fillRect(rx + 4, ry, 2, 2); // 藍帶結
      }
    }
    // v789 鐵匠馬蹄鐵（錨 forge[282,58] 牆側 — 灰鐵＋釘孔；建成才畫；rm 定幀）
    {
      if ((st.buildings.forge || 0) > 0) {
        const hx = 290, hy = 100;
        const glow = !rm && ((t * 2.4) % 2.1) < 0.3;
        fxCtx.fillStyle = "#6a6a78";
        fxCtx.fillRect(hx, hy + 2, 2, 6); // 左腳
        fxCtx.fillRect(hx + 6, hy + 2, 2, 6); // 右腳
        fxCtx.fillRect(hx, hy, 8, 3); // 弧頂
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(hx + 1, hy + 1, 6, 2); // 弧亮
        fxCtx.fillStyle = "#4a4a58";
        fxCtx.fillRect(hx + 2, hy + 2, 1, 1); // 釘
        fxCtx.fillRect(hx + 5, hy + 2, 1, 1);
        if (glow || rm) {
          fxCtx.globalAlpha = rm ? 0.3 : 0.65;
          fxCtx.fillStyle = "#ffd0a0";
          fxCtx.fillRect(hx + 3, hy, 2, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v789 倉庫木桶（錨 warehouse[218,116] 簷側 — 褐桶＋鐵箍；建成才畫；rm 定幀）
    {
      if ((st.buildings.warehouse || 0) > 0) {
        const bx = 210, by = 140;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(bx + 1, by + 1, 8, 9); // 桶身
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(bx, by + 2, 10, 2); // 上箍
        fxCtx.fillRect(bx, by + 6, 10, 2); // 下箍
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(bx + 2, by + 3, 2, 3); // 亮條
        fxCtx.fillStyle = "#a8a8b0";
        fxCtx.fillRect(bx + 4, by, 2, 2); // 塞
      }
    }
    // v793 祭壇銅鈴（錨 altar[292,116] 台側 — 銅鈴＋繩；建成才畫；rm 定幀）
    {
      if ((st.buildings.altar || 0) > 0) {
        const bx = 328, by = 132;
        const ring = !rm && ((t * 2.8) % 2.4) < 0.25;
        fxCtx.fillStyle = "#8a6a38";
        fxCtx.fillRect(bx + 3, by, 2, 3); // 繩
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(bx + 1, by + 3, 6, 4); // 鈴身
        fxCtx.fillStyle = "#f0d080";
        fxCtx.fillRect(bx + 2, by + 4, 2, 2); // 亮
        fxCtx.fillStyle = "#c89040";
        fxCtx.fillRect(bx + 3, by + 7, 2, 2); // 舌
        if (ring || rm) {
          fxCtx.globalAlpha = rm ? 0.3 : 0.55;
          fxCtx.fillStyle = "#ffe8a0";
          fxCtx.fillRect(bx, by + 5, 1, 1);
          fxCtx.fillRect(bx + 7, by + 5, 1, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v793 酒館陶杯（錨 guild[134,58] 簷前 — 褐杯＋白沫；建成才畫；rm 定幀）
    {
      if ((st.buildings.guild || 0) > 0) {
        const mx = 172, my = 98;
        fxCtx.fillStyle = "#8a5a38";
        fxCtx.fillRect(mx + 1, my + 2, 6, 6); // 杯身
        fxCtx.fillStyle = "#6a4028";
        fxCtx.fillRect(mx, my + 3, 1, 4); // 左緣
        fxCtx.fillRect(mx + 7, my + 3, 1, 4); // 右緣
        fxCtx.fillStyle = "#f0e8d0";
        fxCtx.fillRect(mx + 2, my + 1, 4, 2); // 沫
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(mx + 2, my + 4, 2, 2); // 亮
      }
    }
    // v793 寶石托盤（錨 gemworks[356,58] 簷側 — 木盤＋青／粉寶石；建成才畫；rm 定幀）
    {
      if ((st.buildings.gemworks || 0) > 0) {
        const gx = 398, gy = 94;
        const spark = !rm && ((t * 2.2) % 2.0) < 0.28;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(gx, gy + 4, 10, 3); // 盤
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(gx + 1, gy + 3, 8, 1); // 盤緣
        fxCtx.fillStyle = "#4da3ff";
        fxCtx.fillRect(gx + 2, gy + 1, 3, 3); // 青寶
        fxCtx.fillStyle = "#ff7ab8";
        fxCtx.fillRect(gx + 6, gy + 1, 3, 3); // 粉寶
        if (spark || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.75;
          fxCtx.fillStyle = "#ffffff";
          fxCtx.fillRect(gx + 3, gy + 1, 1, 1);
          fxCtx.fillRect(gx + 7, gy + 2, 1, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v797 市場木箱（錨 market[366,116] 簷側 — 褐箱＋鎖；建成才畫；rm 定幀）
    {
      if ((st.buildings.market || 0) > 0) {
        const cx = 382, cy = 128;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(cx + 1, cy + 2, 9, 7); // 箱身
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(cx, cy + 1, 11, 2); // 蓋
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(cx + 2, cy + 3, 2, 4); // 亮
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(cx + 5, cy + 4, 2, 2); // 鎖
      }
    }
    // v797 王城門匾（錨 castle[60,58] 門上 — 藍匾＋金邊；建成才畫；rm 定幀）
    {
      if ((st.buildings.castle || 0) > 0) {
        const px = 70, py = 104;
        fxCtx.fillStyle = "#3a5a9a";
        fxCtx.fillRect(px + 1, py + 1, 10, 5); // 匾
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(px, py, 12, 1); // 金邊上
        fxCtx.fillRect(px, py + 6, 12, 1); // 金邊下
        fxCtx.fillStyle = "#f0d080";
        fxCtx.fillRect(px + 3, py + 2, 2, 2); // 字點
        fxCtx.fillRect(px + 7, py + 2, 2, 2);
      }
    }
    // v797 訓練場圓盾（錨 training[208,58] 場側 — 木盾＋鐵心；建成才畫；rm 定幀）
    {
      if ((st.buildings.training || 0) > 0) {
        const sx = 235, sy = 100;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(sx + 1, sy + 1, 8, 8); // 盾面
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(sx, sy, 10, 2); // 上緣
        fxCtx.fillRect(sx, sy + 8, 10, 2); // 下緣
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(sx + 3, sy + 3, 4, 4); // 鐵心
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(sx + 2, sy + 2, 2, 2); // 亮
      }
    }
    // v801 煉金燒瓶（錨 alchemy[70,116] 簷前 — 綠瓶＋氣泡；建成才畫；rm 定幀）
    {
      if ((st.buildings.alchemy || 0) > 0) {
        const fx = 100, fy = 140;
        const bub = !rm && ((t * 2.6) % 2.2) < 0.3;
        fxCtx.fillStyle = "#4a8a58";
        fxCtx.fillRect(fx + 2, fy + 3, 6, 7); // 瓶身
        fxCtx.fillStyle = "#2a5a38";
        fxCtx.fillRect(fx + 3, fy + 1, 4, 3); // 頸
        fxCtx.fillStyle = "#57c96b";
        fxCtx.fillRect(fx + 3, fy + 5, 4, 3); // 藥液
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(fx + 2, fy, 6, 2); // 塞
        if (bub || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#c8f5d0";
          fxCtx.fillRect(fx + 4, fy + 4, 1, 1);
          fxCtx.fillRect(fx + 6, fy + 6, 1, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v801 倉庫糧袋（錨 warehouse[218,116] 簷側 — 米袋＋束口；建成才畫；rm 定幀）
    {
      if ((st.buildings.warehouse || 0) > 0) {
        const sx = 248, sy = 136;
        fxCtx.fillStyle = "#c8b878";
        fxCtx.fillRect(sx + 1, sy + 2, 9, 8); // 袋身
        fxCtx.fillStyle = "#a89858";
        fxCtx.fillRect(sx, sy + 1, 11, 2); // 束口
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(sx + 4, sy, 3, 2); // 結
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(sx + 3, sy + 4, 2, 3); // 亮
      }
    }
    // v801 圖書館墨水瓶（錨 library[144,116] 簷側 — 藍瓶＋羽筆；建成才畫；rm 定幀）
    {
      if ((st.buildings.library || 0) > 0) {
        const ix = 175, iy = 138;
        fxCtx.fillStyle = "#3a5a9a";
        fxCtx.fillRect(ix + 2, iy + 4, 5, 6); // 瓶
        fxCtx.fillStyle = "#2a3a6a";
        fxCtx.fillRect(ix + 3, iy + 3, 3, 2); // 口
        fxCtx.fillStyle = "#1a2a4a";
        fxCtx.fillRect(ix + 3, iy + 6, 3, 2); // 墨
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(ix + 7, iy + 1, 2, 8); // 羽筆桿
        fxCtx.fillStyle = "#e8e8f0";
        fxCtx.fillRect(ix + 6, iy, 4, 2); // 羽
      }
    }
    // v805 酒館酒桶（錨 guild[134,58] 簷側 — 褐桶＋銅栓；建成才畫；rm 定幀）
    {
      if ((st.buildings.guild || 0) > 0) {
        const kx = 158, ky = 112;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(kx + 1, ky + 1, 9, 10); // 桶
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(kx, ky + 3, 11, 2); // 箍
        fxCtx.fillRect(kx, ky + 7, 11, 2);
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(kx + 9, ky + 5, 3, 2); // 栓
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(kx + 3, ky + 4, 2, 3); // 亮
      }
    }
    // v805 鐵匠鐵錘（錨 forge[282,58] 場前 — 灰錘＋木柄；建成才畫；rm 定幀）
    {
      if ((st.buildings.forge || 0) > 0) {
        const hx = 305, hy = 118;
        const glow = !rm && ((t * 2.5) % 2.2) < 0.28;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(hx + 3, hy + 3, 2, 8); // 柄
        fxCtx.fillStyle = "#6a6a78";
        fxCtx.fillRect(hx, hy, 8, 4); // 錘頭
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(hx + 1, hy + 1, 6, 2); // 亮
        if (glow || rm) {
          fxCtx.globalAlpha = rm ? 0.3 : 0.65;
          fxCtx.fillStyle = "#ffd0a0";
          fxCtx.fillRect(hx + 2, hy, 4, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v805 祭壇供果（錨 altar[292,116] 台前 — 金盤＋紅果；建成才畫；rm 定幀）
    {
      if ((st.buildings.altar || 0) > 0) {
        const ox = 310, oy = 145;
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(ox, oy + 5, 10, 3); // 盤
        fxCtx.fillStyle = "#c89040";
        fxCtx.fillRect(ox + 1, oy + 4, 8, 1); // 盤緣
        fxCtx.fillStyle = "#e05c5c";
        fxCtx.fillRect(ox + 2, oy + 1, 3, 3); // 果L
        fxCtx.fillRect(ox + 6, oy + 2, 3, 3); // 果R
        fxCtx.fillStyle = "#3a7a48";
        fxCtx.fillRect(ox + 3, oy, 2, 2); // 葉
      }
    }
    // v809 王城門旗（錨 castle[60,58] 門側 — 藍旗＋金桿；建成才畫；rm 定幀）
    {
      if ((st.buildings.castle || 0) > 0) {
        const px = 88, py = 118;
        const sway = rm ? 0 : Math.sin(t * 2.1) * 0.6;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(px, py, 2, 12); // 桿
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(px - 1, py, 4, 1); // 金頂
        fxCtx.fillStyle = "#3a5a9a";
        fxCtx.fillRect(px + 2, py + 1 + sway, 8, 5); // 旗
        fxCtx.fillStyle = "#f0d080";
        fxCtx.fillRect(px + 4, py + 2 + sway, 2, 2); // 金點
      }
    }
    // v809 訓練場木劍（錨 training[208,58] 場側 — 褐柄＋灰刃；建成才畫；rm 定幀）
    {
      if ((st.buildings.training || 0) > 0) {
        const sx = 250, sy = 108;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(sx + 3, sy + 5, 2, 7); // 柄
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(sx + 1, sy + 4, 6, 2); // 鍔
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(sx + 2, sy, 4, 5); // 刃
        fxCtx.fillStyle = "#c8c8d0";
        fxCtx.fillRect(sx + 3, sy + 1, 1, 3); // 亮
      }
    }
    // v809 市場天秤（錨 market[366,116] 簷前 — 銅盤＋木臂；建成才畫；rm 定幀）
    {
      if ((st.buildings.market || 0) > 0) {
        const mx = 400, my = 142;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(mx + 4, my + 2, 2, 8); // 柱
        fxCtx.fillRect(mx, my + 2, 10, 2); // 臂
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(mx, my + 4, 3, 2); // 盤L
        fxCtx.fillRect(mx + 7, my + 4, 3, 2); // 盤R
        fxCtx.fillStyle = "#c89040";
        fxCtx.fillRect(mx + 4, my, 2, 2); // 樞
      }
    }
    // v813 煉金研缽（錨 alchemy[70,116] 簷前 — 石缽＋杵；建成才畫；rm 定幀）
    {
      if ((st.buildings.alchemy || 0) > 0) {
        const ax = 115, ay = 155;
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(ax + 1, ay + 4, 9, 5); // 缽
        fxCtx.fillStyle = "#6a6a78";
        fxCtx.fillRect(ax, ay + 3, 11, 2); // 緣
        fxCtx.fillStyle = "#57c96b";
        fxCtx.fillRect(ax + 3, ay + 5, 4, 2); // 藥末
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(ax + 8, ay, 2, 7); // 杵
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(ax + 7, ay, 4, 2); // 杵頭
      }
    }
    // v813 圖書館卷軸（錨 library[144,116] 簷側 — 米色卷＋褐帶；建成才畫；rm 定幀）
    {
      if ((st.buildings.library || 0) > 0) {
        const lx = 190, ly = 148;
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(lx + 1, ly + 2, 10, 6); // 卷
        fxCtx.fillStyle = "#c8b878";
        fxCtx.fillRect(lx, ly + 1, 2, 8); // 軸L
        fxCtx.fillRect(lx + 10, ly + 1, 2, 8); // 軸R
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(lx + 4, ly + 3, 4, 2); // 帶
        fxCtx.fillStyle = "#3a5a9a";
        fxCtx.fillRect(lx + 5, ly + 5, 3, 1); // 字線
      }
    }
    // v813 寶石工坊放大鏡（錨 gemworks[356,58] 簷側 — 銅圈＋柄；建成才畫；rm 定幀）
    {
      if ((st.buildings.gemworks || 0) > 0) {
        const gx = 370, gy = 100;
        const spark = !rm && ((t * 2.4) % 2.1) < 0.26;
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(gx + 1, gy + 1, 7, 7); // 框
        fxCtx.fillStyle = "#4da3ff";
        fxCtx.fillRect(gx + 2, gy + 2, 5, 5); // 鏡
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(gx + 7, gy + 7, 2, 5); // 柄
        if (spark || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#ffffff";
          fxCtx.fillRect(gx + 3, gy + 3, 1, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v817 倉庫掃帚（錨 warehouse[218,116] 簷側 — 木柄＋黃草；建成才畫；rm 定幀）
    {
      if ((st.buildings.warehouse || 0) > 0) {
        const bx = 265, by = 148;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(bx + 4, by, 2, 9); // 柄
        fxCtx.fillStyle = "#d4b858";
        fxCtx.fillRect(bx + 1, by + 8, 8, 4); // 草帚
        fxCtx.fillStyle = "#b89840";
        fxCtx.fillRect(bx + 2, by + 9, 6, 2); // 暗
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(bx + 3, by + 7, 4, 2); // 束
      }
    }
    // v817 鐵匠鉗（錨 forge[282,58] 場前 — 灰鉗＋木柄；建成才畫；rm 定幀）
    {
      if ((st.buildings.forge || 0) > 0) {
        const tx = 320, ty = 122;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(tx + 1, ty + 6, 2, 6); // 柄
        fxCtx.fillStyle = "#6a6a78";
        fxCtx.fillRect(tx, ty + 1, 2, 6); // 臂L
        fxCtx.fillRect(tx + 4, ty + 1, 2, 6); // 臂R
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(tx, ty, 6, 2); // 嘴
        fxCtx.fillStyle = "#c8c8d0";
        fxCtx.fillRect(tx + 1, ty, 4, 1); // 亮
      }
    }
    // v817 祭壇香燭（錨 altar[292,116] 台側 — 金座＋蠟＋焰；建成才畫；rm 定幀）
    {
      if ((st.buildings.altar || 0) > 0) {
        const cx = 335, cy = 138;
        const flicker = !rm && ((t * 3.1) % 1.8) < 0.9;
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(cx + 1, cy + 8, 6, 2); // 座
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(cx + 2, cy + 2, 4, 7); // 蠟
        fxCtx.fillStyle = "#c8b878";
        fxCtx.fillRect(cx + 3, cy + 3, 1, 5); // 芯影
        fxCtx.fillStyle = flicker || rm ? "#ff9a40" : "#e87830";
        fxCtx.fillRect(cx + 2, cy, 4, 3); // 焰
        if (flicker || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#ffe08a";
          fxCtx.fillRect(cx + 3, cy + 1, 2, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v821 市場果籃（錨 market[366,116] 簷側 — 褐籃＋紅果；建成才畫；rm 定幀）
    {
      if ((st.buildings.market || 0) > 0) {
        const mx = 415, my = 148;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(mx + 1, my + 4, 9, 5); // 籃
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(mx, my + 3, 11, 2); // 緣
        fxCtx.fillStyle = "#e05c5c";
        fxCtx.fillRect(mx + 2, my + 1, 3, 3); // 果L
        fxCtx.fillRect(mx + 6, my + 1, 3, 3); // 果R
        fxCtx.fillStyle = "#57c96b";
        fxCtx.fillRect(mx + 4, my, 3, 2); // 葉
      }
    }
    // v821 圖書館書堆（錨 library[144,116] 簷前 — 褐／藍書；建成才畫；rm 定幀）
    {
      if ((st.buildings.library || 0) > 0) {
        const lx = 162, ly = 152;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(lx, ly + 5, 10, 3); // 下書
        fxCtx.fillStyle = "#3a5a9a";
        fxCtx.fillRect(lx + 1, ly + 2, 9, 3); // 中書
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(lx + 2, ly, 7, 2); // 上書
        fxCtx.fillStyle = "#e8dcc0";
        fxCtx.fillRect(lx + 3, ly + 3, 2, 1); // 頁線
      }
    }
    // v821 訓練場矛架（錨 training[208,58] 場側 — 木架＋銀矛；建成才畫；rm 定幀）
    {
      if ((st.buildings.training || 0) > 0) {
        const sx = 222, sy = 112;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(sx, sy + 8, 10, 2); // 架底
        fxCtx.fillRect(sx + 1, sy + 2, 2, 7); // 柱L
        fxCtx.fillRect(sx + 7, sy + 2, 2, 7); // 柱R
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(sx + 2, sy, 2, 9); // 矛L
        fxCtx.fillRect(sx + 6, sy, 2, 9); // 矛R
        fxCtx.fillStyle = "#c8c8d0";
        fxCtx.fillRect(sx + 2, sy, 2, 2); // 尖L
        fxCtx.fillRect(sx + 6, sy, 2, 2); // 尖R
      }
    }
    // v825 酒館木凳（錨 guild[134,58] 簷前 — 褐凳＋腳；建成才畫；rm 定幀）
    {
      if ((st.buildings.guild || 0) > 0) {
        const gx = 145, gy = 100;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(gx + 1, gy + 3, 9, 3); // 面
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(gx + 2, gy + 6, 2, 5); // 腳L
        fxCtx.fillRect(gx + 7, gy + 6, 2, 5); // 腳R
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(gx + 2, gy + 4, 2, 1); // 亮
      }
    }
    // v825 煉金藥架（錨 alchemy[70,116] 簷側 — 木架＋綠瓶；建成才畫；rm 定幀）
    {
      if ((st.buildings.alchemy || 0) > 0) {
        const ax = 95, ay = 150;
        const bub = !rm && ((t * 2.5) % 2.0) < 0.28;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(ax, ay + 8, 10, 2); // 架
        fxCtx.fillStyle = "#4a8a58";
        fxCtx.fillRect(ax + 2, ay + 2, 3, 6); // 瓶L
        fxCtx.fillRect(ax + 6, ay + 1, 3, 7); // 瓶R
        fxCtx.fillStyle = "#57c96b";
        fxCtx.fillRect(ax + 2, ay + 4, 3, 3);
        fxCtx.fillRect(ax + 6, ay + 3, 3, 4);
        if (bub || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#c8f5d0";
          fxCtx.fillRect(ax + 3, ay + 3, 1, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v825 寶石托座（錨 gemworks[356,58] 簷前 — 銅座＋青晶；建成才畫；rm 定幀）
    {
      if ((st.buildings.gemworks || 0) > 0) {
        const gx = 385, gy = 108;
        const spark = !rm && ((t * 2.3) % 2.0) < 0.26;
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(gx + 1, gy + 6, 8, 3); // 座
        fxCtx.fillStyle = "#4da3ff";
        fxCtx.fillRect(gx + 3, gy + 1, 4, 5); // 晶
        fxCtx.fillStyle = "#7ec8ff";
        fxCtx.fillRect(gx + 4, gy + 2, 2, 3); // 亮
        if (spark || rm) {
          fxCtx.globalAlpha = rm ? 0.35 : 0.7;
          fxCtx.fillStyle = "#ffffff";
          fxCtx.fillRect(gx + 4, gy + 2, 1, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v829 鐵匠錘架（錨 forge[288,58] 簷側 — 木架＋鐵錘；建成才畫；rm 定幀）
    {
      if ((st.buildings.forge || 0) > 0) {
        const fx = 298, fy = 140;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(fx, fy + 8, 10, 2); // 架
        fxCtx.fillStyle = "#6a6a78";
        fxCtx.fillRect(fx + 3, fy + 1, 2, 8); // 柄
        fxCtx.fillStyle = "#8a8a98";
        fxCtx.fillRect(fx + 1, fy, 6, 3); // 錘頭
        fxCtx.fillStyle = "#c8c8d0";
        fxCtx.fillRect(fx + 2, fy + 1, 2, 1); // 亮
      }
    }
    // v829 倉庫木箱（錨 warehouse[240,116] 簷前 — 褐箱＋封條；建成才畫；rm 定幀）
    {
      if ((st.buildings.warehouse || 0) > 0) {
        const wx = 248, wy = 160;
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(wx, wy + 2, 11, 8); // 箱
        fxCtx.fillStyle = "#6a4a28";
        fxCtx.fillRect(wx, wy + 5, 11, 2); // 帶
        fxCtx.fillStyle = "#c8a878";
        fxCtx.fillRect(wx + 1, wy + 3, 3, 1); // 亮
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(wx + 4, wy, 3, 2); // 封
      }
    }
    // v829 祭壇香爐（錨 altar[320,116] 簷側 — 銅爐＋煙；建成才畫；rm 定幀）
    {
      if ((st.buildings.altar || 0) > 0) {
        const ax = 348, ay = 145;
        const smoke = !rm && ((t * 2.1) % 2.0) < 0.3;
        fxCtx.fillStyle = "#d4a84a";
        fxCtx.fillRect(ax + 1, ay + 6, 8, 4); // 爐
        fxCtx.fillStyle = "#b88830";
        fxCtx.fillRect(ax + 3, ay + 4, 4, 2); // 口
        fxCtx.fillStyle = "#8a6238";
        fxCtx.fillRect(ax + 4, ay + 2, 2, 3); // 炷
        if (smoke || rm) {
          fxCtx.globalAlpha = rm ? 0.3 : 0.55;
          fxCtx.fillStyle = "#d0d0d8";
          fxCtx.fillRect(ax + 4, ay, 2, 2);
          fxCtx.globalAlpha = 1;
        }
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
      // v661：村民偶發撓頭（每 ~6.5s 一次 ~0.5s；rm 無）
      if (!rm && ((t + v.ph * 2.3) % 6.5) < 0.5) {
        const hx = Math.round(x) + (flip ? -1 : 10);
        fxCtx.fillStyle = "#ead49a";
        fxCtx.fillRect(hx, v.y - 1, 2, 5);
        fxCtx.fillRect(hx + (flip ? -1 : 0), v.y - 3, 3, 2);
      }
    }
    // 流浪英雄：依目標在建築區走動（對話泡泡只顯示在下方卡片，避免遮擋）
    const ws = (st.wanderers || []).filter(w => !w.dead);
    for (const w of ws) {
      const wy = w.y !== undefined ? w.y : 158;
      const flip = (w.lastDir || 1) < 0;
      MG.ui.render.draw(fxCtx, MG.sys.wanderers.spriteOf(w), w.x - 11, wy, 1, { scale: 1.4, frame: rm ? 0 : Math.floor(t * 3 + w.uid.length) % 2, flip });
    }
  }
  /* ---- v627 每日寶箱（世界地圖移除後遷入主頁村莊框；沿用 v296 公式/FNV 日種子/st.mapChest 欄位，舊檔進度無痛保留） ----
     獎勵: 金幣 1000×1.35^(kl-1) ＋ 素材 ×4 ＋ 15% 鑽石 ×5；開過即隱藏，午夜重置
     v676：指數軟封頂 min(kl-1,20) — kl≤21 不變；防後期日領印鈔 */
  const CHEST_FNV = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; } return h; };
  function chestInfo() {
    const st = S();
    const day = MG.util.today ? MG.util.today() : new Date().toISOString().slice(0, 10);
    const mc = st.mapChest || (st.mapChest = { day: "", opened: false });
    if (mc.day !== day) { mc.day = day; mc.opened = false; }
    return mc;
  }
  function chestReward() {
    const st = S();
    const klExp = Math.min(20, Math.max(0, (st.kingdom.level || 1) - 1));
    const gold = Math.floor(1000 * Math.pow(1.35, klExp));
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
  function openTownChest() {
    const st = S();
    const mc = chestInfo();
    if (mc.opened) return;
    mc.opened = true;
    const rw = chestReward();
    st.currencies.gold += rw.gold;
    const matName = (MG.config.MATS && MG.config.MATS[rw.mat]) ? MG.config.MATS[rw.mat].name : rw.mat;
    MG.core.audio.SFX.click();
    MG.ui.dom.toast("開啟每日寶箱！+ " + MG.util.fmt(rw.gold) + " 金 ・ " + matName + " ×4" + (rw.gems ? " ・ 鑽石 ×" + rw.gems : ""), "gold", "icon_chest");
    updateTownChest();
    renderOverview(true);
    MG.core.save.save();
  }
  function updateTownChest() {
    if (!chestBtnEl) return;
    chestBtnEl.style.display = chestInfo().opened ? "none" : "flex";
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
    // v622：缺料時卡片直接列出逐項缺額＋素材取得來源（消滅靜默死按鈕；按鈕 disabled 契約不動）
    const miss = (!locked && !maxed && !afford) ? missingParts(cost) : [];
    const missSrc = miss.length ? missingMatSrc(cost) : [];
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
        !locked && !maxed ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, color: "var(--dim2)" } }, costText(cost)) : null,
        miss.length ? MG.ui.dom.h("div", { style: { fontSize: 10, color: "#ff9c9c", lineHeight: 1.5 } }, "不足：" + miss.join("、")) : null,
        missSrc.length ? MG.ui.dom.h("div", { style: { fontSize: 9, color: "var(--dim2)", lineHeight: 1.5 } }, "取得：" + missSrc.join("・")) : null),
      locked ? (unlocked
        ? MG.ui.dom.h("button", {
          class: "btn sm " + (afford ? "gold" : ""), disabled: !afford, title: "建造「" + d.name + "」（" + costText(cost) + "）— " + d.desc,
          on: { click: (e) => { e.stopPropagation(); buy(b.id); } }
        }, "建造")
        : miniChip("王國 Lv " + d.unlock, false))
        : (maxed ? miniChip("已達最高等級", true) :
          MG.ui.dom.h("button", {
            class: "btn sm " + (afford ? "gold" : ""), disabled: !afford, title: "升級「" + d.name + "」至 Lv " + (lv + 1) + "（" + costText(cost) + "）— " + d.effect(lv + 1),
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
  // v622 缺料可視化：逐項「缺 X（持 Y）」純讀取組字串（對齊 hunters.js v231 突破缺額語彙；空陣列=夠料）
  function missingParts(cost) {
    const st = S();
    const miss = [];
    if (st.currencies.gold < cost.gold) miss.push("金幣 缺" + MG.util.fmt(cost.gold - st.currencies.gold) + "（持 " + MG.util.fmt(st.currencies.gold) + "）");
    for (const m in (cost.mats || {})) {
      const have = st.mats[m] || 0;
      if (have < cost.mats[m]) miss.push(MG.config.MATS[m].name + " 缺" + MG.util.fmt(cost.mats[m] - have) + "（持 " + MG.util.fmt(have) + "）");
    }
    return miss;
  }
  // v622 缺料素材的取得來源指引（MATS[m].src；只列缺項素材）
  function missingMatSrc(cost) {
    const st = S();
    const out = [];
    for (const m in (cost.mats || {})) {
      if ((st.mats[m] || 0) < cost.mats[m] && MG.config.MATS[m].src) out.push(MG.config.MATS[m].name + "—" + MG.config.MATS[m].src);
    }
    return out;
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
      // v622：失敗 toast 帶缺額明細（服務 openDetail modal 的不 disabled 升級/建造鈕；前 2 項，超出加 …）
      const miss = missingParts(B.nextCost(id));
      MG.ui.dom.toast(miss.length ? "資源不足：" + miss.slice(0, 2).join("、") + (miss.length > 2 ? "…" : "") : "資源不足，無法升級", "bad", "icon_coin");
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
          title: MG.sys.meta.studyCost() < 0 ? "已研讀至最高境界（技能威力 +10%）" : "消耗技能書永久提升全隊技能威力 +1%（累計最高 +10%）",
          on: { click: () => { if (MG.sys.meta.buyStudy()) { MG.ui.dom.toast("研讀完成！技能威力 +1%", "good", "icon_book"); openDetail("library"); m.close(); } } }
        }, MG.sys.meta.studyCost() < 0 ? "已研讀至最高境界" : "研讀（消耗 " + MG.sys.meta.studyCost() + " 本技能書）"),
        // v759：技能研讀滿級空態 CTA — 一鍵前往副本
        // v771：技能書不足空態 CTA — 一鍵前往副本農書
        MG.sys.meta.studyCost() < 0 ? MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 10 } },
          MG.ui.dom.h("div", null, "技能研讀已達最高境界"),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "可先去副本繼續成長與收集"),
          MG.ui.dom.h("button", {
            class: "btn gold", style: { minHeight: 44, minWidth: 140 },
            title: "關閉並前往副本",
            on: { click: () => { m.close(); MG.ui.screens.show("hunt"); } }
          }, "前往副本"))
        : (MG.sys.meta.studyCost() > 0 && (st.currencies.book || 0) < MG.sys.meta.studyCost()
          ? MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 10 } },
            MG.ui.dom.h("div", null, "技能書不足（需 " + MG.sys.meta.studyCost() + " 本）"),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "可先去副本／特惠／榮譽商店取得技能書"),
            MG.ui.dom.h("button", {
              class: "btn gold", style: { minHeight: 44, minWidth: 140 },
              title: "關閉並前往副本",
              on: { click: () => { m.close(); MG.ui.screens.show("hunt"); } }
            }, "前往副本"))
          : null)) : null,
      !lv ? MG.ui.dom.h("div", { class: "sub", style: { marginBottom: 10 } },
        B.available(id) ? "解鎖條件已滿足，在此動工吧！" : "解鎖條件：王國 Lv " + d.unlock + "，屆時即可在此動工。") : null,
      !lv && B.available(id) ? MG.ui.dom.h("button", {
        class: "btn gold", style: { width: "100%" }, title: "建造「" + d.name + "」：下一級效果「" + d.effect(1) + "」",
        on: { click: () => { if (buy(id)) m.close(); } }
      }, "建造　" + costText(B.nextCost(id))) : null,
      lv > 0 && !maxed ? MG.ui.dom.h("button", {
        class: "btn gold", style: { width: "100%" }, title: "升級「" + d.name + "」至 Lv " + (lv + 1) + "：效果「" + d.effect(lv + 1) + "」",
        on: { click: () => { if (buy(id)) m.close(); } }
      }, "升級至 Lv " + (lv + 1) + "　" + costText(B.nextCost(id))) :
        // v759：建築滿級空態 CTA — 一鍵前往副本
        (maxed ? MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 10 } },
          MG.ui.dom.h("div", null, "此建築已達最高等級"),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "榮光永駐；可先去副本繼續成長"),
          MG.ui.dom.h("button", {
            class: "btn gold", style: { minHeight: 44, minWidth: 140 },
            title: "關閉並前往副本",
            on: { click: () => { m.close(); MG.ui.screens.show("hunt"); } }
          }, "前往副本")) : null),
      // v806：建築升級資源不足空態 CTA — 一鍵前往副本
      (lv > 0 && !maxed && missingParts(B.nextCost(id)).length
        ? MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 10 } },
          MG.ui.dom.h("div", null, "資源不足，無法升級建築"),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "可先去副本累積金幣與素材"),
          MG.ui.dom.h("button", {
            class: "btn gold", style: { minHeight: 44, minWidth: 140 },
            title: "關閉並前往副本",
            on: { click: () => { m.close(); MG.ui.screens.show("hunt"); } }
          }, "前往副本"))
        : null),
      // v810：建築建造資源不足空態 CTA — 一鍵前往副本
      (!lv && B.available(id) && missingParts(B.nextCost(id)).length
        ? MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 10 } },
          MG.ui.dom.h("div", null, "資源不足，無法建造建築"),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "可先去副本累積金幣與素材"),
          MG.ui.dom.h("button", {
            class: "btn gold", style: { minHeight: 44, minWidth: 140 },
            title: "關閉並前往副本",
            on: { click: () => { m.close(); MG.ui.screens.show("hunt"); } }
          }, "前往副本"))
        : null));
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
    const TIPS = { "勢力": "名冊上限隨酒館等級提升；出戰編隊即派遣部隊", "副本": "目前討伐的地圖進度與生涯紀錄", "生產": "派遣中的每秒產出（受建築/靈藥/昇華加成）", "圖鑑": "魔物/裝備/素材收集完成度" };
    const c = MG.ui.dom.h("div", { class: "panel2", style: { padding: 8 }, title: TIPS[title] || "" },
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
    // v555：今日待辦即時化 — 每日錨點狀態納入簽名（僅 badges 同款廉價唯讀；讓待辦行/領取鈕隨進度活更新）
    s += ":" + ((st.quests.daily && st.quests.daily.list || []).map(d => (d.done ? 1 : 0) + "/" + (d.prog || 0)).join(","))
      + ":" + (MG.sys.meta.checkinDay ? MG.sys.meta.checkinDay() : 0)
      + ":" + (MG.sys.arena ? MG.sys.arena.fightsLeft() : 0)
      + ":" + ((st.kingdom.level || 1) >= 12 && MG.sys.royal ? MG.sys.royal.fightsLeft() : 0)
      + ":" + (MG.sys.dungeon ? MG.sys.dungeon.DEFS.reduce((a, d) => a + MG.sys.dungeon.left(d.id), 0) : 0)
      + ":" + (MG.sys.market ? MG.sys.market.deals().filter(d => d.sold < d.stock).length : 0)
      + ":" + (MG.sys.worldboss ? MG.sys.worldboss.left() : 0)
      + ":" + (st.events ? (st.events.pts || 0) + "/" + Object.keys(st.events.milestones || {}).length : "0/0")
      + ":" + (st.guild ? (st.guild.feastDay || "") + "/" + (st.guild.level || 0) : "")
      + ":" + ((st.wanderers || []).filter(w => !w.dead && w.state !== "exped" && w.feedDay !== MG.util.today()).length)
      + ":" + (MG.sys.tower && MG.sys.tower.progress ? MG.sys.tower.progress().cleared : -1)
      + ":" + (MG.sys.abyss ? (MG.sys.abyss.inAbyss() ? 1 : 0) + (MG.sys.abyss.unlocked() ? "" : "L") : "-")
      + ":" + (MG.sys.maze && MG.sys.maze.progress ? (MG.sys.maze.progress().finished ? 1 : 0) : -1)
      + ":" + (MG.sys.expedition && MG.sys.expedition.progress ? MG.sys.expedition.progress().list.map(x => x ? 1 : 0).join("") : "-");
    return s;
  }
  /* v253 一鍵領取全部：登入收菜聚合 — 依序呼叫既有 claimAll 家族（逐來源獨立 try 不阻斷；welcome 傳說保留選角窗）
     v555 回歸（v279 復原合併時遺失 — 由今日待辦條目調用） */
  function claimAllToday() {
    const parts = [];
    let legendOnly = false;
    const M = MG.sys.meta;
    const tryClaim = (label, fn) => {
      try {
        const r = fn();
        const n = typeof r === "number" ? r : (r && typeof r.n === "number" ? r.n : 0);
        if (n > 0) parts.push(label + " " + n);
        return r;
      } catch (e) { /* 單來源失敗不阻斷 */ return null; }
    };
    tryClaim("每日", () => M.claimAllDaily());
    tryClaim("每週", () => M.claimAllWeekly());
    tryClaim("成就", () => M.claimAllAch());
    tryClaim("圖鑑", () => M.claimAllCodex());
    tryClaim("活動", () => MG.sys.events.claimAllMilestones());
    tryClaim("深淵", () => MG.sys.abyss.claimAll());
    if (MG.sys.welcome) { // 七日豪禮：d1-6 直接領、d7 傳說保留選角
      const wr = tryClaim("豪禮", () => MG.sys.welcome.claimAll());
      if (wr && wr.legend) { legendOnly = !parts.length; MG.ui.more.openWelcome && MG.ui.more.openWelcome(); } // v253FIX：僅 d7 傳說時不誤報空
    }
    tryClaim("簽到", () => { let n = 0; while (M.claimCheckin(true)) n++; if (n) MG.core.audio.SFX.quest(); return n; }); // v253FIX：silent 迴圈＋單一音效
    if (MG.sys.worldboss) tryClaim("討伐", () => MG.sys.worldboss.claimAllWeek());
    if (parts.length || legendOnly) {
      MG.ui.dom.toast("已領取：" + parts.join("・") + (legendOnly && !parts.length ? "豪禮：傳說英雄請至視窗選擇" : ""), "good", "icon_coin");
      renderOverview(true); // v253FIX：強制重繪（同模組直接呼叫 — refreshAll 受 sig+1s 守衛可能不重建）
    } else MG.ui.dom.toast("今天沒有可領取的獎勵", "", "icon_coin");
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
    // 今日待辦（v196 登入儀式中心化 — AFK Arena 每日面板；每項可點跳轉）
    // v555 回歸：v279 像素復原合併重寫 kingdom.js 時遺失整段 — 一鍵例行/一鍵領取 runner 仍在 more.js 死代碼化
    try {
      const M = MG.ui.more;
      const daily = (st.quests.daily && st.quests.daily.list) || [];
      // v555FIX：完成數以 d.prog≥target 判定（v214FIX 同源 — 原只看 done=已領取，完成未領不計數）
      const dailyDone = daily.filter(d => d.done || d.prog >= (((MG.data.quests.DAILY_POOL.find(p => p.id === d.id) || {}).req || {}).target || 0)).length;
      const checked = (MG.sys.meta.checkinDay ? MG.sys.meta.checkinDay() >= 30 : false); // v555FIX：days=[bool×30] 順序制（無逐日記錄）— 全滿 30/30 才顯示 ✓（與 badges/簽到 modal 同源；原 includes(日期) 恆 false）
      const fights = MG.sys.arena ? MG.sys.arena.fightsLeft() : 0;
      const dgLeft = MG.sys.dungeon ? MG.sys.dungeon.DEFS.reduce((a, d) => a + MG.sys.dungeon.left(d.id), 0) : 0;
      const unsold = MG.sys.market ? MG.sys.market.deals().filter(d => d.sold < d.stock).length : 0;
      // v226 補齊 v200+ 每日/週錨點：世界首領／限時活動／公會盛宴／流浪投餵
      const wbLeft = MG.sys.worldboss ? MG.sys.worldboss.left() : 0;
      const evReady = (MG.sys.events && st.events) ? MG.sys.events.MILESTONES.some(ms => !st.events.milestones[ms.pts] && (st.events.pts || 0) >= ms.pts) : false;
      const feastLeft = (MG.sys.guild && st.guild) ? (st.guild.feastDay !== MG.util.today() && (st.guild.level || 1) < MG.sys.guild.MAX_LEVEL) : false;
      const feedable = (st.wanderers || []).some(w => !w.dead && w.state !== "exped" && w.feedDay !== MG.util.today());
      // v555 深淵行補齊解鎖語意（未解鎖顯示鎖定而非「可踏入」— 與地圖地標同源 unlocked()）
      const abyssLocked = !(MG.sys.abyss && MG.sys.abyss.unlocked());
      const items = [
        { icon: "icon_quest", label: "任務", val: daily.length ? dailyDone + "/" + daily.length : "—", hot: dailyDone < daily.length, open: () => M.openQuests() },
        { icon: "icon_check", label: "簽到", val: checked ? "✓" : "未簽", hot: !checked, open: () => M.openCheckin() },
        { icon: "icon_honor", label: "競技場", val: fights + " 次", hot: fights > 0, open: () => M.openArena(), run: () => MG.ui.more.runSweepArena() }, // v263
        // v261 王者競技場（王國 Lv12 解鎖 — 每日免費次數錨點；與競技場同構）
        { icon: "icon_honor", label: "王者", val: (st.kingdom.level || 1) >= 12 && MG.sys.royal ? MG.sys.royal.fightsLeft() + " 次" : "Lv12 解鎖", hot: (st.kingdom.level || 1) >= 12 && MG.sys.royal && MG.sys.royal.fightsLeft() > 0, open: () => M.openRoyal(), run: () => MG.ui.more.runSweepRoyal() },
        { icon: "icon_sword", label: "秘境", val: dgLeft + " 次", hot: dgLeft > 0, open: () => M.openDungeon(), run: () => MG.ui.more.runSweepDungeon() },
        { icon: "icon_shop", label: "特惠", val: unsold + " 件", hot: unsold > 0, open: () => M.openMarket() },
        { icon: "icon_skull", label: "世界首領", val: wbLeft + " 次", hot: wbLeft > 0, open: () => M.openWorldboss(), run: () => MG.ui.more.runSweepWorldboss() },
        { icon: "icon_chest", label: "活動", val: evReady ? "可領" : "—", hot: evReady, open: () => M.openEvents() },
        { icon: "icon_castle", label: "盛宴", val: feastLeft ? "可捐" : "—", hot: feastLeft, open: () => M.openGuild() },
        { icon: "icon_pot_hp", label: "投餵", val: feedable ? "可餵" : "—", hot: feedable, open: () => { MG.ui.screens.show("hunters"); MG.ui.hunters.showWanderers(); } },
        // v263 補齊缺席行：元素塔（自動挑戰）／深淵（踏入並連戰）
        { icon: "icon_tower", label: "元素塔", val: (MG.sys.tower && MG.sys.tower.progress) ? (MG.sys.tower.progress().all ? "全通" : "可挑戰") : "—", hot: !!(MG.sys.tower && MG.sys.tower.progress && !MG.sys.tower.progress().all), open: () => M.openTower(), run: () => MG.ui.more.runAutoTower() },
        { icon: "icon_skull", label: "深淵", val: abyssLocked ? "未解鎖" : (MG.sys.abyss && !MG.sys.abyss.inAbyss() ? "可踏入" : "進行中"), hot: !abyssLocked && MG.sys.abyss && !MG.sys.abyss.inAbyss(), open: () => M.openAbyss(), run: () => MG.ui.more.runAbyssFight() },
        // v266 奇境迷宮（王國 Lv14 解鎖 — 週限 roguelike；hot=未全通）
        { icon: "icon_tower", label: "迷宮", val: (st.kingdom.level || 1) >= 14 && MG.sys.maze ? (MG.sys.maze.progress().finished ? "本週全通" : "可探索") : "Lv14 解鎖", hot: (st.kingdom.level || 1) >= 14 && MG.sys.maze && !MG.sys.maze.progress().finished, open: () => M.openMaze() },
        // v271 委託遠征營（王國 Lv16 解鎖 — 板凳委託板；hot=有空閒欄位/待結算）
        { icon: "icon_chest", label: "遠征", val: (st.kingdom.level || 1) >= 16 && MG.sys.expedition ? (MG.sys.expedition.progress().list.some(s => s) ? "進行中" : "可派遣") : "Lv16 解鎖", hot: (st.kingdom.level || 1) >= 16 && MG.sys.expedition && MG.sys.expedition.progress().list.some(s => !s), open: () => M.openExpedition() }
      ];
      // v263 一鍵例行巡檢：免費批次 runner 依序執行（掃蕩/自動/連戰 — 純零耗不設 confirm，v253 對稱）；花費類保留各自 confirm
      const runAllRoutines = () => {
        const M2 = MG.ui.more;
        const parts = [];
        const tryRun = (label, fn) => {
          try { const r = fn(); if (r && r.txt) parts.push(label + " " + r.txt); return r; } catch (e) { return null; }
        };
        tryRun("競技場", () => M2.runSweepArena());
        tryRun("王者", () => M2.runSweepRoyal());
        tryRun("秘境", () => M2.runSweepDungeon());
        tryRun("世界首領", () => M2.runSweepWorldboss());
        tryRun("元素塔", () => M2.runAutoTower());
        tryRun("深淵", () => M2.runAbyssFight());
        if (parts.length) {
          MG.ui.dom.toast("例行完成：" + parts.join("｜"), "good", "icon_sword");
          MG.ui.screens.refreshAll();
          renderOverview(true);
        } else MG.ui.dom.toast("今天沒有免費例行項目（次數已用完）", "", "icon_sword");
      };
      // v666：一鍵領取／例行顯示可處理項數（減少「要不要點」猶豫）
      let claimReadyN = 0;
      if (MG.sys.badges && MG.sys.badges.check) {
        const b = MG.sys.badges.check();
        if (b.daily) claimReadyN++;
        if (b.weekly) claimReadyN++;
        if (b.ach) claimReadyN++;
        if (b.codex) claimReadyN++;
        if (b.events) claimReadyN++;
        if (b.abyss) claimReadyN++;
        if (b.welcome) claimReadyN++;
        if (b.checkin) claimReadyN++;
        if (b.wbweek) claimReadyN++;
      }
      const routineReadyN = items.filter(it => it.hot && it.run).length;
      const strip = MG.ui.dom.h("div", { style: { marginTop: 8 } },
        MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, color: "var(--dim)", flex: 1 } }, "今日待辦"),
          // v263 一鍵例行（免費批次 — 與「一鍵領取全部」互補軸）
          MG.ui.dom.h("button", {
            class: "btn sm blue", style: { minHeight: 44, padding: "4px 10px", fontSize: 10, flexShrink: 0 },
            title: routineReadyN ? ("今日約 " + routineReadyN + " 項免費例行可跑") : "今天沒有可跑的免費例行",
            on: { click: runAllRoutines }
          }, routineReadyN > 0 ? ("一鍵例行 · " + routineReadyN) : "一鍵例行"),
          // v253 一鍵領取全部：登入收菜聚合（8 來源依序 — 逐來源獨立 try 不阻斷；純收益零消耗不設 confirm）
          MG.ui.dom.h("button", {
            class: "btn sm" + (claimReadyN > 0 ? " gold" : ""),
            style: { minHeight: 44, padding: "4px 10px", fontSize: 10, flexShrink: 0 },
            title: claimReadyN ? ("約 " + claimReadyN + " 個來源有可領獎勵") : "今天沒有可領取的獎勵",
            on: { click: claimAllToday }
          }, claimReadyN > 0 ? ("一鍵領取全部 · " + claimReadyN) : "一鍵領取全部")),
        MG.ui.dom.h("div", { style: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 } },
          items.map(it => MG.ui.dom.h("div", {
            style: { flexShrink: 0, display: "flex", alignItems: "center", gap: 2 },
            on: { click: it.open }
          },
            MG.ui.dom.h("button", {
              class: "chip", style: { padding: "4px 10px", minHeight: 44, borderColor: it.hot ? "var(--gold2)" : "var(--line)", flexDirection: "column", gap: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }
              // v263FIX：inner chip 不綁 click（outer div 已綁 — 原雙綁 modal 開兩次）
            },
              MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 3, fontWeight: 900, fontSize: 10 } }, MG.ui.dom.icon(it.icon, 12), it.label),
              MG.ui.dom.h("span", { style: { fontSize: 10, color: it.hot ? "var(--gold)" : "var(--dim)" } }, it.val)),
            it.run ? MG.ui.dom.h("button", { // v263 inline ▶（免費批次直接執行 — 不經 modal）
              class: "chip", style: { padding: "4px 8px", minWidth: 44, minHeight: 44, borderLeft: "none", borderTopLeftRadius: 0, borderBottomLeftRadius: 0, fontSize: 11, color: it.hot ? "var(--gold)" : "var(--dim)" },
              on: { click: (e) => { e.stopPropagation(); const r = it.run(); if (r && r.txt) MG.ui.dom.toast(it.label + " " + r.txt, "good", it.icon); MG.ui.screens.refreshAll(); renderOverview(true); } }
            }, "▶") : null))));
      overviewBodyEl.appendChild(strip);
    } catch (e) { /* 今日待辦非關鍵路徑 */ }
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
      MG.ui.dom.h("div", { class: "pbar", style: { height: 12 }, title: st.kingdom.level >= 50 ? "王國已達最高等級" : "升級獎勵：全隊攻擊/金幣/經驗 +1%・送禮金・每 5 級加贈鑽石；經驗來源：英雄升級・建築升級・討伐 BOSS・離線掛機" },
        kePct),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 3 } },
        st.kingdom.level >= 50 ? "王國已達最高等級，榮光永駐。" :
          "每級：全隊攻擊/金幣/經驗 +1%（目前 +" + Math.round((st.kingdom.level - 1)) + "%）・升級送禮金，每 5 級加贈鑽石。來源：英雄升級、建築升級、討伐BOSS、離線掛機")));
    // v751：王國滿級空態 CTA — 一鍵前往副本
    if ((st.kingdom.level || 1) >= 50) {
      overviewBodyEl.appendChild(MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 10 } },
        MG.ui.dom.h("div", null, "王國已達最高等級"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "可先去副本繼續成長與收集"),
        MG.ui.dom.h("button", {
          class: "btn gold", style: { minHeight: 44, minWidth: 140 },
          title: "前往副本",
          on: { click: () => { MG.ui.screens.show("hunt"); } }
        }, "前往副本")));
    }
    // 建築橫幅
    const built = B.unlockedList();
    const chips = built.length ? built.map(id => {
      const d = B.def(id);
      const lv = st.buildings[id] || 0;
      return MG.ui.dom.h("span", { class: "chip", style: { padding: "2px 8px", minHeight: 24, fontSize: 11, cursor: "default" }, title: "「" + d.name + "」Lv " + lv + " — " + (lv > 0 ? d.effect(lv) : d.desc) },
        d.name + " Lv" + lv);
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
  /* v650 素材→掉落區（regions.mats 或怪物 drops 含 mid） */
  function matDropRegions(mid) {
    const regs = MG.data.monsters.regions || [];
    const out = [];
    for (let i = 0; i < regs.length; i++) {
      const r = regs[i];
      if (!r || r.abyss) continue;
      let hit = (r.mats || []).indexOf(mid) >= 0;
      if (!hit) {
        for (const m of (r.monsters || [])) {
          if ((m.drops || []).some(d => d.m === mid)) { hit = true; break; }
        }
      }
      if (hit) out.push({ i, name: r.name });
    }
    return out;
  }
  /* v650 素材→建築用途（cost 含 mid；掃前幾級避免漏） */
  function matBuildingUses(mid) {
    const out = [];
    const BD = MG.data.buildings || {};
    for (const id of Object.keys(BD)) {
      const d = BD[id];
      if (!d || typeof d.cost !== "function") continue;
      const maxL = Math.min(d.max || 8, 8);
      for (let l = 1; l <= maxL; l++) {
        const c = d.cost(l);
        if (c && c.mats && c.mats[mid]) { out.push({ id, name: d.name }); break; }
      }
    }
    return out;
  }
  function goMatRegion(ri, name) {
    const st = S();
    const maxR = st.stats.maxRegionReached || 0;
    if (ri > maxR) {
      MG.ui.dom.toast("尚未解鎖「" + name + "」", "bad", "icon_close");
      return;
    }
    st.hunt.region = ri;
    st.hunt.wipeStreak = 0;
    if (MG.sys.battle && MG.sys.battle.reset) MG.sys.battle.reset();
    MG.ui.screens.show("hunt");
    MG.ui.dom.toast("前往「" + name + "」農素材", "good", "icon_sword");
    MG.core.audio.SFX.click();
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
      const row = MG.ui.dom.h("div", { class: "row", style: { padding: "8px 10px", cursor: "pointer", minHeight: 44 }, title: d.name + "（" + MG.config.tierLabel(d.tier) + "）— " + (d.desc || "素材") + "。來源：" + (d.src || "分解裝備・離線獎勵") + "。用途：建築升級・英雄突破・裝備合成", on: { click: () => {
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
        MG.ui.dom.h("button", { class: "btn sm gold", style: { padding: "4px 9px", minHeight: 44, fontSize: 11, flexShrink: 0 }, on: { click: (e) => { e.stopPropagation(); openSellMat(mid); } } }, "賣出"),
        MG.ui.dom.h("span", { style: { width: 14, textAlign: "center" } }, arrow));
      qtyEl.textContent = MG.util.fmt(st.mats[mid] || 0);
      matsQtyEls[mid] = qtyEl;
      // v650：掉落區＋建築用途＋跳轉（≤2 點擊：展開→前往）
      const drops = matDropRegions(mid);
      const uses = matBuildingUses(mid);
      detail.appendChild(MG.ui.dom.h("div", { style: { marginBottom: 4 } }, "來源：" + (d.src || "分解裝備・離線獎勵")));
      if (drops.length) {
        const dropRow = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", marginBottom: 4 } },
          MG.ui.dom.h("span", { style: { flexShrink: 0 } }, "掉落："));
        for (const dr of drops.slice(0, 4)) {
          dropRow.appendChild(MG.ui.dom.h("button", {
            class: "btn sm", style: { padding: "4px 8px", minHeight: 44, fontSize: 11 },
            title: "前往「" + dr.name + "」副本農此素材",
            on: { click: (e) => { e.stopPropagation(); goMatRegion(dr.i, dr.name); } }
          }, dr.name));
        }
        detail.appendChild(dropRow);
      } else {
        detail.appendChild(MG.ui.dom.h("div", { style: { marginBottom: 4 } }, "掉落：分解裝備・離線獎勵"));
      }
      if (uses.length) {
        const useRow = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" } },
          MG.ui.dom.h("span", { style: { flexShrink: 0 } }, "用於："));
        for (const u of uses.slice(0, 4)) {
          useRow.appendChild(MG.ui.dom.h("button", {
            class: "btn sm", style: { padding: "4px 8px", minHeight: 44, fontSize: 11 },
            title: "開啟建築頁查看「" + u.name + "」",
            on: { click: (e) => { e.stopPropagation(); MG.ui.screens.show("buildings"); MG.ui.dom.toast("建築：「" + u.name + "」可消耗此素材", "", "icon_castle"); MG.core.audio.SFX.click(); } }
          }, u.name));
        }
        detail.appendChild(useRow);
      } else {
        detail.appendChild(MG.ui.dom.h("div", null, "用途：英雄突破・裝備合成"));
      }
      matsEl.appendChild(row);
      matsEl.appendChild(detail);
    }
  }
  function render(root) {
    root.innerHTML = "";
    root.appendChild(MG.ui.dom.h("div", { style: { padding: "10px 10px 4px" } },
      MG.ui.dom.h("div", { class: "title", style: { fontSize: 19, cursor: "pointer" }, title: "點擊可為王國更名（更名券於商城取得）", on: { click: () => { if (MG.ui.more.openRenameDialog) MG.ui.more.openRenameDialog(); } } }, S().kingdomName || "梅根王國"),
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
    // v627：每日寶箱（村莊框右下角 — 原世界地圖 v296 寶箱遷入；開過即隱藏）
    chestBtnEl = MG.ui.dom.h("button", { class: "town-chest", title: "每日寶箱 — 點擊開啟（金幣＋素材 ×4・15% 機率鑽石 ×5；午夜重置）", on: { click: openTownChest } },
      MG.ui.dom.icon("icon_chest", 22));
    wrap.appendChild(chestBtnEl);
    updateTownChest();
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
    const RES_TIPS = {
      gold: "金幣來源：討伐魔物・離線收益・王國升級・建築產出・活動",
      gems: "鑽石來源：任務・成就・競技場結算・世界首領・每日簽到・活動",
      ticket: "招募券來源：任務・成就・活動・BOSS 掉落・昇華",
      honor: "榮譽來源：昇華・世界首領・競技場・公會首領・每日任務",
      book: "魔法書來源：討伐掉落・商店・活動・昇華"
    };
    for (const [icon, label, key, color] of RES) {
      const cell = MG.ui.dom.h("div", { class: "panel2", style: { display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", fontSize: 12 }, title: label + " — " + (RES_TIPS[key] || "") },
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
    const qtyEl = MG.ui.dom.h("button", { class: "chip", style: { minWidth: 46, justifyContent: "center", padding: "2px 6px", minHeight: 44, fontWeight: 900, fontSize: 13, color: "var(--gold)" }, title: "點擊手動輸入數量", on: { click: () => {
      const v = prompt("輸入賣出數量（1-" + max + "）", ""); // v139：輸入框預設清空
      const n = parseInt(v, 10);
      if (!isNaN(n) && n >= 1 && n <= max) { qty = Math.floor(n); refresh(); }
    } } }, "x1");
    const stepBtn = (txt, fn) => MG.ui.dom.h("button", { class: "chip", style: { padding: "2px 10px", minHeight: 44 }, on: { click: fn } }, txt); // v658：≥44px
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
    refresh: () => { renderOverview(); renderMats(); updateTownChest(); },
    onShow: () => { drawTown(); updateTownChest(); },
    raf: (now) => { drawTierFx(now / 1000); drawTownLife(now / 1000); }
  };
  MG.ui.screens.register("kingdom", screen);
  MG.ui.screens.register("buildings", {
    render: renderBuildings,
    refresh: renderCards
  });
  return Object.assign(screen, { townView, showCastleLevelUp, townPeriod, townSeason, openDetail,
    setPeriodOverride: (p) => {
      _periodOverride = (p === "dusk" || p === "night" || p === "day") ? p : null; // v649／v665
      try { drawTown(); } catch (e) { /* canvas 未就緒 */ }
    },
    setSeasonOverride: (s) => {
      _seasonOverride = (s === "spring" || s === "summer" || s === "autumn" || s === "winter") ? s : null; // v669
      try { drawTown(); } catch (e) { /* canvas 未就緒 */ }
    }
  });
})();
