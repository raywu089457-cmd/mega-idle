/* 放置王國 MEGA IDLE — hunter classes, skills, growth data (slice B1: extend freely) */
"use strict";
MG.data = MG.data || {};
MG.data.hunters = (function () {
  const C = {
    sword: {
      name: "劍士", icon: "h_sword", color: "#9fb4ff",
      desc: "攻守均衡的劍術大師，公會最可靠的前線夥伴。",
      flavor: "劍鋒所指，即為吾王疆土。",
      base: { atk: 12, def: 7, hp: 90, spd: 1.05, crit: 0.05, mp: 45 },
      grow: { atk: 3.2, def: 1.9, hp: 16, spd: 0, crit: 0.001, mp: 3 },
      weapon: "sword", skills: ["power", "combo", "sword_guard"]
    },
    archer: {
      name: "弓手", icon: "h_archer", color: "#7ee787",
      desc: "迅捷的遠程英雄，箭雨之下，魔物無處可逃。",
      flavor: "風是他的眼睛，箭是他的語言。",
      base: { atk: 11, def: 4, hp: 70, spd: 1.5, crit: 0.12, mp: 40 },
      grow: { atk: 3.0, def: 1.1, hp: 11, spd: 0, crit: 0.0014, mp: 2.8 },
      weapon: "bow", skills: ["pierce", "volley", "frost_arrow"]
    },
    mage: {
      name: "法師", icon: "h_mage", color: "#c792ea",
      desc: "毀滅性的奧術施放者，脆弱的護甲換來焚天之力。",
      flavor: "書頁翻動之處，即是毀滅降臨之地。",
      base: { atk: 18, def: 2, hp: 52, spd: 0.7, crit: 0.08, mp: 75 },
      grow: { atk: 4.6, def: 0.6, hp: 8, spd: 0, crit: 0.001, mp: 5.2 },
      weapon: "staff", skills: ["fireball", "chain", "frostnova"]
    },
    assassin: {
      name: "刺客", icon: "h_assassin", color: "#ff6b9d",
      desc: "影子中的死神，出手即為致命一擊。",
      flavor: "黑暗之中，無人見過他的面容。",
      base: { atk: 15, def: 3, hp: 60, spd: 1.35, crit: 0.24, mp: 45 },
      grow: { atk: 3.8, def: 0.8, hp: 9, spd: 0, crit: 0.0018, mp: 3 },
      weapon: "dagger", skills: ["backstab", "bladespin", "poison"]
    },
    knight: {
      name: "騎士", icon: "h_knight", color: "#ffd166",
      desc: "鋼鐵壁壘，為身後的所有夥伴擋下一切。",
      flavor: "鎧甲之下，是永不退縮的誓言。",
      base: { atk: 9, def: 11, hp: 130, spd: 0.8, crit: 0.04, mp: 35 },
      grow: { atk: 2.5, def: 2.7, hp: 21, spd: 0, crit: 0, mp: 2.4 },
      weapon: "greatsword", skills: ["holy", "sweep", "taunt"]
    },
    priest: {
      name: "牧師", icon: "h_priest", color: "#fff3b0",
      desc: "聖光眷顧之人，治癒與制裁並存於雙掌之間。",
      flavor: "聖光從不拋棄虔誠之人。",
      base: { atk: 12, def: 6, hp: 82, spd: 0.95, crit: 0.06, mp: 65 },
      grow: { atk: 3.0, def: 1.4, hp: 14, spd: 0, crit: 0.001, mp: 4.6 },
      weapon: "mace", skills: ["judgment", "holylight", "heal"]
    }
  };
  // 每職業 3 技能：單體爆發 (hit) + 多段連擊 (multi) + 輔助 (buff/heal/taunt/cc/dot)
  const SKILLS = {
    /* 劍士 */
    power:      { name: "蓄力猛擊", desc: "凝聚全力的一擊，造成 320% 傷害。",        type: "hit",   power: 3.2, cd: 10, icon: "fx_slash", mp: 20 },
    combo:      { name: "連斬",   desc: "連續斬擊 3 次，每次造成 110% 傷害。",      type: "multi", hits: 3, power: 1.1, cd: 7,  icon: "fx_slash", mp: 25 },
    sword_guard:{ name: "禦劍架式", desc: "以劍格擋，6 秒內受到的傷害減半。",        type: "buff",  power: 0.5, dur: 6, cd: 14, icon: "fx_shield", mp: 30 },
    /* 弓手 */
    pierce:     { name: "貫穿箭", desc: "貫穿敵人的一箭，造成 250% 傷害。",          type: "hit",   power: 2.5, cd: 9,  icon: "fx_arrow", mp: 18 },
    volley:     { name: "三連箭", desc: "快速射出 3 支箭，每支 120% 傷害。",        type: "multi", hits: 3, power: 1.2, cd: 6,  icon: "fx_arrow", mp: 22 },
    frost_arrow:{ name: "寒霜凍矢", desc: "140% 傷害並以寒氣凍結敵人 2.5 秒。",      type: "hit",   power: 1.4, cd: 11, icon: "fx_ice", freeze: 2.5, mp: 26 },
    /* 法師 */
    fireball:   { name: "火球術", desc: "投擲爆裂火球，造成 300% 傷害並灼燒 3 秒。", type: "hit",   power: 3.0, cd: 9,  icon: "fx_fireball", dot: 3, mp: 25 },
    chain:      { name: "連鎖閃電", desc: "雷光連鎖彈射 4 次，每次 105% 傷害。",     type: "multi", hits: 4, power: 1.05, cd: 12, icon: "fx_spark", mp: 30 },
    frostnova:  { name: "冰霜新星", desc: "寒霜炸裂，造成 180% 傷害並凍結敵人 3 秒。", type: "hit", power: 1.8, cd: 13, icon: "fx_ice", freeze: 3, mp: 28 },
    /* 刺客 */
    backstab:   { name: "致命背刺", desc: "繞至背後，420% 傷害且必定暴擊。",        type: "hit",   power: 4.2, cd: 10, icon: "fx_dagger", crit: true, mp: 24 },
    bladespin:  { name: "刀扇",   desc: "擲出迴旋刀刃 5 次，每次 90% 傷害。",       type: "multi", hits: 5, power: 0.9, cd: 12, icon: "fx_dagger", mp: 26 },
    poison:     { name: "淬毒之刃", desc: "180% 傷害並使敵人中毒 4 秒。",           type: "hit",   power: 1.8, cd: 8,  icon: "fx_poison", dot: 4, mp: 22 },
    /* 騎士 */
    holy:       { name: "聖光斬擊", desc: "260% 傷害並恢復自身 30% 生命。",          type: "hit",   power: 2.6, cd: 9,  icon: "fx_heal", heal: 0.3, mp: 22 },
    sweep:      { name: "橫掃千軍", desc: "大劍橫掃 3 次，每次 125% 傷害。",         type: "multi", hits: 3, power: 1.25, cd: 11, icon: "fx_slash", mp: 26 },
    taunt:      { name: "嘲諷",   desc: "強行吸引敵人攻擊 6 秒。",                  type: "taunt", dur: 6, cd: 12, icon: "fx_shield", mp: 25 },
    /* 牧師 */
    judgment:   { name: "聖裁",   desc: "降下聖裁之光，造成 320% 傷害。",           type: "hit",   power: 3.2, cd: 10, icon: "fx_heal", mp: 25 },
    holylight:  { name: "聖光連擊", desc: "聖光連擊 4 次，每次 85% 傷害。",          type: "multi", hits: 4, power: 0.85, cd: 11, icon: "fx_heal", mp: 28 },
    heal:       { name: "群體治療", desc: "聖光湧動，恢復全隊 35% 生命。",           type: "heal",  power: 0.35, cd: 12, icon: "fx_heal", mp: 30 }
  };
  return {
    classes: C,
    skills: SKILLS,
    expNeed: lvl => Math.floor(55 * Math.pow(lvl, 1.45)),
    promoLevels: [10, 25, 50, 100, 150],
    promoCost: (h) => {
      const n = (h.promoted || 0) + 1;
      const mats = { iron: 20 * n, herb: 10 * n + 5 };
      if (n >= 2) mats.leather = 15 * (n - 1);
      if (n >= 3) mats.crystal = 10 * (n - 2);
      if (n >= 4) mats.ember = 10 * (n - 3);
      if (n >= 5) mats.myth = 5 * (n - 4);
      return { gold: Math.floor(500 * Math.pow(5, n)), mats };
    },
    trainCost: lvl => Math.floor(60 * Math.pow(lvl, 1.85)),
    trainExp: lvl => Math.floor(40 * Math.pow(lvl, 1.5)),
    skillAtLevel: [5, 15, 25],
    skillPower: (lvl) => 1 + 0.12 * (lvl - 1),
    recruit: {
      // 金幣招募：成本成長封頂在 n=10（第 10 次後不再翻倍，避免後期名冊形同鎖死）
      gold: { cost: n => Math.floor(150 * Math.pow(2.1, Math.min(n, 10))), rar: [1, 2, 3], weight: [60, 30, 10], cd: 90 },
      ticket: { cost: n => 1, rar: [2, 3, 4, 5], weight: [45, 30, 20, 5] },
      gem: { cost: n => 300, rar: [3, 4, 5, 6], weight: [40, 35, 20, 5] }
    },
    promoStats: 0.2, // +20% all stats per promotion
    STAR_NAMES: ["★", "★★", "★★★", "★★★★", "★★★★★", "★★★★★★"]
  };
})();
