(() => {
  // 卡牆退守狀態（戰力低於恢復門檻 → 保持退守）: 牆點 r4s10, 農點 r3s9
  const st = MG.game.state;
  const clsPool = ["sword","archer","mage","assassin","knight"];
  function mkHunter(id, cls, lvl, rarity) {
    const h = MG.sys.hunters.create(cls, rarity);
    h.id = "h" + id;
    h.level = lvl; h.exp = 0; h.promoted = 1;
    h.spentGold = 0;
    const slots = ["weapon","helmet","armor","boots","necklace","ring","charm"];
    h.equip = {};
    for (const s of slots) {
      const it = MG.sys.equipment.gen(3, rarity, s, {});
      it.enhance = 6;
      MG.sys.equipment.addToInventory(it);
      h.equip[s] = it.uid;
    }
    h.hp = MG.sys.hunters.effectiveStats(h).hp;
    h.mp = MG.sys.hunters.effectiveStats(h).mp;
    return h;
  }
  st.hunters = clsPool.map((c, i) => mkHunter(i, c, 22 + i * 3, [3,3,4,4,4][i]));
  st.formation = ["h0","h1","h2","h3","h4"];
  // test-only: 同步 formations 陣列（save.js normalize 以 formations[activeTeam] 為鏡像源）
  st.formations = [st.formation.slice(), [null,null,null,null,null], [null,null,null,null,null], [null,null,null,null,null], [null,null,null,null,null]];
  st.activeTeam = 0;
  st.hunt.region = 3; st.hunt.stage = 9; st.hunt.difficulty = 0;
  st.hunt.dispatchIds = ["h0","h1","h2","h3","h4"];
  st.hunt.autoDispatch = true;
  st.hunt.autoAdvance = false;
  st.hunt.aaPark = { r: 4, n: 10, d: 0 };
  st.hunt.wipeStreak = 0;
  st.hunt.restUntil = 0;
  st.kingdom = { level: 18, exp: 0 };
  st.buildings = { castle: 18, guild: 8, training: 10, forge: 11, gemworks: 8, alchemy: 6, library: 7, warehouse: 10, altar: 4, market: 5 };
  st.currencies.gold = 8000000;
  st.stats.maxStage = 40;
  st.stats.maxStageByRegion = {0:10,1:10,2:10,3:9,4:10};
  st.stats.maxTierReached = 5;
  st.stats.maxRegionReached = 5;
  st.stats.kills = 4000;
  st.stats.goldEarned = 200000000;
  MG.sys.battle.reset();
  MG.ui.screens.show("hunt");
  MG.ui.dom.toast("連敗三場，已自動移至最佳練功點「烈焰火山・第 9 關・普通」練角（自動進關已暫停）", "", "icon_castle");
  return { ok: true, power: Math.round(MG.sys.battle.formationPower()), threshold: Math.round(MG.sys.battle.stagePowerReq(4, 10, 1) * 1.15) };
})()
