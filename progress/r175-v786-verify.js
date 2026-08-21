/* v786 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-175-v786";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=786", { waitUntil: "domcontentloaded" });
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
    return {
      exp: countDelta([{ kind: "expmark", cx: 240, cy: 150, r0: 6, r1: 22, life: 0.15, maxLife: 0.3, color: "#7ee787", color2: "#c8f0c8" }]),
      regen: countDelta([{ kind: "regenmark", cx: 240, cy: 150, r0: 7, r1: 26, life: 0.17, maxLife: 0.34, color: "#57c96b", color2: "#a8e878" }]),
      steal: countDelta([{ kind: "stealmark", cx: 240, cy: 150, r0: 7, r1: 26, life: 0.17, maxLife: 0.34, color: "#ff7a7a", color2: "#ffb0b0" }])
    };
  });
  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  const asserts = [
    { name: "deltaExp", ok: r.exp > 20 },
    { name: "deltaRegen", ok: r.regen > 20 },
    { name: "deltaSteal", ok: r.steal > 20 },
    { name: "srcExp", ok: k.includes("spawnExpMark") && k.includes("v786：經驗綠葉標") },
    { name: "srcRegen", ok: k.includes("spawnRegenMark") && k.includes("v786：再生綠脈標") },
    { name: "srcSteal", ok: k.includes("spawnStealMark") && k.includes("v786：吸血紅心標") },
    { name: "draw", ok: rend.includes("expmark") && rend.includes("regenmark") && rend.includes("stealmark") },
    { name: "lifeOnly", ok: k.includes('p.kind === "expmark"') && k.includes('p.kind === "regenmark"') && k.includes('p.kind === "stealmark"') },
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
