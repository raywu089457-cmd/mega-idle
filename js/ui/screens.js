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
  let buffBarEl = null, buffEls = {}; // v634 增益常駐條
  const BUFFS = [
    { key: "potAtk", icon: "icon_pot_atk", label: "攻擊", color: "var(--r6)", tip: "攻擊靈藥使用中 — 30 分鐘內全隊攻擊 +30%" },
    { key: "potGold", icon: "icon_pot_gold", label: "金幣", color: "var(--gold)", tip: "金幣靈藥使用中 — 30 分鐘內擊殺金幣 +50%" },
    { key: "potExp", icon: "icon_pot_exp", label: "經驗", color: "#7ee787", tip: "經驗靈藥使用中 — 30 分鐘內擊殺經驗 +50%" },
    { key: "boostUntil", icon: "icon_hourglass", label: "加速", color: "#9ad8ff", tip: "加速沙漏使用中 — 60 秒內戰鬥速度 ×2" }
  ];
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
    // settings
    topEl.appendChild(MG.ui.dom.h("div", { class: "tb-btn", title: "設定（聲音/自動喝水/通知/存檔）", on: { click: () => MG.ui.more.openSettings() } },
      MG.ui.dom.icon("icon_settings", 16)));
    // v634 增益常駐條:任何分頁皆可見的藥水/加速剩餘時間(唯讀,非按鈕)
    buffBarEl = MG.ui.dom.h("div", { id: "tb-buffs", style: { display: "none" } });
    for (const b of BUFFS) {
      const chip = MG.ui.dom.h("span", { class: "tb-buff", title: b.tip, style: { color: b.color, display: "none" } },
        MG.ui.dom.icon(b.icon, 14),
        MG.ui.dom.h("span", null, b.label),
        MG.ui.dom.h("span", null, "--:--"));
      buffBarEl.appendChild(chip);
      buffEls[b.key] = chip;
    }
    topEl.appendChild(buffBarEl);
    // tabs
    // v666：title 附快捷鍵提示（1–6）
    const TAB_TIPS = { kingdom: "王國：建築/資源/概覽（快捷鍵 1）", hunt: "副本：派遣討伐/離線收益（快捷鍵 2）", hunters: "英雄：名冊/招募/編隊（快捷鍵 3）", equipment: "裝備：背包/強化/鑲嵌（快捷鍵 4）", buildings: "建築管理（快捷鍵 5）", more: "更多：任務/活動/系統入口（快捷鍵 6）" };
    for (const t of TABS) {
      const el = MG.ui.dom.h("button", { class: "tab" + (t.id === "kingdom" ? " on" : ""), "data-tab": t.id, title: TAB_TIPS[t.id] || t.name, style: (t.id === "more" || t.id === "equipment" || t.id === "hunters") ? { position: "relative" } : {}, on: { click: () => show(t.id) } }, // v211FIX/v216FIX：紅點頁籤需要 relative 定位（否則相對 #app 錯位疊頂欄）
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
    // v666：數字鍵 1–6 切底欄（輸入中或有 modal 時不搶鍵）
    if (typeof document !== "undefined" && !document._mgTabKeysBound) {
      document._mgTabKeysBound = true;
      document.addEventListener("keydown", (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        const map = { "1": "kingdom", "2": "hunt", "3": "hunters", "4": "equipment", "5": "buildings", "6": "more" };
        const id = map[e.key];
        if (!id) return;
        const t = e.target;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
        if (document.querySelector("#overlay-root .ovl")) return;
        e.preventDefault();
        show(id);
      });
    }
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
    // v634 增益常駐條更新(2Hz;字串未變不寫 DOM)
    const nowMs = Date.now(); let anyBuff = false;
    for (const b of BUFFS) {
      const chip = buffEls[b.key]; if (!chip) continue;
      const until = (st.buffs && st.buffs[b.key]) || 0; // safe: save.normalize guarantees st.buffs exists; ||0 for missing keys
      if (until > nowMs) {
        anyBuff = true; chip.style.display = "";
        const sec = Math.ceil((until - nowMs) / 1000);
        const txt = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
        const t = chip.lastElementChild;
        if (t.textContent !== txt) t.textContent = txt;
      } else { chip.style.display = "none"; }
    }
    if (buffBarEl) buffBarEl.style.display = anyBuff ? "" : "none";
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
