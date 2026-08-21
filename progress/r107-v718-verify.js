/* v718 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-107-v718";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=718", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    function measure(txt) {
      return [...document.querySelectorAll("button")]
        .filter((b) => b.textContent.trim() === txt)
        .map((b) => {
          const r = b.getBoundingClientRect();
          return { h: Math.round(r.height), w: Math.round(r.width), t: b.getAttribute("title") || "" };
        });
    }

    // A: abyss shop sold out
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.stats = st.stats || {};
    st.stats.maxRegionReached = Math.max(st.stats.maxRegionReached || 0, MG.sys.abyss.UNLOCK_REGION || 5);
    st.abyss = st.abyss || {};
    st.abyss.best = Math.max(st.abyss.best || 0, 800); // unlock depth-gated items
    MG.sys.abyss.shopEnsure && MG.sys.abyss.shopEnsure();
    const shop = MG.sys.abyss.shopList();
    st.abyssShop = st.abyssShop || { week: "", redeemed: {} };
    for (const it of shop) st.abyssShop.redeemed[it.id] = it.stock;
    // ensure week key sticky
    const wk = MG.sys.abyss.shopWeekKey ? MG.sys.abyss.shopWeekKey() : null;
    if (wk) st.abyssShop.week = wk;
    MG.ui.more.openAbyss();
    await new Promise((r) => setTimeout(r, 100));
    const abyssBtns = measure("繼續挑戰");

    // B: daily deals sold out
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.sys.market.ensure && MG.sys.market.ensure();
    const deals = MG.sys.market.deals();
    st.market = st.market || { bought: {} };
    for (const d of deals) st.market.bought[d.id] = d.stock;
    MG.ui.more.openMarket();
    await new Promise((r) => setTimeout(r, 100));
    const dealBtns = measure("前往副本");

    // C: dungeon exhausted
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.sys.dungeon.ensure && MG.sys.dungeon.ensure();
    st.dungeon = st.dungeon || { uses: {} };
    for (const def of MG.sys.dungeon.DEFS) st.dungeon.uses[def.id] = MG.sys.dungeon.ENTRIES;
    MG.ui.more.openDungeon();
    await new Promise((r) => setTimeout(r, 100));
    const dungBtns = measure("前往副本");

    return { abyssBtns, dealBtns, dungBtns, shopN: shop.length, dealsN: deals.length };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcAbyss", ok: more.includes("v718：深淵商店可兌項全兌完") },
    { name: "srcDeals", ok: more.includes("v718：每日特惠全售罄") },
    { name: "srcDung", ok: more.includes("v718：秘境今日全用完") },
    { name: "ctaAbyss", ok: okH(r.abyssBtns) },
    { name: "ctaDeals", ok: okH(r.dealBtns) },
    { name: "ctaDung", ok: okH(r.dungBtns) },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, r, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, fail, errs }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
