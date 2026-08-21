/* 放置王國 MEGA IDLE — 試煉秘境（每日副本，v154，slice B5 延伸）
   市面放置英雄標準每日內容：三種高額保證收益副本、每日 3 次、午夜重置。
   勝率 = 我方戰力/(我方+推薦戰力)（與競技場/流浪英雄同公式），敗北得 30% 安慰獎。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.dungeon = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const ENTRIES = 3;

  const DEFS = [
    {
      id: "gold", name: "黃金秘境", icon: "icon_goldbag", unlockRegion: 0,
      desc: "秘境深處堆滿先王遺留的寶藏，勝者取之不盡。",
      // v680：指數軟封頂 min(kl-1,18)
      reward: (st) => {
        const exp = Math.min(18, Math.max(0, (st.kingdom.level || 1) - 1));
        return { gold: Math.floor(3000 * Math.pow(1.35, exp)) };
      }
    },
    {
      id: "exp", name: "智慧秘境", icon: "icon_pot_exp", unlockRegion: 2,
      desc: "古賢者的知識化為金色霧氣，呼吸之間皆是頓悟。",
      reward: (st) => {
        const exp = Math.min(18, Math.max(0, (st.kingdom.level || 1) - 1));
        return { exp: Math.floor(3000 * Math.pow(1.35, exp) * 0.6) };
      }
    },
    {
      id: "mats", name: "豐饒秘境", icon: "mat_crystal", unlockRegion: 4,
      desc: "九種礦脈在此交匯，大地把珍藏一次獻上。",
      reward: (st) => ({ mats: 3 + Math.floor(st.kingdom.level / 3) })
    }
  ];

  function ensure() {
    const st = S();
    if (!st.dungeon) st.dungeon = { day: "", uses: {} };
    const today = U.today();
    if (st.dungeon.day !== today) {
      st.dungeon.day = today;
      st.dungeon.uses = {};
    }
    return st.dungeon;
  }
  function defOf(id) { return DEFS.find(d => d.id === id); }
  function unlocked(id) {
    const st = S();
    const def = defOf(id);
    return def && (st.stats.maxRegionReached || 0) >= def.unlockRegion;
  }
  function left(id) {
    ensure();
    return Math.max(0, ENTRIES - ((S().dungeon.uses[id] || 0)));
  }
  function teamPower() {
    const st = S();
    const ids = MG.sys.hunters.teamOf().filter(Boolean);
    return ids.reduce((a, id) => {
      const h = st.hunters.find(x => x.id === id);
      return a + (h ? MG.sys.hunters.power(h) : 0);
    }, 0);
  }
  function recPower() {
    const st = S();
    // v224FIX：以隊伍戰力為錨（max(0.35×kl 曲線, 1.1×teamPower)）—
    // 原 200×1.5^(kl-1) 錨王國等級：離線結算使王國等級被動成長，卡關玩家勝率跌到 clamp 0.1；
    // v224FIX2：曲線指數封頂 min(kl-1,16) — 高王國等級時 1.5^kl 不會再反超 1.1×teamPower（勝率恆穩）
    // v832：加深軟封頂 min(kl-1,14) — kl≤15 不變；防高王國等級秘境 rec 牆
    // v836：加深軟封頂 min(kl-1,12) — kl≤13 不變；防高王國等級秘境 rec 牆
    // v840：加深軟封頂 min(kl-1,10) — kl≤11 不變；防高王國等級秘境 rec 牆
    // v844：加深軟封頂 min(kl-1,8) — kl≤9 不變；防高王國等級秘境 rec 牆
    // v848：加深軟封頂 min(kl-1,6) — kl≤7 不變；防高王國等級秘境 rec 牆
    return Math.max(
      Math.floor(200 * Math.pow(1.5, Math.min(st.kingdom.level - 1, 6)) * 0.35),
      Math.floor(teamPower() * 1.1)
    );
  }
  function winChance(id) {
    const def = defOf(id);
    if (!def || !unlocked(id)) return 0;
    const p = teamPower();
    const rec = recPower();
    return U.clamp(p / (p + rec), 0.1, 0.98);
  }
  function run(id) {
    ensure();
    const st = S();
    const def = defOf(id);
    if (!def) return { ok: false, reason: "秘境不存在" };
    if (!unlocked(id)) return { ok: false, reason: "尚未抵達對應區域（擊敗前一區域 BOSS 解鎖）" };
    if (left(id) <= 0) return { ok: false, reason: "今日挑戰次數已用完（每日 " + ENTRIES + " 次）" };
    st.dungeon.uses[id] = (st.dungeon.uses[id] || 0) + 1;
    const w = U.chance(winChance(id));
    const r = def.reward(st);
    const mul = w ? 1 : 0.3;
    let gold = 0, exp = 0, mats = 0;
    if (r.gold) { gold = Math.round(r.gold * mul); MG.sys.game.addGold(gold, "試煉秘境"); }
    if (r.exp) {
      exp = Math.round(r.exp * mul);
      const team = MG.sys.hunters.formation();
      if (team.length) {
        const per = Math.max(1, Math.floor(exp / team.length));
        for (const h of team) MG.sys.hunters.gainExp(h, per, true);
      }
    }
    if (r.mats) {
      mats = Math.max(1, Math.round(r.mats * mul));
      for (const k in MG.config.MATS) st.mats[k] = (st.mats[k] || 0) + mats;
      if (MG.sys.meta && MG.sys.meta.bump) MG.sys.meta.bump("mat", 9 * mats); // v214FIX：秘境素材計入每日 d8
    }
    MG.core.audio.SFX[w ? "victory" : "hurt"]();
    return { ok: true, win: w, id, gold, exp, mats, mul, left: left(id) };
  }
  return { DEFS, ENTRIES, ensure, defOf, unlocked, left, teamPower, recPower, winChance, run };
})();
