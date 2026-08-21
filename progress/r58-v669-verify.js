/* v669 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-58-v669";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 480, height: 844 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=669", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    MG.ui.screens.show("kingdom");
    await new Promise((r) => setTimeout(r, 100));

    function sampleCanvas(pred) {
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
    MG.ui.kingdom.setSeasonOverride("autumn");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(Date.now());
    await new Promise((r) => setTimeout(r, 60));
    const autumnLeaf = sampleCanvas((r, g, b) => r > 180 && g > 60 && g < 140 && b < 90);

    MG.ui.kingdom.setSeasonOverride("winter");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(Date.now());
    await new Promise((r) => setTimeout(r, 60));
    const winterSnow = sampleCanvas((r, g, b) => r > 200 && g > 220 && b > 230 && Math.abs(r - g) < 30);

    MG.ui.kingdom.setSeasonOverride("spring");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(Date.now());
    await new Promise((r) => setTimeout(r, 60));
    const springPink = sampleCanvas((r, g, b) => r > 200 && g > 120 && g < 200 && b > 160 && b < 230);

    MG.ui.kingdom.setSeasonOverride("summer");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now());
    await new Promise((r) => setTimeout(r, 80));
    // duck yellow near 295,176 — sample ROI via offscreen town draw
    const c = document.createElement("canvas");
    c.width = 480; c.height = 200;
    const ctx = c.getContext("2d");
    MG.ui.render.drawTown(ctx, {
      h: 200, t: 1, buildings: [], period: "day", season: "summer"
    });
    // life is on fx layer — check code + force drawTownLife by sampling after raf
    const duckY = sampleCanvas((r, g, b) => r > 230 && g > 180 && g < 230 && b < 130);

    const seasons = ["spring", "summer", "autumn", "winter"].map((s) => {
      MG.ui.kingdom.setSeasonOverride(s);
      return MG.ui.kingdom.townSeason();
    });
    return {
      autumnLeaf, winterSnow, springPink, duckY, seasons,
      hasSeasonApi: typeof MG.ui.kingdom.setSeasonOverride === "function",
      townSeason: MG.ui.kingdom.townSeason()
    };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-kingdom.png") });
  const out = {
    r, errs,
    code: {
      season: rend.includes("v669 四季疊色") && k.includes("townSeason"),
      birds: k.includes("天空飛鳥群"),
      duck: k.includes("廣場小鴨")
    }
  };
  out.ok = !errs.length && out.code.season && out.code.birds && out.code.duck
    && r.hasSeasonApi && r.seasons.join(",") === "spring,summer,autumn,winter"
    && (r.autumnLeaf > 5 || r.winterSnow > 5 || r.springPink > 5);
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
