/* v800 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-189-v800";

function promoGold(n) {
  let gold = 500 * Math.pow(5, n);
  if (n >= 4) gold *= Math.pow(1.2, Math.min(n - 3, 0));
  return Math.floor(gold);
}
function promoGoldOld(n) {
  let gold = 500 * Math.pow(5, n);
  if (n >= 4) gold *= Math.pow(1.2, Math.min(n - 3, 1));
  return Math.floor(gold);
}
function promoIron(n) {
  let iron = 20 * n;
  if (n >= 4) iron = Math.floor(iron * Math.pow(1.35, Math.min(n - 3, 0)));
  return iron;
}
function promoIronOld(n) {
  let iron = 20 * n;
  if (n >= 4) iron = Math.floor(iron * Math.pow(1.35, Math.min(n - 3, 1)));
  return iron;
}
function refine(lv) {
  let gold = 400 * Math.pow(lv, 1.6);
  if (lv >= 5) gold *= Math.pow(1.2, Math.min(lv - 4, 0));
  return Math.floor(gold);
}
function refineOld(lv) {
  let gold = 400 * Math.pow(lv, 1.6);
  if (lv >= 5) gold *= Math.pow(1.2, Math.min(lv - 4, 1));
  return Math.floor(gold);
}
function enhance(tier, enhance) {
  let c = Math.pow(1.5, enhance) * 40 * Math.pow(tier, 1.6);
  if (enhance >= 10) c *= Math.pow(1.35, Math.min(enhance - 9, 0));
  return Math.floor(c);
}
function enhanceOld(tier, enhance) {
  let c = Math.pow(1.5, enhance) * 40 * Math.pow(tier, 1.6);
  if (enhance >= 10) c *= Math.pow(1.35, Math.min(enhance - 9, 1));
  return Math.floor(c);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=800", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys.hunters);
  const live = await page.evaluate(() => {
    MG.game.state.artifacts = { owned: { a1: true }, levels: { a1: 4 }, awake: {} };
    MG.game.state.mats = { crystal: 999, ember: 999, void: 999, myth: 999 };
    MG.game.state.currencies.gold = 1e12;
    const p3 = MG.data.hunters.promoCost({ promoted: 2 });
    const p4 = MG.data.hunters.promoCost({ promoted: 3 });
    const r4 = (() => { MG.game.state.artifacts.levels.a1 = 4; return MG.sys.hunters.artifactRefineCost("a1"); })();
    const r5 = (() => { MG.game.state.artifacts.levels.a1 = 5; return MG.sys.hunters.artifactRefineCost("a1"); })();
    return {
      p3g: p3.gold, p3i: p3.mats.iron,
      p4g: p4.gold, p4i: p4.mats.iron,
      r4: r4 && r4.gold, r5: r5 && r5.gold,
      e9: MG.data.equipment.enhanceCost(3, 9),
      e10: MG.data.equipment.enhanceCost(3, 10)
    };
  });
  const asserts = [
    { name: "p3unchanged", ok: promoGold(3) === promoGoldOld(3) && live.p3g === promoGold(3) && promoIron(3) === promoIronOld(3) && live.p3i === promoIron(3) },
    { name: "p4cheaper", ok: promoGold(4) < promoGoldOld(4) && live.p4g === promoGold(4) && promoIron(4) < promoIronOld(4) && live.p4i === promoIron(4) },
    { name: "r4unchanged", ok: refine(4) === refineOld(4) && live.r4 === refine(4) },
    { name: "r5cheaper", ok: refine(5) < refineOld(5) && live.r5 === refine(5) },
    { name: "e9unchanged", ok: enhance(3, 9) === enhanceOld(3, 9) && live.e9 === enhance(3, 9) },
    { name: "e10cheaper", ok: enhance(3, 10) < enhanceOld(3, 10) && live.e10 === enhance(3, 10) },
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
