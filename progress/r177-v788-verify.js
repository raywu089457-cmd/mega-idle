/* v788 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-177-v788";

function gold(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 1))));
}
function goldOld(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 2))));
}
function myth(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 0))));
}
function mythOld(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 1))));
}
function expNeed(lvl) {
  let e = 55 * Math.pow(lvl, 1.45);
  if (lvl >= 100) e *= Math.pow(1.25, Math.min(Math.floor((lvl - 100) / 20) + 1, 3));
  return Math.floor(e);
}
function expNeedOld(lvl) {
  let e = 55 * Math.pow(lvl, 1.45);
  if (lvl >= 100) e *= Math.pow(1.25, Math.min(Math.floor((lvl - 100) / 20) + 1, 4));
  return Math.floor(e);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=788", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data);
  const live = await page.evaluate(() => ({
    g11: MG.data.hunters.recruit.gold.cost(11),
    g12: MG.data.hunters.recruit.gold.cost(12),
    m25: MG.data.hunters.recruit.gem.cost(25),
    m26: MG.data.hunters.recruit.gem.cost(26),
    e159: MG.data.hunters.expNeed(159),
    e160: MG.data.hunters.expNeed(160)
  }));
  const asserts = [
    { name: "g11unchanged", ok: gold(11) === goldOld(11) && live.g11 === gold(11) },
    { name: "g12cheaper", ok: gold(12) < goldOld(12) && live.g12 === gold(12) },
    { name: "m25unchanged", ok: myth(25) === mythOld(25) && live.m25 === myth(25) },
    { name: "m26cheaper", ok: myth(26) < mythOld(26) && live.m26 === myth(26) },
    { name: "e159unchanged", ok: expNeed(159) === expNeedOld(159) && live.e159 === expNeed(159) },
    { name: "e160cheaper", ok: expNeed(160) < expNeedOld(160) && live.e160 === expNeed(160) },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, live, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
