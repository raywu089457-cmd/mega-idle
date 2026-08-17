(() => {
  // v572 驗證②: 手動關閉契約（真實 UI 按鈕路徑）＋ 假陽性檢查
  const st = MG.game.state;
  const out = {};
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
  function stepTo(targetSec) {
    while ((simNow - T0) / 1000 < targetSec) {
      simNow += 30000;
      MG.sys.game.tick(simNow);
      recruitIf(); fillFormation(); dispatchAll();
    }
  }
  function clickAutoAdvanceBtn() {
    // 真實 UI 路徑: 渲染狩獵畫面 → 點「自動進關」按鈕
    if (MG.ui.screens) MG.ui.screens.show('hunt');
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.includes('自動進關')) { b.click(); return true; }
    }
    return false;
  }
  const T0 = simNow;
  dispatchAll();
  MG.sys.game.tick(simNow);

  // A. 引擎退守 → marker 建立
  stepTo(720);
  out.parked = { aa: st.hunt.autoAdvance !== false, aaPark: st.hunt.aaPark ? JSON.parse(JSON.stringify(st.hunt.aaPark)) : null, ws: st.hunt.wipeStreak || 0 };

  // B. 玩家手動關閉（真實按鈕）→ marker 清除
  out.clicked = clickAutoAdvanceBtn();
  out.afterManualOff = { aa: st.hunt.autoAdvance !== false, aaPark: st.hunt.aaPark, ws: st.hunt.wipeStreak || 0 };

  // C. 練到超強（遠超牆點需求）→ 步進 10 分鐘 → aa 必須維持 false（手動契約 — 永不自動恢復）
  for (const h of st.hunters) { h.level = 60; h.exp = 0; h.hp = MG.sys.hunters.effectiveStats(h).hp; h.mp = MG.sys.hunters.effectiveStats(h).mp; }
  out.powerBoosted = Math.round(MG.sys.battle.formationPower());
  stepTo(1320);
  out.afterBoost = { aa: st.hunt.autoAdvance !== false, aaPark: st.hunt.aaPark, region: st.hunt.region, stage: st.hunt.stage, kills: st.stats.kills };

  // D. 手動開啟 → 引擎正常推（kills/maxR 前進）
  clickAutoAdvanceBtn();
  out.afterManualOn = { aa: st.hunt.autoAdvance !== false, aaPark: st.hunt.aaPark };
  stepTo(1560);
  out.afterManualOnStep = { aa: st.hunt.autoAdvance !== false, aaPark: st.hunt.aaPark, maxR: st.stats.maxRegionReached, maxStage: st.stats.maxStage, kills: st.stats.kills };

  // E. 假陽性: 手動關閉後滅團（ws 1→2）＋擊殺歸零 → 不得建立 marker
  clickAutoAdvanceBtn(); // off
  stepTo(1620);
  out.fp = { aa: st.hunt.autoAdvance !== false, aaPark: st.hunt.aaPark, ws: st.hunt.wipeStreak || 0, kills: st.stats.kills };

  out.pass = {
    parkMarker: !!(out.parked.aaPark),
    manualOffClears: out.clicked && out.afterManualOff.aaPark === null && out.afterManualOff.aa === false,
    staysOffDespiteStrong: out.afterBoost.aa === false && out.afterBoost.aaPark === null,
    manualOnResumes: out.afterManualOn.aa === true && out.afterManualOnStep.aa === true,
    progressedAfterManualOn: out.afterManualOnStep.maxR > 0,
    noFalsePositive: out.fp.aaPark === null
  };
  MG.core.save.save = origSave;
  Date.now = realDateNow;
  return out;
})()