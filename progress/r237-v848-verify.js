/* v848 balance ×3 sim */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-237-v848";

function bossHp(lv, cap) {
  const exp = Math.min(Math.max(0, lv - 1), cap);
  return lv >= 15
    ? Math.floor(700000 * Math.pow(1.62, exp))
    : Math.floor(400000 * Math.pow(1.55, exp));
}
function dungeonCurve(kl, cap) {
  return Math.floor(200 * Math.pow(1.5, Math.min(kl - 1, cap)) * 0.35);
}
function towerCurve(layer, cap) {
  return Math.floor(200 * Math.pow(1.5, Math.min(layer - 1, cap)) * 0.35);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=848", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.sys && MG.sys.guild && MG.sys.dungeon);
  const live = await page.evaluate(() => {
    const st = MG.game.state;
    st.tutorial = 99;
    st.guild = st.guild || { level: 1, tech: {} };
    st.hunters = [];
    st.formation = [];
    st.guild.level = 7;
    const boss7 = MG.sys.guild.bossMaxHp();
    st.guild.level = 20;
    const boss20 = MG.sys.guild.bossMaxHp();
    st.guild.level = 1;
    st.kingdom = st.kingdom || {};
    st.kingdom.level = 20;
    const dRec = MG.sys.dungeon.recPower();
    return { boss7, boss20, dRec };
  });
  const tw = fs.readFileSync(path.join(__dirname, "../js/sys/tower.js"), "utf8");
  const asserts = [
    { name: "boss7unchanged", ok: bossHp(7, 6) === bossHp(7, 8) && live.boss7 === bossHp(7, 6) },
    { name: "boss20cheaper", ok: bossHp(20, 6) < bossHp(20, 8) && live.boss20 === bossHp(20, 6) },
    { name: "dungCurveCheaper", ok: dungeonCurve(20, 6) < dungeonCurve(20, 8) && live.dRec === dungeonCurve(20, 6) },
    { name: "dung7same", ok: dungeonCurve(7, 6) === dungeonCurve(7, 8) },
    { name: "towerCheaper", ok: towerCurve(20, 14) < towerCurve(20, 16) },
    { name: "tower15same", ok: towerCurve(15, 14) === towerCurve(15, 16) },
    { name: "srcTower", ok: tw.includes("min(layer - 1, 14)") && tw.includes("v848") },
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
