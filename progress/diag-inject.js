(() => {
  const st = MG.game.state;
  const clsPool = ["sword","archer","mage","assassin","knight","priest"];
  function mkHunter(id, cls, lvl, rarity, promoted, enhanceLv) {
    const h = MG.sys.hunters.create(cls, rarity);
    h.id = "h" + id;
    h.level = lvl; h.exp = 0;
    h.promoted = promoted;
    h.spentGold = 0;
    const slots = ["weapon","helmet","armor","boots","necklace","ring","charm"];
    h.equip = {};
    for (const s of slots) {
      const it = MG.sys.equipment.gen(6, rarity, s, {});
      it.enhance = enhanceLv;
      MG.sys.equipment.addToInventory(it);
      h.equip[s] = it.uid;
    }
    h.hp = MG.sys.hunters.effectiveStats(h).hp;
    h.mp = MG.sys.hunters.effectiveStats(h).mp;
    return h;
  }
  st.hunters = [];
  for (let i = 0; i < 5; i++) st.hunters.push(mkHunter(i, clsPool[i], 80 + i * 8, [3,3,4,4,5][i], 2, 10));
  st.formation = ["h0","h1","h2","h3","h4"];
  st.hunt.region = 6; st.hunt.stage = 6; st.hunt.difficulty = 2;
  st.hunt.dispatchIds = ["h0","h1","h2","h3","h4"];
  st.hunt.autoDispatch = true; st.hunt.autoAdvance = true;
  st.kingdom = { level: 24, exp: 0 };
  st.buildings = { castle: 24, guild: 10, training: 12, forge: 14, gemworks: 10, alchemy: 8, library: 9, warehouse: 12, altar: 6, market: 6 };
  st.currencies.gold = 50000000; st.currencies.gems = 200;
  st.stats.maxStage = 66;
  st.stats.maxStageByRegion = {0:10,1:10,2:10,3:10,4:10,5:10,6:6};
  st.stats.maxTierReached = 7; st.stats.maxRegionReached = 7;
  st.stats.kills = 5000; st.stats.goldEarned = 300000000; st.stats.bossKills = 40;
  st.stats.enhances = 60; st.stats.recruits = 12; st.stats.playSec = 3600 * 40; st.stats.starUps = 3;
  st.quests.daily = { day: MG.util.today(), list: [
    {id:"d1",prog:0,done:false},{id:"d2",prog:0,done:false},{id:"d3",prog:0,done:false},{id:"d4",prog:0,done:false},{id:"d5",prog:0,done:false}
  ]};
  st.quests.weekly = { week: MG.sys.meta.weekKey(), list: [] };
  st.awakenings = 1;
  st.traditions = { hunt: 3 };
  st.lastSeen = Date.now();
  return { ok: true, hunters: st.hunters.length };
})()