@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

rem ---------- env (same as 启动mega-idle.bat) ----------
set PI_API_KEY=sk-K4DSiU8rspDpKYTAqWJFYP6hh4pPGg4Ygef4YQE2zNd9vFIw
set PI_BASE_URL=https://api.sfkey.cn/v1
rem 模型分工:執行代理=flash(粗活),評審=K3(只讀閘門)
set PI_MODEL_EXEC=opencode-go
set PI_MODEL_JUDGE=kimi-k3
set "REMOTE_PI_RELAY=https://relay-rp1.jacobmoura.work"

echo ============================================
echo   MEGA IDLE - quality auto-loop (OMP inner loop)
echo   tracks rotate: balance - village art - battle art - QoL - TheoTown map
echo   4-stage per round: diag(flash) -> plan(K3) -> impl(flash) -> judge(K3)
echo   prompts in prompts\goal-*.md ; state in progress\improvement-log.md
echo ============================================

rem ---------- 1. static server (start only if not running) ----------
curl -s -o nul --max-time 2 http://127.0.0.1:8123/ >nul 2>&1
if %errorlevel%==0 (
  echo [OK] server already on 8123
) else (
  echo [..] starting static server on 8123 ...
  start "mgi-server" /min cmd /c "python -m http.server 8123 --bind 127.0.0.1"
  timeout /t 2 /nobreak >nul
)

rem ---------- 2. safety checkpoint (fresh start only) ----------
if not exist progress\improvement-log.md (
  git status --porcelain | findstr /R /C:".*" >nul
  if errorlevel 1 (
    echo [OK] worktree clean
  ) else (
    echo [..] uncommitted changes found, creating checkpoint commit ...
    git add -A >nul 2>&1
    git commit -m "checkpoint: rotation loop pre-launch snapshot" >nul 2>&1
  )
) else (
  echo [..] improvement-log found - resuming rotation state
)

rem ---------- 3. launch rotation trigger (resident) ----------
echo [..] launching loop-trigger.js (30s cycle, lock-guarded) ...
node loop-trigger.js

echo.
echo [done] trigger stopped. run this bat again to resume.
pause
