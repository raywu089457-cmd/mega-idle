/* 放置王國 MEGA IDLE — 限時活動（v152，slice B5 延伸）
   市面放置英雄標準活動設計：每週輪換活動、活動點數、里程碑 + 活動商店。
   週期與每週任務/競技場同步（ISO 週，週一 00:00 重置）：
   - 奇數週「狩獵祭」：擊殺魔物 15% 掉落活動點數
   - 偶數週「討伐祭」：擊敗 BOSS 必得活動點數 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.events = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const HUNT_DROP = 0.15; // 狩獵祭：每殺掉點機率

  const MILESTONES = [
    { pts: 30, r: { gold: 50000, gems: 30 } },
    { pts: 80, r: { gems: 60, honor: 20 } },
    { pts: 150, r: { ticket: 2, gems: 100 } },
    { pts: 250, r: { gems: 200, ticket: 2, honor: 50 } }
  ];
  // 活動商店（點數兌換，每活動限額；get 走 grantReward 格式）
  const SHOP = [
    { id: "ticket", name: "招募券", icon: "icon_ticket", cost: 40, stock: 3, get: { ticket: 1 } },
    { id: "gems", name: "鑽石 ×50", icon: "icon_gem", cost: 25, stock: 5, get: { gems: 50 } },
    { id: "pot_atk", name: "攻擊靈藥", icon: "icon_pot_atk", cost: 15, stock: 2, get: { pot: "atk" } },
    { id: "pot_hp", name: "生命藥水 ×3", icon: "icon_pot_hp", cost: 10, stock: 5, get: { pot: "hp", qty: 3 } },
    { id: "mats", name: "素材包（九種素材各 ×5）", icon: "mat_crystal", cost: 20, stock: 3, get: { mats: true } },
    { id: "hourglass", name: "加速沙漏", icon: "icon_hourglass", cost: 15, stock: 2, get: { hourglass: 1 } },
    { id: "art_blood", name: "神器：嗜血獠牙", icon: "icon_dagger", cost: 80, stock: 1, get: { art: "blood_fang" } }, // v158
    { id: "badge_shard", name: "傳說徽章碎片", icon: "icon_honor", cost: 30, stock: 1, get: { badgeShard: 1 } } // v210
  ];

  function weekKey() {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const wk = Math.ceil((((d - onejan) / 864e5) + onejan.getDay() + 1) / 7);
    return d.getFullYear() + "-W" + String(wk).padStart(2, "0");
  }
  function kindName(kind) { return kind === "boss" ? "討伐祭" : "狩獵祭"; }
  function kindDesc(kind) { return kind === "boss" ? "擊敗 BOSS 必得 1 點活動點數" : "擊殺魔物有 15% 機率獲得 1 點活動點數"; }

  /* 週期檢查：換週時重置點數/兌換/里程碑並通知 */
  function ensure() {
    const st = S();
    if (!st.events) st.events = { week: "", kind: "", pts: 0, redeemed: {}, milestones: {} };
    const ev = st.events;
    const wk = weekKey();
    if (ev.week !== wk) {
      const wkNum = parseInt(wk.split("-W")[1], 10);
      const kind = wkNum % 2 === 1 ? "hunt" : "boss";
      ev.week = wk;
      ev.kind = kind;
      ev.pts = 0;
      ev.redeemed = {};
      ev.milestones = {};
      if (ev.week) MG.ui.dom.toast("新活動開始：「" + kindName(kind) + "」！", "good", "icon_chest");
    }
    return ev;
  }
  function current() {
    const ev = ensure();
    return { kind: ev.kind, name: kindName(ev.kind), desc: kindDesc(ev.kind), pts: ev.pts || 0 };
  }
  /* 擊殺掛鉤（loot.applyDrops 呼叫）：狩獵祭機率掉點、討伐祭 BOSS 必得 */
  function onKill(m) {
    const ev = ensure();
    if (!ev || !ev.kind) return 0;
    let gained = 0;
    if (ev.kind === "hunt") {
      if (U.chance(HUNT_DROP)) gained = 1;
    } else if (ev.kind === "boss" && m && m.boss) {
      gained = 1;
    }
    if (gained) ev.pts = (ev.pts || 0) + gained;
    return gained;
  }
  function redeem(id) {
    const ev = ensure();
    const st = S();
    const def = SHOP.find(x => x.id === id);
    if (!def) return { ok: false, reason: "商品不存在" };
    const bought = ev.redeemed[id] || 0;
    if (bought >= def.stock) return { ok: false, reason: "本活動已兌換完畢" };
    if ((ev.pts || 0) < def.cost) return { ok: false, reason: "活動點數不足（需 " + def.cost + " 點）" };
    ev.pts -= def.cost;
    ev.redeemed[id] = bought + 1;
    if (def.get.mats) {
      for (const k in MG.config.MATS) st.mats[k] = (st.mats[k] || 0) + 5;
    } else if (def.get.badgeShard) {
      // v210 傳說徽章碎片（非貨幣 — 直接入庫）
      st.legendShards = (st.legendShards || 0) + def.get.badgeShard;
    } else {
      const q = def.get.qty || 1;
      for (let i = 0; i < q; i++) MG.sys.meta.grantReward(def.get);
    }
    MG.core.audio.SFX.quest();
    return { ok: true, name: def.name };
  }
  function claimMilestone(n, silent) {
    const ev = ensure();
    const st = S();
    const def = MILESTONES.find(x => x.pts === n);
    if (!def || ev.milestones[n]) return false;
    if ((ev.pts || 0) < n) return false;
    ev.milestones[n] = true;
    MG.sys.meta.grantReward(def.r);
    if (!silent) MG.core.audio.SFX.quest(); // v208：批量 silent
    return true;
  }
  /* v208 QoL：活動里程碑全部領取（單一音效） */
  function claimAllMilestones() {
    let n = 0;
    for (const ms of MILESTONES) if (claimMilestone(ms.pts, true)) n++;
    if (n) MG.core.audio.SFX.quest();
    return n;
  }
  return { weekKey, ensure, current, onKill, redeem, claimAllMilestones, claimMilestone, MILESTONES, SHOP, kindName, kindDesc };
})();
