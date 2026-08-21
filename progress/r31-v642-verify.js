"use strict";
const fs = require("fs");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

async function run(browser, vp, name) {
  const errs = [];
  const ctx = await browser.newContext(vp);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(name + ":" + e.message));
  await p.goto("http://127.0.0.1:8123/index.html?v=642", { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => window.MG && MG.game && MG.game.state);
  await p.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());
    MG.ui.screens.show("more");
  });
  await p.waitForTimeout(500);

  const probe = await p.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const hit = [...document.querySelectorAll("*")].find(
      (node) => node.children.length <= 3 && (node.textContent || "").trim() === "重播教學"
    );
    let tileEl = hit;
    while (tileEl && tileEl.parentElement && tileEl.offsetHeight < 40) tileEl = tileEl.parentElement;
    const info = hit
      ? { text: hit.textContent.trim(), h: tileEl.offsetHeight, w: tileEl.offsetWidth, cls: tileEl.className }
      : null;
    if (tileEl) {
      tileEl.click();
      await sleep(450);
    }
    const tut = document.querySelector(".tut, .tut-card");
    return {
      info,
      tutVisible: !!(tut && tut.offsetParent !== null),
      tutText: tut ? (tut.textContent || "").slice(0, 100) : null,
      clicksFromMore: 1
    };
  });
  await p.screenshot({ path: "progress/round-31-v642-more-" + name + ".png" });
  if (probe.tutVisible) await p.screenshot({ path: "progress/round-31-v642-tut-" + name + ".png" });

  await p.evaluate(() => {
    document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());
    MG.game.state.tutorial = 99;
    MG.ui.screens.show("more");
  });
  await p.waitForTimeout(300);
  await p.evaluate(() => {
    const set = [...document.querySelectorAll("*")].find(
      (node) => (node.textContent || "").trim() === "設定" && node.children.length <= 2
    );
    if (!set) return;
    let t = set;
    while (t.parentElement && t.offsetHeight < 40) t = t.parentElement;
    t.click();
  });
  await p.waitForTimeout(400);
  const setOk = await p.evaluate(() =>
    [...document.querySelectorAll(".modal .row, .modal .row.tap")].some((row) =>
      /重播教學/.test(row.textContent || "")
    )
  );
  await ctx.close();
  return { name, probe, setOk, errs };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const mobile = await run(
    browser,
    { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    "mobile"
  );
  const desktop = await run(browser, { viewport: { width: 1280, height: 800 } }, "desktop");
  const out = { mobile, desktop };
  fs.writeFileSync("progress/round-31-v642-verify.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  if (!mobile.probe.tutVisible || !desktop.probe.tutVisible || !mobile.setOk || !desktop.setOk) process.exit(2);
  if (mobile.errs.length || desktop.errs.length) process.exit(2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
