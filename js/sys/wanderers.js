/* 放置王國 MEGA IDLE — 流浪英雄系統（完整版：生成/心情/消費循環/狩獵外出/點擊招募）
   設計源：mega-idle-web-three.js 流浪獵人機制（FSM + 心情 + 商店消費 + 出村狩獵 + 招募），依本遊戲建築/經濟校準。 */
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
    w.bubbleUntil = Date.now() + 7000; // 對話顯示 7 秒，不跳太快
  }
  function gotoLeave(w) { w.state = "leave"; w.tx = null; say(w, D.bubble("leave"), "👋"); }
  // 目標點：各建築門前（與王國城鎮擺位對齊，建築前方 158 地面線）
  const TOWN_POINTS = {
    castle: { x: 52, y: 158 }, guild: { x: 148, y: 158 },
    market: { x: 172, y: 158 }, forge: { x: 340, y: 158 }, alchemy: { x: 268, y: 158 },
    warehouse: { x: 76, y: 158 }, training: { x: 244, y: 158 }, library: { x: 364, y: 158 },
    gemworks: { x: 436, y: 158 }, altar: { x: 460, y: 158 },
    gate: { x: 16, y: 158 } // 狩獵/離開的村口
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
      if (Math.random() < w.type.matChance) {
        const mat = U.pick(["herb", "iron", "leather"]);
        st.mats[mat] = (st.mats[mat] || 0) + 1;
        MG.sys.game.log("流浪者「" + w.name + "」狩獵歸來 +" + gold + " 金" + (mat ? "・" + MG.config.MATS[mat].name + "×1" : ""), "icon_sword");
      }
      w.mood = U.clamp(w.mood + 10, 0, 100);
      say(w, "狩獵歸來！賺了 " + gold + " 金", "🗡️");
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
      if (w.bubble && w.bubbleUntil < now) w.bubble = null;
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
  function recruitCost(w) { return Math.round((100 + w.type.level * 40) * walletMult(w.rarity)); }
  function canRecruit(w) {
    const st = S();
    if (st.hunters.length >= MG.config.MAX_HUNTERS) return { ok: false, reason: "獵人名冊已滿（40 人）" };
    const c = recruitCost(w);
    if ((st.currencies.gold || 0) < c) return { ok: false, reason: "金幣不足（需 " + U.fmt(c) + "）" };
    return { ok: true };
  }
  function recruit(uid) {
    const st = S();
    const w = (st.wanderers || []).find(x => x.uid === uid);
    if (!w || w.dead) return false;
    const chk = canRecruit(w);
    if (!chk.ok) { MG.ui.dom.toast(chk.reason, "bad", "icon_coin"); return false; }
    const cost = recruitCost(w);
    st.currencies.gold -= cost;
    const h = MG.sys.hunters.create(w.cls, w.rarity);
    h.name = w.name;
    h.level = Math.min(200, w.type.level);
    h.exp = 0;
    st.hunters.push(h);
    st.stats.recruits = (st.stats.recruits || 0) + 1;
    st.stats.wanderersRecruited = (st.stats.wanderersRecruited || 0) + 1;
    // 自動編入第一個空位（與招募系統一致）
    const slots = MG.sys.buildings.effects().formationSlots;
    for (let i = 0; i < slots; i++) {
      if (!st.formation[i]) { st.formation[i] = h.id; break; }
    }
    MG.sys.battle.reset();
    st.wanderers.splice(st.wanderers.indexOf(w), 1);
    MG.core.audio.SFX.recruit();
    MG.ui.dom.toast("「" + h.name + "」（" + MG.config.RARITY[h.rarity - 1].name + "）加入王國！", "good", "icon_recruit");
    MG.sys.game.log("招募流浪者「" + h.name + "」-" + cost + " 金", "icon_recruit");
    return h;
  }
  function spriteOf(w) { return CLS_SPR[w.cls] || "h_sword"; }
  function stateLabel(w) {
    return { enter: "進村", walk: "閒逛", rest: "休息", eat: "用餐", drink: "暢飲", shop: "購物", hunt: "狩獵中", leave: "離開" }[w.state] || w.state;
  }
  return { spawn, tick, recruit, canRecruit, recruitCost, spriteOf, stateLabel, say, walletMult };
})();
