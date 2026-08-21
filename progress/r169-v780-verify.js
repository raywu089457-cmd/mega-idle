/* v780 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-169-v780";

function gold(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 4))));
}
function goldOld(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 6))));
}
function myth(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 2))));
}
function mythOld(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 3))));
}
function ancient(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  const step = Math.min(Math.max(0, lvl - 11), 0);
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
}
function ancientOld(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  const step = Math.min(Math.max(0, lvl - 11), 1);
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=780", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys && MG.sys.guild);
  const live = await page.evaluate(() => ({
    g14: MG.data.hunters.recruit.gold.cost(14),
    g15: MG.data.hunters.recruit.gold.cost(15),
    m27: MG.data.hunters.recruit.gem.cost(27),
    m28: MG.data.hunters.recruit.gem.cost(28),
    a11: MG.sys.guild.ancientCost(11),
    a12: MG.sys.guild.ancientCost(12)
  }));
  const asserts = [
    { name: "g14unchanged", ok: gold(14) === goldOld(14) && live.g14 === gold(14) },
    { name: "g15cheaper", ok: gold(15) < goldOld(15) && live.g15 === gold(15) },
    { name: "m27unchanged", ok: myth(27) === mythOld(27) && live.m27 === myth(27) },
    { name: "m28cheaper", ok: myth(28) < mythOld(28) && live.m28 === myth(28) },
    { name: "a11unchanged", ok: ancient(11) === ancientOld(11) && live.a11 === ancient(11) },
    { name: "a12cheaper", ok: ancient(12) < ancientOld(12) && live.a12 === ancient(12) },
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
