/* 放置王國 MEGA IDLE — 榮譽商店（v205，對位放置奇兵榮譽兌換）
   榮譽在 3 條榮譽強化滿級（總額 1550）後無消耗點 → 商店提供每週回訪與貨幣回春：
   每週限量商品（ISO 週重置），價格數百榮譽，全買約需 3-4 週產出（不變印鈔機）。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.honorshop = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const ITEMS = [
    { id: "book", name: "技能書 ×3", icon: "icon_book", price: 300, stock: 1, get: { book: 3 } },
    { id: "ticket", name: "招募券 ×3", icon: "icon_ticket", price: 250, stock: 1, get: { ticket: 3 } },
    { id: "mats", name: "素材包（九種各 ×5）", icon: "mat_crystal", price: 150, stock: 1, mats: true, qty: 5 },
    { id: "pots", name: "靈藥三件套", icon: "item_pot_atk", price: 120, stock: 1, pots: true },
    { id: "goldbag", name: "金幣寶袋", icon: "item_goldbag", price: 200, stock: 2, goldbag: true }
  ];
  function weekKey() {
    // v205FIX：以本週一為錨分桶（原 SO 公式在週日切換＋跨年一週內多次切換 → 每週限量可重複兌換）
    const d = new Date();
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return monday.getFullYear() + "-W" + Math.floor((monday - new Date(monday.getFullYear(), 0, 1)) / 864e5 / 7 + 1);
  }
  function ensure() {
    const st = S();
    if (!st.honorShop) st.honorShop = { week: "", redeemed: {} };
    const hs = st.honorShop;
    if (!hs.redeemed || typeof hs.redeemed !== "object") hs.redeemed = {};
    const wk = weekKey();
    if (hs.week !== wk) { hs.week = wk; hs.redeemed = {}; }
    return hs;
  }
  function goldbagGold() {
    const st = S();
    return Math.floor(5000 * Math.pow(1.35, Math.max(1, st.kingdom.level) - 1)); // v244：1.6→1.35 錨對齊（係數 ×10 保留便利兌換價值）
  }
  function list() {
    ensure();
    const hs = S().honorShop;
    return ITEMS.map(it => Object.assign({}, it, { sold: hs.redeemed[it.id] || 0 }));
  }
  function redeem(id) {
    const st = S();
    const hs = ensure();
    const def = ITEMS.find(x => x.id === id);
    if (!def) return { ok: false, reason: "商品不存在" };
    const sold = hs.redeemed[id] || 0;
    if (sold >= def.stock) return { ok: false, reason: "本週已兌換完畢" };
    if ((st.currencies.honor || 0) < def.price) return { ok: false, reason: "榮譽不足（需 " + def.price + "）" };
    st.currencies.honor -= def.price;
    hs.redeemed[id] = sold + 1;
    if (def.mats) {
      for (const k in MG.config.MATS) st.mats[k] = (st.mats[k] || 0) + def.qty;
    } else if (def.pots) {
      for (const p of ["atk", "gold", "exp"]) {
        const have = st.inventory.items.find(i => i.defId === "item_pot_" + p);
        if (have) have.qty = (have.qty || 1) + 1;
        else st.inventory.items.push({ uid: U.uid(), defId: "item_pot_" + p, tier: 1, qty: 1, gems: [], enhance: 0 });
      }
    } else if (def.goldbag) {
      MG.sys.game.addGold(goldbagGold(), "榮譽商店金幣寶袋"); // v205FIX：走 addGold（goldEarned/成就/週任計入）
    } else if (def.get.book) {
      st.currencies.book = (st.currencies.book || 0) + def.get.book;
    } else {
      MG.sys.meta.grantReward(def.get);
    }
    MG.core.audio.SFX.quest();
    return { ok: true, name: def.name };
  }
  return { ITEMS, weekKey, ensure, list, redeem, goldbagGold };
})();
