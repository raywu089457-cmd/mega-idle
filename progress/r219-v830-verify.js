/* v830 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-219-v830";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=830", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.equipment);
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

    // A: sockets full
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const it1 = MG.sys.equipment.gen({ slot: "weapon", tier: 3, rarity: 4, wtype: "sword" });
    it1.gems = ["ruby_1", "sapphire_1"];
    it1.enhance = 0;
    it1.locked = false;
    st.inventory.items = [it1];
    st.currencies.gold = 999999;
    MG.ui.equipment.openItem(it1);
    await new Promise((r) => setTimeout(r, 120));
    const fullBtns = measure("前往副本", "關閉並前往副本（插槽已滿）");

    // B: empty sockets, no gems
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const it2 = MG.sys.equipment.gen({ slot: "armor", tier: 2, rarity: 3 });
    it2.gems = [null, null];
    it2.enhance = 0;
    it2.locked = false;
    st.inventory.items = [it2];
    MG.ui.equipment.openItem(it2);
    await new Promise((r) => setTimeout(r, 120));
    const missBtns = measure("前往副本", "關閉並前往副本補寶石");

    // C: locked
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const it3 = MG.sys.equipment.gen({ slot: "helm", tier: 1, rarity: 2 });
    it3.gems = [];
    it3.locked = true;
    st.inventory.items = [it3];
    MG.ui.equipment.openItem(it3);
    await new Promise((r) => setTimeout(r, 120));
    const lockBtns = measure("解除鎖定", "解除鎖定並刷新詳情");

    return { full: fullBtns, miss: missBtns, lock: lockBtns };
  });

  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const asserts = [
    { name: "fullH", ok: !!(r.full[0] && r.full[0].h >= 44) },
    { name: "missH", ok: !!(r.miss[0] && r.miss[0].h >= 44) },
    { name: "lockH", ok: !!(r.lock[0] && r.lock[0].h >= 44) },
    { name: "srcFull", ok: eq.includes("v830：寶石插槽已滿空態 CTA") },
    { name: "srcMiss", ok: eq.includes("v830：有空槽但背包無寶石空態 CTA") },
    { name: "srcLock", ok: eq.includes("v830：裝備已鎖定無法分解空態 CTA") },
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
