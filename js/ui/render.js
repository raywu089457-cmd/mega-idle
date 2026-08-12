/* 放置王國 MEGA IDLE — canvas renderer: sprite cache, battle scene, town scene */
"use strict";
MG.ui = MG.ui || {};
MG.ui.render = (function () {
  const caches = {}; // name -> [canvas per frame]
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
    const f = arr[o.frame !== undefined ? o.frame : frameIdx(name, o.t || 0)];
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
    // pixel stars（v159：固定種子星點，與村莊夜空呼應）
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 30; i++) {
      ctx.fillRect((i * 53 + 7) % W, (i * 37 + 5) % Math.floor(H * 0.6), 2, 2);
    }
    ctx.fillStyle = "rgba(255,220,150,0.30)";
    for (let i = 0; i < 10; i++) {
      ctx.fillRect((i * 97 + 23) % W, (i * 61 + 11) % Math.floor(H * 0.5), 2, 2);
    }
    // distant hills
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    hill(ctx, 40, H * 0.62, 160, 60);
    hill(ctx, 300, H * 0.66, 220, 80);
    hill(ctx, -60, H * 0.68, 200, 70);
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
      const mx = m.x !== undefined ? m.x : W * 0.62;
      draw(ctx, m.sprite, mx - mw / 2, my - mh, 1, { scale: m.scale, t: view.t, frame: m.frame, alpha: m.dead ? 0.3 : 1 });
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
      // hp bar
      const bw = Math.max(60, mw + 10);
      const bx = mx - bw / 2, by = my - mh - 12;
      ctx.fillStyle = "#10111f"; ctx.fillRect(bx, by, bw, 6);
      ctx.fillStyle = m.boss ? "#ff5c8a" : "#e85c5c";
      ctx.fillRect(bx + 1, by + 1, (bw - 2) * Math.max(0, m.hp / m.maxHp), 4);
      // name label: 11px with dark outline（v116：名字不加 BOSS 字樣；精英/稀有度著色）
      ctx.font = "bold 12px monospace";
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
      draw(ctx, tm.sprite, tx, ty + bob - (tm.attack ? 6 : 0), 1, { scale: 2, flip: tm.flip, frame: tm.attack ? 2 : 0, t: view.t });
      // 攻擊/施法瞬間白閃（高對比，肉眼可見）
      if (tm.attack) {
        const wf = whiteOf(tm.sprite, tm.attack ? 2 : 0);
        if (wf) {
          ctx.save();
          ctx.globalAlpha = tm.casting ? 0.4 : 0.28;
          ctx.imageSmoothingEnabled = false;
          if (tm.flip) { ctx.translate(tx + 32, ty + bob - (tm.attack ? 6 : 0)); ctx.scale(-1, 1); ctx.drawImage(wf, 0, 0, 32, 32); }
          else ctx.drawImage(wf, tx, ty + bob - (tm.attack ? 6 : 0), 32, 32);
          ctx.restore();
        }
      }
      // hp bar
      ctx.fillStyle = "#10111f"; ctx.fillRect(tx + 2, ty - 7, 26, 4);
      ctx.fillStyle = tm.hp / tm.maxHp > 0.5 ? "#7ee787" : tm.hp / tm.maxHp > 0.25 ? "#ffd166" : "#ff5c5c";
      ctx.fillRect(tx + 3, ty - 6, 24 * Math.max(0, tm.hp / tm.maxHp), 2);
      ctx.fillStyle = "rgba(0,0,0,.28)";
      for (let gx = tx + 8; gx < tx + 26; gx += 6) ctx.fillRect(gx, ty - 6, 1, 2);
      if (tm.buffed) {
        draw(ctx, "fx_buff", tx - 2, ty - 16, 1, { scale: 1, t: view.t });
      }
      // 施法光暈（放招瞬間的爆發感）
      if (tm.casting) {
        draw(ctx, "fx_spark", tx + 2, ty - 12, 1, { scale: 1.6, t: view.t, alpha: 0.9 });
      }
      // 狀態圖示（護盾/嘲諷/技能就緒）
      for (const s of tm.status || []) {
        if (s === "shield") {
          draw(ctx, "fx_shield", tx - 6, ty - 25, 1, { scale: 1, t: view.t });
        } else if (s === "taunt") {
          ctx.font = "bold 12px monospace";
          ctx.textAlign = "left";
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(8,10,22,0.9)";
          ctx.strokeText("嘲", tx + 14, ty - 18);
          ctx.fillStyle = "#ff5c8a";
          ctx.fillText("嘲", tx + 14, ty - 18);
        } else if (s === "ready") {
          ctx.font = "bold 12px monospace";
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
        ctx.font = (f.big ? "bold 24px" : "bold 12px") + " monospace";
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
      ctx.font = "bold 24px monospace";
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
      // v159：階梯像素山（2px 階高、逐階加寬）
      const tiers = 10;
      for (let i = 0; i <= tiers; i++) {
        const th = Math.round(h * (1 - i / tiers));
        const tw = Math.round(w * (0.16 + 0.68 * i / tiers));
        ctx.fillRect(x - tw / 2, y + h - th - 4, tw, 2);
      }
    }
  }
  /* ---------- town scene ---------- */
  function drawTown(ctx, view) {
    const W = 480, H = view.h || 200;
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
    // moon（v159：像素階梯圓 + 月牙）
    ctx.fillStyle = "rgba(255,240,200,0.9)";
    for (let yy = -14; yy <= 14; yy += 2) {
      const half = Math.floor(Math.sqrt(196 - yy * yy) / 2) * 2;
      ctx.fillRect(W - 46 - half, 34 + yy, half * 2, 2);
    }
    ctx.fillStyle = "#232642";
    for (let yy = -12; yy <= 12; yy += 2) {
      const half = Math.floor(Math.sqrt(144 - yy * yy) / 2) * 2;
      ctx.fillRect(W - 40 - half, 30 + yy, half * 2, 2);
    }
    // ground
    ctx.fillStyle = "#1c1e31";
    ctx.fillRect(0, H - 34, W, 34);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, H - 34, W, 3);
    // 草地像素點（v159）
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 20; i++) {
      ctx.fillRect((i * 47 + 9) % W, H - 28 + (i * 13) % 20, 2, 2);
    }
    // 地平線小樹（v159，建築背後）
    for (let i = 0; i < 6; i++) {
      const tx = (i * 83 + 21) % (W - 40) + 20;
      const ty = H - 34;
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(tx - 1, ty - 8, 2, 8);
      ctx.fillStyle = "#1d3a2e";
      ctx.fillRect(tx - 6, ty - 14, 12, 6);
      ctx.fillStyle = "#2a5238";
      ctx.fillRect(tx - 4, ty - 18, 8, 6);
    }
    // buildings
    for (const b of view.buildings || []) {
      draw(ctx, b.sprite, b.x, b.y, 1, { scale: b.scale });
      if (b.locked) {
        ctx.fillStyle = "rgba(10,10,20,0.55)";
        ctx.fillRect(b.x - 2, b.y - 2, 32 * b.scale + 4, 32 * b.scale + 4);
        draw(ctx, "icon_lock", b.x + 16 * b.scale - 8, b.y + 8, 1, { scale: 1 });
      }
      // name label
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = b.locked ? "rgba(139,144,181,0.8)" : "rgba(232,234,246,0.85)";
      ctx.fillText(b.name + (b.locked ? " Lv?" : " Lv" + b.lvl), b.x + 16 * b.scale, b.y + 32 * b.scale + 12);
    }
  }
  return { canvasOf, spriteURL, frameIdx, draw, drawBattle, drawTown };
})();
