/* v808 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-197-v808";

function badgeGold(lv, cap) {
  let gold = 300 * Math.pow(2, lv);
  if (lv >= 3) gold *= Math.pow(1.25, Math.min(lv - 2, cap));
  return Math.floor(gold);
}
function gemFuse(t, cap) {
  let fee = 200 * Math.pow(1.45, Math.min(t - 1, 8));
  if (t >= 6) fee *= Math.pow(1.25, Math.min(t - 5, cap));
  return Math.floor(fee);
}
function donate(lv, cap) {
  const exp = Math.min(Math.max(0, lv - 1), cap);
  return Math.floor(1500 * Math.pow(1.4, exp));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=808", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.sys && MG.sys.hunters && MG.sys.equipment && MG.sys.guild);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    const b2 = MG.sys.hunters.badgeGoldCost(2);
    const b3 = MG.sys.hunters.badgeGoldCost(3);
    const g5 = MG.sys.equipment.gemFuseCost(5);
    const g6 = MG.sys.equipment.gemFuseCost(6);
    st.guild = st.guild || {};
    st.guild.level = 1;
    const d1 = MG.sys.guild.donateCost();
    st.guild.level = 2;
    const d2 = MG.sys.guild.donateCost();
    st.guild.level = 5;
    const d5 = MG.sys.guild.donateCost();
    return { b2, b3, g5, g6, d1, d2, d5 };
  });
  const asserts = [
    { name: "badge2unchanged", ok: badgeGold(2, 0) === badgeGold(2, 1) && live.b2 === badgeGold(2, 0) },
    { name: "badge3cheaper", ok: badgeGold(3, 0) < badgeGold(3, 1) && live.b3 === badgeGold(3, 0) },
    { name: "gem5unchanged", ok: gemFuse(5, 0) === gemFuse(5, 1) && live.g5 === gemFuse(5, 0) },
    { name: "gem6cheaper", ok: gemFuse(6, 0) < gemFuse(6, 1) && live.g6 === gemFuse(6, 0) },
    { name: "donate1unchanged", ok: donate(1, 0) === donate(1, 1) && live.d1 === donate(1, 0) },
    { name: "donate2cheaper", ok: donate(2, 0) < donate(2, 1) && live.d2 === donate(2, 0) && live.d5 === donate(5, 0) },
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
