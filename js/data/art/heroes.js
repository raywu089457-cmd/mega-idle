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

  /* ---------- 弓手 archer — pointed hood, quiver, drawn bow arc ---------- */
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

  /* ---------- 法師 mage — pointy hat, floor robe, staff with glowing orb ---------- */
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

  /* ---------- 刺客 assassin — crouched, rose mask, twin daggers ---------- */
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

  /* ---------- 騎士 knight — plume helm, kite shield, vertical sword ---------- */
  h_knight: {
    w: 16, h: 16, rate: 280,
    pal: {
A: "#0a0905",
B: "#070503",
C: "#010100",
D: "#a16519",
E: "#df9542",
F: "#4f2c09",
G: "#2d2417",
H: "#161410",
I: "#9a9e99",
J: "#535756",
K: "#f3e0ac",
L: "#debe89"
    },
    framesRows: [
      [".AABCAAAABC.....", "CDEFFDEDDDFBB...", "..GFDEEHADEDGH..", ".CIJGFGKJADFJICB", ".CHJJCGKIHFIJHA.", ".CDFAGJIJJGGDDFC", "..ABJIBHHBIJHFC.", "..BFLIHEEHILFAA.", ".AIIJFELLEFHGJJC", "CJKKIJHHHHJJJJB.", ".HEKLEIKKIHDLDC.", "CELLEELLLLGFEDC.", "CELKIFLELEFBHAC.", ".AHHAFLALLGFDDC.", ".CFDFHJCIKJFDDC.", ".CBABCBBJIGCAB.."],
      ["................", ".AABCAAAABC.....", "CDEFFDEDDDFBB...", "..GFDEEHADEDGH..", ".CIJGFGKJADFJICB", ".CHJJCGKIHFIJHA.", ".CDFAGJIJJGGDDFC", "..ABJIBHHBIJHFC.", "..BFLIHEEHILFAA.", ".AIIJFELLEFHGJJC", "CJKKIJHHHHJJJJB.", ".HEKLEIKKIHDLDC.", "CELLEELLLLGFEDC.", "CELKIFLELEFBHAC.", ".AHHAFLALLGFDDC.", ".CFDFHJCIKJFDDC."],
      ["..AABCAAAABC....", ".CDEFFDEDDDFBB..", "...GFDEEHADEDGH.", "..CIJGFGKJADFJIC", "..CHJJCGKIHFIJHA", "..CDFAGJIJJGGDDF", "...ABJIBHHBIJHFC", "...BFLIHEEHILFAA", "..AIIJFELLEFHGJJ", ".CJKKIJHHHHJJJJB", "..HEKLEIKKIHDLDC", ".CELLEELLLLGFEDC", ".CELKIFLELEFBHAC", "..AHHAFLALLGFDDC", "..CFDFHJCIKJFDDC", "..CBABCBBJIGCAB."],
      [".AABCAAAABC.....", "CDEFFDEDDDFBB...", "..GFDEEHADEDGH..", ".CIJGFGKJADFJICB", ".CHJJCGKIHFIJHA.", ".CDFAGJIJJGGDDFC", "..ABJIBHHBIJHFC.", "..BFLIHEEHILFAA.", ".AIIJFELLEFHGJJC", "CJKKIJHHHHJJJJB.", ".HEKLEIKKIHDLDC.", "CELLEELLLLGFEDC.", "CELKIFLELEFBHAC.", "FDFHJCIKJFDDC...", "..AHHAFLALLGFDDC", ".CBABCBBJIGCAB.."],
      [".AABCAAAABC.....", "CDEFFDEDDDFBB...", "..GFDEEHADEDGH..", ".CIJGFGKJADFJICB", ".CHJJCGKIHFIJHA.", ".CDFAGJIJJGGDDFC", "..ABJIBHHBIJHFC.", "..BFLIHEEHILFAA.", ".AIIJFELLEFHGJJC", "CJKKIJHHHHJJJJB.", ".HEKLEIKKIHDLDC.", "CELLEELLLLGFEDC.", "CELKIFLELEFBHAC.", "...CFDFHJCIKJFDD", "AHHAFLALLGFDDC..", ".CBABCBBJIGCAB.."],
      ["..CDEFFDEDDDFBB.", "....GFDEEHADEDGH", "...CIJGFGKJADFJI", "...CHJJCGKIHFIJH", "...CDFAGJIJJGGDD", "....ABJIBHHBIJHF", "....BFLIHEEHILFA", "...AIIJFELLEFHGJ", "..CJKKIJHHHHJJJJ", "...HEKLEIKKIHDLD", "..CELLEELLLLGFED", "..CELKIFLELEFBHA", "...AHHAFLALLGFDD", "...CFDFHJCIKJFDD", "...CBABCBBJIGCAB", "................"],
      ["................", "ABCAAAABC.......", "EFFDEDDDFBB.....", "GFDEEHADEDGH....", "IJGFGKJADFJICB..", "HJJCGKIHFIJHA...", "DFAGJIJJGGDDFC..", "ABJIBHHBIJHFC...", "BFLIHEEHILFAA...", "AIIJFELLEFHGJJC.", "JKKIJHHHHJJJJB..", "HEKLEIKKIHDLDC..", "ELLEELLLLGFEDC..", "ELKIFLELEFBHAC..", "AHHAFLALLGFDDC..", "CFDFHJCIKJFDDC.."]
    ]
  },

  /* ---------- 牧師 priest — hood, cream robe, cross-headed staff ---------- */
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
