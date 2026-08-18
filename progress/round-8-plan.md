---
本輪選題:點按目標 44px 完整覆蓋 — 用 CSS 元件級地板規則＋逐頁 inline 小目標修補,把 6 個主畫面共 100 枚 <44px 互動目標全部補到 ≥44px。
為何讓玩家玩更久:派遣 4 人/自動續戰/自動進關(40px)、靈藥與沙漏(34px)、一鍵例行/一鍵領取全部(26px)是玩家每天點數十次到數百次的主路徑按鈕,全部低於觸控最小目標;小目標誤觸率高(26px 一鍵領取緊貼卡片列,誤觸直接領錯/觸發非預期動作),每次誤觸與縮手瞄準都是摩擦累積,直接侵蝕「掛機回來收菜很順」的核心體驗;把主路徑按鈕放大到一拇指可盲按,是把日常循環的體感摩擦壓到最低的最高槓桿改動。
證據援引:round-8-evidence.md 候選 1(★最強)— DOM getBoundingClientRect 實測 6 畫面共 100 枚 <44px(hunt 13/20、kingdom 26/32、hunters 20/28、equipment 20/26、buildings 20/26、more 1/26);逐項尺寸已列出(派遣 4 人 118×40、靈藥 181×34、一鍵例行/一鍵領取全部 26px、每日任務卡 38-41px、逐件強化/訓練 30-40px、篩選 chips 34px、分頁 tab 34-40px、建築升級 48×40、階級標籤 40×23、more 排序 55×26);直接違反 DESIGN.md §5「touch targets ≥ 44px」契約;對應 improvement-log QoL backlog 未完成項「P1 點按目標 44px 完整覆蓋 audit」。
方案:
- 檔案:css/style.css(主;必要時 css/extra.css 追加);js/ui/hunt.js、hunters.js、equipment.js、kingdom.js、more.js 的**互動層 inline style**(僅 padding/minHeight/height/fontSize 等幾何屬性,不動邏輯、不動資料、不動渲染層);js/ui/main.js 頂欄若實測有 <44px 目標一併補。全部落在 QoL 軌道所有權內(style.css/extra.css/dom.js/main.js 自有;hunt/hunters/equipment/kingdom/more 為 goal-qol.md 明示的「互動層」可改範圍)。
- 設計:
  1) 先在 css/style.css 加一組元件級地板規則(不要全域 `*`),覆蓋既有語彙的共用類:按鈕/chip/tab/分頁/卡片列內可點元素,規則形態為
     `min-height:44px; display:inline-flex; align-items:center; justify-content:center;`(配上既有 box-sizing),讓放大來自 min-height 而非寫死 height,避免文字截斷;橫向 padding 維持既有密度不加寬。
  2) 對 inline style 寫死小尺寸的熱點(證據列出的逐項尺寸清單)逐一改:固定 height/padding 6-8px → minHeight:'44px' + display:flex 置中;fontSize 10-12px 在目標變大後可維持不動(先不放大字級,避免換行破版;審美閘門若判可讀性不足再調)。
  3) 小圖示類(▶ 27×34、ⓘ 34×34)用 padding 擴大**點擊熱區**到 ≥44px,視覺圖像本身不放大。
  4) 桌機版不破壞緊緻密度:若 style.css 現有規則是桌機/行動共用,地板規則放進既有的行動 media query(若無則以 `(pointer:coarse)` 或現有行動斷點包住),確保 1280×800 桌機截圖無版面位移。
  5) 繁體中文文案零更動;不新增隨機性;不碰存檔 schema。
- 驗證門檻:
  a) node --check 全改動 JS 通過;
  b) 復跑取證量測腳本(.tmp/measure.js/.tmp/count.js,同 390×844 DPR2 行動視口與同測試存檔),6 畫面逐畫面互動目標 <44px 數量由 100 → 0;若有例外(例如視覺上不可分割的密集圖示),例外需熱區 ≥44px 且在報告逐項列出理由;
  c) 回歸:王國→副本→英雄→裝備→建築→更多→回城 全程零 console error/unhandledrejection;桌機 1280×800 同流程零 error 且版面無位移;
  d) 截圖:before/after 至少 hunt、kingdom、equipment 三畫面(存 progress/,命名含版本號);
  e) 審美閘門:對 after 截圖 inspect_image,判「放大後是否換行破版/密度失衡/與既有樣式協調」,不合格回改;按鈕變高後出現文字溢出或卡片列撐破者一律視為不合格。
- 風險與回滾:風險一:min-height 放大後高密度列表(每日任務卡、建築卡列)總高增加 → 需要捲動,屬可接受;風險二:inline 改 minHeight 漏項 → 以量測腳本 0 枚 <44px 為硬性門檻擋下;風險三:桌機密度被行動規則波及 → 以 media query 隔離並以桌機截圖驗證。回滾:單一 commit 涵蓋 CSS+inline 修補,git revert 即完整還原;無存檔/數值/渲染層改動,無殘留。
---
