/* v739 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-128-v739";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=739", { waitUntil: "domcontentloaded" });
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

    // A: main complete
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    st.quests = st.quests || {};
    st.quests.mainIdx = MG.data.quests.MAIN.length;
    MG.ui.more.openQuests();
    await new Promise((r) => setTimeout(r, 60));
    const mainTab = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "主線");
    if (mainTab) mainTab.click();
    await new Promise((r) => setTimeout(r, 80));
    const mainBtns = measure("前往副本");

    // B: guild boss all milestones
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const G = MG.sys.guild;
    G.ensure();
    st.guild.boss = st.guild.boss || {};
    st.guild.boss.claimed = {};
    for (const ms of G.BOSS_MILESTONES) st.guild.boss.claimed[String(ms.pct)] = true;
    st.guild.boss.dmg = st.guild.boss.maxHp || 1e9;
    st.guild.boss.hp = 0;
    MG.ui.more.openGuild();
    await new Promise((r) => setTimeout(r, 40));
    const bossTab = [...document.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "每週首領");
    if (bossTab) bossTab.click();
    await new Promise((r) => setTimeout(r, 100));
    const bossBtns = measure("前往副本");

    // C: codex 100% nothing claimable
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    const origPct = MG.sys.meta.codexPct;
    const origClaim = MG.sys.meta.codexClaimableCount;
    MG.sys.meta.codexPct = () => 1;
    MG.sys.meta.codexClaimableCount = () => 0;
    MG.ui.more.openCodex();
    await new Promise((r) => setTimeout(r, 80));
    const codexBtns = measure("前往副本");
    MG.sys.meta.codexPct = origPct;
    MG.sys.meta.codexClaimableCount = origClaim;

    return { mainBtns, bossBtns, codexBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcMain", ok: more.includes("v739：主線任務全部完成") },
    { name: "srcBoss", ok: more.includes("v739：公會首領里程碑全部已領") },
    { name: "srcCodex", ok: more.includes("v739：圖鑑完成度 100%") },
    { name: "ctaMain", ok: okH(r.mainBtns) },
    { name: "ctaBoss", ok: okH(r.bossBtns) },
    { name: "ctaCodex", ok: okH(r.codexBtns) },
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
