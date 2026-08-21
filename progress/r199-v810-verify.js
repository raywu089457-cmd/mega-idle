/* v810 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-199-v810";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=810", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more && MG.ui.hunters && MG.ui.kingdom && MG.ui.equipment);
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

    // A: build construct short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    st.mats = {};
    st.buildings = st.buildings || {};
    st.kingdom = st.kingdom || {};
    st.kingdom.level = Math.max(20, st.kingdom.level || 1);
    st.buildings.market = 0;
    MG.ui.kingdom.openDetail("market");
    await new Promise((r) => setTimeout(r, 120));
    const buildBtns = measure("前往副本", "關閉並前往副本");

    // B: enhance without forge
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings.forge = 0;
    const it = MG.sys.equipment.gen({ slot: "helmet", tier: 1, rarity: 1 });
    it.enhance = 0;
    st.inventory.items = [it];
    MG.ui.equipment.openItem(it);
    await new Promise((r) => setTimeout(r, 120));
    const forgeBtns = measure("前往王國", "關閉並前往王國鐵匠");

    // C: all skills maxed
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h = MG.sys.hunters.create("sword", 1);
    h.level = 80;
    h.skills = {};
    const ids = (MG.data.hunters.classes.sword.skills || []);
    ids.forEach((id) => { h.skills[id] = 10; });
    st.hunters = [h];
    st.formation = [h.id];
    MG.ui.hunters.openDetail(h.id);
    await new Promise((r) => setTimeout(r, 80));
    const skillTab = [...document.querySelectorAll("button, .chip, .tab")].find((b) => /技能/.test(b.textContent || ""));
    if (skillTab) skillTab.click();
    await new Promise((r) => setTimeout(r, 120));
    const skillBtns = measure("前往副本", "關閉並前往副本");

    return { build: buildBtns, forge: forgeBtns, skill: skillBtns };
  });

  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const king = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const asserts = [
    { name: "buildH", ok: !!(r.build[0] && r.build[0].h >= 44) },
    { name: "forgeH", ok: !!(r.forge[0] && r.forge[0].h >= 44) },
    { name: "skillH", ok: !!(r.skill[0] && r.skill[0].h >= 44) },
    { name: "srcBuild", ok: king.includes("v810：建築建造資源不足空態 CTA") },
    { name: "srcForge", ok: eq.includes("v810：裝備強化缺鐵匠鋪空態 CTA") },
    { name: "srcSkill", ok: hun.includes("v810：技能全部滿級空態 CTA") },
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
