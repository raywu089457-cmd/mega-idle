/* v775 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-164-v775";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=775", { waitUntil: "domcontentloaded" });
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

    // A: myth gems short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gems = 0;
    st.buildings = st.buildings || {};
    st.buildings.guild = Math.max(1, st.buildings.guild || 0);
    MG.ui.hunters.openRecruit();
    await new Promise((r) => setTimeout(r, 80));
    const gemTab = [...document.querySelectorAll("button.chip, .chip, button")].find((c) => c.textContent.trim() === "神話招募");
    if (gemTab) gemTab.click();
    await new Promise((r) => setTimeout(r, 80));
    const gemBtns = measure("前往簽到", "關閉並前往簽到");

    // B: gold recruit short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    MG.ui.hunters.openRecruit();
    await new Promise((r) => setTimeout(r, 80));
    const goldTab = [...document.querySelectorAll("button.chip, .chip, button")].find((c) => c.textContent.trim() === "金幣招募");
    if (goldTab) goldTab.click();
    await new Promise((r) => setTimeout(r, 80));
    const goldBtns = measure("前往副本", "關閉並前往副本");

    // C: rename no ticket
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.renameTicket = 0;
    MG.ui.more.openRenameDialog();
    await new Promise((r) => setTimeout(r, 80));
    const renameBtns = measure("前往商城", "關閉並開啟商城");

    return { gem: gemBtns, gold: goldBtns, rename: renameBtns };
  });

  const hunt = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const asserts = [
    { name: "gemH", ok: r.gem[0] && r.gem[0].h >= 44 },
    { name: "goldH", ok: r.gold[0] && r.gold[0].h >= 44 },
    { name: "renameH", ok: r.rename[0] && r.rename[0].h >= 44 },
    { name: "srcGem", ok: hunt.includes("v775：神話招募鑽石不足空態 CTA") },
    { name: "srcGold", ok: hunt.includes("v775：金幣招募金幣不足空態 CTA") },
    { name: "srcRename", ok: more.includes("v775：更名券不足空態 CTA") },
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
