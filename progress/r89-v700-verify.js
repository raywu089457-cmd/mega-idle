/* v700 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);

function bossHp(lv) {
  const exp = Math.min(Math.max(0, lv - 1), 16);
  return lv >= 15
    ? Math.floor(700000 * Math.pow(1.62, exp))
    : Math.floor(400000 * Math.pow(1.55, exp));
}
function bossHpOld(lv) {
  return lv >= 15
    ? Math.floor(700000 * Math.pow(1.62, lv - 1))
    : Math.floor(400000 * Math.pow(1.55, lv - 1));
}
function dismissCeil(level, rarity) {
  const lvCap = Math.min(Math.max(1, level || 1), 50);
  return Math.floor(50 * Math.pow(1.4, lvCap) * rarity);
}
function dismissCeilOld(level, rarity) {
  return Math.floor(50 * Math.pow(1.4, level) * rarity);
}
function skillCost(lvl) {
  if (lvl >= 10) return -1;
  let c = lvl * (lvl < 5 ? 2 : 3);
  if (lvl >= 7) c = Math.floor(c * Math.pow(1.3, lvl - 6));
  return c;
}
function skillCostOld(lvl) {
  if (lvl >= 10) return -1;
  return lvl * (lvl < 5 ? 2 : 3);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=700", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.sys.guild && MG.sys.hunters);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    const bossRows = [];
    for (const lv of [1, 14, 15, 17, 18, 20]) {
      st.guild.level = lv;
      bossRows.push({ lv, hp: MG.sys.guild.bossMaxHp() });
    }

    const dismissRows = [];
    for (const level of [1, 50, 51, 80]) {
      const h = { level, rarity: 3, spentGold: 1e15, legend: null };
      // force spent path via spentGold / resetRefund — dismissCost uses resetRefund then formula
      h.spentGold = 1e15;
      const d = MG.sys.hunters.dismissCost(h);
      dismissRows.push({ level, refund: d.refund, ceil: Math.floor(50 * Math.pow(1.4, Math.min(level, 50)) * 3) });
    }

    const skillRows = [];
    const hero = { skills: {} };
    for (const lvl of [1, 5, 6, 7, 8, 9]) {
      hero.skills.s1 = lvl;
      skillRows.push({ lvl, cost: MG.sys.hunters.skillUpCost(hero, "s1") });
    }

    return { bossRows, dismissRows, skillRows };
  });

  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });

  for (const row of live.bossRows) {
    assert("boss==@" + row.lv, row.hp === bossHp(row.lv));
    if (row.lv <= 17) assert("bossUnch@" + row.lv, row.hp === bossHpOld(row.lv));
    else assert("bossCap@" + row.lv, row.hp === bossHp(17) && row.hp < bossHpOld(row.lv));
  }
  for (const row of live.dismissRows) {
    assert("dismiss==@" + row.level, row.refund === dismissCeil(row.level, 3));
    if (row.level <= 50) assert("dismissUnch@" + row.level, row.refund === dismissCeilOld(row.level, 3));
    else assert("dismissCap@" + row.level, row.refund === dismissCeil(50, 3) && row.refund < dismissCeilOld(row.level, 3));
  }
  for (const row of live.skillRows) {
    assert("skill==@" + row.lvl, row.cost === skillCost(row.lvl));
    if (row.lvl < 7) assert("skillUnch@" + row.lvl, row.cost === skillCostOld(row.lvl));
    else assert("skillDeep@" + row.lvl, row.cost > skillCostOld(row.lvl));
  }

  const pass = asserts.filter((a) => a.ok).length;
  const fail = asserts.filter((a) => a.ok === false);
  const table = [
    "=== 模擬對照表 ===",
    "指標 | 改動前 | 改動後 | 門檻 | PASS/FAIL",
    "--- | --- | --- | --- | ---",
    "首領 Lv17 | " + bossHpOld(17) + " | " + bossHp(17) + " | 不變 | " + (bossHpOld(17) === bossHp(17) ? "PASS" : "FAIL"),
    "首領 Lv20 | " + bossHpOld(20) + " | " + bossHp(20) + " | =Lv17 | " + (bossHp(20) === bossHp(17) ? "PASS" : "FAIL"),
    "遣散 Lv50 | " + dismissCeilOld(50, 3) + " | " + dismissCeil(50, 3) + " | 不變 | " + (dismissCeilOld(50, 3) === dismissCeil(50, 3) ? "PASS" : "FAIL"),
    "遣散 Lv80 | " + dismissCeilOld(80, 3) + " | " + dismissCeil(80, 3) + " | =Lv50 | " + (dismissCeil(80, 3) === dismissCeil(50, 3) ? "PASS" : "FAIL"),
    "技能 Lv6 | " + skillCostOld(6) + " | " + skillCost(6) + " | 不變 | " + (skillCostOld(6) === skillCost(6) ? "PASS" : "FAIL"),
    "技能 Lv9 | " + skillCostOld(9) + " | " + skillCost(9) + " | >前 | " + (skillCost(9) > skillCostOld(9) ? "PASS" : "FAIL"),
    "硬斷言:" + pass + "/" + asserts.length + " " + (fail.length ? "FAIL" : "PASS")
  ];

  const out = { ok: !errs.length && fail.length === 0, live, asserts, fail, errs, table: table.join("\n") };
  fs.writeFileSync(path.join(OUT, "round-89-v700-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, "round-89-v700-sim.txt"), out.table);
  console.log(out.table);
  console.log(JSON.stringify({ ok: out.ok, pass, total: asserts.length, errs, fail }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
