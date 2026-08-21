/* v836 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-225-v836";

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
  await page.goto("http://127.0.0.1:8123/index.html?v=836", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.sys && MG.sys.guild && MG.sys.dungeon);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.guild = st.guild || { level: 1, tech: {} };
    st.hunters = [];
    st.formation = [];
    st.guild.level = 13;
    const boss13 = MG.sys.guild.bossMaxHp();
    st.guild.level = 20;
    const boss20 = MG.sys.guild.bossMaxHp();
    st.guild.level = 1;
    st.kingdom = st.kingdom || {};
    st.kingdom.level = 20;
    const dRec = MG.sys.dungeon.recPower();
    return {
      e4: MG.sys.guild.expNeed(4),
      e5: MG.sys.guild.expNeed(5),
      e20: MG.sys.guild.expNeed(20),
      boss13, boss20, dRec
    };
  });
  const asserts = [
    { name: "exp4unchanged", ok: expNeed(4, 4) === expNeed(4, 6) && live.e4 === expNeed(4, 4) },
    { name: "exp5cheaper", ok: expNeed(5, 4) < expNeed(5, 6) && live.e5 === expNeed(5, 4) && live.e20 === expNeed(20, 4) },
    { name: "boss13unchanged", ok: bossHp(13, 12) === bossHp(13, 14) && live.boss13 === bossHp(13, 12) },
    { name: "boss20cheaper", ok: bossHp(20, 12) < bossHp(20, 14) && live.boss20 === bossHp(20, 12) },
    { name: "dungCurveCheaper", ok: dungeonCurve(20, 12) < dungeonCurve(20, 14) && live.dRec === dungeonCurve(20, 12) },
    { name: "dung13same", ok: dungeonCurve(13, 12) === dungeonCurve(13, 14) },
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
