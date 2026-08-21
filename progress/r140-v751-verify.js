/* v751 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-140-v751";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=751", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more && MG.ui.screens);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());

    function measure(txt) {
      return [...document.querySelectorAll("button")]
        .filter((b) => b.textContent.trim() === txt)
        .map((b) => {
          const r = b.getBoundingClientRect();
          return { h: Math.round(r.height), w: Math.round(r.width), t: b.getAttribute("title") || "" };
        });
    }

    // A: ancient all max
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const G = MG.sys.guild;
    G.ensure();
    st.guild.level = G.MAX_LEVEL;
    st.guild.tech = st.guild.tech || {};
    for (const line of G.TECH_LINES) st.guild.tech[line] = G.MAX_LEVEL;
    st.guild.ancient = st.guild.ancient || {};
    for (const line of G.TECH_LINES) st.guild.ancient[line] = G.MAX_ANCIENT;
    st.guild.ancientDone = true;
    st.guild.ancientDone2 = true;
    st.guild.donated = 0;
    st.guild.feastDay = "";
    MG.ui.more.openGuild();
    await new Promise((r) => setTimeout(r, 40));
    const techTab = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "公會科技");
    if (techTab) techTab.click();
    await new Promise((r) => setTimeout(r, 120));
    const ancientBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    // B: abyss table milestones claimed
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const A = MG.sys.abyss;
    A.ensure();
    st.stats = st.stats || {};
    st.stats.maxRegionReached = Math.max(st.stats.maxRegionReached || 0, 5);
    st.abyss.best = 1000;
    st.abyss.claimed = {};
    for (const ms of A.MILESTONES) st.abyss.claimed[ms.floor] = true;
    MG.ui.more.openAbyss();
    await new Promise((r) => setTimeout(r, 120));
    const abyssBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    // C: kingdom Lv50
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.kingdom.level = 50;
    st.kingdom.exp = 0;
    MG.ui.screens.show("kingdom");
    await new Promise((r) => setTimeout(r, 80));
    MG.ui.screens.refreshAll();
    await new Promise((r) => setTimeout(r, 120));
    const kingdomBtns = measure("前往副本").filter((b) => (b.t || "") === "前往副本" || (b.t || "").includes("前往副本"));

    return { ancientBtns, abyssBtns, kingdomBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const kd = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcAncient", ok: more.includes("v751：遠古科技全部滿級") },
    { name: "srcAbyss", ok: more.includes("v751：深淵表列里程碑全部已領") },
    { name: "srcKingdom", ok: kd.includes("v751：王國滿級空態 CTA") },
    { name: "ctaAncient", ok: okH(r.ancientBtns) },
    { name: "ctaAbyss", ok: okH(r.abyssBtns) },
    { name: "ctaKingdom", ok: okH(r.kingdomBtns) },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, r, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, fail, errs, r }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
