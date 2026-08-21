/* v783 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-172-v783";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=783", { waitUntil: "domcontentloaded" });
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

    // A: honor shop short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.honor = 0;
    if (st.honorShop) {
      Object.keys(st.honorShop.sold || {}).forEach((k) => { st.honorShop.sold[k] = 0; });
    }
    MG.ui.more.openHonorShop();
    await new Promise((r) => setTimeout(r, 80));
    const honorBtns = measure("前往競技場", "關閉並開啟競技場");

    // B: market gold short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    MG.ui.more.openMarket();
    await new Promise((r) => setTimeout(r, 100));
    const marketBtns = measure("前往副本", "關閉並前往副本");

    // C: altar can't awaken
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.hunt = st.hunt || {};
    st.hunt.region = 0;
    st.hunt.stage = 1;
    st.buildings = st.buildings || {};
    ["castle", "guild", "training", "forge"].forEach((k) => { st.buildings[k] = Math.min(st.buildings[k] || 0, 3); });
    MG.ui.more.openAltar();
    await new Promise((r) => setTimeout(r, 80));
    const altarBtns = measure("前往副本", "關閉並前往副本");

    return { honor: honorBtns, market: marketBtns, altar: altarBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const asserts = [
    { name: "honorH", ok: !!(r.honor[0] && r.honor[0].h >= 44) },
    { name: "marketH", ok: !!(r.market[0] && r.market[0].h >= 44) },
    { name: "altarH", ok: !!(r.altar[0] && r.altar[0].h >= 44) },
    { name: "srcHonor", ok: more.includes("v783：榮譽不足（尚有庫存）空態 CTA") },
    { name: "srcMarket", ok: more.includes("v783：特惠金幣不足（尚有庫存）空態 CTA") },
    { name: "srcAltar", ok: more.includes("v783：昇華條件未達空態 CTA") },
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
