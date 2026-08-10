/* 放置王國 MEGA IDLE — equipment logic: gen, stats, enhance, dismantle, craft, gems, sets (slice B2 owns) */
"use strict";
MG.sys = MG.sys || {};
MG.sys.equipment = (function () {
  const ED = MG.data.equipment;
  const U = MG.util;
  const S = () => MG.game.state;

  function slotOf(item) { return item.defId.split("_")[0]; }
  function gen(opts) {
    const o = opts || {};
    const tier = o.tier || 1;
    const slot = o.slot || U.pick(MG.config.SLOTS);
    let rarity = o.rarity || rollRarity(tier);
    const item = {
      uid: U.uid(), defId: slot + "_" + tier, tier, rarity, enhance: 0,
      gems: [], set: null, boss: !!o.boss
    };
    // 武器：依指定類型 / 職階對應類型 / 全職階池 指派 wtype（職業鎖）
    if (slot === "weapon") {
      item.wtype = o.wtype
        || (o.cls && MG.config.CLASS_WEAPONS[o.cls])
        || U.pick(Object.values(MG.config.CLASS_WEAPONS));
    }
    // sockets
    const sc = ED.socketChance(rarity);
    const socks = (U.chance(sc[0]) ? 1 : 0) + (U.chance(sc[1]) ? 1 : 0) + (U.chance(sc[2]) ? 1 : 0);
    item.gems = new Array(Math.min(socks, 2)).fill(null);
    // set item
    if (o.set) item.set = o.set;
    else if (U.chance(ED.setItemChance(tier))) {
      const pool = Object.keys(ED.SETS).filter(sid => tier >= ED.SETS[sid].tier);
      if (pool.length) item.set = U.pick(pool);
    }
    // boss items roll rarity up
    if (o.boss && rarity < 3) rarity = 3;
    item.rarity = rarity;
    return item;
  }
  function rollRarity(tier) {
    const w = tier <= 2 ? [68, 24, 7, 1, 0, 0]
      : tier <= 4 ? [48, 32, 15, 4, 1, 0]
      : tier <= 6 ? [30, 34, 22, 10, 3.4, 0.6]
      : tier <= 8 ? [16, 28, 26, 18, 9, 3]
      : [8, 18, 24, 26, 16, 8];
    const tot = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i + 1; }
    return 1;
  }
  function rawStats(item) {
    const t = item.tier, slot = slotOf(item);
    const def = ED.STATS[slot];
    const mul = ED.RARITY_MUL[item.rarity - 1] * (1 + 0.05 * item.enhance);
    const out = { atk: 0, def: 0, hp: 0, crit: 0 };
    out.atk = Math.round((def.atk ? def.atk(t) : 0) * mul);
    out.def = Math.round((def.def ? def.def(t) : 0) * mul);
    out.hp = Math.round((def.hp ? def.hp(t) : 0) * mul);
    out.crit = (def.crit ? def.crit(t) : 0) * mul;
    return out;
  }
  function itemStats(item) {
    const out = rawStats(item);
    for (const g of item.gems) {
      if (!g) continue;
      const [kind, gt] = g.split("_");
      const gd = ED.GEMS[kind];
      if (!gd) continue;
      const v = gd.val(parseInt(gt) || 1);
      if (gd.stat === "crit") out.crit += v; else out[gd.stat] += v;
    }
    return out;
  }
  function displayStats(item) {
    const s = rawStats(item);
    const lines = [];
    if (s.atk) lines.push("攻擊 +" + U.fmt(s.atk));
    if (s.def) lines.push("防禦 +" + U.fmt(s.def));
    if (s.hp) lines.push("生命 +" + U.fmt(s.hp));
    if (s.crit) lines.push("暴擊 +" + Math.round(s.crit * 100) + "%");
    return lines;
  }
  function enhanceCost(item) {
    let c = ED.enhanceCost(item.tier, item.enhance);
    c = Math.floor(c * MG.sys.buildings.effects().enhanceCostMul);
    return c;
  }
  function canEnhance(item) {
    if (MG.sys.buildings.effects().enhanceCostMul === 1 && (S().buildings.forge || 0) < 1) return false;
    return item.enhance < MG.config.MAX_ITEM_LVL && S().currencies.gold >= enhanceCost(item);
  }
  // 下一級強化預覽：顯示確切費用與新增數值
  function previewEnhance(item) {
    if (item.enhance >= MG.config.MAX_ITEM_LVL) return { atMax: true, cost: 0, stats: [] };
    return { atMax: false, cost: enhanceCost(item), stats: enhanceDelta(item) };
  }
  function enhanceDelta(item) {
    const a = itemStats(item);
    const b = itemStats(Object.assign({}, item, { enhance: item.enhance + 1 }));
    const out = [];
    if (b.atk - a.atk) out.push("攻擊 +" + U.fmt(b.atk - a.atk));
    if (b.def - a.def) out.push("防禦 +" + U.fmt(b.def - a.def));
    if (b.hp - a.hp) out.push("生命 +" + U.fmt(b.hp - a.hp));
    if (b.crit - a.crit) out.push("暴擊 +" + Math.round((b.crit - a.crit) * 100) + "%");
    return out;
  }
  function enhance(item) {
    if (!canEnhance(item)) return false;
    S().currencies.gold -= enhanceCost(item);
    item.enhance++;
    S().stats.enhances++;
    MG.sys.meta.bump("enhance", 1);
    MG.core.audio.SFX.enhance();
    MG.sys.game.addKingdomExp(3);
    return true;
  }
  // 道具是否正被參戰（派遣中）英雄裝備 → 戰鬥中不可分解/鑲嵌
  function itemOnFighter(item) {
    if (!MG.sys.battle.isFighting()) return false;
    const st = S();
    const ids = st.hunt.dispatchIds || [];
    const onFighter = st.hunters.some(h => ids.includes(h.id) && Object.values(h.equip || {}).includes(item.uid));
    if (onFighter) MG.ui.dom.toast("此裝備正被參戰英雄使用，戰鬥中無法編輯", "bad", "icon_sword");
    return onFighter;
  }
  function dismantle(item) {
    if (itemOnFighter(item)) return false;
    const st = S();
    const m = ED.dismantleMats(item.tier, item.rarity, item.enhance);
    // 稀有度 × 強化等級折現金幣，分解不虧
    let gold = Math.floor(10 * Math.pow(1.4, item.tier) * item.rarity * (1 + 0.15 * (item.enhance || 0)));
    for (const k in m) st.mats[k] = (st.mats[k] || 0) + m[k];
    st.currencies.gold += gold;
    // unequip if equipped
    for (const h of st.hunters) {
      for (const slot in h.equip) if (h.equip[slot] === item.uid) h.equip[slot] = null;
    }
    st.inventory.items = st.inventory.items.filter(i => i.uid !== item.uid);
    MG.core.audio.SFX.coin();
    MG.sys.game.addKingdomExp(1);
    return { gold, mats: m };
  }
  function craft(recipe) {
    const st = S();
    if (!recipeAvailable(recipe)) return false;
    st.currencies.gold -= recipe.cost.gold;
    for (const m in recipe.cost.mats) st.mats[m] -= recipe.cost.mats[m];
    const it = gen({ slot: recipe.slot, tier: recipe.tier, rarity: recipe.minRar, set: recipe.set || undefined, wtype: recipe.wtype });
    if (it.set === undefined) delete it.set;
    it.rarity = Math.max(recipe.minRar, it.rarity);
    addToInventory(it);
    MG.core.audio.SFX.enhance();
    MG.ui.dom.toast("製作完成：" + nameOf(it) + "！", "good", "icon_hammer");
    return it;
  }
  function recipeAvailable(r) {
    const st = S();
    if (r.unlockTier > (st.stats.maxTierReached || 1)) return false;
    if (st.currencies.gold < r.cost.gold) return false;
    for (const m in r.cost.mats) if ((st.mats[m] || 0) < r.cost.mats[m]) return false;
    return true;
  }
  function addToInventory(item) {
    const st = S();
    if (st.inventory.items.length >= inventoryCap()) return false;
    st.inventory.items.push(item);
    st.codex.items[item.defId] = (st.codex.items[item.defId] || 0) + 1;
    return true;
  }
  function inventoryCap() { return MG.sys.buildings.effects().invCap; }
  function returnToInventory(uid) { /* unequip path: item already in inventory */ }
  function equipToHunter(h, item) {
    if (U.fightGuard(h)) return false;
    // 同一件裝備同時只能穿在一隻英雄身上：先從其他英雄自動卸下
    const st = S();
    for (const oh of st.hunters || []) {
      if (oh.id === h.id) continue;
      for (const os in oh.equip || {}) {
        if (oh.equip[os] === item.uid) oh.equip[os] = null;
      }
    }
    const slot = slotOf(item);
    if (slot === "weapon") {
      const need = MG.config.CLASS_WEAPONS[h.cls];
      const have = item.defId.split("_")[1]; // tier... weapon type from defId? use item.wtype
      if (item.wtype && item.wtype !== need) return false;
    }
    const old = h.equip[slot] || null;
    h.equip[slot] = item.uid;
    if (old) MG.ui.dom.toast("已替換裝備", "", "icon_sword");
    MG.core.audio.SFX.equip();
    MG.sys.meta.bump("equip", 1);
    MG.sys.battle.reset();
    return true;
  }
  function unequip(h, slot) {
    if (U.fightGuard(h)) return;
    h.equip[slot] = null;
    MG.sys.battle.reset();
  }
  function nameOf(item) { return ED.itemName(item); }
  function socketGem(item, idx, gemDefId) {
    if (itemOnFighter(item)) return false;
    if (idx >= item.gems.length) return false;
    item.gems[idx] = gemDefId;
    MG.core.audio.SFX.gem();
    MG.sys.battle.reset();
    return true;
  }
  function gemFuse(gemDefId, qty) {
    // 3 same gems → 1 of next tier
    const st = S();
    const [kind, tier] = gemDefId.split("_");
    const need = 3;
    const have = st.inventory.items.filter(i => i.defId === gemDefId);
    const total = have.reduce((a, i) => a + (i.qty || 1), 0);
    if (total < need) return false;
    // consume
    let left = need;
    for (const i of have) {
      const take = Math.min(i.qty || 1, left);
      i.qty = (i.qty || 1) - take; left -= take;
      if (i.qty <= 0) st.inventory.items = st.inventory.items.filter(x => x.uid !== i.uid);
      if (left <= 0) break;
    }
    const nt = Math.min(10, parseInt(tier) + 1);
    const out = { uid: U.uid(), defId: kind + "_" + nt, tier: nt, qty: 1, gems: [], enhance: 0 };
    st.inventory.items.push(out);
    MG.core.audio.SFX.gem();
    return out;
  }
  function addGem(gemDefId) {
    const st = S();
    const have = st.inventory.items.find(i => i.defId === gemDefId);
    if (have) { have.qty = (have.qty || 1) + 1; return have; }
    const [kind, tier] = gemDefId.split("_");
    const it = { uid: U.uid(), defId: gemDefId, tier: parseInt(tier), qty: 1, gems: [], enhance: 0 };
    if (st.inventory.items.length < inventoryCap()) st.inventory.items.push(it);
    return it;
  }
  // 不死鳥套裝 4 件效果：擊殺回復額外百分比（供 battle onKill 掛接；0 表示無）
  function killHealBonus() {
    const st = S();
    let bonus = 0;
    for (const h of st.hunters) {
      const cnt = {};
      for (const slot of MG.config.SLOTS) {
        const uid = h.equip[slot];
        if (!uid) continue;
        const it = st.inventory.items.find(i => i.uid === uid);
        if (it && it.set) cnt[it.set] = (cnt[it.set] || 0) + 1;
      }
      for (const sid in cnt) {
        const set = ED.SETS[sid];
        if (set && cnt[sid] >= 4 && set.healKill) bonus = Math.max(bonus, set.healKill);
      }
    }
    return bonus;
  }
  return { gen, slotOf, itemStats, displayStats, enhanceCost, canEnhance, enhance, previewEnhance, enhanceDelta, dismantle, craft,
    recipeAvailable, addToInventory, inventoryCap, equipToHunter, unequip, nameOf, socketGem, gemFuse, addGem, killHealBonus, itemOnFighter };
})();
