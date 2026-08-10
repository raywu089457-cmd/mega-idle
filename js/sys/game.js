/* 放置王國 MEGA IDLE — game state, main loop, economy glue (core engine, owned by Main) */
"use strict";
MG.game = MG.game || {};
MG.sys = MG.sys || {};
MG.sys.game = (function () {
  const U = MG.util;
  const S = () => MG.game.state;

  function init() {
    MG.game.state = MG.core.save.load() || MG.core.save.newState();
    MG.sys.meta.tick();
    MG.sys.battle.reset();
  }
  function afterReset() {
    MG.sys.battle.reset();
    MG.sys.meta.tick();
    if (MG.ui && MG.ui.screens) MG.ui.screens.refreshAll();
  }
  function addGold(n, why) {
    const st = S();
    st.currencies.gold = Math.max(0, st.currencies.gold + n);
    if (n > 0) st.stats.goldEarned += n;
  }
  function kingdomExpNeed(lvl) { return Math.floor(60 * Math.pow(lvl, 1.35)); }
  function addKingdomExp(n) {
    const st = S();
    if (n <= 0) return;
    st.kingdom.exp += n;
    let ups = 0;
    while (st.kingdom.exp >= kingdomExpNeed(st.kingdom.level) && st.kingdom.level < 50) {
      st.kingdom.exp -= kingdomExpNeed(st.kingdom.level);
      st.kingdom.level++; ups++;
    }
    if (ups) {
      // 升級禮包：金幣隨等級成長；每 5 級加贈鑽石（升級有感，不只是門檻）
      const lv = st.kingdom.level;
      const goldGift = Math.floor(200 * Math.pow(lv, 1.4));
      MG.sys.game.addGold(goldGift, "王國升級禮");
      let msg = "王國升級！目前等級 " + lv + "（禮金 +" + MG.util.fmt(goldGift) + "）";
      if (lv % 5 === 0) {
        st.currencies.gems += 10;
        msg += "・鑽石 +10";
      }
      MG.ui.dom.toast(msg, "gold", "icon_castle");
      MG.core.audio.SFX.levelup();
    }
  }
  let lastTick = 0;
  function tick(now) {
    const st = S();
    if (!lastTick) lastTick = now;
    let dt = (now - lastTick) / 1000;
    lastTick = now;
    dt = Math.max(0, Math.min(dt, 1.5)); // 時鐘回跳/切分頁不讓資源倒扣
    st.stats.playSec += dt;
    // buff expiry
    const n = Date.now();
    for (const k of ["potAtk", "potGold", "potExp"]) if (st.buffs[k] && st.buffs[k] < n) st.buffs[k] = 0;
    MG.sys.meta.tick();
    // 流浪英雄（生成/心情/消費/副本）
    if (MG.sys.wanderers) MG.sys.wanderers.tick(dt);
    // hunt sim — 僅在玩家派遣隊伍時運行（未派遣 = 英雄城內待機，不主動戰鬥）
    if (st.hunt && (st.hunt.region !== undefined) && (st.hunt.dispatchIds || []).length > 0) {
      let mult = st.hunt.speed || 1;
      if (st.buffs.boostUntil > n) mult *= 5;
      if (mult > 0) MG.sys.battle.step(dt * mult);
    } else {
      // 自動恢復：非戰鬥中（待機/召回後）英雄緩慢回血 2%/秒、回魔 5%/秒，滿為止
      for (const h of st.hunters || []) {
        if (h.hp !== undefined) {
          const max = MG.sys.hunters.effectiveStats(h).hp;
          if (h.hp < max) h.hp = Math.min(max, h.hp + max * 0.02 * dt);
        }
        if (h.mp !== undefined) {
          const maxMp = MG.sys.hunters.effectiveStats(h).mp;
          if (h.mp < maxMp) h.mp = Math.min(maxMp, h.mp + maxMp * 0.05 * dt);
        }
      }
    }
    autoDrink();
  }
  // 自動喝水：設定閾值後，任一陣營英雄低於 X% 自動消耗藥水（1 秒冷卻）
  function autoDrink() {
    const st = S();
    const ap = st.settings && st.settings.autoPotion;
    if (!ap || (!ap.hp && !ap.mp)) return;
    const n = Date.now();
    if (st.autoPotionCd && n < st.autoPotionCd) return;
    const drink = (defId, isHp, name, icon) => {
      const item = st.inventory.items.find(i => i.defId === defId);
      if (!item || !item.qty) return false;
      item.qty = (item.qty || 1) - 1;
      if (item.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== item.uid);
      const F = MG.sys.battle.get();
      if (F && F.team.length && F.phase === "fight") {
        // 戰鬥中：直接補場上單位並同步回持久狀態
        for (const t of F.team) {
          if (isHp) t.hp = Math.min(t.maxHp, t.hp + Math.round(t.maxHp * 0.5));
          else t.mp = Math.min(t.maxMp, t.mp + Math.round(t.maxMp * 0.5));
        }
        MG.sys.battle.syncTeamHp();
      } else {
        // 非戰鬥：直接補持久狀態
        for (const h of st.hunters) {
          const max = MG.sys.hunters.effectiveStats(h)[isHp ? "hp" : "mp"];
          if (isHp) { if (h.hp === undefined) continue; h.hp = Math.min(max, h.hp + Math.round(max * 0.5)); }
          else { if (h.mp === undefined) continue; h.mp = Math.min(max, h.mp + Math.round(max * 0.5)); }
        }
      }
      MG.core.audio.SFX.potion();
      MG.ui.dom.toast("自動使用：" + name, "good", icon);
      st.autoPotionCd = n + 1000;
      return true;
    };
    if (ap.hp > 0 && st.hunters.some(h => h.hp !== undefined && h.hp / MG.sys.hunters.effectiveStats(h).hp < ap.hp / 100)) {
      drink("item_pot_hp", true, "生命藥水", "icon_pot_hp");
    } else if (ap.mp > 0 && st.hunters.some(h => h.mp !== undefined && h.mp / MG.sys.hunters.effectiveStats(h).mp < ap.mp / 100)) {
      drink("item_pot_mp", false, "魔力藥水", "icon_pot_mp");
    }
  }
  function log(msg, icon) {
    const st = S();
    st.log.unshift({ msg, icon: icon || "", t: Date.now() });
    if (st.log.length > 100) st.log.length = 100; // 保留 100 筆供瀏覽
  }
  return { init, afterReset, addGold, kingdomExpNeed, addKingdomExp, tick, log };
})();
