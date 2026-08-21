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
    monsterFlash: 0, death: null, killFlash: null, wipeHinted: false, atkUntil: {}, castUntil: {}, hurtUntil: {}, castFx: {}, poisonUntil: {}, // v227：per-skill 施法光暈；v628：killFlash=命終白閃；v630：毒標記
    down: {}, // v552：隊員倒地計時（id → { t: 秒 }，封頂 1s = 靜態屍體）
    bossGreen: 0, // v558：BOSS 回血綠閃（再生/吸血作用瞬間；rm 停用）
    floatMerge: {}, // vN：浮字合併表（bucket key → 現存浮字 ref；同目標短窗同桶累加，O(1) 查找免每幀掃描）
    mLane: 0, hLane: 0, // vN：怪物側/英雄側 round-robin 分道計數器（確定性，禁 Math.random）
    lastElite: false // v707：本場是否為精英（擊殺紫環）
  };
  // vN 傷害浮字可讀性：同目標短窗合併＋分道錨點（合併桶存活期間累加 → 持久計數並回錨 y0，不隨 vy 飄離）
  // 怪物側三條分道（x 錯開避免疊壓；錨點帶置於 boss 本體/血條/名字上方淨空區 y≈116-124，浮字上飄不蓋本體）
  const M_LANES = [
    { x: 292, y: 124 },
    { x: 352, y: 124 },
    { x: 320, y: 116 },
  ];
  const H_LANE_Y = [0, -11, -22]; // 英雄側垂直分道 offset（疊在既有 hx 錨點上，同 hero 多浮字錯開）
  // v628 擊殺消散演出常數（集中便於回滾 — 回滾 = 還原本區＋spawnKillFX/dying 分支）：
  // 垂死體上升漸隱＋體色碎片噴散＋命終白閃（全確定性，禁 Math.random；純演出，不影響擊殺判定/生成時序）
  const DEATH_MS = 0.45;        // 垂死體演出時程（原 0.25 壓扁貼地 — 低 alpha 壓扁體讀作地面雜物/第二隻活怪,round-18 取證）
  const DEATH_RISE = 10;        // 上飄像素（t² 加速）
  const KILL_FLASH = 0.15;      // 命終白閃秒數（白色剪影 — 與受擊/英雄倒地白閃同語彙）
  const SHARD_N = 6;            // 碎片數（60° 間隔＋擊殺數 hash 偏移 ≤15°）
  const SHARD_LIFE = 0.5;       // 碎片存活秒（同屏存活 ≤11 顆 @3.5 殺/s,粒子池沿用 64 上限）
  const SHARD_SPD = [40, 70];   // 初速 px/s（重力下墜）
  const POISON_MARK_S = 4;      // v630：毒標記存活秒 = 毒擊間隔,毒跳時刷新
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
      if ((anim.poisonUntil[h.id] || 0) > now && h.hp > 0) status.push("poison"); // v630：毒標記
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
        // v628FIX：純文字桶（「擊敗！」無 val）不得把 val 污染成數字 0 — 否則 render 改顯示 "0"
        if (typeof opt.val === "number") ex.val = (ex.val || 0) + opt.val;
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
    anim.bossHit = Math.max(anim.bossHit, 0.12);     // v639：hit-stop 120ms（Boss 90ms；暴擊≥0.1s 規格達標）
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
            spawnCritSparks(); // v639：暴擊專屬金色火花噴散
            spawnCritRing(310, 205); // v695：暴擊金環形狀錨
            spawnCritMark(310, 188); // v774：暴擊金星
            spawnGleamMark(310, 168); // v811：暴擊金芒標
            if (vsBoss) bossImpact(0.3, 0.09, 0.4); // Boss 額外加強
          } else if (vsBoss) {
            bossImpact(0, 0.05, 0);
            spawnHitRing(310, 205); // v699：普攻銀環（非暴擊）
            spawnBashMark(310, 188); // v795：普攻銀折標
            spawnSlamMark(310, 168); // v811：普攻銀撞標
          } else {
            hitImpact(); // 普通怪普攻微衝擊：20ms hit-stop
            spawnHitRing(310, 205); // v699：普攻銀環
            spawnBashMark(310, 188); // v795：普攻銀折標
            spawnSlamMark(310, 168); // v811：普攻銀撞標
          }
          if (e.el) spawnElMark(310, 175, dmgColor(e.type === "crit")); // v791：克制青菱標
          if (bossShieldActive(F)) {
            spawnShieldClang(310, 200); // v691：護盾期受擊藍閃
            spawnWardMark(310, 165); // v791：護盾期青盾標
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
          spawnCastRing(hx, hy); // v719：施法青環
          spawnCastMark(hx, hy - 8); // v795：施法靛星標
          if (sk.type === "taunt") {
            spawnTauntMark(310, 200); // v719：嘲諷紅標（怪物側）
            spawnGoadMark(310, 175); // v807：嘲諷紅角標
            spawnBaitMark(310, 155); // v839：嘲諷紅餌標
          }
          if (sk.type === "multi") {
            spawnMultiMark(310, 188); // v723：連擊橘疊 V
            spawnFlurryMark(310, 168); // v807：連擊橘嵐標
            spawnSwarmMark(310, 148); // v839：連擊橘群標
          }
          if (sk.type === "heal") {
            spawnHealRing(hx, hy); // v723：治療綠雙環
            spawnAidMark(hx, hy - 8); // v799：治療技薄荷十字標
            spawnBalmMark(hx, hy - 14); // v835：治療技綠潤標
          }
          if (sk.type === "hit" && !sk.heal) {
            spawnStrikeMark(310, 188); // v803：攻擊技青折標
            spawnThrustMark(310, 168); // v835：攻擊技青刺標
          }
          if (fx === "fx_poison") {
            spawnPoisonMark(310, 200); // v723：淬毒紫六角
            spawnPlagueMark(310, 175); // v823：淬毒紫疫標
          }
          if (sk.type === "buff") {
            spawnBuffMark(hx, hy); // v727：增益金盾標
            spawnRallyMark(hx, hy - 10); // v807：增益金旗標
            spawnCrestMark(hx, hy - 18); // v839：增益金徽標
          }
          if (fx === "fx_ice") {
            spawnFreezeMark(310, 200); // v727：冰系青晶標
            spawnFrostMark(310, 175); // v819：冰系青霜標
            spawnGlaceMark(310, 155); // v843：冰系青冰標
          }
          if (fx === "fx_fireball") {
            spawnFireMark(310, 200); // v727：火球橙三角
            spawnEmberMark(310, 175); // v819：火球橙燼標
            spawnBlazeMark(310, 155); // v843：火球橙焰標
          }
          if (fx === "fx_spark") {
            spawnBoltMark(310, 200); // v731：雷系黃折線
            spawnVoltMark(310, 175); // v823：雷系黃電標
            spawnSparkMark(310, 155); // v843：雷系黃火花標
          }
          if (fx === "fx_heal") {
            spawnHolyMark(310, 200); // v731：聖光白金菱
            spawnBlessMark(310, 175); // v823：聖光白佑標
            spawnHaloMark(310, 155); // v847：聖光白暈標
          }
          if (fx === "fx_slash") {
            spawnSlashMark(310, 200); // v731：斬擊銀灰弧
            spawnCleaveMark(310, 175); // v815：斬擊銀弧標
            spawnRendMark(310, 155); // v847：斬擊銀裂標
          }
          if (fx === "fx_arrow") {
            spawnArrowMark(310, 200); // v734：箭矢金羽
            spawnPierceMark(310, 175); // v815：箭矢金刺標
            spawnFletchMark(310, 155); // v847：箭矢金羽標
          }
          if (fx === "fx_dagger") {
            spawnDaggerMark(310, 200); // v734：匕首銀叉
            spawnShivMark(310, 175); // v819：匕首銀刺標
          }
          if (fx === "fx_shield") {
            spawnShieldMark(hx, hy); // v734：護盾藍盾（英雄側）
            spawnAegisMark(hx, hy - 10); // v815：護盾藍穹標
          }
          if (sk.crit) {
            spawnCritSkillMark(310, 188); // v738：必暴金星
            spawnLuckMark(310, 168); // v827：必暴金運標
          }
          if (sk.heal && sk.type === "hit") {
            spawnLeechMark(hx, hy); // v738：吸血綠心（攻擊技回血）
            spawnDrainMark(hx, hy - 12); // v827：吸血綠脈標
          }
          if (sk.freeze) {
            spawnChillMark(310, 200); // v738：凍結雪晶
            spawnRimeMark(310, 175); // v827：凍結霜輪標
          }
          if ((sk.power || 0) >= 2.5) {
            spawnPowerMark(310, 188); // v742：重擊橙菱
            spawnCrushMark(310, 168); // v831：重擊橙壓標
          }
          if (sk.type === "multi" && (sk.hits || 0) >= 4) {
            spawnRapidMark(310, 188); // v746：高連擊青速線
            spawnBlitzMark(310, 168); // v831：高連擊青閃標
          }
          if (sk.dot && fx === "fx_fireball") {
            spawnBurnMark(310, 188); // v750：灼燒火尖
            spawnScorchMark(310, 168); // v831：灼燒赤焰標
          }
          if (sk.dot && fx === "fx_poison") {
            spawnToxCast(310, 188); // v754：毒 DoT 施放滴尖
            spawnBlightMark(310, 168); // v835：毒 DoT 紫疫標
          }
          const multi = sk.type === "multi" ? (sk.hits || 1) : 1;
          // v227FIX：消費時捕捉怪物身份（延遲閉包 120-190ms 後可能已換怪 — 閃白/衝擊以 id 門控防誤植）
          const mId = F.m ? F.m.id : null;
          const wasBoss = !!(F.m && F.m.boss);
          const isDmg = e.dmg > 0; // v227FIX：buff/護盾/嘲諷/治療（dmg 0）不觸發怪物閃白/衝擊
          const shieldHit = isDmg && bossShieldActive(F); // v691：護盾期技能命中
          // 第二拍（0.12s 延遲 — 純視覺，battle 已即時結算）：怪物側元素爆發＋傷害數字
          setTimeout(() => {
            for (let k = 0; k < multi; k++) {
              setTimeout(() => {
                const ice = fx === "fx_ice";
                const bolt = fx === "fx_spark";
                const holy = fx === "fx_heal";
                const slash = fx === "fx_slash";
                const poison = fx === "fx_poison";
                const arrow = fx === "fx_arrow";
                const dagger = fx === "fx_dagger";
                const fire = fx === "fx_fireball";
                const shield = fx === "fx_shield";
                spawnParticle(fx, 310 + (multi > 1 ? (k - (multi - 1) / 2) * 7 : 0), 205, {
                  life: 0.4, scale: ice ? 1.4 : (multi > 1 ? 1.3 : 1.8), gravity: 0
                }); // multi 連擊橫向展開;冰系核心略縮讓碎片可讀
                if (ice && k === 0) spawnIceShards(); // v643：僅首拍噴冰霜碎片（避免 multi 重複 6×N）
                if (bolt && k === 0) spawnLightningChain(hx, hy - 4, 310, 205); // v647：雷鏈折線（僅首拍）
                if (holy && k === 0 && isDmg) spawnHolyPillar(310, 205); // v651：聖光柱（傷害技能首拍）
                if (slash && k === 0 && isDmg) spawnSlashArc(310, 205); // v655：斬擊弧（傷害技能首拍）
                if (poison && k === 0 && isDmg) spawnPoisonCloud(310, 205); // v659：毒雲
                if (arrow && k === 0 && isDmg) spawnArrowStreak(hx, hy - 4, 310, 205); // v659：箭矢曳光
                if (dagger && k === 0 && isDmg) spawnDaggerFan(310, 205); // v659：匕首扇刃
                if (fire && k === 0 && isDmg) spawnFireBurst(310, 205); // v663：火球爆環
                if (shield && k === 0 && !isDmg) spawnShieldRing(hx, hy); // v663：護盾光環（非傷）
                if (e.buff && k === 0) spawnBuffGlow(hx, hy); // v679：增益光環（buff 技能）
                // v227FIX：單發（首擊）與 multi 末擊都給命中回饋（僅 dmg>0 且怪物仍是原目標）
                const last = k === multi - 1;
                if (isDmg && F.m && F.m.id === mId && (multi === 1 || last)) {
                  anim.monsterFlash = 0.07;
                  if (wasBoss) bossImpact(0.22, 0.07, 0.25);
                  if (shieldHit && k === 0) spawnShieldClang(310, 200); // v691：護盾期技能首拍藍閃
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
          // v695：普攻受擊揚塵（非毒／非震怒 — 毒與 aoe 已有專屬語彙）
          if (!e.poison && !e.aoe) {
            spawnMhitDust(hx + 6, hy + 10);
            spawnPainMark(hx, hy - 4); // v791：普受擊紅斜標
          }
          if (e.aoe) spawnAoeRing(hx, hy); // v719：震怒 AOE 紅環
          if (e.aoe) spawnWrathMark(hx, hy - 4); // v754：震怒紅爪
          // v222 受擊後仰+白閃（0.3s = 2 幀後仰+1 幀閃白 @10fps；死亡者不後仰）
          if (hunter && hunter.hp > 0) anim.hurtUntil[e.hunter] = anim.screenT + 0.3;
          // v630：毒標記 — 單標記語義(新毒擊先清全部舊標記再設新目標；毒擊致死者不掛標記)
          if (e.poison && hunter && hunter.hp > 0) {
            for (const k in anim.poisonUntil) delete anim.poisonUntil[k];
            anim.poisonUntil[e.hunter] = anim.screenT + POISON_MARK_S;
          }
          // v630：毒擊粒子加強 1→3 顆自英雄升起(確定性偏移取 e.hunter)
          if (e.poison) {
            const _hsh = ((e.hunter * 2654435761) >>> 0) & 0xffff;
            spawnParticle("fx_poison", hx - 4 + (_hsh % 9), hy - 2, { life: 0.35, scale: 0.9, gravity: -20 });
            spawnParticle("fx_poison", hx + 2 + ((_hsh >> 3) % 7), hy - 4, { life: 0.30, scale: 0.8, gravity: -25 });
            spawnVenomMark(hx, hy - 4); // v750：毒擊尖牙
          }
          // v667：震怒命中衝擊波（同波多目標 mhit 去重）
          if (e.aoe) {
            if (!anim._aoeFxAt || anim.screenT - anim._aoeFxAt > 0.15) {
              anim._aoeFxAt = anim.screenT;
              spawnAoeShockwave(240, 232);
            }
          }
          break;
        case "dot":
          // v547：中毒浮字改紫（原 #7ac86a 與治療 #7ee787 同為綠色系 — 扣血/補血一眼難分）
          spawnFloat(320, 225, "-" + MG.util.fmt(e.dmg), "#c792ea", false, { merge: "m_dot", val: e.dmg, prefix: "-", side: "m" });
          spawnParticle("fx_poison", 320, 205, { life: 0.4, scale: 0.9, gravity: 0 });
          spawnDotRipple(310, 210); // v687：毒 tick 紫波紋
          spawnToxMark(310, 200); // v742：毒滴尖端
          break;
        case "heal":
          spawnFloat(hx, hy - 8, "+" + MG.util.fmt(e.amt), "#7ee787", false, { merge: "h_" + e.hunter + "_heal", val: e.amt, prefix: "+", side: "hero" });
          spawnParticle("fx_heal", hx, hy, { life: 0.4, scale: 1.2, gravity: 0 });
          spawnHealBurst(hx, hy); // v663：治療爆發
          spawnCareMark(hx, hy - 6); // v750：治療綠十字
          break;
        case "mheal":
          // v558：BOSS 回血量化 — 再生/吸血作用瞬間跳綠色 +N＋全屏綠閃（血條回升的「原因」可讀；rm 跳過浮字/粒子/閃光）
          // v667：再生綠／吸血紅分語彙＋專屬形狀特效
          if (e.mech === "lifesteal") {
            spawnFloat(320, 185, "+" + MG.util.fmt(e.amt), "#ff7a7a", false, { merge: "m_heal_ls", val: e.amt, prefix: "+", side: "m" });
            spawnParticle("fx_dagger", 320, 205, { life: 0.45, scale: 1.2, gravity: 0 });
            spawnLifestealSiphon(100, 190, 310, 200);
            spawnStealMark(310, 188); // v786：吸血紅心標
            if (!rm()) anim.bossGreen = 0; // 吸血不走綠閃
          } else {
            spawnFloat(320, 185, "+" + MG.util.fmt(e.amt), "#7ee787", false, { merge: "m_heal", val: e.amt, prefix: "+", side: "m" });
            spawnParticle("fx_heal", 320, 205, { life: 0.5, scale: 1.3, gravity: 0 });
            spawnRegenPulse(310, 215);
            spawnRegenMark(310, 188); // v786：再生綠脈標
            if (!rm()) anim.bossGreen = 0.28;
          }
          break;
        case "kill": {
          // v628 上升消散：垂死體純視覺 0.45s（上飄＋漸隱；擊殺判定/新怪生成時序不變）
          const ksize = e.boss ? 3 : monsterSizeOf(e.sprite);
          anim.death = {
            sprite: e.sprite, size: ksize, boss: e.boss,
            t: DEATH_MS, max: DEATH_MS
          };
          // v628FIX：擊殺 FX 即時觸發（原掛在 death 計時末端 — 高頻農場 3.5 殺/s 下新殺覆寫舊 death
          // 會整組丟失金幣/浮字/碎片；即時觸發後每殺必有回饋,垂死體僅為純視覺殘影,被覆寫無損）
          spawnKillFX(e.boss, e.sprite, ksize);
          spawnKillMark(310, 188); // v770：擊殺銀骷
          spawnVanquishMark(310, 168); // v811：擊殺銀刃標
          // 首領慶祝通知只在「首次」擊敗首領時立即顯示（重複討伐不再跳通知；
          // 立即觸發以免被後續 kill 事件覆蓋延遲動畫而吞掉）
          if (e.firstBoss) {
            showBossCelebration(e);
            spawnChampRing(310, 200); // v703：首殺金環
            spawnChampMark(310, 175); // v782：首殺金冠標
          }
          if (e.item) {
            spawnLootFlare(300, 190); // v707：裝備掉落琥珀焰
            spawnLootMark(300, 175); // v770：掉裝琥珀袋
          }
          if (e.gem) {
            spawnGemFlare(290, 185); // v711：寶石掉落青菱
            spawnGemMark(290, 170); // v778：寶石青菱標
          }
          if (e.potionDrop) {
            spawnPotDrop(330, 185); // v711：藥水掉落玫焰
            spawnPotMark(330, 170); // v778：藥水玫瓶標
          }
          if (e.book) {
            spawnBookFlare(310, 175); // v711：技能書靛環
            spawnBookMark(310, 158); // v782：技能書靛本標
          }
          if (e.matDrop) {
            spawnMatFlare(270, 195); // v715：素材翠晶
            spawnMatMark(270, 180); // v774：素材翠晶標
          }
          if (e.ticket) {
            spawnTicketFlare(350, 175); // v715：招募券金票
            spawnTicketMark(350, 160); // v774：招募券金票標
          }
          if (e.honorDrop) {
            spawnHonorFlare(320, 160); // v715：榮譽琥珀環
            spawnHonorMark(320, 145); // v778：榮譽琥珀標
          }
          if (anim.lastElite && !e.boss) {
            spawnEliteRing(310, 200); // v707：精英擊殺紫環
            anim.lastElite = false;
          } else {
            anim.lastElite = false;
          }
          anim.wipeHinted = false;
          // 戰利品結算視覺（v116 改版）：金幣飛向英雄期間不跳動頂部資源數字，
          // 抵達後才在英雄頭頂跳出 +金/+經驗 並觸發頂欄數字跳動（看起來英雄拿到才結算）
          const hp = TEAM_POS[Math.min(e.boss ? 4 : Math.floor(Math.random() * 5), 4)];
          const g = e.gold || 0, xp = e.exp || 0;
          if (g > 0 || xp > 0) {
            setTimeout(() => {
              if (g > 0) {
                spawnFloat(hp.x + 20, hp.y - 42, "+" + MG.util.fmt(g) + " 金", "#ffd166", true);
                spawnGoldMark(hp.x + 8, hp.y - 56); // v782：金幣金圓標
              }
              if (xp > 0) {
                spawnFloat(hp.x + 20, hp.y - 27, "+" + MG.util.fmt(xp) + " 經驗", "#7ee787", false);
                spawnExpMark(hp.x + 8, hp.y - 48); // v786：經驗綠葉標
              }
              MG.ui.screens.bumpCurrency && MG.ui.screens.bumpCurrency("gold");
            }, 1350);
          }
          break;
        }
        case "elite":
          anim.lastElite = true; // v707：標記本場為精英（擊殺紫環用）
          spawnFloat(320, 150, "精英怪出現！", "#c792ea", true);
          spawnEliteGate(310, 200); // v671：紫菱形傳送門
          spawnEliteMark(310, 188); // v746：精英紫冠
          MG.core.audio.SFX && MG.core.audio.SFX.skill && MG.core.audio.SFX.skill();
          bossImpact(0.15, 0.03, 0.2);
          break;
        case "boss":
          spawnParticle("fx_boom", 320, 200, { life: 0.7, scale: 2.2 });
          spawnBossBurst(310, 205); // v671：粉紅雙環＋射線
          spawnBossMark(310, 188); // v746：首領緋角冠
          spawnFloat(320, 150, "BOSS來襲！", "#ff5c8a", true);
          bossImpact(0.45, 0, 0.8);
          break;
        case "region":
          MG.sys.game.log("區域解放！「" + e.name + "」的大門已開啟，前進新地圖！", "icon_honor");
          anim.regionFlash = 0.7;
          spawnRegionFlare(240, 150); // v679：區域解放金焰
          spawnLiberateMark(240, 130); // v758：區域解放門拱
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
          spawnClearRing(240, 160); // v683：討伐清場銀環
          spawnClearMark(240, 140); // v762：清場銀✓
          break;
        case "repeatstage":
          // v687：練角重刷關卡 — 青綠關卡焰（banner 外補形狀語彙）
          spawnStageFlare(240, 155);
          spawnRestageMark(240, 135); // v762：重刷青綠刷新弧
          break;
        case "stageclear":
          // v691：自動進關 — 金進關環（與練角綠焰對稱）
          spawnAdvanceRing(240, 155);
          spawnAdvanceMark(240, 135); // v762：進關金雙▶
          break;
        case "regionunlock":
          // BOSS第一次擊敗才通知「下一區域已解鎖」（重複討伐不再提示）
          if (e.firstClear) {
            MG.sys.game.log("已征服「" + REGIONS()[S().hunt.region].name + "」！「" + e.name + "」已解鎖，隨時可切換地圖。", "icon_sword");
            MG.ui.dom.toast("已解鎖「" + e.name + "」！點擊上方地圖名稱即可前往", "good", "icon_sword");
            spawnUnlockGate(240, 150); // v703：首清解鎖青門（與 regionflare 分語彙）
            spawnUnlockMark(240, 130); // v766：首清解鎖金鑰
          }
          break;
        case "down":
          // v552 死亡表現：隊員倒下 — 觸發倒地動畫＋地面屍體＋紅 ✕（純視覺；數值/存檔零觸碰）
          anim.down[e.hunter] = { t: 0 };
          spawnDownWisp(hx, hy); // v671：倒下魂火
          spawnDownBurst(hx + 6, hy); // v699：倒下紅爆
          spawnFallMark(hx, hy - 6); // v754：倒下紅✕
          break;
        case "retreat":
          spawnFloat(240, 140, "全軍倒下，回村休息中…", "#7ee787", true);
          spawnRetreatVeil(240, 200); // v675：暗藍退場帷幕
          spawnRetreatMark(240, 165); // v766：滅團破盾
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
              spawnFarmFlare(240, 155); // v699：練功點綠焰錨
              spawnFarmMark(240, 135); // v766：練功點綠芽
            } else {
              MG.ui.dom.toast(e.fallback.type === "stage"
                ? "連敗三場，已自動退至" + MG.config.stageLabel(e.fallback.stage) + "練角（自動進關已暫停）"
                : "連敗三場，難度降至「" + MG.config.DIFFICULTY[e.fallback.diff].name + "」（自動進關已暫停）", "bad", "icon_sword");
              spawnFallFlare(240, 155); // v703：回退橙焰（stage／diff）
              spawnBackMark(240, 135); // v770：關卡回退橙▼
            }
          }
          break;
        case "resume":
          spawnFloat(240, 140, "再戰！", "#7ee787", true);
          spawnResumeRing(240, 200); // v675：綠復甦環
          spawnResumeMark(240, 175); // v758：再戰綠▶
          break;
        case "returnhome":
          spawnFloat(240, 140, "全軍回村休息", "#7ee787", true);
          spawnHomePortal(240, 200); // v679：回村青藍傳送門
          spawnHomeMark(240, 175); // v758：回村小屋尖
          break;
        case "levelup":
          spawnFloat(hx, hy - 14, "Lv " + (e.level || "") + "！", "#ffd166", true);
          spawnLevelBurst(hx + 8, hy + 2); // v675：金環＋確定性火花（取代 Math.random）
          spawnLvMark(hx, hy - 6); // v742：升級金徽
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
    // v683：英雄危血紅邊（任一存活隊員 hp<25%；rm 恆定淡紅）
    {
      const team = (view && view.team) || [];
      let danger = false;
      for (const tm of team) {
        if (tm && !tm.dead && tm.maxHp > 0 && tm.hp > 0 && tm.hp / tm.maxHp < 0.25) { danger = true; break; }
      }
      if (danger) {
        const pulse = rm() ? 0.18 : 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(anim.screenT * 4.5));
        const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
        g.addColorStop(0, "rgba(255,60,60,0)");
        g.addColorStop(1, "rgba(180,20,40," + pulse.toFixed(3) + ")");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }
    // v687：魔物危血橙邊（存活魔物 hp<25%；與英雄紅邊對稱；rm 定幀）
    {
      const m = view && view.monster;
      if (m && !m.dead && m.maxHp > 0 && m.hp > 0 && m.hp / m.maxHp < 0.25) {
        const pulse = rm() ? 0.16 : 0.1 + 0.1 * (0.5 + 0.5 * Math.sin(anim.screenT * 4.2 + 1));
        const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 0.98);
        g.addColorStop(0, "rgba(255,160,40,0)");
        g.addColorStop(1, "rgba(200,90,20," + pulse.toFixed(3) + ")");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
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
  /* v628 擊殺體色碎片：從怪物 sprite 色票取主體兩色（frame 0 頻次排序,跳過透明與深色輪廓 #14121f）,結果快取 */
  const shardColorCache = {};
  function shardColorsOf(sprite) {
    let c = shardColorCache[sprite];
    if (c) return c;
    c = null;
    const art = MG.art.monsters && MG.art.monsters[sprite];
    if (art && art.framesRows && art.framesRows[0] && art.pal) {
      const freq = {};
      for (const row of art.framesRows[0]) for (let i = 0; i < row.length; i++) {
        const col = art.pal[row[i]];
        if (!col || col === "#14121f") continue;
        freq[col] = (freq[col] || 0) + 1;
      }
      const sorted = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
      if (sorted.length) c = [sorted[0], sorted[1] || sorted[0]];
    }
    if (!c) c = ["#c8c8d8", "#8a8a9a"]; // 兜底灰（理論不可達 — 全怪物/首領皆有 sprite）
    shardColorCache[sprite] = c;
    return c;
  }
  /* v639 暴擊金色火花：5 顆金色小火花從怪物受擊點噴散（全確定性 — 固定角度表,無 Math.random）；
     走既有 particles 池（64 上限沿用）;rm 不觸發（與粒子同閘） */
  const CRIT_SPARK_ANG = [0, 1, 2, 3, 4].map(k => (k / 5) * Math.PI * 2); // 72° 間隔固定角度表
  const CRIT_SPARK_CLR = ["#ffd166", "#ffd166", "#ffffff", "#ffd166", "#ffe08a"]; // 主金+白提亮+淺金
  function spawnCritSparks() {
    if (rm()) return;
    for (let k = 0; k < 5; k++) {
      if (anim.particles.length > 64) break;
      const ang = CRIT_SPARK_ANG[k];
      const sp = 0.55 + k * 0.08; // 55-87 px/s 確定性速度梯度
      anim.particles.push({
        kind: "shard", sprite: null,
        x: 310, y: 210, // 怪物受擊點（與 fx_slash 同錨）
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.5, // 微上飄
        gravity: 0.001, life: 0.30 + k * 0.02, maxLife: 0.30 + k * 0.02, // 0.30-0.38s
        color: CRIT_SPARK_CLR[k], size: k === 2 ? 2 : 3, t: anim.screenT // 白色那顆稍小
      });
    }
  }
  /* v643 冰霜碎片：6 顆冰色矩形碎片從怪物受擊點外飛（全確定性 60° 角度表,無 Math.random）；
     僅 skill icon=fx_ice（冰霜新星/寒霜凍矢）觸發;走既有 particles 池;rm 不觸發 */
  const ICE_SHARD_ANG = [0, 1, 2, 3, 4, 5].map(k => (k / 6) * Math.PI * 2);
  const ICE_SHARD_CLR = ["#9ad8f0", "#ffffff", "#5a9ab8", "#9ad8f0", "#d8f0ff", "#5a9ab8"];
  function spawnIceShards() {
    if (rm()) return;
    for (let k = 0; k < 6; k++) {
      if (anim.particles.length > 64) break;
      const ang = ICE_SHARD_ANG[k];
      const sp = 0.48 + k * 0.06; // 確定性速度梯度
      anim.particles.push({
        kind: "shard", sprite: null,
        x: 310, y: 205,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.35,
        gravity: 0.0012, life: 0.36 + k * 0.02, maxLife: 0.36 + k * 0.02,
        color: ICE_SHARD_CLR[k], size: k % 3 === 1 ? 2 : 3, t: anim.screenT
      });
    }
  }
  /* v647 雷鏈：英雄→怪物確定性折線電弧（白芯＋金黃邊）＋命中點 3 火花；
     僅 skill icon=fx_spark（連鎖閃電）首拍觸發;走 particles 池 kind=bolt;rm 不觸發 */
  const BOLT_OFFS = [0, 10, -12, 8, 0]; // 垂直側向偏移表（px）— 固定折線語意
  const BOLT_SPARK_CLR = ["#ffe566", "#ffffff", "#ffd166"];
  function spawnLightningChain(x0, y0, x1, y1) {
    if (rm()) return;
    if (anim.particles.length > 62) return;
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      pts.push([
        Math.round(x0 + (x1 - x0) * t),
        Math.round(y0 + (y1 - y0) * t + BOLT_OFFS[i])
      ]);
    }
    anim.particles.push({
      kind: "bolt", sprite: null, pts,
      life: 0.22, maxLife: 0.22,
      color: "#ffe566", color2: "#ffffff",
      t: anim.screenT
    });
    for (let k = 0; k < 3; k++) {
      if (anim.particles.length > 64) break;
      const ang = (k / 3) * Math.PI * 2;
      anim.particles.push({
        kind: "shard", sprite: null,
        x: x1, y: y1,
        vx: Math.cos(ang) * 0.4, vy: Math.sin(ang) * 0.4 - 0.2,
        gravity: 0.001, life: 0.28, maxLife: 0.28,
        color: BOLT_SPARK_CLR[k], size: 2, t: anim.screenT
      });
    }
  }
  /* v651 聖光柱：怪物受擊點向上金黃外圈＋白芯垂直柱＋基座 3 火花；
     僅 skill icon=fx_heal 且傷害技能首拍;kind=pillar;rm 不觸發 */
  const HOLY_SPARK_CLR = ["#ffe9a0", "#ffffff", "#ffd166"];
  function spawnHolyPillar(x, y) {
    if (rm()) return;
    if (anim.particles.length > 60) return;
    anim.particles.push({
      kind: "pillar", sprite: null,
      x: Math.round(x), y: Math.round(y),
      life: 0.34, maxLife: 0.34,
      color: "#ffe9a0", color2: "#ffffff",
      h: 46, w: 8, t: anim.screenT
    });
    for (let k = 0; k < 3; k++) {
      if (anim.particles.length > 64) break;
      const ang = -Math.PI / 2 + (k - 1) * 0.7;
      anim.particles.push({
        kind: "shard", sprite: null,
        x: x + (k - 1) * 4, y: y,
        vx: Math.cos(ang) * 0.25, vy: Math.sin(ang) * 0.45,
        gravity: 0.0008, life: 0.3, maxLife: 0.3,
        color: HOLY_SPARK_CLR[k], size: 2, t: anim.screenT
      });
    }
  }
  /* v655 斬擊弧：怪物受擊點銀色外弧＋白芯弧光＋尖端 3 火花；
     僅 skill icon=fx_slash 且傷害技能首拍;kind=arc;rm 不觸發 */
  const SLASH_SPARK_CLR = ["#c8d8f0", "#ffffff", "#9ab0d0"];
  function spawnSlashArc(x, y) {
    if (rm()) return;
    if (anim.particles.length > 60) return;
    anim.particles.push({
      kind: "arc", sprite: null,
      cx: Math.round(x), cy: Math.round(y - 2),
      r: 24, a0: -2.35, a1: 0.55,
      life: 0.26, maxLife: 0.26,
      color: "#a8c0e0", color2: "#ffffff",
      t: anim.screenT
    });
    for (let k = 0; k < 3; k++) {
      if (anim.particles.length > 64) break;
      const ang = -0.9 + k * 0.55;
      anim.particles.push({
        kind: "shard", sprite: null,
        x: x + Math.cos(ang) * 18, y: y + Math.sin(ang) * 14 - 2,
        vx: Math.cos(ang) * 0.35, vy: Math.sin(ang) * 0.25 - 0.15,
        gravity: 0.001, life: 0.26, maxLife: 0.26,
        color: SLASH_SPARK_CLR[k], size: 2, t: anim.screenT
      });
    }
  }
  /* v659 毒雲：怪物側紫霧橢圓環＋5 飄點；fx_poison 傷害首拍;kind=cloud;rm 跳過 */
  const POISON_PUFF_CLR = ["#c792ea", "#a060d0", "#e0b0ff", "#c792ea", "#9a50c8"];
  function spawnPoisonCloud(x, y) {
    if (rm()) return;
    if (anim.particles.length > 58) return;
    anim.particles.push({
      kind: "cloud", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      rx: 28, ry: 12,
      life: 0.4, maxLife: 0.4,
      color: "#c792ea", color2: "#e0b0ff",
      t: anim.screenT
    });
    for (let k = 0; k < 5; k++) {
      if (anim.particles.length > 64) break;
      const ang = (k / 5) * Math.PI * 2;
      anim.particles.push({
        kind: "shard", sprite: null,
        x: x + Math.cos(ang) * 10, y: y + Math.sin(ang) * 5,
        vx: Math.cos(ang) * 0.15, vy: -0.35 - k * 0.04,
        gravity: -0.0004, life: 0.38, maxLife: 0.38,
        color: POISON_PUFF_CLR[k], size: 2 + (k % 2), t: anim.screenT
      });
    }
  }
  /* v659 箭矢曳光：英雄→怪物金白細線＋命中 2 火花；fx_arrow 傷害首拍;kind=streak;rm 跳過 */
  function spawnArrowStreak(x0, y0, x1, y1) {
    if (rm()) return;
    if (anim.particles.length > 60) return;
    anim.particles.push({
      kind: "streak", sprite: null,
      x0: Math.round(x0), y0: Math.round(y0),
      x1: Math.round(x1), y1: Math.round(y1),
      life: 0.2, maxLife: 0.2,
      color: "#ffe08a", color2: "#ffffff",
      t: anim.screenT
    });
    for (let k = 0; k < 2; k++) {
      if (anim.particles.length > 64) break;
      anim.particles.push({
        kind: "shard", sprite: null,
        x: x1, y: y1,
        vx: (k === 0 ? -0.3 : 0.3), vy: -0.4,
        gravity: 0.001, life: 0.24, maxLife: 0.24,
        color: k ? "#ffffff" : "#ffe08a", size: 2, t: anim.screenT
      });
    }
  }
  /* v659 匕首扇刃：怪物側 3 道短弧扇形；fx_dagger 傷害首拍;kind=dagger;rm 跳過 */
  function spawnDaggerFan(x, y) {
    if (rm()) return;
    if (anim.particles.length > 58) return;
    for (let k = 0; k < 3; k++) {
      if (anim.particles.length > 64) break;
      const a0 = -2.0 + k * 0.55;
      anim.particles.push({
        kind: "dagger", sprite: null,
        cx: Math.round(x - 4 + k * 3), cy: Math.round(y - 2),
        r: 14, a0: a0, a1: a0 + 1.1,
        life: 0.24, maxLife: 0.24,
        color: "#d8e0f0", color2: "#ffffff",
        t: anim.screenT
      });
    }
  }
  /* v663 護盾光環：英雄腳下銀藍雙環；fx_shield 非傷技能;kind=ring;rm 跳過 */
  function spawnShieldRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 60) return;
    anim.particles.push({
      kind: "ring", sprite: null,
      cx: Math.round(x + 12), cy: Math.round(y + 22),
      r: 16, life: 0.36, maxLife: 0.36,
      color: "#7ec8ff", color2: "#e8f4ff",
      t: anim.screenT
    });
  }
  /* v663 治療爆發：綠十字＋3 上升火花；heal 事件;kind=healburst;rm 跳過 */
  const HEAL_SPARK_CLR = ["#7ee787", "#b6f5bc", "#ffffff"];
  function spawnHealBurst(x, y) {
    if (rm()) return;
    if (anim.particles.length > 58) return;
    anim.particles.push({
      kind: "healburst", sprite: null,
      cx: Math.round(x + 10), cy: Math.round(y + 6),
      life: 0.32, maxLife: 0.32,
      color: "#7ee787", color2: "#ffffff",
      t: anim.screenT
    });
    for (let k = 0; k < 3; k++) {
      if (anim.particles.length > 64) break;
      anim.particles.push({
        kind: "shard", sprite: null,
        x: x + 6 + k * 4, y: y + 4,
        vx: (k - 1) * 0.12, vy: -0.45 - k * 0.05,
        gravity: -0.0003, life: 0.3, maxLife: 0.3,
        color: HEAL_SPARK_CLR[k], size: 2, t: anim.screenT
      });
    }
  }
  /* v663 火球爆環：怪物側橘紅擴張環＋3 餘燼；fx_fireball 傷害首拍;kind=fireburst;rm 跳過 */
  const FIRE_EMBER_CLR = ["#ff7a2a", "#ffd166", "#ff9a4a"];
  function spawnFireBurst(x, y) {
    if (rm()) return;
    if (anim.particles.length > 58) return;
    anim.particles.push({
      kind: "fireburst", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 26, life: 0.3, maxLife: 0.3,
      color: "#ff7a2a", color2: "#ffd166",
      t: anim.screenT
    });
    for (let k = 0; k < 3; k++) {
      if (anim.particles.length > 64) break;
      const ang = -Math.PI / 2 + (k - 1) * 0.9;
      anim.particles.push({
        kind: "shard", sprite: null,
        x: x, y: y,
        vx: Math.cos(ang) * 0.35, vy: Math.sin(ang) * 0.35 - 0.2,
        gravity: 0.001, life: 0.28, maxLife: 0.28,
        color: FIRE_EMBER_CLR[k], size: 2, t: anim.screenT
      });
    }
  }
  /* v667 再生脈衝：首領腳下綠擴張環；mheal+regen;kind=regenpulse;rm 跳過 */
  function spawnRegenPulse(x, y) {
    if (rm()) return;
    if (anim.particles.length > 58) return;
    anim.particles.push({
      kind: "regenpulse", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 10, r1: 34, life: 0.34, maxLife: 0.34,
      color: "#5af082", color2: "#e8ffe8",
      t: anim.screenT
    });
  }
  /* v667 吸血虹吸：英雄列→首領紅雙描曲線；mheal+lifesteal;kind=siphon;rm 跳過 */
  function spawnLifestealSiphon(x0, y0, x1, y1) {
    if (rm()) return;
    if (anim.particles.length > 58) return;
    anim.particles.push({
      kind: "siphon", sprite: null,
      x0: Math.round(x0), y0: Math.round(y0),
      x1: Math.round(x1), y1: Math.round(y1),
      life: 0.28, maxLife: 0.28,
      color: "#ff5c5c", color2: "#ffd0d0",
      t: anim.screenT
    });
  }
  /* v667 震怒衝擊波：戰場中央紅地面橢圓擴張；mhit+aoe;kind=shockwave;rm 跳過 */
  function spawnAoeShockwave(x, y) {
    if (rm()) return;
    if (anim.particles.length > 58) return;
    anim.particles.push({
      kind: "shockwave", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 18, r1: 72, life: 0.32, maxLife: 0.32,
      color: "#ff5c5c", color2: "#ffb0b0",
      t: anim.screenT
    });
  }
  /* v671 首領登場爆環：粉紅雙環＋4 射線；boss 事件;kind=bossburst;rm 跳過 */
  function spawnBossBurst(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "bossburst", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 42, life: 0.42, maxLife: 0.42,
      color: "#ff5c8a", color2: "#ffd0e0",
      t: anim.screenT
    });
  }
  /* v671 精英傳送門：紫菱形框擴張；elite 事件;kind=elitegate;rm 跳過 */
  function spawnEliteGate(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "elitegate", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      s0: 6, s1: 22, life: 0.36, maxLife: 0.36,
      color: "#c792ea", color2: "#f0d8ff",
      t: anim.screenT
    });
  }
  /* v671 倒下魂火：3 顆上升紅紫碎片；down 事件;kind=downwisp 經 shard;rm 跳過 */
  const DOWN_WISP_CLR = ["#ff6b6b", "#c792ea", "#ff9ac8"];
  function spawnDownWisp(x, y) {
    if (rm()) return;
    for (let k = 0; k < 3; k++) {
      if (anim.particles.length > 64) break;
      anim.particles.push({
        kind: "shard", sprite: null,
        x: x + (k - 1) * 4, y: y - 2,
        vx: (k - 1) * 0.08, vy: -0.55 - k * 0.06,
        gravity: -0.0004, life: 0.4, maxLife: 0.4,
        color: DOWN_WISP_CLR[k], size: 2, t: anim.screenT
      });
    }
  }
  /* v675 升級金環：金擴張環＋6 確定性火花；levelup;kind=levelburst;rm 跳過 */
  const LVL_SPARK = ["#ffd166", "#ffe08a", "#ffffff"];
  function spawnLevelBurst(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "levelburst", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 4, r1: 28, life: 0.36, maxLife: 0.36,
      color: "#ffd166", color2: "#fff3c4",
      t: anim.screenT
    });
    for (let k = 0; k < 6; k++) {
      if (anim.particles.length > 64) break;
      const ang = (k / 6) * Math.PI * 2;
      anim.particles.push({
        kind: "shard", sprite: null,
        x: x, y: y,
        vx: Math.cos(ang) * 0.4, vy: Math.sin(ang) * 0.4 - 0.15,
        gravity: 0.001, life: 0.32, maxLife: 0.32,
        color: LVL_SPARK[k % 3], size: 2, t: anim.screenT
      });
    }
  }
  /* v675 滅團帷幕：暗藍橢圓擴張；retreat;kind=retreatveil;rm 跳過 */
  function spawnRetreatVeil(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "retreatveil", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 20, r1: 120, life: 0.5, maxLife: 0.5,
      color: "#2a3558", color2: "#1a2038",
      t: anim.screenT
    });
  }
  /* v675 再戰復甦環：綠雙環；resume;kind=resumering;rm 跳過 */
  function spawnResumeRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "resumering", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 10, r1: 48, life: 0.38, maxLife: 0.38,
      color: "#7ee787", color2: "#e8ffe8",
      t: anim.screenT
    });
  }
  /* v679 回村傳送門：青藍雙環；returnhome;kind=homeportal;rm 跳過 */
  function spawnHomePortal(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "homeportal", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 44, life: 0.42, maxLife: 0.42,
      color: "#6ac8ff", color2: "#d8f0ff",
      t: anim.screenT
    });
  }
  /* v679 區域解放金焰：金菱＋外環；region;kind=regionflare;rm 跳過 */
  function spawnRegionFlare(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "regionflare", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 12, r1: 56, life: 0.48, maxLife: 0.48,
      color: "#ffd166", color2: "#fff3c4",
      t: anim.screenT
    });
  }
  /* v679 增益光環：淡紫柔環；skill buff;kind=buffglow;rm 跳過 */
  function spawnBuffGlow(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "buffglow", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 26, life: 0.4, maxLife: 0.4,
      color: "#9ad8ff", color2: "#e0f4ff",
      t: anim.screenT
    });
  }
  /* v683 討伐清場環：銀灰雙環；repeatboss;kind=clearring;rm 跳過 */
  function spawnClearRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "clearring", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 14, r1: 58, life: 0.44, maxLife: 0.44,
      color: "#c8d0e0", color2: "#ffffff",
      t: anim.screenT
    });
  }
  /* v687 關卡重刷焰：青綠菱＋外環；repeatstage;kind=stageflare;rm 跳過 */
  function spawnStageFlare(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "stageflare", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 10, r1: 48, life: 0.4, maxLife: 0.4,
      color: "#7ee787", color2: "#c8f5c8",
      t: anim.screenT
    });
  }
  /* v687 毒 tick 波紋：紫橢圓擴；dot;kind=dotripple;rm 跳過 */
  function spawnDotRipple(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "dotripple", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 4, r1: 22, life: 0.32, maxLife: 0.32,
      color: "#c792ea", color2: "#e0b8f5",
      t: anim.screenT
    });
  }
  /* v691 自動進關金環：金菱＋外環；stageclear;kind=advancering;rm 跳過 */
  function spawnAdvanceRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "advancering", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 12, r1: 52, life: 0.42, maxLife: 0.42,
      color: "#ffd166", color2: "#fff3c4",
      t: anim.screenT
    });
  }
  /* v691 護盾受擊藍閃：青藍碎環；shield 期 hit;kind=shieldclang;rm 跳過 */
  function spawnShieldClang(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "shieldclang", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 28, life: 0.28, maxLife: 0.28,
      color: "#9ad8ff", color2: "#e0f4ff",
      t: anim.screenT
    });
  }
  /* v691 登場漣漪：青灰擴環；entering;kind=enterripple;rm 跳過 */
  function spawnEnterRipple(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "enterripple", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 40, life: 0.36, maxLife: 0.36,
      color: "#8a9ab8", color2: "#c8d0e0",
      t: anim.screenT
    });
  }
  /* v695 暴擊金環：金菱擴；crit;kind=critring;rm 跳過 */
  function spawnCritRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "critring", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 34, life: 0.3, maxLife: 0.3,
      color: "#ffd166", color2: "#fff3c4",
      t: anim.screenT
    });
  }
  /* v695 受擊揚塵：棕塵點簇；mhit;kind=mhitdust;rm 跳過 */
  function spawnMhitDust(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "mhitdust", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 3, r1: 16, life: 0.28, maxLife: 0.28,
      color: "#c8a878", color2: "#8a7050",
      t: anim.screenT
    });
  }
  /* v695 擊殺閃環：銀白擴環；kill;kind=killring;rm 跳過 */
  function spawnKillRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "killring", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 10, r1: 44, life: 0.34, maxLife: 0.34,
      color: "#e8f0ff", color2: "#ffffff",
      t: anim.screenT
    });
  }
  /* v699 普攻銀環：銀灰擴環；hit 非暴擊;kind=hitring;rm 跳過 */
  function spawnHitRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "hitring", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 5, r1: 22, life: 0.22, maxLife: 0.22,
      color: "#c8d0e0", color2: "#e8f0ff",
      t: anim.screenT
    });
  }
  /* v699 倒下紅爆：紅菱＋外環；down;kind=downburst;rm 跳過 */
  function spawnDownBurst(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "downburst", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 30, life: 0.32, maxLife: 0.32,
      color: "#ff6b6b", color2: "#ff9a9a",
      t: anim.screenT
    });
  }
  /* v699 練功點綠焰：青綠菱；retreat farmspot;kind=farmflare;rm 跳過 */
  function spawnFarmFlare(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "farmflare", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 10, r1: 46, life: 0.4, maxLife: 0.4,
      color: "#7ee787", color2: "#c8f5c8",
      t: anim.screenT
    });
  }
  /* v703 首殺金環：金雙環＋十字；kill+firstBoss;kind=champring;rm 跳過 */
  function spawnChampRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "champring", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 12, r1: 48, life: 0.42, maxLife: 0.42,
      color: "#ffd166", color2: "#fff3c4",
      t: anim.screenT
    });
  }
  /* v703 解鎖青門：青菱＋外環；regionunlock firstClear;kind=unlockgate;rm 跳過 */
  function spawnUnlockGate(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "unlockgate", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 42, life: 0.4, maxLife: 0.4,
      color: "#6ac8ff", color2: "#c8e8ff",
      t: anim.screenT
    });
  }
  /* v703 回退橙焰：橙菱；retreat fallback stage/diff;kind=fallflare;rm 跳過 */
  function spawnFallFlare(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "fallflare", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 10, r1: 44, life: 0.38, maxLife: 0.38,
      color: "#ff9a4a", color2: "#ffe0a8",
      t: anim.screenT
    });
  }
  /* v707 掉落琥珀焰：琥珀六角；kill+item;kind=lootflare;rm 跳過 */
  function spawnLootFlare(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "lootflare", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 36, life: 0.4, maxLife: 0.4,
      color: "#e8b060", color2: "#ffe8c0",
      t: anim.screenT
    });
  }
  /* v707 精英擊殺紫環：雙紫環＋斜線；elite→kill;kind=elitering;rm 跳過 */
  function spawnEliteRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "elitering", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 10, r1: 42, life: 0.38, maxLife: 0.38,
      color: "#c792ea", color2: "#e8d0ff",
      t: anim.screenT
    });
  }
  /* v707 藥水薄荷爆：薄荷十字＋環；usePotion;kind=potburst;rm 跳過 */
  function spawnPotBurst(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "potburst", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 34, life: 0.36, maxLife: 0.36,
      color: "#6ed6b0", color2: "#c8f5e8",
      t: anim.screenT
    });
  }
  /* v711 寶石掉落青菱：青藍菱＋內環；kill+gem;kind=gemflare;rm 跳過 */
  function spawnGemFlare(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "gemflare", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 34, life: 0.38, maxLife: 0.38,
      color: "#6ac8ff", color2: "#c8e8ff",
      t: anim.screenT
    });
  }
  /* v711 藥水掉落玫焰：玫紅菱；kill+potionDrop;kind=potdrop;rm 跳過 */
  function spawnPotDrop(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "potdrop", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 32, life: 0.36, maxLife: 0.36,
      color: "#ff7aaa", color2: "#ffd0e0",
      t: anim.screenT
    });
  }
  /* v711 技能書靛環：靛紫雙環；kill+book;kind=bookflare;rm 跳過 */
  function spawnBookFlare(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "bookflare", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 36, life: 0.4, maxLife: 0.4,
      color: "#9a7cff", color2: "#e0d0ff",
      t: anim.screenT
    });
  }
  /* v715 素材翠晶：翠綠六角；kill+matDrop;kind=matflare;rm 跳過 */
  function spawnMatFlare(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "matflare", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 32, life: 0.36, maxLife: 0.36,
      color: "#5ecf8a", color2: "#c8f0d8",
      t: anim.screenT
    });
  }
  /* v715 招募券金票：暖金橫票；kill+ticket;kind=ticketflare;rm 跳過 */
  function spawnTicketFlare(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "ticketflare", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 34, life: 0.38, maxLife: 0.38,
      color: "#ffc14a", color2: "#ffe8b0",
      t: anim.screenT
    });
  }
  /* v715 榮譽琥珀環：琥珀雙環＋星點；kill+honorDrop;kind=honorflare;rm 跳過 */
  function spawnHonorFlare(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "honorflare", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 38, life: 0.42, maxLife: 0.42,
      color: "#e8a040", color2: "#ffe0a0",
      t: anim.screenT
    });
  }
  /* v719 施法青環：技能起手英雄側；skill;kind=castring;rm 跳過 */
  function spawnCastRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "castring", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 28, life: 0.32, maxLife: 0.32,
      color: "#6ad4ff", color2: "#c8f0ff",
      t: anim.screenT
    });
  }
  /* v719 AOE 紅環：震怒全體受擊；mhit+aoe;kind=aoering;rm 跳過 */
  function spawnAoeRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "aoering", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 5, r1: 30, life: 0.34, maxLife: 0.34,
      color: "#ff5c5c", color2: "#ffb0b0",
      t: anim.screenT
    });
  }
  /* v719 嘲諷紅標：taunt 技能怪物側；skill+taunt;kind=tauntmark;rm 跳過 */
  function spawnTauntMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "tauntmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 26, life: 0.4, maxLife: 0.4,
      color: "#ff7a4a", color2: "#ffd0a0",
      t: anim.screenT
    });
  }
  /* v723 連擊橘疊 V：multi 技能怪物側；skill+multi;kind=multimark;rm 跳過 */
  function spawnMultiMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "multimark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 28, life: 0.36, maxLife: 0.36,
      color: "#ff9a3a", color2: "#ffe0a0",
      t: anim.screenT
    });
  }
  /* v723 治療綠雙環：heal 技能英雄側；skill+heal;kind=healring;rm 跳過 */
  function spawnHealRing(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "healring", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 30, life: 0.34, maxLife: 0.34,
      color: "#57c96b", color2: "#c8f5c8",
      t: anim.screenT
    });
  }
  /* v723 淬毒紫六角：poison 技能怪物側；skill+fx_poison;kind=poisonmark;rm 跳過 */
  function spawnPoisonMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "poisonmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.38, maxLife: 0.38,
      color: "#c792ea", color2: "#e8c8ff",
      t: anim.screenT
    });
  }
  /* v727 增益金盾標：buff 技能英雄側；skill+buff;kind=buffmark;rm 跳過 */
  function spawnBuffMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "buffmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.36, maxLife: 0.36,
      color: "#ffd166", color2: "#fff3c4",
      t: anim.screenT
    });
  }
  /* v727 冰系青晶標：ice 技能怪物側；skill+fx_ice;kind=freezemark;rm 跳過 */
  function spawnFreezeMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "freezemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.36, maxLife: 0.36,
      color: "#7ec8ff", color2: "#e0f4ff",
      t: anim.screenT
    });
  }
  /* v727 火球橙三角：fireball 技能怪物側；skill+fx_fireball;kind=firemark;rm 跳過 */
  function spawnFireMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "firemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.34, maxLife: 0.34,
      color: "#ff7a2a", color2: "#ffd166",
      t: anim.screenT
    });
  }
  /* v731 雷系黃折線：spark 技能怪物側；skill+fx_spark;kind=boltmark;rm 跳過 */
  function spawnBoltMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "boltmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.34, maxLife: 0.34,
      color: "#ffe066", color2: "#ffffff",
      t: anim.screenT
    });
  }
  /* v731 聖光白金菱：heal 圖示技能怪物側；skill+fx_heal;kind=holymark;rm 跳過 */
  function spawnHolyMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "holymark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.34, maxLife: 0.34,
      color: "#fff3c4", color2: "#ffd166",
      t: anim.screenT
    });
  }
  /* v731 斬擊銀灰弧：slash 技能怪物側；skill+fx_slash;kind=slashmark;rm 跳過 */
  function spawnSlashMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "slashmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 30, life: 0.34, maxLife: 0.34,
      color: "#c8d0e0", color2: "#ffffff",
      t: anim.screenT
    });
  }
  /* v734 箭矢金羽：arrow 技能怪物側；skill+fx_arrow;kind=arrowmark;rm 跳過 */
  function spawnArrowMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "arrowmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.34, maxLife: 0.34,
      color: "#ffd166", color2: "#fff3c4",
      t: anim.screenT
    });
  }
  /* v734 匕首銀叉：dagger 技能怪物側；skill+fx_dagger;kind=daggermark;rm 跳過 */
  function spawnDaggerMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "daggermark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.34, maxLife: 0.34,
      color: "#c0c8d8", color2: "#ffffff",
      t: anim.screenT
    });
  }
  /* v734 護盾藍盾：shield 技能英雄側；skill+fx_shield;kind=shieldmark;rm 跳過 */
  function spawnShieldMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "shieldmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.36, maxLife: 0.36,
      color: "#6ab8ff", color2: "#d0ecff",
      t: anim.screenT
    });
  }
  /* v738 必暴金星：crit 技能怪物側；skill+crit;kind=critskill;rm 跳過 */
  function spawnCritSkillMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "critskill", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.34, maxLife: 0.34,
      color: "#ffd166", color2: "#fff3c4",
      t: anim.screenT
    });
  }
  /* v738 吸血綠心：攻擊技回血英雄側；skill+heal+hit;kind=leechmark;rm 跳過 */
  function spawnLeechMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "leechmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 24, life: 0.36, maxLife: 0.36,
      color: "#57c96b", color2: "#c8f5c8",
      t: anim.screenT
    });
  }
  /* v738 凍結雪晶：freeze 技能怪物側；skill+freeze;kind=chillmark;rm 跳過 */
  function spawnChillMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "chillmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.34, maxLife: 0.34,
      color: "#a0e0ff", color2: "#ffffff",
      t: anim.screenT
    });
  }
  /* v742 毒滴：DoT tick 怪物側；dot;kind=toxmark;rm 跳過 */
  function spawnToxMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "toxmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 24, life: 0.34, maxLife: 0.34,
      color: "#c792ea", color2: "#e8c8ff",
      t: anim.screenT
    });
  }
  /* v742 升級金徽：levelup 英雄側；levelup;kind=lvmark;rm 跳過 */
  function spawnLvMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "lvmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.36, maxLife: 0.36,
      color: "#ffd166", color2: "#fff3c4",
      t: anim.screenT
    });
  }
  /* v742 重擊橙菱：power≥2.5 技能怪物側；skill;kind=powermark;rm 跳過 */
  function spawnPowerMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "powermark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.34, maxLife: 0.34,
      color: "#ff9f43", color2: "#ffe0b0",
      t: anim.screenT
    });
  }
  /* v746 精英紫冠：elite 登場怪物側；elite;kind=elitemark;rm 跳過 */
  function spawnEliteMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "elitemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.36, maxLife: 0.36,
      color: "#c792ea", color2: "#e8c8ff",
      t: anim.screenT
    });
  }
  /* v746 首領緋角冠：boss 登場怪物側；boss;kind=bossmark;rm 跳過 */
  function spawnBossMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "bossmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 30, life: 0.38, maxLife: 0.38,
      color: "#ff5c8a", color2: "#ffb0c8",
      t: anim.screenT
    });
  }
  /* v746 高連擊青速線：multi hits≥4 怪物側；skill;kind=rapidmark;rm 跳過 */
  function spawnRapidMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "rapidmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 26, life: 0.32, maxLife: 0.32,
      color: "#7ee0ff", color2: "#c8f0ff",
      t: anim.screenT
    });
  }
  /* v750 治療綠十字：heal 英雄側；heal;kind=caremark;rm 跳過 */
  function spawnCareMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "caremark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 24, life: 0.34, maxLife: 0.34,
      color: "#7ee787", color2: "#c8f5c8",
      t: anim.screenT
    });
  }
  /* v750 灼燒火尖：火球 DoT 施放怪物側；skill+dot;kind=burnmark;rm 跳過 */
  function spawnBurnMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "burnmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.34, maxLife: 0.34,
      color: "#ff7a3a", color2: "#ffd0a0",
      t: anim.screenT
    });
  }
  /* v750 毒擊尖牙：mhit poison 英雄側；mhit;kind=venommark;rm 跳過 */
  function spawnVenomMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "venommark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.32, maxLife: 0.32,
      color: "#c792ea", color2: "#e8c8ff",
      t: anim.screenT
    });
  }
  /* v754 倒下紅✕：down 英雄側；down;kind=fallmark;rm 跳過 */
  function spawnFallMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "fallmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 24, life: 0.34, maxLife: 0.34,
      color: "#ff5c5c", color2: "#ffb0b0",
      t: anim.screenT
    });
  }
  /* v754 毒 DoT 施放滴尖：skill poison+dot 怪物側；skill;kind=toxcast;rm 跳過 */
  function spawnToxCast(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "toxcast", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#a06ad8", color2: "#d8b8f0",
      t: anim.screenT
    });
  }
  /* v754 震怒紅爪：mhit aoe 英雄側；mhit;kind=wrathmark;rm 跳過 */
  function spawnWrathMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "wrathmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 24, life: 0.32, maxLife: 0.32,
      color: "#ff6b4a", color2: "#ffc8b0",
      t: anim.screenT
    });
  }
  /* v758 再戰綠▶：resume 中央；resume;kind=resumemark;rm 跳過 */
  function spawnResumeMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "resumemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#7ee787", color2: "#c8f5c8",
      t: anim.screenT
    });
  }
  /* v758 回村小屋尖：returnhome 中央；returnhome;kind=homemark;rm 跳過 */
  function spawnHomeMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "homemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.36, maxLife: 0.36,
      color: "#7ec8e8", color2: "#c8e8f8",
      t: anim.screenT
    });
  }
  /* v758 區域解放門拱：region 中央；region;kind=liberatemark;rm 跳過 */
  function spawnLiberateMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "liberatemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 8, r1: 30, life: 0.38, maxLife: 0.38,
      color: "#ffd166", color2: "#ffe8a8",
      t: anim.screenT
    });
  }
  /* v762 清場銀✓：repeatboss 中央；repeatboss;kind=clearmark;rm 跳過 */
  function spawnClearMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "clearmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#c8d0e0", color2: "#e8eef8",
      t: anim.screenT
    });
  }
  /* v762 重刷青綠刷新弧：repeatstage 中央；repeatstage;kind=restagemark;rm 跳過 */
  function spawnRestageMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "restagemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.36, maxLife: 0.36,
      color: "#57c96b", color2: "#a8e8b8",
      t: anim.screenT
    });
  }
  /* v762 進關金雙▶：stageclear 中央；stageclear;kind=advancemark;rm 跳過 */
  function spawnAdvanceMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "advancemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.36, maxLife: 0.36,
      color: "#ffd166", color2: "#ffe8a8",
      t: anim.screenT
    });
  }
  /* v766 首清解鎖金鑰：regionunlock 中央；regionunlock;kind=unlockmark;rm 跳過 */
  function spawnUnlockMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "unlockmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 28, life: 0.36, maxLife: 0.36,
      color: "#ffd166", color2: "#ffe8a8",
      t: anim.screenT
    });
  }
  /* v766 滅團破盾：retreat 中央；retreat;kind=retreatmark;rm 跳過 */
  function spawnRetreatMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "retreatmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#7a9ad8", color2: "#b0c8f0",
      t: anim.screenT
    });
  }
  /* v766 練功點綠芽：farmspot 中央；retreat+farmspot;kind=farmmark;rm 跳過 */
  function spawnFarmMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "farmmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#57c96b", color2: "#a8e8b8",
      t: anim.screenT
    });
  }
  /* v770 擊殺銀骷：kill 怪物側；kill;kind=killmark;rm 跳過 */
  function spawnKillMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "killmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 24, life: 0.32, maxLife: 0.32,
      color: "#c8d0e0", color2: "#e8eef8",
      t: anim.screenT
    });
  }
  /* v770 掉裝琥珀袋：kill+item 怪物側；kill;kind=lootmark;rm 跳過 */
  function spawnLootMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "lootmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#ff9a4d", color2: "#ffd166",
      t: anim.screenT
    });
  }
  /* v770 關卡回退橙▼：retreat stage/diff；retreat;kind=backmark;rm 跳過 */
  function spawnBackMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "backmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#ff9a4d", color2: "#ffd0a0",
      t: anim.screenT
    });
  }
  /* v774 暴擊金星：crit 怪物側；crit;kind=critmark;rm 跳過 */
  function spawnCritMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "critmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 24, life: 0.3, maxLife: 0.3,
      color: "#ffd166", color2: "#fff0b0",
      t: anim.screenT
    });
  }
  /* v774 素材翠晶標：kill+matDrop；kill;kind=matmark;rm 跳過 */
  function spawnMatMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "matmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 24, life: 0.32, maxLife: 0.32,
      color: "#57c96b", color2: "#a8e8b8",
      t: anim.screenT
    });
  }
  /* v774 招募券金票標：kill+ticket；kill;kind=ticketmark;rm 跳過 */
  function spawnTicketMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "ticketmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#ffd166", color2: "#fff3b0",
      t: anim.screenT
    });
  }
  /* v778 寶石青菱標：kill+gem；kill;kind=gemmark;rm 跳過 */
  function spawnGemMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "gemmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 24, life: 0.32, maxLife: 0.32,
      color: "#4da3ff", color2: "#a8d4ff",
      t: anim.screenT
    });
  }
  /* v778 藥水玫瓶標：kill+potionDrop；kill;kind=potmark;rm 跳過 */
  function spawnPotMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "potmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 24, life: 0.32, maxLife: 0.32,
      color: "#e85a8a", color2: "#ffb0c8",
      t: anim.screenT
    });
  }
  /* v778 榮譽琥珀標：kill+honorDrop；kill;kind=honormark;rm 跳過 */
  function spawnHonorMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "honormark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#ff9a4d", color2: "#ffd166",
      t: anim.screenT
    });
  }
  /* v782：首殺金冠標 — kill+firstBoss;kind=champmark;rm 跳過 */
  function spawnChampMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "champmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#ffd166", color2: "#fff3b0",
      t: anim.screenT
    });
  }
  /* v782：技能書靛本標 — kill+book;kind=bookmark;rm 跳過 */
  function spawnBookMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "bookmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 24, life: 0.32, maxLife: 0.32,
      color: "#7a6cff", color2: "#c8c0ff",
      t: anim.screenT
    });
  }
  /* v782：金幣金圓標 — kill+gold 抵達英雄;kind=goldmark;rm 跳過 */
  function spawnGoldMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "goldmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#ffd166", color2: "#fff0b0",
      t: anim.screenT
    });
  }
  /* v786：經驗綠葉標 — kill+exp 抵達英雄;kind=expmark;rm 跳過 */
  function spawnExpMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "expmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#7ee787", color2: "#c8f0c8",
      t: anim.screenT
    });
  }
  /* v786：再生綠脈標 — mheal 再生;kind=regenmark;rm 跳過 */
  function spawnRegenMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "regenmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#57c96b", color2: "#a8e878",
      t: anim.screenT
    });
  }
  /* v786：吸血紅心標 — mheal 吸血;kind=stealmark;rm 跳過 */
  function spawnStealMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "stealmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 26, life: 0.34, maxLife: 0.34,
      color: "#ff7a7a", color2: "#ffb0b0",
      t: anim.screenT
    });
  }
  /* v791：克制青菱標 — hit/crit+el;kind=elmark;rm 跳過 */
  function spawnElMark(x, y, color) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "elmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: color || "#7ec8ff", color2: "#d0f0ff",
      t: anim.screenT
    });
  }
  /* v791：護盾期青盾標 — hit+bossShield;kind=wardmark;rm 跳過 */
  function spawnWardMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "wardmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 24, life: 0.32, maxLife: 0.32,
      color: "#8ec8ff", color2: "#d8ecff",
      t: anim.screenT
    });
  }
  /* v791：普受擊紅斜標 — mhit 非毒非震怒;kind=painmark;rm 跳過 */
  function spawnPainMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "painmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ff6b6b", color2: "#ffb0b0",
      t: anim.screenT
    });
  }
  /* v795：施法靛星標 — skill 施放;kind=castmark;rm 跳過 */
  function spawnCastMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "castmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#9ad0ff", color2: "#d8ecff",
      t: anim.screenT
    });
  }
  /* v795：登場紫門標 — 魔物登場;kind=entermark;rm 跳過 */
  function spawnEnterMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "entermark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 24, life: 0.34, maxLife: 0.34,
      color: "#b48cff", color2: "#e0d0ff",
      t: anim.screenT
    });
  }
  /* v795：普攻銀折標 — hit 非暴擊;kind=bashmark;rm 跳過 */
  function spawnBashMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "bashmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#c8d0e0", color2: "#e8eef8",
      t: anim.screenT
    });
  }
  /* v799：治療技薄荷十字標 — skill heal;kind=aidmark;rm 跳過 */
  function spawnAidMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "aidmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#7ee787", color2: "#c8f5d0",
      t: anim.screenT
    });
  }
  /* v799：加速沙漏琥珀標 — usePotion potBoost;kind=boostmark;rm 跳過 */
  function spawnBoostMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "boostmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 7, r1: 24, life: 0.34, maxLife: 0.34,
      color: "#ffb347", color2: "#ffe0a0",
      t: anim.screenT
    });
  }
  /* v799：靈藥琥珀瓶標 — usePotion 非 boost;kind=elixirmark;rm 跳過 */
  function spawnElixirMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "elixirmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.32, maxLife: 0.32,
      color: "#ffd166", color2: "#fff0b8",
      t: anim.screenT
    });
  }
  /* v803：攻擊技青折標 — skill hit 非吸血;kind=strikemark;rm 跳過 */
  function spawnStrikeMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "strikemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#7ec8ff", color2: "#d0f0ff",
      t: anim.screenT
    });
  }
  /* v803：生命藥水玫心標 — useHpPotion;kind=vialmark;rm 跳過 */
  function spawnVialMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "vialmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.32, maxLife: 0.32,
      color: "#ff7ab8", color2: "#ffd0e8",
      t: anim.screenT
    });
  }
  /* v803：魔力藥水藍滴標 — useMpPotion;kind=manamark;rm 跳過 */
  function spawnManaMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "manamark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.32, maxLife: 0.32,
      color: "#6ab8ff", color2: "#c8e8ff",
      t: anim.screenT
    });
  }
  /* v807：增益金旗標 — skill buff;kind=rallymark;rm 跳過 */
  function spawnRallyMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "rallymark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#ffd166", color2: "#fff0b8",
      t: anim.screenT
    });
  }
  /* v807：嘲諷紅角標 — skill taunt;kind=goadmark;rm 跳過 */
  function spawnGoadMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "goadmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#ff6b6b", color2: "#ffb0b0",
      t: anim.screenT
    });
  }
  /* v807：連擊橘嵐標 — skill multi;kind=flurrymark;rm 跳過 */
  function spawnFlurryMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "flurrymark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ff9f43", color2: "#ffd0a0",
      t: anim.screenT
    });
  }
  /* v811：普攻銀撞標 — hit 非暴擊;kind=slammark;rm 跳過 */
  function spawnSlamMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "slammark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#c8d0e0", color2: "#f0f4ff",
      t: anim.screenT
    });
  }
  /* v811：暴擊金芒標 — crit;kind=gleammark;rm 跳過 */
  function spawnGleamMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "gleammark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#ffd166", color2: "#fff6c8",
      t: anim.screenT
    });
  }
  /* v811：擊殺銀刃標 — kill;kind=vanquishmark;rm 跳過 */
  function spawnVanquishMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "vanquishmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.32, maxLife: 0.32,
      color: "#b8c4d8", color2: "#e8eef8",
      t: anim.screenT
    });
  }
  /* v815：斬擊銀弧標 — fx_slash;kind=cleavemark;rm 跳過 */
  function spawnCleaveMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "cleavemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#c8d0e0", color2: "#f0f4ff",
      t: anim.screenT
    });
  }
  /* v815：箭矢金刺標 — fx_arrow;kind=piercemark;rm 跳過 */
  function spawnPierceMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "piercemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ffd166", color2: "#fff0b8",
      t: anim.screenT
    });
  }
  /* v815：護盾藍穹標 — fx_shield;kind=aegismark;rm 跳過 */
  function spawnAegisMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "aegismark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#6ab8ff", color2: "#c8e8ff",
      t: anim.screenT
    });
  }
  /* v819：冰系青霜標 — fx_ice;kind=frostmark;rm 跳過 */
  function spawnFrostMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "frostmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#7ec8ff", color2: "#e0f4ff",
      t: anim.screenT
    });
  }
  /* v819：火球橙燼標 — fx_fireball;kind=embermark;rm 跳過 */
  function spawnEmberMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "embermark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ff8a3a", color2: "#ffd0a0",
      t: anim.screenT
    });
  }
  /* v819：匕首銀刺標 — fx_dagger;kind=shivmark;rm 跳過 */
  function spawnShivMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "shivmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#b8c4d8", color2: "#e8eef8",
      t: anim.screenT
    });
  }
  /* v823：淬毒紫疫標 — fx_poison;kind=plaguemark;rm 跳過 */
  function spawnPlagueMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "plaguemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#b86ad8", color2: "#e8c8ff",
      t: anim.screenT
    });
  }
  /* v823：雷系黃電標 — fx_spark;kind=voltmark;rm 跳過 */
  function spawnVoltMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "voltmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ffe066", color2: "#fff6c8",
      t: anim.screenT
    });
  }
  /* v823：聖光白佑標 — fx_heal;kind=blessmark;rm 跳過 */
  function spawnBlessMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "blessmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#e8e0c8", color2: "#fff8e8",
      t: anim.screenT
    });
  }
  /* v827：必暴金運標 — sk.crit;kind=luckmark;rm 跳過 */
  function spawnLuckMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "luckmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ffd24a", color2: "#fff0b0",
      t: anim.screenT
    });
  }
  /* v827：吸血綠脈標 — heal+hit;kind=drainmark;rm 跳過 */
  function spawnDrainMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "drainmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#57c96b", color2: "#b8f0c0",
      t: anim.screenT
    });
  }
  /* v827：凍結霜輪標 — sk.freeze;kind=rimemark;rm 跳過 */
  function spawnRimeMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "rimemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#9ad8ff", color2: "#e8f6ff",
      t: anim.screenT
    });
  }
  /* v831：重擊橙壓標 — power≥2.5;kind=crushmark;rm 跳過 */
  function spawnCrushMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "crushmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ff9c4a", color2: "#ffe0b0",
      t: anim.screenT
    });
  }
  /* v831：高連擊青閃標 — multi hits≥4;kind=blitzmark;rm 跳過 */
  function spawnBlitzMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "blitzmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#5ec8e5", color2: "#c8f0ff",
      t: anim.screenT
    });
  }
  /* v831：灼燒赤焰標 — fireball DoT;kind=scorchmark;rm 跳過 */
  function spawnScorchMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "scorchmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ff6a3a", color2: "#ffc8a0",
      t: anim.screenT
    });
  }
  /* v835：毒 DoT 紫疫標 — poison DoT;kind=blightmark;rm 跳過 */
  function spawnBlightMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "blightmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#9a5ad8", color2: "#e0c0ff",
      t: anim.screenT
    });
  }
  /* v835：攻擊技青刺標 — hit;kind=thrustmark;rm 跳過 */
  function spawnThrustMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "thrustmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#6ab8ff", color2: "#c8e8ff",
      t: anim.screenT
    });
  }
  /* v835：治療技綠潤標 — heal;kind=balmmark;rm 跳過 */
  function spawnBalmMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "balmmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#57c96b", color2: "#c8f5d0",
      t: anim.screenT
    });
  }
  /* v839：嘲諷紅餌標 — taunt;kind=baitmark;rm 跳過 */
  function spawnBaitMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "baitmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#e05c5c", color2: "#ffc0c0",
      t: anim.screenT
    });
  }
  /* v839：連擊橘群標 — multi;kind=swarmmark;rm 跳過 */
  function spawnSwarmMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "swarmmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ff9c4a", color2: "#ffe0b0",
      t: anim.screenT
    });
  }
  /* v839：增益金徽標 — buff;kind=crestmark;rm 跳過 */
  function spawnCrestMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "crestmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#ffd24a", color2: "#fff0b0",
      t: anim.screenT
    });
  }
  /* v843：冰系青冰標 — fx_ice;kind=glacemark;rm 跳過 */
  function spawnGlaceMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "glacemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#7ec8ff", color2: "#d0f0ff",
      t: anim.screenT
    });
  }
  /* v843：火球橙焰標 — fx_fireball;kind=blazemark;rm 跳過 */
  function spawnBlazeMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "blazemark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ff7a3a", color2: "#ffd0a0",
      t: anim.screenT
    });
  }
  /* v843：雷系黃火花標 — fx_spark;kind=sparkmark;rm 跳過 */
  function spawnSparkMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "sparkmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ffd24a", color2: "#fff6c0",
      t: anim.screenT
    });
  }
  /* v847：聖光白暈標 — fx_heal;kind=halomark;rm 跳過 */
  function spawnHaloMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "halomark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.3, maxLife: 0.3,
      color: "#f0f0ff", color2: "#ffffff",
      t: anim.screenT
    });
  }
  /* v847：斬擊銀裂標 — fx_slash;kind=rendmark;rm 跳過 */
  function spawnRendMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "rendmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#c8c8d0", color2: "#f0f0f8",
      t: anim.screenT
    });
  }
  /* v847：箭矢金羽標 — fx_arrow;kind=fletchmark;rm 跳過 */
  function spawnFletchMark(x, y) {
    if (rm()) return;
    if (anim.particles.length > 56) return;
    anim.particles.push({
      kind: "fletchmark", sprite: null,
      cx: Math.round(x), cy: Math.round(y),
      r0: 6, r1: 22, life: 0.28, maxLife: 0.28,
      color: "#ffd24a", color2: "#fff0b0",
      t: anim.screenT
    });
  }
  function bossShieldActive(F) {
    if (!F || !F.m || F.m.mech !== "shield") return false;
    const mul = (MG.config.BOSS_MECH_DIFF_MUL && MG.config.BOSS_MECH_DIFF_MUL[(MG.game.state.hunt && MG.game.state.hunt.difficulty) || 0]) || 1;
    return (F.t || 0) < 8 * mul;
  }
  /* v628 擊殺碎片噴散：SHARD_N 顆體色矩形碎片,60° 間隔＋擊殺計數 hash 偏移 ≤15°（全確定性）；
     走既有 particles 池（64 上限沿用,池滿丟棄 — 與 spawnParticle 節流同義）;rm 不觸發（與粒子同閘） */
  function spawnShards(sprite, size) {
    if (rm()) return;
    const colors = shardColorsOf(sprite);
    const seed = (S().stats && S().stats.kills) || 0; // 引擎已 stats.kills++,消耗時為單調確定性序列
    const oy = 270 * 0.72 + 8 - (16 * size) / 2; // 怪物體心（與 render.js 怪物地面錨同源）
    for (let k = 0; k < SHARD_N; k++) {
      if (anim.particles.length > 64) break;
      const h = (((seed * 31 + k * 17) % 16) / 16 - 0.5) * (Math.PI / 6); // ±15° 確定性偏移
      const ang = (k / SHARD_N) * Math.PI * 2 + h;
      const sp = SHARD_SPD[0] + ((seed * 7 + k * 13) % (SHARD_SPD[1] - SHARD_SPD[0] + 1)); // 40-70 px/s
      anim.particles.push({
        kind: "shard", sprite: null,
        x: 320, y: oy,
        vx: Math.cos(ang) * sp / 60, vy: Math.sin(ang) * sp / 60 - 0.6,
        gravity: 0.0016, life: SHARD_LIFE, maxLife: SHARD_LIFE,
        color: colors[k % 2], size: size >= 3 ? 3 : (k % 3 === 0 ? 3 : 2), t: anim.screenT
      });
    }
  }
  function spawnKillFX(boss, sprite, size) {
    // v628 擊殺消散終拍：體色碎片噴散＋白色剪影命終閃（0.15s）；
    // fx_boom 金褐塊移除（與金幣同色讀不出爆炸 — round-18 取證）
    size = size || (boss ? 3 : 2);
    spawnShards(sprite, size);
    spawnKillRing(320, 200); // v695：擊殺銀白閃環
    // v639：移除命終白閃（使用者決策）;碎片/擊敗文字/金幣保留
    // if (!rm()) anim.killFlash = { sprite, size, t: KILL_FLASH, max: KILL_FLASH };
    // v628：「擊敗！」/「BOSS討伐！」走 v585 merge/分道 — 同桶合併為單一持久金字
    // （合併 pop 脈衝保留每殺跳感）,不再同點堆 2-3 層（round-18 取證）
    spawnFloat(320, 185, boss ? "BOSS討伐！" : "擊敗！", "#ffd166", true, { merge: boss ? "m_killboss" : "m_kill", side: "m" });
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
        spawnEnterRipple(320, 200); // v691：魔物登場漣漪
        spawnEnterMark(320, 175); // v795：登場紫門標
        if (F.m.boss) bossImpact(0.35, 0, 0.5);
      }
    }
    if (anim.entering > 0) anim.entering = Math.max(0, anim.entering - dt);
    if (anim.bossFlash > 0) anim.bossFlash = Math.max(0, anim.bossFlash - rawDt);
    if (anim.bossGreen > 0) anim.bossGreen = Math.max(0, anim.bossGreen - rawDt); // v558：回血綠閃衰減
    if (anim.regionFlash > 0) anim.regionFlash = Math.max(0, anim.regionFlash - rawDt);
    if (anim.extraShake > 0) anim.extraShake = Math.max(0, anim.extraShake - rawDt * 1.4);
    if (anim.monsterFlash > 0) anim.monsterFlash = Math.max(0, anim.monsterFlash - rawDt);
    // v628 垂死體時程：上升消散 0.45s 後移除（擊殺 FX 已於 kill 事件即時觸發,此處僅收尾殘影）
    if (anim.death) {
      anim.death.t -= dt;
      if (anim.death.t <= 0) anim.death = null;
    }
    if (anim.killFlash) { // v628 命終白閃衰減（rawDt — 不受 hit-stop 凍結,與 bossFlash 同）
      anim.killFlash.t -= rawDt;
      if (anim.killFlash.t <= 0) anim.killFlash = null;
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
      if (p.kind === "bolt" || p.kind === "pillar" || p.kind === "arc" || p.kind === "cloud" || p.kind === "streak" || p.kind === "dagger" || p.kind === "ring" || p.kind === "healburst" || p.kind === "fireburst" || p.kind === "regenpulse" || p.kind === "siphon" || p.kind === "shockwave" || p.kind === "bossburst" || p.kind === "elitegate" || p.kind === "levelburst" || p.kind === "retreatveil" || p.kind === "resumering" || p.kind === "homeportal" || p.kind === "regionflare" || p.kind === "buffglow" || p.kind === "clearring" || p.kind === "stageflare" || p.kind === "dotripple" || p.kind === "advancering" || p.kind === "shieldclang" || p.kind === "enterripple" || p.kind === "critring" || p.kind === "mhitdust" || p.kind === "killring" || p.kind === "hitring" || p.kind === "downburst" || p.kind === "farmflare" || p.kind === "champring" || p.kind === "unlockgate" || p.kind === "fallflare" || p.kind === "lootflare" || p.kind === "elitering" || p.kind === "potburst" || p.kind === "gemflare" || p.kind === "potdrop" || p.kind === "bookflare" || p.kind === "matflare" || p.kind === "ticketflare" || p.kind === "honorflare" || p.kind === "castring" || p.kind === "aoering" || p.kind === "tauntmark" || p.kind === "multimark" || p.kind === "healring" || p.kind === "poisonmark" || p.kind === "buffmark" || p.kind === "freezemark" || p.kind === "firemark" || p.kind === "boltmark" || p.kind === "holymark" || p.kind === "slashmark" || p.kind === "arrowmark" || p.kind === "daggermark" || p.kind === "shieldmark" || p.kind === "critskill" || p.kind === "leechmark" || p.kind === "chillmark" || p.kind === "toxmark" || p.kind === "lvmark" || p.kind === "powermark" || p.kind === "elitemark" || p.kind === "bossmark" || p.kind === "rapidmark" || p.kind === "caremark" || p.kind === "burnmark" || p.kind === "venommark" || p.kind === "fallmark" || p.kind === "toxcast" || p.kind === "wrathmark" || p.kind === "resumemark" || p.kind === "homemark" || p.kind === "liberatemark" || p.kind === "clearmark" || p.kind === "restagemark" || p.kind === "advancemark" || p.kind === "unlockmark" || p.kind === "retreatmark" || p.kind === "farmmark" || p.kind === "killmark" || p.kind === "lootmark" || p.kind === "backmark" || p.kind === "critmark" || p.kind === "matmark" || p.kind === "ticketmark" || p.kind === "gemmark" || p.kind === "potmark" || p.kind === "honormark" || p.kind === "champmark" || p.kind === "bookmark" || p.kind === "goldmark" || p.kind === "expmark" || p.kind === "regenmark" || p.kind === "stealmark" || p.kind === "elmark" || p.kind === "wardmark" || p.kind === "painmark" || p.kind === "castmark" || p.kind === "entermark" || p.kind === "bashmark" || p.kind === "aidmark" || p.kind === "boostmark" || p.kind === "elixirmark" || p.kind === "strikemark" || p.kind === "vialmark" || p.kind === "manamark" || p.kind === "rallymark" || p.kind === "goadmark" || p.kind === "flurrymark" || p.kind === "slammark" || p.kind === "gleammark" || p.kind === "vanquishmark" || p.kind === "cleavemark" || p.kind === "piercemark" || p.kind === "aegismark" || p.kind === "frostmark" || p.kind === "embermark" || p.kind === "shivmark" || p.kind === "plaguemark" || p.kind === "voltmark" || p.kind === "blessmark" || p.kind === "luckmark" || p.kind === "drainmark" || p.kind === "rimemark" || p.kind === "crushmark" || p.kind === "blitzmark" || p.kind === "scorchmark" || p.kind === "blightmark" || p.kind === "thrustmark" || p.kind === "balmmark" || p.kind === "baitmark" || p.kind === "swarmmark" || p.kind === "crestmark" || p.kind === "glacemark" || p.kind === "blazemark" || p.kind === "sparkmark" || p.kind === "halomark" || p.kind === "rendmark" || p.kind === "fletchmark") {
        // 靜態形狀特效：只扣 life（…／v699／v703 champring/unlockgate/fallflare）
        p.life -= dt;
        if (p.life <= 0) anim.particles.splice(i, 1);
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
      // v628 上升消散：p 0→1,上飄 DEATH_RISE px（t² 加速）＋ alpha (1-p)²（前段保留可辨體形、後段快速消失）,
      // 縮放恆 1 不壓扁;rm 定幀 — 靜態 alpha 0.35 單幀,不上升
      const p = Math.min(1, Math.max(0, 1 - d.t / d.max));
      dying = {
        sprite: d.sprite, size: d.size, x: 320,
        yOff: rm() ? 0 : -DEATH_RISE * p * p,
        alpha: rm() ? 0.35 : (1 - p) * (1 - p)
      };
    }
    // v628 命終白閃 view（hunt.js 端已 rm 守閘；y = 怪物原位頂緣,與在場怪物同地面錨）
    const killFlash = anim.killFlash ? {
      sprite: anim.killFlash.sprite, size: anim.killFlash.size,
      x: 320, y: 270 * 0.72 + 8 - 16 * anim.killFlash.size,
      alpha: Math.max(0, anim.killFlash.t / anim.killFlash.max) * 0.9
    } : null;
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
      killFlash,
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
    MG.ui.render.drawTown(ctx, {
      h: H, t: anim.screenT, buildings,
      period: (MG.ui.kingdom && MG.ui.kingdom.townPeriod) ? MG.ui.kingdom.townPeriod() : "night", // v649
      season: (MG.ui.kingdom && MG.ui.kingdom.townSeason) ? MG.ui.kingdom.townSeason() : "summer" // v669
    });
    // 城內的英雄（休息中 — 站在地面上，頭頂 💤）
    // v589：休息/待機態 F.team 為空（teamView() 只讀在戰戰鬥隊）— 城內場景改以名冊編隊為源，
    // 每次回城都看得到「我的英雄在村裡休息眨眼」；sprite 契約與 battle.js 同源（classes[cls].icon）
    const rst = S();
    const team = (rst.formation || [])
      .map(id => (rst.hunters || []).find(x => x.id === id))
      .filter(Boolean)
      .map((h, i) => ({
        sprite: (MG.data.hunters.classes[h.cls] || {}).icon,
        flip: true,
        seed: i * 1.7
      }))
      .filter(h => h.sprite);
    team.forEach((h, i) => {
      const tx = W / 2 + (i - (team.length - 1) / 2) * 52;
      const ty = H - 34 - 30;
      const bob = Math.sin(anim.screenT * 3 + i * 1.7) * 1.2;
      MG.ui.render.draw(ctx, h.sprite, tx, ty + bob, 1, { scale: 2, flip: h.flip, frame: 0, t: anim.screenT });
      // v568：休息中的英雄也眨眼（待機動作；rm 不眨 — 與戰場同閘）
      const seed = h.seed !== undefined ? h.seed : i * 1.7;
      if (!rm) MG.ui.render.drawBlink(ctx, h.sprite, tx, ty + bob, h.flip, anim.screenT, seed);
      // v661：休息偶發撓頭（每 ~7s 一次 ~0.55s；與眨眼錯相；rm 無）
      if (!rm && ((anim.screenT + seed * 1.7) % 7) < 0.55) {
        const hx = Math.round(tx) + (h.flip ? 4 : 22);
        const hy = Math.round(ty + bob);
        ctx.fillStyle = "#ead49a";
        ctx.fillRect(hx, hy + 4, 3, 8);
        ctx.fillRect(hx + (h.flip ? -1 : 0), hy + 1, 4, 3);
      }
      // v589修正：💤 原繪於 ty-6（≈200）疊在遠排建築名牌帶（drawTown 標籤 baseline ≈198・文字 188-198）上，
      // 改置頭頂正上方 ty-26（≈180）避開名牌文字帶 — 站位/眨眼閘/熱區一律不動
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#9db4ff";
      ctx.fillText("💤", tx + 16, ty - 26);
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
    // v658：連敗 N/3 與自動進關暫停寫入正文（零點擊可讀）
    if (statusEl) {
      let icon = "⏳", txt = "待機中 — 按下「派遣」率領編隊出征", color = "var(--dim)";
      const ws = st.hunt.wipeStreak || 0;
      const aaOff = st.hunt.autoAdvance === false;
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
      if (ws > 0 && ws < 3) txt += " · 連敗 " + ws + "/3";
      if (aaOff) txt += " · 自動進關已暫停";
      statusEl.textContent = icon + " " + txt;
      statusEl.style.color = color;
      statusEl.title = ds.ids.length && !ds.resting
        ? "編隊 " + ds.ids.length + " 名英雄討伐中 — 自動續戰" + (auto ? "已開" : "未開（休息後待機）") + "・自動進關" + ((st.hunt.autoAdvance !== false) ? "已開（自動前往下一關）" : "關（原地重複討伐）") + (ws > 0 ? "・連敗 " + ws + "/3" : "")
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
        // v588：以 OFFLINE_RATE 為底顯示（層 0 即 ×1.20 與離線即時齊平）+ 每層 +5% → 派遣中恆顯示
        const fl = MG.sys.battle.focusLayers();
        offNoteEl.textContent = "　🔥 在線專注 ×" + (MG.config.OFFLINE_RATE + MG.config.ACTIVE_FOCUS.perHour * fl).toFixed(2) + "（" + fl + "/" + MG.config.ACTIVE_FOCUS.max + "h）";
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
        style: Object.assign({ width: "100%", justifyContent: "flex-start", padding: "5px 7px", minHeight: 44, fontSize: 15, flex: "0 0 auto" }, locked ? { opacity: 0.5 } : {}),
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
        style: { position: "absolute", right: 8, bottom: 8, width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(255,209,102,0.6)", background: "rgba(10,12,24,0.82)", color: "var(--gold)", fontSize: 12, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 4, boxShadow: "0 1px 5px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(0,0,0,0.25)", userSelect: "none", WebkitTapHighlightColor: "transparent" },
        title: "戰鬥速度",
        on: { click: toggleSpeed }
      }, "▶");
      wrap.appendChild(speedFab);
      // 關卡情報按鈕（金色圓形，加速鈕左邊）：戰利品與地圖資訊
      infoFab = MG.ui.dom.h("button", {
        style: { position: "absolute", right: 56, bottom: 8, width: 44, height: 44, borderRadius: "50%", border: "2px solid rgba(255,209,102,0.9)", background: "linear-gradient(180deg,#ffd166,#f0a83a)", color: "#3a2500", fontSize: 16, fontWeight: 900, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 4, boxShadow: "0 1px 6px rgba(0,0,0,0.5), 0 0 10px rgba(255,209,102,0.35)", userSelect: "none", WebkitTapHighlightColor: "transparent" },
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
          "自動進關"));
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
      // v629 QoL：快捷導航（英雄/裝備）— 掛機時一鍵查看/強化，不離開副本上下文
      const quickNav = MG.ui.dom.h("div", { style: { display: "flex", gap: 8, margin: "8px 10px 0" } },
        MG.ui.dom.h("button", {
          class: "chip", style: { flex: 1, justifyContent: "center", minWidth: 0 },
          title: "查看英雄名冊（等級/星級/技能）— 不離開副本",
          on: { click: () => MG.ui.screens.show("hunters") }
        }, MG.ui.dom.icon("icon_hunter", 14), MG.ui.dom.h("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "英雄")),
        MG.ui.dom.h("button", {
          class: "chip", style: { flex: 1, justifyContent: "center", minWidth: 0 },
          title: "查看裝備背包（強化/鑲嵌）— 不離開副本",
          on: { click: () => MG.ui.screens.show("equipment") }
        }, MG.ui.dom.icon("icon_equip", 14), MG.ui.dom.h("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "裝備")));
      root.appendChild(quickNav);
      // log
      logEl = MG.ui.dom.h("div", { style: { margin: "8px 10px 4px", padding: "8px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 8, minHeight: 40 } });
      root.appendChild(MG.ui.dom.h("div", { class: "section-h", style: { margin: "4px 10px 0", alignItems: "center", gap: 8 } },
        MG.ui.dom.h("span", { class: "t" }, "戰鬥紀錄"),
        MG.ui.dom.h("button", { class: "chip", style: { marginLeft: "auto", padding: "2px 10px", minHeight: 44, borderColor: "var(--gold2)", color: "var(--gold)", fontWeight: 800 }, on: { click: openLogModal } },
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
      spawnPotBurst(240, 150); // v707：藥水薄荷爆
      if (isBoost) spawnBoostMark(240, 130); // v799：加速沙漏琥珀標
      else spawnElixirMark(240, 130); // v799：靈藥琥珀瓶標
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
    if (used > 0) {
      spawnPotBurst(240, 150); // v707：藥水薄荷爆
      spawnVialMark(240, 130); // v803：生命藥水玫心標
    }
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
    if (used > 0) {
      spawnPotBurst(240, 150); // v707：藥水薄荷爆
      spawnManaMark(240, 130); // v803：魔力藥水藍滴標
    }
    MG.ui.dom.toast(used > 0 ? "全隊魔力已補滿（" + used + " 瓶・恢復 " + MG.util.fmt(restored) + "）" : "藥水用盡，無法補滿", used > 0 ? "good" : "bad", "icon_pot_mp");
    syncDom(MG.sys.battle.get());
  }
  MG.ui.screens.register("hunt", screen);
  /* v246 圖鑑深鏈：一鍵前往目標魔物關卡（守衛：未解鎖區/戰鬥中拒絕 — v226 任務深鏈模式） */
  function gotoMonster(regionIdx, stage) {
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
    MG.ui.screens.show("hunt");
    if (typeof refreshChips === "function") refreshChips();
  }
  /* v670：快捷鍵派遣 — 僅編隊就緒待機時開派遣窗；回傳是否已處理 */
  function tryHotkeyDispatch() {
    const st = S();
    const ds = dispatchState();
    const formationCount = (st.formation || []).filter(id => id && (st.hunters || []).some(h => h.id === id)).length;
    if (coachMode(MG.sys.battle.get(), ds, formationCount) !== "ready") return false;
    const team = (st.formation || []).filter(id => id && (st.hunters || []).some(h => h.id === id)).map(id => (st.hunters || []).find(h => h.id === id)).filter(Boolean);
    if (!team.length) return false;
    openDispatchDialog(team);
    return true;
  }
  // v630FIX: test accessor for verification (removed before commit)
  screen._getAnim = () => ({ screenT: anim.screenT, poisonUntil: { ...anim.poisonUntil }, hurtUntil: { ...anim.hurtUntil } });
  screen._getAnimRef = () => anim; // direct ref for injection tests
  screen._spawnIceShards = spawnIceShards; // v643 verify hook
  screen._spawnLightningChain = spawnLightningChain; // v647 verify hook
  screen._spawnHolyPillar = spawnHolyPillar; // v651 verify hook
  screen._spawnSlashArc = spawnSlashArc; // v655 verify hook
  screen._spawnPoisonCloud = spawnPoisonCloud; // v659 verify
  screen._spawnArrowStreak = spawnArrowStreak; // v659 verify
  screen._spawnDaggerFan = spawnDaggerFan; // v659 verify
  return Object.assign(screen, { gotoMonster, tryHotkeyDispatch }); // v246：圖鑑深鏈；v670：快捷派遣
})();
