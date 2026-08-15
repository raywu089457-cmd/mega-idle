/* 放置王國 MEGA IDLE — screen registry, top bar, tab bar */
"use strict";
MG.ui = MG.ui || {};
MG.ui.screens = (function () {
  const registry = {};
  const TABS = [
    { id: "kingdom", name: "王國", icon: "icon_castle" },
    { id: "hunt", name: "副本", icon: "icon_sword" },
    { id: "hunters", name: "英雄", icon: "icon_recruit" },
    { id: "equipment", name: "裝備", icon: "icon_armor" },
    { id: "buildings", name: "建築", icon: "icon_hammer" },
    { id: "more", name: "更多", icon: "icon_menu" }
  ];
  let current = null, currentId = null, topEl, stageEl, tabEls = {}, currencyEls = {}, levelEl, xpBar;
  let moreDotEl = null; // v164 紅點：更多頁籤
  let eqDotEl = null; // v211 紅點：裝備分頁（背包有可強化未穿戴裝備）
  let huntersDotEl = null; // v216 紅點：英雄分頁（流浪英雄可招募）
  let lastCur = {}, lastKExp = 0;
  let bumpSuspendUntil = 0; // 戰利品飛行期間暫停頂欄數字跳動（v116：英雄拿到才結算）
  const scrollPos = {}; // 每個分頁各自記憶捲動位置：操作/切頁後維持原本滑動的地方
  function register(id, screen) { registry[id] = screen; }
  function init() {
    topEl = document.getElementById("topbar");
    stageEl = document.getElementById("stage");
    const tabbar = document.getElementById("tabbar");
    tabbar.innerHTML = "";
    topEl.innerHTML = "";
    // 左上角：王國名字 + 等級 + 經驗條（v137：資源條移入資源總覽）
    levelEl = MG.ui.dom.h("div", { id: "tb-kingdom", on: { click: () => show("kingdom") } },
      MG.ui.dom.h("span", { class: "nm" }, "—"),
      MG.ui.dom.h("span", { class: "lv" }, "王國 Lv 1"),
      MG.ui.dom.h("span", { class: "bar" }, MG.ui.dom.h("i", { style: { width: "0%" } })));
    topEl.appendChild(levelEl);
    // 右上角：金幣 + 鑽石（其餘貨幣移至王國頁「資源總覽」）
    const resEl = MG.ui.dom.h("div", { class: "tb-res" });
    const mkCur = (iconName, cls) => {
      // v231：點資源 → 資源取得導覽（市面放置標準 — 資源不足時給出下一步，閉環放置迴圈）
      const el = MG.ui.dom.h("div", { class: "tb-cur " + cls, title: cls === "gold" ? "金幣 — 點擊查看取得方式" : "鑽石 — 點擊查看取得方式", on: { click: () => MG.ui.more.openResourceGuide(cls) } },
        MG.ui.dom.icon(iconName, 16), MG.ui.dom.h("span", { class: "val" }, "0"));
      resEl.appendChild(el);
      return el;
    };
    currencyEls = {
      gold: mkCur("icon_coin", "gold"),
      gems: mkCur("icon_gem", "gems")
    };
    topEl.appendChild(resEl);
    // 世界地圖（v160 實驗：頂欄地圖鈕，不佔 tab — v278 等角地圖回歸）
    topEl.appendChild(MG.ui.dom.h("div", { class: "tb-btn", title: "世界地圖（拖曳捲動・點名討伐）", on: { click: () => MG.ui.map.open() } },
      MG.ui.dom.icon("icon_map", 16)));
    // settings
    topEl.appendChild(MG.ui.dom.h("div", { class: "tb-btn", title: "設定（聲音/自動喝水/通知/存檔）", on: { click: () => MG.ui.more.openSettings() } },
      MG.ui.dom.icon("icon_settings", 16)));
    // tabs
    for (const t of TABS) {
      const el = MG.ui.dom.h("button", { class: "tab" + (t.id === "kingdom" ? " on" : ""), "data-tab": t.id, style: (t.id === "more" || t.id === "equipment" || t.id === "hunters") ? { position: "relative" } : {}, on: { click: () => show(t.id) } }, // v211FIX/v216FIX：紅點頁籤需要 relative 定位（否則相對 #app 錯位疊頂欄）
        MG.ui.dom.icon(t.icon, 32), MG.ui.dom.h("span", null, t.name));
      if (t.id === "more") {
        // v164 紅點：更多頁籤（可領取獎勵時顯示）
        moreDotEl = MG.ui.dom.h("span", { style: { position: "absolute", top: 3, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#ff5c5c", border: "1px solid #14121f", display: "none" } });
        el.appendChild(moreDotEl);
      }
      if (t.id === "equipment") {
        // v211 紅點：裝備分頁（背包有可強化裝備 — 成長動作主動曝光）
        eqDotEl = MG.ui.dom.h("span", { style: { position: "absolute", top: 3, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#ff5c5c", border: "1px solid #14121f", display: "none" } });
        el.appendChild(eqDotEl);
      }
      if (t.id === "hunters") {
        // v216 紅點：英雄分頁（流浪英雄可招募）
        huntersDotEl = MG.ui.dom.h("span", { style: { position: "absolute", top: 3, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#ff5c5c", border: "1px solid #14121f", display: "none" } });
        el.appendChild(huntersDotEl);
      }
      tabbar.appendChild(el);
      tabEls[t.id] = el;
    }
    show("kingdom");
  }
  function show(id) {
    const scr = registry[id];
    if (!scr) return;
    if (current && current.onHide) current.onHide();
    // 記錄目前分頁的捲動位置（重建前）
    if (currentId) {
      const old = stageEl.querySelector(".screen");
      if (old) scrollPos[currentId] = old.scrollTop;
    }
    current = scr;
    currentId = id;
    stageEl.innerHTML = "";
    for (const t of TABS) tabEls[t.id].classList.toggle("on", t.id === id);
    const wrap = MG.ui.dom.h("div", { class: "screen" });
    stageEl.appendChild(wrap);
    scr.render(wrap);
    if (scr.onShow) scr.onShow();
    // 回到這個分頁時維持上次滑動位置（等內容排版完成再套用）
    const prev = scrollPos[id];
    if (prev > 0) requestAnimationFrame(() => { wrap.scrollTop = prev; });
  }
  function tick() {
    const st = MG.game.state;
    if (!st) return;
    const cur = st.currencies;
    const vals = [["gold", cur.gold], ["gems", cur.gems]];
    for (const [k, v] of vals) {
      const el = currencyEls[k];
      if (!el) continue;
      const span = el.querySelector(".val");
      const txt = MG.util.fmt(v);
      if (span.textContent !== txt) {
        span.textContent = txt;
        // v137：數字愈長字體愈小，永遠不擠出右邊界
        span.style.fontSize = txt.length >= 8 ? "10px" : txt.length >= 6 ? "11.5px" : "";
        if (lastCur[k] !== undefined && v > lastCur[k] && Date.now() >= bumpSuspendUntil) {
          span.classList.remove("bump"); void span.offsetWidth; span.classList.add("bump");
        }
      }
      lastCur[k] = v;
    }
    const ke = MG.sys.game.kingdomExpNeed(st.kingdom.level);
    levelEl.querySelector(".nm").textContent = st.kingdomName || "梅根王國";
    levelEl.querySelector(".lv").textContent = "王國 Lv " + st.kingdom.level;
    xpBar = levelEl.querySelector(".bar i");
    xpBar.style.width = Math.min(100, st.kingdom.exp / ke * 100) + "%";
    // v164/v211/v216 紅點：更多＋裝備＋英雄頁籤（2Hz 更新，唯讀判定；單次 check 避免多重掃描）
    if ((moreDotEl || eqDotEl || huntersDotEl) && MG.sys.badges) {
      const b = MG.sys.badges.check();
      // v236 語意分流：更多頁籤聚合點 — 有可領取紅、僅免費次數藍
      if (moreDotEl) {
        moreDotEl.style.display = b.any ? "" : "none";
        moreDotEl.style.background = b.claim ? "#ff5c5c" : "#4da3ff";
        moreDotEl.title = b.claim ? "" : "免費次數可用";
      }
      if (eqDotEl) {
        // v241：背包接近上限 → 橙點警示（優先於既有 eq 紅點語意 — 掉落蒸發是損失非機會）
        eqDotEl.style.display = (b.eq || b.invFull) ? "" : "none";
        eqDotEl.style.background = b.invFull ? "#ff9f43" : "#ff5c5c";
        eqDotEl.title = b.invFull ? "背包接近上限 — 掉落將被自動分解" : "";
      }
      if (huntersDotEl) huntersDotEl.style.display = (b.wanderer || b.synth) ? "" : "none"; // v235：碎片合成可達成（行動在英雄頁 FAB）
    }
    if (current && current.refresh) current.refresh();
  }
  function suspendBump(ms) { bumpSuspendUntil = Date.now() + ms; }
  function bumpCurrency(key) {
    const el = currencyEls[key];
    if (!el) return;
    const span = el.querySelector(".val");
    if (span) { span.classList.remove("bump"); void span.offsetWidth; span.classList.add("bump"); }
  }
  function raf(now) { if (current && current.raf) current.raf(now); }
  function refreshAll() { if (current && current.refresh) current.refresh(); }
  return { register, init, show, tick, raf, refreshAll, suspendBump, bumpCurrency, get current() { return current; } };
})();
