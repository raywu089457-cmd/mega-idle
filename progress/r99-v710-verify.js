/* v710 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-99-v710";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=710", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.equipment && MG.ui.hunters && MG.ui.more);
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

    // A: pickHunter — sword hero + bow
    st.hunters = [{
      id: "1", name: "測劍", cls: "sword", level: 5, rarity: 2, exp: 0, promoted: 0,
      locked: false, skills: {}, equip: {}, sprite: "h_sword", spentGold: 0
    }];
    let bow = MG.sys.equipment.gen({ tier: 1, slot: "weapon", rarity: 2 });
    bow.wtype = "bow";
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.ui.equipment.pickHunter(bow, null);
    await new Promise((r) => setTimeout(r, 80));
    const pickBtns = measure("前往英雄");

    // B: synth low shards
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies = st.currencies || {};
    st.currencies.shards = 5;
    if (st.synth) { st.synth.shards = 5; }
    // ensure synthPreview reads low
    MG.ui.hunters.openSynth();
    await new Promise((r) => setTimeout(r, 80));
    // force low if preview uses different field
    const synthBody = document.querySelector(".modal");
    const synthBtns = measure("前往英雄");

    // C: honor shop sold out
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const hs = MG.sys.honorshop.ensure();
    for (const it of MG.sys.honorshop.ITEMS) hs.redeemed[it.id] = it.stock;
    MG.ui.more.openHonorShop();
    await new Promise((r) => setTimeout(r, 80));
    const honorBtns = measure("前往競技場");

    return { pickBtns, synthBtns, honorBtns, shardsPreview: MG.sys.hunters.synthPreview ? MG.sys.hunters.synthPreview() : null };
  });

  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const hu = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcPick", ok: eq.includes("v710：有英雄但職業") },
    { name: "srcSynth", ok: hu.includes("v710：碎片不足空態") },
    { name: "srcHonor", ok: more.includes("v710：全品項售罄") },
    { name: "ctaPick", ok: okH(r.pickBtns) },
    { name: "ctaSynth", ok: okH(r.synthBtns) },
    { name: "ctaHonor", ok: okH(r.honorBtns) },
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
