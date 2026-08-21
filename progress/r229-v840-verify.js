/* v840 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-229-v840";

function expNeed(lv, cap) {
  return Math.floor(120 * Math.pow(Math.min(Math.max(1, lv), cap), 1.6));
}
function bossHp(lv, cap) {
  const exp = Math.min(Math.max(0, lv - 1), cap);
  return lv >= 15
    ? Math.floor(700000 * Math.pow(1.62, exp))
    : Math.floor(400000 * Math.pow(1.55, exp));
}
function dungeonCurve(kl, cap) {
  return Math.floor(200 * Math.pow(1.5, Math.min(kl - 1, cap)) * 0.35);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=840", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.sys && MG.sys.guild && MG.sys.dungeon);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.guild = st.guild || { level: 1, tech: {} };
    st.hunters = [];
    st.formation = [];
    st.guild.level = 11;
    const boss11 = MG.sys.guild.bossMaxHp();
    st.guild.level = 20;
    const boss20 = MG.sys.guild.bossMaxHp();
    st.guild.level = 1;
    st.kingdom = st.kingdom || {};
    st.kingdom.level = 20;
    const dRec = MG.sys.dungeon.recPower();
    return {
      e2: MG.sys.guild.expNeed(2),
      e3: MG.sys.guild.expNeed(3),
      e20: MG.sys.guild.expNeed(20),
      boss11, boss20, dRec
    };
  });
  const asserts = [
    { name: "exp2unchanged", ok: expNeed(2, 2) === expNeed(2, 4) && live.e2 === expNeed(2, 2) },
    { name: "exp3cheaper", ok: expNeed(3, 2) < expNeed(3, 4) && live.e3 === expNeed(3, 2) && live.e20 === expNeed(20, 2) },
    { name: "boss11unchanged", ok: bossHp(11, 10) === bossHp(11, 12) && live.boss11 === bossHp(11, 10) },
    { name: "boss20cheaper", ok: bossHp(20, 10) < bossHp(20, 12) && live.boss20 === bossHp(20, 10) },
    { name: "dungCurveCheaper", ok: dungeonCurve(20, 10) < dungeonCurve(20, 12) && live.dRec === dungeonCurve(20, 10) },
    { name: "dung11same", ok: dungeonCurve(11, 10) === dungeonCurve(11, 12) },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, live, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, live }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
