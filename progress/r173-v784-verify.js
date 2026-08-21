/* v784 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-173-v784";

function gold(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 2))));
}
function goldOld(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 4))));
}
function myth(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 1))));
}
function mythOld(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 2))));
}
function skill(lvl) {
  let c = lvl * (lvl < 5 ? 2 : 3);
  if (lvl >= 7) c = Math.floor(c * Math.pow(1.3, Math.min(lvl - 6, 0)));
  return c;
}
function skillOld(lvl) {
  let c = lvl * (lvl < 5 ? 2 : 3);
  if (lvl >= 7) c = Math.floor(c * Math.pow(1.3, Math.min(lvl - 6, 1)));
  return c;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=784", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys && MG.sys.hunters);
  const live = await page.evaluate(() => {
    const h = { skills: { heal: 6 } };
    const h7 = { skills: { heal: 7 } };
    return {
      g12: MG.data.hunters.recruit.gold.cost(12),
      g13: MG.data.hunters.recruit.gold.cost(13),
      m26: MG.data.hunters.recruit.gem.cost(26),
      m27: MG.data.hunters.recruit.gem.cost(27),
      s6: MG.sys.hunters.skillUpCost(h, "heal"),
      s7: MG.sys.hunters.skillUpCost(h7, "heal")
    };
  });
  const asserts = [
    { name: "g12unchanged", ok: gold(12) === goldOld(12) && live.g12 === gold(12) },
    { name: "g13cheaper", ok: gold(13) < goldOld(13) && live.g13 === gold(13) },
    { name: "m26unchanged", ok: myth(26) === mythOld(26) && live.m26 === myth(26) },
    { name: "m27cheaper", ok: myth(27) < mythOld(27) && live.m27 === myth(27) },
    { name: "s6unchanged", ok: skill(6) === skillOld(6) && live.s6 === skill(6) },
    { name: "s7cheaper", ok: skill(7) < skillOld(7) && live.s7 === skill(7) },
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
