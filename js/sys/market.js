/* 放置王國 MEGA IDLE — 每日特惠（v159，slice B5 延伸）
   市面放置英雄標準每日商店：從貨池確定性抽取 4 件折扣商品（同日相同、防刷新洗牌），
   各自限購次數，午夜重置。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.market = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const DEAL_COUNT = 4;

  const POOL = [
    { id: "d_ticket", name: "招募券 ×1", icon: "icon_ticket", base: 10000, price: 7500, stock: 1, get: { ticket: 1 } },
    { id: "d_hp", name: "生命藥水 ×3", icon: "item_pot_hp", base: 2400, price: 1800, stock: 2, get: { pot: "hp", qty: 3 } },
    { id: "d_mp", name: "魔力藥水 ×3", icon: "item_pot_mp", base: 2400, price: 1800, stock: 2, get: { pot: "mp", qty: 3 } },
    { id: "d_mats", name: "素材包（九種各 ×3）", icon: "mat_crystal", base: 9000, price: 7000, stock: 2, get: { mats: true, qty: 3 } },
    { id: "d_pot_atk", name: "攻擊靈藥", icon: "item_pot_atk", base: 15000, price: 12000, stock: 1, get: { pot: "atk" } },
    { id: "d_pot_exp", name: "智慧靈藥", icon: "item_pot_exp", base: 15000, price: 12000, stock: 1, get: { pot: "exp" } },
    { id: "d_hourglass", name: "加速沙漏", icon: "item_hourglass", base: 10000, price: 8000, stock: 2, get: { hourglass: 1 } },
    { id: "d_book", name: "技能書 ×2", icon: "icon_book", base: 20000, price: 16000, stock: 2, get: { book: 2 } }
  ];

  function ensure() {
    const st = S();
    if (!st.market) st.market = { day: "", bought: {} };
    const today = U.today();
    if (st.market.day !== today) { st.market.day = today; st.market.bought = {}; }
    return st.market;
  }
  /* 確定性偽隨機（以日期為種子 → 同日貨品固定，防刷新洗牌）
     FNV-1a + splitmix 終結器：相近日期字串（僅差尾字元）也要產生完全不同的種子 */
  function seeded(day) {
    let h = 2166136261;
    for (let i = 0; i < day.length; i++) {
      h ^= day.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h = (h ^ (h >>> 16)) >>> 0;
    h = Math.imul(h, 0x85ebca6b) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0;
    h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    return function () { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
  }
  /* v184/v229 動態定價：特惠價格隨王國等級成長 — 後期金幣通膨下維持商品邊際價值
     v652：1.15^min(kl-1,18) 軟封頂 — 原無封頂在 kl≥25 達 ≥1h 農場金/件,日特惠 ROI 崩、消費錨失效;
     商會傳統折扣仍疊乘;週限兌換另錨不動 */
  function priceOf(def) {
    const st = S();
    const klDelta = Math.min(18, Math.max(0, (st.kingdom.level || 1) - 1));
    let p = def.price * Math.pow(1.15, klDelta);
    if (MG.sys.meta && MG.sys.meta.traditionEffects) p *= (1 - MG.sys.meta.traditionEffects().commerce);
    return Math.floor(p);
  }
  /* 今日 4 件特惠（含已購次數與動態價格） */
  function deals() {
    ensure();
    const st = S();
    const rnd = seeded(st.market.day);
    const pool = POOL.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, DEAL_COUNT).map(d => Object.assign({}, d, { price: priceOf(d), sold: st.market.bought[d.id] || 0 }));
  }
  function buy(id) {
    ensure();
    const st = S();
    const def = deals().find(d => d.id === id);
    if (!def) return { ok: false, reason: "今日沒有此特惠" };
    if (def.sold >= def.stock) return { ok: false, reason: "本日已售罄" };
    // v184：價格已含動態倍率與商會折扣（deals() 單一來源）
    const price = def.price;
    if (st.currencies.gold < price) return { ok: false, reason: "金幣不足（需 " + U.fmt(price) + "）" };
    st.currencies.gold -= price;
    st.market.bought[id] = def.sold + 1;
    if (def.get.mats) {
      const q = def.get.qty || 1;
      for (const k in MG.config.MATS) st.mats[k] = (st.mats[k] || 0) + q;
    } else {
      const q = def.get.qty || 1;
      for (let i = 0; i < q; i++) MG.sys.meta.grantReward(def.get);
    }
    MG.core.audio.SFX.buy();
    return { ok: true, name: def.name, price: def.price };
  }
  /* v259 市場週限兌換（金幣週常消耗端 — 98B 遠古完成後金幣目標斷點修復；honorshop 模式克隆）
     價格錨 U = 5000×1.35^(kl-1)（與古書回收/寶袋同錨 — 零 shock 不漲現有特惠價）；
     兌換效率 ≤ 深淵農取 1/20（純便利稅非印鈔）；商會傳統折扣沿用 */
  const WEEKLY_DEALS = [
    { id: "wmat", name: "素材包 ×20（九種）", icon: "mat_crystal", mul: 1.3, stock: 5, mats: true, qty: 20 }, // v259FIX：mul 1.3（原 0.4 在 kl1-4 買 2000 賣 6300 印鈔套利）
    { id: "wt3", name: "虛空/神話碎片 ×2", icon: "mat_void", mul: 0.8, stock: 5, t3: 2 },
    { id: "wbook", name: "技能書 ×10", icon: "icon_book", mul: 1, stock: 3, book: 10 },
    { id: "wticket", name: "招募券 ×1", icon: "icon_ticket", mul: 1.2, stock: 3, ticket: 1 },
    { id: "wbadge", name: "傳說徽章碎片 ×1", icon: "icon_honor", mul: 2, stock: 1, badge: 1 } // v259FIX：icon_honor（icon_badge 不存在）+ stock 1（徽章長線目標保留）
  ];
  function goldWeeklyEnsure() {
    const st = S();
    if (!st.goldWeek) st.goldWeek = { week: "", redeemed: {} };
    const g = st.goldWeek;
    if (!g.redeemed || typeof g.redeemed !== "object") g.redeemed = {};
    const wk = MG.sys.honorshop.weekKey();
    if (g.week !== wk) { g.week = wk; g.redeemed = {}; }
    return g;
  }
  function goldUnit() {
    return Math.floor(5000 * Math.pow(1.35, Math.max(1, S().kingdom.level) - 1));
  }
  /* v259FIX：商會傳統折扣共用（priceOf 同款 — 週限兌換價格與 UI 同源） */
  function goldPrice(def) {
    let p = goldUnit() * def.mul;
    if (MG.sys.meta && MG.sys.meta.traditionEffects) p *= (1 - MG.sys.meta.traditionEffects().commerce);
    return Math.floor(p);
  }
  function goldWeeklyList() {
    goldWeeklyEnsure();
    const g = S().goldWeek;
    return WEEKLY_DEALS.map(it => Object.assign({}, it, {
      price: goldPrice(it), // v259FIX：套商會折扣
      sold: g.redeemed[it.id] || 0
    }));
  }
  function goldWeeklyBuy(id) {
    const st = S();
    const g = goldWeeklyEnsure();
    const def = WEEKLY_DEALS.find(x => x.id === id);
    if (!def) return { ok: false, reason: "商品不存在" };
    const sold = g.redeemed[id] || 0;
    if (sold >= def.stock) return { ok: false, reason: "本週已兌換完畢" };
    const price = goldPrice(def); // v259FIX：套商會折扣（與 UI 同源）
    if (st.currencies.gold < price) return { ok: false, reason: "金幣不足（需 " + U.fmt(price) + "）" };
    st.currencies.gold -= price;
    g.redeemed[id] = sold + 1;
    if (def.mats) {
      for (const k in MG.config.MATS) st.mats[k] = (st.mats[k] || 0) + def.qty;
    } else if (def.t3) {
      st.mats.void = (st.mats.void || 0) + def.t3;
      st.mats.myth = (st.mats.myth || 0) + def.t3;
    } else if (def.book) {
      st.currencies.book = (st.currencies.book || 0) + def.book;
    } else if (def.ticket) {
      st.currencies.ticket = (st.currencies.ticket || 0) + def.ticket;
    } else if (def.badge) {
      st.legendShards = (st.legendShards || 0) + def.badge; // v259FIX：徽章碎片欄位 legendShards（非 legendBadgeShards）
    }
    MG.core.audio.SFX.buy(); // v259FIX：市場購買音效（原 quest 遺留）
    return { ok: true, name: def.name, price };
  }
  return { POOL, DEAL_COUNT, ensure, deals, buy, WEEKLY_DEALS, goldUnit, goldPrice, goldWeeklyList, goldWeeklyBuy, goldWeeklyEnsure }; // v259 週限兌換
})();
