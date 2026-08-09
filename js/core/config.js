/* 放置王國 MEGA IDLE — global config & constants */
"use strict";
window.MG = window.MG || {};
MG.config = {
  SAVE_KEY: "megaidle_save_v1",
  SAVE_INTERVAL: 30e3,
  AUTOSAVE: true,
  VERSION: "1.0.0",
  MAX_HUNTERS: 40,
  MAX_FORMATION: 5,
  MAX_ITEM_LVL: 15,
  MAX_STAGE_PER_REGION: 10,
  REGION_COUNT: 10,
  RETREAT_MS: 20e3,
  OFFLINE_CAP_H: 12,
  OFFLINE_RATE: 1.2,
  TICK_UI_MS: 500,
  RARITY: [
    { id: 1, name: "普通", color: "#c8c8d8", grow: 1.0,  stars: 1 },
    { id: 2, name: "高級", color: "#4fc3f7", grow: 1.15, stars: 2 },
    { id: 3, name: "稀有", color: "#a78bfa", grow: 1.35, stars: 3 },
    { id: 4, name: "史詩", color: "#f472b6", grow: 1.6,  stars: 4 },
    { id: 5, name: "傳說", color: "#ff9f43", grow: 1.9,  stars: 5 },
    { id: 6, name: "神話", color: "#ff5c8a", grow: 2.3,  stars: 6 }
  ],
  SLOTS: ["weapon", "helmet", "armor", "boots", "necklace", "ring", "charm"],
  SLOT_NAMES: { weapon: "武器", helmet: "頭盔", armor: "鎧甲", boots: "靴子", necklace: "項鍊", ring: "戒指", charm: "護符" },
  MATS: {
    iron: { name: "鐵礦石", icon: "mat_iron", tier: 1 },
    herb: { name: "藥草", icon: "mat_herb", tier: 1 },
    leather: { name: "獸皮", icon: "mat_leather", tier: 1 },
    crystal: { name: "魔水晶", icon: "mat_crystal", tier: 2 },
    ember: { name: "餘燼石", icon: "mat_ember", tier: 2 },
    ice: { name: "寒霜晶", icon: "mat_ice", tier: 2 },
    poison: { name: "毒囊", icon: "mat_poison", tier: 3 },
    void: { name: "虛空碎片", icon: "mat_void", tier: 3 },
    myth: { name: "神話殘片", icon: "mat_myth", tier: 3 }
  },
  CLASS_WEAPONS: { sword: "sword", archer: "bow", mage: "staff", assassin: "dagger", knight: "greatsword", priest: "mace" },
  BUFF_NAMES: { atk: "攻擊靈藥", gold: "黃金靈藥", exp: "智慧靈藥" },
  REGION_THEME: [
    { sky1: "#5ec8e5", sky2: "#2a6f9c", ground: "#4c8a3f", accent: "#ffe08a" },
    { sky1: "#3f8f5f", sky2: "#1d4a3a", ground: "#35502c", accent: "#9adf7a" },
    { sky1: "#4a4a5e", sky2: "#232330", ground: "#3c3c3c", accent: "#ff9a4d" },
    { sky1: "#7a2f2f", sky2: "#331111", ground: "#4a2a1a", accent: "#ffb35c" },
    { sky1: "#9fd8e8", sky2: "#4a7a9a", ground: "#dfeef5", accent: "#7ec8e8" },
    { sky1: "#e8b45c", sky2: "#8a5a1a", ground: "#c89a4a", accent: "#ffe8b0" },
    { sky1: "#3f5f3f", sky2: "#1a2f1a", ground: "#2f4a2a", accent: "#9aff8a" },
    { sky1: "#2a2a4a", sky2: "#10101f", ground: "#3a3560", accent: "#b08aff" },
    { sky1: "#3a1a3a", sky2: "#100a12", ground: "#2a1226", accent: "#ff5c8a" },
    { sky1: "#ffe8c0", sky2: "#ffb35c", ground: "#e8d0a0", accent: "#ffffff" }
  ],
  // 副本難度：mult = 魔物三圍倍率；gold/exp = 獎勵倍率；unlockRegion = 解鎖所需抵達區域（0-based）
  DIFFICULTY: [
    { id: "normal",   name: "普通", mult: 1,   gold: 1,   exp: 1,   color: "#7ee787", unlockRegion: 0 },
    { id: "hard",     name: "困難", mult: 1.8, gold: 1.6, exp: 1.5, color: "#4fc3f7", unlockRegion: 2 },
    { id: "hell",     name: "地獄", mult: 3.2, gold: 2.4, exp: 2.2, color: "#f472b6", unlockRegion: 4 },
    { id: "nightmare", name: "夢魘", mult: 5.5, gold: 3.4, exp: 3,   color: "#ff5c8a", unlockRegion: 6 }
  ]
};
