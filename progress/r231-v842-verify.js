/* v842 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-231-v842";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=842", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.hunters && MG.ui.equipment && MG.ui.more);
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
          return { h: Math.round(r.height), w: Math.round(r.width) };
        });
    }

    // A: promote level insufficient
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h1 = MG.sys.hunters.create("sword", 1);
    h1.level = 1;
    h1.promoted = 0;
    st.hunters = [h1];
    st.formation = [h1.id];
    st.currencies.gold = 999999;
    st.mats = st.mats || {};
    Object.keys(MG.config.MATS || {}).forEach((k) => { st.mats[k] = 9999; });
    MG.ui.hunters.openDetail(h1.id);
    await new Promise((r) => setTimeout(r, 120));
    const promoBtns = measure("前往副本", "關閉並前往副本練級");

    // B: worn gear unequip
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h2 = MG.sys.hunters.create("sword", 1);
    h2.level = 20;
    st.hunters = [h2];
    st.formation = [h2.id];
    const it = MG.sys.equipment.gen({ slot: "helmet", tier: 1, rarity: 2 });
    MG.sys.equipment.addToInventory(it);
    h2.equip = h2.equip || {};
    h2.equip.helmet = it.uid;
    MG.ui.equipment.openItem(it);
    await new Promise((r) => setTimeout(r, 120));
    const wearBtns = measure("卸下裝備", "卸下裝備並刷新詳情");

    // C: forge not built
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings = st.buildings || {};
    st.buildings.forge = 0;
    MG.ui.more.openForge();
    await new Promise((r) => setTimeout(r, 120));
    const forgeBtns = measure("前往王國", "關閉並前往王國鐵匠");

    return { promo: promoBtns, wear: wearBtns, forge: forgeBtns };
  });

  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const asserts = [
    { name: "promoH", ok: !!(r.promo[0] && r.promo[0].h >= 44) },
    { name: "wearH", ok: !!(r.wear[0] && r.wear[0].h >= 44) },
    { name: "forgeH", ok: !!(r.forge[0] && r.forge[0].h >= 44) },
    { name: "srcPromo", ok: hun.includes("v842：突破等級不足空態 CTA") },
    { name: "srcWear", ok: eq.includes("v842：裝備穿戴中空態 CTA") },
    { name: "srcForge", ok: more.includes("v842：鐵匠鋪未建空態 CTA") },
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
