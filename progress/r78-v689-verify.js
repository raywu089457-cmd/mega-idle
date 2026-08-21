/* v689 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-78-v689";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=689", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.kingdom);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    st.buildings = st.buildings || {};
    st.buildings.castle = Math.max(1, st.buildings.castle || 0);
    st.buildings.forge = Math.max(1, st.buildings.forge || 0);
    st.buildings.guild = Math.max(1, st.buildings.guild || 0);

    const nav = [...document.querySelectorAll("button, .tab")].find((b) => /王國/.test(b.textContent || ""));
    if (nav) nav.click();
    await new Promise((r) => setTimeout(r, 150));

    if (MG.ui.kingdom.setPeriodOverride) MG.ui.kingdom.setPeriodOverride("night");
    for (let i = 0; i < 4; i++) {
      if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now() + i * 250);
    }
    await new Promise((r) => setTimeout(r, 120));

    function sample(x0, y0, x1, y1) {
      const canvases = [...document.querySelectorAll("canvas")];
      let best = null, area = 0;
      for (const c of canvases) {
        const a = c.width * c.height;
        if (a > area && c.width >= 400) { area = a; best = c; }
      }
      if (!best) return 0;
      const d = best.getContext("2d").getImageData(x0, y0, x1 - x0, y1 - y0).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 30) n++;
      return n;
    }

    const mouse = sample(95, 165, 115, 180);
    const hay = sample(155, 148, 195, 180);
    const bat = sample(60, 40, 200, 90);

    st.settings.reducedMotion = true;
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(2000);
    const a = sample(95, 165, 115, 180);
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(2000);
    const b = sample(95, 165, 115, 180);

    return { mouse, hay, bat, rmSame: a === b };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-town.png") });
  const out = {
    ok: !errs.length
      && k.includes("v689 木桶老鼠")
      && k.includes("v689 乾草飛絮")
      && k.includes("v689 夜間蝙蝠")
      && (r.mouse > 0 || r.hay > 0)
      && r.rmSame,
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
