/* v806 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-195-v806";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=806", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more && MG.ui.hunters && MG.ui.kingdom);
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

    // A: star fodder short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.hunters = [MG.sys.hunters.create("sword", 1)];
    st.hunters[0].rarity = 1;
    st.formation = [st.hunters[0].id];
    MG.ui.hunters.openDetail(st.hunters[0].id);
    await new Promise((r) => setTimeout(r, 120));
    const starBtns = measure("前往招募", "關閉並開啟招募");

    // B: badge short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    st.legendShards = 0;
    st.legendBadges = {};
    const h = st.hunters[0];
    h.legend = "aile";
    h.name = (MG.data.hunters.LEGENDS.aile || {}).name || "aile";
    h.cls = "sword";
    MG.ui.hunters.openDetail(h.id);
    await new Promise((r) => setTimeout(r, 120));
    const badgeBtns = measure("前往副本", "關閉並前往副本");

    // C: building upgrade short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    st.mats = {};
    st.buildings = st.buildings || {};
    st.buildings.guild = Math.max(1, st.buildings.guild || 0);
    MG.ui.kingdom.openDetail("guild");
    await new Promise((r) => setTimeout(r, 120));
    const buildBtns = measure("前往副本", "關閉並前往副本");

    return { star: starBtns, badge: badgeBtns, build: buildBtns };
  });

  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const king = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  const asserts = [
    { name: "starH", ok: !!(r.star[0] && r.star[0].h >= 44) },
    { name: "badgeH", ok: !!(r.badge[0] && r.badge[0].h >= 44) },
    { name: "buildH", ok: !!(r.build[0] && r.build[0].h >= 44) },
    { name: "srcStar", ok: hun.includes("v806：升星材料不足空態 CTA") },
    { name: "srcBadge", ok: hun.includes("v806：徽章升級資源不足空態 CTA") },
    { name: "srcBuild", ok: king.includes("v806：建築升級資源不足空態 CTA") },
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
