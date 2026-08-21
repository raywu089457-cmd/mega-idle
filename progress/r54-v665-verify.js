/* v665 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-54-v665";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=665", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    st.buildings = st.buildings || {};
    st.buildings.castle = Math.max(st.buildings.castle || 0, 10); // gold
    st.buildings.guild = Math.max(st.buildings.guild || 0, 7); // silver
    st.buildings.training = Math.max(st.buildings.training || 0, 6);
    if (MG.ui.screen) MG.ui.screen.show("kingdom");
    await new Promise((r) => setTimeout(r, 150));
    // day sky sample
    MG.ui.kingdom.setPeriodOverride("day");
    if (MG.ui.kingdom.redrawTown) MG.ui.kingdom.redrawTown();
    // force redraw via raf
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(Date.now());
    await new Promise((r) => setTimeout(r, 80));
    const canvases = [...document.querySelectorAll("canvas")];
    let dayBlue = 0, silver = 0, gold = 0;
    for (const c of canvases) {
      if (!c || c.width < 100) continue;
      const ctx = c.getContext("2d");
      const d = ctx.getImageData(0, 0, Math.min(c.width, 480), Math.min(c.height, 200)).data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 200) continue;
        const r0 = d[i], g0 = d[i + 1], b0 = d[i + 2];
        // day sky cyan
        if (b0 > 200 && g0 > 150 && r0 < 200 && r0 > 60) dayBlue++;
        // silver lantern #c8d6f0
        if (Math.abs(r0 - 200) < 30 && Math.abs(g0 - 214) < 30 && b0 > 220) silver++;
        // gold pennant #ffd166
        if (r0 > 230 && g0 > 180 && g0 < 230 && b0 < 130) gold++;
      }
    }
    // periods resolve
    const periods = ["day", "dusk", "night"].map((p) => {
      MG.ui.kingdom.setPeriodOverride(p);
      return MG.ui.kingdom.townPeriod ? null : p;
    });
    MG.ui.kingdom.setPeriodOverride("day");
    const tp = (() => {
      // read via draw: period is internal — check setPeriodOverride accepted day
      MG.ui.kingdom.setPeriodOverride(null);
      return true;
    })();
    return { dayBlue, silver, gold, codeDay: true };
  });
  const k = fs.readFileSync(path.join(OUT, "../js/ui/kingdom.js"), "utf8");
  const rend = fs.readFileSync(path.join(OUT, "../js/ui/render.js"), "utf8");
  const out = {
    r, errs,
    code: {
      day: rend.includes('period === "day"') && k.includes('return "day"'),
      lantern: k.includes("銀階屋檐掛燈"),
      pennant: k.includes("金階雙角飄旗")
    }
  };
  out.pass = {
    code: out.code.day && out.code.lantern && out.code.pennant,
    daySky: r.dayBlue > 500,
    silverOrGold: r.silver > 0 || r.gold > 0,
    noErr: errs.length === 0
  };
  out.ok = Object.values(out.pass).every(Boolean);
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  await page.evaluate(() => {
    MG.ui.kingdom.setPeriodOverride("day");
    if (MG.ui.screen) MG.ui.screen.show("kingdom");
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${TAG}-day.png`) });
  await page.evaluate(() => MG.ui.kingdom.setPeriodOverride("night"));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, `${TAG}-night.png`) });
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 2);
})().catch((e) => { console.error(e); process.exit(1); });
