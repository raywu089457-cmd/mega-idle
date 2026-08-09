@echo off
chcp 65001 >nul 2>&1

set PI_API_KEY=sk-K4DSiU8rspDpKYTAqWJFYP6hh4pPGg4Ygef4YQE2zNd9vFIw
set PI_BASE_URL=https://api.sfkey.cn/v1
set PI_MODEL=kimi-k3

rem --- Remote Pi relay 自動設定 ---
set "RP_CONFIG=%USERPROFILE%\.pi\remote\config.json"
if not exist "%RP_CONFIG%" (
  if not exist "%USERPROFILE%\.pi\remote" mkdir "%USERPROFILE%\.pi\remote"
  echo {"relay": "https://relay-rp1.jacobmoura.work"} > "%RP_CONFIG%"
)
rem 確保 auto_start_relay 開啟（session 啟動時自動連 relay）
set "RP_PI_CONFIG=%USERPROFILE%\.pi\remote-pi\config.json"
if not exist "%RP_PI_CONFIG%" (
  if not exist "%USERPROFILE%\.pi\remote-pi" mkdir "%USERPROFILE%\.pi\remote-pi"
  echo {"agent_name": "ray", "auto_start_relay": true} > "%RP_PI_CONFIG%"
)
rem 顯式指定 relay（env 優先於 config，雙保險）
set "REMOTE_PI_RELAY=https://relay-rp1.jacobmoura.work"

set "WT=%LOCALAPPDATA%\Microsoft\WindowsApps\wt.exe"
if not exist "%WT%" set "WT=wt.exe"

start "" "%WT%" -d "C:\Users\ray\Desktop\Claude code\mega-idle" cmd /k "omp"
