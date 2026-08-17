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
    // 真實玩家: 新招募英雄自動編入空位
    const ids = st.hunters.slice(0, 5).map(h => h.id);
    for (let i = 0; i < 5; i++) st.formation[i] = ids[i] || null;
  }
  function dispatchAll() {
    if (!(st.hunt.dispatchIds || []).length && st.hunters.length) {
      st.hunt.dispatchIds = st.hunters.slice(0, 5).map(h => h.id);
    }
  }
  function equipAuto() {
    // 玩家行為: 自動穿戴掉落物中較好的
    for (const it of st.inventory.items) {
      if (it.uid && it.enhance !== undefined) {
        const h = st.hunters.find(x => !x.equip[MG.sys.equipment.slotOf(it)]);
        if (h) MG.sys.equipment.equipToHunter(h, it);
      }
    }
  }
  function sample(sec) {
    return { sec, kills: st.stats.kills, gold: st.currencies.gold, maxStage: st.stats.maxStage, maxR: st.stats.maxRegionReached, stage: st.hunt.stage, region: st.hunt.region, aa: st.hunt.autoAdvance, hunters: st.hunters.map(h => h.cls + 'L' + h.level + '★' + h.rarity).join(','), wipeStreak: st.hunt.wipeStreak || 0, ids: (st.hunt.dispatchIds||[]).length, rest: st.hunt.restUntil > simNow, building: st.buildings.castle };
  }
  dispatchAll();
  MG.sys.game.tick(simNow);
  log.push({ t: 'start', ...sample(0) });
  for (let s = 60; s <= 7200; s += 60) {
    simNow += 60000;
    MG.sys.game.tick(simNow);
    recruitIf();
    fillFormation();
    dispatchAll();
    equipAuto();
    // 玩家發現「自動進關已暫停」後(300s 後)若戰力已夠就重開 — 模擬懂系統的玩家
    if (!st.hunt.autoAdvance && s > 300) {
      const req = MG.sys.battle.stagePowerReq(st.hunt.region, st.hunt.stage);
      const pw = MG.sys.battle.formationPower();
      if (pw >= req) { st.hunt.autoAdvance = true; log.push({ t: s + 's', note: 'PLAYER re-enabled aa', req, pw }); }
    }
    if (s % 600 === 0) log.push({ t: s + 's', ...sample(s) });
  }
  Date.now = realDateNow;
  return log;
})()