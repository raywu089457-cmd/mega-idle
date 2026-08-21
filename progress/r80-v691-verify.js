/* v691 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=691", { waitUntil: "domcontentloaded" });
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

    const adv = countDelta([{ kind: "advancering", cx: 240, cy: 150, r0: 12, r1: 52, life: 0.21, maxLife: 0.42, color: "#ffd166", color2: "#fff3c4" }]);
    const clang = countDelta([{ kind: "shieldclang", cx: 240, cy: 150, r0: 8, r1: 28, life: 0.14, maxLife: 0.28, color: "#9ad8ff", color2: "#e0f4ff" }]);
    const enter = countDelta([{ kind: "enterripple", cx: 240, cy: 150, r0: 6, r1: 40, life: 0.18, maxLife: 0.36, color: "#8a9ab8", color2: "#c8d0e0" }]);
    st.settings.reducedMotion = true;
    const advRm = countDelta([{ kind: "advancering", cx: 240, cy: 150, r0: 12, r1: 52, life: 0.21, maxLife: 0.42, color: "#ffd166", color2: "#fff3c4" }]);
    return { adv, clang, enter, advRm };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const b = fs.readFileSync(path.join(__dirname, "../js/sys/battle.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  const out = {
    ok: !errs.length && r.adv > 20 && r.clang > 20 && r.enter > 20 && r.advRm < 5
      && k.includes("spawnAdvanceRing") && k.includes("spawnShieldClang") && k.includes("spawnEnterRipple")
      && k.includes('case "stageclear"')
      && b.includes('type: "stageclear"')
      && rend.includes("advancering") && rend.includes("shieldclang") && rend.includes("enterripple"),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, "round-80-v691-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
