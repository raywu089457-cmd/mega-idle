/* v726 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-115-v726";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=726", { waitUntil: "domcontentloaded" });
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

    // A: royal exhausted
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.kingdom = st.kingdom || {};
    st.kingdom.level = Math.max(st.kingdom.level || 1, 14);
    MG.sys.royal.ensure && MG.sys.royal.ensure();
    st.royal = st.royal || {};
    st.royal.fights = MG.sys.royal.DAILY_FIGHTS || 5;
    st.royal.teamIds = [0, 1, 2];
    MG.ui.more.openRoyal();
    await new Promise((r) => setTimeout(r, 80));
    const royalBtns = measure("前往副本");

    // B: maze finished
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.sys.maze.ensure && MG.sys.maze.ensure();
    st.maze = st.maze || {};
    st.maze.finished = true;
    st.maze.node = MG.sys.maze.TOTAL || 12;
    MG.ui.more.openMaze();
    await new Promise((r) => setTimeout(r, 80));
    const mazeBtns = measure("前往副本");

    // C: checkin done (month complete)
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.sys.meta.ensureCheckin && MG.sys.meta.ensureCheckin();
    st.checkin = st.checkin || { month: "", days: [] };
    st.checkin.month = MG.util.month();
    st.checkin.days = Array(30).fill(true); // checkinDay()===30 → 本月完成 CTA
    MG.ui.more.openCheckin();
    await new Promise((r) => setTimeout(r, 80));
    const checkBtns = measure("前往任務");

    return { royalBtns, mazeBtns, checkBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcRoyal", ok: more.includes("v726：王者競技場今日次數用完") },
    { name: "srcMaze", ok: more.includes("v726：奇境迷宮本週全通") },
    { name: "srcCheck", ok: more.includes("v726：簽到已領") },
    { name: "ctaRoyal", ok: okH(r.royalBtns) },
    { name: "ctaMaze", ok: okH(r.mazeBtns) },
    { name: "ctaCheck", ok: okH(r.checkBtns) },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, r, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, fail, errs }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
