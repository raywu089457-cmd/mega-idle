/* 放置王國 MEGA IDLE — hunters screen: roster, recruit, detail modal (slice B1 owns) */
"use strict";
MG.ui = MG.ui || {};
MG.ui.hunters = (function () {
  const D = MG.data.hunters;
  const S = () => MG.game.state;
  let listEl, statusEl, filter = "all", sort = "power", recruitCdUntil = 0, cdTimer = null, recruitFabBtn = null; // v241：招募 FAB CD 顯示
  let search = ""; // v216：名稱搜尋（更名券時代 40+ 英雄逐卡掃的解法）
  let searchTimer = null; // v216FIX：搜尋 debounce（每鍵全量重建 54ms 桌面/138ms 手機 ＋ localStorage 寫入）
  // v248 批量遣散多選模式（與 v241 背包多選同家族 — 名冊 40 上限下「清肥料」是每日最高頻純勞務）
  let selMode = false, sel = new Set(), selSumEl = null; // selSumEl：操作列計數（就地更新 — 點擊不整列重建）
  let wanderEl = null, wanderRows = {}, bulkRowEl = null, bulkFeedBtn = null, bulkExpedBtn = null; // 流浪英雄區（招募後成為領地英雄）；v233FIX：批量列建一次防 DOM 堆疊
  let view = "kingdom"; // kingdom=領地英雄 / wanderer=流浪英雄
  let listWrapEl = null, fabWrapEl = null, wanderWrapEl = null, viewBtnEls = null;
  // v206：篩選/排序/視圖持久化（與裝備頁 v142 同模式 — 重開遊戲繼續上次整理任務）
  (function loadPrefs() {
    try {
      const f = JSON.parse(localStorage.getItem("megaidle_hunter_filters") || "null");
      if (!f || typeof f !== "object") return;
      if (typeof f.filter === "string") filter = f.filter;
      if (typeof f.sort === "string") sort = f.sort;
      if (typeof f.search === "string") search = f.search; // v216
      if (f.view === "kingdom" || f.view === "wanderer") view = f.view;
    } catch (e) { /* 壞檔忽略 */ }
  })();
  function savePrefs() {
    try {
      localStorage.setItem("megaidle_hunter_filters", JSON.stringify({ filter, sort, view, search }));
    } catch (e) { /* 隱私模式忽略 */ }
  }

  /* v248 批量遣散：可選判定 — 出戰中/休息中（fightGuard 同源）與鎖定英雄排除，其餘（含傳說）可選 */
  function selable(h) {
    const stt = S();
    const dispatched = (stt.hunt.dispatchIds || []).includes(h.id);
    return !dispatched && !h.locked && !(MG.sys.expedition && MG.sys.expedition.isBusy(h)); // v271FIX：遠征中不可勾選遣散
  }
  function selSum() {
    let gold = 0, shards = 0, n = 0;
    const stt = S();
    for (const h of stt.hunters) {
      if (!sel.has(h.id) || !selable(h)) continue;
      const c = MG.sys.hunters.dismissCost(h);
      gold += c.refund; shards += c.shards; n++;
    }
    return { n, gold, shards };
  }
  function enterSelMode() {
    selMode = true; sel = new Set();
    renderList(true);
  }
  function exitSelMode() {
    selMode = false; sel = new Set(); selSumEl = null;
    renderList(true);
  }
  function toggleSelectAll() {
    const stt = S();
    const cands = filtered().filter(h => selable(h));
    const allOn = cands.length > 0 && cands.every(h => sel.has(h.id));
    if (allOn) sel.clear();
    else for (const h of cands) sel.add(h.id);
    renderList(true);
  }
  function bulkDismissRun() {
    const stt = S();
    const list = stt.hunters.filter(h => sel.has(h.id) && selable(h));
    const sum = selSum();
    if (!list.length) { MG.ui.dom.toast("沒有可遣散的英雄", "bad", "icon_skull"); return; }
    const shardTxt = sum.shards > 0 ? "・碎片 +" + sum.shards : "";
    const run = () => {
      let done = 0, gold = 0, shards = 0;
      for (const h of list) {
        const r = MG.sys.hunters.dismiss(h, true); // 逐名走完整契約（守衛/返還/碎片/裝備回背包/全隊移出）
        if (r) { done++; gold += r.refund; shards += r.shards; }
      }
      MG.ui.dom.toast("已遣散 " + done + " 名英雄，獲得 " + MG.util.fmt(gold) + " 金幣" + (shards > 0 ? "・碎片 +" + shards : ""), done > 0 ? "good" : "bad", "icon_coin");
      exitSelMode();
    };
    MG.ui.dom.confirm("批量遣散 " + sum.n + " 名英雄",
      "預估返還 " + MG.util.fmt(sum.gold) + " 金幣" + shardTxt + "，裝備會送回背包。\n此操作無法復原！", run, { okText: "遣散" });
  }
  /* v331：突破慶祝 mini 演出（金色光柱＋階級文字 — 與升星慶祝同語彙但輕量；rm 省略） */
  function showPromoteCelebration(h) {
    const rm = !!(S().settings && S().settings.reducedMotion);
    const root = document.getElementById("overlay-root");
    if (rm || !root) return;
    const ovl = MG.ui.dom.h("div", { class: "ovl", style: { background: "rgba(10,8,20,.55)" }, on: { click: () => ovl.remove() } });
    const card = MG.ui.dom.h("div", { style: { position: "relative", width: 220, textAlign: "center", padding: "26px 16px 20px", borderRadius: 14, background: "linear-gradient(180deg,#1e1a38,#131022)", border: "2px solid #ffd166", boxShadow: "0 10px 40px rgba(0,0,0,.7), 0 0 26px rgba(255,209,102,.4)", overflow: "hidden" } },
      MG.ui.dom.h("div", { class: "summon-rays summon-rays-gold", style: { opacity: 0.7 } }),
      MG.ui.dom.h("div", { class: "summon-ring summon-ring-gold" }),
      MG.ui.dom.h("div", { style: { position: "relative", zIndex: 1, animation: "summon-pop .45s cubic-bezier(.2,.9,.3,1.25) both" } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 15, color: "var(--gold)", letterSpacing: 2 } }, "突破成功！"),
        MG.ui.dom.h("div", { style: { margin: "8px auto 4px", width: 64, height: 64, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,209,102,.3), rgba(255,209,102,.05) 70%)", border: "2px solid var(--gold2)", display: "flex", alignItems: "center", justifyContent: "center" } },
          MG.ui.dom.icon(h.sprite || MG.data.hunters.classes[h.cls].icon, 40)),
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 13, color: "var(--gold)" } }, h.name),
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 17, color: "#fff", marginTop: 2 } }, "第 " + (h.promoted + 1) + " 階"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 4 } }, "全屬性 +20%")));
    ovl.appendChild(card);
    root.appendChild(ovl);
  }

  /* v263 可成長判定：任一就緒（可升星/可突破/可訓練/技能可升）— 今日養成決策一鍵掃描 */
  function growableOf(h) {
    const stt = S();
    try {
      if (MG.sys.hunters.canPromote(h)) return "promote";
      const sc = MG.sys.hunters.starUpCost(h);
      if (sc && sc.can) return "star";
      if (h.level < 200 && stt.currencies.gold >= MG.data.hunters.trainCost(h.level)) return "train";
      if ((stt.currencies.book || 0) > 0 && MG.sys.hunters.unlockedSkills(h).some(sk => MG.sys.hunters.skillUpCost(h, sk.id) >= 0 && (stt.currencies.book || 0) >= MG.sys.hunters.skillUpCost(h, sk.id))) return "skill";
    } catch (e) { /* 非關鍵 */ }
    return null;
  }
  function filtered() {
    const st = S();
    let list = st.hunters.slice();
    if (filter === "formation") list = list.filter(h => MG.sys.hunters.inFormation(h.id));
    else if (filter === "grow") list = list.filter(h => !!growableOf(h)); // v263 可成長篩選（v263FIX：原分支缺失 → 空名冊）
    else if (filter !== "all") list = list.filter(h => h.cls === filter);
    // v216 名稱搜尋：名字或職業名模糊匹配（更名券自訂名也搜得到）
    if (search) {
      const q = search.trim().toLowerCase();
      if (q) list = list.filter(h => h.name.toLowerCase().includes(q) || ((D.classes[h.cls] || {}).name || "").toLowerCase().includes(q));
    }
    if (sort === "power") list.sort((a, b) => MG.sys.hunters.power(b) - MG.sys.hunters.power(a));
    else if (sort === "level") list.sort((a, b) => b.level - a.level || b.rarity - a.rarity);
    else if (sort === "rarity") list.sort((a, b) => b.rarity - a.rarity || MG.sys.hunters.power(b) - MG.sys.hunters.power(a));
    return list;
  }
  // 效能：2Hz refresh 全量重建 40 卡（54ms 桌面/138ms 手機）→ 狀態簽名沒變就跳過重建
  let listSig = "", lastListAt = 0;
  function listSignature() {
    const st = S();
    let s = st.hunters.length + "|" + filter + "|" + sort + "|" + search; // v216FIX：搜尋納入簽名 — 否則 2Hz 重建 gate 吞掉輸入
    for (const h of st.hunters) {
      // 不納入 hp：派遣中每 tick 變化，納入會讓每次 refresh 都重建
      s += "|" + h.id + ":" + h.level + ":" + (h.promoted || 0) + ":" + h.cls + ":" + (h.rarity || 1)
        + ":" + (h.equip ? Object.keys(h.equip).map(k => h.equip[k]).join(",") : "");
    }
    s += "|F:" + st.formation.join(",") + "|D:" + (st.hunt.dispatchIds || []).join(",") + "|R:" + ((st.hunt.restUntil || 0) > Date.now() ? 1 : 0);
    return s;
  }
  /* v254 共鳴槽管理：5 槽選英雄（基準 = 槽內最低 — 板凳共享等級；隨時可換）
     決策保留：槽位分配是玩家選擇；升星/技能/突破/裝備仍個人投資 */
  function openResonance() {
    const m = MG.ui.dom.modal("共鳴祭壇", null, { icon: "b_altar" });
    const st = S();
    const H = MG.sys.hunters;
    const rinfo = H.resonanceInfo();
    // v268 一鍵自動填槽：受益英雄（未入槽且 level<基準）依差距降序填入空槽 — 例行填槽 2 擊完成
    const autoFillBtn = MG.ui.dom.h("button", {
      class: "btn sm gold", style: { flexShrink: 0, minHeight: 30 },
      disabled: !rinfo.active,
      on: { click: () => {
        const sg = H.resonanceSuggest();
        let filled = 0, full = false;
        for (const id of sg.ids) {
          const rs = (st.resonance || { slots: [] });
          const free = rs.slots.indexOf(undefined) >= 0 ? rs.slots.indexOf(undefined) : rs.slots.length;
          if (free >= H.resonanceSlots()) { full = true; break; } // v268FIX：槽滿與無受益者分開提示
          const r = H.setResonanceSlot(free, id);
          if (r.ok) filled++;
        }
        if (filled > 0) MG.ui.dom.toast("已自動填入 " + filled + " 名受益英雄（基準 Lv" + H.resonanceLevel() + "）", "good", "b_altar");
        else if (full && sg.ids.length > 0) MG.ui.dom.toast("共鳴槽已滿 — 先移出一名英雄", "bad", "icon_lock");
        else MG.ui.dom.toast("沒有可填入的受益英雄", "", "b_altar");
        renderSlots(); renderListWrap();
        renderList(true);
      } }
    }, "自動填入受益英雄");
    const header = MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
      MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11, textAlign: "center" } },
        "基準 = 全名冊第 5 高等級（自動）。槽內低於基準者實戰等級同步至基準（封頂 200）。" + (rinfo.active ? "目前基準 Lv" + rinfo.base + "。" : "名冊未滿 5 人或頂端等級過低 — 基準未啟動。")),
      autoFillBtn);
    m.panel.appendChild(header);
    const slotsWrap = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 8 } });
    const renderSlots = () => {
      slotsWrap.innerHTML = "";
      const info = H.resonanceInfo();
      for (let i = 0; i < MG.sys.hunters.resonanceSlots(); i++) {
        const h = info.slots[i];
        const cell = MG.ui.dom.h("div", {
          style: { minHeight: 54, borderRadius: 8, border: "1px solid " + (h ? "var(--gold)" : "var(--line)"), background: "var(--panel2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: h ? "pointer" : "default", padding: 3 },
          on: h ? { click: () => { MG.ui.dom.confirm("移出共鳴", "將「" + h.name + "」移出共鳴槽？", () => { H.clearResonanceSlot(i); renderSlots(); renderListWrap(); renderList(true); }); } } : {}
        },
          h ? MG.ui.dom.icon(h.sprite || MG.data.hunters.classes[h.cls].icon, 26) : MG.ui.dom.h("span", { style: { fontSize: 9, color: "var(--dim)" } }, "空"),
          h ? MG.ui.dom.h("span", { style: { fontSize: 9, fontWeight: 800 } }, h.name, MG.ui.dom.h("span", { class: "sub", style: { fontSize: 8 } }, " Lv" + h.level)) : null);
        slotsWrap.appendChild(cell);
      }
      const sum = MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, textAlign: "center" } },
        info.active ? "基準 Lv" + info.base + "・槽內英雄以下等級同步至基準（封頂 200）" : "基準 Lv" + info.base + "・放入低於基準的英雄即受益");
      if (slotsWrap._sum && slotsWrap._sum.parentNode) slotsWrap.removeChild(slotsWrap._sum); // v254FIX：innerHTML 清空後節點已脫離 — parentNode 守衛防 NotFoundError
      slotsWrap._sum = sum;
      // v268FIX：自動填槽鈕狀態隨就地渲染重算（受益者全入槽/槽滿即灰 — 原 disabled 僅開啟時一次性）
      const infoNow = H.resonanceInfo();
      autoFillBtn.disabled = !H.resonanceSuggest().ids.length || infoNow.slots.filter(Boolean).length >= H.resonanceSlots();
      slotsWrap.appendChild(sum);
    };
    renderSlots();
    m.panel.appendChild(slotsWrap);
    // 名冊選人（未入槽者 — 點擊填入第一個空槽）；v268 就地更新不再整窗重開＋受益優先排序＋受益標示
    const listWrap = MG.ui.dom.h("div", { style: { maxHeight: 180, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 } });
    const renderListWrap = () => {
      listWrap.innerHTML = "";
      const base = H.resonanceLevel();
      const inSlots = (st.resonance || { slots: [] }).slots || [];
      const list = st.hunters
        .filter(x => inSlots.indexOf(x.id) < 0)
        .sort((a, b) => {
          const ba = (a.level || 1) < base ? 0 : 1, bb = (b.level || 1) < base ? 0 : 1; // 受益者在前
          if (ba !== bb) return ba - bb;
          return (a.level || 1) - (b.level || 1);
        });
      for (const h of list) {
        const benefits = (h.level || 1) < base; // 放槽受益（combatLevel 將同步至基準）
        const cell = MG.ui.dom.h("div", {
          style: { fontSize: 10, padding: "4px 2px", textAlign: "center", borderRadius: 6, border: "1px solid " + (benefits ? "var(--gold2)" : "var(--line)"), background: "var(--panel2)", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: benefits ? 1 : 0.75 },
          on: { click: () => {
            const rs = st.resonance || { slots: [] };
            const free = rs.slots.indexOf(undefined) >= 0 ? rs.slots.indexOf(undefined) : rs.slots.length;
            if (free >= H.resonanceSlots()) { MG.ui.dom.toast("共鳴槽已滿 — 先移出一名英雄", "bad", "icon_lock"); return; }
            const r = H.setResonanceSlot(free, h.id);
            MG.ui.dom.toast(r.ok ? "「" + h.name + "」已放入共鳴槽" : r.reason, r.ok ? "good" : "bad", "b_altar");
            if (r.ok) { renderSlots(); renderListWrap(); renderList(true); } // v268：就地更新（原 m.close()+openResonance 整窗重建 5-8 次）
          } }
        }, h.name,
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 8, color: benefits ? "var(--gold)" : "var(--dim)" } },
            benefits ? "Lv" + h.level + " → 受益至 Lv" + base : "Lv" + h.level + "（已達基準，放槽無效果）"));
        listWrap.appendChild(cell);
      }
      if (!list.length) listWrap.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, textAlign: "center", gridColumn: "1 / -1" } }, "全部英雄已入槽"));
    };
    renderListWrap();
    m.panel.appendChild(listWrap);
  }
  /* v260 置換 modal：同職業英雄投資對調（星級/等級/突破/技能書/spentGold/主副技 — 雙向預覽） */
  function openSwap(h) {
    const st = S();
    const H = MG.sys.hunters;
    const peers = st.hunters.filter(x => x.id !== h.id && x.cls === h.cls && !x.locked);
    const m = MG.ui.dom.modal("英雄置換 — " + h.name, null, { icon: "icon_formation" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, textAlign: "center", marginBottom: 6 } },
      "與同職業英雄交換完整投資（星級/等級/突破/技能書/主副技）— 消耗置換石 ×(1+星差)。裝備與神器不交換。"));
    if (!peers.length) { body.appendChild(MG.ui.dom.h("div", { class: "empty" }, "沒有其他同職業英雄可置換")); return; }
    const list = peers.slice().sort((a, b) => MG.sys.hunters.power(b) - MG.sys.hunters.power(a));
    for (const p of list) {
      const cost = H.swapCost(h, p);
      const can = (st.currencies.swapStone || 0) >= cost;
      body.appendChild(MG.ui.dom.h("div", { class: "row", style: { alignItems: "center", opacity: can ? 1 : 0.55 } },
        MG.ui.dom.icon(p.sprite || MG.data.hunters.classes[p.cls].icon, 24),
        MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, "★" + p.rarity + " " + p.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, "Lv" + p.level + "・突破 " + (p.promoted || 0))),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9 } }, "置換後：★" + h.rarity + " Lv" + h.level + " ↔ ★" + p.rarity + " Lv" + p.level)),
        MG.ui.dom.h("button", {
          class: "btn sm " + (can ? "gold" : ""), style: { flexShrink: 0, minHeight: 26 }, disabled: !can,
          on: { click: () => {
            MG.ui.dom.confirm("置換英雄", "「" + h.name + "」↔「" + p.name + "」完整投資對調（消耗置換石 ×" + cost + "）？此操作可反覆進行。", () => {
              const r = H.swapInvestment(h, p);
              MG.ui.dom.toast(r.ok ? "置換完成：" + r.name : r.reason, r.ok ? "good" : "bad", "icon_formation");
              if (r.ok) { m.close(); openDetail(h.id); renderList(); }
            }, { okText: "置換" });
          } }
        }, "置換 ×" + cost)));
    }
  }
  /* v166 UI/UX：英雄卡片網格（3 欄）— 一眼掃描全陣容，點卡片進詳情 */
  function card(h) {
    const cls = MG.data.hunters.classes[h.cls];
    const rar = MG.config.RARITY[h.rarity - 1] || MG.config.RARITY[0];
    const stt = S();
    const dispatched = (stt.hunt.dispatchIds || []).includes(h.id);
    const resting = dispatched && ((stt.hunt.restUntil || 0) > Date.now());
    const inF = MG.sys.hunters.inFormation(h.id);
    const isLegend = !!h.legend;
    const badge = resting ? { t: "休", c: "#9db4ff" } : dispatched ? { t: "戰", c: "#ff9f43" } : inF ? { t: "出", c: "#7ee787" } : null;
    // v248 多選模式：點擊切換選取（不開詳情）；不可選（出戰/鎖定）灰化
    const canSel = selable(h);
    const isSel = sel.has(h.id);
    if (selMode && !canSel) { /* 下方樣式灰化 */ }
    // v191 UI/UX：升星徽章（可升星 → 金「升★N」；還缺 → 灰「差N同職」）— 收藏頁決策支援（AFK Arena 升星提示）
    let starBadge = null;
    try {
      const sc = MG.sys.hunters.starUpCost(h);
      if (sc && !sc.max) {
        if (sc.can) starBadge = { t: "升★" + sc.next, c: "linear-gradient(180deg,#ffd166,#f0a83a)", fg: "#3a2500", title: "可升星至 ★" + sc.next + "（消耗同職業 ×" + sc.needCopy + "＋肥料 ×" + sc.needFod + "）" };
        else {
          const dCopy = Math.max(0, sc.needCopy - sc.copies);
          const dFod = Math.max(0, sc.needFod - sc.fodder);
          starBadge = { t: dCopy > 0 ? "差" + dCopy + "同職" : "差" + dFod + "肥", c: "rgba(255,255,255,.09)", fg: "var(--dim)", title: "升星 ★" + sc.next + "：缺同職業 " + dCopy + " 位、肥料 " + dFod + " 位" };
        }
      }
    } catch (e) { /* 升星預覽非關鍵路徑 */ }
    return MG.ui.dom.h("div", {
      "data-cid": h.id, // v248FIX：卡點擊改由 listEl 事件委派（單一監聽器＋closest 定位 — 40 卡零綁定成本；多選/詳情分流集中一處）
      title: cls.name + " · " + ((MG.config.ELEMENTS[MG.config.CLASS_ELEMENT[h.cls]] || {}).name || "") + "屬性 ・ Lv " + h.level + " ・ 戰力 " + MG.util.fmt(MG.sys.hunters.power(h)) + (badge ? "（" + (badge.t === "休" ? "派遣中休息" : badge.t === "戰" ? "派遣戰鬥中" : badge.t === "出" ? "出戰隊伍中" : "") + "）" : ""),
      style: {
        position: "relative", borderRadius: 10, padding: "7px 3px 6px", cursor: "pointer", textAlign: "center",
        background: "var(--panel2)",
        border: "2px solid " + (selMode && !canSel ? "rgba(255,255,255,.08)" : isLegend ? "var(--gold)" : rar.color),
        opacity: selMode && !canSel ? 0.45 : 1,
        boxShadow: isSel ? "0 0 10px rgba(255,209,102,.55), inset 0 0 0 1px var(--gold)" : (isLegend ? "0 0 8px rgba(255,209,102,.35)" : (rar.id >= 5 ? "0 0 6px " + rar.color + "44" : "none")),
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, minHeight: 110
      }
    },
      // v248 選取角標（多選模式 — class selmark 供就地更新）
      selMode && canSel ? MG.ui.dom.h("span", { class: "selmark", style: { position: "absolute", top: 4, left: 4, width: 14, height: 14, borderRadius: "50%", background: isSel ? "var(--gold)" : "#14121f", border: "2px solid " + (isSel ? "var(--gold)" : "rgba(255,255,255,.35)"), fontSize: 9, fontWeight: 900, lineHeight: "10px", textAlign: "center", color: "#14121f", zIndex: 3 } }, isSel ? "✓" : "") : null,
      MG.ui.dom.icon(h.sprite || cls.icon, 38),
      badge ? MG.ui.dom.h("span", { style: { position: "absolute", top: 4, right: 4, fontSize: 8, fontWeight: 900, color: "#14121f", background: badge.c, borderRadius: 4, padding: "0 3px", lineHeight: "12px" } }, badge.t) : null,
      starBadge ? MG.ui.dom.h("span", { title: starBadge.title, style: { position: "absolute", bottom: 3, left: 3, fontSize: 8, fontWeight: 900, color: starBadge.fg, background: starBadge.c, border: "1px solid rgba(255,209,102,.4)", borderRadius: 4, padding: "0 3px", lineHeight: "12px" } }, starBadge.t) : null,
      // v263 可突破就緒角標（canPromote 同源 — 與升星徽章同語彙；缺口 title 揭示）
      (() => { try {
        const pp = MG.sys.hunters.promoPreview(h);
        if (pp.can) return MG.ui.dom.h("span", { title: "可突破至第 " + ((h.promoted || 0) + 1) + " 階（全屬性 +20%）", style: { position: "absolute", bottom: 16, right: 3, fontSize: 8, fontWeight: 900, color: "#3a2500", background: "linear-gradient(180deg,#ffd166,#f0a83a)", borderRadius: 4, padding: "0 3px", lineHeight: "12px" } }, "突" + ((h.promoted || 0) + 1));
        if ((h.level || 1) >= pp.needLv && (h.promoted || 0) < 5) {
          const cst = pp.cost;
          const dGold = Math.max(0, cst.gold - stt.currencies.gold);
          return MG.ui.dom.h("span", { title: "突破缺口：金幣缺 " + MG.util.fmt(dGold) + (cst.mats ? Object.keys(cst.mats).filter(m => (stt.mats[m] || 0) < cst.mats[m]).map(m => "・" + (MG.config.MATS[m] || {}).name + "缺 " + (cst.mats[m] - (stt.mats[m] || 0))).join("") : ""), style: { position: "absolute", bottom: 16, right: 3, fontSize: 8, fontWeight: 900, color: "var(--dim)", background: "rgba(255,255,255,.09)", borderRadius: 4, padding: "0 3px", lineHeight: "12px" } }, "突" + ((h.promoted || 0) + 1));
        }
      } catch (e) { /* 非關鍵 */ } return null; })(),
      h.promoted > 0 ? MG.ui.dom.h("span", { style: { position: "absolute", bottom: 28, right: 3, fontSize: 8, fontWeight: 900, color: "var(--gold)", background: "#14121f", borderRadius: 4, padding: "0 2px" } }, "+" + h.promoted) : null,
      // v254 共鳴徽章（槽內且被基準拉高 → 藍色 Lv 標記）
      (MG.sys.hunters.combatLevel(h) > h.level) ? MG.ui.dom.h("span", { title: "共鳴祭壇同步等級（個人訓練仍保留）", style: { position: "absolute", bottom: 3, right: 3, fontSize: 8, fontWeight: 900, color: "#fff", background: "#4da3ff", borderRadius: 4, padding: "0 3px", lineHeight: "12px" } }, "共鳴 Lv" + MG.sys.hunters.combatLevel(h)) : null,
      MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 11, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isLegend ? "var(--gold)" : "", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 } },
        // v206：元素色點（克制決策支援 — v149 機制可見化）
        MG.ui.dom.h("span", { title: (MG.config.ELEMENTS[MG.config.CLASS_ELEMENT[h.cls]] || {}).name, style: { width: 7, height: 7, borderRadius: "50%", background: (MG.config.ELEMENTS[MG.config.CLASS_ELEMENT[h.cls]] || {}).color || "#888", flexShrink: 0 } }),
        MG.ui.dom.h("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, (h.locked ? "🔒" : "") + h.name)),
      MG.ui.dom.h("div", { class: "rar" + h.rarity, style: { fontSize: 9, lineHeight: 1 } }, MG.ui.dom.stars(h.rarity)),
      MG.ui.dom.h("div", { style: { fontSize: 9, color: "var(--dim)" } }, "Lv " + h.level + " · " + MG.util.fmt(MG.sys.hunters.power(h))));
  }
  /* v192 升星慶祝演出：全屏金色儀式（重用 v172 抽卡光效 class；reduced-motion 省略） */
  function showStarUpCelebration(h, fromStar) {
    const rm = !!(S().settings && S().settings.reducedMotion);
    const root = document.getElementById("overlay-root");
    if (rm || !root) return;
    const rar = MG.config.RARITY[h.rarity - 1] || MG.config.RARITY[0];
    const mul = (MG.config.RARITY[h.rarity - 1] || {}).grow || 1;
    const ovl = MG.ui.dom.h("div", {
      style: { position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,12,24,0.55)", cursor: "pointer" },
      on: { click: dismiss }
    });
    const card = MG.ui.dom.h("div", { style: { position: "relative", width: 230, textAlign: "center", padding: "26px 18px 20px", borderRadius: 14, background: "var(--panel)", border: "2px solid var(--gold)", boxShadow: "0 10px 40px rgba(0,0,0,0.6), 0 0 24px rgba(255,209,102,.4)", overflow: "hidden" } },
      MG.ui.dom.h("div", { class: "summon-rays summon-rays-gold" }),
      MG.ui.dom.h("div", { class: "summon-ring summon-ring-gold" }),
      MG.ui.dom.h("div", { style: { position: "relative", zIndex: 1, animation: "summon-pop .45s cubic-bezier(.2,.9,.3,1.25) both" } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 16, color: "var(--gold)", letterSpacing: 2 } }, "升星成功！"),
        MG.ui.dom.h("div", { style: { margin: "10px auto 6px", width: 76, height: 76, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,209,102,.28), rgba(255,209,102,.05) 70%)", border: "2px solid var(--gold2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(255,209,102,.5)" } },
          MG.ui.dom.icon(h.sprite || MG.data.hunters.classes[h.cls].icon, 46)),
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 13, color: rar.color, marginTop: 4 } }, h.name),
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 22, color: "var(--gold)", marginTop: 2, fontVariantNumeric: "tabular-nums" } },
          "★" + fromStar + " → ★" + h.rarity),
        MG.ui.dom.h("div", { style: { fontSize: 11, color: "var(--dim)", marginTop: 4 } }, "全屬性 ×" + mul.toFixed(2) + " ・ 生命魔力同步成長"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 10 } }, "點擊繼續")));
    ovl.appendChild(card);
    root.appendChild(ovl);
    const t = setTimeout(dismiss, 2200);
    function dismiss() { clearTimeout(t); if (ovl.parentNode) ovl.parentNode.removeChild(ovl); }
  }
  /* v139：編入選隊視窗——英雄列的「編入」改為選擇加入哪個隊伍 */
  function openFormationPicker(h) {
    const st = S();
    const H = MG.sys.hunters;
    const cls = D.classes[h.cls];
    const m = MG.ui.dom.modal("編入「" + h.name + "」", null, { icon: "icon_recruit" });
    const body = m.panel;
    const max = H.teamsUnlocked();
    const active = st.activeTeam || 0;
    let cur = -1;
    if (Array.isArray(st.formations)) for (let n = 0; n < 5; n++) if ((st.formations[n] || []).includes(h.id)) cur = n;
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6, textAlign: "center" } },
      cls.name + " · Lv " + h.level + " ・ " + (cur >= 0 ? "目前在第 " + (cur + 1) + " 隊" : "尚未編入任何隊伍") + "（每人只能待在一個隊伍）"));
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginBottom: 6, textAlign: "center", color: "var(--dim2)" } },
      "酒館等級決定開放隊數（Lv1=1 隊、Lv2=2、Lv4=3、Lv6=4、Lv8=5）；出戰中的隊伍變動立即生效"));
    for (let n = 0; n < 5; n++) {
      const unlocked = n < max;
      const info = H.teamInfo(n);
      const row = MG.ui.dom.h("button", {
        class: "btn sm " + (n === active ? "gold" : n === cur ? "blue" : ""),
        style: { width: "100%", marginBottom: 6, justifyContent: "space-between", opacity: unlocked ? 1 : 0.55 },
        disabled: !unlocked,
        on: { click: () => { assignToTeam(h, n); m.close(); renderList(); } }
      },
        MG.ui.dom.h("span", null, unlocked ? "第 " + (n + 1) + " 隊" + (n === active ? "（出戰中）" : "") : "🔒 第 " + (n + 1) + " 隊"),
        MG.ui.dom.h("span", { class: "sub" }, n === cur ? "目前" : (info.members + "/" + info.slots)));
      body.appendChild(row);
    }
    if (cur >= 0) body.appendChild(MG.ui.dom.h("button", { class: "btn sm danger", style: { width: "100%" }, on: { click: () => { removeFromAllTeams(h.id); m.close(); renderList(); } } }, "移出所有隊伍"));
    body.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "取消"));
  }
  /* v139：把英雄編入指定隊（原子：先移出原隊再填入；出戰隊變動立即生效） */
  function assignToTeam(h, n) {
    const st = S();
    const slots = MG.sys.buildings.effects().formationSlots;
    const t = (st.formations && st.formations[n]) || [null, null, null, null, null];
    if (t.includes(h.id)) { MG.ui.dom.toast("「" + h.name + "」已在第 " + (n + 1) + " 隊", "bad", "icon_formation"); return; }
    if (Array.isArray(st.formations)) for (const f of st.formations) { const i = f.indexOf(h.id); if (i >= 0) f[i] = null; }
    const idx = t.indexOf(null);
    if (idx === -1 || idx >= slots) { MG.ui.dom.toast("第 " + (n + 1) + " 隊已滿（升級酒館可增加出戰人數）", "bad", "icon_formation"); return; }
    t[idx] = h.id;
    if (n === (st.activeTeam || 0)) {
      st.formation = t.slice(); // 鏡像同步
      MG.sys.hunters.syncDispatchFromFormation(); // 出戰隊變動 → 派遣列表同步
      MG.sys.battle.reset();    // 出戰隊變動：立即生效
    }
    MG.core.audio.SFX.click();
    MG.ui.dom.toast("「" + h.name + "」已編入第 " + (n + 1) + " 隊" + (n === (st.activeTeam || 0) ? "（出戰中，立即生效）" : ""), "", "icon_formation");
  }
  /* v139：從所有隊伍移出（搭配編入視窗） */
  function removeFromAllTeams(id) {
    const st = S();
    let removed = false;
    if (Array.isArray(st.formations)) for (const f of st.formations) { const i = f.indexOf(id); if (i >= 0) { f[i] = null; removed = true; } }
    if (removed && st.formations) {
      const t = st.formations[st.activeTeam || 0] || [];
      st.formation = t.slice();
      MG.sys.hunters.syncDispatchFromFormation();
      MG.sys.battle.reset();
      MG.core.audio.SFX.click();
      MG.ui.dom.toast("已移出所有隊伍（出戰中，立即生效）", "", "icon_formation");
    }
  }
  function openDetail(id) {
    const st = S();
    const m = MG.ui.dom.modal("", null, {});
    const panelBody = MG.ui.dom.h("div", null);
    m.panel.appendChild(panelBody);
    // v140：底部操作列固定於視窗（不隨內容滾動）
    const actionBar = MG.ui.dom.h("div", { style: { borderTop: "1px solid var(--line)", padding: "8px 0 2px", marginTop: "8px" } });
    m.panel.appendChild(actionBar);
    let tab = "stats";        // 內容頁籤：屬性/裝備/技能
    let lastStats = null;     // 屬性變化偵測（綠箭頭）
    // v139：操作後原地刷新（不重開視窗）——renderBody 重建內容並保留視窗
    function renderBody() {
      const h = st.hunters.find(x => x.id === id);
      if (!h) { m.close(); renderList(); return; }
      const cls = D.classes[h.cls];
      const eff = MG.sys.hunters.effectiveStats(h);
      const base = MG.sys.hunters.baseStats(h);
      // v158 神器裝備選單（owned → 裝備／卸下／更換）
      function pickArtifact() {
        const owned = Object.keys((st.artifacts && st.artifacts.owned) || {});
        const am = MG.ui.dom.modal("神器", null, { icon: "icon_charm" });
        if (!owned.length) {
          am.panel.appendChild(MG.ui.dom.h("div", { class: "empty" }, "尚未擁有神器\n可於商城（鑽石）或活動商店取得"));
          am.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => am.close() } }, "關閉"));
          return;
        }
        for (const aid of owned) {
          const a = MG.data.artifacts[aid];
          if (!a) continue;
          const equipped = h.art === aid;
          const set = () => { h.art = equipped ? null : aid; am.close(); refreshDetail(); };
          am.panel.appendChild(MG.ui.dom.h("div", { class: "row", style: { borderColor: equipped ? "var(--gold)" : "var(--line)" }, on: { click: set } },
            MG.ui.dom.icon(a.icon, 22),
            MG.ui.dom.h("div", { class: "grow" },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, a.name, equipped ? MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, "裝備中") : null),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, a.passive.name + "：" + a.passive.desc)),
            MG.ui.dom.h("button", { class: "btn sm " + (equipped ? "" : "gold"), on: { click: (e) => { e.stopPropagation(); set(); } } }, equipped ? "卸下" : "裝備")));
        }
      }
      // v140：與上次渲染比較屬性變化（升級/突破後綠色 ↑）
      const prev = lastStats;
      lastStats = { atk: eff.atk, def: eff.def, hp: eff.hp, mp: eff.mp };
      const up = (k) => !!(prev && eff[k] > prev[k]);
      // ---- 頭部：大頭像 + 資訊 + 戰力 ----
      const head = MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: "4px" } },
        MG.ui.dom.icon(h.sprite || cls.icon, 56),
        MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 900, fontSize: "17px", marginTop: "4px" } },
          MG.ui.dom.icon(cls.icon, 20),
          MG.ui.dom.h("span", null, h.name),
          MG.ui.dom.h("span", { class: "rar" + h.rarity, style: { fontSize: "12px" } }, MG.ui.dom.stars(h.rarity))),
        MG.ui.dom.h("div", { class: "sub" },
          h.legend ? MG.ui.dom.h("span", { style: { color: "var(--gold)", fontWeight: 900 } }, "✦ 傳奇英雄 ") : null,
          MG.ui.dom.h("span", { style: { color: (MG.config.ELEMENTS[MG.config.CLASS_ELEMENT[h.cls]] || {}).color || "var(--dim)", fontWeight: 800 } },
            (MG.config.ELEMENTS[MG.config.CLASS_ELEMENT[h.cls]] || {}).name || ""),
          " · " + cls.name + " · Lv " + h.level + " · 突破 " + (h.promoted || 0) + " 階"
          + ((h.rarity || 1) > (h.bornRarity || h.rarity || 1) ? " · 升星 +" + ((h.rarity || 1) - (h.bornRarity || h.rarity || 1)) : "")),
        MG.ui.dom.h("div", { style: { fontSize: "15px", fontWeight: 900, color: "var(--gold)", marginTop: "2px", fontVariantNumeric: "tabular-nums" } },
          "戰力 " + MG.util.fmt(MG.sys.hunters.power(h))));
      // ---- 內容頁籤 ----
      const tabRow = MG.ui.dom.h("div", { style: { display: "flex", gap: "6px", justifyContent: "center", margin: "6px 0 8px" } },
        [["stats", "屬性"], ["gear", "裝備"], ["skill", "技能"]].map(([t, label]) => MG.ui.dom.h("div", {
          class: "chip" + (tab === t ? " on" : ""),
          on: { click: () => { tab = t; MG.core.audio.SFX.click(); renderBody(); } }
        }, label)));
      const content = MG.ui.dom.h("div", null);
      if (tab === "stats") {
        // 經驗條
        const expPct = Math.min(100, h.exp / MG.sys.hunters.expNeed(h) * 100);
        content.appendChild(MG.ui.dom.h("div", { style: { margin: "4px 0 8px" } },
          MG.ui.dom.h("div", { class: "pbar blue", style: { height: "8px" } }, MG.ui.dom.h("i", { style: { width: expPct + "%" } })),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px", textAlign: "center" } }, "經驗 " + MG.util.fmt(h.exp) + " / " + MG.util.fmt(MG.sys.hunters.expNeed(h)))));
        // 屬性（戰力在頭部）
        const statCell = (label, val, delta, color, arrow) => MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: "8px", padding: "6px 4px", textAlign: "center" } },
          MG.ui.dom.h("div", { style: { fontSize: "10px", color: "var(--dim)" } }, label),
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: "13px", color: color || "var(--fg,#e8e6f2)" } }, val,
            arrow ? MG.ui.dom.h("span", { style: { color: "#57c96b", fontSize: "11px", fontWeight: 900 } }, " ↑") : null),
          delta ? MG.ui.dom.h("div", { style: { fontSize: "9px", color: "var(--gold)" } }, delta) : null);
        content.appendChild(MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" } },
          statCell("攻擊", Math.floor(eff.atk), "+" + Math.floor(Math.max(0, eff.atk - base.atk)), null, up("atk")),
          statCell("防禦", Math.floor(eff.def), "+" + Math.floor(Math.max(0, eff.def - base.def)), null, up("def")),
          statCell("生命", Math.floor(eff.hp), "+" + Math.floor(Math.max(0, eff.hp - base.hp)), null, up("hp")),
          statCell("魔力", Math.floor(eff.mp), "+" + Math.floor(Math.max(0, eff.mp - base.mp)), null, up("mp")),
          statCell("攻速", eff.spd.toFixed(2) + "/秒", null),
          statCell("暴擊", Math.round(eff.crit * 100) + "%", null)));
        // v157 傳說英雄被動
        if (h.legend && MG.data.hunters.LEGENDS && MG.data.hunters.LEGENDS[h.legend]) {
          const ld = MG.data.hunters.LEGENDS[h.legend];
          content.appendChild(MG.ui.dom.h("div", { style: { marginTop: 6, padding: "6px 8px", background: "rgba(255,209,102,.1)", border: "1px solid var(--gold)", borderRadius: 8 } },
            MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 11, color: "var(--gold)" } }, "✦ 傳奇被動：" + ld.passive.name),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, ld.passive.desc),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, fontStyle: "italic", marginTop: 1 } }, "「" + ld.flavor + "」")));
          // v210 傳說徽章（個人長線養成：被動 ×(1+0.03×(階-1))，滿階 ×1.15）
          const bg = (MG.data.hunters.LEGEND_BADGES || {})[h.legend];
          if (bg) {
            const lv = MG.sys.hunters.badgeLv(h.legend);
            const perStep = (ld.passive && ld.passive.teamAtk) ? 0.02 : 0.03;
            content.appendChild(MG.ui.dom.h("div", { style: { marginTop: 4, padding: "6px 8px", background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 8 } },
              MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
                MG.ui.dom.icon("icon_honor", 14),
                MG.ui.dom.h("span", { style: { fontWeight: 900, fontSize: 11, color: "var(--gold)" } }, "徽章：" + bg.name + " " + lv + "/6"),
                MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9 } }, lv ? "被動 ×" + (1 + perStep * (lv - 1)).toFixed(2) : "被動 ×1.00")),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, bg.desc + "・碎片 " + (st.legendShards || 0) + " 枚（重複傳說 ×5／深淵領主 ×1／活動商店）"),
              lv < 6
                ? MG.ui.dom.h("button", { class: "btn sm gold", style: { marginTop: 4, minHeight: 26, fontSize: 10 }, on: { click: () => { const r = MG.sys.hunters.badgeUp(h.legend); if (!r.ok) MG.ui.dom.toast(r.reason, "bad", "icon_honor"); refreshDetail(); } } },
                  "升級（" + (1 + lv) + " 片・" + MG.util.fmt(300 * Math.pow(2, lv)) + " 金）")
                : MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 3 } }, "已達最高階，傳說之力圓滿。")));
          }
        }
        // v170 傳說羈絆（當前編隊狀態）
        if (h.legend && MG.data.hunters.LEGEND_BONDS) {
          const myBonds = MG.sys.hunters.bondsState().filter(b => b.members.includes(h.legend));
          if (myBonds.length) {
            content.appendChild(MG.ui.dom.h("div", { class: "section-h", style: { margin: "8px 2px 4px" } }, MG.ui.dom.h("span", { class: "t" }, "傳說羈絆")));
            for (const b of myBonds) {
              const names = b.members.map(m => (MG.data.hunters.LEGENDS[m] || {}).name || m);
              content.appendChild(MG.ui.dom.h("div", { style: { padding: "5px 8px", background: "var(--panel2)", borderRadius: 8, marginBottom: 4, border: "1px solid " + (b.active ? "var(--gold)" : "var(--line)") } },
                MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 11, color: b.active ? "var(--gold)" : "" } },
                  (b.active ? "✦ " : "") + b.name + "（" + b.have + "/" + b.members.length + "）",
                  MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 9 } }, names.join("＋"))),
                MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9 } }, b.flavor),
                MG.ui.dom.h("div", { style: { fontSize: 9, color: b.active ? "#7ee787" : "var(--dim)" } },
                  "效果：" + Object.entries(b.fx).map(([k, v]) => (k === "crit" || k === "skillDmg" ? "技能威力" : ({ atk: "攻擊", def: "防禦", hp: "生命", spd: "攻速" })[k] || k) + " +" + Math.round(v * 100) + "%").join("、") + (b.active ? "　✓ 已生效" : ""))));
            }
          }
        }
      } else if (tab === "gear") {
        // v158 神器槽（獨立於裝備，一件被動神器）— v195 精煉：等級與效果成長
        const art = h.art ? MG.data.artifacts[h.art] : null;
        const artLv = h.art ? MG.sys.hunters.artifactLevel(h.art) : 0;
        const artMul = h.art ? MG.sys.hunters.artifactMul(h.art) : 1;
        content.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 8, alignItems: "center", padding: "6px 8px", background: "var(--panel2)", border: "1px solid var(--gold)", borderRadius: 8, marginBottom: 8 } },
          MG.ui.dom.icon(art ? art.icon : "icon_charm", 22),
          MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
            art ? MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12, color: "var(--gold)" } },
              "神器：" + art.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "Lv " + artLv + "/10" + (artMul > 1 ? "（效果 ×" + artMul.toFixed(2) + "）" : "")))
                : MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12, color: "var(--dim2)" } }, "神器槽（未裝備）"),
            art ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, art.passive.name + "：" + art.passive.desc)
                : MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "商城或活動商店取得，提供獨特被動")),
          art ? MG.ui.dom.h("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
            MG.ui.dom.h("button", { class: "btn sm", style: { minHeight: 28, padding: "0 8px", fontSize: 10 }, on: { click: pickArtifact } }, "更換"),
            (() => {
              const rc = MG.sys.hunters.artifactRefineCost(h.art);
              if (!rc) {
                // v245 神器覺醒：Lv10 滿後 3 階終局階梯（artifactMul +0.12/階 — 覺醒順序＝資源決策）
                const ac = MG.sys.hunters.artifactAwakenCost(h.art);
                const aw = MG.sys.hunters.awakeLevel(h.art);
                if (!ac) return MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9, textAlign: "center" } }, aw >= 3 ? "已覺醒 III" : "已滿級");
                const awCost = MG.util.fmt(ac.gold) + "金" + Object.keys(ac.mats).map(m => "・" + MG.config.MATS[m].name + "×" + ac.mats[m]).join("");
                return MG.ui.dom.h("button", {
                  class: "btn sm " + (ac.can ? "gold" : ""), style: { minHeight: 28, padding: "0 8px", fontSize: 10 }, disabled: !ac.can,
                  title: "覺醒 " + "I II III".split(" ")[ac.aw] + "：消耗 " + awCost,
                  on: { click: () => {
                    const r = MG.sys.hunters.awakenArtifact(h.art);
                    MG.ui.dom.toast(r.ok ? "神器覺醒至 " + "I II III".split(" ")[r.aw - 1] + " 階！效果提升" : r.reason, r.ok ? "good" : "bad", art.icon);
                    refreshDetail();
                  } }
                }, "覺醒 " + "I II III".split(" ")[ac.aw]);
              }
              const costTxt = MG.util.fmt(rc.gold) + "金" + Object.keys(rc.mats).filter(m => rc.mats[m] > 0).map(m => "・" + MG.config.MATS[m].name + "×" + rc.mats[m]).join("");
              // v253 精煉到滿：影子模擬逐級預估（v243「到滿」家族最後缺口 — 8 神器×9 級 72 次逐擊 → 1 擊）
              const rp = MG.sys.hunters.refinePreview(h.art);
              return MG.ui.dom.h("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
                MG.ui.dom.h("button", {
                  class: "btn sm " + (rc.can ? "gold" : ""), style: { minHeight: 28, padding: "0 8px", fontSize: 10 }, disabled: !rc.can,
                  title: "精煉至 Lv" + rc.next + "：消耗 " + costTxt,
                  on: { click: () => {
                    const r = MG.sys.hunters.refineArtifact(h.art);
                    MG.ui.dom.toast(r.ok ? "神器精煉至 Lv" + r.lv + "！" : r.reason, r.ok ? "good" : "bad", art.icon);
                    refreshDetail();
                  } }
                }, "精煉 Lv" + rc.next),
                rp.done > 0 ? MG.ui.dom.h("button", {
                  class: "btn sm" + (rp.done >= 1 ? " gold" : ""), style: { minHeight: 28, padding: "0 8px", fontSize: 10 },
                  title: "連續精煉至 Lv" + rp.next + "：總耗 " + MG.util.fmt(rp.gold) + "金＋素材",
                  on: { click: () => {
                    const run = () => {
                      const r = MG.sys.hunters.refineToMax(h.art);
                      MG.ui.dom.toast(r.ok ? "精煉 ×" + r.steps + " → Lv" + r.lv + "（花費 " + MG.util.fmt(r.spent) + " 金）" : r.reason, r.ok ? "good" : "bad", art.icon);
                      refreshDetail();
                    };
                    if (rp.done > 3 || rp.gold > 20000) {
                      MG.ui.dom.confirm("精煉到滿", "連續精煉 " + rp.done + " 級 → Lv" + rp.next + "，總耗 " + MG.util.fmt(rp.gold) + " 金幣＋素材若干。確定？", run, { okText: "精煉" });
                    } else run();
                  } }
                }, "到滿 → Lv" + rp.next) : null);
            })())
            : MG.ui.dom.h("button", { class: "btn sm gold", style: { minHeight: 30 }, on: { click: pickArtifact } }, "裝備")));
        // 裝備格（v140：48px、空槽顯示部位名）
        const slotsRow = MG.ui.dom.h("div", { style: { display: "flex", gap: "6px", justifyContent: "center", marginBottom: "8px", flexWrap: "wrap" } });
        for (const slot of MG.config.SLOTS) {
          const uid = h.equip[slot];
          const item = uid ? st.inventory.items.find(i => i.uid === uid) : null;
          const cell = MG.ui.dom.h("div", {
            style: {
              width: "48px", height: "48px", borderRadius: "8px", border: "2px solid " + (item ? MG.config.RARITY[item.rarity - 1].color : "var(--line)"),
              background: item ? "var(--panel2)" : "rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer"
            },
            on: { click: () => pickEquip(h, slot, renderBody) }
          },
            MG.ui.dom.icon(item ? slotIcon(item) : "icon_" + slot, 22),
            MG.ui.dom.h("div", { style: { fontSize: "8px", color: "var(--dim2)", marginTop: "2px", lineHeight: 1 } }, item ? (item.enhance > 0 ? "+" + item.enhance : MG.config.SLOT_NAMES[slot]) : MG.config.SLOT_NAMES[slot]),
            item && item.enhance > 0 ? MG.ui.dom.h("div", { style: { position: "absolute", top: "-6px", right: "-4px", fontSize: "9px", fontWeight: 900, color: "var(--gold)", background: "#14121f", borderRadius: "4px", padding: "0 2px" } }, "+" + item.enhance) : null);
          slotsRow.appendChild(cell);
        }
        content.appendChild(slotsRow);
        // 套裝加成
        const cnt = MG.sys.hunters.setCounts(h);
        const setKeys = Object.keys(cnt);
        if (setKeys.length) {
          const box = MG.ui.dom.h("div", { style: { marginBottom: "4px" } });
          for (const sid of setKeys) {
            const set = MG.data.equipment.sets[sid];
            if (!set) continue;
            const nn = cnt[sid];
            const active = [];
            if (nn >= 2 && set.bonus[2]) active.push("2件：" + set.bonus[2]);
            if (nn >= 4 && set.bonus[4]) active.push("4件：" + set.bonus[4]);
            box.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "5px 8px", background: "var(--panel2)", borderRadius: "8px", marginBottom: "4px" } },
              MG.ui.dom.icon(set.icon, 16),
              MG.ui.dom.h("div", { class: "grow" },
                MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: "12px", color: "var(--gold)" } }, set.name + " " + nn + "/4"),
                MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px" } }, active.length ? "已啟動：" + active.join("、") : "再收集 " + Math.max(2 - nn, 0) + " 件啟動套裝效果"))));
          }
          content.appendChild(MG.ui.dom.h("div", null,
            MG.ui.dom.h("div", { class: "section-h", style: { margin: "4px 2px 6px" } }, MG.ui.dom.h("span", { class: "t" }, "套裝效果")),
            box));
        } else {
          content.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", fontSize: "10px", padding: "4px 0 6px" } }, "尚未啟動任何套裝（收集同套裝 2/4 件啟動加成）"));
        }
        // v215 套裝共鳴：全隊同套裝件數進度（activeTeam 為單位 — 無套裝成員也顯示，v215FIX 移出個人套裝分支）
        {
          const rs = MG.sys.hunters.resonanceStats ? MG.sys.hunters.resonanceStats() : null;
          if (rs && Object.keys(rs).length) {
            const rsBox = MG.ui.dom.h("div", { style: { marginBottom: "4px" } });
            for (const sid in rs) {
              const set = MG.data.equipment.sets[sid];
              if (!set || !set.bonusRes) continue;
              const r = rs[sid];
              // v215FIX：門檻從資料派生（不再硬編碼 4/8/12 — 資料改門檻時 UI 自動同步）
              const tiers = Object.keys(set.bonusRes).map(Number).sort((a, b) => a - b);
              const maxTier = tiers[tiers.length - 1] || 12;
              const acts = [];
              for (const need of tiers) if (r.pieces >= need) acts.push(need + "件：" + set.bonusRes[need]);
              const nextNeed = tiers.find(n => r.pieces < n);
              rsBox.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "5px 8px", background: "rgba(255,209,102,.06)", border: "1px solid var(--line)", borderRadius: "8px", marginBottom: "4px" } },
                MG.ui.dom.icon(set.icon, 16),
                MG.ui.dom.h("div", { class: "grow" },
                  MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: "11px", color: "var(--gold)" } }, "共鳴：" + set.name + " " + r.pieces + "/" + maxTier + " 件（全隊）"),
                  MG.ui.dom.h("div", { class: "sub", style: { fontSize: "9px" } }, acts.length ? "已啟動：" + acts.join("、") : "再湊 " + (nextNeed - r.pieces) + " 件啟動全隊共鳴"))));
            }
            content.appendChild(MG.ui.dom.h("div", null,
              MG.ui.dom.h("div", { class: "section-h", style: { margin: "4px 2px 6px" } }, MG.ui.dom.h("span", { class: "t" }, "套裝共鳴")),
              rsBox));
          }
        }
      } else {
        // 技能
        const skUnlock = D.skillAtLevel;
        const nextSk = skUnlock.find(lv => h.level < lv);
        // v183 QoL：全部升級（技能書夠就升到滿級，不足則升到書盡為止）
        content.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "5px 8px", background: "var(--panel2)", borderRadius: "8px", marginBottom: "4px" } },
          MG.ui.dom.icon("icon_book", 16),
          MG.ui.dom.h("div", { class: "grow", style: { fontSize: "11px" } },
            "技能書：", MG.ui.dom.h("b", { style: { color: "var(--gold)" } }, MG.util.fmt(st.currencies.book || 0)), " 本"),
          MG.ui.dom.h("button", {
            class: "btn sm gold", style: { minHeight: 28, padding: "2px 8px", flexShrink: 0 },
            on: { click: () => {
              if (!MG.sys.hunters.unlockedSkills(h).length) {
                MG.ui.dom.toast("英雄等級不足，尚未解鎖技能", "bad", "icon_book");
                return;
              }
              let done = 0, spent = 0, progressed = true;
              while (progressed) {
                progressed = false;
                for (const sk of MG.sys.hunters.unlockedSkills(h)) {
                  const cost = MG.sys.hunters.skillUpCost(h, sk.id);
                  if (cost < 0) continue; // 滿級
                  if ((st.currencies.book || 0) < cost) continue; // 書不足
                  const r = MG.sys.hunters.upgradeSkill(h, sk.id);
                  if (r.ok) { done++; spent += cost; progressed = true; }
                }
              }
              MG.ui.dom.toast(done > 0 ? "技能升級 ×" + done + "（消耗 " + spent + " 本技能書）" : ((st.currencies.book || 0) > 0 ? "技能已全數滿級" : "技能書不足"), done > 0 ? "good" : "bad", "icon_book");
              refreshDetail();
            } }
          }, "全部升級")));
        for (const sk of MG.sys.hunters.unlockedSkills(h)) {
          const def = D.skills[sk.id];
          const cost = MG.sys.hunters.skillUpCost(h, sk.id);
          const maxed = cost < 0;
          const canUp = !maxed && (st.currencies.book || 0) >= cost;
          const isActive = MG.sys.hunters.activeSkillOf(h) === sk.id; // v250 技能編排
          const isSub = MG.sys.hunters.subSkillOf(h) === sk.id; // v255 副技
          content.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "5px 8px", background: "var(--panel2)", borderRadius: "8px", marginBottom: "4px", border: isActive ? "1px solid var(--gold)" : (isSub ? "1px solid #57c96b" : "1px solid transparent") } },
            MG.ui.dom.icon(def.icon, 18),
            MG.ui.dom.h("div", { class: "grow" },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: "12px" } }, def.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: "4px", fontSize: "10px" } }, "Lv " + sk.lvl + "/10" + (sk.lvl > 1 ? "（威力 x" + (1 + 0.12 * (sk.lvl - 1)).toFixed(2) + "）" : ""))),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px" } }, def.desc + (isSub ? "（副技 — 凍結效果減半）" : ""))),
            // v250/v255 技能編排：主技+副技雙槽（戰鬥依序施放 — 個人構築：爆發+續航/輸出+控場/坦+嘲諷）
            MG.ui.dom.h("button", {
              class: "btn sm" + (isActive ? " gold" : ""), style: { minHeight: 28, padding: "2px 8px", flexShrink: 0 },
              on: { click: () => {
                if (isActive) return;
                const r = MG.sys.hunters.setActiveSkill(h, sk.id, "main");
                MG.ui.dom.toast(r.ok ? "「" + def.name + "」設為主技（戰鬥自動施放）" : r.reason, r.ok ? "good" : "bad", "icon_book");
                refreshDetail();
              } }
            }, isActive ? "✓ 主" : "設為主技"),
            MG.ui.dom.h("button", {
              class: "btn sm" + (isSub ? " green" : ""), style: { minHeight: 28, padding: "2px 8px", flexShrink: 0 },
              on: { click: () => {
                if (isSub) return;
                const r = MG.sys.hunters.setActiveSkill(h, sk.id, "sub");
                MG.ui.dom.toast(r.ok ? "「" + def.name + "」設為副技（獨立冷卻自動施放）" : r.reason, r.ok ? "good" : "bad", "icon_book");
                refreshDetail();
              } }
            }, isSub ? "✓ 副" : "設為副技"),
            MG.ui.dom.h("button", {
              class: "btn sm " + (canUp ? "gold" : ""), style: { minHeight: 28, padding: "2px 8px", flexShrink: 0 },
              disabled: !canUp,
              on: { click: () => { const r = MG.sys.hunters.upgradeSkill(h, sk.id); MG.ui.dom.toast(r.ok ? "「" + def.name + "」升至 Lv" + r.lvl + "！" : r.reason, r.ok ? "good" : "bad", "icon_book"); refreshDetail(); } }
            }, maxed ? "滿級" : "升級 " + cost + "書")));
        }
        if (nextSk && MG.sys.hunters.unlockedSkills(h).length < D.classes[h.cls].skills.length) {
          content.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", fontSize: "10px", padding: "2px 0 6px" } },
            "英雄 Lv " + nextSk + " 解鎖下一個技能"));
        }
        if (!MG.sys.hunters.unlockedSkills(h).length) {
          content.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", fontSize: "10px", padding: "4px 0 6px" } }, "英雄 Lv " + (D.skillAtLevel[0] || 10) + " 解鎖第一個技能"));
        }
      }
      panelBody.innerHTML = "";
      panelBody.appendChild(head);
      panelBody.appendChild(tabRow);
      panelBody.appendChild(content);
      // ---- 底部固定操作列 ----
      const potQty = defId => st.inventory.items.filter(i => i.defId === defId).reduce((a, i) => a + (i.qty === undefined ? 1 : i.qty), 0);
      const drinkTo = (defId, isHp, name) => {
        const item = st.inventory.items.find(i => i.defId === defId);
        if (!item || !item.qty) { MG.ui.dom.toast("沒有" + name + "，可從副本掉落或商店購買", "bad", defId); return; }
        // v179 平衡：滿血/滿魔不消耗藥水（避免資源白白蒸發）；max 取整以匹配整數 hp 儲存（避免浮點差 1 誤喝）
        const max = Math.round(MG.sys.hunters.effectiveStats(h)[isHp ? "hp" : "mp"]);
        const cur = isHp ? (h.hp === undefined ? max : h.hp) : (h.mp === undefined ? max : h.mp);
        if (cur >= max) { MG.ui.dom.toast((isHp ? "HP" : "MP") + " 已滿，無需使用" + name, "", defId); return; }
        item.qty = (item.qty || 1) - 1;
        if (item.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== item.uid);
        if (isHp) h.hp = Math.min(max, cur + Math.round(max * 0.5));
        else h.mp = Math.min(max, cur + Math.round(max * 0.5));
        MG.core.audio.SFX.potion();
        MG.ui.dom.toast(name + "：補 " + (isHp ? "HP" : "MP") + " 50%", "good", defId);
        refreshDetail();
      };
      // 突破需求資訊（v140：按鈕下顯示資源需求與不足原因）
      const promoN = (h.promoted || 0) + 1;
      let promoInfo = null;
      if (promoN <= D.promoLevels.length) {
        const pv = MG.sys.hunters.promoPreview(h);
        const costParts = [MG.util.fmt(pv.cost.gold) + " 金幣"];
        for (const mk in pv.cost.mats) costParts.push(MG.util.fmt(pv.cost.mats[mk]) + " " + ((MG.config.MATS[mk] || {}).name || mk));
        const reason = !pv.can ? (h.level < pv.needLv ? "等級不足（需 Lv " + pv.needLv + "）" : "資源不足") : "";
        // v231 缺口可視化：資源不足時逐項「缺多少（持 X/需 Y）」+ 素材來源註記
        let short = "";
        if (pv.can === false && h.level >= pv.needLv) {
          const miss = [];
          if (st.currencies.gold < pv.cost.gold) miss.push("金幣 缺" + MG.util.fmt(pv.cost.gold - st.currencies.gold) + "（持 " + MG.util.fmt(st.currencies.gold) + "）");
          for (const mk in pv.cost.mats) {
            const have = st.mats[mk] || 0;
            if (have < pv.cost.mats[mk]) miss.push((MG.config.MATS[mk] || {}).name + " 缺" + MG.util.fmt(pv.cost.mats[mk] - have) + "（持 " + MG.util.fmt(have) + "）");
          }
          short = miss.length ? "　" + miss.join("、") : "";
        }
        promoInfo = MG.ui.dom.h("div", { style: { fontSize: "9px", color: pv.can ? "var(--dim)" : "#ff9c9c", lineHeight: 1.5, padding: "0 2px" } },
          "突破 " + (h.promoted || 0) + "→" + promoN + "：全屬性 +20%（攻+" + pv.atk + " 防+" + pv.def + " 血+" + pv.hp + "）",
          MG.ui.dom.h("div", null, "消耗：" + costParts.join("、") + (reason ? " · " + reason : "") + short));
      }
      actionBar.innerHTML = "";
      actionBar.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: "6px" } },
        MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1 }, on: { click: () => { const n = MG.sys.equipment.autoEquip(h); MG.ui.dom.toast(n > 0 ? "已自動穿上 " + n + " 件最佳裝備" : "沒有更強的裝備可穿", n > 0 ? "good" : "", "icon_armor"); refreshDetail(); } } }, "自動穿裝"),
        MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1 }, on: { click: () => { MG.sys.hunters.train(h); refreshDetail(); } } }, "訓練 " + MG.util.fmt(D.trainCost(h.level)) + "金"),
        // v178 QoL：批量訓練 ×10（金幣不足或滿級自動停止）
        MG.ui.dom.h("button", { class: "btn sm gold", style: { flex: 1 }, on: { click: () => {
          let done = 0;
          for (let i = 0; i < 10; i++) {
            if (h.level >= 200) break; // 滿級不再浪費金幣
            if (!MG.sys.hunters.train(h)) break; // 金幣不足
            done++;
          }
          MG.ui.dom.toast(done > 0 ? "訓練 ×" + done + " 完成" : (h.level >= 200 ? "已達最高等級" : "金幣不足"), done > 0 ? "good" : "bad", "icon_train");
          refreshDetail();
        } } }, "訓練×10"),
        // v213 QoL：訓練到滿（金幣充裕時 ×10 需重複點 20+ 次 — 仿 v208 連升 confirm 防誤觸）
        // v213FIX：精確模擬（影子金幣扣減＋expNeed/trainExp/gainExp 同公式 — 與實際 train 一致）
        MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1 }, on: { click: () => {
          const sim = () => {
            let lv = h.level, exp = h.exp || 0, n = 0, cost = 0, gold = st.currencies.gold;
            const mul = 1 + (st.buildings.training || 0) * 0.1;
            while (lv < 200) {
              const k = D.trainCost(lv);
              if (gold < k) break;
              gold -= k; cost += k; n++;
              exp += Math.floor(D.trainExp(lv) * mul);
              while (exp >= D.expNeed(lv) && lv < 200) { exp -= D.expNeed(lv); lv++; }
            }
            return { n, cost, to: lv };
          };
          const est = sim();
          const run = () => {
            const start = h.level;
            let done = 0, cost = 0;
            while (h.level < 200) {
              const k = D.trainCost(h.level);
              if (st.currencies.gold < k) break;
              if (!MG.sys.hunters.train(h)) break;
              done++; cost += k;
            }
            MG.ui.dom.toast(done > 0 ? "訓練 ×" + done + "（Lv " + start + "→" + h.level + "，花費 " + MG.util.fmt(cost) + " 金）" : (h.level >= 200 ? "已達最高等級" : "金幣不足"), done > 0 ? "good" : "bad", "icon_train");
            refreshDetail();
          };
          if (est.n > 10) MG.ui.dom.confirm("訓練到滿", "「" + h.name + "」可訓練 ×" + est.n + " 至 Lv" + est.to + "（約需 " + MG.util.fmt(est.cost) + " 金幣）。確定？", run, { okText: "訓練" });
          else run();
        } } }, "到滿"),
        MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1 }, on: { click: () => drinkTo("item_pot_hp", true, "生命藥水") } }, "補血 x" + potQty("item_pot_hp")),
        MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1 }, on: { click: () => drinkTo("item_pot_mp", false, "魔力藥水") } }, "補魔 x" + potQty("item_pot_mp"))));
      actionBar.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: "6px", marginTop: "6px" } },
        MG.ui.dom.h("button", {
          class: "btn sm " + (MG.sys.hunters.canPromote(h) ? "green" : ""), style: { flex: 3 },
          disabled: !MG.sys.hunters.canPromote(h),
          on: { click: () => { if (MG.sys.hunters.promote(h)) { showPromoteCelebration(h); refreshDetail(); } else MG.ui.dom.toast("無法突破：等級或資源不足", "bad", "icon_promote"); } }
        }, "突破 " + (h.promoted || 0) + "→" + promoN),
        MG.ui.dom.h("button", { class: "btn sm " + (h.locked ? "gold" : ""), style: { flex: 1 }, title: h.locked ? "鎖定中：不可遣散、不可作為升星材料" : "鎖定保護：防誤遣散/誤升星", on: { click: () => { h.locked = !h.locked; refreshDetail(); renderList(); } } }, h.locked ? "🔒 已鎖定" : "鎖定"),
        MG.ui.dom.h("button", { class: "btn sm danger", style: { flex: 1 }, on: { click: () => {
          MG.ui.dom.confirm("遣散英雄", "確定要遣散「" + h.name + "」嗎？將返還實付資源金幣" + ((() => { const n = MG.sys.hunters.SHARD_RATES[h.rarity] || 0; return (!h.legend && n > 0) ? "，並獲得英雄碎片 ×" + n + "（碎片可合成自選職業英雄）" : ""; })()) + "，其裝備會送回背包。", () => { MG.sys.hunters.dismiss(h); m.close(); renderList(); });
        } } }, "遣散")));
      if (promoInfo) actionBar.appendChild(promoInfo);
      // v163 英雄重塑：返還訓練與突破資源（公式精算），回到 Lv1 未突破
      const rr = MG.sys.hunters.resetRefund(h);
      const canReset = h.level > 1 || (h.promoted || 0) > 0;
      actionBar.appendChild(MG.ui.dom.h("div", { style: { marginTop: 6 } },
        MG.ui.dom.h("button", {
          class: "btn sm", style: { width: "100%" },
          disabled: !canReset,
          on: { click: () => {
            const rr2 = MG.sys.hunters.resetRefund(h);
            const matTxt = Object.keys(rr2.mats).length
              ? "、" + Object.keys(rr2.mats).map(m => MG.util.fmt(rr2.mats[m]) + " " + ((MG.config.MATS[m] || {}).name || m)).join("、")
              : "";
            MG.ui.dom.confirm("英雄重塑", "將「" + h.name + "」重塑為 Lv1（未突破）？\n返還：金幣 " + MG.util.fmt(rr2.gold) + matTxt + "\n等級／突破／技能等級將重置，稀有度與神器保留。", () => {
              if (MG.sys.hunters.resetHero(h)) { refreshDetail(); renderList(); }
            });
          } }
        }, "重塑英雄（返還 " + MG.util.fmt(rr.gold) + " 金幣" + (Object.keys(rr.mats).length ? "＋素材" : "") + "）")));
      // v260 英雄置換：同職業投資對調（練錯救贖 — 消耗置換石）
      actionBar.appendChild(MG.ui.dom.h("div", { style: { marginTop: 6 } },
        MG.ui.dom.h("button", {
          class: "btn sm", style: { width: "100%" },
          on: { click: () => openSwap(h) }
        }, "置換（持有置換石 " + (st.currencies.swapStone || 0) + "）"),
        // v261：置換石 0 死胡同提示＋深鏈（唯一來源王者商店週限）
        !(st.currencies.swapStone || 0) ? MG.ui.dom.h("button", {
          class: "btn sm", style: { width: "100%", marginTop: 4, fontSize: 10 },
          on: { click: () => { m.close(); MG.ui.more.openRoyal(); } }
        }, "置換石取得：王者商店每週 30 幣兌換 1 顆 → 前往") : null));
      // ---- v147 升星（消耗同職業＋肥料英雄，稀有度成長） ----
      const sc = MG.sys.hunters.starUpCost(h);
      if (sc) {
        let starInfo = null;
        if (!sc.max) {
          const needTxt = "同職業 ★" + sc.star + " ×" + sc.needCopy + (sc.needFod ? " ＋ 任意職業 ★" + sc.star + " ×" + sc.needFod : "");
          const missing = [];
          if (sc.copies < sc.needCopy) missing.push("同職業 ★" + sc.star + " 缺 " + (sc.needCopy - sc.copies) + " 名");
          if (sc.fodder < sc.needFod) missing.push("肥料缺 " + (sc.needFod - sc.fodder) + " 名");
          const names = sc.used.length ? "將消耗：" + sc.used.map(x => "「" + x.name + "」").join("、") : "";
          const mul = MG.config.RARITY[sc.next - 1].grow / MG.config.RARITY[sc.star - 1].grow;
          starInfo = MG.ui.dom.h("div", { style: { fontSize: "9px", color: sc.can ? "var(--dim)" : "#ff9c9c", lineHeight: 1.5, padding: "0 2px" } },
            "升星 ★" + sc.star + "→★" + sc.next + "：全屬性 ×" + mul.toFixed(2) + "（生命魔力同步成長）",
            MG.ui.dom.h("div", null, "消耗：" + needTxt + (names ? " · " + names : "") + (missing.length ? " · " + missing.join("、") : "")));
        }
        actionBar.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: "6px", marginTop: "6px" } },
          MG.ui.dom.h("button", {
            class: "btn sm " + (!sc.max && sc.can ? "gold" : ""), style: { flex: 3 },
            disabled: sc.max || !sc.can,
            on: { click: () => {
              const c2 = MG.sys.hunters.starUpCost(h);
              if (!c2 || c2.max || !c2.can) return;
              MG.ui.dom.confirm("英雄升星", "將「" + h.name + "」升星至 ★" + c2.next + "？\n消耗：" + c2.used.map(x => "「" + x.name + "」（★" + (x.rarity || 1) + "）").join("、") + "\n被消耗的英雄將永久離開名冊（裝備會送回背包）。", () => {
                const fromStar = h.rarity || 1;
                if (MG.sys.hunters.starUp(h)) { showStarUpCelebration(h, fromStar); refreshDetail(); renderList(); }
                else MG.ui.dom.toast("升星失敗：消耗名單已變動", "bad", "icon_recruit");
              });
            } }
          }, sc.max ? "已達最高星級" : "升星 ★" + sc.star + "→★" + sc.next)));
        // v221 UI/UX：材料候選清單（「差N同職」的可見行動路徑 — 名冊誰能當材料、缺的去哪抽）
        if (!sc.max && !sc.can) {
          const cands = MG.sys.hunters.starCandidates(h);
          if (cands.length) {
            actionBar.appendChild(MG.ui.dom.h("div", { style: { fontSize: "9px", color: "var(--dim)", lineHeight: 1.5, padding: "2px 2px 0" } },
              "名冊中同職業 ★" + sc.star + " 候選：" + cands.slice(0, 5).map(c => "「" + c.name + "」Lv" + c.level + (c.locked ? "🔒" : "") + (c.inF ? "⚔" : "")).join("、") + (cands.length > 5 ? " 等 " + cands.length + " 名" : "")));
          }
          // 補齊同職業 → 招募（心願預選該職業）
          actionBar.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: "6px", marginTop: "4px" } },
            MG.ui.dom.h("button", {
              class: "btn sm", style: { flex: 1 },
              on: { click: () => {
                const wl = st.settings.wishlist || (st.settings.wishlist = []);
                if (wl.includes(h.cls)) {
                  MG.ui.dom.toast("「" + (D.classes[h.cls] || {}).name + "」已是心願職業（招募出現率 ×2）", "", "icon_recruit");
                } else if (wl.length >= 2) {
                  MG.ui.dom.toast("心願職業已滿（2 個）— 先移除一個再設", "bad", "icon_recruit"); // v221FIX：失敗時不彈成功提示
                } else {
                  wl.push(h.cls); MG.core.save.save();
                  MG.ui.dom.toast("已將「" + (D.classes[h.cls] || {}).name + "」設為心願職業（招募出現率 ×2）", "good", "icon_recruit");
                }
                openRecruit(refreshDetail); // v221FIX：招募完成後刷新詳情（候選/缺額/升星鈕狀態）
              } }
            }, "補齊同職業 → 招募（心願 ×2）")));
        }
        if (starInfo) actionBar.appendChild(starInfo);
      }
    }
    renderBody();
function refreshDetail() { renderBody(); }
    function slotIcon(item) { return "icon_" + MG.sys.equipment.slotOf(item); }
  }
  function pickEquip(h, slot, onChanged) {
    const st = S();
    const items = st.inventory.items.filter(i => MG.sys.equipment.slotOf(i) === slot && !(slot === "weapon" && i.wtype && i.wtype !== MG.config.CLASS_WEAPONS[h.cls]));
    const m = MG.ui.dom.modal(MG.config.SLOT_NAMES[slot] + " — 選擇裝備", null, {});
    if (!items.length) {
      m.panel.appendChild(MG.ui.dom.h("div", { class: "empty" }, "背包中沒有可用的" + MG.config.SLOT_NAMES[slot] + "\n（前往副本獲得裝備）"));
      m.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "關閉"));
      return;
    }
    // v141：目前穿戴的裝備（比較基準）
    const curUid = h.equip[slot];
    const curItem = curUid ? st.inventory.items.find(i => i.uid === curUid) : null;
    const curScore = curItem ? MG.sys.equipment.itemScore(curItem) : 0;
    for (const it of items) {
      const equipped = h.equip[slot] === it.uid;
      const s = MG.sys.equipment.displayStats(it);
      // v141：戰力比較（僅在英雄選裝視窗顯示，綠升紅降）
      const diff = Math.floor(MG.sys.equipment.itemScore(it) - curScore);
      const cmp = equipped ? null : MG.ui.dom.h("span", { style: { fontSize: "10px", fontWeight: 900, color: diff > 0 ? "#57c96b" : diff < 0 ? "#ff7a7a" : "var(--dim2)", whiteSpace: "nowrap" } }, diff > 0 ? "▲戰力提升 +" + MG.util.fmt(diff) : diff < 0 ? "▼戰力下降 " + MG.util.fmt(diff) : "＝持平");
      const rowEl = MG.ui.dom.h("div", { class: "row", style: { borderColor: MG.config.RARITY[it.rarity - 1].color }, on: { click: () => { MG.sys.equipment.equipToHunter(h, it); m.close(); onChanged && onChanged(); renderList(); } } },
        MG.ui.dom.icon(slot === "weapon" ? ({ sword: "icon_sword", bow: "icon_bow", staff: "icon_staff", dagger: "icon_dagger", greatsword: "icon_greatsword", mace: "icon_mace" }[it.wtype] || "icon_weapon") : "icon_" + slot, 24),
        MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
          MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" } },
            MG.ui.dom.h("span", { style: { fontWeight: 800, fontSize: "13px", color: MG.config.RARITY[it.rarity - 1].color } },
              MG.sys.equipment.nameOf(it) + (it.enhance > 0 ? " +" + it.enhance : "")),
            cmp),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px" } }, s.join(" / ")),
          it.set ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px", color: "var(--gold)" } }, MG.data.equipment.sets[it.set].name) : null),
        equipped ? MG.ui.dom.h("span", { class: "sub" }, "裝備中") : MG.ui.dom.h("button", { class: "btn sm gold", on: { click: (e) => { e.stopPropagation(); MG.sys.equipment.equipToHunter(h, it); m.close(); onChanged && onChanged(); renderList(); } } }, "裝備"));
      m.panel.appendChild(rowEl);
    }
  }
  /* recruit（v221FIX：可選 onClose 回呼 — 詳情頁招募後刷新升星區） */
  function openRecruit(onClose) {
    const st = S();
    const m = MG.ui.dom.modal("招募英雄", null, { onClose: () => { stopCdTimer(); if (onClose) onClose(); } });
    const tabs = MG.ui.dom.h("div", { style: { display: "flex", gap: "6px", marginBottom: "10px" } },
      tabBtn("gold", "金幣招募"), tabBtn("ticket", "招募券"), tabBtn("gem", "神話招募"));
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(tabs);
    // v153 心願清單：選 2 個職業，招募出現率 ×2（配合升星湊同職業）
    const wishWrap = MG.ui.dom.h("div", { style: { margin: "0 0 10px", padding: "8px 10px", background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 8 } },
      MG.ui.dom.h("div", { style: { fontSize: 10, color: "var(--dim)", marginBottom: 5 } },
        "心願職業（選 2 個）：招募出現率提升至 2 倍，快速湊齊同職業升星肥料"),
      MG.ui.dom.h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } }));
    const wishRow = wishWrap.lastElementChild;
    function syncWishChips() {
      const wish = (st.settings.wishlist || []).slice(0, 2);
      wishRow.innerHTML = "";
      for (const c of Object.keys(MG.data.hunters.classes)) {
        const cls = MG.data.hunters.classes[c];
        const on = wish.includes(c);
        wishRow.appendChild(MG.ui.dom.h("div", {
          class: "chip" + (on ? " on" : ""), style: { padding: "3px 8px", minHeight: 28 },
          on: { click: () => {
            let w = (st.settings.wishlist || []).slice();
            if (on) w = w.filter(x => x !== c);
            else {
              if (w.length >= 2) { MG.ui.dom.toast("心願職業最多 2 個（取消一個再選）", "bad", "icon_recruit"); return; }
              w.push(c);
            }
            st.settings.wishlist = w;
            MG.core.audio.SFX.click();
            syncWishChips();
          } }
        }, MG.ui.dom.icon(cls.icon, 14), MG.ui.dom.h("span", null, cls.name)));
      }
    }
    syncWishChips();
    m.panel.appendChild(wishWrap);
    m.panel.appendChild(body);
    function stopCdTimer() {
      if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
    }
    function tabBtn(type, label) {
      return MG.ui.dom.h("button", { class: "chip", style: { flex: 1, justifyContent: "center" }, on: { click: () => showTab(type) } }, label);
    }
    function showTab(type) {
      stopCdTimer();
      tabs.querySelectorAll(".chip").forEach(c => c.classList.remove("on"));
      tabs.children[[["gold", "ticket", "gem"].indexOf(type)]].classList.add("on");
      body.innerHTML = "";
      const cost = MG.sys.hunters.recruitCost(type);
      const can = type === "gold" ? st.currencies.gold >= cost.gold : type === "ticket" ? (st.currencies.ticket || 0) >= 1 : st.currencies.gems >= cost.gem;
      const desc = type === "gold" ? "招募 1-3★ 英雄，費用隨招募次數上升" : type === "ticket" ? "招募 2-5★ 英雄，可從任務與成就獲得" : "招募 3-6★ 英雄，命運將為王者讓路";
      const costTxt = type === "gold" ? MG.util.fmt(cost.gold) + " 金幣" : type === "ticket" ? (st.currencies.ticket || 0) + "/1 招募券" : "300 鑽石";
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginBottom: "10px" } }, desc));
      // v256 招募機率表：由資料 weight/rar 即時計算（保底註記 — 台灣抽卡透明化標準；機率即資料永不漂移）
      const rc2 = MG.data.hunters.recruit[type];
      const wSum = rc2.weight.reduce((a, b) => a + b, 0);
      const rateRows = rc2.rar.map((star, i) => MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 11 } },
        MG.ui.dom.h("span", null, "★".repeat(star) + MG.config.RARITY[star - 1].name),
        MG.ui.dom.h("span", { style: { fontWeight: 800, color: "var(--gold)" } }, (rc2.weight[i] / wSum * 100).toFixed(1) + "%")));
      const pi2 = MG.sys.hunters.pityInfo(type);
      if (pi2) rateRows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 10, color: "var(--dim)" } },
        MG.ui.dom.h("span", null, "保底"),
        MG.ui.dom.h("span", null, "每 " + pi2.target + " 抽必得 ★" + pi2.star + "（含保底出貨率高於基礎值）")));
      if (type === "gem") rateRows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 10, color: "var(--dim)" } },
        MG.ui.dom.h("span", null, "傳說英雄"),
        MG.ui.dom.h("span", null, "★6 時 25% 機率為傳說")));
      body.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 10px", marginBottom: "10px" } },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 10, marginBottom: 2, color: "var(--dim2)" } }, "稀有度機率"),
        rateRows));
      body.appendChild(MG.ui.dom.h("div", { style: { fontSize: "10px", color: "var(--dim)", textAlign: "center", marginBottom: "10px" } },
        "抽到重複的同職業英雄？在英雄詳情消耗同星級英雄即可「升星」，重複招募永遠有用！"));
      const pi = MG.sys.hunters.pityInfo(type);
      if (pi) {
        body.appendChild(MG.ui.dom.h("div", { style: { fontSize: "10px", color: "var(--gold)", textAlign: "center", marginBottom: "10px" } },
          "保底：已累積 " + pi.cur + " / " + pi.target + " 抽，再 " + (pi.target - pi.cur) + " 抽必得 ★" + pi.star));
      }
      const card = MG.ui.dom.h("div", {
        style: { width: "160px", height: "160px", margin: "0 auto 12px", borderRadius: "12px", border: "2px solid var(--line)",
          background: "var(--panel2)", display: "flex", alignItems: "center", justifyContent: "center", perspective: "400px" }
      });
      body.appendChild(card);
      let btn, label;
      if (type === "gold") {
        label = MG.ui.dom.h("span", null, "");
        btn = MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, on: { click: () => doRecruit(type, card, body, () => { refreshGold(); refreshCostLine(); }) } },
          label);
        body.appendChild(btn);
        const costLine = MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: "6px", fontSize: "11px" } });
        body.appendChild(costLine);
        function refreshCostLine() {
          const c = MG.sys.hunters.recruitCost("gold");
          const mul = 1 - 0.02 * (st.buildings.guild || 0);
          const nextC = Math.floor(D.recruit.gold.cost((st.stats.goldRecruits || 0) + 1) * mul);
          let t = "本次 " + MG.util.fmt(c.gold) + " 金幣 · 下次約 " + MG.util.fmt(nextC) + " 金幣";
          if (st.buildings.guild > 0) t += " · 酒館折扣 -" + (2 * st.buildings.guild) + "%";
          t += " · 名冊 " + st.hunters.length + "/" + MG.sys.buildings.effects().rosterCap + " · 招募後冷卻 " + D.recruit.gold.cd + " 秒";
          costLine.textContent = t;
        }
        function refreshGold() {
          const left = recruitCdUntil - Date.now();
          const c = MG.sys.hunters.recruitCost("gold");
          if (left > 0) {
            btn.disabled = true;
            label.textContent = "冷卻中 " + Math.ceil(left / 1000) + " 秒…";
          } else {
            btn.disabled = st.currencies.gold < c.gold;
            label.textContent = "招募（" + MG.util.fmt(c.gold) + " 金幣）";
          }
        }
        refreshCostLine();
        refreshGold();
        cdTimer = setInterval(() => { if (document.contains(btn)) refreshGold(); else stopCdTimer(); }, 1000);
      } else {
        btn = MG.ui.dom.h("button", {
          class: "btn " + (type === "gem" ? "pink" : "blue"), style: { flex: 1 },
          disabled: !can,
          on: { click: () => doRecruit(type, card, body, null) }
        }, "招募（" + costTxt + "）");
        // v168 QoL：十連抽（批量招募，保底/傳說自動計入）
        const can10 = type === "gem" ? (st.currencies.gems || 0) >= 3000 : (st.currencies.ticket || 0) >= 10;
        const btn10 = MG.ui.dom.h("button", {
          class: "btn " + (type === "gem" ? "pink" : "blue"), style: { flex: 1 },
          disabled: !can10,
          on: { click: () => {
            // v218 防誤：十連抽高價消耗確認（神話 3000 鑽 = 約 3 天鑽石收入 — 誤觸即燒）
            const msg = type === "gem" ? "消耗 3,000 鑽石進行 10 次神話招募（含保底與傳說機制）？" : "消耗 10 張招募券進行 10 次招募？";
            MG.ui.dom.confirm("十連招募", msg, () => doBatch(type), { okText: "十連" });
          } }
        }, type === "gem" ? "十連（3000 鑽）" : "十連（10 券）");
        const btnRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 6 } }, btn, btn10);
        body.appendChild(btnRow);
        body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: "6px", fontSize: "11px" } },
          type === "ticket" ? "招募券可於主線任務、成就與簽到中獲得" : "每次神話招募消耗 300 鑽石，必得 3★ 以上"));
      }
    }
    /* v168 QoL：十連抽 — 連續招募 10 次（靜默），結果視窗一次檢視 */
    function doBatch(type) {
      const cap = MG.sys.buildings.effects().rosterCap;
      if (st.hunters.length >= cap) { MG.ui.dom.toast("名冊已滿（" + cap + " 名）— 先遣散英雄再招募", "bad", "icon_recruit"); return; }
      const results = [];
      for (let i = 0; i < 10; i++) {
        const r = MG.sys.hunters.doRecruit(type, true);
        if (!r) break; // 資源不足中斷
        results.push(r);
        if (st.hunters.length >= cap) { MG.ui.dom.toast("名冊已滿，十連中止（完成 " + results.length + " 抽）", "bad", "icon_recruit"); break; }
      }
      renderList();
      showTab(type); // 刷新保底進度與成本顯示
      if (!results.length) { MG.ui.dom.toast("資源不足", "bad", "icon_coin"); return; }
      // 結果視窗
      const m = MG.ui.dom.modal("招募結果 ×" + results.length, null, { wide: true, icon: "icon_recruit" });
      let six = 0, legends = 0, pities = 0;
      for (const r of results) {
        const h = r.h;
        const rar = MG.config.RARITY[h.rarity - 1] || MG.config.RARITY[0];
        if (h.rarity >= 6) six++;
        if (h.legend) legends++;
        if (r.pity) pities++;
        m.panel.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 6, borderColor: rar.color } },
          MG.ui.dom.icon(h.sprite || MG.data.hunters.classes[h.cls].icon, 22),
          MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12, color: h.legend ? "var(--gold)" : "", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
              h.name,
              MG.ui.dom.h("span", { class: "rar" + h.rarity, style: { marginLeft: 4, fontSize: 10 } }, MG.ui.dom.stars(h.rarity)),
              r.pity ? MG.ui.dom.h("span", { style: { color: "var(--gold)", fontWeight: 900, fontSize: 10, marginLeft: 4 } }, "✦保底") : null,
              h.legend ? MG.ui.dom.h("span", { style: { color: "var(--gold)", fontWeight: 900, fontSize: 10, marginLeft: 4 } }, "✦傳說") : null,
              r.duplicate ? MG.ui.dom.h("span", { style: { color: "#ffb86c", fontWeight: 900, fontSize: 10, marginLeft: 4 } }, "→碎片×5") : null),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, MG.data.hunters.classes[h.cls].name + " · " + rar.name)),
          MG.ui.dom.h("span", { style: { fontSize: 10, color: "var(--dim)", flexShrink: 0 } }, "戰力 " + MG.util.fmt(MG.sys.hunters.power(h)))));
      }
      m.panel.appendChild(MG.ui.dom.h("div", { style: { fontSize: 11, color: "var(--dim)", margin: "6px 0 8px", textAlign: "center" } },
        "★6 ×" + six + " ・ 傳說 ×" + legends + (pities ? " ・ 保底 ×" + pities : "")));
      m.panel.appendChild(MG.ui.dom.h("button", { class: "btn gold m-close-btn", on: { click: () => m.close() } }, "確定"));
    }
    function doRecruit(type, card, body, after) {
      if (type === "gold" && Date.now() < recruitCdUntil) {
        MG.ui.dom.toast("招募冷卻中，請稍候片刻", "bad", "icon_recruit");
        return;
      }
      const r = MG.sys.hunters.doRecruit(type);
      if (!r) { MG.ui.dom.toast("資源不足", "bad", "icon_coin"); return; }
      const h = r.h, pity = r.pity;
      const wished = ((st.settings.wishlist) || []).includes(h.cls); // v153 心願職業
      const isLegend = !!h.legend; // v157 傳說英雄
      const ld = isLegend ? (MG.data.hunters.LEGENDS || {})[h.legend] : null;
      if (type === "gold") recruitCdUntil = Date.now() + D.recruit.gold.cd * 1000;
      const cls = D.classes[h.cls];
      const rar = MG.config.RARITY[h.rarity - 1];
      card.innerHTML = "";
      card.style.borderColor = rar.color;
      // v172 抽卡演出：稀有度光暈＋放射光＋爆發環（★4+／保底／傳說；減少動畫時省略）
      const rm = !!(st.settings && st.settings.reducedMotion);
      card.style.position = "relative";
      card.style.background = "radial-gradient(circle at 50% 42%, " + rar.color + "2e 0%, var(--panel2) 74%)";
      card.style.boxShadow = "0 0 20px " + rar.color + "55, inset 0 0 14px " + rar.color + "22";
      const grand = isLegend || pity || h.rarity >= 6;
      if (!rm && (h.rarity >= 4 || grand)) {
        card.appendChild(MG.ui.dom.h("div", { class: "summon-rays" + (grand ? " summon-rays-gold" : "") }));
        card.appendChild(MG.ui.dom.h("div", { class: "summon-ring" + (grand ? " summon-ring-gold" : "") }));
      }
      const inner = MG.ui.dom.h("div", { style: { textAlign: "center", position: "relative", zIndex: 1, animation: rm ? "" : "summon-pop .45s cubic-bezier(.2,.9,.3,1.25) both" } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: "15px", color: rar.color, marginBottom: "4px" } }, rar.name + "！"),
        pity ? MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: "11px", color: "var(--gold)", marginBottom: "2px", letterSpacing: "1px" } }, "✦ 保底觸發 ✦") : null,
        wished ? MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: "11px", color: "var(--gold)", marginBottom: "2px" } }, "★ 心願職業現身 ★") : null,
        isLegend ? MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: "12px", color: "var(--gold)", marginBottom: "2px", letterSpacing: "1px" } }, r.duplicate ? "✦ 重複傳說 → 徽章碎片 ×5 ✦" : "✦ 傳說英雄降臨 ✦") : null,
        MG.ui.dom.icon(h.sprite || cls.icon, 56),
        MG.ui.dom.h("div", { style: { fontWeight: 800, marginTop: "6px" } }, h.name),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: "11px" } }, cls.name + " · Lv 1 · 戰力 " + MG.util.fmt(MG.sys.hunters.power(h))),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px", fontStyle: "italic", marginTop: "2px" } }, "「" + (ld ? ld.flavor : cls.flavor) + "」"));
      card.appendChild(inner);
      // v210FIX：重複傳說已轉碎片 — 不再播「已招募」toast（避免矛盾回饋）
      if (!r.duplicate) MG.ui.dom.toast("招募到 " + rar.name + "英雄「" + h.name + "」！", "good", "icon_recruit");
      renderList();
      if (after) after();
    }
    showTab("gold");
  }
  function renderList(force) {
    if (!listEl) return;
    const sig = listSignature();
    if (!force && sig === listSig && Date.now() - lastListAt < 1000) return; // 狀態沒變 → 跳過全量重建
    listSig = sig; lastListAt = Date.now();
    listEl.innerHTML = "";
    if (statusEl) {
      statusEl.innerHTML = "";
      const st = S();
      const formed = MG.sys.hunters.formationIds().length;
      const slots = MG.sys.buildings.effects().formationSlots;
      const unused = st.hunters.length - formed;
      const cap = MG.sys.buildings.effects().rosterCap;
      // 名冊總數上限（隨酒館等級成長）
      statusEl.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: "11px", padding: "2px 0 4px" } },
        "名冊 " + st.hunters.length + " / " + cap + " 人（升級酒館提升上限）" + (st.kingdom.level >= 10 ? "　" : "")));
      // v254 共鳴祭壇（王國 Lv10 解鎖 — AFK 共鳴水晶：5 槽選英雄共享等級，板凳斷層修復）
      if (st.kingdom.level >= 10) {
        const rinfo = MG.sys.hunters.resonanceInfo();
        statusEl.appendChild(MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "0 0 6px" } },
          MG.ui.dom.h("div", { class: "sub", style: { flex: 1, fontSize: 11 } },
            rinfo.active ? "共鳴祭壇：基準 Lv" + rinfo.base + "（全名冊第 5 高 — 槽內 " + rinfo.slots.filter(Boolean).length + "/" + MG.sys.hunters.resonanceSlots() + " 受益）" :
              (rinfo.slots.filter(Boolean).length === 5 ? "共鳴祭壇：基準 Lv1（名冊未滿 5 人或頂端等級過低）" : "共鳴祭壇：選 " + MG.sys.hunters.resonanceSlots() + " 名英雄入槽 — 低於基準（全名冊第 5 高）者同步等級")),
          MG.ui.dom.h("button", { class: "btn sm blue", style: { padding: "3px 10px", minHeight: 28 }, on: { click: openResonance } }, "共鳴槽")));
      }
      {
        statusEl.appendChild(MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "2px 0 6px" } },
          MG.ui.dom.h("div", { class: "sub", style: { flex: 1, fontSize: "11px" } }, "已編隊 " + formed + "/" + slots + " · 尚有 " + unused + " 名英雄待命"),
          MG.ui.dom.h("button", { class: "btn sm green", style: { padding: "3px 10px", minHeight: "30px" }, on: { click: () => { MG.sys.hunters.autoFill(); renderList(); } } },
            "自動編隊"),
          MG.ui.dom.h("button", { class: "btn sm blue", style: { padding: "3px 10px", minHeight: "30px" }, on: { click: () => autoEquipTeam() } },
            "自動穿裝"),
          // v218 QoL：全隊訓練到滿（40+ 英雄每日成長 = 逐個開詳情訓練 — 最高頻日常操作；v213FIX 同款影子模擬）
          MG.ui.dom.h("button", { class: "btn sm gold", style: { padding: "3px 10px", minHeight: "30px" }, on: { click: () => {
            const trainAll = () => {
              const st2 = S();
              const list = st2.hunters.slice().sort((a, b) => MG.sys.hunters.power(b) - MG.sys.hunters.power(a));
              const mul = 1 + (st2.buildings.training || 0) * 0.1;
              const sim = () => {
                let gold = st2.currencies.gold, done = 0, cost = 0, levels = 0;
                for (const h of list) {
                  if (h.level >= 200) continue;
                  let lv = h.level, exp = h.exp || 0;
                  while (lv < 200) {
                    const k = D.trainCost(lv);
                    if (gold < k) break;
                    gold -= k; cost += k; done++;
                    exp += Math.floor(D.trainExp(lv) * mul);
                    while (exp >= D.expNeed(lv) && lv < 200) { exp -= D.expNeed(lv); lv++; }
                  }
                  levels += lv - h.level;
                }
                return { done, cost, levels };
              };
              const est = sim();
              const run = () => {
                let done = 0, cost = 0, levels = 0;
                for (const h of list) {
                  if (h.level >= 200) continue;
                  const start = h.level;
                  while (h.level < 200) {
                    const k = D.trainCost(h.level);
                    if (st2.currencies.gold < k) break;
                    if (!MG.sys.hunters.train(h, true)) break; // 防禦性中斷（金幣/滿級已前置攔截）
                    done++; cost += k;
                  }
                  levels += h.level - start;
                }
                MG.ui.dom.toast("全隊訓練 ×" + done + "（Lv 合計 +" + levels + "，花費 " + MG.util.fmt(cost) + " 金）", done > 0 ? "good" : "bad", "icon_train");
                renderList();
              };
              if (!est.done) { MG.ui.dom.toast("沒有可訓練的英雄（金幣不足或全員滿級）", "bad", "icon_train"); return; }
              if (est.done > 10) MG.ui.dom.confirm("全隊訓練", "可訓練 ×" + est.done + "（Lv 合計 +" + est.levels + "，約需 " + MG.util.fmt(est.cost) + " 金幣）。確定？", run, { okText: "訓練" });
              else run();
            };
            trainAll();
          } } }, "全隊訓練"),
          MG.ui.dom.h("button", { class: "btn sm danger", style: { padding: "3px 10px", minHeight: "30px" }, on: { click: () => view === "kingdom" ? enterSelMode() : openBulkDismiss() } },
            view === "kingdom" ? "批量遣散" : "批量驅逐"))); // v248：名冊批量遣散（多選 — 清肥料勞務 15-30 擊 → 2 擊決策）；v248FIX：流浪視圖切回批量驅逐入口（同鈕依視圖切換）
      }
      if (view === "wanderer") { // v248FIX：流浪視圖顯示批量驅逐入口（領地視圖有批量遣散）
        statusEl.appendChild(MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "2px 0 6px" } },
          MG.ui.dom.h("div", { class: "sub", style: { flex: 1, fontSize: 11 } }, "流浪英雄區 — 招募後成為領地英雄")));
      }
      // v248 批量遣散操作列（多選模式 — 僅領地視圖）
      if (selMode && view === "kingdom") {
        const sum = selSum();
        const bar = MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "4px 0 8px", borderTop: "1px dashed rgba(255,255,255,.12)" } },
          MG.ui.dom.h("div", { class: "sub", style: { flex: 1, fontSize: 11 } }, "已選 " + sum.n + " 名・返還約 " + MG.util.fmt(sum.gold) + " 金" + (sum.shards > 0 ? "・碎片 " + sum.shards : "")),
          MG.ui.dom.h("button", { class: "btn sm", style: { padding: "3px 10px", minHeight: "30px" }, on: { click: toggleSelectAll } }, "全選"),
          MG.ui.dom.h("button", { class: "btn sm", style: { padding: "3px 10px", minHeight: "30px" }, on: { click: exitSelMode } }, "取消"),
          MG.ui.dom.h("button", { class: "btn sm danger", style: { padding: "3px 12px", minHeight: "30px" }, on: { click: bulkDismissRun } }, "遣散" + (sum.n ? " ×" + sum.n : "")));
        selSumEl = bar.children[0];
        statusEl.appendChild(bar);
      }
    }
    const list = filtered();
    if (!list.length) {
      // v216FIX：搜尋無匹配時的空態（名冊非空只是搜尋不到 — 不誤導「還沒有英雄」）
      let emptyTxt;
      if (search && search.trim()) emptyTxt = "沒有符合「" + search.trim() + "」的英雄\n試試其他名稱或職業";
      else if (filter === "all") emptyTxt = "還沒有英雄\n點擊下方「招募英雄」開始冒險！";
      else if (filter === "formation") emptyTxt = "出戰隊伍空無一人\n使用「編入」或「自動編隊」整裝出發！";
      else emptyTxt = "沒有「" + D.classes[filter].name + "」英雄\n去招募一位吧！";
      listEl.appendChild(MG.ui.dom.h("div", { class: "empty" }, emptyTxt));
      return;
    }
    for (const h of list) listEl.appendChild(card(h));
    // v248FIX：卡點擊事件委派（單一監聽器綁 listEl — 40 卡免個別綁定；多選/詳情分流）
    if (listEl && !listEl._v248Delegate) {
      listEl._v248Delegate = true;
      listEl.addEventListener("click", (e) => {
        const t = e.target && e.target.closest ? e.target.closest("[data-cid]") : null;
        if (!t) return;
        const hero = S().hunters.find(x => x.id === t.getAttribute("data-cid"));
        if (!hero) return;
        if (selMode) {
          if (selable(hero)) {
            if (sel.has(hero.id)) sel.delete(hero.id); else sel.add(hero.id);
            renderList(true);
          } else MG.ui.dom.toast("「" + hero.name + "」出戰中或已鎖定", "bad", "icon_lock");
        } else openDetail(hero.id);
      });
    }
  }
  function buildWanderRow(w) {
    const rar = MG.config.RARITY[w.rarity - 1];
    const spr = MG.sys.wanderers.spriteOf(w);
    const row = MG.ui.dom.h("div", { class: "row", style: { borderColor: rar.color, cursor: "pointer" }, on: { click: () => openWanderRecruit(w) } },
      MG.ui.dom.h("div", { style: { textAlign: "center" } },
        MG.ui.dom.icon(spr, 30),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, color: rar.color, fontWeight: 700 } }, rar.name)),
      MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } },
          w.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } },
            MG.data.hunters.classes[w.cls].name + "・Lv" + w.level),
          w.stars > 1 ? MG.ui.dom.h("span", { class: "rar" + Math.min(6, w.stars + 2), style: { marginLeft: 4, fontSize: 9 } }, "★".repeat(w.stars)) : null),
        MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 2 } },
          MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9 } }, "…"),
          MG.ui.dom.h("div", { class: "pbar", style: { height: 4, flex: 1 } }, MG.ui.dom.h("i", { style: { width: "100%" } })),
          MG.ui.dom.h("span", null)),
        MG.ui.dom.h("div", { style: { fontSize: 10, color: "var(--gold)", marginTop: 2 } })),
      MG.ui.dom.h("button", { class: "btn sm", on: { click: (e) => { e.stopPropagation(); openWanderRecruit(w); } } }, "招募"),
      // v225 遠征鈕（被動 FSM 主動化）
      MG.ui.dom.h("button", { class: "btn sm blue", on: { click: (e) => { e.stopPropagation(); expedDialog(w); } } }, "遠征"));
    return {
      row,
      stateEl: row.children[1].children[1].children[0],
      moodBar: row.children[1].children[1].children[1].children[0],
      hpWrap: row.children[1].children[1].children[2],
      bubbleWrap: row.children[1].children[2],
      costBtn: row.children[2],
      expedBtn: row.children[3]
    };
  }
  function updateWanderRow(cell, w) {
    const st = S();
    cell.stateEl.textContent = MG.sys.wanderers.stateLabel(w) + "・心情 " + Math.round(w.mood);
    cell.moodBar.style.width = Math.max(0, w.mood) + "%";
    cell.hpWrap.innerHTML = "";
    if (w.hp < w.maxHp) {
      cell.hpWrap.appendChild(MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9 } }, "HP " + Math.round(w.hp / w.maxHp * 100) + "%"));
    }
    cell.bubbleWrap.innerHTML = "";
    if (w.bubble) {
      cell.bubbleWrap.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 13, color: "var(--gold)", marginTop: 2 } }, w.bubble.icon + " " + w.bubble.text));
    }
    const cost = MG.sys.wanderers.recruitCost(w);
    const can = MG.sys.wanderers.canRecruit(w);
    cell.costBtn.className = "btn sm " + (can.ok ? "gold" : "");
    cell.costBtn.disabled = !can.ok;
    cell.costBtn.textContent = "招募 " + MG.util.fmt(cost) + "金";
    // v225：遠征按鈕狀態（遠征中顯示剩餘時間）
    if (w.state === "exped" && w.exped) {
      const leftMs = Math.max(0, w.exped.until - Date.now());
      cell.expedBtn.className = "btn sm gold";
      cell.expedBtn.textContent = "遠征中 " + MG.util.fmtClock(leftMs); // v225FIX：fmtClock 收毫秒（原除 1000 快 1000 倍）
      cell.expedBtn.onclick = (e) => { e.stopPropagation(); MG.ui.dom.confirm("召回遠征", "召回「" + w.name + "」？已出發的旅程不退款。", () => { MG.sys.wanderers.expedCancel(w); renderWanderers(); }, { okText: "召回" }); };
    } else {
      cell.expedBtn.className = "btn sm blue";
      cell.expedBtn.textContent = "遠征";
      cell.expedBtn.disabled = false;
      cell.expedBtn.onclick = (e) => { e.stopPropagation(); expedDialog(w); };
    }
  }
  /* v225 遠征對話框：選已解鎖區域＋時長（1/4/8h — 8h 每小時效率最高） */
  function expedDialog(w) {
    const st = S();
    if (w.dead) { MG.ui.dom.toast("該流浪者已陣亡", "bad", "icon_skull"); return; }
    const m = MG.ui.dom.modal("委託遠征 — " + w.name, null, { icon: MG.sys.wanderers.spriteOf(w) });
    m.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 8, textAlign: "center" } },
      "讓流浪者前往已解鎖區域遠征（心情 ≥40）：期間村內行為暫停，歸來帶回金幣／素材／經驗"));
    const maxR = st.stats.maxRegionReached || 0;
    const regions = MG.data.monsters.regions.slice(0, Math.min(maxR + 1, MG.data.monsters.regions.length));
    // v225FIX：移除 early-return — 起始區域（region 0）即可遠征；訊息僅提示解鎖更多區域
    if (regions.length <= 1) {
      m.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginBottom: 8, textAlign: "center" } },
        "目前僅起始區域可遠征 — 攻略區域首領可解鎖更多選擇"));
    }
    for (let i = 0; i < regions.length; i++) {
      const r = regions[i];
      if (r.abyss) continue; // 深淵不可遠征
      const HOURS = [1, 4, 8];
      m.panel.appendChild(MG.ui.dom.h("div", { style: { padding: 8, marginBottom: 6, background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 8 } },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, r.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 9 } }, "第 " + (i + 1) + " 區域")),
        MG.ui.dom.h("div", { style: { display: "flex", gap: 6, marginTop: 5 } },
          HOURS.map(hs => MG.ui.dom.h("button", {
            class: "btn sm " + (hs === 8 ? "gold" : ""), style: { flex: 1 },
            on: { click: () => {
              const r2 = MG.sys.wanderers.expedLaunch(w, i, hs);
              MG.ui.dom.toast(r2.ok ? "「" + w.name + "」前往「" + r.name + "」遠征 " + hs + " 小時！" : r2.reason, r2.ok ? "good" : "bad", "icon_sword");
              if (r2.ok) { m.close(); renderWanderers(); }
            } }
          }, hs + " 小時")))));
    }
    m.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "取消"));
  }
  /* v233 全部投餵（v233FIX：預覽模擬錢包 — 與 v208 bulkPreview 同構；零投餵時顯示真實原因） */
  function bulkFeedClick() {
    const p2 = MG.sys.wanderers.bulkFeedPreview();
    if (p2.count <= 0) { MG.ui.dom.toast("今日已全部投餵過", "", "icon_pot_hp"); return; }
    const run = () => {
      const r = MG.sys.wanderers.bulkFeed();
      if (r.ok) MG.ui.dom.toast("投餵 ×" + r.fed + "（好感 +15 ×" + r.fed + "・花費 " + MG.util.fmt(r.cost) + " 金）" + (r.skipped.length ? "・跳過 " + r.skipped.length + " 隻" : ""), "good", "icon_pot_hp");
      else MG.ui.dom.toast((r.skipped[0] && r.skipped[0].reason) || "沒有可投餵的流浪者", "bad", "icon_pot_hp");
      renderWanderers();
    };
    if (p2.count > 3) MG.ui.dom.confirm("全部投餵 ×" + p2.count, "將投餵 " + p2.count + " 名流浪者，共花費約 " + MG.util.fmt(p2.cost) + " 金（好感 +15 ×" + p2.count + "）。確定？", run, { okText: "全部投餵" });
    else run();
  }
  function bulkExpedClick() {
    const st = S();
    const W = MG.sys.wanderers;
    const pool = (st.wanderers || []).filter(w => !w.dead && w.state !== "exped" && (w.mood || 0) >= 40);
    if (!pool.length) { MG.ui.dom.toast("沒有可遠征的流浪者（心情 ≥40 且未在遠征中）", "", "icon_sword"); return; }
    const m = MG.ui.dom.modal("批量遠征 — " + pool.length + " 名流浪者", null, { icon: "icon_sword" });
    m.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 8, textAlign: "center" } },
      "一次派遣全部可遠征者（心情低落者自動跳過）。誤觸可召回退款，無損失。"));
    const maxR = st.stats.maxRegionReached || 0;
    const regions = MG.data.monsters.regions.slice(0, Math.min(maxR + 1, MG.data.monsters.regions.length));
    const HOURS = [1, 4, 8];
    for (let i = 0; i < regions.length; i++) {
      const r = regions[i];
      if (r.abyss) continue;
      m.panel.appendChild(MG.ui.dom.h("div", { style: { padding: 8, marginBottom: 6, background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 8 } },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, r.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 9 } }, "第 " + (i + 1) + " 區域")),
        MG.ui.dom.h("div", { style: { display: "flex", gap: 6, marginTop: 5 } },
          HOURS.map(hs => MG.ui.dom.h("button", {
            class: "btn sm " + (hs === 8 ? "gold" : ""), style: { flex: 1 },
            on: { click: () => {
              const res = W.bulkExpedLaunch(i, hs);
              MG.ui.dom.toast(res.ok
                ? "批量遠征 ×" + res.launched + "（" + hs + " 小時）" + (res.skipped.length ? "・跳過 " + res.skipped.length + " 人" : "")
                : "沒有可派遣的流浪者", res.ok ? "good" : "bad", "icon_sword");
              m.close();
              renderWanderers();
            } }
          }, hs + " 小時")))));
    }
    m.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "取消"));
  }
  /* v235 碎片合成：30 片 ★4（週限 2）／60 片 ★5（週限 1）— 自選職業；走 create 同款路徑計圖鑑 */
  function openSynth() {
    const H = MG.sys.hunters;
    const m = MG.ui.dom.modal("英雄碎片合成", null, { icon: "icon_recruit" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    function render() {
      const pv = H.synthPreview();
      body.innerHTML = "";
      body.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 8 } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 14, color: "var(--gold)" } }, "碎片 " + pv.shards),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "遣散 ★3+ 英雄獲得（★3→1・★4→3・★5→8・★6→20）・週一重置")));
      for (const [rarity, label] of [[4, "★4"], [5, "★5"]]) {
        const def = H.SYNTH_DEFS[rarity];
        const key = "n" + rarity;
        const used = pv[key];
        const can = pv["can" + rarity];
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 8, marginBottom: 8, opacity: used >= def.weekly ? 0.55 : 1 } },
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, label + " 自選職業英雄", MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 9 } }, used + "/" + def.weekly + "（週）")),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "消耗碎片 " + def.shards + " 片")),
          used >= def.weekly
            ? MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10 } }, "本週已用盡")
            : MG.ui.dom.h("div", { style: { display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "56%" } },
              Object.keys(D.classes).map(cls => MG.ui.dom.h("button", {
                class: "chip", style: { minHeight: 24, padding: "2px 6px", fontSize: 9, color: can ? "" : "var(--dim2)", borderColor: can ? "" : "var(--line)" },
                disabled: !can,
                on: { click: () => {
                  const r = H.synthHero(rarity, cls);
                  if (!r.ok) MG.ui.dom.toast(r.reason, "bad", "icon_recruit");
                  render();
                } }
              }, D.classes[cls].name)))));
      }
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", fontSize: 10, marginTop: 4 } },
        "合成英雄計入圖鑑收集；不可合成傳說英雄"));
    }
    render();
  }
  /* 流浪英雄戰力（與副本勝率同公式） */
  function wandererPower(w) {
    const cls = D.classes[w.cls];
    const g = 1 + (w.level - 1) * 0.08;
    const atk = cls.base.atk * g, hp = (cls.base.hp + cls.grow.hp * (w.level - 1)) * g, def = cls.base.def * g;
    return atk * 3 + hp * 0.2 + def * 2;
  }
  function filteredWanderers() {
    const st = S();
    let list = (st.wanderers || []).filter(w => !w.dead);
    if (filter === "formation") list = list.filter(w => w.state === "hunt"); // 出戰中=出戰中
    else if (filter !== "all") list = list.filter(w => w.cls === filter);
    return [...list].sort((a, b) => sort === "level" ? b.level - a.level
      : sort === "rarity" ? (b.rarity - a.rarity) || (b.level - a.level)
      : wandererPower(b) - wandererPower(a));
  }
  function renderWanderers() {
    if (!wanderEl) return;
    const st = S();
    const list = filteredWanderers();
    if (!list.length) {
      wanderEl.innerHTML = "";
      wanderRows = {};
      wanderEl.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, textAlign: "center", padding: "4px 0" } },
        filter === "all" ? "流浪英雄會在村中徘徊……（升級酒館可提升來訪者品質）" : "沒有符合條件的流浪英雄"));
      return;
    }
    // 移除已離開的流浪者
    for (const uid in wanderRows) {
      if (!list.some(w => w.uid === uid)) {
        wanderRows[uid].row.remove();
        delete wanderRows[uid];
      }
    }
    // v233 日常批量列：全部投餵＋批量遠征（每日最高頻點擊 15-45 次 → 2 次決策；逐隻守衛保留）
    // v233FIX：模組級建一次＋appendChild 移動（原每次 render 新建 → 2Hz tick 重複 append → DOM 無限堆疊）
    if (!bulkRowEl) {
      bulkFeedBtn = MG.ui.dom.h("button", { class: "btn sm gold", style: { flex: 1, minHeight: 30 } });
      bulkFeedBtn.addEventListener("click", bulkFeedClick);
      bulkExpedBtn = MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1, minHeight: 30 } });
      bulkExpedBtn.addEventListener("click", bulkExpedClick);
      bulkRowEl = MG.ui.dom.h("div", { style: { display: "flex", gap: 6, padding: "2px 10px 8px" } }, bulkFeedBtn, bulkExpedBtn);
    }
    const pv = MG.sys.wanderers.bulkFeedPreview();
    bulkFeedBtn.textContent = "全部投餵" + (pv.count > 0 ? " ×" + pv.count : "");
    bulkFeedBtn.disabled = pv.count <= 0;
    wanderEl.appendChild(bulkRowEl); // appendChild 既有節點 = 移動到末端（wanderRows 同模式）
    // 建立新列 / 更新既有列（保留節點；依排序 appendChild 移動順序 → hover 不抖動、排序即時生效）
    for (const w of list) {
      let cell = wanderRows[w.uid];
      if (!cell) {
        cell = buildWanderRow(w);
        wanderRows[w.uid] = cell;
      }
      wanderEl.appendChild(cell.row); // 已存在則移動到正確位置
      updateWanderRow(cell, w);
    }
  }
  function openWanderRecruit(w) {
    const rar = MG.config.RARITY[w.rarity - 1];
    const cost = MG.sys.wanderers.recruitCost(w);
    const m = MG.ui.dom.modal("流浪英雄詳情", null, { icon: MG.sys.wanderers.spriteOf(w) });
    m.panel.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 12 } },
      MG.ui.dom.icon(MG.sys.wanderers.spriteOf(w), 48),
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 17, marginTop: 4 } }, w.name,
        MG.ui.dom.h("span", { class: "rar" + w.rarity, style: { marginLeft: 4, fontSize: 12 } }, MG.ui.dom.stars(w.rarity))),
      MG.ui.dom.h("div", { class: "sub" }, rar.name + "・" + MG.data.hunters.classes[w.cls].name + "・Lv " + w.level),
      MG.ui.dom.h("div", { style: { fontSize: 12, color: "var(--dim)", marginTop: 6 } },
        "「" + (w.bubble ? w.bubble.text : "帶上我吧，我會證明自己的價值！") + "」")));
    // 各項素質
    const stat = (label, val, color) => MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 } },
      MG.ui.dom.h("span", { style: { color: "var(--dim)" } }, label),
      MG.ui.dom.h("span", { style: { fontWeight: 800, color: color || "var(--text)" } }, val));
    const panel = MG.ui.dom.h("div", { class: "panel2", style: { padding: "6px 10px", marginBottom: 10 } });
    panel.appendChild(stat("戰力", MG.util.fmt(Math.round(wandererPower(w))), "var(--gold)"));
    panel.appendChild(stat("生命", w.maxHp + " / " + w.maxHp, "var(--good)"));
    panel.appendChild(stat("心情", Math.round(w.mood) + " / 100", Math.round(w.mood) > 60 ? "var(--good)" : "var(--bad)"));
    panel.appendChild(stat("狩獵歸來金幣", "+" + MG.util.fmt(w.wallet || 0) + " 金", "var(--gold)"));
    panel.appendChild(stat("素材機率", Math.round((w.type ? w.type.matChance : 0) * 100) + "%", "#c792ea"));
    panel.appendChild(stat("狀態", MG.sys.wanderers.stateLabel(w.state || "idle")));
    m.panel.appendChild(panel);
    // v225 好感/投餵：4 階（招募費 -6%/階・等級 +1/階・素材率 +2%/階）
    {
      const flv = MG.sys.wanderers.favorLv(w);
      const favWrap = MG.ui.dom.h("div", { class: "panel2", style: { padding: "6px 10px", marginBottom: 10 } });
      favWrap.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        MG.ui.dom.h("span", { style: { fontWeight: 800, fontSize: 12 } }, "好感 " + (w.favor || 0) + "/100（" + flv + "/4 階）"),
        MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9 } }, "招募費 -" + flv * 6 + "%・等級 +" + flv + "・素材 +" + flv * 2 + "%")));
      favWrap.appendChild(MG.ui.dom.h("div", { class: "pbar", style: { height: 6, marginTop: 4 } }, MG.ui.dom.h("i", { style: { width: (w.favor || 0) + "%" } })));
      favWrap.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, marginTop: 3 } }, "來源：每日投餵 +15・遠征成功 +8・村內消費/狩獵自然累積（每日上限 +30）"));
      favWrap.appendChild(MG.ui.dom.h("button", {
        class: "btn sm " + (w.feedDay !== MG.util.today() ? "gold" : ""), style: { width: "100%", marginTop: 5 },
        disabled: w.feedDay === MG.util.today() || w.state === "exped" || w.dead,
        on: { click: () => { const r = MG.sys.wanderers.feed(w); MG.ui.dom.toast(r.ok ? "投餵完成（好感 +15）" : r.reason, r.ok ? "good" : "bad", "icon_pot_hp"); if (r.ok) { m.close(); renderWanderers(); } } }
      }, w.feedDay === MG.util.today() ? "今日已投餵" : "投餵（" + MG.util.fmt(Math.max(10, Math.round(cost * 0.1))) + " 金・每日 1 次）"));
      m.panel.appendChild(favWrap);
    }
    m.panel.appendChild(MG.ui.dom.h("button", {
      class: "btn gold", style: { width: "100%" },
      disabled: !MG.sys.wanderers.canRecruit(w).ok,
      on: { click: () => { const h = MG.sys.wanderers.recruit(w.uid); if (h) { m.close(); view = "kingdom"; applyView(); renderWanderers(); renderList(); MG.ui.screens.tick(); } } }
    }, "招募（" + MG.util.fmt(cost) + " 金幣）"));
    // 驅逐：請他永遠離開村莊
    m.panel.appendChild(MG.ui.dom.h("button", {
      class: "btn sm danger", style: { width: "100%", marginTop: 6 },
      on: { click: () => {
        MG.ui.dom.confirm("驅逐流浪英雄", "確定要請「" + w.name + "」離開村莊嗎？他將永遠不再回來。", () => {
          if (MG.sys.wanderers.dismiss(w.uid)) {
            MG.ui.dom.toast("已請「" + w.name + "」離開村莊", "", "icon_sword");
            m.close();
            renderWanderers();
          }
        }, { danger: true });
      } }
    }, "驅逐"));
    m.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "關閉"));
  }
  /* 編隊管理（v130）：五隊依進度開放，點格編入英雄 */
  function openTeamEditor() {
    const st = S();
    const H = MG.sys.hunters;
    const m = MG.ui.dom.modal("編隊管理", null, { icon: "icon_formation" });
    const body = m.panel;
    let teamIdx = st.activeTeam || 0;
    function render() {
      body.innerHTML = "";
      const max = H.teamsUnlocked();
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } },
        "酒館等級決定開放隊數（Lv1=1 隊、Lv2=2、Lv4=3、Lv6=4、Lv8=5）。"));
      // 隊選擇 chips
      const teamRow = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 } });
      for (let n = 0; n < 5; n++) {
        const unlocked = n < max;
        const info = H.teamInfo(n);
        teamRow.appendChild(MG.ui.dom.h("div", {
          class: "chip" + (teamIdx === n ? " on" : ""),
          style: unlocked ? {} : { opacity: 0.55 },
          on: { click: () => { if (!unlocked) return; teamIdx = n; H.setActiveTeam(n); render(); } }
        }, unlocked ? "第 " + (n + 1) + " 隊 " + info.members + "/" + info.slots : "🔒 第 " + (n + 1) + " 隊（酒館 Lv" + (n * 2) + "）"));
      }
      body.appendChild(teamRow);
      // v255 編隊批量：整隊搬移（英雄跨隊互斥 — 複製=目標隊採納來源隊陣容、來源隊清空）＋編滿全部隊（戰力貪婪填空格）
      body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 6, marginBottom: 8, alignItems: "center" } },
        MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10 } }, "搬移到："),
        (() => {
          const opts = [];
          for (let n = 0; n < max; n++) if (n !== teamIdx) opts.push(MG.ui.dom.h("option", { value: n }, "第 " + (n + 1) + " 隊"));
          return MG.ui.dom.h("select", {
            style: { flex: 1, minHeight: 28, background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 6, color: "var(--text)", fontSize: 11 },
            on: { change: (e) => {
              const tgt = Number(e.target.value);
              if (isNaN(tgt)) return;
              const srcIds = H.teamInfo(teamIdx).ids.slice();
              const tInfo = H.teamInfo(tgt);
              const doMove = () => {
                const fighting = MG.sys.battle.get().phase === "fight";
                for (let i = 0; i < 5; i++) if (srcIds[i]) H.setFormationSlot(i, null); // 清來源（當前隊）
                H.setActiveTeam(tgt);
                for (let i = 0; i < 5; i++) H.setFormationSlot(i, null); // v255FIX：先清目標隊（原只填來源格 — 實為合併而非覆寫）
                for (let i = 0; i < 5; i++) if (srcIds[i]) H.setFormationSlot(i, srcIds[i]); // 填入目標隊（互斥守衛天然生效）
                H.setActiveTeam(fighting ? tgt : teamIdx); // v255FIX：戰鬥中搬移 → 出戰隊切到目標隊（防清空派遣/怪物進度重置）
                render();
              };
              if (tInfo.ids.some(Boolean)) MG.ui.dom.confirm("覆寫第 " + (tgt + 1) + " 隊", "目標隊已有成員，搬移將覆寫。確定？", doMove);
              else doMove();
            } }
          }, opts);
        })(),
        MG.ui.dom.h("button", {
          class: "btn sm", style: { flexShrink: 0, minHeight: 28, padding: "2px 10px" },
          on: { click: () => {
            const st2 = S();
            const fSlots = MG.sys.buildings.effects().formationSlots;
            const fighting = MG.sys.battle.get().phase === "fight";
            // v255FIX：預收集全部隊既有成員（防互斥移除位移既有編入/吸走後訪問隊成員）
            const used = new Set();
            for (let n = 0; n < max; n++) for (const id of H.teamInfo(n).ids) if (id) used.add(id);
            const sorted = st2.hunters.slice().sort((a, b) => MG.sys.hunters.power(b) - MG.sys.hunters.power(a));
            let filled = 0;
            for (let n = 0; n < max; n++) {
              H.setActiveTeam(n);
              const info = H.teamInfo(n);
              const lim = Math.min(info.slots, fSlots); // v255FIX：teamInfo.slots 恆 5 — 以 formationSlots 為真實上限
              for (let i = 0; i < lim; i++) {
                if (info.ids[i]) continue; // 保留既有編入
                const pick = sorted.find(h => !used.has(h.id) && !h.locked);
                if (pick && H.setFormationSlot(i, pick.id) === true) { used.add(pick.id); filled++; } // v255FIX：僅成功才計
              }
            }
            H.setActiveTeam(fighting ? st.activeTeam : teamIdx); // v255FIX：戰鬥中保留當前出戰隊（不還原清空的來源隊）
            MG.ui.dom.toast(filled > 0 ? "自動編滿 ×" + filled + " 名（依戰力，跳過鎖定）" : "所有隊伍已滿或無可用英雄", filled > 0 ? "good" : "bad", "icon_formation");
            render();
          } }
        }, "編滿全部隊")));
      // v176 UI/UX：編隊視覺化 — 前排 2 格＋後排 3 格雙排（站位即機制）
      const info = H.teamInfo(teamIdx);
      const slotBtn = (i) => {
        const h = info.ids[i] ? st.hunters.find(x => x.id === info.ids[i]) : null;
        return MG.ui.dom.h("div", {
          style: { border: "2px solid " + (h ? (MG.config.RARITY[h.rarity - 1] || MG.config.RARITY[0]).color : "var(--line)"), borderRadius: 10, background: "var(--panel2)", padding: "6px 2px", textAlign: "center", cursor: "pointer", minHeight: 74, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 },
          on: { click: () => pickHero(i, h) }
        },
          h ? MG.ui.dom.icon(h.sprite || MG.data.hunters.classes[h.cls].icon, 26)
            : MG.ui.dom.h("div", { style: { fontSize: 20, color: "var(--dim2)", lineHeight: 1 } }, "＋"),
          h ? MG.ui.dom.h("div", { style: { fontSize: 9, fontWeight: 800, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, h.name)
            : MG.ui.dom.h("div", { style: { fontSize: 9, color: "var(--dim2)" } }, "空位"),
          h ? MG.ui.dom.h("div", { style: { fontSize: 8, color: "var(--gold)" } }, "戰力 " + MG.util.fmt(H.power(h))) : null);
      };
      const rowLabel = (txt, color) => MG.ui.dom.h("div", { style: { fontSize: 9, fontWeight: 900, color: color || "var(--dim)", margin: "2px 2px 3px" } }, txt);
      body.appendChild(rowLabel("前排（第 1-2 位）承受主要攻擊 — 放騎士／坦克", "#ff9f43"));
      body.appendChild(MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 8 } }, slotBtn(0), slotBtn(1)));
      body.appendChild(rowLabel("後排（第 3-5 位）受傷 -25% — 放輸出／治療", "#7ee787"));
      body.appendChild(MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 8 } }, slotBtn(2), slotBtn(3), slotBtn(4)));
      body.appendChild(grid);
      // v221 團隊儀表板：總戰力／元素克制／套裝共鳴（調陣三軸一覽 — resonanceStats 已 memoized）
      {
        const ids = info.ids.filter(Boolean);
        const totalPow = ids.reduce((a, id) => { const h = st.hunters.find(x => x.id === id); return a + (h ? H.power(h) : 0); }, 0);
        const regionEl = (MG.data.monsters.regions[st.hunt.region] || {}).element;
        let counterN = 0;
        for (const id of ids) {
          const h = st.hunters.find(x => x.id === id);
          if (!h) continue;
          const hEl = MG.config.CLASS_ELEMENT[h.cls];
          if (regionEl && MG.config.ELEMENT_COUNTER[hEl] === regionEl) counterN++;
        }
        const rs = H.resonanceStats ? H.resonanceStats() : null;
        const rsTxt = rs && Object.keys(rs).length
          ? Object.keys(rs).map(sid => {
              const set = MG.data.equipment.sets[sid];
              const r = rs[sid];
              const tiers = Object.keys(set.bonusRes || {}).map(Number).sort((a, b) => a - b);
              const maxTier = tiers[tiers.length - 1] || 12;
              const next = tiers.find(n => r.pieces < n);
              // v221FIX：件數以最高檔封頂顯示（5 人各 4 件 = 20 → 顯示 12/12 ✓ 不顯示異常 20/12）
              return set.name + " " + Math.min(r.pieces, maxTier) + "/" + maxTier + (next ? "（差 " + (next - r.pieces) + " 件）" : "✓");
            }).join("・")
          : "無套裝共鳴（全隊湊同套裝 4 件啟動團隊加成）";
        body.appendChild(MG.ui.dom.h("div", { style: { background: "rgba(255,209,102,.06)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 8px", marginBottom: 8, fontSize: 10 } },
          MG.ui.dom.h("div", { style: { fontWeight: 800 } }, "團隊儀表板",
            MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 6, fontWeight: 400 } }, "總戰力 " + MG.util.fmt(totalPow) + (regionEl ? " ・ 克制「" + ((MG.config.ELEMENTS[regionEl] || {}).name || regionEl) + "」" + counterN + " 人（+25%）" : ""))),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, marginTop: 2 } }, "套裝共鳴：" + rsTxt)));
      }
      // v165 前排/後排站位說明（行標籤已視覺化，此處僅保留機制提示）
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginBottom: 8, color: "var(--dim2)" } },
        "前排全滅後，後排才會受到單體攻擊；騎士與嘲諷技能可強化前排坦度"));
      // v170 傳說羈絆：當前編隊生效中的羈絆
      const actBonds = MG.sys.hunters.bondsState().filter(b => b.active);
      if (actBonds.length) {
        body.appendChild(MG.ui.dom.h("div", { style: { fontSize: 10, color: "var(--gold)", fontWeight: 800, marginBottom: 8 } },
          "✦ 羈絆生效：" + actBonds.map(b => b.name).join("、")));
      }
      body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 8 } },
        MG.ui.dom.h("button", { class: "btn sm green", style: { flex: 1 }, on: { click: () => { H.autoFill(); render(); } } }, "自動編隊"),
        MG.ui.dom.h("button", { class: "btn sm m-close-btn", style: { flex: 1 }, on: { click: () => m.close() } }, "關閉")));
    }
    function pickHero(idx, cur) {
      const st2 = S();
      const H2 = MG.sys.hunters;
      const m2 = MG.ui.dom.modal(cur ? "更換英雄" : "選擇英雄", null, { icon: "icon_recruit" });
      if (cur) {
        m2.panel.appendChild(MG.ui.dom.h("button", { class: "btn danger", style: { width: "100%", marginBottom: 8 }, on: { click: () => { H2.setFormationSlot(idx, null); m2.close(); render(); } } }, "移除「" + cur.name + "」"));
      }
      const used = new Set();
      for (const t of (st2.formations || [])) for (const id of t) if (id) used.add(id);
      const avail = st2.hunters.filter(h => !used.has(h.id) || (cur && h.id === cur.id));
      if (!avail.length) m2.panel.appendChild(MG.ui.dom.h("div", { class: "empty" }, "沒有可編入的英雄（每人只能待在一個隊伍）"));
      for (const h of avail) {
        const cls = MG.data.hunters.classes[h.cls] || {};
        // v206：元素色點＋「克」徽章（對當前區域元素 — 克制 +25% 決策支援）
        const hEl = MG.config.CLASS_ELEMENT[h.cls];
        const regionEl = (MG.data.monsters.regions[st2.hunt.region] || {}).element;
        const counters = !!regionEl && MG.config.ELEMENT_COUNTER[hEl] === regionEl;
        m2.panel.appendChild(MG.ui.dom.h("div", { class: "row", on: { click: () => { H2.setFormationSlot(idx, h.id); m2.close(); render(); } } },
          MG.ui.dom.icon(h.sprite || cls.icon, 22),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 4 } },
              MG.ui.dom.h("span", { style: { width: 8, height: 8, borderRadius: "50%", background: (MG.config.ELEMENTS[hEl] || {}).color || "#888", flexShrink: 0 } }),
              MG.ui.dom.h("span", null, h.name),
              MG.ui.dom.h("span", { class: "rar" + h.rarity, style: { marginLeft: 2, fontSize: 10 } }, MG.ui.dom.stars(h.rarity)),
              counters ? MG.ui.dom.h("span", { style: { fontSize: 9, fontWeight: 900, color: "#0a2a10", background: "#57c96b", borderRadius: 4, padding: "0 4px", lineHeight: "13px" } }, "克＋25%") : null),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, (cls.name || h.cls) + " Lv" + h.level + " ・ 戰力 " + MG.util.fmt(H2.power(h))))));
      }
      m2.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m2.close() } }, "取消"));
    }
    render();
  }
  /* v173 QoL：全隊自動穿裝 — 依序為出戰編隊每位英雄穿上背包最佳裝備（鎖定不穿、比現穿好才換） */
  function autoEquipTeam() {
    const st = S();
    const team = MG.sys.hunters.teamOf().filter(id => id && st.hunters.some(h => h.id === id));
    let n = 0;
    for (const id of team) {
      const h = st.hunters.find(x => x.id === id);
      if (h) n += MG.sys.equipment.autoEquip(h);
    }
    MG.ui.dom.toast(n > 0 ? "全隊自動穿裝完成：更換 " + n + " 件裝備" : "全隊已是最佳裝備", n > 0 ? "good" : "", "icon_armor");
    renderList();
  }
  /* 批量驅逐（v120）：多選稀有度，一次請離所有符合的流浪英雄 */
  function openBulkDismiss() {
    const st = S();
    const list = (st.wanderers || []).filter(w => !w.dead);
    if (!list.length) { MG.ui.dom.toast("村裡沒有流浪英雄可以驅逐", "bad", "icon_sword"); return; }
    const sel = new Set();
    const m = MG.ui.dom.modal("批量驅逐流浪英雄", null, { icon: "icon_sword" });
    m.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } },
      "選擇要驅逐的稀有度（可多選）：被選中的流浪英雄將永遠離開村莊。"));
    const chipRow = MG.ui.dom.h("div", { class: "list-scroll", style: { marginBottom: 8 } });
    const chips = MG.config.RARITY.map((r, i) => {
      const n = list.filter(w => w.rarity === i + 1).length;
      return MG.ui.dom.h("div", { class: "chip" + (sel.has(i + 1) ? " on" : ""), style: n ? {} : { opacity: 0.4 }, on: { click: () => { sel.has(i + 1) ? sel.delete(i + 1) : sel.add(i + 1); sync(); } } },
        MG.ui.dom.stars(i + 1), " " + r.name + (n ? " x" + n : ""));
    });
    chips.forEach(c => chipRow.appendChild(c));
    m.panel.appendChild(chipRow);
    const countEl = MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 8 } }, "符合：0 名");
    m.panel.appendChild(countEl);
    const go = MG.ui.dom.h("button", { class: "btn danger", style: { width: "100%" }, disabled: true,
      on: { click: () => {
        const n = go.dataset.n || "0";
        MG.ui.dom.confirm("驅逐流浪英雄", "確定要請離 " + n + " 名流浪英雄嗎？他們將永遠不再回來。", () => {
          const rarities = {};
          sel.forEach(r => rarities[r] = true);
          const done = MG.sys.wanderers.dismissBulk(rarities);
          MG.ui.dom.toast(done > 0 ? "已請離 " + done + " 名流浪英雄" : "沒有符合的流浪英雄", done > 0 ? "" : "bad", "icon_sword");
          m.close();
          renderWanderers();
        }, { danger: true });
      } } }, "確認驅逐");
    m.panel.appendChild(go);
    function sync() {
      chips.forEach((c, i) => c.className = "chip" + (sel.has(i + 1) ? " on" : ""));
      let n = 0;
      for (const w of list) if (sel.has(w.rarity)) n++;
      countEl.textContent = "符合：" + n + " 名" + (n ? "（驅逐後無法挽回）" : "");
      go.disabled = n === 0;
      go.dataset.n = String(n);
    }
  }
  /* 建築分頁：王國頁的建築選項獨立成頁 */
  const screen = {
    render(root) {
      root.innerHTML = "";
      // v248FIX：頁面重建退出多選（v241 裝備 family 同模式 — 否則切分頁回來點擊被劫持）
      selMode = false; sel.clear();
      // 領地英雄 / 流浪英雄 切換
      const viewRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 8, padding: "8px 10px 0" } });
      const mkViewChip = (id, label) => MG.ui.dom.h("button", {
        class: "btn sm" + (view === id ? " gold" : " ghost"), style: { flex: 1 },
        on: { click: () => { view = id; applyView(); savePrefs(); renderList(true); if (selMode) { selMode = false; sel.clear(); } } } // v248FIX：切流浪視圖退出多選＋重繪狀態列
      }, label);
      const chipKingdom = mkViewChip("kingdom", "領地英雄");
      const chipWanderer = mkViewChip("wanderer", "流浪英雄");
      viewBtnEls = [chipKingdom, chipWanderer];
      viewRow.appendChild(chipKingdom);
      viewRow.appendChild(chipWanderer);
      viewRow.appendChild(MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1 }, on: { click: openTeamEditor } }, "編隊管理"));
      root.appendChild(viewRow);
      // sticky filter + sort bar
      const sticky = MG.ui.dom.h("div", { style: { position: "sticky", top: 0, zIndex: 6, background: "var(--bg)", padding: "8px 10px 2px", borderBottom: "2px solid var(--line)" } });
      const filterRow = MG.ui.dom.h("div", { class: "list-scroll", style: { padding: "0 0 6px" } });
      const chipDefs = [["all", "全部"], ["formation", "出戰中"], ["grow", "可成長"]].concat(Object.keys(D.classes).map(c => [c, D.classes[c].name])); // v263
      const filterChips = chipDefs.map(([id, label]) => MG.ui.dom.h("div", { class: "chip" + (filter === id ? " on" : ""), on: { click: () => { filter = id; syncFilterChips(); if (selMode) { sel.clear(); renderList(true); return; } renderList(); renderWanderers(); savePrefs(); } } }, label)); // v248FIX：視圖變更清空選取
      filterChips.forEach(c => filterRow.appendChild(c));
      const sortRow = MG.ui.dom.h("div", { class: "list-scroll", style: { padding: "0 0 4px" } });
      const sortDefs = [["power", "戰力排序"], ["level", "等級排序"], ["rarity", "稀有度排序"]];
      const sortChips = sortDefs.map(([id, label]) => MG.ui.dom.h("div", { class: "chip" + (sort === id ? " on" : ""), on: { click: () => { sort = id; syncSortChips(); if (selMode) { sel.clear(); renderList(true); return; } renderList(); renderWanderers(); savePrefs(); } } }, label)); // v248FIX：視圖變更清空選取（全選/計數/遣散集合一致）
      sortChips.forEach(c => sortRow.appendChild(c));
      // v216 名稱搜尋（更名券時代 40+ 英雄逐卡掃的解法；input 建於 screen.render — 2Hz refresh 不重建 sticky → focus 安全）
      const searchRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 6, alignItems: "center", padding: "0 0 6px" } },
        MG.ui.dom.icon("icon_search", 14),
        MG.ui.dom.h("input", {
          type: "text", placeholder: "搜尋英雄名稱或職業…", value: search,
          style: { flex: 1, minHeight: 28, background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 6, color: "var(--text)", padding: "0 8px", fontSize: 12, outline: "none" },
          on: { input: (e) => { // v216FIX：250ms debounce（IME 組字連發不卡主執行緒；搜尋不影響流浪清單 — 不呼叫 renderWanderers）
            search = e.target.value;
            if (selMode) { sel.clear(); } // v248FIX：搜尋變更清空選取
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => { savePrefs(); renderList(); }, 250);
          } }
        }));
      // 選中態即時同步（金底+粗體+光暈）
      const syncFilterChips = () => filterChips.forEach((c, i) => c.className = "chip" + (filter === chipDefs[i][0] ? " on" : ""));
      const syncSortChips = () => sortChips.forEach((c, i) => c.className = "chip" + (sort === sortDefs[i][0] ? " on" : ""));
      sticky.appendChild(filterRow);
      sticky.appendChild(searchRow);
      sticky.appendChild(sortRow);
      statusEl = MG.ui.dom.h("div", null);
      sticky.appendChild(statusEl);
      root.appendChild(sticky);
      // 領地英雄區
      listWrapEl = MG.ui.dom.h("div", null);
      listEl = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, padding: "4px 10px 0" } });
      listWrapEl.appendChild(listEl);
      root.appendChild(listWrapEl);
      // 流浪英雄區（招募後成為領地英雄）
      wanderWrapEl = MG.ui.dom.h("div", { style: { display: "none" } },
        MG.ui.dom.h("div", { class: "section-h", style: { margin: "6px 10px 2px" } },
          MG.ui.dom.h("span", { class: "t" }, "流浪英雄 · 招募後成為領地英雄")));
      wanderEl = MG.ui.dom.h("div", { style: { padding: "0 10px 90px" } });
      wanderWrapEl.appendChild(wanderEl);
      root.appendChild(wanderWrapEl);
      wanderRows = {};
      renderWanderers();
      // recruit FAB
      fabWrapEl = MG.ui.dom.h("div", { style: { position: "fixed", bottom: "calc(var(--nav-h) + env(safe-area-inset-bottom) + 12px)", left: 0, right: 0, maxWidth: "480px", margin: "0 auto", padding: "0 14px", zIndex: 40 } },
        MG.ui.dom.h("div", { style: { display: "flex", gap: 6 } },
          MG.ui.dom.h("button", { class: "btn gold", style: { flex: 1 }, on: { click: openRecruit } },
            "招募英雄"), // v241：recruitFabBtn 參考 — refreshRecruitFab 更新 CD/就緒脈動
          // v235 英雄碎片合成（遣散死資產 → 週限定向合成 — 持有數即時）
          MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1, minHeight: 38 }, on: { click: openSynth } },
            "碎片合成")));
      recruitFabBtn = fabWrapEl.querySelector ? fabWrapEl.querySelector("button") : null;
      root.appendChild(fabWrapEl);
      applyView();
      renderList(true);
    },
    refresh: () => { renderList(); renderWanderers(); refreshRecruitFab(); } // v241：FAB CD 倒數
  };
  /* v241 招募 FAB CD：冷卻中「招募（CD Ns）」＋disabled；結束恢復＋就緒脈動（rm 跳過）—
     doRecruit 守衛仍是唯一真相源，FAB 唯讀鏡像 */
  function refreshRecruitFab() {
    if (!recruitFabBtn) return;
    const left = recruitCdUntil - Date.now();
    const txt = left > 0 ? "招募（CD " + Math.ceil(left / 1000) + "s）" : "招募英雄";
    if (recruitFabBtn.textContent === txt && recruitFabBtn.disabled === (left > 0)) return; // 簽名防多餘寫入
    recruitFabBtn.textContent = txt;
    recruitFabBtn.disabled = left > 0;
    recruitFabBtn.style.opacity = left > 0 ? "0.55" : "1";
    if (left <= 0 && !S().settings.reducedMotion && recruitFabBtn.animate) {
      try { recruitFabBtn.animate([{ boxShadow: "0 0 0 rgba(255,209,102,0)" }, { boxShadow: "0 0 14px rgba(255,209,102,.9)" }, { boxShadow: "0 0 0 rgba(255,209,102,0)" }], { duration: 800, easing: "ease-out" }); } catch (e) { /* 動畫非關鍵 */ }
    }
  }
  function applyView() {
    // 切換顯示：領地英雄（名冊+FAB）或 流浪英雄（流浪卡片）
    const showKingdom = view === "kingdom";
    if (listWrapEl) listWrapEl.style.display = showKingdom ? "" : "none";
    if (wanderWrapEl) wanderWrapEl.style.display = showKingdom ? "none" : "";
    if (fabWrapEl) fabWrapEl.style.display = showKingdom ? "" : "none";
    // 切換按鈕選中態同步（金=選中 / ghost=未選中）
    if (viewBtnEls) viewBtnEls.forEach((b, i) => {
      const active = view === (i === 0 ? "kingdom" : "wanderer");
      b.className = "btn sm" + (active ? " gold" : " ghost");
    });
  }
  /* v226：投餵深鏈 — 切到流浪英雄視圖 */
  function showWanderers() {
    if (view !== "wanderer") { view = "wanderer"; savePrefs(); }
    applyView();
    renderWanderers();
  }
  MG.ui.screens.register("hunters", screen);
  return { ...screen, showWanderers, openRecruit, openSynth, openResonance }; // v226：投餵/任務深鏈；v235：碎片合成；v268：共鳴深鏈（自動填槽/就地更新）
})();
