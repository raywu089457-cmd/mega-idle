# MEGA IDLE 自主迭代迴圈 — goal-run 記錄

## 最後完成輪次: v366（2026-08-15）

### [v366] 改動: 試煉秘境 hover 提示
理由: 秘境選擇缺獎勵/勝率總覽。
實作:
- js/ui/more.js: 秘境列 title（描述・獎勵・剩餘・勝率/解鎖條件）
- index.html: 快取 373→374；js/data/changelog.js: v366 條目
驗證:
- 3 秘境 title 正確（黃金秘境 — 獎勵：金幣 8.14萬（剩 3/3 次）— 勝率 48%）；完整迴歸通過；rm 靜態；零 console error
- progress/v366-dungeon-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 87 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v365（2026-08-15）

### [v365] 改動: 昇華傳統/榮譽印記 hover 提示
理由: 昇華路線缺效果總覽。
實作:
- js/ui/more.js: 傳統列＋榮譽印記列 title（名稱・等級・效果・目前加成）
- index.html: 快取 372→373；js/data/changelog.js: v365 條目
驗證:
- 5 傳統＋3 印記 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v365-altar-tip.webp
風險與回滾點: 純 title 屬性（本輪曾括號錯位已即時修復並 syntax 驗證）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 86 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v364（2026-08-15）

### [v364] 改動: 公會/遠古科技 hover 提示
理由: 科技線缺投資回報總覽。
實作:
- js/ui/more.js: 公會科技＋遠古科技列 title（名稱・等級・每級加成・目前總加成）
- index.html: 快取 371→372；js/data/changelog.js: v364 條目
驗證:
- 6 線 title 正確（戰技（Lv 0/1）— 每級 +2.0%・目前總加成 +0.0%）；完整迴歸通過；rm 靜態；零 console error
- progress/v364-tech-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 85 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v363（2026-08-15）

### [v363] 改動: 深淵商店 hover 提示
理由: 深淵商店缺效果/狀態總覽。
實作:
- js/ui/more.js: 深淵商店列 title（品名・效果・成本・庫存・已擁有/深度不足/可兌換）
- index.html: 快取 370→371；js/data/changelog.js: v363 條目
驗證:
- 7 列 title 正確（神器：深淵之瞳 — 攻擊吸血 +5%…）；完整迴歸通過；rm 靜態；零 console error
- progress/v363-abysshop-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 84 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v362（2026-08-15）

### [v362] 改動: 限時活動商店 hover 提示
理由: 活動商店缺限兌/持有點數總覽。
實作:
- js/ui/more.js: 活動商店列 title（品名・點數・限兌・持有點數/售罄）
- index.html: 快取 369→370；js/data/changelog.js: v362 條目
驗證:
- 8 列 title 正確（招募券（40 活動點・本週限兌 3 次）— 持有 500 點）；完整迴歸通過；rm 靜態；零 console error
- progress/v362-event-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 83 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v361（2026-08-15）

### [v361] 改動: 榮譽商店 hover 提示
理由: 榮譽商店缺限購/狀態總覽。
實作:
- js/ui/more.js: 榮譽商店列 title（品名・價格・週限・售罄/可兌/榮譽不足）
- index.html: 快取 368→369；js/data/changelog.js: v361 條目
驗證:
- 5 列 title 正確（技能書 ×3（300 榮譽・本週限 1 次）— 榮譽不足）；完整迴歸通過；rm 靜態；零 console error
- progress/v361-honor-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 82 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v360（2026-08-15）

### [v360] 改動: 王者商店 hover 提示
理由: 王者商店缺限購/狀態總覽。
實作:
- js/ui/more.js: 王者商店列 title（品名・價格・限購・售罄/可兌換/幣不足）
- index.html: 快取 367→368；js/data/changelog.js: v360 條目
驗證:
- 4 列 title 正確（置換石 ×1（20 王者幣・本週限購 0/1）— 可兌換）；完整迴歸通過；rm 靜態；零 console error
- progress/v360-royal-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 81 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v359（2026-08-15）

### [v359] 改動: 委託遠征列 hover 提示
理由: 遠征委託規則不可見。
實作:
- js/ui/more.js: 遠征委託 title（品質・職業需求・時長・派遣條件；已派遣顯示剩餘）
- index.html: 快取 366→367；js/data/changelog.js: v359 條目
驗證:
- 6 委託 title 正確（清掃營地 品質 史詩 ×4・時長 1h…）；完整迴歸通過；rm 靜態；零 console error
- progress/v359-exped-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 80 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v358（2026-08-15）

### [v358] 改動: 迷宮增益列 hover 提示
理由: 迷宮增益疊加細節不可見。
實作:
- js/ui/more.js: 增益列 title（名稱・層級・加成・同系上限；空增益提示）
- index.html: 快取 365→366；js/data/changelog.js: v358 條目
驗證:
- 增益 title 正確（攻擊×2（每層 +0.15%…）｜生命×1…）；完整迴歸通過；rm 靜態；零 console error
- progress/v358-maze-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 79 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v357（2026-08-15）

### [v357] 改動: 元素試煉層列 hover 提示
理由: 試煉層缺勝率/獎勵總覽。
實作:
- js/ui/more.js: 試煉層 title（元素・勝率/狀態・獎勵）
- index.html: 快取 364→365；js/data/changelog.js: v357 條目
驗證:
- 15 層 title 正確（第 1 層 · 雷屬性（勝率 48%）— 獎勵…）；完整迴歸通過；rm 靜態；零 console error
- progress/v357-tower-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 78 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v356（2026-08-15）

### [v356] 改動: 深淵里程碑 hover 提示
理由: 深淵里程碑缺目標差距。
實作:
- js/ui/more.js: 深淵里程碑 title（層數・目前最深・獎勵・領取狀態）
- index.html: 快取 363→364；js/data/changelog.js: v356 條目
驗證:
- 13 里程碑 title 正確（抵達第 10 層（目前最深 3 層）…）；完整迴歸通過；rm 靜態；零 console error
- progress/v356-abyss-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 77 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v355（2026-08-15）

### [v355] 改動: 世界/公會首領里程碑 hover 提示
理由: 總傷里程碑缺進度/獎勵總覽。
實作:
- js/ui/more.js: 世界首領（W.MILESTONES）＋公會首領（G.BOSS_MILESTONES）里程碑 title（進度・獎勵・領取狀態）
- index.html: 快取 362→363；js/data/changelog.js: v355 條目
驗證:
- 4（世界）＋4（公會）里程碑 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v355-boss-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 76 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v354（2026-08-15）

### [v354] 改動: 競技場對手列 hover 提示
理由: 挑對手不知勝率細節。
實作:
- js/ui/more.js: 對手列 title（名次・職業・稀有度・戰力・勝率／已挑戰）
- index.html: 快取 360→361；js/data/changelog.js: v354 條目
驗證:
- 10 列 title 正確（#1 湖鳴沙（牧師 ★5）戰力 258 — 勝率 95%）；完整迴歸通過；rm 靜態；零 console error
- progress/v354-arena-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 75 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v353（2026-08-15）

### [v353] 改動: 七日豪禮 hover 提示
理由: 豪禮列表缺目標/進度總覽。
實作:
- js/ui/more.js: 七日豪禮列 title（天數・目標・進度・獎勵・狀態；D7 自選傳說）
- index.html: 快取 359→360；js/data/changelog.js: v353 條目
驗證:
- 7 天 title 正確（含 D7 自選傳說）；完整迴歸通過；rm 靜態；零 console error
- progress/v353-welcome-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 74 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v352（2026-08-15）

### [v352] 改動: 成就列 hover 提示
理由: 成就頁缺狀態總覽。
實作:
- js/ui/more.js: 成就列 title（名稱・條件・獎勵・已領/可領/未達成）
- index.html: 快取 358→359；js/data/changelog.js: v352 條目
驗證:
- 45 成就 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v352-ach-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 73 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v351（2026-08-15）

### [v351] 改動: 每日/週任務 hover 提示
理由: 任務列表缺獎勵/重置資訊總覽。
實作:
- js/ui/more.js: 每日/週任務列 title（名稱・進度・獎勵・午夜/週一重置）
- index.html: 快取 357→358；js/data/changelog.js: v351 條目
驗證:
- 5 每日＋8 週任務 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v351-quest-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 72 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v350（2026-08-15）

### [v350] 改動: 自動續戰/進關 hover 提示
理由: 兩自動鈕行為差異不明。
實作:
- js/ui/hunt.js: 自動續戰 title（休息完再派遣・離線 12h）、自動進關 title（推進/原地刷關）
- index.html: 快取 356→357；js/data/changelog.js: v350 條目
驗證:
- 兩 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v350-auto-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 71 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v349（2026-08-15）

### [v349] 改動: 戰鬥英雄技能 hover 提示
理由: 戰鬥中不知技能效果/冷卻。
實作:
- js/ui/hunt.js: 出戰格 title（技能名・效果・魔力・CD・剩餘秒數；含魔力不足/就緒狀態）
- index.html: 快取 355→356；js/data/changelog.js: v349 條目
驗證:
- 「蓄力猛擊」tip 正確（320% 傷害・CD 10s・剩 1s）；完整迴歸通過；rm 靜態；零 console error
- progress/v349-skill-tip.webp
風險與回滾點: 純 title 屬性（本輪曾誤刪一行已即時修復並 syntax 驗證）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 70 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v348（2026-08-15）

### [v348] 改動: 圖鑑魔物行 hover 提示
理由: 圖鑑收集決策缺元素/BOSS 資訊。
實作:
- js/ui/more.js: 圖鑑魔物行 title（名稱・區域・元素屬性；BOSS 加註掉寶率提升）
- index.html: 快取 354→355；js/data/changelog.js: v348 條目
驗證:
- 62 行 title 正確（綠史萊姆（翠綠草原・自然屬性）…）；完整迴歸通過；rm 靜態；零 console error
- progress/v348-codex-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 69 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v347（2026-08-15）

### [v347] 改動: 裝備格 hover 提示補強
理由: 裝備格 title 缺稀有度/強化資訊。
實作:
- js/ui/equipment.js: title 前置「★N 稀有度名」＋強化 +N
- index.html: 快取 353→354；js/data/changelog.js: v347 條目
驗證:
- 226 格 title 正確（★4 史詩 附魔的秘銀戰甲…）；完整迴歸通過；rm 靜態；零 console error
- progress/v347-equip-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 68 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v346（2026-08-15）

### [v346] 改動: 建築卡片 hover 提示
理由: 建築列表不知效果/解鎖條件。
實作:
- js/ui/kingdom.js: 建築列 title（名稱・等級・當前效果／鎖定需王國 Lv N）
- index.html: 快取 352→353；js/data/changelog.js: v346 條目
驗證:
- 10 建築 title 正確（王城大廳/酒館/訓練場…）；完整迴歸通過；rm 靜態；零 console error
- progress/v346-building-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 67 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v345（2026-08-15）

### [v345] 改動: 英雄卡片 hover 提示
理由: 名冊掃視不知英雄職業/元素/狀態。
實作:
- js/ui/hunters.js: 英雄卡 title（職業・元素屬性・等級・戰力・派遣/出戰狀態）
- index.html: 快取 351→352；js/data/changelog.js: v345 條目
驗證:
- 3 卡 title 正確（劍士/弓手/法師）；完整迴歸通過；rm 靜態；零 console error
- progress/v345-hero-card-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 66 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v344（2026-08-15）

### [v344] 改動: 派遣小關列 hover 提示
理由: 小關選擇不知對手。
實作:
- js/ui/hunt.js: 小關 1-9 title「對戰「怪物名」」；BOSS 關 title「BOSS「名」— 掉寶率提升」
- index.html: 快取 350→351；js/data/changelog.js: v344 條目
驗證:
- 9 對戰 tip＋BOSS tip 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v344-stage-tips.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 65 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v343（2026-08-15）

### [v343] 改動: 派遣難度列 hover 提示
理由: 難度選擇不知倍率/鎖定條件。
實作:
- js/ui/hunt.js: 4 難度 colBtn title（難度 ×N — 金幣/經驗 ×N（防禦不縮放）／攻略第 N 區域後解鎖）
- index.html: 快取 349→350；js/data/changelog.js: v343 條目
驗證:
- 普通/困難/地獄/夢魘 tip 正確（含鎖定）；完整迴歸通過；rm 靜態；零 console error
- progress/v343-diff-tips.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 64 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v342（2026-08-15）

### [v342] 改動: 派遣視窗章節 hover 提示
理由: 派遣選區不知 BOSS/解鎖條件。
實作:
- js/ui/hunt.js: 派遣章節列 colBtn title（前往討伐・BOSS 名／鎖定解鎖條件）
- index.html: 快取 348→349；js/data/changelog.js: v342 條目
驗證:
- 11 withTip（含鎖定提示）；完整迴歸通過；rm 靜態；零 console error
- progress/v342-region-tips.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 63 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v341（2026-08-15）

### [v341] 改動: 村莊名牌 hover 提示
理由: 村莊名牌無 hover，地圖名牌提示不完整。
實作:
- js/ui/map.js: 村莊名牌 title（返回王國 — 升級建築/招募英雄/查看資源）
- index.html: 快取 346→347；js/data/changelog.js: v341 條目
驗證:
- tip 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v341-village-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 62 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v340（2026-08-15）

### [v340] 改動: 模式地標名牌 hover 提示
理由: 模式入口用途在地圖上不可知。
實作:
- js/ui/map.js: 10 個模式名牌 title（用途＋門檻）
- index.html: 快取 345→346；js/data/changelog.js: v340 條目
驗證:
- 競技場/世界首領 tip 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v340-mode-tips.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 61 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v339（2026-08-15）

### [v339] 改動: 頂欄資源 hover 提示
理由: 資源圖示無用途提示。
實作:
- js/ui/screens.js: 頂欄金幣/鑽石 title（點擊查看取得方式 — 與 openResourceGuide 呼應）
- index.html: 快取 344→345；js/data/changelog.js: v339 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v339-res-tips.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 60 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v338（2026-08-15）

### [v338] 改動: 更多頁磁磚 hover 描述
理由: 19 個功能磁磚無用途提示，新手靠猜。
實作:
- js/ui/more.js: TILE_DEFS 加描述欄；tile() title 屬性
- index.html: 快取 343→344；js/data/changelog.js: v338 條目
驗證:
- 19 withTip；完整迴歸通過；rm 靜態；零 console error
- progress/v338-tile-tips.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 59 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v337（2026-08-15）

### [v337] 改動: 更新歷史最新版本角標
理由: 版本列表無最新標記；57 輪煙霧測試同步。
實作:
- js/ui/more.js: 更新歷史首條「最新」綠角標
- 57 輪煙霧測試: 全畫面/21 名牌/minimap/縮放/寶箱存檔全通過
- index.html: 快取 342→343；js/data/changelog.js: v337 條目
驗證:
- modal 含「最新」；完整迴歸通過；rm 靜態；零 console error
- progress/v337-changelog-badge.webp
風險與回滾點: 純 UI 角標。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 58 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v336（2026-08-15）

### [v336] 改動: 圖鑑魔物搜索框
理由: 魔物圖鑑 ~30 隻無過濾，農素材找怪翻頁；任務系統審查同步。
實作:
- js/ui/more.js: 圖鑑魔物區搜索框（input 事件即時過濾 renderCodex — 名稱/區域匹配）
- 任務審查: 每日/每週 pbar＋深鏈＋動態目標 — 全完善
- index.html: 快取 341→342；js/data/changelog.js: v336 條目
驗證:
- 「狼」過濾 → 僅草原野狼/冰霜野狼 2 行
- 完整迴歸通過; rm 靜態; 零 console error
- progress/v336-codex-search.webp
風險與回滾點: 純 UI 過濾（renderCodex 閉包重構，行為不變）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 57 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v335（2026-08-15）

### [v335] 改動: 最終技術複查（第三次）＋存檔壓縮驗證
理由: 55 輪堆疊後最終穩定性確認（純驗證輪）。
實作: 無代碼變動 — 全流程複查＋存檔壓縮驗證。
驗證:
- 61fps、21 名牌/熱區、minimap、存檔 54 欄位、零 console error/unhandledrejection
- 存檔 MGZ1 deflate: 13853 vs 48543（-71%）
- progress/v335-final-review.webp
風險與回滾點: 無（純驗證）。回滾: git revert 本輪 commit（僅文檔/快取）。
下一輪: 預定方向 — 已 56 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v334（2026-08-15）

### [v334] 改動: 每日簽到月進度條
理由: 簽到月目標缺視覺進度。
實作:
- js/ui/more.js: 簽到 D X/30 pbar
- 簽到審查: 30 天月曆/特別日（王國週慶/滿月慶典等）— 完善
- index.html: 快取 339→340；js/data/changelog.js: v334 條目
驗證:
- 1 pbar；完整迴歸通過；rm 靜態；零 console error
- progress/v334-checkin-bar.webp
風險與回滾點: 純 UI 進度條。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 55 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v333（2026-08-15）

### [v333] 改動: 成就總體進度條 ＋ 系統審查
理由: 成就進度僅文字；限時活動/成就審查同步。
實作:
- js/ui/more.js: 成就 X/45 pbar
- 系統審查: 限時活動（點數/里程碑/商店）、成就（45 項/全部領取）— 全完善
- index.html: 快取 338→339；js/data/changelog.js: v333 條目
驗證:
- 1 pbar；完整迴歸通過；rm 靜態；零 console error
- progress/v333-ach-bar.webp
風險與回滾點: 純 UI 進度條。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 54 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v332（2026-08-15）

### [v332] 改動: 圖鑑完成度進度條 ＋ 系統審查
理由: 圖鑑完成度僅文字；圖鑑系統審查同步。
實作:
- js/ui/more.js: 圖鑑完成度 pbar
- 圖鑑審查: 魔物/總完成度/英雄收集里程碑＋深鏈前往＋全部領取 — 全完善
- index.html: 快取 337→338；js/data/changelog.js: v332 條目
驗證:
- 64 pbar（含各魔物進度）；完整迴歸通過；rm 靜態；零 console error
- progress/v332-codex-bar.webp
風險與回滾點: 純 UI 進度條。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 53 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v331（2026-08-15）

### [v331] 改動: 英雄突破慶祝演出 ＋ 系統審查
理由: 突破（養成里程碑）只有 toast 無演出；商城/深淵/榮譽/英雄四系統審查同步。
實作:
- js/ui/hunters.js: showPromoteCelebration（金柱＋階級文字，rm 省略）；突破按鈕接線
- 系統審查: 商城/深淵/榮譽商店/英雄系統 — 全完善
- index.html: 快取 336→337；js/data/changelog.js: v331 條目
驗證:
- 突破成功 promoted=1＋ovl 演出顯示；完整迴歸通過；rm 靜態；零 console error
- progress/v331-promote-celebration.webp
風險與回滾點: 純演出（不觸數值）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 52 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v330（2026-08-15）

### [v330] 改動: 七日豪禮總體進度條 ＋ 系統審查
理由: 新手目標鏈缺總體視覺；三系統審查同步。
實作:
- js/ui/more.js: 七日豪禮總體 pbar（done/7）
- 系統審查: 七日豪禮（D1-7＋最終傳說）、委託遠征營（品質/錨/召回）、試煉秘境（三秘境/掃蕩）— 全完善
- index.html: 快取 335→336；js/data/changelog.js: v330 條目
驗證:
- 1 pbar；完整迴歸通過；rm 靜態；零 console error
- progress/v330-welcome-bar.webp
風險與回滾點: 純 UI 進度條。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 51 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v329（2026-08-15）

### [v329] 改動: 世界首領週討伐進度條 ＋ 系統審查
理由: 週討伐全勤目標缺視覺進度；四系統審查同步。
實作:
- js/ui/more.js: 世界首領週討伐 pbar（atk/21）
- 系統審查: 元素塔/奇境迷宮/王者競技場/世界首領 — 全完善
- index.html: 快取 334→335；js/data/changelog.js: v329 條目
驗證:
- 2 pbar（血條＋週討伐）；完整迴歸通過；rm 靜態；零 console error
- progress/v329-wb-weekly-bar.webp
風險與回滾點: 純 UI 進度條。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 50 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v328（2026-08-15）

### [v328] 改動: 競技場天梯第一名皇冠
理由: 榜首榮耀不明顯；競技場系統審查同步。
實作:
- js/ui/more.js: 天梯 #1 顯示 👑 皇冠（取代 #1 數字）
- 競技場審查: 天梯 10 人/挑戰/掃蕩/防守編隊/週結算非線性表（第一名 60 鑽=第 10 名 30 倍）/勝場加成 — 全完善
- index.html: 快取 333→334；js/data/changelog.js: v328 條目
驗證:
- modal 含 👑；完整迴歸通過；rm 靜態；零 console error
- progress/v328-arena-crown.webp
風險與回滾點: 純文字替換。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 49 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v327（2026-08-15）

### [v327] 改動: 王城旗幟飄動
理由: 王城天際線靜態；裝備系統審查同步。
實作:
- js/ui/kingdom.js: 城堡塔頂金旗（3.4Hz 正弦擺動＋旗尾）；rm 定幀
- 裝備審查: 強化/批量/到滿/閃格/鑲嵌/重鑄/篩選持久化 — 全完善
- index.html: 快取 332→333；js/data/changelog.js: v327 條目
驗證:
- gold 351px；rm 靜態；完整迴歸通過；零 console error
- progress/v327-castle-flag.webp
風險與回滾點: fx 層輕量動畫。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 48 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v326（2026-08-15）

### [v326] 改動: 王國花圃蝴蝶 — 兩隻繞花飛舞
理由: 花圃靜態，無生物呼應；公會系統審查同步。
實作:
- js/ui/kingdom.js: 花圃兩隻粉蝶（8 字軌跡＋拍翅 2 幀）；rm 定幀花上
- 公會審查: 科技（6 項）/捐獻（3 次）/盛宴/每週首領 — 全完善
- index.html: 快取 331→332；js/data/changelog.js: v326 條目
驗證:
- pink 15px；rm 靜態；完整迴歸通過；零 console error
- progress/v326-butterflies.webp
風險與回滾點: fx 層輕量動畫。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 47 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v325（2026-08-15）

### [v325] 改動: 英雄待機偶發張望
理由: 動作軸 backlog「待機隨機動作（眨眼/張望）」— 待機只有呼吸。
實作:
- js/ui/render.js: glance — 每 5s 週期 0.5s 側頭（±1.5px 正弦，per-seed 相位）；rm/攻擊/受擊/死亡不觸發
- index.html: 快取 330→331；js/data/changelog.js: v325 條目
驗證:
- 戰鬥動畫中（多幀差異）; rm 靜態; 完整迴歸通過; 零 console error
- progress/v325-idle-fidget.webp
風險與回滾點: 純位移。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 46 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v324（2026-08-15）

### [v324] 改動: 職業攻擊動作差異化 — 遠程拉弓/舉杖
理由: 動作軸 backlog「職業動作差異化」— 所有職業攻擊姿勢相同。
實作:
- js/ui/render.js: ranged（archer/mage）用攻B幀＋atkLift 8＋前搖 0.35s；近戰維持攻A幀＋0.3s；施法相位同步
- index.html: 快取 329→330；js/data/changelog.js: v324 條目
驗證:
- 弓手戰鬥 fight＋動畫中（幀間差異）
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v324-class-poses.webp
風險與回滾點: 純幀選擇（sprite 既有幀集）；battle 時序零觸碰。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 45 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v323（2026-08-15）

### [v323] 改動: 全通金冠呼吸閃爍 — tier 3 動態
理由: 金冠靜態，全通榮耀不夠醒目。
實作:
- js/ui/map.js: drawCrownFx（10/10 區金冠 500ms 呼吸；rm 恆亮）動態層
- index.html: 快取 328→329；js/data/changelog.js: v323 條目
驗證:
- 金像素 144→146→174 脈動
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v323-crown-pulse.webp
風險與回滾點: 輕量動態層。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 44 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v322（2026-08-15）

### [v322] 改動: 技能傷害數字職業元素色
理由: 技能傷害浮字固定紫，與 hit/crit 元素色系統不一致。
實作:
- js/ui/hunt.js: skill case 浮字用 CLASS_ELEMENT[e.cls] 元素色（無則紫）；非傷害技能跳名不變
- index.html: 快取 327→328；js/data/changelog.js: v322 條目
驗證:
- 法師技能注入 → 火色像素 394（#ff6b4a 系）
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v322-skill-element-color.webp
風險與回滾點: 純著色。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 43 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v321（2026-08-15）

### [v321] 改動: 派遣視窗 BOSS 機制預告
理由: BOSS 機制只有戰鬥中視覺化與關卡情報內文，出征前無預告。
實作:
- js/ui/hunt.js: openDispatchDialog BOSS 關顯示「BOSS「名稱」機制【Ｘ】描述」紅框（非 BOSS 不顯示）
- 技術複查: 61fps、地圖開啟 11ms、零 console error
- index.html: 快取 326→327；js/data/changelog.js: v321 條目
驗證:
- 灰燼洞穴 BOSS「岩窟幼龍」機制【護盾】開戰前 8 秒受到的傷害減半 — 正確顯示
- 完整迴歸通過; rm 靜態; 零 console error
- progress/v321-boss-preview.webp
風險與回滾點: 純 UI 顯示（boss.mech 讀取既有資料）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 42 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v320（2026-08-15）

### [v320] 改動: 王國畫面煙囪煙 — 鐵匠與煉金坊
理由: 王國主場景（480×200）生活細節補全（已有雲/火把/村民，缺煙囪煙）。
實作:
- js/ui/kingdom.js: drawTownLife 煙囪煙（forge/alchemy 建後 3 縷灰白煙上升消散）；rm 定幀
- index.html: 快取 325→326；js/data/changelog.js: v320 條目
驗證:
- smoke 10px（淡色小元素）；rm fx 靜態
- 完整迴歸通過; 零 console error
- progress/v320-kingdom-smoke.webp
風險與回滾點: fx 層輕量動畫。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 41 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v319（2026-08-15）

### [v319] 改動: 農田蔬菜壟 ＋ 離線收益端到端驗證
理由: 農田多樣性＋離線核心迴路驗證。
實作:
- js/ui/map.js: 麥田外 6 壟蔬菜（紅蘿蔔/綠葉/南瓜）；烘焙
- 離線驗證: 預覽 83.7 萬金/時、5h 結算 422 萬金＋223 萬經驗、領取制入帳（beforeunload 會重置 lastSeen — 測試注意）
- index.html: 快取 324→325；js/data/changelog.js: v319 條目
驗證:
- leaf 74/carrot 1/pumpkin 3
- 離線 5h 結算數值精確（×5 預覽）
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v319-farm-veggies.webp
風險與回滾點: 純烘焙＋驗證。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 40 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v318（2026-08-15）

### [v318] 改動: 農田烏鴉 — 稻草人互動動畫
理由: 農田靜態，稻草人無互動感。
實作:
- js/ui/map.js: drawCrowFx — 8s 循環（0-0.3 飛入/0.3-0.7 停駐/0.7-1 飛走＋拍翅 2 幀）；rm 定幀肩上
- index.html: 快取 323→324；js/data/changelog.js: v318 條目
驗證:
- 深色像素多幀變異（14632→14680→14681 移動）
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v318-crow.webp
風險與回滾點: 純動畫（輕量 fill）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 39 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v317（2026-08-15）

### [v317] 改動: 郵筒 — 東街轉角
理由: 街道公共設施語彙補全。
實作:
- js/ui/map.js: 東街×中街轉角郵筒（藍筒＋紅旗＋頂蓋）；烘焙
- index.html: 快取 322→323；js/data/changelog.js: v317 條目
驗證:
- blue 25/flag 132 像素
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v317-mailbox.webp
風險與回滾點: 純烘焙繪製。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 38 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v316（2026-08-15）

### [v316] 改動: 晾衣繩 — 屋後日常
理由: 村莊日常語彙持續補全。
實作:
- js/ui/map.js: 東街北段晾衣繩（兩柱＋繩＋紅/藍/白衣物）；烘焙
- index.html: 快取 321→322；js/data/changelog.js: v316 條目
驗證:
- red 12/blue 9 像素
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v316-clothesline.webp
風險與回滾點: 純烘焙繪製。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 37 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v315（2026-08-15）

### [v315] 改動: 村莊生活道具 — 柴堆與水桶
理由: 村莊日常語彙補全（花圃/長椅/旗幟後的生活道具）。
實作:
- js/ui/map.js: 柴堆（西街北段 4.0,16.8）＋水桶（水井旁 6.8,24.4，鐵皮＋水面）；烘焙
- index.html: 快取 320→321；js/data/changelog.js: v315 條目
驗證:
- wood 675/water 11 像素
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v315-village-props.webp
風險與回滾點: 純烘焙繪製。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 36 輪: backlog 全清，持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v314（2026-08-15）

### [v314] 改動: 城堡花圃 — 紅白小花裝飾
理由: 城堡前庭單調，廣場休憩帶完整性。
實作:
- js/ui/map.js: drawVillage 城堡南廣場東側花圃（木框＋泥土＋紅×3 白×2 花＋金蕊）；烘焙
- index.html: 快取 319→320；js/data/changelog.js: v314 條目
驗證:
- border 485/soil 52/flower 3（小尺寸元素像素）
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v314-flower-garden.webp
風險與回滾點: 純烘焙繪製。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 35 輪: backlog 全清，持續四軸輪替（視覺/耐玩性/技術複查輪換）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v313（2026-08-15）

### [v313] 改動: 廣場長椅 ＋ 自動續戰循環驗證
理由: 老婦休憩點視覺化＋核心放置迴圈（滅團→休息→自動再戰）實測確認。
實作:
- js/ui/map.js: 東街×中街長椅（椅面/椅背/椅腳烘焙）；自動續戰循環測試（弱角沙漠 BOSS 關，formations 同步後）
- index.html: 快取 318→319；js/data/changelog.js: v313 條目
驗證:
- bench 木色 654px
- 自動續戰: fight→retreat（~20s 休息）→fight 完整循環（2 次 fight）
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v313-bench.webp
風險與回滾點: 純烘焙＋測試驗證。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 34 輪: backlog 全清，持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v312（2026-08-15）

### [v312] 改動: 市集旗幟串 — 攤位間節慶三角旗
理由: 市集場景缺節慶氛圍（攤位/路燈已有）。
實作:
- js/ui/map.js: drawVillage 攤位間 4 面三角旗（紅/金/藍/綠）＋牽線，烘焙
- index.html: 快取 317→318；js/data/changelog.js: v312 條目
驗證:
- 四色旗渲染（red 115/gold 454/blue 27/green 113）
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v312-bunting-flags.webp
風險與回滾點: 純烘焙繪製。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 33 輪: backlog 全清，持續四軸輪替（視覺/耐玩性/技術複查輪換）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v311（2026-08-15）

### [v311] 改動: 區域地標全通金冠 — 10/10 榮耀標記
理由: 全通區與未全通區無視覺區別，推進目標感薄弱。
實作:
- js/ui/map.js: drawLandmarks 迴圈後統一畫全通金冠（maxStageByRegion[i]>=10 → 地標頂 6×2 金冠）；烘焙
- 深淵審查: 生成式里程碑（1000+ 每 100 層）、週結算深度階梯、商店深度門檻/動態庫存 — 全完善
- index.html: 快取 315→317（v310 漏 bump 修正）；js/data/changelog.js: v311 條目
驗證:
- 3 全通區金像素 75；區 3（5/10）無冠
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v311-landmark-crowns.webp
風險與回滾點: 純烘焙繪製。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 32 輪: 剩餘 backlog 全清; 持續四軸輪替（視覺精修/耐玩性微調/技術複查輪換）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v310（2026-08-15）

### [v310] 改動: 戰鬥長時穩定性驗證（30 秒 soak）
理由: 多輪視覺/互動堆疊後確認長期穩定性（預定方向）。
實作: 純驗證輪 — 30s 連續戰鬥（Lv60 騎士草原第 3 關），無代碼變動。
驗證:
- 30s: 擊殺 27 隻、+4021 金、60fps（1801 幀）、零 console error/unhandledrejection
- 完整迴歸通過; rm 靜態
- progress/v310-soak.webp
風險與回滾點: 無（純驗證）。回滾: git revert 本輪 commit（僅文檔/快取）。
下一輪: 預定方向 — 已 31 輪: 剩餘 backlog 幾乎全清; 持續四軸輪替，可做探索度動態（名牌進度即時刷新）、或新一波視覺精修（區域地標 tier 3）、或耐玩性（深淵週結算可達性）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v309（2026-08-15）

### [v309] 改動: 小地圖顯示每日寶箱 — 閃爍白點定位
理由: 每日寶箱位置需開地圖找，小地圖加閃點一眼定位（重訪動機強化）。
實作:
- js/ui/map.js: drawMinimap 未開寶箱時畫白點（600ms 閃爍）；opened 後消失
- 覺醒經濟審查: 昇華祭壇 UI 完整（條件/犧牲/預估/傳統）；10 次昇華 ≈2250 榮譽 vs 滿級榮譽強化 1550/項 — 節奏合理（7 次昇華滿一項）
- index.html: 快取 314→315；js/data/changelog.js: v309 條目
驗證:
- minimap 白點 38→46 閃爍（600ms 週期）；opened=true 後高值消失
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v309-minimap-chest.webp
風險與回滾點: minimap 唯讀繪製。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 30 輪: 剩餘 backlog 幾乎全清（探索度動態/地圖精修可選）; 建議下一輪做完整存檔往返測試（新檔→中後期→舊檔遷移鏈）或戰鬥長時 soak（30s 戰鬥穩定性）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v308（2026-08-15）

### [v308] 改動: 地圖名牌 hover 提示 ＋ 技術健康複查
理由: UX 桌機發現性＋多輪視覺堆疊後的技術複查（預定方向）。
實作:
- js/ui/map.js: mk 加 title 參數；區名牌 tip（前往Ｘ討伐・BOSS 名・進度 X/10；鎖定區無）
- 技術複查: 地圖開啟 15ms、60fps、零長任務、零 console error、舊檔 mapChest 遷移正常
- index.html: 快取 313→314；js/data/changelog.js: v308 條目
驗證:
- 4 區 tip 正確（翠綠草原 → 哥布林王 10/10）；鎖定區無 tip
- 完整迴歸通過; rm 靜態; 零 console error
- progress/v308-label-tooltips.webp
風險與回滾點: 純 title 屬性（無行為影響）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 29 輪: 剩餘 backlog 細節（覺醒數值微調、探索度動態、地圖精修）; 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v307（2026-08-15）

### [v307] 改動: 海岸小碼頭 — 燈塔旁泊船
理由: 地圖軸 P1「模式地標道路/碼頭連接」的碼頭部分 — 漁船無停靠點，海岸場景不完整。
實作:
- js/ui/map.js: drawDock（燈塔旁 45.5,25.2 — 樁柱＋木板＋纜繩柱，烘焙）；drawSeaFx 漁船路線改碼頭↔外海（45.5→40.5 往返）
- 設定頁審查: 重播教學（tutorial=0 恢復＋略過=7）、自動喝水閾值、通知、存檔管理全部功能驗證通過
- index.html: 快取 312→313；js/data/changelog.js: v307 條目
驗證:
- dock wood 451/plank 1170 像素
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v307-dock.webp
風險與回滾點: 純烘焙＋路線參數。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 28 輪: 剩餘 backlog 均為細節（覺醒數值微調、探索度動態、地圖精修）。持續四軸輪替: 下一輪建議技術健康複查（console/效能/記憶體 — 多輪視覺堆疊後確認無累積問題）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v306（2026-08-15）

### [v306] 改動: 村民增至 5 種 — 工人與老婦
理由: 地圖軸 P1「村莊生活感（…更多村民）」— 3 村民略單薄；紅點/市場審查同時通過（18 來源紅點健全、Lv25 週兌=週收入 164% 需取捨、日特惠=日收入 18% 健康）。
實作:
- js/ui/map.js: want 加 v4/v5；v4 工人（#b09060、西街南端往返 homeNode 3）、v5 老婦（#9a8ab8、廣場長坐 3-6s homeNode 5）
- index.html: 快取 311→312；js/data/changelog.js: v306 條目
驗證:
- worker 64px／elder 8px 像素渲染
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v306-villagers-5.webp
風險與回滾點: 純視覺（行為參數同既有機制）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 27 輪: 剩餘 backlog: 耐玩性（覺醒數值審查）、UX（設定頁審查）、地圖細節（海洋碼頭/探索度動態）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v305（2026-08-15）

### [v305] 改動: 教學新增世界地圖引導步
理由: UX 軸 — 世界地圖是主場景，新手教學 6 步完全沒提（頂欄地圖鈕易忽略）。
實作:
- js/ui/tutorial.js: STEPS 加第 7 步（探索世界地圖 — 點頂欄地圖鈕/點地名討伐/拖曳探索/灰霧解鎖）；TABS 加 "map"；targetFor idx=6 → #topbar .tb-btn
- index.html: 快取 310→311；js/data/changelog.js: v305 條目
驗證:
- 第 7 步卡片文字正確、地圖鈕高亮目標存在
- skip 相容（tutorial=7 直接跳過）; 完整迴歸通過; rm 靜態; 零 console error
- progress/v305-tutorial-map-step.webp
風險與回滾點: 教學步數變更（舊檔 tutorial<7 會從中間繼續 — 相容）；無數值影響。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 26 輪: 剩餘 backlog: 耐玩性（市場閉環/覺醒數值審查）、UX（紅點聚合審查）、地圖細節精修（海洋/探索度動態）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v304（2026-08-15）

### [v304] 改動: 地圖縮放 — 1×／1.5×／2× 循環
理由: 地圖軸 P2「桌機縮放」— 桌機大螢幕地圖固定 460×500 邏輯，無放大檢視。
實作:
- js/ui/map.js: VW/VH 改 let＋zoomLevel；標題列縮放鈕（1→1.5→2 循環，callback 重建 canvas width/height＋ctx.setTransform/scale＋clamp＋renderFrame＋placeLabels＋按鈕文字）
- index.html: 快取 308→310；js/data/changelog.js: v304 條目
驗證:
- 尺寸 460×500→306×333→230×250→460×500 完整循環；按鈕文字 1×/1.5×/2× 同步
- 2× 下村莊名牌可見、熱區可點（回城正常）; rm 靜態; 完整迴歸通過; 零 console error
- progress/v304-zoom.webp
風險與回滾點: 顯示層動態（世界座標/buildBase 不變）；名牌比例自動（VW/clientWidth）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 25 輪: 剩餘 backlog: 耐玩性（市場閉環/覺醒數值審查）、UX（教學強化/新手引導）、地圖（探索度/海洋細節可再精修）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v303（2026-08-15）

### [v303] 改動: 每日任務可達性修復 — 全收集後排除招募任務
理由: 耐玩性軸深測發現 — 六職業全收集玩家每日池「招募 2 名英雄」（d5）永不可達（無新英雄可抽），每天損失一任務。
實作:
- js/sys/meta.js: ensureDaily 池過濾 — CLASS_ELEMENT 六職業全有則排除 d5（僅影響每日池選取）
- index.html: 快取 307→308；js/data/changelog.js: v303 條目
驗證:
- 統計 20 次抽取: 單職業 d5 出現 12 次（60%≈5/9 期望）、全收集 0 次（完全排除）
- 任務 modal 正常開啟; 完整迴歸通過; 零 console error
- progress/v303-daily-quest-fix.webp
風險與回滾點: 任務池過濾（零數值變動）；全收集判定用 CLASS_ELEMENT 鍵（與英雄職業語義一致）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 剩餘 backlog: 地圖 P2（桌機縮放）、耐玩性（市場閉環/覺醒數值審查）、UX（教學強化/新手引導）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v302（2026-08-15）

### [v302] 改動: 模式地標道路連接 — 草原帶交通網
理由: 地圖軸 P1「模式地標道路/碼頭連接」— 模式地標孤立於草原，無道路連通感。
實作:
- js/ui/map.js: drawRoadSeg 抽取；MODE_ROADS 兩條支路（東門→競技場→公會→遠征→試煉；南巷→迷宮→深淵→塔→活動→世界首領）；烘焙進 buildBase
- index.html: 快取 306→307；js/data/changelog.js: v302 條目
驗證:
- roadPixels 689（土路色）；競技場入口召回後正常（戰鬥中攔截屬設計）
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v302-mode-roads.webp
風險與回滾點: 純烘焙繪製。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 剩餘 backlog: 地圖 P2（桌機縮放）、耐玩性（每日任務可達性深測/市場閉環）、UX（教學強化）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v301（2026-08-15）

### [v301] 改動: 地圖探索度顯示 — 已解鎖區進度
理由: 地圖軸 P1「探索度顯示」— 玩家不知道世界探索進度。
實作:
- js/ui/map.js: render sub 行右側加「探索 X/10 區」（maxRegionReached+1）；深淵解鎖追加「＋深淵」
- index.html: 快取 305→306；js/data/changelog.js: v301 條目
驗證:
- 「探索 4/10 區」（4 區解鎖）; 全解鎖「10/10」
- 完整迴歸通過; rm 靜態; 零 console error
- progress/v301-exploration-progress.webp
風險與回滾點: 唯讀顯示。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 剩餘 backlog: 地圖 P1（模式地標道路/碼頭連接、區域地標 tier 2、桌機縮放）、耐玩性（每日任務可達性深測/市場閉環）、UX（教學強化/紅點聚合）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v300（2026-08-15）

### [v300] 改動: 記住地圖視角 — 切頁往返不丟位置
理由: 地圖軸 P1「記住視角」— 每次從副本/王國回地圖都重置村莊，頻繁往返找路煩。
實作:
- js/ui/map.js: savedView 閉包 {x, y, v}；render 讀取（v 比對防跨存檔錯位，無則村莊）；onHide 寫入
- index.html: 快取 304→305；js/data/changelog.js: v300 條目
驗證:
- 名牌 x: 604（初始）→ 293（拖曳 -300）→ 293（切走再回，精確恢復）
- 完整迴歸通過; rm 靜態; 零 console error
- progress/v300-view-memory.webp
風險與回滾點: 純閉包 UX 狀態（零存檔改動）；v 比對防錯位。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 剩餘 backlog: 地圖 P1（模式地標道路/碼頭連接、區域地標 tier 2、探索度顯示、桌機縮放）、耐玩性（每日任務可達性深測）、UX（教學/紅點聚合）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v299（2026-08-15）

### [v299] 改動: 地圖氛圍層 — 鳥群／螢火蟲／流星
理由: 地圖軸 P2「氛圍層（鳥群/螢火蟲/流星）」— 地圖動態豐富但天空/村莊氛圍薄弱。
實作:
- js/ui/map.js: drawAmbientFx — 鳥群 2 群（26s/35s 週期、不同高度、2 幀拍翅）；螢火蟲 8 隻（村莊草原帶漂浮＋閃爍）；流星（19s 週期、0.22 相位、對角線白尾）；rm 定幀（鳥定點/螢恆亮/無流星）
- index.html: 快取 303→304；js/data/changelog.js: v299 條目
驗證:
- 鳥群像素多幀移動（762→701→733 變化）
- 螢火蟲存在且移動（11803→11762→11820 變異）
- rm 靜態（toDataURL 相同）; 完整迴歸通過; 零 console error
- progress/v299-ambient-layer.webp
風險與回滾點: 純視覺小元素（2-3px）；rm 靜止。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 20 輪: 整體回顧 — 四軸 rubric 校準；剩餘 backlog: 地圖 P1（模式地標道路/碼頭連接、區域地標 tier 2、探索度顯示、記住視角、桌機縮放）、耐玩性（每日任務可達性深測/市場閉環）、UX（教學強化）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v298（2026-08-15）

### [v298] 改動: 農田互動 — 點擊收穫小麥
理由: 地圖軸 P2「農田互動（點擊收穫）」— 麥田純裝飾，無互動。
實作:
- js/ui/map.js: farmHarvestCd Map（每格 15s 冷卻）；wrap click 農田判定（WHEAT_TILES 迴圈 ±14px，寶箱判定前）；farmReward（80×1.35^(kl-1)）；drawFarmHarvestFx（0.5s 金粒飛散，rm 單幀）
- index.html: 快取 302→303；js/data/changelog.js: v298 條目
驗證:
- 收穫「+653 金」（80×1.35^7=Lv8 正確）
- 同格 10 連點 0 增益（冷卻）；不同格 +882（獨立 tile）
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v298-farm-harvest.webp
風險與回滾點: 閉包冷卻（reload 重置，彩蛋性質）；獎勵量級遠低於掛機。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 地圖 P2 剩「氛圍層（鳥群/螢火蟲/流星）」或耐玩性（每日任務可達性實測）或 UX（引導/紅點）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v297（2026-08-15）

### [v297] 改動: Boss 五機制視覺化 — 護盾罩／再生綠光／毒霧／吸血紅霧／震怒預警圈
理由: 動作軸 backlog「Boss 五機制可讀性（護盾裂紋/再生綠光/吸血紅鏈/衝擊預警圈+前搖）」— 機制只有關卡資訊文字，戰鬥中不可讀。
實作:
- js/ui/hunt.js: monsterView 傳 mech/t/aoeT/poisonT
- js/ui/render.js: 五分支 — shield（t<8 藍罩呼吸）、regen（<50% 綠光環＋回復十字）、poison（綠霧滴常駐）、lifesteal（暗紅霧，windup 前搖加深 1.6×）、aoe（aoeT<1.2 地面紅圈收縮）；rm 恆亮
- v297FIX: regen 亮度提高（白色龍對比不足）
- index.html: 快取 299→302；js/data/changelog.js: v297 條目
驗證:
- shield: 怪物區藍像素 91（t=3）vs 0（t=10）
- regen: 綠像素 189（hp 40%）vs 0（hp 80%）
- aoe: 紅圈 18px；lifesteal: 強制 mech 紅霧 105px
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v297-boss-mech-visuals.webp
風險與回滾點: 純視覺（monsterView 附加欄位，battle 時序零觸碰）；rm 恆亮。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 動作軸 backlog 已清（角色/小人/特效/機制/體型/前搖/狀態/屬性色）; 轉耐玩性軸（每日任務/覺醒閉環實測）或 UX 軸（更多分頁導覽/紅點聚合）或地圖 P2 剩（農田互動/氛圍層）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v296（2026-08-15）

### [v296] 改動: 每日地圖寶箱 — FNV 日種子確定性位置＋開箱獎勵
理由: 地圖軸 P2「每日地圖事件（流浪商人/寶箱 FNV 日種子）」＋重訪動機 — 每天回地圖找寶箱的理由。
實作:
- js/core/save.js: state.mapChest {day, opened} 預設＋normalize 補空（向後相容）
- js/ui/map.js: chestInfo()（FNV 日種子 → 區域+位置，確定性）；drawChest（呼吸金暈＋木箱金邊鎖扣，rm 定幀）；wrap click 優先寶箱判定（±18/14px）→ 金幣 1000×1.35^(kl-1)＋素材×4＋15% 鑽石×5
- index.html: 快取 298→299；js/data/changelog.js: v296 條目
驗證:
- 開箱「開啟每日寶箱！+ 8172 金・神話殘片 ×4」（Lv8: 1000×1.35^7=8172 正確）
- 開過後區域金像素 0（消失）；模擬換日後二次開箱成功（重生）
- 存檔含 mapChest; rm 靜態; 完整迴歸通過; 零 console error
- progress/v296-daily-chest.webp
風險與回滾點: 新存檔欄位（normalize 補空）；獎勵量級遠低於掛機（不破經濟）；FNV 種子含 kingdomName/v 防同一天全服同點。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 耐玩性軸（每日任務招募瓶頸觀察/覺醒閉環）或動作軸（技能特效質感/擊殺消散）或地圖 P2 續（農田互動/氛圍層鳥群螢火蟲）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v295（2026-08-15）

### [v295] 改動: 野外遭遇彩蛋 — 點野生怪物收服小獎勵
理由: 地圖軸 P2「野外遭遇（點野生怪物彩蛋）」— 野生怪物純裝飾，互動性零。
實作:
- js/ui/map.js: wildlifeHits（每幀視口內怪物畫布座標）＋wildCooldown Map（i:j → 下次可點）；wrap click listener（suppressClick 檢查→命中 ±16px→金幣 300×1.35^(kl-1)＋toast＋60s 冷卻）
- index.html: 快取 297→298；js/data/changelog.js: v295 條目
驗證:
- 收服野生史萊姆 +2451 金（Lv8，300×1.35^7 正確）
- 收服野生狼 +2451 金（另一隻獨立冷卻）
- 拖曳後點擊無獎勵（suppressClick）; rm 靜態; 完整迴歸通過; 零 console error
- progress/v295-wildlife-encounter.webp
風險與回滾點: 獎勵量級遠低於掛機產出（不破壞經濟）；冷卻存閉包（reload 重置 — 可接受彩蛋性質）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 耐玩性軸（每日任務招募瓶頸觀察/市場消耗閉環）或動作軸（技能特效質感）或地圖 P2 續（農田互動/每日地圖事件 FNV 日種子）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v294（2026-08-15）

### [v294] 改動: 馬車路徑快取 — 每幀效能優化
理由: backlog 技術項「每幀效能 profile（馬車路徑快取）」— drawCart 每幀呼叫 roadPoints（22 點＋fbm 雜訊），結果只依 upTo 決定。
實作:
- js/ui/map.js: roadCache {upTo, pts}＋roadPointsCached(upTo)（upTo 不變即重用）；drawCart 改用快取
- index.html: 快取 296→297；js/data/changelog.js: v294 條目
驗證:
- 60fps（120 frames/2s、avg 16.7ms）; 馬車動畫正常（幀間 diff >50）
- rm 靜態; 完整迴歸通過; 零 console error
- progress/v294-road-cache.webp
風險與回滾點: 純優化，結果逐位元一致；upTo 為 maxRegionReached 衍生值，解鎖時自動失效重算。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 耐玩性軸實測（每日任務招募瓶頸/市場消耗閉環）或動作軸（技能特效質感/擊殺消散）；或地圖 P2（農田互動/野外遭遇）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v293（2026-08-15）

### [v293] 改動: 海洋活化 — 海岸燈塔＋漁船巡航
理由: 地圖軸 P1「海洋活化（漁船/燈塔）」— 海洋只有靜態波紋，無生命感。
實作:
- js/ui/map.js: drawLighthouse（蒼穹之塔東南角 44.5,24.2，白塔紅紋金燈烘焙進 buildBase）；drawSeaFx（光束 2.4s 緩掃＋漁船 16s 東→西往返，木船+米白帆+起伏；rm 定幀）；rm 分支同步呼叫
- index.html: 快取 295→296；js/data/changelog.js: v293 條目
驗證:
- 像素（全解鎖右下視口）: towerRed 166（燈塔紅紋）/ lampGold 634 / sailCream 91（船帆）
- 視覺模型: 確認燈塔「白色塔身+紅色橫紋+頂端金燈，位於海岸邊」
- rm 靜態; 完整迴歸通過（拖曳抑制吞首擊屬正確行為）; 零 console error
- progress/v293-sea-lighthouse-boat.webp
風險與回滾點: 燈塔烘焙（buildBase 一次成本）、光束/漁船輕量 fill；純視覺。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 地圖軸 P1 剩「區域地標 tier 2」或「模式地標道路/碼頭連接」；或轉耐玩性軸（每日任務可達性實測/循環閉環）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v292（2026-08-15）

### [v292] 改動: 村莊生活感 — 街道路燈＋南廣場攤位
理由: 地圖軸 P1「村莊生活感（路燈/攤位/更多村民）」— 村莊有建築/路樹/水井，但街道空曠無生活道具。
實作:
- js/ui/map.js drawVillage: 6 盞路燈（3.6/13.9 街道兩側＋6.4/11.6 中街，黑柱+暖黃燈罩）；南廣場 3 攤位（木台+紅棚+貨物色塊）
- index.html: 快取 294→295；js/data/changelog.js: v292 條目
驗證:
- 像素: lampGold 628（燈罩）/ stallRed 133（紅棚）/ stallWood 1438（攤台）
- minimap 跳轉、rm 靜態、完整迴歸通過; 零 console error
- progress/v292-village-lamps-stalls.webp
風險與回滾點: 烘焙進 buildBase 靜態層，零每幀成本；純視覺。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 地圖 P1 續: 海洋活化（漁船/燈塔）或區域地標 tier 2；或耐玩性軸（每日任務可達性實測）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v291（2026-08-15）

### [v291] 改動: 小地圖導航 — 96×60 縮略＋視口框＋點擊跳轉
理由: 地圖軸 P1「小地圖導航（96×60 minimap+跳轉）」— 大世界捲動無方向感，找路靠記憶。
實作:
- js/ui/map.js: mmCanvas/mmCtx；render 建立 96×60 minimap（右下角 zIndex 4，pointerdown stopPropagation）；drawMinimap() 每幀繪製（村莊白/解鎖綠/鎖定灰/模式金點＋視口白框，base 座標比例）；click 跳轉（fx/fy × BASE → offX/offY，clamp）
- index.html: 快取 293→294；js/data/changelog.js: v291 條目
驗證:
- minimap 像素: 背景 5760 全填、綠 6、白 4、金 16（4 區解鎖態）
- 點右下 → 視口跳轉顯示世界首領/深淵名牌；點左上 → 回村（村莊名牌現身）
- 視覺模型確認小地圖面板＋白框＋綠色點群
- 完整迴歸通過; 零 console error（注意: 瀏覽器 tab 失焦會暫停 rAF — 環境現象非遊戲 bug）
- progress/v291-minimap.webp
風險與回滾點: 純 DOM+canvas 疊加層；每幀 96×60 重繪成本 <0.1ms。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 地圖 P1 續: 海洋活化（漁船/燈塔）或村莊生活感（路燈/攤位）；或耐玩性軸（每日任務可達性/循環閉環實測）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v290（2026-08-15）

### [v290] 改動: 傷害數字屬性色 — 元素克制顯示職業元素色
理由: 動作軸 backlog「傷害數字質感（暴擊大字/屬性色）」— 暴擊大字已有，屬性色缺；元素克制 +25% 的生效瞬間無視覺辨識。
實作:
- js/ui/hunt.js: dmgColor(crit) — e.el（克制布林）時取 CLASS_ELEMENT[e.cls] 元素色；三路浮字（近戰/遠程延遲/英雄出手）統一
- index.html: 快取 292→293；js/data/changelog.js: v290 條目
驗證:
- 注入克制 hit 事件（dmg 9999）→ 視覺模型確認 -9999 冰藍色（騎士冰元素）
- 注入非克制事件（dmg 567）→ 白色（152 白像素）
- 完整迴歸通過; rm 地圖靜態; 零 console error
- progress/v290-element-dmg-color.webp
風險與回滾點: 純著色（事件語義/數值零變動）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 動作軸 backlog 已清大半（四方向/多樣化/前搖/血條/光圈/屬性色）；轉耐玩性軸（循環閉環/選擇意義）或地圖 P1（小地圖導航 minimap／海洋活化）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v289（2026-08-15）

### [v289] 改動: 英雄狀態腳下光圈 — 護盾藍／嘲諷紅／增益金
理由: 動作軸 backlog「狀態視覺化（腳下光圈/頭頂環）」— 現有狀態只有頭頂小圖示/文字，戰場中易忽略；腳下光圈增加即時可讀性。
實作:
- js/ui/render.js drawBattle: 英雄腳下雙橢圓環（9/12px 呼吸脈動 alpha 0.2-0.32）— shield 藍/taunt 紅/buffed 金；死亡不繪；rm 恆亮 0.28
- index.html: 快取 290→291；js/data/changelog.js: v289 條目
驗證:
- 精確採樣（英雄座標 60,206 區域）: 護盾 44 藍像素 vs 無護盾 0；嘲諷 178 紅像素
- rm: 光圈三幀 56/56/56 恆定; 完整迴歸通過; 零 console error
- progress/v289-status-auras.webp（護盾+嘲諷雙光圈）
風險與回滾點: 純繪製層（status 陣列既有語義）；rm 恆亮。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 動作軸續: 技能特效質感（屬性色傷害數字/技能命中特效差異化）；或耐玩性軸（市場/覺醒閉環）; 或地圖 P1（小地圖導航 minimap）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v288（2026-08-15）

### [v288] 改動: 怪物行動前搖 — 攻擊前蓄力抖動
理由: 動作軸 backlog「行動前搖（0.15-0.25s 抖動/蓄力）」— 怪物攻擊純計時無視覺預告，出手瞬間不可讀。
實作:
- js/ui/hunt.js: monsterView 加 windup（F.mAtk 剩餘秒）
- js/ui/render.js drawBattle: mAtk < 0.22s 且非 rm/受擊/凍結/死亡 → 快速抖動（sin 46Hz × 2.2px）＋微下沉（|sin| × 1.2px）
- index.html: 快取 289→290；js/data/changelog.js: v288 條目
驗證:
- 強制 mAtk=0.15: 怪物區域幀間 diff 226/380/289 px（抖動劇烈，遠超踱步 2px）
- rm: toDataURL 靜態（無抖動）; 完整迴歸通過; 零 console error
- progress/v288-monster-windup.webp
風險與回滾點: 純繪製位移（battle 時序契約零觸碰）；rm 靜止。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 動作軸續: 技能特效質感（屬性色傷害數字/技能命中特效差異化）或英雄/怪物狀態視覺化（護盾/增益腳下光圈）; 或耐玩性（循環閉環）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v287（2026-08-15）

### [v287] 改動: 怪物血條升級 — Boss 加粗＋瀕死脈動警訊
理由: 動作軸 backlog「怪物體型分級（Boss 1.3-1.6×＋血條加粗＋瀕死閃紅）」— 體型分級已有（普通 2/Boss 3），但血條統一 6px、無瀕死回饋。
實作:
- js/ui/render.js drawBattle: 血條高度 boss 9px／普通 6px；低血量 <25% 且非 rm → 紅色脈動（sin 12Hz，alpha 0.55±0.45）＋金邊脈動；rm 走恆亮分支；名字 y 隨血條高度自動下移
- index.html: 快取 288→289；js/data/changelog.js: v287 條目
驗證:
- 哥布林王 boss 戰: 血條渲染（pink 1388px）
- 強制 hp=8%: 多幀採樣 red 0→15→171 脈動＋金邊 1367px 出現
- rm: 恆亮無金邊（red 27→24 微差為其他元素）；完整迴歸通過; 零 console error
- progress/v287-boss-lowhp-bar.webp（低血量脈動幀）
風險與回滾點: 純視覺（render.js 血條分支），rm 恆亮；名字位置自動偏移無遮擋。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 動作軸續: 行動前搖（怪物 0.15-0.25s 蓄力抖動）或技能特效質感（屬性色傷害數字）；或耐玩性（循環閉環）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v286（2026-08-15）

### [v286] 改動: 模式地標狀態 pin — 世界首領剩戰／活動剩天／遠征進行中
理由: backlog 地圖軸 P1「新系統 pin（世界首領倒數/活動/遠征）」— 玩家開地圖無法一眼得知世界首領剩幾次、活動剩幾天，重訪動機埋沒在 modal 裡。
實作:
- js/ui/map.js: modeState(i) — 名牌文字加狀態（worldboss.left → 「剩 N 戰/已討伐」；events.current 週餘 → 「剩 N 天/最後一天」；expedState.active → 「進行中 N」）；try/catch 回空字串；mk 呼叫處拼接
- index.html: 快取 287→288；js/data/changelog.js: v286 條目
驗證:
- 名牌: 世界首領「剩3戰」、限時活動「剩1天」（週六實測）、遠征鎖定無 pin
- 名牌防碰撞仍零重疊（加寬後自動處理）; 世界首領 modal 開啟; reducedMotion 靜態; 完整迴歸通過; 零 console error
- progress/v286-mode-state-pins.webp
風險與回滾點: 唯讀顯示（modeState try/catch 保護）；不觸數值/存檔語義。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 整體回顧輪（已滿 6 輪）: 重讀四軸 rubric 校準優先級；候選: 耐玩性軸（循環閉環審查/市場消耗端）、動作軸（技能特效質感/傷害數字屬性色）、地圖 P1（小地圖導航/海洋活化）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v285（2026-08-15）

### [v285] 改動: 模式地標主題動畫 — 對齊區域地標動態水準
理由: backlog 地圖軸 P0「模式地標精緻化（對齊區域地標水準）」— 區域地標有風車/旗幟/火焰主題動態，模式地標只有呼吸光暈＋鎖定遮罩＋徽章點。
實作:
- js/ui/map.js: MODE_FX 陣列（10 個主題小動畫，drawModeFx 每地標尾呼叫，rm 傳入靜止幀）— fxFlag（競技場/公會紅旗飄動）、fxCrown（王者金冠閃爍）、fxRune（試煉符文脈動）、fxBonePulse（世界首領紅點脈動）、fxSpireGlow（元素塔四向光芒）、fxHedgeLight（迷宮金燈呼吸）、fxNoticeFlash（活動公告閃爍）、fxStairsGlow（深淵幽光上浮）、fxCampFire（遠征營火跳動）
- index.html: 快取 286→287；js/data/changelog.js: v285 條目
驗證:
- 多幀像素採樣（5 幀 × 150ms）: red 57→72、gold 649→675 — 動畫元素活躍變化
- progress/v285-mode-landmark-fx.webp（放大 2.3× 模式地標帶）
- reducedMotion 靜態（toDataURL 相同）; 完整迴歸通過（拖曳抑制吞首擊後第二擊正常開競技場 — 正確行為）; 零 console error
風險與回滾點: 純視覺小元素（2-6px），rm 靜止；MODE_FX 索引與 MODES 對齊（同 MODE_LM 契約）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 四軸輪替: 耐玩性軸審查（每日任務/循環閉環/選擇意義）或動作軸續（戰鬥特效質感升級）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v284（2026-08-15）

### [v284] 改動: 新區解鎖慶祝 — 地圖自動捲動＋金環煙火
理由: backlog 地圖軸 P0「解鎖回饋（新區金環+煙火）」— 解鎖僅有副本內閃屏＋toast，回到地圖無慶祝；且新區常在視口外，玩家看不到解鎖瞬間。
實作:
- js/ui/map.js: drawUnlockFx（2.8s 金環兩環交錯擴張＋12 向煙火＋上升火花；rm 靜止金環）；drawFx 開頭跨畫面追蹤 maxRegionReached（lastMaxRegionSeen 閉包，首載 null 不慶祝）；觸發時 celebPan 平滑捲動（smoothstep 1s，loop 中執行，拖曳中不打斷）；rm 直接跳
- index.html: 快取 285→286（sed 一次跳 284→286 因中途 bump）；js/data/changelog.js: v284 條目
驗證:
- 像素: 慶祝中 brightGold 416 vs 基線 ~50（新頁面乾淨狀態測試）
- 視覺模型: 荒漠地標上確認空心金色圓環輪廓（放大截圖 progress/v284-unlock-celebration.webp）
- auto-pan: 解鎖後名牌「黃沙荒漠 0」進入視口
- reducedMotion 靜態（toDataURL 相同）；完整迴歸（王國→副本派遣→英雄→裝備→建築→更多→地圖→模式 modal→回城）通過；零 console error
風險與回滾點: 純視覺＋視口捲動（不動數值/存檔）；celebrPan 僅在無拖曳時執行，拖曳即取消。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 地圖軸 P0 剩「模式地標精緻化（對齊區域地標水準）」，或轉耐玩性軸（每日任務/循環閉環審查）。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v283（2026-08-15）

### [v283] 改動: 地標本體 44px 觸控熱區＋拖曳誤觸點擊修復
理由: 地圖軸 P0 backlog「地標本體點擊（44px 觸控區）」— 名牌僅約 22px 高，低於觸控 44px 下限；地標圖示本體不可點。
實作:
- js/ui/map.js: hitZones 陣列＋mkHit()（44×44 隱形熱區，zIndex 2 介於 canvas 與名牌間）；村莊/10 區/10 模式各一，點擊行為與名牌同源（clickRegion/clickMode/show kingdom）；placeLabels 同步捲動定位；render 掛載 wrap
- css/extra.css: .map-hit hover 金色細框提示（@media hover:none 隱藏）
- 修復拖曳誤觸：原 `if (drag && drag.moved)` 在 pointerup 後 drag=null 失效 → onUp 設 suppressClick，click handler 吞掉一次
- index.html: 快取 283→284；js/data/changelog.js: v283 條目
驗證:
- 21 熱區掛載（1 村莊+10 區+10 模式），44×44px，村莊熱區中心 (630,366) 對應名牌 (607,298)
- 行為: 村莊熱區→王國畫面、競技場熱區→modal、區域 0 熱區→副本（region 0 stage 1）、鎖定區熱區→toast＋停留
- 拖曳穿過熱區後 click 被抑制（dragReleaseModal=false），純點擊正常（tapModal=true）
- progress/v283-map-hit-zones.webp（熱區強制金色顯示）
- reducedMotion 靜態；完整迴歸（王國→副本派遣→英雄→裝備→建築→更多→地圖→模式 modal→回城）通過；零 console error
風險與回滾點: 熱區為 DOM 互動層，不觸渲染/數值；suppressClick 旗標影響名牌點擊判定（拖曳後吞一次 click — 正確行為）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 地圖軸 P0 續: 模式地標精緻化（對齊區域地標水準）或解鎖回饋（新區金環+煙火）；或耐玩性軸檢查。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v282（2026-08-15）

### [v282] 改動: 村莊小人行為多樣化 — 農夫/小孩/商人
理由: 動作軸續 — v281 完成四方向後，backlog「行為多樣化（商人/農夫/小孩）」為下一缺口：所有村民同速漫步＋同長暫停，身份無差異。
實作:
- js/ui/map.js: want 清單 v1/v2/v3 三村民；v1 農夫（#7ec86a 綠衣草帽、speed 0.26、preferFarm、homeNode 10 南巷）、v2 小孩（#6ab8ff 亮藍、speed 0.52、pause 300-1100 好動）、v3 商人（#e0705a 紅衣深帽、speed 0.32、preferGate、homeNode 9 東門）；駐足 isHome ×2.2；目標偏好農田節點 10/11 與東門 9
- index.html: 快取 282→283；js/data/changelog.js: v282 條目
驗證:
- 像素掃描（getImageData 兩幀取色）: farmer 綠 2773 px / merchant 紅 887 / child 藍 13（單隻 6×11px 合理）— 三身份皆渲染
- progress/v282-village-diverse-townies.webp: 村莊實景
- reducedMotion 靜態（toDataURL 相同）; 完整迴歸通過（競技場 modal 非戰鬥態開啟 — 戰鬥中攔截屬設計）; 零 console error
風險與回滾點: 純視覺行為（速度/暫停/配色），不觸數值/存檔/battle 契約; 英雄與流浪英雄路徑不變。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 四軸輪替: 耐玩性軸或戰鬥呈現軸。診斷時開地圖看小人行走＋打一場副本看戰鬥特效（技能質感/傷害數字/擊殺消散），選最弱項。

## 前輪: v281（2026-08-15）

### [v281] 改動: 地圖小人四方向行走（FF1 語彙）＋四幀走路循環
理由: 動作軸最弱 — 診斷開地圖看小人: drawTownie 只有左右鏡像 2 幀（flip 布林），無前/後向、走路循環僅 2 幀（280ms），違反「地圖小人 4 方向都要」的 FF1 契約; 主場景靈魂的呈現是最短板。
實作:
- js/ui/map.js: drawTownie(px,py,bodyC,headC,fr,dir) 四方向 — 正面（髮頂＋完整臉 4×3）、背面（全髮無臉＋身體 shadeHex -70 背光）、左/右側面（側臉）; 走路 4 幀（240ms: bob=fr%2 浮動 × legA=fr>>1 腿相位）; walkerStep 方向判定（等角主軸 (vx,vy)=(dc-dr,dc+dr), |vx|≥|vy| 側面否則前/後）
- index.html: 快取 281→282; js/data/changelog.js: v281 條目
驗證:
- progress/v281-townie-4dir-sheet.png: 3 角色 × 4 方向 × 4 幀並排放大對照（一致性: 同角色四向髮色/身體色一致）
- 像素級驗證（getImageData 4× 放大）: 正面 skin 192px＋髮 256px / 背面 skin 0px＋髮 480px / 側面 skin 64px — 四方向特徵明確
- progress/v281-map-townies-walking.webp: 村莊實景截圖
- reducedMotion 靜態（兩幀 toDataURL 相同）; 完整迴歸（王國→副本派遣 fight→英雄→裝備→建築→更多→地圖→競技場 modal→回城）通過; 零 console error
風險與回滾點: 純視覺改動（繪製分支＋方向字串），不觸數值/存檔/battle 契約; drawTownie 唯一呼叫點在 map.js。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 動作軸續: 地圖小人行為多樣化（商人/農夫/小孩不同外觀與節奏、與地標互動駐足）或戰鬥特效（技能質感/傷害數字/擊殺消散）; 診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v280（2026-08-15）

### [v280] 改動: 世界地圖加高填滿＋名牌防碰撞＋舊檔解鎖推導修復（技術健康掃描輪）
理由: 第 1 輪技術健康掃描 — 技術軸基本健康（零 console error、單幀渲染 3.3ms、buildBase+render 9.4ms、61fps 王國/地圖幀成本 3.3ms、記憶體零增長、離線收益 3h→25.5 萬金、拖曳捲動正常），最弱項是 UX/視覺軸: 等角地圖視窗 460×350 只佔 stage 610px 的 56%，下方 188px 留白；且名牌重疊（幽暗森林↔灰燼洞穴 13×16px）與舊檔解鎖推導死碼（save.js normalize 中 base.maxRegionReached:0 覆蓋舊檔缺欄，maxTierReached 推導永不執行 → 舊玩家地圖全鎖 region 0）。
實作:
- js/ui/map.js: VW=460/VH=350 → 460/500（視窗加高填滿 stage）；placeLabels 名牌防碰撞（錨點 y 排序＋重疊下推，below/above 模式各自正確）；區名牌進度「x/10」→「x」（窄 22px 解開重疊根源）
- js/core/save.js: normalize 先讀 rawStats 再 Object.assign 合併 base（修死碼推導）
- index.html: 快取 279→281；js/data/changelog.js: v280 條目
驗證（headless Chrome GPU, 1280×720）:
- progress/v280-map-enlarged.webp: 地圖佔滿 stage、下方留白大幅縮減（canvas 344→483px，gap 188→49px）
- progress/v280-battle-regression.webp: 戰鬥畫面
- 名牌重疊 0 對（含拖曳 -200,-100 後）；21 名牌全數在畫布內
- 舊檔遷移: maxTierReached=2→maxRegionReached=2、無 tier→0、既有值 4 保留；零 console error
- 完整迴歸: 王國→副本（派遣 modal→派遣出征→fight phase→擊敗精英史萊姆 +93 金）→英雄→裝備→建築→更多→地圖→競技場 modal→回城 全通過
- reducedMotion: 地圖靜態幀（兩幀 toDataURL 相同）、零錯誤
風險與回滾點: 視窗加高後初始視角 offY clamp 到 0（村莊略靠上）— 屬可接受視野變化；名牌防碰撞為純 DOM 定位，若未來名牌佈局變動可直接停用下推迴圈；save.js 改動僅影響舊檔載入路徑，新檔無感。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 等角地圖軸 P0 續: 模式地標精緻化（對齊區域地標水準）或地標本體點擊（44px 觸控區）；或動作軸: 地圖小人 drawTownie 4 方向＋走路循環（FF1 契約）。診斷時先開地圖看小人行走＋打一場副本看戰鬥特效。

## Backlog 剩餘（依優先）
等角地圖軸:
- P0: 模式地標精緻化（對齊區域地標水準）、地標本體點擊（44px 觸控區）、解鎖回饋（新區金環+煙火）
- P1: 小地圖導航（96×60 minimap+跳轉）、模式地標道路/碼頭連接、新系統 pin（世界首領倒數/活動/遠征）、村莊生活感（路燈/攤位/更多村民）、區域地標 tier 2、海洋活化（漁船/燈塔）
- P2: 農田互動（點擊收穫）、野外遭遇（點野生怪物彩蛋）、每日地圖事件（流浪商人/寶箱 FNV 日種子）、氛圍層（鳥群/螢火蟲/流星）、探索度顯示、記住視角、桌機縮放
動作與戰鬥呈現軸:
- 角色: 4 方向走路幀（地圖用）、死亡幀、職業動作差異化（弓手拉弓/法師舉杖/刺客突刺/騎士盾頂）、待機隨機動作、畫風一致性審查
- 地圖小人: drawTownie 4 方向＋4 幀循環＋方向切換（BFS 主軸）、偶發動作、行為多樣化、與地標互動駐足
- 戰鬥特效: 技能質感、暴擊/格擋/閃避回饋、Boss 五機制可讀性、擊殺消散、傷害數字質感、鏡頭語言
- 英雄/怪物呈現: 狀態視覺化、技能就緒提示、死亡表現、怪物體型分級、行動前搖、陣型走位
技術項（穿插）: 迷霧邊緣柔化、每幀效能 profile（馬車路徑快取）

## 進行中改動
無（v280 已 commit 完成）
