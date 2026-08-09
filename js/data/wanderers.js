/* 放置王國 MEGA IDLE — 流浪英雄資料（設計源：mega-idle-web-three.js 流浪獵人機制，依本遊戲職業/經濟校準）
   三階型態：tier1 見習 / tier2 老練 / tier3 英雄。公會等級越高，高階流浪者出現率越高。 */
"use strict";
MG.data = MG.data || {};
MG.data.wanderers = (function () {
  const T = [
    { id: "w_sword_1", cls: "sword", name: "見習劍士", tier: 1, level: 1, dropGold: 20, matChance: 0.1 },
    { id: "w_sword_2", cls: "sword", name: "老練劍士", tier: 2, level: 5, dropGold: 50, matChance: 0.15 },
    { id: "w_sword_3", cls: "sword", name: "戰爭英雄", tier: 3, level: 12, dropGold: 120, matChance: 0.22 },
    { id: "w_mage_1", cls: "mage", name: "流浪法師", tier: 1, level: 2, dropGold: 25, matChance: 0.12 },
    { id: "w_mage_2", cls: "mage", name: "禁書術士", tier: 2, level: 7, dropGold: 60, matChance: 0.18 },
    { id: "w_mage_3", cls: "mage", name: "虛空召喚師", tier: 3, level: 15, dropGold: 180, matChance: 0.3 },
    { id: "w_assassin_1", cls: "assassin", name: "巷弄刺客", tier: 1, level: 1, dropGold: 15, matChance: 0.08 },
    { id: "w_assassin_2", cls: "assassin", name: "無聲獵手", tier: 2, level: 8, dropGold: 70, matChance: 0.2 },
    { id: "w_assassin_3", cls: "assassin", name: "暗影行者", tier: 3, level: 14, dropGold: 150, matChance: 0.28 },
    { id: "w_archer_1", cls: "archer", name: "遊蕩弓手", tier: 1, level: 3, dropGold: 35, matChance: 0.12 },
    { id: "w_archer_2", cls: "archer", name: "鷹眼神射", tier: 2, level: 6, dropGold: 55, matChance: 0.17 },
    { id: "w_archer_3", cls: "archer", name: "破曉神射手", tier: 3, level: 13, dropGold: 140, matChance: 0.26 },
    { id: "w_priest_1", cls: "priest", name: "旅行牧師", tier: 1, level: 2, dropGold: 22, matChance: 0.14 },
    { id: "w_priest_2", cls: "priest", name: "聖印祭司", tier: 2, level: 7, dropGold: 58, matChance: 0.2 },
    { id: "w_priest_3", cls: "priest", name: "大主教代行", tier: 3, level: 16, dropGold: 200, matChance: 0.32 },
    { id: "w_knight_1", cls: "knight", name: "巡遊騎士", tier: 1, level: 4, dropGold: 45, matChance: 0.12 },
    { id: "w_knight_2", cls: "knight", name: "鐵壁騎士", tier: 2, level: 9, dropGold: 90, matChance: 0.18 },
    { id: "w_knight_3", cls: "knight", name: "聖殿騎士", tier: 3, level: 15, dropGold: 165, matChance: 0.26 }
  ];
  /* 原創氣泡台詞池（依需求分類） */
  const BUBBLES = {
    enter: ["這裡就是傳說中的梅根王國嗎？", "好累……有地方歇腳嗎？", "聽說這裡的酒館很了不起。"],
    rest: ["呼……休息一下。", "這張椅子不錯。", "風真舒服。"],
    eat: ["肚子餓了……想吃點熱的。", "有賣吃的嗎？我出得起錢！", "聞到香味了！"],
    drink: ["口好渴……來杯飲料吧。", "有沒有清涼的泉水？"],
    shop: ["想找把趁手的武器……", "這家店的貨色不錯。", "老闆，有好東西嗎？"],
    hunt: ["閒著也是閒著，去獵場轉轉。", "手癢了，出去打幾隻魔物！", "附近的魔物該清一清了。"],
    leave: ["這村子真無聊……", "該繼續上路了。", "再會了，各位獵人。"],
    happy: ["這村子真不錯！", "餐點讚！", "下次還想再來！"],
    recruit: ["帶上我吧，我會證明自己的價值！", "願意收留我嗎？", "我的劍願意為梅根而戰！"]
  };
  function bubble(kind) {
    const pool = BUBBLES[kind] || BUBBLES.enter;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return { TYPES: T, bubble, MAX_WANDERERS: (guildLv) => 3 + guildLv * 2 };
})();
