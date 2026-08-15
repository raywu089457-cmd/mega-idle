/* 放置王國 MEGA IDLE — utilities */
"use strict";
MG.util = (function () {
  const U = {};
  U.uid = (function () { let n = 1; return function () { return (Date.now().toString(36) + "_" + (n++).toString(36)); }; })();
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.rint = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.chance = p => Math.random() < p;
  U.clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.now = () => Date.now();
  // v174 週末雙倍判定（本地時區星期六/日）
  U.isWeekend = function () {
    return (MG.config.WEEKEND_DAYS || [6, 0]).includes(new Date().getDay());
  };
  // 戰鬥進行中鎖定：有傳英雄時只鎖「參戰（派遣中）」英雄；無英雄（編隊編輯）時全鎖
  U.fightGuard = function () { return false; }; // v136：戰鬥鎖取消——戰鬥中任何編輯都允許且即時生效;
  /* zh-TW number formatting: 1.2萬 / 3.4億 / 9.9兆 / 京 / 垓 / 秭 */
  const UNITS = [
    [1e28, "秭"], [1e24, "垓"], [1e20, "京"], [1e16, "兆"], [1e8, "億"], [1e4, "萬"]
  ];
  U.fmt = function (n) {
    n = Math.floor(n);
    if (!isFinite(n)) return "∞";
    if (n < 0) return "-" + U.fmt(-n);
    if (n < 1e4) return String(n);
    for (const [v, s] of UNITS) {
      if (n >= v) {
        const d = n / v;
        return String(d >= 100 ? Math.floor(d) : d >= 10 ? d.toFixed(1) : d.toFixed(2)).replace(/\.0+$/, "") + s;
      }
    }
    return String(n);
  };
  U.fmtTime = function (ms) {
    ms = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(ms / 3600), m = Math.floor((ms % 3600) / 60), s = ms % 60;
    if (h > 0) return h + "小時" + m + "分";
    if (m > 0) return m + "分" + s + "秒";
    return s + "秒";
  };
  U.fmtClock = function (ms) {
    ms = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(ms / 3600), m = Math.floor((ms % 3600) / 60), s = ms % 60;
    const p = n => (n < 10 ? "0" : "") + n;
    return (h > 0 ? p(h) + ":" : "") + p(m) + ":" + p(s);
  };
  U.today = function () { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  U.month = function () { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
  U.esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  U.rr = function (o) { // random range {min,max} or number
    return (typeof o === "number") ? o : U.rand(o.min, o.max);
  };
  U.groupBy = function (arr, key) { const m = new Map(); for (const it of arr) { const k = it[key]; if (!m.has(k)) m.set(k, []); m.get(k).push(it); } return m; };
  return U;
})();
