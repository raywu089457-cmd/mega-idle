/* v748 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-137-v748";

function refine(lv) {
  let gold = 400 * Math.pow(lv, 1.6);
  if (lv >= 5) gold *= Math.pow(1.2, Math.min(lv - 4, 2));
  return Math.floor(gold);
}
function refineOld(lv) {
  let gold = 400 * Math.pow(lv, 1.6);
  if (lv >= 5) gold *= Math.pow(1.2, Math.min(lv - 4, 3));
  return Math.floor(gold);
}
function badge(lv) {
  let gold = 300 * Math.pow(2, lv);
  if (lv >= 3) gold *= Math.pow(1.25, Math.min(lv - 2, 1));
  return Math.floor(gold);
}
function badgeOld(lv) {
  let gold = 300 * Math.pow(2, lv);
  if (lv >= 3) gold *= Math.pow(1.25, Math.min(lv - 2, 2));
  return Math.floor(gold);
}
function enhance(tier, e) {
  let c = Math.pow(1.5, e) * 40 * Math.pow(tier, 1.6);
  if (e >= 10) c *= Math.pow(1.35, Math.min(e - 9, 1));
  return Math.floor(c);
}
function enhanceOld(tier, e) {
  let c = Math.pow(1.5, e) * 40 * Math.pow(tier, 1.6);
  if (e >= 10) c *= Math.pow(1.35, Math.min(e - 9, 2));
  return Math.floor(c);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=748", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.currencies.gold = 1e12;
    st.mats = st.mats || {};
    ["crystal", "ember", "void", "myth"].forEach((k) => { st.mats[k] = 1e6; });
    st.artifacts = st.artifacts || { owned: {}, levels: {} };
    const aid = Object.keys(MG.data.artifacts || MG.data.hunters.ARTIFACTS || {})[0]
      || Object.keys((MG.sys.hunters.artifactMul && {}) || {})[0];
    // find any artifact id from game data
    let artId = null;
    const arts = (MG.data.artifacts && MG.data.artifacts.list) || (MG.data.hunters && MG.data.hunters.artifacts) || null;
    if (MG.data.artifacts) {
      const keys = Object.keys(MG.data.artifacts).filter((k) => typeof MG.data.artifacts[k] === "object");
      artId = keys.find((k) => k !== "list") || null;
    }
    if (!artId && MG.sys.hunters) {
      // use first known from levels or seed
      st.artifacts.owned = st.artifacts.owned || {};
      st.artifacts.levels = st.artifacts.levels || {};
      const sample = Object.keys(st.artifacts.levels)[0] || "crown";
      artId = sample;
      st.artifacts.owned[artId] = true;
    }
    st.artifacts.levels[artId] = 6;
    const r6 = MG.sys.hunters.artifactRefineCost(artId);
    st.artifacts.levels[artId] = 7;
    const r7 = MG.sys.hunters.artifactRefineCost(artId);
    const b3 = MG.sys.hunters.badgeGoldCost(3);
    const b4 = MG.sys.hunters.badgeGoldCost(4);
    const e10 = MG.data.equipment.enhanceCost(5, 10);
    const e11 = MG.data.equipment.enhanceCost(5, 11);
    return {
      artId,
      r6: r6 && r6.gold,
      r7: r7 && r7.gold,
      b3, b4, e10, e11
    };
  });

  const asserts = [
    { name: "refineBelowEq", ok: refine(6) === refineOld(6) && refine(4) === refineOld(4) },
    { name: "refineAboveLt", ok: refine(7) < refineOld(7) && refine(9) < refineOld(9) },
    { name: "badgeBelowEq", ok: badge(3) === badgeOld(3) && badge(2) === badgeOld(2) },
    { name: "badgeAboveLt", ok: badge(4) < badgeOld(4) && badge(5) < badgeOld(5) },
    { name: "enhanceBelowEq", ok: enhance(5, 10) === enhanceOld(5, 10) && enhance(5, 9) === enhanceOld(5, 9) },
    { name: "enhanceAboveLt", ok: enhance(5, 11) < enhanceOld(5, 11) && enhance(5, 15) < enhanceOld(5, 15) },
    { name: "liveR6", ok: live.r6 === refine(6) },
    { name: "liveR7", ok: live.r7 === refine(7) },
    { name: "liveB3", ok: live.b3 === badge(3) },
    { name: "liveB4", ok: live.b4 === badge(4) },
    { name: "liveE10", ok: live.e10 === enhance(5, 10) },
    { name: "liveE11", ok: live.e11 === enhance(5, 11) },
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
