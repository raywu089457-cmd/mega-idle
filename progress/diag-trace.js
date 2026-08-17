(() => {
  const st = MG.game.state;
  const log = [];
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
  function fillFormation() {
    const ids = st.hunters.slice(0, 5).map(h => h.id);
    for (let i = 0; i < 5; i++) st.formation[i] = ids[i] || null;
  }
  function dispatchAll() {
    if (!(st.hunt.dispatchIds || []).length && st.hunters.length) {
      st.hunt.dispatchIds = st.hunters.slice(0, 5).map(h => h.id);
    }
  }
  function dump(sec, label) {
    const F = MG.sys.battle.get();
    const events = (F.events || []).slice(-6).map(e => e.type + (e.boss ? '!B' : '') + (e.fallback ? '->' + (e.fallback.type||'') : ''));
    log.push({ label, sec, stage: st.hunt.stage, phase: F.phase, kills: st.stats.kills, gold: st.currencies.gold, ids: (st.hunt.dispatchIds||[]).length, rest: st.hunt.restUntil > simNow ? Math.round((st.hunt.restUntil - simNow)/1000) : 0, ws: st.hunt.wipeStreak, mhp: F.m ? Math.round(F.hp) : null, events });
  }
  dispatchAll();
  MG.sys.game.tick(simNow);
  dump(0, 'start');
  for (let s = 30; s <= 300; s += 30) {
    simNow += 30000;
    MG.sys.game.tick(simNow);
    recruitIf(); fillFormation(); dispatchAll();
    dump(s, 't' + s);
  }
  Date.now = realDateNow;
  return log;
})()