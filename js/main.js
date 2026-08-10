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
      const m = MG.ui.dom.modal("離線獎勵", null, { icon: "icon_offline", lock: true, noClose: true });
      const rows = [
        MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
          MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("icon_coin", 18), "金幣"),
          MG.ui.dom.h("span", { style: { fontWeight: 900, color: "var(--gold)" } }, "+" + MG.util.fmt(r.gold))),
        MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
          MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("icon_train", 18), "英雄經驗"),
          MG.ui.dom.h("span", { style: { fontWeight: 900, color: "#7ee787" } }, "+" + MG.util.fmt(r.exp)))
      ];
      if (r.kingdomExp > 0) {
        rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
          MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("icon_castle", 18), "王國經驗"),
          MG.ui.dom.h("span", { style: { fontWeight: 900, color: "var(--gold)" } }, "+" + MG.util.fmt(r.kingdomExp))));
      }
      for (const mat of r.mats || []) {
        const md = MG.config.MATS[mat.id];
        rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
          MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon(md ? md.icon : "icon_chest", 18), md ? md.name : mat.id),
          MG.ui.dom.h("span", { style: { fontWeight: 900 } }, "×" + mat.qty)));
      }
      if (r.items) {
        rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
          MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("icon_chest", 18), "裝備"),
          MG.ui.dom.h("span", { style: { fontWeight: 900, color: "#9fb4ff" } }, "×" + r.items)));
      }
      m.panel.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", padding: "6px 0 10px" } },
        MG.ui.dom.h("div", { style: { fontSize: 13, color: "var(--dim)" } },
          (MG.game.state.hunt.dispatchIds || []).length
            ? "你離開的這 " + Math.max(1, Math.round(r.hours)) + " 小時裡，英雄們從未停歇。"
            : "你離開的這 " + Math.max(1, Math.round(r.hours)) + " 小時裡，村莊仍在持續運作。"),
        MG.ui.dom.h("div", { class: "panel2", style: { marginTop: 8, padding: "6px 10px", fontSize: 12, textAlign: "left" } }, rows)));
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
    console.log("%c放置王國 MEGA IDLE v" + MG.config.VERSION + " — 梅根的英雄，永不低頭。", "color:#ffd166;font-weight:bold");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
