/* 放置王國 MEGA IDLE — hunter logic: create, stats, exp, promote, train, recruit (slice B1 owns) */
"use strict";
MG.sys = MG.sys || {};
MG.sys.hunters = (function () {
  const D = MG.data.hunters;
  const U = MG.util;
  const S = () => MG.game.state;

  function create(cls, rarity) {
    const h = {
      id: U.uid(), name: MG.data.names.gen(), cls, rarity: rarity || 1,
      level: 1, exp: 0, skills: {}, promoted: 0, equip: {}
    };
    h.hp = Math.round(baseStats(h).hp); // 持續性生命：滿血誕生
    h.mp = Math.round(baseStats(h).mp); // 魔力：滿魔誕生（技能資源）
    return h;
  }
  function clsOf(h) { return D.classes[h.cls]; }
  function baseStats(h) {
    const c = clsOf(h), r = MG.config.RARITY[h.rarity - 1];
    const p = Math.pow(1 + D.promoStats, h.promoted || 0);
    const lv = h.level - 1;
    return {
      atk: (c.base.atk + c.grow.atk * lv) * r.grow * p,
      def: (c.base.def + c.grow.def * lv) * r.grow * p,
      hp: (c.base.hp + c.grow.hp * lv) * r.grow * p,
      mp: (c.base.mp + c.grow.mp * lv) * r.grow * p,
      spd: c.base.spd + c.grow.spd * lv,
      crit: U.clamp(c.base.crit + c.grow.crit * lv, 0, 0.8)
    };
  }
  function equippedItems(h) {
    const st = S();
    const out = [];
    for (const slot of MG.config.SLOTS) {
      const uid = h.equip[slot];
      if (uid) {
        const it = st.inventory.items.find(i => i.uid === uid);
        if (it) out.push(it);
      }
    }
    return out;
  }
  function setCounts(h) {
    const m = {};
    for (const it of equippedItems(h)) if (it.set) m[it.set] = (m[it.set] || 0) + 1;
    return m;
  }
  function effectiveStats(h) {
    const st = S();
    const b = baseStats(h);
    const out = { atk: b.atk, def: b.def, hp: b.hp, mp: b.mp, spd: b.spd, crit: b.crit, mit: 0 };
    // equipment
    for (const it of equippedItems(h)) {
      const s = MG.sys.equipment.itemStats(it);
      out.atk += s.atk; out.def += s.def; out.hp += s.hp; out.crit += s.crit;
    }
    // set bonuses
    const sets = MG.data.equipment.sets;
    const cnt = setCounts(h);
    for (const sid in cnt) {
      const set = sets[sid];
      if (!set) continue;
      if (cnt[sid] >= 2 && set.fx) applyFx(set.fx);
      if (cnt[sid] >= 4 && set.fx4) applyFx(set.fx4);
    }
    function applyFx(fx) {
      if (fx.atk) out.atk *= 1 + fx.atk;
      if (fx.def) out.def *= 1 + fx.def;
      if (fx.hp) out.hp *= 1 + fx.hp;
      if (fx.crit) out.crit += fx.crit;
      if (fx.spd) out.spd *= 1 + fx.spd;
      if (fx.all) { out.atk *= 1 + fx.all; out.def *= 1 + fx.all; out.hp *= 1 + fx.all; }
      if (fx.mit) out.mit = Math.min(0.5, out.mit + fx.mit);
    }
    // potion buff
    if (st.buffs.potAtk > Date.now()) out.atk *= 1.3 + 0.05 * MG.sys.buildings.effects().potionMul;
    // awakening + codex + honor
    const aw = 1 + 0.25 * (st.awakenings || 0);
    const cd = MG.sys.meta.codexDmg();
    const ho = 1 + 0.1 * (st.honorLvls.dmg || 0);
    out.atk *= aw * cd * ho;
    return out;
  }
  function power(h) {
    const s = effectiveStats(h);
    return Math.floor(s.atk * 3 + s.def * 2 + s.hp / 10 + s.crit * 100);
  }
  function expNeed(h) { return D.expNeed(h.level); }
  function gainExp(h, amt, silent) {
    const st = S();
    const ev = [];
    let need = expNeed(h);
    h.exp += Math.floor(amt);
    while (h.exp >= need && h.level < 200) {
      h.exp -= need; h.level++;
      // 升級自動補滿生命與魔力（升級的慶祝性回饋）
      h.hp = Math.round(effectiveStats(h).hp);
      h.mp = Math.round(effectiveStats(h).mp);
      MG.sys.game.addKingdomExp(10 + h.level); // 王國經驗：英雄等級越高升級貢獻越多（即時結算升級）
      ev.push({ type: "levelup", hunter: h.id, level: h.level });
      need = expNeed(h);
    }
    if (h.level >= 200) h.exp = 0;
    if (!silent) for (const e of ev) MG.ui.dom.toast("「" + h.name + "」升至 " + h.level + "級！", "good", "fx_heal");
    return ev;
  }
  function promoLevelNeed(h) {
    const n = (h.promoted || 0) + 1;
    return D.promoLevels[n - 1] || 999;
  }
  function canPromote(h) {
    if (h.level < promoLevelNeed(h)) return false;
    const c = D.promoCost(h);
    const st = S();
    if (c.mats) for (const m in c.mats) if ((st.mats[m] || 0) < c.mats[m]) return false;
    return st.currencies.gold >= c.gold;
  }
  function promoPreview(h) {
    const next = Object.assign({}, h, { promoted: h.promoted + 1 });
    const b0 = baseStats(h), b1 = baseStats(next);
    return {
      cost: D.promoCost(h),
      can: canPromote(h),
      needLv: promoLevelNeed(h),
      atk: Math.floor(b1.atk - b0.atk),
      def: Math.floor(b1.def - b0.def),
      hp: Math.floor(b1.hp - b0.hp)
    };
  }
  function promote(h) {
    if (U.fightGuard(h)) return false;
    if (!canPromote(h)) return false;
    const c = D.promoCost(h);
    MG.sys.game.addGold(-c.gold, "突破");
    for (const m in c.mats) S().mats[m] -= c.mats[m];
    // 突破 +20% 全屬性：生命/魔力按比例成長
    const oldMax = effectiveStats(h).hp;
    h.promoted++;
    if (h.hp !== undefined && oldMax > 0) h.hp = h.hp * (effectiveStats(h).hp / oldMax);
    if (h.mp !== undefined) h.mp = h.mp * (effectiveStats(h).mp / oldMax);
    MG.core.audio.SFX.levelup();
    MG.ui.dom.toast("「" + h.name + "」突破至 " + (h.promoted + 1) + " 階！全屬性 +20%", "good", "fx_heal");
    MG.sys.meta.bump("promote", 1);
    return true;
  }
  function train(h) {
    if (U.fightGuard(h)) return false;
    const st = S();
    const cost = D.trainCost(h.level);
    if (st.currencies.gold < cost) { MG.ui.dom.toast("金幣不足", "bad", "icon_coin"); return false; }
    st.currencies.gold -= cost;
    const mul = 1 + (st.buildings.training || 0) * 0.1;
    const exp = Math.floor(D.trainExp(h.level) * mul);
    gainExp(h, exp);
    MG.core.audio.SFX.buy();
    MG.ui.dom.toast("訓練完成！「" + h.name + "」獲得 " + MG.util.fmt(exp) + " 經驗", "good", "icon_train");
    return true;
  }
  function recruitCost(type) {
    const st = S();
    const def = D.recruit[type];
    if (type === "gold") {
      const n = st.stats.goldRecruits || 0;
      const mul = 1 - 0.02 * (st.buildings.guild || 0);
      return { gold: Math.floor(def.cost(n) * mul), ticket: 0, gem: 0 };
    }
    if (type === "ticket") return { gold: 0, ticket: 1, gem: 0 };
    return { gold: 0, ticket: 0, gem: def.cost(0) };
  }
  function doRecruit(type) {
    const st = S();
    const def = D.recruit[type];
    const cost = recruitCost(type);
    if (type === "gold" && st.currencies.gold < cost.gold) return null;
    if (type === "ticket" && (st.currencies.ticket || 0) < 1) return null;
    if (type === "gem" && st.currencies.gems < cost.gem) return null;
    const cap = MG.sys.buildings.effects().rosterCap;
    if (st.hunters.length >= cap) { MG.ui.dom.toast("名冊已滿（" + cap + " 名）— 升級酒館可提升上限，或先遣散", "bad", "icon_coin"); return null; }
    if (type === "gold") { st.currencies.gold -= cost.gold; st.stats.goldRecruits = (st.stats.goldRecruits || 0) + 1; }
    if (type === "ticket") st.currencies.ticket--;
    if (type === "gem") st.currencies.gems -= cost.gem;
    const rarity = weightedPick(def.rar, def.weight);
    const cls = U.pick(Object.keys(D.classes));
    const h = create(cls, rarity);
    st.hunters.push(h);
    st.stats.recruits++;
    MG.sys.meta.bump("recruit", 1);
    MG.core.audio.SFX.recruit();
    // v136：招募後不自動進隊伍（英雄待在名冊，由玩家編入）
    MG.ui.dom.toast("「" + h.name + "」已加入名冊！", "good", "icon_recruit");
    return h;
    function weightedPick(vals, weights) {
      const tot = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * tot;
      for (let i = 0; i < vals.length; i++) { r -= weights[i]; if (r <= 0) return vals[i]; }
      return vals[vals.length - 1];
    }
  }
  function formation() { return S().formation.map(id => S().hunters.find(h => h.id === id)).filter(Boolean); }
  function formationIds() { return S().formation.filter(Boolean); }
  function inFormation(id) { return S().formation.includes(id); }
  // v130 五隊編制：所有編隊操作作用於 activeTeam 隊（st.formation 為其鏡像）
  function teamOf() {
    const st = S();
    if (Array.isArray(st.formations) && st.formations[st.activeTeam || 0]) return st.formations[st.activeTeam || 0];
    return st.formation;
  }
  function setActiveTeam(n) {
    const st = S();
    const max = teamsUnlocked();
    if (n < 0 || n >= max) return false;
    st.activeTeam = n;
    st.formation = teamOf().slice(); // 鏡像同步
    syncDispatchFromFormation(); // v139：切隊 → 派遣列表同步
    MG.sys.battle.reset();
    return true;
  }
  function teamsUnlocked() {
    const st = S();
    // 酒館等級決定隊數：Lv1=1 隊、Lv2=2、Lv4=3、Lv6=4、Lv8=5（依進度依序開放）
    return Math.min(5, 1 + Math.floor(((st.buildings && st.buildings.guild) || 1) / 2));
  }
  function teamInfo(n) {
    const st = S();
    const t = (st.formations && st.formations[n]) || [null, null, null, null, null];
    const members = t.filter(id => id && st.hunters.some(h => h.id === id));
    let powerSum = 0;
    for (const id of members) {
      const h = st.hunters.find(x => x.id === id);
      if (h) powerSum += power(h);
    }
    return { n, members: members.length, slots: t.length, power: powerSum, ids: t };
  }
  function setFormationSlot(idx, idOrNull) {
    if (U.fightGuard()) return false;
    const st = S();
    const slots = MG.sys.buildings.effects().formationSlots;
    if (idOrNull !== null && idx >= slots) return false;
    // 換人：若英雄已在其他隊，先從該隊移除（同一英雄不能同時在兩隊）
    if (idOrNull !== null) {
      for (const t of (st.formations || [])) {
        for (let i = 0; i < t.length; i++) if (t[i] === idOrNull) t[i] = null;
      }
    }
    teamOf()[idx] = idOrNull;
    st.formation = teamOf().slice();
    syncDispatchFromFormation(); // v139：出戰隊變動 → 派遣列表即時同步
    MG.sys.battle.reset();
    MG.ui.dom.toast(idOrNull ? "已編入出戰隊伍" : "已移出出戰隊伍", "", "icon_sword");
    return true;
  }
  /* v139：出戰隊（activeTeam formation）變動時同步派遣列表——戰鬥中編輯即時生效；
     已召回（無戰鬥且 dispatchIds 空）時不自動出戰，保留下次手動派遣。 */
  function syncDispatchFromFormation() {
    const st = S();
    if (!st.hunt) return;
    const fighting = ((MG.sys.battle.get && MG.sys.battle.get()) || {}).phase === "fight" || (st.hunt.dispatchIds || []).length > 0;
    if (!fighting) return;
    st.hunt.dispatchIds = teamOf().filter(id => id && st.hunters.some(h => h.id === id));
  }
  function autoFill() {
    if (U.fightGuard()) return;
    const st = S();
    const slots = MG.sys.buildings.effects().formationSlots;
    const team = teamOf();
    const ids = st.hunters.slice().sort((a, b) => power(b) - power(a)).map(h => h.id);
    for (let i = 0; i < slots; i++) team[i] = ids[i] || null;
    st.formation = team.slice();
    MG.sys.battle.reset();
    MG.ui.dom.toast("已自動編入戰力最強的英雄", "good", "icon_formation");
  }
  function dismiss(h) {
    if (U.fightGuard(h)) return;
    const st = S();
    const refund = Math.floor(50 * Math.pow(1.4, h.level) * h.rarity);
    for (const slot in h.equip) { const uid = h.equip[slot]; if (uid) { h.equip[slot] = null; MG.sys.equipment.returnToInventory(uid); } }
    st.hunters = st.hunters.filter(x => x.id !== h.id);
    for (const t of (st.formations || [st.formation])) for (let i = 0; i < t.length; i++) if (t[i] === h.id) t[i] = null;
    st.formation = teamOf().slice();
    st.currencies.gold += refund;
    MG.sys.battle.reset();
    MG.ui.dom.toast("已遣散「" + h.name + "」，獲得 " + MG.util.fmt(refund) + " 金幣", "", "icon_coin");
  }
  function unlockedSkills(h) {
    const c = clsOf(h);
    const n = Math.min(c.skills.length, D.skillAtLevel.filter(lv => h.level >= lv).length);
    return c.skills.slice(0, n).map(id => ({ id, lvl: h.skills[id] || 1 }));
  }
  return { create, baseStats, effectiveStats, power, expNeed, gainExp, canPromote, promoPreview, promote, train,
    recruitCost, doRecruit, formation, formationIds, inFormation, setFormationSlot, autoFill, dismiss,
    teamOf, setActiveTeam,
    syncDispatchFromFormation, teamsUnlocked, teamInfo,
    equippedItems, setCounts, unlockedSkills };
})();
