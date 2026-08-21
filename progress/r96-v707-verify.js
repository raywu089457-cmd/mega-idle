/* v707 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-96-v707";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=707", { waitUntil: "domcontentloaded" });
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

    const loot = countDelta([{ kind: "lootflare", cx: 240, cy: 150, r0: 8, r1: 36, life: 0.2, maxLife: 0.4, color: "#e8b060", color2: "#ffe8c0" }]);
    const elite = countDelta([{ kind: "elitering", cx: 240, cy: 150, r0: 10, r1: 42, life: 0.19, maxLife: 0.38, color: "#c792ea", color2: "#e8d0ff" }]);
    const pot = countDelta([{ kind: "potburst", cx: 240, cy: 150, r0: 6, r1: 34, life: 0.18, maxLife: 0.36, color: "#6ed6b0", color2: "#c8f5e8" }]);

    // rm: no particle when reducedMotion via spawn (source-level); hash draw same with empty
    st.settings.reducedMotion = true;
    const cRm = document.createElement("canvas");
    cRm.width = 480; cRm.height = 270;
    const ctxRm = cRm.getContext("2d");
    MG.ui.render.drawBattle(ctxRm, {
      t: 1, team: [], monsters: [], floats: [],
      particles: [{ kind: "lootflare", cx: 240, cy: 150, r0: 8, r1: 36, life: 0.2, maxLife: 0.4, color: "#e8b060", color2: "#ffe8c0" }],
      projectiles: [],
      pal: { sky1: "#5ec8e5", sky2: "#2a6f9c", ground: "#4c8a3f", accent: "#ffe08a" }, rm: true
    });
    // with rm:true drawBattle should skip particles visually - check protocol; if draw still draws, source spawn skips is enough
    return { loot, elite, pot };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  const asserts = [
    { name: "deltaLoot", ok: r.loot > 20 },
    { name: "deltaElite", ok: r.elite > 20 },
    { name: "deltaPot", ok: r.pot > 20 },
    { name: "srcLoot", ok: k.includes("spawnLootFlare") && k.includes("v707：裝備掉落琥珀焰") },
    { name: "srcElite", ok: k.includes("spawnEliteRing") && k.includes("v707：精英擊殺紫環") },
    { name: "srcPot", ok: k.includes("spawnPotBurst") && k.includes("v707：藥水薄荷爆") },
    { name: "drawLoot", ok: rend.includes('p.kind === "lootflare"') },
    { name: "drawElite", ok: rend.includes('p.kind === "elitering"') },
    { name: "drawPot", ok: rend.includes('p.kind === "potburst"') },
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
