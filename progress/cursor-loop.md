# Cursor 品質迴圈（取代 OMP loop-trigger 的本機 agent 執行）

本 session 用 Cursor 內建 `/loop`（monitored shell wake）驅動，不再呼叫 `omp.cmd`。
間隔：**1 分鐘**（`Start-Sleep -Seconds 60`）。

## 狀態來源（唯讀排程）
- `progress/improvement-log.md` 狀態行：`循環` / `輪次` / `當前主題` / `下一主題`
- `theme.txt`：本輪宣告
- `loop-trigger.js` 的 `TRACKS` 順序：戰鬥美術 → 數值平衡 → 村莊美術 → QoL（`R % 4`）
- 產物：`progress/round-<R>-evidence.md` → `round-<R>-plan.md` → 實作+commit → `goal-judge-<R>.md`
- 不合格 → `round-<R>-feedback.md` 修正輪（vN-fixM）；合格或達修正上限才推進狀態行

## 每 tick 必做
1. 讀狀態行 + `theme.txt` + 是否已有 evidence/plan/feedback/verdict
2. 依缺口只做**下一個階段**（不要跳步）：
   - 無 plan → 取證（寫 evidence）再規劃（寫 plan，含「本輪選題」）
   - 有 plan 無本輪 commit → 實作+驗證+commit（附帶 changelog/index 快取）
   - 有 commit 待評 → 只讀評審寫 `goal-judge-<R>.md`
   - 不合格有 feedback → 只修評審項
   - 合格 → 推進狀態行與 `theme.txt`（輪次+1），再進入下一輪取證
3. 軌道禁止越界；agent **不**自行改軌道順序
4. 截圖前必須關閉教學 modal（略過 / `tutorial=99` / 移除 `.tut`），存檔後用 Read 回看圖檔
5. 靜態伺服器：`http://127.0.0.1:8123/`（必要時 `python -m http.server 8123 --bind 127.0.0.1`）

## 停止
使用者說停 → 殺 loop PID，不再 arm 下一拍。
