/* 放置王國 MEGA IDLE — game state, main loop, economy glue (core engine, owned by Main) */
"use strict";
MG.game = MG.game || {};
MG.sys = MG.sys || {};
MG.sys.game = (function () {
  const U = MG.util;
  const S = () => MG.game.state;

  function init() {
    MG.game.state = MG.core.save.load() || MG.core.save.newState();
    MG.sys.meta.tick();
    MG.sys.battle.reset();
  }
  function afterReset() {
    MG.sys.battle.reset();
    MG.sys.meta.tick();
    if (MG.ui && MG.ui.screens) MG.ui.screens.refreshAll();
  }
  function addGold(n, why) {
    const st = S();
    st.currencies.gold = Math.max(0, st.currencies.gold + n);
    if (n > 0) {
      st.stats.goldEarned += n;
      if (MG.sys.meta && MG.sys.meta.bump) MG.sys.meta.bump("gold", n); // v151：每週任務金幣計數
    }
  }
  function kingdomExpNeed(lvl) { return Math.floor(60 * Math.pow(lvl, 1.35)); }
  /* v269 王國里程碑禮包（一次性 — kl 24-40 目標斷點填補；總量 ≈3 週產、每包 < 週產 5%；st.kingdomMile optional 欄位零遷移） */
  const KINGDOM_MILESTONES = {
    20: { gems: 150, book: 20 },
    25: { gems: 200, ticket: 2 },
    30: { gems: 300, void: 30, book: 30 },
    35: { gems: 400, myth: 20, ticket: 3 },
    40: { gems: 500, book: 50 }
  };
  function addKingdomExp(n) {
    const st = S();
    if (n <= 0) return;
    // v169 開拓傳統：王國經驗 +10%/級（跨昇華永久）
    if (MG.sys.meta && MG.sys.meta.traditionEffects) n = Math.floor(n * (1 + MG.sys.meta.traditionEffects().pioneer));
    // v269FIX：舊檔補發 — v269 前已達 Lv20+ 的存檔，低於當前等級的里程碑檔位無法靠升級跨越觸發 → 補領（kingdomMile 冪等）
    if (!st.kingdomMile) st.kingdomMile = {};
    for (const l of Object.keys(KINGDOM_MILESTONES).map(Number)) {
      if (l <= st.kingdom.level && !st.kingdomMile[l]) {
        st.kingdomMile[l] = true;
        const m = KINGDOM_MILESTONES[l];
        const parts = [];
        if (m.gems) { st.currencies.gems += m.gems; parts.push("鑽石 +" + m.gems); }
        if (m.book) { st.currencies.book = (st.currencies.book || 0) + m.book; parts.push("技能書 +" + m.book); }
        if (m.ticket) { st.currencies.ticket = (st.currencies.ticket || 0) + m.ticket; parts.push("招募券 +" + m.ticket); }
        if (m.void) { st.mats.void = (st.mats.void || 0) + m.void; parts.push("虛空 +" + m.void); }
        if (m.myth) { st.mats.myth = (st.mats.myth || 0) + m.myth; parts.push("神話 +" + m.myth); }
        MG.ui.dom.toast("王國 Lv" + l + " 里程碑補領！" + parts.join("・"), "good", "icon_castle");
      }
    }
    if (st.kingdom.level >= 50) { st.kingdom.exp = 0; return; } // 滿級：經驗歸零不再累積
    st.kingdom.exp += n;
    let ups = 0;
    while (st.kingdom.exp >= kingdomExpNeed(st.kingdom.level) && st.kingdom.level < 50) {
      st.kingdom.exp -= kingdomExpNeed(st.kingdom.level);
      st.kingdom.level++; ups++;
      // v269FIX：里程碑逐級檢查（放迴圈內 — 原迴圈後只查最終 lv → 大量經驗跳級時 20/25/30 全錯過）
      if (!st.kingdomMile) st.kingdomMile = {};
      const mileNow = KINGDOM_MILESTONES[st.kingdom.level];
      if (mileNow && !st.kingdomMile[st.kingdom.level]) {
        st.kingdomMile[st.kingdom.level] = true;
        const parts = [];
        if (mileNow.gems) { st.currencies.gems += mileNow.gems; parts.push("鑽石 +" + mileNow.gems); }
        if (mileNow.book) { st.currencies.book = (st.currencies.book || 0) + mileNow.book; parts.push("技能書 +" + mileNow.book); }
        if (mileNow.ticket) { st.currencies.ticket = (st.currencies.ticket || 0) + mileNow.ticket; parts.push("招募券 +" + mileNow.ticket); }
        if (mileNow.void) { st.mats.void = (st.mats.void || 0) + mileNow.void; parts.push("虛空 +" + mileNow.void); }
        if (mileNow.myth) { st.mats.myth = (st.mats.myth || 0) + mileNow.myth; parts.push("神話 +" + mileNow.myth); }
        MG.ui.dom.toast("王國 Lv" + st.kingdom.level + " 里程碑！" + parts.join("・"), "good", "icon_castle");
      }
    }
    if (ups) {
      if (st.kingdom.level >= 50) st.kingdom.exp = 0; // 抵達滿級：殘留經驗歸零
      // 升級禮包：金幣隨等級成長；每 5 級加贈鑽石（升級有感，不只是門檻）
      const lv = st.kingdom.level;
      const goldGift = Math.floor(200 * Math.pow(lv, 1.4));
      MG.sys.game.addGold(goldGift, "王國升級禮");
      let msg = "王國升級！目前等級 " + lv + "（禮金 +" + MG.util.fmt(goldGift) + "）";
      if (lv % 5 === 0) {
        st.currencies.gems += 10;
        msg += "・鑽石 +10";
      }
      MG.ui.dom.toast(msg, "gold", "icon_castle");
      MG.core.audio.SFX.levelup();
      // v207：王國升級里程碑儀式（村莊王城金環＋粒子＋banner）
      if (MG.ui.kingdom && MG.ui.kingdom.showCastleLevelUp) MG.ui.kingdom.showCastleLevelUp(lv);
    }
  }
  let lastTick = 0;
  // 背景運行對策（v131/v143）：Chrome 隱藏分頁 5 分鐘後 setInterval 節流到每分鐘 1 次、
  // Memory Saver 可能凍結分頁使 timer 完全暫停——長間隔拆成 ≤0.5s 子步執行，
  // dt 上限 = 離線收益上限（12h），掛在背景/其他分頁/凍結恢復時進度完整補發
  let catchupMode = false; // 大補發期間靜音（抑制掉落 toast/SFX 爆量）
  const SIM_STEP = 0.5;
  /* v572 卡牆自動再推：引擎退守（v559/v560 連敗回退 — 3 連敗暫停自動進關）後，
     隊伍在退守點練角成長到足以突破原牆時自動恢復自動進關 — 「卡關→退守→練角→突破」
     迴圈閉合，放置承諾（關掉也在成長/推進）不再斷在牆邊。
     偵測訊號（無歧義）：3 連敗 fallback = wipeStreak 歸零 + autoAdvance 被引擎關閉
     （手動切換「自動進關」不會碰 wipeStreak；擊殺歸零不會碰 autoAdvance）—
     玩家手動關閉時 hunt.js 清除 aaPark marker，此後永不自動恢復（練角專用契約保留）。 */
  const PARK_RESUME_MARGIN = 1.15; // 牆點建議戰力 ×1.15 才恢復（誤差緩衝 — 恢復後不會立刻再滅團）
  const PARK_CHECK_MS = 2000;      // 恢復檢查節流（formationPower 有成本 — 2 秒一次即可）
  function parkProbe(st) {
    return { aa: st.hunt.autoAdvance !== false, ws: st.hunt.wipeStreak || 0, r: st.hunt.region, n: st.hunt.stage, d: st.hunt.difficulty || 0 };
  }
  function parkWatch(st, pre) {
    if (st.hunt.autoAdvance !== false || (st.hunt.wipeStreak || 0) !== 0 || pre.ws < 1) return;
    if (st.hunt.region === (MG.sys.abyss ? MG.sys.abyss.INDEX : 10)) return; // 深淵無退守（原契約）
    if (pre.aa || st.hunt.aaPark) { // 引擎停機（首次）或已在停機（re-park 更新牆點）；手動關閉 = marker 已清 → 永不誤記
      st.hunt.aaPark = { r: pre.r, n: pre.n, d: pre.d }; // 牆點 = 退守前的關卡/難度（打不贏的牆）
    }
  }
  function parkResume(st) {
    const P = st.hunt.aaPark;
    if (!P || st.hunt.autoAdvance !== false) return;
    const n = Date.now();
    if (n - (st.hunt.aaParkT || 0) < PARK_CHECK_MS) return;
    st.hunt.aaParkT = n;
    const dm = ((MG.config.DIFFICULTY[P.d] || MG.config.DIFFICULTY[0]).mult || 1);
    const req = MG.sys.battle.stagePowerReq(P.r, P.n, dm); // 牆點原難度倍率 — 遷移後難度變了也不失真
    if (MG.sys.battle.formationPower() >= req * PARK_RESUME_MARGIN) {
      st.hunt.autoAdvance = true;
      delete st.hunt.aaPark;
      delete st.hunt.aaParkT;
      const rn = ((MG.data.monsters.regions || [])[P.r] || { name: "獵場" }).name;
      const msg = "已可突破「" + rn + "・" + MG.config.stageLabel(P.n) + "」！自動進關已恢復 — 練角完成，繼續推進";
      log(msg, "icon_sword");
      if (!isSilent()) {
        MG.ui.dom.toast(msg, "good", "icon_sword");
        MG.core.audio.SFX.quest();
      }
    }
  }
  function isSilent() { return catchupMode || document.hidden; }
  function tick(now) {
    const st = S();
    if (!lastTick) lastTick = now;
    let dt = (now - lastTick) / 1000;
    lastTick = now;
    dt = Math.max(0, Math.min(dt, MG.config.OFFLINE_CAP_H * 3600)); // 時鐘回跳防護（reload 離線另結算）
    st.stats.playSec += dt;
    const big = dt > 30; // 跨背景/凍結的補發：靜音模擬 + 結束刷新 UI
    if (big) catchupMode = true;
    let acc = dt;
    while (acc > 0.001) {
      const s = Math.min(SIM_STEP, acc);
      const pre = parkProbe(st); // v572 卡牆自動再推：引擎退守偵測（simStep 前後探針）
      simStep(s);
      parkWatch(st, pre);
      acc -= s;
    }
    parkResume(st); // v572：練角足以突破牆點時自動恢復自動進關（2s 節流）
    if (big) {
      catchupMode = false;
      if (MG.ui && MG.ui.screens && MG.ui.screens.refreshAll) MG.ui.screens.refreshAll();
      if (dt > 90) MG.ui.dom.toast("背景運行補發 " + MG.util.fmt(Math.round(dt)) + " 秒進度！", "gold", "icon_castle");
    }
  }
  function simStep(dt) {
    const st = S();
    // buff expiry
    const n = Date.now();
    for (const k of ["potAtk", "potGold", "potExp"]) if (st.buffs[k] && st.buffs[k] < n) st.buffs[k] = 0;
    MG.sys.meta.tick();
    // 流浪英雄（生成/心情/消費/副本）
    if (MG.sys.wanderers) MG.sys.wanderers.tick(dt);
    // v271 委託遠征營牆鐘結算（完成即入帳 — 輕量掃 6 槽；離線段由 save.applyOffline）
    if (MG.sys.expedition && MG.sys.expedition.settleAll) {
      const doneList = MG.sys.expedition.settleAll();
      if (doneList.length && !isSilent()) {
        MG.ui.dom.toast("遠征完成：" + doneList.map(d => d.name + " +" + MG.util.fmt(d.gold) + "金").join("・"), "good", "icon_chest");
      }
    }
    // hunt sim — 僅在玩家派遣隊伍時運行（未派遣 = 英雄城內待機，不主動戰鬥）
    if (st.hunt && (st.hunt.region !== undefined) && (st.hunt.dispatchIds || []).length > 0) {
      let mult = st.hunt.speed || 1;
      if (st.buffs.boostUntil > n) mult *= 5;
      if (mult > 0) MG.sys.battle.step(dt * mult);
    } else {
      // 自動恢復：非戰鬥中（待機/召回後）英雄緩慢回血 2%/秒、回魔 5%/秒，滿為止
      for (const h of st.hunters || []) {
        if (h.hp !== undefined) {
          const max = MG.sys.hunters.effectiveStats(h).hp;
          if (h.hp < max) h.hp = Math.min(max, h.hp + max * 0.02 * dt);
        }
        if (h.mp !== undefined) {
          const maxMp = MG.sys.hunters.effectiveStats(h).mp;
          if (h.mp < maxMp) h.mp = Math.min(maxMp, h.mp + maxMp * 0.05 * dt);
        }
      }
    }
    autoDrink();
  }
  // 自動喝水：設定閾值後，任一陣營英雄低於 X% 自動消耗藥水（1 秒冷卻）
  function autoDrink() {
    const st = S();
    const ap = st.settings && st.settings.autoPotion;
    if (!ap || (!ap.hp && !ap.mp)) return;
    const n = Date.now();
    if (st.autoPotionCd && n < st.autoPotionCd) return;
    const drink = (defId, isHp, name, icon) => {
      const item = st.inventory.items.find(i => i.defId === defId);
      if (!item || !item.qty) return false;
      item.qty = (item.qty || 1) - 1;
      if (item.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== item.uid);
      const F = MG.sys.battle.get();
      if (F && F.team.length && F.phase === "fight") {
        // 戰鬥中：直接補場上單位並同步回持久狀態
        for (const t of F.team) {
          if (isHp) t.hp = Math.min(t.maxHp, t.hp + Math.round(t.maxHp * 0.5));
          else t.mp = Math.min(t.maxMp, t.mp + Math.round(t.maxMp * 0.5));
        }
        MG.sys.battle.syncTeamHp();
      } else {
        // 非戰鬥：直接補持久狀態
        for (const h of st.hunters) {
          const max = MG.sys.hunters.effectiveStats(h)[isHp ? "hp" : "mp"];
          if (isHp) { if (h.hp === undefined) continue; h.hp = Math.min(max, h.hp + Math.round(max * 0.5)); }
          else { if (h.mp === undefined) continue; h.mp = Math.min(max, h.mp + Math.round(max * 0.5)); }
        }
      }
      MG.core.audio.SFX.potion();
      MG.ui.dom.toast("自動使用：" + name, "good", icon);
      st.autoPotionCd = n + 1000;
      return true;
    };
    if (ap.hp > 0 && st.hunters.some(h => h.hp !== undefined && h.hp / MG.sys.hunters.effectiveStats(h).hp < ap.hp / 100)) {
      drink("item_pot_hp", true, "生命藥水", "icon_pot_hp");
    } else if (ap.mp > 0 && st.hunters.some(h => h.mp !== undefined && h.mp / MG.sys.hunters.effectiveStats(h).mp < ap.mp / 100)) {
      drink("item_pot_mp", false, "魔力藥水", "icon_pot_mp");
    }
  }
  function log(msg, icon) {
    const st = S();
    st.log.unshift({ msg, icon: icon || "", t: Date.now() });
    if (st.log.length > 100) st.log.length = 100; // 保留 100 筆供瀏覽
  }
  return { init, afterReset, addGold, kingdomExpNeed, addKingdomExp, KINGDOM_MILESTONES, tick, isSilent, log }; // v269 里程碑表 export（UI 下個里程碑提示）
})();
