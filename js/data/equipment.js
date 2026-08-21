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
    wolf: { name: "獵狼套裝", desc: "英雄傳承之裝。", icon: "set_wolf", tier: 3,
      bonus: { 2: "攻擊力 +13%", 4: "暴擊率 +12%" },
      fx: { atk: 0.13 }, fx4: { crit: 0.12 },
      // v215 套裝共鳴：全隊穿戴同套裝件數達 4/8/12 → 全隊加成（分段累計，數值低於單人 fx）
      res: { 4: { atk: 0.04 }, 8: { crit: 0.03 }, 12: { atk: 0.06 } },
      bonusRes: { 4: "全隊攻擊 +4%", 8: "全隊暴擊 +3%", 12: "全隊攻擊 +6%" } },
    lava: { name: "熔岩套裝", desc: "以火山之焰鍛造。", icon: "set_lava", tier: 4,
      bonus: { 2: "攻擊力 +17%", 4: "攻擊速度 +17%" },
      fx: { atk: 0.17 }, fx4: { spd: 0.17 },
      res: { 4: { atk: 0.04 }, 8: { spd: 0.04 }, 12: { atk: 0.07 } },
      bonusRes: { 4: "全隊攻擊 +4%", 8: "全隊攻速 +4%", 12: "全隊攻擊 +7%" } },
    frost: { name: "冰霜套裝", desc: "千年寒冰凝結而成。", icon: "set_frost", tier: 5,
      bonus: { 2: "生命值 +21%", 4: "防禦力 +29%" },
      fx: { hp: 0.21 }, fx4: { def: 0.29 },
      res: { 4: { hp: 0.06 }, 8: { def: 0.06 }, 12: { hp: 0.09 } },
      bonusRes: { 4: "全隊生命 +6%", 8: "全隊防禦 +6%", 12: "全隊生命 +9%" } },
    dragon: { name: "龍鱗套裝", desc: "屠龍者的至寶。", icon: "set_dragon", tier: 8,
      bonus: { 2: "全屬性 +17%", 4: "承受傷害 -17%" },
      fx: { all: 0.17 }, fx4: { mit: 0.17 },
      res: { 4: { all: 0.04 }, 8: { mit: 0.04 }, 12: { all: 0.06 } },
      bonusRes: { 4: "全隊全屬性 +4%", 8: "全隊減傷 -4%", 12: "全隊全屬性 +6%" } },
    wind: { name: "獵風套裝", desc: "疾風之魂織就的輕裝，快如風、準如電。", icon: "set_wind", tier: 6,
      bonus: { 2: "攻擊速度 +10%", 4: "暴擊率 +17%" },
      fx: { spd: 0.10 }, fx4: { crit: 0.17 },
      res: { 4: { spd: 0.04 }, 8: { crit: 0.04 }, 12: { spd: 0.06 } },
      bonusRes: { 4: "全隊攻速 +4%", 8: "全隊暴擊 +4%", 12: "全隊攻速 +6%" } },
    phoenix: { name: "不死鳥套裝", desc: "浴火重生，不死不滅；每一場勝利皆為重生。", icon: "set_phoenix", tier: 9,
      bonus: { 2: "生命值 +17%", 4: "承受傷害 -17% ／ 擊殺回復 +17%" },
      fx: { hp: 0.17 }, fx4: { mit: 0.17 }, healKill: 0.17,
      res: { 4: { hp: 0.05 }, 8: { mit: 0.04 }, 12: { hp: 0.08 } },
      bonusRes: { 4: "全隊生命 +5%", 8: "全隊減傷 -4%", 12: "全隊生命 +8%" } }
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
    } else if (slot === "item") {
      // v138：消耗品正確名稱（防「鐵未知」）
      n = ({ item_pot_hp: "生命藥水", item_pot_mp: "魔力藥水", item_pot_atk: "攻擊靈藥", item_pot_gold: "黃金靈藥", item_pot_exp: "智慧靈藥", item_hourglass: "加速沙漏" })[item.defId] || "消耗品";
    } else {
      // v129 防呆：舊存檔無效 defId/階級時顯示「未知」而非 undefined
      const tm = TIER_MAT[Math.min(TIER_MAT.length - 1, Math.max(0, t - 1))] || "";
      n = tm + (SLOT_NOUN[slot] || "未知");
    }
    if (item.set && MG.data.equipment.sets[item.set]) n = MG.data.equipment.sets[item.set].name.replace("套裝", "·") + n;
    return (RARITY_PRE[item.rarity - 1] || "") + n;
  }
  /* v161 裝備詞綴：★3+ 依稀有度機率附加一條隨機效果（數值隨階級成長） */
  const AFFIXES = {
    lifesteal: { name: "嗜血", desc: "攻擊吸血", base: 0.03, perTier: 0.004, max: 0.08 },
    boss:      { name: "獵手", desc: "對首領傷害", base: 0.08, perTier: 0.01, max: 0.25 },
    critDmg:   { name: "鋒銳", desc: "暴擊傷害", base: 0.10, perTier: 0.015, max: 0.35 },
    thorns:    { name: "荊棘", desc: "反彈傷害", base: 0.06, perTier: 0.008, max: 0.2 },
    guard:     { name: "鐵壁", desc: "受到傷害減少", base: 0.04, perTier: 0.006, max: 0.15 },
    scholar:   { name: "學者", desc: "經驗獲得", base: 0.06, perTier: 0.008, max: 0.2 },
    greedy:    { name: "貪婪", desc: "金幣獲得", base: 0.06, perTier: 0.008, max: 0.2 },
    treasure:  { name: "尋寶", desc: "素材掉落機率", base: 0.05, perTier: 0.008, max: 0.2 }
  };
  return {
    TIER_MAT, SLOT_NOUN, RARITY_PRE, STATS, RARITY_MUL, GEMS, SETS, sets: SETS, SET_COLORS, RECIPES,
    WEAPON_TYPE_NAMES, WEAPON_CLASS, WEAPON_NAMES, TIER_COLORS,
    itemName, slotOf,
    socketChance: (rarity) => rarity >= 5 ? [1, 1, 1] : rarity >= 3 ? [0.35, 0.1, 0] : [0.08, 0, 0],
    enhanceCost: (tier, enhance) => {
      // v644：enhance≥10 附加 1.35^(enhance-9)，加深 +10→+15 金幣水槽；e0-9 不變
      // v708：加深指數軟封頂 min(enhance-9,4) — e≤13 不變；防 +14/+15 牆
      // v728：加深軟封頂 min(enhance-9,3) — e≤12 不變；防 +13..+15 牆
      // v740：加深軟封頂 min(enhance-9,2) — e≤11 不變；防 +12..+15 牆
      let c = Math.pow(1.5, enhance) * 40 * Math.pow(tier, 1.6);
      if (enhance >= 10) c *= Math.pow(1.35, Math.min(enhance - 9, 2));
      return Math.floor(c);
    },
    dismantleMats: (tier, rarity, enhance) => {
      const r = rarity || 1, e = enhance || 0;
      const mul = 1 + (r - 1) * 0.25 + e * 0.1; // 稀有度與強化等級皆計入，分解不虧
      // 全素材金字塔回收：每階裝備可拆出低階素材，後期舊素材不再斷供
      const out = { iron: Math.max(1, Math.round(tier * 2.5 * mul)) };
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
    setItemChance: (tier) => tier >= 8 ? 0.3 : tier >= 5 ? 0.22 : tier >= 4 ? 0.16 : tier >= 3 ? 0.1 : 0,
    /* v161 裝備詞綴 */
    AFFIX_CHANCE: { 3: 0.2, 4: 0.4, 5: 0.6, 6: 0.8 },
    AFFIXES,
    /* v190 詞綴重鑄成本（★3+，金幣＋高階素材 — 與 v185 素材合成互補的終局消耗） */
    REROLL_COST: {
      3: { gold: 2000, mats: { crystal: 2 } },
      4: { gold: 5000, mats: { crystal: 4, ember: 2 } },
      5: { gold: 12000, mats: { ember: 4, void: 2 } },
      6: { gold: 30000, mats: { void: 4, myth: 2 } }
    },
    affixVal: (id, tier) => {
      const a = AFFIXES[id];
      return a ? Math.min(a.max, a.base + a.perTier * (tier - 1)) : 0;
    }
  };
})();
