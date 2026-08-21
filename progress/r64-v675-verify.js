/* v675 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-64-v675";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=675", { waitUntil: "domcontentloaded" });
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
        if (data[i + 3] < 120) continue;
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

    function countDelta(parts, x0, y0, x1, y1) {
      const a = drawParts([]);
      const b = drawParts(parts);
      let n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * 480 + x) * 4;
        const dr = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
        if (dr > 18) n++;
      }
      return n;
    }

    const gold = countDelta([
      { kind: "levelburst", cx: 240, cy: 150, r0: 4, r1: 28, life: 0.2, maxLife: 0.36, color: "#ffd166", color2: "#fff3c4" }
    ], 210, 120, 270, 180);

    const veil = sampleROI(drawParts([
      { kind: "retreatveil", cx: 240, cy: 150, r0: 20, r1: 120, life: 0.28, maxLife: 0.5, color: "#2a3558", color2: "#1a2038" }
    ]), 160, 100, 320, 200, (r, g, b) => r < 80 && g < 90 && b > 60 && b < 140);

    const green = sampleROI(drawParts([
      { kind: "resumering", cx: 240, cy: 150, r0: 10, r1: 48, life: 0.22, maxLife: 0.38, color: "#7ee787", color2: "#e8ffe8" }
    ]), 190, 100, 290, 200, (r, g, b) => g > 180 && r < 180 && b < 180);

    st.settings.reducedMotion = true;
    function drawRm(particles) {
      const c = document.createElement("canvas");
      c.width = 480; c.height = 270;
      const ctx = c.getContext("2d");
      MG.ui.render.drawBattle(ctx, {
        t: 1, team: [], monsters: [], floats: [], particles, projectiles: [],
        pal: { sky1: "#5ec8e5", sky2: "#2a6f9c", ground: "#4c8a3f", accent: "#ffe08a" }, rm: true
      });
      return ctx.getImageData(0, 0, 480, 270).data;
    }
    function countDeltaRm(parts, x0, y0, x1, y1) {
      const a = drawRm([]);
      const b = drawRm(parts);
      let n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * 480 + x) * 4;
        const dr = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
        if (dr > 18) n++;
      }
      return n;
    }
    const goldRm = countDeltaRm([
      { kind: "levelburst", cx: 240, cy: 150, r0: 4, r1: 28, life: 0.2, maxLife: 0.36, color: "#ffd166", color2: "#fff3c4" }
    ], 210, 120, 270, 180);
    const greenRm = countDeltaRm([
      { kind: "resumering", cx: 240, cy: 150, r0: 10, r1: 48, life: 0.22, maxLife: 0.38, color: "#7ee787", color2: "#e8ffe8" }
    ], 190, 100, 290, 200);

    return { gold, veil, green, goldRm, greenRm };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-hunt.png") });
  const checks = {
    noErr: !errs.length,
    gold: r.gold > 10,
    veil: r.veil > 30,
    green: r.green > 10,
    goldRm: r.goldRm < 5,
    greenRm: r.greenRm < 5,
    spawnA: k.includes("spawnLevelBurst"),
    spawnB: k.includes("spawnRetreatVeil"),
    spawnC: k.includes("spawnResumeRing"),
    noRand: !/case \"levelup\":[\s\S]{0,120}Math\.random\s*\(/.test(k)
      && k.includes("spawnLevelBurst(hx + 8, hy + 2)"),
    drawA: rend.includes("levelburst"),
    drawB: rend.includes("retreatveil"),
    drawC: rend.includes("resumering")
  };
  const out = {
    ok: Object.values(checks).every(Boolean),
    checks, r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
