/* 放置王國 MEGA IDLE — 流浪英雄系統（完整版：生成/心情/消費循環/副本外出/點擊招募）
   設計源：mega-idle-web-three.js 流浪英雄機制（FSM + 心情 + 商店消費 + 出村副本 + 招募），依本遊戲建築/經濟校準。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.wanderers = (function () {
  const D = MG.data.wanderers;
  const U = MG.util;
  const S = () => MG.game.state;
  const RARITY_WALLET = [1, 1.15, 1.35, 1.6, 1.9, 2.3]; // 對應 1-6★
  const RARITY_WEIGHTS = [55, 28, 11, 4.5, 1.3, 0.2];
  const CLS_SPR = { sword: "h_sword", archer: "h_archer", mage: "h_mage", assassin: "h_assassin", knight: "h_knight", priest: "h_priest" };
  /* 需求 → 消費目標建築（我們遊戲的對應：市場=餐飲、鐵匠鋪=武器、藥水工坊=藥水） */
  const SHOP_TARGET = { buy_weapon: "forge", buy_potion: "alchemy", eat: "market", drink: "market" };
  const SHOP_LABEL = { forge: "鐵匠鋪", alchemy: "藥水工坊", market: "市場" };

  function walletMult(r) { return RARITY_WALLET[U.clamp(r - 1, 0, 5)] || 1; }
  function tierPool() {
    const g = S().buildings.guild || 0;
    return D.TYPES.map(t => {
      const w = t.tier === 1 ? 10 : t.tier === 2 ? 4 + g * 2 : 1 + g * 2;
      return { t, weight: w };
    });
  }
  function rollRarity() {
    const tot = RARITY_WEIGHTS.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < 6; i++) { r -= RARITY_WEIGHTS[i]; if (r <= 0) return i + 1; }
    return 1;
  }
  function pickType() {
    const pool = tierPool();
    const tot = pool.reduce((a, x) => a + x.weight, 0);
    let r = Math.random() * tot;
    for (const x of pool) { r -= x.weight; if (r <= 0) return x.t; }
    return pool[0].t;
  }
  function spawn() {
    const st = S();
    if (!st.wanderers) st.wanderers = [];
    if (st.wanderers.filter(w => !w.dead).length >= D.MAX_WANDERERS(st.buildings.guild || 0)) return null;
    const type = pickType();
    const rarity = rollRarity();
    const w = {
      uid: U.uid("w"),
      type, rarity,
      name: MG.data.names.gen(),
      cls: type.cls,
      level: type.level,
      stars: 1 + Math.max(0, rarity - 3),
      hp: 100, maxHp: 100,
      mood: U.rint(55, 90),
      wallet: Math.round(type.dropGold * (2 + walletMult(rarity))),
      state: "enter", targetX: 0, waitUntil: 0,
      bubble: null, bubbleUntil: 0,
      shopTarget: null, hunting: null,
      x: U.rint(20, 60), y: 158,
      tx: null, ty: null, lastDir: 1,
      vx: U.rand(6, 12),
      dead: false, respawnAt: 0,
      spawnAt: Date.now()
    };
    const cls = MG.data.hunters.classes[w.cls];
    const g = 1 + (w.level - 1) * 0.08;
    w.maxHp = Math.round((cls.base.hp + cls.grow.hp * (w.level - 1)) * g);
    w.hp = w.maxHp;
    say(w, D.bubble("enter"), "💭");
    st.wanderers.push(w);
    return w;
  }
  function say(w, text, icon) {
    w.bubble = { text, icon: icon || "💭" };
    w.bubbleUntil = Date.now() + 10000; // 卡片泡泡顯示 10 秒，慢慢看清楚
  }
  function gotoLeave(w) { w.state = "leave"; w.tx = null; say(w, D.bubble("leave"), "👋"); }
  // 目標點：各建築門前（與王國城鎮擺位對齊，建築前方 158 地面線）
  const TOWN_POINTS = {
    castle: { x: 52, y: 158 }, guild: { x: 148, y: 158 },
    market: { x: 172, y: 158 }, forge: { x: 340, y: 158 }, alchemy: { x: 268, y: 158 },
    warehouse: { x: 76, y: 158 }, training: { x: 244, y: 158 }, library: { x: 364, y: 158 },
    gemworks: { x: 436, y: 158 }, altar: { x: 460, y: 158 },
    gate: { x: 16, y: 158 } // 副本/離開的村口
  };
  // 宣告需求：設定狀態與目的地（走到才執行，說的就要真的去）
  function setNeed(w, state, bld, text, icon) {
    w.state = state;
    w.bldTarget = bld || null;
    const pt = TOWN_POINTS[bld] || (state === "hunt" ? TOWN_POINTS.gate : null);
    w.tx = pt ? pt.x : null;
    w.ty = pt ? pt.y : null;
    say(w, text, icon);
  }
  function wander(w) {
    w.tx = U.rint(35, 450);
    w.ty = U.rint(138, 168);
  }
  function decideNeed(w) {
    const st = S();
    if (w.mood < 25) { gotoLeave(w); return; }
    const hpPct = w.hp / w.maxHp;
    const r = Math.random();
    // 只有該建築存在才選擇對應需求（否則走到空地空轉）
    const hasMarket = (st.buildings.market || 0) > 0;
    const hasForge = (st.buildings.forge || 0) > 0;
    const hasAlchemy = (st.buildings.alchemy || 0) > 0;
    if (hpPct < 0.5 && r < 0.5) { w.state = "rest"; w.tx = null; say(w, D.bubble("rest"), "🛌"); return; }
    if (hasMarket && w.mood < 45 && r < 0.6) { setNeed(w, "eat", "market", D.bubble("eat"), "🍖"); return; }
    if (hasMarket && w.mood < 55 && r < 0.5) { setNeed(w, "drink", "market", D.bubble("drink"), "🥤"); return; }
    const roll = Math.random();
    if (hasForge && roll < 0.35) { setNeed(w, "shop", "forge", D.bubble("shop"), "⚔️"); return; }
    if (hasAlchemy && roll < 0.55) { setNeed(w, "shop", "alchemy", D.bubble("shop"), "⚗️"); return; }
    if (roll < 0.75) { setNeed(w, "hunt", null, D.bubble("hunt"), "🗡️"); return; }
    w.state = "walk";
    wander(w);
  }
  // 抵達目的地：執行對應動作
  function onArrive(w) {
    switch (w.state) {
      case "eat": case "drink": case "shop":
        doConsume(w, w.state);
        break;
      case "hunt":
        doHunt(w);
        break;
      case "walk": case "enter":
        w.needCount = (w.needCount || 0) + 1;
        if (w.needCount <= 1) { decideNeed(w); } // 進村後第一次決定需求
        else if (Math.random() < 0.5) { w.state = "rest"; w.waitUntil = Date.now() + 2500; }
        else wander(w);
        break;
    }
  }
  function villageIncome(base, buildingId) {
    const st = S();
    const lv = st.buildings[buildingId] || 0;
    const gain = Math.max(1, Math.round(base * (1 + lv * 0.05)));
    st.currencies.gold += gain;
    st.stats.goldEarned = (st.stats.goldEarned || 0) + gain;
    return gain;
  }
  function doConsume(w, kind) {
    const st = S();
    const bld = SHOP_TARGET[kind];
    if ((st.buildings[bld] || 0) <= 0) { w.state = "walk"; decideNeed(w); return; }
    const fee = kind === "eat" ? U.rint(6, 10) : kind === "drink" ? U.rint(4, 7) : U.rint(10, 18);
    if (w.wallet < fee) { w.state = "walk"; decideNeed(w); return; }
    w.wallet -= fee;
    const rev = villageIncome(fee, bld);
    w.mood = U.clamp(w.mood + (kind === "shop" ? 8 : 18), 0, 100);
    addFavorNatural(w, 2); // v225FIX：消費自然好感（每日上限 30）
    w.paid = true;
    say(w, "（花了 " + fee + " 金在" + SHOP_LABEL[bld] + "，心情愉快）", "💰");
    MG.sys.game.log("流浪者「" + w.name + "」在" + SHOP_LABEL[bld] + "消費 +" + rev + " 金", "icon_coin");
    w.waitUntil = Date.now() + 4000;
    w.state = "rest";
  }
  function doHunt(w) {
    const st = S();
    const region = MG.sys.loot.region(0);
    const m = region.monsters[0];
    // 以職業基礎戰力評估勝率（與離線結算同公式）
    const cls = MG.data.hunters.classes[w.cls];
    const g = 1 + (w.level - 1) * 0.08;
    const atk = cls.base.atk * g, hp = (cls.base.hp + cls.grow.hp * (w.level - 1)) * g, def = cls.base.def * g;
    const heroPower = atk * 3 + hp * 0.2 + def * 2;
    const enemyPower = m.atk * 3 + m.hp * 0.2 + m.def * 2;
    const winRate = U.clamp(heroPower / (heroPower + enemyPower), 0.1, 0.95);
    if (Math.random() < winRate) {
      const gold = Math.round((m.gold * 0.8) * U.rand(0.9, 1.2));
      w.wallet += gold;
      st.stats.goldEarned = (st.stats.goldEarned || 0) + gold;
      if (Math.random() < (w.type.matChance + 0.02 * favorLv(w))) { // v225FIX：好感素材率 +2%/階
        const mat = U.pick(["herb", "iron", "leather"]);
        st.mats[mat] = (st.mats[mat] || 0) + 1;
        MG.sys.game.log("流浪者「" + w.name + "」冒險歸來 +" + gold + " 金" + (mat ? "・" + MG.config.MATS[mat].name + "×1" : ""), "icon_sword");
      }
      w.mood = U.clamp(w.mood + 10, 0, 100);
      addFavorNatural(w, 3); // v225FIX：狩獵成功自然好感
      say(w, "冒險歸來！賺了 " + gold + " 金", "🗡️");
    } else {
      w.hp = Math.max(0, w.hp - U.rint(30, 60));
      if (w.hp <= 0) {
        w.dead = true;
        const g2 = st.buildings.guild || 0;
        w.respawnAt = Date.now() + Math.max(6000, Math.round(18000 * Math.max(0.4, 1 - g2 * 0.06)));
        say(w, "……大意了，我會回來的。", "💀");
      } else {
        w.mood = U.clamp(w.mood - 15, 0, 100);
        say(w, "魔物太強了……", "😵");
      }
    }
    w.waitUntil = Date.now() + 5000;
    w.state = "rest";
  }
  function tick(dt) {
    const st = S();
    if (!st.wanderers) st.wanderers = [];
    const now = Date.now();
    // v225：遠征牆鐘結算（tick 路徑 — 離線由 applyOffline 結算）
    settleAllExped();
    // 定期補員
    if (st.wanderers.filter(w => !w.dead).length < D.MAX_WANDERERS(st.buildings.guild || 0)) {
      if (Math.random() < 0.04) spawn();
    }
    for (const w of [...st.wanderers]) {
      if (w.dead) {
        if (now >= w.respawnAt) {
          st.wanderers.splice(st.wanderers.indexOf(w), 1);
          spawn();
        }
        continue;
      }
      // v225FIX：泡泡清理先於 exped continue（遠征啟動訊息 10 秒後正常消失）
      if (w.bubble && w.bubbleUntil < now) w.bubble = null;
      if (w.state === "exped") continue; // v225：遠征中 FSM 暫停（心情不衰減）
      // 心情衰減
      w.mood = U.clamp(w.mood - dt * 0.2, 0, 100);
      switch (w.state) {
        case "enter": w.state = "walk"; wander(w); break;
        case "walk":
          if (Math.random() < 0.12) decideNeed(w);
          break;
        case "rest":
          w.mood = U.clamp(w.mood + dt * 2, 0, 100);
          if (w.mood > 80 || now > w.waitUntil) decideNeed(w);
          break;
        case "eat": case "drink": case "shop":
          if (now > w.waitUntil) { w.paid = false; decideNeed(w); }
          break;
        case "hunt":
          if (now > w.waitUntil) { w.paid = false; decideNeed(w); }
          break;
        case "leave":
          w.x -= dt * 20;
          if (w.x < -30) {
            st.wanderers.splice(st.wanderers.indexOf(w), 1);
          }
          break;
      }
      if (w.mood < 20 && w.state !== "leave" && w.state !== "hunt") gotoLeave(w);
      // 目標導向移動：說要去哪就走去哪；抵達後執行動作
      if (w.tx !== null && w.tx !== undefined && w.state !== "leave") {
        const dx = w.tx - w.x, dy = (w.ty !== undefined ? w.ty : 158) - w.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 6) {
          const spd = 30 * dt;
          w.x += dx / dist * spd;
          w.y += dy / dist * spd;
          w.lastDir = dx > 0 ? 1 : -1;
        } else {
          w.tx = null;
          onArrive(w);
        }
      }
    }
  }
  /* v225 委託遠征：被動 FSM 主動化 — 選區/選時長、牆鐘結算（第二離線收成錨點） */
  function expedLaunch(w, regionIdx, hours) {
    const st = S();
    if (w.dead) return { ok: false, reason: "該流浪者已陣亡" };
    if (w.state === "exped") return { ok: false, reason: "已在遠征中" };
    if ((w.mood || 0) < 40) return { ok: false, reason: "心情低落（<40）— 先讓他在村裡散散心" };
    if ((st.stats.maxRegionReached || 0) < regionIdx) return { ok: false, reason: "尚未抵達該區域" };
    if (![1, 4, 8].includes(hours)) return { ok: false, reason: "時長僅支援 1／4／8 小時" };
    w.exped = { r: regionIdx, hours, until: Date.now() + hours * 3600e3 };
    w.state = "exped";
    w.bubble = null;
    say(w, "踏上前往「" + ((MG.sys.loot.region(regionIdx) || {}).name || regionIdx) + "」的遠征！", "🗡️");
    return { ok: true };
  }
  function expedCancel(w) {
    if (w.state !== "exped") return { ok: false, reason: "不在遠征中" };
    w.exped = null;
    w.state = "rest";
    w.waitUntil = Date.now() + 1500;
    say(w, "取消了遠征，先回村休息。", "😅");
    return { ok: true };
  }
  /* 遠征結算（tick/applyOffline 呼叫 — settled 旗標防雙重給獎；報酬以該區第 1 隻普通怪為基準） */
  function settleExped(w) {
    const ex = w.exped;
    if (!ex || ex.settled) return null;
    if (Date.now() < ex.until) return null;
    const st = S();
    ex.settled = true;
    w.exped = null;
    w.state = "rest";
    w.waitUntil = Date.now() + 3000;
    const r = MG.sys.loot.region(ex.r);
    const m = r ? r.monsters[0] : null;
    const cls = MG.data.hunters.classes[w.cls];
    const g = 1 + (w.level - 1) * 0.08;
    const atk = cls.base.atk * g, hp = (cls.base.hp + cls.grow.hp * (w.level - 1)) * g, def = cls.base.def * g;
    const heroPower = atk * 3 + hp * 0.2 + def * 2;
    const enemyPower = m ? m.atk * 3 + m.hp * 0.2 + m.def * 2 : 1000;
    const winRate = U.clamp(heroPower / (heroPower + enemyPower), 0.25, 0.97);
    const H = ex.hours === 8 ? 1.25 : ex.hours === 4 ? 1.1 : 1; // v225FIX：每小時效率隨時長遞增（8h 最高 — 睡前派遠征動機；原 8h=5/4h=2.4/1h=1 使 1h 連發稱王）
    const tierMul = 0.6 + 0.2 * Math.min(9, (r || {}).tier || 0);
    const won = Math.random() < winRate;
    const gold = Math.floor((m ? m.gold : 50) * 0.8 * ex.hours * H * tierMul * (won ? 1 : 0.3));
    if (gold > 0) {
      st.currencies.gold += gold;
      st.stats.goldEarned = (st.stats.goldEarned || 0) + gold;
      if (MG.sys.meta && MG.sys.meta.bump) MG.sys.meta.bump("gold", gold);
    }
    // 素材：matChance×hours×2 次擲骰（區掉落池 — 每日任務 d8 自動接上；v225FIX 好感 +2%/階）
    const mats = [];
    const pool = (r && r.mats) || ["herb", "iron", "leather"];
    const matRate = (w.type.matChance || 0.5) + 0.02 * favorLv(w);
    for (let i = 0; i < Math.ceil(matRate * ex.hours * 2); i++) {
      const mm = U.pick(pool);
      if (Math.random() < 0.3) mats.push(mm);
    }
    for (const mm of mats) st.mats[mm] = (st.mats[mm] || 0) + 1;
    if (mats.length && MG.sys.meta && MG.sys.meta.bump) MG.sys.meta.bump("mat", mats.length);
    // 經驗（招募時 level = type.level + floor(exp/120) — 遠征養肥再招募）
    const expGain = Math.floor(ex.hours * (8 + (r ? r.tier : 0) * 4));
    const expActual = won ? expGain : Math.floor(expGain * 0.5);
    w.exp = (w.exp || 0) + expActual;
    if (won) { w.mood = U.clamp((w.mood || 0) + 10, 0, 100); addFavor(w, 8); }
    else w.mood = U.clamp((w.mood || 0) - 10, 0, 100);
    w.hp = won ? w.maxHp : Math.max(1, Math.round(w.maxHp * 0.6));
    say(w, "遠征歸來！" + (won ? "滿載而歸 +" + gold + " 金" : "受挫而返（+" + expActual + " 經驗）"), won ? "🗡️" : "😵");
    return { won, gold, mats, exp: expActual, name: w.name };
  }
  function settleAllExped() {
    const out = [];
    for (const w of (S().wanderers || [])) {
      const r = settleExped(w);
      if (r) out.push(r);
    }
    return out;
  }
  /* v225 好感/投餵：favorLv=floor(favor/25) 共 4 階 — 招募費 -6%/階、等級 +1/階、素材率 +2%/階 */
  function favorLv(w) { return Math.floor((w.favor || 0) / 25); }
  function addFavor(w, n) {
    w.favor = U.clamp((w.favor || 0) + n, 0, 100);
  }
  function feed(w, silent) {
    const st = S();
    if (w.dead || w.state === "exped") return { ok: false, reason: "該流浪者無法互動" };
    const today = U.today();
    if (w.feedDay === today) return { ok: false, reason: "今日已投餵過（每日 1 次）" };
    const cost = Math.max(10, Math.round(recruitCost(w) * 0.1));
    if ((st.currencies.gold || 0) < cost) return { ok: false, reason: "金幣不足（需 " + U.fmt(cost) + "）" };
    st.currencies.gold -= cost;
    w.feedDay = today;
    addFavor(w, 15);
    w.mood = U.clamp((w.mood || 0) + 10, 0, 100);
    if (!silent) { // v233：批量投餵跳過泡泡/SFX（v218 WebAudio 節點風暴教訓）
      say(w, "你請他飽餐一頓，好感大增！", "🍖");
      MG.core.audio.SFX.buy();
    }
    return { ok: true, cost, favor: w.favor, lv: favorLv(w) };
  }
  /* v233 全部投餵：快照 eligible 再迴圈（v198 快照教訓 — 條件不可引用可變 state）；
     逐隻走 feed 守衛（feedDay/金幣）— 不可能超餵/超扣 */
  function bulkFeed() {
    const st = S();
    const pool = (st.wanderers || []).filter(w => !w.dead && w.state !== "exped" && w.feedDay !== U.today());
    let fed = 0, cost = 0;
    const skipped = [];
    for (const w of pool) {
      const r = feed(w, true);
      if (r.ok) { fed++; cost += r.cost; }
      else skipped.push({ name: w.name, reason: r.reason });
    }
    return { ok: fed > 0, fed, cost, skipped };
  }
  function bulkFeedPreview() {
    const st = S();
    const pool = (st.wanderers || []).filter(w => !w.dead && w.state !== "exped" && w.feedDay !== U.today());
    let cost = 0;
    for (const w of pool) cost += Math.max(10, Math.round(recruitCost(w) * 0.1));
    return { count: pool.length, cost };
  }
  /* v233 批量遠征：快照 eligible（未陣亡/未遠征/心情≥40）再迴圈 expedLaunch（區域/時長守衛逐隻保留） */
  function bulkExpedLaunch(regionIdx, hours) {
    const st = S();
    const pool = (st.wanderers || []).filter(w => !w.dead && w.state !== "exped" && (w.mood || 0) >= 40);
    let launched = 0;
    const skipped = [];
    for (const w of pool) {
      const r = expedLaunch(w, regionIdx, hours);
      if (r.ok) launched++;
      else skipped.push({ name: w.name, reason: r.reason });
    }
    return { ok: launched > 0, launched, skipped };
  }
  /* 村內消費/狩獵自然好感（每日封頂 30） */
  function addFavorNatural(w, n) {
    const st = S();
    const today = U.today();
    if (w.favorDay !== today) { w.favorDay = today; w.favorGain = 0; }
    if ((w.favorGain || 0) >= 30) return;
    const gain = Math.min(n, 30 - (w.favorGain || 0));
    w.favorGain = (w.favorGain || 0) + gain;
    addFavor(w, gain);
  }
  function recruitCost(w) {
    const lv = favorLv(w);
    return Math.max(1, Math.round((100 + w.type.level * 40) * walletMult(w.rarity) * (1 - 0.06 * lv))); // v225：好感折扣
  }
  function canRecruit(w) {
    const st = S();
    if (w.state === "exped") return { ok: false, reason: "遠征中無法招募 — 召回或等他歸來" }; // v225
    const cap = MG.sys.buildings.effects().rosterCap;
    if (st.hunters.length >= cap) return { ok: false, reason: "名冊已滿（" + cap + " 人）— 升級酒館可提升上限" };
    const c = recruitCost(w);
    if ((st.currencies.gold || 0) < c) return { ok: false, reason: "金幣不足（需 " + U.fmt(c) + "）" };
    return { ok: true };
  }
  function recruit(uid) {
    const st = S();
    const w = (st.wanderers || []).find(x => x.uid === uid);
    if (!w || w.dead) return false;
    if (w.state === "exped") { MG.ui.dom.toast("遠征中無法招募 — 召回或等他歸來", "bad", "icon_sword"); return false; } // v225
    const chk = canRecruit(w);
    if (!chk.ok) { MG.ui.dom.toast(chk.reason, "bad", "icon_coin"); return false; }
    const cost = recruitCost(w);
    st.currencies.gold -= cost;
    const h = MG.sys.hunters.create(w.cls, w.rarity);
    h.name = w.name;
    // v225：遠征經驗＋好感階級 → 招募等級（養肥再招募）；v225FIX：設等級後重算 hp/mp（create 以 Lv1 計算 — 原高階招募血量過低）
    h.level = Math.min(200, w.type.level + Math.floor((w.exp || 0) / 120) + favorLv(w));
    h.hp = Math.round(MG.sys.hunters.effectiveStats(h).hp);
    h.mp = Math.round(MG.sys.hunters.effectiveStats(h).mp);
    h.exp = 0;
    st.hunters.push(h);
    st.stats.recruits = (st.stats.recruits || 0) + 1;
    st.stats.wanderersRecruited = (st.stats.wanderersRecruited || 0) + 1;
    // v136：招募後不自動進隊伍（由玩家編入）
    MG.sys.battle.reset();
    st.wanderers.splice(st.wanderers.indexOf(w), 1);
    MG.core.audio.SFX.recruit();
    MG.ui.dom.toast("「" + h.name + "」（" + MG.config.RARITY[h.rarity - 1].name + "）加入王國！", "good", "icon_recruit");
    MG.sys.game.log("招募流浪者「" + h.name + "」-" + cost + " 金", "icon_recruit");
    return h;
  }
  function spriteOf(w) { return CLS_SPR[w.cls] || "h_sword"; }
  function stateLabel(w) {
    if (w.state === "exped") return "遠征中";
    return { enter: "進村", walk: "閒逛", rest: "休息", eat: "用餐", drink: "暢飲", shop: "購物", hunt: "出戰中", leave: "離開" }[w.state] || w.state;
  }
  function dismiss(uid) {
    const st = S();
    const i = (st.wanderers || []).findIndex(w => w.uid === uid);
    if (i === -1) return false;
    if (st.wanderers[i].state === "exped") { MG.ui.dom.toast("遠征中無法驅逐 — 召回或等他歸來", "bad", "icon_sword"); return false; } // v225FIX：驅逐守衛
    st.wanderers.splice(i, 1);
    return true;
  }
  // 批量驅逐（v120）：依稀有度多選，一次請離所有符合的流浪英雄
  function dismissBulk(rarities) {
    const st = S();
    const before = (st.wanderers || []).length;
    st.wanderers = (st.wanderers || []).filter(w => !(rarities[w.rarity] && !w.dead));
    return before - (st.wanderers || []).length;
  }
  return { spawn, tick, recruit, canRecruit, recruitCost, spriteOf, stateLabel, say, walletMult, dismiss, dismissBulk,
    expedLaunch, expedCancel, settleExped, settleAllExped, favorLv, feed,
    bulkFeed, bulkFeedPreview, bulkExpedLaunch }; // v225 遠征＋好感；v233 批量
})();
