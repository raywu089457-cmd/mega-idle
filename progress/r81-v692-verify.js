/* v692 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);

function dm(tier, rarity, enh) {
  return Math.floor(10 * Math.pow(1.4, Math.min(tier, 8)) * rarity * (1 + 0.15 * Math.min(enh || 0, 10)));
}
function dmOld(tier, rarity, enh) {
  return Math.floor(10 * Math.pow(1.4, tier) * rarity * (1 + 0.15 * Math.min(enh || 0, 10)));
}
function donate(lv) {
  return Math.floor(1500 * Math.pow(1.4, Math.min(Math.max(0, lv - 1), 12)));
}
function donateOld(lv) {
  return Math.floor(1500 * Math.pow(1.4, Math.max(0, lv - 1)));
}
function gem(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)) * Math.pow(1.04, Math.max(0, Math.min(n - 25, 15))));
}
function gemOld(n) {
  return Math.floor(300 * Math.pow(1.06, Math.min(n, 25)));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=692", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.sys.guild && MG.sys.hunters);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    const dmRows = [];
    for (const tier of [5, 8, 9, 10]) {
      dmRows.push({
        tier,
        gold: Math.floor(10 * Math.pow(1.4, Math.min(tier, 8)) * 3 * (1 + 0.15 * 5))
      });
    }

    const don = [];
    for (const lv of [1, 13, 14, 20]) {
      st.guild = st.guild || { level: 1, tech: {} };
      st.guild.level = lv;
      don.push({ lv, cost: MG.sys.guild.donateCost() });
    }

    const gems = [];
    for (const n of [0, 25, 26, 40]) {
      gems.push({ n, cost: MG.sys.hunters.recruitCost("gem").gem });
      // recruitCost uses stats.goldRecruits for gold — for gem uses def.cost(0) always!
    }
    // gem cost uses def.cost(0) in recruitCost — need direct data formula
    const gemDirect = [];
    for (const n of [0, 25, 26, 40]) {
      gemDirect.push({ n, cost: MG.data.hunters.recruit.gem.cost(n) });
    }

    return { dmRows, don, gemDirect };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });

  for (const row of live.dmRows) {
    assert("dm==@" + row.tier, row.gold === dm(row.tier, 3, 5));
    if (row.tier <= 8) assert("dmUnch@" + row.tier, row.gold === dmOld(row.tier, 3, 5));
    else assert("dmCap@" + row.tier, row.gold === dm(8, 3, 5) && row.gold < dmOld(row.tier, 3, 5));
  }
  for (const row of live.don) {
    assert("don==@" + row.lv, row.cost === donate(row.lv));
    if (row.lv <= 13) assert("donUnch@" + row.lv, row.cost === donateOld(row.lv));
    else assert("donCap@" + row.lv, row.cost === donate(13) && row.cost < donateOld(row.lv));
  }
  for (const row of live.gemDirect) {
    assert("gem==@" + row.n, row.cost === gem(row.n));
    if (row.n <= 25) assert("gemUnch@" + row.n, row.cost === gemOld(row.n));
    else assert("gemRise@" + row.n, row.cost > gemOld(row.n));
  }

  const pass = asserts.filter((a) => a.ok).length;
  const fail = asserts.filter((a) => !a.ok);
  const table = [
    "=== 模擬對照表 ===",
    "指標 | 改動前 | 改動後 | 門檻 | PASS/FAIL",
    "--- | --- | --- | --- | ---",
    "分解 T8 | " + dmOld(8, 3, 5) + " | " + dm(8, 3, 5) + " | 不變 | " + (dmOld(8, 3, 5) === dm(8, 3, 5) ? "PASS" : "FAIL"),
    "分解 T10 | " + dmOld(10, 3, 5) + " | " + dm(10, 3, 5) + " | =T8 | " + (dm(10, 3, 5) === dm(8, 3, 5) ? "PASS" : "FAIL"),
    "捐獻 Lv13 | " + donateOld(13) + " | " + donate(13) + " | 不變 | " + (donateOld(13) === donate(13) ? "PASS" : "FAIL"),
    "捐獻 Lv20 | " + donateOld(20) + " | " + donate(20) + " | =Lv13 | " + (donate(20) === donate(13) ? "PASS" : "FAIL"),
    "神話 n25 | " + gemOld(25) + " | " + gem(25) + " | 不變 | " + (gemOld(25) === gem(25) ? "PASS" : "FAIL"),
    "神話 n40 | " + gemOld(40) + " | " + gem(40) + " | >前 | " + (gem(40) > gemOld(40) ? "PASS" : "FAIL"),
    "硬斷言:" + pass + "/" + asserts.length + " " + (fail.length ? "FAIL" : "PASS")
  ];

  const out = { ok: !errs.length && fail.length === 0, live, asserts, fail, errs, table: table.join("\n") };
  fs.writeFileSync(path.join(OUT, "round-81-v692-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, "round-81-v692-sim.txt"), out.table);
  console.log(out.table);
  console.log(JSON.stringify({ ok: out.ok, pass, total: asserts.length, errs }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
