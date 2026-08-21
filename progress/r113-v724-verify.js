/* v724 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-113-v724";

function goldCost(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 12))));
}
function goldCostOld(n) {
  return Math.floor(150 * Math.pow(2.1, Math.min(n, 10)) * Math.pow(1.06, Math.max(0, Math.min(n - 10, 20))));
}
function honor(l, aw) {
  return Math.floor(50 * Math.pow(2, l) * Math.pow(1.12, Math.min(4, aw)));
}
function honorOld(l, aw) {
  return Math.floor(50 * Math.pow(2, l) * Math.pow(1.12, Math.min(8, aw)));
}
function donate(lv) {
  return Math.floor(1500 * Math.pow(1.4, Math.min(Math.max(0, lv - 1), 8)));
}
function donateOld(lv) {
  return Math.floor(1500 * Math.pow(1.4, Math.min(Math.max(0, lv - 1), 12)));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=724", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.data.hunters && MG.sys.meta && MG.sys.guild);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    const D = MG.data.hunters;
    const goldRows = [0, 10, 22, 30, 40].map((n) => ({ n, cost: D.recruit.gold.cost(n) }));
    const honorRows = [];
    for (const aw of [0, 4, 6, 10]) {
      st.awakenings = aw;
      st.honorLvls = st.honorLvls || { atk: 0, def: 0, hp: 0 };
      st.honorLvls.atk = 2;
      honorRows.push({ aw, cost: MG.sys.meta.honorCost("atk") });
    }
    const donateRows = [];
    for (const lv of [1, 9, 13, 20]) {
      st.guild = st.guild || {};
      st.guild.level = lv;
      donateRows.push({ lv, cost: MG.sys.guild.donateCost() });
    }
    return { goldRows, honorRows, donateRows };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });

  for (const row of live.goldRows) {
    assert("g==@" + row.n, row.cost === goldCost(row.n));
    if (row.n <= 22) assert("gUnch@" + row.n, row.cost === goldCostOld(row.n));
    else assert("gCap@" + row.n, row.cost < goldCostOld(row.n));
  }
  for (const row of live.honorRows) {
    assert("h==@" + row.aw, row.cost === honor(2, row.aw));
    if (row.aw <= 4) assert("hUnch@" + row.aw, row.cost === honorOld(2, row.aw));
    else assert("hCap@" + row.aw, row.cost < honorOld(2, row.aw));
  }
  for (const row of live.donateRows) {
    assert("d==@" + row.lv, row.cost === donate(row.lv));
    if (row.lv <= 9) assert("dUnch@" + row.lv, row.cost === donateOld(row.lv));
    else assert("dCap@" + row.lv, row.cost < donateOld(row.lv));
  }

  const srcH = fs.readFileSync(path.join(__dirname, "../js/data/hunters.js"), "utf8");
  const srcM = fs.readFileSync(path.join(__dirname, "../js/sys/meta.js"), "utf8");
  const srcG = fs.readFileSync(path.join(__dirname, "../js/sys/guild.js"), "utf8");
  assert("srcGold", srcH.includes("min(n - 10, 12)"));
  assert("srcHonor", srcM.includes("Math.min(4, S().awakenings") && srcM.includes("v724"));
  assert("srcDonate", srcG.includes("), 8)") && srcG.includes("v724"));
  assert("noErr", !errs.length);

  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, live, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  const table = "=== 數值平衡驗證 ===\n" +
    "gold@" + live.goldRows.map((r) => r.n + "=" + r.cost).join(" ") + "\n" +
    "honor@" + live.honorRows.map((r) => r.aw + "=" + r.cost).join(" ") + "\n" +
    "donate@" + live.donateRows.map((r) => r.lv + "=" + r.cost).join(" ") + "\n" +
    "硬斷言:" + asserts.filter((a) => a.ok).length + "/" + asserts.length +
    (fail.length ? " FAIL " + fail.map((f) => f.name).join(",") : " PASS");
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), table);
  console.log(table);
  console.log(JSON.stringify({ ok: out.ok, pass: asserts.filter((a) => a.ok).length, total: asserts.length, fail, errs }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
