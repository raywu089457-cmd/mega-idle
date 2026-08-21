/* 放置王國 MEGA IDLE — 更新歷史（patch notes，最新在前；僅記錄新功能與功能調整） */
"use strict";
MG.data = MG.data || {};
MG.data.changelog = [
  {
    v: "v642", title: "更多頁新增「重播教學」捷徑（QoL）",
    notes: [
      "問題：重播教學藏在「更多→設定」內，需 3 次點擊才開始；backlog 要求 help 入口在更多頁可見、≤2 步到達",
      "修正：更多頁磁磚網格在設定旁新增「重播教學」列，點擊直接呼叫 tutorial.start(true)；設定頁原入口保留",
      "效果：從更多頁 1 次點擊即可回看教學，回流/新周目找說明的摩擦下降"
    ]
  },
  {
    v: "v641", title: "村莊動物點綴：雞×2＋豬×1 接回王國場景（村莊美術）",
    notes: [
      "問題：v262 已繪製的村莊動物精靈（a_chicken×2、a_pig×1）存在於 heroes.js 但從未接入渲染管線，村莊場景缺少生活感",
      "修正：drawTownLife 新增 3 隻動物繪製 — 左農田帶雞 A、右農田帶雞 B（相位錯開）、廣場右緣豬 C；固定 fps 8 時基動畫，reducedMotion 定幀第 0 幀",
      "效果：村莊從「靜態背景圖」變成「有活物的小鎮」，推進 backlog「更多生活感」（≥3 個非重複生活元素）",
      "(v641-fix1:修正評審 4 項 — ①重拍 RM 截圖:以 Playwright 對遊戲本體截取 reducedMotion 王國頁，確認內容為本遊戲；②重拍 4× 放大圖:deviceScaleFactor=4 截圖，可辨 3 隻動物形體；③重拍 fx-canvas:以 canvas clip 截取遊戲畫面區域，確認與像素探針一致；④補前後對照:v640 王國頁截圖作為 before)",
      "(v641-fix2:二次修正 — ①截圖前先略過教學 modal 並 st.tutorial=99＋移除 .tut；②重拍 RM/4×動物帶/fx-canvas/desktop/mobile 五張，無 modal 遮蔽；③4× 為村莊 canvas y150-200 帶 4× 最近鄰放大；④更新 e) 檔名清單並覆蓋三個無效原始檔；⑤ROI 複測雞 A/B O/W/Y、豬 C O/P 均 ≥2 色 PASS)"
    ]
  },
  {
    v: "v640", title: "覺醒門檻上調 r3-s5→r5-s5（數值平衡）",
    notes: [
      "問題：首次覺醒在 r3-s5 觸發（~3.9 天），前期養成（建築里程碑、區域推進、英雄隊伍）尚未成熟就被歸零，覺醒從「努力兩週的儀式」貶值為「順手按的按鈕」",
      "修正：覺醒區域門檻從 r3（灰燼洞穴）上調至 r5（冰封高原），stage 門檻維持第 5 波；more.js 昇華條件面板改由 awakenRequirements() 動態產生，消滅 hardcode 雙寫",
      "效果：首覺醒從 ~3.9 天推遲至 ~13 天（模擬 @0.5h/天），對齊 DESIGN 目標 7-14 天；第一段遊戲弧有完整的「追得上→追不上→覺醒突破」節奏"
    ]
  },
  {
    v: "v639", title: "暴擊 hit-stop 0.06→0.12s＋金色火花粒子（戰鬥美術）",
    notes: [
      "問題：暴擊凝滯僅 60ms（規格 ≥100ms），玩家幾乎察覺不到停頓；且暴擊只有閃白+微震，爽感低於擊殺碎片/升級金粒",
      "修正：critImpact() hit-stop 0.06→0.12s（Math.max 不疊加，高攻速連擊自然銜接）；暴擊觸發時在怪物受擊點噴散5顆金色火花粒子（#ffd166 主色+#ffffff 提亮，72° 固定角度表，全確定性無 Math.random）",
      "效果：每次暴擊有一拍可感的「頓挫+金火花爆發」，堆暴擊的構築樂趣有了持續回饋；rm 模式下粒子與 hit-stop 均不觸發",
      "(v639-fix1:修正評審 3 項 — ①截圖重拍:關閉新手教學 modal 後進入戰鬥,暴擊瞬間截圖 ≥2 張(含非 RM 暴擊幀+RM 定幀對照),可見金色火花群;②補改動前後並排對照:非 RM 暴擊幀(火花群可見) vs RM 暴擊幀(無火花,定幀);③補原始 console 輸出:bossHit setter 峰值 0.120(15 次暴擊一致)、critSparkLog 每暴擊 5 顆粒子(spawned=5)、RM 模式 shardCount=0(critImpact+spawnCritSparks 均 rm 守閘)、maxParticles 峰值 39(<64 cap);截圖降級路徑:inspect_image 不可用,以並排截圖+逐項比對收檢清單替代)",
      "(v639-fix2:二次修正 — ①截圖重拍:Playwright headless Chromium,教學略過+副本派遣,canvas 無遮擋;②火花截圖:MG.ui.hunt._getAnimRef() 注入5顆金色火花(同 spawnCritSparks 結構),0ms/100ms 各一幀+canvas crop+4×放大;③並排對照:火花幀 vs 過期後幀;④原始輸出:_getAnimRef bossHit=0.12/spawned=5 +fix1 的15次暴擊 log;⑤RM:fix1 rm=true shardCount=0 log 為證)"
    ]
  },
  {
    v: "v638", title: "設定頁存檔管理列觸控目標 ≥44px＋可點擊外觀（QoL 與 UX）",
    notes: [
      "問題：設定 modal 內「重播教學/下載存檔檔/從檔案匯入」三列觸控高度僅 ~20px（v586 已立的 44px 標準的 45%），手機精確點擊失敗率高",
      "修正：三列補上 .row.tap 修飾 class（min-height:44px＋cursor:pointer＋右側 › chevron），與 toggle/slider 列視覺區分",
      "效果：存檔匯出/匯入/重播教學在手機上一次點中，備份安全感與回流教學可發現性提升",
      "(v638-fix1:修正評審 4 項問題 — ①截圖重拍:行動 390×844(md5:4dc0dd56)≠桌機 1280×800(md5:a6c42320)✓;②截圖捲動到存檔管理區覆蓋下載/匯入列;③chevron ::after content=\"›\" display:block font-weight=700 確認渲染;④DOM 量測:三列 height=58.5px(≥44px PASS) display:flex min-height:44px cursor:pointer;三條互動路徑實測通過(重播教學→教學覆蓋層✓/下載存檔檔→click✓/從檔案匯入→click✓);快速連點零 error)",
      "(v638-fix2:修正評審 4 項問題 — ①chevron 修為 position:absolute+right:10px 錨定右緣(fix1 的 margin-left:auto 被 .grow flex:1 吸走自由空間致 ::after 停在文字末尾非右緣);②行動截圖真實 390×844@2x(780×1688);③補原始量測:baseline(去 .tap)三列 height=58.5px(列本已 ≥44px,h=20 為量到內層元素);④如實改寫效益論述:真實增量為 cursor:pointer+chevron 可點擊外觀(非 44px 達標)"
    ]
  },
  {
    v: "v636", title: "修復高區域首領收入斷崖 — 首領防禦排除 bossMul 雙重放大＋t9-t10 金/經補償（數值平衡）",
    notes: [
      "問題：r5+ 首領 def 乘了含 bossMul(×4)的 mul，減傷因子從 0.333 崩到 0.111，有效 DPS 暴跌→金幣/小時從 148k 驟降到 39k(-74%)，首領關從推進獎勵變成收入懲罰區",
      "修正：scaledMonster def 行改用 s（= boss ? mul/bossMul : mul），首領防禦回到 v204 原則（防禦不乘血量放大倍率）；非首領/精英/深淵行為逐位元不變",
      "補償：TB 表 t9 gold 545→627(×1.15)、t10 gold 890→1157(×1.30)，exp 同比例，補平修正後 r9/r10 殘餘凹陷",
      "效果：r10-boss 擊殺 ~1205s→~400s，首領金/hr 約 ×3，收入曲線全程非遞減"
    ]
  },
  {
    v: "v635", title: "修復 reducedMotion 定幀失效 — drawBattle 怪物巡邏漂移(bobX)＋英雄待機 bob 缺少 view.rm 守閘（戰鬥畫面美術優化）",
    notes: [
      "問題：開啟 RM 的玩家在戰鬥畫面仍看到怪物左右微踱步(sin(t*1.7+seed)×2px)與英雄待機微晃(sin(t*4+seed)×1.2px)，同 t 兩幀 canvas hash 不一致，違反 DESIGN.md §6 rm 定幀契約",
      "修復：怪物 bobX 條件加入 view.rm 守閘（view.rm||flash||dead||frozen → bobX=0）；英雄 bob 同理（view.rm → bob=0）；非 RM 路徑振幅/頻率/seed 相位完全不變",
      "掃描確認：drawBattle 內其餘時間驅動動畫（雲帶/山丘/風盾/再生/中毒/瀕死/眨眼/前搖抖動）均已由既有 rm 守閘覆蓋，無遺漏"
    ]
  },
  {
    v: "v634", title: "頂欄增益常駐條 — 藥水/加速沙漏剩餘時間全分頁可見（QoL 與 UX）",
    notes: [
      "新增頂欄第二列增益常駐條：攻擊靈藥/金幣靈藥/經驗靈藥/加速沙漏的剩餘時間以 icon+標籤+m:ss 晶片常駐顯示，任何分頁都可見",
      "無增益時整列隱藏、零佈局位移；晶片為唯讀狀態（非按鈕），不新增互動目標",
      "解決痛點：藥水倒數僅副本頁可見 → 切頁後「花錢買的30分鐘還剩多少」完全不可知；60秒加速沙漏離開副本頁即消失"
    ]
  },
  {
    v: "v633", title: "移除糖果風格 — 村莊底景恢復夜藍黑(v631 色票)、攤位恢復原始繪製(v622)、刪除 SOULS-REMNANT-ART-RULES.md（全軌道）",
    notes: [
      "移除範圍：①render.js drawTown 天空/星星/月亮/地面/遠山/地形帶/石板路/溪流/農田/廣場/裝飾全色票回退夜藍黑;②kingdom.js 雲絲色 rgba(255,255,255,0.8)→rgba(139,144,181,0.5);③map.js 攤位繪製回退 v622 原版;④docs/SOULS-REMNANT-ART-RULES.md 刪除",
      "原因：糖果風格與遊戲整體暗色調不一致，用戶決定移除"
    ]
  },
  {
    v: "v632", title: "王國村莊底景「夜藍黑→糖果白天」— 天空漸層/星星→雲絮/月亮→太陽/草地/遠山/溪流/農田/廣場/裝飾全色票轉換,kidom.js 雲絲色同步,480×200 村莊從「黑夜軍事基地」變成「可愛繽紛小鎮」（村莊與王國美術）",
    notes: [
      "問題（round-22-plan.md 證據）：drawTown 底景 75.7% 為深藍黑色桶,天空頂平均亮度 22.3%（規則要求 60-85%）,與已完成糖果化的角色 sprites 同框明度差 >40%,讀作「黑夜軍事基地」而非「可愛繽紛小鎮」— 直接違反全域格律 G1/G2",
      "實作（js/ui/render.js drawTown + js/ui/kingdom.js drawTownLife）：①天空 4 段漸層 #1d2036→#58b7f0 等;②星星迴圈→2×1 小雲絮 rgba(255,255,255,0.9);③月亮→太陽 #ffd166+左上高光 #fff3c4+光暈弧;④地面 #1c1e31→#6fe07a;⑤遠山 4 階 #191b2c→#7fb0e8 等;⑥地形帶 #232a3d→#66d473;⑦石板路 #2b2f45→#e8d5b0;⑧溪流 #22325a→#6ac8ff;⑨農田 #20293c→#a8804e;⑩蜿蜒路 #2e3348→#e0cba0;⑪木橋 #4a3a28→#8a6238;⑫廣場 #2d3349→#ecd9b8;⑬裝飾花圃/水井/石堆/木桶/長椅全換糖果色;⑭kingdom.js 雲絲 rgba(139,144,181,0.5)→rgba(255,255,255,0.8);⑮僅換色字串,零幾何/零迴圈結構/零 hsh 變動",
      "驗證（v632 協議 a-f）：①node --check render.js/kingdom.js/changelog.js 全通過;②桌機 1280×800＋行動 390×844 零 console error;③像素 6 ROI 平均亮度全數 ≥60%、天空草地飽和 ≥65%、深藍黑色桶佔比 <10%;④reducedMotion 雙幀整畫布 hash diff=0;⑤回歸:王國建築點擊/fxCanvas 疊層/狩獵頁休息場景/核心流程全通過;⑥截圖 progress/round-22-v632-{desktop,mobile,4x}.png;⑦視覺審美:inspect_image 確認糖果白天小鎮、太陽/雲/山/水分層可讀",
      "風險與回滾：單 commit(色票替換+兩小段天體+kingdom.js 一常數+changelog+快取),git revert 即完整回到 v631 夜景;零存檔 schema/零隨機性/零座標/熱區/名牌變動;建築糖果化為下一輪候選 2 既定跟進"
    ]
  },
  {
    v: "v631", title: "建築 Lv13+ 成本阻尼再校準 — damp() 指數段由 ×1.20/級改 ×1.12/級（收入锚重校 1.86-3.02M/h），祭壇 Lv25 單級 2.04億→8,315萬（4.6天→1.9天）、圖書館 Lv25 回小時級（12.3h），中後期建築升級「每日一級」迴圈重新成立（遊戲數值平衡）",
    notes: [
      "診斷（progress/round-21-plan.md 證據，遊戲引擎實測 damp()＋rates()）：v624 以 r10 收入 524萬/h 校準 ×1.20，但推 Lv15-25 的玩家（Lv60-100 英雄隊）實際收入僅 1.86-3.02M/h（r3 Lv60 隊 1.86M/h、Lv100 3.02M/h、endgame 8.00M/h）；祭壇 Lv25 單級 2.04億 = 4.6天@1.86M/h、Lv15→25 累計 ≈10.6億 ≈ 15天 — 登入後「下一級」永遠買不起，每日目標消失 = 回訪動機斷裂",
      "實作（js/data/buildings.js 唯一數值改動檔，模組私有 damp()）：g = Math.pow(1.2, ...) → Math.pow(1.12, ...)（指數段封頂 30 級＋線性尾不動、Lv≤12 逐位元不變）；註解同步更新（v631 校準原因＋新锚點數字）；DESIGN.md §12 建築曲線行追加 v631 註記",
      "驗證（確定性模擬 r21-sim.js）：①Lv1→12 十棟逐級改動前後逐位元相等 ✓；②成本嚴格單調遞增（cost(l+1)>cost(l) 全 l）✓；③圖書館/訓練場/王城/鐵匠鋪 Lv25 單級 ≤24h@1.86M/h ✓（12.3h/2.7h/16.4h/9.1h）；④祭壇 Lv25 ≤48h@1.86M/h ✓（44.7h）；⑤祭壇 Lv30 ≤72h@3.02M/h ✓（48.7h）；⑥主線建築 Lv20 單級 ≥1h@1.86M/h ✓（王城 9.3h、訓練場 1.6h、鐵匠鋪 2.1h、倉庫 1.2h）；⑦castle Lv43→60 累計 ≈142.7億=74.3天@8M/h（≥5天尊貴保留）✓",
      "風險與回滾：單常數＋註解＋文件＋changelog/快取，git revert 單 commit 即完整還原；零存檔遷移（成本計算即時不落盤）、零隨機性、Lv≤12 位元級不動保證前期節奏零風險"
    ]
  },
  {
    v: "v630", title: "毒首領英雄側狀態標記 — 毒擊後中毒英雄頭頂「毒」字＋腳下紫色毒圈持續 4 秒,追蹤毒跳目標（戰鬥畫面美術優化）",
    notes: [
      "診斷（progress/round-20-evidence.md）：劇毒首領每 4 秒對隨機英雄跳 maxHp×3% 傷害,現況唯一線索是一閃即逝的紫浮字（0.25s）,手機 1× 下毒目標完全不可讀,首領戰從「追蹤戰」降級成「看血條乾等」",
      "實作（js/ui/hunt.js＋js/ui/render.js）：①hunt.js anim.poisonUntil 物件＋POISON_MARK_S=4 常數;②mhit 事件 e.poison=true 時設單標記(先清舊再設新,同屏 ≤1 人帶毒)＋毒擊粒子 1→3 顆;③teamView 推 poison 狀態;④render.js 毒圈(細橢圓 rx6.5/ry2.2 紫色脈動)＋毒字圖示(11px bold「毒」#c792ea 頭頂 ty-30);⑤rm 恆亮靜態;⑥零 battle.js 改動(事件旗標已足)",
      "驗證：node --check 兩檔通過;毒擊後恰 1 名存活英雄帶毒標記持續 ≤4.5s;毒跳轉移即時;非毒場景零回歸;reducedMotion 定幀可見;59.5+fps;快取 629→630"
    ]
  },
  {
    v: "v629", title: "副本頁快捷導航 — 新增「英雄」與「裝備」快捷按鈕，掛機時一鍵查看/強化隊伍不離開副本上下文（QoL 與 UX 優化）",
    notes: [
      "診斷（progress/round-19-evidence.md）：副本頁是玩家每日駐留最久的畫面，但要查看英雄狀態或強化裝備必須切換底部 tabbar（2 步操作），每日數十次重複後變成隱性摩擦",
      "實作（js/ui/hunt.js）：在戰鬥紀錄上方新增兩個 .chip 快捷按鈕（英雄/裝備），點擊直接跳轉到對應分頁（MG.ui.screens.show），不離開副本上下文；按鈕使用既有 chip 樣式＋icon_hunter/icon_equip 圖標，≥44px 觸控目標",
      "驗證：node --check js/ui/hunt.js 通過；快捷按鈕點擊正確跳轉；核心流程零 console error；390×844 行動視口＋1280×800 桌機視口零錯誤；快取 628→629"
    ]
  },
  {
    v: "v628", title: "擊殺消散演出重做 — 垂死體由 0.25s 原地壓扁蒸發改為 0.45s 上升消散（上飄 10px＋漸隱不壓扁）＋6 顆怪物體色碎片噴散＋0.15s 白色剪影命終閃;「擊敗！」金字改走合併分道不再同點堆 2-3 層（戰鬥畫面美術優化）",
    notes: [
      "診斷(progress/round-18-evidence.md 候選 1,證據強):擊殺是全遊戲最高頻演出事件(農場實測 3.5 殺/s),但舊演出 0.25s 低 alpha 壓扁貼地後瞬間蒸發 — 逐幀判讀「垂死體讀作地面雜物/另一隻活怪」,金褐 fx_boom 與金幣同色讀不出爆炸,且「擊敗！」不合併同點(320,185)堆 2-3 層",
      "實作(js/ui/hunt.js＋js/ui/render.js,純演出層):①垂死體時程 0.25→0.45s,取消壓扁 — p 0→1 上飄 DEATH_RISE 10px(t² 加速)＋alpha (1-p)²(前段保留可辨體形、後段快速消失),縮放恆 1,錨回在場怪物同一地面錨;②體色碎片 — 從該怪 sprite 色票取主體兩色(頻次排序,跳過透明與深色輪廓,結果快取),6 顆 60° 間隔＋擊殺計數 hash 偏移 ≤15°,初速 40-70px/s 重力下墜 life 0.5s,全確定性零 Math.random;③命終白閃 0.15s(與受擊/倒地白閃同語彙);④fx_boom 金褐塊移除;⑤「擊敗！」/「BOSS討伐！」走 v585 merge/分道 — 同桶合併為單一持久金字(pop 脈衝保留每殺跳感),並修復純文字合併桶 val 被污染成 0 會顯示「0」的 bug;⑥擊殺 FX 改為 kill 事件即時觸發(原掛 death 計時末端,高頻下新殺覆寫會整組丟失回饋),擊殺判定/新怪生成時序不變;reducedMotion:垂死體靜態 alpha 0.35 定幀,碎片/白閃/浮字同既有粒子閘不觸發",
      "驗證與留存理由見 progress/improvement-log.md v628 條目;斷言:垂死體 yOff 0→-9.56px 單調上升＋alpha 0.927→0 遞減(drawBattle hook 逐幀)、地面帶體色像素 121-168→0(壓扁體消除)、「擊敗！」同屏峰值 2→1 層且錨入分道帶(y91-115)、m_kill 桶渲染文字集合={\"擊敗！」}(無 \"0\")、rm 路徑零碎片零白閃;60fps 無掉幀(59.9)、粒子池峰值 71 有界;快取 627→628"
    ]
  },
  {
    v: "v627", title: "世界地圖（TheoTown 等角大地圖）正式移除 — 回歸單頁村莊體驗；每日寶箱遷入主頁村莊框右下角，公式/存檔欄位逐字沿用（使用者指定）",
    notes: [
      "移除：js/ui/map.js（3305 行等角大地圖：地形/迷霧/小地圖/解鎖慶祝/模式地標/野生魔物賞金/農田點收）、js/data/art/buildings_iso.js 與 tt_demo.js（地圖專用等角資產）、tools/gen-iso-art.cjs（其生成器）、頂欄地圖鈕、教學第 7 步「探索世界地圖」（舊檔 tutorial≥6 直接視為完成，無卡步）",
      "不受影響（全部另有入口，無功能孤兒）：10 個模式入口全部在「更多」頁（競技場/王者/秘境/世界首領/元素塔/迷宮/公會/活動/深淵/遠征營）；區域切換用副本頁的區域 chips＋最佳練功點；圖鑑一鍵前往（gotoMonster）保留；流浪英雄招募在英雄頁流浪區",
      "遷入：每日寶箱（v296）由地圖搬到主頁村莊框右下角 — 44px 觸控目標＋呼吸金光，點擊開箱；獎勵公式（金幣 1000×1.35^(kl-1)＋素材 ×4＋15% 鑽石 ×5）與 FNV 日種子逐字沿用，存檔欄位 st.mapChest 不變 — 舊檔今天已開過箱的狀態直接保留，午夜照常重置",
      "隨地圖退役的小功能：地標旁野生魔物賞金（60s 彩蛋）、農田點收小額金幣 — 皆為地圖專屬點綴，核心迴圈零依賴；品質迴圈同步移除 TheoTown 世界地圖軌道，村莊框美術由「村莊與王國美術」軌道持續迭代",
      "快取 626→627"
    ]
  },
  {
    v: "v626", title: "怪物攻擊前搖警示「!」可讀性修復 — 繪序移到血條/名字/機制標記之後（ v549 原被整個蓋掉、結構性 0% 可見）＋錨點上移到名字上方淨空帶＋reducedMotion 恆亮紅色靜態顯示，「誰要打我」1 秒讀懂（戰鬥畫面美術優化）",
    notes: [
      "診斷(progress/round-17-plan.md,證據強,三方互證):v549 前搖「!」fillText 繪於血條/名字之前 → 整個被蓋掉,且錨點 y=my-mh-8 與血條帶/名字天然全重疊;合成探針預期帶僅 4px 金色殘渣,實戰 2/2 幀無感嘆號;reducedMotion 玩家連抖動都被 !view.rm 閘死,完全沒有攻擊預告",
      "實作(js/ui/render.js drawBattle 怪物段,純繪序/座標/條件):①windup 判斷解閘 rm(抖動位移 wdX/wdY 仍 rm 定幀);②「!」繪製塊整段搬到名字與機制 chip 之後(怪物帶最頂層);③錨點 my-mh-8 → by-20(名字上方淨空帶);④rm 下 blink 恆真 → 恆紅 #ff5c5c 不閃爍(沿用護盾罩/瀕死血條 rm 恆亮先例);字級/描邊/顏色/其他繪序零變動",
      "驗證與留存理由見 progress/improvement-log.md v626 條目;像素斷言:普怪「!」帶紅色族 4→18 px(含描邊 51 px 印記,Boss 20+42=62)、非 windup 幀新舊碼逐像素一致(0 diff)、rm 同 t 差分 bbox 恰為「!」字形(61px@[315,127-319,139])且跨相位紅色 18/18 恆亮;實戰冰川狼/護盾 Boss 4× 截圖「!」清楚立於名字上方;風險與回滾:純演出繪序調整,零數值/零互動/零存檔變動,git revert 本輪 commit 即完整還原;快取 625→626"
    ]
  },
  {
    v: "v625", title: "夜村火把暖光修復 — 光池錨點對齊火焰（ castle x98→54 / guild x172→150 ）、光池強度拉到實際可見（alpha 0.10→0.24＋柔化衰減）、火焰 2×2 放大為 3×5 成形火舌（金黃熱核＋橘邊＋1px 擺動＋焰下微光暈）,交付「村莊入夜會亮燈」（村莊與王國美術優化）",
    notes: [
      "診斷(progress/round-16-plan.md,證據強,三方互證):火焰僅 2×2 px 且光池池內外亮度差 Δlum≈0.9/255 接近不可感知;光池錨點(x=98/172)與火焰錨點(x=54/150)分離 44/22 px — 火焰不在自己的光池上;4× 放大判讀原文「找不到明確的火焰像素團;地面看不出暖色光暈…整區仍是冷藍夜調」",
      "實作(js/ui/render.js drawTown 暖光池段＋js/ui/kingdom.js drawTownLife 火把段):①錨點單一化 — 以火焰 x 為權威(54/150),光池 x 對齊並加雙邊交叉註解;②光池強化 — radialGradient 內圈 alpha 0.10→0.24＋0.55 中段 stop 柔化衰減、半徑 18→22,底緣硬限 y≤gndY+26 不滲入溪流帶;③火焰成形 — 2×2 → 約 3×5 火舌(底 3 寬橘邊包金黃熱核／中 2 寬／頂 1 尖,沿用既有 #ff7a2a/#ffd166 兩色)＋1px 水平擺動(sin 時基)＋焰下小光暈;reducedMotion 恆亮定幀不擺動;全程序時基零 Math.random",
      "驗證與留存理由見 progress/improvement-log.md v625 條目;像素斷言:光池中心 vs 池外 22px Δlum 0→26.8/31.5(≥8 達標)且轉暖(R>B)、火焰亮像素(lum≥180)0-2→9/10(≥8 達標)、溪流帶零染色;rm 火把帶 6 窗全定幀、非 rm 閃爍活著;風險與回滾:純繪製常數/小段改動,git revert 本輪 commit 即完整還原,零座標契約(CELLS/名牌/熱區/鎖定遮罩)變更、無存檔 schema/數值/隨機性;快取 624→625"
    ]
  },
  {
    v: "v624", title: "建築金幣成本 Lv13+ 二次解凍 — 阻尼段由 ×1.35/級改 ×1.20/級＋指數段封頂 30 級＋線性尾,消除 kl20+「單級 7.5-33.6 天」成長牆,王國經營主迴圈後期重新每日有進度（遊戲數值平衡）",
    notes: [
      "診斷(progress/round-15-evidence.md 候選1,證據強):damp() Lv13+ 的 ×1.35(v553 為壓低 Lv13-20 加裝的減速器)在 Lv25-40 區間複利 ×222,遠超近似線性的收入成長(r9→r10 僅 ×1.12)— 模擬(r10 收入 524萬/h,已含王城加成+專注底 1.2):castle Lv30 29.7h / training Lv30 49.4h / library Lv30 222.7h(9.3天) / altar Lv25 180h(7.5天) / altar Lv30 806.9h(33.6天) / castle Lv60 深尾 10046 天;UI 實錘:王城 28→29 顯示 1.15億,與 damp(200,2.1,29) 逐位一致(截圖 round-15-buildings-wall.webp)",
      "實作(js/data/buildings.js 唯一數值改動檔,模組私有 damp()):Lv13+ 每級 ×1.20,指數段封頂 30 級(Lv42 後不再複利),之後線性尾 ×(1+0.3×超出級數) 防 castle max60/warehouse max50 深尾再爆表;Lv≤12 段、素材成本(線性 ×lvl)、各建築 base/mul、效果公式、max 等級一律不動;DESIGN.md §12 建築曲線註記同步更新",
      "驗證與留存理由見 progress/improvement-log.md v624 條目;模擬前後對照:castle Lv30 29.7h→3.6h、training Lv30 49.4h→5.9h、library Lv30 9.3天→1.1天、altar Lv25 7.5天→1.6天、altar Lv30 33.6天→4.0天、castle Lv60 10046天→8.5天;Lv≤12 逐位元一致零回歸、全曲線嚴格單調無倒掛、中期不瑣碎化(castle Lv16@r5=1.9h ≥1h);風險與回滾:單函式常數改動,git revert 本輪 commit 即完整還原,無存檔遷移無 UI 結構無隨機性;backlog 推進:P1「中後期收入 vs 成本曲線模擬驗證」之建築段子項(強化≈免費的反向面留後續輪);快取 623→624"
    ]
  },
  {
    v: "v623", title: "南廣場集市 3 攤全重繪 — 條紋遮陽棚＋受光木櫃台＋糖果色貨物＋貼地柔影,Soul's Remnant 可愛糖果格律落地,消滅「紅平條＋棕盒」占位感（TheoTown 世界地圖・村莊生活感與街道）",
    notes: [
      "診斷(progress/round-14-evidence.md 候選2,證據強):三攤為 v292 平塗占位物 — 單條 2px 紅平條棚頂＋深棕櫃台盒＋3×3 貨物色點,無棚紋/無側面明暗/無貼地影;單攤 unique 4-bit 色階僅 22(v579 已達標燈柱基準 57);櫃台 #4a3520 明度 ≈21.9% 低於暗部 35% 地板;與旁邊已達標燈柱同框形成同街品質斷層,每日開圖重複暴露「這村子沒做完」",
      "實作(js/ui/map.js drawVillage 內 stalls 迴圈單段重繪,錨點/繪序零變動):每攤 6 層 — ①貼地柔影 rgba(74,54,44,0.30) 菱形(暖色,禁純黑禁深綠);②棚柱×2 受光面 #c8915c＋右暗面 #a06a40;③木櫃台 5 面 — 頂/左緣受光 #e8b478、正面 #c8915c、右暗 #a06a40、底緣柔色染色輪廓 #8a5630(G3 非黑)＋正面 R6 同色系雜訊;④貨物×2 — 固定檸檬箱 #ffd166/#e0a94a＋依攤位索引確定性輪換莓紅/薄荷/天空藍(各深階底列＋左上單 1px 高光,G6);⑤條紋棚頂 2px 直條交替 #ff7a6a/#e0574b 七條＋脊線單高光 #ffa08e＋下緣扇貝波浪檐;⑥棚面 R6 雜訊;全部色彩明度 ≥35%(G2)、左上受光(G5)、零純黑(G3)、全 seeded 確定性零 Math.random",
      "驗證與留存理由見 progress/improvement-log.md v623 條目;風險與回滾:純美術資產級單段改動＋changelog＋index,零錨點/熱區/名牌/存檔 schema/數值/隨機性變動,git revert 本輪 commit 即完整還原;backlog 打勾:P0「村莊生活感(攤位精緻化/更多村民/商店招牌)」之攤位子項;快取 622→623"
    ]
  },
  {
    v: "v622", title: "建築升級缺料可視化 — 建築卡缺料時直接紅字列出逐項「缺 N（持 M）」＋缺料素材取得來源行，詳情彈窗升級鈕的失敗提示從籠統「資源不足」升級為帶缺額明細，消滅「按了沒反應的死按鈕」（QoL 與 UX）",
    notes: [
      "診斷（progress/round-13-evidence.md 候選1，證據強）：建築頁資源不足時「升級」鈕 disabled 且點擊 700ms 內零 toast/零 modal（DOM 實錘靜默死按鈕）；卡片只列成本不顯示持有/缺額，唯一說明鎖在 title tooltip（行動端無 hover＝零資訊）；截圖 round-13-buildings-disabled.webp 判讀「升級鈕暗色與未解鎖 chips 同階，卡片無任何持有/缺額數字」；對照同遊戲英雄突破 v231 已有紅字「缺6（持 34）」模式 — 玩家在一處學會的閱讀習慣在另一處落空",
      "實作（js/ui/kingdom.js 唯一邏輯檔，純互動層）：新增模組內輔助 missingParts(cost)（金幣＋逐素材「缺 X（持 Y）」字串陣列，數字一律 MG.util.fmt，語彙逐字對齊 hunters.js v231）＋ missingMatSrc(cost)（缺項素材的 MATS[m].src 取得來源）；buildingCard 在成本列之後、!locked && !maxed && !afford 時插紅字「不足：…」行（fontSize 10 #ff9c9c）與 dim「取得：…」來源行（fontSize 9 var(--dim2)）；buy() 失敗分支 toast 升級為「資源不足：缺項前 2 項…」（服務 openDetail modal 的不 disabled 升級/建造鈕）；按鈕 disabled 契約不動（防誤點由 disabled 把關、原因由可見文字承擔，與突破鈕同契約）；零數值曲線/零存檔 schema/零新增隨機性/不碰繪製層",
      "驗證（協議 a-f 全通過）：a)node --check js/ui/kingdom.js、js/data/changelog.js 通過；b)互動斷言（spawned Chromium headless=new 未加 --disable-gpu，行動 390×844＋桌機 1280×800，注入存檔金幣 300 < 王城大廳 Lv2 所需 420）：①缺料卡 0 次點擊即見紅字含「缺 120」與「持 300」，含素材缺口的卡有「取得：」行含 MATS src 片段；②夠料的卡無紅字行（不誤報）；③locked 與 maxed 卡渲染與改前一致；④openDetail 升級鈕 1 次點擊得帶「缺」明細 toast，夠料時 buy() 成功路徑（升級/toast/flashCard）不變；⑤舊存檔邊界 st.mats[m] undefined → 持 0 不爆錯；c)回歸：核心流程（王國→副本→英雄→裝備→建築→更多→世界地圖→回城待機）雙視口每步 console 零 error/unhandledrejection；d)實機：雙視口 reload＋soak 零 console error、reducedMotion 路徑通過；e)截圖 progress/（命名含 v622，before/after）；f)審美閘門：harness 影像工具判讀紅字行可讀、與成本列層級分明、390px 不溢出",
      "留存理由：建築升級是王國經營主迴圈，所有玩家從新手期起每日數次撞到缺料；現況缺料＝靜默死按鈕，玩家不知道缺什麼、缺多少、去哪打 — 每次卡點都是一次無指引的困惑，直接打斷「升建築→王國變強」的成長快感；補上後卡點變成具體目標（「再打一顆鐵礦石就能升倉庫」），目標感是放置遊戲下一局/下一掛的最直接驅動；且介面語言與突破缺額一致，一處學會全場通用；風險與回滾：missingParts 為純讀取組字串成本可忽略；390px 折行由 fontSize 9/10＋lineHeight 1.5 控制＋審美閘門把關；本輪只加純文字來源指引不做跳轉（雙向跳轉留後續輪）；git revert 本輪 commit 即完整還原（kingdom.js＋changelog＋index，無遷移無殘留）；backlog 打勾：P1「空狀態與缺料提示（缺素材 → 標示取得來源）」；快取 621→622"
    ]
  },
  {
    v: "v590", title: "投射物殘影拖尾 — 火球/箭/匕首飛行加 4 層確定性殘影（由尾到頭漸大漸實），一次施法從「出現一顆球」變「打出去一道火」，讀出動量與方向，消除「純色橘球漂浮」感（戰鬥畫面美術優化）",
    notes: [
      "診斷（progress/round-12-evidence.md 候選1，★最強，代碼＋視覺雙重印證）：4× 放大視覺判讀原文「They read as static single-frame blobs. I do _not_ see comet trails, afterimages, motion streaks, or additive glow」「fireballs lack trail/glow/comet tail/impact anticipation」；代碼根因 js/ui/render.js 投射物僅單一 sprite `draw(ctx,p.sprite,p.x,p.y,1,{scale:1.5,t:view.t})` 無殘影系統；fx_fireball 內建尾幀僅 3 像素（scale 1.5 後 ≈4.5px）肉眼不可見；像素採樣橘帶 462px 無向飛行方向漸弱之梯度帶",
      "實作（js/ui/render.js drawBattle 投射物迴圈唯一邏輯改動＋模組級 const）：主 sprite 繪製前依序由尾(k=4)到頭(k=1)畫 4 層殘影 — 時間步長 Δ=0.03s 取 `u_k=(p.t - k*0.03)/p.dur`（u_k≤0 跳過，剛出手不出殘影）；位置複用 hunt.js:624-625 同一插值（含拋物弧 `-Math.sin(u*π)*14`，程式碼雙向註記與 hunt.js 耦合）；樣式查表 GS=[0,1.35,1.15,0.95,0.75]（索引=k）/GA=[0,0.30,0.20,0.11,0.05]，呼叫既有 draw 的 scale/alpha 選項（粒子池同機制，無新機制）；主 sprite 維持 scale 1.5 全 alpha 壓頂；全部投射物（火球/箭/匕首）統一同一路徑；無 Math.random、無每幀陣列配置（GS/GA 模組級 const，殘影僅 4 次 draw 呼叫/投射物）；rm 下殘影為 p.t 確定性函數照畫，同 screenT 雙幀哈希仍相等",
      "驗證（協議 a-f 全通過）:a)node --check js/ui/render.js、js/data/changelog.js 通過;b)邏輯（spawned Chromium headless=new 未加 --disable-gpu，注入 dev 存檔派遣實戰，rAF stub 控幀）：投射物飛行中幀橘色系像素（R>190 & 80<G<190 & B<110，含 alpha 混合後色階）總量較改前 ≥+25%，且自球頭向飛行反方向 3 個 20px 連續窗口橘像素呈遞減梯度（頭側 > 中 > 尾側，各窗>0）；三職業投射物（弓手箭/法師火球/刺客匕首）各觸發一次拖尾齊出零爆錯；rm 定幀：reducedMotion=true 同 screenT 雙幀整畫布哈希 diff=0 且投射物主體仍繪出；擊殺/滅團/首領機制路徑照常;c)回歸：核心流程（王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口→回城待機）雙視口每步 console 零 error/unhandledrejection;d)實機：桌機 1280×800＋行動 390×844 DPR2 reload＋soak 零 console error；無新增每幀配置（殘影僅 4 次 draw/投射物，同時在飛投射物個位數，draw call 封頂）；e)截圖 progress/（含 v590 命名 —— 改前 4× 基準＋改後 4× 放大＋改前後並排＋火球連發逐幀 ≥2 幀）;f)視覺審美閘門（harness 影像工具，未用 tools/vision-review.mjs）：4× 判讀改後必須讀出「comet trail/afterimage/motion 方向感」且「不遮掩怪物名牌/血條要害」；與改前並排對照成立",
      "留存理由:放置玩家最長時間盯的就是 480×270 戰鬥畫布，而投射物是畫面上唯一持續大幅移動的元素 — 每一波法師/弓手連發都在重複暴露「無拖尾、無光暈的貼圖平移」，把「在看一場小電影」的掛機觀賞承諾打成「看貼圖滑動」；拖尾是 juice 裡 CP 值最高的一筆：一次施法從「出現一顆球」變成「打出去一道火」，動量感與命中預期讓玩家願意把戰鬥畫面留在前景多看幾眼，直接支撐長掛在線時長;風險與回滾：唯一耦合風險為弧常數 14 與 hunt.js:625 重複（程式碼雙向註記，本輪不動 hunt.js）；連發場景殘影堆疊以尾層 alpha 僅 0.05-0.30 且由尾到頭遞增、主體全 alpha 壓頂防護（視覺閘門把關）；零數值公式/零存檔 schema/零新增隨機性/零座標命中判定變動；殘影在怪物反方向延伸不遮血條名牌；git revert 本輪 commit 即完整還原（render.js 一段＋changelog＋index，無遷移無殘留）;backlog 打勾：P1「技能特效質感（火球拖尾…）」;快取 619→620"
    ]
  },
  {
    v: "v589", title: "狩獵頁回城休息/待機城內場景補上英雄隊伍 — 滅團回村與未派遣待機時,改以名冊編隊（formation×hunters,與 battle 同源 classes[cls].icon）繪製休息英雄＋頭頂 💤＋眨眼下,修復「家無人住」的空城,每次回城都看得到我的英雄在村裡休息（村莊與王國美術優化）",
    notes: [
      "診斷（progress/round-11-evidence.md 候選1，★最強三證合一）：執行期探針 {phase:teamLen,teamLen:0,disp:0} 證明休息態 F.team 必空 → drawTownScene（hunt.js 城內場景段）的 `for (const h of view.team)`（含 v568 眨眼與 💤）是死迴圈；源碼逐字 teamView() 只讀 MG.sys.battle.get().team（戰後即空），hunt.js L1431-1432 自承「休息中 F.team 亦為空」；6× 裁切視覺判讀「下半畫布無可辨認英雄隊伍、無 💤」— 玩家編好隊伍在「回家」這一幕消失，直接抵消 v284/v320/v326/v327 生活感與 v568 眨眼的投資",
      "實作（js/ui/hunt.js drawTownScene 內單函式資料來源替換，純繪製層，零數值/零存檔 schema/零新增隨機性）：英雄來源自 `view.team`（在戰隊,休息態必空）改為名冊編隊 — `S().formation.map(id→hunters.find).filter(Boolean).map(h→{sprite:classes[h.cls].icon, flip:true, seed:i*1.7}).filter(sprite)`；sprite 契約與 battle.js teamBuild 同源（classes[cls].icon）；站位/繪製公式完全保留既有（tx=W/2+(i-(n-1)/2)*52、ty=H-34-30=206、bob=sin(screenT*3+i*1.7)*1.2、scale2 frame0、眨眼 if(!rm) drawBlink、💤 #9db4ff bold11 at tx+15,ty-6）；兩觸發路徑（retreatLeft>0 回村休息＋idle 未派遣待機）同函式同源通用；編隊空 → 空城＋既有 coach「出戰隊尚未編入英雄」＋「+前往編隊」格位；不動 teamView()/TEAM_POS/drawBattle/休息倒數橫幅",
      "驗證（協議 a-f 全通過；spawned Chromium headless=new 未加 --disable-gpu，rAF stub 控制同幀確定性）:a)node --check js/ui/hunt.js、js/data/changelog.js 通過;b)邏輯（480×270 邏輯空間 pixel 斷言，桌面 1280×800＋行動 390×844 DPR2）— ①待機態（F.team=0/disp=0）名冊 5 名英雄各中心區 heroPx 396-542（vs 編隊清空基準，明顯差值證英雄在繪），💤 藍族 #9db4ff 每名 15px（基準 0）；②休息態（retreatLeft>0）heroPx 375-518＋💤 15px＋休息橫幅綠 #7ee787 1625px；③rm 定幀：reducedMotion 下同 screenT 雙幀整畫布哈希 2341480247==2341480247 diff=0，且 heroPresentUnderRm 9920px（rm 下英雄仍繪出、眨眼 if(!rm) 閘保留不覆繪）；④派遣回歸：battle.start() 後 phase=fight、team 渲染於 TEAM_POS（各區亮像素 1684-2016，teamView 未動）— 註：測試種子 id 0 因遊戲既有 `id&&` falsy 過濾不派遣（真實英雄 id 非零），列陣 4 人係測試資料特性非回歸；⑤全新/空編隊：coach「出戰隊尚未編入英雄」＋「前往編隊」格位照常、零爆錯;c)回歸（核心流程 王國→副本（待機→派遣→回城）→英雄→裝備→建築→更多→世界地圖(show('map')＋標題)→回王國→回城待機，全螢幕 DOM 走訪）：零 console error/unhandledrejection；回城待機英雄區 8 色於中心列現正/回歸後 heroPx 正常;d)實機：桌機 1280×800＋行動 390×844 DPR2 雙視口 reload＋soak 零 console error（mobile reload errs=0）；e)截圖 progress/round-11-v589-hunt-rest-after-{1x,6x,scene2x}.png、round-11-v589-mobile-idle.png、round-11-v589-desktop-regress.png、round-11-v589-dispatched-battle.png（皆含 vN）;f)視覺審美閘門（harness inspect_image，全程可用未降級，未用 tools/vision-review.mjs）：after-6x（與取證 before 同構圖）「5 名可辨認英雄站於村莊地面、頭頂 💤、腳貼地線、無漂浮/裁切/嚴重重疊」PASS；與 before-6x「無可辨認英雄、無 💤、讀作空城」並排對照—「空城→有人」的回家畫面落地；2× 全場景較軟註記（💤 散佈感/英雄貼建築基座/DOM 標籤疊）皆屬既有「前景蓋建築」構圖＋頁面平滑文字疊加，非本輪缺陷（站位公式保留既有）",
      "留存理由:放置玩家每日多次「滅團回村休息」與「未派遣待機」,這正是「村莊=家」情感承兌的第一面;現況休息態永遠是空城,玩家編好的隊伍在「回家」這一幕消失,直接抵消前幾輪堆疊的生活感與眨眼投資 — 補上後每次回城都看到「我的英雄在村裡休息眨眼」,讓「回家看看」成為回訪慾望而不是空洞巡視,把放置迴圈的高頻畫面變成情感連結的落點",
      "（v589修正）💤 疊印建築名牌修正:原繪於 head 上方 `tx+15,ty-6`(y≈200),與遠排建築名稱標籤帶(drawTown 名牌 baseline≈198・文字帶 y188-198:酒館/訓練場/裝備商店/寶石工坊)互相疊印致標籤不可讀 → 改置頭頂正上方 `tx+16,ty-26`(z 字形帶 y168-180),完全移出名牌文字帶(名牌帶零 Z 像素,zpxLabel=0),且仍每名英雄各自一格 Z（5 列 x=152/204/256/308/360 與 5 名英雄頭中心對齊）;站位公式/眨眼閘/TEAM_POS/熱區一律不動;實測休息態名冊 5 名 heroPx 375-447＋每名 Z 51px（名牌帶 0）＋行動視口休整態無遮罩可見英雄+💤＋派遣回歸 phase=fight 列陣正常,全場 console 0 error;快取維持 619(修正輪不加版本號)"
    ]
  },
  {
    v: "v588", title: "修復離線 1.2× vs 在線專注逐時累層的 12h 內倒掛 — 在線專注倍率改以 OFFLINE_RATE 為底（層 0 即 ×1.20 與離線即時齊平）+ 每層 +5% 疊加（滿層 ×1.40 超越），落實 v234「線上齊平並超越、純 buff 零 nerf」既定設計意圖（遊戲數值平衡）",
    notes: [
      "診斷（progress/round-10-evidence.md 候選1，公式逐字重算，強證）：ACTIVE_FOCUS{perHour:0.05,max:4} 逐時累層（自 1.0 起爬、0→4h 才到 1.20×）vs OFFLINE_RATE=1.2 即時常數 — 兩者封頂值相同但累進曲線不同 → 封頂前全程離線領先。積分法（在線=∫(1+0.05·層) vs 離線=1.2·min(H,12)）重算：2h 離線/在線 = 2.40/2.05 = 1.171、8h 9.60/9.10 = 1.055、12h 14.40/13.90 = 1.036，13h 才反超 — 「開著遊戲比關著少賺 3.6-17.1%」系統性驅逐在線玩家；v234 註記（config.js 21-22）只比對封頂層末值未比對積分，故未察覺",
      "實作（引擎數值 3 處同源公式＋顯示同步＋註記，存檔 schema 零變動）：①js/sys/battle.js rates() — focusMul 由 `1 + perHour*focusLayers()` 改為 `MG.config.OFFLINE_RATE + perHour*focusLayers()`；②js/sys/loot.js 金幣與經驗兩處同式（實際擊殺掉落同步）；③js/ui/hunt.js 離線預覽列顯示改為以 OFFLINE_RATE 為底（層 0 派遣中即顯示「🔥 在線專注 ×1.20(0/4h)」）— 防 UI 謊報倍率；④js/core/config.js 註記更新（數值 OFFLINE_RATE/ACTIVE_FOCUS 不動）。直接引用 OFFLINE_RATE 常數 → 日後調離線率時在線基底自動跟隨，「齊平」為結構性耦合非巧合；離線結算走 rates({noFocus:true})（battle.js:762 分支排除專注）× OFFLINE_RATE，本方案不觸碰該路徑 — 離線收益逐分不變，純 buff 不變式成立；perHour/max/gapMs 常數全不動，斷線重置/時鐘回撥 clamp(v234FIX)/未派遣不累層守衛全部保留",
      "驗證（協議 a-f 全通過）:a)node --check js/sys/battle.js、js/sys/loot.js、js/ui/hunt.js、js/core/config.js 全通過;b)數值（同一支確定性積分模擬，改動前後對照，網頁實測 rates() mul 交叉驗證）：改前重現倒掛 — 2h 離線/在線 1.171、8h 1.055、12h 1.036（與證據包數字一致）；改後每個 H 在線/離線 ≥1.00 — 2h = 2.450/2.400 = 1.021、8h = 10.700/9.600 = 1.115、12h = 16.300/14.400 = 1.132、13h = 1.229、24h = 2.299、72h = 6.965，且離線欄數字與改前逐分相同;觸發路徑實測（spawned Chromium 注入存檔）：派遣中層 0 rates().parts「在線專注 ×0 mul=1.2」、層 4「×4 mul=1.4」、層4/層0金秒比 = 1.4/1.2 = 1.1667 精確；loot.rollKill 金/經兩處實擊殺含新倍率不爆錯；rates({noFocus:true}) 與 previewOffline()/offline() 輸出與改前逐分相同（層 4 時離線金/時 12505.5 = noFocus×1.2 精確 — 離線零變動斷言成立）；focusLayers() 斷線>gapMs 重置、層0 起即 ×1.20 不爆錯;WEEKEND_MULT 疊乘順序不變;c)回歸：核心流程（王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口→回城待機）雙視口每步 console 零 error/unhandledrejection；hunt 顯示列層2「×1.30(2/4h)」正確;d)實機：spawned Chromium（未加 --disable-gpu）1280×800＋390×844 DPR2 整頁 reload 零 console error；reducedMotion=true 路徑層2 顯示正確、零錯誤;e)截圖 progress/v588-hunt-layer0.png、v588-desktop-regress.png、v588-mobile-regress.png（皆含 vN）;f)存檔相容：缺 focusStreak 的舊存檔（v587 前 schema）normalize 後 focusLayers 回 0、倍率 ×1.20、零爆錯；無任何 schema 新增",
      "留存理由:放置遊戲的核心承諾是「開著遊戲不會吃虧」。現況倒掛讓理性玩家學到「關掉遊戲賺更多」— 2h 掛機開著比關著少 17.1%、8h 少 5.5%，等於系統性地驅逐在線玩家，每次發現「我掛著反而虧」都是對登入動機的直接侵蝕；修復後在線在任何 ≤12h 維度都 ≥ 離線、且 4h 後以 1.40× 明確超越，「讓遊戲開著」從吃虧變成正確決策，專注累層從「看得到吃不到」變成即時可感的在線獎勵，直接支撐軌道終極目標的 2h/8h 掛機維度不倒掛;風險與回滾：在線金/經/掉落 +20% 基底（滿層 +40%）為「把在線拉回與離線同一起跑線」非新增通膨 — 純離線玩家日收益上限不變，在線只是不再被懲罰，所有成本/收入相對曲線形狀不變（無單點爆表方向）；git revert 本輪 commit 即完整還原（公式 3 處＋顯示 1 處＋註記＋changelog/index，無遷移無殘留，focusStreak 語義不變）；backlog 打勾：P1「離線收益 1.2× vs 在線 ACTIVE_FOCUS 長掛效率對比（倒掛檢查）」;快取 617→618"
    ]
  },
  {
    v: "v587", title: "模式地標精緻化補完 — 競技場/王者競技場/試煉秘境/奇境迷宮/公會盛宴/限時活動 6 座全重繪至 TheoTown 3 部件文法，消除與 v578 已重繪 4 座及區域地標的 4/10 品質斷層（TheoTown 建築與地標）",
    notes: [
      "診斷（progress/round-9-evidence.md 候選1，證據強）：v578「模式地標精緻化」只重繪 4 座（tower/bone/stairs/camp，map.js 帶 v578 註記），其餘 6 座保留 v562 舊幾何 — 源碼分界明確；vision 逐座判讀 arena「flat, low, partially buried ground patch」、dungeon「low, vague blue-gray slab」、maze「flat/low/ambiguous garden-plot blob」；像素樣本（世界 map canvas 32×32 bbox unique 4-bit 色階）風車 66 為達標基準，6 座僅 arena 37/dungeon 26/maze 48（dungeon 全族最低），maze nearBlack 23.4%（花圃色塊）；1×-2× 真實觀賞尺寸下與身旁風車/v578 已達標並排即破綻，每天第一眼掃圖動線上的每日儀式報到站（競技場/秘境/公會/活動）半成品把「世界內容密度」預期下修",
      "實作（js/ui/map.js 純繪製層單檔＋changelog/index，零數值/零存檔 schema/零新增隨機性，全靜態確定性繪製，動畫沿用既有 MODE_FX）：①mdRing 競技場 — 加 2 階石基台（底台+上台階+前階）、石環鬥牆 30×7→加高 8 並左受光/右陰影/底漸暗＋2 座拱形門洞（深內口 #5a4a3a 非純黑）、內場沙地＋中央決鬥圈（金圈+紅線+金心）、四角立柱加柱頭受光、兩側紅旗與中央旗柱加高（頂不高於舊 -22 之上 8px 契約）；②mdPodium 王者競技場 — 三層石台每層左上受光/右下暗/層間 AO＋勝利柱柱身分面＋拱頂金飾帶與中央盾形紋章＋前階梯 3 階踏面高光；③mdStele 試煉秘境 — 主碑加寬至 14＋右後副碑（8×14）雙碑構圖、碑面符文 ×5 雙色帶高光、三層階式碑冠（寬→中→窄）左亮右暗、側火把石墩＋雙層火焰；④mdHedge 奇境迷宮 — 籬色提亮一階（外籬 #3a6a35，底暗 ≥#2a5228 離近黑）、層級籬牆迷宮（曲折路徑感）、石拱門加高至 ay-15＋拱頂石＋落地斜影、金燈呼吸 fx、籬床淺綠底座＋柔和深綠落地斜影分隔枯草農地、紫藍寶石/藍花/莓果飾；⑤mdHall 公會盛宴 — 茅草頂橫向草束排紋＋棚柱石墩＋桌布垂面＋6 碟雙色佳餚＋兩側酒桶＋落地斜影；⑥mdNotice 限時活動 — 木紋看板＋告示×4（撕角亮＋金圖釘）＋條紋棚頂受光/棚下陰影帶＋支柱頭/腳石墩＋頂飾金旗＋棚緣彩旗串並重錨金紙 fx；及 LM_ART 包覆盒同步更新（arena 40×32/royal 34×32/dungeon 30×38/maze 30×16/guild 40×44/events 32×32）與 MODE_FX 對應重錨（fxArenaFlag 扭 py-27/fxCrown py-27/fxRune 符文列/fxHedgeLight 燈 py-6）；錨點 ax/ay、名牌/熱區/縮放/門檻語義零變動",
      "驗證（協議 a-f 全通過）：a)node --check js/ui/map.js、js/data/changelog.js 通過；b)像素斷言（世界 map canvas 2× 烘焙，tight 地標 bbox，unique 4-bit 色階）：改前 arena 35/royal 28/dungeon 22/maze 27/guild 43/events 29 → 改後 arena 51/royal 47/dungeon 61/maze 62/guild 51/events 47（風車同法 64 為基準，6 座全追上/部分超越）；nearBlack 全 <5%（maze 2.5%、arena 3.8% 為背景地形非地標）；R3 黑輪廓：6 座 clip 純黑 #000/#101018/#14161f 像素 0；c)回歸：核心流程（王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口→回城）雙視口每步 console 零 error/unhandledrejection；d)實機：桌面 1280×800＋手機 390×844 DPR2（spawned Chromium 未加 --disable-gpu）整頁 reload＋soak 零 console error；reducedMotion=true 6 座 MODE_FX 錨點 fx 區雙幀像素 diff=0（靜止幀正確）；e)截圖 progress/v587-landmarks-before-5x.png（改前）/v587-landmarks-after-5x.png（改後 5× 並排各 6 座）＋v587-windmill-reference.png＋v587-mode-band-insitu.png（真實地圖視口帶）＋v587-lock-royal/maze.png；f)視覺審美閘門（harness inspect_image，全程可用未降級，未用 tools/vision-review.mjs）：改後 5× 並排 6 座判「3+ 部件（石台/柱/拱梁/屋頂/旗/燈 all present）、左上受光/右下暗、紋理非平塗、無黑輪廓」— royal/events 全 Pass，arena/dungeon/guild 物體逐件 read 成立，唯 maze 屬低矮籬結構（vision 建議提高拱門+落地影，本輪已作 2 次迭代：石拱門加高至 ay-15＋金頂球＋層級籬牆＋深綠落地斜影，distinct 27→62），與風車/區域地標同文法家族；殘留批判為「低矮迷宮本體剪影自然弱＋競技場後方為既有暗色地形邊界（主題 3 地形/環境範圍，本輪禁動）」— 非本輪地標缺陷，列入觀察",
      "留存理由:世界地圖是每日回訪錨點，模式入口（競技場/試煉秘境/公會/限時活動等）是「每日儀式報到點」— 玩家每天開圖第一件事就是掃東側草原帶找競技場/秘境/公會/活動；現況 10 座裡 6 座是 v562 舊幾何（競技場主體僅 ~10px 高讀成「半埋的平地殘跡」、試煉秘境色階全族最低讀成「模糊藍灰板」、迷宮近黑 23.4% 讀成「花圃色塊」），每天第一眼掃圖動線上 6 座半成品把「這個世界還有多少內容」的預期下修；補齊後整帶 10 座同一 TheoTown 文法（多部件/左亮右暗/深綠貼地/無黑輪廓），每日報到路線每一站都是立體地標，掃圖=重新確認世界豐滿度的正向回饋，支撐每日回訪習慣；純繪製層單檔（map.js）＋changelog/index，git revert 本輪 commit 即完整還原；backlog 註記：P0「模式地標精緻化」已於 v578 打勾，本輪為其補完剩餘 6 座；快取 616→617"
    ]
  },
  {
    v: "v586", title: "點按目標 ≥44px 契約地板 — 6 主畫面 168 枚互動目標全部補到 ≥44px：派遣/自動續戰/自動進關/靈藥/一鍵例行/一鍵領取/篩選/分頁/強化作業列（QoL 與 UX）",
    notes: [
      "診斷（progress/round-8-evidence.md 候選1，DOM getBoundingClientRect 390×844 DPR2 實測）：主流畫面（要塞/裝備/英雄/建築）各 13-26 枚高 <44px — 派遣 4 人/自動續戰/自動進關 118×40、靈藥/加速沙漏/補滿/全部啟用 181×34、一鍵例行/一鍵領取全部 26px、每日任務卡 38-41px、篩選 chips 34px、分頁 tab 34px、逐件強化/訓練按鈕 30-40px、建築升級 48×40、階級標籤 40×23、more 排序 55×26 — 全部低於 DESIGN §5「touch targets ≥44px」契約；高頻主路徑（派遣/自動/靈藥/領取）天天點數十至數百次，小目標誤觸率高（26px 一鍵領取緊貼卡片列 → 誤觸領錯），每次縮手瞄準都是摩擦累積",
      "實作（純視覺幾何層，零邏輯/零數值/零存檔/零隨機）：①css/style.css 元件級地板 `.chip{min-height:44px}`＋`.btn.sm{min-height:44px}`（border-box 下內容下置中、文字不截斷；APP 為 max-width:480 固定單欄，桌機同框套用）；②逐畫面 inline 修補固定小目標：hunt.js — ▶/ⓘ 圓鈕 34→44（info 右移避免與 speed 重疊）、展開全部 minHeight 26→44；kingdom.js — 一鍵例行/一鍵領取全部 26→44、每日任務卡 34→44、▶ 批次執行鈕 minWidth/minHeight 44、建築橫幅名牌標 cursor:default（無 handler 純資訊標籤，非觸控目標）；hunters.js — 共鳴槽/自動編隊/自動穿裝/全隊訓練/批量遣散＋多選模式列 28-30→44；equipment.js — ★1-★6 品質 chips 加 minWidth 44；more.js — 排序 ▸ 26→44；全部繁體中文零更動",
      "驗證（協議 a-f）:a)node --check 全改動 JS 通過;b)量測（同 390×844 DPR2 同測試存檔，.tmp/measure2.js 互動目標判定=native control/[onclick]/[role]/tabindex/cursor:pointer）：6 畫面互動目標 <44px 由 100 → 0（hunt/kingdom/hunters/equipment/more/buildings 全 0；168 枚互動目標逐一 ≥44×44）；原始 100 中 14 枚為無 handler 且 cursor:default 的純資訊標籤（建築橫幅名牌×4＋建築卡金階/銀階×10）已證非觸控目標並於報告逐項排除；c)回歸：王國→副本→英雄→裝備→建築→更多→世界地圖→回城 核心流程（390×844＋1280×800 雙視口、reducedMotion on/off 雙路徑）每步 console 零 error/unhandledrejection；改動後實點 一鍵例行/一鍵領取全部/自動分解(modal 開關)/排序 ▸ 全正常；d)實機 spawned Chromium（未加 --disable-gpu）雙視口整頁 reload 零 console error;e)截圖 progress/v586-mobile-{hunt,kingdom,hunters,equipment,more,buildings}.png（after，含對應 before progress/round8-mobile-*.png）與 v586-desktop-{hunt,kingdom,hunters,equipment,more,buildings}.png;f)審美閘門（harness inspect_image，未用 tools/vision-review.mjs）：hunt/kingdom/equipment/hunters/桌機逐張判讀 — 無放大後新增換行破版；唯一 2 行 wrap（產出加成『成』dangle）為證據已證的既有問題非本輪回歸；篩選/分頁/作業列 rows 為既有 overflow-x:auto 橫向捲動（第 N 隊/最右 chip 貼邊屬設計非破版）",
      "留存理由:放置玩家最常做的事就是「掛機回來收菜＋派遣＋強化」;主路徑按鈕（派遣/自動續戰/自動進關/靈藥/一鍵領取/強化作業）全低於觸控最小目標,40px 派遣座落主路徑第一行、26px 一鍵領取緊貼卡片列 — 每次縮手瞄準與誤觸都是摩擦累積,「掛機回來收菜很順」的核心體驗被數十個小目標磨掉;把主路徑按鈕放大到一拇指可盲按（≥44px,Apple/WCAG 行動觸控共識）,「確認我點到了、沒誤觸」的安心感直接延長每一次登入的停留與重覆意願;純 CSS/幾何層,零數值/零存檔/零隨機,git revert 本輪 commit 即完整還原;快取 615→616"
    ]
  },
  {
    v: "v585", title: "傷害浮字可讀性 — 同目標短窗合併＋分道錨點：Boss 不再被數字淹沒（戰鬥畫面美術優化）",
    notes: [
      "診斷（progress/round-7-evidence.md 候選1，證據強）：同屏峰值浮字達 61（證據觀測 14-16，本輪更嚴苛 Lv×200 達 60 上限節流），全部集中在英雄頭頂與怪物本體(x=320)；每擊同時生成英雄側 echo＋怪物側傷害兩枚同值浮字，BOSS 被 -1.23萬/-8787/-1.93萬 等蓋住半身，K3 判「被數字淹沒的紫色方塊」— 掛機觀戰「1 秒讀懂誰打誰」第一要件被破壞",
      "實作（全部演出層，零數值/零座標/零命中判定/零存檔 schema；js/ui/hunt.js + js/ui/render.js）：①浮字攜帶原始值 val；spawnFloat 支援 opt.merge（bucket key）— 同桶現存浮字存活期間累加 val、重置生命、回錨 y0、彈合併脈衝 pop，O(1) 物件查找（floatMerge map，浮字死亡清表）免每幀掃描；②分道：怪物側三水平道 x∈{292,320,352}、錨點帶置於 boss 本體/血條/名字上方淨空區 y≈116-124（浮字上飄不蓋本體）；英雄側垂直道 offset∈{0,-11,-22} round-robin（確定性計數器，禁 Math.random）；③render 依 pop∈[0,1] 字號 ×(1→1.25) 線性回落（合併瞬時放大回饋），並以 prefix+fmt(val) 重組顯示（合併時自動反映累加值）；④桶分色：怪物側 m_hit(白)/m_crit(金，合併仍保留暴擊 pop 脈衝爽感)/m_skill(元素色)/m_dot(紫)/m_heal(綠，boss 再生/吸血)；英雄側 per-hunter mhit(受擊紅)/heal(治療綠)",
      "實測偏離 plan（依證據校正，皆寫入報告）：plan 原列 MERGE_WINDOW=0.25s＋crit 不合併，實測 0.25s 短於攻擊間距導致每擊仍生成新字（peak 61 未降）、crit 單獨成字 flood 淹沒 boss — 改為「合併桶存活期間持續累加成持久計數」＋crit 併入 m_crit 金計數（pop 脈衝保留暴擊跳感）；另移除英雄側逐擊出手 echo（5 英雄縱列 44-160 過窄，放獨力計數互相疊壓；出手由攻擊動作＋怪物側合併計數承載）— 英雄列因此完全露臉",
      "驗證（協議 a-f 全通過）：a)node --check 全 js 通過；b)邏輯（瀏覽器 view 探針，Lv×200 深淵 BOSS）：同幀浮字峰值 61→13、平均 43→9（79%/87% 降）；BOSS 軀幹帶(y>150,x280-360)浮字數歸零（改動前 8+ 枚疊壓）；合併累加正確（m_hit 計數顯示累加值 32057，單擊 -1180 明顯為多擊總和）；c)觸發路徑全跑：普攻 hit/crit、五職業技能、buff/heal 技能名、mhit 受擊紅、dot 毒紫、mheal 再生綠、擊殺金幣/經驗、精英/BOSS 宣告、滅團/再戰，各類浮字仍出現且顏色不串桶（觀測特定異色如 dot #c792ea、mheal #7ee787 逐一命中）；reducedMotion 定幀（零浮字零錯誤，fight 續行）；d)瀏覽器實機（spawned Chromium，未加 --disable-gpu）：全程 console 零 error/unhandledrejection；核心流程（王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口→回城待機）逐屏零錯誤；e)截圖存 progress/（含 4× 放大與 1×）：round7-after-4x-a/b/c.webp、round7-after-1x.webp、round7-band-crop-6x.png、round7-bossbody-crop-6x.png，對照 round7-arrow-dense.png / round7-boss-4x.png（改動前）；f)視覺閘門（harness inspect_image，未用 tools/vision-review.mjs）：4× 判「dragon body visible，不覆蓋傷害數字；傷害計數器置於以其上方天空帶；五英雄可見、身體未被埋葬；無文字疊壓 boss 名/血條或英雄」— 核心 PASS；唯一保留為 4× 下小字數值可讀性（解析度/對比限制，非遮擋問題），以像素取樣（計數帶 968 亮像素、boss 帶潔淨）＋探針計數斷言補足",
      "留存理由:放置玩家絕大多數在線時間盯著戰鬥畫面,「1 秒讀懂誰在打誰、輸出多少」是觀戰滿足第一要件;現況同屏 14-61 枚同字號多色浮字互相遮蔽、辛苦堆出的大數字從成就回饋變雜訊、boss 被數字淹沒半身 — 合併成可讀累加計數後每秒總輸出(每英雄/每側)一眼可辨、boss 本體重新成為焦點,掛機觀戰從「糊一片」變「看得懂的輸出秀」;附帶解掉候選 4(擊殺回饋被蓋)的疊加主因;純演出/繪製層(浮字合併＋分道錨點),零數值公式/命中判定/存檔變動,回滾單 commit 即還原;快取 610→615"
    ]
  },
  {
    v: "v584", title: "村莊夜空/遠山對比修色 — 夜景色板全擠同一明度帶，使已繪製的遠山/月霜山頂/月光描邊視覺上隱形；調整天空四段漸層(加地平線光帶)＋山體四級色階拉開，讓既有天空幾何浮現（村莊與王國美術優化）",
    notes: [
      "診斷（progress/round-6-evidence.md 候選1，兩張 K3 視覺判讀＋像素採樣三重一致）：天空 #222540(34,37,64)、山腳 #1b1e30(27,30,48) △僅(7,7,16)、山脊 #262b40(38,43,64) vs 天空 △+4/+6/0 — 脊線與天空近乎同亮，剪影隱形；K3 判「幾乎沒有遠山/道路/河流…像橫向攤平的圖示列」「天空占 70-80% 近單色深藍黑，沒有明顯月亮、遠山、地平面線」— 遠景幾何是既有深度投資(v252/v267/v271/v273)，只是被色板埋掉",
      "修正（js/ui/render.js drawTown 內純色票/漸層常數，零座標/零幾何/零迴圈變動）:①天空漸層 addColorStop(0)=#1d2036(頂部略暗襯星)→(0.45)=#232642(中天維持)→(0.72)=#2b3050(地平線上方加亮，月夜夜光反照)→(1)=#1a1c2e(貼地收暗與地面 #1c1e31 銜接);②新月遮罩色 #232642→#21243c(對齊 y18-42 段新天空，避免月食色塊);③山體四級色階:山腳 #1b1e30→#191b2c、山腰 #20243a→#242a44、山脊 #262b40→#333d5e(關鍵明度跳，剪影浮現)、月霜山頂 #2f3a55→#48587e(夜間雪等價提亮，仍留藍灰族);④右緣月光描邊 #262b40→#3d4a6e(月亮在右，受光側應是全山最亮線);⑤山脊樹線 #20243a→#1d2136(剪影層比山脊暗一階);全屬既有夜藍灰族(#232642/#141524/#2f3a55 同族)，符合「同色系深階、無黑輪廓」村莊語彙，不引入新色相",
      "驗證（協議 a-f 全通過）:a)node --check js/ui/render.js、js/data/changelog.js 通過;b)邏輯(瀏覽器實測烘焙畫布 480×200 1x 採樣,山脊 x433,y130 #333d5e(51,61,94) vs 同 x 上方天空 #252845(37,41,70) → 每通道差 (14,20,24)≥8、山脊亮度 206>天空 148;月霜山頂 (438,125) #48587e(72,88,126) B=126≥96 且亮度>山脊;地平線帶 y150 #292d4c(41,45,76) 較原 #141524(20,21,36) 明顯加亮)③確定性:改動區段 grep 無 Math.random;reducedMotion 定幀同視角逐幀哈希 diff=0(townCanvas 2542507318 雙幀一致,fxCanvas 亦 0,先 flush raf 後採樣);c)回歸:核心流程(王國→狩獵休息→世界地圖→回王國→狩獵)每步 console 零 error/unhandledrejection(6 步全 0);worldmap v271 村莊畫框(drawTown 平移重用)渲染不破(截圖 v584-worldmap-village.png 零錯誤);fxCanvas 疊層/鎖定遮罩/名牌熱區零變動(本輪零座標改動,截圖目視對位);d)實機:spawned Chromium 未加 --disable-gpu,開檔走王國＋狩獵休息＋世界地圖,零 console error 零 unhandledrejection;e)截圖:progress/v584-kingdom-4x.png、v584-kingdom-4x-full.png(1920×800 全幅)、v584-hunt-rest-4x.png、v584-hunt-rest-4x-full.png(1920×1080 全幅)、v584-skyline-band-8x.png、v584-base-skyline-8x.png(乾淨無遮蔽天空帶 3850×352)、v584-skyline-before-after.png、v584-worldmap-village.png",
      "視覺閘門（harness inspect_image，全程可用未降級，未用 tools/vision-review.mjs）:乾淨天空帶 8× —「repeating row of 5 distinct low arc/dome mountain mounds, evenly spaced」「peaks' tops paler cooler slate-blue, faint moonlit frost impression」;並排 before/after(同一 480×200 base 裁切同帶 8×)— RIGHT(after)「clear row of 5 distinct peak mounds, readable tops/darker bases, separates from night sky as clean dark shapes」vs LEFT(before)「only weakly readable, ~5 faint mounds, sky-blended」;full hunt rest 4× 全幅讀到「moon upper-right (pale crescent)」＋「4-6 rounded mound silhouettes behind buildings」(before K3 判 0 座) — 遠山由隱形變可讀;frost 為「modest value lift, not bright snow」→ 未觸發風險1(不需降階 #48587e);風險2 地平線光帶於 H=270(hunt)落點與山體對位未脫節、風險3 新月呈乾淨 crescent 無數值色塊邊;整體仍藍灰夜語彙不跳色",
      "留存理由:村莊(王國＋狩獵回城休息)是全玩家每日多次回訪的「家」畫面,第一眼就是這片天空與地平線;現況場景止步於「兩排房子＋單色天空」,村莊讀不出縱深與世界感,「這裡有人住、值得回來」的期待被壓平;遠山/月霜/月光描邊是既有深度敘事投資(v252/v267/v271/v273 多輪打磨),只是色板埋掉它們 — 一次純修色即兌現,每日回訪第一眼從「平面貼圖列」變成「有遠山有月光的夜鎮」;純色票/漸層常數級改動(render.js drawTown 一段),零座標/零幾何/零隨機性/零存檔 schema;若顯示回歸,git revert 本輪 commit 即完整還原;快取 609→610"
    ]
  },
  {
    v: "v583", title: "掉落（裝備/寶石/技能書/素材/藥水/BOSS額外）每殺機率 ×難度倍率 — 補齊 v204 金/經 parity：四難度「掉落/小時」與金幣/經驗一樣精確 parity，夢魘不再是「更慢的同樣掉落」（遊戲數值平衡）",
    notes: [
      "診斷（確定性模擬，dps=5717・glacier 區第 9 關，改動前對照表）：rates() 的 killT=max(0.4×dMult, hp/dps) 使「金幣/擊殺 ÷擊殺時間」自我對消 → 金/秒四難度誤差 <0.2%（445.1/445.1/445.7/445.6）即 v204 parity 已成立；但掉落是每殺獨立骰子、不除時間，殺/時 ÷dMult → 每小時掉落 ÷dMult：夢魘 vs 普通 裝備 586→107/時(-82%)、寶石 274→50(-82%)、書 117→21(-82%)、素材 2345→426(-82%) — 高難度擊殺時間 5.5×、掉落輪次被砍 82%，刷裝玩家永不切高難度",
      "修正（js/sys/loot.js 單檔邏輯＋js/ui/hunt.js 顯示同源）:①新增私有 helper diffDropMul() = 當前難度 d.mult（深淵無難度 → 1）;②rollKill 每殺機率全乘 dMul 並 clamp 0.95 — 魔物專屬素材/通用素材迴圈/藥水（內層基礎率 cap 保留）/裝備（BOSS 維持必掉 1 不乘）/寶石/技能書/BOSS 額外券・書;鑒於每小時掉落 = 機率 × 殺/時，機率 ×dMul 即每小時精確 parity（含頂層玩家 dps 打穿 hp 時 killT 下限 0.4×dMult 同步縮放，parity 依然成立）;③dropInfoOf/lootInfoBlock 顯示率同乘 dMul（v256 單一來源契約不漂移 — 圖鑑與狩獵頁掉落一覽隨難度切換正確變化）;④不改 DIFFICULTY 常數表/存檔 schema/rates()/scaledMonster/離線結算",
      "驗證:①語法 node --check js/sys/loot.js、js/ui/hunt.js、js/data/changelog.js 全通過;②確定性模擬（同一支改動前後對照）— 改後四難度 每小時 裝備/寶石/書/素材 相互差 <0.05%（586.2/586.2/586.2/586.1・273.6/273.5/273.5/273.5・117.2×4・2345.0/2344.7/2344.6/2344.6）;普通難度(dMul=1)改動前後逐位元一致（零回歸錨）;金/秒・經驗/秒四難度改動前後不變（parity 未破壞，v204 維持）;③邊界:最後一關 BOSS 裝備必掉仍 =1（×dMul 後 clamp 0.95 不涉 boss 分支）、精英怪(×4) clamp 0.95 不溢出、深淵 dMul=1 零變化、treasureMul/dev 加成共存（同乘不覆寫）;④回歸:核心流程（王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口→回城待機）console 零 error/unhandledrejection;掉落一覽顯示隨難度切換:普通 7.5% → 地獄 24% → 夢魘 41%（裝備），寶石 3.5→19%、書 1.5→8%（與實戰同源）;建議戰力/bestFarmSpot/離線預覽數字與改前一致;離線結算（save.js offline）不走 rollKill — 金/經走 rates() 已 parity、素材/裝備為難度無關的平量贈予，不涉及本輪每殺 parity，無新失衡;⑤實機:本地 spawned Chrome（--headless=new 未加 --disable-gpu）注入中後期存檔切 4 難度各 60s+ 零 console error/unhandledrejection；reducedMotion 路徑零錯誤;桌機 1280×800＋行動 390×844 雙視口;⑥存檔相容:零 schema 改動（無新欄位），舊檔無 hunt.difficulty → dMul=1 行為同普通",
      "留存理由:四難度系統的存在意義是「我能挑戰更難的獵場」;v204 後金/經已 parity，但掉落純每殺獨立 → 夢魘擊殺時間 5.5×、掉落輪次被砍 82%，理性玩家刷裝時永不切高難度 — 地獄/夢魘解鎖（中後期里程碑）瞬間從「新鮮目標」變成「懲罰按鈕」，四難度形同只有普通一個;補齊掉落 parity 後「挑戰已解鎖的最高難度」成為無損甚至帶精英密度優勢的選項，中後期玩家每次戰力成長都有理由把難度往上推一檔 — 這正是「再開一次遊戲試試夢魘」的留存動機;風險回滾:單檔單 helper（diffDropMul）＋rollKill 每殺乘數，git revert 本輪 commit 即還原，常數表未動、零遷移殘留;已知殘留:精英怪高難度設備率因 clamp 0.95 略低於純 parity（每一殺最多掉 1 件的物理上限，0.30×5.5→0.95），屬可接受的「高難度略甜」方向、非倒掛（普通不受損）;BOSS 必掉寶石為必掉語義不乘 → 高難度 BOSS 必掉寶石/時略稀，微幅、非主幹;快取 608→609"
    ]
  },
  {
    v: "v582", title: "中央城堡 b_castle_iso TheoTown 化重繪 — 平灰盒＋近黑屋頂平板 → 亮石板牆＋藍石板坡頂＋連續雉堞＋多塔＋拱門台階（TheoTown 技術對齊與稽核：P0 地標精緻化系城堡重繪）",
    notes: [
      "診斷（瀏覽器實測＋8× 放大 inspect_image＋像素採樣）：世界地圖中央城堡 b_castle_iso（全圖最大 scale 1.2、王國象徵、每日開圖第一眼落地點）現況為「平灰盒＋近黑屋頂平板」— 屋頂區（sprite y1–15）近黑像素（luminance<64）佔 77.6%、屋頂整面無明暗分面、牆主面明度僅 60%（對照官方範例宅邸 b_tt_demo 石牆色族 #90a0c0–#c0c0c0 明度 66–84%）、塔是 6px 扁平錐片貼在盒側、雉堞是屋頂斜緣 3 顆碎點、門 7×8 過大「貼上去的」— 與 b_tt_demo 並排一眼認出誰是舊的,把「我經營的王國很雄偉」的視覺承諾打成扁平灰盒（每輪開圖第一眼就被打破）",
      "修正（tools/gen-iso-art.cjs drawCastle 全重繪＋重生成 js/data/art/buildings_iso.js,僅 b_castle_iso 條目變化、其餘 10 棟像素逐位元不變;map.js:565 繪製呼叫/錨點/尺寸 64×48/scale 1.2 零變動）:①色票對齊官方石牆族 — 牆 wallL hsl(220,25,72)≈#a2a9c4(lum 69%)/wallR 暗右面/牆底 2px 深帶(R5)＋石板縫(每~4px 橫縫＋交錯直縫,retint 只著色既有像素,R6 結構化雜訊);屋頂改藍石板瓦中調 roofL hsl(224,26,56) 勿近黑(R2)＋亮脊線＋左坡瓦排;②結構由後往疊 — 左右塔加粗加高至 8px 寬/自 y6 錐頂＋roofL/roofR 雙面錐頂＋1px 亮脊＋塔頂雉堞圈(2px 垛+1px 口)＋2×3 窗＋錐頂小旗;主樓維持 ttTheo(32,6,16,7,18) 骨架;前簷連續雉堞帶(y19–21、x18–45,2px 亮垛+1px 凹口,10 垛)＋左右 2×3 角垛;拱門 5×7(拱頂削兩角＋拱內暗影)＋門上 2×2 氣窗＋兩階石階;屋脊旗保留;確定性:只用既有 seeded speck()/LCG,禁 Math.random",
      "驗證:node --check tools/gen-iso-art.cjs 通過;重生成成功;git diff 逐位元比對 — 僅 b_castle_iso 條目變化,其餘 10 棟(b_guild/training/library/forge/alchemy/market/altar/gemworks/warehouse/house)像素完全一致;像素斷言 — 屋頂區(sprite y1–14)近黑像素 76%→0.0%(<10% ✓)、牆主面 wallL 明度 69%(對齊 tt_demo 66–84%)、亮脊線存在(x32 明度 178 > 兩側屋面 x30=131/x34=93)、前簷雉堞亮垛 29px(≥7 ✓);實機:本地 Chrome(--headless=new,0 加 --disable-gpu)開世界地圖(注入後中後期檔)零 console error/unhandledrejection;reducedMotion=true 開圖＋縮放導航零錯誤;核心流程(世界地圖開啟→返回王國→再開地圖)零錯誤;雙視口桌機開圖乾淨",
      "視覺閘門（inspect_image,harness 影像工具,全程可用未降級）:①城堡單獨 8× 放大 —「不再判 plain gray box/flat dark slab」,多塔/藍石板坡頂/雉堞/拱門台階齊備,7/10(殘:中央脊線＋旗桿在 8× 縮小讀微似桅、雉堞節奏在壓縮圖未完全可數)→ 回改一輪:屋頂降飽和 32→26、脊線降亮 74→64、前簷雉堞加高 2→3px、拱門加深內影、牆 speck 改細緻,重跑後雉堞/門/塔全可讀;②與官方範例宅邸 b_tt_demo 6× 並排 —「同文法:亮藍灰石牆同族/左亮右暗/零黑輪廓/深綠貼地影/多部件,配色足以共存,城堡讀作詳實 TheoTown 城堡而非外來資產,一致性 8/10 — 認不出誰是新舊」;③全圖 1× 概覽 — 中央地標不再被點名為平盒,讀作全圖最亮冷調地標,與暖瓦村舍同場不衝突;截圖 progress/v582-before-castle-8x.png(改前)、v582-after-castle-8x-crop.png(改後 8×)、v582-after-side6x-crop.png(與 b_tt_demo 並排 6×)、v582-map1x.png(全圖 1×)",
      "留存理由:世界地圖是每日回訪錨點(寶箱/首領倒數/模式入口都在這張圖),而城堡是全圖最大、唯一王國象徵、每日開圖第一眼的落地點 — 現況它與官方範例宅邸並排「一眼認出誰是舊的」,把王國/資本主義的視覺承諾(我經營的城很雄偉)打成一個扁平灰盒,開圖第一眼就下修留存期待;修齊後城堡以與官方範例同一套 TheoTown 文法(亮石板牆/藍瓦坡頂/雉堞/拱門/塔)立體雄偉可讀,「我的王國在成長」的期待感(留存最上游動機)在每日開圖的第一眼即被餵養;純美術資產級(tools/gen-iso-art.cjs drawCastle 單函數＋重生成的 buildings_iso.js 單條目) — 零數值/零存檔 schema/map.js 零觸碰(繪製呼叫不可能、錨點/名牌/熱區/尺寸/scale 全不變)/零新增隨機性(全 seeded);若顯示回歸,git revert 本輪 commit 即可(tools/gen-iso-art.cjs + buildings_iso.js 兩檔,無 schema/無 map.js 變動);參考:方案明文禁止改 ttTheo/win/door/flag/speck 共用輔助(diff 驗證僅 drawCastle 與其色板行變動,其餘 10 棟共用路徑零波及);快取 607→608"
    ]
  },
  {
    v: "v581", title: "海岸燈塔＋碼頭 TheoTown 化 ＋ 海洋活化完成 — 漁船/沿岸泡沫/海鷗（承接在途 v581 海洋層）＋燈塔碼頭重繪（TheoTown 海洋・氛圍與動態：P0 backlog 海洋活化「漁船/燈塔」全數落地）",
    notes: [
      "診斷（瀏覽器實測 headless Chrome＋base 像素掃描＋4× 放大 inspect_image）：P0 backlog「海洋活化（漁船/燈塔）」的燈塔半仍是 v293 原版 — 燈塔僅 12px 寬 2 色條紋 stub（無石基分層/無門/無窗/無欄杆平台）、碼頭是 4 個平色矩形（無甲板結構/無板縫/無樁影/無貨物）、無貼地斜影（撞 TheoTown 驗收清單「有貼地斜影」項）；4× 放大 inspect_image 實測：「燈塔=幾像素 stub、碼頭=平棕條、船與碼頭糊在一起、水面平、光束與塔身斷開」——海灣場景（地圖右下角、海洋為迷霧種子、新玩家第一天即可捲到）是全圖視覺文法最弱的一處；漁船半已在進度（沿岸淺水/白浪泡沫/船重繪/海鷗,簽入本輪）",
      "修正（js/ui/map.js 單檔繪製層,錨點 (lx,ly)=(789,558)/(dx,dy)=(789,574) 與 v293 光束錨定 (lx,ly-30) 零變動）：①drawLighthouse 全重繪 — lmShadow 深綠貼地斜影（官方黑 20% 疊陸地文法）＋石基兩階（受光左/暗右/AO 角）＋條紋塔身 4 帶（白 #e4e4ec/#f2f2f8/#c6c6d2 家族、紅 #a85038/#b86048/#84382c 家族,每帶左受光右暗＋底漸暗,R4/R5）＋拱門（門洞 #241a12＋內暖光 #ffb45a,R3 零黑輪廓）＋暖窗（#ffd166＋#ffe9a8 高光）＋燈室（欄杆平台 15px＋直立窗格＋琥珀亮芯 6×3,亮芯中心=光束錨點 ly-30）＋穹頂陡坡（5 色收窄）＋金頂飾＋seeded 雜訊（全帶內行,避窗/門/漸暗行,確定性）;②drawDock 全重繪 — 甲板 4 階（板面受光 #9a7a44/板身 #8a6a3a/暗階 #7a5a30/底緣 #5a3a20,R5）＋斷續板縫（seeded）＋前端立面＋樁柱×3（水上受光/水下暗影柱）＋甲板下水色暗化帶（rgba(8,12,28,0.5)）＋岸側階台＋纜繩柱＋絞繩兩圈＋貨物（木桶 5 部件＋板條箱,TheoTown 碼頭語彙）；③drawSeaFx 燈室暖光暈（rgba(255,209,102) 確定性呼吸,rm 定幀）;用色全屬 R1-R6 低飽和家族、無近黑輪廓",
      "驗證:node --check 通過;瀏覽器實測（headless Chrome 1280×800＋390×844 DPR2,base→顯示偏移 drawImage hook 精確取得後像素斷言）— ①簽名部件全數在位:白帶 #e4e4ec/#f2f2f8 56-76px／紅帶 #a85038/#b86048 121px／石基 227px／門 90px／暖玻璃 15px＋金飾 15px／甲板 31px＋板縫 23px／樁 6836px（含陸地色系）／木桶 51px／板條箱 65px／絞繩 6px／纜繩柱 57px／甲板下暗化 14809px（深海+樁影）；②位置:塔身帶於 canvas(55,183)=(150,64,44) 紅帶家族、燈光 (55,170)=(255,211,107) 暖暈、腳下陸地 (55,208)=(72,68,101)、遠海 (130,240)=(22,35,60) 深海軍藍 — 全部與錨點數學一致;③新玩家路徑（maxRegionReached=0）:海灣陸地 tile 屬鎖定區域 → 燈塔/碼頭正確在霧內（舊行為一致）,沿岸泡沫/漁船/海鷗照常可見 — 零回歸;④reducedMotion=true 雙幀哈希 diff=0（全定幀）零錯誤、zoom 1×/1.5×/2× 循環零錯誤、小地圖/滾輪/拖曳導航零錯誤;⑤核心流程（王國→副本→英雄→裝備→建築→更多→頂欄世界地圖→世界首領名牌→返回→回城）每步 console 零 error/unhandledrejection;⑥桌機＋手機 10s soak 零錯誤",
      "視覺閘門（inspect_image,全過程可用未降級）:新燈塔 4× 放大 —「灰色石基分層＋白紅條紋塔身＋亮燈門＋紅帶暖窗＋欄杆平台＋暖燈室＋深穹頂＋金頂飾,讀作完整燈塔 sprite,8/10」;before（v293 stub 4×）:「幾像素 stub、平棕碼頭、船糊成一團、光束斷開」;並排對照（風車=既有已達標 vs 新燈塔）:「同一文法 — 無黑輪廓/左上受光/多部件/貼地陰影,一致性 7.5/10,燈塔細節略高於風車（新≥基準）」",
      "留存理由:世界地圖是每日回訪錨點,海灣是地圖右下角新玩家第一天就能捲到的「第一個驚喜角落」— 4× 診斷直擊:燈塔 stub＋平棕碼頭讓整片海在真實觀賞尺寸下讀作「暗塊＋斷開光束」,把海洋從「值得探索的世界邊緣」打成「沒做完的背景」;重繪後海灣五件套（燈塔/碼頭/漁船/白浪泡沫/海鷗）全部共享同一 TheoTown 文法,每日寶箱/解鎖慶祝的路線掃過角落時永遠有完整場景可看,探索慾望（右下角還有什麼？）落地為畫面回饋;純美術資產級（map.js 繪製層單檔＋changelog/index）— 零數值/零存檔 schema/錨點座標/名牌/熱區/門檻/滾輪/小地圖零變動/零新增隨機性（全 seeded/靜態烘焙,radial 呼吸為確定性函數）;若顯示回歸,git revert 本輪 commit 即可（map.js 含在途 v581 海洋層一併回滾）;快取 606→607"
    ]
  },
  {
    v: "v580", title: "戰爭迷霧邊緣柔化 — BFS 深度場＋逐像素 smoothstep 漸變＋霧內雜訊（TheoTown 地形・道路與環境：P1 backlog 迷霧邊緣柔化）",
    notes: [
      "診斷（瀏覽器實測＋base canvas 逐像素掃描＋inspect_image）：P1 backlog「迷霧邊緣柔化」的現況缺陷兩處 — ①邊界硬切：交接帶（edgeRows 126-582 全帶）內最大 1px 亮度跳變 Δ203（0-255 尺度），明亮地形直接貼上 rgba(10,12,26,0.62) 近黑平塗，交界呈像素階梯刀切（inspect_image 確認「硬切邊界、非平滑漸變、鋸齒直線切割」）;②霧內空無：霧區純色暗塊、零紋理零明暗（inspect_image 確認「均勻暗色無噪點變化」）— TheoTown 的戰爭迷霧是有厚度的冷藍氣體（邊緣透出地形輪廓、霧內有深淺），而本作的霧是一把刀切出來的「洞」，把探索謎團變成廉價剪影遮罩，地圖東北半張每天重複暴露這個破綻",
      "修正（js/ui/map.js buildBase 迷霧段全重寫,單檔繪製層,零座標/零名牌/零熱區/零地標變動）：①BFS 深度場 — 以海洋/村莊/已解鎖區為種子 4 連通擴散進霧格,fogD = 距最近清楚格步數（≥4 截斷）;②逐像素霧合成 — 霧區 bbox 內每像素以逆等角投影取深度、雙線性取樣後 fogAlpha smoothstep（d≤0.45 清楚 → 1.65 tile 外全霧 0.66,軟加速曲線）:交界由 Δ200+ 硬切變 ~10px 連續漸層、零平帶（初版 2×2/4×4 子菱形平帶在 4× 放大仍出階梯,迭代至逐像素消除）;③霧內同系雜訊＋邊緣冷藍霧氣亮點（seeded rr 確定性,厚霧 #485a84/#000 亮暗點、薄霧 #768ab4 氣點）— 霧讀作「氣」而非「空無」;全霧 alpha 0.62→0.66 同語感,色 #0a0c1a→#0d1020 微抬保持藍黑家族;reducedMotion 零影響（霧為烘焙層非動態）;buildBase 一次性成本無感（開圖 <70ms 含首幀）",
      "驗證:node --check 通過;瀏覽器實測（headless Chrome,reducedMotion=true 全定幀確保 before/after 同視角逐像素可比,注入 maxRegionReached 觸發解鎖慶祝平移精確定位霧帶;git revert 舊碼同視角重抓 v580-before-rm.png 為基準）— ①霧區逐像素 diff:bbox（242-574 × 0-624）外零變化（村莊/廣場/海洋與舊版 byte 相同）,邊界帶剖面 y=159:112→110→104→86→74→69→67→66→73→…→41→37→27 連續漸變,亮→霧最大 1px 步進 17.6-22（舊版同剖面 108→38 一刀切 2-3px、霧內全圖單一 38）;②霧內層次:深霧區亮度 27-38 變化＋霧氣亮點/暗點（seeded,與舊版 0 差異區分）;③4× 放大 inspect_image 閘門:「連續漸層光錐羽化、4-6 中間色階、霧內樹影/地形隱約可辨、非硬遮罩」（迭代:初版 2×2 子菱形 4× 仍有平帶階梯 → 4×4 改善 → 逐像素合成消除平帶;smoothstep 曲線使邊緣軟而霧體實）;④並排:新霧 vs 舊霧 vs 風車（既有已達標）— 霧帶與草地/風車同陽光照度語彙;⑤縮放 1×/1.5×/2× 循環照常、reducedMotion 雙幀哈希 diff=0 零錯誤;⑥console 每步監聽零 error/unhandledrejection;核心流程回歸全通過（王國→副本→獵人→裝備→建築→更多→世界地圖→縮放→回城待機）;桌機 1280×800＋手機 390×844（DPR2,canvas 690×750）雙視口開圖零錯誤;全新存檔（maxRegionReached=0 全圖霧,最重路徑）開圖 <70ms（BFS 1288 格＋逐像素 bbox 一次性）",
      "留存理由:世界地圖是每日回訪錨點,而迷霧是這張圖上最大的未解區域 — 教學明文「灰霧區域擊敗守關 BOSS 後解鎖」,霧是探索慾望的載體;舊版硬切平塗霧讓鎖定區域像「被挖掉的洞」,把「世界等你發現」的謎團感打成廉價遮罩,每塊 fog tile 的階梯邊緣在 1×-1.5× 觀賞尺寸下持續暴露;柔化後霧是有厚度的冷藍氣體 — 邊緣輪廓漸顯、霧內深淺流動,解鎖瞬間「霧散見真章」的驚喜感落地,未解鎖區從「壞掉的地圖」變成「值得探索的遠方」,探索–解鎖–慶祝迴圈的期待感升級;純美術環境層（map.js 烘焙段單處）— 零數值/零存檔 schema/零座標/零新增隨機性（全 seeded）;若顯示回歸,git revert 本輪 commit 即可;快取 605→606"
    ]
  },
  {
    v: "v579", title: "街道燈柱 TheoTown 化 — 6 座路燈重繪：石基座＋鐵柱＋青銅罩＋琥珀玻璃＋金頂飾＋暖光暈（TheoTown 村莊生活感與街道：P0 backlog 路燈）",
    notes: [
      "診斷（瀏覽器實測＋base canvas 像素採樣＋8× 放大 inspect_image）：P0 backlog「村莊生活感（路燈/攤位/更多村民/商店招牌）」中路燈為街道最弱環節 — v292 路燈僅 3 個矩形（2px 鐵桿 #3a3a42＋6×4 罩 #2a2a30＋4×2 平光方塊），罩體明度 ~17% 撞 R2（暗部不低於 30%）、桿身 ~26% 貼近 R3 黑輪廓語感，且無基座/無燈罩結構/無光暈，8× 放大並排官方文法資產（風車/冰塔）即破綻：1×-1.5× 真實觀賞尺寸下 6 座燈柱（西街×2/東街×2/中街×2）糊成「暗桿＋黃塊」，街道生活感被燈具品質下限拖累 — 路燈是街道上最重複的街具（6 座同款式），其文法失分在每條主街重複出現",
      "修正（js/ui/map.js 單檔繪製層,燈柱座標/名牌/熱區零變動）：6 座路燈整座重繪為 TheoTown 燈柱語彙 — 石基座（6×3 三階漸暗＋左上受光 #a8a8b6,R5 底漸暗）、鐵柱（3px 亮暗雙面 #6e6e7c/#5a5a68＋柱頂受光,R4 左亮右暗）、青銅罩框（罩頂 #5a4a30＋左受光 #6a5a38＋側框 #4a3a28＋罩底 #3e3020＋柱罩接環,R3 無黑輪廓）、琥珀玻璃（#ffb45a 底暗 #d8903a＋#ffd166 亮芯）、金頂飾（#c08a3a 受光左緣 #ffd166）、暖光暈（radial gradient rgba(255,190,90,.32→0) 半徑 8px 烘培進 base,靜態確定性,零新增隨機性/零每幀成本）;3+ 部件合規（基座/柱/罩/玻璃/頂飾 5 部件）、比例約 1.8 小人高（TheoTown 燈柱比例）",
      "驗證:node --check 通過;瀏覽器實測（headless Chrome 1280×800＋390×844,base→顯示偏移量以 drawImage hook 精確取得 offX=42/offY=0 後像素斷言）— ①6 錨點全數齊備:琥珀玻璃 #ffb45a/#d8903a 家族每座 3-8px、金頂飾 #ffd166 5/6 座（1 座被行人遮蔽）;②R2/R3:6 座燈柱 bbox 近黑(lum<90) 0px、舊罩色 #2a2a30 全圖 0px（舊燈柱零殘留）;③8× 放大 inspect_image 雙座確認 — 「石基座/金屬柱/青銅框/琥珀玻璃/金頂飾/暖光暈全齊、無近黑、讀得出是點亮的燈籠」;④並排視覺閘門:before（v292 程式重現）vs after 8× 並排 — 右側新燈「形狀完整的暖燈籠」、左側舊燈「暗桿＋平黃塊」;新燈 vs 風車（既有已達標）vs 官方樣張 sample10 三併 — 「同色系文法、無黑輪廓、左上受光、深綠貼地」家族一致;⑤回歸:核心流程全通過（王國→副本→英雄→裝備→建築→更多→世界地圖→競技場地標 modal→派遣出征 dispatchIds→擊殺→召回→回城待機）;縮放 1×/1.5×/2× 循環零錯誤;reducedMotion 路徑雙幀哈希一致（靜止）零錯誤;全新存檔（save.reset 真實流程）boot＋教學跳過＋地圖零錯誤;桌機/手機 10s soak 零 console error/unhandledrejection;⑥註記:全圖唯一亮色異常區（西廣場光團）查證為 v573 官方範例宅邸（tt_demo 淺藍灰牆 #b0d0f0 家族,本遊戲最亮建築）— 既有資產非本輪回歸、建築主體屬主題 1 範圍,列入下輪觀察",
      "留存理由:世界地圖是每日回訪錨點（模式入口/每日寶箱/世界首領倒數都在這張圖）,街道是最先入眼的畫面層;6 座 v292 暗桿燈柱在每條主街重複暴露「近黑桿＋平黃塊」的破綻,把街道生活感的下限釘在文法之外 — 重繪後每條街的燈柱都是完整 TheoTown 燈籠（基座/柱/罩/玻璃/暖光）,晨昏掃街的畫面密度與地標/建築同源,村莊「有人居住、晚上會亮燈」的期待感落地;純美術資產級（map.js 繪製層單檔）— 零數值/零存檔 schema/錨點座標/名牌/熱區零變動/零新增隨機性（全靜態烘培）;若顯示回歸,git revert 本輪 commit 即可;快取 604→605"
    ]
  },
  {
    v: "v578", title: "模式地標精緻化 — 4 座弱勢地標重繪＋全地標深綠貼地陰影（TheoTown 建築與地標：P0 backlog 對齊區域地標水準）",
    notes: [
      "診斷（瀏覽器實測＋base canvas 像素掃描）：P0 backlog「模式地標精緻化（10 地標對齊區域地標水準：細節+陰影+小 fx）」仍開 — 本輪以 base 像素座標系統（isoX 含 XO=448 平移）逐座採樣 + 4× 放大並排（模式地標 vs 區域地標）實測：模式帶元素試煉塔/世界首領碑/無盡深淵/委託遠征營四座體量最薄（塔身 12px、營帳 12px 高、石燈無座、頭骨平塗），暗部靠死黑（世界首領眼窩 #1a1018 撞 R3、深淵裂縫/石壁低明度無分層）＋貼地陰影用 rgba(0,0,0,0.25) 純黑 — 與區域地標（風車/冰塔）並排時「同文法」斷裂，縮小到 1×-1.5× 地圖實際觀賞尺寸即糊成塊；另稽核確認 R3 黑輪廓（#101018 box/tri）v568 已修、本輪不重複",
      "修正（js/ui/map.js 單檔繪製層,零座標/零錨點變更）：①lmShadow 全地標共用 — 黑 25% 改深綠 rgba(18,34,16,0.5) 且加高加寬（官方文法：陰影=黑 20% 疊草地=深綠家族；區/模式地標貼地感一致）;②mdSpire 元素塔重繪 — 塔身 12→16px 加寬加高（ay-24→ay-30）＋雙窗列（窗框/過梁/元素窗 4 色）＋左受光右陰影 2px 帶＋石面雜訊＋2 階石階底座＋尖錐 12→18 寬/10→14 高（apex ay-46）＋金尖高光＋四色小旗移置中台;③mdBone 世界首領碑重繪 — 土台分層＋前階、交叉獸骨改亮面/陰影面/骨節光 3 階、頭骨左亮右暗＋顱縫＋眼窩去近黑 #3a3038（R3）＋牙列、台前骨碎片;④mdStairs 無盡深淵重繪 — 裂口壁加高（ay-10→ay-14）＋壁緣受光/岩裂縫/壁頂、階梯每階加立面漸暗、裂縫紫滲光邊、石燈加石座＋燈柱受光;⑤mdCamp 遠征營重繪 — 帳篷布面左亮右暗全三角（藍帳/青帳各 3 面色階）＋帳口＋營地地面加寬 3 色＋營火石圈＋補給箱分面＋營旗受光;⑥LM_ART 鎖定遮罩/徽章錨隨新包覆盒更新（tower w26h50/abyss w34h24/exped w38h24/worldboss h34）、模式名牌偶數列上移 -46→-52、MODE_FX 塔尖光芒/紫焰/營火逐座重錨（新 apex/裂縫/火堆高度）；描點/名牌/熱區/門檻零變動",
      "驗證:node --check 通過;瀏覽器實測（headless Chrome 1280×800＋390×844,base canvas 像素讀取精確斷言）— ①重繪簽名色齊備:spire 塔身 #8a7a9a 面積 +97%（重繪前後 base 同座標像素比對）、窗列 #4fc3f7/#ff6a4a/#7ee787/#ffd166 各 ≥4px 於 ay-28..-19 窗框內、金尖 #ffdf8a 高光 2×3px、中台 #7a6a8a 16×4;worldboss 土台 #6a6256 前台階 8×1、頭骨受光 #f4eee2 3×9、眼窩 #3a3038（#1a1018 零殘留）;stairs 壁緣 #3a3a4c 2px 受光帶、石座 #4a4a58 6×3、裂縫 #0a0a14 6×10;camp 藍帳左亮 #6a8aaa 半面、石圈 #8a7a6a 8×2、旗受光 #e85c5c;②lmShadow 深綠化:全 10 座模式地標錨點下方 5px 陰影帶抽樣為深綠家族（非黑）;③R3:重繪 4 座 bbox 內近黑(lum<40)佔比全部 <6%（eye 洞/裂縫 interior 除外）;④fx 重錨:spire 光芒中心移至 ay-46±r 像素實測、stairs 紫焰起點 ay-19、camp 營火跳動 ay-12±h;⑤鎖定遮罩（新檔 kingdom Lv1）:tower/abyss/exped 鎖定時遮罩全包覆新藝術（bbox 內藝術色歸零）＋名牌/熱區照常;⑥回歸:核心流程雙視口全通過（王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口 modal→返回→召回）、console 零 error/unhandledrejection;reducedMotion=true 路徑地標/fx 靜止幀零錯誤;⑦審美閘門:4× 並排截圖（重繪 4 座 vs 區域地標風車/冰塔）inspect_image 對照 — 體量/部件/左亮右暗/貼地深綠陰影同文法,「認不出誰是新的誰是舊的」",
      "留存理由:模式入口是玩家每天點最多次的地圖元素（競技場/秘境/世界首領/公會/活動的每日儀式報到點），而 4 座弱勢地標在 1×-1.5× 真實觀賞尺寸下糊成暗塊、與身旁已達標區域地標（風車/冰塔）並排即破綻 — 「世界有內容」的期待感被細節斷層下修;精緻化後每天第一眼掃過傳送帶的瞬間,10 座入口全部以同一 TheoTown 文法立體可讀,地圖密度對齊 EHT 級;純美術資產級（map.js 繪製層單檔）— 零數值/零存檔 schema/錨點座標/名牌/熱區/門檻零變動/零新增隨機性（全靜態繪製）;若顯示回歸,git revert 本輪 commit 即可;快取 603→604"
    ]
  },
  {
    v: "v577", title: "建築對齊官方樣張逐像素重測 — 陰影深綠化/長度=物高/屋頂:牆≈2.4:1/完整草地/祭壇補文法（等角地圖・美術與內容：官方規格稽核修正）",
    notes: [
      "背景：v575 宣稱「官方規格」但從未與官方樣張逐像素對比 — 本輪取得 Theo 官方教學 t=1233 全部素材（10-step 全文＋sample10 成品 32×25＋光影模板 32×24），新建進度/theo-steps/ 基準並逐像素解碼，對照 v575 成品發現 4 項偏差：",
      "稽核發現：①陰影用 hsl(230,20,10)=#14161f 近乎純黑 — 官方 step9 明文「black as a color with 20% color coverage」= 黑 20% 覆蓋疊在草地上 = 深綠（#406534/#2e4527 家族），且 #14161f 恰撞 THEOTOWN-ART-RULES R3 黑輪廓色（v575 驗證腳本漏抓此色）;②陰影長度 (D*2+H)*0.4=40% — 官方明文「length of the shadow corresponds to the height of the object」= 右牆高 H;③屋頂:牆 = 1.25:1 — 官方樣張屋頂佔建築本體 ~68%（屋頂:牆≈2.4:1，屋頂高 2D、牆只露 5px）;④b_altar_iso 僅 7 色無屋頂無草地無陰影（custom 直繪繞過 ttTheo 骨架）— 完全不符官方建築文法;另有草地窄帶非完整菱形（官方 step8「grass added to front yard」）",
      "修正（tools/gen-iso-art.cjs 重寫 ttTheo 骨架＋全參數）：shade 色 → hsl(105,28,21) 深綠（官方黑 20% 疊草地之結果色）;煙囪投影改 roofShade 屋頂暗化（官方 step9「chimney throws its shadow on the roof」）;陰影長度 = H;屋頂/牆比例 → ty=1,D=7,H=5（屋頂 14px/牆 5px ≈ 2.8:1，牆底 y=20）;草地 → 完整菱形前院草（左半 grassHi 受光、右半 grass 背光，深度 clamp 不超 sprite）;b_altar_iso 重建 = ttTheo 四部件（大屋頂＋石牆＋草地＋陰影）＋聖火石台;城堡陰影/察色同步修正;11 棟全重生成;輸出標頭更新 v576→v577",
      "驗證：node --check 通過;node 審計 11 sprite — 黑輪廓(#000/#101018/#14161f/#14121f) 0 px、sat>78%/l<12% 0 px（修正後全 PASS，v575 時城堡另有 7px l=12 違規已修）;ASCII 形狀 — 屋頂 14px/牆 5px/草地菱形 20-31、祭壇 13 色含屋頂+石台+草地、陰影為深綠家族;瀏覽器實測（headless Chrome 1280×800＋390×844）— 村莊中心區像素抽樣 roofRed 1247/roofBlue 1569/wallCream 3642/grass 4145/darkGreen 9669（深綠陰影）fallback 0、console 零 error;截圖 progress/v577-theo-spec-buildings.png（桌機＋手機）",
      "留存理由：官方 10-step 教學是 TheoTown 建築畫法權威 — 陰影是「黑 20% 覆蓋」的深綠而非黑塊、陰影長度=物高、大屋頂小牆、前院草地正是「一眼像 TheoTown」的關鍵文法;v575 的四項偏差讓村莊與官方樣張並排時仍可辨出「不是同一套規則」;本輪以官方素材逐像素重測落地後 v575 宣稱的官方規格才真正成立;純美術資產層（生成器＋art 重生成）— map.js 零觸碰/零座標/零數值/零存檔語義/零新增隨機性（全 seeded）；快取 602→603"
    ]
  },
  {
    v: "v576", title: "世界地圖滾輪捲動 — 桌機捲動與點擊手感補完（等角地圖・功能與技術：導航 UX）",
    notes: [
      "診斷（grep 稽核＋瀏覽器實測）：map.js 自 v171 起只有 pointer 拖曳單一捲動路徑 — 全檔 wheel/onWheel/deltaY 零命中，桌機玩家唯一捲動方式是「按住拖曳」；世界地圖 BASE 940×528（村莊左下 → 神話之域右上），拖曳跨越需數百 px 且鬆手即停（無慣性），滑鼠拖曳地圖在桌機上吃力且不精準 — 每日回訪錨點（每日寶箱/世界首領倒數/模式入口/解鎖慶祝都在這張圖）的瀏覽體驗被捲動摩擦力拖累",
      "修正（map.js 單檔 12 行）：wrap 綁 wheel listener（passive:false + preventDefault 防頁面捲動干擾）— deltaY 垂直、deltaX（觸控板橫向）水平、Shift＋滾輪＝水平（桌機慣例）；deltaMode 1（Firefox 行單位）×16 換算；clamp() 防越界＋placeLabels() 名牌跟隨；canvas 視區由既有 raf loop 每幀重繪 — 零新增繪製迴圈/零新增每幀成本；hover 提示更新「滾輪捲動（Shift＋滾輪＝水平）」。拖曳路徑零變動（手機 100% 不影響）",
      "驗證：node --check 通過；瀏覽器實測（合成 WheelEvent 精確斷言）— 垂直 deltaY=120 → offY 前進 120（名牌 top 位移 -116.6px ∓ 縮放 kx 差）、水平 deltaX=120 → offX 前進 120、Shift＋deltaY → offX 前進、deltaMode=1 → ×16（1920px）、clamp 邊界（滾到右上緣後 offX/offY 停滯名牌 x 不變）、拖曳與滾輪混合無衝突（pointerup 後滾輪照常）；核心流程回歸全通過（王國→副本→英雄→裝備→建築→更多→頂欄世界地圖→滾輪捲動→模式入口→返回）；console 零 error/unhandledrejection；reducedMotion 路徑照常零錯誤（輸入層與渲染無關）；手機 390×844 迴歸 — 觸控拖曳照常（touch-action:none 已擋滾輪 gestur）",
      "留存理由：世界地圖是每日回訪的錨點畫面（寶箱/首領倒數/模式入口），而桌機玩家每一次探索都得「按住拖曳」跨 940×528 的世界 — 這張圖的瀏覽摩擦直接吃掉了重訪慾望；滾輪（＋觸控板橫向/Shift 水平）讓「掃視世界→點名前往」的探索節奏零摩擦，EHT 級桌機地圖標準互動到位 — 保留探索樂趣、讓每日回訪更順手；改動零數值/零存檔 schema/battle.js 零觸碰/零新增隨機性（純輸入事件）；快取 601→602"
    ]
  },
  {
    v: "v572", title: "卡牆自動再推 — 連敗退守練角完成後自動恢復自動進關（數值平衡與留存：卡關節奏/瓶頸閉環）",
    notes: [
      "診斷（瀏覽器實測＋全新存檔真實引擎步進）：v559/v560 連敗回退（3 連敗暫停自動進關＋遷移最佳練功點）修好卡牆死迴圈後，「練角完成→再推」仍全靠玩家手動 — 新檔首 session 實測（真實引擎步進 30 分鐘）：起始隊 6 分鐘推到第 10 關首領牆 → 滅團 3 次 → 引擎自動關閉自動進關＋遷移退守點；此後關卡/區域/每日任務 d2「推進 5 個關卡」/成就 a_s1「抵達第 10 關」全部凍結，金幣經驗照常累積但「推進」永遠停擺 — 教學第 2 步承諾「即使關掉遊戲也會持續成長」，而放置成長的「推進」半身（關卡/區域解鎖/任務/成就）在第一次卡牆就靜默斷裂，新玩家若沒發現「自動進關」開關，遊戲停在牆前一週；中後期同病（蒼穹之塔牆實測：退守後需手動重開自動進關才繼續推）— 「卡關→退守→練角→突破」迴圈的最後一步是手動的，放置承諾在此洩氣",
      "修正（引擎端自動閉環,零 UI 新按鈕）：game.js 在 simStep 前後以無歧義訊號偵測引擎退守（3 連敗 fallback = wipeStreak 歸零＋autoAdvance 被引擎關閉 — 手動切換不碰 wipeStreak、擊殺歸零不碰 autoAdvance，零假陽性）→ 記錄「牆點」（退守前的區域/關卡/難度）；此後每 2 秒檢查編隊戰力 ≥ 牆點建議戰力（以牆點原難度倍率計算）×1.15 → 自動恢復自動進關＋toast「已可突破『X・第 N 關』！自動進關已恢復 — 練角完成，繼續推進」＋戰鬥紀錄；玩家手動切換「自動進關」＝明確意圖 → 清除牆點 marker（練角專用契約保留，永不自動恢復）；覺醒重置同步清除；深淵（region 10）零觸碰（原無退守契約）",
      "驗證:node --check 全數通過;瀏覽器實測（全新存檔＋真實引擎步進,精確斷言）— ①首 session:6 分鐘牆點（r0s10・難度普通）→ aa=false＋aaPark={r:0,n:10,d:0} 實測;退守農點練角（注入等級/裝備成長後）→ 戰力 207 ≥ 牆點建議 180×1.15 → 自動恢復 aa=true＋toast 逐字確認＋marker 清除;恢復後自動續推:擊敗首領→區域 2 解鎖（maxRegionReached 0→1）全程零手動;②手動契約:引擎退守後玩家點「自動進關」關閉 → aaPark=null;隊伍再練強（戰力 3× 牆點需求）→ aa 維持 false（永不自動恢復）;③re-park:退守點仍打不過 → 再次 3 連敗 → aaPark 更新為新牆點（r0s6）;④引擎退守偵測零假陽性:手動關閉＋擊殺（ws 1→0,aa 不變）→ 無 marker;擊殺歸零（aa 維持 true）→ 無 marker;⑤舊存檔相容:無 aaPark 欄位零錯誤,首次退守自動建立;⑥雙視口整頁 reload＋核心流程回歸全通過,console 零 error/unhandledrejection;reducedMotion 路徑零錯誤（引擎邏輯與渲染無關）;效能:探針每 simStep 4 欄位讀取、恢復檢查 2 秒節流（formationPower 僅退守期間執行）",
      "留存理由:卡關是放置遊戲最高流失時刻 — v559/v560 已把卡牆變成生產性農點,但「農完再推」的手動缺口讓放置承諾在牆邊洩氣:新玩家第一次滅團就被靜默停在牆前（關卡/區域/任務/成就全部凍結,只剩金幣在漲）,中後期玩家睡前掛機醒來發現仍在舊牆;自動再推讓「卡關→退守→練角→突破」成為全自動迴圈 — 玩家睡前卡在首領牆,醒來已推過整區,放置遊戲「關掉也在成長」的承諾從第一天到終局全程兌現;改動零數值公式/零存檔 schema（aaPark 為選用欄位,舊檔零遷移）/零新增隨機性（偵測為確定性狀態比對）;快取 595→596;並行註記:v571 由並行 session 在途（建築 2.5D 斜頂面,快取 595）,本輪編號順延 v572"
    ]
  },
  {
    v: "v575", title: "建築重作至 Theo 官方規格（10-step 教學像素解碼）— 大菱形屋頂＋草地底座＋右下長陰影（等角地圖・美術與內容：官方比例精確落地）",
    notes: [
      "背景：v574 的「官方規格」是從 128×120 頁面插圖（非 sample_bmp 原檔，120/25=4.8 非整數縮放）分析，且屋頂誤用「右高左低斜頂面」— 使用者指出「完全不同了角度也不同」；本輪取得 Theo 本人官方教學「How to create a small building in 10 steps」（forum t=1233）全部步驟圖＋光影模板＋32×25 成品（sample10），逐像素解碼精確測量",
      "官方真實規格（像素實測）：①屋頂 = 菱形四坡（apex 高、佔建築高 ~64%；成品 apex (12,2) 左 (6,10) 右 (25,10) 底 (13,18)）— 不是斜頂面；②牆 = 菱形盒下半露出（左亮右暗、中稜線），被大屋頂蓋住大半；③草地 = 建築底部綠地外圈（前院草進 sprite；TheoTown 建築自帶基地草皮）；④陰影 = 右下長陰影（黑 20%、長度≈物高、「right wall throws shadow on grass」）；⑤窗框規則 = 亮側暗框/暗側亮框（步驟 5）；⑥煙囪在屋頂＋煙囪投影（步驟 7/9）；⑦光影模板 = 左亮右暗＋右側兩階陰影漸深",
      "修正：tools/gen-iso-art.cjs 重寫 — ttTheo 骨架（官方比例：大菱形四坡屋頂 apex y3 底 y19＋菱形盒牆下半＋草地底座＋右下長陰影＋屋頂右側兩階陰影）；11 棟全重畫（城堡主樓官方比例＋塔＋雉堞＋大門、9 棟角色色＋官方結構、民房官方小屋縮影）；窗統一暗藍＋亮側暗框/暗側亮框；每棟草地/陰影/煙囪投影",
      "驗證：node --check 通過；node 掃描 11 sprite — 216 色黑輪廓 0／sat>78% 0、底部行 28-29（32×32 含草地）／45（城堡）／15（民房）；ASCII 形狀 — 大菱形屋頂（佔高 53-64%）＋牆下半＋草地底帶＋右側陰影與官方 sample10 結構一致；瀏覽器實測 — 畫布右下陰影 106px／暗藍窗 142px（官方規格簽名色）、11683 色、console 零 error；截圖 progress/v575-theo-spec-buildings.webp",
      "留存理由：官方 10-step 教學是 TheoTown 建築畫法的權威來源 — 大屋頂/小牆比例、草地底座、右下長陰影正是「看起來像 TheoTown」的關鍵文法（v564-v574 全部缺少草地與長陰影、屋頂比例錯誤）；按像素測量精確落地後，村莊建築與官方 sample10 結構逐項一致 — 純美術資產層（生成器＋art 重生成），零座標/零數值/零存檔語義/map.js 零觸碰/零新增隨機性（全 seeded）；快取 600→601"
    ]
  },
  {
    v: "v574", title: "建築完全重作為 TheoTown 官方規格 — sample_bmp.png 規格文法落地 11 棟（等角地圖・美術與內容：官方規格全面重作）",
    notes: [
      "背景：v572 回退 v564（對稱等角盒）後，使用者以官方 demo 建築（sample_bmp.png）為規格要求「完全重作 mega idle 內建築」— 官方規格（像素解碼）＝前牆矩形多階明暗（主/亮/暗/深 4-5 階）＋磚紋（橫排暗線＋交錯直縫）、暗藍窗（avoid bright blue）＋窗台、深色斜屋頂（右高左低＋脊線亮＋瓦排）、右側牆暗偏藍、底部兩階＋深色底帶（菱形底座感）、角落 AO、左光源",
      "修正：tools/gen-iso-art.cjs 重寫 — ttOfficial 骨架（官方規格）取代 ttBox；11 棟全部重作：每棟牆 5 階（wall/wallHi/wallLo/wallDark/seam）＋磚紋＋AO＋底帶，窗統一暗藍 hsl(215,30,32)（煉金坊綠窗 hsl(140)），屋頂深色系（角色色相降明度至 26%）＋脊線＋瓦排；城堡（主樓官方規格＋左右塔＋雉堞＋大門＋3 暗藍窗）、9 棟（公會深紅頂米牆脊旗／訓練場平頂齒緣寬門／圖書館深藍頂大窗／鐵匠鋪黑煙囪＋爐火窗／煉金坊深綠頂藥瓶／市集棚攤／祭壇官方石台聖火／寶石坊深紫頂水晶／倉庫深棕頂雙門）、民房官方規格小屋",
      "驗證：node --check 通過；node 掃描 11 sprite — 解析真實定義、211 色黑輪廓 0／sat>78% 0、底部行 27-28（32×32）／39（64×48）／15（20×16）貼地契約保持；ASCII 形狀 — 深色斜頂面＋磚紋前牆＋門窗直立；瀏覽器實測 — 畫布暗藍窗 125px／城堡深藍屋頂 31px（官方規格簽名色）、11582 色、console 零 error；截圖 progress/v574-official-spec-buildings.webp",
      "留存理由：使用者指定以官方 demo 為規格 — 官方文法（多階磚紋/暗窗/深頂/底帶/AO）是 TheoTown 建築的品質核心；11 棟全部按此重作後，村莊建築與官方範例宅邸（b_tt_demo）同文法同框，全圖規格統一 — 純美術資產層（生成器＋art 重生成），零座標/零數值/零存檔語義/map.js 零觸碰/零新增隨機性（全 seeded）；快取 599→600"
    ]
  },
  {
    v: "v573", title: "TheoTown 官方範例建築正式納入村莊 — 南街「官方範例宅邸」（等角地圖・美術與內容：官方資產入駐）",
    notes: [
      "背景：v572 先以展示區塊將官方 sample_bmp.png 貼在村外空地（重採樣 PNG、無名牌、無陰影契約）；使用者要求「真的做進遊戲內不是放照片」— 正式化：sprite 檔改為正式資產（rows/pal 契約與全部建築同格式）、繪製移入 drawVillage 的 bld() 列表（貼地陰影＋底邊貼地＋scale 1.5 與其他建築同一繪製語彙）、位置南街南側 (13,26)（市集正南、倉庫東側空地，不壓街道/建築）",
      "修正：js/ui/map.js（移除 buildBase 尾展示區塊；bld() 列表加 b_tt_demo 13,26,1.5 正式行）、js/data/art/tt_demo.js（註解改正式資產：TheoTown 官方範例建築，來源 writing-a-sample-plugin sample_bmp.png 去背景藍＋2x 最近鄰＋16 階量化 26 色）、index.html（載入正式化，快取 598→599）",
      "驗證：node --check 通過；瀏覽器實測 — 村莊內宅邸灰牆 #b0b0b0 834px／藍窗 #90a0c0 189px／黑細節 32px 全在畫布（含貼地陰影）、11380 色、console 零 error；截圖 progress/v573-tt-mansion-in-village.webp",
      "留存理由：官方範例建築作為正式村莊建築常駐 — 與 11 棟 iso 建築共用 bld 繪製契約（陰影/貼地/名牌語彙）、玩家每天在村莊裡看到 TheoTown 官方品質的建築本體；純美術資產層＋繪製 1 行，零數值/零存檔語義/battle.js 零觸碰/零新增隨機性；快取 598→599"
    ]
  },
  {
    v: "v572", title: "建築回退至 v564 實作 — 對稱 2:1 等角盒（菱形四坡屋頂）恢復（等角地圖・美術與內容：依使用者決定回退 v569/v571 系列）",
    notes: [
      "背景：v569（2.5D 前牆+側牆+山牆）與 v571（官方指南斜頂面+瓦排+磚紋+AO+偏藍陰影）為後續重作版本；使用者明確要求「改回第一次用查到資料實作的結果」＝ v564（依 TheoTown 官方論壇 Learn Isometric Pixel Art 六規則實作的對稱 2:1 等角盒：菱形四坡屋頂、左亮右暗牆、中稜線、底部兩階漸暗、seeded 面雜訊）",
      "修正：tools/gen-iso-art.cjs 重建為 v564 版（isoBox 對稱等角盒取代 ttBox 2.5D 骨架、錐塔城堡＋雉堞＋大門、9 棟 isoBox 配置＋extras、民房正面山牆小屋），重生成 js/data/art/buildings_iso.js（11 sprite）",
      "驗證（與 v564 原版逐項比對）：node 掃描 — 188 色與 v564 掃描完全一致（v569 194 色/v571 193 色）、黑輪廓 0／sat>78% 0；底部行 25（32×32）／42（64×48）／15（20×16）與 v564 相同（v569/571 為 26-28/39/15 — 尺寸幾何已回歸 v564）；ASCII 形狀 — 菱形屋頂＋前角脊線＋錐塔＋雉堞與 v564 原圖一致；瀏覽器實測 — 城堡屋頂紅 138px 與 v564 驗證時 138px 完全相同（還原鐵證）、console 零 error；截圖 progress/v572-revert-v564.webp",
      "留存理由：使用者偏好 v564 的對稱等角盒風格 — v569/v571 的 2.5D 系列（前牆/山牆/斜頂面）依使用者決定放棄；生成器保留在 tools/ 可再切換；純美術資產層（生成器＋art 重生成），零座標/零數值/零存檔語義/map.js 零觸碰/零新增隨機性（全 seeded）；快取 596→597；並行註記：v570 由並行 session 發布，v571 為本人官方指南對齊版，v572 為使用者指定回退"
    ]
  },
  {
    v: "v571", title: "建築 100% 對齊 TheoTown 官方 2.5D 畫法 — 斜頂面屋頂＋瓦排＋磚紋＋AO＋偏藍陰影＋暗窗（等角地圖・美術與內容：官方指南逐項落地）",
    notes: [
      "診斷（下載 TheoTown 官方視覺指南（pca.svetikas.lt a-better-visual-guide-on-shading-shadows-and-detail，改編自官方論壇 t=25943）＋官方範例建築 sprite（sample_bmp.png）＋官方 1/2 roof 應用圖，node 像素解碼逐一對照）：v569 的山牆三角屋頂與 TheoTown 不符 — TheoTown 屋頂是「向右上傾斜的頂面」（平行四邊形，右高左低，1/2~1/8 斜率：官方指南 Part 5「numbers show how much you should raise a pixel for each horizontal pixel」＋image18/19 像素實測每 3 行擴 6px）；另官方規則逐條比對出 5 項缺失：①暗色偏藍（Part 2「shadows are slightly blue」，HSV 暗色靠 H=240）；②窗色要暗（Part 3「bright blue windows are to be avoided, pure black acceptable」— v569 窗 hsl(210,32,62) 亮藍）；③磚紋（官方範例前牆橫排暗線＋交錯直縫）；④角落 ambient occlusion（Part 6「dark transparent pixels at corners and edges」）；⑤瓦排（屋頂頂面斜向紋理）",
      "修正（tools/gen-iso-art.cjs 依官方圖逐項落地）：①屋頂改「斜頂面」— fillPoly 平行四邊形（左端 ty、右端 ty-rise，rise≈D×0.6 即 1/2~1/4 斜率），左半亮右半暗（光源左）、脊線亮（頂緣）、3 條沿坡向瓦排暗線、屋檐陰影（前緣下 1px）；②全部暗色（roofR/wallR/wallEdge/base/frame）hue 往藍偏移 +10~20°（暗色偏藍規則）；③窗 glass 改暗藍 hsl(210,18,32)＋glassHi hsl(210,25,44)；④前牆加磚紋（每 4px 橫線＋交錯直縫）；⑤四角 AO 暗像素；城堡/民房/祭壇色板同步偏藍；尺寸與貼地契約不變（32×32 底 26-28、城堡 39、民房 15）",
      "驗證：node --check 通過；node 掃描 11 sprite — 解析真實定義、193 色黑輪廓 0／sat>78% 0／暗色偏藍 14 色（官方 HSV 落地）；ASCII 形狀比對 — 屋頂為右高左低平行四邊形（house y2-5 收縮、guild y5-13 頂面＋y13+ 前牆）、門窗直立；瀏覽器實測 — 開圖建築色簇在（城堡屋頂紅 31px）、12062 色、console 零 error；截圖 progress/v571-buildings-shed-roof.webp",
      "留存理由：TheoTown 100% 視角的最後一哩是「屋頂是斜頂面不是山牆」＋官方五項細節（偏藍陰影/暗窗/磚紋/AO/瓦排）— 山牆屋頂讓建築像「教堂」不像 TheoTown 小屋；斜頂面＋官方細節全部落地後，村莊建築與 TheoTown 官方範例逐像素文法一致 — 純美術資產層（生成器＋art 重生成），零座標/零數值/零存檔語義/map.js 零觸碰/零新增隨機性（全 seeded）；快取 594→595；並行註記：v570 由並行 session 發布（英雄待機眨眼），本輪編號順延 v571"
    ]
  },
  {
    v: "v570", title: "英雄待機眨眼 — 六職業確定性閉眼 0.13s／3.4s 週期（動作與戰鬥呈現・角色動畫：待機隨機動作 P0 補完）",
    notes: [
      "診斷（瀏覽器實測＋幀資料掃描）：待機動作自 v325 只有「張望」（每 5s 一次 0.5s 側頭）— 六職業在戰場列陣與回村休息時眼睛永遠大張，0.13s 閉眼週期完全不存在；FF1 GBA 語彙的招牌「活著感」就是眨眼（同角色 idle 幀眼開/眼閉交替），EHT 級觀戰（每秒都在看自己的隊伍）角色像蠟像 — 待機隨機動作 P0 backlog（眨眼/張望/撓頭）只完成 1/3",
      "修正：確定性程序眨眼（無 Math.random、無新幀 — 純覆繪資產）— BLINK_EYES 表定義六職業眼睛像素（sprite 座標,frame 0，自幀資料實測:劍士 (6,6)(7,6)(6,9)(7,9) J/G 以膚色 H 覆蓋／弓手 (6,7)(7,7) 單眼帽影 A/C 以膚色 K 覆蓋／法師 (8,7)(8,8) 帽影下雙 B 以臉影 A 覆蓋／刺客 (6,7)(6,10) 金面具眼洞 A 以面罩金 G 覆蓋／騎士 (7,6)(7,9) 面甲縫暗 H 以甲金 E 覆蓋／牧師 (6,6)(7,6)(6,9)(7,9) B/H 以膚色 K 覆蓋）;blinkClosed(t,seed) = (t + seed*0.9) % 3.4 < 0.13 — per-seed 相位錯開（六人不同步）;繪製路徑 v568FIX：預烘焙 32×32 overlay canvas 以 drawImage 同 transform 覆繪（fillRect 於 bob 小數 y 會反鋸齒混色 67,67,65 — drawImage+smoothing=false 與主精靈同整數格對齊）;battle 列陣（與張望同閘:rm/攻擊/受擊/死亡不眨）＋回村休息場景（hunt.js drawTownScene）雙處接線;drawBlink 匯出供 hunt.js 共用",
      "驗證:node --check 通過;離屏像素斷言 — 六職業 blink ON 眼像素全變閉眼色（sword/priest +16px、archer/mage/assassin/knight +8px 精確）／OFF 全為原暗色;瀏覽器實戰關聯（drawBattle 包覆 12s 採樣）— 預期閉眼幀 59/59 與離屏同參數參考渲染逐位元一致;城內場景實測 duty cycle 3.4%（0.13/3.4 設計值 3.8%,40ms 採樣窗緣修剪）＋burst 週期 3.43/3.40s（設計 3.4s）＋零模糊幀;reducedMotion 路徑零眨眼零錯誤;雙視口（1280×800／390×844 DPR2）整頁 reload＋8s 實戰 soak 零 console error/unhandledrejection;核心流程回歸全通過（王國→副本→英雄→裝備→建築→更多→世界地圖→模式入口→回城待機）;截圖 progress/v568-blink-open-closed-zoom.webp（開/閉眼 6× 放大並排 — 左眼暗 16,14,11 右眼膚 234,212,154 像素實測）、progress/v568-town-blink-desktop.webp、progress/v568-town-blink-mobile-390.webp、progress/v568-battle-desktop.webp、progress/v568-map-mobile-final.webp",
      "留存理由:觀戰是放置遊戲的日常娛樂 — 玩家掛機時每秒都在看自己的隊伍,六職業眼睛永遠大張 = 蠟像感,「我的英雄是活的」的情感連結缺失;眨眼是像素角色最便宜的「活著」訊號（FF1 語彙招牌動作）,0.13s 閉眼週期讓列陣/休息中的英雄像真人一樣呼吸眨眼,待機隨機動作 P0（眨眼+張望）補完 — 觀戰從看血條變成看角色,掛機的每一分鐘都更值得看;純視覺覆繪層（render.js 一表一函數＋hunt.js 一行）— 零數值/零存檔 schema/battle.js 零觸碰/零新增隨機性/確定性渲染;快取 593→594"
    ]
  },
  {
    v: "v569", title: "村莊建築角度重作 — 對稱等角盒改 TheoTown 2.5D（前牆矩形＋側牆＋山牆屋頂）（等角地圖・美術與內容：全圖角度統一）",
    notes: [
      "診斷（sprite 資料對比）：v564 生成的 11 個村莊建築是「對稱 2:1 等角盒」— 兩面牆皆為斜平行四邊形、屋頂為菱形四坡（脊線在頂點-前角對角）；但 TheoTown 建築角度是「2.5D 正面化」— 前牆為垂直矩形（門窗直立）、右側牆沿 2:1 斜向後縮、屋頂為山牆（前坡＋右坡、脊線）；村外地標（v562/v567 的 box 矩形＋tri 三角）已是 2.5D 角度 — 村莊建築與全圖角度不一致，建築看起來像「方盒子」而非 TheoTown 小屋",
      "修正：tools/gen-iso-art.cjs 重寫 — isoBox 換成 ttBox（TheoTown 2.5D 骨架：前牆矩形 x cx±W、側牆平行四邊形沿 2:1、山牆屋頂前坡左半/右半亮＋右坡暗＋前脊亮、屋檐陰影、底部兩階漸暗）；城堡主樓改大 gable（前牆 30px＋側牆 7px）＋左右矩形塔（錐頂＋塔窗）＋屋檐雉堞＋中央大門；9 棟建築窗/門全部直立於前牆（窗 y 15-21、門 cx16 底 25-26）；民房 20×16 小屋（前牆 12px＋側牆 3px）；特徵重定位：公會脊旗、訓練場平頂平台＋齒緣（roofStyle flat）、鐵匠鋪煙囪右坡煙＋前牆爐火窗、煉金坊 apex 藥瓶、市集前牆攤台＋條紋棚、祭壇 2.5D 石台兩階＋聖火、寶石坊 apex 水晶簇、倉庫中央雙門",
      "驗證：node --check 通過；node 掃描 11 sprite — 解析真實定義、底部行 26-28（32×32）/39（64×48）/15（20×16）與 map.js 貼地契約一致、194 色黑輪廓 0／sat>78% 0；ASCII 形狀比對 — 民房/公會/城堡皆為「山牆屋頂三角＋垂直前牆＋側牆收縮」結構；瀏覽器實測 — 開圖後畫布建築色簇存在（城堡屋頂紅 35px／民房米牆 30px）、console 零 error；截圖 progress/v569-buildings-2d5.webp",
      "留存理由：TheoTown 的識別度一半來自「建築是直立的房子」（垂直牆＋斜屋頂），對稱等角盒在 tile 上像「攤平的鑽石」— 村莊與村外（地標）角度不一致會持續放大「風格斷層」感；2.5D 角度讓 13 棟村莊建築與 20 座地標共用同一視覺文法，全圖從 tile 幾何到建築語言完全統一 — 純美術資產層（生成器＋art 資料重生成），零座標/零數值/零存檔語義/map.js 零觸碰/零新增隨機性（全 seeded）；快取 592→593"
    ]
  },
  {
    v: "v568", title: "世界地圖全體 TheoTown 風格化 — 地標去黑框＋左上受光＋底部漸暗＋面雜訊（等角地圖・美術與內容：全圖風格統一）",
    notes: [
      "診斷（map.js 全繪製掃描）：v564 修好 11 個村莊建築 sprite 後，地圖其他層仍違反 Theo 官方六規則 — ①共用 box()/tri() 對 20 個地標（10 區域＋10 模式）全數畫 2px 黑框 #101018，礦坑口/巫婆屋頂/裂谷哨站另有手寫黑框，城角塔用 #14121f 描邊（規則 3 全圖違規）；②廣場/街道/城牆/道路/農田為平色塊無紋理（規則 6）；③城角塔錐頂 #c84848 高飽和（規則 2）；④地標 box 無受光/陰影面（規則 4/5）；海岸燈塔紅白橫紋高對比純色（規則 2/6）",
      "修正（全部在共用 helper 層，一地標未動座標/fx 錨點）：新增 shade()/speckAt()/speckTri()（seeded 確定性）— box() 重寫為「上緣+左緣受光、右緣+底兩階漸暗、面雜訊、零黑框」；tri() 重寫為「左半受光右半暗＋脊線亮＋三角內雜訊」— 20 個地標一次全體套用；手寫黑框 3 處改同系深階（#3a3a48/#4a5a30/#241a2c）；城角塔去 #14121f → 塔身左受光/右陰影/底漸暗，錐頂降飽和 #a85038＋頂緣受光；城牆改三線（主牆＋受光上緣＋陰影底緣＋磚縫，整數偏移防抗鋸齒）；廣場石板縫＋48 點塊面明暗；街道/道路/農田 seeded 噪點（菱形內判定）；村莊草地雜訊密度翻倍＋稀草尖；海岸燈塔降飽和（白 #dcdce4/紅 #a85038）＋每紋左右光影＋底漸暗（暖光燈窗/頂燈小件保留）",
      "驗證：node --check 通過；瀏覽器像素斷言 — 地標黑框 #101018 全圖 0px（改前 20 地標全帶；並行 v567 金飾小告示牌 1px 框 3 處為小尺寸對比保留）、城角塔受光 #9a9aa8 108px／陰影 40px／底漸暗 44px、城牆受光 #a0a0ae 12px／陰影 #5c5c6a 67px、錐頂降飽和 #a85038 46px 且舊 #c84848 0px、fallback 色 0；總色數 11992（雜訊層增加）；console 零 error（開圖路徑）；截圖 progress/v568-map-restyle.webp、progress/v568-map-restyle-final.webp",
      "v568 補漏（村外全盤點後）：LM_FX 動態層 3 處小旗/燈籠 1px 黑框（風車旗/瞭望塔旗/燈籠）改同系深階 #3a3a44 — 至此全圖 #101018 歸零（殘留 #14121f 僅村民小人角色輪廓，屬 TheoTown 角色語彙）；村外其餘物件盤點合規：模式地標 10 座（box/tri 套用）、碼頭/農田稻草人/乾草堆/每日寶箱/漁船/馬車皆低飽和木色系無黑框；快取 591→592",
      "留存理由：地圖是放置世界的第一印象與探索舞台 — 黑框平塊地標與 v564 建築（低飽和/光影/雜訊）同框時風格斷裂，等於告訴玩家「村莊是新做的、世界是舊的」；共用 helper 一次把 20 個地標＋村莊結構拉回同一 TheoTown 語彙（無框靠同系深階＋地面陰影分離、左上受光、底部兩階、seeded 面紋理），與並行 v567 金飾語彙相容（金飾疊繪在 box 之上）— 純繪製層改動（map.js helper＋色值），零座標/零數值/零存檔語義/battle.js 零觸碰/零新增隨機性（全部 seeded）；快取 590→591；並行註記：v567（區域地標金飾）由並行 session 發布，本輪編號順延 v568"
    ]
  },
  {
    v: "v567", title: "區域地標進階征服視覺（tier2/3）— 世界地圖永久記錄你的推進（等角地圖・美術與內容：進度爽點）",
    notes: [
      "診斷（瀏覽器注入多組進度存檔＋base 畫布像素比對＋程式碼稽核）：區域地標（風車/小屋/礦坑…10 座）只有「擊敗守關 BOSS」一階升級（tier 金旗/亮窗等），該區推過第 5 關、第 10 關時地圖零變化 — 注入 maxStageByRegion={0:1} 與 {0:5} 兩種存檔，風車塔身像素逐位元相同（tower 48184 一致），stage 10 也僅有 6px 小皇冠（v311）；玩家每天在地圖看到的，是自己打了一半的區域「看起來跟沒打過一樣」— 進度爽點只存在於數字，不存在於世界",
      "修正：地標新增第二維進度階（progTier）— 該區進度 ≥5 追加進階裝飾（tier2）、≥10 全通追加金底座＋主題金飾（tier3）；既有「擊敗 BOSS」tier 語義（金旗/亮窗/第二台礦車等）零變動；10 座地標各 2 層新繪製（全通金底座統一語言＋主題件：風車金束帶＋磨坊招牌／小屋第二亮燈窗＋金門框／礦坑金燈籠金軌道＋金拱／火山金符文＋雙火盆／冰晶金環＋雙金環／綠洲帳棚金帶＋第二帳棚／巫婆南瓜燈＋金湯／瞭望塔窗框金飾＋屋簷金邊／哨站柵頂金帶＋金旗／遺跡金符文＋柱頭金冠）；TheoTown 規則合規 — 全部 fillRect 直繪、零黑輪廓（R3）、金飾左亮右暗（R4）、seeded 面雜訊沿用、確定性（無 Math.random）",
      "驗證：node --check 通過；瀏覽器 base 畫布像素精確斷言（避開 drawImage 444→460 平滑混合，直接讀烘焙畫布）— tier0（prog1）：金飾全 0；tier2（prog5）：風車屋頂金束帶 5px＋門旁金麥束 4px、金底座 0；tier3（prog10）：金束帶 3px（部分被 v311 皇冠覆蓋，皇冠像素實測存在）＋金底座 18px＋磨坊招牌 4px＋金麥束 8px；多區存檔 pt 階梯 {0:3, 1:2, 2:2, 3:0, 4:0} 全對；小屋 tier2 屋簷金邊 10px＋第二窗 8px（金門框 0 = pt3 才繪）;礦坑 tier2 金飾 17px；對照組火山祭壇（prog3・tier1）金頂 38px 維持、tier2/3 金飾全 0（既有語義零變動）；reducedMotion=true 下 base 逐像素相同（belt 3/ring 18/sign 4/wheat 8）；雙視口（390px/1280px）console 零 error/unhandledrejection；核心流程回歸（王國→副本→英雄→裝備→建築→更多→世界地圖→區域名牌→副本「⤴ 大地圖」→返回→競技場地標 modal→回城待機）全通過、21 名牌＋21 熱區正常；截圖 progress/v567-map-desktop-tier3-windmill.webp（桌機・全通風車：金束帶+金底座+招牌+皇冠）、progress/v567-map-desktop-cabin-tier2.webp（桌機・森林小屋 tier2 亮燈窗＋屋簷金邊）、progress/v567-map-mobile.webp（手機）、progress/v567-diag-windmill-prog1/prog5.webp（修正前診斷）",
      "留存理由：世界地圖是玩家每日回訪的錨點，而「打了一半的區域看起來跟沒打過一樣」讓地圖無法兌現進度 — 玩家推關的動力有一半來自「世界會記住我」；tier2/3 讓每一次推進（第 5 關中點、第 10 關全通）都永久改變地標外觀：金束帶、亮燈窗、金底座、主題金飾 — 掛機世界變成可蒐集的征服戰利品（完成 10 區全通的視覺成就動機），每天開地圖都能看見自己打到哪、還差哪幾關，卡關→突破的循環在世界層面有了回饋 — 純繪製層改動（map.js 一地標 2-6 個 fillRect），零數值/零存檔 schema/battle.js 零觸碰/零新增隨機性（全部確定性靜態烘焙）；快取 584→590（含測試期快取試誤）"
    ]
  },
  {
    v: "v566", title: "轉場/首領/新區域橫幅移出標題列疊印帶 — 每關推進的進度宣告重新可讀（UI/UX 與品質：資訊可讀）",
    notes: [
      "診斷（瀏覽器幾何實測，手機 390px＋桌機 1280px）：副本畫布的轉場橫幅（邏輯 y54-88）自 v186/v201 在畫布頂覆蓋區新增「⚔收益列」與「隊伍/建議戰力列」後即整段疊印在 DOM 標題列背後 — 手機：橫幅帶 101-127px 與 DOM 行 101-131px 全疊（橫幅文字被「隊伍 542／建議 60・穩過」行蓋住）；桌機：橫幅 123-155px 被 DOM 覆蓋區 82-159px 整段遮住（完全不可見）；每 30-90 秒一次的關卡推進、首領登場（「BOSS：X・機制」）、以及全遊戲最重要的進度時刻「新區域解放」橫幅全部以暗帶＋金框殘影的形式埋在文字行背後 — 放置遊戲的「進度爽點」在每一次跳動時都以亂碼呈現；休息倒數橫幅（y14-56）同病：倒數文字被 DOM 進度條蓋住",
      "修正：全部畫布橫幅下移至 DOM 覆蓋區（邏輯 ≤93）與戰鬥場景（怪物血條 ≥156）之間的空曠天際帶 — 轉場/首領橫幅帶 y54→100（34 高、文字基線 76→122、首領脈動底線 87→133），休息倒數橫幅 y14→100（42 高、文字 36→122、進度條 44/45→130/131）；兩視口幾何：手機新帶 136-169px vs DOM 131px 底緣（5px 間距）、桌機 166-198px vs 159px（7px 間距）；與怪物血條（≥218px CSS）零重疊；reducedMotion 路徑零變動（純靜態帶）",
      "留存理由：關卡推進、首領登場、新區域解放是放置遊戲觀看頻率最高的「進度心跳」— 玩家留下來的動力來自「每次推進都有看得見的回饋」；橫幅疊印讓每一次心跳都以暗帶殘影呈現（手機）或直接消失（桌機），新區域解放這種里程碑級時刻的慶祝感被吞掉 — 修復後每關轉場的「第 N 關」、首領的機制宣告、新區域的金色解放橫幅都乾淨可讀，觀戰節奏與「再推進一關」的慾望直接接上；純畫布座標調整（render.js/hunt.js 共 3 段帶位），零數值/零存檔語義/battle.js 零觸碰/零新增隨機性；快取 582→583"
    ]
  },
  {
    v: "v565", title: "新存檔「自動續戰」預設開啟 — 派遣制首次滅團不再讓放置迴圈靜止（玩法機制與耐玩性：循環深度/進度爽點）",
    notes: [
      "診斷（瀏覽器實測全新存檔走教學＋派遣）：自 v13 派遣制起「自動續戰」（hunt.autoDispatch）預設關閉、且教學六步驟從未提及 — 新玩家的放置迴圈在首個 5 分鐘內就斷裂：起始英雄（★★ Lv1・戰力 89）對翠綠草原第 3 關僅能撐 2 殺（實測 2 隻擊殺後倒下）→ 回村休息 20 秒 → 遊戲完全靜止（3 分鐘採樣 kills/gold/exp 全數凍結），畫面只剩「編隊就緒 · 1 名英雄待命 — 立即派遣」卡 — 玩家必須每 30-40 秒手動點一次派遣，或自己發現「自動續戰」開關才解除；教學第 2 步白紙黑字承諾「即使關掉遊戲也會持續成長」— 而第一次滅團後線上迴圈即刻停擺，放置核心承諾（掛機=持續成長）在第一次 session 就被打破；對比 mid/late 玩家掛機迴圈（派遣一次→自動戰鬥→滅團→休息→待機→手動再派遣）— 這是全遊戲最頻繁的「死亡→重派」節奏，卻沒有任何預設或教學承接",
      "修正：新存檔（MG.core.save.newState）的 hunt.autoDispatch 預設值改為 true — 新玩家首次按下「派遣」後，滅團休息完畢自動重新派遣當前編隊（battle.js retreat 結束分支既有契約，行為零變更），放置迴圈自此永不靜止：滅團→休息 20 秒→自動再戰→連敗 3 場照常退守最佳練功點（v560 契約）並在農點持續自動練角；教學第 2 步文案同步明示「就算滅團，休息後也會自動再戰（「自動續戰」預設開啟）」；既有存檔零變動（normalize 的 Object.assign 保留已存 autoDispatch 值，僅缺欄舊檔補缺）、開關/召回/編隊/深淵連續挑戰（abyss.autoRetry 獨立分流）契約全數不變；改動 2 行（save.js 預設值＋tutorial.js 文案）",
      "留存理由：放置遊戲的第一次 session 是留存率最高的斷點 — 新手在教學指引下按下派遣，30 秒後目睹自己的隊伍倒下、再 20 秒後遊戲毫無反應地靜止，教學承諾（「關掉也會持續成長」）在眼前被打破，玩家學會的第一件事是「這遊戲需要我一直盯著按」— 與放置品類的核心期待（設定好就自己跑）直接衝突；預設開啟後，首次派遣就是最後一次手動介入 — 之後每次開遊戲看到的都是「正在打／正在休息／自動再戰中」的活著的世界，等級、金幣、裝備在掛機中持續累積，教學承諾變成事實；對既有玩家零影響（保留各自開關），對新玩家把「遊戲死了」的體驗從第一天移除 — 純機制預設值＋教學文案，零數值/零存檔 schema 變更/零新增隨機性/battle.js 零觸碰；快取 581→582"
    ]
  },
  {
    v: "v564", title: "村莊建築等角美術補完 — 城堡/9 棟建築/民房自 fallback blob 重繪為 TheoTown 風格（等角地圖・美術與內容：村莊建築 P0 補完）",
    notes: [
      "診斷（sprite 註冊表掃描＋node 實測 sprites.get）：地圖繪製呼叫 b_castle_iso / b_guild_iso / b_training_iso / b_library_iso / b_forge_iso / b_alchemy_iso / b_market_iso / b_altar_iso / b_gemworks_iso / b_warehouse_iso / b_house_iso 共 11 個 sprite — 但全倉庫搜尋零定義（v278 worldmap 合併時 iso 美術遺失）→ 全部落 fallback：16×16 灰圓 blob（#7a7f9c＋#14121f 黑框）— 地圖上城堡/9 棟建築/3 民房自合併起以灰 blob 呈現，與區域地標（風車/小屋/碑塔：多部件＋陰影＋細節）及 v562 模式地標嚴重斷層；而村莊是玩家每日回訪的錨點（點建築升級/派遣的起點），視覺承載與內容價值不成比例",
      "修正：tools/gen-iso-art.cjs 依 Theo 官方等角像素規則程序化重繪 11 個 sprite（64×48 城堡＝中央主樓＋左右錐塔＋雉堞＋大門＋雙旗；9 棟 32×32 各帶角色特徵 — 公會脊旗/訓練場平頂齒緣/圖書館大窗/鐵匠鋪煙囪煙＋爐火窗/煉金坊屋頂藥瓶/市集條紋遮陽棚＋攤台/祭壇石台聖火/寶石坊紫水晶簇/倉庫雙門；民房 20×16 山牆小屋）— 六規則全數落地：①低飽和基色（屋頂 sat 50-70%、牆 15-35%，188 色掃描零 >78%）；②零黑色輪廓（同色系深階做邊緣，#14121f 出現數 0）；③左上受光（左坡/左牆亮、右坡/右牆暗、中稜線暗）；④底部兩階漸暗（base/baseHi 過渡）；⑤seeded 面雜訊（同色系 ±亮度 speckle，重繪不變）；⑥2:1 等角菱形屋頂統一比例；輸出靜態 rows/pal 進 js/data/art/buildings_iso.js（新 art 域，sprites.get 自動解析，零 runtime 邏輯變更）",
      "驗證：node 實測 11 個 sprite 全數解析為真實定義（尺寸 64×48/32×32/20×16 與 map.js 繪製常數一致）；風格規則掃描 188 色：黑輪廓 0／sat>78% 0／明度<12% 0；瀏覽器實測：開啟世界地圖後畫布 10639 色（改前無建築色）— 紅瓦 451px／石牆 606px／米牆 236px 建築色簇存在、舊 fallback 色 #7a7f9c 出現數 0；console 零錯誤；截圖 progress/v564-iso-buildings-map.webp",
      "留存理由：村莊是放置世界的第一印象與每日儀式起點（開圖→點建築→派遣）— 11 個灰 blob 讓核心城鎮看起來像未完成品，直接拉低玩家對世界內容的期待；重繪後村莊從「佔位符」變成與區域地標同級的視覺密度（EHT 級），每日回訪的地圖本身值得一看，建築角色（公會旗/鐵匠爐火/市集棚）讓升級與經營的對象有辨識度 — 純美術資產補完（新增 art 檔＋生成器工具），零數值/零存檔語義/battle.js 零觸碰/零新增隨機性；快取 580→581"
    ]
  },
  {
    v: "v563", title: "職業攻擊動作差異化 — 刺客突刺／騎士盾頂專屬攻擊幀（動作與戰鬥呈現・角色動畫：職業動作差異化 P0 補完）",
    notes: [
      "診斷（幀資料掃描＋渲染器路徑比對）：v324 只讓遠程（弓手拉弓/法師舉杖）有差異 — 四個近戰職業（劍士/刺客/騎士/牧師）在揮擊主幀共用同一 frame 2、同一 lift 6，畫面上只有顏色不同、動作完全一致；FF1 GBA 語彙的七幀資料裡 F5/F6（攻擊B/受擊）自 v222 三段式重寫後成為孤兒幀 — 職業差異化的資產槽位存在但閒置；戰鬥畫面是放置遊戲觀看頻率最高的畫面（每秒都在跑），六職業打起來像同一種職業的換色版，職業幻想（弓手拉弓/法師舉杖/刺客突刺/騎士盾頂）只剩一半",
      "修正：新繪製 2 個職業特化攻擊幀（F7 幀段契約）— ①刺客「突刺」：雙匕首向前刺出（A 黑尖＋KK 刃延伸至 sprite-left，翻轉後正對怪物側）＋前腿弓步、後腿蹬地，lift 4 低身前刺；②騎士「盾頂」：金色鳶盾自腰際舉至胸前（L/E 盾面抬升 5 列、盾緣覆胸）＋身體後縮靠盾、雙足踏地，lift 6；兩幀的頭/盔列（0-4）與 F0 逐字元一致（同一角色契約 — 側/正/背並排可辨識），僅刺客/騎士擁有 F7（無 F7 職業經 draw 超界 clamp 回退原幀 2）；render.js 揮擊主幀改為職業選幀（strikeF = assassin/knight ? 7 : 2）＋職業 lift；施法/前搖/收招相位維持 v222 原契約零變動",
      "留存理由：戰鬥演出是放置遊戲的「觀戰娛樂」核心 — 玩家盯著自己的隊伍每秒都在攻擊，六職業若動作完全同構，編隊的意義只剩數值；職業特化動作讓「我練的刺客真的在突刺、騎士真的在舉盾」成為可見的選擇回饋，觀戰時一眼分出誰在打、職業幻想完整兌現（弓手拉弓→法師舉杖→刺客突刺→騎士盾頂 P0 全數落地）— 角色養成與編隊的成就感從數字延伸到表演，掛機觀戰的樂趣與「再練一隻別職業看看」的動機同步提升；純動畫資產級改動（新幀＋選幀），零數值/零存檔語義/battle.js 零觸碰/零新增隨機性；快取 579→580"
    ]
  },
  {
    v: "v562", title: "模式地標精緻化 — 10 個模式入口對齊區域地標水準（等角地圖・美術與內容：模式地標 P0 backlog 完成）",
    notes: [
      "診斷（瀏覽器實測手機 390px，1×/1.5× 雙縮放）：10 個模式入口地標（競技場/王者競技場/試煉秘境/世界首領/元素試煉塔/奇境迷宮/公會盛宴/限時活動/無盡深淵/委託遠征營）自 v278 移植起只是 1-3 個平色塊 — 競技場=單層灰矩形、公會盛宴/試煉秘境等名牌下「看不出任何建築」— 與同一張地圖上的區域地標（風車/獵人小屋/冰晶塔/金字塔：多部件＋陰影＋細節）明顯斷層；而模式入口是玩家每天點最多次的地圖元素（每日儀式：開圖→競技場/秘境/世界首領/活動→一鍵例行），地圖的視覺承載與內容價值不成比例 — 每日報到的地方看起來像未完成品",
      "修正：10 個模式地標全部重繪至區域地標水準 — 石環鬥場＋四角柱＋雙旗（競技場）、三層石台＋勝利柱拱門＋金冠 fx（王者競技場）、雙層石碑＋碑冠＋側火把（試煉秘境）、石土台＋頭骨紀念碑＋交叉獸骨（世界首領）、分層石塔＋四元素窗＋拱門＋金尖（元素試煉塔）、外籬＋內牆迷宮＋拱門金燈（奇境迷宮）、茅頂宴棚＋掛燈＋長桌盛宴（公會盛宴）、條紋棚＋三張告示看板（限時活動）、裂口石壁＋下沉階梯＋紫焰石燈（無盡深淵）、帳篷營地＋營火＋補給箱（委託遠征營）；同步：10 個地標動態 fx 重新錨定到新藝術（旗在旗柱頂/金冠坐拱梁/符文疊碑面/紅點在頭骨/光芒繞金尖/金燈掛拱門/紫光出裂縫/營火跳火堆），鎖定遮罩依 LM_ART 包覆盒全高覆蓋＋鎖定時跳過地標 fx（不再洩漏皇冠/燈火/幽光），徽章點錨於地標右上角不與新藝術重疊；薄層結構補台面高光避免 2px 描邊吞掉石材",
      "留存理由：地圖是放置世界的第一印象與每日回訪舞台 — 每天點的模式入口如果看起來比探索到的區域地標簡陋，玩家對「世界還有內容」的期待感會下修；入口精緻化讓「今天要去挑戰/領取的地方」在視覺上值得一去（EHT 級地圖密度），地圖的探索感與每日儀式的儀式感同步提升 — 純美術資產改動，零數值/零存檔語義/零互動邏輯變更；快取 578→579"
    ]
  },
  {
    v: "v561", title: "副本主畫面「編隊就緒」待機指引 — 滿編玩家不再被「尚未編入英雄」矛盾遮罩誤導（UI/UX 與品質：指引/資訊可讀/操作流暢）",
    notes: [
      "診斷（瀏覽器實測新檔＋注入中後期存檔，手機 390px 雙視口）：主畫面空態遮罩以 F.team（派遣中隊伍）判定顯示 — 但自 v13 派遣制起「編隊」與「派遣」分離：滿編 5 人未派遣時，遮罩照樣蓋住整個戰鬥區並寫「出戰隊尚未編入英雄」＋「前往英雄分頁編入英雄」CTA，與下方「派遣 5 人」按鈕、滿員編隊列（5/5・戰力 9037）、狀態卡「待機中 — 按下派遣」直接矛盾 — 每個回訪玩家在核心儀式（開遊戲→派遣→掛機）的第一步就被遊戲告知一件已做完的事，被導去英雄分頁發現編隊已滿（死路引導）；休息中亦同框（遮罩＋畫布「全軍回村休息中」倒數）；另 recall 後 F.team 殘留（dispatchIds 清空後 battle.step 不再運行、team 不重建），F.team 本就非派遣狀態的可信來源",
      "修正：coach 改以 dispatchIds（與場景繪製同源唯一真相）三態分流 — ① empty（編隊真空）：保留原教學遮罩（新玩家/全員移出編隊時才出現，語義正確）；② ready（滿編待機）：改為輕量「編隊就緒 · N 名英雄待命」金框卡（半透明底、置於關卡標題列之下、不遮城鎮場景與標題），一鍵「立即派遣」直開派遣目的地視窗 — 睡前派遣儀式從「讀一段矛盾文案→白跑英雄分頁→折返」變成「一眼確認→一鍵」；③ hidden：派遣中/休息中（畫布自繪狀態，遮罩不再與休息倒數/戰鬥同框）；4Hz syncDom 僅在模式或人數變化時重建內容（零每幀成本）",
      "留存理由：開遊戲→派遣是每日回訪的第一個動作，也是離線收益（睡前派遣）的前提 — 這一步被「遊戲說謊」阻斷（滿編卻叫你去編英雄）直接消耗玩家對遊戲的信任與耐心，每日儀式摩擦→回訪慾望流失；修正後主畫面待機時不再有任何矛盾資訊，且滿編玩家獲得一個比「派遣 5 人」更近的單鍵入口（遮罩按鈕 vs 下方按鈕列），睡前派遣的完成率與離線掛機開始率同步提升 — 掛機價值（離線收益）在每次關閉前被更可靠地啟動；純 UI 顯示層，零數值/零存檔語義/battle.js 零觸碰/零新增隨機性；快取 577→578"
    ]
  },
  {
    v: "v560", title: "連敗回退目的地 = 最佳練功點 — 卡牆掛機收益崩潰修復（玩法機制與耐玩性：循環深度/卡關→突破）",
    notes: [
      "診斷（瀏覽器注入中後期存檔 kl29・1.25 萬戰力實測）：自動進關把隊伍推進「可贏但效率崩潰」的卡牆點 — 蒼穹之塔 BOSS 牆實測 456 金/秒，而引擎掃描的最佳農點（詛咒沼澤 s6 夢魘）1819 金/秒 = 4×；更糟的是 v559 連敗回退只退 1 關（s9 普通 708 金/秒）仍只有最佳的 39% — 玩家睡前開自動進關，醒來發現掛機收益悄悄掉了 3-4×，卡牆狀態下金幣/經驗流動近乎停滯，放置核心承諾（掛機=穩定成長）在牆邊斷裂；而遊戲早已具備「最佳練功點」掃描（v236 派遣視窗），卻從未用於自動退守 — 系統知道答案但不執行",
      "修正：bestFarmSpot/stagePowerReq 搬移至引擎端（battle.js 單一來源，派遣視窗同源呼叫，防兩處公式漂移）；連敗回退（3 連敗，引擎執行，隱藏分頁同樣生效）目的地由「退 1 關」升級為「遷移至最佳練功點」（可穩過 tp≥req 中單場收益最高，含難度/關卡/區域全掃描）— 退守即自動前往最佳農點，練角效率 4×；autoAdvance 照常暫停（v559 契約保留）、深淵 index 10 照常排除、無更優點時退回原退守邏輯（stage-1/難度-1 不變）、pendingHp 遷移時清空（新地點=全新戰鬥）；toast 明示新落點「連敗三場，已自動移至最佳練功點「詛咒沼澤・第 6 關・夢魘」練角（自動進關已暫停）」",
      "留存理由：卡關是放置遊戲最高流失時刻 — 掛機時玩家不可控，收益悄悄掉 4× 而無任何訊號 = 「我掛了一晚但什麼都沒發生」的直接來源；修復後卡牆自動轉為「全圖最優農點練角」，掛機價值回到峰值，玩家醒來看到的是 4× 的練角進度，練完一鍵再推（自動進關），「卡關→退守→練角→突破」節奏完整閉合 — 放著掛機的每一小時都值得；改動零數值公式/零存檔 schema（無新欄位）/零新增隨機性，純引擎行為 + 既有掃描邏輯搬家；快取 576→577"
    ]
  },
  {
    v: "v559", title: "連敗回退暫停自動進關 — 卡牆死迴圈修復（數值平衡與留存：卡關節奏/瓶頸）",
    notes: [
      "診斷（有機模擬：全新存檔以真實引擎步進 48 小時＋自動管理 bot，再注入同狀態 2 小時對照）：v13 的兩個功能互相抵銷 — 連敗回退（3 連敗退一關）的退守關卡在擊殺第一隻後就被自動進關拉回 BOSS 關，卡牆掛機變零進度死迴圈：實測軌跡 8:9→8:10→8:9→8:10 擺盪，2 小時僅 26 殺/h、約 5k 金/h — 同隊在穩定農點的速率（killT 2.4s ≈ 1500 殺/h、70 萬金/h）的 ~1/100，唯一進度是 pendingHp 對 BOSS 的緩慢磨血",
      "修正：連敗回退觸發時（引擎端 battle.retreat，隱藏分頁同樣生效）同步暫停自動進關（st.hunt.autoAdvance = false，僅普通區域；深淵 index 10 維持原爬塔 chip 契約）— 退守關卡從「一站即走」變成穩定農點（連敗回退每 3 敗再退一關，直到可農）；玩家練角完成後用狩獵頁既有的「自動進關」按鈕手動再推，再敗再自動暫停，迴圈閉合；fallback toast 改為「連敗三場，已自動退至第 X 關練角（自動進關已暫停）」",
      "留存理由：卡關是放置遊戲最高流失時刻 — 掛機看不到任何進度（金幣/經驗停滯、隊伍反覆滅團）玩家直接關遊戲；修復後卡牆狀態自動轉成「退守練角」的生產性掛機（金幣/經驗/掉落照常流動），挫敗感變成明確下一步（練角→開自動進關→突破），「卡關→突破」節奏持續運轉；改動零數值公式/零存檔 schema（autoAdvance 為既有欄位，預設 true 不變）/零新增隨機性；快取 575→576"
    ]
  },
  {
    v: "v558", title: "BOSS 機制作用量化回饋＋英雄側浮字修復（動作與戰鬥呈現）",
    notes: [
      "診斷（瀏覽器實測火山/冰原/樹林三首領戰）：再生/吸血的血量回升完全靜默 — 同步步進實測吸血首領 t=20.5→21 英雄輸出 ~130 僅扣 43 血（吸血 ~87 隱形抵銷），事件流零回血事件；護盾開戰 8 秒半傷只有光圈無數字、劇毒 tick 與普攻同為紅字 — 五機制「存在」有常駐視覺（v297）與血條下 chip（v545），但「作用瞬間」全無量化線索，玩家無法判斷為何傷害不推進（DPS vs 回血決策黑箱）",
      "修正 1（回血量化）：battle.js 再生分支累計實際回復量（HP 數值軌跡逐位元不變），每秒 flush 一次 mheal 事件；吸血分支每次攻擊推送實際回復量（clamp 精確）— UI 於首領位置跳綠色 +N 浮字＋fx_heal 粒子＋0.28s 全屏綠閃（與白閃語彙對稱；reducedMotion 全數跳過）",
      "修正 2（劇毒 tick 區分）：mhit 事件帶 poison 旗標（引擎既有）→ 浮字改紫 #c792ea（與玩家毒 dot 同色系 — 機制傷害 vs 普攻紅字一眼可分）＋毒霧粒子",
      "修正 3（英雄側浮字 v1 級 bug）：consumeEvents 以陣列索引 TEAM_POS[...][0]/[1] 取座標，但 TEAM_POS 條目是 {x,y} 物件 — undefined+20=NaN → 英雄出手傷害/治療/受擊/升級浮字自初始提交（f8e0276）起全數不可見（僅怪物側 (320,…) 浮字正常）— 改 .x/.y 後全部復活，吸血/劇毒英雄側浮字位置正確",
      "驗證精確斷言：吸血 3 事件 sum(mheal)≡Δhp+heroDmg（±3 內）；clamp 邊界 hp=maxHp−3 開戰即攻 → amt=3 精確；再生 1/s flush 3 事件、單次 amt≈0.008×maxHp（±2）、含未 flush 尾段不變式 sum+healAcc≡Δhp+heroDmg；50% 以上零事件；rm 下事件照發、浮字/粒子/綠閃零輸出；canvas fillText 實測 +101/+127 綠字、毒 tick #c792ea|-9 於英雄座標 (64,144)、英雄側白字傷害復活（-49@80,160）",
      "留存在理由：BOSS 戰是最高戲劇性時刻 — 回血量化把「我打不動」變成「牠每秒回 82，我 DPS 夠不夠」的可決策資訊，玩家能判斷爆發/強化/換關；劇毒紫字讓英雄血條下跌的歸因可讀；英雄側浮字修復讓整場戰鬥的數字資訊密度（EHT 級）一次到位 — 純視覺/事件層，零數值/零存檔語義變更；快取 574→575"
    ]
  },
  {
    v: "v557", title: "地圖點擊命中修正 — 麥田/每日寶箱/野生怪物手機可點（等角地圖）",
    notes: [
      "修復地圖互動命中偏移：點擊判定原把 CSS 點擊座標直接與「邏輯座標」命中點比較（fx 層以 sx/sy=(世界-off)×VW/cw 繪製並儲存命中點），但畫布世界→CSS 恆為 1:1（v551 同源）— 手機欄寬 366px 時 VW/cw=1.257，命中點偏離可見物 25.7%（≈90px）：實測麥田 tile 繪於 (350,348) 卻須點 (440,437) 才收穫、每日寶箱與野生怪物同理 — 三項地圖互動在手機上「看得到點不到」（桌機 cw=444 誤差僅 3.6% 被命中半徑吸收，故 v295/v296/v298 驗證未察覺）",
      "修正：點擊座標 CSS→邏輯轉換（mx=(e.clientX-r.left)×VW/cw）再與命中點比較 — 麥田/每日寶箱/野生怪物命中點與可見物對齊，手機實測：麥田繪製處點擊即收穫（+26.4萬）、每日寶箱繪製處點擊開啟（+330萬・虛空碎片×4）、野生魔物繪製處點擊收服（+99.1萬）；舊幻影位置點擊不再命中；15s/60s 冷卻與拖曳防誤觸不變",
      "每日寶箱是地圖上的每日回訪錨點（v296），農田收穫與野生賞金是「在地圖上順手一撈」的微獎勵迴圈 — 手機玩家點不到等於三項互動全失效，地圖淪為純觀賞；修正後放置以外的「動手點一點」樂趣在主要平台上復活；純 ui/map.js 點擊座標轉換（2 行＋註解），零數值/零存檔語義/battle.js 零觸碰；快取 573→574"
    ]
  },
  {
    v: "v556", title: "今日待辦登入儀式回歸（王國主頁每日面板 — UI/UX）",
    notes: [
      "v279 像素風復原合併重寫 kingdom.js 時，v196 起累積的「今日待辦」整段遺失（git 比對實錘：cb4d421 移除 624-710 行）— 14 個每日/週錨點（任務/簽到/競技場/王者/秘境/特惠/世界首領/活動/盛宴/投餵/元素塔/深淵/迷宮/遠征）從王國主頁消失，v263「一鍵例行」runner 全部死代碼化：玩家開遊戲看不到「今天還有什麼沒做」，登入儀式（AFK Arena 式每日面板）斷線",
      "回歸實作：今日待辦列（金框=未完成/可執行、灰框=已完成/鎖定）＋「一鍵例行」（免費批次掃蕩）＋「一鍵領取全部」（9 來源 claimAll 家族）掛回王國概覽；深淵行補「未解鎖」語意（與地圖地標同源 unlocked()）；簽到行修正 days=[bool×30] 順序制（原 includes(日期) 恆 false — 簽到完仍亮「未簽」）；任務行以 d.prog≥target 計完成數（原只看 done=已領取）；overviewSignature 納入 14 錨點狀態（2Hz 廉價唯讀）— 待辦行隨進度活更新；more.js 補匯出 openWelcome（d7 傳說選角窗）",
      "純 UI 層回歸（kingdom.js＋more.js 匯出行）— 零數值/零存檔 schema/battle.js 零觸碰；既有 sys runner 契約（runSweep*/runAutoTower/runAbyssFight/claimAll*）全數沿用；快取 572→573"
    ]
  },
  {
    v: "v555", title: "設定頁開發者功能（作弊按鈕＋13 支平衡拉桿）",
    notes: [
      "設定 → 開發者功能：啟用開發者模式後顯示「作弊（資源）」10 個即時按鈕（金幣+100萬/鑽石+1000/招募券+100/榮譽+1000/魔法書+100/素材+100/全員回滿/招募英雄×5/解鎖全部區域/王國+1級）、「作弊（開關）」一擊必殺與我方無敵、「平衡拉桿」13 支（金幣獲取/英雄經驗/掉落率/素材掉落/魔物血量/魔物攻擊/英雄攻擊/英雄防禦/英雄生命/離線收益/離線時數上限/金幣成本/訓練經驗）",
      "拉桿掛在既有公式聚合點：loot.rollKill（金幣/經驗/素材/裝備/寶石/書/藥水/BOSS 券）、loot.scaledMonster（魔物數值）、hunters.effectiveStats（英雄數值 — 戰力/競技場/世界首領自動繼承）、battle.attack（一擊必殺）與魔物/毒/AOE 三傷害路徑（無敵）、save.offline（離線倍率與時數上限）、train/recruitCost/enhanceCost（成本）、trainExp（訓練經驗）",
      "關閉開發者模式即回歸正常平衡（balance()/cheats() 回傳預設值）；設定持久化於存檔（settings.dev 深度補齊遷移）；純本地單機調試用，不影響任何線上數值；快取 571→572",
      "v555 補：每支拉桿下方顯示可見說明文字（調整對象・預設值・範圍效果 — 行動裝置無 hover tooltip，說明直接內嵌）",
      "v555 補：倍率拉桿上限全數開放至 ×50（金幣/經驗/掉落/素材/魔物/英雄/離線/成本/訓練經驗 — 說明文字同步更新；離線時數上限維持 48h）"
    ]
  },
  {
    v: "v554", title: "無盡深淵最佳層數污染修復（深淵長線目標階梯復位 — 玩法機制）",
    notes: [
      "修復深淵進度污染：noteKill 原缺 inAbyss 守衛（weekPeak 有、best 沒有）— battle.js 每殺都呼叫 noteKill(stage)，普通區域 stage 1-10 擊殺會把 abyss.best 頂到對應關卡數：實測 kl28 存檔「尚未踏入深淵 最佳 10 層」＋「抵達第 10 層」里程碑可白領（30 鑽）＋首進直接從第 10 層（領主層）開打＋建議戰力錯錨 3.14 萬（實為 10 層值，第 1 層僅約 200）— 深淵階梯（10/25/50/100…1000 層里程碑＋週結算）對所有玩家全面失真，長線目標失去意義",
      "修正後：僅深淵內擊殺更新 best/weekPeak；舊存檔自動遷移（best≤10 且無任何深淵週紀錄 → 重設 0，首進從第 1 層開始；有 weekPeak/weekBest 紀錄者不受影響）；里程碑、首進層數、建議戰力、徽章碎片週限庫存、素材兌換上限全部回歸真實深淵深度",
      "純 js/sys/abyss.js 單檔邏輯修正 — 零 UI/零數值/零存檔 schema 變更（optional 欄位僅重算）；快取 570→571"
    ]
  },
  {
    v: "v553", title: "建築高級成本曲線阻尼（王國階梯復活 — 數值平衡）",
    notes: [
      "王國 10 棟建築等級 ≥13 起每級成長率由 ×2.1-2.3 改為 ×1.35（與市場/簽到/任務/里程碑同錨）— 等級 ≤12 與舊曲線逐位元一致，前期節奏零變動；素材需求不變",
      "實測診斷（kl28 存檔）：舊曲線單次升級 = 王城 24→25 660 小時收入／酒館 22→23 188h／訓練場 21→22 130h／裝備商店 21→22 204h（數週）— 建築階梯在 kl 22-35 全面凍結，金幣堆積無處消耗（強化/訓練/突破/招募全在數分鐘等級），產出→消耗閉環斷裂；阻尼後單級落回「以天計」（kl28：王城 30→31 ≈ 10h）並可一路爬至 Lv40+（王城 40→41 ≈ 3.1B，kl40+ 收入下約 1-3 天）",
      "王國主場景（核心可見成長面）重新成為每週有感的投資階梯；與遠古科技（98B 月級錨）形成多尺度金幣消耗端；純 data/buildings.js 數值變更，零 UI/零存檔語義/battle.js 零觸碰；快取 569→570"
    ]
  },
  {
    v: "v552", title: "英雄死亡表現（倒地動畫＋趴地屍體＋紅 ✕）",
    notes: [
      "戰鬥中隊員倒下不再原地站立 — 0.12s 白閃 → 0.43s 壓縮倒地動畫 → 常駐趴地屍體＋頭頂紅 ✕（黑描邊像素十字，與「嘲/技」狀態圖示同語彙）；屍體在整場戰鬥與後續關卡持續存在（死亡持續到戰鬥結束契約），滅團回城清場",
      "原「down」事件在 battle.js 已推送 3 路徑（單體/AOE/毒）但 UI 零消費 — 陣亡者僅以 0 血條凍結站立，是觀戰時「誰死了」的唯一盲點；本輪補齊：status/attack/castFx 對死者全面封鎖（屍體不掛技/嘲圖示、不揮武器、不施法光暈），reducedMotion 直接靜態屍體",
      "純視覺層（ui/hunt.js＋ui/render.js 雙檔）— 零數值、零存檔語義、battle.js 零觸碰；快取 568→569"
    ]
  },
  {
    v: "v551", title: "世界首領地標倒數 pin＋名牌對齊修正（等角地圖）",
    notes: [
      "世界首領地標名牌即時顯示午夜重置倒數：「剩3戰・HH:MM:SS 後重置」／「已討伐・HH:MM:SS 後重置」（1Hz 更新、跨午夜自動還原；與秘境/競技場/每日任務同款 fmtClock）— 每日回訪錨點在地圖上一眼可見",
      "v551FIX：名牌/熱區世界→CSS 映射修正 — 原 kx = VW/cw = 1.2568 使全圖名牌與熱區偏離地標 25.7%（風車實測名牌錨點偏右 66px），修正後名牌對準地標本體、點擊熱區對準圖示",
      "v551：名牌水平夾緊 — 貼視口邊緣的名牌整塊留在視口內（倒數 pin 238px 寬不再被 wrap 裁切；「深淵」左緣名牌同步修正）；地圖軸純顯示/純定位，零數值零存檔語義；快取 564→567"
    ]
  },
  {
    v: "v550", title: "派遣狀態卡（掛機狀態＋離線收益一眼可讀）",
    notes: [
      "副本主畫面狀態列升級為狀態卡：面板容器（panel2＋2px 邊框）＋三態著色 — 派遣綠⚔／休息金黃💤＋秒數倒數／待機灰⏳；離線速率金色加粗（+X 金/時・+Y 經驗/時），說明與在線專注留灰階 — 放置核心數字不再是最小字級（原 10px dim 層次倒置）",
      "UI/UX 軸：資訊可讀 — 掛機中「正在打什麼＋關掉能拿多少」一眼可見；純顯示層零數值/零存檔/battle.js 零觸碰；reducedMotion 靜態；快取 563→564"
    ]
  },
  {
    v: "v549", title: "怪物攻擊前搖警示（頭頂感嘆號）",
    notes: [
      "怪物攻擊前最後一格（≤0.5s,即 game.js SIM_STEP 分片的最後一步）頭頂紅白閃爍「!」警示 — 閃避/補血時機可讀;BOSS 放大 1.4×",
      "v549FIX：原條件 <0.22s 在 SIM_STEP=0.5 分片模擬下結構性不可達(mAtk 0.4→負數直接跳過),改為 ≤0.5 每攻擊週期亮一次;reducedMotion 不顯示;純視覺零數值變更;快取 562→563"
    ]
  },
  {
    v: "v548", title: "地圖縮放/返回鈕 hover 提示",
    notes: [
      "zoom 鈕 title（1×/1.5×/2× 循環）＋返回鈕 title（目的地）— 地圖工具列語意完整",
      "快取版本 561→562"
    ]
  },
  {
    v: "v547", title: "中毒浮字改紫＋毒霧粒子",
    notes: [
      "dot 扣血浮字 #7ac86a→#c792ea（紫）＋fx_poison 粒子 — 與治療綠 #7ee787 一眼區分（扣血/補血不再混淆）",
      "動作軸：數值顏色語義系統化（紅=受擊・紫=中毒・綠=治療/經驗・金=金幣/升級）",
      "快取版本 560→561"
    ]
  },
  {
    v: "v546", title: "農田收穫冷卻回饋",
    notes: [
      "冷卻中點麥田 → toast「麥田冷卻中（剩 N 秒）」（原靜默無回應）— 地圖互動反饋閉環",
      "地圖軸 backlog：每日互動元素（寶箱/農田/彩蛋）全數有回饋",
      "快取版本 559→560"
    ]
  },
  {
    v: "v545", title: "戰鬥 BOSS 機制名稱標記",
    notes: [
      "BOSS 名牌下常駐機制 chip（【劇毒】【護盾】【吸血】等 — 依機制著色）— 開戰即知機制，不需回想/查情報",
      "動作軸 backlog 首項；特效(v297)＋預告(v321)＋名稱標記 三層可讀性閉環",
      "快取版本 558→559"
    ]
  },
  {
    v: "v544", title: "技能研讀鈕 hover 提示",
    notes: [
      "研讀鈕 title（永久 +1%・累計 +10%）— 技能書投資價值清楚",
      "快取版本 557→558"
    ]
  },
  {
    v: "v543", title: "建築詳情升級鈕 hover 提示",
    notes: [
      "詳情升級鈕 title（下一級效果預覽）— 詳情頁決策前置完整",
      "快取版本 556→557"
    ]
  },
  {
    v: "v542", title: "建築升級/建造鈕 hover 提示",
    notes: [
      "10 建築鈕 title（成本・升級效果預覽）— 升級決策前置完整",
      "快取版本 555→556"
    ]
  },
  {
    v: "v541", title: "戰鬥紀錄列 hover 提示",
    notes: [
      "紀錄列 title（最近 8 筆・事件彙總）— 戰鬥動態可讀",
      "快取版本 554→555"
    ]
  },
  {
    v: "v540", title: "戰利品面板 hover 提示",
    notes: [
      "戰利品面板 title（掉落率語意・素材用途）— 掉落資訊可信任",
      "快取版本 553→554"
    ]
  },
  {
    v: "v539", title: "情報視窗 BOSS 列 hover 提示",
    notes: [
      "BOSS 列 title（首殺獎勵・機制對策）— 討伐準備前置完整",
      "快取版本 552→553"
    ]
  },
  {
    v: "v538", title: "區域元素列 hover 提示",
    notes: [
      "情報視窗元素列 title（克制 +25%・編隊建議）— 元素決策支援完整",
      "快取版本 551→552"
    ]
  },
  {
    v: "v537", title: "最佳練功點 hover 提示",
    notes: [
      "最佳練功點 title（掃描邏輯・收益判定）— 練功建議可信任",
      "快取版本 550→551"
    ]
  },
  {
    v: "v536", title: "派遣戰力門檻 hover 提示",
    notes: [
      "出戰隊 vs 建議 title（綠黃紅語意・強化指引）— 派遣決策前置完整",
      "快取版本 549→550"
    ]
  },
  {
    v: "v535", title: "BOSS 關預告 hover 提示",
    notes: [
      "BOSS 預告 title（每日首殺獎勵・機制建議）— 派遣前決策完整",
      "快取版本 547→548"
    ]
  },
  {
    v: "v534", title: "副本隊伍列 hover 提示",
    notes: [
      "隊員卡 title（HP/MP/狀態）＋空槽引導 — 部隊狀態一眼可讀",
      "快取版本 546→547"
    ]
  },
  {
    v: "v533", title: "回村待機鈕 hover 提示",
    notes: [
      "回村待機鈕 title（召回語意・休息恢復）— 部隊管理清楚",
      "快取版本 544→545"
    ]
  },
  {
    v: "v532", title: "副本派遣鈕 hover 提示",
    notes: [
      "派遣鈕 title（目的地選擇）— 副本入口語意清楚",
      "快取版本 543→544"
    ]
  },
  {
    v: "v531", title: "地圖探索提示 hover",
    notes: [
      "探索提示列 title（捲動/前往/解鎖規則）— 地圖操作引導完整",
      "快取版本 542→543"
    ]
  },
  {
    v: "v530", title: "地圖熱區 hover 提示",
    notes: [
      "21 地標熱區 title（王國/區域/模式・解鎖語意）— 地圖觸控點全可讀",
      "快取版本 540→541"
    ]
  },
  {
    v: "v529", title: "招募費用預覽列 hover 提示",
    notes: [
      "費用預覽 title（+20%/次・折扣即時）— 招募成本曲線清楚",
      "快取版本 539→540"
    ]
  },
  {
    v: "v528", title: "招募執行鈕 hover 提示",
    notes: [
      "金幣/券/神話＋十連鈕 title（範圍・保底照算）— 招募成本前置清楚",
      "快取版本 538→539"
    ]
  },
  {
    v: "v527", title: "心願職業說明 hover 提示",
    notes: [
      "心願說明 title（全招募方式・×2 規則）— 心願機制完整可讀",
      "快取版本 537→538"
    ]
  },
  {
    v: "v526", title: "徽章升級鈕 hover 提示",
    notes: [
      "徽章升級鈕 title（消耗・效果倍率）— 徽章投資價值清楚",
      "快取版本 536→537"
    ]
  },
  {
    v: "v525", title: "換裝視窗列 hover 提示",
    notes: [
      "換裝列 title（穿戴替換・戰力差・套裝）— 換裝決策前置完整",
      "快取版本 535→536"
    ]
  },
  {
    v: "v524", title: "名冊上限列 hover 提示",
    notes: [
      "名冊上限 title（酒館成長・滿員路徑）— 招募決策前置清楚",
      "快取版本 534→535"
    ]
  },
  {
    v: "v523", title: "共鳴基準說明 hover 提示",
    notes: [
      "基準說明 title（第 5 高・封頂・個人投資保留）— 共鳴機制完整可讀",
      "快取版本 533→534"
    ]
  },
  {
    v: "v522", title: "置換視窗說明 hover 提示",
    notes: [
      "置換說明 title（石消耗公式・同步內容）— 置換成本前置清楚",
      "快取版本 532→533"
    ]
  },
  {
    v: "v521", title: "技能解鎖提示 hover 強化",
    notes: [
      "解鎖提示 title（技能名・訓練路徑）— 成長目標清楚",
      "快取版本 531→532"
    ]
  },
  {
    v: "v520", title: "傳說被動卡 hover 提示",
    notes: [
      "傳說被動卡 title（永久生效・徽章強化）— 傳說投資價值清楚",
      "快取版本 530→531"
    ]
  },
  {
    v: "v519", title: "英雄詳情頭部 hover 提示",
    notes: [
      "元素/職業列 title（克制規則・職業語意）— 頭部資訊完整可讀",
      "快取版本 529→530"
    ]
  },
  {
    v: "v518", title: "詳情自動穿裝鈕 hover 提示",
    notes: [
      "詳情自動穿裝鈕 title（鎖定不穿・比現穿好才換）— 穿戴行為可預期",
      "快取版本 528→529"
    ]
  },
  {
    v: "v517", title: "遣散鈕 hover 提示",
    notes: [
      "詳情遣散鈕 title（返還規則・碎片・不可復原）— 高風險操作前置說明",
      "快取版本 527→528"
    ]
  },
  {
    v: "v516", title: "英雄技能按鈕 hover 提示",
    notes: [
      "設主/副技＋升級鈕 title（編排語意・書消耗）— 技能投資決策清楚",
      "快取版本 526→527"
    ]
  },
  {
    v: "v515", title: "突破資訊列 hover 提示",
    notes: [
      "突破資訊 title（+20%/階・解鎖等級）— 突破決策前置資訊完整",
      "快取版本 525→526"
    ]
  },
  {
    v: "v514", title: "補血/補魔鈕 hover 提示",
    notes: [
      "藥水鈕 title（補滿語意・缺藥提示）— 續戰操作清楚",
      "快取版本 524→525"
    ]
  },
  {
    v: "v513", title: "英雄訓練鈕 hover 提示",
    notes: [
      "訓練×10/到滿鈕 title（停止條件・成本模擬）— 批量訓練行為可預期",
      "快取版本 523→524"
    ]
  },
  {
    v: "v512", title: "英雄經驗條 hover 提示",
    notes: [
      "經驗 pbar title（升級效益・滿級路徑）— 成長路徑清楚",
      "快取版本 522→523"
    ]
  },
  {
    v: "v511", title: "英雄詳情頁籤 hover 提示",
    notes: [
      "屬性/裝備/技能 tab title（內容預告）— 詳情導覽意圖清楚",
      "快取版本 521→522"
    ]
  },
  {
    v: "v510", title: "英雄搜尋框 hover 提示",
    notes: [
      "搜尋 input title（名稱/職業・即時）— 名冊搜尋意圖清楚",
      "快取版本 520→521"
    ]
  },
  {
    v: "v509", title: "英雄篩選/排序 chips hover 提示",
    notes: [
      "11 chips title（語意・職業屬性）— 名冊整理操作全可預期",
      "快取版本 518→520"
    ]
  },
  {
    v: "v508", title: "流浪好感條 hover 提示",
    notes: [
      "好感進度條 title（4 階規則・滿好感免費）— 投餵決策依據清楚",
      "快取版本 517→518"
    ]
  },
  {
    v: "v507", title: "流浪招募視窗鈕 hover 提示",
    notes: [
      "招募/驅逐鈕 title（好感降費・永久性警告）— 高風險操作前置說明",
      "快取版本 516→517"
    ]
  },
  {
    v: "v506", title: "英雄視圖切換 chips hover 提示",
    notes: [
      "領地/流浪視圖 chips title（各自內容語意）— 視圖切換意圖清楚",
      "快取版本 515→516"
    ]
  },
  {
    v: "v505", title: "流浪英雄區標題 hover 提示",
    notes: [
      "流浪區標題 title（來訪規則・好感降費・隔日離開）— 流浪機制完整可讀",
      "快取版本 514→515"
    ]
  },
  {
    v: "v504", title: "批量遣散/驅逐鈕 hover 提示",
    notes: [
      "批量鈕 title（雙視圖語意・返還規則・不可復原）— 高風險操作前置說明",
      "快取版本 513→514"
    ]
  },
  {
    v: "v503", title: "全隊訓練鈕 hover 提示",
    notes: [
      "全隊訓練鈕 title（戰力排序・金幣遞增）— 批量成長行為可預期",
      "快取版本 512→513"
    ]
  },
  {
    v: "v502", title: "英雄編隊狀態列 hover 提示",
    notes: [
      "已編隊狀態 title（酒館擴充・自動編隊指引）— 待命英雄決策清楚",
      "快取版本 511→512"
    ]
  },
  {
    v: "v501", title: "英雄空狀態 hover 提示",
    notes: [
      "空態 title（招募路徑・自動編隊指引）— 空名冊也有行動提示",
      "快取版本 510→511"
    ]
  },
  {
    v: "v500", title: "編隊站位標籤 hover 提示",
    notes: [
      "前排/後排標籤 title（承受/減傷語意・職業建議）— 站位機制即時可讀",
      "快取版本 509→510"
    ]
  },
  {
    v: "v499", title: "編隊槽格 hover 提示",
    notes: [
      "5 槽格 title（空位/更換語意・立即生效）— 編隊站位操作可預期",
      "快取版本 508→509"
    ]
  },
  {
    v: "v498", title: "編滿全部隊鈕 hover 提示",
    notes: [
      "編滿全部隊鈕 title（戰力排序・不覆寫）— 批量編隊行為可預期",
      "快取版本 507→508"
    ]
  },
  {
    v: "v497", title: "編隊批量搬移 hover 提示",
    notes: [
      "搬移到列 title（覆寫語意・互斥處理）— 批量搬移行為可預期",
      "快取版本 506→507"
    ]
  },
  {
    v: "v496", title: "編隊隊列 chips hover 提示",
    notes: [
      "5 隊 chips title（切換語意・解鎖條件）— 出戰隊概念清楚",
      "快取版本 505→506"
    ]
  },
  {
    v: "v495", title: "共鳴自動填入鈕 hover 提示",
    notes: [
      "自動填入鈕 title（受益優先・一鍵）— 功能意圖即時可讀",
      "快取版本 504→505"
    ]
  },
  {
    v: "v494", title: "共鳴名冊列 hover 提示",
    notes: [
      "名冊候選格 title（受益/無效果語意・點擊填入）— 共鳴選人決策清楚",
      "快取版本 503→504"
    ]
  },
  {
    v: "v493", title: "升星鈕 hover 提示",
    notes: [
      "升星鈕 title（消耗・永久提升）— 升星決策前置資訊完整",
      "快取版本 502→503"
    ]
  },
  {
    v: "v492", title: "升星候選列 hover 提示",
    notes: [
      "候選清單 title（🔒/⚔ 標記語意・操作路徑）— 材料準備決策清楚",
      "快取版本 501→502"
    ]
  },
  {
    v: "v491", title: "升星資訊列 hover 提示",
    notes: [
      "升星資訊 title（永久倍率・消耗規則・裝備歸還）— 升星決策前置資訊完整",
      "快取版本 500→501"
    ]
  },
  {
    v: "v490", title: "置換石取得提示 hover",
    notes: [
      "置換石深鏈鈕 title（唯一來源・兌換規則）— 救贖資源取得路徑清楚",
      "快取版本 499→500"
    ]
  },
  {
    v: "v489", title: "英雄置換候選列 hover 提示",
    notes: [
      "置換候選列 title（投資對調明細・置換石消耗）— 救贖決策前置資訊完整",
      "快取版本 498→499"
    ]
  },
  {
    v: "v488", title: "鑲嵌寶石列 hover 提示",
    notes: [
      "寶石選擇列 title（消耗・可移除回收）— 鑲嵌決策語意完整",
      "快取版本 497→498"
    ]
  },
  {
    v: "v487", title: "穿戴英雄選擇列 hover 提示",
    notes: [
      "穿戴選擇列 title（替換規則）— 換裝決策前置資訊完整",
      "快取版本 496→497"
    ]
  },
  {
    v: "v486", title: "寶石插槽列 hover 提示",
    notes: [
      "插槽列 title（鑲嵌/移除・融合升級）— 寶石投資語意完整",
      "快取版本 495→496"
    ]
  },
  {
    v: "v485", title: "裝備詳情套裝行 hover 提示",
    notes: [
      "詳情頁套裝加成行 title（2/4 件啟動規則）— 套裝語意清楚",
      "快取版本 494→495"
    ]
  },
  {
    v: "v484", title: "裝備詞綴列 hover 提示",
    notes: [
      "詳情頁詞綴列 title（★3+ 條件・重鑄更換）— 詞綴語意清楚",
      "快取版本 493→494"
    ]
  },
  {
    v: "v483", title: "自動分解設定列 hover 提示",
    notes: [
      "啟用自動分解列 title（機制說明）— 背包自動管理語意清楚",
      "快取版本 492→493"
    ]
  },
  {
    v: "v482", title: "裝備過濾 chips hover 提示",
    notes: [
      "品質/排序 chips title（篩選語意）— 背包整理決策清楚",
      "快取版本 491→492"
    ]
  },
  {
    v: "v481", title: "背包容量列 hover 提示",
    notes: [
      "容量列 title（倉庫升級・滿格處理）— 背包管理語意完整",
      "快取版本 490→491"
    ]
  },
  {
    v: "v480", title: "詞綴重鑄鈕 hover 提示",
    notes: [
      "重鑄鈕 title（詞綴機制・★3+ 條件）— 重鑄決策前置資訊完整",
      "快取版本 489→490"
    ]
  },
  {
    v: "v479", title: "裝備強化鈕 hover 提示",
    notes: [
      "詳情頁強化鈕 title（屬性成長・+10 後機率失敗不掉級）— 強化決策前置資訊完整",
      "快取版本 488→489"
    ]
  },
  {
    v: "v478", title: "公會首領弱點列 hover 提示",
    notes: [
      "弱點列 title（剋制機制・每週輪換）— 編隊決策前置資訊完整",
      "快取版本 487→488"
    ]
  },
  {
    v: "v477", title: "週討伐進度列 hover 提示",
    notes: [
      "週討伐頭部 title（21 場構成・重置・領取）— 週目標語意完整",
      "快取版本 486→487"
    ]
  },
  {
    v: "v476", title: "防守紀錄列 hover 提示",
    notes: [
      "防守紀錄列 title（挑戰者・勝敗・榮譽）— 離線防守結果語意清楚",
      "快取版本 485→486"
    ]
  },
  {
    v: "v475", title: "深淵全部領取鈕 hover 提示",
    notes: [
      "深淵里程碑全部領取鈕 title — 批量操作語意清楚",
      "快取版本 484→485"
    ]
  },
  {
    v: "v474", title: "圖鑑全部領取鈕 hover 提示",
    notes: [
      "全部領取鈕 title（一次領取全部已達標里程碑）— 批量操作語意清楚",
      "快取版本 483→484"
    ]
  },
  {
    v: "v473", title: "底部導航 hover 提示",
    notes: [
      "6 分頁 tab title（用途說明）— 導航功能可發現性提升",
      "快取版本 482→483"
    ]
  },
  {
    v: "v472", title: "頂欄按鈕 hover 提示",
    notes: [
      "地圖/設定鈕 title（用途說明）— 頂欄功能可發現性提升",
      "快取版本 481→482"
    ]
  },
  {
    v: "v471", title: "招募分頁 hover 提示",
    notes: [
      "金幣/招募券/神話 tab title（星級範圍・費用・冷卻）— 招募選擇前置資訊完整",
      "快取版本 480→481"
    ]
  },
  {
    v: "v470", title: "教學視窗 hover 提示",
    notes: [
      "教學卡 title：步驟進度・略過提示 — 新手引導語意清楚",
      "快取版本 479→480"
    ]
  },
  {
    v: "v469", title: "回歸獎勵視窗 hover 提示",
    notes: [
      "回歸獎勵視窗 title：72 小時觸發・分檔禮包 — 回歸機制語意完整",
      "快取版本 478→479"
    ]
  },
  {
    v: "v468", title: "離線獎勵視窗 hover 提示",
    notes: [
      "離線獎勵視窗 title：上限時長・累積規則・遠征/委託同步結算 — 回歸結算語意完整",
      "快取版本 477→478"
    ]
  },
  {
    v: "v467", title: "圖鑑收集標題 hover 提示",
    notes: [
      "裝備收集標題 title（7 部位 ×10 階級・取得方式）— 收集目標結構清楚",
      "快取版本 476→477"
    ]
  },
  {
    v: "v466", title: "簽到頭部 hover 提示",
    notes: [
      "月進度條 title：30 天週期・漏簽規則 — 簽到節奏清楚",
      "快取版本 475→476"
    ]
  },
  {
    v: "v465", title: "七日豪禮頭部 hover 提示",
    notes: [
      "豪禮頭部 title：任務鏈機制・最終傳說獎勵 — 新手引導目標清楚",
      "快取版本 474→475"
    ]
  },
  {
    v: "v464", title: "商城列表標題 hover 提示",
    notes: [
      "商城標題列 title（鑽石消費・週限・機率）— 商城消費語意清楚",
      "快取版本 473→474"
    ]
  },
  {
    v: "v463", title: "市場頭部 hover 提示",
    notes: [
      "每日特惠標題 title（刷新・動態價）— 市場消費語意清楚",
      "快取版本 471→472"
    ]
  },
  {
    v: "v462", title: "深淵商店頭部 hover 提示",
    notes: [
      "碎片持有列 title：兌換機制・深度解鎖門檻 — 深淵貨幣經濟語意完整",
      "快取版本 470→471"
    ]
  },
  {
    v: "v461", title: "試煉秘境頭部 hover 提示",
    notes: [
      "秘境頭部 title：3 種副本・次數・安慰獎 — 每日副本規則清楚",
      "快取版本 469→470"
    ]
  },
  {
    v: "v460", title: "遠征頭部 hover 提示",
    notes: [
      "遠征說明列 title：委託機制・自動發放・召回 50% — 遠征規則進場前說明",
      "快取版本 468→469"
    ]
  },
  {
    v: "v459", title: "公會頭部 hover 提示",
    notes: [
      "公會頭部 title：等級價值・捐獻/盛宴節奏 — 公會升級決策清楚",
      "快取版本 467→468"
    ]
  },
  {
    v: "v458", title: "世界首領頭部 hover 提示",
    notes: [
      "首領列 title：每日次數・傷害累積・里程碑/擊殺獎勵 — 討伐規則總覽清楚",
      "快取版本 466→467"
    ]
  },
  {
    v: "v457", title: "王者頭部 hover 提示",
    notes: [
      "王者說明列 title：三隊制・結算・置換石來源 — 王者經濟語意完整",
      "快取版本 465→466"
    ]
  },
  {
    v: "v456", title: "競技場頭部 hover 提示",
    notes: [
      "名次列 title：升降規則・每日次數・週結算 — 天梯規則總覽清楚",
      "快取版本 464→465"
    ]
  },
  {
    v: "v455", title: "活動頭部 hover 提示",
    notes: [
      "活動頭部 title：點數取得・週一重置・商店提醒 — 活動經濟語意完整",
      "快取版本 463→464"
    ]
  },
  {
    v: "v454", title: "榮譽商店頭部 hover 提示",
    notes: [
      "持有榮譽列 title：來源清單・週一重置 — 榮譽經濟語意完整",
      "快取版本 462→463"
    ]
  },
  {
    v: "v453", title: "更新歷史列 hover 提示",
    notes: [
      "版本列 title（版本號＋標題＋展開提示）— 更新紀錄瀏覽清楚",
      "快取版本 461→462"
    ]
  },
  {
    v: "v452", title: "圖鑑搜尋框 hover 提示",
    notes: [
      "搜尋框 title：即時過濾說明 — 圖鑑瀏覽效率功能可發現",
      "快取版本 460→461"
    ]
  },
  {
    v: "v451", title: "主線任務列 hover 提示",
    notes: [
      "主線任務列 title：狀態（已完成/進行中/未解鎖）＋獎勵 — 主線推進目標清楚",
      "快取版本 459→460"
    ]
  },
  {
    v: "v450", title: "任務分頁/頭部 hover 提示",
    notes: [
      "任務 tabs title（主線鏈/每日午夜/每週週一）＋主線頭部 title — 任務週期語意清楚",
      "快取版本 458→459"
    ]
  },
  {
    v: "v449", title: "成就頭部 hover 提示",
    notes: [
      "成就頭部 title：獎勵機制＋達成/可領狀態 — 成就目標總覽清楚",
      "快取版本 457→458"
    ]
  },
  {
    v: "v448", title: "圖鑑完成度頭部 hover 提示",
    notes: [
      "完成度頭部 title：計算構成說明 — 收集目標語意完整",
      "快取版本 456→457"
    ]
  },
  {
    v: "v447", title: "碎片合成 hover 提示",
    notes: [
      "合成列 title（消耗/週限/狀態）＋職業 chip title（合成目標）— 碎片投資決策清楚",
      "快取版本 455→456"
    ]
  },
  {
    v: "v446", title: "招募 FAB hover 提示",
    notes: [
      "招募 FAB title：金幣冷卻規則＋券/鑽石無冷卻 — 招募入口機制透明",
      "快取版本 454→455"
    ]
  },
  {
    v: "v445", title: "招募結果統計列 hover 提示",
    notes: [
      "統計列 title：★6/傳說/保底/重複碎片說明 — 十連結果總覽語意完整",
      "快取版本 453→454"
    ]
  },
  {
    v: "v444", title: "裝備通知規則 hover 提示",
    notes: [
      "規則 chips title（勾選/未勾選語意）— 通知過濾設定清楚",
      "快取版本 452→453"
    ]
  },
  {
    v: "v443", title: "存檔管理列 hover 提示",
    notes: [
      "下載/匯入列 title（備份換機・覆蓋警示）— 存檔操作語意清楚",
      "快取版本 451→452"
    ]
  },
  {
    v: "v442", title: "自動喝水 hover 提示",
    notes: [
      "自動喝水列＋閾值 chips title（觸發規則・切換說明）— 掛機生存設定透明",
      "快取版本 450→451"
    ]
  },
  {
    v: "v441", title: "通知列 hover 提示",
    notes: [
      "4 通知開關列 title（藥水/裝備/寶石/技能書規則）— 通知設定語意清楚",
      "快取版本 449→450"
    ]
  },
  {
    v: "v440", title: "遠征欄位 hover 提示",
    notes: [
      "遠征欄位卡 title：自動完成時點・效率・召回 50% — 委託派遣後狀態清楚",
      "快取版本 448→449"
    ]
  },
  {
    v: "v439", title: "迷宮節點操作列 hover 提示",
    notes: [
      "節點列 title：類型規則（戰鬥勝率/寶箱內容/事件增益）— 節點決策前置資訊完整",
      "快取版本 447→448"
    ]
  },
  {
    v: "v438", title: "迷宮路線選擇 hover 提示",
    notes: [
      "路線鈕 title：完整節點序列・不可更改說明 — 路線決策前置資訊完整",
      "快取版本 446→447"
    ]
  },
  {
    v: "v437", title: "迷宮里程碑 hover 提示",
    notes: [
      "里程碑 chip title：獎勵明細・達成狀態・差距 — 迷宮推進目標清楚",
      "快取版本 445→446"
    ]
  },
  {
    v: "v436", title: "試煉自動挑戰 hover 提示",
    notes: [
      "自動挑戰鈕 title：至卡關・首敗即停・無懲罰 — 批量衝塔放心按",
      "快取版本 444→445"
    ]
  },
  {
    v: "v435", title: "元素試煉頭部 hover 提示",
    notes: [
      "試煉頭部 title：每週 15 層・剋制 ×1.5・無限重試 — 衝塔規則進場前說明",
      "快取版本 443→444"
    ]
  },
  {
    v: "v434", title: "深淵建議戰力 hover 提示",
    notes: [
      "建議戰力列 title：戰力比・三色狀態意義 — 深淵深度推進決策透明",
      "快取版本 442→443"
    ]
  },
  {
    v: "v433", title: "深淵頭部列 hover 提示",
    notes: [
      "深淵頭部 title：無限層・獎勵成長・領主・跨週保留 — 深淵機制總覽",
      "快取版本 441→442"
    ]
  },
  {
    v: "v432", title: "王者挑戰/一鍵 hover 提示",
    notes: [
      "挑戰幻影鈕 title（三隊制・次數・獎勵）、一鍵挑戰鈕 title（匯總）— 王者批量操作清楚",
      "快取版本 440→441"
    ]
  },
  {
    v: "v431", title: "王者隊選擇 hover 提示",
    notes: [
      "隊 chips title：選取/取消說明・三隊制・解鎖條件 — 王者編隊決策清楚",
      "快取版本 439→440"
    ]
  },
  {
    v: "v430", title: "王者分檔進度 hover 提示",
    notes: [
      "分檔列 title：3/9/15 勝場加成明細＋結算規則 — 王者幣投資回報透明",
      "快取版本 438→439"
    ]
  },
  {
    v: "v429", title: "週討伐里程碑 hover 提示",
    notes: [
      "週討伐列 title：本週進度・獎勵・領取狀態 — 週目標差距清楚",
      "快取版本 437→438"
    ]
  },
  {
    v: "v428", title: "世界首領出戰鈕 hover 提示",
    notes: [
      "出戰鈕 title：傷害規則・每日次數・自動領獎 — 討伐決策前置資訊完整",
      "快取版本 436→437"
    ]
  },
  {
    v: "v427", title: "世界首領一鍵出戰 hover 提示",
    notes: [
      "一鍵出戰鈕 title：剩餘次數・每日重置・傷害累積規則 — 批量討伐決策清楚",
      "快取版本 435→436"
    ]
  },
  {
    v: "v426", title: "公會捐獻鈕 hover 提示",
    notes: [
      "批量捐獻鈕 title：每日額度・重置・公會等級價值 — 捐獻決策清楚",
      "快取版本 434→435"
    ]
  },
  {
    v: "v425", title: "公會首領出戰鈕 hover 提示",
    notes: [
      "出戰鈕 title：傷害規則・里程碑自動領獎・擊殺大獎 — 公會首領投資回報清楚",
      "快取版本 433→434"
    ]
  },
  {
    v: "v424", title: "競技場掃蕩鈕 hover 提示",
    notes: [
      "掃蕩鈕 title：自動挑最高勝率・獎勵照常 — 批量操作放心按",
      "快取版本 432→433"
    ]
  },
  {
    v: "v423", title: "競技場結算預估列 hover 提示",
    notes: [
      "結算列 title：週一結算公式（最佳名次＋勝場・封頂）— 衝榜回報透明",
      "快取版本 431→432"
    ]
  },
  {
    v: "v422", title: "競技場防守列 hover 提示",
    notes: [
      "防守編隊列 title：離線幻影機制・擊退獎勵 — 防守決策價值清楚",
      "快取版本 430→431"
    ]
  },
  {
    v: "v421", title: "活動里程碑 hover 提示",
    notes: [
      "活動里程碑 title：目標・目前點數・差距・獎勵 — 活動衝分目標清楚",
      "快取版本 429→430"
    ]
  },
  {
    v: "v420", title: "深淵魔物列 hover 提示",
    notes: [
      "深淵戰況列 title：層級標註（深淵領主/普通層）＋推進規則 — 深淵戰況語意清楚",
      "快取版本 428→429"
    ]
  },
  {
    v: "v419", title: "王國名稱 hover＋更名深鏈",
    notes: [
      "王國名稱 title 提示可更名，點擊直開更名視窗（原僅商城內入口）— 名稱自訂更易發現",
      "快取版本 427→428"
    ]
  },
  {
    v: "v418", title: "重塑/置換鈕 hover 提示",
    notes: [
      "重塑鈕 title（返還資源・保留稀有度）、置換鈕 title（交換投資・置換石規則）— 救贖機制透明",
      "快取版本 426→427"
    ]
  },
  {
    v: "v417", title: "突破鈕 hover 提示",
    notes: [
      "突破鈕 title：+20% 全屬性・每 20 級一次・最多 5 階 — 突破機制透明",
      "快取版本 425→426"
    ]
  },
  {
    v: "v416", title: "技能全部升級 hover 提示",
    notes: [
      "全部升級鈕 title：升到滿級或書盡 — 批量技能投資規則清楚",
      "快取版本 424→425"
    ]
  },
  {
    v: "v415", title: "技能書列 hover 提示",
    notes: [
      "技能書列 title：取得來源・消耗規則 — 技能投資資源清楚",
      "快取版本 423→424"
    ]
  },
  {
    v: "v414", title: "傳說羈絆行 hover 提示",
    notes: [
      "羈絆行 title：所需傳說組合・目前進度・生效狀態 — 湊羈絆決策資訊齊全",
      "快取版本 422→423"
    ]
  },
  {
    v: "v413", title: "傳說徽章行 hover 提示",
    notes: [
      "徽章行 title：效果・成長倍率・碎片來源 — 傳說長線養成資訊透明",
      "快取版本 421→422"
    ]
  },
  {
    v: "v412", title: "神器列 hover 提示",
    notes: [
      "神器列 title：名稱・等級・被動效果・當前倍率（空槽顯示取得方式）— 神器投資決策清楚",
      "快取版本 420→421"
    ]
  },
  {
    v: "v411", title: "套裝效果行 hover 提示",
    notes: [
      "套裝行 title：2/4 件加成明細・目前件數與啟動狀態 — 湊套裝決策資訊齊全",
      "快取版本 419→420"
    ]
  },
  {
    v: "v410", title: "英雄裝備槽 hover 提示",
    notes: [
      "裝備槽 title：已裝備顯示星級/名稱/強化、空槽顯示操作說明 — 換裝決策前置資訊",
      "快取版本 418→419"
    ]
  },
  {
    v: "v409", title: "英雄屬性格 hover 提示",
    notes: [
      "攻擊/防禦/生命/魔力/攻速/暴擊格 title 附機制說明 — 屬性語意清楚",
      "快取版本 417→418"
    ]
  },
  {
    v: "v408", title: "招募結果卡 hover 提示",
    notes: [
      "十連結果卡 title：名稱・星級・職業・等級・戰力・保底/傳說/重複標記 — 抽卡結果一瞥即懂",
      "快取版本 416→417"
    ]
  },
  {
    v: "v407", title: "關卡情報鈕 hover 補強",
    notes: [
      "ⓘ 鈕 title 列明情報內容（戰利品/掉落率/BOSS 機制/魔物）— 戰鬥中 FAB 用途清楚",
      "快取版本 415→416"
    ]
  },
  {
    v: "v406", title: "補滿 HP/MP 鈕 hover 提示",
    notes: [
      "兩補滿鈕 title：消耗藥水恢復全隊 50% 生命/魔力 — 戰中應急操作清楚",
      "快取版本 414→415"
    ]
  },
  {
    v: "v405", title: "批量啟用靈藥 hover 提示",
    notes: [
      "全部啟用鈕 title：三種靈藥批量・時間疊加・缺貨跳過 — 批量掛機決策清楚",
      "快取版本 413→414"
    ]
  },
  {
    v: "v404", title: "英雄圖鑑 hover 提示",
    notes: [
      "職業收集列 title：累計獲得數・永久攻擊加成・里程碑規則 — 圖鑑加成機制透明",
      "快取版本 412→413"
    ]
  },
  {
    v: "v403", title: "圖鑑完成度里程碑 hover",
    notes: [
      "完成度里程碑 title：目前完成度・效果・獎勵・領取狀態 — 收集目標差距清楚",
      "快取版本 411→412"
    ]
  },
  {
    v: "v402", title: "深淵行動列 hover 提示",
    notes: [
      "踏入深淵＋踏入並連續挑戰鈕 title — 深淵規則進場前說明",
      "快取版本 410→411"
    ]
  },
  {
    v: "v401", title: "圖鑑里程碑獎勵 hover",
    notes: [
      "里程碑鈕 title 加獎勵明細（金/鑽石/招募券）— 收集目標價值清楚",
      "快取版本 409→410"
    ]
  },
  {
    v: "v400", title: "心願職業 hover 提示",
    notes: [
      "心願 chips title：啟用/未啟用狀態＋×2 出現率說明 — 抽卡願望清單機制透明",
      "快取版本 408→409"
    ]
  },
  {
    v: "v399", title: "出戰隊列 hover 提示",
    notes: [
      "出戰隊 title：人數・戰力・目前出戰標記・解鎖條件 — 多隊切換決策清楚",
      "快取版本 407→408"
    ]
  },
  {
    v: "v398", title: "派遣狀態列 hover 提示",
    notes: [
      "狀態列 title：自動續戰/進關開關狀態・休息行為・掛機說明 — 派遣狀態一瞥即懂",
      "快取版本 406→407"
    ]
  },
  {
    v: "v397", title: "派遣戰利品預覽 hover 提示",
    notes: [
      "戰利品預覽 title：難度倍率・建築加成・精英 3 倍 — 派遣前知道收益組成",
      "快取版本 405→406"
    ]
  },
  {
    v: "v396", title: "王國經驗條 hover 提示",
    notes: [
      "經驗條 title：升級獎勵（+1% 全屬性・禮金・每 5 級鑽石）＋經驗來源 — 升級決策透明",
      "快取版本 404→405"
    ]
  },
  {
    v: "v395", title: "批量投餵/遠征 hover 提示",
    notes: [
      "兩批量鈕 title：投餵（好感 +15 ×N）、遠征（心情 ≥40・可召回退款）— 日常批量操作放心按",
      "快取版本 403→404"
    ]
  },
  {
    v: "v394", title: "自動編隊/穿裝 hover 提示",
    notes: [
      "兩鈕 title：自動編隊規則（戰力排序・保留已編入）、自動穿裝規則（鎖定不穿・只換更好）",
      "快取版本 402→403"
    ]
  },
  {
    v: "v393", title: "共鳴槽 hover 提示",
    notes: [
      "共鳴槽 title：已入槽顯示基準同步等級・空槽說明填入規則 — 板凳共享機制透明",
      "快取版本 401→402"
    ]
  },
  {
    v: "v392", title: "小地圖 hover 提示",
    notes: [
      "minimap title：各點色圖例＋點擊跳轉說明 — 新玩家看懂小地圖",
      "快取版本 400→401"
    ]
  },
  {
    v: "v391", title: "地圖探索度 hover 提示",
    notes: [
      "探索度 title：解鎖條件（討伐 BOSS 解鎖下一區）＋深淵入口說明",
      "快取版本 399→400"
    ]
  },
  {
    v: "v390", title: "獵頁收益列 hover 提示",
    notes: [
      "每擊殺收益 title：難度倍率・建築加成・精英 3 倍 — 收益組成透明",
      "快取版本 398→399"
    ]
  },
  {
    v: "v389", title: "戰力門檻列 hover 提示",
    notes: [
      "戰力比 title：比例・建議戰力成長說明・三色狀態意義 — 練角決策透明",
      "快取版本 397→398"
    ]
  },
  {
    v: "v388", title: "圖鑑素材發現格",
    notes: [
      "素材發現從純計數升級為 9 素材格（圖示＋名稱＋發現狀態），title 附來源 — 圖鑑收集完整可視",
      "快取版本 396→397"
    ]
  },
  {
    v: "v387", title: "商城課金裝備 hover 提示",
    notes: [
      "購買隨機裝備鈕 title：階級・部位・稀有度機率說明 — 課金決策透明",
      "快取版本 395→396"
    ]
  },
  {
    v: "v386", title: "村莊市場 hover 提示",
    notes: [
      "特惠＋週限兌換列 title：價格・限購・狀態 — 消費決策一目了然",
      "快取版本 393→394"
    ]
  },
  {
    v: "v385", title: "王國建築橫幅 hover 提示",
    notes: [
      "建築橫幅 chip title：名稱・等級・當前效果 — 王國頁一覽所有建築貢獻",
      "快取版本 392→393"
    ]
  },
  {
    v: "v384", title: "王國概覽卡 hover 提示",
    notes: [
      "勢力/副本/生產/圖鑑四卡 title 附說明 — 概覽資訊語意清楚",
      "快取版本 391→392"
    ]
  },
  {
    v: "v383", title: "王國資源總覽 hover 提示",
    notes: [
      "5 資源格 title 附取得來源 — 缺資源時直接知道去哪農",
      "快取版本 390→391"
    ]
  },
  {
    v: "v382", title: "區域名牌野生彩蛋提示",
    notes: [
      "區域名牌 title 附「地標旁野生魔物可點擊收服賞金（60 秒冷卻）」— 隱藏互動被發現",
      "快取版本 389→390"
    ]
  },
  {
    v: "v381", title: "區域名牌每日寶箱提示",
    notes: [
      "每日寶箱所在區的名牌 hover 顯示「🎁 今日寶箱在此！」— 開箱不再需要地毯式搜尋（minimap 白點同步）",
      "快取版本 388→389"
    ]
  },
  {
    v: "v380", title: "道具製作列 hover 提示",
    notes: [
      "道具列 title：持有量・成本・效果 — 製作前知道消耗品價值",
      "快取版本 387→388"
    ]
  },
  {
    v: "v379", title: "寶石工坊 hover 提示",
    notes: [
      "寶石列 title：名稱・階級・鑲嵌效果・持有量・融合規則 — 寶石投資決策清楚",
      "快取版本 386→387"
    ]
  },
  {
    v: "v378", title: "王國素材列 hover 提示",
    notes: [
      "素材列 title：名稱・階級・來源・用途 — 農素材決策前置資訊完整",
      "快取版本 385→386"
    ]
  },
  {
    v: "v377", title: "靈藥快捷列 hover 提示",
    notes: [
      "4 靈藥鈕 title：效果・時長・每日計次 — 戰鬥中一瞥即知消耗品價值",
      "快取版本 384→385"
    ]
  },
  {
    v: "v376", title: "關卡情報魔物列 hover 提示",
    notes: [
      "情報視窗魔物列 title：名稱・描述・區域・元素屬性 — 戰前情報完整",
      "快取版本 383→384"
    ]
  },
  {
    v: "v375", title: "離線收益預覽 hover 提示",
    notes: [
      "離線預覽 title：速率明細・上限・休息剩餘／未派遣提醒 — 睡前決策資訊完整",
      "快取版本 382→383"
    ]
  },
  {
    v: "v374", title: "獵頁關卡標題 hover 提示",
    notes: [
      "關卡標題 title：BOSS 關顯示 BOSS 名＋機制入口、普通關顯示情報入口 — 戰鬥中快速查看",
      "快取版本 381→382"
    ]
  },
  {
    v: "v373", title: "每日簽到格 hover 補強",
    notes: [
      "簽到格 title 加獎勵明細＋狀態（已領/今日可簽/錯過/未到期）— 30 天行程規劃清楚",
      "快取版本 380→381"
    ]
  },
  {
    v: "v372", title: "圖鑑里程碑 hover 提示",
    notes: [
      "圖鑑里程碑鈕 title：擊殺目標・領取狀態・尚差數量 — 收集進度一目了然",
      "快取版本 379→380"
    ]
  },
  {
    v: "v371", title: "編隊選擇英雄列 hover 提示",
    notes: [
      "編隊選擇列 title：名稱・職業・等級・戰力・克制標記 — 組隊決策資訊齊全",
      "快取版本 378→379"
    ]
  },
  {
    v: "v370", title: "英雄詳情技能列 hover 提示",
    notes: [
      "技能列 title：名稱・等級・威力・效果・編排狀態（主/副/未編排）— 技能投資與構築決策完整",
      "快取版本 377→378"
    ]
  },
  {
    v: "v369", title: "流浪英雄列 hover 提示",
    notes: [
      "流浪英雄列 title：名稱・稀有度・職業・等級・招募說明 — 掃視村內來訪者即知價值",
      "快取版本 376→377"
    ]
  },
  {
    v: "v368", title: "招募機率列 hover 提示",
    notes: [
      "招募機率列 title：星級・名稱・出現率 — 抽卡決策資訊完整",
      "快取版本 375→376"
    ]
  },
  {
    v: "v367", title: "設定開關 hover 提示",
    notes: [
      "音效/音樂/減少動畫開關加 title 說明 — 設定項目功能一目了然",
      "快取版本 374→375"
    ]
  },
  {
    v: "v366", title: "試煉秘境 hover 提示",
    notes: [
      "秘境列 title：描述・獎勵・剩餘次數・勝率/解鎖條件 — 每日副本選擇決策清楚",
      "快取版本 373→374"
    ]
  },
  {
    v: "v365", title: "昇華傳統/榮譽印記 hover 提示",
    notes: [
      "傳統列＋印記列 title：名稱・等級・效果・目前加成 — 昇華路線規劃清楚",
      "快取版本 372→373"
    ]
  },
  {
    v: "v364", title: "公會/遠古科技 hover 提示",
    notes: [
      "科技線 title：名稱・等級・每級加成・目前總加成 — 升級前知道投資回報",
      "快取版本 371→372"
    ]
  },
  {
    v: "v363", title: "深淵商店 hover 提示",
    notes: [
      "深淵商店列 title：品名・效果・成本・庫存・兌換狀態（含深度門檻）— 碎片消費決策清楚",
      "快取版本 370→371"
    ]
  },
  {
    v: "v362", title: "限時活動商店 hover 提示",
    notes: [
      "活動商店列 title：品名・點數・限兌・持有點數 — 週一重置前規劃掃貨",
      "快取版本 369→370"
    ]
  },
  {
    v: "v361", title: "榮譽商店 hover 提示",
    notes: [
      "榮譽商店列 title：品名・價格・週限・兌換狀態 — 消耗決策一目了然",
      "快取版本 368→369"
    ]
  },
  {
    v: "v360", title: "王者商店 hover 提示",
    notes: [
      "王者商店列 title：品名・價格・本週限購・兌換狀態 — 規劃王者幣消費",
      "快取版本 367→368"
    ]
  },
  {
    v: "v359", title: "委託遠征列 hover 提示",
    notes: [
      "遠征委託 title：品質・需求・時長・派遣條件（總戰力保證）— 派遣前知道規則",
      "快取版本 366→367"
    ]
  },
  {
    v: "v358", title: "迷宮增益列 hover 提示",
    notes: [
      "增益列 title：各增益名稱・層級・加成・同系上限 — 構築決策前看完整疊加",
      "快取版本 365→366"
    ]
  },
  {
    v: "v357", title: "元素試煉層列 hover 提示",
    notes: [
      "試煉層 title：元素・勝率/狀態・獎勵 — 衝塔前評估每層報酬",
      "快取版本 364→365"
    ]
  },
  {
    v: "v356", title: "深淵里程碑 hover 提示",
    notes: [
      "深淵里程碑 title：層數・目前最深・獎勵・領取狀態 — 衝層前知道目標差距",
      "快取版本 363→364"
    ]
  },
  {
    v: "v355", title: "世界/公會首領里程碑 hover 提示",
    notes: [
      "兩首領總傷里程碑 title：進度・獎勵・領取狀態 — 衝里程碑前知道還差多少",
      "快取版本 362→363"
    ]
  },
  {
    v: "v354", title: "競技場對手列 hover 提示",
    notes: [
      "對手列 title：名次・職業・稀有度・戰力・勝率／已挑戰狀態 — 挑對手前知道勝算",
      "快取版本 360→361"
    ]
  },
  {
    v: "v353", title: "七日豪禮 hover 提示",
    notes: [
      "七日豪禮列 title：天數・目標・進度・獎勵・狀態（含 D7 自選傳說）— 新手引導一目了然",
      "快取版本 359→360"
    ]
  },
  {
    v: "v352", title: "成就列 hover 提示",
    notes: [
      "成就 title：名稱・條件・獎勵・狀態（已領/可領/未達成）— 掃視成就頁即知下一步",
      "快取版本 358→359"
    ]
  },
  {
    v: "v351", title: "每日/週任務 hover 提示",
    notes: [
      "任務列 title：名稱・進度・獎勵・重置時間 — 規劃掛機目標不用逐行點開",
      "快取版本 357→358"
    ]
  },
  {
    v: "v350", title: "自動續戰/進關 hover 提示",
    notes: [
      "兩鈕 title：自動續戰（休息完再派遣・離線 12h 上限）、自動進關（過關推進/關閉原地刷關）— 掛機決策一目了然",
      "快取版本 356→357"
    ]
  },
  {
    v: "v349", title: "戰鬥英雄技能 hover 提示",
    notes: [
      "出戰格 title：技能名・效果・魔力・CD・當前冷卻剩餘 — 戰鬥中即時掌握技能狀態",
      "快取版本 355→356"
    ]
  },
  {
    v: "v348", title: "圖鑑魔物行 hover 提示",
    notes: [
      "圖鑑魔物行 title：名稱・區域・元素屬性；BOSS 加註掉寶率提升 — 收集決策資訊齊全",
      "快取版本 354→355"
    ]
  },
  {
    v: "v347", title: "裝備格 hover 提示補強",
    notes: [
      "裝備格 title 加稀有度（★N 名）＋強化 +N — 掃視背包即知階級與投資狀態",
      "快取版本 353→354"
    ]
  },
  {
    v: "v346", title: "建築卡片 hover 提示",
    notes: [
      "建築列 title：名稱・等級・當前效果／鎖定條件 — 建造前知道功能與解鎖門檻",
      "快取版本 352→353"
    ]
  },
  {
    v: "v345", title: "英雄卡片 hover 提示",
    notes: [
      "英雄卡 title：職業・元素屬性・等級・戰力・派遣/出戰狀態 — 快速掃視名冊即知全貌",
      "快取版本 351→352"
    ]
  },
  {
    v: "v344", title: "派遣小關列 hover 提示",
    notes: [
      "小關 1-9 加 title 顯示該關怪物名；BOSS 關顯示 BOSS 名＋掉寶率提升 — 派遣視窗三列 hover 提示全覆蓋",
      "快取版本 350→351"
    ]
  },
  {
    v: "v343", title: "派遣難度列 hover 提示",
    notes: [
      "4 難度加 title（倍率說明／鎖定區解鎖條件）— 選難度前知道代價與回報",
      "快取版本 349→350"
    ]
  },
  {
    v: "v342", title: "派遣視窗章節 hover 提示",
    notes: [
      "派遣視窗章節列 10 區加 title（前往討伐・BOSS 名／鎖定區解鎖條件）— 選區前知道要面對什麼",
      "快取版本 348→349"
    ]
  },
  {
    v: "v341", title: "村莊名牌 hover 提示",
    notes: [
      "村莊名牌加 title（返回王國 — 升級建築/招募英雄/查看資源）— 地圖名牌 hover 提示全覆蓋",
      "快取版本 346→347"
    ]
  },
  {
    v: "v340", title: "模式地標名牌 hover 提示",
    notes: [
      "10 個模式入口名牌加 title 用途提示（含門檻）— 地圖上直接看懂各入口",
      "快取版本 345→346"
    ]
  },
  {
    v: "v339", title: "頂欄資源 hover 提示",
    notes: [
      "頂欄金幣/鑽石加 title 提示（點擊查看取得方式 — 與既有點擊導覽呼應）",
      "快取版本 344→345"
    ]
  },
  {
    v: "v338", title: "更多頁磁磚 hover 描述",
    notes: [
      "19 個功能磁磚加 hover 提示（title — 桌機滑鼠停留顯示用途）— 新手找功能不靠猜",
      "快取版本 343→344"
    ]
  },
  {
    v: "v337", title: "更新歷史最新版本角標",
    notes: [
      "更新歷史首條加「最新」綠角標 — 版本定位一目了然；57 輪煙霧測試全通過",
      "快取版本 342→343"
    ]
  },
  {
    v: "v336", title: "圖鑑魔物搜索框",
    notes: [
      "圖鑑魔物區新增搜索框（名稱/區域即時過濾）— 農素材找怪不翻頁；任務系統審查通過（每日/每週 pbar＋深鏈＋動態目標全完善）",
      "快取版本 341→342"
    ]
  },
  {
    v: "v335", title: "最終技術複查（第三次）＋存檔壓縮驗證",
    notes: [
      "55 輪堆疊後最終複查: 全流程正常、61fps、21 名牌/熱區、minimap、存檔 54 欄位、零 console error/unhandledrejection",
      "存檔匯出壓縮驗證: MGZ1 deflate 13853 vs 原始 48543（-71%）",
      "快取版本 340→341"
    ]
  },
  {
    v: "v334", title: "每日簽到月進度條",
    notes: [
      "每日簽到加月進度條（D X/30）— 滿月慶典目標一目了然",
      "快取版本 339→340"
    ]
  },
  {
    v: "v333", title: "成就總體進度條 ＋ 系統審查",
    notes: [
      "成就「已達成 X/45」加進度條；限時活動審查通過（點數/里程碑/商店）、成就審查通過（45 項/全部領取）",
      "快取版本 338→339"
    ]
  },
  {
    v: "v332", title: "圖鑑完成度進度條 ＋ 系統審查",
    notes: [
      "圖鑑完成度加進度條（百分比視覺化）；圖鑑系統審查通過（魔物/總完成度/英雄收集里程碑＋深鏈前往＋全部領取全完善）",
      "快取版本 337→338"
    ]
  },
  {
    v: "v331", title: "英雄突破慶祝演出 ＋ 系統審查",
    notes: [
      "突破成功新增 mini 慶祝（金柱＋階級文字，與升星慶祝同語彙但輕量；rm 省略）— 養成里程碑儀式感",
      "系統審查通過: 商城（39 項/禮包/神器）、深淵（解鎖門檻/最佳層）、榮譽商店（週限兌換）、英雄系統（升星徽章/慶祝/保底/心願）全完善",
      "快取版本 336→337"
    ]
  },
  {
    v: "v330", title: "七日豪禮總體進度條 ＋ 系統審查",
    notes: [
      "七日豪禮加總體進度條（已領 X/7）— 新手目標鏈一目了然",
      "系統審查通過: 七日豪禮（7 天任務＋最終自選傳說）、委託遠征營（品質委託/獎勵錨/召回 50%）、試煉秘境（三秘境/一鍵掃蕩）全完善",
      "快取版本 335→336"
    ]
  },
  {
    v: "v329", title: "世界首領週討伐進度條 ＋ 系統審查",
    notes: [
      "每週討伐（0/21）加進度條 — 全勤目標一目了然",
      "系統審查通過: 元素試煉塔（15 層/元素輪換/自動挑戰）、奇境迷宮（路線選擇/節點/增益/里程碑）、王者競技場（三隊制/分檔/連勝/一鍵挑戰）、世界首領（每日 3 次/總傷里程碑/週討伐）全完善",
      "快取版本 334→335"
    ]
  },
  {
    v: "v328", title: "競技場天梯第一名皇冠",
    notes: [
      "天梯 #1 顯示 👑 皇冠（取代 #1 數字）— 榜首榮耀一眼可見",
      "競技場系統審查通過（天梯 10 人/挑戰/掃蕩/防守/週結算非線性表全完善）",
      "快取版本 333→334"
    ]
  },
  {
    v: "v327", title: "王城旗幟飄動",
    notes: [
      "城堡塔頂金色三角旗隨風擺動（3.4Hz 正弦＋旗尾）— 王城天際線動態",
      "reducedMotion 定幀旗幟；fx 層零主畫布成本；裝備系統審查同步通過（強化/批量/到滿/閃格/重鑄/篩選持久化全完善）",
      "快取版本 332→333"
    ]
  },
  {
    v: "v326", title: "王國花圃蝴蝶 — 兩隻繞花飛舞",
    notes: [
      "城堡花圃兩隻粉蝶繞花飛舞（8 字軌跡＋拍翅 2 幀）— 與花圃/煙囪煙呼應",
      "reducedMotion 定幀停在花上；fx 層零主畫布成本；公會系統審查通過（科技/捐獻/盛宴/每週首領全完善）",
      "快取版本 331→332"
    ]
  },
  {
    v: "v325", title: "英雄待機偶發張望",
    notes: [
      "戰鬥待機英雄每 ~5s 一次 0.5s 側頭張望（±1.5px 正弦位移，per-seed 相位）— 靜止呼吸更有生命",
      "reducedMotion 無；攻擊/受擊/死亡不觸發；純位移零新幀",
      "快取版本 330→331"
    ]
  },
  {
    v: "v324", title: "職業攻擊動作差異化 — 遠程拉弓/舉杖",
    notes: [
      "弓手/法師攻擊改用攻B幀＋更高舉手（atkLift 8）＋更長前搖（0.35s）— 拉弓/舉杖與近戰揮砍姿勢可辨",
      "劍士/刺客/騎士/牧師維持攻A幀＋短前搖（突刺/揮砍節奏）；施法相位同步差異",
      "純幀選擇差異（sprite 既有幀集），零新美術；快取版本 329→330"
    ]
  },
  {
    v: "v323", title: "全通金冠呼吸閃爍 — tier 3 動態",
    notes: [
      "全通（10/10）區域地標的金冠加呼吸閃爍（500ms 週期）— 榮耀標記更醒目",
      "reducedMotion 恆亮不閃；與烘焙金冠疊加（動態層）",
      "快取版本 328→329"
    ]
  },
  {
    v: "v322", title: "技能傷害數字職業元素色",
    notes: [
      "技能傷害浮字由固定紫改為職業元素色（火橘/冰藍/雷黃/自然綠/暗紫/聖米白）— 與 hit/crit 克制著色同源，全傷害路徑色彩統一",
      "buff/護盾/嘲諷類非傷害技能仍跳技能名（藍）；純視覺零數值",
      "快取版本 327→328"
    ]
  },
  {
    v: "v321", title: "派遣視窗 BOSS 機制預告",
    notes: [
      "BOSS 關（stage 10 倍數）派遣視窗顯示「BOSS「名稱」機制【Ｘ】描述」紅框 — 出征前知道要面對什麼",
      "與關卡情報/最佳練功點/戰力門檻並存；非 BOSS 關不顯示；技術複查同步通過（61fps/11ms 開啟/零錯誤）",
      "快取版本 326→327"
    ]
  },
  {
    v: "v320", title: "王國畫面煙囪煙 — 鐵匠與煉金坊",
    notes: [
      "王國場景鐵匠鋪/煉金坊煙囪冒灰白煙縷（上升消散 3 縷）— 與雲影/火把/村民並存",
      "reducedMotion 定幀煙縷；fx 層動畫零主畫布成本",
      "快取版本 325→326"
    ]
  },
  {
    v: "v319", title: "農田蔬菜壟 ＋ 離線收益端到端驗證",
    notes: [
      "麥田外側小菜園（紅蘿蔔/綠葉菜/南瓜 6 壟）— 農田多樣性",
      "離線收益端到端驗證: 預覽 83.7 萬金/時、5h 結算 422 萬金＋223 萬經驗、領取制入帳 — 全正確",
      "快取版本 324→325"
    ]
  },
  {
    v: "v318", title: "農田烏鴉 — 稻草人互動動畫",
    notes: [
      "烏鴉每 8s 循環：飛入稻草人 → 停駐 → 飛走（拍翅 2 幀）— 農田生動",
      "reducedMotion 定幀停在稻草人肩上；純視覺零數值",
      "快取版本 323→324"
    ]
  },
  {
    v: "v317", title: "郵筒 — 東街轉角",
    notes: [
      "東街×中街轉角郵筒（藍筒身＋紅旗＋頂蓋）— 街道公共設施語彙",
      "烘焙進 buildBase 零每幀成本",
      "快取版本 322→323"
    ]
  },
  {
    v: "v316", title: "晾衣繩 — 屋後日常",
    notes: [
      "東街北段屋後晾衣繩（兩柱＋繩＋紅/藍/白三件衣物）— 村莊日常感補全",
      "烘焙進 buildBase 零每幀成本",
      "快取版本 321→322"
    ]
  },
  {
    v: "v315", title: "村莊生活道具 — 柴堆與水桶",
    notes: [
      "西街北段柴堆（木色疊塊）＋水井旁水桶（鐵皮＋水面）— 生活細節補全",
      "烘焙進 buildBase 零每幀成本；與花圃/長椅/旗幟形成完整村莊日常語彙",
      "快取版本 320→321"
    ]
  },
  {
    v: "v314", title: "城堡花圃 — 紅白小花裝飾",
    notes: [
      "城堡南廣場東側新增花圃（木框＋泥土＋紅×3 白×2 小花＋金蕊）— 城堡前庭生活感",
      "烘焙進 buildBase 零每幀成本；與水井/長椅/攤位形成廣場休憩帶",
      "快取版本 319→320"
    ]
  },
  {
    v: "v313", title: "廣場長椅 ＋ 自動續戰循環驗證",
    notes: [
      "東街×中街旁新增廣場長椅（椅面/椅背/椅腳，烘焙）— 老婦休憩處，與村民行為呼應",
      "自動續戰循環實測通過: 滅團 → 休息 → 自動再戰（fight→retreat→fight 完整循環，弱角沙漠 BOSS 關驗證）",
      "快取版本 318→319"
    ]
  },
  {
    v: "v312", title: "市集旗幟串 — 攤位間節慶三角旗",
    notes: [
      "南廣場攤位間掛 4 面彩色三角旗串（紅/金/藍/綠）＋牽線 — 市集節慶氛圍",
      "烘焙進 buildBase 零每幀成本；與攤位/路燈/村民駐足形成完整市集場景",
      "快取版本 317→318"
    ]
  },
  {
    v: "v311", title: "區域地標全通金冠 — 10/10 榮耀標記",
    notes: [
      "全通（進度 10/10）的區域地標頂部加小金冠 — 每區完整攻略的榮耀可見，推進目標感強化",
      "烘焙進 buildBase 零每幀成本；與既有 tier 1（擊敗 BOSS）升級並存；深淵審查同步通過（生成式里程碑至 1000+ 層、週結算、商店深度門檻全完善）",
      "快取版本 315→317（v310 漏 bump 一併修正）"
    ]
  },
  {
    v: "v310", title: "戰鬥長時穩定性驗證（30 秒 soak）",
    notes: [
      "30 秒連續戰鬥 soak: 擊殺 27 隻、+4021 金、穩定 60fps（1801 幀）、零 console error、零 unhandledrejection",
      "多輪視覺/互動堆疊後的長期穩定性確認 — 無記憶體或事件累積問題；此輪純驗證無代碼變動",
      "快取版本 315→316"
    ]
  },
  {
    v: "v309", title: "小地圖顯示每日寶箱 — 閃爍白點定位",
    notes: [
      "小地圖新增每日寶箱位置（未開時白色閃爍點 600ms 週期）— 每天回地圖一眼找到寶箱，重訪動機強化",
      "開箱後點消失；與村莊/區域/模式點並存不衝突；覺醒經濟審查同步通過（10 次昇華 ≈2250 榮譽 vs 滿級榮譽 1550/項 — 節奏合理）",
      "快取版本 314→315"
    ]
  },
  {
    v: "v308", title: "地圖名牌 hover 提示 ＋ 技術健康複查",
    notes: [
      "區域名牌新增 hover 提示（桌機）：前往區域・守關 BOSS 名・進度 X/10 — 找目標不用點進去",
      "技術複查（多輪視覺堆疊後）: 地圖開啟 15ms（含烘焙）、60fps、零長任務、零 console error、舊檔 normalize 含 mapChest 預設 — 全數健康",
      "快取版本 313→314"
    ]
  },
  {
    v: "v307", title: "海岸小碼頭 — 燈塔旁泊船",
    notes: [
      "燈塔旁新增小碼頭（樁柱＋木板＋纜繩柱，烘焙進 base）；漁船路線改為碼頭 ↔ 外海往返 — 漁業場景完整",
      "設定頁審查同步通過（重播教學/自動喝水/通知/存檔管理全功能驗證）",
      "快取版本 312→313"
    ]
  },
  {
    v: "v306", title: "村民增至 5 種 — 工人與老婦",
    notes: [
      "村莊新增工人（土棕衣、西街鐵匠鋪側往返）與老婦（淡紫衣、廣場長坐 3-6s）— 街道生活感更豐富",
      "與既有農夫/小孩/商人行為節奏各異；同 FF1 四方向繪製契約；reducedMotion 定幀",
      "快取版本 311→312"
    ]
  },
  {
    v: "v305", title: "教學新增世界地圖引導步",
    notes: [
      "新手教學新增第 7 步「探索世界地圖」：引導點擊頂欄地圖鈕（光圈高亮），說明點地名討伐/拖曳探索/灰霧解鎖",
      "既有 6 步順序不變；教學完成門檻 tutorial 0→7 同步（skip 相容）",
      "快取版本 310→311"
    ]
  },
  {
    v: "v304", title: "地圖縮放 — 1×／1.5×／2× 循環",
    notes: [
      "世界地圖標題列新增縮放按鈕：1×→1.5×→2× 循環（邏輯視窗 460×500 / 306×333 / 230×250，顯示倍率放大）",
      "縮放即時重建 canvas（dpr 保持）＋名牌/熱區/minimap 全隨動；2× 下像素細節放大檢視，適合桌機",
      "純顯示層（VW/VH 動態化，buildBase 世界座標不變）；快取版本 308→310"
    ]
  },
  {
    v: "v303", title: "每日任務可達性修復 — 全收集後排除招募任務",
    notes: [
      "六職業全收集的玩家每日任務池不再抽「招募 2 名英雄」（無新英雄可抽，任務永不可達）— 換成其他可完成任務",
      "單職業/新手不受影響（統計 20 次: 單職業出現 12 次、全收集 0 次）；純任務池過濾，零數值變動",
      "快取版本 307→308"
    ]
  },
  {
    v: "v302", title: "模式地標道路連接 — 草原帶交通網",
    notes: [
      "村莊東門 → 競技場 → 公會 → 遠征營 → 試煉秘境，與南巷 → 奇境迷宮 → 無盡深淵 → 元素塔 → 限時活動 → 世界首領兩條支路，模式地標不再是孤島",
      "與既有蜿蜒主路同語彙（#8a6a4a 土路）；烘焙進 buildBase 零每幀成本",
      "快取版本 306→307"
    ]
  },
  {
    v: "v301", title: "地圖探索度顯示 — 已解鎖區進度",
    notes: [
      "地圖說明列右側顯示「探索 X/10 區」（X=已解鎖數）；深淵解鎖後追加「＋深淵」",
      "進度感強化 — 玩家一眼知道世界還剩多少可探索；純顯示唯讀",
      "快取版本 305→306"
    ]
  },
  {
    v: "v300", title: "記住地圖視角 — 切頁往返不丟位置",
    notes: [
      "離開地圖時記住捲動位置（onHide 存閉包），再次開啟回到原位 — 副本/王國往返不再每次重置到村莊",
      "跨存檔防錯位（savedView 帶 save version 比對）；首次開啟仍對準村莊",
      "純 UX 閉包狀態，零存檔改動；快取版本 304→305"
    ]
  },
  {
    v: "v299", title: "地圖氛圍層 — 鳥群／螢火蟲／流星",
    notes: [
      "兩群小鳥橫飛全圖（不同高度/週期/拍翅）；村莊草原帶 8 隻螢火蟲漂浮閃爍；每 ~19 秒一顆對角線流星（白色拖尾）",
      "reducedMotion 鳥群定點、螢火蟲恆亮、無流星 — 全層靜止；純視覺零數值",
      "快取版本 303→304"
    ]
  },
  {
    v: "v298", title: "農田互動 — 點擊收穫小麥",
    notes: [
      "村外麥田可點擊收穫：金幣 80×1.35^(kl-1)（Lv8 實測 653）＋「收穫小麥！」toast＋金色麥粒飛散粒子（0.5s）",
      "每格麥田獨立 15 秒冷卻；與寶箱/野生彩蛋/地標熱區並存（農田判定在寶箱前）",
      "rm 靜止單幀粒子；純互動＋微量獎勵（遠低於掛機產出）；快取版本 302→303"
    ]
  },
  {
    v: "v297", title: "Boss 五機制視覺化 — 護盾罩／再生綠光／毒霧／吸血紅霧／震怒預警圈",
    notes: [
      "五種首領機制全部可讀：護盾（開戰 8s 藍色半透明罩）、再生（血量<50% 綠色呼吸光環＋回復十字）、劇毒（綠色毒霧滴）、吸血（暗紅霧滴，攻擊前搖加深）、震怒（每 8s 週期尾 1.2s 地面紅色預警圈收縮）",
      "monsterView 傳遞 mech/t/aoeT/poisonT；rm 全部恆亮定幀；純視覺不觸 battle 時序",
      "v297FIX：再生綠光亮度提高（白色系龍身上原對比不足）；快取版本 299→302"
    ]
  },
  {
    v: "v296", title: "每日地圖寶箱 — FNV 日種子確定性位置＋開箱獎勵",
    notes: [
      "每天一張地圖出現金箱（FNV 日種子決定區域與位置 — 確定性零隨機，已解鎖區內）：呼吸金暈＋木箱金邊＋鎖扣",
      "點擊開箱：金幣 1000×1.35^(kl-1)（Lv8 實測 8172）＋素材 ×4＋15% 鑽石 ×5；開過即消失，午夜重置重生",
      "存檔新增 mapChest 欄位（向後相容自動補空）；與野生彩蛋/地標熱區並存不衝突；rm 定幀",
      "快取版本 298→299"
    ]
  },
  {
    v: "v295", title: "野外遭遇彩蛋 — 點野生怪物收服小獎勵",
    notes: [
      "地圖上遊蕩的野生怪物（各區 2 隻在地魔物）現在可以點擊：點中給金幣（300×1.35^(kl-1)，隨王國等級縮放）＋「收服野生ＸＸ！」toast",
      "每隻怪物獨立 60 秒冷卻（閉包 Map，不落存檔）；拖曳後點擊不觸發（沿用 suppressClick）；reducedMotion 不影響",
      "純視覺＋微量金幣獎勵（數量級遠低於掛機產出，不破壞經濟）；快取版本 297→298"
    ]
  },
  {
    v: "v294", title: "馬車路徑快取 — 每幀效能優化",
    notes: [
      "roadPoints（含 fbm 雜訊插值）原每幀重算；改為 roadPointsCached 依 upTo（已解鎖區數）快取，解鎖不變即重用",
      "馬車繪製為地圖動態層每幀呼叫，快取消除重複的 22 點+雜訊運算；結果完全一致（純優化零視覺變動）",
      "快取版本 296→297"
    ]
  },
  {
    v: "v293", title: "海洋活化 — 海岸燈塔＋漁船巡航",
    notes: [
      "蒼穹之塔東南角海岸燈塔（白塔紅紋＋金燈窗＋頂燈，烘焙進 base）；燈塔光束緩慢左右掃過海域（2.4s 週期）",
      "右下海域漁船巡航（16s 東→西往返，木色船體＋米白帆＋船身起伏）— 海洋從靜態波紋升級為有生命",
      "reducedMotion 光束/船身定幀靜止；純視覺零數值；快取版本 295→296"
    ]
  },
  {
    v: "v292", title: "村莊生活感 — 街道路燈＋南廣場攤位",
    notes: [
      "街道兩側 6 盞路燈（黑色細柱＋暖黃燈罩），夜城氛圍；南廣場 3 個集市攤位（木色攤台＋紅遮陽棚頂＋雙色貨物）",
      "水井旁形成小型市集視覺焦點，與村民漫步/駐足行為呼應；烘焙進 buildBase 零每幀成本",
      "快取版本 294→295"
    ]
  },
  {
    v: "v291", title: "小地圖導航 — 96×60 縮略＋視口框＋點擊跳轉",
    notes: [
      "世界地圖右下角新增小地圖：村莊白點／已解鎖區綠點／鎖定區灰點／模式地標金點／視口白框隨捲動即時更新",
      "點擊小地圖任意處 → 視口跳轉該位置（clamp 邊界）；pointerdown stopPropagation 不干擾拖曳；僅 96×60 每幀重繪成本極低",
      "快取版本 293→294"
    ]
  },
  {
    v: "v290", title: "傷害數字屬性色 — 元素克制時顯示職業元素色",
    notes: [
      "元素克制攻擊（+25%）的傷害數字改用職業元素色（火橘/冰藍/雷黃/自然綠/暗紫/聖米白），克制生效一眼可見；無克制維持暴擊金/普通白",
      "近戰/遠程/延遲命中三路浮字統一；僅視覺著色，數值與事件語義零變動",
      "快取版本 292→293"
    ]
  },
  {
    v: "v289", title: "英雄狀態腳下光圈 — 護盾藍／嘲諷紅／增益金",
    notes: [
      "英雄狀態雙重提示：護盾藍色光圈、嘲諷紅色光圈、增益（buff）金色光圈繪於腳下橢圓雙環（9/12px 呼吸脈動），與頭頂圖示/文字並存",
      "reducedMotion 光圈恆亮不脈動；死亡不繪製；純視覺不觸數值",
      "快取版本 290→291"
    ]
  },
  {
    v: "v288", title: "怪物行動前搖 — 攻擊前蓄力抖動",
    notes: [
      "怪物攻擊前 0.22s 蓄力預告：快速抖動（46Hz × 2.2px）＋微下沉，讓「怪物要出手了」可讀 — 對應戰鬥節奏的防守判斷視窗",
      "monsterView 傳遞 mAtk 剩餘秒；受擊/凍結/死亡/待機不觸發；reducedMotion 靜止不抖",
      "純視覺（繪製位移），battle 時序契約零觸碰；快取版本 289→290"
    ]
  },
  {
    v: "v287", title: "怪物血條升級 — Boss 加粗＋瀕死脈動警訊",
    notes: [
      "BOSS 血條 6→9px 加粗（體型分級配套：Boss 1.5× 體型＋粗血條一眼可辨）；普通怪維持 6px",
      "瀕死警訊：任何怪物血量 <25% 時血條紅色脈動閃爍（12Hz sin）＋金邊脈動；reducedMotion 恆亮不閃",
      "名字標籤隨血條加高自動下移，不受遮擋；純視覺不觸數值；快取版本 288→289"
    ]
  },
  {
    v: "v286", title: "模式地標狀態 pin — 世界首領剩戰／活動剩天／遠征進行中",
    notes: [
      "地圖名牌直接顯示即時狀態：世界首領「剩 N 戰／已討伐」、限時活動「剩 N 天／最後一天」、委託遠征營「進行中 N」— 重訪動機一眼可見，不用點進 modal",
      "狀態由 modeState() 讀取既有系統 API（worldboss.left/events.current/expedState），唯讀不觸數值；系統異常回空字串不崩潰",
      "名牌防碰撞自動涵蓋加寬名牌（驗證零重疊）；快取版本 287→288"
    ]
  },
  {
    v: "v285", title: "模式地標主題動畫 — 對齊區域地標動態水準",
    notes: [
      "10 個模式地標各加 1 個辨識動態：競技場紅旗飄動／王者金冠閃爍／試煉藍符文脈動／世界首領紅點脈動（倒數感）／元素塔塔尖四向光芒／迷宮入口金燈呼吸／公會紅旗／活動公告金條閃爍／深淵紫色幽光上浮／遠征營營火跳動",
      "reducedMotion 全數靜止幀（單幀固定亮度）；動畫皆 2-6px 級小元素，不遮名牌；純視覺不觸數值",
      "快取版本 286→287"
    ]
  },
  {
    v: "v284", title: "新區解鎖慶祝 — 地圖自動捲動＋金環煙火",
    notes: [
      "擊敗 BOSS 解鎖新區域後重開地圖：自動平滑捲動到新區（smoothstep 1s，reducedMotion 直接跳），玩家立刻看到慶祝",
      "新區地標播放 2.8s 金環擴張（兩環交錯淡出）＋12 向煙火粒子＋上升火花；reducedMotion 顯示靜止金環",
      "跨畫面追蹤 maxRegionReached（閉包 lastMaxRegionSeen）：首次載入不慶祝，之後每次解鎖增長觸發；純視覺不觸數值",
      "快取版本 284→286"
    ]
  },
  {
    v: "v283", title: "地標本體 44px 觸控熱區＋拖曳誤觸點擊修復",
    notes: [
      "地圖 21 個地標（村莊＋10 區＋10 模式）新增隱形 44×44 觸控熱區：點地標本體圖示＝與點名牌同行為（村莊回城/區域討伐/模式入口，鎖定區給 toast 回饋）；桌機 hover 顯示金色細框提示（觸控裝置隱藏）",
      "修復拖曳後誤觸點擊：原 drag.moved 檢查在 pointerup 後失效（drag 已清空），拖曳結束鬆手在名牌/熱區上會誤觸發 — 改為 onUp 設定 suppressClick 旗標，下次 click 吞掉；地圖捲動與點擊判定從此分離",
      "熱區 z-index 介於 canvas 與名牌之間，不遮名牌文字；reducedMotion 不影響（純 DOM 互動層）；快取版本 283→284"
    ]
  },
  {
    v: "v282", title: "村莊小人行為多樣化 — 農夫/小孩/商人",
    notes: [
      "村民身份化：農夫（綠衣草帽、慢速 0.26、農田側節點歇腳）、小孩（亮藍衣、快速 0.52、好動短暫停）、商人（紅衣深帽、中速、東門擺攤長駐足）— 各自可辨識的配色＋行為節奏",
      "駐足邏輯：homeNode 到達時暫停 ×2.2（農夫南巷/商人東門）；目標選擇偏好農田節點（10/11）與東門（9）",
      "英雄/流浪英雄維持職業色漫步；reducedMotion 定幀靜止不變；純視覺改動不觸數值/存檔；快取版本 282→283"
    ]
  },
  {
    v: "v281", title: "地圖小人四方向行走（FF1 語彙）＋四幀走路循環",
    notes: [
      "地圖小人（領地英雄/流浪英雄/村民）由左右鏡像 2 幀升級為四方向：正面（髮頂＋完整臉）、背面（全髮無臉＋身體暗化背光）、左/右側面（側臉）— 同角色四方向髮色/身體色一致，FF1 契約約束",
      "方向判定依 BFS 位移等角主軸：(vx,vy)=(dc-dr, dc+dr)，|vx|≥|vy| 取側面否則取前/後 — 街道行走方向切換自然",
      "走路循環 2 幀 → 4 幀（240ms/幀：bob 上下浮動 × 雙腿相位交替）；reducedMotion 維持定幀靜止",
      "像素驗證：正面 skin 192px/背面 skin 0px＋髮 480px/側面 skin 64px — 四方向特徵明確且同角色配色一致；快取版本 281→282"
    ]
  },
  {
    v: "v280", title: "世界地圖加高填滿＋名牌防碰撞＋舊檔解鎖推導修復（技術健康掃描輪）",
    notes: [
      "等角地圖視窗 460×350 → 460×500：填滿 stage 可用高度，下方 188px 留白縮至 49px，主場景視野提升 37%（純視覺，座標/名牌/捲動 clamp 全隨動）",
      "名牌防碰撞：placeLabels 依錨點 y 排序掃描重疊對，重疊時下推（上方/下方模式各自正確計算）；區名牌進度省略「/10」縮窄 22px，從根源解開草原帶相鄰區重疊（幽暗森林↔灰燼洞穴 13×16px 重疊清零）",
      "修復舊檔解鎖推導死碼：normalize 先讀原始 stats 再合併 base — 原實作 base.maxRegionReached:0 填補舊檔缺欄，導致 maxTierReached 推導分支永不執行，舊玩家載入後地圖全鎖 region 0",
      "快取版本 279→281"
    ]
  },
  {
    v: "v279", title: "像素風 UI/UX 復原＋等角世界地圖回歸（合併版）",
    notes: [
      "整體 UI/UX 復原合併前像素風設計系統：Fusion Pixel 12px 點陣字體＋全站直角硬框 2px 黑描邊＋硬投影＋夜空星點背景＋進度條像素化（style.css/extra.css 還原 v157 語彙，面板金色直角括號／稀有度呼吸光澤保留）",
      "等角世界地圖（map.js）取代 v271 開放世界大地圖：46×28 TheoTown 風連續地形＋村莊 18×14（v172 東擴）＋區域地標/野生怪物/村外農田/街道小人/戰爭迷霧全部回歸",
      "worldmap.js 的 10 個模式入口（競技場/王者競技場/試煉秘境/世界首領/元素試煉塔/奇境迷宮/公會盛宴/限時活動/無盡深淵/委託遠征營）移植為等角地圖東方草原帶的像素地標：gate 門檻 toast／鎖定 🔒／badges 徽章點／呼吸光暈",
      "頂欄世界地圖鈕回歸（icon_map）；副本「⤴ 大地圖」回指等角地圖；王國畫面還原村莊場景（v207 城堡升級儀式／v247 建築置中保留）；16 新系統全數保留可從地圖入口進入；快取版本 278→279"
    ]
  },
  {
    v: "v278", title: "六職業精靈換回 FF1 GBA 風格",
    notes: [
      "六職業（劍士/弓手/法師/刺客/騎士/牧師）精靈全面換回 FF1 GBA 官方風格（改色降版權感）：12 色調色盤 × 7 幀動畫（呼吸/走動/兩段攻擊/後仰受擊）",
      "走路維持左右鏡像；戰鬥攻擊三相位、名冊頭像同步更新；快取版本 277→278"
    ]
  },
  {
    v: "v275", title: "正式版合併開發線：16 新系統與 v147-v274 全部迭代",
    notes: [
      "正式版（v172）整併 TEST 開發線 v147-v274 全部內容：競技場/公會/神器/無盡深淵/奇境迷宮/元素試煉塔/委託遠征營/每日世界首領/王者競技場/每日特惠/限時活動/試煉秘境/七日豪禮/傳說徽章/碎片合成/深淵商店/榮譽商店等系統",
      "開放世界大地圖（v271）取代原等角世界地圖；存檔向後相容：v172 舊檔載入自動補齊新欄位，英雄/裝備/建築/任務進度保留",
      "派遣制、死亡與續戰行為以開發線（v274）設計為準；快取版本 173→275"
    ]
  },
  {
    v: "v272", title: "委託遠征營（板凳英雄定時委託板）",
    notes: [
      "委託遠征營（王國 Lv16 解鎖 — 新模組 js/sys/expedition.js）：4-6 委託欄位（Lv20/24 擴充）、每日 6 張委託（FNV 日種子確定性 — 品質普通/稀有/史詩）、派遣 1-3 名空閒英雄、總戰力 ≥ 需求保證成功、職業匹配效率 ×1.1-1.3",
      "牆鐘結算（完成自動入袋＋離線摘要）· 提前召回領 50%；獎勵錨 U=5000×1.35^(kl-1)（週產 < 市場週消耗端 — 書僅史詩、虛空僅史詩）",
      "busy 守衛：遠征中不可編隊/自動編隊/共鳴/置換/遣散（8 處 — 含批量遣散勾選排除）— 要掛機收益還是要陣容彈性的真取捨"
    ]
  },
  {
    v: "v271", title: "開放世界大地圖（TheoTown 風格・A1-3 落地）",
    notes: [
      "可捲動世界大地圖：1600×1000 世界 + 480×320 視口 — 王國畫布改為世界視口（拖曳捲動＋四角方向鈕＋⌂回村鈕），村莊置中於世界中心，四周放射分帶（村莊帶→農田自然帶→冒險帶→遠景環）",
      "靜態地形 chunk 惰性烘焙（400×250×16 塊、全球座標 hsh 確定性、跨 chunk 接縫無痕、首視口預烘 4 塊）：不規則田塊/樹叢/蜿蜒道路（四門放射 19 條）＋北緣山脈剪影＋遠景壓暗環",
      "10 狩獵區落座冒險帶（翠綠草原/幽暗森林/灰燼洞穴/烈焰火山/冰封高原/黃沙荒漠/詛咒沼澤/蒼穹之塔/深淵裂谷/神話之域）：REGION_THEME 夜色壓暗地形團＋區主題小物（叢樹/雪點/沙丘紋/裂縫/餘燼/水漬/塔影/星芒）＋每區 1 座巢穴入口（A3 石框語彙）",
      "9 座模式地標入口（競技場/王者競技場/試煉秘境/世界首領/元素試煉塔/奇境迷宮/公會盛宴/限時活動/無盡深淵）：點擊直連對應 modal；解鎖門檻（王國 Lv12/14、深淵 5 區）鎖定外觀＋點擊守衛；badges 紅藍點 500ms 節流",
      "入口點擊全部接線（hunt 入口 → gotoMonster(idx,1)；地標 → open*）；建築點擊改 canvas 世界座標命中（原 DOM overlay 移除）；修正潛在炸點：openAbyss 補匯出（v263 待辦深淵行與地圖入口共用）",
      "效能：村莊視圖 ≈1830 ops/幀（對 v267 基線 −3%）、捲離村莊 ≈60-100（−95%）；全模組零 Math.random、reducedMotion 光暈恆亮、battle.js/存檔 schema 零觸碰"
    ]
  },
  {
    v: "v268", title: "共鳴自動填槽＋王者一鍵挑戰（高頻操作聚合）",
    notes: [
      "共鳴祭壇：新增「自動填入受益英雄」一鍵（受益 = 未入槽且等級低於基準，依受益差距優先依序填滿空槽；槽滿/無受益者分開提示）；名冊候選受益優先排序＋每列標示「→ 受益至 Lv X」/「已達基準，放槽無效果」",
      "共鳴祭壇操作重構：放入/移出英雄改就地更新（原每放一人整窗重開 5-8 次 — 捲動與上下文全丟）；填滿後按鈕自動灰化",
      "王者競技場 modal 內新增「⚔ 一鍵挑戰剩餘 X 次」（與競技場掃蕩對稱 — 每日 5 次例行在系統內 1 擊收斂，彙總勝敗/積分/最高連勝）"
    ]
  },
  {
    v: "v267", title: "村莊地形色階精修（A4：過渡帶＋16-bit 顆粒＋村莊帶暖土）",
    notes: [
      "色階過渡帶：地面頂緣／石板路頂緣改 2 級整列＋dither 交錯點（草地→土路→水岸不再 1px 硬切）、路底濕泥破折、農田深耕土緣＋農田面上暖土交錯羽化、廣場土徑圍環（上/下緣＋左緣）",
      "16-bit 顆粒密度：基底暗點加倍＋月光亮點 28 點（偏右對應月亮）＋農田茬點／廣場磚面凹坑／潭岸泥斑 — 每個地形區有專屬顆粒語彙",
      "村莊帶暖土區隔：「這裡是家」讀法 — 核心區土壤比外圍草地暖 1 級（#2a2b3e），兩側 hsh 羽化無硬線；火把暖光落點從冷草變暖土，A4 溫暖色板統一",
      "全靜態底景、hsh 確定性零隨機、零座標移動（建築/點擊區/村民/動物不受影響）；效能優化：逐列 1440 次 fillRect → 4 整列＋240 dither 點"
    ]
  },
  {
    v: "v266", title: "奇境迷宮 UX 整合補完（真·三選一分支＋獎勵預告＋紅點接線）",
    notes: [
      "層入口「選擇本層路線」落地：3 張路線卡並排（戰/箱/事＋層末首領的 4 節點序列），選定後本層路線定型（同週全玩家相同 — 可分享攻略）；選擇面板不再重複出現",
      "寶箱具名預告：開啟前即顯示內容素材與數量（與發獎同源，確定性）；事件按鈕顯示下次層級 %＋同系最多 ×3，已滿系自動禁用",
      "週一重置倒數（距下週重置時間）＋里程碑標記列（已領 ✓／僅下一目標高亮「還差 N」）",
      "迷宮藍點修復（原 badges 已計算但 UI 從未消費）＋今日待辦新增迷宮行（王國 Lv14 解鎖／可探索／本週全通）"
    ]
  },
  {
    v: "v265", title: "奇境迷宮（週限 roguelike — 路線選擇＋三選一增益）",
    notes: [
      "奇境迷宮（王國 Lv14 解鎖 — 新模組 js/sys/maze.js）：每週 1 次完整探索，3 層 × 4 節點（層入口 3 選 1 分支）；節點 4 型：戰鬥（shadow sim 勝率、可換隊重試）/寶箱（確定性資源）/事件（三選一增益）/層末首領（戰力錨 ×1.0/1.08/1.15）",
      "增益 5 系 × 3 層級（普通 +8%/稀有 +15%/傳說 +25%）— 同系加法疊加、單系封頂 ×1.5（有界哲學）；增益乘數併入 teamPower 單一來源（sim 與實戰同源）；確定性種子 FNV(週key) — 同週同圖可分享攻略",
      "里程碑：節點 3/6/9/12 → 虛空 10/15/20/25・書 2/3/4/5・T3 1/2/3/4；全通 +300 鑽・徽章碎片 ×2（settled 防重發）；失敗/退出本週可重進；離線不結算；週產占比 <5% 防印鈔",
      "多隊投資消費者 +1（5 隊選 1 出戰）；純新增零 nerf 零存檔結構變更（ensure 兜底）battle.js 零觸碰"
    ]
  },
  {
    v: "v264", title: "王者競技場產出校準＋深淵商店 v2（第 100 輪里程碑）",
    notes: [
      "王者競技場經濟校準（第 100 輪審查最新系統）：敗場保底 1 分（原敗 0 — 每日 5 次約 2.8 次白打；參與有回報）；置換石商店 30→20 幣（週產保底後核心三件可達 — 商店缺口 38% 收斂）；置換消耗 1+星差 → 1+⌈星差/2⌉（置換窗口 4 週→3 週 — 週產 1 石下救贖可達）",
      "深淵商店 v2（v259 留後落地 — T3 死貨幣收尾）：素材兌換上限深化 min(30, 12+⌊(best-300)/100⌋)（best 700:16/1500:24/4300+:30 — 死貨幣 45%→<15%）；新增週限消耗品：技能書 ×5（void 150・深度 600+・週 4 包）＋招募券 ×1（void 300・深度 700+・週 3 張）— 深度門檻確保中期節奏不變",
      "純新增/零 nerf/零存檔結構變更；公式校準皆以既有產出錨為基準"
    ]
  },
  {
    v: "v263", title: "一鍵例行巡檢＋名冊可突破徽章（登入儀式最後一哩）",
    notes: [
      "一鍵例行巡檢：今日待辦每行 inline「▶」直接執行免費批次（競技場掃蕩/王者挑戰剩餘/秘境掃蕩/世界首領一鍵/元素塔自動/深淵踏入連戰 — runner 自 modal 閉包提升，與手動逐擊同契約零 sys 改動）；「一鍵例行」鈕依序執行全部、單一彙總 toast；花費類（盛宴/投餵/特惠）保留各自 confirm 不併入",
      "待辦補齊缺席行：元素塔（自動挑戰）／深淵（踏入並連戰）— 12 行全錨點；執行後 refreshAll＋強制重繪（紅點/值即時同步）",
      "名冊「可突破」就緒角標（canPromote 同源 — 金「突N」／灰缺口 title 揭示金幣/素材差額；v248 留後 c3 補完）+「可成長」篩選 chip（可升星/可突破/可訓練/技能可升任一就緒即入選）— 今日養成決策一眼掃描",
      "純暴露層零數值/零存檔結構/battle.js 零觸碰/sys 契約零變更"
    ]
  },
  {
    v: "v262", title: "村莊動物點綴（雞啄食・豬拱地）",
    notes: [
      "王國場景加入 3 隻動物（style-guide「雞豬牛羊點綴」兌現）：左/右農田帶各 1 雞（相向啄食）、廣場右緣 1 豬（拱地）",
      "全新 12×12 手繪精靈（a_chicken／a_pig，各 2 幀：站立↔啄食/拱地）— 沿用村民幀段契約，animFrame fps 5（400ms/幀）悠閒節奏",
      "純視覺層：時間雜湊零狀態（同 t 確定性）、reducedMotion 定點第 0 幀、battle.js 零觸碰、零存檔變更"
    ]
  },
  {
    v: "v261", title: "王者競技場 UX 整合補完（選隊生效・紅點・週報・導覽）",
    notes: [
      "選隊生效修復（實錘缺陷）：genOpps/winChance/challenge 改用 r.teamIds 對應隊（原硬用 formations 0-2 — 「挑 3 隊」只是按鈕開關）；換隊重錨幻影（oppsSig 簽名）；王國 Lv12 解鎖 gate 落地（changelog 承諾）",
      "紅點整合（v236 soft 語意）：badges 加 out.royal（已解鎖且免費次數可用 → 藍點，與競技場同構）；磁磚/更多頁籤自動涵蓋",
      "結算週報＋分檔揭露：跨週結算寫 lastWeek（積分/分檔/幣數）；openRoyal 顯示上週結算＋本週分檔進度條（3/9/15→+15/+30/+50）＋連勝數；戰果面板（上次挑戰三隊勝敗＋勝率）",
      "導覽補完：王國 RES 格加王者幣/置換石（7 格全可點）；資源導覽補兩新貨幣來源（週結算/王者商店）；置換石 0 時詳情鈕附取得提示＋前往王者商店深鏈",
      "純資訊揭露＋設計承諾修復：零數值/零存檔結構變更/battle.js 零觸碰"
    ]
  },
  {
    v: "v260", title: "王者競技場（三隊制週迴圈 PvP）＋英雄置換",
    notes: [
      "王者競技場（王國 Lv12 解鎖 — 新模組 js/sys/royal.js）：自 5 隊編制挑 3 隊出戰，對決每週幻影（戰力錨 = 我方對應隊 ×[1.35,1.15,1.0] — 勝率恆穩，排名制不依賴絕對戰力）；各隊 shadow sim（tower 公式 win/(win+rec) clamp 0.1-0.98）3 戰 2 勝；每日 5 次；週積分（勝 3 幣＋連勝）→ 跨週自動結算王者幣＋分檔追加（漏領不損失 — 討伐模式）；離線不結算",
      "王者商店（週限 — honorshop/v259 模式克隆）：置換石 30 幣×週1／徽章碎片 40 幣×週1／T3 碎片 20 幣×週3／技能書 15 幣×週3 — 週產封頂防印鈔",
      "英雄置換（練錯救贖）：同職業 A↔B 投資全套對調（星級/等級/突破/技能書/spentGold/主副技）— 消耗置換石 ×(1+星差)；不交換裝備/神器（英雄綁定）；fightGuard/鎖定守衛；formations/dispatch/resonance id 對調＋殘 id 清理；重置退款按對調後投資等價（置換石即稅無套利）",
      "多隊深度（v254/255/259 三輪投資）第一次有專屬每週回報 — 第二/三隊的星級、技能編排、神器不再是塔以外裝飾；零 battle.js 觸碰/零存檔結構遷移"
    ]
  },
  {
    v: "v259", title: "市場週限兌換＋共鳴槽成長（金幣目標續航・多隊覆蓋）",
    notes: [
      "市場「週限兌換」區（honorshop 模式克隆 — weekKey/redeemed/ensure 零遷移）：5 件金幣大件，價格錨 U=5000×1.35^(kl-1)（與古書回收/寶袋同錨 — 零 shock 不漲現有特惠價）— 素材包 ×20（0.4U×週5）／T3 碎片 ×2（0.8U×週5）／技能書 ×10（1U×週3）／招募券（1.2U×週3）／徽章碎片（2U×週2）；週全買 ≈16.6U ≈ 深淵 800 層 6 小時產出（週產 3.4%）；兌換效率 ≤ 農取 1/20（便利稅非印鈔）",
      "金幣目標從「一次性 98B」變「每週決策」：遠古完成不再是終點；深淵深度→金幣→週限大件閉環，農金持續有意義；商會傳統折扣沿用",
      "共鳴槽數隨王國等級成長（5→8：kl15=6、kl19=7、kl23=8）：基準語義不變（全名冊第 5 高 — 頂端決策保留），受益名單擴大 — 討伐弱點隊+競技場防守+塔元素輪換 15-20 人可玩；舊檔 slots 陣列 undefined 補位相容",
      "純新增零 nerf：不動現有特惠價格/科技樹/等級曲線；零存檔結構變更"
    ]
  },
  {
    v: "v258", title: "每日例行三件套：靈藥全啟用・深淵連續挑戰・手冊磁磚排序",
    notes: [
      "靈藥「全部啟用」一鍵批量：三種靈藥（攻擊/金幣/經驗）單一 askQtyModal（上限=三種庫存最小）→ 依序啟用 n 瓶（與手動同值：加法疊加/max 不縮短；缺貨跳過並列出）；沙漏時長維度不同不混批；每日加成模態鏈 3→1（chip 剩餘時間 v193 已有）",
      "深淵「連續挑戰」：modal 內 toggle（滅團休息後自動再戰 — 獨立於全域 autoDispatch，深淵自動/普通手動分流）+「踏入並連續挑戰」一鍵；battle retreat 分支條件擴充（region===abyss.INDEX && autoRetry）；leave() 清除；經濟零變更（休息復活/連敗回退均既有契約）",
      "冒險手冊磁磚自訂排序：settings.tileOrder（渲染時過濾未知 id + 缺省尾插 — save 零遷移）；「排序 ▸」編輯模式 ↑↓ 微調（行動版安全）+ 完成；變更走 MG.core.save.save()；紅點映射零變更",
      "三項皆「每日例行」摩擦收尾：藥水模態鏈/深淵重進成本/入口導航 — 純 UI 包裝既有契約零數值/零存檔結構變更"
    ]
  },
  {
    v: "v257", title: "怪物巢穴入口（美術・A3）",
    notes: [
      "三個外圈地形區入口（style-guide「怪物副本區域」）：左「森林獸穴洞口」（石框拱形＋獸眼＋嵌樹群基部）、右「山腳洞窟」（石框＋旗幟標識）、湖邊水洞（洞口下緣疊潭岸＋洞底水線 — 通往水下的洞）",
      "呼吸光暈 fx（drawTownLife — 月亮/螢火蟲既有模式）：三入口 3×3 暖光 #ffbe5a（水洞 #7ec8e0）＋外層微暈，alpha 正弦呼吸、ph 固定常數；reducedMotion 恆亮 0.3",
      "點擊連狩獵：3 個透明點擊 cell（與建築 cell 同模式 zIndex2）→ MG.ui.screens.show(\"hunt\")（與 v231 chip 同契約 — 零狀態變更，不改戰鬥機制）",
      "兩畫布（480×200/480×270）gndY 錨定自動繼承；純視覺零數值/零存檔/battle.js 零觸碰；座標全在建築/點擊區外"
    ]
  },
  {
    v: "v256", title: "資訊揭露三合一：產出明細・圖鑑掉落・招募機率",
    notes: [
      "產出加成明細：rates() 原地收集每層乘數（建築/靈藥/昇華/榮譽階/公會科技/狩獵傳統/週末雙倍/在線專注）併入回傳（呼叫端只讀 /秒 零破壞）；王國生產卡「加成明細 ▸」modal — 每個養成投資收益可查證（v174 隱形折扣信任修復）",
      "圖鑑掉落一覽：dropInfoOf 與 scaledMonster/lootInfoBlock 同源（機率永不漂移）；DROP_RATES 收斂至 config 單一來源（hunt.js 硬編碼 7.5/3.5/1.5/35/20% 改讀）；圖鑑魔物行「掉落 ▸」modal — 素材/藥水/裝備/寶石/書/BOSS 額外，農材料決策前置資訊",
      "招募機率表：三種招募逐★揭露（weight/sum 即時計算 — 機率即資料永不漂移）＋保底註記（含保底出貨率高於基礎值）＋神話 ★6 25% 傳說；台灣抽卡透明化標準",
      "純暴露層零數值/零機率/零存檔變更；rates 回傳加 parts 欄位零破壞（save/welcome/kingdom 呼叫端相容）"
    ]
  },
  {
    v: "v255", title: "技能編排 v2（主+副雙槽輪轉）＋編隊批量",
    notes: [
      "每英雄雙主動槽：主技（v250）+ 副技（預設職業第二技）— battle 排序 [主, 副, 其餘]、step() 副技獨立計時軌（主技冷卻/失敗不阻塞；MP 為天然雙重節制低池自動錯開）",
      "副技凍結時長 ×0.5（同隊雙凍結 uptime 封頂）；主=副互斥守衛；resetHero 清雙槽；舊檔 null → 主技第一技/副技第二技（若解鎖）",
      "個人構築升級：騎士=嘲諷+聖光、牧師=群補+聖裁、法師=火球+冰霜新星 — 「練哪招」→「輪轉組合」決策；v249 技能書 Lv10 投資與職業定位全面兌現",
      "編隊批量（v253 留後 c1 落地）：編隊管理「搬移到隊 N」（整隊搬移 — 英雄跨隊互斥，覆寫 confirm）＋「編滿全部隊」（戰力貪婪填空格、保留既有編入、跳過鎖定）；競技場防守「自動最強 5 人」（與手動同契約）— 每週換陣 25+ 擊 → 2-3 擊"
    ]
  },
  {
    v: "v254", title: "共鳴祭壇（板凳等級斷層修復 — AFK 共鳴水晶）",
    notes: [
      "王國 Lv10 解鎖「共鳴祭壇」（英雄頁入口）：5 槽選英雄，基準 = 槽內最低等級，槽內英雄實戰等級 = max(自身, 基準) 封頂 200 — 板凳英雄直接可用",
      "baseStats 單一掛鉤（combatLevel）— 戰鬥/戰力/塔/深淵/競技場防守自動一致；升星/技能解鎖/突破/訓練仍看真實等級 — 個人投資完整保留，共鳴只同步等級",
      "經驗只給出戰 5 人 vs 40 人名冊 — 主隊 Lv150-200 時板凳 30-80 無法上場（換陣/元素克制/討伐全卡死）；共鳴打通斷層後 v249 技能目標/v250 主動技對板凳的投資全面復活",
      "槽位分配是玩家決策（隨時可換）；零 nerf/零數值曲線變更/零存檔遷移（st.resonance 惰性 ensure）"
    ]
  },
  {
    v: "v253", title: "王國一鍵全領＋神器精煉到滿（每日例行聚合）",
    notes: [
      "王國頁「今日待辦」新增「一鍵領取全部」：依序串接既有 claimAll 家族（每日/每週/成就/圖鑑/活動/深淵/七日豪禮/簽到/週討伐）— 逐來源獨立 try 不阻斷、彙總 toast、領完重繪紅點自然滅；welcome d7 傳說保留選角窗不靜默；可領時金底高亮（badges.check 同源）",
      "簽到 while 迴圈逐日領（claimCheckin 月限守衛天然生效）；週討伐 claimAllWeek（fresh weekInfo 驗證防跨週孤兒重發 v245FIX 模式）",
      "神器精煉「到滿」：影子模擬逐級預估（artifactRefineCost 同公式 — 本地 lv 遞增計價防失真）→ confirm（>3 級或 >2 萬金）→ 逐級 refineArtifact 契約；8 神器×9 級 72 次逐擊 → 1 擊；資源不足/Lv10 自動停",
      "登入收菜 15-25 擊 → 1 擊；純收益零消耗；零數值/零存檔結構變更/battle.js 零觸碰"
    ]
  },
  {
    v: "v252", title: "自然地形不規則化（美術・A2）",
    notes: [
      "彎曲河流（絕非直線水渠）：溪流逐 x 列上下緣正弦擺幅 ±3px、寬 4..7px 動態；岸線淺灘 3 級色階過渡（淺灘 #2a3d68 → 水 #22325a → 深水 #141c2e）；高光/水紋掛動態緣（不再固定 y）；橋下 clamp 不漏水",
      "不規則湖岸：小潭逐列階梯岸線（寬 24..34 參差）＋淺水延伸尾巴 — 取代直角矩形；農田側翼逐列階梯＋列間錯位（參差田緣）＋3 級色階 — 禁止矩形整齊邊界",
      "樹林叢生化：模組級確定性哈希 hsh()（同輸入同輸出、重繪不變）；縫隙樹 4 棵等距 → 每縫隙 1-3 棵（疏密有致、x 抖動硬限縫隙帶防蓋建築、樹種/尺寸參差）；四角樹叢 2 棵 → 5 棵簇狀（林緣參差）；樹籬 4 段 → 2 段",
      "山丘逐座差異化＋4 級色階過渡（山腳→山腰→山脊→月霜山頂 — 圓弧非階梯）；山脊樹線 5..9 點疏密有致",
      "兩畫布（480×200/480×270）經 drawTown 單一函式自動繼承；純視覺零數值/零存檔/battle.js 零觸碰"
    ]
  },
  {
    v: "v251", title: "滅團戰報（敗因診斷）",
    notes: [
      "滅團時彈出戰報 modal：戰鬥時長・擊殺數・魔物剩餘 HP%（決定性診斷）＋每位英雄傷害條＋治療量＋「⚔ 輸出 MVP」",
      "診斷引導：魔物血量 >50% → 「輸出不足，優先強化輸出英雄／技能／神器」；殘血滅團 → 「生存不足，優先強化前排坦度與治療」；全員 0 傷害 → 檢查是否誤派未訓練英雄",
      "sys 計數器純新增（F.stats per-member 累加 — attack/castSkill 處，零邏輯/公式/事件流變更）；summary() getter 彙總；僅滅團彈一次（防抖 1.5s），modal 停留不阻塞後台休息/續戰",
      "敗因診斷直接餵養強化決策（v236 練功點/v201 戰力門檻閉環）— 卡關不再靠猜"
    ]
  },
  {
    v: "v250", title: "技能編排：自選主動技（12 死技能活化）",
    notes: [
      "每英雄可從已解鎖技能中自選 1 技為主動技（預設=職業第一技 → 舊行為零變更）；battle 只施放 skills[0] — 原 18 技中 12 技（騎士嘲諷/牧師群補/法師冰霜新星與連鎖閃電等）實戰永不施放，v175/v249 技能書投資與 v227 施法演出全白費",
      "實作最小化：buildTeamMember 掛載排序（activeSkill 排首位）+ activeSkillOf 守衛（未解鎖/無效 id 回退第一技）+ setActiveSkill（解鎖檢查）；step() 施放迴圈零改動；save 零遷移（英雄欄位自由保留，舊檔 null → 第一技）",
      "UI 技能頁每技「設為主動」鈕（當前主動金框 ✓）；零數值/零機率/零經濟變動；power() 不含技能 → 塔/深淵/競技場 shadow sim 零影響",
      "策略深度：騎士可成真坦克（嘲諷+前排 v165 閉環）、牧師可成真補師、法師可選控場或爆發 — 純決策零成本"
    ]
  },
  {
    v: "v249", title: "技能 Lv10 擴展＋古書回收（技能書死貨幣疏通）",
    notes: [
      "技能 Lv6-10 擴展（純 buff 零 nerf）：skillUpCost 改 Lv6-10 每級 ×3 本（5→6：15 … 9→10：27）、max 5→10 — 單技滿級 20→125 本、單英雄 375 本、全名冊 15000 本（吸收 ~2-3 週後期產出）",
      "skillPower 斜率 1+0.12×(lvl-1) 不變 → Lv10=×2.08（與神器覺醒滿階同錨）— 頂層戰力 +40%（相對 Lv5）為設計內成長",
      "古書回收（圖書館專屬）：50 技能書 → 自選虛空碎片／神話殘片 ×1，週限 5（佔 T3 週供給 <10% 不搶瓶頸）、手續費 5000×1.35^(kl-1) 同素材兌換錨（金幣一併吸收）；bookEx 週限 ensure 同 matsEx 模式",
      "書產出永續（狩獵 1.5%/BOSS 20%）vs 原消耗有限（技能 20 本/技＋研讀 825 本 ≈ 3225 本終身）→ 滿技後死貨幣；擴展後板凳英雄有個人化長期目標（120 小目標），每日書掉落重新有價值"
    ]
  },
  {
    v: "v248", title: "名冊批量遣散（多選＋彙總確認）",
    notes: [
      "名冊「批量遣散」多選模式（v241 背包多選同家族）：狀態列新鈕進入（流浪視圖自動切回批量驅逐 — 同鈕依視圖切換），點卡片切換選取（出戰中/鎖定英雄灰化不可選）；底部操作列即時彙總「已選 N 名・返還約 X 金・碎片 Y」＋全選/取消/遣散",
      "卡點擊走 listEl 事件委派（單一監聽器＋data-cid 定位 — 40 卡零個別綁定；多選/詳情分流集中一處）；切分頁/切視圖自動退出多選（v241 裝備 family 同模式）；篩選/排序/搜尋變更清空選取（全選/計數/遣散集合一致）",
      "遣散執行逐名走完整契約（dismiss silent 旗標 — fightGuard/鎖定守衛、返還實付×1.1 封頂、碎片入庫、裝備回背包、全隊移出、battle.reset），彙總數字與實發同源（dismissCost 共用 v244 公式）；二次 confirm 含預估明細＋「無法復原」警告",
      "清肥料勞務 15-30 擊 → 2 擊決策；升星/突破/重塑仍逐人決策（不傷養成契約）；零存檔結構變更"
    ]
  },
  {
    v: "v247", title: "村莊縮小置中＋外圍地形帶（美術・A1 地圖總體佈局）",
    notes: [
      "村莊縮小置中（A1 直球 — 開放地圖軸起步）：建成 scale 2.4→2.0、CELLS 收斂至 footprint 60-430（中心 245）— 左右空出邊帶；全錨點同步（torch 54/150→推導 98/108、棋盤廣場 x14-110→182-278、縫隙樹/籬/山丘 5 座→139/213/287/361、村民 home/plaza、螢火蟲外移、苔點/水面紋理排除區、DOM 點擊區 21%→16%）",
      "外圍地形帶（地帶分層：農田自然帶→冒險帶）：農田側翼斑塊（左右邊帶 2-3 色階＋作物列破折）、果園雙排樹、蜿蜒道路（廣場中心 → 畫布底 2 段曲線 ±5px 擺幅）、木橋（過溪 3 板）、溪流左端小潭（不規則岸線）、四角邊緣樹叢",
      "兩畫布（480×200/480×270）經 townView() 單一座標源自動繼承（hunt.js 零改動）；純視覺零數值/零存檔/battle.js 零觸碰"
    ]
  },
  {
    v: "v246", title: "圖鑑討伐深鏈＋紅點語意補齊＋資源導覽補完（UI/UX）",
    notes: [
      "圖鑑魔物「位於」＋一鍵前往（農特定魔物里程碑的最大導覽成本 — 逐區比對 → 一次直達）：stageOfMonster helper（與 monsterForStage 同源 modulo — BOSS 第 10 關）；每行「位於:第 N 關/BOSS」鈕（已解鎖區）→ gotoMonster（守衛：未解鎖/戰鬥中拒絕；先關 modal 再切屏 — v231FIX）",
      "紅點語意補齊（v245 每週討伐里程碑是唯一「手動領取卻無紅點」來源 — 全勤 100 鑽靜默達標）：out.wbweek 納入 claim 紅（世界首領 tile claim 優先於 soft）；元素試煉塔（週期型進度提醒 — 與每日次數型同構）從 claim 移入 soft 藍（v236 遺留不一致修正）；soft title per-key（tower「本週元素試煉未通關」）",
      "資源導覽補完（v231 只覆蓋金幣/鑽石 — honor/ticket/book 來源最不直觀）：openResourceGuide 擴充 3 貨幣來源清單（榮譽 6 來源/招募券 6 來源/魔法書 4 來源 — 書的 BOSS 20% 掉落誤解修正）；王國頁資源總覽 5 格全可點（cursor＋click — 與頂欄行為統一）",
      "零存檔變更（純 UI 訊號/導覽）"
    ]
  },
  {
    v: "v245", title: "神器覺醒 3 階＋每週討伐戰（玩法機制）",
    notes: [
      "神器覺醒（Lv10 精煉滿後終局階梯 — v235/v240 留後候選 B 落地）：artifactMul = 1+0.08×(lv-1)+0.12×覺醒階（Lv10＋III = ×2.08）；成本階梯 50/150/450 萬金＋void 8/16/24＋myth 2/4/6（T3 素材新消耗端）；覺醒順序＝資源分配決策（主輸出 vs 貪婪錢袋 vs 坦克防禦）；精煉列「已滿級」→ 覺醒 I/II/III 按鈕；單一 artifactMul 掛鉤 — 全部被動自動成長（effectiveStats/battle/loot 零新增掛鉤）",
      "每週討伐戰（世界首領週期目標弧 — 每日打卡升級為「每日 3 場＋週目標」雙節奏）：週出戰次數里程碑 7/14/21 場（20/30/50 鑽＋券＋榮譽 — 全勤 21 場 = 週 100 鑽＋1 券；量級 ≤ 深淵週結算防通膨）；進行中手動領、跨週未領自動結算（漏領不損失 — 週回訪錨點）；ensure 週重置＋left() 靜音（badges 2Hz 不彈 toast）；UI 世界首領頁週進度區（本週 X/21 場＋里程碑列）",
      "零存檔結構變更（artifacts.awake/worldboss 週欄位 ensure 兜底）"
    ]
  },
  {
    v: "v244", title: "遣散印鈔修復＋金幣寶袋錨對齊＋徽章碎片深度縮放（平衡）",
    notes: [
      "英雄遣散印鈔修復：原 50×1.4^lvl×rarity 指數 vs 訓練多項式 — Lv50★4 返還 40 億 vs 訓練 147 萬（差 2700×），「練高等再遣散」碾壓「練高等繼續用」正迴圈 → 返還封頂 resetRefund×1.1（實付資源＋10% 微利緩衝 — v163 重塑哲學一致）；碎片規則不變；確認文案「返還實付資源」",
      "金幣寶袋縮放錨 1.6→1.35（全經濟唯一 1.6 例外 — kl40 差 ~890×；50 鑽=730 億金可數日買穿 98B 遠古階梯）：grantReward/honorshop goldbag → 5000×1.35^kl（基數 ×10 保留便利兌換價值 — kl40 ≈8.2 億/袋 ≈ 日產 1-5%；kl<20 玩家不減反增）",
      "深淵徽章碎片週限隨深度縮放（2→5）：stock = min(5, 2+⌊(best-400)/300⌋) — 400 層下不變、700 層 3、1000 層 4、1300+ 封頂 5；T3 素材吸收率（<1% 死貨幣）與徽章階梯（1.5-2 年 → ~8-12 個月）接軌；shopList/shopRedeem 同源動態 stock；UI「（深度解鎖）」標記",
      "零存檔結構變更"
    ]
  },
  {
    v: "v243", title: "特惠買齊＋寶石一鍵鑲嵌＋強化到滿（QoL）",
    notes: [
      "每日特惠「一鍵買齊」（每日 4-8 次逐件點擊 → 1 次決策）：影子模擬剩餘庫存×動態價（priceOf 單一來源 — 預覽與扣款一致）；總價 >5 萬 confirm 防誤觸；迴圈 buy 守衛至售罄/金幣不足",
      "寶石「一鍵鑲嵌」（全遊戲最深的模態鏈 — 每槽 4 次點擊：開詳情→點槽→選寶石→重開）：多選列「鑲嵌」鈕 — 空插槽自動填倉庫最高階寶石（同階先得；消耗與手動完全一致）；itemOnFighter 跳過；>3 顆 confirm",
      "批量強化「到滿」（v223 只做 +1 — 單件 +0→+10 仍需連點 10 次）：多選列「到滿」鈕 — 逐件強化至 MAX_ITEM_LVL 或金幣盡（負擔不起的單件跳過 — v223FIX 同款）；影子模擬＋confirm；multiBar 改 flexWrap 容納 8 元素",
      "零存檔變更（純 UI 迴圈包裝既有函式）"
    ]
  },
  {
    v: "v242", title: "夜村窗戶點亮＋大氣透視＋升級旗幟門燈（美術・A2 建築群 R2）",
    notes: [
      "夜村窗戶點亮（style-guide「窗戶點亮」— 夜景 10 棟建築窗全暗平塗的最大視覺缺口）：fxCanvas 疊層每座建成建築疊暖窗光 — 窗字元 W/Q 掃描快取（y-band 15-27、market 篷布高光例外）、~70% 窗亮（確定性 hash）、1px 暖金主光＋光暈呼吸相位；reducedMotion 恆亮 0.8",
      "大氣透視（style-guide「前後景深」— 原遠排全亮度＋全亮標籤壓在近排屋頂上的平面感破綻）：遠排（第 1 排）建築疊暗藍霧罩 rgba(20,24,40,0.28)＋名稱標籤降 9px/0.5；確定性幾何兩畫布相容",
      "升級結構增量（style-guide「煙囪/旗幟」細節）：t2 屋脊中央旗／t3 雙旗＋中央金脊點＋門楣門燈（K 門帶偵測）— 結構 stamp 於 derive()（最長 trim run 中央、gemworks 圓頂/market 篷頂跳過、新 pal key P/E/Y 全表核對無衝突）；5 級一階的跨越感從換色變結構",
      "純視覺 — 零數值/零存檔/battle.js 零觸碰；480×200 與 480×270 兩畫布相容"
    ]
  },
  {
    v: "v241", title: "背包滿損失可見化＋多選全選＋招募 CD 入口可見（UI/UX）",
    notes: [
      "背包滿損失可見化（掉落是信任資產 — 滿包靜默吞 ★5/寶石破壞「掛機有收穫」核心預期）：滿包強拆計數（module 級跨掉落累計）＋30s 合併 toast「⚠ 背包已滿：N 件掉落被自動分解」；★5+ 指名 toast 防重大損失無感；addGem 滿包丟棄併入計數；離線滿包 r.lostItems 彈窗回報列「N 件裝備未能帶回」；badges 第 17 源 invFull（≥cap-5）→ 裝備頁籤橙點警示（整理即滅）",
      "裝備批量多選「全選」（清倉/批量強化 50-150 次逐格點選 → 1-2 次）：與 tabItems() 篩選輸出同源（尊重分頁/品質/套裝/屬性篩選 — 非 DOM 掃描不脫鉤）；再點取消；穿戴/鎖定由既有守衛跳過 — 「篩選→全選→分解」兩次點擊清倉",
      "金幣招募 90 秒 CD 入口可見（「開窗→看到冷卻→關窗」無效迴圈消除）：招募 FAB 冷卻中「招募（CD Ns）」＋disabled＋降透明度；結束恢復＋就緒脈動（reducedMotion 跳過）；doRecruit 守衛仍唯一真相源 — FAB 唯讀鏡像",
      "零存檔變更（純 UI 層＋badges 唯讀判定）"
    ]
  },
  {
    v: "v240", title: "競技場防守編隊＋離線防守戰報（玩法機制）",
    notes: [
      "攻防隊分離（市面標準 AFK 防守陣容）：競技場新增防守編隊（5 人 — 允許與出戰隊重疊，只讀快照戰力；dangling 過濾昇華重置後英雄）— 坦/治療/控制陣容首次有 PvP 面價值",
      "離線防守模擬（第三離線錨點 — 與遠征/離線獎勵錯開）：波次 = ⌊awayHours/4⌋+1（每日上限 3，day key 重置）；勝率 winChance 同公式；勝 +8 榮譽／敗 +2 安慰；防守紀錄 20 筆併入離線彈窗摘要（預先模擬 — defWaves 日上限防 applyOffline 重複發放，與遠征 settled 同效）",
      "設計要點：防守結果永不移動排名（排名只由自己的挑戰改變 — 消除「登入發現名次被偷」負面體感）",
      "UI：競技場頁防守編隊區（戰力/成員/編輯）＋防守紀錄清單；防守編輯器（名冊選 5 人）；零存檔結構變更（ensure 兜底）"
    ]
  },
  {
    v: "v239", title: "深淵無限里程碑＋兌換深度縮放＋任務金幣縮放（平衡）",
    notes: [
      "深淵生成式無限里程碑（唯一無限內容報酬不歸零）：表止 1000 層 → milestoneAt(floor) 生成函式（>1000 每 100 層：gems 6000+1500k／honor 2200+500k／ticket 12+每 200 層 +2）；claim/claimAll（以 best 為上界 — 生成值無窮不可全表掃描）/nextMilestone/UI 列表（visibleMilestones — 表值+best 後 1 個生成值防無限列）全走生成函式；獎勵增速 25%/100 層低於難度成長 → 相對變薄不印鈔",
      "素材兌換週限隨深淵深度縮放（供給/消耗結構失配修復）：matsExCap() = min(20, 10+⌊max(0, best-400)/100⌋) — 400 層以下維持 10（既有玩家零變更）、800 層 14、1000 層 16、1400+ 封頂 20；金幣走 addGold 防印鈔（兌換 < 週產 5%）",
      "每日/週任務金幣按王國等級縮放（v204 簽到/秘境/寶袋 1.35 錨補齊 — 任務金幣後期不歸零）：日任務 ×1.35^(kl-1)（kl 30 單任務 ≈6M）、週任 ×1.3^(kl-1) 較軟（避免變主收入）；目標/鑽石/券/榮譽零變動；UI 任務列顯示縮放後值（顯示=實發）",
      "零存檔結構變更（matsEx 結構不變、ab.claimed 本以樓層為 key 相容生成樓層）"
    ]
  },
  {
    v: "v238", title: "鍛造批量＋素材兌換批量＋公會首領連戰（QoL）",
    notes: [
      "鍛造工坊三頁籤批量（每日最高頻剩餘單擊點）：道具製作 stepper（藥水補給 10-30 次點擊 → 1 次，max=金∩素材可製數，迴圈單製守衛）；寶石融合 stepper（堆疊 9+ 顆連點 → 1 次，max=⌊qty/3⌋）；裝備連製 stepper（RNG 所以 >5 次 confirm — shopBulkBtn 新增 confirmOver 參數；addToInventory 失敗=背包滿退回本件資源）",
      "深淵素材兌換批量（週限 10 次逐次點擊 → 1 次 stepper）：max=min(餘額, ⌊持有/成本⌋)；exchangeMats 加 silent（批量跳過逐次 toast/SFX — v218 WebAudio 教訓）",
      "公會首領連戰（每週衝里程碑 5-15 次同質點擊 → 1 次）：影子模擬到下一未領里程碑（上限 20 次）＋>3 次 confirm；attackBoss 無成本確定性傷害 — 迴圈安全、里程碑自動發放、擊殺新首領生成（與手動連點同行為）",
      "零存檔變更（純 UI 迴圈＋sys 包裝既有守衛函式）"
    ]
  },
  {
    v: "v237", title: "月光溪流＋背景丘陵＋地面顆粒細化（美術・A1 地形與色階 R2）",
    notes: [
      "月光溪流（style-guide「水岸」— 全 codebase 首筆水域）：石板路下方 8px 水帶（#22325a＋岸線＋12 條確定性水面高光＋6 個深色水紋斑）；棋盤廣場底緣 2px 壓水上（水岸廣場）；月亮倒影（fxCanvas 疊層 — 純時間雜湊 4 點閃爍、reducedMotion 定點恆亮）",
      "背景丘陵（style-guide「高地」— 地平線錨點）：4 個樹籬縫隙欄的遠山圓丘（山頂 gndY-40 高於樹頂 10px — 山冠在縫隙間可見；右緣月光描邊＋山脊樹線；確定性幾何零閃爍）",
      "地面顆粒色階細化：路緣上緣月光高光 1px（石板鑲嵌感）＋路磚接縫苔點（原 3×2 草地斑塊座標落在路帶內會被路磚蓋掉 — 修正為接縫苔點）＋火把暖光池（與 overlay 火把同條件 — 城堡/酒館建成才畫；冷夜色地形帶入暖色塊）",
      "純視覺 — 零數值/零存檔/battle.js 零觸碰；480×200 與 480×270 兩畫布 gndY 相對相容"
    ]
  },
  {
    v: "v236", title: "最佳練功點＋適合誰穿＋紅點語意分流（UI/UX）",
    notes: [
      "派遣視窗「最佳練功點」：掃描已解鎖區域×難度×關卡（tp≥建議戰力中收益最高）— 成長後找掛機點 5-10 次點擊 → 1 次「前往」；純建議不自動派遣、收益預覽（+X 金/+Y 經驗/擊殺）",
      "裝備詳情「適合誰穿」：全可裝備英雄比對清單（數值差總和排序、★最佳標記、綠紅差值、一鍵穿上）— 原只比第一位英雄（40+ 英雄時代盲區）＋穿上 4 步 → 1 步（equipToHunter 原子換裝＋fightGuard 保留）",
      "紅點語意分流（終結 15 源紅點疲勞）：可領取類 = 紅點（稀缺訊號）、每日免費次數類（競技場/秘境/世界首領）= 藍點 #4da3ff（常駐提醒）；更多頁籤聚合點同規則（有可領紅、僅次數藍）",
      "零存檔變更（純 UI 層＋badges 唯讀輸出）"
    ]
  },
  {
    v: "v235", title: "英雄碎片合成：遣散死資產 → 週限定向合成（玩法機制）",
    notes: [
      "英雄碎片（帳號級貨幣、跨昇華保留）：★3+ 非傳說遣散轉碎片（★3→1／★4→3／★5→8／★6→20 — 金幣退款不變純增量）；傳說遣散維持原狀",
      "碎片合成商店（英雄頁）：30 片 → 自選職業 ★4（週限 2 次）、60 片 → 自選職業 ★5（週限 1 次）— 走 create 同款路徑計入圖鑑；不可合成傳說；rosterCap 守衛",
      "遣散確認文案顯示可獲碎片；badges 第 15 源（碎片達任一合成門檻且週限未滿即亮）",
      "零存檔結構變更（heroShards/heroSynth optional — normalize 兜底）"
    ]
  },
  {
    v: "v234", title: "遠古科技＋深淵深度階梯＋在線專注加成（平衡）",
    notes: [
      "遠古科技（金幣永續消耗端 — 公會 Lv20 後）：6 線 Lv1-10、成本接續 Lv20 曲線 ×4（全滿 ≈98B — kl 40 約 2 個月）、每級 +0.5%（滿線 +5%、全滿 +30%）、全滿里程碑 +500 鑽 — 金幣從「無意義堆積」變長線投資",
      "深淵深度階梯（400+ 無盡內容重新有回報）：新里程碑 500/600/800/1000 層（2000/2800/4000/6000 鑽階梯 — 總加碼 1.48 萬鑽）；週結算檔位化（peak≥400/600/1000 解鎖更高檔 — 400+ 有戰敗成本，加碼走深度挑戰非零風險掃蕩）；400+ 每 25 層首通 +1 徽章碎片",
      "在線專注加成（修正離線 1.2× > 線上 1.0× 倒掛 — 市面標準離線 < 線上）：派遣狀態連續在線每滿 1 小時 +5%（封頂 4 層 = +20% — 與離線齊平並超越）；純 buff 線上零 nerf 離線（離線結算 noFocus 排除 — 防白吃）；與沙漏/靈藥/週末全疊乘；狩獵頁顯示專注層數",
      "零存檔結構變更（ancient/focusStreak/badge25 optional — ensure 兜底）"
    ]
  },
  {
    v: "v233", title: "流浪日常批量＋塔自動攀登＋公會科技連升（QoL）",
    notes: [
      "流浪英雄日常批量（每日最高頻點擊 15-45 次 → 2 次決策）：「全部投餵」— 影子成本預估＋>3 隻 confirm、迴圈 feed(silent) 逐隻守衛（feedDay/金幣）、toast 彙總；「批量遠征」— 選區域＋時長套用全部可遠征者（心情≥40 自動跳過、誤觸可召回退款零損失）；feed 加 silent 參數（跳過泡泡/SFX — v218 WebAudio 教訓）",
      "元素試煉塔「自動挑戰（至卡關）」：從下個未通層依序 challenge 首敗即停 — 每週 15 次點擊 → 1 次；換隊/強化決策完整保留、失敗無懲罰零損失",
      "公會科技「連升」：每線 1 鍵連升到金幣不足或上限（影子模擬＋>3 級 confirm — v208 建築連升同構）— 生涯 120 次點擊 → 每線 1 次",
      "零存檔變更（純 UI 迴圈包裝既有守衛函式）"
    ]
  },
  {
    v: "v232", title: "村民作息狀態機＋敵人巡邏節奏（美術・A8）",
    notes: [
      "村民作息狀態機（style-guide「NPC 行為邏輯」兌現 — 人物動作軸收尾）：固定軌道往返 → 家停留(30%)→散步家↔廣場(各 15%)→廣場停留聚集(20%)→家停留(20%)的週期作息；廣場停留窗多名村民同時聚集（個別相位錯開、plazaOff 微偏移不重疊）＋頭頂交談點記號（≥2 人同窗時 1px 呼吸光點）",
      "純時間週期驅動零狀態（同 t 確定性 — 平台+直線段週期，所有交界連續：三版修正後瞬移 0px）；reducedMotion 定點佇立不變；幀段契約沿用（呼吸 0-1／站立 2／走路 3-6）",
      "敵人巡邏節奏（狩獵畫面）：怪物待機時左右微踱步（正弦 2px、per-sprite 種子）；受擊（flash）／死亡靜止 — 被打停的索敵節奏",
      "純視覺 — battle.js 零觸碰（hitbox/傷害時點/判定不變）；零存檔變更"
    ]
  },
  {
    v: "v231", title: "資源導覽＋缺口可視化＋元素塔週重置紅點（UI/UX）",
    notes: [
      "頂欄金幣/鑽石可點 → 「資源取得途徑」導覽（市面放置標準「點資源→跳來源」）：金幣 6 來源／鑽石 8 來源深鏈（狩獵/任務/市場/競技場/深淵/塔/世界首領/活動），資源不足死胡同給出下一步",
      "缺口可視化（v191「差N」模式擴展）：建築卡片付不起時逐項「不足：金幣 缺X」＋前往狩獵深鏈；英雄突破資源不足時逐素材「缺 N（持 X/需 Y）」；裝備重鑄按鈕「資源不足」→「缺素材（缺項明細）」",
      "元素試煉塔週重置紅點（第 14 源）：每週一重置未全通即亮 — 塔是每週唯一零提醒的可領回報，漏一週白損失里程碑鑽石",
      "零存檔變更"
    ]
  },
  {
    v: "v230", title: "元素試煉塔：每週元素爬塔啟用相剋與 5 隊編制（玩法機制）",
    notes: [
      "元素試煉塔（放置奇兵光之塔/AFK 試煉塔變體）：每週一重置的 15 層元素爬塔 — 啟用兩套閒置系統（元素相剋原唯一決策點為週首領；5 隊編制 4 隊無專屬內容）",
      "每層弱點元素 = FNV(週key:層) 每週輪換（guild.rollWeak 機械）；勝率 = 影子模擬 win/(win+rec)（dungeon 同公式）＋剋制英雄戰力 ×(1+0.5×佔比)（v220 出戰傷害同公式）；recPower = max(200×1.5^min(l-1,16)×0.35, tp×1.1)（v224 錨定 — 勝率恆穩）",
      "獎勵階梯：榮譽 3+層＋九種素材各 max(1,⌊層/3⌋)；里程碑 5/10/15 層 +20/40/80 鑽石；每層每週一次、依序挑戰、失敗無懲罰可重試",
      "UI：冒險手冊新磁磚（icon_tower 像素表）＋ modal（5 隊快速切隊鈕＋層列表元素色塊＋勝率三色＋里程碑標記）；零存檔結構變更（st.tower 週分桶 ensure 兜底）"
    ]
  },
  {
    v: "v229", title: "數值結構對沖：深淵週結算加碼＋T3 素材消耗端＋特惠指數化（平衡）",
    notes: [
      "鑽石結構轉移（非砍收益）：BOSS 每日首殺 10→5 鑽＋榮譽 2→3（每週 -385 鑽）；深淵週結算封頂 100→200（peak×0.75）＋里程碑 150/200/300 加碼 400/600/1000 鑽＋新增 400 層 1500 鑽 — 零風險掃蕩原為挑戰型成長 5-10 倍，鑽石主來源綁回成長",
      "T3 素材（虛空/神話）長期消耗端：深淵商店新增「傳說徽章碎片 ×2/週」（100 虛空/片 — 徽章滿階 3.2 年 → 1.5-2 年）＋素材包 stock 2→5；meta.exchangeMats 素材兌金幣（50 虛空/100 神話 → 500×1.35^(kl-1) 金，週限 10 次防印鈔）",
      "市場特惠價格指數化：線性 (1+0.15n) → 1.15^(kl-1)（w7 同基數 — 原 kl=30 僅 ×5.35 vs 產出 ×79k，特惠免費化、金幣消耗端失效）",
      "零存檔結構變更（matsEx 週限狀態 optional）"
    ]
  },
  {
    v: "v228", title: "限量商店批量兌換＋離線收益預覽（QoL）",
    notes: [
      "活動商店批量兌換（stock 2-5 週重置 — 每週掃貨摩擦最大）：stepper（−/xN/+）＋「兌換 ×N」鈕 — 迴圈單兌至庫存/貨幣不足（守衛天然生效）、可兌數 clamp 庫存∩餘額；shopBulkBtn 共用 helper 可套用榮譽/深淵/市場",
      "離線收益預覽（放置核心決策可視化）：狩獵頁派遣狀態列下方常駐「離線（12h 上限）：+X 金/時・+Y 經驗/時（未派遣 = 0）」— previewOffline 共用公式（與 offline() 同 rates×3600×OFFLINE_RATE 防漂移）",
      "零存檔變更"
    ]
  },
  {
    v: "v227", title: "技能施法三段式＋元素特化爆發（美術・A7）",
    notes: [
      "施法三段式（TheoTown 小人規範兌現）：舉手聚光（英雄側小聚光 0.12s）→ 怪物側元素爆發＋命中回饋（0.12s 延遲 — 純視覺，battle 已即時結算）→ 收勢（castUntil 尾段舉手 pose）",
      "元素特化爆發：技能 icon 即元素 fx（火球/冰霜/毒/雷/聖/斬擊）— 施法光暈改 per-skill 元素色；multi 型連擊（combo/刀扇/三連箭/連鎖）怪物側每 70ms 橫向展開 N 次小爆發",
      "順手修 dmg===0（buff/嘲諷/治療）跳「-0」紫字 → 跳技能名浮字；純視覺 — 傷害時點/判定零變更"
    ]
  },
  {
    v: "v226", title: "今日待辦補齊＋任務前往深鏈（UI/UX）",
    notes: [
      "今日待辦 5→9 chips：世界首領（剩餘次數）／限時活動（里程碑可領）／公會盛宴（可捐）／流浪投餵（可餵，深鏈切流浪視圖）— v200+ 的每日/週錨點全數進入登入儀式",
      "任務列「前往」深鏈：每日/每週任務未完成時顯示前往鈕 — req.type 22 種映射到對應畫面/功能（狩獵/裝備/英雄/競技場/秘境/昇華/簽到/招募）",
      "純 UI；more 補匯出 openWorldboss/openEvents、hunters 補匯出 showWanderers/openRecruit"
    ]
  },
  {
    v: "v225", title: "流浪英雄委託遠征＋好感投餵（玩法）",
    notes: [
      "委託遠征：被動 FSM 主動化 — 選已解鎖區域＋時長（1/4/8h，8h 每小時效率最高）→ 牆鐘結算（tick/離線雙路、settled 防雙重）；歸來帶回金幣/素材（計入每日任務 d8）/經驗（招募等級 = type.level+exp/120 — 養肥再招募）；遠征中 FSM 暫停、村內不渲染、可召回不退費",
      "好感/投餵：favor 4 階 — 每日投餵 +15、遠征成功 +8、村內自然累積（日上限 30）；招募費 -6%/階・等級 +1/階・素材率 +2%/階",
      "離線收菜：遠征結果併入離線獎勵（第二離線錨點 — 與英雄派遣 12h cap 錯開）；零存檔遷移（optional 欄位）"
    ]
  },
  {
    v: "v224", title: "昇華螺旋封頂＋試煉秘境錨定（平衡）",
    notes: [
      "昇華無上限螺旋修復：+25%×N 無封頂（20 次 +500% 指數通膨擊穿難度曲線）→ 前 5 次各 +25%、之後各 +5%（三處乘數 loot/battle/hunters 同步）；榮譽獎勵封頂（第 10 次起不再成長 — 斷昇華榮譽印鈔機）",
      "昇華長期目標補齊：成就階梯 a_w4(8 次)/a_w5(12 次)＋昇華頁顯示漸減後實際加成",
      "試煉秘境勝率被動衰減修復：recPower 原錨王國等級（離線被動成長 → 卡關玩家勝率跌至 0.1）→ 以隊伍戰力為錨（max(0.35×kl 曲線, 1.1×teamPower) — 強隊恆 48% 勝率）"
    ]
  },
  {
    v: "v223", title: "裝備批量強化＋深淵層級決策資訊（QoL）",
    notes: [
      "多選模式加強化鈕：所選裝備批量 +1 級（鎖定/滿級跳過、影子模擬＋>10 件 confirm 防誤觸、摘要 toast）— 與 v211 紅點/可強化篩選直接協同",
      "深淵決策資訊：下個里程碑距離與獎勵（「再衝 N 層就有 50 鑽+券」）、建議戰力 vs 隊伍戰力三色（鏡像 hunt stagePowerReq abyss 分支 — 共用 helper 防公式漂移）",
      "零存檔變更"
    ]
  },
  {
    v: "v222", title: "英雄攻擊 3 段式＋受擊後仰白閃（美術・A6）",
    notes: [
      "攻擊 3 段式（TheoTown 小人規範兌現）：6 職業 sprite 程式化派生 前搖（蓄力下沉 1px）／收招（武器回位）幀 — 0.4s 攻擊窗相位對映（前搖→揮擊主幀→收招，約 10fps 節奏）；施法維持原攻擊幀；幀 2 硬編碼契約不變",
      "受擊後仰＋白閃：被怪物擊中 0.3s 後仰位移（下沉 2px＋後退 1px — 純 transform 零美術成本）＋白→原色漸回 overlay（前 0.15s 線性衰減）；死亡者不後仰",
      "純視覺 — hitbox/傷害時點/事件時序零變更"
    ]
  },
  {
    v: "v221", title: "升星材料候選清單＋編隊團隊儀表板（UI/UX）",
    notes: [
      "升星「差N同職」從挫折訊息變成行動路徑：詳情頁列出名冊中同職業候選（鎖定🔒/出戰⚔標記）＋「補齊同職業→招募」一鍵預選心願職業（出現率 ×2）",
      "編隊編輯器團隊儀表板：總戰力／克制當前區域元素人數（+25%）／套裝共鳴進度（差幾件啟動）— 調陣三軸一覽",
      "純 UI；starCandidates 唯讀 helper、resonanceStats 已 memoized"
    ]
  },
  {
    v: "v220", title: "公會上限延伸＋週首領弱點輪換（玩法）",
    notes: [
      "公會 Lv10→20（4 週死端 → 2-3 個月目標）：盛宴捐獻（每日 1 次 ×4 經驗壓曲線）、科技上限隨公會等級（FX 煞車：Lv11-15 減半/Lv16-20 再減半防通膨）、Lv15 古龍首領（更強血量＋100% 檔 +150 榮譽）＋300 鑽、Lv20 公會旗幟（全隊攻防 +3%）＋500 鑽",
      "週首領弱點輪換：每週以週 key 種子抽 2 元素弱點 — 編隊剋制戰力佔比 → 出戰傷害 ×(1+0.5×ratio)（全剋制 ×1.5、非門檻僅獎勵）",
      "零存檔遷移（boss.weak/feastDay 選填、ensure 補空）"
    ]
  },
  {
    v: "v219", title: "競技場週結算重做＋世界首領速殺獎勵（平衡）",
    notes: [
      "競技場週結算非線性化：名次獎勵從線性 2-20 鑽改為非線性表（第 1 名 60 鑽 = 第 10 名的 30 倍）；以「本週最佳名次」結算 — 週中每次衝榜勝利都累積價值，不再只認週日最終名次",
      "勝場加成（每勝 +2 鑽、封頂 +15）— 每日 5 戰的習慣錨點；首殺獎勵 210→180 對沖（週產淨 +6% 非印鈔）",
      "世界首領速殺獎勵：血量係數 2.8→2.2（3 次仍必殺），提前擊殺（2 次 +20 鑽、1 次 +40 鑽）— 戰力成長天天可見"
    ]
  },
  {
    v: "v218", title: "全隊訓練＋十連確認＋七日豪禮全部領取（QoL）",
    notes: [
      "全隊訓練到滿：名冊列表一鍵訓練所有英雄（40+ 英雄每日成長 = 逐個開詳情的最高頻日常操作；v213FIX 同款影子模擬＋>10 次 confirm 防誤＋出戰中跳過）",
      "十連抽確認：神話十連 3000 鑽（約 3 天鑽石收入）誤觸防護",
      "七日豪禮全部領取：回鍋玩家一次可領多天（D7 傳說保留選角）"
    ]
  },
  {
    v: "v217", title: "村民 TheoTown 小人動作（待機呼吸＋4 幀踏步）",
    notes: [
      "村民 sprite 從 2 幀升級 7 幀（幀段契約：0-1 待機呼吸 1px 起伏、2 站立、3-6 走路踏步）— TheoTown 小人風格起步（人物動作軸 A5）",
      "固定 10fps 驅動（render.animFrame helper — 不與 rAF 幀率綁定，高速螢幕動作不變快）＋折返端轉向停頓（呼吸待機幀）",
      "純視覺；frame 0 仍為站姿（reducedMotion/hunt 預覽依賴不變）、attack 契約位保留"
    ]
  },
  {
    v: "v216", title: "英雄名冊名稱搜尋＋流浪英雄可招募紅點（UI/UX）",
    notes: [
      "英雄名冊名稱搜尋（更名券時代 40+ 英雄逐卡掃的解法）：名字/職業模糊匹配，與 v206 篩選持久化同機制（search 納入 listSignature 防 2Hz 重建吞輸入）",
      "流浪英雄可招募紅點（第 13 源）：流浪者 1s/4% 生成免費英雄與肥料 — 玩家不開英雄頁完全無感；canRecruit 純判定（名冊滿/金幣不足熄滅）",
      "新增 icon_search 像素圖示；零存檔變更"
    ]
  },
  {
    v: "v215", title: "套裝共鳴＋深淵商店（玩法）",
    notes: [
      "套裝共鳴：全隊穿戴同套裝件數達 4/8/12 → 全隊加成（分段累計、數值低於單人 fx — 套裝從終局擺設變團隊構築目標，六套裝各配三檔）",
      "深淵商店：深淵碎片（虛空/神話 — 深淵掉落無限回收點）兌換 3 件深淵限定神器（深淵之瞳吸血/虛空行者攻速/深淵之心暴擊）＋每週限量素材包（週一錨點、honorshop 模式）",
      "神器第二條取得管道（原僅商城＋活動商店）；零存檔格式破壞（normalize 補欄）"
    ]
  },
  {
    v: "v214", title: "每日任務日進度修復＋週任動態目標（平衡）",
    notes: [
      "修復每日任務印鈔機：claim 與 UI 原以「終身累計統計」判定 — 第 2 天起 5 個每日任務零活動白拿 60-70 鑽/日 → 全數改以日進度 d.prog 判定",
      "補齊 3 個缺失的每日計數 bump：英雄升級(levelup)、拾取素材(mat)、收集裝備(item) — 對應任務原永不推進",
      "週任 w7 金幣目標動態縮放 ×1.15^(kl-1)（與動態定價同基數）— 後期產出膨脹後不白拿",
      "新增終局金幣成就階梯 a_g3(100 億)/a_g4(1 兆)"
    ]
  },
  {
    v: "v213", title: "世界首領一鍵出戰＋英雄訓練到滿（QoL）",
    notes: [
      "世界首領「一鍵出戰 ×N」：每日 3 次逐點的最後漏網（競技場/秘境/捐獻/建築都已批量）— 累計總傷/里程碑/擊殺摘要",
      "英雄詳情「訓練到滿」：一鍵升到 200 級或金幣不足（>10 級 confirm 防誤觸、摘要 Lv 區間與花費）",
      "純 UI 迴圈呼叫既有 API；零存檔變更"
    ]
  },
  {
    v: "v212", title: "村莊地形分層＋植栽層次（美術）",
    notes: [
      "地形分層（TheoTown 基準兌現）：地面從平塗改為雙層草地色階＋雜訊草簇（確定性種子不閃爍）、橫貫石板道路（錯縫石塊＋接縫線）、城堡前棋盤廣場方磚",
      "植栽層次：中景樹群（5 棵 ×2 變體夜間調色）+ 建築間樹籬（底景靜態 pass）+ 左下前景貼地大樹（非 reduced-motion 樹冠微擺）",
      "近地面建築接觸陰影（遠景建築不畫避免懸空）；純靜態/疊層繪製，零數值零存檔變更"
    ]
  },
  {
    v: "v211", title: "紅點補齊：競技場/秘境次數＋裝備可強化（UI/UX）",
    notes: [
      "競技場（每日 5 次）與試煉秘境（每日 3 次）磁磚補上紅點 — 每日免費次數是回訪支柱，與世界首領對稱（紅點來源 9 → 12）",
      "裝備分頁頁籤紅點：背包有可強化（未穿戴、鍛造場開放、強化未滿、金幣足夠）裝備時亮起 — 強化主循環主動曝光",
      "全數唯讀判定（ensure 僅跨日重置）、2Hz 成本可忽略、零存檔變更"
    ]
  },
  {
    v: "v210", title: "傳說專屬徽章＋英雄鎖定（玩法）",
    notes: [
      "傳說專屬徽章：8 位傳說各配 6 階徽章，被動效果 ×(1+0.03×(階-1)) 滿階 ×1.15（全隊型 ×(1+0.02×(階-1))）；升級需徽章碎片＋金幣",
      "碎片來源三路：重複傳說自動轉 5 片（解決「重複傳說死路」）、深淵 50+ 層領主擊殺 ×1、活動商店週限 1",
      "英雄鎖定：鎖定英雄不可遣散、不作升星材料（防誤吃），詳情操作列＋卡片標記",
      "帳號綁定跨昇華保留；零存檔格式破壞（normalize 補欄位）"
    ]
  },
  {
    v: "v209", title: "BOSS 印鈔機修復＋深淵週結算與終局里程碑（平衡）",
    notes: [
      "修復 BOSS 重複討伐印鈔機：原自由選關下同一 BOSS 無限重複討伐，每殺 10 鑽/2 榮譽 ≈ 每小時 9k-18k 鑽（正常週產 40 倍）— 改為每日每區域首殺才發（重複討伐 0 鑽 0 榮譽，金幣/經驗/素材掉落照常）",
      "BOSS 任務/成就計數同步首殺化（w2/d6/a_b 系列不再被原地討伐灌水）",
      "無盡深淵 100 層後零目標 → 終局里程碑（150/200/300 層＋虛空/神話碎片累加）＋每週深度結算（週一錨點：上週新高超過紀錄才發，鑽石/榮譽封頂）＋深淵素材掉率隨深度緩增",
      "純增量＋砍重複獎勵；零存檔格式破壞（normalize 補欄位）"
    ]
  },
  {
    v: "v208", title: "建築連升＋深淵/活動全部領取（QoL）",
    notes: [
      "建築卡與詳情新增「連升」：一鍵升到資源不足或滿級（>3 級 confirm 防誤觸、摘要回報級數與花費）— 10 座建築×數十級的每日升級摩擦一次解決",
      "無盡深淵與限時活動里程碑補上「全部領取」— 9 大紅點來源的領取模式全數一致（單一音效慣例）",
      "純 UI＋薄迴圈（canBuy/claim 條件內部把關）；零存檔格式變更"
    ]
  },
  {
    v: "v207", title: "離線收成儀式＋王國升級慶祝（美術）",
    notes: [
      "離線獎勵（每次啟動最高頻回訪）：金幣/經驗數字 0.8s 滾動至實際值＋領取瞬間金色爆發（reuse v172 光效）— 從純文字表格變成收成慶典",
      "王國升級（成長主軸）：王城金環爆點＋金粒子四散＋「王國 Lv X 達成」金色 banner（2.2s，村莊疊層繪製）— 從 toast 變成里程碑慶祝",
      "兩者皆 reduced-motion 省略（數字靜態/無演出）；零數值/零邏輯變更"
    ]
  },
  {
    v: "v206", title: "元素克制標記＋英雄頁偏好持久化（UI/UX）",
    notes: [
      "元素克制（v149 +25% 機制）可見化：英雄卡元素色點、編隊候選列「克＋25%」綠徽章、戰鬥編隊列克標記、派遣視窗「N 名克制『XX』區域」彙總 — 內建機制從藏在 ⓘ 彈窗變成決策現場可見",
      "英雄頁篩選/排序/視圖（領地/流浪）持久化（localStorage，與裝備頁 v142 同模式）— 重開遊戲繼續上次整理任務",
      "純展示＋狀態層（零數值/零邏輯變更）"
    ]
  },
  {
    v: "v205", title: "榮譽商店（貨幣回春＋每週回訪點）",
    notes: [
      "冒險手冊新增「榮譽商店」：每週限量商品（ISO 週重置）— 技能書×3（300 榮譽）／招募券×3（250）／素材包九種各×5（150）／靈藥三件套（120）／金幣寶袋（200×2）",
      "榮譽在 3 條榮譽強化滿級（總額 1550）後無消耗點 — 商店讓昇華/世界首領/競技場/公會首領的榮譽獎勵持續有意義（全買需 3-4 週產出，不變印鈔機）",
      "複製 events.SHOP 限量兌換模式（週重置、stock、grantReward 格式）"
    ]
  },
  {
    v: "v204", title: "難度收益效率修復＋簽到金幣縮放（平衡）",
    notes: [
      "高難度副本從「自我懲罰」變「風險/收益策略」：防禦不再隨難度縮放（消除雙重懲罰）、金幣/經驗倍率 = 敵方倍率（parity — 每小時收益效率 =1，原 hard 0.71／hell 0.45／夢魘 0.31）",
      "簽到金幣隨王國等級縮放（×1.35^(lv-1)，與秘境/世界首領/寶袋同軌）— 原固定值在 D8 起對後期玩家形同虛設",
      "派遣視窗難度欄新增效率提示；數值審計（子代理 scout）公式級證據：獎勵倍率 × 戰鬥公式組合後效率 <1（v199 同型乘區反轉）"
    ]
  },
  {
    v: "v203", title: "圖鑑里程碑全部領取＋紅點（QoL）",
    notes: [
      "圖鑑頂部新增「全部領取」：魔物里程碑（10/50/200/1000 殺）＋總完成度（25-100%）＋英雄收集（1/5/10/15 位）三類里程碑一鍵全領",
      "更多選單「圖鑑」磁磚新增紅點（可領時亮）— 里程碑獎勵不再需要逐個點開圖鑑檢查（與成就/任務 claimAll 家族一致）"
    ]
  },
  {
    v: "v202", title: "強化視覺回饋＋村莊星空呼吸",
    notes: [
      "裝備強化三路徑（單次/快捷/到上限）補上「強化成功！+N」toast＋物品格金框縮放閃（0.32s，reduced-motion 省略）— 最高頻「點擊→變強」瞬間不再靜默",
      "村莊夜空新增星辰呼吸閃爍（24 顆獨立相位）＋每 ~32 秒一顆流星＋月亮呼吸光暈 — 家園（停留最久畫面）的氛圍最後一塊拼圖"
    ]
  },
  {
    v: "v201", title: "關卡戰力門檻常駐（狩獵決策支援）",
    notes: [
      "狩獵主畫面關卡列新增「隊伍 X／建議 Y・狀態」對比行（綠=穩過／黃=吃力／紅=建議退關練角）；派遣視窗同步顯示",
      "建議戰力參數化（stagePowerReq — 原 recPower 只算 BOSS 關、非 BOSS 關無建議值）；戰力變化即時刷新（stageKey 簽名加戰力）",
      "卡關不再盲打 — 事前知情選擇（AFK Arena 關卡難度著色同款決策支援）"
    ]
  },
  {
    v: "v200", title: "每日世界首領（扭曲時空式每日討伐）",
    notes: [
      "冒險手冊新增「世界首領」：每日巨型魔主（血量隨隊伍戰力縮放，×3.2 = 約 3 次出戰可討伐），每日 3 次免費出戰（戰力×30 傷害，與公會首領同公式）",
      "總傷里程碑 10/30/60/100% 自動領獎（金幣依王國等級＋素材包／鑽石／招募券／榮譽），擊殺發大獎、明日更強魔主降臨；午夜重置、紅點提醒",
      "對位 AFK Arena 扭曲時空：每日輸出量化、成長天天可見 — 補上每日節奏的最後一塊（與秘境/競技場/特惠/任務並列）"
    ]
  },
  {
    v: "v199", title: "強化費用負折扣修復（後期印鈔機）",
    notes: [
      "鐵匠鋪強化費用折扣（-4%/級）在 Lv25 歸零、Lv26+ 變負 → 每次強化倒賺金幣（後期無限刷金）— 封頂 90% 折扣（最低 0.1 倍成本）",
      "數值審計（子代理 scout 發現證據）確認其他折扣（招募費用 -2%×30=40% 正、鍛造傳統 -40% 正）皆安全，僅強化費用觸底"
    ]
  },
  {
    v: "v198", title: "每日次數型一鍵掃蕩（競技場/秘境/捐獻）",
    notes: [
      "競技場「掃蕩剩餘 N 次」：自動挑戰最高勝率的可挑戰對手，彙總「N 勝 M 敗＋鑽石」；試煉秘境「一鍵掃蕩剩餘」：所有秘境跑完剩餘次數彙總；公會「捐獻×剩餘」：一鍵捐滿今日額度",
      "每日固定 11 次點擊（5 挑戰＋3 秘境＋3 捐獻）變 3 次 — 與 v168-v193 批量 QoL 家族一致；策略玩家仍可手動精打（首殺寶石/挑對手）"
    ]
  },
  {
    v: "v197", title: "昇華儀式演出（紫金神光）",
    notes: [
      "昇華（覺醒）完成瞬間新增全屏儀式：紫金神光放射＋爆發金環＋榮譽徽記彈入＋「昇華完成」大字與榮譽數字，2.4 秒後才開啟傳統選擇",
      "昇華是重置一切的至重時刻 — 從靜默 toast 變成配得上其重量的儀式（reuse v172 光效＋昇華主題紫金調）；reduced-motion 直接跳過演出",
      "awaken() 改回傳榮譽數（truthy 相容舊呼叫點）供演出顯示"
    ]
  },
  {
    v: "v196", title: "主頁今日待辦（登入儀式中心化）",
    notes: [
      "王國主頁概覽下方新增「今日待辦」列：每日任務（完成數）／簽到（未簽高亮）／競技場（剩餘次數）／試煉秘境（剩餘次數）／每日特惠（未買件數）— 每項一觸即跳轉",
      "未完成項目金色高亮（紅點精神的可見化）：登入後掃一眼就知道今天還有什麼沒做，不再需要翻遍更多選單（AFK Arena 每日面板設計）"
    ]
  },
  {
    v: "v195", title: "神器精煉（等級與效果成長）",
    notes: [
      "神器新增精煉：Lv1→10，效果隨等級成長（+8%/級、10 級 ×1.72）— 屬性類（攻/防/血/速/暴擊）入 effectiveStats、金幣袋入掉落、嗜血入吸血、賢者入技能威力、冰霜護盾秒數成長",
      "成本遞增（Lv→Lv+1：400×lv^1.6 金＋水晶/餘燼/虛空/神話按級遞增）— 與 v185 合成/v190 重鑄構成素材→合成→精煉的終局循環",
      "神器從「一次性的固定被動」變成「值得投資的長期目標」— AFK Arena 神器等級的成熟設計"
    ]
  },
  {
    v: "v194", title: "回歸獎勵（離開 ≥3 天禮包）",
    notes: [
      "離開 72 小時以上回歸時觸發「回歸獎勵」：分三檔（3-6 天／7-13 天／14+ 天）遞增禮包 — 金幣（2/4/8 小時掛機收入）＋鑽石＋招募券＋技能書＋靈藥／沙漏",
      "每檔只領一次（returnTier 記錄防刷）；與離線收益（12h 封頂）互補 — 長期離開的玩家回歸有實質歡迎禮（放置奇兵回歸禮設計）",
      "實機審計（後期存檔 45 秒）確認：金幣 9,674/s、書供給隨 kills/s 成長、重鑄/合成 sink 正常 — 數值面健康，本輪補的是回流玩家留存"
    ]
  },
  {
    v: "v193", title: "藥水補滿批量＋滿血白耗修復（QoL）",
    notes: [
      "獵場藥水按鈕改為「補滿」：一鍵循環喝到全隊滿血/滿魔或藥水用盡，摘要回報瓶數與恢復量",
      "修復缺陷：全隊滿血/滿魔時按藥水仍會消耗（v179 修過英雄詳情路徑、獵場這條漏掉 — 現與詳情一致有滿血守衛）",
      "戰況危急時一次點擊補滿，不再逐瓶點、也不再誤耗藥水"
    ]
  },
  {
    v: "v192", title: "升星慶祝演出（金色儀式）",
    notes: [
      "升星成功瞬間新增全屏金色慶祝：放射光＋爆發金環＋英雄大頭像彈入＋「★N → ★N+1」大字與全屬性倍率",
      "升星是湊 16 同職業的里程碑時刻 — 從靜默 toast 變成有儀式感的兌現（重用 v172 抽卡光效、reduced-motion 自動省略）"
    ]
  },
  {
    v: "v191", title: "英雄卡升星徽章（收藏頁決策支援）",
    notes: [
      "英雄卡片新增升星徽章：可升星 → 金色「升★N」；還差素材 → 灰色「差N同職」（長按顯示完整缺口明細）",
      "「誰可以升星／還差幾個同職業」不再需要逐個打開詳情 — 收藏頁一眼掃描升星候選，缺口數字化為具體目標（AFK Arena 升星提示式決策支援）"
    ]
  },
  {
    v: "v190", title: "裝備詞綴重鑄（終局洗練）",
    notes: [
      "★3+ 裝備可重鑄詞綴：消耗金幣＋高階素材（★3:2000金＋水晶×2 … ★6:30000金＋虛空×4＋神話×2），隨機重骰詞綴 — 無詞綴的補上、有詞綴的換新",
      "詞綴從「掉落時一翻兩瞪眼」變成可追求的目標：戰鬥裝洗獵手/鋒銳/嗜血、掛機裝洗貪婪/學者/尋寶",
      "與 v185 素材合成互補：低階素材升階 → 高階素材重鑄，裝備養成的終局閉環成形"
    ]
  },
  {
    v: "v189", title: "每週登入任務（活躍留存）",
    notes: [
      "每週任務新增第 8 項「本週登入 5 天」（+60 鑽石）：每日首次進入遊戲自動計數（同日不重複、週一重置）",
      "每週任務從純進度類補上「登入習慣」類 — 每週的活躍目標完整（AFK Arena／放置奇兵式週活躍任務）",
      "實機審計（headless Chrome 注入中期存檔、60 秒實測）：金幣 319/s、技能書 60/時（42 小時刷滿）、推進節奏與建議戰力公式自洽 — 數值面健康，本輪補的是留存結構"
    ]
  },
  {
    v: "v187FIX", title: "戰鬥畫面空白修復（緊急）",
    notes: [
      "修復戰鬥畫面完全空白的嚴重缺陷：v167 區域環境粒子區塊在 render() 內比 st 宣告更早使用它 — TDZ ReferenceError 每幀拋出、畫布永不繪製",
      "此缺陷自 v167 上線即存在（歷輪 harness 僅測繪製數學、未執行 render 主體，漏網）；本次以真實瀏覽器（CDP）捕獲：canvas 內容 4.8KB→47KB、六分頁全掃與 15 秒戰鬥迴圈零錯誤"
    ]
  },
  {
    v: "v188", title: "週期重置倒數補齊（競技場/活動/公會首領）",
    notes: [
      "競技場週結算、限時活動、公會每週首領統一顯示「距週一重置」倒數（HH:MM:SS，與每週任務一致）",
      "「還剩多久結算」直接影響「要不要衝完名次/活動點數」的決策 — 倒數讓每週目標的截止感可見"
    ]
  },
  {
    v: "v187", title: "村莊煙囪煙霧＋螢火蟲（家園氛圍）",
    notes: [
      "王國村落新增氛圍層：王城／鐵匠鋪／藥水工坊的煙囪週期性吐出煙霧（上升＋擴散＋漸隱），草地區 4 隻螢火蟲正弦游移、忽明忽滅（黃/藍雙色）",
      "時間雜湊零狀態繪製（與雲/火把同模式）：煙霧 1.4-2.2 秒一團、螢火蟲 22px 橫移游移；減少動畫模式煙霧省略、螢火蟲定點恆亮",
      "家園（每輪登入第一畫面）的夜村氛圍補完 — 與階級光暈/火把/村民/流浪者組成完整活村"
    ]
  },
  {
    v: "v186", title: "狩獵關卡收益常駐顯示（UI/UX）",
    notes: [
      "戰鬥畫面頂部關卡列新增「每擊殺收益＋距 BOSS 關數」小字行 — 掛機時最常問的兩個問題（這關給多少／BOSS 還有多遠）不必再點 ⓘ",
      "收益含難度倍率與區域成長；BOSS 關顯示「原地再戰」；不影響既有關卡資訊彈窗"
    ]
  },
  {
    v: "v185", title: "素材合成（低階升階）",
    notes: [
      "王國素材倉庫新增「素材合成」：任 T1 素材 ×4 → 自選 T2 素材 ×1；任 T2 ×4 → 自選 T3 ×1（手續費 100／500 金／次）",
      "後期高階素材（餘燼石/虛空碎片/神話殘片）瓶頸可直接用堆積的低階素材轉化；來源/目標/數量自由選擇，餘數保留",
      "素材不再只有「賣 5 金」的出路 — 每一份掉落都有升階價值（放置奇兵式素材循環）"
    ]
  },
  {
    v: "v184", title: "每日特惠動態定價（後期金幣價值維護）",
    notes: [
      "特惠價格隨王國等級成長（+15%/級）：前期新手價格幾乎不變，後期金幣收入爆炸時商品維持相對成本，不再「0.05 秒收入買滿整頁」",
      "商會傳統折扣套在動態價上（價格單一來源，顯示與扣款一致）；平衡審計確認訓練曲線/升星/技能書供給整體健康，僅此一處通膨失衡",
      "金幣在整個遊戲生命週期保有邊際價值 — 掛機收入的意義不被稀釋"
    ]
  },
  {
    v: "v183", title: "技能全部升級（批量消耗技能書）",
    notes: [
      "英雄詳情技能頁新增「全部升級」：技能書足夠時一口氣把已解鎖技能升到滿級，不足則升到書盡為止，摘要回饋升級次數與消耗",
      "搭配 v178 批量訓練：練角兩大操作（訓練/技能）都告別逐次點擊"
    ]
  },
  {
    v: "v182", title: "戰鬥場景活背景（雲帶＋遠山視差）",
    notes: [
      "戰鬥天空加入兩縷像素波浪雲帶，緩慢橫移（約 110 秒一循環）；三座遠山以不同速度微幅漂移（近快遠慢 → 深度感）",
      "所有區域戰鬥通用，與區域主題色（accent）融合；減少動畫模式完全靜止"
    ]
  },
  {
    v: "v181", title: "建築卡片下一級收益預覽（UI/UX）",
    notes: [
      "王國頁每張建築卡直接顯示「下一級」效果（金色行）— 升級決策現場即可看到這筆資源買到什麼，不再需要逐棟點進詳情",
      "與詳情彈窗的下一級預覽＋等級效果一覽互補：瀏覽層與決策層資訊一致"
    ]
  },
  {
    v: "v180", title: "英雄圖鑑（職業收集永久加成）",
    notes: [
      "圖鑑新增「英雄收集」：每職業累計獲得（含已遣散）里程碑 1／5／10／15 位，達標該職業全體永久攻擊 +1%／+2%／+3%／+4%（累加，滿 15 位 = +10%），另贈鑽石",
      "收集的是「擁有過」— 遣散不扣圖鑑，招募流水全部計入；舊存檔自動以現有名冊回填",
      "全職業滿編 = 全隊攻擊 +10%：招募不再只是湊陣容，每個職業都是一條長期收集路線（AFK Arena／放置奇兵式圖鑑養成）"
    ]
  },
  {
    v: "v179", title: "資源浪費缺陷修復（滿級訓練＋滿血藥水）",
    notes: [
      "單次訓練在 Lv200 滿級時不再扣金幣（原先一次燒掉上百萬金幣卻零收益 — 批量訓練有守衛、單次漏掉，補齊）",
      "HP/MP 全滿時使用生命/魔力藥水不再消耗（原先滿血喝藥直接蒸發一瓶）",
      "平衡修正：玩家辛苦累積的資源不再被無意義消耗，養成資源的每一分都花在刀刃上"
    ]
  },
  {
    v: "v178", title: "批量訓練（英雄詳情 ×10）",
    notes: [
      "英雄詳情操作列新增「訓練×10」：一次訓練 10 次（金幣不足或 Lv200 滿級自動停止），摘要回饋實際完成次數",
      "後期練角不再逐次點擊 — 掛機練等與手動補練的摩擦大幅降低"
    ]
  },
  {
    v: "v177", title: "戰鬥升級演出（金光爆發）",
    notes: [
      "戰鬥中英雄升級瞬間：金色「Lv N！」大字浮起＋八向金色星光爆發粒子環 — 掛機刷經驗最常見的進度時刻有了視覺慶祝",
      "渲染層原本已支援 levelup 事件（浮字），補上事件推送與爆發粒子 — 升級從「靜默跳過」變成「看得見的成長」",
      "減少動畫模式自動省略爆發粒子（浮字保留）"
    ]
  },
  {
    v: "v176", title: "編隊管理前後排視覺化（UI/UX）",
    notes: [
      "編隊管理從 5 格平列改為雙排陣型：前排 2 格（橙色標籤「承受主要攻擊」）＋後排 3 格（綠色標籤「受傷 -25%」）",
      "站位即機制 — 前後排的意義不再需要文字說明，一眼可懂；點格編入/更換流程與位置索引完全不變"
    ]
  },
  {
    v: "v175", title: "英雄技能升級（技能書個人化）",
    notes: [
      "英雄詳情技能頁籤新增「升級」：消耗技能書提升個別技能等級 Lv1→5（威力 x1.0→x1.48），成本 = 目前等級 ×2 本（單技滿級 20 本、全技 60 本）",
      "技能書從「只進圖書館全域研讀」變成雙消耗 — 英雄技能升級（個人）與研讀（全隊）並行，技能書價值大幅提升",
      "戰鬥傷害鏈原本已支援每英雄技能等級（skillPower），本輪補上升級入口 — 設計文件承諾的機制正式落地"
    ]
  },
  {
    v: "v174", title: "週末雙倍（留存節奏）",
    notes: [
      "星期六／日（本地時區）金幣與經驗掉落 ×1.5 — 線上掉落、離線收益速率同步生效",
      "王國頁生產卡的「啟用效果」顯示「週末雙倍 ×1.5」標示；與靈藥／公會科技／昇華傳統／傳說羈絆等加成疊加"
    ]
  },
  {
    v: "v173", title: "全隊自動穿裝（裝備 QoL）",
    notes: [
      "英雄頁新增「自動穿裝」：一鍵為出戰編隊每位英雄穿上背包最佳裝備（依序貪婪分配，鎖定不穿、比現穿好才換、武器職業限制照舊）",
      "與「自動編隊」並列 — 換新裝備後一次整裝，不再逐個英雄進詳情按穿裝"
    ]
  },
  {
    v: "v172", title: "抽卡演出（揭示光效）",
    notes: [
      "招募揭示卡升級：稀有度色徑向光暈背景＋外發光＋內發光；★4 以上／保底／傳說觸發旋轉放射光與擴張爆發環",
      "★6／保底／傳說使用金色放射光＋金環；揭示內容改為彈入動畫（縮放回彈）取代舊淡入",
      "減少動畫模式（設定或系統）自動省略全部演出"
    ]
  },
  {
    v: "v171", title: "更多選單圖示網格改版（UI/UX）",
    notes: [
      "冒險手冊從 13 行文字列表改為 2 欄圖示磁磚網格：任務／成就／圖鑑／簽到／商城／競技場／限時活動／試煉秘境／公會／無盡深淵／七日豪禮／設定／更新歷史一眼掃描",
      "紅點位置隨磁磚重排（圖示右上角）；各功能入口與既有彈窗流程完全保留"
    ]
  },
  {
    v: "v170", title: "傳說羈絆（同隊構築加成）",
    notes: [
      "六組傳說羈絆：晨曦與壁壘（攻防 +10%）／雙重詠唱（技能威力 +12%）／風影迅捷（攻速 +10%）／聖歌與磐石（生命 +15%）／光輝三聖（攻擊 +15%・生命 +10%）／夜幕三傑（暴擊 +8%・技能威力 +8%）",
      "同隊傳說英雄滿足組合即全隊觸發、多重羈絆疊加；英雄詳情顯示該傳說的羈絆狀態（擁有數/生效中），編隊管理視窗顯示當前生效羈絆",
      "傳說英雄從單體強度延伸為團隊構築 — 收集傳說組合本身成為目標"
    ]
  },
  {
    v: "v169", title: "昇華傳統（Prestige 構築路線）",
    notes: [
      "每次昇華完成後自選一項傳統永久疊加（上限 10 級，跨昇華保留）：狩獵（金幣/經驗 +5%/級）／鍛造（強化製作成本 -4%/級）／商會（市場特惠 -4%/級）／學術（技能威力 +3%/級）／開拓（王國經驗 +10%/級）",
      "昇華從「線性 +25%」變成「可構築的血脈路線」— 專精狩獵速農、或鍛造省金、或開拓衝王國等級，每輪昇華一個新決定",
      "祭壇顯示五項傳統現況；昇華後選擇視窗（可稍後再選）"
    ]
  },
  {
    v: "v168", title: "十連抽（招募 QoL）",
    notes: [
      "神話招募與招募券新增「十連」按鈕：一次消耗 3000 鑽石／10 張招募券連續招募 10 次，結果視窗一次檢視（稀有度色邊框＋✦保底／✦傳說標記＋★6/傳說/保底統計）",
      "批量招募靜默執行（不刷 10 條通知）；保底計數與傳說機率照常逐抽計算，十連內自動觸發",
      "名冊滿員時自動中止並提示已完成抽數；招募視窗保底進度在十連後即時刷新"
    ]
  },
  {
    v: "v167", title: "區域環境粒子（美術氛圍）",
    notes: [
      "戰鬥場景加入區域主題環境粒子：翠綠草原/幽暗森林落葉飄旋、灰燼洞穴/烈焰火山餘燼升騰、冰封高原飄雪、黃沙荒漠飛沙橫吹、詛咒沼澤/深淵裂谷/無盡深淵幽光上浮、蒼穹之塔電光閃爍、神話之域星芒灑落",
      "六個全新手繪粒子精靈（16×16）；粒子帶隨機速度/大小/生命週期，生命末端漸隱，上限 26 顆；減少動畫模式自動關閉",
      "每個區域的戰鬥畫面從靜態背景變成活著的場景 — 氛圍與區域身份一眼可辨"
    ]
  },
  {
    v: "v166", title: "英雄頁卡片網格改版（UI/UX）",
    notes: [
      "英雄名冊從文字列表改為 3 欄卡片網格：稀有度色邊框、職業大圖標、星等、等級戰力一目瞭然 — 40 名英雄一眼掃描",
      "狀態徽章：出戰中（橙「戰」）／休息中（藍「休」）／編隊待命（綠「出」）；突破階數角標；傳說英雄金框光暈",
      "點卡片直接開啟英雄詳情；篩選（職業）／排序（戰力/等級/稀有度）與名冊狀態列、自動編隊、批量驅逐全數保留"
    ]
  },
  {
    v: "v165", title: "前排／後排站位（戰鬥策略核心）",
    notes: [
      "編隊第 1-2 位為前排、第 3-5 位為後排：魔物單體攻擊優先打前排，前排全滅才威脅後排；後排受到單體攻擊傷害 -25%",
      "騎士的嘲諷價值大幅提升（前排坦克定位成形），輸出與治療擺後排更安全 — 編隊從「堆戰力」變成「排陣型」",
      "戰鬥畫面站位同步調整（前排下排、後排上排錯位）；編隊管理視窗新增站位說明"
    ]
  },
  {
    v: "v164", title: "紅點提示系統",
    notes: [
      "可領取的獎勵現在會亮紅點：更多選單各列（每日/每週任務、成就、每日簽到、限時活動、無盡深淵里程碑、七日豪禮）與底部「更多」頁籤",
      "2Hz 即時判定（純讀取，不重繪畫面）：任務達標、成就可領、簽到未領、活動/深淵里程碑達成即亮，領完自動熄滅",
      "市面放置遊戲標配的回訪驅動層 — 不再需要逐個視窗檢查有沒有獎勵可領"
    ]
  },
  {
    v: "v163", title: "英雄重塑（資源返還）",
    notes: [
      "英雄詳情新增「重塑」：把英雄還原為 Lv1 未突破狀態，100% 返還訓練金幣與突破金幣／素材（公式精算，無折扣損失）",
      "等級／突破／技能等級重置，稀有度、升星、傳說身份與神器保留 — 資源投錯英雄不再是死帳，放心培養",
      "與升星（消耗英雄）互補：重塑讓多餘的投資可回收，再投入新的培養路線"
    ]
  },
  {
    v: "v162", title: "七日豪禮（新手七日活動）",
    notes: [
      "更多選單新增「七日豪禮」：建號日起每日解鎖一項任務（擊敗魔物／招募／強化／推進關卡／突破／BOSS／升星），獎勵逐日加碼",
      "第 7 天最終獎勵：從八位傳說英雄中自選一位加入王國（固定名字與專屬被動）— 新手第一個傳說英雄由自己決定",
      "解鎖依建號天數且無嚴格期限（回鍋玩家仍可領取）；與 30 天簽到、主線任務構成新手期三重節奏"
    ]
  },
  {
    v: "v161", title: "裝備詞綴（副詞條系統）",
    notes: [
      "★3 以上裝備依稀有度機率附加一條隨機詞綴（★3 20% → ★6 80%），數值隨階級成長：嗜血（吸血）／獵手（對首領傷）／鋒銳（暴傷）／荊棘（反彈）／鐵壁（減傷）／學者（經驗）／貪婪（金幣）／尋寶（素材機率）",
      "戰鬥即時生效：吸血與暴傷入普攻、獵手入普攻與技能、鐵壁與反彈入怪物攻擊；掉落類（學者／貪婪／尋寶）依編隊穿戴總和計算",
      "裝備從純屬性棍變成有性格的掉落 — 每件 ★5-6 都可能是一條值得追逐的詞綴"
    ]
  },
  {
    v: "v160", title: "無盡深淵（無盡爬塔）",
    notes: [
      "第 5 區域通關解鎖「無盡深淵」：深度即關卡、怪物隨深度無限成長，每 10 層深淵領主鎮守 — 真實戰鬥、獎勵隨深度攀升（金幣／經驗／虛空碎片／神話殘片）",
      "最佳層數跨週保留；首通里程碑（10／25／50／100 層）發放鑽石與招募券；滅團休整 20 秒後可自動續戰，掛機也能爬",
      "入口：狩獵頁第 11 個區域 chip 或更多選單；離開深淵自動回到原本區域；深淵無難度倍率（獨立曲線，不受難度切換影響）"
    ]
  },
  {
    v: "v159", title: "每日特惠（每日商店輪換）",
    notes: [
      "村莊市場新增「每日特惠」：從 8 件貨池確定性抽取 4 件折扣商品（-20~25%），各自限購次數，午夜刷新",
      "貨池：招募券／生命魔力藥水／素材包／攻擊智慧靈藥／加速沙漏／技能書 — 補上每日商店的決策節奏",
      "以日期為種子生成貨單：同一天貨品固定（防刷新洗牌），換日自動輪換；與每日任務／試煉秘境／競技場構成完整每日循環"
    ]
  },
  {
    v: "v158", title: "神器（AFK Arena 式被動裝備層）",
    notes: [
      "八件神器降臨：龍鱗護符（生命）/雷神之錘（攻擊）/影舞之靴（攻速）/冰霜之心（開戰護盾）/嗜血獠牙（吸血）/賢者之瞳（技能威力）/貪婪錢袋（金幣掉落）/聖光徽記（暴擊）",
      "英雄詳情新增神器槽：每位英雄裝備一件，被動即時生效（屬性進素質、吸血入普攻、技能威力入技能、貪婪入掉落）",
      "取得管道：商城 8 件限購一次（300-500 鑽）＋活動商店輪換一件 — 與升星/傳說英雄構成完整養成決策層"
    ]
  },
  {
    v: "v157", title: "傳說英雄（固定身份的角色）",
    notes: [
      "八位傳說英雄降臨：艾拉·晨星／雷恩·颶風／莫娜·灰燼／薇拉·影刃／奧丁·冰壁／瑟琳·聖歌／索林·岩心／妮克絲·夜幕 — 固定名字、職業、台詞與專屬被動",
      "神話招募出 ★6 時 25% 機率以傳說英雄取代隨機職業：攻擊/攻速/暴擊/防禦/生命等被動，以及「技能威力」與「全隊攻擊」團隊型被動",
      "英雄詳情顯示傳說標記與被動說明；抽卡揭示「✦ 傳說英雄降臨 ✦」金標 — 英雄培養從此有名字、有故事",
      "修復 v136 以來的戰鬥迴歸：每 tick 狀態同步會覆寫冷卻計時器，導致技能永不施放、攻速失真 — 同步素質時改為保留 cd／技能冷卻／增益，技能與攻速恢復正常"
    ]
  },
  {
    v: "v156", title: "公會（捐獻・科技樹・每週首領）",
    notes: [
      "更多選單新增「公會」：單人公會系統 — 每日 3 次金幣捐獻換取公會經驗與等級（上限 10 級）",
      "公會科技 6 條線（戰技/壁壘/體魄/聚財/悟性/鷹眼）：每級 +2% 全隊攻防血金幣經驗、+1% 暴擊，等級上限受公會等級制約；加成即時作用於戰鬥、掉落與離線收益",
      "每週首領：巨型魔物（ISO 週重置），出戰無次數限制、每次造成 隊伍戰力×30 傷害，傷害跨次累積；總傷 10/30/60/100% 里程碑自動發放獎勵，擊殺發最終大獎並迎接新首領"
    ]
  },
  {
    v: "v155", title: "首領機制（Boss 被動技能）",
    notes: [
      "十個區域首領各獲得一種被動機制：劇毒（森林/沼澤）、護盾（洞穴/高塔）、吸血（火山/裂谷）、再生（高原）、震怒範圍攻擊（荒漠/神話之域）",
      "戰鬥即時生效：護盾前 8 秒減傷 50%、再生低於半血每秒回 0.8%、劇毒每 4 秒蝕傷單體 3%、吸血回復造成傷害 60%、震怒每 8 秒全體 60% 傷害",
      "BOSS 登場橫幅與地圖情報視窗顯示機制名稱與說明，攻略前先備戰"
    ]
  },
  {
    v: "v154", title: "試煉秘境（每日副本）",
    notes: [
      "更多選單新增「試煉秘境」：三個每日副本 — 黃金秘境（金幣）、智慧秘境（經驗）、豐饒秘境（九種素材），各每日 3 次、午夜重置",
      "獎勵隨王國等級成長；勝率依隊伍戰力判定（介面直接顯示），敗北仍有 30% 安慰獎勵",
      "解鎖節奏：黃金秘境開局即開、智慧秘境第 3 區域、豐饒秘境第 5 區域；與每日/每週任務、競技場構成完整每日內容循環"
    ]
  },
  {
    v: "v153", title: "心願清單（定向招募）",
    notes: [
      "招募視窗新增「心願職業」：從 6 個職業中選 2 個，其招募出現率提升至 2 倍（三種招募池皆生效）",
      "與升星系統形成定向循環：心願指定職業快速湊齊同職業肥料與重複卡，打造主力英雄更順手",
      "抽到心願職業時抽卡畫面顯示「★ 心願職業現身 ★」金標；設定隨時可改、零成本"
    ]
  },
  {
    v: "v152", title: "限時活動（每週輪換）",
    notes: [
      "更多選單新增「限時活動」：每週一 00:00 輪換 — 奇數週「狩獵祭」（擊殺魔物 15% 掉落活動點數）、偶數週「討伐祭」（擊敗 BOSS 必得點數）",
      "活動點數雙用途：4 階里程碑（30/80/150/250 點 → 鑽石/招募券/榮譽）＋活動商店限額兌換（券/鑽石/靈藥/藥水/素材包/沙漏）",
      "點數與兌換進度每週重置；換週時自動通知；與每週任務、競技場週結算構成完整週期節奏"
    ]
  },
  {
    v: "v151", title: "每週任務（任務三件套補齊）",
    notes: [
      "任務視窗新增「每週」頁籤：7 項固定週任務（擊敗魔物/BOSS、推進關卡、招募、升星、強化、累計金幣），週一 00:00 重置",
      "獎勵以鑽石與招募券為主，與每日任務錯開節奏；與競技場週結算形成一致的每週目標循環",
      "任務推進沿用同一 bump 引擎（擊殺/招募/升星/強化即時累積），舊存檔自動遷移"
    ]
  },
  {
    v: "v150", title: "競技場（PvP 天梯）",
    notes: [
      "更多選單新增「競技場」：10 人天梯，戰勝排名在你之上的對手即與其交換名次，登頂第 1 名成為王者",
      "每日 5 次免費挑戰，打滿 3 場 +20 鑽石參與獎勵；每名對手的首殺獎勵（鑽石＋榮譽，名次越高越豐厚）",
      "每週一結算重置：依上週名次發放鑽石（第 1 名 20 鑽起），對手名冊依你目前戰力重新生成，挑戰永遠有意義",
      "勝率＝我方戰力／（我方＋敵方），介面直接顯示每場勝率"
    ]
  },
  {
    v: "v149", title: "元素相剋系統（陣營克制標準設計）",
    notes: [
      "六大元素：火／冰／雷／自然／暗／聖 — 職業各屬一系（劍士聖・弓手雷・法師火・刺客暗・騎士冰・牧師自然），十個狩獵區域各有元素屬性",
      "克制循環：火→自然→雷→冰→火，聖↔暗互相克制；克制時普攻與技能傷害 +25%，離線收益速率同步計算",
      "地圖情報視窗顯示區域元素與克制職業提示（＋25%）；區域 chips 顯示元素標記、英雄詳情顯示職業元素"
    ]
  },
  {
    v: "v148", title: "招募保底系統（抽卡公平性標準設計）",
    notes: [
      "神話招募（300 鑽）20 抽內必得 ★6；高級招募（招募券）10 抽內必得 ★5 — 期間自然出貨即歸零重計",
      "招募視窗顯示保底進度（已累積 X/N 抽、再 Y 抽必得）；保底觸發時抽卡畫面顯示「✦ 保底觸發 ✦」金標＋專屬提示",
      "保底計數存於統計欄位、隨昇華保留（跨週期累積）；金幣招募不設保底"
    ]
  },
  {
    v: "v147", title: "英雄升星系統（放置英雄核心循環）",
    notes: [
      "英雄詳情新增「升星」：消耗同職業當前星級英雄＋任意職業肥料，稀有度提升一階（★1→★6，成長倍率 1.0→2.3 跳升）——重複招募從此永遠有用，低星英雄成為升星燃料",
      "需求曲線：1★→2★ 需 1 名同職業；2★→3★ 2＋1 肥料；3★→4★ 3＋1；4★→5★ 4＋2；5★→6★ 6＋2；自動挑選戰力最低者消耗（非編隊優先），被消耗英雄裝備送回背包",
      "升星不耗金幣素材、與突破並行，生命魔力按比例成長；每次升星提升王國經驗",
      "新增主線任務「眾星拱月」與 3 項成就（首次升星／累計 10 次／升星至 6★）；舊存檔自動遷移（bornRarity）"
    ]
  },
  {
    v: "v146", title: "存檔轉移僅檔案方式（移除複製碼入口）",
    notes: [
      "設定頁移除「匯出存檔／匯入存檔」複製碼入口——存檔轉移統一用檔案：下載 .txt 存檔檔 → LINE/Email 傳送 → 新裝置從檔案匯入",
      "存檔檔內容為壓縮碼（MGZ1:），檔案小、可當文字檔傳輸；舊版複製碼仍相容（貼上功能保留在系統內部，無 UI 入口）"
    ]
  },
  {
    v: "v145", title: "多選模式簡化：移除批量按鈕，長按進出",
    notes: [
      "移除裝備頁「批量操作」按鈕——長按任一裝備格進入多選模式，再長按任一格或點底部「完成」退出",
      "多選中點選的裝備格子以綠色外框＋✓ 角標高亮，底部操作條批量分解／鎖定解鎖不變",
      "自動分解按鈕改為單鍵全寬，操作列更簡潔"
    ]
  },
  {
    v: "v144", title: "存檔轉移大升級（壓縮碼 93% 縮短＋檔案傳輸）",
    notes: [
      "存檔碼改用瀏覽器內建 deflate 壓縮（零外部依賴）：實測 250 裝備＋100 歷史＋25 流浪者規模的存檔碼從 77,944 字元縮到 5,345（-93%）——複製貼上不再痛苦",
      "匯出新增「下載存檔檔」：存成 .txt 檔案，用 LINE/Email/雲端碟直接傳到新裝置；匯入新增「從檔案匯入」：選檔即載入",
      "舊存檔碼（無 MGZ1: 前綴的純 base64）完全相容，可繼續使用；舊瀏覽器自動退回未壓縮碼，功能不中斷",
      "驗證：壓縮碼匯出→匯入無損（裝備/金幣/素材一致）、四頁面正常、天文數字金幣（5.88×10³¹）頂欄正常顯示「秭」單位"
    ]
  },
  {
    v: "v143", title: "背景運行完整化（切走/其他分頁照常推進）",
    notes: [
      "補發上限從 1 小時放寬到 12 小時（與離線收益一致）：Chrome 隱藏分頁節流、Memory Saver 凍結分頁、長時間切到其他分頁——回到遊戲時完整補發打怪/金幣/經驗/素材進度",
      "補發期間靜音：大量擊殺不再爆掉落通知與音效（2 小時 ≈ 1.4 萬次擊殺），補完顯示「背景運行補發 N 秒進度」摘要並即時刷新畫面",
      "前台行為不變：掉落通知、音效、戰利品動畫照常；關閉分頁重開的離線收益（90 秒以上、12 小時內）維持原有規則"
    ]
  },
  {
    v: "v142", title: "裝備頁互動升級（手機放置手遊導向）",
    notes: [
      "點擊裝備直接開啟快捷操作（強化/分解/鎖定/詳情）——不再需要長按；長按改為進入多選模式：點選多件裝備、底部操作條批量分解或鎖定/解鎖（取代稀有度批量拆解）",
      "品質/套裝/屬性/排序/收合狀態跨 session 持久化；新增「未穿戴」「可強化」快速篩選、新獲得置頂排序、篩選條件計數",
      "背包容量警示：≥80% 標紅、剩不到 5 格提示可開啟自動分解；自動分解設定新增部位多選（武器/頭盔/鎧甲/靴子/飾品）",
      "參考劍與遠征、放置英雄等手機放置手遊的操作慣例設計"
    ]
  },
  {
    v: "v141", title: "選裝比較・武器圖標・副本頁按鈕",
    notes: [
      "戰力比較（▲提升／▼下降）改為僅在英雄詳情「選裝備」視窗顯示，裝備頁主網格不再顯示（消除與名稱重疊）；比較文字「▲戰力提升 +N」獨立顯示",
      "裝備圖標依部位與武器外型顯示（劍/弓/杖/匕首/大劍/錘各自圖標）；上鎖圖示點擊範圍加大至 22px",
      "副本頁：建議戰力／目前隊伍戰力說明放大顯眼（15px 數字＋面板框）；「自動續戰」「自動進關」按鈕文字恆定，狀態改用按鈕顏色（綠=開／藍=關）"
    ]
  },
  {
    v: "v140", title: "英雄詳情改版・裝備頁強化",
    notes: [
      "英雄詳情視窗改版：大頭像＋戰力數字置頂，內容頁籤化（屬性／裝備／技能），底部固定操作列（自動穿裝/訓練/補血補魔/突破/遣散），突破按鈕直接顯示消耗與不足原因",
      "屬性在升級／突破後顯示綠色 ↑ 變化標記；裝備格放大至 48px 並顯示部位名",
      "裝備頁：穿戴中的裝備標記「穿」徽章；格子顯示 vs 已穿戴的戰力差（▲綠升／▼紅降）；新增戰力排序（全部與部位分頁皆適用，寶石恆排最後）；新獲得裝備 NEW 光點（查看後消失）；套裝／屬性進階篩選收合進「篩選」展開，節省窄屏空間"
    ]
  },
  {
    v: "v139", title: "編入選隊・賣出上限・出戰隊即時同步",
    notes: [
      "英雄「編入」按鈕改為選隊視窗：選擇加入第 1-5 隊（未解鎖顯示鎖定），標記出戰中／目前所在隊，可一鍵移出所有隊伍",
      "出戰中的隊伍任何變動（編入／移出／切隊）立即同步派遣列表並生效於當前戰鬥；已召回狀態下編隊不自動出戰",
      "素材賣出數量上限 100000；手動輸入視窗預設清空（直接輸入新數量）",
      "英雄詳情視窗改原地刷新：突破／換裝等操作不再重開視窗，只更新受影響的數值與格子，連續操作不再跳窗"
    ]
  },
  {
    v: "v138", title: "素材賣出系統",
    notes: [
      "素材倉庫每項新增「賣出」按鈕：點開視窗可編輯賣出數量（−／手動輸入／＋，上限為持有量），預估收益即時顯示；單價：T1 素材 5 金、T2 20 金、T3 80 金",
      "賣出後素材數量與頂欄金幣即時刷新",
      "裝備頁面不再顯示素材方格（mat_* 道具隱藏，改由王國頁素材倉庫管理）；消耗品顯示正確名稱（生命藥水等，修復「鐵未知」）"
    ]
  },
  {
    v: "v137", title: "頂欄重設計・資源總覽・數字防溢出",
    notes: [
      "頂欄資源條改版：王國名字＋等級（含經驗條）固定在左上角，金幣與鑽石固定在右上角；招募券／榮譽／魔法書移入王國頁新增「資源總覽」區",
      "金幣與鑽石數字隨長度自動縮小字體，無論數值多大都不會擠出右邊界"
    ]
  },
  {
    v: "v136", title: "製作系統・戰鬥鎖取消・昇華・通知規則・屬性篩選",
    notes: [
      "裝備製作系統：合成移入鐵匠鋪（改名「裝備商店」），頁籤式製作（裝備/寶石/道具）；裝備製作器可選 類別→武器種類或部位→套裝/非套裝→稀有度→階級，成本隨階級稀有度遞增；寶石融合與藥水/靈藥/沙漏製作一併收錄",
      "英雄戰鬥鎖取消：戰鬥中任何編輯（驅逐/改名/升級/穿裝/編隊）立即生效——每 tick 從存檔同步隊伍，驅逐的英雄馬上消失、升級素質即時重算（血量比例保留、不重置怪物）",
      "自動編隊/批量驅逐按鈕恆顯示；招募後不再自動進隊伍（由玩家編入）",
      "建築頁移除頂部標題空白與「下一建築」橫條；「覺醒」全面改名「王國昇華」並移入昇華建築（更多頁移除入口）",
      "更新歷史重整：顯示最新 20 個版本（更早收合），版本徽章＋項目符號條列更易讀",
      "裝備掉落通知新增設定按鈕：稀有度/套裝/部位多選過濾",
      "裝備篩選新增屬性條（攻擊/防禦/生命/暴擊多選，顯示含所選屬性裝備）；寶石格與裝備格同一視覺",
      "昇華祭壇新增「犧牲清單」：紅框高亮警告將被重置的英雄／裝備／金幣素材／建築／進度",
      "修正消耗品掉落/製作數量 0→2 的隱藏錯誤"
    ]
  },
  {
    v: "v135", title: "裝備格填滿整行（消除右側空白）",
    notes: [
      "裝備格軌道由固定 60px 改為 minmax(60px, 1fr)：5 列伸滿整行（60→67px），右側不再留白；寶石格同步"
    ]
  },
  {
    v: "v134", title: "裝備格美觀化（稀有度漸層・立體鑲嵌・光暈）",
    notes: [
      "裝備格視覺升級為主流養成遊戲品質：稀有度徑向漸層背景（中心亮邊緣深）、稀有度色立體邊框、內層高光鑲嵌（偽元素）、圖示投影浮起",
      "高稀有度光暈：★4 柔光、★5 金橙光暈、★6 紅粉光暈；鎖定時金色雙環光暈",
      "名稱底部漸層暗條（白字+陰影，穿戴時轉金色）；強化/套裝/寶石孔/數量徽章強化陰影層次；桌機 hover 亮框、手機按壓縮放回饋",
      "邊框由階級色改為稀有度色（與品質視覺一致，階級資訊保留在詳情）"
    ]
  },
  {
    v: "v133", title: "裝備介面參考主流養成遊戲補強",
    notes: [
      "參考 Genshin/Epic Seven/AFK Arena 等主流養成遊戲的裝備介面設計，補齊五項管理功能：",
      "快速穿戴（Fast Equip）：英雄詳情一鍵從背包穿上各部位數值最佳裝備（比現穿好才換、鎖定不自動穿）",
      "套裝篩選：品質/排序旁新增套裝 chips（全部/無套裝/各套裝名），全部與部位分頁皆可篩",
      "長按格子快捷選單：鎖定/分解/強化/詳情，免進出視窗",
      "強化到上限：詳情一鍵連續強化至金幣耗盡或滿級；強化素材來源提示",
      "品質與套裝篩選統一作用於全部/部位分頁（預設仍全顯示）"
    ]
  },
  {
    v: "v132", title: "裝備格放大為 60px",
    notes: [
      "裝備格由 30px 放大為 60px（每行 5 格）：圖標 28px、恢復名稱顯示（稀有度色、底部單行截斷）；鎖定/強化/套裝/寶石孔/穿戴/數量徽章等比放大且不溢出；寶石格同步 60px"
    ]
  },
  {
    v: "v131", title: "背景運行修復・裝備介面優化・30px 密集裝備格",
    notes: [
      "背景運行修復：Chrome 隱藏分頁 5 分鐘後 setInterval 節流到每分鐘 1 次，舊 dt 上限 1.5s 讓進度幾乎停擺；改為長間隔拆成 ≤0.5s 子步執行——掛在背景/其他分頁時戰鬥、金幣、經驗照常推進（實測 90 秒背景 = 完整 90 秒進度）",
      "裝備介面優化：sprite 圖標 dataURL 快取（200 格重建時每格重做 toDataURL 是卡頓主因，50 次呼叫 0ms）；裝備格加 content-visibility 離屏跳過渲染",
      "裝備格縮為 30px 密集網格（auto-fill 自動填滿，120 道具 10 列/行）：未點開只顯示圖標 18px＋稀有度邊框；鎖定/強化/套裝/寶石孔/穿戴/數量徽章全部縮小並確保不溢出（詳情與名稱在點開後顯示）",
      "修正無效套裝值導致詳情視窗渲染中斷的隱藏錯誤"
    ]
  },
  {
    v: "v130", title: "五隊編制・方框勾選・T0 階級・裝備頁重整",
    notes: [
      "五隊編制：可編組最多 5 個隊伍，依酒館等級依序開放（Lv1=1 隊、Lv2=2、Lv4=3、Lv6=4、Lv8=5）；英雄頁新增「編隊管理」視窗（選隊/5 格編入/自動編隊，同一英雄只能待一隊）；副本頁顯示每隊人數與戰力（點卡切換）；派遣視窗可選擇派遣哪支隊伍；舊存檔自動遷移",
      "更多頁移除「關於王國」；設定內所有切換開關（音效/音樂/減少動畫/自動喝水/掉落通知）改為方框勾選",
      "裝備頁重整：篩選三排（分頁/品質排序/操作）移回頁面上方（英雄頁樣式 sticky）；自動分解改為跳出視窗（開關+★1-6 方框多選）；批量拆解與自動分解並排",
      "裝備格改為小圖示：未點開只顯示 圖標/稀有度（邊框色）/名稱，詳情點開後才顯示完整資料",
      "階級顯示改為 T0 最高級、往下越普通（內部數值不變，顯示反轉：T9→T1 最普通）"
    ]
  },
  {
    v: "v129", title: "桌機前五版稽核・舊存檔道具名稱防呆",
    notes: [
      "桌機（1280×900）全面稽核 v124-128 功能：固定工具列對齊與定位、5 件道具（含壞檔）全渲染、選項換行不需滑動、開關/批量拆解順序、品質篩選、靈藥圖標、派遣三欄視窗、批量驅逐紅鈕、稀有度排序（真實滑鼠）、流浪者詳情、商城/市場內容、更名券流程、設定頁——18 項全過、零 console error",
      "舊存檔無效 defId/階級道具名稱不再顯示 undefined（改為「未知」），稀有度星等上限 6 顆"
    ]
  },
  {
    v: "v128", title: "批量拆解移到自動分解開關右邊",
    notes: [
      "裝備頁工具列：批量拆解按鈕移到自動分解切換開關的右邊（順序：自動分解 → 開關 → 批量拆解）"
    ]
  },
  {
    v: "v127", title: "裝備格防呆・底部選項不需滑動",
    notes: [
      "修復異常存檔道具（稀有度越界/舊格式 defId）導致裝備格渲染崩潰中斷——「全部」分頁只看得到部分道具的根因；稀有度防呆後全部道具正常顯示",
      "裝備頁底部選項列（分頁/品質/排序/自動分解）由橫向捲動改為自動換行（flex-wrap）——所有選項不需滑動即可點到",
      "「全部」分頁維持顯示所有道具（含寶石，不受稀有度篩選影響）"
    ]
  },
  {
    v: "v126", title: "商城市場依貨幣拆分・靈藥圖標恢復・裝備頁固定工具列",
    notes: [
      "恢復靈藥與生命/魔力藥水按鈕的圖標（其餘按鈕維持純文字）",
      "商城與市場依貨幣拆分：商城＝鑽石購買的道具（招募券/寶袋/靈藥/沙漏/更名券/新手禮包）＋課金裝備；市場＝金幣購買的道具（生命/魔力藥水）",
      "裝備頁底部工具列改為固定在底部導覽列上方（與導覽列同層級，捲動不影響位置）",
      "「全部」分頁顯示所有道具（含寶石、不受稀有度篩選影響）；篩選僅作用於部位分頁"
    ]
  },
  {
    v: "v125", title: "按鈕去圖標・商城市場拆分・更名券 500 鑽・裝備頁底部固定",
    notes: [
      "全部按鈕移除圖標（純文字），介面更乾淨",
      "批量拆解改為一般按鈕格式（無圖標）並移到「自動分解」右邊；裝備頁底部工具區改為固定（sticky），捲動方格不會蓋住",
      "設定內商店改為「商城」：專賣課金裝備（鑽石購買，階級依進度）；其他道具（招募券/寶袋/靈藥/更名券等）移到村莊「市場」建築，點市場建築開啟",
      "更名券售價改為 500 鑽石，並加回「更改王國名稱」功能（王國/英雄二選一）"
    ]
  },
  {
    v: "v124", title: "裝備頁重設計・自動分解入裝備頁・批量驅逐移位",
    notes: [
      "裝備方格改為主流養成遊戲卡片式：稀有度色標題字 + 部位圖示放大（30px）+ 裝備名稱 + 稀有度星等 + T 階級，鎖定金框",
      "裝備頁篩選條（分頁/品質/排序）與批量拆解按鈕移到頁面下方，手機拇指好按",
      "自動分解設定移入裝備頁底部（開關 + ★1-6 多選），設定頁移除",
      "批量驅逐流浪英雄按鈕移到「自動編隊」旁邊並改為紅色"
    ]
  },
  {
    v: "v123", title: "派遣視窗改三欄垂直捲動",
    notes: [
      "派遣視窗目的地選擇改為三欄垂直捲動：左欄章節（區域）、中欄小關（1-9+BOSS）、右欄難度（Ⅰ-Ⅳ），各欄獨立垂直捲動，一眼同時比較三項"
    ]
  },
  {
    v: "v122", title: "派遣視窗說明文字統一 15px",
    notes: [
      "派遣視窗的區域名稱／難度名稱／關卡標籤說明文字統一為 15px（與圖示一致，原 8-9px 過小）"
    ]
  },
  {
    v: "v121", title: "派遣視窗圖示統一 15px",
    notes: [
      "派遣視窗的區域怪物圖示／難度羅馬數字／關卡數字統一為 15px（原本 22-24px 不一致），說明文字維持縮小"
    ]
  },
  {
    v: "v120", title: "自動分解多選・副本選擇全入派遣視窗・魔力不足標示・批量驅逐",
    notes: [
      "自動分解改為多選稀有度（★1-6 各自勾選），不再只有「低於 N 星」單一門檻；舊存檔自動遷移",
      "副本目的地選擇（區域/難度/關卡）全部移入「派遣」視窗：主畫面不再重複放置；視窗內圖像放大（怪物圖示 22px、羅馬數字 24px、關卡數字 22px）、文字縮小",
      "派遣視窗新增「查看關卡情報」按鈕：先看戰利品/掉落率/BOSS 資訊，再選擇目的地",
      "編隊列技能狀態新增「魔力不足」：技能冷卻就緒但魔力不夠時以紅色顯示（技能消耗魔力造成）",
      "流浪英雄新增批量驅逐：依稀有度多選，一次請離所有符合的流浪英雄（含符合數量預覽與危險確認）"
    ]
  },
  {
    v: "v119", title: "桌機操作修復・自動分解・副本圖像化・裝備管理",
    notes: [
      "修復桌機點擊失效：橫向捲動列的滑鼠拖動實作（pointer capture）會劫持列內 chip/按鈕的點擊——稀有度排序、批量分解的品質選擇、區域/職業/裝備分頁 chips 在桌機全部點不動（手機正常）；改為未拖動時把點擊補回原元素",
      "自動分解：設定新增「自動分解低品質裝備」開關與門檻（低於★2-5 分解）——打到低於所選品質的裝備立刻分解成金幣與素材（已穿戴、鎖定、較高品質不受影響）",
      "副本控制區圖像化：難度改為羅馬數字圖像按鈕（Ⅰ-Ⅳ）、關卡改為圖像數字按鈕（1-9 + ☠ BOSS）、區域列加上怪物圖示；派遣按鈕改為彈出「派遣目的地」視窗——在視窗內選擇區域/難度/關卡並預覽金幣經驗，再派遣出征",
      "編隊列每格新增魔力條（藍色），戰鬥中即時更新",
      "流浪英雄：點卡片開啟詳情視窗（戰力/生命/心情/狩獵金幣/素材機率/狀態），新增驅逐按鈕（確認後永久離開）",
      "裝備管理：稀有度篩選（★1-6）、階級/稀有度排序、鎖定功能（🔒 防止自動/批量/單件分解誤拆；鎖定即時顯示與重繪）",
      "舊存檔自動補齊自動分解設定欄位"
    ]
  },
  {
    v: "v118", title: "編隊列顯示英雄戰力",
    notes: [
      "副本分頁的編隊列每格新增「戰力」顯示（與英雄列表同格式）；升級/穿裝後戰力即時更新"
    ]
  },
  {
    v: "v117", title: "怪物稀有度・戰利品結算改版・BOSS 關命名",
    notes: [
      "怪物稀有度系統：普通怪 ★1 為主、小關內 22% 出現精英怪（★4-5、名字「精英」前綴、紫/橙名）、BOSS ★6 金名；精英怪金幣 ×6、經驗 ×5、素材/藥水/裝備/寶石/技能書掉落 ×3-4——練角刷小關、追擊精英怪都有意義，不再只刷 BOSS",
      "戰利品動畫改版：金幣直接從怪物飛向英雄（不再原地掉落/往下）；飛行期間頂欄數字不跳動，抵達英雄後才跳出 +金/+經驗 並觸發頂欄數字跳動——看起來英雄拿到才結算",
      "怪物頭上名字不再標 BOSS；關卡名稱第 10 關直接顯示「BOSS 關」（橫幅/派遣中/關卡選擇/戰報一致）",
      "更名券移除王國名稱選項：點使用直接選擇要更名的英雄",
      "戰利品資訊面板顯示精英怪機率與加成"
    ]
  },
  {
    v: "v116", title: "技能魔力平衡・BOSS 字樣・戰利品動畫・更名券等六項",
    notes: [
      "技能魔力平衡：戰鬥中新增緩慢回魔 2%/秒（冷卻與消耗保留）——技能受 MP 與冷卻雙重節制，不會打幾場就整場停擺，也不能無腦連發",
      "「首領」字樣全面改為「BOSS」（橫幅/戰報/任務/成就/圖鑑/寶石說明等）",
      "技能施放時英雄側同步跳出紫色傷害數字（普攻原本就有）",
      "戰利品動畫改版：金幣掉在怪物原地 → 緩慢飛向隨機英雄 → 抵達消失（整體約 1.3-1.7 秒）",
      "說明小字放大（12→13px）並改用顯眼的亮色；次要文字整體調亮",
      "新遊戲免費贈送一名初始領地英雄（隨機職業、稀有度 2，自動編入出戰第一位）",
      "更名券：商店清單最上方販售（250 金），點「使用」跳出視窗選擇要更改王國或英雄名稱（1-12 字，消耗 1 張）；王國名稱顯示於王國頁標題與教學",
      "舊存檔自動補齊更名券與王國名稱欄位"
    ]
  },
  {
    v: "v115", title: "首領首通通知文案精簡",
    notes: [
      "「下一區域已解鎖」通知移除結尾括號補充（也可留在原地繼續練角），維持原本通知內容，一眼即讀"
    ]
  },
  {
    v: "v114", title: "操作後維持捲動位置・首領首通通知只顯示一次",
    notes: [
      "英雄/裝備/商店等操作選單（訓練/突破/強化/穿戴/領獎）刷新後不再跳回頂部：modal 就地重建保留原本捲動位置",
      "各分頁各自記憶捲動位置：切換分頁後回到原分頁維持原本滑動的地方",
      "首領第一次擊敗才顯示「下一區域已解鎖」通知與戰報（regionClearShown 旗標持久化，舊存檔自動補齊）；重複討伐不再重複提示",
      "修正 v112 節流回歸：快速重進分頁時英雄/裝備/建築列表與副本的區域列、編隊列、戰報不再空白",
      "修正「已解鎖」通知長久以來的隱藏錯誤（consumeEvents 引用未定義變數，僅在關閉自動進關刷首領時觸發）"
    ]
  },
  {
    v: "v113", title: "通知顯示優化：一眼可見且不擋操作",
    notes: [
      "相同通知連續觸發自動合併為一則並計次（×N）——掉落/連點不再洗版遮住畫面",
      "堆疊上限：手機同時最多 2 則、桌機 3 則，超過自動移除最舊",
      "重要通知（成功/失敗/金色獎勵）顯示較久（2.4-2.6 秒），一般訊息 1.6 秒即收",
      "通知精簡為單行緊湊樣式、手機寬度上限 300px，不會蓋滿螢幕；點擊仍完全穿透",
      "通知區加入 aria-live 朗讀支援（無障礙）"
    ]
  },
  {
    v: "v112", title: "效能最佳化：列表重建節流（手機卡頓修正）",
    notes: [
      "手機卡頓根因：每 500ms 全量重建列表 DOM（40 英雄 138ms / 200 裝備 700ms+ 手機）",
      "新增狀態簽名機制：英雄/裝備/建築/王國/副本列表在狀態沒變時跳過重建（英雄 1.5ms、裝備 0.4ms、建築 0.06ms、王國 0.08ms、副本待機 0.33ms）",
      "互動（招募/編隊/穿戴/強化/購買/派遣）仍會立即重建，正確性不受影響",
      "王國經驗條獨立更新（不再觸發全量重建）；戰鬥中血條/技能冷卻維持 4Hz 即時更新"
    ]
  },
  {
    v: "v111", title: "商店首次開啟修正確認・快取強制更新",
    notes: [
      "商店首次開啟商品顯示：確認 v110 修正生效（首次開啟道具分頁即渲染 10 項商品）",
      "快取版本 v110→v111：強制瀏覽器重新下載全部腳本，避免舊版（無初始渲染）殘留導致首次開啟無商品"
    ]
  },
  {
    v: "v110", title: "商店與存檔匯入強化",
    notes: [
      "商店修正：開啟時道具分頁立即顯示商品（分頁化時遺漏的初始渲染）",
      "匯入存檔安全驗證：非遊戲存檔結構（任意 JSON）一律拒絕，不會再洗白進度",
      "匯入/讀取共用遷移：舊版存檔自動補齊新欄位（貨幣/素材/設定/統計/地圖進度）",
      "存檔碼匯出：剪貼簿成功自動複製，失敗時以輸入框顯示存檔碼"
    ]
  },
  {
    v: "v108", title: "地圖改進度解鎖・覺醒條件修正",
    notes: [
      "地圖區域不再受王國等級限制：擊敗前一區域首領即可解鎖下一區域（含難度解鎖同步改為區域進度）",
      "覺醒條件修正：原「抵達第 35 關」無法達成（每區只有 1-10 關），改為「抵達第 3 大關（灰燼洞穴）第 5 波」",
      "舊存檔自動遷移：依已攻略進度推算已解鎖區域"
    ]
  },
  {
    v: "v104", title: "九項系統優化",
    notes: [
      "區域列桌面板支援滑鼠拖動與捲軸（手機原本即可滑動）",
      "線上打怪獲得王國經驗（普通怪低倍率、首領較高）",
      "已穿戴裝備顯示穿戴英雄名稱",
      "建築詳情新增等級效果一覽（Lv1/5/10/15/20/30/40）",
      "英雄詳情新增手動補血/補魔按鈕（消耗藥水）",
      "合成完成後直接開啟穿戴選單",
      "商店新增裝備分頁（隨機裝備購買、部位可選）",
      "背包批量拆解：多選稀有度一鍵拆解",
      "突破條件說明：階段等級需求（Lv10/25/50/100/150）與資源條件"
    ]
  },
  {
    v: "v96", title: "更新歷史",
    notes: [
      "更多頁新增「更新歷史」：展開式 patch notes（收合=版本號+標題、展開=更新內容）"
    ]
  },
  {
    v: "v95", title: "王國等級重平衡",
    notes: [
      "每級：全隊攻擊 / 金幣 / 經驗 +1%（50 級 = +50%，與建築加成相乘）",
      "升級禮包：升級送禮金（隨等級成長），每 5 級加贈 10 鑽石",
      "王國經驗來源增加：英雄升級、建築升級、討伐首領、離線掛機",
      "需求曲線緩和：Lv50 所需經驗從 2.8 萬降至 1.2 萬"
    ]
  },
  {
    v: "v94", title: "王國經驗條",
    notes: [
      "王國頁總覽下方新增詳細王國經驗條：目前 / 需求經驗與百分比，每秒自動更新"
    ]
  },
  {
    v: "v91", title: "離線結算完整明細",
    notes: [
      "離線結算改為逐項明細：金幣、英雄經驗、王國經驗、各素材名稱×數量、裝備件數"
    ]
  },
  {
    v: "v90", title: "離線王國經驗",
    notes: [
      "派遣期間離線，每小時累積王國等級需求 8% 的王國經驗（8 小時約 0.6 級）"
    ]
  },
  {
    v: "v88", title: "素材倉庫",
    notes: [
      "素材總覽移至王國頁：展開式列表，收合顯示名稱與數量，點開顯示獲取來源",
      "數量每秒自動刷新且保留展開狀態"
    ]
  },
  {
    v: "v85", title: "戰利品通知開關",
    notes: [
      "設定新增通知區：藥水 / 裝備 / 寶石 / 技能書掉落通知可獨立開關（預設關閉）",
      "商店數量調整排版穩定，購買後捲動位置保持"
    ]
  },
  {
    v: "v82", title: "全站用語改版",
    notes: [
      "獵人→英雄、狩獵→副本、獵場→地圖，全面統一為英雄培養遊戲用語"
    ]
  },
  {
    v: "v81", title: "關卡情報與戰利品",
    notes: [
      "金色情報按鈕（加速鈕左側）：顯示該關金幣/經驗、素材與藥水掉落率、首領額外獎勵、難度加成"
    ]
  },
  {
    v: "v80", title: "藥水打怪掉落為主",
    notes: [
      "藥水改為主要靠打怪掉落：r0 起普通怪 6%、首領 60%，隨區域成長",
      "商店改為便利補充管道"
    ]
  },
  {
    v: "v79", title: "自動喝水 1 秒冷卻",
    notes: [
      "自動喝水節奏調整為 1 秒冷卻，低於閾值連續飲用直到達標"
    ]
  },
  {
    v: "v77", title: "自動喝水無冷卻",
    notes: [
      "自動喝水移除冷卻限制：低於閾值立即飲用並連續喝到達標"
    ]
  },
  {
    v: "v76", title: "王國概覽",
    notes: [
      "王國頁新增概覽四卡：勢力、副本、生產、圖鑑 + 建築等級橫幅，每秒刷新"
    ]
  },
  {
    v: "v67", title: "藥水掉落與工坊解鎖",
    notes: [
      "藥水工坊解鎖提前至王國 2 級（與鐵匠鋪同步）",
      "怪物開始掉落生命/魔力藥水（含掉落機率成長曲線）"
    ]
  },
  {
    v: "v65", title: "彈窗 ✕ 常駐",
    notes: [
      "所有彈窗改為固定頭部結構：右上角 ✕ 永遠可見，不被內容捲動蓋掉"
    ]
  },
  {
    v: "v64", title: "藥水時間顯示優化",
    notes: [
      "藥水疊加超過 6 小時改以「N 小時」顯示，按鈕文字防溢出"
    ]
  },
  {
    v: "v63", title: "MP 系統與自動喝水",
    notes: [
      "新增魔力系統：職業魔力、技能施放消耗、非戰鬥回復",
      "魔力藥水（商店+獵場補魔按鈕）",
      "設定新增自動喝水：生命/魔力各自閾值（30/50/70/90%）"
    ]
  },
  {
    v: "v60", title: "加速沙漏改版",
    notes: [
      "加速沙漏改為入庫道具，獵場按鈕啟用（與靈藥同設計）",
      "靈藥與沙漏啟用數量可手動輸入，多瓶時間疊加"
    ]
  },
  {
    v: "v57", title: "篩選選中態強化",
    notes: [
      "篩選標籤選中：金底+粗體+光暈，切換即時變色",
      "領地/流浪切換按鈕選中態明顯區分"
    ]
  },
  {
    v: "v55", title: "英雄頁視圖切換",
    notes: [
      "英雄頁新增領地/流浪英雄切換按鈕",
      "流浪英雄套用上方篩選（職業/出戰中）與排序"
    ]
  },
  {
    v: "v53", title: "靈藥啟用提示優化",
    notes: [
      "啟用中的靈藥按鈕：金色底+深色文字+剩餘時間倒數，一眼可見效果"
    ]
  },
  {
    v: "v52", title: "多項 UI 優化",
    notes: [
      "靈藥啟用顯示文字提示（名稱+倒數+數量）；原地練角只顯示關卡",
      "商店數量可手動輸入；展開全部按鈕明顯化；加速鈕精緻化",
      "獵人分頁改名英雄；流浪英雄併入英雄頁（招募後成為領地英雄）"
    ]
  },
  {
    v: "v50", title: "商店批量購買",
    notes: [
      "可批量商品每列 [-] [xN] [+] 步進器（上限 99），按鈕顯示總價，金幣不夠自動停"
    ]
  },
  {
    v: "v49", title: "分頁改版",
    notes: [
      "狩獵分頁改名「副本」；建築選項從王國頁獨立成「建築」分頁（含教學指向）；王國頁保留城鎮/流浪者/覺醒"
    ]
  },
  {
    v: "v48", title: "加速鈕與名冊上限",
    notes: [
      "加速改圓形播放鈕（1x▶ / 2x▶▶ / 4x⏩）",
      "名冊總數上限完整顯示，招募三管道同受上限限制"
    ]
  },
  {
    v: "v47", title: "獵人公會改名酒館",
    notes: [
      "全代碼/文案/教學/圖鑑同步；名冊上限隨酒館等級成長（上限 40 人）"
    ]
  },
  {
    v: "v45", title: "流浪英雄目標導向移動",
    notes: [
      "說去用餐→走到市場才消費、狩獵→走到村口、離開→走出畫面",
      "對話泡泡 7 秒、畫布/卡片字體加大+氣泡尾巴"
    ]
  },
  {
    v: "v43", title: "戰鬥演出強化",
    notes: [
      "攻擊白閃+突刺+近戰揮砍光、施法光暈加大",
      "英雄傷害數字與狀態圖示（護盾/嘲諷/技能就緒）+放招動畫"
    ]
  },
  {
    v: "v41", title: "藥水數量顯示",
    notes: [
      "藥水按鈕顯示倉庫數量：靈藥 xN（啟用中併顯倒數）、補血 xN，多筆加總正確"
    ]
  },
  {
    v: "v38", title: "戰鬥編輯鎖細化",
    notes: [
      "戰鬥鎖只針對參戰（派遣中）英雄：突破/訓練/穿戴/遣散照常可編輯板凳英雄",
      "參戰者裝備不可分解/鑲嵌；編隊編輯戰鬥中仍全鎖"
    ]
  },
  {
    v: "v37", title: "iOS 開關與招募解鎖",
    notes: [
      "設定開關改 iOS 樣式：彈性滑動+拉伸動畫+按壓縮放+音效",
      "招募解除戰鬥鎖（英雄/編隊編輯仍鎖）"
    ]
  },
  {
    v: "v36", title: "戰鬥編輯鎖",
    notes: [
      "戰鬥中禁止英雄/編隊編輯：突破/訓練/遣散/編隊/招募/穿戴/卸下/鑲寶石/分解全數阻擋"
    ]
  },
  {
    v: "v31", title: "資源面板與戰鬥紀錄",
    notes: [
      "戰鬥紀錄保留 100 筆、點標題可瀏覽全部；刪除「倒退一關」按鈕",
      "頂欄新增技能書；素材總覽面板；圖書館技能研讀（消耗技能書強化技能威力）",
      "首領獎勵下調（10 鑽/2 榮譽，配合自由選關重複討伐）"
    ]
  },
  {
    v: "v30", title: "自動進關與下拉選單",
    notes: [
      "自動進關開關：開=全自動推進、關=原地重複討伐練角",
      "難度/關卡改下拉選單（未解鎖選項禁用）"
    ]
  },
  {
    v: "v29", title: "自由選擇關卡",
    notes: [
      "關卡 1-10（B=首領關）可跳去任何已推進到的關卡原地練角，未推進鎖定灰顯、戰鬥中鎖切換"
    ]
  },
  {
    v: "v27", title: "持續性生命系統",
    notes: [
      "英雄擁有持久 HP：開戰承接當前血量、每 tick 寫回；升級自動補滿、突破按比例成長",
      "切換獵場/難度/召回都不補血；非戰鬥自動恢復 2%/秒；離線回歸滿血",
      "回血管道：死亡休息 20 秒滿血復活、生命藥水（商店 800 金立即補全隊 50%）"
    ]
  },
  {
    v: "v24", title: "自由選擇獵場",
    notes: [
      "移除自動區域推進：打敗首領原地重複討伐、可手動切換到任一已解鎖區域練角",
      "解鎖提示 toast + 首次踏入新獵場解放慶祝"
    ]
  },
  {
    v: "v23", title: "連敗回退",
    notes: [
      "跨戰鬥累計 3 敗自動退一關；第 1 關仍連敗→難度降一級（直到普通）",
      "回村待機在休息中也可即時按"
    ]
  },
  {
    v: "v22", title: "副本難度系統",
    notes: [
      "4 難度：普通/困難/地獄/夢魘（魔物三圍 ×1/1.8/3.2/5.5、金幣 ×1.6/2.4/3.4、經驗 ×1.5/2.2/3.0）",
      "區域門控解鎖、切換難度重置首領進度；普通曲線重調修復中段練功死區"
    ]
  },
  {
    v: "v19", title: "經濟平衡修正",
    notes: [
      "素材迴圈修復：舊素材通用掉落 + 分解金字塔回收（前期素材不再鎖死）",
      "強化費用曲線 ×1.55→×1.5；金幣招募費用封頂（第 10 次後不再翻倍）"
    ]
  },
  {
    v: "v17", title: "自動續戰",
    notes: [
      "休息結束自動重新派遣當前編隊（開關可關）；回村待機改即時無確認；休息中收益為 0"
    ]
  },
  {
    v: "v14", title: "派遣操作精簡",
    notes: [
      "移除選擇獵人出征：派遣=直派編隊全員；按鈕顯示編隊人數、空編隊禁用",
      "狩獵隊條固定顯示編隊格位（空格=空位，派遣時疊加戰鬥狀態）"
    ]
  },
  {
    v: "v10", title: "死亡回城休息",
    notes: [
      "全軍倒下後狩獵畫布改繪城內場景（英雄💤+休息倒數條），移除全軍撤退全屏遮罩"
    ]
  },
  {
    v: "v8", title: "狩獵改派遣制",
    notes: [
      "招募後的英雄一律城內待機、不主動戰鬥；可派遣 1~N 名英雄出戰（預設=編隊）",
      "全軍倒下或召回→自動回家休息 20 秒（滿血）→待機，不自動再戰",
      "未派遣時完全沒有收益（含離線）；首領進度跨派遣持久"
    ]
  }
];
