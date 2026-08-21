/* v752 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-141-v752";

function refine(lv) {
  let gold = 400 * Math.pow(lv, 1.6);
  if (lv >= 5) gold *= Math.pow(1.2, Math.min(lv - 4, 1));
  return Math.floor(gold);
}
function refineOld(lv) {
  let gold = 400 * Math.pow(lv, 1.6);
  if (lv >= 5) gold *= Math.pow(1.2, Math.min(lv - 4, 2));
  return Math.floor(gold);
}
function donate(lv) {
  const exp = Math.min(Math.max(0, lv - 1), 3);
  return Math.floor(1500 * Math.pow(1.4, exp));
}
function donateOld(lv) {
  const exp = Math.min(Math.max(0, lv - 1), 4);
  return Math.floor(1500 * Math.pow(1.4, exp));
}
function train(lvl) {
  let c = 60 * Math.pow(lvl, 1.85);
  if (lvl >= 100) c *= Math.pow(1.3, Math.min(Math.floor((lvl - 100) / 20) + 1, 1));
  return Math.floor(c);
}
function trainOld(lvl) {
  let c = 60 * Math.pow(lvl, 1.85);
  if (lvl >= 100) c *= Math.pow(1.3, Math.min(Math.floor((lvl - 100) / 20) + 1, 2));
  return Math.floor(c);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=752", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.currencies.gold = 1e12;
    st.mats = st.mats || {};
    ["crystal", "ember", "void", "myth"].forEach((k) => { st.mats[k] = 1e6; });
    st.artifacts = st.artifacts || { owned: {}, levels: {} };
    st.artifacts.owned = st.artifacts.owned || {};
    st.artifacts.levels = st.artifacts.levels || {};
    const artId = "crown";
    st.artifacts.owned[artId] = true;
    st.artifacts.levels[artId] = 5;
    const r5 = MG.sys.hunters.artifactRefineCost(artId);
    st.artifacts.levels[artId] = 6;
    const r6 = MG.sys.hunters.artifactRefineCost(artId);
    st.guild = st.guild || {};
    st.guild.level = 4;
    const d4 = MG.sys.guild.donateCost();
    st.guild.level = 5;
    const d5 = MG.sys.guild.donateCost();
    const t119 = MG.data.hunters.trainCost(119);
    const t120 = MG.data.hunters.trainCost(120);
    return {
      r5: r5 && r5.gold, r6: r6 && r6.gold,
      d4, d5, t119, t120
    };
  });

  const asserts = [
    { name: "refineGate", ok: refine(5) === refineOld(5) && live.r5 === refine(5) },
    { name: "refineDrop", ok: refine(6) < refineOld(6) && live.r6 === refine(6) },
    { name: "donateGate", ok: donate(4) === donateOld(4) && live.d4 === donate(4) },
    { name: "donateDrop", ok: donate(5) < donateOld(5) && live.d5 === donate(5) },
    { name: "trainGate", ok: train(119) === trainOld(119) && live.t119 === train(119) },
    { name: "trainDrop", ok: train(120) < trainOld(120) && live.t120 === train(120) },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, live, asserts, fail, errs, sample: { refine5: refine(5), refine6: refine(6), refineOld6: refineOld(6), d4: donate(4), d5: donate(5), t119: train(119), t120: train(120), tOld120: trainOld(120) } };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, live, sample: out.sample }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
