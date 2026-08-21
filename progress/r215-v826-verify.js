/* v826 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-215-v826";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=826", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.hunters);
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
    function clickChip(label) {
      const chip = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === label);
      if (chip) chip.click();
    }

    // A: awaken resource missing
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h1 = MG.sys.hunters.create("sword", 1);
    h1.art = "dragon_scale";
    st.hunters = [h1];
    st.formation = [h1.id];
    st.artifacts = { owned: { dragon_scale: true }, levels: { dragon_scale: 10 }, awake: { dragon_scale: 0 } };
    st.currencies.gold = 100;
    st.mats = st.mats || {};
    st.mats.void = 0;
    st.mats.myth = 0;
    MG.ui.hunters.openDetail(h1.id);
    await new Promise((r) => setTimeout(r, 80));
    clickChip("裝備");
    await new Promise((r) => setTimeout(r, 120));
    const awakenMiss = measure("前往副本", "關閉並前往副本覺醒素材");

    // B: awaken max
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h2 = MG.sys.hunters.create("sword", 1);
    h2.art = "dragon_scale";
    st.hunters = [h2];
    st.formation = [h2.id];
    st.artifacts = { owned: { dragon_scale: true }, levels: { dragon_scale: 10 }, awake: { dragon_scale: 3 } };
    st.currencies.gold = 999999;
    MG.ui.hunters.openDetail(h2.id);
    await new Promise((r) => setTimeout(r, 80));
    clickChip("裝備");
    await new Promise((r) => setTimeout(r, 120));
    const awakenMax = measure("前往副本", "關閉並前往副本（神器滿覺）");

    // C: already base — can't reset
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h3 = MG.sys.hunters.create("sword", 1);
    h3.level = 1;
    h3.promoted = 0;
    h3.exp = 0;
    st.hunters = [h3];
    st.formation = [h3.id];
    st.currencies.gold = 999999;
    MG.ui.hunters.openDetail(h3.id);
    await new Promise((r) => setTimeout(r, 120));
    const resetBase = measure("前往副本", "關閉並前往副本成長");

    return { awakenMiss, awakenMax, resetBase };
  });

  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const asserts = [
    { name: "awakenMissH", ok: !!(r.awakenMiss[0] && r.awakenMiss[0].h >= 44) },
    { name: "awakenMaxH", ok: !!(r.awakenMax[0] && r.awakenMax[0].h >= 44) },
    { name: "resetBaseH", ok: !!(r.resetBase[0] && r.resetBase[0].h >= 44) },
    { name: "srcAwakenMiss", ok: hun.includes("v826：神器覺醒資源不足空態 CTA") },
    { name: "srcAwakenMax", ok: hun.includes("v826：神器已覺醒滿階空態 CTA") },
    { name: "srcReset", ok: hun.includes("v826：英雄已是初始狀態（無法重塑）空態 CTA") },
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
