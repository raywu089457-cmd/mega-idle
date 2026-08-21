/* v730 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-119-v730";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=730", { waitUntil: "domcontentloaded" });
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

    // A: tower all clear
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.sys.tower.ensure();
    st.tower.cleared = {};
    for (let i = 1; i <= MG.sys.tower.LAYERS; i++) st.tower.cleared[i] = true;
    MG.ui.more.openTower();
    await new Promise((r) => setTimeout(r, 80));
    const towerBtns = measure("前往副本");

    // B: daily all claimed
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.sys.meta.ensureDaily();
    for (const d of st.quests.daily.list) d.done = true;
    MG.ui.more.openQuests();
    await new Promise((r) => setTimeout(r, 40));
    const dailyTab = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "每日");
    if (dailyTab) dailyTab.click();
    await new Promise((r) => setTimeout(r, 80));
    const dailyBtns = measure("前往副本");

    // C: welcome all claimed
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const w = MG.sys.welcome.ensure();
    for (const id of ["d1", "d2", "d3", "d4", "d5", "d6", "d7"]) w.claimed[id] = true;
    MG.ui.more.openWelcome();
    await new Promise((r) => setTimeout(r, 80));
    const welcomeBtns = measure("前往副本");
    const list = MG.sys.welcome.list();
    return {
      towerBtns,
      dailyBtns,
      welcomeBtns,
      welcomeN: list.filter((x) => x.claimed).length,
      welcomeTotal: list.length,
      dailyN: st.quests.daily.list.filter((d) => d.done).length,
      towerAll: MG.sys.tower.progress().all
    };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcTower", ok: more.includes("v730：元素試煉本週全通") },
    { name: "srcDaily", ok: more.includes("v730：每日任務全部已領") },
    { name: "srcWelcome", ok: more.includes("v730：七日豪禮全部已領") },
    { name: "ctaTower", ok: okH(r.towerBtns) },
    { name: "ctaDaily", ok: okH(r.dailyBtns) },
    { name: "ctaWelcome", ok: okH(r.welcomeBtns) },
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
