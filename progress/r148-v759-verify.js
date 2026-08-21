/* v759 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-148-v759";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=759", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more && MG.ui.kingdom);
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

    // A: study max
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings = st.buildings || {};
    st.buildings.library = Math.max(1, st.buildings.library || 0);
    st.studyLvl = 10;
    MG.ui.kingdom.openDetail("library");
    await new Promise((r) => setTimeout(r, 80));
    const studyBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    // B: building max
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const bDef = MG.data.buildings.training || MG.sys.buildings.def("training");
    const maxLv = (bDef && bDef.max) || 40;
    st.buildings.training = maxLv;
    MG.ui.kingdom.openDetail("training");
    await new Promise((r) => setTimeout(r, 80));
    const bldBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    // C: maze all boons
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.kingdom.level = Math.max(st.kingdom.level || 1, 14);
    const MZ = MG.sys.maze;
    MZ.ensure();
    st.maze.finished = false;
    st.maze.node = 1;
    st.maze.boons = {};
    for (const k of MZ.BOON_KEYS) st.maze.boons[k] = 3;
    MG.ui.more.openMaze();
    await new Promise((r) => setTimeout(r, 100));
    const mazeBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    return { studyBtns, bldBtns, mazeBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const kd = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcStudy", ok: kd.includes("v759：技能研讀滿級") },
    { name: "srcBld", ok: kd.includes("v759：建築滿級空態 CTA") },
    { name: "srcMaze", ok: more.includes("v759：迷宮增益全部滿層") },
    { name: "ctaStudy", ok: okH(r.studyBtns) },
    { name: "ctaBld", ok: okH(r.bldBtns) },
    { name: "ctaMaze", ok: okH(r.mazeBtns) },
    { name: "exportOpenDetail", ok: kd.includes("openDetail") },
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
