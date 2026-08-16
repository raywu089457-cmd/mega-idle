/* 放置王國 MEGA IDLE — dev: 開發者模式（設定頁「開發者功能」— 作弊按鈕＋平衡拉桿）
   設計：settings.dev 持久化；on=false 時 balance()/cheats() 一律回傳預設值（正常平衡），
   拉桿與作弊只影響「開啟」的遊戲存檔；所有數值勾掛在既有公式的聚合點（見各檔案註解）。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.dev = (function () {
  const S = () => MG.game.state;
  const DEFAULTS = {
    on: false,
    cheats: { instantKill: false, godMode: false },
    balance: {
      goldMul: 1,        // 金幣獲取（線上掉落）
      expMul: 1,         // 英雄經驗獲取
      dropMul: 1,        // 裝備/寶石/技能書/藥水/BOSS 掉落率
      matMul: 1,         // 素材掉落率
      monsterHp: 1,      // 魔物血量
      monsterAtk: 1,     // 魔物攻擊
      heroAtk: 1,        // 英雄攻擊（含裝備/加成後）
      heroDef: 1,        // 英雄防禦
      heroHp: 1,         // 英雄生命
      offlineRate: 1,    // 離線收益倍率（疊乘既有 1.2×）
      offlineCapH: 12,   // 離線結算時數上限（小時）
      costMul: 1,        // 金幣成本（訓練/強化/招募）
      trainExpMul: 1     // 訓練獲得經驗
    }
  };
  /* 確保 settings.dev 結構齊全（舊檔淺合併補缺）
     注意：原地合併（不換物件）— UI 閉包與 state 共享同一參考；
     若每次呼叫重建物件，tick 的 balance() 呼叫會把 UI 抓到的 d 變成孤兒（開關失聯）。 */
  function ensure() {
    const st = S();
    if (!st.settings.dev || typeof st.settings.dev !== "object") st.settings.dev = {};
    const d = st.settings.dev;
    for (const k in DEFAULTS) if (d[k] === undefined) d[k] = DEFAULTS[k];
    if (!d.cheats || typeof d.cheats !== "object") d.cheats = {};
    for (const k in DEFAULTS.cheats) if (d.cheats[k] === undefined) d.cheats[k] = DEFAULTS.cheats[k];
    if (!d.balance || typeof d.balance !== "object") d.balance = {};
    for (const k in DEFAULTS.balance) if (d.balance[k] === undefined) d.balance[k] = DEFAULTS.balance[k];
    return d;
  }
  /* 生效值：開發者模式關閉 → 正常平衡（全 1／原上限） */
  function balance() { const d = ensure(); return d.on ? d.balance : DEFAULTS.balance; }
  function cheats() { const d = ensure(); return d.on ? d.cheats : DEFAULTS.cheats; }

  /* ---- 作弊動作（直接改 state + 存檔） ---- */
  function grant(what, n) {
    const st = S();
    if (what === "gold") MG.sys.game.addGold(n, "開發者");
    else if (what === "gems") st.currencies.gems += n;
    else if (what === "honor") st.currencies.honor += n;
    else if (what === "ticket") st.currencies.ticket = (st.currencies.ticket || 0) + n;
    else if (what === "book") st.currencies.book = (st.currencies.book || 0) + n;
    else if (what === "mats") for (const k in st.mats) st.mats[k] = (st.mats[k] || 0) + n;
    MG.core.save.save();
  }
  function healAll() {
    for (const h of S().hunters) {
      const m = MG.sys.hunters.effectiveStats(h);
      h.hp = Math.round(m.hp);
      h.mp = Math.round(m.mp);
    }
    MG.core.save.save();
  }
  /* 免費招募：暫時墊款走正式招募路徑（保底/圖鑑/統計照常），結束還原鑽石 */
  function spawnHeroes(n) {
    const st = S();
    const cost = MG.sys.hunters.recruitCost("gem");
    const tmp = st.currencies.gems;
    st.currencies.gems += (cost.gem || 0) * n;
    let ok = 0;
    for (let i = 0; i < n; i++) { if (!MG.sys.hunters.doRecruit("gem", true)) break; ok++; }
    st.currencies.gems = tmp;
    MG.core.save.save();
    return ok;
  }
  function unlockRegions() {
    const st = S();
    st.stats.maxRegionReached = Math.max(st.stats.maxRegionReached || 0, 9);
    MG.core.save.save();
  }
  function levelUpKingdom(n) {
    for (let i = 0; i < n; i++) MG.sys.game.addKingdomExp(MG.sys.game.kingdomExpNeed(S().kingdom.level));
    MG.core.save.save();
  }
  function resetBalance() {
    const d = ensure();
    for (const k in DEFAULTS.balance) d.balance[k] = DEFAULTS.balance[k]; // 原地重設（保持參考）
    MG.core.save.save();
  }
  return { DEFAULTS, ensure, balance, cheats, grant, healAll, spawnHeroes, unlockRegions, levelUpKingdom, resetBalance };
})();
