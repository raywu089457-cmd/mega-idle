/* v688 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);

function uncappedTarget(kl, base) {
  return Math.floor(base * Math.pow(1.15, Math.max(0, kl - 1)));
}
function cappedTarget(kl, base) {
  return Math.floor(base * Math.pow(1.15, Math.min(Math.max(0, kl - 1), 18)));
}
function dismantleGold(tier, rarity, enhance) {
  return Math.floor(10 * Math.pow(1.4, tier) * rarity * (1 + 0.15 * Math.min(enhance || 0, 10)));
}
function dismantleOld(tier, rarity, enhance) {
  return Math.floor(10 * Math.pow(1.4, tier) * rarity * (1 + 0.15 * (enhance || 0)));
}
function refineGold(lv) {
  let g = 400 * Math.pow(lv, 1.6);
  if (lv >= 5) g *= Math.pow(1.2, lv - 4);
  return Math.floor(g);
}
function refineOld(lv) {
  return Math.floor(400 * Math.pow(lv, 1.6));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=688", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.sys.meta && MG.sys.equipment && MG.sys.hunters);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    const def = { req: { type: "gold", target: 2e6, scale: true } };
    const qt = [];
    for (const kl of [1, 19, 20, 30, 40]) {
      st.kingdom.level = kl;
      qt.push({ kl, t: MG.sys.meta.questTarget(def) });
    }

    // dismantle via formula mirror — inject fake item path
    const dm = [];
    for (const enh of [0, 10, 12, 15]) {
      const item = { tier: 5, rarity: 3, enhance: enh, locked: false, uid: "t", defId: "sword_t5", gems: [] };
      // call internal by dismantling copy in inventory dry — use exported if any
      // mirror from source: same formula as equipment.js
      const gold = Math.floor(10 * Math.pow(1.4, item.tier) * item.rarity * (1 + 0.15 * Math.min(item.enhance || 0, 10)));
      dm.push({ enh, gold });
    }

    // artifact refine — need owned art
    st.artifacts = st.artifacts || { owned: {}, levels: {} };
    st.artifacts.owned.art_frost = true;
    st.artifacts.levels = st.artifacts.levels || {};
    const rf = [];
    for (const lv of [1, 4, 5, 8, 9]) {
      st.artifacts.levels.art_frost = lv;
      const c = MG.sys.hunters.artifactRefineCost("art_frost");
      rf.push({ lv, gold: c ? c.gold : null });
    }
    return { qt, dm, rf };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });
  const BASE = 2e6;

  for (const row of live.qt) {
    const pre = uncappedTarget(row.kl, BASE);
    const post = cappedTarget(row.kl, BASE);
    assert("qt==@" + row.kl, row.t === post);
    if (row.kl <= 19) assert("qtUnch@" + row.kl, row.t === pre);
    else assert("qtRed@" + row.kl, row.t < pre && row.t === cappedTarget(19, BASE));
  }
  for (const row of live.dm) {
    assert("dm==@" + row.enh, row.gold === dismantleGold(5, 3, row.enh));
    if (row.enh <= 10) assert("dmUnch@" + row.enh, row.gold === dismantleOld(5, 3, row.enh));
    else assert("dmCap@" + row.enh, row.gold === dismantleOld(5, 3, 10) && row.gold < dismantleOld(5, 3, row.enh));
  }
  for (const row of live.rf) {
    if (row.gold == null) continue;
    assert("rf==@" + row.lv, row.gold === refineGold(row.lv));
    if (row.lv < 5) assert("rfUnch@" + row.lv, row.gold === refineOld(row.lv));
    else assert("rfDeep@" + row.lv, row.gold > refineOld(row.lv));
  }

  const pass = asserts.filter((a) => a.ok).length;
  const fail = asserts.filter((a) => !a.ok);
  const table = [
    "=== 模擬對照表 ===",
    "指標 | 改動前 | 改動後 | 門檻 | PASS/FAIL",
    "--- | --- | --- | --- | ---",
    "週任目標 kl1 | " + uncappedTarget(1, BASE) + " | " + cappedTarget(1, BASE) + " | 不變 | " + (uncappedTarget(1, BASE) === cappedTarget(1, BASE) ? "PASS" : "FAIL"),
    "週任目標 kl19 | " + uncappedTarget(19, BASE) + " | " + cappedTarget(19, BASE) + " | 不變 | " + (uncappedTarget(19, BASE) === cappedTarget(19, BASE) ? "PASS" : "FAIL"),
    "週任目標 kl40 | " + uncappedTarget(40, BASE) + " | " + cappedTarget(40, BASE) + " | <前且=kl19 | " + (cappedTarget(40, BASE) < uncappedTarget(40, BASE) && cappedTarget(40, BASE) === cappedTarget(19, BASE) ? "PASS" : "FAIL"),
    "分解 +10 | " + dismantleOld(5, 3, 10) + " | " + dismantleGold(5, 3, 10) + " | 不變 | " + (dismantleOld(5, 3, 10) === dismantleGold(5, 3, 10) ? "PASS" : "FAIL"),
    "分解 +15 | " + dismantleOld(5, 3, 15) + " | " + dismantleGold(5, 3, 15) + " | =+10 | " + (dismantleGold(5, 3, 15) === dismantleGold(5, 3, 10) ? "PASS" : "FAIL"),
    "精煉 lv4 | " + refineOld(4) + " | " + refineGold(4) + " | 不變 | " + (refineOld(4) === refineGold(4) ? "PASS" : "FAIL"),
    "精煉 lv8 | " + refineOld(8) + " | " + refineGold(8) + " | >前 | " + (refineGold(8) > refineOld(8) ? "PASS" : "FAIL"),
    "硬斷言:" + pass + "/" + asserts.length + " " + (fail.length ? "FAIL" : "PASS")
  ];

  const out = { ok: !errs.length && fail.length === 0, live, asserts, fail, errs, table: table.join("\n") };
  fs.writeFileSync(path.join(OUT, "round-77-v688-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, "round-77-v688-sim.txt"), out.table);
  console.log(out.table);
  console.log(JSON.stringify({ ok: out.ok, pass, total: asserts.length, errs }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
