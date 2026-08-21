/* v738 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-127-v738";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=738", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.render);
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
      for (let y = 100; y < 220; y++) for (let x = 180; x < 340; x++) {
        const i = (y * 480 + x) * 4;
        const dr = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
        if (dr > 18) n++;
      }
      return n;
    }

    const crit = countDelta([{ kind: "critskill", cx: 240, cy: 150, r0: 7, r1: 28, life: 0.17, maxLife: 0.34, color: "#ffd166", color2: "#fff3c4" }]);
    const leech = countDelta([{ kind: "leechmark", cx: 240, cy: 150, r0: 6, r1: 24, life: 0.18, maxLife: 0.36, color: "#57c96b", color2: "#c8f5c8" }]);
    const chill = countDelta([{ kind: "chillmark", cx: 240, cy: 150, r0: 7, r1: 28, life: 0.17, maxLife: 0.34, color: "#a0e0ff", color2: "#ffffff" }]);
    return { crit, leech, chill };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  const asserts = [
    { name: "deltaCrit", ok: r.crit > 20 },
    { name: "deltaLeech", ok: r.leech > 20 },
    { name: "deltaChill", ok: r.chill > 20 },
    { name: "srcCrit", ok: k.includes("spawnCritSkillMark") && k.includes("v738：必暴金星") },
    { name: "srcLeech", ok: k.includes("spawnLeechMark") && k.includes("v738：吸血綠心") },
    { name: "srcChill", ok: k.includes("spawnChillMark") && k.includes("v738：凍結雪晶") },
    { name: "drawCrit", ok: rend.includes('p.kind === "critskill"') },
    { name: "drawLeech", ok: rend.includes('p.kind === "leechmark"') },
    { name: "drawChill", ok: rend.includes('p.kind === "chillmark"') },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, r, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
