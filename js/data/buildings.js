/* 放置王國 MEGA IDLE — kingdom buildings (slice B4 owns, extend freely, keep format)
 *
 * Cost curve (verified, lvl 1–30):
 *   gold = base × mul^(l-1), mul ∈ {2.1, 2.12, 2.15, 2.16, 2.18, 2.2, 2.3} ≈ 契約的 ×2.1/lvl
 *   mats = linear × lvl.
 *   Early game does NOT stall: castle 1→5 = 3,354 金幣 ≈ 5–10 分鐘的 1 區自動狩獵，
 *   累計王國經驗 88 ≥ 80，剛好於王城 Lv5 時觸發王國 Lv2（訓練場／鐵匠鋪／倉庫解鎖）。
 *   Lv10 起單次升級破十萬、Lv20 起破億——對照 10 區 ×10 關的產出曲線與覺醒重置，
 *   節奏落在「前期每幾分鐘一級、中後期以天計」的放置節奏上。故不加調整。
 *   altar 刻意用 2.3（解鎖 Lv6、max 30）：後期榮譽輸出型建築的尊貴曲線。
 *
 * tierPal recolor intent（sprite 分階換色意圖，由 B6 手繪變體或 B4 畫布飾邊實作）:
 *   階級 = buildingTier(lvl)：0 樸實 (<5) / 1 銀階 (5–9) / 2 金階 (>=10)。
 *   每棟建築的飾邊（trim）在 T1 泛銀輝、T2 泛金煌，具體目標色見各條目註解。
 */
"use strict";
MG.data = MG.data || {};
MG.data.buildings = (function () {
  return {
    castle: {
      id: "castle", name: "王城大廳", icon: "b_castle", max: 60,
      desc: "王國的心臟。稅收從這裡流向每一個獵人的錢袋。",
      flavor: "高塔上的風，仍在低語著梅根王朝的舊名。",
      // tierPal: T1 鍍銀塔尖(#cdd6f4) → T2 王冠金焰(#ffd166)
      effect: l => "金幣收益 +" + (8 * l) + "%",
      unlock: 1,
      cost: l => ({ gold: Math.floor(200 * Math.pow(2.1, l - 1)) })
    },
    guild: {
      id: "guild", name: "酒館", icon: "b_guild", max: 30,
      desc: "獵人集結的酒館。等級越高，可同時出征的獵人越多，名冊上限也越高。",
      flavor: "酒館的喧囂裡，藏著下一個傳奇的名字。",
      // tierPal: T1 銀灰屋簷(#9aa4c8) → T2 赤銅徽記(#e85c4a)
      effect: l => "出戰人數 " + Math.min(5, 2 + Math.floor((l - 1) / 3)) + " 人 / 招募費用 -" + (2 * l) + "% / 名冊上限 " + Math.min(40, 4 + l * 2) + " 人",
      unlock: 1,
      cost: l => ({ gold: Math.floor(150 * Math.pow(2.15, l - 1)), mats: { iron: 4 * l, leather: 2 * l } })
    },
    training: {
      id: "training", name: "訓練場", icon: "b_training", max: 40,
      desc: "汗水與劍光交織的場所，獵人在此脫胎換骨。",
      flavor: "每一滴汗水，都會在獵場上開出花來。",
      // tierPal: T1 銅鈴(#c8a060) → T2 烈焰旗幟(#ff9a4d)
      effect: l => "獵人經驗 +" + (10 * l) + "%",
      unlock: 2,
      cost: l => ({ gold: Math.floor(300 * Math.pow(2.12, l - 1)), mats: { iron: 6 * l, herb: 3 * l } })
    },
    forge: {
      id: "forge", name: "鐵匠鋪", icon: "b_forge", max: 40,
      desc: "爐火終年不熄。鐵匠大師為獵人鍛造與強化裝備。",
      flavor: "鐵與火的交響，從未在此停歇。",
      // tierPal: T1 橙紅爐光(#ff9a4d) → T2 白金烈焰(#ffe08a)
      effect: l => l >= 1 ? "強化費用 -" + (4 * l) + "%" : "解鎖裝備強化",
      unlock: 2,
      cost: l => ({ gold: Math.floor(350 * Math.pow(2.15, l - 1)), mats: { iron: 8 * l } })
    },
    gemworks: {
      id: "gemworks", name: "寶石工坊", icon: "b_gemworks", max: 40,
      desc: "匠人巧手打磨魔晶，讓寶石的光芒照亮獵場。",
      flavor: "打磨的不只是寶石，還有獵人們的未來。",
      // tierPal: T1 紫晶鑲邊(#b08aff) → T2 虹彩寶光(#9ad8ff)
      effect: l => "寶石掉落 +" + (6 * l) + "%（可進行寶石融合）",
      unlock: 3,
      cost: l => ({ gold: Math.floor(500 * Math.pow(2.18, l - 1)), mats: { crystal: 5 * l, iron: 6 * l } })
    },
    alchemy: {
      id: "alchemy", name: "藥水工坊", icon: "b_alchemy", max: 40,
      desc: "蒸氣與藥香瀰漫。一瓶靈藥，勝過千言萬語。",
      flavor: "一瓶藥水，足以改寫一場戰鬥的結局。",
      // tierPal: T1 翠綠藥光(#7ee787) → T2 翡翠蒸氣(#b0ff9a)
      effect: l => "靈藥效果 +" + (5 * l) + "%",
      unlock: 4,
      cost: l => ({ gold: Math.floor(700 * Math.pow(2.16, l - 1)), mats: { herb: 10 * l, crystal: 4 * l } })
    },
    library: {
      id: "library", name: "圖書館", icon: "b_library", max: 40,
      desc: "記載魔物弱點與上古戰技的典籍，皆藏於此。",
      flavor: "知識，是獵人最鋒利的一把劍。",
      // tierPal: T1 金箔書脊(#ffd166) → T2 秘銀銘文(#c8d8ff)
      effect: l => "技能書掉落 +" + (5 * l) + "%",
      unlock: 5,
      cost: l => ({ gold: Math.floor(900 * Math.pow(2.2, l - 1)), mats: { herb: 8 * l, crystal: 6 * l } })
    },
    warehouse: {
      id: "warehouse", name: "倉庫", icon: "b_warehouse", max: 50,
      desc: "戰利品堆積如山，這裡是獵人們的寶庫。",
      flavor: "滿倉的戰利品，是王國最踏實的底氣。",
      // tierPal: T1 鐵皮加固(#9aa4c8) → T2 黃銅鉚釘(#ffd166)
      effect: l => "背包上限 +" + (10 * l) + " 格",
      unlock: 2,
      cost: l => ({ gold: Math.floor(250 * Math.pow(2.1, l - 1)), mats: { iron: 5 * l, leather: 5 * l } })
    },
    altar: {
      id: "altar", name: "覺醒祭壇", icon: "b_altar", max: 30,
      desc: "古老的祭壇。獻上王國的一切，換取更強大的覺醒之力。",
      flavor: "獻上一切之人，將獲得一切。",
      // tierPal: T1 緋紅祭紋(#ff5c8a) → T2 紫金神光(#ff9ad8)
      effect: l => "覺醒榮譽 +" + (5 * l) + "%",
      unlock: 6,
      cost: l => ({ gold: Math.floor(2000 * Math.pow(2.3, l - 1)), mats: { crystal: 12 * l, ember: 6 * l } })
    },
    market: {
      id: "market", name: "市場", icon: "b_market", max: 10,
      desc: "商賈雲集之地，只要有金幣與鑽石，什麼都買得到。",
      flavor: "沒有金幣解決不了的問題——如果有，就加鑽石。",
      // tierPal: T1 鮮紅布篷(#e85c4a) → T2 黃金招牌(#ffd166)
      effect: l => "開放商店（更多貨品）",
      unlock: 3,
      cost: l => ({ gold: Math.floor(600 * Math.pow(2.2, l - 1)) })
    }
  };
})();
