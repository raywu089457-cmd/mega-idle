/* v694 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-83-v694";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=694", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.hunters);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    function measure(txt, titleSub) {
      return [...document.querySelectorAll("button")]
        .filter((b) => b.textContent.trim() === txt)
        .filter((b) => !titleSub || (b.getAttribute("title") || "").includes(titleSub))
        .map((b) => {
          const r = b.getBoundingClientRect();
          return { h: Math.round(r.height), w: Math.round(r.width), t: b.getAttribute("title") || "" };
        });
    }
    function wipe() {
      document.querySelectorAll(".modal, .overlay").forEach((el) => el.remove());
    }

    MG.ui.screens.show("hunters");
    await new Promise((r) => setTimeout(r, 120));

    // A: roster empty
    st.hunters = [];
    st.formation = [];
    st.formations = [[]];
    if (MG.ui.hunters.refresh) MG.ui.hunters.refresh();
    await new Promise((r) => setTimeout(r, 80));
    const allBtns = measure("前往招募", "開啟招募");
    wipe();

    // B: class filter empty — one archer, filter sword
    st.hunters = [{
      id: "1", name: "測弓", cls: "archer", level: 5, rarity: 2, exp: 0, promoted: 0,
      locked: false, skills: [], equip: {}, hp: 100, maxHp: 100, mp: 40, sprite: "h_archer",
      skillLv: {}, spentGold: 0
    }];
    st.formation = [];
    st.formations = [[]];
    if (MG.ui.hunters.refresh) MG.ui.hunters.refresh();
    await new Promise((r) => setTimeout(r, 60));
    const swordChip = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "劍士");
    if (swordChip) swordChip.click();
    await new Promise((r) => setTimeout(r, 80));
    const classBtns = measure("前往招募", "開啟招募");
    wipe();

    // C: team pick — one hero already used
    st.hunters = [{
      id: "2", name: "測劍", cls: "sword", level: 8, rarity: 2, exp: 0, promoted: 0,
      locked: false, skills: [], equip: {}, hp: 150, maxHp: 150, mp: 40, sprite: "h_sword",
      skillLv: {}, spentGold: 0
    }];
    st.formations = [["2", null, null, null, null]];
    st.activeTeam = 0;
    st.formation = ["2"];
    MG.ui.hunters.openTeamEditor();
    await new Promise((r) => setTimeout(r, 80));
    const emptySlot = [...document.querySelectorAll(".modal [title]")].find((el) => (el.getAttribute("title") || "").includes("點擊選擇"));
    if (emptySlot) emptySlot.click();
    await new Promise((r) => setTimeout(r, 80));
    const pickBtns = measure("前往招募", "關閉並前往招募");
    wipe();

    return { allBtns, classBtns, pickBtns };
  });

  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const out = {
    ok: !errs.length
      && hun.includes("v694：名冊／職業篩空態一鍵前往招募")
      && hun.includes("v694：編隊無可用英雄 CTA")
      && hun.includes("v694FIX：移除已廢棄的 body.appendChild(grid)")
      && okH(r.allBtns)
      && okH(r.classBtns)
      && okH(r.pickBtns),
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
