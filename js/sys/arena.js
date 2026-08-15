/* 放置王國 MEGA IDLE — 競技場（PvP 天梯，v150，slice B5 延伸）
   市場放置英雄標準 PvP 設計：10 人天梯、每日 5 次挑戰、每週一結算重置。
   對手為戰力縮放的 AI 名冊；勝率 = 我方戰力/(我方+敵方)（與流浪英雄狩獵同公式）。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.arena = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const SIZE = 10;
  // rank 1..10 對手戰力倍率（相對我方隊伍戰力，第一名最強）
  const POWER_MUL = [3.2, 2.5, 2.0, 1.65, 1.4, 1.2, 1.05, 0.95, 0.85, 0.75];
  // 首殺獎勵（鑽石，按排名 index 0=第 1 名 → 最高）v219：210→180（與勝場/名次加成對沖 — 週產淨 +6%）
  const FIRST_WIN_GEMS = [35, 25, 22, 22, 18, 18, 12, 12, 8, 8];
  // v219 週結算非線性表（以本週最佳名次計）：第 1 名 60 鑽 = 第 10 名的 30 倍（原線性僅 10 倍差距 — 名次死價值）
  const RANK_REW = [60, 48, 38, 30, 24, 18, 13, 9, 5, 2];
  const WINS_BONUS_PER = 2;  // 每場勝利 +2 鑽
  const WINS_BONUS_MAX = 15; // 勝場加成封頂
  const DAILY_FIGHTS = 5;
  const DAILY_REWARD_N = 3;   // 每日打滿 3 場 → 參與獎勵
  const DAILY_REWARD = 20;

  function weekKey() {
    // v205FIX：monday 分桶（原 SO 公式週日切換＋跨年多次切換 — 與「每週一結算」不一致）
    const d = new Date();
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return monday.getFullYear() + "-W" + Math.floor((monday - new Date(monday.getFullYear(), 0, 1)) / 864e5 / 7 + 1);
  }
  function teamPower() {
    const st = S();
    const ids = MG.sys.hunters.teamOf().filter(Boolean);
    return ids.reduce((a, id) => {
      const h = st.hunters.find(x => x.id === id);
      return a + (h ? MG.sys.hunters.power(h) : 0);
    }, 0);
  }
  function rankReward(rank) { return RANK_REW[Math.max(0, Math.min(SIZE - 1, (rank || SIZE) - 1))]; } // v219：非線性表（以最佳名次計）
  function genOpps() {
    const p = teamPower();
    const clsList = Object.keys(MG.data.hunters.classes);
    const out = [];
    for (let i = 0; i < SIZE; i++) {
      const cls = U.pick(clsList);
      const rarity = Math.min(6, Math.max(1, 1 + Math.floor((SIZE - 1 - i) / 2)));
      out.push({
        name: MG.data.names.gen(), cls, rarity,
        power: Math.max(30, Math.round(p * POWER_MUL[i] * U.rand(0.9, 1.1))),
        defeated: false
      });
    }
    return out; // index 0 = 第 1 名（最強）
  }
  /* 週/日重置檢查；回傳週結算鑽石（>0 時 UI 顯示結算通知）
     v211：silent 參數 — badges 2Hz 唯讀檢查觸發時不彈 toast（發獎保留，自動入帳對玩家有利） */
  function ensure(silent) {
    const st = S();
    const ar = st.arena || (st.arena = { week: "", rank: SIZE, opps: [], fights: 0, day: "", claimed: {} });
    // v219 防禦：舊檔補欄（bestRank/wins）
    if (typeof ar.bestRank !== "number") ar.bestRank = ar.rank || SIZE;
    if (typeof ar.wins !== "number") ar.wins = 0;
    // v240：防守欄位（舊檔補空 — defenseIds 過濾 dangling）
    if (!Array.isArray(ar.defenseTeam)) ar.defenseTeam = [];
    if (typeof ar.defWaves !== "number") ar.defWaves = 0;
    if (!Array.isArray(ar.defLog)) ar.defLog = [];
    let payout = 0, payoutRank = 0, payoutWins = 0;
    const wk = weekKey();
    if (ar.week !== wk) {
      // v219：以「本週最佳名次」結算（週中衝榜每次勝利都累積價值 — 不再只認最終名次）＋勝場加成
      if (ar.week) {
        payout = rankReward(ar.bestRank) + Math.min(WINS_BONUS_MAX, (ar.wins || 0) * WINS_BONUS_PER);
        payoutRank = ar.bestRank;
        payoutWins = ar.wins || 0;
      }
      ar.week = wk;
      ar.rank = SIZE;
      ar.bestRank = SIZE;
      ar.wins = 0;
      ar.opps = genOpps();
      ar.claimed = {};
    }
    const today = U.today();
    if (ar.day !== today) { ar.day = today; ar.fights = 0; }
    if (!ar.claimed || typeof ar.claimed !== "object") ar.claimed = {};
    if (payout > 0) {
      st.currencies.gems += payout;
      // v211FIX：文案用結算前名次（原在 rank 重置後組文案 — 恆顯示「上週第 10 名」）
      if (!silent) MG.ui.dom.toast("競技場週結算：上週最佳第 " + payoutRank + " 名" + (payoutWins ? "・勝 " + payoutWins + " 場" : "") + " → +" + payout + " 鑽石", "good", "icon_honor");
    }
    return payout;
  }
  function winChance(i) {
    const ar = S().arena;
    const opp = ar && ar.opps && ar.opps[i];
    if (!opp) return 0;
    const p = teamPower();
    return U.clamp(p / (p + opp.power), 0.05, 0.95);
  }
  function fightsLeft() {
    ensure(true); // v211：badges 檢查觸發時 silent（不彈結算 toast）
    return Math.max(0, DAILY_FIGHTS - (S().arena.fights || 0));
  }
  /* v240 競技場防守：防守編隊（5 人 — 允許與出戰隊重疊，只讀快照戰力）＋離線幻影挑戰模擬
     設計要點：防守結果永不移動排名（排名只由自己的挑戰改變 — 消除「登入發現名次被偷」負面體感）；
     波次 = ⌊awayHours/4⌋+1（每日上限 3，day key 重置）；勝率 winChance 同公式；
     僅由 applyOffline 單一擁有權觸發（無 tick 路徑 — 天然無雙重結算） */
  function defenseIds() {
    const st = S();
    const ar = st.arena;
    if (!ar || !Array.isArray(ar.defenseTeam)) return [];
    return ar.defenseTeam.filter(id => id && st.hunters.some(h => h.id === id)); // 過濾 dangling（昇華重置後）
  }
  function defensePower() {
    const st = S();
    return defenseIds().reduce((a, id) => {
      const h = st.hunters.find(x => x.id === id);
      return a + (h ? MG.sys.hunters.power(h) : 0);
    }, 0);
  }
  function setDefenseTeam(ids) {
    ensure();
    S().arena.defenseTeam = (ids || []).filter(Boolean).slice(0, 5);
  }
  function simulateDefense(awayHours) {
    const st = S();
    ensure(true); // v240FIX：ensure 回傳 payout(number) — 原 const ar = ensure(true) 把數字當物件 → strict 下 TypeError → 離線彈窗整段失效
    const ar = st.arena;
    const dp = defensePower();
    if (dp <= 0) return { waves: 0, wins: 0, honor: 0, log: [] };
    const today = U.today();
    if (ar.defDay !== today) { ar.defDay = today; ar.defWaves = 0; ar.defLog = []; }
    const waves = Math.min(3, Math.floor(awayHours / 4) + 1);
    const available = Math.max(0, waves - (ar.defWaves || 0));
    const log = [];
    let wins = 0, honor = 0;
    for (let i = 0; i < available; i++) {
      const opp = { name: MG.data.names.gen(), power: Math.max(30, Math.round(dp * U.rand(0.9, 1.1))) };
      const w = U.chance(U.clamp(dp / (dp + opp.power), 0.05, 0.95));
      if (w) { wins++; honor += 8; } else honor += 2;
      log.push({ name: opp.name, win: w, honor: w ? 8 : 2 });
      ar.defWaves = (ar.defWaves || 0) + 1;
    }
    if (honor > 0) st.currencies.honor += honor;
    if (log.length) ar.defLog = (ar.defLog || []).concat(log).slice(-20); // 保留最近 20 筆
    return { waves: log.length, wins, honor, log };
  }
  function canChallenge(i) {
    ensure();
    const ar = S().arena;
    if ((ar.fights || 0) >= DAILY_FIGHTS) return false;
    if (i < 0 || i >= SIZE || !ar.opps[i]) return false;
    return i < ar.rank; // 可挑戰排名不低於你的對手（含同級守門人）
  }
  function fight(i) {
    ensure();
    const st = S();
    const ar = st.arena;
    if ((ar.fights || 0) >= DAILY_FIGHTS) return { ok: false, reason: "今日挑戰次數已用完（每日 " + DAILY_FIGHTS + " 次）" };
    if (i < 0 || i >= SIZE || !ar.opps[i]) return { ok: false, reason: "對手不存在" };
    if (i >= ar.rank) return { ok: false, reason: "只能挑戰排名不低於你的對手" };
    ar.fights++;
    const w = U.chance(winChance(i));
    let gems = 0, honor = 0, daily = false;
    if (w) {
      ar.rank = i + 1; // 戰勝 → 與對方交換名次
      ar.bestRank = Math.min(ar.bestRank || SIZE, i + 1); // v219：本週最佳名次（週中衝榜累積價值）
      ar.wins = (ar.wins || 0) + 1; // v219：勝場計數（週結算加成）
      ar.opps[i].defeated = true;
      if (!ar.claimed[i]) {
        ar.claimed[i] = true;
        gems += FIRST_WIN_GEMS[i];
        honor += 5 + (SIZE - 1 - i); // 名次越高首殺榮譽越多（第 1 名 +14）
      }
    }
    if (ar.fights === DAILY_REWARD_N) { // 剛好打滿 3 場 → 每日參與獎勵
      gems += DAILY_REWARD;
      daily = true;
    }
    if (gems) st.currencies.gems += gems;
    if (honor) st.currencies.honor += honor;
    return { ok: true, win: w, rank: ar.rank, gems, honor, daily, chance: winChance(i) };
  }
  return { SIZE, DAILY_REWARD, DAILY_REWARD_N, WINS_BONUS_MAX, WINS_BONUS_PER, ensure, genOpps, teamPower, winChance, fightsLeft, canChallenge, fight, weekKey, rankReward,
    defenseIds, defensePower, setDefenseTeam, simulateDefense }; // v240 競技場防守
})();
