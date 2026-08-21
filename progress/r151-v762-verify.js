/* v762 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-151-v762";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=762", { waitUntil: "domcontentloaded" });
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

    const clear = countDelta([{ kind: "clearmark", cx: 240, cy: 150, r0: 7, r1: 26, life: 0.17, maxLife: 0.34, color: "#c8d0e0", color2: "#e8eef8" }]);
    const restage = countDelta([{ kind: "restagemark", cx: 240, cy: 150, r0: 7, r1: 28, life: 0.18, maxLife: 0.36, color: "#57c96b", color2: "#a8e8b8" }]);
    const advance = countDelta([{ kind: "advancemark", cx: 240, cy: 150, r0: 7, r1: 28, life: 0.18, maxLife: 0.36, color: "#ffd166", color2: "#ffe8a8" }]);
    return { clear, restage, advance };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  const asserts = [
    { name: "deltaClear", ok: r.clear > 20 },
    { name: "deltaRestage", ok: r.restage > 20 },
    { name: "deltaAdvance", ok: r.advance > 20 },
    { name: "srcClear", ok: k.includes("spawnClearMark") && k.includes("v762：清場銀✓") },
    { name: "srcRestage", ok: k.includes("spawnRestageMark") && k.includes("v762：重刷青綠刷新弧") },
    { name: "srcAdvance", ok: k.includes("spawnAdvanceMark") && k.includes("v762：進關金雙▶") },
    { name: "drawClear", ok: rend.includes('p.kind === "clearmark"') },
    { name: "drawRestage", ok: rend.includes('p.kind === "restagemark"') },
    { name: "drawAdvance", ok: rend.includes('p.kind === "advancemark"') },
    { name: "lifeOnly", ok: k.includes('p.kind === "clearmark"') && k.includes('p.kind === "restagemark"') && k.includes('p.kind === "advancemark"') },
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
