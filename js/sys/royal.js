/* 放置王國 MEGA IDLE — 王者競技場（v260）：三隊制週迴圈 PvP
   多隊深度（v254 共鳴/v255 編隊批量/v259 槽成長）的第一個專屬每週回報 —
   對決 = shadow sim（tower 公式 win/(win+rec)）零 battle.js 觸碰；
   離線不結算（arena 契約）；跨週未領分數自動結算（討伐模式 — 漏領不損失）；週限防印鈔 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.royal = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const DAILY_FIGHTS = 5;
  const ANCHOR = [1.35, 1.15, 1.0]; // 我方對應隊戰力錨（勝率恆穩 — 排名制不依賴絕對戰力）
  const RANK_BONUS = [50, 30, 15]; // 週結算 3 戰 2 勝場次分檔追加王者幣
  /* 王者商店（週限兌換 — honorshop/v259 模式克隆） */
  const SHOP = [
    { id: "rswap", name: "置換石 ×1", icon: "icon_honor", price: 20, stock: 1, swap: 1 }, // v264：20 幣（週產保底後核心三件可達）
    { id: "rbadge", name: "傳說徽章碎片 ×1", icon: "icon_honor", price: 40, stock: 1, badge: 1 },
    { id: "rt3", name: "虛空/神話碎片 ×2", icon: "mat_void", price: 20, stock: 3, t3: 2 },
    { id: "rbook", name: "技能書 ×10", icon: "icon_book", price: 15, stock: 3, book: 10 }
  ];
  function weekKey() { return MG.sys.honorshop.weekKey(); }
  function teamPowerOf(n) {
    const st = S();
    const r = st.royal || { teamIds: [0, 1, 2] };
    const ids = MG.sys.hunters.teamInfo(r.teamIds[n] !== undefined ? r.teamIds[n] : n).ids.filter(Boolean); // v261FIX：選隊生效（原硬用 formations 0-2）
    return ids.reduce((a, id) => {
      const h = st.hunters.find(x => x.id === id);
      return a + (h ? MG.sys.hunters.power(h) : 0);
    }, 0);
  }
  function genOpps() {
    const out = [];
    for (let i = 0; i < 3; i++) {
      out.push({
        name: "王者幻影第 " + (i + 1) + " 隊",
        power: Math.max(100, Math.round(teamPowerOf(i) * ANCHOR[i])),
        defeated: false
      });
    }
    return out;
  }
  function ensure() {
    const st = S();
    if (!st.royal) st.royal = { week: "", teamIds: [0, 1, 2], day: "", fights: 0, score: 0, tierScore: 0, streak: 0, opps: [], settled: false };
    const r = st.royal;
    if (!Array.isArray(r.teamIds) || !r.teamIds.length) r.teamIds = [0, 1, 2];
    const wk = weekKey();
    if (r.week !== wk) {
      // 跨週：未領分數自動結算（漏領不損失 — 討伐模式）
      { // v260FIX：settled 死旗標移除（防重複結算由 week 更新+score 歸零保證）
        const tier = r.tierScore || 0;
        const bonus = tier >= 15 ? RANK_BONUS[0] : tier >= 9 ? RANK_BONUS[1] : tier >= 3 ? RANK_BONUS[2] : 0; // v264FIX：分檔以勝場分計（保底不影響）
        r.lastWeek = { score: r.score || 0, bonus, coins: (r.score || 0) + bonus }; // v261 結算週報（零分週也覆寫 — 防舊報表殘留）
        if ((r.score || 0) > 0) { st.currencies.royalCoins = (st.currencies.royalCoins || 0) + r.score + bonus; }
        if (bonus > 0 && !(MG.sys.game && MG.sys.game.isSilent())) MG.ui.dom.toast("王者競技場結算：+ " + (r.score + bonus) + " 王者幣（含連勝分檔）", "good", "icon_honor");
      }
      r.week = wk; r.score = 0; r.tierScore = 0; r.streak = 0;
      r.shopRedeemed = {}; // v260FIX：週重置商店（原首週買過後永遠售罄 — 置換石斷供）
      r.opps = genOpps();
    }
    const today = U.today();
    if (r.day !== today) { r.day = today; r.fights = 0; }
    return r;
  }
  function reanchorIfNeeded(r) { // v261：teamIds 變更 → 幻影重錨（defeated 僅顯示用，重置安全）
    const sig = (r.teamIds || []).join(",");
    if (r.oppsSig !== sig) { r.opps = genOpps(); r.oppsSig = sig; }
  }
  function fightsLeft() { return Math.max(0, DAILY_FIGHTS - ensure().fights); }
  function unlocked() { return (S().kingdom.level || 1) >= 12; } // v261：王國 Lv12 解鎖 gate（changelog 承諾落地）
  function winChance(n) {
    const tp = teamPowerOf(n);
    const rec = (S().royal.opps[n] || {}).power || 1;
    if (tp <= 0) return 0;
    return U.clamp(tp / (tp + rec), 0.1, 0.98);
  }
  function challenge() {
    const st = S();
    const r = ensure();
    reanchorIfNeeded(r); // v261FIX：選隊變更重錨幻影
    if (r.fights >= DAILY_FIGHTS) return { ok: false, reason: "今日挑戰次數已用完（每日 5 次，明日重置）" };
    const results = [];
    let wins = 0;
    for (let i = 0; i < 3; i++) {
      const w = U.chance(winChance(i));
      if (w) { wins++; r.opps[i].defeated = true; }
      results.push({ team: i + 1, win: w, chance: Math.round(winChance(i) * 100) });
    }
    r.fights++;
    const won = wins >= 2;
    r.lastResults = { results, won }; // v261 戰果面板
    r.score += won ? 3 + r.streak : 1; // v264：敗場保底 1 分（參與有回報 — 原敗 0 每天 2.8 次白打）
    if (won) { r.tierScore = (r.tierScore || 0) + 3 + r.streak; r.streak++; } else r.streak = 0; // v264FIX：tierScore 僅計勝場分（分檔門檻用 — 保底不灌爆分檔）
    return { ok: true, results, won, score: r.score };
  }
  /* 王者商店（週限兌換） */
  function shopList() {
    ensure();
    const r = S().royal;
    return SHOP.map(it => Object.assign({}, it, { sold: r.shopRedeemed && r.shopRedeemed[it.id] || 0 }));
  }
  function shopBuy(id) {
    const st = S();
    const r = ensure();
    if (!r.shopRedeemed || typeof r.shopRedeemed !== "object") r.shopRedeemed = {};
    const def = SHOP.find(x => x.id === id);
    if (!def) return { ok: false, reason: "商品不存在" };
    const sold = r.shopRedeemed[id] || 0;
    if (sold >= def.stock) return { ok: false, reason: "本週已兌換完畢" };
    if ((st.currencies.royalCoins || 0) < def.price) return { ok: false, reason: "王者幣不足（需 " + def.price + "）" };
    st.currencies.royalCoins -= def.price;
    r.shopRedeemed[id] = sold + 1;
    if (def.swap) st.currencies.swapStone = (st.currencies.swapStone || 0) + def.swap;
    else if (def.badge) st.legendShards = (st.legendShards || 0) + def.badge;
    else if (def.t3) { st.mats.void = (st.mats.void || 0) + def.t3; st.mats.myth = (st.mats.myth || 0) + def.t3; }
    else if (def.book) st.currencies.book = (st.currencies.book || 0) + def.book;
    MG.core.audio.SFX.quest();
    return { ok: true, name: def.name };
  }
  return { DAILY_FIGHTS, ANCHOR, SHOP, weekKey, ensure, teamPowerOf, genOpps, reanchorIfNeeded, fightsLeft, winChance, challenge, shopList, shopBuy, unlocked }; // v261 UX 整合
})();
