/* v660 balance ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-49-v660";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=660", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    const D = MG.data.hunters;
    const p1 = D.promoCost({ promoted: 0 });
    const p3 = D.promoCost({ promoted: 2 });
    const p4 = D.promoCost({ promoted: 3 });
    const p5 = D.promoCost({ promoted: 4 });
    const gem0 = D.recruit.gem.cost(0);
    const gem10 = D.recruit.gem.cost(10);
    const gem25 = D.recruit.gem.cost(25);
    const gem50 = D.recruit.gem.cost(50);
    const shop = MG.data.quests.SHOP;
    const t1 = shop.find((x) => x.id === "s_t1");
    const t5 = shop.find((x) => x.id === "s_t5");
    return {
      p1iron: p1.mats.iron,
      p3crystal: p3.mats.crystal,
      p4ember: p4.mats.ember,
      p5myth: p5.mats.myth,
      p4iron: p4.mats.iron,
      gem0, gem10, gem25, gem50,
      t1: t1 && t1.price.gems,
      t5: t5 && t5.price.gems
    };
  });
  const out = {
    r, errs,
    pass: {
      earlyPromo: r.p1iron === 20 && r.p3crystal === 10,
      latePromo: r.p4ember > 10 && r.p5myth > 5 && r.p4iron > 80,
      gemSoft: r.gem0 === 300 && r.gem10 > 300 && r.gem25 === r.gem50 && r.gem25 > r.gem10,
      shopTicket: r.t1 === 100 && r.t5 === 470,
      noErr: errs.length === 0
    }
  };
  out.ok = Object.values(out.pass).every(Boolean);
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 2);
})().catch((e) => { console.error(e); process.exit(1); });
