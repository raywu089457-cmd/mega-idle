/* v850 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-239-v850";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=850", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.kingdom && MG.ui.hunters && MG.ui.more);
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

    // A: building unlock not met (gemworks unlock 3)
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.kingdom = st.kingdom || {};
    st.kingdom.level = 1;
    st.buildings = st.buildings || {};
    st.buildings.gemworks = 0;
    MG.ui.kingdom.openDetail("gemworks");
    await new Promise((r) => setTimeout(r, 120));
    const unlockBtns = measure("前往副本", "關閉並前往副本升王國");

    // B: altar not built
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings.altar = 0;
    MG.ui.more.openAltar();
    await new Promise((r) => setTimeout(r, 120));
    const altarBtns = measure("前往王國", "關閉並前往王國祭壇");

    // C: training not built
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings.training = 0;
    st.currencies.gold = 999999;
    const h1 = MG.sys.hunters.create("sword", 1);
    h1.level = 10;
    st.hunters = [h1];
    st.formation = [h1.id];
    MG.ui.hunters.openDetail(h1.id);
    await new Promise((r) => setTimeout(r, 120));
    const trainBtns = measure("前往王國", "關閉並前往王國訓練場");

    return { unlock: unlockBtns, altar: altarBtns, train: trainBtns };
  });

  const kin = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const asserts = [
    { name: "unlockH", ok: !!(r.unlock[0] && r.unlock[0].h >= 44) },
    { name: "altarH", ok: !!(r.altar[0] && r.altar[0].h >= 44) },
    { name: "trainH", ok: !!(r.train[0] && r.train[0].h >= 44) },
    { name: "srcUnlock", ok: kin.includes("v850：建築解鎖條件未達空態 CTA") },
    { name: "srcAltar", ok: more.includes("v850：祭壇未建空態 CTA") },
    { name: "srcTrain", ok: hun.includes("v850：訓練場未建空態 CTA") },
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
