/* v659: poison/arrow/dagger FX ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-48-v659";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];

  async function run(rmMode) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(String(e.message || e)));
    await page.goto("http://127.0.0.1:8123/index.html?v=659", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.MG && MG.game);
    const r = await page.evaluate((rm) => {
      const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
      if (skip) skip.click();
      MG.game.state.tutorial = 99;
      MG.game.state.settings.reducedMotion = !!rm;
      document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());
      MG.ui.screens.show("hunt");
      const anim = MG.ui.hunt._getAnimRef();
      anim.particles.length = 0;
      MG.ui.hunt._spawnPoisonCloud(310, 205);
      const cloud = anim.particles.filter((p) => p.kind === "cloud").length;
      const afterCloud = anim.particles.length;
      anim.particles.length = 0;
      MG.ui.hunt._spawnArrowStreak(80, 180, 310, 205);
      const streak = anim.particles.filter((p) => p.kind === "streak").length;
      anim.particles.length = 0;
      MG.ui.hunt._spawnDaggerFan(310, 205);
      const dagger = anim.particles.filter((p) => p.kind === "dagger").length;
      return { rm: !!rm, cloud, streak, dagger, afterCloud };
    }, rmMode);
    await ctx.close();
    return r;
  }

  const live = await run(false);
  const rm = await run(true);
  const out = {
    live, rm, errs,
    pass: {
      poison: live.cloud === 1 && live.afterCloud >= 6,
      arrow: live.streak === 1,
      dagger: live.dagger === 3,
      rmNone: rm.cloud === 0 && rm.streak === 0 && rm.dagger === 0,
      noErr: errs.length === 0
    }
  };
  out.ok = Object.values(out.pass).every(Boolean);
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 2);
})().catch((e) => { console.error(e); process.exit(1); });
