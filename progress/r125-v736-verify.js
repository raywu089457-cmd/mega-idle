/* v736 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-125-v736";

function study(l) {
  const base = 15 * (l + 1);
  if (l < 5) return base;
  return Math.floor(base * Math.pow(1.4, Math.min(l - 4, 2)));
}
function studyOld(l) {
  const base = 15 * (l + 1);
  if (l < 5) return base;
  return Math.floor(base * Math.pow(1.4, Math.min(l - 4, 3)));
}
function train(lvl) {
  let c = 60 * Math.pow(lvl, 1.85);
  if (lvl >= 100) c *= Math.pow(1.3, Math.min(Math.floor((lvl - 100) / 20) + 1, 3));
  return Math.floor(c);
}
function trainOld(lvl) {
  let c = 60 * Math.pow(lvl, 1.85);
  if (lvl >= 100) c *= Math.pow(1.3, Math.min(Math.floor((lvl - 100) / 20) + 1, 4));
  return Math.floor(c);
}
function donate(lv) {
  const exp = Math.min(Math.max(0, lv - 1), 6);
  return Math.floor(1500 * Math.pow(1.4, exp));
}
function donateOld(lv) {
  const exp = Math.min(Math.max(0, lv - 1), 8);
  return Math.floor(1500 * Math.pow(1.4, exp));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=736", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.sys && MG.sys.meta && MG.sys.guild);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.studyLvl = 6;
    const s6 = MG.sys.meta.studyCost();
    st.studyLvl = 7;
    const s7 = MG.sys.meta.studyCost();
    const t159 = MG.data.hunters.trainCost(159);
    const t160 = MG.data.hunters.trainCost(160);
    st.guild = st.guild || { level: 1, tech: {} };
    st.guild.level = 7;
    const d7 = MG.sys.guild.donateCost();
    st.guild.level = 8;
    const d8 = MG.sys.guild.donateCost();
    return { s6, s7, t159, t160, d7, d8 };
  });

  const asserts = [
    { name: "studyBelowEq", ok: study(6) === studyOld(6) },
    { name: "studyAboveLt", ok: study(7) < studyOld(7) && study(9) < studyOld(9) },
    { name: "trainBelowEq", ok: train(159) === trainOld(159) },
    { name: "trainAboveLt", ok: train(160) < trainOld(160) && train(180) < trainOld(180) },
    { name: "donateBelowEq", ok: donate(7) === donateOld(7) },
    { name: "donateAboveLt", ok: donate(8) < donateOld(8) && donate(15) < donateOld(15) },
    { name: "liveS6", ok: live.s6 === study(6) },
    { name: "liveS7", ok: live.s7 === study(7) },
    { name: "liveT159", ok: live.t159 === train(159) },
    { name: "liveT160", ok: live.t160 === train(160) },
    { name: "liveD7", ok: live.d7 === donate(7) },
    { name: "liveD8", ok: live.d8 === donate(8) },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, live, sim: { s6: study(6), s7: study(7), t159: train(159), t160: train(160), d7: donate(7), d8: donate(8) }, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, live }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
