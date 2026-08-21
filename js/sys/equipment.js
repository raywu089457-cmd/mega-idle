/* 放置王國 MEGA IDLE — equipment logic: gen, stats, enhance, dismantle, craft, gems, sets (slice B2 owns) */
"use strict";
MG.sys = MG.sys || {};
MG.sys.equipment = (function () {
  const ED = MG.data.equipment;
  const U = MG.util;
  const S = () => MG.game.state;

  function slotOf(item) { return item.defId.split("_")[0]; }
  /* v161 詞綴聚合：單英雄穿戴詞綴總和（戰鬥用）／編隊總和（掉落用） */
  function affixSum(h) {
    const out = {};
    if (!h) return out;
    for (const it of MG.sys.hunters.equippedItems(h)) {
      if (it.affix) out[it.affix.id] = (out[it.affix.id] || 0) + it.affix.val;
    }
    return out;
  }
  function teamAffixTotal(ids, aid) {
    const st = S();
    let v = 0;
    for (const hid of ids || []) {
      const h = st.hunters.find(x => x.id === hid);
      if (h) for (const it of MG.sys.hunters.equippedItems(h)) {
        if (it.affix && it.affix.id === aid) v += it.affix.val;
      }
    }
    return v;
  }
  function gen(opts) {
    const o = opts || {};
    const tier = o.tier || 1;
    let slot = o.slot || U.pick(MG.config.SLOTS);
    // 防呆：無效部位（如 UI 群組名）退回隨機合法部位，避免產出壞道具
    if (!MG.config.SLOTS.includes(slot)) slot = U.pick(MG.config.SLOTS);
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
    // v161 詞綴：★3+ 依稀有度機率附加一條隨機詞綴（數值隨階級成長）
    if (item.rarity >= 3 && U.chance(ED.AFFIX_CHANCE[item.rarity] || 0)) {
      item.affix = rollAffix(item);
    }
    return item;
  }
  /* v161 詞綴骰（v190 抽出供 gen／重鑄共用）：隨機詞綴＋數值隨階級成長 */
  function rollAffix(item) {
    const aid = U.pick(Object.keys(ED.AFFIXES));
    return { id: aid, val: Math.round(ED.affixVal(aid, item.tier) * 1000) / 1000 };
  }
  /* v190 詞綴重鑄：★3+ 消耗金幣＋高階素材，重骰詞綴（無詞綴補上、有詞綴換新） */
  function rerollCost(item) {
    const c = ED.REROLL_COST[item.rarity] || null;
    if (!c) return null;
    const st = S();
    const matsOk = Object.entries(c.mats || {}).every(([m, n]) => (st.mats[m] || 0) >= n);
    return { gold: c.gold, mats: c.mats, can: st.currencies.gold >= c.gold && matsOk };
  }
  function rerollAffix(item) {
    if ((item.rarity || 1) < 3) return { ok: false, reason: "★3 以上裝備才能重鑄詞綴" };
    const rc = rerollCost(item);
    if (!rc || !rc.can) return { ok: false, reason: "重鑄資源不足（金幣或素材）" };
    const st = S();
    st.currencies.gold -= rc.gold;
    for (const m in rc.mats) st.mats[m] -= rc.mats[m];
    const prev = item.affix ? ED.AFFIXES[item.affix.id] : null;
    item.affix = rollAffix(item);
    MG.core.audio.SFX.craft();
    const now = ED.AFFIXES[item.affix.id];
    return { ok: true, prev: prev ? prev.name : "（無）", now: now.name, val: item.affix.val };
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
    c = Math.floor(c * MG.sys.buildings.effects().enhanceCostMul * (MG.sys.dev ? MG.sys.dev.balance().costMul : 1)); // vXXX 開發者：成本拉桿
    // v169 鍛造傳統：強化金幣成本 -4%/級（跨昇華永久，上限 40%）
    if (MG.sys.meta && MG.sys.meta.traditionEffects) c = Math.floor(c * (1 - MG.sys.meta.traditionEffects().forge));
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
    if (item.locked) return false; // 鎖定保護（v119）：鎖定的裝備不可分解
    // v559 存檔毀滅修復：藥水/寶石等消耗品沒有 rarity 語義（rarity undefined），誤分解時
    // 金幣 = 10×1.4^tier×undefined×... = NaN → gold += NaN 永久污染（往後每次 addGold 皆 NaN，
    // 整個經濟報表/購買全毀、存檔報廢）；僅 7 部位裝備可分解，非裝備一律拒絕（所有呼叫端共用此守衛）
    if (!MG.config.SLOTS.includes(slotOf(item))) return false;
    const st = S();
    const m = ED.dismantleMats(item.tier, item.rarity, item.enhance);
    // 稀有度 × 強化等級折現金幣，分解不虧
    // v688：強化貢獻軟封頂 min(enhance,10) — +0..+10 不變；防高強化分解印鈔
    // v692：階位指數軟封頂 min(tier,8) — T1–8 不變；防高階分解印鈔
    let gold = Math.floor(10 * Math.pow(1.4, Math.min(item.tier, 8)) * item.rarity * (1 + 0.15 * Math.min(item.enhance || 0, 10)));
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
    if (MG.sys.meta && MG.sys.meta.bump) MG.sys.meta.bump("item", 1); // v214：每日 d9 計數（原缺失）
    // v140：新獲得標記（裝備頁 NEW 光點；查看後清除）
    if (!st.inventory.newUids) st.inventory.newUids = [];
    st.inventory.newUids.push(item.uid);
    if (st.inventory.newUids.length > 100) st.inventory.newUids.splice(0, st.inventory.newUids.length - 100);
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
  // v133 快速穿戴：依部位從背包挑選數值總和最高的未鎖定裝備穿上（比現穿好才換）
  function itemScore(it) {
    const s = itemStats(it);
    return (s.atk || 0) * 3 + (s.def || 0) * 2 + (s.hp || 0) * 0.2 + (s.crit || 0) * 200;
  }
  function autoEquip(h) {
    if (U.fightGuard(h)) return 0;
    const st = S();
    const need = MG.config.CLASS_WEAPONS[h.cls];
    // v173：排除其他英雄已穿戴的道具（避免批量穿裝時互相搶裝）
    const wornByOthers = new Set();
    for (const x of st.hunters) {
      if (x.id === h.id) continue;
      for (const s2 in x.equip) if (x.equip[s2]) wornByOthers.add(x.equip[s2]);
    }
    let worn = 0;
    for (const slot of MG.config.SLOTS) {
      const candidates = st.inventory.items.filter(it =>
        !it.locked && !wornByOthers.has(it.uid) && slotOf(it) === slot &&
        (slot !== "weapon" || !it.wtype || it.wtype === need));
      if (!candidates.length) continue;
      const best = candidates.reduce((a, b) => (itemScore(b) > itemScore(a) ? b : a));
      const curUid = h.equip[slot];
      const cur = curUid ? st.inventory.items.find(i => i.uid === curUid) : null;
      if (cur && itemScore(best) <= itemScore(cur)) continue;
      equipToHunter(h, best);
      worn++;
    }
    MG.sys.battle.reset();
    return worn;
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
  function gemFuseCost(tier) {
    // v664：融合金幣水槽 — 消耗階 t→t+1 費 200×1.45^(t-1)；t1→2 = 200
    // v672：t≥6 附加 ×1.25^(t-5) — 1–5 階不變；高階融合拉長金流
    // v696：基指數軟封頂 min(t-1,8) — t≤9 不變；防超高階融合印牆
    // v712：加深指數軟封頂 min(t-5,3) — t≤8 不變；防 t≥9 雙指數牆
    // v728：加深軟封頂 min(t-5,2) — t≤7 不變；防 t≥8 牆
    // v740：加深軟封頂 min(t-5,1) — t≤6 不變；防 t≥7 牆
    const t = Math.max(1, parseInt(tier, 10) || 1);
    let fee = 200 * Math.pow(1.45, Math.min(t - 1, 8));
    if (t >= 6) fee *= Math.pow(1.25, Math.min(t - 5, 1));
    return Math.floor(fee);
  }
  function gemFuse(gemDefId, qty, silent) {
    // 3 same gems → 1 of next tier
    const st = S();
    const [kind, tier] = gemDefId.split("_");
    const need = 3;
    const have = st.inventory.items.filter(i => i.defId === gemDefId);
    const total = have.reduce((a, i) => a + (i.qty || 1), 0);
    if (total < need) return false;
    const fee = gemFuseCost(tier);
    if ((st.currencies.gold || 0) < fee) {
      if (!silent) MG.ui.dom.toast("金幣不足（融合需 " + MG.util.fmt(fee) + " 金）", "bad", "icon_coin");
      return false;
    }
    // consume
    let left = need;
    for (const i of have) {
      const take = Math.min(i.qty || 1, left);
      i.qty = (i.qty || 1) - take; left -= take;
      if (i.qty <= 0) st.inventory.items = st.inventory.items.filter(x => x.uid !== i.uid);
      if (left <= 0) break;
    }
    st.currencies.gold -= fee;
    const nt = Math.min(10, parseInt(tier) + 1);
    const out = { uid: U.uid(), defId: kind + "_" + nt, tier: nt, qty: 1, gems: [], enhance: 0 };
    st.inventory.items.push(out);
    if (!silent) MG.core.audio.SFX.gem(); // v238：批量融合靜音（v218 WebAudio 教訓 — 堆疊 20 次連播風暴）
    return out;
  }
  function addGem(gemDefId) {
    const st = S();
    const have = st.inventory.items.find(i => i.defId === gemDefId);
    if (have) { have.qty = (have.qty || 1) + 1; return have; }
    const [kind, tier] = gemDefId.split("_");
    const it = { uid: U.uid(), defId: gemDefId, tier: parseInt(tier), qty: 1, gems: [], enhance: 0 };
    if (st.inventory.items.length < inventoryCap()) st.inventory.items.push(it);
    else if (MG.sys.loot && typeof MG.sys.loot.noteLost === "function") MG.sys.loot.noteLost(); // v241：滿包寶石丟棄計入損失回報
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
    recipeAvailable, addToInventory, inventoryCap, equipToHunter, unequip, autoEquip, itemScore, nameOf, socketGem, gemFuse, gemFuseCost, addGem, killHealBonus, itemOnFighter,
    affixSum, teamAffixTotal, rerollCost, rerollAffix };
})();
