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
  let canvas, ctx, fxCanvas, fxCtx, root, cardsEl, hintEl, townCanvas, miniCanvas, miniCtx, locChip, homePill;
  const VIEW_W = 480, VIEW_H = 320; // v273 pill 分離判定用 // v271：overlayCells 移除（點擊由 worldmap 命中）；v273 小地圖/位置 chip
  let resSpans = {}; // v137 資源總覽數字 span（key: gold/gems/ticket/honor/book）
  const cardEls = {}; // id -> card DOM (for upgrade flash)
  let burst = null;   // { t0, x, y } 升級瞬間的金環爆點
  let castleUp = null; // v207：王國升級儀式 { t0, lv } — 王城金環＋金粒子＋banner
  let lastLocAt = 0; // v273：位置 chip 節流
  let castleBanner = null; // v271 D3：banner 視口暫存 { lv, ba } — 於 translate 外繪製

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
    // v271 A1-3：王國畫布 = 世界地圖視口（480×320）— 底色 → 地形 chunk → 村莊帶（世界座標平移）→ 入口層
    const WM = MG.ui.worldmap;
    const cam = WM.cam();
    const ox = WM.VILLAGE.x - cam.x, oy = WM.VILLAGE.y - cam.y;
    ctx.fillStyle = "#141524";
    ctx.fillRect(0, 0, 480, 320);
    WM.drawGround(ctx);
    if (ox > -480 && ox < 480 && oy > -200 && oy < 320) { // 村莊畫框與視口相交才繪
      MG.ui.render.drawTown(ctx, {
        h: 200, t: Date.now() / 1000,
        buildings: townView(), ox, oy
      });
    }
    WM.drawEntrances(ctx, Date.now() / 1000);
  }
  // 供副本分頁在「回城休息/待機」時重用同一城鎮場景（480×270 畫布用）
  function townView() {
    // v242FIX：far 旗標（ORDER 前 5 格 = 遠排）— drawTown 霧罩/標籤降調兩畫布一致（原 b.y<100 對 270 畫布失效）
    return layout().map((b, i) => ({ ...b, far: i < 5, y: b.y - (b.scale - 1.6) * 16 }));
  }
  /* v271 A1-3：世界座標建築命中（worldmap 點擊路徑 — 取代原 DOM overlayCells；
     矩形由 CELLS + scale 推導，與原 16%×28% 點擊區等價；townView y 為繪製座標）
     CELLS 為村莊畫框局部座標 → 加 VILLAGE 錨點得世界座標 */
  function hitBuilding(wx, wy) {
    const vx = MG.ui.worldmap.VILLAGE.x, vy = MG.ui.worldmap.VILLAGE.y;
    for (const b of townView()) {
      const w = 32 * b.scale + 8, h = 32 * b.scale + 20;
      const bx = vx + b.x, by = vy + b.y;
      if (wx >= bx - 4 && wx <= bx + w - 4 && wy >= by - 4 && wy <= by + h - 4) return b.id;
    }
    return null;
  }
  /* ---- tier glow overlay（B4 畫布飾邊，底景不動） ---- */
  function drawTierFx(t, ox, oy) {
    if (!fxCtx) return;
    fxCtx.clearRect(0, 0, 480, 320);
    fxCtx.save();
    fxCtx.translate(ox || 0, oy || 0); // v271 A1-3：世界座標平移
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
        // banner 狀態暫存（視口座標 — 於 restore 後繪製；D3：原在 translate 內被世界平移帶走）
        castleBanner = { lv: castleUp.lv, ba: Math.max(0, Math.min(1, dt < 0.12 ? dt / 0.12 : dt > 0.88 ? (1 - dt) / 0.12 : 1)) };
      }
    }
    fxCtx.restore(); // v271 A1-3：世界座標平移收尾
    // D3：王國升級 banner 固定於視口頂部（不受相機平移影響）
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
  // v242 窗位快取（sprite 窗字元掃描一次 — 仿 whiteCaches 模式）
  const windowLightsCache = {};
  function windowLightsOf(sprite) {
    if (windowLightsCache[sprite]) return windowLightsCache[sprite];
    const sp = MG.data.sprites.get(sprite);
    const rows = sp && sp.frames && sp.frames[0] ? sp.frames[0] : null;
    const out = [];
    if (rows) {
      for (let y = 15; y <= 27 && y < rows.length; y++) {
        const r = rows[y];
        for (let x = 0; x < r.length; x++) {
          const c = r[x];
          if (c === "W" || c === "Q") {
            if (sprite.indexOf("b_market") === 0) continue; // v242FIX：market 全圖無真實窗（篷布高光 t1 W／t2+ 換 Q — 原例外只擋 W 致 lvl≥5 誤點篷布）
            out.push([x, y]);
          }
        }
      }
    }
    windowLightsCache[sprite] = out;
    return out;
  }
  // v232 A8 村民作息狀態機參數：home=住家帶中心／plaza=廣場（棋盤廣場實際 x∈[14,109] — 96 落東緣 tile）聚集點／cycle=作息週期秒數
  // v232FIX：home 距離控制散步速度同量級；v247：plaza 置中 230
  const VILLAGERS = [
    { s: "h_villager_1", y: 179, x0: 16, ph: 0, home: 140, plaza: 230, plazaOff: 0, cycle: 30 },
    { s: "h_villager_2", y: 182, x0: 448, ph: 0.15, home: 300, plaza: 230, plazaOff: -8, cycle: 30 },
    { s: "h_villager_1", y: 180, x0: 236, ph: 0.3, home: 360, plaza: 230, plazaOff: 8, cycle: 34 }
  ];
  // v262 村莊動物點綴（style-guide「雞豬牛羊點綴」）：左/右農田帶各 1 雞（相向啄食）＋
  // 廣場右緣 1 豬（拱地）— 定點於可見地面帶（村民 y179-182 之下緣下方不會重疊的路面/草帶）
  const ANIMALS = [
    { s: "a_chicken", x: 40,  y: 175, ph: 0.0, flip: true  }, // 左農田帶（面向內）
    { s: "a_chicken", x: 440, y: 175, ph: 0.55, flip: false }, // 右農田帶（面向內）
    { s: "a_pig",     x: 300, y: 176, ph: 1.1, flip: false }  // 廣場右緣（面向廣場）
  ];
  const CLOUDS = [
    { y: 14, spd: 5, w: 6, x0: 60 },
    { y: 27, spd: 8, w: 4, x0: 210 },
    { y: 40, spd: 6, w: 5, x0: 380 }
  ];
  /* v202 村莊夜空：星辰呼吸閃爍＋偶發流星＋月暈（reduced-motion 省略 — 底景恆亮保留）
     v202FIX：疊層只畫天空帶（y<52）— 底景星星被建築遮住的部分若在疊層重繪會跑到建築前方 */
  const STARS = [];
  for (let i = 0; i < 24; i++) {
    const x = (i * 67 + 13) % 480, y = (i * 41 + 7) % 120;
    if (y < 52) STARS.push({ x, y, ph: i * 1.7, spd: 0.55 + (i % 5) * 0.22 });
  }
  function drawTownLife(t, ox, oy) {
    if (!fxCtx) return;
    const rm = !!S().settings.reducedMotion;
    // v271 A1-3：村莊生命層隨世界座標平移；村莊出視口時 raf 只 clearRect 不呼叫本函式（見 raf）
    fxCtx.save();
    fxCtx.translate(ox || 0, oy || 0);
    // v202 星空 pass：星辰呼吸（每顆獨立相位）、每 ~32 秒一顆流星、月亮呼吸光暈
    if (!rm) {
      for (const s of STARS) {
        const a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * s.spd + s.ph));
        fxCtx.globalAlpha = a;
        fxCtx.fillStyle = "rgba(255,255,255,0.92)";
        fxCtx.fillRect(s.x, s.y, 2, 2);
      }
      const mt = t % 32;
      if (mt < 0.8) {
        const mPhase = Math.floor(t / 32);
        const p = mt / 0.8;
        const mx = 60 + ((mPhase * 137) % 380);
        const my = 8 + ((mPhase * 53) % 36); // v202FIX：流星起點限制在天空帶（y<52）
        fxCtx.globalAlpha = (1 - p) * 0.9;
        fxCtx.fillStyle = "#e8ecff";
        fxCtx.fillRect(Math.round(mx + p * 90), Math.round(my + p * 24), 3, 1);
        fxCtx.fillRect(Math.round(mx + p * 90 - 5), Math.round(my + p * 24 - 1), 4, 1);
      }
      // 月亮呼吸光暈（底景月亮在 W-46, 34）
      fxCtx.globalAlpha = 0.05 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.8));
      fxCtx.fillStyle = "#ffe8b0";
      fxCtx.beginPath(); fxCtx.arc(480 - 46, 34, 20, 0, 7); fxCtx.fill();
      fxCtx.globalAlpha = 1;
    }
    // v271 A1-3：巢穴光暈遷移至 worldmap.drawEntrances（世界座標入口層）
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
    // v247：由 CELLS 推導（原硬編碼 54/150 — 置中後錯位）
    if ((st.buildings.castle || 0) > 0) torches.push(CELLS[0][0] + 38);
    if ((st.buildings.guild || 0) > 0) torches.push(CELLS[1][0] + 38); // v247FIX：guild 是 ORDER[1] → CELLS[1]（原 CELLS[5]=alchemy）
    for (const tx of torches) {
      const a = rm ? 0.8 : Math.max(0.35, Math.min(1, 0.55 + 0.3 * Math.sin(t * 13 + tx) + 0.15 * Math.sin(t * 29 + tx * 2)));
      fxCtx.globalAlpha = a;
      fxCtx.fillStyle = "#ff7a2a";
      fxCtx.fillRect(tx - 1, 117, 2, 2);
      fxCtx.fillStyle = "#ffd166";
      fxCtx.fillRect(tx, 117, 1, 1);
    }
    // v187 村莊氛圍：煙囪煙霧（時間雜湊零狀態 — 週期性 puff 上升擴散漸隱；reducedMotion 省略）
    if (!rm) {
      const SMOKE_PH = { castle: 0.2, forge: 1.5, alchemy: 2.8 }; // 有煙囪的建築 → 相位
      for (const b of layout()) {
        const ph = SMOKE_PH[b.id];
        if (ph === undefined || b.lvl <= 0) continue;
        const cx = b.x + 8 * b.scale;
        const roofY = b.y - 3;
        const period = 1.4 + ph * 0.5;
        const age = (((t * 0.85 + ph) % period) + period) % period; // 負 t 安全
        for (let k = 0; k < 3; k++) {
          const a = age + k * 0.2;
          if (a >= period) continue; // 週期邊緣：避免 alpha→0 的透明像素
          const p = a / period; // 0→1：升起＋擴散＋漸隱
          const px = cx + Math.sin(p * 6.28 + ph * 5) * (5 + 11 * p) + (k - 1) * 2;
          const py = roofY - p * 26;
          fxCtx.globalAlpha = (1 - p) * 0.42;
          fxCtx.fillStyle = "#c8cdf0";
          fxCtx.fillRect(Math.round(px), Math.round(py), 1 + (p > 0.55 ? 1 : 0), 1);
        }
      }
    }
    // v273 A5 風車扇葉轉動（4fps 2 幀交替 — animFrame 固定時基；rm 恆定幀 0；底景 frame0 常駐 → overlay 整幀 frame1 交替 — 兩幀皆含塔身 → 十字↔對角旋轉錯覺）
    if (!rm) {
      const W = MG.ui.render.animFrame(t, 4, 2, 0.3);
      if (W === 1) {
        // v273FIX：y=150 源自 drawTown 的 h=200 幀 gndY-16（gndY=H-34=166 — 非畫布高；320 世界視口與 270 回城畫布皆以 h=200 幀繪製）
        MG.ui.render.draw(fxCtx, "deco_windmill", 440, 150, 1, { scale: 1, frame: 1 });
      }
    }
    // v187 村莊氛圍：螢火蟲（4 隻在草地區正弦游移＋忽明忽滅；reducedMotion 定點恆亮）
    const FIREFLIES = [
      { ax: 24, ay: 158, ph: 0.0, c: "#ffe08a" }, { ax: 118, ay: 167, ph: 1.7, c: "#9ad8ff" },
      { ax: 362, ay: 160, ph: 3.1, c: "#ffe08a" }, { ax: 456, ay: 169, ph: 4.6, c: "#9ad8ff" }
    ];
    for (const f of FIREFLIES) {
      const x = f.ax + (rm ? 0 : Math.sin(t * 0.7 + f.ph) * 22);
      const y = f.ay + (rm ? 0 : Math.sin(t * 1.1 + f.ph * 2.3) * 9);
      const a = rm ? 0.5 : 0.25 + 0.6 * Math.abs(Math.sin(t * 2.2 + f.ph));
      fxCtx.globalAlpha = a;
      fxCtx.fillStyle = f.c;
      fxCtx.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (!rm) { // 微光暈（呼吸感）
        fxCtx.globalAlpha = a * 0.3;
        fxCtx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      }
    }
    fxCtx.globalAlpha = 1;
    // v237 A1R2 月亮倒影（溪流面 y193-199 — 月亮在 (434,34)；純時間雜湊零狀態；reducedMotion 定點恆亮）
    {
      const bx = 434;
      if (!rm) {
        for (let i = 0; i < 4; i++) {
          const x = bx - 2 + ((i * 3) % 5);
          const y = 193 + ((i * 3 + Math.floor(t * 2)) % 7);
          fxCtx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 2.2 + i * 1.3));
          fxCtx.fillStyle = "#e8ecff";
          fxCtx.fillRect(x, y, 1, 1);
        }
        fxCtx.globalAlpha = 1;
      } else {
        for (let i = 0; i < 3; i++) {
          fxCtx.globalAlpha = 0.5;
          fxCtx.fillStyle = "#e8ecff";
          fxCtx.fillRect(bx - 2 + ((i * 3) % 5), 193 + i * 2, 1, 1);
        }
        fxCtx.globalAlpha = 1;
      }
    }
    // v242 A2R2 窗戶點亮：每座建成建築疊暖窗光（窗字元 W/Q 掃描快取 — y-band 15-27 內；
    // 呼吸相位確定性；reducedMotion 恆亮 0.8；market 篷布高光 W 例外 — style-guide「窗戶點亮」）
    for (const b of layout()) {
      if (b.lvl <= 0) continue;
      const wins = windowLightsOf(b.sprite);
      if (!wins.length) continue;
      const y0 = b.y - (b.scale - 1.6) * 16; // 與 drawTierFx 同座標
      const ph0 = (b.id.length * 7 + b.lvl * 3) % 11;
      for (let i = 0; i < wins.length; i++) {
        const [wx, wy] = wins[i];
        if ((b.id.charCodeAt(0) + i * 5 + b.lvl * 3) % 10 >= 7) continue; // ~70% 窗亮（確定性）
        const a = rm ? 0.8 : 0.35 + 0.5 * Math.abs(Math.sin(t * 1.2 + ph0 + i * 1.7));
        const px = b.x + wx * b.scale, py = y0 + wy * b.scale;
        fxCtx.globalAlpha = a;
        fxCtx.fillStyle = "#ffd166";
        fxCtx.fillRect(Math.round(px), Math.round(py), 1, 1);
        fxCtx.globalAlpha = a * 0.25;
        fxCtx.fillStyle = "#ffbe5a";
        fxCtx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3);
      }
      fxCtx.globalAlpha = 1;
    }
    // v262 村莊動物點綴：雞啄食（2 幀相向）＋豬拱地（2 幀）— 幀段契約同村民（animFrame
    // 固定 fps 5 = 400ms/幀，啄食節奏悠閒）；純時間雜湊零狀態、同 t 確定性；reducedMotion 定點第 0 幀。
    // 繪於村民之前：動物貼地、村民從前方走過不被遮（前景感與 v212 大樹同語彙）
    for (let i = 0; i < ANIMALS.length; i++) {
      const a = ANIMALS[i];
      const frame = rm ? 0 : MG.ui.render.animFrame(t, 5, 2, a.ph);
      MG.ui.render.draw(fxCtx, a.s, a.x, a.y, 1, { scale: VL_SCALE, frame, flip: a.flip });
    }
    // v232 A8 村民作息狀態機：家停留(30%)→散步家→廣場(15%)→廣場停留聚集(20%)→散步廣場→家(15%)→家停留(20%)
    // 時間週期驅動零狀態（同 t 確定性）；reducedMotion 定點佇立；不觸碰編隊/招募功能
    // v232FIX3：平台+直線段週期 — 所有交界均連續（前兩版：線性分段 wrap 瞬移 338px／停留窗固定端點瞬跳 67px）
    for (let i = 0; i < VILLAGERS.length; i++) {
      const v = VILLAGERS[i];
      const homeX = v.home;
      const plazaX = v.plaza + v.plazaOff;
      let seg = (t / v.cycle + v.ph) % 1;
      if (seg < 0) seg += 1;
      let x, stay = false, movingRight = true;
      if (rm) { x = v.x0; stay = true; }
      else if (seg < 0.30) { x = homeX; stay = true; }                                                    // 家停留
      else if (seg < 0.45) { const u = (seg - 0.30) / 0.15; x = homeX + (plazaX - homeX) * u; movingRight = plazaX > homeX; } // 散步：家 → 廣場
      else if (seg < 0.65) { x = plazaX; stay = true; }                                                   // 廣場停留（聚集窗）
      else if (seg < 0.80) { const u = (seg - 0.65) / 0.15; x = plazaX + (homeX - plazaX) * u; movingRight = homeX > plazaX; } // 散步：廣場 → 家
      else { x = homeX; stay = true; }                                                                    // 家停留
      // v217 幀段契約：呼吸 0-1／站立 2／走路 3-6（animFrame 固定 fps 10）
      let frame = 2;
      if (!rm) frame = stay ? MG.ui.render.animFrame(t, 10, 2, v.ph) : 3 + MG.ui.render.animFrame(t, 10, 4, v.ph);
      MG.ui.render.draw(fxCtx, v.s, x, v.y, 1, { scale: VL_SCALE, frame, flip: !movingRight });
      // 聚集互動記號：多名村民同時在廣場停留窗（0.45-0.65）→ 頭頂交談點（極簡 1px 記號）
      if (!rm && stay && seg >= 0.45 && seg < 0.65) {
        let nAtPlaza = 0;
        for (const o of VILLAGERS) {
          let s2 = (t / o.cycle + o.ph) % 1; if (s2 < 0) s2 += 1;
          if (s2 >= 0.45 && s2 < 0.65) nAtPlaza++;
        }
        if (nAtPlaza >= 2) {
          const b = 0.5 + 0.5 * Math.sin(t * 6 + v.ph * 9);
          fxCtx.globalAlpha = 0.35 + 0.65 * b;
          fxCtx.fillStyle = "#ffe08a";
          // v232FIX：記號貼頭頂（v.y-4/-3 — 原 -14/-15 懸浮一個精靈高）
          fxCtx.fillRect(Math.round(x) - 1, Math.round(v.y - 4), 1, 1);
          fxCtx.fillRect(Math.round(x) + 2, Math.round(v.y - 3), 1, 1);
          fxCtx.globalAlpha = 1;
        }
      }
    }
    // v212 前景植栽：左下貼地大樹（TheoTown 前景層次 — 非 rm 時樹冠微擺 1px；
    // v212FIX 畫在流浪英雄之前 — 英雄從樹前走過不被遮，村民仍被樹遮（前景感））
    fxCtx.globalAlpha = 1;
    MG.ui.render.draw(fxCtx, "deco_tree1", rm ? 0 : Math.round(Math.sin(t * 0.5)), 150, 1, { scale: 2.4 });
    // 流浪英雄：依目標在建築區走動（對話泡泡只顯示在下方卡片，避免遮擋）；v225：遠征中不在村內渲染
    const ws = (st.wanderers || []).filter(w => !w.dead && w.state !== "exped");
    for (const w of ws) {
      const wy = w.y !== undefined ? w.y : 158;
      const flip = (w.lastDir || 1) < 0;
      MG.ui.render.draw(fxCtx, MG.sys.wanderers.spriteOf(w), w.x - 11, wy, 1, { scale: 1.4, frame: rm ? 0 : Math.floor(t * 3 + w.uid.length) % 2, flip });
    }
    fxCtx.restore(); // v271 A1-3：世界座標平移收尾
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
        // v181 UI/UX：升級決策現場（卡片）直接顯示下一級收益 — 詳情彈窗原有，卡片層補上；效果無變化時隱藏
        !locked && !maxed && d.effect(lv + 1) !== d.effect(lv) ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, color: "var(--gold)", opacity: 0.92 } },
          "下一級：", MG.ui.dom.h("b", { style: { fontWeight: 800 } }, d.effect(lv + 1))) : null,
        !locked && !maxed ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, color: "var(--dim2)" } }, costText(cost)) : null,
        // v231 缺口可視化：付不起時逐項「缺多少」＋前往狩獵深鏈（v191「差N」模式 — 失敗原因升級為下一步指引）
        // v231FIX：改用 button（原 a 無 href 不可鍵盤聚焦 — 全 codebase 唯一 anchor）
        !locked && !maxed && !afford ? MG.ui.dom.h("div", { style: { fontSize: 10, color: "#ff5c5c", marginTop: 1 } },
          shortfallText(cost) + "　",
          MG.ui.dom.h("button", { class: "chip", style: { fontSize: 9, padding: "1px 6px", minHeight: 18, color: "var(--blue)" }, on: { click: (e) => { e.stopPropagation(); MG.ui.screens.show("hunt"); } } }, "前往狩獵")) : null),
      locked ? (unlocked
        ? MG.ui.dom.h("button", {
          class: "btn sm " + (afford ? "gold" : ""), disabled: !afford,
          on: { click: (e) => { e.stopPropagation(); buy(b.id); } }
        }, "建造")
        : miniChip("王國 Lv " + d.unlock, false))
        : (maxed ? miniChip("已達最高等級", true) :
          MG.ui.dom.h("div", { style: { display: "flex", gap: 4 } },
            MG.ui.dom.h("button", {
              class: "btn sm " + (afford ? "gold" : ""), style: { minHeight: 30 },
              disabled: !afford,
              on: { click: (e) => { e.stopPropagation(); buy(b.id); } }
            }, "升級"),
            MG.ui.dom.h("button", {
              class: "btn sm " + (afford ? "gold" : ""), style: { minHeight: 30, padding: "2px 6px" }, disabled: !afford,
              title: "一鍵連升到資源不足或滿級",
              on: { click: (e) => { e.stopPropagation(); bulkUpgradeClick(b.id); } }
            }, "連升"))));
    cardEls[b.id] = row;
    return row;
  }
  function costText(cost) {
    const parts = ["金幣 " + MG.util.fmt(cost.gold)];
    for (const m in (cost.mats || {})) parts.push(MG.config.MATS[m].name + " " + MG.util.fmt(cost.mats[m]));
    return parts.join(" · ");
  }
  /* v231：缺口清單 — 缺哪項、差多少（持有 X/需 Y） */
  function shortfallText(cost) {
    const st = S();
    const parts = [];
    if (st.currencies.gold < cost.gold) parts.push("金幣 缺" + MG.util.fmt(cost.gold - st.currencies.gold));
    for (const m in (cost.mats || {})) {
      const have = st.mats[m] || 0;
      if (have < cost.mats[m]) parts.push(MG.config.MATS[m].name + " 缺" + MG.util.fmt(cost.mats[m] - have));
    }
    return parts.length ? "不足：" + parts.join("・") : "";
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
  /* v208 QoL：建築連升（>3 級 confirm 防誤觸；摘要回報） */
  function bulkUpgradeClick(id) {
    const d = D[id];
    const pv = B.bulkPreview(id);
    if (pv.n <= 0) { MG.ui.dom.toast("資源不足，無法升級", "bad", "icon_coin"); return; }
    const run = () => {
      const r = B.bulkUpgrade(id);
      const matTxt = Object.keys(r.mats).map(m => MG.config.MATS[m].name + "×" + r.mats[m]).join("・");
      MG.ui.dom.toast("「" + d.name + "」連升至 Lv" + r.lvl + "（" + r.n + " 級，花費 " + MG.util.fmt(r.gold) + " 金" + (matTxt ? "・" + matTxt : "") + "）", "good", "b_" + id);
      renderCards(true); renderOverview(true);
    };
    if (pv.n > 3) {
      const matTxt = Object.keys(pv.mats).map(m => MG.config.MATS[m].name + "×" + pv.mats[m]).join("・");
      MG.ui.dom.confirm("連續升級", "「" + d.name + "」可連升 " + pv.n + " 級至 Lv" + pv.lvl + "（約需 " + MG.util.fmt(pv.gold) + " 金" + (matTxt ? "・" + matTxt : "") + "）。確定？", run, { okText: "連升" });
    } else run();
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
  /* v249 古書回收鈕（圖書館專屬 — 定義於 openDetail 內以取 m）：可回收判定含書/金幣/週限三條件（v249FIX：5/5 或金幣不足時灰化非誤導） */
  /* v253 一鍵領取全部：登入收菜聚合 — 依序呼叫既有 claimAll 家族（逐來源獨立 try 不阻斷；welcome 傳說保留選角窗） */
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
  function openDetail(id) {
    const st = S();
    const lv = st.buildings[id] || 0;
    const d = D[id];
    if (id === "forge" && lv > 0) { MG.ui.more.openForge(); return; }
    if (id === "market" && lv > 0) { MG.ui.more.openMarket(); return; }
    if (id === "altar" && lv > 0) { MG.ui.more.openAltar(); return; }
    const maxed = lv >= d.max;
    const m = MG.ui.dom.modal(d.name, null, { icon: "b_" + id });
    const mkRecycleBtn = (type, label) => {
      const st2 = S();
      const can = (st2.currencies.book || 0) >= 50 && st2.currencies.gold >= MG.sys.meta.recycleFee() && ((st2.bookEx ? st2.bookEx.n : 0) < MG.sys.meta.bookExCap());
      return MG.ui.dom.h("button", {
        class: "btn sm" + (can ? " gold" : ""), style: { flex: 1, minHeight: 30 },
        disabled: !can,
        on: { click: () => {
          const r = MG.sys.meta.recycleBooks(type);
          if (!r.ok) MG.ui.dom.toast(r.reason, "bad", "icon_book"); // v249FIX：成功 toast 由 sys 發（免雙 toast）
          else { openDetail("library"); m.close(); } // v249FIX：關閉當前 modal 再重繪（防每週 5 層疊加）
        } }
      }, label);
    };
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
      // v249 古書回收（圖書館專屬）：50 技能書 → 自選 T3 素材 ×1（週限 5 — 書爆量死貨幣疏通；手續費同素材兌換錨）
      id === "library" && lv > 0 ? MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 8, padding: 8, marginBottom: 10 } },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, "古書回收：本週 " + (st.bookEx ? st.bookEx.n : 0) + "/" + MG.sys.meta.bookExCap() + " 次"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, margin: "2px 0 6px" } },
          "50 本技能書 → 自選虛空碎片／神話殘片 ×1（週限 " + MG.sys.meta.bookExCap() + "，週一重置）。手續費 " + MG.util.fmt(MG.sys.meta.recycleFee()) + " 金。"),
        MG.ui.dom.h("div", { style: { display: "flex", gap: 6 } },
          mkRecycleBtn("void", "回收 → 虛空碎片"),
          mkRecycleBtn("myth", "回收 → 神話殘片"))) : null,
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
  /* v185 素材合成視窗：來源（T1/T2 六種）→ 數量 → 目標（高階三種） */
  function openSynth() {
    const st = S();
    const MS = MG.config.MATS;
    const ratio = MG.config.MAT_SYNTH.ratio;
    let srcId = "iron", tgtId = "crystal", n = 1;
    const m = MG.ui.dom.modal("素材合成", null, { icon: "icon_hammer" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 8 } },
      "把用不完的低階素材升為高階：", MG.ui.dom.h("b", { style: { color: "var(--gold)" } }, ratio + " : 1"), "（T1→T2 手續費 100 金／次、T2→T3 500 金／次）"));
    const srcRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 } });
    body.appendChild(srcRow);
    const tgtRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 } });
    body.appendChild(tgtRow);
    const infoEl = MG.ui.dom.h("div", { style: { textAlign: "center", fontWeight: 800, fontSize: 12, color: "var(--gold)", margin: "4px 0 8px", minHeight: 16 } });
    body.appendChild(infoEl);
    const qtyEl = MG.ui.dom.h("button", { class: "chip", style: { minWidth: 46, justifyContent: "center", padding: "2px 6px", minHeight: 30, fontWeight: 900, fontSize: 13, color: "var(--gold)" }, title: "點擊手動輸入數量", on: { click: () => {
      const v = prompt("輸入合成次數（1-" + MG.sys.meta.synthMax(srcId) + "）", "");
      const vv = parseInt(v, 10);
      if (!isNaN(vv) && vv >= 1 && vv <= MG.sys.meta.synthMax(srcId)) { n = Math.floor(vv); refresh(); }
    } } }, "x1");
    const stepBtn = (txt, fn) => MG.ui.dom.h("button", { class: "chip", style: { padding: "2px 10px", minHeight: 30 }, on: { click: fn } }, txt);
    const qtyRow = MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } },
      stepBtn("−", () => { n = Math.max(1, n - 1); refresh(); }),
      qtyEl,
      stepBtn("＋", () => { n = Math.min(MG.sys.meta.synthMax(srcId) || 1, n + 1); refresh(); }),
      stepBtn("全部", () => { n = Math.max(1, MG.sys.meta.synthMax(srcId)); refresh(); }));
    body.appendChild(qtyRow);
    const go = MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%", marginTop: 8 }, on: { click: () => {
      const r = MG.sys.meta.synthesizeMat(srcId, tgtId, n);
      MG.ui.dom.toast(r.ok ? "合成完成：" + MS[tgtId].name + " ×" + r.n + "（花費 " + MG.util.fmt(r.spent) + " 金）" : r.reason, r.ok ? "good" : "bad", "icon_hammer");
      if (r.ok) { renderMats(); renderOverview(true); openSynth(); m.close(); }
    } } }, "合成");
    body.appendChild(go);
    function refresh() {
      srcRow.innerHTML = "";
      const srcs = Object.keys(MS).filter(k => MS[k].tier <= 2);
      for (const k of srcs) {
        const d = MS[k];
        const sel = k === srcId;
        srcRow.appendChild(MG.ui.dom.h("button", { class: "chip" + (sel ? " on" : ""), style: { padding: "3px 8px", minHeight: 28 }, on: { click: () => { srcId = k; const t = MS[k].tier + 1; const tgts = Object.keys(MS).filter(x => MS[x].tier === t); tgtId = tgts.includes(tgtId) ? tgtId : tgts[0]; n = 1; refresh(); } } },
          MG.ui.dom.icon(d.icon, 12), " " + d.name));
      }
      tgtRow.innerHTML = "";
      for (const k of Object.keys(MS).filter(x => MS[x].tier === MS[srcId].tier + 1)) {
        const d = MS[k];
        const sel = k === tgtId;
        tgtRow.appendChild(MG.ui.dom.h("button", { class: "chip" + (sel ? " on" : ""), style: { padding: "3px 8px", minHeight: 28 }, on: { click: () => { tgtId = k; refresh(); } } },
          MG.ui.dom.icon(d.icon, 12), " " + d.name));
      }
      const max = MG.sys.meta.synthMax(srcId);
      n = Math.max(1, Math.min(n, max || 1));
      qtyEl.textContent = "x" + n;
      const fee = (MG.config.MAT_SYNTH.fee[MS[srcId].tier] || 0) * n;
      infoEl.textContent = "消耗 " + MS[srcId].name + " ×" + (n * ratio) + " → 獲得 " + MS[tgtId].name + " ×" + n + "（手續費 " + MG.util.fmt(fee) + " 金）";
      go.disabled = max < 1;
      go.textContent = "合成　×" + n;
    }
    refresh();
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
    if (MG.config.WEEKEND_MULT && MG.util.isWeekend()) buffNames.push("週末雙倍 ×" + MG.config.WEEKEND_MULT);
    // v256 產出加成明細：每層乘數來源可展開（rates() parts 同源 — 驗證性：每個養成投資收益可查證）
    const openRateDetail = () => {
      const r2 = MG.sys.battle.rates();
      const m2 = MG.ui.dom.modal("產出加成明細", null, { icon: "icon_coin" });
      m2.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, textAlign: "center", marginBottom: 6 } },
        "金幣 " + MG.util.fmt(Math.floor(r2.goldPerSec)) + "/秒・經驗 " + MG.util.fmt(Math.floor(r2.expPerSec)) + "/秒"));
      if (!r2.parts || !r2.parts.length) {
        m2.panel.appendChild(MG.ui.dom.h("div", { class: "empty" }, "尚未派遣英雄／隊伍休整中 — 派遣或結束休整後顯示加成來源")); // v256FIX：休整狀態同空
        return;
      }
      for (const p of r2.parts) {
        m2.panel.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,.06)" } },
          MG.ui.dom.h("span", null, p.name),
          MG.ui.dom.h("span", { style: { color: "var(--gold)", fontWeight: 800 } }, "×" + p.mul.toFixed(2))));
      }
      m2.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, textAlign: "center", marginTop: 6 } },
        "金幣加成逐層累乘（經驗另有昇華／榮譽階乘數）")); // v256FIX：parts 為金幣乘數 — 經驗行不適用同一列表
    };
    grid.appendChild(mkCard("生產", "icon_coin",
      line("金幣", "+" + MG.util.fmt(Math.floor(rates.goldPerSec)) + "/秒", rates.goldPerSec > 0 ? "var(--gold)" : "var(--dim2)"),
      line("經驗", "+" + MG.util.fmt(Math.floor(rates.expPerSec)) + "/秒", rates.expPerSec > 0 ? "#7ee787" : "var(--dim2)"),
      MG.ui.dom.h("button", { class: "btn sm", style: { marginTop: 2, padding: "2px 8px", minHeight: 24, fontSize: 10 }, on: { click: openRateDetail } }, "加成明細 ▸"),
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
    // v196 UI/UX：今日待辦（登入儀式中心化 — AFK Arena 每日面板；每項可點跳轉）
    try {
      const M = MG.ui.more;
      const daily = (st.quests.daily && st.quests.daily.list) || [];
      const dailyDone = daily.filter(d => d.done).length;
      const checked = st.checkin.month === MG.util.month() && (st.checkin.days || []).includes(new Date().getDate());
      const fights = MG.sys.arena ? MG.sys.arena.fightsLeft() : 0;
      const dgLeft = MG.sys.dungeon ? MG.sys.dungeon.DEFS.reduce((a, d) => a + MG.sys.dungeon.left(d.id), 0) : 0;
      const unsold = MG.sys.market ? MG.sys.market.deals().filter(d => d.sold < d.stock).length : 0;
      // v226 補齊 v200+ 每日/週錨點：世界首領／限時活動／公會盛宴／流浪投餵
      const wbLeft = MG.sys.worldboss ? MG.sys.worldboss.left() : 0;
      const evReady = (MG.sys.events && st.events) ? MG.sys.events.MILESTONES.some(ms => !st.events.milestones[ms.pts] && (st.events.pts || 0) >= ms.pts) : false;
      const feastLeft = (MG.sys.guild && st.guild) ? (st.guild.feastDay !== MG.util.today() && (st.guild.level || 1) < MG.sys.guild.MAX_LEVEL) : false;
      const feedable = (st.wanderers || []).some(w => !w.dead && w.state !== "exped" && w.feedDay !== MG.util.today());
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
        { icon: "icon_skull", label: "深淵", val: MG.sys.abyss && !MG.sys.abyss.inAbyss() ? "可踏入" : "進行中", hot: !!(MG.sys.abyss && !MG.sys.abyss.inAbyss()), open: () => M.openAbyss(), run: () => MG.ui.more.runAbyssFight() },
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
      const strip = MG.ui.dom.h("div", { style: { marginTop: 8 } },
        MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, color: "var(--dim)", flex: 1 } }, "今日待辦"),
          // v263 一鍵例行（免費批次 — 與「一鍵領取全部」互補軸）
          MG.ui.dom.h("button", {
            class: "btn sm blue", style: { minHeight: 26, padding: "2px 10px", fontSize: 10, flexShrink: 0 },
            on: { click: runAllRoutines }
          }, "一鍵例行"),
          // v253 一鍵領取全部：登入收菜聚合（8 來源依序 — 逐來源獨立 try 不阻斷；純收益零消耗不設 confirm）
          MG.ui.dom.h("button", {
            class: "btn sm" + (MG.sys.badges && MG.sys.badges.check ? ((() => { // v253FIX：金底僅 claim 交集（soft/行動型紅點不誤亮）
              const b = MG.sys.badges.check();
              return (b.daily || b.weekly || b.ach || b.codex || b.events || b.abyss || b.welcome || b.checkin || b.wbweek) ? " gold" : "";
            })()) : ""),
            style: { minHeight: 26, padding: "2px 10px", fontSize: 10, flexShrink: 0 },
            on: { click: claimAllToday }
          }, "一鍵領取全部")),
        MG.ui.dom.h("div", { style: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 } },
          items.map(it => MG.ui.dom.h("div", {
            style: { flexShrink: 0, display: "flex", alignItems: "center", gap: 2 },
            on: { click: it.open }
          },
            MG.ui.dom.h("button", {
              class: "chip", style: { padding: "4px 10px", minHeight: 34, borderColor: it.hot ? "var(--gold2)" : "var(--line)", flexDirection: "column", gap: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }
              // v263FIX：inner chip 不綁 click（outer div 已綁 — 原雙綁 modal 開兩次）
            },
              MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 3, fontWeight: 900, fontSize: 10 } }, MG.ui.dom.icon(it.icon, 12), it.label),
              MG.ui.dom.h("span", { style: { fontSize: 10, color: it.hot ? "var(--gold)" : "var(--dim)" } }, it.val)),
            it.run ? MG.ui.dom.h("button", { // v263 inline ▶（免費批次直接執行 — 不經 modal）
              class: "chip", style: { padding: "4px 8px", minHeight: 34, borderLeft: "none", borderTopLeftRadius: 0, borderBottomLeftRadius: 0, fontSize: 11, color: it.hot ? "var(--gold)" : "var(--dim)" },
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
      MG.ui.dom.h("div", { class: "pbar", style: { height: 12 } },
        kePct),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 3 } },
        st.kingdom.level >= 50 ? "王國已達最高等級，榮光永駐。" :
          "每級：全隊攻擊/金幣/經驗 +1%（目前 +" + Math.round((st.kingdom.level - 1)) + "%）・升級送禮金，每 5 級加贈鑽石。來源：英雄升級、建築升級、討伐BOSS、離線掛機",
        // v269 里程碑禮包提示（kl 24-40 目標節點 — 與迷宮里程碑「還差 N」同構）
        (st.kingdom.level < 50 && MG.sys.game.KINGDOM_MILESTONES) ? (() => {
          const ms = MG.sys.game.KINGDOM_MILESTONES;
          const nextLv = Object.keys(ms).map(Number).sort((a, b) => a - b).find(l => l > st.kingdom.level && !((st.kingdomMile || {})[l]));
          if (!nextLv) return null;
          const m = ms[nextLv];
          const parts = [];
          if (m.gems) parts.push("鑽石 " + m.gems);
          if (m.book) parts.push("書 " + m.book);
          if (m.ticket) parts.push("券 " + m.ticket);
          if (m.void) parts.push("虛空 " + m.void);
          if (m.myth) parts.push("神話 " + m.myth);
          return MG.ui.dom.h("div", { style: { fontSize: 10, color: "var(--gold)", marginTop: 3 } },
            "下個里程碑：王國 Lv" + nextLv + "（還差 " + (nextLv - st.kingdom.level) + " 級）→ " + parts.join("・"));
        })() : null)));
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
      const row = MG.ui.dom.h("div", { class: "row", style: { padding: "8px 10px", cursor: "pointer" }, on: { click: () => {
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
    // town canvas + tier-glow overlay canvas（v271 A1-3：高 200→320 = 世界地圖視口）
    const wrap = MG.ui.dom.h("div", { style: { position: "relative", margin: "8px 10px 4px", border: "2px solid var(--line)", borderRadius: 10, overflow: "hidden" } });
    townCanvas = document.createElement("canvas");
    townCanvas.width = 480; townCanvas.height = 320;
    townCanvas.style.width = "100%"; townCanvas.style.display = "block";
    ctx = townCanvas.getContext("2d");
    wrap.appendChild(townCanvas);
    fxCanvas = document.createElement("canvas");
    fxCanvas.width = 480; fxCanvas.height = 320;
    fxCanvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
    fxCtx = fxCanvas.getContext("2d");
    wrap.appendChild(fxCanvas);
    // v271 A1-3：世界地圖捲動控制（D8：四邊置中方向鈕 — 原左上角四鍵叢集遮擋地圖內容；⌂ 左下）
    const WM = MG.ui.worldmap;
    const navBtn = (txt, x, y, fn, label) => MG.ui.dom.h("button", {
      style: { position: "absolute", left: x, top: y, width: 36, height: 36, zIndex: 3,
        background: "rgba(20,24,40,0.72)", border: "1px solid var(--line)", borderRadius: 8,
        color: "var(--text)", fontSize: 16, lineHeight: 1, cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 0 },
      title: label,
      on: { click: fn }
    }, txt);
    const navBtnR = (txt, right, y, fn, label) => MG.ui.dom.h("button", {
      style: { position: "absolute", right, top: y, width: 36, height: 36, zIndex: 3,
        background: "rgba(20,24,40,0.72)", border: "1px solid var(--line)", borderRadius: 8,
        color: "var(--text)", fontSize: 16, lineHeight: 1, cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 0 },
      title: label,
      on: { click: fn }
    }, txt);
    wrap.appendChild(navBtn("◀", 4, 142, () => WM.panBy(-WM.PAN_STEP, 0), "往左捲動"));
    wrap.appendChild(navBtnR("▶", 4, 142, () => WM.panBy(WM.PAN_STEP, 0), "往右捲動"));
    wrap.appendChild(navBtn("▲", 222, 4, () => WM.panBy(0, -WM.PAN_STEP), "往上捲動"));
    wrap.appendChild(navBtn("▼", 222, 280, () => WM.panBy(0, WM.PAN_STEP), "往下捲動"));
    wrap.appendChild(navBtn("⌂", 4, 280, () => WM.centerHome(), "回到村莊"));
    // v273：小地圖（右上 96×60 — 視口框＋入口點＋點擊跳轉）＋位置 breadcrumb（頂中）＋遠離村莊時強化回村 pill
    miniCanvas = document.createElement("canvas");
    miniCanvas.width = WM.MINI.w; miniCanvas.height = WM.MINI.h;
    miniCanvas.style.cssText = "position:absolute;right:6px;top:6px;z-index:3;border:1px solid rgba(232,216,168,.35);border-radius:4px;background:#10131f;";
    miniCtx = miniCanvas.getContext("2d"); // v273FIX：快取 context（原 raf 每幀 getContext）
    miniCanvas.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      const r = miniCanvas.getBoundingClientRect();
      // v273FIX：border-box 反算（border 1px → 內容 94px 自 offset 1 起 — 原偏移至多 33 世界 px）
      const cw = r.width - 2, ch = r.height - 2;
      const wx = Math.round((e.clientX - r.left - 1) / cw * WM.WORLD.w);
      const wy = Math.round((e.clientY - r.top - 1) / ch * WM.WORLD.h);
      WM.jumpTo(wx, wy);
      drawTown();
    });
    wrap.appendChild(miniCanvas);
    locChip = MG.ui.dom.h("div", { style: { position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", zIndex: 3, fontSize: 10, padding: "2px 8px", borderRadius: 8, background: "rgba(16,19,31,.8)", border: "1px solid rgba(232,216,168,.3)", color: "var(--gold)", pointerEvents: "none" } }, "世界地圖");
    wrap.appendChild(locChip);
    homePill = MG.ui.dom.h("button", {
      style: { position: "absolute", right: 106, top: 70, zIndex: 3, fontSize: 10, padding: "3px 10px", borderRadius: 10, background: "rgba(255,209,102,.18)", border: "1px solid var(--gold2)", color: "var(--gold)", display: "none" }, // v273FIX：top 70（小地圖下方 — 原 top 6 窄屏與 breadcrumb 重疊）
      on: { click: () => { WM.centerHome(); drawTown(); } }
    }, "⌂ 回村");
    wrap.appendChild(homePill);
    // v269：點擊命中由 worldmap 統一處理（建築 → openDetail；入口 → action）
    WM.attachInput(townCanvas, { hitBuilding, onBuilding: openDetail });
    // v257 A3 入口點擊區已由 worldmap 入口層取代（overlayCells 移除）
    root.appendChild(wrap);
    drawTown();
    // v137：資源總覽（原頂欄全部貨幣移入：金幣/鑽石/招募券/榮譽/書）
    const resWrap = MG.ui.dom.h("div", { style: { margin: "0 10px 10px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 } });
    const RES = [
      ["icon_coin", "金幣", "gold", "var(--gold)"],
      ["icon_gem", "鑽石", "gems", "var(--blue)"],
      ["icon_ticket", "招募券", "ticket", "var(--r5)"],
      ["icon_honor", "榮譽", "honor", "var(--r5)"],
      ["icon_book", "魔法書", "book", "var(--gold)"],
      ["icon_honor", "王者幣", "royalCoins", "var(--gold)"], // v261 資源導覽補新貨幣（王國 Lv12 後可見）
      ["icon_honor", "置換石", "swapStone", "var(--r5)"]
    ];
    resSpans = {};
    for (const [icon, label, key, color] of RES) {
      // v246：資源總覽格可點 → 來源導覽（與頂欄行為一致 — 金幣/鑽石已有，補 honor/ticket/book）
      const cell = MG.ui.dom.h("div", { class: "panel2", style: { display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", fontSize: 12, cursor: "pointer" }, on: { click: () => MG.ui.more.openResourceGuide(key) } },
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
    // v185 素材合成入口（T1×4→T2、T2×4→T3）
    const synthBtn = MG.ui.dom.h("button", { class: "chip", style: { margin: "0 10px 6px", marginLeft: "auto", padding: "3px 12px", minHeight: 28, borderColor: "var(--gold2)", color: "var(--gold)", fontWeight: 800 }, on: { click: openSynth } },
      MG.ui.dom.icon("icon_hammer", 12), " 素材合成");
    root.appendChild(MG.ui.dom.h("div", { style: { display: "flex" } }, synthBtn));
    matsEl = MG.ui.dom.h("div", { style: { margin: "0 10px 10px" } });
    root.appendChild(matsEl);
    buildMats();
    // awakening banner
    if (MG.sys.meta.canAwaken()) {
      // v224FIX：橫幅預覽與 meta.awaken 同封頂（原未封頂 — 11+ 次時誇大預期）
      const awN = S().awakenings || 0;
      const honor = Math.floor((100 + 25 * Math.min(awN, 10)) * B.effects().honorMul);
      const nextAtk = awN < 5 ? 25 : 5;
      root.appendChild(MG.ui.dom.h("div", { class: "panel", style: { margin: "0 10px 10px", borderColor: "var(--r6)", textAlign: "center", padding: "10px 12px" } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, color: "var(--r6)", fontSize: 15, letterSpacing: 1 } }, "昇華時刻來臨"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 12, marginTop: 2 } }, "王國已然茁壯。獻上一切，換取神話之力。"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, color: "var(--gold)", marginTop: 4 } },
          "預期收穫：+" + MG.util.fmt(honor) + " 榮譽 · 攻擊 +" + nextAtk + "% · 金幣 +" + nextAtk + "% · 經驗 +" + (awN < 5 ? 5 : 1) + "%（永久）"),
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
    raf: (now) => {
      // v271 A1-3：世界地圖每幀重繪底景（平移/捲動即時反映 — 原僅 onShow 繪一次致 pan 後凍結舊視圖）；
      // fx 兩層以世界座標平移；村莊出視口時 fx 只清不繪（冒險帶視圖零浪費）
      drawTown();
      const WM = MG.ui.worldmap;
      const cam = WM.cam();
      const ox = WM.VILLAGE.x - cam.x, oy = WM.VILLAGE.y - cam.y;
      const inView = ox > -480 && ox < 480 && oy > -200 && oy < 320;
      const t = now / 1000;
      if (inView) { drawTierFx(t, ox, oy); drawTownLife(t, ox, oy); }
      else if (fxCtx) fxCtx.clearRect(0, 0, 480, 320);
      // v273：位置感知（breadcrumb 節流 500ms）+ 小地圖重繪
      if (miniCanvas && locChip && homePill) {
        if (now - 500 > lastLocAt) {
          lastLocAt = now;
          locChip.textContent = WM.nearestLabel();
          // v273FIX：視口矩形與村莊矩形分離判定（四方向對稱 — 原以村莊左上角為參考，西/北永不可達）
          const V = WM.VILLAGE;
          const far = cam.x + VIEW_W < V.x || cam.x > V.x + V.w || cam.y + VIEW_H < V.y || cam.y > V.y + V.h; // 視口與村莊完全分離即 far（四方向對稱）
          homePill.style.display = far ? "block" : "none";
        }
        WM.drawMinimap(miniCtx, t); // v273FIX：快取 ctx
      }
    }
  };
  MG.ui.screens.register("kingdom", screen);
  MG.ui.screens.register("buildings", {
    render: renderBuildings,
    refresh: renderCards
  });
  return Object.assign(screen, { townView, showCastleLevelUp });
})();
