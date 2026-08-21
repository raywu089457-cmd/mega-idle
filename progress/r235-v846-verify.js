/* v846 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-235-v846";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=846", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.hunters && MG.ui.more);
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
          return { h: Math.round(r.height), w: Math.round(r.width) };
        });
    }

    // A: alchemy not built on forge item tab
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings = st.buildings || {};
    st.buildings.alchemy = 0;
    st.buildings.forge = Math.max(1, st.buildings.forge || 0);
    MG.ui.more.openForge();
    await new Promise((r) => setTimeout(r, 80));
    const itemTab = [...document.querySelectorAll(".chip, button, .tab")].find((b) => /道具製作/.test(b.textContent || ""));
    if (itemTab) itemTab.click();
    await new Promise((r) => setTimeout(r, 120));
    const alchemyBtns = measure("前往王國", "關閉並前往王國煉金坊");

    // B: market not built
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings.market = 0;
    MG.ui.more.openMarket();
    await new Promise((r) => setTimeout(r, 120));
    const marketBtns = measure("前往王國", "關閉並前往王國市場");

    // C: resonance locked
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.kingdom = st.kingdom || {};
    st.kingdom.level = 5;
    const h1 = MG.sys.hunters.create("sword", 1);
    st.hunters = [h1];
    st.formation = [h1.id];
    MG.ui.screens.show("hunters");
    await new Promise((r) => setTimeout(r, 150));
    const resBtns = measure("前往副本", "前往副本推進王國等級");

    return { alchemy: alchemyBtns, market: marketBtns, res: resBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const asserts = [
    { name: "alchemyH", ok: !!(r.alchemy[0] && r.alchemy[0].h >= 44) },
    { name: "marketH", ok: !!(r.market[0] && r.market[0].h >= 44) },
    { name: "resH", ok: !!(r.res[0] && r.res[0].h >= 44) },
    { name: "srcAlchemy", ok: more.includes("v846：煉金坊未建空態 CTA") },
    { name: "srcMarket", ok: more.includes("v846：市場未建空態 CTA") },
    { name: "srcRes", ok: hun.includes("v846：共鳴祭壇未解鎖空態 CTA") },
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
