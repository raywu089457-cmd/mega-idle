/* v699 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-88-v699";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=699", { waitUntil: "domcontentloaded" });
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

    const hit = countDelta([{ kind: "hitring", cx: 240, cy: 150, r0: 5, r1: 22, life: 0.11, maxLife: 0.22, color: "#c8d0e0", color2: "#e8f0ff" }]);
    const down = countDelta([{ kind: "downburst", cx: 240, cy: 150, r0: 6, r1: 30, life: 0.16, maxLife: 0.32, color: "#ff6b6b", color2: "#ff9a9a" }]);
    const farm = countDelta([{ kind: "farmflare", cx: 240, cy: 150, r0: 10, r1: 46, life: 0.2, maxLife: 0.4, color: "#7ee787", color2: "#c8f5c8" }]);
    return { hit, down, farm };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  const out = {
    ok: !errs.length
      && r.hit > 15 && r.down > 20 && r.farm > 20
      && k.includes("spawnHitRing") && k.includes("spawnDownBurst") && k.includes("spawnFarmFlare")
      && k.includes("v699：普攻銀環") && k.includes("v699：倒下紅爆") && k.includes("v699：練功點綠焰")
      && rend.includes('p.kind === "hitring"') && rend.includes('p.kind === "downburst"') && rend.includes('p.kind === "farmflare"'),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
