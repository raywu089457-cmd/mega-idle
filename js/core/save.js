/* 放置王國 MEGA IDLE — save/load, offline rewards, export/import */
"use strict";
MG.core = MG.core || {};
MG.core.save = (function () {
  const KEY = MG.config.SAVE_KEY;
  function newState() {
    const st = {
      v: 1, created: Date.now(), lastSeen: Date.now(),
      backup: { remindedAt: 0, lastExportAt: 0 }, // v646：備份提醒狀態（≥3 天未匯出時提示）
      settings: { sound: true, music: true, speed: 1, reducedMotion: false, autoPotion: { hp: 0, mp: 0 }, notify: { potion: false, equip: false, gem: false, book: false }, autoDismantle: { on: false, set: { 1: true, 2: true } }, wishlist: [], dev: { on: false, cheats: { instantKill: false, godMode: false }, balance: { goldMul: 1, expMul: 1, dropMul: 1, matMul: 1, monsterHp: 1, monsterAtk: 1, heroAtk: 1, heroDef: 1, heroHp: 1, offlineRate: 1, offlineCapH: 12, costMul: 1, trainExpMul: 1 } } },
      currencies: { gold: 300, gems: 120, honor: 0, ticket: 1, book: 0, renameTicket: 0, royalCoins: 0, swapStone: 0 }, // v260 王者幣/置換石
      mats: { iron: 0, herb: 0, leather: 0, crystal: 0, ember: 0, ice: 0, poison: 0, void: 0, myth: 0 },
      kingdom: { level: 1, exp: 0 },
      kingdomName: "梅根王國",
      buildings: { castle: 1, guild: 1, training: 0, forge: 0, gemworks: 0, alchemy: 0, library: 0, warehouse: 1, altar: 0, market: 0 },
      hunters: [],
      formation: [null, null, null, null, null], // activeTeam 隊的鏡像（相容）
      formations: [[null, null, null, null, null], [null, null, null, null, null], [null, null, null, null, null], [null, null, null, null, null], [null, null, null, null, null]],
      activeTeam: 0,
      hunt: { region: 0, stage: 1, auto: true, autoRetry: true, speed: 1, dispatchIds: [], restUntil: 0, autoDispatch: true, difficulty: 0, autoAdvance: true, regionClearShown: {} }, // v565：新存檔「自動續戰」預設開啟 — 派遣制下首次滅團休息完自動再戰（放置迴圈不靜止；舊存檔已存欄位值保留）
      inventory: { items: [], cap: 200, newUids: [] },
      codex: { monsters: {}, items: {}, mats: {}, heroes: {} },
      quests: { mainIdx: 0, mainProg: 0, daily: { day: "", list: [] }, weekly: { week: "", list: [] }, loginDays: { week: "", days: 0, lastDay: "" } },
      achievements: {},
      checkin: { month: "", days: [] },
      buffs: { potAtk: 0, potGold: 0, potExp: 0, boostUntil: 0 },
      honorLvls: { dmg: 0, gold: 0, exp: 0 },
      awakenings: 0,
      traditions: { hunt: 0, forge: 0, commerce: 0, scholar: 0, pioneer: 0 }, // v169 昇華傳統（每輪昇華自選一項永久疊加）
      arena: { week: "", rank: 10, opps: [], fights: 0, day: "", claimed: {} }, // v150 競技場天梯
      events: { week: "", kind: "", pts: 0, redeemed: {}, milestones: {} }, // v152 限時活動
      dungeon: { day: "", uses: {} }, // v154 試煉秘境（每日副本）
      guild: { level: 1, exp: 0, donatedDay: "", donated: 0, tech: {}, boss: { week: "", hp: 0, maxHp: 0, dmg: 0, claimed: {} } }, // v156 公會
      artifacts: { owned: {}, levels: {} }, // v158 神器收藏（v195 精煉等級）
      market: { day: "", bought: {} }, // v159 每日特惠
      abyss: { best: 0, claimed: {}, returnRegion: 0, weekKey: "", weekPeak: 0, weekBest: 0 }, // v160 無盡深淵（v209 週結算）
      abyssShop: { week: "", redeemed: {} }, // v215 深淵商店（碎片兌換深淵神器）
      welcome: { claimed: {} }, // v162 七日豪禮
      worldboss: { day: "", hp: 0, maxHp: 0, dmg: 0, attacks: 0, claimed: {}, killed: false }, // v200 每日世界首領
      honorShop: { week: "", redeemed: {} }, // v205 榮譽商店（每週限量）
      legendBadges: {}, legendShards: 0, // v210 傳說徽章（帳號綁定，跨昇華保留）
      heroShards: 0, heroSynth: { week: "", n4: 0, n5: 0 }, // v235 英雄碎片（遣散轉碎片 → 週限定向合成，跨昇華保留）
      tutorial: 0,
      mapChest: { day: "", opened: false },   // v296：每日地圖寶箱（FNV 日種子，確定性）
      stats: { kills: 0, goldEarned: 0, bossKills: 0, playSec: 0, maxStage: 1, recruits: 0, enhances: 0, itemsLooted: 0, maxTierReached: 1, maxRegionReached: 0, maxStageByRegion: {}, codexClaimed: [], starUps: 0, gemPity: 0, ticketPity: 0, bossRewards: { day: "", perRegion: {} } },
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
      st.formations[0][0] = h.id;
    }
    return st;
  }
  function save() {
    try {
      MG.game.state.lastSeen = Date.now();
      // 鏡像同步：formation = activeTeam 隊
      if (MG.game.state.formations && MG.game.state.formations[MG.game.state.activeTeam || 0]) {
        MG.game.state.formation = MG.game.state.formations[MG.game.state.activeTeam || 0].slice();
      }
      if (MG.data && MG.data.names && MG.data.names.USED) MG.game.state.usedNames = Array.from(MG.data.names.USED);
      localStorage.setItem(KEY, JSON.stringify(MG.game.state));
      return true;
    } catch (e) { return false; }
  }
  function normalize(s) {
    const base = newState();
    // v130 五隊編制遷移（在淺合併之前：避免 base 的新手英雄污染舊檔的隊）
    const legacyFormation = (s.formation || []).concat([null, null, null, null, null]).slice(0, 5);
    if (!Array.isArray(s.formations) || !s.formations.length) {
      s.formations = [legacyFormation];
      for (let i = 1; i < 5; i++) s.formations.push([null, null, null, null, null]);
    }
    for (let i = 0; i < 5; i++) {
      if (!Array.isArray(s.formations[i])) s.formations[i] = [null, null, null, null, null];
      s.formations[i] = s.formations[i].concat([null, null, null, null, null]).slice(0, 5);
    }
    if (s.activeTeam === undefined) s.activeTeam = 0;
    s.activeTeam = Math.max(0, Math.min(4, s.activeTeam || 0));
    // shallow merge with defaults so new fields never break old saves
    for (const k of Object.keys(base)) {
      if (s[k] === undefined) s[k] = base[k];
    }
    s.formation = s.formations[s.activeTeam].slice(); // 鏡像同步
    s.hunt = Object.assign({}, base.hunt, s.hunt || {}); // 舊存檔補上 dispatchIds/restUntil
    // v296：每日地圖寶箱（舊檔補空；day 不一致視為未開）
    s.mapChest = Object.assign({ day: "", opened: false }, s.mapChest || {});
    // 舊存檔相容：統計欄位深度補齊（地圖改進度解鎖後新增的欄位）
    // v280FIX：先讀原始 stats 再合併 — 否則 base 的 maxRegionReached:0 會填補舊檔缺欄，
    // 讓下方推導分支變死碼（舊檔玩家地圖全鎖在 region 0）
    const rawStats = s.stats || {};
    s.stats = Object.assign({}, base.stats, rawStats);
    // 地圖改為攻略進度解鎖：舊存檔由 maxTierReached 推導已攻略區域
    // （舊值 = 已擊殺首領區域的 tier：2=森林首領→可達洞穴，故 maxRegionReached 同值）
    if (typeof rawStats.maxRegionReached !== "number") {
      s.stats.maxRegionReached = (rawStats.maxTierReached || 1) > 1 ? (rawStats.maxTierReached || 1) : 0;
    }
    if (!s.stats.maxStageByRegion) s.stats.maxStageByRegion = {};
    // v215：深淵商店（舊檔補空，ensure 依週重置）
    s.abyssShop = Object.assign({ week: "", redeemed: {} }, s.abyssShop || {});
    if (!s.abyssShop.redeemed || typeof s.abyssShop.redeemed !== "object") s.abyssShop.redeemed = {};
    // v210：傳說徽章（舊檔補空）
    if (!s.legendBadges || typeof s.legendBadges !== "object") s.legendBadges = {};
    if (typeof s.legendShards !== "number") s.legendShards = 0;
    // v235：英雄碎片（舊檔補空 — 跨昇華帳號資產）
    if (typeof s.heroShards !== "number") s.heroShards = 0;
    if (!s.heroSynth || typeof s.heroSynth !== "object") s.heroSynth = { week: "", n4: 0, n5: 0 };
    // v209：BOSS 每日首殺追蹤（舊檔補空；保留 day — 僅缺 perRegion 時補物件，避免重發首殺獎勵）
    if (!s.stats.bossRewards || typeof s.stats.bossRewards !== "object") {
      s.stats.bossRewards = { day: "", perRegion: {} };
    } else if (!s.stats.bossRewards.perRegion || typeof s.stats.bossRewards.perRegion !== "object") {
      s.stats.bossRewards.perRegion = {};
    }
    // 舊存檔相容：設定欄位深度補齊（自動喝水/通知等新開關）
    s.settings = Object.assign({}, base.settings, s.settings || {});
    // v120：自動分解由「低於 N 星」改為多選稀有度（舊檔遷移）
    const adOld = s.settings.autoDismantle;
    if (adOld && adOld.below !== undefined && !adOld.set) {
      const set = {};
      for (let r = 1; r < (adOld.below || 2); r++) set[r] = true;
      adOld.set = set;
      delete adOld.below;
    }
    s.settings.autoPotion = Object.assign({ hp: 0, mp: 0 }, s.settings.autoPotion || {});
    s.settings.notify = Object.assign({ potion: false, equip: false, gem: false, book: false }, s.settings.notify || {});
    // v153：心願清單（舊檔補空；非法職業過濾）
    if (!Array.isArray(s.settings.wishlist)) s.settings.wishlist = [];
    s.settings.wishlist = s.settings.wishlist.filter(c => typeof c === "string" && MG.config.CLASS_ELEMENT[c]).slice(0, 2);
    // 開發者模式（設定頁「開發者功能」）：深度補齊（舊檔缺 dev 欄位）
    s.settings.dev = Object.assign({}, base.settings.dev, s.settings.dev || {});
    if (s.settings.dev) {
      s.settings.dev.cheats = Object.assign({}, base.settings.dev.cheats, s.settings.dev.cheats || {});
      s.settings.dev.balance = Object.assign({}, base.settings.dev.balance, s.settings.dev.balance || {});
    }
    // 貨幣/素材深度補齊：舊存檔可能缺 ticket/book/後期素材欄位
    s.currencies = Object.assign({}, base.currencies, s.currencies || {});
    s.mats = Object.assign({}, base.mats, s.mats || {});
    if (!s.inventory || !s.inventory.items) s.inventory = base.inventory;
    s.codex = Object.assign({}, base.codex, s.codex || {});
    if (!s.codex.heroes) s.codex.heroes = {};
    // v180 英雄圖鑑：舊存檔以現有名冊回填（已遣散者無法追溯）
    if (Object.keys(s.codex.heroes).length === 0 && (s.hunters || []).length) {
      for (const h of s.hunters) {
        if (h && h.cls && MG.config.CLASS_ELEMENT[h.cls]) s.codex.heroes[h.cls] = (s.codex.heroes[h.cls] || 0) + 1;
      }
    }
    if (!s.honorLvls) s.honorLvls = base.honorLvls;
    if (!s.buffs) s.buffs = base.buffs;
    // v150：競技場（舊檔補預設天梯狀態）
    s.arena = Object.assign({}, base.arena, s.arena || {});
    if (!s.arena.claimed || typeof s.arena.claimed !== "object") s.arena.claimed = {};
    // v151：每週任務（舊檔補空清單，ensureWeekly 會依週期重建）
    if (!s.quests.weekly) s.quests.weekly = { week: "", list: [] };
    // v152：限時活動（舊檔補預設，ensure 會依週期初始化）
    s.events = Object.assign({ week: "", kind: "", pts: 0, redeemed: {}, milestones: {} }, s.events || {});
    // v154：試煉秘境（舊檔補預設，ensure 會依日期重置次數）
    s.dungeon = Object.assign({ day: "", uses: {} }, s.dungeon || {});
    // v156：公會（舊檔補預設，ensure 會依週期初始化首領）
    s.guild = Object.assign({ level: 1, exp: 0, donatedDay: "", donated: 0, tech: {}, boss: { week: "", hp: 0, maxHp: 0, dmg: 0, claimed: {} } }, s.guild || {});
    if (!s.guild.tech || typeof s.guild.tech !== "object") s.guild.tech = {};
    if (!s.guild.boss || typeof s.guild.boss !== "object") s.guild.boss = { week: "", hp: 0, dmg: 0, claimed: {} };
    // v158：神器收藏（舊檔補空）；v195：精煉等級表（舊檔補空）
    if (!s.artifacts || typeof s.artifacts !== "object") s.artifacts = { owned: {}, levels: {} };
    if (!s.artifacts.owned || typeof s.artifacts.owned !== "object") s.artifacts.owned = {};
    if (!s.artifacts.levels || typeof s.artifacts.levels !== "object") s.artifacts.levels = {};
    // v159：每日特惠（舊檔補空，ensure 依日期重置）
    s.market = Object.assign({ day: "", bought: {} }, s.market || {});
    if (!s.market.bought || typeof s.market.bought !== "object") s.market.bought = {};
    // v160：無盡深淵（舊檔補空）
    s.abyss = Object.assign({ best: 0, claimed: {}, returnRegion: 0, weekKey: "", weekPeak: 0, weekBest: 0 }, s.abyss || {});
    if (!s.abyss.claimed || typeof s.abyss.claimed !== "object") s.abyss.claimed = {};
    // v162：七日豪禮（舊檔補空）
    s.welcome = Object.assign({ claimed: {} }, s.welcome || {});
    if (!s.welcome.claimed || typeof s.welcome.claimed !== "object") s.welcome.claimed = {};
    // v169：昇華傳統（舊檔補零）
    s.traditions = Object.assign({ hunt: 0, forge: 0, commerce: 0, scholar: 0, pioneer: 0 }, s.traditions || {});
    // v147：英雄升星系統——舊檔補 bornRarity（出生稀有度，升星前的星級即稀有度）
    if (Array.isArray(s.hunters)) for (const h of s.hunters) {
      if (h && h.bornRarity === undefined) h.bornRarity = h.rarity || 1;
    }
    s.lastSeen = s.lastSeen || Date.now();
    // v646：備份提醒狀態（舊檔補零 — 未匯出過且帳齡≥3 天會提示）
    s.backup = Object.assign({ remindedAt: 0, lastExportAt: 0 }, s.backup || {});
    if (MG.data && MG.data.names && MG.data.names.reserve && Array.isArray(s.usedNames)) MG.data.names.reserve(s.usedNames);
    return s;
  }
  /* v646：首次遊玩 ≥3 天且從未成功匯出 → 提醒備份；稍後再說則 7 天內不再彈 */
  function shouldRemindBackup() {
    const st = MG.game.state;
    const b = st.backup || (st.backup = { remindedAt: 0, lastExportAt: 0 });
    const age = Date.now() - (st.created || Date.now());
    if (age < 3 * 864e5) return false;
    if (b.lastExportAt) return false;
    if (b.remindedAt && (Date.now() - b.remindedAt) < 7 * 864e5) return false;
    return true;
  }
  function markBackupReminded() {
    const st = MG.game.state;
    st.backup = Object.assign({ remindedAt: 0, lastExportAt: 0 }, st.backup || {});
    st.backup.remindedAt = Date.now();
    save();
  }
  function markExported() {
    const st = MG.game.state;
    st.backup = Object.assign({ remindedAt: 0, lastExportAt: 0 }, st.backup || {});
    st.backup.lastExportAt = Date.now();
    st.backup.remindedAt = Date.now();
    save();
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return normalize(s);
    } catch (e) { return null; }
  }
  /* v228 離線收益預覽（與 offline() 同公式 — rates×3600×OFFLINE_RATE；未派遣 rates 回 0 → 預覽 0） */
  function previewOffline() {
    const rates = MG.sys.battle.rates({ noFocus: true }); // v234：離線結算排除在線專注
    const db = MG.sys.dev ? MG.sys.dev.balance() : null; // 開發者：離線收益倍率
    return {
      goldPerH: Math.floor(rates.goldPerSec * 3600 * MG.config.OFFLINE_RATE * (db ? db.offlineRate : 1)),
      expPerH: Math.floor(rates.expPerSec * 3600 * MG.config.OFFLINE_RATE * (db ? db.offlineRate : 1))
    };
  }
  function offline() {
    const st = MG.game.state;
    const awayMs = Date.now() - (st.lastSeen || Date.now());
    if (awayMs < 90e3) return null;
    // 開發者：離線時數上限與收益倍率（平衡拉桿；未開 dev 時為原值）
    const db = MG.sys.dev ? MG.sys.dev.balance() : null;
    const capH = db ? db.offlineCapH : MG.config.OFFLINE_CAP_H;
    const offMul = db ? db.offlineRate : 1;
    const hours = Math.min(capH, awayMs / 3600e3);
    if (hours < 0.02) return null;
    const rates = MG.sys.battle.rates({ noFocus: true }); // v234：離線結算排除在線專注
    const gold = Math.floor(rates.goldPerSec * hours * 3600 * MG.config.OFFLINE_RATE * offMul);
    const exp = Math.floor(rates.expPerSec * hours * 3600 * MG.config.OFFLINE_RATE * offMul);
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
    // v241FIX：確定性預測（offline() 不入庫 — 原「生成當下已全滿才計數」部分滿包 0 回報；
    // rolled − 空位 = 依序入庫滿即失敗的精確預測）
    const itemCount = Math.min(3, Math.floor(1 + hours / 4));
    let rolled = 0;
    for (let i = 0; i < itemCount; i++) {
      if (Math.random() < 0.6) {
        const it = MG.sys.equipment.gen({ tier: region.tier, cls: undefined });
        out.items++;
        out.item = out.item || [];
        out.item.push(it);
        rolled++;
      }
    }
    const freeSlots = Math.max(0, MG.sys.equipment.inventoryCap() - st.inventory.items.length);
    out.lostItems = Math.max(0, rolled - freeSlots);
    return out;
  }
  function applyOffline(r) {
    const st = MG.game.state;
    let actualLost = 0; // v241：離線滿包實際損失（獨立於預算）
    // v225：離線遠征牆鐘結算（settleExped 直接入帳 — 摘要併入離線結果供彈窗顯示）
    if (MG.sys.wanderers && MG.sys.wanderers.settleAllExped) r.expeds = MG.sys.wanderers.settleAllExped();
    // v271：委託遠征營離線結算（同牆鐘模式 — 完成自動入帳；摘要併入 r.expedEx）
    if (MG.sys.expedition && MG.sys.expedition.settleAll) r.expedEx = MG.sys.expedition.settleAll();
    // v240：競技場離線防守模擬（排名零影響 — 第三離線錨點；單一擁有權在 applyOffline 無雙重結算）
    // v240FIX：r.defense 已由彈窗預先模擬時沿用（跨午夜 defDay 重置會重發 — 與遠征 settled 同思路）
    if (MG.sys.arena && MG.sys.arena.simulateDefense && !r.defense) r.defense = MG.sys.arena.simulateDefense(r.hours || 0);
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
    if ((r.mats || []).length && MG.sys.meta && MG.sys.meta.bump) MG.sys.meta.bump("mat", r.mats.reduce((a, m) => a + m.qty, 0)); // v214FIX：離線素材總量計入每日 d8（放置主收益來源 — 原零進度）
    for (const it of r.item || []) {
      if (MG.sys.equipment.addToInventory(it)) {
        MG.ui.dom.toast("離線獲得裝備：" + MG.sys.equipment.nameOf(it), "good", "icon_chest");
      } else {
        // v241FIX：實際損失獨立計數（不疊加預算 — 彈窗期間戰鬥續掉造成超額損失時補 toast）
        actualLost++;
      }
    }
    if (actualLost > 0 && actualLost !== (r.lostItems || 0)) {
      MG.ui.dom.toast("⚠ 背包已滿：實際 " + actualLost + " 件裝備未能帶回", "bad", "icon_hammer");
    }
    st.lastSeen = Date.now();
  }
  /* v144：存檔碼壓縮 — 瀏覽器內建 CompressionStream(deflate) 把 base64 碼縮短 80%+。
     格式：MGZ1:<deflate 壓縮後 base64>；舊版純 base64 碼（無前綴）仍可匯入。 */
  const SAVE_CODE_PREFIX = "MGZ1:";
  function bytesToB64(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i += 8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8000));
    return btoa(bin);
  }
  function b64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function exportSave() {
    const s = JSON.stringify(MG.game.state);
    if (typeof CompressionStream === "undefined") return btoa(unescape(encodeURIComponent(s))); // 舊瀏覽器 fallback
    try {
      const stream = new Blob([s]).stream().pipeThrough(new CompressionStream("deflate"));
      const buf = await new Response(stream).arrayBuffer();
      return SAVE_CODE_PREFIX + bytesToB64(new Uint8Array(buf));
    } catch (e) { return btoa(unescape(encodeURIComponent(s))); }
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
  async function importSave(str) {
    try {
      let raw = str.trim();
      let json = null;
      if (raw.startsWith(SAVE_CODE_PREFIX)) {
        // v144 壓縮碼
        if (typeof DecompressionStream === "undefined") return false;
        const stream = new Blob([b64ToBytes(raw.slice(SAVE_CODE_PREFIX.length))]).stream().pipeThrough(new DecompressionStream("deflate"));
        json = await new Response(stream).text();
      } else {
        json = decodeURIComponent(escape(atob(raw))); // 舊版純 base64
      }
      const s = JSON.parse(json);
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
  return { newState, save, load, normalize, offline, applyOffline, previewOffline, exportSave, importSave, reset, KEY, shouldRemindBackup, markBackupReminded, markExported };
})();
