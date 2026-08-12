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
      const el = MG.ui.dom.h("div", { class: "tb-cur " + cls },
        MG.ui.dom.icon(iconName, 16), MG.ui.dom.h("span", { class: "val" }, "0"));
      resEl.appendChild(el);
      return el;
    };
    currencyEls = {
      gold: mkCur("icon_coin", "gold"),
      gems: mkCur("icon_gem", "gems")
    };
    topEl.appendChild(resEl);
    // settings
    topEl.appendChild(MG.ui.dom.h("div", { class: "tb-btn", on: { click: () => MG.ui.more.openSettings() } },
      MG.ui.dom.icon("icon_settings", 18)));
    // tabs
    for (const t of TABS) {
      const el = MG.ui.dom.h("button", { class: "tab" + (t.id === "kingdom" ? " on" : ""), "data-tab": t.id, on: { click: () => show(t.id) } },
        MG.ui.dom.icon(t.icon, 32), MG.ui.dom.h("span", null, t.name));
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
