(() => {
  const st = MG.game.state;
  const out = {};
  const r = MG.sys.battle.rates();
  out.rates = { goldPerSec: Math.round(r.goldPerSec), expPerSec: Math.round(r.expPerSec), goldPerH: Math.round(r.goldPerSec*3600), expPerH: Math.round(r.expPerSec*3600) };
  const bd = MG.data.buildings;
  const bkeys = ['castle','guild','training','forge','gemworks','alchemy','library','warehouse','altar','market'];
  out.buildings = {};
  for (const k of bkeys) {
    const cur = st.buildings[k] || 0;
    const c = bd[k].cost(cur + 1);
    out.buildings[k] = { cur, next: cur+1, gold: c.gold, hours: +(c.gold / r.goldPerSec / 3600).toFixed(2) };
  }
  out.enhance = {};
  for (const t of [6,7,8]) out.enhance['T'+t] = { e10: MG.data.equipment.enhanceCost(t,10), e15: MG.data.equipment.enhanceCost(t,15) };
  out.train = {};
  for (const l of [100,150,199]) out.train[l] = { cost: MG.data.hunters.trainCost(l), exp: MG.data.hunters.trainExp(l) };
  out.promo = {};
  for (let p = 0; p < 5; p++) out.promo[p] = MG.data.hunters.promoCost({promoted: p});
  out.daily = MG.data.quests.DAILY_POOL.map(d => ({ id: d.id, reward: MG.sys.meta.scaleQuestGold(d.reward) }));
  out.weekly = MG.data.quests.WEEKLY_POOL.map(w => ({ id: w.id, reward: MG.sys.meta.scaleQuestGold(w.reward, 1.3) }));
  const day = MG.sys.meta.checkinDay();
  const chk = MG.data.quests.CHECKIN[Math.min(day, 29)];
  const chkR = Object.assign({}, chk.r);
  if (chkR.gold) chkR.gold = Math.floor(chkR.gold * Math.pow(1.35, Math.max(0, st.kingdom.level - 1)));
  out.checkinNext = { day: day+1, reward: chkR };
  out.offlinePreview = MG.core.save.previewOffline();
  out.offline12h = { gold: Math.round(r.goldPerSec*3600*12*1.2), exp: Math.round(r.expPerSec*3600*12*1.2) };
  out.canAwaken = MG.sys.meta.canAwaken();
  out.awakenHonor = Math.floor((100 + 25 * Math.min(st.awakenings, 10)) * MG.sys.buildings.effects().honorMul);
  out.heroPower = st.hunters.map(h => Math.round(MG.sys.hunters.power(h)));
  out.mats = JSON.parse(JSON.stringify(st.mats));
  out.matsExCap = MG.sys.meta.matsExCap();
  out.bookExCap = MG.sys.meta.bookExCap();
  out.recycleFee = MG.sys.meta.recycleFee();
  out.exchangeGold = Math.floor(500 * Math.pow(1.35, 23));
  out.studyCost = MG.sys.meta.studyCost();
  out.artifacts = st.artifacts ? Object.keys(st.artifacts.owned||{}) : [];
  out.recruitGold = MG.sys.hunters.recruitCost('gold');
  return out;
})()