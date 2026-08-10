/* 放置王國 MEGA IDLE — meta: quests, achievements, codex, check-in, awakening, honor (slice B5 owns) */
"use strict";
MG.sys = MG.sys || {};
MG.sys.meta = (function () {
  const U = MG.util;
  const QD = MG.data.quests;
  const S = () => MG.game.state;

  function questCur(req) {
    const st = S();
    switch (req.type) {
      case "kill": return st.stats.kills;
      case "boss": return st.stats.bossKills;
      case "stage": return st.stats.maxStage;
      case "region": return st.stats.maxTierReached || 1;
      case "gold": return st.stats.goldEarned;
      case "recruit": return st.stats.recruits;
      case "enhance": return st.stats.enhances;
      case "promote": return st.hunters.reduce((a, h) => a + (h.promoted || 0), 0);
      case "equip": return st.hunters.reduce((a, h) => a + Object.values(h.equip).filter(Boolean).length, 0);
      case "levelup": return st.hunters.reduce((a, h) => a + h.level, 0);
      case "kingdom": return st.kingdom.level;
      case "awaken": return st.awakenings;
      case "mat": return Object.keys(st.codex.mats).reduce((a, k) => a + (st.codex.mats[k] || 0), 0);
      case "gem": return st.inventory.items.filter(i => i.gems && i.gems.some(Boolean)).length;
      case "set": return st.hunters.reduce((a, h) => a + Object.values(MG.sys.hunters.setCounts(h)).filter(n => n >= 2).length, 0);
      case "item": {
        if (typeof req.target === "string" && req.target.startsWith("r")) return st.inventory.items.filter(i => i.rarity >= parseInt(req.target.slice(1))).length;
        return Object.keys(st.codex.items).length;
      }
      case "hunterlvl": return Math.max(0, ...st.hunters.map(h => h.level));
      case "codex": return Math.floor(codexPct() * 100);
      case "maxenhance": return st.inventory.items.filter(i => i.enhance >= 15).length;
    }
    return 0;
  }
  function bump(type, n) {
    const st = S();
    if (!n) return; // n=0 不推進任何進度
    // main quest auto-advance
    const mq = QD.MAIN[st.quests.mainIdx];
    if (mq && mq.req.type === type) st.quests.mainProg += n;
    // dailies
    for (const d of st.quests.daily.list) {
      const def = QD.DAILY_POOL.find(x => x.id === d.id);
      if (def && def.req.type === type && !d.done) d.prog += n;
    }
    checkMain();
  }
  function checkMain() {
    const st = S();
    const mq = QD.MAIN[st.quests.mainIdx];
    if (!mq) return;
    if (questCur(mq.req) >= mq.req.target) {
      st.quests.mainProg = 0;
      st.quests.mainIdx++;
      grantReward(mq.reward);
      MG.ui.dom.toast("主線任務完成：「" + mq.name + "」", "good", "icon_quest");
      MG.core.audio.SFX.quest();
    }
  }
  function claimDaily(id) {
    const st = S();
    const d = st.quests.daily.list.find(x => x.id === id);
    if (!d || d.done) return false;
    const def = QD.DAILY_POOL.find(x => x.id === id);
    if (!def || questCur(def.req) < def.req.target) return false;
    d.done = true;
    grantReward(def.reward);
    MG.core.audio.SFX.quest();
    return true;
  }
  function ensureDaily() {
    const st = S();
    const today = U.today();
    if (st.quests.daily.day !== today) {
      st.quests.daily.day = today;
      const pool = [...QD.DAILY_POOL];
      const picked = [];
      for (let i = 0; i < 5 && pool.length; i++) {
        const idx = U.rint(0, pool.length - 1);
        picked.push({ id: pool[idx].id, prog: 0, done: false });
        pool.splice(idx, 1);
      }
      st.quests.daily.list = picked;
    }
  }
  function claimAllDaily() {
    const st = S();
    let n = 0;
    for (const d of st.quests.daily.list) {
      if (d.done) continue;
      const def = QD.DAILY_POOL.find(x => x.id === d.id);
      if (def && questCur(def.req) >= def.req.target) {
        d.done = true;
        grantReward(def.reward);
        n++;
      }
    }
    if (n) MG.core.audio.SFX.quest();
    return n;
  }
  function achClaimable(a) { return questCur(a.req) >= a.req.target && !S().achievements[a.id]; }
  function claimAch(id) {
    const st = S();
    const a = QD.ACH.find(x => x.id === id);
    if (!a || st.achievements[id] || !achClaimable(a)) return false;
    st.achievements[id] = true;
    grantReward(a.reward);
    MG.core.audio.SFX.quest();
    return true;
  }
  function claimAllAch() {
    const st = S();
    let n = 0;
    for (const a of QD.ACH) {
      if (!st.achievements[a.id] && achClaimable(a)) {
        st.achievements[a.id] = true;
        grantReward(a.reward);
        n++;
      }
    }
    if (n) MG.core.audio.SFX.quest();
    return n;
  }
  function checkinDay() { return S().checkin.days.filter(Boolean).length; }
  function ensureCheckin() {
    const st = S();
    if (st.checkin.month !== U.month()) { st.checkin.month = U.month(); st.checkin.days = []; }
  }
  function claimCheckin() {
    const st = S();
    const day = checkinDay();
    if (day >= 30 || st.checkin.days[day]) return false;
    const def = QD.CHECKIN[day];
    st.checkin.days[day] = true;
    grantReward(def.r);
    MG.core.audio.SFX.quest();
    return true;
  }
  function grantReward(r) {
    const st = S();
    if (!r) return;
    if (r.gold) { MG.sys.game.addGold(r.gold, "獎勵"); }
    if (r.gems) st.currencies.gems += r.gems;
    if (r.honor) st.currencies.honor += r.honor;
    if (r.ticket) st.currencies.ticket = (st.currencies.ticket || 0) + r.ticket;
    if (r.pot) {
      const defId = "item_pot_" + r.pot;
      const st2 = S();
      const have = st2.inventory.items.find(i => i.defId === defId);
      if (have) have.qty = (have.qty || 1) + 1;
      else st2.inventory.items.push({ uid: MG.util.uid(), defId, tier: 1, qty: 1, gems: [], enhance: 0 });
    }
    if (r.boost) st.buffs.boostUntil = Date.now() + r.boost * 1000;
    if (r.hourglass) {
      const st2 = S();
      const have = st2.inventory.items.find(i => i.defId === "item_hourglass");
      if (have) have.qty = (have.qty || 1) + r.hourglass;
      else st2.inventory.items.push({ uid: MG.util.uid(), defId: "item_hourglass", tier: 1, qty: r.hourglass, gems: [], enhance: 0 });
    }
    if (r.goldbag) {
      const g = Math.floor(500 * Math.pow(1.6, st.kingdom.level));
      MG.sys.game.addGold(g, "金幣寶袋");
    }
  }
  function tick() {
    ensureDaily(); ensureCheckin();
    const st = S();
    if (!st.quests.shopOneTime) st.quests.shopOneTime = {}; // 防禦：舊存檔補上限購記錄
    // 防禦：里程碑旗標與區域解放紀錄補齊（舊存檔相容）
    if (!st.quests.regionShown) st.quests.regionShown = {};
    if (st.quests.firstKill === undefined) st.quests.firstKill = false;
    if (st.quests.firstEquip === undefined) st.quests.firstEquip = false;
    if (st.quests.firstBoss === undefined) st.quests.firstBoss = false;
    // 首次里程碑獎勵鏈（各觸發一次）
    if (!st.quests.firstKill && st.stats.kills > 0) {
      st.quests.firstKill = true;
      st.currencies.gems += 10;
      MG.ui.dom.toast("首次擊敗魔物！獎勵 10 鑽石", "good", "icon_gem");
      MG.core.audio.SFX.quest();
    }
    if (!st.quests.firstEquip && Object.keys(st.codex.items).length > 0) {
      st.quests.firstEquip = true;
      st.currencies.gems += 20;
      MG.ui.dom.toast("獲得第一件裝備！獎勵 20 鑽石", "good", "icon_chest");
      MG.core.audio.SFX.quest();
    }
    if (!st.quests.firstBoss && st.stats.bossKills > 0) {
      st.quests.firstBoss = true;
      st.currencies.gems += 50;
      MG.ui.dom.toast("首領討伐達成！獎勵 50 鑽石", "good", "icon_honor");
      MG.core.audio.SFX.quest();
    }
  }
  /* codex */
  function codexPct() {
    const st = S();
    const regions = MG.data.monsters.regions;
    const monsterTotal = regions.reduce((a, r) => a + r.monsters.length + 1, 0);
    const monstersSeen = Object.keys(st.codex.monsters).length;
    const itemTotal = 70; // 7 slots × 10 tiers
    const itemsSeen = Math.min(itemTotal, Object.keys(st.codex.items).length);
    const matTotal = 9;
    const matsSeen = Math.min(matTotal, Object.keys(st.codex.mats).length);
    return (monstersSeen / monsterTotal + itemsSeen / itemTotal + matsSeen / matTotal) / 3;
  }
  function codexMonsterKills(mid) { return S().codex.monsters[mid] || 0; }
  function codexMilestoneClaimed(key) { return (S().stats.codexClaimed || []).includes(key); }
  function claimCodexMilestone(key) {
    const st = S();
    if (codexMilestoneClaimed(key)) return false;
    st.stats.codexClaimed.push(key);
    const parts = key.split(":");
    if (parts[0] === "m") {
      const mid = parts[1], kills = parseInt(parts[2]);
      const def = QD.CODEX_MONSTER_MILESTONES.find(x => x.kills === kills);
      if (def) grantReward(def.r);
    } else {
      const pct = parseInt(parts[1]);
      const def = QD.CODEX_TOTAL.find(x => x.pct === pct);
      if (def) grantReward(def.r);
    }
    MG.core.audio.SFX.quest();
    return true;
  }
  function codexDmg() {
    const pct = codexPct();
    let bonus = 0;
    for (const t of QD.CODEX_TOTAL) if (pct * 100 >= t.pct) bonus += 0.05;
    return 1 + bonus;
  }
  /* awakening */
  function canAwaken() {
    const st = S();
    const b = st.buildings;
    const highBuildings = ["castle", "training", "forge", "guild"].filter(id => (b[id] || 0) >= 10).length;
    // 條件：3 座建築 Lv10 + 抵達第 3 大關（灰燼洞穴）第 5 波
    // （關卡每區只有 1-10，舊的「第 35 關」永遠無法達成，已改）
    const caveStage = (st.stats.maxStageByRegion || {})[2] || 0;
    return caveStage >= 5 && highBuildings >= 3;
  }
  function awaken() {
    const st = S();
    if (!canAwaken()) return false;
    const honor = Math.floor((100 + 25 * st.awakenings) * MG.sys.buildings.effects().honorMul);
    st.currencies.honor += honor;
    st.awakenings++;
    // reset
    st.currencies.gold = 0;
    for (const k in st.mats) st.mats[k] = 0;
    st.hunters = [];
    st.formation = [null, null, null, null, null];
    st.buildings = { castle: 1, guild: 1, training: 0, forge: 0, gemworks: 0, alchemy: 0, library: 0, warehouse: 1, altar: 0, market: 0 };
    st.hunt.region = 0; st.hunt.stage = 1;
    st.kingdom = { level: 1, exp: 0 };
    st.inventory.items = [];
    MG.sys.battle.reset();
    MG.core.audio.SFX.awaken();
    MG.ui.dom.toast("覺醒完成！獲得 " + honor + " 榮譽，全體力量大幅提升！", "good", "icon_honor");
    MG.sys.meta.bump("awaken", 1);
    return true;
  }
  /* shop */
  function buyShop(id) {
    const st = S();
    const def = QD.SHOP.find(x => x.id === id);
    if (!def) return false;
    if (def.oneTime && st.quests.shopOneTime && st.quests.shopOneTime[id]) return false; // 限購一次
    const p = def.price;
    if (p.gems !== undefined) {
      if (st.currencies.gems < p.gems) return false;
      st.currencies.gems -= p.gems;
    } else if (p.gold !== undefined) {
      if (st.currencies.gold < p.gold) return false;
      st.currencies.gold -= p.gold;
    }
    if (def.oneTime) {
      if (!st.quests.shopOneTime) st.quests.shopOneTime = {};
      st.quests.shopOneTime[id] = true;
    }
    grantReward(def.get);
    MG.core.audio.SFX.buy();
    return true;
  }
  // 批量購買：依序購買 n 次，錢不夠自動停（回傳實際購買數）
  function buyShopN(id, n) {
    let done = 0;
    for (let i = 0; i < n; i++) {
      if (!buyShop(id)) break;
      done++;
    }
    return done;
  }
  function shopOwned(id) {
    const st = S();
    const def = QD.SHOP.find(x => x.id === id);
    if (!def || !def.oneTime) return false;
    return !!(st.quests.shopOneTime && st.quests.shopOneTime[id]);
  }
  function honorCost(type) {
    const l = S().honorLvls[type] || 0;
    if (l >= 5) return -1;
    return Math.floor(50 * Math.pow(2, l));
  }
  /* 技能研讀（圖書館）：消耗技能書永久提升技能威力，上限 10 級 */
  function studyCost() {
    const l = S().studyLvl || 0;
    if (l >= 10) return -1;
    return 15 * (l + 1);
  }
  function buyStudy() {
    const st = S();
    const c = studyCost();
    if (c < 0 || (st.currencies.book || 0) < c) return false;
    st.currencies.book -= c;
    st.studyLvl = (st.studyLvl || 0) + 1;
    MG.core.audio.SFX.buy();
    MG.sys.battle.reset();
    return true;
  }
  function buyHonor(type) {
    const st = S();
    const c = honorCost(type);
    if (c < 0 || st.currencies.honor < c) return false;
    st.currencies.honor -= c;
    st.honorLvls[type]++;
    MG.core.audio.SFX.buy();
    MG.sys.battle.reset();
    return true;
  }
  function honorBonus(type) {
    const l = S().honorLvls[type] || 0;
    return l * (type === "exp" ? 5 : 10);
  }
  return { questCur, bump, claimDaily, claimAllDaily, claimAch, claimAllAch, achClaimable,
    checkinDay, claimCheckin, ensureDaily, ensureCheckin, tick, grantReward,
    codexPct, codexMonsterKills, codexMilestoneClaimed, claimCodexMilestone, codexDmg,
    canAwaken, awaken, honorCost, buyHonor, honorBonus, buyShop, buyShopN, shopOwned, studyCost, buyStudy };
})();
