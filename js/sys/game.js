/* 放置王國 MEGA IDLE — game state, main loop, economy glue (core engine, owned by Main) */
"use strict";
MG.game = MG.game || {};
MG.sys = MG.sys || {};
MG.sys.game = (function () {
  const U = MG.util;
  const S = () => MG.game.state;

  function init() {
    MG.game.state = MG.core.save.load() || MG.core.save.newState();
    MG.sys.meta.tick();
    MG.sys.battle.reset();
  }
  function afterReset() {
    MG.sys.battle.reset();
    MG.sys.meta.tick();
    if (MG.ui && MG.ui.screens) MG.ui.screens.refreshAll();
  }
  function addGold(n, why) {
    const st = S();
    st.currencies.gold = Math.max(0, st.currencies.gold + n);
    if (n > 0) st.stats.goldEarned += n;
  }
  function kingdomExpNeed(lvl) { return Math.floor(80 * Math.pow(lvl, 1.5)); }
  function addKingdomExp(n) {
    const st = S();
    if (n <= 0) return;
    st.kingdom.exp += n;
    let ups = 0;
    while (st.kingdom.exp >= kingdomExpNeed(st.kingdom.level) && st.kingdom.level < 50) {
      st.kingdom.exp -= kingdomExpNeed(st.kingdom.level);
      st.kingdom.level++; ups++;
    }
    if (ups) {
      MG.ui.dom.toast("王國升級！目前等級 " + st.kingdom.level, "gold", "icon_castle");
      MG.core.audio.SFX.levelup();
    }
  }
  let lastTick = 0;
  function tick(now) {
    const st = S();
    if (!lastTick) lastTick = now;
    let dt = (now - lastTick) / 1000;
    lastTick = now;
    dt = Math.min(dt, 1.5);
    st.stats.playSec += dt;
    // buff expiry
    const n = Date.now();
    for (const k of ["potAtk", "potGold", "potExp"]) if (st.buffs[k] && st.buffs[k] < n) st.buffs[k] = 0;
    MG.sys.meta.tick();
    // 流浪英雄（生成/心情/消費/狩獵）
    if (MG.sys.wanderers) MG.sys.wanderers.tick(dt);
    // hunt sim — 僅在玩家派遣隊伍時運行（未派遣 = 獵人城內待機，不主動戰鬥）
    if (st.hunt && (st.hunt.region !== undefined) && (st.hunt.dispatchIds || []).length > 0) {
      let mult = st.hunt.speed || 1;
      if (st.buffs.boostUntil > n) mult *= 5;
      if (mult > 0) MG.sys.battle.step(dt * mult);
    }
  }
  function log(msg, icon) {
    const st = S();
    st.log.unshift({ msg, icon: icon || "", t: Date.now() });
    if (st.log.length > 40) st.log.length = 40;
  }
  return { init, afterReset, addGold, kingdomExpNeed, addKingdomExp, tick, log };
})();
