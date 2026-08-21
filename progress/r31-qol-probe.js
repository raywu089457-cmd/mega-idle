/* R31 QoL 取證探針 */
"use strict";
const fs = require("fs");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("http://127.0.0.1:8123/index.html?v=r31", { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => window.MG && MG.game && MG.game.state);
  await p.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());
  });
  await p.waitForTimeout(500);

  const probes = await p.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = {};

    MG.ui.screens.show("more");
    await sleep(400);
    const moreTexts = [...document.querySelectorAll("button,.row.tap,.row")].map((el) =>
      (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60)
    );
    out.moreRows = moreTexts.filter(Boolean).slice(0, 50);
    out.hasReplayTut = moreTexts.some((t) => /重播教學|教學|說明|help/i.test(t));
    out.hasSaveExport = moreTexts.some((t) => /匯出|匯入|存檔|備份/.test(t));

    const setBtn = [...document.querySelectorAll("button,.row")].find((el) => /設定/.test(el.textContent || ""));
    if (setBtn) {
      setBtn.click();
      await sleep(400);
    }
    out.settingsRows = [...document.querySelectorAll(".modal .row, .modal button, [class*=modal] .row")]
      .map((el) => ({
        text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
        h: el.offsetHeight,
        w: el.offsetWidth,
        cls: el.className
      }))
      .filter((x) => x.text)
      .slice(0, 40);

    // 素材總覽入口
    MG.ui.screens.show("kingdom");
    await sleep(300);
    out.kingdomTextSample = (document.body.innerText || "").slice(0, 500);
    out.matMentions = [...document.querySelectorAll("*")]
      .filter((el) => el.children.length === 0 && /鐵礦|草藥|獸皮|素材/.test(el.textContent || ""))
      .slice(0, 20)
      .map((el) => ({
        text: (el.textContent || "").trim().slice(0, 40),
        tag: el.tagName,
        cls: el.className,
        h: el.offsetHeight,
        clickable: !!(el.closest("button,.row,.tap,[onclick]"))
      }));

    // 離線
    const st = MG.game.state;
    out.offlineKeys = Object.keys(st).filter((k) => /offline|lastOnline|afk/i.test(k));
    out.lastOnline = st.lastOnline;
    out.hasOfflineModal = !!document.querySelector("[class*=offline],.modal");

    // 頂欄增益
    out.buffLike = [...document.querySelectorAll("[class*=buff],[class*=potion],.chip,.pill")]
      .slice(0, 20)
      .map((el) => ({
        cls: el.className,
        text: (el.textContent || "").trim().slice(0, 40),
        h: el.offsetHeight
      }));

    return out;
  });

  await p.screenshot({ path: "progress/round-31-qol-settings-mobile.png" });
  await p.evaluate(() => {
    const close = [...document.querySelectorAll("button")].find((b) => /關閉|完成/.test(b.textContent || ""));
    if (close) close.click();
    MG.ui.screens.show("more");
  });
  await p.waitForTimeout(400);
  await p.screenshot({ path: "progress/round-31-qol-more-mobile.png" });

  fs.writeFileSync("progress/round-31-qol-probes.json", JSON.stringify({ errs, probes }, null, 2));
  console.log(JSON.stringify({ errs, probes }, null, 2));
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
