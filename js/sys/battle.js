/* 放置王國 MEGA IDLE — battle simulator (core engine, owned by Main) */
"use strict";
MG.sys = MG.sys || {};
MG.sys.battle = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  let F = null;

  /* v149 元素相剋：職業元素 vs 當前區域元素，克制 +25% 傷害（聖↔暗互克） */
  function counterMul(cls) {
    const re = (MG.data.monsters.regions[S().hunt.region] || {}).element;
    const ce = MG.config.CLASS_ELEMENT[cls];
    if (!ce || !re) return 1;
    return MG.config.ELEMENT_COUNTER[ce] === re ? 1.25 : 1;
  }
  function counters(cls) { return counterMul(cls) > 1; }
  /* v664：首領機制難度倍率 — 普通 1／困難 1.15／地獄 1.35／夢魘 1.55（深淵無難度＝1） */
  function bossMechMul() {
    const i = (S().hunt && S().hunt.difficulty) || 0;
    return (MG.config.BOSS_MECH_DIFF_MUL && MG.config.BOSS_MECH_DIFF_MUL[i]) || 1;
  }
  function bossShieldUntil() { return 8 * bossMechMul(); }

  function teamBuild() {
    const st = S();
    const ids = st.hunt.dispatchIds || [];
    // 派遣制：只有被玩家派遣的英雄才會出戰；無人派遣 = 空隊待機
    const list = ids.length
      ? ids.map(id => st.hunters.find(h => h.id === id)).filter(Boolean)
      : [];
    return list.map(buildTeamMember);
  }
  // v136：單一英雄轉換為戰鬥成員（供開戰與戰鬥中即時同步共用）
  function buildTeamMember(h) {
    const s = MG.sys.hunters.effectiveStats(h);
    // 王國等級加成：攻擊 ×kMul（與裝備/突破相乘）
    const effAtk = s.atk * MG.sys.buildings.effects().atkMul;
    // 持續性生命：開戰血量 = 英雄當前持久 HP（舊檔無 hp 欄位 → 滿血）
    const maxHp = Math.max(1, Math.round(s.hp));
    if (h.hp === undefined || h.hp === null) h.hp = maxHp;
    const maxMp = Math.max(1, Math.round(s.mp));
    if (h.mp === undefined || h.mp === null) h.mp = maxMp;
    return {
      id: h.id, name: h.name, cls: h.cls, rarity: h.rarity, legend: h.legend, art: h.art, // v157/158
      sprite: MG.data.hunters.classes[h.cls].icon,
      atk: effAtk, def: s.def, maxHp, hp: Math.max(1, Math.min(maxHp, Math.round(h.hp))),
      maxMp, mp: Math.max(0, Math.min(maxMp, Math.round(h.mp))),
      spd: s.spd, crit: s.crit, mit: s.mit, cd: U.rand(0, 0.4), skillCd: U.rand(2, 5),
      skills: (() => { // v250 技能編排：自選主動技排首位；v255：主技+副技雙槽（[主, 副, 其餘] — step() 雙施放軌）
        const list = MG.sys.hunters.unlockedSkills(h);
        const act = MG.sys.hunters.activeSkillOf(h);
        const sub = MG.sys.hunters.subSkillOf(h);
        const ordered = list.slice().sort((a, b) => {
          const ra = a.id === act ? 0 : a.id === sub ? 1 : 2;
          const rb = b.id === act ? 0 : b.id === sub ? 1 : 2;
          return ra - rb;
        });
        return ordered.map(sk => Object.assign({ id: sk.id, lvl: sk.lvl }, MG.data.hunters.skills[sk.id]));
      })(),
      // v255 副技獨立計時（開戰錯開主技）；v255FIX：sub 為 null（未解鎖/主=副）→ subCd undefined 停用軌道（防首技冒充副技施放）
      subCd: MG.sys.hunters.subSkillOf(h) ? U.rand(3, 8) : undefined,
      affixes: MG.sys.equipment.affixSum(h), // v161 詞綴聚合
      buffs: (h.art && MG.data.artifacts && MG.data.artifacts[h.art] && MG.data.artifacts[h.art].passive.defense)
        ? { shield: MG.data.artifacts[h.art].passive.defense * MG.sys.hunters.artifactMul(h.art) } // v158 冰霜之心：開戰護盾（v195 精煉成長）
        : {}
    };
  }
  // v136：戰鬥中即時同步——驅逐/改名/升級/穿裝/編隊編輯立即反映在戰鬥中（保留血量比例、不重置怪物）
  function syncTeamFromState() {
    if (!F || F.phase !== "fight") return;
    const st = S();
    const ids = st.hunt.dispatchIds || [];
    const byId = {};
    for (const h of st.hunters) byId[h.id] = h;
    const existing = {};
    for (const t of F.team) existing[t.id] = t;
    const next = [];
    for (const id of ids) {
      const h = byId[id];
      if (!h) continue; // 已驅逐/移除 → 立即從戰鬥消失
      if (existing[id]) {
        const t = existing[id];
        const hpPct = t.maxHp > 0 ? t.hp / t.maxHp : 1;
        const mpPct = t.maxMp > 0 ? t.mp / t.maxMp : 1;
        // v157 修復：同步素質時保留戰鬥計時器與增益（否則每 tick 重置 cd/skillCd → 技能永不施放、攻速失真）
        // v255FIX：subCd 同保留（否則副技軌每 tick 重擲 3-8s → 副技永不施放）
        const cdKeep = t.cd, skillCdKeep = t.skillCd, subCdKeep = t.subCd, buffsKeep = t.buffs;
        const deadKeep = t.hp <= 0; // v165：死亡持續到戰鬥結束（先捕獲，避免被 fresh.hp 覆寫）
        const fresh = buildTeamMember(h);
        Object.assign(t, fresh);
        t.cd = cdKeep; t.skillCd = skillCdKeep; t.subCd = subCdKeep; t.buffs = buffsKeep;
        t.hp = deadKeep ? 0 : Math.max(1, Math.min(fresh.maxHp, Math.round(fresh.maxHp * hpPct)));
        t.mp = Math.max(0, Math.min(fresh.maxMp, Math.round(fresh.maxMp * mpPct)));
        next.push(t);
      } else {
        next.push(buildTeamMember(h)); // 新編入 → 立即加入戰鬥
      }
    }
    F.team = next;
  }
  // 戰鬥血量寫回英雄持久 HP（切換地圖/召回都不會憑空補滿）
  function syncTeamHp() {
    if (!F || !F.team) return;
    const st = S();
    for (const t of F.team) {
      const h = st.hunters.find(x => x.id === t.id);
      if (h) {
        h.hp = Math.max(0, Math.min(Math.round(t.hp), Math.round(t.maxHp)));
        if (t.mp !== undefined) h.mp = Math.max(0, Math.min(Math.round(t.mp), Math.round(t.maxMp)));
      }
    }
  }
  function newMonster() {
    const st = S();
    // v116 稀有度：小關內 22% 出精英怪（普通怪為主、BOSS 關固定 BOSS）
    const isBossStage = st.hunt.stage % MG.config.MAX_STAGE_PER_REGION === 0;
    const elite = !isBossStage && Math.random() < 0.22;
    const m = MG.sys.loot.scaledMonster(st.hunt.region, st.hunt.stage, { elite });
    F.m = m; F.maxHp = m.hp;
    if (elite) F.events.push({ t: F.t, type: "elite", name: m.name });
    // BOSS進度跨派遣持久化（state 版 pendingHp — battle 物件每次派遣會重建）
    const pending = st.hunt.pendingHp !== undefined && st.hunt.pendingHp > 0 ? st.hunt.pendingHp : 0;
    if (m.boss && pending > 0 && pending < m.hp) {
      F.hp = pending; // boss damage persists across wipes — progressive grind
    } else {
      F.hp = m.hp;
    }
    st.hunt.pendingHp = undefined;
    F.mAtk = 1.4;
    F.dot = { dmg: 0, left: 0 }; F.freeze = 0; F.taunt = null; F.teambuff = null;
    F.poisonT = 4; F.aoeT = 8; // v155 首領機制計時重置
    if (m.boss) {
      F.events.push({ t: F.t, type: "boss", name: m.name });
      F.shake = 0.6;
      const mechName = m.mech ? (MG.config.BOSS_MECHS[m.mech] || {}).name : "";
      F.banner = { text: "BOSS：" + m.name + (mechName ? " · " + mechName : ""), t: 2.2 };
      if (!MG.sys.game.isSilent()) MG.core.audio.SFX.boss();
    }
  }
  function start() {
    const team = teamBuild();
    const st = S();
    F = {
      t: 0, phase: team.length ? "fight" : "idle", team,
      hp: 1, maxHp: 1, mAtk: 1.4, m: null, dot: { dmg: 0, left: 0 }, freeze: 0,
      events: [], banner: null, bannerT: 0, shake: 0, retreatAt: 0, wipes: 0,
      taunt: null, teambuff: null, gold: 0, exp: 0, kills: 0,
      stats: {}, // v251 滅團戰報：per-member 傷害/治療計數（start 重置；零邏輯變更）
      poisonT: 4, aoeT: 8, // v155 首領機制計時
      healAcc: 0, healTick: 1 // v558 回血量化：再生回血累計（顯示用）＋每秒 flush 計時
    };
    if (team.length) {
      if (st.hunt.restUntil > Date.now()) {
        // 死亡/召回後的休息尚未結束（例如重整頁面）— 回到休息狀態
        F.phase = "retreat";
        F.retreatAt = st.hunt.restUntil;
      } else {
        newMonster();
      }
    }
    return F;
  }
  function get() { if (!F) start(); return F; }
  function reset() { F = null; }

  function attack(h) {
    let dmg = h.atk * U.rand(0.9, 1.1);
    if (F.teambuff && F.teambuff.left > 0) dmg *= 1 + F.teambuff.mult;
    const crit = U.chance(h.crit);
    if (crit) dmg *= 2;
    const a = h.affixes || {};
    if (crit && a.critDmg) dmg *= 1 + a.critDmg; // v161 鋒銳：暴擊傷害
    const el = counters(h.cls); // v149 元素克制 +25%
    let dmgMul = el ? 1.25 : 1;
    if (F.m && F.m.mech === "shield" && F.t < bossShieldUntil()) dmgMul *= 0.5; // v155／v664：護盾持續隨難度延長
    if (F.m && F.m.boss && a.boss) dmgMul *= 1 + a.boss; // v161 獵手：對首領傷害
    dmg = Math.max(1, Math.round(dmg * dmgMul * (100 / (100 + F.m.def))));
    if (MG.sys.dev && MG.sys.dev.cheats().instantKill) dmg = F.hp; // vXXX 開發者：一擊必殺
    F.hp -= dmg;
    { const s = F.stats[h.id] || (F.stats[h.id] = { dmg: 0, heal: 0 }); s.dmg += dmg; } // v251 戰報計數
    // v158 嗜血獠牙：攻擊吸血（v195 精煉成長）
    if (h.art && MG.data.artifacts && MG.data.artifacts[h.art] && MG.data.artifacts[h.art].passive.lifesteal) {
      h.hp = Math.min(h.maxHp, h.hp + dmg * MG.data.artifacts[h.art].passive.lifesteal * MG.sys.hunters.artifactMul(h.art));
    }
    if (a.lifesteal) h.hp = Math.min(h.maxHp, h.hp + dmg * a.lifesteal); // v161 嗜血詞綴
    F.events.push({ t: F.t, type: crit ? "crit" : "hit", hunter: h.id, cls: h.cls, dmg, name: h.name, el });
  }
  function castSkill(h, sk, isSub) { // v255：isSub 旗標（副技凍結減半）
    const st = S();
    h.mp -= (sk.mp || 0); // 技能消耗魔力
    let pow = MG.data.hunters.skillPower(sk.lvl) * (1 + 0.01 * (st.studyLvl || 0)); // 技能研讀加成
    // v169 學術傳統：技能威力 +3%/級（跨昇華永久）
    if (MG.sys.meta && MG.sys.meta.traditionEffects) pow *= 1 + MG.sys.meta.traditionEffects().scholar;
    let skillMul = 1; // v157/158 技能威力被動（傳說英雄／神器）
    if (h.legend) {
      const lp = ((MG.data.hunters.LEGENDS || {})[h.legend] || {}).passive;
      // v210FIX：技能威力被動也吃徽章倍率（莫娜/妮克絲 2/8 傳說的徽章原本零效果）
      if (lp && lp.skillDmg) skillMul = 1 + lp.skillDmg * MG.sys.hunters.badgeMul(h.legend);
    }
    if (h.art && MG.data.artifacts && MG.data.artifacts[h.art] && MG.data.artifacts[h.art].passive.skillDmg) {
      skillMul *= 1 + MG.data.artifacts[h.art].passive.skillDmg * MG.sys.hunters.artifactMul(h.art); // v195 精煉成長
    }
    // v170 傳說羈絆：技能威力加成（雙重詠唱／夜幕三傑）
    if (MG.sys.hunters && MG.sys.hunters.bondEffects) {
      const be = MG.sys.hunters.bondEffects();
      if (be.skillDmg) skillMul *= 1 + be.skillDmg;
    }
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
            { const s = F.stats[h.id] || (F.stats[h.id] = { dmg: 0, heal: 0 }); s.heal += heal; } // v251 戰報計數
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
    if (sk.dot) F.dot = { owner: h.id, dmg: Math.max(1, Math.round(h.atk * 0.25)), left: sk.dot }; // v251FIX：記錄施放者（dot tick 傷害歸屬戰報）
    if (sk.freeze) F.freeze = Math.max(F.freeze, sk.freeze * (isSub ? 0.5 : 1)); // v255：副技凍結 ×0.5（控制組合封頂）；v255FIX：max 不縮短既有凍結（副技施放永不劣化）
    const el = counters(h.cls); // v149 元素克制 +25%
    let dmgMul = el ? 1.25 : 1;
    if (F.m && F.m.mech === "shield" && F.t < bossShieldUntil()) dmgMul *= 0.5; // v155／v664 護盾
    const a = h.affixes || {};
    if (F.m && F.m.boss && a.boss) dmgMul *= 1 + a.boss; // v161 獵手
    dmg = Math.max(1, Math.round(dmg * skillMul * dmgMul * (100 / (100 + F.m.def)) * (a.critDmg && (sk.crit || false) ? 1 + a.critDmg : 1)));
    F.hp -= dmg;
    { const s = F.stats[h.id] || (F.stats[h.id] = { dmg: 0, heal: 0 }); s.dmg += dmg; } // v251 戰報計數
    F.events.push({ t: F.t, type: "skill", hunter: h.id, skill: sk.id, dmg, cls: h.cls, name: h.name, el });
    if (sk.heal) {
      const heal = Math.round(h.maxHp * sk.heal);
      h.hp = Math.min(h.maxHp, h.hp + heal);
      { const s = F.stats[h.id] || (F.stats[h.id] = { dmg: 0, heal: 0 }); s.heal += heal; } // v251 戰報計數
      F.events.push({ t: F.t, type: "heal", hunter: h.id, amt: heal });
    }
  }
  function onKill() {
    const st = S();
    const m = F.m;
    F.kills++;
    st.hunt.wipeStreak = 0; // 擊殺 = 連敗中斷
    if (!MG.sys.game.isSilent()) MG.core.audio.SFX[m.boss ? "victory" : "death"]();
    const drops = MG.sys.loot.applyDrops(st.hunt.region, st.hunt.stage, m);
    // v177：升級演出事件（hunt.js 已有渲染，補上推送 — 升級瞬間金色爆發）
    for (const lv of drops.levels || []) {
      F.events.push({ t: F.t, type: "levelup", hunter: lv.hunter, level: lv.level });
    }
    // 戰利品飛行期間暫停頂欄數字跳動（UI 層：金幣飛到英雄才跳，看起來拿到才結算）
    if (!MG.sys.game.isSilent() && MG.ui && MG.ui.screens && MG.ui.screens.suspendBump) MG.ui.screens.suspendBump(1400);
    F.gold += drops.gold; F.exp += drops.exp;
    const isFirstBoss = m.boss && (st.stats.bossKills || 0) === 0;
    // 區域首通旗標：BOSS第一次被擊敗（且還有下一區域）才通知「可進下一關」，重複討伐不再提示
    st.hunt.regionClearShown = st.hunt.regionClearShown || {};
    const regionFirstClear = m.boss && !!MG.sys.loot.region(st.hunt.region + 1) && !st.hunt.regionClearShown[st.hunt.region];
    if (regionFirstClear) st.hunt.regionClearShown[st.hunt.region] = true;
    F.events.push({
      t: F.t, type: "kill", boss: m.boss, firstBoss: isFirstBoss, regionFirstClear, name: m.name, sprite: m.sprite,
      gold: drops.gold, exp: drops.exp,
      item: drops.items[0] ? { name: MG.sys.equipment.nameOf(drops.items[0]), rarity: drops.items[0].rarity } : null
    });
    const potNames = { item_pot_hp: "生命藥水", item_pot_mp: "魔力藥水" };
    const potLine = (drops.potions || []).length ? " 藥水 x" + drops.potions.length + "！" : "";
    MG.sys.game.log("擊敗「" + m.name + "」 +" + MG.util.fmt(drops.gold) + " 金" + ((drops.items||[]).length ? " 掉落裝備！" : "") + potLine, ((drops.items||[]).length || (drops.potions||[]).length) ? "icon_chest" : "icon_coin");
    // 戰利品通知（設定可選：哪些物品掉落要跳出通知）
    const nf = st.settings.notify || {};
    if (!MG.sys.game.isSilent() && nf.potion && (drops.potions || []).length) {
      const pid = drops.potions[0];
      MG.ui.dom.toast("獲得「" + potNames[pid] + "」" + (drops.potions.length > 1 ? " x" + drops.potions.length : "") + "！", "good", pid);
    }
    if (!MG.sys.game.isSilent() && nf.equip && drops.items.length) {
      // v136 通知規則：可限定稀有度/套裝/部位（多選；未設定 = 全部通知）
      const it = drops.items[0];
      const rules = nf.equipRules;
      const rMatch = !rules || !rules.rarity || !Object.keys(rules.rarity).length || !!rules.rarity[it.rarity];
      const sMatch = !rules || !rules.sets || !Object.keys(rules.sets).length || (it.set ? !!rules.sets[it.set] : !!rules.sets.none);
      const slMatch = !rules || !rules.slots || !Object.keys(rules.slots).length || !!rules.slots[MG.sys.equipment.slotOf(it)];
      if (rMatch && sMatch && slMatch) {
        MG.ui.dom.toast("獲得裝備「" + MG.sys.equipment.nameOf(it) + "」！", "good", "icon_chest");
      }
    }
    if (!MG.sys.game.isSilent() && nf.gem && drops.gems.length) {
      const g = drops.gems[0];
      MG.ui.dom.toast("獲得寶石 x" + drops.gems.length + "！", "good", "icon_gem");
    }
    if (!MG.sys.game.isSilent() && nf.book && drops.books) {
      MG.ui.dom.toast("獲得技能書！", "good", "icon_book");
    }
    st.stats.kills++;
    if (m.boss) {
      // v209：bossKills 統計已移至 advance 每日首殺分支（成就/週任不被重複討伐灌水）；王國經驗保留
      MG.sys.game.addKingdomExp(Math.floor(MG.sys.game.kingdomExpNeed(st.kingdom.level) * 0.02));
    } else {
      // 線上打怪：王國經驗低倍率（需求 0.3%/隻，約 300 隻一級）
      MG.sys.game.addKingdomExp(Math.max(1, Math.floor(MG.sys.game.kingdomExpNeed(st.kingdom.level) * 0.003)));
    }
    st.codex.monsters[m.id] = (st.codex.monsters[m.id] || 0) + 1;
    // v209：BOSS 計數移至 advance 每日首殺分支（重複討伐不再灌水 BOSS 任務/成就）
    if (!m.boss) MG.sys.meta.bump("kill", 1);
    // v160 無盡深淵：擊殺更新最佳層數（背景補發也生效）
    if (MG.sys.abyss && MG.sys.abyss.noteKill) MG.sys.abyss.noteKill(st.hunt.stage);
    // heal after kill
    const killHealBonus = MG.sys.equipment.killHealBonus ? MG.sys.equipment.killHealBonus() : 0;
    for (const h of F.team) {
      let healR = 0.25 + (h.cls === "priest" ? 0.1 : 0) + killHealBonus;
      if (h.hp > 0) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * healR);
    }
    advance(regionFirstClear);
  }
  function advance(regionFirstClear) {
    const st = S();
    st.hunt.pendingHp = undefined; // new stage = fresh monster context
    let { region, stage } = st.hunt;
    const isBoss = stage % MG.config.MAX_STAGE_PER_REGION === 0;
    if (isBoss) {
      const r = MG.sys.loot.region(region);
      st.stats.maxTierReached = Math.max(st.stats.maxTierReached || 1, r.tier);
      // 地圖改進度解鎖：擊敗本區BOSS → 下一區域解鎖（深淵不推進假區域 — v209FIX）
      if (region !== MG.sys.abyss.INDEX) st.stats.maxRegionReached = Math.max(st.stats.maxRegionReached || 0, region + 1);
      // v209 平衡：BOSS 每日每區域首殺才發鑽石/榮譽（重複討伐歸零 — 印鈔機修復）
      // v229 結構對沖：首殺 10→5 鑽（每週 -385），榮譽 2→3 補償；深淵週結算/里程碑同步加碼 —
      // 「零風險掃蕩」收益原為「挑戰型成長（深淵/競技場）」5-10 倍，鑽石主來源應綁成長而非點擊儀式
      const today = U.today();
      const br = st.stats.bossRewards || (st.stats.bossRewards = { day: "", perRegion: {} });
      if (br.day !== today) { br.day = today; br.perRegion = {}; }
      const bossFirst = !br.perRegion[region];
      if (bossFirst) {
        br.perRegion[region] = true;
        st.stats.bossKills++; // v209：BOSS 統計/任務/成就同步首殺化（重複討伐不再灌水）
        st.currencies.gems += 5;
        st.currencies.honor += 3;
        MG.sys.meta.bump("boss", 1);
      }
      if (region === MG.sys.abyss.INDEX) {
        // v209FIX：深淵領主 → 推進深度跨過領主層（v146 既存缺陷：region+1 被 clamp 回深淵 →
        // 假區域無限膨脹、深淵進度卡 10 層、每殺領主 30 鑽印鈔、region 越界凍結狩獵畫面）
        stage++;
        F.banner = { text: "深淵第 " + stage + " 層", t: 1.4 };
      } else {
        MG.sys.game.addKingdomExp(50);
        MG.sys.meta.bump("region", 1);
        // 自動進關開：打完BOSS自動進下一張地圖
        // 自動進關關：原地重複討伐（龜著練角）
        const nextR = MG.sys.loot.region(region + 1);
        if (st.hunt.autoAdvance !== false && nextR) {
          region++; stage = 1;
          F.events.push({ t: F.t, type: "region", name: nextR.name });
          F.banner = { text: "新區域：「" + nextR.name + "」", t: 2.5 };
          st.currencies.gems += 20; // 區域推進獎勵
          MG.core.audio.SFX.victory();
        } else {
          F.events.push({ t: F.t, type: "repeatboss" });
          if (nextR) {
            F.events.push({ t: F.t, type: "regionunlock", name: nextR.name, firstClear: regionFirstClear });
          }
        }
      }
    } else {
      if (st.hunt.autoAdvance === false) {
        // 自動進關關閉：原地重複討伐當前關卡（練角用，只顯示關卡提示）
        F.events.push({ t: F.t, type: "repeatstage", stage });
        F.banner = { text: MG.config.stageLabel(stage), t: 1.4 };
      } else {
        stage++;
        MG.sys.meta.bump("stage", 1);
        MG.sys.game.addKingdomExp(stage <= 6 ? 8 : 5);
        if (stage % MG.config.MAX_STAGE_PER_REGION === 0) {
          F.banner = { text: "第 " + (region + 1) + " 區BOSS戰！", t: 2 };
          F.shake = 0.4;
        } else {
          F.banner = { text: MG.config.stageLabel(stage), t: 1.4 };
        }
      }
    }
    st.hunt.region = region; st.hunt.stage = stage;
    st.stats.maxStage = Math.max(st.stats.maxStage, stage);
    // 每區域最高波數：覺醒條件「第 5 大關第 5 波」等判定用（v640 門檻上調）
    if (!st.stats.maxStageByRegion) st.stats.maxStageByRegion = {};
    st.stats.maxStageByRegion[region] = Math.max(st.stats.maxStageByRegion[region] || 0, stage);
    newMonster();
  }
  /* v560 引擎端建議戰力（single source — 自 ui/hunt.js v236 搬移，abyss.js 鏡像註記同步指向此處）
     v236：可選難度倍率（最佳練功點掃描用 — 預設當前難度） */
  function stagePowerReq(regionIdx, stage, diffMult) {
    const st = S();
    const r = (MG.data.monsters.regions || [])[regionIdx];
    const boss = stage % MG.config.MAX_STAGE_PER_REGION === 0;
    if (r && r.abyss) {
      const hp = (6000 + stage * 2500) * (boss ? 3 : 1);
      const atk = (80 + stage * 32) * (boss ? 1.8 : 1);
      const def = (12 + stage * 7) * (boss ? 1.8 : 1);
      const v = (hp / 1.6 + atk * 6 + def * 2) / 2;
      return Math.max(60, Math.ceil(v / 50) * 50);
    }
    if (!r) return 60;
    const dm = diffMult !== undefined ? diffMult : (MG.config.DIFFICULTY[(st.hunt.difficulty || 0)] || MG.config.DIFFICULTY[0]).mult;
    const def2 = boss ? r.boss : r.monsters[(stage - 1) % r.monsters.length];
    const bossMul = boss ? (r.tier <= 2 ? 2.4 : r.tier <= 4 ? 3 : 4) : 1;
    const hpAtkMul = (1 + 0.16 * (stage - 1)) * bossMul * dm;
    // v204FIX：防禦不隨難度縮放（與 scaledMonster 一致）
    const defMul = (1 + 0.16 * (stage - 1)) * bossMul;
    const v = (def2.hp * hpAtkMul / 1.6 + def2.atk * hpAtkMul * 6 + def2.def * defMul * 2) / 2;
    return Math.max(60, Math.ceil(v / 50) * 50);
  }
  /* v560 引擎端最佳練功點（自 ui/hunt.js v236 搬移 — 連敗回退遷移目的地單一來源）
     掃描已解鎖區域×難度×關卡 — 出戰隊可穩過（tp≥req）中單場收益最高者；深淵排除 */
  function formationPower() {
    const st = S();
    let p = 0;
    for (const id of st.formation) {
      const h = st.hunters.find(x => x.id === id);
      if (h) p += MG.sys.hunters.power(h);
    }
    return p;
  }
  function bestFarmSpot() {
    const st = S();
    const tp = formationPower();
    if (tp <= 0) return null;
    const maxR = st.stats.maxRegionReached || 0;
    const maxStage = st.stats.maxStage || 1;
    const diffs = MG.config.DIFFICULTY.map((d, i) => ({ i, ...d })).filter(d => maxR >= d.unlockRegion);
    let best = null;
    for (let r = 0; r <= maxR; r++) {
      const reg = (MG.data.monsters.regions || [])[r];
      if (!reg || reg.abyss) continue;
      for (let n = 1; n <= Math.min(MG.config.MAX_STAGE_PER_REGION, maxStage); n++) {
        for (const d of diffs) {
          const req = stagePowerReq(r, n, d.mult);
          if (tp < req) continue;
          const { def, boss } = MG.sys.loot.monsterForStage(r, n);
          const bm = boss ? (r <= 1 ? 2.4 : r <= 3 ? 3 : 4) : 1;
          const mul = boss ? (1 + (n - 1) * 0.16) * bm : 1 + (n - 1) * 0.16;
          const gold = def.gold * mul * d.gold;
          const exp = def.exp * mul * d.exp;
          if (!best || gold + exp >= best.gold + best.exp) best = { r, n, d: d.i, gold, exp, req };
        }
      }
    }
    return best;
  }
  function retreat() {
    const st = S();
    F.phase = "retreat";
    F.retreatAt = Date.now() + MG.config.RETREAT_MS;
    st.hunt.restUntil = F.retreatAt; // 持久化：重整頁面後休息仍在進行
    syncTeamHp(); // 滅團瞬間寫回（全員 0 血）
    // 連敗回退：跨戰鬥累計（state.wipeStreak，擊殺歸零）——連敗 3 場自動退一關；
    // 已在第 1 關仍連敗 → 難度降一級（直到普通）。引擎端執行，隱藏分頁也生效。
    st.hunt.wipeStreak = (st.hunt.wipeStreak || 0) + 1;
    let fallback = null;
    if (st.hunt.wipeStreak >= 3) {
      st.hunt.wipeStreak = 0;
      // v560 連敗回退目的地 = 最佳練功點：3 連敗表示當前關卡是卡牆點（可贏但效率崩潰，或打不過），
      // 直接遷移至引擎掃描的「可穩過中單場收益最高」關卡（v236 派遣視窗同源邏輯）。
      // 原行為只退 1 關 — 實測蒼穹之塔 BOSS 牆 456 金/秒 vs 最佳農點 詛咒沼澤 s6 夢魘 1819 金/秒（4×），
      // 且退 1 關（s9=708/s）仍只有最佳的 39% — 卡牆掛機收益崩潰但玩家無感無訊號；
      // 遷移後退守=自動前往最佳農點，練角效率 4×，練完一鍵再推（autoAdvance 照常暫停，契約不變）。
      // 深淵（region 10）維持原契約：無限爬塔的 chip 節奏（autoRetry 獨立分流，不遷移）。
      let relocated = false;
      if (st.hunt.region !== MG.sys.abyss.INDEX) {
        try {
          const best = bestFarmSpot();
          if (best && (best.r !== st.hunt.region || best.n !== st.hunt.stage || best.d !== (st.hunt.difficulty || 0))) {
            st.hunt.region = best.r;
            st.hunt.stage = best.n;
            st.hunt.difficulty = best.d;
            st.hunt.pendingHp = undefined; // 新地點 = 新關卡/新BOSS戰
            fallback = { type: "farmspot", r: best.r, n: best.n, d: best.d, gold: best.gold, exp: best.exp };
            relocated = true;
          }
        } catch (e) { /* 掃描非關鍵路徑 — 失敗退回原退守邏輯 */ }
      }
      if (!relocated) {
        if (st.hunt.stage > 1) {
          st.hunt.stage -= 1;
          fallback = { type: "stage", stage: st.hunt.stage };
        } else if ((st.hunt.difficulty || 0) > 0 && st.hunt.region < 10) {
          st.hunt.difficulty -= 1; // 深淵無難度倍率：不在此處降難度
          st.hunt.pendingHp = undefined; // 新難度 = 新BOSS戰
          fallback = { type: "difficulty", diff: st.hunt.difficulty };
        }
      }
      // v559 連敗回退 = 退守練角：暫停自動進關，讓隊伍停在退守關卡連續農。
      // 原行為：退守一關後第一殺就被 autoAdvance 拉回 BOSS 關 → 掛機卡牆 = 零進度死迴圈
      // （實測 2h 僅 26 殺/h、約 5k 金/h，同隊穩定農場的 ~1/100 — 連敗回退的設計意圖被
      // 自動進關抵銷）；暫停後退守關卡成為穩定農點（v560 起目的地=最佳練功點，非僅退 1 關），
      // 玩家練角完成後用「自動進關」按鈕手動再推（戰敗再自動暫停，迴圈閉合）。
      // 深淵（index 10）維持原契約：無限爬塔的 chip 節奏（autoRetry 獨立分流）。
      if (st.hunt.region !== MG.sys.abyss.INDEX) st.hunt.autoAdvance = false;
    }
    // keep boss damage between attempts（v560：遷移至新練功點後不承接舊牆 BOSS 進度 — 新地點 = 全新戰鬥）
    if (!(fallback && fallback.type === "farmspot") && F.m && F.m.boss && F.hp > 0) st.hunt.pendingHp = F.hp;
    F.events.push({ t: F.t, type: "retreat", wipes: st.hunt.wipeStreak, fallback });
    MG.core.audio.SFX.hurt();
  }
  // 玩家主動召回：立即回村待機（不補血——生命是持續性的，靠自動恢復/藥水/死亡休息）
  function recall() {
    const st = S();
    if (!F) return;
    syncTeamHp(); // 把當前戰鬥血量寫回持久 HP
    st.hunt.dispatchIds = [];
    st.hunt.restUntil = 0;
    st.hunt.wipeStreak = 0;
    F.phase = "idle";
    F.events.push({ t: F.t, type: "returnhome" });
    MG.core.audio.SFX.click();
  }
  function step(dt) {
    const st = S();
    if (!F) start();
    syncTeamFromState(); // v136：戰鬥中編輯/素質變更即時生效
    if (F.phase === "idle") {
      if (F.team.length) { start(); return; }
      return;
    }
    if (F.phase === "retreat") {
      if (Date.now() >= F.retreatAt) {
        // 死亡休息結束：滿血滿魔復活（死亡是唯一免費補滿管道）
        for (const h of F.team) { h.hp = h.maxHp; h.mp = h.maxMp; h.cd = 0.5; h.skillCd = U.rand(1, 3); }
        syncTeamHp();
        if (st.hunt.autoDispatch || (MG.sys.abyss && st.hunt.region === MG.sys.abyss.INDEX && st.abyss && st.abyss.autoRetry)) { // v258 深淵連續挑戰（獨立於全域開關 — 深淵自動、普通手動分流）
          // 自動續戰：休息完立刻重新派遣當前編隊（BOSS進度 pendingHp 照常承接）
          st.hunt.dispatchIds = st.formation.filter(id => id && st.hunters.some(h => h.id === id));
          if (st.hunt.dispatchIds.length) {
            st.hunt.restUntil = 0;
            F.phase = "idle";
            F.events.push({ t: F.t, type: "resume" });
            start();
            return;
          }
        }
        st.hunt.dispatchIds = [];
        st.hunt.restUntil = 0;
        F.phase = "idle";
        F.events.push({ t: F.t, type: "returnhome" });
      }
      return;
    }
    F.t += dt;
    if (F.events.length > 800) F.events.splice(0, F.events.length - 800);
    if (F.banner && (F.banner.t -= dt) <= 0) F.banner = null;
    if (F.shake > 0) F.shake -= dt;
    if (F.taunt && (F.taunt.left -= dt) <= 0) F.taunt = null;
    if (F.teambuff && (F.teambuff.left -= dt) <= 0) F.teambuff = null;
    if (F.freeze > 0) F.freeze = Math.max(0, F.freeze - dt); // v250FIX：凍結計時（原無遞減 — 凍結技設為主動後怪物永凍整場不攻擊）
    for (const h of F.team) { // v250FIX：禦劍架式/冰霜之心護盾計時（原無遞減 — 6 秒減傷變整場常駐）
      if (h.buffs.shield > 0) h.buffs.shield = Math.max(0, h.buffs.shield - dt);
    }
    // v155 首領機制：再生／劇毒／震怒（計時器）；v664 強度 × bossMechMul()
    const mech = F.m && F.m.mech;
    const mm = bossMechMul();
    if (mech === "regen" && F.hp > 0 && F.hp < F.maxHp * 0.5) {
      const prevHp = F.hp;
      F.hp = Math.min(F.maxHp, F.hp + F.maxHp * 0.008 * mm * dt);
      // v558 回血量化：累計實際回復量（HP 數值軌跡零變更），每秒 flush 一次 mheal 事件（UI 跳 +N）
      F.healAcc += F.hp - prevHp;
      F.healTick -= dt;
      if (F.healTick <= 0) {
        F.healTick = 1;
        if (F.healAcc >= 1) {
          F.events.push({ t: F.t, type: "mheal", amt: Math.round(F.healAcc), mech: "regen", name: F.m.name });
          F.healAcc = 0;
        }
      }
    }
    if (mech === "poison") {
      F.poisonT -= dt;
      if (F.poisonT <= 0) {
        F.poisonT = 4;
        const aliveP = F.team.filter(h => h.hp > 0);
        if (aliveP.length && !(MG.sys.dev && MG.sys.dev.cheats().godMode)) { // vXXX 開發者：我方無敵
          const t = U.pick(aliveP);
          const d = Math.max(1, Math.round(t.maxHp * 0.03 * mm));
          t.hp -= d;
          F.events.push({ t: F.t, type: "mhit", hunter: t.id, dmg: d, name: t.name, poison: true });
          if (t.hp <= 0) {
            t.hp = 0;
            F.events.push({ t: F.t, type: "down", hunter: t.id, name: t.name });
          }
          if (F.team.every(h => h.hp <= 0)) { retreat(); return; }
        }
      }
    }
    if (mech === "aoe") {
      F.aoeT -= dt;
      if (F.aoeT <= 0) {
        F.aoeT = 8;
        const god = MG.sys.dev && MG.sys.dev.cheats().godMode; // vXXX 開發者：我方無敵
        const d = god ? 0 : Math.max(1, Math.round(F.m.atk * 0.6 * mm));
        for (const t of F.team) {
          if (t.hp <= 0) continue;
          if (god) continue;
          t.hp -= d;
          F.events.push({ t: F.t, type: "mhit", hunter: t.id, dmg: d, name: t.name, aoe: true });
          if (t.hp <= 0) {
            t.hp = 0;
            F.events.push({ t: F.t, type: "down", hunter: t.id, name: t.name });
          }
        }
        if (F.team.every(h => h.hp <= 0)) { retreat(); return; }
      }
    }
    // monster attack
    F.mAtk -= dt;
    if (F.mAtk <= 0 && F.freeze <= 0) {
      F.mAtk = 1 / (0.7 + (F.m.boss ? 0.25 : 0));
      const alive = F.team.filter(h => h.hp > 0);
      if (alive.length && !(MG.sys.dev && MG.sys.dev.cheats().godMode)) { // vXXX 開發者：我方無敵
        // v165 前排/後排站位：前排（1-2 位）承受單體攻擊，全滅才打後排
        let target = null;
        if (F.taunt) {
          target = F.team.find(h => h.id === F.taunt.id);
          if (!target || target.hp <= 0) target = null;
        }
        if (!target) {
          const front = alive.filter(h => F.team.indexOf(h) < 2);
          const pool = front.length ? front : alive;
          const knights = pool.filter(h => h.cls === "knight");
          target = (knights.length && U.chance(0.5)) ? U.pick(knights) : U.pick(pool);
        }
        let dmg = F.m.atk * U.rand(0.9, 1.1);
        dmg *= 1 - Math.min(0.7, target.def / (target.def + 120));
        // v215FIX：mit 減傷消費端（v161 起套裝 fx4/共振減傷是死屬性 — 從無任何傷害路徑讀取）
        if (target.mit) dmg *= Math.max(0.1, 1 - target.mit);
        if (target.buffs.shield) dmg *= 0.5;
        const a = target.affixes || {};
        if (a.guard) dmg *= 1 - a.guard; // v161 鐵壁：受到傷害減少
        if (F.team.indexOf(target) >= 2) dmg *= 0.75; // v165 後排減傷 25%（單體攻擊）
        dmg = Math.max(1, Math.round(dmg));
        if (mech === "lifesteal") {
          const prevHp = F.hp;
          F.hp = Math.min(F.maxHp, F.hp + dmg * Math.min(0.9, 0.6 * mm)); // v155／v664 吸血
          // v558 回血量化：吸血作用瞬間推送 mheal（UI 跳 +N — 血條回升不再無解讀線索）
          const applied = F.hp - prevHp;
          if (applied >= 1) F.events.push({ t: F.t, type: "mheal", amt: Math.round(applied), mech: "lifesteal", name: F.m.name });
        }
        if (a.thorns) { // v161 荊棘：反彈 — v251FIX：計入持有者戰報
          const th = Math.max(1, Math.round(dmg * a.thorns));
          F.hp = Math.max(0, F.hp - th);
          { const s = F.stats[target.id] || (F.stats[target.id] = { dmg: 0, heal: 0 }); s.dmg += th; }
        }
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
      { const s = F.stats[F.dot.owner] || (F.stats[F.dot.owner] = { dmg: 0, heal: 0 }); s.dmg += d; } // v251FIX：dot tick 計入施放者
      F.events.push({ t: F.t, type: "dot", dmg: d });
    }
    // hunters
    for (const h of F.team) {
      if (h.hp <= 0) continue;
      // 戰鬥中緩慢回魔 2%/s（v116 平衡）：技能受 MP 與冷卻雙重節制，
      // 不會幾發就整場停擺（太慢全破），也不能無腦連發（太快全破）
      if (h.mp < h.maxMp) h.mp = Math.min(h.maxMp, h.mp + h.maxMp * 0.02 * dt);
      h.cd -= dt; h.skillCd -= dt; if (h.subCd !== undefined) h.subCd -= dt;
      if (h.skillCd <= 0 && h.skills.length && h.mp >= (h.skills[0].mp || 0)) {
        castSkill(h, h.skills[0]);
        h.skillCd = h.skills[0].cd;
      }
      // v255 副技軌：獨立計時（主技失敗/冷卻不阻塞）；MP 為天然雙重節制 — 低池自動錯開
      if (h.subCd !== undefined && h.subCd <= 0 && h.skills.length > 1 && h.mp >= (h.skills[1].mp || 0)) {
        castSkill(h, h.skills[1], true);
        h.subCd = h.skills[1].cd;
      }
      if (h.cd <= 0) { h.cd = 1 / Math.max(0.3, h.spd); attack(h); }
    }
    if (F.hp <= 0) onKill();
    syncTeamHp(); // 每 tick 把戰鬥血量寫回英雄持久 HP
  }
  /* v234 在線專注層數：連續在線（tick 間隔 <60s 續）每滿 1 小時 +1 層（封頂 4）；
     斷線重置 since；離線結算（noFocus）不更新 — 防離線白吃加成 */
  function focusLayers() {
    const st = S();
    const now = Date.now();
    const fs2 = st.focusStreak;
    // v234FIX：間隔判定用 last（上次呼叫）而非 since（起點）— 原 since 恆不動 → 間隔恆 >gapMs → 層數永遠 0
    if (!fs2 || now - (fs2.last || fs2.since) > MG.config.ACTIVE_FOCUS.gapMs) {
      st.focusStreak = { since: now, last: now };
    } else {
      st.focusStreak.last = now;
    }
    const hours = (now - st.focusStreak.since) / 3600e3;
    // v234FIX：負數 clamp（時鐘回撥 DST/NTP → now-since 負 → 層數負 → 負加成違反「純 buff」不變式）
    return Math.max(0, Math.min(MG.config.ACTIVE_FOCUS.max, Math.floor(hours)));
  }
  function rates(opts) {
    const st = S();
    // 休息中 = 無人戰鬥（含離線結算）
    if ((st.hunt.restUntil || 0) > Date.now()) return { goldPerSec: 0, expPerSec: 0 };
    const ids = st.hunt.dispatchIds || [];
    if (!ids.length) return { goldPerSec: 0, expPerSec: 0 }; // 未派遣 → 無人戰鬥
    const team = ids.map(id => st.hunters.find(h => h.id === id)).filter(Boolean);
    if (!team.length) return { goldPerSec: 0, expPerSec: 0 };
    const m = MG.sys.loot.scaledMonster(st.hunt.region, st.hunt.stage);
    const parts = []; // v256 產出明細：每層乘數來源（與 /秒 同計算產出 — 驗證性）
    let dps = 0;
    for (const h of team) {
      const s = MG.sys.hunters.effectiveStats(h);
      dps += s.atk * (1 + s.crit) * s.spd * (100 / (100 + m.def)) * counterMul(h.cls); // v149 元素克制併入離線速率
    }
    // v204FIX：擊殺時間下限隨難度縮放（原固定 0.4s — 頂層玩家 dps 足夠時金幣/秒直接 ×難度、夢魘無風險 5.5× 印鈔；縮放後離線效率精確 parity）
    const dMult = (MG.config.DIFFICULTY[(st.hunt.difficulty || 0)] || MG.config.DIFFICULTY[0]).mult;
    const killT = Math.max(0.4 * dMult, m.hp / Math.max(1, dps));
    const eff = MG.sys.buildings.effects();
    let g = m.gold / killT * eff.goldMul;
    parts.push({ name: "王國建築", mul: eff.goldMul });
    if (st.buffs.potGold > Date.now()) { g *= 1.5; parts.push({ name: "靈藥（金幣）", mul: 1.5 }); }
    // v224 昇華封頂（同 loot/hunters — 前 5 次各 +25%、之後各 +5%）
    const awMul = (1 + 0.25 * Math.min(st.awakenings || 0, 5) + 0.05 * Math.max(0, (st.awakenings || 0) - 5));
    g *= awMul * (1 + 0.1 * (st.honorLvls.gold || 0));
    parts.push({ name: "昇華", mul: awMul });
    parts.push({ name: "榮譽階（金幣）", mul: 1 + 0.1 * (st.honorLvls.gold || 0) });
    // v174 重構：加成改為累乘後單一 return（先前公會分支提前 return 使狩獵傳統／週末雙倍在離線速率中失效）
    let gMul = 1, eMul = 1;
    if (MG.sys.guild) { // v156 公會科技併入離線速率
      const ge = MG.sys.guild.effects();
      gMul *= 1 + ge.gold; eMul *= 1 + ge.exp;
      parts.push({ name: "公會科技", mul: 1 + ge.gold });
    }
    if (MG.sys.meta && MG.sys.meta.traditionEffects) { // v169 狩獵傳統併入離線速率
      const tr = MG.sys.meta.traditionEffects();
      gMul *= 1 + tr.hunt; eMul *= 1 + tr.hunt;
      parts.push({ name: "狩獵傳統", mul: 1 + tr.hunt });
    }
    if (MG.config.WEEKEND_MULT && U.isWeekend()) { // v174 週末雙倍併入離線速率
      gMul *= MG.config.WEEKEND_MULT; eMul *= MG.config.WEEKEND_MULT;
      parts.push({ name: "週末雙倍", mul: MG.config.WEEKEND_MULT });
    }
    // v224FIX：離線經驗同步昇華/智慧印記乘數（與 loot 掉落一致 — 原 rates 缺昇華經驗）
    const awExp = 1 + 0.05 * Math.min(st.awakenings || 0, 5) + 0.01 * Math.max(0, (st.awakenings || 0) - 5);
    // v234 在線專注（離線結算 noFocus 排除 — 修正離線 1.2× > 線上 1.0× 倒掛；與沙漏/靈藥/週末全疊乘）
    // v588：以 OFFLINE_RATE 為底（層 0 即 1.2× 與離線即時齊平）+ 每層 +5% 疊加（滿層 1.40× 超越）— 落實 v234「齊平並超越」
    let focusMul = 1;
    if (!(opts && opts.noFocus)) {
      focusMul = MG.config.OFFLINE_RATE + MG.config.ACTIVE_FOCUS.perHour * focusLayers();
      if (focusMul > 1) parts.push({ name: "在線專注 ×" + focusLayers(), mul: focusMul });
    }
    return { goldPerSec: g * gMul * focusMul, expPerSec: m.exp / killT * eff.expMul * eMul * awExp * (1 + 0.05 * (st.honorLvls.exp || 0)) * focusMul, parts };
  }
  function drainEvents() {
    const f = get();
    const out = f.events;
    f.events = [];
    return out;
  }
  // 戰鬥進行中？（不觸發 start，純查詢 — 供編輯鎖定用）
  function isFighting() { return !!(F && F.phase === "fight"); }
  // v251 滅團戰報：per-member 傷害/治療彙總（start 重置；敗因診斷 — 輸出不足 vs 生存不足）
  function summary() {
    if (!F) return null;
    const totalDmg = F.team.reduce((a, m) => a + ((F.stats[m.id] || {}).dmg || 0), 0) || 1;
    const members = F.team.map(m => {
      const s = F.stats[m.id] || { dmg: 0, heal: 0 };
      return { id: m.id, name: m.name, dmg: s.dmg, heal: s.heal, pct: Math.round(s.dmg / totalDmg * 100) };
    });
    let mvp = null;
    for (const m of members) if (!mvp || m.dmg > mvp.dmg) mvp = m;
    return { t: Math.round(F.t), kills: F.kills || 0, hpLeft: Math.max(0, Math.round(F.hp / F.maxHp * 100)), members, mvp: mvp && mvp.dmg > 0 ? mvp : null };
  }
  return { start, reset, get, step, rates, focusLayers, drainEvents, teamBuild, retreat, recall, syncTeamHp, isFighting, counterMul, counters, summary, // v251 戰報
    stagePowerReq, bestFarmSpot, formationPower }; // v560 引擎端掃描（連敗回退遷移 + 派遣視窗共用單一來源）
})();
