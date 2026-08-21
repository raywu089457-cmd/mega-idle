/* v678 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-67-v678";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=678", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);

  const r = await page.evaluate(async () => {
    function wipe() {
      document.querySelectorAll(".modal").forEach((el) => { try { el.remove(); } catch (e) {} });
    }
    function btn(txt) {
      return [...document.querySelectorAll(".modal button")].find((b) => b.textContent.trim() === txt);
    }
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    if (!st.hunters.length) {
      try { st.hunters.push(MG.sys.hunters.create("sword", 1)); } catch (e) { /* */ }
    }
    const h0 = st.hunters[0];
    h0.equip = {};
    for (const s of MG.config.SLOTS) h0.equip[s] = null;
    h0.art = null;
    st.artifacts = st.artifacts || {};
    st.artifacts.owned = {};
    st.inventory.items = [];

    MG.ui.screens.show("hunters");
    await new Promise((r) => setTimeout(r, 150));
    const card = document.querySelector("[data-cid=\"" + h0.id + "\"]") || document.querySelector("[data-cid]");
    if (card) card.click();
    await new Promise((r) => setTimeout(r, 180));

    const tabGear = [...document.querySelectorAll(".modal .chip")].find((el) => (el.textContent || "").trim() === "裝備");
    if (tabGear) tabGear.click();
    await new Promise((r) => setTimeout(r, 100));

    const slot = [...document.querySelectorAll(".modal div")].find((d) => d.style.width === "48px" && d.style.height === "48px");
    if (slot) slot.click();
    await new Promise((r) => setTimeout(r, 100));
    const equipCta = btn("前往副本");
    const equipOk = !!(equipCta && equipCta.getBoundingClientRect().height >= 40);
    const equipH = equipCta ? Math.round(equipCta.getBoundingClientRect().height) : 0;
    wipe();
    await new Promise((r) => setTimeout(r, 40));

    if (card) card.click();
    await new Promise((r) => setTimeout(r, 180));
    const tabGear2 = [...document.querySelectorAll(".modal .chip")].find((el) => (el.textContent || "").trim() === "裝備");
    if (tabGear2) tabGear2.click();
    await new Promise((r) => setTimeout(r, 100));
    const artBtn = [...document.querySelectorAll(".modal button")].find((b) => b.textContent.trim() === "裝備" || b.textContent.trim() === "更換");
    if (artBtn) artBtn.click();
    await new Promise((r) => setTimeout(r, 100));
    const shopCta = btn("前往商城");
    const artOk = !!(shopCta && shopCta.getBoundingClientRect().height >= 40);
    const artH = shopCta ? Math.round(shopCta.getBoundingClientRect().height) : 0;
    wipe();

    const it = MG.sys.equipment.gen({ slot: "weapon", tier: 1, rarity: 1, wtype: "sword" });
    st.inventory.items = [it];
    const saved = st.hunters.slice();
    st.hunters = [];
    MG.ui.screens.show("equipment");
    await new Promise((r) => setTimeout(r, 150));
    const eqCell = document.querySelector(".eq-cell[data-uid]") ||
      [...document.querySelectorAll(".eq-cell")].find((el) => el.getAttribute("data-uid"));
    if (eqCell) eqCell.click();
    await new Promise((r) => setTimeout(r, 100));
    const detailBtn = [...document.querySelectorAll(".modal button")].find((b) => b.textContent.trim() === "查看詳情");
    if (detailBtn) detailBtn.click();
    await new Promise((r) => setTimeout(r, 120));
    const wearBtn = [...document.querySelectorAll(".modal button")].find((b) => b.textContent.includes("穿戴給英雄"));
    if (wearBtn) wearBtn.click();
    await new Promise((r) => setTimeout(r, 100));
    const heroCta = btn("前往英雄");
    const heroOk = !!(heroCta && heroCta.getBoundingClientRect().height >= 40);
    const heroH = heroCta ? Math.round(heroCta.getBoundingClientRect().height) : 0;
    st.hunters = saved;

    return { equipOk, artOk, heroOk, equipH, artH, heroH, hasCard: !!card, hasSlot: !!slot, hasArtBtn: !!artBtn, wearFound: !!wearBtn, hasEqCell: !!eqCell, hasDetail: !!detailBtn };
  });

  const hu = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-ui.png") });
  const liveN = [r.equipOk, r.artOk, r.heroOk].filter(Boolean).length;
  const out = {
    ok: !errs.length && liveN === 3
      && hu.includes("v678：選裝空態") && hu.includes("v678：神器空態") && eq.includes("v678：穿戴無英雄"),
    liveN, r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
