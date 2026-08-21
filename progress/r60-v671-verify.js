/* v671 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-60-v671";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=671", { waitUntil: "domcontentloaded" });
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
      MG.ui.render.drawBattle(ctx, {
        t: 1, team: [], monsters: [], floats: [], particles, projectiles: [],
        pal: { sky1: "#5ec8e5", sky2: "#2a6f9c", ground: "#4c8a3f", accent: "#ffe08a" }, rm: false
      });
      return ctx.getImageData(0, 0, 480, 270).data;
    }

    const pink = sampleROI(drawParts([
      { kind: "bossburst", cx: 240, cy: 150, r0: 8, r1: 42, life: 0.22, maxLife: 0.42, color: "#ff5c8a", color2: "#ffd0e0" }
    ]), 190, 100, 290, 200, (r, g, b) => r > 200 && g < 160 && b > 100 && b < 200);

    const purple = sampleROI(drawParts([
      { kind: "elitegate", cx: 240, cy: 150, s0: 6, s1: 22, life: 0.2, maxLife: 0.36, color: "#c792ea", color2: "#f0d8ff" }
    ]), 210, 120, 270, 180, (r, g, b) => r > 150 && g > 100 && b > 180);

    const wisp = sampleROI(drawParts([
      { kind: "shard", x: 100, y: 180, vx: 0, vy: -0.5, gravity: 0, life: 0.3, maxLife: 0.4, color: "#ff6b6b", size: 3 },
      { kind: "shard", x: 108, y: 176, vx: 0, vy: -0.5, gravity: 0, life: 0.3, maxLife: 0.4, color: "#c792ea", size: 3 },
      { kind: "shard", x: 116, y: 172, vx: 0, vy: -0.5, gravity: 0, life: 0.3, maxLife: 0.4, color: "#ff9ac8", size: 3 }
    ]), 90, 160, 130, 190, (r, g, b) => (r > 180 && g < 150) || (b > 180 && r > 140));

    st.settings.reducedMotion = true;
    const cRm = document.createElement("canvas");
    cRm.width = 480; cRm.height = 270;
    const ctxRm = cRm.getContext("2d");
    MG.ui.render.drawBattle(ctxRm, {
      t: 1, team: [], monsters: [], floats: [],
      particles: [
        { kind: "bossburst", cx: 240, cy: 150, r0: 8, r1: 42, life: 0.22, maxLife: 0.42, color: "#ff5c8a", color2: "#ffd0e0" },
        { kind: "elitegate", cx: 240, cy: 150, s0: 6, s1: 22, life: 0.2, maxLife: 0.36, color: "#c792ea", color2: "#f0d8ff" }
      ],
      projectiles: [], pal: { sky1: "#5ec8e5", sky2: "#2a6f9c", ground: "#4c8a3f", accent: "#ffe08a" }, rm: true
    });
    const dRm = ctxRm.getImageData(0, 0, 480, 270).data;
    const pinkRm = sampleROI(dRm, 190, 100, 290, 200, (r, g, b) => r > 200 && g < 160 && b > 100 && b < 200);

    const huntSrc = !!(MG.ui.hunt);
    return { pink, purple, wisp, pinkRm, huntSrc };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-hunt.png") });
  const out = {
    ok: !errs.length && r.pink > 15 && r.purple > 10 && r.wisp > 5 && r.pinkRm < 5
      && k.includes("spawnBossBurst") && k.includes("spawnEliteGate") && k.includes("spawnDownWisp")
      && rend.includes("bossburst") && rend.includes("elitegate"),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
