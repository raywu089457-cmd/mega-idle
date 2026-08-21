/* v662 QoL ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-51-v662";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=662", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    // 1 toast dismiss
    MG.ui.dom.toast("測試提示可點關", "good", "icon_coin");
    await new Promise((r) => setTimeout(r, 50));
    const toast = document.querySelector("#toasts .toast");
    const toastBefore = !!toast;
    if (toast) toast.click();
    await new Promise((r) => setTimeout(r, 30));
    const toastAfter = !!document.querySelector("#toasts .toast");
    // 2 m-x size
    const m = MG.ui.dom.modal("測關閉", MG.ui.dom.h("div", null, "內容"));
    await new Promise((r) => setTimeout(r, 30));
    const mx = document.querySelector(".m-x");
    const mxRect = mx ? mx.getBoundingClientRect() : null;
    m.close();
    // 3 confirm Esc cancel
    let yes = false;
    MG.ui.dom.confirm("測Esc", "按 Esc 應取消", () => { yes = true; });
    await new Promise((r) => setTimeout(r, 30));
    const confirmOpen = !!document.querySelector(".ovl .modal");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await new Promise((r) => setTimeout(r, 30));
    const confirmClosed = !document.querySelector(".ovl .modal");
    // lock offline-style still blocks esc
    const lockM = MG.ui.dom.modal("鎖定", MG.ui.dom.h("div", null, "lock"), { lock: true, noClose: true });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
    const lockStill = !!document.querySelector(".ovl .modal");
    lockM.close();
    return {
      toastBefore, toastAfter, toastDismiss: toastBefore && !toastAfter,
      mxW: mxRect ? Math.round(mxRect.width) : 0,
      mxH: mxRect ? Math.round(mxRect.height) : 0,
      confirmOpen, confirmClosed, yesFired: yes,
      lockStill
    };
  });
  const out = {
    r, errs,
    pass: {
      toast: r.toastDismiss,
      mx44: r.mxW >= 44 && r.mxH >= 44,
      escCancel: r.confirmOpen && r.confirmClosed && r.yesFired === false,
      lockSafe: r.lockStill === true,
      noErr: errs.length === 0
    }
  };
  out.ok = Object.values(out.pass).every(Boolean);
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 2);
})().catch((e) => { console.error(e); process.exit(1); });
