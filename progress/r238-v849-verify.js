/* v849 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-238-v849";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=849", { waitUntil: "domcontentloaded" });
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
    ["castle", "forge", "guild", "market", "alchemy", "library", "warehouse", "altar", "training", "gemworks"].forEach((k) => {
      st.buildings[k] = Math.max(1, st.buildings[k] || 0);
    });
    const nav = [...document.querySelectorAll("button, .tab")].find((b) => /王國/.test(b.textContent || ""));
    if (nav) nav.click();
    await new Promise((r) => setTimeout(r, 200));

    function townCanvas() {
      const canvases = [...document.querySelectorAll("canvas")];
      const fx = canvases.find((c) => c.width === 480 && c.height === 200 && /absolute/.test(c.style.cssText || c.getAttribute("style") || ""));
      if (fx) return fx;
      let best = null, area = 0;
      for (const c of canvases) {
        const a = c.width * c.height;
        if (a > area && c.width >= 400 && c.height >= 180 && c.height <= 320) { area = a; best = c; }
      }
      return best;
    }
    function countColor(x0, y0, x1, y1, pred) {
      const best = townCanvas();
      if (!best) return 0;
      const d = best.getContext("2d").getImageData(x0, y0, x1 - x0, y1 - y0).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 20) continue;
        if (pred(d[i], d[i + 1], d[i + 2])) n++;
      }
      return n;
    }
    function hashRoi(x0, y0, x1, y1) {
      const best = townCanvas();
      if (!best) return "";
      const d = best.getContext("2d").getImageData(x0, y0, x1 - x0, y1 - y0).data;
      let h = 0;
      for (let i = 0; i < d.length; i++) h = (h * 31 + d[i]) >>> 0;
      return h.toString(16);
    }

    if (MG.ui.kingdom.setPeriodOverride) MG.ui.kingdom.setPeriodOverride("day");
    for (let i = 0; i < 10; i++) if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now() + i * 280);
    await new Promise((r) => setTimeout(r, 150));
    // keg ~168,105
    const keg = countColor(166, 103, 182, 118, (r, g, b) =>
      (r > 100 && g > 60 && b < 90) || (r > 180 && g > 180 && b > 160) || (r > 90 && g > 90 && b > 100 && Math.abs(r - g) < 40));
    // mortar ~108,138
    const mortar = countColor(106, 136, 122, 150, (r, g, b) =>
      (r > 90 && g > 90 && b > 100 && Math.abs(r - g) < 40) || (g > r && g > 100 && b < 140) || (r > 100 && g > 60 && b < 90));
    // loupe ~378,128
    const loupe = countColor(376, 126, 392, 140, (r, g, b) =>
      (r > 180 && g > 140 && b < 120) || (b > r && b > 140) || (r > 200 && g > 200 && b > 200));

    st.settings.reducedMotion = true;
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(6000);
    const h1a = hashRoi(166, 103, 182, 118);
    const h1b = hashRoi(106, 136, 122, 150);
    const h1c = hashRoi(376, 126, 392, 140);
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(6000);
    const h2a = hashRoi(166, 103, 182, 118);
    const h2b = hashRoi(106, 136, 122, 150);
    const h2c = hashRoi(376, 126, 392, 140);

    return { keg, mortar, loupe, rmSame: h1a === h2a && h1b === h2b && h1c === h2c };
  });

  await page.screenshot({ path: path.join(OUT, TAG + "-town.png"), fullPage: false });
  const k = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  const asserts = [
    { name: "srcKeg", ok: k.includes("v849 酒館酒桶") },
    { name: "srcMortar", ok: k.includes("v849 煉金研缽") },
    { name: "srcLoupe", ok: k.includes("v849 寶石放大鏡") },
    { name: "kegROI", ok: r.keg >= 6 },
    { name: "mortarROI", ok: r.mortar >= 6 },
    { name: "loupeROI", ok: r.loupe >= 6 },
    { name: "rmSame", ok: r.rmSame },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, r, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, r }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
