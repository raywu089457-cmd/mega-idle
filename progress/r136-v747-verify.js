/* v747 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-136-v747";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=747", { waitUntil: "domcontentloaded" });
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

    // A: week milestones all claimed (not daily left=0 CTA only)
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const W = MG.sys.worldboss;
    W.ensure();
    st.worldboss.weekClaimed = {};
    for (const ms of W.WEEK_MILESTONES) st.worldboss.weekClaimed["w" + ms.atk] = true;
    st.worldboss.attacks = 0; // keep daily left > 0 so daily CTA may not show; week CTA should
    // force left > 0
    st.worldboss.day = MG.util.today();
    st.worldboss.attacks = 0;
    MG.ui.more.openWorldboss();
    await new Promise((r) => setTimeout(r, 100));
    const weekBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    // B: damage milestones all claimed
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.worldboss.weekClaimed = {};
    st.worldboss.claimed = {};
    for (const ms of W.MILESTONES) st.worldboss.claimed[String(ms.pct)] = true;
    st.worldboss.attacks = 0;
    MG.ui.more.openWorldboss();
    await new Promise((r) => setTimeout(r, 100));
    const dmgBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    // C: guild tech all max
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const G = MG.sys.guild;
    G.ensure();
    st.guild.level = G.MAX_LEVEL;
    st.guild.tech = st.guild.tech || {};
    for (const line of G.TECH_LINES) st.guild.tech[line] = G.MAX_LEVEL;
    // avoid donate CTA: leave donate available
    st.guild.donated = 0;
    st.guild.feastDay = "";
    MG.ui.more.openGuild();
    await new Promise((r) => setTimeout(r, 40));
    const techTab = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "公會科技");
    if (techTab) techTab.click();
    await new Promise((r) => setTimeout(r, 100));
    const techBtns = measure("前往副本").filter((b) => (b.t || "").includes("關閉並前往副本"));

    return { weekBtns, dmgBtns, techBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcWeek", ok: more.includes("v747：世界首領每週討伐里程碑全部已領") },
    { name: "srcDmg", ok: more.includes("v747：世界首領總傷里程碑全部已領") },
    { name: "srcTech", ok: more.includes("v747：公會科技全部滿級") },
    { name: "ctaWeek", ok: okH(r.weekBtns) },
    { name: "ctaDmg", ok: okH(r.dmgBtns) },
    { name: "ctaTech", ok: okH(r.techBtns) },
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
