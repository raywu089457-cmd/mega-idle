/* v816 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-205-v816";

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
  await page.goto("http://127.0.0.1:8123/index.html?v=816", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.sys && MG.sys.guild && MG.sys.equipment);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.guild = st.guild || { level: 1, tech: {} };
    return {
      e14: MG.sys.guild.expNeed(14),
      e15: MG.sys.guild.expNeed(15),
      e20: MG.sys.guild.expNeed(20),
      t6: MG.sys.guild.techCost("atk", 6),
      t7: MG.sys.guild.techCost("atk", 7),
      t12: MG.sys.guild.techCost("atk", 12),
      g5: MG.sys.equipment.gemFuseCost(5),
      g6: MG.sys.equipment.gemFuseCost(6),
      g9: MG.sys.equipment.gemFuseCost(9)
    };
  });
  const asserts = [
    { name: "exp14unchanged", ok: expNeed(14, 14) === expNeed(14, 16) && live.e14 === expNeed(14, 14) },
    { name: "exp15cheaper", ok: expNeed(15, 14) < expNeed(15, 16) && live.e15 === expNeed(15, 14) && live.e20 === expNeed(20, 14) },
    { name: "tech6unchanged", ok: techCost(6, 6) === techCost(6, 8) && live.t6 === techCost(6, 6) },
    { name: "tech7cheaper", ok: techCost(7, 6) < techCost(7, 8) && live.t7 === techCost(7, 6) && live.t12 === techCost(12, 6) },
    { name: "gem5unchanged", ok: gemFuse(5, 4) === gemFuse(5, 6) && live.g5 === gemFuse(5, 4) },
    { name: "gem6cheaper", ok: gemFuse(6, 4) < gemFuse(6, 6) && live.g6 === gemFuse(6, 4) && live.g9 === gemFuse(9, 4) },
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
