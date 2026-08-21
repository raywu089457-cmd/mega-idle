/* v764 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-153-v764";

function ancient(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  const step = Math.min(Math.max(0, lvl - 11), 3);
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
}
function ancientOld(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  const step = Math.min(Math.max(0, lvl - 11), 4);
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
}
function honor(l, aw) {
  const a = Math.min(1, aw || 0);
  return Math.floor(50 * Math.pow(2, l) * Math.pow(1.12, a));
}
function honorOld(l, aw) {
  const a = Math.min(2, aw || 0);
  return Math.floor(50 * Math.pow(2, l) * Math.pow(1.12, a));
}
function gold(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 8))));
}
function goldOld(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 10))));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=764", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    const a14 = MG.sys.guild.ancientCost(14);
    const a15 = MG.sys.guild.ancientCost(15);
    st.awakenings = 1;
    st.honorLvls = { dmg: 0, gold: 0, exp: 0 };
    const h1 = MG.sys.meta.honorCost("dmg");
    st.awakenings = 3;
    const h3 = MG.sys.meta.honorCost("dmg");
    const g18 = MG.data.hunters.recruit.gold.cost(18);
    const g19 = MG.data.hunters.recruit.gold.cost(19);
    return { a14, a15, h1, h3, g18, g19 };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });
  assert("ancientThresh", ancient(14) === ancientOld(14) && live.a14 === ancient(14));
  assert("ancientDrop", ancient(15) < ancientOld(15) && live.a15 === ancient(15));
  assert("honorThresh", honor(0, 1) === honorOld(0, 1) && live.h1 === honor(0, 1));
  assert("honorDrop", honor(0, 3) < honorOld(0, 3) && live.h3 === honor(0, 3));
  assert("goldThresh", gold(18) === goldOld(18) && live.g18 === gold(18));
  assert("goldDrop", gold(19) < goldOld(19) && live.g19 === gold(19));
  assert("noErr", !errs.length);

  const srcG = fs.readFileSync(path.join(__dirname, "../js/sys/guild.js"), "utf8");
  const srcM = fs.readFileSync(path.join(__dirname, "../js/sys/meta.js"), "utf8");
  const srcH = fs.readFileSync(path.join(__dirname, "../js/data/hunters.js"), "utf8");
  assert("srcAncient", srcG.includes("min(lvl-11,3)") || srcG.includes("Math.min(Math.max(0, lvl - 11), 3)"));
  assert("srcHonor", srcM.includes("Math.min(1, S().awakenings"));
  assert("srcGold", srcH.includes("Math.min(n - 10, 8)"));

  const fail = asserts.filter((a) => !a.ok);
  const out = {
    ok: fail.length === 0,
    live,
    sim: { a14: ancient(14), a15: ancient(15), a15old: ancientOld(15), h1: honor(0, 1), h3: honor(0, 3), h3old: honorOld(0, 3), g18: gold(18), g19: gold(19), g19old: goldOld(19) },
    asserts, fail, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, live, sim: out.sim }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
