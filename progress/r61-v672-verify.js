/* v672 balance ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-61-v672";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=672", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    const D = MG.data.hunters;
    const e50 = D.expNeed(50);
    const e99 = D.expNeed(99);
    const e100 = D.expNeed(100);
    const e120 = D.expNeed(120);
    const expOk = e50 === Math.floor(55 * Math.pow(50, 1.45))
      && e99 === Math.floor(55 * Math.pow(99, 1.45))
      && e100 === Math.floor(55 * Math.pow(100, 1.45) * 1.25)
      && e120 === Math.floor(55 * Math.pow(120, 1.45) * Math.pow(1.25, 2));

    const g0 = D.recruit.gold.cost(0);
    const g10 = D.recruit.gold.cost(10);
    const g15 = D.recruit.gold.cost(15);
    const g40 = D.recruit.gold.cost(40);
    const base10 = 150 * Math.pow(2.1, 10);
    const goldOk = g0 === Math.floor(150)
      && g10 === Math.floor(base10)
      && g15 === Math.floor(base10 * Math.pow(1.06, 5))
      && g40 === Math.floor(base10 * Math.pow(1.06, 20));

    const f1 = MG.sys.equipment.gemFuseCost(1);
    const f5 = MG.sys.equipment.gemFuseCost(5);
    const f6 = MG.sys.equipment.gemFuseCost(6);
    const f8 = MG.sys.equipment.gemFuseCost(8);
    const fuseOk = f1 === 200
      && f5 === Math.floor(200 * Math.pow(1.45, 4))
      && f6 === Math.floor(200 * Math.pow(1.45, 5) * 1.25)
      && f8 === Math.floor(200 * Math.pow(1.45, 7) * Math.pow(1.25, 3));

    return { expOk, e50, e99, e100, e120, goldOk, g0, g10, g15, g40, fuseOk, f1, f5, f6, f8 };
  });
  const out = { ok: !errs.length && r.expOk && r.goldOk && r.fuseOk, r, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
