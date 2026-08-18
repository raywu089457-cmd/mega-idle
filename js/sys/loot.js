/* 放置王國 MEGA IDLE — loot: stage monsters, kill rewards, drop tables */
"use strict";
MG.sys = MG.sys || {};
MG.sys.loot = (function () {
  const U = MG.util;
  // v241 滿包強拆計數器（module 級 — 跨掉落累計；★5+ 指名 toast 另發）
  let lostCount = 0, lostFlashAt = 0;
  const S = () => MG.game.state;
  const REGIONS = () => MG.data.monsters.regions;

  function region(i) { return REGIONS()[U.clamp(i, 0, REGIONS().length - 1)]; }
  function monsterForStage(regionIdx, stage) {
    const r = region(regionIdx);
    if (stage % MG.config.MAX_STAGE_PER_REGION === 0) return { def: r.boss, boss: true };
    const list = r.monsters;
    return { def: list[(stage - 1) % list.length], boss: false };
  }
  /* v246 圖鑑深鏈：魔物 → 首現關卡（與 monsterForStage 同源 modulo — BOSS 在第 10 關） */
  function stageOfMonster(regionIdx, monsterId) {
    const r = region(regionIdx);
    if (!r || r.abyss) return null;
    if (r.boss && r.boss.id === monsterId) return MG.config.MAX_STAGE_PER_REGION;
    const i = (r.monsters || []).findIndex(m => m.id === monsterId);
    return i < 0 ? null : i + 1;
  }
  /* v256 圖鑑掉落一覽：與 lootInfoBlock/scaledMonster 同源（機率永不漂移 — 農材料決策前置資訊） */
  function potionRateOf(regionIdx, boss) { // v256FIX：藥水公式單一來源（lootInfoBlock/dropInfoOf 共用）
    return boss ? Math.min(1, 0.6 + regionIdx * 0.04) : Math.min(0.2, 0.06 + regionIdx * 0.015);
  }
  /* v583 掉落 parity：每殺掉落機率 ×難度倍率 — 與 v204 金/經 parity 對稱
     （rates() 的 killT=max(0.4×dMult, hp/dps) 使「金/擊殺 ÷擊殺時間」自我對消 → 金/秒 parity；
       掉落機率不除時間 → 掉落/時 ÷dMult。機率 ×dMult 後每小時掉落即精確 parity；深淵無難度 → 1） */
  function diffDropMul() {
    const st = S();
    const d = (MG.config.DIFFICULTY[(st.hunt && st.hunt.difficulty) || 0]) || MG.config.DIFFICULTY[0];
    return d.mult || 1;
  }
  function dropInfoOf(regionIdx, stage) {
    const r = region(regionIdx);
    if (!r || r.abyss) return null;
    const m = scaledMonster(regionIdx, stage);
    // v583 掉落 parity：與 rollKill 同 dMul（顯示 = 實戰同源，不漂移；近 1 顯示仍 clamp 0.95）
    const dMul = diffDropMul();
    const cap = (x) => (x == null ? null : Math.min(0.95, x * dMul));
    const pot = potionRateOf(regionIdx, m.boss);
    return {
      boss: m.boss, elite: m.elite,
      drops: (m.drops || []).map(d => ({ m: d.m, name: (MG.config.MATS[d.m] || {}).name || d.m, c: Math.min(0.95, d.c * dMul) })), // v583 修正輪：素材行 ×dMul 同源（與 rollKill 素材迴圈、圖鑑同 clamp — 精英 ×3/tMul/devB 不顯示，維持「非精英基礎值 ×dMul」口徑）
      potRate: cap(pot), eqRate: m.boss ? 1 : cap(MG.config.DROP_RATES.eq),
      gemRate: cap(MG.config.DROP_RATES.gem), bookRate: cap(MG.config.DROP_RATES.book),
      bossTicket: cap(MG.config.DROP_RATES.bossTicket), bossBook: cap(MG.config.DROP_RATES.bossBook)
    };
  }
  function scaledMonster(regionIdx, stage, opts) {
    const st = S();
    // v160 無盡深淵：程序化生成（深度曲線，無難度倍率）
    const REGIONS = () => MG.data.monsters.regions;
    if (REGIONS()[regionIdx] && REGIONS()[regionIdx].abyss) {
      const boss = stage % MG.config.MAX_STAGE_PER_REGION === 0;
      const spr = ["m_imp", "m_voidwalker", "m_hellhound", "m_wraith", "m_angel"][(stage - 1) % 5];
      return {
        id: "abyss_" + stage, name: boss ? "深淵領主 Lv" + stage : "深淵魔物 Lv" + stage,
        sprite: boss ? "m_voidwalker" : spr, boss, elite: false, tier: 10,
        hp: Math.round((6000 + stage * 2500) * (boss ? 3 : 1)),
        atk: Math.round((80 + stage * 32) * (boss ? 1.8 : 1)),
        def: Math.round((12 + stage * 7) * (boss ? 1.8 : 1)),
        gold: Math.round((300 + stage * 120) * (boss ? 2 : 1)),
        exp: Math.round((350 + stage * 110) * (boss ? 2 : 1)),
        rarity: boss ? 6 : 1, dropMul: 1, scaleMul: 1, difficulty: "abyss",
        element: "dark",
        // v209：深淵素材掉率隨深度緩增（100+ 層無里程碑後仍有漸進獎勵感；封頂防溢出）
        drops: [{ m: "void", c: Math.min(0.5, 0.25 + stage * 0.0004) }, { m: "myth", c: Math.min(0.35, 0.15 + stage * 0.0003) }],
        flavor: boss ? "鎮守第 " + stage + " 層的深淵領主。" : "深淵第 " + stage + " 層的魔物。"
      };
    }
    const { def, boss } = monsterForStage(regionIdx, stage);
    // v116 稀有度：普通怪（★1）為主、小關內 22% 出精英（★4-5）、BOSS（★6）
    const elite = !boss && !!(opts && opts.elite);
    const m = (stage - 1) * 0.16 + (boss ? 0 : 0);
    const bossMul = boss ? (regionIdx <= 1 ? 2.4 : regionIdx <= 3 ? 3 : 4) : 1;
    const mul = boss ? (1 + (stage - 1) * 0.16) * bossMul : 1 + m;
    const s = boss ? mul / bossMul : mul;
    // 副本難度倍率（普通=1）
    const d = (MG.config.DIFFICULTY[(st.hunt && st.hunt.difficulty) || 0]) || MG.config.DIFFICULTY[0];
    const eMul = elite ? 2.6 : 1;
    return {
      ...def, boss, elite,
      name: elite ? "精英" + def.name : def.name,
      rarity: boss ? 6 : (elite ? 4 + Math.floor(Math.random() * 2) : 1),
      hp: Math.round(def.hp * mul * d.mult * eMul * (MG.sys.dev ? MG.sys.dev.balance().monsterHp : 1)), // vXXX 開發者：魔物血量
      atk: Math.round(def.atk * mul * d.mult * (elite ? 1.7 : 1) * (MG.sys.dev ? MG.sys.dev.balance().monsterAtk : 1)), // vXXX 開發者：魔物攻擊
      // v204 平衡：防禦不乘難度倍率（高難度 = 血厚攻高；原式使防禦減傷雙重放大 → 高難度每小時收益 <1 的自我懲罰）
      def: Math.round(def.def * mul * (elite ? 1.6 : 1)),
      gold: Math.round(def.gold * mul * d.gold * (elite ? 6 : 1)),
      exp: Math.round(def.exp * mul * d.exp * (elite ? 5 : 1)),
      dropMul: elite ? 4 : 1,
      scaleMul: s,
      difficulty: d.id
    };
  }
  function rollKill(regionIdx, stage, m, treasureMul) {
    const st = S();
    const r = region(regionIdx);
    const eff = MG.sys.buildings.effects();
    // v161 尋寶詞綴：素材掉落機率加成（applyDrops 傳入編隊總和）
    const tMul = 1 + (treasureMul || 0);
    // v583 掉落 parity：難度倍率（深淵無難度 → 1；abyss.enter() 已強制難度 0，此守衛防任何難度洩漏）— 與 v204 金/經 parity 對稱（見 diffDropMul 註）
    const dMul = (m && m.difficulty === "abyss") ? 1 : diffDropMul();
    const out = { gold: 0, exp: 0, mats: [], items: [], gems: [], books: 0, tickets: 0, honor: 0 };
    // gold
    let g = m.gold;
    g *= eff.goldMul;
    if (Date.now() - (st.created || Date.now()) < 600e3) g *= 1.5; // 新手黃金時段
    if (st.buffs.potGold > Date.now()) g *= 1.5 + eff.potionMul;
    // v224 昇華封頂：前 5 次各 +25%、之後各 +5%（原無上限 +25%×N 指數螺旋 — 20 次 +500% 擊穿難度曲線）
    const aw = 1 + 0.25 * Math.min(st.awakenings || 0, 5) + 0.05 * Math.max(0, (st.awakenings || 0) - 5);
    g *= aw * (1 + 0.1 * (st.honorLvls.gold || 0));
    // v234 在線專注：掉落與 rates 同乘（線上掛機優勢 — 離線結算走 rates 已排除）
    g *= 1 + MG.config.ACTIVE_FOCUS.perHour * MG.sys.battle.focusLayers();
    if (MG.sys.dev) g *= MG.sys.dev.balance().goldMul; // vXXX 開發者：金幣獲取
    out.gold = Math.floor(g);
    // exp（v224FIX：昇華經驗乘數實作 — 原文案宣稱「經驗 +5%/次」但從無對應乘數（既有隱藏缺陷）；
    // 前 5 次各 +5%、之後各 +1%；honorLvls.exp 智慧印記一併接上（同為死屬性））
    const awExp = 1 + 0.05 * Math.min(st.awakenings || 0, 5) + 0.01 * Math.max(0, (st.awakenings || 0) - 5);
    out.exp = Math.floor(m.exp * eff.expMul * (st.buffs.potExp > Date.now() ? 1.5 + eff.potionMul : 1) * awExp * (1 + 0.05 * (st.honorLvls.exp || 0)) * (1 + MG.config.ACTIVE_FOCUS.perHour * MG.sys.battle.focusLayers()) * (MG.sys.dev ? MG.sys.dev.balance().expMul : 1)); // v234 專注 // vXXX 開發者：經驗獲取
    // materials（精英怪：素材機率 ×3，掉落更豐富）
    const devB = MG.sys.dev ? MG.sys.dev.balance() : null; // vXXX 開發者：掉落倍率（一次取用）
    for (const drop of m.drops || []) {
      const c = Math.min(0.95, (m.elite ? drop.c * 3 : drop.c) * tMul * dMul * (devB ? devB.matMul : 1)); // v583 掉落 parity
      if (U.chance(c)) {
        out.mats.push({ id: drop.m, qty: 1 });
        st.codex.mats[drop.m] = (st.codex.mats[drop.m] || 0) + 1;
      }
    }
    // 通用素材迴圈（平衡：後期區域仍會少量掉出舊素材，避免 herb/iron 等斷供）
    const uni = regionIdx >= 8 ? [["void", 0.04], ["myth", 0.02], ["crystal", 0.06], ["herb", 0.04], ["leather", 0.03], ["iron", 0.06]]
      : regionIdx >= 6 ? [["poison", 0.04], ["ice", 0.03], ["crystal", 0.06], ["ember", 0.04], ["herb", 0.05], ["leather", 0.04], ["iron", 0.07]]
      : regionIdx >= 4 ? [["crystal", 0.06], ["ember", 0.04], ["herb", 0.06], ["leather", 0.05], ["iron", 0.09]]
      : regionIdx >= 2 ? [["crystal", 0.04], ["herb", 0.07], ["leather", 0.06], ["iron", 0.12]]
      : [["herb", 0.05], ["leather", 0.04], ["iron", 0.05]];
    for (const [mm, cc] of uni) {
      const c = Math.min(0.95, (m.elite ? cc * 3 : cc) * tMul * dMul * (devB ? devB.matMul : 1)); // v583 掉落 parity
      if (U.chance(c)) {
        out.mats.push({ id: mm, qty: 1 });
        st.codex.mats[mm] = (st.codex.mats[mm] || 0) + 1;
      }
    }
    // 藥水補品掉落（主要來源：r0 起普通怪 6%、首領 60%，隨區域成長；商店僅是便利補充）
    {
      const base = m.boss ? 0.6 : (m.elite ? 0.18 : 0.06);
      // v583 掉落 parity：內層 cap（基礎率語義）乘 dMul，外層 0.95 防洪
      const rate = Math.min(0.95, Math.min(m.boss ? 1 : 0.2, base + regionIdx * (m.boss ? 0.04 : 0.015)) * dMul) * (devB ? devB.dropMul : 1);
      if (U.chance(rate)) {
        const potions = out.potions = out.potions || [];
        potions.push(U.chance(0.6) ? "item_pot_hp" : "item_pot_mp");
        // 中後期首領 50% 掉 2 瓶；後期普通怪 20% 掉 2 瓶
        const extraChance = m.boss ? (regionIdx >= 4 ? 0.5 : 0) : (regionIdx >= 6 ? 0.2 : 0);
        if (U.chance(extraChance)) potions.push(potions[0]);
      }
    }
    // equipment（精英怪 ×4：30% 左右；BOSS 必掉 — v583 掉落 parity：非 BOSS 率 ×dMul，BOSS 維持必掉 1）
    const equipChance = m.boss ? 1 : Math.min(0.95, (m.elite ? 0.30 : 0.075) * dMul * (devB ? devB.dropMul : 1));
    if (U.chance(equipChance)) {
      const it = MG.sys.equipment.gen({ tier: r.tier, cls: undefined, boss: m.boss });
      out.items.push(it);
    }
    // gems（精英怪 ×3）— v583 掉落 parity：×dMul（clamp 0.95）
    if (U.chance(Math.min(0.95, 0.035 * eff.gemDrop * (m.elite ? 3 : 1) * dMul * (devB ? devB.dropMul : 1)))) {
      const kind = U.pick(Object.keys(MG.data.equipment.GEMS));
      const gt = Math.min(10, Math.max(1, r.tier + U.rint(-1, 0)));
      out.gems.push(kind + "_" + gt);
    }
    // skill books（精英怪 ×3）— v583 掉落 parity：×dMul（clamp 0.95）
    if (U.chance(Math.min(0.95, 0.015 * eff.bookDrop * (m.elite ? 3 : 1) * dMul * (devB ? devB.dropMul : 1)))) out.books = 1;
    // boss extras（v209：榮譽掉落與每日每區域首殺同步 — 重複討伐不再印榮譽；
    // 首殺判斷在 advance 標記之前執行 → 首殺仍領 2 榮譽、重複討伐歸零）
    if (m.boss) {
      out.gems.push(U.pick(Object.keys(MG.data.equipment.GEMS)) + "_" + Math.min(10, r.tier + 1));
      const br = st.stats && st.stats.bossRewards;
      if (!br || br.day !== U.today() || !br.perRegion || !br.perRegion[regionIdx]) out.honor = 2;
      // v583 掉落 parity：BOSS 額外券/書 ×dMul（clamp 0.95）；BOSS 必掉寶石與首殺榮譽邏輯不動（必掉語義與難度無關）
      if (U.chance(Math.min(0.95, 0.35 * dMul * (devB ? devB.dropMul : 1)))) out.tickets = 1;
      if (U.chance(Math.min(0.95, 0.2 * dMul * (devB ? devB.dropMul : 1)))) out.books = 1;
    }
    return out;
  }
  function applyDrops(regionIdx, stage, m) {
    const st = S();
    const teamIds = (st.formations && st.formations[st.activeTeam || 0]) || st.formation;
    // v241 滿包強拆計數（module 級 — 跨掉落累計；30s 合併 toast 節流 — hunt 戰利品 ticker 同模式）
    // v241FIX：isSilent 守衛（大補發/隱藏分頁靜音 — battle.js 同款）；lostCount>1 才合併（首件 ★5+ 指名已覆蓋單件場景防同 tick 雙 toast）
    const flashLost = () => {
      if (lostCount > 1 && Date.now() - lostFlashAt >= 30e3 && !(MG.sys.game && MG.sys.game.isSilent())) {
        MG.ui.dom.toast("⚠ 背包已滿：" + lostCount + " 件掉落/寶石未能入庫（前往裝備頁整理）", "bad", "icon_hammer");
        lostFlashAt = Date.now();
        lostCount = 0;
      }
    };
    // v161 詞綴（掉落類）：貪婪金幣／學者經驗／尋寶素材機率 — 編隊穿戴總和
    const greedyA = MG.sys.equipment.teamAffixTotal(teamIds, "greedy");
    const scholarA = MG.sys.equipment.teamAffixTotal(teamIds, "scholar");
    const treasureA = MG.sys.equipment.teamAffixTotal(teamIds, "treasure");
    const out = rollKill(regionIdx, stage, m, treasureA);
    out.gold = Math.round(out.gold * (1 + greedyA));
    out.exp = Math.round(out.exp * (1 + scholarA));
    // v156 公會科技：金幣/經驗加成
    if (MG.sys.guild) {
      const g = MG.sys.guild.effects();
      out.gold = Math.round(out.gold * (1 + g.gold));
      out.exp = Math.round(out.exp * (1 + g.exp));
    }
    // v169 狩獵傳統：金幣/經驗 +5%/級（跨昇華永久）
    if (MG.sys.meta && MG.sys.meta.traditionEffects) {
      const tr = MG.sys.meta.traditionEffects();
      out.gold = Math.round(out.gold * (1 + tr.hunt));
      out.exp = Math.round(out.exp * (1 + tr.hunt));
    }
    // v174 週末雙倍：星期六/日金幣經驗 ×1.5（掉落與離線速率同步）
    if (MG.config.WEEKEND_MULT && U.isWeekend()) {
      out.gold = Math.round(out.gold * MG.config.WEEKEND_MULT);
      out.exp = Math.round(out.exp * MG.config.WEEKEND_MULT);
    }
    // v158 貪婪錢袋：編隊內任一英雄裝備即金幣 +20%（v195 精煉：隨神器等級成長）
    if (MG.data.artifacts && st.artifacts) {
      const teamIds = (st.formations && st.formations[st.activeTeam || 0]) || st.formation;
      const greedy = st.hunters.some(x => teamIds.includes(x.id) && x.art === "greed_pouch");
      if (greedy) out.gold = Math.round(out.gold * (1 + 0.2 * MG.sys.hunters.artifactMul("greed_pouch")));
    }
    MG.sys.game.addGold(out.gold, "副本");
    st.stats.goldEarned += out.gold;
    const team = MG.sys.hunters.formation();
    if (team.length && out.exp > 0) {
      const per = Math.max(1, Math.floor(out.exp / team.length));
      // v177：收集升級事件（戰鬥中金色爆發演出用）
      out.levels = out.levels || [];
      for (const h of team) {
        const ev = MG.sys.hunters.gainExp(h, per, true);
        for (const e of ev || []) if (e.type === "levelup") out.levels.push(e);
      }
    }
    for (const mat of out.mats) st.mats[mat.id] = (st.mats[mat.id] || 0) + mat.qty;
    if (out.mats.length && MG.sys.meta && MG.sys.meta.bump) MG.sys.meta.bump("mat", out.mats.length); // v214：每日 d8 計數（原缺失）
    // 藥水補品入庫（與商店入庫同結構）
    for (const pid of out.potions || []) {
      const have = st.inventory.items.find(i => i.defId === pid);
      if (have) have.qty = (have.qty || 0) + 1;
      else st.inventory.items.push({ uid: MG.util.uid(), defId: pid, tier: 1, qty: 1, gems: [], enhance: 0 });
    }
    for (const it of out.items) {
      // 自動分解（v120 設定）：勾選的稀有度打到即拆成金幣與素材
      const ad = st.settings && st.settings.autoDismantle;
      if (ad && ad.on && ad.set && ad.set[it.rarity] && (!ad.slots || Object.keys(ad.slots).length === 0 || ad.slots[MG.sys.equipment.slotOf(it)])) {
        MG.sys.equipment.dismantle(it);
        st.stats.autoDismantled = (st.stats.autoDismantled || 0) + 1;
      } else if (!MG.sys.equipment.addToInventory(it)) {
        MG.sys.equipment.dismantle(it); // auto-dismantle when full
        // v241 損失可見化：滿包強拆計數（30s 合併 toast；★5+ 指名 toast 防重大損失無感 — isSilent 守衛）
        lostCount++;
        if ((it.rarity || 1) >= 5 && !(MG.sys.game && MG.sys.game.isSilent())) {
          MG.ui.dom.toast("⚠ 背包已滿：「" + MG.sys.equipment.nameOf(it) + "」被自動分解（請整理背包）", "bad", "icon_hammer");
        }
      }
      st.stats.itemsLooted = (st.stats.itemsLooted || 0) + 1;
    }
    for (const g of out.gems) MG.sys.equipment.addGem(g);
    st.currencies.ticket = (st.currencies.ticket || 0) + out.tickets;
    if (out.honor) st.currencies.honor += Math.floor(out.honor * MG.sys.buildings.effects().honorMul);
    if (out.books) st.currencies.book = (st.currencies.book || 0) + 1;
    // v152 限時活動點數（狩獵祭機率掉點／討伐祭 BOSS 必得）
    if (MG.sys.events && MG.sys.events.onKill) MG.sys.events.onKill(m);
    flashLost(); // v241：滿包損失合併 toast（30s 節流）
    return out;
  }
  /* v241：滿包損失計數（addGem 等外部呼叫）— 併入 30s 合併回報 */
  function noteLost() { lostCount++; }
  return { region, monsterForStage, stageOfMonster, scaledMonster, rollKill, applyDrops, noteLost, dropInfoOf, potionRateOf }; // v246 圖鑑深鏈；v256 掉落一覽
})();
