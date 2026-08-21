/* v702 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-91-v702";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=702", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.equipment);
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

    // seed one armor piece (no weapons)
    const it = MG.sys.equipment.gen({ tier: 1, slot: "armor", rarity: 2 });
    st.inventory.items = [it];

    MG.ui.screens.show("equipment");
    await new Promise((r) => setTimeout(r, 200));

    // A: enable ★6 filter → empty while bag has gear
    const star6 = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "★6");
    if (star6) star6.click();
    await new Promise((r) => setTimeout(r, 120));
    const clearBtns = measure("清除篩選");

    // clear via CTA
    const clearBtn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "清除篩選");
    if (clearBtn) clearBtn.click();
    await new Promise((r) => setTimeout(r, 120));

    // B: weapon tab with only armor in bag
    const weaponChip = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "武器");
    if (weaponChip) weaponChip.click();
    await new Promise((r) => setTimeout(r, 120));
    const allBtns = measure("切換全部");

    // C: pickGem empty
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const fake = { gems: [null], uid: "t", defId: "armor_t1", tier: 1, rarity: 1 };
    if (MG.ui.equipment.pickGem) MG.ui.equipment.pickGem(fake, 0, { close: () => {} });
    await new Promise((r) => setTimeout(r, 80));
    const huntBtns = measure("前往副本");

    return { clearBtns, allBtns, huntBtns };
  });

  const src = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcClear", ok: src.includes("清除篩選") && src.includes("v702") },
    { name: "srcTab", ok: src.includes("切換全部") },
    { name: "srcGem", ok: src.includes("鑲嵌無寶石") },
    { name: "ctaClear", ok: okH(r.clearBtns) },
    { name: "ctaAll", ok: okH(r.allBtns) },
    { name: "ctaHunt", ok: okH(r.huntBtns) },
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
