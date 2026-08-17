(() => {
  const st = MG.game.state;
  const log = [];
  // 假時鐘: 讓 Date.now 與模擬時間同步
  let simNow = Date.now();
  const realDateNow = Date.now.bind(Date);
  Date.now = () => simNow;
  function recruitIf() {
    while (st.hunters.length < 5) {
      const c = MG.sys.hunters.recruitCost('gold');
      if (st.currencies.gold >= c.gold) MG.sys.hunters.doRecruit('gold');
      else break;
    }
  }
  function dispatchAll() {
    if (!(st.hunt.dispatchIds || []).length && st.hunters.length) {
      st.hunt.dispatchIds = st.hunters.slice(0, 5).map(h => h.id);
    }
  }
  function sample(sec) {
    return { sec, kills: st.stats.kills, gold: st.currencies.gold, goldEarned: st.stats.goldEarned, maxStage: st.stats.maxStage, hunters: st.hunters.map(h => h.cls + 'L' + h.level), wipeStreak: st.hunt.wipeStreak || 0, ids: (st.hunt.dispatchIds||[]).length, rest: st.hunt.restUntil > simNow, restLeft: Math.max(0, Math.round((st.hunt.restUntil - simNow)/1000)) };
  }
  dispatchAll();
  MG.sys.game.tick(simNow);
  log.push({ t: 'start', ...sample(0) });
  for (let s = 60; s <= 1800; s += 60) {
    simNow += 60000;
    MG.sys.game.tick(simNow);
    recruitIf();
    dispatchAll();
    if (s % 300 === 0) log.push({ t: s + 's', ...sample(s) });
  }
  Date.now = realDateNow;
  return log;
})()