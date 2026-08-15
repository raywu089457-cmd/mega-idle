# MEGA IDLE 自主迭代迴圈 — goal-run 記錄

## 最後完成輪次: v297（2026-08-15）

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
