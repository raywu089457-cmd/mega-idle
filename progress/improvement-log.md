# 放置王國 MEGA IDLE — 長期改善日誌(製作人輪換制)

> 製作人輪換制:每輪依序 **玩法機制 → UI/UX 與品質 → 等角地圖・美術與內容 → 動作與戰鬥呈現・角色動畫 → 數值平衡與留存 → 等角地圖・功能與技術 → 戰鬥特效與英雄怪物呈現**,七主題輪完循環數 +1。
> 美術/動畫類(主題 3/4/7)佔 7 輪中 4 輪(主題 3、4、6 地圖類 2 輪＋動作類 2 輪為資產級強制)。
> 主題由觸發器(loop-trigger.js)讀本檔狀態行決定,agent 不得自行更動主題。
> 原則是每一輪在指定主題內找出「讓玩家想玩更久」的單一最值得改善處並直接實作,驗證後記錄。

## 美術/動畫 backlog 追蹤(主題 3/4 輪次必做項,完成打 [x])

- [ ] P0 模式地標精緻化(10 地標對齊區域地標水準:細節+陰影+小 fx)
- [ ] P0 地標黑輪廓去除(TheoTown R3:box/tri 輔助與個別地標的 #101018 改各材質深一階色 — 稽核 8+1 處)
- [ ] P0 村莊生活感(路燈/攤位/更多村民/商店招牌)
- [ ] P0 海洋活化(漁船/燈塔)
- [ ] P0 氛圍層(鳥群/螢火蟲/流星)
- [ ] P1 區域地標 tier 2(第 5/10 關進階視覺)
- [ ] P1 迷霧邊緣柔化
- [ ] P1 名牌碰撞解析(密集區自動推開/縮小)
- [x] P0 職業動作差異化(弓手拉弓/法師舉杖/刺客突刺/騎士盾頂)
- [ ] P0 4 方向走路幀(FF1 語彙:正/背/側成幀,地圖小人用)
- [ ] P0 待機隨機動作(眨眼/張望/撓頭)
- [ ] P0 地圖小人 4 幀走路循環+方向切換正確性
- [ ] P1 技能特效質感(火球拖尾/冰霜碎片/毒雲/雷鏈/聖光柱/斬擊弧)
- [ ] P1 擊殺消散(怪物死亡粒子/漸隱)
- [ ] P1 怪物行動前搖(0.15-0.25s 抖動/蓄力)
- [ ] P1 狀態視覺化(腳下光圈/頭頂環)

## 輪換狀態(觸發器讀寫)

```
循環:3
輪次:14
當前主題:玩法機制與耐玩性
下一主題:UI/UX 與品質
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

