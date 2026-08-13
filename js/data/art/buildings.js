/* 放置王國 MEGA IDLE — hand-drawn building pixel art (slice B6)
   10 unique 32x32 structures, each matching its role. Static (rate 0). */
"use strict";
MG.art = MG.art || {};
MG.art.buildings = {
  b_castle: {
    w: 32, h: 32, rate: 0,
    rows: [
      "................................",
      ".....R.....................R....",
      "...RR.R..................RR.R...",
      "..R....R................R....R..",
      ".OOOOOOOO..............OOOOOOOO.",
      ".OBBBBBBOBB.BB.BB.BB.BBOBBBBBBO.",
      ".OBBBBBBOOO.OO.OO.OO.OOOBBBBBBO.",
      ".OBBBBBBOOOOOOOOOOOOOOOOBBBBBBO.",
      ".OBBBBBBORRRRRRRRRRRRROOBBBBBBO.",
      ".OBWWWWBOBBBBBBBBBBBBBOOBWWWWBO.",
      ".OBWWWWBOBBBBBBBBBBBBBOOBWWWWBO.",
      ".OBOOOOBOBBWWWBBBBWWWBOOBOOOOBO.",
      ".OBBBBBBOBBWOWBBBBWOWBOOBBBBBBO.",
      ".OBBBBBBOBBWOWBBBBWOWBOOBBBBBBO.",
      ".OBBBBBBOBBOOOBBBBOOOBOOBBBBBBO.",
      ".OBBBBBBOGGGGGGGGGGGGGOOBBBBBBO.",
      ".OBBBBBBOBBBBBBBBBBBBBOOBBBBBBO.",
      ".OBWWWWBOBBBBBWWWWBBBBOOBWWWWBO.",
      ".OBWWWWBOBBBBBBOOOBBBBOOBWWWWBO.",
      ".OBOOOOBOBBBBOOOOOOBBBOOBOOOOBO.",
      ".OBBBBBBOBBBBODDDDOBBBOOBBBBBBO.",
      ".OBWWWWBOBBBBOKKKKOBBBOOBWWWWBO.",
      ".OBWWWWBOBBBBODDDDOBBBOOBWWWWBO.",
      ".OBOOOOBOBBBBOKKKKOBBBOOBOOOOBO.",
      ".OOOOOOOOBBBBODDDDOBBBOOOOOOOOO.",
      "........OOOOOOOOOOOOOOO.........",
      "................................",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      ".DDDDDDDDDDDDDDDDDDDDDDDDDDDDDD.",
      "................................",
      "................................",
      "................................"
    ],
    pal: {
      "O": "#14121f",
      "B": "#6a7288",
      "D": "#4a5068",
      "W": "#7ec8e8",
      "R": "#8a4a3a",
      "G": "#ffd166",
      "K": "#4a2f1a"
    }
  },

  b_castle_iso: {
    w: 64, h: 48, rate: 0,
    pal: {
      O: "#14121f", "1": "#8a90a8", "2": "#6a7088", "3": "#565a68",
      "4": "#4a5060", "5": "#3a3f4c", "6": "#2e323c",
      T: "#9aa0b0", U: "#7a8090", C: "#a04848", c: "#703030",
      G: "#d0a040", B: "#4a3520", H: "#6a4a2a", W: "#ffe8a0", S: "#4a4e58"
    },
    rows: [
      "................................................................",
      "................................................................",
      "................................OGGGGGO.........................",
      "................................OGGGGGO.........................",
      "................................O...............................",
      "................................O...............................",
      "................................................................",
      "................................................................",
      "................................................................",
      "............................CCCCCCCCC...........................",
      "...........................ccccccccccc..........................",
      "..........................CCCCCCCCCCCCC.........................",
      ".........................cccccCCCCCccccc........................",
      "........................CCCCCcccccccCCCCC.......................",
      ".......................cccccCCCCCCCCCccccc......................",
      "......................CCCCCcccccccccccCCCCC.....................",
      ".....................cccccCCCCCCCCCCCCCccccc....................",
      "....................CCCCCcc1111cc4444cccCCCCC...................",
      "...........C.......ccccc1111111CO4444444Cccccc.......C..........",
      "..........CCC.....CCCC111111111UU444444444CCCCC.....CCC.........",
      ".........ccccc...cc111111111UUUUOUUU444444444ccc...ccccc........",
      "........CCCCCCC.1111111111UUUOTTTTTOUU4444444444..CCCCCCC.......",
      ".......ccccccccc1111111UUUOTTTTTTTTTTTOUU44444444ccccccccc......",
      "......CCCCCCCCCCC111UUUUOTTTTTTTTTTTTTTTOUUU4444CCCCCCCCCCC.....",
      ".....cccccccccccccUUUOTTTTTTTTTTTTTTTTTTTTTOUU4ccccccccccccc....",
      "....CCCCCCCCCCCCCCCTTTTTTTTTTTTTTTTTTTTTTTTTTTCCCCCCCCCCCCCCC...",
      "...cccccccccccccccccTTTTTTTTTTTTTTTTTTTTTTTTTccccccccccccccccc..",
      "......111OTTTO444UOTTTTTTTTTTTTTTTTTTTTTTTTTTTOU111OTTTO444.....",
      "......11111O44444UUUUOTTTTTTTTTTTTTTTTTTTTTOUUUU11111O44444.....",
      "......1111WWW444422OUUUUOTTTTTTTTTTTTTTTOUUUUO221111WWW4444.....",
      "......1111WWW444422222OUUUOTTTTTTTTTTTOUUUO222221111WWW4444.....",
      "......111114444442222222OUUUUOTTTTTOUUUUO222222211111444444.....",
      "......111114444442222222222OUUUUOUUUUO222222222211111444444.....",
      "......11111444444222222222222OTTTTTO22222222222211111444444.....",
      "......11111444444222222222OTTTTTTTTTTTO22222222211111444444.....",
      "........111444422222222222222OTTTTTO555222222222221114444.......",
      "........O332222222222222222222HOHOH555522222222222222233O.......",
      ".....O33SSS2222222222222222222BHHHB5555222222222222222SSS33O....",
      "........O333333333333333332222BHHHB555533333333333333333O.......",
      "..........O333333333333333222BBHHHGB555333333333333333O.........",
      ".............O333333333333222BBHHHGB555333333333333O............",
      "................O333333333222BBBBBBB555333333333O...............",
      "..................OSSSSSSS222BBBBBBB555SSSSSSSO.................",
      ".....................O333333322255553333333O....................",
      "........................O333333333333333O.......................",
      "...........................O333333333O..........................",
      ".............................O33333O............................",
      "................................O...............................",
    ]
  },
  b_house_iso: {
    w: 20, h: 16, rate: 0,
    pal: {
      O: "#14121f", "1": "#8a90a8", "4": "#4a5060",
      C: "#a04848", c: "#703030", B: "#4a3520", W: "#ffe8a0"
    },
    rows: [
      "....................",
      "....................",
      "..........C.........",
      ".....CCCCCCCCCCC....",
      "..OcccccccCcccccccO.",
      ".CCCCCcccccccccCCCCC",
      ".111CCCCCCcCCWWCC444",
      ".111BBBCCCCCCWW44444",
      ".111BBB111C44WW44444",
      ".111BBB1114444444444",
      ".111BBB1.....4444444",
      ".111BBB.........4444",
      "....................",
      "....................",
      "....................",
      "....................",
    ]
  },

  b_guild: {
    w: 32, h: 32, rate: 0,
    rows: [
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................R...............",
      "..............OOOOR.............",
      ".............RRRRRRR..O.........",
      "...........RRRRRRRRRR.OAAAA.....",
      "..........RRRRRRRRRRRROAAAA.....",
      ".........RRRRRRRRRRRRROAAAA.....",
      ".......RRRRRRRRRRRRRRROAAA......",
      "......RRRRRRRRRRRRRRRRORRRR.....",
      ".....RRRRRRRRRRRRRRRRRRRRRRR....",
      "..ORRRRRRRRRRRRRRRRRRRRRRRRRRO..",
      "..OOOGGGGGGGGGGGGGGGGGGGGGGOOOO.",
      "....OBBBBBBBBBBBBBBBBBBBBBBO....",
      "....OBBBBBBBBBBBBBBBBBBBBBBO....",
      "....OBBBBWWWBBBBBBBBWWWBBBBO....",
      "....OBBBBWOWBBBBBBBBWOWBBBBO....",
      "....OBBBBWOWBBOOOOBBWOWBBBBO....",
      "....OBBBBOOOBBOKKOBBOOOBBBBO....",
      "....OBBBBBBBBBOKKOBBBBBBBBBO....",
      "....OBBBBBBBBBOKKOBBBBBBBBBO....",
      "....OBBBBBBBBBOKKOBBBBBBBBBO....",
      "....OBBBBBBBBBOKKOBBBBBBBBBO....",
      "....OOOOOOOOOOOOOOOOOOOOOOOO....",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "................................",
      "................................",
      "................................"
    ],
    pal: {
      "O": "#14121f",
      "B": "#8a6a4a",
      "R": "#3a5a8a",
      "A": "#e85c4a",
      "W": "#ffe08a",
      "K": "#5a3a20",
      "G": "#d8c8a0",
      "D": "#4a5068"
    }
  },
  b_training: {
    w: 32, h: 32, rate: 0,
    rows: [
      "................................",
      "................................",
      "................G...............",
      "...............ROR..............",
      "................R...............",
      ".............RRRRRR.............",
      "............RRRRRRRRR...........",
      "..........RRRRRRRRRRRRR.........",
      ".........RRRRRRRRRRRRRRR........",
      ".......RRRRRRRRRRRRRRRRRRR......",
      ".....RRRRRRRRRRRRRRRRRRRRRRR....",
      "...ORRRRRRRRRRRRRRRRRRRRRRRRR...",
      "....ORRRRRRRRRRRRRRRRRRRRRRO....",
      "................................",
      "....ORRRRRRRRRRRRRRRRRRRRRRO....",
      "....OOOOOOOOOOOOOOOOOOOOOOOO....",
      "......OBBBBBBBBBBBBBBBBBBO......",
      "......OBBBBBBBBBBBBBBBBBBO......",
      "..DOO.OBWWWBBBBBBBBBBWWWBO......",
      "..OOO.OBWWWBBBBBBBBBBWWWBO......",
      "...DODOBOOOBBBBBBBBBBOOOBO......",
      "...DODOBBBBBBBOOOOBBBBBBBO......",
      "...DOOOBBBBBBBOKKOBBBBBBBO......",
      "...DO.OBBBBBBBOKKOBBBBBBBO......",
      "...OO.OBBBBBBBOKKOBBBBBBBO......",
      "......OBBBBBBBOKKOBBBBBBBO......",
      "......OBBBBBBBOKKOBBBBBBBO......",
      "......OOOOOOOOOOOOOOOOOOOO......",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "................................",
      "................................",
      "................................"
    ],
    pal: {
      "O": "#14121f",
      "B": "#7a5a3a",
      "R": "#8a3a3a",
      "D": "#5a3a24",
      "W": "#ffe08a",
      "K": "#4a2f1a",
      "G": "#ffd166"
    }
  },
  b_forge: {
    w: 32, h: 32, rate: 0,
    rows: [
      "................................",
      "................................",
      ".......................S........",
      ".....................S..........",
      "......................S.........",
      "................................",
      "...................OBBBBO.......",
      "....................OBBO........",
      "....................OFFO........",
      "....................OFBO........",
      "....................ORRO........",
      "....................OBBO........",
      "....................OBBO........",
      "....................OBBO........",
      "....................OBBO........",
      "....OBBBBBBBBBBBBBBROOOORBBO....",
      ".....ODDDDDDDDDDDDDDDDDDDDO.....",
      ".....ODDDDDDDDDDDDDDDDDDDDO.....",
      ".....ODDDDDDDDDDDDDDDDDDDDO.....",
      ".....ODDBBBBBBDDDDDDDDDDDDO.....",
      ".....ODDDDDDDDDDDDDDDDDDDDO.....",
      ".....ODDDDDDDDDDBBBBBDDDDDO.....",
      ".....ODDOFOOFODDDDDDDDDDDDOO....",
      ".....ODBORRRRODDDDDDDDDDDDOBB...",
      ".....ODDOFFFFODDDDDDDDDDDDBBBB..",
      ".....ODDORRRRODDDDDDBBBBBDOBB...",
      ".....ODDOFOOFODDDDDDDDDDDDO.....",
      ".....OOOOOOOOOOOOOOOOOOOOOO.....",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "................................",
      "................................",
      "................................"
    ],
    pal: {
      "O": "#14121f",
      "D": "#3a3a42",
      "B": "#5a5a5a",
      "F": "#ffb35c",
      "R": "#ff7a2a",
      "S": "#9aa0b8"
    }
  },
  b_gemworks: {
    w: 32, h: 32, rate: 0,
    rows: [
      "................................",
      "................................",
      "................................",
      "...............C................",
      "...............LC...............",
      "..............L.L...............",
      "..............C.LC..............",
      ".............C.L.C..............",
      "............LCCCCCCL............",
      ".............CCCCCC.............",
      ".............OOOOOO.............",
      ".........OBBBBBBBBBBBBO.........",
      "..........OBBBBBBBBBBO..........",
      "..........OBBBBBBBBBBO..........",
      "..........OBBWWBBWWBBO..........",
      "..........OBBWWBBWWBBO..........",
      "..........OBBOOBBOOBBO..........",
      "..........OBBBBBBBBBBO..........",
      "..........OBBBBBBBBBBO..........",
      "..........OBBWWBBWWBBO..........",
      "..........OBBWWBBWWBBO..........",
      "..........OBBOOBBOOBBO.C........",
      "........C.OBBBBBBBBBBOC.........",
      ".........COBBBBBBBBBBO.C........",
      "........C.OBBBWWWWBBBO..........",
      "..........OBBBOKKOBBBO..........",
      "..........OBBBOKKOBBBO..........",
      "..........OOOOOOOOOOOO..........",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "................................",
      "................................",
      "................................"
    ],
    pal: {
      "O": "#14121f",
      "B": "#5a5a7a",
      "C": "#b08aff",
      "L": "#d8c0ff",
      "W": "#9ad8ff",
      "K": "#2a2a3a",
      "D": "#4a5068"
    }
  },
  b_alchemy: {
    w: 32, h: 32, rate: 0,
    rows: [
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................L...............",
      "...............LOL..............",
      "................R...............",
      ".............RRRRRR.............",
      "............RRRRRRRR............",
      "...........RRRRRRRRRR...........",
      "..........RRRRRRRRRRRRR..OOOO...",
      ".........RRRRRRRRRRRRRRR.OLLO...",
      "........RRRRRRRRRRRRRRRRROLLO...",
      ".......RRRRRRRRRRRRRRRRRROOOO...",
      ".....RRRRRRRRRRRRRRRRRRRGRR...G.",
      "....RRRRRRRRRRRRRRRRRRRRGLRR..G.",
      "....ORRRRRRRRRRRRRRRRRRRGRRL..G.",
      ".....OBBBBBBBBBBBBBBBBBGLBO....G",
      ".....OBBBBBBBBBBBBBBBBOGGGGGGGGO",
      ".....OBBWWWBBBBBBBBBBWOGGGGGGGGO",
      ".....OBBWOWBBBBOOOBBBWOGGGGGGGGO",
      ".....OBBWOWBBBOOOOBBBWOOOOOOOOOO",
      ".....OBBOOOBBBOKKOBBBOOODDDDDDO.",
      ".....OBBBBBBBBOKKOBBBBBBBBO.....",
      ".....OBBBBBBBBOKKOBBBBBBBBO.....",
      ".....OBBBBBBBBOKKOBBBBBBBBO.....",
      ".....OOOOOOOOOOOOOOOOOOOOOO.....",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "................................",
      "................................",
      "................................"
    ],
    pal: {
      "O": "#14121f",
      "B": "#5a7a4a",
      "R": "#3a6a3a",
      "W": "#b0ff9a",
      "L": "#d8ffd0",
      "G": "#7ee787",
      "D": "#2f4a2a",
      "K": "#2a3a1a"
    }
  },
  b_library: {
    w: 32, h: 32, rate: 0,
    rows: [
      "................................",
      "................................",
      "................................",
      "................................",
      "................RR..............",
      ".............RRRRRRR............",
      "...........RRRRRRRRRRR..........",
      ".........RRRRRRRRRRRRRRR........",
      ".......RRRRRRRRRRRRRRRRRRR......",
      ".....RRRRRRRRRRRRRRRRRRRRRRR....",
      "....OOOOOOOOOOOOOOOOOOOOOOOOR...",
      "....OOODDDDOODDDDOODDDDOOO......",
      ".....CODDDDDDDDDDDDDDDDDDDD.....",
      ".....CODDDDDDDDDDDDDDDDDDDD.....",
      ".....CODDDDDDDDDDDDDDDDDDDD.....",
      ".....CODDDDDDDDDDDDDDDDDDDD.....",
      ".....CODDDDDDDDDDDDDDDDDDDD.....",
      ".....CODDDDDDDDDDDDDDDDDDDD.....",
      ".....CODDDDDDDDDDDDDDDDDDDD.....",
      ".....CODDDDDDOOOOOODDDDDDDD.....",
      ".....CODDDDDDOGGGGODDDDDDDD.....",
      ".....CODDDDDDOKKKKODDDDDDDD.....",
      ".....CODDDDDDOKKKKODDDDDDDD.....",
      ".....CODDDDDDOKKKKODDDDDDDD.....",
      ".....CODDDDDDOKKKKODDDDDDDD.....",
      "...OOOOOOOOOOOOOOOOOOOOOOOOOO...",
      "...CCCCCCCCCCCCCCCCCCCCCCCCCC...",
      "..OOOOOOOOOOOOOOOOOOOOOOOOOOOO..",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "................................",
      "................................",
      "................................"
    ],
    pal: {
      "O": "#14121f",
      "C": "#e8e8f0",
      "R": "#3a4a8a",
      "D": "#5a5a7a",
      "K": "#4a2f1a",
      "G": "#ffd166"
    }
  },
  b_warehouse: {
    w: 32, h: 32, rate: 0,
    rows: [
      "................................",
      "................................",
      "................................",
      "................................",
      "...............ROR..............",
      "................R...............",
      ".............RRRRRR.............",
      "............RRRRRRRRR...........",
      "..........RRRRRRRRRRRR..........",
      "......WWWRRRRRRRRRRRRRRWWW......",
      "......WWWRRRRRRRRRRRRRRWWW......",
      "......OOORRRRRRRRRRRRRROOOR.....",
      "....RRRRRRRRRRRRRRRRRRRRRRRRR...",
      "..RRRRRRRRRRRRRRRRRRRRRRRRRRRRR.",
      ".ORRRRRRRRRRRRRRRRRRRRRRRRRRRROR",
      "..OBBBBBBBBBBBBBBBBBBBBBBBBBBO..",
      "..OBBBBBBBBBBBBBBBBBBBBBBBBBBO..",
      "..OBDDDDDDDDDDDDDDDDDDDDDDDDBO..",
      "..OBBBBBBBBBBBBBBBBBBBBBBBBBBO..",
      "..OBBBBBBBBBOOOOOOOOBBBBBBBBBO..",
      "..OBBBBBBBBBOKKOOKKOBBBBBBBBBO..",
      "..OBBWWWBBBBOKKOOKKOBBBBWWWBBO..",
      "..OBBWWWBBBBOKKOOKKOBBBBWWWBBO..",
      "..OBDDDDDDDDDDDDDDDDDDDDDDDDBO..",
      "..OBBBBBBBBBOKKGGKKOBBBBBBBBBO..",
      "..OBBBBBBBBBOKKOOKKOBBBBBBBBBO..",
      "..OBBBBBBBBBOKKOOKKOBBBBBBBBBO..",
      "..OOOOOOOOOOOOOOOOOOOOOOOOOOOO..",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "................................",
      "................................",
      "................................"
    ],
    pal: {
      "O": "#14121f",
      "B": "#7a6a4a",
      "R": "#6a5a4a",
      "D": "#5a4a34",
      "W": "#d8c89a",
      "K": "#4a3a2a",
      "G": "#c8a060"
    }
  },
  b_altar: {
    w: 32, h: 32, rate: 0,
    rows: [
      "................................",
      "................R...............",
      "...............ROR..............",
      "................R...............",
      "..............RRRR..............",
      ".............RRRRRR.............",
      "............RRRRRRRR............",
      "...........RRRRRRRRRRR..........",
      "..........RRRRRRRRRRRRR.........",
      ".........RRRRRRRRRRRRRRR........",
      "........RRRRRRRRRRRRRRRRR.......",
      "......RRRRRRRRRRRRRRRRRRRR......",
      ".....RRRRRRRRRRRRRRRRRRRRRR.....",
      "......OOOOOOOOOOOOOOOOOOOOR.....",
      "......OBBBBBBBBBBBBBBBBBBO......",
      "......OBBFFFBBBBBBBBFFFBBO......",
      "......OBBFFFBBBBBBBBFFFBBO......",
      "......OBBFFFBFFFFFFBFFFBBO......",
      "......OBBOOOBBBBBBBBOOOBBO......",
      "......OBGGGGGGGGGGGGGGGGBO......",
      "......OBBBBBBBOOOOOBBBBBBO......",
      "......OBBBBBBOOOOOOBBBBBBO......",
      "...F.FRBBBBBBOKKKKOBBBBBBRF.F...",
      "....FOOBBBBBBOKKKKOBBBBBBOOF....",
      "....FOOBBBBBBOKKKKOBBBBBBOOF....",
      "....OOOBBBBBBOKKKKOBBBBBBOOO....",
      "....OOOBBBBBBOKKKKOBBBBBBOOO....",
      "......OOOOOOOOOOOOOOOOOOOO......",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "................................",
      "................................",
      "................................"
    ],
    pal: {
      "O": "#14121f",
      "B": "#3a3a4a",
      "R": "#5a2a3a",
      "F": "#ff5c5c",
      "K": "#2a1a2a",
      "G": "#ffd166",
      "D": "#2a2a38"
    }
  },
  b_market: {
    w: 32, h: 32, rate: 0,
    rows: [
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "...............O................",
      "...............OO...............",
      "..............AAAA..............",
      "..OOOOOOOOOOOOOOOOOOOOOOOOOOOO..",
      "...RRRRRRRRRRRRRRRRRRRRRRRRRRA..",
      "...RRRRRRRRRRRRRRRRRRRRRRRRRRA..",
      "...OOOOOOOOOOOOOOOOOOOOOOOOOO...",
      "...BO......................OB...",
      "...BO................FFFFFFOB...",
      "...BO..GLGLG...CWCWC..OOOO.OB...",
      "...BOOBBBBBBBBBBBBBBBBBBBBOOB...",
      "...BOOBBBBBBBBBBBBBBBBBBBBOOB...",
      "...BOOOOOOOOOOOOOOOOOOOOOOOOB...",
      "...BO......................OB...",
      "...BO......................OB...",
      "...BOOBBBBO..........OBBBBOOB...",
      "...BOOBBBBO..........OBBBBOOB...",
      "...BOODDDDO..........ODDDDOOB...",
      "...BOOBBBBO..........OBBBBOOB...",
      "...BOOOOOOO..........OOOOOOOB...",
      "...OO......................OO...",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "................................",
      "................................",
      "................................"
    ],
    pal: {
      "O": "#14121f",
      "B": "#8a7a4a",
      "A": "#e85c4a",
      "R": "#d8b860",
      "G": "#7ee787",
      "L": "#b0ff9a",
      "C": "#b08aff",
      "W": "#9ad8ff",
      "F": "#ffb35c",
      "D": "#6a5a34"
    }
  }
};

/* ---------- tier variants (derived) ----------
   b_<id>_t1 (lvl<5) / b_<id>_t2 (lvl 5-9) / b_<id>_t3 (lvl 10+).
   Pure recolor-trims of the base rows: every non-outline color blends toward
   the tier theme (t2 silver-blue, t3 gold), windows brighten, and a trim line
   (t1 tan / t2 silver / t3 gold) is drawn along the roofline. Base names stay
   intact for cards/modals; the town picks variants via MG.ui.kingdom.tierSprite.
   ui/kingdom.js maps MG.sys.buildings.buildingTier(lvl)+1 -> _t1.._t3. */
(function () {
  "use strict";
  const A = MG.art.buildings;
  function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function blend(h, t, k) {
    const a = hex2rgb(h), b = hex2rgb(t);
    const r = Math.round(a[0] + (b[0] - a[0]) * k), g = Math.round(a[1] + (b[1] - a[1]) * k), bl = Math.round(a[2] + (b[2] - a[2]) * k);
    return "#" + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0");
  }
  function derive(id, tier) {
    const base = A[id];
    const pal = {};
    const target = tier === 3 ? "#ffcf5e" : "#9fb0d8";
    for (const k in base.pal) {
      if (k === "O") { pal[k] = base.pal[k]; continue; }
      if (tier === 1) pal[k] = base.pal[k];
      else pal[k] = blend(base.pal[k], target, tier === 3 ? 0.5 : 0.42);
    }
    // trim + glow keys (single chars, none collide with base pals)
    if (tier === 1) pal.M = "#c8a878";
    if (tier === 2) { pal.V = "#c8d6f0"; pal.Q = "#c8ecff"; }
    if (tier === 3) { pal.G = "#ffd166"; pal.Q = "#ffdf9a"; }
    // rows: brighten windows, then trim the roofline
    const g = base.rows.map(r => r.split(""));
    if (tier >= 2) {
      for (let y = 0; y < g.length; y++) {
        for (let x = 0; x < g[y].length; x++) if (g[y][x] === "W") g[y][x] = "Q";
      }
    }
    const trim = tier === 3 ? "G" : tier === 2 ? "V" : "M";
    let roofline = -1;
    for (let y = 0; y < g.length && roofline < 0; y++) {
      let cnt = 0;
      for (let x = 0; x < g[y].length; x++) if (g[y][x] !== ".") cnt++;
      if (cnt >= 10) roofline = y;
    }
    if (roofline > 0) {
      for (let x = 0; x < g[roofline].length; x++) {
        if (g[roofline][x] !== "." && g[roofline - 1][x] === ".") g[roofline][x] = trim;
      }
      // t3: corner glow pixels just above the roofline ends
      if (tier === 3 && roofline > 1) {
        const row = g[roofline - 1];
        const l = row.indexOf(trim), r = row.lastIndexOf(trim);
        if (l >= 0) g[roofline - 2][l] = "G";
        if (r > l) g[roofline - 2][r] = "G";
      }
    }
    return { w: base.w, h: base.h, rate: 0, rows: g.map(r => r.join("")), pal };
  }
  for (const id in A) {
    if (/_t[123]$/.test(id)) continue;
    for (let t = 1; t <= 3; t++) A[id + "_t" + t] = derive(id, t);
  }
})();
