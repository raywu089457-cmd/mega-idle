/* v851：英雄頁工具列不再永久蓋住名冊 */
"use strict";
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 700 } });
  await page.goto("http://127.0.0.1:8130/index.html?v=851", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.hunters, { timeout: 20000 });
  await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => /略過|跳過/.test(b.textContent || ""));
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut,.ovl").forEach((el) => el.remove());
    st.kingdom.level = 3;
    st.hunters = Array.from({ length: 12 }, (_, i) =>
      MG.sys.hunters.create(["sword", "archer", "mage", "assassin", "knight", "priest"][i % 6], 2));
    MG.ui.screens.show("hunters");
  });
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const sticky = Array.from(document.querySelectorAll(".screen > div")).find((el) => getComputedStyle(el).position === "sticky");
    const cards = Array.from(document.querySelectorAll("[data-cid]"));
    const fixedFab = Array.from(document.querySelectorAll(".screen div, body > div")).filter((el) => {
      const s = getComputedStyle(el);
      return s.position === "fixed" && /招募|合成/.test(el.textContent || "");
    });
    const toolRecruit = [...document.querySelectorAll("button")].filter((b) => (b.textContent || "").trim() === "招募");
    const toolSynth = [...document.querySelectorAll("button")].filter((b) => (b.textContent || "").trim() === "合成");
    const vh = window.innerHeight;
    const navTop = (document.getElementById("tabbar") || {}).getBoundingClientRect?.()?.top ?? vh;
    const covered = cards.filter((c) => {
      const r = c.getBoundingClientRect();
      return r.top < navTop && r.bottom > 80 && (r.bottom > navTop - 4); // overlapping tabbar only counts if no other overlay
    });
    const fullyVisible = cards.filter((c) => {
      const r = c.getBoundingClientRect();
      return r.top >= 60 && r.bottom <= navTop - 4;
    });
    const emptyReso = Array.from(document.querySelectorAll(".empty")).some((el) => /共鳴祭壇尚未解鎖/.test(el.textContent || ""));
    return {
      stickyH: sticky ? Math.round(sticky.getBoundingClientRect().height) : -1,
      cardCount: cards.length,
      fixedFab: fixedFab.length,
      toolRecruit: toolRecruit.length,
      toolSynth: toolSynth.length,
      fullyVisible: fullyVisible.length,
      emptyReso,
      firstTop: cards[0] ? Math.round(cards[0].getBoundingClientRect().top) : null,
      secondRowClear: (() => {
        const row2 = cards.slice(3, 6);
        if (!row2.length) return true;
        return row2.every((c) => {
          const r = c.getBoundingClientRect();
          return r.bottom <= navTop - 4 && r.top >= 60;
        });
      })()
    };
  });
  await page.screenshot({ path: "progress/r851-hunters-layout.png", fullPage: false });
  console.log(JSON.stringify(m, null, 2));
  const ok = m.stickyH > 0 && m.stickyH < 180 && m.cardCount >= 9 && m.fixedFab === 0
    && m.toolRecruit >= 1 && m.toolSynth >= 1 && m.fullyVisible >= 6 && !m.emptyReso && m.secondRowClear;
  console.log(ok ? "PASS" : "FAIL");
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
