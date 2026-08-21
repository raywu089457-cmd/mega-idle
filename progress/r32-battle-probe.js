/* R32 battle-art evidence probe */
"use strict";
const fs = require("fs");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));

  await page.goto("http://127.0.0.1:8123/index.html?v=r32c", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game && MG.game.state);

  const setup = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    const st = MG.game.state;
    st.tutorial = 99;
    document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());
    st.settings.reducedMotion = false;

    // Build a mage with frostnova as active skill via create API
    const mage = MG.sys.hunters.create("mage", 4, false);
    mage.level = 50;
    mage.skills = { frostnova: 8, fireball: 5, chain: 5 };
    mage.activeSkill = "frostnova";
    mage.hp = 9999;
    mage.mp = 9999;
    const sword = MG.sys.hunters.create("sword", 3, false);
    sword.level = 40;
    sword.skills = { combo: 5 };
    sword.activeSkill = "combo";
    sword.hp = 9999;
    sword.mp = 9999;
    st.hunters = [mage, sword];
    st.formation = [mage.id, sword.id];
    st.hunt.region = 0;
    st.hunt.stage = 3;
    st.hunt.autoDispatch = true;
    st.currencies.gold = 999999;
    try { MG.core.save.save(); } catch (_) {}
    MG.ui.screens.show("hunt");
    return {
      mageId: mage.id,
      active: mage.activeSkill,
      skillIcons: Object.fromEntries(
        ["frostnova", "chain", "holy", "holylight", "combo", "poison", "fireball", "frost_arrow"].map((id) => {
          const sk = MG.data.hunters.skills[id];
          return [id, sk ? { name: sk.name, icon: sk.icon, type: sk.type, hits: sk.hits || 1 } : null];
        })
      )
    };
  });
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /派遣|出征|立即/.test(b.textContent || ""));
    if (btn) btn.click();
    else if (MG.sys.battle.start) MG.sys.battle.start();
  });
  await page.waitForTimeout(1000);

  // Poll anim for skill particles; also force-inject frostnova-like skill event path
  const live = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const anim = MG.ui.hunt._getAnimRef();
    const snaps = [];
    for (let i = 0; i < 15; i++) {
      await sleep(250);
      snaps.push({
        t: anim.screenT,
        particles: (anim.particles || []).map((p) => ({ s: p.sprite, life: +p.life.toFixed?.(2) || p.life, x: Math.round(p.x), y: Math.round(p.y) })),
        projectiles: (anim.projectiles || []).map((p) => p.sprite),
        castFx: { ...anim.castFx }
      });
    }
    // Force skill-like ice blob (current path): single particle
    anim.particles.push({
      sprite: "fx_ice", x: 310, y: 205, life: 0.5, maxLife: 0.5, scale: 1.8, gravity: 0, kind: "fx", t: 0
    });
    return { snaps, forcedIce: true, particlePoolFields: anim.particles[0] ? Object.keys(anim.particles[anim.particles.length - 1]) : [] };
  });
  await page.waitForTimeout(100);
  await page.screenshot({ path: "progress/round-32-ice-blob-1x.png" });
  // 4x crop around monster
  await page.screenshot({
    path: "progress/round-32-ice-blob-4x.png",
    clip: { x: 520, y: 200, width: 200, height: 160 }
  });

  // Count ice particles across snaps
  const iceHits = live.snaps.filter((s) => s.particles.some((p) => p.s === "fx_ice")).length;
  const slashHits = live.snaps.filter((s) => s.particles.some((p) => p.s === "fx_slash")).length;
  const sparkHits = live.snaps.filter((s) => s.particles.some((p) => p.s === "fx_spark")).length;

  const report = {
    errs,
    setup,
    iceHits,
    slashHits,
    sparkHits,
    sampleSnaps: live.snaps.slice(0, 5),
    particlePoolFields: live.particlePoolFields,
    backlogRemaining: ["冰霜碎片", "毒雲", "雷鏈", "聖光柱", "斬擊弧"],
    codePath: "hunt.js skill case: spawnParticle(fx,...) once (+ multi k*70 lateral). No shard spray / expanding ring / chain bolts."
  };
  fs.writeFileSync("progress/round-32-evidence-probes.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
