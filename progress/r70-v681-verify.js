/* v681 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-70-v681";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 480, height: 844 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=681", { waitUntil: "domcontentloaded" });
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
    MG.ui.kingdom.setSeasonOverride("summer");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now());
    await new Promise((r) => setTimeout(r, 50));
    const dragon = sample((r, g, b) => r < 100 && g > 80 && g < 140 && b < 120 && g > r);
    const well = sample((r, g, b) => r > 120 && g > 180 && b > 200 && b > r);
    const bee = sample((r, g, b) => r > 220 && g > 180 && b < 140);

    st.settings.reducedMotion = true;
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(1000);
    await new Promise((r) => setTimeout(r, 30));
    const wellRmA = sample((r, g, b) => r > 120 && g > 180 && b > 200 && b > r);
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(4000);
    await new Promise((r) => setTimeout(r, 30));
    const wellRmB = sample((r, g, b) => r > 120 && g > 180 && b > 200 && b > r);

    return { dragon, well, bee, wellRmA, wellRmB, rmStable: wellRmA === wellRmB };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-kingdom.png") });
  const out = {
    ok: !errs.length
      && r.dragon > 3 && r.well > 2 && r.bee > 2 && r.rmStable
      && k.includes("夏蜻蜓") && k.includes("水井波光") && k.includes("花圃蜜蜂"),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
