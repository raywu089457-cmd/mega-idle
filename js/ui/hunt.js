/* 放置王國 MEGA IDLE — hunt screen: live battle canvas + controls + loot log (slice B3 owns) */
"use strict";
MG.ui = MG.ui || {};
MG.ui.hunt = (function () {
  const S = () => MG.game.state;
  const REGIONS = () => MG.data.monsters.regions;
  let canvas, ctx, root, logEl, stageEl, controlsEl, chipsEl, teamEl, coachEl, speedBtn, farmEl;
  let statusEl, dispatchBtn, recallBtn, autoBtn;
  let diffEls = []; // 難度 chips（syncDom 刷新 on 狀態）
  const potEls = {};
  let lastFrame = 0, lastLootTicker = 0;
  const anim = {
    floats: [], particles: [], projectiles: [], goldFlash: 0, eventsCursor: 0, screenT: 0,
    lastMonsterId: null, entering: 0, bossHit: 0, bossFlash: 0, regionFlash: 0, extraShake: 0,
    monsterFlash: 0, death: null, wipeHinted: false
  };
  function rm() {
    const s = S();
    return !!(s && s.settings && s.settings.reducedMotion);
  }
  const ENTER_MS = 0.42;
  const TEAM_POS = [
    { x: 46, y: 196 }, { x: 92, y: 196 }, { x: 138, y: 196 }, { x: 70, y: 162 }, { x: 116, y: 162 }
  ];
  function easeOutBack(p) {
    // p in 0..1 -> 0..1 with a small overshoot past 1
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  }
  function teamView() {
    const F = MG.sys.battle.get();
    const team = F.team || [];
    return team.map((h, i) => ({
      ...h, ...(TEAM_POS[i] || TEAM_POS[0]),
      flip: true, dead: h.hp <= 0, attack: false, seed: i * 1.7
    }));
  }
  function monsterView(F) {
    if (!F.m) return null;
    const size = F.m.size || (F.m.boss ? 3 : 2);
    let sc = size;
    if (anim.entering > 0) {
      const p = 1 - anim.entering / ENTER_MS;
      sc = size * easeOutBack(Math.max(0, Math.min(1, p)));
    }
    return {
      sprite: F.m.sprite, name: F.m.name, boss: F.m.boss,
      hp: Math.max(0, F.hp), maxHp: F.maxHp,
      scale: sc, x: 320, y: 0, dead: F.phase === "retreat" || F.hp <= 0,
      frozen: F.freeze > 0, flash: anim.monsterFlash
    };
  }
  function monsterSizeOf(sprite) {
    // size isn't carried on the kill event; look it up from region defs
    for (const r of REGIONS()) {
      const m = r.monsters.find(x => x.sprite === sprite);
      if (m) return m.size || 2;
      if (r.boss && r.boss.sprite === sprite) return r.boss.size || 3;
    }
    return 2;
  }
  function spawnFloat(x, y, text, color, big) {
    if (rm()) return; // reduced motion: no floating text
    if (anim.floats.length > 60) return; // throttle: cap active floats
    anim.floats.push({ x, y, vy: -0.55, life: 0.9, maxLife: 0.9, text, color: color || "#fff", big });
  }
  function spawnParticle(sprite, x, y, opts) {
    if (rm()) return; // reduced motion: no particles
    const o = opts || {};
    anim.particles.push({ x, y, vx: o.vx || 0, vy: o.vy || -0.3, life: o.life || 0.6, maxLife: o.life || 0.6, sprite, scale: o.scale || 1, gravity: o.gravity || 0.001, t: anim.screenT });
  }
  function spawnProjectile(sprite, x0, y0, x1, y1, dur) {
    anim.projectiles.push({ sprite, x0, y0, x1, y1, t: 0, dur: dur || 0.25 });
  }
  function spawnLootCoins(boss) {
    // loot flies toward the gold counter (top-left)
    const n = boss ? 11 : 6;
    for (let k = 0; k < n; k++) {
      spawnParticle("fx_coin",
        320 + (Math.random() - 0.5) * 26, 205 + (Math.random() - 0.5) * 14,
        { vx: -(100 + Math.random() * 150), vy: -(120 + Math.random() * 140), life: 0.65 + Math.random() * 0.3, scale: 1.1 + Math.random() * 0.7, gravity: 0.0005 });
    }
  }
  function bossImpact(flash, stop, shake) {
    if (flash > 0) anim.bossFlash = Math.max(anim.bossFlash, flash);
    if (stop > 0) anim.bossHit = Math.max(anim.bossHit, stop);
    if (shake > 0) anim.extraShake = Math.max(anim.extraShake, shake);
  }
  /* 區域解放獎勵（首次通過該區域時觸發一次） */
  function showRegionClear(r) {
    const st = S();
    const idx = REGIONS().indexOf(r);
    const ticketBonus = idx < 3; // 前三區域附贈招募券
    if (ticketBonus) st.currencies.ticket = (st.currencies.ticket || 0) + 1;
    const rewardRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 8, alignItems: "center", justifyContent: "center", color: "var(--gold)", fontWeight: 800, fontSize: 13, marginBottom: 12 } },
      MG.ui.dom.icon("icon_gem", 16), MG.ui.dom.h("span", null, "區域獎勵：20 鑽石"),
      ticketBonus ? MG.ui.dom.h("span", null, "・") : null,
      ticketBonus ? MG.ui.dom.icon("icon_ticket", 16) : null,
      ticketBonus ? MG.ui.dom.h("span", null, "招募券 x1") : null);
    const body = MG.ui.dom.h("div", null,
      MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 10 } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 18, color: "var(--gold)" } }, "「" + r.name + "」解放！"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginTop: 4 } }, r.desc)),
      MG.ui.dom.h("div", { style: { display: "flex", gap: 10, alignItems: "center", background: "var(--panel2)", borderRadius: 10, padding: "10px", marginBottom: 10 } },
        MG.ui.dom.icon(r.boss.sprite, 30),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, color: "var(--r5)" } }, "守關首領：" + r.boss.name),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, r.boss.flavor || r.bossDesc))),
      rewardRow,
      MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, on: { click: () => m.close() } }, "繼續前進"));
    const m = MG.ui.dom.modal("區域解放！", body, { wide: true, icon: "icon_honor" });
  }
  /* 首領討伐慶祝：輕量全屏覆蓋，2 秒自動消失或點擊關閉 */
  function showBossCelebration(e) {
    const root = document.getElementById("overlay-root");
    if (!root) return;
    const st = S();
    const rm = st.settings && st.settings.reducedMotion;
    const ovl = MG.ui.dom.h("div", {
      style: {
        position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(10,12,24,0.45)", cursor: "pointer", padding: "0 24px"
      },
      on: { click: dismiss }
    });
    const rarColor = (e.item && MG.config.RARITY[e.item.rarity - 1]) ? MG.config.RARITY[e.item.rarity - 1].color : "var(--text)";
    const inner = MG.ui.dom.h("div", {
      style: {
        textAlign: "center", maxWidth: 320, width: "100%", padding: "18px 16px", borderRadius: 12,
        background: "var(--panel)", border: "2px solid var(--gold)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        animation: rm ? "none" : "modalUp .4s"
      }
    },
      MG.ui.dom.icon("icon_skull", 26),
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 20, color: "var(--gold)", margin: "4px 0 2px", textShadow: "0 2px 0 rgba(0,0,0,.5)" } }, "首領討伐！"),
      MG.ui.dom.h("div", { style: { fontSize: 13, color: "var(--text)" } }, "「" + e.name + "」已被討伐"),
      MG.ui.dom.h("div", { style: { display: "flex", gap: 6, alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "var(--gold)", marginTop: 8 } },
        MG.ui.dom.icon("icon_coin", 16), MG.ui.dom.h("span", null, "+" + MG.util.fmt(e.gold || 0) + " 金幣")),
      MG.ui.dom.h("div", { style: { fontSize: 12, marginTop: 6, color: e.item ? rarColor : "var(--dim)", fontWeight: e.item ? 700 : 400 } },
        e.item ? "戰利品：「" + e.item.name + "」" : "戰利品已自動分解"),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 10 } }, "點擊畫面繼續"));
    ovl.appendChild(inner);
    root.appendChild(ovl);
    const t = setTimeout(dismiss, 2000);
    function dismiss() { clearTimeout(t); if (ovl.parentNode) ovl.parentNode.removeChild(ovl); }
  }
  function consumeEvents(evs) {
    const F = MG.sys.battle.get();
    for (const e of evs) {
      const hunter = F.team.find(h => h.id === e.hunter);
      const hx = hunter ? (TEAM_POS[F.team.indexOf(hunter)][0] + 20) : 80;
      const hy = hunter ? (TEAM_POS[F.team.indexOf(hunter)][1] - 10) : 180;
      switch (e.type) {
        case "hit":
        case "crit": {
          const isRanged = e.cls === "archer" || e.cls === "mage";
          const vsBoss = F.m && F.m.boss;
          if (isRanged) {
            spawnProjectile(e.cls === "archer" ? "fx_arrow" : "fx_fireball", hx, hy, 320, 220, e.cls === "archer" ? 0.22 : 0.3);
            const at = e.cls === "archer" ? 220 : 300;
            setTimeout(() => { anim.monsterFlash = e.type === "crit" ? 0.09 : 0.07; }, at);
            if (e.type === "crit") setTimeout(() => spawnFloat(320, 210, "-" + MG.util.fmt(e.dmg), "#ffd166", true), at);
            else setTimeout(() => spawnFloat(320, 215, "-" + MG.util.fmt(e.dmg), "#ffffff", false), at);
          } else {
            anim.monsterFlash = e.type === "crit" ? 0.09 : 0.07;
            spawnFloat(320, 210, "-" + MG.util.fmt(e.dmg), e.type === "crit" ? "#ffd166" : "#ffffff", e.type === "crit");
            spawnParticle("fx_slash", 300, 210, { life: 0.3, scale: 1.4, gravity: 0 });
          }
          if (e.type === "crit") {
            MG.core.audio.SFX.crit();
            if (vsBoss) bossImpact(0.3, 0.09, 0.4);
          } else if (vsBoss) {
            bossImpact(0, 0.05, 0);
          }
          break;
        }
        case "skill": {
          const fx = (MG.data.hunters.skills[e.skill] || {}).icon || "fx_spark";
          if (e.dmg > 0) {
            anim.monsterFlash = 0.07;
            spawnFloat(320, 200, "-" + MG.util.fmt(e.dmg), "#c792ea", true);
            if (F.m && F.m.boss) bossImpact(0.22, 0.07, 0.25);
          }
          spawnParticle(fx, 310, 205, { life: 0.45, scale: 1.6, gravity: 0 });
          MG.core.audio.SFX.skill();
          break;
        }
        case "mhit":
          spawnFloat(hx, hy - 6, "-" + MG.util.fmt(e.dmg), "#ff6b6b", false);
          spawnParticle("fx_spark", hx, hy, { life: 0.25, scale: 0.9, gravity: 0 });
          break;
        case "dot":
          spawnFloat(320, 225, "-" + MG.util.fmt(e.dmg), "#7ac86a", false);
          break;
        case "heal":
          spawnFloat(hx, hy - 8, "+" + MG.util.fmt(e.amt), "#7ee787", false);
          spawnParticle("fx_heal", hx, hy, { life: 0.4, scale: 1.2, gravity: 0 });
          break;
        case "kill": {
          // squash-stretch first; boom + float + coins fire after 0.25s (render loop)
          anim.death = {
            sprite: e.sprite, size: e.boss ? 3 : monsterSizeOf(e.sprite), boss: e.boss,
            t: 0.25, max: 0.25
          };
          // 首領慶祝通知只在「首次」擊敗首領時立即顯示（重複討伐不再跳通知；
          // 立即觸發以免被後續 kill 事件覆蓋延遲動畫而吞掉）
          if (e.firstBoss) showBossCelebration(e);
          anim.wipeHinted = false;
          if (e.boss) {
            const st = S();
            const nextR = REGIONS()[st.hunt.region + 1];
            if (nextR && st.kingdom.level < nextR.unlockK) {
              setTimeout(() => {
                MG.ui.dom.toast("已通關「" + REGIONS()[st.hunt.region].name + "」！王國 Lv " + nextR.unlockK + " 解鎖「" + nextR.name + "」（目前 Lv " + st.kingdom.level + "）", "", "icon_castle");
              }, 2200);
            }
          }
          break;
        }
        case "boss":
          spawnParticle("fx_boom", 320, 200, { life: 0.7, scale: 2.2 });
          spawnFloat(320, 150, "首領來襲！", "#ff5c8a", true);
          bossImpact(0.45, 0, 0.8);
          break;
        case "region":
          MG.sys.game.log("區域解放！「" + e.name + "」的大門已開啟，前進新獵場！", "icon_honor");
          anim.regionFlash = 0.7;
          {
            const st = S();
            if (!st.quests.regionShown) st.quests.regionShown = {};
            if (!st.quests.regionShown[e.name]) {
              st.quests.regionShown[e.name] = true;
              const r = REGIONS().find(x => x.name === e.name);
              if (r) showRegionClear(r);
            }
          }
          break;
        case "repeatboss":
          MG.sys.game.log("首領討伐完成！敵人重新集結，準備再戰。", "icon_skull");
          break;
        case "regionunlock":
          MG.sys.game.log("已征服「" + REGIONS()[st.hunt.region].name + "」！「" + e.name + "」已解鎖，隨時可切換獵場。", "icon_sword");
          MG.ui.dom.toast("已解鎖「" + e.name + "」！點擊上方獵場名稱即可前往（也可留在原地繼續練角）", "good", "icon_sword");
          break;
        case "nextlocked":
          MG.ui.dom.toast("「" + e.name + "」需要王國 Lv " + e.unlockK + " 解鎖（目前 Lv " + st.kingdom.level + "），留在原地累積戰力吧！", "", "icon_castle");
          break;
        case "retreat":
          spawnFloat(240, 140, "全軍倒下，回村休息中…", "#7ee787", true);
          if (e.wipes >= 2 && !anim.wipeHinted) {
            anim.wipeHinted = true;
            MG.ui.dom.toast("戰力不足？強化獵人裝備，或「倒退一關」累積戰利品！", "", "icon_sword");
          }
          if (farmEl && e.wipes >= 1) farmEl.style.display = "inline-flex";
          // 引擎端連敗回退（battle.retreat）：退關或降難度
          if (e.fallback) {
            MG.ui.dom.toast(e.fallback.type === "stage"
              ? "連敗三場，已自動退至第 " + e.fallback.stage + " 關累積戰力！"
              : "連敗三場，難度降至「" + MG.config.DIFFICULTY[e.fallback.diff].name + "」！", "bad", "icon_sword");
          }
          break;
        case "resume":
          spawnFloat(240, 140, "再戰！", "#7ee787", true);
          break;
        case "returnhome":
          spawnFloat(240, 140, "全軍回村休息", "#7ee787", true);
          break;
        case "levelup":
          spawnFloat(hx, hy - 14, "升級！", "#ffd166", true);
          break;
      }
    }
  }
  function postDraw(view) {
    const W = 480, H = 270;
    // boss hit flash
    if (anim.bossFlash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + ((anim.bossFlash / 0.45) * 0.5).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    // region-clear golden transition
    if (anim.regionFlash > 0) {
      ctx.fillStyle = "rgba(255,209,102," + ((anim.regionFlash / 0.7) * 0.24).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    // boss banner polish: pulsing underline that fades with the banner (static when reduced motion)
    if (view.banner && view.banner.boss) {
      const bw = 260;
      const rem = view.banner.t !== undefined ? Math.max(0, Math.min(1, view.banner.t / 0.4)) : 1;
      const pulse = rm() ? 0.72 : 0.5 + 0.5 * Math.sin(anim.screenT * 12);
      ctx.fillStyle = "rgba(255,92,138," + ((0.16 + 0.14 * pulse) * rem).toFixed(3) + ")";
      ctx.fillRect(240 - bw / 2, 87, bw, 3);
    }
    ctx.globalAlpha = 1;
  }
  function spawnKillFX(boss) {
    spawnParticle("fx_boom", 320, 215, { life: 0.5, scale: boss ? 2.4 : 1.8 });
    spawnFloat(320, 185, boss ? "首領討伐！" : "擊敗！", "#ffd166", true);
    anim.goldFlash = 1;
    spawnLootCoins(boss);
    if (boss) bossImpact(0.42, 0.1, 0.6);
  }
  function render(now) {
    // skip rendering entirely while the tab is hidden (sim keeps ticking)
    if (document.hidden) { lastFrame = now; return; }
    const rawDt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    let dt = rawDt;
    const F = MG.sys.battle.get();
    // hit-stop: briefly freeze visual time after a boss takes a heavy hit
    if (anim.bossHit > 0) { anim.bossHit = Math.max(0, anim.bossHit - rawDt); dt *= 0.1; }
    anim.screenT += dt;
    // consume events
    const evs = MG.sys.battle.drainEvents();
    consumeEvents(evs);
    // monster entrance: scale-in whenever a new enemy appears
    const mid = F.m ? (F.m.boss ? "B:" : "N:") + F.m.id : null;
    if (mid !== anim.lastMonsterId) {
      anim.lastMonsterId = mid;
      if (mid) {
        anim.entering = ENTER_MS;
        if (F.m.boss) bossImpact(0.35, 0, 0.5);
      }
    }
    if (anim.entering > 0) anim.entering = Math.max(0, anim.entering - dt);
    if (anim.bossFlash > 0) anim.bossFlash = Math.max(0, anim.bossFlash - rawDt);
    if (anim.regionFlash > 0) anim.regionFlash = Math.max(0, anim.regionFlash - rawDt);
    if (anim.extraShake > 0) anim.extraShake = Math.max(0, anim.extraShake - rawDt * 1.4);
    if (anim.monsterFlash > 0) anim.monsterFlash = Math.max(0, anim.monsterFlash - rawDt);
    // death squash: decay over 0.25s, then boom + celebration
    if (anim.death) {
      anim.death.t -= dt;
      if (anim.death.t <= 0) {
        const d = anim.death;
        spawnKillFX(d.boss);
        anim.death = null;
      }
    }
    // update anims
    for (let i = anim.floats.length - 1; i >= 0; i--) {
      const f = anim.floats[i];
      f.life -= dt; f.y += f.vy * 60 * dt;
      if (f.life <= 0) anim.floats.splice(i, 1);
    }
    for (let i = anim.particles.length - 1; i >= 0; i--) {
      const p = anim.particles[i];
      p.life -= dt; p.x += p.vx * 60 * dt; p.y += p.vy * 60 * dt; p.vy += p.gravity * 60 * dt;
      if (p.life <= 0) anim.particles.splice(i, 1);
    }
    for (let i = anim.projectiles.length - 1; i >= 0; i--) {
      const p = anim.projectiles[i];
      p.t += dt;
      if (p.t >= p.dur) { anim.projectiles.splice(i, 1); continue; }
      p.x = p.x0 + (p.x1 - p.x0) * (p.t / p.dur);
      p.y = p.y0 + (p.y1 - p.y0) * (p.t / p.dur) - Math.sin(p.t / p.dur * Math.PI) * 14;
    }
    if (anim.goldFlash > 0) anim.goldFlash -= dt;
    const st = S();
    const region = REGIONS()[st.hunt.region];
    const pal = MG.config.REGION_THEME[region.palIdx] || MG.config.REGION_THEME[0];
    let dying = null;
    if (anim.death) {
      const d = anim.death;
      const p = Math.max(0, d.t / d.max); // 1 -> 0
      dying = { sprite: d.sprite, size: d.size, x: 320, y: 202, sx: 1 + 0.3 * p, sy: 1 - 0.3 * p, alpha: 0.35 + 0.65 * p };
    }
    const view = {
      t: anim.screenT, pal, shake: (F.shake || 0) + anim.extraShake,
      banner: F.banner ? { ...F.banner, boss: (F.m && F.m.boss) } : null,
      monster: monsterView(F),
      team: teamView(),
      particles: anim.particles,
      floats: anim.floats,
      projectiles: anim.projectiles,
      dying,
      retreatLeft: F.phase === "retreat" ? Math.max(0, (F.retreatAt - Date.now()) / 1000) : 0
    };
    // 死亡回城休息 / 未派遣待機 → 城內場景（英雄在城內顯示休息中，不再蓋全軍撤退遮罩）
    if (view.retreatLeft > 0 || (F.phase === "idle" && !(st.hunt.dispatchIds || []).length)) {
      drawTownScene(view, view.retreatLeft);
    } else {
      MG.ui.render.drawBattle(ctx, view);
      postDraw(view);
    }
    // DOM sync at 4Hz
    if (Math.floor(now / 250) !== Math.floor((now - dt * 1000) / 250)) syncDom(F);
  }
  /* ---------- 城內場景：英雄回城休息 / 待機 ---------- */
  function drawTownScene(view, restLeft) {
    const W = 480, H = 270;
    const rm = !!(S().settings && S().settings.reducedMotion);
    const buildings = (MG.ui.kingdom && MG.ui.kingdom.townView)
      ? MG.ui.kingdom.townView().map(b => ({ ...b, y: b.y + 70 }))
      : [];
    MG.ui.render.drawTown(ctx, { h: H, t: anim.screenT, buildings });
    // 城內的英雄（休息中 — 站在地面上，頭頂 💤）
    const team = view.team || [];
    team.forEach((h, i) => {
      const tx = W / 2 + (i - (team.length - 1) / 2) * 52;
      const ty = H - 34 - 30;
      const bob = Math.sin(anim.screenT * 3 + i * 1.7) * 1.2;
      MG.ui.render.draw(ctx, h.sprite, tx, ty + bob, 1, { scale: 2, flip: h.flip, frame: 0, t: anim.screenT });
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#9db4ff";
      ctx.fillText("💤", tx + 15, ty - 6);
    });
    // 浮動文字/粒子（與戰場同款）
    if (!rm) {
      for (const f of view.floats || []) {
        const a = Math.max(0, f.life / f.maxLife);
        ctx.globalAlpha = a;
        ctx.font = (f.big ? "bold 17px" : "bold 14px") + " monospace";
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(8,10,22,0.92)";
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color || "#ffffff";
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      for (const p of view.particles || []) {
        MG.ui.render.draw(ctx, p.sprite, p.x, p.y, 1, { scale: p.scale, t: p.t || anim.screenT, alpha: Math.max(0, p.life / p.maxLife) });
      }
    }
    // 休息倒數橫幅（輕量、不遮操作）
    if (restLeft > 0) {
      const bw = 320, bh = 42;
      ctx.fillStyle = "rgba(8,10,22,0.88)";
      ctx.fillRect(W / 2 - bw / 2, 14, bw, bh);
      ctx.strokeStyle = "#7ee787";
      ctx.lineWidth = 2;
      ctx.strokeRect(W / 2 - bw / 2, 14, bw, bh);
      ctx.textAlign = "center";
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "#7ee787";
      ctx.fillText("💤 全軍回村休息中 " + Math.ceil(restLeft) + " 秒", W / 2, 36);
      ctx.fillStyle = "#10111f";
      ctx.fillRect(W / 2 - 95, 44, 190, 7);
      ctx.fillStyle = "#7ee787";
      ctx.fillRect(W / 2 - 93, 45, 186 * Math.max(0, Math.min(1, 1 - restLeft / 20)), 5);
    }
  }
  function syncDom(F) {
    const st = S();
    const region = REGIONS()[st.hunt.region];
    // stage header — tap region name for 獵場情報
    if (stageEl) {
      const bossStage = st.hunt.stage % 10 === 0;
      stageEl.innerHTML = "";
      stageEl.appendChild(MG.ui.dom.h("div", { class: "hunt-stage-h", style: { cursor: "pointer" }, on: { click: () => showRegionInfo(st.hunt.region) } },
        region.name,
        MG.ui.dom.h("span", { style: { color: bossStage ? "var(--r5)" : "var(--gold)" } }, "　第 " + st.hunt.stage + " 關" + (bossStage ? "（首領）" : "")),
        MG.ui.dom.h("span", { style: { color: "var(--dim)", fontSize: 10, marginLeft: 6, cursor: "pointer", border: "1px solid var(--line)", borderRadius: 9, padding: "0 3px", lineHeight: "13px", display: "inline-block" } }, "ⓘ")));
      stageEl.appendChild(MG.ui.dom.h("div", { class: "pbar", style: { marginTop: 4 } },
        MG.ui.dom.h("i", { style: { width: ((st.hunt.stage % 10) / 10 * 100) + "%" } })));
    }
    // speed toggle active state
    if (speedBtn) {
      const s = st.hunt.speed || 1;
      speedBtn.className = "btn sm" + (s > 1 ? " gold" : "");
      speedBtn.innerHTML = "";
      speedBtn.appendChild(MG.ui.dom.icon("icon_speed", 14));
      speedBtn.appendChild(document.createTextNode(s === 1 ? " 1x 一般" : s === 2 ? " 2x 加速" : " 4x 疾速"));
    }
    // 派遣狀態列 + 按鈕狀態
    const ds = dispatchState();
    const auto = !!st.hunt.autoDispatch;
    const formationCount = st.formation.filter(id => id && st.hunters.some(h => h.id === id)).length;
    if (statusEl) {
      let txt = "⏳ 待機中 — 按下「派遣」率領編隊出征";
      if (ds.resting) {
        const sec = Math.max(0, Math.ceil(((st.hunt.restUntil || 0) - Date.now()) / 1000));
        txt = auto ? "💤 全軍回村休息中 " + sec + " 秒 — 休息完自動再戰" : "💤 全軍回村休息中 " + sec + " 秒 — 休息完畢自動待機";
      } else if (ds.ids.length) {
        const bossStage = st.hunt.stage % MG.config.MAX_STAGE_PER_REGION === 0;
        const dName = MG.config.DIFFICULTY[(st.hunt.difficulty || 0)].name;
        txt = "⚔ 派遣中：" + ds.ids.length + " 名獵人 · 第 " + st.hunt.stage + " 關" + (bossStage ? "（首領）" : "") + (dName !== "普通" ? " · " + dName : "") + (auto ? " · 自動續戰" : "");
      }
      statusEl.textContent = txt;
      statusEl.style.color = ds.ids.length && !ds.resting ? "var(--good)" : "var(--dim)";
    }
    // 難度 chips on 狀態刷新
    if (diffEls.length) {
      diffEls.forEach((el, i) => {
        el.classList.toggle("on", (st.hunt.difficulty || 0) === i);
        el.style.color = (st.hunt.difficulty || 0) === i ? "#3a2500" : (MG.config.DIFFICULTY[i] || {}).color;
      });
    }
    if (dispatchBtn) {
      dispatchBtn.disabled = ds.ids.length > 0 || ds.resting || formationCount === 0;
      dispatchBtn.innerHTML = "";
      dispatchBtn.appendChild(MG.ui.dom.icon("icon_sword", 14));
      dispatchBtn.appendChild(document.createTextNode(" 派遣" + (formationCount ? " " + formationCount + " 人" : "")));
    }
    if (recallBtn) {
      recallBtn.style.display = ds.ids.length ? "inline-flex" : "none";
      recallBtn.disabled = false; // 休息中也可按：立即回村滿血待機
    }
    if (autoBtn) {
      autoBtn.className = "btn sm" + (auto ? " gold" : "");
      autoBtn.innerHTML = "";
      autoBtn.appendChild(MG.ui.dom.icon("icon_repeat", 14));
      autoBtn.appendChild(document.createTextNode(auto ? " 自動續戰：開" : " 自動續戰：關"));
    }
    // potion buttons — live remaining time
    const now = Date.now();
    for (const key of ["potAtk", "potGold", "potExp"]) {
      const el = document.getElementById("pot-" + key);
      const btn = potEls[key];
      const until = st.buffs[key] || 0;
      if (until > now) {
        const sec = Math.ceil((until - now) / 1000);
        const mm = Math.floor(sec / 60), ss = sec % 60;
        if (el) { el.textContent = mm + ":" + (ss < 10 ? "0" : "") + ss; el.style.color = "var(--gold)"; }
        if (btn) btn.classList.add("on");
      } else {
        if (el) { el.textContent = "靈藥"; el.style.color = ""; }
        if (btn) btn.classList.remove("on");
      }
    }
    // empty-formation coach
    if (coachEl) coachEl.style.display = (!F.team || !F.team.length) ? "flex" : "none";
    // team strip — 固定顯示「編隊」格位（空格=編隊空位；派遣時疊加戰鬥狀態）
    if (teamEl) {
      teamEl.innerHTML = "";
      const slots = MG.sys.buildings.effects().formationSlots;
      for (let i = 0; i < slots; i++) {
        const fid = st.formation[i];
        const h = fid ? st.hunters.find(x => x.id === fid) : null;
        if (h) {
          const dispatched = (st.hunt.dispatchIds || []).includes(h.id);
          const bm = dispatched ? F.team.find(t => t.id === h.id) : null;
          const hpPct = bm ? Math.max(0, bm.hp / bm.maxHp * 100) : 100;
          const cell = MG.ui.dom.h("div", { style: { flex: 1, textAlign: "center" } },
            MG.ui.dom.icon(h.sprite || MG.data.hunters.classes[h.cls].icon, 20),
            MG.ui.dom.h("div", { class: "pbar red", style: { height: 5, marginTop: 2 } },
              MG.ui.dom.h("i", { style: { width: hpPct + "%" } })),
            MG.ui.dom.h("div", { style: { fontSize: 9, color: "var(--dim)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" } }, h.name));
          // skill cooldown ticks（僅派遣中顯示）
          const sk = bm && bm.skills && bm.skills[0];
          if (sk) {
            const cd = sk.cd || 1;
            const prog = bm.skillCd <= 0 ? 1 : Math.max(0, Math.min(1, 1 - bm.skillCd / cd));
            const ready = prog >= 1;
            cell.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 2, marginTop: 2, height: 3 } },
              [0, 1, 2, 3, 4].map(i => MG.ui.dom.h("i", {
                style: {
                  flex: 1, borderRadius: 1,
                  background: (i + 1) / 5 <= prog ? (ready ? "var(--gold)" : "#c792ea") : "rgba(255,255,255,0.13)"
                }
              }))));
            cell.appendChild(MG.ui.dom.h("div", { style: { fontSize: 8, color: ready ? "var(--gold)" : "var(--dim2)", marginTop: 1 } },
              ready ? "技能就緒" : "技能冷卻"));
          }
          teamEl.appendChild(cell);
        } else {
          teamEl.appendChild(MG.ui.dom.h("div", {
            style: { flex: 1, textAlign: "center", color: "var(--dim2)", fontSize: 10, cursor: "pointer", paddingTop: 2 },
            on: { click: () => MG.ui.screens.show("hunters") }
          }, "＋\n前往編隊"));
        }
      }
    }
    // log — keep last 8 with icons; kill lines alternate templates
    if (logEl) {
      const nw = Date.now();
      if (!lastLootTicker || nw - lastLootTicker > 30e3) {
        lastLootTicker = nw;
        MG.sys.game.log("累計戰利品：" + (st.stats.itemsLooted || 0) + " 件", "icon_chest");
      }
      const logs = st.log.slice(0, 8);
      logEl.innerHTML = "";
      logs.forEach((l, i) => {
        let msg = l.msg;
        const km = /^擊敗「(.+?)」/.exec(msg);
        if (km) {
          const tail = msg.slice(km[0].length);
          const tpls = ["一擊斃命！「" + km[1] + "」", "魔物「" + km[1] + "」倒下！", "擊敗「" + km[1] + "」"];
          msg = tpls[i % 3] + tail;
        }
        logEl.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 6, alignItems: "center", fontSize: 11, color: "var(--dim)", padding: "1px 0" } },
          l.icon ? MG.ui.dom.icon(l.icon, 12) : null, MG.ui.dom.h("span", null, msg)));
      });
    }
    // chips refresh
    refreshChips();
    if (farmEl) farmEl.style.display = (st.hunt.stage % 10 === 0 || (st.hunt.wipeStreak || 0) >= 1) ? "inline-flex" : "none";
  }
  function refreshChips() {
    if (!chipsEl) return;
    const st = S();
    chipsEl.innerHTML = "";
    REGIONS().forEach((r, i) => {
      const unlocked = st.kingdom.level >= r.unlockK;
      const isCur = st.hunt.region === i;
      chipsEl.appendChild(MG.ui.dom.h("div", {
        class: "chip" + (isCur ? " on" : ""),
        style: unlocked ? {} : { opacity: 0.55 },
        on: { click: () => selectRegion(i) }
      }, unlocked ? "" : MG.ui.dom.icon("icon_lock", 12), r.name + (isCur ? " Lv" + st.hunt.stage : "")));
    });
  }
  function selectRegion(i) {
    const st = S();
    const r = REGIONS()[i];
    if (st.kingdom.level < r.unlockK) { MG.ui.dom.toast("需要王國 Lv " + r.unlockK + " 才能前往「" + r.name + "」", "bad", "icon_lock"); return; }
    if (st.hunt.region === i) return;
    st.hunt.region = i; st.hunt.stage = Math.min(st.hunt.stage, 10);
    st.hunt.wipeStreak = 0;
    MG.sys.battle.reset();
    MG.core.audio.SFX.click();
    MG.ui.dom.toast("前往「" + r.name + "」", "", "icon_sword");
    // 首次手動踏入新獵場：解放慶祝（原自動推進的慶祝改在此）
    if (!st.quests.regionShown) st.quests.regionShown = {};
    if (!st.quests.regionShown[r.name]) {
      st.quests.regionShown[r.name] = true;
      showRegionClear(r);
    }
    refreshChips();
  }
  function farmBack() {
    const st = S();
    if (st.hunt.stage % 10 === 0 && st.hunt.stage > 1) {
      st.hunt.stage = st.hunt.stage - 1;
      MG.sys.battle.reset();
      MG.core.audio.SFX.click();
      MG.ui.dom.toast("已退至第 " + st.hunt.stage + " 關，累積戰力再挑戰首領！", "", "icon_sword");
      syncDom(MG.sys.battle.get());
    }
  }
  /* ---------- 派遣制：待機 → 派遣 → 戰鬥 → 死亡/召回回家休息 ---------- */
  function dispatchState() {
    const st = S();
    return { ids: st.hunt.dispatchIds || [], resting: (st.hunt.restUntil || 0) > Date.now() };
  }
  function selectDifficulty(i) {
    const st = S();
    if (st.hunt.difficulty === i) return;
    st.hunt.difficulty = i;
    st.hunt.pendingHp = undefined; // 換難度 = 新的首領戰
    MG.sys.battle.reset();
    MG.core.audio.SFX.click();
    const d = MG.config.DIFFICULTY[i];
    MG.ui.dom.toast("難度切換：「" + d.name + "」　魔物 ×" + d.mult + "・金幣 ×" + d.gold + "・經驗 ×" + d.exp, "", "icon_sword");
    syncDom(MG.sys.battle.get());
  }
  function dispatchNow() {
    const st = S();
    const ds = dispatchState();
    if (ds.ids.length) { MG.ui.dom.toast("隊伍已出征，先召回再重新派遣", "bad", "icon_sword"); return; }
    if (ds.resting) { MG.ui.dom.toast("全軍休息中，稍後再派遣", "bad", "icon_offline"); return; }
    // 直接派遣編隊（空格=編隊空位）
    const team = st.formation.filter(id => id && st.hunters.some(h => h.id === id));
    if (!team.length) { MG.ui.dom.toast("編隊還是空的 — 先到「獵人」分頁編入獵人", "bad", "icon_formation"); return; }
    st.hunt.dispatchIds = team;
    st.hunt.restUntil = 0;
    st.hunt.wipeStreak = 0; // 新一輪出征 = 連敗重新計算
    MG.sys.battle.reset();
    MG.core.audio.SFX.click();
    const region = REGIONS()[st.hunt.region];
    MG.ui.dom.toast("派遣 " + team.length + " 名獵人前往「" + region.name + "」第 " + st.hunt.stage + " 關！", "good", "icon_sword");
    syncDom(MG.sys.battle.get());
  }
  function recallNow() {
    const st = S();
    if (!(st.hunt.dispatchIds || []).length) return;
    // 即時切換回待機：滿血回村，無需確認（無損失操作）
    MG.sys.battle.recall();
    MG.ui.dom.toast("全軍已回村待機", "", "icon_offline");
    syncDom(MG.sys.battle.get());
  }
  function toggleAuto() {
    const st = S();
    st.hunt.autoDispatch = !st.hunt.autoDispatch;
    MG.core.audio.SFX.click();
    MG.ui.dom.toast(st.hunt.autoDispatch ? "自動續戰：休息完將自動再派遣編隊" : "自動續戰：關閉 — 休息完回待機", "", "icon_repeat");
    syncDom(MG.sys.battle.get());
  }
  function toggleSpeed() {
    const st = S();
    st.hunt.speed = st.hunt.speed === 1 ? 2 : st.hunt.speed === 2 ? 4 : 1;
    MG.core.audio.SFX.click();
    MG.ui.dom.toast(st.hunt.speed === 1 ? "戰鬥速度：一般" : "戰鬥速度：" + st.hunt.speed + " 倍（獵場加速）", "", "icon_speed");
    syncDom(MG.sys.battle.get());
  }
  /* ---------- 獵場情報 ---------- */
  function recPower(r) {
    // recommended team power to clear stage 10 (boss) of this region
    const dm = (MG.config.DIFFICULTY[(S().hunt.difficulty || 0)] || MG.config.DIFFICULTY[0]).mult;
    const b = r.boss;
    const bossMul = r.tier <= 2 ? 2.4 : r.tier <= 4 ? 3 : 4;
    const scale = 1 + 0.16 * 9;
    const hp = b.hp * scale * bossMul * dm;
    const atk = b.atk * scale * bossMul * dm;
    const v = (hp / 1.6 + atk * 6 + b.def * 2) / 2;
    return Math.max(60, Math.ceil(v / 50) * 50);
  }
  function teamPower() {
    const st = S();
    let p = 0;
    for (const id of st.formation) {
      const h = st.hunters.find(x => x.id === id);
      if (h) p += MG.sys.hunters.power(h);
    }
    return p;
  }
  function showRegionInfo(i) {
    const st = S();
    const r = REGIONS()[i];
    if (!r) return;
    const tp = teamPower(), rp = recPower(r);
    const adv = tp >= rp;
    const body = MG.ui.dom.h("div", { style: { fontSize: 13, lineHeight: 1.55 } },
      MG.ui.dom.h("div", { style: { color: "var(--dim)", marginBottom: 4 } }, r.desc),
      MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", background: "var(--panel2)", padding: "8px 10px", borderRadius: 8, margin: "8px 0 4px" } },
        MG.ui.dom.h("span", null, "建議戰力（第 10 關首領）"),
        MG.ui.dom.h("span", { style: { color: adv ? "#7ee787" : "#ffd166", fontWeight: 800 } }, MG.util.fmt(rp))),
      MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } },
        MG.ui.dom.h("span", { style: { color: "var(--dim)" } }, "目前隊伍戰力"),
        MG.ui.dom.h("span", { style: { color: adv ? "#7ee787" : "var(--r5)", fontWeight: 800 } },
          MG.util.fmt(tp) + (adv ? "　已達標" : "　稍嫌不足"))),
      MG.ui.dom.h("div", { style: { display: "flex", gap: 6, alignItems: "flex-start", color: "var(--gold)", marginBottom: 8, fontSize: 12 } },
        MG.ui.dom.icon("icon_goldbag", 16), MG.ui.dom.h("span", null, r.lootNote)),
      MG.ui.dom.h("div", { style: { display: "flex", gap: 8, alignItems: "flex-start", background: "var(--panel2)", padding: "8px 10px", borderRadius: 8, marginBottom: 8 } },
        MG.ui.dom.icon(r.boss.sprite, 26),
        MG.ui.dom.h("div", null,
          MG.ui.dom.h("div", { style: { fontWeight: 800, color: "var(--r5)" } },
            "首領：" + r.boss.name + (r.boss.flavor ? "　" + r.boss.flavor : "")),
          MG.ui.dom.h("div", { style: { color: "var(--dim)", fontSize: 12 } }, r.bossDesc))),
      MG.ui.dom.h("div", { style: { fontWeight: 800, margin: "4px 0", color: "var(--dim)" } }, "此地魔物"),
      ...r.monsters.map(m => MG.ui.dom.h("div", { style: { display: "flex", gap: 8, padding: "2px 0", alignItems: "flex-start" } },
        MG.ui.dom.icon(m.sprite, 16),
        MG.ui.dom.h("span", { style: { fontSize: 12 } },
          MG.ui.dom.h("b", null, m.name),
          MG.ui.dom.h("span", { style: { color: "var(--dim)" } }, "　" + (m.flavor || ""))))));
    MG.ui.dom.modal(r.name + "　獵場情報", body, { wide: true, icon: "icon_sword" });
  }
  const screen = {
    render(root) {
      root.innerHTML = "";
      // battle canvas
      const wrap = MG.ui.dom.h("div", { style: { position: "relative", margin: "10px", border: "2px solid var(--line)", borderRadius: 12, overflow: "hidden" } });
      canvas = document.createElement("canvas");
      // cap effective DPR at 1.5: sharp enough, avoids saturating small GPUs
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(480 * dpr); canvas.height = Math.round(270 * dpr);
      canvas.style.width = "100%"; canvas.style.display = "block";
      ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in 480x270 logical space
      wrap.appendChild(canvas);
      stageEl = MG.ui.dom.h("div", { style: { position: "absolute", top: 8, left: 10, right: 10, textAlign: "center" } });
      wrap.appendChild(stageEl);
      // empty-formation coach overlay
      coachEl = MG.ui.dom.h("div", { style: { position: "absolute", inset: 0, display: "none", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(10,12,24,0.82)", textAlign: "center", padding: "0 24px", zIndex: 3 } },
        MG.ui.dom.icon("icon_formation", 30),
        MG.ui.dom.h("div", { style: { color: "var(--text)", fontWeight: 800, fontSize: 14 } }, "狩獵隊尚未編入獵人"),
        MG.ui.dom.h("div", { style: { color: "var(--dim)", fontSize: 12, lineHeight: 1.6 } }, "編入獵人後按下「派遣」，編隊將前往獵場戰鬥。擊敗魔物換取金幣、素材與寶物；全軍倒下會自動回村休息。"),
        MG.ui.dom.h("button", { class: "btn gold", style: { marginTop: 4 }, on: { click: () => MG.ui.screens.show("hunters") } }, "前往「獵人」分頁編入獵人"));
      wrap.appendChild(coachEl);
      root.appendChild(wrap);
      // controls
      controlsEl = MG.ui.dom.h("div", { style: { padding: "0 10px" } });
      chipsEl = MG.ui.dom.h("div", { class: "list-scroll" });
      controlsEl.appendChild(chipsEl);
      const st = S();
      // 副本難度選擇
      const dRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" } });
      diffEls = [];
      MG.config.DIFFICULTY.forEach((d, i) => {
        const maxTier = Math.max(1, st.stats.maxTierReached || 1);
        const unlocked = maxTier > d.unlockRegion;
        const el = MG.ui.dom.h("div", {
          class: "chip" + ((st.hunt.difficulty || 0) === i ? " on" : ""),
          title: d.name + "（魔物 ×" + d.mult + "，金幣 ×" + d.gold + "，經驗 ×" + d.exp + "）" + (unlocked ? "" : "　抵達第 " + (d.unlockRegion + 1) + " 區域解鎖"),
          style: unlocked ? { borderColor: d.color, color: (st.hunt.difficulty || 0) === i ? "#3a2500" : d.color } : { opacity: 0.45 },
          on: { click: () => { if (!unlocked) { MG.ui.dom.toast("抵達第 " + (d.unlockRegion + 1) + " 區域後解鎖「" + d.name + "」", "bad", "icon_lock"); return; } selectDifficulty(i); } }
        }, unlocked ? d.name : MG.ui.dom.icon("icon_lock", 12) + " " + d.name);
        diffEls.push(el);
        dRow.appendChild(el);
      });
      controlsEl.appendChild(dRow);
      // 派遣狀態列
      statusEl = MG.ui.dom.h("div", { style: { marginTop: 8, fontSize: 12, fontWeight: 700 } });
      controlsEl.appendChild(statusEl);
      // 派遣 / 回村待機 / 自動續戰 / 速度
      const row = MG.ui.dom.h("div", { style: { display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" } },
        MG.ui.dom.h("button", { class: "btn sm gold", style: { flex: 1, minWidth: 90 }, on: { click: dispatchNow } },
          MG.ui.dom.icon("icon_sword", 14), " 派遣"),
        MG.ui.dom.h("button", { class: "btn sm green", style: { flex: 1, minWidth: 90, display: "none" }, on: { click: recallNow } },
          MG.ui.dom.icon("icon_offline", 13), " 回村待機"),
        MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1, minWidth: 100 }, on: { click: toggleAuto } },
          MG.ui.dom.icon("icon_repeat", 14), " 自動續戰"),
        MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1, minWidth: 78 }, on: { click: toggleSpeed } },
          MG.ui.dom.icon("icon_speed", 14), " " + (st.hunt.speed || 1) + "x"));
      dispatchBtn = row.children[0];
      recallBtn = row.children[1];
      autoBtn = row.children[2];
      speedBtn = row.children[3];
      controlsEl.appendChild(row);
      farmEl = MG.ui.dom.h("button", { class: "btn sm", style: { marginTop: 8, display: "none" }, on: { click: farmBack } },
        MG.ui.dom.icon("icon_offline", 13), "倒退一關（累積戰利品）");
      controlsEl.appendChild(farmEl);
      // potions quick
      const potRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 8, marginTop: 8 } });
      for (const [key, iconName, name] of [["potAtk", "icon_pot_atk", "攻擊"], ["potGold", "icon_pot_gold", "金幣"], ["potExp", "icon_pot_exp", "經驗"]]) {
        const btn = MG.ui.dom.h("button", {
          class: "chip", style: { flex: 1, justifyContent: "center" },
          on: { click: () => usePotion(key) }
        }, MG.ui.dom.icon(iconName, 14), MG.ui.dom.h("span", { id: "pot-" + key }, "靈藥"));
        potEls[key] = btn;
        potRow.appendChild(btn);
      }
      controlsEl.appendChild(potRow);
      root.appendChild(controlsEl);
      // team strip
      teamEl = MG.ui.dom.h("div", { style: { display: "flex", gap: 6, padding: "10px", margin: "8px 10px 0", background: "var(--panel)", border: "2px solid var(--line)", borderRadius: 10 } });
      root.appendChild(teamEl);
      // log
      logEl = MG.ui.dom.h("div", { style: { margin: "8px 10px 4px", padding: "8px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 8, minHeight: 40 } });
      root.appendChild(MG.ui.dom.h("div", { class: "section-h", style: { margin: "4px 10px 0" } },
        MG.ui.dom.h("span", { class: "t" }, "戰鬥紀錄")));
      root.appendChild(logEl);
      syncDom(MG.sys.battle.get());
    },
    refresh() { syncDom(MG.sys.battle.get()); },
    raf: render,
    onShow() { lastFrame = 0; }
  };
  function usePotion(key) {
    const st = S();
    const buf = st.buffs[key];
    if (buf && buf > Date.now()) { MG.ui.dom.toast("靈藥效果已啟動中", "", "icon_pot_atk"); return; }
    const label = key === "potAtk" ? "atk" : key === "potGold" ? "gold" : "exp";
    const item = st.inventory.items.find(i => i.defId === "item_pot_" + label);
    if (!item || !item.qty) { MG.ui.dom.toast("沒有靈藥，可在商店購買", "bad", "icon_pot_atk"); return; }
    item.qty--;
    if (item.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== item.uid);
    st.buffs[key] = Date.now() + 1800e3;
    MG.core.audio.SFX.potion();
    MG.ui.dom.toast((key === "potAtk" ? "攻擊" : key === "potGold" ? "金幣" : "經驗") + "靈藥已啟用（30 分鐘）", "good", "icon_pot_" + label);
  }
  MG.ui.screens.register("hunt", screen);
  return screen;
})();
