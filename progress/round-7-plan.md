---
本輪選題:傷害浮字可讀性 — 同目標短窗合併累加＋分道錨點,解決同屏 14–16 個疊字淹沒 BOSS/英雄本體。

為何讓玩家玩更久:掛機遊戲玩家絕大部分在線時間就是盯著戰鬥畫面;「1 秒讀懂誰在打誰、輸出多少」是觀戰滿足感的第一要件。
現況同屏 16 個同字號多色浮字互相遮蔽、BOSS 被數字蓋住半個身子(證據原文:「被數字淹沒的紫色方塊」),
玩家辛苦堆出的大數字從「成就回饋」變成「雜訊」。合併成可讀的累加數字後,每秒總輸出一眼可辨、BOSS 本體重新成為焦點,
掛機觀戰從「糊一片」變「看得懂的輸出秀」— 直接延長掛機駐留。附帶解掉候選 4(擊殺回饋被蓋)的疊加主因。

證據援引:round-7-evidence.md 候選 1(證據強度:強) —
view 探針同幀 floats 峰值 16(實測序列 8/7/11/10/11/14/10/16);
截圖 progress/round7-arrow-dense.png(「左側主戰區幾乎失去可讀性」)、
progress/round7-boss-4x.png(「-1.23萬/-8787/-1.93萬 三組浮字直接蓋住 BOSS 軀幹下半部」)。
候選 3/4 的判讀均指認數字遮擋為放大因子。backlog 對應:P1 傷害數字可讀性(密集合併/大數字量級標示)未完成項。

方案:
- 檔案:
  - js/ui/hunt.js(spawnFloat/anim.floats — 合併與分道邏輯;本軌道演出掛鉤所有權內)
  - js/ui/render.js(drawBattle 浮字繪製段,約 L498-510 — 合併 pop 縮放與分道後繪製微調)
  - 收尾依軌道 prompt:js/data/changelog.js vN 條目、index.html ?v= +1
  - 禁止碰:js/sys/battle.js 數值路徑、任何戰鬥結果相關程式碼
- 設計(flash 照做即可):
  1. 合併(核心):浮字改攜帶原始數值 `val`(number),顯示文字於 spawn/merge 時用 MG.util.fmt 重算。
     spawnFloat 內部新增 merge 檢查:同 bucket 且 age < 0.25s(life > maxLife-0.25)→ 不新增,
     改為 `val += 新值、text 重算、life 重置為 maxLife、pop=1`(pop 供 render 做放大脈衝)。
     bucket key = 目標側 + 目標個體 + 種類色:怪物側 normal/crit/dot/mheal 各自獨立桶;
     英雄側以 e.hunter id + 種類(受擊紅/毒紫/治療綠)為桶。
     **crit 不合併**(暴擊要單獨跳的爽感,只參與分道);
     技能名/金幣/經驗/橫幅類文字浮字(無 val)不合併,維持原路徑。
     實作方式:在 anim 加 `floatMerge = {}`(key→float ref),float 死亡時順手清 key;查找 O(1),禁每幀掃描。
  2. 分道(次核心):不合併的新浮字以确定性 round-robin 計數器分配道位,禁 Math.random:
     - 怪物側(現全擠 x=320、y 185-225 蓋 BOSS 身體):錨點上移至血條上方帶 y≈150-170,
       三條水平道 x∈{296,320,344} round-robin;合併命中時沿用該浮字原道位。
     - 英雄側(hx, hy-26/-34/-6 等既有錨點不動 x):同 hero 多浮字時垂直道 offset ∈{0,-11,-22} round-robin。
     分道計數器掛 anim(screenT 推進,確定性),rm 路徑完全不變(spawnFloat 入口已 return)。
  3. 繪製(render.js):float 渲染加 pop 脈衝 — merge 瞬間 1→0.12s 內 font 大小 ×1.25 線性回落
     (big 17px→21px 暫態,normal 14px→17px 暫態),其餘繪製邏輯(透明度/描邊/vy)不動。
  4. 常數集中於 hunt.js 頂部註解區:MERGE_WINDOW=0.25、浮字上限 60 不動;
     預期效果:同幀浮字峰值 16 → ≤8(合併吃掉重複桶),BOSS 軀幹帶(y>180)浮字數歸零。
- 驗證門檻(最低可交付,依軌道 prompt 協議 a-f):
  a) node --check 全改動檔通過。
  b) 同場景前後對照:沿用取證設定(中後期 5 人隊 Lv70 rarity5、dev 拉桿 ×200、深淵 BOSS 關、
     唯讀 __view 探針同法重掛),斷言:同幀 floats 峰值 ≤8;BOSS 戰 4× 圖上 BOSS 軀幹無浮字疊壓;
     合併數值正確(連續 3 次同目標 hit 應顯示總和,可用探針讀 float.val)。
  c) 觸發路徑全跑:普攻 hit/crit、每職業技能(含 buff/heal 技能名字浮字)、mhit、毒 dot、mheal、
     擊殺金幣/經驗、精英/BOSS 宣告、滅團/再戰 — 各類浮字仍出現且顏色不串桶。
  d) rm 路徑截圖(靜態乾淨)、核心流程回歸(王國→副本→…→回城)、零 console error、
     無新增每幀大陣列掃描(floatMerge 為物件查找)。
  e) 截圖 ≥2 張存 progress/(命名含 vN):1× 密集戰鬥 + 4× BOSS 戰,並附與 round7-boss-4x.png 的並排對照。
  f) 視覺審美閘門:harness 影像工具(K3 vision)判讀 4× 圖 — 標準:BOSS 本體完整可見、
     左側浮字群可逐個讀清、合併 pop 不刺眼;不合格回改重跑。禁用 tools/vision-review.mjs。
- 風險與回滾:
  - 風險 1:串桶(如毒紫字併入普攻紅字)→ bucket key 含顏色/種類已防;驗證 c 逐路徑確認。
  - 風險 2:setTimeout 延後 spawn 的技能浮字落在 merge 窗外 → 僅少一次合併,不影響正確性。
  - 風險 3:分道後浮字壓到怪物血條/名字 → 錨點帶 y150-170 由 flash 實機微調 ±6px,以 4× 圖確認無疊印。
  - 回滾:單一 commit git revert 即還原;MERGE_WINDOW 設 0 可關閉合併保留分道,兩層可獨立退。
---
