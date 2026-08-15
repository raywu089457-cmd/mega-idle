/* 放置王國 MEGA IDLE — 神器（v158，slice B7 延伸）
   市場放置英雄標準裝備層（AFK Arena 神器）：每位英雄可裝備一件，提供獨特被動。
   來源：商城（鑽石限購一次）＋ 活動商店（限時輪換）。 */
"use strict";
MG.data = MG.data || {};
MG.data.artifacts = (function () {
  // passive 效果型別與傳說英雄共用：atk/def/hp/spd/crit/skillDmg + 專屬 lifesteal/defense/gold
  return {
    dragon_scale:  { name: "龍鱗護符", icon: "icon_necklace", desc: "遠古龍鱗磨成的護符，刀槍難入。",       passive: { name: "龍鱗", desc: "生命 +15%", hp: 0.15 }, price: 500 },
    thunder_hammer:{ name: "雷神之錘", icon: "icon_hammer",   desc: "握柄仍殘留雷霆的餘溫。",               passive: { name: "雷殛", desc: "攻擊 +12%", atk: 0.12 }, price: 450 },
    shadow_boots:  { name: "影舞之靴", icon: "icon_boots",    desc: "穿上它，連影子都追不上你。",           passive: { name: "疾影", desc: "攻速 +15%", spd: 0.15 }, price: 450 },
    frost_heart:   { name: "冰霜之心", icon: "icon_charm",    desc: "寒冰凝成的心臟，仍在為主人跳動。",     passive: { name: "霜甲", desc: "開戰前 6 秒受到的傷害減半", defense: 6 }, price: 500 },
    blood_fang:    { name: "嗜血獠牙", icon: "icon_dagger",   desc: "野獸的獠牙，飲過的血比它見過的人多。", passive: { name: "嗜血", desc: "攻擊時回復造成傷害的 8% 生命", lifesteal: 0.08 }, price: 500 },
    sage_eye:      { name: "賢者之瞳", icon: "icon_staff",    desc: "凝視過去的瞳孔，看見未來的破綻。",     passive: { name: "洞悉", desc: "技能威力 +15%", skillDmg: 0.15 }, price: 400 },
    greed_pouch:   { name: "貪婪錢袋", icon: "icon_goldbag",  desc: "它永遠在低語：再多一點。",             passive: { name: "貪婪", desc: "金幣掉落 +20%", gold: 0.2 }, price: 300 },
    holy_emblem:   { name: "聖光徽記", icon: "icon_ach",      desc: "諸神遺落的徽章，仍散發微光。",         passive: { name: "聖輝", desc: "暴擊 +10%", crit: 0.1 }, price: 400 },
    // v215 深淵限定神器（深淵商店兌換 — 第二條取得管道；數值略低於商城版，免費取得）
    abyss_eye:     { name: "深淵之瞳", icon: "icon_staff",    desc: "深淵注視之下，萬物皆可吞噬。",         passive: { name: "深淵注視", desc: "攻擊時回復造成傷害的 5% 生命", lifesteal: 0.05 } },
    void_walker:   { name: "虛空行者", icon: "icon_boots",    desc: "行走於虛空之間，時間為之讓路。",       passive: { name: "虛空疾行", desc: "攻速 +10%", spd: 0.1 } },
    abyss_heart:   { name: "深淵之心", icon: "icon_charm",    desc: "深淵的心臟仍在跳動，渴望回歸。",       passive: { name: "深淵脈動", desc: "暴擊 +8%", crit: 0.08 } }
  };
})();
