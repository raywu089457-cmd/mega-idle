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
      // v225FIX：離線遠征結算（已入帳 — 摘要加入離線彈窗「起床收菜」）
      const expeds = (MG.sys.wanderers && MG.sys.wanderers.settleAllExped) ? MG.sys.wanderers.settleAllExped() : [];
      // v240：離線防守預先模擬（defWaves 日上限防 applyOffline 重複發放 — 與遠征 settled 同效）
      const defense = (MG.sys.arena && MG.sys.arena.simulateDefense) ? MG.sys.arena.simulateDefense(r.hours || 0) : null;
      document.body.dataset.offlineShown = "1";
      const m = MG.ui.dom.modal("離線獎勵", null, { icon: "icon_offline", lock: true, noClose: true });
      const rm = !!(MG.game.state.settings && MG.game.state.settings.reducedMotion);
      const goldEl = MG.ui.dom.h("span", { style: { fontWeight: 900, color: "var(--gold)", fontVariantNumeric: "tabular-nums" } }, rm ? "+" + MG.util.fmt(r.gold) : "+0");
      const expEl = MG.ui.dom.h("span", { style: { fontWeight: 900, color: "#7ee787", fontVariantNumeric: "tabular-nums" } }, rm ? "+" + MG.util.fmt(r.exp) : "+0");
      const rows = [
        MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
          MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("icon_coin", 18), "金幣"),
          goldEl),
        MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
          MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("icon_train", 18), "英雄經驗"),
          expEl)
      ];
      // v225：遠征歸來摘要（起床收菜 — 金幣/素材/經驗已入帳）
      for (const ex of expeds) {
        rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderTop: "1px solid var(--line)" } },
          MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11 } }, MG.ui.dom.icon("icon_sword", 16), "遠征「" + ex.name + "」歸來"),
          MG.ui.dom.h("span", { style: { fontSize: 11, fontWeight: 800, color: ex.won ? "var(--gold)" : "var(--dim)" } },
            ex.won ? ("+" + MG.util.fmt(ex.gold) + " 金" + (ex.mats && ex.mats.length ? "・素材 ×" + ex.mats.length : "") + "・經驗 +" + ex.exp) : ("受挫（經驗 +" + ex.exp + "）"))));
      }
      // v271：委託遠征營離線摘要（applyOffline 已入帳 — 用 r.expedEx；再呼叫 settleAll 會空（slot 已清））
      const expedEx = r.expedEx || [];
      for (const ex of expedEx) {
        rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderTop: "1px solid var(--line)" } },
          MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11 } }, MG.ui.dom.icon("icon_chest", 16), "委託「" + ex.name + "」完成"),
          MG.ui.dom.h("span", { style: { fontSize: 11, fontWeight: 800, color: "var(--gold)" } },
            "+" + MG.util.fmt(ex.gold) + " 金" + (ex.void ? "・虛空 ×" + ex.void : "") + (ex.book ? "・書 ×" + ex.book : ""))));
      }
      // v240：競技場防守摘要（離線期間被幻影挑戰 — 排名零影響）
      if (defense && defense.waves > 0) {
        rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderTop: "1px solid var(--line)" } },
          MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11 } }, MG.ui.dom.icon("icon_honor", 16), "競技場防守"),
          MG.ui.dom.h("span", { style: { fontSize: 11, fontWeight: 800, color: defense.wins > 0 ? "var(--gold)" : "var(--dim)" } },
            defense.wins + "/" + defense.waves + " 勝・+" + defense.honor + " 榮譽")));
      }
      // v241：離線滿包損失回報（背包已滿未能帶回的裝備數）
      if (r.lostItems > 0) {
        rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderTop: "1px solid var(--line)" } },
          MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11 } }, MG.ui.dom.icon("icon_hammer", 16), "⚠ 背包已滿"),
          MG.ui.dom.h("span", { style: { fontSize: 11, fontWeight: 800, color: "#ff9f43" } }, r.lostItems + " 件裝備未能帶回")));
      }
      // v207：離線收成儀式 — 金幣/經驗數字 0.8s 滾動至實際值（reduced-motion 靜態）
      if (!rm) {
        const t0 = performance.now();
        const roll = (now) => {
          const p = Math.min(1, (now - t0) / 800);
          const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
          goldEl.textContent = "+" + MG.util.fmt(Math.round(r.gold * e));
          expEl.textContent = "+" + MG.util.fmt(Math.round(r.exp * e));
          if (p < 1) requestAnimationFrame(roll);
        };
        requestAnimationFrame(roll);
      }
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
      m.panel.appendChild(MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%", position: "relative", overflow: "hidden" }, on: { click: (e) => {
        // v207：領取瞬間金爆發（reuse v172 光效）— v207FIX：m.close 延後讓光環播完（同步 close 會銷毀元素致零幀）
        if (!rm && e.currentTarget) {
          e.currentTarget.disabled = true; // 延遲期間防連點（避免重複 applyOffline 雙倍獎勵）
          e.currentTarget.appendChild(MG.ui.dom.h("div", { class: "summon-rays summon-rays-gold" }));
          e.currentTarget.appendChild(MG.ui.dom.h("div", { class: "summon-ring summon-ring-gold" }));
          setTimeout(() => { MG.core.save.applyOffline(r); m.close(); MG.ui.screens.refreshAll(); MG.core.audio.SFX.coin(); }, 700);
        } else {
          MG.core.save.applyOffline(r); m.close(); MG.ui.screens.refreshAll(); MG.core.audio.SFX.coin();
        }
      } } }, "領取獎勵"));
    }, 800);
    // v194 回歸獎勵：離開 ≥72 小時回歸（在離線獎勵之後顯示；分檔禮包）
    setTimeout(() => {
      if (document.body.dataset.returnShown) return;
      const g = MG.sys.welcome.returnGift();
      if (!g) return;
      document.body.dataset.returnShown = "1";
      const tierName = g.tier === 1 ? "久別重逢" : g.tier === 2 ? "故土情深" : "王者歸來";
      const gd = g.gift;
      const m = MG.ui.dom.modal("回歸獎勵", null, { icon: "icon_chest", lock: true, noClose: true });
      const rows = [];
      if (gd.gold > 0) rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
        MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("icon_coin", 18), "金幣"),
        MG.ui.dom.h("span", { style: { fontWeight: 900, color: "var(--gold)" } }, "+" + MG.util.fmt(gd.gold))));
      if (gd.gems) rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
        MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("icon_gem", 18), "鑽石"),
        MG.ui.dom.h("span", { style: { fontWeight: 900, color: "var(--blue)" } }, "+" + gd.gems)));
      if (gd.ticket) rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
        MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("icon_ticket", 18), "招募券"),
        MG.ui.dom.h("span", { style: { fontWeight: 900 } }, "×" + gd.ticket)));
      if (gd.book) rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
        MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("icon_book", 18), "技能書"),
        MG.ui.dom.h("span", { style: { fontWeight: 900, color: "var(--gold)" } }, "×" + gd.book)));
      const pots = ["攻擊靈藥", "金幣靈藥", "智慧靈藥"].filter((_, i) => [gd.potAtk, gd.potGold, gd.potExp][i]).length;
      if (pots) rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
        MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("item_pot_atk", 18), "靈藥"),
        MG.ui.dom.h("span", { style: { fontWeight: 900, color: "#c792ea" } }, "×" + pots)));
      if (gd.hourglass) rows.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" } },
        MG.ui.dom.h("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, MG.ui.dom.icon("icon_hourglass", 18), "加速沙漏"),
        MG.ui.dom.h("span", { style: { fontWeight: 900 } }, "×" + gd.hourglass)));
      m.panel.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", padding: "6px 0 10px" } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 14, color: "var(--gold)", marginBottom: 4 } }, "「" + tierName + "」"),
        MG.ui.dom.h("div", { style: { fontSize: 12, color: "var(--dim)", marginBottom: 8 } },
          "你離開的 " + g.days + " 天裡，王國仍為你守候。這份心意請收下。"),
        MG.ui.dom.h("div", { class: "panel2", style: { padding: "6px 10px", fontSize: 12, textAlign: "left" } }, rows)));
      m.panel.appendChild(MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, on: { click: () => { m.close(); MG.ui.screens.refreshAll(); MG.core.audio.SFX.coin(); } } }, "收下獎勵"));
    }, 1600);
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
    // 橫向捲動列（list-scroll）：桌面板可用滑鼠拖動 + 顯示細捲軸
    document.addEventListener("pointerdown", e => {
      const sc = e.target.closest(".list-scroll");
      if (!sc || !e.isPrimary) return;
      const drag = { x: e.clientX, left: sc.scrollLeft, moved: false, id: e.pointerId, origin: e.target };
      sc.setPointerCapture(drag.id);
      const move = ev => {
        if (ev.pointerId !== drag.id) return;
        const dx = ev.clientX - drag.x;
        if (Math.abs(dx) > 4) drag.moved = true;
        sc.scrollLeft = drag.left - dx;
      };
      const up = ev => {
        if (ev.pointerId !== drag.id) return;
        sc.releasePointerCapture(drag.id);
        sc.removeEventListener("pointermove", move);
        sc.removeEventListener("pointerup", up);
        if (drag.moved) {
          e.preventDefault();
        } else if (drag.origin && ev.target !== drag.origin) {
          // 未拖動＝點擊：pointer capture 把 click 目標劫持到 list-scroll，
          // 這裡把點擊補回原元素（chip/按鈕），否則桌機上列內按鈕全部失效
          try { drag.origin.click(); } catch (err) {}
        }
      };
      sc.addEventListener("pointermove", move);
      sc.addEventListener("pointerup", up);
    });
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
