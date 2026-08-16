# 放置王國 MEGA IDLE — 長期改善日誌(製作人輪換制)

> 製作人輪換制(TheoTown 版):每輪依序 **TheoTown 建築與地標 → TheoTown 村莊生活感與街道 →
> TheoTown 地形・道路與環境 → TheoTown 海洋・氛圍與動態 → TheoTown 技術對齊與稽核**,
> 五主題輪完循環數 +1。全部主題只做一件事:世界地圖的 TheoTown 風格迭代,
> 終極目標是建築設計方式與風格完全等同 TheoTown 官方(見 docs/THEOTOWN-ART-RULES.md)。
> 主題由觸發器(loop-trigger.js)讀本檔狀態行決定,agent 不得自行更動主題。
> 原則是每一輪在指定主題內找出「讓地圖更像 TheoTown」的單一最值得改善處並直接實作,驗證後記錄。

## 美術/動畫 backlog 追蹤(主題 3/4 輪次必做項,完成打 [x])

- [x] P0 模式地標精緻化(v578:4 弱勢地標重繪＋全地標深綠貼地陰影,對齊區域地標水準;v562 基礎精緻化)
- [x] P0 地標黑輪廓去除(v568 box/tri 去黑框、v578 頭骨眼窩 #1a1018→#3a3038 收尾;現況稽核 #000/#101018 全圖 0,僅洞穴內口/裂縫 interior 與角色黑描邊契約保留)
- [x] P0 村莊生活感之路燈（v579 6 座路燈 TheoTown 化重繪:石基座/鐵柱/青銅罩/琥珀玻璃/金頂飾/暖光暈,R2/R3 合規）
- [ ] P0 村莊生活感（攤位精緻化/更多村民/商店招牌）
- [x] P0 海洋活化(漁船/燈塔)（v581：漁船重繪＋沿岸淺水/白浪泡沫＋海鷗＋燈塔碼頭 TheoTown 化全重繪）
- [ ] P0 氛圍層(鳥群/螢火蟲/流星)
- [x] P1 區域地標 tier 2（第 5/10 關進階視覺）
- [ ] P1 迷霧邊緣柔化
- [ ] P1 名牌碰撞解析(密集區自動推開/縮小)
- [x] P0 職業動作差異化(弓手拉弓/法師舉杖/刺客突刺/騎士盾頂)
- [ ] P0 4 方向走路幀(FF1 語彙:正/背/側成幀,地圖小人用)
- [x] P0 待機隨機動作(眨眼 v568 完成/張望 v325 完成;撓頭留待後續)
- [ ] P0 地圖小人 4 幀走路循環+方向切換正確性
- [ ] P1 技能特效質感(火球拖尾/冰霜碎片/毒雲/雷鏈/聖光柱/斬擊弧)
- [ ] P1 擊殺消散(怪物死亡粒子/漸隱)
- [ ] P1 怪物行動前搖(0.15-0.25s 抖動/蓄力)
- [ ] P1 狀態視覺化(腳下光圈/頭頂環)

## 輪換狀態(觸發器讀寫)

```
循環:1
輪次:4
當前主題:TheoTown 海洋・氛圍與動態
下一主題:TheoTown 技術對齊與稽核
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

