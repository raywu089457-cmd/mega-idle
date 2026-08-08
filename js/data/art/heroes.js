/* 放置王國 MEGA IDLE — hero art, hand-drawn 16x16 (slice B7 owns).
   Each hero: 3 frames [idle0, idle1 bob, attack], rate 280ms.
   Palette keys: single chars; O = outline #14121f. Rows exactly 16 chars.
   Silhouette rule: 6 classes must differ at a glance —
   劍士 bandana+point-down sword / 弓手 pointed hood+bow / 法師 pointy hat+orb staff
   刺客 crouch+twin daggers / 騎士 plume helm+shield / 牧師 hood+cross staff.
   Villagers (12x12, 2 walk frames) live here too for the kingdom town overlay. */
"use strict";
MG.art = MG.art || {};
MG.art.heroes = {
  /* ---------- 劍士 sword — bandana, steel tunic, sword resting point-down ---------- */
  h_sword: {
    w: 16, h: 16, rate: 280,
    pal: {
      O: "#14121f", S: "#e8b48c", H: "#4a2f1a",
      T: "#3f5f8a", A: "#ffd166", W: "#d8dce8", X: "#8a90a8",
      P: "#2a2f45", B: "#3a2a1a"
    },
    framesRows: [
      /* idle0 — sword held at side, blade down, bandana tail */
      [
        "......OOOO......",
        ".....OHHHHO.....",
        ".....OAHHHO.....",
        ".....OS.SSO.....",
        ".....OSSSSO.....",
        "....OTTTTTO.....",
        "...OTTTTTTTWW...",
        "...OTTTTTTTWX...",
        "...OTTTTTTTWX...",
        "...OTTTTTTTWX...",
        "...OTTTTTTTO....",
        "...OPP..PPO.....",
        "...OPP..PPO.....",
        "..OOPPOOPPO.....",
        "..OOO..OOO......",
        "................"
      ],
      /* idle1 bob — feet lifted */
      [
        "......OOOO......",
        ".....OHHHHO.....",
        ".....OAHHHO.....",
        ".....OS.SSO.....",
        ".....OSSSSO.....",
        "....OTTTTTO.....",
        "...OTTTTTTTWW...",
        "...OTTTTTTTWX...",
        "...OTTTTTTTWX...",
        "...OTTTTTTTWX...",
        "...OTTTTTTTO....",
        "...OPP..PPO.....",
        "...OPP..PPO.....",
        "..OOPPOOPP......",
        "................",
        "................"
      ],
      /* attack — diagonal slash across, blade "/" from guard to low-left */
      [
        "......OOOO......",
        ".....OHHHHO.....",
        ".....OAHHHO....W",
        ".....OS.SSO...W.",
        ".....OSSSSO..W..",
        "....OTTTTTOW....",
        "...OTTTTTTW.....",
        "...OTTTTTTTO....",
        "...OTTTTTTTO....",
        "...OTTTTTTTO....",
        "...OPP..PPO.....",
        "...OPP..PPO.....",
        "...OPP..PPO.....",
        "..OOPPOOPPO.....",
        "..OOO..OOO......",
        "................"
      ]
    ]
  },

  /* ---------- 弓手 archer — pointed hood, quiver, drawn bow arc ---------- */
  h_archer: {
    w: 16, h: 16, rate: 280,
    pal: {
      O: "#14121f", S: "#e8b48c",
      T: "#3f7a4a", A: "#7ee787", W: "#8a5a3a", X: "#e8e8e8",
      P: "#2f4a2f", B: "#4a3a2a"
    },
    framesRows: [
      /* idle0 — hood, quiver arrows left, bow arc + string right */
      [
        "......TT........",
        ".....TTTT.......",
        "....TTTTTT......",
        "....OTTTTO......",
        "..A.OSSSSO......",
        "..X.OSS.SSO.....",
        "..X.OSSSSSO.....",
        "..X.OTTTTTO.XW..",
        "..X.OTTTTTTOXW..",
        "....OTTTTTTOXW..",
        "....OPP..PPOXW..",
        "....OPP..PPOXW..",
        "....OPP..PPOXW..",
        "...OOPPOOPPXW...",
        "...OOO..OOO.....",
        "................"
      ],
      /* idle1 bob — feet lifted */
      [
        "......TT........",
        ".....TTTT.......",
        "....TTTTTT......",
        "....OTTTTO......",
        "..A.OSSSSO......",
        "..X.OSS.SSO.....",
        "..X.OSSSSSO.....",
        "..X.OTTTTTO.XW..",
        "..X.OTTTTTTOXW..",
        "....OTTTTTTOXW..",
        "....OPP..PPOXW..",
        "....OPP..PPOXW..",
        "....OPP..PPOXW..",
        "...OOPPOOPP.....",
        "................",
        "................"
      ],
      /* attack — arrow nocked and drawn across the chest */
      [
        "......TT........",
        ".....TTTT.......",
        "....TTTTTT......",
        "....OTTTTO......",
        "..A.OSSSSO......",
        "..X.OSS.SSO.....",
        "..X.OSSSSSO.....",
        "..X.OTTTTTO.....",
        "..X.OTTTTTTO....",
        "..X.OTTTTTTXXXXA",
        "....OPP..PPOXW..",
        "....OPP..PPOXW..",
        "....OPP..PPOXW..",
        "...OOPPOOPPXW...",
        "...OOO..OOO.....",
        "................"
      ]
    ]
  },

  /* ---------- 法師 mage — pointy hat, floor robe, staff with glowing orb ---------- */
  h_mage: {
    w: 16, h: 16, rate: 280,
    pal: {
      O: "#14121f", S: "#f0c8a0",
      T: "#6a4a8a", A: "#c792ea", W: "#8a5a3a", L: "#ffe08a", P: "#3a2a4a"
    },
    framesRows: [
      /* idle0 — wide-brim pointy hat, robe flares to ground, orb atop staff */
      [
        "......OOO.......",
        ".....OTTTTO.....",
        "....OTTTTTTO....",
        "....OTTTTTTO....",
        "...OOTTTTTOO....",
        "....OSSSSSO.....",
        "....OSS.SSO.....",
        "....OSSSSSO.....",
        "...OTTTTTTTO.L..",
        "...OTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        ".OTTTTTTTTTTO.W.",
        ".OOTTTTTTTTTOO..",
        "................"
      ],
      /* idle1 bob — robe shifts up one */
      [
        "......OOO.......",
        ".....OTTTTO.....",
        "....OTTTTTTO....",
        "....OTTTTTTO....",
        "...OOTTTTTOO....",
        "....OSSSSSO.....",
        "....OSS.SSO.....",
        "....OSSSSSO.....",
        "...OTTTTTTTO.L..",
        "...OTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        ".OTTTTTTTTTTO.W.",
        "................",
        "................"
      ],
      /* attack — staff raised, orb blazing with sparkles */
      [
        "......OOO...L...",
        ".....OTTTTO.L...",
        "....OTTTTTTO....",
        "....OTTTTTTO....",
        "...OOTTTTTOO....",
        "....OSSSSSO.....",
        "....OSS.SSO.....",
        "....OSSSSSO.....",
        "....OTTTTTTOL...",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        ".OTTTTTTTTTTO.W.",
        ".OOTTTTTTTTTOO..",
        "................"
      ]
    ]
  },

  /* ---------- 刺客 assassin — crouched, rose mask, twin daggers ---------- */
  h_assassin: {
    w: 16, h: 16, rate: 280,
    pal: {
      O: "#14121f", S: "#e8d8c0",
      T: "#3a3a4a", A: "#ff6b9d", W: "#d8dce8", X: "#8a90a8",
      P: "#1a1a2a", B: "#2a2a3a"
    },
    framesRows: [
      /* idle0 — low crouch, daggers held at both sides */
      [
        "......OOOO......",
        ".....OTTTTO.....",
        "....OTTTTTTO....",
        "....OSSSSSO.....",
        "....OAAAAAO.....",
        "....OTTTTTO.....",
        "...OTTTTTTTO....",
        "...OTTTTTTTO....",
        "..WOTTTTTTTOW...",
        "..XOTTTTTTTOX...",
        "..XOTTTTTTTOX...",
        "..XOPTTTTPOX....",
        ".OPP...PPO......",
        ".OPP...PPO......",
        "OOO.....OOO.....",
        "................"
      ],
      /* idle1 bob — sink one more */
      [
        "......OOOO......",
        ".....OTTTTO.....",
        "....OTTTTTTO....",
        "....OSSSSSO.....",
        "....OAAAAAO.....",
        "....OTTTTTO.....",
        "...OTTTTTTTO....",
        "...OTTTTTTTO....",
        "..WOTTTTTTTOW...",
        "..XOTTTTTTTOX...",
        "..XOTTTTTTTOX...",
        "..XOPTTTTPOX....",
        ".OPP...PPO......",
        "OOO.....OOO.....",
        "................",
        "................"
      ],
      /* attack — twin daggers thrust forward */
      [
        "......OOOO......",
        ".....OTTTTO.....",
        "....OTTTTTTO....",
        "....OSSSSSO.....",
        "....OAAAAAO.....",
        "....OTTTTTO.....",
        "...OTTTTTTTO....",
        "...OTTTTTTTO....",
        ".TTWWWWWX.......",
        "...OTTTTTTTO....",
        ".TTWWWWWX.......",
        "...OPP..PPO.....",
        "..OPP....PPO....",
        ".OPP......PPO...",
        "OOO........OOO..",
        "................"
      ]
    ]
  },

  /* ---------- 騎士 knight — plume helm, kite shield, vertical sword ---------- */
  h_knight: {
    w: 16, h: 16, rate: 280,
    pal: {
      O: "#14121f", S: "#8a9ab0",
      A: "#ffd166", W: "#d8dce8", X: "#8a90a8",
      P: "#4a5a6a", B: "#6a7a8a"
    },
    framesRows: [
      /* idle0 — shield on left arm, sword raised on the right */
      [
        ".....AAAA.......",
        "......OOO.......",
        ".....OSSSSO.....",
        ".....OSASSO.....",
        ".....OSSSSO.....",
        "....OSSSSSSO....",
        ".OAAAAAAOSSSSO.W",
        ".OAWWWWWOSSSSOX.",
        ".OAWWWWWOSSSSOX.",
        ".OAWWAWWOSSSSOX.",
        ".OAWWWWWOSSSSOX.",
        ".OAWWWWWOSSSSOX.",
        ".OAAAAAAOSSSSOX.",
        "...OSSSSSSO..X..",
        "...OPP..PPO...A.",
        "................"
      ],
      /* idle1 bob — sinks one pixel */
      [
        "................",
        ".....AAAA.......",
        "......OOO.......",
        ".....OSSSSO.....",
        ".....OSASSO.....",
        ".....OSSSSO.....",
        "....OSSSSSSO....",
        ".OAAAAAAOSSSSO.W",
        ".OAWWWWWOSSSSOX.",
        ".OAWWWWWOSSSSOX.",
        ".OAWWAWWOSSSSOX.",
        ".OAWWWWWOSSSSOX.",
        ".OAWWWWWOSSSSOX.",
        ".OAAAAAAOSSSSOX.",
        "...OSSSSSSO..X..",
        "...OPP..PPO....."
      ],
      /* attack — sword slashes wide to the right, shield held forward */
      [
        ".....AAAA.......",
        "......OOO.......",
        ".....OSSSSO.....",
        ".....OSASSO.....",
        ".....OSSSSO.....",
        "....OSSSSSSO....",
        ".OAAAAAAOSSSSO..",
        ".OAWWWWWOSSSSOWW",
        ".OAWWWWWOSSSSOXW",
        ".OAWWAWWOSSSSOXW",
        ".OAWWWWWOSSSSOX.",
        ".OAWWWWWOSSSSOX.",
        ".OAAAAAAOSSSSOX.",
        "...OSSSSSSO..X..",
        "...OPP..PPO.....",
        "................"
      ]
    ]
  },

  /* ---------- 牧師 priest — hood, cream robe, cross-headed staff ---------- */
  h_priest: {
    w: 16, h: 16, rate: 280,
    pal: {
      O: "#14121f", S: "#f0d8b8",
      T: "#e8d8a8", A: "#ffd166", W: "#8a6a4a", P: "#b0a060"
    },
    framesRows: [
      /* idle0 — round hood, robe, staff topped with a cross */
      [
        "......OOOO......",
        ".....OTTTTO.....",
        "....OTTTTTTO....",
        "....OSSSSSO.....",
        "....OSS.SSO.....",
        "....OSSSSSO.....",
        "...OTTTTTTTO.A..",
        "...OTTTTTTTOAAA.",
        "...OTTTTTTTO.A..",
        "...OTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        ".OTTTTTTTTTTO.W.",
        ".OOTTTTTTTTTOO..",
        "................"
      ],
      /* idle1 bob — robe shifts up one */
      [
        "......OOOO......",
        ".....OTTTTO.....",
        "....OTTTTTTO....",
        "....OSSSSSO.....",
        "....OSS.SSO.....",
        "....OSSSSSO.....",
        "...OTTTTTTTO.A..",
        "...OTTTTTTTOAAA.",
        "...OTTTTTTTO.A..",
        "...OTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        ".OTTTTTTTTTTO.W.",
        "................",
        "................"
      ],
      /* attack — cross staff swung forward with a holy glow */
      [
        "......OOOO......",
        ".....OTTTTO.....",
        "....OTTTTTTO....",
        "....OSSSSSO.....",
        "....OSS.SSO.....",
        "....OSSSSSO.....",
        "...OTTTTTTTO.A..",
        "...OTTTTTTTAAA..",
        "...OTTTTTTT.A...",
        "...OTTTTTTT.W...",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        "..OTTTTTTTTO..W.",
        ".OTTTTTTTTTTO.W.",
        ".OOTTTTTTTTTOO..",
        "................"
      ]
    ]
  },

  /* ---------- 村民 villager 1 — straw hat peasant, 2 walk frames ---------- */
  h_villager_1: {
    w: 12, h: 12, rate: 280,
    pal: {
      O: "#14121f", S: "#e8b48c", T: "#8a6a4a",
      A: "#e8c878", P: "#4a3a2a", B: "#3a2a1a"
    },
    framesRows: [
      [
        "....AAAA....",
        "...AAAAAA...",
        "...OSSSSO...",
        "...OS.SSO...",
        "...OTTTTO...",
        "...OTTTTO...",
        "..OTTTTTO...",
        "..OPP.PPO...",
        "..OPP.PPO...",
        "..BB..BB....",
        "............",
        "............"
      ],
      [
        "....AAAA....",
        "...AAAAAA...",
        "...OSSSSO...",
        "...OS.SSO...",
        "...OTTTTO...",
        "...OTTTTO...",
        "..OTTTTTO...",
        "..OPP..PPO..",
        "..OPP..PPO..",
        "..BB....BB..",
        "............",
        "............"
      ]
    ]
  },

  /* ---------- 村民 villager 2 — headscarf woman, skirt, 2 walk frames ---------- */
  h_villager_2: {
    w: 12, h: 12, rate: 280,
    pal: {
      O: "#14121f", S: "#f0c8a0", T: "#c05c5c",
      A: "#e8d8a8", P: "#8a3a3a", B: "#4a2a2a"
    },
    framesRows: [
      [
        "....AAAAAA..",
        "...OSSSSO...",
        "...OS.SSO...",
        "..OTTTTTO...",
        ".OTTTTTTO...",
        ".OTTTTTTO...",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        "..OO..OO....",
        "............",
        "............"
      ],
      [
        "....AAAAAA..",
        "...OSSSSO...",
        "...OS.SSO...",
        "..OTTTTTO...",
        ".OTTTTTTO...",
        ".OTTTTTTO...",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        "...OO..OO...",
        "............",
        "............"
      ]
    ]
  }
};
