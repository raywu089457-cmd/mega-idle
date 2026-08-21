/* v693 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-82-v693";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=693", { waitUntil: "domcontentloaded" });
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
    ["castle", "forge", "guild", "market", "alchemy", "barracks", "temple", "tower", "warehouse", "farm"].forEach((k) => {
      st.buildings[k] = Math.max(1, st.buildings[k] || 0);
    });

    const nav = [...document.querySelectorAll("button, .tab")].find((b) => /王國/.test(b.textContent || ""));
    if (nav) nav.click();
    await new Promise((r) => setTimeout(r, 200));

    if (MG.ui.kingdom.setPeriodOverride) MG.ui.kingdom.setPeriodOverride("day");
    for (let i = 0; i < 6; i++) {
      if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now() + i * 300);
    }
    await new Promise((r) => setTimeout(r, 150));

    function townCanvas() {
      const canvases = [...document.querySelectorAll("canvas")];
      let best = null, area = 0;
      for (const c of canvases) {
        const a = c.width * c.height;
        if (a > area && c.width >= 400 && c.height >= 180 && c.height <= 320) { area = a; best = c; }
      }
      if (!best) {
        for (const c of canvases) {
          const a = c.width * c.height;
          if (a > area && c.width >= 400) { area = a; best = c; }
        }
      }
      return best;
    }
    function sample(x0, y0, x1, y1) {
      const best = townCanvas();
      if (!best) return 0;
      const d = best.getContext("2d").getImageData(x0, y0, x1 - x0, y1 - y0).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 30) n++;
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

    // lizard / frog / crow ROIs (town 480 coords ≈ canvas if 1:1)
    const lizard = sample(315, 165, 335, 180);
    const frog = sample(182, 162, 200, 178);
    const crow = sample(45, 145, 62, 168);

    st.settings.reducedMotion = true;
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(3000);
    const h1 = hashRoi(40, 140, 340, 185);
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(3000);
    const h2 = hashRoi(40, 140, 340, 185);

    return { lizard, frog, crow, rmSame: h1 === h2, h1, h2, cw: townCanvas() && townCanvas().width, ch: townCanvas() && townCanvas().height };
  });

  await page.screenshot({ path: path.join(OUT, TAG + "-town.png"), fullPage: false });
  const k = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  const asserts = [
    { name: "srcLizard", ok: k.includes("v693 石堆蜥蜴") },
    { name: "srcFrog", ok: k.includes("v693 水井青蛙") },
    { name: "srcCrow", ok: k.includes("v693 稻草人烏鴉") },
    { name: "roiLizard", ok: r.lizard > 0 },
    { name: "roiFrog", ok: r.frog > 0 },
    { name: "roiCrow", ok: r.crow > 0 },
    { name: "rmSame", ok: !!r.rmSame },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, r, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
