/* 放置王國 MEGA IDLE — sprite registry + procedural pixel-art generators.
   Rows are single-char palette keys ('.' = transparent); pal maps keys to hex.
   Art data lives in js/data/art/*.js (MG.art.<domain>). Missing entries get a
   deterministic fallback so nothing renders broken.
   Slice B6/B7: REPLACE generated art with hand-drawn rows; keep the registry contract. */
"use strict";
MG.data = MG.data || {};
MG.data.sprites = (function () {
  const OUT = "#14121f";
  const K = { OUT: "O" };
  /* ---------- helpers ---------- */
  function pad(rows, w) { return rows.map(r => (r + ".".repeat(w)).slice(0, w)); }
  function rowsToGrid(rows) { return rows.map(r => r.split("")); }
  function overlay(baseGrid, top, ox, oy) {
    const g = baseGrid;
    for (let y = 0; y < top.length; y++) {
      for (let x = 0; x < top[y].length; x++) {
        const c = top[y][x];
        if (c === ".") continue;
        const gy = y + oy, gx = x + ox;
        if (gy >= 0 && gy < g.length && gx >= 0 && gx < g[0].length) g[gy][gx] = c;
      }
    }
    return g;
  }
  function gridToRows(g) { return g.map(r => r.join("")); }
  function shade(hex) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, r - 48); g = Math.max(0, g - 48); b = Math.max(0, b - 48);
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }
  /* ---------- humanoid hunter (16x16) ---------- */
  function humanoid(p) {
    const pal = {
      O: OUT, S: p.skin, H: p.hair, T: p.tunic, P: p.pants, B: p.boots,
      A: p.accent || "#ffd166", W: p.weapon || "#d8dce8", W2: p.weapon2 || "#8a90a8"
    };
    const base = [
      "......HHHH......",
      ".....HHHHHH.....",
      "....HHHHHHHH....",
      "....HSSSSSSH....",
      "....HSOSSOSSH....".slice(0, 16),
      "....HSSSSSSH....",
      ".....HHHHHH.....",
      "....TTTTTTTT....",
      "..TTTTTTTTTTTT..",
      "..TSS TTTTTT SS..".replace(/ /g, ""),
      "..TTTTTTTTTTTT..",
      "....TTATTTATT....",
      "...PP....PP.....",
      "...PP....PP.....",
      "...PP....PP.....",
      "...BB....BB....."
    ];
    // fix widths defensively
    const fix = r => (r + "................").slice(0, 16);
    const rows = base.map(fix);
    const bob = rows.map(r => r);
    bob[12] = "....PP....PP....";
    bob[13] = "....PP....PP....";
    bob[14] = "....PP...PP.....";
    bob[15] = "....BB....BB....";
    let f0 = rowsToGrid(rows), f1 = rowsToGrid(bob);
    // headgear
    if (p.hat === "point") {
      f0 = overlay(f0, [".....HHH..........", "....HHHHH.........", "...HHHHHHH........", "....HHHHH.........", "....AAAAAA........"], 0, 0);
    } else if (p.hat === "helm") {
      f0 = overlay(f0, [
        "....WWWWWWWW....",
        "....WWWWWWWW....",
        "....WWOWWOWW....".replace(/ /g, ""),
        "....W2W2W2W2...."
      ], 0, 0);
    } else if (p.hat === "hood") {
      f0 = overlay(f0, [
        "....TTTTTTTT....",
        "....TOSSSSOT....",
        "....TSSSSSST...."
      ], 0, 0);
    } else if (p.hat === "mask") {
      f0 = overlay(f0, ["....AAAAAAAA...."], 0, 4);
    } else if (p.hat === "band") {
      f0 = overlay(f0, ["....AAAAAAA....."], 0, 3);
    }
    const wep = weaponRows(p.wtype);
    const fIdle = overlay(f0, wep.idle, 0, 0);
    const fBob = overlay(f1, wep.idle, 0, 0);
    const fAtk = overlay(f0, wep.attack, 0, 0);
    return { frames: [gridToRows(fIdle), gridToRows(fBob), gridToRows(fAtk)], rate: 280, pal };
  }
  function weaponRows(type) {
    const idle = Array.from({ length: 16 }, () => ".".repeat(16));
    const attack = Array.from({ length: 16 }, () => ".".repeat(16));
    function fill(target, cells) {
      for (const [y, x, c] of cells) {
        if (y >= 0 && y < 16 && x >= 0 && x < 16) {
          const arr = target[y].split("");
          arr[x] = c; target[y] = arr.join("");
        }
      }
    }
    switch (type) {
      case "sword":
        fill(idle, [[8, 14, "W"], [9, 13, "W2"], [10, 13, "W2"], [11, 12, "W2"], [12, 12, "W2"], [7, 14, "A"]]);
        fill(attack, [[6, 13, "W"], [7, 12, "W2"], [8, 12, "W2"], [9, 11, "W2"], [10, 11, "W2"], [5, 13, "A"], [4, 14, "W"]]);
        break;
      case "bow":
        fill(idle, [[4, 14, "W"], [5, 13, "W2"], [6, 12, "W2"], [7, 12, "W2"], [8, 12, "W2"], [9, 13, "W2"], [10, 14, "W"]]);
        fill(attack, [[4, 13, "W"], [5, 12, "W2"], [6, 11, "W2"], [7, 11, "W2"], [8, 11, "W2"], [9, 12, "W2"], [10, 13, "W"]]);
        break;
      case "staff":
        fill(idle, [[4, 14, "A"], [5, 14, "W"], [6, 14, "W2"], [7, 14, "W2"], [8, 14, "W2"], [9, 14, "W2"], [10, 14, "W2"], [11, 14, "W2"]]);
        fill(attack, [[4, 13, "A"], [5, 13, "W"], [6, 13, "W2"], [7, 13, "W2"], [8, 13, "W2"], [9, 13, "W2"], [10, 13, "W2"], [11, 13, "W2"]]);
        break;
      case "dagger":
        fill(idle, [[8, 14, "W"], [9, 13, "W2"], [10, 13, "W2"], [11, 12, "W2"], [7, 14, "A"]]);
        fill(attack, [[7, 13, "W"], [8, 12, "W2"], [9, 12, "W2"], [10, 11, "W2"], [6, 13, "A"]]);
        break;
      case "greatsword":
        fill(idle, [[4, 14, "W"], [5, 14, "W2"], [6, 13, "W2"], [7, 13, "W2"], [8, 12, "W2"], [9, 12, "W2"], [10, 11, "W2"], [11, 11, "W2"], [3, 14, "A"]]);
        fill(attack, [[3, 14, "W"], [4, 13, "W2"], [5, 13, "W2"], [6, 12, "W2"], [7, 12, "W2"], [8, 11, "W2"], [9, 11, "W2"], [10, 10, "W2"], [2, 14, "A"]]);
        break;
      case "mace":
        fill(idle, [[5, 14, "A"], [6, 14, "A"], [7, 14, "W"], [8, 14, "W2"], [9, 14, "W2"], [10, 14, "W2"], [11, 14, "W2"]]);
        fill(attack, [[4, 13, "A"], [5, 13, "A"], [6, 13, "W"], [7, 13, "W2"], [8, 13, "W2"], [9, 13, "W2"], [10, 13, "W2"]]);
        break;
    }
    return { idle, attack };
  }
  /* ---------- monster kinds (16x16), palette-keyed ---------- */
  function blob(p) {
    const pal = { O: OUT, B: p.body, B2: p.body2 || shade(p.body), E: p.eye || "#ffffff", M: p.mouth || "#14121f" };
    const rows = [
      "......BBBB......",
      "....BBBBBBBB....",
      "...BBBBBBBBBB...",
      "..B2BBBBBBBBBB..",
      "..B2B2BBBBBBBB..",
      "..BBBBBEBEBBBB..",
      "..BBBBBBMMBBBB..",
      "...BBBBBBBBBB...",
      "....BBBBBBBB....",
      "......BBBB......",
      "........BB......",
      "..........O.....",
      "..........O.....",
      "..........O.....",
      ".........OO.....",
      "................"
    ];
    const bob = rows.map(r => r);
    bob[1] = ".....BBBBBB.....";
    bob[2] = "....BBBBBBBB....";
    return { frames: [rows, bob], rate: 480, pal };
  }
  function quad(p) {
    const pal = { O: OUT, B: p.body, B2: p.body2 || shade(p.body), E: p.eye || "#ffffff" };
    const rows = [
      "................",
      "................",
      ".......BBBBB....",
      "......BBBBBBB...",
      ".....BBBBBBBBB..",
      "...OEOBBBBBBBB..",
      "..BBBBBBBBBBBB..",
      "..BB2B2BBBBBBB..",
      "..BBBBBBBBBBBB..",
      "...BBBBBBBBBB...",
      "....OO....OO....",
      "...OBO....OBO...",
      "...OBO....OBO...",
      "...OBO....OBO...",
      "..OBBO....OBBO..",
      "..OBBO....OBBO.."
    ];
    return { frames: [rows, rows.map(r => r)], rate: 420, pal };
  }
  function imp(p) {
    const pal = { O: OUT, B: p.body, B2: p.body2 || shade(p.body), E: p.eye || "#ffffff", W: p.wing || shade(p.body) };
    const rows = [
      "................",
      ".......BBBB.....",
      "..WW....BBBB.WW.",
      "..WW...BBBBBB.WW",
      "..WW...BEBEB..WW".replace(/ /g, ""),
      "..WW...BBBBBB.WW",
      "..WW....BBBB.WW.",
      "..WW.....BBB.WW.",
      "........BBBB....",
      ".......BB2BB....",
      "......BB..BB....",
      "......BB..BB....",
      ".....BB....BB...",
      ".....O......O...",
      "................",
      "................"
    ];
    const flap = rows.map(r => r);
    flap[2] = "................";
    flap[3] = "..WW...BBBBBB.WW";
    flap[4] = "..WW...BEBEB..WW".replace(/ /g, "");
    return { frames: [rows, flap], rate: 340, pal };
  }
  function flyer(p) {
    const pal = { O: OUT, B: p.body, B2: p.body2 || shade(p.body), E: p.eye || "#ffffff", W: p.wing || shade(p.body) };
    const rows = [
      "WW.............WW",
      "WWW...........WWW",
      "WWWW........WWWWW",
      "WWWWW.......WWWWW",
      ".WWWWW.BB.WWWWW..",
      "..WWWW.BB.WWWW...",
      "....WW..BB..WW...",
      ".....W..EBE..W...",
      "........BBBB.....",
      "........BB2B.....",
      "........OOOO.....",
      "................",
      "................",
      "................",
      "................",
      "................"
    ];
    const flap = rows.map(r => r);
    for (let i = 0; i < 5; i++) flap[i] = ".".repeat(16);
    flap[3] = ".WWWWW......WWWWW";
    flap[4] = "..WWWW.BB.WWWW...";
    flap[5] = "...WWW.BB.WWW....";
    return { frames: [rows, flap], rate: 200, pal };
  }
  function serpent(p) {
    const pal = { O: OUT, B: p.body, B2: p.body2 || shade(p.body), E: p.eye || "#ffffff" };
    const rows = [
      "................",
      "................",
      ".....BBBB.......",
      "....BBBBB.......",
      "...BBBBB........",
      "..BEBBB.........",
      "..BBBB..........",
      "..BB2BBB........",
      "...BBBBBB.......",
      "....BBBBBBB.....",
      ".....BBBBBBBB...",
      "......BBBBBBBBB.",
      "......BBBBBBBBB.",
      ".......OO..OO...",
      ".......O....O...",
      "................"
    ];
    return { frames: [rows, rows.map(r => r)], rate: 420, pal };
  }
  function wraith(p) {
    const pal = { O: OUT, B: p.body, B2: p.body2 || shade(p.body), E: p.eye || "#ffffff" };
    const rows = [
      "................",
      ".....BBBB.......",
      "....BBBBBB......",
      "....BEB BEB.....".replace(/ /g, ""),
      "....BBBBBB......",
      "....BBBBBB......",
      "....BBBBBB......",
      "....BB2BBB......",
      "...BBBBBBBB.....",
      "...BB....BB.....",
      "..BB......BB....",
      "..BB......BB....",
      "..BB......BB....",
      "..B........B....",
      "................",
      "................"
    ];
    const bob = rows.map(r => r);
    bob[1] = "......BBBB......";
    bob[2] = ".....BBBBBB.....";
    return { frames: [rows, bob], rate: 400, pal };
  }
  function bossify(kindRows, pal, extra) {
    const out = Array.from({ length: 24 }, () => ".".repeat(24));
    kindRows.forEach((r, y) => {
      const arr = out[y + 5].split("");
      r.split("").forEach((c, x) => { if (c !== ".") arr[x + 4] = c; });
      out[y + 5] = arr.join("");
    });
    const A = extra.accentKey || "R";
    out[0] = "......RRRRRRRR............";
    out[1] = ".....R.R.R.R.RR...........".replace(/ /g, "");
    out[2] = "....RRRRRRRRRRRR..........";
    out[3] = "...OOOOOOOOOOOOO..........";
    out[4] = ".......................";
    return out;
  }
  /* ---------- buildings (32x32) ---------- */
  function building(p) {
    const pal = {
      O: OUT, B: p.body, B2: p.body2 || shade(p.body), R: p.roof, R2: p.roof2 || shade(p.roof),
      T: p.trim || "#ffd166", D: p.door || "#4a2f1a", W: p.window || "#7ec8e8", A: p.accent || "#ffd166"
    };
    const g = Array.from({ length: 32 }, () => ".".repeat(32));
    function put(rows, ox, oy) {
      rows.forEach((r, y) => {
        const arr = g[y + oy].split("");
        r.split("").forEach((c, x) => { if (c !== ".") arr[x + ox] = c; });
        g[y + oy] = arr.join("");
      });
    }
    if (p.kind === "keep") {
      put([
        "....RRRRRRRRRRRRRRRRRRRRRRRRRR....",
        "..R2RRRRRRRRRRRRRRRRRRRRRRRRRRR2..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBWWBBBBBBBBBBWWBBBBBBBBBBWWBB..",
        "..BBWWBBBBBBBBBBWWBBBBBBBBBBWWBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBDDDDDDDDDDBBBBBBBBBB..",
        "..BBBBBBBBBDDDDDDDDDDBBBBBBBBBB..",
        "..BBBBBBBBBDDDDDDDDDDBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2.."
      ], 0, 8);
    } else if (p.kind === "house") {
      put([
        "....RRRRRRRRRRRRRRRRRRRRRRRRRR....",
        "..RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..",
        "..R2RRRRRRRRRRRRRRRRRRRRRRRRRRR2..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBWWBBBBBBBBBBBBBBBBBBBBBBWWBB..",
        "..BBWWBBBBBBBBBBBBBBBBBBBBBBWWBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBDDDDDDDDDDBBBBBBBBBB..",
        "..BBBBBBBBBDDDDDDDDDDBBBBBBBBBB..",
        "..BBBBBBBBBDDDDDDDDDDBBBBBBBBBB..",
        "..B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2.."
      ], 0, 14);
    } else if (p.kind === "tower") {
      put([
        ".....RRRRRRRRRRRRRRRRRRRRR.....",
        "....RRRRRRRRRRRRRRRRRRRRRRR....",
        "....R2RRRRRRRRRRRRRRRRRRRRR2....",
        "....BBBBBBBBBBBBBBBBBBBBBBBB....",
        "....BBBBBBBBBBBBBBBBBBBBBBBB....",
        "....BBBBBBBBBBWWBBBBBBBBBBBB....",
        "....BBBBBBBBBBWWBBBBBBBBBBBB....",
        "....BBBBBBBBBBBBBBBBBBBBBBBB....",
        "....BBBBBBBBBBBBBBBBBBBBBBBB....",
        "....BBBBBBBBBBBBBBBBBBBBBBBB....",
        "....BBBBBBBBBBBBBBBBBBBBBBBB....",
        "....BBBBBBBBBBBBBBBBBBBBBBBB....",
        "....BBBBBBBBBBBBBBBBBBBBBBBB....",
        "....BBBBBBBBBBBBBBBBBBBBBBBB....",
        "....BBBBBBBBBBBBBBBBBBBBBBBB....",
        "....BBBBBBBBBBBDDBBBBBBBBBBBB....",
        "....BBBBBBBBBBBDDBBBBBBBBBBBB....",
        "....B2B2B2B2B2B2B2B2B2B2B2B2B2...."
      ], 3, 12);
    } else if (p.kind === "temple") {
      put([
        "....TTTTTTTTTTTTTTTTTTTTTTTTTT....",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BWBWBWBBBBBBBBBBBBBBWBWBWBWBB..",
        "..BWBWBWBBBBDDDDDDDBBWBWBWBWBB..".replace(/ /g, ""),
        "..BBBBBBBBBDDDDDDDDDBBBBBBBBBB..".replace(/ /g, ""),
        "..BBBBBBBBBDDAAAADDBBBBBBBBBB..".replace(/ /g, ""),
        "..BBBBBBBBBDDDDDDDDDBBBBBBBBBB..".replace(/ /g, ""),
        "..BBBBBBBBBDDDDDDDDDBBBBBBBBBB..".replace(/ /g, ""),
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..BBBBBBBBBBBBBBBBBBBBBBBBBBBB..",
        "..B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2.."
      ], 0, 18);
    } else {
      put([
        "..........RRRRRR..........",
        ".........RRRRRRRR.........",
        "........RRRRRRRRRR........",
        ".......R2RRRRRRRR2R.......".replace(/ /g, ""),
        ".......BBBBBBBBBBBB.......",
        ".......BBBBBBBBBBBB.......",
        ".......BBWB BBBBWB BB......".replace(/ /g, ""),
        ".......BBWB BBBBWB BB......".replace(/ /g, ""),
        ".......BBBBBBBBBBBB.......",
        ".......BBBBB DDBBBBB.......".replace(/ /g, ""),
        ".......BBBBB DDBBBBB.......".replace(/ /g, ""),
        ".......BBBBB DDBBBBB.......".replace(/ /g, ""),
        ".......B2B2B2B2B2B2......."
      ], 4, 18);
    }
    return { rows: g, pal };
  }
  /* ---------- simple icon shapes ---------- */
  function shard(p) {
    const C = p.color, C2 = shade(C), L = p.light || "#ffffff";
    return {
      rows: [
        ".....CCCC....",
        "....CCCCCC...",
        "...CCCCCCCC..",
        "..CCCCCCCCCC.",
        "..C2CCCCCCCC.",
        ".C2C2CCCCCCCC",
        ".CC2CCCCCCCC.",
        "..CCCCCCCCC..",
        "...CCCCCCC...",
        "....CCCCC....",
        ".....CCC.....",
        "......C......"
      ].map(r => (".." + r + "....").slice(0, 16)),
      pal: { C, C2, L }
    };
  }
  function orb(p) {
    const C = p.color, C2 = shade(C), L = p.light || "#ffffff";
    return {
      rows: [
        "......CCC.....",
        "....CCCCCC....",
        "...CCCCCCCC...",
        "..CCLCCCCCCC..",
        "..CLLCCCCCCCC.",
        "..CCCCCCCCCCC.",
        "..CCCCCCCCCCC.",
        "..CCCCCCCCCCC.",
        "...CCCCCCCCC..",
        "....CCCCCCC...",
        ".....CCCCC....",
        "......CCC....."
      ].map(r => (".." + r + "....").slice(0, 16)),
      pal: { C, C2, L }
    };
  }
  function leaf(p) {
    const C = p.color, C2 = shade(C);
    return {
      rows: [
        ".....CCCC.....",
        "....CCCCCC....",
        "...CCCCCCCC...",
        "..CCCCCCCCCC..",
        ".CC2CCCCCCCCC.",
        ".C2C2CCCCCCCC.",
        "..CCC2CCCCCC..",
        "....CCC2CCC...",
        ".....CCC2CC...",
        ".......CC.....",
        "........C.....",
        "........C....."
      ].map(r => (".." + r + "....").slice(0, 16)),
      pal: { C, C2 }
    };
  }
  /* ---------- registry ---------- */
  const GENERATORS = {
    humanoid: p => { const r = humanoid(p); return { w: 16, h: 16, frames: r.frames, rate: r.rate, pal: r.pal }; },
    blob: p => { const r = blob(p); return { w: 16, h: 16, frames: r.frames, rate: r.rate, pal: r.pal }; },
    quad: p => { const r = quad(p); return { w: 16, h: 16, frames: r.frames, rate: r.rate, pal: r.pal }; },
    imp: p => { const r = imp(p); return { w: 16, h: 16, frames: r.frames, rate: r.rate, pal: r.pal }; },
    flyer: p => { const r = flyer(p); return { w: 16, h: 16, frames: r.frames, rate: r.rate, pal: r.pal }; },
    serpent: p => { const r = serpent(p); return { w: 16, h: 16, frames: r.frames, rate: r.rate, pal: r.pal }; },
    wraith: p => { const r = wraith(p); return { w: 16, h: 16, frames: r.frames, rate: r.rate, pal: r.pal }; },
    boss: p => {
      const k = p.kindFn || "imp";
      const base = { blob, quad, imp, flyer, serpent, wraith }[k](p);
      const f0 = bossify(base.frames[0], base.pal, p);
      const f1 = bossify(base.frames[1], base.pal, p);
      const pal = Object.assign({}, base.pal, { R: p.accent || "#ffd166" });
      return { w: 24, h: 24, frames: [f0, f1], rate: base.rate, pal };
    },
    building: p => { const b = building(p); return { w: 32, h: 32, frames: [b.rows], rate: 0, pal: b.pal }; },
    shard: p => { const s = shard(p); return { w: 16, h: 16, frames: [s.rows], rate: 0, pal: s.pal }; },
    orb: p => { const s = orb(p); return { w: 16, h: 16, frames: [s.rows], rate: 0, pal: s.pal }; },
    leaf: p => { const s = leaf(p); return { w: 16, h: 16, frames: [s.rows], rate: 0, pal: s.pal }; }
  };
  const built = {};
  function build(name, def) {
    if (def.rows) {
      const rows = pad(def.rows, def.w || 16);
      return { w: def.w || 16, h: rows.length, frames: [rows], rate: def.rate || 0, pal: def.pal || {} };
    }
    if (def.framesRows) {
      return { w: def.w, h: def.h, frames: def.framesRows.map(r => pad(r, def.w)), rate: def.rate || 0, pal: def.pal || {} };
    }
    if (def.gen) {
      const g = GENERATORS[def.gen];
      if (g) return g(def.params || {});
    }
    return null;
  }
  function fallback(name, color) {
    let seed = 7;
    for (let i = 0; i < name.length; i++) seed = (seed * 31 + name.charCodeAt(i)) >>> 0;
    const C = color || "#7a7f9c";
    const rows = [];
    for (let y = 0; y < 16; y++) {
      let r = "";
      for (let x = 0; x < 16; x++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const dx = x - 8, dy = y - 8;
        const d = Math.sqrt(dx * dx + dy * dy) + (seed / 4294967296) * 1.2 - 0.6;
        if (d < 5.2) r += "C";
        else if (d < 6.2) r += "O";
        else r += ".";
      }
      rows.push(r);
    }
    return { w: 16, h: 16, frames: [rows], rate: 0, pal: { C, O: OUT } };
  }
  function get(name) {
    if (built[name]) return built[name];
    let s = null;
    const art = window.MG.art || {};
    for (const domain in art) {
      if (art[domain][name]) { s = build(name, art[domain][name]); break; }
    }
    if (!s) s = fallback(name);
    built[name] = s;
    return s;
  }
  function ascii(name) {
    const s = get(name);
    if (!s) return null;
    return s.frames.map(f => f.join("\n")).join("\n--- frame ---\n");
  }
  return { get, build, fallback, shade, ascii };
})();
