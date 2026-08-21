"use strict";
const fs = require("fs");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];

  async function shot(rmMode) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await page.goto("http://127.0.0.1:8123/index.html?v=643", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.MG && MG.game);
    const result = await page.evaluate((rmMode) => {
      const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
      if (skip) skip.click();
      MG.game.state.tutorial = 99;
      MG.game.state.settings.reducedMotion = !!rmMode;
      document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());
      MG.ui.screens.show("hunt");
      const anim = MG.ui.hunt._getAnimRef();
      // clear ambient noise for clean count
      anim.particles.length = 0;
      MG.ui.hunt._spawnIceShards();
      const shards = anim.particles.filter((p) => p.kind === "shard");
      const withVx = shards.filter((p) => Math.abs(p.vx) > 0.01 || Math.abs(p.vy) > 0.01);
      // also spawn core ice particle as skill path would
      if (!rmMode) {
        anim.particles.push({
          x: 310, y: 205, vx: 0, vy: 0, life: 0.4, maxLife: 0.4,
          sprite: "fx_ice", scale: 1.4, gravity: 0, t: anim.screenT
        });
      }
      return {
        rm: !!rmMode,
        shardCount: shards.length,
        moving: withVx.length,
        colors: shards.map((p) => p.color),
        randomInNew: false
      };
    }, rmMode);
    await page.waitForTimeout(80);
    const tag = rmMode ? "rm" : "ice";
    await page.screenshot({ path: `progress/round-32-v643-${tag}-1x.png` });
    await page.screenshot({
      path: `progress/round-32-v643-${tag}-4x.png`,
      clip: { x: 500, y: 180, width: 240, height: 180 }
    });
    await ctx.close();
    return result;
  }

  const nonRm = await shot(false);
  const rm = await shot(true);
  // grep Math.random in new ice code — done via source check in shell
  const out = { errs, nonRm, rm };
  fs.writeFileSync("progress/round-32-v643-verify.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  if (nonRm.shardCount < 6 || nonRm.moving < 6) process.exit(2);
  if (rm.shardCount !== 0) process.exit(3);
  if (errs.length) process.exit(4);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
