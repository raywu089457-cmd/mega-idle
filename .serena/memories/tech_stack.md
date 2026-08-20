# Tech Stack

## Language and runtime
- Vanilla JavaScript (ES2020+), classic script tags (NOT modules), no bundler
- Browser-only: DOM APIs, Canvas 2D, WebAudio, localStorage
- No Node.js runtime needed for the game itself

## Frameworks and libraries
- NONE — zero dependencies, zero npm
- No React, Vue, jQuery, or any framework
- Canvas 2D for pixel art rendering (not WebGL)

## Build and dev
- No build step — double-click index.html or serve via python -m http.server 8123
- Dev server: http://127.0.0.1:8123 (Python http.server)
- File:// protocol supported for direct open

## Version and cache
- Cache-bust via ?v=629 query params on all script/css tags
- Version constant: MG.config.VERSION

## Save system
- localStorage key: megaidle_save_v1
- Autosave every 30 seconds + beforeunload
- Export/import: base64 JSON

## Audio
- WebAudio API: square/triangle oscillators, no external audio files
- Synthesized SFX + 2 music loops

## Platform
- Mobile-first (390x844 viewport target), Desktop supported (centered frame)
- Safe areas: env(safe-area-inset-bottom), viewport-fit=cover
- Touch targets minimum 44px

## System
- Windows 10 Pro, development via Python http.server or direct file://
- Git for version control
- Serena MCP for code intelligence (TypeScript language server active)