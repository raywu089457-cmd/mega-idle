# 放置王國 MEGA IDLE — 設計與開發契約

Single source of truth for every sub-agent. Read BEFORE touching any file. When in doubt, this document wins.
Quality bar: Evil Hunter Tycoon (獵魔村物語) level — visual juice, information density, satisfying idle loop, fantasy writing.
ORIGINALITY IS LAW: our art (procedural pixel maps), our writing (all Traditional Chinese, original flavor text), our layouts and systems. NEVER copy EHT assets, text, numbers, or exact layouts. Take inspiration from its *polish*, never its content.

---

## 1. Tech & Loading

- No frameworks, no build step, no npm. Classic `<script>` tags, file:// double-click compatible.
- Single global namespace: `window.MG` (never pollute otherwise).
- Load order (index.html): core (config, utils, names) → art files → data/sprites.js (merges art) → data/* → core/save, core/audio → sys/* → ui/* → main.js.
- Dev: http://127.0.0.1:8123 (python http.server, already running). Progress page: /progress/progress.html.
- All files UTF-8. `"use strict"` at top of every IIFE.

## 2. State shape (MG.game.state, persisted to localStorage key `megaidle_save_v1`)

```js
{
  v: 1, created: ts, lastSeen: ts,
  settings: { sound: true, music: true, speed: 1, reducedMotion: false },
  currencies: { gold: 0, gems: 120, honor: 0 },
  mats: { iron: 0, herb: 0, leather: 0, crystal: 0, ember: 0, ice: 0, poison: 0, void: 0, myth: 0 },
  kingdom: { level: 1, exp: 0 },
  buildings: { castle: 1, guild: 1, training: 0, forge: 0, gemworks: 0, alchemy: 0, library: 0, warehouse: 1, altar: 0, market: 0 }, // 0 = locked
  hunters: [ hunter ],              // max 40
  formation: [ null x5 ],           // hunter ids, 0 = empty slot
  hunt: { region: 0, stage: 1, auto: true, autoRetry: true, speed: 1, dispatchIds: [], restUntil: 0, regionClearShown: {} },
  inventory: { items: [ item ], cap: 200 },
  codex: { monsters: { mid: kills }, items: { defId: count }, mats: { id: count } },
  quests: { mainIdx: 0, mainProg: 0, daily: { day: 'YYYY-MM-DD', list: [{ id, prog, done }] } },
  achievements: { id: true },       // claimed
  checkin: { month: 'YYYY-MM', days: [bool x30] },
  buffs: { atkUntil: 0, goldUntil: 0, expUntil: 0, potAtk: 0, potGold: 0, potExp: 0 }, // epoch ms + tier
  awakenings: 0,
  tutorial: 0,
  stats: { kills: 0, goldEarned: 0, bossKills: 0, playSec: 0, maxStage: 1, recruits: 0, enhances: 0 },
  log: [ last 40 loot/battle log strings with icon refs ]
}
```

**Hunter:** `{ id, name, cls, rarity (1-6), level, exp, skills: { skillId: lvl }, promoted, equip: { weapon: uid|null, helmet, armor, boots, necklace, ring, charm } }`
**Item:** `{ uid, defId, tier (1-10), rarity (1-6), enhance (0-15), gems: [gemId|null], qty }` (qty>1 for stackable mats only — mats live in state.mats, not inventory)

## 3. Systems (each owns its files; cross-slice calls go through MG.sys.*)

### Economy
- Gold: main. Gems: premium (quests/achievements/bosses/checkin). Honor: from 覺醒 (awakening) + boss first-kills.
- Materials: iron/herb/leather (early), crystal/ember/ice (mid), poison/void/myth (late). Drop by region tier.
- Number format `MG.util.fmt`: 1.2萬 / 3.4億 / 9.9兆 / 京 / 垓 / 秭. Show int below 1萬.

### Hunting (sys/battle.js + data/monsters.js) — 派遣制
- 10 regions × 10 stages (stage 10 = boss). Region defs: `{ id, name, desc, minStage, tier (1-10), palette {sky1,sky2,ground,accent}, monsters: [ {id,name,hp,atk,def,gold,exp,dropMul,sprite,size} x4-5 ], boss: {name,hp,atk,def,gold,exp,dropMul,sprite,size} }`.
- Stage scaling: monster base stats × `(1 + 0.16×(stage-1))`, boss ×4 hp.
- **派遣制（2026-08-09 起）**：招募後的獵人一律在城內待機，不主動戰鬥。玩家按下「派遣」後，**編隊（formation）全員**出戰；無人派遣時 `game.tick` 不跑 battle sim（`hunt.dispatchIds` 為空）。
- 死亡 → 回村休息 20 秒（`restUntil`）→ 待機；開啟「自動續戰」（`hunt.autoDispatch`）後，休息完自動重新派遣當前編隊（首領進度照常承接）。「回村待機」可即時召回。
- 出戰隊伍由 `hunt.dispatchIds` 決定（`battle.teamBuild`），不再直接讀編隊。派遣中可隨時「召回」（`battle.retreat()`）。
- Hunter attack cadence from spd (attacks/sec 0.6-2.5). Dmg = atk × rand(0.9-1.1), crit ×2 (critCh %).
- Monster counterattacks a random alive hunter (knight takes aggro 50%).
- Kill → gold/exp/mats/equipment via sys/loot. Stage up when monster dies. Region complete → unlock next + reward modal (only once per region).
- **全軍倒下（死亡）→ 自動回家休息：`battle.retreat()` 設 `hunt.restUntil = now + RETREAT_MS(20s)`，休息結束滿血、清空 `dispatchIds`、回到待機。不自動再戰（autoRetry 已停用，欄位保留相容）。重整頁面時 `start()` 依 `restUntil` 還原休息狀態。**
- **玩家召回（`battle.recall()`）＝立即回村：當下滿血、清空 `dispatchIds`、回待機 — 不經 20 秒休息（休息是死亡的代價，不是主動召回）。**
- Speed toggle 1×/2×/4× multiplies sim dt. Boss kill → gems + honor + guaranteed rare+ drop.
- Battle runs even when on other tabs (tick continues; visible screens only render). 離線收益 `battle.rates()` 在未派遣時為 0（沒人戰鬥就沒狩獵收益）；離線經驗分給派遣隊。

### Hunters (sys/hunters.js + data/hunters.js)
- 6 classes: 劍士 (balanced), 弓手 (fast ranged), 法師 (high atk aoe, squishy), 刺客 (crit), 騎士 (tank, aggro), 牧師 (heals team).
- Rarity 1-6★: 普通/高級/稀有/史詩/傳說/神話. Rarity = growth multiplier (1.0/1.15/1.35/1.6/1.9/2.3).
- Base stats per class + per-level growth; level cost `50×level^1.5` exp. Level cap 200.
- 突破 (promotion) at 10/25/50/100/150: costs gold+mats, +20% all stats each, unlocks skill slots.
- Recruit: 普通招募 (gold, scales, 1-3★), 高級招募 (券, 2-5★), 神話招募 (gems, 3-6★). Card-flip reveal animation.
- Skills: 3 slots (lvl 5/15/25 unlock); skill books upgrade levels. Auto-cast with cooldown, battle fx per skill.
- Power score = atk×3 + def×2 + hp/10 + crit×10 (display number, feels like EHT power).

### Equipment (sys/equipment.js + data/equipment.js)
- Slots: weapon, helmet, armor, boots, necklace, ring, charm. Weapon types by class: 劍/弓/杖/匕首/大劍/法杖 (class-locked, others universal).
- Tiers T1-T10 by region. Rarity weights shift with tier. Base stat ranges per slot+tier; rarity multiplier (1/1.25/1.5/2/2.5/3.2).
- 強化 +1..+15: +5%/lvl stats, cost gold × tier × 1.5^enhance, forge discount applies. Success always (fair).
- 寶石: sockets 0-2 on weapon/armor by rarity; gems from drops + 融合 (gemworks); gems: 紅寶石(atk)/藍寶石(def)/綠寶石(hp)/黃寶石(crit).
- 分解 → mats. 合成: recipes (data), unlocked by codex/region progress, in 合成 tab.
- 套裝 (2pc/4pc): 獵狼 atk+15%/crit+10%, 熔岩 atk+20%/atkspd+15%, 冰霜 hp+25%/def+25%, 龍鱗 all+20%/dmg taken -15%.

### Kingdom (sys/buildings.js + data/buildings.js + ui/kingdom.js)
- 10 buildings: 王城 (gold +8%/lvl, level = kingdom level cap), 獵人公會 (formation slot every 3 lvls to 5, recruit cost -2%/lvl), 訓練場 (exp +10%/lvl), 鐵匠鋪 (unlock enhance; cost -4%/lvl), 寶石工坊 (gem drop +6%/lvl, gem fusion), 藥水工坊 (potions +5%/lvl), 圖書館 (skill book drop +5%/lvl), 倉庫 (inventory +10/lvl), 祭壇 (honor +5%/lvl, unlock 覺醒), 市場 (shop).
- Upgrade costs gold + mats, curve ×2.1/lvl. Building visual tier changes every 5 levels (sprite swap).
- Kingdom exp from: hunter level-ups, stage clears, building upgrades. Level gates: formation slots, regions, buildings.

### Meta (sys/meta.js + data/quests.js)
- 主線任務: 30 linear goals (kill/equip/enhance/promote/reach stage). 每日任務: 5 daily, reset at local midnight. 成就: 40 long-term. All reward gold/gems/券.
- 圖鑑: monsters (kills 10/50/200/1000), items (collect), mats. Milestone rewards + permanent % buffs at total %.
- 簽到: 30-day calendar, day 7/15/30 = gems/券/神話券.
- 商店 (market): 招募券, 藥水 (攻擊/金幣/經驗 30min timed buffs), 加速券 (x5 for 30s), gem packs. Gold + gem prices.
- 覺醒 (awakening, altar): requires stage ≥ 35 & 3 buildings ≥ 10. Resets hunters/buildings/hunt/stage — keeps: gems, honor, codex, achievements, checkin, awakenings. Each awakening: +25% dmg, +25% gold, +5% exp permanent. Honor spent at altar for 覺醒 buffs (dmg/gold/exp per honor, 5 tiers).

### Offline (core/save.js)
- On load: hours = min(12, now-lastSeen). Rewards: gold rate (last hour avg) × hours × 1.2, exp, 10% of max possible items. Modal 離線獎勵 with claim.

### Audio (core/audio.js)
- WebAudio synthesized: SFX (click, coin, buy, equip, levelup, hit, crit, hurt, death, boss, victory, error, recruit, enhance, quest, skill) + 2 music loops (town calm, battle drive) + boss sting. Square/triangle oscillators, no external files. Master toggle.

## 4. Pixel art spec (js/data/art/*.js → merged in sprites.js)

- Format: `MG.art.<domain>[name] = { w, h, pal: {a:'#hex',...}, rows: ['aaaa', ...], frames?: ['name_frame0','name_frame1'], rate?: ms, anchor?: [x,y] }` — chars 'a' map to pal keys, '.' transparent.
- Characters 16×16 (hunters, monsters), bosses 24×24 or 32×32, buildings 32×32, icons 16×16, fx 16×16.
- Rules: 3-4 shade outline (darkest outline color = darken base), readable silhouette at 1x, motion frames: idle 2 frames, walk/attack 2-3 frames for hunters.
- Every character needs: idle frames + attack frame (weapon swing) + hurt flash (white overlay via pal swap optional).
- Domain files: heroes.js (6 classes × rarity recolor acceptable), monsters.js (per region + bosses), buildings.js (10 buildings, 3 tier variants), icons.js (~40 UI icons), fx.js (slash, fireball, arrow, heal, spark, coin, explosion, buff glow).
- Sprite drawing MUST be verified in browser screenshot, not trusted by eye in code.

## 5. UI conventions (css/style.css + ui/dom.js)

- Mobile-first: max-width 480px app column, full-bleed background; desktop centers with frame. Bottom nav: 王國/狩獵/獵人/裝備/更多 (5 tabs, pixel icons + labels).
- Top bar: gold (coin), gems (gem), honor (crown), kingdom level badge, 設定 gear.
- Dark fantasy palette: bg #141524, panel #1e2035, panel2 #262a45, line #3a3f66, gold #ffd166, text #e8eaf6, dim #8b90b5. Rarity colors: 1 #c8c8d8, 2 #4fc3f7, 3 #a78bfa, 4 #f472b6, 5 #ff9f43, 6 #ff5c8a (with glow).
- Type: system Chinese stack "Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif; bold titles with 2px offset shadow; pixel-style buttons (2px border, hard shadow offset, pressed state), 8px radius max.
- Toasts, modal system (ui/dom.js: `MG.ui.dom.modal(html, {title, wide})` returns overlay el; `.close()`), confirm dialogs. All numbers via fmt. Every screen re-renders on tick at 2Hz except battle canvas (60fps).
- Localization: ALL user-facing text zh-TW, flavor-rich, original. No English UI strings.
- Safe areas (env(safe-area-inset-bottom)), viewport-fit=cover, touch targets ≥ 44px.

## 6. Battle scene (ui/render.js)

- Canvas 480×270 logical, CSS-scaled, image-rendering: pixelated, DPR capped 2. Region sky gradient + ground strip + accent. Monster center-right (size by def), hunters left column. Projectiles (arrow/fireball/knife), skill fx sprites, damage numbers (yellow hit / orange crit / red monster hit), gold fly-to-counter, HP bars above monster + hunter mini-bars, stage banner "第 N 關", boss banner + screen shake. Particles pool. Floating loot text.

## 7. File ownership map (builders claim exactly these; NEVER edit outside yours except docs)

| Slice | Files |
|---|---|
| Core engine (Main) | index.html, css/style.css, core/*, sys/game.js, sys/battle.js, sys/loot.js, ui/screens.js, ui/dom.js, ui/render.js, ui/tutorial.js, main.js |
| B1 Hunters | data/hunters.js, sys/hunters.js, ui/hunters.js, core/names.js |
| B2 Equipment | data/equipment.js, sys/equipment.js, ui/equipment.js |
| B3 Hunt content | data/monsters.js, ui/hunt.js |
| B4 Kingdom | data/buildings.js, sys/buildings.js, ui/kingdom.js |
| B5 Meta | data/quests.js, sys/meta.js, ui/more.js |
| B6 Art monsters/buildings | data/art/monsters.js, data/art/buildings.js |
| B7 Art heroes/icons/fx | data/art/heroes.js, data/art/icons.js, data/art/fx.js |
| B8 Audio | core/audio.js |
| B9 Polish/tutorial/help | ui/tutorial.js, css/extra.css, ui/help content in ui/more.js (coordinate with B5) |

Cross-slice calls ONLY via public API documented in the owning file's header. Never inline another slice's internals.

## 8. Verification workflow (every agent, every change)

1. Serve: http://127.0.0.1:8123 (running). Reload hard (cache-bust `?v=ts`).
2. Open browser (xd://browser), viewport 390×844 mobile + 1280×800 desktop. Screenshot (`tab.screenshot`) and inspect_image the ACTUAL rendered game — never trust code-by-eye for art/UI.
3. Exercise the slice: click through, change state (localStorage via tab.evaluate if needed), verify numbers/state transitions in `MG.game.state`.
4. Console must be clean (no errors). Check performance basics (no busy loops, intervals cleared).
5. Report: what you changed, screenshot evidence, state evidence, remaining gaps.

## 9. Critic judging rubric (harsh critics)

Score each: 1) Visual polish & juice (motion, feedback, density) 2) Idle loop satisfaction 3) System depth & coherence 4) Writing/atmosphere (zh-TW) 5) Mobile UX 6) Performance. Compare against Evil Hunter Tycoon quality from memory and/or fetched EHT screenshots (compare, never copy). Verdict must name THE single biggest gap + concrete fix instructions, then builder fixes and critic re-verifies from fresh screenshots. Loop until critic says ours is at least equal.

## 10. Game writing canon (flavor)

Kingdom: 你繼承了祖父的舊王國「梅根」，率領獵人公會重建榮光。Hunters are 獵人, monsters are 魔物, stages are 區域關卡, gold 金幣, gems 鑽石, honor 榮譽, tickets 招募券, awakening 覺醒, promotion 突破, enhance 強化, region 狩獵場, boss 首領. All flavor text original, short, punchy, zh-TW. Number formatting zh-TW (萬/億). UI copy must feel like a premium mobile game: micro-copy everywhere (button hints, empty states, tooltips).

## 11. 流浪英雄系統（2026-08-08 新增，完整版）
設計源：mega-idle-web-three.js 流浪獵人機制，依本遊戲職業/建築/經濟校準。
- 生成：上限 3 + 獵人公會等級×2；三階型態（見習/老練/英雄），公會等級越高高階權重越高；稀有度 1-6★ 權重 [55,28,11,4.5,1.3,0.2]；名字用 MG.data.names。
- FSM：enter→walk→(rest/eat/drink/shop/hunt/leave)；心情 -0.2/s，rest +2/s，消費 +8~18；mood<20 說「這村子真無聊…」離開；mood<25 離開、血<50% 休息、mood<55 用餐/暢飲。
- 消費循環（村莊收入）：市場=餐飲（6-10 金）、鐵匠鋪=武器（10-18 金）、藥水工坊=藥水；收入 = fee × (1 + 該建築等級×0.05)。
- 狩獵外出：對戰第 1 區魔物，勝率 = 戰力/(戰力+敵戰力) clamp 0.1-0.95；勝→金+素材（type.matChance）；敗→-30~60 HP；HP≤0 戰死 → 18s×(1-公會×0.06) 後重生回村。
- 招募：費用 = round((100 + 等級×40) × 稀有度錢包倍率[1,1.15,1.35,1.6,1.9,2.3])；條件 = 名冊<40 且金幣足夠；成功→以該名/職業/稀有度/等級建獵人（Lv=型態等級）→自動編入空位→stats.recruits++ / wanderersRecruited++。
- UI：王國畫面城鎮圖層走動+氣泡（drawTownLife），下方流浪英雄卡片（狀態/心情/氣泡/招募按鈕）；原獵人分頁招募 modal 保留並存。
- 檔案：js/data/wanderers.js（18 型態+台詞池）、js/sys/wanderers.js、js/ui/kingdom.js、js/core/save.js（wanderers 欄位）、js/sys/game.js（tick 掛鉤）。

## 12. 經濟平衡修正（2026-08-09，flash 自審 + 數值模擬）

模擬模型（英雄成長/魔物曲線/掉落/建築/強化/突破全數值化，跑 2/8/24/72h 策略局）發現三處結構性失衡並修正：

- **素材迴圈斷裂**（最大問題）：前期素材（herb/leather/iron/ember/ice…）區域鎖死——越過該區後不再掉落、分解只回 iron/crystal/myth → 後期 herb≈0，突破/藥水工坊/圖書館/合成全卡死。
  - 修正 1：`loot.rollKill` 新增通用掉落表（r3+ 起依區域掉 3~7 種舊素材，低機率）。
  - 修正 2：`dismantleMats` 全金字塔回收（T2+ herb、T3+ leather、T5+ ember、T6+ ice、T7+ poison、T8+ void、T9+ myth）。
- **強化成本爆表**：×1.55/級 → ×1.5/級（+15 單步 -80%），對齊中後期收入。
- **金幣招募鎖死**：150×2.1^n 無上限 → 封頂 min(n,10)，第 10 次後不再翻倍。
- 未動：建築曲線（×2.1/級與收入對齊）、魔物 TB（後期牆可被 5 人編隊+強化+突破+套裝突破）、職業數值、經驗曲線。
