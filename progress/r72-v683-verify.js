/* v683 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-72-v683";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=683", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    function countDelta(parts) {
      function draw(particles) {
        const c = document.createElement("canvas");
        c.width = 480; c.height = 270;
        const ctx = c.getContext("2d");
        MG.ui.render.drawBattle(ctx, {
          t: 1, team: [], monsters: [], floats: [], particles, projectiles: [],
          pal: { sky1: "#5ec8e5", sky2: "#2a6f9c", ground: "#4c8a3f", accent: "#ffe08a" }, rm: false
        });
        return ctx.getImageData(0, 0, 480, 270).data;
      }
      const a = draw([]), b = draw(parts);
      let n = 0;
      for (let y = 100; y < 200; y++) for (let x = 180; x < 300; x++) {
        const i = (y * 480 + x) * 4;
        const dr = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
        if (dr > 18) n++;
      }
      return n;
    }

    const clear = countDelta([
      { kind: "clearring", cx: 240, cy: 150, r0: 14, r1: 58, life: 0.22, maxLife: 0.44, color: "#c8d0e0", color2: "#ffffff" }
    ]);
    const flare = countDelta([
      { kind: "regionflare", cx: 240, cy: 140, r0: 12, r1: 56, life: 0.24, maxLife: 0.48, color: "#ffd166", color2: "#fff3c4" }
    ]);

    st.settings.reducedMotion = true;
    const clearRm = countDelta([
      { kind: "clearring", cx: 240, cy: 150, r0: 14, r1: 58, life: 0.22, maxLife: 0.44, color: "#c8d0e0", color2: "#ffffff" }
    ]);

    return { clear, flare, clearRm };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-hunt.png") });
  const out = {
    ok: !errs.length && r.clear > 20 && r.flare > 20 && r.clearRm < 5
      && k.includes("spawnClearRing") && k.includes("危血紅邊")
      && k.includes("spawnRegionFlare(240, 150)")
      && rend.includes("clearring"),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
