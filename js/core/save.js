/* 放置王國 MEGA IDLE — save/load, offline rewards, export/import */
"use strict";
MG.core = MG.core || {};
MG.core.save = (function () {
  const KEY = MG.config.SAVE_KEY;
  function newState() {
    const st = {
      v: 1, created: Date.now(), lastSeen: Date.now(),
      settings: { sound: true, music: true, speed: 1, reducedMotion: false, autoPotion: { hp: 0, mp: 0 }, notify: { potion: false, equip: false, gem: false, book: false } },
      currencies: { gold: 300, gems: 120, honor: 0, ticket: 1, book: 0, renameTicket: 0 },
      mats: { iron: 0, herb: 0, leather: 0, crystal: 0, ember: 0, ice: 0, poison: 0, void: 0, myth: 0 },
      kingdom: { level: 1, exp: 0 },
      kingdomName: "梅根王國",
      buildings: { castle: 1, guild: 1, training: 0, forge: 0, gemworks: 0, alchemy: 0, library: 0, warehouse: 1, altar: 0, market: 0 },
      hunters: [],
      formation: [null, null, null, null, null],
      hunt: { region: 0, stage: 1, auto: true, autoRetry: true, speed: 1, dispatchIds: [], restUntil: 0, autoDispatch: false, difficulty: 0, autoAdvance: true, regionClearShown: {} },
      inventory: { items: [], cap: 200 },
      codex: { monsters: {}, items: {}, mats: {} },
      quests: { mainIdx: 0, mainProg: 0, daily: { day: "", list: [] } },
      achievements: {},
      checkin: { month: "", days: [] },
      buffs: { potAtk: 0, potGold: 0, potExp: 0, boostUntil: 0 },
      honorLvls: { dmg: 0, gold: 0, exp: 0 },
      awakenings: 0,
      tutorial: 0,
      stats: { kills: 0, goldEarned: 0, bossKills: 0, playSec: 0, maxStage: 1, recruits: 0, enhances: 0, itemsLooted: 0, maxTierReached: 1, maxRegionReached: 0, maxStageByRegion: {}, codexClaimed: [] },
      usedNames: [],
      wanderers: [],
      log: []
    };
    // v116：新遊戲免費贈送一名初始領地英雄（隨機職業、稀有度 2，自動編入出戰第一位）
    if (MG.sys && MG.sys.hunters && MG.sys.hunters.create) {
      const CLS = Object.keys(MG.data.hunters.classes);
      const h = MG.sys.hunters.create(CLS[Math.floor(Math.random() * CLS.length)], 2);
      st.hunters.push(h);
      st.formation[0] = h.id;
    }
    return st;
  }
  function save() {
    try {
      MG.game.state.lastSeen = Date.now();
      if (MG.data && MG.data.names && MG.data.names.USED) MG.game.state.usedNames = Array.from(MG.data.names.USED);
      localStorage.setItem(KEY, JSON.stringify(MG.game.state));
      return true;
    } catch (e) { return false; }
  }
  function normalize(s) {
    const base = newState();
    // shallow merge with defaults so new fields never break old saves
    for (const k of Object.keys(base)) {
      if (s[k] === undefined) s[k] = base[k];
    }
    s.formation = (s.formation || []).concat(base.formation).slice(0, 5);
    s.hunt = Object.assign({}, base.hunt, s.hunt || {}); // 舊存檔補上 dispatchIds/restUntil
    // 舊存檔相容：統計欄位深度補齊（地圖改進度解鎖後新增的欄位）
    s.stats = Object.assign({}, base.stats, s.stats || {});
    // 地圖改為攻略進度解鎖：舊存檔由 maxTierReached 推導已攻略區域
    // （舊值 = 已擊殺首領區域的 tier：2=森林首領→可達洞穴，故 maxRegionReached 同值）
    if (typeof s.stats.maxRegionReached !== "number") {
      s.stats.maxRegionReached = (s.stats.maxTierReached || 1) > 1 ? (s.stats.maxTierReached || 1) : 0;
    }
    if (!s.stats.maxStageByRegion) s.stats.maxStageByRegion = {};
    // 舊存檔相容：設定欄位深度補齊（自動喝水/通知等新開關）
    s.settings = Object.assign({}, base.settings, s.settings || {});
    s.settings.autoPotion = Object.assign({ hp: 0, mp: 0 }, s.settings.autoPotion || {});
    s.settings.notify = Object.assign({ potion: false, equip: false, gem: false, book: false }, s.settings.notify || {});
    // 貨幣/素材深度補齊：舊存檔可能缺 ticket/book/後期素材欄位
    s.currencies = Object.assign({}, base.currencies, s.currencies || {});
    s.mats = Object.assign({}, base.mats, s.mats || {});
    if (!s.inventory || !s.inventory.items) s.inventory = base.inventory;
    if (!s.honorLvls) s.honorLvls = base.honorLvls;
    if (!s.buffs) s.buffs = base.buffs;
    s.lastSeen = s.lastSeen || Date.now();
    if (MG.data && MG.data.names && MG.data.names.reserve && Array.isArray(s.usedNames)) MG.data.names.reserve(s.usedNames);
    return s;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return normalize(s);
    } catch (e) { return null; }
  }
  function offline() {
    const st = MG.game.state;
    const awayMs = Date.now() - (st.lastSeen || Date.now());
    if (awayMs < 90e3) return null;
    const hours = Math.min(MG.config.OFFLINE_CAP_H, awayMs / 3600e3);
    if (hours < 0.02) return null;
    const rates = MG.sys.battle.rates();
    const gold = Math.floor(rates.goldPerSec * hours * 3600 * MG.config.OFFLINE_RATE);
    const exp = Math.floor(rates.expPerSec * hours * 3600 * MG.config.OFFLINE_RATE);
    const out = { hours, gold, exp, kingdomExp: 0, mats: [], items: 0 };
    // 未派遣 = 無人副本 → 離線零收益（含素材/裝備）
    if (!(st.hunt.dispatchIds || []).length) return out;
    // 王國經驗：離線期間王國持續運作，每小時累積該等級需求 8%（8 小時 ≈ 0.6 級）
    out.kingdomExp = Math.floor(MG.sys.game.kingdomExpNeed(st.kingdom.level) * hours * 0.08);
    // materials: 2-4 kinds scaled by hours
    const region = MG.sys.loot.region(st.hunt.region);
    const pool = region.mats || [];
    const kinds = Math.min(pool.length, 2 + Math.floor(Math.random() * 2));
    const seen = new Set();
    for (let i = 0; i < kinds; i++) {
      const m = pool[Math.floor(Math.random() * pool.length)];
      if (seen.has(m)) continue;
      seen.add(m);
      out.mats.push({ id: m, qty: Math.max(1, Math.floor(hours * (2 + Math.random() * 3))) });
    }
    // equipment: up to 1 + hours/4 pieces from current region tier
    const itemCount = Math.min(3, Math.floor(1 + hours / 4));
    for (let i = 0; i < itemCount; i++) {
      if (Math.random() < 0.6) {
        const it = MG.sys.equipment.gen({ tier: region.tier, cls: undefined });
        out.items++;
        out.item = out.item || [];
        out.item.push(it);
      }
    }
    return out;
  }
  function applyOffline(r) {
    const st = MG.game.state;
    MG.sys.game.addGold(r.gold, "離線獎勵");
    if (r.kingdomExp > 0) MG.sys.game.addKingdomExp(r.kingdomExp); // 離線王國經驗
    const ids = (st.hunt.dispatchIds || []).length ? st.hunt.dispatchIds : st.formation;
    const team = st.hunters.filter(h => ids.includes(h.id));
    if (team.length) {
      const per = Math.floor(r.exp / team.length);
      for (const h of team) MG.sys.hunters.gainExp(h, per);
    // 離線期間自動恢復：全員滿血回歸（長時間休息 = 補滿）
    for (const h of st.hunters) {
      const max = MG.sys.hunters.effectiveStats(h).hp;
      h.hp = Math.round(max);
    }
    }
    for (const mat of r.mats || []) st.mats[mat.id] = (st.mats[mat.id] || 0) + mat.qty;
    for (const it of r.item || []) {
      if (MG.sys.equipment.addToInventory(it)) {
        MG.ui.dom.toast("離線獲得裝備：" + MG.sys.equipment.nameOf(it), "good", "icon_chest");
      }
    }
    st.lastSeen = Date.now();
  }
  function exportSave() {
    const s = JSON.stringify(MG.game.state);
    return btoa(unescape(encodeURIComponent(s)));
  }
  // 匯入前形狀驗證：確保是遊戲存檔結構（不是任意 JSON），避免匯入後崩潰/洗白
  function isValidState(s) {
    return !!s && typeof s === "object"
      && s.currencies && typeof s.currencies === "object"
      && s.kingdom && typeof s.kingdom === "object" && typeof s.kingdom.level === "number"
      && s.buildings && typeof s.buildings === "object"
      && Array.isArray(s.hunters)
      && s.inventory && Array.isArray(s.inventory.items)
      && s.hunt && typeof s.hunt === "object"
      && s.stats && typeof s.stats === "object";
  }
  function importSave(str) {
    try {
      const s = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
      if (!isValidState(s)) return false;
      normalize(s); // 與 load 相同遷移：舊版存檔補齊新欄位
      MG.game.state = s;
      save();
      return true;
    } catch (e) { return false; }
  }
  function reset() {
    localStorage.removeItem(KEY);
    MG.game.state = newState();
    MG.sys.game.afterReset();
  }
  return { newState, save, load, normalize, offline, applyOffline, exportSave, importSave, reset, KEY };
})();
