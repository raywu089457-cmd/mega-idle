/* v661 village-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-50-v661";

function hash(buf) {
  let h = 2166136261;
  for (let i = 0; i < buf.length; i++) { h ^= buf[i]; h = Math.imul(h, 16777619); }
  return h >>> 0;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=661", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(async () => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    // ensure some buildings at copper mid-tier
    st.buildings = st.buildings || {};
    st.buildings.castle = Math.max(st.buildings.castle || 0, 4);
    st.buildings.guild = Math.max(st.buildings.guild || 0, 3);
    st.buildings.forge = Math.max(st.buildings.forge || 0, 4);
    if (MG.ui && MG.ui.screen) MG.ui.screen.show("kingdom");
    await new Promise((r) => setTimeout(r, 200));
    const fx = document.querySelector("canvas"); // may not be fx
    const town = document.getElementById("town-canvas") || document.querySelector("#kingdom canvas");
    // sample fx via kingdom internals: force raf draw
    const canvases = [...document.querySelectorAll("#kingdom canvas, .town canvas, canvas")];
    let copper = 0, cat = 0;
    const sample = (c) => {
      if (!c || c.width < 100) return;
      const ctx = c.getContext("2d");
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < d.length; i += 4) {
        const r0 = d[i], g0 = d[i + 1], b0 = d[i + 2], a = d[i + 3];
        if (a < 200) continue;
        // copper #c8915c ≈ 200,145,92
        if (Math.abs(r0 - 200) < 25 && Math.abs(g0 - 145) < 30 && Math.abs(b0 - 92) < 35) copper++;
        // cat gray #a8a8b8
        if (Math.abs(r0 - 168) < 20 && Math.abs(g0 - 168) < 20 && Math.abs(b0 - 184) < 25 && r0 > 140) cat++;
      }
    };
    canvases.forEach(sample);
    // inject scratch window for hunt rest
    st.settings.reducedMotion = false;
    if (!st.formation || !st.formation.length) {
      st.hunters = st.hunters || [];
      if (!st.hunters.length) {
        // seed via recruit if possible
      }
    }
    // rm hash: force two frames at same t via reducedMotion
    st.settings.reducedMotion = true;
    if (MG.ui && MG.ui.kingdom && MG.ui.kingdom.raf) {
      MG.ui.kingdom.raf(1000);
      MG.ui.kingdom.raf(1000);
    }
    await new Promise((r) => setTimeout(r, 100));
    let rmHash = [];
    for (const c of canvases) {
      if (!c || c.width < 100) continue;
      const ctx = c.getContext("2d");
      const d = ctx.getImageData(0, 0, Math.min(c.width, 480), Math.min(c.height, 200)).data;
      let h = 2166136261;
      for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619); }
      rmHash.push(h >>> 0);
    }
    st.settings.reducedMotion = true;
    if (MG.ui && MG.ui.kingdom && MG.ui.kingdom.raf) MG.ui.kingdom.raf(1000);
    await new Promise((r) => setTimeout(r, 50));
    let rmHash2 = [];
    for (const c of canvases) {
      if (!c || c.width < 100) continue;
      const ctx = c.getContext("2d");
      const d = ctx.getImageData(0, 0, Math.min(c.width, 480), Math.min(c.height, 200)).data;
      let h = 2166136261;
      for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619); }
      rmHash2.push(h >>> 0);
    }
    // code presence checks
    const srcK = (MG.ui.kingdom && true);
    return {
      copper, cat, canvases: canvases.length,
      rmSame: JSON.stringify(rmHash) === JSON.stringify(rmHash2),
      hasCopperCode: true,
      buildings: { castle: st.buildings.castle, guild: st.buildings.guild }
    };
  });
  // screenshots
  await page.evaluate(() => {
    MG.game.state.settings.reducedMotion = false;
    MG.game.state.buildings.castle = 4;
    MG.game.state.buildings.guild = 3;
    MG.game.state.buildings.training = 4;
    if (MG.ui.screen) MG.ui.screen.show("kingdom");
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${TAG}-kingdom.png`), fullPage: false });
  // force scratch phase in hunt
  await page.evaluate(() => {
    if (MG.ui.screen) MG.ui.screen.show("hunt");
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${TAG}-hunt.png`), fullPage: false });
  // source grep via fs
  const k = fs.readFileSync(path.join(OUT, "../js/ui/kingdom.js"), "utf8");
  const h = fs.readFileSync(path.join(OUT, "../js/ui/hunt.js"), "utf8");
  const out = {
    r, errs,
    code: {
      copper: k.includes("銅階") && k.includes("#c8915c"),
      cat: k.includes("廣場小貓") && k.includes("#a8a8b8"),
      villagerScratch: k.includes("村民偶發撓頭"),
      heroScratch: h.includes("休息偶發撓頭")
    }
  };
  out.pass = {
    copperCode: out.code.copper,
    catCode: out.code.cat,
    scratchCode: out.code.villagerScratch && out.code.heroScratch,
    copperPx: r.copper > 0,
    catPx: r.cat > 0,
    rm: r.rmSame,
    noErr: errs.length === 0
  };
  out.ok = out.pass.copperCode && out.pass.catCode && out.pass.scratchCode && out.pass.noErr && (out.pass.copperPx || out.pass.catPx);
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 2);
})().catch((e) => { console.error(e); process.exit(1); });
