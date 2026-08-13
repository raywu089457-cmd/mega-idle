# 精緻像素風格改版三部曲（v157 → v159）

> 目標：整體美術從「現代深色 UI」改為「精緻像素風格」（方案 B：暗色精緻，參考 Loop Hero / Legends of Idleon / Soda Dungeon 2 系）。
> 範圍：外層 UI（字體/面板/按鈕/背景/場景），內層美術（16×16 手繪像素 sprite）原本已像素化，不動遊戲邏輯。

## 背景：改版前現況

- ✅ 已有：16×16 手繪像素 sprite（`js/data/art/heroes.js` 3 幀動畫、`monsters.js`、`buildings.js`、`icons.js` 1207 行、`fx.js`）+ `js/data/sprites.js` 註冊表，canvas 已 `image-rendering: pixelated`
- ❌ 待改：Noto Sans TC 圓滑字體、圓角 8~14px、軟漸層面板、光暈陰影——「現代深色 App 包著像素 sprite」

## v157 — 字體與骨架（commit `2d3c759`）

| 項目 | 內容 |
|---|---|
| **像素字體** | Fusion Pixel 12px（開源、OFL 1.1/MIT 雙授權、泛中日韓黑體點陣）繁中 split woff2 **652KB**，自託管 `fonts/fusion-pixel-12px-proportional-zh_hant.otf.woff2` + `@font-face`（font-display:swap）+ `<link rel="preload">`；body 12px 點陣基線 |
| **直角化** | panel / btn / chip / row / modal / toast / pbar / eq-cell / tb-btn / m-x / tut-card 圓角全改 0，2px 黑描邊 + `outline` 亮線 + 硬投影（像素立體感） |
| **背景** | 夜空星點像素紋理（4px 網格 radial-gradient，body 背景圖） |
| **canvas 字體** | 戰鬥/村莊畫布文字整數化：11px→12px、浮字 14/17→12/24px（對齊點陣網格） |
| **可讀性保衛** | 密集小字（eq-name、pbar 文字、badge）保留系統字體 |

來源：https://github.com/TakWolf/fusion-pixel-font/releases （2026.08.11 版，`fusion-pixel-font-12px-proportional-otf.woff2` zip 內 `zh_hant` split）；授權檔 `fonts/OFL.txt` 已隨 repo。

## v158 — 精修（commit `0beaf61`）

| 項目 | 內容 |
|---|---|
| **進度條分段** | `.pbar i` 每 7px 一條暗縫（repeating-linear-gradient）；render.js 怪獸/隊友血條每 6px 暗縫（boss banner 無填充不需） |
| **導航** | `.tab.on::before` 金色像素指示條（14×4px+黑描邊）；頁籤圖示 22→32px（`js/ui/screens.js` `dom.icon(t.icon, 32)`——原 inline 22px 會覆蓋 CSS） |
| **圖示整數化** | tb-cur / tb-btn / toast 圖示 14-18px → 16px（<16px 縮放糊；16 的倍數最清晰） |

## v159 — 場景強化（commit `d7ff7d0`）

| 項目 | 內容 |
|---|---|
| **戰鬥場景** | 遠山平滑曲線 → 階梯像素山（`hill()` 10 階 2px 逐階加寬）；天空加 40 顆像素星點（白 30 + 暖黃 10，固定種子計算，與村莊夜空呼應） |
| **村莊場景** | 月亮改像素階梯圓+月牙（逐列 fillRect）；地平線 6 棵像素小樹（建築背後層次）；地面草點紋理 20 顆 |
| **彈窗** | `.modal .m-head::after` 像素棋盤分隔線（2px 黑/灰交替） |
| **toast** | 左緣類型色塊：good=綠 / bad=紅 / gold=金（快速辨識） |

## 技術地圖（改動檔案）

- `css/style.css` — 全部視覺屬性重寫（@font-face、直角、星點背景、pbar 分段、tab 指示器、modal 棋盤線、toast 色塊）
- `css/extra.css` — tut-card 直角化、tut-dots 方塊化、tut-ring 直角、chip.on 硬陰影、hunt-stage-h 12px
- `js/ui/render.js` — canvas 字體整數化 ×6、血條分段縫隙 ×2、hill 階梯化、星點、像素月、樹木、草地
- `js/ui/screens.js` — tab 圖示 22→32px
- `index.html` — preload 字體 + 38 處 `?v=` 快取標記
- `fonts/` — Fusion Pixel 12px 繁中 woff2 + OFL.txt（新增）

## 驗證

每版 Playwright（chromium，480×800）：
- 字體載入：`document.fonts.check('12px "Fusion Pixel 12px"')` = true
- 直角：`.btn`/`.chip` computed border-radius = 0px
- 分段：`.pbar i` backgroundImage 含 repeating-linear-gradient；toast 左緣色 = good 綠 rgb(126,231,135)
- 圖示：tab icon 32px、tb-cur 16px
- 全版零 console error、零請求失敗

截圖（已 commit 於 `progress/`）：
- v157：kingdom / hunt / equip / settings
- v158：kingdom / battle
- v159：town / battle / modal

## 可調整項目（後續微調點）

1. **字體大小**：body 12px 點陣基線——若要更大需整數倍（24px）或接受非整數模糊；密集處已回退系統字
2. **星點密度**：body 背景 64px 網格、天空 40 顆、村莊 24 顆——可增減
3. **色調**：現色板 `--bg:#131425` 深藍紫底——可調亮/調暖
4. **樹木/草地**：村莊 6 棵樹、20 顆草點——位置為固定種子，可調數量

## 版本線

`2d3c759`（v157）→ `0beaf61`（v158）→ `d7ff7d0`（v159）→ 全部已上線 Pages（38 標記同步）
