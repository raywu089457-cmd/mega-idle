/* v843 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-232-v843";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=843", { waitUntil: "domcontentloaded" });
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
      glace: countDelta([{ kind: "glacemark", cx: 240, cy: 150, r0: 6, r1: 22, life: 0.14, maxLife: 0.28, color: "#7ec8ff", color2: "#d0f0ff" }]),
      blaze: countDelta([{ kind: "blazemark", cx: 240, cy: 150, r0: 6, r1: 22, life: 0.14, maxLife: 0.28, color: "#ff7a3a", color2: "#ffd0a0" }]),
      spark: countDelta([{ kind: "sparkmark", cx: 240, cy: 150, r0: 6, r1: 22, life: 0.14, maxLife: 0.28, color: "#ffd24a", color2: "#fff6c0" }])
    };
  });
  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  const asserts = [
    { name: "deltaGlace", ok: r.glace > 20 },
    { name: "deltaBlaze", ok: r.blaze > 20 },
    { name: "deltaSpark", ok: r.spark > 20 },
    { name: "srcGlace", ok: k.includes("spawnGlaceMark") && k.includes("v843：冰系青冰標") },
    { name: "srcBlaze", ok: k.includes("spawnBlazeMark") && k.includes("v843：火球橙焰標") },
    { name: "srcSpark", ok: k.includes("spawnSparkMark") && k.includes("v843：雷系黃火花標") },
    { name: "draw", ok: rend.includes("glacemark") && rend.includes("blazemark") && rend.includes("sparkmark") },
    { name: "lifeOnly", ok: k.includes('p.kind === "glacemark"') && k.includes('p.kind === "blazemark"') && k.includes('p.kind === "sparkmark"') },
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
