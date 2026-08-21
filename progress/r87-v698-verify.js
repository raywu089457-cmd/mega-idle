/* v698 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-87-v698";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=698", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.hunters);
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

    MG.ui.screens.show("hunters");
    await new Promise((r) => setTimeout(r, 150));

    // A: search empty
    st.hunters = [{
      id: "1", name: "測劍", cls: "sword", level: 5, rarity: 2, exp: 0, promoted: 0,
      locked: false, skills: [], equip: {}, hp: 100, maxHp: 100, mp: 40, sprite: "h_sword",
      skillLv: {}, spentGold: 0
    }];
    if (MG.ui.hunters.refresh) MG.ui.hunters.refresh();
    await new Promise((r) => setTimeout(r, 60));
    const inp = document.querySelector('input[placeholder*="搜尋"]');
    if (inp) {
      inp.value = "zzzz_no_match";
      inp.dispatchEvent(new Event("input", { bubbles: true }));
    }
    await new Promise((r) => setTimeout(r, 350));
    const clearBtns = measure("清除搜尋");

    // B: grow empty — maxed hero
    if (inp) {
      inp.value = "";
      inp.dispatchEvent(new Event("input", { bubbles: true }));
    }
    await new Promise((r) => setTimeout(r, 300));
    st.hunters = [{
      id: "2", name: "滿級", cls: "sword", level: 200, rarity: 6, exp: 0, promoted: 5,
      locked: false, skills: [], equip: {}, hp: 9999, maxHp: 9999, mp: 100, sprite: "h_sword",
      skillLv: { a: 10 }, spentGold: 0, star: 6
    }];
    if (MG.ui.hunters.refresh) MG.ui.hunters.refresh();
    await new Promise((r) => setTimeout(r, 80));
    const growChip = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "可成長");
    if (growChip) growChip.click();
    await new Promise((r) => setTimeout(r, 80));
    const growBtns = measure("前往副本");

    // C: wanderers empty
    st.wanderers = [];
    if (MG.ui.hunters.showWanderers) MG.ui.hunters.showWanderers();
    await new Promise((r) => setTimeout(r, 100));
    const wanBtns = measure("前往王國").filter((b) => (b.t || "").includes("村莊"));

    return { clearBtns, growBtns, wanBtns };
  });

  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const out = {
    ok: !errs.length
      && hun.includes("v698：搜尋空→清除搜尋")
      && hun.includes("v698：流浪空態 CTA")
      && okH(r.clearBtns)
      && okH(r.growBtns)
      && okH(r.wanBtns),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
