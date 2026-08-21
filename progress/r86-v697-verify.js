/* v697 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-86-v697";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=697", { waitUntil: "domcontentloaded" });
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

    function townCanvas() {
      const canvases = [...document.querySelectorAll("canvas")];
      let best = null, area = 0;
      for (const c of canvases) {
        const a = c.width * c.height;
        if (a > area && c.width >= 400 && c.height >= 180 && c.height <= 320) { area = a; best = c; }
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

    if (MG.ui.kingdom.setPeriodOverride) MG.ui.kingdom.setPeriodOverride("day");
    for (let i = 0; i < 5; i++) if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now() + i * 280);
    await new Promise((r) => setTimeout(r, 120));
    const rabbit = sample(410, 165, 430, 180);
    const pigeon = sample(420, 65, 460, 95);

    if (MG.ui.kingdom.setPeriodOverride) MG.ui.kingdom.setPeriodOverride("dusk");
    for (let i = 0; i < 5; i++) if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now() + i * 280);
    await new Promise((r) => setTimeout(r, 120));
    const moth = sample(40, 95, 170, 125);

    st.settings.reducedMotion = true;
    if (MG.ui.kingdom.setPeriodOverride) MG.ui.kingdom.setPeriodOverride("day");
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(4000);
    const h1 = hashRoi(400, 60, 470, 185);
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(4000);
    const h2 = hashRoi(400, 60, 470, 185);

    return { rabbit, pigeon, moth, rmSame: h1 === h2, h1, h2 };
  });

  await page.screenshot({ path: path.join(OUT, TAG + "-town.png"), fullPage: false });
  const k = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  const asserts = [
    { name: "srcRabbit", ok: k.includes("v697 右田野兔") },
    { name: "srcMoth", ok: k.includes("v697 黃昏飛蛾") },
    { name: "srcPigeon", ok: k.includes("v697 風車鴿子") },
    { name: "roiRabbit", ok: r.rabbit > 0 },
    { name: "roiPigeon", ok: r.pigeon > 0 },
    { name: "roiMoth", ok: r.moth > 0 },
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
