/* v812 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-201-v812";

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
  await page.goto("http://127.0.0.1:8123/index.html?v=812", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.sys && MG.sys.guild && MG.sys.equipment);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.guild = st.guild || { level: 1, tech: {} };
    const e16 = MG.sys.guild.expNeed(16);
    const e17 = MG.sys.guild.expNeed(17);
    const e20 = MG.sys.guild.expNeed(20);
    const t8 = MG.sys.guild.techCost("atk", 8);
    const t9 = MG.sys.guild.techCost("atk", 9);
    const t12 = MG.sys.guild.techCost("atk", 12);
    const g7 = MG.sys.equipment.gemFuseCost(7);
    const g8 = MG.sys.equipment.gemFuseCost(8);
    const g9 = MG.sys.equipment.gemFuseCost(9);
    return { e16, e17, e20, t8, t9, t12, g7, g8, g9 };
  });
  const asserts = [
    { name: "exp16unchanged", ok: expNeed(16, 16) === expNeed(16, 18) && live.e16 === expNeed(16, 16) },
    { name: "exp17cheaper", ok: expNeed(17, 16) < expNeed(17, 18) && live.e17 === expNeed(17, 16) && live.e20 === expNeed(20, 16) },
    { name: "tech8unchanged", ok: techCost(8, 8) === techCost(8, 10) && live.t8 === techCost(8, 8) },
    { name: "tech9cheaper", ok: techCost(9, 8) < techCost(9, 10) && live.t9 === techCost(9, 8) && live.t12 === techCost(12, 8) },
    { name: "gem7unchanged", ok: gemFuse(7, 6) === gemFuse(7, 8) && live.g7 === gemFuse(7, 6) },
    { name: "gem8cheaper", ok: gemFuse(8, 6) < gemFuse(8, 8) && live.g8 === gemFuse(8, 6) && live.g9 === gemFuse(9, 6) },
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
