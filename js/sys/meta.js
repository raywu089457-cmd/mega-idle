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
      case "starup": return st.stats.starUps || 0;
      case "star6": return st.hunters.filter(h => (h.rarity || 1) >= 6).length;
      case "codex": return Math.floor(codexPct() * 100);
      case "maxenhance": return st.inventory.items.filter(i => i.enhance >= 15).length;
      // v189 每週登入任務：本週登入天數（noteLogin 計數、週一重置）
      case "login": {
        const ld = st.quests.loginDays;
        if (!ld || ld.week !== weekKey()) return 0;
        return ld.days || 0;
      }
    }
    return 0;
  }
  /* v189 登入計數：同日去重、跨週重置（meta.tick 每 500ms 呼叫，lastDay 短路成本可忽略） */
  function noteLogin() {
    const st = S();
    const wk = weekKey();
    const today = U.today();
    if (!st.quests.loginDays) st.quests.loginDays = { week: wk, days: 0, lastDay: "" };
    const ld = st.quests.loginDays;
    if (ld.week !== wk) { ld.week = wk; ld.days = 0; ld.lastDay = ""; }
    if (ld.lastDay === today) return;
    ld.lastDay = today;
    ld.days++;
    bump("login", 1); // v214FIX：週任 w8「本週登入 5 天」的進度橋接（v189 既有缺陷 — 從無 bump("login") → w8 恆 0/5 永不可領）
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
    // v151 每週任務
    for (const w of (st.quests.weekly && st.quests.weekly.list) || []) {
      const def = QD.WEEKLY_POOL.find(x => x.id === w.id);
      if (def && def.req.type === type && !w.done) w.prog += n;
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
  /* v239 任務金幣按王國等級縮放（防後期歸零）；
     v648：軟錨 1.18^min(kl-1,20) — 原 1.35 無封頂在 kl≥20 達數小時～百小時農場當量,日課變印鈔主收入;
     週任傳更軟 base(1.15);鑽石/券/榮譽/目標零變動 */
  function scaleQuestGold(r, base) {
    const st = S();
    if (!r || !r.gold) return r;
    const klDelta = Math.min(20, Math.max(0, (st.kingdom.level || 1) - 1));
    const mul = Math.pow(base || 1.18, klDelta);
    return Object.assign({}, r, { gold: Math.floor(r.gold * mul) });
  }
  function claimDaily(id) {
    const st = S();
    const d = st.quests.daily.list.find(x => x.id === id);
    if (!d || d.done) return false;
    const def = QD.DAILY_POOL.find(x => x.id === id);
    if (!def) return false;
    // v214FIX：每日任務以「日進度 d.prog」判定（原用 questCur 終身統計 — 第 2 天起零活動白拿 60-70 鑽/日）
    if ((d.prog || 0) < def.req.target) return false;
    d.done = true;
    grantReward(scaleQuestGold(def.reward)); // v239：日任務金幣隨王國等級（v204 簽到同 1.35 錨）
    MG.core.audio.SFX.quest();
    return true;
  }
  function ensureDaily() {
    const st = S();
    const today = U.today();
    if (st.quests.daily.day !== today) {
      st.quests.daily.day = today;
      const pool = [...QD.DAILY_POOL];
      // v303：六職業全收集後「招募 2 名英雄」永不可達（無新英雄可抽）— 從每日池排除
      const allClasses = Object.keys(MG.config.CLASS_ELEMENT || {});
      const haveAll = allClasses.length > 0 && allClasses.every(c => st.hunters.some(h => h.cls === c));
      if (haveAll) {
        const i = pool.findIndex(x => x.id === "d5");
        if (i >= 0) pool.splice(i, 1);
      }
      const picked = [];
      for (let i = 0; i < 5 && pool.length; i++) {
        const idx = U.rint(0, pool.length - 1);
        picked.push({ id: pool[idx].id, prog: 0, done: false });
        pool.splice(idx, 1);
      }
      st.quests.daily.list = picked;
    }
  }
  /* v151 每週任務：週一重置（v205FIX：monday 分桶 — 原 SO 公式週日切換＋跨年多次切換，與 UI「週一重置」不一致） */
  function weekKey() {
    const d = new Date();
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return monday.getFullYear() + "-W" + Math.floor((monday - new Date(monday.getFullYear(), 0, 1)) / 864e5 / 7 + 1);
  } // v249FIX：刪除 pre-v205 死 return（引未宣告 wk — 第一 return 若被移除會 ReferenceError）
  function ensureWeekly() {
    const st = S();
    if (!st.quests.weekly) st.quests.weekly = { week: "", list: [] };
    const wk = weekKey();
    if (st.quests.weekly.week !== wk) {
      st.quests.weekly.week = wk;
      st.quests.weekly.list = QD.WEEKLY_POOL.map(def => ({ id: def.id, prog: 0, done: false }));
    } else {
      // v189：同週內新增的任務補插（保留既有進度與已領狀態，不重置本週）
      const existing = st.quests.weekly.list.map(x => x.id);
      for (const def of QD.WEEKLY_POOL) {
        if (!existing.includes(def.id)) st.quests.weekly.list.push({ id: def.id, prog: 0, done: false });
      }
    }
  }
  /* v214 任務動態縮放：gold 類週任目標 ×1.15^(kl-1)（與 v184 動態定價同基數）—
     後期產出膨脹後週任不白拿；每日/成就/其他週任維持固定（終身累計語義）
     v688：指數軟封頂 min(kl-1,18) — kl≤19 不變；防高 kl 目標牆 */
  function questTarget(def) {
    if (!def || def.req.type !== "gold" || !def.req.scale) return def ? def.req.target : 0;
    const exp = Math.min(Math.max(0, S().kingdom.level - 1), 18);
    return Math.floor(def.req.target * Math.pow(1.15, exp));
  }
  function claimWeekly(id) {
    const st = S();
    ensureWeekly();
    const w = st.quests.weekly.list.find(x => x.id === id);
    if (!w || w.done) return false;
    const def = QD.WEEKLY_POOL.find(x => x.id === id);
    if (!def || (w.prog || 0) < questTarget(def)) return false; // 每週獨立計數（非生涯統計）v214：動態目標
    w.done = true;
    grantReward(scaleQuestGold(def.reward, 1.15)); // v239/v648：週任金幣更軟縮放(1.15)
    MG.core.audio.SFX.quest();
    return true;
  }
  function claimAllWeekly() {
    const st = S();
    let n = 0;
    for (const w of st.quests.weekly.list) {
      if (w.done) continue;
      const def = QD.WEEKLY_POOL.find(x => x.id === w.id);
      if (def && (w.prog || 0) >= questTarget(def)) { // v214：動態目標
        w.done = true;
        grantReward(scaleQuestGold(def.reward, 1.15)); // v239/v648：週任軟縮放
        n++;
      }
    }
    if (n) MG.core.audio.SFX.quest();
    return n;
  }
  function claimAllDaily() {
    const st = S();
    let n = 0;
    for (const d of st.quests.daily.list) {
      if (d.done) continue;
      const def = QD.DAILY_POOL.find(x => x.id === d.id);
      // v214FIX：日進度判定（同 claimDaily）
      if (def && (d.prog || 0) >= def.req.target) {
        d.done = true;
        grantReward(scaleQuestGold(def.reward)); // v239
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
  function claimCheckin(silent) { // v253FIX：silent 參數（聚合迴圈批量領取 — 單一音效慣例）
    const st = S();
    const day = checkinDay();
    if (day >= 30 || st.checkin.days[day]) return false;
    const def = QD.CHECKIN[day];
    st.checkin.days[day] = true;
    // v204/v648：簽到金幣走 scaleQuestGold 同軟錨（不再手寫 1.35 無封頂）
    const r = scaleQuestGold(Object.assign({}, def.r));
    grantReward(r);
    if (!silent) MG.core.audio.SFX.quest();
    return true;
  }
  function grantReward(r) {
    const st = S();
    if (!r) return;
    if (r.gold) { MG.sys.game.addGold(r.gold, "獎勵"); }
    if (r.gems) st.currencies.gems += r.gems;
    if (r.honor) st.currencies.honor += r.honor;
    if (r.ticket) st.currencies.ticket = (st.currencies.ticket || 0) + r.ticket;
    if (r.renameTicket) st.currencies.renameTicket = (st.currencies.renameTicket || 0) + r.renameTicket;
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
    if (r.art) { // v158 神器（入收藏，英雄詳情裝備）
      const st2 = S();
      st2.artifacts = st2.artifacts || { owned: {} };
      st2.artifacts.owned = st2.artifacts.owned || {};
      st2.artifacts.owned[r.art] = true;
    }
    if (r.book) { // v159 技能書（圖書館研讀用）
      S().currencies.book = (S().currencies.book || 0) + r.book;
    }
    if (r.goldbag) {
      // v244：1.6→1.35 錨對齊；v684：軟封頂 min(kl-1,18) — 與市場／遠征／榮譽同源
      const exp = Math.min(Math.max(0, st.kingdom.level - 1), 18);
      const g = Math.floor(5000 * Math.pow(1.35, exp));
      MG.sys.game.addGold(g, "金幣寶袋");
    }
  }
  function tick() {
    ensureDaily(); ensureCheckin(); ensureWeekly();
    noteLogin(); // v189：每日首次 tick 計一次登入（同日去重）
    // v209：深淵每週深度結算（週界自動結算 — 與競技場/每週任務同週一錨點；weekKey 字串比較成本可忽略）
    if (MG.sys.abyss && MG.sys.abyss.checkWeekly) {
      const wkR = MG.sys.abyss.checkWeekly();
      if (wkR) MG.ui.dom.toast("深淵週結算：上週新高 " + wkR.peak + " 層 → 鑽石 +" + wkR.gems + "・榮譽 +" + wkR.honor, "good", "icon_skull");
    }
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
      MG.ui.dom.toast("BOSS討伐達成！獎勵 50 鑽石", "good", "icon_honor");
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
  function claimCodexMilestone(key, silent) {
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
    if (!silent) MG.core.audio.SFX.quest(); // v203：批量領取 silent（迴圈後單一音效）
    return true;
  }
  function codexDmg() {
    const pct = codexPct();
    let bonus = 0;
    for (const t of QD.CODEX_TOTAL) if (pct * 100 >= t.pct) bonus += 0.05;
    return 1 + bonus;
  }
  /* v180 英雄圖鑑：職業收集里程碑（加成累加，遣散保留） */
  function heroCodexCount(cls) { return (S().codex.heroes || {})[cls] || 0; }
  function heroCodexAtkBonus(cls) {
    const n = heroCodexCount(cls);
    if (!n) return 0;
    let sum = 0;
    for (const ms of QD.HERO_CODEX_MILESTONES || []) if (n >= ms.n) sum += ms.atk;
    return sum;
  }
  function heroCodexClaimed(cls, n) { return codexMilestoneClaimed("hc:" + cls + ":" + n); }
  function claimHeroCodex(cls, n, silent) {
    const st = S();
    const key = "hc:" + cls + ":" + n;
    if (codexMilestoneClaimed(key)) return false;
    const ms = (QD.HERO_CODEX_MILESTONES || []).find(x => x.n === n);
    if (!ms) return false;
    if (heroCodexCount(cls) < ms.n) return false;
    st.stats.codexClaimed.push(key);
    if (ms.r) grantReward(ms.r);
    if (!silent) MG.core.audio.SFX.quest(); // v203：批量領取 silent
    return true;
  }
  /* v185 素材合成：任 T1×4 → 自選 T2×1；任 T2×4 → 自選 T3×1（手續費 100/500 金） */
  function synthValid(srcId, tgtId) {
    const ms = MG.config.MATS;
    if (!ms[srcId] || !ms[tgtId]) return false;
    return ms[tgtId].tier === ms[srcId].tier + 1;
  }
  function synthMax(srcId) {
    const ms = MG.config.MATS;
    if (!ms[srcId]) return 0;
    const cfg = MG.config.MAT_SYNTH;
    const have = S().mats[srcId] || 0;
    const fee = cfg.fee[ms[srcId].tier] || 0;
    let n = Math.floor(have / cfg.ratio);
    if (fee > 0) n = Math.min(n, Math.floor(S().currencies.gold / fee));
    return n;
  }
  function synthesizeMat(srcId, tgtId, n) {
    const st = S();
    if (!synthValid(srcId, tgtId)) return { ok: false, reason: "無法合成（需同階低階素材轉同階高階）" };
    n = Math.floor(n);
    if (!(n > 0)) return { ok: false, reason: "數量需大於 0" };
    const max = synthMax(srcId);
    if (n > max) return { ok: false, reason: "素材或金幣不足" };
    const cfg = MG.config.MAT_SYNTH;
    const fee = (cfg.fee[MG.config.MATS[srcId].tier] || 0) * n;
    st.mats[srcId] -= n * cfg.ratio;
    st.mats[tgtId] = (st.mats[tgtId] || 0) + n;
    st.currencies.gold -= fee;
    MG.core.audio.SFX.craft();
    return { ok: true, n, spent: fee };
  }
  /* v203 QoL：圖鑑里程碑可領數／全部領取（魔物＋總完成度＋英雄收集三類） */
  function codexClaimableCount() {
    const st = S();
    let n = 0;
    for (const mid in st.codex.monsters) {
      const kills = st.codex.monsters[mid];
      for (const ms of QD.CODEX_MONSTER_MILESTONES) {
        if (kills >= ms.kills && !codexMilestoneClaimed("m:" + mid + ":" + ms.kills)) n++;
      }
    }
    const pct = codexPct() * 100;
    for (const t of QD.CODEX_TOTAL) {
      if (pct >= t.pct && !codexMilestoneClaimed("t:" + t.pct)) n++;
    }
    if (QD.HERO_CODEX_MILESTONES) {
      for (const c of Object.keys(MG.data.hunters.classes)) {
        const count = heroCodexCount(c);
        for (const ms of QD.HERO_CODEX_MILESTONES) {
          if (count >= ms.n && !heroCodexClaimed(c, ms.n)) n++;
        }
      }
    }
    return n;
  }
  function claimAllCodex() {
    const st = S();
    let n = 0;
    for (const mid in st.codex.monsters) {
      const kills = st.codex.monsters[mid];
      for (const ms of QD.CODEX_MONSTER_MILESTONES) {
        if (kills >= ms.kills && claimCodexMilestone("m:" + mid + ":" + ms.kills, true)) n++;
      }
    }
    const pct = codexPct() * 100;
    for (const t of QD.CODEX_TOTAL) {
      if (pct >= t.pct && claimCodexMilestone("t:" + t.pct, true)) n++;
    }
    if (QD.HERO_CODEX_MILESTONES) {
      for (const c of Object.keys(MG.data.hunters.classes)) {
        const count = heroCodexCount(c);
        for (const ms of QD.HERO_CODEX_MILESTONES) {
          if (count >= ms.n && claimHeroCodex(c, ms.n, true)) n++;
        }
      }
    }
    if (n) MG.core.audio.SFX.quest(); // v203：批量領取單一音效（與 claimAllDaily/Weekly/Ach 慣例一致）
    return n;
  }
  /* awakening — v640 門檻上調：r2-s5(~3.9天) → r4-s5(目標 7-14 天) */
  const AWAKEN_REGION_IDX = 4; // 冰封高原（第 5 大關）
  const AWAKEN_STAGE = 5;
  function canAwaken() {
    const st = S();
    const b = st.buildings;
    const highBuildings = ["castle", "training", "forge", "guild"].filter(id => (b[id] || 0) >= 10).length;
    const regionStage = (st.stats.maxStageByRegion || {})[AWAKEN_REGION_IDX] || 0;
    return regionStage >= AWAKEN_STAGE && highBuildings >= 3;
  }
  /** 昇華進度需求（供 more.js 昇華條件面板，消滅 hardcode 雙寫） */
  function awakenRequirements() {
    const st = S();
    const regions = (MG.data && MG.data.monsters && MG.data.monsters.regions) || [];
    const r = regions[AWAKEN_REGION_IDX];
    const curStage = (st.stats.maxStageByRegion || {})[AWAKEN_REGION_IDX] || 0;
    return { regionIdx: AWAKEN_REGION_IDX, stage: AWAKEN_STAGE, regionName: r ? r.name : "冰封高原", curStage, met: curStage >= AWAKEN_STAGE };
  }
  function awaken() {
    const st = S();
    if (!canAwaken()) return false;
    // v224：榮譽封頂（原 (100+25N) 無限成長 — 昇華成榮譽印鈔機稀釋商店價值）
    const honor = Math.floor((100 + 25 * Math.min(st.awakenings, 10)) * MG.sys.buildings.effects().honorMul);
    st.currencies.honor += honor;
    st.awakenings++;
    // reset
    st.currencies.gold = 0;
    for (const k in st.mats) st.mats[k] = 0;
    st.hunters = [];
    st.formation = [null, null, null, null, null];
    if (st.formations) for (let i = 0; i < 5; i++) st.formations[i] = [null, null, null, null, null];
    st.buildings = { castle: 1, guild: 1, training: 0, forge: 0, gemworks: 0, alchemy: 0, library: 0, warehouse: 1, altar: 0, market: 0 };
    st.hunt.region = 0; st.hunt.stage = 1;
    st.hunt.aaPark = null; // v572：覺醒 = 全新開局 — 清除引擎退守牆點（舊牆點語義失效）
    delete st.hunt.aaParkT;
    st.kingdom = { level: 1, exp: 0 };
    st.inventory.items = [];
    MG.sys.battle.reset();
    MG.core.audio.SFX.awaken();
    MG.ui.dom.toast("昇華完成！獲得 " + honor + " 榮譽，全體力量大幅提升！", "good", "icon_honor");
    MG.sys.meta.bump("awaken", 1);
    return honor; // v197：回傳榮譽數（truthy 相容舊呼叫點；UI 儀式演出顯示用）
  }
  /* v169 昇華傳統：每輪昇華自選一項永久疊加傳統（上限 10 級，跨昇華保留） */
  const TRADITIONS = {
    hunt:     { name: "狩獵傳統", desc: "金幣與經驗掉落 +5%/級", icon: "icon_sword" },
    forge:    { name: "鍛造傳統", desc: "強化與製作金幣成本 -4%/級", icon: "icon_hammer" },
    commerce: { name: "商會傳統", desc: "市場與每日特惠價格 -4%/級", icon: "icon_goldbag" },
    scholar:  { name: "學術傳統", desc: "技能威力 +3%/級", icon: "icon_book" },
    pioneer:  { name: "開拓傳統", desc: "王國經驗 +10%/級", icon: "icon_castle" }
  };
  function traditionLevel(type) { return S().traditions[type] || 0; }
  function traditionEffects() {
    const t = S().traditions || {};
    return {
      hunt: 0.05 * (t.hunt || 0),
      forge: 0.04 * (t.forge || 0),
      commerce: 0.04 * (t.commerce || 0),
      scholar: 0.03 * (t.scholar || 0),
      pioneer: 0.1 * (t.pioneer || 0)
    };
  }
  function pickTradition(type) {
    const st = S();
    if (!TRADITIONS[type]) return false;
    if ((st.traditions[type] || 0) >= 10) return false;
    st.traditions[type] = (st.traditions[type] || 0) + 1;
    MG.core.audio.SFX.quest();
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
  /* v229 素材兌金幣：T3 素材（虛空/神話）長期消耗端 — 週限 10 次防印鈔（價隨王國等級 1.35 指數縮放，
  與秘境/簽到同基數；honor shop 週重置模式同軌） */
  /* v239 素材兌換週限隨深淵深度縮放：400 層以下 10 次（既有玩家零變更）、每 100 層 +1、1400+ 封頂 20 —
     供給端（深淵 T3 掉落隨深度線性成長）與消耗端上限脫鉤修復；金幣走 addGold 防印鈔（兌換 < 週產 5%） */
  function matsExCap() {
    const st = S();
    const best = (st.abyss && st.abyss.best) || 0;
    return Math.min(30, 12 + Math.floor(Math.max(0, best - 300) / 100)); // v264 深化：best 700:16/1500:24/4300+:30（T3 死貨幣 45%→<15%；best=0 安全回退 12）
  }
  function exchangeMats(type, silent) {
    const st = S();
    const cost = type === "void" ? 50 : type === "myth" ? 100 : 0;
    if (!cost) return { ok: false, reason: "可兌換素材：虛空碎片（50）／神話殘片（100）" };
    const wk = weekKey();
    if (!st.matsEx) st.matsEx = { week: "", n: 0 };
    if (st.matsEx.week !== wk) { st.matsEx.week = wk; st.matsEx.n = 0; }
    if (st.matsEx.n >= matsExCap()) return { ok: false, reason: "本週兌換次數已用完（" + matsExCap() + " 次，週一重置）" };
    if ((st.mats[type] || 0) < cost) return { ok: false, reason: (MG.config.MATS[type] || {}).name + "不足（需 " + cost + "）" };
    st.mats[type] -= cost;
    const gold = Math.floor(500 * Math.pow(1.35, kingdomFeeExp()));
    // v229FIX：走 addGold（同榮譽商店寶袋 v205FIX — goldEarned/金幣成就/週任 w7 計入）
    MG.sys.game.addGold(gold, "素材兌換");
    st.matsEx.n++;
    if (!silent) { // v238：批量兌換跳過逐次 toast/SFX（v218 WebAudio 教訓）
      MG.core.audio.SFX.quest();
      MG.ui.dom.toast("兌換 +" + MG.util.fmt(gold) + " 金幣（" + st.matsEx.n + "/" + matsExCap() + "）", "good", "icon_goldbag"); // v239FIX：動態上限
    }
    return { ok: true, gold, n: st.matsEx.n };
  }
  function honorCost(type) {
    const l = S().honorLvls[type] || 0;
    if (l >= 5) return -1;
    // v668：×1.12^min(awakenings,8) — 0 覺醒不變；多周目榮譽仍有購買節奏
    // v724：覺醒縮放加深軟封頂 min(aw,4) — aw≤4 不變；防超多周目榮譽牆
    // v740：加深軟封頂 min(aw,3) — aw≤3 不變；防超多周目榮譽牆
    // v756：加深軟封頂 min(aw,2) — aw≤2 不變；防超多周目榮譽牆
    // v764：加深軟封頂 min(aw,1) — aw≤1 不變；防超多周目榮譽牆
    // v792：加深軟封頂 min(aw,0) — aw≤0 不變；覺醒縮放平坦
    const aw = Math.min(0, S().awakenings || 0);
    return Math.floor(50 * Math.pow(2, l) * Math.pow(1.12, aw));
  }
  /* 技能研讀（圖書館）：消耗技能書永久提升技能威力，上限 10 級
     v656：study≥5 附加 ×1.4^(l-4) — 0-4 級成本不變（新手節奏）；後期拉長多日水槽
     v708：加深指數軟封頂 min(l-4,4) — l≤8 不變；防 9–10 級牆
     v728：加深軟封頂 min(l-4,3) — l≤7 不變；防 8–10 級牆
     v736：加深軟封頂 min(l-4,2) — l≤6 不變；防 7–10 級牆
     v744：加深軟封頂 min(l-4,1) — l≤5 不變；防 6–10 級牆 */
  function studyCost() {
    const l = S().studyLvl || 0;
    if (l >= 10) return -1;
    const base = 15 * (l + 1);
    if (l < 5) return base;
    return Math.floor(base * Math.pow(1.4, Math.min(l - 4, 1)));
  }
  /* v249 古書回收：50 技能書 → 自選 T3 素材 ×1（週限 5 — 書產出永續/消耗有限 → 死貨幣疏通；
     手續費與素材兌換同錨 5000×1.35^(kl-1) — 金幣一併吸收；T3 佔週供給 <10% 不搶瓶頸） */
  function bookExCap() { return 5; }
  /* v668：王國級指數軟封頂 min(kl-1,18) — 回收費／素材兌換同源，防高 kl 牆與通膨 */
  function kingdomFeeExp() {
    return Math.min(18, Math.max(0, (S().kingdom.level || 1) - 1));
  }
  function recycleFee() { // v249FIX：手續費單一來源（UI 顯示與實扣同源 — 經濟錨重調不再雙源漂移）
    return Math.floor(5000 * Math.pow(1.35, kingdomFeeExp()));
  }
  function recycleBooks(type, silent) {
    const st = S();
    if (type !== "void" && type !== "myth") return { ok: false, reason: "可回收：虛空碎片／神話殘片" };
    const wk = weekKey();
    if (!st.bookEx) st.bookEx = { week: "", n: 0 };
    if (st.bookEx.week !== wk) { st.bookEx.week = wk; st.bookEx.n = 0; }
    if (st.bookEx.n >= bookExCap()) return { ok: false, reason: "本週回收次數已用完（" + bookExCap() + " 次，週一重置）" };
    if ((st.currencies.book || 0) < 50) return { ok: false, reason: "技能書不足（需 50 本，持有 " + (st.currencies.book || 0) + "）" };
    const fee = recycleFee();
    if (st.currencies.gold < fee) return { ok: false, reason: "金幣不足（手續費 " + U.fmt(fee) + "）" };
    st.currencies.book -= 50;
    st.currencies.gold -= fee; // 手續費為消耗（非產出 — 不走 addGold）
    st.mats[type] = (st.mats[type] || 0) + 1;
    st.bookEx.n++;
    if (!silent) {
      MG.core.audio.SFX.quest();
      MG.ui.dom.toast("回收 +1 " + (MG.config.MATS[type] || {}).name + "（" + st.bookEx.n + "/" + bookExCap() + "）", "good", "icon_book");
    }
    return { ok: true, type, n: st.bookEx.n };
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
  return { questCur, questTarget, bump, claimDaily, claimAllDaily, claimAch, claimAllAch, achClaimable,
    checkinDay, claimCheckin, ensureDaily, ensureCheckin, tick, grantReward,
    ensureWeekly, claimWeekly, claimAllWeekly, weekKey, noteLogin,
    codexPct, codexMonsterKills, codexMilestoneClaimed, claimCodexMilestone, codexDmg,
    heroCodexCount, heroCodexAtkBonus, heroCodexClaimed, claimHeroCodex,
    codexClaimableCount, claimAllCodex,
    synthValid, synthMax, synthesizeMat,
    canAwaken, awakenRequirements, awaken, honorCost, buyHonor, honorBonus, buyShop, buyShopN, shopOwned, studyCost, buyStudy, recycleBooks, bookExCap, recycleFee, // v249 古書回收
    exchangeMats, matsExCap, scaleQuestGold,
    TRADITIONS, traditionLevel, traditionEffects, pickTradition };
})();
