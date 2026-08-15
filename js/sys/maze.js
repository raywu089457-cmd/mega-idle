/* 放置王國 MEGA IDLE — 奇境迷宮（v265）：週限 roguelike MVP
   每週 1 次完整探索：3 層 × 4 節點（層入口 3 選 1 分支）、節點 4 型（戰鬥/寶箱/事件/層末首領）、
   三選一增益 ×3 層級（同系封頂 ×1.5）、確定性種子 FNV(週key:層)（同週同圖可分享）、
   里程碑結算（settled 防重發）；純新增克隆 tower/honorshop 模式，battle.js 零觸碰 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.maze = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const UNLOCK_KL = 14;
  const LAYERS = 3, NODES_PER_LAYER = 4, TOTAL = 12;
  const LAYER_ANCHOR = [1.0, 1.08, 1.15]; // 戰鬥錨（層遞增）
  /* 增益表：5 系 × 3 層級（普通/稀有/傳說）— 同系加法疊加、單系封頂 ×1.5 */
  const BOONS = {
    atk: { name: "攻擊", mul: [0.08, 0.15, 0.25] },
    hp: { name: "生命", mul: [0.08, 0.15, 0.25] },
    crit: { name: "暴擊", mul: [0.08, 0.15, 0.25] },
    skill: { name: "技能威力", mul: [0.08, 0.15, 0.25] },
    spd: { name: "攻速", mul: [0.08, 0.15, 0.25] }
  };
  const BOON_KEYS = Object.keys(BOONS);
  /* 里程碑（節點推進發獎 — settled 防重發；全通追加大獎） */
  const MILESTONES = { 3: { void: 10, book: 2, t3: 1 }, 6: { void: 15, book: 3, t3: 2 }, 9: { void: 20, book: 4, t3: 3 }, 12: { void: 25, book: 5, t3: 4 } };
  const FINISH_BONUS = { gems: 300, badge: 2 };
  function weekKey() { return MG.sys.honorshop.weekKey(); }
  function hash(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 16777619) >>> 0; h = (h ^ (h >>> 16)) >>> 0;
    return h;
  }
  function ensure() {
    const st = S();
    if (!st.maze) st.maze = { week: "", node: 0, boons: {}, claims: {}, finished: false, branch: [] };
    const mz = st.maze;
    if (typeof mz.boons !== "object" || !mz.boons) mz.boons = {};
    if (typeof mz.claims !== "object" || !mz.claims) mz.claims = {};
    const wk = weekKey();
    if (mz.week !== wk) { mz.week = wk; mz.node = 0; mz.boons = {}; mz.claims = {}; mz.finished = false; mz.branch = []; }
    return mz;
  }
  function unlocked() { return (S().kingdom.level || 1) >= UNLOCK_KL; }
  /* 分支（層入口）：3 選 1 — 決定該層 4 節點型別順序 */
  function branchFor(layer) {
    const h = hash(weekKey() + ":b" + layer);
    const seq = ["fight", "chest", "event", "fight"];
    // 旋轉序列（3 種起點 — 分支選擇 = 起始節點型別偏移）
    const rot = h % 3;
    return [0, 1, 2].map(i => seq[(rot + i) % 3]);
  }
  /* v266 分支選擇：3 組旋轉序列（戰/箱/事/戰 ＋ 層末首領）— 同週同圖可分享；選定寫 mz.branch */
  function branchOptions(layer) {
    const seq = ["fight", "chest", "event"];
    return [0, 1, 2].map(rot => {
      const s = [0, 1, 2, 3].map(i => i === 3 ? "boss" : seq[(rot + i) % 3]);
      return { rot, seq: s };
    });
  }
  function pickBranch(layer, rot) {
    if (!Number.isInteger(layer) || layer < 0 || layer >= LAYERS) return { ok: false, reason: "層級無效" };
    if (!Number.isInteger(rot) || rot < 0 || rot > 2) return { ok: false, reason: "路線無效" };
    const mz = ensure();
    if (mz.finished) return { ok: false, reason: "本週已全通" };
    if (mz.node % NODES_PER_LAYER !== 0) return { ok: false, reason: "僅層入口可選擇路線" };
    if (mz.branch[layer] !== undefined) return { ok: false, reason: "本層路線已選定" };
    mz.branch[layer] = branchOptions(layer)[rot].seq;
    return { ok: true };
  }
  function nodeType(layer, nodeIdx) {
    if (nodeIdx === 3) return "boss"; // 層末首領
    const mz = ensure();
    const b = mz.branch[layer] || branchFor(layer);
    return b[nodeIdx];
  }
  /* 節點內容（確定性 — 種子） */
  function nodeDesc(layer, nodeIdx) {
    const t = nodeType(layer, nodeIdx);
    const h = hash(weekKey() + ":n" + layer + ":" + nodeIdx);
    if (t === "boss") return "層末首領（戰力錨 ×" + LAYER_ANCHOR[layer] + "）";
    if (t === "chest") {
      const cc = chestContents(layer, nodeIdx); // v266FIX：具名預告與發獎同源（原「X 種」高估 — 種子位移碰撞去重後種類更少）
      const kinds = new Set(cc.map(([m]) => m)).size;
      return "寶箱：素材 " + kinds + " 種（" + cc.map(([m, q]) => (MG.config.MATS[m] || {}).name + " ×" + q).join("・") + "）";
    }
    if (t === "event") return "事件：三選一增益";
    return "戰鬥（" + ["普通", "精英", "強化"][h % 3] + "）";
  }
  /* 三選一增益（事件節點）— v265FIX：3 系互異（原種子低位可能同系 → 無選擇） */
  function boonOptions() {
    const h = hash(weekKey() + ":boon");
    const pool = BOON_KEYS.slice();
    const out = [];
    for (let i = 0; i < 3; i++) {
      const idx = (h >>> (i * 5)) % pool.length;
      out.push(pool.splice(idx, 1)[0]); // 抽走避免重複
    }
    return out;
  }
  function boonPick(k) {
    const mz = ensure();
    if (!BOONS[k]) return { ok: false, reason: "增益不存在" };
    if ((mz.boons[k] || 0) >= 3) return { ok: false, reason: "該系增益已滿（3 層級）" };
    mz.boons[k] = (mz.boons[k] || 0) + 1;
    return { ok: true };
  }
  /* 增益乘數（併入 teamPower 單一來源 — sim 與實戰同源） */
  function boonMul(k) {
    const mz = ensure();
    const lv = mz.boons[k] || 0;
    return Math.min(1.5, 1 + BOONS[k].mul.slice(0, lv).reduce((a, b) => a + b, 0));
  }
  function totalMul() {
    let m = 1;
    for (const k of BOON_KEYS) m *= boonMul(k);
    return m;
  }
  function teamPowerOf() {
    const st = S();
    const ids = MG.sys.hunters.formationIds().filter(Boolean);
    const tp = ids.reduce((a, id) => { const h = st.hunters.find(x => x.id === id); return a + (h ? MG.sys.hunters.power(h) : 0); }, 0);
    return tp * totalMul();
  }
  function winChance(layer) {
    const tp = teamPowerOf();
    if (tp <= 0) return 0;
    const mul = totalMul();
    const raw = tp / mul; // v265FIX：錨定未增益 power（原 rec 含增益 → 自我參照 → 勝率恆定 50/48/46.5% — 增益/換隊無效）
    const rec = Math.max(100, raw * LAYER_ANCHOR[layer]);
    return U.clamp(tp / (tp + rec), 0.1, 0.98);
  }
  /* 節點推進：fight = shadow sim 判定；boss 勝 → 層進；里程碑發獎 */
  function advance() {
    const mz = ensure();
    if (mz.finished) return { ok: false, reason: "本週已全通（下週重置）" };
    if (mz.node >= TOTAL) return { ok: false, reason: "本週已全通（下週重置）" }; // v265FIX：finished 在 node++ 處設定
    const layer = Math.min(LAYERS - 1, Math.floor(mz.node / NODES_PER_LAYER));
    const idx = mz.node % NODES_PER_LAYER;
    const t = nodeType(layer, idx);
    if (t === "fight") {
      const w = U.chance(winChance(layer));
      if (!w) return { ok: false, reason: "戰鬥失利（勝率 " + Math.round(winChance(layer) * 100) + "%）— 可調整編隊後重試（本週可重進）" };
    } else if (t === "boss") {
      const w = U.chance(winChance(layer));
      if (!w) return { ok: false, reason: "層末首領戰敗 — 調整編隊後重試" };
    }
    // 寶箱：直接給資源（確定性 — v266 chestContents 共享同源）
    if (t === "chest") {
      const st = S();
      for (const [m, q] of chestContents(layer, idx)) st.mats[m] = (st.mats[m] || 0) + q;
    }
    mz.node++;
    // 里程碑發獎（settled 防重發）
    if (MILESTONES[mz.node]) grant(MILESTONES[mz.node]);
    // v265FIX：達 TOTAL 立即全通（原 finished 分支重發 MILESTONES[12] — 雙發）
    if (mz.node >= TOTAL) { mz.finished = true; grant(FINISH_BONUS); }
    return { ok: true, node: mz.node, type: t, chance: Math.round(winChance(layer) * 100), finished: mz.finished };
  }
  /* v266 寶箱內容共享（advance 發獎與 UI 預告同源 — 確定性種子） */
  function chestContents(layer, idx) {
    const h = hash(weekKey() + ":n" + layer + ":" + idx);
    const ks = Object.keys(MG.config.MATS);
    const out = [];
    for (let i = 0; i < 3 + (h % 4); i++) {
      const m = ks[(h >>> (i * 2)) % ks.length];
      out.push([m, 2 + (h % 4)]);
    }
    return out;
  }
  function grant(r) {
    const st = S();
    if (r.void) st.mats.void = (st.mats.void || 0) + r.void;
    if (r.t3) { st.mats.void = (st.mats.void || 0) + r.t3; st.mats.myth = (st.mats.myth || 0) + r.t3; }
    if (r.book) st.currencies.book = (st.currencies.book || 0) + r.book;
    if (r.gems) st.currencies.gems = (st.currencies.gems || 0) + r.gems;
    if (r.badge) st.legendShards = (st.legendShards || 0) + r.badge;
  }
  function progress() {
    const mz = ensure();
    return { node: mz.node, total: TOTAL, finished: mz.finished, boons: mz.boons, layer: Math.min(LAYERS - 1, Math.floor(mz.node / NODES_PER_LAYER)) }; // v266FIX：層顯示 off-by-one（原非層入口多算一層）
  }
  return { UNLOCK_KL, LAYERS, NODES_PER_LAYER, TOTAL, BOONS, BOON_KEYS, MILESTONES, FINISH_BONUS, weekKey, ensure, unlocked, branchOptions, pickBranch, nodeType, nodeDesc, chestContents, boonOptions, boonPick, boonMul, totalMul, teamPowerOf, winChance, advance, progress }; // v266 分支/寶箱
})();
