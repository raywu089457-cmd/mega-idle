/* v828 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-217-v828";

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
  await page.goto("http://127.0.0.1:8123/index.html?v=828", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.sys && MG.sys.guild && MG.sys.equipment);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.guild = st.guild || { level: 1, tech: {} };
    return {
      e8: MG.sys.guild.expNeed(8),
      e9: MG.sys.guild.expNeed(9),
      e20: MG.sys.guild.expNeed(20),
      t0: MG.sys.guild.techCost("atk", 0),
      t1: MG.sys.guild.techCost("atk", 1),
      t12: MG.sys.guild.techCost("atk", 12),
      g1: MG.sys.equipment.gemFuseCost(1),
      g2: MG.sys.equipment.gemFuseCost(2),
      g9: MG.sys.equipment.gemFuseCost(9)
    };
  });
  const asserts = [
    { name: "exp8unchanged", ok: expNeed(8, 8) === expNeed(8, 10) && live.e8 === expNeed(8, 8) },
    { name: "exp9cheaper", ok: expNeed(9, 8) < expNeed(9, 10) && live.e9 === expNeed(9, 8) && live.e20 === expNeed(20, 8) },
    { name: "tech0unchanged", ok: techCost(0, 0) === techCost(0, 2) && live.t0 === techCost(0, 0) },
    { name: "tech1cheaper", ok: techCost(1, 0) < techCost(1, 2) && live.t1 === techCost(1, 0) && live.t12 === techCost(12, 0) },
    { name: "gem1unchanged", ok: gemFuse(1, 0) === gemFuse(1, 1) && live.g1 === gemFuse(1, 0) },
    { name: "gem2cheaper", ok: gemFuse(2, 0) < gemFuse(2, 1) && live.g2 === gemFuse(2, 0) && live.g9 === gemFuse(9, 0) },
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
