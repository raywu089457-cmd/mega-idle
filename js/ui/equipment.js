/* 放置王國 MEGA IDLE — equipment screen: inventory, item modal, crafting, gems (slice B2 owns) */
"use strict";
MG.ui = MG.ui || {};
MG.ui.equipment = (function () {
  const S = () => MG.game.state;
  const EQ = () => MG.sys.equipment;
  const ED = () => MG.data.equipment;
  const STAT_LABEL = { atk: "攻擊", def: "防禦", hp: "生命", crit: "暴擊" };
  let root, gridEl, tab = "all", tabsEl;

  function isGem(i) { return !!ED().GEMS[i.defId.split("_")[0]]; }
  function tabItems() {
    const st = S();
    const items = st.inventory.items;
    if (tab === "all") return items; // 全部 shows everything, incl. gems (counter matches grid)
    const eq = items.filter(i => !isGem(i));
    if (tab === "weapon") return eq.filter(i => EQ().slotOf(i) === "weapon");
    if (tab === "armor") return eq.filter(i => ["helmet", "armor", "boots"].includes(EQ().slotOf(i)));
    if (tab === "acc") return eq.filter(i => ["necklace", "ring", "charm"].includes(EQ().slotOf(i)));
    return eq;
  }
  function gems() {
    return S().inventory.items.filter(isGem);
  }
  function eligibleHunter(h, item) {
    const slot = EQ().slotOf(item);
    if (slot !== "weapon") return true;
    return !item.wtype || item.wtype === MG.config.CLASS_WEAPONS[h.cls];
  }
  // 與現有裝備的數值差（crit 以百分比點計）
  function statDelta(cur, item) {
    const A = cur ? EQ().itemStats(cur) : { atk: 0, def: 0, hp: 0, crit: 0 };
    const B = EQ().itemStats(item);
    const out = [];
    for (const k of ["atk", "def", "hp", "crit"]) {
      const d = Math.round(((B[k] || 0) - (A[k] || 0)) * 100) / 100;
      if (d !== 0) out.push({ label: STAT_LABEL[k], d, crit: k === "crit" });
    }
    return out;
  }
  function fmtDelta(d, crit) {
    const v = crit ? (d * 100).toFixed(1) + "%" : MG.util.fmt(d);
    return (d > 0 ? "+" : "") + v;
  }
  function deltaText(delta) {
    return delta.map(dl => dl.label + " " + fmtDelta(dl.d, dl.crit)).join(" ／ ");
  }
  function deltaClass(delta) {
    const sum = delta.reduce((a, dl) => a + dl.d, 0);
    return sum > 0 ? "var(--good, #7ee787)" : sum < 0 ? "#ff6b6b" : "var(--dim)";
  }
  function cell(item) {
    const slot = EQ().slotOf(item);
    const tierCol = ED().TIER_COLORS[Math.min(9, Math.max(0, item.tier - 1))];
    const glow = item.tier >= 7 ? { boxShadow: "0 0 9px " + tierCol + "55" } : {};
    const cellEl = MG.ui.dom.h("div", {
      class: "rar-bg" + item.rarity,
      style: Object.assign({
        position: "relative", aspectRatio: "1", borderRadius: 10,
        border: "2px solid " + tierCol,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
      }, glow),
      on: { click: () => openItem(item) }
    },
      MG.ui.dom.icon("icon_" + slot, 24));
    // 穿戴中標記：顯示被哪位英雄穿上
    const st0 = S();
    const wearer = st0.hunters.find(h => h.equip && h.equip[slot] === item.uid);
    if (wearer) {
      cellEl.appendChild(MG.ui.dom.h("div", { style: { position: "absolute", bottom: 2, left: 2, right: 2, fontSize: 8, fontWeight: 800, color: "#3a2a00", background: "rgba(255,209,102,0.92)", borderRadius: 5, padding: "1px 3px", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, wearer.name + " 穿戴中"));
    }
    // 強化徽章
    if (item.enhance > 0) cellEl.appendChild(MG.ui.dom.h("div", { style: { position: "absolute", top: 2, right: 3, fontSize: 9, fontWeight: 900, color: "#3a2a00", background: "linear-gradient(180deg,#ffe08a,#ffb35c)", borderRadius: 7, padding: "0 4px", lineHeight: "13px" } }, "+" + item.enhance));
    // 套裝徽章
    if (item.set) {
      const sc = ED().SET_COLORS[item.set] || "var(--gold)";
      cellEl.appendChild(MG.ui.dom.h("div", { style: { position: "absolute", top: 2, left: 3, fontSize: 8, fontWeight: 900, color: "#fff", background: sc, borderRadius: 5, padding: "0 3px", lineHeight: "13px", opacity: 0.95 } }, "套"));
    }
    // 插槽點：已鑲寶石為實心，空格為空心
    const socks = item.gems || [];
    if (socks.length) {
      cellEl.appendChild(MG.ui.dom.h("div", { style: { position: "absolute", bottom: 3, left: 3, display: "flex", gap: 3 } },
        socks.map((g, i) => MG.ui.dom.h("div", {
          style: {
            width: 7, height: 7, borderRadius: "50%",
            background: g ? "#ffd166" : "transparent",
            border: "1px solid " + (g ? "#ffd166" : "#6a6f96")
          }
        }))));
    }
    if (item.qty && item.qty > 1) cellEl.appendChild(MG.ui.dom.h("div", { style: { position: "absolute", bottom: 1, right: 4, fontSize: 10, fontWeight: 900 } }, "x" + item.qty));
    return cellEl;
  }
  function gemCell(g) {
    const kind = g.defId.split("_")[0];
    const gd = ED().GEMS[kind];
    const effect = gd.desc + " +" + (gd.stat === "crit" ? Math.round(gd.val(g.tier) * 100) + "%" : Math.round(gd.val(g.tier)));
    return MG.ui.dom.h("div", {
      style: { position: "relative", aspectRatio: "1", borderRadius: 10, border: "2px solid var(--gold2)", background: "linear-gradient(160deg,var(--panel2),#191c36)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
      on: { click: () => MG.ui.dom.toast(gd.name + "：" + effect, "", "gem_" + kind) }
    }, MG.ui.dom.icon("gem_" + kind, 24),
      MG.ui.dom.h("div", { style: { position: "absolute", bottom: 2, right: 4, fontSize: 9, fontWeight: 900, color: "var(--gold)" } },
        "T" + g.tier + ((g.qty || 1) > 1 ? " x" + g.qty : "")));
  }
  // 效能：2Hz refresh 全量重建 200 格（186ms 桌面/手機更重）→ 狀態簽名沒變就跳過
  let gridSig = "", lastGridAt = 0;
  function gridSignature() {
    const st = S();
    let s = st.inventory.items.length + "|" + tab;
    for (const it of st.inventory.items) {
      s += "|" + it.uid + ":" + it.tier + ":" + it.rarity + ":" + (it.enhance || 0)
        + ":" + (it.set || "") + ":" + (it.qty || 1) + ":" + (it.gems ? it.gems.join("") : "");
    }
    // 穿戴標記（誰穿哪件）——cell() 會顯示穿戴者名字
    for (const h of st.hunters) {
      if (!h.equip) continue;
      for (const k in h.equip) if (h.equip[k]) s += "|W:" + h.equip[k] + "@" + h.id;
    }
    return s;
  }
  // renderGrid 無 gate：呼叫端（renderTab）已做簽名檢查，互動路徑（強化/分解/穿戴）需立即重建
  function renderGrid() {
    if (!gridEl) return;
    gridEl.innerHTML = "";
    const items = tabItems();
    if (!items.length) {
      gridEl.appendChild(MG.ui.dom.h("div", { class: "empty" }, "背包空空如也\n踏上副本之路，為夥伴尋覓神兵吧！"));
      return;
    }
    for (const it of items) gridEl.appendChild(isGem(it) ? gemCell(it) : cell(it));
  }
  function openItem(item) {
    const st = S();
    const rar = MG.config.RARITY[item.rarity - 1];
    const slot = EQ().slotOf(item);
    const m = MG.ui.dom.modal("", null, {});
    const head = MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 10 } },
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 16, color: rar.color } },
        EQ().nameOf(item), item.enhance > 0 ? " +" + item.enhance : ""),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } },
        MG.config.SLOT_NAMES[slot] + " · T" + item.tier + " · " + MG.ui.dom.stars(item.rarity) + " " + rar.name,
        slot === "weapon" ? " · " + (ED().WEAPON_TYPE_NAMES[item.wtype] || "") + "系" : ""),
      item.set ? MG.ui.dom.h("div", { style: { color: ED().SET_COLORS[item.set] || "var(--gold)", fontWeight: 800, fontSize: 12 } }, ED().sets[item.set].name) : null);
    const stats = MG.ui.dom.h("div", { style: { background: "var(--panel2)", borderRadius: 8, padding: 8, marginBottom: 8 } },
      EQ().displayStats(item).map(s => MG.ui.dom.h("div", { style: { fontWeight: 700 } }, s)),
      item.set ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 4, color: "var(--gold)" } },
        ED().sets[item.set].bonus["2"] + " ／ " + ED().sets[item.set].bonus["4"]) : null);
    // 與現有裝備比較
    const cmpBox = compareBox(item);
    // 插槽
    const socketBox = MG.ui.dom.h("div", { style: { marginBottom: 8 } });
    if (item.gems && item.gems.length) {
      const filled = item.gems.filter(Boolean).length;
      socketBox.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 4 } },
        "寶石插槽 " + filled + "/" + item.gems.length + "："));
      const rowEl = MG.ui.dom.h("div", { style: { display: "flex", gap: 6 } });
      item.gems.forEach((g, idx) => {
        rowEl.appendChild(MG.ui.dom.h("div", {
          style: { width: 36, height: 36, borderRadius: 8, border: "2px dashed " + (g ? "var(--gold)" : "var(--line)"), background: "var(--panel2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
          on: { click: () => g ? removeGem(item, idx, m) : pickGem(item, idx, m) }
        }, g ? MG.ui.dom.icon("gem_" + g.split("_")[0], 20) : MG.ui.dom.icon("icon_plus", 16)));
      });
      socketBox.appendChild(rowEl);
    }
    // 強化預覽 + 動作列
    const eff = MG.sys.buildings.effects();
    const prev = EQ().previewEnhance(item);
    const canEnh = EQ().canEnhance(item);
    const actions = MG.ui.dom.h("div", null);
    if (!prev.atMax) {
      actions.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginBottom: 4, textAlign: "center" } },
        "下一級（+" + (item.enhance + 1) + "）：", prev.stats.length ? MG.ui.dom.h("span", { style: { color: "#7ee787", fontWeight: 700 } }, prev.stats.join(" ／ ")) : "屬性達上限"));
    }
    actions.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 8 } },
      MG.ui.dom.h("button", {
        class: "btn sm " + (canEnh ? "gold" : ""), style: { flex: 1 }, disabled: !canEnh,
        on: { click: () => { if (EQ().enhance(item)) { m.close(); openItem(item); renderGrid(); } else MG.ui.dom.toast("強化條件不足：金幣或鐵匠鋪等級不夠", "bad", "icon_hammer"); } }
      }, MG.ui.dom.icon("icon_hammer", 14),
        item.enhance >= MG.config.MAX_ITEM_LVL ? "已達上限"
          : canEnh ? "強化 +" + MG.util.fmt(prev.cost) + "金"
          : "強化（差 " + MG.util.fmt(prev.cost - st.currencies.gold) + "金）"),
      MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1 }, on: { click: () => { pickHunter(item, m); } } }, "穿戴給英雄"),
      MG.ui.dom.h("button", { class: "btn sm danger", style: { flex: 1 }, on: { click: () => doDismantle(item, m) } }, "分解")));
    m.panel.appendChild(MG.ui.dom.h("div", null, head, stats, cmpBox, socketBox, actions));
  }
  function doDismantle(item, m) {
    MG.ui.dom.confirm("分解裝備", "分解「" + EQ().nameOf(item) + "」？\n可獲得素材與金幣（稀有度與強化等級皆計入）。", () => {
      const r = EQ().dismantle(item);
      const mats = Object.entries(r.mats || {}).map(([k, n]) => n > 0 ? MG.config.MATS[k].name + "×" + n : null).filter(Boolean).join(" ・ ");
      MG.ui.dom.toast("分解完成：+" + MG.util.fmt(r.gold) + " 金" + (mats ? " ・ " + mats : ""), "", "icon_hammer");
      m.close(); renderGrid();
    });
  }
  // 與各英雄現有裝備的比較；取第一位可裝備且有裝備的英雄
  function compareBox(item) {
    const st = S();
    const slot = EQ().slotOf(item);
    const eligibles = st.hunters.filter(h => eligibleHunter(h, item));
    if (slot === "weapon" && eligibles.length === 0) {
      const need = item.wtype && ED().WEAPON_CLASS[item.wtype];
      return MG.ui.dom.h("div", { style: { background: "var(--panel2)", borderRadius: 8, padding: 8, marginBottom: 8, fontSize: 11 } },
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginBottom: 2 } }, "職業限制"),
        need ? "僅限「" + need + "」使用此武器" : "此武器與現有英雄職業皆不相符");
    }
    const withEquip = eligibles.filter(h => h.equip[slot]);
    if (!withEquip.length) {
      return MG.ui.dom.h("div", { style: { background: "var(--panel2)", borderRadius: 8, padding: 8, marginBottom: 8, fontSize: 11 } },
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginBottom: 2 } }, "與現有裝備比較"),
        eligibles.length ? "尚無英雄裝備此部位" : "尚無可裝備的英雄");
    }
    const h = withEquip[0];
    const curItem = st.inventory.items.find(i => i.uid === h.equip[slot]);
    const delta = statDelta(curItem, item);
    return MG.ui.dom.h("div", { style: { background: "var(--panel2)", borderRadius: 8, padding: 8, marginBottom: 8, fontSize: 11 } },
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginBottom: 2 } },
        "與「" + h.name + "」現有裝備比較（" + (curItem ? EQ().nameOf(curItem) : "無") + "）"),
      MG.ui.dom.h("div", { style: { fontWeight: 800, color: deltaClass(delta) } }, delta.length ? deltaText(delta) : "數值持平"));
  }
  function removeGem(item, idx, m) {
    const st = S();
    const g = item.gems[idx];
    if (!g) return;
    EQ().addGem(g);
    item.gems[idx] = null;
    m.close(); openItem(item); renderGrid();
  }
  function pickGem(item, idx, m) {
    const st = S();
    const gs = gems().filter(g => (g.qty || 1) > 0);
    if (!gs.length) { MG.ui.dom.toast("沒有寶石，可在寶石工坊融合取得", "bad", "gem_ruby"); return; }
    const gm = MG.ui.dom.modal("鑲嵌寶石", null, {});
    for (const g of gs) {
      const gd = ED().GEMS[g.defId.split("_")[0]];
      gm.panel.appendChild(MG.ui.dom.h("div", { class: "row", on: { click: () => {
        EQ().socketGem(item, idx, g.defId);
        g.qty = (g.qty || 1) - 1;
        if (g.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== g.uid);
        gm.close(); m.close(); openItem(item); renderGrid();
      } } },
        MG.ui.dom.icon("gem_" + g.defId.split("_")[0], 22),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, gd.name + " T" + g.tier),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, gd.desc + " +" + (gd.stat === "crit" ? Math.round(gd.val(g.tier) * 100) + "%" : Math.round(gd.val(g.tier))))),
        MG.ui.dom.h("span", { class: "sub" }, "x" + (g.qty || 1))));
    }
  }
  function pickHunter(item, m) {
    const st = S();
    const slot = EQ().slotOf(item);
    const hm = MG.ui.dom.modal("穿戴給哪位英雄？", null, {});
    if (!st.hunters.length) { hm.panel.appendChild(MG.ui.dom.h("div", { class: "empty" }, "酒館尚無英雄\n先前往酒館招募夥伴吧！")); hm.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => hm.close() } }, "關閉")); return; }
    for (const h of st.hunters) {
      const cls = MG.data.hunters.classes[h.cls];
      if (!eligibleHunter(h, item)) continue;
      const cur = h.equip[slot];
      const curItem = cur ? st.inventory.items.find(i => i.uid === cur) : null;
      const delta = statDelta(curItem, item);
      hm.panel.appendChild(MG.ui.dom.h("div", { class: "row", on: { click: () => {
        EQ().equipToHunter(h, item);
        hm.close(); m && m.close(); renderGrid();
      } } },
        MG.ui.dom.icon(h.sprite || cls.icon, 24),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, h.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, cls.name)),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, curItem ? "目前：" + EQ().nameOf(curItem) : "目前：無"),
          delta.length ? MG.ui.dom.h("div", { style: { fontSize: 10, fontWeight: 700, color: deltaClass(delta) } }, "比較：" + deltaText(delta)) : null),
        MG.ui.dom.h("span", { class: "sub" }, "戰力 " + MG.util.fmt(MG.sys.hunters.power(h)))));
    }
  }
  /* crafting */
  function renderCraft() {
    const st = S();
    const box = MG.ui.dom.h("div", null);
    const maxTier = st.stats.maxTierReached || 1;
    const recipes = ED().RECIPES.filter(r => r.unlockTier <= maxTier);
    if (!recipes.length) box.appendChild(MG.ui.dom.h("div", { class: "empty" }, "尚未解鎖配方\n推進副本區域，鐵匠的巧手將為你揭曉"));
    for (const r of recipes) {
      const can = EQ().recipeAvailable(r);
      const goldOk = st.currencies.gold >= r.cost.gold;
      const mats = Object.entries(r.cost.mats || {}).map(([mk, n]) => {
        const have = st.mats[mk] || 0;
        const ok = have >= n;
        return MG.ui.dom.h("span", { style: ok ? {} : { color: "#ff6b6b", fontWeight: 700 } }, MG.config.MATS[mk].name + " " + have + "/" + n);
      });
      box.appendChild(MG.ui.dom.h("div", { class: "row" },
        MG.ui.dom.icon("icon_" + r.slot, 24),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, r.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "T" + r.tier + " · " + MG.config.RARITY[r.minRar - 1].name + "以上")),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } },
            MG.ui.dom.h("span", { style: goldOk ? {} : { color: "#ff6b6b", fontWeight: 700 } }, "金幣 " + MG.util.fmt(r.cost.gold)), " ・ ", mats)),
        MG.ui.dom.h("button", { class: "btn sm " + (can ? "gold" : ""), disabled: !can, on: { click: () => { const made = EQ().craft(r); renderCraft(); if (made) pickHunter(made, null); } } }, "製作")));
    }
    // 下一配方解鎖提示
    const next = ED().RECIPES.filter(r => r.unlockTier > maxTier).sort((a, b) => a.unlockTier - b.unlockTier)[0];
    box.appendChild(MG.ui.dom.h("div", { class: "sub", style: { padding: "2px 4px 8px", fontSize: 10, color: "var(--gold)" } },
      next ? "下一配方：抵達第 " + next.unlockTier + " 區域後解鎖（" + next.name + "）" : "已解鎖全部分解配方"));
    // gem fusion
    box.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "寶石融合")));
    const gemWorks = st.buildings.gemworks || 0;
    if (gemWorks < 1) {
      box.appendChild(MG.ui.dom.h("div", { class: "sub", style: { padding: "0 4px", fontSize: 11 } }, "建造並升級「寶石工坊」以解鎖寶石融合（3 顆同階寶石 → 1 顆更高階）"));
    } else {
      const byKind = {};
      for (const g of gems()) byKind[g.defId] = (byKind[g.defId] || 0) + (g.qty || 1);
      const entries = Object.entries(byKind);
      if (!entries.length) box.appendChild(MG.ui.dom.h("div", { class: "sub", style: { padding: "0 4px", fontSize: 11 } }, "還沒有寶石，擊敗首領或於出戰中拾獲"));
      for (const [defId, n] of entries) {
        const [kind, tier] = defId.split("_");
        const gd = ED().GEMS[kind];
        const can = n >= 3 && tier < 10;
        box.appendChild(MG.ui.dom.h("div", { class: "row" },
          MG.ui.dom.icon("gem_" + kind, 22),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, gd.name + " T" + tier),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "持有 " + n + " 顆" + (can ? "" : (tier >= 10 ? "（已達最高階）" : "（尚缺 " + (3 - n) + " 顆）")))),
          MG.ui.dom.h("button", { class: "btn sm " + (can ? "gold" : ""), disabled: !can, on: { click: () => {
            const out = EQ().gemFuse(defId, 3);
            if (out) { MG.ui.dom.toast("融合成功：" + gd.name + " T" + out.tier + "！", "good", "gem_" + kind); renderCraft(); }
          } } }, "融合")));
      }
    }
    return box;
  }
  const screen = {
    render(root) {
      root.innerHTML = "";
      bulkBtnShown = false; // 每次重建頁面重置，批量拆解按鈕重新掛載
      tabsEl = MG.ui.dom.h("div", { class: "list-scroll", style: { padding: "10px 10px 4px" } });
      const tabDefs = [["all", "全部"], ["weapon", "武器"], ["armor", "防具"], ["acc", "飾品"], ["gem", "寶石"], ["craft", "合成"]];
      const tabChips = tabDefs.map(([id, label]) => MG.ui.dom.h("div", { class: "chip" + (tab === id ? " on" : ""), on: { click: () => { tab = id; syncTabChips(); renderTab(); } } }, label));
      tabChips.forEach(c => tabsEl.appendChild(c));
      const syncTabChips = () => tabChips.forEach((c, i) => c.className = "chip" + (tab === tabDefs[i][0] ? " on" : ""));
      root.appendChild(tabsEl);
      const body = MG.ui.dom.h("div", { style: { padding: "4px 10px 90px" } });
      root.appendChild(body);
      gridEl = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 } });
      body.appendChild(gridEl);
      capEl = MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, textAlign: "center", marginTop: 6 } });
      body.appendChild(capEl);
      renderTab(true); // 畫面重建：強制渲染（簽名節流只屬於 2Hz 週期刷新）
    },
    refresh() { renderTab(); }
  };
  let capEl;
  function renderTab(force) {
    if (!gridEl) return;
    if (!force) {
      const sig = gridSignature();
      if (sig === gridSig && Date.now() - lastGridAt < 1000) {
        // 狀態沒變 → 跳過全量重建（僅更新容量文字，成本 <0.01ms）
        capEl.textContent = "背包 " + S().inventory.items.length + " / " + EQ().inventoryCap();
        return;
      }
      gridSig = sig; lastGridAt = Date.now();
    }
    gridEl.innerHTML = "";
    if (tab === "craft") {
      const craftBox = renderCraft();
      gridEl.innerHTML = "";
      gridEl.appendChild(craftBox);
      capEl.textContent = "";
      return;
    }
    if (tab === "gem") {
      const gs = gems();
      if (!gs.length) { gridEl.appendChild(MG.ui.dom.h("div", { class: "empty" }, "尚未獲得寶石\n擊敗區域首領，或於寶石工坊融合 3 顆同階寶石")); }
      for (const g of gs) {
        const gd = ED().GEMS[g.defId.split("_")[0]];
        const effect = gd.desc + " +" + (gd.stat === "crit" ? Math.round(gd.val(g.tier) * 100) + "%" : Math.round(gd.val(g.tier)));
        gridEl.appendChild(MG.ui.dom.h("div", {
          style: { borderRadius: 10, border: "2px solid var(--line)", background: "var(--panel2)", padding: 8, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
          on: { click: () => MG.ui.dom.toast(gd.name + "：" + effect, "", "gem_" + g.defId.split("_")[0]) }
        },
          MG.ui.dom.icon("gem_" + g.defId.split("_")[0], 26),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontSize: 12, fontWeight: 800 } }, gd.name, MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9, marginLeft: 4 } }, "T" + g.tier)),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, effect)),
          MG.ui.dom.h("span", { class: "sub", style: { fontSize: 11 } }, "x" + (g.qty || 1))));
      }
      capEl.textContent = "";
      return;
    }
    renderGrid();
    capEl.textContent = "背包 " + S().inventory.items.length + " / " + EQ().inventoryCap();
    if (!bulkBtnShown) {
      bulkBtnShown = true;
      const wrap = MG.ui.dom.h("div", { style: { padding: "0 10px 6px", marginTop: 2 } });
      wrap.appendChild(MG.ui.dom.h("button", { class: "btn sm", style: { width: "100%" }, on: { click: openBulkDismantle } },
        MG.ui.dom.icon("icon_hammer", 13), "批量拆解（多選稀有度）"));
      gridEl.parentElement.insertBefore(wrap, gridEl);
    }
  }
  let bulkBtnShown = false;
  // 批量拆解：多選稀有度，一鍵拆解所有符合且未被穿戴的裝備
  function openBulkDismantle() {
    const st = S();
    const sel = new Set();
    const m = MG.ui.dom.modal("批量拆解", null, { icon: "icon_hammer" });
    const body = m.panel;
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } },
      "選擇要拆解的稀有度（可多選）：已穿戴的裝備不會被拆解。"));
    const chipRow = MG.ui.dom.h("div", { class: "list-scroll", style: { marginBottom: 8 } });
    const chips = MG.config.RARITY.map((r, i) => {
      const c = MG.ui.dom.h("div", { class: "chip", on: { click: () => { sel.has(r.id) ? sel.delete(r.id) : sel.add(r.id); sync(); } } },
        MG.ui.dom.stars(r.id), " " + r.name);
      return c;
    });
    chips.forEach(c => chipRow.appendChild(c));
    body.appendChild(chipRow);
    const countEl = MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 8 } }, "符合：0 件");
    body.appendChild(countEl);
    const go = MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, disabled: true,
      on: { click: () => {
        // 已穿戴（任何英雄）的裝備絕不拆解：批量操作不碰身上裝備
        const worn = new Set();
        for (const h of st.hunters || []) for (const s in (h.equip || {})) if (h.equip[s]) worn.add(h.equip[s]);
        const targets = st.inventory.items.filter(it =>
          !it.defId || !it.defId.startsWith("gem_")) // 排除寶石
          .filter(it => sel.has(it.rarity))
          .filter(it => !worn.has(it.uid));
        let gold = 0, mats = {}, n = 0;
        for (const it of targets) {
          const ok = MG.sys.equipment.dismantle(it);
          if (ok) { n++; gold += Math.floor(10 * Math.pow(1.4, it.tier) * it.rarity * (1 + 0.15 * (it.enhance || 0))); }
        }
        MG.ui.dom.toast(n > 0 ? "拆解 " + n + " 件裝備，獲得 " + MG.util.fmt(gold) + " 金與素材！" : "沒有可拆解的裝備", n > 0 ? "good" : "bad", "icon_hammer");
        m.close();
        renderTab();
      } } }, "確認拆解");
    body.appendChild(go);
    function sync() {
      chips.forEach((c, i) => c.className = "chip" + (sel.has(MG.config.RARITY[i].id) ? " on" : ""));
      const worn = new Set();
      for (const h of st.hunters || []) for (const s in (h.equip || {})) if (h.equip[s]) worn.add(h.equip[s]);
      const n = st.inventory.items.filter(it => !(it.defId || "").startsWith("gem_") && sel.has(it.rarity) && !worn.has(it.uid)).length;
      countEl.textContent = "符合：" + n + " 件" + (n ? "（拆解後可得金幣與素材）" : "");
      go.disabled = n === 0;
    }
  }
  MG.ui.screens.register("equipment", screen);
  return screen;
})();
