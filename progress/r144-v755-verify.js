/* v755 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-144-v755";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=755", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more);
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

    // A: guild max
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const G = MG.sys.guild;
    G.ensure();
    st.guild.level = G.MAX_LEVEL;
    st.guild.donated = 0;
    st.guild.feastDay = "";
    MG.ui.more.openGuild();
    await new Promise((r) => setTimeout(r, 40));
    const techTab = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "公會科技");
    if (techTab) techTab.click();
    await new Promise((r) => setTimeout(r, 100));
    const guildBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    // B: royal max tier
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.kingdom.level = Math.max(st.kingdom.level || 1, 12);
    const R = MG.sys.royal;
    R.ensure();
    st.royal.tierScore = 15;
    st.royal.fights = 0;
    st.royal.day = MG.util.today();
    MG.ui.more.openRoyal();
    await new Promise((r) => setTimeout(r, 100));
    const royalBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    // C: abyss mats exchange exhausted
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const A = MG.sys.abyss;
    A.ensure();
    st.stats = st.stats || {};
    st.stats.maxRegionReached = Math.max(st.stats.maxRegionReached || 0, 5);
    st.abyss.best = 200;
    st.abyss.claimed = {};
    const cap = MG.sys.meta.matsExCap();
    st.matsEx = { week: MG.sys.meta.weekKey(), n: cap };
    MG.ui.more.openAbyss();
    await new Promise((r) => setTimeout(r, 120));
    const matsBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    return { guildBtns, royalBtns, matsBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcGuild", ok: more.includes("v755：公會已滿級") },
    { name: "srcRoyal", ok: more.includes("v755：王者最高分檔") },
    { name: "srcMats", ok: more.includes("v755：深淵素材兌換週額用完") },
    { name: "ctaGuild", ok: okH(r.guildBtns) },
    { name: "ctaRoyal", ok: okH(r.royalBtns) },
    { name: "ctaMats", ok: okH(r.matsBtns) },
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
