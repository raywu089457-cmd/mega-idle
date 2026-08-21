/* v796 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-185-v796";

function expNeed(lvl) {
  let e = 55 * Math.pow(lvl, 1.45);
  if (lvl >= 100) e *= Math.pow(1.25, Math.min(Math.floor((lvl - 100) / 20) + 1, 1));
  return Math.floor(e);
}
function expNeedOld(lvl) {
  let e = 55 * Math.pow(lvl, 1.45);
  if (lvl >= 100) e *= Math.pow(1.25, Math.min(Math.floor((lvl - 100) / 20) + 1, 2));
  return Math.floor(e);
}
function awakeGold(aw) {
  let gold = 500000 * Math.pow(3, aw);
  if (aw >= 1) gold *= Math.pow(1.2, Math.min(aw, 0));
  return Math.floor(gold);
}
function awakeGoldOld(aw) {
  let gold = 500000 * Math.pow(3, aw);
  if (aw >= 1) gold *= Math.pow(1.2, Math.min(aw, 1));
  return Math.floor(gold);
}
function study(l) {
  const base = 15 * (l + 1);
  if (l < 5) return base;
  return Math.floor(base * Math.pow(1.4, Math.min(l - 4, 0)));
}
function studyOld(l) {
  const base = 15 * (l + 1);
  if (l < 5) return base;
  return Math.floor(base * Math.pow(1.4, Math.min(l - 4, 1)));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=796", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys.hunters && MG.sys.meta);
  const live = await page.evaluate(() => {
    MG.game.state.artifacts = { owned: { a1: true }, levels: { a1: 10 }, awake: { a1: 1 } };
    MG.game.state.mats = { void: 999, myth: 999 };
    MG.game.state.currencies.gold = 1e12;
    MG.game.state.studyLvl = 5;
    const ac0 = (() => {
      MG.game.state.artifacts.awake.a1 = 0;
      return MG.sys.hunters.artifactAwakenCost("a1");
    })();
    const ac1 = (() => {
      MG.game.state.artifacts.awake.a1 = 1;
      return MG.sys.hunters.artifactAwakenCost("a1");
    })();
    return {
      e119: MG.data.hunters.expNeed(119),
      e120: MG.data.hunters.expNeed(120),
      a0: ac0 && ac0.gold,
      a1: ac1 && ac1.gold,
      s4: (() => { MG.game.state.studyLvl = 4; return MG.sys.meta.studyCost(); })(),
      s5: (() => { MG.game.state.studyLvl = 5; return MG.sys.meta.studyCost(); })()
    };
  });
  const asserts = [
    { name: "e119unchanged", ok: expNeed(119) === expNeedOld(119) && live.e119 === expNeed(119) },
    { name: "e120cheaper", ok: expNeed(120) < expNeedOld(120) && live.e120 === expNeed(120) },
    { name: "a0unchanged", ok: awakeGold(0) === awakeGoldOld(0) && live.a0 === awakeGold(0) },
    { name: "a1cheaper", ok: awakeGold(1) < awakeGoldOld(1) && live.a1 === awakeGold(1) },
    { name: "s4unchanged", ok: study(4) === studyOld(4) && live.s4 === study(4) },
    { name: "s5cheaper", ok: study(5) < studyOld(5) && live.s5 === study(5) },
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
