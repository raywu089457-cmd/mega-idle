# EHT 對照參考（批評者用）

Compare 放置王國 MEGA IDLE against the Evil Hunter Tycoon (獵魔村物語) quality bar.

IMPORTANT CONSTRAINT: no vision model is available in this environment — you cannot literally view images. Judge with:
1. DOM text structure (document.querySelector('.screen').innerText) — information density, copy quality, hierarchy.
2. Canvas pixel sampling (getImageData: painted pixel ratio, unique color counts, region color sampling).
3. MG.data.sprites.ascii('<name>') — pixel art read as ASCII text (you CAN see shapes this way).
4. Your trained knowledge of EHT: dark fantasy pixel UI, chunky buttons, dense management screens, satisfying idle feedback, juicy battle animations, premium zh-TW micro-copy. EHT reference screenshots exist at:
   - https://kotaku.com/games/evil-hunter-tycoon/gallery/1
   - https://mwm.ai/apps/evil-hunter-tycoon/1493512288
   (You cannot view them — use them only as memory anchors for composition: bottom nav, town view, roster lists, inventory grids.)

Judging rubric (score 1-10 each, EHT = 8 baseline):
1. Visual polish & juice (motion, feedback, density, pixel art quality)
2. Idle loop satisfaction (rate of rewards, progression cadence, offline value)
3. System depth & coherence (hunters/equip/buildings/meta interplay)
4. Writing & atmosphere (zh-TW flavor, micro-copy, worldbuilding)
5. Mobile UX (thumb reach, tap targets, information hierarchy, scroll)
6. Performance & stability (console clean, no jank, tab-switch)

Verdict format (JSON):
{ "scores": {...}, "overall": 1-10, "pass": bool, "singleBiggestGap": "one sentence", "fixInstructions": ["concrete, ordered steps for the builder"], "evidence": ["what you observed in browser"] }
