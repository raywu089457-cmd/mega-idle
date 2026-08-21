/* v814 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-203-v814";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=814", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more && MG.ui.hunters && MG.ui.equipment);
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

    // A: no potions
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.inventory.items = (st.inventory.items || []).filter((i) => !(i.defId || "").startsWith("item_pot_"));
    st.hunters = [MG.sys.hunters.create("sword", 1)];
    st.formation = [st.hunters[0].id];
    MG.ui.hunters.openDetail(st.hunters[0].id);
    await new Promise((r) => setTimeout(r, 120));
    const potBtns = measure("前往副本", "關閉並前往副本");

    // B: near cap → warehouse
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings = st.buildings || {};
    st.buildings.warehouse = 0;
    const cap = MG.sys.equipment.inventoryCap();
    st.inventory.items = [];
    for (let i = 0; i < Math.max(0, cap - 3); i++) {
      const it = MG.sys.equipment.gen({ slot: "helmet", tier: 1, rarity: 1 });
      it.uid = "t" + i;
      st.inventory.items.push(it);
    }
    MG.ui.screens.show("equipment");
    await new Promise((r) => setTimeout(r, 250));
    const whBtns = measure("前往倉庫", "前往王國倉庫");

    // C: gemworks missing
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings.forge = Math.max(1, st.buildings.forge || 0);
    st.buildings.gemworks = 0;
    MG.ui.more.openForge();
    await new Promise((r) => setTimeout(r, 80));
    const gemChip = [...document.querySelectorAll(".chip")].find((c) => /寶石製作/.test(c.textContent || ""));
    if (gemChip) gemChip.click();
    await new Promise((r) => setTimeout(r, 120));
    const gemBtns = measure("前往王國", "關閉並前往王國寶石工坊");

    return { pot: potBtns, wh: whBtns, gem: gemBtns };
  });

  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const asserts = [
    { name: "potH", ok: !!(r.pot[0] && r.pot[0].h >= 44) },
    { name: "whH", ok: !!(r.wh[0] && r.wh[0].h >= 44) },
    { name: "gemH", ok: !!(r.gem[0] && r.gem[0].h >= 44) },
    { name: "srcPot", ok: hun.includes("v814：生命／魔力藥水皆無空態 CTA") },
    { name: "srcWh", ok: eq.includes("v814：背包接近上限空態 CTA") },
    { name: "srcGem", ok: more.includes("v814：寶石工坊未建空態 CTA") },
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
