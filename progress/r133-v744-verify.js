/* v744 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-133-v744";

function study(l) {
  const base = 15 * (l + 1);
  if (l < 5) return base;
  return Math.floor(base * Math.pow(1.4, Math.min(l - 4, 1)));
}
function studyOld(l) {
  const base = 15 * (l + 1);
  if (l < 5) return base;
  return Math.floor(base * Math.pow(1.4, Math.min(l - 4, 2)));
}
function train(lvl) {
  let c = 60 * Math.pow(lvl, 1.85);
  if (lvl >= 100) c *= Math.pow(1.3, Math.min(Math.floor((lvl - 100) / 20) + 1, 2));
  return Math.floor(c);
}
function trainOld(lvl) {
  let c = 60 * Math.pow(lvl, 1.85);
  if (lvl >= 100) c *= Math.pow(1.3, Math.min(Math.floor((lvl - 100) / 20) + 1, 3));
  return Math.floor(c);
}
function donate(lv) {
  const exp = Math.min(Math.max(0, lv - 1), 4);
  return Math.floor(1500 * Math.pow(1.4, exp));
}
function donateOld(lv) {
  const exp = Math.min(Math.max(0, lv - 1), 6);
  return Math.floor(1500 * Math.pow(1.4, exp));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=744", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.studyLvl = 5;
    const s5 = MG.sys.meta.studyCost();
    st.studyLvl = 6;
    const s6 = MG.sys.meta.studyCost();
    const t139 = MG.data.hunters.trainCost(139);
    const t140 = MG.data.hunters.trainCost(140);
    st.guild = st.guild || {};
    st.guild.level = 5;
    const d5 = MG.sys.guild.donateCost();
    st.guild.level = 6;
    const d6 = MG.sys.guild.donateCost();
    return { s5, s6, t139, t140, d5, d6 };
  });

  const asserts = [
    { name: "studyBelowEq", ok: study(5) === studyOld(5) && study(4) === studyOld(4) },
    { name: "studyAboveLt", ok: study(6) < studyOld(6) && study(9) < studyOld(9) },
    { name: "trainBelowEq", ok: train(139) === trainOld(139) && train(99) === trainOld(99) },
    { name: "trainAboveLt", ok: train(140) < trainOld(140) && train(180) < trainOld(180) },
    { name: "donateBelowEq", ok: donate(5) === donateOld(5) && donate(1) === donateOld(1) },
    { name: "donateAboveLt", ok: donate(6) < donateOld(6) && donate(20) < donateOld(20) },
    { name: "liveS5", ok: live.s5 === study(5) },
    { name: "liveS6", ok: live.s6 === study(6) },
    { name: "liveT139", ok: live.t139 === train(139) },
    { name: "liveT140", ok: live.t140 === train(140) },
    { name: "liveD5", ok: live.d5 === donate(5) },
    { name: "liveD6", ok: live.d6 === donate(6) },
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
