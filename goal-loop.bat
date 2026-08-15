@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

rem ---------- 環境(與 启动mega-idle.bat 一致) ----------
set PI_API_KEY=sk-K4DSiU8rspDpKYTAqWJFYP6hh4pPGg4Ygef4YQE2zNd9vFIw
set PI_BASE_URL=https://api.sfkey.cn/v1
set PI_MODEL=kimi-k3
set "REMOTE_PI_RELAY=https://relay-rp1.jacobmoura.work"

echo ============================================
echo   MEGA IDLE — 自主迭代迴圈啟動器
echo   第一次執行 = 新鮮模式
echo   再次執行   = 接續上次進度
echo ============================================

rem ---------- 1. 靜態伺服器(未運行才啟動) ----------
curl -s -o nul --max-time 2 http://127.0.0.1:8123/ >nul 2>&1
if %errorlevel%==0 (
  echo [OK] 伺服器已在 http://127.0.0.1:8123
) else (
  echo [..] 啟動靜態伺服器(最小化視窗)...
  start "mgi-server" /min cmd /c "python -m http.server 8123 --bind 127.0.0.1"
  timeout /t 2 /nobreak >nul
)

rem ---------- 2. 首次啟動:安全 checkpoint;接續:留給協定判斷 ----------
if not exist progress\goal-run.md (
  git status --porcelain | findstr /R /C:".*" >nul
  if errorlevel 1 (
    echo [OK] 工作區乾淨
  ) else (
    echo [..] 偵測到未提交/未追蹤改動,建立 checkpoint commit ...
    git add -A >nul 2>&1
    git commit -m "checkpoint: goal-loop 啟動前快照" >nul 2>&1
  )
) else (
  echo [..] 偵測到 progress\goal-run.md → 接續模式
)

rem ---------- 3. 啟動 omp 自主迴圈 ----------
if exist progress\goal-run.md (
  echo 接續上次迴圈:先讀 progress/goal-run.md 與 git log 確認最後完成輪次,檢查工作區狀態,從上次中斷處繼續,不要重做已完成輪次。 > "%TEMP%\goal-resume.txt"
  echo [..] 以接續模式啟動 omp ...
  omp launch @goal-prompt.md @%TEMP%\goal-resume.txt
) else (
  echo [..] 以新鮮模式啟動 omp ...
  omp launch @goal-prompt.md
)

echo.
echo [完成] 迴圈已結束(或被中斷)。
echo 再次執行本 bat 即可從上次進度接續。
pause
