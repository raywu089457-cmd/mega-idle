@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ============================================
echo   MEGA IDLE - rotation loop live watch
echo   streams agent activity (thinking/tool/result)
echo ============================================
echo [..] watching newest session, 1.5s refresh ...
echo      (new round = new session: restart this bat)
echo.

node watch-live.js

echo.
echo [done] session ended. run this bat again for a new round.
pause
