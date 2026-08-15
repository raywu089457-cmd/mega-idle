# MEGA IDLE 自主迭代迴圈 — goal-run 記錄

## 最後完成輪次: v497（2026-08-15）

### [v497] 改動: 編隊批量搬移 hover 提示
理由: 搬移行為缺說明。
實作:
- js/ui/hunters.js: 搬移到列 title（覆寫語意・互斥處理）
- index.html: 快取 506→507；js/data/changelog.js: v497 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v497-move-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 218 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v496（2026-08-15）

### [v496] 改動: 編隊隊列 chips hover 提示
理由: 出戰隊概念缺說明。
實作:
- js/ui/hunters.js: 5 隊 chips title（切換語意・解鎖條件）
- index.html: 快取 505→506；js/data/changelog.js: v496 條目
驗證:
- 5 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v496-teamchip-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 217 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v495（2026-08-15）

### [v495] 改動: 共鳴自動填入鈕 hover 提示
理由: 自動填槽規則不明。
實作:
- js/ui/hunters.js: 自動填入鈕 title（受益優先・一鍵）
- index.html: 快取 504→505；js/data/changelog.js: v495 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v495-autofill-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 216 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v494（2026-08-15）

### [v494] 改動: 共鳴名冊列 hover 提示
理由: 名冊候選缺受益語意。
實作:
- js/ui/hunters.js: 候選格 title（受益/無效果・點擊填入）
- index.html: 快取 503→504；js/data/changelog.js: v494 條目
驗證:
- 11 格 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v494-reslist-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 215 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v493（2026-08-15）

### [v493] 改動: 升星鈕 hover 提示
理由: 升星鈕缺消耗說明。
實作:
- js/ui/hunters.js: 升星鈕 title（消耗・永久提升）
- index.html: 快取 502→503；js/data/changelog.js: v493 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v493-starupbtn-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 214 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v492（2026-08-15）

### [v492] 改動: 升星候選列 hover 提示
理由: 候選標記缺語意。
實作:
- js/ui/hunters.js: 候選清單 title（🔒/⚔ 標記・操作路徑）
- index.html: 快取 501→502；js/data/changelog.js: v492 條目
驗證:
- 源碼確認（候選僅缺料時顯示）；完整迴歸通過；rm 靜態；零 console error
- progress/v492-cands-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 213 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v491（2026-08-15）

### [v491] 改動: 升星資訊列 hover 提示
理由: 升星規則缺說明。
實作:
- js/ui/hunters.js: 升星資訊 title（永久倍率・消耗・裝備歸還）
- index.html: 快取 500→501；js/data/changelog.js: v491 條目
驗證:
- title 正確（×1.21）；完整迴歸通過；rm 靜態；零 console error
- progress/v491-starup-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 212 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v490（2026-08-15）

### [v490] 改動: 置換石取得提示 hover
理由: 置換石來源不可見。
實作:
- js/ui/hunters.js: 置換石深鏈鈕 title（唯一來源・兌換規則）
- index.html: 快取 499→500；js/data/changelog.js: v490 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v490-swapstone-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 211 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v489（2026-08-15）

### [v489] 改動: 英雄置換候選列 hover 提示
理由: 置換候選缺對調明細。
實作:
- js/ui/hunters.js: 置換候選列 title（投資對調・置換石消耗）
- index.html: 快取 498→499；js/data/changelog.js: v489 條目
驗證:
- title 正確（★5↔★4 ×2 石）；完整迴歸通過；rm 靜態；零 console error
- progress/v489-swap-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 210 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v488（2026-08-15）

### [v488] 改動: 鑲嵌寶石列 hover 提示
理由: 鑲嵌列缺消耗/回收說明。
實作:
- js/ui/equipment.js: 寶石選擇列 title（消耗・可移除回收）
- index.html: 快取 497→498；js/data/changelog.js: v488 條目
驗證:
- 源碼確認（鑲嵌視窗依賴寶石庫存）；完整迴歸通過；rm 靜態；零 console error
- progress/v488-gempick-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 209 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v487（2026-08-15）

### [v487] 改動: 穿戴英雄選擇列 hover 提示
理由: 穿戴列缺替換說明。
實作:
- js/ui/equipment.js: 穿戴選擇列 title（替換規則）
- index.html: 快取 496→497；js/data/changelog.js: v487 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v487-pickhunter-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 208 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v486（2026-08-15）

### [v486] 改動: 寶石插槽列 hover 提示
理由: 插槽操作缺說明。
實作:
- js/ui/equipment.js: 插槽列 title（鑲嵌/移除・融合升級）
- index.html: 快取 495→496；js/data/changelog.js: v486 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v486-socket-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 207 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v485（2026-08-15）

### [v485] 改動: 裝備詳情套裝行 hover 提示
理由: 套裝加成缺規則說明。
實作:
- js/ui/equipment.js: 詳情頁套裝行 title（2/4 件啟動）
- index.html: 快取 494→495；js/data/changelog.js: v485 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v485-eqset-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 206 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v484（2026-08-15）

### [v484] 改動: 裝備詞綴列 hover 提示
理由: 詞綴語意不明。
實作:
- js/ui/equipment.js: 詳情頁詞綴列 title（★3+・重鑄）
- index.html: 快取 493→494；js/data/changelog.js: v484 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v484-affix-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 205 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v483（2026-08-15）

### [v483] 改動: 自動分解設定列 hover 提示
理由: 自動分解機制缺說明。
實作:
- js/ui/equipment.js: 啟用自動分解列 title
- index.html: 快取 492→493；js/data/changelog.js: v483 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v483-autodis-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 204 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v482（2026-08-15）

### [v482] 改動: 裝備過濾 chips hover 提示
理由: 過濾 chips 缺語意。
實作:
- js/ui/equipment.js: 品質/排序 chips title
- index.html: 快取 491→492；js/data/changelog.js: v482 條目
驗證:
- 11 chip title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v482-filter-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 203 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v481（2026-08-15）

### [v481] 改動: 背包容量列 hover 提示
理由: 容量列缺管理說明。
實作:
- js/ui/equipment.js: 容量列 title（倉庫升級・滿格處理）
- index.html: 快取 490→491；js/data/changelog.js: v481 條目
驗證:
- title 正確（250 格）；完整迴歸通過；rm 靜態；零 console error
- progress/v481-cap-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 202 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v480（2026-08-15）

### [v480] 改動: 詞綴重鑄鈕 hover 提示
理由: 重鑄機制缺說明。
實作:
- js/ui/equipment.js: 重鑄鈕 title（詞綴機制・★3+ 條件）
- index.html: 快取 489→490；js/data/changelog.js: v480 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v480-reroll-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 201 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v479（2026-08-15）

### [v479] 改動: 裝備強化鈕 hover 提示
理由: 強化機制缺說明。
實作:
- js/ui/equipment.js: 詳情頁強化鈕 title（屬性成長・失敗規則）
- index.html: 快取 488→489；js/data/changelog.js: v479 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v479-enhance-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 200 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v478（2026-08-15）

### [v478] 改動: 公會首領弱點列 hover 提示
理由: 弱點機制缺說明。
實作:
- js/ui/more.js: 弱點列 title（剋制 ×1.5・每週輪換）
- index.html: 快取 487→488；js/data/changelog.js: v478 條目
驗證:
- title 正確（暗・雷 ×1.5）；完整迴歸通過；rm 靜態；零 console error
- progress/v478-weak-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 199 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v477（2026-08-15）

### [v477] 改動: 週討伐進度列 hover 提示
理由: 週討伐缺構成說明。
實作:
- js/ui/more.js: 週討伐頭部 title（21 場構成・重置・領取）
- index.html: 快取 486→487；js/data/changelog.js: v477 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v477-wkraid-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 198 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v476（2026-08-15）

### [v476] 改動: 防守紀錄列 hover 提示
理由: 防守紀錄缺語意。
實作:
- js/ui/more.js: 防守紀錄列 title（挑戰者・勝敗・榮譽）
- index.html: 快取 485→486；js/data/changelog.js: v476 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v476-deflog-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 197 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v475（2026-08-15）

### [v475] 改動: 深淵全部領取鈕 hover 提示
理由: 批量領取缺語意。
實作:
- js/ui/more.js: 深淵里程碑全部領取鈕 title
- index.html: 快取 484→485；js/data/changelog.js: v475 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v475-abyssclaim-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 196 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v474（2026-08-15）

### [v474] 改動: 圖鑑全部領取鈕 hover 提示
理由: 批量領取缺語意。
實作:
- js/ui/more.js: 全部領取鈕 title
- index.html: 快取 483→484；js/data/changelog.js: v474 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v474-claimall-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 195 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v473（2026-08-15）

### [v473] 改動: 底部導航 hover 提示
理由: 導航 tab 缺用途說明。
實作:
- js/ui/screens.js: 6 tab title（用途說明）
- index.html: 快取 482→483；js/data/changelog.js: v473 條目
驗證:
- 6 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v473-nav-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 194 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v472（2026-08-15）

### [v472] 改動: 頂欄按鈕 hover 提示
理由: 頂欄按鈕缺用途說明。
實作:
- js/ui/screens.js: 地圖/設定鈕 title
- index.html: 快取 481→482；js/data/changelog.js: v472 條目
驗證:
- 兩 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v472-topbar-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 193 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v471（2026-08-15）

### [v471] 改動: 招募分頁 hover 提示
理由: 招募 tab 缺星級/費用說明。
實作:
- js/ui/hunters.js: 三 tab title（星級範圍・費用・冷卻）
- index.html: 快取 480→481；js/data/changelog.js: v471 條目
驗證:
- tab title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v471-recruittab-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 192 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v470（2026-08-15）

### [v470] 改動: 教學視窗 hover 提示
理由: 教學卡缺步驟進度。
實作:
- js/ui/tutorial.js: 教學卡 title（步驟進度・略過提示）
- index.html: 快取 479→480；js/data/changelog.js: v470 條目
驗證:
- 1/7 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v470-tutorial-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 191 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v469（2026-08-15）

### [v469] 改動: 回歸獎勵視窗 hover 提示
理由: 回歸機制語意不明。
實作:
- js/main.js: 回歸獎勵視窗 title（72 小時觸發・分檔禮包）
- index.html: 快取 478→479；js/data/changelog.js: v469 條目
驗證:
- 源碼確認（視窗僅回歸時顯示）；完整迴歸通過；rm 靜態；零 console error
- progress/v469-return-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 190 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v468（2026-08-15）

### [v468] 改動: 離線獎勵視窗 hover 提示
理由: 離線結算語意不明。
實作:
- js/main.js: 離線獎勵視窗 title（上限・累積規則・同步結算）
- index.html: 快取 477→478；js/data/changelog.js: v468 條目
驗證:
- 源碼確認（視窗僅啟動時顯示）；完整迴歸通過；rm 靜態；零 console error
- progress/v468-offlinemodal-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 189 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v467（2026-08-15）

### [v467] 改動: 圖鑑收集標題 hover 提示
理由: 收集結構不可見。
實作:
- js/ui/more.js: 裝備收集標題 title（7 部位 ×10 階級・取得方式）
- index.html: 快取 476→477；js/data/changelog.js: v467 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v467-collect-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 188 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v466（2026-08-15）

### [v466] 改動: 簽到頭部 hover 提示
理由: 簽到週期/漏簽規則不可見。
實作:
- js/ui/more.js: 月進度條 title（30 天週期・漏簽規則）
- index.html: 快取 475→476；js/data/changelog.js: v466 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v466-checkinhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 187 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v465（2026-08-15）

### [v465] 改動: 七日豪禮頭部 hover 提示
理由: 豪禮機制缺總覽。
實作:
- js/ui/more.js: 豪禮頭部 title（任務鏈・最終傳說獎勵）
- index.html: 快取 474→475；js/data/changelog.js: v465 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v465-welcomehead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 186 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v464（2026-08-15）

### [v464] 改動: 商城列表標題 hover 提示
理由: 商城標題缺消費語意。
實作:
- js/ui/more.js: renderShopList 標題列 title（鑽石・週限・機率）
- index.html: 快取 473→474；js/data/changelog.js: v464 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v464-shophead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 185 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v463（2026-08-15）

### [v463] 改動: 市場頭部 hover 提示
理由: 每日特惠缺語意。
實作:
- js/ui/more.js: 每日特惠標題 title（刷新・動態價）
- index.html: 快取 471→472；js/data/changelog.js: v463 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v463-markethead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 184 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v462（2026-08-15）

### [v462] 改動: 深淵商店頭部 hover 提示
理由: 碎片經濟缺語意。
實作:
- js/ui/more.js: 碎片持有列 title（兌換機制・深度解鎖門檻）
- index.html: 快取 470→471；js/data/changelog.js: v462 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v462-abysshophead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 183 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v461（2026-08-15）

### [v461] 改動: 試煉秘境頭部 hover 提示
理由: 秘境規則缺總覽。
實作:
- js/ui/more.js: 秘境頭部 title（3 種副本・次數・安慰獎）
- index.html: 快取 469→470；js/data/changelog.js: v461 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v461-dungeonhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 182 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v460（2026-08-15）

### [v460] 改動: 遠征頭部 hover 提示
理由: 遠征規則缺進場說明。
實作:
- js/ui/more.js: 遠征說明列 title（委託機制・自動發放・召回 50%）
- index.html: 快取 468→469；js/data/changelog.js: v460 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v460-expedhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 181 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v459（2026-08-15）

### [v459] 改動: 公會頭部 hover 提示
理由: 公會頭部缺升級價值說明。
實作:
- js/ui/more.js: 公會頭部 title（等級價值・捐獻/盛宴節奏）
- index.html: 快取 467→468；js/data/changelog.js: v459 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v459-guildhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 180 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v458（2026-08-15）

### [v458] 改動: 世界首領頭部 hover 提示
理由: 首領列缺規則總覽。
實作:
- js/ui/more.js: 首領列 title（每日次數・傷害累積・獎勵）
- index.html: 快取 466→467；js/data/changelog.js: v458 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v458-wbhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 179 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v457（2026-08-15）

### [v457] 改動: 王者頭部 hover 提示
理由: 王者說明缺機制總覽。
實作:
- js/ui/more.js: 王者說明列 title（三隊制・結算・置換石來源）
- index.html: 快取 465→466；js/data/changelog.js: v457 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v457-royalhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 178 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v456（2026-08-15）

### [v456] 改動: 競技場頭部 hover 提示
理由: 名次列缺規則總覽。
實作:
- js/ui/more.js: 名次列 title（升降規則・次數・結算）
- index.html: 快取 464→465；js/data/changelog.js: v456 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v456-arenahead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 177 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v455（2026-08-15）

### [v455] 改動: 活動頭部 hover 提示
理由: 活動頭部缺點數來源說明。
實作:
- js/ui/more.js: 活動頭部 title（點數取得・週一重置・商店提醒）
- index.html: 快取 463→464；js/data/changelog.js: v455 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v455-eventhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 176 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v454（2026-08-15）

### [v454] 改動: 榮譽商店頭部 hover 提示
理由: 持有榮譽列缺來源說明。
實作:
- js/ui/more.js: 持有榮譽列 title（來源清單・週一重置）
- index.html: 快取 462→463；js/data/changelog.js: v454 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v454-honorhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 175 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v453（2026-08-15）

### [v453] 改動: 更新歷史列 hover 提示
理由: 版本列缺展開提示。
實作:
- js/ui/more.js: 版本列 title（版本號＋標題＋展開提示）
- index.html: 快取 461→462；js/data/changelog.js: v453 條目
驗證:
- 20 列 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v453-changelog-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 174 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v452（2026-08-15）

### [v452] 改動: 圖鑑搜尋框 hover 提示
理由: 搜尋功能不可發現。
實作:
- js/ui/more.js: 搜尋框 title（即時過濾說明）
- index.html: 快取 460→461；js/data/changelog.js: v452 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v452-codexsearch-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 173 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v451（2026-08-15）

### [v451] 改動: 主線任務列 hover 提示
理由: 主線列缺狀態/獎勵總覽。
實作:
- js/ui/more.js: 主線任務列 title（狀態・獎勵）
- index.html: 快取 459→460；js/data/changelog.js: v451 條目
驗證:
- 5 列 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v451-mainquest-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 172 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v450（2026-08-15）

### [v450] 改動: 任務分頁/頭部 hover 提示
理由: 任務週期語意不明。
實作:
- js/ui/more.js: 任務 tabs title（主線/每日/每週週期）＋主線頭部 title
- index.html: 快取 458→459；js/data/changelog.js: v450 條目
驗證:
- 3 tab＋頭部 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v450-questhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 171 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v449（2026-08-15）

### [v449] 改動: 成就頭部 hover 提示
理由: 成就頭部缺機制/狀態總覽。
實作:
- js/ui/more.js: 成就頭部 title（獎勵機制・達成/可領狀態）
- index.html: 快取 457→458；js/data/changelog.js: v449 條目
驗證:
- title 正確（0/45・可領 16）；完整迴歸通過；rm 靜態；零 console error
- progress/v449-achhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 170 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v448（2026-08-15）

### [v448] 改動: 圖鑑完成度頭部 hover 提示
理由: 完成度構成不可見。
實作:
- js/ui/more.js: 完成度頭部 title（計算構成說明）
- index.html: 快取 456→457；js/data/changelog.js: v448 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v448-codexhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 169 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v447（2026-08-15）

### [v447] 改動: 碎片合成 hover 提示
理由: 合成列缺消耗/週限總覽。
實作:
- js/ui/hunters.js: 合成列 title（消耗・週限・狀態）＋職業 chip title
- index.html: 快取 455→456；js/data/changelog.js: v447 條目
驗證:
- 2 列 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v447-synth-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 168 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v446（2026-08-15）

### [v446] 改動: 招募 FAB hover 提示
理由: FAB 缺冷卻規則說明。
實作:
- js/ui/hunters.js: 招募 FAB title（金幣 5 分鐘冷卻・券/鑽石無冷卻）
- index.html: 快取 454→455；js/data/changelog.js: v446 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v446-fab-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 167 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v445（2026-08-15）

### [v445] 改動: 招募結果統計列 hover 提示
理由: 統計列缺語意說明。
實作:
- js/ui/hunters.js: 統計列 title（★6/傳說/保底/重複碎片）
- index.html: 快取 453→454；js/data/changelog.js: v445 條目
驗證:
- title 正確（含保底 ×1）；完整迴歸通過；rm 靜態；零 console error
- progress/v445-recruitsum-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 166 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v444（2026-08-15）

### [v444] 改動: 裝備通知規則 hover 提示
理由: 規則 chips 缺語意。
實作:
- js/ui/more.js: 規則 chips title（勾選/未勾選語意）
- index.html: 快取 452→453；js/data/changelog.js: v444 條目
驗證:
- 20 chip title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v444-notifyrule-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 165 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v443（2026-08-15）

### [v443] 改動: 存檔管理列 hover 提示
理由: 存檔操作缺語意說明。
實作:
- js/ui/more.js: 下載/匯入列 title（備份換機・覆蓋警示）
- index.html: 快取 451→452；js/data/changelog.js: v443 條目
驗證:
- 兩 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v443-save-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 164 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v442（2026-08-15）

### [v442] 改動: 自動喝水 hover 提示
理由: 喝水設定缺觸發規則。
實作:
- js/ui/more.js: 自動喝水列＋閾值 chips title（觸發・切換說明）
- index.html: 快取 450→451；js/data/changelog.js: v442 條目
驗證:
- 2 行＋8 chip title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v442-autopot-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 163 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v441（2026-08-15）

### [v441] 改動: 通知列 hover 提示
理由: 通知開關缺規則說明。
實作:
- js/ui/more.js: 4 通知列 title（藥水/裝備/寶石/技能書）
- index.html: 快取 449→450；js/data/changelog.js: v441 條目
驗證:
- 4 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v441-notify-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 162 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v440（2026-08-15）

### [v440] 改動: 遠征欄位 hover 提示
理由: 遠征欄位缺狀態/效率說明。
實作:
- js/ui/more.js: 遠征欄位卡 title（自動完成時點・效率・召回 50%）
- index.html: 快取 448→449；js/data/changelog.js: v440 條目
驗證:
- 源碼確認（欄位依賴派遣中狀態）；完整迴歸通過；rm 靜態；零 console error
- progress/v440-expedslot-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 161 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v439（2026-08-15）

### [v439] 改動: 迷宮節點操作列 hover 提示
理由: 節點列缺類型規則。
實作:
- js/ui/more.js: 節點列 title（戰鬥勝率/寶箱/事件增益・無懲罰）
- index.html: 快取 447→448；js/data/changelog.js: v439 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v439-mazenode-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 160 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v438（2026-08-15）

### [v438] 改動: 迷宮路線選擇 hover 提示
理由: 路線鈕缺序列說明。
實作:
- js/ui/more.js: 路線鈕 title（節點序列・不可更改）
- index.html: 快取 446→447；js/data/changelog.js: v438 條目
驗證:
- 3 路線 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v438-mazeroute-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 159 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v437（2026-08-15）

### [v437] 改動: 迷宮里程碑 hover 提示
理由: 里程碑缺獎勵明細。
實作:
- js/ui/more.js: 里程碑 chip title（獎勵・狀態・差距）
- index.html: 快取 445→446；js/data/changelog.js: v437 條目
驗證:
- 4 chip title 正確（節點 3：虛空碎片 ×10・書 ×2・T3 ×1）；完整迴歸通過；rm 靜態；零 console error
- progress/v437-mazems-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 158 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v436（2026-08-15）

### [v436] 改動: 試煉自動挑戰 hover 提示
理由: 自動挑戰鈕缺規則說明。
實作:
- js/ui/more.js: 自動挑戰鈕 title（至卡關・首敗即停・無懲罰）
- index.html: 快取 444→445；js/data/changelog.js: v436 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v436-towerauto-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 157 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v435（2026-08-15）

### [v435] 改動: 元素試煉頭部 hover 提示
理由: 試煉規則缺總覽。
實作:
- js/ui/more.js: 試煉頭部 title（15 層・剋制 ×1.5・無限重試）
- index.html: 快取 443→444；js/data/changelog.js: v435 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v435-towerhead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 156 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v434（2026-08-15）

### [v434] 改動: 深淵建議戰力 hover 提示
理由: 建議戰力缺狀態意義。
實作:
- js/ui/more.js: 建議戰力列 title（戰力比・三色狀態）
- index.html: 快取 442→443；js/data/changelog.js: v434 條目
驗證:
- 266% title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v434-abyssrec-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 155 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v433（2026-08-15）

### [v433] 改動: 深淵頭部列 hover 提示
理由: 深淵機制缺總覽。
實作:
- js/ui/more.js: 深淵頭部 title（無限層・獎勵成長・領主・跨週保留）
- index.html: 快取 441→442；js/data/changelog.js: v433 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v433-abysshead-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 154 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v432（2026-08-15）

### [v432] 改動: 王者挑戰/一鍵 hover 提示
理由: 挑戰鈕缺規則說明。
實作:
- js/ui/more.js: 挑戰幻影＋一鍵挑戰鈕 title（三隊制・次數・匯總）
- index.html: 快取 440→441；js/data/changelog.js: v432 條目
驗證:
- 兩 title 正確（每日 5 次）；完整迴歸通過；rm 靜態；零 console error
- progress/v432-royalchall-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 153 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v431（2026-08-15）

### [v431] 改動: 王者隊選擇 hover 提示
理由: 隊 chips 缺三隊制說明。
實作:
- js/ui/more.js: 王者隊 chips title（選取/取消・三隊制・解鎖條件）
- index.html: 快取 439→440；js/data/changelog.js: v431 條目
驗證:
- 5 chip title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v431-royalteam-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 152 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v430（2026-08-15）

### [v430] 改動: 王者分檔進度 hover 提示
理由: 分檔加成不可見。
實作:
- js/ui/more.js: 分檔列 title（3/9/15 勝場加成・結算規則）
- index.html: 快取 438→439；js/data/changelog.js: v430 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v430-royal-tier.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 151 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v429（2026-08-15）

### [v429] 改動: 週討伐里程碑 hover 提示
理由: 週討伐缺進度/差距總覽。
實作:
- js/ui/more.js: 週討伐列 title（本週進度・獎勵・領取狀態）
- index.html: 快取 437→438；js/data/changelog.js: v429 條目
驗證:
- 3 里程碑 title 正確（本週出戰 0/7 場 — 20 鑽石）；完整迴歸通過；rm 靜態；零 console error
- progress/v429-wkms-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 150 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v428（2026-08-15）

### [v428] 改動: 世界首領出戰鈕 hover 提示
理由: 出戰鈕缺規則說明。
實作:
- js/ui/more.js: 出戰鈕 title（傷害規則・每日次數・自動領獎）
- index.html: 快取 436→437；js/data/changelog.js: v428 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v428-wbatk-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 149 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v427（2026-08-15）

### [v427] 改動: 世界首領一鍵出戰 hover 提示
理由: 一鍵出戰鈕缺規則說明。
實作:
- js/ui/more.js: 一鍵出戰鈕 title（剩餘次數・重置・累積規則）
- index.html: 快取 435→436；js/data/changelog.js: v427 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v427-wbone-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 148 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v426（2026-08-15）

### [v426] 改動: 公會捐獻鈕 hover 提示
理由: 捐獻鈕缺額度說明。
實作:
- js/ui/more.js: 批量捐獻鈕 title（每日額度・重置・公會等級價值）
- index.html: 快取 434→435；js/data/changelog.js: v426 條目
驗證:
- title 正確（每日 3 次）；完整迴歸通過；rm 靜態；零 console error
- progress/v426-donate-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 147 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v425（2026-08-15）

### [v425] 改動: 公會首領出戰鈕 hover 提示
理由: 出戰鈕缺規則說明。
實作:
- js/ui/more.js: 公會首領出戰鈕 title（傷害規則・自動領獎・擊殺大獎）
- index.html: 快取 433→434；js/data/changelog.js: v425 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v425-gboss-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 146 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v424（2026-08-15）

### [v424] 改動: 競技場掃蕩鈕 hover 提示
理由: 掃蕩鈕缺規則說明。
實作:
- js/ui/more.js: 掃蕩鈕 title（勝率優先・獎勵照常）
- index.html: 快取 432→433；js/data/changelog.js: v424 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v424-sweep-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 145 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v423（2026-08-15）

### [v423] 改動: 競技場結算預估列 hover 提示
理由: 結算公式不可見。
實作:
- js/ui/more.js: 結算列 title（最佳名次＋勝場・封頂）
- index.html: 快取 431→432；js/data/changelog.js: v423 條目
驗證:
- title 正確（封頂 15 鑽）；完整迴歸通過；rm 靜態；零 console error
- progress/v423-settle-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 144 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v422（2026-08-15）

### [v422] 改動: 競技場防守列 hover 提示
理由: 防守機制不可見。
實作:
- js/ui/more.js: 防守編隊列 title（離線幻影・擊退榮譽）
- index.html: 快取 430→431；js/data/changelog.js: v422 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v422-defend-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 143 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v421（2026-08-15）

### [v421] 改動: 活動里程碑 hover 提示
理由: 活動里程碑缺差距/獎勵總覽。
實作:
- js/ui/more.js: 活動里程碑 title（目標・目前・差距・獎勵・領取狀態）
- index.html: 快取 429→430；js/data/changelog.js: v421 條目
驗證:
- 4 里程碑 title 正確（達 30 點（目前 200）可領取）；完整迴歸通過；rm 靜態；零 console error
- progress/v421-evtms-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 142 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v420（2026-08-15）

### [v420] 改動: 深淵魔物列 hover 提示
理由: 深淵戰況缺層級語意。
實作:
- js/ui/more.js: 深淵戰況列 title（領主/普通層・推進規則）
- index.html: 快取 428→429；js/data/changelog.js: v420 條目
驗證:
- 源碼確認（戰況依賴 battle 內部狀態）；完整迴歸通過；rm 靜態；零 console error
- progress/v420-abyssmon-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 141 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v419（2026-08-15）

### [v419] 改動: 王國名稱 hover＋更名深鏈
理由: 更名入口僅商城內。
實作:
- js/ui/kingdom.js: 王國名稱 title＋點擊直開更名視窗（openRenameDialog 深鏈）
- index.html: 快取 427→428；js/data/changelog.js: v419 條目
驗證:
- 更名 modal 開啟正確（持有券 x2）；完整迴歸通過；rm 靜態；零 console error
- progress/v419-rename-tip.webp
風險與回滾點: 純 title＋深鏈。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 140 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v418（2026-08-15）

### [v418] 改動: 重塑/置換鈕 hover 提示
理由: 救贖機制鈕缺說明。
實作:
- js/ui/hunters.js: 重塑鈕＋置換鈕 title（返還規則・交換規則）
- index.html: 快取 426→427；js/data/changelog.js: v418 條目
驗證:
- 兩 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v418-reset-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 139 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v417（2026-08-15）

### [v417] 改動: 突破鈕 hover 提示
理由: 突破機制不可見。
實作:
- js/ui/hunters.js: 突破鈕 title（+20% 全屬性・每 20 級・最多 5 階）
- index.html: 快取 425→426；js/data/changelog.js: v417 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v417-promote-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 138 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v416（2026-08-15）

### [v416] 改動: 技能全部升級 hover 提示
理由: 批量鈕缺規則說明。
實作:
- js/ui/hunters.js: 全部升級鈕 title（升到滿級或書盡）
- index.html: 快取 424→425；js/data/changelog.js: v416 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v416-skillbulk-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 137 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v415（2026-08-15）

### [v415] 改動: 技能書列 hover 提示
理由: 技能書缺來源/消耗說明。
實作:
- js/ui/hunters.js: 技能書列 title（來源・消耗規則）
- index.html: 快取 423→424；js/data/changelog.js: v415 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v415-book-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 136 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v414（2026-08-15）

### [v414] 改動: 傳說羈絆行 hover 提示
理由: 羈絆行缺組合/進度總覽。
實作:
- js/ui/hunters.js: 羈絆行 title（所需傳說・目前進度・生效狀態）
- index.html: 快取 422→423；js/data/changelog.js: v414 條目
驗證:
- 晨曦與壁壘 title 正確（目前 1/2 尚未湊齊）；完整迴歸通過；rm 靜態；零 console error
- progress/v414-bond-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 135 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v413（2026-08-15）

### [v413] 改動: 傳說徽章行 hover 提示
理由: 徽章行缺效果/碎片說明。
實作:
- js/ui/hunters.js: 徽章行 title（效果・成長倍率・碎片來源）
- index.html: 快取 421→422；js/data/changelog.js: v413 條目
驗證:
- 晨星徽章 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v413-badge-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 134 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v412（2026-08-15）

### [v412] 改動: 神器列 hover 提示
理由: 神器列缺被動/倍率總覽。
實作:
- js/ui/hunters.js: 神器列 title（名稱・等級・被動・倍率；空槽顯示取得方式）
- index.html: 快取 420→421；js/data/changelog.js: v412 條目
驗證:
- 龍鱗護符 title 正確（Lv 1/10 — 龍鱗：生命 +15%）；完整迴歸通過；rm 靜態；零 console error
- progress/v412-art-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 133 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v411（2026-08-15）

### [v411] 改動: 套裝效果行 hover 提示
理由: 套裝行缺加成明細。
實作:
- js/ui/hunters.js: 套裝行 title（2/4 件加成・目前件數・啟動狀態）
- index.html: 快取 419→420；js/data/changelog.js: v411 條目
驗證:
- 3 行 title 正確（熔岩套裝 2 件「攻擊力 +20%」4 件「攻擊速度 +15%」）；完整迴歸通過；rm 靜態；零 console error
- progress/v411-set-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 132 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v410（2026-08-15）

### [v410] 改動: 英雄裝備槽 hover 提示
理由: 裝備槽缺裝備資訊總覽。
實作:
- js/ui/hunters.js: 裝備槽 title（已裝備＝星級/名稱/強化；空槽＝操作說明）
- index.html: 快取 418→419；js/data/changelog.js: v410 條目
驗證:
- 7 槽 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v410-gear-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 131 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v409（2026-08-15）

### [v409] 改動: 英雄屬性格 hover 提示
理由: 屬性格缺機制說明。
實作:
- js/ui/hunters.js: 六屬性格 title（攻擊/防禦/生命/魔力/攻速/暴擊機制）
- index.html: 快取 417→418；js/data/changelog.js: v409 條目
驗證:
- 屬性格 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v409-stat-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 130 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v408（2026-08-15）

### [v408] 改動: 招募結果卡 hover 提示
理由: 十連結果卡缺星級/戰力總覽。
實作:
- js/ui/hunters.js: 結果卡 title（名稱・星級・職業・等級・戰力・保底/傳說/重複標記）
- index.html: 快取 416→417；js/data/changelog.js: v408 條目
驗證:
- 10 卡 title 正確（唐追風 ★2 高級（劍士・Lv1・戰力 145））；完整迴歸通過；rm 靜態；零 console error
- progress/v408-recruit-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 129 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v407（2026-08-15）

### [v407] 改動: 關卡情報鈕 hover 補強
理由: ⓘ 鈕 title 過簡。
實作:
- js/ui/hunt.js: ⓘ 鈕 title 列明情報內容（戰利品/掉落率/BOSS 機制/魔物）
- index.html: 快取 415→416；js/data/changelog.js: v407 條目
驗證:
- info＋speed title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v407-infofab-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 128 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v406（2026-08-15）

### [v406] 改動: 補滿 HP/MP 鈕 hover 提示
理由: 補滿鈕缺效果說明。
實作:
- js/ui/hunt.js: 生命/魔力補滿鈕 title（50% 恢復）
- index.html: 快取 414→415；js/data/changelog.js: v406 條目
驗證:
- 兩 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v406-refill-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 127 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v405（2026-08-15）

### [v405] 改動: 批量啟用靈藥 hover 提示
理由: 全部啟用鈕缺批量規則。
實作:
- js/ui/hunt.js: 全部啟用鈕 title（三種批量・時間疊加・缺貨跳過）
- index.html: 快取 413→414；js/data/changelog.js: v405 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v405-bulkpot-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 126 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v404（2026-08-15）

### [v404] 改動: 英雄圖鑑 hover 提示
理由: 職業收集缺加成說明。
實作:
- js/ui/more.js: 職業收集列 title（累計獲得・永久攻擊加成・里程碑規則）
- index.html: 快取 412→413；js/data/changelog.js: v404 條目
驗證:
- 6 職業 title 正確（劍士 — 累計獲得 1 位・全體劍士攻擊 +1%）；完整迴歸通過；rm 靜態；零 console error
- progress/v404-herocodex-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 125 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v403（2026-08-15）

### [v403] 改動: 圖鑑完成度里程碑 hover
理由: 完成度里程碑缺進度/獎勵總覽。
實作:
- js/ui/more.js: 完成度里程碑 title（目前完成度・效果・獎勵・領取狀態）
- index.html: 快取 411→412；js/data/changelog.js: v403 條目
驗證:
- 25% 里程碑 title 正確（目前 29%・可領取）；完整迴歸通過；rm 靜態；零 console error
- progress/v403-totalms-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 124 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v402（2026-08-15）

### [v402] 改動: 深淵行動列 hover 提示
理由: 深淵行動鈕缺規則說明。
實作:
- js/ui/more.js: 踏入深淵＋踏入並連續挑戰鈕 title
- index.html: 快取 410→411；js/data/changelog.js: v402 條目
驗證:
- 兩 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v402-abyssact-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 123 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v401（2026-08-15）

### [v401] 改動: 圖鑑里程碑獎勵 hover
理由: 里程碑缺獎勵明細。
實作:
- js/ui/more.js: 里程碑鈕 title 加獎勵（金/鑽石/招募券）
- index.html: 快取 409→410；js/data/changelog.js: v401 條目
驗證:
- 248 鈕 title 正確（討伐 10 隻 — 獎勵：500 金）；完整迴歸通過；rm 靜態；零 console error
- progress/v401-msreward-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 122 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v400（2026-08-15）

### [v400] 改動: 心願職業 hover 提示
理由: 心願機制不可見。
實作:
- js/ui/hunters.js: 心願 chips title（×2 出現率・啟用/取消狀態）
- index.html: 快取 408→409；js/data/changelog.js: v400 條目
驗證:
- 6 chip title 正確（1 啟用）；完整迴歸通過；rm 靜態；零 console error
- progress/v400-wish-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 121 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v399（2026-08-15）

### [v399] 改動: 出戰隊列 hover 提示
理由: 出戰隊缺狀態/解鎖總覽。
實作:
- js/ui/hunt.js: 出戰隊 title（人數・戰力・目前出戰・解鎖條件）
- index.html: 快取 407→408；js/data/changelog.js: v399 條目
驗證:
- 5 隊 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v399-team-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 120 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v398（2026-08-15）

### [v398] 改動: 派遣狀態列 hover 提示
理由: 狀態列缺自動開關/掛機說明。
實作:
- js/ui/hunt.js: 狀態列 title（自動續戰/進關狀態・休息行為・掛機說明三分支）
- index.html: 快取 406→407；js/data/changelog.js: v398 條目
驗證:
- 待機＋派遣中 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v398-status-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 119 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v397（2026-08-15）

### [v397] 改動: 派遣戰利品預覽 hover 提示
理由: 戰利品預覽缺倍率說明。
實作:
- js/ui/hunt.js: 戰利品預覽 title（難度倍率・建築加成・精英 3 倍）
- index.html: 快取 405→406；js/data/changelog.js: v397 條目
驗證:
- ×1.8 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v397-preview-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 118 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v396（2026-08-15）

### [v396] 改動: 王國經驗條 hover 提示
理由: 經驗條缺升級獎勵說明。
實作:
- js/ui/kingdom.js: 王國經驗條 title（升級獎勵＋來源）
- index.html: 快取 404→405；js/data/changelog.js: v396 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v396-exp-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 117 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v395（2026-08-15）

### [v395] 改動: 批量投餵/遠征 hover 提示
理由: 批量鈕規則不可見。
實作:
- js/ui/hunters.js: 全部投餵＋批量遠征 title（規則說明）
- index.html: 快取 403→404；js/data/changelog.js: v395 條目
驗證:
- 兩 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v395-bulk-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 116 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v394（2026-08-15）

### [v394] 改動: 自動編隊/穿裝 hover 提示
理由: 自動鈕規則不可見。
實作:
- js/ui/hunters.js: 自動編隊＋自動穿裝 title（規則說明）
- index.html: 快取 402→403；js/data/changelog.js: v394 條目
驗證:
- 兩 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v394-autoteam-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 115 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v393（2026-08-15）

### [v393] 改動: 共鳴槽 hover 提示
理由: 共鳴槽機制不可見。
實作:
- js/ui/hunters.js: 共鳴槽 title（已入槽＝基準同步等級＋點擊移出；空槽＝填入規則）
- index.html: 快取 401→402；js/data/changelog.js: v393 條目
驗證:
- 入槽（基準 Lv1）＋空槽 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v393-resonance-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 114 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v392（2026-08-15）

### [v392] 改動: 小地圖 hover 提示
理由: minimap 圖例不可見。
實作:
- js/ui/map.js: minimap canvas title（點色圖例＋點擊跳轉）
- index.html: 快取 400→401；js/data/changelog.js: v392 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v392-minimap-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 113 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v391（2026-08-15）

### [v391] 改動: 地圖探索度 hover 提示
理由: 探索度缺解鎖條件說明。
實作:
- js/ui/map.js: 探索度 title（討伐 BOSS 解鎖下一區・深淵入口）
- index.html: 快取 399→400；js/data/changelog.js: v391 條目
驗證:
- 探索 5/10 區 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v391-explore-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 112 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v390（2026-08-15）

### [v390] 改動: 獵頁收益列 hover 提示
理由: 收益列缺組成說明。
實作:
- js/ui/hunt.js: 每擊殺收益 title（難度倍率・建築加成・精英 3 倍）
- index.html: 快取 398→399；js/data/changelog.js: v390 條目
驗證:
- 困難 ×1.8 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v390-reward-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 111 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v389（2026-08-15）

### [v389] 改動: 戰力門檻列 hover 提示
理由: 戰力比缺狀態意義說明。
實作:
- js/ui/hunt.js: 戰力比 title（比例・三色狀態意義）
- index.html: 快取 397→398；js/data/changelog.js: v389 條目
驗證:
- title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v389-power-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 110 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v388（2026-08-15）

### [v388] 改動: 圖鑑素材發現格
理由: 素材發現僅計數無可視格。
實作:
- js/ui/more.js: 素材發現 9 格（圖示＋名稱＋發現狀態），title 附來源
- index.html: 快取 396→397；js/data/changelog.js: v388 條目
驗證:
- 9 格 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v388-codexmats.webp
風險與回滾點: 新增 DOM 格（純視覺）。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 109 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v387（2026-08-15）

### [v387] 改動: 商城課金裝備 hover 提示
理由: 課金裝備鈕缺部位/機率說明。
實作:
- js/ui/more.js: 購買隨機裝備鈕 title（階級・部位・稀有度機率）
- index.html: 快取 395→396；js/data/changelog.js: v387 條目
驗證:
- T5 隨機部位 title 正確（含三目優先序修正）；完整迴歸通過；rm 靜態；零 console error
- progress/v387-shop-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 108 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v386（2026-08-15）

### [v386] 改動: 村莊市場 hover 提示
理由: 市場列缺限購/狀態。
實作:
- js/ui/more.js: 特惠＋週限兌換列 title（價格・限購・售罄/可購/金幣不足）
- index.html: 快取 393→394；js/data/changelog.js: v386 條目
驗證:
- 9 列 title 正確（智慧靈藥（8.49萬 金・限購 1 次）— 可購買）；完整迴歸通過；rm 靜態；零 console error
- progress/v386-market-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 107 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v385（2026-08-15）

### [v385] 改動: 王國建築橫幅 hover 提示
理由: 建築橫幅缺效果總覽。
實作:
- js/ui/kingdom.js: 建築 chip title（名稱・等級・當前效果）
- index.html: 快取 392→393；js/data/changelog.js: v385 條目
驗證:
- 10 chip title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v385-banner-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 106 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v384（2026-08-15）

### [v384] 改動: 王國概覽卡 hover 提示
理由: 概覽卡語意不明。
實作:
- js/ui/kingdom.js: mkCard 四卡 title 說明（勢力/副本/生產/圖鑑）
- index.html: 快取 391→392；js/data/changelog.js: v384 條目
驗證:
- 卡 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v384-overview-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 105 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v383（2026-08-15）

### [v383] 改動: 王國資源總覽 hover 提示
理由: 資源格缺取得來源。
實作:
- js/ui/kingdom.js: 5 資源格 title 附來源清單
- index.html: 快取 390→391；js/data/changelog.js: v383 條目
驗證:
- 5 格 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v383-res-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 104 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v382（2026-08-15）

### [v382] 改動: 區域名牌野生彩蛋提示
理由: 野生彩蛋互動不可見。
實作:
- js/ui/map.js: 區域名牌 title 附「地標旁野生魔物可點擊收服賞金（60 秒冷卻）」
- index.html: 快取 389→390；js/data/changelog.js: v382 條目
驗證:
- 5 區含提示；完整迴歸通過；rm 靜態；零 console error
- progress/v382-wild-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 103 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v381（2026-08-15）

### [v381] 改動: 區域名牌每日寶箱提示
理由: 每日寶箱位置難找。
實作:
- js/ui/map.js: 寶箱所在區名牌 title 附「🎁 今日寶箱在此！」（開啟後消失）
- index.html: 快取 388→389；js/data/changelog.js: v381 條目
驗證:
- 未開 1 標記（灰燼洞穴）、開啟後消失；完整迴歸通過；rm 靜態；零 console error
- progress/v381-chest-tag.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 102 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v380（2026-08-15）

### [v380] 改動: 道具製作列 hover 提示
理由: 道具列缺效果/成本總覽。
實作:
- js/ui/more.js: 道具製作列 title（持有・成本・效果）
- index.html: 快取 387→388；js/data/changelog.js: v380 條目
驗證:
- 6 列 title 正確（生命藥水（持有 x342）— 成本：200 金＋藥草 ×5。立即恢復全隊 50% 生命）；完整迴歸通過；rm 靜態；零 console error
- progress/v380-itemcraft-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 101 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v379（2026-08-15）

### [v379] 改動: 寶石工坊 hover 提示
理由: 寶石列缺鑲嵌效果總覽。
實作:
- js/ui/more.js: 寶石製作列 title（名稱・階級・效果・持有量・融合規則）
- index.html: 快取 386→387；js/data/changelog.js: v379 條目
驗證:
- 24 列 title 正確（藍寶石 T8：鑲嵌效果 防禦力 +18（持有 x8）…）；完整迴歸通過；rm 靜態；零 console error
- progress/v379-gemforge-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 100 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v378（2026-08-15）

### [v378] 改動: 王國素材列 hover 提示
理由: 素材列缺來源/用途。
實作:
- js/ui/kingdom.js: 素材列 title（名稱・階級・描述・來源・用途）
- index.html: 快取 385→386；js/data/changelog.js: v378 條目
驗證:
- 9 列 title 正確（鐵礦石（T9）— 來源：灰燼洞穴掉落…）；完整迴歸通過；rm 靜態；零 console error
- progress/v378-mat-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 99 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v377（2026-08-15）

### [v377] 改動: 靈藥快捷列 hover 提示
理由: 靈藥鈕缺效果說明。
實作:
- js/ui/hunt.js: 4 靈藥鈕 title（效果・時長・每日計次；數值對齊實際倍率 30%/50%/×2・沙漏 60 秒）
- index.html: 快取 384→385；js/data/changelog.js: v377 條目
驗證:
- 4 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v377-potion-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 98 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v376（2026-08-15）

### [v376] 改動: 關卡情報魔物列 hover 提示
理由: 情報視窗魔物缺元素/描述總覽。
實作:
- js/ui/hunt.js: 情報視窗魔物列 title（名稱・描述・區域・元素屬性）
- index.html: 快取 383→384；js/data/changelog.js: v376 條目
驗證:
- 5 列 title 正確（綠史萊姆 — 軟爛的綠色果凍…（翠綠草原・自然屬性））；完整迴歸通過；rm 靜態；零 console error
- progress/v376-regioninfo-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 97 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v375（2026-08-15）

### [v375] 改動: 離線收益預覽 hover 提示
理由: 離線預覽缺速率明細。
實作:
- js/ui/hunt.js: 離線預覽 title（速率・上限・休息剩餘・未派遣提醒三分支）
- index.html: 快取 382→383；js/data/changelog.js: v375 條目
驗證:
- 派遣（+92.6萬金/時明細）＋未派遣 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v375-offline-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 96 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v374（2026-08-15）

### [v374] 改動: 獵頁關卡標題 hover 提示
理由: 關卡標題缺情報入口提示。
實作:
- js/ui/hunt.js: 關卡標題 title（BOSS 關顯示 BOSS 名＋機制、普通關顯示情報入口）
- index.html: 快取 381→382；js/data/changelog.js: v374 條目
驗證:
- BOSS/普通關 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v374-stage-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 95 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v373（2026-08-15）

### [v373] 改動: 每日簽到格 hover 補強
理由: 簽到格缺獎勵明細。
實作:
- js/ui/more.js: 簽到格 title 加獎勵＋狀態（已領/今日可簽/錯過/未到期）
- index.html: 快取 380→381；js/data/changelog.js: v373 條目
驗證:
- 30 格 title 正確（第 30 天 · 滿月慶典 — 獎勵：150 鑽石、招募券 x2（未到期））；完整迴歸通過；rm 靜態；零 console error
- progress/v373-checkin-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 94 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v372（2026-08-15）

### [v372] 改動: 圖鑑里程碑 hover 提示
理由: 里程碑鈕缺目標/差距資訊。
實作:
- js/ui/more.js: 圖鑑里程碑鈕 title（擊殺目標・已領/可領/尚差 N 隻）
- index.html: 快取 379→380；js/data/changelog.js: v372 條目
驗證:
- 248 鈕 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v372-codexms-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 93 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v371（2026-08-15）

### [v371] 改動: 編隊選擇英雄列 hover 提示
理由: 編隊選擇缺戰力/克制總覽。
實作:
- js/ui/hunters.js: 選擇英雄列 title（名稱・職業・等級・戰力・克制標記）
- index.html: 快取 378→379；js/data/changelog.js: v371 條目
驗證:
- title 正確（T（劍士 Lv103 ・ 戰力 1.07萬））；完整迴歸通過；rm 靜態；零 console error
- progress/v371-team-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 92 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v370（2026-08-15）

### [v370] 改動: 英雄詳情技能列 hover 提示
理由: 技能列缺編排狀態總覽。
實作:
- js/ui/hunters.js: 技能列 title（名稱・等級・威力・效果・主/副/未編排）
- index.html: 快取 377→378；js/data/changelog.js: v370 條目
驗證:
- 3 技能 title 正確（蓄力猛擊（Lv 1/10）— …（主技 — 戰鬥自動施放））；完整迴歸通過；rm 靜態；零 console error
- progress/v370-skills-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 91 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v369（2026-08-15）

### [v369] 改動: 流浪英雄列 hover 提示
理由: 流浪列缺稀有度/職業總覽。
實作:
- js/ui/hunters.js: 流浪英雄列 title（名稱・稀有度・職業・等級・招募說明）
- index.html: 快取 376→377；js/data/changelog.js: v369 條目
驗證:
- 23 列 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v369-wanderer-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 90 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v368（2026-08-15）

### [v368] 改動: 招募機率列 hover 提示
理由: 招募機率列缺星級總覽。
實作:
- js/ui/hunters.js: 招募機率列 title（★N 名稱・出現率）
- index.html: 快取 375→376；js/data/changelog.js: v368 條目
驗證:
- 3 列 title 正確（★1 普通 出現率 60.0%）；完整迴歸通過；rm 靜態；零 console error
- progress/v368-recruit-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 89 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v367（2026-08-15）

### [v367] 改動: 設定開關 hover 提示
理由: 設定開關無說明。
實作:
- js/ui/more.js: toggle() 加 tip 參數；音效/音樂/減少動畫開關 title
- index.html: 快取 374→375；js/data/changelog.js: v367 條目
驗證:
- 3 title 正確；完整迴歸通過；rm 靜態；零 console error
- progress/v367-settings-tip.webp
風險與回滾點: 純 title 屬性。回滾: git revert 本輪 commit。
下一輪: 預定方向 — 已 88 輪: 持續四軸輪替。診斷時開地圖看小人行走＋打一場副本看特效。

## 前輪: v366（2026-08-15）

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
