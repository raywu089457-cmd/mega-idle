/* 放置王國 MEGA IDLE — screen registry, top bar, tab bar */
"use strict";
MG.ui = MG.ui || {};
MG.ui.screens = (function () {
  const registry = {};
  const TABS = [
    { id: "kingdom", name: "王國", icon: "icon_castle" },
    { id: "hunt", name: "狩獵", icon: "icon_sword" },
    { id: "hunters", name: "獵人", icon: "icon_recruit" },
    { id: "equipment", name: "裝備", icon: "icon_armor" },
    { id: "more", name: "更多", icon: "icon_menu" }
  ];
  let current = null, topEl, stageEl, tabEls = {}, currencyEls = {}, levelEl, xpBar;
  let lastCur = {}, lastKExp = 0;
  function register(id, screen) { registry[id] = screen; }
  function init() {
    topEl = document.getElementById("topbar");
    stageEl = document.getElementById("stage");
    const tabbar = document.getElementById("tabbar");
    tabbar.innerHTML = "";
    topEl.innerHTML = "";
    // currencies
    const mkCur = (iconName, cls) => {
      const el = MG.ui.dom.h("div", { class: "tb-cur " + cls },
        MG.ui.dom.icon(iconName, 16), MG.ui.dom.h("span", { class: "val" }, "0"));
      topEl.appendChild(el);
      return el;
    };
    currencyEls = {
      gold: mkCur("icon_coin", "gold"),
      gems: mkCur("icon_gem", "gems"),
      ticket: mkCur("icon_ticket", "honor"),
      honor: mkCur("icon_honor", "honor"),
      book: mkCur("icon_book", "gold")
    };
    // level pill
    levelEl = MG.ui.dom.h("div", { id: "tb-level", on: { click: () => show("kingdom") } },
      MG.ui.dom.h("span", { class: "lv" }, "王國 Lv 1"),
      MG.ui.dom.h("span", { class: "bar" }, MG.ui.dom.h("i", { style: { width: "0%" } })));
    topEl.appendChild(levelEl);
    // settings
    topEl.appendChild(MG.ui.dom.h("div", { class: "tb-btn", on: { click: () => MG.ui.more.openSettings() } },
      MG.ui.dom.icon("icon_settings", 18)));
    // tabs
    for (const t of TABS) {
      const el = MG.ui.dom.h("button", { class: "tab" + (t.id === "kingdom" ? " on" : ""), "data-tab": t.id, on: { click: () => show(t.id) } },
        MG.ui.dom.icon(t.icon, 22), MG.ui.dom.h("span", null, t.name));
      tabbar.appendChild(el);
      tabEls[t.id] = el;
    }
    show("kingdom");
  }
  function show(id) {
    const scr = registry[id];
    if (!scr) return;
    if (current && current.onHide) current.onHide();
    current = scr;
    stageEl.innerHTML = "";
    for (const t of TABS) tabEls[t.id].classList.toggle("on", t.id === id);
    const wrap = MG.ui.dom.h("div", { class: "screen" });
    stageEl.appendChild(wrap);
    scr.render(wrap);
    if (scr.onShow) scr.onShow();
  }
  function tick() {
    const st = MG.game.state;
    if (!st) return;
    const cur = st.currencies;
    const vals = [["gold", cur.gold], ["gems", cur.gems], ["ticket", cur.ticket || 0], ["honor", cur.honor || 0], ["book", cur.book || 0]];
    for (const [k, v] of vals) {
      const el = currencyEls[k];
      if (!el) continue;
      const span = el.querySelector(".val");
      const txt = MG.util.fmt(v);
      if (span.textContent !== txt) {
        span.textContent = txt;
        if (lastCur[k] !== undefined && v > lastCur[k]) {
          span.classList.remove("bump"); void span.offsetWidth; span.classList.add("bump");
        }
      }
      lastCur[k] = v;
    }
    const ke = MG.sys.game.kingdomExpNeed(st.kingdom.level);
    levelEl.querySelector(".lv").textContent = "王國 Lv " + st.kingdom.level;
    xpBar = levelEl.querySelector(".bar i");
    xpBar.style.width = Math.min(100, st.kingdom.exp / ke * 100) + "%";
    if (current && current.refresh) current.refresh();
  }
  function raf(now) { if (current && current.raf) current.raf(now); }
  function refreshAll() { if (current && current.refresh) current.refresh(); }
  return { register, init, show, tick, raf, refreshAll, get current() { return current; } };
})();
