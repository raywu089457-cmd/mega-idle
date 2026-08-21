/* v708 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);

function enh(tier, e) {
  let c = Math.pow(1.5, e) * 40 * Math.pow(tier, 1.6);
  if (e >= 10) c *= Math.pow(1.35, Math.min(e - 9, 4));
  return Math.floor(c);
}
function enhOld(tier, e) {
  let c = Math.pow(1.5, e) * 40 * Math.pow(tier, 1.6);
  if (e >= 10) c *= Math.pow(1.35, e - 9);
  return Math.floor(c);
}
function study(l) {
  if (l >= 10) return -1;
  const base = 15 * (l + 1);
  if (l < 5) return base;
  return Math.floor(base * Math.pow(1.4, Math.min(l - 4, 4)));
}
function studyOld(l) {
  if (l >= 10) return -1;
  const base = 15 * (l + 1);
  if (l < 5) return base;
  return Math.floor(base * Math.pow(1.4, l - 4));
}
function badge(lv) {
  let gold = 300 * Math.pow(2, lv);
  if (lv >= 3) gold *= Math.pow(1.25, Math.min(lv - 2, 3));
  return Math.floor(gold);
}
function badgeOld(lv) {
  let gold = 300 * Math.pow(2, lv);
  if (lv >= 3) gold *= Math.pow(1.25, lv - 2);
  return Math.floor(gold);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=708", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.data.equipment && MG.sys.meta && MG.sys.hunters);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    const enhRows = [9, 10, 13, 14, 15].map((e) => ({ e, cost: MG.data.equipment.enhanceCost(5, e) }));
    const studyRows = [4, 5, 8, 9].map((l) => {
      st.studyLvl = l;
      return { l, cost: MG.sys.meta.studyCost() };
    });
    const badgeRows = [2, 3, 5, 6].map((lv) => ({ lv, gold: MG.sys.hunters.badgeGoldCost(lv) }));
    return { enhRows, studyRows, badgeRows };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });

  for (const row of live.enhRows) {
    assert("enh==@" + row.e, row.cost === enh(5, row.e));
    if (row.e <= 13) assert("enhUnch@" + row.e, row.cost === enhOld(5, row.e));
    else assert("enhCap@" + row.e, row.cost < enhOld(5, row.e) && row.cost === Math.floor(Math.pow(1.5, row.e) * 40 * Math.pow(5, 1.6) * Math.pow(1.35, 4)));
  }
  for (const row of live.studyRows) {
    assert("st==@" + row.l, row.cost === study(row.l));
    if (row.l <= 8) assert("stUnch@" + row.l, row.cost === studyOld(row.l));
    else assert("stCap@" + row.l, row.cost < studyOld(row.l) && row.cost === Math.floor(15 * (row.l + 1) * Math.pow(1.4, 4)));
  }
  for (const row of live.badgeRows) {
    assert("bd==@" + row.lv, row.gold === badge(row.lv));
    if (row.lv <= 5) assert("bdUnch@" + row.lv, row.gold === badgeOld(row.lv));
    else assert("bdCap@" + row.lv, row.gold < badgeOld(row.lv) && row.gold === Math.floor(300 * Math.pow(2, row.lv) * Math.pow(1.25, 3)));
  }

  const pass = asserts.filter((a) => a.ok).length;
  const fail = asserts.filter((a) => !a.ok);
  const table = [
    "=== 模擬對照表 ===",
    "指標 | 改動前 | 改動後 | 門檻 | PASS/FAIL",
    "--- | --- | --- | --- | ---",
    "強化 e13 | " + enhOld(5, 13) + " | " + enh(5, 13) + " | 不變 | " + (enhOld(5, 13) === enh(5, 13) ? "PASS" : "FAIL"),
    "強化 e15 | " + enhOld(5, 15) + " | " + enh(5, 15) + " | <前・^4 | " + (enh(5, 15) < enhOld(5, 15) ? "PASS" : "FAIL"),
    "研讀 l8 | " + studyOld(8) + " | " + study(8) + " | 不變 | " + (studyOld(8) === study(8) ? "PASS" : "FAIL"),
    "研讀 l9 | " + studyOld(9) + " | " + study(9) + " | <前・^4 | " + (study(9) < studyOld(9) ? "PASS" : "FAIL"),
    "徽章 lv5 | " + badgeOld(5) + " | " + badge(5) + " | 不變 | " + (badgeOld(5) === badge(5) ? "PASS" : "FAIL"),
    "徽章 lv6 | " + badgeOld(6) + " | " + badge(6) + " | <前・^3 | " + (badge(6) < badgeOld(6) ? "PASS" : "FAIL"),
    "硬斷言:" + pass + "/" + asserts.length + " " + (fail.length ? "FAIL" : "PASS")
  ];

  const out = { ok: !errs.length && fail.length === 0, live, asserts, fail, errs, table: table.join("\n") };
  fs.writeFileSync(path.join(OUT, "round-97-v708-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, "round-97-v708-sim.txt"), out.table);
  console.log(out.table);
  console.log(JSON.stringify({ ok: out.ok, pass, total: asserts.length, errs, fail }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
