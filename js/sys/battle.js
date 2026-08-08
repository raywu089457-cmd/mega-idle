/* 放置王國 MEGA IDLE — battle simulator (core engine, owned by Main) */
"use strict";
MG.sys = MG.sys || {};
MG.sys.battle = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  let F = null;

  function teamBuild() {
    return MG.sys.hunters.formation().map(h => {
      const s = MG.sys.hunters.effectiveStats(h);
      return {
        id: h.id, name: h.name, cls: h.cls, rarity: h.rarity,
        sprite: MG.data.hunters.classes[h.cls].icon,
        atk: s.atk, def: s.def, maxHp: Math.max(1, Math.round(s.hp)), hp: Math.max(1, Math.round(s.hp)),
        spd: s.spd, crit: s.crit, mit: s.mit, cd: U.rand(0, 0.4), skillCd: U.rand(2, 5),
        skills: MG.sys.hunters.unlockedSkills(h).map(sk => Object.assign({ id: sk.id, lvl: sk.lvl }, MG.data.hunters.skills[sk.id])),
        buffs: {}
      };
    });
  }
  function newMonster() {
    const st = S();
    const m = MG.sys.loot.scaledMonster(st.hunt.region, st.hunt.stage);
    F.m = m; F.maxHp = m.hp;
    if (m.boss && F.pendingHp !== undefined && F.pendingHp > 0 && F.pendingHp < m.hp) {
      F.hp = F.pendingHp; // boss damage persists across wipes — progressive grind
    } else {
      F.hp = m.hp;
    }
    F.pendingHp = undefined;
    F.mAtk = 1.4;
    F.dot = { dmg: 0, left: 0 }; F.freeze = 0; F.taunt = null; F.teambuff = null;
    if (m.boss) {
      F.events.push({ t: F.t, type: "boss", name: m.name });
      F.shake = 0.6; F.banner = { text: "首領：" + m.name, t: 2.2 };
      MG.core.audio.SFX.boss();
    }
  }
  function start() {
    const team = teamBuild();
    const st = S();
    F = {
      t: 0, phase: team.length ? "fight" : "idle", team,
      hp: 1, maxHp: 1, mAtk: 1.4, m: null, dot: { dmg: 0, left: 0 }, freeze: 0,
      events: [], banner: null, bannerT: 0, shake: 0, retreatAt: 0, wipes: 0,
      taunt: null, teambuff: null, gold: 0, exp: 0, kills: 0, pendingHp: undefined
    };
    if (team.length) newMonster();
    return F;
  }
  function get() { if (!F) start(); return F; }
  function reset() { F = null; }

  function attack(h) {
    let dmg = h.atk * U.rand(0.9, 1.1);
    if (F.teambuff && F.teambuff.left > 0) dmg *= 1 + F.teambuff.mult;
    const crit = U.chance(h.crit);
    if (crit) dmg *= 2;
    dmg = Math.max(1, Math.round(dmg * (100 / (100 + F.m.def))));
    F.hp -= dmg;
    F.events.push({ t: F.t, type: crit ? "crit" : "hit", hunter: h.id, cls: h.cls, dmg, name: h.name });
  }
  function castSkill(h, sk) {
    const st = S();
    const pow = MG.data.hunters.skillPower(sk.lvl);
    let dmg = 0;
    switch (sk.type) {
      case "multi":
        for (let i = 0; i < sk.hits; i++) dmg += h.atk * sk.power * pow * U.rand(0.85, 1.15);
        break;
      case "hit":
        dmg = h.atk * sk.power * pow * U.rand(0.9, 1.1);
        if (sk.crit) dmg *= 2;
        break;
      case "heal": {
        const amt = sk.power * pow;
        for (const m of F.team) {
          if (m.hp > 0) {
            const heal = Math.round(m.maxHp * amt);
            m.hp = Math.min(m.maxHp, m.hp + heal);
            F.events.push({ t: F.t, type: "heal", hunter: m.id, amt: heal });
          }
        }
        F.events.push({ t: F.t, type: "skill", hunter: h.id, skill: sk.id, dmg: 0 });
        MG.core.audio.SFX.gem();
        return;
      }
      case "buff":
        h.buffs.shield = sk.dur;
        F.events.push({ t: F.t, type: "skill", hunter: h.id, skill: sk.id, dmg: 0, buff: true });
        return;
      case "taunt":
        F.taunt = { id: h.id, left: sk.dur };
        F.events.push({ t: F.t, type: "skill", hunter: h.id, skill: sk.id, dmg: 0 });
        return;
      case "teambuff":
        F.teambuff = { mult: sk.power * pow, left: sk.dur };
        F.events.push({ t: F.t, type: "skill", hunter: h.id, skill: sk.id, dmg: 0, buff: true });
        return;
    }
    // damage skills
    if (sk.dot) F.dot = { dmg: Math.max(1, Math.round(h.atk * 0.25)), left: sk.dot };
    if (sk.freeze) F.freeze = sk.freeze;
    dmg = Math.max(1, Math.round(dmg * (100 / (100 + F.m.def))));
    F.hp -= dmg;
    F.events.push({ t: F.t, type: "skill", hunter: h.id, skill: sk.id, dmg, cls: h.cls, name: h.name });
    if (sk.heal) {
      const heal = Math.round(h.maxHp * sk.heal);
      h.hp = Math.min(h.maxHp, h.hp + heal);
      F.events.push({ t: F.t, type: "heal", hunter: h.id, amt: heal });
    }
  }
  function onKill() {
    const st = S();
    const m = F.m;
    F.kills++;
    MG.core.audio.SFX[m.boss ? "victory" : "death"]();
    const drops = MG.sys.loot.applyDrops(st.hunt.region, st.hunt.stage, m);
    F.gold += drops.gold; F.exp += drops.exp;
    const isFirstBoss = m.boss && (st.stats.bossKills || 0) === 0;
    F.events.push({
      t: F.t, type: "kill", boss: m.boss, firstBoss: isFirstBoss, name: m.name, sprite: m.sprite,
      gold: drops.gold,
      item: drops.items[0] ? { name: MG.sys.equipment.nameOf(drops.items[0]), rarity: drops.items[0].rarity } : null
    });
    MG.sys.game.log("擊敗「" + m.name + "」 +" + MG.util.fmt(drops.gold) + " 金" + (drops.items.length ? " 掉落裝備！" : ""), drops.items.length ? "icon_chest" : "icon_coin");
    st.stats.kills++;
    if (m.boss) st.stats.bossKills++;
    st.codex.monsters[m.id] = (st.codex.monsters[m.id] || 0) + 1;
    MG.sys.meta.bump(m.boss ? "boss" : "kill", 1);
    // heal after kill
    const killHealBonus = MG.sys.equipment.killHealBonus ? MG.sys.equipment.killHealBonus() : 0;
    for (const h of F.team) {
      let healR = 0.25 + (h.cls === "priest" ? 0.1 : 0) + killHealBonus;
      if (h.hp > 0) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * healR);
    }
    advance();
  }
  function advance() {
    const st = S();
    F.pendingHp = undefined; // new stage = fresh monster context
    let { region, stage } = st.hunt;
    const isBoss = stage % MG.config.MAX_STAGE_PER_REGION === 0;
    if (isBoss) {
      const r = MG.sys.loot.region(region);
      st.stats.maxTierReached = Math.max(st.stats.maxTierReached || 1, r.tier);
      st.currencies.gems += 30;
      st.currencies.honor += 5;
      MG.sys.game.addKingdomExp(50);
      MG.sys.meta.bump("region", 1);
      const nextR = MG.sys.loot.region(region + 1);
      if (nextR && st.hunt.auto && st.kingdom.level >= nextR.unlockK) {
        region++; stage = 1;
        F.events.push({ t: F.t, type: "region", name: nextR.name });
        F.banner = { text: "新區域：「" + nextR.name + "」", t: 2.5 };
        st.currencies.gems += 20;
        MG.core.audio.SFX.victory();
      } else {
        F.events.push({ t: F.t, type: "repeatboss" });
      }
    } else {
      stage++;
      MG.sys.meta.bump("stage", 1);
      MG.sys.game.addKingdomExp(stage <= 6 ? 8 : 5);
      if (stage % MG.config.MAX_STAGE_PER_REGION === 0) {
        F.banner = { text: "第 " + (region + 1) + " 區首領戰！", t: 2 };
        F.shake = 0.4;
      } else {
        F.banner = { text: "第 " + stage + " 關", t: 1.4 };
      }
    }
    st.hunt.region = region; st.hunt.stage = stage;
    st.stats.maxStage = Math.max(st.stats.maxStage, stage);
    newMonster();
  }
  function retreat() {
    const st = S();
    F.phase = "retreat";
    F.retreatAt = Date.now() + MG.config.RETREAT_MS;
    F.wipes = (F.wipes || 0) + 1;
    if (F.m && F.m.boss && F.hp > 0) F.pendingHp = F.hp; // keep boss damage between attempts
    F.events.push({ t: F.t, type: "retreat", wipes: F.wipes });
    MG.core.audio.SFX.hurt();
  }
  function step(dt) {
    const st = S();
    if (!F) start();
    if (F.phase === "idle") {
      if (F.team.length) { start(); return; }
      return;
    }
    if (F.phase === "retreat") {
      if (Date.now() >= F.retreatAt && st.hunt.autoRetry) {
        for (const h of F.team) { h.hp = h.maxHp; h.cd = 0.5; h.skillCd = U.rand(1, 3); }
        F.phase = "fight";
        F.events.push({ t: F.t, type: "resume" });
        newMonster();
      }
      return;
    }
    F.t += dt;
    if (F.events.length > 800) F.events.splice(0, F.events.length - 800);
    if (F.banner && (F.banner.t -= dt) <= 0) F.banner = null;
    if (F.shake > 0) F.shake -= dt;
    if (F.taunt && (F.taunt.left -= dt) <= 0) F.taunt = null;
    if (F.teambuff && (F.teambuff.left -= dt) <= 0) F.teambuff = null;
    // monster attack
    F.mAtk -= dt;
    if (F.mAtk <= 0 && F.freeze <= 0) {
      F.mAtk = 1 / (0.7 + (F.m.boss ? 0.25 : 0));
      const alive = F.team.filter(h => h.hp > 0);
      if (alive.length) {
        let target;
        if (F.taunt) { target = F.team.find(h => h.id === F.taunt.id); if (!target || target.hp <= 0) target = U.pick(alive); }
        else {
          const knights = alive.filter(h => h.cls === "knight");
          target = (knights.length && U.chance(0.5)) ? U.pick(knights) : U.pick(alive);
        }
        let dmg = F.m.atk * U.rand(0.9, 1.1);
        dmg *= 1 - Math.min(0.7, target.def / (target.def + 120));
        if (target.buffs.shield) dmg *= 0.5;
        dmg = Math.max(1, Math.round(dmg));
        target.hp -= dmg;
        F.events.push({ t: F.t, type: "mhit", hunter: target.id, dmg, name: target.name });
        if (target.hp <= 0) {
          target.hp = 0;
          F.events.push({ t: F.t, type: "down", hunter: target.id, name: target.name });
        }
        if (F.team.every(h => h.hp <= 0)) { retreat(); return; }
      }
    }
    // dot
    if (F.dot.left > 0) {
      F.dot.left -= dt;
      const d = Math.max(1, Math.round(F.dot.dmg * dt * 2));
      F.hp -= d;
      F.events.push({ t: F.t, type: "dot", dmg: d });
    }
    // hunters
    for (const h of F.team) {
      if (h.hp <= 0) continue;
      h.cd -= dt; h.skillCd -= dt;
      if (h.skillCd <= 0 && h.skills.length) {
        castSkill(h, h.skills[0]);
        h.skillCd = h.skills[0].cd;
      }
      if (h.cd <= 0) { h.cd = 1 / Math.max(0.3, h.spd); attack(h); }
    }
    if (F.hp <= 0) onKill();
  }
  function rates() {
    const st = S();
    const team = MG.sys.hunters.formation();
    if (!team.length) return { goldPerSec: 8, expPerSec: 3 };
    const m = MG.sys.loot.scaledMonster(st.hunt.region, st.hunt.stage);
    let dps = 0;
    for (const h of team) {
      const s = MG.sys.hunters.effectiveStats(h);
      dps += s.atk * (1 + s.crit) * s.spd * (100 / (100 + m.def));
    }
    const killT = Math.max(0.4, m.hp / Math.max(1, dps));
    const eff = MG.sys.buildings.effects();
    let g = m.gold / killT * eff.goldMul;
    if (st.buffs.potGold > Date.now()) g *= 1.5;
    g *= (1 + 0.25 * (st.awakenings || 0)) * (1 + 0.1 * (st.honorLvls.gold || 0));
    return { goldPerSec: g, expPerSec: m.exp / killT * eff.expMul };
  }
  function drainEvents() {
    const f = get();
    const out = f.events;
    f.events = [];
    return out;
  }
  return { start, reset, get, step, rates, drainEvents, teamBuild };
})();
