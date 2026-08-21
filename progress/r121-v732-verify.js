/* v732 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-121-v732";

function refine(lv) {
  let gold = 400 * Math.pow(lv, 1.6);
  if (lv >= 5) gold *= Math.pow(1.2, Math.min(lv - 4, 3));
  return Math.floor(gold);
}
function refineOld(lv) {
  let gold = 400 * Math.pow(lv, 1.6);
  if (lv >= 5) gold *= Math.pow(1.2, Math.min(lv - 4, 4));
  return Math.floor(gold);
}
function skill(lvl) {
  let c = lvl * (lvl < 5 ? 2 : 3);
  if (lvl >= 7) c = Math.floor(c * Math.pow(1.3, Math.min(lvl - 6, 1)));
  return c;
}
function skillOld(lvl) {
  let c = lvl * (lvl < 5 ? 2 : 3);
  if (lvl >= 7) c = Math.floor(c * Math.pow(1.3, Math.min(lvl - 6, 2)));
  return c;
}
function badge(lv) {
  let gold = 300 * Math.pow(2, lv);
  if (lv >= 3) gold *= Math.pow(1.25, Math.min(lv - 2, 2));
  return Math.floor(gold);
}
function badgeOld(lv) {
  let gold = 300 * Math.pow(2, lv);
  if (lv >= 3) gold *= Math.pow(1.25, Math.min(lv - 2, 3));
  return Math.floor(gold);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=732", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.sys && MG.sys.hunters);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.currencies.gold = 1e15;
    st.mats = st.mats || {};
    for (const m of ["crystal", "ember", "void", "myth"]) st.mats[m] = 99999;
    st.artifacts = st.artifacts || { levels: {}, awake: {} };
    const aid = Object.keys(MG.data.hunters.ARTIFACTS || MG.data.artifacts || { a1: 1 })[0] || "blade";
    // find a real artifact id
    const arts = MG.data.hunters.ARTIFACTS || MG.data.hunters.artifacts || {};
    const ids = Object.keys(arts);
    const id = ids[0] || "sword_relic";
    st.artifacts.levels[id] = 7;
    const c7 = MG.sys.hunters.artifactRefineCost(id);
    st.artifacts.levels[id] = 8;
    const c8 = MG.sys.hunters.artifactRefineCost(id);
    const h = { skills: { sk: 7 } };
    // use real skillUpCost via a hunter if needed
    const sk7 = MG.sys.hunters.skillUpCost({ skills: { s1: 7 } }, "s1");
    const sk8 = MG.sys.hunters.skillUpCost({ skills: { s1: 8 } }, "s1");
    const b4 = MG.sys.hunters.badgeGoldCost(4);
    const b5 = MG.sys.hunters.badgeGoldCost(5);
    return {
      refine7: c7 && c7.gold, refine8: c8 && c8.gold,
      sk7, sk8, b4, b5, aid: id
    };
  });

  const asserts = [
    { name: "refineBelowEq", ok: refine(7) === refineOld(7) },
    { name: "refineAboveLt", ok: refine(8) < refineOld(8) && refine(9) < refineOld(9) },
    { name: "skillBelowEq", ok: skill(7) === skillOld(7) },
    { name: "skillAboveLt", ok: skill(8) < skillOld(8) && skill(9) < skillOld(9) },
    { name: "badgeBelowEq", ok: badge(4) === badgeOld(4) },
    { name: "badgeAboveLt", ok: badge(5) < badgeOld(5) && badge(6) < badgeOld(6) },
    { name: "liveRefine7", ok: live.refine7 === refine(7) },
    { name: "liveRefine8", ok: live.refine8 === refine(8) },
    { name: "liveSk7", ok: live.sk7 === skill(7) },
    { name: "liveSk8", ok: live.sk8 === skill(8) },
    { name: "liveB4", ok: live.b4 === badge(4) },
    { name: "liveB5", ok: live.b5 === badge(5) },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, live, sim: { r7: refine(7), r8: refine(8), s7: skill(7), s8: skill(8), b4: badge(4), b5: badge(5) }, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, live }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
