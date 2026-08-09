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
  function buy(id) {
    if (!canBuy(id)) return false;
    const d = def(id);
    const c = nextCost(id);
    const st = S();
    st.currencies.gold -= c.gold;
    for (const m in c.mats) st.mats[m] -= c.mats[m];
    st.buildings[id]++;
    MG.sys.game.addKingdomExp(15 + st.buildings[id] * 2);
    MG.core.audio.SFX.building();
    MG.sys.battle.reset();
    return true;
  }
  function effects() {
    const st = S();
    const b = st.buildings;
    return {
      goldMul: 1 + 0.08 * (b.castle || 0),
      expMul: 1 + 0.1 * (b.training || 0),
      gemDrop: 1 + 0.06 * (b.gemworks || 0),
      bookDrop: 1 + 0.05 * (b.library || 0),
      enhanceCostMul: 1 - 0.04 * (b.forge || 0),
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
  return { def, lvl, isUnlocked, available, buildingTier, nextCost, canBuy, buy, effects, unlockedList, nextUnlock };
})();
