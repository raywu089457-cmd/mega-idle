/* 放置王國 MEGA IDLE — equipment screen: inventory, item modal, crafting, gems (slice B2 owns) */
"use strict";
MG.ui = MG.ui || {};
MG.ui.equipment = (function () {
  const S = () => MG.game.state;
  const EQ = () => MG.sys.equipment;
  const ED = () => MG.data.equipment;
  const STAT_LABEL = { atk: "攻擊", def: "防禦", hp: "生命", crit: "暴擊" };
  let root, gridEl, tab = "all", tabsEl;

  function isGem(i) { return !!ED().GEMS[i.defId.split("_")[0]]; }
  // v559：非裝備消耗品（藥水/沙漏等 defId=item_*）— 無 rarity 語義，分解/強化/穿戴一律不適用
  function isConsumable(i) { return !isGem(i) && !MG.config.SLOTS.includes(EQ().slotOf(i)); }
  function tabItems() {
    const st = S();
    let items = st.inventory.items;
    // v138：素材（mat_*）不顯示於裝備頁（素材倉庫於王國頁管理）
    items = items.filter(i => !(i.defId || "").startsWith("mat_"));
    // v133：全部/部位分頁皆套用品質與套裝篩選（預設「全部品質/全部套裝」= 全顯示，含寶石）
    if (rarityFilter > 0) items = items.filter(i => !isGem(i) && i.rarity === rarityFilter);
    if (setFilter === "none") items = items.filter(i => !i.set);
    else if (setFilter !== "all") items = items.filter(i => i.set === setFilter);
    // v136 屬性條篩選：顯示含所選屬性（數值>0）的裝備；寶石不參與
    const attrOn = Object.keys(attrFilter).filter(k => attrFilter[k]);
    if (attrOn.length) {
      items = items.filter(i => {
        if (isGem(i)) return false;
        if (!MG.config.SLOTS.includes(EQ().slotOf(i))) return false; // 藥水等消耗品不參與
        const s2 = EQ().itemStats(i);
        return attrOn.some(k => (s2[k] || 0) > 0);
      });
    }
    // v142：未穿戴 / 可強化 快速 toggle
    if (unwornOnly) {
      const worn = new Set();
      for (const h of st.hunters || []) for (const k in (h.equip || {})) if (h.equip[k]) worn.add(h.equip[k]);
      items = items.filter(i => !worn.has(i.uid));
    }
    if (enhanceOnly) items = items.filter(i => EQ().canEnhance(i));
    if (tab === "all") {
      // v140：「全部」也套用排序（寶石恆排最後，避免 itemScore 對寶石計算）
      return [...items].sort((a, b) => (isGem(a) ? 1 : 0) - (isGem(b) ? 1 : 0) || (sortMode === "rarity"
        ? (b.rarity - a.rarity) || (b.tier - a.tier) || (b.enhance || 0) - (a.enhance || 0)
        : sortMode === "power"
          ? (EQ().itemScore(b) - EQ().itemScore(a)) || (b.tier - a.tier) || (b.rarity - a.rarity)
          : (b.tier - a.tier) || (b.rarity - a.rarity) || (b.enhance || 0) - (a.enhance || 0)));
    }
    const eq = items.filter(i => !isGem(i));
    let list;
    if (tab === "weapon") list = eq.filter(i => EQ().slotOf(i) === "weapon");
    else if (tab === "armor") list = eq.filter(i => ["helmet", "armor", "boots"].includes(EQ().slotOf(i)));
    else if (tab === "acc") list = eq.filter(i => ["necklace", "ring", "charm"].includes(EQ().slotOf(i)));
    else list = eq;
    // v119 排序：階級（預設）/稀有度
    if (sortMode === "rarity") list = [...list].sort((a, b) => (b.rarity - a.rarity) || (b.tier - a.tier) || (b.enhance || 0) - (a.enhance || 0));
    else if (sortMode === "power") list = [...list].sort((a, b) => (EQ().itemScore(b) - EQ().itemScore(a)) || (b.tier - a.tier) || (b.rarity - a.rarity));
    else if (sortMode === "new") list = [...list].sort((a, b) => ((st.inventory.newUids || []).includes(b.uid) ? 1 : 0) - ((st.inventory.newUids || []).includes(a.uid) ? 1 : 0) || (EQ().itemScore(b) - EQ().itemScore(a)));
    else list = [...list].sort((a, b) => (b.tier - a.tier) || (b.rarity - a.rarity) || (b.enhance || 0) - (a.enhance || 0));
    return list;
  }
  function gems() {
    return S().inventory.items.filter(isGem);
  }
  function eligibleHunter(h, item) {
    const slot = EQ().slotOf(item);
    if (slot !== "weapon") return true;
    return !item.wtype || item.wtype === MG.config.CLASS_WEAPONS[h.cls];
  }
  // 與現有裝備的數值差（crit 以百分比點計）
  function statDelta(cur, item) {
    const A = cur ? EQ().itemStats(cur) : { atk: 0, def: 0, hp: 0, crit: 0 };
    const B = EQ().itemStats(item);
    const out = [];
    for (const k of ["atk", "def", "hp", "crit"]) {
      const d = Math.round(((B[k] || 0) - (A[k] || 0)) * 100) / 100;
      if (d !== 0) out.push({ label: STAT_LABEL[k], d, crit: k === "crit" });
    }
    return out;
  }
  function fmtDelta(d, crit) {
    const v = crit ? (d * 100).toFixed(1) + "%" : MG.util.fmt(d);
    return (d > 0 ? "+" : "") + v;
  }
  function deltaText(delta) {
    return delta.map(dl => dl.label + " " + fmtDelta(dl.d, dl.crit)).join(" ／ ");
  }
  function deltaClass(delta) {
    const sum = delta.reduce((a, dl) => a + dl.d, 0);
    return sum > 0 ? "var(--good, #7ee787)" : sum < 0 ? "#ff6b6b" : "var(--dim)";
  }
  // v202 美術：強化成功格閃（金框縮放 0.32s — reduced-motion 省略）
  function flashCell(uid) {
    if (!gridEl) return;
    if (S().settings && S().settings.reducedMotion) return;
    const el = gridEl.querySelector('[data-uid="' + uid + '"]');
    if (!el || !el.animate) return;
    el.animate([
      { boxShadow: "0 0 0 rgba(255,209,102,0)", transform: "scale(1)" },
      { boxShadow: "0 0 0 2px rgba(255,209,102,.4), 0 0 18px rgba(255,209,102,.9)", transform: "scale(1.06)", offset: 0.4 },
      { boxShadow: "0 0 0 rgba(255,209,102,0)", transform: "scale(1)" }
    ], { duration: 320, easing: "ease-out" });
  }
  function cell(item) {
    const slot = EQ().slotOf(item);
    const locked = !!item.locked;
    const st0 = S();
    const wearer = st0.hunters.find(h => h.equip && h.equip[slot] === item.uid);
    const cellEl = MG.ui.dom.h("div", {
      class: "eq-cell eq-b" + Math.min(6, Math.max(1, item.rarity || 1)) + (locked ? " eq-locked" : ""), // v559：||1 防 NaN 類名（消耗品已分流 consumableCell，雙層保險）
      "data-uid": item.uid, // v202：強化成功格閃定位
      style: {
        aspectRatio: "1",
        contentVisibility: "auto", containIntrinsicSize: "60px"
      },
      title: "★" + item.rarity + " " + (MG.config.RARITY[item.rarity - 1] || {}).name + " " + EQ().nameOf(item) + (item.enhance > 0 ? " +" + item.enhance : "") + (locked ? "（已鎖定）" : "") + (wearer ? "（" + wearer.name + " 穿戴中）" : ""),
      on: {
        click: () => { if (multiMode) { toggleMulti(item); return; } openQuickActions(item, cellEl); },
        // v142：長按進入多選模式（原快捷選單改為點擊觸發）
        pointerdown: (e) => { e.preventDefault(); cellEl._pt = { x: e.clientX, y: e.clientY, t: setTimeout(() => { if (multiMode) exitMulti(); else enterMulti(); }, 500) }; },
        pointermove: (e) => { if (cellEl._pt && Math.abs(e.clientX - cellEl._pt.x) + Math.abs(e.clientY - cellEl._pt.y) > 8) { clearTimeout(cellEl._pt.t); cellEl._pt = null; } },
        pointerup: () => { if (cellEl._pt) { clearTimeout(cellEl._pt.t); cellEl._pt = null; } },
        pointerleave: () => { if (cellEl._pt) { clearTimeout(cellEl._pt.t); cellEl._pt = null; } }
      }
    },
      MG.ui.dom.icon(slot === "weapon" ? ({ sword: "icon_sword", bow: "icon_bow", staff: "icon_staff", dagger: "icon_dagger", greatsword: "icon_greatsword", mace: "icon_mace" }[item.wtype] || "icon_weapon") : "icon_" + slot, 26),
      MG.ui.dom.h("div", { class: "eq-name" + (wearer ? " worn" : "") }, EQ().nameOf(item)));
    // 鎖定（右上）
    cellEl.appendChild(MG.ui.dom.h("div", {
      style: { position: "absolute", top: 0, right: 0, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, zIndex: 3, cursor: "pointer", opacity: locked ? 1 : 0.45, filter: "drop-shadow(0 1px 1px #000)" },
      on: { click: (e) => { e.stopPropagation(); item.locked = !item.locked; renderTab(); } }
    }, locked ? "🔒" : "🔓"));
    // 強化（左上）
    if (item.enhance > 0) cellEl.appendChild(MG.ui.dom.h("div", { style: { position: "absolute", top: 0, left: 1, fontSize: 8, fontWeight: 900, color: "#3a2a00", background: "linear-gradient(180deg,#ffe08a,#ffb35c)", borderRadius: 5, padding: "0 3px", lineHeight: "12px", boxShadow: "0 1px 2px rgba(0,0,0,.4)" } }, "+" + item.enhance));
    // 套裝：右上角下方 4px 色點
    if (item.set && ED().sets[item.set]) {
      cellEl.appendChild(MG.ui.dom.h("div", { style: { position: "absolute", top: 13, right: 1, width: 5, height: 5, borderRadius: "50%", background: ED().SET_COLORS[item.set] || "var(--gold)", boxShadow: "0 0 4px " + (ED().SET_COLORS[item.set] || "#ffd166") } }));
    }
    // 寶石孔：底部左側 5px 圓點
    const socks = item.gems || [];
    if (socks.length) {
      cellEl.appendChild(MG.ui.dom.h("div", { style: { position: "absolute", bottom: 1, left: 2, display: "flex", gap: 2 } },
        socks.map(g => MG.ui.dom.h("div", { style: { width: 4, height: 4, borderRadius: "50%", background: g ? "#ffd166" : "rgba(255,255,255,.14)", border: "1px solid " + (g ? "#ffd166" : "rgba(255,255,255,.25)") } }))));
    }
    if (item.qty && item.qty > 1) cellEl.appendChild(MG.ui.dom.h("div", { style: { position: "absolute", bottom: 0, right: 1, fontSize: 8, fontWeight: 900, lineHeight: "10px", textShadow: "0 1px 1px #000" } }, "x" + item.qty));
    // v140：已穿戴「穿」徽章（頂中）
    if (wearer) cellEl.appendChild(MG.ui.dom.h("div", { style: { position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", fontSize: 8, fontWeight: 900, color: "#3a2a00", background: "linear-gradient(180deg,#ffd166,#f0a83a)", borderRadius: 4, padding: "0 4px", lineHeight: "12px", boxShadow: "0 1px 2px rgba(0,0,0,.4)", zIndex: 2 } }, "穿"));

    // v140：新獲得 NEW 光點（查看後消失）
    if (st0.inventory.newUids && st0.inventory.newUids.includes(item.uid)) {
      cellEl.appendChild(MG.ui.dom.h("div", { style: { position: "absolute", bottom: 1, left: 2, fontSize: 8, fontWeight: 900, color: "#0a2a10", background: "#57c96b", borderRadius: 4, padding: "0 3px", lineHeight: "11px", boxShadow: "0 0 5px rgba(87,201,107,.8)", zIndex: 2 } }, "NEW"));
    }
    return cellEl;
  }
  /* v142 多選模式：長按進入、點格勾選、底部操作條批量分解/鎖定 */
  let multiMode = false;
  const multiSel = new Set();
  let multiBar = null, multiCountEl = null, multiBarParent = null;
  function enterMulti() {
    if (multiMode) return;
    multiMode = true;
    multiSel.clear();
    MG.ui.dom.toast("多選模式：點選裝備，底部批量處理（再長按任一格或點「完成」退出）", "", "icon_hammer");
    if (!multiBarParent) {
      const body = document.querySelector('#stage .screen');
      if (!body) return;
      multiBarParent = body;
      multiBar = MG.ui.dom.h("div", { style: { position: "sticky", bottom: 0, background: "linear-gradient(180deg,#232642,#1a1c30)", borderTop: "2px solid var(--line)", padding: "8px 10px", display: "flex", gap: 5, alignItems: "center", zIndex: 5, flexWrap: "wrap" } },
        MG.ui.dom.h("span", { style: { fontWeight: 900, fontSize: 13, color: "var(--gold)", whiteSpace: "nowrap" } }, "已選 0"),
        // v241 全選：與 tabItems() 篩選輸出同源（尊重分頁/品質/套裝/屬性/未穿戴）— 穿戴/鎖定由既有守衛跳過；再點取消
        MG.ui.dom.h("button", { class: "btn sm", style: { flexShrink: 0, whiteSpace: "nowrap" }, on: { click: toggleSelectAll } }, "全選"),
        MG.ui.dom.h("button", { class: "btn sm gold", style: { flex: 1, whiteSpace: "nowrap" }, on: { click: multiEnhance } }, "強化+1"), // v223：批量強化
        MG.ui.dom.h("button", { class: "btn sm gold", style: { flex: 1, whiteSpace: "nowrap" }, on: { click: multiEnhanceMax } }, "到滿"), // v243：一次到頂
        MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1, whiteSpace: "nowrap" }, on: { click: multiSocket } }, "鑲嵌"), // v243：空槽自動填最高階寶石
        MG.ui.dom.h("button", { class: "btn sm gold", style: { flex: 1, whiteSpace: "nowrap" }, on: { click: multiDismantle } }, "分解"),
        MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1, whiteSpace: "nowrap" }, on: { click: multiLock } }, "鎖定/解鎖"),
        MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1, whiteSpace: "nowrap" }, on: { click: exitMulti } }, "完成"));
      body.appendChild(multiBar);
      multiCountEl = multiBar.children[0];
    } else multiBar.style.display = "";
    multiBar.style.display = "flex";
    renderTab(true);
  }
  function exitMulti() {
    multiMode = false;
    multiSel.clear();
    if (multiBar) multiBar.style.display = "none";
    renderTab(true);
  }
  function toggleMulti(item) {
    multiSel.has(item.uid) ? multiSel.delete(item.uid) : multiSel.add(item.uid);
    if (multiCountEl) multiCountEl.textContent = "已選 " + multiSel.size;
    const cell = gridEl && [...gridEl.querySelectorAll('.eq-cell')].find(c => c.title && c.title.startsWith(EQ().nameOf(item) + (item.locked ? "（已鎖定）" : "")));
    if (cell) cell.classList.toggle("eq-multi", multiSel.has(item.uid));
  }
  /* v241 全選：tabItems() 篩選輸出（與 renderTab 同源 — 非 DOM 掃描不脫鉤）；再點取消全選
     v241FIX：排除寶石（gemCell 不可多選 — 全選是唯一能把寶石帶進 multiSel 的路徑 → 批量分解 rarity undefined → gold += NaN 腐蝕存檔經濟） */
  function toggleSelectAll() {
    const st = S();
    const vis = tabItems().filter(i => !i.locked && !isGem(i));
    const allSel = vis.length > 0 && vis.every(i => multiSel.has(i.uid));
    if (allSel) { for (const i of vis) multiSel.delete(i.uid); }
    else { for (const i of vis) multiSel.add(i.uid); }
    if (multiCountEl) multiCountEl.textContent = "已選 " + multiSel.size;
    renderTab(true); // 重建格面反映 eq-multi 狀態
  }
  /* v243 批量強化「到滿」：逐件強化至 MAX_ITEM_LVL 或金幣盡（v213 訓練到滿/v223 批量同構 —
     負擔不起的單件跳過繼續；影子模擬＋confirm 防誤觸）
     v243FIX：模擬以每件本地 lv 追蹤＋遞增成本計價（原全域 sim 計數器＋恆當前價 → confirm 被繞過）；
     執行走 EQ.enhance 契約（鍛造場守衛/任務計數/王國經驗 — 原手寫扣金繞過規則） */
  function multiEnhanceMax() {
    if (!multiSel.size) { MG.ui.dom.toast("請先點選裝備", "bad", "icon_hammer"); return; }
    const st = S();
    const EQ = MG.sys.equipment;
    // v223FIX 同款鍛造場探測（forge 未建時強化恆失敗 — 避免 confirm 估算與執行不符）
    if (EQ.canEnhance && EQ.canEnhance({ uid: "probe", tier: 1, rarity: 1, enhance: 0 }) === false && (st.buildings.forge || 0) < 1) {
      MG.ui.dom.toast("先建造鍛造場（王國建築）才能強化裝備", "bad", "icon_hammer");
      return;
    }
    const targets = st.inventory.items.filter(it => multiSel.has(it.uid) && !it.locked && !isGem(it) && !EQ.itemOnFighter(it) && it.enhance < MG.config.MAX_ITEM_LVL && MG.config.SLOTS.includes(EQ().slotOf(it))); // v559：消耗品不強化
    if (!targets.length) { MG.ui.dom.toast("所選裝備皆已滿級或鎖定", "bad", "icon_hammer"); return; }
    // 影子模擬：每件本地 lv 追蹤、遞增成本（與 enhanceCost 同公式）
    let sim = 0, simCost = 0;
    for (const it of targets) {
      let lv = it.enhance, g = st.currencies.gold - simCost;
      while (lv < MG.config.MAX_ITEM_LVL) {
        const c = EQ.enhanceCost(Object.assign({}, it, { enhance: lv }));
        if (g < c) break;
        g -= c; simCost += c; sim++; lv++;
      }
    }
    const run = () => {
      let done = 0, cost = 0;
      for (const it of targets) {
        while (it.enhance < MG.config.MAX_ITEM_LVL) {
          const c = EQ.enhanceCost(it);
          if (st.currencies.gold < c) break;
          if (!EQ.enhance(it)) break; // 契約：鍛造場/金幣/滿級守衛＋任務計數＋王國經驗
          cost += c; done++;
        }
      }
      MG.core.audio.SFX.enhance();
      MG.ui.dom.toast("強化到滿 ×" + done + "（花費 " + MG.util.fmt(cost) + " 金）", done > 0 ? "good" : "bad", "icon_hammer");
      renderTab(true);
    };
    if (simCost > 20000) MG.ui.dom.confirm("強化到滿 ×" + sim, "將強化 " + sim + " 次至滿級或金幣盡（約 " + MG.util.fmt(simCost) + " 金）。確定？", run, { okText: "到滿" });
    else run();
  }
  /* v243 寶石一鍵鑲嵌：所選裝備空插槽自動填倉庫最高階寶石（同階先得 — 消耗與手動完全一致；
     itemOnFighter 跳過；>3 顆 confirm 防誤耗） */
  function multiSocket() {
    if (!multiSel.size) { MG.ui.dom.toast("請先點選裝備", "bad", "icon_hammer"); return; }
    const st = S();
    const EQ = MG.sys.equipment;
    const targets = st.inventory.items.filter(it => multiSel.has(it.uid) && !it.locked && it.gems && it.gems.length && it.gems.some(g => !g));
    if (!targets.length) { MG.ui.dom.toast("所選裝備皆無空插槽", "bad", "icon_hammer"); return; }
    const gems = st.inventory.items.filter(i => !!MG.data.equipment.GEMS[(i.defId || "").split("_")[0]]);
    const usable = gems.filter(g => (g.qty || 1) > 0);
    if (!usable.length) { MG.ui.dom.toast("沒有寶石，可在寶石工坊融合取得", "bad", "gem_ruby"); return; } // v243FIX：與手動路徑同文案
    const byTier = {};
    for (const g of usable) { const t = parseInt(g.defId.split("_")[1]); (byTier[t] = byTier[t] || []).push(g); }
    const tiers = Object.keys(byTier).map(Number).sort((a, b) => b - a);
    let need = 0;
    for (const it of targets) { // v243FIX：排除戰鬥中目標（執行時整件跳過 — 數字與執行一致）
      if (EQ.itemOnFighter(it)) continue;
      for (const g of it.gems) if (!g) need++;
    }
    const run = () => {
      let done = 0;
      for (const it of targets) {
        if (EQ.itemOnFighter(it)) continue;
        for (let idx = 0; idx < it.gems.length; idx++) {
          if (it.gems[idx]) continue;
          let gem = null;
          for (const t of tiers) { const g2 = byTier[t].find(x => (x.qty || 1) > 0); if (g2) { gem = g2; break; } }
          if (!gem) break;
          if (EQ.socketGem(it, idx, gem.defId)) {
            gem.qty = (gem.qty || 1) - 1;
            if (gem.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== gem.uid);
            done++;
          }
        }
      }
      MG.ui.dom.toast(done > 0 ? "鑲嵌 ×" + done + "（自動填入最高階寶石）" : "沒有可鑲嵌的插槽", done > 0 ? "good" : "bad", "gem_ruby");
      renderTab(true);
    };
    if (need > 3) MG.ui.dom.confirm("一鍵鑲嵌 ×" + need, "將填入 " + need + " 顆最高階寶石至所選裝備空插槽。確定？", run, { okText: "鑲嵌" });
    else run();
  }
  /* v223 批量強化：多選 +1 級（鎖定/滿級跳過 — 影子模擬＋>10 件 confirm 防誤觸） */
  function multiEnhance() {
    if (!multiSel.size) { MG.ui.dom.toast("請先點選裝備", "bad", "icon_hammer"); return; }
    const st = S();
    const EQ = MG.sys.equipment;
    // v223FIX：鏡像 canEnhance 的鍛造鋪守衛（forge 未建時強化恆失敗 — 避免確認框估算與執行不符）
    if (EQ.canEnhance && EQ.canEnhance({ uid: "probe", tier: 1, rarity: 1, enhance: 0 }) === false && (st.buildings.forge || 0) < 1) {
      MG.ui.dom.toast("先建造鍛造場（王國建築）才能強化裝備", "bad", "icon_hammer");
      return;
    }
    const targets = st.inventory.items.filter(it => multiSel.has(it.uid) && !it.locked && !isGem(it) && it.enhance < MG.config.MAX_ITEM_LVL && MG.config.SLOTS.includes(EQ().slotOf(it))); // v241FIX：防禦性排除寶石；v559：消耗品不強化
    if (!targets.length) { MG.ui.dom.toast("所選裝備皆已滿級或鎖定", "bad", "icon_hammer"); return; }
    // 影子模擬：逐件 +1 至金幣盡（v223FIX：負擔不起的單件跳過繼續 — 批次盡量強化而非首件 break）
    const sim = () => {
      let gold = st.currencies.gold, n = 0, cost = 0;
      for (const it of targets) {
        const c = EQ.enhanceCost(it);
        if (gold < c) continue;
        gold -= c; cost += c; n++;
      }
      return { n, cost };
    };
    const est = sim();
    if (!est.n) { MG.ui.dom.toast("金幣不足，無法強化", "bad", "icon_coin"); return; }
    const run = () => {
      let n = 0, cost = 0;
      for (const it of targets) {
        const c = EQ.enhanceCost(it);
        if (st.currencies.gold < c) continue;
        if (!EQ.enhance(it)) continue;
        n++; cost += c;
      }
      MG.ui.dom.toast("強化 ×" + n + "（花費 " + MG.util.fmt(cost) + " 金）", n > 0 ? "good" : "bad", "icon_enhance");
      exitMulti();
    };
    if (est.n > 10) MG.ui.dom.confirm("批量強化", "強化 " + est.n + " 件（約需 " + MG.util.fmt(est.cost) + " 金，鎖定/滿級自動跳過）。確定？", run, { okText: "強化" });
    else run();
  }
  function multiDismantle() {
    if (!multiSel.size) { MG.ui.dom.toast("請先點選裝備", "bad", "icon_hammer"); return; }
    const st = S();
    const worn = new Set();
    for (const h of st.hunters || []) for (const k in (h.equip || {})) if (h.equip[k]) worn.add(h.equip[k]);
    const targets = st.inventory.items.filter(it => multiSel.has(it.uid) && !worn.has(it.uid) && !it.locked && !isGem(it) && MG.config.SLOTS.includes(EQ().slotOf(it))); // v241FIX：防禦性排除寶石；v559：再排除消耗品（無 rarity → 分解金幣 NaN）
    if (!targets.length) { MG.ui.dom.toast("所選裝備皆已穿戴或鎖定", "bad", "icon_hammer"); return; }
    MG.ui.dom.confirm("分解 " + targets.length + " 件裝備", "將獲得金幣與素材。已穿戴或鎖定的裝備不會被分解。", () => {
      let gold = 0, mats = {}, n = 0;
      for (const it of targets) {
        const r = MG.sys.equipment.dismantle(it);
        if (r) { n++; gold += Math.floor(10 * Math.pow(1.4, it.tier) * it.rarity * (1 + 0.15 * (it.enhance || 0))); for (const mk in r.mats) mats[mk] = (mats[mk] || 0) + r.mats[mk]; }
      }
      MG.ui.dom.toast("分解 " + n + " 件，獲得 " + MG.util.fmt(gold) + " 金與素材！", n > 0 ? "good" : "bad", "icon_hammer");
      exitMulti();
    }, { danger: true, okText: "分解" });
  }
  function multiLock() {
    const st = S();
    if (!multiSel.size) { MG.ui.dom.toast("請先點選裝備", "bad", "icon_lock"); return; }
    let n = 0;
    for (const it of st.inventory.items) if (multiSel.has(it.uid)) { it.locked = !it.locked; n++; }
    MG.ui.dom.toast("已切換 " + n + " 件裝備的鎖定狀態", "", "icon_lock");
    renderTab(true);
  }
  /* v133 快捷選單：強化/分解/鎖定/詳情（點擊格子直接開啟） */
  function openQuickActions(item) {
    const st0 = S();
    // v559：消耗品（藥水/沙漏）只顯示持有資訊 — 分解/強化/穿戴對非裝備無語義（分解會把金幣算成 NaN 毀滅存檔）
    if (isConsumable(item)) {
      const name0 = EQ().nameOf(item);
      const m0 = MG.ui.dom.modal(name0, null, { icon: "icon_" + EQ().slotOf(item) });
      m0.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 12, marginBottom: 10, textAlign: "center" } },
        "持有 " + MG.util.fmt(item.qty || 1) + " 個 — 於戰鬥中自動使用（可在設定調整自動喝水）"));
      m0.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m0.close() } }, "取消"));
      return;
    }
    const m = MG.ui.dom.modal(EQ().nameOf(item), null, { icon: "icon_" + EQ().slotOf(item) });
    m.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 8, textAlign: "center" } },
      MG.config.tierLabel(item.tier) + " ・ " + (MG.config.RARITY[item.rarity - 1] || MG.config.RARITY[0]).name + (item.enhance > 0 ? " +" + item.enhance : "")));
    const mkBtn = (label, cls, fn2) => m.panel.appendChild(MG.ui.dom.h("button", { class: "btn sm " + cls, style: { width: "100%", marginBottom: 6 }, on: { click: () => { m.close(); fn2(); } } }, label));
    mkBtn(item.locked ? "解除鎖定" : "鎖定（保護不分解）", "ghost", () => { item.locked = !item.locked; renderTab(); });
    mkBtn("分解（換取金幣素材）", "danger", () => doDismantle(item, m));
    if (EQ().canEnhance(item)) mkBtn("強化 +" + (item.enhance + 1), "gold", () => { if (EQ().enhance(item)) { MG.ui.dom.toast("強化成功！+" + item.enhance, "good", "icon_enhance"); renderTab(); flashCell(item.uid); } });
    mkBtn("查看詳情", "", () => openItem(item));
    m.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "取消"));
  }
  function gemCell(g) {
    const kind = g.defId.split("_")[0];
    const gd = ED().GEMS[kind];
    const effect = gd.desc + " +" + (gd.stat === "crit" ? Math.round(gd.val(g.tier) * 100) + "%" : Math.round(gd.val(g.tier)));
    return MG.ui.dom.h("div", {
      class: "eq-cell eq-b5", // v136：寶石格與裝備格同一視覺體系（金橙系）
      style: { aspectRatio: "1", contentVisibility: "auto", containIntrinsicSize: "60px" },
      title: gd.name + " " + MG.config.tierLabel(g.tier) + "：" + effect + (g.qty > 1 ? " x" + g.qty : ""),
      on: { click: () => MG.ui.dom.toast(gd.name + "：" + effect, "", "gem_" + kind) }
    }, MG.ui.dom.icon("gem_" + kind, 26),
      MG.ui.dom.h("div", { class: "eq-name" }, gd.name),
      MG.ui.dom.h("div", { style: { position: "absolute", bottom: 1, right: 1, fontSize: 8, fontWeight: 900, color: "var(--gold)", lineHeight: "10px", textShadow: "0 1px 1px #000" } },
        MG.config.tierLabel(g.tier) + ((g.qty || 1) > 1 ? " x" + g.qty : "")));
  }
  /* v559 消耗品格（藥水/沙漏）：與寶石格同語彙 — 點擊只顯示持有資訊，無分解/強化入口
     （原走裝備格 → 分解 NaN 金幣毀滅存檔；且 eq-bNaN 邊框類名曝光） */
  function consumableCell(c) {
    const nm = EQ().nameOf(c);
    return MG.ui.dom.h("div", {
      class: "eq-cell eq-b6",
      style: { aspectRatio: "1", contentVisibility: "auto", containIntrinsicSize: "60px" },
      title: nm + (c.qty > 1 ? " x" + c.qty : "") + " — 消耗品（戰鬥中自動使用）",
      on: { click: () => MG.ui.dom.toast(nm + "：持有 " + MG.util.fmt(c.qty || 1) + " 個", "", "icon_" + EQ().slotOf(c)) }
    }, MG.ui.dom.icon("icon_" + EQ().slotOf(c), 26),
      MG.ui.dom.h("div", { class: "eq-name" }, nm),
      MG.ui.dom.h("div", { style: { position: "absolute", bottom: 1, right: 1, fontSize: 8, fontWeight: 900, color: "var(--gold)", lineHeight: "10px", textShadow: "0 1px 1px #000" } },
        (c.qty || 1) > 1 ? " x" + c.qty : ""));
  }
  // 效能：2Hz refresh 全量重建 200 格（186ms 桌面/手機更重）→ 狀態簽名沒變就跳過
  const IOS_ON = "linear-gradient(180deg,#57c96b,#3a9c4c)", IOS_OFF = "rgba(255,255,255,0.16)"; // 開關樣式
  let gridSig = "", lastGridAt = 0;
  let rarityFilter = 0, sortMode = "tier", setFilter = "all", attrFilter = {}, unwornOnly = false, enhanceOnly = false, advOpen = false;
  let syncMgmtChipsFn = null; // v702：清除篩選 CTA 同步 chip 外觀
  let syncTabChipsFn = null;
  // v142：篩選/排序/收合持久化（跨 session 還原）
  (function loadFilters() {
    try {
      const f = JSON.parse(localStorage.getItem("megaidle_eq_filters") || "{}");
      if (typeof f.rarity === "number") rarityFilter = f.rarity;
      if (["tier", "rarity", "power", "new"].includes(f.sort)) sortMode = f.sort;
      if (typeof f.set === "string") setFilter = f.set;
      if (f.attr && typeof f.attr === "object") attrFilter = f.attr;
      if (typeof f.unworn === "boolean") unwornOnly = f.unworn;
      if (typeof f.enhance === "boolean") enhanceOnly = f.enhance;
      if (typeof f.adv === "boolean") advOpen = f.adv;
    } catch (e) { /* 壞檔忽略 */ }
  })();
  function saveFilters() {
    try {
      localStorage.setItem("megaidle_eq_filters", JSON.stringify({ rarity: rarityFilter, sort: sortMode, set: setFilter, attr: attrFilter, unworn: unwornOnly, enhance: enhanceOnly, adv: advOpen }));
    } catch (e) { /* 隱私模式忽略 */ }
  }
  function gridSignature() {
    const st = S();
    let s = st.inventory.items.length + "|" + tab + "|F" + rarityFilter + "|S" + sortMode + "|T" + setFilter + "|A" + Object.keys(attrFilter).filter(k => attrFilter[k]).join(",");
    for (const it of st.inventory.items) {
      s += "|" + it.uid + ":" + it.tier + ":" + it.rarity + ":" + (it.enhance || 0)
        + ":" + (it.set || "") + ":" + (it.qty || 1) + ":" + (it.gems ? it.gems.join("") : "") + ":" + (it.locked ? "L" : "");
    }
    // 穿戴標記（誰穿哪件）——cell() 會顯示穿戴者名字
    for (const h of st.hunters) {
      if (!h.equip) continue;
      for (const k in h.equip) if (h.equip[k]) s += "|W:" + h.equip[k] + "@" + h.id;
    }
    // v140：新獲得標記（NEW 光點清除後需重建）
    s += "|N:" + (st.inventory.newUids || []).join(",");
    return s;
  }
  function filtersActive() {
    return rarityFilter > 0 || setFilter !== "all" || Object.keys(attrFilter).some(k => attrFilter[k]) || unwornOnly || enhanceOnly;
  }
  function clearEqFilters() {
    rarityFilter = 0;
    setFilter = "all";
    attrFilter = {};
    unwornOnly = false;
    enhanceOnly = false;
    saveFilters();
    if (syncMgmtChipsFn) syncMgmtChipsFn();
    renderTab(true);
  }
  function bagHasGear() {
    return S().inventory.items.some(i => {
      if ((i.defId || "").startsWith("mat_")) return false;
      if (isGem(i) || isConsumable(i)) return false;
      return MG.config.SLOTS.includes(EQ().slotOf(i));
    });
  }
  // renderGrid 無 gate：呼叫端（renderTab）已做簽名檢查，互動路徑（強化/分解/穿戴）需立即重建
  function renderGrid() {
    if (!gridEl) return;
    gridEl.innerHTML = "";
    const items = tabItems();
    if (!items.length) {
      // v702：篩選空／部位分頁空 分流 CTA（避免誤導「背包真的空」）
      if (filtersActive() && bagHasGear()) {
        gridEl.appendChild(MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10 } },
          MG.ui.dom.h("div", null, "沒有符合目前篩選的裝備"),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "清除品質／套裝／屬性／未穿戴／可強化條件"),
          MG.ui.dom.h("button", {
            class: "btn", style: { minHeight: 44, minWidth: 140 },
            title: "清除所有裝備篩選條件",
            on: { click: () => clearEqFilters() }
          }, "清除篩選")));
        return;
      }
      if (tab !== "all" && tab !== "gem" && bagHasGear()) {
        gridEl.appendChild(MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10 } },
          MG.ui.dom.h("div", null, "此分類尚無裝備"),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "背包其他部位仍有裝備 — 可切回全部查看"),
          MG.ui.dom.h("button", {
            class: "btn blue", style: { minHeight: 44, minWidth: 140 },
            title: "切換到全部分頁",
            on: { click: () => { tab = "all"; if (syncTabChipsFn) syncTabChipsFn(); renderTab(true); } }
          }, "切換全部")));
        return;
      }
      // v674：真時空態 CTA — 文字＋一鍵前往副本（≤2 點擊閉環）
      gridEl.appendChild(MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10 } },
        MG.ui.dom.h("div", null, "背包空空如也\n踏上副本之路，為夥伴尋覓神兵吧！"),
        MG.ui.dom.h("button", {
          class: "btn gold", style: { minHeight: 44, minWidth: 140 },
          on: { click: () => MG.ui.screens.show("hunt") }
        }, "前往副本")));
      return;
    }
    for (const it of items) gridEl.appendChild(isGem(it) ? gemCell(it) : isConsumable(it) ? consumableCell(it) : cell(it));
  }
  function openItem(item) {
    const st = S();
    // v140：查看後清除 NEW 標記（強制重建讓光點立即消失）
    if (st.inventory.newUids && st.inventory.newUids.includes(item.uid)) {
      st.inventory.newUids = st.inventory.newUids.filter(u => u !== item.uid);
      renderTab(true);
    }
    const rar = MG.config.RARITY[item.rarity - 1];
    const slot = EQ().slotOf(item);
    const m = MG.ui.dom.modal("", null, {});
    const head = MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 10 } },
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 16, color: rar.color } },
        EQ().nameOf(item), item.enhance > 0 ? " +" + item.enhance : ""),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } },
        MG.config.SLOT_NAMES[slot] + " · " + MG.config.tierLabel(item.tier) + " · " + MG.ui.dom.stars(item.rarity) + " " + rar.name,
        slot === "weapon" ? " · " + (ED().WEAPON_TYPE_NAMES[item.wtype] || "") + "系" : ""),
      item.set && ED().sets[item.set] ? MG.ui.dom.h("div", { style: { color: ED().SET_COLORS[item.set] || "var(--gold)", fontWeight: 800, fontSize: 12 } }, ED().sets[item.set].name) : null);
    const stats = MG.ui.dom.h("div", { style: { background: "var(--panel2)", borderRadius: 8, padding: 8, marginBottom: 8 } },
      EQ().displayStats(item).map(s => MG.ui.dom.h("div", { style: { fontWeight: 700 } }, s)),
      // v161 詞綴
      item.affix && ED().AFFIXES[item.affix.id] ? MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 12, marginTop: 4, color: "var(--gold)" }, title: "詞綴為 ★3+ 裝備的額外屬性（可經重鑄更換）— 影響裝備定位" },
        "【" + ED().AFFIXES[item.affix.id].name + "】" + ED().AFFIXES[item.affix.id].desc + " +" + Math.round(item.affix.val * 100) + "%") : null,
      item.set && ED().sets[item.set] ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 4, color: "var(--gold)" }, title: "同套裝 2/4 件啟動加成（英雄身上跨部位計算）" },
        (ED().sets[item.set].bonus["2"] || "") + " ／ " + (ED().sets[item.set].bonus["4"] || "")) : null);
    // 與現有裝備比較（v236 適合誰穿 — 需 m 關閉重開）
    const cmpBox = compareBox(item, m);
    // 插槽
    const socketBox = MG.ui.dom.h("div", { style: { marginBottom: 8 } });
    if (item.gems && item.gems.length) {
      const filled = item.gems.filter(Boolean).length;
      socketBox.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 4 }, title: "寶石鑲嵌強化屬性（同階寶石可融合升級）— 點擊空槽鑲嵌・點擊已鑲移除" },
        "寶石插槽 " + filled + "/" + item.gems.length + "："));
      const rowEl = MG.ui.dom.h("div", { style: { display: "flex", gap: 6 } });
      item.gems.forEach((g, idx) => {
        rowEl.appendChild(MG.ui.dom.h("div", {
          style: { width: 36, height: 36, borderRadius: 8, border: "2px dashed " + (g ? "var(--gold)" : "var(--line)"), background: "var(--panel2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
          on: { click: () => g ? removeGem(item, idx, m) : pickGem(item, idx, m) }
        }, g ? MG.ui.dom.icon("gem_" + g.split("_")[0], 20) : MG.ui.dom.icon("icon_plus", 16)));
      });
      socketBox.appendChild(rowEl);
    }
    // 強化預覽 + 動作列
    const eff = MG.sys.buildings.effects();
    const prev = EQ().previewEnhance(item);
    const canEnh = EQ().canEnhance(item);
    const actions = MG.ui.dom.h("div", null);
    if (!prev.atMax) {
      actions.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginBottom: 4, textAlign: "center" } },
        "下一級（+" + (item.enhance + 1) + "）：", prev.stats.length ? MG.ui.dom.h("span", { style: { color: "#7ee787", fontWeight: 700 } }, prev.stats.join(" ／ ")) : "屬性達上限"));
    }
    actions.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 8 } },
      MG.ui.dom.h("button", {
        class: "btn sm " + (canEnh ? "gold" : ""), style: { flex: 1 }, disabled: !canEnh,
        title: "強化提升裝備屬性（需鍛造場）— 每級屬性成長，+10 後機率失敗但不會掉級",
        on: { click: () => { if (EQ().enhance(item)) { MG.ui.dom.toast("強化成功！+" + item.enhance + "（屬性提升）", "good", "icon_enhance"); m.close(); openItem(item); renderGrid(); flashCell(item.uid); } else MG.ui.dom.toast("強化條件不足：金幣或鐵匠鋪等級不夠", "bad", "icon_hammer"); } }
      },
        item.enhance >= MG.config.MAX_ITEM_LVL ? "已達上限"
          : canEnh ? "強化 +" + MG.util.fmt(prev.cost) + "金"
          : "強化（差 " + MG.util.fmt(prev.cost - st.currencies.gold) + "金）"),
      MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1 }, on: { click: () => { pickHunter(item, m); } } }, "穿戴給英雄"),
      MG.ui.dom.h("button", { class: "btn sm danger", style: { flex: 1 }, on: { click: () => doDismantle(item, m) } }, "分解"),
      MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1 }, on: { click: () => { let n = 0; while (EQ().canEnhance(item)) { EQ().enhance(item); n++; } MG.ui.dom.toast(n > 0 ? "強化至 +" + item.enhance + "（" + n + " 次）" : "無法繼續強化（金幣或素材不足）", n > 0 ? "good" : "bad", "icon_hammer"); m.close(); openItem(item); renderGrid(); flashCell(item.uid); } } }, "強化到上限")));
    // v790：裝備強化金幣不足空態 CTA — 一鍵前往副本
    if (!prev.atMax && (st.buildings.forge || 0) > 0 && st.currencies.gold < prev.cost) {
      actions.appendChild(MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 8 } },
        MG.ui.dom.h("div", null, "金幣不足，無法強化"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "需 " + MG.util.fmt(prev.cost) + " 金；可先去副本累積"),
        MG.ui.dom.h("button", {
          class: "btn gold", style: { minHeight: 44, minWidth: 140 },
          title: "關閉並前往副本",
          on: { click: () => { m.close(); MG.ui.screens.show("hunt"); } }
        }, "前往副本")));
    }
    // v190 詞綴重鑄：★3+ 消耗金幣＋高階素材重骰詞綴（無詞綴補上、有詞綴換新）
    if ((item.rarity || 1) >= 3) {
      const rc = EQ().rerollCost(item);
      const costParts = [MG.util.fmt(rc.gold) + " 金"].concat(Object.keys(rc.mats).map(mk => MG.config.MATS[mk].name + "×" + rc.mats[mk]));
      actions.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 8, marginTop: 6, alignItems: "center" } },
        MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } },
          item.affix ? MG.ui.dom.h("span", { style: { color: "var(--gold)", fontWeight: 800 } }, "【" + ED().AFFIXES[item.affix.id].name + "】" + ED().AFFIXES[item.affix.id].desc + " +" + Math.round(item.affix.val * 100) + "%")
            : MG.ui.dom.h("span", { style: { color: "var(--dim)" } }, "無詞綴（重鑄可附加）"),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9 } }, "重鑄：隨機換一條詞綴 · 消耗 " + costParts.join("・"))),
        MG.ui.dom.h("button", {
          class: "btn sm " + (rc.can ? "gold" : ""), style: { flexShrink: 0, minHeight: 28 }, disabled: !rc.can,
          title: "重鑄詞綴：隨機更換一條詞綴（★3+ 裝備；無詞綴時附加）— 詞綴決定額外屬性",
          on: { click: () => {
            MG.ui.dom.confirm("重鑄詞綴", "消耗 " + costParts.join("・") + "，隨機重骰「" + MG.sys.equipment.nameOf(item) + "」的詞綴" + (item.affix ? "（現為【" + ED().AFFIXES[item.affix.id].name + "】）" : "（目前無詞綴）") + "。確定？", () => {
              const r = MG.sys.equipment.rerollAffix(item);
              MG.ui.dom.toast(r.ok ? "重鑄完成：【" + r.prev + "】→【" + r.now + "】+" + Math.round(r.val * 100) + "%" : r.reason, r.ok ? "good" : "bad", "icon_hammer");
              m.close(); openItem(item); renderGrid();
            }, { okText: "重鑄" });
          } }
        }, rc.can ? "重鑄" : "缺素材" + shortOf(rc))));
      // v798：詞綴重鑄資源不足空態 CTA — 一鍵前往副本
      if (!rc.can) {
        actions.appendChild(MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 8 } },
          MG.ui.dom.h("div", null, "資源不足，無法重鑄詞綴"),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "可先去副本累積金幣與素材"),
          MG.ui.dom.h("button", {
            class: "btn gold", style: { minHeight: 44, minWidth: 140 },
            title: "關閉並前往副本",
            on: { click: () => { m.close(); MG.ui.screens.show("hunt"); } }
          }, "前往副本")));
      }
    }
    /* v231：重鑄缺口標籤 — 缺哪項差多少（強化鈕既有「差 X 金」先例） */
    function shortOf(rc) {
      const miss = [];
      if (st.currencies.gold < rc.gold) miss.push("金" + MG.util.fmt(rc.gold - st.currencies.gold));
      for (const mk in rc.mats) {
        const have = st.mats[mk] || 0;
        if (have < rc.mats[mk]) miss.push((MG.config.MATS[mk] || {}).name + "×" + MG.util.fmt(rc.mats[mk] - have));
      }
      return miss.length ? "（" + miss.join("・") + "）" : "";
    }
    // v133 強化素材來源提示
    const dm = ED().dismantleMats(item.tier, item.rarity, item.enhance);
    const matNames = Object.keys(dm).map(k => MG.config.MATS[k] ? MG.config.MATS[k].name : k);
    if (matNames.length) {
      actions.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 4, textAlign: "center" } },
        "強化素材：" + matNames.join("・") + "（副本討伐獲得，分解同品質裝備也會返還）"));
    }
    m.panel.appendChild(MG.ui.dom.h("div", null, head, stats, cmpBox, socketBox, actions));
  }
  function doDismantle(item, m) {
    if (item.locked) { MG.ui.dom.toast("已鎖定的裝備無法分解（點擊卡片鎖圖示解除）", "bad", "icon_hammer"); return; }
    MG.ui.dom.confirm("分解裝備", "分解「" + EQ().nameOf(item) + "」？\n可獲得素材與金幣（稀有度與強化等級皆計入）。", () => {
      const r = EQ().dismantle(item);
      if (!r) { MG.ui.dom.toast("該物品無法分解（僅裝備可分解）", "bad", "icon_hammer"); m.close(); return; } // v559：消耗品守衛（引擎拒絕）
      const mats = Object.entries(r.mats || {}).map(([k, n]) => n > 0 ? MG.config.MATS[k].name + "×" + n : null).filter(Boolean).join(" ・ ");
      MG.ui.dom.toast("分解完成：+" + MG.util.fmt(r.gold) + " 金" + (mats ? " ・ " + mats : ""), "", "icon_hammer");
      m.close(); renderGrid();
    });
  }
  // 與各英雄現有裝備的比較；取第一位可裝備且有裝備的英雄
  function compareBox(item, m) {
    const st = S();
    const slot = EQ().slotOf(item);
    const eligibles = st.hunters.filter(h => eligibleHunter(h, item));
    if (slot === "weapon" && eligibles.length === 0) {
      const need = item.wtype && ED().WEAPON_CLASS[item.wtype];
      // v706：職業限制空態 CTA — 一鍵前往英雄招募對應職業
      return MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "var(--panel2)", borderRadius: 8, padding: 10, marginBottom: 8 } },
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "職業限制"),
        MG.ui.dom.h("div", { style: { fontSize: 12, textAlign: "center" } }, need ? "僅限「" + need + "」使用此武器" : "此武器與現有英雄職業皆不相符"),
        MG.ui.dom.h("button", {
          class: "btn gold", style: { minHeight: 44, minWidth: 140 },
          title: "關閉並前往英雄",
          on: { click: () => { m && m.close(); MG.ui.screens.show("hunters"); } }
        }, "前往英雄"));
    }
    if (eligibles.length === 0) {
      // v706：無可裝備英雄 CTA
      return MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "var(--panel2)", borderRadius: 8, padding: 10, marginBottom: 8 } },
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "與現有裝備比較"),
        MG.ui.dom.h("div", { style: { fontSize: 12 } }, "尚無可裝備的英雄"),
        MG.ui.dom.h("button", {
          class: "btn gold", style: { minHeight: 44, minWidth: 140 },
          title: "關閉並前往英雄",
          on: { click: () => { m && m.close(); MG.ui.screens.show("hunters"); } }
        }, "前往英雄"));
    }
    // v236 適合誰穿：全英雄比對清單（帶號總和排序 — 純損失不排榜首；最佳標記僅總和>0）
    // v236FIX：Σ|d| 排序對正負盲 — 現裝優於新品時全負差反而排第一並標 ★最佳（與紅綠著色矛盾）
    const rows = eligibles.map(h => {
      const curItem = h.equip[slot] ? st.inventory.items.find(i => i.uid === h.equip[slot]) : null;
      const delta = statDelta(curItem, item);
      const total = delta.reduce((a, dl) => a + dl.d, 0);
      return { h, curItem, delta, total };
    }).sort((a, b) => b.total - a.total);
    return MG.ui.dom.h("div", { style: { background: "var(--panel2)", borderRadius: 8, padding: 8, marginBottom: 8, fontSize: 11 } },
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginBottom: 3 } }, "適合誰穿（" + rows.length + " 名可裝備，數值差排序）"),
      MG.ui.dom.h("div", { style: { maxHeight: 170, overflowY: "auto" } },
        rows.map((r, i) => MG.ui.dom.h("div", { class: "row", style: { padding: "4px 0", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none", minWidth: 0 } },
          MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 11 } },
              r.h.name,
              i === 0 && r.total > 0 ? MG.ui.dom.h("span", { style: { color: "var(--gold)", marginLeft: 4, fontSize: 9 } }, "★最佳") : null),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9 } },
              r.curItem ? "現：「" + EQ().nameOf(r.curItem) + "」" : "空槽")),
          MG.ui.dom.h("div", { style: { fontSize: 10, fontWeight: 700, color: deltaClass(r.delta), marginRight: 6, flexShrink: 0 } },
            r.delta.length ? deltaText(r.delta) : "數值持平"),
          MG.ui.dom.h("button", {
            class: "btn sm", style: { padding: "2px 8px", minHeight: 24, flexShrink: 0 },
            on: { click: () => {
              const ok = EQ().equipToHunter(r.h, item);
              if (ok) { MG.ui.dom.toast("已穿給「" + r.h.name + "」", "good", "icon_armor"); m.close(); openItem(item); renderGrid(); }
              else MG.ui.dom.toast("該英雄無法穿戴（戰鬥中？）", "bad", "icon_armor");
            } }
          }, "穿上")))));
  }
  function removeGem(item, idx, m) {
    const st = S();
    const g = item.gems[idx];
    if (!g) return;
    EQ().addGem(g);
    item.gems[idx] = null;
    m.close(); openItem(item); renderGrid();
  }
  function pickGem(item, idx, m) {
    const st = S();
    const gs = gems().filter(g => (g.qty || 1) > 0);
    if (!gs.length) {
      // v702：鑲嵌無寶石 CTA — modal＋前往副本（取代僅 toast）
      const gm = MG.ui.dom.modal("鑲嵌寶石", null, {});
      gm.panel.appendChild(MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10 } },
        MG.ui.dom.h("div", null, "尚未獲得寶石"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "擊敗區域 BOSS，或於寶石工坊融合 3 顆同階寶石"),
        MG.ui.dom.h("button", {
          class: "btn gold", style: { minHeight: 44, minWidth: 140 },
          title: "關閉並前往副本",
          on: { click: () => { gm.close(); m && m.close(); MG.ui.screens.show("hunt"); } }
        }, "前往副本")));
      return;
    }
    const gm = MG.ui.dom.modal("鑲嵌寶石", null, {});
    for (const g of gs) {
      const gd = ED().GEMS[g.defId.split("_")[0]];
      gm.panel.appendChild(MG.ui.dom.h("div", { class: "row", title: "鑲嵌 " + gd.name + " T" + g.tier + "（消耗 1 顆・可隨時移除回收）", on: { click: () => {
        EQ().socketGem(item, idx, g.defId);
        g.qty = (g.qty || 1) - 1;
        if (g.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== g.uid);
        gm.close(); m.close(); openItem(item); renderGrid();
      } } },
        MG.ui.dom.icon("gem_" + g.defId.split("_")[0], 22),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, gd.name + " T" + g.tier),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, gd.desc + " +" + (gd.stat === "crit" ? Math.round(gd.val(g.tier) * 100) + "%" : Math.round(gd.val(g.tier))))),
        MG.ui.dom.h("span", { class: "sub" }, "x" + (g.qty || 1))));
    }
  }
  function pickHunter(item, m) {
    const st = S();
    const slot = EQ().slotOf(item);
    const hm = MG.ui.dom.modal("穿戴給哪位英雄？", null, {});
    if (!st.hunters.length) {
      // v678：穿戴無英雄 CTA — 一鍵前往英雄頁招募
      hm.panel.appendChild(MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10 } },
        MG.ui.dom.h("div", null, "酒館尚無英雄"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "先前往英雄頁招募夥伴吧！"),
        MG.ui.dom.h("button", {
          class: "btn gold", style: { minHeight: 44, minWidth: 140 },
          title: "關閉並前往英雄",
          on: { click: () => { hm.close(); m && m.close(); MG.ui.screens.show("hunters"); } }
        }, "前往英雄")));
      return;
    }
    const eligibles = st.hunters.filter(h => eligibleHunter(h, item));
    if (!eligibles.length) {
      // v710：有英雄但職業／限制皆不符 — CTA 前往英雄
      const need = slot === "weapon" && item.wtype && ED().WEAPON_CLASS[item.wtype];
      hm.panel.appendChild(MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10 } },
        MG.ui.dom.h("div", null, need ? "沒有可穿此武器的「" + need + "」英雄" : "沒有可穿戴此裝備的英雄"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "招募對應職業後再回來穿戴"),
        MG.ui.dom.h("button", {
          class: "btn gold", style: { minHeight: 44, minWidth: 140 },
          title: "關閉並前往英雄",
          on: { click: () => { hm.close(); m && m.close(); MG.ui.screens.show("hunters"); } }
        }, "前往英雄")));
      return;
    }
    for (const h of eligibles) {
      const cls = MG.data.hunters.classes[h.cls];
      const cur = h.equip[slot];
      const curItem = cur ? st.inventory.items.find(i => i.uid === cur) : null;
      const delta = statDelta(curItem, item);
      hm.panel.appendChild(MG.ui.dom.h("div", { class: "row", title: "將裝備給「" + h.name + "」穿戴（替換目前裝備送回背包）", on: { click: () => {
        EQ().equipToHunter(h, item);
        hm.close(); m && m.close(); renderGrid();
      } } },
        MG.ui.dom.icon(h.sprite || cls.icon, 24),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, h.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, cls.name)),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, curItem ? "目前：" + EQ().nameOf(curItem) : "目前：無"),
          delta.length ? MG.ui.dom.h("div", { style: { fontSize: 10, fontWeight: 700, color: deltaClass(delta) } }, "比較：" + deltaText(delta)) : null),
        MG.ui.dom.h("span", { class: "sub" }, "戰力 " + MG.util.fmt(MG.sys.hunters.power(h)))));
    }
  }
  /* crafting */
    const screen = {
    render(root) {
      root.innerHTML = "";
      exitMulti(); // 頁面重建時退出多選模式
      const st0 = S();
      // 頂部工具區（英雄頁樣式：sticky 於頂部，三排全按得到）
      const top = MG.ui.dom.h("div", { style: { position: "sticky", top: 0, zIndex: 6, background: "var(--bg)", padding: "8px 10px 4px", borderBottom: "2px solid var(--line)" } });
      root.appendChild(top);
      // 排 1：分頁
      tabsEl = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, padding: "0 0 4px" } });
      const tabDefs = [["all", "全部"], ["weapon", "武器"], ["armor", "防具"], ["acc", "飾品"], ["gem", "寶石"]];
      const tabChips = tabDefs.map(([id, label]) => MG.ui.dom.h("div", { class: "chip" + (tab === id ? " on" : ""), on: { click: () => { tab = id; syncTabChips(); renderTab(); } } }, label));
      tabChips.forEach(c => tabsEl.appendChild(c));
      top.appendChild(tabsEl);
      // 排 2：品質篩選 + 排序
      let advOpen = false; // v140：進階篩選收合狀態
      const mgmtRow = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, padding: "0 0 6px" } });
      const rarityChips = [0, 1, 2, 3, 4, 5, 6].map(n => MG.ui.dom.h("div", { class: "chip" + (rarityFilter === n ? " on" : ""), style: n === 0 ? {} : { fontSize: 11, minWidth: 44, justifyContent: "center" }, title: n === 0 ? "顯示全部品質（預設）" : "僅顯示 ★" + n + " 裝備", on: { click: () => { rarityFilter = n; syncMgmtChips(); saveFilters(); renderTab(); } } }, n === 0 ? "全部品質" : (n === 6 ? "★6" : "★" + n)));
      rarityChips.forEach(c => mgmtRow.appendChild(c));
      const sortChips = [["tier", "階級排序", "依裝備階級（T1-T9）排列"], ["rarity", "稀有度排序", "依稀有度（★1-★6）排列"], ["power", "戰力排序", "依預估戰力排列"], ["new", "新獲得", "依取得時間排列（最新在前）"]].map(([id, label, tip]) => MG.ui.dom.h("div", { class: "chip" + (sortMode === id ? " on" : ""), style: { fontSize: 11 }, title: tip || "", on: { click: () => { sortMode = id; syncMgmtChips(); saveFilters(); renderTab(); } } }, label));
      sortChips.forEach(c => mgmtRow.appendChild(c));
      // v140：進階篩選（套裝/屬性）收合——點「篩選」展開
      const advWrap = MG.ui.dom.h("div", { style: { display: "none", width: "100%", flexWrap: "wrap", gap: 6 } });
      const setDefs = [["all", "全部套裝"], ["none", "無套裝"]].concat(Object.keys(ED().sets || {}).map(k => [k, (ED().sets[k] || {}).name || k]));
      const setChips = setDefs.map(([id, label]) => MG.ui.dom.h("div", { class: "chip" + (setFilter === id ? " on" : ""), style: { fontSize: 11 }, on: { click: () => { setFilter = id; syncMgmtChips(); saveFilters(); renderTab(); } } }, label));
      setChips.forEach(c => advWrap.appendChild(c));
      const attrDefs = [["atk", "攻擊"], ["def", "防禦"], ["hp", "生命"], ["crit", "暴擊"]];
      const attrChips = attrDefs.map(([id, label]) => MG.ui.dom.h("div", { class: "chip" + (attrFilter[id] ? " on" : ""), style: { fontSize: 11 }, on: { click: () => { attrFilter[id] = !attrFilter[id]; syncMgmtChips(); saveFilters(); renderTab(); } } }, label + "↑"));
      attrChips.forEach(c => advWrap.appendChild(c));
      const advChip = MG.ui.dom.h("div", { class: "chip", style: { fontSize: 11 }, on: { click: () => { advOpen = !advOpen; advWrap.style.display = advOpen ? "" : "none"; advChip.textContent = advOpen ? "篩選 ▾" : "篩選 ▸"; saveFilters(); MG.core.audio.SFX.click(); } } }, advOpen ? "篩選 ▾" : "篩選 ▸");
      mgmtRow.appendChild(advChip);
      mgmtRow.appendChild(advWrap);
      // v142：未穿戴 / 可強化 快速 toggle
      const quickChips = [["unworn", "未穿戴"], ["enhance", "可強化"]].map(([id, label]) => MG.ui.dom.h("div", { class: "chip" + ((id === "unworn" ? unwornOnly : enhanceOnly) ? " on" : ""), style: { fontSize: 11 }, on: { click: () => { if (id === "unworn") unwornOnly = !unwornOnly; else enhanceOnly = !enhanceOnly; syncMgmtChips(); saveFilters(); renderTab(); } } }, label));
      quickChips.forEach(c => mgmtRow.appendChild(c));
      top.appendChild(mgmtRow);
      // 排 3：自動分解（v145：批量操作按鈕已移除——長按任一裝備格即進入多選模式）
      const actRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 8, padding: "0 0 2px" } },
        MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1 }, on: { click: openAutoDismantle } }, "自動分解"));
      top.appendChild(actRow);
      const syncMgmtChips = () => {
        rarityChips.forEach((c, i) => c.className = "chip" + (rarityFilter === i ? " on" : ""));
        sortChips.forEach((c, i) => c.className = "chip" + (sortMode === ["tier", "rarity", "power", "new"][i] ? " on" : ""));
        setChips.forEach((c, i) => c.className = "chip" + (setFilter === setDefs[i][0] ? " on" : ""));
        attrChips.forEach((c, i) => c.className = "chip" + (attrFilter[attrDefs[i][0]] ? " on" : ""));
        quickChips[0].className = "chip" + (unwornOnly ? " on" : "");
        quickChips[1].className = "chip" + (enhanceOnly ? " on" : "");
        // v142：篩選計數（啟用的套裝/屬性條件數）
        const active = (setFilter !== "all" ? 1 : 0) + Object.keys(attrFilter).filter(k => attrFilter[k]).length;
        advChip.textContent = active ? "篩選 ▸ " + active : (advOpen ? "篩選 ▾" : "篩選 ▸");
      };
      const syncTabChips = () => tabChips.forEach((c, i) => c.className = "chip" + (tab === tabDefs[i][0] ? " on" : ""));
      syncMgmtChipsFn = syncMgmtChips;
      syncTabChipsFn = syncTabChips;
      // 裝備主區
      const body = MG.ui.dom.h("div", { style: { padding: "10px 10px 24px" } });
      root.appendChild(body);
      gridEl = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 5 } });
      body.appendChild(gridEl);
      capEl = MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, textAlign: "center", marginTop: 6 } });
      body.appendChild(capEl);
      renderTab(true); // 畫面重建：強制渲染（簽名節流只屬於 2Hz 週期刷新）
    },
    refresh() { renderTab(); }
  };
  /* 自動分解視窗（v130）：開關 + 稀有度方框多選 */
  function openAutoDismantle() {
    const st = S();
    const ad = st.settings.autoDismantle || (st.settings.autoDismantle = { on: false, set: { 1: true, 2: true } });
    if (!ad.set) { const s2 = {}; for (let r = 1; r < (ad.below || 2); r++) s2[r] = true; ad.set = s2; }
    if (!ad.slots) ad.slots = {}; // v142：部位多選（空 = 全部位）
    const m = MG.ui.dom.modal("自動分解", null, { icon: "icon_hammer" });
    const onRow = MG.ui.dom.h("div", { class: "row", title: "開啟後，掉落符合條件的裝備立即自動分解成金幣與素材", on: { click: () => { ad.on = !ad.on; render(); } } },
      MG.ui.dom.h("div", { class: "grow", style: { fontWeight: 800, fontSize: 14 } }, "啟用自動分解",
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, ad.on ? "勾選的稀有度掉落即自動分解" : "關閉")),
      MG.ui.dom.h("div", { class: "chk" + (ad.on ? " on" : "") }, ad.on ? "✓" : ""));
    m.panel.appendChild(onRow);
    const chipRow = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, padding: "10px 2px 6px" } });
    const chips = [1, 2, 3, 4, 5, 6].map(n => MG.ui.dom.h("div", {
      class: "row", style: { flex: "1 1 40%", margin: 0, padding: "8px 10px", cursor: "pointer" },
      on: { click: () => { ad.set[n] = !ad.set[n]; render(); } }
    },
      MG.ui.dom.h("div", { class: "grow", style: { fontWeight: 800, fontSize: 13 } }, "★" + n + "　" + MG.config.RARITY[n - 1].name),
      MG.ui.dom.h("div", { class: "chk" + (ad.set[n] ? " on" : "") }, ad.set[n] ? "✓" : "")));
    chips.forEach(c => chipRow.appendChild(c));
    m.panel.appendChild(chipRow);
    // v142：部位多選（空 = 全部位）
    m.panel.appendChild(MG.ui.dom.h("div", { style: { fontSize: 11, color: "var(--dim)", margin: "4px 2px 4px" } }, "部位（未勾選 = 全部位）："));
    const SLOT_DEFS = [["weapon", "武器"], ["helmet", "頭盔"], ["armor", "鎧甲"], ["boots", "靴子"], ["necklace", "項鍊"], ["ring", "戒指"], ["charm", "護符"]];
    const slotChips = SLOT_DEFS.map(([sid, label]) => MG.ui.dom.h("div", {
      class: "chip" + (ad.slots[sid] ? " on" : ""),
      on: { click: () => { ad.slots[sid] = !ad.slots[sid]; if (!Object.keys(ad.slots).some(k => ad.slots[k])) ad.slots = {}; renderSlot(); } }
    }, label));
    const slotRow = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, padding: "0 2px 6px" } });
    slotChips.forEach(c => slotRow.appendChild(c));
    m.panel.appendChild(slotRow);
    m.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, padding: "0 2px 10px" } },
      "打到勾選稀有度與部位的裝備立刻分解成金幣與素材（已穿戴、鎖定不受影響）"));
    m.panel.appendChild(MG.ui.dom.h("button", { class: "btn gold m-close-btn", on: { click: () => m.close() } }, "完成"));
    function renderSlot() {
      slotChips.forEach((c, i) => c.className = "chip" + (ad.slots[SLOT_DEFS[i][0]] ? " on" : ""));
    }
    function render() {
      const c = onRow.lastElementChild;
      c.className = "chk" + (ad.on ? " on" : "");
      c.textContent = ad.on ? "✓" : "";
      onRow.querySelector(".sub").textContent = ad.on ? "勾選的稀有度掉落即自動分解" : "關閉";
      chips.forEach((rowEl, i) => {
        const c2 = rowEl.lastElementChild;
        c2.className = "chk" + (ad.set[i + 1] ? " on" : "");
        c2.textContent = ad.set[i + 1] ? "✓" : "";
      });
    }
  }
  let capEl;
  function renderTab(force) {
    if (!gridEl) return;
    if (!force) {
      const sig = gridSignature();
      if (sig === gridSig && Date.now() - lastGridAt < 1000) {
        // 狀態沒變 → 跳過全量重建（僅更新容量文字，成本 <0.01ms）
        updateCap();
        return;
      }
      gridSig = sig; lastGridAt = Date.now();
    }
    gridEl.innerHTML = "";
    if (tab === "gem") {
      const gs = gems();
      if (!gs.length) {
        // v674：寶石空態 CTA
        gridEl.appendChild(MG.ui.dom.h("div", { class: "empty", style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10 } },
          MG.ui.dom.h("div", null, "尚未獲得寶石\n擊敗區域BOSS，或於寶石工坊融合 3 顆同階寶石"),
          MG.ui.dom.h("button", {
            class: "btn gold", style: { minHeight: 44, minWidth: 140 },
            on: { click: () => MG.ui.screens.show("hunt") }
          }, "前往副本")));
      }
      for (const g of gs) gridEl.appendChild(gemCell(g)); // v136：與裝備格同一視覺
      capEl.textContent = "";
      return;
    }
    renderGrid();
    updateCap();
  }
  /* v142 容量警示：≥80% 變紅、剩 <5 格提示自動分解 */
  function updateCap() {
    const st = S();
    const used = st.inventory.items.length;
    const cap = EQ().inventoryCap();
    const left = cap - used;
    capEl.textContent = "背包 " + used + " / " + cap + (left <= 5 ? "　⚠ 剩 " + left + " 格" + ((st.settings.autoDismantle || {}).on ? "（自動分解已開啟）" : "（可開啟自動分解或拆解裝備）") : "");
    capEl.style.color = used >= cap * 0.8 ? "#ff7a7a" : "";
    capEl.title = "背包容量 " + cap + " 格（升級倉庫建築提升）— 滿格時無法獲得新裝備；可分解/強化/賣出騰出空間";
  }
  MG.ui.screens.register("equipment", screen);
  return Object.assign(screen, { pickGem, openItem, pickHunter }); // v702／v706／v710：空態 CTA 驗證
})();
