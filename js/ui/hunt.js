/* 放置王國 MEGA IDLE — hunt screen: live battle canvas + controls + loot log (slice B3 owns) */
"use strict";
MG.ui = MG.ui || {};
MG.ui.hunt = (function () {
  const S = () => MG.game.state;
  const REGIONS = () => MG.data.monsters.regions;
  let canvas, ctx, root, logEl, stageEl, controlsEl, chipsEl, teamEl, coachEl;
  let speedFab = null; // 圓形加速播放鈕（戰鬥畫面右下角）
  let infoFab = null; // 金色關卡情報按鈕（加速鈕左邊）
  let statusEl, dispatchBtn, recallBtn, advBtn, teamOverviewEl;
  let lastLogKey = ""; // 戰鬥紀錄簽名（效能：log 不變就不重建 DOM）
  let lastStageKey = ""; // 關卡標題簽名（效能：關卡沒變就不重建）
  let lastDispBtnKey = "", lastAdvBtnKey = ""; // 控制鈕簽名（效能：狀態沒變就不重建 innerHTML）
  
  const potEls = {};
  let lastFrame = 0, lastLootTicker = 0;
  const anim = {
    floats: [], particles: [], projectiles: [], goldFlash: 0, eventsCursor: 0, screenT: 0,
    lastMonsterId: null, entering: 0, bossHit: 0, bossFlash: 0, regionFlash: 0, extraShake: 0,
    monsterFlash: 0, death: null, wipeHinted: false, atkUntil: {}, castUntil: {}
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
    const now = anim.screenT;
    return team.map((h, i) => {
      const attacking = (anim.atkUntil[h.id] || 0) > now;
      const casting = (anim.castUntil[h.id] || 0) > now;
      const status = [];
      if (h.buffs && h.buffs.shield > 0) status.push("shield");          // 禦劍架式/護盾
      if (F.taunt && F.taunt.id === h.id) status.push("taunt");           // 嘲諷中
      if (h.skillCd <= 0 && h.skills && h.skills.length) status.push("ready"); // 技能就緒
      return {
        ...h, ...(TEAM_POS[i] || TEAM_POS[0]),
        flip: true, dead: h.hp <= 0, attack: attacking || casting, casting, status,
        seed: i * 1.7
      };
    });
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
    // 戰利品（v116 改版）：金幣直接從怪物位置飛向隨機英雄（不掉落、不往下），
    // 抵達後才跳資源數字（看起來英雄拿到才結算）
    const n = boss ? 11 : 6;
    for (let k = 0; k < n; k++) {
      const hero = TEAM_POS[Math.floor(Math.random() * 5)];
      anim.particles.push({
        kind: "loot", sprite: "fx_coin",
        x0: 320 + (Math.random() - 0.5) * 24, y0: 205 + (Math.random() - 0.5) * 10,
        x: 0, y: 0,
        tx: hero.x + 12 + (Math.random() - 0.5) * 20, ty: hero.y - 6 + (Math.random() - 0.5) * 12,
        phase: 0, drop: 0, dur: 0.85 + Math.random() * 0.35,
        scale: 1.2 + Math.random() * 0.6, t: anim.screenT
      });
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
          MG.ui.dom.h("div", { style: { fontWeight: 800, color: "var(--r5)" } }, "守關BOSS：" + r.boss.name),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, r.boss.flavor || r.bossDesc))),
      rewardRow,
      MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, on: { click: () => m.close() } }, "繼續前進"));
    const m = MG.ui.dom.modal("區域解放！", body, { wide: true, icon: "icon_honor" });
  }
  /* BOSS討伐慶祝：輕量全屏覆蓋，2 秒自動消失或點擊關閉 */
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
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 20, color: "var(--gold)", margin: "4px 0 2px", textShadow: "0 2px 0 rgba(0,0,0,.5)" } }, "BOSS討伐！"),
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
          anim.atkUntil[e.hunter] = anim.screenT + 0.4; // 英雄攻擊動作（0.4s 更明顯）
          spawnFloat(hx, hy - 26, "-" + MG.util.fmt(e.dmg), "#ffd166", e.type === "crit"); // 英雄出手傷害
          if (e.cls !== "archer" && e.cls !== "mage") {
            spawnParticle("fx_slash", hx + 14, hy - 4, { life: 0.3, scale: 1.4, gravity: 0 }); // 近戰英雄揮砍光
          }
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
          anim.castUntil[e.hunter] = anim.screenT + 0.5; // 英雄施法動作（0.5s 更明顯）
          spawnParticle(fx, hx, hy - 8, { life: 0.45, scale: 1.6, gravity: 0 }); // 英雄身上施法光
          spawnFloat(hx, hy - 34, "-" + MG.util.fmt(e.dmg), "#c792ea", true); // 技能傷害在英雄側也跳數字
          spawnFloat(320, 200, "-" + MG.util.fmt(e.dmg), "#c792ea", true); // 怪物側同步
          if (e.dmg > 0) {
            anim.monsterFlash = 0.07;
            spawnFloat(320, 200, "-" + MG.util.fmt(e.dmg), "#c792ea", true);
            if (F.m && F.m.boss) bossImpact(0.22, 0.07, 0.25);
          }
          spawnParticle(fx, 310, 205, { life: 0.45, scale: 1.6, gravity: 0 });
          MG.core.audio.SFX.skill();
          break;
        }
        case "down":
          // v149/v151：角色陣亡大字（紅）＋全局通知（不在副本頁也看得到）
          spawnFloat(hx, hy - 44, "☠ " + e.name + " 陣亡", "#ff5c8a", true);
          spawnParticle("fx_boom", hx, hy - 10, { life: 0.5, scale: 1.3 });
          MG.sys.game.log("☠ " + e.name + " 陣亡！", "icon_skull"); // 補發/背景時自動靜音
          if (!MG.sys.game.isSilent()) MG.ui.dom.toast("☠ " + e.name + " 陣亡！", "bad", "icon_skull");
          break;
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
          // 戰利品結算視覺（v116 改版）：金幣飛向英雄期間不跳動頂部資源數字，
          // 抵達後才在英雄頭頂跳出 +金/+經驗 並觸發頂欄數字跳動（看起來英雄拿到才結算）
          const hp = TEAM_POS[Math.min(e.boss ? 4 : Math.floor(Math.random() * 5), 4)];
          const g = e.gold || 0, xp = e.exp || 0;
          if (g > 0 || xp > 0) {
            setTimeout(() => {
              if (g > 0) spawnFloat(hp.x + 20, hp.y - 42, "+" + MG.util.fmt(g) + " 金", "#ffd166", true);
              if (xp > 0) spawnFloat(hp.x + 20, hp.y - 27, "+" + MG.util.fmt(xp) + " 經驗", "#7ee787", false);
              MG.ui.screens.bumpCurrency && MG.ui.screens.bumpCurrency("gold");
            }, 1350);
          }
          break;
        }
        case "elite":
          spawnFloat(320, 150, "精英怪出現！", "#c792ea", true);
          MG.core.audio.SFX && MG.core.audio.SFX.skill && MG.core.audio.SFX.skill();
          bossImpact(0.15, 0.03, 0.2);
          break;
        case "boss":
          spawnParticle("fx_boom", 320, 200, { life: 0.7, scale: 2.2 });
          spawnFloat(320, 150, "BOSS來襲！", "#ff5c8a", true);
          bossImpact(0.45, 0, 0.8);
          break;
        case "region":
          MG.sys.game.log("區域解放！「" + e.name + "」的大門已開啟，前進新地圖！", "icon_honor");
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
          MG.sys.game.log("BOSS討伐完成！敵人重新集結，準備再戰。", "icon_skull");
          break;
        case "regionunlock":
          // BOSS第一次擊敗才通知「下一區域已解鎖」（重複討伐不再提示）
          if (e.firstClear) {
            MG.sys.game.log("已征服「" + REGIONS()[S().hunt.region].name + "」！「" + e.name + "」已解鎖，隨時可切換地圖。", "icon_sword");
            MG.ui.dom.toast("已解鎖「" + e.name + "」！點擊上方地圖名稱即可前往", "good", "icon_sword");
          }
          break;
        case "retreat":
          spawnFloat(240, 140, "☠ 全軍陣亡！回村休息中…", "#ff5c8a", true);
          if (e.wipes >= 2 && !anim.wipeHinted) {
            anim.wipeHinted = true;
            MG.ui.dom.toast("戰力不足？強化英雄裝備，或切到前面關卡累積戰利品！", "", "icon_sword");
          }
          if (e.fallback) {
            MG.ui.dom.toast(e.fallback.type === "stage"
              ? "連敗三場，已自動退至" + MG.config.stageLabel(e.fallback.stage) + "累積戰力！"
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
    spawnFloat(320, 185, boss ? "BOSS討伐！" : "擊敗！", "#ffd166", true);
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
      if (p.kind === "loot") {
        // 戰利品：直接飛向英雄（easeInOutQuad），抵達消失
        p.phase += dt;
        p.total = p.dur;
        if (p.phase >= p.total) { anim.particles.splice(i, 1); continue; }
        const e = p.phase < p.total / 2 ? 2 * Math.pow(p.phase / p.total, 2) : 1 - Math.pow(-2 * (p.phase / p.total) + 2, 2) / 2;
        p.x = p.x0 + (p.tx - p.x0) * e;
        p.y = p.y0 + (p.ty - p.y0) * e;
        p.scale = 1.2 * (1 - 0.4 * (p.phase / p.total)); // 抵達前縮小
        continue;
      }
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
    const region = REGIONS()[Math.min(st.hunt.region || 0, REGIONS().length - 1)];
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
  let lastTeamOvKey = ""; // 隊伍總覽簽名（v130）
  let lastTeamSig = ""; // 編隊列簽名（效能：待機時不變就不重建）
  function buildTeamStrip(st, F) {
    if (!teamEl) return;
    teamEl.innerHTML = "";
    const slots = MG.sys.buildings.effects().formationSlots;
    for (let i = 0; i < slots; i++) {
      const fid = st.formation[i];
      const h = fid ? st.hunters.find(x => x.id === fid) : null;
      if (h) {
        const dispatched = (st.hunt.dispatchIds || []).includes(h.id);
        const bm = dispatched ? F.team.find(t => t.id === h.id) : null;
        const maxHp = Math.max(1, Math.round(MG.sys.hunters.effectiveStats(h).hp));
        const curHp = bm ? bm.hp : (h.hp === undefined ? maxHp : Math.max(0, Math.min(h.hp, maxHp)));
        const hpPct = Math.max(0, curHp / maxHp * 100);
        const maxMp = Math.max(1, Math.round(MG.sys.hunters.effectiveStats(h).mp));
        const curMp = bm ? bm.mp : (h.mp === undefined ? maxMp : Math.max(0, Math.min(h.mp, maxMp)));
        const mpPct = Math.max(0, curMp / maxMp * 100);
        const cell = MG.ui.dom.h("div", { style: { flex: 1, textAlign: "center" } },
          MG.ui.dom.icon(h.sprite || MG.data.hunters.classes[h.cls].icon, 20),
          MG.ui.dom.h("div", { class: "pbar red", style: { height: 5, marginTop: 2 } },
            MG.ui.dom.h("i", { style: { width: hpPct + "%" } })),
          MG.ui.dom.h("div", { class: "pbar blue", style: { height: 3, marginTop: 1 } },
            MG.ui.dom.h("i", { style: { width: mpPct + "%" } })),
          MG.ui.dom.h("div", { style: { fontSize: 9, color: "var(--dim)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" } }, h.name),
          MG.ui.dom.h("div", { style: { fontSize: 9, fontWeight: 800, color: "var(--gold)", marginTop: 1 } }, "戰力 " + MG.util.fmt(MG.sys.hunters.power(h))));
        // skill cooldown ticks（僅派遣中顯示）
        const sk = bm && bm.skills && bm.skills[0];
        if (sk) {
          const cd = sk.cd || 1;
          const prog = bm.skillCd <= 0 ? 1 : Math.max(0, Math.min(1, 1 - bm.skillCd / cd));
          const ready = prog >= 1;
          // v120：技能就緒但魔力不足 → 顯示「魔力不足」
          const noMp = ready && bm.mp < (sk.mp || 0);
          cell.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 2, marginTop: 2, height: 3 } },
            [0, 1, 2, 3, 4].map(i => MG.ui.dom.h("i", {
              style: {
                flex: 1, borderRadius: 1,
                background: (i + 1) / 5 <= prog ? (ready ? (noMp ? "var(--bad)" : "var(--gold)") : "#c792ea") : "rgba(255,255,255,0.13)"
              }
            }))));
          cell.appendChild(MG.ui.dom.h("div", { style: { fontSize: 8, color: noMp ? "var(--bad)" : (ready ? "var(--gold)" : "var(--dim2)"), marginTop: 1 } },
            noMp ? "魔力不足" : ready ? "技能就緒" : "技能冷卻"));
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
  /* ---------- 城內場景：英雄回城休息 / 待機 ---------- */
  function drawTownScene(view, restLeft) {    const W = 480, H = 270;
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
    const region = REGIONS()[Math.min(st.hunt.region || 0, REGIONS().length - 1)];
    // stage header — tap region name for 地圖情報
    if (stageEl) {
      // 效能：區域/關卡沒變就不重建（每 250ms 全量重建 header 是浪費）
      const bossStage = st.hunt.stage % 10 === 0;
      const stageKey = st.hunt.region + ":" + st.hunt.stage + ":" + bossStage;
      if (stageKey !== lastStageKey) {
        lastStageKey = stageKey;
        stageEl.innerHTML = "";
        stageEl.appendChild(MG.ui.dom.h("div", { class: "hunt-stage-h", style: { cursor: "pointer" }, on: { click: () => showRegionInfo(st.hunt.region) } },
          region.name,
          MG.ui.dom.h("span", { style: { color: bossStage ? "var(--r5)" : "var(--gold)" } }, " " + MG.config.stageLabel(st.hunt.stage))));
        stageEl.appendChild(MG.ui.dom.h("div", { class: "pbar", style: { marginTop: 4 } },
          MG.ui.dom.h("i", { style: { width: ((st.hunt.stage % 10) / 10 * 100) + "%" } })));
      }
    }
    // 圓形加速播放鈕：幾種速度幾種顯示（▶ / ▶▶ / ⏩）
    if (speedFab) {
      const s = st.hunt.speed || 1;
      speedFab.textContent = s === 1 ? "▶" : s === 2 ? "▶▶" : "⏩";
      speedFab.style.background = s > 1 ? "rgba(255,209,102,0.92)" : "rgba(10,12,24,0.78)";
      speedFab.style.color = s > 1 ? "#3a2500" : "var(--gold)";
      speedFab.title = s === 1 ? "戰鬥速度 1x（點擊加速）" : s === 2 ? "戰鬥速度 2x" : "戰鬥速度 4x";
    }
    // 派遣狀態列 + 按鈕狀態
    const ds = dispatchState();
    // 隊伍總覽（v130）：顯示各隊人數/戰力/鎖定；點卡切換編輯中的隊
    if (teamOverviewEl) {
      const max = MG.sys.hunters.teamsUnlocked();
      const key = max + ":" + (st.activeTeam || 0) + ":" + st.hunters.map(h => h.id + ":" + h.level).join(",");
      if (key !== lastTeamOvKey) {
        lastTeamOvKey = key;
        teamOverviewEl.innerHTML = "";
        for (let n = 0; n < 5; n++) {
          const unlocked = n < max;
          const info = MG.sys.hunters.teamInfo(n);
          teamOverviewEl.appendChild(MG.ui.dom.h("div", {
            style: { flex: "0 0 auto", minWidth: 84, border: "2px solid " + ((st.activeTeam || 0) === n ? "var(--gold2)" : "var(--line)"), borderRadius: 10, background: "var(--panel2)", padding: "4px 8px", textAlign: "center", cursor: unlocked ? "pointer" : "default", opacity: unlocked ? 1 : 0.55 },
            on: unlocked ? { click: () => { MG.sys.hunters.setActiveTeam(n); syncDom(MG.sys.battle.get()); } } : {}
          },
            MG.ui.dom.h("div", { style: { fontSize: 10, fontWeight: 900 } }, unlocked ? "第 " + (n + 1) + " 隊" : "🔒 第 " + (n + 1) + " 隊"),
            MG.ui.dom.h("div", { style: { fontSize: 9, color: "var(--dim)" } }, unlocked ? info.members + "/" + info.slots + " 人 ・ 戰力 " + MG.util.fmt(info.power) : "酒館 Lv" + (n * 2) + " 解鎖")));
        }
      }
    }
    const formationCount = st.formation.filter(id => id && st.hunters.some(h => h.id === id)).length;
    if (statusEl) {
      let txt = "⏳ 待機中 — 按下「派遣」率領編隊出征";
      if (ds.resting) {
        const sec = Math.max(0, Math.ceil(((st.hunt.restUntil || 0) - Date.now()) / 1000));
        txt = "💤 全軍回村修整中 " + sec + " 秒 — 修整完畢待機";
      } else if (ds.ids.length) {
        const bossStage = st.hunt.stage % MG.config.MAX_STAGE_PER_REGION === 0;
        const dName = MG.config.DIFFICULTY[(st.hunt.difficulty || 0)].name;
        txt = "⚔ 派遣中：" + ds.ids.length + " 名英雄 · " + MG.config.stageLabel(st.hunt.stage) + (dName !== "普通" ? " · " + dName : "");
      }
      statusEl.textContent = txt;
      statusEl.style.color = ds.ids.length && !ds.resting ? "var(--good)" : "var(--dim)";
    }

    if (dispatchBtn) {
      dispatchBtn.disabled = ds.ids.length > 0 || ds.resting || formationCount === 0;
      const btnKey = "d:" + (ds.ids.length > 0) + ":" + ds.resting + ":" + formationCount;
      if (btnKey !== lastDispBtnKey) {
        lastDispBtnKey = btnKey;
        dispatchBtn.innerHTML = "";
        dispatchBtn.appendChild(document.createTextNode("派遣" + (formationCount ? " " + formationCount + " 人" : "")));
      }
    }
    if (recallBtn) {
      recallBtn.style.display = ds.ids.length ? "inline-flex" : "none";
      recallBtn.disabled = false; // 休息中也可按：立即回村滿血待機
    }
    if (advBtn) {
      const adv = st.hunt.autoAdvance !== false;
      advBtn.className = "btn sm" + (adv ? " gold" : "");
      const advKey = "v:" + adv;
      if (advKey !== lastAdvBtnKey) {
        lastAdvBtnKey = advKey;
        advBtn.textContent = "自動進關";
        advBtn.className = "btn sm " + (adv ? "green" : "blue");
      }
    }
    // potion buttons — live remaining time + 倉庫數量
    const potQty = defId => st.inventory.items.filter(i => i.defId === defId)
      .reduce((a, i) => a + (i.qty === undefined ? 1 : i.qty), 0);
    const now = Date.now();
    for (const [key, defId, name] of [["potAtk", "item_pot_atk", "攻擊靈藥"], ["potGold", "item_pot_gold", "金幣靈藥"], ["potExp", "item_pot_exp", "經驗靈藥"], ["potBoost", "item_hourglass", "加速沙漏"]]) {
      const el = document.getElementById("pot-" + key);
      const btn = potEls[key];
      const q = potQty(defId);
      const until = (key === "potBoost" ? st.buffs.boostUntil : st.buffs[key]) || 0;
      if (until > now) {
        const sec = Math.ceil((until - now) / 1000);
        let label;
        if (sec >= 6 * 3600) label = Math.floor(sec / 3600) + " 小時"; // 長時間（大量疊加）用小時制避免爆版
        else { const mm = Math.floor(sec / 60), ss = sec % 60; label = mm + ":" + (ss < 10 ? "0" : "") + ss; }
        if (el) { el.textContent = name + " " + label + " x" + q; el.style.color = ""; } // 深色文字（配合 .chip.on 金底）
        if (btn) btn.classList.add("on");
      } else {
        if (el) { el.textContent = name + " x" + q; el.style.color = ""; }
        if (btn) btn.classList.remove("on");
      }
    }
    // 生命/魔力藥水數量
    const hpEl = document.getElementById("pot-hp");
    if (hpEl) hpEl.textContent = "補血 x" + potQty("item_pot_hp");
    const mpEl = document.getElementById("pot-mp");
    if (mpEl) mpEl.textContent = "補魔 x" + potQty("item_pot_mp");
    // empty-formation coach
    if (coachEl) coachEl.style.display = (!F.team || !F.team.length) ? "flex" : "none";
    // team strip — 固定顯示「編隊」格位（空格=編隊空位；派遣時疊加戰鬥狀態）
    if (teamEl) {
      // 效能：待機/休息中編隊列不會變（無 HP 跳動）→ 簽名相同就跳過重建；
      // 派遣中 HP 每 tick 變 → 維持 4Hz 重建（即時血條是戰鬥回饋核心）
      const fighting = !!(F.team && F.team.length);
      if (!fighting) {
        const teamSig = st.formation.join(",") + "|" + st.hunters.length + "|" + st.hunters.map(h => MG.sys.hunters.power(h)).join(",");
        if (teamSig !== lastTeamSig) {
          lastTeamSig = teamSig;
          buildTeamStrip(st, F);
        }
      } else {
        buildTeamStrip(st, F);
      }
    }
    // log — keep last 8 with icons; kill lines alternate templates
    if (logEl) {
      const nw = Date.now();
      if (!lastLootTicker || nw - lastLootTicker > 30e3) {
        lastLootTicker = nw;
        MG.sys.game.log("累計戰利品：" + (st.stats.itemsLooted || 0) + " 件", "icon_chest");
      }
      // 效能：log 只在新增/數量變化時重建（否則每 250ms 全量重建 8 條）
      const logs = st.log.slice(0, 8);
      const logKey = logs.map(l => l.msg).join("\u0001");
      if (logKey !== lastLogKey) {
        lastLogKey = logKey;
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
    }
    // chips refresh
    refreshChips();
  }
  // 效能：區域列只在「當前區域/解鎖進度」變化時重建（每 250ms 全重建 10 chips 是浪費）
  let chipsSig = "";
  function refreshChips() {
    if (!chipsEl) return;
    const st = S();
    const sig = st.hunt.region + ":" + (st.stats.maxRegionReached || 0) + ":" + st.hunt.stage;
    if (sig === chipsSig) return;
    chipsSig = sig;
    chipsEl.innerHTML = "";
    REGIONS().forEach((r, i) => {
      const unlocked = i <= (st.stats.maxRegionReached || 0);
      const isCur = st.hunt.region === i;
      chipsEl.appendChild(MG.ui.dom.h("div", {
        class: "chip" + (isCur ? " on" : ""),
        style: unlocked ? {} : { opacity: 0.55 },
        on: { click: () => selectRegion(i) }
      }, unlocked ? "" : MG.ui.dom.icon("icon_lock", 12),
        MG.ui.dom.icon((r.monsters[0] || {}).sprite || "icon_sword", 14),
        r.name + (isCur ? " Lv" + st.hunt.stage : "")));
    });
  }
  function selectRegion(i) {
    const st = S();
    const r = REGIONS()[i];
    if (i > (st.stats.maxRegionReached || 0)) { MG.ui.dom.toast("尚未抵達「" + r.name + "」（攻略前一區域的BOSS後解鎖）", "bad", "icon_lock"); return; }
    if (st.hunt.region === i) return;
    // 必須等當前戰鬥結束才能切換地圖（英雄生命是持續性的，切換不會補血）
    const F = MG.sys.battle.get();
    if (F.phase === "fight") { MG.ui.dom.toast("戰鬥進行中！等當前戰鬥結束後再切換地圖", "bad", "icon_sword"); return; }
    st.hunt.region = i; st.hunt.stage = Math.min(st.hunt.stage, 10);
    st.hunt.wipeStreak = 0;
    MG.sys.battle.reset();
    MG.core.audio.SFX.click();
    MG.ui.dom.toast("前往「" + r.name + "」", "", "icon_sword");
    // 首次手動踏入新地圖：解放慶祝（原自動推進的慶祝改在此）
    if (!st.quests.regionShown) st.quests.regionShown = {};
    if (!st.quests.regionShown[r.name]) {
      st.quests.regionShown[r.name] = true;
      showRegionClear(r);
    }
    refreshChips();
  }
  /* ---------- 派遣制：待機 → 派遣 → 戰鬥 → 死亡/召回回家休息 ---------- */
  function dispatchState() {
    const st = S();
    return { ids: st.hunt.dispatchIds || [], resting: (st.hunt.restUntil || 0) > Date.now() };
  }
  function selectDifficulty(i) {
    const st = S();
    if (st.hunt.difficulty === i) return;
    const F = MG.sys.battle.get();
    if (F.phase === "fight") { MG.ui.dom.toast("戰鬥進行中！等當前戰鬥結束後再切換難度", "bad", "icon_sword"); return; }
    st.hunt.difficulty = i;
    st.hunt.pendingHp = undefined; // 換難度 = 新的BOSS戰
    MG.sys.battle.reset();
    MG.core.audio.SFX.click();
    const d = MG.config.DIFFICULTY[i];
    MG.ui.dom.toast("難度切換：「" + d.name + "」　魔物 ×" + d.mult + "・金幣 ×" + d.gold + "・經驗 ×" + d.exp, "", "icon_sword");
    syncDom(MG.sys.battle.get());
  }
  // 自由選擇關卡：可跳去任何已推進到的關卡龜著練角（BOSS 關 B 也可原地重複討伐）
  function selectStage(n) {
    const st = S();
    if (st.hunt.stage === n) return;
    const F = MG.sys.battle.get();
    if (F.phase === "fight") { MG.ui.dom.toast("戰鬥進行中！等當前戰鬥結束後再切換關卡", "bad", "icon_sword"); return; }
    if ((st.stats.maxStage || 1) < n) { MG.ui.dom.toast("尚未推進到此關（目前最高第 " + (st.stats.maxStage || 1) + " 關）", "bad", "icon_lock"); return; }
    st.hunt.stage = n;
    st.hunt.wipeStreak = 0;
    MG.sys.battle.reset();
    MG.core.audio.SFX.click();
    MG.ui.dom.toast(n === 10 ? "前往「" + REGIONS()[Math.min(st.hunt.region || 0, REGIONS().length - 1)].name + "」BOSS 關，原地重複討伐！" : "駐紮" + MG.config.stageLabel(n) + "練角", "", "icon_sword");
    syncDom(MG.sys.battle.get());
  }
  function dispatchNow() {
    const st = S();
    const ds = dispatchState();
    if (ds.ids.length) { MG.ui.dom.toast("隊伍已出征，先召回再重新派遣", "bad", "icon_sword"); return; }
    if (ds.resting) { MG.ui.dom.toast("全軍休息中，稍後再派遣", "bad", "icon_offline"); return; }
    // 直接派遣編隊（空格=編隊空位）
    const team = st.formation.filter(id => id && st.hunters.some(h => h.id === id));
    if (!team.length) { MG.ui.dom.toast("編隊還是空的 — 先到「英雄」分頁編入英雄", "bad", "icon_formation"); return; }
    openDispatchDialog(team);
  }
  /* 派遣視窗（v119）：在裡面確認/選擇目的地（區域・難度・關卡），再派遣 */
  function openDispatchDialog(team) {
    const st = S();
    const m = MG.ui.dom.modal("派遣目的地", null, { icon: "icon_sword" });
    const body = m.panel;
    const ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ"];
    function renderD() {
      body.innerHTML = "";
      try {
        renderDContent();
      } catch (e) {
        // v148：渲染防護——任何錯誤都以可見訊息顯示（避免「標題有、內容空」）
        body.appendChild(MG.ui.dom.h("div", { style: { color: "#ff7a7a", fontSize: 12, padding: "10px", textAlign: "center" } },
          "派遣視窗載入失敗：" + (e && e.message ? e.message : String(e)) + "\n請將此訊息回報，或先重新整理遊戲"));
      }
    }
    function renderDContent() {
      const rr = REGIONS();
      const r = (rr && rr[st.hunt.region]) || (rr && rr[0]) || { name: "未知區域" };
      const d = MG.config.DIFFICULTY[st.hunt.difficulty || 0] || MG.config.DIFFICULTY[0];
      body.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 8 } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 17 } }, "前往「" + r.name + "」"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } },
          d.name + "難度 ・ " + MG.config.stageLabel(st.hunt.stage) + " ・ 出戰 " + team.length + " 名英雄")));
      // 關卡情報（先看情報再選擇）
      body.appendChild(MG.ui.dom.h("button", {
        class: "btn sm blue", style: { width: "100%", marginBottom: 8 },
        on: { click: () => showRegionInfo(st.hunt.region) }
      }, "查看關卡情報（戰利品・掉落率・BOSS）"));
      // 選擇要派遣的隊伍（v130）
      const max = MG.sys.hunters.teamsUnlocked();
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 4 } }, "選擇派遣隊伍："));
      const teamPick = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 } });
      for (let n = 0; n < 5; n++) {
        const unlocked = n < max;
        const info = MG.sys.hunters.teamInfo(n);
        teamPick.appendChild(MG.ui.dom.h("div", {
          class: "chip" + ((st.activeTeam || 0) === n ? " on" : ""),
          style: unlocked ? {} : { opacity: 0.55 },
          on: { click: () => { if (!unlocked) return; MG.sys.hunters.setActiveTeam(n); renderD(); } }
        }, unlocked ? "第 " + (n + 1) + " 隊 " + info.members + " 人 ・ 戰力 " + MG.util.fmt(info.power) : "🔒 第 " + (n + 1) + " 隊（酒館 Lv" + (n * 2) + "）"));
      }
      body.appendChild(teamPick);
      // 三欄垂直捲動（v123）：左＝章節（區域）、中＝小關、右＝難度
      const colHead = (t) => MG.ui.dom.h("div", { style: { fontSize: 11, fontWeight: 800, color: "var(--dim)", textAlign: "center", marginBottom: 2 } }, t);
      const colStyle = { overflowY: "auto", maxHeight: 224, display: "flex", flexDirection: "column", gap: 4, paddingRight: 1, scrollbarWidth: "thin" };
      const colBtn = (active, locked, onClick, kids) => MG.ui.dom.h("div", {
        class: "chip" + (active ? " on" : ""),
        style: Object.assign({ width: "100%", justifyContent: "flex-start", padding: "5px 7px", minHeight: 34, fontSize: 15, flex: "0 0 auto" }, locked ? { opacity: 0.5 } : {}),
        on: { click: onClick }
      }, ...kids);
      const grid = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 } });
      // 左：章節（區域）
      const colR = MG.ui.dom.h("div", { style: colStyle },
        colHead("章節"),
        REGIONS().map((rr, i) => colBtn(st.hunt.region === i, i > (st.stats.maxRegionReached || 0),
          () => { if (i > (st.stats.maxRegionReached || 0)) return; st.hunt.region = i; st.hunt.wipeStreak = 0; MG.sys.battle.reset(); renderD(); },
          [MG.ui.dom.icon((rr.monsters[0] || {}).sprite || "icon_sword", 15), MG.ui.dom.h("span", { style: { fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, rr.name)])));
      // 中：小關（1-9 + BOSS）
      const colS = MG.ui.dom.h("div", { style: colStyle },
        colHead("小關"),
        Array.from({ length: MG.config.MAX_STAGE_PER_REGION }, (_, k) => k + 1).map(n => colBtn(st.hunt.stage === n, (st.stats.maxStage || 1) < n,
          () => { if ((st.stats.maxStage || 1) < n) return; st.hunt.stage = n; st.hunt.wipeStreak = 0; MG.sys.battle.reset(); renderD(); },
          [MG.ui.dom.h("span", { style: { fontSize: 15, fontWeight: 900, lineHeight: 1.1, minWidth: 22, textAlign: "center" } }, n === 10 ? "☠" : String(n)), MG.ui.dom.h("span", { style: { fontSize: 15 } }, n === 10 ? "BOSS" : "關")])));
      // 右：難度（羅馬數字）
      const colD = MG.ui.dom.h("div", { style: colStyle },
        colHead("難度"),
        MG.config.DIFFICULTY.map((dd, i) => colBtn((st.hunt.difficulty || 0) === i, (st.stats.maxRegionReached || 0) < dd.unlockRegion,
          () => { if ((st.stats.maxRegionReached || 0) < dd.unlockRegion) return; st.hunt.difficulty = i; st.hunt.pendingHp = undefined; MG.sys.battle.reset(); renderD(); },
          [MG.ui.dom.h("span", { style: { fontSize: 15, fontWeight: 900, lineHeight: 1.1, minWidth: 20, textAlign: "center" } }, ROMAN[i]), MG.ui.dom.h("span", { style: { fontSize: 15 } }, dd.name)])));
      grid.appendChild(colR);
      grid.appendChild(colS);
      grid.appendChild(colD);
      body.appendChild(grid);
      // 戰利品預覽
      const pm = MG.sys.loot.scaledMonster(st.hunt.region, st.hunt.stage);
      body.appendChild(MG.ui.dom.h("div", { class: "panel2", style: { padding: "6px 10px", marginBottom: 10, display: "flex", justifyContent: "space-between", fontSize: 12 } },
        MG.ui.dom.h("span", { style: { color: "var(--gold)", fontWeight: 800 } }, "金幣 +" + MG.util.fmt(pm.gold)),
        MG.ui.dom.h("span", { style: { color: "#7ee787", fontWeight: 800 } }, "經驗 +" + MG.util.fmt(pm.exp))));
      // 派遣
      body.appendChild(MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, on: { click: () => { m.close(); doDispatch(team); } } },
        "派遣出征"));
      body.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "取消"));
    }
    renderD();
  }
  function doDispatch(team) {
    const st = S();
    // v130：以派遣視窗最後選中的隊伍為準（視窗內切隊後重讀）
    const cur = (st.formations && st.formations[st.activeTeam || 0]) || st.formation;
    const t = cur.filter(id => id && st.hunters.some(h => h.id === id));
    st.hunt.dispatchIds = t.length ? t : team;
    st.hunt.restUntil = 0;
    st.hunt.wipeStreak = 0; // 新一輪出征 = 連敗重新計算
    MG.sys.battle.reset();
    MG.core.audio.SFX.click();
    const region = REGIONS()[Math.min(st.hunt.region || 0, REGIONS().length - 1)];
    MG.ui.dom.toast("派遣 " + team.length + " 名英雄前往「" + region.name + "」" + MG.config.stageLabel(st.hunt.stage) + "！", "good", "icon_sword");
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

  // 自動進關開關：關閉時擊敗魔物後原地重複討伐當前關卡（龜著練角）
  function toggleAutoAdvance() {
    const st = S();
    st.hunt.autoAdvance = st.hunt.autoAdvance !== false ? false : true;
    MG.core.audio.SFX.click();
    MG.ui.dom.toast(st.hunt.autoAdvance === false
      ? "自動進關：關閉 — 擊敗魔物後原地重複討伐當前關卡"
      : "自動進關：開啟 — 擊敗魔物後自動前往下一關", "", "icon_speed");
    syncDom(MG.sys.battle.get());
  }
  function toggleSpeed() {
    const st = S();
    st.hunt.speed = st.hunt.speed === 1 ? 2 : st.hunt.speed === 2 ? 4 : 1;
    MG.core.audio.SFX.click();
    MG.ui.dom.toast(st.hunt.speed === 1 ? "戰鬥速度：一般" : "戰鬥速度：" + st.hunt.speed + " 倍（地圖加速）", "", "icon_speed");
    syncDom(MG.sys.battle.get());
  }
  /* ---------- 地圖情報 ---------- */
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
  // 戰利品資訊（目前關卡）：金幣/經驗/素材/藥水/裝備/寶石等掉落率
  function lootInfoBlock(regionIdx) {
    const st = S();
    const m = MG.sys.loot.scaledMonster(regionIdx, st.hunt.stage);
    const d = MG.config.DIFFICULTY[st.hunt.difficulty || 0] || MG.config.DIFFICULTY[0];
    const potRate = m.boss ? Math.min(1, 0.6 + regionIdx * 0.04) : Math.min(0.2, 0.06 + regionIdx * 0.015);
    const rows = [
      m.boss ? null : MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", color: "#c792ea", fontSize: 11 } },
        MG.ui.dom.h("span", null, "精英怪（★4-5）機率"),
        MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "22%・金幣/經驗 ×5-6・掉落 ×3-4")),
      MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between" } },
        MG.ui.dom.h("span", null, "金幣"),
        MG.ui.dom.h("span", { style: { fontWeight: 800, color: "var(--gold)" } }, "+" + MG.util.fmt(m.gold))),
      MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between" } },
        MG.ui.dom.h("span", null, "經驗"),
        MG.ui.dom.h("span", { style: { fontWeight: 800, color: "#7ee787" } }, "+" + MG.util.fmt(m.exp)))
    ];
    for (const drop of m.drops || []) {
      const md = MG.config.MATS[drop.m];
      rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between" } },
        MG.ui.dom.h("span", null, "素材：" + (md ? md.name : drop.m)),
        MG.ui.dom.h("span", { style: { fontWeight: 800 } }, Math.round(drop.c * 100) + "%")));
    }
    rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between" } },
      MG.ui.dom.h("span", null, "生命/魔力藥水"),
      MG.ui.dom.h("span", { style: { fontWeight: 800 } }, Math.round(potRate * 100) + "%")));
    rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between" } },
      MG.ui.dom.h("span", null, "裝備"),
      MG.ui.dom.h("span", { style: { fontWeight: 800 } }, m.boss ? "100%（BOSS保證）" : "7.5%")));
    rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between" } },
      MG.ui.dom.h("span", null, "寶石 / 技能書"),
      MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "3.5% / 1.5%")));
    if (m.boss) rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", color: "var(--r5)" } },
      MG.ui.dom.h("span", null, "BOSS額外"),
      MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "寶石×1・榮譽+2・招募券 35%・書 20%")));
    rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", color: "var(--dim)", fontSize: 11 } },
      MG.ui.dom.h("span", null, "難度「" + d.name + "」加成"),
      MG.ui.dom.h("span", null, "金幣 x" + d.gold + "・經驗 x" + d.exp)));
    return MG.ui.dom.h("div", { style: { background: "var(--panel2)", padding: "8px 10px", borderRadius: 8, marginBottom: 8, fontSize: 12, lineHeight: 1.8 } },
      MG.ui.dom.h("div", { style: { fontWeight: 900, marginBottom: 2, color: "var(--gold)" } },
        "戰利品（第 " + st.hunt.stage + " 關" + (m.boss ? "・BOSS" : "") + "）"),
      rows);
  }
  function showRegionInfo(i) {
    const st = S();
    const r = REGIONS()[i];
    if (!r) return;
    const tp = teamPower(), rp = recPower(r);
    const adv = tp >= rp;
    const body = MG.ui.dom.h("div", { style: { fontSize: 13, lineHeight: 1.55 } },
      MG.ui.dom.h("div", { style: { color: "var(--dim)", marginBottom: 4 } }, r.desc),
      MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid var(--line)", padding: "9px 12px", borderRadius: 8, margin: "8px 0 4px", fontSize: 14 } },
        MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "建議戰力（BOSS 關）"),
        MG.ui.dom.h("span", { style: { color: adv ? "#7ee787" : "#ffd166", fontWeight: 900, fontSize: 15, fontVariantNumeric: "tabular-nums" } }, MG.util.fmt(rp))),
      MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid " + (adv ? "rgba(126,231,135,.5)" : "var(--line)"), padding: "9px 12px", borderRadius: 8, marginBottom: 8, fontSize: 14 } },
        MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "目前隊伍戰力"),
        MG.ui.dom.h("span", { style: { color: adv ? "#7ee787" : "var(--r5)", fontWeight: 900, fontSize: 15, fontVariantNumeric: "tabular-nums" } },
          MG.util.fmt(tp) + (adv ? "　✓ 已達標" : "　⚠ 稍嫌不足"))),
      MG.ui.dom.h("div", { style: { display: "flex", gap: 6, alignItems: "flex-start", color: "var(--gold)", marginBottom: 8, fontSize: 12 } },
        MG.ui.dom.icon("icon_goldbag", 16), MG.ui.dom.h("span", null, r.lootNote)),
      lootInfoBlock(i),
      MG.ui.dom.h("div", { style: { display: "flex", gap: 8, alignItems: "flex-start", background: "var(--panel2)", padding: "8px 10px", borderRadius: 8, marginBottom: 8 } },
        MG.ui.dom.icon(r.boss.sprite, 26),
        MG.ui.dom.h("div", null,
          MG.ui.dom.h("div", { style: { fontWeight: 800, color: "var(--r5)" } },
            "BOSS：" + r.boss.name + (r.boss.flavor ? "　" + r.boss.flavor : "")),
          MG.ui.dom.h("div", { style: { color: "var(--dim)", fontSize: 12 } }, r.bossDesc))),
      MG.ui.dom.h("div", { style: { fontWeight: 800, margin: "4px 0", color: "var(--dim)" } }, "此地魔物"),
      ...r.monsters.map(m => MG.ui.dom.h("div", { style: { display: "flex", gap: 8, padding: "2px 0", alignItems: "flex-start" } },
        MG.ui.dom.icon(m.sprite, 16),
        MG.ui.dom.h("span", { style: { fontSize: 12 } },
          MG.ui.dom.h("b", null, m.name),
          MG.ui.dom.h("span", { style: { color: "var(--dim)" } }, "　" + (m.flavor || ""))))));
    MG.ui.dom.modal(r.name + "　地圖情報", body, { wide: true, icon: "icon_sword" });
  }
  const screen = {
    render(root) {
      root.innerHTML = "";
      // 畫面重建 = 全新 DOM：重置綁定在舊元素上的簽名快取，否則重進分頁時
      // 區域 chips／編隊列／戰鬥紀錄會被舊簽名擋住而整段空白
      chipsSig = ""; lastTeamSig = ""; lastLogKey = ""; lastStageKey = "";
      lastDispBtnKey = ""; lastAdvBtnKey = "";
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
      // 圓形加速播放鈕（戰鬥畫面右下角）：幾種速度幾種顯示
      speedFab = MG.ui.dom.h("button", {
        style: { position: "absolute", right: 8, bottom: 8, width: 34, height: 34, borderRadius: "50%", border: "1.5px solid rgba(255,209,102,0.6)", background: "rgba(10,12,24,0.82)", color: "var(--gold)", fontSize: 12, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 4, boxShadow: "0 1px 5px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(0,0,0,0.25)", userSelect: "none", WebkitTapHighlightColor: "transparent" },
        title: "戰鬥速度",
        on: { click: toggleSpeed }
      }, "▶");
      wrap.appendChild(speedFab);
      // 關卡情報按鈕（金色圓形，加速鈕左邊）：戰利品與地圖資訊
      infoFab = MG.ui.dom.h("button", {
        style: { position: "absolute", right: 50, bottom: 8, width: 34, height: 34, borderRadius: "50%", border: "2px solid rgba(255,209,102,0.9)", background: "linear-gradient(180deg,#ffd166,#f0a83a)", color: "#3a2500", fontSize: 16, fontWeight: 900, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 4, boxShadow: "0 1px 6px rgba(0,0,0,0.5), 0 0 10px rgba(255,209,102,0.35)", userSelect: "none", WebkitTapHighlightColor: "transparent" },
        title: "關卡情報與戰利品",
        on: { click: () => showRegionInfo(S().hunt.region) }
      }, "ⓘ");
      wrap.appendChild(infoFab);
      // empty-formation coach overlay
      coachEl = MG.ui.dom.h("div", { style: { position: "absolute", inset: 0, display: "none", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(10,12,24,0.82)", textAlign: "center", padding: "0 24px", zIndex: 3 } },
        MG.ui.dom.icon("icon_formation", 30),
        MG.ui.dom.h("div", { style: { color: "var(--text)", fontWeight: 800, fontSize: 14 } }, "出戰隊尚未編入英雄"),
        MG.ui.dom.h("div", { style: { color: "var(--dim)", fontSize: 12, lineHeight: 1.6 } }, "編入英雄後按下「派遣」，編隊將前往地圖戰鬥。擊敗魔物換取金幣、素材與寶物；全軍倒下會自動回村休息。"),
        MG.ui.dom.h("button", { class: "btn gold", style: { marginTop: 4 }, on: { click: () => MG.ui.screens.show("hunters") } }, "前往「英雄」分頁編入英雄"));
      wrap.appendChild(coachEl);
      root.appendChild(wrap);
      // controls
      controlsEl = MG.ui.dom.h("div", { style: { padding: "0 10px" } });
      teamOverviewEl = MG.ui.dom.h("div", { style: { display: "flex", gap: 6, overflowX: "auto", padding: "6px 0 2px", scrollbarWidth: "thin" } });
      controlsEl.appendChild(teamOverviewEl);
      const st = S();
      // v120：目的地選擇（區域/難度/關卡）全部移入「派遣」視窗，主畫面不再重複放置
      // 派遣狀態列
      statusEl = MG.ui.dom.h("div", { style: { marginTop: 8, fontSize: 12, fontWeight: 700 } });
      controlsEl.appendChild(statusEl);
      // 派遣 / 回村待機 / 自動續戰 / 速度
      const row = MG.ui.dom.h("div", { style: { display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" } },
        MG.ui.dom.h("button", { class: "btn sm gold", style: { flex: 1, minWidth: 90 }, on: { click: dispatchNow } },
          "派遣"),
        MG.ui.dom.h("button", { class: "btn sm green", style: { flex: 1, minWidth: 90, display: "none" }, on: { click: recallNow } },
          "回村待機"),
        MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1, minWidth: 100 }, on: { click: toggleAutoAdvance } },
          "自動進關"));
      dispatchBtn = row.children[0];
      recallBtn = row.children[1];
      advBtn = row.children[2];
      controlsEl.appendChild(row);
      // potions quick
      const potRow = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 } });
      for (const [key, iconName, name] of [["potAtk", "icon_pot_atk", "攻擊"], ["potGold", "icon_pot_gold", "金幣"], ["potExp", "icon_pot_exp", "經驗"], ["potBoost", "icon_hourglass", "加速沙漏"]]) {
        const btn = MG.ui.dom.h("button", {
          class: "chip", style: { flex: "1 1 42%", justifyContent: "center", minWidth: 0 },
          on: { click: () => usePotion(key) }
        }, MG.ui.dom.icon(iconName, 14), MG.ui.dom.h("span", { id: "pot-" + key, style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "靈藥"));
        potEls[key] = btn;
        potRow.appendChild(btn);
      }
      // 生命藥水（立即補血 50%）＋ 魔力藥水（立即補魔 50%）
      potRow.appendChild(MG.ui.dom.h("button", {
        class: "chip", style: { flex: "1 1 42%", justifyContent: "center", minWidth: 0 },
        on: { click: useHpPotion }
      }, MG.ui.dom.icon("icon_pot_hp", 14), MG.ui.dom.h("span", { id: "pot-hp", style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "補血")));
      potRow.appendChild(MG.ui.dom.h("button", {
        class: "chip", style: { flex: "1 1 42%", justifyContent: "center", minWidth: 0 },
        on: { click: useMpPotion }
      }, MG.ui.dom.icon("icon_pot_mp", 14), MG.ui.dom.h("span", { id: "pot-mp", style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "補魔")));
      controlsEl.appendChild(potRow);
      root.appendChild(controlsEl);
      // team strip
      teamEl = MG.ui.dom.h("div", { style: { display: "flex", gap: 6, padding: "10px", margin: "8px 10px 0", background: "var(--panel)", border: "2px solid var(--line)", borderRadius: 10 } });
      root.appendChild(teamEl);
      // log
      logEl = MG.ui.dom.h("div", { style: { margin: "8px 10px 4px", padding: "8px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 8, minHeight: 40 } });
      root.appendChild(MG.ui.dom.h("div", { class: "section-h", style: { margin: "4px 10px 0", alignItems: "center", gap: 8 } },
        MG.ui.dom.h("span", { class: "t" }, "戰鬥紀錄"),
        MG.ui.dom.h("button", { class: "chip", style: { marginLeft: "auto", padding: "2px 10px", minHeight: 26, borderColor: "var(--gold2)", color: "var(--gold)", fontWeight: 800 }, on: { click: openLogModal } },
          "展開全部 ▼")));
      root.appendChild(logEl);
      syncDom(MG.sys.battle.get());
    },
    refresh() { syncDom(MG.sys.battle.get()); },
    raf: render,
    onShow() { lastFrame = 0; }
  };
  // 戰鬥紀錄瀏覽：完整 100 筆（最新在上），可捲動
  function openLogModal() {
    const st = S();
    const logs = st.log || [];
    const body = MG.ui.dom.h("div", null,
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } }, "共 " + logs.length + " 筆（最多保留 100 筆）"),
      ...logs.map((l, i) => MG.ui.dom.h("div", { style: { display: "flex", gap: 6, alignItems: "center", fontSize: 11, color: "var(--dim)", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" } },
        l.icon ? MG.ui.dom.icon(l.icon, 12) : null,
        MG.ui.dom.h("span", null, l.msg),
        MG.ui.dom.h("span", { style: { marginLeft: "auto", color: "var(--dim2)", fontSize: 9 } },
          new Date(l.t).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })))));
    MG.ui.dom.modal("戰鬥紀錄", body, { wide: true, icon: "icon_sword" });
  }
  // 啟用數量選擇 modal：手動輸入或步進，確定後啟用 N 瓶
  function askQtyModal(name, icon, q, cb) {
    const m = MG.ui.dom.modal(name, null, { icon });
    let n = 1;
    const body = MG.ui.dom.h("div", null);
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginBottom: 8 } }, "持有 " + q + " 個，要啟用幾個？"));
    const row = MG.ui.dom.h("div", { style: { display: "flex", gap: 8, alignItems: "center", justifyContent: "center" } });
    const numEl = MG.ui.dom.h("input", {
      type: "number", min: 1, max: q, value: "1",
      style: { width: 76, textAlign: "center", fontSize: 18, fontWeight: 900, background: "var(--panel2)", color: "var(--text)", border: "2px solid var(--line)", borderRadius: 8, padding: "6px 4px" },
      on: {
        input: () => { const v = parseInt(numEl.value, 10); if (!isNaN(v)) { n = Math.min(q, Math.max(1, v)); syncN(); } },
        change: () => { numEl.value = n; }
      }
    });
    const syncN = () => { numEl.value = n; go.textContent = "啟用 " + n + " 個"; };
    const go = MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%", marginTop: 10 }, on: { click: () => { m.close(); cb(n); } } }, "啟用 1 個");
    const step = d => { n = Math.min(q, Math.max(1, n + d)); syncN(); };
    row.appendChild(MG.ui.dom.h("button", { class: "chip", style: { padding: "4px 13px" }, on: { click: () => step(-1) } }, "−"));
    row.appendChild(numEl);
    row.appendChild(MG.ui.dom.h("button", { class: "chip", style: { padding: "4px 13px" }, on: { click: () => step(1) } }, "+"));
    body.appendChild(row);
    body.appendChild(go);
    m.panel.appendChild(body);
  }
  // 靈藥/加速沙漏啟用：可手動輸入數量；多瓶時間疊加
  function usePotion(key) {
    const st = S();
    const isBoost = key === "potBoost";
    const label = isBoost ? "boost" : (key === "potAtk" ? "atk" : key === "potGold" ? "gold" : "exp");
    const defId = isBoost ? "item_hourglass" : "item_pot_" + label;
    const name = isBoost ? "加速沙漏" : (key === "potAtk" ? "攻擊靈藥" : key === "potGold" ? "金幣靈藥" : "經驗靈藥");
    const dur = isBoost ? 60e3 : 1800e3; // 每瓶：沙漏 60 秒 / 靈藥 30 分鐘
    const item = st.inventory.items.find(i => i.defId === defId);
    const q = item ? (item.qty || 1) : 0;
    if (!q) { MG.ui.dom.toast(isBoost ? "沒有加速沙漏，可在商店購買（20 鑽）" : "沒有靈藥，可在商店購買", "bad", isBoost ? "icon_hourglass" : "icon_pot_atk"); return; }
    const doUse = n => {
      item.qty = (item.qty || 1) - n;
      if (item.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== item.uid);
      const now = Date.now();
      if (isBoost) st.buffs.boostUntil = Math.max(st.buffs.boostUntil || 0, now) + n * dur;
      else st.buffs[key] = Math.max(st.buffs[key] || 0, now) + n * dur;
      MG.core.audio.SFX.potion();
      MG.ui.dom.toast(name + "已啟用 ×" + n, "good", isBoost ? "icon_hourglass" : "icon_pot_" + label);
      syncDom(MG.sys.battle.get());
    };
    if (q === 1) { doUse(1); return; }
    askQtyModal(name, isBoost ? "icon_hourglass" : "icon_pot_" + label, q, doUse);
  }
  // 生命藥水：立即恢復全隊 50% 生命（持續性 HP 系統的即時補血管道）
  function useHpPotion() {
    const st = S();
    const item = st.inventory.items.find(i => i.defId === "item_pot_hp");
    if (!item || !item.qty) { MG.ui.dom.toast("沒有生命藥水，可在商店購買（800 金）", "bad", "icon_pot_hp"); return; }
    item.qty--;
    if (item.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== item.uid);
    const F = MG.sys.battle.get();
    let healed = 0;
    if (F && F.team.length && F.phase === "fight") {
      // 戰鬥中：補戰鬥隊並寫回
      for (const t of F.team) {
        const amt = Math.round(t.maxHp * 0.5);
        if (t.hp < t.maxHp) { t.hp = Math.min(t.maxHp, t.hp + amt); healed += amt; }
      }
      MG.sys.battle.syncTeamHp();
    } else {
      // 非戰鬥：直接補英雄持久 HP（F.team 可能是召回後的過期副本）
      for (const h of st.hunters) {
        const max = Math.round(MG.sys.hunters.effectiveStats(h).hp);
        if (h.hp === undefined) h.hp = max;
        if (h.hp < max) { h.hp = Math.min(max, h.hp + Math.round(max * 0.5)); healed += Math.round(max * 0.5); }
      }
    }
    MG.core.audio.SFX.potion();
    MG.ui.dom.toast(healed > 0 ? "生命藥水：全隊恢復 50% 生命！" : "全隊生命已滿", "good", "icon_pot_hp");
    syncDom(MG.sys.battle.get());
  }
  // 魔力藥水：立即恢復全隊 50% 魔力（技能資源）
  function useMpPotion() {
    const st = S();
    const item = st.inventory.items.find(i => i.defId === "item_pot_mp");
    if (!item || !item.qty) { MG.ui.dom.toast("沒有魔力藥水，可在商店購買（800 金）", "bad", "icon_pot_mp"); return; }
    item.qty--;
    if (item.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== item.uid);
    const F = MG.sys.battle.get();
    let restored = 0;
    if (F && F.team.length && F.phase === "fight") {
      // 戰鬥中：補戰鬥隊並寫回
      for (const t of F.team) {
        const amt = Math.round(t.maxMp * 0.5);
        if (t.mp < t.maxMp) { t.mp = Math.min(t.maxMp, t.mp + amt); restored += amt; }
      }
      MG.sys.battle.syncTeamHp();
    } else {
      // 非戰鬥：直接補英雄持久 MP
      for (const h of st.hunters) {
        const max = Math.round(MG.sys.hunters.effectiveStats(h).mp);
        if (h.mp === undefined) h.mp = max;
        if (h.mp < max) { h.mp = Math.min(max, h.mp + Math.round(max * 0.5)); restored += Math.round(max * 0.5); }
      }
    }
    MG.core.audio.SFX.potion();
    MG.ui.dom.toast(restored > 0 ? "魔力藥水：全隊恢復 50% 魔力！" : "全隊魔力已滿", "good", "icon_pot_mp");
    syncDom(MG.sys.battle.get());
  }
  MG.ui.screens.register("hunt", screen);
  return screen;
})();
