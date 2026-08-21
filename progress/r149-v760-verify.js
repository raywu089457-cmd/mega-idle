/* v760 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-149-v760";

function donate(lv) {
  const exp = Math.min(Math.max(0, lv - 1), 1);
  return Math.floor(1500 * Math.pow(1.4, exp));
}
function donateOld(lv) {
  const exp = Math.min(Math.max(0, lv - 1), 2);
  return Math.floor(1500 * Math.pow(1.4, exp));
}
function ancient(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  const step = Math.min(Math.max(0, lvl - 11), 4);
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
}
function ancientOld(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  const step = Math.min(Math.max(0, lvl - 11), 5);
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
}
function myth(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 6))));
}
function mythOld(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 8))));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=760", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.guild = st.guild || {};
    st.guild.level = 2;
    const d2 = MG.sys.guild.donateCost();
    st.guild.level = 3;
    const d3 = MG.sys.guild.donateCost();
    const a15 = MG.sys.guild.ancientCost(15);
    const a16 = MG.sys.guild.ancientCost(16);
    const m31 = MG.data.hunters.recruit.gem.cost(31);
    const m32 = MG.data.hunters.recruit.gem.cost(32);
    return { d2, d3, a15, a16, m31, m32 };
  });

  const asserts = [
    { name: "donateGate", ok: donate(2) === donateOld(2) && live.d2 === donate(2) },
    { name: "donateDrop", ok: donate(3) < donateOld(3) && live.d3 === donate(3) },
    { name: "ancientGate", ok: ancient(15) === ancientOld(15) && live.a15 === ancient(15) },
    { name: "ancientDrop", ok: ancient(16) < ancientOld(16) && live.a16 === ancient(16) },
    { name: "mythGate", ok: myth(31) === mythOld(31) && live.m31 === myth(31) },
    { name: "mythDrop", ok: myth(32) < mythOld(32) && live.m32 === myth(32) },
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
