/* v720 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-109-v720";

function seg(lvl) { return Math.floor((lvl - 100) / 20) + 1; }
function trainExp(lvl) {
  let e = 40 * Math.pow(lvl, 1.5);
  if (lvl >= 100) e *= Math.pow(1.2, Math.min(seg(lvl), 4));
  return Math.floor(e);
}
function trainExpOld(lvl) {
  let e = 40 * Math.pow(lvl, 1.5);
  if (lvl >= 100) e *= Math.pow(1.2, seg(lvl));
  return Math.floor(e);
}
function awakenGold(aw) {
  let gold = 500000 * Math.pow(3, aw);
  if (aw >= 1) gold *= Math.pow(1.2, Math.min(aw, 1));
  return Math.floor(gold);
}
function awakenGoldOld(aw) {
  let gold = 500000 * Math.pow(3, aw);
  if (aw >= 1) gold *= Math.pow(1.2, aw);
  return Math.floor(gold);
}
function gemCost(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 8))));
}
function gemCostOld(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 15))));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=720", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.data.hunters && MG.sys.hunters);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    const D = MG.data.hunters;
    const teRows = [99, 100, 160, 180, 200].map((lvl) => ({ lvl, exp: D.trainExp(lvl) }));
    const gemRows = [0, 25, 33, 40, 50].map((n) => ({ n, cost: D.recruit.gem.cost(n) }));
    const artId = "dragon_scale";
    st.artifacts = st.artifacts || { owned: {}, levels: {}, awake: {} };
    st.artifacts.owned = st.artifacts.owned || {};
    st.artifacts.levels = st.artifacts.levels || {};
    st.artifacts.awake = st.artifacts.awake || {};
    st.artifacts.owned[artId] = true;
    st.artifacts.levels[artId] = 10;
    const awRows = [0, 1, 2].map((aw) => {
      st.artifacts.awake[artId] = aw;
      const ac = MG.sys.hunters.artifactAwakenCost(artId);
      return { aw, gold: ac ? ac.gold : null };
    });
    return { teRows, gemRows, awRows, artId };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });

  for (const row of live.teRows) {
    assert("te==@" + row.lvl, row.exp === trainExp(row.lvl));
    if (row.lvl <= 160) assert("teUnch@" + row.lvl, row.exp === trainExpOld(row.lvl));
    else assert("teCap@" + row.lvl, row.exp < trainExpOld(row.lvl));
  }
  for (const row of live.gemRows) {
    assert("gem==@" + row.n, row.cost === gemCost(row.n));
    if (row.n <= 33) assert("gemUnch@" + row.n, row.cost === gemCostOld(row.n));
    else assert("gemCap@" + row.n, row.cost < gemCostOld(row.n));
  }
  for (const row of live.awRows) {
    assert("aw==@" + row.aw, row.gold === awakenGold(row.aw));
    if (row.aw <= 1) assert("awUnch@" + row.aw, row.gold === awakenGoldOld(row.aw));
    else assert("awCap@" + row.aw, row.gold < awakenGoldOld(row.aw));
  }

  const srcH = fs.readFileSync(path.join(__dirname, "../js/data/hunters.js"), "utf8");
  const srcS = fs.readFileSync(path.join(__dirname, "../js/sys/hunters.js"), "utf8");
  assert("srcTe", srcH.includes("v720：加深指數軟封頂 min(seg,4)") && srcH.includes("trainExp"));
  assert("srcGem", srcH.includes("min(n - 25, 8)"));
  assert("srcAw", srcS.includes("Math.min(aw, 1)") && srcS.includes("v720"));
  assert("noErr", !errs.length);

  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, live, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  const table = "=== 數值平衡驗證 ===\n" +
    "trainExp@" + live.teRows.map((r) => r.lvl + "=" + r.exp).join(" ") + "\n" +
    "gem@" + live.gemRows.map((r) => r.n + "=" + r.cost).join(" ") + "\n" +
    "awaken@" + live.awRows.map((r) => r.aw + "=" + r.gold).join(" ") + " art=" + live.artId + "\n" +
    "硬斷言:" + asserts.filter((a) => a.ok).length + "/" + asserts.length +
    (fail.length ? " FAIL " + fail.map((f) => f.name).join(",") : " PASS");
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), table);
  console.log(table);
  console.log(JSON.stringify({ ok: out.ok, pass: asserts.filter((a) => a.ok).length, total: asserts.length, fail, errs }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
