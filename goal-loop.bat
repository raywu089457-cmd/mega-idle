@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

rem ---------- env (same as 启动mega-idle.bat) ----------
set PI_API_KEY=sk-K4DSiU8rspDpKYTAqWJFYP6hh4pPGg4Ygef4YQE2zNd9vFIw
set PI_BASE_URL=https://api.sfkey.cn/v1
set PI_MODEL=kimi-k3
set "REMOTE_PI_RELAY=https://relay-rp1.jacobmoura.work"

echo ============================================
echo   MEGA IDLE - autonomous iteration loop
echo   first run = fresh mode / next run = resume
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

rem ---------- 2. fresh start: safety checkpoint; resume: let agent decide ----------
if not exist progress\goal-run.md (
  git status --porcelain | findstr /R /C:".*" >nul
  if errorlevel 1 (
    echo [OK] worktree clean
  ) else (
    echo [..] uncommitted changes found, creating checkpoint commit ...
    git add -A >nul 2>&1
    git commit -m "checkpoint: goal-loop pre-launch snapshot" >nul 2>&1
  )
) else (
  echo [..] progress\goal-run.md found - resume mode
)

rem ---------- 3. launch omp autonomous loop ----------
if exist progress\goal-run.md (
  echo resume instruction: read progress/goal-run.md and git log, continue from last round, do not redo finished rounds. > "%TEMP%\goal-resume.txt"
  echo [..] launching omp in RESUME mode ...
  omp launch @goal-prompt.md @%TEMP%\goal-resume.txt
) else (
  echo [..] launching omp in FRESH mode ...
  omp launch @goal-prompt.md
)

echo.
echo [done] loop ended or interrupted. run this bat again to resume.
pause
