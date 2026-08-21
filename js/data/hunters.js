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
    expNeed: lvl => {
      // v672：lv≥100 附加 1.25^(⌊(lv-100)/20⌋+1) — 與訓練金幣水槽對齊；1–99 不變
      // v716：加深指數軟封頂 min(seg,4) — lv≤160 不變；防 180–200 經驗牆
      let e = 55 * Math.pow(lvl, 1.45);
      if (lvl >= 100) e *= Math.pow(1.25, Math.min(Math.floor((lvl - 100) / 20) + 1, 4));
      return Math.floor(e);
    },
    promoLevels: [10, 25, 50, 100, 150],
    promoCost: (h) => {
      const n = (h.promoted || 0) + 1;
      const mats = { iron: 20 * n, herb: 10 * n + 5 };
      if (n >= 2) mats.leather = 15 * (n - 1);
      if (n >= 3) mats.crystal = 10 * (n - 2);
      if (n >= 4) mats.ember = 10 * (n - 3);
      if (n >= 5) mats.myth = 5 * (n - 4);
      // v660：n≥4 素材 ×1.35^(n-3) — 0-3 階不變；後期突破拉長農料節奏
      // v716：加深指數軟封頂 min(n-3,1) — n≤4 不變；第 5 突破素材牆軟化
      if (n >= 4) {
        const mul = Math.pow(1.35, Math.min(n - 3, 1));
        for (const k in mats) mats[k] = Math.floor(mats[k] * mul);
      }
      // v676：n≥4 金幣 ×1.2^(n-3) — 1–3 階不變；與素材加深對齊金幣水槽
      // v716：加深指數軟封頂 min(n-3,1) — n≤4 不變；第 5 突破金幣牆軟化
      let gold = 500 * Math.pow(5, n);
      if (n >= 4) gold *= Math.pow(1.2, Math.min(n - 3, 1));
      return { gold: Math.floor(gold), mats };
    },
    trainCost: lvl => {
      // v668：lv≥100 附加 1.3^(⌊(lv-100)/20⌋+1) — 1–99 不變；後期訓練金幣水槽
      // v716：加深指數軟封頂 min(seg,4) — lv≤160 不變；防 180–200 訓練牆
      // v736：加深軟封頂 min(seg,3) — lv≤159 不變；防 160–200 訓練牆
      // v744：加深軟封頂 min(seg,2) — lv≤139 不變；防 140–200 訓練牆
      // v752：加深軟封頂 min(seg,1) — lv≤119 不變；防 120–200 訓練牆
      let c = 60 * Math.pow(lvl, 1.85);
      if (lvl >= 100) c *= Math.pow(1.3, Math.min(Math.floor((lvl - 100) / 20) + 1, 1));
      return Math.floor(c);
    },
    trainExp: lvl => {
      // v704：Lv≥100 附加 ×1.2^(floor((lvl-100)/20)+1) — 對齊 trainCost 加深節奏，防後期訓練 ROI 崩
      // v720：加深指數軟封頂 min(seg,4) — 與 trainCost v716 同源；lv≤160 不變
      let e = 40 * Math.pow(lvl, 1.5);
      if (lvl >= 100) e *= Math.pow(1.2, Math.min(Math.floor((lvl - 100) / 20) + 1, 4));
      return Math.floor(e);
    },
    skillAtLevel: [5, 15, 25],
    skillPower: (lvl) => 1 + 0.12 * (lvl - 1),
    recruit: {
      // 金幣招募：成本成長封頂在 n=10（第 10 次後不再翻倍，避免後期名冊形同鎖死）
      // v672：n>10 軟升 ×1.06^min(n-10,20) — n≤10 不變；多周目仍有輕微壓力
      // v724：後期軟升加深軟封頂 min(n-10,12) — n≤22 不變；防超長尾牆
      // v756：加深軟封頂 min(n-10,10) — n≤20 不變；防超長尾牆
      // v764：加深軟封頂 min(n-10,8) — n≤18 不變；防超長尾牆
      gold: { cost: n => Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 8)))), rar: [1, 2, 3], weight: [60, 30, 10], cd: 90 },
      ticket: { cost: n => 1, rar: [2, 3, 4, 5], weight: [45, 30, 20, 5] },
      // v660：神話招募鑽價軟升 300×1.06^min(n,25) — n=0 仍 300
      // v692：n>25 附加 ×1.04^min(n-25,15) — n≤25 不變；超後期輕微壓力
      // v720：後期軟升加深軟封頂 min(n-25,8) — n≤33 不變；防超長尾牆
      // v760：加深軟封頂 min(n-25,6) — n≤31 不變；防超長尾牆
      gem: { cost: n => Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 6)))), rar: [3, 4, 5, 6], weight: [40, 35, 20, 5] }
    },
    promoStats: 0.2, // +20% all stats per promotion
    STAR_NAMES: ["★", "★★", "★★★", "★★★★", "★★★★★", "★★★★★★"],
    /* v157 傳說英雄：固定身份的命名英雄（市場放置英雄的「角色」層）
       神話招募出 ★6 時 25% 機率取代隨機職業 — 專屬被動、名字固定。 */
    LEGENDS: {
      aile:    { name: "艾拉·晨星", cls: "sword",    flavor: "晨曦第一縷光，便是她的劍鋒。",       passive: { name: "晨星之力", desc: "攻擊 +15%", atk: 0.15 } },
      raen:    { name: "雷恩·颶風", cls: "archer",   flavor: "他的箭比風快，風卻追不上他的名字。", passive: { name: "颶風之翼", desc: "攻速 +15%", spd: 0.15 } },
      mona:    { name: "莫娜·灰燼", cls: "mage",     flavor: "灰燼之下，是她未曾熄滅的詠唱。",     passive: { name: "餘燼迴響", desc: "技能威力 +20%", skillDmg: 0.2 } },
      vera:    { name: "薇拉·影刃", cls: "assassin", flavor: "影子記住了她的名字，敵人永遠記不住。", passive: { name: "影襲", desc: "暴擊 +12%", crit: 0.12 } },
      odin:    { name: "奧丁·冰壁", cls: "knight",   flavor: "他的壁壘，是王國最後一道防線。",     passive: { name: "冰壁結界", desc: "防禦 +20%", def: 0.2 } },
      selene:  { name: "瑟琳·聖歌", cls: "priest",   flavor: "聖歌唱起時，傷口與絕望一同癒合。",   passive: { name: "聖歌", desc: "生命 +15%", hp: 0.15 } },
      thorin:  { name: "索林·岩心", cls: "knight",   flavor: "他沉默如山，山從不後退。",           passive: { name: "岩心", desc: "全隊攻擊 +8%", teamAtk: 0.08 } },
      nyx:     { name: "妮克絲·夜幕", cls: "mage",   flavor: "夜幕降臨時，她的魔法才剛剛甦醒。",   passive: { name: "夜幕", desc: "技能威力 +15%・攻擊 +8%", skillDmg: 0.15, atk: 0.08 } }
    },
    /* v210 傳說專屬徽章：每傳說 6 階，個人被動 ×(1+0.03×(階-1)) 滿階 ×1.15、全隊型 ×(1+0.02×(階-1))；
       升級 階n→n+1 需 n+1 片 + 300×2ⁿ 金；碎片來源：重複傳說 ×5／深淵 50+ 層領主 ×1／活動商店週限 1 */
    LEGEND_BADGES: {
      aile:    { name: "晨星徽章", desc: "晨星之力強化" },
      raen:    { name: "颶風徽章", desc: "颶風之翼強化" },
      mona:    { name: "餘燼徽章", desc: "餘燼迴響強化" },
      vera:    { name: "影刃徽章", desc: "影襲強化" },
      odin:    { name: "冰壁徽章", desc: "冰壁結界強化" },
      selene:  { name: "聖歌徽章", desc: "聖歌強化" },
      thorin:  { name: "岩心徽章", desc: "岩心強化（全隊）" },
      nyx:     { name: "夜幕徽章", desc: "夜幕強化" }
    },
    /* v170 傳說羈絆：特定傳說英雄同隊觸發團隊加成（多重羈絆可疊加） */
    LEGEND_BONDS: [
      { id: "dawn_wall", members: ["aile", "odin"], name: "晨曦與壁壘", flavor: "晨光灑在冰牆上，王國的第一道防線永不動搖。", fx: { atk: 0.1, def: 0.1 } },
      { id: "twin_casts", members: ["mona", "nyx"], name: "雙重詠唱", flavor: "灰燼與夜幕交織的咒文，讓黑夜燒成白晝。", fx: { skillDmg: 0.12 } },
      { id: "wind_shadow", members: ["raen", "vera"], name: "風影迅捷", flavor: "風的速度與影的隱密，獵物永遠慢一步。", fx: { spd: 0.1 } },
      { id: "hymn_rock", members: ["selene", "thorin"], name: "聖歌與磐石", flavor: "歌聲撫平傷口，岩石擋下風暴。", fx: { hp: 0.15 } },
      { id: "holy_trio", members: ["aile", "selene", "odin"], name: "光輝三聖", flavor: "聖光的三重奏，驅散一切陰霾。", fx: { atk: 0.15, hp: 0.1 } },
      { id: "night_trio", members: ["mona", "nyx", "vera"], name: "夜幕三傑", flavor: "三位在黑暗中起舞的王者，讓敵人連恐懼都來不及。", fx: { crit: 0.08, skillDmg: 0.08 } }
    ],
    /* v147 升星（放置英雄核心循環）：消耗「同職業當前星級」英雄 + 「任意職業當前星級」肥料，
       稀有度 +1（成長倍率隨 RARITY 表跳升：1.0→1.15→1.35→1.6→1.9→2.3） */
    starUp: {
      max: 6,                    // 最高星級（與 RARITY 表同步）
      copies: [1, 2, 3, 4, 6],   // 升到 (idx+2)★ 需消耗幾名同職業英雄（1★→2★ … 5★→6★）
      fodder: [0, 1, 1, 2, 2]    // 另需幾名任意職業肥料（同星級）
    }
  };
})();
