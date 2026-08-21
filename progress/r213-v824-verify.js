/* v824 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-213-v824";

function expNeed(lv, cap) {
  return Math.floor(120 * Math.pow(Math.min(Math.max(1, lv), cap), 1.6));
}
function techCost(cur, cap) {
  return Math.floor(800 * Math.pow(1.65, Math.min(Math.max(0, cur), cap)));
}
function gemFuse(t, cap) {
  let fee = 200 * Math.pow(1.45, Math.min(t - 1, cap));
  if (t >= 6) fee *= Math.pow(1.25, Math.min(t - 5, 0));
  return Math.floor(fee);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=824", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.sys && MG.sys.guild && MG.sys.equipment);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.guild = st.guild || { level: 1, tech: {} };
    return {
      e10: MG.sys.guild.expNeed(10),
      e11: MG.sys.guild.expNeed(11),
      e20: MG.sys.guild.expNeed(20),
      t2: MG.sys.guild.techCost("atk", 2),
      t3: MG.sys.guild.techCost("atk", 3),
      t12: MG.sys.guild.techCost("atk", 12),
      g2: MG.sys.equipment.gemFuseCost(2),
      g3: MG.sys.equipment.gemFuseCost(3),
      g9: MG.sys.equipment.gemFuseCost(9)
    };
  });
  const asserts = [
    { name: "exp10unchanged", ok: expNeed(10, 10) === expNeed(10, 12) && live.e10 === expNeed(10, 10) },
    { name: "exp11cheaper", ok: expNeed(11, 10) < expNeed(11, 12) && live.e11 === expNeed(11, 10) && live.e20 === expNeed(20, 10) },
    { name: "tech2unchanged", ok: techCost(2, 2) === techCost(2, 4) && live.t2 === techCost(2, 2) },
    { name: "tech3cheaper", ok: techCost(3, 2) < techCost(3, 4) && live.t3 === techCost(3, 2) && live.t12 === techCost(12, 2) },
    { name: "gem2unchanged", ok: gemFuse(2, 1) === gemFuse(2, 2) && live.g2 === gemFuse(2, 1) },
    { name: "gem3cheaper", ok: gemFuse(3, 1) < gemFuse(3, 2) && live.g3 === gemFuse(3, 1) && live.g9 === gemFuse(9, 1) },
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
