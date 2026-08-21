/* v674 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-63-v674";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=674", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);

  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    // empty inventory
    st.inventory.items = [];
    MG.ui.screens.show("equipment");
    await new Promise((r) => setTimeout(r, 80));
    const bagBtn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "前往副本");
    const bagOk = !!(bagBtn && bagBtn.offsetHeight >= 40);

    // gem tab empty
    const gemTab = [...document.querySelectorAll(".chip,button,.tab")].find((el) => /寶石/.test(el.textContent || ""));
    if (gemTab) gemTab.click();
    await new Promise((r) => setTimeout(r, 60));
    const gemBtns = [...document.querySelectorAll("button")].filter((b) => b.textContent.trim() === "前往副本");
    const gemOk = gemBtns.length >= 1;

    // formation empty — clear formation but keep hunters
    if (!st.hunters.length) {
      try {
        const h = MG.sys.hunters.create("sword", 1);
        st.hunters.push(h);
      } catch (e) { /* ignore */ }
    }
    st.formation = [null, null, null, null, null];
    if (st.formations) for (let i = 0; i < 5; i++) st.formations[i] = [null, null, null, null, null];
    MG.ui.screens.show("hunters");
    await new Promise((r) => setTimeout(r, 80));
    const formChip = [...document.querySelectorAll(".chip")].find((c) => /出戰|編隊/.test(c.textContent || ""));
    if (formChip) formChip.click();
    await new Promise((r) => setTimeout(r, 80));
    const autoBtn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "自動編隊");
    // may exist in header too — empty state should have one in .empty
    const emptyAuto = document.querySelector(".empty button");
    const formOk = !!(emptyAuto && emptyAuto.textContent.includes("自動編隊")) || !!(autoBtn);

    return {
      bagOk, gemOk, formOk,
      bagH: bagBtn ? bagBtn.offsetHeight : 0,
      hasEmptyAuto: !!(emptyAuto && /自動編隊/.test(emptyAuto.textContent || ""))
    };
  });

  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const hu = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-ui.png") });
  const out = {
    ok: !errs.length && r.bagOk && r.gemOk && (r.hasEmptyAuto || r.formOk)
      && eq.includes("v674：空態 CTA") && eq.includes("v674：寶石空態") && hu.includes("v674：編隊空態"),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
