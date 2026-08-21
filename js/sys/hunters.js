/* 放置王國 MEGA IDLE — hunter logic: create, stats, exp, promote, train, recruit (slice B1 owns) */
"use strict";
MG.sys = MG.sys || {};
MG.sys.hunters = (function () {
  const D = MG.data.hunters;
  const U = MG.util;
  const S = () => MG.game.state;

  function create(cls, rarity, countCodex) {
    const h = {
      id: U.uid(), name: MG.data.names.gen(), cls, rarity: rarity || 1,
      bornRarity: rarity || 1, // v147 升星：出生稀有度（升星後保留身份標記）
      level: 1, exp: 0, skills: {}, promoted: 0, equip: {}
    };
    h.hp = Math.round(baseStats(h).hp); // 持續性生命：滿血誕生
    h.mp = Math.round(baseStats(h).mp); // 魔力：滿魔誕生（技能資源）
    // v180 英雄圖鑑：累計獲得記錄（遣散保留 — 收集的是「擁有過」）
    // v210FIX：重複傳說轉碎片不進名冊 — 也不計入「擁有過」（countCodex=false）
    if (countCodex !== false) {
      try {
        const st = S();
        st.codex = st.codex || {};
        st.codex.heroes = st.codex.heroes || {};
        st.codex.heroes[h.cls] = (st.codex.heroes[h.cls] || 0) + 1;
      } catch (e) { /* 啟動前階段（state 未就緒）不記錄 */ }
    }
    return h;
  }
  function clsOf(h) { return D.classes[h.cls]; }
  /* v195 神器精煉：等級（1-10）與效果倍率（加法：1 + 0.08×(lv-1)，10 級 = ×1.72 — 與羈絆加法設計一致） */
  function artifactLevel(aid) {
    const st = S();
    if (!st.artifacts) st.artifacts = { owned: {}, levels: {} };
    if (!st.artifacts.levels) st.artifacts.levels = {};
    return st.artifacts.levels[aid] || 1;
  }
  function artifactMul(aid) { return 1 + 0.08 * (artifactLevel(aid) - 1) + 0.12 * awakeLevel(aid); } // v245：覺醒 +0.12/階（Lv10＋III 階 = ×2.08）
  /* v245 神器覺醒：Lv10 精煉滿後的 3 階終局階梯（成本金幣＋T3 素材；覺醒順序＝資源分配決策） */
  function awakeLevel(aid) {
    const st = S();
    if (!st.artifacts) st.artifacts = { owned: {}, levels: {} };
    if (!st.artifacts.awake || typeof st.artifacts.awake !== "object") st.artifacts.awake = {};
    return st.artifacts.awake[aid] || 0;
  }
  function artifactAwakenCost(aid) {
    const st = S();
    const lv = artifactLevel(aid);
    const aw = awakeLevel(aid);
    if (lv < 10) return null;
    if (aw >= 3) return null;
    // v696：aw≥1 金幣 ×1.2^aw — 首覺（aw=0）不變；二／三覺加深
    let gold = 500000 * Math.pow(3, aw);
    if (aw >= 1) gold *= Math.pow(1.2, aw);
    const cost = { gold: Math.floor(gold), mats: { void: 8 + 8 * aw, myth: 2 + 2 * aw } };
    const matsOk = Object.entries(cost.mats).every(([m, n]) => (st.mats[m] || 0) >= n);
    return { aid, aw, next: aw + 1, gold: cost.gold, mats: cost.mats, can: st.currencies.gold >= cost.gold && matsOk };
  }
  function awakenArtifact(aid) {
    const st = S();
    const ac = artifactAwakenCost(aid);
    if (!ac) return { ok: false, reason: "無法覺醒（需 Lv10 精煉且未滿 III 階）" };
    if (!ac.can) return { ok: false, reason: "覺醒資源不足（金幣或虛空/神話殘片）" };
    st.currencies.gold -= ac.gold;
    for (const m in ac.mats) st.mats[m] -= ac.mats[m];
    st.artifacts.awake[aid] = ac.next;
    MG.core.audio.SFX.enhance();
    return { ok: true, aw: ac.next };
  }
  function artifactRefineCost(aid) {
    const st = S();
    const lv = artifactLevel(aid);
    if (lv >= 10) return null;
    // v688：lv≥5 金幣 ×1.2^(lv-4) — 0–4 階精煉不變；高階精煉金幣水槽
    // v712：加深指數軟封頂 min(lv-4,4) — lv≤8 不變；防 9–10 階牆
    let gold = 400 * Math.pow(lv, 1.6);
    if (lv >= 5) gold *= Math.pow(1.2, Math.min(lv - 4, 4));
    const cost = {
      gold: Math.floor(gold),
      mats: { crystal: lv, ember: Math.floor(lv / 2), void: Math.floor(lv / 3), myth: Math.floor(lv / 4) }
    };
    const matsOk = Object.entries(cost.mats).every(([m, n]) => n <= 0 || (st.mats[m] || 0) >= n);
    return { lv, next: lv + 1, gold: cost.gold, mats: cost.mats, can: st.currencies.gold >= cost.gold && matsOk };
  }
  function refineArtifact(aid) {
    const st = S();
    const rc = artifactRefineCost(aid);
    if (!rc) return { ok: false, reason: "已達最高等級（Lv10）" };
    if (!rc.can) return { ok: false, reason: "精煉資源不足（金幣或素材）" };
    st.currencies.gold -= rc.gold;
    for (const m in rc.mats) if (rc.mats[m] > 0) st.mats[m] -= rc.mats[m];
    st.artifacts.levels[aid] = rc.next;
    MG.core.audio.SFX.enhance();
    return { ok: true, lv: rc.next, spent: rc.gold };
  }
  /* v253 神器精煉到滿：逐級影子模擬（artifactRefineCost 同公式 — 本地 lv 遞增計價，v243 P1 教訓：恆當前級計價會失真）
     回傳 {start, done, gold, mats, next} — 資源不足/Lv10 自動停 */
  function refinePreview(aid) {
    const st = S();
    const start = MG.sys.hunters.artifactLevel(aid);
    let lv = start, gold = 0, mats = {}, done = 0;
    let budgetGold = st.currencies.gold, budgetMats = Object.assign({}, st.mats); // v253FIX：從預算累計扣除（單步費用隨 lv 遞增 — 原只看單步餘額會高估級數/總耗）
    while (lv < 10) {
      // v696FIX／v712：與 artifactRefineCost 同源（含 deepen 軟封）— 預覽不再低估／高估
      let stepGold = 400 * Math.pow(lv, 1.6);
      if (lv >= 5) stepGold *= Math.pow(1.2, Math.min(lv - 4, 4));
      const rc = { gold: Math.floor(stepGold), mats: { crystal: lv, ember: Math.floor(lv / 2), void: Math.floor(lv / 3), myth: Math.floor(lv / 4) } };
      const matsOk = Object.entries(rc.mats).every(([m, n]) => n <= 0 || (budgetMats[m] || 0) >= n);
      if (budgetGold < rc.gold || !matsOk) break;
      budgetGold -= rc.gold;
      for (const m in rc.mats) { budgetMats[m] = (budgetMats[m] || 0) - rc.mats[m]; mats[m] = (mats[m] || 0) + rc.mats[m]; }
      gold += rc.gold;
      done++; lv++;
    }
    return { start, done, gold, mats, next: lv };
  }
  function refineToMax(aid) {
    const p = refinePreview(aid);
    if (!p.done) return { ok: false, reason: "資源不足或已滿級" };
    let steps = 0, spent = 0, lv = MG.sys.hunters.artifactLevel(aid);
    while (lv < 10) {
      const r = refineArtifact(aid);
      if (!r.ok) break;
      spent += r.spent; steps++; lv = r.lv;
    }
    return { ok: true, steps, spent, lv };
  }
  function baseStats(h) {
    const c = clsOf(h), r = MG.config.RARITY[h.rarity - 1];
    const p = Math.pow(1 + D.promoStats, h.promoted || 0);
    const lv = combatLevel(h) - 1; // v254 共鳴祭壇：槽內英雄等級同步（個人投資保留 — 訓練/技能解鎖/突破仍看真實等級）
    return {
      atk: (c.base.atk + c.grow.atk * lv) * r.grow * p,
      def: (c.base.def + c.grow.def * lv) * r.grow * p,
      hp: (c.base.hp + c.grow.hp * lv) * r.grow * p,
      mp: (c.base.mp + c.grow.mp * lv) * r.grow * p,
      spd: c.base.spd + c.grow.spd * lv,
      crit: U.clamp(c.base.crit + c.grow.crit * lv, 0, 0.8)
    };
  }
  /* v254 共鳴祭壇（AFK 共鳴水晶 — 等級斷層修復）：5 槽選英雄，基準 = 槽內最低等級；
     槽內英雄實戰等級 = max(自身, 基準)，封頂 200；槽未滿 5 人 → 基準 1（無效果） */
  /* v254 共鳴祭壇（AFK 共鳴水晶 — 等級斷層修復）：基準 = 全名冊第 5 高等級（頂端 5 人決定，自動）；
     共鳴槽 ≤5 名 = 玩家選的受益者（槽內且低於基準者拉到基準，封頂 200）— 「誰受益」是玩家決策 */
  function resonanceEnsure() {
    const st = S();
    if (!st) return { slots: [] }; // v254FIX：newState 初始英雄 create 在 state 就緒前呼叫 baseStats → 崩潰防護
    if (!st.resonance || !Array.isArray(st.resonance.slots)) st.resonance = { slots: [] };
    return st.resonance;
  }
  /* v259 共鳴槽數隨王國等級成長（5→8：kl15=6、kl19=7、kl23=8 — 多隊需求 15-20 人覆蓋；基準語義不變） */
  function resonanceSlots() {
    const st = S();
    return Math.min(8, 5 + Math.ceil(Math.max(0, (st ? (st.kingdom.level || 1) : 1) - 14) / 4)); // v259FIX：ceil（kl15=6/19=7/23=8 — floor 晚 3 級）
  }
  function resonanceLevel() {
    const st = S();
    if (!st || !Array.isArray(st.hunters) || st.hunters.length < 5) return 1;
    const lvls = st.hunters.map(h => h.level || 1).sort((a, b) => b - a);
    return Math.min(200, Math.max(1, lvls[4])); // 第 5 高（v254FIX：原「槽內最低」使槽內英雄恆 ≥ 基準 → 共鳴零效果）
  }
  function combatLevel(h) {
    const st = S();
    const base = resonanceLevel();
    if (!st || base <= 1 || !Array.isArray(st.resonance && st.resonance.slots) || st.resonance.slots.indexOf(h.id) < 0) return h.level;
    return Math.min(200, Math.max(h.level, base));
  }
  function setResonanceSlot(idx, heroId) {
    const st = S();
    const rs = resonanceEnsure();
    if (idx < 0 || idx >= resonanceSlots()) return { ok: false, reason: "槽位無效" }; // v259 動態槽數
    const h = (st.hunters || []).find(x => x.id === heroId);
    if (!h) return { ok: false, reason: "英雄不存在" };
    if (MG.sys.expedition && MG.sys.expedition.isBusy(h)) return { ok: false, reason: "委託遠征中不可入共鳴槽" }; // v271
    if (rs.slots.indexOf(heroId) >= 0) return { ok: false, reason: "該英雄已在共鳴槽中" };
    rs.slots[idx] = heroId;
    MG.sys.battle.reset();
    return { ok: true };
  }
  function clearResonanceSlot(idx) {
    const st = S();
    const rs = resonanceEnsure();
    if (idx < 0 || idx >= resonanceSlots()) return { ok: false, reason: "槽位無效" }; // v259FIX：動態槽數（原硬編碼 5 → 第 6-8 槽無法移出）
    rs.slots[idx] = undefined;
    MG.sys.battle.reset();
    return { ok: true };
  }
  function resonanceInfo() {
    const st = S();
    const rs = resonanceEnsure();
    const lvl = resonanceLevel();
    return {
      slots: rs.slots.slice(0, resonanceSlots()).map(id => id ? (st.hunters || []).find(x => x.id === id) || null : null),
      base: lvl,
      active: lvl > 1
    };
  }
  /* v268 共鳴自動填槽建議：未入槽且 level < 基準的受益英雄，level 升序（受益差距最大優先）— 純計算供 UI 一鍵填槽 */
  function resonanceSuggest() {
    const st = S();
    const base = resonanceLevel();
    if (!st || base <= 1 || !Array.isArray(st.hunters)) return { ids: [], base: 1, slots: resonanceSlots() };
    const rs = resonanceEnsure();
    const inSlots = rs.slots || [];
    const ids = st.hunters
      .filter(h => inSlots.indexOf(h.id) < 0 && (h.level || 1) < base && !(MG.sys.expedition && MG.sys.expedition.isBusy(h))) // v271 遠征中不建議
      .sort((a, b) => (a.level || 1) - (b.level || 1))
      .map(h => h.id);
    return { ids, base, slots: resonanceSlots() };
  }
  function equippedItems(h) {
    const st = S();
    const out = [];
    for (const slot of MG.config.SLOTS) {
      const uid = h.equip[slot];
      if (uid) {
        const it = st.inventory.items.find(i => i.uid === uid);
        if (it) out.push(it);
      }
    }
    return out;
  }
  function setCounts(h) {
    const m = {};
    for (const it of equippedItems(h)) if (it.set) m[it.set] = (m[it.set] || 0) + 1;
    return m;
  }
  function effectiveStats(h) {
    const st = S();
    const b = baseStats(h);
    const out = { atk: b.atk, def: b.def, hp: b.hp, mp: b.mp, spd: b.spd, crit: b.crit, mit: 0 };
    // equipment
    for (const it of equippedItems(h)) {
      const s = MG.sys.equipment.itemStats(it);
      out.atk += s.atk; out.def += s.def; out.hp += s.hp; out.crit += s.crit;
    }
    // set bonuses
    const sets = MG.data.equipment.sets;
    const cnt = setCounts(h);
    for (const sid in cnt) {
      const set = sets[sid];
      if (!set) continue;
      if (cnt[sid] >= 2 && set.fx) applyFx(set.fx);
      if (cnt[sid] >= 4 && set.fx4) applyFx(set.fx4);
    }
    function applyFx(fx) {
      if (fx.atk) out.atk *= 1 + fx.atk;
      if (fx.def) out.def *= 1 + fx.def;
      if (fx.hp) out.hp *= 1 + fx.hp;
      if (fx.crit) out.crit += fx.crit;
      if (fx.spd) out.spd *= 1 + fx.spd;
      if (fx.all) { out.atk *= 1 + fx.all; out.def *= 1 + fx.all; out.hp *= 1 + fx.all; }
      if (fx.mit) out.mit = Math.min(0.5, out.mit + fx.mit);
    }
    // potion buff
    if (st.buffs.potAtk > Date.now()) out.atk *= 1.3 + 0.05 * MG.sys.buildings.effects().potionMul;
    // awakening + codex + honor（v224 昇華封頂：前 5 次各 +25%、之後各 +5%）
    const aw = 1 + 0.25 * Math.min(st.awakenings || 0, 5) + 0.05 * Math.max(0, (st.awakenings || 0) - 5);
    const cd = MG.sys.meta.codexDmg();
    const ho = 1 + 0.1 * (st.honorLvls.dmg || 0);
    out.atk *= aw * cd * ho;
    // v156 公會科技（全隊被動）
    if (MG.sys.guild) {
      const g = MG.sys.guild.effects();
      out.atk *= 1 + g.atk;
      out.def *= 1 + g.def;
      out.hp *= 1 + g.hp;
      out.crit += g.crit;
    }
    // v180 英雄圖鑑：職業收集里程碑永久加成（該職業全體）
    if (MG.sys.meta && MG.sys.meta.heroCodexAtkBonus) {
      const hc = MG.sys.meta.heroCodexAtkBonus(h.cls);
      if (hc) out.atk *= 1 + hc;
    }
    // v157 傳說英雄專屬被動 — v210 徽章倍率（lv0 = ×1 原值）
    const lp = h.legend ? (((D.LEGENDS || {})[h.legend] || {}).passive) : null;
    if (lp) {
      const bm = h.legend ? badgeMul(h.legend) : 1;
      if (lp.atk) out.atk *= 1 + lp.atk * bm;
      if (lp.def) out.def *= 1 + lp.def * bm;
      if (lp.hp) out.hp *= 1 + lp.hp * bm;
      if (lp.spd) out.spd *= 1 + lp.spd * bm;
      if (lp.crit) out.crit += lp.crit * bm;
    }
    // v158 神器被動（屬性類）— v195 精煉：效果隨神器等級成長（×artifactMul）
    if (h.art && MG.data.artifacts && MG.data.artifacts[h.art]) {
      const ap = MG.data.artifacts[h.art].passive;
      const am = artifactMul(h.art);
      if (ap.atk) out.atk *= 1 + ap.atk * am;
      if (ap.def) out.def *= 1 + ap.def * am;
      if (ap.hp) out.hp *= 1 + ap.hp * am;
      if (ap.spd) out.spd *= 1 + ap.spd * am;
      if (ap.crit) out.crit += ap.crit * am;
    }
    // 全隊型被動（如索林·岩心）：任一傳說英雄在當前編隊即全隊生效
    if (MG.data && D.LEGENDS) {
      const teamIds = (st.formations && st.formations[st.activeTeam || 0]) || st.formation;
      for (const tl of st.hunters) {
        if (!tl.legend || !teamIds.includes(tl.id)) continue;
        const tp = (D.LEGENDS[tl.legend] || {}).passive;
        if (tp && tp.teamAtk) out.atk *= 1 + tp.teamAtk * badgeMul(tl.legend); // v210 徽章倍率
      }
    }
    // v170 傳說羈絆：同隊傳說組合觸發團隊加成（多重疊加）
    if (MG.sys.hunters && MG.sys.hunters.bondEffects) {
      const be = MG.sys.hunters.bondEffects();
      if (be.atk) out.atk *= 1 + be.atk;
      if (be.def) out.def *= 1 + be.def;
      if (be.hp) out.hp *= 1 + be.hp;
      if (be.spd) out.spd *= 1 + be.spd;
      if (be.crit) out.crit += be.crit;
    }
    // v215 套裝共鳴：全隊同套裝件數達標的全隊加成（effectiveStats 掛接 → power/競技場/世界首領自動繼承）
    if (MG.sys.hunters && MG.sys.hunters.resonanceStats) {
      const rs = MG.sys.hunters.resonanceStats();
      for (const sid in rs) {
        const fx = rs[sid].fx;
        if (fx.atk) out.atk *= 1 + fx.atk;
        if (fx.def) out.def *= 1 + fx.def;
        if (fx.hp) out.hp *= 1 + fx.hp;
        if (fx.spd) out.spd *= 1 + fx.spd;
        if (fx.crit) out.crit += fx.crit;
        if (fx.mit) out.mit = Math.min(0.5, out.mit + fx.mit); // v215FIX：與個人套裝路徑同 cap
        // v215FIX：全屬性語義與個人 fx.all 一致（atk/def/hp — 不含 spd）
        if (fx.all) { out.atk *= 1 + fx.all; out.def *= 1 + fx.all; out.hp *= 1 + fx.all; }
      }
    }
    // vXXX 開發者：英雄數值拉桿（最後掛 — 戰鬥/戰力/競技場全部自動繼承）
    if (MG.sys.dev) {
      const db = MG.sys.dev.balance();
      out.atk *= db.heroAtk;
      out.def *= db.heroDef;
      out.hp *= db.heroHp;
    }
    return out;
  }
  function power(h) {
    const s = effectiveStats(h);
    return Math.floor(s.atk * 3 + s.def * 2 + s.hp / 10 + s.crit * 100);
  }
  function expNeed(h) { return D.expNeed(h.level); }
  function gainExp(h, amt, silent) {
    const st = S();
    const ev = [];
    let need = expNeed(h);
    h.exp += Math.floor(amt);
    while (h.exp >= need && h.level < 200) {
      h.exp -= need; h.level++;
      // 升級自動補滿生命與魔力（升級的慶祝性回饋）
      h.hp = Math.round(effectiveStats(h).hp);
      h.mp = Math.round(effectiveStats(h).mp);
      MG.sys.game.addKingdomExp(10 + h.level); // 王國經驗：英雄等級越高升級貢獻越多（即時結算升級）
      ev.push({ type: "levelup", hunter: h.id, level: h.level });
      need = expNeed(h);
    }
    if (h.level >= 200) h.exp = 0;
    if (ev.length && MG.sys.meta && MG.sys.meta.bump) MG.sys.meta.bump("levelup", ev.length); // v214：每日 d7 計數（原缺失 — 永不推進）
    if (!silent) for (const e of ev) MG.ui.dom.toast("「" + h.name + "」升至 " + h.level + "級！", "good", "fx_heal");
    return ev;
  }
  function promoLevelNeed(h) {
    const n = (h.promoted || 0) + 1;
    return D.promoLevels[n - 1] || 999;
  }
  function canPromote(h) {
    if (h.level < promoLevelNeed(h)) return false;
    const c = D.promoCost(h);
    const st = S();
    if (c.mats) for (const m in c.mats) if ((st.mats[m] || 0) < c.mats[m]) return false;
    return st.currencies.gold >= c.gold;
  }
  function promoPreview(h) {
    const next = Object.assign({}, h, { promoted: h.promoted + 1 });
    const b0 = baseStats(h), b1 = baseStats(next);
    return {
      cost: D.promoCost(h),
      can: canPromote(h),
      needLv: promoLevelNeed(h),
      atk: Math.floor(b1.atk - b0.atk),
      def: Math.floor(b1.def - b0.def),
      hp: Math.floor(b1.hp - b0.hp)
    };
  }
  function promote(h) {
    if (U.fightGuard(h)) return false;
    if (!canPromote(h)) return false;
    const c = D.promoCost(h);
    MG.sys.game.addGold(-c.gold, "突破");
    for (const m in c.mats) S().mats[m] -= c.mats[m];
    // 突破 +20% 全屬性：生命/魔力按比例成長
    const oldMax = effectiveStats(h).hp;
    h.promoted++;
    if (h.hp !== undefined && oldMax > 0) h.hp = h.hp * (effectiveStats(h).hp / oldMax);
    if (h.mp !== undefined) h.mp = h.mp * (effectiveStats(h).mp / oldMax);
    MG.core.audio.SFX.levelup();
    MG.ui.dom.toast("「" + h.name + "」突破至 " + (h.promoted + 1) + " 階！全屬性 +20%", "good", "fx_heal");
    MG.sys.meta.bump("promote", 1);
    return true;
  }
  function train(h, silent) { // v218：silent = 全隊批量（不刷單發 toast）
    if (U.fightGuard(h)) return false;
    const st = S();
    const cost = Math.max(1, Math.floor(D.trainCost(h.level) * (MG.sys.dev ? MG.sys.dev.balance().costMul : 1))); // vXXX 開發者：成本拉桿
    // v179 平衡：滿級訓練零收益卻照扣金幣（單次按鈕缺陷 — 批量已有守衛，單次補上）
    if (h.level >= 200) { if (!silent) MG.ui.dom.toast("「" + h.name + "」已達最高等級", "bad", "icon_train"); return false; }
    if (st.currencies.gold < cost) { if (!silent) MG.ui.dom.toast("金幣不足", "bad", "icon_coin"); return false; }
    st.currencies.gold -= cost;
    h.spentGold = (h.spentGold || 0) + cost; // v163 重塑返還基準：只返還實付訓練金幣
    const mul = 1 + (st.buildings.training || 0) * 0.1;
    const exp = Math.floor(D.trainExp(h.level) * mul * (MG.sys.dev ? MG.sys.dev.balance().trainExpMul : 1)); // vXXX 開發者：訓練經驗拉桿
    gainExp(h, exp, silent); // v218FIX：批量 silent 轉傳（升級 toast 不刷屏）
    if (!silent) MG.core.audio.SFX.buy(); // v218FIX：批量靜默（200-300 次訓練的 WebAudio 節點風暴）
    if (!silent) MG.ui.dom.toast("訓練完成！「" + h.name + "」獲得 " + MG.util.fmt(exp) + " 經驗", "good", "icon_train");
    return true;
  }
  function recruitCost(type) {
    const st = S();
    const def = D.recruit[type];
    if (type === "gold") {
      const n = st.stats.goldRecruits || 0;
      const mul = 1 - 0.02 * (st.buildings.guild || 0);
      const cMul = MG.sys.dev ? MG.sys.dev.balance().costMul : 1; // vXXX 開發者：成本拉桿
      return { gold: Math.floor(def.cost(n) * mul * cMul), ticket: 0, gem: 0 };
    }
    if (type === "ticket") return { gold: 0, ticket: 1, gem: 0 };
    return { gold: 0, ticket: 0, gem: def.cost(0) };
  }
  function doRecruit(type, silent) { // v168：silent = 批量招募（不刷 toast）
    const st = S();
    const def = D.recruit[type];
    const cost = recruitCost(type);
    if (type === "gold" && st.currencies.gold < cost.gold) return null;
    if (type === "ticket" && (st.currencies.ticket || 0) < 1) return null;
    if (type === "gem" && st.currencies.gems < cost.gem) return null;
    const cap = MG.sys.buildings.effects().rosterCap;
    if (st.hunters.length >= cap) { MG.ui.dom.toast("名冊已滿（" + cap + " 名）— 升級酒館可提升上限，或先遣散", "bad", "icon_coin"); return null; }
    if (type === "gold") { st.currencies.gold -= cost.gold; st.stats.goldRecruits = (st.stats.goldRecruits || 0) + 1; }
    if (type === "ticket") st.currencies.ticket--;
    if (type === "gem") st.currencies.gems -= cost.gem;
    // v148 保底（市場放置遊戲標準抽卡設計）：神話招募 20 抽內必得 ★6、高級招募 10 抽內必得 ★5
    // 自然出貨（★6/★5）即歸零重計；計數存 stats（昇華保留，跨週期累積）
    let pity = false;
    let rarity = weightedPick(def.rar, def.weight);
    if (type === "gem") {
      const p = (st.stats.gemPity || 0) + 1;
      if (rarity >= 6) st.stats.gemPity = 0;
      else if (p >= 20) { rarity = 6; st.stats.gemPity = 0; pity = true; }
      else st.stats.gemPity = p;
    } else if (type === "ticket") {
      const p = (st.stats.ticketPity || 0) + 1;
      if (rarity >= 5) st.stats.ticketPity = 0;
      else if (p >= 10) { rarity = 5; st.stats.ticketPity = 0; pity = true; }
      else st.stats.ticketPity = p;
    }
    let cls = pickClass();
    // v157 傳說英雄：神話招募出 ★6 時 25% 機率取代隨機職業（固定名字與被動）
    let legend = null;
    const LEGENDS = D.LEGENDS || {};
    if (type === "gem" && rarity >= 6 && U.chance(0.25) && Object.keys(LEGENDS).length) {
      legend = U.pick(Object.keys(LEGENDS));
      cls = LEGENDS[legend].cls;
    }
    const dup = legend && st.hunters.some(x => x.legend === legend); // v210FIX：重複判定提前 — 不灌圖鑑計數
    const h = create(cls, rarity, !dup);
    if (legend) {
      // v210：重複傳說 → 轉化 5 枚徽章碎片（不再進名冊 — 解決「重複傳說死路」；仍計入招募統計）
      if (dup) {
        h.legend = legend; // 保留身份（UI 卡片仍顯示傳說名＋轉化標記）
        h.name = LEGENDS[legend].name;
        st.legendShards = (st.legendShards || 0) + 5;
        st.stats.recruits++;
        MG.sys.meta.bump("recruit", 1);
        MG.core.audio.SFX.recruit();
        if (!silent) MG.ui.dom.toast("重複傳說「" + LEGENDS[legend].name + "」→ 轉化 5 枚徽章碎片！", "good", "icon_honor");
        return { h, pity, duplicate: true };
      }
      h.legend = legend;
      h.name = LEGENDS[legend].name;
    }
    st.hunters.push(h);
    st.stats.recruits++;
    MG.sys.meta.bump("recruit", 1);
    MG.core.audio.SFX.recruit();
    // v136：招募後不自動進隊伍（英雄待在名冊，由玩家編入）
    if (!silent) MG.ui.dom.toast("「" + h.name + "」已加入名冊！", "good", "icon_recruit");
    if (pity && !silent) MG.ui.dom.toast("保底觸發：" + (type === "gem" ? "★6 神話" : "★5 傳說") + "英雄降臨！", "good", "icon_recruit");
    return { h, pity };
    function weightedPick(vals, weights) {
      const tot = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * tot;
      for (let i = 0; i < vals.length; i++) { r -= weights[i]; if (r <= 0) return vals[i]; }
      return vals[vals.length - 1];
    }
  }
  function formation() { return S().formation.map(id => S().hunters.find(h => h.id === id)).filter(Boolean); }
  function formationIds() { return S().formation.filter(Boolean); }
  function inFormation(id) { return S().formation.includes(id); }
  // v130 五隊編制：所有編隊操作作用於 activeTeam 隊（st.formation 為其鏡像）
  function teamOf() {
    const st = S();
    if (Array.isArray(st.formations) && st.formations[st.activeTeam || 0]) return st.formations[st.activeTeam || 0];
    return st.formation;
  }
  function setActiveTeam(n) {
    const st = S();
    const max = teamsUnlocked();
    if (n < 0 || n >= max) return false;
    st.activeTeam = n;
    st.formation = teamOf().slice(); // 鏡像同步
    syncDispatchFromFormation(); // v139：切隊 → 派遣列表同步
    MG.sys.battle.reset();
    return true;
  }
  function teamsUnlocked() {
    const st = S();
    // 酒館等級決定隊數：Lv1=1 隊、Lv2=2、Lv4=3、Lv6=4、Lv8=5（依進度依序開放）
    return Math.min(5, 1 + Math.floor(((st.buildings && st.buildings.guild) || 1) / 2));
  }
  function teamInfo(n) {
    const st = S();
    const t = (st.formations && st.formations[n]) || [null, null, null, null, null];
    const members = t.filter(id => id && st.hunters.some(h => h.id === id));
    let powerSum = 0;
    for (const id of members) {
      const h = st.hunters.find(x => x.id === id);
      if (h) powerSum += power(h);
    }
    return { n, members: members.length, slots: t.length, power: powerSum, ids: t };
  }
  function setFormationSlot(idx, idOrNull) {
    if (U.fightGuard()) return false;
    const st = S();
    const slots = MG.sys.buildings.effects().formationSlots;
    if (idOrNull !== null && idx >= slots) return false;
    if (idOrNull !== null) {
      const hh = (st.hunters || []).find(x => x.id === idOrNull);
      if (hh && MG.sys.expedition && MG.sys.expedition.isBusy(hh)) { // v271：遠征中不可編隊
        MG.ui.dom.toast("「" + hh.name + "」委託遠征中 — 召回後再編隊", "bad", "icon_sword");
        return false;
      }
      // 換人：若英雄已在其他隊，先從該隊移除（同一英雄不能同時在兩隊）
      for (const t of (st.formations || [])) {
        for (let i = 0; i < t.length; i++) if (t[i] === idOrNull) t[i] = null;
      }
    }
    teamOf()[idx] = idOrNull;
    st.formation = teamOf().slice();
    syncDispatchFromFormation(); // v139：出戰隊變動 → 派遣列表即時同步
    MG.sys.battle.reset();
    MG.ui.dom.toast(idOrNull ? "已編入出戰隊伍" : "已移出出戰隊伍", "", "icon_sword");
    return true;
  }
  /* v139：出戰隊（activeTeam formation）變動時同步派遣列表——戰鬥中編輯即時生效；
     已召回（無戰鬥且 dispatchIds 空）時不自動出戰，保留下次手動派遣。 */
  function syncDispatchFromFormation() {
    const st = S();
    if (!st.hunt) return;
    const fighting = ((MG.sys.battle.get && MG.sys.battle.get()) || {}).phase === "fight" || (st.hunt.dispatchIds || []).length > 0;
    if (!fighting) return;
    st.hunt.dispatchIds = teamOf().filter(id => id && st.hunters.some(h => h.id === id && !(MG.sys.expedition && MG.sys.expedition.isBusy(h)))); // v271 遠征中不派遣
  }
  function autoFill() {
    if (U.fightGuard()) return;
    const st = S();
    const slots = MG.sys.buildings.effects().formationSlots;
    const team = teamOf();
    const ids = st.hunters.filter(h => !(MG.sys.expedition && MG.sys.expedition.isBusy(h))) // v271FIX：遠征中不自動編隊
      .sort((a, b) => power(b) - power(a)).map(h => h.id);
    for (let i = 0; i < slots; i++) team[i] = ids[i] || null;
    st.formation = team.slice();
    MG.sys.battle.reset();
    MG.ui.dom.toast("已自動編入戰力最強的英雄", "good", "icon_formation");
  }
  /* v248 批量遣散共用成本（dismiss 內亦用 — 多選彙總與實發同源零漂移）：
     v244 印鈔修復：封頂返還實付（resetRefund×1.1 微利緩衝）；v244FIX：v163 前舊檔無 spentGold — 以 ΣtrainCost 估算 */
  function dismissCost(h) {
    let spent = resetRefund(h).gold || 0;
    if (!spent && (h.level || 1) > 1) {
      for (let l = 1; l < (h.level || 1); l++) spent += D.trainCost(l);
    }
    // v700：1.4^min(level,50) — Lv≤50 不變；防高 Lv 遣散天花板膨脹（spent×1.1 仍為硬頂）
    const lvCap = Math.min(Math.max(1, h.level || 1), 50);
    const refund = Math.min(Math.floor(50 * Math.pow(1.4, lvCap) * h.rarity), Math.floor(spent * 1.1));
    const shards = (!h.legend) ? (SHARD_RATES[h.rarity] || 0) : 0;
    return { refund, shards };
  }
  function dismiss(h, silent) {
    if (U.fightGuard(h)) return;
    // v210 英雄鎖定：鎖定英雄不可遣散（防誤吃 — 先解鎖）
    if (h.locked) { if (!silent) MG.ui.dom.toast("「" + h.name + "」已鎖定 — 先解鎖再遣散", "bad", "icon_lock"); return; }
    if (MG.sys.expedition && MG.sys.expedition.isBusy(h)) { // v271 遠征中不可遣散
      if (!silent) MG.ui.dom.toast("「" + h.name + "」委託遠征中 — 召回後再遣散", "bad", "icon_sword");
      return;
    }
    const st = S();
    const { refund, shards } = dismissCost(h);
    for (const slot in h.equip) { const uid = h.equip[slot]; if (uid) { h.equip[slot] = null; MG.sys.equipment.returnToInventory(uid); } }
    st.hunters = st.hunters.filter(x => x.id !== h.id);
    if (st.resonance && Array.isArray(st.resonance.slots)) { // v254FIX：遣散槽內英雄清殘 id（否則基準永久失效+UI 死鎖）
      st.resonance.slots = st.resonance.slots.map(s => s === h.id ? undefined : s);
    }
    for (const t of (st.formations || [st.formation])) for (let i = 0; i < t.length; i++) if (t[i] === h.id) t[i] = null;
    st.formation = teamOf().slice();
    st.currencies.gold += refund;
    // v235 英雄碎片：非傳說遣散轉碎片（★3→1/★4→3/★5→8/★6→20 — 死資產變定向合成資源；金幣退款不變）
    let shardTxt = "";
    if (shards > 0) {
      st.heroShards = (st.heroShards || 0) + shards;
      shardTxt = "・碎片 +" + shards;
    }
    MG.sys.battle.reset();
    if (!silent) MG.ui.dom.toast("已遣散「" + h.name + "」，獲得 " + MG.util.fmt(refund) + " 金幣" + shardTxt, "", "icon_coin");
    return { name: h.name, refund, shards };
  }
  /* v235 英雄碎片合成：30 片 → 自選職業 ★4（週限 2 次）、60 片 → 自選職業 ★5（週限 1 次）
     走 create 同款路徑（計圖鑑/招募統計）；不可合成傳說；rosterCap 守衛 */
  const SHARD_RATES = { 3: 1, 4: 3, 5: 8, 6: 20 };
  const SYNTH_DEFS = {
    4: { shards: 30, weekly: 2 },
    5: { shards: 60, weekly: 1 }
  };
  function synthEnsure() {
    const st = S();
    if (!st.heroSynth) st.heroSynth = { week: "", n4: 0, n5: 0 };
    const wk = MG.sys.meta.weekKey();
    if (st.heroSynth.week !== wk) { st.heroSynth.week = wk; st.heroSynth.n4 = 0; st.heroSynth.n5 = 0; }
    return st.heroSynth;
  }
  function synthPreview() {
    const st = S();
    const s = synthEnsure();
    // v235FIX：名冊滿熄滅（v216 流浪紅點同模式 — 名冊滿時合成必敗）
    const hasRoom = st.hunters.length < MG.sys.buildings.effects().rosterCap;
    return {
      shards: st.heroShards || 0,
      n4: s.n4, n5: s.n5,
      can4: hasRoom && (st.heroShards || 0) >= SYNTH_DEFS[4].shards && s.n4 < SYNTH_DEFS[4].weekly,
      can5: hasRoom && (st.heroShards || 0) >= SYNTH_DEFS[5].shards && s.n5 < SYNTH_DEFS[5].weekly
    };
  }
  function synthHero(rarity, cls) {
    const st = S();
    const def = SYNTH_DEFS[rarity];
    if (!def) return { ok: false, reason: "稀有度無效" };
    const s = synthEnsure();
    const key = "n" + rarity;
    if ((st.heroShards || 0) < def.shards) return { ok: false, reason: "碎片不足（需 " + def.shards + "，持有 " + (st.heroShards || 0) + "）" };
    if (s[key] >= def.weekly) return { ok: false, reason: "本週合成次數已用完（週限 " + def.weekly + " 次）" };
    if (!D.classes[cls]) return { ok: false, reason: "職業無效" };
    const cap = MG.sys.buildings.effects().rosterCap;
    if (st.hunters.length >= cap) return { ok: false, reason: "名冊已滿（" + cap + "/" + cap + "）— 先遣散或擴充酒館" };
    st.heroShards -= def.shards;
    s[key]++;
    const h = create(cls, rarity);
    st.hunters.push(h);
    // v235FIX：計招募統計（d5/w4/主線/成就 — 與 doRecruit 對齊；註解宣稱「計圖鑑/招募統計」）
    st.stats.recruits = (st.stats.recruits || 0) + 1;
    if (MG.sys.meta && MG.sys.meta.bump) MG.sys.meta.bump("recruit", 1);
    MG.core.audio.SFX.quest();
    MG.ui.dom.toast("碎片合成：「" + h.name + "」（★" + rarity + " " + D.classes[cls].name + "）", "good", D.classes[cls].icon);
    return { ok: true, h };
  }
  /* v215 套裝共鳴：全隊穿戴同套裝件數達 4/8/12 → 全隊加成（分段累計；activeTeam 為單位 — 切隊即換共振對象）
     v215FIX：memo 快取（key = activeTeam＋編隊 id＋每人穿戴 uid — 換裝/切隊才失效）—
     effectiveStats 每幀高頻呼叫，全隊重算會造成 2-4Hz 輪詢熱點 */
  let rsMemo = { key: "", val: null };
  function resonanceStats() {
    const st = S();
    const teamIds = (st.formations && st.formations[st.activeTeam || 0]) || st.formation;
    const byId = {};
    for (const h of st.hunters) byId[h.id] = h;
    let key = (st.activeTeam || 0) + "|" + teamIds.join(",");
    for (const id of teamIds) {
      const h = byId[id];
      if (!h) continue;
      for (const s in (h.equip || {})) if (h.equip[s]) key += "|" + h.equip[s];
    }
    if (rsMemo.key === key) return rsMemo.val;
    const SETS = (MG.data.equipment && MG.data.equipment.SETS) || {};
    const members = teamIds.map(id => byId[id]).filter(Boolean);
    const counts = members.map(h => setCounts(h)); // 每成員一次（hoist — 不隨套裝迴圈重算）
    const out = {};
    for (const sid in SETS) {
      const def = SETS[sid];
      if (!def.res) continue;
      let pieces = 0;
      for (const c of counts) pieces += c[sid] || 0;
      if (pieces <= 0) continue;
      const acc = {};
      for (const need in def.res) {
        if (pieces >= Number(need)) {
          const fx = def.res[need];
          for (const k in fx) acc[k] = (acc[k] || 0) + fx[k];
        }
      }
      if (Object.keys(acc).length) out[sid] = { pieces, fx: acc };
    }
    rsMemo = { key, val: out };
    return out;
  }
  /* v221 UI/UX：升星材料候選清單（詳情頁「差N同職」的可見行動路徑 — 鎖定/出戰標記、同 starUpCost pool 規則；
     v221FIX：排序與 starUpCost pick 一致 — 非編隊優先、戰力低者先（實際消耗優先序）） */
  function starCandidates(h) {
    const st = S();
    const n = h.rarity || 1;
    const inF = (x) => st.formation.includes(x.id) || (st.formations || []).some(t => t.includes(x.id));
    return st.hunters
      .filter(x => x.id !== h.id && (x.rarity || 1) === n && x.cls === h.cls)
      .map(x => ({ id: x.id, name: x.name, level: x.level, power: power(x), locked: !!x.locked, inF: inF(x) }))
      .sort((a, b) => (a.inF ? 1 : 0) - (b.inF ? 1 : 0) || a.power - b.power);
  }
  function bondsState() {
    const st = S();
    const teamIds = (st.formations && st.formations[st.activeTeam || 0]) || st.formation;
    const legends = new Set(st.hunters.filter(x => teamIds.includes(x.id) && x.legend).map(x => x.legend));
    return (D.LEGEND_BONDS || []).map(b => ({
      id: b.id, name: b.name, flavor: b.flavor, members: b.members, fx: b.fx,
      active: b.members.every(m => legends.has(m)),
      have: b.members.filter(m => legends.has(m)).length
    }));
  }
  function bondEffects() {
    const eff = { atk: 0, def: 0, hp: 0, spd: 0, crit: 0, skillDmg: 0 };
    for (const b of bondsState()) {
      if (!b.active) continue;
      if (b.fx.atk) eff.atk += b.fx.atk;
      if (b.fx.def) eff.def += b.fx.def;
      if (b.fx.hp) eff.hp += b.fx.hp;
      if (b.fx.spd) eff.spd += b.fx.spd;
      if (b.fx.crit) eff.crit += b.fx.crit;
      if (b.fx.skillDmg) eff.skillDmg += b.fx.skillDmg;
    }
    return eff;
  }
  /* v163 英雄重塑：返還「實付」資源（訓練金幣逐次追蹤＋突破金幣/素材公式精算），
     戰鬥經驗升級是免費的、不返還 — 避免超額退款 */
  function resetRefund(h) {
    const train = h.spentGold || 0;
    let promo = 0;
    const mats = {};
    for (let k = 1; k <= (h.promoted || 0); k++) {
      const c = D.promoCost({ promoted: k - 1 });
      promo += c.gold;
      for (const m in c.mats) mats[m] = (mats[m] || 0) + c.mats[m];
    }
    return { gold: train + promo, mats, level: h.level, promoted: h.promoted || 0 };
  }

  /* v260 英雄置換：同職業 A↔B 投資全套對調（星級/等級/突破/技能書/spentGold/主副技 — 練錯救贖）
     消耗置換石 ×(1+星差)（王者商店週限產出）；不交換裝備/神器（英雄綁定）；fightGuard/鎖定守衛；
     formations/dispatch/resonance id 對調＋殘 id 清理（v248/v254 模式） */
  function swapCost(a, b) {
    return 1 + Math.ceil(Math.abs((a.rarity || 1) - (b.rarity || 1)) / 2); // v264：星差折半向上（置換窗口 4 週→3 週 — 週產 1 石下救贖可達）
  }
  function swapInvestment(a, b) {
    if (U.fightGuard(a) || U.fightGuard(b)) return { ok: false, reason: "出戰中不可置換" };
    if (a.locked || b.locked) return { ok: false, reason: "鎖定英雄不可置換 — 先解鎖" };
    if (MG.sys.expedition && (MG.sys.expedition.isBusy(a) || MG.sys.expedition.isBusy(b))) return { ok: false, reason: "委託遠征中不可置換" }; // v271
    if (a.cls !== b.cls) return { ok: false, reason: "只能與同職業英雄置換" };
    const st = S();
    const cost = swapCost(a, b);
    if ((st.currencies.swapStone || 0) < cost) return { ok: false, reason: "置換石不足（需 " + cost + "，週限取得）" };
    st.currencies.swapStone -= cost;
    // 投資全套對調
    const fields = ["rarity", "level", "exp", "promoted", "skills", "spentGold", "activeSkill", "subSkill"];
    const sa = {}, sb = {};
    for (const f of fields) { sa[f] = a[f]; sb[f] = b[f]; }
    for (const f of fields) { a[f] = sb[f]; b[f] = sa[f]; }
    // 位置對調：formations/dispatch/resonance 內 id 互換
    for (const t of (st.formations || [st.formation])) {
      for (let i = 0; i < t.length; i++) {
        if (t[i] === a.id) t[i] = b.id;
        else if (t[i] === b.id) t[i] = a.id;
      }
    }
    st.formation = teamOf().slice();
    if (Array.isArray(st.hunt.dispatchIds)) {
      st.hunt.dispatchIds = st.hunt.dispatchIds.map(id => id === a.id ? b.id : id === b.id ? a.id : id);
    }
    if (st.resonance && Array.isArray(st.resonance.slots)) {
      st.resonance.slots = st.resonance.slots.map(id => id === a.id ? b.id : id === b.id ? a.id : id);
    }
    // v260FIX：對調後補滿雙方 hp/mp（持續血量快取屬舊投資 — 強方繼承弱方殘血近乎空血開局）
    a.hp = Math.round(effectiveStats(a).hp); a.mp = Math.round(effectiveStats(a).mp);
    b.hp = Math.round(effectiveStats(b).hp); b.mp = Math.round(effectiveStats(b).mp);
    MG.sys.battle.reset();
    MG.core.audio.SFX.enhance();
    return { ok: true, name: a.name + " ↔ " + b.name };
  }
  function resetHero(h) {
    if (h.level <= 1 && !(h.promoted || 0)) return false;
    const r = resetRefund(h);
    const st = S();
    st.currencies.gold += r.gold;
    for (const m in r.mats) st.mats[m] = (st.mats[m] || 0) + r.mats[m];
    h.level = 1; h.exp = 0; h.promoted = 0; h.skills = {};
    delete h.activeSkill; delete h.subSkill; // v250FIX/v255：重塑後主/副技選擇一併重置（重練後不自動恢復舊選擇）
    h.spentGold = 0; // 返還後歸零，防止重複退款
    h.hp = Math.round(effectiveStats(h).hp);
    h.mp = Math.round(effectiveStats(h).mp);
    MG.sys.battle.reset();
    MG.core.audio.SFX.coin();
    MG.ui.dom.toast("「" + h.name + "」重塑完成：返還 " + U.fmt(r.gold) + " 金幣" + (Object.keys(r.mats).length ? "與 " + Object.keys(r.mats).length + " 種素材" : ""), "good", "icon_coin");
    return true;
  }
  /* v175 英雄技能升級：消耗技能書提升個別技能等級（Lv1→10，skillPower 1.0→2.08 倍 — v249 擴展：Lv6-10 與神器覺醒 ×2.08 同錨；書產出永續/原消耗有限 → 死貨幣疏通）
     成本 = 目前等級 ×2 本（Lv1-4 不變：1→2：2 … 4→5：8）；Lv5-9 每級 ×3（5→6：15 … 9→10：27）；
     v700：lvl≥7 附加 ×1.3^(lvl-6) — ≤6 不變；高階書水槽加深
     v712：加深指數軟封頂 min(lvl-6,2) — lvl≤8 不變；防 9→10 牆 */
  function skillUpCost(h, skillId) {
    const lvl = (h.skills && h.skills[skillId]) || 1;
    if (lvl >= 10) return -1;
    let c = lvl * (lvl < 5 ? 2 : 3); // v249FIX：lvl=5（5→6）即進 ×3 段 — 原 lvl<=5 使 5→6 只花 10 本
    if (lvl >= 7) c = Math.floor(c * Math.pow(1.3, Math.min(lvl - 6, 2)));
    return c;
  }
  function upgradeSkill(h, skillId) {
    const st = S();
    if (!unlockedSkills(h).some(sk => sk.id === skillId)) return { ok: false, reason: "技能尚未解鎖" };
    const cost = skillUpCost(h, skillId);
    if (cost < 0) return { ok: false, reason: "技能已滿級" };
    if ((st.currencies.book || 0) < cost) return { ok: false, reason: "技能書不足（需 " + cost + " 本）" };
    st.currencies.book -= cost;
    if (!h.skills) h.skills = {};
    h.skills[skillId] = ((h.skills[skillId] || 1)) + 1;
    MG.core.audio.SFX.enhance();
    MG.sys.battle.reset();
    return { ok: true, lvl: h.skills[skillId], cost };
  }
  function unlockedSkills(h) {
    const c = clsOf(h);
    const n = Math.min(c.skills.length, D.skillAtLevel.filter(lv => h.level >= lv).length);
    return c.skills.slice(0, n).map(id => ({ id, lvl: h.skills[id] || 1 }));
  }
  /* v250 技能編排：自選主動技（預設=職業第一技 → 舊行為零變更；未解鎖/無效 id 回退第一技）
     12/18 技能原為死技能（battle 只施放 skills[0]）— 活化騎士嘲諷/牧師群補/法師控場等第二三技 */
  function activeSkillOf(h) {
    const unlocked = unlockedSkills(h);
    const want = h.activeSkill;
    if (want && unlocked.some(sk => sk.id === want)) return want;
    return unlocked.length ? unlocked[0].id : null;
  }
  /* v255 技能編排 v2：副技槽（主技+副技雙施放 — 預設副技=職業第二技；未解鎖 → null 不施放） */
  function subSkillOf(h) {
    const unlocked = unlockedSkills(h);
    const want = h.subSkill;
    if (want && unlocked.some(sk => sk.id === want)) return want;
    const second = unlocked[1] ? unlocked[1].id : null;
    if (second && second === activeSkillOf(h)) return null; // 主=副防重複
    return second;
  }
  function setActiveSkill(h, skillId, slot) {
    const unlocked = unlockedSkills(h);
    if (!unlocked.some(sk => sk.id === skillId)) return { ok: false, reason: "技能尚未解鎖" };
    const other = slot === "sub" ? activeSkillOf(h) : subSkillOf(h);
    if (other === skillId) return { ok: false, reason: "該技能已是主技" + (slot === "sub" ? "，請先更換主技" : "（副技）") };
    if (slot === "sub") h.subSkill = skillId;
    else h.activeSkill = skillId;
    MG.sys.battle.reset();
    return { ok: true };
  }
  /* v147 升星（放置英雄核心循環）：稀有度即星級，升星 = 消耗同職業同星英雄 + 任意職業同星肥料
     稀有度 +1 → 成長倍率跳升（RARITY.grow）。自動挑選戰力最低者消耗（非編隊優先）。 */
  /* v210 傳說徽章：階數／效果倍率／升級（碎片 + 金幣；碎片來源：重複傳說 ×5、深淵 50+ 層領主 ×1、活動商店週限 1） */
  function badgeLv(legend) { return (S().legendBadges || {})[legend] || 0; }
  function badgeMul(legend) {
    const lv = badgeLv(legend);
    if (!lv) return 1;
    const tp = ((D.LEGENDS || {})[legend] || {}).passive;
    return 1 + (tp && tp.teamAtk ? 0.02 : 0.03) * (lv - 1); // 全隊型降速防疊爆
  }
  /* v676：徽章升階金幣單一來源（UI 顯示與 badgeUp 實扣同源）
     v708：加深指數軟封頂 min(lv-2,3) — lv≤5 不變；防 6 階牆 */
  function badgeGoldCost(lv) {
    let gold = 300 * Math.pow(2, lv);
    if (lv >= 3) gold *= Math.pow(1.25, Math.min(lv - 2, 3));
    return Math.floor(gold);
  }
  function badgeUp(legend) {
    const st = S();
    const lv = badgeLv(legend);
    if (lv >= 6) return { ok: false, reason: "已達最高階" };
    const shards = 1 + lv; // 1→2 需 1 片、2→3 需 2 片…6 階共 1+2+3+4+5+6 = 21 片
    const gold = badgeGoldCost(lv);
    if ((st.legendShards || 0) < shards) return { ok: false, reason: "徽章碎片不足（需 " + shards + " 片）" };
    if ((st.currencies.gold || 0) < gold) return { ok: false, reason: "金幣不足（需 " + U.fmt(gold) + "）" };
    st.legendShards -= shards;
    st.currencies.gold -= gold;
    if (!st.legendBadges) st.legendBadges = {};
    st.legendBadges[legend] = lv + 1;
    MG.sys.battle.reset();
    MG.core.audio.SFX.levelup();
    MG.ui.dom.toast("「" + ((D.LEGENDS || {})[legend] || {}).name + "」徽章升至 " + (lv + 1) + " 階！", "good", "icon_honor");
    return { ok: true, lv: lv + 1 };
  }
  function starUpCost(h) {
    const st = S();
    const n = h.rarity || 1;
    const max = (D.starUp && D.starUp.max) || MG.config.RARITY.length;
    if (n >= max) return { star: n, next: null, max: true };
    const i = n - 1;
    const needCopy = D.starUp.copies[i], needFod = D.starUp.fodder[i];
    const pool = st.hunters.filter(x => x.id !== h.id && (x.rarity || 1) === n && !x.locked); // v210：鎖定英雄不作升星材料
    const sameCls = pool.filter(x => x.cls === h.cls);
    const copies = Math.min(needCopy, sameCls.length);
    const fodder = Math.min(needFod, pool.length - copies);
    const inF = x => st.formation.includes(x.id) || (st.formations || []).some(t => t.includes(x.id));
    const pick = (arr, cnt) => [...arr]
      .sort((a, b) => (inF(a) ? 1 : 0) - (inF(b) ? 1 : 0) || power(a) - power(b))
      .slice(0, cnt);
    const usedCopy = pick(sameCls, needCopy);
    const usedFod = pick(pool.filter(x => !usedCopy.includes(x)), needFod);
    return {
      star: n, next: n + 1, max: false,
      needCopy, needFod, copies, fodder, can: copies >= needCopy && fodder >= needFod,
      used: usedCopy.concat(usedFod)
    };
  }
  function starUp(h) {
    const c = starUpCost(h);
    if (!c || c.max || !c.can) return false;
    const st = S();
    const oldMax = effectiveStats(h).hp;
    const usedIds = c.used.map(x => x.id);
    // 被消耗英雄：卸裝送回背包（比照遣散）→ 移出名冊與所有編隊
    for (const x of c.used) {
      for (const slot in x.equip) { const uid = x.equip[slot]; if (uid) { x.equip[slot] = null; MG.sys.equipment.returnToInventory(uid); } }
    }
    st.hunters = st.hunters.filter(x => !usedIds.includes(x.id));
    for (const t of (st.formations || [st.formation])) for (let i = 0; i < t.length; i++) if (usedIds.includes(t[i])) t[i] = null;
    st.formation = ((st.formations && st.formations[st.activeTeam || 0]) || st.formation).slice();
    // 升星：稀有度 +1，生命/魔力按比例成長（比照突破）
    h.rarity = c.next;
    if (oldMax > 0) {
      h.hp = Math.round((h.hp === undefined ? effectiveStats(h).hp : h.hp) * (effectiveStats(h).hp / oldMax));
      h.mp = Math.round((h.mp === undefined ? effectiveStats(h).mp : h.mp) * (effectiveStats(h).mp / oldMax));
    }
    MG.sys.game.addKingdomExp(20 * h.rarity);
    st.stats.starUps = (st.stats.starUps || 0) + 1; // 任務/成就計數（跨遣散保留）
    MG.sys.meta.bump("starup", 1);
    MG.core.audio.SFX.levelup();
    MG.ui.dom.toast("「" + h.name + "」升星至 " + MG.config.RARITY[h.rarity - 1].name + "（★" + h.rarity + "）！全屬性提升", "good", "fx_heal");
    MG.sys.battle.reset();
    return true;
  }
  /* v153 心願清單：選定職業招募出現率 ×2（配合升星湊同職業肥料） */
  function pickClass() {
    const st = S();
    const clsList = Object.keys(D.classes);
    const wish = ((st.settings && st.settings.wishlist) || []).filter(c => clsList.includes(c)).slice(0, 2);
    if (!wish.length) return U.pick(clsList);
    const weights = clsList.map(c => wish.includes(c) ? 2 : 1);
    const tot = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < clsList.length; i++) { r -= weights[i]; if (r <= 0) return clsList[i]; }
    return clsList[clsList.length - 1];
  }
  /* v148 保底進度（UI 顯示）：回傳 {cur, target, star}；金幣招募無保底 */
  function pityInfo(type) {
    const st = S();
    if (type === "gem") return { cur: st.stats.gemPity || 0, target: 20, star: 6 };
    if (type === "ticket") return { cur: st.stats.ticketPity || 0, target: 10, star: 5 };
    return null;
  }
  return { create, baseStats, effectiveStats, power, expNeed, gainExp, canPromote, promoPreview, promote, train,
    recruitCost, doRecruit, pickClass, formation, formationIds, inFormation, setFormationSlot, autoFill, dismiss,
    teamOf, setActiveTeam,
    syncDispatchFromFormation, teamsUnlocked, teamInfo,
    synthPreview, synthHero, SHARD_RATES, SYNTH_DEFS, dismissCost, // v248 批量遣散彙總共用成本
    equippedItems, setCounts, unlockedSkills, activeSkillOf, subSkillOf, setActiveSkill, starUpCost, starUp, pityInfo, pickClass, resetRefund, resetHero,
    resonanceEnsure, resonanceSlots, resonanceLevel, combatLevel, setResonanceSlot, clearResonanceSlot, resonanceInfo, resonanceSuggest, swapInvestment, swapCost, // v254 共鳴祭壇；v268 自動填槽建議；v260 置換
    bondsState, bondEffects, skillUpCost, upgradeSkill, artifactLevel, artifactMul, artifactRefineCost, refineArtifact, refinePreview, refineToMax, // v253 精煉到滿
    awakeLevel, artifactAwakenCost, awakenArtifact, // v245 神器覺醒
    badgeLv, badgeMul, badgeGoldCost, badgeUp, resonanceStats, starCandidates };
})();
