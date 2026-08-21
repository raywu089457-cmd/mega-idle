/* v686 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-75-v686";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=686", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.kingdom.level = 1;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    function measureBtn(txt) {
      const btns = [...document.querySelectorAll("button")].filter((b) => b.textContent.trim() === txt);
      return btns.map((b) => {
        const r = b.getBoundingClientRect();
        return { h: Math.round(r.height), w: Math.round(r.width), text: txt };
      });
    }

    // A maze
    MG.ui.more.openMaze();
    await new Promise((r) => setTimeout(r, 50));
    const mazeBtns = measureBtn("前往建築");
    document.querySelectorAll(".modal .m-close, .modal button").forEach((b) => {
      if (/關閉|✕|×/.test(b.textContent) || b.classList.contains("m-close")) b.click();
    });
    // close any modal
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    document.querySelectorAll(".overlay").forEach((el) => el.remove());

    // B dungeon locked rows
    MG.ui.more.openDungeon();
    await new Promise((r) => setTimeout(r, 80));
    const dungBtns = measureBtn("前往副本");
    document.querySelectorAll(".modal, .overlay").forEach((el) => el.remove());

    // C gem empty — via forge
    MG.ui.more.openForge();
    await new Promise((r) => setTimeout(r, 80));
    const gemTab = [...document.querySelectorAll(".chip")].find((b) => (b.textContent || "").trim() === "寶石製作");
    if (gemTab) gemTab.click();
    await new Promise((r) => setTimeout(r, 80));
    const gemBtns = measureBtn("前往副本");
    document.querySelectorAll(".modal, .overlay").forEach((el) => el.remove());

    return { mazeBtns, dungBtns, gemBtns, gemTab: !!gemTab };
  });

  const k = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => arr.some((b) => b.h >= 44);
  const out = {
    ok: !errs.length
      && k.includes("v686：未解鎖 CTA")
      && k.includes("v686：寶石空態 CTA")
      && k.includes('}, "前往副本")));')
      && okH(r.mazeBtns)
      && okH(r.dungBtns)
      && okH(r.gemBtns),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
