/* v768 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-157-v768";

function ancient(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  const step = Math.min(Math.max(0, lvl - 11), 2);
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
}
function ancientOld(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  const step = Math.min(Math.max(0, lvl - 11), 3);
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
}
function myth(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 5))));
}
function mythOld(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 6))));
}
function trainExp(lvl) {
  let e = 40 * Math.pow(lvl, 1.5);
  if (lvl >= 100) e *= Math.pow(1.2, Math.min(Math.floor((lvl - 100) / 20) + 1, 3));
  return Math.floor(e);
}
function trainExpOld(lvl) {
  let e = 40 * Math.pow(lvl, 1.5);
  if (lvl >= 100) e *= Math.pow(1.2, Math.min(Math.floor((lvl - 100) / 20) + 1, 4));
  return Math.floor(e);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=768", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys);
  const live = await page.evaluate(() => {
    const a13 = MG.sys.guild.ancientCost(13);
    const a14 = MG.sys.guild.ancientCost(14);
    const m30 = MG.data.hunters.recruit.gem.cost(30);
    const m31 = MG.data.hunters.recruit.gem.cost(31);
    const e159 = MG.data.hunters.trainExp(159);
    const e160 = MG.data.hunters.trainExp(160);
    return { a13, a14, m30, m31, e159, e160 };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });
  assert("ancientThresh", ancient(13) === ancientOld(13) && live.a13 === ancient(13));
  assert("ancientDrop", ancient(14) < ancientOld(14) && live.a14 === ancient(14));
  assert("mythThresh", myth(30) === mythOld(30) && live.m30 === myth(30));
  assert("mythDrop", myth(31) < mythOld(31) && live.m31 === myth(31));
  assert("expThresh", trainExp(159) === trainExpOld(159) && live.e159 === trainExp(159));
  assert("expDrop", trainExp(160) < trainExpOld(160) && live.e160 === trainExp(160));
  assert("noErr", !errs.length);

  const srcG = fs.readFileSync(path.join(__dirname, "../js/sys/guild.js"), "utf8");
  const srcH = fs.readFileSync(path.join(__dirname, "../js/data/hunters.js"), "utf8");
  assert("srcAncient", srcG.includes("Math.min(Math.max(0, lvl - 11), 2)"));
  assert("srcMyth", srcH.includes("Math.min(n - 25, 5)"));
  assert("srcExp", srcH.includes("Math.min(Math.floor((lvl - 100) / 20) + 1, 3)"));

  const fail = asserts.filter((a) => !a.ok);
  const out = {
    ok: fail.length === 0,
    live,
    sim: {
      a13: ancient(13), a14: ancient(14), a14old: ancientOld(14),
      m30: myth(30), m31: myth(31), m31old: mythOld(31),
      e159: trainExp(159), e160: trainExp(160), e160old: trainExpOld(160)
    },
    asserts, fail, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, live, sim: out.sim }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
