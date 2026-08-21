/* v767 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-156-v767";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=767", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more);
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

    // A: forge bag full
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings = st.buildings || {};
    st.buildings.forge = Math.max(1, st.buildings.forge || 0);
    st.buildings.warehouse = Math.max(1, st.buildings.warehouse || 0);
    const cap = MG.sys.equipment.inventoryCap();
    st.inventory = st.inventory || { items: [] };
    st.inventory.items = [];
    for (let i = 0; i < cap; i++) {
      st.inventory.items.push(MG.sys.equipment.gen({ tier: 1, rarity: 1, slot: "helmet" }));
    }
    MG.ui.more.openForge();
    await new Promise((r) => setTimeout(r, 100));
    const forgeBtns = measure("前往裝備", "關閉並前往裝備");

    // B: shop one-time all owned
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.quests = st.quests || {};
    st.quests.shopOneTime = st.quests.shopOneTime || {};
    MG.data.quests.SHOP.filter((s) => s.oneTime && s.price && s.price.gems !== undefined).forEach((s) => {
      st.quests.shopOneTime[s.id] = true;
    });
    MG.ui.more.openShop();
    await new Promise((r) => setTimeout(r, 100));
    const shopBtns = measure("前往副本", "關閉並前往副本");

    // C: gems present but none fusable
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.inventory.items = [
      { defId: "atk_1", tier: 1, qty: 2 },
      { defId: "def_1", tier: 1, qty: 1 }
    ];
    MG.ui.more.openForge();
    await new Promise((r) => setTimeout(r, 80));
    const gemTab = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "寶石製作");
    if (gemTab) gemTab.click();
    await new Promise((r) => setTimeout(r, 100));
    const gemBtns = measure("前往副本", "關閉並前往副本");

    return { forgeBtns, shopBtns, gemBtns, cap };
  });

  const src = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcForge", ok: src.includes("v767：背包已滿") },
    { name: "srcShop", ok: src.includes("v767：商城限購神器全部已擁有") },
    { name: "srcGem", ok: src.includes("v767：持有寶石但皆不足 3 顆") },
    { name: "ctaForge", ok: okH(r.forgeBtns) },
    { name: "ctaShop", ok: okH(r.shopBtns) },
    { name: "ctaGem", ok: okH(r.gemBtns) },
    { name: "exportOpeners", ok: src.includes("openForge") && src.includes("openShop") },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, r, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, fail, errs, r }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
