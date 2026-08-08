/* 放置王國 MEGA IDLE — bootstrap: game loop, autosave, offline rewards, audio unlock */
"use strict";
(function () {
  function boot() {
    MG.sys.game.init();
    MG.ui.screens.init();
    // tutorial
    MG.ui.tutorial.start(false);
    // offline rewards
    setTimeout(() => {
      if (document.body.dataset.offlineShown) return;
      const r = MG.core.save.offline();
      if (!r) return;
      document.body.dataset.offlineShown = "1";
      const m = MG.ui.dom.modal("離線獎勵", null, { icon: "icon_offline" });
      m.panel.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", padding: "6px 0 4px" } },
        MG.ui.dom.h("div", { style: { fontSize: 13, color: "var(--dim)" } }, "你離開的這 " + Math.max(1, Math.round(r.hours)) + " 小時裡，獵人們從未停歇。"),
        MG.ui.dom.h("div", { style: { fontSize: 20, fontWeight: 900, color: "var(--gold)", margin: "10px 0 4px" } },
          MG.ui.dom.icon("icon_coin", 18), " " + MG.util.fmt(r.gold) + " 金幣"),
        MG.ui.dom.h("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 12 } },
          "經驗 " + MG.util.fmt(r.exp) + (r.mats && r.mats.length ? "　素材 " + r.mats.length + " 種" : "") + (r.items ? "　裝備 " + r.items + " 件" : ""))));
      m.panel.appendChild(MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, on: { click: () => { MG.core.save.applyOffline(r); m.close(); MG.ui.screens.refreshAll(); MG.core.audio.SFX.coin(); } } }, "領取獎勵"));
    }, 800);
    // main loop: sim at interval (works in background tabs), render at rAF
    let lastSim = performance.now();
    setInterval(() => {
      const now = performance.now();
      MG.sys.game.tick(now);
      lastSim = now;
    }, 200);
    function raf(now) {
      try { MG.ui.screens.raf(now); }
      catch (e) { console.error("render error:", e); }
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    // UI refresh 2Hz
    setInterval(() => MG.ui.screens.tick(), 500);
    // autosave
    setInterval(() => MG.core.save.save(), MG.config.SAVE_INTERVAL);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) MG.core.save.save();
      else MG.ui.screens.refreshAll();
    });
    window.addEventListener("beforeunload", () => MG.core.save.save());
    // audio unlock + music
    const unlockAudio = () => {
      MG.core.audio.unlock();
      if (MG.game.state.settings.music) MG.core.audio.startMusic("town");
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    console.log("%c放置王國 MEGA IDLE v" + MG.config.VERSION + " — 梅根的獵人，永不低頭。", "color:#ffd166;font-weight:bold");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
