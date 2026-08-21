/* v735 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-124-v735";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=735", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more);
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

    // A: weekly all claimed
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.sys.meta.ensureWeekly();
    for (const w of st.quests.weekly.list) w.done = true;
    MG.ui.more.openQuests();
    await new Promise((r) => setTimeout(r, 40));
    const wkTab = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "每週");
    if (wkTab) wkTab.click();
    await new Promise((r) => setTimeout(r, 80));
    const weeklyBtns = measure("前往副本");

    // B: achievements all claimed
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.achievements = st.achievements || {};
    for (const a of MG.data.quests.ACH) st.achievements[a.id] = true;
    MG.ui.more.openAch();
    await new Promise((r) => setTimeout(r, 80));
    const achBtns = measure("前往副本");

    // C: expedition all slots full
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.kingdom = st.kingdom || {};
    st.kingdom.level = Math.max(16, st.kingdom.level || 1);
    const E = MG.sys.expedition;
    E.ensure();
    const n = E.slots();
    const ex = st.exped;
    ex.slots = [];
    for (let i = 0; i < n; i++) {
      ex.slots[i] = {
        ids: ["dummy" + i], taskIdx: 0, name: "清掃營地", hours: 1,
        qualMul: 1, book: 0, need: 100, until: Date.now() + 3600000,
        total: 1000, eff: 1, settled: false
      };
    }
    MG.ui.more.openExpedition();
    await new Promise((r) => setTimeout(r, 100));
    const expedBtns = measure("前往副本");
    const prog = E.progress();
    return {
      weeklyBtns, achBtns, expedBtns,
      expedFilled: prog.list.filter(Boolean).length,
      expedSlots: prog.list.length,
      achN: Object.keys(st.achievements).length,
      achTotal: MG.data.quests.ACH.length
    };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcWeekly", ok: more.includes("v735：每週任務全部已領") },
    { name: "srcAch", ok: more.includes("v735：成就全部已領") },
    { name: "srcExped", ok: more.includes("v735：遠征欄位全滿") },
    { name: "ctaWeekly", ok: okH(r.weeklyBtns) },
    { name: "ctaAch", ok: okH(r.achBtns) },
    { name: "ctaExped", ok: okH(r.expedBtns) },
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
