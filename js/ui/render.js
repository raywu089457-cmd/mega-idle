/* 放置王國 MEGA IDLE — canvas renderer: sprite cache, battle scene, town scene */
"use strict";
MG.ui = MG.ui || {};
MG.ui.render = (function () {
  const caches = {}; // name -> [canvas per frame]
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
    // dying monster: squash-stretch before the boom (drawn under the incoming monster)
    if (view.dying) {
      const d = view.dying;
      const dw = 16 * d.size, dh = 16 * d.size;
      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.translate(d.x, d.y + dh);
      ctx.scale(d.sx, d.sy);
      draw(ctx, d.sprite, -dw / 2, -dh, 1, { scale: d.size, t: view.t });
      ctx.restore();
    }
    // monster
    const m = view.monster;
    if (m) {
      const my = H * 0.72 + 8;
      const mw = 16 * m.scale, mh = 16 * m.scale;
      // v232 A8 敵人巡邏節奏：待機時左右微踱步（正弦 2px、per-sprite 種子）；受擊（flash）／凍結（frozen）／死亡靜止（被打停 — 索敵節奏）
      const mSeed = m.seed !== undefined ? m.seed : (m.sprite || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const bobX = (m.flash > 0 || m.dead || m.frozen) ? 0 : Math.sin(view.t * 1.7 + mSeed) * 2;
      // v288 行動前搖：攻擊前 0.22s 蓄力 — 快速抖動＋微下沉（可讀的攻擊預告；rm 靜止）
      const windup = !view.rm && m.windup !== undefined && m.windup > 0 && m.windup < 0.22 && !m.dead;
      const wdX = windup ? Math.sin(view.t * 46) * 2.2 : 0;
      const wdY = windup ? Math.abs(Math.sin(view.t * 46)) * 1.2 : 0;
      const mx = (m.x !== undefined ? m.x : W * 0.62) + bobX + wdX;
      draw(ctx, m.sprite, mx - mw / 2, my - mh + wdY, 1, { scale: m.scale, t: view.t, frame: m.frame, alpha: m.dead ? 0.3 : 1 });
      // v297：Boss 機制視覺化（可讀性 — 五機制各自辨識；rm 恆亮）
      if (m.mech && !m.dead) {
        const rm = view.rm;
        if (m.mech === "shield" && m.t < 8) {
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
    }
    // team
    for (const tm of view.team || []) {
      const tx = tm.x, ty = tm.y;
      const bob = tm.dead ? 0 : Math.sin(view.t * 4 + tm.seed) * 1.2;
      // v222 攻擊 3 段式（A6）：前搖→揮擊→收招相位對映（0.4s 窗 — 施法維持原攻擊幀）
      // v324：職業差異化 — 遠程（弓手拉弓/法師舉杖）用攻B幀＋更高舉手，前搖更長
      const ranged = tm.cls === "archer" || tm.cls === "mage";
      let frame = 0, atkLift = 0;
      if (tm.attack) {
        if (tm.casting) { frame = ranged ? 3 : 2; atkLift = ranged ? 8 : 6; }
        else if (tm.atkLeft > (ranged ? 0.35 : 0.3)) { frame = 3; atkLift = ranged ? 4 : 2; }  // 前搖（遠程拉弓/蓄力更深）
        else if (tm.atkLeft > 0.1) { frame = 2; atkLift = ranged ? 8 : 6; }  // 揮擊主幀
        else { frame = 4; atkLift = ranged ? 8 : 6; }                        // 收招（武器回位）
      }
      // v222 受擊後仰：下沉 2px＋向後 1px（純 transform — 不需新美術幀）；白→原色漸回
      const hurtLift = tm.hurt ? 2 : 0;
      const hurtBack = tm.hurt ? (tm.flip ? 1 : -1) : 0;
      const drawY = ty + bob - atkLift + hurtLift;
      draw(ctx, tm.sprite, tx + hurtBack, drawY, 1, { scale: 2, flip: tm.flip, frame, t: view.t });
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
        }
      }
    }
    // projectiles
    for (const p of view.projectiles || []) {
      draw(ctx, p.sprite, p.x, p.y, 1, { scale: 1.5, t: view.t });
    }
    // particles (skipped under reduced motion)
    const rm = !!(MG.game.state && MG.game.state.settings && MG.game.state.settings.reducedMotion);
    if (!rm) {
      for (const p of view.particles || []) {
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
        ctx.font = (f.big ? "bold 17px" : "bold 14px") + " monospace";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(8,10,22,0.92)";
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color || "#ffffff";
        ctx.fillText(f.text, f.x, f.y);
      }
    }
    ctx.globalAlpha = 1;
    // banner
    if (view.banner) {
      const bw = 260, bh = 34;
      ctx.fillStyle = "rgba(8,10,22,0.88)";
      ctx.fillRect(W / 2 - bw / 2, 54, bw, bh);
      ctx.strokeStyle = view.banner.boss ? "#ff5c8a" : "#ffd166";
      ctx.lineWidth = 2;
      ctx.strokeRect(W / 2 - bw / 2, 54, bw, bh);
      // stronger accent strip under the band
      ctx.fillStyle = view.banner.boss ? "rgba(255,92,138,0.6)" : "rgba(255,209,102,0.6)";
      ctx.fillRect(W / 2 - bw / 2 + 6, 54 + bh - 4, bw - 12, 2);
      ctx.font = "bold 17px monospace";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(8,10,22,0.9)";
      ctx.strokeText(view.banner.text, W / 2, 76);
      ctx.fillStyle = view.banner.boss ? "#ff9a9a" : "#ffd166";
      ctx.fillText(view.banner.text, W / 2, 76);
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
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#232642"); g.addColorStop(1, "#141524");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 24; i++) {
      const sx = (i * 67 + 13) % W, sy = (i * 41 + 7) % (H * 0.6);
      ctx.fillRect(sx, sy, 2, 2);
    }
    // moon
    ctx.fillStyle = "rgba(255,240,200,0.9)";
    ctx.beginPath(); ctx.arc(W - 46, 34, 14, 0, 7); ctx.fill();
    ctx.fillStyle = "#232642";
    ctx.beginPath(); ctx.arc(W - 40, 30, 12, 0, 7); ctx.fill();
    // ground
    ctx.fillStyle = "#1c1e31";
    ctx.fillRect(0, H - 34, W, 34);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, H - 34, W, 1);
    // v267 A4 過渡帶：地面頂緣 2 級色階（整列 fillRect — 避免逐列 960 次；每 4px 1 點交錯 dither 保留顆粒語彙）
    ctx.fillStyle = "#212538";
    ctx.fillRect(0, H - 33, W, 1);
    ctx.fillStyle = "#232a3d";
    ctx.fillRect(0, H - 32, W, 1);
    for (let i = 0; i < 120; i++) {
      const sx = i * 4 + (hsh(i, 21) % 4);
      ctx.fillStyle = (i % 2 === 0) ? "#1f2234" : "#212538";
      ctx.fillRect(sx, H - 33 + (i % 2), 1, 1);
    }
    const gndY = H - 34;
    // v237 A1R2 背景丘陵（style-guide「高地」— 遠山圓丘：縫隙間窺見遠山的地平線錨點；
    // 確定性幾何 — 靜態底景重繪不變；山體位於遠排與第 2 排建築之間的天空帶（頂 gndY-40 高於縫隙樹頂約 26px、底 gndY-18）
    // v247：5 座對齊新縫隙中心（139/213/287/361）＋右緣 425
    // v252 A2：逐座差異化（hsh 半寬/高/x 偏移）+ 4 級色階過渡（山腳→山腰→山脊→月霜山頂 — 圓弧非階梯）
    for (let i = 0; i < 5; i++) {
      const rnd = hsh(i, 7);
      const cx = 139 + i * 74 + ((rnd >> 4) % 9) - 4;
      const halfW = 8 + (rnd % 6);          // 8..13
      const ht = 18 + ((rnd >> 8) % 7);     // 18..24（頂 gndY-42 守住天際帶）
      for (let dy = -ht; dy <= 0; dy++) {
        const y = gndY - 18 + dy;
        const hw = Math.max(1, Math.round(halfW * Math.sqrt(1 - Math.pow(dy / ht, 2))));
        ctx.fillStyle = "#1b1e30"; // 山腳
        if (dy < -ht * 0.28) ctx.fillStyle = "#20243a";  // 山腰
        if (dy < -ht * 0.58) ctx.fillStyle = "#262b40";  // 山脊
        ctx.fillRect(cx - hw, y, hw * 2 + 1, 1);
        if (dy <= -ht + 2) ctx.fillStyle = "#2f3a55";     // 月霜山頂（夜間雪等價）
        ctx.fillRect(cx - 1, y, 3, 1);
      }
      // 右緣月光描邊（月亮在右側）
      for (let dy = -ht; dy <= 0; dy++) {
        const y = gndY - 18 + dy;
        const hw = Math.max(1, Math.round(halfW * Math.sqrt(1 - Math.pow(dy / ht, 2))));
        ctx.fillStyle = "#262b40";
        ctx.fillRect(cx + hw, y, 1, 1);
      }
      // 山脊樹線（v252：5..9 點疏密有致 — v252FIX：錨定各山實際山頂 gndY-18-ht，不浮空）
      const nRidge = 5 + (hsh(i, 11) % 5);
      ctx.fillStyle = "#20243a";
      for (let k = 0; k < nRidge; k++) {
        const dx = ((hsh(i * 7 + k, 13) % (halfW * 2)) - halfW);
        ctx.fillRect(cx + dx, gndY - 18 - ht + 2 + (k % 2), 1, 1);
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
    {
      const torchX = [];
      for (const b of view.buildings || []) {
        if (b.id === "castle" && b.lvl > 0) torchX.push(98); // v247：置中後推導（castle.x+38）
        if (b.id === "guild" && b.lvl > 0) torchX.push(172); // v247FIX：guild CELLS[1]+38
      }
      for (const tx of torchX) {
        const grd = ctx.createRadialGradient(tx, gndY + 22, 2, tx, gndY + 22, 18);
        grd.addColorStop(0, "rgba(255,150,70,0.10)");
        grd.addColorStop(1, "rgba(255,150,70,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(tx - 18, gndY + 4, 36, 30);
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
  return { canvasOf, spriteURL, frameIdx, animFrame, draw, drawBattle, drawTown, hsh }; // v271：hsh 匯出（worldmap 共用）
})();
