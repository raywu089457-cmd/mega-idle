/* v670 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-59-v670";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=670", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);

  await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    if (MG.ui.screens.tick) MG.ui.screens.tick();
  });
  await page.waitForTimeout(50);

  const offline = await page.evaluate(() => {
    const off = document.getElementById("tb-buff-offline");
    const buffs = document.getElementById("tb-buffs");
    return {
      ok: !!(off && buffs && getComputedStyle(buffs).display !== "none" && /h/.test(off.textContent || "")),
      text: off ? off.textContent : null,
      cap: MG.config.OFFLINE_CAP_H
    };
  });

  await page.evaluate(() => {
    window.__confirmHit = false;
    MG.ui.dom.confirm("測Enter", "請按 Enter", () => { window.__confirmHit = true; });
  });
  await page.waitForTimeout(40);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(60);
  const confirmHit = await page.evaluate(() => !!window.__confirmHit);

  const hotkey = await page.evaluate(async () => {
    const st = MG.game.state;
    if (!st.hunters.length) {
      try {
        const h = MG.sys.hunters.create("sword", 1);
        st.hunters.push(h);
        st.formation = [h.id, null, null, null, null];
      } catch (e) { /* ignore */ }
    } else if (!(st.formation || []).some(Boolean)) {
      st.formation = [st.hunters[0].id, null, null, null, null];
    }
    st.hunt.dispatchIds = [];
    st.hunt.restUntil = 0;
    MG.ui.screens.show("hunt");
    await new Promise((r) => setTimeout(r, 80));
    const has = !!(MG.ui.hunt && MG.ui.hunt.tryHotkeyDispatch);
    const did = has && MG.ui.hunt.tryHotkeyDispatch();
    await new Promise((r) => setTimeout(r, 40));
    const ovl = !!document.querySelector("#overlay-root .ovl");
    return { has, did, ovl };
  });

  const domSrc = fs.readFileSync(path.join(__dirname, "../js/ui/dom.js"), "utf8");
  const enterHook = domSrc.includes("v670：Enter＝確定");

  await page.screenshot({ path: path.join(OUT, TAG + "-ui.png") });
  const out = {
    ok: !errs.length && offline.ok && confirmHit && enterHook && hotkey.has && (hotkey.did || hotkey.ovl),
    offline, confirmHit, enterHook, hotkey, errs
  };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
