# MEGA IDLE 自主迭代迴圈 — goal-run 記錄

## 最後完成輪次: v281（2026-08-15）

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
