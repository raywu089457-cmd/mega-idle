/* v679 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-68-v679";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=679", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    function countDelta(parts, x0, y0, x1, y1, rm) {
      function draw(particles, rmFlag) {
        const c = document.createElement("canvas");
        c.width = 480; c.height = 270;
        const ctx = c.getContext("2d");
        MG.ui.render.drawBattle(ctx, {
          t: 1, team: [], monsters: [], floats: [], particles, projectiles: [],
          pal: { sky1: "#5ec8e5", sky2: "#2a6f9c", ground: "#4c8a3f", accent: "#ffe08a" }, rm: !!rmFlag
        });
        return ctx.getImageData(0, 0, 480, 270).data;
      }
      const a = draw([], rm);
      const b = draw(parts, rm);
      let n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * 480 + x) * 4;
        const dr = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
        if (dr > 18) n++;
      }
      return n;
    }

    const portal = countDelta([
      { kind: "homeportal", cx: 240, cy: 150, r0: 8, r1: 44, life: 0.22, maxLife: 0.42, color: "#6ac8ff", color2: "#d8f0ff" }
    ], 180, 110, 300, 190, false);

    const flare = countDelta([
      { kind: "regionflare", cx: 240, cy: 140, r0: 12, r1: 56, life: 0.24, maxLife: 0.48, color: "#ffd166", color2: "#fff3c4" }
    ], 180, 90, 300, 190, false);

    const glow = countDelta([
      { kind: "buffglow", cx: 100, cy: 180, r0: 6, r1: 26, life: 0.22, maxLife: 0.4, color: "#9ad8ff", color2: "#e0f4ff" }
    ], 70, 150, 130, 210, false);

    st.settings.reducedMotion = true;
    const portalRm = countDelta([
      { kind: "homeportal", cx: 240, cy: 150, r0: 8, r1: 44, life: 0.22, maxLife: 0.42, color: "#6ac8ff", color2: "#d8f0ff" }
    ], 180, 110, 300, 190, true);

    return { portal, flare, glow, portalRm };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-hunt.png") });
  const out = {
    ok: !errs.length && r.portal > 20 && r.flare > 20 && r.glow > 10 && r.portalRm < 5
      && k.includes("spawnHomePortal") && k.includes("spawnRegionFlare") && k.includes("spawnBuffGlow")
      && rend.includes("homeportal") && rend.includes("regionflare") && rend.includes("buffglow"),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
