/* v664 balance ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-53-v664";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=664", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    const mul = MG.config.BOSS_MECH_DIFF_MUL;
    const sets = MG.data.equipment.SETS;
    const wolf = sets.wolf;
    const fees = [1, 3, 5, 8].map((t) => MG.sys.equipment.gemFuseCost(t));
    // gem fuse with gold
    const st = MG.game.state;
    st.currencies.gold = 100000;
    // add 3 ruby_1
    for (let i = 0; i < 3; i++) MG.sys.equipment.addGem("ruby_1");
    const gBefore = st.currencies.gold;
    const out = MG.sys.equipment.gemFuse("ruby_1", 3, true);
    const gAfter = st.currencies.gold;
    // no gold
    st.currencies.gold = 0;
    for (let i = 0; i < 3; i++) MG.sys.equipment.addGem("ruby_2");
    const fail = MG.sys.equipment.gemFuse("ruby_2", 3, true);
    return {
      mul,
      wolf2: wolf.fx.atk,
      wolf4: wolf.fx4.crit,
      phoenixHeal: sets.phoenix.healKill,
      fees,
      fuseOk: !!out && out.tier === 2,
      goldSpent: gBefore - gAfter,
      fee1: fees[0],
      failNoGold: fail === false
    };
  });
  const out = {
    r, errs,
    pass: {
      mul: Array.isArray(r.mul) && r.mul[0] === 1 && r.mul[3] === 1.55,
      sets: r.wolf2 === 0.13 && r.wolf4 === 0.12 && r.phoenixHeal === 0.17,
      fuseFee: r.fee1 === 200 && r.fuseOk && r.goldSpent === 200 && r.failNoGold,
      noErr: errs.length === 0
    }
  };
  out.ok = Object.values(out.pass).every(Boolean);
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 2);
})().catch((e) => { console.error(e); process.exit(1); });
