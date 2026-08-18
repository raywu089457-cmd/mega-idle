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
  // 關卡顯示名稱：第 10 關直接顯示「BOSS 關」
  stageLabel: (n) => n >= 10 ? "BOSS 關" : "第 " + n + " 關",
  // v130 階級顯示：T0 最高級、往下越普通（內部 tier 1-10 不變，顯示反轉）
  tierLabel: (t) => "T" + (10 - t),
  REGION_COUNT: 10,
  RETREAT_MS: 20e3,
  OFFLINE_CAP_H: 12,
  OFFLINE_RATE: 1.2,
  /* v234 在線專注加成：派遣狀態連續在線每滿 1 小時 +5%（封頂 4 層 = +20%）
     v588 以 OFFLINE_RATE 為底（層 0 = ×1.20 與離線即時齊平）+ 每層 +5%（滿層 ×1.40 超越）— 落實 v234「齊平並超越」；
     舊版逐時累層自 1.0 爬、封頂前全程劣於離線即時 1.2×（12h 內倒掛 3.6-17.1%），本版以 OFFLINE_RATE 耦合齊平；
     離線結算排除不變 — 純 buff 線上零 nerf */
  ACTIVE_FOCUS: { perHour: 0.05, max: 4, gapMs: 60e3 },
  /* v174 週末雙倍：星期六/日金幣與經驗掉落 ×1.5（留存節奏） */
  WEEKEND_MULT: 1.5,
  WEEKEND_DAYS: [6, 0], // getDay(): 6=六, 0=日
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
    iron: { name: "鐵礦石", icon: "mat_iron", tier: 1, src: "灰燼洞穴掉落・分解裝備・離線" },
    herb: { name: "藥草", icon: "mat_herb", tier: 1, src: "翠綠草原/幽暗森林・分解・離線" },
    leather: { name: "獸皮", icon: "mat_leather", tier: 1, src: "翠綠草原/灰燼洞穴/冰封高原・分解・離線" },
    crystal: { name: "魔水晶", icon: "mat_crystal", tier: 2, src: "幽暗森林/蒼穹之塔・分解・離線" },
    ember: { name: "餘燼石", icon: "mat_ember", tier: 2, src: "烈焰火山・分解・離線" },
    ice: { name: "寒霜晶", icon: "mat_ice", tier: 2, src: "冰封高原・分解・離線" },
    poison: { name: "毒囊", icon: "mat_poison", tier: 3, src: "黃沙荒漠/詛咒沼澤・分解・離線" },
    void: { name: "虛空碎片", icon: "mat_void", tier: 3, src: "詛咒沼澤/深淵裂谷・分解・離線" },
    myth: { name: "神話殘片", icon: "mat_myth", tier: 3, src: "蒼穹之塔/神話之域・分解・離線" }
  },
  /* v185 素材合成：任 T1×4 → 自選 T2×1；任 T2×4 → 自選 T3×1（金幣手續費維持金幣價值） */
  MAT_SYNTH: { ratio: 4, fee: { 1: 100, 2: 500 } },
  CLASS_WEAPONS: { sword: "sword", archer: "bow", mage: "staff", assassin: "dagger", knight: "greatsword", priest: "mace" },
  /* v149 元素相剋（放置英雄陣營系統）：職業元素 vs 區域元素，克制 +25% 傷害
     循環：火→自然→雷→冰→火；聖↔暗 互相克制 */
  ELEMENTS: {
    fire:    { name: "火", color: "#ff6b4a" },
    ice:     { name: "冰", color: "#7fd4ff" },
    thunder: { name: "雷", color: "#ffe066" },
    nature:  { name: "自然", color: "#7ee787" },
    dark:    { name: "暗", color: "#b18cff" },
    holy:    { name: "聖", color: "#fff3b0" }
  },
  CLASS_ELEMENT: { sword: "holy", archer: "thunder", mage: "fire", assassin: "dark", knight: "ice", priest: "nature" },
  ELEMENT_COUNTER: { fire: "nature", nature: "thunder", thunder: "ice", ice: "fire", holy: "dark", dark: "holy" },
  /* v155 Boss 機制：每個區域首領一種被動機制 */
  BOSS_MECHS: {
    regen:     { name: "再生", icon: "fx_heal",   desc: "生命低於 50% 時每秒回復 0.8% 最大生命" },
    poison:    { name: "劇毒", icon: "fx_poison", desc: "每 4 秒對一名英雄施放持續劇毒（3% 最大生命）" },
    shield:    { name: "護盾", icon: "fx_shield", desc: "開戰前 8 秒受到的傷害減半" },
    lifesteal: { name: "吸血", icon: "fx_dagger", desc: "每次攻擊回復造成傷害的 60% 生命" },
    aoe:       { name: "震怒", icon: "fx_fireball", desc: "每 8 秒對全體英雄造成 60% 傷害" }
  },
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
  /* v167 區域環境粒子：依區域 index 對應精靈與飄動方向（負 vy = 上升） */
  REGION_AMBIENT: [
    { sprite: "fx_leaf", vy: 0.35, sway: true },
    { sprite: "fx_leaf", vy: 0.3, sway: true },
    { sprite: "fx_ember", vy: -0.4 },
    { sprite: "fx_ember", vy: -0.5 },
    { sprite: "fx_snow", vy: 0.4, sway: true },
    { sprite: "fx_sand", vy: 0.1, vx: 0.5 },
    { sprite: "fx_wisp", vy: -0.25 },
    { sprite: "fx_spark", vy: 0.3 },
    { sprite: "fx_wisp", vy: -0.3 },
    { sprite: "fx_star", vy: 0.35, sway: true },
    { sprite: "fx_wisp", vy: -0.35 }
  ],
  // 副本難度：mult = 魔物血量/攻擊倍率（v204 平衡：防禦不隨難度縮放 — 消除防禦雙重懲罰）；
  // gold/exp = 獎勵倍率 = mult（parity — 高難度效率 =1，不再是自我懲罰）；unlockRegion = 解鎖所需抵達區域（0-based）
  DIFFICULTY: [
    { id: "normal",   name: "普通", mult: 1,   gold: 1,   exp: 1,   color: "#7ee787", unlockRegion: 0 },
    { id: "hard",     name: "困難", mult: 1.8, gold: 1.8, exp: 1.8, color: "#4fc3f7", unlockRegion: 2 },
    { id: "hell",     name: "地獄", mult: 3.2, gold: 3.2, exp: 3.2, color: "#f472b6", unlockRegion: 4 },
    { id: "nightmare", name: "夢魘", mult: 5.5, gold: 5.5, exp: 5.5, color: "#ff5c8a", unlockRegion: 6 }
  ],
  // v256 掉落率單一來源（lootInfoBlock/dropInfoOf 共用 — 防 UI 硬編碼漂移）
  DROP_RATES: { eq: 0.075, gem: 0.035, book: 0.015, bossTicket: 0.35, bossBook: 0.2 }
};
