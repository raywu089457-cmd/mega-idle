/* 放置王國 MEGA IDLE — DOM helpers: element builder, icons, toast, modal, confirm */
"use strict";
MG.ui = MG.ui || {};
MG.ui.dom = (function () {
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === undefined || v === null || v === false) continue;
        if (k === "class") el.className = v;
        else if (k === "style" && typeof v === "object") {
          // Chrome 151+ 的 CSSOM 拒絕數字賦值（style.width=51 靜默失效）：
          // 數字自動補 px（unitless 屬性除外），其餘原樣
          for (const sk in v) {
            const sv = v[sk];
            if (typeof sv === "number") {
              el.style[sk] = ("opacity,zIndex,flex,lineHeight,order,fontWeight,aspectRatio,flexGrow,flexShrink,zoom".split(",").indexOf(sk) >= 0)
                ? String(sv) : sv + "px";
            } else el.style[sk] = sv;
          }
        }
        else if (k === "on" && typeof v === "object") for (const ev in v) el.addEventListener(ev, v[ev]);
        else if (k === "html") el.innerHTML = v;
        else if (k === "text") el.textContent = v;
        else if (k.startsWith("data-")) el.setAttribute(k, v);
        else el.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const kid of kids) {
      if (kid === undefined || kid === null) continue;
      if (Array.isArray(kid)) kid.forEach(k => el.appendChild(k instanceof Node ? k : document.createTextNode(String(k))));
      else el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  function icon(name, size) {
    const el = h("div", { class: "ic", style: { width: (size || 16) + "px", height: (size || 16) + "px" } });
    const url = MG.ui.render.spriteURL(name);
    if (url) el.style.backgroundImage = "url(" + url + ")";
    return el;
  }
  function stars(r) {
    const n = MG.config.RARITY[r - 1] ? MG.config.RARITY[r - 1].stars : 1;
    return "★".repeat(n);
  }
  function rarityCls(r) { return "rar" + (r || 1); }
  function rarityBg(r) { return "rar-bg" + (r || 1); }
  let toastId = 0;
  /* 通知改進（v113）：置頂置中但緊湊不擋操作——
     1) 同訊息連續通知合併為一則（×N），不讓掉落/連點洗版；
     2) 堆疊上限：手機 2 則、桌機 3 則，超過即移除最舊；
     3) 重要通知（good/bad/gold）顯示較久，一般訊息 1.6s 即收；
     4) 動畫時長跟隨存活時間，淡出不受合併重置。 */
  const TOAST_MS = { good: 2400, bad: 2600, gold: 2600 };
  const toastMax = () => (window.matchMedia("(min-width:481px)").matches ? 3 : 2);
  function toast(msg, cls, ic) {
    const root = document.getElementById("toasts");
    if (!root) return;
    cls = cls || "";
    const dur = TOAST_MS[cls] || 1600;
    // 與最後一則相同 → 就地合併：更新 ×N、重計時間（不重播滑入動畫）
    const last = root.lastElementChild;
    if (last && last.dataset.k === msg && last.dataset.cls === cls && last._exp - Date.now() > 400) {
      const n = (parseInt(last.dataset.n, 10) || 1) + 1;
      last.dataset.n = String(n);
      const span = last.querySelector("span");
      if (span) span.textContent = msg + (n > 1 ? " ×" + n : "");
      last._exp = Date.now() + dur;
      clearTimeout(last._tt);
      last._tt = setTimeout(() => { if (last.parentNode) last.parentNode.removeChild(last); }, dur);
      return;
    }
    // 堆疊上限：先移除最舊（清計時器）
    const max = toastMax();
    while (root.children.length >= max) {
      const old = root.firstElementChild;
      if (old) { clearTimeout(old._tt); old.remove(); }
    }
    const t = h("div", { class: "toast" + (cls ? " " + cls : ""), style: { zIndex: 200 + (toastId++ % 50) } },
      ic ? icon(ic, 14) : null, h("span", null, msg));
    t.dataset.k = msg; t.dataset.cls = cls; t.dataset.n = "1";
    // 淡出時機 = dur - 300ms（toastOut .3s），與存活時間同步
    t.style.animation = "toastIn .25s ease, toastOut .3s ease " + ((dur - 300) / 1000) + "s forwards";
    root.appendChild(t);
    t._exp = Date.now() + dur;
    t._tt = setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, dur);
  }
  let lastModalScroll = 0, lastModalClosedAt = 0;
  function modal(title, content, opts) {
    const o = opts || {};
    const root = document.getElementById("overlay-root");
    const ovl = h("div", { class: "ovl", on: { click: () => { if (!o.lock) close(); } } });
    // 固定頭部（標題＋常駐 ✕）+ 滾動內容區：✕ 永遠在右上角，不被滾動蓋掉
    const panel = h("div", { class: "modal" + (o.wide ? " wide" : ""), on: { click: e => e.stopPropagation() } });
    const head = h("div", { class: "m-head" });
    const body = h("div", { class: "m-body" });
    if (title) head.appendChild(h("div", { class: "m-title" }, o.icon ? icon(o.icon, 20) : null, h("span", null, title)));
    if (!o.noClose) head.appendChild(h("div", { class: "m-x", on: { click: close } }, "✕"));
    panel.appendChild(head);
    panel.appendChild(body);
    if (content) body.appendChild(content instanceof Node ? content : h("div", { html: content }));
    ovl.appendChild(panel);
    root.appendChild(ovl);
    // 操作後就地重建（close→open 快速交替，如訓練/強化後刷新詳情）保留上次捲動位置，
    // 不再跳回 modal 頂部；使用者間隔較久才開新 modal 則正常從頂部開始
    if (Date.now() - lastModalClosedAt < 600 && lastModalScroll > 0) {
      const prev = lastModalScroll;
      requestAnimationFrame(() => { body.scrollTop = prev; });
    }
    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      lastModalScroll = body.scrollTop;
      lastModalClosedAt = Date.now();
      ovl.remove();
      if (o.onClose) o.onClose();
    }
    // m.panel = 內容區（呼叫端 append 的內容都會進入可滾動區）
    return { el: ovl, panel: body, close, content, head };
  }
  function confirm(title, msg, onYes, opts) {
    const o = opts || {};
    const m = modal(title, null, { lock: true });
    const body = h("div", null,
      h("div", { style: { textAlign: "center", padding: "6px 4px 14px", color: "var(--dim)", fontSize: "14px" } }, msg),
      h("div", { style: { display: "flex", gap: "10px" } },
        h("button", { class: "btn grow", on: { click: () => m.close() } }, "取消"),
        h("button", { class: "btn " + (o.danger ? "danger" : "gold") + " grow", on: { click: () => { m.close(); onYes && onYes(); } } }, o.okText || "確定")));
    m.panel.appendChild(body);
    return m;
  }
  function buyRow(label, iconName, cost, onBuy, extra) {
    return h("div", { class: "row" },
      icon(iconName, 26),
      h("div", { class: "grow" }, h("div", { style: { fontWeight: 800, fontSize: 14 } }, label), extra || null),
      h("button", { class: "btn gold sm", on: { click: onBuy } }, cost));
  }
  return { h, icon, stars, rarityCls, rarityBg, toast, modal, confirm, buyRow };
})();
