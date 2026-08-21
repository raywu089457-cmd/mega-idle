/* v776 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-165-v776";

function gold(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 6))));
}
function goldOld(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 8))));
}
function myth(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 3))));
}
function mythOld(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 4))));
}
function trainExp(lvl) {
  let e = 40 * Math.pow(lvl, 1.5);
  if (lvl >= 100) e *= Math.pow(1.2, Math.min(Math.floor((lvl - 100) / 20) + 1, 1));
  return Math.floor(e);
}
function trainExpOld(lvl) {
  let e = 40 * Math.pow(lvl, 1.5);
  if (lvl >= 100) e *= Math.pow(1.2, Math.min(Math.floor((lvl - 100) / 20) + 1, 2));
  return Math.floor(e);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=776", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data);
  const live = await page.evaluate(() => ({
    g16: MG.data.hunters.recruit.gold.cost(16),
    g17: MG.data.hunters.recruit.gold.cost(17),
    m28: MG.data.hunters.recruit.gem.cost(28),
    m29: MG.data.hunters.recruit.gem.cost(29),
    e119: MG.data.hunters.trainExp(119),
    e120: MG.data.hunters.trainExp(120)
  }));
  const asserts = [
    { name: "g16unchanged", ok: gold(16) === goldOld(16) && live.g16 === gold(16) },
    { name: "g17cheaper", ok: gold(17) < goldOld(17) && live.g17 === gold(17) },
    { name: "m28unchanged", ok: myth(28) === mythOld(28) && live.m28 === myth(28) },
    { name: "m29cheaper", ok: myth(29) < mythOld(29) && live.m29 === myth(29) },
    { name: "e119unchanged", ok: trainExp(119) === trainExpOld(119) && live.e119 === trainExp(119) },
    { name: "e120cheaper", ok: trainExp(120) < trainExpOld(120) && live.e120 === trainExp(120) },
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
