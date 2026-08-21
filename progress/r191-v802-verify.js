/* v802 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-191-v802";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=802", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more && MG.ui.hunters);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    function measure(txt) {
      return [...document.querySelectorAll("button")]
        .filter((b) => b.textContent.trim() === txt && (b.getAttribute("title") || "").includes("關閉並前往副本"))
        .map((b) => {
          const r = b.getBoundingClientRect();
          return { h: Math.round(r.height), w: Math.round(r.width) };
        });
    }
    function clickChip(label) {
      const c = [...document.querySelectorAll(".chip")].find((el) => el.textContent.trim() === label);
      if (c) c.click();
    }

    // A: skill book short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.book = 0;
    st.currencies.gold = 1e9;
    if (!st.hunters.length) st.hunters.push(MG.sys.hunters.create("sword", 3));
    const h = st.hunters[0];
    h.level = 40;
    h.skills = h.skills || {};
    MG.ui.hunters.openDetail(h.id);
    await new Promise((r) => setTimeout(r, 80));
    clickChip("技能");
    await new Promise((r) => setTimeout(r, 80));
    const skillBtns = measure("前往副本");

    // B: refine short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    st.mats = { crystal: 0, ember: 0, void: 0, myth: 0 };
    const aid = "dragon_scale";
    st.artifacts = st.artifacts || { owned: {}, levels: {}, awake: {} };
    st.artifacts.owned[aid] = true;
    st.artifacts.levels[aid] = 3;
    h.art = aid;
    MG.ui.hunters.openDetail(h.id);
    await new Promise((r) => setTimeout(r, 80));
    clickChip("裝備");
    await new Promise((r) => setTimeout(r, 80));
    const refineBtns = measure("前往副本");

    // C: gem fuse gold short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    st.inventory = st.inventory || { items: [] };
    st.inventory.items = [{ uid: "v802g", defId: "ruby_1", tier: 1, qty: 3, gems: [], enhance: 0 }];
    MG.ui.more.openForge();
    await new Promise((r) => setTimeout(r, 80));
    clickChip("寶石製作");
    await new Promise((r) => setTimeout(r, 80));
    const gemBtns = measure("前往副本");

    return { skill: skillBtns, refine: refineBtns, gem: gemBtns };
  });

  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const asserts = [
    { name: "skillH", ok: !!(r.skill[0] && r.skill[0].h >= 44) },
    { name: "refineH", ok: !!(r.refine[0] && r.refine[0].h >= 44) },
    { name: "gemH", ok: !!(r.gem[0] && r.gem[0].h >= 44) },
    { name: "srcSkill", ok: hun.includes("v802：技能書不足（尚有可升）空態 CTA") },
    { name: "srcRefine", ok: hun.includes("v802：神器精煉資源不足空態 CTA") },
    { name: "srcGem", ok: more.includes("v802：寶石融合金幣不足（尚有 ×3）空態 CTA") },
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
