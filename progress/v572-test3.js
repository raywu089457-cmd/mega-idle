(() => {
  // v572 驗證③: 覺醒清除 marker ＋ reducedMotion 路徑 ＋ 舊檔相容 ＋ 引擎成本
  const st = MG.game.state;
  const out = {};
  const origSave = MG.core.save.save;
  MG.core.save.save = () => {};
  let simNow = Date.now();
  const realDateNow = Date.now.bind(Date);
  Date.now = () => simNow;

  // A. 覺醒清除: 構造可覺醒狀態 + 已退守 marker → awaken() 後 marker 清空
  st.buildings = { castle: 10, guild: 1, training: 10, forge: 10, gemworks: 0, alchemy: 0, library: 0, warehouse: 1, altar: 0, market: 0 };
  st.stats.maxStageByRegion = st.stats.maxStageByRegion || {};
  st.stats.maxStageByRegion[2] = 5;
  st.hunt.aaPark = { r: 5, n: 10, d: 2 };
  out.canAwaken = MG.sys.meta.canAwaken();
  const honor = MG.sys.meta.awaken();
  out.afterAwaken = { honor, aaPark: st.hunt.aaPark, region: st.hunt.region, stage: st.hunt.stage, aa: st.hunt.autoAdvance !== false, awakenings: st.awakenings };

  // B. reducedMotion 路徑: 開啟 rm 後引擎退守偵測照常（純邏輯 — 與渲染無關）
  st.settings.reducedMotion = true;
  st.hunt.autoAdvance = true;
  st.hunt.wipeStreak = 2;
  st.hunt.region = 0; st.hunt.stage = 9; st.hunt.difficulty = 0;
  MG.sys.game.tick(simNow); // 一次滅團 → ws 3 → fallback → marker
  out.rmPark = { aa: st.hunt.autoAdvance !== false, aaPark: st.hunt.aaPark ? JSON.parse(JSON.stringify(st.hunt.aaPark)) : null, ws: st.hunt.wipeStreak || 0, errors: window.__dbg ? window.__dbg.errors : 'n/a' };

  // C. 舊檔相容: 無 aaPark 欄位的 hunt 物件（模擬舊存檔）→ 零錯誤
  delete st.hunt.aaPark;
  delete st.hunt.aaParkT;
  MG.sys.game.tick(simNow + 1000);
  out.oldSave = { ok: true, aaPark: st.hunt.aaPark, stage: st.hunt.stage };

  // D. 引擎成本: parkResume 節流檢查（模擬 200 次呼叫的 wall-clock）
  st.hunt.aaPark = { r: 0, n: 10, d: 0 };
  st.hunt.autoAdvance = false;
  const t0 = performance.now();
  for (let i = 0; i < 200; i++) { st.hunt.aaParkT = 0; MG.sys.game.tick(simNow + i * 100); }
  const ms = performance.now() - t0;
  out.cost200ticks = { ms: +ms.toFixed(2), avgMs: +(ms / 200).toFixed(3) };

  out.pass = {
    awakenClears: out.afterAwaken.aaPark === null && out.afterAwaken.region === 0,
    rmParkWorks: !!(out.rmPark.aaPark) && out.rmPark.aa === false,
    oldSaveNoError: out.oldSave.ok === true,
    costSane: out.cost200ticks.avgMs < 5
  };
  MG.core.save.save = origSave;
  Date.now = realDateNow;
  return out;
})()