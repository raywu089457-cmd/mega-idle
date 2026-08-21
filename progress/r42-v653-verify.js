/* v653: 廣場小狗 — ROI 棕色像素 + rm hash + 截圖 */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

const OUT = path.join(__dirname);
const TAG = "round-42-v653";
const DOG = { body: [0xc8, 0x91, 0x5c], ear: [0xa0, 0x6a, 0x40], eye: [0xff, 0xf3, 0xc8] };

function near(r, g, b, [tr, tg, tb], tol = 22) {
  return Math.abs(r - tr) <= tol && Math.abs(g - tg) <= tol && Math.abs(b - tb) <= tol;
}

function sampleFx(data, w, x0, y0, x1, y1) {
  const hits = { body: 0, ear: 0, eye: 0 };
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a < 8) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (near(r, g, b, DOG.body)) hits.body++;
      if (near(r, g, b, DOG.ear)) hits.ear++;
      if (near(r, g, b, DOG.eye)) hits.eye++;
    }
  }
  return hits;
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
    await page.goto("http://127.0.0.1:8123/index.html?v=653", { waitUntil: "domcontentloaded" });
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
      // 強制以 t=0 重繪一次，排除 rAF 時間差；rm 下狗應定在 x=240
      if (MG.ui.kingdom && typeof MG.ui.kingdom.raf === "function") {
        MG.ui.kingdom.raf(0);
      }
      const ctx = fx.getContext("2d");
      const img = ctx.getImageData(200, 165, 130, 25); // dog strip only
      return { data: Array.from(img.data), w: 130, h: 25 };
    });

    if (probe.err) throw new Error(probe.err);
    const data = Uint8ClampedArray.from(probe.data);
    // sampleFx expects full-canvas coords — remap: local strip starts at 0,0 ≡ canvas 200,165
    const hits = { body: 0, ear: 0, eye: 0 };
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 8) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (near(r, g, b, DOG.body)) hits.body++;
      if (near(r, g, b, DOG.ear)) hits.ear++;
      if (near(r, g, b, DOG.eye)) hits.eye++;
    }
    const hash = hashRGBA(data);

    await page.screenshot({ path: path.join(OUT, `${TAG}-kingdom-${tag}.png`) });
    const fxBox = await page.evaluate(() => {
      const wrap = [...document.querySelectorAll("canvas")].find((c) => c.width === 480 && c.height === 200);
      if (!wrap) return null;
      const r = wrap.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    if (fxBox) {
      // crop dog strip ~ middle of canvas
      const sx = fxBox.x + fxBox.width * (190 / 480);
      const sy = fxBox.y + fxBox.height * (160 / 200);
      const sw = fxBox.width * (140 / 480);
      const sh = fxBox.height * (40 / 200);
      await page.screenshot({
        path: path.join(OUT, `${TAG}-dog-4x-${tag}.png`),
        clip: { x: sx, y: sy, width: sw, height: sh }
      });
    }

    // also dump fx canvas PNG via toDataURL for ground truth
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
    bodyOk: live.hits.body >= 8,
    earOk: live.hits.ear >= 1,
    eyeOk: live.hits.eye >= 1,
    errs
  };
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  if (!out.bodyOk || !out.rmHashSame || errs.length) process.exit(2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
