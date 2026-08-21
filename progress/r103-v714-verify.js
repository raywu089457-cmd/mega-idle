/* v714 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-103-v714";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=714", { waitUntil: "domcontentloaded" });
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

    // A: events shop sold out
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.sys.events.ensure();
    for (const s of MG.sys.events.SHOP) st.events.redeemed[s.id] = s.stock;
    MG.ui.more.openEvents();
    await new Promise((r) => setTimeout(r, 80));
    const eventBtns = measure("前往副本");

    // B: royal shop sold out
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.kingdom = st.kingdom || {};
    st.kingdom.level = Math.max(12, st.kingdom.level || 1);
    MG.sys.royal.ensure();
    st.royal.shopRedeemed = st.royal.shopRedeemed || {};
    for (const it of MG.sys.royal.SHOP) st.royal.shopRedeemed[it.id] = it.stock;
    MG.ui.more.openRoyal();
    await new Promise((r) => setTimeout(r, 80));
    const royalBtns = measure("繼續挑戰");

    // C: market weekly sold out
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const g = MG.sys.market.goldWeeklyEnsure ? MG.sys.market.goldWeeklyEnsure() : (st.goldWeek = st.goldWeek || { week: "", redeemed: {} });
    // ensure week key via list
    const wl = MG.sys.market.goldWeeklyList();
    for (const d of wl) st.goldWeek.redeemed[d.id] = d.stock;
    MG.ui.more.openMarket();
    await new Promise((r) => setTimeout(r, 80));
    const marketBtns = measure("前往副本");

    return { eventBtns, royalBtns, marketBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcEvents", ok: more.includes("v714：活動商店全售罄") },
    { name: "srcRoyal", ok: more.includes("v714：王者商店全售罄") },
    { name: "srcWeekly", ok: more.includes("v714：市場週限全售罄") },
    { name: "ctaEvents", ok: okH(r.eventBtns) },
    { name: "ctaRoyal", ok: okH(r.royalBtns) },
    { name: "ctaWeekly", ok: okH(r.marketBtns) },
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
