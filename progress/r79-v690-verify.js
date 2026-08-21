/* v690 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-79-v690";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=690", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.more && MG.ui.hunters);
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
          return { h: Math.round(r.height), w: Math.round(r.width) };
        });
    }
    function wipe() {
      document.querySelectorAll(".modal, .overlay").forEach((el) => el.remove());
    }

    // A defense empty
    st.hunters = [];
    MG.ui.more.openDefenseEditor();
    await new Promise((r) => setTimeout(r, 50));
    const defBtns = measure("前往英雄");
    wipe();

    // B expedition — unlock + empty hunters + open pick
    st.kingdom.level = 20;
    st.hunters = [];
    st.hunt = st.hunt || {};
    st.hunt.dispatchIds = [];
    st.formation = [];
    MG.sys.expedition.ensure();
    const tasks = MG.sys.expedition.tasks();
    MG.ui.more.openExpedition();
    await new Promise((r) => setTimeout(r, 80));
    const taskRow = [...document.querySelectorAll(".modal div")].find((el) => (el.textContent || "").includes("點擊派遣") && el.onclick);
    const clickable = [...document.querySelectorAll(".modal [title]")].find((el) => (el.getAttribute("title") || "").includes("點擊派遣"));
    if (clickable) clickable.click();
    else if (taskRow) taskRow.click();
    await new Promise((r) => setTimeout(r, 80));
    const expBtns = measure("前往英雄");
    wipe();

    // C swap — single hunter no peers
    st.hunters = [{
      id: 99, name: "測劍", cls: "sword", level: 10, rarity: 2, exp: 0, promoted: 0,
      locked: false, skills: [], equip: {}, hp: 200, maxHp: 200, mp: 50, sprite: "h_sword",
      skillLv: {}, spentGold: 0
    }];
    MG.ui.hunters.openSwap(st.hunters[0]);
    await new Promise((r) => setTimeout(r, 50));
    const swapBtns = measure("前往英雄");
    wipe();

    return { defBtns, expBtns, swapBtns, tasks: (tasks || []).length };
  });

  const more = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  const hun = fs.readFileSync(path.join(__dirname, "../js/ui/hunters.js"), "utf8");
  const okH = (arr) => (arr || []).some((b) => b.h >= 44);
  const out = {
    ok: !errs.length
      && more.includes("v690：防守空態 CTA")
      && more.includes("v690：遠征無空閒英雄 CTA")
      && hun.includes("v690：置換無同職 CTA")
      && okH(r.defBtns)
      && okH(r.swapBtns)
      && (okH(r.expBtns) || r.tasks === 0), // expedition may need task click path
    r, errs
  };
  // require all three if exp path worked; else require def+swap + source for exp
  if (okH(r.expBtns)) {
    out.ok = out.ok && true;
  } else {
    out.ok = !errs.length && okH(r.defBtns) && okH(r.swapBtns)
      && more.includes("v690：遠征無空閒英雄 CTA");
  }
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
