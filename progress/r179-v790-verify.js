/* v790 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-179-v790";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=790", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more && MG.ui.equipment);
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

    // A: guild donate gold short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    st.guild = st.guild || {};
    st.guild.level = Math.max(1, st.guild.level || 1);
    st.guild.donated = 0;
    st.guild.feastDay = "";
    MG.ui.more.openGuild();
    await new Promise((r) => setTimeout(r, 120));
    const guildBtns = measure("前往副本", "關閉並前往副本");

    // B: events shop pts short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.events = st.events || {};
    st.events.pts = 0;
    st.events.redeemed = st.events.redeemed || {};
    // ensure stock remaining
    for (const s of MG.sys.events.SHOP || []) st.events.redeemed[s.id] = 0;
    // also set current week pts path used by UI
    if (st.events.cur) st.events.cur.pts = 0;
    MG.ui.more.openEvents();
    await new Promise((r) => setTimeout(r, 150));
    const eventBtns = measure("前往副本", "關閉並前往副本");

    // C: enhance gold short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.buildings = st.buildings || {};
    st.buildings.forge = Math.max(1, st.buildings.forge || 0);
    st.currencies.gold = 0;
    const item = MG.sys.equipment.gen({ tier: 1, rarity: 1, slot: "sword", enhance: 0 });
    item.uid = item.uid || ("v790_" + Date.now());
    st.inventory = st.inventory || { items: [] };
    st.inventory.items = st.inventory.items || [];
    st.inventory.items.push(item);
    MG.ui.equipment.openItem(item);
    await new Promise((r) => setTimeout(r, 120));
    const enhBtns = measure("前往副本", "關閉並前往副本");

    return { guild: guildBtns, events: eventBtns, enhance: enhBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const eq = fs.readFileSync(path.join(__dirname, "../js/ui/equipment.js"), "utf8");
  const asserts = [
    { name: "guildH", ok: !!(r.guild[0] && r.guild[0].h >= 44) },
    { name: "eventsH", ok: !!(r.events[0] && r.events[0].h >= 44) },
    { name: "enhanceH", ok: !!(r.enhance[0] && r.enhance[0].h >= 44) },
    { name: "srcGuild", ok: more.includes("v790：公會捐獻金幣不足（尚有次數）空態 CTA") },
    { name: "srcEvents", ok: more.includes("v790：活動商店活動點不足（尚有庫存）空態 CTA") },
    { name: "srcEnhance", ok: eq.includes("v790：裝備強化金幣不足空態 CTA") },
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
