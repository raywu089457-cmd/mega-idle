/* v677 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-66-v677";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 480, height: 844 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=677", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    for (const k of Object.keys(st.buildings || {})) st.buildings[k] = Math.max(st.buildings[k] || 0, 1);
    MG.ui.screens.show("kingdom");
    await new Promise((r) => setTimeout(r, 80));

    function sample(pred) {
      let n = 0;
      for (const c of document.querySelectorAll("canvas")) {
        if (!c || c.width < 100) continue;
        const w = Math.min(c.width, 480), h = Math.min(c.height, 200);
        const d = c.getContext("2d").getImageData(0, 0, w, h).data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 140) continue;
          if (pred(d[i], d[i + 1], d[i + 2])) n++;
        }
      }
      return n;
    }

    MG.ui.kingdom.setPeriodOverride("day");
    MG.ui.kingdom.setSeasonOverride("spring");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now());
    await new Promise((r) => setTimeout(r, 40));
    const petal = sample((r, g, b) => r > 200 && g > 120 && g < 200 && b > 150 && b < 220);

    MG.ui.kingdom.setSeasonOverride("autumn");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now());
    await new Promise((r) => setTimeout(r, 40));
    const leaf = sample((r, g, b) => (r > 180 && g > 80 && g < 180 && b < 100) || (r > 220 && g > 180 && b < 140));

    MG.ui.kingdom.setSeasonOverride("winter");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now());
    await new Promise((r) => setTimeout(r, 40));
    const snow = sample((r, g, b) => r > 200 && g > 210 && b > 230 && Math.abs(r - b) < 40);

    MG.ui.kingdom.setSeasonOverride("summer");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now());
    await new Promise((r) => setTimeout(r, 40));
    const summerPetal = sample((r, g, b) => r > 200 && g > 120 && g < 200 && b > 150 && b < 220);

    st.settings.reducedMotion = true;
    MG.ui.kingdom.setSeasonOverride("winter");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(1000);
    await new Promise((r) => setTimeout(r, 30));
    const snowRmA = sample((r, g, b) => r > 200 && g > 210 && b > 230 && Math.abs(r - b) < 40);
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(5000);
    await new Promise((r) => setTimeout(r, 30));
    const snowRmB = sample((r, g, b) => r > 200 && g > 210 && b > 230 && Math.abs(r - b) < 40);

    return { petal, leaf, snow, summerPetal, snowRmA, snowRmB, rmStable: snowRmA === snowRmB };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-kingdom.png") });
  const out = {
    ok: !errs.length
      && r.petal > 5 && r.leaf > 5 && r.snow > 5
      && r.summerPetal < r.petal
      && r.rmStable
      && k.includes("季節落物") && k.includes("spring") && k.includes("autumn") && k.includes("winter"),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
