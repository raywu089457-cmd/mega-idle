# 放置王國 MEGA IDLE — 長期改善日誌(製作人輪換制)

> 製作人輪換制:每輪依序 **玩法機制與耐玩性 → UI/UX 與品質 → 等角地圖 → 動作與戰鬥呈現 → 數值平衡與留存**,五主題輪完循環數 +1。
> 主題由觸發器(loop-trigger.js)讀本檔狀態行決定,agent 不得自行更動主題。
> 原則是每一輪在指定主題內找出「讓玩家想玩更久」的單一最值得改善處並直接實作,驗證後記錄。

## 輪換狀態(觸發器讀寫)

```
循環:2
輪次:6
當前主題:UI/UX 與品質
下一主題:等角地圖
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
- **世界地圖(主場景)**:等角 TheoTown 風 map.js — 村莊 18×14、10 區、10 模式地標入口、迷霧、農田、野生怪物、街道小人、小地圖、每日寶箱

---

<!-- 每輪記錄從這裡往下附加（最新在上）。格式見 goal-prompt.md 報告格式。 -->

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

