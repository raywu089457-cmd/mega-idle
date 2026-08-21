/* v641-fix2: 重拍無教學 modal 的王國動物證據圖
   用法: node progress/v641-fix2-capture.js
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

const PORT = 8123;
const OUT = path.join(__dirname);
const TAG = "round-30-v641-fix2";

// 雞/豬色票（heroes.js a_chicken / a_pig 實際 hex）
const CHICKEN = { O: [0x14, 0x12, 0x1f], W: [0xd8, 0xdc, 0xe8], Y: [0xff, 0xd1, 0x66], S: [0x9a, 0xa0, 0xb8] };
const PIG = { O: [0x14, 0x12, 0x1f], P: [0xe8, 0xa8, 0xb8], D: [0xc8, 0x78, 0x98], N: [0x8a, 0x50, 0x68] };

function near(r, g, b, [tr, tg, tb], tol = 28) {
  return Math.abs(r - tr) <= tol && Math.abs(g - tg) <= tol && Math.abs(b - tb) <= tol;
}

async function skipTutorial(page) {
  await page.waitForFunction(() => !!(window.MG && MG.game && MG.game.state), null, { timeout: 15000 });
  await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    if (st.settings) st.settings.reducedMotion = false;
    try { MG.core.save.save(); } catch (_) {}
    // 關掉任何殘留 tut overlay
    document.querySelectorAll(".tut, .tut-card").forEach((el) => el.remove());
  });
  await page.waitForTimeout(400);
  // 確保在王國頁
  await page.evaluate(() => {
    if (MG.ui && MG.ui.screens && MG.ui.screens.show) MG.ui.screens.show("kingdom");
  });
  await page.waitForTimeout(800);
  const blocked = await page.evaluate(() => {
    const tut = document.querySelector(".tut, .tut-card");
    return !!(tut && tut.offsetParent !== null);
  });
  if (blocked) throw new Error("tutorial still visible after skip");
}

async function sampleFx(page) {
  return page.evaluate(({ CHICKEN, PIG }) => {
    const fx = document.querySelector("canvas.fx, canvas#fx, .town-fx canvas") ||
      [...document.querySelectorAll("canvas")].find((c) => c.width === 480 && c.height === 200 && c !== document.querySelector("canvas.town, #town"));
    // kingdom town stack: usually two 480×200 canvases — base + fx
    const canvases = [...document.querySelectorAll("canvas")].filter((c) => c.width === 480 && c.height === 200);
    const fxC = canvases[canvases.length - 1] || canvases[0];
    if (!fxC) return { fatal: "no 480x200 canvas" };
    const g = fxC.getContext("2d");
    const rois = [
      { name: "chickenA", x: 35, y: 170, pal: CHICKEN },
      { name: "chickenB", x: 435, y: 170, pal: CHICKEN },
      { name: "pigC", x: 280, y: 170, pal: PIG }
    ];
    const out = { w: fxC.width, h: fxC.height, rois: {} };
    for (const r of rois) {
      const img = g.getImageData(r.x, r.y, 24, 24).data;
      const hits = {};
      for (const [k, rgb] of Object.entries(r.pal)) hits[k] = 0;
      for (let i = 0; i < img.length; i += 4) {
        const a = img[i + 3];
        if (a < 8) continue;
        const rgb = [img[i], img[i + 1], img[i + 2]];
        for (const [k, target] of Object.entries(r.pal)) {
          if (Math.abs(rgb[0] - target[0]) <= 28 && Math.abs(rgb[1] - target[1]) <= 28 && Math.abs(rgb[2] - target[2]) <= 28) hits[k]++;
        }
      }
      const hitKeys = Object.keys(hits).filter((k) => hits[k] > 0);
      out.rois[r.name] = { hits, hitKeys, pass: hitKeys.length >= 2 };
    }
    // export fx canvas png dataURL
    out.dataURL = fxC.toDataURL("image/png");
    return out;
  }, { CHICKEN, PIG });
}

async function cropAnimalBand4x(page, outPath) {
  // 對村莊 canvas 地面帶 y≈150-200 裁切並 4× 放大
  const dataUrl = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll("canvas")].filter((c) => c.width === 480 && c.height === 200);
    if (!canvases.length) return null;
    // 合成 base+fx
    const out = document.createElement("canvas");
    out.width = 480;
    out.height = 50; // y 150-200
    const o = out.getContext("2d");
    for (const c of canvases) o.drawImage(c, 0, 150, 480, 50, 0, 0, 480, 50);
    const big = document.createElement("canvas");
    big.width = 480 * 4;
    big.height = 50 * 4;
    const b = big.getContext("2d");
    b.imageSmoothingEnabled = false;
    b.drawImage(out, 0, 0, big.width, big.height);
    return big.toDataURL("image/png");
  });
  if (!dataUrl) throw new Error("animal band crop failed");
  fs.writeFileSync(outPath, Buffer.from(dataUrl.split(",")[1], "base64"));
}

async function shot(page, name, opts = {}) {
  const p = path.join(OUT, `${TAG}-${name}.png`);
  await page.screenshot({ path: p, fullPage: false, ...opts });
  return p;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const report = { errs: [], samples: {}, files: [] };

  // —— Desktop ——
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => report.errs.push("desktop:" + e.message));
    await page.goto(`http://127.0.0.1:${PORT}/index.html?v=641-fix2-cap`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await skipTutorial(page);
    report.files.push(await shot(page, "kingdom-desktop"));
    report.files.push(await shot(page, "kingdom-after")); // clean after
    await cropAnimalBand4x(page, path.join(OUT, `${TAG}-kingdom-4x.png`));
    report.files.push(`${TAG}-kingdom-4x.png`);
    const samp = await sampleFx(page);
    report.samples.desktop = { rois: samp.rois, w: samp.w, h: samp.h };
    if (samp.dataURL) {
      fs.writeFileSync(path.join(OUT, `${TAG}-fx-canvas.png`), Buffer.from(samp.dataURL.split(",")[1], "base64"));
      report.files.push(`${TAG}-fx-canvas.png`);
    }
    await ctx.close();
  }

  // —— Mobile ——
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => report.errs.push("mobile:" + e.message));
    await page.goto(`http://127.0.0.1:${PORT}/index.html?v=641-fix2-mob`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await skipTutorial(page);
    report.files.push(await shot(page, "kingdom-mobile"));
    await ctx.close();
  }

  // —— RM ——
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => report.errs.push("rm:" + e.message));
    await page.goto(`http://127.0.0.1:${PORT}/index.html?v=641-fix2-rm`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await skipTutorial(page);
    await page.evaluate(() => {
      MG.game.state.settings.reducedMotion = true;
      try { MG.core.save.save(); } catch (_) {}
      if (MG.ui && MG.ui.screens) MG.ui.screens.show("kingdom");
    });
    await page.waitForTimeout(600);
    report.files.push(await shot(page, "kingdom-rm"));
    const samp = await sampleFx(page);
    report.samples.rm = { rois: samp.rois };
    await ctx.close();
  }

  // 覆蓋無效原始檔（評審要求）
  const overwrite = [
    "round-30-v641-kingdom-rm.png",
    "round-30-v641-kingdom-4x.png",
    "round-30-v641-fx-canvas.png"
  ];
  for (const f of overwrite) {
    const srcMap = {
      "round-30-v641-kingdom-rm.png": `${TAG}-kingdom-rm.png`,
      "round-30-v641-kingdom-4x.png": `${TAG}-kingdom-4x.png`,
      "round-30-v641-fx-canvas.png": `${TAG}-fx-canvas.png`
    };
    const src = path.join(OUT, srcMap[f]);
    const dst = path.join(OUT, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, dst);
  }

  fs.writeFileSync(path.join(OUT, `${TAG}-report.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  const failRoi = Object.values(report.samples.desktop?.rois || {}).some((r) => !r.pass);
  if (failRoi || report.errs.length) process.exit(2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
