/* v666 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-55-v666";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=666", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    MG.ui.screens.show("kingdom");
    await new Promise((r) => setTimeout(r, 80));
    const btns = [...document.querySelectorAll("button")].map((b) => b.textContent.trim());
    const claimBtn = btns.find((t) => t.startsWith("一鍵領取全部"));
    const routineBtn = btns.find((t) => t.startsWith("一鍵例行"));
    const claimHasCount = /一鍵領取全部( · \d+)?/.test(claimBtn || "");
    const routineHasCount = /一鍵例行( · \d+)?/.test(routineBtn || "");
    // force claimable: claimin day unset if possible
    let claimLabeled = !!(claimBtn && claimBtn.includes("·"));
    let routineLabeled = !!(routineBtn && routineBtn.includes("·"));
    // seed checkin claimable
    try {
      const st = MG.game.state;
      MG.sys.meta.ensureCheckin();
      const day = MG.sys.meta.checkinDay();
      if (st.checkin && st.checkin.days) delete st.checkin.days[day];
      MG.ui.screens.show("kingdom");
      await new Promise((r) => setTimeout(r, 60));
      const claim2 = [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).find((t) => t.startsWith("一鍵領取全部"));
      claimLabeled = !!(claim2 && /·\s*\d+/.test(claim2));
    } catch (e) { /* ignore */ }
    // tab keys
    MG.ui.screens.show("kingdom");
    await new Promise((r) => setTimeout(r, 20));
    const fire = (k) => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
    };
    fire("2");
    await new Promise((r) => setTimeout(r, 40));
    const after2 = MG.ui.screens.current && document.querySelector(".tab.on")?.getAttribute("data-tab");
    fire("3");
    await new Promise((r) => setTimeout(r, 40));
    const after3 = document.querySelector(".tab.on")?.getAttribute("data-tab");
    // modal blocks
    const m = MG.ui.dom.modal("測", MG.ui.dom.h("div", null, "x"));
    await new Promise((r) => setTimeout(r, 20));
    fire("1");
    await new Promise((r) => setTimeout(r, 40));
    const blocked = document.querySelector(".tab.on")?.getAttribute("data-tab") === after3;
    m.close();
    // more.js leftover 30
    const inline30 = [...document.querySelectorAll("button")].some((b) => (b.getAttribute("style") || "").includes("min-height: 30") || (b.getAttribute("style") || "").includes("minHeight: 30"));
    return {
      claimBtn, routineBtn, claimHasCount, routineHasCount, claimLabeled, routineLabeled,
      after2, after3, blocked, inline30,
      tabBound: !!document._mgTabKeysBound
    };
  });
  await page.screenshot({ path: path.join(OUT, TAG + "-kingdom.png"), fullPage: false });
  const out = { ok: !errs.length && r.after2 === "hunt" && r.after3 === "hunters" && r.blocked && r.tabBound && r.claimHasCount && r.routineHasCount && r.claimLabeled, r, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
