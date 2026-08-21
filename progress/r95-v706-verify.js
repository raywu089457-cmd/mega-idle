/* v706 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-95-v706";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=706", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.equipment && MG.ui.more);
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

    // A: compareBox — only sword hero + bow weapon
    st.hunters = [{
      id: "1", name: "測劍", cls: "sword", level: 5, rarity: 2, exp: 0, promoted: 0,
      locked: false, skills: {}, equip: {}, sprite: "h_sword", spentGold: 0
    }];
    st.formation = ["1"];
    st.formations = [["1"], [], [], [], []];
    let bow = MG.sys.equipment.gen({ tier: 1, slot: "weapon", rarity: 2 });
    bow.wtype = "bow";
    st.inventory.items = [bow];
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    if (MG.ui.equipment.openItem) MG.ui.equipment.openItem(bow);
    await new Promise((r) => setTimeout(r, 100));
    const cmpBtns = measure("前往英雄");

    // B: shop empty
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const bak = MG.data.quests.SHOP;
    MG.data.quests.SHOP = [];
    MG.ui.more.openShop();
    await new Promise((r) => setTimeout(r, 80));
    const shopBtns = measure("前往副本");
    MG.data.quests.SHOP = bak;
    document.querySelectorAll(".modal").forEach((el) => el.remove());

    // C: tower no team
    st.formation = [null, null, null, null, null];
    st.formations = [[null, null, null, null, null], [], [], [], []];
    st.activeTeam = 0;
    MG.ui.more.openTower();
    await new Promise((r) => setTimeout(r, 100));
    const towerBtns = measure("前往英雄");

    return { cmpBtns, shopBtns, towerBtns };
  });

  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcCmp", ok: eq.includes("v706：職業限制空態") || eq.includes("v706：無可裝備英雄") },
    { name: "srcShop", ok: more.includes("v706：商城／市場無貨") },
    { name: "srcTower", ok: more.includes("v706：無編隊空態") },
    { name: "ctaCmp", ok: okH(r.cmpBtns) },
    { name: "ctaShop", ok: okH(r.shopBtns) },
    { name: "ctaTower", ok: okH(r.towerBtns) },
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
