# R204 v815 戰鬥畫面 — 取證

軌道：戰鬥畫面美術優化｜循環 52｜版本 v815

## 觀察
- 斬擊／箭矢／護盾技能已有基礎 mark（slash／arrow／shield），缺少可辨識的伴隨形狀標。
- 近期 v811（slam／gleam／vanquish）、v807（rally／goad／flurry）已佔用其他觸發點。

## FX 標記（≥3）
1. **cleavemark** — `fx_slash` 伴隨銀弧
2. **piercemark** — `fx_arrow` 伴隨金刺
3. **aegismark** — `fx_shield` 伴隨藍穹（英雄側）

## 驗證目標
ROI delta >20；src spawn；life-only；draw；rm 閘門
