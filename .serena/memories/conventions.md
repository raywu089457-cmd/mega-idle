# Code Conventions

## Module pattern
- Every file is an IIFE: `(function(){ "use strict"; ... })();`
- Single global namespace: `window.MG = window.MG || {};`
- Sub-namespaces: `MG.config`, `MG.util`, `MG.data.*`, `MG.sys.*`, `MG.ui.*`, `MG.art.*`
- Cross-slice calls ONLY via public API in `MG.sys.*` — never inline another slice's internals

## Naming
- camelCase for variables, functions, properties
- UPPER_SNAKE for constants in `MG.config`
- File names: lowercase, hyphenated for multi-word (rare)
- Hunter class IDs: sword, archer, mage, assassin, knight, priest

## Art sprites
- Format: `MG.art.<domain>[name] = { w, h, pal: {a:'#hex',...}, rows: ['aaaa',...], frames?, rate?, anchor? }`
- Characters 16×16, bosses 24×24 or 32×32, buildings 32×32, icons 16×16
- Style: cute colorful pixel, big-head chibi 40-50%, 65-90% sat candy palette, soft tinted outlines (NOT black)
- See `docs/SOULS-REMNANT-ART-RULES.md` for full art rules

## UI
- Mobile-first, max-width 480px app column
- Bottom nav: 5 tabs (王國/狩獵/獵人/裝備/更多)
- Dark fantasy palette: bg #141524, panel #1e2035, gold #ffd166
- All text zh-TW, flavor-rich, original
- Numbers via `MG.util.fmt` (萬/億/兆/京/垓/秭)
- Touch targets ≥ 44px, safe areas respected

## State management
- Single state object: `MG.game.state` persisted to localStorage
- Autosave every 30s + beforeunload
- No immutable patterns — direct mutation with dirty-flag saves

## Error handling
- Console must be clean (zero errors)
- No try/catch swallowing — surface errors visibly

## Performance
- Game loop: 200ms sim tick (setInterval) + 60fps render (rAF)
- UI refresh: 2Hz (500ms setInterval)
- Battle canvas: 480×270 logical, CSS-scaled, DPR capped 2
- Canvas image-rendering: pixelated

## File ownership
- Each slice owns specific files (see DESIGN.md §7)
- NEVER edit outside your assigned slice except docs
- Cross-slice changes require coordination