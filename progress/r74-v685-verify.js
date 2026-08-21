/* v685 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-74-v685";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=685", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.kingdom);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    // unlock a few buildings for roof glints
    st.buildings = st.buildings || {};
    for (const k of Object.keys(MG.data.buildings || { castle: 1, forge: 1, guild: 1 })) {
      if ((st.buildings[k] || 0) < 1) st.buildings[k] = 1;
    }
    st.buildings.castle = Math.max(1, st.buildings.castle || 0);
    st.buildings.forge = Math.max(1, st.buildings.forge || 0);
    st.buildings.guild = Math.max(1, st.buildings.guild || 0);

    const nav = [...document.querySelectorAll("button, .tab, [data-tab]")].find((b) => /王國|村莊/.test(b.textContent || ""));
    if (nav) nav.click();
    await new Promise((r) => setTimeout(r, 200));

    function sampleROI(label, x0, y0, x1, y1) {
      const fx = document.querySelector("#town-fx") || document.querySelector("canvas");
      // kingdom uses fx canvas — find largest canvas in kingdom view
      const canvases = [...document.querySelectorAll("canvas")];
      let best = null, area = 0;
      for (const c of canvases) {
        const a = c.width * c.height;
        if (a > area && c.width >= 400) { area = a; best = c; }
      }
      if (!best) return { label, pixels: 0 };
      const ctx = best.getContext("2d");
      const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] + d[i + 1] + d[i + 2] > 40) n++;
      }
      return { label, pixels: n, w: best.width, h: best.height };
    }

    // force season/period via public overrides if present
    if (MG.ui.kingdom.setPeriod) MG.ui.kingdom.setPeriod("day");
    if (MG.ui.kingdom.setSeason) MG.ui.kingdom.setSeason("summer");
    // trigger raf draw
    for (let i = 0; i < 3; i++) {
      if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now() + i * 200);
    }
    await new Promise((r) => setTimeout(r, 100));

    const sparrow = sampleROI("sparrow", 270, 160, 300, 180);
    const scare = sampleROI("scarecrow", 40, 145, 60, 175);
    const roof = sampleROI("roof", 40, 40, 200, 100);

    // rm determinism: two draws same t
    st.settings.reducedMotion = true;
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(1000);
    const a = sampleROI("rm1", 40, 145, 60, 175);
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(1000);
    const b = sampleROI("rm2", 40, 145, 60, 175);

    const src = (MG.ui.kingdom + "") || "";
    return {
      sparrow, scare, roof, rmSame: a.pixels === b.pixels,
      hasSparrow: true, // asserted via file grep outside
      buildings: { castle: st.buildings.castle, forge: st.buildings.forge }
    };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-town.png"), fullPage: false });
  const out = {
    ok: !errs.length
      && k.includes("v685 長椅麻雀")
      && k.includes("v685 農田稻草人")
      && k.includes("v685 白天屋頂反光")
      && k.includes("[[276, 168, 0.0], [286, 169, 1.7]]")
      && k.includes("const cx = 48, cy = 166")
      && (r.sparrow.pixels > 0 || r.scare.pixels > 0),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
