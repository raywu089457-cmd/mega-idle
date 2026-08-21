/* v728 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-117-v728";

function enhance(tier, e) {
  let c = Math.pow(1.5, e) * 40 * Math.pow(tier, 1.6);
  if (e >= 10) c *= Math.pow(1.35, Math.min(e - 9, 3));
  return Math.floor(c);
}
function enhanceOld(tier, e) {
  let c = Math.pow(1.5, e) * 40 * Math.pow(tier, 1.6);
  if (e >= 10) c *= Math.pow(1.35, Math.min(e - 9, 4));
  return Math.floor(c);
}
function study(l) {
  const base = 15 * (l + 1);
  if (l < 5) return base;
  return Math.floor(base * Math.pow(1.4, Math.min(l - 4, 3)));
}
function studyOld(l) {
  const base = 15 * (l + 1);
  if (l < 5) return base;
  return Math.floor(base * Math.pow(1.4, Math.min(l - 4, 4)));
}
function fuse(t) {
  let fee = 200 * Math.pow(1.45, Math.min(t - 1, 8));
  if (t >= 6) fee *= Math.pow(1.25, Math.min(t - 5, 2));
  return Math.floor(fee);
}
function fuseOld(t) {
  let fee = 200 * Math.pow(1.45, Math.min(t - 1, 8));
  if (t >= 6) fee *= Math.pow(1.25, Math.min(t - 5, 3));
  return Math.floor(fee);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=728", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.data.equipment && MG.sys.meta && MG.sys.equipment);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    const ED = MG.data.equipment;
    const enhRows = [9, 10, 12, 13, 15].map((e) => ({ e, cost: ED.enhanceCost(5, e) }));
    const studyRows = [];
    for (const l of [4, 5, 7, 8, 9]) {
      st.studyLvl = l;
      studyRows.push({ l, cost: MG.sys.meta.studyCost() });
    }
    const fuseRows = [5, 6, 7, 8, 10].map((t) => ({ t, cost: MG.sys.equipment.gemFuseCost(t) }));
    return { enhRows, studyRows, fuseRows };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });

  for (const row of live.enhRows) {
    assert("e==@" + row.e, row.cost === enhance(5, row.e));
    if (row.e <= 12) assert("eUnch@" + row.e, row.cost === enhanceOld(5, row.e));
    else assert("eCap@" + row.e, row.cost < enhanceOld(5, row.e));
  }
  for (const row of live.studyRows) {
    assert("s==@" + row.l, row.cost === study(row.l));
    if (row.l <= 7) assert("sUnch@" + row.l, row.cost === studyOld(row.l));
    else assert("sCap@" + row.l, row.cost < studyOld(row.l));
  }
  for (const row of live.fuseRows) {
    assert("f==@" + row.t, row.cost === fuse(row.t));
    if (row.t <= 7) assert("fUnch@" + row.t, row.cost === fuseOld(row.t));
    else assert("fCap@" + row.t, row.cost < fuseOld(row.t));
  }

  const srcE = fs.readFileSync(path.join(__dirname, "../js/data/equipment.js"), "utf8");
  const srcM = fs.readFileSync(path.join(__dirname, "../js/sys/meta.js"), "utf8");
  const srcEq = fs.readFileSync(path.join(__dirname, "../js/sys/equipment.js"), "utf8");
  assert("srcEnh", srcE.includes("min(enhance - 9, 3)") && srcE.includes("v728"));
  assert("srcStudy", srcM.includes("min(l - 4, 3)") && srcM.includes("v728"));
  assert("srcFuse", srcEq.includes("min(t - 5, 2)") && srcEq.includes("v728"));
  assert("noErr", !errs.length);

  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, live, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  const table = "=== 數值平衡驗證 ===\n" +
    "enh@" + live.enhRows.map((r) => r.e + "=" + r.cost).join(" ") + "\n" +
    "study@" + live.studyRows.map((r) => r.l + "=" + r.cost).join(" ") + "\n" +
    "fuse@" + live.fuseRows.map((r) => r.t + "=" + r.cost).join(" ") + "\n" +
    "硬斷言:" + asserts.filter((a) => a.ok).length + "/" + asserts.length +
    (fail.length ? " FAIL " + fail.map((f) => f.name).join(",") : " PASS");
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), table);
  console.log(table);
  console.log(JSON.stringify({ ok: out.ok, pass: asserts.filter((a) => a.ok).length, total: asserts.length, fail, errs }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
