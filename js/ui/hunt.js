/* 放置王國 MEGA IDLE — hunt screen: live battle canvas + controls + loot log (slice B3 owns) */
"use strict";
MG.ui = MG.ui || {};
MG.ui.hunt = (function () {
  const S = () => MG.game.state;
  const REGIONS = () => MG.data.monsters.regions;
  let canvas, ctx, root, logEl, stageEl, controlsEl, chipsEl, teamEl, coachEl;
  let speedFab = null; // 圓形加速播放鈕（戰鬥畫面右下角）
  let infoFab = null; // 金色關卡情報按鈕（加速鈕左邊）
  let statusEl, dispatchBtn, recallBtn, autoBtn, advBtn, teamOverviewEl, offPreviewEl, offPreEl, offRateEl, offNoteEl; // v228：離線預覽；v550：速率著色
  let lastLogKey = ""; // 戰鬥紀錄簽名（效能：log 不變就不重建 DOM）
  let lastStageKey = ""; // 關卡標題簽名（效能：關卡沒變就不重建）
  let lastDispBtnKey = "", lastAutoBtnKey = "", lastAdvBtnKey = ""; // 控制鈕簽名（效能：狀態沒變就不重建 innerHTML）
  let lastCoachKey = ""; // 空編隊/待機 coach 簽名（v561：三態分流 — 空編隊教學／滿編待機「立即派遣」／休息派遣中隱藏）
  
  const potEls = {};
  let lastFrame = 0, lastLootTicker = 0;
  const anim = {
    floats: [], particles: [], projectiles: [], goldFlash: 0, eventsCursor: 0, screenT: 0,
    lastMonsterId: null, entering: 0, bossHit: 0, bossFlash: 0, regionFlash: 0, extraShake: 0,
    monsterFlash: 0, death: null, wipeHinted: false, atkUntil: {}, castUntil: {}, hurtUntil: {}, castFx: {}, // v227：per-skill 施法光暈
    down: {}, // v552：隊員倒地計時（id → { t: 秒 }，封頂 1s = 靜態屍體）
    bossGreen: 0, // v558：BOSS 回血綠閃（再生/吸血作用瞬間；rm 停用）
    floatMerge: {}, // vN：浮字合併表（bucket key → 現存浮字 ref；同目標短窗同桶累加，O(1) 查找免每幀掃描）
    mLane: 0, hLane: 0 // vN：怪物側/英雄側 round-robin 分道計數器（確定性，禁 Math.random）
  };
  // vN 傷害浮字可讀性：同目標短窗合併＋分道錨點（合併桶存活期間累加 → 持久計數並回錨 y0，不隨 vy 飄離）
  // 怪物側三條分道（x 錯開避免疊壓；錨點帶置於 boss 本體/血條/名字上方淨空區 y≈116-124，浮字上飄不蓋本體）
  const M_LANES = [
    { x: 292, y: 124 },
    { x: 352, y: 124 },
    { x: 320, y: 116 },
  ];
  const H_LANE_Y = [0, -11, -22]; // 英雄側垂直分道 offset（疊在既有 hx 錨點上，同 hero 多浮字錯開）
  function rm() {
    const s = S();
    return !!(s && s.settings && s.settings.reducedMotion);
  }
  const ENTER_MS = 0.42;
  // v165 前排/後排站位：1-2 位前排（承受單體攻擊）、3-5 位後排（受傷 -25%）
  const TEAM_POS = [
    { x: 60, y: 198 }, { x: 112, y: 198 }, { x: 44, y: 162 }, { x: 92, y: 162 }, { x: 140, y: 162 }
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
      const hurtT = (anim.hurtUntil[h.id] || 0) - now; // v222：受擊後仰+白閃剩餘（>0 表示受擊中）
      const aliveHurt = hurtT > 0 && h.hp > 0; // v222FIX：死亡後 hurtUntil 殘留不套用（屍體不後仰白閃）
      const status = [];
      if (h.buffs && h.buffs.shield > 0) status.push("shield");          // 禦劍架式/護盾
      if (F.taunt && F.taunt.id === h.id) status.push("taunt");           // 嘲諷中
      if (h.skillCd <= 0 && h.skills && h.skills.length) status.push("ready"); // 技能就緒
      return {
        ...h, ...(TEAM_POS[i] || TEAM_POS[0]),
        flip: true, dead: h.hp <= 0, attack: (attacking || casting) && h.hp > 0, casting,
        // v552：屍體不掛狀態圖示（技能就緒/嘲諷）＋倒地相位（0=存活；0-1=倒地動畫；缺項=靜態屍體）
        status: h.hp > 0 ? status : [],
        downT: h.hp <= 0 ? (anim.down[h.id] ? anim.down[h.id].t : 9) : 0,
        atkLeft: attacking ? (anim.atkUntil[h.id] - now) : 0, // v222：攻擊相位（前搖/揮擊/收招）
        hurt: aliveHurt, hurtLeft: aliveHurt ? Math.max(0, hurtT) : 0, // v222：受擊後仰/白閃
        castFx: (casting && h.hp > 0) ? (anim.castFx[h.id] || "fx_spark") : null, // v227：施法光暈 per-skill 元素色（v227FIX：死亡不掛光暈）
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
      frozen: F.freeze > 0, flash: anim.monsterFlash,
      windup: F.mAtk !== undefined ? F.mAtk : 1,   // v288：攻擊前搖剩餘秒（v549FIX：最後一格 ≤0.5s 亮警示）
      mech: F.m.mech || null, t: F.t || 0,   // v297：Boss 機制視覺化（shield/regen/poison/aoe）
      aoeT: F.aoeT !== undefined ? F.aoeT : 8,
      poisonT: F.poisonT !== undefined ? F.poisonT : 4
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
  /* vN 傷害浮字可讀性：同目標短窗合併＋分道錨點
     - opt.merge = bucket key：同桶且現存浮字出生 < MERGE_WINDOW → 累加其 val、重置生命並彈 pop（脈衝），不新增
     - opt.val = 原始數值；render 以 prefix+fmt(val) 重組顯示，合併時自動累加（skills/crit/gold 亦可只參與分道）
     - opt.side = "m"（怪物側 3x 水平分道）| "hero"（英雄側垂直分道）；無側別＝維持原路徑（技能名/橫幅/金幣等）
     - 暴擊併入 m_crit 金色計數並以合併 pop 脈衝保留暴擊跳感（避免暴擊 flood 淹沒 boss 本體）；
       技能名/金幣/經驗/橫幅類文字（無 val）不合併維持原路徑 */
  function spawnFloat(x, y, text, color, big, opt) {
    if (rm()) return; // reduced motion: no floating text
    if (anim.floats.length > 60) return; // throttle: cap active floats
    opt = opt || {};
    if (opt.merge) {
      const ex = anim.floatMerge[opt.merge];
      // 同桶現存浮字仍存活（life>殘存閾）→ 累加 val、重置生命、彈 pop；並回錨 y0（持久計數不隨 vy 飄離）
      if (ex && ex.life > 0.05) {
        ex.val = (ex.val || 0) + (opt.val || 0);
        ex.life = ex.maxLife; ex.pop = 1;
        ex.y = ex.y0; // 回錨：合併計數保持在分道錨點，避免持續上飄出屏
        return;
      }
    }
    if (opt.side === "m") {
      const lane = anim.mLane = (anim.mLane + 1) % M_LANES.length;
      x = M_LANES[lane].x; y = M_LANES[lane].y;
    } else if (opt.side === "hero") {
      const lane = anim.hLane = (anim.hLane + 1) % H_LANE_Y.length;
      y = y + H_LANE_Y[lane];
    }
    const hasVal = typeof opt.val === "number";
    const f = {
      x, y, y0: y, vy: -0.55, life: 0.9, maxLife: 0.9,
      text: hasVal ? (opt.prefix || "") + MG.util.fmt(opt.val) : text,
      color: color || "#fff", big,
      val: hasVal ? opt.val : undefined, prefix: hasVal ? (opt.prefix || "") : undefined,
      bucket: opt.merge || null, pop: 0
    };
    anim.floats.push(f);
    if (opt.merge) anim.floatMerge[opt.merge] = f;
  }
  /* v251 滅團戰報：敗因診斷 modal（撐多久/魔物殘血%/每人傷害條/治療/輸出 MVP — 決定性診斷資訊）
     僅滅團彈一次；modal 純 DOM 停留不阻塞後台休息/續戰 */
  let wipeReportShown = false; // 同一次滅團不重複彈（多 retreat 事件防抖）
  let lastWipeModal = null; // v251FIX：自動續戰連敗時先關舊戰報（20s RETREAT_MS 使防抖無法跨場攔截 → overlay 逐場堆疊）
  function showWipeReport() {
    if (wipeReportShown) return;
    const sum = MG.sys.battle.summary();
    if (!sum) return;
    wipeReportShown = true;
    setTimeout(() => wipeReportShown = false, 1500); // 下次滅團（不同場）可再彈
    if (lastWipeModal) { try { lastWipeModal.close(); } catch (e) { /* 已關 */ } }
    const m = MG.ui.dom.modal("滅團戰報", null, { icon: "icon_skull" });
    lastWipeModal = m;
    const st = S();
    const regionName = (REGIONS()[S().hunt.region] || {}).name || "未知區域"; // v251FIX：hunt.region 恆為有效索引（深淵=length-1 — 原 maxR clamp 對深淵誤顯普通區域名）
    m.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, textAlign: "center", marginBottom: 6 } },
      "「" + regionName + "」撐了 " + Math.floor(sum.t) + " 秒・擊殺 " + sum.kills + " 隻・魔物剩餘 " + sum.hpLeft + "% HP"));
    m.panel.appendChild(MG.ui.dom.h("div", { style: { fontSize: 11, textAlign: "center", marginBottom: 8, color: sum.hpLeft > 50 ? "var(--gold)" : "var(--dim)" } },
      sum.hpLeft > 50 ? "魔物血量幾乎沒掉 — 輸出不足，優先強化輸出英雄／升級技能／提升神器" : "魔物殘血但全軍倒下 — 生存不足，優先強化前排坦度與治療"));
    const total = sum.members.reduce((a, x) => a + x.dmg, 0) || 1;
    for (const x of sum.members) {
      const row = MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 6, padding: "4px 0" } },
        MG.ui.dom.h("span", { style: { width: 74, fontSize: 11, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
          x.name + (sum.mvp && sum.mvp.id === x.id && x.dmg > 0 ? " ⚔" : "")),
        MG.ui.dom.h("div", { style: { flex: 1, height: 8, background: "var(--panel2)", borderRadius: 4, overflow: "hidden" } },
          MG.ui.dom.h("i", { style: { display: "block", height: "100%", width: Math.max(2, x.pct) + "%", background: "linear-gradient(90deg,#f0a83a,#ffd166)" } })),
        MG.ui.dom.h("span", { style: { width: 58, fontSize: 10, textAlign: "right", color: "var(--dim)" } },
          MG.util.fmt(x.dmg) + (x.heal > 0 ? "・+" + MG.util.fmt(x.heal) : "")));
      m.panel.appendChild(row);
    }
    m.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, textAlign: "center", marginTop: 4 } },
      sum.mvp ? "⚔ 輸出 MVP：「" + sum.mvp.name + "」（佔 " + sum.mvp.pct + "% 輸出）" : "全員未造成傷害 — 檢查是否誤派了未訓練的英雄"));
  }
  function spawnParticle(sprite, x, y, opts) {
    if (rm()) return; // reduced motion: no particles
    if (anim.particles.length > 64) return; // v227FIX：粒子上限（multi fan-out 提高單波量 — 與 spawnFloat 對稱節流）
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
  /* 通用暴擊衝擊：輕量 hit-stop + 震動 + 閃白（非 Boss 也能觸發，參數更小） */
  function critImpact() {
    if (rm()) return; // 省電模式不觸發
    anim.bossFlash = Math.max(anim.bossFlash, 0.12); // 閃白 0.12s（Boss 0.3s）
    anim.bossHit = Math.max(anim.bossHit, 0.06);     // hit-stop 60ms（Boss 90ms）
    anim.extraShake = Math.max(anim.extraShake, 0.15); // 震動 0.15（Boss 0.4）
  }
  /* 普通擊中微衝擊：20ms hit-stop，讓每一擊都有重量感（EHT 風格打擊回饋） */
  function hitImpact() {
    if (rm()) return; // 省電模式不觸發
    anim.bossHit = Math.max(anim.bossHit, 0.02); // hit-stop 20ms，極輕微、不干擾流暢度
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
      // v558FIX：TEAM_POS 條目是 {x,y} 物件 — 原誤用陣列索引 [0]/[1] → undefined+20 = NaN →
      // 英雄側浮字（出手傷害/治療/受擊 mhit/升級）自 v1 起全數不可見（僅怪物側 (320,…) 浮字正常）
      const hx = hunter ? (TEAM_POS[F.team.indexOf(hunter)].x + 20) : 80;
      const hy = hunter ? (TEAM_POS[F.team.indexOf(hunter)].y - 10) : 180;
      // v290：傷害數字屬性色 — 元素克制（el 布林標記）時用職業元素色；無克制維持暴擊金/普通白
      const dmgColor = (crit) => {
        if (e.el) {
          const elDef = MG.config.ELEMENTS[MG.config.CLASS_ELEMENT[e.cls]];
          if (elDef) return elDef.color;
        }
        return crit ? "#ffd166" : "#ffffff";
      };
      switch (e.type) {
        case "hit":
        case "crit": {
          anim.atkUntil[e.hunter] = anim.screenT + 0.4; // 英雄攻擊動作（0.4s 更明顯）
          // vN：移除英雄側逐次出手傷害 echo — 5 英雄縱列過窄(44-160)放獨力計數會互相疊壓；出手由攻擊動作＋怪物側合併計數承載
          if (e.cls !== "archer" && e.cls !== "mage") {
            spawnParticle("fx_slash", hx + 14, hy - 4, { life: 0.3, scale: 1.4, gravity: 0 }); // 近戰英雄揮砍光
          }
          const isRanged = e.cls === "archer" || e.cls === "mage";
          const vsBoss = F.m && F.m.boss;
          if (isRanged) {
            spawnProjectile(e.cls === "archer" ? "fx_arrow" : "fx_fireball", hx, hy, 320, 220, e.cls === "archer" ? 0.22 : 0.3);
            const at = e.cls === "archer" ? 220 : 300;
            setTimeout(() => { anim.monsterFlash = e.type === "crit" ? 0.09 : 0.07; }, at);
            // vN：怪物側短窗合併（普攻累加 m_hit、暴擊累加 m_crit 金色計數 + 合併 pop 脈衝保留暴擊爽感）
            setTimeout(() => spawnFloat(320, e.type === "crit" ? 210 : 215, "-" + MG.util.fmt(e.dmg), dmgColor(e.type === "crit"), e.type === "crit",
              { merge: e.type === "crit" ? "m_crit" : "m_hit", val: e.dmg, prefix: "-", side: "m" }), at);
          } else {
            anim.monsterFlash = e.type === "crit" ? 0.09 : 0.07;
            spawnFloat(320, 210, "-" + MG.util.fmt(e.dmg), dmgColor(e.type === "crit"), e.type === "crit",
              { merge: e.type === "crit" ? "m_crit" : "m_hit", val: e.dmg, prefix: "-", side: "m" });
            spawnParticle("fx_slash", 300, 210, { life: 0.3, scale: 1.4, gravity: 0 });
          }
          if (e.type === "crit") {
            MG.core.audio.SFX.crit();
            critImpact(); // 所有暴擊都觸發通用衝擊（hit-stop + 震動 + 閃白）
            if (vsBoss) bossImpact(0.3, 0.09, 0.4); // Boss 額外加強
          } else if (vsBoss) {
            bossImpact(0, 0.05, 0);
          } else {
            hitImpact(); // 普通怪普攻微衝擊：20ms hit-stop
          }
          break;
        }
        case "skill": {
          // v227 施法三段式（A7）：舉手聚光(0-0.12s)→怪物側元素爆發+命中回饋(0.12s+)→收勢(castUntil 尾段)
          const sk = MG.data.hunters.skills[e.skill] || {};
          const fx = sk.icon || "fx_spark";
          anim.castUntil[e.hunter] = anim.screenT + 0.55;
          anim.castFx[e.hunter] = fx; // 施法光暈 per-skill 元素色
          // 第一拍：英雄側小聚光（舉手聚氣 — 不再是整顆 fx 掛身上）
          spawnParticle(fx, hx, hy - 8, { life: 0.22, scale: 0.8, gravity: 0 });
          const multi = sk.type === "multi" ? (sk.hits || 1) : 1;
          // v227FIX：消費時捕捉怪物身份（延遲閉包 120-190ms 後可能已換怪 — 閃白/衝擊以 id 門控防誤植）
          const mId = F.m ? F.m.id : null;
          const wasBoss = !!(F.m && F.m.boss);
          const isDmg = e.dmg > 0; // v227FIX：buff/護盾/嘲諷/治療（dmg 0）不觸發怪物閃白/衝擊
          // 第二拍（0.12s 延遲 — 純視覺，battle 已即時結算）：怪物側元素爆發＋傷害數字
          setTimeout(() => {
            for (let k = 0; k < multi; k++) {
              setTimeout(() => {
                spawnParticle(fx, 310 + (multi > 1 ? (k - (multi - 1) / 2) * 7 : 0), 205, { life: 0.4, scale: multi > 1 ? 1.3 : 1.8, gravity: 0 }); // multi 連擊橫向展開
                // v227FIX：單發（首擊）與 multi 末擊都給命中回饋（僅 dmg>0 且怪物仍是原目標）
                const last = k === multi - 1;
                if (isDmg && F.m && F.m.id === mId && (multi === 1 || last)) {
                  anim.monsterFlash = 0.07;
                  if (wasBoss) bossImpact(0.22, 0.07, 0.25);
                }
              }, k * 70);
            }
            // v322：技能傷害數字用職業元素色（與 hit/crit 克制著色同源）；非傷害跳技能名
            const skEl = MG.config.ELEMENTS[MG.config.CLASS_ELEMENT[e.cls]];
            const skColor = skEl ? skEl.color : "#c792ea";
            if (isDmg) {
              spawnFloat(320, 200, "-" + MG.util.fmt(e.dmg), skColor, true, { merge: "m_skill", val: e.dmg, prefix: "-", side: "m" }); // 怪物側傷害數字（延後一拍；技能短窗累加）
            } else {
              spawnFloat(320, 190, sk.name || "技能", "#9ad8ff", false); // v227FIX：buff/taunt/heal 不跳「-0」— 跳技能名
            }
            // 英雄側同步：僅非傷害技能跳技能名（dmg 由怪物側合併計數承載，避免疊壓英雄列）
            if (!isDmg) spawnFloat(hx, hy - 34, sk.name || "技能", "#9ad8ff", false);
          }, 120);
          MG.core.audio.SFX.skill();
          break;
        }
        case "mhit":
          // v558：劇毒 tick 紫字＋毒霧粒子（與玩家毒 dot #c792ea 同色系 — 機制傷害 vs 普攻紅字一眼可分）
          spawnFloat(hx, hy - 6, "-" + MG.util.fmt(e.dmg), e.poison ? "#c792ea" : "#ff6b6b", false, { merge: "h_" + e.hunter + "_dm", val: e.dmg, prefix: "-", side: "hero" });
          spawnParticle(e.poison ? "fx_poison" : "fx_spark", hx, hy, { life: 0.25, scale: e.poison ? 1.1 : 0.9, gravity: 0 });
          // v222 受擊後仰+白閃（0.3s = 2 幀後仰+1 幀閃白 @10fps；死亡者不後仰）
          if (hunter && hunter.hp > 0) anim.hurtUntil[e.hunter] = anim.screenT + 0.3;
          break;
        case "dot":
          // v547：中毒浮字改紫（原 #7ac86a 與治療 #7ee787 同為綠色系 — 扣血/補血一眼難分）
          spawnFloat(320, 225, "-" + MG.util.fmt(e.dmg), "#c792ea", false, { merge: "m_dot", val: e.dmg, prefix: "-", side: "m" });
          spawnParticle("fx_poison", 320, 205, { life: 0.4, scale: 0.9, gravity: 0 });
          break;
        case "heal":
          spawnFloat(hx, hy - 8, "+" + MG.util.fmt(e.amt), "#7ee787", false, { merge: "h_" + e.hunter + "_heal", val: e.amt, prefix: "+", side: "hero" });
          spawnParticle("fx_heal", hx, hy, { life: 0.4, scale: 1.2, gravity: 0 });
          break;
        case "mheal":
          // v558：BOSS 回血量化 — 再生/吸血作用瞬間跳綠色 +N＋全屏綠閃（血條回升的「原因」可讀；rm 跳過浮字/粒子/閃光）
          spawnFloat(320, 185, "+" + MG.util.fmt(e.amt), "#7ee787", false, { merge: "m_heal", val: e.amt, prefix: "+", side: "m" });
          spawnParticle("fx_heal", 320, 205, { life: 0.5, scale: 1.3, gravity: 0 });
          if (!rm()) anim.bossGreen = 0.28;
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
        case "down":
          // v552 死亡表現：隊員倒下 — 觸發倒地動畫＋地面屍體＋紅 ✕（純視覺；數值/存檔零觸碰）
          anim.down[e.hunter] = { t: 0 };
          break;
        case "retreat":
          spawnFloat(240, 140, "全軍倒下，回村休息中…", "#7ee787", true);
          showWipeReport(); // v251 滅團戰報：敗因診斷（撐多久/魔物殘血/每人傷害/輸出 MVP）
          if (e.wipes >= 2 && !anim.wipeHinted) {
            anim.wipeHinted = true;
            MG.ui.dom.toast("戰力不足？強化英雄裝備，或切到前面關卡累積戰利品！", "", "icon_sword");
          }
          if (e.fallback) {
            // v559：連敗回退同時暫停自動進關（引擎端 battle.js）— 退守關卡成為穩定農點；
            // toast 明示「自動進關已暫停」＋可再開啟（hunt 頁自動進關按鈕即為推進開關）
            // v560：回退目的地升級為最佳練功點（引擎掃描同源）— 練角效率 4×，toast 告知新落點
            if (e.fallback.type === "farmspot") {
              const reg = REGIONS()[e.fallback.r];
              MG.ui.dom.toast("連敗三場，已自動移至最佳練功點「" + (reg ? reg.name : "") + "・" + MG.config.stageLabel(e.fallback.n) + "・" + MG.config.DIFFICULTY[e.fallback.d].name + "」練角（自動進關已暫停）", "good", "icon_sword");
            } else {
              MG.ui.dom.toast(e.fallback.type === "stage"
                ? "連敗三場，已自動退至" + MG.config.stageLabel(e.fallback.stage) + "練角（自動進關已暫停）"
                : "連敗三場，難度降至「" + MG.config.DIFFICULTY[e.fallback.diff].name + "」（自動進關已暫停）", "bad", "icon_sword");
            }
          }
          break;
        case "resume":
          spawnFloat(240, 140, "再戰！", "#7ee787", true);
          break;
        case "returnhome":
          spawnFloat(240, 140, "全軍回村休息", "#7ee787", true);
          break;
        case "levelup":
          spawnFloat(hx, hy - 14, "Lv " + (e.level || "") + "！", "#ffd166", true);
          // v177 升級爆發：金色粒子環（減少動畫模式省略）
          if (!rm()) {
            for (let k = 0; k < 8; k++) {
              const ang = (k / 8) * Math.PI * 2;
              anim.particles.push({
                kind: "ambient", sprite: "fx_star",
                x: hx + 8, y: hy + 2,
                vx: Math.cos(ang) * 0.9, vy: Math.sin(ang) * 0.9 - 0.3,
                gravity: 0, life: 0.5 + Math.random() * 0.4, maxLife: 0.9,
                scale: 0.8 + Math.random() * 0.6, t: anim.screenT
              });
            }
          }
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
    // v558：BOSS 回血綠閃（0.28s 線性衰減 — 再生/吸血作用瞬間全屏可辨；與白閃語彙對稱）
    if (anim.bossGreen > 0) {
      ctx.fillStyle = "rgba(126,231,135," + ((anim.bossGreen / 0.28) * 0.22).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    // region-clear golden transition
    if (anim.regionFlash > 0) {
      ctx.fillStyle = "rgba(255,209,102," + ((anim.regionFlash / 0.7) * 0.24).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    // boss banner polish: pulsing underline that fades with the banner (static when reduced motion)
    // v566：隨橫幅下移（87→133 — 對齊新帶底緣 134）
    if (view.banner && view.banner.boss) {
      const bw = 260;
      const rem = view.banner.t !== undefined ? Math.max(0, Math.min(1, view.banner.t / 0.4)) : 1;
      const pulse = rm() ? 0.72 : 0.5 + 0.5 * Math.sin(anim.screenT * 12);
      ctx.fillStyle = "rgba(255,92,138," + ((0.16 + 0.14 * pulse) * rem).toFixed(3) + ")";
      ctx.fillRect(240 - bw / 2, 133, bw, 3);
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
    const st = S(); // v187FIX：v167 環境粒子區塊先於原宣告使用 st → TDZ 每幀崩潰（戰鬥畫面空白）；移至 render 開頭
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
    if (anim.bossGreen > 0) anim.bossGreen = Math.max(0, anim.bossGreen - rawDt); // v558：回血綠閃衰減
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
    // v552：隊員倒地計時（封頂 1s — 之後渲染層顯示靜態屍體）；回城/待機清場
    if (F.phase === "retreat" || (F.phase === "idle" && !(st.hunt.dispatchIds || []).length)) {
      anim.down = {};
    } else {
      for (const k in anim.down) anim.down[k].t = Math.min(1, anim.down[k].t + dt);
    }
    // update anims
    for (let i = anim.floats.length - 1; i >= 0; i--) {
      const f = anim.floats[i];
      f.life -= dt; f.y += f.vy * 60 * dt;
      if (f.pop > 0) f.pop = Math.max(0, f.pop - dt * 8); // vN 合併脈衝衰減（~0.125s 回落）
      if (f.life <= 0) {
        if (f.bucket && anim.floatMerge[f.bucket] === f) delete anim.floatMerge[f.bucket]; // vN 同桶浮字死亡清表
        anim.floats.splice(i, 1);
      }
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
    // v167 區域環境粒子（美術氛圍）：依區域生成飄落/上升的雪、餘燼、落葉、飛沙、幽光、星芒
    {
      const ambient = MG.config.REGION_AMBIENT[st.hunt.region];
      if (ambient && anim.particles.length < 26) {
        anim.ambientT = (anim.ambientT || 0) + dt;
        if (anim.ambientT > 0.14) {
          anim.ambientT = 0;
          const rising = ambient.vy < 0;
          const mkP = () => ({
            kind: "ambient", sprite: ambient.sprite,
            x: 20 + Math.random() * 440,
            y: rising ? 230 + Math.random() * 40 : -12 - Math.random() * 16,
            vx: ambient.sway ? (Math.random() - 0.5) * 0.3 : (ambient.vx || 0) * (0.6 + Math.random() * 0.8) * (Math.random() < 0.5 ? -1 : 1),
            vy: ambient.vy * (0.7 + Math.random() * 0.6),
            gravity: 0,
            life: 3 + Math.random() * 3, maxLife: 6,
            scale: 0.7 + Math.random() * 0.8, t: anim.screenT
          });
          anim.particles.push(mkP());
          if (Math.random() < 0.55) anim.particles.push(mkP());
        }
      }
    }
    for (let i = anim.projectiles.length - 1; i >= 0; i--) {
      const p = anim.projectiles[i];
      p.t += dt;
      if (p.t >= p.dur) { anim.projectiles.splice(i, 1); continue; }
      p.x = p.x0 + (p.x1 - p.x0) * (p.t / p.dur);
      p.y = p.y0 + (p.y1 - p.y0) * (p.t / p.dur) - Math.sin(p.t / p.dur * Math.PI) * 14;
    }
    if (anim.goldFlash > 0) anim.goldFlash -= dt;
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
      rm: rm(), // v182：場景視差遵循減少動畫設定
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
        const cell = MG.ui.dom.h("div", { style: { flex: 1, textAlign: "center" }, title: "「" + h.name + "」HP " + Math.round(curHp) + "/" + Math.round(maxHp) + "・MP " + Math.round(curMp) + "/" + Math.round(maxMp) + "・戰力 " + MG.util.fmt(MG.sys.hunters.power(h)) + (dispatched ? "（出戰中）" : "（待機）") },
          MG.ui.dom.icon(h.sprite || MG.data.hunters.classes[h.cls].icon, 20),
          MG.ui.dom.h("div", { class: "pbar red", style: { height: 5, marginTop: 2 } },
            MG.ui.dom.h("i", { style: { width: hpPct + "%" } })),
          MG.ui.dom.h("div", { class: "pbar blue", style: { height: 3, marginTop: 1 } },
            MG.ui.dom.h("i", { style: { width: mpPct + "%" } })),
          MG.ui.dom.h("div", { style: { fontSize: 9, color: "var(--dim)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 } },
            // v206：元素色點＋克標記（克制當前區域 +25%）
            MG.ui.dom.h("span", { style: { width: 6, height: 6, borderRadius: "50%", background: (MG.config.ELEMENTS[MG.config.CLASS_ELEMENT[h.cls]] || {}).color || "#888", flexShrink: 0 } }),
            MG.ui.dom.h("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, h.name),
            (() => { const regionEl = (MG.data.monsters.regions[st.hunt.region] || {}).element; return regionEl && MG.config.ELEMENT_COUNTER[MG.config.CLASS_ELEMENT[h.cls]] === regionEl ? MG.ui.dom.h("span", { style: { fontSize: 8, fontWeight: 900, color: "#0a2a10", background: "#57c96b", borderRadius: 3, padding: "0 3px", lineHeight: "11px" } }, "克") : null; })()),
          MG.ui.dom.h("div", { style: { fontSize: 9, fontWeight: 800, color: "var(--gold)", marginTop: 1 } }, "戰力 " + MG.util.fmt(MG.sys.hunters.power(h))));
        // skill cooldown ticks（僅派遣中顯示）
        const sk = bm && bm.skills && bm.skills[0];
        if (sk) {
          const cd = sk.cd || 1;
          const prog = bm.skillCd <= 0 ? 1 : Math.max(0, Math.min(1, 1 - bm.skillCd / cd));
          const ready = prog >= 1;
          // v120：技能就緒但魔力不足 → 顯示「魔力不足」
          const noMp = ready && bm.mp < (sk.mp || 0);
          // v349：技能 hover 提示（名稱・效果・魔力・冷卻狀態）
          cell.title = "技能「" + (sk.name || "未知") + "」：" + (sk.desc || "") + "（魔力 " + (sk.mp || 0) + "・CD " + cd + "s）" + (noMp ? " — 魔力不足" : ready ? " — 就緒" : " — 剩 " + Math.ceil(bm.skillCd) + "s");
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
          title: "前往英雄頁編隊（酒館等級決定出戰人數）",
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
      // v568：休息中的英雄也眨眼（待機動作；rm 不眨 — 與戰場同閘）
      if (!rm) MG.ui.render.drawBlink(ctx, h.sprite, tx, ty + bob, h.flip, anim.screenT, h.seed !== undefined ? h.seed : i * 1.7);
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
    // 休息倒數橫幅（輕量、不遮操作）— v566：y14→100（原帶 14-56 與 DOM 關卡名行/進度條疊印，
    // 倒數文字被進度條遮住；100-142 落在 DOM 覆蓋區(邏輯 ≤93)下方空曠天際帶，雙視口可讀）
    if (restLeft > 0) {
      const bw = 320, bh = 42, by = 100;
      ctx.fillStyle = "rgba(8,10,22,0.88)";
      ctx.fillRect(W / 2 - bw / 2, by, bw, bh);
      ctx.strokeStyle = "#7ee787";
      ctx.lineWidth = 2;
      ctx.strokeRect(W / 2 - bw / 2, by, bw, bh);
      ctx.textAlign = "center";
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "#7ee787";
      ctx.fillText("💤 全軍回村休息中 " + Math.ceil(restLeft) + " 秒", W / 2, by + 22);
      ctx.fillStyle = "#10111f";
      ctx.fillRect(W / 2 - 95, by + 30, 190, 7);
      ctx.fillStyle = "#7ee787";
      ctx.fillRect(W / 2 - 93, by + 31, 186 * Math.max(0, Math.min(1, 1 - restLeft / 20)), 5);
    }
  }
  function syncDom(F) {
    const st = S();
    const region = REGIONS()[st.hunt.region];
    // stage header — tap region name for 地圖情報
    if (stageEl) {
      // 效能：區域/關卡沒變就不重建（每 250ms 全量重建 header 是浪費）
      const bossStage = st.hunt.stage % 10 === 0;
      const stageKey = st.hunt.region + ":" + st.hunt.stage + ":" + bossStage + ":" + (st.hunt.difficulty || 0) + ":" + teamPower(); // v201：難度/戰力變化也觸發重建（建議行即時）
      if (stageKey !== lastStageKey) {
        lastStageKey = stageKey;
        stageEl.innerHTML = "";
        stageEl.appendChild(MG.ui.dom.h("div", { class: "hunt-stage-h", style: { cursor: "pointer" }, title: "「" + region.name + "」" + (bossStage ? "BOSS關 — 點擊查看「" + (region.boss ? region.boss.name : "???") + "」機制與戰利品" : "點擊查看「" + region.name + "」地圖情報（魔物・掉落・BOSS 機制）"), on: { click: () => showRegionInfo(st.hunt.region) } },
          region.name,
          MG.ui.dom.h("span", { style: { color: bossStage ? "var(--r5)" : "var(--gold)" } }, " " + MG.config.stageLabel(st.hunt.stage))));
        stageEl.appendChild(MG.ui.dom.h("div", { class: "pbar", style: { marginTop: 4 } },
          MG.ui.dom.h("i", { style: { width: ((st.hunt.stage % 10) / 10 * 100) + "%" } })));
        // v186 UI/UX：關卡收益常駐（點 ⓘ 前即可見每擊殺收益與距 BOSS 關數）
        try {
          const lm = MG.sys.loot.scaledMonster(st.hunt.region, st.hunt.stage);
          const rewardRow = MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "center", gap: 8, fontSize: 9, marginTop: 3, textShadow: "0 1px 2px rgba(0,0,0,0.75)", fontWeight: 800 }, title: "每擊殺收益（含難度 ×" + ((MG.config.DIFFICULTY[st.hunt.difficulty || 0] || {}).mult || 1) + "・建築加成）— 精英怪 3 倍" },
            MG.ui.dom.h("span", { style: { color: "#ffd166" } }, "⚔+" + MG.util.fmt(lm.gold) + "金"),
            MG.ui.dom.h("span", { style: { color: "#7ee787" } }, "+" + MG.util.fmt(lm.exp) + "經驗"),
            !bossStage ? MG.ui.dom.h("span", { style: { color: "var(--r5)" } }, "距BOSS " + (MG.config.MAX_STAGE_PER_REGION - (st.hunt.stage % MG.config.MAX_STAGE_PER_REGION)) + "關") : MG.ui.dom.h("span", { style: { color: "var(--r5)" } }, "BOSS關・原地再戰"));
          stageEl.appendChild(rewardRow);
        } catch (e) { /* 收益預覽非關鍵路徑：失敗不影響關卡列 */ }
        // v201 UI/UX：戰力門檻常駐（隊伍 vs 建議，三色狀態 — AFK Arena 同款決策支援）
        try {
          const tp = teamPower();
          const req = stagePowerReq(st.hunt.region, st.hunt.stage);
          const ratio = tp / Math.max(1, req);
          const color = ratio >= 1 ? "#7ee787" : ratio >= 0.7 ? "#ffd166" : "#ff5c5c";
          const label = ratio >= 1 ? "穩過" : ratio >= 0.7 ? "吃力" : "建議退關練角";
          stageEl.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "center", gap: 6, fontSize: 9, marginTop: 2, textShadow: "0 1px 2px rgba(0,0,0,0.75)", fontWeight: 800 }, title: "戰力比 " + (ratio * 100).toFixed(0) + "% — 建議戰力隨關卡與難度成長；達標綠燈・七成黃燈・以下建議練角再戰" },
            MG.ui.dom.h("span", { style: { color: "#9db4ff" } }, "隊伍 " + MG.util.fmt(tp)),
            MG.ui.dom.h("span", { style: { color: "rgba(255,255,255,0.4)" } }, "／"),
            MG.ui.dom.h("span", { style: { color } }, "建議 " + MG.util.fmt(req) + "・" + label)));
        } catch (e) { /* 非關鍵路徑 */ }
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
    const auto = !!st.hunt.autoDispatch;
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
            title: unlocked ? "第 " + (n + 1) + " 隊" + ((st.activeTeam || 0) === n ? "（目前出戰隊）" : "") + " — " + info.members + "/" + info.slots + " 人・戰力 " + MG.util.fmt(info.power) + "。點擊切換出戰隊" : "第 " + (n + 1) + " 隊需酒館 Lv" + (n * 2) + " 解鎖",
            on: unlocked ? { click: () => { MG.sys.hunters.setActiveTeam(n); syncDom(MG.sys.battle.get()); } } : {}
          },
            MG.ui.dom.h("div", { style: { fontSize: 10, fontWeight: 900 } }, unlocked ? "第 " + (n + 1) + " 隊" : "🔒 第 " + (n + 1) + " 隊"),
            MG.ui.dom.h("div", { style: { fontSize: 9, color: "var(--dim)" } }, unlocked ? info.members + "/" + info.slots + " 人 ・ 戰力 " + MG.util.fmt(info.power) : "酒館 Lv" + (n * 2) + " 解鎖")));
        }
      }
    }
    const formationCount = st.formation.filter(id => id && st.hunters.some(h => h.id === id)).length;
    // v550 狀態卡：三態（待機 dim / 休息金黃倒數 / 派遣綠）— 掛機狀態一眼可讀
    if (statusEl) {
      let icon = "⏳", txt = "待機中 — 按下「派遣」率領編隊出征", color = "var(--dim)";
      if (ds.resting) {
        const sec = Math.max(0, Math.ceil(((st.hunt.restUntil || 0) - Date.now()) / 1000));
        icon = "💤";
        txt = "全軍回村休息中 " + sec + " 秒 — 休息完" + (auto ? "自動再戰" : "畢自動待機");
        color = "var(--gold)";
      } else if (ds.ids.length) {
        const dName = MG.config.DIFFICULTY[(st.hunt.difficulty || 0)].name;
        icon = "⚔";
        txt = "派遣中：" + ds.ids.length + " 名英雄 · " + MG.config.stageLabel(st.hunt.stage) + (dName !== "普通" ? " · " + dName : "") + (auto ? " · 自動續戰" : "");
        color = "var(--good)";
      }
      statusEl.textContent = icon + " " + txt;
      statusEl.style.color = color;
      statusEl.title = ds.ids.length && !ds.resting
        ? "編隊 " + ds.ids.length + " 名英雄討伐中 — 自動續戰" + (auto ? "已開" : "未開（休息後待機）") + "・自動進關" + ((st.hunt.autoAdvance !== false) ? "已開（自動前往下一關）" : "關（原地重複討伐）")
        : ds.resting ? "全軍回村休息 — 休息結束後" + (auto ? "自動再戰" : "自動待機")
        : "待機中 — 按下「派遣」出征；睡前開啟自動續戰可掛機" + MG.config.OFFLINE_CAP_H + " 小時";
    }
    // v228 離線收益預覽：派遣價值可視化（關掉前一眼看到 — 放置核心決策；v228FIX 三分支文案＋config 上限）
    // v550：速率金色加粗（放置核心數字），分支說明與在線專注留 dim — 層次不再倒置
    if (offPreviewEl) {
      const off = MG.core.save.previewOffline();
      const capH = MG.config.OFFLINE_CAP_H;
      const farming = !!(ds.ids.length && !ds.resting);
      if (farming) {
        offPreEl.textContent = "離線（上限 " + capH + " 小時）：";
        offRateEl.textContent = "+" + MG.util.fmt(off.goldPerH) + " 金/時・+" + MG.util.fmt(off.expPerH) + " 經驗/時";
        offRateEl.style.color = "var(--gold)";
        // v234 在線專注：連續在線每小時 +5%（封頂 4 層 — 開著比關著划算的修正）
        // v234FIX：僅派遣狀態 touch streak（原無派遣掛狩獵頁也續 — 與「派遣狀態」語義不符、跨畫面不一致）
        const fl = MG.sys.battle.focusLayers();
        offNoteEl.textContent = fl > 0 ? "　🔥 在線專注 ×" + (1 + MG.config.ACTIVE_FOCUS.perHour * fl).toFixed(2) + "（" + fl + "/" + MG.config.ACTIVE_FOCUS.max + "h）" : "";
      } else if (ds.resting) {
        offPreEl.textContent = "";
        offRateEl.textContent = "離線收益：全軍休息中 = 0";
        offRateEl.style.color = "var(--dim)";
        offNoteEl.textContent = auto ? "（休息結束自動再戰）" : "（休息完畢自動待機）";
      } else {
        offPreEl.textContent = "";
        offRateEl.textContent = "離線收益：未派遣 = 0";
        offRateEl.style.color = "var(--dim)";
        offNoteEl.textContent = "（睡前記得派遣）";
      }
      offPreviewEl.title = farming
        ? "關閉頁面後依此速率累積（上限 " + capH + " 小時）：每小時 +" + MG.util.fmt(off.goldPerH) + " 金幣・+" + MG.util.fmt(off.expPerH) + " 經驗" + (off.matsPerH ? "・素材 +" + off.matsPerH : "")
        : ds.resting ? "全軍休息中（" + Math.ceil((ds.restUntil - Date.now()) / 1000) + " 秒後自動再戰）— 休息期間離線無收益"
        : "派遣編隊後離線才有收益 — 上限 " + capH + " 小時";
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
    if (autoBtn) {
      autoBtn.className = "btn sm" + (auto ? " gold" : "");
      const autoKey = "a:" + auto;
      if (autoKey !== lastAutoBtnKey) {
        lastAutoBtnKey = autoKey;
        autoBtn.textContent = "自動續戰";
        autoBtn.className = "btn sm " + (auto ? "green" : "blue");
      }
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
    if (hpEl) hpEl.textContent = "補滿 x" + potQty("item_pot_hp");
    const mpEl = document.getElementById("pot-mp");
    if (mpEl) mpEl.textContent = "補滿 x" + potQty("item_pot_mp");
    // idle coach — v561FIX：三態分流（空編隊=教學遮罩／滿編待機=「立即派遣」／派遣中・休息中=隱藏）
    if (coachEl) {
      const mode = coachMode(F, ds, formationCount);
      const coachKey = mode + ":" + formationCount;
      if (coachKey !== lastCoachKey) {
        lastCoachKey = coachKey;
        if (mode === "hidden") coachEl.style.display = "none";
        else { coachEl.style.display = "flex"; buildCoachContent(mode, formationCount); }
      }
    }
    // team strip — 固定顯示「編隊」格位（空格=編隊空位；派遣時疊加戰鬥狀態）
    if (teamEl) {
      // 效能：待機/休息中編隊列不會變（無 HP 跳動）→ 簽名相同就跳過重建；
      // 派遣中 HP 每 tick 變 → 維持 4Hz 重建（即時血條是戰鬥回饋核心）
      const fighting = !!(F.team && F.team.length);
      if (!fighting) {
        const teamSig = st.formation.join(",") + "|" + st.hunters.length + "|" + st.hunters.map(h => MG.sys.hunters.power(h)).join(",") + "|R" + st.hunt.region; // v206：切區後克標即時重建
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
          logEl.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 6, alignItems: "center", fontSize: 11, color: "var(--dim)", padding: "1px 0" }, title: "戰鬥紀錄（最近 8 筆）— 擊殺/掉落/事件即時彙總" },
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
      // v160 無盡深淵：第 5 區域通關解鎖（index 10 特殊判定）
      const unlocked = (MG.sys.abyss && i === MG.sys.abyss.INDEX) ? MG.sys.abyss.unlocked() : i <= (st.stats.maxRegionReached || 0);
      const isCur = st.hunt.region === i;
      chipsEl.appendChild(MG.ui.dom.h("div", {
        class: "chip" + (isCur ? " on" : ""),
        style: unlocked ? {} : { opacity: 0.55 },
        title: unlocked ? ("前往「" + r.name + "」討伐" + (r.boss ? " · BOSS「" + r.boss.name + "」" : "")) : ("尚未解鎖「" + r.name + "」"),
        on: { click: () => selectRegion(i) }
      }, unlocked ? "" : MG.ui.dom.icon("icon_lock", 12),
        MG.ui.dom.icon((r.monsters[0] || {}).sprite || "icon_sword", 14),
        r.name + (isCur ? " Lv" + st.hunt.stage : ""),
        MG.ui.dom.h("span", {
          style: { fontSize: 9, fontWeight: 900, color: (MG.config.ELEMENTS[r.element] || {}).color || "var(--dim)", marginLeft: 2 }
        }, (MG.config.ELEMENTS[r.element] || {}).name || "")));
    });
  }
  function selectRegion(i) {
    const st = S();
    // v160 無盡深淵 chip：進入深淵（而非普通切區）
    if (MG.sys.abyss && i === MG.sys.abyss.INDEX) {
      const r = MG.sys.abyss.enter();
      MG.ui.dom.toast(r.ok ? "踏入無盡深淵，第 " + r.stage + " 層" : r.reason, r.ok ? "good" : "bad", "icon_skull");
      if (r.ok) { refreshChips(); syncDom(MG.sys.battle.get()); }
      return;
    }
    const r = REGIONS()[i];
    if (i > (st.stats.maxRegionReached || 0)) { MG.ui.dom.toast("尚未抵達「" + r.name + "」（攻略前一區域的BOSS後解鎖）", "bad", "icon_lock"); return; }
    if (st.hunt.region === i) return;
    // 必須等當前戰鬥結束才能切換地圖（英雄生命是持續性的，切換不會補血）
    const F = MG.sys.battle.get();
    if (F.phase === "fight") { MG.ui.dom.toast("戰鬥進行中！等當前戰鬥結束後再切換地圖", "bad", "icon_sword"); return; }
    st.hunt.region = i; st.hunt.stage = Math.min(st.hunt.stage, 10);
    st.hunt.wipeStreak = 0;
    // v258FIX：從深淵切出（區域 chip 繞過 leave()）→ 清除連續挑戰（防下次踏入自動續戰靜默重啟）
    if (MG.sys.abyss && i !== MG.sys.abyss.INDEX && st.abyss) st.abyss.autoRetry = false;
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
    MG.ui.dom.toast(n === 10 ? "前往「" + REGIONS()[st.hunt.region].name + "」BOSS 關，原地重複討伐！" : "駐紮" + MG.config.stageLabel(n) + "練角", "", "icon_sword");
    // v209：重複討伐提醒（僅今日該區域首殺已用時顯示 — 首次選關仍會領取獎勵）
    if (n % MG.config.MAX_STAGE_PER_REGION === 0) {
      const br = st.stats.bossRewards || {};
      if (br.day === MG.util.today() && br.perRegion && br.perRegion[st.hunt.region]) {
        MG.ui.dom.toast("重複討伐 BOSS：僅每日每區域首殺獎勵鑽石/榮譽（其餘掉落照常）", "", "icon_skull");
      }
    }
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
  /* v236 最佳練功點：掃描已解鎖區域×難度×關卡 — 出戰隊可穩過（tp≥req）中收益最高者
     v560 單一來源：改由引擎端 MG.sys.battle.bestFarmSpot 提供（連敗回退遷移同源，防兩處公式漂移） */
  function bestFarmSpot() {
    return MG.sys.battle.bestFarmSpot();
  }
  function openDispatchDialog(team) {
    const st = S();
    const m = MG.ui.dom.modal("派遣目的地", null, { icon: "icon_sword" });
    const body = m.panel;
    const ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ"];
    function renderD() {
      body.innerHTML = "";
      const r = REGIONS()[st.hunt.region];
      const d = MG.config.DIFFICULTY[st.hunt.difficulty || 0] || MG.config.DIFFICULTY[0];
      body.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 8 } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 17 } }, "前往「" + r.name + "」"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } },
          d.name + "難度 ・ " + MG.config.stageLabel(st.hunt.stage) + " ・ 出戰 " + team.length + " 名英雄")));
      // v236 最佳練功點：成長後一鍵定位最高收益可農關卡（免除逐區手動比對 — 純建議不自動派遣）
      try {
        const best = bestFarmSpot();
        if (best) {
          const reg = REGIONS()[best.r];
          const cur = (st.hunt.region === best.r && st.hunt.stage === best.n && (st.hunt.difficulty || 0) === best.d);
          body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,209,102,.08)", border: "1px solid rgba(255,209,102,.35)", padding: "6px 10px", borderRadius: 8, marginBottom: 8, fontSize: 11 }, title: "依出戰隊戰力自動掃描已解鎖關卡 — 在可穩過的關卡中挑選單場收益最高者（含難度倍率・建築加成）" },
            MG.ui.dom.h("span", { style: { fontWeight: 800, color: "var(--gold)" } },
              "最佳練功點：", reg.name, "・", MG.config.stageLabel(best.n), "・", MG.config.DIFFICULTY[best.d].name),
            MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10 } },
              "+" + MG.util.fmt(best.gold) + " 金/+" + MG.util.fmt(best.exp) + " 經驗/擊殺"),
            cur ? null : MG.ui.dom.h("button", {
              class: "btn sm gold", style: { padding: "2px 8px", minHeight: 24 },
              on: { click: () => { st.hunt.region = best.r; st.hunt.stage = best.n; st.hunt.difficulty = best.d; st.hunt.wipeStreak = 0; st.hunt.pendingHp = undefined; MG.sys.battle.reset(); renderD(); } }
            }, "前往")));
        }
      } catch (e) { /* 非關鍵路徑 */ }
      // v321：BOSS 關機制預告（派遣前知道要面對什麼）
      if (st.hunt.stage % MG.config.MAX_STAGE_PER_REGION === 0) {
        const boss = r.boss;
        const mechDef = boss && boss.mech ? MG.config.BOSS_MECHS[boss.mech] : null;
        if (boss) {
          body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,92,138,.1)", border: "1px solid rgba(255,92,138,.4)", padding: "6px 10px", borderRadius: 8, marginBottom: 8, fontSize: 11 }, title: "BOSS 關：每日首殺額外獎勵鑽石/榮譽（每區域每日 1 次）— 建議先看機制再派遣" },
            MG.ui.dom.icon("icon_skull", 16),
            MG.ui.dom.h("span", { style: { fontWeight: 800, color: "#ff9a9a" } }, "BOSS「" + boss.name + "」"),
            mechDef ? MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10 } }, "機制【" + mechDef.name + "】" + mechDef.desc) : null));
        }
      }
      // 關卡情報（先看情報再選擇）
      body.appendChild(MG.ui.dom.h("button", {
        class: "btn sm blue", style: { width: "100%", marginBottom: 8 },
        on: { click: () => showRegionInfo(st.hunt.region) }
      }, "查看關卡情報（戰利品・掉落率・BOSS）"));
      // v201 UI/UX：派遣視窗戰力門檻（出戰隊 vs 目前關卡建議）
      try {
        const tp = teamPower();
        const req = stagePowerReq(st.hunt.region, st.hunt.stage);
        const ratio = tp / Math.max(1, req);
        const color = ratio >= 1 ? "#7ee787" : ratio >= 0.7 ? "#ffd166" : "#ff5c5c";
        const label = ratio >= 1 ? "穩過" : ratio >= 0.7 ? "吃力" : "建議退關練角";
        body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid var(--line)", padding: "8px 10px", borderRadius: 8, marginBottom: 8, fontSize: 12 }, title: "出戰隊總戰力 vs 目前關卡建議值（含難度倍率）— 綠=穩過・黃=吃力（建議強化或降難度）・紅=建議退關練角" },
          MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "出戰隊戰力"),
          MG.ui.dom.h("span", { style: { fontWeight: 900, color } },
            MG.util.fmt(tp) + " ／ 建議 " + MG.util.fmt(req) + "・" + label)));
      } catch (e) { /* 非關鍵路徑 */ }
      // v206：出戰隊克制彙總（區域元素 vs 隊員元素 — +25% 決策支援）
      try {
        const regionEl = (MG.data.monsters.regions[st.hunt.region] || {}).element;
        if (regionEl) {
          const counters = team.filter(h => MG.config.ELEMENT_COUNTER[MG.config.CLASS_ELEMENT[h.cls]] === regionEl).length;
          const elName = (MG.config.ELEMENTS[regionEl] || {}).name || "";
          if (counters > 0) {
            body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(87,201,107,.1)", border: "1px solid rgba(87,201,107,.4)", padding: "6px 10px", borderRadius: 8, marginBottom: 8, fontSize: 11 } },
              MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "元素克制"),
              MG.ui.dom.h("span", { style: { fontWeight: 900, color: "#57c96b" } }, counters + " 名克制「" + elName + "」區域 ＋25%")));
          }
        }
      } catch (e) { /* 非關鍵路徑 */ }
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
      const colBtn = (active, locked, onClick, kids, tip) => MG.ui.dom.h("div", {
        class: "chip" + (active ? " on" : ""),
        style: Object.assign({ width: "100%", justifyContent: "flex-start", padding: "5px 7px", minHeight: 34, fontSize: 15, flex: "0 0 auto" }, locked ? { opacity: 0.5 } : {}),
        title: tip || "",
        on: { click: onClick }
      }, ...kids);
      const grid = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 } });
      // 左：章節（區域）
      const colR = MG.ui.dom.h("div", { style: colStyle },
        colHead("章節"),
        REGIONS().map((rr, i) => colBtn(st.hunt.region === i, i > (st.stats.maxRegionReached || 0),
          () => { if (i > (st.stats.maxRegionReached || 0)) return; st.hunt.region = i; st.hunt.wipeStreak = 0; MG.sys.battle.reset(); renderD(); },
          [MG.ui.dom.icon((rr.monsters[0] || {}).sprite || "icon_sword", 15), MG.ui.dom.h("span", { style: { fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, rr.name)],
          i > (st.stats.maxRegionReached || 0) ? ("尚未解鎖「" + rr.name + "」（攻略前一區域 BOSS）") : ("前往「" + rr.name + "」討伐" + (rr.boss ? " · BOSS「" + rr.boss.name + "」" : "")))));
      // 中：小關（1-9 + BOSS）
      const colS = MG.ui.dom.h("div", { style: colStyle },
        colHead("小關"),
        Array.from({ length: MG.config.MAX_STAGE_PER_REGION }, (_, k) => k + 1).map(n => colBtn(st.hunt.stage === n, (st.stats.maxStage || 1) < n,
          () => { if ((st.stats.maxStage || 1) < n) return; st.hunt.stage = n; st.hunt.wipeStreak = 0; MG.sys.battle.reset(); renderD(); },
          [MG.ui.dom.h("span", { style: { fontSize: 15, fontWeight: 900, lineHeight: 1.1, minWidth: 22, textAlign: "center" } }, n === 10 ? "☠" : String(n)), MG.ui.dom.h("span", { style: { fontSize: 15 } }, n === 10 ? "BOSS" : "關")],
          n === 10 ? ("BOSS「" + (r.boss ? r.boss.name : "???") + "」" + (r.boss ? " — 掉寶率提升" : "")) : ("對戰「" + r.monsters[(n - 1) % r.monsters.length].name + "」"))));
      // 右：難度（羅馬數字）— v204：效率提示（金幣/經驗與敵方同倍率 — 不再是自我懲罰）
      const colD = MG.ui.dom.h("div", { style: colStyle },
        colHead("難度"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, textAlign: "center", marginBottom: 2 } }, "金幣/經驗 ×難度（防禦不縮放）"),
        MG.config.DIFFICULTY.map((dd, i) => colBtn((st.hunt.difficulty || 0) === i, (st.stats.maxRegionReached || 0) < dd.unlockRegion,
          () => { if ((st.stats.maxRegionReached || 0) < dd.unlockRegion) return; st.hunt.difficulty = i; st.hunt.pendingHp = undefined; MG.sys.battle.reset(); renderD(); },
          [MG.ui.dom.h("span", { style: { fontSize: 15, fontWeight: 900, lineHeight: 1.1, minWidth: 20, textAlign: "center" } }, ROMAN[i]), MG.ui.dom.h("span", { style: { fontSize: 15 } }, dd.name)],
          (st.stats.maxRegionReached || 0) < dd.unlockRegion ? ("攻略第 " + (dd.unlockRegion + 1) + " 區域後解鎖") : ("難度 ×" + dd.mult + " — 金幣/經驗 ×" + dd.gold + "（防禦不縮放）"))));
      grid.appendChild(colR);
      grid.appendChild(colS);
      grid.appendChild(colD);
      body.appendChild(grid);
      // 戰利品預覽
      const pm = MG.sys.loot.scaledMonster(st.hunt.region, st.hunt.stage);
      body.appendChild(MG.ui.dom.h("div", { class: "panel2", style: { padding: "6px 10px", marginBottom: 10, display: "flex", justifyContent: "space-between", fontSize: 12 }, title: "單場戰利品預覽（含難度 ×" + ((MG.config.DIFFICULTY[st.hunt.difficulty || 0] || {}).mult || 1) + "・建築加成・精英 3 倍）" },
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
    const region = REGIONS()[st.hunt.region];
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
  function toggleAuto() {
    const st = S();
    st.hunt.autoDispatch = !st.hunt.autoDispatch;
    MG.core.audio.SFX.click();
    MG.ui.dom.toast(st.hunt.autoDispatch ? "自動續戰：休息完將自動再派遣編隊" : "自動續戰：關閉 — 休息完回待機", "", "icon_repeat");
    syncDom(MG.sys.battle.get());
  }
  // 自動進關開關：關閉時擊敗魔物後原地重複討伐當前關卡（龜著練角）
  function toggleAutoAdvance() {
    const st = S();
    st.hunt.autoAdvance = st.hunt.autoAdvance !== false ? false : true;
    // v572：玩家手動切換 = 明確意圖 — 清除引擎退守牆點 marker（手動關閉 = 練角專用，永不自動恢復）
    st.hunt.aaPark = null;
    delete st.hunt.aaParkT;
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
  /* v201 關卡建議戰力（參數化 recPower — 原只算 BOSS 關；非 BOSS 關無 bossMul、隨關卡成長）
     v560 單一來源：改由引擎端 MG.sys.battle.stagePowerReq 提供（連敗回退遷移同源，防兩處公式漂移） */
  function stagePowerReq(regionIdx, stage, diffMult) {
    return MG.sys.battle.stagePowerReq(regionIdx, stage, diffMult);
  }
  function recPower(r) {
    // recommended team power to clear stage 10 (boss) of this region
    const dm = (MG.config.DIFFICULTY[(S().hunt.difficulty || 0)] || MG.config.DIFFICULTY[0]).mult;
    const b = r.boss;
    const bossMul = r.tier <= 2 ? 2.4 : r.tier <= 4 ? 3 : 4;
    const scale = 1 + 0.16 * 9;
    const hp = b.hp * scale * bossMul * dm;
    const atk = b.atk * scale * bossMul * dm;
    // v201FIX：def 項補乘 scale×bossMul（與 scaledMonster 一致 — 原漏乘致 BOSS 關建議值不一致）；v204FIX：防禦不乘難度
    const v = (hp / 1.6 + atk * 6 + b.def * scale * bossMul * 2) / 2;
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
    // v583 掉落 parity：顯示率 = dropInfoOf（與 rollKill 同 dMul — 難度切換時顯示隨之正確變化，v256 單一來源）
    const di = MG.sys.loot.dropInfoOf(regionIdx, st.hunt.stage) || {};
    const potRate = di.potRate != null ? di.potRate : MG.sys.loot.potionRateOf(regionIdx, m.boss);
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
    for (const drop of (di.drops || m.drops || [])) { // v583 修正輪：素材行改讀 dropInfoOf 的 c（×dMul clamp 0.95，與 rollKill 同源；DIFFICULTY dMul=1/普通時與改前逐位元一致）
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
      MG.ui.dom.h("span", { style: { fontWeight: 800 } }, m.boss ? "100%（BOSS保證）" : Math.round((di.eqRate != null ? di.eqRate : MG.config.DROP_RATES.eq) * 100) + "%"))); // v256 收斂 // v583 難度倍率
    rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between" } },
      MG.ui.dom.h("span", null, "寶石 / 技能書"),
      MG.ui.dom.h("span", { style: { fontWeight: 800 } }, Math.round((di.gemRate != null ? di.gemRate : MG.config.DROP_RATES.gem) * 100) + "% / " + Math.round((di.bookRate != null ? di.bookRate : MG.config.DROP_RATES.book) * 100) + "%"))); // v256 收斂 // v583 難度倍率
    if (m.boss) rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", color: "var(--r5)" } },
      MG.ui.dom.h("span", null, "BOSS額外"),
      MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "寶石×1・榮譽+2・招募券 " + Math.round((di.bossTicket != null ? di.bossTicket : MG.config.DROP_RATES.bossTicket) * 100) + "%・書 " + Math.round((di.bossBook != null ? di.bossBook : MG.config.DROP_RATES.bossBook) * 100) + "%"))); // v256 收斂 // v583 難度倍率
    rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", color: "var(--dim)", fontSize: 11 } },
      MG.ui.dom.h("span", null, "難度「" + d.name + "」加成"),
      MG.ui.dom.h("span", null, "金幣 x" + d.gold + "・經驗 x" + d.exp)));
    return MG.ui.dom.h("div", { style: { background: "var(--panel2)", padding: "8px 10px", borderRadius: 8, marginBottom: 8, fontSize: 12, lineHeight: 1.8 }, title: "掉落率為每場擊殺基礎值（難度倍率已含；BOSS 保證裝備掉落）— 素材用於建築升級與突破" },
      MG.ui.dom.h("div", { style: { fontWeight: 900, marginBottom: 2, color: "var(--gold)" } },
        "戰利品（第 " + st.hunt.stage + " 關" + (m.boss ? "・BOSS" : "") + "）"),
      rows);
  }
  /* v149：顯示克制此區域元素的職業（元素相剋 +25%） */
  function elementCounterHint(r) {
    const re = r && r.element;
    if (!re) return "";
    const counterEl = Object.keys(MG.config.ELEMENT_COUNTER).find(k => MG.config.ELEMENT_COUNTER[k] === re);
    if (!counterEl) return "";
    const clsNames = Object.keys(MG.config.CLASS_ELEMENT)
      .filter(c => MG.config.CLASS_ELEMENT[c] === counterEl)
      .map(c => (MG.data.hunters.classes[c] || {}).name || c);
    const el = MG.config.ELEMENTS[counterEl] || {};
    return clsNames.length ? "克制：" + clsNames.join("、") + "（" + (el.name || "") + "）＋25%" : "";
  }
  function showRegionInfo(i) {
    const st = S();
    const r = REGIONS()[i];
    if (!r) return;
    const tp = teamPower(), rp = recPower(r);
    const adv = tp >= rp;
    const body = MG.ui.dom.h("div", { style: { fontSize: 13, lineHeight: 1.55 } },
      MG.ui.dom.h("div", { style: { color: "var(--dim)", marginBottom: 4 } }, r.desc),
      MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid var(--line)", padding: "8px 12px", borderRadius: 8, marginBottom: 8, fontSize: 13 }, title: "區域魔物元素 — 克制它的職業（counter 元素）傷害 +25%；建議編入克元素英雄" },
        MG.ui.dom.h("span", { style: { fontWeight: 800 } },
          "區域元素：", MG.ui.dom.h("span", { style: { color: (MG.config.ELEMENTS[r.element] || {}).color || "var(--text)", fontWeight: 900 } },
            (MG.config.ELEMENTS[r.element] || {}).name || "")),
        MG.ui.dom.h("span", { style: { color: "#ffd166", fontSize: 12 } }, elementCounterHint(r))),
      MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid var(--line)", padding: "9px 12px", borderRadius: 8, margin: "8px 0 4px", fontSize: 14 }, title: "建議戰力 = 區域基礎 × 關卡成長 × 難度倍率（BOSS 關 ×1.4）— 達標 100% 綠燈・70% 黃燈・以下建議練角再戰" },
        MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "建議戰力（BOSS 關）"),
        MG.ui.dom.h("span", { style: { color: adv ? "#7ee787" : "#ffd166", fontWeight: 900, fontSize: 15, fontVariantNumeric: "tabular-nums" } }, MG.util.fmt(rp))),
      MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid " + (adv ? "rgba(126,231,135,.5)" : "var(--line)"), padding: "9px 12px", borderRadius: 8, marginBottom: 8, fontSize: 14 }, title: adv ? "出戰編隊總戰力已達建議值 — 派遣即可穩定討伐" : "出戰編隊總戰力未達建議值 — 可先強化裝備/訓練/升星，或降低難度" },
        MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "目前隊伍戰力"),
        MG.ui.dom.h("span", { style: { color: adv ? "#7ee787" : "var(--r5)", fontWeight: 900, fontSize: 15, fontVariantNumeric: "tabular-nums" } },
          MG.util.fmt(tp) + (adv ? "　✓ 已達標" : "　⚠ 稍嫌不足"))),
      MG.ui.dom.h("div", { style: { display: "flex", gap: 6, alignItems: "flex-start", color: "var(--gold)", marginBottom: 8, fontSize: 12 } },
        MG.ui.dom.icon("icon_goldbag", 16), MG.ui.dom.h("span", null, r.lootNote)),
      lootInfoBlock(i),
      MG.ui.dom.h("div", { style: { display: "flex", gap: 8, alignItems: "flex-start", background: "var(--panel2)", padding: "8px 10px", borderRadius: 8, marginBottom: 8 }, title: "BOSS 每日首殺獎勵鑽石/榮譽（每區域每日 1 次）— 機制對策：盾=破盾需高頻攻擊・回復=打斷吸血・毒=需要治療・全體=後排減傷站位" },
        MG.ui.dom.icon(r.boss.sprite, 26),
        MG.ui.dom.h("div", null,
          MG.ui.dom.h("div", { style: { fontWeight: 800, color: "var(--r5)" } },
            "BOSS：" + r.boss.name + (r.boss.flavor ? "　" + r.boss.flavor : "")),
          r.boss.mech ? MG.ui.dom.h("div", { style: { color: "var(--gold)", fontSize: 11, marginTop: 2 } },
            "【" + ((MG.config.BOSS_MECHS[r.boss.mech] || {}).name || r.boss.mech) + "】" + ((MG.config.BOSS_MECHS[r.boss.mech] || {}).desc || "")) : null,
          MG.ui.dom.h("div", { style: { color: "var(--dim)", fontSize: 12 } }, r.bossDesc))),
      MG.ui.dom.h("div", { style: { fontWeight: 800, margin: "4px 0", color: "var(--dim)" } }, "此地魔物"),
      ...r.monsters.map(m => MG.ui.dom.h("div", { style: { display: "flex", gap: 8, padding: "2px 0", alignItems: "flex-start" } },
        MG.ui.dom.icon(m.sprite, 16),
        MG.ui.dom.h("span", { style: { fontSize: 12 }, title: m.name + (m.flavor ? " — " + m.flavor : "") + "（" + r.name + "・" + ((MG.config.ELEMENTS[r.element] || {}).name || "") + "屬性）" },
          MG.ui.dom.h("b", null, m.name),
          MG.ui.dom.h("span", { style: { color: "var(--dim)" } }, "　" + (m.flavor || ""))))));
    MG.ui.dom.modal(r.name + "　地圖情報", body, { wide: true, icon: "icon_sword" });
  }
  /* ---------- 空編隊/待機 coach（v561FIX）：三態分流 ----------
     原以 F.team（派遣中隊伍）判定 → 滿編待機玩家恆見「出戰隊尚未編入英雄」矛盾遮罩
     （編隊明明滿員＋「派遣 5 人」鈕，遮罩卻叫玩家去編英雄）；
     且 recall 後 F.team 殘留（dispatchIds 清空後 battle.step 不再運行，team 不重建），
     休息中 F.team 亦為空 → 遮罩與「全軍回村休息中」倒數同框。修正後以
     dispatchIds（與場景繪製同源唯一真相）判定：empty = 編隊真空（教學遮罩，原文案）；
     ready = 滿編待機（輕量「立即派遣」卡，一鍵開派遣視窗 — 睡前派遣儀式零摩擦）；
     hidden = 派遣中/休息中（畫布自繪狀態）。 */
  function coachMode(F, ds, formationCount) {
    if (ds.ids.length) return "hidden";   // 派遣中（dispatchIds 為唯一真相）
    if (ds.resting) return "hidden";      // 休息中（畫布已有 💤 倒數橫幅）
    return formationCount === 0 ? "empty" : "ready";
  }
  function buildCoachContent(mode, count) {
    const U = MG.ui.dom;
    coachEl.innerHTML = "";
    coachEl.style.background = mode === "empty" ? "rgba(10,12,24,0.82)" : "transparent";
    coachEl.style.justifyContent = mode === "empty" ? "center" : "flex-start";
    coachEl.style.padding = mode === "empty" ? "0 24px" : "76px 10px 0"; // ready 卡置於關卡標題列（~63px＋邊距）之下，不遮資訊
    coachEl.style.pointerEvents = mode === "empty" ? "auto" : "none"; // ready 模式穿透，城鎮場景可見
    if (mode === "empty") {
      coachEl.appendChild(U.icon("icon_formation", 30));
      coachEl.appendChild(U.h("div", { style: { color: "var(--text)", fontWeight: 800, fontSize: 14 } }, "出戰隊尚未編入英雄"));
      coachEl.appendChild(U.h("div", { style: { color: "var(--dim)", fontSize: 12, lineHeight: 1.6 } }, "編入英雄後按下「派遣」，編隊將前往地圖戰鬥。擊敗魔物換取金幣、素材與寶物；全軍倒下會自動回村休息。"));
      coachEl.appendChild(U.h("button", { class: "btn gold", style: { marginTop: 4, pointerEvents: "auto" }, on: { click: () => MG.ui.screens.show("hunters") } }, "前往「英雄」分頁編入英雄"));
    } else {
      const team = () => S().formation.filter(id => id && S().hunters.some(h => h.id === id));
      coachEl.appendChild(U.h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "rgba(10,12,24,0.85)", border: "2px solid var(--line)", outline: "1px solid var(--gold2)", outlineOffset: "-1px", padding: "8px 14px 10px", pointerEvents: "auto" } },
        U.h("div", { style: { color: "var(--gold)", fontWeight: 900, fontSize: 13 } }, "編隊就緒 · " + count + " 名英雄待命"),
        U.h("div", { style: { color: "var(--dim)", fontSize: 11, lineHeight: 1.5, textAlign: "center" } }, "按下「派遣」率領編隊出征 — 關閉遊戲也會持續累積離線收益。"),
        U.h("button", { class: "btn gold", style: { marginTop: 2, minWidth: 140 }, on: { click: () => openDispatchDialog(team()) } }, "立即派遣")));
    }
  }
  const screen = {
    render(root) {
      root.innerHTML = "";
      // 畫面重建 = 全新 DOM：重置綁定在舊元素上的簽名快取，否則重進分頁時
      // 區域 chips／編隊列／戰鬥紀錄會被舊簽名擋住而整段空白
      chipsSig = ""; lastTeamSig = ""; lastLogKey = ""; lastStageKey = "";
      lastDispBtnKey = ""; lastAutoBtnKey = ""; lastAdvBtnKey = ""; lastCoachKey = "";
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
        title: "關卡情報：戰利品・掉落率・BOSS 機制・此地魔物",
        on: { click: () => showRegionInfo(S().hunt.region) }
      }, "ⓘ");
      wrap.appendChild(infoFab);
      // idle coach overlay（v561：內容由 buildCoachContent 依狀態重建 — 空編隊教學／滿編待機「立即派遣」）
      coachEl = MG.ui.dom.h("div", { style: { position: "absolute", inset: 0, display: "none", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(10,12,24,0.82)", textAlign: "center", padding: "0 24px", zIndex: 3 } });
      wrap.appendChild(coachEl);
      root.appendChild(wrap);
      // controls
      controlsEl = MG.ui.dom.h("div", { style: { padding: "0 10px" } });
      teamOverviewEl = MG.ui.dom.h("div", { style: { display: "flex", gap: 6, overflowX: "auto", padding: "6px 0 2px", scrollbarWidth: "thin" } });
      controlsEl.appendChild(teamOverviewEl);
      const st = S();
      // v120：目的地選擇（區域/難度/關卡）全部移入「派遣」視窗，主畫面不再重複放置
      // v550 派遣狀態卡：掛機狀態＋離線收益一眼可讀（面板容器＋狀態色＋金色速率）
      const statusWrap = MG.ui.dom.h("div", { style: { marginTop: 8, background: "var(--panel2)", border: "2px solid var(--line)", borderRadius: 10, padding: "7px 10px 8px" } });
      statusEl = MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, lineHeight: 1.5 } });
      offPreviewEl = MG.ui.dom.h("div", { style: { display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap", marginTop: 2, fontSize: 11 } });
      offPreEl = MG.ui.dom.h("span", { style: { color: "var(--dim)" } });
      offRateEl = MG.ui.dom.h("span", { style: { color: "var(--gold)", fontWeight: 800 } });
      offNoteEl = MG.ui.dom.h("span", { style: { color: "var(--dim)" } });
      offPreviewEl.appendChild(offPreEl);
      offPreviewEl.appendChild(offRateEl);
      offPreviewEl.appendChild(offNoteEl);
      statusWrap.appendChild(statusEl);
      statusWrap.appendChild(offPreviewEl);
      controlsEl.appendChild(statusWrap);
      // 派遣 / 回村待機 / 自動續戰 / 速度
      const row = MG.ui.dom.h("div", { style: { display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" } },
        MG.ui.dom.h("button", { class: "btn sm gold", style: { flex: 1, minWidth: 90 }, title: "派遣出戰編隊前往所選區域/難度/關卡（點擊開啟目的地選擇）", on: { click: dispatchNow } },
          "派遣"),
        MG.ui.dom.h("button", { class: "btn sm green", style: { flex: 1, minWidth: 90, display: "none" }, title: "召回部隊回村待機（休息回滿後可再派遣）", on: { click: recallNow } },
          "回村待機"),
        MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1, minWidth: 100 }, title: "全軍休息完自動再派遣編隊（離線最多 12 小時）", on: { click: toggleAuto } },
          "自動續戰"),
        MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1, minWidth: 100 }, title: "擊敗魔物後自動前往下一關；關閉則原地重複討伐當前關卡", on: { click: toggleAutoAdvance } },
          "自動進關"),
        // v273：從世界地圖進入時顯示「回大地圖」（純導航 — 不觸碰召回/戰鬥語義；一次性消費 — 切走後不再顯示）
        (enteredFromMap ? (enteredFromMap = false, MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1, minWidth: 90 }, on: { click: () => MG.ui.screens.show(MG.ui.map ? "map" : "kingdom") } },
          "⤴ 大地圖")) : null));
      dispatchBtn = row.children[0];
      recallBtn = row.children[1];
      autoBtn = row.children[2];
      advBtn = row.children[3];
      controlsEl.appendChild(row);
      // potions quick
      const potRow = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 } });
      for (const [key, iconName, name, potTip] of [["potAtk", "icon_pot_atk", "攻擊", "攻擊靈藥：30 分鐘內全隊攻擊 +30%（每日重置使用次數）"], ["potGold", "icon_pot_gold", "金幣", "金幣靈藥：30 分鐘內擊殺金幣 +50%（每日重置使用次數）"], ["potExp", "icon_pot_exp", "經驗", "經驗靈藥：30 分鐘內擊殺經驗 +50%（每日重置使用次數）"], ["potBoost", "icon_hourglass", "加速沙漏", "加速沙漏：60 秒內戰鬥速度 ×2（與每日靈藥獨立計次）"]]) {
        const btn = MG.ui.dom.h("button", {
          class: "chip", style: { flex: "1 1 42%", justifyContent: "center", minWidth: 0 }, title: potTip,
          on: { click: () => usePotion(key) }
        }, MG.ui.dom.icon(iconName, 14), MG.ui.dom.h("span", { id: "pot-" + key, style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "靈藥"));
        potEls[key] = btn;
        potRow.appendChild(btn);
      }
      // 生命藥水（補滿全隊）＋ 魔力藥水（補滿全隊）— v193：批量補滿
      potRow.appendChild(MG.ui.dom.h("button", {
        class: "chip", style: { flex: "1 1 42%", justifyContent: "center", minWidth: 0 }, title: "消耗生命藥水立即恢復全隊 50% 生命（出戰中隨時可用）",
        on: { click: useHpPotion }
      }, MG.ui.dom.icon("icon_pot_hp", 14), MG.ui.dom.h("span", { id: "pot-hp", style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "補滿")));
      // v258 QoL：三種靈藥「全部啟用」一鍵批量（每日加成模態鏈 3→1；沙漏時長維度不同不混批）
      potRow.appendChild(MG.ui.dom.h("button", {
        class: "chip gold", style: { flex: "1 1 42%", justifyContent: "center", minWidth: 0 }, title: "一次啟用三種靈藥 N 瓶（效果時間疊加）— 缺貨自動跳過",
        on: { click: bulkUsePotions }
      }, MG.ui.dom.icon("icon_pot_gold", 14), MG.ui.dom.h("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "全部啟用")));
      potRow.appendChild(MG.ui.dom.h("button", {
        class: "chip", style: { flex: "1 1 42%", justifyContent: "center", minWidth: 0 }, title: "消耗魔力藥水立即恢復全隊 50% 魔力（技能資源）",
        on: { click: useMpPotion }
      }, MG.ui.dom.icon("icon_pot_mp", 14), MG.ui.dom.h("span", { id: "pot-mp", style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "補滿")));
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
  /* v258 三種靈藥全部啟用：單一 askQtyModal（上限 = 三種庫存最小）→ 依序啟用 n 瓶（與手動同值：加法疊加/max 不縮短）；缺貨跳過並列出 */
  function bulkUsePotions() {
    const st = S();
    const keys = ["potAtk", "potGold", "potExp"];
    const defs = { potAtk: "item_pot_atk", potGold: "item_pot_gold", potExp: "item_pot_exp" };
    const stocks = keys.map(k => {
      const it = st.inventory.items.find(i => i.defId === defs[k]);
      return it ? (it.qty === undefined ? 1 : it.qty) : 0;
    });
    const maxN = Math.min.apply(null, stocks);
    if (maxN <= 0) { MG.ui.dom.toast("靈藥庫存不足（攻擊/金幣/經驗任一為 0）— 可在商店購買", "bad", "icon_pot_gold"); return; }
    const doUse = n => {
      const skipped = [];
      for (const k of keys) {
        const it = st.inventory.items.find(i => i.defId === defs[k]);
        if (!it || (it.qty === undefined ? 1 : it.qty) < n) { skipped.push(k === "potAtk" ? "攻擊" : k === "potGold" ? "金幣" : "經驗"); continue; }
        it.qty = (it.qty || 1) - n; // v258FIX：qty-less 舊檔守衛（與 usePotion 同款）
        if (it.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== it.uid);
        const now = Date.now();
        st.buffs[k] = Math.max(st.buffs[k] || 0, now) + n * 1800e3; // 30 分鐘/瓶，時間疊加
        MG.core.audio.SFX.potion();
      }
      MG.ui.dom.toast("已啟用 " + n + " 瓶靈藥（各 30 分鐘）" + (skipped.length ? "・缺貨跳過：" + skipped.join("/") : ""), "good", "icon_pot_gold"); // 2Hz refresh 自動更新 chip
    };
    if (maxN > 10) MG.ui.dom.confirm("全部啟用", "啟用 " + maxN + " 瓶 ×3 種靈藥（各 30 分鐘，時間疊加）？", () => doUse(maxN), { okText: "啟用" });
    else askQtyModal("全部啟用", "icon_pot_gold", maxN, doUse); // v258FIX：走單一 askQtyModal（步進選擇 — 合約一致）
  }
  function askQtyModal(name, icon, q, cb) {    const m = MG.ui.dom.modal(name, null, { icon });
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
  // v193 QoL：改為「補滿」批量（循環喝到全隊滿或藥水盡；全滿時不消耗 — 修滿血白耗缺陷）
  function useHpPotion() {
    const st = S();
    const F = MG.sys.battle.get();
    const inFight = !!(F && F.team.length && F.phase === "fight");
    const needs = () => {
      if (inFight) return F.team.some(t => t.hp < t.maxHp);
      return st.hunters.some(h => {
        const max = Math.round(MG.sys.hunters.effectiveStats(h).hp);
        return (h.hp === undefined ? max : h.hp) < max;
      });
    };
    if (!needs()) { MG.ui.dom.toast("全隊生命已滿，無需使用藥水", "", "icon_pot_hp"); return; }
    let used = 0, healed = 0;
    while (needs()) {
      const item = st.inventory.items.find(i => i.defId === "item_pot_hp");
      if (!item || !item.qty) break; // 藥水盡
      item.qty--;
      if (item.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== item.uid);
      used++;
      if (inFight) {
        for (const t of F.team) {
          const amt = Math.round(t.maxHp * 0.5);
          if (t.hp < t.maxHp) { t.hp = Math.min(t.maxHp, t.hp + amt); healed += amt; }
        }
      } else {
        for (const h of st.hunters) {
          const max = Math.round(MG.sys.hunters.effectiveStats(h).hp);
          if (h.hp === undefined) h.hp = max;
          if (h.hp < max) { h.hp = Math.min(max, h.hp + Math.round(max * 0.5)); healed += Math.round(max * 0.5); }
        }
      }
    }
    if (inFight) MG.sys.battle.syncTeamHp();
    MG.core.audio.SFX.potion();
    MG.ui.dom.toast(used > 0 ? "全隊生命已補滿（" + used + " 瓶・恢復 " + MG.util.fmt(healed) + "）" : "藥水用盡，無法補滿", used > 0 ? "good" : "bad", "icon_pot_hp");
    syncDom(MG.sys.battle.get());
  }
  // 魔力藥水：立即恢復全隊 50% 魔力（技能資源）— v193 同型批量補滿
  function useMpPotion() {
    const st = S();
    const F = MG.sys.battle.get();
    const inFight = !!(F && F.team.length && F.phase === "fight");
    const needs = () => {
      if (inFight) return F.team.some(t => t.mp < t.maxMp);
      return st.hunters.some(h => {
        const max = Math.round(MG.sys.hunters.effectiveStats(h).mp);
        return (h.mp === undefined ? max : h.mp) < max;
      });
    };
    if (!needs()) { MG.ui.dom.toast("全隊魔力已滿，無需使用藥水", "", "icon_pot_mp"); return; }
    let used = 0, restored = 0;
    while (needs()) {
      const item = st.inventory.items.find(i => i.defId === "item_pot_mp");
      if (!item || !item.qty) break;
      item.qty--;
      if (item.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== item.uid);
      used++;
      if (inFight) {
        for (const t of F.team) {
          const amt = Math.round(t.maxMp * 0.5);
          if (t.mp < t.maxMp) { t.mp = Math.min(t.maxMp, t.mp + amt); restored += amt; }
        }
      } else {
        for (const h of st.hunters) {
          const max = Math.round(MG.sys.hunters.effectiveStats(h).mp);
          if (h.mp === undefined) h.mp = max;
          if (h.mp < max) { h.mp = Math.min(max, h.mp + Math.round(max * 0.5)); restored += Math.round(max * 0.5); }
        }
      }
    }
    if (inFight) MG.sys.battle.syncTeamHp();
    MG.core.audio.SFX.potion();
    MG.ui.dom.toast(used > 0 ? "全隊魔力已補滿（" + used + " 瓶・恢復 " + MG.util.fmt(restored) + "）" : "藥水用盡，無法補滿", used > 0 ? "good" : "bad", "icon_pot_mp");
    syncDom(MG.sys.battle.get());
  }
  MG.ui.screens.register("hunt", screen);
  /* v246 圖鑑深鏈：一鍵前往目標魔物關卡（守衛：未解鎖區/戰鬥中拒絕 — v226 任務深鏈模式） */
  let enteredFromMap = false; // v273：世界地圖狩獵入口旗標（顯示「回大地圖」— 一次性消費）
  function gotoMonster(regionIdx, stage, fromMap) {
    const st = S();
    if (regionIdx > (st.stats.maxRegionReached || 0)) { MG.ui.dom.toast("尚未抵達該區域", "bad", "icon_sword"); return; }
    // v246FIX：maxStage 推進門檻（與 selectStage 同語義 — 新檔不可一鍵跳關/BOSS 提前首殺）
    if (stage > (st.stats.maxStage || 1)) { MG.ui.dom.toast("尚未推進到此關", "bad", "icon_lock"); return; }
    if (MG.sys.battle.isFighting()) { MG.ui.dom.toast("戰鬥進行中 — 先回村再前往", "bad", "icon_sword"); return; }
    st.hunt.region = regionIdx;
    st.hunt.stage = stage;
    st.hunt.wipeStreak = 0;
    st.hunt.pendingHp = undefined;
    MG.sys.battle.reset();
    enteredFromMap = !!fromMap; // v273FIX：僅地圖入口設（圖鑑深鏈不傳 → false）；消費制見 render
    MG.ui.screens.show("hunt");
    if (typeof refreshChips === "function") refreshChips();
  }
  return Object.assign(screen, { gotoMonster }); // v246：圖鑑深鏈
})();
