/* 放置王國 MEGA IDLE — 無盡深淵（v160，slice B5 延伸）
   市面放置英雄標準無盡塔（AFK Arena 王座之塔／放置奇兵試煉之塔）：
   深度即關卡（region=10 特殊區域），每 10 層深淵領主，獎勵隨深度成長。
   最佳層數與里程碑（首通）紀錄；第 5 區域（深淵裂谷）通關解鎖。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.abyss = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const INDEX = MG.data.monsters.regions.length - 1; // 10（第 11 張區域）
  const UNLOCK_REGION = 5; // 第 5 區域（index 4）通關解鎖

  const MILESTONES = [
    { floor: 10, r: { gems: 30 } },
    { floor: 25, r: { gems: 50, ticket: 1 } },
    { floor: 50, r: { gems: 100, ticket: 2 } },
    { floor: 100, r: { gems: 200, ticket: 3, honor: 50 } },
    // v209 長期留存：深淵 100 層後零目標 → 終局里程碑（150/200/300 層）
    // v229 結構對沖：加碼 + 新增 400 層（深淵週結算/里程碑成為每週實質回報來源）
    { floor: 150, r: { gems: 400, ticket: 2, honor: 100 } },
    { floor: 200, r: { gems: 600, ticket: 3, honor: 200 } },
    { floor: 300, r: { gems: 1000, ticket: 4, honor: 300 } },
    { floor: 400, r: { gems: 1500, ticket: 5, honor: 500 } },
    // v234 深度階梯：400+ 無盡深度重新有目標（每 100-200 層一個 1-3 週可見里程碑 — 6-12 個月階梯）
    { floor: 500, r: { gems: 2000, ticket: 6, honor: 700 } },
    { floor: 600, r: { gems: 2800, ticket: 8, honor: 1000 } },
    { floor: 800, r: { gems: 4000, ticket: 10, honor: 1500 } },
    { floor: 1000, r: { gems: 6000, ticket: 12, honor: 2200 } }
  ];

  function ensure() {
    const st = S();
    if (!st.abyss) st.abyss = { best: 0, claimed: {}, returnRegion: 0 };
    if (!st.abyss.claimed || typeof st.abyss.claimed !== "object") st.abyss.claimed = {};
    // v209 週結算欄位（舊檔補空）
    if (!st.abyss.weekKey) st.abyss.weekKey = "";
    if (!st.abyss.weekPeak) st.abyss.weekPeak = 0;
    if (!st.abyss.weekBest) st.abyss.weekBest = 0;
    if (typeof st.abyss.autoRetry !== "boolean") st.abyss.autoRetry = false; // v258 深淵連續挑戰（舊檔兜底）
    // v554FIX：舊存檔遷移 — 過去普通區域擊殺污染 abyss.best（≤10）：
    //   從未真正踏入深淵（無本週擊殺 peak、無週結算 best）時重設為 0，首進從第 1 層開始
    if ((st.abyss.best || 0) <= 10 && !(st.abyss.weekPeak || 0) && !(st.abyss.weekBest || 0)) {
      st.abyss.best = 0;
    }
    return st.abyss;
  }
  function unlocked() { return (S().stats.maxRegionReached || 0) >= UNLOCK_REGION; }
  function inAbyss() { return S().hunt.region === INDEX; }
  function best() { return ensure().best || 0; }
  /* 進入深淵：記住原區域、以最佳層數續戰（或第 1 層）、派遣當前編隊 */
  function enter() {
    const st = S();
    const ab = ensure();
    if (inAbyss()) return { ok: false, reason: "已在無盡深淵中" };
    if (!unlocked()) return { ok: false, reason: "擊敗第 5 區域（深淵裂谷）的 BOSS 後解鎖" };
    if ((st.hunt.restUntil || 0) > Date.now()) return { ok: false, reason: "隊伍休整中，稍後再出發" };
    ab.returnRegion = st.hunt.region;
    st.hunt.region = INDEX;
    st.hunt.stage = Math.max(1, ab.best || 1);
    st.hunt.wipeStreak = 0;
    st.hunt.difficulty = 0; // 深淵無難度倍率（獨立曲線）
    st.hunt.dispatchIds = MG.sys.hunters.teamOf().filter(id => id && st.hunters.some(h => h.id === id));
    st.hunt.restUntil = 0;
    MG.sys.battle.reset();
    MG.core.audio.SFX.boss();
    return { ok: true, stage: st.hunt.stage };
  }
  /* 離開深淵：回到進入前區域 */
  function leave() {
    const st = S();
    if (!inAbyss()) return;
    const ab = ensure();
    st.hunt.region = Math.min(ab.returnRegion || 0, st.stats.maxRegionReached || 0);
    st.hunt.stage = Math.min(st.hunt.stage, 10);
    st.hunt.dispatchIds = [];
    st.hunt.wipeStreak = 0;
    ab.autoRetry = false; // v258：離開清除連續挑戰（回到正常遊玩意圖）
    MG.sys.battle.reset();
    MG.ui.dom.toast("已離開無盡深淵", "", "icon_sword");
  }
  /* 擊殺掛鉤（battle kill handler 呼叫）：更新最佳層數＋本週峰值
     v554FIX：僅深淵內擊殺計入 — 原缺 inAbyss 守衛，普通區域任何 stage≥1 擊殺都會
     以該區域關卡數污染 abyss.best（打到第 10 關 = best 10）：未踏入深淵卻顯示「最佳 N 層」、
     首通里程碑可白領、首進直接從第 10 層（領主層）開打、建議戰力錯錨到高層 — 長線目標階梯全面失真 */
  function noteKill(stage) {
    const ab = ensure();
    if (!inAbyss()) return;
    const isNew = stage > (ab.best || 0); // v210FIX：僅新深度（首通）才掉片 — enter 回 best 層/連敗回退 stage-1 都會回到領主層，重刷會無限產碎片
    if (isNew) ab.best = stage;
    // v209 週結算峰值：僅深淵內擊殺計入（普通區域 BOSS 不污染 — 週結算獎勵的是深淵深度）
    if (stage > (ab.weekPeak || 0)) ab.weekPeak = stage;
    // v210 傳說徽章碎片：深淵領主（50+ 層每 10 層）首通擊殺必掉 1 枚
    if (isNew && stage >= 50 && stage % 10 === 0) {
      const st = S();
      st.legendShards = (st.legendShards || 0) + 1;
      if (MG.sys.game && !MG.sys.game.isSilent()) MG.ui.dom.toast("深淵領主掉落：傳說徽章碎片 ×1", "good", "icon_honor");
    }
    // v234 深度階梯：400+ 每 25 層首通 +1 徽章碎片（badge25 物件追蹤 — 每 25 層一次，防重刷）
    // v234FIX：排除 10 倍數層（450/500… 與 v210 領主碎片疊發 2 片 — 節奏不均）
    if (isNew && stage > 400 && stage % 25 === 0 && stage % 10 !== 0) {
      const st = S();
      if (!st.abyss.badge25) st.abyss.badge25 = {};
      if (!st.abyss.badge25[stage]) {
        st.abyss.badge25[stage] = true;
        st.legendShards = (st.legendShards || 0) + 1;
        if (MG.sys.game && !MG.sys.game.isSilent()) MG.ui.dom.toast("深淵深度獎勵：傳說徽章碎片 ×1（" + stage + " 層）", "good", "icon_honor");
      }
    }
  }
  /* v209 每週深度結算（週一錨點，與競技場/每週任務同 weekKey）：
     跨週首次呼叫時結算 — 上週峰值超過先前紀錄才發鑽石/榮譽（純增量、有封頂），
     金幣/經驗/素材等掉落不受影響（深淵是唯一無限內容 — 給週期錨點） */
  function checkWeekly() {
    const ab = ensure();
    const wk = MG.sys.meta.weekKey();
    if (ab.weekKey === wk) return null;
    let out = null;
    const peak = ab.weekPeak || 0;
    if (peak > (ab.weekBest || 0)) {
      // v229 結構對沖：深淵週結算封頂 100→200（peak*0.75）— 深淵從「零頭」變實質週回報
      // v234 檔位化：400/600/1000 層解鎖更高檔（400+ 有戰敗成本 — 加碼走深度挑戰非零風險掃蕩，防印鈔原則安全）
      let gems, honor;
      if (peak >= 1000) { gems = Math.min(750, Math.floor(peak * 1.1)); honor = Math.min(100, Math.floor(peak / 5)); }
      else if (peak >= 600) { gems = Math.min(550, Math.floor(peak)); honor = Math.min(80, Math.floor(peak / 6)); }
      else if (peak >= 400) { gems = Math.min(360, Math.floor(peak * 0.9)); honor = Math.min(60, Math.floor(peak / 7)); }
      else { gems = Math.min(200, Math.floor(peak * 0.75)); honor = Math.min(50, Math.floor(peak / 10)); }
      if (gems > 0 || honor > 0) {
        MG.sys.meta.grantReward({ gems, honor });
        out = { gems, honor, peak };
      }
    }
    ab.weekBest = Math.max(ab.weekBest || 0, peak);
    ab.weekPeak = 0;
    ab.weekKey = wk;
    return out;
  }
  /* v239 生成式無限里程碑：表內回表值、>1000 層每 100 層公式生成（k=(f-1000)/100）—
     深淵是唯一無限內容，1000 層後報酬不能歸零；獎勵增速 25%/100 層低於難度與戰力成長 → 相對變薄不印鈔 */
  function milestoneAt(floor) {
    const def = MILESTONES.find(x => x.floor === floor);
    if (def) return def;
    if (floor > 1000 && floor % 100 === 0) {
      const k = (floor - 1000) / 100;
      return { floor, r: { gems: 6000 + 1500 * k, honor: 2200 + 500 * k, ticket: 12 + 2 * Math.floor((k + 1) / 2) } };
    }
    return null;
  }
  function milestoneFloors(best) {
    const floors = MILESTONES.map(m => m.floor);
    for (let f = 1100; f <= best; f += 100) floors.push(f);
    return floors;
  }
  /* UI 用：表值 + best 後最近 1 個生成值（防無限列；v239FIX2：ceil 語義 — best=1100 顯示 1100 檔非 1200） */
  function visibleMilestones() {
    const ab = ensure();
    const out = MILESTONES.slice();
    const nxt = milestoneAt(Math.max(1100, 1000 + Math.ceil(Math.max(0, (ab.best || 0) - 1000) / 100) * 100));
    if (nxt && nxt.floor > 1000) out.push(nxt);
    return out;
  }
  function claim(n, silent) {
    const ab = ensure();
    const def = milestoneAt(n);
    if (!def || ab.claimed[n]) return false;
    if ((ab.best || 0) < n) return false;
    ab.claimed[n] = true;
    MG.sys.meta.grantReward(def.r);
    if (!silent) MG.core.audio.SFX.quest(); // v208：批量 silent
    return true;
  }
  /* v208 QoL：深淵里程碑全部領取（單一音效）；v239：以 best 為上界迴圈（生成值無窮 — 不可全表掃描） */
  function claimAll() {
    const ab = ensure();
    let n = 0;
    for (const f of milestoneFloors(ab.best || 0)) if (claim(f, true)) n++;
    if (n) MG.core.audio.SFX.quest();
    return n;
  }
  /* 戰鬥狀態（UI 輪詢）：深淵內的即時戰況 */
  function fightState() {
    const st = S();
    const F = MG.sys.battle.get && MG.sys.battle.get();
    const out = {
      inAbyss: inAbyss(), stage: st.hunt.stage, best: best(),
      fighting: !!(F && F.phase === "fight"),
      resting: ((st.hunt.restUntil || 0) > Date.now()),
      restLeft: Math.max(0, Math.ceil(((st.hunt.restUntil || 0) - Date.now()) / 1000)),
      team: 0
    };
    if (F && F.team) out.team = F.team.filter(h => h.hp > 0).length + "/" + F.team.length;
    if (F && F.m) out.monster = { name: F.m.name, hp: Math.max(0, Math.round(F.hp)), maxHp: F.maxHp, boss: F.m.boss };
    return out;
  }
  /* v215 深淵商店：深淵碎片（void/myth — 深淵掉落、無上限回收點）兌換深淵限定神器與素材包；
     複製 honorshop 的 {week, redeemed} 週限量模式（週一錨點） */
  const SHOP = [
    { id: "art_eye", name: "神器：深淵之瞳", icon: "icon_staff", cost: { void: 120 }, stock: 1, art: "abyss_eye", desc: "攻擊吸血 +5%" },
    { id: "art_walker", name: "神器：虛空行者", icon: "icon_boots", cost: { void: 180 }, stock: 1, art: "void_walker", desc: "攻速 +10%" },
    { id: "art_heart", name: "神器：深淵之心", icon: "icon_charm", cost: { void: 240 }, stock: 1, art: "abyss_heart", desc: "暴擊 +8%" },
    { id: "mats", name: "素材包（九種各 ×5）", icon: "mat_crystal", cost: { void: 40, myth: 10 }, stock: 5, mats: true, qty: 5, desc: "虛空/神話碎片換通用素材" },
    // v229 終局消耗端：T3 素材（虛空/神話）原無長期消耗 — 徽章碎片週限 2 片（8 傳說 ×21 片滿階週期 3.2 年 → 1.5-2 年可達）
    // v229FIX：qty 1 × stock 2 = 2 片/週（原 qty 2×stock 2 實發 4 片/週 — 滿階時程減半偏離設計）
    { id: "badge", name: "傳說徽章碎片", icon: "icon_star", cost: { void: 100 }, stock: 2, badge: true, qty: 1, desc: "深淵結晶兌傳說徽章碎片（100 虛空/片，週限隨深度 2-5 片）" },
    // v264 深淵商店 v2：週限消耗品（T3 死貨幣收尾 — 深度門檻確保中期節奏不變、僅深層解鎖）
    { id: "book", name: "技能書 ×5", icon: "icon_book", cost: { void: 150 }, stock: 4, book: 5, minBest: 600, desc: "虛空兌技能書（深度 600+，週限 4 包）" },
    { id: "ticket", name: "招募券 ×1", icon: "icon_ticket", cost: { void: 300 }, stock: 3, ticket: 1, minBest: 700, desc: "虛空兌招募券（深度 700+，週限 3 張）" }
  ];
  function shopWeekKey() {
    const d = new Date();
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return monday.getFullYear() + "-W" + Math.floor((monday - new Date(monday.getFullYear(), 0, 1)) / 864e5 / 7 + 1);
  }
  function shopEnsure() {
    const st = S();
    if (!st.abyssShop) st.abyssShop = { week: "", redeemed: {} };
    const s = st.abyssShop;
    if (!s.redeemed || typeof s.redeemed !== "object") s.redeemed = {};
    const wk = shopWeekKey();
    if (s.week !== wk) { s.week = wk; s.redeemed = {}; }
    return s;
  }
  function shopList() {
    shopEnsure();
    const s = S().abyssShop;
    return SHOP.map(it => Object.assign({}, it, {
      sold: s.redeemed[it.id] || 0,
      // v244 徽章碎片週限隨深度縮放；v264 週限消耗品深度門檻（未達標顯示鎖定）
      stock: it.badge ? Math.min(5, 2 + Math.floor(Math.max(0, (S().abyss && S().abyss.best || 0) - 400) / 300)) : it.stock,
      locked: it.minBest ? ((S().abyss && S().abyss.best || 0) < it.minBest) : false
    }));
  }
  function shopRedeem(id) {
    const st = S();
    const s = shopEnsure();
    const def = SHOP.find(x => x.id === id);
    if (!def) return { ok: false, reason: "商品不存在" };
    // v215FIX：一次性神器跨週重複兌換防護（週限量計數歸零 → 已擁有仍可再兌 → 白扣碎片）
    if (def.art && st.artifacts && st.artifacts.owned && st.artifacts.owned[def.art]) return { ok: false, reason: "已擁有此神器" };
    // v264：深度門檻守衛（週限消耗品未達標拒絕）
    if (def.minBest && (st.abyss && st.abyss.best || 0) < def.minBest) return { ok: false, reason: "深度 " + def.minBest + " 層以上解鎖" };
    const sold = s.redeemed[id] || 0;
    // v244：badge 庫存動態（與 shopList 同源）
    const dynStock = def.badge ? Math.min(5, 2 + Math.floor(Math.max(0, (st.abyss && st.abyss.best || 0) - 400) / 300)) : def.stock;
    if (sold >= dynStock) return { ok: false, reason: "已兌換完畢" };
    for (const m in def.cost) {
      if ((st.mats[m] || 0) < def.cost[m]) return { ok: false, reason: (MG.config.MATS[m] || {}).name + "不足（需 " + def.cost[m] + "）" };
    }
    for (const m in def.cost) st.mats[m] -= def.cost[m];
    s.redeemed[id] = sold + 1;
    if (def.art) {
      st.artifacts = st.artifacts || { owned: {}, levels: {} };
      if (!st.artifacts.owned) st.artifacts.owned = {};
      st.artifacts.owned[def.art] = true;
    } else if (def.mats) {
      for (const k in MG.config.MATS) st.mats[k] = (st.mats[k] || 0) + def.qty;
    } else if (def.badge) {
      // v229：深淵徽章碎片入庫（同 v210 傳說徽章碎片欄位 — 重複傳說自動轉片）
      st.legendShards = (st.legendShards || 0) + def.qty;
    } else if (def.book) {
      st.currencies.book = (st.currencies.book || 0) + def.book; // v264 週限消耗品
    } else if (def.ticket) {
      st.currencies.ticket = (st.currencies.ticket || 0) + def.ticket;
    }
    MG.core.audio.SFX.quest();
    MG.ui.dom.toast("兌換成功：" + def.name, "good", def.icon);
    return { ok: true, name: def.name };
  }
  /* v223 UI/UX：建議戰力（鏡像 hunt.js stagePowerReq 的 abyss 分支 — 程序化怪數值，註記對齊 loot.scaledMonster） */
  function suggestedPower(stage) {
    const boss = stage % MG.config.MAX_STAGE_PER_REGION === 0;
    const hp = (6000 + stage * 2500) * (boss ? 3 : 1);
    const atk = (80 + stage * 32) * (boss ? 1.8 : 1);
    const def = (12 + stage * 7) * (boss ? 1.8 : 1);
    const v = (hp / 1.6 + atk * 6 + def * 2) / 2;
    return Math.max(60, Math.ceil(v / 50) * 50);
  }
  /* v223 下一個首通里程碑（best 之後最近未領；v223FIX：全部已領才 null — 早期跳過未領仍顯示） */
  function nextMilestone() {
    const ab = ensure();
    const best = ab.best || 0;
    // 找下一個未領且高於 best 的（表 + 生成）
    for (const f of milestoneFloors(best + 300)) {
      if (f > best && !ab.claimed[f]) {
        const ms = milestoneAt(f);
        return { floor: f, dist: f - best, r: ms.r };
      }
    }
    // best 已超過全部 → 最近的可領取項（behind）
    for (const f of milestoneFloors(best).reverse()) {
      if (!ab.claimed[f]) {
        const ms = milestoneAt(f);
        return { floor: f, dist: 0, r: ms.r, behind: true };
      }
    }
    return null;
  }
  return { INDEX, UNLOCK_REGION, MILESTONES, ensure, unlocked, inAbyss, best, enter, leave, noteKill, claim, claimAll, checkWeekly, fightState, SHOP, shopList, shopRedeem, suggestedPower, nextMilestone, milestoneAt, visibleMilestones }; // v239 生成式里程碑
})();
