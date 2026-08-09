/* 放置王國 MEGA IDLE — equipment templates, sets, gems, recipes (slice B2: extend freely, keep format) */
"use strict";
MG.data = MG.data || {};
MG.data.equipment = (function () {
  const TIER_MAT = ["鐵", "鋼鐵", "精鋼", "符文", "秘銀", "龍骨", "星隕", "虛空", "神裁", "創世"];
  const SLOT_NOUN = { weapon: "劍刃", helmet: "護盔", armor: "戰甲", boots: "戰靴", necklace: "項墜", ring: "指環", charm: "護符" };
  const RARITY_PRE = ["", "堅固的", "鋒利的", "附魔的", "傳說的", "神話的"];
  // 武器類型：與 MG.config.CLASS_WEAPONS 的職階對應（sword/bow/staff/dagger/greatsword/mace）
  const WEAPON_TYPE_NAMES = { sword: "劍", bow: "弓", staff: "杖", dagger: "匕首", greatsword: "大劍", mace: "錘" };
  const WEAPON_CLASS = { sword: "劍士", bow: "弓手", staff: "法師", dagger: "刺客", greatsword: "騎士", mace: "牧師" };
  // 每階 × 每類武器的獨立命名（T1..T10）
  const WEAPON_NAMES = [
    { sword: "鐵劍", bow: "短弓", staff: "學徒杖", dagger: "鐵匕首", greatsword: "闊刃大劍", mace: "鐵錘" },
    { sword: "鋼鐵長劍", bow: "獵風弓", staff: "鋼鐵法杖", dagger: "淬毒匕首", greatsword: "鋼鐵大劍", mace: "鋼鐵戰錘" },
    { sword: "精鋼劍", bow: "追獵長弓", staff: "秘紋法杖", dagger: "精鋼匕首", greatsword: "衛戍大劍", mace: "碎骨戰錘" },
    { sword: "符文劍", bow: "符文長弓", staff: "星火法杖", dagger: "符文匕首", greatsword: "符文大劍", mace: "符文戰錘" },
    { sword: "秘銀劍", bow: "秘銀長弓", staff: "月詠法杖", dagger: "秘銀匕首", greatsword: "秘銀大劍", mace: "秘銀戰錘" },
    { sword: "龍骨劍", bow: "龍骨長弓", staff: "龍息法杖", dagger: "龍牙匕首", greatsword: "龍骸大劍", mace: "龍首戰錘" },
    { sword: "星隕劍", bow: "星隕長弓", staff: "彗星法杖", dagger: "星隕匕首", greatsword: "星隕大劍", mace: "隕星戰錘" },
    { sword: "虛空劍", bow: "虛空長弓", staff: "虛無法杖", dagger: "虛空匕首", greatsword: "虛空大劍", mace: "虛空戰錘" },
    { sword: "神裁劍", bow: "神裁長弓", staff: "天譴法杖", dagger: "神裁匕首", greatsword: "神裁大劍", mace: "神裁戰錘" },
    { sword: "創世劍", bow: "創世長弓", staff: "起源法杖", dagger: "創世匕首", greatsword: "創世大劍", mace: "創世戰錘" }
  ];
  // 階級邊框色：T1-T3 凡鐵、T4-T6 秘法、T7-T10 星神
  const TIER_COLORS = ["#8b93a7", "#aeb6c4", "#cdd3de", "#5cc8ff", "#b39ddb", "#f48fb1", "#4dd0e1", "#9575cd", "#ffd54f", "#ff7eb3"];
  // per-slot base stat curves by tier (t 1..10)
  const STATS = {
    weapon:   { atk: t => Math.round(6 * Math.pow(t, 1.45)), def: 0, hp: 0, crit: 0 },
    helmet:   { atk: 0, def: t => Math.round(4 * Math.pow(t, 1.4)), hp: t => Math.round(14 * Math.pow(t, 1.3)), crit: 0 },
    armor:    { atk: 0, def: t => Math.round(5 * Math.pow(t, 1.4)), hp: t => Math.round(22 * Math.pow(t, 1.3)), crit: 0 },
    boots:    { atk: 0, def: t => Math.round(3 * Math.pow(t, 1.4)), hp: t => Math.round(18 * Math.pow(t, 1.3)), crit: 0 },
    necklace: { atk: t => Math.round(3 * Math.pow(t, 1.4)), def: t => Math.round(2 * Math.pow(t, 1.35)), hp: t => Math.round(16 * Math.pow(t, 1.3)), crit: 0 },
    ring:     { atk: t => Math.round(3 * Math.pow(t, 1.35)), def: 0, hp: 0, crit: t => Math.round(0.8 + 0.7 * t) / 100 },
    charm:    { atk: t => Math.round(2 * Math.pow(t, 1.35)), def: t => Math.round(2 * Math.pow(t, 1.35)), hp: t => Math.round(12 * Math.pow(t, 1.3)), crit: t => Math.round(0.6 + 0.5 * t) / 100 }
  };
  const RARITY_MUL = [1, 1.25, 1.5, 2, 2.5, 3.2];
  const GEMS = {
    ruby: { name: "紅寶石", icon: "gem_ruby", stat: "atk", val: t => Math.round(8 * t * 1.3), desc: "攻擊力" },
    sapphire: { name: "藍寶石", icon: "gem_sapphire", stat: "def", val: t => Math.round(7 * t * 1.3), desc: "防禦力" },
    emerald: { name: "綠寶石", icon: "gem_emerald", stat: "hp", val: t => Math.round(45 * t * 1.3), desc: "生命值" },
    topaz: { name: "黃寶石", icon: "gem_topaz", stat: "crit", val: t => Math.round(1 + t * 0.9) / 100, desc: "暴擊率" }
  };
  const SETS = {
    wolf: { name: "獵狼套裝", desc: "獵人傳承之裝。", icon: "set_wolf", tier: 3,
      bonus: { 2: "攻擊力 +15%", 4: "暴擊率 +10%" },
      fx: { atk: 0.15 }, fx4: { crit: 0.10 } },
    lava: { name: "熔岩套裝", desc: "以火山之焰鍛造。", icon: "set_lava", tier: 4,
      bonus: { 2: "攻擊力 +20%", 4: "攻擊速度 +15%" },
      fx: { atk: 0.20 }, fx4: { spd: 0.15 } },
    frost: { name: "冰霜套裝", desc: "千年寒冰凝結而成。", icon: "set_frost", tier: 5,
      bonus: { 2: "生命值 +25%", 4: "防禦力 +25%" },
      fx: { hp: 0.25 }, fx4: { def: 0.25 } },
    dragon: { name: "龍鱗套裝", desc: "屠龍者的至寶。", icon: "set_dragon", tier: 8,
      bonus: { 2: "全屬性 +20%", 4: "承受傷害 -15%" },
      fx: { all: 0.20 }, fx4: { mit: 0.15 } },
    wind: { name: "獵風套裝", desc: "疾風之魂織就的輕裝，快如風、準如電。", icon: "set_wind", tier: 6,
      bonus: { 2: "攻擊速度 +12%", 4: "暴擊率 +15%" },
      fx: { spd: 0.12 }, fx4: { crit: 0.15 } },
    phoenix: { name: "不死鳥套裝", desc: "浴火重生，不死不滅；每一場勝利皆為重生。", icon: "set_phoenix", tier: 9,
      bonus: { 2: "生命值 +20%", 4: "承受傷害 -15% ／ 擊殺回復 +15%" },
      fx: { hp: 0.20 }, fx4: { mit: 0.15 }, healKill: 0.15 }
  };
  const SET_COLORS = { wolf: "#9aa5b1", lava: "#ff8a3a", frost: "#7ec8e8", dragon: "#8ac86a", wind: "#5ee8c8", phoenix: "#ffb35c" };
  const RECIPES = [
    { id: "r_t2_sword", name: "鋼鐵劍刃", tier: 2, slot: "weapon", wtype: "sword", minRar: 2, unlockTier: 1, cost: { gold: 800, mats: { iron: 25 } } },
    { id: "r_t2_armor", name: "鋼鐵戰甲", tier: 2, slot: "armor", minRar: 2, unlockTier: 1, cost: { gold: 700, mats: { iron: 20, leather: 15 } } },
    { id: "r_t3_helmet", name: "精鋼護盔", tier: 3, slot: "helmet", minRar: 2, unlockTier: 2, cost: { gold: 2500, mats: { iron: 45, crystal: 10 } } },
    { id: "r_t3_boots", name: "精鋼戰靴", tier: 3, slot: "boots", minRar: 2, unlockTier: 2, cost: { gold: 2200, mats: { leather: 40, iron: 20 } } },
    { id: "r_t4_weapon", name: "符文劍刃", tier: 4, slot: "weapon", wtype: "sword", minRar: 3, unlockTier: 3, cost: { gold: 9000, mats: { crystal: 35, iron: 30 } } },
    { id: "r_t4_ring", name: "符文指環", tier: 4, slot: "ring", minRar: 3, unlockTier: 3, cost: { gold: 6000, mats: { crystal: 25, ember: 10 } } },
    { id: "r_t5_armor", name: "秘銀戰甲", tier: 5, slot: "armor", minRar: 3, unlockTier: 4, cost: { gold: 26000, mats: { crystal: 50, ice: 25 } } },
    { id: "r_t5_necklace", name: "秘銀項墜", tier: 5, slot: "necklace", minRar: 3, unlockTier: 4, cost: { gold: 20000, mats: { crystal: 40, ember: 20 } } },
    { id: "r_t6_weapon", name: "龍骨劍刃", tier: 6, slot: "weapon", wtype: "sword", minRar: 4, unlockTier: 5, cost: { gold: 80000, mats: { ember: 60, ice: 40, crystal: 30 } } },
    { id: "r_t7_armor", name: "星隕戰甲", tier: 7, slot: "armor", minRar: 4, unlockTier: 6, cost: { gold: 240000, mats: { ice: 80, poison: 40, crystal: 60 } } },
    { id: "r_t8_charm", name: "虛空護符", tier: 8, slot: "charm", minRar: 4, unlockTier: 7, cost: { gold: 700000, mats: { void: 70, crystal: 80 } } },
    { id: "r_t9_weapon", name: "神裁劍刃", tier: 9, slot: "weapon", wtype: "sword", minRar: 5, unlockTier: 8, cost: { gold: 2000000, mats: { void: 100, myth: 30 } } },
    { id: "r_t10_armor", name: "創世戰甲", tier: 10, slot: "armor", minRar: 5, unlockTier: 9, cost: { gold: 6000000, mats: { myth: 80, void: 120 } } }
  ];
  function slotOf(item) { return item.defId.split("_")[0]; }
  function itemName(item) {
    const t = item.tier, slot = slotOf(item);
    let n;
    if (slot === "weapon") {
      const row = WEAPON_NAMES[Math.min(WEAPON_NAMES.length - 1, Math.max(0, t - 1))];
      n = row[item.wtype] || row.sword; // 舊檔無 wtype 時以劍類為準
    } else {
      n = TIER_MAT[t - 1] + SLOT_NOUN[slot];
    }
    if (item.set) n = MG.data.equipment.sets[item.set].name.replace("套裝", "·") + n;
    return RARITY_PRE[item.rarity - 1] + n;
  }
  return {
    TIER_MAT, SLOT_NOUN, RARITY_PRE, STATS, RARITY_MUL, GEMS, SETS, sets: SETS, SET_COLORS, RECIPES,
    WEAPON_TYPE_NAMES, WEAPON_CLASS, WEAPON_NAMES, TIER_COLORS,
    itemName, slotOf,
    socketChance: (rarity) => rarity >= 5 ? [1, 1, 1] : rarity >= 3 ? [0.35, 0.1, 0] : [0.08, 0, 0],
    enhanceCost: (tier, enhance) => Math.floor(Math.pow(1.5, enhance) * 40 * Math.pow(tier, 1.6)),
    dismantleMats: (tier, rarity, enhance) => {
      const r = rarity || 1, e = enhance || 0;
      const mul = 1 + (r - 1) * 0.25 + e * 0.1; // 稀有度與強化等級皆計入，分解不虧
      // 全素材金字塔回收：每階裝備可拆出低階素材，後期舊素材不再斷供
      const out = { iron: Math.max(1, Math.round(tier * 2 * mul)) };
      if (tier >= 2) out.herb = Math.max(1, Math.round(tier * 1.2 * mul));
      if (tier >= 3) out.leather = Math.max(1, Math.round((tier - 1) * mul));
      if (tier >= 4) out.crystal = Math.max(1, Math.round((tier - 2) * 2 * mul));
      if (tier >= 5) out.ember = Math.max(1, Math.round((tier - 4) * mul));
      if (tier >= 6) out.ice = Math.max(1, Math.round((tier - 5) * mul));
      if (tier >= 7) out.poison = Math.max(1, Math.round((tier - 6) * mul));
      if (tier >= 8) out.void = Math.max(1, Math.round((tier - 7) * 2 * mul));
      if (tier >= 9) out.myth = Math.max(1, Math.round((tier - 8) * 3 * mul));
      return out;
    },
    setItemChance: (tier) => tier >= 8 ? 0.3 : tier >= 5 ? 0.22 : tier >= 4 ? 0.16 : tier >= 3 ? 0.1 : 0
  };
})();
