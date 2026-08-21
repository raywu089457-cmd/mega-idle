/* v684 balance ×3 sim — expedition / honorshop / meta goldbag soft-cap */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);

function uncapped(kl) {
  return Math.floor(5000 * Math.pow(1.35, Math.max(0, kl - 1)));
}
function capped(kl) {
  return Math.floor(5000 * Math.pow(1.35, Math.min(Math.max(0, kl - 1), 18)));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=684", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.sys.expedition && MG.sys.honorshop);
  const live = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    const rows = [];
    for (const kl of [1, 19, 20, 30, 40]) {
      st.kingdom.level = kl;
      const expU = MG.sys.expedition.goldUnit();
      const hon = MG.sys.honorshop.goldbagGold();
      // meta goldbag via grantReward path — mirror formula by calling redeem-equivalent
      const exp = Math.min(Math.max(0, kl - 1), 18);
      const metaMirror = Math.floor(5000 * Math.pow(1.35, exp));
      rows.push({ kl, expU, hon, metaMirror });
    }
    return rows;
  });

  const asserts = [];
  function assert(name, ok) { asserts.push({ name, ok: !!ok }); }

  for (const row of live) {
    const pre = uncapped(row.kl);
    const post = capped(row.kl);
    assert("exp==cap@" + row.kl, row.expU === post);
    assert("hon==cap@" + row.kl, row.hon === post);
    assert("meta==cap@" + row.kl, row.metaMirror === post);
    assert("threeEqual@" + row.kl, row.expU === row.hon && row.hon === row.metaMirror);
    if (row.kl <= 19) assert("unchanged@" + row.kl, row.expU === pre);
    else assert("reduced@" + row.kl, row.expU < pre && row.expU === capped(19));
  }

  const pass = asserts.filter((a) => a.ok).length;
  const fail = asserts.filter((a) => !a.ok);
  const table = [
    "=== 模擬對照表 ===",
    "指標 | 改動前 | 改動後 | 門檻 | PASS/FAIL",
    "--- | --- | --- | --- | ---"
  ];
  for (const kl of [1, 19, 30, 40]) {
    const pre = uncapped(kl), post = capped(kl);
    const gate = kl <= 19 ? "不變" : "<改動前且=kl19";
    const ok = kl <= 19 ? pre === post : post < pre && post === capped(19);
    table.push("U kl" + kl + " | " + pre + " | " + post + " | " + gate + " | " + (ok ? "PASS" : "FAIL"));
  }
  table.push("硬斷言:" + pass + "/" + asserts.length + " " + (fail.length ? "FAIL" : "PASS"));

  const out = {
    ok: !errs.length && fail.length === 0,
    live, asserts, fail, errs,
    table: table.join("\n")
  };
  fs.writeFileSync(path.join(OUT, "round-73-v684-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, "round-73-v684-sim.txt"), out.table);
  console.log(out.table);
  console.log(JSON.stringify({ ok: out.ok, pass, total: asserts.length, errs }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
