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
  function spriteURL(name) {
    const arr = canvasOf(name);
    if (!arr || !arr.length) return null;
    // bake at 4x for crisp DOM icons
    const src = arr[0];
    const c = document.createElement("canvas");
    c.width = src.width * 4; c.height = src.height * 4;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL();
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
      // name label: 11px with dark outline
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(8,10,22,0.92)";
      ctx.strokeText(m.name + (m.boss ? " 首領" : ""), mx, by - 4);
      ctx.fillStyle = "#f2f4ff";
      ctx.fillText(m.name + (m.boss ? " 首領" : ""), mx, by - 4);
    }
    // team
    for (const tm of view.team || []) {
      const tx = tm.x, ty = tm.y;
      const bob = tm.dead ? 0 : Math.sin(view.t * 4 + tm.seed) * 1.2;
      draw(ctx, tm.sprite, tx, ty + bob - (tm.attack ? 3 : 0), 1, { scale: 2, flip: tm.flip, frame: tm.attack ? 2 : 0, t: view.t });
      // hp bar
      ctx.fillStyle = "#10111f"; ctx.fillRect(tx + 2, ty - 7, 26, 4);
      ctx.fillStyle = tm.hp / tm.maxHp > 0.5 ? "#7ee787" : tm.hp / tm.maxHp > 0.25 ? "#ffd166" : "#ff5c5c";
      ctx.fillRect(tx + 3, ty - 6, 24 * Math.max(0, tm.hp / tm.maxHp), 2);
      if (tm.buffed) {
        draw(ctx, "fx_buff", tx - 2, ty - 16, 1, { scale: 1, t: view.t });
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
        draw(ctx, p.sprite, p.x, p.y, 1, { scale: p.scale, t: p.t || view.t, alpha: Math.max(0, p.life / p.maxLife) });
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
    // retreat overlay — 讓 20 秒等待時間有明確視覺回饋（不會看起來像畫面凍結）
    if (view.retreatLeft > 0) {
      ctx.fillStyle = "rgba(8,10,20,0.55)";
      ctx.fillRect(0, 0, W, H);
      const bw = 300, bh = 76;
      ctx.fillStyle = "rgba(10,10,20,0.82)";
      ctx.fillRect(W / 2 - bw / 2, 96, bw, bh);
      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 2;
      ctx.strokeRect(W / 2 - bw / 2, 96, bw, bh);
      ctx.textAlign = "center";
      ctx.font = "bold 18px monospace";
      ctx.fillStyle = "#ff9a9a";
      ctx.fillText("全軍撤退…", W / 2, 126);
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("復活倒數 " + Math.ceil(view.retreatLeft) + " 秒", W / 2, 150);
      const p = 1 - view.retreatLeft / 20;
      ctx.fillStyle = "#10111f";
      ctx.fillRect(W / 2 - 100, 158, 200, 8);
      ctx.fillStyle = "#ff6b6b";
      ctx.fillRect(W / 2 - 98, 160, 196 * Math.max(0, Math.min(1, p)), 4);
    }
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
    ctx.fillRect(0, H - 34, W, 3);
    // buildings
    for (const b of view.buildings || []) {
      draw(ctx, b.sprite, b.x, b.y, 1, { scale: b.scale });
      if (b.locked) {
        ctx.fillStyle = "rgba(10,10,20,0.55)";
        ctx.fillRect(b.x - 2, b.y - 2, 32 * b.scale + 4, 32 * b.scale + 4);
        draw(ctx, "icon_lock", b.x + 16 * b.scale - 8, b.y + 8, 1, { scale: 1 });
      }
      // name label
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = b.locked ? "rgba(139,144,181,0.8)" : "rgba(232,234,246,0.85)";
      ctx.fillText(b.name + (b.locked ? " Lv?" : " Lv" + b.lvl), b.x + 16 * b.scale, b.y + 32 * b.scale + 12);
    }
  }
  return { canvasOf, spriteURL, frameIdx, draw, drawBattle, drawTown };
})();
