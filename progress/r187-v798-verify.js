/* v798 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-187-v798";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=798", { waitUntil: "domcontentloaded" });
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
          return { h: Math.round(r.height), w: Math.round(r.width), t: b.getAttribute("title") || "" };
        });
    }

    // A: promote resource short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    st.mats = st.mats || {};
    for (const k of Object.keys(st.mats)) st.mats[k] = 0;
    if (!st.hunters.length) st.hunters.push(MG.sys.hunters.create("sword", 1));
    const h = st.hunters[0];
    h.level = 25;
    h.promoted = 0;
    h.exp = 0;
    MG.ui.hunters.openDetail(h.id);
    await new Promise((r) => setTimeout(r, 120));
    const promoBtns = measure("前往副本", "關閉並前往副本");

    // B: ancient tech gold short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    st.guild = st.guild || {};
    st.guild.level = MG.sys.guild.MAX_LEVEL;
    st.guild.ancient = st.guild.ancient || {};
    for (const line of MG.sys.guild.TECH_LINES) st.guild.ancient[line] = 0;
    st.guild.donated = MG.sys.guild.DONATIONS;
    st.guild.feastDay = MG.util.today();
    MG.ui.more.openGuild();
    await new Promise((r) => setTimeout(r, 150));
    const ancientBtns = measure("前往副本", "關閉並前往副本");

    // C: affix reroll short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    for (const k of Object.keys(st.mats || {})) st.mats[k] = 0;
    const item = MG.sys.equipment.gen({ tier: 3, rarity: 3, slot: "sword", enhance: 0 });
    item.uid = item.uid || ("v798_" + Date.now());
    st.inventory = st.inventory || { items: [] };
    st.inventory.items = st.inventory.items || [];
    st.inventory.items.push(item);
    MG.ui.equipment.openItem(item);
    await new Promise((r) => setTimeout(r, 120));
    const rerollBtns = measure("前往副本", "關閉並前往副本");

    return { promo: promoBtns, ancient: ancientBtns, reroll: rerollBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const asserts = [
    { name: "promoH", ok: !!(r.promo[0] && r.promo[0].h >= 44) },
    { name: "ancientH", ok: !!(r.ancient[0] && r.ancient[0].h >= 44) },
    { name: "rerollH", ok: !!(r.reroll[0] && r.reroll[0].h >= 44) },
    { name: "srcPromo", ok: hun.includes("v798：突破資源不足（等級已達）空態 CTA") },
    { name: "srcAncient", ok: more.includes("v798：遠古科技金幣不足（尚有可升）空態 CTA") },
    { name: "srcReroll", ok: eq.includes("v798：詞綴重鑄資源不足空態 CTA") },
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
