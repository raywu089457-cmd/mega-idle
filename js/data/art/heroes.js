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

      A: "#1c1c26",
      B: "#2e3760",
      C: "#3a4470",
      D: "#262630",
      E: "#b8a86e",
      F: "#e6c863",
      G: "#f4db5d",
      H: "#8a7a4e",
      I: "#d8b85e",
      J: "#c4a85e",
      K: "#4a5488",
      L: "#6a76b0",
      M: "#7e8cc8",
      N: "#5a6498",
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
    ],
    dirs: {
      // FF6 風格 4 方向走路（down/up/left/right × 3 幀）— 僅走路繪製使用；戰鬥/名冊走 framesRows
      down: [
        ["......ABCA......",".....DEFGFB.....","....HIGFGFID....","....BIFFFFFH....","....HHFJJFFD....","....DCBEJCHDKM..","....AFKLJBJHKM..",".....HJEJEJD.M..","....AAHFFIDA.M..","...CMMLKMLMM.M..","...AHLMMMMMD.M..","....ALMMMMMB....","....CDCKNEDL....","...DEBLMMMBJ....","...DICHLCKCI....","....BADLDBAD...."],
        [".....ABCB.......","....BCDEEC......","...FDEGEGEC.....","...BDDGGGGDA....","...CCHGHGGC.....","...AFFFGFIC.KM..","....JHFGFJGAKM..","....BJHHHHI..M..","...BIIDHHFBB.M..","...KKKKKKKKKFM..","...ALKKKKKLB.M..","....BLKMKKF.....","....FIMKKFIA....","...AKLKNKLKI....","...BGHLILJEF....","...ACILILICB...."],
        ["....AAABAC......","....ADEEEDBC....","...ADFFDEEFB....","...AGBFFFEFD....","....CGFHDEFD....",".....GGGHDIBKM..",".....GGJHIBAKM..",".....GHHFDCC.M..","......IFIJAA.M..","......CJJJJK.M..","......JJJIBA.M..",".....KJJLKLA....",".....AJJMCBG....","...GFKLNLCGJ....","...GFKGJJLIH....","....CCLMBGHD...."],
      ],
      up: [
        ["......ABCA......",".....DEFGFB.....","....HIGFGFID....","....BIFIIFFH....","....HHIIIIID....","....DCBIICHDKM..","....AIJKIBIHKM..",".....HIIIIID.M..","....AAHIIIDA.M..","...CLLKJLKLL.M..","...AHKLLLLLD.M..","....AKLLLLLB....","....CDCJMEDK....","...DIBKLLLBI....","...DICHKCJCI....","....BADKDBAD...."],
        [".....ABCB.......","....BCDEEC......","...FDEGEGEC.....","...BDDDDDGDA....","...CCDDDDDC.....","...AFFFDFHC.KM..","....DDFDFIDAKM..","....BDDDDDH..M..","...BHHDDDFBB.M..","...JJJJJJJJJFM..","...AKJJJJJKB.M..","....BKJLJJF.....","....FHLJJFHA....","...AJKJMJKJH....","...BDDKHKDDF....","...ACHKHKHCB...."],
        ["....AAABAC......","....ADEEEDBC....","...ADFFDEEFB....","...AGBDDDEFD....","....CGDDDEFD....",".....GGGDDHBKM..",".....GGIDHBAKM..",".....GDDDDCC.M..","......DDHIAA.M..","......CIIIIJ.M..","......IIIHBA.M..",".....JIIKJKA....",".....AIILCBG....","...GDJKMKCGI....","...GDJGIIKDD....","....CCKLBGDD...."],
      ],
      left: [
        [".....AB.........",".....CDE........",".....CCCB.......",".....CCFE....M..",".....CCFB....M..",".....FGA....KM..",".....HHAB...KM..",".....HIA.....M..",".....DJBB....M..",".....DHHHK...M..",".....LMAAB......",".....HHMB.......",".....GHMB.......",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
        ["......A.........","......BC........","......DBA.......","......DBA....M..","......DB.....M..","......EC....KM..","......FG....KM..","......HC.....M..","......AAA....M..","......FFFI...M..","......JGEK......","......FLA.......","......FLH.......","......FFLA......","......FFLI......","......FFLI......"],
        [".........AB.....","........CDE.....",".......AEEE.....",".......CFEE..M..",".......AFEE..M..","........BGF.KM..",".......ABHH.KM..","........BIH..M..",".......AAJD..M..","......KHHHD..M..","......ABBLM.....",".......ALHH.....",".......ALHG.....",".......JLHN.....",".......ILHM.....",".......ILHH....."],
      ],
      right: [
        [".........AB.....","........CDE.....",".......AEEE.....","...M...CFEE.....","...M...AFEE.....","..KM....BGF.....","..KM...ABHH.....","...M....BIH.....","...M...AAJD.....","...M..KHHHD.....","......ABBLM.....",".......ALHH.....",".......ALHG.....",".......JLHN.....",".......ILHM.....",".......ILHH....."],
        [".........A......","........BC......",".......ACD......","...M...ACD......","...M....CD......","..KM....BE......","..KM....FG......","...M....BH......","...M...AAA......","...M..IGGG......","......JEFK......",".......ALG......",".......HLG......","......ALGG......","......ILGG......","......ILGG......"],
        [".....AB.........",".....CDE........",".....CCCB.......","...M.CCFE.......","...M.CCFB.......","..KM.FGA........","..KM.HHAB.......","...M.HIA........","...M.DJBB.......","...M.DHHHK......",".....LMAAB......",".....HHMB.......",".....GHMB.......",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
      ],
    },
  },

  /* ---------- 弓手 archer — pointed hood, quiver, drawn bow arc ---------- */
  h_archer: {
    w: 16, h: 16, rate: 280,
    pal: {

      A: "#1c241e",
      B: "#2a4432",
      C: "#345440",
      D: "#242a24",
      E: "#b8a070",
      F: "#6fc46f",
      G: "#8fe09a",
      H: "#6e8a5a",
      I: "#5fa06a",
      J: "#8cc490",
      K: "#3e6a4a",
      L: "#7ab48a",
      M: "#8ec8a0",
      N: "#4e805c",
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
    ],
    dirs: {
      // FF6 風格 4 方向走路（down/up/left/right × 3 幀）— 僅走路繪製使用；戰鬥/名冊走 framesRows
      down: [
        ["......ABCA......",".....DCCCCB.....","....HCCCCCCDLM..","....BCCCCCCHLM..","....HHFJJFFDLM..","....DCBEJCHDLM..","....AFKLJBJHLM..",".....HJEJEJDLM..","....AAHFFIDALM..","...CMMLKMLMMLM..","...AHLMMMMMDLM..","....ALMMMMMB....","....CDCKNEDL....","...DEBLMMMBJ....","...DICHLCKCI....","....BADLDBAD...."],
        [".....ABCB.......","....BCCCCC......","...FCCCCCC..LM..","...BDDDDDD..LM..","...CCHGHGGC.LM..","...AFFFGFIC.LM..","....JHFGFJGALM..","....BJHHHHI.LM..","...BIIDHHFBBLM..","...KKKKKKKKKLM..","...ALKKKKKLBLM..","....BLKMKKF.....","....FIMKKFIA....","...AKLKNKLKI....","...BGHLILJEF....","...ACILILICB...."],
        ["....AAABAC......","....ADCCCCBC....","...ADCCCCCCDLM..","...AGBDDDDD.LM..","....CGFHDEFDLM..",".....GGGHDIBLM..",".....GGJHIBALM..",".....GHHFDCCLM..","......IFIJAALM..","......CJJJJKLM..","......JJJIBALM..",".....KJJLKLA....",".....AJJMCBG....","...GFKLNLCGJ....","...GFKGJJLIH....","....CCLMBGHD...."],
      ],
      up: [
        ["......ABCA......",".....DCCCCB.....","....HIGFGFIDLM..","....BIFIIFFHLM..","....HHIIIIIDLM..","....DCBIICHDLM..","....AIJKIBIHLM..",".....HIIIIIDLM..","....AAHIIIDALM..","...CLLKJLKLLLM..","...AHKLLLLLDLM..","....AKLLLLLB....","....CDCJMEDK....","...DIBKLLLBI....","...DICHKCJCI....","....BADKDBAD...."],
        [".....ABCB.......",".....DCCCCB.....","...FDEGEGEC.LM..","...BDDDDDGDALM..","...CCDDDDDC.LM..","...AFFFDFHC.LM..","....DDFDFIDALM..","....BDDDDDH.LM..","...BHHDDDFBBLM..","...JJJJJJJJJLM..","...AKJJJJJKBLM..","....BKJLJJF.....","....FHLJJFHA....","...AJKJMJKJH....","...BDDKHKDDF....","...ACHKHKHCB...."],
        ["....AAABAC......",".....DCCCCB.....","...ADFFDEEFBLM..","...AGBDDDEFDLM..","....CGDDDEFDLM..",".....GGGDDHBLM..",".....GGIDHBALM..",".....GDDDDCCLM..","......DDHIAALM..","......CIIIIJLM..","......IIIHBALM..",".....JIIKJKA....",".....AIILCBG....","...GDJKMKCGI....","...GDJGIIKDD....","....CCKLBGDD...."],
      ],
      left: [
        [".....AB.........",".....DCCCB......",".....CCCB...LM..",".....CCFE...LM..",".....CCFB...LM..",".....FGA....LM..",".....HHAB...LM..",".....HIA....LM..",".....DJBB...LM..",".....DHHHK..LM..",".....LMAAB......",".....HHMB.......",".....GHMB.......",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
        ["......A.........",".....DCCCB......","......DBA...LM..","......DBA...LM..","......DB....LM..","......EC....LM..","......FG....LM..","......HC....LM..","......AAA...LM..","......FFFI..LM..","......JGEK......","......FLA.......","......FLH.......","......FFLA......","......FFLI......","......FFLI......"],
        [".........AB.....",".....DCCCB......",".......AEEE.LM..",".......CFEE.LM..",".......AFEE.LM..","........BGF.LM..",".......ABHH.LM..","........BIH.LM..",".......AAJD.LM..","......KHHHD.LM..","......ABBLM.....",".......ALHH.....",".......ALHG.....",".......JLHN.....",".......ILHM.....",".......ILHH....."],
      ],
      right: [
        [".........AB.....","........CDE.....","..LM...AEEE.....","..LM...CFEE.....","..LM...AFEE.....","..LM....BGF.....","..LM...ABHH.....","..LM....BIH.....","..LM...AAJD.....","..LM..KHHHD.....","......ABBLM.....",".......ALHH.....",".......ALHG.....",".......JLHN.....",".......ILHM.....",".......ILHH....."],
        [".........A......","........CDE.....","..LM...ACD......","..LM...ACD......","..LM....CD......","..LM....BE......","..LM....FG......","..LM....BH......","..LM...AAA......","..LM..IGGG......","......JEFK......",".......ALG......",".......HLG......","......ALGG......","......ILGG......","......ILGG......"],
        [".....AB.........","........CDE.....","..LM.CCCB.......","..LM.CCFE.......","..LM.CCFB.......","..LM.FGA........","..LM.HHAB.......","..LM.HIA........","..LM.DJBB.......","..LM.DHHHK......",".....LMAAB......",".....HHMB.......",".....GHMB.......",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
      ],
    },
  },

  /* ---------- 法師 mage — pointy hat, floor robe, staff with glowing orb ---------- */
  h_mage: {
    w: 16, h: 16, rate: 280,
    pal: {

      A: "#24202c",
      B: "#3a2c52",
      C: "#4a3a6a",
      D: "#2a2632",
      E: "#b8a87e",
      F: "#a878e0",
      G: "#c9a8f0",
      H: "#6e5898",
      I: "#8a6ac0",
      J: "#b08ae8",
      K: "#5a4480",
      L: "#9a8ac8",
      M: "#b09ae0",
      N: "#6e54a0",
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
    ],
    dirs: {
      // FF6 風格 4 方向走路（down/up/left/right × 3 幀）— 僅走路繪製使用；戰鬥/名冊走 framesRows
      down: [
        ["......ABCA......",".....DCCCCB.....","...HCCCCCCCCD...","....BCCCCCCH..K.","....HHFJJFFD.M..","....DCBEJCHD.M..","....AFKLJBJH.M..",".....HJEJEJD.M..","....AAHFFIDA.M..","...CMMLKMLMM.M..","...AHLMMMMMD.M..","....ALMMMMMB.M..","....CDCKNEDL.M..","..CDEBLMMMBJDC..","..CDICHLCKCID...","...CBADLDBADC..."],
        [".....ABCB.......","....BCCCCC......","...FCCCCCCC.....","...BDDDDDDD..K..","...CCHGHGGC..M..","...AFFFGFIC..M..","....JHFGFJGA.M..","....BJHHHHI..M..","...BIIDHHFBB.M..","...KKKKKKKKKFM..","...ALKKKKKLB.M..","....BLKMKKF..M..","....FIMKKFIA.M..","..CAKLKNKLKIDC..","..CBGHLILJEFDC..","..CACILILICBDC.."],
        ["....AAABAC......","....ADCCCCBC....","...ADCCCCCCCCD..","...AGBDDDDDDDK..","....CGFHDEFD.M..",".....GGGHDIB.M..",".....GGJHIBA.M..",".....GHHFDCC.M..","......IFIJAA.M..","......CJJJJK.M..","......JJJIBA.M..",".....KJJLKLA.M..",".....AJJMCBG.M..","..CGFKLNLCGJDC..","..CGFKGJJLIHDC..","...CCLMBGHDC...."],
      ],
      up: [
        ["......ABCA......",".....DCCCCB.....","...HCCCCCCCCD...","....BCCCCCCH..K.","....HHIIIIID.M..","....DCBIICHD.M..","....AIJKIBIH.M..",".....HIIIIID.M..","....AAHIIIDA.M..","...CLLKJLKLL.M..","...AHKLLLLLD.M..","....AKLLLLLB.M..","....CDCJMEDK.M..","..CDEBLMMMBJDC..","..CDICHLCKCID...","...CBADLDBADC..."],
        [".....ABCB.......","....BCCCCC......","...FCCCCCCC.....","...BDDDDDDD..K..","...CCDDDDDC..M..","...AFFFDFHC..M..","....DDFDFIDA.M..","....BDDDDDH..M..","...BHHDDDFBB.M..","...JJJJJJJJJFM..","...AKJJJJJKB.M..","....BKJLJJF..M..","....FHLJJFHA.M..","..CAKLKNKLKIDC..","..CBGHLILJEFDC..","..CACILILICBDC.."],
        ["....AAABAC......","....ADCCCCBC....","...ADCCCCCCCCD..","...AGBDDDDDDDK..","....CGDDDEFD.M..",".....GGGDDHB.M..",".....GGIDHBA.M..",".....GDDDDCC.M..","......DDHIAA.M..","......CIIIIJ.M..","......IIIHBA.M..",".....JIIKJKA.M..",".....AIILCBG.M..","..CGFKLNLCGJDC..","..CGFKGJJLIHDC..","...CCLMBGHDC...."],
      ],
      left: [
        [".....AB.........",".....DCCC.......","....HCCCCCB.....","....BCCCCCH..K..",".....CCFB....M..",".....FGA.....M..",".....HHAB....M..",".....HIA.....M..",".....DJBB....M..",".....DHHHK...M..",".....LMAAB...M..",".....HHMB....M..",".....GHMB....M..",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
        [".....AB.........",".....DCCC.......","....HCCCCCB.....","....BCCCCCH..K..","......DB.....M..","......EC.....M..","......FG.....M..","......HC.....M..","......AAA....M..","......FFFI...M..","......JGEK...M..","......FLA....M..","......FLH....M..","......FFLA......","......FFLI......","......FFLI......"],
        [".....AB.........",".....DCCC.......","....HCCCCCB.....","....BCCCCCH..K..",".......AFEE..M..","........BGF..M..",".......ABHH..M..","........BIH..M..",".......AAJD..M..","......KHHHD..M..","......ABBLM..M..",".......ALHH..M..",".......ALHG..M..",".......JLHN.....",".......ILHM.....",".......ILHH....."],
      ],
      right: [
        [".........AB.....","........CDD.....","......BCCCCC....","...K..HCCCCB....","...M...AFEE.....","...M....BGF.....","...M...ABHH.....","...M....BIH.....","...M...AAJD.....","...M..KHHHD.....","...M..ABBLM.....","...M...ALHH.....","...M...ALHG.....",".......JLHN.....",".......ILHM.....",".......ILHH....."],
        [".........AB.....","........CDD.....","......BCCCCC....","...K..HCCCCB....","...M....CD......","...M....BE......","...M....FG......","...M....BH......","...M...AAA......","...M..IGGG......","...M..JEFK......","...M...ALG......","...M...HLG......","......ALGG......","......ILGG......","......ILGG......"],
        [".........AB.....","........CDD.....","......BCCCCC....","...K..HCCCCB....","...M.CCFB.......","...M.FGA........","...M.HHAB.......","...M.HIA........","...M.DJBB.......","...M.DHHHK......","...M.LMAAB......","...M.HHMB.......","...M.GHMB.......",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
      ],
    },
  },

  /* ---------- 刺客 assassin — crouched, rose mask, twin daggers ---------- */
  h_assassin: {
    w: 16, h: 16, rate: 280,
    pal: {

      A: "#1a1a24",
      B: "#2e2a3e",
      C: "#3c3650",
      D: "#22222c",
      E: "#b89a8e",
      F: "#e070a8",
      G: "#f0a0c8",
      H: "#6e4a5e",
      I: "#b05888",
      J: "#d88ab0",
      K: "#463a5a",
      L: "#8a6a9e",
      M: "#a07ab0",
      N: "#5c4470",
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
    ],
    dirs: {
      // FF6 風格 4 方向走路（down/up/left/right × 3 幀）— 僅走路繪製使用；戰鬥/名冊走 framesRows
      down: [
        ["......ABCA......",".....DFGFGD.....","....HGFGFGFD....","....BIFGFGFH....","....HHFJJFFD....","....DCBEJCHD....","....AFKLJBJH....",".....HFFFEJD....","....AAHFFIDA....","...CMMLKMLMM....","...AHLMMMMMD....","....ALMMMMMB....","....CDCKNEDL....","...DEBLMMMBJ....","...DICHLCKCI....","....BADLDBAD...."],
        [".....ABCB.......",".....DFGFGD.....","....HGFGFGFD....","....BIFGFGFH....","...CCHGHGGC.....","...AFFFGFIC.....","....JHFGFJGA....","....BJFFFHI.....","...BIIDHHFBB....","...KKKKKKKKKF...","...ALKKKKKLB....","....BLKMKKF.....","....FIMKKFIA....","...AKLKNKLKI....","...BGHLILJEF....","...ACILILICB...."],
        ["....AAABAC......",".....DFGFGD.....","....HGFGFGFD....","....BIFGFGFH....","....CGFHDEFD....",".....GGGHDIB....",".....GGJHIBA....",".....GFFFDCC....","......IFIJAA....","......CJJJJK....","......JJJIBA....",".....KJJLKLA....",".....AJJMCBG....","...GFKLNLCGJ....","...GFKGJJLIH....","....CCLMBGHD...."],
      ],
      up: [
        ["......ABCA......",".....DFGFGD.....","....HGFGFGFD....","....BIFGFGFH....","....HHIIIIID....","....DCBIICHD....","....AIJKIBIH....",".....HIIIIID....","....AAHIIIDA....","...CLLKJLKLL....","...AHKLLLLLD....","....AKLLLLLB....","....CDCJMEDK....","...DIBKLLLBI....","...DICHKCJCI....","....BADKDBAD...."],
        [".....ABCB.......",".....DFGFGD.....","....HGFGFGFD....","....BIFGFGFH....","...CCDDDDDC.....","...AFFFDFHC.....","....DDFDFIDA....","....BDDDDDH.....","...BHHDDDFBB....","...JJJJJJJJJF...","...AKJJJJJKB....","....BKJLJJF.....","....FHLJJFHA....","...AJKJMJKJH....","...BDDKHKDDF....","...ACHKHKHCB...."],
        ["....AAABAC......",".....DFGFGD.....","....HGFGFGFD....","....BIFGFGFH....","....CGDDDEFD....",".....GGGDDHB....",".....GGIDHBA....",".....GDDDDCC....","......DDHIAA....","......CIIIIJ....","......IIIHBA....",".....JIIKJKA....",".....AIILCBG....","...GDJKMKCGI....","...GDJGIIKDD....","....CCKLBGDD...."],
      ],
      left: [
        [".....AB.........",".....DFGD.......",".....DFGFD......",".....DGFD.......",".....CCFB.......",".....FGA........",".....HHAB.......",".....HIA........",".....DJBB.......",".....DHHHK......",".....LMAAB......",".....HHMB.......",".....GHMB.......",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
        ["......A.........",".....DFGD.......",".....DFGFD......",".....DGFD.......","......DB........","......EC........","......FG........","......HC........","......AAA.......","......FFFI......","......JGEK......","......FLA.......","......FLH.......","......FFLA......","......FFLI......","......FFLI......"],
        [".........AB.....",".....DFGD.......",".....DFGFD......",".....DGFD.......",".......AFEE.....","........BGF.....",".......ABHH.....","........BIH.....",".......AAJD.....","......KHHHD.....","......ABBLM.....",".......ALHH.....",".......ALHG.....",".......JLHN.....",".......ILHM.....",".......ILHH....."],
      ],
      right: [
        [".........AB.....","........DGD.....","......DFGFD.....","......DFGD......",".......AFEE.....","........BGF.....",".......ABHH.....","........BIH.....",".......AAJD.....","......KHHHD.....","......ABBLM.....",".......ALHH.....",".......ALHG.....",".......JLHN.....",".......ILHM.....",".......ILHH....."],
        [".........A......","........DGD.....","......DFGFD.....","......DFGD......","........CD......","........BE......","........FG......","........BH......",".......AAA......","......IGGG......","......JEFK......",".......ALG......",".......HLG......","......ALGG......","......ILGG......","......ILGG......"],
        [".....AB.........","........DGD.....","......DFGFD.....","......DFGD......",".....CCFB.......",".....FGA........",".....HHAB.......",".....HIA........",".....DJBB.......",".....DHHHK......",".....LMAAB......",".....HHMB.......",".....GHMB.......",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
      ],
    },
  },

  /* ---------- 騎士 knight — plume helm, kite shield, vertical sword ---------- */
  h_knight: {
    w: 16, h: 16, rate: 280,
    pal: {

      A: "#24202a",
      B: "#503f4b",
      C: "#534c52",
      D: "#383535",
      E: "#b29c75",
      F: "#e6c863",
      G: "#f4db5d",
      H: "#987f67",
      I: "#e0b55b",
      J: "#cbb46d",
      K: "#88658c",
      L: "#5c5e81",
      M: "#7281b0",
      N: "#7e5792",
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
    ],
    dirs: {
      // FF6 風格 4 方向走路（down/up/left/right × 3 幀）— 僅走路繪製使用；戰鬥/名冊走 framesRows
      down: [
        ["......ABCA......",".....DEFGFB.....","....HIGFGFID....","....BIFFFFFH....","....HHFJJFFD....","....DCBEJCHD....","....AFKLJBJH....",".....HJEJEJD....","....AAHFFIDA....","...CMMLKMLMM....","...AHLMMMMMD....","....ALMMMMMB....","....CDCKNEDL....","...DEBLMMMBJ....","...DICHLCKCI....","....BADLDBAD...."],
        [".....ABCB.......","....BCDEEC......","...FDEGEGEC.....","...BDDGGGGDA....","...CCHGHGGC.....","...AFFFGFIC.....","....JHFGFJGA....","....BJHHHHI.....","...BIIDHHFBB....","...KKKKKKKKKF...","...ALKKKKKLB....","....BLKMKKF.....","....FIMKKFIA....","...AKLKNKLKI....","...BGHLILJEF....","...ACILILICB...."],
        ["....AAABAC......","....ADEEEDBC....","...ADFFDEEFB....","...AGBFFFEFD....","....CGFHDEFD....",".....GGGHDIB....",".....GGJHIBA....",".....GHHFDCC....","......IFIJAA....","......CJJJJK....","......JJJIBA....",".....KJJLKLA....",".....AJJMCBG....","...GFKLNLCGJ....","...GFKGJJLIH....","....CCLMBGHD...."],
      ],
      up: [
        ["......ABCA......",".....DEFGFB.....","....HIGFGFID....","....BIFIIFFH....","....HHIIIIID....","....DCBIICHD....","....AIJKIBIH....",".....HIIIIID....","....AAHIIIDA....","...CLLKJLKLL....","...AHKLLLLLD....","....AKLLLLLB....","....CDCJMEDK....","...DIBKLLLBI....","...DICHKCJCI....","....BADKDBAD...."],
        [".....ABCB.......","....BCDEEC......","...FDEGEGEC.....","...BDDDDDGDA....","...CCDDDDDC.....","...AFFFDFHC.....","....DDFDFIDA....","....BDDDDDH.....","...BHHDDDFBB....","...JJJJJJJJJF...","...AKJJJJJKB....","....BKJLJJF.....","....FHLJJFHA....","...AJKJMJKJH....","...BDDKHKDDF....","...ACHKHKHCB...."],
        ["....AAABAC......","....ADEEEDBC....","...ADFFDEEFB....","...AGBDDDEFD....","....CGDDDEFD....",".....GGGDDHB....",".....GGIDHBA....",".....GDDDDCC....","......DDHIAA....","......CIIIIJ....","......IIIHBA....",".....JIIKJKA....",".....AIILCBG....","...GDJKMKCGI....","...GDJGIIKDD....","....CCKLBGDD...."],
      ],
      left: [
        [".....AB.........",".....CDE........",".....CCCB.......",".....CCFE.......",".....CCFB.......",".....FGA........",".....HHAB.......",".....HIA........",".....DJBB.......",".....DHHHK......",".....LMAAB......",".....HHMB.......",".....GHMB.......",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
        ["......A.........","......BC........","......DBA.......","......DBA.......","......DB........","......EC........","......FG........","......HC........","......AAA.......","......FFFI......","......JGEK......","......FLA.......","......FLH.......","......FFLA......","......FFLI......","......FFLI......"],
        [".........AB.....","........CDE.....",".......AEEE.....",".......CFEE.....",".......AFEE.....","........BGF.....",".......ABHH.....","........BIH.....",".......AAJD.....","......KHHHD.....","......ABBLM.....",".......ALHH.....",".......ALHG.....",".......JLHN.....",".......ILHM.....",".......ILHH....."],
      ],
      right: [
        [".........AB.....","........CDE.....",".......AEEE.....",".......CFEE.....",".......AFEE.....","........BGF.....",".......ABHH.....","........BIH.....",".......AAJD.....","......KHHHD.....","......ABBLM.....",".......ALHH.....",".......ALHG.....",".......JLHN.....",".......ILHM.....",".......ILHH....."],
        [".........A......","........BC......",".......ACD......",".......ACD......","........CD......","........BE......","........FG......","........BH......",".......AAA......","......IGGG......","......JEFK......",".......ALG......",".......HLG......","......ALGG......","......ILGG......","......ILGG......"],
        [".....AB.........",".....CDE........",".....CCCB.......",".....CCFE.......",".....CCFB.......",".....FGA........",".....HHAB.......",".....HIA........",".....DJBB.......",".....DHHHK......",".....LMAAB......",".....HHMB.......",".....GHMB.......",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
      ],
    },
  },

  /* ---------- 牧師 priest — hood, cream robe, cross-headed staff ---------- */
  h_priest: {
    w: 16, h: 16, rate: 280,
    pal: {

      A: "#26241e",
      B: "#4a4638",
      C: "#5c5848",
      D: "#2e2c24",
      E: "#f0e8d0",
      F: "#fff8e0",
      G: "#fffce8",
      H: "#a89c7e",
      I: "#d8cc9e",
      J: "#ece0b8",
      K: "#8a8268",
      L: "#e8e0c8",
      M: "#d0c8a8",
      N: "#b0a888",
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
    ],
    dirs: {
      // FF6 風格 4 方向走路（down/up/left/right × 3 幀）— 僅走路繪製使用；戰鬥/名冊走 framesRows
      down: [
        ["......ABCA......",".....DCCCCB.....","....HCCCCCCD....","....BCCCCCCH....","....HHFJJFFD....","....DCBEJCHD....","..KLAFKLJBJH....","..KL.HJEJEJD....","..KLAAHFFIDA....","...CMMLKMLMM....","...AHLMMMMMD....","....ALMMMMMB....","....CDCKNEDL....","...DEBLMMMBJ....","...DICHLCKCI....","....BADLDBAD...."],
        [".....ABCB.......",".....DCCCCB.....","....HCCCCCCD....","....BCCCCCCH....","...CCHGHGGC.....","...AFFFGFIC.....","..KLJHFGFJGA....","..KLBJHHHHI.....","..KLIIDHHFBB....","...KKKKKKKKKF...","...ALKKKKKLB....","....BLKMKKF.....","....FIMKKFIA....","...AKLKNKLKI....","...BGHLILJEF....","...ACILILICB...."],
        ["....AAABAC......",".....DCCCCB.....","....HCCCCCCD....","....BCCCCCCH....","....CGFHDEFD....",".....GGGHDIB....","..KL.GGJHIBA....","..KL.GHHFDCC....","..KL..IFIJAA....","......CJJJJK....","......JJJIBA....",".....KJJLKLA....",".....AJJMCBG....","...GFKLNLCGJ....","...GFKGJJLIH....","....CCLMBGHD...."],
      ],
      up: [
        ["......ABCA......",".....DCCCCB.....","....HCCCCCCD....","....BCCCCCCH....","....HHIIIIID....","....DCBIICHD....","....AIJKIBIH....",".....HIIIIID....","....AAHIIIDA....","...CLLKJLKLL....","...AHKLLLLLD....","....AKLLLLLB....","....CDCJMEDK....","...DIBKLLLBI....","...DICHKCJCI....","....BADKDBAD...."],
        [".....ABCB.......",".....DCCCCB.....","....HCCCCCCD....","....BCCCCCCH....","...CCDDDDDC.....","...AFFFDFHC.....","....DDFDFIDA....","....BDDDDDH.....","...BHHDDDFBB....","...JJJJJJJJJF...","...AKJJJJJKB....","....BKJLJJF.....","....FHLJJFHA....","...AJKJMJKJH....","...BDDKHKDDF....","...ACHKHKHCB...."],
        ["....AAABAC......",".....DCCCCB.....","....HCCCCCCD....","....BCCCCCCH....","....CGDDDEFD....",".....GGGDDHB....",".....GGIDHBA....",".....GDDDDCC....","......DDHIAA....","......CIIIIJ....","......IIIHBA....",".....JIIKJKA....",".....AIILCBG....","...GDJKMKCGI....","...GDJGIIKDD....","....CCKLBGDD...."],
      ],
      left: [
        [".....AB.........",".....DCCCB......",".....CCCCB......",".....CCCD.......",".....CCFB.......",".....FGA........","..KL.HHAB.......","..KL.HIA........","..KL.DJBB.......",".....DHHHK......",".....LMAAB......",".....HHMB.......",".....GHMB.......",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
        ["......A.........",".....DCCCB......",".....CCCCB......",".....CCCD.......","......DB........","......EC........","..KL..FG........","..KL..HC........","..KL..AAA.......","......FFFI......","......JGEK......","......FLA.......","......FLH.......","......FFLA......","......FFLI......","......FFLI......"],
        [".........AB.....",".....DCCCB......",".....CCCCB......",".....CCCD.......",".......AFEE.....","........BGF.....","..KL...ABHH.....","..KL....BIH.....","..KL...AAJD.....","......KHHHD.....","......ABBLM.....",".......ALHH.....",".......ALHG.....",".......JLHN.....",".......ILHM.....",".......ILHH....."],
      ],
      right: [
        [".........AB.....","........CDE.....",".......ACCE.....",".......CFEE.....",".......AFEE.....","........BGF.....",".......ABHH.KL..","........BIH.KL..",".......AAJD.KL..","......KHHHD.....","......ABBLM.....",".......ALHH.....",".......ALHG.....",".......JLHN.....",".......ILHM.....",".......ILHH....."],
        [".........A......","........CDE.....",".......ACCE.....",".......CFEE.....","........CD......","........BE......","........FG..KL..","........BH..KL..",".......AAA..KL..","......IGGG......","......JEFK......",".......ALG......",".......HLG......","......ALGG......","......ILGG......","......ILGG......"],
        [".....AB.........","........CDE.....",".......ACCE.....",".......CFEE.....",".....CCFB.......",".....FGA........",".....HHAB...KL..",".....HIA....KL..",".....DJBB...KL..",".....DHHHK......",".....LMAAB......",".....HHMB.......",".....GHMB.......",".....NHMJ.......",".....LHMI.......",".....HHMI......."],
      ],
    },
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
