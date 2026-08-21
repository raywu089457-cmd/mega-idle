/* v696 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);

function tech(cur) { return Math.floor(800 * Math.pow(1.65, Math.min(Math.max(0, cur), 10))); }
function techOld(cur) { return Math.floor(800 * Math.pow(1.65, Math.max(0, cur))); }
function fuse(t) {
  let fee = 200 * Math.pow(1.45, Math.min(t - 1, 8));
  if (t >= 6) fee *= Math.pow(1.25, t - 5);
  return Math.floor(fee);
}
function fuseOld(t) {
  let fee = 200 * Math.pow(1.45, t - 1);
  if (t >= 6) fee *= Math.pow(1.25, t - 5);
  return Math.floor(fee);
}
function aw(a) {
  let g = 500000 * Math.pow(3, a);
  if (a >= 1) g *= Math.pow(1.2, a);
  return Math.floor(g);
}
function awOld(a) { return Math.floor(500000 * Math.pow(3, a)); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=696", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.sys.guild && MG.sys.equipment && MG.sys.hunters);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    const techRows = [];
    for (const cur of [0, 10, 11, 15]) {
      techRows.push({ cur, cost: MG.sys.guild.techCost("atk", cur) });
    }
    const fuseRows = [];
    for (const t of [5, 9, 10, 12]) {
      fuseRows.push({ t, cost: MG.sys.equipment.gemFuseCost(t) });
    }

    // awaken: need artifact at lv10
    st.artifacts = st.artifacts || { owned: {}, levels: {} };
    if (!st.artifacts.levels) st.artifacts.levels = {};
    if (!st.artifacts.awake || typeof st.artifacts.awake !== "object") st.artifacts.awake = {};
    const aid = "dragon_scale";
    st.artifacts.levels[aid] = 10;
    st.artifacts.awake[aid] = 0;
    st.currencies.gold = 1e12;
    st.mats.void = 999; st.mats.myth = 999;
    const aw0 = MG.sys.hunters.artifactAwakenCost(aid);
    st.artifacts.awake[aid] = 1;
    const aw1 = MG.sys.hunters.artifactAwakenCost(aid);
    st.artifacts.awake[aid] = 2;
    const aw2 = MG.sys.hunters.artifactAwakenCost(aid);

    return {
      techRows, fuseRows,
      aw: [{ aw: 0, gold: aw0 && aw0.gold }, { aw: 1, gold: aw1 && aw1.gold }, { aw: 2, gold: aw2 && aw2.gold }]
    };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });

  for (const row of live.techRows) {
    assert("tech==@" + row.cur, row.cost === tech(row.cur));
    if (row.cur <= 10) assert("techUnch@" + row.cur, row.cost === techOld(row.cur));
    else assert("techCap@" + row.cur, row.cost === tech(10) && row.cost < techOld(row.cur));
  }
  for (const row of live.fuseRows) {
    assert("fuse==@" + row.t, row.cost === fuse(row.t));
    if (row.t <= 9) assert("fuseUnch@" + row.t, row.cost === fuseOld(row.t));
    else assert("fuseCap@" + row.t, row.cost < fuseOld(row.t));
  }
  for (const row of live.aw) {
    assert("aw==@" + row.aw, row.gold === aw(row.aw));
    if (row.aw === 0) assert("awUnch0", row.gold === awOld(0));
    else assert("awDeep@" + row.aw, row.gold > awOld(row.aw));
  }

  const pass = asserts.filter((a) => a.ok).length;
  const fail = asserts.filter((a) => !a.ok);
  const table = [
    "=== 模擬對照表 ===",
    "指標 | 改動前 | 改動後 | 門檻 | PASS/FAIL",
    "--- | --- | --- | --- | ---",
    "科技 cur10 | " + techOld(10) + " | " + tech(10) + " | 不變 | " + (techOld(10) === tech(10) ? "PASS" : "FAIL"),
    "科技 cur15 | " + techOld(15) + " | " + tech(15) + " | =cur10 | " + (tech(15) === tech(10) ? "PASS" : "FAIL"),
    "融合 t9 | " + fuseOld(9) + " | " + fuse(9) + " | 不變 | " + (fuseOld(9) === fuse(9) ? "PASS" : "FAIL"),
    "融合 t12 | " + fuseOld(12) + " | " + fuse(12) + " | <前 | " + (fuse(12) < fuseOld(12) ? "PASS" : "FAIL"),
    "覺醒 aw0 | " + awOld(0) + " | " + aw(0) + " | 不變 | " + (awOld(0) === aw(0) ? "PASS" : "FAIL"),
    "覺醒 aw2 | " + awOld(2) + " | " + aw(2) + " | >前 | " + (aw(2) > awOld(2) ? "PASS" : "FAIL"),
    "硬斷言:" + pass + "/" + asserts.length + " " + (fail.length ? "FAIL" : "PASS")
  ];

  const out = { ok: !errs.length && fail.length === 0, live, asserts, fail, errs, table: table.join("\n") };
  fs.writeFileSync(path.join(OUT, "round-85-v696-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, "round-85-v696-sim.txt"), out.table);
  console.log(out.table);
  console.log(JSON.stringify({ ok: out.ok, pass, total: asserts.length, errs }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
