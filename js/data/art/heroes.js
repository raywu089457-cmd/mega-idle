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

  /* ---------- 村民 villager 1 — straw hat peasant, 7 frames ----------
     v217 幀段契約：0-1 待機呼吸（1px 起伏）、2 站立（攻擊契約位保留）、3-6 走路踏步（4 幀，腿交替+身體擺動） */
  h_villager_1: {
    w: 12, h: 12, rate: 280,
    pal: {
      O: "#14121f", S: "#e8b48c", T: "#8a6a4a",
      A: "#e8c878", P: "#4a3a2a", B: "#3a2a1a"
    },
    framesRows: [
      [ // 0 待機呼吸下（身體沉 1px）
        "....AAAA....",
        "...AAAAAA...",
        "...OSSSSO...",
        "...OS.SSO...",
        "...OTTTTO...",
        "...OTTTTO...",
        "..OTTTTTO...",
        "..OPP.PPO...",
        "..OPP.PPO...",
        "...BB..BB...",
        "............",
        "............"
      ],
      [ // 1 待機呼吸上（站姿）
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
      ],
      [ // 2 站立（攻擊契約位 — 村民無攻擊，保留站姿）
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
      ],
      [ // 3 走路 0（雙腿分開）
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
      [ // 4 走路 1（左腿抬起＋身體微左傾）
        "....AAAA....",
        "...AAAAAA...",
        "...OSSSSO...",
        "...OS.SSO...",
        "...OTTTTO...",
        "...OTTTTO...",
        "..OTTTTTO...",
        ".OPP..PPO...",
        ".OPP..PPO...",
        "..B....B....",
        "..B.........",
        "............"
      ],
      [ // 5 走路 2（雙腿併攏換位）
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
      ],
      [ // 6 走路 3（右腿抬起＋身體微右傾）
        "....AAAA....",
        "...AAAAAA...",
        "...OSSSSO...",
        "...OS.SSO...",
        "...OTTTTO...",
        "...OTTTTO...",
        "..OTTTTTO...",
        "..OPP..PPO..",
        "..OPP..PPO..",
        "....B....B..",
        "........B...",
        "............"
      ]
    ]
  },

  /* ---------- 村民 villager 2 — headscarf woman, skirt, 7 frames ----------
     v217 幀段契約：0-1 待機呼吸、2 站立、3-6 走路踏步（裙擺隨步微動） */
  h_villager_2: {
    w: 12, h: 12, rate: 280,
    pal: {
      O: "#14121f", S: "#f0c8a0", T: "#c05c5c",
      A: "#e8d8a8", P: "#8a3a3a", B: "#4a2a2a"
    },
    framesRows: [
      [ // 0 待機呼吸下
        "....AAAAAA..",
        "...OSSSSO...",
        "...OS.SSO...",
        "..OTTTTTO...",
        ".OTTTTTTO...",
        ".OTTTTTTO...",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        "..OO...OO...",
        "............",
        "............"
      ],
      [ // 1 待機呼吸上
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
      ],
      [ // 2 站立
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
      ],
      [ // 3 走路 0（裙擺左移）
        "....AAAAAA..",
        "...OSSSSO...",
        "...OS.SSO...",
        "..OTTTTTO...",
        ".OTTTTTTO...",
        ".OTTTTTTO...",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        "..OOO..OO...",
        "............",
        "............"
      ],
      [ // 4 走路 1（左步）
        "....AAAAAA..",
        "...OSSSSO...",
        "...OS.SSO...",
        "..OTTTTTO...",
        ".OTTTTTTO...",
        ".OTTTTTTO...",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        ".OO...OOO...",
        "............",
        "............"
      ],
      [ // 5 走路 2（裙擺回中）
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
      ],
      [ // 6 走路 3（右步）
        "....AAAAAA..",
        "...OSSSSO...",
        "...OS.SSO...",
        "..OTTTTTO...",
        ".OTTTTTTO...",
        ".OTTTTTTO...",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        "OTTTTTTTTO..",
        "....OO..OO..",
        "............",
        "............"
      ]
    ]
  },
  /* ---------- v262 村莊動物（style-guide「雞豬牛羊點綴」— 12×12、2 幀：站立↔啄食/拱地） ---------- */
  a_chicken: {
    w: 12, h: 12, rate: 280,
    pal: {
      O: "#14121f", W: "#d8dce8", Y: "#ffd166", S: "#9aa0b8"
    },
    framesRows: [
      [ // 0 站立（頭抬）
        "............",
        "....OOO.....",
        "...OWWWO....",
        "...OWWWO....",
        "...OYWO.....",
        "....OOO.....",
        ".OWWWWWO....",
        ".OWWWWWO....",
        ".OWWWWWO....",
        ".OSWWWWO....",
        "..O...O.....",
        "............"
      ],
      [ // 1 啄食（頭下沉、喙貼地）
        "............",
        "............",
        "............",
        "....OOO.....",
        "...OWWWO....",
        "...OWWWO....",
        "...OYWO.....",
        "....OOO.....",
        ".OWWWWWO....",
        ".OWWWWWO....",
        ".OWWWWWO....",
        "..O...O....."
      ]
    ]
  },
  a_pig: {
    w: 12, h: 12, rate: 280,
    pal: {
      O: "#14121f", P: "#e8a8b8", D: "#c87898", N: "#8a5068"
    },
    framesRows: [
      [ // 0 站立（鼻朝前）
        "............",
        "..OOOOOO....",
        ".OPPPPPPO...",
        ".OPPPPPPO...",
        ".OPPPPPPO...",
        ".OPPPNPO....",
        ".OPPPNPO....",
        "..OOOOOO....",
        "..O....O....",
        "..O....O....",
        "............",
        "............"
      ],
      [ // 1 拱地（鼻貼地）
        "............",
        "............",
        "..OOOOOO....",
        ".OPPPPPPO...",
        ".OPPPPPPO...",
        ".OPPPPPPO...",
        ".OPPPPO.....",
        "..OPPO......",
        "..O....O....",
        "............",
        "............",
        "............"
      ]
    ]
  }
};

/* v222 攻擊 3 段式（A6 戰鬥動作）：由既有幀程式化派生 —
   幀 3 = 前搖（attack 幀下沉 1px 蓄力）、幀 4 = 收招（idle0 武器回位）；
   幀段契約：0-1 待機呼吸、2 攻擊（揮擊主幀 — 既有硬編碼呼叫點不變）、3 前搖、4 收招。
   此迴圈在 sprites.js 掃描（build）之前執行 — 派生幀自動註冊。 */
(function () {
  for (const id in MG.art.heroes) {
    const s = MG.art.heroes[id];
    // v222FIX：僅對 3 幀戰鬥英雄派生（村民 7 幀的 3-6 是走路幀 — 覆寫會破壞村莊行走）
    if (!s || !Array.isArray(s.framesRows) || s.framesRows.length !== 3) continue;
    const idle = s.framesRows[0];
    const atk = s.framesRows[2];
    // 前搖：attack 幀整體下移 1 行（蓄力下沉 — 腳底多一空行）
    const windup = ["................"].concat(atk.slice(0, atk.length - 1));
    // 收招：idle0 複製（武器回位）
    const recover = idle.map(r => r);
    s.framesRows[3] = windup;
    s.framesRows[4] = recover;
  }
})();
