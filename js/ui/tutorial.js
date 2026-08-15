/* 放置王國 MEGA IDLE — first-run tutorial overlay (slice B9 owns) */
"use strict";
MG.ui = MG.ui || {};
MG.ui.tutorial = (function () {
  const STEPS = [
    { icon: "icon_castle", title: "歡迎來到梅根王國", text: "你繼承了祖父的舊王國。這裡的酒館將再次熱鬧——而這一切都從副本開始。" },
    { icon: "icon_sword", title: "前往副本", text: "點擊下方「副本」分頁。按下「派遣」率領編隊出征，隊伍會自動戰鬥、自動獲得金幣與裝備，即使關掉遊戲也會持續成長。" },
    { icon: "icon_recruit", title: "招募英雄", text: "點擊「招募英雄」開啟招募，再點「招募券」分頁，用你的第一張招募券迎接夥伴！稀有度越高，成長越強！" },
    { icon: "icon_hammer", title: "建設王國", text: "升級建築壯大王國：酒館增加出戰人數與名冊上限、鐵匠鋪解鎖強化、訓練場加速升級。先把鐵匠鋪蓋起來吧！" },
    { icon: "icon_armor", title: "武裝英雄", text: "副本會掉落裝備。點擊背包中的裝備，再按下「強化」（需先建造鐵匠鋪），讓英雄戰力突飛猛進。" },
    { icon: "icon_offline", title: "離線也有收穫", text: "關閉遊戲前記得派遣英雄出戰！王國會自動出戰並累積「離線獎勵」。記得回來領取！現在，出發吧，英雄王。" },
    { icon: "icon_map", title: "探索世界地圖", text: "點擊頂欄的地圖按鈕，展開廣闊的世界！點地名前往討伐，拖曳捲動探索 — 灰霧區域擊敗守關 BOSS 後解鎖。", tip: "頂欄左側的地圖圖示" }
  ];
  const TABS = ["kingdom", "hunt", "hunters", "buildings", "equipment", "hunt", "map"];
  let overlay = null, card = null, arrow = null, ring = null, step = 0, ticketWatch = null;

  function isRm() {
    const st = MG.game.state;
    if (st && st.settings && st.settings.reducedMotion) return true;
    try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
    catch (e) { return false; }
  }
  function start(force) {
    const st = MG.game.state;
    if (force) st.tutorial = 0;                 // 重播教學：從頭開始
    else if (st.tutorial >= STEPS.length) return;
    step = st.tutorial;
    if (step >= STEPS.length) return;
    show();
  }
  function show() {
    hide();
    const s = STEPS[step];
    overlay = MG.ui.dom.h("div", { class: "tut" + (isRm() ? " rm" : "") });
    card = MG.ui.dom.h("div", { class: "tut-card", title: "新手教學 " + (step + 1) + "/" + STEPS.length + " — 可隨時「略過」結束引導" },
      MG.ui.dom.h("div", { class: "tut-dots" }, dots()),
      MG.ui.dom.h("div", { class: "tut-icon" }, MG.ui.dom.icon(s.icon, 64)),
      MG.ui.dom.h("div", { class: "tut-title" }, step === 0 ? "歡迎來到" + (MG.game.state.kingdomName || "梅根王國") : s.title),
      MG.ui.dom.h("div", { class: "tut-text" }, s.text),
      MG.ui.dom.h("div", { class: "tut-actions" },
        MG.ui.dom.h("button", { class: "btn", on: { click: skip } }, "略過"),
        MG.ui.dom.h("button", { class: "btn gold", on: { click: next } }, step < STEPS.length - 1 ? "下一步" : "開始冒險！")));
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    const target = targetFor(step);
    if (target) positionCard(target);
    if (step === 2) watchTicketTab(); // 招募步驟：若招募視窗開啟，自動切到「招募券」分頁
  }
  function dots() {
    const wrap = MG.ui.dom.h("div", { class: "tut-dots" });
    for (let i = 0; i < STEPS.length; i++) {
      wrap.appendChild(MG.ui.dom.h("span", { class: "dot" + (i === step ? " on" : i < step ? " done" : "") }));
    }
    return wrap;
  }
  /* 找出現有畫面上的引導目標；找不到就回傳 null（UI 會退回置中文字） */
  function targetFor(idx) {
    if (idx === 2) return findBtn("招募英雄");              // 招募 FAB（英雄頁）
    if (idx === 3) return findBtn(/^升級$/);                 // 第一顆「升級」（王國頁，先建鐵匠鋪）
    if (idx === 4) return findBtn(/強化/) || document.querySelector('.screen [style*="aspect-ratio"]') || null; // 強化鈕 → 第一格裝備
    if (idx === 6) return document.querySelector('#topbar .tb-btn') || null;  // v305：世界地圖鈕（頂欄）
    return null;
  }
  /* 招募步驟：監看招募視窗，若出現「招募券」分頁就自動點擊切換 */
  function watchTicketTab() {
    stopTicketWatch();
    ticketWatch = setInterval(() => {
      if (!document.querySelector(".tut")) { stopTicketWatch(); return; }
      const chips = document.querySelectorAll("#overlay-root .modal .chip");
      for (const c of chips) {
        if ((c.textContent || "").indexOf("招募券") >= 0) { stopTicketWatch(); c.click(); return; }
      }
    }, 250);
  }
  function stopTicketWatch() {
    if (ticketWatch) { clearInterval(ticketWatch); ticketWatch = null; }
  }
  function findBtn(re) {
    const list = document.querySelectorAll(".screen button");
    for (const b of list) {
      const t = (b.textContent || "").replace(/\s+/g, "");
      if (re instanceof RegExp ? re.test(t) : t.indexOf(re) >= 0) return b;
    }
    return null;
  }
  function positionCard(target) {
    const r = target.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const h = card.offsetHeight || 260;
    const spaceAbove = r.top - 16, spaceBelow = vh - r.bottom - 16;
    const fitsAbove = spaceAbove >= Math.min(h, 300) - 30;
    const fitsBelow = spaceBelow >= Math.min(h, 300) - 30;
    const placeAbove = fitsAbove ? true : fitsBelow ? false : (r.top + r.height / 2) > vh / 2;
    card.style.width = Math.min(320, vw - 40) + "px";
    if (placeAbove) {
      card.style.top = Math.max(8, r.top - 16) + "px";
      card.style.transform = "translate(-50%, -100%)";
      arrow = MG.ui.dom.h("div", { class: "tut-arrow down" });
    } else {
      card.style.top = Math.min(vh - 8, r.bottom + 16) + "px";
      card.style.transform = "translate(-50%, 0)";
      arrow = MG.ui.dom.h("div", { class: "tut-arrow up" });
    }
    overlay.appendChild(arrow);
    const cardRect = card.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const pct = Math.max(14, Math.min(86, (cx - cardRect.left) / cardRect.width * 100));
    arrow.style.left = (cardRect.left + pct / 100 * cardRect.width) + "px";
    arrow.style.top = (placeAbove ? cardRect.bottom - 2 : cardRect.top - 13) + "px";
    // 脈動光圈（寬度幾乎全螢幕的目標只留箭頭，避免整個底邊發亮）
    if (r.width < vw * 0.72 && r.height < vh * 0.4) {
      ring = MG.ui.dom.h("div", { class: "tut-ring" });
      ring.style.left = (r.left - 5) + "px";
      ring.style.top = (r.top - 5) + "px";
      ring.style.width = (r.width + 10) + "px";
      ring.style.height = (r.height + 10) + "px";
      overlay.appendChild(ring);
    }
  }
  function next() {
    const st = MG.game.state;
    st.tutorial = Math.min(STEPS.length, step + 1);
    if (step + 1 >= STEPS.length) { hide(); return; }
    step = st.tutorial;
    if (step < TABS.length) MG.ui.screens.show(TABS[step]);
    show();
  }
  function skip() {
    const st = MG.game.state;
    st.tutorial = STEPS.length;
    hide();
  }
  function hide() {
    stopTicketWatch();
    if (overlay) { overlay.remove(); overlay = null; card = null; arrow = null; ring = null; }
  }
  return { start, hide };
})();
