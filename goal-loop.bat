@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

rem ---------- env (same as 启动mega-idle.bat) ----------
set PI_API_KEY=sk-K4DSiU8rspDpKYTAqWJFYP6hh4pPGg4Ygef4YQE2zNd9vFIw
set PI_BASE_URL=https://api.sfkey.cn/v1
set PI_MODEL=kimi-k3
set "REMOTE_PI_RELAY=https://relay-rp1.jacobmoura.work"

echo ============================================
echo   MEGA IDLE - producer rotation loop
echo   theme rotates: mechanic/UI-map-mapart-num
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
