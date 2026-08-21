/* v668 balance ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-57-v668";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=668", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    const D = MG.data.hunters;
    const t50 = D.trainCost(50);
    const t99 = D.trainCost(99);
    const t100 = D.trainCost(100);
    const t120 = D.trainCost(120);
    const base100 = 60 * Math.pow(100, 1.85);
    const trainOk = t50 === Math.floor(60 * Math.pow(50, 1.85))
      && t99 === Math.floor(60 * Math.pow(99, 1.85))
      && t100 === Math.floor(base100 * 1.3)
      && t120 === Math.floor(60 * Math.pow(120, 1.85) * Math.pow(1.3, 2));

    const st = MG.game.state;
    st.awakenings = 0;
    st.honorLvls = st.honorLvls || {};
    st.honorLvls.atk = 0;
    const h0 = MG.sys.meta.honorCost("atk");
    st.awakenings = 4;
    const h4 = MG.sys.meta.honorCost("atk");
    st.awakenings = 20;
    const hCap = MG.sys.meta.honorCost("atk");
    const honorOk = h0 === 50
      && h4 === Math.floor(50 * Math.pow(1.12, 4))
      && hCap === Math.floor(50 * Math.pow(1.12, 8));

    st.kingdom.level = 5;
    const fee5 = MG.sys.meta.recycleFee();
    st.kingdom.level = 30;
    const fee30 = MG.sys.meta.recycleFee();
    const feeOk = fee5 === Math.floor(5000 * Math.pow(1.35, 4))
      && fee30 === Math.floor(5000 * Math.pow(1.35, 18));

    // exchange gold soft-cap via dry formula (don't mutate mats)
    const ex5 = Math.floor(500 * Math.pow(1.35, Math.min(18, 5 - 1)));
    const ex30 = Math.floor(500 * Math.pow(1.35, Math.min(18, 30 - 1)));
    return { trainOk, t50, t99, t100, t120, honorOk, h0, h4, hCap, feeOk, fee5, fee30, ex5, ex30 };
  });
  const out = { ok: !errs.length && r.trainOk && r.honorOk && r.feeOk, r, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
