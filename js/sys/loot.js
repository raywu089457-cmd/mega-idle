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
    const { def, boss } = monsterForStage(regionIdx, stage);
    const m = (stage - 1) * 0.16 + (boss ? 0 : 0);
    const bossMul = boss ? (regionIdx <= 1 ? 2.4 : regionIdx <= 3 ? 3 : 4) : 1;
    const mul = boss ? (1 + (stage - 1) * 0.16) * bossMul : 1 + m;
    const s = boss ? mul / bossMul : mul;
    return {
      ...def, boss,
      hp: Math.round(def.hp * mul),
      atk: Math.round(def.atk * mul),
      def: Math.round(def.def * mul),
      gold: Math.round(def.gold * mul),
      exp: Math.round(def.exp * mul),
      scaleMul: s
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
