/* 放置王國 MEGA IDLE — 委託遠征營（循環 22・第 1 輪・玩法機制 v271）
   板凳英雄定時委託板：王國 Lv16 解鎖，4-6 委託欄位（Lv20/24 +1），每日 6 張委託
   （FNV(日key) 確定性種子 — 同天同任務可分享）；派遣 1-3 名空閒英雄、總戰力 ≥ 需求保證成功
   （條件職業匹配 1.1-1.3 效率加成 — 非隨機 sim，全確定性）；牆鐘結算（完成自動發放＋離線段），
   提前召回領 50%；busy 守衛掛名冊/編隊/共鳴/置換/遣散 6 處 — 遠征中英雄不可他用。
   獎勵錨 U=5000×1.35^(kl-1)（v259 市場同錨）— 週產 ≤ 狩獵週產 3%；battle.js 零觸碰。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.expedition = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const UNLOCK_KL = 16;
  const DAILY = 6;
  /* 委託池（名稱/時長/需求戰力倍率/品質/職業條件 — 品質由日種子滾動） */
  const POOL = [
    { name: "清掃營地", hours: 1, need: 0.8, cls: null },
    { name: "運送補給", hours: 1, need: 0.9, cls: "sword" },
    { name: "偵察小徑", hours: 4, need: 1.0, cls: null },
    { name: "採集藥草", hours: 4, need: 1.0, cls: "mage" },
    { name: "護衛商隊", hours: 8, need: 1.2, cls: null },
    { name: "清剿獸群", hours: 8, need: 1.4, cls: "archer" }
  ];
  const QUALITY = [
    { name: "普通", mul: 1, book: 0 },
    { name: "稀有", mul: 2, book: 0 },
    { name: "史詩", mul: 4, book: 1 }
  ]; // v271FIX：書僅史詩（原稀有 1/史詩 2 → 週 28 本 ≈ 市場整週供應 — 下調至週 ≤7 本）
  function weekKey() { return MG.sys.honorshop.weekKey(); }
  function dayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  function hash(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 16777619) >>> 0; h = (h ^ (h >>> 16)) >>> 0;
    return h;
  }
  function unlocked() { return (S().kingdom.level || 1) >= UNLOCK_KL; }
  function slots() {
    const kl = S().kingdom.level || 1;
    return kl >= 24 ? 6 : kl >= 20 ? 5 : 4;
  }
  /* 牆鐘金幣錨 U=5000×1.35^(kl-1)（v259 市場同錨） */
  function goldUnit() { return Math.floor(5000 * Math.pow(1.35, Math.max(0, (S().kingdom.level || 1) - 1))); }
  function ensure() {
    const st = S();
    if (!st.exped) st.exped = { day: "", tasks: [], slots: [], done: {} };
    const ex = st.exped;
    if (!Array.isArray(ex.slots)) ex.slots = [];
    if (!ex.done || typeof ex.done !== "object") ex.done = {};
    // v271FIX：日重置不主動清派遣中槽（槽存任務快照 — 跨日委託照常結算；原清 slots 使離線跨日
    // 時 ensure 先重置 → settleAll 掃空 → 未結算完成委託獎勵遺失，且 h.exped 殘留）
    if (ex.day !== dayKey()) { ex.day = dayKey(); ex.tasks = []; }
    return ex;
  }
  /* 每日 6 張委託（FNV(日key+idx) 確定性 — 品質/時長由種子滾動；同天同圖可分享） */
  function tasks() {
    const ex = ensure();
    if (Array.isArray(ex.tasks) && ex.tasks.length === DAILY && ex.tasks[0] && ex.tasks[0].day === ex.day) return ex.tasks;
    const out = [];
    const topPower = topPowerOf();
    for (let i = 0; i < DAILY; i++) {
      const h = hash(dayKey() + ":t" + i);
      const base = POOL[i % POOL.length];
      const qual = QUALITY[(h % 3)]; // 普通/稀有/史詩 33/33/33 — 品質由日種子
      const need = Math.max(0.7, base.need * (0.9 + (h % 3) * 0.1));
      out.push({
        day: ex.day, idx: i, name: base.name, hours: base.hours,
        qual: qual.name, qualMul: qual.mul, book: qual.book,
        need: Math.floor(need * topPower / 500) * 500, // 需求戰力（以名冊最高戰力錨定 — 保證可完成）
        cls: base.cls
      });
    }
    ex.tasks = out;
    return out;
  }
  function topPowerOf() {
    const st = S();
    let best = 0;
    for (const h of st.hunters || []) {
      try { const p = MG.sys.hunters.power(h); if (p > best) best = p; } catch (e) { /* 缺欄位英雄略過 */ }
    }
    return Math.max(1000, best);
  }
  function isBusy(h) { return !!(h && h.exped && h.exped.until > Date.now()); }
  /* 派遣：槽位 + 任務 + 1-3 名空閒英雄（總戰力 ≥ 需求保證成功；職業匹配效率加成） */
  function dispatch(slotIdx, taskIdx, ids) {
    const st = S();
    const ex = ensure();
    if (!unlocked()) return { ok: false, reason: "王國 Lv" + UNLOCK_KL + " 解鎖" };
    if (slotIdx < 0 || slotIdx >= slots()) return { ok: false, reason: "欄位無效" };
    if (ex.slots[slotIdx]) return { ok: false, reason: "該欄位已有委託" };
    const t = tasks()[taskIdx];
    if (!t) return { ok: false, reason: "委託不存在" };
    if (!Array.isArray(ids) || ids.length < 1 || ids.length > 3) return { ok: false, reason: "需派遣 1-3 名英雄" };
    const hs = ids.map(id => (st.hunters || []).find(x => x.id === id));
    if (hs.some(h => !h)) return { ok: false, reason: "英雄不存在" };
    if (hs.some(h => isBusy(h))) return { ok: false, reason: "有英雄已在遠征/派遣中" };
    if (hs.some(h => (st.hunt.dispatchIds || []).includes(h.id) || (st.formation || []).includes(h.id))) return { ok: false, reason: "出戰/編隊中英雄不可派遣" }; // v271FIX：模組層守衛（UI 過濾外防其他呼叫者雙重用）
    // 重複 id 檢查
    if (new Set(ids).size !== ids.length) return { ok: false, reason: "英雄重複" };
    const total = hs.reduce((a, h) => a + MG.sys.hunters.power(h), 0);
    if (total < t.need) return { ok: false, reason: "總戰力不足（需 " + U.fmt(t.need) + "，目前 " + U.fmt(total) + "）" };
    // 職業匹配效率加成（1.1-1.3）
    let eff = 1.0;
    if (t.cls) {
      const matched = hs.filter(h => h.cls === t.cls).length;
      eff = 1 + matched * 0.1;
    }
    const now = Date.now();
    // v271FIX：槽存任務快照（name/hours/qualMul/book — 換日後 tasks() 重新生成，taskIdx 引用會錯位）
    const slot = { ids, taskIdx, name: t.name, hours: t.hours, qualMul: t.qualMul, book: t.book, need: t.need, until: now + t.hours * 3600e3, total, eff, settled: false };
    ex.slots[slotIdx] = slot;
    for (const h of hs) h.exped = { until: slot.until, slotIdx };
    return { ok: true, until: slot.until, name: slot.name, hours: slot.hours }; // v271FIX：回傳快照（跨午夜確認 toast 不誤導）
  }
  /* 獎勵計算（完成/召回共用）：U 錨 × 時長效率 × 品質 × 0.4 基數 */
  function rewardFor(slot) {
    // v271FIX：用槽快照（換日安全）；缺欄回退（v271FIX 前的舊槽形狀 — normalize 不遷移 → 防 NaN）
    const hours = slot.hours || (tasks()[slot.taskIdx] || {}).hours || 1;
    const qualMul = slot.qualMul || (tasks()[slot.taskIdx] || {}).qualMul || 1;
    const book = slot.book || 0;
    const hMul = hours === 8 ? 1.25 : hours === 4 ? 1.1 : 1;
    const Uv = goldUnit();
    return {
      gold: Math.floor(Uv * hMul * qualMul * 0.13 * (slot.eff || 1)), // v271FIX：基數 0.4→0.13（原週產 ≈48×U 為市場 sink 19.1×U 的 2.5 倍）
      void: qualMul >= 4 ? ((slot.eff || 1) >= 1.1 ? 2 : 1) : 0, // v271FIX：虛空僅史詩（原稀有+ → 週 28-56 為市場 3-5.6 倍）
      book
    };
  }
  /* 牆鐘結算：時間到自動發放（完成即入袋 — 離線段由 save 呼叫 settleAll） */
  function settle(slotIdx) {
    const st = S();
    const ex = ensure();
    const slot = ex.slots[slotIdx];
    if (!slot || slot.settled) return null;
    if (Date.now() < slot.until) return null;
    slot.settled = true;
    const r = rewardFor(slot);
    st.currencies.gold += r.gold;
    if (r.void) st.mats.void = (st.mats.void || 0) + r.void;
    if (r.book) st.currencies.book = (st.currencies.book || 0) + r.book;
    ex.done[dayKey()] = (ex.done[dayKey()] || 0) + 1;
    // 釋放英雄
    for (const id of slot.ids) {
      const h = (st.hunters || []).find(x => x.id === id);
      if (h) h.exped = null;
    }
    ex.slots[slotIdx] = null;
    return { name: slot.name, gold: r.gold, void: r.void, book: r.book, hours: slot.hours };
  }
  function settleAll() {
    const ex = ensure();
    const out = [];
    for (let i = 0; i < ex.slots.length; i++) {
      const r = settle(i);
      if (r) out.push(r);
    }
    return out;
  }
  /* 提前召回：即時結算 50% + 釋放英雄（英雄可再用） */
  function recall(slotIdx) {
    const st = S();
    const ex = ensure();
    const slot = ex.slots[slotIdx];
    if (!slot) return { ok: false, reason: "該欄位沒有委託" };
    if (slot.settled) return { ok: false, reason: "已結算" };
    const r = rewardFor(slot);
    const half = { gold: Math.floor(r.gold * 0.5), void: r.void ? Math.max(1, Math.floor(r.void * 0.5)) : 0, book: r.book ? 1 : 0 };
    st.currencies.gold += half.gold;
    if (half.void) st.mats.void = (st.mats.void || 0) + half.void;
    if (half.book) st.currencies.book = (st.currencies.book || 0) + half.book;
    for (const id of slot.ids) {
      const h = (st.hunters || []).find(x => x.id === id);
      if (h) h.exped = null;
    }
    ex.slots[slotIdx] = null;
    return { ok: true, name: slot.name, gold: half.gold, void: half.void, book: half.book };
  }
  function progress() {
    const ex = ensure();
    const list = [];
    for (let i = 0; i < slots(); i++) {
      const s = ex.slots[i];
      list.push(s ? { idx: i, taskIdx: s.taskIdx, name: s.name, hours: s.hours, qualMul: s.qualMul, book: s.book, ids: s.ids, until: s.until, total: s.total, eff: s.eff } : null);
    }
    return { unlocked: unlocked(), slots: slots(), list, tasks: tasks() };
  }
  return { UNLOCK_KL, DAILY, POOL, QUALITY, unlocked, slots, weekKey, dayKey, ensure, tasks, isBusy, dispatch, settle, settleAll, recall, rewardFor, progress, goldUnit };
})();
