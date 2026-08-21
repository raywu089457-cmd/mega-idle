/* v787 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-176-v787";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=787", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    function measure(txt, titlePart) {
      return [...document.querySelectorAll("button")]
        .filter((b) => b.textContent.trim() === txt && (b.getAttribute("title") || "").includes(titlePart))
        .map((b) => {
          const r = b.getBoundingClientRect();
          return { h: Math.round(r.height), w: Math.round(r.width), t: b.getAttribute("title") || "" };
        });
    }

    // A: market weekly gold short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    MG.ui.more.openMarket();
    await new Promise((r) => setTimeout(r, 120));
    const marketBtns = measure("前往副本", "關閉並前往副本");

    // B: royal shop coins short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.kingdom = st.kingdom || {};
    st.kingdom.level = Math.max(12, st.kingdom.level || 1);
    st.currencies.royalCoins = 0;
    MG.ui.more.openRoyal();
    await new Promise((r) => setTimeout(r, 120));
    const royalBtns = measure("繼續挑戰", "捲回上方繼續挑戰");

    // C: altar honor marks short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.honor = 0;
    st.honorLvls = st.honorLvls || { dmg: 0, gold: 0, exp: 0 };
    st.honorLvls.dmg = 0; st.honorLvls.gold = 0; st.honorLvls.exp = 0;
    MG.ui.more.openAltar();
    await new Promise((r) => setTimeout(r, 100));
    const altarBtns = measure("前往競技場", "關閉並開啟競技場");

    return { market: marketBtns, royal: royalBtns, altar: altarBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const asserts = [
    { name: "marketH", ok: !!(r.market[0] && r.market[0].h >= 44) },
    { name: "royalH", ok: !!(r.royal[0] && r.royal[0].h >= 44) },
    { name: "altarH", ok: !!(r.altar[0] && r.altar[0].h >= 44) },
    { name: "srcMarket", ok: more.includes("v787：週限金幣不足（尚有庫存）空態 CTA") },
    { name: "srcRoyal", ok: more.includes("v787：王者幣不足（尚有庫存）空態 CTA") },
    { name: "srcAltar", ok: more.includes("v787：榮譽印記升級榮譽不足空態 CTA") },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, r, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
