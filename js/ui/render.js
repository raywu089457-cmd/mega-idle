/* 放置王國 MEGA IDLE — canvas renderer: sprite cache, battle scene, town scene */
"use strict";
MG.ui = MG.ui || {};
MG.ui.render = (function () {
  const caches = {}; // name -> [canvas per frame]
  // v590：投射物殘影拖尾 — GS/GA 索引=k（1=最新..4=最舊）；k 越大 → 越小越淡（由尾到頭遞增）
  const GS = [0, 1.30, 1.12, 0.95, 0.78];
  const GA = [0, 0.55, 0.35, 0.20, 0.10]; // v590：彗星拖尾 — 頭(全alpha/s1.5)＞g1(0.55)＞g2(0.35)＞g3(0.2)＞g4(0.1) 逐級縮小變淡，不糊帶
  // v252 A2 確定性哈希（叢生樹林/山丘差異/不規則色階 — 同輸入同輸出，重繪不變；無 Math.random）
  function hsh(i, seed) {
    let x = ((i * 2654435761 + seed * 2246822519) >>> 0);
    x ^= x >>> 13;
    x = (x * 2654435761) >>> 0;
    return x;
  }
  function canvasOf(name) {
    if (caches[name]) return caches[name];
    const sp = MG.data.sprites.get(name);
    if (!sp) return null;
    const arr = sp.frames.map(rows => {
      const c = document.createElement("canvas");
      c.width = sp.w; c.height = sp.h;
      const ctx = c.getContext("2d");
      for (let y = 0; y < rows.length; y++) {
        const row = rows[y];
        for (let x = 0; x < row.length; x++) {
          const ch = row[x];
          if (ch === ".") continue;
          const col = sp.pal[ch];
          if (!col) continue;
          ctx.fillStyle = col;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      return c;
    });
    caches[name] = arr;
    return arr;
  }
  const whiteCaches = {}; // sprite name:frame -> white silhouette canvas
  function whiteOf(name, frameIdx) {
    const key = name + ":" + (frameIdx || 0);
    if (whiteCaches[key]) return whiteCaches[key];
    const arr = canvasOf(name);
    if (!arr || !arr.length) return null;
    const src = arr[frameIdx || 0];
    if (!src) return null;
    const c = document.createElement("canvas");
    c.width = src.width; c.height = src.height;
    const cctx = c.getContext("2d");
    cctx.drawImage(src, 0, 0);
    cctx.globalCompositeOperation = "source-in";
    cctx.fillStyle = "#ffffff";
    cctx.fillRect(0, 0, c.width, c.height);
    whiteCaches[key] = c;
    return c;
  }
  const urlCache = {}; // v131：dataURL 快取（200 格重建時每格 toDataURL 是卡頓主因）
  function spriteURL(name) {
    if (urlCache[name]) return urlCache[name];
    const arr = canvasOf(name);
    if (!arr || !arr.length) return null;
    // bake at 4x for crisp DOM icons
    const src = arr[0];
    const c = document.createElement("canvas");
    c.width = src.width * 4; c.height = src.height * 4;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, c.width, c.height);
    urlCache[name] = c.toDataURL();
    return urlCache[name];
  }
  function frameIdx(name, t) {
    const sp = MG.data.sprites.get(name);
    if (!sp || sp.frames.length <= 1 || !sp.rate) return 0;
    return Math.floor(t / sp.rate) % sp.frames.length;
  }
  function draw(ctx, name, x, y, scale, opts) {
    const o = opts || {};
    const arr = canvasOf(name);
    if (!arr || !arr.length) return;
    let fi = o.frame !== undefined ? o.frame : frameIdx(name, o.t || 0);
    if (fi >= arr.length) fi = arr.length - 1; // 幀防呆 — 超界 clamp 而非消失
    const f = arr[fi];
    if (!f) return;
    const w = f.width * (o.scale !== undefined ? o.scale : scale || 1);
    const h = f.height * (o.scale !== undefined ? o.scale : scale || 1);
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    if (o.flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); }
    else ctx.translate(x, y);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(f, 0, 0, w, h);
    ctx.restore();
    return { w, h };
  }
  /* ---------- v568 待機眨眼（確定性程序動畫） ----------
     英雄待機時週期性閉眼 0.13s（每 ~3.4s 一次，per-seed 相位錯開 — 無 Math.random）。
     眼睛像素（sprite 座標, frame 0）以膚色/面罩/面甲色覆蓋 = 閉眼讀法。
     rm/攻擊/受擊/死亡由呼叫端守閘（與 v325 張望同閘）。 */
  const BLINK_EYES = {
    h_sword:    { px: [[6,6],[7,6],[6,9],[7,9]], c: "#ead49a" },  // 藍衣劍士：眼兩側 J/G 以膚色 H 覆蓋
    h_archer:   { px: [[6,7],[7,7]],             c: "#eed592" },  // 綠帽弓手：單眼（帽影）以膚色 K 覆蓋
    h_mage:     { px: [[8,7],[8,8]],             c: "#09060a" },  // 紫袍法師：帽影下雙 B 以臉影色 A 覆蓋
    h_assassin: { px: [[6,7],[6,10]],            c: "#ebe47d" },  // 粉刺客：金面具眼洞 A 以面罩金 G 覆蓋
    h_knight:   { px: [[7,6],[7,9]],             c: "#df9542" },  // 金騎士：面甲縫暗 H 以甲金 E 覆蓋
    h_priest:   { px: [[6,6],[7,6],[6,9],[7,9]], c: "#e6d3b1" }   // 米白牧師：眼兩側 B/H 以膚色 K 覆蓋
  };
  function blinkClosed(t, seed) {
    return ((t + seed * 0.9) % 3.4) < 0.13;
  }
  const blinkOvCaches = {};   // sprite → 32×32 overlay canvas（閉眼像素預烘焙）
  function blinkOverlay(sprite) {
    const e = BLINK_EYES[sprite];
    if (!e) return null;
    if (!blinkOvCaches[sprite]) {
      const c = document.createElement("canvas");
      c.width = 32; c.height = 32;
      const b = c.getContext("2d");
      b.fillStyle = e.c;
      for (const [r, c0] of e.px) b.fillRect(c0 * 2, r * 2, 2, 2);
      blinkOvCaches[sprite] = c;
    }
    return blinkOvCaches[sprite];
  }
  function drawBlink(ctx, sprite, x, y, flip, t, seed) {
    const ov = blinkOverlay(sprite);
    if (!ov || !blinkClosed(t, seed)) return;
    // v568FIX：以 drawImage 同一路徑覆繪 — fillRect 於 bob 小數 y 會反鋸齒（眼像素半覆蓋混色），
    // drawImage + imageSmoothingEnabled=false 與主精靈同一整數格對齊，2×2 完整覆蓋
    ctx.save();
    if (flip) { ctx.translate(x + 32, y); ctx.scale(-1, 1); }
    else ctx.translate(x, y);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(ov, 0, 0, 32, 32);
    ctx.restore();
  }
  /* ---------- battle scene ---------- */
  function drawBattle(ctx, view) {
    const W = 480, H = 270;
    const pal = view.pal || { sky1: "#5ec8e5", sky2: "#2a6f9c", ground: "#4c8a3f", accent: "#ffe08a" };
    ctx.save();
    if (view.shake > 0) {
      const s = view.shake * 6;
      ctx.translate(Math.sin(view.t * 90) * s, Math.cos(view.t * 77) * s * 0.6);
    }
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.72);
    g.addColorStop(0, pal.sky1); g.addColorStop(1, pal.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H * 0.72);
    // v182 場景視差：像素波浪雲帶緩慢橫移（110 秒一循環）+ 遠山微幅漂移（近快遠慢）— reducedMotion 靜止
    if (!view.rm) {
      const band = (phase, speed, alpha, y, len, amp) => {
        const span = W + len * 2;
        const cx = ((phase * 37 + view.t * speed) % span) - len;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pal.accent || "#ffe08a";
        for (let i = 0; i < len; i++) {
          const hgt = 1 + Math.floor(Math.abs(Math.sin(i * 0.45 + phase * 7)) * amp);
          ctx.fillRect(cx + i, y - hgt, 1, hgt);
        }
      };
      band(0, 5, 0.09, H * 0.18, 80, 2);   // 遠雲（慢、薄）
      band(1.3, 8, 0.12, H * 0.3, 60, 2.5); // 近雲（快、略亮）
    }
    ctx.globalAlpha = 1;
    // distant hills（漂移相位：近山快、遠山慢 → 深度感）
    const drift = (base, ph, sp, amp) => view.rm ? base : base + Math.sin(view.t * sp + ph) * amp;
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    hill(ctx, drift(40, 1.2, 0.05, 3), H * 0.62, 160, 60);
    hill(ctx, drift(300, 2.4, 0.09, 5), H * 0.66, 220, 80);
    hill(ctx, drift(-60, 3.1, 0.13, 7), H * 0.68, 200, 70);
    // ground
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, H * 0.72, W, H - H * 0.72);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, H * 0.72, W, 4);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, H * 0.72 + 14, W, 2);
    // dying monster: v628 上升消散 — 取消壓扁貼地（低 alpha 壓扁體錨在地面帶 y202-234,讀作地面雜物/
    // 第二隻活怪 — round-18 取證）;錨回在場怪物同一地面錨（my）,上飄+漸隱,縮放恆 1（drawn under the incoming monster）
    if (view.dying) {
      const d = view.dying;
      const dw = 16 * d.size, dh = 16 * d.size;
      const dmy = H * 0.72 + 8; // 與在場怪物同地面錨
      draw(ctx, d.sprite, d.x - dw / 2, dmy - dh + (d.yOff || 0), 1, { scale: d.size, t: view.t, alpha: d.alpha });
    }
    // v628 命終白閃：擊殺瞬間舊怪白色剪影一拍（0.15s 漸隱;與受擊/英雄倒地白閃同語彙;rm 不觸發 — hunt.js 端守閘）
    if (view.killFlash) {
      const kf = view.killFlash;
      const wf = whiteOf(kf.sprite, 0);
      if (wf) {
        const kw = 16 * kf.size, kh = 16 * kf.size;
        ctx.save();
        ctx.globalAlpha = kf.alpha;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(wf, kf.x - kw / 2, kf.y, kw, kh);
        ctx.restore();
      }
    }
    // monster
    const m = view.monster;
    if (m) {
      const my = H * 0.72 + 8;
      const mw = 16 * m.scale, mh = 16 * m.scale;
      // v232 A8 敵人巡邏節奏：待機時左右微踱步（正弦 2px、per-sprite 種子）；受擊（flash）／凍結（frozen）／死亡靜止（被打停 — 索敵節奏）
      const mSeed = m.seed !== undefined ? m.seed : (m.sprite || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const bobX = (view.rm || m.flash > 0 || m.dead || m.frozen) ? 0 : Math.sin(view.t * 1.7 + mSeed) * 2;
      // v288 行動前搖：攻擊前 0.22s 蓄力 — 快速抖動＋微下沉（可讀的攻擊預告；rm 靜止）
      // v549FIX：前搖警示 — 攻擊前最後一格（game.js SIM_STEP=0.5s 分片模擬,
      // mAtk 0.4→-0.1 直接跳過 0.22 區間,原條件結構性不可達）— 頭頂感嘆號(紅白閃爍;BOSS 放大 1.4×)
      // v626FIX：windup 解閘 rm — rm 玩家也拿得到攻擊預告（「!」恆亮、抖動仍定幀）
      const windup = m.windup !== undefined && m.windup > 0 && m.windup <= 0.5 && !m.dead;
      const wdX = windup && !view.rm ? Math.sin(view.t * 46) * 2.2 : 0;
      const wdY = windup && !view.rm ? Math.abs(Math.sin(view.t * 46)) * 1.2 : 0;
      const mx = (m.x !== undefined ? m.x : W * 0.62) + bobX + wdX;
      draw(ctx, m.sprite, mx - mw / 2, my - mh + wdY, 1, { scale: m.scale, t: view.t, frame: m.frame, alpha: m.dead ? 0.3 : 1 });
      // v297：Boss 機制視覺化（可讀性 — 五機制各自辨識；rm 恆亮）
      if (m.mech && !m.dead) {
        const rm = view.rm;
        if (m.mech === "shield" && m.t < (8 * ((MG.config.BOSS_MECH_DIFF_MUL && MG.config.BOSS_MECH_DIFF_MUL[(MG.game.state.hunt && MG.game.state.hunt.difficulty) || 0]) || 1))) {
          // 護盾：開戰 8 秒藍色半透明罩
          ctx.fillStyle = rm ? "rgba(120,190,255,0.18)" : "rgba(120,190,255," + (0.14 + 0.07 * (0.5 + 0.5 * Math.sin(view.t * 5))).toFixed(3) + ")";
          ctx.beginPath();
          ctx.ellipse(mx, my - mh / 2 + wdY, mw * 0.62, mh * 0.68, 0, 0, 6.2832);
          ctx.fill();
          ctx.strokeStyle = rm ? "rgba(140,205,255,0.6)" : "rgba(140,205,255," + (0.4 + 0.25 * (0.5 + 0.5 * Math.sin(view.t * 5))).toFixed(3) + ")";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (m.mech === "regen" && m.hp > 0 && m.hp < m.maxHp * 0.5) {
          // 再生：低血綠色呼吸光環（v297FIX：提高亮度 — 白色系龍身上原對比不足）
          const a = rm ? 0.4 : 0.3 + 0.2 * (0.5 + 0.5 * Math.sin(view.t * 4));
          ctx.strokeStyle = "rgba(90,240,130," + a.toFixed(3) + ")";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(mx, my - mh / 2 + wdY, mw * 0.72, mh * 0.78, 0, 0, 6.2832);
          ctx.stroke();
          ctx.fillStyle = "rgba(90,240,130," + (a * 0.4).toFixed(3) + ")";
          ctx.beginPath();
          ctx.ellipse(mx, my - mh / 2 + wdY, mw * 0.72, mh * 0.78, 0, 0, 6.2832);
          ctx.fill();
          // 再生閃爍十字（綠色回復標記）
          ctx.fillStyle = rm ? "rgba(140,255,170,0.8)" : "rgba(140,255,170," + (0.5 + 0.5 * Math.sin(view.t * 6)).toFixed(3) + ")";
          ctx.fillRect(mx - 1, my - mh - 14, 2, 6);
          ctx.fillRect(mx - 3, my - mh - 12, 6, 2);
        }
        if (m.mech === "poison") {
          // 劇毒：綠色毒霧滴（常駐）
          const ph = rm ? 0.5 : ((view.t / 700) % 1);
          ctx.fillStyle = rm ? "rgba(110,220,90,0.3)" : "rgba(110,220,90," + (0.4 * (1 - ph)).toFixed(3) + ")";
          ctx.fillRect(mx - 8 + (m.poisonT % 1) * 4, my - mh * 0.75 - ph * 8, 3, 3);
          ctx.fillStyle = rm ? "rgba(90,180,70,0.22)" : "rgba(90,180,70," + (0.3 * (1 - ((view.t / 900) % 1))).toFixed(3) + ")";
          ctx.fillRect(mx + 4 + ((view.t / 800) % 1) * 3, my - mh * 0.6 - ((view.t / 800) % 1) * 7, 2, 2);
        }
        if (m.mech === "lifesteal") {
          // 吸血：暗紅霧滴（常駐，攻擊前搖時加深 — 吸血的威脅提示）
          const windupBoost = m.windup !== undefined && m.windup < 0.22 && m.windup > 0 ? 1.6 : 1;
          const ph = rm ? 0.5 : ((view.t / 650) % 1);
          ctx.fillStyle = "rgba(230,60,60," + Math.min(0.55, (0.3 * windupBoost * (1 - ph))).toFixed(3) + ")";
          ctx.fillRect(mx - 9 + (m.poisonT % 1) * 5, my - mh * 0.7 - ph * 9, 3, 3);
          ctx.fillStyle = "rgba(200,40,40," + Math.min(0.45, (0.22 * windupBoost * (1 - ((view.t / 850) % 1)))).toFixed(3) + ")";
          ctx.fillRect(mx + 5 + ((view.t / 780) % 1) * 4, my - mh * 0.55 - ((view.t / 780) % 1) * 8, 2, 2);
        }
        if (m.mech === "aoe" && m.aoeT < 1.2 && m.aoeT > 0) {
          // 震怒：落地紅色預警圈（前搖警示）
          const ph = 1 - m.aoeT / 1.2;
          const rr = 20 + ph * 14;
          const a = rm ? 0.3 : (0.5 + 0.3 * Math.sin(view.t * 18)) * (1 - ph * 0.4);
          ctx.strokeStyle = "rgba(255,80,80," + Math.max(0.15, a).toFixed(3) + ")";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(mx, my, rr, rr * 0.42, 0, 0, 6.2832);
          ctx.stroke();
          ctx.fillStyle = "rgba(255,80,80," + Math.max(0.06, a * 0.3).toFixed(3) + ")";
          ctx.beginPath();
          ctx.ellipse(mx, my, rr, rr * 0.42, 0, 0, 6.2832);
          ctx.fill();
        }
      }
      // 2-frame white hit flash overlay
      if (m.flash > 0) {
        const fi = m.frame !== undefined ? m.frame : frameIdx(m.sprite, view.t);
        const wf = whiteOf(m.sprite, fi);
        if (wf) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, m.flash / 0.033);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(wf, mx - mw / 2, my - mh, mw, mh);
          ctx.restore();
        }
      }
      if (m.frozen) { ctx.fillStyle = "rgba(154,216,240,0.35)"; ctx.fillRect(mx - mw / 2 - 2, my - mh - 2, mw + 4, mh + 4); }
      // hp bar（v287：BOSS 血條加粗 6→9px；瀕死 <25% 紅色脈動閃爍，rm 恆亮）
      const lowHp = m.hp / m.maxHp < 0.25 && m.hp > 0;
      const bh = m.boss ? 9 : 6;
      const bw = Math.max(60, mw + 10);
      const bx = mx - bw / 2, by = my - mh - 12 - (bh - 6);
      ctx.fillStyle = "#10111f"; ctx.fillRect(bx, by, bw, bh);
      let barFill = m.boss ? "#ff5c8a" : "#e85c5c";
      if (lowHp && !view.rm) {
        const pulse = 0.5 + 0.5 * Math.sin(view.t * 12);   // 瀕死警訊閃爍
        ctx.fillStyle = "rgba(255,70,70," + (0.55 + 0.45 * pulse).toFixed(3) + ")";
        ctx.fillRect(bx + 1, by + 1, (bw - 2) * Math.max(0, m.hp / m.maxHp), bh - 2);
        ctx.fillStyle = "rgba(255,209,102," + (0.35 + 0.3 * pulse).toFixed(3) + ")";  // 金邊脈動
        ctx.fillRect(bx, by, bw, 1);
        ctx.fillRect(bx, by + bh - 1, bw, 1);
      } else {
        ctx.fillStyle = barFill;
        ctx.fillRect(bx + 1, by + 1, (bw - 2) * Math.max(0, m.hp / m.maxHp), bh - 2);
      }
      // name label: 11px with dark outline（v116：名字不加 BOSS 字樣；精英/稀有度著色）
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(8,10,22,0.92)";
      ctx.strokeText(m.name, mx, by - 4);
      ctx.fillStyle = m.boss ? "#ffd166" : m.elite ? (m.rarity >= 5 ? "#ff9f43" : "#a78bfa") : "#f2f4ff";
      ctx.fillText(m.name, mx, by - 4);
      // v545：BOSS 機制名稱標記（血條下常駐 chip — 特效之外文字可讀；開戰即知要面對什麼）
      if (m.mech && !m.dead) {
        const md = (MG.config.BOSS_MECHS || {})[m.mech];
        if (md) {
          const tag = "【" + md.name + "】";
          ctx.font = "bold 9px monospace";
          ctx.lineWidth = 2.5;
          ctx.strokeText(tag, mx, by + 11);
          ctx.fillStyle = m.mech === "poison" || m.mech === "regen" ? "#7ee787" : m.mech === "shield" ? "#9db4ff" : m.mech === "lifesteal" ? "#ff7a7a" : "#ff9f43";
          ctx.fillText(tag, mx, by + 11);
        }
      }
      // v626：前搖警示「!」移到最頂層（v549 原繪於血條/名字之前被整個蓋掉；錨點上移到名字上方淨空帶 by-20）
      // — 攻擊前 0.5s 紅/金閃爍感嘆號（BOSS 放大 1.4×）；rm 恆紅不閃、無抖動（rm 定幀≠隱藏預告資訊）
      if (windup) {
        const big = m.boss ? 1.4 : 1;
        const blink = view.rm ? true : Math.sin(view.t * 40) > 0;
        ctx.font = "bold " + Math.round(13 * big) + "px monospace";
        ctx.textAlign = "center";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(8,10,22,0.92)";
        ctx.strokeText("!", mx, by - 20);
        ctx.fillStyle = blink ? "#ff5c5c" : "#ffd166";
        ctx.fillText("!", mx, by - 20);
      }
    }
    // team
    // v552 死亡表現：倒地動畫（0-0.12s 白閃 → 0.12-0.55s 壓縮倒地）→ 靜態屍體＋紅 ✕
    //（英雄死亡唯一可讀呈現 — 原為原地站立 0 血；reducedMotion 直接靜態屍體，無動畫）
    function drawCorpse(ctx, tm, tx, ty, view) {
      const rm = view.rm;
      const dt = tm.downT !== undefined ? tm.downT : 9;
      let sy, alpha, flash = 0;
      if (rm || dt >= 0.55) { sy = 0.32; alpha = 0.6; }                                    // 靜態屍體
      else if (dt < 0.12) { sy = 1; alpha = 1; flash = 1 - dt / 0.12; }                    // 死亡瞬間白閃
      else { const p = (dt - 0.12) / 0.43; const e = p * p * (3 - 2 * p); sy = 1 - 0.68 * e; alpha = 1 - 0.4 * e; } // 倒地
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(tx + 1, ty + 1);
      ctx.scale(1.15, sy);                                    // 側向壓扁 = 趴地讀法
      draw(ctx, tm.sprite, 0, -32, 1, { scale: 2, frame: 0, t: view.t });
      ctx.restore();
      if (flash > 0) {                                        // 死亡白閃（與受擊白閃同語彙）
        const wf = whiteOf(tm.sprite, 0);
        if (wf) {
          ctx.save();
          ctx.globalAlpha = flash;
          ctx.imageSmoothingEnabled = false;
          if (tm.flip) { ctx.translate(tx + 32, ty - 32); ctx.scale(-1, 1); ctx.drawImage(wf, 0, 0, 32, 32); }
          else ctx.drawImage(wf, tx, ty - 32, 32, 32);
          ctx.restore();
        }
      }
      // 紅 ✕ 常駐標記（手繪 5×5 像素十字 — 不依賴字體缺字；黑描邊＋紅芯，與像素風一致；
      // 跟隨屍體高度下沉 — 與「嘲」/「技」狀態圖示同語彙，一眼可讀）
      const xC = Math.round(tx + 17), yC = Math.round(ty + 1 - 32 * sy - 5);
      ctx.fillStyle = "rgba(8,10,22,0.92)";
      for (let ox = -2; ox <= 2; ox += 2) {
        for (let oy = -2; oy <= 2; oy += 2) {
          for (let r = 0; r < 5; r++) {
            for (let cc = 0; cc < 5; cc++) {
              if (r === cc || r + cc === 4) ctx.fillRect(xC - 5 + cc * 2 + ox, yC - 5 + r * 2 + oy, 2, 2);
            }
          }
        }
      }
      ctx.fillStyle = "#ff5c5c";
      for (let r = 0; r < 5; r++) {
        for (let cc = 0; cc < 5; cc++) {
          if (r === cc || r + cc === 4) ctx.fillRect(xC - 5 + cc * 2, yC - 5 + r * 2, 2, 2);
        }
      }
    }
    for (const tm of view.team || []) {
      const tx = tm.x, ty = tm.y;
      if (tm.dead) { drawCorpse(ctx, tm, tx, ty, view); continue; } // v552：屍體取代正常繪製（含血條/攻擊/受擊/狀態圖示）
      const bob = view.rm ? 0 : Math.sin(view.t * 4 + tm.seed) * 1.2;
      // v325：待機偶發張望（每 ~5s 一次 0.5s 側頭；rm 無；攻擊/受擊時不觸發）
      let glance = 0;
      if (!view.rm && !tm.attack && !tm.hurt && !tm.dead) {
        const ph = (view.t + tm.seed * 2.1) % 5;
        if (ph < 0.5) glance = Math.sin(ph / 0.5 * 3.14) * 1.5;   // 側頭位移
      }
      // v222 攻擊 3 段式（A6）：前搖→揮擊→收招相位對映（0.4s 窗 — 施法維持原攻擊幀）
      // v324：職業差異化 — 遠程（弓手拉弓/法師舉杖）用攻B幀＋更高舉手，前搖更長
      // v563：職業特化攻擊幀 — 刺客突刺／騎士盾頂（F7，新繪製：頭/盔列與 F0 逐字元一致）；
      // 刺客低身前刺（lift 4）、騎士舉盾前頂（lift 6）— 近戰不再共用同一揮擊姿勢
      const ranged = tm.cls === "archer" || tm.cls === "mage";
      const strikeF = (tm.cls === "assassin" || tm.cls === "knight") ? 7 : 2; // v563：F7 僅此二職業有（draw 有超界 clamp 防呆）
      let frame = 0, atkLift = 0;
      if (tm.attack) {
        if (tm.casting) { frame = ranged ? 3 : 2; atkLift = ranged ? 8 : 6; }
        else if (tm.atkLeft > (ranged ? 0.35 : 0.3)) { frame = 3; atkLift = ranged ? 4 : 2; }  // 前搖（遠程拉弓/蓄力更深）
        else if (tm.atkLeft > 0.1) { frame = strikeF; atkLift = strikeF === 7 ? (tm.cls === "assassin" ? 4 : 6) : (ranged ? 8 : 6); }  // 揮擊主幀
        else { frame = 4; atkLift = ranged ? 8 : 6; }                        // 收招（武器回位）
      }
      // v222 受擊後仰：下沉 2px＋向後 1px（純 transform — 不需新美術幀）；白→原色漸回
      const hurtLift = tm.hurt ? 2 : 0;
      const hurtBack = tm.hurt ? (tm.flip ? 1 : -1) : 0;
      const drawY = ty + bob - atkLift + hurtLift;
      draw(ctx, tm.sprite, tx + hurtBack + glance, drawY, 1, { scale: 2, flip: tm.flip, frame, t: view.t });
      // v568：待機眨眼 — 與張望同閘（rm/攻擊/受擊/死亡不眨）；閉眼 0.13s 覆繪於眼睛像素
      if (!view.rm && !tm.attack && !tm.hurt && !tm.dead) {
        drawBlink(ctx, tm.sprite, tx + hurtBack + glance, drawY, tm.flip, view.t, tm.seed);
      }
      // 攻擊/施法瞬間白閃（高對比，肉眼可見）
      if (tm.attack) {
        const wf = whiteOf(tm.sprite, frame);
        if (wf) {
          ctx.save();
          ctx.globalAlpha = tm.casting ? 0.4 : 0.28;
          ctx.imageSmoothingEnabled = false;
          if (tm.flip) { ctx.translate(tx + 32 + hurtBack, drawY); ctx.scale(-1, 1); ctx.drawImage(wf, 0, 0, 32, 32); }
          else ctx.drawImage(wf, tx + hurtBack, drawY, 32, 32);
          ctx.restore();
        }
      }
      // v222 受擊白閃 overlay（白→原色漸回 — 前 0.15s 從 1 線性衰減）
      if (tm.hurt && tm.hurtLeft > 0.15) {
        const wf = whiteOf(tm.sprite, frame);
        if (wf) {
          ctx.save();
          ctx.globalAlpha = (tm.hurtLeft - 0.15) / 0.15;
          ctx.imageSmoothingEnabled = false;
          if (tm.flip) { ctx.translate(tx + 32 + hurtBack, drawY); ctx.scale(-1, 1); ctx.drawImage(wf, 0, 0, 32, 32); }
          else ctx.drawImage(wf, tx + hurtBack, drawY, 32, 32);
          ctx.restore();
        }
      }
      // hp bar
      ctx.fillStyle = "#10111f"; ctx.fillRect(tx + 2, ty - 7, 26, 4);
      ctx.fillStyle = tm.hp / tm.maxHp > 0.5 ? "#7ee787" : tm.hp / tm.maxHp > 0.25 ? "#ffd166" : "#ff5c5c";
      ctx.fillRect(tx + 3, ty - 6, 24 * Math.max(0, tm.hp / tm.maxHp), 2);
      if (tm.buffed) {
        draw(ctx, "fx_buff", tx - 2, ty - 16, 1, { scale: 1, t: view.t });
      }
      // 施法光暈（放招瞬間的爆發感）v227：per-skill 元素色（非寫死 fx_spark）
      if (tm.casting) {
        draw(ctx, tm.castFx || "fx_spark", tx + 2, ty - 12, 1, { scale: 1.6, t: view.t, alpha: 0.9 });
      }
      // v289：狀態腳下光圈（與頭頂圖示雙重提示；rm 靜止恆亮）
      // v630：毒圈 — 細橢圓,與外圈 buff 光圈半徑錯開(rm 恆亮)
      if (!tm.dead && (tm.status || []).includes("poison")) {
        const pp = view.rm ? 0.28 : 0.2 + 0.12 * (0.5 + 0.5 * Math.sin(view.t * 3 + tm.seed));
        ctx.strokeStyle = "rgba(199,146,234," + pp.toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(tx, ty + 8, 6.5, 2.2, 0, 0, 6.2832);
        ctx.stroke();
      }
      const aura = tm.dead ? null : (tm.status || []).includes("shield") ? { c: "78, 190, 255" }
        : (tm.status || []).includes("taunt") ? { c: "255, 92, 138" }
        : tm.buffed ? { c: "255, 209, 102" } : null;
      if (aura) {
        const pulse = view.rm ? 0.28 : 0.2 + 0.12 * (0.5 + 0.5 * Math.sin(view.t * 3 + tm.seed));
        ctx.strokeStyle = "rgba(" + aura.c + "," + pulse.toFixed(3) + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(tx, ty + 8, 9, 3.4, 0, 0, 6.2832);
        ctx.stroke();
        ctx.strokeStyle = "rgba(" + aura.c + "," + (pulse * 0.55).toFixed(3) + ")";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(tx, ty + 8, 12, 4.6, 0, 0, 6.2832);
        ctx.stroke();
      }
      // 狀態圖示（護盾/嘲諷/技能就緒）
      for (const s of tm.status || []) {
        if (s === "shield") {
          draw(ctx, "fx_shield", tx - 6, ty - 25, 1, { scale: 1, t: view.t });
        } else if (s === "taunt") {
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "left";
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(8,10,22,0.9)";
          ctx.strokeText("嘲", tx + 14, ty - 18);
          ctx.fillStyle = "#ff5c8a";
          ctx.fillText("嘲", tx + 14, ty - 18);
        } else if (s === "ready") {
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "left";
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(8,10,22,0.9)";
          ctx.strokeText("技", tx + 14, ty - 18);
          ctx.fillStyle = "#ffd166";
          ctx.fillText("技", tx + 14, ty - 18);
        } else if (s === "poison") { // v630：毒標記圖示(頭頂正上方淨空帶)
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "left";
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(8,10,22,0.9)";
          ctx.strokeText("毒", tx + 8, ty - 30);
          ctx.fillStyle = "#c792ea";
          ctx.fillText("毒", tx + 8, ty - 30);
        }
      }
    }
    // projectiles — v590：4 層確定性殘影拖尾（由尾 k=4 到頭 k=1 畫出動量/方向感；
    // 位置複用 hunt.js:624-625 同一插值含拋物弧；殘影是 p.t 的確定性函數，rm 定幀契約不衝突）
    for (const p of view.projectiles || []) {
      for (let k = 4; k >= 1; k--) {
        const uk = (p.t - k * 0.03) / p.dur;
        if (uk <= 0) continue; // 剛出手不出殘影於生成點
        const gx = p.x0 + (p.x1 - p.x0) * uk;
        const gy = p.y0 + (p.y1 - p.y0) * uk - Math.sin(uk * Math.PI) * 14; // 弧常數 14 與 hunt.js:625 耦合
        draw(ctx, p.sprite, gx, gy, 1, { scale: GS[k], t: view.t, alpha: GA[k] });
      }
      draw(ctx, p.sprite, p.x, p.y, 1, { scale: 1.5, t: view.t });
    }
    // particles (skipped under reduced motion)
    const rm = !!(MG.game.state && MG.game.state.settings && MG.game.state.settings.reducedMotion);
    if (!rm) {
      for (const p of view.particles || []) {
        if (p.kind === "shard") { // v628 擊殺體色碎片（矩形直接繪製,免 sprite;顏色來自該怪色票）
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
          ctx.restore();
          continue;
        }
        if (p.kind === "bolt") { // v647 雷鏈：白芯＋金黃邊雙描折線
          const pts = p.pts || [];
          if (pts.length < 2) continue;
          const a = Math.max(0, p.life / p.maxLife);
          ctx.save();
          ctx.globalAlpha = a;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.strokeStyle = p.color || "#ffe566";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.stroke();
          ctx.strokeStyle = p.color2 || "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "pillar") { // v651 聖光柱：外圈金黃＋白芯垂直柱
          const a = Math.max(0, p.life / p.maxLife);
          const h = p.h || 46;
          const w = p.w || 8;
          const px = Math.round(p.x), py = Math.round(p.y);
          ctx.save();
          ctx.globalAlpha = a * 0.85;
          ctx.fillStyle = p.color || "#ffe9a0";
          ctx.fillRect(px - Math.ceil(w / 2), py - h, w, h);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color2 || "#ffffff";
          ctx.fillRect(px - 1, py - h, 3, h);
          // 柱頂光冠
          ctx.fillStyle = p.color || "#ffe9a0";
          ctx.fillRect(px - Math.ceil(w / 2) - 1, py - h - 2, w + 2, 3);
          ctx.restore();
          continue;
        }
        if (p.kind === "arc") { // v655 斬擊弧：銀灰外弧＋白芯
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0, r = p.r || 24;
          const a0 = p.a0 != null ? p.a0 : -2.2, a1 = p.a1 != null ? p.a1 : 0.5;
          ctx.save();
          ctx.globalAlpha = a;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = p.color || "#a8c0e0";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, r, a0, a1, false);
          ctx.stroke();
          ctx.strokeStyle = p.color2 || "#ffffff";
          ctx.lineWidth = 1.75;
          ctx.beginPath();
          ctx.arc(cx, cy, r, a0, a1, false);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "cloud") { // v659 毒雲：紫霧橢圓環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0, rx = p.rx || 28, ry = p.ry || 12;
          ctx.save();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color || "#c792ea";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.85;
          ctx.strokeStyle = p.color2 || "#e0b0ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx - 3, ry - 2, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "streak") { // v659 箭矢曳光：金邊白芯線
          const a = Math.max(0, p.life / p.maxLife);
          ctx.save();
          ctx.globalAlpha = a;
          ctx.lineCap = "round";
          ctx.strokeStyle = p.color || "#ffe08a";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(p.x0, p.y0);
          ctx.lineTo(p.x1, p.y1);
          ctx.stroke();
          ctx.strokeStyle = p.color2 || "#ffffff";
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(p.x0, p.y0);
          ctx.lineTo(p.x1, p.y1);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "dagger") { // v659 匕首扇刃：短弧
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0, r = p.r || 14;
          ctx.save();
          ctx.globalAlpha = a;
          ctx.lineCap = "round";
          ctx.strokeStyle = p.color || "#d8e0f0";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, p.a0 || 0, p.a1 || 1, false);
          ctx.stroke();
          ctx.strokeStyle = p.color2 || "#ffffff";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, r, p.a0 || 0, p.a1 || 1, false);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "ring") { // v663 護盾光環：銀藍雙環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r || 16) * (0.85 + 0.15 * (1 - a));
          ctx.save();
          ctx.globalAlpha = a * 0.75;
          ctx.strokeStyle = p.color || "#7ec8ff";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r, r * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color2 || "#e8f4ff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r - 2, r * 0.45 - 1, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "healburst") { // v663 治療爆發：綠十字
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const s = 8;
          ctx.save();
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color || "#7ee787";
          ctx.fillRect(cx - 1, cy - s, 3, s * 2);
          ctx.fillRect(cx - s, cy - 1, s * 2, 3);
          ctx.fillStyle = p.color2 || "#ffffff";
          ctx.fillRect(cx, cy - s + 1, 1, s * 2 - 2);
          ctx.fillRect(cx - s + 1, cy, s * 2 - 2, 1);
          ctx.restore();
          continue;
        }
        if (p.kind === "fireburst") { // v663 火球爆環：橘紅擴張環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 26) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.85;
          ctx.strokeStyle = p.color || "#ff7a2a";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color2 || "#ffd166";
          ctx.lineWidth = 1.75;
          ctx.beginPath();
          ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "regenpulse") { // v667 再生脈衝：綠擴張橢圓環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 10) + ((p.r1 || 34) - (p.r0 || 10)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.7;
          ctx.strokeStyle = p.color || "#5af082";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r, r * 0.42, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color2 || "#e8ffe8";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r - 3, (r - 3) * 0.42, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "siphon") { // v667 吸血虹吸：紅雙描二次貝茲
          const a = Math.max(0, p.life / p.maxLife);
          const mx = (p.x0 + p.x1) / 2, my = Math.min(p.y0, p.y1) - 28;
          ctx.save();
          ctx.globalAlpha = a;
          ctx.lineCap = "round";
          ctx.strokeStyle = p.color || "#ff5c5c";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(p.x0, p.y0);
          ctx.quadraticCurveTo(mx, my, p.x1, p.y1);
          ctx.stroke();
          ctx.strokeStyle = p.color2 || "#ffd0d0";
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(p.x0, p.y0);
          ctx.quadraticCurveTo(mx, my, p.x1, p.y1);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "shockwave") { // v667 震怒衝擊波：紅地面橢圓擴張
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 18) + ((p.r1 || 72) - (p.r0 || 18)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.75;
          ctx.strokeStyle = p.color || "#ff5c5c";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r, r * 0.38, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color2 || "#ffb0b0";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r - 4, (r - 4) * 0.38, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "bossburst") { // v671 首領登場：粉紅雙環＋十字射線
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 42) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.85;
          ctx.strokeStyle = p.color || "#ff5c8a";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color2 || "#ffd0e0";
          ctx.lineWidth = 1.75;
          ctx.beginPath();
          ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
          ctx.stroke();
          // 4 射線
          ctx.lineWidth = 2;
          ctx.strokeStyle = p.color || "#ff5c8a";
          for (let i = 0; i < 4; i++) {
            const ang = (i / 4) * Math.PI * 2 + (1 - a) * 0.4;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(ang) * (r * 0.35), cy + Math.sin(ang) * (r * 0.35));
            ctx.lineTo(cx + Math.cos(ang) * (r + 6), cy + Math.sin(ang) * (r + 6));
            ctx.stroke();
          }
          ctx.restore();
          continue;
        }
        if (p.kind === "elitegate") { // v671 精英傳送門：紫菱形
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const s = (p.s0 || 6) + ((p.s1 || 22) - (p.s0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color || "#c792ea";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - s);
          ctx.lineTo(cx + s, cy);
          ctx.lineTo(cx, cy + s);
          ctx.lineTo(cx - s, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.strokeStyle = p.color2 || "#f0d8ff";
          ctx.lineWidth = 1.25;
          const s2 = s - 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - s2);
          ctx.lineTo(cx + s2, cy);
          ctx.lineTo(cx, cy + s2);
          ctx.lineTo(cx - s2, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "levelburst") { // v675 升級金環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 4) + ((p.r1 || 28) - (p.r0 || 4)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color2 || "#fff3c4";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r - 4), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "retreatveil") { // v675 滅團暗藍帷幕
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 20) + ((p.r1 || 120) - (p.r0 || 20)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.45;
          ctx.fillStyle = p.color || "#2a3558";
          ctx.beginPath();
          ctx.ellipse(cx, cy, r * 1.15, r * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = a * 0.35;
          ctx.strokeStyle = p.color2 || "#1a2038";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r * 1.15, r * 0.55, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "resumering") { // v675 再戰綠復甦環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 10) + ((p.r1 || 48) - (p.r0 || 10)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.85;
          ctx.strokeStyle = p.color || "#7ee787";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color2 || "#e8ffe8";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r - 5), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "homeportal") { // v679 回村青藍傳送門
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 44) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.8;
          ctx.strokeStyle = p.color || "#6ac8ff";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r * 1.05, r * 0.55, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color2 || "#d8f0ff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.max(2, r * 0.7), Math.max(1, r * 0.35), 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "regionflare") { // v679 區域解放金焰
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 12) + ((p.r1 || 56) - (p.r0 || 12)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          // 內菱
          const s = r * 0.45;
          ctx.strokeStyle = p.color2 || "#fff3c4";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - s);
          ctx.lineTo(cx + s, cy);
          ctx.lineTo(cx, cy + s);
          ctx.lineTo(cx - s, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "buffglow") { // v679 增益淡紫光環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 26) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.75;
          ctx.strokeStyle = p.color || "#9ad8ff";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.fillStyle = p.color2 || "#e0f4ff";
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.35), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          continue;
        }
        if (p.kind === "clearring") { // v683 討伐清場銀環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 14) + ((p.r1 || 58) - (p.r0 || 14)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.85;
          ctx.strokeStyle = p.color || "#c8d0e0";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color2 || "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r - 6), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "stageflare") { // v687 關卡重刷青綠焰
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 10) + ((p.r1 || 48) - (p.r0 || 10)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color || "#7ee787";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.7, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.7, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#c8f5c8";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.55), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "dotripple") { // v687 毒 tick 紫波紋
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 4) + ((p.r1 || 22) - (p.r0 || 4)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.8;
          ctx.strokeStyle = p.color || "#c792ea";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r, r * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.4;
          ctx.fillStyle = p.color2 || "#e0b8f5";
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.max(1, r * 0.35), Math.max(1, r * 0.15), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          continue;
        }
        if (p.kind === "advancering") { // v691 自動進關金環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 12) + ((p.r1 || 52) - (p.r0 || 12)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.72, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.72, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#fff3c4";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.5), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "shieldclang") { // v691 護盾受擊藍閃
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 28) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a;
          ctx.strokeStyle = p.color || "#9ad8ff";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.6;
          ctx.strokeStyle = p.color2 || "#e0f4ff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r - 5), 0.2, Math.PI * 1.4);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "enterripple") { // v691 登場漣漪
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 40) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.75;
          ctx.strokeStyle = p.color || "#8a9ab8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r, r * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.4;
          ctx.strokeStyle = p.color2 || "#c8d0e0";
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.max(1, r * 0.55), Math.max(1, r * 0.22), 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "critring") { // v695 暴擊金環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 34) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.7, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.7, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#fff3c4";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.45), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "mhitdust") { // v695 受擊揚塵
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 3) + ((p.r1 || 16) - (p.r0 || 3)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.85;
          ctx.fillStyle = p.color || "#c8a878";
          ctx.fillRect(Math.round(cx - r * 0.6), Math.round(cy - 1), Math.max(2, Math.round(r * 1.2)), 2);
          ctx.fillStyle = p.color2 || "#8a7050";
          ctx.fillRect(Math.round(cx - 2), Math.round(cy - r * 0.35), 2, Math.max(1, Math.round(r * 0.4)));
          ctx.fillRect(Math.round(cx + 1), Math.round(cy - r * 0.25), 2, Math.max(1, Math.round(r * 0.3)));
          ctx.fillRect(Math.round(cx - 4), Math.round(cy - r * 0.15), 1, Math.max(1, Math.round(r * 0.2)));
          ctx.restore();
          continue;
        }
        if (p.kind === "killring") { // v695 擊殺閃環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 10) + ((p.r1 || 44) - (p.r0 || 10)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.85;
          ctx.strokeStyle = p.color || "#e8f0ff";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#ffffff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.55), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "hitring") { // v699 普攻銀環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 5) + ((p.r1 || 22) - (p.r0 || 5)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.8;
          ctx.strokeStyle = p.color || "#c8d0e0";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.4;
          ctx.strokeStyle = p.color2 || "#e8f0ff";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.5), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "downburst") { // v699 倒下紅爆
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 30) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color || "#ff6b6b";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.7, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.7, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ff9a9a";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.45), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "farmflare") { // v699 練功點綠焰
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 10) + ((p.r1 || 46) - (p.r0 || 10)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color || "#7ee787";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.72, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.72, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#c8f5c8";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.5), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "champring") { // v703 首殺金環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 12) + ((p.r1 || 48) - (p.r0 || 12)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#fff3c4";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.55), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.7;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.85, cy); ctx.lineTo(cx + r * 0.85, cy);
          ctx.moveTo(cx, cy - r * 0.85); ctx.lineTo(cx, cy + r * 0.85);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "unlockgate") { // v703 解鎖青門
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 42) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color || "#6ac8ff";
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.65, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.65, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#c8e8ff";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.4), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "fallflare") { // v703 回退橙焰
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 10) + ((p.r1 || 44) - (p.r0 || 10)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color || "#ff9a4a";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.72, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.72, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffe0a8";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.48), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "lootflare") { // v707 掉落琥珀焰
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 36) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.92;
          ctx.strokeStyle = p.color || "#e8b060";
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const px = cx + Math.cos(ang) * r, py = cy + Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffe8c0";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.42), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "elitering") { // v707 精英擊殺紫環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 10) + ((p.r1 || 42) - (p.r0 || 10)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#c792ea";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#e8d0ff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.55), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.65;
          ctx.strokeStyle = p.color || "#c792ea";
          ctx.lineWidth = 1.6;
          const d = r * 0.7;
          ctx.beginPath();
          ctx.moveTo(cx - d, cy - d); ctx.lineTo(cx + d, cy + d);
          ctx.moveTo(cx + d, cy - d); ctx.lineTo(cx - d, cy + d);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "potburst") { // v707 藥水薄荷爆
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 34) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color || "#6ed6b0";
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.75;
          ctx.strokeStyle = p.color2 || "#c8f5e8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.85, cy); ctx.lineTo(cx + r * 0.85, cy);
          ctx.moveTo(cx, cy - r * 0.85); ctx.lineTo(cx, cy + r * 0.85);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "gemflare") { // v711 寶石掉落青菱
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 34) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.92;
          ctx.strokeStyle = p.color || "#6ac8ff";
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.7, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.7, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#c8e8ff";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.4), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "potdrop") { // v711 藥水掉落玫焰
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 32) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color || "#ff7aaa";
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.72, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.72, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffd0e0";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.45), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "bookflare") { // v711 技能書靛環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 36) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#9a7cff";
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#e0d0ff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.55), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.7;
          ctx.strokeStyle = p.color || "#9a7cff";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.55, cy - r * 0.35); ctx.lineTo(cx + r * 0.55, cy - r * 0.35);
          ctx.moveTo(cx - r * 0.55, cy); ctx.lineTo(cx + r * 0.55, cy);
          ctx.moveTo(cx - r * 0.55, cy + r * 0.35); ctx.lineTo(cx + r * 0.55, cy + r * 0.35);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "matflare") { // v715 素材翠晶六角
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 32) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.92;
          ctx.strokeStyle = p.color || "#5ecf8a";
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const ang = (Math.PI / 3) * i - Math.PI / 6;
            const px = cx + Math.cos(ang) * r, py = cy + Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#c8f0d8";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.4), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "ticketflare") { // v715 招募券金票
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 34) - (p.r0 || 8)) * (1 - a);
          const hw = r * 0.95, hh = r * 0.55;
          ctx.save();
          ctx.globalAlpha = a * 0.92;
          ctx.strokeStyle = p.color || "#ffc14a";
          ctx.lineWidth = 2.6;
          ctx.strokeRect(cx - hw, cy - hh, hw * 2, hh * 2);
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#ffe8b0";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(cx - hw * 0.7, cy - hh * 0.35); ctx.lineTo(cx + hw * 0.7, cy - hh * 0.35);
          ctx.moveTo(cx - hw * 0.7, cy + hh * 0.35); ctx.lineTo(cx + hw * 0.7, cy + hh * 0.35);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "honorflare") { // v715 榮譽琥珀環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 38) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#e8a040";
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#ffe0a0";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.55), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.75;
          ctx.strokeStyle = p.color || "#e8a040";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.7); ctx.lineTo(cx, cy + r * 0.7);
          ctx.moveTo(cx - r * 0.7, cy); ctx.lineTo(cx + r * 0.7, cy);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "castring") { // v719 施法青環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 28) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.92;
          ctx.strokeStyle = p.color || "#6ad4ff";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#c8f0ff";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.5), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "aoering") { // v719 AOE 紅環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 5) + ((p.r1 || 30) - (p.r0 || 5)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.9;
          ctx.strokeStyle = p.color || "#ff5c5c";
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#ffb0b0";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.max(1, r * 0.55), Math.max(1, r * 0.3), 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "tauntmark") { // v719 嘲諷紅標
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 26) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ff7a4a";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy - r * 0.2, r * 0.7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = p.color || "#ff7a4a";
          ctx.globalAlpha = a * 0.85;
          ctx.fillRect(Math.round(cx - 1), Math.round(cy - r * 0.55), 2, Math.round(r * 0.7));
          ctx.fillRect(Math.round(cx - 1), Math.round(cy + r * 0.25), 2, 2);
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffd0a0";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(cx, cy - r * 0.2, Math.max(1, r * 0.4), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "multimark") { // v723 連擊橘疊 V
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 28) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ff9a3a";
          ctx.lineWidth = 2.4;
          ctx.lineJoin = "round";
          for (let i = 0; i < 3; i++) {
            const oy = cy - r * 0.55 + i * (r * 0.38);
            const w = r * (0.55 + i * 0.08);
            ctx.beginPath();
            ctx.moveTo(cx - w, oy);
            ctx.lineTo(cx, oy + r * 0.28);
            ctx.lineTo(cx + w, oy);
            ctx.stroke();
          }
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#ffe0a0";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.35, cy + r * 0.45);
          ctx.lineTo(cx, cy + r * 0.7);
          ctx.lineTo(cx + r * 0.35, cy + r * 0.45);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "healring") { // v723 治療綠雙環
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 30) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.92;
          ctx.strokeStyle = p.color || "#57c96b";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#c8f5c8";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.55), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = a * 0.7;
          ctx.fillStyle = p.color || "#57c96b";
          ctx.fillRect(Math.round(cx - 1), Math.round(cy - r * 0.35), 2, Math.round(r * 0.7));
          ctx.fillRect(Math.round(cx - r * 0.25), Math.round(cy - 1), Math.round(r * 0.5), 2);
          ctx.restore();
          continue;
        }
        if (p.kind === "poisonmark") { // v723 淬毒紫六角
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 26) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.92;
          ctx.strokeStyle = p.color || "#c792ea";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const ang = (Math.PI / 3) * i - Math.PI / 6;
            const px = cx + Math.cos(ang) * r;
            const py = cy + Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#e8c8ff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const ang = (Math.PI / 3) * i - Math.PI / 6;
            const px = cx + Math.cos(ang) * r * 0.45;
            const py = cy + Math.sin(ang) * r * 0.45;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "buffmark") { // v727 增益金盾標
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 26) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.7, cy - r * 0.35);
          ctx.lineTo(cx + r * 0.55, cy + r * 0.55);
          ctx.lineTo(cx, cy + r * 0.85);
          ctx.lineTo(cx - r * 0.55, cy + r * 0.55);
          ctx.lineTo(cx - r * 0.7, cy - r * 0.35);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#fff3c4";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.35), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "freezemark") { // v727 冰系青晶標
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.92;
          ctx.strokeStyle = p.color || "#7ec8ff";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.55, cy);
          ctx.lineTo(cx, cy + r);
          ctx.lineTo(cx - r * 0.55, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.7, cy - r * 0.2);
          ctx.lineTo(cx + r * 0.7, cy - r * 0.2);
          ctx.moveTo(cx - r * 0.45, cy + r * 0.35);
          ctx.lineTo(cx + r * 0.45, cy + r * 0.35);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#e0f4ff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.45);
          ctx.lineTo(cx + r * 0.28, cy);
          ctx.lineTo(cx, cy + r * 0.45);
          ctx.lineTo(cx - r * 0.28, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "firemark") { // v727 火球橙三角
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ff7a2a";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.85, cy + r * 0.65);
          ctx.lineTo(cx - r * 0.85, cy + r * 0.65);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#ffd166";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.45);
          ctx.lineTo(cx + r * 0.4, cy + r * 0.3);
          ctx.lineTo(cx - r * 0.4, cy + r * 0.3);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "boltmark") { // v731 雷系黃折線
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffe066";
          ctx.lineWidth = 2.6;
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.15, cy - r);
          ctx.lineTo(cx + r * 0.35, cy - r * 0.15);
          ctx.lineTo(cx - r * 0.25, cy - r * 0.05);
          ctx.lineTo(cx + r * 0.45, cy + r);
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#ffffff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.05, cy - r * 0.7);
          ctx.lineTo(cx + r * 0.2, cy - r * 0.1);
          ctx.lineTo(cx - r * 0.1, cy);
          ctx.lineTo(cx + r * 0.25, cy + r * 0.65);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "holymark") { // v731 聖光白金菱
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#fff3c4";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.65, cy);
          ctx.lineTo(cx, cy + r);
          ctx.lineTo(cx - r * 0.65, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.7;
          ctx.strokeStyle = p.color2 || "#ffd166";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.55);
          ctx.lineTo(cx, cy + r * 0.55);
          ctx.moveTo(cx - r * 0.4, cy);
          ctx.lineTo(cx + r * 0.4, cy);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "slashmark") { // v731 斬擊銀灰弧
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 30) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#c8d0e0";
          ctx.lineWidth = 2.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.arc(cx, cy, r, -Math.PI * 0.75, Math.PI * 0.15);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffffff";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.7), -Math.PI * 0.7, Math.PI * 0.1);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "arrowmark") { // v734 箭矢金羽
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 2.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx - r, cy);
          ctx.lineTo(cx + r * 0.55, cy);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + r * 0.55, cy);
          ctx.lineTo(cx + r * 0.15, cy - r * 0.35);
          ctx.moveTo(cx + r * 0.55, cy);
          ctx.lineTo(cx + r * 0.15, cy + r * 0.35);
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#fff3c4";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(cx - r, cy);
          ctx.lineTo(cx - r * 0.45, cy - r * 0.35);
          ctx.moveTo(cx - r, cy);
          ctx.lineTo(cx - r * 0.45, cy + r * 0.35);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "daggermark") { // v734 匕首銀叉
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#c0c8d8";
          ctx.lineWidth = 2.3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.45, cy + r * 0.55);
          ctx.lineTo(cx - r * 0.15, cy - r * 0.7);
          ctx.moveTo(cx + r * 0.45, cy + r * 0.55);
          ctx.lineTo(cx + r * 0.15, cy - r * 0.7);
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#ffffff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.55, cy - r * 0.55);
          ctx.lineTo(cx - r * 0.05, cy - r * 0.85);
          ctx.moveTo(cx + r * 0.55, cy - r * 0.55);
          ctx.lineTo(cx + r * 0.05, cy - r * 0.85);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "shieldmark") { // v734 護盾藍盾
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 26) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#6ab8ff";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.7, cy - r * 0.3);
          ctx.lineTo(cx + r * 0.55, cy + r * 0.5);
          ctx.lineTo(cx, cy + r * 0.85);
          ctx.lineTo(cx - r * 0.55, cy + r * 0.5);
          ctx.lineTo(cx - r * 0.7, cy - r * 0.3);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#d0ecff";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.45);
          ctx.lineTo(cx, cy + r * 0.4);
          ctx.moveTo(cx - r * 0.3, cy);
          ctx.lineTo(cx + r * 0.3, cy);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "critskill") { // v738 必暴金星
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const ang = (Math.PI / 2) * i - Math.PI / 4;
            const px = cx + Math.cos(ang) * r;
            const py = cy + Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.85);
          ctx.lineTo(cx, cy + r * 0.85);
          ctx.moveTo(cx - r * 0.85, cy);
          ctx.lineTo(cx + r * 0.85, cy);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#fff3c4";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.35), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "leechmark") { // v738 吸血綠心
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 24) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#57c96b";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(cx, cy + r * 0.7);
          ctx.bezierCurveTo(cx + r, cy + r * 0.1, cx + r * 0.7, cy - r * 0.55, cx, cy - r * 0.15);
          ctx.bezierCurveTo(cx - r * 0.7, cy - r * 0.55, cx - r, cy + r * 0.1, cx, cy + r * 0.7);
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#c8f5c8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy + r * 0.35);
          ctx.lineTo(cx, cy - r * 0.05);
          ctx.moveTo(cx - r * 0.25, cy + r * 0.1);
          ctx.lineTo(cx + r * 0.25, cy + r * 0.1);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "chillmark") { // v738 凍結雪晶
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#a0e0ff";
          ctx.lineWidth = 2.3;
          ctx.lineCap = "round";
          for (let i = 0; i < 3; i++) {
            const ang = (Math.PI / 3) * i;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
            ctx.lineTo(cx - Math.cos(ang) * r, cy - Math.sin(ang) * r);
            ctx.stroke();
          }
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffffff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.3), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "toxmark") { // v742 毒滴
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 24) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#c792ea";
          ctx.lineWidth = 2.3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.quadraticCurveTo(cx + r * 0.85, cy - r * 0.15, cx, cy + r * 0.85);
          ctx.quadraticCurveTo(cx - r * 0.85, cy - r * 0.15, cx, cy - r);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#e8c8ff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy - r * 0.15, Math.max(1, r * 0.28), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "lvmark") { // v742 升級金徽
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.55, cy - r * 0.2);
          ctx.lineTo(cx + r * 0.35, cy + r * 0.75);
          ctx.lineTo(cx - r * 0.35, cy + r * 0.75);
          ctx.lineTo(cx - r * 0.55, cy - r * 0.2);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.55;
          ctx.strokeStyle = p.color2 || "#fff3c4";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.35);
          ctx.lineTo(cx, cy + r * 0.35);
          ctx.moveTo(cx - r * 0.3, cy);
          ctx.lineTo(cx + r * 0.3, cy);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "powermark") { // v742 重擊橙菱
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ff9f43";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.7, cy);
          ctx.lineTo(cx, cy + r);
          ctx.lineTo(cx - r * 0.7, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffe0b0";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.45);
          ctx.lineTo(cx, cy + r * 0.45);
          ctx.moveTo(cx - r * 0.35, cy);
          ctx.lineTo(cx + r * 0.35, cy);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "elitemark") { // v746 精英紫冠
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#c792ea";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.7, cy + r * 0.35);
          ctx.lineTo(cx - r * 0.55, cy - r * 0.15);
          ctx.lineTo(cx - r * 0.25, cy + r * 0.1);
          ctx.lineTo(cx, cy - r * 0.85);
          ctx.lineTo(cx + r * 0.25, cy + r * 0.1);
          ctx.lineTo(cx + r * 0.55, cy - r * 0.15);
          ctx.lineTo(cx + r * 0.7, cy + r * 0.35);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#e8c8ff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy + r * 0.05, Math.max(1, r * 0.28), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "bossmark") { // v746 首領緋角冠
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 30) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ff5c8a";
          ctx.lineWidth = 2.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.65, cy + r * 0.4);
          ctx.lineTo(cx - r * 0.75, cy - r * 0.7);
          ctx.moveTo(cx + r * 0.65, cy + r * 0.4);
          ctx.lineTo(cx + r * 0.75, cy - r * 0.7);
          ctx.moveTo(cx - r * 0.55, cy + r * 0.15);
          ctx.lineTo(cx + r * 0.55, cy + r * 0.15);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffb0c8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy + r * 0.05, Math.max(1, r * 0.32), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "rapidmark") { // v746 高連擊青速線
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 26) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#7ee0ff";
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          for (let i = 0; i < 3; i++) {
            const oy = (i - 1) * r * 0.35;
            ctx.beginPath();
            ctx.moveTo(cx - r, cy + oy);
            ctx.lineTo(cx + r * 0.85, cy + oy - r * 0.15);
            ctx.stroke();
          }
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#c8f0ff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx + r * 0.2, cy - r * 0.55);
          ctx.lineTo(cx + r, cy);
          ctx.lineTo(cx + r * 0.2, cy + r * 0.55);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "caremark") { // v750 治療綠十字
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 24) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#7ee787";
          ctx.lineWidth = 2.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx, cy + r);
          ctx.moveTo(cx - r * 0.7, cy);
          ctx.lineTo(cx + r * 0.7, cy);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#c8f5c8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.35), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "burnmark") { // v750 灼燒火尖
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ff7a3a";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.quadraticCurveTo(cx + r * 0.7, cy - r * 0.1, cx + r * 0.25, cy + r * 0.75);
          ctx.lineTo(cx, cy + r * 0.35);
          ctx.lineTo(cx - r * 0.25, cy + r * 0.75);
          ctx.quadraticCurveTo(cx - r * 0.7, cy - r * 0.1, cx, cy - r);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffd0a0";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.35);
          ctx.lineTo(cx, cy + r * 0.2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "venommark") { // v750 毒擊尖牙
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 22) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#c792ea";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.55, cy - r * 0.6);
          ctx.lineTo(cx - r * 0.15, cy + r * 0.75);
          ctx.lineTo(cx, cy + r * 0.2);
          ctx.lineTo(cx + r * 0.15, cy + r * 0.75);
          ctx.lineTo(cx + r * 0.55, cy - r * 0.6);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#e8c8ff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.25, cy - r * 0.2);
          ctx.lineTo(cx + r * 0.25, cy - r * 0.2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "fallmark") { // v754 倒下紅✕
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 24) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ff5c5c";
          ctx.lineWidth = 2.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.7, cy - r * 0.7);
          ctx.lineTo(cx + r * 0.7, cy + r * 0.7);
          ctx.moveTo(cx + r * 0.7, cy - r * 0.7);
          ctx.lineTo(cx - r * 0.7, cy + r * 0.7);
          ctx.stroke();
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#ffb0b0";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.35), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "toxcast") { // v754 毒 DoT 施放滴尖
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 26) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#a06ad8";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.quadraticCurveTo(cx + r * 0.65, cy - r * 0.15, cx + r * 0.2, cy + r * 0.7);
          ctx.lineTo(cx, cy + r * 0.25);
          ctx.lineTo(cx - r * 0.2, cy + r * 0.7);
          ctx.quadraticCurveTo(cx - r * 0.65, cy - r * 0.15, cx, cy - r);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#d8b8f0";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy - r * 0.15, Math.max(1, r * 0.22), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "wrathmark") { // v754 震怒紅爪
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 24) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ff6b4a";
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(cx + i * r * 0.35, cy - r * 0.55);
            ctx.lineTo(cx + i * r * 0.55, cy + r * 0.75);
            ctx.stroke();
          }
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffc8b0";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.5, cy + r * 0.15);
          ctx.lineTo(cx + r * 0.5, cy + r * 0.15);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "resumemark") { // v758 再戰綠▶
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 26) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#7ee787";
          ctx.lineWidth = 2.4;
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.45, cy - r * 0.7);
          ctx.lineTo(cx + r * 0.75, cy);
          ctx.lineTo(cx - r * 0.45, cy + r * 0.7);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#c8f5c8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.35), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "homemark") { // v758 回村小屋尖
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#7ec8e8";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.75, cy - r * 0.25);
          ctx.lineTo(cx + r * 0.55, cy + r * 0.7);
          ctx.lineTo(cx - r * 0.55, cy + r * 0.7);
          ctx.lineTo(cx - r * 0.75, cy - r * 0.25);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#c8e8f8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.15, cy + r * 0.15);
          ctx.lineTo(cx - r * 0.15, cy + r * 0.7);
          ctx.lineTo(cx + r * 0.15, cy + r * 0.7);
          ctx.lineTo(cx + r * 0.15, cy + r * 0.15);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "liberatemark") { // v758 區域解放門拱
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 8) + ((p.r1 || 30) - (p.r0 || 8)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.7, cy + r * 0.65);
          ctx.lineTo(cx - r * 0.7, cy - r * 0.1);
          ctx.quadraticCurveTo(cx, cy - r, cx + r * 0.7, cy - r * 0.1);
          ctx.lineTo(cx + r * 0.7, cy + r * 0.65);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffe8a8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.35);
          ctx.lineTo(cx, cy + r * 0.35);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "clearmark") { // v762 清場銀✓
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 26) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#c8d0e0";
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.55, cy);
          ctx.lineTo(cx - r * 0.1, cy + r * 0.55);
          ctx.lineTo(cx + r * 0.7, cy - r * 0.55);
          ctx.stroke();
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#e8eef8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.4), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "restagemark") { // v762 重刷青綠刷新弧
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#57c96b";
          ctx.lineWidth = 2.3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.7, -Math.PI * 0.7, Math.PI * 0.35);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + r * 0.55, cy - r * 0.35);
          ctx.lineTo(cx + r * 0.85, cy - r * 0.15);
          ctx.lineTo(cx + r * 0.5, cy + r * 0.05);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#a8e8b8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.35, Math.PI * 0.3, Math.PI * 1.35);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "advancemark") { // v762 進關金雙▶
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 2.3;
          ctx.lineJoin = "round";
          for (const ox of [-r * 0.35, r * 0.15]) {
            ctx.beginPath();
            ctx.moveTo(cx + ox - r * 0.2, cy - r * 0.55);
            ctx.lineTo(cx + ox + r * 0.45, cy);
            ctx.lineTo(cx + ox - r * 0.2, cy + r * 0.55);
            ctx.stroke();
          }
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#ffe8a8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, r * 0.32), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "unlockmark") { // v766 首清解鎖金鑰
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 28) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 2.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.arc(cx - r * 0.15, cy - r * 0.35, Math.max(1, r * 0.35), 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.15, cy);
          ctx.lineTo(cx - r * 0.15, cy + r * 0.75);
          ctx.lineTo(cx + r * 0.25, cy + r * 0.75);
          ctx.moveTo(cx - r * 0.15, cy + r * 0.4);
          ctx.lineTo(cx + r * 0.15, cy + r * 0.4);
          ctx.stroke();
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#ffe8a8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx - r * 0.15, cy - r * 0.35, Math.max(1, r * 0.18), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "retreatmark") { // v766 滅團破盾
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 26) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#7a9ad8";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.55, cy - r * 0.45);
          ctx.lineTo(cx + r * 0.55, cy - r * 0.45);
          ctx.lineTo(cx + r * 0.45, cy + r * 0.15);
          ctx.lineTo(cx, cy + r * 0.75);
          ctx.lineTo(cx - r * 0.45, cy + r * 0.15);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.7;
          ctx.strokeStyle = p.color2 || "#b0c8f0";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.4, cy - r * 0.2);
          ctx.lineTo(cx + r * 0.4, cy + r * 0.35);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "farmmark") { // v766 練功點綠芽
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 26) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#57c96b";
          ctx.lineWidth = 2.3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx, cy + r * 0.7);
          ctx.lineTo(cx, cy - r * 0.15);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx, cy + r * 0.1);
          ctx.quadraticCurveTo(cx - r * 0.7, cy - r * 0.35, cx - r * 0.15, cy - r * 0.7);
          ctx.moveTo(cx, cy + r * 0.05);
          ctx.quadraticCurveTo(cx + r * 0.7, cy - r * 0.25, cx + r * 0.2, cy - r * 0.65);
          ctx.stroke();
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#a8e8b8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.35, cy + r * 0.7);
          ctx.lineTo(cx + r * 0.35, cy + r * 0.7);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "killmark") { // v770 擊殺銀骷
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 24) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#c8d0e0";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.arc(cx, cy - r * 0.15, Math.max(1, r * 0.45), 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.25, cy - r * 0.25);
          ctx.lineTo(cx - r * 0.1, cy - r * 0.05);
          ctx.moveTo(cx + r * 0.25, cy - r * 0.25);
          ctx.lineTo(cx + r * 0.1, cy - r * 0.05);
          ctx.moveTo(cx - r * 0.2, cy + r * 0.1);
          ctx.lineTo(cx + r * 0.2, cy + r * 0.1);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#e8eef8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.15, cy + r * 0.35);
          ctx.lineTo(cx, cy + r * 0.7);
          ctx.lineTo(cx + r * 0.15, cy + r * 0.35);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "lootmark") { // v770 掉裝琥珀袋
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 26) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ff9a4d";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.55, cy - r * 0.1);
          ctx.lineTo(cx - r * 0.45, cy + r * 0.65);
          ctx.lineTo(cx + r * 0.45, cy + r * 0.65);
          ctx.lineTo(cx + r * 0.55, cy - r * 0.1);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.35, cy - r * 0.35);
          ctx.quadraticCurveTo(cx, cy - r * 0.7, cx + r * 0.35, cy - r * 0.35);
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#ffd166";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.05);
          ctx.lineTo(cx, cy + r * 0.35);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "backmark") { // v770 關卡回退橙▼
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 26) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ff9a4d";
          ctx.lineWidth = 2.4;
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.65, cy - r * 0.35);
          ctx.lineTo(cx + r * 0.65, cy - r * 0.35);
          ctx.lineTo(cx, cy + r * 0.7);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#ffd0a0";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.15);
          ctx.lineTo(cx, cy + r * 0.35);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "critmark") { // v774 暴擊金星
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 24) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 2.2;
          ctx.lineJoin = "round";
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const ang = -Math.PI / 2 + i * Math.PI * 2 / 5;
            const ang2 = ang + Math.PI / 5;
            const x1 = cx + Math.cos(ang) * r * 0.75;
            const y1 = cy + Math.sin(ang) * r * 0.75;
            const x2 = cx + Math.cos(ang2) * r * 0.32;
            const y2 = cy + Math.sin(ang2) * r * 0.32;
            if (i === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#fff0b0";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.2);
          ctx.lineTo(cx, cy + r * 0.2);
          ctx.moveTo(cx - r * 0.2, cy);
          ctx.lineTo(cx + r * 0.2, cy);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "matmark") { // v774 素材翠晶標
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 6) + ((p.r1 || 24) - (p.r0 || 6)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#57c96b";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r * 0.7);
          ctx.lineTo(cx + r * 0.55, cy);
          ctx.lineTo(cx, cy + r * 0.7);
          ctx.lineTo(cx - r * 0.55, cy);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = a * 0.5;
          ctx.strokeStyle = p.color2 || "#a8e8b8";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.25, cy);
          ctx.lineTo(cx + r * 0.25, cy);
          ctx.moveTo(cx, cy - r * 0.3);
          ctx.lineTo(cx, cy + r * 0.3);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        if (p.kind === "ticketmark") { // v774 招募券金票標
          const a = Math.max(0, p.life / p.maxLife);
          const cx = p.cx || 0, cy = p.cy || 0;
          const r = (p.r0 || 7) + ((p.r1 || 26) - (p.r0 || 7)) * (1 - a);
          ctx.save();
          ctx.globalAlpha = a * 0.95;
          ctx.strokeStyle = p.color || "#ffd166";
          ctx.lineWidth = 2.3;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.55, cy - r * 0.4);
          ctx.lineTo(cx + r * 0.55, cy - r * 0.4);
          ctx.lineTo(cx + r * 0.55, cy + r * 0.4);
          ctx.lineTo(cx - r * 0.55, cy + r * 0.4);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.3, cy - r * 0.1);
          ctx.lineTo(cx + r * 0.3, cy - r * 0.1);
          ctx.moveTo(cx - r * 0.2, cy + r * 0.15);
          ctx.lineTo(cx + r * 0.2, cy + r * 0.15);
          ctx.stroke();
          ctx.globalAlpha = a * 0.45;
          ctx.strokeStyle = p.color2 || "#fff3b0";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(cx + r * 0.25, cy - r * 0.15, Math.max(1, r * 0.12), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        draw(ctx, p.sprite, p.x, p.y, 1, { scale: p.scale, t: p.t || view.t, alpha: p.kind === "loot" ? Math.min(1, Math.max(0, (p.total - p.phase) / (p.total * 0.3))) : Math.max(0, p.life / p.maxLife) });
      }
    }
    // floating numbers: 14px (17px big), 2px dark outline, high contrast
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    if (!rm) {
      for (const f of view.floats || []) {
        const a = Math.max(0, f.life / f.maxLife);
        ctx.globalAlpha = a;
        // vN 合併脈衝：pop∈[0,1] → 字號 ×(1→1.25) 線性回落（合併瞬間放大回饋）
        const px = f.pop > 0 ? 1 + 0.25 * f.pop : 1;
        ctx.font = "bold " + Math.round((f.big ? 17 : 14) * px) + "px monospace";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(8,10,22,0.92)";
        // 合併浮字以 val 重組顯示（prefix+fmt(val)——合併時 render 自動反映累加值）
        const str = (typeof f.val === "number") ? (f.prefix || "") + MG.util.fmt(f.val) : f.text;
        ctx.strokeText(str, f.x, f.y);
        ctx.fillStyle = f.color || "#ffffff";
        ctx.fillText(str, f.x, f.y);
      }
    }
    ctx.globalAlpha = 1;
    // banner — v566：橫幅移至邏輯 y100-134（原 y54-88 被 DOM 標題列覆蓋區佔走 —
    // v186 收益列/v201 戰力列落地後，轉場橫幅整段疊印在「⚔收益/隊伍戰力」行背後：
    // 手機 101-127px 與 DOM 行 101-131px 全疊、桌機 123-155px 被 DOM 82-159px 整段遮住 —
    // 每關轉場/首領登場/新區域解放的進度宣告全部不可讀；100-134 為 DOM 覆蓋區(邏輯 ≤93)
    // 與戰鬥場景(怪物血條 ≥156)之間的空曠天際帶，雙視口零疊印
    if (view.banner) {
      const bw = 260, bh = 34, by = 100;
      ctx.fillStyle = "rgba(8,10,22,0.88)";
      ctx.fillRect(W / 2 - bw / 2, by, bw, bh);
      ctx.strokeStyle = view.banner.boss ? "#ff5c8a" : "#ffd166";
      ctx.lineWidth = 2;
      ctx.strokeRect(W / 2 - bw / 2, by, bw, bh);
      // stronger accent strip under the band
      ctx.fillStyle = view.banner.boss ? "rgba(255,92,138,0.6)" : "rgba(255,209,102,0.6)";
      ctx.fillRect(W / 2 - bw / 2 + 6, by + bh - 4, bw - 12, 2);
      ctx.font = "bold 17px monospace";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(8,10,22,0.9)";
      ctx.strokeText(view.banner.text, W / 2, by + 22);
      ctx.fillStyle = view.banner.boss ? "#ff9a9a" : "#ffd166";
      ctx.fillText(view.banner.text, W / 2, by + 22);
    }
    ctx.restore();
    // vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.1);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    function hill(ctx, x, y, w, h) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2, y + h);
      ctx.quadraticCurveTo(x, y - h, x + w / 2, y + h);
      ctx.closePath();
      ctx.fill();
    }
  }
  /* ---------- town scene ---------- */
  function drawTown(ctx, view) {
    const W = 480, H = view.h || 200;
    // v271 A1-3：世界地圖平移參數（村莊畫框在世界座標的偏移 — 預設 0 行為與 v267 逐像素一致）
    const OX = view.ox || 0, OY = view.oy || 0;
    ctx.save();
    ctx.translate(OX, OY);
    // v649／v665 時段色票：day=糖果白天・dusk=暖紫橙黃昏・night=v584 夜空
    const period = view.period === "dusk" ? "dusk" : (view.period === "day" ? "day" : "night");
    const season = (view.season === "spring" || view.season === "autumn" || view.season === "winter") ? view.season : "summer";
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (period === "day") {
      g.addColorStop(0, "#58b7f0"); g.addColorStop(0.45, "#7ec8f5"); g.addColorStop(0.72, "#a8d8f8"); g.addColorStop(1, "#c8e8ff");
    } else if (period === "dusk") {
      g.addColorStop(0, "#3a2850"); g.addColorStop(0.45, "#5c3a58"); g.addColorStop(0.72, "#8a5540"); g.addColorStop(1, "#4a3038");
    } else {
      // v584 夜空對比：四段漸層 — 頂部略暗襯星、中天維持既有、地平線上方加亮（月夜夜光反照）、貼地收暗與地面銜接。
      g.addColorStop(0, "#1d2036"); g.addColorStop(0.45, "#232642"); g.addColorStop(0.72, "#2b3050"); g.addColorStop(1, "#1a1c2e");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (period === "day") {
      // v665 白天：太陽＋白雲絮（無星無月）
      ctx.fillStyle = "#ffd166";
      ctx.beginPath(); ctx.arc(W - 50, 36, 16, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff3c4";
      ctx.beginPath(); ctx.arc(W - 54, 32, 6, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (let i = 0; i < 5; i++) {
        const cx = 40 + i * 85 + (i % 2) * 12, cy = 18 + (i % 3) * 8;
        ctx.fillRect(cx, cy, 18, 4);
        ctx.fillRect(cx + 4, cy - 3, 10, 3);
      }
    } else {
      // stars
      ctx.fillStyle = period === "dusk" ? "rgba(255,230,200,0.28)" : "rgba(255,255,255,0.5)";
      for (let i = 0; i < 24; i++) {
        const sx = (i * 67 + 13) % W, sy = (i * 41 + 7) % (H * 0.6);
        ctx.fillRect(sx, sy, 2, 2);
      }
      // moon
      ctx.fillStyle = period === "dusk" ? "rgba(255,210,150,0.95)" : "rgba(255,240,200,0.9)";
      ctx.beginPath(); ctx.arc(W - 46, 34, 14, 0, 7); ctx.fill();
      ctx.fillStyle = period === "dusk" ? "#4a3048" : "#21243c"; // v584 同步新月遮罩色至新天空（月亮 y≈18-42 落 stop 0-0.45 段取樣）
      ctx.beginPath(); ctx.arc(W - 40, 30, 12, 0, 7); ctx.fill();
    }
    // ground
    ctx.fillStyle = period === "day" ? "#6fe07a" : (period === "dusk" ? "#2a2230" : "#1c1e31");
    ctx.fillRect(0, H - 34, W, 34);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, H - 34, W, 1);
    // v267 A4 過渡帶：地面頂緣 2 級色階（整列 fillRect — 避免逐列 960 次；每 4px 1 點交錯 dither 保留顆粒語彙）
    ctx.fillStyle = period === "day" ? "#66d473" : (period === "dusk" ? "#322838" : "#212538");
    ctx.fillRect(0, H - 33, W, 1);
    ctx.fillStyle = period === "day" ? "#5cc868" : (period === "dusk" ? "#3a3040" : "#232a3d");
    ctx.fillRect(0, H - 32, W, 1);
    for (let i = 0; i < 120; i++) {
      const sx = i * 4 + (hsh(i, 21) % 4);
      if (period === "day") ctx.fillStyle = (i % 2 === 0) ? "#5ab060" : "#66d473";
      else if (period === "dusk") ctx.fillStyle = (i % 2 === 0) ? "#2e2634" : "#322838";
      else ctx.fillStyle = (i % 2 === 0) ? "#1f2234" : "#212538";
      ctx.fillRect(sx, H - 33 + (i % 2), 1, 1);
    }
    const gndY = H - 34;
    // v237 A1R2 背景丘陵
    for (let i = 0; i < 5; i++) {
      const rnd = hsh(i, 7);
      const cx = 139 + i * 74 + ((rnd >> 4) % 9) - 4;
      const halfW = 8 + (rnd % 6);          // 8..13
      const ht = 18 + ((rnd >> 8) % 7);     // 18..24（頂 gndY-42 守住天際帶）
      for (let dy = -ht; dy <= 0; dy++) {
        const y = gndY - 18 + dy;
        const hw = Math.max(1, Math.round(halfW * Math.sqrt(1 - Math.pow(dy / ht, 2))));
        if (period === "day") {
          ctx.fillStyle = "#7fb0e8";
          if (dy < -ht * 0.28) ctx.fillStyle = "#8ab8ec";
          if (dy < -ht * 0.58) ctx.fillStyle = "#9cc4f0";
        } else {
          ctx.fillStyle = "#191b2c"; // v584 山腳（略暗，與加亮地平線天空拉開）
          if (dy < -ht * 0.28) ctx.fillStyle = "#242a44";  // 山腰
          if (dy < -ht * 0.58) ctx.fillStyle = "#333d5e";  // 山脊（關鍵明度跳 — 剪影浮現）
        }
        ctx.fillRect(cx - hw, y, hw * 2 + 1, 1);
        if (dy <= -ht + 2) ctx.fillStyle = period === "day" ? "#b0d4f8" : "#48587e";
        ctx.fillRect(cx - 1, y, 3, 1);
      }
      // 右緣月光描邊（月亮在右側）／白天右緣高光
      for (let dy = -ht; dy <= 0; dy++) {
        const y = gndY - 18 + dy;
        const hw = Math.max(1, Math.round(halfW * Math.sqrt(1 - Math.pow(dy / ht, 2))));
        ctx.fillStyle = period === "day" ? "#a8c8f0" : "#3d4a6e";
        ctx.fillRect(cx + hw, y, 1, 1);
      }
      // 山脊樹線
      const nRidge = 5 + (hsh(i, 11) % 5);
      ctx.fillStyle = period === "day" ? "#4a9060" : "#1d2136";
      for (let k = 0; k < nRidge; k++) {
        const dx = ((hsh(i * 7 + k, 13) % (halfW * 2)) - halfW);
        ctx.fillRect(cx + dx, gndY - 18 - ht + 2 + (k % 2), 1, 1);
      }
    }
    // v669 四季疊色（春花粉／秋落葉／冬雪點；夏＝既有色票不變）
    if (season === "spring") {
      if (period === "day") {
        ctx.fillStyle = "rgba(255,170,210,0.10)";
        ctx.fillRect(0, 0, W, Math.floor(H * 0.4));
      }
      for (let i = 0; i < 12; i++) {
        const fx = 24 + i * 38 + (hsh(i, 41) % 7);
        const fy = gndY + 4 + (hsh(i, 43) % 5);
        ctx.fillStyle = (i % 2 === 0) ? "#ff9ac8" : "#ffe08a";
        ctx.fillRect(fx, fy, 2, 2);
      }
    } else if (season === "autumn") {
      if (period === "day") {
        ctx.fillStyle = "rgba(255,130,50,0.14)";
        ctx.fillRect(0, gndY, W, 34);
      }
      ctx.fillStyle = period === "day" ? "#e07040" : "#a05030";
      for (let i = 0; i < 10; i++) {
        const lx = (i * 47 + 13) % W, ly = 16 + (hsh(i, 47) % 40);
        ctx.fillRect(lx, ly, 2, 1);
        ctx.fillRect(lx + 1, ly + 1, 1, 1);
      }
    } else if (season === "winter") {
      ctx.fillStyle = period === "day" ? "rgba(200,220,255,0.20)" : "rgba(170,190,220,0.12)";
      ctx.fillRect(0, gndY, W, 34);
      ctx.fillStyle = "#e8f0ff";
      for (let i = 0; i < 22; i++) {
        ctx.fillRect((i * 67 + 9) % W, (i * 37 + 5) % Math.floor(H * 0.55), 1, 1);
      }
    }
    ctx.fillStyle = "#232a3d";
    ctx.fillRect(0, gndY + 3, W, 16);
    ctx.fillStyle = "#1e2434";
    ctx.fillRect(0, gndY + 19, W, 15);
    // v267 A4 村莊帶 vs 外圍帶：核心區暖土 14px（「這裡是家」讀法 — 鎮區土壤比野外草地暖 1 級；
    // 暖光池落點從冷草變暖土；兩側 3px 以 hsh 逐列交替羽化 — 帶界無硬切線；seed 31）
    ctx.fillStyle = "#2a2b3e";
    ctx.fillRect(56, gndY + 3, 378, 14);
    for (let i = 0; i < 3; i++) {
      for (let dy = 0; dy < 14; dy++) {
        ctx.fillStyle = ((hsh(i * 17 + dy, 31) % 2) === 0) ? "#2a2b3e" : "#232a3d";
        ctx.fillRect(53 + i, gndY + 3 + dy, 1, 1);
        ctx.fillRect(431 + i, gndY + 3 + dy, 1, 1);
      }
    }
    for (let i = 0; i < 46; i++) {
      const sx = (i * 137 + 41) % W, sy = gndY + 5 + ((i * 53 + 17) % 24);
      ctx.fillStyle = (i % 3 === 0) ? "#2c3a4a" : "#27354a";
      ctx.fillRect(sx, sy, 1, 1);
      if (i % 2 === 0) ctx.fillRect(sx + 1, sy + 1, 1, 1);
    }
    // v267 A4 顆粒密度 16-bit 語彙：基底暗點兩層（原 46 點保留＋新增 46 點偶數加繪 2×）＋月光亮點 28 點（偏右對應月亮、限草地帶）
    for (let i = 0; i < 46; i++) {
      const sx = (i * 97 + 5) % W, sy = gndY + 5 + ((i * 71 + 11) % 24);
      ctx.fillStyle = (i % 2 === 0) ? "#2c3a4a" : "#27354a";
      ctx.fillRect(sx, sy, 1, 1);
      if (i % 2 === 0) ctx.fillRect(sx + 1, sy + 1, 1, 1);
    }
    for (let i = 0; i < 28; i++) {
      const sx = 240 + ((i * 59 + 7) % 220), sy = gndY + 5 + ((i * 41 + 13) % 13);
      ctx.fillStyle = "#3a4258";
      ctx.fillRect(sx, sy, 1, 1);
    }
    // 石板道路（建築下方可見條帶 — 第 2 排建築遮住 gndY+13..+21，v212FIX 移到 gndY+18..+26）
    ctx.fillStyle = "#2b2f45";
    ctx.fillRect(0, gndY + 18, W, 8);
    for (let i = 0; i < 24; i++) {
      const sx = i * 21 + ((i % 2) * 8);
      ctx.fillStyle = "#333a55";
      ctx.fillRect(sx, gndY + 18 + (i % 2), 14, 6);
      ctx.fillStyle = "#262b40";
      ctx.fillRect(sx, gndY + 24 + (i % 2), 14, 2);
    }
    // v237 A1R2 路緣界定：上緣月光高光 1px（石板從平塗條帶變鑲嵌路面）
    ctx.fillStyle = "#39415e";
    ctx.fillRect(0, gndY + 18, W, 1);
    // v267 A4 過渡帶：路頂緣草→土混色 1px（整列＋每 4px 1 點交錯 — 石板從草地長出；效能：480 次迴圈 → 2 fillRect＋120 點）＋路底濕泥破折（土→水岸補陸側）
    ctx.fillStyle = "#2b3046";
    ctx.fillRect(0, gndY + 17, W, 1);
    for (let i = 0; i < 120; i++) {
      const sx = i * 4 + (hsh(i + 300, 33) % 4);
      ctx.fillStyle = (i % 2 === 0) ? "#283044" : "#2b3046";
      ctx.fillRect(sx, gndY + 17, 1, 1);
    }
    for (let i = 0; i < 14; i++) {
      let sx = (i * 37 + 3) % W;
      if (sx >= 182 && sx <= 278) sx = 300 + ((i * 37 + 3) % 40); // v247 廣場排除
      ctx.fillStyle = "#26303f";
      ctx.fillRect(sx, gndY + 26 + (i % 2), 2, 1);
    }
    // v237 A1R2 路縫苔點（確定性 — 可見帶被路/溪流佔滿無草地，苔嵌路磚接縫維持「色階顆粒」語彙；
    // 原候選的 8 塊 3×2 草地斑塊落在路帶內會被路磚蓋掉 — 座標修正為接縫苔點；
    // v247：廣場 182..278 排除區
    for (let i = 0; i < 10; i++) {
      let sx = (i * 43 + 9) % W;
      if (sx >= 182 && sx <= 278) sx = 300 + ((i * 43 + 9) % 30); // v247 廣場區間移出至其右側接縫
      ctx.fillStyle = "#2f3d52";
      ctx.fillRect(sx, gndY + 19 + ((i * 7) % 6), 1, 2);
    }
    // v237 A1R2 月光溪流（style-guide「水岸」— 石板路下方水帶；全 codebase 首筆水域）
    // v252 A2：彎曲河流（絕非直線水渠）— 逐 x 列上下緣正弦擺幅 ±3px、寬 4..7px；岸線淺灘 3 級色階
    const streamTop = (x) => gndY + 27 + Math.round(Math.sin(x * 0.11 + 1.7) * 1.5 + Math.sin(x * 0.043 + 0.6) * 1.5);
    const streamBot = (x) => Math.min(gndY + 34, streamTop(x) + 4 + Math.round(Math.sin(x * 0.09 + 3.1) * 1.5)); // clamp：橋下不漏水
    ctx.fillStyle = "#22325a";
    for (let x = 0; x < W; x++) {
      const t = streamTop(x), b = streamBot(x);
      ctx.fillStyle = "#22325a"; // v252FIX：每列重置（偶數列淺灘破折殘留 #141c2e 會污染水體色）
      ctx.fillRect(x, t, 1, b - t);
      if (x % 2 === 0) { // 岸線淺灘破折（水→岸 3 級過渡：淺灘 #2a3d68 → 深水 #141c2e）
        ctx.fillStyle = "#2a3d68";
        ctx.fillRect(x, t - 1, 1, 1);
        ctx.fillStyle = "#141c2e";
        ctx.fillRect(x, b, 1, 1);
      }
    }
    for (let i = 0; i < 12; i++) { // 靜態水面高光破折（確定性 — 重繪不閃爍；v252：y 掛動態頂緣+1）
      let sx = (i * 29 + 11) % W;
      if (sx >= 182 && sx <= 278) sx = 300 + ((i * 29 + 11) % 40); // v247
      ctx.fillStyle = "#3a5a8a";
      ctx.fillRect(sx, streamTop(sx) + 1, 1, 1);
    }
    for (let i = 0; i < 6; i++) { // 深色水紋斑（v252：y 掛動態底緣-1）
      let sx = (i * 71 + 7) % W;
      if (sx >= 182 && sx <= 278) sx = 300 + ((i * 71 + 7) % 40); // v247
      ctx.fillStyle = "#182744";
      ctx.fillRect(sx, streamBot(sx) - 1, 1, 2);
    }
    // v247 A1 外圍地形帶（村莊縮小置中後的空出邊帶 — 地帶分層：農田自然帶/冒險帶）
    // v252 A2 農田側翼不規則化（禁止矩形整齊邊界 — 逐列階梯寬＋列間 1px 錯位 → 參差田緣；3 級色階）
    for (let side = 0; side < 2; side++) {
      const bx = side === 0 ? 24 : 424;
      for (let dy = 0; dy < 14; dy++) {
        const rw = 26 + ((dy * 37 + 11) % 9); // 26..34 參差
        const ox = ((dy * 13 + 7) % 3) - 1;   // 列間錯位
        ctx.fillStyle = "#20293c";
        ctx.fillRect(bx + ox - 1, gndY - 4 + dy, rw + 2, 1); // 外緣
        ctx.fillStyle = "#2a3246";
        ctx.fillRect(bx + ox, gndY - 3 + dy, rw, 1);          // 主面
        ctx.fillStyle = "#253044";
        ctx.fillRect(bx + ox + 2, gndY - 1 + dy, Math.max(2, rw - 4), 1); // 內面
      }
      for (let k = 0; k < 6; k++) { // 作物列破折
        ctx.fillStyle = "#3a4a5c";
        ctx.fillRect(bx + 4 + k * 4, gndY - 2 + (k % 3), 2, 1);
      }
    }
    // v267 A4 過渡帶：農田深耕土緣 1px（田→草地硬切羽化 — 外緣列外逐列）＋茬點顆粒（主面內 hsh 散點 — seed 23）
    for (let side = 0; side < 2; side++) {
      const bx = side === 0 ? 24 : 424;
      for (let dy = 0; dy < 14; dy++) {
        ctx.fillStyle = "#1b2335";
        ctx.fillRect(bx + ((dy * 13 + 7) % 3) - 2, gndY - 5 + dy, 1, 1);
      }
      for (let k = 0; k < 6; k++) {
        const sx = bx + 3 + ((hsh(k + side * 9, 23) % 30));
        ctx.fillStyle = "#33415a";
        ctx.fillRect(sx, gndY - 1 + (k % 3), 1, 1);
      }
    }
    // v267FIX：農田覆蓋行補羽化 — 暖土帶兩側羽化列(53..55/431..433)被農田後繪蓋成硬切 → 農田面上加 seed 31 交錯點(僅與暖土重疊行 gndY+3..+9)
    for (let dy = 3; dy < 10; dy++) {
      ctx.fillStyle = ((hsh(dy * 3 + 1, 31) % 2) === 0) ? "#2a2b3e" : "#232a3d";
      ctx.fillRect(53 + (dy % 3), gndY + dy, 1, 1);
      ctx.fillRect(431 + (dy % 3), gndY + dy, 1, 1);
    }
    // 果園雙排樹（農田上方 — 確定性）
    for (let k = 0; k < 3; k++) {
      draw(ctx, k % 2 ? "deco_tree2" : "deco_tree1", 20 + k * 14, gndY - 12, 1, { scale: 0.8 });
      draw(ctx, k % 2 ? "deco_tree1" : "deco_tree2", 432 + k * 14, gndY - 12, 1, { scale: 0.8 });
    }
    // v273 A5 風車（市場右緣 x440 — 避 CELLS[9]=[366,116] scale2.0 佔 x366..430 與鎖定遮罩；塔身暖棕/錐頂磚紅/米白扇葉 2 幀；純裝飾不接 hitBuilding；幀由 drawTownLife 轉動）
    draw(ctx, "deco_windmill", 440, gndY - 16, 1, { scale: 1, frame: 0 });
    // 蜿蜒道路：繞過廣場左緣（x150 — 200 畫布底部無空間，置中直下會被廣場蓋住）→ 畫布底緣
    {
      const px0 = 150;
      for (let y = gndY + 18; y < gndY + 34; y++) {
        const sway = Math.sin((y - gndY - 18) / 16 * 6.28 + 1.7) * 5;
        ctx.fillStyle = "#2e3348";
        ctx.fillRect(Math.round(px0 + sway) - 2, y, 5, 1);
        ctx.fillStyle = "#3a4158";
        ctx.fillRect(Math.round(px0 + sway) - 1, y, 3, 1);
      }
    }
    // 木橋（蜿蜒路過溪處 x150±8 — 避開廣場 182-278 才可見）
    ctx.fillStyle = "#4a3a28";
    ctx.fillRect(142, gndY + 27, 17, 2);
    ctx.fillStyle = "#5c4a34";
    ctx.fillRect(143, gndY + 28, 15, 3);
    ctx.fillStyle = "#4a3a28";
    ctx.fillRect(144, gndY + 31, 13, 2);
    // 溪流左端小潭（v252 A2 不規則湖岸 — 逐列階梯岸線＋淺灘延伸，取代直角矩形）
    for (let dy = 0; dy < 9; dy++) {
      const rw = 26 + ((dy * 37 + 11) % 9); // 24..34 參差
      ctx.fillStyle = "#22325a";
      ctx.fillRect(16 - Math.floor(rw / 2), gndY + 27 + dy, rw, 1);
      ctx.fillStyle = "#2a3d68"; // 上緣淺灘
      ctx.fillRect(16 - Math.floor(rw / 2), gndY + 27 + dy, rw, dy === 0 ? 1 : 0);
    }
    ctx.fillStyle = "#1f2c4e"; // 右下淺水延伸（不規則岸線尾巴）
    ctx.fillRect(2, gndY + 30, 10, 1);
    ctx.fillRect(0, gndY + 32, 6, 2);
    ctx.fillStyle = "#1b2746";
    ctx.fillRect(4, gndY + 33, 20, 2);
    // v267 A4 顆粒：潭岸泥斑（seed 29 — 疊於淺灘旁，岸線顆粒語彙）
    for (let k = 0; k < 4; k++) {
      const mx = 2 + (hsh(k, 29) % 18), my = gndY + 26 + (hsh(k + 3, 29) % 6);
      ctx.fillStyle = "#2f4068";
      ctx.fillRect(mx, my, 1, 1);
    }
    // 邊緣樹叢（v252 A2 叢生 — 錨點 4-5 棵簇狀：dx/dy/scale 全由 hsh 推導、林緣參差）
    for (let k = 0; k < 5; k++) {
      const r1 = hsh(k, 5);
      const r2 = hsh(k + 9, 5);
      draw(ctx, (r1 % 2) ? "deco_tree1" : "deco_tree2", 8 + (r1 % 31), gndY - 8 - (r2 % 10), 1, { scale: 0.6 + (r1 % 4) * 0.1 });
      draw(ctx, (r2 % 2) ? "deco_tree1" : "deco_tree2", 452 + (r1 % 29), gndY - 8 - (r2 % 10), 1, { scale: 0.6 + ((r1 >> 3) % 4) * 0.1 });
    }
    // v271 A1-3：A3 巢穴入口遷移至世界地圖（worldmap.js 以世界座標繪製 — 每區一座）
    // 城堡前棋盤廣場（v247 置中 — 原 x14-110 移至 x182-278 對齊新城堡 60+38）
    // v267 A4：廣場底板 1px 外擴（建成面從草地浮出 — seed 33 底色同暖土語彙）
    ctx.fillStyle = "#2d3349";
    ctx.fillRect(181, gndY + 18, 98, 15);
    for (let rx = 0; rx < 6; rx++) {
      for (let ry = 0; ry < 2; ry++) {
        ctx.fillStyle = ((rx + ry) % 2 === 0) ? "#333a55" : "#2b2f45";
        ctx.fillRect(182 + rx * 16, gndY + 19 + ry * 7, 15, 6);
      }
    }
    // v267 A4 顆粒：廣場磚面凹坑（seed 27 — 磚之上）＋外圍土徑圍環 1px（hsh 抖角 — 廣場從草地浮出）
    for (let k = 0; k < 8; k++) {
      const rx = 184 + (hsh(k, 27) % 88), ry = gndY + 20 + (hsh(k + 5, 27) % 11);
      ctx.fillStyle = "#39415e";
      ctx.fillRect(rx, ry, 1, 1);
    }
    ctx.fillStyle = "#2e3448";
    ctx.fillRect(181, gndY + 17, 98, 1);
    // v267FIX：下緣 gndY+33(原 gndY+34=H 越界整列不可見 — 底板底列 +32 之下 1px 畫布內)；左緣 i<5(最大 y=gndY+31 畫布內)
    for (let i = 0; i < 6; i++) {
      const ox = 182 + i * 16;
      ctx.fillStyle = "#2e3448";
      ctx.fillRect(ox + (hsh(i, 35) % 2), gndY + 33, 1, 1);
      ctx.fillRect(181, gndY + 19 + (i < 5 ? i * 3 : 13) + (hsh(i + 3, 35) % 2), 1, 1);
    }
    // 近地面建築接觸陰影（v212FIX：以地面帶為基準 — 第 1 排遠景跳過、第 2 排含鎖定 scale1.6 都畫）
    for (const b of view.buildings || []) {
      if (b.y + 32 * b.scale < H - 34) continue;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(b.x + 2, b.y + 30 * b.scale, 28 * b.scale, 4 * b.scale);
    }
    // v237 A1R2 火把暖光池（與 drawTownLife overlay 火把同條件 — 城堡/酒館建成才畫；冷夜色地形帶入暖色塊）
    // v625：錨點單一化 — 光池 x 與火焰 x 完全相同（與 js/ui/kingdom.js drawTownLife 火把段同 x，改一邊必改另一邊）；
    //       強度強化 alpha 0.10→0.24＋中段 stop 柔化衰減、半徑 18→22；底緣硬限 y≤gndY+26（不滲入溪流帶）
    {
      const torchX = [];
      for (const b of view.buildings || []) {
        if (b.id === "castle" && b.lvl > 0) torchX.push(54); // v625：火焰權威 x（kingdom.js 火把同 x）
        if (b.id === "guild" && b.lvl > 0) torchX.push(150); // v625：火焰權威 x（kingdom.js 火把同 x）
      }
      for (const tx of torchX) {
        const grd = ctx.createRadialGradient(tx, gndY + 22, 2, tx, gndY + 22, 22);
        grd.addColorStop(0, "rgba(255,150,70,0.24)");
        grd.addColorStop(0.55, "rgba(255,150,70,0.10)");
        grd.addColorStop(1, "rgba(255,150,70,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(tx - 22, gndY + 4, 44, 22);
      }
    }
    // 中景植栽（v252 A2 叢生：每縫隙 1-3 棵疏密有致 — hsh 推導數量/抖動/樹種/尺寸；x 硬限縫隙帶防蓋建築）
    const GAPS = [[135, 143], [209, 217], [283, 291], [357, 365]];
    for (let g = 0; g < GAPS.length; g++) {
      const n = 1 + (hsh(g, 3) % 3); // 1..3 棵
      for (let k = 0; k < n; k++) {
        const r1 = hsh(g * 5 + k, 3);
        const r2 = hsh(g * 5 + k + 31, 3);
        const tx = GAPS[g][0] + (r1 % 6); // 縫隙帶內抖動（v252FIX：0..5 窄化 — 原 %9 使右緣樹伸到鄰樓 x144 被裁切）
        const ty = gndY - 16 + (r2 % 9);
        draw(ctx, (r1 % 2) ? "deco_tree1" : "deco_tree2", tx, ty, 1, { scale: 0.7 + ((r1 >> 4) % 4) * 0.1 });
      }
    }
    const hedgeGap = GAPS[hsh(9, 3) % GAPS.length]; // v252：樹籬 2 段（hsh 選縫隙 — 不再每縫一條）
    const hedgeGap2 = GAPS[hsh(10, 3) % GAPS.length];
    draw(ctx, "deco_hedge", hedgeGap[0] + 2, gndY - 5, 1, { scale: 1 }); // v252FIX：第一段無條件繪（碰撞時不整段跳過 → 0 段）
    if (hedgeGap2[0] !== hedgeGap[0]) draw(ctx, "deco_hedge", hedgeGap2[0] + 2, gndY - 5, 1, { scale: 1 });
    // v273 A5 村莊裝飾小物（花圃/長椅/木桶/乾草堆/水井/石堆 — hsh 確定性撒點於縫隙/廣場兩端；
    // 避開 CELLS 矩形 ±6px 點擊區與 v252 樹籬縫隙 — seed 錯開 41/43/45/47/49/51）
    {
      const props = [
        // [x, y, kind] — x 以縫隙中點/廣場邊為基座 + hsh 抖動
        [97, gndY + 6, "barrel"], [171, gndY + 8, "hay"], [245, gndY + 7, "flowers"], [319, gndY + 6, "stone"],
        [181, gndY + 9, "well"], [278, gndY + 9, "bench"], [97, gndY + 10, "flowers"], [319, gndY + 10, "hay"]
      ];
      for (let i = 0; i < props.length; i++) {
        const [px, py, kind] = props[i];
        const dx = (hsh(i, 41) % 3) - 1, dy = (hsh(i + 7, 41) % 3) - 1;
        const x = px + dx, y = py + dy;
        if (kind === "barrel") { // 木桶（箍線）
          ctx.fillStyle = "#6a4a2a"; ctx.fillRect(x, y, 3, 4);
          ctx.fillStyle = "#3a2a18"; ctx.fillRect(x, y + 1, 3, 1); ctx.fillRect(x, y + 3, 3, 1);
        } else if (kind === "hay") { // 乾草堆（陰影邊）
          ctx.fillStyle = "#c8a060"; ctx.fillRect(x, y, 4, 2);
          ctx.fillStyle = "#a88448"; ctx.fillRect(x, y + 2, 3, 1); ctx.fillRect(x + 3, y, 1, 2);
        } else if (kind === "flowers") { // 花圃（花色點）
          ctx.fillStyle = "#2f4a3a"; ctx.fillRect(x, y, 4, 2);
          ctx.fillStyle = ["#ff7a9a", "#ffd166", "#7ec8e8"][(hsh(i, 43) % 3)]; ctx.fillRect(x + (hsh(i, 45) % 3), y, 1, 1);
          ctx.fillStyle = ["#ffd166", "#7ec8e8", "#ff7a9a"][(hsh(i + 3, 45) % 3)]; ctx.fillRect(x + 1 + (hsh(i + 5, 47) % 2), y + 1, 1, 1);
        } else if (kind === "stone") { // 石堆（三石）
          ctx.fillStyle = "#4a4a58"; ctx.fillRect(x, y, 2, 1); ctx.fillRect(x + 1, y + 1, 2, 1);
          ctx.fillStyle = "#5a5a68"; ctx.fillRect(x, y, 1, 1);
        } else if (kind === "well") { // 水井（石圈＋井口）
          ctx.fillStyle = "#5a5a66"; ctx.fillRect(x, y, 4, 1); ctx.fillRect(x, y + 1, 1, 2); ctx.fillRect(x + 3, y + 1, 1, 2);
          ctx.fillStyle = "#14121f"; ctx.fillRect(x + 1, y + 1, 2, 2);
        } else if (kind === "bench") { // 長椅（板＋影）
          ctx.fillStyle = "#5c4a34"; ctx.fillRect(x, y, 4, 1);
          ctx.fillStyle = "#3a2f24"; ctx.fillRect(x + 1, y + 1, 2, 1);
        }
      }
    }
    // buildings
    for (const b of view.buildings || []) {
      const far = !!b.far; // v242 A2R2：遠排（第 1 排）大氣透視 — 前後景深（far 旗標 — 兩畫布一致）
      draw(ctx, b.sprite, b.x, b.y, 1, { scale: b.scale });
      if (far) { // 遠排暗藍霧罩（確定性幾何 — 靜態底景重繪不變；tierFx 疊層在後仍全亮）
        ctx.fillStyle = "rgba(20,24,40,0.28)";
        ctx.fillRect(b.x, b.y, 32 * b.scale, 32 * b.scale);
      }
      if (b.locked) {
        ctx.fillStyle = "rgba(10,10,20,0.55)";
        ctx.fillRect(b.x - 2, b.y - 2, 32 * b.scale + 4, 32 * b.scale + 4);
        draw(ctx, "icon_lock", b.x + 16 * b.scale - 8, b.y + 8, 1, { scale: 1 });
      }
      // name label（v242：遠排降調 9px/0.5 — 原全亮標籤壓在近排屋頂上，景深最大破綻）
      ctx.font = (far ? "9px" : "10px") + " monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = b.locked ? "rgba(139,144,181,0.8)" : (far ? "rgba(232,234,246,0.5)" : "rgba(232,234,246,0.85)");
      ctx.fillText(b.name + (b.locked ? " Lv?" : " Lv" + b.lvl), b.x + 16 * b.scale, b.y + 32 * b.scale + 12);
    }
    ctx.restore(); // v271 A1-3：世界地圖平移收尾
  }
  /* v217 固定-fps 動畫驅動器（style-guide：角色動作以固定 fps 8-12 時基，不與 rAF 幀率綁定 —
     高速螢幕下動作不變快；t 為秒制）v217FIX：負 t / n=0 防護 */
  function animFrame(t, fps, n, ph) {
    // v232FIX：負 t 安全（Math.floor 負數取模仍負 → draw 索引 arr[-1] undefined 整格消失）
    const f = Math.floor(t * fps + (ph || 0));
    return ((f % (n || 1)) + (n || 1)) % (n || 1);
  }
  return { canvasOf, spriteURL, frameIdx, animFrame, draw, drawBlink, drawBattle, drawTown, hsh }; // v271：hsh 匯出（worldmap 共用）；v568：drawBlink 匯出（hunt.js 城內場景共用）
})();
