# 放置遊戲發展速度設計 — 業界研究摘要

> 為 MEGA IDLE 數值平衡軌道提供的設計參考。每輪改動前必讀。

## 核心公式（Anthony Pecorella, Game Developer）

```
cost_next = cost_base × rate^owned          （指數成本）
production_total = (base × owned) × multipliers  （多項式收入）
```

- rate_growth ≈ 1.07（AdVenture Capitalist 標竿）
- 指數成本永遠壓過多項式收入 → 玩家最終會「追不上」
- **里程碑乘數**（25/50/100 個）暫時把收入推到成本前面 → 擺盪感
- 覺醒(prestige)重置但保留永久乘數 → 每次跑得更遠

## 回訪頻率設計（Eric Guan, Idle Game Design Principles）

| 玩家類型 | 回訪頻率 | 對應系統 |
|---|---|---|
| 活躍掛機 | 15-20分鐘 | 獵人經驗/金幣收集 |
| 每小時登入 | 1-5小時 | 建築升級/素材收集 |
| 每天登入 | 每天 | 覺醒/突破/套裝 |
| 週末玩家 | 每週 | 離線收益/長週期目標 |

**關鍵**：不同系統應有不同「最佳回報等待時間」，讓每種玩家都覺得「我的玩法被獎勵了」。

## 韋伯定律（心理物理學）

人腦感知是**指數尺度**：
- 5→6 顆豆子的差異（×1.2）明顯
- 100→101 顆豆子的差異（×1.01）無感
- 100→120 顆豆子（×1.2）才感覺到

→ 成長率應隨基數同步放大，否則後期「升級感覺沒用」→ 動機斷裂

## 業界基準（多源綜合）

| 指標 | 基準 | 來源 |
|---|---|---|
| D1 留存 | ≥40% | seeles.ai, apptrove |
| D7 留存 | ≥15% | seeles.ai, apptrove |
| D30 留存 | ≥5-8% | singular, countly |
| Session 長度 | 2-5 分鐘 | seeles.ai（放置遊戲） |
| 回訪模式 | 衰減：活躍→每小時→每天→每週 | Eric Guan |
| 90天留存 ≥8% | 持續投入 Live Ops | Singular |

## Prestige 設計（Game Developer Part III + Machinations）

- prestige 應在「快要無聊」或「快要卡牆」時觸發
- 理想時機：第1次在遊戲時間 30-50% 處（MEGA IDLE: 區域5-7, 約7-14天）
- 之後每層 prestige 應比上一層更快到達（熟悉感 + 永久乘數）
- 每層 prestige 的回報應明顯可感（不是微不足道的 +5%）

## MEGA IDLE 對照指標

| 指標 | 目標 | 當前狀態 |
|---|---|---|
| 普通難度通關天數 | 14-28天 | 待審計 |
| 第1次覺醒時機 | 區域5-7 (7-14天) | 待審計 |
| 後續覺醒頻率 | 每3-5天一層 | 待審計 |
| 每次登入至少1系統可升級 | ≤1h 收入 | 待審計 |
| 離線 vs 在線差距 | ≤15% | v588 已修 |
| 建築 Lv25 成本 | ≤48h @1.86M/h | v631 已校準 |

## 參考文獻

1. Anthony Pecorella, "The Math of Idle Games, Part I/II/III", Game Developer (2016)
   - https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i
2. Eric Guan, "Idle Game Design Principles" (2025)
   - https://ericguan.substack.com/p/idle-game-design-principles
3. Missions Zanx, "Idle Game Design: Systems, Mechanics, and Progression" (2026)
   - https://missionszanx.com/guides/idle-game-design-systems-mechanics-and-progression
4. Machinations.io, "How to design idle games" (2024)
   - https://machinations.io/articles/idle-games-and-how-to-design-them
5. Countly, "Player Retention Metrics That Predict Game Success" (2025)
   - https://countly.com/blog/player-retention-analytics-the-metrics-that-predict-long-term-game-success
6. Singular, "免費工具助你搞定遊戲數據分析" (2025)
   - https://www.singular-cn.net/blog/game-analytics-dau/
