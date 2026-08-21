/* v722 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-111-v722";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=722", { waitUntil: "domcontentloaded" });
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

    // A: arena exhausted
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.sys.arena.ensure && MG.sys.arena.ensure();
    st.arena = st.arena || {};
    st.arena.fights = 99;
    MG.ui.more.openArena();
    await new Promise((r) => setTimeout(r, 80));
    const arenaBtns = measure("前往榮譽商店");

    // B: worldboss exhausted
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.sys.worldboss.ensure && MG.sys.worldboss.ensure();
    st.worldboss = st.worldboss || {};
    st.worldboss.attacks = MG.sys.worldboss.ATTACKS || 3;
    MG.ui.more.openWorldboss();
    await new Promise((r) => setTimeout(r, 80));
    const wbBtns = measure("前往副本");

    // C: guild daily done
    document.querySelectorAll(".modal").forEach((el) => el.remove());
    MG.sys.guild.ensure && MG.sys.guild.ensure();
    st.guild = st.guild || {};
    st.guild.donated = MG.sys.guild.DONATIONS || 3;
    st.guild.feastDay = MG.util.today();
    MG.ui.more.openGuild();
    await new Promise((r) => setTimeout(r, 80));
    const guildBtns = measure("前往副本");

    return { arenaBtns, wbBtns, guildBtns };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const asserts = [
    { name: "srcArena", ok: more.includes("v722：競技場今日次數用完") },
    { name: "srcWb", ok: more.includes("v722：世界首領今日次數用完") },
    { name: "srcGuild", ok: more.includes("v722：公會今日捐獻＋盛宴用完") },
    { name: "ctaArena", ok: okH(r.arenaBtns) },
    { name: "ctaWb", ok: okH(r.wbBtns) },
    { name: "ctaGuild", ok: okH(r.guildBtns) },
    { name: "noErr", ok: !errs.length }
  ];
  const fail = asserts.filter((a) => !a.ok);
  const out = { ok: fail.length === 0, r, asserts, fail, errs };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), JSON.stringify({ ok: out.ok, asserts, fail, errs }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
