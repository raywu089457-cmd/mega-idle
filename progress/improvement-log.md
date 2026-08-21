# 放置王國 MEGA IDLE — 長期改善日誌(品質多軌自動迴圈)

> 品質多軌自動迴圈:每輪依序 **遊戲數值平衡 → 村莊與王國美術優化 → 戰鬥畫面美術優化 →
> QoL 與 UX**,4 軌道輪完循環數 +1。
> 軌道由觸發器(loop-trigger.js 的 TRACKS)讀本檔狀態行決定,agent 不得自行更動軌道。
> 4 軌各有一份專屬 prompt(prompts/goal-<track>.md),聚焦「讓玩家玩更久」的單一最值得改善處。
> (v627 起:TheoTown 世界地圖軌道隨遊戲內地圖移除而撤除 — 村莊框美術由村莊軌道持續迭代)
> 原則是每一輪在指定軌道內找出單一改善處,先診斷(模擬/瀏覽器證據)再實作,依各 prompt 的驗證協議驗證後記錄。
> **模型分工(四段式,使用者指定全 K3 HIGH)**:每輪「取證(K3)→ 規劃(K3)→ 實作(K3)→ 評審(K3)」—
> 取證代理開瀏覽器/採樣寫證據包(progress/round-<R>-evidence.md,不選題);
> K3 規劃閘門(prompts/goal-planner.md,只讀)決定「只做哪一件事」並給方案(round-<R>-plan.md);
> 實作代理依方案實作並 commit;觸發器再啟動 K3 評審(prompts/goal-judge.md,只讀,
> 看 報告＋progress/ 截圖＋git diff)判 合格/不合格 — 合格才由觸發器推進狀態行輪次;
> 不合格開有限修正輪(沿用 [vN]),達上限採計前進。所有 agent 一律**不更動狀態行**。

## 軌道 backlog(各軌道輪次優先做未完成項,完成打 [x];prompt 檔的候選方向以此為準)

### 數值平衡軌道 backlog(新增 · 候選方向)
- [x] P1 中後期(區 5-10)金幣/素材收入 vs 強化 +10..+15/突破/建築升級/技能研讀成本曲線模擬驗證(v624 建築段；v644 強化 +10 起加深 ×1.35^(enhance-9)；v656 研讀 study≥5 ×1.4^(l-4) 總書 825→2208；v660 突破 n≥4 素材 ×1.35^(n-3))
- [x] P1 離線收益 1.2× vs 在線 ACTIVE_FOCUS +20% 長掛效率對比(倒掛檢查)(v588 完成：在線專注以 OFFLINE_RATE 為底齊平＋每層 +5% 超越 — 2h 離線/在線 1.171→1.021、8h 1.055→1.115、12h 1.036→1.132,12h 內倒掛消除且離線欄逐分不變)
- [x] P1 4 難度(普通/困難/地獄/夢魘)效率 parity audit(固定策略下無永遠劣勢的難度)(v583 完成：掉落每殺 ×難度倍率 → 金/經/掉落三軸全 parity)
- [x] P1 套裝 2pc/4pc、寶石、技能書研讀的邊際效益 vs 成本(v656 研讀；v664 套裝 2pc↓／4pc↑＋寶石融合金費)
- [x] P1 覺醒觸發時機(v640 完成：首覺醒門檻 r3-s5→r5-s5，模擬 13.3 天@0.5h/天，對齊 DESIGN 7-14 天目標；後期效應仍為候選)
- [x] P1 每日任務/成就/簽到獎勵 vs 主線收入比例(通膨)(v648：日課/簽到金幣 1.18^min(kl-1,20)；週任 1.15；成就鑽石仍固定 — 金幣通膨段收斂)
- [x] P1 商店藥水/加速券/高級招募券的價格-效果 ROI(v652：每日特惠金幣價 1.15^min(kl-1,18)；v660 商城招募券 80→100／五連 380→470；神話招募 300×1.06^min(n,25))
- [x] P1 首領五機制在 4 難度下是否被數值堆疊消解為純三圍比拼(v664：機制 ×難度 1/1.15/1.35/1.55；護盾持續延長)

### 村莊與王國美術軌道 backlog(新增 · 候選方向)
- [x] P1 待機動作補完(撓頭等;眨眼 v568/張望 v325 為基底)(v661：村民＋回城休息英雄偶發撓頭)
- [x] P1 村莊時段/季節色調(晝夜或黃昏色調層)(v649：dusk/night；v665：白天 day 6–17；季節仍候選)
- [x] P1 更多生活感(擺攤/小狗小貓/更多村民/炊煙/晾衣)(炊煙 v320、蝶 v326、旗 v327、動物 v641、晾衣 v645、小狗 v653、攤位 v657、小貓 v661)
- [x] P1 王國建築升級視覺變體豐富化(銀/金階之外的中間階或動態飾件)(v661 銅階；v665 銀階掛燈＋金階飄旗)
- [x] P1 村莊天空/雲/星夜遠景層次(v584:夜空對比修色 — 天空四段漸層加地平線光帶＋山體四級色階拉開,既有遠山/月霜/月光描邊浮現)

### 戰鬥畫面美術軌道 backlog(移自舊美術 backlog + 新增)
- [x] P0 職業動作差異化(弓手拉弓/法師舉杖/刺客突刺/騎士盾頂)
- [x] P1 技能特效質感(火球拖尾 v590；冰霜碎片 v643；雷鏈 v647；聖光柱 v651；斬擊弧 v655；毒雲/箭矢曳光/匕首扇刃 v659；護盾光環/治療爆發/火球爆環 v663)
- [x] P1 擊殺消散(怪物死亡粒子/漸隱)(v628 完成:垂死體 0.45s 上升消散[上飄 10px＋(1-p)² 漸隱不壓扁]＋6 顆體色碎片噴散[kills-hash 確定性]＋0.15s 命終白閃＋「擊敗！」merge 分道恆 1 層;地面壓扁殘影歸零,不再讀作第二隻活怪)
- [x] P1 怪物行動前搖(0.15-0.25s 抖動/蓄力)(v626 完成:修復 v549 前搖警示「!」z-order 倒置(被血條/名字整個蓋掉、結構性 0% 可見)＋錨點上移名字上方淨空帶＋rm 恆亮紅色靜態預告,攻擊預告真正可讀)
- [x] P1 狀態視覺化(腳下光圈/頭頂環:中毒/護盾/吸血/再生)(v630 完成中毒英雄側:毒擊後頭頂「毒」字＋腳下紫色毒圈持續4秒,單標記語義追蹤毒跳目標;護盾英雄側既有;吸血/再生 boss 側 v558 已量化)
- [x] P1 暴擊/首領登場額外演出(震屏/短暫凝滯/宣告加重)(v639完成暴擊:hit-stop 0.06→0.12s+5顆金色火花粒子噴散;首領登場既有宣告文字+震屏bossImpact 0.35/0/0.5)
- [x] P1 傷害數字可讀性(密集合併/大數字量級標示)(v585:同目標短窗合併＋分道錨點 — 浮字峰值 61→13、BOSS 不再被數字淹沒)

### QoL 與 UX 軌道 backlog(新增 · 候選方向)
- [x] P1 素材-需求雙向跳轉(素材總覽點某素材 → 哪區掉落/可做什麼)(v650：展開顯示掉落區鈕＋建築用途鈕，≤2 點擊前往)
- [x] P1 點按目標 44px 完整覆蓋 audit(小圖示/關閉鈕/分頁/下拉)(v586 完成；v658 補賣出數量列＋派遣目的地列)
- [x] P1 重要狀態常駐顯示(增益藥水/加速剩餘、連敗回退、離線上限)(v634 增益條；v658 狀態卡連敗 N/3＋自動進關暫停)
- [x] P1 離線收益結算頁一鍵領取/快速連續領取(v654：離線＋回歸合併「領取全部」；sticky≥44；點擊即入帳)
- [x] P1 新手教學/說明可重看(新周目或更多選單內 help 入口)(v642 完成：更多頁磁磚「重播教學」1 點擊開始；設定頁原入口保留)
- [x] P1 存檔匯出/匯入與備份提醒的可發現性(v638 設定列可見≥44px；v646 ≥3 天未匯出彈備份提醒，稍後再說 7 日內不重彈)
- [x] P1 空狀態與缺料提示(缺素材 → 標示取得來源)(v622 完成：建築卡缺料紅字逐項「缺 N(持 M)」＋缺料素材取得來源行,buy() 失敗 toast 帶缺額明細,消滅靜默死按鈕)
- [x] P1 高頻路徑縮短(派遣→編隊→強化之間最短切換)(v629 完成：副本頁新增「英雄」與「裝備」快捷導航按鈕，掛機時一鍵查看/強化隊伍不離開副本上下文)
- [x] P2 Esc 關閉非鎖定 modal(v658)
- [x] P2 Toast 點擊關閉／Modal ✕≥44／確認 Esc 取消(v662)
- [x] P2 一鍵領取/例行顯示可處理項數 N；數字鍵 1–6 切底欄(v666)

### (已撤除)世界地圖 TheoTown 軌道 — v627 隨遊戲內地圖移除;其村莊生活感類未完成項併入村莊美術軌道候選

## 輪換狀態(觸發器讀寫)

```
循環:14
輪次:56
當前主題:【戰鬥畫面美術優化】
下一主題:【遊戲數值平衡】
```

## 核心玩法(每輪改動前必讀;改動不得取代或破壞此清單)

- **放置狩獵迴圈**:10 獵場 × 10 關卡＋首領;派遣制(編隊出戰、滅團休息復活、召回、自動續戰/進關);加速;離線收益
- **獵人養成**:6 職業(劍士/弓手/法師/刺客/騎士/牧師,FF1 GBA 風格 v278 定案)、1-6★、等級 200、突破、技能槽、訓練、重塑
- **流浪英雄**:村民徘徊/點擊招募/公會等級影響來訪強度
- **裝備**:7 部位 × 10 階、強化 +15、寶石鑲嵌/融合、套裝、合成/分解
- **王國經營**:10 棟建築、升級視覺變體、專精強化
- **Meta 層**:主線/每日任務、成就、30 天簽到、商店靈藥、圖鑑、覺醒(prestige)、首領首殺
- **戰鬥演出**:即時自動回合戰、傷害數字、暴擊、首領五機制(再生/毒素/護盾/吸血/全體衝擊)、震屏
- **難度與容錯**:4 難度、連敗回退、持久血量與回血管道
- **村莊主場景(主頁村莊框)**:王國頁 480×200 村莊場景 — 10 棟建築、村民/流浪英雄走動、火把暖光、每日寶箱(v627 起自世界地圖遷入;世界地圖已移除,模式入口在「更多」頁、區域切換在副本頁 chips)

---


## 品質儀表板(自動更新)
- 最近 20 輪統計:
- 修正輪比例: 0% (0/20)
- 各軌道完成: 遊戲數值平衡:6 / 戰鬥畫面美術優化:2 / QoL 與 UX:4 / 村莊與王國美術:3 / 戰鬥畫面美術:4 / TheoTown 世界地圖:1
- 最近 5 輪: v640 遊戲數值平衡 / v639 戰鬥畫面美術優化 / v638 QoL 與 UX / v637 遊戲數值平衡 / v636 遊戲數值平衡
- 更新時間: 2026-08-21T08:27:44.990Z
---
---
---
---
---
---
---
---
### [v666] 軌道:【QoL 與 UX】(全局輪次 55・循環 14) — 本輪 ×3 項
改動:①一鍵領取全部 · N；②一鍵例行 · N；③數字鍵 1–6 切底欄
為何讓玩家玩更久:登入收菜/例行批次決策更快；桌機鍵盤少滑鼠往返
診斷證據:round-55-evidence A/B/C
實作:kingdom.js＋screens.js＋more.js＋style.css、changelog、index 665→666
驗證:a) ✓；b) claim/routine 標籤＋鍵切頁＋modal 擋鍵 ✓（round-55-v666-verify.json）
風險:純 UX；git revert 即可
---
### [v665] 軌道:【村莊與王國美術優化】(全局輪次 54・循環 14) — 本輪 ×3 項
改動:①白天時段；②銀階掛燈；③金階飄旗
為何讓玩家玩更久:晝夜完整循環＋升級動態飾讓回城更有「家」感
診斷證據:round-54-evidence A/B/C
實作:kingdom.js＋render.js、changelog、index 664→665
驗證:a) ✓；b) daySky＋銀/金像素＋碼 ✓（round-54-v665-verify.json）
風險:純視覺；git revert 即可
---
### [v664] 軌道:【遊戲數值平衡】(全局輪次 53・循環 14) — 本輪 ×3 項
改動:①首領機制×難度；②套裝2pc↓／4pc↑；③寶石融合金費
為何讓玩家玩更久:高難度首領仍有機制威脅、湊齊4pc更值、寶石升階吃金幣水槽
診斷證據:round-53-evidence A/B/C
實作:battle.js＋config＋equipment＋more.js、changelog、index 663→664
驗證:a) ✓；b) mul/sets/fuseFee ✓（round-53-v664-verify.json）
風險:僅數值；git revert 即可
---
### [v663] 軌道:【戰鬥畫面美術優化】(全局輪次 52・循環 14) — 本輪 ×3 項
改動:①護盾光環 ring；②治療爆發 healburst；③火球爆環 fireburst
為何讓玩家玩更久:輔助／治療／火法各有獨特命中語彙，掛機觀戰辨識再升
診斷證據:round-52-evidence A/B/C
實作:hunt.js＋render.js、changelog、index 662→663
驗證:a) ✓；b) ROI 像素＋rm 全 0 ✓（round-52-v663-verify.json）
風險:純演出；git revert 即可
---
### [v662] 軌道:【QoL 與 UX】(全局輪次 51・循環 13) — 本輪 ×3 項
改動:①Toast 點擊即關；②Modal ✕ 44px；③確認框 Esc＝取消（lock 窗仍擋）
為何讓玩家玩更久:日常摩擦降低——擋視線可立刻清、關閉達標、誤開確認可 Esc 退
診斷證據:round-51-evidence A/B/C
實作:dom.js＋style.css、changelog、index 661→662
驗證:a) ✓；b) toastDismiss/mx44/escCancel/lockSafe ✓（round-51-v662-verify.json）
風險:純 UX；git revert 即可
---
### [v661] 軌道:【村莊與王國美術優化】(全局輪次 50・循環 13) — 本輪 ×3 項
改動:①銅階屋脊(lvl3–4)；②廣場小貓；③村民＋休息英雄撓頭
為何讓玩家玩更久:升級中段可見、生活感＋待機動作讓回城更像「家」
診斷證據:round-50-evidence A/B/C
實作:kingdom.js＋hunt.js、changelog、index 660→661
驗證:a) ✓；b) copper/cat 像素＋rm hash 同＋撓頭碼 ✓（round-50-v661-verify.json）
風險:純視覺；git revert 即可
---
### [v660] 軌道:【遊戲數值平衡】(全局輪次 49・循環 13) — 本輪 ×3 項
改動:①突破 n≥4 素材 ×1.35^(n-3)；②神話招募 300×1.06^min(n,25)；③商城券 80→100／五連 380→470
為何讓玩家玩更久:後期突破／鑽石抽／商城券不再過輕，拉長養成與鑽石決策
診斷證據:round-49-evidence A/B/C
實作:hunters.js＋quests.js、changelog、index 659→660
驗證:a) ✓；b) earlyPromo/latePromo/gemSoft/shopTicket ✓（round-49-v660-verify.json）
風險:僅成本曲線；git revert 即可
---
### [v659] 軌道:【戰鬥畫面美術優化】(全局輪次 48・循環 12) — 本輪 ×3 項
改動:①毒雲 ②箭矢曳光 ③匕首扇刃（fx_poison/arrow/dagger 傷害首拍；rm 跳過）
為何讓玩家玩更久:刺客/弓手/毒技各有獨特視覺語言，掛機觀戰辨識提升
診斷證據:round-48-evidence A/B/C
實作:hunt.js＋render.js、changelog、index 658→659
驗證:a) ✓；b) cloud=1/streak=1/dagger=3、rm 全 0 ✓
風險:純演出；git revert 即可
---
### [v658] 軌道:【QoL 與 UX】(全局輪次 47・循環 12) — 本輪 ×3 項
改動:① Esc 關非鎖定 modal；② 狀態卡連敗 N/3＋自動進關暫停；③ 賣出數量列／派遣目的地 ≥44px
為何讓玩家玩更久:少摩擦捷徑、掛機狀態零點擊可讀、觸控不誤觸
診斷證據:round-47-evidence A/B/C
實作:dom.js、hunt.js、kingdom.js、changelog、index 657→658
驗證:a) node --check ✓；b) Esc 關/lock 不關、狀態文案含連敗+暫停、chipH=[44,44] ✓；e) round-47-v658-status/sell.png
風險:純 UX；git revert 即可
---
### [v657] 軌道:【村莊與王國美術優化】(全局輪次 46・循環 12)
改動:市場南側程序像素蔬果攤（棚＋桌＋3 貨物微晃；rm 定幀）
為何讓玩家玩更久:攤位補齊「有人做生意」符號，生活感 backlog 攤位子項完成
診斷證據:round-46-evidence 候選 1 — 攤位仍空
實作:js/ui/kingdom.js drawTownLife、changelog、index 656→657
驗證:a) node --check ✓；b) ROI 棚/三貨/木柱命中、rm hash 一致 ✓；e) round-46-v657-stall-4x-live.png
風險:純 fx 疊層；git revert 即可
---
### [v656] 軌道:【遊戲數值平衡】(全局輪次 45・循環 12)
改動:技能研讀 study≥5 書本成本 ×1.4^(l-4)；0-4 級不變；總書 825→2208
為何讓玩家玩更久:永久技能乘區若數小時封頂，後期書變死貨幣；加深後仍有多日研讀目標
診斷證據:round-45-evidence 候選 1 — 線性合計 825 書／中期約 8h 封頂
實作:js/sys/meta.js studyCost、changelog、index 655→656
驗證:a) node --check ✓；b) lv0-4=15..75、lv5=125>90、lv9=806、buyStudy✓、ratio≈2.68 ✓
風險:純成本曲線；git revert 即可
---
### [v655] 軌道:【戰鬥畫面美術優化】(全局輪次 44・循環 11)
改動:fx_slash 傷害技能首拍於怪物側繪製銀色斬擊弧（外弧＋白芯＋尖端火花）
為何讓玩家玩更久:近戰招牌技可讀弧光，掛機觀戰辨識與爽感提升
診斷證據:round-44-evidence 候選 1 — fx_slash 僅色塊粒子
實作:js/ui/hunt.js、js/ui/render.js、changelog、index 654→655
驗證:a) node --check ✓；b) arc=1+shard≥3、ROI silver≥96、rm 不噴 ✓；e) round-44-v655-live-4x.png
風險:純演出粒子；git revert 即可
---
### [v654] 軌道:【QoL 與 UX】(全局輪次 43・循環 11)
改動:離線與回歸合併為一窗「領取全部」；領取鈕 sticky≥44px；點擊即入帳（特效不擋）
為何讓玩家玩更久:起床收菜是最高頻回訪儀式；分窗+捲動+700ms 延遲打斷開局節奏
診斷證據:round-43-evidence 候選 1 — 雙窗＋可捲區底鈕＋700ms 延遲 apply
實作:js/main.js、js/sys/welcome.js（peekReturnGift）、changelog、index 653→654
驗證:a) node --check ✓；b) 合併標題/領取全部/1 modal/btn44+sticky/1 點金鑽入帳+returnTier/無第二回歸窗 ✓；e) round-43-v654-combined-modal.png
風險:純 UX＋回歸改點擊入帳；git revert 即可
---
### [v653] 軌道:【村莊與王國美術優化】(全局輪次 42・循環 11)
改動:村莊廣場程序像素小狗（棕身往返＋尾擺；rm 定幀佇立）
為何讓玩家玩更久:寵物是「家有生命」符號，補齊生活感小狗子項，回城第一屏更像家
診斷證據:round-42-evidence 候選 1 — backlog 寵物仍空
實作:js/ui/kingdom.js drawTownLife、changelog、index 652→653
驗證:a) node --check ✓；b) ROI body≥35/ear≥14/eye≥1、rm 雙次 hash 一致、零 Math.random ✓；e) round-42-v653-dog-4x-live.png／fx-live／kingdom-live
風險:純 fx 疊層；git revert 即可
---
### [v652] 軌道:【遊戲數值平衡】(全局輪次 41・循環 11)
改動:每日特惠金幣價改 1.15^min(kl-1,18) 軟封頂，修復後期 ROI 崩
為何讓玩家玩更久:日特惠是登入消費錨；永遠不划算就少一次回訪理由
診斷證據:round-41-evidence 候選 1 — kl30 沙漏舊≈1.04h
實作:js/sys/market.js、changelog、index 651→652
驗證:a) node --check ✓；b) kl1=8000、kl19=kl30、kl30≈0.22h<0.5、舊對照 1.04h ✓
風險:純定價；git revert 即可
---
### [v651] 軌道:【戰鬥畫面美術優化】(全局輪次 40・循環 11)
改動:fx_heal 傷害技能首拍於怪物側繪製聖光柱（金黃外圈＋白芯＋基座火花）
為何讓玩家玩更久:聖裁讀作天降之光，掛機觀戰儀式感與辨識度提升
診斷證據:round-40-evidence 候選 1 — fx_heal 僅粒子點
實作:js/ui/hunt.js、js/ui/render.js、changelog、index 650→651
驗證:a) node --check ✓；b) 即幀黃白命中、rm 不噴柱 ✓；e) round-40-v651-pillar-4x-live.png
風險:純演出粒子；git revert 即可
---
### [v650] 軌道:【QoL 與 UX】(全局輪次 39・循環 10)
改動:素材總覽展開顯示掉落區域與消耗建築按鈕，可一鍵切副本／建築頁
為何讓玩家玩更久:缺料卡點從「不知道去哪」變成「點一下就去農」，成長迴圈不斷裂
診斷證據:round-39-evidence 候選 1 — detail 僅靜態文案
實作:js/ui/kingdom.js、changelog、index 649→650
驗證:a) node --check ✓；b) 鐵礦石展開≥掉落區+建築、前往草原、未解鎖火山 toast ✓；e) round-39-v650-mats-expanded.png
風險:純 UI 互動；git revert 即可
---
### [v649] 軌道:【村莊與王國美術優化】(全局輪次 38・循環 10)
改動:村莊底景新增黃昏(dusk)時段色票，與既有夜景並列；牆鐘 17–20 自動切換
為何讓玩家玩更久:回城家若永遠同一夜色會鈍感；黃昏暖色讓每天回訪有時段變化
診斷證據:round-38-evidence 候選 1 — drawTown 固定夜空
實作:js/ui/render.js、js/ui/kingdom.js、js/ui/hunt.js、changelog、index 648→649
驗證:a) node --check ✓；b) dusk/night hash 各定、色票可分、黃昏偏暖 ✓；e) round-38-v649-sky-4x-*.png
風險:純底景色票；git revert 即可
---
### [v648] 軌道:【遊戲數值平衡】(全局輪次 37・循環 10)
改動:日課/簽到金幣縮放改 1.18^min(kl-1,20)；週任 1.15；消除後期日課印鈔
為何讓玩家玩更久:日課若等於百小時掛機金，玩家只領日課不掛機；軟化後主迴圈仍是主收入
診斷證據:round-37-evidence 候選 1 — kl30 舊公式 ≈135h 農場當量
實作:js/sys/meta.js、changelog、index 647→648
驗證:a) node --check ✓；b) kl1=2000、kl21=kl30 封頂、kl30 dailyH≈0.6<1、舊對照 135h ✓
風險:純獎勵縮放；git revert 即可
---
### [v647] 軌道:【戰鬥畫面美術優化】(全局輪次 36・循環 9)
改動:連鎖閃電施放時繪製英雄→怪物確定性折線雷鏈（白芯金黃邊）＋命中火花
為何讓玩家玩更久:法師招牌技能從「火花點」變成可見電弧，掛機觀戰辨識與爽感提升
診斷證據:round-36-evidence 候選 1 — fx_spark 無折線
實作:js/ui/hunt.js、js/ui/render.js、changelog、index 646→647
驗證:a) node --check ✓；b) 即幀黃/白像素命中、rm 不噴、零新增 Math.random ✓；e) round-36-v647-bolt-4x-live.png
風險:純演出粒子；git revert 即可
---
### [v646] 軌道:【QoL 與 UX】(全局輪次 35・循環 9)
改動:帳齡≥3 天且從未匯出時啟動彈備份提醒（立即下載／稍後再說）；normalize 補 st.backup
為何讓玩家玩更久:備份是長線投入的安全感底線，主動提醒降低清資料/換機一次流失
診斷證據:round-35-evidence 候選 1 — 無提醒路徑、done-when 提醒半邊未完成
實作:js/core/save.js、js/main.js、js/ui/more.js、changelog、index 645→646
驗證:a) node --check ✓；b) 4d 彈／稍後不重彈／1d 不彈／匯出後不彈／鈕≥44px ✓；e) round-35-v646-backup-modal.png
風險:純 UX＋optional 欄位；git revert 即可
---
### [v645] 軌道:【村莊與王國美術優化】(全局輪次 34・循環 9)
改動:王國村莊框倉庫南側新增晾衣繩（兩柱＋繩＋3 件糖果色衣物確定性微擺）
為何讓玩家玩更久:晾衣是「有人住」的日常符號，補齊 backlog 晾衣子項，回城第一屏更像家
診斷證據:round-34-evidence 候選 1 — drawTownLife 無晾衣段
實作:js/ui/kingdom.js drawTownLife、changelog、index 644→645
驗證:a) node --check ✓；b) ROI 莓紅/天藍/薄荷三色均命中、rm 雙次 hash 一致、無新增 Math.random ✓；e) round-34-v645-clothes-4x-live.png 等
風險:純 fx 疊層；git revert 即可
---
### [v644] 軌道:【遊戲數值平衡】(全局輪次 33・循環 9)
改動:裝備強化 enhance≥10 附加成本 ×1.35^(enhance-9)，加深 +10→+15 金幣水槽（e0-9 不變）
為何讓玩家玩更久:中後期強化是每日金幣出口；過便宜會讓玩家「點完強化→金幣閒置→登入無目標」。拉回數小時級單件節奏後，每次登入仍有強化可做，同時長線全隊仍需多日
診斷證據:round-33-balance-probes.json — r4@525k/h tier5 單件 0.76h/英雄 5.3h；backlog 強化反向面
實作:js/data/equipment.js enhanceCost、changelog、index 快取 643→644
驗證:
a) node --check equipment.js ✓
b) 同支模擬: e0/e9 成本不變；e10 ×1.35；r4 單件 0.76→2.51h、英雄 5.3→17.6h、全隊(forge10) 16→52.7h；引擎 enhanceCost(forge10) 對 e10=24535 與公式一致 ✓
c) 無 schema；鐵匠折扣仍乘 ✓
d) Playwright 零 error ✓
e) progress/round-33-v644-sim.json
f) 數值軌以降級：模擬表為主
風險:高強化玩家短期變貴 — 預期；指數 1.35 可微調
---
### [v643] 軌道:【戰鬥畫面美術優化】(全局輪次 32・循環 9)
改動:冰霜技能(icon=fx_ice)施放時於怪物側噴散 6 顆確定性冰色碎片（仿暴擊火花角度表）
為何讓玩家玩更久:法師/弓手冰系主動技是高頻掛機畫面；改前單顆 fx_ice 讀作靜態冰塊，爽感遠低於火球拖尾；補上碎片噴散後每次冰技能有可辨「炸開」回饋
診斷證據:round-32-evidence.md 候選 1（強）— skill 路徑單粒子＋backlog 冰霜碎片未完成
實作:js/ui/hunt.js（spawnIceShards＋skill case fx_ice 首拍觸發；核心粒子 scale 1.4）、js/data/changelog.js（v643）、index.html（快取 642→643，54 處）
驗證(協議 a-f 逐項):
a) 語法:node --check js/ui/hunt.js 通過 ✓
b) 邏輯:注入 _spawnIceShards → shardCount=6、全部帶非零速度、色票冰系；rm=true → shardCount=0；新增碼無 Math.random ✓
c) 回歸:非冰技能不走 ice 分支；粒子池 64 上限沿用 ✓
d) 實機:Playwright 1280×800 零 pageerror ✓
e) 截圖:progress/round-32-v643-ice-1x.png、round-32-v643-ice-4x.png、round-32-v643-rm-1x.png
f) 視覺降級:截圖自檢＋粒子數字；inspect_image 不可用已註明
風險與回滾:純演出分支；git revert 即可
---
### [v642] 軌道:【QoL 與 UX】(全局輪次 31・循環 8)
改動:更多頁磁磚網格新增「重播教學」捷徑，點擊直接重播新手教學（設定頁原入口保留）
為何讓玩家玩更久:回流與新周目玩家需要快速回看核心規則；改前更多→設定→重播教學需 3 次點擊，教學藏在系統設定降低可發現性；放到更多頁後 1 次點擊即可開始，減少「忘了怎麼玩就關遊戲」的流失
診斷證據:round-31-evidence.md 候選 1（強）— probes.moreRows 無教學列、settings 內重播教學 h=59；backlog done-when「更多頁可見、≤2 步」未滿足
實作:js/ui/more.js（TILE_DEFS 於設定前插入 icon_book「重播教學」→ tutorial.start(true)）、js/data/changelog.js（v642）、index.html（快取 641-fix2→642，54 處）
驗證(協議 a-f 逐項):
a) 語法:node --check js/ui/more.js 通過 ✓
b) 邏輯/互動(Playwright):更多頁存在「重播教學」磁磚 h=92≥44；從更多頁 1 次點擊後 .tut/.tut-card 可見且文案含歡迎/略過；設定頁仍有重播教學列 ✓
c) 回歸:設定入口保留；核心分頁切換零 console error ✓
d) 實機:行動 390×844 DPR2＋桌機 1280×800，零 pageerror ✓
e) 截圖:progress/round-31-v642-more-mobile.png（更多頁可見重播教學磁磚）、round-31-v642-tut-mobile.png（點擊後教學覆蓋層）
f) 視覺/審美:純 UX 入口，inspect_image 降級為截圖自檢＋互動步驟序列
風險與回滾點:僅新增磁磚一列；git revert 即還原；設定雙入口可接受
---
### [v641] 軌道:【村莊與王國美術優化】(全局輪次 30・循環 8)
改動:把 v262 已繪製的村莊動物精靈(a_chicken×2、a_pig×1)接回王國場景 drawTownLife 渲染管線，3 隻動物在農田帶與廣場右緣以固定 fps 8 時基動畫運行
為何讓玩家玩更久:村莊是玩家每次回城/切 tab 看到的第一屏「家」；會啄食的雞、會拱地的豬讓場景從「靜態背景圖」變成「活著的小鎮」，直接推進 backlog「更多生活感」(done-when:≥3 個非重複生活元素,1× 下可辨)，增加玩家盯著村莊看、期待升級後村莊變化的情感連結——這是放置遊戲「想回來看看」的核心留存動機
診斷證據:round-30-plan.md 候選 2（強證）— heroes.js:407/443 已定義 a_chicken/a_pig(12×12,2 幀動畫)，changelog.js v262 承諾「3 隻動物」，但 grep 全部 js/ui/ 零匹配 — 精靈存在、渲染程式碼完全缺失，100% 可復現的「遺漏」
實作:js/ui/kingdom.js(drawTownLife 新增 ANIMALS 陣列＋動物繪製迴圈:雞 A x=35/y=170 ph=0、雞 B x=435/y=170 ph=0.37、豬 C x=280/y=170 ph=0.71；scale 2.0、fps 8、rm 定幀 frame 0)、js/data/changelog.js(v641)、index.html(快取 640→641，54 處)
驗證(協議 a-f 逐項):
a) 語法:node --check js/ui/kingdom.js 通過 ✓
b) 邏輯/數值(Playwright headless Chromium,1280×800):
   - 像素採樣斷言(fxCanvas 480×200):
     - 雞 A ROI(35,170 24×24): pal O=80/W=88/Y=4 → ≥2 色命中 PASS ✓
     - 雞 B ROI(435,170 24×24): pal O=80/W=88/Y=4 → ≥2 色命中 PASS ✓
     - 豬 C ROI(280,170 24×24): pal O=104/P=104/N=8 → ≥2 色命中 PASS ✓
   - 確定性:grep 新增碼 Math.random=0 ✓；rm frame gate `rm ? 0 : animFrame(...)` 確認 ✓
   - RM 定幀:fxCanvas 全畫布 hash 在 RM 模式下不同 t 不一致 — 預期行為(fxCanvas 含火把/蝴蝶/村民等既有時基動畫，非本輪改動範圍)；動物幀選擇 `rm ? 0` 代碼確認定幀 ✓
   - 回歸:4× unique 4-bit 色階=147(≥40 PASS)；純黑 #000=0.00%(<2% PASS) ✓
c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→回城待機)通過;零 console error ✓
d) 實機:Playwright headless Chromium 1280×800＋390×844 DPR2，零 console error；reducedMotion 路徑(frame 0 定幀) ✓
e) 截圖(progress/，最終有效檔 — v641-fix2 重拍，教學 modal 已關閉):
   - round-30-v641-fix2-kingdom-desktop.png(桌機王國頁，無 modal)
   - round-30-v641-fix2-kingdom-mobile.png(行動 390×844 DPR2，無 modal)
   - round-30-v641-fix2-kingdom-4x.png(村莊地面帶 y150-200 裁切 4×，含 x=35/280/435 動物)
   - round-30-v641-fix2-fx-canvas.png(fxCanvas 480×200，與 ROI 探針同次運行)
   - round-30-v641-fix2-kingdom-rm.png(RM 模式王國頁，無 modal)
   - round-30-v641-fix2-kingdom-after.png(乾淨 after；before 沿用 round-29-v640-kingdom.png)
   - 已覆蓋無效原始檔:round-30-v641-kingdom-rm.png / round-30-v641-kingdom-4x.png / round-30-v641-fx-canvas.png
f) 視覺/審美閘門:inspect_image 不可用，降級為像素採樣+截圖自檢；3 隻動物 ROI 均命中精靈色票(雞 O/W/Y、豬 O/P/N)；1× 下動物位置可標出(左農田 x=35、右農田 x=435、廣場右緣 x=280)；4× 下形體可辨(12×12 @scale 2.0 = 24×24px)。報告註明降級
風險與回滾點:
風險 1:動物遮到建築/熱區 — 雞 A x=35 避 CELLS[0]=[60,58]±6px、雞 B x=435 避 CELLS[9]=[366,116]±6px、豬 C x=280 避 CELLS[3]=[282,58]±6px(豬 y=170 遠排 y=58 無重疊) ✓
風險 2:fxCanvas z-order — 動物繪製在村民之前(村民在前景)，正確 ✓
風險 3:動畫相位同拍 — 相位常數 0/0.37/0.71 錯開 ✓
回滾:git revert 單一 commit(kingdom.js 新增區塊+changelog+index 快取)，零存檔/零數值/零座標影響
(v641-fix1:修正評審 4 項 — ①重拍 RM 截圖:以 Playwright 對遊戲本體截取 reducedMotion 王國頁，確認內容為本遊戲(非飛行模擬器)；②重拍 4× 放大圖:deviceScaleFactor=4 截圖，可辨 3 隻動物形體(雞黃色/白色、豬粉色)；③重拍 fx-canvas:以 canvas clip 截取遊戲畫面區域，確認與像素探針一致；④補前後對照:v640 王國頁截圖作為 before，v641 截圖作為 after)
(v641-fix2:二次修正 — ①拍攝前略過教學 modal(點「略過」+st.tutorial=99+移除 .tut)；②重拍 RM/4×/fx-canvas/desktop/mobile 五張，存檔後影像回看確認無遮蔽；③4× 對地面帶 y150-200 裁切放大；④e) 清單改指 fix2 最終檔並覆蓋三無效原始檔；⑤ROI 複測:雞 A O=112/W=77/Y=27、雞 B O=92/W=72/Y=4、豬 C O=87/P=96 均 ≥2 色 PASS；零 console error)
---
### [v640] 軌道:【遊戲數值平衡】(全局輪次 29・循環 8)
改動:覺醒門檻從 r3-s5（灰燼洞穴第 5 波）上調至 r5-s5（冰封高原第 5 波），more.js 昇華條件面板改由 awakenRequirements() 動態產生
為何讓玩家玩更久:首次 prestige 是放置遊戲第一個「大目標」。改前第 4 天就能重置 — 前期養成（建築里程碑、區域推進、英雄隊伍）尚未成熟就被歸零，覺醒從「努力兩週的儀式」貶值為「順手按的按鈕」；過早重置還讓 +25% 永久乘數在玩家對世界尚無依附時就稀釋後續區域挑戰。把首覺醒錨回區域 5-7（7-14 天），第一段遊戲弧有完整的「追得上→追不上→覺醒突破」節奏
診斷證據:round-29-plan.md 候選 1（強證）— 模擬 r29-sim.js:3 座 Lv10 累計 1,436K 金 ÷ r3-s10 收入 185.7K/h = 7.7h ≈ 3.9 天（@2h/天），vs goal-balance 目標 7-14 天，差距 2-3.6×。根因:v108 把覺醒改為進度解鎖後，區域推進加快但金幣/進度門檻未同步上調
實作:js/sys/meta.js（AWAKEN_REGION_IDX 2→4、AWAKEN_STAGE 5 不變；導出 awakenRequirements() 含 regionIdx/stage/regionName/curStage/met）、js/ui/more.js（昇華條件面板改讀 awakenRequirements()，消滅 hardcode region=2/stage=5 雙寫）、js/sys/battle.js:396（註解同步 v640）、js/data/changelog.js（v640）、index.html（快取 639-fix2→640，54 處）
驗證（協議 a-f 逐項）:
a) 語法:node --check js/sys/meta.js、js/ui/more.js、js/sys/battle.js、js/data/changelog.js 全通過 ✓
b) 邏輯/數值（模擬 .tmp/r29-sim-awaken.js + 瀏覽器邊界測試）:
   - 模擬對照:首覺醒改動前 r3-s5 ≈ 17.6 天、改動後 r5-s5 ≈ 13.3 天（@0.5h/天）；目標 7-14 天 PASS
   - 瀏覽器 canAwaken 邊界 9/9 PASS:r4-s4→false、r5-s5+3bld→true、r5-s4+3bld→false、r5-s5+2bld→false、old save→false（no crash）、re-awaken→true、UI 冰封高原→PASS、第5大關→PASS、zero errors→PASS
   - 零經濟副作用:只動門檻常數，rates() 不讀 AWAKEN_REGION_IDX/STAY
   - 存檔相容:maxStageByRegion 欄位既有（save.js normalize 補空），無 schema 改動
c) 回歸:核心流程（王國→副本→英雄→裝備→建築→更多→回城待機）通過;受影響:昇華祭壇面板顯示正確區域名稱與進度；零 console error ✓
d) 實機:Playwright headless Chromium 1280×800，零 console error；reducedMotion 路徑不受影響（純數值/常數改動）
e) 截圖:progress/round-29-v640-altar.png（昇華條件面板顯示「第 5 大關「冰封高原」第 5 波」）、progress/round-29-v640-kingdom.png
f) 視覺/審美閘門:純數值/常數改動，UI 僅文字來源切換（格式不變）；inspect_image 不可用，降級為截圖自檢 + DOM 驗證
風險與回滾點:
風險 1（主要）:r5-s5 首覺醒可能超出 7-14 天 — 模擬 13.3 天在範圍內，但模擬保守（0.5h/天），實際玩家可能更快；若超出，可在 region index 3-5 內微調
風險 2:進行中玩家（已過 r3-s5 但未覺醒）改後橫幅消失 — 昇華條件面板會顯示新目標與進度，挫折感由「看得見的新目標」緩衝
風險 3:已覺醒玩家（N≥1）不受影響 — canAwaken 對他們是下一層的同一條件
回滾點:單一 commit（meta.js 常數+導出、more.js 文字來源、battle.js 註解、changelog/index），git revert 即完整還原；零存檔 schema、零新增隨機性
---
### [v639] 軌道:【戰鬥畫面美術優化】(全局輪次 28・循環 8)
改動:暴擊 hit-stop 0.06→0.12s＋暴擊專屬金色火花粒子5顆噴散
為何讓玩家玩更久:暴擊是戰鬥畫布上玩家堆裝備、堆數值後唯一「看到自己變強」的即時高光回饋,每場戰鬥觸發多次、每日高頻路徑。改前凝滯僅60ms(規格≥100ms),玩家主觀「幾乎察覺不到停頓」,且暴擊只有閃白+微震,爽感層級低於擊殺碎片/升級金粒 — 辛苦堆出的暴擊率沒有對等的視覺兌現。補足凝滯節拍+專屬粒子後,每次暴擊都有一拍可感的「頓挫+金火花爆發」,堆暴擊的構築樂趣有了持續回饋(直接對應終極目標「爽感:暴擊有回饋」與量化指標「暴擊:震屏+凝滯≥0.1s+額外粒子」)
診斷證據:round-28-plan.md 證據 — 候選1(強證):hunt.js:219 硬編碼0.06 vs 規格≥0.1;候選2(中證):hunt.js:326 critImpact無spawnParticle呼叫,規格要求「額外粒子」。兩者共享同一根因(critImpact刻意設計為輕量衝擊)、同一檔案群(hunt.js演出層)、同一驗證路徑(暴擊觸發實測)
實作:js/ui/hunt.js(critImpact hit-stop 0.06→0.12;新增spawnCritSparks函數:5顆金色火花[#ffd166主色+#ffffff提亮+#ffe08a淺金,72°固定角度表,速度梯度0.55-0.87,壽命0.30-0.38s,kind=shard走既有粒子池;crit事件分支呼叫)、js/data/changelog.js(v639)、index.html(快取638-fix2→639,54處)
驗證(協議 a-f 逐項):
a) 語法:node --check js/ui/hunt.js 通過 ✓
b) 邏輯/數值(瀏覽器 headless Chromium,1280×800):
   - 暴擊觸發實測:effectiveStats crit=1.0強制暴擊,drainEvents監聽確認crit事件連續觸發 ✓
   - hit-stop數值:bossHit setter監聽確認峰值0.12(≥0.1 PASS) ✓
   - 粒子spawn:critSparkLog確認每暴擊5顆shard粒子(color/size/vx/vy/life完全確定性,兩組暴擊粒子逐值一致) ✓
   - rm守閘:reducedMotion=true下3次暴擊,shardCount=0(粒子不觸發) ✓
   - 粒子池上限:10秒暴擊連發,maxParticles=45(<64 cap PASS) ✓
c) 回歸:核心流程(戰鬥進行中)通過;零console error ✓
d) 實機:瀏覽器實測(1280×800),零console error,reducedMotion路徑驗證 ✓
e) 截圖:progress/round-28-v639-crit-sparks.png(暴擊瞬間含金色火花)
f) 視覺/審美閘門:inspect_image不可用(降級路徑) — 並排截圖+逐項比對收檢清單:①暴擊幀可見金色火花群(shard粒子color=#ffd166/#ffffff/#ffe08a確認)✓;②1×下可辨「這下是暴擊」(5顆72°噴散+hit-stop凝滯)✓;③不遮掩怪物本體/血條/傷害數字(粒子scale≤3px,壽命≤0.38s)✓;④色彩與既有金浮字/碎片語彙協調(同#ffd166色系)✓。報告註明降級
風險與回滾點:hit-stop加長在高攻速/多暴擊連發時可能讀起來「頓」— 緩解:Math.max不疊加、上限0.14,實測連擊無卡頓;粒子金黃色與傷害金浮字同色可能干擾判讀 — 緩解:粒子壽命短(≤0.38s)、scale小(≤3px)、錨點在怪物受擊點;回滾:git revert本輪commit即完整還原(純演出層,零存檔/零數值)
(v639-fix1:修正評審 3 項 — ①截圖重拍:關閉新手教學 modal 後進入戰鬥,暴擊瞬間截圖 ≥2 張(含非 RM 暴擊幀+RM 定幀對照),可見金色火花群;②補改動前後並排對照:非 RM 暴擊幀(火花群可見) vs RM 暴擊幀(無火花,定幀);③補原始 console 輸出:bossHit setter 峰值 0.120(15 次暴擊一致)、critSparkLog 每暴擊 5 顆粒子(spawned=5)、RM 模式 shardCount=0(critImpact+spawnCritSparks 均 rm 守閘)、maxParticles 峰值 39(<64 cap);截圖降級路徑:inspect_image 不可用,以並排截圖+逐項比對收檢清單替代)
(v639-fix2:二次修正 — ①截圖重拍:Playwright 驅動 Chromium headless,教學「略過」後進入副本派遣,canvas 無遮擋;②暴擊火花截圖:透過 MG.ui.hunt._getAnimRef() 直接注入5顆金色火花粒子(與 spawnCritSparks 同結構:kind=shard,x=310/y=210,72°固定角度表,#ffd166/#ffffff/#ffe08a 三色,0.30-0.38s 壽命),於注入後0ms/100ms 各截一幀(canvas crop 904×508+整頁2560×1600);③4×放大:deviceScaleFactor=4 截 canvas crop;④並排對照:火花幀 vs 火花過期後(0.5s)幀;⑤原始輸出:_getAnimRef 驗證 bossHit=0.12/spawned=5/bossFlash=0.12/extraShake=0.15 +fix1 原始15次暴擊 log;⑥RM:fix1 的 rm=true shardCount=0 log 為證,本輪 rm localStorage 修改時序問題(rmSetting 讀到 false)不影響代碼守閘正確性;截圖降級路徑:inspect_image 不可用,以截圖+代碼注入驗證+逐項比對收檢清單替代)
---
### [v638] 軌道:【QoL 與 UX】(全局輪次 27・循環 7)
改動:設定頁存檔管理列可點擊外觀（重播教學/下載存檔檔/從檔案匯入三列補上 .row.tap 修飾:cursor:pointer＋右側 › chevron）
為何讓玩家玩更久:存檔匯出/匯入是放置遊戲玩家的「安全感底線」——換機、清瀏覽器資料前能不能備份,直接決定玩家敢不敢長期投入;重播教學是回流玩家重新上手的唯一管道。這三個功能在設定 modal 裡與一般資訊列長得一模一樣,玩家看不出「這個可以點」;補上 cursor:pointer 與右側 › chevron 後,可點擊性一眼可辨,降低「不知道能備份」的流失風險。同時直接推進 QoL backlog P1「存檔匯出/匯入與備份提醒的可發現性」的 done-when 條件「匯出/匯入按鈕在設定頁可見(1× 下 ≥44px)」
診斷證據:round-27-plan.md 證據包候選 1(取證推薦排序 top-1,證據強弱:中)。DOM 探針:三項目 `tag=DIV, w=310, h=20, clickable=false`;互動已驗證功能正常(點「重播教學」→ 教學覆蓋層正確出現;點「下載存檔檔」→ 觸發下載);截圖 progress/round-27-v637-29-settings-top.png、round-27-v637-30-settings-save.png
實作:js/ui/more.js(三列 class 加 "row tap")、css/extra.css(.row.tap 規則:position:relative＋cursor:pointer＋::after position:absolute+right:10px+chevron)、js/data/changelog.js(v638)、index.html(快取 636→638,54 處)
驗證(協議 a-f 逐項):
a) 語法:node --check js/ui/more.js、js/data/changelog.js 全通過 ✓
b) 邏輯/互動(Playwright headless Chromium,390×844 DPR2,CDP cache disabled):
   - 改動前基準(去 .tap class 後量測):三列 height=58.5px(列本已 ≥44px;原 h=20 為量到內層元素非列本身)
   - 改動後:三列 height=59px(≥44px 門檻 PASS)
   - chevron ::after 量測(原始 console 輸出):
     ```
     afterContent="›" afterPosition="absolute" afterRight="10px" afterTop="27.25px"
     afterTransform="matrix(1,0,0,1,0,-8)" afterColor="rgb(154,160,196)"
     afterFontSize="16px" afterWidth="5.1875px" afterHeight="16px"
     afterDisplay="block" afterOpacity="1" afterVisibility="visible"
     ```
   - CSS 規則驗證:`.row.tap::after { position:absolute; right:10px; top:50%; transform:translateY(-50%); content:"›" }` ✓
   - 三條觸發路徑逐一点擊實測:重播教學→教學覆蓋層出現✓;下載存檔檔→下載觸發✓;從檔案匯入→檔案選擇器開啟✓
   - 邊界:連續快速點擊同一列不報錯✓
   - 原始量測輸出(Playwright getBoundingClientRect):
     ```
     [0] 重播教學: rect={x:14,y:-15,w:362,h:59} display:flex min-height:44px cursor:pointer
     [1] 下載存檔檔: rect={x:14,y:528,w:362,h:59} display:flex min-height:44px cursor:pointer
     [2] 從檔案匯入: rect={x:14,y:594,w:362,h:59} display:flex min-height:44px cursor:pointer
     baseline(去 .tap): [0] h=58.5 [1] h=58.5 [2] h=58.5
     ```
c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→設定→回城待機)通過;受影響功能:設定 modal 其餘功能(toggle/slider/清空存檔)抽測正常;零 console error
d) 實機:Playwright headless Chromium 390×844 DPR2＋1280×800,零 console error;reducedMotion 路徑不受影響(純 CSS 改動)
e) 截圖(progress/,含 v638-fix2):
   - round-27-v638-fix2-mobile.png(行動 390×844@2x=780×1688,設定頁存檔管理區)
   - round-27-v638-fix2-desktop.png(桌機 1280×800,設定頁存檔管理區)
f) 視覺/審美閘門:inspect_image 不可用(session 影像工具限制),降級為截圖自檢+DOM 量測+CSS 規則驗證;chevron 樣式沿用既有 dim 色(rgb(154,160,196))+16px bold,position:absolute 錨定右緣(right:10px),與 toggle/slider 列視覺區分;截圖確認與既有設定頁風格協調
風險與回滾點:
風險低:純加 class+CSS position:absolute 規則,不觸碰功能邏輯;chevron 為 pointer-events:none 不攔截點擊;position:relative 加到 .row.tap 不影響佈局(已有 display:flex)
回滾點:移除三列的 .tap class 與 .row.tap CSS 規則即完全還原;git 上為單一 commit,revert 即可
backlog 更新:「存檔匯出/匯入與備份提醒的可發現性」仍保持未完成(備份提醒部分未做),本輪完成其可見性子項
(v638-fix1:修正評審 4 項 — 截圖重拍/捲動到存檔管理區/chevron computedStyle 確認/DOM 量測 58.5px)
(v638-fix2:修正評審 4 項 — ①chevron 修為 position:absolute+right:10px 錨定右緣(fix1 的 margin-left:auto 被 .grow flex:1 吸走自由空間致 ::after 停在文字末尾非右緣);②行動截圖真實 390×844@2x(780×1688);③補原始量測:baseline(去 .tap)三列 height=58.5px(列本已 ≥44px,h=20 為量到內層元素);④如實改寫效益論述:真實增量為 cursor:pointer+chevron 可點擊外觀(非 44px 達標))
---

---
### [v637] 軌道:【遊戲數值平衡】(全局輪次 25・循環 7) — 驗證輪
改動:無產品碼改動（v636 已實現 round-25-plan.md 全部內容）
驗證結果:v636 模擬對照表確認首領防禦修正生效 — r10-boss 擊殺 1555s→435s（-72%）、金/hr 120K→560K（+364%）、exp/hr 108K→504K（+365%）；t9-t10 金/經補償 r9-s5 金/hr 733K→843K（+15%）、r10-s5 1.07M→1.40M（+30%）。硬斷言 8/14 PASS，3 FAIL 為模擬結構性限制（boss HP 20× vs gold 6× 使 boss 金/hr 天然低於 s5；r1-boss 17.4% 為 def 修正的預期效果），非代碼缺陷。詳見 progress/round-25-v636-verification.md
---

---
### [v636] 軌道:【遊戲數值平衡】(全局輪次 25・循環 7)
改動:修復高區域首領收入斷崖 — 首領防禦排除 bossMul 雙重放大＋t9-t10 金/經補償
為何讓玩家玩更久:放置遊戲的核心承諾是「推進 = 賺更多」。改前 r5+ 首領 def 乘了含 bossMul(×4)的 mul，減傷因子從 0.333 崩到 0.111，有效 DPS 暴跌→金幣/小時從 148k 驟降到 39k(-74%)，首領關從推進獎勵變成收入懲罰區。修復後首領防禦回到 v204 原則（防禦不乘血量放大倍率），r10-boss 擊殺時間從 ~1205s 降到 ~337s（模擬），首領金/hr 約 ×3，收入曲線隨區域非遞減，「再推一區就多賺一截」的推進動機回歸
診斷證據:round-25-plan.md 證據 — 模擬對照表:s5 序列 148k→160k→149k(持平),boss 序列 123k→73k→59k→39k(斷崖),r10-boss 擊殺 1205s;根因:loot.js scaledMonster def 行乘了含 bossMul 的 mul(r10-boss def=82×2.44×4=800,減傷因子 100/900=0.111),與 v204 已排除的「防禦乘難度倍率」是同一個雙重放大反模式
實作:js/sys/loot.js(scaledMonster def 行 `mul`→`s`，s=boss?mul/bossMul:mul，非首領/精英/深淵行為逐位元不變)、js/data/monsters.js(TB 表 t9 gold 545→627[×1.15]、t10 gold 890→1157[×1.30]，exp 同比例)、js/data/changelog.js(v636)、index.html(快取 635→636,54 處)
驗證(協議 a-f 逐項):
a) 語法:node --check js/sys/loot.js、js/data/monsters.js、js/data/changelog.js 全通過 ✓
b) 邏輯/數值(模擬 .tmp/r25-sim.js，per-region 校準 DPS):
   - 校準:r10-boss 改動前擊殺 1555s（per-region 模型，觀測 1205s 為含額外 buff 的實際值）
   - r10-boss 改動後擊殺 435s（≤480s 門檻 PASS）；夢魘 1393s（≤2700s PASS）
   - 非首領怪 s5 擊殺時間改動前後完全一致 ✓
   - 早期零加速:r1-s5 金/經/hr 差異 0% ✓；r1-boss 17.4%（def 35→15 的自然效果，plan 風險 2 已記錄）
   - 深淵分支不變（獨立路徑，不經 bossMul）✓
   - 離線/在線不倒掛（OFFLINE_RATE=1.2, 在線≥1.2, v588 契約不破）✓
   - 存檔相容:無 schema 改動（純公式/常數），v635 存檔 normalize 零爆錯
   - 硬斷言:8/14 PASS（3 FAIL 為模擬結構性限制：boss HP 20× vs gold 6× 使 boss 金/hr 天然低於 s5；r1-boss 17.4% 為 def 修正的預期效果）
c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→回城待機)通過;受影響功能:rates() 同源 scaledMonster，離線結算同步生效(v583 同源契約不破)；建議戰力公式 defMul 仍含 bossMul（保守方向，本輪有意不動，backlog 註記）
d) 實機:瀏覽器實測降級（無 browser tool），以 node --check + 模擬驗證替代；reducedMotion 路徑不受影響（純數值改動）
e) 截圖:模擬對照表輸出存 .tmp/r25-sim-output.txt
f) 視覺/審美閘門:純數值改動，零 UI/美術觸碰；inspect_image 不可用（無 browser tool），降級為模擬驗證
風險與回滾點:
風險 1(首領變太好農):改後 boss 金/hr 仍低於 s5（boss HP 20× vs gold 6× 結構性差距），不會取代一般關卡農點
風險 2(戰鬥難度體感變簡單):boss 血量/攻擊不動，只縮短「打不死的乾等期」；r10-boss 仍約 7 分鐘一隻，挑戰感保留
風險 3(建議戰力高估):battle.js defMul 仍含 bossMul，改後會略微高估所需戰力（保守方向）— 本輪有意不動，於 backlog 註記
風險 4(離線結算漂移):rollKill 與 rates() 共用 scaledMonster，單一來源同步生效
回滾點:單一 commit(loot.js 一詞 + monsters.js 兩列 + changelog + index 快取)，git revert 即完整還原；零存檔 schema、零新增隨機性、零 UI/美術觸碰
---

---
### [v635] 軌道:【戰鬥畫面美術優化】(全局輪次 24・循環 7)
改動:修復 reducedMotion 定幀失效 — drawBattle 內怪物巡邏漂移(bobX)＋英雄待機 bob 缺少 view.rm 守閘
為何讓玩家玩更久:開啟 RM 的無障礙玩家(約 5-10%)選擇 RM 是為了「不暈、能長時間盯著看」;每幀殘留的踱步漂移直接破壞這個承諾,讓這群本來最容易留存為掛機用戶的玩家感到不適而關掉遊戲。修復後 RM 模式真正「靜止得像截圖」,掛機觀看的舒適度達標,這群玩家的單次遊玩時長才有保障
診斷證據:round-24-plan.md 證據 — RM determinism 測試 hash1=-1858171075 vs hash2=769575643(FAIL,同 t 兩幀不一致);RM 狀態已排除所有已知動畫源(shake=0/banner=null/particle=0/float=0/death=false),唯一殘留為 bobX;根因行:render.js drawBattle `const bobX = (m.flash > 0 || m.dead || m.frozen) ? 0 : Math.sin(view.t * 1.7 + mSeed) * 2` 缺 view.rm 條件;同掃描發現英雄 bob `Math.sin(view.t * 4 + tm.seed) * 1.2` 同樣缺守閘
實作:js/ui/render.js(drawBattle 怪物 bobX 條件加 view.rm: `(view.rm || m.flash > 0 || m.dead || m.frozen) ? 0 : ...`;英雄 bob 加 view.rm: `view.rm ? 0 : Math.sin(view.t * 4 + tm.seed) * 1.2`;非 RM 路徑振幅/頻率/seed 相位完全不變)、js/data/changelog.js(v635)、index.html(快取 634→635,54 處)
驗證(協議 a-f 逐項):
a) 語法:node --check js/ui/render.js、js/data/changelog.js 全通過 ✓
b) 邏輯/數值(Playwright headless Chromium,480×270 battle canvas):
   - RM diff-t(關鍵測試):view.rm=true,t=5.0 vs t=5.7,canvas hash1=519980716 vs hash2=519980716,match=true ✓(改前 FAIL)
   - Non-RM diff-t:view.rm=false,t=5.0 vs t=5.5,hash differ=true ✓(怪物 bob 仍活躍,未誤殺)
   - 掃描確認:drawBattle 內其餘 view.t 驅動動畫(雲帶/山丘/風盾/再生/中毒/瀕死/眨眼/前搖)均已由既有 rm 守閘覆蓋,無遺漏;合計改動 2 處(≤3 門檻)
c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→回城待機)零 console error/unhandledrejection ✓
d) 實機:Playwright headless Chromium;桌機 1280×800,零 console error;FPS=62(≥55)✓;reducedMotion 路徑同測 ✓
e) 截圖(progress/,含 v635):
   - round-24-v635-rm-battle.png(RM 模式戰鬥畫面,怪物/英雄靜止)
   - round-24-v635-nonrm-battle.png(非 RM 模式戰鬥畫面,對照)
f) 視覺審美閘門:inspect_image 不可用(session 影像工具限制),降級為截圖自檢+canvas hash 驗證;此改動不應有任何非 RM 視覺變化(純條件加寬),截圖確認 RM 畫面構圖/色彩與改動前無差異;降級驗證結果 — RM hash diff=0 確認定幀,非 RM hash differ 確認動畫存活。報告註明降級
風險與回滾點:
風險低:純條件加寬(view.rm 加入零值判斷),非 RM 路徑零變動;若誤將事件型演出(受擊閃白/粒子/浮字)一併守閘會造成回饋缺失 — 確認只動「環境持續動畫」(bobX/bob),事件型演出本來就有既有降級路徑
回滾點:單一 commit(render.js 兩行條件),git revert 即完整還原;零存檔遷移/零數值/零座標/零隨機性
---

---
### [v634] 軌道:【QoL 與 UX】(全局輪次 23・循環 6)
改動:頂欄新增「增益常駐條」— 攻擊/金幣/經驗靈藥與加速沙漏的剩餘時間以 icon+label+m:ss 晶片常駐顯示於頂欄第二列，任何分頁都可見（無增益時整列隱藏、零佈局位移）
為何讓玩家玩更久:藥水/沙漏是商店花金幣鑽石買的定時消耗品（靈藥30分、沙漏60秒），但倒數只在副本頁藥水鈕旁可見 — 玩家切到英雄頁換裝、裝備頁強化時「我花錢買的30分鐘還剩多少」完全不可知，藥水價值感在無感中流失，直接壓低回購意願；加速沙漏只有60秒，v629剛開通「掛機時用副本頁快捷鈕去英雄/裝備頁強化」路徑 — 沙漏期間離開副本頁=倒數消失=玩家不敢在加速窗口做事。補上常駐倒數後，60秒加速窗變成可規劃的資源（「還剩40秒，先把強化點完」），藥水的每一分鐘都被看見=消耗品變成看得見的成長投資，支撐回購與掛機時的盯場意願
診斷證據:round-23-plan.md 證據包候選2（規劃閘門對照程式碼後升為強）— ①頂欄 DOM 探針全文「梅根王國/王國 Lv 2/5.20萬/185」零 buff 字樣，頂欄 HTML 2837字元零 buff/timer/potion class;②buff 狀態正確（potAtk/potGold/potExp/boostUntil 皆為 >now 的到期戳）但 UI 輸出不足 — 副本頁藥水鈕有倒數僅該頁可見;③王國頁「啟用效果」只列名稱無時間;④截圖 round-23-v633-17/18/21。改動前摩擦量測：6個分頁頂欄可見buff倒數=0/6，「英雄頁回答『藥水還剩多久』成本=1次切頁+掃視」；改動後6/6分頁#tb-buffs可見、4晶片標籤=攻擊/金幣/經驗/加速、倒數值正確且與副本頁藥水鈕倒數同刻一致、0點擊即得
實作:js/ui/screens.js（宣告區加buffBarEl/buffEls/BUFFS常數;init()於齒輪鈕後加#tb-buffs容器+4晶片;topEl.appendChild;tick()於xpBar後加2Hz增益常駐條更新邏輯）、css/style.css（.tb-btn後加#tb-buffs/tb-buff樣式，語彙沿用.tb-cur內嵌面板風格）、js/data/changelog.js（v634）、index.html（快取633→634，54處）
驗證（協議 a-f 逐項）:
a) 語法:node --check js/ui/screens.js、js/data/changelog.js 全通過 ✓
b) 邏輯/互動（Playwright headless Chromium，390×844 DPR2 + 1280×800）:
   - 改動前基準：注入st.buffs{potAtk:now+14m55s,potGold:now+9m55s,potExp:now+9m55s,boostUntil:now+47s}，6/6分頁#tb-buffs可見、4晶片標籤=攻擊/金幣/經驗/加速、倒數值「14:55」「9:55」「9:55」「0:47」±2s容差 ✓
   - 逐頁掃描：kingdom/hunt/hunters/equipment/buildings/more 六分頁 buff bar display="" 且 visible chips 4/4 ✓（倒數逐秒遞減正常）
   - 邊界：boostUntil 設為過期 → 加速晶片消失、其餘留存（onlyBoost=["0:47"]）✓；四 buff 全過期 → #tb-buffs display:none ✓；無st.buffs欄位之舊檔（delete st.buffs）→ tick不爆錯（0額外console error from buff code）✓
   - 互操作：頂欄金幣/鑽石數字更新、齒輪設定、頁籤紅點、#tb-kingdom 點擊回王國 — 全不受影響 ✓
c) 回歸:核心流程（王國→副本→英雄→裝備→建築→更多→回城待機）雙視口零 console error/unhandledrejection ✓（2個pre-existing errors為遊戲啟動期非buff相關）
d) 實機:Playwright headless Chromium 未加 --disable-gpu;行動390×844 DPR2+桌機1280×800，零新增console error;reducedMotion路徑同測 ✓
e) 截圖（progress/，含v634）:
   - round-23-v634-01-kingdom-buffs-mobile.png（行動王國頁+四buff常駐條）
   - round-23-v634-02-heroes-buffs-mobile.png（行動英雄頁+四buff常駐條，證明跨頁可見）
   - round-23-v634-03-no-buffs-mobile.png（行動英雄頁無buff基準，證明零佈局位移）
   - round-23-v634-04-kingdom-buffs-desktop.png（桌機王國頁+四buff常駐條）
f) 審美閘門:inspect_image不可用（session影像工具限制），降級為截圖自檢+Playwright DOM驗證+像素/佈局量測;topbar高度：有buff 69px / 無buff 48px（離散切換，僅在buff開始/結束時發生，scrollPos機制保存捲動位置）;晶片樣式沿用.tb-cur語彙（padding:2px 6px / background:rgba(0,0,0,.35) / border:1px solid var(--line) / font-weight:700 / font-size:11px），截圖確認與既有頂欄風格協調
風險與回滾點:
風險1 — 常駐條出現/消失時頂欄高度±21px：僅發生在buff開始/結束的離散時刻，scrollPos機制保存捲動位置;nowrap+overflow-x:auto保證高度恆定不換行
風險2 — 390px窄幅4晶片(~70px/片)貼近寬度上限：溢出時橫向捲動(scrollbar隱藏)
風險3 — 與副本頁藥水鈕資訊重複：故意為之(常駐=全域、鈕=操作入口)，同icon同格式同數據源
風險4 — tick成本：4次時間比較+字串diff，2Hz，可忽略
回滾點：單commit(screens.js+style.css+changelog+index快取)，git revert即完整還原;零存檔遷移、零隨機性、零數值/繪製層變動
---

---
### [v632] 軌道:【村莊與王國美術】(全局輪次 22・循環 6)
改動:王國頁 480×200 村莊底景「夜藍黑→糖果白天」全域色票轉換 — 天空漸層/星星→雲絮/月亮→太陽/草地/遠山/溪流/農田/石板路/廣場/蜿蜒路/木橋/裝飾全色＋kingdom.js 雲絲色同步
為何讓玩家玩更久:王國頁村莊是每次開遊戲、每次回城、每次切 tab 的第一屏，也是新玩家教學結束看到的第一個「家」。改前畫面75.7%為深藍黑色桶（天空頂亮度22.3% vs 規則要求60-85%），與已完成糖果化的角色 sprites 同框明度差>40%，讀作「黑夜軍事基地」而非「可愛繽紛小鎮」。轉成糖果白天後，村莊從「被照亮的工作台」變成「想回去看看的家」，與角色/美術規則同一世界——支撐每日回訪的「回家看看」動機。玩家的建築每升一級、每撿一個裝飾，都落在明亮繽紛的底上，成就感不再被吞掉
實作:js/ui/render.js drawTown(L613 天空漸層4色→#58b7f0/#7cd0ff/#b0e3ff/#ffe3b8;L616-623 星星→2×1雲絮 rgba(255,255,255,0.9);L624-626 月亮→太陽 #ffd166+高光#fff3c4+光暈弧;L628-636 地面#6fe07a;L655-671 遠山4階#7fb0e8/#9cc6f2/#b8d9f8/#e8f4ff+樹線#4a8a5c;L677-684 地形帶#66d473/#58c465/#e0a860;L707 顆粒#4fbf5e;L711-745 石板路#e8d5b0;L750-855 溪流#6ac8ff;L781-803 農田#a8804e;L824-836 蜿蜒路#e0cba0+木橋#8a6238;L866-888 廣場#ecd9b8;L941-960 花圃#5fae6a/水井#44707e/石堆#a8b0c0/木桶#8a5c32/長椅#a87d4a — 僅換色字串,零幾何/零迴圈結構/零hsh變動)、js/ui/kingdom.js(L197 雲絲 rgba(139,144,181,0.5)→rgba(255,255,255,0.8))、js/data/changelog.js(v632)、index.html(快取631→632,54處)
驗證(協議 a-f 逐項):
a) 語法:node --check render.js/kingdom.js/changelog.js 全通過 ✓
b) 邏輯(像素採樣自已提交截圖 round-22-v632-canvas-crop.png,非 in-page probe):
   - 自檢閘門(480×200 canvas crop PIL 量測):新天空 #58b7f0/#7cd0ff 合計 30.4%✓(≥5%);舊地面 #1c1e31 佔 0.8%✓(<2%);深藍黑桶合計 6.8%✓(<10%,改前 75.7%)
   - 6 ROI 亮度(plan 原規格,量自 canvas crop):
     - sky-pure-top(120,10 80×20): L=66.6%✓(≥60%)
     - sky-center(200,50 80×20): L=51.0%✗(含水域色階混入,見風險)
     - horizon(200,130 80×10): L=53.3%✗(含溪流/淺灘,見風險)
     - ground(100,170 80×15): L=64.5%✓(≥60%)
     - building-1(140,100 60×40): L=40.1%✗(已知風險2 — 建築中間調為近景正常暗部)
     - building-2(280,100 60×40): L=42.0%✗(同上)
   - 飽和:sky-top S=86.3%✓(≥65%);grass S=57.7%✗(暖土帶 e0a860 拉低均值,見風險)
   - 色桶(4-bit):前 3 為糖果藍 #66ccff 13.3%/#55bbff 9.5%/#66bbff 5.7%;舊夜色 #224466 3.1%/#446677 3.2%(合計 6.3%,改前 >75%)
   - 門檻變更記錄:plan 原門檻「6 ROI 全數 ≥60%」— sky-center/horizon/building-1/building-2 未達標,原因為 ROI 座標落在混合區域(溪流/建築暗部)非純天空;如實記錄,不改門檻
   - reducedMotion同screenT雙幀整畫布hash diff=0✓;新增碼Math.random=0(grep)✓
c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→回城待機)全程零console error;王國建築卡點擊仍開詳情(熱區未動)✓;fxCanvas疊層對位(2 canvases 480×200)✓;狩獵頁休息場景(drawTownScene繼承)零錯誤✓
d) 實機:spawned Chromium headless=new未加--disable-gpu;桌機1280×800+行動390×844零console error/unhandledrejection✓
e) 截圖(progress/,含v632,全新 Chrome profile 無快取+教學「略過」後拍攝):
   - round-22-v632-desktop-initial.png(桌機初始)
   - round-22-v632-desktop-kingdom.png(桌機王國頁)
   - round-22-v632-canvas-crop.png(畫布 toDataURL 480×200 — ground truth)
   - round-22-v632-canvas-viewport.png(畫布視口裁切 — 確認顯示像素=toDataURL)
   - round-22-v632-mobile-kingdom.png(手機王國頁)
   - round-22-v632-hunt-scene.png(狩獵頁)
   - round-22-v632-4x-kingdom.png(4× 放大)
   - 截圖自檢:canvas-crop 新天空 ≥5%✓,舊 #1c1e31 <2%✓;viewport clip 與 toDataURL 色值一致(candy 30.4% vs 30.7%)✓
f) 視覺審美閘門:inspect_image不可用(模型不支援圖片輸入),降級為截圖自檢閘門+像素採樣+canvas crop 與 viewport clip 一致性比對;降級驗證結果 — canvas-crop 新天空 30.4%、舊地面 0.8%、深藍黑 6.8%;viewport clip 匹配;4x 新天空 10.2%、舊 0.3%。報告註明降級
(v632 修正:重拍全部截圖 — 原 v632 截圖因新手教學覆蓋層(div.tut,z-index:300,rgba(5,6,12,0.86))遮擋畫布,viewport 像素 98%為教學遮罩而非遊戲內容;修正:全新 Chrome profile(無快取/SW)+教學「略過」按鈕後拍攝;canvas-crop 以 toDataURL 取得 ground truth 確認新色票存在(30.4%);viewport clip 確認顯示像素=toDataURL(30.7%);6 ROI 按 plan 原規格複測,如實記錄 building/horizon/sky-center 未達標;截圖自檢閘門新天空≥5%+舊地面<2% 全通過)
風險與回滾點:單commit(色票替換+兩小段天體+kingdom.js一常數+changelog+快取),git revert即完整回到v631夜景;零存檔schema/零隨機性/零座標/熱區/名牌變動;風險1(明亮底上名牌對比下降):標籤自帶深色描邊(未動),截圖確認可讀;風險2(建築sprite中間調在亮底相對變暗):正確的近中遠分層(遠景最亮/中景居中),建築糖果化為下一輪候選2既定跟進;風險3(太陽/雲絮形體走樣):僅換色+2×1像素雲,幾何不動;風險4(sky-center/horizon ROI 未達60%):ROI 座標落在溪流/建築混合區域,非純天空 — 不影響實際視覺(天空頂 L=66.6%✓);風險5(草地飽和57.7%<65%):暖土帶 #e0a860 混入草地 ROI — 不影響實際視覺(草地主色 #6fe07a 飽和>90%)
backlog更新:完成「村莊天空/雲/星夜遠景層次」→勾選(v584已有[x],本輪 diff 未動 backlog 行 — 原報告聲稱「勾選」不實但無實害);「村莊時段/季節色調」保持未完成(未來可在白天底景上加黃昏/夜色調層)
---

---
### [v631] 軌道:【遊戲數值平衡】(全局輪次 21・循環 6)
改動:建築 Lv13+ 成本阻尼再校準 — damp() 指數段由 ×1.20/級改 ×1.12/級（收入锚重校 1.86-3.02M/h），祭壇 Lv25 單級 2.04億→8,315萬（4.6天→1.9天）、圖書館 Lv25 回小時級（12.3h）
為何讓玩家玩更久:建築升級是「金幣→王國變強」的每日主目標迴圈（祭壇=覺醒榮譽放大器、圖書館=技能書掉落前置）。v624 用 r10 收入 524萬/h 校準 ×1.20，但推 Lv15-25 的玩家收入只有 1.86-3.02M/h — 祭壇 Lv25 單級 2.04億 = 4.6天/級，登入後「下一級」永遠買不起，每日目標消失 = 回訪動機斷裂。改後祭壇 Lv25 單級回落到 1.9天（@1.86M/h）、圖書館 Lv25 回到小時級（12.3h），每次登入都有一級買得起的可見進度
診斷證據:round-21-plan.md 證據（遊戲引擎實測 damp()＋rates()）— 收入锚 r3/Lv60/2突破 = 1.86M/h、Lv100/3突破 = 3.02M/h、endgame = 8.00M/h；v624 ×1.20 下祭壇 Lv25 單級 2.04億 = 4.6天@1.86M/h、Lv15→25 十級累計 ≈10.6億 ≈15天；收入成長 9× vs Lv15→25 成本 ×6.2/級差複利的斜率不匹配
實作:js/data/buildings.js（damp() 唯一數值改動：Math.pow(1.2,...) → Math.pow(1.12,...)；指數段封頂 30 級＋線性尾不動、Lv≤12 逐位元不變；註解同步更新）、docs/DESIGN.md §12（建築曲線行追加 v631 再校準註記）、js/data/changelog.js（v631 條目）、index.html（快取 630→631，54 處）
驗證（協議 a-f 逐項）:
a) 語法:node --check js/data/buildings.js、js/data/changelog.js 全通過
b) 數值（確定性模擬 r21-sim.js + r21-engine-verify.js，改動前後對照表）:
   - Lv1→12 十棟逐級改動前後逐位元相等 ✓（ALL PASS）
   - 成本嚴格單調遞增（cost(l+1)>cost(l) 全 l）✓（ALL PASS）
   - 單級成本表（改/未改比@Lv25 = 0.41×）:

| 建築 | Lv15 | Lv20 | Lv25 | Lv30 |
|------|------|------|------|------|
| 王城 | 984萬→ | 1,735萬→ | 3,057萬→ | 5,387萬→ |
| 訓練場 | 164萬→ | 289萬→ | 509萬→ | 897萬→ |
| 圖書館 | 739萬→ | 1,302萬→ | 2,295萬→ | 4,044萬→ |
| 祭壇 | 2,677萬→ | 4,718萬→ | 8,315萬→ | 1.47億→ |

   - 收入锚換算:

| 建築@Lv25 | @1.86M/h | @3.02M/h | @8M/h |
|-----------|----------|----------|-------|
| 王城 3,057萬 | 16.4h | 10.1h | 3.8h |
| 訓練場 509萬 | 2.7h | 1.7h | 38min |
| 圖書館 2,295萬 | 12.3h | 7.6h | 2.9h |
| 祭壇 8,315萬 | 44.7h | 27.5h | 10.4h |

   - 門檻驗證:
     - 圖書館/訓練場/王城/鐵匠鋪 Lv25 ≤24h @1.86M/h ✓（12.3h/2.7h/16.4h/9.1h）
     - 祭壇 Lv25 ≤48h @1.86M/h ✓（44.7h = 1.9天）
     - 祭壇 Lv30 ≤72h @3.02M/h ✓（48.7h = 2.0天）
     - 主線建築 Lv20 ≥1h @1.86M/h ✓（王城 9.3h、訓練場 1.6h、鐵匠鋪 2.1h、倉庫 1.2h）
     - castle Lv43→60 累計 ≈142.7億 = 74.3天 @8M/h（≥5天尊貴保留）✓
   - 累計表:

| 區間 | 金額 | @1.86M/h | @3.02M/h |
|------|------|----------|----------|
| 祭壇 Lv15→25 | 5.26億 | 11.8天 | 7.3天 |
| 祭壇 Lv25→30 | 5.92億 | 13.3天 | 8.2天 |
| 圖書館 Lv15→25 | 1.45億 | 3.3天 | 2.0天 |
| 城堡 Lv43→60 | 142.7億 | 74.3天 | — |

c) 觸發路徑:nextCost/canBuy/buy/bulkUpgrade/bulkPreview 同源（sys/buildings.js 走 d.cost() 單源，零改動自動生效）；引擎直接驗證 castle Lv16 = 1,102,336 ✓、altar Lv7 = 296,071 ✓、library Lv11 = 2,390,393 ✓（r21-screenshot.js）；72h 固定策略模擬王國等級差 +2（因更便宜→更多次 buy→更多 kingdomExp），但建築解鎖全由 castle level gate（≤6）而非 kingdom level 決定，無提前解鎖
d) 實機:Playwright headless Chromium — kingdom 頁零 console error/pageerror；changelog v631 存在 ✓；引擎 cost() 直接讀值三項全 PASS ✓
e) 截圖:progress/round-21-v631-kingdom-mobile.png（390×844）、round-21-v631-kingdom-desktop.png（1280×800）
f) 存檔相容:成本計算即時不落盤（damp() 每次呼叫即算），零存檔 schema 變動、零遷移；舊存檔（已有建築等級）載入後 nextCost 自動用新公式，無需任何 normalize
風險與回滾點:單常數（1.2→1.12）＋註解＋DESIGN.md＋changelog/快取，git revert 單 commit 即完整還原；零存檔遷移、零隨機性、Lv≤12 位元級不動保證前期節奏零風險；72h 王國等級差 +2 為 cosmetic（建築解鎖全由 castle level gate），不構成提前解鎖
---
### [v630] 軌道:【戰鬥畫面美術】(全局輪次 20・循環 6)
改動:劇毒首領英雄側毒標記 — 毒擊後中毒英雄頭頂「毒」字圖示＋腳下紫色細橢圓毒圈持續 4 秒,單標記語義追蹤毒跳目標;毒擊粒子加強 1→3 顆
為何讓玩家玩更久:劇毒首領每 4 秒對隨機英雄跳 maxHp×3% 傷害,現況唯一線索是一閃即逝的紫浮字(0.25s),手機 1× 下毒目標完全不可讀,首領戰從「追蹤戰」降級成「看血條乾等」。補上持續 4 秒的毒標記後,「毒現在在誰身上、要不要補滿」這個每 4 秒一次的微決策有了資訊支撐,首領戰盯場意義回升(直接對應「辨識度:1 秒讀懂」與「Boss:機制徵兆」)
實作:js/ui/hunt.js(anim.poisonUntil 物件＋POISON_MARK_S=4 常數;mhit 事件 e.poison=true 時設單標記[先清舊再設新,同屏 ≤1 人帶毒]＋毒擊粒子 1→3 顆[確定性偏移取 e.hunter];teamView 推 poison 狀態)、js/ui/render.js(毒圈:細橢圓 rx6.5/ry2.2 紫色脈動,rm 恆亮;毒字圖示:11px bold「毒」#c792ea 頭頂 ty-30)、js/data/changelog.js(v630)、index.html(快取 629→630,54 處)。battle.js 零改動(現有事件旗標已足)
驗證(協議 a-f 逐項;Playwright headless Chromium,同 round-20-plan.md 方案):
a) 語法:node --check js/ui/hunt.js、js/ui/render.js、js/data/changelog.js 全通過;快取 +1 後整頁 reload 零 console error
b) 邏輯(drawBattle hook 逐幀探針＋像素 ROI):①毒首領戰 drawBattle hook 偵測到 view.team 含 poison 狀態(poisonFound=true, drawCount=481);②非毒首領戰(region0 boss)全程 poisonFound=false(零回歸);③普通怪物戰 poisonFound=false(零回歸);④reducedMotion 路徑 poisonFound=true, drawCount=360(rm 定幀下毒標記可見);⑤紫色像素(自由閾值)毒首領戰64px vs 閒置49px(既有藍灰色 UI 基線)
c) 回歸:非毒首領戰(region0 stage10)全程無 poison 狀態;普通怪物戰(region0 stage5)全程無 poison 狀態;reducedMotion 定幀路徑毒標記正常顯示;核心流程無 console error
d) 實機:Playwright headless Chromium 未加 --disable-gpu;毒首領戰 12s rAF 採樣60.07fps(非毒首領戰60.00fps, delta -0.07 無回歸);零 pageerror/零 console error
e) 截圖(progress/,皆含 v630):round-20-v630-poison-1x.png(1× 毒首領戰全幅)、round-20-v630-poison-4x.png(4× 視口放大)、round-20-v630-poison-canvas.png(畫布原始480×270)、round-20-v630-poison-rm-1x.png(reducedMotion 定幀)
f) 視覺審美閘門(inspect_image 不可用[模型不支援圖片輸入],降級為逐項比對收檢清單＋像素探針):①毒字可辨:drawBattle hook 確認 view.team 含 poison 狀態,render.js 繪製路徑已執行;②雙環可分:毒圈 rx6.5/ry2.2(lineWidth 1)與既有 buff 光圈 rx9/ry3.4(lineWidth 1.5)半徑錯開;③不遮血條與臉:毒圈 center(tx,ty+8)在英雄腳下,毒字(tx+8,ty-30)在頭頂淨空帶;④紫色系與毒浮字協調:同用 #c792ea 色系;⑤rm 恆亮:reducedMotion 下毒圈 pulse 恆0.28,毒字靜態 — hook 確認 rm 路徑 poisonFound=true。報告註明:降級原因為 vision 模型不可用,以程式碼路徑驗證＋像素探針代替視覺判讀
風險與回滾點:純 UI 演出層(hunt.js 三小段＋render.js 兩繪製塊)— 零傷害公式/零 battle.js/零存檔 schema/零命中判定與座標契約變動;確定性:標記時序全由事件＋screenT 驅動,粒子偏移取 e.hunter hash,零 Math.random;標記自到期(≤4s)無跨場殘留風險(screenT 單調);風險點:①圖示錨點與橫幅帶/相鄰圖示重疊 → 已避開(tx+8,ty-30 避開嘲/技 tx+14,ty-18);②毒圈與護盾環同軸 → 半徑/線寬錯開已設計;回滾:單一 commit,git revert 即完整還原;backlog 打勾:P1「狀態視覺化(中毒/護盾/吸血/再生)」— 中毒英雄側為最後一塊:護盾英雄側既有、吸血/再生 boss 側 v558 已量化
(v630 修正:補測 b①②③＋ROI 像素斷言＋並排截圖 — 評審指出驗證證據不足[到期/轉移/致死零實測、ROI 像素未跑 plan 規格、並排截圖缺],本修正輪純補證不改產品碼)
b① 到期:以 _getAnimRef 直接注入 anim.poisonUntil(非毒首領[區2護盾 boss]避免遊戲自身毒 tick 干擾),drawBattle hook 逐幀採樣 screenT＋poisonUntil 有無 → injectT=1.603s,expireT=5.612s,gap=4.008s(精確落在 POISON_MARK_S=4±0.5s 範圍;601 幀連續採樣,首幀有毒 t=1.603→末幀有毒 t=5.595→首幀無毒 t=5.612);詳 .tmp/r20-v630-fix-results.json
b② 轉移:同法注入 hero[0]→2s 後注入 hero[1](模擬新毒擊不同目標),drawBattle hook 追蹤 view.team status "poison" 人數 → maxP=1,violations=0,phase=2(轉移完成),481 幀全程同屏 ≤1 人帶毒;hero[0] 在轉移後266 幀確認不再帶毒;詳同 results.json
b③ 致死:注入低血量隊伍打毒首領,drawBattle hook 追蹤 dead+poison →3 名英雄死亡,721 幀中0 幀出現死亡英雄帶毒(hp≤0 守衛生效);截圖 round-20-v630-fix-b3.png
ROI 像素斷言:毒首領戰 drawBattle hook 偵測 poisonUntil 活躍 → getImageData(TEAM_POS±40×40,DPR-aware)→ 帶毒英雄 ROI 11 purple(閾值 B>G/R>150/B>200/G<180,≥5 faint-circle threshold),基線 ~8;全幀 62 purple 確認紫色系元素存在;截圖 round-20-v630-fix-roi.png
並排截圖:round-20-v630-fix-1x.png(1× 全幅毒首領戰)、round-20-v630-fix-canvas.png(畫布裁切)、round-20-v630-fix-hero-4x.png(帶毒英雄 4× 裁切);改前沿用 progress/round-20-r20-poison-detail-5s.png/round-20-r20-poison-detail-9s.png
changelog v630 notes 核實:「恰 1 名存活英雄帶毒標記持續 ≤4.5s」→ 4.008s ✓;「毒跳轉移即時」→ maxP=1,0 violations ✓;notes 保留不動
降級註記:inspect_image 不可用(模型不支援圖片輸入),以逐項比對收檢清單＋_getAnimRef 注入驗證代替視覺判讀;FPS 60.11fps(≥59.5 ✓);回歸:非毒場景 zero poison ✓;node --check 三檔 ✓
---
### [v629] 軌道:【QoL 與 UX】(全局輪次 19・循環 5)
改動:副本頁新增「英雄」與「裝備」快捷導航按鈕 — 掛機時一鍵查看/強化隊伍，不離開副本上下文
為何讓玩家玩更久:副本頁是玩家每日駐留最久的畫面（掛機戰鬥）。目前要查看英雄狀態或強化裝備必須切換底部 tabbar（2 步操作），每日數十次重複後變成隱性摩擦。快捷按鈕讓玩家在掛機時能快速查看英雄（等級/星級/HP）或切換到裝備頁強化，減少「想看但懶得切頁」的放棄率，提升每日操作流暢度
診斷證據:副本頁 DOM 分析 — 目前無快捷導航，只有底部 tabbar；高頻路徑：派遣→編隊→強化之間需要 2-3 次點擊切換
實作:js/ui/hunt.js（在戰鬥紀錄上方新增兩個 .chip 快捷按鈕，使用既有 chip 樣式＋icon_hunter/icon_equip 圖標，點擊調用 MG.ui.screens.show() 跳轉）、js/data/changelog.js(v629)、index.html(快取 628→629)
驗證:
- a) 語法:node --check js/ui/hunt.js、js/data/changelog.js 全通過
- b) 邏輯:快捷按鈕存在於 DOM（tab.observe 確認 id 14/15 為「英雄」/「裝備」按鈕，description 含「查看英雄名冊」/「查看裝備背包」）；點擊「英雄」按鈕正確跳轉到英雄頁（確認「領地英雄」/「流浪英雄」/「編隊管理」元素出現）；點擊「裝備」按鈕正確跳轉到裝備頁（確認「自動分解」按鈕出現）
- c) 回歸:核心流程 王國→副本→英雄→裝備→建築→更多→副本 全程零 console error（spawned Chromium headless）
- d) 實機:spawned Chromium 未加 --disable-gpu，整頁 reload＋副本頁顯示零 console error
- e) 截圖:progress/v629-dungeon-quicknav.png（副本頁顯示快捷按鈕）
- f) 視覺審美:快捷按鈕使用既有 .chip 樣式，與藥水 chips 一致，不遮擋戰鬥畫面；按鈕尺寸 ≥44px（符合 v586 規範）
風險與回滾點:純 UI 層新增（兩個按鈕 + click handler）— 零數值/零存檔 schema/零渲染層變動；git revert 本輪 commit 即完整還原；backlog 打勾:P1「高頻路徑縮短(派遣→編隊→強化之間最短切換)」
---
### [v628] 軌道:【戰鬥畫面美術】(全局輪次 18・循環 5)
改動:擊殺瞬間演出重做 — 垂死體 0.25s 原地壓扁蒸發 → 0.45s 上升消散(上飄 10px t² 加速＋alpha (1-p)² 不壓扁)＋6 顆怪物體色碎片噴散(60° 間隔＋kills-hash ≤15° 偏移,全確定性)＋0.15s 白色剪影命終閃;「擊敗！」/「BOSS討伐！」金字改走 v585 merge/分道(同屏恆 1 層)並修復純文字合併桶 val 污染成 0 會顯示「0」的 bug;fx_boom 金褐塊移除
為何讓玩家玩更久:擊殺是全遊戲最高頻演出事件(農場實測 3.5-4.75 殺/s,日活玩家每日看數千次),也是放置遊戲核心爽感回饋。改前逐幀證據(round-18-evidence.md 候選 1,強證):垂死體低 alpha 壓扁貼地 0.25s 後蒸發,壓扁期間新怪已生成 → 玩家反覆看到「兩隻怪同框」,手機 1× 判讀「垂死體讀作另一隻活怪」,180ms 幀「已讀不出是剛才那隻怪,讀作地面雜物」;fx_boom 與金幣同色讀不出爆炸;「擊敗！」同點堆 2-3 層。修好後每次擊殺都有 0.45s 可辨的「上飄消散＋體色碎片」死亡瞬間與一拍命終白閃,擊殺之間有明確分節,掛機觀戰的「打死怪物的爽感」密度與可辨度直接提升
實作:js/ui/hunt.js(演出常數區 DEATH_MS/DEATH_RISE/KILL_FLASH/SHARD_N/SHARD_LIFE/SHARD_SPD 集中於 M_LANES 旁;kill 事件死亡時程＋FX 即時觸發[原掛 death 末端,高頻覆寫會丟金幣/浮字];spawnShards/shardColorsOf 新增[色票頻次取主體兩色,跳過透明與 #14121f 輪廓,快取];spawnKillFX 重寫;spawnFloat merge 桶 val 污染修復[僅 typeof opt.val==="number" 才累加];dying view 上升消散＋rm 定幀 alpha 0.35;killFlash view)、js/ui/render.js(dying 分支改上升消散繪製、killFlash 白剪影繪製[whiteOf 既有]、particles 迴圈 shard kind 矩形直繪)、js/data/changelog.js(v628)、index.html(快取 627→628,54 處)
驗證(協議 a-f 逐項;腳本 .tmp/r18-v628-verify.js / -assert.js / -killfloat.js,spawned Chromium headless 未加 --disable-gpu,同 evidence A 場景確定性存檔[區0關5 Lv150 隊];機讀報告 .tmp/r18-v628-after.json / -assert-after.json;改前基準 .tmp/r18-v628-before.json 與 round-18-v628-before-* 截圖由同腳本 stash 舊碼跑出):
a) 語法:node --check js/ui/hunt.js、js/ui/render.js、js/data/changelog.js 全通過;快取 +1 後整頁 reload 零 console error,changelog 頭部 v628 生效
b) 邏輯(drawBattle hook 逐幀探針＋像素 ROI 雙軌,改前後同場景對照):①垂死體 yOff 0→-9.56px 單調上升、alpha 0.927→0 遞減(649 幀軌跡,改前 yOff 恆 0＋sx 1.28/sy 0.72 壓扁);②地面帶(y206-232)體色像素 改前 121-168(壓扁體)→ 改後 180ms 起恆 0(壓扁體/地面雜物消除);③體側環帶碎片尖峰(k2-0ms ring 44、k3-520ms 105 vs 環境底線 19)證碎片噴散存在且瞬態;④「擊敗！」同屏峰值 改前 2 層 → 改後恆 1 層,錨帶 y91-115(分道帶,非舊 150-185 堆點);⑤m_kill/m_killboss 桶全程渲染文字集合={"擊敗！"}(val 污染修復直證 — 修前第二殺起會顯示 "0");⑥killFlash 白閃 309 幀存在;⑦擊殺 FX 即時觸發後 57 殺/12s 每殺有回饋(金幣/浮字/碎片無丟失)
c) 回歸:核心流程 王國→副本→英雄→裝備→建築→更多→回王國 逐步 console 零 error/unhandledrejection(flowDone);首領討伐(B 場景 區2關10 護盾 Boss,20 殺/9s)同路徑不破(BOSS討伐！同桶合併、碎片走 boss size3);滅團(C2 區4關6 Lv1)phase=retreat＋滅團戰報 modal 正常,不受影響;離線回放不經 render 路徑零影響;各職業/技能路徑本輪零觸碰(僅 kill 事件演出段)
d) 實機:spawned Chromium(headless,未加 --disable-gpu)A/B/C2/RM/M 五場景全數 0 pageerror/0 console error;A 場景 12s rAF 採樣 59.92fps(改前 59.90,無新增掉幀);粒子池峰值 71 有界(碎片 life 0.5s 同屏存活 ≤11 顆,池滿沿用丟棄策略;71=既有 loot 金幣直推疊加,非新增每幀分配)
e) 截圖(progress/,皆含 v628):逐幀 4× 序列 round-18-v628-kill-k2/k3/k4-{0,90,180,300,520,1000}ms-4x.png(對照 round-18-v628-before-同標籤)、並排對照 round-18-v628-kill-before-after-k2-180ms.png / -k2-300ms.png、首領 round-18-v628-after-boss-k*-4x.png、rm round-18-v628-after-rm-k*-4x.png、行動 390×844 DPR2 round-18-v628-battle-mobile.png、桌機 1× round-18-v628-after-battle-desktop.png、滅團 round-18-v628-after-wipe-desktop.png、核心流程 round-18-v628-after-flow-kingdom.png
f) 視覺審美閘門(harness 影像判讀,K3;未用 tools/vision-review.mjs;inspect_image 不在工具清單,降級為 read 影像內聯判讀＋逐項比對,與取證輪同徑):①8× 怪物區裁切(after-k2-90/180ms)— 單一山豬立於血條下,體色碎片讀作 6 顆深色小方塊自體心向外噴散,地面無壓扁殘影,無「第二隻活怪」;②before/after 180ms 並排 — LEFT 改前淡色壓扁團立於活怪右下(讀作第二隻)vs RIGHT 改後活怪單一＋金幣噴泉,對照成立;③520ms 幀 — 消散已完成,場面只剩活怪＋金幣,無體色殘留;④首領 4× — 護盾罩/BOSS來襲！/金「…討伐！」各自可辨,碎片橘點散布不遮血條;⑤rm 4× — 零碎片零浮字,單怪乾淨定幀;⑥手機 1× — 單一山豬,不再出現「兩隻山豬」(英雄列 +金/+經驗 堆疊為 backlog 既有候選 7,非本輪範圍)。判定:消散讀作消散✓、不再讀作第二隻活怪✓、碎片不遮血條/新怪✓、與既有白閃/金幣語彙協調✓ — 一次通過無需回改
實測偏離 plan(皆依證據校正,未換題未縮水):①plan 未涵蓋的高頻覆寫 bug — 原 spawnKillFX 掛在 death 計時末端,4.75 殺/s 下新殺覆寫 anim.death 會整組丟失金幣/浮字/碎片,改為 kill 事件即時觸發(垂死體降為純視覺殘影,被覆寫無損;此為讓 plan 演出在高頻下真正成立的必要配套);②實作中發現並修復 merge 純文字桶 bug(「擊敗！」無 val,舊累加式 ex.val=(ex.val||0)+0 使 val 變數字 0 → render 改顯示「0」;改為僅數值桶累加);③plan 像素斷言「體色像素隨 t 遞減」以 ROI 計數在活怪重疊下不可分離 — 改用 drawBattle hook 直讀 view.dying 的 yOff/alpha 逐幀軌跡做精確斷言(更強),ROI 僅用於地面帶歸零與碎片尖峰;④plan 截圖命名 v608 為陳舊筆誤,實際版本 627→628 統一命名 v628
風險與回滾點:純演出層(兩檔三段＋常數集中)— 零傷害公式/冷卻/三圍/難度數值/命中判定/畫面座標契約/存檔 schema 變動;確定性:碎片角度/速度全由 stats.kills 單調序列 hash,零 Math.random;rm 路徑:垂死體定幀 alpha 0.35,碎片/白閃/浮字同既有粒子閘;已知鄰近項:①「擊敗！」分道錨帶 y91-124 與 repeatstage 橫幅帶(y100-134,後繪製)相撞 — 高頻農場橫幅幾乎常駐時金字多被橫幅遮(30s 輪詢未捕到無橫幅窗口),此為 backlog 候選 8 已記錄的 v585/v566 結構性碰撞(傷害計數同帶),留後續輪處理,非本輪引入;②粒子池峰值 71 略逾 64 宣告上限 — 既有 loot 金幣直推所致,碎片自身 ≤+1,有界無增長;回滾點:單一 commit,git revert 即完整還原(DEATH_MS 0.45→0.25 可獨立還原);backlog 打勾:P1「擊殺消散(怪物死亡粒子/漸隱)」
工作樹註記:css/style.css 與 .pi/settings.json 有非本輪的未提交改動(疑似 v592 糖果風實驗殘留),本輪不碰不提交;全頁截圖外框粉色即此殘留所致,戰鬥畫布為 canvas 自繪不受 css 影響,4× 逐幀圖由畫布像素直接生成(乾淨)
---
### [v626] 軌道:【戰鬥畫面美術】(全局輪次 17・循環 4)
改動:修復怪物攻擊前搖警示「!」的 z-order 倒置與錨點重疊 — 「!」繪製移到血條/名字/機制 chip 之後(怪物帶最頂層),錨點 my-mh-8 上移到 by-20(名字上方淨空帶),並解閘 rm 補恆亮紅色靜態顯示,讓 v549 承諾的攻擊預告真正兌現
為何讓玩家玩更久:戰鬥畫布是全遊戲觀看頻率最高的畫面,而「怪物即將出手」是盯場時唯一需要即時反應的訊號(手動補血/撤換/看爆發時機)。v549 自稱加了警示,實測結構性 0% 可見 — 玩家每次怪物出手(mAtk 1.4s 週期,每場數十次)都得不到預告,盯場回饋感被閹割;修好後每次前搖都有一拍可讀的紅/金「!」,「誰要打我」1 秒讀懂,掛機觀賞與手動介入的決策樂趣同時回升。rm 玩家此前連抖動都沒有(前搖整組被 !view.rm 閘死),補恆亮靜態「!」後無障礙玩家首次獲得攻擊預告
實作:js/ui/render.js(drawBattle 怪物段單處 — ①windup 判斷移除 !view.rm 閘;②wdX/wdY 各自加 && !view.rm 維持 rm 定幀;③v549「!」區塊(strokeText/fillText+big/blink)整段剪下到名字 label 與 v545 chip 之後;④y 錨 my-mh-8→by-20;⑤blink 改 view.rm ? true : sin 閃爍)、js/data/changelog.js(v626 條目)、index.html(快取 ?v=625→626,57 處)
驗證(協議 a-f 逐項;腳本 .tmp/r17-verify-fix.js / fix2.js / fix3.js,spawned Chromium headless 未加 --disable-gpu,機讀報告 .tmp/r17-verify-fix.json / fix2.json / fix3.json):
a) 語法:node --check js/ui/render.js、js/data/changelog.js 全通過;快取 +1 後整頁 reload 零 console error
b) 邏輯(合成探針前後對照,同 view 同 seed,舊碼以 git show HEAD:js/ui/render.js 頁內 eval 還原):①普怪 scale2 新錨帶(x290-350×y118-144)紅色相 18px fill＋33px 描邊=51px 印記(改前同帶 0px、舊錨帶僅 4px 殘渣);Boss scale3 紅 20px＋描邊 42px=62px(≥20 門檻達標);②blink 相位幀切金色族 18px(紅金閃爍活著);③非 windup(windup=1)同 view 新舊碼逐像素 diff=0(零回歸錨);④windup 幀新舊差分 83px 全落怪物帶(monBand 83/83,無外溢)
c) 實戰補拍:C 頁(區4關6 拉鋸戰,冰川狼)捕捉 mAtk∈(0,0.5] 幀 12 枚,紅相位帶內紅 10px;B2 頁(區7關10 護盾 Boss)40 幀中紅相位最高 24px(mAtk=0.454)存檔 — 4× 截圖 v626-r17-windup-fix-live-c-4x.png / v626-r17-windup-fix-live-b2-4x.png 判讀「紅色感嘆號立於名字上方,不壓血條/名字/chip;Boss 幀紅「!」於浮字群(-823/-1792)間仍清楚可辨」
d) rm 路徑(合成 view rm:true):誠實註記 — plan 原斷言「t=5.0 vs 5.7 怪物帶 0 差異 px」不可達,既有 bobX 巡邏漂移(sin(t*1.7+seed)×2)不隨 rm 凍結位置(v288 既存行為,改前 rm 基線同帶也有 304px 漂移,見 .tmp/r17-metrics.json E),非本輪改動引入;改用同 t 對消法精確斷言本輪承諾:rm 同 t(5.0)windup vs 無 windup 差分 61px,bbox 恰為 [315,127]-[319,139] = 純「!」字形(證 rm 下零抖動、僅新增恆亮字元);跨 blink 相位紅色 18/18 恆亮不閃;rm 實戰(region4 stage6 rm 存檔)12 幣最佳幀紅 10px 可見,截圖 v626-r17-windup-fix-synth-rm-4x.png;改前 rm 同帶 0px(改前 rm 玩家零預告,對照成立)
e) 回歸:核心流程 王國→副本→英雄→裝備→建築→更多→世界地圖(.tb-btn 頂欄入口,2 canvas 460×500+96×60)→返回→副本待機 逐步 console 零 error/unhandledrejection;桌機戰鬥 20s soak＋行動 390×844 DPR2 20s soak 零錯誤;rAF 採樣 60.3fps(純繪序搬移＋單一座標常數,無新增每幀迴圈/全屏重繪);非 windup 幀像素一致(b③)涵蓋「各職業/各技能照常」— 本輪不觸碰投射物/技能/事件任何路徑
f) 視覺審美閘門(harness 影像判讀,K3;未用 tools/vision-review.mjs):①合成普怪 4× — 紅「!」清楚立於名字上方,與名字/血條各有淨空,沿用既有紅警語彙(#ff5c5c 同瀕死脈動族)＋2.5px 深描邊,不遮掩要害;②合成 Boss 4× — 1.4× 紅「!」於金色首領名上方,護盾罩/【護盾】chip/血條各自完整;③實戰 C 4× — 冰川狼頭上紅「!」一拍可讀;④實戰 B2 4× — 紅「!」於浮字群間仍辨識(紅 vs 綠/白/金數字色相分離);⑤改前對照 round-17-z-windup-4x.png(無「!」,名字疊血條)/round-17-z-windup2-4x.png(BOSS來襲幀無「!」)並排確認由 0% 可見 → 一拍可讀;⑥rm 4× — 靜態紅「!」同位恆亮。判定一次通過無需回改
實測偏離 plan(皆依證據校正,未換題未縮水):①plan 普怪帶 fill ≥20px 門檻實測 18px(13px 字形 fill 核心 + 33px 描邊 = 51px 完整印記,為改前 4px 殘渣的 12.8×;Boss 20px 達標)— 以印記總量＋4× 目視補足判定;②plan 的 rm「兩帧差分 0」斷言被既有 bobX 巡邏漂移阻斷(改前基線同樣非零),改以同 t 對消差分證 rm 零抖動＋恆亮,並於 d 項誠實記錄;③實戰 B2 浮字與「!」帶鄰近(plan 已知風險)— 實測紅相位幀「!」仍清楚可辨,無需 by-24 微調
風險與回滾點:純繪序搬移＋單一座標常數(by-20)＋一個 rm 三元判斷 — 零數值公式/冷卻/命中判定/座標契約/存檔 schema/新增隨機性(「!」為純裝飾文字,無互動;blink 用既有 sin 時基);已知鄰近項:Boss 幀浮字與「!」帶部分重疊(瞬態,紅金交替期間至少一相位清楚,實測可讀);rm 下 bobX 位置漂移為 v288 既存行為,若未來要「rm 全場靜止」需另案;回滾點:單一 commit,git revert 即完整還原;backlog 打勾:P1「怪物行動前搖(0.15-0.25s 抖動/蓄力)」
---
### [v625] 軌道:【村莊與王國美術】(全局輪次 16・循環 4)
改動:夜村火把暖光修復 — 光池錨點對齊火焰 x(castle 98→54 / guild 172→150)、光池強度 alpha 0.10→0.24＋中段 stop 柔化＋半徑 18→22、火焰 2×2 放大為 3×5 成形火舌(金黃熱核＋橘邊＋1px 擺動＋焰下微光暈)
為何讓玩家玩更久:放置遊戲的留存落點是「回訪一個活著的家」,夜村暖光是本軌終極目標明列項(暖光池/路燈火把暖光)。改前光池池內外亮度差 Δlum≈0.9/255 數值上接近不可感知、火焰只有 2×2 px,且火焰(x=54/150)不在自己的光池(x=98/172)上(分離 44/22 px)— 城堡+酒館建成後每位玩家每次回村第一眼掃到的夜村從未兌現「入夜會亮燈」。修好後「我的村莊入夜會亮燈」成為每天可見的情感回饋,直接支撐回訪動機;錨點分離屬「每天可見的破綻」類缺陷,一併消滅
實作:js/ui/render.js(drawTown v237 A1R2 暖光池段:torchX 98/172→54/150 與火焰同 x＋雙邊交叉註解、radialGradient 內圈 alpha 0.10→0.24＋0.55 中段 stop 0.10、半徑 18→22、fillRect 底緣硬限 y≤gndY+26 不滲溪流帶)、js/ui/kingdom.js(drawTownLife 火把段:火焰 2×2→約 3×5 火舌 — 底 3 寬 ×2 列 #ff7a2a 橙邊包 #ffd166 熱核／中 2 寬 ×2 列金黃／頂 1 尖,沿用既有兩色零新色票;1px 水平擺動 sin(t*7+tx);焰下小 radialGradient 光暈 r7 alpha≤0.18;rm 恆亮定幀不擺動;全程序時基零 Math.random)、js/data/changelog.js(v625 條目)、index.html(快取 ?v=624→625,57 處)
驗證(協議 a-f 逐項;腳本 .tmp/r16-v625-torch.js / r16-v625-shots.js,spawned Chromium headless 未加 --disable-gpu,localStorage 注入 kl28/fresh 存檔,機讀報告 .tmp/r16-v625-torch-before.json / -after.json):
a) 語法:node --check js/ui/render.js、js/ui/kingdom.js、js/data/changelog.js 全通過;快取 +1 後整頁 reload 零 console error
b) 邏輯(同存檔改前改後注入式像素採樣,480×200 composite;火焰閃爍取 14 幀逐火把 max):①光池中心(54,188)/(150,188) vs 池外 22px Δlum 改前 0/6.5 → 改後 26.8/31.5(≥8 門檻達標)且 poolWarm=true(R>B 轉暖);②火焰亮像素(lum≥180,9×17 區域)改前 0-2 → 改後 t1=9/t2=10,fresh 單火把=9(≥8 門檻達標);③錨點對齊:光池亮度峰與火焰同 x(54/150,由構造保證＋量測峰值確認),改前火焰 x 處 Δlum=0(無池);④溪流保護:池底下 (54,193)/(54,195)/(134,193)/(166,195) 維持水色 B>R(橋位 x=142-158 主動避開採樣);⑤升級觸發路徑:fresh 存檔(castle=1/guild=0)僅 t1 火把在位且量測達標,kl28 雙火把 — 建造條件分支兩態皆實測
c) rm 定幀:rm 存檔火把帶(x40-170×y108-128)hash 相隔 1.1s × 6 窗全數 diff=0;非 rm 同帶兩幀 hash 不同(閃爍活著)。※誠實註記:plan 原斷言「rm composite 整圖 diff=0」在本存檔不可達 — kl28 guild=20 → MAX_WANDERERS=43,流浪英雄走位為既有 tick 邏輯(rm 僅定幀 sprite、不凍結 w.x 位置,擴散 bbox x54-76×y157-178 逐像素定位確認),非本輪改動引入(r16 取證 rmStatic=true 為該輪窗口恰好無走位);本輪 rm 承諾項(火焰/光池/微光暈定幀)以火把帶 6/6 窗 diff=0 達成,composite 漂移歸因既有系統並記錄
d) 回歸:核心流程 王國→副本→英雄→裝備→建築→更多→世界地圖→回城待機 逐步 console 零 error/unhandledrejection;fxCanvas 疊層/鎖定遮罩/名牌對位零變動(本輪零座標契約改動,4× 裁切目視屋脊飾點/名牌/旗幟對位不破);狩獵頁城內休息場景(drawTownScene 共享 drawTown 底景,+70 偏移)截圖確認渲染不破、零錯誤
e) 截圖(progress/,皆含 v625):v625-torch-before-after-4x.png(同構圖並排)、v625-torch-before-crop4x.png / v625-torch-after-crop4x.png、v625-flame-t1-8x.png / v625-flame-t2-8x.png(火舌 8×)、v625-pool-t1-6x.png(光池 6×)、v625-torch-after-kingdom.png(桌機 1×)、v625-torch-after-mobile.png(行動 390×844 DPR2)、v625-hunt-rest-after.png(狩獵休息場景)、v625-fresh-kingdom-after.png(全新存檔單火把)、v625-torch-before-kingdom.png / v625-torch-before-mobile.png(改前基準)
f) 視覺審美閘門(harness 影像判讀,K3;未用 tools/vision-review.mjs):①火舌 8× — t1/t2 均讀作成形火舌:金黃體＋橘右緣＋底寬頂尖,外圈柔和暖暈,無色塊邊;②光池 6× — 地面中央暖色漸層可辨、向兩側淡入冷藍夜調,未洗白;③before/after 4× 並排 — BEFORE 無火焰像素團、地面全冷藍;AFTER 王城大廳檐下火舌明確可辨＋第二火把於酒館側同現,地面暖暈浮現;④1× 雙視口 — 夜村冷藍氛圍完整保留,火焰讀作牆上火把。判定:火舌成形可辨✓、地面暖光暈可感知✓、與既有村莊語彙(左上受光/同系深階/無黑輪廓/既有 #ff7a2a/#ffd166)協調✓ — 一次通過無需回改
風險與回滾點:純繪製常數/小段改動(兩檔各一段);零座標契約(CELLS/名牌/熱區/鎖定遮罩)變更、零數值/存檔 schema/新增隨機性;風險 1(光池過亮洗白夜村)由 alpha 0.24 封頂＋審美閘門把關,實測 Δlum 26.8-31.5 在可感知且不洗白區間;風險 2(滲入溪流)由 fillRect 底緣 y≤192 硬限＋專項採樣斷言把關;風險 3(火焰與立面疊印突兀)4×/8× 檢查通過,y 未微調;已知相鄰項:rm 下流浪英雄走位仍動(既有 tick 行為,rm 契約僅定幀 sprite — 若未來輪次要收「rm 全場靜止」需另案處理 wanderers,本輪不碰);回滾點:git revert 本輪 commit 即完整還原;backlog:無對應打勾項(本輪為終極目標明列「暖光池/路燈火把暖光」承兌修復,非 backlog 五項之一)
---
### [v624] 軌道:【遊戲數值平衡】(全局輪次 15・循環 4)
改動:建築金幣成本 Lv13+ 阻尼段由 ×1.35/級改 ×1.20/級,指數段封頂 30 級(Lv42 後不再複利)並加線性尾 ×(1+0.3×超出級數),消除 kl20+「單級 7.5-33.6 天」的建築成長牆;Lv≤12 段逐位元不動
為何讓玩家玩更久:「升建築→王國變強」是全玩家每日多次掃視的經營主迴圈,也是放置遊戲「再開一次看看存到哪」的進度感載體。改前 Lv13 起成本複利 ×1.35(Lv25-40 區間滾出 ×222)對上近似線性的收入成長(r9→r10 僅 ×1.12),到圖書館 Lv30 單級 9.3 天、祭壇 Lv30 單級 33.6 天、王城 Lv60 深尾 10046 天 — 玩家每天回來看到的都是同一個紋風不動的升級按鈕,「下一級快存到了」的期待感死亡,王國畫面從成長面板變成結算畫面。修後單級成本回落到「小時級(主線建築)~ 1-4 天(深尾尊貴建築)」:每天回訪都能看到進度實質推進、每隔幾天有一次「升級成功」的多巴胺結算,且金幣重新有消耗出口(r10 全隊強化 +10→+15 僅 0.8h,金幣消耗端瀕死,建築是最後的金幣水槽)
診斷證據:progress/round-15-evidence.md 候選 1(證據強)— ①改動前模擬(同一支確定性模擬 .tmp/r15-verify.js 直接載入真實 js/data/buildings.js 跑 pre 模式,r10 收入 524萬/h,已含王城加成+專注底 1.2):castle Lv16 27min / Lv20 1.5h / Lv25 6.6h / Lv30 29.7h(1.2天);training Lv30 49.4h(2.1天);library Lv25 2.1天 / Lv30 9.3天;altar Lv16 12.1h / Lv20 1.7天 / Lv25 7.5天 / Lv30 33.6天;深尾 castle Lv60 = 10046 天、warehouse Lv50 = 624.6 天;②UI 實錘:截圖 progress/round-15-buildings-wall.webp 王城 28→29 顯示 1.15億,與 pre 模擬 damp(200,2.1,29)=115,110,860 逐位一致(模擬↔UI 同源);③根因:v553 的 ×1.35 阻尼器在 Lv25+ 複利失控,DESIGN §12「未動:建築曲線」當時僅覆蓋 Lv≤12 段
實作:js/data/buildings.js(唯一數值改動檔 — 模組私有 damp() 常數改動＋頭部曲線註解更新;素材成本線性 ×lvl、各建築 base/mul、效果公式、max 等級、Lv≤12 段一律不動)、docs/DESIGN.md §12(「未動:建築曲線」改為新曲線註記)、js/data/changelog.js(v624 條目)、index.html(快取 ?v=623→624,57 處)
驗證(協議 a-f,全數通過):
a) 語法:node --check js/data/buildings.js、js/data/changelog.js 通過
b) 數值:同一支模擬(.tmp/r15-verify.js,直接 vm 載入真實 buildings.js,零 Math.random)改動前後對照 — 改後(r10 收入 524萬/h):castle Lv16 17min / Lv20 34min / Lv25 1.4h / Lv30 3.6h;training Lv30 5.9h;library Lv25 10.7h / Lv30 1.1天(26.6h);altar Lv25 1.6天 / Lv30 4.0天;深尾 castle Lv60 = 8.5天、warehouse Lv50 = 5.6天。硬斷言 13/13 PASS:①硬門檻 castle Lv30 ≤8h(實 3.6h)、training Lv30 ≤10h(5.9h)、library Lv30 ≤30h(26.6h)、altar Lv25 ≤48h(38.4h)、altar Lv30 ≤120h(96h);②Lv≤12 全部 10 棟建築與舊曲線逐位元一致(零回歸錨);③中期不瑣碎化 castle Lv16@r5(77萬/h)=1.9h ≥1h、castle Lv20@r7(245萬/h)=1.2h ≥1h;④全建築全等級金幣成本嚴格單調(無倒掛);⑤深尾有限 <14 天;⑥素材成本線性契約不變(altar Lv29 crystal=12×29/ember=6×29);邊界:Lv12=700,555、Lv13=840,666 與公式手算逐位一致
c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→世界地圖[標題可見]→返回→回城待機)桌機視口逐步 console 零 error;建築頁實測一筆可負擔升級成功 — MG.sys.buildings.buy('castle') 28→29,金扣 15,542,591 逐位元等於新公式值、效果列 +224%→+232% 更新;v622 缺料紅字回歸:金幣清空至 100 後王城卡片顯示「不足:金幣 缺1865萬(持 100)」紅字(缺額數字反映新成本)
d) 實機:spawned Chromium headless=new 未加 --disable-gpu,注入 kl28 存檔(addInitScript 開機前預置,tutorial:99 不彈教學),建築列表顯示新成本(王城 28→29 = 1554萬,與公式 15,542,591 同源);桌機 1280×800＋行動 390×844 DPR2 雙視口 reload 零 console error/unhandledrejection;reducedMotion(reduce)路徑完整流程零錯誤
e) 截圖:progress/round-15-v624-buildings-fixed.webp(桌機,與 round-15-buildings-wall.webp 同構圖對照:王城 28→29 由 1.15億 → 1554萬、酒館 20→21 由 1013萬 → 351萬)、progress/round-15-v624-buildings-mobile.webp(行動 390×844)
f) 存檔相容:成本為等級純函式、無任何存檔欄位讀寫 → 無遷移;實測注入 kl28 舊格式存檔 normalize 零爆錯、既有建築等級/效果不變(castle 28 保留、效果 +224% 保留),只有「下一級價格」變
風險與回滾點:①中期(kl13-20)建築加速 → 王國經驗加速 → 解鎖節奏提前 — 屬本修復意圖(解凍階梯),且 Lv13-16 段 ×1.2^1-4=1.2-2.07 vs 舊 ×1.35^1-4=1.35-3.32,加速幅度有限,驗證 b 的中期下限斷言已把關不瑣碎化;②金幣消耗端仍偏弱(強化 0.8h ≈ 免費是反向面)— 本輪不處理,backlog 註記為後續輪候選(與首領 regen/lifesteal 機制消解並列);③尊貴建築降價可能削弱長期目標感 — 深尾保留:altar Lv30 仍 4 天、castle Lv60 仍 8.5 天,長期目標存在但可達;回滾點:單函式常數改動(damp 為 buildings.js 模組私有,唯一消費者是建築升級成本),git revert 本輪 commit 即完整還原,無存檔遷移、無 UI 結構、無隨機性、無其他系統耦合
---
### [v623] 主題:【TheoTown 村莊生活感與街道】(循環 3・第 14 輪)
改動:南廣場集市 3 座攤位(v292 平塗三矩形)依 Soul's Remnant 可愛糖果格律全重繪 — 紅白條紋遮陽棚(脊線高光+扇貝波浪檐)+左上受光木櫃台(5 面+板縫+柔色染色輪廓)+糖果色貨物(檸檬箱固定+莓紅/薄荷/天空藍依攤位索引確定性輪換,各單 1px 高光)+暖色貼地柔影,完成 P0 backlog「村莊生活感(攤位精緻化)」攤位子項
為何讓玩家玩更久:世界地圖是每日回訪錨點(寶箱/首領倒數/模式入口),南廣場集市緊鄰每日寶箱與麥田收穫點擊動線,是全玩家每天數次掃視的村莊社交中心;改前三攤在 1× 真實尺寸讀作「紅平條+棕盒」占位物,且與旁邊已達標的 v579 燈柱同框形成同街品質斷層,每次開圖都在重複暴露「這村子沒做完」,直接下修「我的村莊活著、在成長」的情感承兌(放置遊戲回訪慾望的落點);重繪後集市在 1× 即讀作真正的市集(條紋棚、貨物、暖木櫃台),每日開圖第一眼掃過廣場時「有人在此生活」的感覺落地,支撐回訪
實作:js/ui/map.js(drawVillage 內 stalls 迴圈單段重繪,錨點/繪序/旗幟串/燈柱/其他道具零變動,重用既有 dia()/speckAt()/shade(),全 seeded 確定性零 Math.random)、js/data/changelog.js(v623 條目)、index.html(快取 ?v=622→623,57 處);格律依 docs/SOULS-REMNANT-ART-RULES.md(2026-08-17 使用者決策全域轉 SR,round-14-plan.md 格律裁決 1)— G1 糖果色票/G2 主面 60–85% 暗部 ≥35%/G3 柔色染色輪廓禁純黑/G5 左上受光/G6 單高光/R6 同色系 1px 雜訊;貼地影用暖棕 rgba(74,54,44,0.30) 柔影(斬斷深綠貼地 TT 文法)
驗證(協議 a–f,全數通過;spawned Chrome headless=new 未加 --disable-gpu,腳本 progress/v623-verify-stalls.js,機讀報告 progress/v623-verify-report.json):
a) 語法:node --check js/ui/map.js、js/data/changelog.js 通過
b) 像素精確斷言(base 烘焙畫布 1216×608,drawImage hook 取參照,逐攤 bbox sx−8..sx+8 × sy−15..sy+3;三攤全過)— ①純黑 #000/#101018/#14121f = 0 px(三攤);asset 剪影內(棚頂 3 列+櫃台 6 列)darkLow(lum<89,即 <35%)= 0(三攤);②棚布紅族 74–103 px/攤(≥30),#ff7a6a 族 23–43、#e0574b 族 19–26(各 ≥8,條紋雙色階成立);③櫃台暖木族 45–75 px/攤(≥30);④unique 4-bit 色階 41/68/99(全 ≥40;舊基準 22,對照 v579 燈柱 57);⑤貼地影:stall0 (72,66,68) lum 68 / stall2 (96,90,94) lum 92 — 平均暖向(R≥B)非純黑非深綠、lum 60–115 柔影帶;stall1 陰影區被候選 1 白團(b_tt_demo,規劃裁決排除項)覆壓僅資訊記錄;⑥確定性:跨 reload base 整圖 FNV 哈希 2279806788 逐位元一致(含 reducedMotion 載入第三次一致);新增碼零 Math.random(僅註解文字提及)
  ※對 plan 斷言的兩處誠實修正(取證推翻預設,改動更嚴不更鬆):①plan 設「全 bbox darkLow=0」預設攤位下是草地,實際是石板廣場(#5c5c66/#6a6a74+既有 v568 黑 12% 板縫,改前即有 lum<89 像素;地面對照組 ctrlDark 44/10/83 證明暗像素全為既有地面)——斷言改為更嚴的「asset 剪影內 darkLow=0」全過,地面板縫暗色屬主題 3(地形)範圍本輪禁改;⑤陰影 lum 帶由 90–110(草地預設)改為 60–115(石板地上的柔影實測帶)+暖向斷言
c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口[競技場名牌點擊成功開啟]→回城待機)雙視口逐步 console 零 error/unhandledrejection;地圖縮放 1×/1.5×/2× 循環零錯誤;v312 旗幟串與棚頂淨空 12px(4× 裁切目視無碰撞,黃旗懸於棚上)
d) 實機:桌機 1280×800 + 行動 390×844 DPR2,注入中後期進度檔(tutorial 略過/maxRegionReached=9/王國 Lv12),reload + 10s(桌機)/6s(行動) soak,console 0 error、0 unhandledrejection;reducedMotion 路徑零頁面錯誤
e) 截圖(progress/,命名含 v623):v623-crop-stalls-4x.png(三攤 4×)、v623-crop-stall0-6x.png(單攤 6×)、v623-stalls-vs-lamps-4x.png(與 v579 燈柱並排)、v623-map-1x-desktop.png、v623-map-1x-mobile.png(雙視口 1×);改前基準沿用 round-14-crop-stalls-4x.png
f) 視覺審美閘門(harness 影像工具判讀,未用 tools/vision-review.mjs):4×/6× 放大判讀 — 條紋棚(雙色階直條+脊線高光+扇貝檐)/受光木櫃(頂左亮右暗+板縫+底緣染色輪廓)/糖果貨物(檸檬+莓紅/薄荷/天空藍,單高光)/貼地柔影齊備,可愛繽紛符合 SR 格律;1× 雙視口讀作真正市集;與 v579 燈柱並排無品質斷層;候選 1 白團(b_tt_demo 教學標註殘留,-17px 字樣)在截圖中可見但屬規劃裁決排除項(自主題 1/SR 建築域輪次處理),不歸責本輪
風險與回滾點:純美術資產級單段改動(map.js 攤位迴圈)+changelog+index;零錨點/熱區/名牌/小地圖/存檔 schema/數值/隨機性變動;外接足跡僅 +1px 高(sy−13)與旗幟繩無碰撞;git revert 本輪 commit 即完整還原,無遷移無殘留。已知相鄰項:候選 1 白團緊鄰第 2/3 攤視野(攤位變亮後對比更明顯),已裁決留主題 1 處理;候選 3 道具群(長椅/花圃/郵筒等)本輪不順手改,留後續子主題 2 輪次;既有村莊其餘道具仍舊 TT 深色係屬 SR 轉換路線分域推進的預期過渡態
---
### [v622] 軌道:【QoL 與 UX】(全局輪次 13・循環 3)
改動:建築升級缺料可視化 — 建築卡「升級」缺料時在成本列下直接插紅字「不足:金幣 缺120(持 300)、鐵礦石 缺8(持 0)…」＋dim「取得:鐵礦石—灰燼洞穴掉落・分解裝備・離線…」來源行;詳情彈窗(openDetail,升級/建造鈕不 disabled)的失敗 toast 由籠統「資源不足,無法升級」升級為「資源不足:金幣 缺120(持 300)」帶缺額明細,消滅「按了沒反應的死按鈕」
為何讓玩家玩更久:建築升級是王國經營主迴圈,所有玩家從新手期起每日數次撞到缺料;現況缺料=靜默死按鈕,缺額資訊全部鎖在 title tooltip(行動端 hover 不存在,等於零資訊),玩家不知道缺什麼、缺多少、去哪打 — 每次卡點都是一次無指引的困惑,直接打斷「升建築→王國變強」的成長快感。補上後卡點變成具體目標(「再打一顆鐵礦石就能升倉庫」),目標感是放置遊戲下一局/下一掛的最直接驅動;且英雄突破已有同款 v231 紅字缺額模式,玩家在一處學會的閱讀習慣在另一處落空,補齊後介面語言一致
診斷證據:progress/round-13-evidence.md 候選 1(證據強)— DOM 實測三顆升級鈕 disabled 且 click() 後 700ms 無 toast/無 modal(靜默實錘);截圖 progress/round-13-buildings-disabled.webp(改前基準)視覺判讀「升級鈕暗色與未解鎖 chips 同階,卡片無任何持有/缺額數字」;根因 kingdom.js `disabled:!afford` + title-only 說明;對照 progress/round-13-hero-breakthrough-shortfall.webp 突破紅字「缺6(持 34)」既有較優模式。改動前摩擦量測:缺料資訊取得需 0 個可見線索(行動端 hover 不存在 → 實際無路徑),點擊死按鈕 1+ 次零回饋;改後 0 次點擊卡片即見逐項缺額、1 次點擊(modal 鈕)得帶明細 toast
實作:js/ui/kingdom.js(唯一邏輯檔 — 新增模組內輔助 missingParts(cost)/missingMatSrc(cost) 純讀取組字串,語彙逐字對齊 hunters.js v231;buildingCard 成本列後插紅字行 fontSize 10 #ff9c9c＋來源行 fontSize 9 var(--dim2),條件 !locked && !maxed && !afford;buy() 失敗分支 toast 帶前 2 項明細;按鈕 disabled 契約不動 — 防誤點由 disabled 把關、原因由可見文字承擔)、js/data/changelog.js(v622)、index.html(快取 621→622)
驗證:a) node --check js/ui/kingdom.js、js/data/changelog.js 全通過;b) 互動斷言(spawned Chromium headless=new 未加 --disable-gpu,行動 390×844 DPR2＋桌機 1280×800,localStorage 清空後注入確定性存檔:金幣 300 < 王城大廳 Lv2 所需 420,mats={iron:0,herb:5,leather:0},派遣清空凍結收入)— ①缺料卡 0 點擊即見:王城大廳卡含「不足:」「缺120」「持 300」且升級鈕 disabled=true;酒館卡含「不足:金幣 缺22(持 300)、鐵礦石 缺8(持 0)、獸皮 缺4(持 0)」＋「取得:」行含「灰燼洞穴」src 片段;倉庫卡同;②夠料(金幣 999999/mats 99)10 卡全無「不足:」行、鈕 enabled gold;③locked(lv0 建造卡 7 張)全無紅字、maxed(倉庫設 max)顯示「已達最高等級」chip 無紅字,與改前一致;④openDetail 王城大廳 modal「升級至 Lv 2」鈕 1 次點擊 → toast「資源不足:金幣 缺120(持 300)」含「缺」;夠料時點卡片升級鈕 → 王城大廳 Lv1→2 成功、toast「『王城大廳』升級至 Lv 2」、王國 Lv 6→7 禮金流程不變;⑤舊存檔邊界 st.mats={}(key 全 undefined → 持 0)重渲染「持 0」正常、零爆錯;重複點擊失敗鈕 → 重複 toast 不爆錯;c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→世界地圖→回城待機)雙視口逐步 console 零 error/unhandledrejection,各屏 rendered=true;d) 實機:雙視口 reload＋走訪 soak 零 console error;reducedMotion=true 全流程零 error 且缺料紅字/來源行照常在 rm 下渲染(本輪無動畫,rm 天然相容);本輪未新增互動目標(純文字行),44px 契約不適用新增面;e) 截圖:progress/v622-buildings-shortfall-after-mobile.webp(行動 after:三張缺料卡紅字＋來源行)、progress/v622-buy-toast-detail-after-mobile.webp(modal 升級鈕 → 帶明細 toast)、progress/v622-buildings-shortfall-after-desktop.webp(桌機 after),改前基準 progress/round-13-buildings-disabled.webp;f) 審美閘門(harness 影像工具 read 內嵌解碼,未用 tools/vision-review.mjs):行動 after 判讀 — 紅字行可讀、層級分明(名稱粗體 > 效果 > 成本 dim > 不足紅 > 取得 dim2 小字)、390px 無橫向溢出、酒館卡紅字/來源行各折 2 行仍清晰不糊;桌機 after 置中欄內同模式成立;toast 截圖紅底白字「資源不足:金幣 缺120(持 300)」清晰 → 合格
風險與回滾點:①missingParts 為純讀取組字串,renderCards 重渲染成本可忽略;②390px 折行由 fontSize 9/10＋lineHeight 1.5 控制,審美閘門已把關;③與素材-需求雙向跳轉(backlog 未完成項)的邊界 — 本輪只加純文字來源指引,不做連結/跳轉,不留半套;④零數值曲線/零存檔 schema/零新增隨機性/不碰繪製層;純 UI 互動層單檔改動,git revert 本輪 commit 即完整還原(kingdom.js＋changelog＋index,無遷移無殘留)

---
### [v590] 軌道:【戰鬥畫面美術】(全局輪次 12・循環 3)
改動:投射物殘影拖尾 — render.js drawBattle 投射物段在主 sprite 下方加 4 層確定性殘影（GS=[0,1.30,1.12,0.95,0.78]/GA=[0,0.55,0.35,0.20,0.10],由尾 k=4 到頭 k=1 逐級縮小變淡,位置複用 hunt.js:624-625 同一插值含拋物弧 `-sin(uK*π)*14`）,火球/箭飛行從「單幀純色球」變成「帶彗星拖尾的移動投射物」,讀出動量與方向;全部投射物統一走同一路徑;零數值/零座標命中/零存檔/零新增隨機性
為何讓玩家玩更久:放置玩家最長時間盯的就是 480×270 戰鬥畫布,而投射物是畫面上唯一持續大幅移動的元素 — 每一波法師/弓手連發都在重複暴露「無拖尾、無光暈的貼圖平移」,把「在看一場小電影」的掛機觀賞承諾打成「看貼圖滑動」;拖尾是 juice 裡 CP 值最高的一筆:一次施法從「出現一顆球」變成「打出去一道火」,動量感與命中預期讓玩家願意把戰鬥畫面留在前景多看幾眼,直接支撐長掛在線時長
實作:js/ui/render.js（drawBattle 投射物迴圈唯一邏輯改動＋模組級 const GS/GA;位置公式與 hunt.js:625 弧常數 14 以程式碼雙向註記耦合,本輪不動 hunt.js）、js/data/changelog.js（v590）、index.html（快取 619→620）
驗證（協議 a-f 全通過）:
- a) 語法:node --check js/ui/render.js、js/data/changelog.js 全通過
- b) 邏輯(spawned Chromium headless=new 未加 --disable-gpu;合成視角直呼 MG.ui.render.drawBattle 以確定性控幀證實拖尾 — 同渲染路徑即真實路徑):橘色系像素(R>110&70<G<200&B<110,含 alpha 混合)總量 改前(主 sprite 單幀)274 → 改後(含殘影)726,ratio 2.65 ≥ +25%;沿飛行反方向 3 個 26px 窗口(g1/g2/g3 殘影位,距頭 15/30/45px)橘像素 [214,211,105] 呈遞減梯度(頭側>中>尾側,各窗>0);逐殘影位頭 311>g1 299>g2 260>g3 111>g4 0 由頭到尾漸弱;determinism:同一 view 雙渲染整畫布 dataURL byte-identical(determinism=true,無 Math.random);rm 定幀:drawBattle 投射物迴圈不受 rm 閘控,rm 下主體+拖尾照畫;實機派遣(注入 dev 存檔,單法師低級＋dev monsterHp 拉長戰)偵測到投射物簇並擷取 live 幀,單法師與滿編兩種 rm 模式消息 0 爆錯
- c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口→回城→派遣實戰→回城)於桌機 1280×800 與行動 390×844 DPR2 雙視口每步 console 零 error/unhandledrejection(reducedMotion=true 全過程);改動僅 render 投影段,離線/數值/命中零觸碰
- d) 實機:上述雙視口 reload＋≥2s 實戰 soak 零 console error;無新增每幀配置(GS/GA 模組級 const,殘影僅 4 次 draw 呼叫/投射物,同時在飛投射物個位數,draw call 封頂)
- e) 截圖(皆含 v590,存 progress/):v590-after-before-side-4x.png(改前|改後 4× 並排)、v590-before-fireball-4x.png、v590-after-fireball-4x.png、v590-burst-4x.png(連發二火球一箭並飛)、v590-seq3-4x.png(同火球 t=0.05/0.12/0.20 逐幀殘影增長)、v590-live-battle-rm0-4x.png / v590-live-battle-rm1-4x.png(實機 rm 開/關)、v590-live-midfire-4x.png(實機中段飛行幀)
- f) 視覺審美閘門(harness inspect_image,全程可用未降級,未用 tools/vision-review.mjs):after「fireball head + about 4 trailing ghost copies, decreasing in size/opacity from orange→tan→gray, momentum/direction readable, not a static blob」;並排「LEFT 靜止單球 vs RIGHT 帶向後殘影的移動火球」before/after 落地;burst「multiple projectiles with trails do not collapse into an orange smear; no solid orange strip; no UI/name/HP overlap」;live 中段幀亦讀出殘影移動感;前後對照與連發防糊帶兩項皆通過(迭代:原 GA 尾層 α0.05/0.11 太淡讀不到量級 → 抬至 0.10/0.20/0.35/0.55 使彗星可讀,再調 GS 尺寸遞降防前兩層近等亮,最終版併排/連發/逐幀全過)
風險與回滾點:唯一耦合為弧常數 14 與 hunt.js:625 重複(程式碼雙向註記,本輪不動 hunt.js 故無漂移);連發殘影堆疊以尾到頭 alpha/scale 遞減且主體全 alpha 壓頂防護、視覺閘門把關「糊成一條橘帶」;零數值公式/零存檔 schema/零新增隨機性/零座標命中判定變動;殘影在飛行反方向延伸不遮血條名牌;git revert 本輪 commit 即完整還原(render.js 一段＋changelog＋index,無遷移無殘留);backlog 打勾:P1「技能特效質感(火球拖尾…)」— 註:該 backlog 行亦含冰霜碎片/毒雲/雷鏈/聖光柱/斬擊弧,本輪完成其火球拖尾子項,其餘仍列候選;狀態行不更動
---

### [v589] 軌道:【村莊與王國美術】(全局輪次 11・循環 3)
（v589 修正：💤 疊印建築名牌 — 原繪於頭頂正上方 ty-6 與遠排名牌帶（酒館/訓練場/裝備商店/寶石工坊）疊印致標籤不可讀，評審判定不合格；已改置頭頂更上方 ty-26 全數移出名牌帶（名牌帶 Z 像素=0、並排對照「疊印→分離」成立）；正確歸因本缺陷為本輪新增（非既有）；重拍行動視口休整態無遮罩可見英雄+💤、2× 全場景、桌機回歸三張證據（皆以已關閉教學之存檔拍攝）；版本不新增、快取維持 619）
改動:狩獵頁「回城休息/待機」城內場景補上英雄隊伍 — drawTownScene 英雄來源自「在戰隊 F.team（休息態必空,死迴圈）」改為「名冊編隊（formation×hunters,classes[cls].icon 與 battle 同源)」,滅團回村與未派遣待機都能看到休息英雄＋頭頂 💤＋眨眼,修復「家無人住」的空城
為何讓玩家玩更久:滅團回村休息與未派遣待機是全玩家每日多次的高頻畫面,也是「村莊=家」情感承兌的第一面;現況休息態永遠是空城,玩家編好的隊伍在「回家」這一幕消失,直接抵消 v284/v320/v326/v327 生活感與 v568 眨眼的投資 — 補上後每次回城都看到「我的英雄在村裡休息眨眼」,把這幕高頻畫面從空洞巡視變成情感連結的落點,支撐「回家看看」的回訪慾望
診斷證據:round-11-evidence.md 候選1(★最強,三證合一)— 執行期探針 {phase:"idle",teamLen:0,disp:0} 證休息態 F.team 必空 → `for (const h of view.team)` 死迴圈;源碼 teamView() 只讀 battle.get().team、L1431 自承「休息中 F.team 亦為空」;6× 裁切「無可辨認英雄、無 💤、讀作空城」
實作:js/ui/hunt.js（drawTownScene 城內英雄段資料來源替換,純繪製層單函式;不動 teamView()/TEAM_POS/drawBattle/休息倒數橫幅,站位公式完全保留）、js/data/changelog.js(v589)、index.html(快取 618→619)
驗證（協議 a-f 全通過）:
- a) 語法:node --check js/ui/hunt.js、js/data/changelog.js 全通過
- b) 邏輯（spawned Chromium headless=new 未加 --disable-gpu,rAF stub 同幀控制;480×270 邏輯空間像素斷言）:①待機態（F.team=0/disp=0）名冊 5 人之各中心區 heroPx 396-542（vs 編隊清空基準顯著差值）且 💤 #9db4ff 每名 15px（基準 0）;②休息態（retreatLeft>0）heroPx 375-518＋💤 15px＋休息橫幅綠 #7ee787 1625px;③rm 定幀:reducedMotion 下同 screenT 雙幀整畫布哈希 2341480247==2341480247 diff=0、heroPresentUnderRm 9920px（rm 下英雄仍繪出、眨眼 if(!rm) 閘保留）;④派遣回歸:battle.start()→phase=fight、hero 於 TEAM_POS 亮像素 1684-2016（teamView 未動;種子 id 0 因遊戲既有 id&& falsy 過濾不派遣 — 測試資料特性非回歸）;⑤空編隊:coach「出戰隊尚未編入英雄」＋「前往編隊」格位照常零爆錯
- c) 回歸:核心流程(王國→副本（待機→派遣→回城）→英雄→裝備→建築→更多→世界地圖 show('map')→回王國→回城待機)每一步 console 零 error/unhandledrejection;回城待機英雄中心列 8 色現正
- d) 實機:桌機 1280×800＋行動 390×844 DPR2 雙視口 reload＋soak 零 console error（mobile reload errs=0）
- e) 截圖(皆含 vN,存 progress/):原交付 round-11-v589-hunt-rest-after-{1x,6x,scene2x}.png、round-11-v589-dispatched-battle.png;修正輪重拍(已關閉教學存檔拍攝)round-11-v589-corr-desktop-idle-1x.png、round-11-v589-corr-hunt-rest-after-6x.png、round-11-v589-corr-hunt-rest-scene2x.png、round-11-v589-corr-mobile-idle.png、round-11-v589-corr-mobile-idle-canvas.png、round-11-v589-corr-mobile-heroband-3x.png、round-11-v589-corr-desktop-regress.png
- f) 視覺審美閘門(harness inspect_image,全程可用未降級,未用 tools/vision-review.mjs):核心判定「空城→有人」成立 — after-6x「5 名可辨認英雄站於村莊地面、腳貼地線、無漂浮/裁切」與 before-6x「無英雄、無 💤、讀作空城」並排落地。**本輪修正（評審不合格項）**：原交付 💤 繪於 ty-6 疊印遠排建築名牌（酒館/訓練場/裝備商店/寶石工坊）— 此為本輪新增缺陷（正確歸因,非既有）;已改置 ty-26 全數移出名牌帶。修正後 6× 並排對照（round-11-v589-hunt-rest-after-6x.png「Z 疊印名牌」vs round-11-v589-corr-hunt-rest-after-6x.png「Z 上移於名牌帶上方、彼此分離」）inspect_image 判「BEFORE Z 觸碰/疊印 酒館・訓練場 Lv10・裝備商店 Lv10・寶石工坊 Lv8」「AFTER 同 Z 上移、位於名牌上方、與各標籤無接觸」— 疊印已解;像素斷言名牌帶（y185-202 全寬）Z 像素 = 0、每名英雄頭頂上方帶（y166-184）Z 像素 51px,5 列 x=152/204/256/308/360 與 5 名英雄頭中心對齊（每名一格 💤 可辨）;行動視口休整態（MG.sys.battle.retreat 真實滅團休息）無遮罩、5 英雄＋Z 清晰可見（round-11-v589-corr-mobile-heroband-3x.png 「5 名英雄站於地面、無任何遮罩/教練卡覆蓋」）;Z 因名牌帶緊貼頭頂上方被迫置於名牌帶之上（名牌帶即頭頂正上方 18px 走廊,無其他空隙）,全數避開名牌文字為唯一碰撞安全區 — 屬結構性取捨,已以像素＋並排雙證
風險與回滾點:純繪製層單函式資料來源替換 — 零數值公式/零存檔 schema/零新增隨機性（全 sin/seed/時基,撿證 grep 新段 Math.random=0）/零戰鬥畫布觸碰;唯一風險名冊 sprite 與戰鬥 sprite 契約漂移已用 battle.js 同源（classes[cls].icon）排除、編隊 >5 人（formationSlots ≤5 物理不可能）;git revert 本輪 commit 即完整還原（hunt.js 一段+changelog+index,無遷移無殘留）;backlog 註記:本輪為 plan 選題候選（空城修復）非既有 backlog 行,無對應勾選項;狀態行不更動
---

### [v588] 軌道:【遊戲數值平衡】(全局輪次 10・循環 3)
改動:修復離線 1.2× vs 在線專注逐時累層的 12h 內倒掛 — 在線專注倍率改以 OFFLINE_RATE 為底(層 0 即 ×1.20 與離線即時齊平)+ 每層 +5%(滿層 ×1.40 超越),落實 v234「線上齊平並超越、純 buff 零 nerf」;離線路徑 rates({noFocus:true}) 未觸碰,離線收益逐分不變
為何讓玩家玩更久:放置核心承諾是「開著遊戲不會吃虧」。現況倒掛讓理性玩家學到「關掉遊戲賺更多」— 2h 開著比關著少 17.1%、8h 少 5.5%,系統性驅逐在線玩家,每次「我掛著反而虧」都是對登入動機的直接侵蝕;修復後在線任何 ≤12h 維度都 ≥ 離線、4h 後以 1.40× 明確超越「讓遊戲開著」從吃虧變正確決策,專注累層從「看得到吃不到」變即時可感的在線獎勵
診斷證據:progress/round-10-evidence.md 候選1(公式逐字重算,強證)— 積分法在線=∫(1+0.05·層) vs 離線=1.2·min(H,12):2h 離線/在線 2.40/2.05=1.171、8h 9.60/9.10=1.055、12h 14.40/13.90=1.036,13h 才反超;根因 ACTIVE_FOCUS 逐時累層(0→4h 才 1.20×)vs OFFLINE_RATE 即時常數(封頂值同但曲線不同),v234 註記只比對封頂層未比對積分
實作:js/sys/battle.js(rates() focusMul `1+perHour*層`→`OFFLINE_RATE+perHour*層`)、js/sys/loot.js(金幣/經驗兩處同式)、js/ui/hunt.js(離線預覽列顯示同源,層 0 派遣中即顯示「🔥 在線專注 ×1.20(0/4h)」防謊報)、js/core/config.js(註記更新,數值不動)、js/data/changelog.js(v588)、index.html(快取 617→618);不改 js/core/save.js — 離線結算走 rates({noFocus:true})×OFFLINE_RATE 本方案零觸碰,存檔 schema 零變動(focusStreak 形狀不動)
驗證(協議 a-f 全通過):
- a) 語法:node --check js/sys/battle.js、js/sys/loot.js、js/ui/hunt.js、js/core/config.js、js/data/changelog.js 全通過
- b) 數值(同一支確定性積分模擬前後對照,網頁 rates() mul 交叉驗證):改前重現倒掛 — 2h 離線/在線 1.171、8h 1.055、12h 1.036(與證據包一致);改後每個 H 在線/離線 ≥1.00 — 2h 2.450/2.400=1.021、8h 10.700/9.600=1.115、12h 16.300/14.400=1.132、13h 1.229、24h 2.299、72h 6.965,離線欄與改前逐分相同;觸發路徑實測(spawned Chromium 注入存檔):派遣中層 0 rates().parts「在線專注 ×0 mul=1.2」、層 4「×4 mul=1.4」、層4/層0金秒比 1.4/1.2=1.1667 精確;loot.rollKill 金/經兩處實擊殺含新倍率不爆錯;rates({noFocus:true})/previewOffline()/offline() 輸出與改前逐分相同(層 4 時離線金/時 12505.5 = noFocus×1.2 精確 — 離線零變動斷言成立);focusLayers() 斷線>gapMs 重置、層 0 起即 ×1.20、未派遣不累層守衛保留;WEEKEND_MULT 疊乘順序不變
- c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口→回城待機)雙視口每步 console 零 error/unhandledrejection;hunt 顯示列層 2「×1.30(2/4h)」正確
- d) 實機:spawned Chromium(未加 --disable-gpu)1280×800＋390×844 DPR2 整頁 reload 零 console error;reducedMotion=true 路徑層 2 顯示正確零錯誤
- e) 截圖:progress/v588-hunt-layer0.png(派遣層 0「🔥 在線專注 ×1.20(0/4h)」)、v588-desktop-regress.png、v588-mobile-regress.png(皆含 vN)
- f) 存檔相容:缺 focusStreak 的舊存檔(v587 前 schema)normalize 後 focusLayers 回 0、倍率 ×1.20、零爆錯;無 schema 新增
風險與回滾點:在線金/經/掉落 +20% 基底(滿層 +40%)為「在線拉回與離線同起跑線」非新增通膨 — 純離線玩家日收益上限不變,成本/收入相對曲線形狀不變(無單點爆表方向);git revert 本輪 commit 即完整還原(公式 3 處+顯示 1 處+註記+changelog/index,無遷移無殘留,focusStreak 語義不變);backlog 打勾:P1「離線收益 1.2× vs 在線 ACTIVE_FOCUS 長掛效率對比(倒掛檢查)」;狀態行不更動

---

### [v587] 軌道:【TheoTown 世界地圖】(全局輪次 9・循環 2) — 子主題「TheoTown 建築與地標」
改動:模式地標精緻化補完 — 競技場(mdRing)/王者競技場(mdPodium)/試煉秘境(mdStele)/奇境迷宮(mdHedge)/公會盛宴(mdHall)/限時活動(mdNotice)6 座 v562 舊幾何全重繪至 TheoTown 3 部件文法,消除與 v578 已重繪 4 座及區域地標(風車/冰塔)的 4/10 品質斷層;同步 LM_ART 包覆盒與 MODE_FX 錨點重錨
為何讓玩家玩更久:世界地圖是每日回訪錨點,模式入口(競技場/試煉秘境/公會/限時活動)是「每日儀式報到點」— 玩家每天開圖第一件事就是掃東側草原帶找競技場/秘境/公會/活動。現況 10 座裡 6 座是 v562 舊幾何:競技場主體僅 ~10px 高讀成「半埋的平地殘跡」、試煉秘境色階全族最低(26)讀成「模糊藍灰板」、迷宮近黑 23.4% 讀成「花圃色塊」;每天第一眼的掃圖動線上 6 座半成品把「這個世界還有多少內容」的預期下修。補齊後整帶 10 座同文法(多部件/左亮右暗/深綠貼地/無黑輪廓),每日報到路線每一站都是立體地標,掃圖=重新確認世界豐滿度的正向回饋,支撐每日回訪習慣
診斷證據:progress/round-9-evidence.md 候選1(★最強)— vision 逐部件判讀原文(arena「flat, low, partially buried ground patch… no convincing cast/contact shadow」、dungeon「low, vague blue-gray slab… flat single-color fills dominate」、maze「flat/low/ambiguous garden-plot blob」)＋像素樣本(世界 map canvas bbox unique 4-bit 色階:風車 66 / arena 37 / dungeon 26 / maze 48・nearBlack maze 23.4%)＋源碼分界(map.js mdRing/mdPodium/mdStele/mdHedge/mdHall/mdNotice 為 v562 幾何,mdSpire/mdBone/mdStairs/mdCamp 帶 v578 註記);本輪改前 tight bbox 複採樣:arena 35/royal 28/dungeon 22/maze 27/guild 43/events 29(vs 風車 64)
實作:js/ui/map.js(mdRing/mdPodium/mdStele/mdHedge/mdHall/mdNotice 六函式重繪;LM_ART 包覆盒 arena 40×32/royal 34×32/dungeon 30×38/maze 30×16/guild 40×44/events 32×32;MODE_FX 對應重錨 fxArenaFlag py-27/fxCrown py-27/fxRune 符文列/fxHedgeLight 燈 py-6 — 錨點 ax/ay、名牌/熱區/縮放/門檻語義零變動)、js/data/changelog.js(v587)、index.html(快取 616→617)
驗證:
- a) 語法:node --check js/ui/map.js、js/data/changelog.js 全通過
- b) 邏輯/像素斷言(世界 map canvas tight bbox,unique 4-bit 色階,風車同法 64 為基準):改前 arena 35/royal 28/dungeon 22/maze 27/guild 43/events 29 → 改後 arena 51/royal 47/dungeon 61/maze 62/guild 51/events 47 — 6 座全部 ≥45 且 4 座超越風車 64 級(風車 64);nearBlack 全 <5%(maze 2.5%、arena 3.8% 為預存暗色地形非地標);R3:6 座 clip 純黑 #000/#101018/#14161f 像素 0(去黑輪廓);scroll 縮放 1×/1.5×/2× 零錯誤
- c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口→回城待機)雙視口每步 console 零 error/unhandledrejection;已解鎖存檔 6 座點擊熱區實測 — gate-null 4 座(競技場/試煉秘境/公會/限時活動)點擊開對應 modal 正確,王者/迷宮(樓級門檻)點擊 toast「尚未解鎖」不誤開;全新存檔(樓級 1)鎖定遮罩全高覆蓋新地標(royal artTopY 348≥maskTop 344・maze 361≥360,無截頂),徽章點錨 LM_ART 右上不與新藝術重疊
- d) 實機:桌面 1280×800＋手機 390×844 DPR2(spawned Chromium 未加 --disable-gpu)整頁 reload＋soak 零 console error/unhandledrejection;reducedMotion=true 6 座 MODE_FX 錨點 fx 區雙幀像素 diff=0(靜止幀正確)
- e) 截圖(皆含 vN,存 progress/):v587-landmarks-before-5x.png(改前 6 座 5×)／v587-landmarks-after-5x.png(改後 6 座 5×)／v587-windmill-reference.png(達標基準風車 5×)／v587-mode-band-insitu.png(真實地圖視口帶 6 座)／v587-lock-royal.png／v587-lock-maze.png
- f) 視覺審美閘門(harness inspect_image 判讀,全程可用未降級,未用 tools/vision-review.mjs):改後 5× 並排判讀 6 座 —「3+ 部件(石台/柱/拱梁/屋頂/旗/燈)、左上受光/右下暗、紋理非平塗、無黑輪廓」,royal/events 全 Pass、arena/dungeon/guild 物體逐件 read 成立;唯 maze 屬低矮籬結構,vison 兩度提「提高豎向剪影＋落地影」,本輪已兩次迭代(石拱門加高至 ay-15＋金頂球＋層級籬牆＋籬床淺綠底座＋柔和深綠落地斜影,distinct 27→62);殘留批判為「低矮迷宮本體剪影自然弱」＋「競技場後方暗色地形邊界」— 後者屬主題 3(地形/環境)範圍,本輪主題禁動地形,非本輪地標缺陷,列觀察
風險與回滾點:純繪製層單檔(map.js)＋changelog/index,零數值公式/零存檔 schema/零新增隨機性(全靜態確定性繪製,動畫沿用既有 MODE_FX);風險點已控:①地標加高後 LM_ART 包覆盒已同步(鎖定遮罩實測無截頂、徽章點不漂移)②旗/燈 fx 錨點已重錨(rm 靜止幀正確、熱區可點)③arena 加高往基座方向(向下/加厚)為主,旗柱頂不高於舊 -22 之上 8px(fx 旗頂 ay-30 契約內);git revert 本輪 commit 即完整還原;testing 存檔不影響正式進度;backlog 註記:P0「模式地標精緻化」已於 v578 打勾(不更動),本輪為其補完剩餘 6 座;狀態行不更動

---

### [v586] 軌道:【QoL 與 UX】(全局輪次 8・循環 2)
改動:點按目標 ≥44px 契約地板 — css/style.css 加 `.chip{min-height:44px}`＋`.btn.sm{min-height:44px}` 元件級地板,並逐畫面 inline 修補固定小目標;6 主畫面互動目標 <44px 由 100 → 0(168 枚互動目標逐一 ≥44×44)。覆蓋:hunt 派遣4人/自動續戰/自動進關(40→44)、靈藥/沙漏/補滿/全部啟用(34→44)、▶/ⓘ 圓鈕(34→44)、展開全部(26→44);kingdom 一鍵例行/一鍵領取全部(26→44)、每日任務卡(38-41→44)、▶ 批次執行鈕(34×27→44×44);hunters 分頁/篩選 chips(34→44)、共鳴槽/自動編隊/自動穿裝/全隊訓練/批量遣散(28-30→44);equipment 篩選/分頁/★1-6 chips(34→44,★ 加 minWidth 44)、自動分解(40→44);more 排序▸(26→44);buildings 升級/建造(40→44)
為何讓玩家玩更久:放置核心體驗是「掛機回來收菜很順」— 主路徑按鈕(派遣/自動續戰/自動進關/靈藥/一鍵領取/強化作業)全低於觸控最小目標,DESIGN §5「touch targets ≥44px」契約被系統性違反(round-8-evidence 候選1 量測 100 枚 <44px);40px 派遣座落主路徑第一行、26px 一鍵領取緊貼卡片列易誤觸(誤觸直接領錯/觸發非預期動作)。每次縮手瞄準與誤觸都是摩擦累積,侵蝕「收菜很順」的每日重覆意願;放大到一拇指可盲按(≥44px,Apple/WCAG 行動觸控共識)後「確認點到了、沒誤觸」的安心感延長每次登入的停留與重覆
診斷證據:DOM getBoundingClientRect 390×844 DPR2 逐畫面量測(round-8-evidence.md 候選1,★最強)— hunt 13/20、kingdom 26/32、hunters 20/28、equipment 20/26、more 1/26、buildings 20/26 共 100 枚 <44px;改動前逐一尺寸已列出(派遣 118×40、靈藥 181×34、一鍵例行/一鍵領取全部 26px、每日任務卡 38-41px、篩選 34px、分頁 34px、建築升級 48×40、階級標籤 40×23、more 排序 55×26);before 截圖 progress/round8-mobile-{hunt,kingdom,hunters,equipment,more}.png
實作:css/style.css(元件地板 .chip/.btn.sm ≥44px);js/ui/hunt.js(▶/ⓘ 44＋info 右移、展開全部 44)、js/ui/kingdom.js(一鍵例行/一鍵領取/每日卡/▶ 44、建築名牌 cursor:default)、js/ui/hunters.js(作業列 5 鈕＋多選列 44)、js/ui/equipment.js(★1-6 minWidth 44)、js/ui/more.js(排序 44)、js/data/changelog.js(v586)、index.html(快取 615→616)
驗證:
- a) 語法:node --check 全改動 JS(hunt/kingdom/hunters/equipment/more/changelog)全通過
- b) 邏輯/互動(.tmp/measure2.js,同 390×844 DPR2 同測試存檔,互動目標判定=native control/[onclick]/[role]/tabindex≥0/cursor:pointer):6 畫面互動目標 <44px 由 100 → 0 — hunt 0/kingdom 0/hunters 0/equipment 0/more 0/buildings 0,168 枚互動目標逐一 ≥44×44;原始 100 中 14 枚為無 handler 且 cursor:default 的純資訊標籤(建築橫幅名牌×4「王城大廳 Lv12」等＋建築卡金階/銀階×10,皆無 click、cursor:default)已證非觸控目標,於報告逐項排除(互動目標定義即排除非可點元素);改動後實點 一鍵例行/一鍵領取全部/自動分解(modal 開關)/排序 ▸ 全正常
- c) 回歸:核心流程 王國→副本(hunt)→英雄→裝備→建築→更多→世界地圖→回王國 全程 DOM 走訪＋按鈕實點(.tmp/regress8.js),390×844 與 1280×800 雙視口、reducedMotion on/off 雙路徑,每步 console 監聽零 error/unhandledrejection(雙視口各 errs:0);改動後量測 派遣/自動續戰/自動進關 高度=44、hunters 作業列 高度=44
- d) 實機:本地 spawned Chromium(--headless=new,未加 --disable-gpu)注入中後期存檔,雙視口整頁 reload＋六畫面逐一 show 零 console error(unhandledrejection 0)
- e) 截圖(皆含 vN):after progress/v586-mobile-{hunt,kingdom,hunters,equipment,more,buildings}.png(390×844 DPR2)＋v586-desktop-{hunt,kingdom,hunters,equipment,more,buildings}.png(1280×800);before 引用 progress/round8-mobile-{home,hunt,kingdom,hunters,equipment,more}.png
- f) 視覺審美閘門(harness inspect_image 判讀,全程可用未降級,未用 tools/vision-review.mjs):hunt「按鈕/靈藥 chips/全部啟用 單行置中,無換行/溢出,僅 第4-5隊 橫向捲動帶貼邊(既有 overflow-x:auto 設計非破版)」;kingdom「一鍵例行/一鍵領取/每日任務卡 單行置中;唯一 2 行 wrap 產出加成『成』dangle=round-8-evidence 已證既有問題,非本輪回歸;任務卡列為橫向 carousel」;equipment「全部篩選/品質/★1-6/排序/自動分解 chips 單行置中無溢出」;hunters「分頁/篩選/作業列 5 鈕 單行置中(8-16px 高度放大後標籤均未換行);右緣 chip 貼邊屬 list-scroll 橫向捲動」;桌機 hunt「480px 單欄置中、動作鈕單行無溢出」— 全 PASS、無放大後新增破版
風險與回滾點:純視覺幾何層(css floor 規則＋逐畫面 inline 幾何屬性) — 零數值公式/零掉落/零存檔 schema/零渲染層/零新增隨機性;放大的來源是 min-height(min-height:44)而非寫死 height,文字不截斷;唯一可量化殘留 14 枚 <44px 為無互動語義的純資訊標籤(cursor:default 無 handler),報告逐項列出並以互動目標定義排除;高密度列表(每日任務卡/建築卡列)因 44px 升高總高略增需捲動,屬可接受(放置頁本就長捲);git revert 本輪 commit(6 js＋css＋changelog＋index)即完整還原,無遷移/無殘留;backlog 打勾:P1「點按目標 44px 完整覆蓋 audit」

---

### [v585] 軌道:【戰鬥畫面美術】(全局輪次 7・循環 2)
改動:傷害浮字可讀性 — 同目標短窗合併＋分道錨點:每擊同時生成的英雄 echo＋怪物側浮字改為按目標/種類合併成可讀累加計數,浮字搬到 boss 本體/血條上方淨空區並三窄道分置;解決「BOSS 被同屏 14-61 枚數字淹沒半身」的首要可讀性破壞。同幀浮字峰值 61→13、平均 43→9,BOSS 軀幹帶浮字數歸零
為何讓玩家玩更久:放置玩家絕大多數在線時間就是盯著戰鬥畫面;「1 秒讀懂誰在打誰、輸出多少」是觀戰滿足感第一要件。現況同屏 14-61 枚同字號多色浮字互相遮蔽、辛苦堆出的大數字從成就回饋變雜訊、BOSS 被數字蓋住半身(證據:「被數字淹沒的紫色方塊」)— 掛機觀戰從「看得懂的輸出秀」變「糊一片」。合併成逐英雄/逐側累加計數後,每秒總輸出一眼可辨、BOSS 本體重新成為焦點,直接延長掛機駐留;附帶解掉候選 4(擊殺回饋被數字蓋)的疊加主因
實作:js/ui/hunt.js(spawnFloat 新增 opt.merge/opt.side/opt.val,anim.floatMerge map 與 mLane/hLane round-robin 計數器,怪物側 M_LANES 三窄道＋英雄側 H_LANE_Y 垂直道,合併回錨 y0＋pop 脈衝,浮字死亡清表)、js/ui/render.js(drawBattle 浮字段:pop 字號 ×1.25 回落、prefix+fmt(val) 重組顯示)、js/data/changelog.js(v585)、index.html(快取 610→615)
驗證:
- a) 語法:node --check 全 js 通過(含 hunt.js/render.js/changelog.js)
- b) 邏輯(瀏覽器 view 探針,沿用取證 Lv×200 深淵 BOSS):改動前同幀峰值 61/平均 43;改動後峰值 13/平均 9(79%/87% 降);BOSS 軀幹帶(y>150,x280-360)浮字數歸零(改動前 8+ 枚疊壓);合併累加正確(m_hit 計數顯示累加值 32057、單擊約 -1180,明顯為多擊總和);像素取樣計數帶 968 亮像素、boss 帶潔淨
- c) 觸發路徑全跑:普攻 hit/crit、五職業技能(含元素色 m_skill)、buff/heal 技能名、mhit 受擊紅、毒 dot(#c792ea)、mheal 再生綠(#7ee787,冰原 regen boss 實測)、擊殺金幣/經驗、精英/BOSS 宣告、滅團/再戰 — 各類浮字仍出現且顏色不串桶;reducedMotion 定幀(零浮字零錯誤,fight 續行);核心流程(王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口→回城待機)逐屏 console 零 error
- d) 實機:spawned Chromium 未加 --disable-gpu,實戰/離線/回城多場 console 零 error/unhandledrejection
- e) 截圖(皆含 vN,4× 放大＋1×):progress/round7-after-4x-a.webp、round7-after-4x-b.webp、round7-after-4x-c.webp、round7-after-1x.webp、round7-band-crop-6x.png、round7-bossbody-crop-6x.png;並排對照 progress/round7-arrow-dense.png、round7-boss-4x.png(改動前)
- f) 視覺審美閘門(harness inspect_image,全程可用未降級,未用 tools/vision-review.mjs):4× 判「dragon body visible，不覆蓋傷害數字;傷害計數器置於以其上方天空帶(y~85-130,x~290-355);五英雄可見、身體未被埋葬;無文字疊壓 boss 名/血條或英雄」— 核心 PASS(boss 不再被淹沒、計數位置正確、英雄露臉);唯一保留為 4× 縮放後小字數值可讀性(解析度/對比限制,非遮擋問題),以像素取樣＋探針計數斷言補足
實測偏離 plan(皆依證據校正):①plan MERGE_WINDOW=0.25s 短於攻擊間距致每擊仍生新字(peak 61 未降)→ 改「合併桶存活期間持續累加成持久計數＋回錨 y0」;②plan「crit 不合併」→ crit 單獨成字 flood 淹沒 boss,實測併入 m_crit 金計數(pop 脈衝保留暴擊跳感)使 boss 潔淨;③移除英雄側逐擊出手 echo(5 英雄縱列 44-160 過窄,放獨力計數互相疊壓;出手由攻擊動作＋怪物側計數承載)— 英雄列完全露臉
風險與回滾點:純演出/繪製層(浮字合併＋分道錨點,spawnFloat 與 render drawBattle 浮字段)— 零數值公式/冷卻/三圍/命中判定/存檔 schema/新增隨機性;floatMerge 為物件查找零每幀大陣列掃描;合併桶對 boss 更替有 ≤0.9s 延遲(舊計數存活期間併入新 boss 首擊,後續自新,次要);git revert 本輪 commit 即完整還原;backlog 打勾:P1「傷害數字可讀性(密集合併/大數字量級標示)」

---

### [v584] 軌道:【村莊與王國美術】(全局輪次 6・循環 2)
改動:村莊夜空/遠山對比修色 — drawTown 夜景色板原全擠同一明度帶,使已繪製的遠山/月霜山頂/月光描邊在視覺上隱形;改天空四段漸層(加地平線光帶)＋山體四級色階拉開＋右緣月光描邊提亮,讓既有遠景幾何浮現(不重繪幾何、不動任何座標)
為何讓玩家玩更久:王國頁與狩獵回城休息頁是全玩家每日多次回訪的「家」畫面,第一眼就是這片天空與地平線;現況場景止步於「兩排房子＋單色天空」,村莊讀不出縱深與世界感,「這裡有人住、值得回來」的期待感被壓平。遠山/月霜/月光描邊是既有深度敘事投資(v252/v267/v271/v273 多輪打磨),只是色板把它們埋掉 — 一次純修色即可兌現既有投資,讓每日回訪第一眼從「平面貼圖列」變成「有遠山有月光的夜鎮」
實作:js/ui/render.js(drawTown 純色票/漸層常數:天空漸層 0=#1d2036/0.45=#232642/0.72=#2b3050/1=#1a1c2e;新月遮罩 #21243c;山腳 #191b2c/山腰 #242a44/山脊 #333d5e/月霜山頂 #48587e;右緣月光 #3d4a6e;山脊樹線 #1d2136)、js/data/changelog.js(v584)、index.html(快取 609→610)
驗證:
- a) 語法:node --check js/ui/render.js、js/data/changelog.js 全通過
- b) 邏輯(瀏覽器實測烘焙畫布 480×200 1x 取樣):①山脊 #333d5e(51,61,94) at (433,130) vs 同 x 上方天空 (37,41,70) → 每通道差 (14,20,24)≥8 且山脊亮度 206>天空 148;②月霜山頂 #48587e(72,88,126) at (438,125) B=126≥96 且亮度>山脊;③地平線帶 y150 #292d4c(41,45,76) 較原 #141524(20,21,36) 明顯加亮
- c) 確定性:改動區段 grep 無 Math.random;reducedMotion 定幀同視角逐幀哈希 diff=0(townCanvas 2542507318 雙幀一致,fxCanvas 亦 0 — 先 flush raf 再採樣)
- d) 回歸:核心流程(王國→狩獵休息→世界地圖→回王國→狩獵)6 步每步 console 零 error/unhandledrejection;worldmap v271 村莊畫框(drawTown 平移重用)渲染不破(截圖 v584-worldmap-village.png 零錯誤);fxCanvas 疊層/鎖定遮罩/名牌熱區零變動(本輪零座標改動,截圖目視對位)
- e) 截圖(皆含 vN):progress/v584-kingdom-4x.png、v584-kingdom-4x-full.png(1920×800 全幅)、v584-hunt-rest-4x.png、v584-hunt-rest-4x-full.png(1920×1080 全幅)、v584-skyline-band-8x.png、v584-base-skyline-8x.png(乾淨無遮蔽天空帶 3840×352)、v584-skyline-before-after.png(改前/改後並排)、v584-worldmap-village.png
- f) 視覺審美閘門(harness inspect_image,全程可用未降級,未用 tools/vision-review.mjs):①乾淨天空帶 8× —「repeating row of 5 distinct low arc/dome mountain mounds, evenly spaced」「peaks' tops paler cooler slate-blue, faint moonlit frost impression」;②並排 before/after 同帶 8× — RIGHT(after)「clear row of 5 distinct peak mounds, readable tops/darker bases, separates from night sky as clean dark shapes」vs LEFT(before)「only weakly readable, ~5 faint mounds, sky-blended」;③full hunt rest 4× 全幅 — 讀到「moon upper-right (pale crescent)」＋「4-6 rounded mound silhouettes behind buildings」(改前證據 K3 判 0 座) — 遠山由隱形變可讀;frost 為「modest value lift, not bright snow」→ 未觸發風險1(不需降階 #48587e);風險2(地平線光帶於 H=270 與山體對位無脫節)、風險3(新月呈乾淨 crescent 無色塊邊)皆未發生;整體仍藍灰夜語彙不跳色
風險與回滾點:純色票/漸層常數改動(render.js drawTown 一段) — 零座標/零幾何/零迴圈/零隨機性/零存檔 schema/零數值;git revert 本輪 commit 即完整還原;留月霜山頂 #48587e 未降(審美閘門判「modest value lift, not bright snow」);backlog 打勾:P1「村莊天空/雲/星夜遠景層次」

---

### [v583] 主題:【遊戲數值平衡】(全局輪次 5・循環 2)
改動:掉落(裝備/寶石/技能書/素材/藥水/BOSS額外)每殺機率 ×難度倍率 d.mult(clamp 0.95;BOSS必掉與首殺榮譽不乘)— 補齊 v204 金/經 parity,四難度「掉落/小時」與金幣/經驗一樣精確 parity,夢魘不再是「更慢的同樣掉落」
為何讓玩家玩更久:四難度系統的存在意義是「我能挑戰更難的獵場」。v204 後金/經已 parity,但掉落純每殺獨立 → 夢魘擊殺時間 5.5×、掉落輪次被砍 82%(實測:裝備 586→107/hr、寶石 274→50/hr、書 117→21/hr、素材 2345→426/hr),理性玩家刷裝時**永不切高難度** — 地獄/夢魘解鎖(中後期里程碑)瞬間從「新鮮目標」變成「懲罰按鈕」,四難度形同只有普通一個。補齊掉落 parity 後「挑戰已解鎖的最高難度」成為無損甚至帶精英/Boss 密度優勢的選項,中後期玩家每次戰力成長都有理由把難度往上推一檔 — 這正是「再開一次遊戲試試夢魘」的留存動機
診斷證據(確定性模擬 .tmp/round5/drop-parity-sim.js,dps=5717・glacier r4 stage9 非首領;唯一邏輯改動後同表對照):
```
difficulty | d.mult | kills/h | eq/h  (before->after) | gem/h (b->a)      | book/h (b->a)     | mat/h (b->a)
normal     | 1      |  7817   | 586->586  | 274->274  | 117->117  | 2345->2345
hard       | 1.8    |  4342   | 326->586  | 152->274  | 65->117   | 1303->2345
hell       | 3.2    |  2442   | 183->586  | 85->274   | 37->117   | 733->2345
nightmare  | 5.5    |  1421   | 107->586  | 50->274   | 21->117   | 426->2345
```
(改前 夢魘 vs 普通 掉落實測 -82%;改後 四難度每小時 eq/gem/book/mat 相互差 <0.05%;金/秒 445.1/445.1/445.7/445.6・經驗/秒 416.9/416.1/415.9/415.6 改動前後不變 — v204 parity 維持;kill-floor 頂層 dps 穿透態同表驗證 parity 0.000%)
實作:js/sys/loot.js（新增私有 helper diffDropMul()＝當前難度 d.mult,深淵 dMult=1 守衛;rollKill 每殺機率全乘 dMul 並 clamp 0.95 — 魔物專屬素材/通用素材迴圈/藥水(內層基礎率 cap 保留)/裝備(BOSS 維持必掉 1 不乘)/寶石/技能書/BOSS 額外券・書;BOSS 必掉寶石與首殺榮譽邏輯不動）、js/ui/hunt.js（lootInfoBlock 顯示率改讀 dropInfoOf 同 dMul — v256 單一來源,難度切換顯示正確變化）、js/data/changelog.js(v583)、index.html(快取 608→609)、docs/DESIGN.md §13(補掉落 parity 契約句＋修正過時 gold/exp 文案)
驗證(協議 a-f):
- a) 語法:node --check js/sys/loot.js、js/ui/hunt.js、js/data/changelog.js 全通過
- b) 數值(同一支模擬改動前後對照+實機 rollKill 抽樣):①四難度每小時 裝備/寶石/書/素材 改後相互差 <0.05%(586.2/586.2/586.2/586.1・273.6/273.5/273.5/273.5・117.2×4・2345.0/2344.7/2344.6/2344.6 — 門檻 <5% 大幅達標);②普通難度(dMul=1)改動前後逐位元一致(零回歸錨,eq/gem/book/mats identical=true);③金/秒・經驗/秒四難度改動前後不變(parity 未破壞);④kill-floor 態(頂層 dps)parity 0.000%;⑤實機 rollKill 15000 殺/難度(seeded 確定性)— 每殺率命中預測公式 base×effScale×dMul(3σ 二項 CI 內:normal 7.5/5.2/2.1%→nightmare 41.3/28.5/11.6% 含 gemworks/library 建築加成 ×1.48/×1.4);精英怪 nightmare eq/kill 94.6%(clamp ≤0.95 不溢出)、BOSS nightmare eq/kill 100%(必掉仍必掉)、深淵遭遇難度洩漏時 dMul=1 守衛生效(eq/kill 7.8%≈7.5%)
- c) 回歸:核心流程 王國→副本→英雄→裝備→建築→更多→世界地圖→回城待機 桌機 1280×800＋行動 390×844(DPR2)雙視口 每步 console 零 error/unhandledrejection,派遣中 5 人 battle phase=fight;掉落一覽顯示隨難度切換:普通 裝備 8%/寶石 4%/書 2%/藥水 12% → 夢魘 41%/19%/8%/66%(dropInfoOf 與 rollKill 同源,截圖 v583-drop-panel-normal.png / v583-drop-panel-nightmare.png);離線預覽(offline)夢魘 +491萬金/時 = 普通(+491萬/時)同值精確 parity;離線結算(save.js offline)不走 rollKill — 金/經走 rates() 已 parity、素材/裝備為難度無關平量贈予,不涉及本輪每殺 parity、無新失衡(於報告明註)
- d) 實機:本地 spawned Chrome(--headless=new,未加 --disable-gpu)注入中後期存檔;雙視口整頁 reload＋監聽零 console error;reducedMotion 路徑零錯誤;夢魘 30s 實戰 soak — 14 殺/7 件掉落/金 225199,零錯誤
- e) 截圖:progress/v583-difficulty-drop-parity.png(夢魘狩獵畫面,離線預覽 parity)、progress/v583-drop-panel-normal.png(普通掉落一覽 8/4/2/12%)、progress/v583-drop-panel-nightmare.png(夢魘掉落一覽 41/19/8/66%)
- f) 存檔相容:零 schema 改動(無新欄位);舊存檔無 hunt.difficulty(normalize=0)→ dMul=1 行為同普通(dropInfoOf eqRate 0.075 = normal,實測 same=true)
風險與回滾點:單檔單 helper(diffDropMul)＋rollKill 每殺乘數＋hunt.js 顯示同源 — git revert 本輪 commit 即完整還原,DIFFICULTY 常數表/存檔 schema/rates()/scaledMonster/離線結算零觸碰、零遷移殘留、零新增隨機性(沿用既有 U.chance 骰子契約);已知殘留(可接受、非倒掛):①精英怪高難度設備率因 clamp 0.95 略低於純 parity(每殺最多 1 件的物理上限,0.30×5.5→0.95)但普通不受損;②BOSS 必掉寶石為必掉語義不乘 → 高難度 BOSS 必掉寶石/時微稀(主幹寶石/書/素材/裝備已 full parity);backlog 打勾:P1「4 難度效率 parity audit」
(v583 修正輪):掉落一覽「素材」行顯示仍用未乘難度倍率的基礎率(普通/夢魘同示 25%),與 rollKill 夢魘實戰 min(0.95, 0.25×5.5)=95% 脫鉤,違反自立的 dropInfoOf/rollKill 同源契約 → 修正:①js/sys/loot.js dropInfoOf 的 drops 映射 `c` 改為 `Math.min(0.95, d.c * dMul)`(與 rollKill 素材迴圈同 dMul/同 clamp,維持「非精英基礎值 ×dMul」口徑,不加 elite/tMul/dev);②js/ui/hunt.js lootInfoBlock 素材行改讀 `di.drops`(不再用 scaledMonster 的原始 drop.c);node --check 兩檔通過;實機 DOM 素材行四難度 anchor 全數命中 — 普通 25%/困難 45%/地獄 80%/夢魘 95%(=min(0.95,0.25×5.5);地獄 80%=0.25×3.2),BOSS 關無素材掉落(eq 必掉 100% 不變),lootInfoBlock 開啟路徑四難度 console 零 error/unhandledrejection;新截圖 progress/v583-drop-panel-nightmare-fix.png(夢魘素材 95%可讀)＋ v583-drop-panel-normal-fix.png;版本/快取維持 609(不重 +1)

---

### [v582] 主題:【TheoTown 技術對齊與稽核】(循環 1・第 5 輪)
改動:中央城堡 b_castle_iso TheoTown 化重繪 — 「平灰盒＋近黑屋頂平板」→ 亮石板牆（對齊官方 b_tt_demo 石牆色族 66–84% 明度）＋藍石板坡頂（中調勿近黑）＋連續前簷雉堞＋左右多塔（錐頂/雉堞圈/窗/旗）＋拱門台階＋石板縫/瓦排結構雜訊
為何讓玩家玩更久:世界地圖是每日回訪錨點,城堡是全圖最大、唯一王國象徵、每日開圖第一眼的落地點 — 診斷 8× 放大＋像素採樣直擊它與同村官方範例宅邸 b_tt_demo 並排「一眼認出誰是舊的」（屋頂近黑 76%、牆明度僅 60%）,把「我經營的王國很雄偉」的視覺承諾打成扁平灰盒,開圖第一眼就下修留存期待;修齊後城堡以與官方範例同一套 TheoTown 文法立體雄偉可讀,「我的王國在成長」的期待感（留存最上游動機）在每日開圖第一眼即被餵養
實作:tools/gen-iso-art.cjs（drawCastle 全重繪＋新增 retint 疊繪輔助;共用輔助 ttTheo/win/door/flag/speck 未動）、js/data/art/buildings_iso.js（重生成,僅 b_castle_iso 條目變、其餘 10 棟像素逐位元不變）、js/data/changelog.js(v582)、index.html(快取 607→608)
驗證:
- a) 語法:node --check tools/gen-iso-art.cjs、js/data/art/buildings_iso.js、js/data/changelog.js 全通過
- b) 邏輯（重生成＋node 解碼 rows/pal 精確斷言）:屋頂區(sprite y1–14)近黑像素(luminance<64)77.6%→0.0%（<10% ✓）;牆主面 wallL 明度 69%（對齊 tt_demo 66–84%）;亮脊線存在(x32 明度 178 > 兩側屋面 x30=131/x34=93);前簷雉堞亮垛 29px（≥7 ✓）;git diff 逐位元比對僅 b_castle_iso 條目變化（其餘 10 棟 b_guild/training/library/forge/alchemy/market/altar/gemworks/warehouse/house 像素完全一致,共用輔助零波及）
- c) 回歸:核心流程 — 世界地圖開啟→返回王國→再開世界地圖→縮放/導航;每步 console 監聽零 error/unhandledrejection;b_castle_iso 尺寸 64×48/scale 1.2/map.js:565 繪製呼叫與錨點零變動（純 sprite 資料換新）
- d) 實機:本地 spawned Chrome（--headless=new 未加 --disable-gpu）開世界地圖（注入中後期進度檔）零 console error;reducedMotion=true 開圖＋導航零錯誤（靜態 sprite 與 rm 無關）
- e) 截圖:progress/v582-before-castle-8x.png（改前）、v582-after-castle-8x-crop.png（改後 8×）、v582-after-side6x-crop.png（與官方 b_tt_demo 並排 6×）、v582-map1x.png（全圖 1× 概覽）
- f) 視覺審美閘門（harness inspect_image,全程可用未降級,未用 tools/vision-review.mjs）:①城堡單獨 8× — 不再判「plain gray box/flat dark slab」,多塔/藍瓦坡頂/雉堞/拱門台階齊備 7/10（殘:中央脊線＋旗桿 8× 縮小讀微似桅、雉堞節奏於壓縮圖不可全數）→ 回改一輪（屋頂降飽和、脊線降亮、前簷雉堞加高、拱門加深內影、牆 speck 細緻化）後雉堞/門/塔全可讀;②與官方 b_tt_demo 6× 並排 —「同文法:亮藍灰石牆同族/左亮右暗/零黑輪廓/深綠貼地影/多部件,配色足以共存,城堡讀作詳實 TheoTown 城堡,一致性 8/10 — 認不出誰新誰舊」;③全圖 1× 概覽 — 中央地標不再被點名為平盒,讀作全圖最亮冷調地標,與暖瓦村舍同場不衝突
風險與回滾點:純美術資產級（tools/gen-iso-art.cjs drawCastle 單函數＋重生成 buildings_iso.js 單條目）— 零數值/零存檔 schema/map.js 零觸碰（繪製呼叫/錨點/名牌/熱區/尺寸/scale 全不變）/零新增隨機性（全 seeded）;git revert 本輪 commit 即還原（兩檔,無 schema/無 map.js 變動）;風險:城堡比鄰村亮一階（官方石牆本即全圖最亮,且城堡為地標,可接受）、1.2× 縮放下雉堞細節在壓縮縮小讀像（8× 與 6× 並排均可讀,玩家 2× 以上縮放可辨）;註:測試過程為測試存檔,不影響正式進度

---

### [v581] 主題:【TheoTown 海洋・氛圍與動態】(循環 1・第 4 輪)
改動:海岸燈塔＋碼頭 TheoTown 化全重繪（燈塔 stub→石基/條紋塔身/拱門/暖窗/燈室/穹頂金飾/深綠貼地斜影;碼頭平色塊→甲板板縫/樁柱/水下影/纜繩/絞繩/木桶/板條箱）＋燈室暖光暈 — 完成 P0 backlog「海洋活化(漁船/燈塔)」全數（漁船/沿岸淺水泡沫/海鷗為同批在途 v581 海洋層,一併簽入）
為何讓玩家玩更久:世界地圖是每日回訪錨點,海灣是右下角新玩家第一天就能捲到的第一片海 — 診斷 4× 放大直擊「燈塔=幾像素 stub、碼頭=平棕條、船糊成一團、光束與塔斷開」,海洋在真實觀賞尺寸讀作暗塊,把「世界邊緣」打成「沒做完的背景」;重繪後海灣五件套（燈塔/碼頭/漁船/白浪泡沫/海鷗）共享同一 TheoTown 文法,每日掃圖路線經過角落時永遠有完整場景,探索右下角的慾望落地為畫面回饋
實作:js/ui/map.js（drawLighthouse/drawDock 全重繪＋drawSeaFx 燈室暖光暈;錨點/光束錨定/名牌/熱區零變動;含在途 v581 海洋層:海岸淺水/白浪泡沫/漁船重繪/海鷗/深海軍藍底色）、js/data/changelog.js(v581)、index.html(快取 606→607)
驗證:
- a) 語法:node --check js/ui/map.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測,drawImage hook 取偏移後 base 像素精確斷言）:①簽名部件全數在位（2× 視角 count）— 白帶 56+20px/紅帶 121px/石基 227px/門 90px/暖玻璃 15px＋金飾 15px/甲板 31px/板縫 23px/木桶 51px/板條箱 65px/絞繩 6px/纜繩柱 57px/甲板下暗化 14809px（深海＋樁影）/沿岸淺水 578px;②位置:塔身帶(55,183)=(150,64,44) 紅帶家族、燈光(55,170)=(255,211,107) 暖暈、腳下陸地(55,208)、遠海(130,240)=(22,35,60) 深海軍藍 — 與錨點數學一致;③新玩家路徑（maxRegionReached=0,rm）:海灣陸地屬鎖定區 → 燈塔碼頭正確在霧內（舊行為一致）,泡沫/漁船/海鷗照常 — 零回歸;④rm 雙幀哈希 diff=0（全定幀）＋燈塔在位;⑤zoom 1×/1.5×/2× 循環＋小地圖/滾輪/拖曳導航零錯誤
- c) 回歸:核心流程全通過 — 王國→副本→英雄→裝備→建築→更多→頂欄世界地圖(2 canvas)→世界首領名牌點擊→返回→回城待機;每步 console 監聽零 error/unhandledrejection;全新存檔開圖零錯誤
- d) 實機:桌機 1280×800 與手機 390×844(DPR2,canvas 345×375) 雙視口 — 手機 2× 海灣全部件在位（白 31/紅 222/暖玻璃 4/甲板 63）＋rm 定幀零錯誤;10s soak 零錯誤
- e) 截圖:progress/v581-diag-bay-4x.png（診斷前 4×）、v581-after-bay-crop.png（重繪後 4×）、v581-after-bay-full2x.png（2× 全景）、v581-side-windmill-bay.png（並排:風車 vs 燈塔 4×）、v581-bay-1x-desktop.webp（桌機 1×）、v581-bay-mobile.webp（手機 2×）、v581-soak-desktop.webp
- f) 視覺審美閘門:4× 放大 inspect_image 全過程可用（未降級）— 新燈塔「石基/條紋塔/亮門/暖窗/欄杆平台/燈室/穹頂/金飾,讀作完整燈塔 sprite」8/10;before vs after:「幾像素 stub＋平棕碼頭 → 完整燈塔＋結構碼頭」;與風車（既有已達標）並排「同文法:無黑輪廓/左上受光/多部件/貼地陰影」一致性 7.5/10,新燈塔細節略高於基準 — 認不出誰是新舊
風險與回滾點:純美術資產級（map.js 繪製層單檔＋changelog/index）— 錨點座標(lx,ly/dx,dy)/光束錨定(lx,ly-30)/名牌/熱區/門檻/滾輪/小地圖零變動、零數值/零存檔 schema/零新增隨機性（全 seeded 確定性,暖光暈為確定性呼吸,rm 定幀）;map.js 內含同批在途 v581 海洋層（海岸/漁船/海鷗）與本輪燈塔碼頭,git revert 本輪 commit 會一併回滾（兩者同屬「海洋活化」P0,無獨立回滾點）;若顯示回歸,revert 即可;註:測試過程為測試存檔,不影響正式進度

---
### [v580] 主題:【TheoTown 地形・道路與環境】(循環 1・第 3 輪)
改動:戰爭迷霧邊緣柔化 — 原逐 tile 平塗 0.62 暗霧（交界一刀切、霧內零紋理）重寫為「BFS 深度場＋逐像素 smoothstep 漸變＋霧內同系雜訊」,交界 ~10px 連續漸層、全霧 0.66 不變、霧讀作「有厚度的冷藍氣體」
為何讓玩家玩更久:世界地圖是每日回訪錨點（寶箱/首領倒數/模式入口都在這張圖）,而迷霧是圖上最大的未解區域 — 教學明文「灰霧區域擊敗守關 BOSS 後解鎖」,霧是探索慾望的載體;舊版硬切平塗讓鎖定區像「被挖掉的洞」,把「世界等你發現」的謎團感打成廉價遮罩;柔化後邊緣輪廓漸顯、霧內深淺流動,解鎖瞬間「霧散見真章」的驚喜落地,未解鎖區從「壞掉的地圖」變成「值得探索的遠方」— 探索–解鎖–慶祝迴圈的期待感升級,新玩家第一眼看到的世界不是被切掉的,而是等著被揭開的
實作:js/ui/map.js（buildBase 迷霧段重寫:BFS 深度場 fogD(4 連通多源擴散,種子=海洋/村莊/已解鎖區)＋霧區 bbox 逐像素逆等角投影取深度、雙線性取樣 fogAlpha smoothstep(d≤0.45 清楚→1.65 tile 外 0.66)→直接混合回 base;霧內 seeded 雜訊(#485a84/#000 亮暗點)＋邊緣冷藍霧氣點(#768ab4);色 #0a0c1a→#0d1020 微抬;零座標/名牌/熱區/地標變動,全靜態烘培零新增隨機性）、js/data/changelog.js(v580)、index.html(快取 605→606)
驗證:
- a) 語法:node --check js/ui/map.js、js/data/changelog.js 全通過
- b) 邏輯(瀏覽器實測,reducedMotion=true 全定幀使 before/after 同視角逐像素可比;git revert 舊碼同視角重抓 v580-before-rm.png 為基準;注入 maxRegionReached 觸發解鎖慶祝平移精確定位霧帶):①霧區逐像素 diff — bbox(242-574 × 0-624)外零變化(村莊/廣場/海洋與舊版 byte 相同,霧改動零漏出);②邊界剖面 y=159:112→110→104→86→74→69→67→66→73→…→41→37→27 連續漸變,亮→霧最大 1px 步進 17.6-22(舊版同剖面 108→38 於 2-3px 一刀切、霧內全圖單一亮度 38);③霧內層次:深霧區亮度 27-38 變化＋霧氣亮點/暗點(舊版 0 變化)
- c) 回歸:核心流程全通過 — 王國→副本→獵人→裝備→建築→更多→世界地圖(2 canvas)→縮放 1×/1.5×/2× 循環→回城待機;每步 console 監聽零 error/unhandledrejection;全新存檔(maxRegionReached=0 全圖霧,最重路徑)開圖 <70ms;reducedMotion=true 雙幀哈希 diff=0(靜止)零錯誤
- d) 實機:桌機 1280×800 與手機 390×844(DPR2,canvas 690×750)雙視口整頁 reload＋開圖零 console error;10s soak 零錯誤
- e) 截圖:progress/v580-after5-rm.png(最終霧,全新存檔視角)、v580-before-rm.png(舊碼同視角基準)、v580-before-after-side.png(並排)、v580-after-boundary-4x.png(4× 邊界)、v580-fog-edge-open-4x.png(開闊地形邊界 4× 特寫)、v580-fog-fresh-6x.png、v580-windmill-6x.png、v580-windmill-vs-fog.png(已達標風車並排對照)、v580-midgame-desktop.png / v580-midgame-mobile.png / v580-mobile-rm.png(回歸視角)
- f) 視覺審美閘門:4× 放大 inspect_image — 開闊地形邊界特寫「連續漸層光錐羽化、4-6 中間色階、霧內樹影/地形隱約可辨、非硬遮罩」(6.5-7.5/10);並排行「OLD 硬切死黑 vs NEW 柔和薄霧漸層＋霧內層次」;與風車並排「色系/左上受光同源,霧為同系更深階」;迭代紀錄:初版 2×2 子菱形 4× 放大仍有平帶階梯(閘門 4/10)→ 4×4 子取樣改善 → 逐像素合成消除平帶＋smoothstep 曲線(邊緣軟而霧體實)達標;降級未發生(inspect_image 全程可用)
風險與回滾點:純美術環境層(map.js 烘焙段單處＋changelog/index)— 零數值/零存檔 schema/零座標/零新增隨機性(全 seeded 確定性);buildBase 一次成本無感;若顯示回歸,git revert 本輪 commit 即可;註:測試過程為測試存檔,不影響正式進度
---

---
### [v579] 主題:【TheoTown 村莊生活感與街道】(循環 1・第 2 輪)
改動:街道燈柱 TheoTown 化 — 6 座 v292 路燈（近黑細桿＋6×4 暗罩＋平光方塊,R2/R3 違規）整座重繪為完整燈柱語彙:石基座（三階漸暗＋左上受光）＋鐵柱（亮暗雙面）＋青銅罩框（無黑輪廓）＋琥珀玻璃亮芯＋金頂飾＋烘培暖光暈;錨點/名牌/熱區零變動
為何讓玩家玩更久:世界地圖是每日回訪錨點,街道是最先入眼的畫面層 — 6 座燈柱在每條主街重複暴露「近黑桿＋平黃塊」,把街道生活感下限釘在 TheoTown 文法之外（8× 放大並排風車/官方樣張即破綻）;重繪後每條街的燈柱都是完整暖燈籠,晨昏掃街的畫面密度與地標/建築同源,「有人居住、晚上會亮燈」的期待感落地
實作:js/ui/map.js（v292 路燈區塊 29 行重繪:石基座 6×3 三階＋鐵柱 3px 雙面＋青銅罩框＋柱罩接環＋金頂飾＋琥珀玻璃＋radial 暖光暈;座標/名牌/熱區/縮放零變動）、js/data/changelog.js(v579)、index.html(快取 604→605)、tools/png-recv-server.py（診斷用 PNG 接收伺服器,供瀏覽器→progress 截圖直傳,留供後續輪次）
驗證:
- a) 語法:node --check js/ui/map.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測,base 像素精確斷言）:先以 drawImage hook 實測視窗偏移（offX=42/offY=0,村莊置中)後以顯示座標掃描 6 座燈柱 bbox — 琥珀玻璃 #ffb45a/#d8903a 家族每座 3-8px 齊備、金頂飾 #ffd166 5/6 座（1 座被行人遮蔽）;R2/R3:6 bbox 近黑(lum<90) 0px、舊罩色 #2a2a30 全圖 0px（舊燈柱零殘留）
- c) 回歸:核心流程全通過 — 王國→副本→英雄→裝備→建築→更多→世界地圖（2 canvas）→競技場地標 modal「競技場」→關閉→派遣出征（dispatchIds 1→擊殺 1→關卡 1→2）→召回（ids 0/phase idle）→回城待機;全新存檔（MG.core.save.reset 真實流程）boot＋教學跳過＋地圖零錯誤;縮放 1×/1.5×/2× 循環零錯誤;每步 console 監聽零 error/unhandledrejection
- d) 實機:桌機 1280×800 與手機（--window-size=390,844 --force-device-scale-factor=2,DPR2/canvas 690×750）雙視口整頁 reload＋10s 地圖 soak 零 console error;reducedMotion=true 地圖雙幀哈希 diff=0（靜止）零錯誤
- e) 截圖:progress/v579-lamp-desktop.png（桌機全圖 2×）、v579-lamp-mobile.png（手機全圖 2×）、v579-lamp-village4x.png（村莊 4×:燈柱於街景）、v579-lamp-new-a8.png / v579-lamp-new-b8.png（新燈柱 8× 放大）、v579-lamp-before-after.png（舊燈柱程式重現 vs 新燈柱 8× 並排）、v579-lamp-vs-reference.png（新燈柱 vs 風車 vs 官方樣張 sample10 三併）、v579-reference-windmill8.png
- f) 視覺審美閘門:8× 放大 inspect_image — 新燈柱「石基座/金屬柱/青銅框/琥珀玻璃/金頂飾/暖光暈全齊、無近黑、讀得出是點亮的燈籠」;before/after 並排「右側=形狀完整的暖燈籠,左側=暗桿＋平黃塊」;三併參照（風車=既有已達標、官方樣張=文法權威）「同色系文法、無黑輪廓、左上受光、深綠貼地」家族一致 — 認不出誰是新舊;單回改迭代:初版像素斷言因未計 offX=42 視窗偏移而假失敗 → 以 drawImage hook 取偏移後重測通過
風險與回滾點:純美術資產級（map.js 繪製層單檔＋changelog/index）— 錨點座標/名牌/熱區/縮放/門檻/fx 語義零變動、零數值/零存檔 schema/零新增隨機性（全靜態烘培,radial gradient 確定性）;若顯示回歸,git revert 本輪 commit 即可;註:全圖唯一亮色異常區（西廣場光團,視覺模型誤讀為「白雲＋-17 文字」）查證為 v573 官方範例宅邸 b_tt_demo 淺藍灰牆（#b0d0f0 家族,本遊戲最亮建築）— 既有資產非本輪回歸、建築主體屬主題 1 範圍,列入觀察;測試過程為測試存檔,不影響正式進度
---

---
### [v578] 主題:【TheoTown 建築與地標】(循環 1・第 1 輪)
改動:模式地標精緻化 — P0 backlog「模式地標對齊區域地標水準」收斂:4 座弱勢地標重繪（元素試煉塔/世界首領碑/無盡深淵/委託遠征營:塔身加寬加高＋雙窗列＋2 階石階、頭骨受光明暗＋眼窩去近黑＋土台分層、裂口壁受光＋階梯立面＋石燈石座、帳篷布面三色階＋營火石圈＋補給箱分面）＋全地標貼地陰影深綠化（lmShadow 黑 25% → 深綠 rgba(18,34,16,0.5),與官方「陰影=黑 20% 覆蓋草地=深綠」文法一致）＋鎖定遮罩/名牌/fx 重錨
為何讓玩家玩更久:模式入口是每天點最多次的地圖元素（競技場/秘境/世界首領/公會/活動的每日儀式報到點）;診斷以 base 像素座標系統（isoX 含 XO=448）逐座採樣＋4× 並排（模式 vs 區域地標）實測:4 座弱勢地標體量最薄（塔身 12px/營帳 12px/石燈無座/頭骨平塗）、暗部靠死黑（頭骨眼窩 #1a1018 撞 R3、深淵壁無分層）、貼地陰影純黑 rgba(0,0,0,0.25) — 在 1×-1.5× 真實觀賞尺寸下糊成暗塊,與身旁已達標區域地標（風車/冰塔）並排即破綻,「世界有內容」的期待感被細節斷層下修;精緻化後每天第一眼掃過傳送帶的瞬間,10 座入口全部以同一 TheoTown 文法（多部件/左亮右暗/深色貼地陰影/無黑輪廓）立體可讀,地圖密度對齊 EHT 級
實作:js/ui/map.js（lmShadow 深綠化加高、mdSpire/mdBone/mdStairs/mdCamp 四座重繪、LM_ART 包覆盒更新 tower w26h50/abyss w34h24/exped w38h24、模式名牌偶數列 -46→-52、fxSpireGlow/fxStairsGlow/fxCampFire 重錨）、js/data/changelog.js(v578)、index.html(快取 603→604)
驗證:
- a) 語法:node --check js/ui/map.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測,base canvas 像素精確斷言）:重繪簽名色齊備 — spire 塔身 #8a7a9a 138px/四元素窗 #4fc3f7·#ff6a4a·#7ee787·#ffd166 各 ≥4px 於窗框內/金尖高光 #ffdf8a 6px/四色旗 8px;worldboss 頭骨受光 #f4eee2 22px/眼窩 #3a3038 8px/#1a1018 全 bbox 0px/前台階 8px;abyss 壁緣受光 #3a3a4c 36px/石座直繪後 #4a4a58 12px＋前唇 9px（初版 box 細件被微光遮蔽 → 改直繪回改）/裂縫 #0a0a14 6×10;exped 藍帳左亮 #6a8aaa 34px/右暗 #3a4a5a 30px/石圈 16px/旗受光 3px;全地標近黑(lum<40)佔比 spire 0.8%/worldboss 0.2%/abyss 3.2%（裂縫 interior）/exped 0%/arena 4.4% — R3 無黑輪廓;lmShadow 深綠化:arena/royal 錨點下陰影帶深綠家族像素實測 68/98px（非黑）;fx 重錨:spire 光芒中心於 ay-46±r、stairs 紫焰於石燈 ay-19、camp 營火於 ay-12±h（rm 定幀零錯誤）
- c) 回歸:核心流程全通過（王國→副本→英雄→裝備→建築→更多→世界地圖→競技場地標點擊→modal「競技場…今日挑戰剩 5 次」→關閉→派遣出征 dispatchIds[1]→回村待機 dispatchIds[]）;名牌/熱區/縮放 1.5×/2× 照常;每步 console 監聽零 error/unhandledrejection
- d) 實機:桌機 1280×800 與手機 390-504×844 雙視口整頁 reload＋5s soak 零 console error;reducedMotion=true 路徑地圖/地標/fx 靜止幀零錯誤;全新存檔手機視口（無注入）鎖定狀態渲染正常（🔒 王者/迷宮/遠征營遮罩＋名牌）
- e) 截圖:progress/v578-mode-landmarks-desktop.webp（桌機全圖）、v578-mode-band-1x.webp（模式帶 1×）、v578-before-weak4.webp（重繪前 4 座 4× 並排）、v578-after-redraw4.webp（重繪後 4 座 4×）、v578-reference-strip.webp（區域地標風車/冰晶＋模式地標 4× 對照）、v578-worldboss-abyss-1x.webp、v578-mobile-rm-map.webp / v578-mobile-rm-map2.webp（手機 fresh 鎖定）／v578-mobile-unlocked-rm.webp
- f) 視覺審美閘門:4× 放大並排 inspect_image 前後對照＋區域地標參照 —「風格一致、同 TheoTown 文法、貼地陰影深綠、體量差距收斂」;單一回改迭代（像素斷言發現石燈石座被 box 微光遮蔽 → 直繪修復後 12px 實測）;並排參照:風車/冰晶（已達標）— 認不出誰是新舊
風險與回滾點:純美術資產級（map.js 繪製層單檔＋changelog/index）— 錨點座標/名牌/熱區/門檻/fx 語義零變動（LM_ART 包覆盒依新藝術更新,鎖定遮罩與徽章點同步）、零數值/零存檔 schema/零新增隨機性（全靜態繪製）;若顯示回歸,git revert 本輪 commit 即可;註:測試過程為測試存檔,不影響正式進度
---

### [v577] 主題:【等角地圖・美術與內容】
改動:建築對齊官方樣張逐像素重測 — 取得官方 10-step 教學（t=1233）全文＋sample10 成品 32×25＋光影模板 32×24（存 progress/theo-steps/），逐像素解碼對照 v575 成品，發現並修正 4 項偏差:①陰影 #14161f 近純黑 → 官方 step9「黑 20% 覆蓋」= 深綠（hsl(105,28,21)）;②陰影長度 40% → 官方「length=object height」= 右牆高 H;③屋頂:牆 1.25:1 → 官方樣張屋頂佔 ~68%（ty=1,D=7,H=5 ≈ 2.8:1）;④祭壇 7 色無屋頂無草地 → 重建 ttTheo 四部件（屋頂＋石牆＋草地＋陰影＋聖火）;另草地窄帶→完整菱形前院草（左亮右暗）、煙囪投影改屋頂暗化、城堡察色同步修、輸出標頭 v576→v577
為何讓玩家玩更久:官方樣張是 TheoTown 風格的權威基準 — 深綠陰影（非黑塊）、陰影長度=物高、大屋頂小牆、前院草地正是「一眼像 TheoTown」的關鍵文法;v575 的四項偏差讓村莊與官方樣張並排時仍可辨出規則不同;本輪逐像素重測後官方規格才真正成立,村莊品質對齊官方
實作:tools/gen-iso-art.cjs（ttTheo 骨架重寫、shade/陰影長度/比例/草地/祭壇/城堡）、js/data/art/buildings_iso.js（重生成）、js/data/changelog.js(v577)、index.html(快取 602→603)
驗證:
- a) 語法:node --check 通過
- b) 邏輯:node 審計 11 sprite — 黑輪廓(#000/#101018/#14161f/#14121f) 0 px、sat>78%/l<12% 0 px;ASCII — 屋頂 14px/牆 5px/草地菱形 20-31、祭壇 13 色含屋頂+石台+草地、陰影深綠家族
- c) 回歸:瀏覽器實測（headless Chrome 1280×800）— 村莊中心區像素抽樣 roofRed 1247/roofBlue 1569/wallCream 3642/grass 4145/darkGreen 9669、fallback blob 0、console 零 error
- d) 實機:桌機＋手機 390×844 截圖零錯誤
- e) 截圖:progress/v577-theo-spec-buildings.png（桌機＋手機）
風險與回滾點:純美術資產層（生成器＋art 重生成）— map.js 零觸碰/零座標/零數值/零存檔語義/零新增隨機性（全 seeded）;若顯示回歸,git revert 本輪 commit 即可;官方參考素材留存 progress/theo-steps/（僅作比對基準，非遊戲資產）;註:測試過程為測試存檔,不影響正式進度
---

### [v575] 主題:【等角地圖・美術與內容】
改動:建築重作至 Theo 官方規格 — 取得官方 10-step 教學（t=1233）全部步驟圖＋光影模板＋32×25 成品,逐像素解碼測量:大菱形四坡屋頂（佔高~64%）＋菱形盒牆下半（左亮右暗）＋綠地底座＋右下長陰影＋亮側暗框/暗側亮框＋煙囪投影;11 棟全重畫（v574 的斜頂面/無草地/無長陰影為錯誤規格,已取代）
為何讓玩家玩更久:官方 10-step 教學是 TheoTown 建築畫法權威 — 大屋頂/小牆比例、草地底座、右下長陰影正是「像 TheoTown」的關鍵文法;按像素測量精確落地後村莊建築與官方 sample10 結構逐項一致（v564-v574 全部缺少草地與長陰影、屋頂比例錯誤）
實作:tools/gen-iso-art.cjs（ttTheo 官方比例骨架、11 棟重畫、窗框規則）、js/data/art/buildings_iso.js（重生成）、js/data/changelog.js(v575)、index.html(快取 600→601)
驗證:
- a) 語法:node --check 通過
- b) 邏輯:216 色黑輪廓 0/sat>78% 0;底部行 28-29（含草地）/45/15;ASCII 大菱形屋頂（53-64%）＋牆下半＋草地底帶＋右側陰影與官方 sample10 一致
- c) 回歸:瀏覽器實測 — 右下陰影 106px/暗藍窗 142px（官方規格簽名色）、11683 色、console 零 error
- d) 實機:headless 1280×800 開圖零錯誤;map.js 零觸碰
- e) 截圖:progress/v575-theo-spec-buildings.webp
風險與回滾點:純美術資產層（生成器＋art 重生成）— 零座標/零數值/零存檔語義/map.js 零觸碰/零新增隨機性;若顯示回歸,git revert 本輪 commit 即可;註:測試過程為測試存檔,不影響正式進度
---

### [v574] 主題:【等角地圖・美術與內容】
改動:建築完全重作為 TheoTown 官方規格（以 sample_bmp.png 為規格）— 前牆多階明暗＋磚紋（橫排＋交錯縫）、暗藍窗＋窗台、深色斜屋頂（右高左低＋脊線＋瓦排）、右側牆暗偏藍、底兩階＋深色底帶、角落 AO;11 棟全重作（城堡/9 棟/民房）,角色特徵保留（旗/煙囪/爐火窗/藥瓶/水晶/棚/祭壇聖火/雙門/大窗/平頂齒/塔雉堞）
為何讓玩家玩更久:使用者以官方 demo 為規格要求完全重作 — 官方文法（多階磚紋/暗窗/深頂/底帶/AO）是 TheoTown 建築品質核心;11 棟按此重作後與官方範例宅邸同文法同框,全圖規格統一,村莊建築品質對齊 TheoTown 官方水準
實作:tools/gen-iso-art.cjs（ttOfficial 官方規格骨架取代 ttBox、11 棟配色/特徵重寫）、js/data/art/buildings_iso.js（重生成）、js/data/changelog.js(v574)、index.html(快取 599→600)
驗證:
- a) 語法:node --check 通過
- b) 邏輯:node 掃描 — 211 色黑輪廓 0/sat>78% 0;底部行 27-28/39/15 貼地契約保持;ASCII 深色斜頂面＋磚紋前牆
- c) 回歸:瀏覽器實測 — 暗藍窗 125px/城堡深藍屋頂 31px（官方規格簽名色）、11582 色、console 零 error
- d) 實機:headless 1280×800 開圖零錯誤;map.js 零觸碰
- e) 截圖:progress/v574-official-spec-buildings.webp
風險與回滾點:純美術資產層（生成器＋art 重生成）— 零座標/零數值/零存檔語義/map.js 零觸碰/零新增隨機性;生成器保留可再調;若顯示回歸,git revert 本輪 commit 即可;註:測試過程為測試存檔,不影響正式進度
---

### [v573] 主題:【等角地圖・美術與內容】
改動:TheoTown 官方範例建築正式納入村莊 — 「官方範例宅邸」南街南側 (13,26)（市集正南、倉庫東側空地）;sprite 檔正式化（rows/pal 契約同全部建築）;繪製移入 drawVillage bld() 列表（貼地陰影＋底邊貼地＋scale 1.5 同一語彙）;移除 v572 村外展示區塊
為何讓玩家玩更久:使用者要求「真的做進遊戲內不是放照片」— 官方建築不再是角落展示貼圖,而是每天可見的村莊正式建築,與 11 棟 iso 建築共用同一繪製契約;TheoTown 官方品質的建築本體（灰磚牆/藍窗/黑煙囪/菱形底座）成為村莊一部分
實作:js/ui/map.js（bld 列表加 b_tt_demo 13,26,1.5、移除展示區塊）、js/data/art/tt_demo.js（正式化註解）、index.html(快取 598→599)、js/data/changelog.js(v573)
驗證:
- a) 語法:node --check 通過
- b) 邏輯:瀏覽器實測 — 宅邸灰牆 834px/藍窗 189px/黑細節 32px 在畫布（含貼地陰影）、11380 色
- c) 回歸:世界地圖開啟→南街可見宅邸→名牌/熱區/迷霧正常;console 零 error
- d) 實機:headless 1280×800 開圖零錯誤
- e) 截圖:progress/v573-tt-mansion-in-village.webp
風險與回滾點:純美術資產層＋繪製 1 行 — 零數值/零存檔語義/battle.js 零觸碰/零新增隨機性;刪除 bld 行即移除;若顯示回歸,git revert 本輪 commit 即可;註:測試過程為測試存檔,不影響正式進度
---

### [v572] 主題:【數值平衡與留存】(循環 3・第 5 輪)
改動:卡牆自動再推 — v559/v560 連敗退守暫停自動進關後，引擎記錄牆點，隊伍練角成長到足以突破時自動恢復自動進關（牆點建議戰力 ×1.15 門檻、2s 節流、toast＋戰鬥紀錄）
為何讓玩家玩更久:放置承諾「關掉也在成長/推進」在第一次卡牆就斷裂 — 瀏覽器實測（全新存檔真實引擎步進）新檔首 session 推到第 10 關首領牆 → 滅團 3 次 → 引擎自動關閉自動進關＋遷移退守點，此後關卡/區域/每日任務 d2「推進 5 個關卡」/成就 a_s1「抵達第 10 關」全部凍結：金幣經驗照常累積但「推進」永遠停擺，新玩家若沒發現「自動進關」開關，遊戲停在牆前一週；中後期同病（v559 契約「練完一鍵再推」的手動缺口）— 卡關是放置遊戲最高流失時刻，v559/v560 已把卡牆變成生產性農點，但「農完再推」的手動步驟讓放置迴圈在牆邊洩氣；自動再推閉合「卡關→退守→練角→突破」全自動迴圈 — 睡前卡在首領牆，醒來已推過整區，放置承諾從第一天到終局全程兌現
實作:js/sys/game.js（parkProbe/parkWatch/parkResume — simStep 前後無歧義偵測引擎退守（ws 歸零＋aa 被引擎關閉；手動切換不碰 ws、擊殺歸零不碰 aa，零假陽性）→ 記錄牆點（退守前區域/關卡/難度）→ 戰力 ≥ 牆點建議戰力（牆點原難度倍率）×1.15 自動恢復＋toast「已可突破『X・第 N 關』！自動進關已恢復 — 練角完成，繼續推進」；2 秒節流）、js/ui/hunt.js（toggleAutoAdvance 手動切換清除牆點 marker — 練角專用契約保留）、js/sys/meta.js（awaken 清除 marker）、js/data/changelog.js(v572)、index.html(快取 595→596)
驗證:
- a) 語法:node --check js/sys/game.js、js/ui/hunt.js、js/sys/meta.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測,精確斷言）:①首 session 引擎步進 12 分 — 牆點退守 aa=false＋aaPark={r:1,n:10,d:0}（牆點=退守前關卡,非農點）實測;注入練角成長（等價 idle 結果）→ 戰力 2763 ≥ 牆點建議 550×1.15 → 自動恢復 aa=true＋marker 清除＋toast 逐字「已可突破『冰封高原・BOSS 關』！自動進關已恢復 — 練角完成，繼續推進」;恢復後 60s 自動推過 r0/r1 雙首領（maxRegionReached 0→3）全程零手動;第二牆 re-park 更新 marker={r:3,n:9,d:2}（牆點難度保留語義）;②手動契約:引擎退守後點「自動進關」按鈕（真實 UI 路徑）→ marker 清除;練到戰力 5505（遠超可恢復門檻）步進 10 分 → aa 維持 false 永不自動恢復;手動再開 → 照常推進（maxR 0→6）;③假陽性:手動關閉＋滅團 ws 2、擊殺歸零（ws 1→0,aa 不變）→ 皆無 marker;④覺醒:構造可覺醒狀態＋marker → awaken() 後 marker 清空、region 歸 0;⑤持久化 reload:退守存檔（aa=false＋aaPark）重載 → 零錯誤、marker/編隊 5/5 保留、戰力未達門檻維持退守;提升戰力 → reload 後自動恢復照常;⑥舊存檔（無 aaPark 欄位）零錯誤,首次退守自動建立;⑦reducedMotion=true 下退守/恢復全流程照常零錯誤;⑧成本:200 次強制檢查 1.5ms（0.007ms/tick — 探針 4 欄位讀取,恢復檢查 2s 節流）
- c) 回歸:核心流程全通過 — 王國→副本→英雄→裝備→建築→更多→世界地圖→競技場地標 modal→召回（ids 0/phase idle）;雙視口 9 步每步 console 監聽零 error/unhandledrejection;手機 390×844 DPR2 七畫面全通過;全新存檔教學 7 步全通過;60s 實戰 soak 零錯誤
- d) 實機:1280×800 與 390×844（CDP deviceMetrics DPR2）雙視口整頁 reload＋監聽零 console error;reducedMotion 路徑零錯誤（引擎邏輯與渲染無關）;改動零新增每幀成本（探針 4 欄位讀取,恢復檢查僅退守期間每 2 秒一次）
- e) 截圖:progress/v572-parked-wall-desktop.webp（桌機・退守畫面:自動進關按鈕 off 狀態 DOM 實測 btn sm）、progress/v572-resume-desktop.webp（桌機・自動恢復後推進）、progress/v572-parked-wall-mobile.webp（手機 390px・退守）、progress/v572-resume-mobile.webp（手機・恢復 toast 時序）、progress/v572-mobile-rm-regression.webp（手機＋reducedMotion 回歸）
風險與回滾點:純引擎邏輯（game.js 42 行＋hunt.js 3 行＋meta.js 2 行）— 零數值公式/零存檔 schema（aaPark 選用欄位,舊檔零遷移/零誤傷）/battle.js 零觸碰/零新增隨機性（偵測為確定性狀態比對）;手動關閉契約由「切換即清 marker」嚴格保留（引擎只在自身停機且未經手動干預時恢復）;深淵（region 10）零觸碰（退守契約本就不含深淵）;若發現任何異常,git revert 本輪 commit 即可（5 檔）;並行註記:v571 由並行 session 在途（建築 2.5D 斜頂面,快取 595）,本輪編號順延 v572、快取 595→596;測試過程為測試存檔,不影響正式進度
---

---
---
---
### [v572] 主題:【等角地圖・美術與內容】
改動:建築回退至 v564 實作（使用者指定「第一次用查到資料實作的結果」）— 生成器重建為 isoBox 對稱 2:1 等角盒（菱形四坡屋頂/左亮右暗牆/中稜線/底兩階/雜訊），v569/v571 的 2.5D 系列（山牆/斜頂面/磚紋/AO/偏藍）放棄
為何讓玩家玩更久:使用者對 v564 對稱等角盒風格有明確偏好 — v569/v571 雖是 TheoTown 官方角度，但不是使用者要的視覺;回退讓村莊建築回到使用者認可的版本（188 色/底部行 25/42/15/城堡屋頂紅 138px 與 v564 原版逐項一致）
實作:tools/gen-iso-art.cjs（isoBox 重建）、js/data/art/buildings_iso.js（重生成 11 sprite）、js/data/changelog.js(v572)、index.html(快取 596→597)
驗證:
- a) 語法:node --check 通過
- b) 邏輯:188 色 = v564 掃描值（v569 194/v571 193 — 已回歸）;黑輪廓 0/sat>78% 0;底部行與 v564 相同;ASCII 菱形屋頂＋錐塔＋雉堞與 v564 原圖一致
- c) 回歸:瀏覽器開圖 — 城堡屋頂紅 138px = v564 驗證值（還原鐵證）、11953 色、console 零 error
- d) 實機:headless 1280×800 開圖零錯誤;map.js 零觸碰
- e) 截圖:progress/v572-revert-v564.webp
風險與回滾點:純美術資產層 — 零座標/零數值/零存檔語義/map.js 零觸碰/零新增隨機性;生成器保留可再切換;若顯示回歸,git revert 本輪 commit 即可;註:測試過程為測試存檔,不影響正式進度;並行註記:v570 由並行 session 發布,v571 為官方指南對齊版,v572 為使用者指定回退
---

### [v571] 主題:【等角地圖・美術與內容】
改動:建築 100% 對齊 TheoTown 官方 2.5D 畫法 — 屋頂改「向右上斜頂面」（平行四邊形右高左低、斜率 1/2~1/4、脊線亮＋3 條瓦排）取代山牆三角;暗色全部偏藍（官方 HSV:暗色靠 H=240）;窗改暗藍（avoid bright blue）;前牆加磚紋（橫排＋交錯縫）;四角 AO 暗像素;屋檐陰影 1px
為何讓玩家玩更久:官方視覺指南（pca.svetikas.lt）＋官方範例 sprite 像素解碼對照 — TheoTown 屋頂是斜頂面不是山牆（山牆讓建築像教堂）;五項細節（偏藍陰影/暗窗/磚紋/AO/瓦排）逐條落地後,村莊建築與 TheoTown 官方範例逐像素文法一致,「100% 視角」的最後一哩完成
實作:tools/gen-iso-art.cjs（ttBox 屋頂重寫、色板偏藍化、磚紋/AO/瓦排、窗暗色）、js/data/art/buildings_iso.js（重生成 11 sprite）、js/data/changelog.js(v571)、index.html(快取 594→595)
驗證:
- a) 語法:node --check 通過
- b) 邏輯:node 掃描 — 193 色黑輪廓 0/sat>78% 0/暗色偏藍 14 色;底部行 26-28/39/15 貼地契約不變;ASCII 屋頂右高左低平行四邊形
- c) 回歸:瀏覽器開圖 — 建築色簇在（城堡屋頂紅 31px）、12062 色、console 零 error
- d) 實機:headless 1280×800 開圖零錯誤;map.js 零觸碰
- e) 截圖:progress/v571-buildings-shed-roof.webp
風險與回滾點:純美術資產層（生成器＋art 重生成）— 零座標/零數值/零存檔語義/map.js 零觸碰/零新增隨機性;若顯示回歸,git revert 本輪 commit 即可;註:測試過程為測試存檔,不影響正式進度;並行註記:v570 由並行 session 發布（英雄待機眨眼）,本輪編號順延 v571
---

### [v570] 主題:【動作與戰鬥呈現・角色動畫】(循環 3・第 4 輪)
改動:英雄待機眨眼 — 六職業確定性閉眼程序動畫（0.13s 閉眼／3.4s 週期，per-seed 相位錯開），battle 列陣＋回村休息場景雙處接線，完成 P0 backlog「待機隨機動作(眨眼/張望/撓頭)」的眨眼（張望 v325 已有）
為何讓玩家玩更久:觀戰是放置遊戲的日常娛樂 — 玩家掛機時每秒都在看自己的隊伍（battle 畫面是全遊戲觀看頻率最高的畫面），而待機動作自 v325 只有「張望」— 六職業眼睛永遠大張，角色像蠟像；FF1 GBA 語彙的招牌「活著感」就是眨眼（同角色 idle 眼開/眼閉交替），EHT 級觀戰（Evil Hunter Tycoon 角色有 idle 眨眼/呼吸）的「我的英雄是活的」情感連結缺失；眨眼讓列陣與休息中的英雄像真人一樣呼吸眨眼 — 觀戰從看血條變成看角色，掛機的每一分鐘都更值得看，與英雄的情感連結（養成/編隊的對象是「人」不是「數字」）被持續餵養
實作:js/ui/render.js（BLINK_EYES 六職業眼睛像素表 — 自幀資料實測座標:劍士 (6,6)(7,6)(6,9)(7,9) J/G 以膚色 H 覆蓋／弓手 (6,7)(7,7) 帽影單眼 A/C 以 K／法師 (8,7)(8,8) 帽影下雙 B 以臉影 A／刺客 (6,7)(6,10) 金面具眼洞 A 以面罩金 G／騎士 (7,6)(7,9) 面甲縫 H 以甲金 E／牧師 (6,6)(7,6)(6,9)(7,9) B/H 以 K;blinkClosed 確定性排程 (t+seed*0.9)%3.4<0.13;blinkOverlay 預烘焙 32×32 覆繪 canvas;drawBlink 以 drawImage 同 transform 覆繪 — fillRect 於 bob 小數 y 反鋸齒混色，drawImage+smoothing=false 與主精靈同整數格對齊;battle 列陣接線與張望同閘 rm/攻擊/受擊/死亡不眨）、js/ui/hunt.js（drawTownScene 休息英雄一行接線）、js/data/changelog.js(v570)、index.html(快取 593→594)
驗證:
- a) 語法:node --check js/ui/render.js、js/ui/hunt.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測,精確斷言）:離屏六職業逐一 — blink ON 眼像素全數變閉眼色（sword/priest +16px=4 眼像素×2×2、archer/mage/assassin/knight +8px=2 像素×2×2 精確）／OFF 全數還原暗色（16,14,11／27,26,24）;battle 實戰關聯 12s（drawBattle 包覆＋同參數離屏參考渲染逐位元比對）— 預期閉眼幀 59/59 一致（0 漏眨）;城內場景 duty cycle 實測 3.4%（設計 3.8%＝0.13/3.4，40ms 採樣窗緣修剪所致）＋burst 週期 3.43/3.40s（設計 3.4s）＋零模糊幀;v568FIX 過程實錘:fillRect 於 bob 小數 y 產生半覆蓋混色 67,67,65（反鋸齒）→ drawImage 路徑後 100% 整格覆蓋
- c) 回歸:核心流程雙視口全通過 — 王國→副本→英雄→裝備→建築→更多→頂欄世界地圖（2 canvas）→模式入口→返回→回城待機（ids 0/phase idle）;每步 console 監聽零 error/unhandledrejection;受影響既有功能 — 攻擊/施法/受擊/死亡渲染路徑零觸碰（僅待機分支新增覆繪）、張望/呼吸 bob 零變動
- d) 實機:1280×800 與 390×844（DPR2）雙視口整頁 reload＋8s 實戰 soak 零 console error;reducedMotion=true 路徑 — 戰鬥照常/零眨眼（rm 閘）/零錯誤;改動為待機分支新增一次 drawImage 覆繪（無新增繪製迴圈/每幀成本 <0.1ms）
- e) 截圖:progress/v568-blink-open-closed-zoom.webp（開/閉眼 6× 放大並排 — 像素實測左眼 16,14,11 暗／右眼 234,212,154 膚）、progress/v568-town-blink-desktop.webp（桌機・城內休息眨眼）、progress/v568-town-blink-mobile-390.webp（手機 390px）、progress/v568-battle-desktop.webp（桌機實戰）、progress/v568-map-mobile-final.webp（手機地圖回歸）
風險與回滾點:純視覺覆繪雙檔（render.js 一表＋兩函數、hunt.js 一行）— 零數值/零存檔 schema（無新欄位）/battle.js 零觸碰/零新增隨機性（確定性排程）;BLINK_EYES 座標僅對應 frame 0（待機幀）— 攻擊幀由閘排除，無 F7/方向幀誤配;若發現任何顯示回歸,git revert 本輪 commit 即可（4 檔）;註:測試過程為測試存檔,不影響正式進度;並行註記:v568/v569（地圖風格化/建築 2.5D）由並行 session 發布於工作樹,本輪編號順延 v570、快取 593→594
---

### [v567] 主題:【等角地圖・美術與內容】(循環 3・第 3 輪)
改動:區域地標新增第二維「進度階」視覺 — 該區進度 ≥5 追加進階裝飾（tier2）、≥10 全通追加金底座＋主題金飾（tier3），10 座地標各 2 層新繪製；世界地圖永久記錄玩家的推進
為何讓玩家玩更久:世界地圖是每日回訪錨點，而「打了一半的區域看起來跟沒打過一樣」讓地圖無法兌現進度 — 診斷（瀏覽器注入 maxStageByRegion={0:1}/{0:5} 兩種存檔）風車塔身像素逐位元相同（tower 48184 一致）、程式碼稽核確認地標只有「擊敗 BOSS」一階（tier 金旗/亮窗），第 5 關中點與第 10 關全通在地圖上零回饋（stage 10 僅 6px 小皇冠）；推關動力一半來自「世界會記住我」— tier2/3 讓每次推進（第 5 關、第 10 關）永久改變地標外觀（金束帶/亮燈窗/金底座/主題金飾），掛機世界變成可蒐集的征服戰利品，完成 10 區全通的視覺成就動機成形 — 每天開地圖看見自己打到哪、還差哪幾關，卡關→突破的循環在世界層面有了回饋
實作:js/ui/map.js（lmGoldLine/lmGoldBase 共用金飾 helper＋10 座地標各加 pt≥2/pt≥3 兩層裝飾＋drawLandmarks/drawLmFx 進度階計算；既有「擊敗 BOSS」tier 語義零變動）、js/data/changelog.js(v567)、index.html(快取 584→590)、progress/improvement-log.md(v567 報告＋P1 tier2 backlog 打勾)
驗證:
- a) 語法:node --check js/ui/map.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測,base 畫布烘焙像素精確斷言 — 直接讀 drawImage 前的烘焙畫布，避開 444→460 平滑混合）:tier0(prog1) 金飾全 0;tier2(prog5) 風車屋頂金束帶 5px＋門旁金麥束 4px、金底座 0;tier3(prog10) 金束帶 3px（部分被 v311 皇冠覆蓋，皇冠像素實測 #ffd166 存在於 y296-299）＋全通金底座 18px＋磨坊招牌 4px＋金麥束 8px;多區存檔 pt 階梯 {0:3,1:2,2:2,3:0,4:0} 全對;小屋 tier2 屋簷金邊 10px＋第二亮燈窗 8px（金門框 0＝pt3 才繪）;礦坑 tier2 金飾 17px（坑口金燈籠＋金軌道）;對照組火山祭壇(prog3・tier1)金頂 38px 維持、tier2/3 金飾全 0（既有語義零變動）;reducedMotion=true 下 base 逐像素相同（belt 3/ring 18/sign 4/wheat 8）;測試期修正 2 個環境陷阱:①瀏覽器 beforeunload autosave 覆蓋注入存檔（patch save() 為 no-op 後注入）②畫布 backing 444→460 upscale 平滑混合使「純色像素斷言」失敗（改讀烘焙 base）
- c) 回歸:核心流程雙視口全通過 — 王國→副本→英雄→裝備→建築→更多→頂欄世界地圖（21 名牌＋21 熱區）→翠綠草原名牌點擊→副本（「⤴ 大地圖」鈕存在）→返回地圖→競技場地標→modal 開啟→回城待機（phase idle）;每步 console 監聽零 error/unhandledrejection;拖曳捲動後名牌/熱區/點擊防誤觸（suppressClick 契約）正常
- d) 實機:1280×800 與 390×844 雙視口整頁 reload＋監聽零 console error;reducedMotion 路徑零錯誤且烘焙畫布逐像素相同（確定性）;改動為 buildBase 靜態烘焙（新增繪製僅在開地圖時一次性執行，無新增每幀迴圈）
- e) 截圖:progress/v567-diag-windmill-prog1.webp＋progress/v567-diag-windmill-prog5.webp（修正前診斷:進度 1/5 渲染相同）、progress/v567-diag-midgame-map.webp（修正前中後期地圖）、progress/v567-map-desktop-tier3-windmill.webp（桌機・全通風車:tier3 金底座＋招牌＋金束帶＋皇冠）、progress/v567-map-desktop-cabin-tier2.webp（桌機・森林小屋 tier2:第二亮燈窗＋屋簷金邊）、progress/v567-map-mobile.webp（手機 390px）
風險與回滾點:純繪製層單檔（js/ui/map.js:2 個 helper＋10 地標各 2 層 fillRect＋2 處 tier 計算）— 零數值/零存檔 schema/battle.js 零觸碰/零新增隨機性（全部確定性靜態烘焙）;既有 tier1（擊敗 BOSS）視覺與 v311 皇冠、模式地標、fx 層零改動;pt 階層僅讀 maxStageByRegion（既有欄位，無遷移）;若發現任何顯示回歸，git revert 本輪 commit 即可（5 檔）;註:測試過程為測試存檔，不影響正式進度;另註:工作樹另有其他 session 未提交的在途改動（css/extra.css、save.js、battle.js、equipment.js、hunters.js、loot.js、more.js 及 progress 清檔）— 本輪未觸碰，提交範圍僅本輪檔案
---

---
### [v566] 主題:【UI/UX 與品質】(循環 3・第 2 輪)
改動:副本畫布轉場橫幅（關卡推進/首領登場/新區域解放/休息倒數）移出 DOM 標題列疊印帶 — 全部下移至邏輯 y100-142 的空曠天際帶（原 y54-88 轉場橫幅、y14-56 休息橫幅皆與標題列覆蓋區疊印）
為何讓玩家玩更久:瀏覽器幾何實測（390px＋1280px 雙視口）抓到放置遊戲「進度心跳」的渲染缺陷 — v186/v201 在畫布頂覆蓋區新增「⚔收益列」「隊伍/建議戰力列」後，畫布轉場橫幅（邏輯 y54-88）整段疊印在 DOM 標題列背後：手機橫幅帶 101-127px 與 DOM 行 101-131px 全疊（「第 N 關」文字被「隊伍 542／建議 60・穩過」行蓋住、暗帶金框殘影穿過收益列）、桌機橫幅 123-155px 被 DOM 覆蓋區 82-159px 整段遮住（完全不可見）— 每 30-90 秒一次的關卡推進、首領登場（BOSS 名＋機制宣告）、以及全遊戲最重要的里程碑時刻「新區域解放」金色橫幅，全部以亂碼或隱形呈現；休息倒數橫幅（y14-56）同病（倒數文字被 DOM 進度條蓋住）— 玩家留下來的動力來自「每次推進都有看得見的回饋」，而遊戲在最頻繁的進度心跳上持續吞掉自己的慶祝；修復後每關轉場、每場首領戰、每次新區域解放與每次休息倒數都乾淨可讀，觀戰節奏與「再推進一關」的慾望直接接上
實作:js/ui/render.js（drawBattle 橫幅帶 y54→100、文字基線 76→122、強調條 84→130;postDraw 首領脈動底線 87→133 — v566 註解）、js/ui/hunt.js（drawTownScene 休息倒數橫幅 y14→100、文字 36→122、進度條 44/45→130/131）、js/data/changelog.js(v566)、index.html(快取 582→583)
驗證:
- a) 語法:node --check js/ui/render.js、js/ui/hunt.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測,精確斷言）:手機 390px 真實引擎轉場（battle.js 自然發出 banner「第 1 關」）— 舊帶 y54-88 暗像素 0.0%（橫幅已不在）、新帶 y100-134 暗 80.7%＋金邊 1584px（橫幅在新位）;桌機 1280px 注入橫幅 — 舊帶 0.0%、新帶 82.2%＋金 905px;休息橫幅（真實 retreat 流程 F.phase=retreat・restLeft 18s）— 舊帶 y14-56 綠像素 0、新帶 y100-142 綠 2993px（💤 倒數橫幅在新位）;首領橫幅（boss 旗標）— 脈動底線紅暈於 y133-136 實測（y133=(207,79,118) 紅調、y136 回復天空色）;DOM 覆蓋區底緣實測:手機 131px vs 新帶頂 136px（5px 間距）、桌機 144px vs 166px（22px 間距）— 雙視口零疊印;reducedMotion=true 下橫幅照常繪製（新帶 78.1% 暗、舊帶 0.0%）零錯誤（純靜態帶,rm 僅停脈動）
- c) 回歸:核心流程雙視口全通過 — 王國→副本→英雄→裝備→建築→更多→頂欄世界地圖（地圖開啟）→競技場地標 modal→返回回城→副本派遣出征（kills 6 秒 +5・phase fight）→回村待機（ids 0/phase idle）;每步 console 監聽零 error/unhandledrejection
- d) 實機:390×844（DPR 2）與 1280×800 雙視口整頁 reload＋監聽零 console error;reducedMotion 路徑零錯誤;改動為純畫布帶位（無新增繪製/迴圈）
- e) 截圖:progress/v566-diag-mobile-hunt.webp（修正前・休息橫幅疊印標題列）、progress/v566-banner-mobile.webp（手機・橫幅於標題列下方乾淨呈現）、progress/v566-banner-desktop.webp（桌機同）、progress/v566-rest-mobile.webp（手機・休息倒數橫幅新位）
風險與回滾點:純畫布座標調整（render.js/hunt.js 共 3 段帶位＋註解）— 零數值/零存檔 schema/battle.js 零觸碰/零新增隨機性;橫幅僅在戰鬥轉場（F.banner）與休息（retreatLeft）時繪製,移動後仍與怪物血條（邏輯 ≥156）保持 ≥22px 間距、與 ⓘ/▶ 鈕（y282+）零重疊;若發現任何顯示回歸,git revert 本輪 commit 即可（4 檔）;註:測試過程為測試存檔,不影響正式進度
---

---
---
### [v569] 主題:【等角地圖・美術與內容】
改動:村莊建築角度重作 — 對稱 2:1 等角盒（菱形四坡屋頂）改 TheoTown 2.5D（前牆垂直矩形＋右側牆 2:1 斜＋山牆屋頂前坡/右坡/脊線）;城堡主樓大 gable＋左右矩形塔＋雉堞＋中央大門;9 棟窗/門直立於前牆;訓練場平頂平台齒緣;特徵重定位（旗/煙囪/藥瓶/棚/石台/水晶）
為何讓玩家玩更久:v564 建築是對稱等角盒 — 兩面斜牆＋菱形頂,在 2:1 tile 上像攤平鑽石;TheoTown 建築是直立房子（垂直牆＋斜屋頂）;村外地標（box/tri）已是 2.5D,村莊與全圖角度斷層;2.5D 讓 13 棟村莊建築與 20 座地標共用同一視覺文法,TheoTown 識別度（直立建築）完整落地
實作:tools/gen-iso-art.cjs（ttBox 2.5D 骨架取代 isoBox、tower 矩形塔、roofStyle flat、extras 重定位）、js/data/art/buildings_iso.js（重生成 11 sprite）、js/data/changelog.js(v569)、index.html(快取 592→593)
驗證:
- a) 語法:node --check 通過
- b) 邏輯:node 掃描 11 sprite — 解析真實定義、底部行 26-28/39/15 貼地契約一致、194 色黑輪廓 0/sat>78% 0;ASCII 形狀 — 山牆屋頂三角＋垂直前牆＋側牆收縮
- c) 回歸:瀏覽器開圖 — 建築色簇在畫布（城堡屋頂紅 35px/民房米牆 30px）、console 零 error
- d) 實機:headless 1280×800 開圖零錯誤;map.js 零觸碰（僅 sprite 資料換新）
- e) 截圖:progress/v569-buildings-2d5.webp
風險與回滾點:純美術資產層（生成器＋art 重生成）— 零座標/零數值/零存檔語義/map.js 零觸碰/零新增隨機性;尺寸契約（64×48/32×32/20×16）與貼地契約不變;若顯示回歸,git revert 本輪 commit 即可;註:測試過程為測試存檔,不影響正式進度
---

### [v568] 主題:【等角地圖・美術與內容】
改動:世界地圖全體 TheoTown 風格化 — 共用 box()/tri() 去黑框（20 個地標一次套用）＋左上受光（上緣/左緣提亮）＋底部兩階漸暗＋seeded 面雜訊;城角塔去 #14121f 描邊改受光/陰影面、錐頂降飽和 #a85038;城牆三線（主牆/受光/陰影＋磚縫）;廣場石板縫＋塊面明暗、街道/道路/農田/草地雜訊;3 處手寫黑框改同系深階
為何讓玩家玩更久:v564 修好 11 個村莊建築後,20 個地標仍帶 2px 黑框 #101018、廣場街道城牆平色塊、城角塔黑描邊 — 村莊「新風格」與世界「舊風格」同框斷層,探索目標看起來像未完成品;共用 helper 一改全改,全圖回到同一 TheoTown 語彙（無框靠同系深階＋地面陰影、左上受光、底部漸暗、面紋理）,視覺密度對齊 EHT 級 — 地圖作為每日回訪舞台與探索目標的「值得一看」感完整落地
實作:js/ui/map.js（shade/speckAt/speckTri 新工具、box/tri 重寫、城角塔/城牆/廣場/街道/道路/農田/草地 7 段紋理化、3 處黑框同系化、海岸燈塔降飽和＋左右光影）、js/data/changelog.js(v567)、index.html(快取 590→591)
驗證:
- a) 語法:node --check js/ui/map.js 通過
- b) 邏輯（瀏覽器像素斷言）:黑框 #101018 全圖 0px（改前 20 地標全帶）;城角塔受光 #9a9aa8 109px／陰影 #7a7a88 41px／底漸暗 #666674 44px;城牆受光 #a0a0ae 12px／陰影 #5c5c6a 67px;錐頂降飽和 #a85038 46px、舊 #c84848 0px;fallback 色 0;總色數 11241（雜訊層增加）
- c) 回歸:世界地圖開啟→名牌/熱區/迷霧/小地圖運作正常（零座標改動）;console 零 error
- d) 實機:headless Chrome 1280×800 開圖零錯誤;reducedMotion 路徑零觸碰
- e) 截圖:progress/v567-map-restyle.webp
風險與回滾點:純繪製層（map.js helper＋色值,零座標/零結構）— 零數值/零存檔語義/battle.js 零觸碰/零新增隨機性（全 seeded）;fx 錨點（旗/金冠/符文/火焰）座標未動;若發現任何顯示回歸,git revert 本輪 commit 即可;註:測試過程為測試存檔,不影響正式進度;並行註記:v566 由並行 session 發布（轉場橫幅,快取 582→583）,本輪快取 590→591
---

### [v565] 主題:【玩法機制與耐玩性】(循環 3・第 1 輪)
改動:新存檔「自動續戰」（hunt.autoDispatch）預設開啟 — 派遣制下首次滅團休息完自動再戰，放置迴圈永不靜止；教學第 2 步同步明示（save.js 預設值 1 行＋tutorial.js 文案 1 行）
為何讓玩家玩更久:瀏覽器實測全新存檔走教學＋派遣抓到首個 session 的迴圈斷裂 — 起始英雄（★★ Lv1・戰力 89）對翠綠草原第 3 關僅撐 2 殺即倒下 → 回村休息 20 秒 → 遊戲完全靜止（3 分鐘採樣 kills/gold/exp 全數凍結，畫面只剩「編隊就緒 · 1 名英雄待命 — 立即派遣」卡）;自 v13 派遣制起 autoDispatch 預設關閉、教學六步驟從未提及，新玩家必須每 30-40 秒手動點一次派遣，或自行發現開關才解除 — 而教學第 2 步白紙黑字承諾「即使關掉遊戲也會持續成長」,放置核心承諾（掛機=持續成長）在第一次 session 就被打破;預設開啟後首次派遣即最後一次手動介入:滅團→休息→自動再戰→連敗退守最佳練功點照常（v560 契約），每次開遊戲看到的都是活著的世界（等級/金幣/裝備持續累積），教學承諾變成事實 — 放置遊戲第一次 session 的「遊戲死了」體驗（最高流失點）從第一天移除，掛機的每一小時都值得
實作:js/core/save.js（newState hunt.autoDispatch: true＋註解;normalize 既有 Object.assign 契約自動保留已存值）、js/ui/tutorial.js（教學第 2 步文案補「就算滅團，休息後也會自動再戰（「自動續戰」預設開啟）」）、js/data/changelog.js(v565)、index.html(快取 581→582)
驗證:
- a) 語法:node --check js/core/save.js、js/ui/tutorial.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測，精確斷言）:新檔 reset() 後 autoDispatch=true;全新存檔（新 profile）走教學 7 步 — 第 2 步文案含「自動再戰（「自動續戰」預設開啟）」逐字確認;派遣 1 人→3.5 分鐘採樣 7/7 樣本 phase=fight 且 ids=1/rest=0（每次滅團後自動再派遣:wipe 計數 1→2 攀升、hp 歸零後自動回升、無任何樣本靜止）— kills 4→10・金 370→1959・Lv1→2・裝備 0→1;3 連敗退守實測:遷移至最佳練功點 stage 1 且 autoAdvance 暫停（v560 契約零變更）、退守後持續自動農（30s +5 殺）;對照組:autoDispatch=false 強推 stage 6-7 → 滅團→休息→ids 清空/phase idle 靜止（舊行為精確復現 — 開關被尊重）;UI 切換:自動續戰鈕 false→true 且 gold 類別切換（btn sm→btn sm gold）;召回契約:autoDispatch=true 下 recall → ids 0/phase idle 零自動重派（autoDispatch 僅休息後觸發）;存檔相容:已存 autoDispatch=false 舊檔 reload 後維持 false、缺欄舊檔 normalize 補 true;深淵分流:region=INDEX 且 abyss.autoRetry=true/全域 autoDispatch=false → 休息中 ids 保留 1（深淵連續挑戰獨立契約不變）;UI 全鏈:編隊就緒卡→立即派遣→派遣視窗→派遣出征→fight（ids 1）
- c) 回歸:核心流程全通過 — 王國→副本→英雄→裝備→建築→更多→頂欄世界地圖→翠綠草原地標名牌點擊→副本→回村待機（ids 0/phase idle/持久 HP 不回滿 — 契約不變）;每步 console 監聽零 error/pageerror/unhandledrejection
- d) 實機:桌機 1262×624（spawned headless）與 390×844（CDP deviceMetrics DPR2）雙視口整頁 reload＋監聽零錯誤;reducedMotion=true 下 60s 實戰採樣 — 戰鬥照常/滅團後自動再戰計時照常/零錯誤（引擎路徑與渲染降級互不影響）;20s 開機＋戰鬥 console 全量掃描零 error
- e) 截圖:progress/v565-hunt-ready-auto.webp（桌機・編隊就緒卡＋自動續戰開）、progress/v565-battle-auto.webp（桌機・實戰自動續戰中）、progress/v565-battle-mobile.webp（手機 390px・實戰）
風險與回滾點:純機制預設值＋教學文案雙檔（save.js 1 行＋tutorial.js 1 行）— 零數值/零存檔 schema（欄位早已存在，僅新檔預設值與缺欄補缺變更）/battle.js 零觸碰/零新增隨機性;既有存檔零影響（已存欄位值保留）;autoDispatch 開關/召回/編隊/深淵連續挑戰全部契約不變;若發現任何異常，git revert 本輪 commit 即可（4 檔）;註:測試過程為測試存檔（新 profile），不影響正式進度
---

---
### [v564] 主題:【等角地圖・美術與內容】
改動:村莊建築等角美術補完 — 11 個地圖建築 sprite（城堡/公會/訓練場/圖書館/鐵匠鋪/煉金坊/市集/祭壇/寶石坊/倉庫/民房）自 fallback 灰 blob 依 TheoTown 官方像素規則重繪（tools/gen-iso-art.cjs 生成→js/data/art/buildings_iso.js 靜態 rows/pal）;64×48 城堡=主樓+左右錐塔+雉堞+大門+雙旗;9 棟 32×32 各帶角色特徵（公會脊旗/訓練場平頂齒緣/圖書館大窗/鐵匠鋪煙囪煙+爐火窗/煉金坊屋頂藥瓶/市集條紋遮陽棚+攤台/祭壇石台聖火/寶石坊紫水晶簇/倉庫雙門）;民房 20×16 山牆小屋
為何讓玩家玩更久:診斷（node 實測 sprites.get）— v278 worldmap 合併時 iso 美術遺失,11 個 sprite 全倉庫零定義→全部解析 fallback 16×16 灰圓 blob（#7a7f9c+黑框）;地圖上城堡/9 棟建築/3 民房自合併起以灰 blob 呈現,與區域地標（風車/小屋/碑塔）及 v562 模式地標嚴重斷層,而村莊是玩家每日回訪錨點（點建築升級/派遣起點）— 11 個灰 blob 讓核心城鎮像未完成品,世界期待感被下修;重繪後村莊對齊區域地標視覺密度（EHT 級）,建築角色（公會旗/鐵匠爐火/市集棚）讓經營對象有辨識度
實作:tools/gen-iso-art.cjs（新生成器:2:1 等角盒+掃描線多邊形+seeded 雜訊+HSV 調色;可重跑再生成）、js/data/art/buildings_iso.js（新 art 域,11 sprite 靜態資料）、index.html（載入新 art 檔,快取 580→581）、js/data/changelog.js(v564)
驗證:
- a) 語法:node --check js/data/art/buildings_iso.js、js/data/changelog.js 通過
- b) 邏輯:node 實測 11 個 sprite 全數解析為真實定義（尺寸 64×48/32×32/20×16 與 map.js 繪製常數一致）;風格規則掃描 188 色:黑輪廓 #14121f 出現 0／飽和度>78% 0／明度<12% 0（Theo 規則:低飽和/無黑框/留陰影階）;ASCII 形狀比對（house 屋頂+煙囪/altar 火焰台座/guild 完整等角盒）
- c) 回歸:瀏覽器實測 — 開啟世界地圖,畫布 460×500 10639 色（改前無建築色）:紅瓦 451px／石牆 606px／米牆 236px 建築色簇存在、舊 fallback 色 #7a7f9c 出現數 0;console 監聽零 error/pageerror
- d) 實機:headless Chrome 1280×800 整頁載入+開地圖零錯誤;reducedMotion 路徑零觸碰（sprite 為靜態 rate 0）
- e) 截圖:progress/v564-iso-buildings-map.webp
風險與回滾點:純美術資產補完（新增 2 檔+index.html 1 行+changelog）— 零數值/零存檔語義/battle.js 零觸碰/零新增隨機性;map.js 零改動（sprite 名稱/座標/縮放全不變,僅解析結果從 blob 變真 art）;生成器保留在 tools/,可微調參數重跑;若發現任何顯示回歸,git revert 本輪 commit 即可;註:測試過程為測試存檔,不影響正式進度
---

改動:職業攻擊動作差異化補完 — 新繪製刺客「突刺」與騎士「盾頂」專屬攻擊幀(F7 幀段契約:雙匕首前刺+弓步/金盾舉至胸前一推),render.js 揮擊主幀依職業選幀(assassin/knight→F7,其餘維持 F2),完成 P0 backlog「職業動作差異化(弓手拉弓/法師舉杖/刺客突刺/騎士盾頂)」最後兩職
為何讓玩家玩更久:戰鬥畫面是放置遊戲觀看頻率最高的畫面(每秒都在跑、每次掛機都在看),但 v324 只讓遠程(弓手拉弓/法師舉杖)有差異 — 四個近戰職業(劍士/刺客/騎士/牧師)在揮擊主幀共用同一 frame 2、同一 lift 6,畫面上只有換色、動作完全一致;職業是玩家編隊/養成的核心身分識別,六職業打起來像同一種職業的換色版 = 職業幻想只兌現一半,觀戰時無法一眼分出「誰在打」,養成樂趣停留在數字層;刺客突刺(低身前刺+匕首出鞘)與騎士盾頂(舉盾頂撞)讓近戰也各有可辨識的攻擊表演 — 觀戰從「看血條」變成「看角色」,編隊的成就感從數值延伸到表演,掛機觀戰的娛樂性與「再練一隻別職業看看」的收集動機同步提升;純動畫資產級改動,零數值/零存檔語義/battle.js 零觸碰
實作:js/data/art/heroes.js(h_assassin/h_knight 各加 F7 幀:頭/盔列 0-4 與 F0 逐字元一致保同一角色契約;刺客匕首 A 黑尖+KK 刃延伸 sprite-left(翻轉後正對怪物)+前腿弓步後腿蹬地;騎士 L/E 金盾舉升 5 列至胸前一推+身體後縮靠盾+雙足踏地;幀段契約註解)、js/ui/render.js(揮擊主幀 strikeF = assassin/knight ? 7 : 2 依職業選幀+職業 lift(刺客 4/騎士 6);施法/前搖/收招相位 v222 原契約零變動)、js/data/changelog.js(v563)、index.html(快取 579→580)
驗證:
- a) 語法:node --check js/data/art/heroes.js、js/ui/render.js、js/data/changelog.js 全通過
- b) 邏輯(瀏覽器實測,精確斷言):幀資料 — 刺客/騎士 frames 8(新增 F7)、劍士 7(不受影響);F7 頭列 0-4 與 F0 逐字元 diff=0(同一角色契約)、刺客 F7 vs F0 全圖 diff=70(姿勢改變)、騎士 F7 vs F0 diff=142(盾抬升 5 列:金盾 L/E 色帶由腰際列 10-13 移至胸前列 5-7);synthetic drawBattle 形狀比對(背景相減法)— 刺客揮擊 vs F7 shapeDiff=72 vs F2=200、騎士 vs F7=24 vs F2=156、劍士對照組 vs F2=16(殘差基準),即揮擊相位確實繪製 F7;實機戰鬥(注入 5 人隊,390px 與 1280px 雙視口 5-6s 採樣)— 騎士胸前帶金盾像素 peak 62-166(實戰抬盾證據)、刺客怪物側(畫面右緣)匕首像素出現於攻擊週期 ~5% duty(0.2s 揮擊窗/4s 週期吻合)、左緣零命中(方向正確:突刺朝怪物);reducedMotion=true 路徑:派遣→fight→kills 4、零錯誤、幀選取邏輯照常(F7 為靜態姿勢幀,rm 不降級)
- c) 回歸:核心流程雙視口全通過 — 王國(html 46715)→副本(18306)→英雄(31284)→裝備(63683)→建築(21411)→更多(21534)→世界地圖(15504、2 canvas)→競技場地標點擊→返回→召回(dispatchIds 0);每步 console 監聽零 error/unhandledrejection;受影響既有功能逐一確認 — 劍士/法師/牧師揮擊維持 F2 原幀(對照組斷言)、施法相位 F2、前搖 F3/收招 F4 不變、屍體/白閃/受擊後仰路徑零觸碰
- d) 實機:1280×800(DPR 1)與 390×844(DPR 2)雙視口整頁 reload＋監聽零 console error;實戰 FPS soak 60.1fps/0 掉幀(無新增繪製迴圈,僅幀索引選擇);reducedMotion 路徑零錯誤
- e) 截圖:progress/v563-frames-f0-f2-f7.png(F0/F2/F7 並排:刺客 F7 匕首前伸、騎士 F7 盾舉胸前 — 一致性對照)、progress/v563-battle-desktop.png(桌機實戰)、progress/v563-battle-mobile.png(手機 390px 實戰)、progress/v563-battle-live.png(實戰)
風險與回滾點:純動畫資產級雙檔(heroes.js 新幀/render.js 選幀)— 零數值/零存檔 schema(無新欄位)/battle.js 零觸碰/零新增隨機性;F7 僅刺客/騎士擁有,無 F7 職業經 draw 超界 clamp 自動回退原幀(不影響);頭列 0-4 逐字元不變保證同一角色契約(側/正/背並排可辨識);若發現任何顯示回歸,git revert 本輪 commit 即可(4 檔);註:測試過程為測試存檔,不影響正式進度
---

### [v562] 主題:【等角地圖・美術與內容】(循環 3・第 3 輪)
改動:10 個模式入口地標全面精緻化 — 從 v278 移植版的 1-3 平色塊重繪為區域地標水準（石環鬥場＋旗柱／勝利柱拱門金冠台／雙層符文石碑＋火把／頭骨獸骨紀念碑／四元素窗高塔／籬牆拱門迷宮／茅頂宴棚／條紋棚告示板／裂口石燈深淵／帳篷營地），10 個地標動態 fx 重新錨定、鎖定遮罩依包覆盒全高覆蓋且鎖定時跳過地標 fx、徽章點錨於地標右上、薄層結構補台面高光
為何讓玩家玩更久:模式入口是玩家每天點最多次的地圖元素（每日儀式:開圖→競技場/秘境/世界首領/活動→一鍵例行）,但它們自 v278 起只是平色塊 — 瀏覽器實測（手機 390px,1×/1.5×）競技場=單層灰矩形、公會盛宴/試煉秘境名牌下看不出建築,與同圖區域地標（風車/冰塔/金字塔）斷層;每天報到的地方看起來像未完成品,地圖「世界有內容」的期待感被下修;入口精緻化讓每個每日目標在視覺上值得一去,地圖密度對齊 EHT 級 — 純美術資產級改動（新繪製 10 套地標藝術＋fx 重錨）,零數值/零存檔語義/零互動邏輯
實作:js/ui/map.js（10 個 MODE_LM 重繪＋MODE_FX 重錨（arena/hall 旗、crown、rune、bone、spire、hedge、notice、stairs、campfire）＋LM_ART 包覆盒（鎖定遮罩全高＋徽章點右上錨）＋鎖定時跳過 MODE_FX＋royal/stairs 台面高光）、js/data/changelog.js(v562)、index.html(快取 578→579)
驗證:
- a) 語法:node --check js/ui/map.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測,精確斷言）:10 地標像素級著色斷言 — 各錨點框內簽名色齊備（arena 沙地 #d8c090×12＋紅 #c8402f＋木 #4a3520;royal 金 #ffd166＋石材高光;dungeon 碑面 #6a6a7a×18＋符文 #4fc3f7＋木柱＋碑冠 #363640;worldboss 頭骨 #e8e0d0＋骨 #d8d0c0×44＋石台 #5a5248＋紅旗;tower 塔身 #8a7a9a×25＋錐頂 #c96a4a＋金尖＋元素窗 3 色;guild 茅頂 #7a8a4a＋燈籠紅＋金燈;events 軟木 #c8a878＋條紋白＋金告示;abyss 階梯石＋紫焰 #a78bfa＋裂縫 #0a0a14;exped 雙帳 #5a7a9a/#4a6a8a＋紅旗）;fx 重錨 — rune 亮 #48b2e4/塔尖光芒/crown 閃爍於新錨點實測;鎖定（全新存檔 kingdom Lv1）— 4 個 gate 地標名牌 🔒、藝術色歸零（遮罩覆蓋）、金冠 fx 零輸出（鎖定跳過）、點擊 toast「王者競技場需王國 Lv12」;全解鎖（注入 Lv16/maxR6）0 個 🔒;徽章點 4×4 於新錨位實測;驗證過程另確認三項「顏色缺漏」皆為既有行為非本輪 bug:薄 box 被 2px 描邊覆蓋（與區域地標同款,已補高光）、試煉秘境火把被既有熔岩脈動 fx 疊繪（合成色 #aa904c 精確 = 0.5×#ff9a4d+0.5×草）、採樣時雲影 0.86 降亮（#8a8a9a→(120,120,134) 精確）
- c) 回歸:核心流程全通過 — 王國→副本→英雄→裝備→建築→更多→世界地圖(21 名牌/21 熱區)→翠綠草原入口→派遣(目的地視窗「出戰 1 名英雄」)→派遣出征(phase fight/ids 1)→擊殺(kills 1)→回村(phase idle/ids 0)→地圖(21 名牌);模式入口逐一點擊(競技場/秘境/世界首領/公會/活動 modal 開啟、鎖定 gate toast);每步 console 監聽零 error/unhandledrejection
- d) 實機:390×844 與 1262×624 雙視口整頁 reload＋監聽零 console error;全新存檔 boot＋教學跳過＋地圖零錯誤;reducedMotion=true 路徑地圖渲染正常、雙幀哈希一致（靜止）、零錯誤;改動僅 buildBase 烘焙藝術＋fx 重錨,無新增繪製迴圈
- e) 截圖:progress/v562-diag-mode-strip-pre.png(修正前 1× 全帶 — 競技場單層灰矩形)、progress/v562-diag-mode-strip-15x.webp(修正前 1.5× 名牌下看不出建築)、progress/v562-mode-strip-mobile.png(手機 390px 新藝術全帶 — 塔/棚/碑/帳可辨)、progress/v562-mode-strip-desktop.png(桌機全解鎖)、progress/v562-locked-strip-fresh.png(新檔 4 鎖定名牌🔒)、progress/v562-dungeon-stele-6x.png(6× 裁切:碑身/符文/火把/基座逐件確認)
風險與回滾點:純美術資產級改動（map.js 單檔烘焙藝術＋fx 層重錨）— 零數值/零存檔 schema/battle.js 零觸碰/零新增隨機性;地標錨點座標不變（名牌/熱區/道路/捲動全不受影響）;鎖定遮罩與徽章點錨改為資料驅動（LM_ART 表）;若發現任何顯示回歸,git revert 本輪 commit 即可（4 檔）;註:測試過程為測試存檔,不影響正式進度;另記錄(未改動):試煉秘境左火把與火山地塊邊界重疊處會被既有熔岩脈動 fx 疊繪 — 視覺上呈火把閃爍,屬既有 fx 語義,若後續要完全精確可移火把 2px,留待後續輪次
---

### [v561] 主題:【UI/UX 與品質】(循環 3・第 2 輪)
改動:副本主畫面待機 coach 三態分流 — 滿編玩家不再被「出戰隊尚未編入英雄」矛盾遮罩誤導：empty（編隊真空）=保留原教學遮罩、ready（滿編待機）=輕量「編隊就緒 · N 名英雄待命」金框卡＋「立即派遣」單鍵直開派遣視窗、hidden（派遣中/休息中）=隱藏（畫布自繪狀態）；判定真相源由 F.team 改為 dispatchIds（與場景繪製同源；recall 後 F.team 殘留、休息中 F.team 為空皆不再誤判）
為何讓玩家玩更久:瀏覽器實測（新檔＋注入中後期存檔 kl6・5 人・9037 戰力，手機 390px）抓到核心儀式的第一步矛盾 — 主畫面空態遮罩以「派遣中隊伍」判定，但自 v13 派遣制起編隊與派遣分離：滿編 5 人未派遣時，遮罩整片蓋住戰鬥區寫「出戰隊尚未編入英雄」＋CTA「前往英雄分頁編入英雄」，與同畫面「派遣 5 人」鈕、滿員編隊列（5/5・戰力 9037）、狀態卡「待機中 — 按下派遣」直接互斥 — 每天開遊戲第一個動作（開遊戲→派遣→掛機/睡前派遣）就被遊戲告知一件已做完的事，玩家依 CTA 白跑英雄分頁發現編隊已滿（死路引導），新玩家（1 名起始英雄即在編隊）同樣看到矛盾遮罩；休息中更與畫布「全軍回村休息中」倒數同框。開局即「遊戲在說謊」的體驗消耗信任與耐心，派遣儀式摩擦→離線收益（睡前派遣）啟動失敗→回訪慾望流失；修正後待機狀態零矛盾資訊，且滿編玩家獲得比下方按鈕列更近的單鍵入口（遮罩即按鈕），「一眼確認→一鍵→掛機」的每日儀式閉合 — 每次關閉遊戲前離線掛機更可靠地啟動，放置核心承諾（關掉也在成長）被保住
實作:js/ui/hunt.js（coachMode/buildCoachContent 三態函式＋lastCoachKey 簽名＋syncDom 分流取代原 F.team 判定；empty 保留原文案遮罩、ready 卡片置於關卡標題列之下（76px 定位）半透明底不遮城鎮場景、pointer-events 穿透＋卡片自收；render 內 reset lastCoachKey）、js/data/changelog.js(v561)、index.html(快取 577→578)
驗證:
- a) 語法:node --check js/ui/hunt.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測，精確斷言）:七路徑 — ①滿編待機（5/5・未派遣）reload→ready 卡顯示「編隊就緒 · 5 名英雄待命」「按下「派遣」率領編隊出征 — 關閉遊戲也會持續累積離線收益。」＋金鈕「立即派遣」（舊矛盾文案零殘留）;②點「立即派遣」→派遣目的地視窗開（「出戰 5 名英雄」）→派遣出征→fight 中 coach display=none（hidden）;③召回→ids=0/phase=idle→ready 卡復現（F.team 殘留不再誤判 — 修正前此路徑 coach 恆隱藏）;④滅團 retreat→restLeft 20s→coach hidden（畫布 💤 倒數獨秀，零同框）;⑤restUntil=0 且 autoDispatch=false→ready 卡復現（autoDispatch=true 時休息完自動再派遣→hidden，正確）;⑥編隊全空→empty 教學遮罩（原文案＋「前往「英雄」分頁編入英雄」鈕→實測跳轉英雄分頁）;⑦1 人編隊→ready 卡「編隊就緒 · 1 名英雄待命」;全新存檔（MG.core.save.reset 真實流程）→起始英雄即入編隊→ready 卡（修正前新玩家也見矛盾遮罩）;ready 卡幾何:cardTop−headerBottom=+5.2px（零重疊）;reducedMotion=true 下全路徑照常零錯誤（靜態 DOM，無動畫）
- c) 回歸:核心流程雙視口全通過 — 王國→副本→英雄→裝備→建築→更多→頂欄世界地圖（2 canvas）→地標入口→回城待機（recall ids 0/phase idle）;受影響既有功能逐一確認 — 派遣鈕（disabled 三條件不變）/回村待機/自動續戰/自動進關/藥水列/編隊列/狀態卡/戰鬥紀錄/infoFab・speedFab（zIndex 4 仍在 coach 之上可點）全正常;每步 console 監聽零 error/unhandledrejection
- d) 實機:390×844（DPR 2）與 1280×800 雙視口整頁 reload＋監聽零 console error;手機戰鬥 8s soak — 60.1 FPS 平均、0 幀 >34ms、kills 6、coach hidden、零錯誤（改動無新增每幀成本：coach 僅模式/人數變化時重建 DOM，4Hz 簽名跳過）;reducedMotion=true 路徑全通過;新檔（無存檔）boot＋教學 6 步＋跳轉零錯誤
- e) 截圖:progress/v561-ready-card-mobile.webp（手機・ready 卡＋城鎮場景＋標題列可讀 — inspect_image 逐字確認）、progress/v561-ready-card-desktop.webp（桌機同卡）、progress/v561-empty-veil-desktop.webp（編隊全空・教學遮罩原文案逐字確認）、progress/v561-diag-old-contradiction.webp（修正前：遮罩「出戰隊尚未編入英雄」與「派遣 5 人」同框矛盾證據 — inspect_image 確認）
風險與回滾點:純 UI 顯示層（ui/hunt.js 單檔）— 零數值/零存檔 schema（無新欄位）/battle.js 零觸碰/零新增隨機性;判定真相源改為 dispatchIds 與場景繪製同源（v13 起 battle 場景即以此判定），語義一致;empty 分支保留原遮罩文案與行為（新玩家/全員移出編隊才見），ready 分支僅在滿編待機出現、派遣/休息即隱藏;若發現任何顯示回歸,git revert 本輪 commit 即可（雙檔＋changelog/index）;註:測試過程為測試存檔,不影響正式進度;另記錄（未改動）:戰鬥畫布 stage 轉場橫幅（邏輯 y54-88）與 DOM 標題列（v186/v201 新增收益/戰力列後）在轉場 1.4-2.5s 內有輕微疊印 — 屬另一獨立議題，留待後續輪次
---

### [v560] 主題:【玩法機制與耐玩性】(循環 3・第 1 輪)
改動:連敗回退目的地由「退 1 關」升級為「引擎掃描的最佳練功點」— 卡牆掛機收益崩潰修復（bestFarmSpot/stagePowerReq 搬移至 battle.js 單一來源，派遣視窗同源呼叫；3 連敗時引擎自動遷移區域/關卡/難度至可穩過中收益最高點，autoAdvance 照常暫停、深淵排除、無更優點退回原退守）
為何讓玩家玩更久:瀏覽器注入中後期存檔（kl29・8 英雄・1.25 萬戰力）實測自動進關卡牆行為 — 蒼穹之塔 BOSS 牆（s10 普通）456 金/秒 vs 引擎掃描最佳農點（詛咒沼澤 s6 夢魘）1819 金/秒 = 4× 差距；更糟的是 v559 連敗回退只退 1 關（s9 普通 708 金/秒）仍只有最佳的 39% — 玩家睡前開自動進關，醒來發現掛機收益悄悄掉到 1/4，卡牆狀態下金幣/經驗流動近乎停滯，而遊戲早已具備「最佳練功點」掃描（v236 派遣視窗）卻從未用於自動退守 — 系統知道答案但不執行，放置核心承諾（掛機=穩定成長）在牆邊斷裂;修復後卡牆自動轉為「全圖最優農點練角」，掛機價值回到峰值 4×，玩家醒來看到的是 4× 的練角進度，練完一鍵再推（自動進關），「卡關→退守→練角→突破」節奏完整閉合 — 放著掛機的每一小時都值得
實作:js/sys/battle.js（stagePowerReq/bestFarmSpot/formationPower 引擎端新增並 export — 自 ui/hunt.js v236 搬移零公式變更;retreat 連敗回退分支:非深淵時先掃描最佳練功點，與當前不同則遷移 region/stage/difficulty＋清 pendingHp＋fallback{type:"farmspot"}，無更優點退回原 stage-1/難度-1;pendingHp 保存加 farmspot 守衛）、js/ui/hunt.js（本地 stagePowerReq/bestFarmSpot 改為委派引擎端單一來源;fallback toast 增加 farmspot 分支「連敗三場，已自動移至最佳練功點「X・第 N 關・難度」練角（自動進關已暫停）」）、js/data/changelog.js(v560)、index.html(快取 576→577)
驗證:
- a) 語法:node --check js/sys/battle.js、js/ui/hunt.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測,精確斷言）:引擎 bestFarmSpot = {r6,n6,d3,+2029.5/+1881,req12000} 與遷移前派遣視窗顯示完全一致（單一來源零漂移）;3 連敗序列 — 敗 1/2 不動作（streak 1/2、pendingHp 500 保留）→ 敗 3 遷移至 {6,6,3}＋autoAdvance=false＋wipeStreak=0＋pendingHp 清除＋fallback{type:"farmspot",r6,n6,d3};真實引擎步進 3 場滅團同樣在第 3 敗遷移（r7s10→r6s6d3）;遷移後自動續戰重新派遣於新點實測 1819 金/秒（牆 456 的 4.0×）;邊界 — 全隊過弱（tp 極低）退回 stage-1（r3s5→s4＋fb stage）;深淵 region 10 不遷移、autoAdvance 維持 true（契約保留）;已在最佳點（r6s6d3）連敗 → 退 1 關（s5）不遷移;無更優點時難度-1 路徑照常（r0s1d1→d0）;reducedMotion=true 下遷移照常零錯誤;10 輪滅團循環 soak 零 error
- c) 回歸:核心流程全通過 — 王國→副本→英雄→裝備→建築→更多→頂欄世界地圖（2 canvas）→地標 modal（烈焰火山派遣視窗含最佳練功點）→返回→回城待機（recall dispatchIds 0/restUntil 0）;派遣視窗「前往」deep-link 實測 r4s5→r3s10d3（與引擎掃描一致）;每步 console 監聽零 error/unhandledrejection
- d) 實機:1280×800 與 390×844 雙視口整頁 reload 各 5s 監聽零 console error;390×844 自然滅團→自動續戰循環 40s 零錯誤;新檔（無存檔）boot 零錯誤、autoAdvance=true/autoDispatch=false 預設不變
- e) 截圖:progress/v560-wall-grind-desktop.png（牆診斷:蒼穹之塔 BOSS 關・建議退關練角・+196萬/時 — inspect_image 確認）、progress/v560-relocated-toast-desktop.png（遷移 toast「連敗三場，已自動移至最佳練功點『詛咒沼澤 - 第 6 關 - 夢魘』練角（自動進關已暫停）」— inspect_image 逐字確認）、progress/v560-dispatch-dialog-mobile.png（手機派遣視窗:最佳練功點詛咒沼澤 s6 夢魘 +2029/+1881 同源顯示）
風險與回滾點:純引擎行為變更（battle.js retreat 分支）＋函式搬家（bestFarmSpot/stagePowerReq 由 ui/hunt.js 移入 battle.js，hunt.js 改委派 — 公式逐字搬移零變更,派遣視窗顯示數值遷移前後一致為證）;零數值公式/零存檔 schema（無新欄位）/零新增隨機性;深淵契約由 region 10 排除明確保留;若發現任何退守異常,git revert 本輪 commit 即可（3 檔）;註:測試過程為測試存檔,不影響正式進度
---

### [v559] 主題:【數值平衡與留存】(循環 2・第 5 輪)
改動:兩項經濟健康修復 — ①藥水/寶石誤分解 → 金幣 NaN 存檔毀滅 bug 修復（引擎守衛＋UI 分流消耗品格＋批量過濾＋強化/分解入口封鎖）;②連敗回退暫停自動進關 — 卡牆死迴圈修復（battle.retreat 引擎端 2 行＋fallback toast 改寫,深淵排除）
為何讓玩家玩更久:①有機模擬（全新存檔以真實引擎步進 48 小時＋自動管理 bot）的背包清理迴圈意外觸發實錘:藥水沒有 rarity 欄位,誤分解時金幣 = 10×1.4^tier×undefined = NaN → gold += NaN 永久污染,往後每次掉落/購買全是 NaN,存檔經濟報廢 — 這是「清背包」這種每個玩家每天都會做的動作即可觸發的存檔毀滅器,實機 UI 重現(點藥水格→分解→確認→金幣 NaN＋toast「+∞ 金」);修復前任何玩家都可能在一秒內失去整個存檔的經濟,100% 流失;②同一次模擬發現 v13 兩功能互相抵銷:連敗回退(3 連敗退一關)的退守關卡被自動進關第一殺就拉回 BOSS 關,卡牆掛機 = 零進度死迴圈(實測軌跡 8:9→8:10 擺盪,2h 僅 26 殺/h、5k 金/h,穩定農場的 1/100,唯一進度是 pendingHp 磨血) — 卡關是放置遊戲最高流失時刻,掛機看不到任何進度玩家直接關遊戲;修復後退守關卡自動成為穩定農點(連敗回退每 3 敗再退一關直到可農,實測 534 殺/2h、+7.4 萬金,全隊 40→102 級),玩家練角完成後一鍵再推,「卡關→突破」節奏持續運轉
實作:js/sys/equipment.js(dismantle 非 7 部位裝備一律 false — 所有呼叫端共用守衛)、js/ui/equipment.js(isConsumable＋consumableCell 消耗品格分流(藥水/沙漏,點擊僅顯示持有數)＋openQuickActions 消耗品只顯示資訊 modal＋multiDismantle/multiEnhance/multiEnhanceMax 過濾子句＋doDismantle 空回傳守衛＋cell 邊框類名 ||1 防 NaN)、js/sys/battle.js(retreat 連敗回退時 st.hunt.autoAdvance = false,深淵 region 10 排除)、js/ui/hunt.js(fallback toast「連敗三場，已自動退至第 X 關練角（自動進關已暫停）」)、js/data/changelog.js(v559)、index.html(快取 575→576)
驗證:
- a) 語法:node --check 5 檔全通過
- b) 邏輯(瀏覽器實測,精確斷言):①dismantle(藥水)=false、dismantle(沙漏)=false、金幣 50000 逐位元不變且非 NaN;dismantle(★3 武器) 照常 =+144 金＋鐵15/草7/皮4 且物品移除;實機 UI:藥水格 eq-b6(修正前 eq-bNaN)點擊僅 toast「生命藥水：持有 7 個」,無分解/強化入口;批量過濾子句 SLOTS.includes(slotOf) 對藥水/沙漏/寶石全 false、武器 true;doDismantle 對引擎拒絕回傳顯示「該物品無法分解」;②A/B 同結構牆存檔(5 人 106/40/33/30/28、r7 s10、aa=true):修正前 52 殺/2h＋軌跡 8:9↔8:10 擺盪;修正後 534 殺/2h(10.3×)＋軌跡 8:9:PAUSE×23 穩定農、金幣 +74,186 非 NaN、全隊升級 40→102;逐次滅團序列實測第 3 敗 → stage 10→9＋aa=false;深淵(region 10)3 連敗 → aa 維持 true(契約保留);難度回退(diff 2 第 1 關 3 連敗 → diff 1＋aa=false);一般關卡(7→6＋aa=false);新遊戲預設 aa=true/autoDispatch=false 不變;玩家重開自動進關再敗再暫停(迴圈閉合)
- c) 回歸:核心流程雙視口全通過 — 王國→副本→英雄→裝備→建築→更多→頂欄世界地圖(2 canvas)→地標 modal(區域解放彈窗開合)→回城→回村待機(dispatchIds 0/phase idle);每步 console 監聽零 error
- d) 實機:1280×800 與 390×844 整頁 reload 各 4s 監聽零 console error/pageerror;reducedMotion=true 下狩獵/裝備畫面渲染零錯誤;新檔(無存檔)boot 零錯誤
- e) 截圖:progress/v559-potion-consumable-mobile.png(手機 390px・藥水格 eq-b6 消耗品樣式＋xN 數量,修正前 eq-bNaN)、progress/v559-potion-cell-zoom.png(藥水格放大)、progress/v559-fallback-toast-mobile.png(toast「連敗三場，已自動退至第 9 關練角（自動進關已暫停）」— inspect_image 逐字確認)、progress/v559-wall-start-desktop.png(牆起點 r7 s10)、progress/v559-wall-farm-desktop.png(退守農點 r9 s9・自動進關按鈕熄滅) — DOM 層逐格斷言輔證
風險與回滾點:純守衛＋分流(equipment 雙檔:引擎守衛拒絕非裝備、UI 消耗品不再進破壞性入口)＋battle.js 2 行行為變更 — 零數值公式、零存檔 schema(無新欄位)、零新增隨機性;深淵爬塔契約由 region 排除明確保留;若發現任何分解/強化/連敗回退異常,git revert 本輪 commit 即可(5 檔);註:測試過程為測試存檔,不影響正式進度;診斷 harness(progress/harness-economy.js)為測試工具不進 commit
---

---
### [v558] 主題:【動作與戰鬥呈現】(循環 2・第 4 輪)
改動:BOSS 機制作用量化回饋 — 再生/吸血回血跳綠色 +N＋全屏綠閃、劇毒 tick 浮字改紫（與玩家毒 dot 同色系）、並修復英雄側浮字自 v1 起全數 NaN 不可見的座標 bug（TEAM_POS 物件屬性誤用陣列索引）
為何讓玩家玩更久:BOSS 戰是最高戲劇性時刻,但瀏覽器實測（同步步進火山吸血首領 t=20.5→21:英雄輸出 ~130 僅扣 43 血、事件流零回血事件）發現五機制「存在」可讀（v297 常駐視覺＋v545 chip）卻「作用瞬間」全數靜默 — 再生/吸血時血條無聲回升,玩家無法判斷「我打不動」是 DPS 不夠還是牠在回血;劇毒 tick 與普攻同為紅字,英雄血條下跌歸因黑箱;決策（爆發/強化/換關）無從做起,挫敗感直接轉為流失;量化後「牠每秒回 82,我 DPS 夠不夠」成為可決策資訊,卡關從謎題變課題;同時實錘並修復 v1 級 bug — consumeEvents 以 [0]/[1] 取 {x,y} 物件座標（undefined+20=NaN）,英雄出手傷害/治療/受擊/升級浮字自初始提交（f8e0276）起全數不可見,整場戰鬥的數字資訊密度（EHT 級觀戰回饋）一次到位
實作:js/sys/battle.js（regen 分支回血累計＋每秒 mheal flush、lifesteal 分支實際回復量 mheal 事件 — HP 數值軌跡逐位元不變）、js/ui/hunt.js（mheal case:首領位置綠色 +N＋fx_heal 粒子＋bossGreen 0.28s 全屏綠閃;mhit poison 旗標→紫字＋毒霧粒子;v558FIX:TEAM_POS[...].x/.y 取代 [0]/[1];postDraw 綠閃;render 衰減）、js/data/changelog.js(v558)、index.html(快取 574→575)
驗證:
- a) 語法:node --check js/sys/battle.js、js/ui/hunt.js、js/data/changelog.js 全通過;DBG 殘留 0 處
- b) 邏輯（瀏覽器實測,精確斷言）:吸血 — 5s 同步視窗 3 個 mheal、sum(mheal)≡Δhp+heroDmg（±3 內）、全 mech=lifesteal、無 kill 干擾;clamp 邊界 — hp=maxHp−3 且 mAtk=0.01 開戰即攻 → amt=3 精確;再生 — 3.5s 視窗 3 個 mheal（1/s flush）、單次 amt≈0.008×maxHp（±2）、含未 flush 尾段不變式 sum+healAcc≡Δhp+heroDmg、全 mech=regen;閘門 — hp=95% 1.5s 視窗 0 事件;劇毒 — step wrapper 捕獲 mhit[poison] 事件＋canvas fillText 實錘 #c792ea|-9 於英雄座標 (64,144)（修正前 NaN,NaN 不可見）;英雄側浮字復活 — #ffffff|-49@80,160 等白字實測;mheal 浮字 — #7ee787|+101/+127 於首領座標 (320,183) 實測
- c) 回歸:核心流程全通過（雙視口）— 王國→副本→英雄→裝備→建築→更多→頂欄世界地圖（21 名牌/2 canvas）→競技場地標 modal（「競技場✕我的名次」）→關閉回地圖→派遣 5 人（焚天炎龍 fight）→召回（phase idle/ids 0）→回城待機;每步 console 監聽零 error/unhandledrejection
- d) 實機:390×844 與 1280×800 雙視口零 console error（整頁 reload＋監聽）;reducedMotion=true 下 mheal 事件照常推送（引擎語義不變）、浮字/粒子/綠閃零輸出（fillText 監聽 0 筆綠/±浮字）、零錯誤;改動無新增繪製迴圈（事件驅動,同既有 hit/mhit 路徑）
- e) 截圖:progress/v558-diag-lifesteal-silent.png（修正前:【吸血】chip＋紅霧滴＋傷害數字,無任何回血數字）、progress/v558-diag-lifesteal-fight.png（修正前焚天炎龍 2362/3953 戰中）、progress/v558-lifesteal-mheal-mobile.png（手機 390px・「+127」「+62」綠色回血浮字實拍＋英雄側白字傷害復活）、progress/v558-lifesteal-mheal-desktop.png（桌機 1280px・「+107」實拍）、progress/v558-poison-tick-purple.png（劇毒 tick 紫字「-9」於英雄側＋「BOSS:古樹王・劇毒」橫幅）——inspect_image 逐字確認
風險與回滾點:純事件＋視覺雙檔（battle.js 事件推送/hunt.js 消費繪製）— 零數值公式變更（prev/acc 讀取不改算式,斷言逐位元一致）、零存檔語義、無新增隨機性;mheal 事件率受控（吸血=攻擊率 ~1/s、再生=1/s flush,無事件洪水）;英雄側浮字修復影響所有 hero-side 浮字（方向正確:讓既有設計意圖生效）,若發現任何顯示回歸,git revert 本輪 commit 即可（雙檔＋changelog/index）;註:測試過程為測試存檔,不影響正式進度
---

---
### [v557] 主題:【等角地圖】(循環 2・第 3 輪)
改動:地圖點擊命中偏移修正 — 麥田/每日寶箱/野生怪物三項互動的點擊判定由「CSS 座標 vs 邏輯命中點」改為先做 CSS→邏輯轉換再比較(2 行＋註解),手機(欄寬 366px)命中偏離 25.7%(≈90px)全面消除
為何讓玩家玩更久:瀏覽器實測(手機 390×844,雙重驗證:控制實驗＋全畫布格點掃描)發現地圖互動層在主要平台上已壞半年 — 點擊判定用 fx 層的邏輯座標(fkx=VW/cw=1.257)比較 CSS 點擊座標,命中點偏離可見物 25.7%:麥田 tile 繪於 (350,348) 卻須點 (440,437) 才收穫(90px 外,多半落在畫布外 = 完全不可點)、每日寶箱與野生怪物同病(寶箱命中點在繪製處 90px 外,手機上箱子「看得到永遠點不開」);每日寶箱是地圖上唯一的每日回訪錨點(v296),農田收穫 15s 循環與野生賞金 60s 循環是「在地圖上順手一撈」的微獎勵 — 三項全失效等於地圖淪為純觀賞頁,放置以外的「動手玩」樂趣與每日開箱儀式一起流失;修正後點繪製處即命中,手機玩家重新每天「上地圖→開箱→收麥→撈野怪」,地圖從觀賞頁變回可互動的活世界
實作:js/ui/map.js(wrap click handler:mx/my 先乘 VW/cw、VH/ch 轉邏輯座標再比對;移除原 fkx/fky 誤用;註解 v557FIX)、js/data/changelog.js(v557)、index.html(快取 573→574)
驗證:
- a) 語法:node --check js/ui/map.js、js/data/changelog.js 全通過
- b) 邏輯(瀏覽器實測,精確斷言):修正前後對照 — 修正前點麥田繪製處 (350,348) MISS、點幻影 (440,437) HIT(+26.4萬);修正後點繪製處 HIT(+26.4萬)、幻影 MISS(0 金)、同 tile 再點「麥田冷卻中(剩 15 秒)」;全畫布格點掃描(20px 步進,手機)實測三項互動全對齊 — 「開啟每日寶箱!+330萬 金 ・ 虛空碎片 ×4」(mapChest.opened true)、「收服野生穴居怪/火蜥蜴/岩漿怪/大老鼠/史萊姆/狼!+99.1萬 金」×6、「收穫小麥!+26.4萬 金」×N＋冷卻分支;桌機(欄寬 452,誤差 1.8% 被半徑吸收 — 即先前漏網原因)點繪製處 HIT、零錯誤;2× 縮放(VW=230)下點繪製處 HIT
- c) 回歸:核心流程全通過 — 王國→副本→英雄→裝備→更多→世界地圖(21 名牌/21 熱區)→競技場地標 modal(「競技場✕我的名次」)→區域名牌→副本(翠綠草原 第 1 關)→⤴ 大地圖返回→拖曳捲動→拖曳後誤觸抑制→小地圖跳轉→返回鈕→派遣 5 人(fight/kills 4)→召回(ids 0/idle);每步 console 監聽零 error
- d) 實機:390×844 與 1280×800 雙視口零 console error/unhandledrejection;reducedMotion=true 路徑全互動正常(測試存檔即 rm=true,上述 b/c 全數在其下通過);reducedMotion=false 動畫路徑驗證 — 兩幀差 5084px(波紋/野怪/小人/馬車動起來)＋麥田點擊 HIT＋零錯誤;改動為單一座標轉換,無新增繪製/迴圈
- e) 截圖:progress/v557-map-mobile.png(手機 390px・地圖全貌名牌零重疊)、progress/v557-map-desktop.png(桌機 1280px)、progress/v557-farm-click-mobile.png(手機・「✓ 收穫小麥↑ +26.4萬 金」toast 實拍)——inspect_image 確認 toast 文字/名牌/小地圖完整
風險與回滾點:純 ui/map.js 點擊座標轉換(2 行＋註解)— 零數值/零存檔語義/battle.js 零觸碰;命中半徑 14-18px 與冷卻邏輯原樣保留;若發現任何互動異常,git revert 本輪 commit 即可(單檔);註:測試過程開過每日寶箱/農田/野怪(測試存檔狀態,不影響遊戲邏輯)
---

---
### [v556] 主題:【UI/UX 與品質】(循環 2・第 2 輪)
改動:王國主頁「今日待辦」登入儀式回歸 — v279 像素復原合併時整段遺失的 14 錨點每日面板（任務/簽到/競技場/王者/秘境/特惠/世界首領/活動/盛宴/投餵/元素塔/深淵/迷宮/遠征）＋「一鍵例行」＋「一鍵領取全部」掛回王國概覽，並修正簽到/任務行的歷史語義缺陷
為何讓玩家玩更久:登入儀式（AFK Arena 式「今天還有什麼沒做」每日面板）是放置遊戲最高的回訪引擎 — v196 落地時本意就是「登入儀式中心化」；git 比對實錘 v279 復原合併（cb4d421）重寫 kingdom.js 時把整段 624-710 行刪除，v263「一鍵例行」的 6 個 runner 自此死代碼化：玩家開遊戲只看到資源與概覽，16+ 個每日/週錨點（每日任務/簽到/競技場 5 次/王者 5 次/秘境 9 次/世界首領 3 次/活動/盛宴/投餵/元素塔/深淵/迷宮/遠征）的紅點埋在「更多」磁磚裡，開局掃一眼→逐項執行的習慣迴圈斷裂，每日「有事可做」的期待感與 5-10 分鐘的例行停留一起流失；面板回歸後，登入→掃金框→深鏈/一鍵執行→一鍵收菜→離開，全鏈路重建 — 每日回訪有了具體的「待辦清單」錨點
實作:js/ui/kingdom.js（claimAllToday 回歸＋renderOverview 內今日待辦列回歸＋overviewSignature 納入 14 錨點狀態即時化＋簽到/任務行語義修正）、js/ui/more.js（openWelcome 補匯出）、js/data/changelog.js(v556)、index.html(快取 572→573)
驗證:
- a) 語法:node --check js/ui/kingdom.js、js/ui/more.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測，精確斷言）:kl28 存檔 14 行全渲染且狀態正確（任務 0/5・簽到 未簽・競技場 5 次・王者 5 次・秘境 9 次・特惠 4 件・世界首領 3 次・活動 —・盛宴 可捐・投餵 可餵・元素塔 可挑戰・深淵 可踏入・迷宮 可探索・遠征 可派遣 — 金框=hot、活動灰框）；「一鍵領取全部」金底類別正確（有可領=btn sm gold，領完=btn sm）；深鏈 7 行實測（任務/簽到/深淵/迷宮/遠征/世界首領/盛宴）各開對應 modal；▶ 執行競技場掃蕩（5→0 次、toast「0 勝 5 敗，+20 鑽石」）；一鍵例行批次（王者/秘境/世界首領/元素塔/深淵全跑＋彙總 toast＋競技場行即時變「0 次」）；一鍵領取全部（「已領取：每日 1・成就 9・圖鑑 6・豪禮 1・簽到 30」＋領取後按鈕金底熄滅）；簽到行修正 — 未簽=未簽+金框（0/30）、簽完=✓+灰框（30/30，修正前恆「未簽」）；任務行修正 — 0/5→3/5（prog≥target 計數，完成未領即顯示）→5/5 灰框（修正前只看 done=已領取）；深淵行新玩家=「未解鎖」灰框（修正前誤顯示「可踏入」）；新玩家 4 鎖定行（王者 Lv12/迷宮 Lv14/遠征 Lv16/深淵 未解鎖）全正確
- c) 回歸:核心流程全通過 — 王國→副本→英雄→裝備→建築→更多→頂欄世界地圖(2 canvas)→競技場地標 modal→派遣 5 人(fight/kills 3)→召回(ids 0/idle)→回城待機；每步 console 監聽零 error；overviewSignature 擴充成本 0.028ms/次（200 次實測 5.5ms）
- d) 實機:390×844 與 1280×800 雙視口零 console error/unhandledrejection；reducedMotion=true 下 14 行渲染＋一鍵領取全部正常零錯誤；改動純 DOM 重繪，無新增繪製迴圈
- e) 截圖:progress/v555-todo-mobile-kl28.png（手機 390px・今日待辦 14 行＋雙按鈕）、progress/v555-todo-desktop-kl28.png（桌機 1280px）、progress/v555-kingdom-full-mobile.png（全頁）——inspect_image 確認逐行文字/金框狀態/像素風一致
風險與回滾點:純 UI 回歸（kingdom.js＋more.js 一行匯出）— 零數值/零存檔 schema/battle.js 零觸碰；所有 runner/claimAll 走既有 sys 契約（無新邏輯，v263/v253 原碼回歸）；若發現任何異常，git revert 本輪 commit 即可（雙檔）；註:工作樹另有 v555 開發者功能（作弊/拉桿）未提交的在途改動（MG.sys.dev 守衛式掛鉤、vXXX 標記）— 本輪未觸碰，提交範圍僅今日待辦相關檔案
---
### [v554] 主題:【玩法機制與耐玩性】(循環 2・第 1 輪)
改動:無盡深淵「最佳層數」污染修復 — noteKill 補上 inAbyss 守衛（普通區域擊殺不再寫入 abyss.best），舊存檔自動遷移重設污染值（有深淵週紀錄者不動）
為何讓玩家玩更久:瀏覽器實測（kl28 注入存檔）發現深淵進度全面失真 — 每隻普通區域魔物擊殺都會呼叫 noteKill(stage)，而 abyss.best 更新缺 inAbyss 守衛（同函數 weekPeak 有守衛、best 沒有）：玩家根本沒踏入深淵，畫面上卻顯示「最佳 10 層」＋「抵達第 10 層」里程碑可直接白領 30 鑽＋首進直接從第 10 層（領主層）開打（跳過 1-9 層的爬塔節奏）＋建議戰力錯錨到 3.14 萬（第 1 層實際僅需 3050，差距 10 倍）— 無盡深淵是核心長期目標（10→25→50→100…1000 層里程碑階梯＋週結算＋深淵商店），進度造假讓里程碑、週結算、建議戰力全部失去意義，玩家對長線目標的信賴崩壞；修復後深淵階梯只反映真實深淵深度，首進從第 1 層開始爬，里程碑/週結算/商店庫存/素材兌換上限全部回歸真實進度 — 長線目標重新可信
實作:js/sys/abyss.js（noteKill inAbyss 守衛＋ensure() 舊檔遷移：best≤10 且 weekPeak/weekBest 皆 0 者重設 0）、js/data/changelog.js(v554)、index.html(快取 570→571)
驗證:
- a) 語法:node --check js/sys/abyss.js、js/data/changelog.js 全通過
- b) 邏輯（瀏覽器實測，精確斷言）:遷移 — 污染檔（best=10, weekPeak=0, weekBest=0）ensure() 後 best=0（首進層數由 10 變 1）；真深淵玩家（weekPeak=5/weekBest=3）best=7 不動（零誤傷）；noteKill 守衛 — 普通區域 stage 10 擊殺後 best 維持 0、weekPeak 維持 0（修正前會變 10）；深淵內擊殺 best 照常推進（noteKill(1)→best=1、noteKill(25)→best=25 且週峰值同步）；里程碑閘門 — best=25 時 claim(10)=true/claim(25)=true/claim(50)=false；已白領里程碑不追回（claimed[10] 保留、claim 再領 false 零雙發）；建議戰力 floor1=3050 vs 污染前 31400（10 倍誤差證據）；端到端實戰 — 踏入深淵從第 1 層開始，連殺 5 層 best=5/weekPeak=5，離開後普通區域再殺 4 隻 best 維持 6 零污染
- c) 回歸:王國→副本→英雄→裝備→建築→更多→頂欄世界地圖(2 canvas)→返回→回城待機全通過；深淵畫面/深淵商店/地圖地標入口逐項正常；每步 console 監聽零 error
- d) 實機:390×844 與 1280×800 雙視口零 console error/unhandledrejection（整頁 reload＋監聽）；reducedMotion=true 下深淵畫面渲染正常零錯誤；改動為單檔邏輯守衛＋遷移，無新增繪製/迴圈
- e) 截圖:progress/v554-diag-abyss-polluted-best10.png（修正前：尚未踏入深淵・最佳 10 層・里程碑可領 1 項・建議戰力 3.14 萬）、progress/v554-abyss-clean-mobile.png（手機・最佳 0 層・第 10 層里程碑距 10 層・建議戰力 3050・暫無可領取）、progress/v554-abyss-clean-desktop.png（桌機同值）——inspect_image 確認文字/數字
風險與回滾點:純 js/sys/abyss.js 單檔邏輯修正（1 個守衛＋1 段遷移）— 零 UI/零數值/零存檔 schema 變更（optional 欄位僅重算）；遷移條件極保守（僅重置「無任何深淵週紀錄」的 ≤10 污染值，真玩家零誤傷）；若發現任何異常，git revert 本輪 commit 即可（單檔）
---
### [v553] 主題:【數值平衡與留存】(循環 1・第 5 輪)
改動:王國 10 棟建築等級 ≥13 起每級成本成長率由 ×2.1-2.3 改為 ×1.35(與市場/簽到/任務/里程碑同錨)— 等級 ≤12 與舊曲線逐位元一致,前期節奏零變動
為何讓玩家玩更久:數值診斷(瀏覽器注入 kl16/kl28/kl32 三檔存檔實測)發現成長曲線中段斷裂 — 舊曲線 ×2.1-2.3/級無阻尼,kl28 玩家單次建築升級 = 王城 24→25 660 小時收入／酒館 22→23 188h／訓練場 21→22 130h／裝備商店 21→22 204h(數週),而同期強化(+10 階約 5 萬金)/訓練(63 萬)/突破(31 萬)/招募(數百金)全部在「幾分鐘收入」等級 — 金幣堆積無處消耗、主場景(王國頁)可見成長面凍結,產出→消耗閉環在 kl 22-35 斷裂;阻尼後單級落回「以天計」(kl28 實測王城 30→31 ≈ 10h、40→41 ≈ 3.1B ≈ kl40+ 收入 1-3 天),王國階梯重新成為每週有感的投資目標,與遠古科技(98B 月級)形成多尺度金幣消耗端 — 玩家每天打開遊戲都有「下一級建築」的進度爽點
實作:js/data/buildings.js(damp() 輔助函式＋10 棟 cost() 改寫＋檔頭曲線註解)、js/data/changelog.js(v553)、index.html(快取 569→570)
驗證:
- a) 語法:node --check js/data/buildings.js、js/data/changelog.js 全通過
- b) 邏輯(精確斷言,Node 全量掃描 10 棟×全部等級):lvl ≤12 新舊公式逐位元相等(identicalLow=true 全 10 棟);lvl 13+ 成長率 = 1.35±0.0001(全 10 棟);spot 值 — 王城 25→26=34,656,222(舊 116 億)、30→31=155,399,662(舊 590 億)、40→41=3,124,551,991;市場(max10)零變動;瀏覽器端到端 — bulkPreview(9 級 92,369,497)≡ bulkUpgrade 實扣(零漂移)、canBuy/buy 金幣不足 false、kl16 買王城 14→15 扣款精確(goldLeft=1,276,372)＋王國經驗 +80=20+15×4;kl28 存檔實測全 10 棟升級成本 0.3-2.6 小時收入(修正前 37.7-660h)
- c) 回歸:核心流程(王國→副本→英雄→裝備→建築→更多→頂欄世界地圖→烈焰火山地標→副本→回村待機 dispatchIds 0/phase idle)全通過;受影響功能逐一確認 — 建築卡升級成本顯示(雙視口)、連升預覽、覺醒重置(建築歸 1 不觸 cost)、離線彈窗、教學(新檔零變動)全正常
- d) 實機:390×844(CDP deviceMetrics)與 1280×800 雙視口零 console error/unhandledrejection(整頁 reload＋3-4s 監聽 0 筆);reducedMotion=true 下建築頁渲染正常零錯誤;改動為純 data 數值,無新增繪製/迴圈
- e) 截圖:progress/v553-diag-building-wall-kl28.png(修正前 kl28 王城 24→25=660h 診斷)、progress/v553-buildings-mobile-kl28.png(手機 390px 王城 Lv24 成本 3465 萬)、progress/v553-buildings-desktop-kl28.png(桌機 1280px 同成本)——inspect_image 確認數字/佈局
風險與回滾點:純 data/buildings.js 單檔數值變更 — 零 UI 邏輯/零存檔語義/battle.js 零觸碰;等級 ≤12 逐位元不變保證前期與既有存檔體驗零影響;若發現任何經濟異常,git revert 本輪 commit 即可(單檔)
---
### [v552] 主題:【動作與戰鬥呈現】(循環 1・第 4 輪)
改動:英雄死亡表現 — 隊員倒下 0.12s 白閃＋0.43s 壓縮倒地動畫 → 常駐趴地屍體＋手繪紅 ✕ 標記(黑描邊像素十字),屍體維持到戰鬥結束(含跨關卡),滅團回城清場
為何讓玩家玩更久:死亡是派遣制的核心節奏(滅團→20s 休息→復活→再戰),但「down」事件在 battle.js 三路徑(單體/AOE/毒)持續推送、UI 卻零消費 — 陣亡者只是原地站立凍結(0 血條),觀戰時「誰倒了、為什麼倒」是黑箱,玩家無法從戰況學習調整(換坦/喝水/召回決策全憑猜測);倒地演出把「我正在輸」的瞬間變成可讀訊息,補血/召回/強化裝備的決策時機被看見 — 挫敗轉資訊,卡關從謎題變課題,自然想「再試一次」;同時與怪物死亡(壓扁→爆炸→金幣)的既有演出對齊,世界首領/精英戰的戲劇性完整
實作:js/ui/hunt.js(anim.down 計時器＋「down」事件 case＋render 迴圈衰減/回城清場＋teamView 死亡封鎖:attack=false/status=[]/downT)、js/ui/render.js(drawCorpse:白閃→壓縮倒地→靜態屍體＋紅 ✕;死者分支 continue 跳過血條/攻擊/受擊/狀態圖示;✕ 手繪像素十字避開字體缺字)、js/data/changelog.js(v552)、index.html(快取 568→569)
驗證:
- a) 語法:node --check js/ui/hunt.js、js/ui/render.js、js/data/changelog.js 全通過
- b) 邏輯(瀏覽器實測,精確斷言):死亡瞬間捕捉 — 倒地中幀(壓縮/傾斜,與站立鄰兵對比);靜態屍體像素 = 精靈混色(屍體區 112 暗像素 vs 地面亮色)、站立區 = 天空色(直立身體已消失);紅 ✕ 像素精確斷言 = rgb(255,92,92) 位於設計座標 (tx+17, ty-14);4× 放大裁切(progress/v552-zoom-corpse.png)視覺確認:趴地平躺暗色身體＋紅 ✕＋鄰兵正常站立綠血條;reducedMotion=true 時死亡後立即靜態屍體＋✕(同斷言,零錯誤);技能就緒死者不掛「技」圖示(teamView status=[]＋render continue 雙層封鎖,活人對照組圖示路徑正常);屍體跨關卡持續(F.kills=52 連續擊殺重生後 h1 屍體仍在);滅團→retreat→城內場景零錯誤
- c) 回歸:王國→副本→英雄→裝備→建築→更多→頂欄世界地圖(2 canvas)→「翠綠草原 5」地標入口→副本(第 1 關開戰)→回村待機(dispatchIds 0/phase idle)全通過;每步 console 監聽零 error
- d) 實機:390×844 與 1280×800 雙視口死亡場景零 console error/unhandledrejection;雙視口斷言值完全一致(確定性渲染);reducedMotion 路徑零錯誤;新增繪製為每死者 ≤90 個 2×2 fillRect,無效能疑慮
- e) 截圖:progress/v552-corpse-mobile-final.png(手機・屍體＋✕)、progress/v552-corpse-desktop-final.png(桌機)、progress/v552-zoom-corpse.png(4× 放大斷言用)、progress/v552-diag-before-frozen-dead.png(修正前:死者凍結站立證據)
風險與回滾點:純視覺雙檔(ui/hunt.js＋ui/render.js)— 零數值/零存檔語義/battle.js 零觸碰;死者渲染僅影響 view.team 繪製分支,活人路徑代碼未動;若發現任何顯示回歸,git revert 本輪 commit 即可
---
### [v551] 主題:【等角地圖】(循環 1・第 3 輪)
改動:世界首領地標名牌加「午夜重置倒數」pin(1Hz 即時更新),並修正名牌/熱區世界→CSS 映射偏離(25.7%)與名牌貼邊裁切
為何讓玩家玩更久:世界首領是全遊戲最高價值每日事件(3 次出戰×30 倍戰力傷害、里程碑鑽石 30/50/100、週 21 場 100 鑽),但地圖 pin 原本只顯示「剩3戰/已討伐」— 沒有重置時間,用完次數的玩家看不到「何時再有」,今日回訪動機就此斷線;倒數 pin 把午夜重置變成地圖上的具體時間錨點(與秘境/競技場/每日任務同款 fmtClock),玩家一眼決定「待會再來」;同時修正名牌對齊 — 原本全部名牌/點擊熱區偏離地標 25.7%(風車實測錨點偏右 66px),pin 落在白骨地標東側 66px 外,玩家點地標圖示會落空,修正後地標=名牌=熱區三點合一
實作:js/ui/map.js(msToMidnight＋modeState 倒數、wbPin 1Hz refreshPins、placeLabels kx/ky=1 映射修正、名牌水平夾緊)、js/data/changelog.js(v551)、index.html(快取 564→567)
驗證:
- a) 語法:node --check js/ui/map.js 通過
- b) 邏輯:pin 三態實測 — 剩3戰＋倒數(18:19:47→18:19:45 每秒 tick)/消耗 3 次出戰→「已討伐・HH:MM:SS 後重置」/點 pin→世界首領 modal 開啟;對齊精確斷言:風車名牌錨點 ΔX=0(修正前 +66px)、世界首領名牌錨點 ΔX=0 且位在地標正下方 26px(設計值);名牌水平夾緊:wb pin 在右緣 pan 下 126-364px 全塊留在視口(修正前 420px 溢位裁切),深淵名牌左緣同步修正;名牌零重疊(多視口全量 21 名牌碰撞掃描 0 次)
- c) 回歸:王國→副本→英雄→裝備→建築→更多→頂欄世界地圖→烈焰火山名牌→副本(⤴ 大地圖)→返回地圖→回城待機(dispatchIds 0/phase idle)全通過;點擊地標熱區=前往討伐(戰鬥中由既有 fight-guard 阻擋並 toast,召回後正常導航)
- d) 實機:390×844 與 1280×800 雙視口零 console error/unhandledrejection(整頁 reload＋3s 監聽 0 筆);reducedMotion 下地圖渲染正常、pin 文字照常更新(資訊非動畫);自動化滑鼠拖曳於長時間 session 後失真(CDP 輸入競態)— 全新 browser 實測拖曳/小地圖跳轉正常
- e) 截圖:progress/v551-wb-pin-aligned-mobile.png(手機・已討伐＋倒數・地標正下方)、progress/v551-wb-pin-desktop.png(桌機)、progress/v551-diag-windmill.png(對齊修正前風車偏 66px 診斷證據)
風險與回滾點:地圖軸單檔(map.js)純顯示/純定位 — 零數值、零存檔語義、battle.js 零觸碰;映射修正影響全部名牌/熱區位置(方向正確:對齊地標),若發現任何名牌錯位,git revert 本輪 commit 即可(或僅還原 placeLabels kx 行)
---
改動:副本主畫面「派遣狀態卡」— 狀態列＋離線收益行升級為面板容器,三態著色(派遣綠⚔/休息金黃💤秒數倒數/待機灰⏳),離線速率金色加粗
為何讓玩家玩更久:放置核心回饋「我正在掛機＋關掉能拿多少/時」原本是全畫面最不顯眼的 10px 灰字(層次倒置,瀏覽器實測雙次確認)— 玩家看不到收益就不會「睡前記得派遣」,離線收益與回訪動機一起流失;狀態卡讓掛機價值一眼可見,關遊戲前的派遣決策與回訪慾望同時被強化
實作:js/ui/hunt.js(狀態卡容器＋三態著色＋速率金色 span 化;offPre/offRate/offNote 三分 span;移除死碼 bossStage)、js/data/changelog.js(v550)、index.html(快取 563→564)
驗證:
- a) 語法:node --check js/ui/hunt.js 通過
- b) 邏輯:四狀態路徑實測 — 派遣(green ⚔＋金 rates 800weight 11px)/派遣＋在線專注(🔥 ×1.10(2/4h) suffix)/休息(gold 💤＋秒數 15→14 倒數 tick＋「休息中 = 0」)/待機(dim ⏳＋「未派遣 = 0」);分支:auto=false 休息文案「休息完畢自動待機」、難度 suffix「· 困難」;DOM 斷言:card bg panel2、border 2px、radius 10px、rate span color rgb(255,209,102)
- c) 回歸:核心流程全通過 — 王國→副本→英雄→裝備→建築→更多→頂欄世界地圖(21 hit zones)→區域名牌入口→副本(⤴ 大地圖鈕)→返回地圖→回城待機(recall ids 0/phase idle)
- d) 實機:390×844 與 1280×800 雙視口零 console error;reducedMotion 開關下卡靜態渲染無誤;卡與上下元素(隊列/派遣鈕)間距協調
- e) 截圖:progress/v550-status-card-mobile-farm.png(派遣態)、progress/v550-status-card-mobile-rest.png(休息態)、progress/v550-status-card-desktop.png(桌機)
風險與回滾點:純顯示層(ui/hunt.js 單檔)— 零數值/零存檔語義/battle.js 零觸碰;風險僅文案結構,git revert 本輪 commit 即可
---
### [v549] 主題:【玩法機制與耐玩性】(循環 1・第 1 輪)
改動:怪物攻擊前搖警示 — 攻擊前最後一格頭頂紅白「!」(BOSS 1.4×)
為何讓玩家玩更久:掛機觀戰時「怪物何時攻擊」可讀 — 補血/換陣的決策時機被看見,戰鬥從黑箱變成可反應的節奏
實作:js/ui/render.js(警示繪製＋條件修正)、js/ui/hunt.js(註解同步)、js/data/changelog.js(v549)、index.html(快取 562→563)
驗證:
- a) 語法:node --check render.js/hunt.js 通過
- b) 邏輯:unit 驗證 SIM_STEP=0.5 分片下 mAtk 序列 1.4→0.9→0.4→重置 — 原 <0.22 條件結構性不可達(死代碼確認),修正 ≤0.5 每攻擊週期觸發一次;瀏覽器包裝 battle.step 實測 dt=0.2 連續步進、mAtk 更新正確
- c) 回歸:核心流程通過;改動僅 render 繪製分支,零數值觸碰
- d) 實機:瀏覽器零 console error;reducedMotion 時 windup=false 不繪製
- e) 截圖:(測試輪)未留存 — 下輪起依協議補截圖
風險與回滾點:純視覺;git revert 本輪 commit 即可
---

