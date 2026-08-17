(() => {
  // v572 驗證: ①首 session 卡牆 → 引擎退守 marker → 練角成長 → 自動恢復自動進關 → 自動推進
  const st = MG.game.state;
  const out = { steps: [] };
  const toasts = [];
  const origToast = MG.ui.dom.toast;
  MG.ui.dom.toast = (msg, kind, icon) => { toasts.push(String(msg)); return origToast ? origToast(msg, kind, icon) : null; };
  // 防 autosave 污染（假時鐘 restUntil 不落盤）
  const origSave = MG.core.save.save;
  MG.core.save.save = () => {};
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
  function snapshot(tag) {
    const F = MG.sys.battle.get();
    out.steps.push({
      tag,
      t: Math.round((simNow - T0) / 1000),
      aa: st.hunt.autoAdvance !== false,
      aaPark: st.hunt.aaPark ? JSON.parse(JSON.stringify(st.hunt.aaPark)) : null,
      ws: st.hunt.wipeStreak || 0,
      region: st.hunt.region, stage: st.hunt.stage,
      maxStage: st.stats.maxStage, maxR: st.stats.maxRegionReached,
      kills: st.stats.kills, gold: Math.round(st.currencies.gold),
      phase: F.phase, ids: (st.hunt.dispatchIds || []).length,
      power: Math.round(MG.sys.battle.formationPower()),
      reqWall: st.hunt.aaPark ? MG.sys.battle.stagePowerReq(st.hunt.aaPark.r, st.hunt.aaPark.n, (MG.config.DIFFICULTY[st.hunt.aaPark.d] || MG.config.DIFFICULTY[0]).mult) : null,
      hunters: st.hunters.map(h => h.cls + 'L' + h.level).join(',')
    });
  }
  function stepTo(targetSec) {
    while ((simNow - T0) / 1000 < targetSec) {
      simNow += 30000;
      MG.sys.game.tick(simNow);
      recruitIf(); fillFormation(); dispatchAll();
    }
  }
  // 起始
  const T0 = simNow;
  dispatchAll();
  MG.sys.game.tick(simNow);
  snapshot('start');
  // 12 分鐘: 推到首領牆 → 3 連敗 → 引擎退守
  stepTo(720);
  snapshot('parked@wall');
  // 模擬掛機練角 6 小時: 注入等級/裝備成長（idle 的等價結果 — 數值測試只驗證引擎偵測/恢復邏輯）
  for (const h of st.hunters) {
    h.level = 30; h.exp = 0;
    h.hp = MG.sys.hunters.effectiveStats(h).hp;
    h.mp = MG.sys.hunters.effectiveStats(h).mp;
  }
  snapshot('boosted');
  // 步進 30 秒: 應觸發自動恢復
  stepTo(780);
  snapshot('after-resume');
  // 恢復後繼續步進 10 分鐘: 應自動推過首領 → 區域 2 解鎖
  stepTo(1380);
  snapshot('pushed-past-boss');
  const resumed = out.steps.find(s => s.tag === 'after-resume');
  const pushed = out.steps.find(s => s.tag === 'pushed-past-boss');
  out.pass = {
    parkMarkerSet: out.steps.some(s => s.tag === 'parked@wall' && s.aaPark && s.aaPark.n === 10 && s.aaPark.r === 0),
    aaOffAtPark: out.steps.some(s => s.tag === 'parked@wall' && !s.aa),
    resumeFired: !!resumed && resumed.aa === true && resumed.aaPark === null,
    toastSeen: toasts.some(t => t.includes('自動進關已恢復')),
    progressedPastBoss: !!pushed && pushed.maxR >= 1,
    pushedRegion: pushed ? pushed.maxR : null,
    pushedMaxStage: pushed ? pushed.maxStage : null,
    reqWallAtPark: out.steps.find(s => s.tag === 'parked@wall').reqWall,
    powerAtResume: resumed ? resumed.power : null
  };
  // 還原
  MG.ui.dom.toast = origToast;
  MG.core.save.save = origSave;
  Date.now = realDateNow;
  return out;
})()