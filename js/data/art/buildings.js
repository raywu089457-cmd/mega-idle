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
      "R": "#b8433f",
      "G": "#ffd166",
      "K": "#4a2f1a"
    }
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
      "R": "#a84a3a",
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
      "R": "#d8b860",
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
  },
  /* v212 植栽裝飾（TheoTown：樹籬/樹木層次 — 夜間調色深綠+暖棕樹幹+高光） */
  deco_tree1: {
    w: 16, h: 16, rate: 0,
    rows: [
      "......TTTT......",
      "....TTGGGGTT....",
      "..TTGGGGGGGGTT..",
      ".TTGGGGWWGGGGTT.",
      ".TGGGGGGGGGGGGT.",
      ".TGGWWGGGGGGGGT.",
      ".TGGGGGGGGGGGGT.",
      ".TGGGGGGGWWGGGT.",
      ".TGGGGGGGGGGGGT.",
      "..TGGGGGGGGGGT..",
      "...TTGGGGGGTT...",
      ".....TGGGGT.....",
      "......TGGT......",
      ".......TT.......",
      ".......DD.......",
      ".......DD......."
    ],
    pal: { "T": "#1e3329", "G": "#2f4a3a", "W": "#4a8a4a", "D": "#5a3a24" }
  },
  deco_tree2: {
    w: 16, h: 16, rate: 0,
    rows: [
      "......TTTT......",
      "....TTGGGGTT....",
      "..TTGGGGGGGGTT..",
      ".TTGGGGGGGGGGTT.",
      ".TGGGGGGGGGGGGT.",
      ".TGGGGGWWGGGGGT.",
      ".TGGGGGGGGGGGGT.",
      ".TGGGGGGGGGGGGT.",
      ".TGGWWGGGGGGGGT.",
      "..TGGGGGGGGGGT..",
      "...TTGGGGGGTT...",
      ".....TGGGGT.....",
      "......TGGT......",
      ".......TT.......",
      ".......DD.......",
      ".......DD......."
    ],
    pal: { "T": "#24331f", "G": "#3a5a3a", "W": "#5a9a5a", "D": "#4a2f1c" }
  },
  deco_hedge: {
    w: 12, h: 4, rate: 0,
    rows: [
      "GGGGGGGGGGGG",
      "GGGGGGGGGGGG",
      ".GGGGGGGGGG.",
      "..HHHHHHHH.."
    ],
    pal: { "G": "#2f4a3a", "H": "#26382c" }
  },
  /* v273 A5 風車（14×16 2 幀 = 扇葉十字/對角 — 塔身暖棕＋錐頂磚紅＋米白扇葉；純裝飾不接 hitBuilding） */
  deco_windmill: {
    w: 16, h: 16, rate: 0,
    framesRows: [
      [
        ".......WW.......",
        ".......WW.......",
        ".......WW.......",
        "...WWWWWWWWWW...",
        ".......WW.......",
        ".......RR.......",
        "......RRRR......",
        "......BBBB......",
        ".....BBBBBB.....",
        ".....BBBBBB.....",
        ".....BBBBBB.....",
        ".....BBBBBB.....",
        ".....B....B.....",
        "....BB....BB....",
        "....D......D....",
        "................"
      ],
      [
        "................",
        ".....WW..WW.....",
        ".....WW..WW.....",
        "....WW....WW....",
        "....WW....WW....",
        "...WW......WW...",
        "...WW......WW...",
        "..BB........BB..",
        "..BB........BB..",
        "..BB........BB..",
        "..BB........BB..",
        "...BB......BB...",
        "...BB......BB...",
        "....BB....BB....",
        "....D......D....",
        "................"
      ] // v273FIX：frame1 含中心塔身（對角臂 + B 塔身 — 與 frame0 交替時塔身持續 → 十字↔對角旋轉錯覺；frame0 的錐頂 R 在 y5-6 透出）
    ],
    pal: { "O": "#14121f", "W": "#d8c8a0", "R": "#b8433f", "B": "#8a6a4a", "D": "#3a2f24" }
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
    if (tier === 2) { pal.V = "#c8d6f0"; pal.Q = "#c8ecff"; pal.P = "#e8e8f0"; } // v242：屋脊旗（銀白）
    if (tier === 3) { pal.G = "#ffd166"; pal.Q = "#ffdf9a"; pal.P = "#ffd166"; pal.E = "#ffe9b0"; pal.Y = "#ff9f43"; } // v242：金旗/金脊點/門燈
    // v242：結構 stamp 跳過表（圓頂/篷頂非對稱屋頂）
    const SKIP_STAMP = { b_gemworks: 1, b_market: 1 }; // v242FIX：key 含 b_ 前綴（原 market 鍵名不匹配 → 篷頂被 stamp）
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
      // v242 A2R2 結構 stamp：t2 屋脊旗／t3 雙旗＋金脊點＋門燈（TheoTown 旗幟/門燈語彙 — 升級結構可見增量）
      // 跳過表：gemworks 圓頂／market 篷頂（roofline 太淺或非對稱）
      if (!SKIP_STAMP[id] && roofline > 2) {
        // 最長連續 trim run 中央（v242FIX：平手取距列中心最近 — guild 遮篷 run 與屋脊 run 同長時選屋脊）
        const mid = (g[roofline].length - 1) / 2;
        let bestStart = -1, bestLen = 0, bestDist = 1e9, curStart = -1, curLen = 0;
        const r0 = g[roofline];
        for (let x = 0; x <= r0.length; x++) {
          if (r0[x] === trim) { if (curStart < 0) curStart = x; curLen++; }
          else {
            if (curLen >= bestLen) {
              const runMid = curStart + curLen / 2 - 0.5;
              const dist = Math.abs(runMid - mid);
              if (curLen > bestLen || dist < bestDist) { bestLen = curLen; bestStart = curStart; bestDist = dist; }
            }
            curStart = -1; curLen = 0;
          }
        }
        if (bestStart >= 0 && bestLen >= 4) {
          const cx = bestStart + Math.floor(bestLen / 2);
          if (tier === 2) {
            g[roofline - 1][cx] = "P";
            g[roofline - 2][cx] = "P";
          } else if (tier === 3) {
            g[roofline - 1][cx] = "P"; g[roofline - 2][cx] = "E"; // 中央金脊點
            const endX = bestStart + bestLen - 1; // 對稱側第二面旗
            if (endX !== cx) { g[roofline - 1][endX] = "P"; g[roofline - 2][endX] = "P"; }
          }
        }
      }
      // t3 門燈：門帶（K 字元）最上方 1px 暖光（v242FIX：移出 SKIP_STAMP — gemworks 圓頂跳過屋頂但門燈屬底部與屋頂無關）
      if (tier === 3) {
        for (let y = Math.floor(g.length * 0.55); y < g.length; y++) {
          const kx = g[y].indexOf("K");
          if (kx >= 0) { if (y > 0) g[y - 1][kx] = "Y"; break; }
        }
      }
    }
    return { w: base.w, h: base.h, rate: 0, rows: g.map(r => r.join("")), pal };
  }
  for (const id in A) {
    if (/_t[123]$/.test(id)) continue;
    if (!A[id].rows) continue; // v273 A5：無 rows 的精靈（deco_windmill framesRows）不 derive（裝飾無階級）
    for (let t = 1; t <= 3; t++) A[id + "_t" + t] = derive(id, t);
  }
})();
