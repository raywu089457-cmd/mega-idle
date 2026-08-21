/* v716 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-105-v716";

function seg(lvl) { return Math.floor((lvl - 100) / 20) + 1; }
function expNeed(lvl) {
  let e = 55 * Math.pow(lvl, 1.45);
  if (lvl >= 100) e *= Math.pow(1.25, Math.min(seg(lvl), 4));
  return Math.floor(e);
}
function expOld(lvl) {
  let e = 55 * Math.pow(lvl, 1.45);
  if (lvl >= 100) e *= Math.pow(1.25, seg(lvl));
  return Math.floor(e);
}
function train(lvl) {
  let c = 60 * Math.pow(lvl, 1.85);
  if (lvl >= 100) c *= Math.pow(1.3, Math.min(seg(lvl), 4));
  return Math.floor(c);
}
function trainOld(lvl) {
  let c = 60 * Math.pow(lvl, 1.85);
  if (lvl >= 100) c *= Math.pow(1.3, seg(lvl));
  return Math.floor(c);
}
function promoGold(n) {
  let gold = 500 * Math.pow(5, n);
  if (n >= 4) gold *= Math.pow(1.2, Math.min(n - 3, 1));
  return Math.floor(gold);
}
function promoGoldOld(n) {
  let gold = 500 * Math.pow(5, n);
  if (n >= 4) gold *= Math.pow(1.2, n - 3);
  return Math.floor(gold);
}
function promoMatMul(n) {
  return n >= 4 ? Math.pow(1.35, Math.min(n - 3, 1)) : 1;
}
function promoMatMulOld(n) {
  return n >= 4 ? Math.pow(1.35, n - 3) : 1;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=716", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.data.hunters);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    const D = MG.data.hunters;
    const expRows = [99, 100, 160, 180, 200].map((lvl) => ({ lvl, need: D.expNeed(lvl) }));
    const trainRows = [99, 100, 160, 180, 200].map((lvl) => ({ lvl, cost: D.trainCost(lvl) }));
    const promoRows = [3, 4, 5].map((n) => {
      const c = D.promoCost({ promoted: n - 1 });
      return { n, gold: c.gold, iron: c.mats.iron, ember: c.mats.ember || 0 };
    });
    return { expRows, trainRows, promoRows };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });

  for (const row of live.expRows) {
    assert("exp==@" + row.lvl, row.need === expNeed(row.lvl));
    if (row.lvl <= 160) assert("expUnch@" + row.lvl, row.need === expOld(row.lvl));
    else assert("expCap@" + row.lvl, row.need < expOld(row.lvl) && row.need === expNeed(row.lvl));
  }
  for (const row of live.trainRows) {
    assert("tr==@" + row.lvl, row.cost === train(row.lvl));
    if (row.lvl <= 160) assert("trUnch@" + row.lvl, row.cost === trainOld(row.lvl));
    else assert("trCap@" + row.lvl, row.cost < trainOld(row.lvl));
  }
  for (const row of live.promoRows) {
    assert("pg==@" + row.n, row.gold === promoGold(row.n));
    if (row.n <= 4) assert("pgUnch@" + row.n, row.gold === promoGoldOld(row.n));
    else assert("pgCap@" + row.n, row.gold < promoGoldOld(row.n));
    const baseIron = 20 * row.n;
    const expectIron = Math.floor(baseIron * promoMatMul(row.n));
    assert("pmIron==@" + row.n, row.iron === expectIron);
    if (row.n <= 4) assert("pmUnch@" + row.n, row.iron === Math.floor(baseIron * promoMatMulOld(row.n)));
    else assert("pmCap@" + row.n, row.iron < Math.floor(baseIron * promoMatMulOld(row.n)));
  }

  const src = fs.readFileSync(path.join(__dirname, "../js/data/hunters.js"), "utf8");
  assert("srcExp", src.includes("v716：加深指數軟封頂 min(seg,4)") && src.includes("expNeed"));
  assert("srcTrain", src.includes("trainCost") && src.includes("1.3, Math.min(Math.floor"));
  assert("srcPromo", src.includes("min(n - 3, 1)"));
  assert("noErr", !errs.length);

  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, live, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  const table = "=== 數值平衡驗證 ===\n" +
    "exp@" + live.expRows.map((r) => r.lvl + "=" + r.need).join(" ") + "\n" +
    "train@" + live.trainRows.map((r) => r.lvl + "=" + r.cost).join(" ") + "\n" +
    "promo@" + live.promoRows.map((r) => r.n + "=g" + r.gold).join(" ") + "\n" +
    "硬斷言:" + asserts.filter((a) => a.ok).length + "/" + asserts.length +
    (fail.length ? " FAIL " + fail.map((f) => f.name).join(",") : " PASS");
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), table);
  console.log(table);
  console.log(JSON.stringify({ ok: out.ok, pass: asserts.filter((a) => a.ok).length, total: asserts.length, fail, errs }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
