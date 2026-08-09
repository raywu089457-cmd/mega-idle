/* 放置王國 MEGA IDLE — quests, achievements, check-in, codex rewards (slice B5: extend freely, keep format) */
"use strict";
MG.data = MG.data || {};
MG.data.quests = (function () {
  /* req: {type, target, what?} types: kill(stage monsters), stage, region, equip, enhance, promote, recruit, building, awaken, gold, item, codex */
  const MAIN = [
    { id: "m1", name: "初出茅廬", req: { type: "kill", target: 10 }, reward: { gold: 500 } },
    { id: "m2", name: "草原清剿", req: { type: "stage", target: 3 }, reward: { gold: 500, gems: 10 } },
    { id: "m3", name: "招募夥伴", req: { type: "recruit", target: 3 }, reward: { ticket: 1, gold: 300 } },
    { id: "m4", name: "武裝自己", req: { type: "equip", target: 4 }, reward: { gold: 800, gems: 15 } },
    { id: "m5", name: "磨礪鋒芒", req: { type: "enhance", target: 5 }, reward: { gold: 1000, gems: 20 } },
    { id: "m6", name: "突破極限", req: { type: "promote", target: 1 }, reward: { ticket: 1, gems: 20 } },
    { id: "m7", name: "深入森林", req: { type: "region", target: 2 }, reward: { gold: 3000, gems: 30 } },
    { id: "m8", name: "森林獵人", req: { type: "kill", target: 200 }, reward: { gold: 4000, gems: 30 } },
    { id: "m9", name: "公會壯大", req: { type: "recruit", target: 8 }, reward: { ticket: 2, gold: 3000 } },
    { id: "m10", name: "十級王國", req: { type: "kingdom", target: 10 }, reward: { gold: 8000, gems: 40 } },
    { id: "m11", name: "洞穴探險", req: { type: "region", target: 3 }, reward: { gold: 10000, gems: 40 } },
    { id: "m12", name: "鍛造大師", req: { type: "enhance", target: 20 }, reward: { gold: 12000, gems: 40 } },
    { id: "m13", name: "傳說裝備", req: { type: "item", target: "r5" }, reward: { gold: 15000, gems: 50, ticket: 1 } },
    { id: "m14", name: "火山試煉", req: { type: "region", target: 4 }, reward: { gold: 25000, gems: 50 } },
    { id: "m15", name: "百戰之師", req: { type: "kill", target: 2000 }, reward: { gold: 20000, gems: 60 } },
    { id: "m16", name: "五突破", req: { type: "promote", target: 5 }, reward: { ticket: 2, gems: 60 } },
    { id: "m17", name: "冰原之旅", req: { type: "region", target: 5 }, reward: { gold: 60000, gems: 60 } },
    { id: "m18", name: "寶石收藏家", req: { type: "gem", target: 10 }, reward: { gold: 50000, gems: 60 } },
    { id: "m19", name: "套裝獵人", req: { type: "set", target: 4 }, reward: { gold: 80000, gems: 80, ticket: 1 } },
    { id: "m20", name: "荒漠尋寶", req: { type: "region", target: 6 }, reward: { gold: 150000, gems: 80 } },
    { id: "m21", name: "二十級王國", req: { type: "kingdom", target: 20 }, reward: { gold: 200000, gems: 100 } },
    { id: "m22", name: "沼澤淨化", req: { type: "region", target: 7 }, reward: { gold: 400000, gems: 100 } },
    { id: "m23", name: "覺醒之始", req: { type: "awaken", target: 1 }, reward: { gems: 150, honor: 50 } },
    { id: "m24", name: "塔頂風光", req: { type: "region", target: 8 }, reward: { gold: 1200000, gems: 120 } },
    { id: "m25", name: "深淵之影", req: { type: "region", target: 9 }, reward: { gold: 4000000, gems: 150 } },
    { id: "m26", name: "神話之路", req: { type: "region", target: 10 }, reward: { gold: 12000000, gems: 200, ticket: 2 } },
    { id: "m27", name: "百萬斬", req: { type: "kill", target: 100000 }, reward: { gems: 200, ticket: 2 } },
    { id: "m28", name: "三次覺醒", req: { type: "awaken", target: 3 }, reward: { gems: 300, honor: 200 } },
    { id: "m29", name: "三十級王國", req: { type: "kingdom", target: 30 }, reward: { gems: 300, ticket: 3 } },
    { id: "m30", name: "王的繼承人", req: { type: "awaken", target: 5 }, reward: { gems: 500, ticket: 3, honor: 500 } }
  ];
  const DAILY_POOL = [
    { id: "d1", name: "擊敗魔物 50 隻", req: { type: "kill", target: 50 }, reward: { gold: 2000, gems: 10 } },
    { id: "d2", name: "推進 5 個關卡", req: { type: "stage", target: 5 }, reward: { gold: 1500, gems: 10 } },
    { id: "d3", name: "強化裝備 3 次", req: { type: "enhance", target: 3 }, reward: { gold: 1000, gems: 10 } },
    { id: "d4", name: "獲得 10,000 金幣", req: { type: "gold", target: 10000 }, reward: { gold: 2000, gems: 10 } },
    { id: "d5", name: "招募 2 名獵人", req: { type: "recruit", target: 2 }, reward: { ticket: 1, gems: 10 } },
    { id: "d6", name: "擊敗 1 隻首領", req: { type: "boss", target: 1 }, reward: { gems: 20, honor: 5 } },
    { id: "d7", name: "獵人升級 5 次", req: { type: "levelup", target: 5 }, reward: { gold: 1500, gems: 10 } },
    { id: "d8", name: "拾取素材 20 個", req: { type: "mat", target: 20 }, reward: { gold: 1500, gems: 10 } },
    { id: "d9", name: "收集 3 種裝備", req: { type: "item", target: 3 }, reward: { gold: 2000, gems: 15 } },
    { id: "d10", name: "獵人突破 1 次", req: { type: "promote", target: 1 }, reward: { gold: 1000, gems: 15, honor: 5 } }
  ];
  const ACH = [
    { id: "a_k1", name: "初露鋒芒", desc: "累計擊敗 100 隻魔物", req: { type: "kill", target: 100 }, reward: { gems: 20 } },
    { id: "a_k2", name: "千人斬", desc: "累計擊敗 1,000 隻魔物", req: { type: "kill", target: 1000 }, reward: { gems: 40 } },
    { id: "a_k3", name: "魔物屠夫", desc: "累計擊敗 10,000 隻魔物", req: { type: "kill", target: 10000 }, reward: { gems: 80 } },
    { id: "a_k4", name: "百萬獵人", desc: "累計擊敗 100,000 隻魔物", req: { type: "kill", target: 100000 }, reward: { gems: 150, ticket: 2 } },
    { id: "a_b1", name: "首領討伐者", desc: "擊敗 10 隻首領", req: { type: "boss", target: 10 }, reward: { gems: 30, honor: 20 } },
    { id: "a_b2", name: "龍之災厄", desc: "擊敗 50 隻首領", req: { type: "boss", target: 50 }, reward: { gems: 80, honor: 50 } },
    { id: "a_b3", name: "獵龍傳說", desc: "擊敗 200 隻首領", req: { type: "boss", target: 200 }, reward: { gems: 200, honor: 150 } },
    { id: "a_s1", name: "草原之風", desc: "抵達第 10 關", req: { type: "stage", target: 10 }, reward: { gems: 20 } },
    { id: "a_s2", name: "森林低語", desc: "抵達第 30 關", req: { type: "stage", target: 30 }, reward: { gems: 40 } },
    { id: "a_s3", name: "火山之心", desc: "抵達第 60 關", req: { type: "stage", target: 60 }, reward: { gems: 80 } },
    { id: "a_s4", name: "蒼穹之巔", desc: "抵達第 100 關", req: { type: "stage", target: 100 }, reward: { gems: 200, ticket: 2 } },
    { id: "a_r1", name: "招募新人", desc: "累計招募 10 名獵人", req: { type: "recruit", target: 10 }, reward: { gems: 30 } },
    { id: "a_r2", name: "公會興旺", desc: "累計招募 50 名獵人", req: { type: "recruit", target: 50 }, reward: { gems: 100, ticket: 2 } },
    { id: "a_e1", name: "鑄劍師", desc: "累計強化裝備 50 次", req: { type: "enhance", target: 50 }, reward: { gems: 40 } },
    { id: "a_e2", name: "神器鍛造者", desc: "累計強化裝備 300 次", req: { type: "enhance", target: 300 }, reward: { gems: 120, ticket: 2 } },
    { id: "a_p1", name: "第一次突破", desc: "進行 1 次獵人突破", req: { type: "promote", target: 1 }, reward: { gems: 30 } },
    { id: "a_p2", name: "百煉成鋼", desc: "進行 20 次獵人突破", req: { type: "promote", target: 20 }, reward: { gems: 100 } },
    { id: "a_l1", name: "等級 25", desc: "任一獵人達到 25 級", req: { type: "hunterlvl", target: 25 }, reward: { gems: 40 } },
    { id: "a_l2", name: "等級 50", desc: "任一獵人達到 50 級", req: { type: "hunterlvl", target: 50 }, reward: { gems: 80 } },
    { id: "a_l3", name: "等級 100", desc: "任一獵人達到 100 級", req: { type: "hunterlvl", target: 100 }, reward: { gems: 200, ticket: 2 } },
    { id: "a_c1", name: "圖鑑初心者", desc: "圖鑑完成度 25%", req: { type: "codex", target: 25 }, reward: { gems: 50 } },
    { id: "a_c2", name: "博物學者", desc: "圖鑑完成度 50%", req: { type: "codex", target: 50 }, reward: { gems: 120 } },
    { id: "a_c3", name: "傳說紀錄者", desc: "圖鑑完成度 75%", req: { type: "codex", target: 75 }, reward: { gems: 250, ticket: 2 } },
    { id: "a_c4", name: "全知之眼", desc: "圖鑑完成度 100%", req: { type: "codex", target: 100 }, reward: { gems: 500, ticket: 3 } },
    { id: "a_g1", name: "富甲一方", desc: "累計獲得 1,000,000 金幣", req: { type: "gold", target: 1e6 }, reward: { gems: 60 } },
    { id: "a_g2", name: "王國金庫", desc: "累計獲得 100,000,000 金幣", req: { type: "gold", target: 1e8 }, reward: { gems: 200 } },
    { id: "a_w1", name: "初次覺醒", desc: "進行 1 次覺醒", req: { type: "awaken", target: 1 }, reward: { gems: 100, honor: 100 } },
    { id: "a_w2", name: "輪迴之力", desc: "進行 3 次覺醒", req: { type: "awaken", target: 3 }, reward: { gems: 200, honor: 200 } },
    { id: "a_w3", name: "超越神話", desc: "進行 5 次覺醒", req: { type: "awaken", target: 5 }, reward: { gems: 400, honor: 400 } },
    { id: "a_k2_", name: "套裝收藏", desc: "集齊 4 件套裝裝備", req: { type: "set", target: 4 }, reward: { gems: 80 } },
    { id: "a_kk", name: "寶石之光", desc: "鑲嵌 10 顆寶石", req: { type: "gem", target: 10 }, reward: { gems: 60 } },
    { id: "a_kk2", name: "十五強化", desc: "將裝備強化至 +15", req: { type: "maxenhance", target: 1 }, reward: { gems: 150, ticket: 1 } },
    { id: "a_eq3", name: "武裝齊備", desc: "獵人全隊同時裝備 10 件裝備", req: { type: "equip", target: 10 }, reward: { gems: 40 } },
    { id: "a_m1", name: "素材拾荒者", desc: "累計拾取 1,000 個素材", req: { type: "mat", target: 1000 }, reward: { gems: 50 } },
    { id: "a_m2", name: "大地寶庫", desc: "累計拾取 50,000 個素材", req: { type: "mat", target: 50000 }, reward: { gems: 120 } },
    { id: "a_kg1", name: "王國基石", desc: "王國等級達到 15", req: { type: "kingdom", target: 15 }, reward: { gems: 60 } },
    { id: "a_kg2", name: "王國盛世", desc: "王國等級達到 30", req: { type: "kingdom", target: 30 }, reward: { gems: 150, ticket: 1 } },
    { id: "a_rg1", name: "八域探險家", desc: "抵達第 8 區域", req: { type: "region", target: 8 }, reward: { gems: 100, honor: 20 } }
  ];
  const CHECKIN = [
    { d: 1, r: { gold: 500 }, name: "啟程之日" }, { d: 2, r: { gold: 800 } }, { d: 3, r: { ticket: 1 } }, { d: 4, r: { gold: 1200 } },
    { d: 5, r: { gold: 1500, gems: 10 } }, { d: 6, r: { ticket: 1 } }, { d: 7, r: { gems: 50 }, name: "王國週慶" }, { d: 8, r: { gold: 2000 } },
    { d: 9, r: { gold: 2500 } }, { d: 10, r: { ticket: 2 }, name: "十日小禮" }, { d: 11, r: { gold: 3000, gems: 15 } }, { d: 12, r: { ticket: 1 } },
    { d: 13, r: { gold: 4000 } }, { d: 14, r: { gems: 30 } }, { d: 15, r: { ticket: 2, gems: 50 }, name: "月中盛宴" }, { d: 16, r: { gold: 5000 } },
    { d: 17, r: { ticket: 1 } }, { d: 18, r: { gold: 6000, gems: 20 } }, { d: 19, r: { ticket: 2 } }, { d: 20, r: { gems: 60 }, name: "雙十嘉年華" },
    { d: 21, r: { gold: 8000 } }, { d: 22, r: { ticket: 2 } }, { d: 23, r: { gold: 10000, gems: 25 } }, { d: 24, r: { ticket: 1 } },
    { d: 25, r: { gems: 80 }, name: "銀月饋贈" }, { d: 26, r: { gold: 12000 } }, { d: 27, r: { ticket: 2 } }, { d: 28, r: { gems: 40 } },
    { d: 29, r: { gold: 15000, ticket: 2 } }, { d: 30, r: { gems: 150, ticket: 2 }, name: "滿月慶典" }
  ];
  const CODEX_MONSTER_MILESTONES = [
    { kills: 10, r: { gold: 500 } }, { kills: 50, r: { gems: 10 } },
    { kills: 200, r: { gems: 30 } }, { kills: 1000, r: { gems: 80, ticket: 1 } }
  ];
  const CODEX_TOTAL = [
    { pct: 25, fx: "攻擊力 +5%", r: { gems: 50 } }, { pct: 50, fx: "攻擊力 +10%", r: { gems: 120 } },
    { pct: 75, fx: "攻擊力 +15%", r: { gems: 250 } }, { pct: 100, fx: "攻擊力 +25%", r: { gems: 500, ticket: 3 } }
  ];
  const SHOP = [
    { id: "s_t1", name: "招募券", desc: "高級招募一次", icon: "item_ticket", price: { gems: 80 }, get: { ticket: 1 }, qty: "x1" },
    { id: "s_t5", name: "招募券 x5", desc: "高級招募五次", icon: "item_ticket", price: { gems: 380 }, get: { ticket: 5 }, qty: "x5" },
    { id: "s_gold", name: "金幣寶袋", desc: "立即獲得大量金幣（依王國等級）", icon: "item_goldbag", price: { gems: 50 }, get: { goldbag: 1 }, qty: "x1" },
    { id: "s_pot_atk", name: "攻擊靈藥", desc: "全隊攻擊 +30%，持續 30 分鐘", icon: "item_pot_atk", price: { gems: 30 }, get: { pot: "atk" }, qty: "x1" },
    { id: "s_pot_gold", name: "黃金靈藥", desc: "金幣收益 +50%，持續 30 分鐘", icon: "item_pot_gold", price: { gems: 30 }, get: { pot: "gold" }, qty: "x1" },
    { id: "s_pot_exp", name: "智慧靈藥", desc: "獵人經驗 +50%，持續 30 分鐘", icon: "item_pot_exp", price: { gems: 30 }, get: { pot: "exp" }, qty: "x1" },
    { id: "s_pot_hp", name: "生命藥水", desc: "立即恢復全隊 50% 生命（戰鬥中可用）", icon: "item_pot_hp", price: { gold: 800 }, get: { pot: "hp" }, qty: "x1" },
    { id: "s_boost", name: "加速沙漏", desc: "獵場速度 x5，每瓶 60 秒（獵場按鈕啟用）", icon: "item_hourglass", price: { gems: 20 }, get: { hourglass: 1 }, qty: "x1" },
    { id: "s_starter", name: "新手禮包", desc: "限購一次的超值禮包：鑽石、招募券與攻擊靈藥一次到手，冒險起點最划算！", icon: "icon_chest", price: { gems: 120 }, get: { gems: 300, ticket: 5, pot: "atk" }, qty: "x1", oneTime: true, badge: "限購一次" }
  ];
  return { MAIN, DAILY_POOL, ACH, CHECKIN, CODEX_MONSTER_MILESTONES, CODEX_TOTAL, SHOP };
})();
