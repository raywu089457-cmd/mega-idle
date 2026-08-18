# 放置王國 MEGA IDLE

**像素風放置經營 + 獵人 RPG（繁體中文）・純前端・無需建置・雙擊即可玩**

你繼承了祖父的舊王國「梅根」，率領獵人公會重建榮光——招募獵人、討伐魔物、鍛造神器、建設王國，讓獵人公會的名字重新響徹十個狩獵場。

## 遊玩

任選一種方式：

```bash
# 方式一：任何靜態伺服器
python -m http.server 8123
# 開啟 http://localhost:8123/

# 方式二：直接雙擊 index.html（支援 file://）
```

## 核心系統

- **放置狩獵**：10 個狩獵場 × 10 關 + 首領；獵人自動戰鬥、自動獲得金幣/經驗/裝備，離線也有收益（12 小時上限）
- **獵人**：6 職業（劍士/弓手/法師/刺客/騎士/牧師）、6★ 稀有度、技能樹、突破、訓練、自動編隊
- **流浪英雄**：流浪獵人在村中徘徊（心情/消費/狩獵外出/對話氣泡），點擊招募為領地英雄；公會等級越高來訪者越強
- **裝備**：7 部位 × 10 階、稀有度、強化 +15、寶石鑲嵌/融合、套裝（獵狼/熔岩/冰霜/龍鱗/獵風/不死鳥）、合成配方、分解
- **王國**：10 棟建築（王城/獵人公會/訓練場/鐵匠鋪/寶石工坊/藥水工坊/圖書館/倉庫/覺醒祭壇/市場）、銀階金階視覺變體、專精強化
- **Meta**：30 主線任務、每日任務、38 成就、30 天簽到、商店靈藥、圖鑑、覺醒（prestige）、首領首殺慶祝
- **戰鬥演出**：即時回合制自動戰鬥、傷害數字、暴擊、頭目五機制（再生/毒素/護盾/吸血/全體衝擊）、撤退復活倒數

## 技術

- 無框架、無建置步驟：原生 JavaScript（classic scripts）+ Canvas 2D 像素渲染 + DOM UI
- 全部美術為程式化生成/手繪像素圖（`js/data/art/`），音效音樂為 WebAudio 合成
- 存檔：localStorage 自動存檔（每 30 秒 + 關閉前），可匯出/匯入 base64
- 設計契約：`docs/DESIGN.md`（系統規格、檔案所有權、驗證流程）

## 開發

```bash
# 起伺服器後以行動裝置視角（390×844）開發；console 必須零錯誤
python -m http.server 8123
```

`progress/progress.html` 為 Three.js 建造進度頁。

## 自主品質迴圈（OMP inner loop）

設定：agent 每輪在主題範圍內「評審→檢討→實作→驗證」推進，由 `goal-loop.bat` 啟動的 `loop-trigger.js`
（30 秒心跳 + lock 防重疊 + K3 額度降級鏈）自動輪換 **5 條品質軌道**：

1. 遊戲數值平衡（`prompts/goal-balance.md`）
2. 村莊與王國美術優化（`prompts/goal-village-art.md`）
3. 戰鬥畫面美術優化（`prompts/goal-battle-art.md`）
4. QoL 與 UX（`prompts/goal-qol.md`）
5. TheoTown 世界地圖（`prompts/goal-theotown.md`，內部 5 子主題輪換）

啟動：雙擊 `goal-loop.bat`（會起 8123 靜態伺服器）。每輪以 `omp launch -p @prompts/goal-<track>.md @theme.txt`
跑獨立 agent；輪換狀態與軌道 backlog 記錄在 `progress/improvement-log.md`。預覽下一輪不落地動：
`node loop-trigger.js --dry`（只印 theme.txt 與 launch args，不寫檔不 spawn）。

## 授權

本專案為原創作品（不含任何 Evil Hunter Tycoon 素材/文字/版面）。
