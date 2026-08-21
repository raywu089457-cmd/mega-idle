/* v834 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-223-v834";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=834", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.hunters && MG.ui.equipment);
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
    function clickChip(label) {
      const chip = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === label);
      if (chip) chip.click();
    }

    // A: skills locked
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h1 = MG.sys.hunters.create("sword", 1);
    h1.level = 1;
    st.hunters = [h1];
    st.formation = [h1.id];
    MG.ui.hunters.openDetail(h1.id);
    await new Promise((r) => setTimeout(r, 80));
    clickChip("技能");
    await new Promise((r) => setTimeout(r, 120));
    const skillBtns = measure("前往副本", "關閉並前往副本練級解鎖技能");

    // B: no sockets
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const it2 = MG.sys.equipment.gen({ slot: "armor", tier: 1, rarity: 1 });
    it2.gems = [];
    it2.locked = false;
    st.inventory.items = [it2];
    MG.ui.equipment.openItem(it2);
    await new Promise((r) => setTimeout(r, 120));
    const sockBtns = measure("前往副本", "關閉並前往副本找插槽裝");

    // C: low rarity reroll
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const it3 = MG.sys.equipment.gen({ slot: "helm", tier: 2, rarity: 2 });
    it3.rarity = 2;
    it3.gems = [null];
    it3.locked = false;
    st.inventory.items = [it3];
    st.currencies.gold = 999999;
    MG.ui.equipment.openItem(it3);
    await new Promise((r) => setTimeout(r, 120));
    const rarBtns = measure("前往副本", "關閉並前往副本找★3+裝備");

    return { skill: skillBtns, sock: sockBtns, rar: rarBtns };
  });

  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const asserts = [
    { name: "skillH", ok: !!(r.skill[0] && r.skill[0].h >= 44) },
    { name: "sockH", ok: !!(r.sock[0] && r.sock[0].h >= 44) },
    { name: "rarH", ok: !!(r.rar[0] && r.rar[0].h >= 44) },
    { name: "srcSkill", ok: hun.includes("v834：技能尚未解鎖空態 CTA") },
    { name: "srcSock", ok: eq.includes("v834：裝備無寶石插槽空態 CTA") },
    { name: "srcRar", ok: eq.includes("v834：稀有度不足無法重鑄詞綴空態 CTA") },
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
