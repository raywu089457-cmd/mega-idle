/* v779 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-168-v779";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=779", { waitUntil: "domcontentloaded" });
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

    // A: gold recruit on CD (enough gold)
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings = st.buildings || {};
    st.buildings.guild = Math.max(1, st.buildings.guild || 0);
    st.currencies.gold = 999999;
    MG.ui.hunters.openRecruit();
    await new Promise((r) => setTimeout(r, 60));
    const goldTab = [...document.querySelectorAll("button.chip, .chip, button")].find((c) => c.textContent.trim() === "金幣招募");
    if (goldTab) goldTab.click();
    await new Promise((r) => setTimeout(r, 40));
    const recruitBtn = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").includes("招募（") && !(b.disabled));
    if (recruitBtn) recruitBtn.click();
    await new Promise((r) => setTimeout(r, 80));
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.ui.hunters.openRecruit();
    await new Promise((r) => setTimeout(r, 80));
    const g2 = [...document.querySelectorAll("button.chip, .chip, button")].find((c) => c.textContent.trim() === "金幣招募");
    if (g2) g2.click();
    await new Promise((r) => setTimeout(r, 80));
    const cdBtns = measure("前往任務", "關閉並前往任務");

    // B: forge gear short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    st.mats = st.mats || {};
    Object.keys(st.mats).forEach((k) => { st.mats[k] = 0; });
    st.inventory = st.inventory || { items: [] };
    st.inventory.items = [];
    st.stats = st.stats || {};
    st.stats.maxTierReached = Math.max(1, st.stats.maxTierReached || 1);
    MG.ui.more.openForge();
    await new Promise((r) => setTimeout(r, 100));
    const forgeBtns = measure("前往副本", "關閉並前往副本");

    // C: shop gems short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gems = 0;
    MG.ui.more.openShop();
    await new Promise((r) => setTimeout(r, 80));
    const shopBtns = measure("前往簽到", "關閉並前往簽到");

    return { cd: cdBtns, forge: forgeBtns, shop: shopBtns };
  });

  const hunt = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const asserts = [
    { name: "cdH", ok: !!(r.cd[0] && r.cd[0].h >= 44) },
    { name: "forgeH", ok: !!(r.forge[0] && r.forge[0].h >= 44) },
    { name: "shopH", ok: !!(r.shop[0] && r.shop[0].h >= 44) },
    { name: "srcCd", ok: hunt.includes("v779：金幣招募冷卻中空態 CTA") },
    { name: "srcForge", ok: more.includes("v779：裝備打造缺金／缺料空態 CTA") },
    { name: "srcShop", ok: more.includes("v779：商城鑽石不足（連課金裝備都買不起）空態 CTA") },
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
