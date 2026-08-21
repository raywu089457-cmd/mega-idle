/* v756 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-145-v756";

function donate(lv) {
  const exp = Math.min(Math.max(0, lv - 1), 2);
  return Math.floor(1500 * Math.pow(1.4, exp));
}
function donateOld(lv) {
  const exp = Math.min(Math.max(0, lv - 1), 3);
  return Math.floor(1500 * Math.pow(1.4, exp));
}
function goldRecruit(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 10))));
}
function goldRecruitOld(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 12))));
}
function honor(l, aw) {
  return Math.floor(50 * Math.pow(2, l) * Math.pow(1.12, Math.min(2, aw)));
}
function honorOld(l, aw) {
  return Math.floor(50 * Math.pow(2, l) * Math.pow(1.12, Math.min(3, aw)));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=756", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.guild = st.guild || {};
    st.guild.level = 3;
    const d3 = MG.sys.guild.donateCost();
    st.guild.level = 4;
    const d4 = MG.sys.guild.donateCost();
    st.stats = st.stats || {};
    st.stats.goldRecruits = 20;
    st.buildings = st.buildings || {};
    st.buildings.guild = 0; // no mul
    const g20 = MG.sys.hunters.recruitCost("gold").gold;
    st.stats.goldRecruits = 21;
    const g21 = MG.sys.hunters.recruitCost("gold").gold;
    st.awakenings = 2;
    st.honorLvls = { dmg: 1, gold: 0, exp: 0 };
    const h2 = MG.sys.meta.honorCost("dmg");
    st.awakenings = 3;
    const h3 = MG.sys.meta.honorCost("dmg");
    return { d3, d4, g20, g21, h2, h3 };
  });

  const asserts = [
    { name: "donateGate", ok: donate(3) === donateOld(3) && live.d3 === donate(3) },
    { name: "donateDrop", ok: donate(4) < donateOld(4) && live.d4 === donate(4) },
    { name: "goldGate", ok: goldRecruit(20) === goldRecruitOld(20) && live.g20 === goldRecruit(20) },
    { name: "goldDrop", ok: goldRecruit(21) < goldRecruitOld(21) && live.g21 === goldRecruit(21) },
    { name: "honorGate", ok: honor(1, 2) === honorOld(1, 2) && live.h2 === honor(1, 2) },
    { name: "honorDrop", ok: honor(1, 3) < honorOld(1, 3) && live.h3 === honor(1, 3) },
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
