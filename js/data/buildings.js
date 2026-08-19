/* 放置王國 MEGA IDLE — kingdom buildings (slice B4 owns, extend freely, keep format)
 *
 * Cost curve (v624 re-verified, lvl 1–12 unchanged; lvl 13+ ×1.20/級,指數段封頂 30 級,之後線性尾):
 *   gold = base × mul^min(l-1, 11) × 1.2^min(max(0, l-12), 30) × (1 + 0.3×max(0, l-42)), mul ∈ {2.1, 2.12, 2.15, 2.16, 2.18, 2.2, 2.3}
 *   mats = linear × lvl.
 *   Early game does NOT stall: castle 1→5 = 3,354 金幣 ≈ 5–10 分鐘的 1 區自動出戰，
 *   累計王國經驗 88 ≥ 80，剛好於王城 Lv5 時觸發王國 Lv2（訓練場／鐵匠鋪／倉庫解鎖）。
 *   Lv13 起每級成長率 ×1.20（v553 為 ×1.35；Lv13-20 段兩版皆遠低於舊式 ×2.1-2.3 無阻尼）
 *   — 等級 ≤12 與 v553 前原曲線逐位元一致（前期節奏零變動）。v553 實測：舊曲線無阻尼，
 *   kl28 玩家單次升級需 130–660 小時收入；v624 再實測：×1.35 段在 Lv25+ 複利 ×222，
 *   altar Lv30 單級 33.6 天、castle Lv60 深尾 10046 天，階梯二次凍結 → 改 ×1.20＋封頂＋線性尾，
 *   單級回落到「小時級（主線建築）～ 1–4 天（深尾尊貴建築）」，castle Lv60 滿級 ≈8.5 天等值。
 *   altar 用 2.3（解鎖 Lv6、max 30）：後期榮譽輸出型建築的尊貴曲線（同樣阻尼）。
 *
 * tierPal recolor intent（sprite 分階換色意圖，由 B6 手繪變體或 B4 畫布飾邊實作）:
 *   階級 = buildingTier(lvl)：0 樸實 (<5) / 1 銀階 (5–9) / 2 金階 (>=10)。
 *   每棟建築的飾邊（trim）在 T1 泛銀輝、T2 泛金煌，具體目標色見各條目註解。
 */
"use strict";
MG.data = MG.data || {};
MG.data.buildings = (function () {
  /* v553/v624 高級成本阻尼:等級 ≤12 維持原曲線(前期節奏不變,與舊曲線逐位元一致);
     等級 13+ 每級 ×1.20(v553 的 ×1.35 在 Lv25-40 複利 ×222,遠超近似線性的收入成長 —
     kl28 r10 收入 524萬/h 下 altar Lv25 單級 7.5 天、Lv30 33.6 天、castle Lv60 深尾 10046 天,
     「升建築→王國變強」主迴圈後期凍結、金幣失去消耗出口);
     指數段封頂 30 級(Lv42 後不再複利),之後線性尾 ×(1+0.3×超出級數) —
     castle max60/warehouse max50 深尾因此有限且 <14 天等值,絕對滿級保留尊貴感但可達。
     v624 實測(r10 收入):castle Lv30 1.2天→3.6h、library Lv30 9.3天→26.6h、
     altar Lv25 7.5天→1.6天、altar Lv30 33.6天→4天、castle Lv60 ≈8.5天。 */
  function damp(base, mul, l) {
    const g = Math.pow(1.2, Math.min(Math.max(0, l - 12), 30));
    const tail = 1 + 0.3 * Math.max(0, l - 42);
    return Math.floor(base * Math.pow(mul, Math.min(l - 1, 11)) * g * tail);
  }
  return {
    castle: {
      id: "castle", name: "王城大廳", icon: "b_castle", max: 60,
      desc: "王國的心臟。稅收從這裡流向每一個英雄的錢袋。",
      flavor: "高塔上的風，仍在低語著梅根王朝的舊名。",
      // tierPal: T1 鍍銀塔尖(#cdd6f4) → T2 王冠金焰(#ffd166)
      effect: l => "金幣收益 +" + (8 * l) + "%",
      unlock: 1,
      cost: l => ({ gold: damp(200, 2.1, l) })
    },
    guild: {
      id: "guild", name: "酒館", icon: "b_guild", max: 30,
      desc: "英雄集結的酒館。等級越高，可同時出征的英雄越多，名冊上限也越高。",
      flavor: "酒館的喧囂裡，藏著下一個傳奇的名字。",
      // tierPal: T1 銀灰屋簷(#9aa4c8) → T2 赤銅徽記(#e85c4a)
      effect: l => "出戰人數 " + Math.min(5, 2 + Math.floor((l - 1) / 3)) + " 人 / 招募費用 -" + (2 * l) + "% / 名冊上限 " + Math.min(40, 4 + l * 2) + " 人",
      unlock: 1,
      cost: l => ({ gold: damp(150, 2.15, l), mats: { iron: 4 * l, leather: 2 * l } })
    },
    training: {
      id: "training", name: "訓練場", icon: "b_training", max: 40,
      desc: "汗水與劍光交織的場所，英雄在此脫胎換骨。",
      flavor: "每一滴汗水，都會在地圖上開出花來。",
      // tierPal: T1 銅鈴(#c8a060) → T2 烈焰旗幟(#ff9a4d)
      effect: l => "英雄經驗 +" + (10 * l) + "%",
      unlock: 2,
      cost: l => ({ gold: damp(300, 2.12, l), mats: { iron: 6 * l, herb: 3 * l } })
    },
    forge: {
      id: "forge", name: "裝備商店", icon: "b_forge", max: 40,
      desc: "爐火終年不熄。鐵匠大師為英雄鍛造與強化裝備。",
      flavor: "鐵與火的交響，從未在此停歇。",
      // tierPal: T1 橙紅爐光(#ff9a4d) → T2 白金烈焰(#ffe08a)
      effect: l => l >= 1 ? "強化費用 -" + (4 * l) + "%" : "解鎖裝備強化",
      unlock: 2,
      cost: l => ({ gold: damp(350, 2.15, l), mats: { iron: 8 * l } })
    },
    gemworks: {
      id: "gemworks", name: "寶石工坊", icon: "b_gemworks", max: 40,
      desc: "匠人巧手打磨魔晶，讓寶石的光芒照亮地圖。",
      flavor: "打磨的不只是寶石，還有英雄們的未來。",
      // tierPal: T1 紫晶鑲邊(#b08aff) → T2 虹彩寶光(#9ad8ff)
      effect: l => "寶石掉落 +" + (6 * l) + "%（可進行寶石融合）",
      unlock: 3,
      cost: l => ({ gold: damp(500, 2.18, l), mats: { crystal: 5 * l, iron: 6 * l } })
    },
    alchemy: {
      id: "alchemy", name: "藥水工坊", icon: "b_alchemy", max: 40,
      desc: "蒸氣與藥香瀰漫。一瓶靈藥，勝過千言萬語。",
      flavor: "一瓶藥水，足以改寫一場戰鬥的結局。",
      // tierPal: T1 翠綠藥光(#7ee787) → T2 翡翠蒸氣(#b0ff9a)
      effect: l => "靈藥效果 +" + (5 * l) + "%",
      unlock: 2, // 與鐵匠鋪同時開放：前期即可調配藥水
      cost: l => ({ gold: damp(700, 2.16, l), mats: { herb: 10 * l, crystal: 4 * l } })
    },
    library: {
      id: "library", name: "圖書館", icon: "b_library", max: 40,
      desc: "記載魔物弱點與上古戰技的典籍，皆藏於此。",
      flavor: "知識，是英雄最鋒利的一把劍。",
      // tierPal: T1 金箔書脊(#ffd166) → T2 秘銀銘文(#c8d8ff)
      effect: l => "技能書掉落 +" + (5 * l) + "%",
      unlock: 5,
      cost: l => ({ gold: damp(900, 2.2, l), mats: { herb: 8 * l, crystal: 6 * l } })
    },
    warehouse: {
      id: "warehouse", name: "倉庫", icon: "b_warehouse", max: 50,
      desc: "戰利品堆積如山，這裡是英雄們的寶庫。",
      flavor: "滿倉的戰利品，是王國最踏實的底氣。",
      // tierPal: T1 鐵皮加固(#9aa4c8) → T2 黃銅鉚釘(#ffd166)
      effect: l => "背包上限 +" + (10 * l) + " 格",
      unlock: 2,
      cost: l => ({ gold: damp(250, 2.1, l), mats: { iron: 5 * l, leather: 5 * l } })
    },
    altar: {
      id: "altar", name: "昇華祭壇", icon: "b_altar", max: 30,
      desc: "古老的祭壇。獻上王國的一切，換取更強大的昇華之力。",
      flavor: "獻上一切之人，將獲得一切。",
      // tierPal: T1 緋紅祭紋(#ff5c8a) → T2 紫金神光(#ff9ad8)
      effect: l => "昇華榮譽 +" + (5 * l) + "%",
      unlock: 6,
      cost: l => ({ gold: damp(2000, 2.3, l), mats: { crystal: 12 * l, ember: 6 * l } })
    },
    market: {
      id: "market", name: "市場", icon: "b_market", max: 10,
      desc: "商賈雲集之地，只要有金幣與鑽石，什麼都買得到。",
      flavor: "沒有金幣解決不了的問題——如果有，就加鑽石。",
      // tierPal: T1 鮮紅布篷(#e85c4a) → T2 黃金招牌(#ffd166)
      effect: l => "開放商店（更多貨品）",
      unlock: 3,
      cost: l => ({ gold: damp(600, 2.2, l) })
    }
  };
})();
