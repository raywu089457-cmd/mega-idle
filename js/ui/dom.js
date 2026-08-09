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
  function toast(msg, cls, ic) {
    const root = document.getElementById("toasts");
    if (!root) return;
    const t = h("div", { class: "toast" + (cls ? " " + cls : ""), style: { zIndex: 200 + (toastId++ % 50) } },
      ic ? icon(ic, 14) : null, h("span", null, msg));
    root.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }
  function modal(title, content, opts) {
    const o = opts || {};
    const root = document.getElementById("overlay-root");
    const ovl = h("div", { class: "ovl", on: { click: () => { if (!o.lock) close(); } } });
    const panel = h("div", { class: "modal" + (o.wide ? " wide" : ""), on: { click: e => e.stopPropagation() } });
    if (title) panel.appendChild(h("div", { class: "m-title" }, o.icon ? icon(o.icon, 20) : null, h("span", null, title)));
    if (!o.noClose) panel.appendChild(h("div", { class: "m-x", on: { click: close } }, "✕"));
    panel.appendChild(content instanceof Node ? content : h("div", { html: content }));
    ovl.appendChild(panel);
    root.appendChild(ovl);
    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      ovl.remove();
      if (o.onClose) o.onClose();
    }
    return { el: ovl, panel, close, content };
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
