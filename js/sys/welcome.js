/* 放置王國 MEGA IDLE — 七日豪禮（v162，slice B5 延伸）
   市面放置英雄標準新手活動：建號日起每日解鎖一項任務，獎勵逐日加碼，
   第 7 天最終獎勵為「自選傳說英雄」。
   解鎖依建號天數（無嚴格期限 — 回鍋玩家仍可領取，友善設計）。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.welcome = (function () {
  const U = MG.util;
  const S = () => MG.game.state;

  const QUESTS = [
    { id: "d1", day: 0, name: "擊敗 50 隻魔物", req: { type: "kill", target: 50 }, reward: { gold: 5000, gems: 20 } },
    { id: "d2", day: 1, name: "招募 3 名英雄", req: { type: "recruit", target: 3 }, reward: { ticket: 3 } },
    { id: "d3", day: 2, name: "強化裝備 3 次", req: { type: "enhance", target: 3 }, reward: { gold: 30000, gems: 30 } },
    { id: "d4", day: 3, name: "推進 15 個關卡", req: { type: "stage", target: 15 }, reward: { gems: 50, ticket: 2 } },
    { id: "d5", day: 4, name: "英雄突破 1 次", req: { type: "promote", target: 1 }, reward: { gems: 100 } },
    { id: "d6", day: 5, name: "擊敗 5 隻 BOSS", req: { type: "boss", target: 5 }, reward: { ticket: 5 } },
    { id: "d7", day: 6, name: "英雄升星 1 次", req: { type: "starup", target: 1 }, reward: { legend: true } }
  ];

  function ensure() {
    const st = S();
    if (!st.welcome) st.welcome = { claimed: {} };
    if (!st.welcome.claimed || typeof st.welcome.claimed !== "object") st.welcome.claimed = {};
    return st.welcome;
  }
  /* 已解鎖天數（建號起算，0-6） */
  function unlockedDays() {
    const st = S();
    const days = Math.floor((Date.now() - (st.created || Date.now())) / 864e5);
    return Math.max(0, Math.min(6, days));
  }
  function list() {
    const w = ensure();
    const unlocked = unlockedDays();
    return QUESTS.map(q => Object.assign({}, q, {
      unlocked: q.day <= unlocked,
      claimed: !!w.claimed[q.id],
      cur: Math.min(q.req.target, MG.sys.meta.questCur(q.req))
    }));
  }
  function canClaim(id) {
    const q = QUESTS.find(x => x.id === id);
    if (!q) return false;
    const w = ensure();
    if (w.claimed[id]) return false;
    if (q.day > unlockedDays()) return false;
    return MG.sys.meta.questCur(q.req) >= q.req.target;
  }
  /* 領取（第 7 天獎勵為自選傳說 — 由 UI 開啟選角視窗，此處僅標記） */
  function claim(id) {
    const w = ensure();
    const q = QUESTS.find(x => x.id === id);
    if (!q || w.claimed[id]) return { ok: false, reason: "無法領取" };
    if (q.day > unlockedDays()) return { ok: false, reason: "第 " + (q.day + 1) + " 天解鎖，明天再來" };
    if (MG.sys.meta.questCur(q.req) < q.req.target) return { ok: false, reason: "目標尚未達成" };
    // v218FIX：d7 傳說不在此標記 — 選角完成（createLegend）後才寫 claimed（關窗/名冊滿不遺失傳說）
    if (q.reward.legend) {
      MG.core.audio.SFX.quest();
      return { ok: true, legend: true };
    }
    w.claimed[id] = true;
    MG.sys.meta.grantReward(q.reward);
    MG.core.audio.SFX.quest();
    return { ok: true };
  }
  /* v218 QoL：全部領取（d1-d6 直接領；d7 傳說保留選角 — 回傳 legend 旗標由 UI 開窗，選完才標記） */
  function claimAll() {
    const w = ensure();
    let n = 0, legend = false;
    for (const q of QUESTS) {
      if (w.claimed[q.id] || q.day > unlockedDays()) continue;
      if (MG.sys.meta.questCur(q.req) < q.req.target) continue;
      if (q.reward.legend) { legend = true; continue; }
      w.claimed[q.id] = true;
      MG.sys.meta.grantReward(q.reward);
      n++;
    }
    if (n || legend) MG.core.audio.SFX.quest();
    return { n, legend };
  }
  /* 自選傳說：建立英雄（名冊滿則失敗，UI 提示）；v218FIX：成功建立才標記 d7 已領（關窗不遺失） */
  function createLegend(lid) {
    const st = S();
    const w = ensure();
    if (w.claimed.d7) return { ok: false, reason: "已領取過傳說英雄" };
    const ld = MG.data.hunters.LEGENDS[lid];
    if (!ld) return { ok: false, reason: "傳說英雄不存在" };
    const cap = MG.sys.buildings.effects().rosterCap;
    if (st.hunters.length >= cap) return { ok: false, reason: "名冊已滿（" + cap + " 名）— 先遣散英雄再來" };
    const h = MG.sys.hunters.create(ld.cls, 6);
    h.legend = lid;
    h.name = ld.name;
    st.hunters.push(h);
    w.claimed.d7 = true; // v218FIX：選角完成才標記
    st.stats.recruits++;
    MG.sys.meta.bump("recruit", 1);
    MG.core.audio.SFX.recruit();
    MG.ui.dom.toast("傳說英雄「" + ld.name + "」加入王國！", "good", "icon_recruit");
    return { ok: true, name: ld.name };
  }
  /* v194 回歸獎勵：離開 ≥72 小時回歸觸發（放置奇兵回歸禮設計）
     分檔：3-6 天／7-13 天／14+ 天；每檔只領一次（returnTier 記錄），金幣量 = 2/4/8 小時掛機收入
     v654：peekReturnGift 只讀預覽；returnGift 點擊才入帳（與離線 apply 對稱，防未點即入庫） */
  function peekReturnGift() {
    const st = S();
    const w = ensure();
    const awayMs = Date.now() - (st.lastSeen || Date.now());
    const days = Math.floor(awayMs / 864e5);
    if (days < 3) return null;
    const tier = days >= 14 ? 3 : days >= 7 ? 2 : 1;
    if ((w.returnTier || 0) >= tier) return null;
    const rates = (MG.sys.battle && MG.sys.battle.rates) ? MG.sys.battle.rates() : { goldPerSec: 0 };
    const gold = Math.floor((rates.goldPerSec || 0) * (tier === 1 ? 7200 : tier === 2 ? 14400 : 28800));
    const gift = tier === 1
      ? { gold, gems: 100, ticket: 2, book: 10 }
      : tier === 2
        ? { gold, gems: 250, ticket: 5, book: 25, potAtk: 1, potGold: 1, potExp: 1 }
        : { gold: gold * 2, gems: 500, ticket: 10, book: 50, potAtk: 1, potGold: 1, potExp: 1, hourglass: 2 };
    return { tier, days, gift };
  }
  function returnGift(precomputed) {
    const peeked = precomputed || peekReturnGift();
    if (!peeked) return null;
    const st = S();
    const w = ensure();
    const gd = peeked.gift;
    w.returnTier = peeked.tier;
    w.lastReturn = U.today();
    for (const k in gd) {
      const v = gd[k];
      if (k === "gold") st.currencies.gold += v;
      else if (k.startsWith("pot")) st.inventory.items.push({ uid: U.uid(), defId: "item_pot_" + k.slice(3), tier: 1, qty: 1, gems: [], enhance: 0 });
      else if (k === "hourglass") st.inventory.items.push({ uid: U.uid(), defId: "item_hourglass", tier: 1, qty: v, gems: [], enhance: 0 });
      else st.currencies[k] = (st.currencies[k] || 0) + v;
    }
    return peeked;
  }
  return { QUESTS, ensure, unlockedDays, list, canClaim, claim, claimAll, createLegend, returnGift, peekReturnGift };
})();
