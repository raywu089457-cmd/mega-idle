/* 放置王國 MEGA IDLE — 每日世界首領（v200，對位 AFK Arena 扭曲時空）
   每日巨型魔物：3 次免費出戰（每次戰力×30 傷害，與公會首領同公式），
   總傷里程碑自動領獎（10/30/60/100%），擊殺發大獎；明日重置更強 BOSS（隨隊伍戰力成長）。
   傷害跨次累積 — 每日的輸出量化與成長天天可見。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.worldboss = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const ATTACKS = 3;
  // v245 每週討伐戰：週出戰次數里程碑（全勤 21 場 = 週 100 鑽＋1 券 — 週回訪錨點；量級 ≤ 深淵週結算防通膨）
  const WEEK_MILESTONES = [
    { atk: 7, r: { gems: 20 } },
    { atk: 14, r: { gems: 30, honor: 30 } },
    { atk: 21, r: { gems: 50, ticket: 1, honor: 50 } }
  ];
  function weekInfo() {
    const w = ensure(true);
    return { atk: w.weekAtk || 0, milestones: WEEK_MILESTONES, claimed: w.weekClaimed || {} };
  }
  const MILESTONES = [
    { pct: 0.1, dynamic: true }, // 金幣（依王國等級）＋素材各 ×2 — 手動發放
    { pct: 0.3, r: { gems: 30 } },
    { pct: 0.6, r: { gems: 50, ticket: 1 } },
    { pct: 1.0, r: { gems: 100, ticket: 2, honor: 50 } }
  ];

  function ensure(silent) {
    const st = S();
    if (!st.worldboss) st.worldboss = { day: "", hp: 0, maxHp: 0, dmg: 0, attacks: 0, claimed: {}, killed: false };
    const w = st.worldboss;
    // v245 週討伐戰欄位（舊檔補空）
    if (typeof w.week !== "string") w.week = "";
    if (typeof w.weekAtk !== "number") w.weekAtk = 0;
    if (!w.weekClaimed || typeof w.weekClaimed !== "object") w.weekClaimed = {};
    const wk2 = MG.sys.meta.weekKey();
    if (w.week !== wk2) {
      // 跨週：未領里程碑自動結算（漏領不損失 — 週回訪錨點）
      let autoN = 0;
      for (const ms of WEEK_MILESTONES) {
        const key = "w" + ms.atk;
        if (!w.weekClaimed[key] && (w.weekAtk || 0) >= ms.atk) {
          w.weekClaimed[key] = true;
          MG.sys.meta.grantReward(ms.r);
          autoN++;
        }
      }
      if (autoN > 0 && !silent) MG.ui.dom.toast("每週討伐結算：上次討伐週達成 " + autoN + " 項里程碑", "good", "icon_skull");
      w.week = wk2;
      w.weekAtk = 0;
      w.weekClaimed = {};
    }
    if (!w.claimed || typeof w.claimed !== "object") w.claimed = {};
    const today = U.today();
    if (w.day !== today) {
      w.day = today;
      w.dmg = 0; w.attacks = 0; w.claimed = {}; w.killed = false;
      // BOSS 血量隨隊伍戰力縮放（v219：×2.8→×2.2 — 3 次出戰傷害 = 136% 仍必殺，成長後可提前擊殺 — 速殺獎勵讓戰力成長天天可見）
      const tp = teamPower();
      const mh = Math.max(100000, Math.round(tp * 30 * 2.2));
      w.maxHp = mh; w.hp = mh;
      w.anchorTp = tp; // v219FIX：錨定戰力（速殺獎勵基準 — 當日成長後攻擊不重錨，2 擊殺可達）
    }
    return w;
  }
  /* 重用競技場/公會同款戰力公式（匯出存在） */
  function teamPower() {
    return MG.sys.guild && MG.sys.guild.teamPower ? MG.sys.guild.teamPower() : 0;
  }
  function goldReward() {
    const st = S();
    return Math.floor(2000 * Math.pow(1.35, Math.max(1, st.kingdom.level) - 1));
  }
  function left() {
    const w = ensure(true); // v245：badges 2Hz 觸發靜音（不彈週結算 toast）
    return w.killed ? 0 : Math.max(0, ATTACKS - w.attacks);
  }
  function info() {
    const w = ensure();
    return { hp: w.hp, maxHp: w.maxHp, dmg: w.dmg, attacks: w.attacks, killed: w.killed,
      pct: w.maxHp > 0 ? (w.maxHp - w.hp) / w.maxHp : 1, claimed: w.claimed };
  }
  function attack() {
    const st = S();
    const w = ensure();
    if (w.killed) return { ok: false, reason: "今日世界首領已被討伐，明日再戰" };
    if (w.attacks >= ATTACKS) return { ok: false, reason: "今日出戰次數已用完（每日 " + ATTACKS + " 次）" };
    w.attacks++;
    w.weekAtk = (w.weekAtk || 0) + 1; // v245 週討伐戰次數累計（週 key 重置於 ensure）
    // v219FIX：首擊條件式重錨 — 僅當戰力暴漲 >1.5×（換隊特徵）才重錨防「弱隊錨定→強隊出戰」刷速殺；
    // 誠實的當日成長（訓練/穿裝/升星 <50%）不重錨 → maxHp 固定而傷害成長 → 速殺獎勵可達
    if (w.dmg === 0 && w.attacks === 1) {
      const curTp = teamPower();
      if (curTp > (w.anchorTp || 0) * 1.5) {
        const mh = Math.max(100000, Math.round(curTp * 30 * 2.2));
        w.maxHp = mh; w.hp = mh;
        w.anchorTp = curTp;
      }
    }
    const dmg = Math.max(100, Math.round(teamPower() * 30));
    w.dmg += dmg;
    w.hp = Math.max(0, w.hp - dmg);
    const rewards = [];
    for (const ms of MILESTONES) {
      const key = String(ms.pct);
      if (!w.claimed[key] && w.dmg >= w.maxHp * ms.pct) {
        w.claimed[key] = true;
        if (ms.dynamic) {
          const g = goldReward();
          st.currencies.gold += g;
          for (const k in MG.config.MATS) st.mats[k] = (st.mats[k] || 0) + 2;
          rewards.push({ pct: 10, txt: "金幣 +" + U.fmt(g) + "・素材各 ×2" });
        } else {
          MG.sys.meta.grantReward(ms.r);
          rewards.push({ pct: Math.round(ms.pct * 100), txt: Object.keys(ms.r).map(k => (k === "gems" ? "鑽石 +" : k === "ticket" ? "招募券 ×" : "榮譽 +") + ms.r[k]).join("・") });
        }
      }
    }
    let killed = false, killBonus = 0;
    if (w.hp <= 0) {
      w.killed = true; killed = true;
      // v219 速殺獎勵：提前擊殺（2 擊 +20 鑽需戰力成長 ~10%；1 擊 +40 鑽需 ~2.2× 成長 — 終極目標）
      killBonus = Math.max(0, (ATTACKS - w.attacks)) * 20;
      if (killBonus) st.currencies.gems += killBonus;
      MG.core.audio.SFX.victory();
    }
    if (rewards.length) MG.core.audio.SFX.quest();
    return { ok: true, dmg, rewards, killed, killBonus, hp: w.hp, maxHp: w.maxHp };
  }
  /* v253 週討伐里程碑一鍵領取（登入聚合用 — fresh weekInfo 驗證防跨週孤兒重發，v245FIX 同模式） */
  function claimAllWeek() {
    const wi = weekInfo();
    let n = 0;
    for (const ms of WEEK_MILESTONES) {
      const key = "w" + ms.atk;
      if (!wi.claimed[key] && wi.atk >= ms.atk) {
        wi.claimed[key] = true;
        MG.sys.meta.grantReward(ms.r);
        n++;
      }
    }
    if (n) MG.core.audio.SFX.quest();
    return n;
  }
  return { ATTACKS, WEEK_MILESTONES, MILESTONES, ensure, teamPower, goldReward, left, info, attack, weekInfo, claimAllWeek };
})();
