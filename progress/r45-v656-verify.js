/* v656: studyCost deepen verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

const OUT = path.join(__dirname);
const TAG = "round-45-v656";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=656", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);

  const r = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());
    const st = MG.game.state;
    const costs = [];
    let cum = 0;
    for (let lv = 0; lv < 10; lv++) {
      st.studyLvl = lv;
      const c = MG.sys.meta.studyCost();
      cum += c;
      costs.push({ lv, cost: c, cum });
    }
    const earlyOk = costs[0].cost === 15 && costs[4].cost === 75;
    const lateDeeper = costs[5].cost > 90 && costs[9].cost > 150;
    // buyStudy path: set books enough for lv5→6
    st.studyLvl = 5;
    const need = MG.sys.meta.studyCost();
    st.currencies.book = need;
    const before = st.studyLvl;
    const ok = MG.sys.meta.buyStudy();
    return {
      costs,
      total: cum,
      earlyOk,
      lateDeeper,
      buyOk: ok && st.studyLvl === before + 1 && st.currencies.book === 0,
      need5: need,
      oldTotal: 825,
      ratio: +(cum / 825).toFixed(2)
    };
  });

  const out = { ...r, errs, pass: { earlyOk: r.earlyOk, lateDeeper: r.lateDeeper, buyOk: r.buyOk, totalUp: r.total > 2000, noErr: errs.length === 0 } };
  out.ok = Object.values(out.pass).every(Boolean);
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
