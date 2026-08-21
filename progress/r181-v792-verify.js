/* v792 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-181-v792";

function gold(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 0))));
}
function goldOld(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 1))));
}
function expNeed(lvl) {
  let e = 55 * Math.pow(lvl, 1.45);
  if (lvl >= 100) e *= Math.pow(1.25, Math.min(Math.floor((lvl - 100) / 20) + 1, 2));
  return Math.floor(e);
}
function expNeedOld(lvl) {
  let e = 55 * Math.pow(lvl, 1.45);
  if (lvl >= 100) e *= Math.pow(1.25, Math.min(Math.floor((lvl - 100) / 20) + 1, 3));
  return Math.floor(e);
}
function honor(l, aw) {
  return Math.floor(50 * Math.pow(2, l) * Math.pow(1.12, Math.min(0, aw)));
}
function honorOld(l, aw) {
  return Math.floor(50 * Math.pow(2, l) * Math.pow(1.12, Math.min(1, aw)));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=792", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys.meta);
  const live = await page.evaluate(() => {
    MG.game.state.awakenings = 3;
    MG.game.state.honorLvls = { dmg: 1, gold: 0, exp: 0 };
    return {
      g10: MG.data.hunters.recruit.gold.cost(10),
      g11: MG.data.hunters.recruit.gold.cost(11),
      e139: MG.data.hunters.expNeed(139),
      e140: MG.data.hunters.expNeed(140),
      h0: (() => { MG.game.state.awakenings = 0; return MG.sys.meta.honorCost("dmg"); })(),
      h3: (() => { MG.game.state.awakenings = 3; return MG.sys.meta.honorCost("dmg"); })()
    };
  });
  const asserts = [
    { name: "g10unchanged", ok: gold(10) === goldOld(10) && live.g10 === gold(10) },
    { name: "g11cheaper", ok: gold(11) < goldOld(11) && live.g11 === gold(11) },
    { name: "e139unchanged", ok: expNeed(139) === expNeedOld(139) && live.e139 === expNeed(139) },
    { name: "e140cheaper", ok: expNeed(140) < expNeedOld(140) && live.e140 === expNeed(140) },
    { name: "h0unchanged", ok: honor(1, 0) === honorOld(1, 0) && live.h0 === honor(1, 0) },
    { name: "h3cheaper", ok: honor(1, 3) < honorOld(1, 3) && live.h3 === honor(1, 3) },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, live, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, live }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
