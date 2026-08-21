/* v804 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-193-v804";

function expNeed(lvl) {
  let e = 55 * Math.pow(lvl, 1.45);
  if (lvl >= 100) e *= Math.pow(1.25, Math.min(Math.floor((lvl - 100) / 20) + 1, 0));
  return Math.floor(e);
}
function expNeedOld(lvl) {
  let e = 55 * Math.pow(lvl, 1.45);
  if (lvl >= 100) e *= Math.pow(1.25, Math.min(Math.floor((lvl - 100) / 20) + 1, 1));
  return Math.floor(e);
}
function trainCost(lvl) {
  let c = 60 * Math.pow(lvl, 1.85);
  if (lvl >= 100) c *= Math.pow(1.3, Math.min(Math.floor((lvl - 100) / 20) + 1, 0));
  return Math.floor(c);
}
function trainCostOld(lvl) {
  let c = 60 * Math.pow(lvl, 1.85);
  if (lvl >= 100) c *= Math.pow(1.3, Math.min(Math.floor((lvl - 100) / 20) + 1, 1));
  return Math.floor(c);
}
function trainExp(lvl) {
  let e = 40 * Math.pow(lvl, 1.5);
  if (lvl >= 100) e *= Math.pow(1.2, Math.min(Math.floor((lvl - 100) / 20) + 1, 0));
  return Math.floor(e);
}
function trainExpOld(lvl) {
  let e = 40 * Math.pow(lvl, 1.5);
  if (lvl >= 100) e *= Math.pow(1.2, Math.min(Math.floor((lvl - 100) / 20) + 1, 1));
  return Math.floor(e);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=804", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.data.hunters);
  const live = await page.evaluate(() => ({
    e99: MG.data.hunters.expNeed(99),
    e100: MG.data.hunters.expNeed(100),
    c99: MG.data.hunters.trainCost(99),
    c100: MG.data.hunters.trainCost(100),
    x99: MG.data.hunters.trainExp(99),
    x100: MG.data.hunters.trainExp(100)
  }));
  const asserts = [
    { name: "e99unchanged", ok: expNeed(99) === expNeedOld(99) && live.e99 === expNeed(99) },
    { name: "e100cheaper", ok: expNeed(100) < expNeedOld(100) && live.e100 === expNeed(100) },
    { name: "c99unchanged", ok: trainCost(99) === trainCostOld(99) && live.c99 === trainCost(99) },
    { name: "c100cheaper", ok: trainCost(100) < trainCostOld(100) && live.c100 === trainCost(100) },
    { name: "x99unchanged", ok: trainExp(99) === trainExpOld(99) && live.x99 === trainExp(99) },
    { name: "x100cheaper", ok: trainExp(100) < trainExpOld(100) && live.x100 === trainExp(100) },
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
