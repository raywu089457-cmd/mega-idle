/* v746 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-135-v746";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=746", { waitUntil: "domcontentloaded" });
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

    const elite = countDelta([{ kind: "elitemark", cx: 240, cy: 150, r0: 7, r1: 28, life: 0.18, maxLife: 0.36, color: "#c792ea", color2: "#e8c8ff" }]);
    const boss = countDelta([{ kind: "bossmark", cx: 240, cy: 150, r0: 8, r1: 30, life: 0.19, maxLife: 0.38, color: "#ff5c8a", color2: "#ffb0c8" }]);
    const rapid = countDelta([{ kind: "rapidmark", cx: 240, cy: 150, r0: 6, r1: 26, life: 0.16, maxLife: 0.32, color: "#7ee0ff", color2: "#c8f0ff" }]);
    return { elite, boss, rapid };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  const asserts = [
    { name: "deltaElite", ok: r.elite > 20 },
    { name: "deltaBoss", ok: r.boss > 20 },
    { name: "deltaRapid", ok: r.rapid > 20 },
    { name: "srcElite", ok: k.includes("spawnEliteMark") && k.includes("v746：精英紫冠") },
    { name: "srcBoss", ok: k.includes("spawnBossMark") && k.includes("v746：首領緋角冠") },
    { name: "srcRapid", ok: k.includes("spawnRapidMark") && k.includes("v746：高連擊青速線") },
    { name: "drawElite", ok: rend.includes('p.kind === "elitemark"') },
    { name: "drawBoss", ok: rend.includes('p.kind === "bossmark"') },
    { name: "drawRapid", ok: rend.includes('p.kind === "rapidmark"') },
    { name: "lifeOnly", ok: k.includes('p.kind === "elitemark"') && k.includes('p.kind === "bossmark"') && k.includes('p.kind === "rapidmark"') },
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
