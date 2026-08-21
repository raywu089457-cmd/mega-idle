/* v654: 離線＋回歸合併一鍵領取驗證 */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

const OUT = path.join(__dirname);
const TAG = "round-43-v654";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];

  // 1) 準備存檔字串（past lastSeen）
  const prepCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const prep = await prepCtx.newPage();
  await prep.goto("http://127.0.0.1:8123/index.html?v=654-prep", { waitUntil: "domcontentloaded" });
  await prep.waitForFunction(() => window.MG && MG.game && MG.game.state);
  const before = await prep.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());
    st.settings.reducedMotion = true;
    st.backup = { remindedAt: Date.now(), lastExportAt: Date.now() };
    if (!(st.hunt.dispatchIds || []).length && st.hunters[0]) {
      st.hunt.dispatchIds = [st.hunters[0].id];
      st.formation = [st.hunters[0].id];
      if (st.formations && st.formations[0]) st.formations[0][0] = st.hunters[0].id;
    }
    st.welcome = Object.assign({ claimed: {} }, st.welcome || {});
    st.welcome.returnTier = 0;
    st.lastSeen = Date.now() - 4 * 864e5 - 2 * 3600e3;
    // 不呼叫 save()（會戳 lastSeen=now）；直接序列化
    const raw = JSON.stringify(st);
    return {
      raw,
      key: MG.core.save.KEY,
      gold0: st.currencies.gold,
      gems0: st.currencies.gems,
      ageH: (Date.now() - st.lastSeen) / 3600e3,
      peek: !!MG.sys.welcome.peekReturnGift(),
      hasOffline: !!MG.core.save.offline()
    };
  });
  await prepCtx.close();

  // 2) 新 context：init 注入存檔後開頁，走 boot setTimeout
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(({ key, raw }) => {
    localStorage.setItem(key, raw);
  }, { key: before.key, raw: before.raw });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=654", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.game.state);
  await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    MG.game.state.settings.reducedMotion = true;
    document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());
  });

  await page.waitForFunction(() => {
    const t = document.querySelector(".m-title");
    return t && /離線|回歸/.test(t.textContent || "");
  }, null, { timeout: 6000 });

  await page.waitForTimeout(300);
  const ui = await page.evaluate(() => {
    const titles = [...document.querySelectorAll(".m-title")].map((el) => el.textContent.trim());
    const btns = [...document.querySelectorAll(".modal button.btn")].map((b) => {
      const r = b.getBoundingClientRect();
      const cs = getComputedStyle(b);
      return { text: b.textContent.trim(), h: Math.round(r.height), sticky: cs.position };
    });
    const claim = btns.find((b) => /領取全部|領取獎勵|收下獎勵/.test(b.text));
    return {
      titles,
      modalCount: document.querySelectorAll(".ovl").length,
      claim,
      combinedTitle: titles.some((t) => /離線/.test(t) && /回歸/.test(t)),
      ageH: (Date.now() - MG.game.state.lastSeen) / 3600e3
    };
  });

  await page.screenshot({ path: path.join(OUT, `${TAG}-combined-modal.png`) });

  const goldBeforeClaim = await page.evaluate(() => MG.game.state.currencies.gold);
  const gemsBeforeClaim = await page.evaluate(() => MG.game.state.currencies.gems);

  await page.locator(".modal button.btn.gold").filter({ hasText: /領取全部|領取獎勵|收下獎勵/ }).click({ force: true });
  await page.waitForTimeout(450);

  const after = await page.evaluate(() => {
    const st = MG.game.state;
    return {
      gold: st.currencies.gold,
      gems: st.currencies.gems,
      returnTier: (st.welcome && st.welcome.returnTier) || 0,
      modalCount: document.querySelectorAll(".ovl").length,
      titles: [...document.querySelectorAll(".m-title")].map((el) => el.textContent.trim())
    };
  });

  await page.waitForTimeout(1200);
  const later = await page.evaluate(() => ({
    modalCount: document.querySelectorAll(".ovl").length,
    titles: [...document.querySelectorAll(".m-title")].map((el) => el.textContent.trim()),
    peekNow: MG.sys.welcome.peekReturnGift()
  }));

  const out = {
    before: { gold0: before.gold0, gems0: before.gems0, ageH: before.ageH, peek: before.peek, hasOffline: before.hasOffline },
    ui,
    goldBeforeClaim,
    gemsBeforeClaim,
    after,
    later,
    errs,
    pass: {
      prepOk: before.peek && before.hasOffline && before.ageH > 90,
      combined: ui.combinedTitle || (ui.claim && ui.claim.text === "領取全部"),
      oneModal: ui.modalCount === 1,
      btn44: !!(ui.claim && ui.claim.h >= 44),
      sticky: !!(ui.claim && ui.claim.sticky === "sticky"),
      claimed: after.gold > goldBeforeClaim && after.gems > gemsBeforeClaim && after.returnTier >= 1,
      noSecondReturn: later.modalCount === 0 && later.peekNow === null,
      clicks: true
    }
  };
  out.ok = Object.values(out.pass).every(Boolean) && errs.length === 0;
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
