/* v818 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-207-v818";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=818", { waitUntil: "domcontentloaded" });
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

    // A: enhance at max
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings = st.buildings || {};
    st.buildings.forge = Math.max(1, st.buildings.forge || 0);
    const it = MG.sys.equipment.gen({ slot: "helmet", tier: 1, rarity: 1 });
    it.uid = "enhmax";
    it.enhance = MG.config.MAX_ITEM_LVL;
    st.inventory.items = [it];
    MG.ui.equipment.openItem(it);
    await new Promise((r) => setTimeout(r, 120));
    const enhBtns = measure("前往副本", "關閉並前往副本");

    // B: hero lv200
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h = MG.sys.hunters.create("sword", 1);
    h.level = 200;
    st.hunters = [h];
    st.formation = [h.id];
    MG.ui.hunters.openDetail(h.id);
    await new Promise((r) => setTimeout(r, 120));
    const lvBtns = measure("前往副本", "關閉並前往副本");

    // C: badge max
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const lids = Object.keys(MG.data.hunters.LEGENDS || {});
    const lid = lids.find((id) => (MG.data.hunters.LEGEND_BADGES || {})[id]) || lids[0];
    const lh = MG.sys.hunters.create((MG.data.hunters.LEGENDS[lid] || {}).cls || "sword", 6);
    lh.legend = lid;
    lh.name = (MG.data.hunters.LEGENDS[lid] || {}).name || lh.name;
    st.hunters = [lh];
    st.formation = [lh.id];
    st.legendBadges = st.legendBadges || {};
    st.legendBadges[lid] = 6;
    MG.ui.hunters.openDetail(lh.id);
    await new Promise((r) => setTimeout(r, 120));
    const badgeBtns = measure("前往副本", "關閉並前往副本");

    return { enh: enhBtns, lv: lvBtns, badge: badgeBtns, lid };
  });

  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const asserts = [
    { name: "enhH", ok: !!(r.enh[0] && r.enh[0].h >= 44) },
    { name: "lvH", ok: !!(r.lv[0] && r.lv[0].h >= 44) },
    { name: "badgeH", ok: !!(r.badge[0] && r.badge[0].h >= 44) },
    { name: "srcEnh", ok: eq.includes("v818：裝備強化已達上限空態 CTA") },
    { name: "srcLv", ok: hun.includes("v818：英雄訓練已達最高等級空態 CTA") },
    { name: "srcBadge", ok: hun.includes("v818：傳說徽章已滿階空態 CTA") },
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
