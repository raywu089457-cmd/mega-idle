/* v763 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-152-v763";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=763", { waitUntil: "domcontentloaded" });
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
          return { h: Math.round(r.height), w: Math.round(r.width), t: b.getAttribute("title") || "" };
        });
    }

    const classIds = Object.keys(MG.data.hunters.classes);
    const mk = (i) => MG.sys.hunters.create(classIds[i % classIds.length], 1);

    // A: resonance full
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.kingdom = st.kingdom || {};
    st.kingdom.level = Math.max(st.kingdom.level || 1, 10);
    const slots = MG.sys.hunters.resonanceSlots();
    while (st.hunters.length < slots + 2) {
      const h = mk(st.hunters.length);
      if (h) st.hunters.push(h);
      else break;
    }
    st.resonance = { slots: st.hunters.slice(0, slots).map((h) => h.id) };
    MG.ui.hunters.openResonance();
    await new Promise((r) => setTimeout(r, 80));
    const resoBtns = measure("前往副本", "關閉並前往副本");

    // B: roster full
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const cap = MG.sys.buildings.effects().rosterCap;
    while (st.hunters.length < cap) {
      const h = mk(st.hunters.length);
      if (h) st.hunters.push(h);
      else break;
    }
    MG.ui.hunters.openRecruit();
    await new Promise((r) => setTimeout(r, 80));
    const recruitBtns = measure("前往英雄", "關閉並前往英雄");

    // C: synth weekly exhausted
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.heroShards = 100;
    st.heroSynth = st.heroSynth || {};
    st.heroSynth.week = MG.sys.meta.weekKey();
    st.heroSynth.n4 = MG.sys.hunters.SYNTH_DEFS[4].weekly;
    st.heroSynth.n5 = MG.sys.hunters.SYNTH_DEFS[5].weekly;
    MG.ui.hunters.openSynth();
    await new Promise((r) => setTimeout(r, 80));
    const synthBtns = measure("前往副本", "關閉並前往副本");

    return { resoBtns, recruitBtns, synthBtns, cap, slots, nH: st.hunters.length };
  });

  const src = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcReso", ok: src.includes("v763：共鳴槽已滿") },
    { name: "srcRecruit", ok: src.includes("v763：名冊已滿") },
    { name: "srcSynth", ok: src.includes("v763：碎片合成雙檔週額用盡") },
    { name: "ctaReso", ok: okH(r.resoBtns) },
    { name: "ctaRecruit", ok: okH(r.recruitBtns) },
    { name: "ctaSynth", ok: okH(r.synthBtns) },
    { name: "exportOpeners", ok: src.includes("openResonance") && src.includes("openRecruit") && src.includes("openSynth") },
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
