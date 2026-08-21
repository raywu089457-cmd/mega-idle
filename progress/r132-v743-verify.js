/* v743 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-132-v743";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=743", { waitUntil: "domcontentloaded" });
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

    // A: events milestones all claimed
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const EV = MG.sys.events;
    EV.ensure();
    st.events.milestones = {};
    for (const ms of EV.MILESTONES) st.events.milestones[ms.pts] = true;
    MG.ui.more.openEvents();
    await new Promise((r) => setTimeout(r, 80));
    const eventBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    // B: honor all maxed (traditions not)
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.honorLvls = { dmg: 5, gold: 5, exp: 5 };
    st.traditions = {};
    for (const t of Object.keys(MG.sys.meta.TRADITIONS || {})) st.traditions[t] = 0;
    MG.ui.more.openAltar();
    await new Promise((r) => setTimeout(r, 80));
    const honorBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    // C: traditions all maxed (honor not)
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.honorLvls = { dmg: 0, gold: 0, exp: 0 };
    st.traditions = {};
    for (const t of Object.keys(MG.sys.meta.TRADITIONS || {})) st.traditions[t] = 10;
    MG.ui.more.openAltar();
    await new Promise((r) => setTimeout(r, 80));
    const tradBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    return { eventBtns, honorBtns, tradBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcEvents", ok: more.includes("v743：活動里程碑全部已領") },
    { name: "srcHonor", ok: more.includes("v743：榮譽印記全部滿級") },
    { name: "srcTrad", ok: more.includes("v743：昇華傳統全部滿級") },
    { name: "ctaEvents", ok: okH(r.eventBtns) },
    { name: "ctaHonor", ok: okH(r.honorBtns) },
    { name: "ctaTrad", ok: okH(r.tradBtns) },
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
