/* v740 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-129-v740";

function enhance(tier, e) {
  let c = Math.pow(1.5, e) * 40 * Math.pow(tier, 1.6);
  if (e >= 10) c *= Math.pow(1.35, Math.min(e - 9, 2));
  return Math.floor(c);
}
function enhanceOld(tier, e) {
  let c = Math.pow(1.5, e) * 40 * Math.pow(tier, 1.6);
  if (e >= 10) c *= Math.pow(1.35, Math.min(e - 9, 3));
  return Math.floor(c);
}
function fuse(t) {
  let fee = 200 * Math.pow(1.45, Math.min(t - 1, 8));
  if (t >= 6) fee *= Math.pow(1.25, Math.min(t - 5, 1));
  return Math.floor(fee);
}
function fuseOld(t) {
  let fee = 200 * Math.pow(1.45, Math.min(t - 1, 8));
  if (t >= 6) fee *= Math.pow(1.25, Math.min(t - 5, 2));
  return Math.floor(fee);
}
function honor(l, aw) {
  const a = Math.min(3, aw);
  return Math.floor(50 * Math.pow(2, l) * Math.pow(1.12, a));
}
function honorOld(l, aw) {
  const a = Math.min(4, aw);
  return Math.floor(50 * Math.pow(2, l) * Math.pow(1.12, a));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=740", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.data && MG.sys);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    const e11 = MG.data.equipment.enhanceCost(5, 11);
    const e12 = MG.data.equipment.enhanceCost(5, 12);
    const f6 = MG.sys.equipment.gemFuseCost(6);
    const f7 = MG.sys.equipment.gemFuseCost(7);
    st.honorLvls = st.honorLvls || { atk: 0 };
    st.honorLvls.atk = 1;
    st.awakenings = 3;
    const h3 = MG.sys.meta.honorCost("atk");
    st.awakenings = 4;
    const h4 = MG.sys.meta.honorCost("atk");
    return { e11, e12, f6, f7, h3, h4 };
  });

  const asserts = [
    { name: "enhanceBelowEq", ok: enhance(5, 11) === enhanceOld(5, 11) },
    { name: "enhanceAboveLt", ok: enhance(5, 12) < enhanceOld(5, 12) && enhance(5, 15) < enhanceOld(5, 15) },
    { name: "fuseBelowEq", ok: fuse(6) === fuseOld(6) },
    { name: "fuseAboveLt", ok: fuse(7) < fuseOld(7) && fuse(9) < fuseOld(9) },
    { name: "honorBelowEq", ok: honor(1, 3) === honorOld(1, 3) },
    { name: "honorAboveLt", ok: honor(1, 4) < honorOld(1, 4) && honor(1, 8) < honorOld(1, 8) },
    { name: "liveE11", ok: live.e11 === enhance(5, 11) },
    { name: "liveE12", ok: live.e12 === enhance(5, 12) },
    { name: "liveF6", ok: live.f6 === fuse(6) },
    { name: "liveF7", ok: live.f7 === fuse(7) },
    { name: "liveH3", ok: live.h3 === honor(1, 3) },
    { name: "liveH4", ok: live.h4 === honor(1, 4) },
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
