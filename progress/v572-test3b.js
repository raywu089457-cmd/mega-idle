(() => {
  // v572 驗證③B: reducedMotion=true 下引擎退守偵測＋自動恢復照常（純邏輯路徑）
  const st = MG.game.state;
  const out = {};
  const origSave = MG.core.save.save;
  MG.core.save.save = () => {};
  let simNow = Date.now();
  const realDateNow = Date.now.bind(Date);
  Date.now = () => simNow;

  st.settings.reducedMotion = true;
  // 組一隊弱隊（1 人 ★1 L1 — 保證卡牆）
  const h = MG.sys.hunters.create('sword', 1);
  h.id = 't0';
  st.hunters = [h];
  st.formation = ['t0', null, null, null, null];
  st.hunt.region = 0; st.hunt.stage = 1; st.hunt.difficulty = 0;
  st.hunt.autoAdvance = true; st.hunt.autoDispatch = true;
  st.hunt.wipeStreak = 0;
  st.hunt.dispatchIds = ['t0'];
  st.hunt.restUntil = 0;
  MG.sys.battle.reset();

  // 步進到卡牆（弱隊 r0 首領牆）— 最多 15 分鐘
  let parked = null;
  for (let s = 30; s <= 900 && !parked; s += 30) {
    simNow += 30000;
    MG.sys.game.tick(simNow);
    if (st.hunt.autoAdvance === false && st.hunt.aaPark) {
      parked = { at: s, aaPark: JSON.parse(JSON.stringify(st.hunt.aaPark)), stage: st.hunt.stage, ws: st.hunt.wipeStreak || 0 };
    }
  }
  out.parked = parked;
  // 練強 → 自動恢復（rm 下照常）
  if (parked) {
    st.hunters[0].level = 25; st.hunters[0].exp = 0;
    st.hunters[0].hp = MG.sys.hunters.effectiveStats(st.hunters[0]).hp;
    st.hunters[0].mp = MG.sys.hunters.effectiveStats(st.hunters[0]).mp;
    for (let s = 0; s < 6; s++) { simNow += 30000; MG.sys.game.tick(simNow); }
    out.afterBoost = { aa: st.hunt.autoAdvance !== false, aaPark: st.hunt.aaPark, stage: st.hunt.stage, maxR: st.stats.maxRegionReached, errors: window.__dbg ? window.__dbg.errors : 'n/a' };
  }
  out.pass = {
    rmParkFires: !!parked && parked.aaPark && parked.aaPark.n >= 10,
    rmResumeFires: !!out.afterBoost && out.afterBoost.aa === true && out.afterBoost.aaPark === null
  };
  MG.core.save.save = origSave;
  Date.now = realDateNow;
  return out;
})()