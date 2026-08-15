/* 放置王國 MEGA IDLE — building logic (slice B4 owns)
 *
 * Public API (cross-slice safe): def, lvl, available, nextCost, canBuy, buy,
 * effects, buildingTier, unlockedList, nextUnlock.
 * - effects() is the STABLE contract consumed by sys/loot.js, sys/battle.js,
 *   sys/hunters.js, sys/equipment.js — do not change its shape.
 * - buildingTier(lvl) -> 0|1|2：0 樸實 (<5) / 1 銀階 (5–9) / 2 金階 (>=10)。
 *   供 ui/kingdom.js 的畫布飾邊特效與卡片階級章使用。
 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.buildings = (function () {
  const D = MG.data.buildings;
  const S = () => MG.game.state;
  const U = MG.util;

  function def(id) { return D[id]; }
  function lvl(id) { return S().buildings[id] || 0; }
  function available(id) { return def(id).unlock <= S().kingdom.level; }
  function isUnlocked(id) { return available(id) && lvl(id) > 0; }
  function buildingTier(lv) { return lv >= 10 ? 2 : lv >= 5 ? 1 : 0; }
  function nextCost(id) {
    const d = def(id), l = lvl(id) + 1;
    const c = d.cost(l);
    return { gold: Math.floor(c.gold), mats: c.mats || {} };
  }
  function canBuy(id) {
    const d = def(id);
    if (lvl(id) >= d.max) return false;
    if (!available(id)) return false;
    const c = nextCost(id);
    const st = S();
    if (st.currencies.gold < c.gold) return false;
    for (const m in c.mats) if ((st.mats[m] || 0) < c.mats[m]) return false;
    return true;
  }
  function buy(id, silent) {
    if (!canBuy(id)) return false;
    const d = def(id);
    const c = nextCost(id);
    const st = S();
    st.currencies.gold -= c.gold;
    for (const m in c.mats) st.mats[m] -= c.mats[m];
    st.buildings[id]++;
    MG.sys.game.addKingdomExp(20 + st.buildings[id] * 4);
    if (!silent) MG.core.audio.SFX.building(); // v208：批量連升 silent（單一音效）
    MG.sys.battle.reset();
    return true;
  }
  /* v208 QoL：建築連升 — 迴圈 canBuy→buy 直到資源不足/滿級；回傳統計（canBuy 天然把關） */
  function bulkUpgrade(id) {
    let n = 0, gold = 0;
    const mats = {};
    while (canBuy(id)) {
      const c = nextCost(id);
      gold += c.gold;
      for (const m in c.mats) mats[m] = (mats[m] || 0) + c.mats[m];
      buy(id, true);
      n++;
    }
    if (n) MG.core.audio.SFX.building();
    return { n, gold, mats, lvl: lvl(id) };
  }
  /* 連升預估（UI 顯示可升幾級與總成本）— v208FIX：成本用 d.cost(lv+1)（與 buy/nextCost 同語義）＋模擬運行餘額 */
  function bulkPreview(id) {
    const d = def(id);
    const st = S();
    let lv = lvl(id), n = 0, gold = 0;
    const mats = {};
    let goldLeft = st.currencies.gold;
    const matsLeft = Object.assign({}, st.mats);
    while (lv < d.max && available(id)) {
      const c = d.cost(lv + 1);
      const g = Math.floor(c.gold);
      if (goldLeft < g) break;
      let ok = true;
      for (const m in (c.mats || {})) if ((matsLeft[m] || 0) < c.mats[m]) { ok = false; break; }
      if (!ok) break;
      gold += g; goldLeft -= g;
      for (const m in (c.mats || {})) { const q = c.mats[m]; mats[m] = (mats[m] || 0) + q; matsLeft[m] -= q; }
      lv++; n++;
    }
    return { n, gold, mats, lvl: lv };
  }
  function effects() {
    const st = S();
    const b = st.buildings;
    // 王國等級加成：每級 攻擊/金幣/經驗 +1%（50 級 = +50%），與建築加成相乘
    const kMul = 1 + 0.01 * (Math.max(1, st.kingdom.level) - 1);
    return {
      kMul,
      goldMul: (1 + 0.08 * (b.castle || 0)) * kMul,
      expMul: (1 + 0.1 * (b.training || 0)) * kMul,
      atkMul: kMul,
      gemDrop: 1 + 0.06 * (b.gemworks || 0),
      bookDrop: 1 + 0.05 * (b.library || 0),
      // v199 平衡：強化費用折扣封頂 90%（forge Lv25 起原式歸零、26+ 變負 → 強化倒賺金幣 = 後期印鈔機）
      enhanceCostMul: Math.max(0.1, 1 - 0.04 * (b.forge || 0)),
      potionMul: 0.05 * (b.alchemy || 0),
      honorMul: 1 + 0.05 * (b.altar || 0),
      invCap: 200 + 10 * (b.warehouse || 0),
      formationSlots: Math.min(5, 2 + Math.floor(((b.guild || 0) - 1) / 3)),
      rosterCap: Math.min(MG.config.MAX_HUNTERS, 4 + (b.guild || 0) * 2), // 名冊上限隨酒館等級成長
      recruitCostMul: 1 - 0.02 * (b.guild || 0),
      forgeUnlocked: (b.forge || 0) >= 1
    };
  }
  function unlockedList() {
    return Object.keys(D).filter(id => lvl(id) > 0);
  }
  function nextUnlock() {
    const kl = S().kingdom.level;
    let best = null;
    for (const id in D) {
      const d = D[id];
      if (lvl(id) === 0 && d.unlock > kl && (!best || d.unlock < best.unlock)) best = { id, unlock: d.unlock, name: d.name };
    }
    return best;
  }
  return { def, lvl, isUnlocked, available, buildingTier, nextCost, canBuy, buy, bulkUpgrade, bulkPreview, effects, unlockedList, nextUnlock };
})();
