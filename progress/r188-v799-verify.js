/* v799 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-188-v799";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=799", { waitUntil: "domcontentloaded" });
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
      aid: countDelta([{ kind: "aidmark", cx: 240, cy: 150, r0: 6, r1: 22, life: 0.15, maxLife: 0.3, color: "#7ee787", color2: "#c8f5d0" }]),
      boost: countDelta([{ kind: "boostmark", cx: 240, cy: 150, r0: 7, r1: 24, life: 0.17, maxLife: 0.34, color: "#ffb347", color2: "#ffe0a0" }]),
      elixir: countDelta([{ kind: "elixirmark", cx: 240, cy: 150, r0: 6, r1: 22, life: 0.16, maxLife: 0.32, color: "#ffd166", color2: "#fff0b8" }])
    };
  });
  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  const asserts = [
    { name: "deltaAid", ok: r.aid > 20 },
    { name: "deltaBoost", ok: r.boost > 20 },
    { name: "deltaElixir", ok: r.elixir > 20 },
    { name: "srcAid", ok: k.includes("spawnAidMark") && k.includes("v799：治療技薄荷十字標") },
    { name: "srcBoost", ok: k.includes("spawnBoostMark") && k.includes("v799：加速沙漏琥珀標") },
    { name: "srcElixir", ok: k.includes("spawnElixirMark") && k.includes("v799：靈藥琥珀瓶標") },
    { name: "draw", ok: rend.includes("aidmark") && rend.includes("boostmark") && rend.includes("elixirmark") },
    { name: "lifeOnly", ok: k.includes('p.kind === "aidmark"') && k.includes('p.kind === "boostmark"') && k.includes('p.kind === "elixirmark"') },
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
