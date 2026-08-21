/* v712 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);

function refine(lv) {
  let gold = 400 * Math.pow(lv, 1.6);
  if (lv >= 5) gold *= Math.pow(1.2, Math.min(lv - 4, 4));
  return Math.floor(gold);
}
function refineOld(lv) {
  let gold = 400 * Math.pow(lv, 1.6);
  if (lv >= 5) gold *= Math.pow(1.2, lv - 4);
  return Math.floor(gold);
}
function skill(lvl) {
  let c = lvl * (lvl < 5 ? 2 : 3);
  if (lvl >= 7) c = Math.floor(c * Math.pow(1.3, Math.min(lvl - 6, 2)));
  return c;
}
function skillOld(lvl) {
  let c = lvl * (lvl < 5 ? 2 : 3);
  if (lvl >= 7) c = Math.floor(c * Math.pow(1.3, lvl - 6));
  return c;
}
function fuse(t) {
  let fee = 200 * Math.pow(1.45, Math.min(t - 1, 8));
  if (t >= 6) fee *= Math.pow(1.25, Math.min(t - 5, 3));
  return Math.floor(fee);
}
function fuseOld(t) {
  let fee = 200 * Math.pow(1.45, Math.min(t - 1, 8));
  if (t >= 6) fee *= Math.pow(1.25, t - 5);
  return Math.floor(fee);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=712", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.sys.hunters && MG.sys.equipment);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    st.artifacts = st.artifacts || { owned: {}, levels: {}, awake: {} };
    st.artifacts.owned = st.artifacts.owned || {};
    st.artifacts.levels = st.artifacts.levels || {};
    const aid = Object.keys(MG.data.artifacts || {})[0] || "dragon_scale";
    st.artifacts.owned[aid] = true;

    const refineRows = [4, 5, 8, 9].map((lv) => {
      st.artifacts.levels[aid] = lv;
      const c = MG.sys.hunters.artifactRefineCost(aid);
      return { lv, gold: c ? c.gold : -1 };
    });
    const skillRows = [6, 7, 8, 9].map((lvl) => ({
      lvl, cost: MG.sys.hunters.skillUpCost({ skills: { s1: lvl }, level: 99, cls: "sword" }, "s1")
    }));
    const fuseRows = [5, 6, 8, 9, 10].map((t) => ({ t, fee: MG.sys.equipment.gemFuseCost(t) }));
    return { refineRows, skillRows, fuseRows, aid };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });

  for (const row of live.refineRows) {
    assert("rf==@" + row.lv, row.gold === refine(row.lv));
    if (row.lv <= 8) assert("rfUnch@" + row.lv, row.gold === refineOld(row.lv));
    else assert("rfCap@" + row.lv, row.gold < refineOld(row.lv) && row.gold === Math.floor(400 * Math.pow(row.lv, 1.6) * Math.pow(1.2, 4)));
  }
  for (const row of live.skillRows) {
    assert("sk==@" + row.lvl, row.cost === skill(row.lvl));
    if (row.lvl <= 8) assert("skUnch@" + row.lvl, row.cost === skillOld(row.lvl));
    else assert("skCap@" + row.lvl, row.cost < skillOld(row.lvl) && row.cost === Math.floor(row.lvl * 3 * Math.pow(1.3, 2)));
  }
  for (const row of live.fuseRows) {
    assert("fu==@" + row.t, row.fee === fuse(row.t));
    if (row.t <= 8) assert("fuUnch@" + row.t, row.fee === fuseOld(row.t));
    else assert("fuCap@" + row.t, row.fee < fuseOld(row.t) && row.fee === Math.floor(200 * Math.pow(1.45, Math.min(row.t - 1, 8)) * Math.pow(1.25, 3)));
  }

  const pass = asserts.filter((a) => a.ok).length;
  const fail = asserts.filter((a) => !a.ok);
  const table = [
    "=== 模擬對照表 ===",
    "指標 | 改動前 | 改動後 | 門檻 | PASS/FAIL",
    "--- | --- | --- | --- | ---",
    "精煉 lv8 | " + refineOld(8) + " | " + refine(8) + " | 不變 | " + (refineOld(8) === refine(8) ? "PASS" : "FAIL"),
    "精煉 lv9 | " + refineOld(9) + " | " + refine(9) + " | <前・^4 | " + (refine(9) < refineOld(9) ? "PASS" : "FAIL"),
    "技能 lvl8 | " + skillOld(8) + " | " + skill(8) + " | 不變 | " + (skillOld(8) === skill(8) ? "PASS" : "FAIL"),
    "技能 lvl9 | " + skillOld(9) + " | " + skill(9) + " | <前・^2 | " + (skill(9) < skillOld(9) ? "PASS" : "FAIL"),
    "融合 t8 | " + fuseOld(8) + " | " + fuse(8) + " | 不變 | " + (fuseOld(8) === fuse(8) ? "PASS" : "FAIL"),
    "融合 t10 | " + fuseOld(10) + " | " + fuse(10) + " | <前・^3 | " + (fuse(10) < fuseOld(10) ? "PASS" : "FAIL"),
    "硬斷言:" + pass + "/" + asserts.length + " " + (fail.length ? "FAIL" : "PASS")
  ];

  const out = { ok: !errs.length && fail.length === 0, live, asserts, fail, errs, table: table.join("\n") };
  fs.writeFileSync(path.join(OUT, "round-101-v712-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, "round-101-v712-sim.txt"), out.table);
  console.log(out.table);
  console.log(JSON.stringify({ ok: out.ok, pass, total: asserts.length, errs, fail }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
