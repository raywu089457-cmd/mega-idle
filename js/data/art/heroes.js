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
  h_sword: {
    w: 16, h: 16, rate: 280,
    pal: {
A: "#0a0703",
B: "#010000",
C: "#9d5e09",
D: "#cb7503",
E: "#5d370d",
F: "#352d1d",
G: "#1b1a18",
H: "#ead49a",
I: "#bc8e55",
J: "#100e0b",
K: "#645c4f",
L: "#ccb193"
    },
    framesRows: [
      [".AAABAAAAAB.....", "BCDEFDDDCDFAB...", "..GEDDHIDDDCFA..", ".BIDCCDHDECDDEBB", ".BCDEAFDDCECCAA.", ".BCDEFIJJDEGCCEB", "..AAKLJHHJLKGEB.", "BJAELLGHHGLLEAJ.", "BLKKFFIHHIFGFKLB", ".GLLKKGGGJFLLIJ.", "BIILKKLHHKJEICB.", "BIHLEGKKKKJCICB.", "BCHHKBCDCDFAJA..", ".AJJAGKAKKGB....", "....BFLBDHFB....", ".....JJAKHKB...."],
      ["................", ".AAABAAAAAB.....", "BCDEFDDDCDFAB...", "..GEDDHIDDDCFA..", ".BIDCCDHDECDDEBB", ".BCDEAFDDCECCAA.", ".BCDEFIJJDEGCCEB", "..AAKLJHHJLKGEB.", "BJAELLGHHGLLEAJ.", "BLKKFFIHHIFGFKLB", ".GLLKKGGGJFLLIJ.", "BIILKKLHHKJEICB.", "BIHLEGKKKKJCICB.", "BCHHKBCDCDFAJA..", ".AJJAGKAKKGB....", "....BFLBDHFB...."],
      ["..AAABAAAAAB....", ".BCDEFDDDCDFAB..", "...GEDDHIDDDCFA.", "..BIDCCDHDECDDEB", "..BCDEAFDDCECCAA", "..BCDEFIJJDEGCCE", "...AAKLJHHJLKGEB", ".BJAELLGHHGLLEAJ", ".BLKKFFIHHIFGFKL", "..GLLKKGGGJFLLIJ", ".BIILKKLHHKJEICB", ".BIHLEGKKKKJCICB", ".BCHHKBCDCDFAJA.", "..AJJAGKAKKGB...", ".....BFLBDHFB...", "......JJAKHKB..."],
      [".AAABAAAAAB.....", "BCDEFDDDCDFAB...", "..GEDDHIDDDCFA..", ".BIDCCDHDECDDEBB", ".BCDEAFDDCECCAA.", ".BCDEFIJJDEGCCEB", "..AAKLJHHJLKGEB.", "BJAELLGHHGLLEAJ.", "BLKKFFIHHIFGFKLB", ".GLLKKGGGJFLLIJ.", "BIILKKLHHKJEICB.", "BIHLEGKKKKJCICB.", "BCHHKBCDCDFAJA..", "..BFLBDHFB......", "..AJJAGKAKKGB...", ".....JJAKHKB...."],
      [".AAABAAAAAB.....", "BCDEFDDDCDFAB...", "..GEDDHIDDDCFA..", ".BIDCCDHDECDDEBB", ".BCDEAFDDCECCAA.", ".BCDEFIJJDEGCCEB", "..AAKLJHHJLKGEB.", "BJAELLGHHGLLEAJ.", "BLKKFFIHHIFGFKLB", ".GLLKKGGGJFLLIJ.", "BIILKKLHHKJEICB.", "BIHLEGKKKKJCICB.", "BCHHKBCDCDFAJA..", "......BFLBDHFB..", "AJJAGKAKKGB.....", ".....JJAKHKB...."],
      ["..BCDEFDDDCDFAB.", "....GEDDHIDDDCFA", "...BIDCCDHDECDDE", "...BCDEAFDDCECCA", "...BCDEFIJJDEGCC", "....AAKLJHHJLKGE", "..BJAELLGHHGLLEA", "..BLKKFFIHHIFGFK", "...GLLKKGGGJFLLI", "..BIILKKLHHKJEIC", "..BIHLEGKKKKJCIC", "..BCHHKBCDCDFAJA", "...AJJAGKAKKGB..", "......BFLBDHFB..", ".......JJAKHKB..", "................"],
      ["................", "AABAAAAAB.......", "DEFDDDCDFAB.....", "GEDDHIDDDCFA....", "IDCCDHDECDDEBB..", "CDEAFDDCECCAA...", "CDEFIJJDEGCCEB..", "AAKLJHHJLKGEB...", "AELLGHHGLLEAJ...", "LKKFFIHHIFGFKLB.", "GLLKKGGGJFLLIJ..", "IILKKLHHKJEICB..", "IHLEGKKKKJCICB..", "CHHKBCDCDFAJA...", "AJJAGKAKKGB.....", "...BFLBDHFB....."]
    ]
  },

  h_archer: {
    w: 16, h: 16, rate: 280,
    pal: {
A: "#000201",
B: "#0b0703",
C: "#19160d",
D: "#34b965",
E: "#72bb6a",
F: "#456b37",
G: "#784d08",
H: "#b26915",
I: "#48411b",
J: "#dba966",
K: "#eed592",
L: "#c58332"
    },
    framesRows: [
      [".....ABBBBBBA...", "....ACDEDDDDFA..", ".BBBFDGGGGGFDFA.", "AGHHGGHGHHHGFFA.", ".BIGGHGJGGGGFFA.", ".AGHHICCJJIBFFA.", ".AGGBFKAKKCEEBA.", "..BAIJKCKKIEKGA.", "....CCCJKKJICC..", "...AGJFCCCCFELA.", "..BFEELDEDDLLDFA", ".AHKKJLLJLHHLLLA", ".ALJKEBDDDDFBBB.", "..BBCBCJBJKFA...", ".....ACDAJKGA...", ".......AADJGA..."],
      ["................", ".....ABBBBBBA...", "....ACDEDDDDFA..", ".BBBFDGGGGGFDFA.", "AGHHGGHGHHHGFFA.", ".BIGGHGJGGGGFFA.", ".AGHHICCJJIBFFA.", ".AGGBFKAKKCEEBA.", "..BAIJKCKKIEKGA.", "....CCCJKKJICC..", "...AGJFCCCCFELA.", "..BFEELDEDDLLDFA", ".AHKKJLLJLHHLLLA", ".ALJKEBDDDDFBBB.", "..BBCBCJBJKFA...", ".....ACDAJKGA..."],
      ["......ABBBBBBA..", ".....ACDEDDDDFA.", "..BBBFDGGGGGFDFA", ".AGHHGGHGHHHGFFA", "..BIGGHGJGGGGFFA", "..AGHHICCJJIBFFA", "..AGGBFKAKKCEEBA", "...BAIJKCKKIEKGA", ".....CCCJKKJICC.", "....AGJFCCCCFELA", "...BFEELDEDDLLDF", "..AHKKJLLJLHHLLL", "..ALJKEBDDDDFBBB", "...BBCBCJBJKFA..", "......ACDAJKGA..", "........AADJGA.."],
      [".....ABBBBBBA...", "....ACDEDDDDFA..", ".BBBFDGGGGGFDFA.", "AGHHGGHGHHHGFFA.", ".BIGGHGJGGGGFFA.", ".AGHHICCJJIBFFA.", ".AGGBFKAKKCEEBA.", "..BAIJKCKKIEKGA.", "....CCCJKKJICC..", "...AGJFCCCCFELA.", "..BFEELDEDDLLDFA", ".AHKKJLLJLHHLLLA", ".ALJKEBDDDDFBBB.", "...ACDAJKGA.....", "...BBCBCJBJKFA..", ".......AADJGA..."],
      [".....ABBBBBBA...", "....ACDEDDDDFA..", ".BBBFDGGGGGFDFA.", "AGHHGGHGHHHGFFA.", ".BIGGHGJGGGGFFA.", ".AGHHICCJJIBFFA.", ".AGGBFKAKKCEEBA.", "..BAIJKCKKIEKGA.", "....CCCJKKJICC..", "...AGJFCCCCFELA.", "..BFEELDEDDLLDFA", ".AHKKJLLJLHHLLLA", ".ALJKEBDDDDFBBB.", ".......ACDAJKGA.", ".BBCBCJBJKFA....", ".......AADJGA..."],
      ["......ACDEDDDDFA", "...BBBFDGGGGGFDF", "..AGHHGGHGHHHGFF", "...BIGGHGJGGGGFF", "...AGHHICCJJIBFF", "...AGGBFKAKKCEEB", "....BAIJKCKKIEKG", "......CCCJKKJICC", ".....AGJFCCCCFEL", "....BFEELDEDDLLD", "...AHKKJLLJLHHLL", "...ALJKEBDDDDFBB", "....BBCBCJBJKFA.", ".......ACDAJKGA.", ".........AADJGA.", "................"],
      ["................", "...ABBBBBBA.....", "..ACDEDDDDFA....", "BBFDGGGGGFDFA...", "HHGGHGHHHGFFA...", "IGGHGJGGGGFFA...", "GHHICCJJIBFFA...", "GGBFKAKKCEEBA...", "BAIJKCKKIEKGA...", "...CCCJKKJICC...", "..AGJFCCCCFELA..", ".BFEELDEDDLLDFA.", "AHKKJLLJLHHLLLA.", "ALJKEBDDDDFBBB..", ".BBCBCJBJKFA....", "....ACDAJKGA...."]
    ]
  },

  h_mage: {
    w: 16, h: 16, rate: 280,
    pal: {
A: "#09060a",
B: "#010102",
C: "#151012",
D: "#cdae2b",
E: "#9d7f45",
F: "#bc8636",
G: "#edd05a",
H: "#4c3444",
I: "#6f458d",
J: "#a061e9",
K: "#9759df",
L: "#8a5d69"
    },
    framesRows: [
      [".......AB.......", ".....BCDECB.....", "...BBCFGFECBB...", ".BBCEDDDFEHECBB.", "BHFFFFDDFEFFEEHB", "BEDDFFFFFFFFDDEB", ".AAEGGGGGDDDEAA.", "...CCHDAADHCC...", "..AIIAABBAAIIA..", ".AIJKIAAAAIJJIA.", "BIJKKKKJKKKKKKIB", "BFGGLKKKKKKKKJFB", "BFGGLCJKKJCIJKIB", "BACCACJKKJCHJIA.", ".BIKHCKKKJCIIA..", "..ACABACKJHAA..."],
      ["................", ".......AB.......", ".....BCDECB.....", "...BBCFGFECBB...", ".BBCEDDDFEHECBB.", "BHFFFFDDFEFFEEHB", "BEDDFFFFFFFFDDEB", ".AAEGGGGGDDDEAA.", "...CCHDAADHCC...", "..AIIAABBAAIIA..", ".AIJKIAAAAIJJIA.", "BIJKKKKJKKKKKKIB", "BFGGLKKKKKKKKJFB", "BFGGLCJKKJCIJKIB", "BACCACJKKJCHJIA.", ".BIKHCKKKJCIIA.."],
      ["........AB......", "......BCDECB....", "....BBCFGFECBB..", "..BBCEDDDFEHECBB", ".BHFFFFDDFEFFEEH", ".BEDDFFFFFFFFDDE", "..AAEGGGGGDDDEAA", "....CCHDAADHCC..", "...AIIAABBAAIIA.", "..AIJKIAAAAIJJIA", ".BIJKKKKJKKKKKKI", ".BFGGLKKKKKKKKJF", ".BFGGLCJKKJCIJKI", ".BACCACJKKJCHJIA", "..BIKHCKKKJCIIA.", "...ACABACKJHAA.."],
      [".......AB.......", ".....BCDECB.....", "...BBCFGFECBB...", ".BBCEDDDFEHECBB.", "BHFFFFDDFEFFEEHB", "BEDDFFFFFFFFDDEB", ".AAEGGGGGDDDEAA.", "...CCHDAADHCC...", "..AIIAABBAAIIA..", ".AIJKIAAAAIJJIA.", "BIJKKKKJKKKKKKIB", "BFGGLKKKKKKKKJFB", "BFGGLCJKKJCIJKIB", "IKHCKKKJCIIA....", ".BACCACJKKJCHJIA", "..ACABACKJHAA..."],
      [".......AB.......", ".....BCDECB.....", "...BBCFGFECBB...", ".BBCEDDDFEHECBB.", "BHFFFFDDFEFFEEHB", "BEDDFFFFFFFFDDEB", ".AAEGGGGGDDDEAA.", "...CCHDAADHCC...", "..AIIAABBAAIIA..", ".AIJKIAAAAIJJIA.", "BIJKKKKJKKKKKKIB", "BFGGLKKKKKKKKJFB", "BFGGLCJKKJCIJKIB", "...BIKHCKKKJCIIA", "ACCACJKKJCHJIA..", "..ACABACKJHAA..."],
      [".......BCDECB...", ".....BBCFGFECBB.", "...BBCEDDDFEHECB", "..BHFFFFDDFEFFEE", "..BEDDFFFFFFFFDD", "...AAEGGGGGDDDEA", ".....CCHDAADHCC.", "....AIIAABBAAIIA", "...AIJKIAAAAIJJI", "..BIJKKKKJKKKKKK", "..BFGGLKKKKKKKKJ", "..BFGGLCJKKJCIJK", "..BACCACJKKJCHJI", "...BIKHCKKKJCIIA", "....ACABACKJHAA.", "................"],
      ["................", ".....AB.........", "...BCDECB.......", ".BBCFGFECBB.....", "BCEDDDFEHECBB...", "FFFFDDFEFFEEHB..", "DDFFFFFFFFDDEB..", "AEGGGGGDDDEAA...", ".CCHDAADHCC.....", ".AIIAABBAAIIA...", "AIJKIAAAAIJJIA..", "IJKKKKJKKKKKKIB.", "FGGLKKKKKKKKJFB.", "FGGLCJKKJCIJKIB.", "ACCACJKKJCHJIA..", "BIKHCKKKJCIIA..."]
    ]
  },

  h_assassin: {
    w: 16, h: 16, rate: 280,
    pal: {
A: "#0d0708",
B: "#010001",
C: "#1d1411",
D: "#fa679b",
E: "#fb709a",
F: "#4e3424",
G: "#ebe47d",
H: "#a25347",
I: "#aa8633",
J: "#dbbe52",
K: "#e88b64",
L: "#d36b76"
    },
    framesRows: [
      [".....AAAAAAAB...", "...ACDEDDDDDFA..", "..BFEDGEDEEDEHB.", "..BFGEEEDDDDGIB.", "..AFGJEEEEEJJIA.", ".BHKICIJJJJCIKLB", ".BIIAGCACCAGFFIB", ".BFIAGCHJIAGFFIB", "..AAACLDDDLCAAA.", ".BFIJICCCCCLIIHB", ".AFLGEDEEDLELHHB", "BIGGKDJJJJIDLKIB", "BIJGGALEEEECAAA.", ".AAAABDFFEEAB...", ".....BICFJIAB...", "......ABFEECB..."],
      ["................", ".....AAAAAAAB...", "...ACDEDDDDDFA..", "..BFEDGEDEEDEHB.", "..BFGEEEDDDDGIB.", "..AFGJEEEEEJJIA.", ".BHKICIJJJJCIKLB", ".BIIAGCACCAGFFIB", ".BFIAGCHJIAGFFIB", "..AAACLDDDLCAAA.", ".BFIJICCCCCLIIHB", ".AFLGEDEEDLELHHB", "BIGGKDJJJJIDLKIB", "BIJGGALEEEECAAA.", ".AAAABDFFEEAB...", ".....BICFJIAB..."],
      ["......AAAAAAAB..", "....ACDEDDDDDFA.", "...BFEDGEDEEDEHB", "...BFGEEEDDDDGIB", "...AFGJEEEEEJJIA", "..BHKICIJJJJCIKL", "..BIIAGCACCAGFFI", "..BFIAGCHJIAGFFI", "...AAACLDDDLCAAA", "..BFIJICCCCCLIIH", "..AFLGEDEEDLELHH", ".BIGGKDJJJJIDLKI", ".BIJGGALEEEECAAA", "..AAAABDFFEEAB..", "......BICFJIAB..", ".......ABFEECB.."],
      [".....AAAAAAAB...", "...ACDEDDDDDFA..", "..BFEDGEDEEDEHB.", "..BFGEEEDDDDGIB.", "..AFGJEEEEEJJIA.", ".BHKICIJJJJCIKLB", ".BIIAGCACCAGFFIB", ".BFIAGCHJIAGFFIB", "..AAACLDDDLCAAA.", ".BFIJICCCCCLIIHB", ".AFLGEDEEDLELHHB", "BIGGKDJJJJIDLKIB", "BIJGGALEEEECAAA.", "...BICFJIAB.....", "..AAAABDFFEEAB..", "......ABFEECB..."],
      [".....AAAAAAAB...", "...ACDEDDDDDFA..", "..BFEDGEDEEDEHB.", "..BFGEEEDDDDGIB.", "..AFGJEEEEEJJIA.", ".BHKICIJJJJCIKLB", ".BIIAGCACCAGFFIB", ".BFIAGCHJIAGFFIB", "..AAACLDDDLCAAA.", ".BFIJICCCCCLIIHB", ".AFLGEDEEDLELHHB", "BIGGKDJJJJIDLKIB", "BIJGGALEEEECAAA.", ".......BICFJIAB.", "AAAABDFFEEAB....", "......ABFEECB..."],
      [".....ACDEDDDDDFA", "....BFEDGEDEEDEH", "....BFGEEEDDDDGI", "....AFGJEEEEEJJI", "...BHKICIJJJJCIK", "...BIIAGCACCAGFF", "...BFIAGCHJIAGFF", "....AAACLDDDLCAA", "...BFIJICCCCCLII", "...AFLGEDEEDLELH", "..BIGGKDJJJJIDLK", "..BIJGGALEEEECAA", "...AAAABDFFEEAB.", ".......BICFJIAB.", "........ABFEECB.", "................"],
      ["................", "...AAAAAAAB.....", ".ACDEDDDDDFA....", "BFEDGEDEEDEHB...", "BFGEEEDDDDGIB...", "AFGJEEEEEJJIA...", "HKICIJJJJCIKLB..", "IIAGCACCAGFFIB..", "FIAGCHJIAGFFIB..", ".AAACLDDDLCAAA..", "BFIJICCCCCLIIHB.", "AFLGEDEEDLELHHB.", "IGGKDJJJJIDLKIB.", "IJGGALEEEECAAA..", "AAAABDFFEEAB....", "....BICFJIAB...."]
    ]
  },

  h_knight: {
    w: 16, h: 16, rate: 160,
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
N: "#7e5792"
    },
    dirs: {
      down: [
        ["......ABCA......", ".....DEFGFB.....", "....HIGFGFID....", "....BIFFFFFH....", "....HHFJJFFD....", "....DCBEJCHD....", "....AFKLJBJH....", ".....HJEJEJD....", "....AAHFFIDA....", "...CMMLKMLMM....", "...AHLMMMMMD....", "....ALMMMMMB....", "....CDCKNEDL....", "...DEBLMMMBJ....", "...DICHLCKCI....", "....BADLDBAD...."],
        [".....ABCB.......", "....BCDEEC......", "...FDEGEGEC.....", "...BDDGGGGDA....", "...CCHGHGGC.....", "...AFFFGFIC.....", "....JHFGFJGA....", "....BJHHHHI.....", "...BIIDHHFBB....", "...KKKKKKKKKF...", "...ALKKKKKLB....", "....BLKMKKF.....", "....FIMKKFIA....", "...AKLKNKLKI....", "...BGHLILJEF....", "...ACILILICB...."],
        ["....AAABAC......", "....ADEEEDBC....", "...ADFFDEEFB....", "...AGBFFFEFD....", "....CGFHDEFD....", ".....GGGHDIB....", ".....GGJHIBA....", ".....GHHFDCC....", "......IFIJAA....", "......CJJJJK....", "......JJJIBA....", ".....KJJLKLA....", ".....AJJMCBG....", "...GFKLNLCGJ....", "...GFKGJJLIH....", "....CCLMBGHD...."]
      ],
      up: [
        ["......ABCA......", ".....DEFGFB.....", "....HIGFGFID....", "....BIFIIFFH....", "....HHIIIIID....", "....DCBIICHD....", "....AIJKIBIH....", ".....HIIIIID....", "....AAHIIIDA....", "...CLLKJLKLL....", "...AHKLLLLLD....", "....AKLLLLLB....", "....CDCJMEDK....", "...DIBKLLLBI....", "...DICHKCJCI....", "....BADKDBAD...."],
        [".....ABCB.......", "....BCDEEC......", "...FDEGEGEC.....", "...BDDDDDGDA....", "...CCDDDDDC.....", "...AFFFDFHC.....", "....DDFDFIDA....", "....BDDDDDH.....", "...BHHDDDFBB....", "...JJJJJJJJJF...", "...AKJJJJJKB....", "....BKJLJJF.....", "....FHLJJFHA....", "...AJKJMJKJH....", "...BDDKHKDDF....", "...ACHKHKHCB...."],
        ["....AAABAC......", "....ADEEEDBC....", "...ADFFDEEFB....", "...AGBDDDEFD....", "....CGDDDEFD....", ".....GGGDDHB....", ".....GGIDHBA....", ".....GDDDDCC....", "......DDHIAA....", "......CIIIIJ....", "......IIIHBA....", ".....JIIKJKA....", ".....AIILCBG....", "...GDJKMKCGI....", "...GDJGIIKDD....", "....CCKLBGDD...."]
      ],
      left: [
        [".....AB.........", ".....CDE........", ".....CCCB.......", ".....CCFE.......", ".....CCFB.......", ".....FGA........", ".....HHAB.......", ".....HIA........", ".....DJBB.......", ".....DHHHK......", ".....LMAAB......", ".....HHMB.......", ".....GHMB.......", ".....NHMJ.......", ".....LHMI.......", ".....HHMI......."],
        ["......A.........", "......BC........", "......DBA.......", "......DBA.......", "......DB........", "......EC........", "......FG........", "......HC........", "......AAA.......", "......FFFI......", "......JGEK......", "......FLA.......", "......FLH.......", "......FFLA......", "......FFLI......", "......FFLI......"],
        [".........AB.....", "........CDE.....", ".......AEEE.....", ".......CFEE.....", ".......AFEE.....", "........BGF.....", ".......ABHH.....", "........BIH.....", ".......AAJD.....", "......KHHHD.....", "......ABBLM.....", ".......ALHH.....", ".......ALHG.....", ".......JLHN.....", ".......ILHM.....", ".......ILHH....."]
      ],
      right: [
        [".........AB.....", "........CDE.....", ".......AEEE.....", ".......CFEE.....", ".......AFEE.....", "........BGF.....", ".......ABHH.....", "........BIH.....", ".......AAJD.....", "......KHHHD.....", "......ABBLM.....", ".......ALHH.....", ".......ALHG.....", ".......JLHN.....", ".......ILHM.....", ".......ILHH....."],
        [".........A......", "........BC......", ".......ACD......", ".......ACD......", "........CD......", "........BE......", "........FG......", "........BH......", ".......AAA......", "......IGGG......", "......JEFK......", ".......ALG......", ".......HLG......", "......ALGG......", "......ILGG......", "......ILGG......"],
        [".....AB.........", ".....CDE........", ".....CCCB.......", ".....CCFE.......", ".....CCFB.......", ".....FGA........", ".....HHAB.......", ".....HIA........", ".....DJBB.......", ".....DHHHK......", ".....LMAAB......", ".....HHMB.......", ".....GHMB.......", ".....NHMJ.......", ".....LHMI.......", ".....HHMI......."]
      ]
    }
  },

  h_priest: {
    w: 16, h: 16, rate: 280,
    pal: {
A: "#010101",
B: "#0d0b0a",
C: "#4a4947",
D: "#d0cfce",
E: "#f1ece2",
F: "#6f6355",
G: "#a9a9a9",
H: "#2a2017",
I: "#8d877e",
J: "#c5baa9",
K: "#e6d3b1",
L: "#eae1ce"
    },
    framesRows: [
      [".....ABBBBA.....", "....ACDDDDCA....", "...BCDEEEDDCB...", "..AFEGBBHBIDFA..", "..BGGHFHFHAIIB..", ".AGFBBCJCBBBFIA.", ".AJCCGBKKBGFCGA.", ".AICFJHKKHJFCIA.", "..BFFHKKKKHFIB..", "..BBFGHHHBBCGIB.", ".BGDIGDEEBIDDEIA", "AGEEFHDJDBIEEEJA", "AGJGCHEDEHILLLGA", "AIIKFHEKLDHILJGA", "AGKKFCLKJLCFKKGA", ".BBBFLLLKKLFBBB."],
      ["................", ".....ABBBBA.....", "....ACDDDDCA....", "...BCDEEEDDCB...", "..AFEGBBHBIDFA..", "..BGGHFHFHAIIB..", ".AGFBBCJCBBBFIA.", ".AJCCGBKKBGFCGA.", ".AICFJHKKHJFCIA.", "..BFFHKKKKHFIB..", "..BBFGHHHBBCGIB.", ".BGDIGDEEBIDDEIA", "AGEEFHDJDBIEEEJA", "AGJGCHEDEHILLLGA", "AIIKFHEKLDHILJGA", "AGKKFCLKJLCFKKGA"],
      ["......ABBBBA....", ".....ACDDDDCA...", "....BCDEEEDDCB..", "...AFEGBBHBIDFA.", "...BGGHFHFHAIIB.", "..AGFBBCJCBBBFIA", "..AJCCGBKKBGFCGA", "..AICFJHKKHJFCIA", "...BFFHKKKKHFIB.", "...BBFGHHHBBCGIB", "..BGDIGDEEBIDDEI", ".AGEEFHDJDBIEEEJ", ".AGJGCHEDEHILLLG", ".AIIKFHEKLDHILJG", ".AGKKFCLKJLCFKKG", "..BBBFLLLKKLFBBB"],
      [".....ABBBBA.....", "....ACDDDDCA....", "...BCDEEEDDCB...", "..AFEGBBHBIDFA..", "..BGGHFHFHAIIB..", ".AGFBBCJCBBBFIA.", ".AJCCGBKKBGFCGA.", ".AICFJHKKHJFCIA.", "..BFFHKKKKHFIB..", "..BBFGHHHBBCGIB.", ".BGDIGDEEBIDDEIA", "AGEEFHDJDBIEEEJA", "AGJGCHEDEHILLLGA", "KKFCLKJLCFKKGA..", ".AIIKFHEKLDHILJG", ".BBBFLLLKKLFBBB."],
      [".....ABBBBA.....", "....ACDDDDCA....", "...BCDEEEDDCB...", "..AFEGBBHBIDFA..", "..BGGHFHFHAIIB..", ".AGFBBCJCBBBFIA.", ".AJCCGBKKBGFCGA.", ".AICFJHKKHJFCIA.", "..BFFHKKKKHFIB..", "..BBFGHHHBBCGIB.", ".BGDIGDEEBIDDEIA", "AGEEFHDJDBIEEEJA", "AGJGCHEDEHILLLGA", "..AGKKFCLKJLCFKK", "IIKFHEKLDHILJGA.", ".BBBFLLLKKLFBBB."],
      ["......ACDDDDCA..", ".....BCDEEEDDCB.", "....AFEGBBHBIDFA", "....BGGHFHFHAIIB", "...AGFBBCJCBBBFI", "...AJCCGBKKBGFCG", "...AICFJHKKHJFCI", "....BFFHKKKKHFIB", "....BBFGHHHBBCGI", "...BGDIGDEEBIDDE", "..AGEEFHDJDBIEEE", "..AGJGCHEDEHILLL", "..AIIKFHEKLDHILJ", "..AGKKFCLKJLCFKK", "...BBBFLLLKKLFBB", "................"],
      ["................", "...ABBBBA.......", "..ACDDDDCA......", ".BCDEEEDDCB.....", "AFEGBBHBIDFA....", "BGGHFHFHAIIB....", "GFBBCJCBBBFIA...", "JCCGBKKBGFCGA...", "ICFJHKKHJFCIA...", ".BFFHKKKKHFIB...", ".BBFGHHHBBCGIB..", "BGDIGDEEBIDDEIA.", "GEEFHDJDBIEEEJA.", "GJGCHEDEHILLLGA.", "IIKFHEKLDHILJGA.", "GKKFCLKJLCFKKGA."]
    ]
  },
};
