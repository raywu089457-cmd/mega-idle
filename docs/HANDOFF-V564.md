# 交接資料 — 等角地圖美術（v564・TheoTown 風格 iso 建築）

> 給接手 agent 的完整交接。本文件描述 **v564 已完成的成果**、**美術系統契約**、
> **TheoTown 風格規則**、**生成器操作**、**驗證 SOP** 與 **地雷**。
> ⚠️ 現況是動態的：本專案有並行製作人輪換（goal-loop.lock），
> **接手前先重讀**：`progress/improvement-log.md` 輪換狀態行、`index.html` 快取版本、
> `js/data/changelog.js` 最新條目。

---

## 0. 專案鐵律（任何改動前必讀）

- **零建置**：classic scripts + Canvas 2D + DOM；`file://` 雙擊可玩；不得引入 build step
- **行動端優先**：390×844 開發，console 必須零錯誤
- **確定性**：美術生成禁用 `Math.random`（用 seeded `hsh`/mulberry32）
- **版本慣例**：任何 js/css 改動 → `index.html` 全部 `?v=` 快取 +1（當前 583，動態）
- **輪換制**：`progress/improvement-log.md` 的「輪換狀態」由 `loop-trigger.js` 讀寫，
  **agent 不得自行更動主題**；每輪成果以 vNNN 條目附加在 changelog 最新在前
- **核心玩法清單**：improvement-log「核心玩法」段落列出的系統不可取代/破壞

## 1. v564 成果摘要（已完成、已驗證）

**問題**：地圖繪製呼叫 `b_castle_iso` / `b_guild_iso` / `b_training_iso` / `b_library_iso` /
`b_forge_iso` / `b_alchemy_iso` / `b_market_iso` / `b_altar_iso` / `b_gemworks_iso` /
`b_warehouse_iso` / `b_house_iso` 共 11 個 sprite——全倉庫零定義
（v278 worldmap 合併時 iso 美術遺失）→ `sprites.get()` 全部落 **fallback blob**
（16×16 灰圓 `#7a7f9c`＋黑框 `#14121f`）。

**成果**：11 個 TheoTown 風 iso 建築 sprite（靜態 rows/pal 資料）：
- `b_castle_iso` 64×48：主樓＋左右錐塔＋雉堞＋大門＋雙旗
- 9 棟 32×32：公會（脊旗）／訓練場（平頂齒緣）／圖書館（大窗）／鐵匠鋪（煙囪＋爐火窗）／
  煉金坊（屋頂藥瓶）／市集（條紋棚＋攤台）／祭壇（石台聖火）／寶石坊（紫水晶簇）／倉庫（雙門）
- `b_house_iso` 20×16：山牆小屋

## 2. 成果檔案（交接點）

| 檔案 | 角色 | 可否刪 |
|---|---|---|
| `js/data/art/buildings_iso.js` | 11 sprite 靜態資料（`MG.art.buildings_iso` 域） | 否（主遊戲在用） |
| `tools/gen-iso-art.cjs` | 生成器（規則的程式化身，可改參數重跑） | 保留（改美術用） |
| `index.html` | 載入 buildings_iso.js（art 區塊、buildings.js 之後） | — |
| `js/data/changelog.js` | v564 條目（診斷/修正/驗證/留存理由） | — |
| `progress/improvement-log.md` | v564 輪次記錄 | — |
| `progress/v564-iso-buildings-map.webp` | 實機截圖 | — |

**回滾點**：`git revert` v564 即可（新增 2 檔 + index.html 1 行 + changelog；map.js 零改動）。

## 3. 美術系統契約（改美術前必懂）

```
index.html 載入順序：art/*.js（定義 MG.art.<域>）→ sprites.js（registry）
sprites.get(name)：遍歷 window.MG.art 所有域 → build() → {w,h,rate,frames:[rows],pal}
  - 找不到 → fallback(name)：16×16 灰 blob（這就是 v564 之前的 bug 根源）
sprite 資料格式：
  { w, h, rate: 0, rows: ["....", ...], pal: { "A": "#rrggbb", ... } }
  rows 每行長度 === w；'.' = 透明；pal key 為單字元（A-Z 起）
map.js 繪製：MG.ui.render.draw(bctx, "b_castle_iso", x, y, 1, {scale, t}) 
  draw → canvasOf(name) → 逐像素 fillRect
tier 變體：art/buildings.js 尾部 IIFE 對 MG.art.buildings 的 rows 做 _t1/_t2/_t3 衍生
  （buildings_iso 域不參與——地圖建築無階級，別把 _iso 加進該 IIFE 的迭代對象）
```

**尺寸契約（map.js 寫死，新 sprite 必須對齊）**：
城堡 `64×48 × 1.2`；建築 `32×32 × 1.15–1.4`；民房 `20×16 × 1.3`；
sprite 底邊＝錨點 tile 中心 +2px，陰影貼腳 3px。

## 4. TheoTown 風格規則（v564 的審美依據，改美術時照此驗收）

> ⚠️ **權威版本 = `docs/THEOTOWN-ART-RULES.md`**(R1-R6 色票/比例/材質配方/驗收清單,
> 含適用範圍界定:角色/小人維持 FF1 黑描邊契約,本規則只管地圖資產)。
> 下方為 v564 原始摘要,僅供快速參照,以規則文件為準。

1. **比例**：人物 3px 高為基準（我們村民 8×8 對 32×16 tile 同理）；建築不得過大
2. **低飽和**：base 色 sat 60–80%（屋頂）、牆 15–35%；明度 70–80%；禁全飽和亮色
   （生成器 hsl() 已硬 clamp 8–82% / 28–86% — 越界自動拉回）
3. **無黑輪廓**：不用 `#14121f` 勾邊；用「周邊色的深一階」；暗面即邊緣
4. **左上受光**：左坡/左牆亮、右坡/右牆暗、中稜線暗、脊線亮
5. **底部漸暗**：牆底兩階（base → baseHi 過渡）
6. **面紋理**：純色平面要加同色系 ±亮度雜訊（seeded）

## 5. 生成器操作手冊（tools/gen-iso-art.cjs）

```
node tools/gen-iso-art.cjs   # 重跑 → 自動驗收(R1-R6) → 全 PASS 才覆寫 js/data/art/buildings_iso.js
```

架構：
- `hsl(h,s,l)`：色彩唯一來源（規則 2 的程式化）——**已加 R1/R2 硬 clamp**（sat 8–82%、light 28–86%，
  任何參數越界自動拉回，所有派生色自動合規）
- `grid/set/rect/fillPoly`：掃描線多邊形填色（等角菱形/三角/平行四邊形）
- `isoBox(g, cx, ty, W, D, H, cols)`：2:1 等角盒骨架（屋頂菱形 + 左亮右暗牆 + 底漸暗）
  - 屋頂：`(cx,ty)` 頂／`(cx±W, ty+D)` 側／`(cx, ty+2D)` 前角；牆 `ty+D` 起到 `ty+2D+H`
- `win/door/flag/chimney`：窗（框+玻璃+窗台兩階）／門（框+板+台階）／旗／煙囪
- `speck(g, seed, x0,y0,x1,y1, baseKey, keys)`：seeded 面雜訊
- `BUILDINGS` 表：每棟的 roofHue/roofSat/wallHue/wallSat/windows/door/extras 參數
  - **尺寸已參數化**：`cfg.W/D/H/ty/w/h`（預設 11/5/9/6/32/32）— 任何形體都在 isoBox 保證內
- 輸出：收集格內 hex → 依序指派 `A-Z` 再 `a-z`（跳過 `"`/`\`）→ 靜態 rows/pal

**新增建築 = 丟一筆 cfg 資料**（自動合規，無手寫座標）：
```js
b_mybuilding_iso: { roofHue: 18, roofSat: 55, wallHue: 40, wallSat: 25,
  door: false, windows: [[9, 14, 3, 4]], seed: 99,
  speckL: [hsl(40,28,72), hsl(40,18,60)], speckR: [hsl(40,22,58), hsl(40,12,46)] },
```
重跑生成器 → 驗收閘門檢查 R1-R4（黑輪廓/色票範圍/光源方向）→ 全 PASS 才寫檔；
**任一 FAIL 印出原因且不寫檔**（不會產出違規 sprite）。

**改法**：改 BUILDINGS 參數或 extras 函式 → 重跑 → 驗收（見 §6）。

## 6. 驗證 SOP（v564 用過、可複製；生成器已自帶規則驗收）

```bash
# a) 語法
node --check js/data/art/buildings_iso.js && node --check js/data/changelog.js

# b) 註冊表解析（node，無瀏覽器）——確認非 fallback
node -e "（§7 有現成腳本）"

# c) 風格規則掃描 —— 已自動化：重跑生成器即驗 R1-R4（黑輪廓/sat/light/光源），
#    全 PASS 才寫檔；手動抽查可用：黑輪廓 #14121f 數、sat>78% 數、明度<12% 數皆為 0

# d) 瀏覽器實測（headless Chrome + python -m http.server 8123）：
#    開世界地圖 → 畫布像素抽樣：建築色簇存在（紅瓦/石牆/米牆）、
#    舊 fallback 色 122,127,156 出現數 0、console 零 error
#    截圖存 progress/vNNN-*.png|webp
```

## 7. 可直接複用的診斷腳本（node）

```js
// sprites.get 解析檢查（在專案根目錄跑）
globalThis.window = globalThis;
globalThis.MG = {};
const fs = require('fs'), vm = require('vm');
const ctx = { window: globalThis, MG: globalThis.MG, console,
  document: { createElement: () => ({ getContext: () => null }) } };
vm.createContext(ctx);
for (const f of ['js/data/sprites.js','js/data/art/icons.js','js/data/art/heroes.js',
  'js/data/art/monsters.js','js/data/art/buildings.js','js/data/art/buildings_iso.js',
  'js/data/art/fx.js']) vm.runInContext(fs.readFileSync(f,'utf8'), ctx, { filename: f });
const S = ctx.MG.data.sprites;
for (const n of ['b_castle_iso','b_guild_iso','b_house_iso']) {
  const s = S.get(n);
  console.log(n, '=>', s ? 'w:'+s.w+' h:'+s.h+' pal:'+JSON.stringify(s.pal).slice(0,60) : 'NULL');
  // fallback 簽名：pal 只有 {"C":"#7a7f9c","O":"#14121f"} 且 w:16
}
```

## 8. 地雷與注意事項

1. **快取版本是動態的**：接手時先 grep `index.html` 的 `v=58x`，改完 +1（全部標籤）
2. **輪換狀態行別動**：`improvement-log.md` 的「輪換狀態」由 loop-trigger 管；
   並行 session 可能正在跑（goal-loop.lock）——**改檔前先讀 lock**，避免覆寫衝突
3. **buildings_iso 域的 tier 衍生**：`art/buildings.js` 尾部 IIFE 只迭代
   `MG.art.buildings`——若有人把 `_iso` 併入該域，會對 iso sprite 錯誤 stamp 旗幟/門燈
4. **pal key 空間**：單字元 A-Z/a-z；生成器已跳過 `"`/`\`（歷史 bug：
   曾用 `!` 起導致字串字面值被 `"` 中斷）
5. **`b_house`（無 _iso）不存在**：全專案只用 `b_house_iso`，不要補錯名字
6. **地圖其他層**：區域地標/模式地標/燈塔/碼頭/農田是 `map.js` 內 `box/tri/fillRect`
   程序直繪（非 sprite）——v562 已精緻化，改動時別誤傷
7. **不要用 Phaser/Three.js 路線重作地圖**：曾試 Phaser 3 + Tiled + Grid Engine demo
   （demo/phaser-theotown.html），因 CDN 依賴/雙重資料源/低階機相容風險被放棄回退；
   地圖維持 Canvas 2D 程序渲染

## 9. 候選下一步（backlog 相關）

- `improvement-log.md`「美術/動畫 backlog」P1：怪物行動前搖（0.15–0.25s 抖動/蓄力）、
  狀態視覺化（腳下光圈/頭頂環）
- iso 建築可擴展：更多民房變體（色盤換色即可，生成器 BUILDDINGS 表加參數）、
  節慶裝飾（萬聖/聖誕屋頂）
- 夜間模式：buildings_iso 目前單一色調，TheoTown 有日夜調色（demo/theotown-demo.html
  有 night 調色邏輯可參考——該 demo 是 Three.js 版，僅參考色彩處理）

## 10. 本輪主題脈絡

```
循環 3・第 4 輪（v563）動作與戰鬥呈現（刺客突刺/騎士盾頂）
循環 3・第 5 輪（v564）等角地圖・美術與內容 ← 本交接
循環 3・第 6 輪（v565）？（並行 session 已發布，接手時讀 changelog）
```
輪換順序：玩法機制與耐玩性 → UI/UX 與品質 → 等角地圖 → 動作與戰鬥呈現 → 數值平衡與留存。
