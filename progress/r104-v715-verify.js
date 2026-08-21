/* v715 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-104-v715";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=715", { waitUntil: "domcontentloaded" });
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

    const mat = countDelta([{ kind: "matflare", cx: 240, cy: 150, r0: 7, r1: 32, life: 0.18, maxLife: 0.36, color: "#5ecf8a", color2: "#c8f0d8" }]);
    const ticket = countDelta([{ kind: "ticketflare", cx: 240, cy: 150, r0: 8, r1: 34, life: 0.19, maxLife: 0.38, color: "#ffc14a", color2: "#ffe8b0" }]);
    const honor = countDelta([{ kind: "honorflare", cx: 240, cy: 150, r0: 8, r1: 38, life: 0.21, maxLife: 0.42, color: "#e8a040", color2: "#ffe0a0" }]);
    return { mat, ticket, honor };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/hunt.js"), "utf8");
  const bat = fs.readFileSync(path.join(__dirname, "../js/sys/battle.js"), "utf8");
  const rend = fs.readFileSync(path.join(__dirname, "../js/ui/render.js"), "utf8");
  const asserts = [
    { name: "deltaMat", ok: r.mat > 20 },
    { name: "deltaTicket", ok: r.ticket > 20 },
    { name: "deltaHonor", ok: r.honor > 20 },
    { name: "srcMat", ok: k.includes("spawnMatFlare") && k.includes("v715：素材翠晶") },
    { name: "srcTicket", ok: k.includes("spawnTicketFlare") && k.includes("v715：招募券金票") },
    { name: "srcHonor", ok: k.includes("spawnHonorFlare") && k.includes("v715：榮譽琥珀環") },
    { name: "srcFlags", ok: bat.includes("matDrop:") && bat.includes("honorDrop:") && bat.includes("v715：素材") },
    { name: "drawMat", ok: rend.includes('p.kind === "matflare"') },
    { name: "drawTicket", ok: rend.includes('p.kind === "ticketflare"') },
    { name: "drawHonor", ok: rend.includes('p.kind === "honorflare"') },
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
