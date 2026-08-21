/* v673 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-62-v673";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 480, height: 844 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=673", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    // copper buildings
    st.buildings = st.buildings || {};
    for (const k of Object.keys(st.buildings)) st.buildings[k] = Math.max(st.buildings[k] || 0, 4);
    st.buildings.castle = Math.max(st.buildings.castle || 0, 4);
    st.buildings.guild = Math.max(st.buildings.guild || 0, 4);
    MG.ui.screens.show("kingdom");
    await new Promise((r) => setTimeout(r, 80));

    function sample(pred) {
      let n = 0;
      for (const c of document.querySelectorAll("canvas")) {
        if (!c || c.width < 100) continue;
        const d = c.getContext("2d").getImageData(0, 0, Math.min(c.width, 480), Math.min(c.height, 200)).data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 180) continue;
          if (pred(d[i], d[i + 1], d[i + 2])) n++;
        }
      }
      return n;
    }

    MG.ui.kingdom.setPeriodOverride("day");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now());
    await new Promise((r) => setTimeout(r, 50));
    const copper = sample((r, g, b) => r > 180 && g > 120 && g < 200 && b < 120); // #e0a060-ish

    MG.ui.kingdom.setPeriodOverride("night");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now());
    await new Promise((r) => setTimeout(r, 50));
    const windowGlow = sample((r, g, b) => r > 200 && g > 160 && g < 240 && b < 180);
    const firefly = sample((r, g, b) => r > 230 && g > 200 && g < 240 && b < 160);

    return { copper, windowGlow, firefly };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-kingdom.png") });
  const out = {
    ok: !errs.length
      && k.includes("銅階屋檐風鈴") && k.includes("夜／黃昏窗暖光") && k.includes("螢火蟲")
      && (r.copper > 5 || r.windowGlow > 10)
      && r.firefly > 5,
    r, errs,
    code: {
      chime: k.includes("銅階屋檐風鈴"),
      window: k.includes("夜／黃昏窗暖光"),
      firefly: k.includes("螢火蟲")
    }
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
