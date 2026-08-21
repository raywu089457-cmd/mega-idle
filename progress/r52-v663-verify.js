/* v663 battle-art ×3 verify */
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");
const OUT = path.join(__dirname);
const TAG = "round-52-v663";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  await page.goto("http://127.0.0.1:8123/index.html?v=663", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);
  const r = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    st.settings = st.settings || {};
    st.settings.reducedMotion = false;
    if (MG.ui.screen) MG.ui.screen.show("hunt");
    // force spawn via private hooks if present, else inject into anim via event path
    const anim = MG.ui.hunt && MG.ui.hunt._getAnim ? null : null;
    // Use skill event simulation by directly calling particle spawners if exported — fallback: inject particles on view
    // Probe: push synthetic particles through battle event replay
    let counts = { ring: 0, healburst: 0, fireburst: 0, ringRm: 0 };
    // Access screen anim by triggering heal/skill via evaluate on hunt module internals
    // Inject into anim.particles by monkeypatching through a fight start + manual push on canvas raf state
    const H = MG.ui.hunt;
    // Create particles by dispatching fake events if onEvent exists
    if (H && H._testSpawn) {
      // no-op
    }
    // Direct: find anim via screen
    const scr = MG.ui.screens && MG.ui.screens.current;
    // Fallback approach: temporarily expose by calling heal float path — push via render view
    // We'll mutate by re-entering through processEvent if available
    return { needInject: true };
  });
  // stronger: read source + inject via page Function on hunt's closed anim — use CDP-less approach:
  // open hunt, start battle, wait, OR inject particles into drawBattle view by patching getView
  const r2 = await page.evaluate(() => {
    const st = MG.game.state;
    st.settings.reducedMotion = false;
    // Seed hunters + start fight
    if (!st.hunters || st.hunters.length < 1) {
      // use debug cheat if any
      if (MG.sys && MG.sys.dev) { /* skip */ }
    }
    // Manually build a fake view and draw to offscreen to verify render paths
    const c = document.createElement("canvas");
    c.width = 480; c.height = 270;
    const ctx = c.getContext("2d");
    const particles = [
      { kind: "ring", cx: 80, cy: 200, r: 16, life: 0.3, maxLife: 0.3, color: "#7ec8ff", color2: "#e8f4ff" },
      { kind: "healburst", cx: 120, cy: 180, life: 0.3, maxLife: 0.3, color: "#7ee787", color2: "#ffffff" },
      { kind: "fireburst", cx: 310, cy: 205, r0: 6, r1: 26, life: 0.25, maxLife: 0.3, color: "#ff7a2a", color2: "#ffd166" }
    ];
    const view = { t: 1, team: [], monsters: [], floats: [], particles, projectiles: [], pal: { sky1: "#5ec8e5", sky2: "#2a6f9c", ground: "#4c8a3f", accent: "#ffe08a" } };
    function sampleROI(data, x0, y0, x1, y1, pred) {
      let n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * 480 + x) * 4;
        if (data[i + 3] < 180) continue;
        if (pred(data[i], data[i + 1], data[i + 2])) n++;
      }
      return n;
    }
    MG.ui.render.drawBattle(ctx, view);
    const d = ctx.getImageData(0, 0, 480, 270).data;
    // ROI around each FX (avoid sky false positives)
    const blue = sampleROI(d, 55, 185, 110, 230, (r, g, b) => b > 200 && r > 100 && r < 180 && g > 160);
    const green = sampleROI(d, 100, 160, 145, 200, (r, g, b) => g > 180 && r < 160 && b < 160);
    const orange = sampleROI(d, 280, 175, 340, 235, (r, g, b) => r > 200 && g > 80 && g < 200 && b < 120);
    // rm: particles skipped
    st.settings.reducedMotion = true;
    const c2 = document.createElement("canvas");
    c2.width = 480; c2.height = 270;
    const ctx2 = c2.getContext("2d");
    MG.ui.render.drawBattle(ctx2, view);
    const d2 = ctx2.getImageData(0, 0, 480, 270).data;
    const blue2 = sampleROI(d2, 55, 185, 110, 230, (r, g, b) => b > 200 && r > 100 && r < 180 && g > 160);
    const green2 = sampleROI(d2, 100, 160, 145, 200, (r, g, b) => g > 180 && r < 160 && b < 160);
    const orange2 = sampleROI(d2, 280, 175, 340, 235, (r, g, b) => r > 200 && g > 80 && g < 200 && b < 120);
    st.settings.reducedMotion = false;
    return { blue, green, orange, blue2, green2, orange2 };
  });
  // source file checks
  const hunt = fs.readFileSync(path.join(OUT, "../js/ui/hunt.js"), "utf8");
  const rend = fs.readFileSync(path.join(OUT, "../js/ui/render.js"), "utf8");
  const out = {
    r2, errs,
    code: {
      shield: hunt.includes("spawnShieldRing") && hunt.includes('kind: "ring"'),
      heal: hunt.includes("spawnHealBurst") && hunt.includes("spawnHealBurst(hx, hy)"),
      fire: hunt.includes("spawnFireBurst") && hunt.includes("spawnFireBurst(310, 205)"),
      draw: rend.includes('p.kind === "ring"') && rend.includes('p.kind === "healburst"') && rend.includes('p.kind === "fireburst"')
    }
  };
  out.pass = {
    code: out.code.shield && out.code.heal && out.code.fire && out.code.draw,
    pxRing: r2.blue > 8,
    pxHeal: r2.green > 5,
    pxFire: r2.orange > 8,
    rmSkip: r2.blue2 === 0 && r2.green2 === 0 && r2.orange2 === 0,
    noErr: errs.length === 0
  };
  out.ok = Object.values(out.pass).every(Boolean);
  fs.writeFileSync(path.join(OUT, `${TAG}-verify.json`), JSON.stringify(out, null, 2));
  // screenshot composite
  await page.evaluate(() => {
    MG.game.state.settings.reducedMotion = false;
    if (MG.ui.screen) MG.ui.screen.show("hunt");
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, `${TAG}-hunt.png`) });
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  process.exit(out.ok ? 0 : 2);
})().catch((e) => { console.error(e); process.exit(1); });
