/* v820 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-209-v820";

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
  await page.goto("http://127.0.0.1:8123/index.html?v=820", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.sys && MG.sys.guild && MG.sys.equipment);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.guild = st.guild || { level: 1, tech: {} };
    return {
      e12: MG.sys.guild.expNeed(12),
      e13: MG.sys.guild.expNeed(13),
      e20: MG.sys.guild.expNeed(20),
      t4: MG.sys.guild.techCost("atk", 4),
      t5: MG.sys.guild.techCost("atk", 5),
      t12: MG.sys.guild.techCost("atk", 12),
      g3: MG.sys.equipment.gemFuseCost(3),
      g4: MG.sys.equipment.gemFuseCost(4),
      g9: MG.sys.equipment.gemFuseCost(9)
    };
  });
  const asserts = [
    { name: "exp12unchanged", ok: expNeed(12, 12) === expNeed(12, 14) && live.e12 === expNeed(12, 12) },
    { name: "exp13cheaper", ok: expNeed(13, 12) < expNeed(13, 14) && live.e13 === expNeed(13, 12) && live.e20 === expNeed(20, 12) },
    { name: "tech4unchanged", ok: techCost(4, 4) === techCost(4, 6) && live.t4 === techCost(4, 4) },
    { name: "tech5cheaper", ok: techCost(5, 4) < techCost(5, 6) && live.t5 === techCost(5, 4) && live.t12 === techCost(12, 4) },
    { name: "gem3unchanged", ok: gemFuse(3, 2) === gemFuse(3, 4) && live.g3 === gemFuse(3, 2) },
    { name: "gem4cheaper", ok: gemFuse(4, 2) < gemFuse(4, 4) && live.g4 === gemFuse(4, 2) && live.g9 === gemFuse(9, 2) },
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
