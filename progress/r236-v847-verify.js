/* v847 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-236-v847";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=847", { waitUntil: "domcontentloaded" });
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
      halo: countDelta([{ kind: "halomark", cx: 240, cy: 150, r0: 6, r1: 22, life: 0.15, maxLife: 0.3, color: "#f0f0ff", color2: "#ffffff" }]),
      rend: countDelta([{ kind: "rendmark", cx: 240, cy: 150, r0: 6, r1: 22, life: 0.14, maxLife: 0.28, color: "#c8c8d0", color2: "#f0f0f8" }]),
      fletch: countDelta([{ kind: "fletchmark", cx: 240, cy: 150, r0: 6, r1: 22, life: 0.14, maxLife: 0.28, color: "#ffd24a", color2: "#fff0b0" }])
    };
  });
  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  const asserts = [
    { name: "deltaHalo", ok: r.halo > 20 },
    { name: "deltaRend", ok: r.rend > 20 },
    { name: "deltaFletch", ok: r.fletch > 20 },
    { name: "srcHalo", ok: k.includes("spawnHaloMark") && k.includes("v847：聖光白暈標") },
    { name: "srcRend", ok: k.includes("spawnRendMark") && k.includes("v847：斬擊銀裂標") },
    { name: "srcFletch", ok: k.includes("spawnFletchMark") && k.includes("v847：箭矢金羽標") },
    { name: "draw", ok: rend.includes("halomark") && rend.includes("rendmark") && rend.includes("fletchmark") },
    { name: "lifeOnly", ok: k.includes('p.kind === "halomark"') && k.includes('p.kind === "rendmark"') && k.includes('p.kind === "fletchmark"') },
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
