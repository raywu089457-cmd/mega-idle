/* 放置王國 MEGA IDLE — 元素試煉塔（v230，玩法機制）
   市面放置英雄標準內容：每週重置的元素爬塔（放置奇兵光之塔/AFK 試煉塔變體）。
   啟用兩套閒置系統：元素相剋（v190/v220 — 原唯一決策點為週首領弱點）＋ 5 隊編制（v221 — 4 隊無專屬內容）。
   勝率 = 影子模擬（dungeon 同公式 win/(win+rec)）；剋制英雄戰力 ×(1+0.5×佔比)（v220 出戰傷害同公式）。
   純視覺/數值層 — 不觸碰 battle.js 真實戰鬥；每層每週一次（里程碑式，無消耗，失敗無懲罰可重試）。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.tower = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const LAYERS = 15;
  function weekKey() { return MG.sys.meta.weekKey(); }
  function ensure() {
    const st = S();
    if (!st.tower) st.tower = { week: "", cleared: {} };
    // 週重置（ISO 週一分桶 — honorshop/abyss 同模式）
    if (st.tower.week !== weekKey()) { st.tower.week = weekKey(); st.tower.cleared = {}; }
    return st.tower;
  }
  /* 每層弱點元素：FNV(週 key:層號) → 6 元素之一（guild.rollWeak 機械複製 — 同週內各層穩定） */
  function layerWeak(layer) {
    const seed = weekKey() + ":" + layer;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 16777619) >>> 0; h = (h ^ (h >>> 16)) >>> 0;
    const ELS = Object.keys(MG.config.ELEMENT_COUNTER);
    return ELS[h % ELS.length];
  }
  function powerOf(ids) {
    const st = S();
    return ids.reduce((a, id) => {
      const h = st.hunters.find(x => x.id === id);
      return a + (h ? MG.sys.hunters.power(h) : 0);
    }, 0);
  }
  /* 剋制佔比：英雄元素「剋制」層弱點（ELEMENT_COUNTER[el]===weak — v220FIX 方向同語義） */
  function counterRatio(ids, weak) {
    const st = S();
    let total = 0, weakPow = 0;
    for (const id of ids) {
      const h = st.hunters.find(x => x.id === id);
      if (!h) continue;
      const p = MG.sys.hunters.power(h);
      total += p;
      const el = MG.config.CLASS_ELEMENT[h.cls];
      if (el && MG.config.ELEMENT_COUNTER[el] === weak) weakPow += p;
    }
    return total > 0 ? weakPow / total : 0;
  }
  /* 推薦戰力：層數曲線 ×0.35 錨定選隊戰力 ×1.1（v224 dungeon recPower 公式 — 勝率恆穩，指數封頂防反超）
     v848：加深軟封頂 min(layer-1,14) — 層≤15 不變；防高層試煉 rec 牆 */
  function recPower(layer, tp) {
    return Math.max(
      Math.floor(200 * Math.pow(1.5, Math.min(layer - 1, 14)) * 0.35),
      Math.floor(tp * 1.1)
    );
  }
  function winChance(layer, ids) {
    const tp = powerOf(ids);
    if (tp <= 0) return 0;
    const weak = layerWeak(layer);
    const winPow = tp * (1 + 0.5 * counterRatio(ids, weak)); // v220 出戰傷害同公式
    const rec = recPower(layer, tp);
    return U.clamp(winPow / (winPow + rec), 0.1, 0.98);
  }
  /* 每層獎勵：榮譽隨層遞增＋九種素材各 n（層數/3）；里程碑 5/10/15 層加碼鑽石 */
  function reward(layer) {
    const mats = Math.max(1, Math.floor(layer / 3));
    const ms = layer === 5 ? { gems: 20 } : layer === 10 ? { gems: 40 } : layer === 15 ? { gems: 80 } : null;
    return { honor: 3 + layer, mats, ms };
  }
  function challenge(layer, ids, silent) {
    ensure();
    const st = S();
    const t = st.tower;
    if (layer < 1 || layer > LAYERS) return { ok: false, reason: "層數無效" };
    if (t.cleared[layer]) return { ok: false, reason: "本週已通過此層（每層每週一次）" };
    if (layer > 1 && !t.cleared[layer - 1]) return { ok: false, reason: "請先通過第 " + (layer - 1) + " 層（需依序挑戰）" };
    if (!ids || !ids.length) return { ok: false, reason: "請先編排出戰編隊" };
    const w = U.chance(winChance(layer, ids));
    if (!w) return { ok: false, win: false, reason: "挑戰失敗 — 換剋制元素編隊或強化後再試（無懲罰）" };
    t.cleared[layer] = true;
    const r = reward(layer);
    if (r.honor) st.currencies.honor += r.honor;
    if (r.ms && r.ms.gems) st.currencies.gems += r.ms.gems;
    for (const k in MG.config.MATS) st.mats[k] = (st.mats[k] || 0) + r.mats;
    if (MG.sys.meta && MG.sys.meta.bump) MG.sys.meta.bump("mat", 9 * r.mats); // v214 模式：素材計入每日 d8
    if (!silent) MG.core.audio.SFX.quest(); // v233：自動攀登單一 SFX（15 層 jingle 風暴防護）
    return { ok: true, win: true, honor: r.honor, gems: (r.ms && r.ms.gems) || 0, mats: r.mats };
  }
  function progress() {
    const t = ensure();
    const n = Object.keys(t.cleared).length;
    return { cleared: n, total: LAYERS, all: n >= LAYERS, next: n + 1 };
  }
  /* v233 自動挑戰至卡關：從下一個未通層依序 challenge（每層守衛不變 — 每週一次/依序/空隊）；
     首敗即停（失敗無懲罰 — 自動化零損失），回報逐層結果供 UI 彙總 */
  function autoClimb(ids) {
    ensure();
    const out = { climbed: [], stopped: null, honor: 0, gems: 0 };
    let layer = progress().next;
    while (layer <= LAYERS) {
      const r = challenge(layer, ids, true); // v233：迴圈 silent ＋ 收尾單一 SFX
      if (!r.ok) { if (r.win === false) out.stopped = { layer, reason: r.reason }; else return { ok: false, reason: r.reason }; break; }
      out.climbed.push(layer);
      out.honor += r.honor;
      out.gems += r.gems || 0;
      layer++;
    }
    if (out.climbed.length > 0) MG.core.audio.SFX.quest();
    return { ok: out.climbed.length > 0, ...out };
  }
  return { LAYERS, ensure, layerWeak, winChance, reward, challenge, progress, counterRatio, autoClimb };
})();
