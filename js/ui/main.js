/* 放置王國 MEGA IDLE — bootstrap: logic boot, modal hooks, event bridge, tick loops */
"use strict";
(function () {
  const openModals = {};
  function showModal(id, title, html) {
    closeModal(id);
    const m = MG.ui.dom.modal("", null, {});
    if (title) m.panel.appendChild(MG.ui.dom.h("div", { class: "m-title" }, MG.ui.dom.h("span", null, title)));
    const body = MG.ui.dom.h("div", null);
    body.innerHTML = html;
    m.panel.appendChild(body);
    m.el.dataset.modalId = id;
    openModals[id] = m;
    // wire logic-layer action buttons: any button closes its modal
    body.querySelectorAll("button[data-action]").forEach(b => b.addEventListener("click", () => m.close()));
  }
  function closeModal(id) {
    const m = openModals[id];
    if (m) { m.close(); delete openModals[id]; }
  }
  function boot() {
    // UI hooks for logic layer
    MG.logic.init.setUiHooks({ toast: (t) => MG.ui.dom.toast(String(t), "", ""), showModal, closeModal, escapeHtml: (s) => MG.util.esc(s) });
    MG.logic.tutorial.setModalHooks && MG.logic.tutorial.setModalHooks({ showModal, closeModal });
    // event bus bridge
    const util = MG.logic.util;
    util.on("toast", (t) => MG.ui.dom.toast(String(t), "", ""));
    util.on("sfx", (name) => { try { MG.core.audio.SFX[name] && MG.core.audio.SFX[name](); } catch (e) {} });
    util.on("heroesChanged", () => MG.ui.screens.refreshAll());
    util.on("buildingsChanged", () => MG.ui.screens.refreshAll());
    util.on("inventoryChanged", () => MG.ui.screens.refreshAll());
    util.on("zoneProgressChanged", () => MG.ui.screens.refreshAll());
    util.on("expeditionsChanged", () => { if (MG.ui.map && MG.ui.map.onExpeditionsChanged) MG.ui.map.onExpeditionsChanged(); MG.ui.screens.refreshAll(); });
    util.on("achievementsChanged", () => MG.ui.screens.refreshAll());
    // boot logic layer (load/new game, offline + daily modals, onboarding, timers)
    MG.logic.init.setSceneHooks({ sceneTick: () => {}, syncVillagers: () => {} });
    MG.logic.init.init();
    MG.ui.screens.init();
    // UI tick 2Hz
    setInterval(() => MG.ui.screens.tick(), 500);
    // audio unlock
    const unlock = () => {
      MG.core.audio.unlock();
      if (MG.logic.state.settings.bgm) MG.core.audio.startMusic("town");
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    // selftest hook
    MG.logic.selftest.installSelftest && MG.logic.selftest.installSelftest();
    console.log("%c放置王國 MEGA IDLE — 曙光村 v" + MG.config.VERSION + "（後台邏輯與 mega-idle-web-three.js 完全對齊）", "color:#ffd166;font-weight:bold");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
