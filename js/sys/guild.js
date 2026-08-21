/* 放置王國 MEGA IDLE — 公會（v156，slice B5 延伸）
   單人公會（市場單機放置先例：Idle Heroes 可自成一會）：
   - 捐獻：每日 3 次金幣捐獻 → 公會經驗 → 公會等級（上限 10）
   - 公會科技：6 條線（攻/防/血/金幣/經驗/暴擊），等級上限受公會等級制約，全隊被動
   - 每週首領：巨型魔物（ISO 週重置），每次出戰造成 戰力×30 傷害，跨次累積；
     總傷里程碑（10/30/60/100%）領獎，擊殺發大獎並迎接新首領 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.guild = (function () {
  const U = MG.util;
  const S = () => MG.game.state;
  const MAX_LEVEL = 20; // v220：10→20（Lv15 古龍首領／Lv20 公會旗幟 — 續命滿級死水系統）
  const MAX_ANCIENT = 20; // v234 遠古科技：公會 Lv20 後的金幣永續消耗端（Lv1-10，成本接續 Lv20 曲線 ×4）；v269 第二階梯 Lv11-20
  /* v234：遠古科技成本 = 3200×1.65^(20+lvl-1)（單線 Σ≈16.4B、全 6 線 ≈98B — kl 40 約 2 個月、kl 30 約 6.5 個月）
     v269 第二階梯：Lv11+ 以 Lv10 價格為起點、1.6 成長（cost(11)=cost(10)≈6.5B — 無降價斷層；全 6 線 Σ≈7.1T ≈5-6 個月；1.65 直續 6 線 ≈14.7T 過陡） */
  function ancientCost(lvl) {
    if (lvl <= 10) return Math.floor(3200 * Math.pow(1.65, 20 + lvl - 1));
    // v704：第二階梯指數軟封頂 min(lvl-11,5) — Lv≤16 不變；防 Lv17–20 遠古牆
    // v760：加深軟封頂 min(lvl-11,4) — Lv≤15 不變；防 Lv16–20 遠古牆
    // v764：加深軟封頂 min(lvl-11,3) — Lv≤14 不變；防 Lv15–20 遠古牆
    // v768：加深軟封頂 min(lvl-11,2) — Lv≤13 不變；防 Lv14–20 遠古牆
    // v772：加深軟封頂 min(lvl-11,1) — Lv≤12 不變；防 Lv13–20 遠古牆
    // v780：加深軟封頂 min(lvl-11,0) — Lv≤11 不變；第二階梯平坦（防 Lv12–20 遠古牆）
    const step = Math.min(Math.max(0, lvl - 11), 0);
    return Math.floor(3200 * Math.pow(1.65, 29) * Math.pow(1.6, step));
  }
  /* v234：遠古效果 = 基礎 FX×0.25（每級 +0.5% — 滿線 +5%、全滿 +27.5%（crit 半 FX）；煞車最弱檔）
     v269 第二階梯：Lv11+ 效果再減半（每級 +0.25% — 與 v220 科技 Lv16-20 煞車同哲學） */
  function ancientFx(line, lvl) {
    return TECH_FX[line] * 0.25 * (((lvl || 0) > 10) ? 0.5 : 1);
  }
  function ancientTotal(line, lvl) {
    const n = lvl || 0;
    if (n <= 10) return n * TECH_FX[line] * 0.25;
    return 10 * TECH_FX[line] * 0.25 + (n - 10) * TECH_FX[line] * 0.125; // v269 分段：第一階 0.25×FX、第二階 0.125×FX
  }
  function buyAncient(line, silent) {
    ensure();
    const st = S();
    const g = st.guild;
    if (!TECH_LINES.includes(line)) return { ok: false, reason: "科技不存在" };
    if ((g.level || 1) < MAX_LEVEL) return { ok: false, reason: "公會 Lv" + MAX_LEVEL + " 解鎖遠古科技" };
    const cur = (g.ancient && g.ancient[line]) || 0;
    if (cur >= MAX_ANCIENT) return { ok: false, reason: "遠古科技已滿級" };
    const cost = ancientCost(cur + 1);
    if (st.currencies.gold < cost) return { ok: false, reason: "金幣不足（需 " + U.fmt(cost) + "）" };
    st.currencies.gold -= cost;
    if (!g.ancient) g.ancient = {};
    g.ancient[line] = cur + 1;
    if (!silent) MG.core.audio.SFX.enhance();
    // 里程碑：全 6 線第一階滿級 Lv10（一次性 +500 鑽 — v220 公會旗幟模式）；第二階全滿 Lv20（+1000 鑽 — v269）
    const allMax10 = TECH_LINES.every(k => (g.ancient[k] || 0) >= 10);
    if (allMax10 && !g.ancientDone) {
      g.ancientDone = true;
      st.currencies.gems += 500;
      MG.ui.dom.toast("遠古科技第一階全滿！+500 鑽石", "good", "icon_castle");
    }
    const allMax20 = TECH_LINES.every(k => (g.ancient[k] || 0) >= MAX_ANCIENT);
    if (allMax20 && !g.ancientDone2) {
      g.ancientDone2 = true;
      st.currencies.gems += 1000;
      MG.ui.dom.toast("遠古科技全滿！+1000 鑽石", "good", "icon_castle");
    }
    return { ok: true, line, lvl: cur + 1 };
  }
  const DONATIONS = 3;
  const TECH_LINES = ["atk", "def", "hp", "gold", "exp", "crit"];
  const TECH_NAMES = { atk: "戰技", def: "壁壘", hp: "體魄", gold: "聚財", exp: "悟性", crit: "鷹眼" };
  const TECH_ICONS = { atk: "icon_sword", def: "icon_armor", hp: "icon_pot_hp", gold: "icon_goldbag", exp: "icon_pot_exp", crit: "icon_dagger" };
  const TECH_FX = { atk: 0.02, def: 0.02, hp: 0.02, gold: 0.02, exp: 0.02, crit: 0.01 }; // 每級
  /* v220 FX 煞車：Lv11-15 每級效果減半、Lv16-20 再減半（防 20 級全屬性 +40% 通膨 — 淨 +27.5%） */
  function techFx(line, lvl) {
    const base = TECH_FX[line];
    if (lvl <= 10) return base;
    if (lvl <= 15) return base * 0.5;
    return base * 0.25;
  }
  /* v220FIX：科技總加成 = 各級邊際率累計（Lv10 → 20%、Lv20 → 27.5% — effects 不可用單級邊際率） */
  function techTotal(line, lvl) {
    let t = 0;
    for (let i = 1; i <= lvl; i++) t += techFx(line, i);
    return t;
  }
  const BOSS_MILESTONES = [
    { pct: 0.1, r: { gems: 30 } },
    { pct: 0.3, r: { gems: 50, ticket: 1 } },
    { pct: 0.6, r: { gems: 100, ticket: 2 } },
    { pct: 1.0, r: { gems: 200, ticket: 3, honor: 100 } }
  ];

  function weekKey() {
    const d = new Date();
    const onejan = new Date(d.getFullYear(), 0, 1);
    const wk = Math.ceil((((d - onejan) / 864e5) + onejan.getDay() + 1) / 7);
    return d.getFullYear() + "-W" + String(wk).padStart(2, "0");
  }
  // v704：指數底軟封頂 min(lv,18) — Lv≤18 不變；防 Lv19–20 升級牆（捐獻已軟封）
  // v812：加深軟封頂 min(lv,16) — Lv≤16 不變；防 Lv17–20 升級牆
  // v816：加深軟封頂 min(lv,14) — Lv≤14 不變；防 Lv15–20 升級牆
  // v820：加深軟封頂 min(lv,12) — Lv≤12 不變；防 Lv13–20 升級牆
  function expNeed(lv) { return Math.floor(120 * Math.pow(Math.min(Math.max(1, lv), 12), 1.6)); }
  function donateCost() {
    const st = S();
    // v692：指數軟封頂 min(lv-1,12) — 公會 Lv≤13 不變；防後期日捐牆
    // v724：加深軟封頂 min(lv-1,8) — 公會 Lv≤9 不變；防 Lv10–20 日捐牆
    // v736：加深軟封頂 min(lv-1,6) — 公會 Lv≤7 不變；防 Lv8–20 日捐牆
    // v744：加深軟封頂 min(lv-1,4) — 公會 Lv≤5 不變；防 Lv6–20 日捐牆
    // v752：加深軟封頂 min(lv-1,3) — 公會 Lv≤4 不變；防 Lv5–20 日捐牆
    // v756：加深軟封頂 min(lv-1,2) — 公會 Lv≤3 不變；防 Lv4–20 日捐牆
    // v760：加深軟封頂 min(lv-1,1) — 公會 Lv≤2 不變；防 Lv3–20 日捐牆
    // v808：加深軟封頂 min(lv-1,0) — 公會 Lv≤1 不變；Lv≥2 deepen 歸零（flat 1500）
    const exp = Math.min(Math.max(0, (st.guild.level || 1) - 1), 0);
    return Math.floor(1500 * Math.pow(1.4, exp));
  }
  function techCost(line, lvl) {
    // v233FIX：可選 lvl — 影子模擬用下一級價格（原讀 live state → preview 每步都按當前等級 → 級數/成本虛報）
    const cur = lvl !== undefined ? lvl : (S().guild.tech[line] || 0);
    // v696：指數軟封頂 min(cur,10) — 科技 ≤10 不變；防後期科技牆
    // v812：加深軟封頂 min(cur,8) — 科技 ≤8 不變；防 Lv9–20 科技牆
    // v816：加深軟封頂 min(cur,6) — 科技 ≤6 不變；防 Lv7–20 科技牆
    // v820：加深軟封頂 min(cur,4) — 科技 ≤4 不變；防 Lv5–20 科技牆
    return Math.floor(800 * Math.pow(1.65, Math.min(Math.max(0, cur), 4)));
  }
  function bossMaxHp() {
    // v220：Lv15 起為「古龍」首領（基數 700000、成長 1.62 — 更強的週目標）
    // v700：指數軟封頂 min(lv-1,16) — Lv≤17 不變；防 Lv18–20 週首領戰力牆
    const lv = S().guild.level;
    const exp = Math.min(Math.max(0, lv - 1), 16);
    return lv >= 15
      ? Math.floor(700000 * Math.pow(1.62, exp))
      : Math.floor(400000 * Math.pow(1.55, exp));
  }
  /* v220 週首領弱點輪換：以週 key 為種子抽出 2 個元素弱點（v149 元素克制機制搬到決策現場） */
  function rollWeak() {
    const wk = weekKey();
    let h = 2166136261;
    for (let i = 0; i < wk.length; i++) { h ^= wk.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 16777619) >>> 0; h = (h ^ (h >>> 16)) >>> 0;
    const ELS = Object.keys(MG.config.ELEMENT_COUNTER);
    const a = ELS[h % ELS.length];
    // v220FIX：明確括號（`+` 優先於 `>>>` — 原 h>>>8+3 = h>>>11）且保證兩弱點相異
    let c = ELS[((h >>> 8) + 3) % ELS.length];
    if (c === a) c = ELS[(h % ELS.length + 1) % ELS.length];
    return [a, c];
  }
  function teamPower() {
    const st = S();
    const ids = MG.sys.hunters.teamOf().filter(Boolean);
    return ids.reduce((a, id) => {
      const h = st.hunters.find(x => x.id === id);
      return a + (h ? MG.sys.hunters.power(h) : 0);
    }, 0);
  }
  /* 每日捐獻重置 + 每週首領重置；回傳擊殺/里程碑檢查結果給 UI */
  function ensure() {
    const st = S();
    if (!st.guild) st.guild = { level: 1, exp: 0, donatedDay: "", donated: 0, tech: {}, boss: { week: "", hp: 0, dmg: 0, claimed: {} } };
    const g = st.guild;
    const today = U.today();
    if (g.donatedDay !== today) { g.donatedDay = today; g.donated = 0; }
    const wk = weekKey();
    if (!g.boss || g.boss.week !== wk) {
      const mh = bossMaxHp();
      g.boss = { week: wk, hp: mh, maxHp: mh, dmg: 0, claimed: {}, weak: rollWeak() }; // v220：每週弱點輪換
    }
    if (!g.boss.weak || !g.boss.weak.length) g.boss.weak = rollWeak(); // 舊檔補
    if (!g.tech) g.tech = {};
    if (!g.boss.claimed) g.boss.claimed = {};
    return g;
  }
  function donate() {
    ensure();
    const st = S();
    const g = st.guild;
    if (g.donated >= DONATIONS) return { ok: false, reason: "今日捐獻次數已用完（每日 " + DONATIONS + " 次）" };
    if (g.level >= MAX_LEVEL) return { ok: false, reason: "公會已滿級" };
    const cost = donateCost();
    if (st.currencies.gold < cost) return { ok: false, reason: "金幣不足（需 " + U.fmt(cost) + "）" };
    st.currencies.gold -= cost;
    g.donated++;
    const gain = 40 * g.level;
    g.exp += gain;
    while (g.exp >= expNeed(g.level) && g.level < MAX_LEVEL) {
      g.exp -= expNeed(g.level);
      g.level++;
      MG.ui.dom.toast("公會升級至 Lv" + g.level + "！科技上限提升", "good", "icon_castle");
      // v220 里程碑：Lv15 古龍時代／Lv20 公會旗幟（一次性獎勵）
      if (g.level === 15) {
        st.currencies.gems += 300;
        MG.ui.dom.toast("公會 Lv15：古龍首領降臨，科技上限再啟！+300 鑽石", "good", "icon_skull");
      } else if (g.level === 20) {
        st.currencies.gems += 500;
        MG.ui.dom.toast("公會 Lv20：公會旗幟升起（全隊攻防 +3%）！+500 鑽石", "good", "icon_castle");
      }
    }
    MG.core.audio.SFX.buy();
    return { ok: true, cost, gain, level: g.level };
  }
  /* v220 盛宴捐獻：每日 1 次、成本 ×5、經驗 ×4（壓 10→20 的升級曲線 — 45 天 → 約 25 天） */
  function donateFeast() {
    ensure();
    const st = S();
    const g = st.guild;
    if (g.feastDay === U.today()) return { ok: false, reason: "今日盛宴已用過（每日 1 次）" };
    if (g.level >= MAX_LEVEL) return { ok: false, reason: "公會已滿級" };
    const cost = donateCost() * 5;
    if (st.currencies.gold < cost) return { ok: false, reason: "金幣不足（需 " + U.fmt(cost) + "）" };
    st.currencies.gold -= cost;
    g.feastDay = U.today();
    const gain = 40 * g.level * 4;
    g.exp += gain;
    while (g.exp >= expNeed(g.level) && g.level < MAX_LEVEL) {
      g.exp -= expNeed(g.level);
      g.level++;
      MG.ui.dom.toast("公會升級至 Lv" + g.level + "！科技上限提升", "good", "icon_castle");
      if (g.level === 15) {
        st.currencies.gems += 300;
        MG.ui.dom.toast("公會 Lv15：古龍首領降臨！+300 鑽石", "good", "icon_skull");
      } else if (g.level === 20) {
        st.currencies.gems += 500;
        MG.ui.dom.toast("公會 Lv20：公會旗幟升起！+500 鑽石", "good", "icon_castle");
      }
    }
    MG.core.audio.SFX.buy();
    return { ok: true, cost, gain, level: g.level };
  }
  /* 全隊被動加成（effectiveStats 掛鉤）v220：累計加成＋Lv20 公會旗幟（全隊攻防 +3%） */
  function bulkBuyTechPreview(line) {
    ensure();
    const st = S();
    let lvl = st.guild.tech[line] || 0, cost = 0, count = 0;
    while (lvl < st.guild.level && lvl < MAX_LEVEL) {
      const c = techCost(line, lvl);
      if (st.currencies.gold < cost + c) break;
      cost += c; lvl++; count++;
    }
    return { count, cost, from: st.guild.tech[line] || 0, to: lvl };
  }
  function buyTech(line, silent) {
    ensure();
    const st = S();
    const g = st.guild;
    if (!TECH_LINES.includes(line)) return { ok: false, reason: "科技不存在" };
    const cur = g.tech[line] || 0;
    if (cur >= g.level) return { ok: false, reason: "科技等級受公會等級限制（Lv" + g.level + "）" };
    if (cur >= MAX_LEVEL) return { ok: false, reason: "科技已滿級" }; // v220：上限隨公會等級制約（10→20）
    const cost = techCost(line);
    if (st.currencies.gold < cost) return { ok: false, reason: "金幣不足（需 " + U.fmt(cost) + "）" };
    st.currencies.gold -= cost;
    g.tech[line] = cur + 1;
    if (!silent) MG.core.audio.SFX.enhance(); // v233：批量連升單一 SFX（節點風暴防護）
    return { ok: true, line, lvl: cur + 1, fx: techFx(line, cur + 1) * 100 }; // v220：煞車後效果
  }
  function bulkBuyTech(line) {
    ensure();
    const st = S();
    let done = 0, cost = 0;
    for (;;) {
      const cur = st.guild.tech[line] || 0;
      if (cur >= st.guild.level || cur >= MAX_LEVEL) break;
      const c = techCost(line);
      if (st.currencies.gold < c) break;
      const r = buyTech(line, true);
      if (!r.ok) break;
      done++; cost += c;
    }
    if (done > 0) MG.core.audio.SFX.enhance();
    return { ok: done > 0, done, cost, lvl: st.guild.tech[line] || 0 };
  }
  /* v238 公會首領連戰：影子模擬到下一未領里程碑（或 20 次上限）；attackBoss 無成本確定性傷害 — 迴圈安全
     （里程碑自動發放於攻擊內；擊殺後新首領生成 — 以次數為界） */
  function bossDmgPreview() {
    const g = ensure();
    const st = S();
    let weakRatio = 0;
    const weak = g.boss.weak || [];
    if (weak.length) {
      const ids = MG.sys.hunters.teamOf().filter(Boolean);
      const total = ids.reduce((a, id) => { const h = st.hunters.find(x => x.id === id); return a + (h ? MG.sys.hunters.power(h) : 0); }, 0);
      if (total > 0) {
        let weakPow = 0;
        for (const id of ids) {
          const h = st.hunters.find(x => x.id === id);
          if (!h) continue;
          const el = MG.config.CLASS_ELEMENT[h.cls];
          if (el && weak.some(w => MG.config.ELEMENT_COUNTER[el] === w)) weakPow += MG.sys.hunters.power(h);
        }
        weakRatio = weakPow / total;
      }
    }
    return Math.max(100, Math.round(teamPower() * 30 * (1 + 0.5 * weakRatio)));
  }
  function bulkAttackBossPreview() {
    ensure();
    const g = S().guild;
    const dmg = bossDmgPreview();
    let need = 0;
    for (const ms of BOSS_MILESTONES) {
      const key = String(ms.pct);
      if (!g.boss.claimed[key]) {
        const hits = Math.ceil(Math.max(0, g.boss.maxHp * ms.pct - g.boss.dmg) / dmg);
        need = Math.max(need, hits);
      }
    }
    const capped = Math.min(20, need || 1);
    return { need: capped, dmg, milestoneGems: BOSS_MILESTONES.filter(ms => !g.boss.claimed[String(ms.pct)] && g.boss.maxHp * ms.pct <= g.boss.dmg + capped * dmg).length };
  }
  function bulkAttackBoss(n) {
    ensure();
    const st = S();
    let done = 0, kills = 0, msTotal = 0;
    for (let i = 0; i < n; i++) {
      const r = attackBoss(); // 里程碑自動發放於攻擊內；擊殺後新首領生成（與手動連點同行為）
      done++;
      msTotal += (r.rewards || []).length; // v238FIX：累加回傳（原 claimed 差值法 — 擊殺重置 claimed → 負數誤報）
      if (st.guild.boss.hp <= 0) kills++;
    }
    return { ok: done > 0, done, kills, msTotal };
  }
  function effects() {
    ensure();
    const st = S();
    const t = st.guild.tech || {};
    const out = { atk: 0, def: 0, hp: 0, gold: 0, exp: 0, crit: 0 };
    for (const k of TECH_LINES) out[k] = techTotal(k, t[k] || 0); // v220FIX：累計（非單級邊際）
    // v234 遠古科技累計（公會 Lv20 後 — 每線至多 +5%）
    const an = st.guild.ancient || {};
    for (const k of TECH_LINES) out[k] += ancientTotal(k, an[k] || 0);
    if ((st.guild.level || 1) >= MAX_LEVEL) { out.atk += 0.03; out.def += 0.03; } // 公會旗幟
    return out;
  }
  function bossInfo() {
    const g = ensure();
    return {
      hp: g.boss.hp, maxHp: g.boss.maxHp, dmg: g.boss.dmg,
      pct: g.boss.maxHp > 0 ? g.boss.hp / g.boss.maxHp : 0,
      claimed: g.boss.claimed
    };
  }
  /* 出戰：造成 戰力×30 傷害（v220：剋制弱點元素加成 — 編隊剋制戰力比例 ×0.5）；跨里程碑發放獎勵；擊殺 → 新首領 */
  function attackBoss() {
    const g = ensure();
    const st = S();
    // v220 弱點加成：編隊中剋制弱點元素的英雄戰力佔比 → ×(1+0.5×ratio)（全剋制 ×1.5、無剋制 ×1.0 — 非門檻僅獎勵）
    let weakRatio = 0;
    const weak = g.boss.weak || [];
    if (weak.length) {
      const ids = MG.sys.hunters.teamOf().filter(Boolean);
      const total = ids.reduce((a, id) => { const h = st.hunters.find(x => x.id === id); return a + (h ? MG.sys.hunters.power(h) : 0); }, 0);
      if (total > 0) {
        let weakPow = 0;
        for (const id of ids) {
          const h = st.hunters.find(x => x.id === id);
          if (!h) continue;
          const el = MG.config.CLASS_ELEMENT[h.cls];
          // v220FIX：剋制判定方向 — 英雄元素「剋制」弱點（ELEMENT_COUNTER[el]===weak，與 v149 戰鬥同語義）
          if (el && weak.some(w => MG.config.ELEMENT_COUNTER[el] === w)) weakPow += MG.sys.hunters.power(h);
        }
        weakRatio = weakPow / total;
      }
    }
    const dmg = Math.max(100, Math.round(teamPower() * 30 * (1 + 0.5 * weakRatio)));
    g.boss.dmg += dmg;
    g.boss.hp = Math.max(0, g.boss.hp - dmg);
    const rewards = [];
    for (const ms of BOSS_MILESTONES) {
      const key = String(ms.pct);
      if (!g.boss.claimed[key] && g.boss.dmg >= g.boss.maxHp * ms.pct) {
        g.boss.claimed[key] = true;
        MG.sys.meta.grantReward(ms.r);
        // v220：古龍（Lv15+）100% 檔額外 +150 榮譽
        if (ms.pct === 1 && (st.guild.level || 1) >= 15) MG.sys.meta.grantReward({ honor: 150 });
        rewards.push(ms);
      }
    }
    let killed = false;
    if (g.boss.hp <= 0) {
      killed = true;
      const wk = weekKey();
      const mh = bossMaxHp();
      g.boss = { week: wk, hp: mh, maxHp: mh, dmg: 0, claimed: {}, weak: rollWeak() };
      MG.core.audio.SFX.victory();
      MG.ui.dom.toast("公會首領被擊敗！新首領降臨" + ((st.guild.level || 1) >= 15 ? "（古龍獎勵 +150 榮譽已入帳）" : ""), "good", "icon_skull"); // v220FIX：古龍額外榮譽提示
    }
    if (rewards.length) MG.core.audio.SFX.quest();
    return { ok: true, dmg, rewards: rewards.map(m => m.pct * 100), killed, left: g.boss.hp, maxHp: g.boss.maxHp };
  }
  return { MAX_LEVEL, MAX_ANCIENT, DONATIONS, TECH_LINES, TECH_NAMES, TECH_ICONS, TECH_FX, BOSS_MILESTONES,
    weekKey, expNeed, donateCost, techCost, techFx, techTotal, bossMaxHp, teamPower, ensure, donate, donateFeast, buyTech,
    bulkBuyTechPreview, bulkBuyTech, effects, bossInfo, attackBoss, rollWeak,
    ancientCost, ancientFx, ancientTotal, buyAncient,
    bossDmgPreview, bulkAttackBossPreview, bulkAttackBoss }; // v233 科技連升；v234 遠古科技；v238 首領連戰
})();
