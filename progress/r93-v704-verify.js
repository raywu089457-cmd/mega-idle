/* v704 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);

function ancient(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  const step = Math.min(Math.max(0, lvl - 11), 5);
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
}
function ancientOld(lvl) {
  if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
  return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, lvl - 11));
}
function expNeed(lv) { return Math.floor(120 * Math.pow(Math.min(Math.max(1, lv), 18), 1.6)); }
function expNeedOld(lv) { return Math.floor(120 * Math.pow(lv, 1.6)); }
function trainExp(lvl) {
  let e = 40 * Math.pow(lvl, 1.5);
  if (lvl >= 100) e *= Math.pow(1.2, Math.floor((lvl - 100) / 20) + 1);
  return Math.floor(e);
}
function trainExpOld(lvl) { return Math.floor(40 * Math.pow(lvl, 1.5)); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=704", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.sys.guild && MG.data.hunters);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    const ancientRows = [10, 11, 16, 17, 20].map((lvl) => ({ lvl, cost: MG.sys.guild.ancientCost(lvl) }));
    const expRows = [1, 18, 19, 20].map((lv) => ({ lv, need: MG.sys.guild.expNeed(lv) }));
    const trainRows = [50, 100, 120, 140].map((lvl) => ({ lvl, exp: MG.data.hunters.trainExp(lvl) }));
    return { ancientRows, expRows, trainRows };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });

  for (const row of live.ancientRows) {
    assert("anc==@" + row.lvl, row.cost === ancient(row.lvl));
    if (row.lvl <= 16) assert("ancUnch@" + row.lvl, row.cost === ancientOld(row.lvl));
    else assert("ancCap@" + row.lvl, row.cost === ancient(16) && row.cost < ancientOld(row.lvl));
  }
  for (const row of live.expRows) {
    assert("exp==@" + row.lv, row.need === expNeed(row.lv));
    if (row.lv <= 18) assert("expUnch@" + row.lv, row.need === expNeedOld(row.lv));
    else assert("expCap@" + row.lv, row.need === expNeed(18) && row.need < expNeedOld(row.lv));
  }
  for (const row of live.trainRows) {
    assert("tr==@" + row.lvl, row.exp === trainExp(row.lvl));
    if (row.lvl < 100) assert("trUnch@" + row.lvl, row.exp === trainExpOld(row.lvl));
    else assert("trDeep@" + row.lvl, row.exp > trainExpOld(row.lvl));
  }

  const pass = asserts.filter((a) => a.ok).length;
  const fail = asserts.filter((a) => !a.ok);
  const table = [
    "=== 模擬對照表 ===",
    "指標 | 改動前 | 改動後 | 門檻 | PASS/FAIL",
    "--- | --- | --- | --- | ---",
    "遠古 Lv16 | " + ancientOld(16) + " | " + ancient(16) + " | 不變 | " + (ancientOld(16) === ancient(16) ? "PASS" : "FAIL"),
    "遠古 Lv20 | " + ancientOld(20) + " | " + ancient(20) + " | =Lv16 | " + (ancient(20) === ancient(16) ? "PASS" : "FAIL"),
    "經驗 Lv18 | " + expNeedOld(18) + " | " + expNeed(18) + " | 不變 | " + (expNeedOld(18) === expNeed(18) ? "PASS" : "FAIL"),
    "經驗 Lv20 | " + expNeedOld(20) + " | " + expNeed(20) + " | =Lv18 | " + (expNeed(20) === expNeed(18) ? "PASS" : "FAIL"),
    "訓練 Lv50 | " + trainExpOld(50) + " | " + trainExp(50) + " | 不變 | " + (trainExpOld(50) === trainExp(50) ? "PASS" : "FAIL"),
    "訓練 Lv120 | " + trainExpOld(120) + " | " + trainExp(120) + " | >前 | " + (trainExp(120) > trainExpOld(120) ? "PASS" : "FAIL"),
    "硬斷言:" + pass + "/" + asserts.length + " " + (fail.length ? "FAIL" : "PASS")
  ];

  const out = { ok: !errs.length && fail.length === 0, live, asserts, fail, errs, table: table.join("\n") };
  fs.writeFileSync(path.join(OUT, "round-93-v704-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, "round-93-v704-sim.txt"), out.table);
  console.log(out.table);
  console.log(JSON.stringify({ ok: out.ok, pass, total: asserts.length, errs, fail }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
