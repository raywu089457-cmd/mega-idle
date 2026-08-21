/* v772 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-161-v772";

function ancient(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  const step = Math.min(Math.max(0, lvl - 11), 1);
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
}
function ancientOld(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  const step = Math.min(Math.max(0, lvl - 11), 2);
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
}
function myth(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 4))));
}
function mythOld(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 5))));
}
function trainExp(lvl) {
  let e = 40 * Math.pow(lvl, 1.5);
  if (lvl >= 100) e *= Math.pow(1.2, Math.min(Math.floor((lvl - 100) / 20) + 1, 2));
  return Math.floor(e);
}
function trainExpOld(lvl) {
  let e = 40 * Math.pow(lvl, 1.5);
  if (lvl >= 100) e *= Math.pow(1.2, Math.min(Math.floor((lvl - 100) / 20) + 1, 3));
  return Math.floor(e);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=772", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys);
  const live = await page.evaluate(() => {
    const a12 = MG.sys.guild.ancientCost(12);
    const a13 = MG.sys.guild.ancientCost(13);
    const m29 = MG.data.hunters.recruit.gem.cost(29);
    const m30 = MG.data.hunters.recruit.gem.cost(30);
    const e139 = MG.data.hunters.trainExp(139);
    const e140 = MG.data.hunters.trainExp(140);
    return { a12, a13, m29, m30, e139, e140 };
  });

  const asserts = [
    { name: "a12unchanged", ok: ancient(12) === ancientOld(12) && live.a12 === ancient(12) },
    { name: "a13cheaper", ok: ancient(13) < ancientOld(13) && live.a13 === ancient(13) },
    { name: "m29unchanged", ok: myth(29) === mythOld(29) && live.m29 === myth(29) },
    { name: "m30cheaper", ok: myth(30) < mythOld(30) && live.m30 === myth(30) },
    { name: "e139unchanged", ok: trainExp(139) === trainExpOld(139) && live.e139 === trainExp(139) },
    { name: "e140cheaper", ok: trainExp(140) < trainExpOld(140) && live.e140 === trainExp(140) },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = {
    ok: fail.length === 0,
    live,
    sim: {
      a12: ancient(12), a13: ancient(13), a13old: ancientOld(13),
      m29: myth(29), m30: myth(30), m30old: mythOld(30),
      e139: trainExp(139), e140: trainExp(140), e140old: trainExpOld(140)
    },
    asserts, fail, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, sim: out.sim }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
