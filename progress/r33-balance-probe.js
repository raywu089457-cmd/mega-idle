/* R33 balance evidence: enhance +10..+15 hours vs income; promo; skill books */
"use strict";
const fs = require("fs");
const { chromium } = require("C:/Users/ray/AppData/Roaming/npm/node_modules/playwright");

const enhanceCost = (tier, enhance) => Math.floor(Math.pow(1.5, enhance) * 40 * Math.pow(tier, 1.6));
function sumEnh(tier, from, to) {
  let s = 0;
  for (let e = from; e < to; e++) s += enhanceCost(tier, e);
  return s;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  await page.goto("http://127.0.0.1:8123/index.html?v=r33", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.MG && MG.game);

  const report = await page.evaluate(() => {
    const skip = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "略過");
    if (skip) skip.click();
    MG.game.state.tutorial = 99;
    document.querySelectorAll(".tut,.tut-card").forEach((el) => el.remove());

    function makeTeam(regionIdx, level) {
      const st = MG.game.state;
      const team = [];
      for (const cls of ["sword", "archer", "mage", "assassin", "knight"]) {
        const h = MG.sys.hunters.create(cls, 4, false);
        h.level = level;
        h.hp = 99999;
        h.mp = 99999;
        // equip mid tier gear at enhance 10
        const slots = MG.config.SLOTS || ["weapon", "helm", "armor", "boots", "gloves", "ring", "amulet"];
        h.equip = {};
        for (const sl of slots) {
          const it = MG.sys.equipment.gen({ tier: Math.min(10, regionIdx + 2), cls });
          it.enhance = 10;
          it.rarity = 4;
          h.equip[sl] = it.uid;
          st.inventory = st.inventory || [];
          // inventory may be object - check
        }
        team.push(h);
      }
      st.hunters = team;
      st.formation = team.map((h) => h.id);
      st.hunt.region = regionIdx;
      st.hunt.stage = 5;
      st.hunt.autoDispatch = true;
      st.buildings.forge = 10; // mid forge discount
      // put items in inventory properly
      st.inventory = [];
      for (const h of team) {
        for (const sl of Object.keys(h.equip || {})) {
          /* rebuilt below */
        }
      }
      return team;
    }

    // Simpler: just measure rates() at various regions with dispatched mid team
    const ratesAt = [];
    for (const [ri, lv] of [
      [2, 30],
      [4, 50],
      [6, 80],
      [8, 120],
      [9, 150]
    ]) {
      const st = MG.game.state;
      st.hunters = [];
      st.formation = [];
      const ids = [];
      for (const cls of ["sword", "archer", "mage", "assassin", "knight"]) {
        const h = MG.sys.hunters.create(cls, 4, false);
        h.level = lv;
        h.hp = 99999;
        h.mp = 99999;
        st.hunters.push(h);
        ids.push(h.id);
      }
      st.formation = ids;
      st.hunt.region = ri;
      st.hunt.stage = 8;
      st.hunt.difficulty = 0;
      // force battle rates as if dispatched
      try {
        MG.sys.battle.dispatch && MG.sys.battle.dispatch();
      } catch (_) {}
      const rates = MG.sys.battle.rates({ noFocus: true });
      const ratesFocus = MG.sys.battle.rates({});
      ratesAt.push({
        region: ri,
        regionName: (MG.data.monsters.REGIONS || MG.data.regions || [])[ri]?.name || ri,
        level: lv,
        goldPerSec: rates.gold,
        goldPerHour: rates.gold * 3600,
        goldPerHourFocus: ratesFocus.gold * 3600,
        expPerHour: rates.exp * 3600
      });
      try {
        MG.sys.battle.reset && MG.sys.battle.reset();
      } catch (_) {}
    }

    // promo costs
    const promo = [];
    for (let p = 0; p < 6; p++) {
      const c = MG.data.hunters.promoCost({ promoted: p });
      promo.push({ promoted: p, next: p + 1, gold: c.gold, mats: c.mats });
    }

    // skill book total Lv1→10 one skill
    let books = 0;
    for (let lvl = 1; lvl < 10; lvl++) books += lvl * (lvl < 5 ? 2 : 3);

    // forge mul
    const forgeMul = (lv) => Math.max(0.1, 1 - 0.04 * lv);

    return { ratesAt, promo, booksToMaxOneSkill: books, forgeMul10: forgeMul(10), forgeMul20: forgeMul(20) };
  });

  // attach enhance tables
  const enhance = [3, 5, 7, 9].map((t) => ({
    tier: t,
    e10_15_one: sumEnh(t, 10, 15),
    e10_15_hero7: sumEnh(t, 10, 15) * 7,
    e10_15_team5: sumEnh(t, 10, 15) * 7 * 5,
    e10_15_team5_forge10: Math.floor(sumEnh(t, 10, 15) * 7 * 5 * 0.6)
  }));

  // hours to afford
  const hours = report.ratesAt.map((r) => {
    const row = { region: r.region, gph: Math.round(r.goldPerHour) };
    for (const e of enhance) {
      row["t" + e.tier + "_team_h"] = r.goldPerHour > 0 ? +(e.e10_15_team5_forge10 / r.goldPerHour).toFixed(2) : null;
      row["t" + e.tier + "_one_h"] = r.goldPerHour > 0 ? +(e.e10_15_one / r.goldPerHour).toFixed(2) : null;
    }
    return row;
  });

  const out = { report, enhance, hours };
  fs.writeFileSync("progress/round-33-balance-probes.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
