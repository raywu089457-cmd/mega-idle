/* v682 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-71-v682";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=682", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);

  const r = await page.evaluate(async () => {
    function wipe() {
      document.querySelectorAll(".modal").forEach((el) => { try { el.remove(); } catch (e) {} });
    }
    function btn(txt) {
      return [...document.querySelectorAll(".modal button")].find((b) => b.textContent.trim() === txt);
    }
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    // force locked: low region / low kingdom
    st.stats = st.stats || {};
    st.stats.maxRegionReached = 0;
    st.hunt = st.hunt || {};
    st.hunt.region = 0;
    st.kingdom.level = 1;

    MG.ui.more.openAbyss();
    await new Promise((r) => setTimeout(r, 80));
    const abyssCta = btn("前往副本");
    const abyssOk = !!(abyssCta && abyssCta.getBoundingClientRect().height >= 40);
    const abyssH = abyssCta ? Math.round(abyssCta.getBoundingClientRect().height) : 0;
    wipe();

    MG.ui.more.openRoyal();
    await new Promise((r) => setTimeout(r, 80));
    const royalCta = btn("前往建築");
    const royalOk = !!(royalCta && royalCta.getBoundingClientRect().height >= 40);
    const royalH = royalCta ? Math.round(royalCta.getBoundingClientRect().height) : 0;
    wipe();

    MG.ui.more.openExpedition();
    await new Promise((r) => setTimeout(r, 80));
    const expCta = btn("前往建築");
    const expOk = !!(expCta && expCta.getBoundingClientRect().height >= 40);
    const expH = expCta ? Math.round(expCta.getBoundingClientRect().height) : 0;
    wipe();

    return { abyssOk, royalOk, expOk, abyssH, royalH, expH };
  });

  const src = fs.readFileSync(path.join(__dirname, "../js/ui/more.js"), "utf8");
  await page.screenshot({ path: path.join(OUT, TAG + "-ui.png") });
  const out = {
    ok: !errs.length && r.abyssOk && r.royalOk && r.expOk
      && src.includes("v682：深淵未解鎖") && src.includes("v682：未解鎖 CTA")
      && (src.match(/v682/g) || []).length >= 3,
    r, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
