/* v794 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-183-v794";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=794", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more && MG.ui.hunters);
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

    // A: train gold short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    if (!st.hunters.length) {
      const h = MG.sys.hunters.create("sword", 1);
      st.hunters.push(h);
    }
    st.hunters[0].level = Math.min(50, st.hunters[0].level || 1);
    MG.ui.hunters.openDetail(st.hunters[0].id);
    await new Promise((r) => setTimeout(r, 120));
    const trainBtns = measure("前往副本", "關閉並前往副本");

    // B: guild tech gold short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.currencies.gold = 0;
    st.guild = st.guild || {};
    st.guild.level = Math.max(3, st.guild.level || 1);
    st.guild.tech = st.guild.tech || {};
    for (const line of MG.sys.guild.TECH_LINES) st.guild.tech[line] = 0;
    st.guild.donated = MG.sys.guild.DONATIONS; // avoid donate CTA clutter competing
    st.guild.feastDay = MG.util.today();
    MG.ui.more.openGuild();
    await new Promise((r) => setTimeout(r, 150));
    const guildBtns = measure("前往副本", "關閉並前往副本");

    // C: abyss shop mats short
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.stats = st.stats || {};
    st.stats.maxRegionReached = Math.max(5, st.stats.maxRegionReached || 0);
    st.abyss = st.abyss || {};
    st.abyss.best = Math.max(50, st.abyss.best || 0);
    st.mats = st.mats || {};
    st.mats.void = 0;
    st.mats.myth = 0;
    MG.ui.more.openAbyss();
    await new Promise((r) => setTimeout(r, 150));
    const abyssBtns = measure("繼續挑戰", "捲回上方繼續挑戰");

    return { train: trainBtns, guild: guildBtns, abyss: abyssBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const asserts = [
    { name: "trainH", ok: !!(r.train[0] && r.train[0].h >= 44) },
    { name: "guildH", ok: !!(r.guild[0] && r.guild[0].h >= 44) },
    { name: "abyssH", ok: !!(r.abyss[0] && r.abyss[0].h >= 44) },
    { name: "srcTrain", ok: hun.includes("v794：訓練金幣不足空態 CTA") },
    { name: "srcGuild", ok: more.includes("v794：公會科技金幣不足（尚有可升）空態 CTA") },
    { name: "srcAbyss", ok: more.includes("v794：深淵商店碎片不足（尚有庫存）空態 CTA") },
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
