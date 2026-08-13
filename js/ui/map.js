/* 放置王國 MEGA IDLE — 世界大地圖（v160 實驗：TheoTown 風等角菱形區塊）
   頂欄地圖鈕開啟；10 區等角排列、解鎖/鎖定顯示、當前區脈動、點區跳該區副本。
   解鎖規則與副本頁一致：idx <= stats.maxRegionReached。 */
"use strict";
MG.ui = MG.ui || {};
MG.ui.map = (function () {
  const REGIONS = () => MG.data.monsters.regions;
  const S = () => MG.game.state;
  const W = 480, H = 360;          // CSS 座標系
  const A = 52, B = 26;            // 菱形半寬/半高（區塊 104×52）
  const CX = 240, CY = 138;        // 第 0 區中心
  // 線性 10 區 → 等角 4 列佈局（col,row）
  const POS = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [0, 3]];
  let canvas, ctx, rafId = 0, returnId = "kingdom";

  function isoX(c, r) { return CX + (c - r) * A; }
  function isoY(c, r) { return CY + (c + r) * B; }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let rr = (n >> 16) & 255, gg = (n >> 8) & 255, bb = n & 255;
    if (amt >= 0) { rr += (255 - rr) * amt; gg += (255 - gg) * amt; bb += (255 - bb) * amt; }
    else { rr *= 1 + amt; gg *= 1 + amt; bb *= 1 + amt; }
    return "rgb(" + (rr | 0) + "," + (gg | 0) + "," + (bb | 0) + ")";
  }

  function pathD(cx, cy, a, b) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - b); ctx.lineTo(cx + a, cy); ctx.lineTo(cx, cy + b); ctx.lineTo(cx - a, cy);
    ctx.closePath();
  }
  function diamond(cx, cy, a, b, fill) {
    pathD(cx, cy, a, b);
    ctx.fillStyle = fill; ctx.fill();
  }
  function diamondStroke(cx, cy, a, b, color, lw) {
    pathD(cx, cy, a, b);
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
  }

  function draw(t) {
    const st = S();
    const rs = REGIONS();
    const maxReached = st.stats.maxRegionReached || 0;
    const cur = st.hunt.region;
    // 星夜背景（與村莊呼應）
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#232642"); g.addColorStop(1, "#141524");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 30; i++) ctx.fillRect((i * 67 + 13) % W, (i * 41 + 7) % (H - 40), 2, 2);
    // 解鎖路徑連線（線性順序）
    for (let i = 0; i < rs.length - 1; i++) {
      const a = POS[i], b = POS[i + 1];
      const unlocked = i < maxReached;
      ctx.strokeStyle = unlocked ? "rgba(255,209,102,0.55)" : "rgba(58,63,102,0.6)";
      ctx.lineWidth = unlocked ? 3 : 2;
      ctx.setLineDash(unlocked ? [] : [5, 4]);
      ctx.beginPath();
      ctx.moveTo(isoX(a[0], a[1]), isoY(a[0], a[1]) + B + 8);
      ctx.lineTo(isoX(b[0], b[1]), isoY(b[0], b[1]) - B - 8);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // 區塊
    const pulse = 0.5 + 0.5 * Math.sin((t || 0) * 0.004);
    for (let i = 0; i < rs.length; i++) {
      const r = rs[i];
      const pos = POS[i];
      const x = isoX(pos[0], pos[1]), y = isoY(pos[0], pos[1]);
      const theme = MG.config.REGION_THEME[r.palIdx] || MG.config.REGION_THEME[0];
      const unlocked = i <= maxReached;
      diamond(x, y, A + 4, B + 2, "rgba(0,0,0,0.55)");  // 外黑描邊（像素立體）
      if (unlocked) {
        diamond(x, y, A, B, theme.ground);
        diamond(x, y, A - 9, B - 4, shade(theme.ground, 0.12));
        diamondStroke(x, y, A, B, theme.accent, 2);
        if (i === cur) {  // 當前區金色脈動
          ctx.globalAlpha = 0.4 + pulse * 0.5;
          diamondStroke(x, y, A + 6, B + 3, "#ffd166", 3);
          ctx.globalAlpha = 1;
        }
        // 名稱 + 進度
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.lineWidth = 3; ctx.strokeStyle = "rgba(8,10,22,0.9)";
        ctx.fillStyle = i === cur ? "#ffd166" : "#f2f4ff";
        ctx.strokeText(r.name, x, y + B + 16);
        ctx.fillText(r.name, x, y + B + 16);
        const prog = (st.stats.maxStageByRegion && st.stats.maxStageByRegion[i]) || 0;
        ctx.font = "10px monospace";
        ctx.fillStyle = prog >= 10 ? "#ffd166" : "#9aa0c4";
        ctx.fillText("討伐 " + prog + "/10", x, y + B + 28);
      } else {
        diamond(x, y, A, B, "#1a1c30");
        diamondStroke(x, y, A, B, "#3a3f66", 1.5);
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#6b7199";
        ctx.fillText("???", x, y + 5);
        MG.ui.render.draw(ctx, "icon_lock", x - 8, y - B + 2, 1, { scale: 1, t: 0 });
      }
    }
  }

  function hit(x, y) {
    for (let i = REGIONS().length - 1; i >= 0; i--) {
      const pos = POS[i];
      const dx = Math.abs(x - isoX(pos[0], pos[1])), dy = Math.abs(y - isoY(pos[0], pos[1]));
      if (dx / A + dy / B <= 1) return i;
    }
    return -1;
  }

  function clickRegion(idx) {
    const st = S();
    const rs = REGIONS();
    if (idx > (st.stats.maxRegionReached || 0)) {
      MG.ui.dom.toast("尚未解鎖：擊敗「" + rs[idx - 1].name + "」的守關 BOSS 才能前往", "bad", "icon_lock");
      return;
    }
    const F = MG.sys.battle.get();
    if (F && F.phase === "fight") {
      MG.ui.dom.toast("戰鬥進行中！等當前戰鬥結束後再切換地圖", "bad", "icon_sword");
      return;
    }
    if (idx !== st.hunt.region) {
      st.hunt.region = idx; st.hunt.stage = Math.min(st.hunt.stage, 10);
      st.hunt.wipeStreak = 0;
      MG.sys.battle.reset();
    }
    MG.ui.screens.show("hunt");
  }

  function loop(t) {
    draw(t);
    rafId = requestAnimationFrame(loop);
  }

  function open() {
    const cur = MG.ui.screens.currentId;
    returnId = (cur && cur !== "map") ? cur : "kingdom";
    MG.ui.screens.show("map");
  }

  const screen = {
    render(root) {
      root.innerHTML = "";
      // 標題
      root.appendChild(MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 4px" } },
        MG.ui.dom.h("div", { class: "title", style: { fontSize: 18 } }, "世界地圖"),
        MG.ui.dom.h("button", { class: "btn sm", on: { click: () => MG.ui.screens.show(returnId) } }, "返回")));
      root.appendChild(MG.ui.dom.h("div", { class: "sub", style: { padding: "0 14px 8px" } },
        "點擊區域前往討伐 · 擊敗守關 BOSS 解鎖下一個地區"));
      // 畫布
      const wrap = MG.ui.dom.h("div", { style: { position: "relative", margin: "0 10px", border: "2px solid #000", outline: "1px solid var(--line)", outlineOffset: -1, borderRadius: 0, overflow: "hidden" } });
      canvas = document.createElement("canvas");
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = "100%"; canvas.style.height = (H * (460 / W)) + "px";
      canvas.style.display = "block";
      canvas.style.imageRendering = "pixelated";
      ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      wrap.appendChild(canvas);
      root.appendChild(wrap);
      canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (W / rect.width);
        const y = (e.clientY - rect.top) * (H / rect.height);
        const idx = hit(x, y);
        if (idx >= 0) clickRegion(idx);
      });
      // 底部說明
      root.appendChild(MG.ui.dom.h("div", { style: { padding: "10px 16px", fontSize: 12, color: "var(--dim)", lineHeight: 1.7 } },
        MG.ui.dom.h("div", null, "· 金色外框＝目前所在區域；灰底「???」＝尚未解鎖"),
        MG.ui.dom.h("div", null, "· 討伐進度 10/10＝已擊敗該區守關 BOSS")));
    },
    onShow() { draw(performance.now()); cancelAnimationFrame(rafId); rafId = requestAnimationFrame(loop); },
    onHide() { cancelAnimationFrame(rafId); rafId = 0; }
  };

  screen.open = open;
  MG.ui.screens.register("map", screen);
  return screen;
})();
