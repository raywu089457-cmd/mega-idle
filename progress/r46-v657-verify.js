/* v657: 市場攤 ROI + rm hash */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

const OUT = path.join(__dirname);
const TAG = "round-46-v657";
const COLS = {
  canopy: [0xe0, 0x70, 0x70],
  apple: [0xff, 0x7a, 0x6a],
  bread: [0xff, 0xd1, 0x66],
  bottle: [0x6a, 0xc8, 0xff],
  wood: [0x8a, 0x62, 0x38]
};
function near(r, g, b, t, tol = 28) {
  return Math.abs(r - t[0]) <= tol && Math.abs(g - t[1]) <= tol && Math.abs(b - t[2]) <= tol;
}
function hashRGBA(data) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < data.length; i++) {
    h ^= data[i];
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];

  async function run(rmMode, tag) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(String(e.message || e)));
    await page.goto("http://127.0.0.1:8123/index.html?v=657", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.MG && MG.game && MG.game.state);
    await page.evaluate((rm) => {
      const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
      if (skip) skip.click();
      MG.game.state.tutorial = 99;
      MG.game.state.settings.reducedMotion = !!rm;
      MG.game.state.wanderers = [];
      document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());
      MG.ui.screens.show("kingdom");
    }, rmMode);
    await page.waitForTimeout(400);
    const probe = await page.evaluate(() => {
      const fx = [...document.querySelectorAll("canvas")].find(
        (c) => c.width === 480 && c.height === 200 && getComputedStyle(c).pointerEvents === "none"
      );
      if (!fx) return { err: "no-fx" };
      if (MG.ui.kingdom && typeof MG.ui.kingdom.raf === "function") MG.ui.kingdom.raf(0);
      const ctx = fx.getContext("2d");
      const img = ctx.getImageData(330, 150, 40, 35);
      return { data: Array.from(img.data) };
    });
    if (probe.err) throw new Error(probe.err);
    const data = Uint8ClampedArray.from(probe.data);
    const hits = { canopy: 0, apple: 0, bread: 0, bottle: 0, wood: 0 };
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 8) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      for (const k of Object.keys(COLS)) if (near(r, g, b, COLS[k])) hits[k]++;
    }
    const hash = hashRGBA(data);
    await page.screenshot({ path: path.join(OUT, `${TAG}-kingdom-${tag}.png`) });
    const fxBox = await page.evaluate(() => {
      const fx = [...document.querySelectorAll("canvas")].find(
        (c) => c.width === 480 && c.height === 200 && getComputedStyle(c).pointerEvents === "none"
      );
      if (!fx) return null;
      const r = fx.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    if (fxBox) {
      await page.screenshot({
        path: path.join(OUT, `${TAG}-stall-4x-${tag}.png`),
        clip: {
          x: fxBox.x + fxBox.width * (330 / 480),
          y: fxBox.y + fxBox.height * (148 / 200),
          width: fxBox.width * (50 / 480),
          height: fxBox.height * (40 / 200)
        }
      });
    }
    const pngB64 = await page.evaluate(() => {
      const fx = [...document.querySelectorAll("canvas")].find(
        (c) => c.width === 480 && c.height === 200 && getComputedStyle(c).pointerEvents === "none"
      );
      return fx ? fx.toDataURL("image/png").split(",")[1] : null;
    });
    if (pngB64) fs.writeFileSync(path.join(OUT, `${TAG}-fx-${tag}.png`), Buffer.from(pngB64, "base64"));
    await ctx.close();
    return { rm: !!rmMode, hits, hash, hitKeys: Object.keys(hits).filter((k) => hits[k] > 0) };
  }

  const live = await run(false, "live");
  const rm1 = await run(true, "rm");
  const rm2 = await run(true, "rm2");
  const out = {
    live, rm1, rm2,
    rmHashSame: rm1.hash === rm2.hash,
    goodsOk: live.hits.apple >= 2 && live.hits.bread >= 2 && live.hits.bottle >= 2,
    canopyOk: live.hits.canopy >= 8,
    errs
  };
  out.ok = out.rmHashSame && out.goodsOk && out.canopyOk && errs.length === 0;
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
