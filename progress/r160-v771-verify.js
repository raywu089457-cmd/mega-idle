/* v771 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-160-v771";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=771", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more && MG.ui.hunters);
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

    // A: forge items — clear mats/gold so none craftable
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings = st.buildings || {};
    st.buildings.forge = Math.max(1, st.buildings.forge || 0);
    st.currencies.gold = 0;
    st.mats = {};
    MG.ui.more.openForge();
    await new Promise((r) => setTimeout(r, 80));
    const itemTab = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "道具製作");
    if (itemTab) itemTab.click();
    await new Promise((r) => setTimeout(r, 80));
    const forgeBtns = measure("前往副本", "關閉並前往副本");

    // B: recruit tickets = 0
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.ticket = 0;
    st.buildings.guild = Math.max(1, st.buildings.guild || 0);
    MG.ui.hunters.openRecruit();
    await new Promise((r) => setTimeout(r, 80));
    const ticketTab = [...document.querySelectorAll("button.chip, .chip")].find((c) => c.textContent.trim() === "招募券");
    if (ticketTab) ticketTab.click();
    await new Promise((r) => setTimeout(r, 80));
    const ticketBtns = measure("前往任務", "關閉並前往任務");

    // C: library study — books short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings.library = Math.max(1, st.buildings.library || 0);
    st.studyLvl = 0;
    st.currencies.book = 0;
    // openDetail via kingdom API if present
    if (MG.ui.kingdom && MG.ui.kingdom.openDetail) {
      MG.ui.kingdom.openDetail("library");
    } else {
      // fallback: click library card
      MG.ui.screens.show("buildings");
      await new Promise((r) => setTimeout(r, 60));
      const card = [...document.querySelectorAll(".row")].find((el) => (el.getAttribute("title") || "").includes("圖書館") || el.textContent.includes("圖書館"));
      if (card) card.click();
    }
    await new Promise((r) => setTimeout(r, 100));
    const bookBtns = measure("前往副本", "關閉並前往副本");

    return {
      forge: forgeBtns,
      ticket: ticketBtns,
      book: bookBtns,
      studyCost: MG.sys.meta.studyCost()
    };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const hunt = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const king = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  const asserts = [
    { name: "forgeH", ok: (r.forge[0] && r.forge[0].h >= 44) },
    { name: "ticketH", ok: (r.ticket[0] && r.ticket[0].h >= 44) },
    { name: "bookH", ok: (r.book[0] && r.book[0].h >= 44) },
    { name: "srcForge", ok: more.includes("v771：道具全不可製空態 CTA") },
    { name: "srcTicket", ok: hunt.includes("v771：招募券不足空態 CTA") },
    { name: "srcBook", ok: king.includes("v771：技能書不足空態 CTA") },
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
