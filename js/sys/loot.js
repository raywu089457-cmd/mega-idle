/* 放置王國 MEGA IDLE — loot: stage monsters, kill rewards, drop tables */
"use strict";
MG.sys = MG.sys || {};
MG.sys.loot = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const REGIONS = () => MG.data.monsters.regions;

  function region(i) { return REGIONS()[U.clamp(i, 0, REGIONS().length - 1)]; }
  function monsterForStage(regionIdx, stage) {
    const r = region(regionIdx);
    if (stage % MG.config.MAX_STAGE_PER_REGION === 0) return { def: r.boss, boss: true };
    const list = r.monsters;
    return { def: list[(stage - 1) % list.length], boss: false };
  }
  function scaledMonster(regionIdx, stage) {
    const st = S();
    const { def, boss } = monsterForStage(regionIdx, stage);
    const m = (stage - 1) * 0.16 + (boss ? 0 : 0);
    const bossMul = boss ? (regionIdx <= 1 ? 2.4 : regionIdx <= 3 ? 3 : 4) : 1;
    const mul = boss ? (1 + (stage - 1) * 0.16) * bossMul : 1 + m;
    const s = boss ? mul / bossMul : mul;
    // 副本難度倍率（普通=1）
    const d = (MG.config.DIFFICULTY[(st.hunt && st.hunt.difficulty) || 0]) || MG.config.DIFFICULTY[0];
    return {
      ...def, boss,
      hp: Math.round(def.hp * mul * d.mult),
      atk: Math.round(def.atk * mul * d.mult),
      def: Math.round(def.def * mul * d.mult),
      gold: Math.round(def.gold * mul * d.gold),
      exp: Math.round(def.exp * mul * d.exp),
      scaleMul: s,
      difficulty: d.id
    };
  }
  function rollKill(regionIdx, stage, m) {
    const st = S();
    const r = region(regionIdx);
    const eff = MG.sys.buildings.effects();
    const out = { gold: 0, exp: 0, mats: [], items: [], gems: [], books: 0, tickets: 0, honor: 0 };
    // gold
    let g = m.gold;
    g *= eff.goldMul;
    if (Date.now() - (st.created || Date.now()) < 600e3) g *= 1.5; // 新手黃金時段
    if (st.buffs.potGold > Date.now()) g *= 1.5 + eff.potionMul;
    const aw = 1 + 0.25 * (st.awakenings || 0);
    g *= aw * (1 + 0.1 * (st.honorLvls.gold || 0));
    out.gold = Math.floor(g);
    // exp
    out.exp = Math.floor(m.exp * eff.expMul * (st.buffs.potExp > Date.now() ? 1.5 + eff.potionMul : 1));
    // materials
    for (const drop of m.drops || []) {
      if (U.chance(drop.c)) {
        out.mats.push({ id: drop.m, qty: 1 });
        st.codex.mats[drop.m] = (st.codex.mats[drop.m] || 0) + 1;
      }
    }
    // 通用素材迴圈（平衡：後期區域仍會少量掉出舊素材，避免 herb/iron 等斷供）
    const uni = regionIdx >= 8 ? [["void", 0.04], ["myth", 0.02], ["crystal", 0.06], ["herb", 0.04], ["leather", 0.03], ["iron", 0.06]]
      : regionIdx >= 6 ? [["poison", 0.04], ["ice", 0.03], ["crystal", 0.06], ["ember", 0.04], ["herb", 0.05], ["leather", 0.04], ["iron", 0.07]]
      : regionIdx >= 4 ? [["crystal", 0.06], ["ember", 0.04], ["herb", 0.06], ["leather", 0.05], ["iron", 0.09]]
      : regionIdx >= 2 ? [["crystal", 0.04], ["herb", 0.07], ["leather", 0.06], ["iron", 0.12]]
      : [["herb", 0.05], ["leather", 0.04], ["iron", 0.05]];
    for (const [mm, cc] of uni) {
      if (U.chance(cc)) {
        out.mats.push({ id: mm, qty: 1 });
        st.codex.mats[mm] = (st.codex.mats[mm] || 0) + 1;
      }
    }
    // 藥水補品掉落（平衡：r0-r1 不掉——前期以商店為主；r2+ 普通怪低機率、首領高機率，隨區域緩慢成長）
    if (regionIdx >= 2) {
      const base = m.boss ? 0.4 : 0.015;
      const rate = Math.min(0.9, base * (1 + 0.25 * (regionIdx - 2)));
      if (U.chance(rate)) {
        const potions = out.potions = out.potions || [];
        potions.push(U.chance(0.6) ? "item_pot_hp" : "item_pot_mp");
        // 中後期首領有機率掉 2 瓶（補給續戰）
        if (m.boss && regionIdx >= 4 && U.chance(0.5)) potions.push(potions[0]);
      }
    }
    // equipment
    const equipChance = m.boss ? 1 : 0.075;
    if (U.chance(equipChance)) {
      const it = MG.sys.equipment.gen({ tier: r.tier, cls: undefined, boss: m.boss });
      out.items.push(it);
    }
    // gems
    if (U.chance(0.035 * eff.gemDrop)) {
      const kind = U.pick(Object.keys(MG.data.equipment.GEMS));
      const gt = Math.min(10, Math.max(1, r.tier + U.rint(-1, 0)));
      out.gems.push(kind + "_" + gt);
    }
    // skill books
    if (U.chance(0.015 * eff.bookDrop)) out.books = 1;
    // boss extras
    if (m.boss) {
      out.gems.push(U.pick(Object.keys(MG.data.equipment.GEMS)) + "_" + Math.min(10, r.tier + 1));
      out.honor = 2;
      if (U.chance(0.35)) out.tickets = 1;
      if (U.chance(0.2)) out.books = 1;
    }
    return out;
  }
  function applyDrops(regionIdx, stage, m) {
    const st = S();
    const out = rollKill(regionIdx, stage, m);
    MG.sys.game.addGold(out.gold, "狩獵");
    st.stats.goldEarned += out.gold;
    const team = MG.sys.hunters.formation();
    if (team.length && out.exp > 0) {
      const per = Math.max(1, Math.floor(out.exp / team.length));
      for (const h of team) MG.sys.hunters.gainExp(h, per, true);
    }
    for (const mat of out.mats) st.mats[mat.id] = (st.mats[mat.id] || 0) + mat.qty;
    // 藥水補品入庫（與商店入庫同結構）
    for (const pid of out.potions || []) {
      const have = st.inventory.items.find(i => i.defId === pid);
      if (have) have.qty = (have.qty || 1) + 1;
      else st.inventory.items.push({ uid: MG.util.uid(), defId: pid, tier: 1, qty: 1, gems: [], enhance: 0 });
    }
    for (const it of out.items) {
      if (!MG.sys.equipment.addToInventory(it)) {
        MG.sys.equipment.dismantle(it); // auto-dismantle when full
      }
      st.stats.itemsLooted = (st.stats.itemsLooted || 0) + 1;
    }
    for (const g of out.gems) MG.sys.equipment.addGem(g);
    st.currencies.ticket = (st.currencies.ticket || 0) + out.tickets;
    if (out.honor) st.currencies.honor += Math.floor(out.honor * MG.sys.buildings.effects().honorMul);
    if (out.books) st.currencies.book = (st.currencies.book || 0) + 1;
    return out;
  }
  return { region, monsterForStage, scaledMonster, rollKill, applyDrops };
})();
