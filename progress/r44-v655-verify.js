/* v655: 斬擊弧 ROI + rm */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

const OUT = path.join(__dirname);
const TAG = "round-44-v655";

function near(r, g, b, t, tol = 40) {
  return Math.abs(r - t[0]) <= tol && Math.abs(g - t[1]) <= tol && Math.abs(b - t[2]) <= tol;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];

  async function shot(rmMode, tag) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(String(e.message || e)));
    await page.goto("http://127.0.0.1:8123/index.html?v=655", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.MG && MG.game);
    const result = await page.evaluate((rmMode) => {
      const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
      if (skip) skip.click();
      MG.game.state.tutorial = 99;
      MG.game.state.settings.reducedMotion = !!rmMode;
      document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());
      MG.ui.screens.show("hunt");
      const anim = MG.ui.hunt._getAnimRef();
      anim.particles.length = 0;
      MG.ui.hunt._spawnSlashArc(310, 205);
      const arcs = anim.particles.filter((p) => p.kind === "arc");
      const shards = anim.particles.filter((p) => p.kind === "shard");
      return { rm: !!rmMode, arcCount: arcs.length, shardCount: shards.length };
    }, rmMode);
    await page.waitForTimeout(80);
    const sample = await page.evaluate(() => {
      const canvases = [...document.querySelectorAll("canvas")];
      const battle = canvases.find((x) => x.width === 480 && x.height === 270) || canvases[0];
      if (!battle) return { err: "no-canvas" };
      const bctx = battle.getContext("2d");
      bctx.fillStyle = "#14141f";
      bctx.fillRect(0, 0, battle.width, battle.height);
      const anim = MG.ui.hunt._getAnimRef();
      // 用與 render.js 相同語彙手繪 arc（隔離驗證，不走完整 drawBattle）
      for (const p of anim.particles) {
        if (p.kind === "arc") {
          const a = Math.max(0, p.life / p.maxLife);
          bctx.save();
          bctx.globalAlpha = a;
          bctx.lineCap = "round";
          bctx.strokeStyle = p.color || "#a8c0e0";
          bctx.lineWidth = 4;
          bctx.beginPath();
          bctx.arc(p.cx, p.cy, p.r, p.a0, p.a1, false);
          bctx.stroke();
          bctx.strokeStyle = p.color2 || "#ffffff";
          bctx.lineWidth = 1.75;
          bctx.beginPath();
          bctx.arc(p.cx, p.cy, p.r, p.a0, p.a1, false);
          bctx.stroke();
          bctx.restore();
        } else if (p.kind === "shard") {
          bctx.fillStyle = p.color;
          bctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        }
      }
      const img = bctx.getImageData(280, 170, 80, 60);
      let silver = 0, white = 0;
      for (let i = 0; i < img.data.length; i += 4) {
        if (img.data[i + 3] < 20) continue;
        const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
        if (Math.abs(r - 0xa8) <= 50 && Math.abs(g - 0xc0) <= 50 && Math.abs(b - 0xe0) <= 50) silver++;
        if (r > 220 && g > 220 && b > 220) white++;
      }
      return { silver, white, w: battle.width, h: battle.height };
    });
    await page.screenshot({ path: path.join(OUT, `${TAG}-${tag}-1x.png`) });
    await page.screenshot({
      path: path.join(OUT, `${TAG}-${tag}-4x.png`),
      clip: { x: 400, y: 120, width: 320, height: 240 }
    });
    await ctx.close();
    return { ...result, sample };
  }

  const live = await shot(false, "live");
  const rm = await shot(true, "rm");
  const out = {
    live, rm, errs,
    pass: {
      liveArc: live.arcCount === 1 && live.shardCount >= 3,
      livePix: live.sample.silver >= 5 || live.sample.white >= 5,
      rmNone: rm.arcCount === 0 && rm.shardCount === 0,
      noErr: errs.length === 0
    }
  };
  out.ok = Object.values(out.pass).every(Boolean);
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
