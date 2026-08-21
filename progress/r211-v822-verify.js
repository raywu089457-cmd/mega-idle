/* v822 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-211-v822";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=822", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.hunters);
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

    // A: promote max
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h1 = MG.sys.hunters.create("sword", 1);
    h1.promoted = 5;
    h1.level = 150;
    st.hunters = [h1];
    st.formation = [h1.id];
    st.inventory.items = (st.inventory.items || []).filter((i) => !(i.defId || "").startsWith("item_pot_"));
    st.inventory.items.push({ defId: "item_pot_hp", qty: 1, uid: "php" }, { defId: "item_pot_mp", qty: 1, uid: "pmp" });
    st.currencies.gold = 999999;
    MG.ui.hunters.openDetail(h1.id);
    await new Promise((r) => setTimeout(r, 120));
    const promoBtns = measure("前往副本", "關閉並前往副本");

    // B: star max
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const maxStar = (MG.data.hunters.starUp && MG.data.hunters.starUp.max) || MG.config.RARITY.length;
    const h2 = MG.sys.hunters.create("sword", maxStar);
    h2.rarity = maxStar;
    st.hunters = [h2];
    st.formation = [h2.id];
    st.inventory.items = [{ defId: "item_pot_hp", qty: 1, uid: "php2" }, { defId: "item_pot_mp", qty: 1, uid: "pmp2" }];
    st.currencies.gold = 999999;
    MG.ui.hunters.openDetail(h2.id);
    await new Promise((r) => setTimeout(r, 120));
    const starBtns = measure("前往副本", "關閉並前往副本");

    // C: only HP pot missing
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const h3 = MG.sys.hunters.create("sword", 1);
    st.hunters = [h3];
    st.formation = [h3.id];
    st.inventory.items = [{ defId: "item_pot_mp", qty: 2, uid: "pmp3" }];
    st.currencies.gold = 999999;
    MG.ui.hunters.openDetail(h3.id);
    await new Promise((r) => setTimeout(r, 120));
    const potBtns = measure("前往副本", "關閉並前往副本補藥水");

    return { promo: promoBtns, star: starBtns, pot: potBtns, maxStar };
  });

  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const asserts = [
    { name: "promoH", ok: !!(r.promo[0] && r.promo[0].h >= 44) },
    { name: "starH", ok: !!(r.star[0] && r.star[0].h >= 44) },
    { name: "potH", ok: !!(r.pot[0] && r.pot[0].h >= 44) },
    { name: "srcPromo", ok: hun.includes("v822：突破已滿階空態 CTA") },
    { name: "srcStar", ok: hun.includes("v822：升星已達最高星級空態 CTA") },
    { name: "srcPot", ok: hun.includes("v822：僅缺一種藥水空態 CTA") },
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
