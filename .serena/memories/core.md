# MEGA IDLE Core

## Project identity
放置王國 MEGA IDLE — pixel-art idle RPG (Traditional Chinese), pure frontend, no build step, vanilla JS + Canvas 2D. Quality bar: Evil Hunter Tycoon level. Originality law: never copy EHT assets/text/layouts.

## Source map
- `index.html` — entry, script load order matters (core→art→data→sys→ui→main)
- `js/core/` — config.js (constants), utils.js (fmt, helpers), names.js (hunter names), save.js (localStorage persistence), audio.js (WebAudio synth)
- `js/data/` — hunters.js, monsters.js, equipment.js, buildings.js, quests.js, wanderers.js, artifacts.js, changelog.js
- `js/data/art/` — heroes.js, monsters.js, buildings.js, icons.js, fx.js (pixel sprites: `{w,h,pal,rows,frames?,rate?,anchor?}`)
- `js/data/sprites.js` — merges all art into `MG.art.*`
- `js/sys/` — battle.js, hunters.js, equipment.js, buildings.js, loot.js, meta.js, arena.js, royal.js, maze.js, expedition.js, events.js, dungeon.js, guild.js, worldboss.js, honorshop.js, market.js, abyss.js, tower.js, wanderers.js, badges.js, game.js, dev.js
- `js/ui/` — dom.js, render.js, screens.js, kingdom.js, hunt.js, hunters.js, equipment.js, more.js, tutorial.js
- `js/main.js` — bootstrap: game loop (200ms sim tick + rAF render), autosave (30s), offline rewards, audio unlock
- `css/style.css` + `css/extra.css` — mobile-first, dark fantasy palette
- `docs/DESIGN.md` — single source of truth for all systems, state shape, file ownership

## Global namespace
`window.MG` — sub-namespaces: `MG.config`, `MG.util`, `MG.data.*`, `MG.sys.*`, `MG.ui.*`, `MG.art.*`, `MG.game.state`.

## State shape (key fields)
`MG.game.state` persisted to `megaidle_save_v1` in localStorage. Key: currencies (gold/gems/honor), mats (9 types), kingdom (level/exp), buildings (10), hunters[] (max 40), formation[5], hunt (region/stage/dispatchIds/restUntil), inventory (items[] cap 200), codex, quests, achievements, checkin, buffs, awakenings, stats.

## File ownership (cross-slice calls via MG.sys.* only)
See DESIGN.md §7. Each slice owns specific files; NEVER edit outside yours except docs.

## Key invariants
- All user-facing text: Traditional Chinese (zh-TW), original flavor
- Number format: `MG.util.fmt` → 1.2萬/3.4億/9.9兆/京/垓/秭
- Dark fantasy palette: bg #141524, panel #1e2035, gold #ffd166
- Canvas 480×270 logical, CSS-scaled, pixelated
- Battle runs even in background tabs (setInterval tick)
- Offline cap: 12 hours, rate ×1.2
- File encoding: UTF-8, `"use strict"` at top of every IIFE

## Version tracking
Script tags use `?v=629` cache-bust. Current version in MG.config.VERSION.

## Refer to
`mem:tech_stack` — languages, frameworks, build tools
`mem:conventions` — code style, naming, patterns
`mem:suggested_commands` — dev commands
`mem:task_completion` — verification workflow