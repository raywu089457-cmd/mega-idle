/* v667 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-56-v667";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=667", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    function sampleROI(data, x0, y0, x1, y1, pred) {
      let n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * 480 + x) * 4;
        if (data[i + 3] < 160) continue;
        if (pred(data[i], data[i + 1], data[i + 2])) n++;
      }
      return n;
    }
    function drawParts(particles) {
      const c = document.createElement("canvas");
      c.width = 480; c.height = 270;
      const ctx = c.getContext("2d");
      const view = { t: 1, team: [], monsters: [], floats: [], particles, projectiles: [], pal: { sky1: "#5ec8e5", sky2: "#2a6f9c", ground: "#4c8a3f", accent: "#ffe08a" }, rm: false };
      MG.ui.render.drawBattle(ctx, view);
      return ctx.getImageData(0, 0, 480, 270).data;
    }

    const green = sampleROI(drawParts([
      { kind: "regenpulse", cx: 310, cy: 215, r0: 10, r1: 34, life: 0.2, maxLife: 0.34, color: "#5af082", color2: "#e8ffe8" }
    ]), 270, 185, 350, 250, (r, g, b) => g > 180 && r < 160 && b < 180);

    const redSiphon = sampleROI(drawParts([
      { kind: "siphon", x0: 100, y0: 190, x1: 310, y1: 200, life: 0.2, maxLife: 0.28, color: "#ff5c5c", color2: "#ffd0d0" }
    ]), 120, 140, 300, 210, (r, g, b) => r > 200 && g < 140 && b < 140);

    const redShock = sampleROI(drawParts([
      { kind: "shockwave", cx: 240, cy: 232, r0: 18, r1: 72, life: 0.18, maxLife: 0.32, color: "#ff5c5c", color2: "#ffb0b0" }
    ]), 160, 200, 320, 260, (r, g, b) => r > 200 && g < 150 && b < 150);

    st.settings.reducedMotion = true;
    const cRm = document.createElement("canvas");
    cRm.width = 480; cRm.height = 270;
    const ctxRm = cRm.getContext("2d");
    MG.ui.render.drawBattle(ctxRm, {
      t: 1, team: [], monsters: [], floats: [],
      particles: [
        { kind: "regenpulse", cx: 310, cy: 215, r0: 10, r1: 34, life: 0.2, maxLife: 0.34, color: "#5af082", color2: "#e8ffe8" },
        { kind: "siphon", x0: 100, y0: 190, x1: 310, y1: 200, life: 0.2, maxLife: 0.28, color: "#ff5c5c", color2: "#ffd0d0" },
        { kind: "shockwave", cx: 240, cy: 232, r0: 18, r1: 72, life: 0.18, maxLife: 0.32, color: "#ff5c5c", color2: "#ffb0b0" }
      ],
      projectiles: [], pal: { sky1: "#5ec8e5", sky2: "#2a6f9c", ground: "#4c8a3f", accent: "#ffe08a" }, rm: true
    });
    const dRm = ctxRm.getImageData(0, 0, 480, 270).data;
    const greenRm = sampleROI(dRm, 270, 185, 350, 250, (r, g, b) => g > 180 && r < 160 && b < 180);
    const redRm = sampleROI(dRm, 120, 140, 320, 260, (r, g, b) => r > 200 && g < 150 && b < 150);

    // source hooks present
    const src = (MG.ui.hunt && true);
    return { green, redSiphon, redShock, greenRm, redRm, src };
  });

  // draw showcase frame for screenshot
  await page.evaluate(() => {
    const st = MG.game.state;
    st.settings.reducedMotion = false;
  });
  await page.screenshot({ path: path.join(OUT, TAG + "-hunt.png"), fullPage: false });

  const out = {
    ok: !errs.length && r.green > 20 && r.redSiphon > 15 && r.redShock > 8 && r.greenRm < 5 && r.redRm < 5,
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
