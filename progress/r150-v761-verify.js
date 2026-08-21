/* v761 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-150-v761";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=761", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.ui.kingdom);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    document.querySelectorAll(".tut").forEach((el) => el.remove());
    st.buildings = st.buildings || {};
    ["castle", "forge", "guild", "market", "alchemy", "library", "warehouse", "altar", "training", "gemworks"].forEach((k) => {
      st.buildings[k] = Math.max(1, st.buildings[k] || 0);
    });

    const nav = [...document.querySelectorAll("button, .tab")].find((b) => /王國/.test(b.textContent || ""));
    if (nav) nav.click();
    await new Promise((r) => setTimeout(r, 200));

    function townCanvas() {
      const canvases = [...document.querySelectorAll("canvas")];
      const fx = canvases.find((c) => c.width === 480 && c.height === 200 && /absolute/.test(c.style.cssText || c.getAttribute("style") || ""));
      if (fx) return fx;
      let best = null, area = 0;
      for (const c of canvases) {
        const a = c.width * c.height;
        if (a > area && c.width >= 400 && c.height >= 180 && c.height <= 320) { area = a; best = c; }
      }
      return best;
    }
    function countColor(x0, y0, x1, y1, pred) {
      const best = townCanvas();
      if (!best) return 0;
      const d = best.getContext("2d").getImageData(x0, y0, x1 - x0, y1 - y0).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 20) continue;
        if (pred(d[i], d[i + 1], d[i + 2])) n++;
      }
      return n;
    }
    function hashRoi(x0, y0, x1, y1) {
      const best = townCanvas();
      if (!best) return "";
      const d = best.getContext("2d").getImageData(x0, y0, x1 - x0, y1 - y0).data;
      let h = 0;
      for (let i = 0; i < d.length; i++) h = (h * 31 + d[i]) >>> 0;
      return h.toString(16);
    }

    if (MG.ui.kingdom.setPeriodOverride) MG.ui.kingdom.setPeriodOverride("day");
    for (let i = 0; i < 10; i++) if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(performance.now() + i * 280);
    await new Promise((r) => setTimeout(r, 150));
    // 蠟燭暖橙／金
    const candle = countColor(182, 138, 196, 154, (r, g, b) =>
      r > 180 && g > 100 && g < 230 && b < 120);
    // 煤堆灰＋餘燼橙
    const coal = countColor(282, 98, 298, 112, (r, g, b) =>
      (r < 100 && g < 100 && b < 120 && Math.abs(r - g) < 30) || (r > 180 && g > 60 && g < 180 && b < 100));
    // 草靶米＋紅心
    const target = countColor(244, 94, 260, 112, (r, g, b) =>
      (r > 180 && g > 160 && b < 200 && g >= b) || (r > 180 && g < 120 && b < 120));

    st.settings.reducedMotion = true;
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(6000);
    const h1a = hashRoi(182, 138, 196, 154);
    const h1b = hashRoi(282, 98, 298, 112);
    const h1c = hashRoi(244, 94, 260, 112);
    if (MG.ui.kingdom.raf) MG.ui.kingdom.raf(6000);
    const h2a = hashRoi(182, 138, 196, 154);
    const h2b = hashRoi(282, 98, 298, 112);
    const h2c = hashRoi(244, 94, 260, 112);

    return {
      candle, coal, target,
      rmSame: h1a === h2a && h1b === h2b && h1c === h2c,
      h1a, h2a, h1b, h2b, h1c, h2c
    };
  });

  await page.screenshot({ path: path.join(OUT, TAG + "-town.png"), fullPage: false });
  const k = fs.readFileSync(path.join(__dirname, "../js/ui/kingdom.js"), "utf8");
  const asserts = [];
  const assert = (name, ok) => asserts.push({ name, ok: !!ok });
  assert("srcCandle", k.includes("v761 圖書館蠟燭"));
  assert("srcCoal", k.includes("v761 鐵匠煤堆"));
  assert("srcTarget", k.includes("v761 訓練場靶"));
  assert("candleROI", r.candle >= 4);
  assert("coalROI", r.coal >= 6);
  assert("targetROI", r.target >= 8);
  assert("rmSame", r.rmSame);
  assert("noErr", errs.length === 0);

  const pass = asserts.filter((a) => a.ok).length;
  const fail = asserts.filter((a) => !a.ok);
  const table = [
    "=== 村莊美術驗證 ===",
    "candle=" + r.candle + " coal=" + r.coal + " target=" + r.target + " rmSame=" + r.rmSame,
    "硬斷言:" + pass + "/" + asserts.length + " " + (fail.length ? "FAIL " + fail.map((f) => f.name).join(",") : "PASS")
  ].join("\n");

  const out = { ok: fail.length === 0 && !errs.length, r, asserts, fail, errs, table };
  fs.writeFileSync(path.join(OUT, TAG + "-verify.json"), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, TAG + "-sim.txt"), table);
  console.log(table);
  console.log(JSON.stringify({ ok: out.ok, pass, total: asserts.length, errs, fail, r }, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
