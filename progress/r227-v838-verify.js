/* v838 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-227-v838";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=838", { waitUntil: "domcontentloaded" });
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

    // A: locked hero
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h1 = MG.sys.hunters.create("sword", 1);
    h1.locked = true;
    h1.level = 10;
    st.hunters = [h1];
    st.formation = [h1.id];
    st.currencies.swapStone = 1;
    MG.ui.hunters.openDetail(h1.id);
    await new Promise((r) => setTimeout(r, 120));
    const lockBtns = measure("解除鎖定", "解除鎖定並刷新詳情");

    // B: detail swap stone 0
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h2 = MG.sys.hunters.create("sword", 1);
    h2.locked = false;
    st.hunters = [h2];
    st.formation = [h2.id];
    st.currencies.swapStone = 0;
    MG.ui.hunters.openDetail(h2.id);
    await new Promise((r) => setTimeout(r, 120));
    const stoneBtns = measure("前往王者商店", "關閉並前往王者商店換置換石");

    // C: swap modal stone insufficient
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h3 = MG.sys.hunters.create("sword", 2);
    const h4 = MG.sys.hunters.create("sword", 1);
    h3.locked = false;
    h4.locked = false;
    st.hunters = [h3, h4];
    st.formation = [h3.id];
    st.currencies.swapStone = 0;
    MG.ui.hunters.openSwap(h3);
    await new Promise((r) => setTimeout(r, 120));
    const modalBtns = measure("前往王者商店", "關閉並前往王者商店補置換石");

    return { lock: lockBtns, stone: stoneBtns, modal: modalBtns };
  });

  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const asserts = [
    { name: "lockH", ok: !!(r.lock[0] && r.lock[0].h >= 44) },
    { name: "stoneH", ok: !!(r.stone[0] && r.stone[0].h >= 44) },
    { name: "modalH", ok: !!(r.modal[0] && r.modal[0].h >= 44) },
    { name: "srcLock", ok: hun.includes("v838：英雄已鎖定空態 CTA") },
    { name: "srcStone", ok: hun.includes("v838：置換石不足空態 CTA") },
    { name: "srcModal", ok: hun.includes("v838：置換視窗置換石不足空態 CTA") },
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
