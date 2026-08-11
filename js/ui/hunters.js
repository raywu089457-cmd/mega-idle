/* 放置王國 MEGA IDLE — hunters screen: roster, recruit, detail modal (slice B1 owns) */
"use strict";
MG.ui = MG.ui || {};
MG.ui.hunters = (function () {
  const D = MG.data.hunters;
  const S = () => MG.game.state;
  let listEl, statusEl, filter = "all", sort = "power", recruitCdUntil = 0, cdTimer = null;
  let wanderEl = null, wanderRows = {}; // 流浪英雄區（招募後成為領地英雄）
  let view = "kingdom"; // kingdom=領地英雄 / wanderer=流浪英雄
  let listWrapEl = null, fabWrapEl = null, wanderWrapEl = null, viewBtnEls = null;

  function filtered() {
    const st = S();
    let list = st.hunters.slice();
    if (filter === "formation") list = list.filter(h => MG.sys.hunters.inFormation(h.id));
    else if (filter !== "all") list = list.filter(h => h.cls === filter);
    if (sort === "power") list.sort((a, b) => MG.sys.hunters.power(b) - MG.sys.hunters.power(a));
    else if (sort === "level") list.sort((a, b) => b.level - a.level || b.rarity - a.rarity);
    else if (sort === "rarity") list.sort((a, b) => b.rarity - a.rarity || MG.sys.hunters.power(b) - MG.sys.hunters.power(a));
    return list;
  }
  // 效能：2Hz refresh 全量重建 40 卡（54ms 桌面/138ms 手機）→ 狀態簽名沒變就跳過重建
  let listSig = "", lastListAt = 0;
  function listSignature() {
    const st = S();
    let s = st.hunters.length + "|" + filter + "|" + sort;
    for (const h of st.hunters) {
      // 不納入 hp：派遣中每 tick 變化，納入會讓每次 refresh 都重建
      s += "|" + h.id + ":" + h.level + ":" + (h.promoted || 0) + ":" + h.cls + ":" + (h.rarity || 1)
        + ":" + (h.equip ? Object.keys(h.equip).map(k => h.equip[k]).join(",") : "");
    }
    s += "|F:" + st.formation.join(",") + "|D:" + (st.hunt.dispatchIds || []).join(",") + "|R:" + ((st.hunt.restUntil || 0) > Date.now() ? 1 : 0);
    return s;
  }
  function hunterStatus(h) {
    const st = S();
    const dispatched = (st.hunt.dispatchIds || []).includes(h.id);
    if (!dispatched) return "";
    const resting = (st.hunt.restUntil || 0) > Date.now();
    return resting ? " · 💤 休息中" : " · ⚔ 派遣中";
  }
  function row(h) {
    const cls = MG.data.hunters.classes[h.cls];
    const inF = MG.sys.hunters.inFormation(h.id);
    const rowEl = MG.ui.dom.h("div", { class: "row", on: { click: () => openDetail(h.id) } },
      MG.ui.dom.h("div", { style: { position: "relative" } },
        MG.ui.dom.icon(h.sprite || cls.icon, 30),
        h.promoted > 0 ? MG.ui.dom.h("div", { style: { position: "absolute", bottom: "-3px", right: "-3px", fontSize: "9px", background: "var(--gold)", color: "#3a2500", borderRadius: "4px", padding: "0 2px", fontWeight: 900 } }, "+" + h.promoted) : null),
      MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: "14px" } },
          h.name,
          MG.ui.dom.h("span", { class: "rar" + h.rarity, style: { marginLeft: "5px", fontSize: "10px" } }, MG.ui.dom.stars(h.rarity))),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: "11px" } },
          cls.name + " · Lv " + h.level + " · 戰力 " + MG.util.fmt(MG.sys.hunters.power(h)) + hunterStatus(h))),
      MG.ui.dom.h("button", {
        class: "btn sm " + (inF ? "blue" : "green"),
        style: { padding: "4px 8px", minHeight: "32px" },
        on: { click: (e) => { e.stopPropagation(); toggleFormation(h); } }
      }, inF ? "移出" : "編入"));
    return rowEl;
  }
  function toggleFormation(h) {
    const st = S();
    if (MG.sys.hunters.inFormation(h.id)) {
      const idx = st.formation.indexOf(h.id);
      MG.sys.hunters.setFormationSlot(idx, null);
    } else {
      const slots = MG.sys.buildings.effects().formationSlots;
      let idx = st.formation.indexOf(null);
      if (idx === -1 || idx >= slots) { MG.ui.dom.toast("出戰人數已滿（升級酒館可增加）", "bad", "icon_formation"); return; }
      MG.sys.hunters.setFormationSlot(idx, h.id);
    }
    renderList();
  }
  function openDetail(id) {
    const st = S();
    const h = st.hunters.find(x => x.id === id);
    if (!h) return;
    const cls = D.classes[h.cls];
    const eff = MG.sys.hunters.effectiveStats(h);
    const base = MG.sys.hunters.baseStats(h);
    const m = MG.ui.dom.modal("", null, {});
    const iconEl = MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: "8px" } },
      MG.ui.dom.icon(h.sprite || cls.icon, 48),
      MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 900, fontSize: "17px", marginTop: "4px" } },
        MG.ui.dom.icon(cls.icon, 20),
        MG.ui.dom.h("span", null, h.name),
        MG.ui.dom.h("span", { class: "rar" + h.rarity, style: { fontSize: "12px" } }, MG.ui.dom.stars(h.rarity))),
      MG.ui.dom.h("div", { class: "sub" }, cls.name + " · Lv " + h.level + " · 突破 " + (h.promoted || 0) + " 階"),
      MG.ui.dom.h("div", { class: "sub", style: { color: MG.config.RARITY[h.rarity - 1].color, fontWeight: 700 } }, MG.config.RARITY[h.rarity - 1].name + "英雄"),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: "11px", marginTop: "2px", fontStyle: "italic" } }, "「" + cls.flavor + "」"));
    const expPct = Math.min(100, h.exp / MG.sys.hunters.expNeed(h) * 100);
    const expBar = MG.ui.dom.h("div", { style: { margin: "4px 0 8px" } },
      MG.ui.dom.h("div", { class: "pbar blue", style: { height: "8px" } }, MG.ui.dom.h("i", { style: { width: expPct + "%" } })),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px", textAlign: "center" } }, "經驗 " + MG.util.fmt(h.exp) + " / " + MG.util.fmt(MG.sys.hunters.expNeed(h))));
    // stats grid
    const statCell = (label, val, delta, color) => MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: "8px", padding: "6px 4px", textAlign: "center" } },
      MG.ui.dom.h("div", { style: { fontSize: "10px", color: "var(--dim)" } }, label),
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: "13px" } }, val),
      delta ? MG.ui.dom.h("div", { style: { fontSize: "9px", color: color || "var(--good)" } }, delta) : null);
    const statsGrid = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "10px" } },
      statCell("攻擊", Math.floor(eff.atk), "+" + Math.floor(Math.max(0, eff.atk - base.atk))),
      statCell("防禦", Math.floor(eff.def), "+" + Math.floor(Math.max(0, eff.def - base.def))),
      statCell("生命", Math.floor(eff.hp), "+" + Math.floor(Math.max(0, eff.hp - base.hp))),
      statCell("魔力", Math.floor(eff.mp), "+" + Math.floor(Math.max(0, eff.mp - base.mp))),
      statCell("攻速", eff.spd.toFixed(2) + "/秒", null),
      statCell("暴擊", Math.round(eff.crit * 100) + "%", null),
      statCell("戰力", MG.util.fmt(MG.sys.hunters.power(h)), null, "var(--gold)"));
    // next promotion preview
    const promoN = (h.promoted || 0) + 1;
    let promoBox;
    if (promoN <= D.promoLevels.length) {
      const pv = MG.sys.hunters.promoPreview(h);
      const costParts = [MG.util.fmt(pv.cost.gold) + " 金幣"];
      for (const mk in pv.cost.mats) costParts.push(MG.util.fmt(pv.cost.mats[mk]) + " " + ((MG.config.MATS[mk] || {}).name || mk));
      const needTxt = h.level < pv.needLv ? "需 Lv " + pv.needLv : "";
      const reason = !pv.can ? (h.level < pv.needLv ? "等級不足" : "資源不足") : "";
      promoBox = MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid " + (pv.can ? "var(--good)" : "var(--line)"), borderRadius: "8px", padding: "8px", marginBottom: "10px" } },
        MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
          MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: "12px", color: "var(--gold)" } }, "突破預覽 · " + (h.promoted || 0) + " 階 → " + promoN + " 階"),
          MG.ui.dom.h("span", { class: "sub", style: { fontSize: "10px" } }, "全屬性 +20%")),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px", marginTop: "4px" } }, "攻擊 +" + pv.atk + " · 防禦 +" + pv.def + " · 生命 +" + pv.hp),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px", marginTop: "2px" } },
          "消耗：" + costParts.join("、") + (needTxt ? " · " + needTxt : "") + (reason ? " · " + reason : "")),
        MG.ui.dom.h("div", { style: { fontSize: "9px", color: "var(--dim)", marginTop: "4px", lineHeight: 1.6 } },
          "階段等級需求：1 階 Lv10 → 2 階 Lv25 → 3 階 Lv50 → 4 階 Lv100 → 5 階 Lv150；達到該等級並備齊資源即可突破（升滿一階段才能突破下一階段）"));
    } else {
      promoBox = MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginBottom: "10px" } }, "已達最高突破階級，榮耀加身。");
    }
    // equip slots (tap empty slot opens the picker)
    const slotsRow = MG.ui.dom.h("div", { style: { display: "flex", gap: "5px", justifyContent: "center", marginBottom: "10px" } });
    for (const slot of MG.config.SLOTS) {
      const uid = h.equip[slot];
      const item = uid ? st.inventory.items.find(i => i.uid === uid) : null;
      const cell = MG.ui.dom.h("div", {
        style: {
          width: "40px", height: "40px", borderRadius: "8px", border: "2px solid " + (item ? MG.config.RARITY[item.rarity - 1].color : "var(--line)"),
          background: item ? "var(--panel2)" : "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
        },
        on: { click: () => pickEquip(h, slot) }
      },
        MG.ui.dom.icon(item ? slotIcon(item) : "icon_" + slot, 22),
        item && item.enhance > 0 ? MG.ui.dom.h("div", { style: { position: "absolute", top: "-6px", right: "-4px", fontSize: "9px", fontWeight: 900, color: "var(--gold)", background: "#14121f", borderRadius: "4px", padding: "0 2px" } }, "+" + item.enhance) : null);
      slotsRow.appendChild(cell);
    }
    // active set bonuses
    const cnt = MG.sys.hunters.setCounts(h);
    const setKeys = Object.keys(cnt);
    let setsBox = null;
    if (setKeys.length) {
      const box = MG.ui.dom.h("div", { style: { marginBottom: "8px" } });
      for (const sid of setKeys) {
        const set = MG.data.equipment.sets[sid];
        if (!set) continue;
        const nn = cnt[sid];
        const active = [];
        if (nn >= 2 && set.bonus[2]) active.push("2件：" + set.bonus[2]);
        if (nn >= 4 && set.bonus[4]) active.push("4件：" + set.bonus[4]);
        box.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "5px 8px", background: "var(--panel2)", borderRadius: "8px", marginBottom: "4px" } },
          MG.ui.dom.icon(set.icon, 16),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: "12px", color: "var(--gold)" } }, set.name + " " + nn + "/4"),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px" } }, active.length ? "已啟動：" + active.join("、") : "再收集 " + Math.max(2 - nn, 0) + " 件啟動套裝效果"))));
      }
      setsBox = MG.ui.dom.h("div", null,
        MG.ui.dom.h("div", { class: "section-h", style: { margin: "4px 2px 6px" } }, MG.ui.dom.h("span", { class: "t" }, "套裝效果")),
        box);
    }
    // skills
    const skillsBox = MG.ui.dom.h("div", null);
    const skUnlock = D.skillAtLevel;
    const nextSk = skUnlock.find(lv => h.level < lv);
    for (const sk of MG.sys.hunters.unlockedSkills(h)) {
      const def = D.skills[sk.id];
      skillsBox.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: "8px", alignItems: "center", padding: "5px 8px", background: "var(--panel2)", borderRadius: "8px", marginBottom: "4px" } },
        MG.ui.dom.icon(def.icon, 18),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: "12px" } }, def.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: "4px", fontSize: "10px" } }, "Lv " + sk.lvl)),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px" } }, def.desc))));
    }
    if (nextSk && MG.sys.hunters.unlockedSkills(h).length < D.classes[h.cls].skills.length) {
      skillsBox.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", fontSize: "10px", padding: "2px 0 6px" } },
        "英雄 Lv " + nextSk + " 解鎖下一個技能"));
    }
    // 補給行：手動補充 HP/MP（消耗藥水，補該英雄 50%）
    const potQty = defId => st.inventory.items.filter(i => i.defId === defId).reduce((a, i) => a + (i.qty === undefined ? 1 : i.qty), 0);
    const drinkTo = (defId, isHp, name) => {
      const item = st.inventory.items.find(i => i.defId === defId);
      if (!item || !item.qty) { MG.ui.dom.toast("沒有" + name + "，可從副本掉落或商店購買", "bad", defId); return; }
      item.qty = (item.qty || 1) - 1;
      if (item.qty <= 0) st.inventory.items = st.inventory.items.filter(i => i.uid !== item.uid);
      const max = MG.sys.hunters.effectiveStats(h)[isHp ? "hp" : "mp"];
      if (isHp) h.hp = Math.min(max, (h.hp === undefined ? max : h.hp) + Math.round(max * 0.5));
      else h.mp = Math.min(max, (h.mp === undefined ? max : h.mp) + Math.round(max * 0.5));
      MG.core.audio.SFX.potion();
      MG.ui.dom.toast(name + "：補 " + (isHp ? "HP" : "MP") + " 50%", "good", defId);
      refreshDetail(h.id, m);
    };
    const healRow = MG.ui.dom.h("div", { style: { display: "flex", gap: "8px", marginTop: "10px" } },
      MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1 }, on: { click: () => drinkTo("item_pot_hp", true, "生命藥水") } },
        MG.ui.dom.icon("icon_pot_hp", 14), "補血 x" + potQty("item_pot_hp")),
      MG.ui.dom.h("button", { class: "btn sm blue", style: { flex: 1 }, on: { click: () => drinkTo("item_pot_mp", false, "魔力藥水") } },
        MG.ui.dom.icon("icon_pot_mp", 14), "補魔 x" + potQty("item_pot_mp")));
    // actions
    const actions = MG.ui.dom.h("div", { style: { display: "flex", gap: "8px", marginTop: "10px" } },
      MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1 }, on: { click: () => { MG.sys.hunters.train(h); refreshDetail(h.id, m); } } },
        MG.ui.dom.icon("icon_train", 14), "訓練 " + MG.util.fmt(D.trainCost(h.level)) + "金"),
      MG.ui.dom.h("button", {
        class: "btn sm " + (MG.sys.hunters.canPromote(h) ? "green" : ""), style: { flex: 1 },
        disabled: !MG.sys.hunters.canPromote(h),
        on: { click: () => { if (MG.sys.hunters.promote(h)) refreshDetail(h.id, m); else MG.ui.dom.toast("無法突破：等級或資源不足", "bad", "icon_promote"); } }
      }, MG.ui.dom.icon("icon_promote", 14), "突破 " + (h.promoted || 0) + "→" + promoN),
      MG.ui.dom.h("button", { class: "btn sm danger", style: { flex: 1 }, on: { click: () => {
        MG.ui.dom.confirm("遣散英雄", "確定要遣散「" + h.name + "」嗎？將返還部分金幣，其裝備會送回背包。", () => { MG.sys.hunters.dismiss(h); m.close(); renderList(); });
      } } }, "遣散"));
    m.panel.appendChild(MG.ui.dom.h("div", null, iconEl, expBar, statsGrid, promoBox, healRow, slotsRow, setsBox, skillsBox, actions));
    function refreshDetail(id, modal) {
      const hh = S().hunters.find(x => x.id === id);
      if (hh) { modal.close(); openDetail(id); }
    }
    function slotIcon(item) { return "icon_" + MG.sys.equipment.slotOf(item); }
  }
  function pickEquip(h, slot) {
    const st = S();
    const items = st.inventory.items.filter(i => MG.sys.equipment.slotOf(i) === slot && !(slot === "weapon" && i.wtype && i.wtype !== MG.config.CLASS_WEAPONS[h.cls]));
    const m = MG.ui.dom.modal(MG.config.SLOT_NAMES[slot] + " — 選擇裝備", null, {});
    if (!items.length) {
      m.panel.appendChild(MG.ui.dom.h("div", { class: "empty" }, "背包中沒有可用的" + MG.config.SLOT_NAMES[slot] + "\n（前往副本獲得裝備）"));
      m.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "關閉"));
      return;
    }
    for (const it of items) {
      const equipped = h.equip[slot] === it.uid;
      const s = MG.sys.equipment.displayStats(it);
      const rowEl = MG.ui.dom.h("div", { class: "row", style: { borderColor: MG.config.RARITY[it.rarity - 1].color }, on: { click: () => { MG.sys.equipment.equipToHunter(h, it); m.close(); renderList(); } } },
        MG.ui.dom.icon("icon_" + slot, 24),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: "13px", color: MG.config.RARITY[it.rarity - 1].color } },
            MG.sys.equipment.nameOf(it) + (it.enhance > 0 ? " +" + it.enhance : "")),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px" } }, s.join(" / ")),
          it.set ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px", color: "var(--gold)" } }, MG.data.equipment.sets[it.set].name) : null),
        equipped ? MG.ui.dom.h("span", { class: "sub" }, "裝備中") : MG.ui.dom.h("button", { class: "btn sm gold", on: { click: (e) => { e.stopPropagation(); MG.sys.equipment.equipToHunter(h, it); m.close(); renderList(); } } }, "裝備"));
      m.panel.appendChild(rowEl);
    }
  }
  /* recruit */
  function openRecruit() {
    const st = S();
    const m = MG.ui.dom.modal("招募英雄", null, { onClose: stopCdTimer });
    const tabs = MG.ui.dom.h("div", { style: { display: "flex", gap: "6px", marginBottom: "10px" } },
      tabBtn("gold", "金幣招募"), tabBtn("ticket", "招募券"), tabBtn("gem", "神話招募"));
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(tabs);
    m.panel.appendChild(body);
    function stopCdTimer() {
      if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
    }
    function tabBtn(type, label) {
      return MG.ui.dom.h("button", { class: "chip", style: { flex: 1, justifyContent: "center" }, on: { click: () => showTab(type) } }, label);
    }
    function showTab(type) {
      stopCdTimer();
      tabs.querySelectorAll(".chip").forEach(c => c.classList.remove("on"));
      tabs.children[[["gold", "ticket", "gem"].indexOf(type)]].classList.add("on");
      body.innerHTML = "";
      const cost = MG.sys.hunters.recruitCost(type);
      const can = type === "gold" ? st.currencies.gold >= cost.gold : type === "ticket" ? (st.currencies.ticket || 0) >= 1 : st.currencies.gems >= cost.gem;
      const desc = type === "gold" ? "招募 1-3★ 英雄，費用隨招募次數上升" : type === "ticket" ? "招募 2-5★ 英雄，可從任務與成就獲得" : "招募 3-6★ 英雄，命運將為王者讓路";
      const costTxt = type === "gold" ? MG.util.fmt(cost.gold) + " 金幣" : type === "ticket" ? (st.currencies.ticket || 0) + "/1 招募券" : "300 鑽石";
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginBottom: "10px" } }, desc));
      const card = MG.ui.dom.h("div", {
        style: { width: "160px", height: "160px", margin: "0 auto 12px", borderRadius: "12px", border: "2px solid var(--line)",
          background: "var(--panel2)", display: "flex", alignItems: "center", justifyContent: "center", perspective: "400px" }
      });
      body.appendChild(card);
      let btn, label;
      if (type === "gold") {
        label = MG.ui.dom.h("span", null, "");
        btn = MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, on: { click: () => doRecruit(type, card, body, () => { refreshGold(); refreshCostLine(); }) } },
          MG.ui.dom.icon("icon_recruit", 16), label);
        body.appendChild(btn);
        const costLine = MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: "6px", fontSize: "11px" } });
        body.appendChild(costLine);
        function refreshCostLine() {
          const c = MG.sys.hunters.recruitCost("gold");
          const mul = 1 - 0.02 * (st.buildings.guild || 0);
          const nextC = Math.floor(D.recruit.gold.cost((st.stats.goldRecruits || 0) + 1) * mul);
          let t = "本次 " + MG.util.fmt(c.gold) + " 金幣 · 下次約 " + MG.util.fmt(nextC) + " 金幣";
          if (st.buildings.guild > 0) t += " · 酒館折扣 -" + (2 * st.buildings.guild) + "%";
          t += " · 名冊 " + st.hunters.length + "/" + MG.sys.buildings.effects().rosterCap + " · 招募後冷卻 " + D.recruit.gold.cd + " 秒";
          costLine.textContent = t;
        }
        function refreshGold() {
          const left = recruitCdUntil - Date.now();
          const c = MG.sys.hunters.recruitCost("gold");
          if (left > 0) {
            btn.disabled = true;
            label.textContent = "冷卻中 " + Math.ceil(left / 1000) + " 秒…";
          } else {
            btn.disabled = st.currencies.gold < c.gold;
            label.textContent = "招募（" + MG.util.fmt(c.gold) + " 金幣）";
          }
        }
        refreshCostLine();
        refreshGold();
        cdTimer = setInterval(() => { if (document.contains(btn)) refreshGold(); else stopCdTimer(); }, 1000);
      } else {
        btn = MG.ui.dom.h("button", {
          class: "btn " + (type === "gem" ? "pink" : "blue"), style: { width: "100%" },
          disabled: !can,
          on: { click: () => doRecruit(type, card, body, null) }
        }, "招募（" + costTxt + "）");
        body.appendChild(btn);
        body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: "6px", fontSize: "11px" } },
          type === "ticket" ? "招募券可於主線任務、成就與簽到中獲得" : "每次神話招募消耗 300 鑽石，必得 3★ 以上"));
      }
    }
    function doRecruit(type, card, body, after) {
      if (type === "gold" && Date.now() < recruitCdUntil) {
        MG.ui.dom.toast("招募冷卻中，請稍候片刻", "bad", "icon_recruit");
        return;
      }
      const h = MG.sys.hunters.doRecruit(type);
      if (!h) { MG.ui.dom.toast("資源不足", "bad", "icon_coin"); return; }
      if (type === "gold") recruitCdUntil = Date.now() + D.recruit.gold.cd * 1000;
      const cls = D.classes[h.cls];
      const rar = MG.config.RARITY[h.rarity - 1];
      card.innerHTML = "";
      card.style.borderColor = rar.color;
      const inner = MG.ui.dom.h("div", { style: { textAlign: "center", animation: "modalUp .4s" } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: "15px", color: rar.color, marginBottom: "4px" } }, rar.name + "！"),
        MG.ui.dom.icon(h.sprite || cls.icon, 56),
        MG.ui.dom.h("div", { style: { fontWeight: 800, marginTop: "6px" } }, h.name),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: "11px" } }, cls.name + " · Lv 1 · 戰力 " + MG.util.fmt(MG.sys.hunters.power(h))),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: "10px", fontStyle: "italic", marginTop: "2px" } }, "「" + cls.flavor + "」"));
      card.appendChild(inner);
      MG.ui.dom.toast("招募到 " + rar.name + "英雄「" + h.name + "」！", "good", "icon_recruit");
      renderList();
      if (after) after();
    }
    showTab("gold");
  }
  function renderList(force) {
    if (!listEl) return;
    const sig = listSignature();
    if (!force && sig === listSig && Date.now() - lastListAt < 1000) return; // 狀態沒變 → 跳過全量重建
    listSig = sig; lastListAt = Date.now();
    listEl.innerHTML = "";
    if (statusEl) {
      statusEl.innerHTML = "";
      const st = S();
      const formed = MG.sys.hunters.formationIds().length;
      const slots = MG.sys.buildings.effects().formationSlots;
      const unused = st.hunters.length - formed;
      const cap = MG.sys.buildings.effects().rosterCap;
      // 名冊總數上限（隨酒館等級成長）
      statusEl.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: "11px", padding: "2px 0 4px" } },
        "名冊 " + st.hunters.length + " / " + cap + " 人（升級酒館提升上限）"));
      if (unused > 0) {
        statusEl.appendChild(MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "2px 0 6px" } },
          MG.ui.dom.h("div", { class: "sub", style: { flex: 1, fontSize: "11px" } }, "已編隊 " + formed + "/" + slots + " · 尚有 " + unused + " 名英雄待命"),
          MG.ui.dom.h("button", { class: "btn sm green", style: { padding: "3px 10px", minHeight: "30px" }, on: { click: () => { MG.sys.hunters.autoFill(); renderList(); } } },
            MG.ui.dom.icon("icon_formation", 13), "自動編隊")));
      }
    }
    const list = filtered();
    if (!list.length) {
      const emptyTxt = filter === "all"
        ? "還沒有英雄\n點擊下方「招募英雄」開始冒險！"
        : filter === "formation"
          ? "出戰隊伍空無一人\n使用「編入」或「自動編隊」整裝出發！"
          : "沒有「" + D.classes[filter].name + "」英雄\n去招募一位吧！";
      listEl.appendChild(MG.ui.dom.h("div", { class: "empty" }, emptyTxt));
      return;
    }
    for (const h of list) listEl.appendChild(row(h));
  }
  function buildWanderRow(w) {
    const rar = MG.config.RARITY[w.rarity - 1];
    const spr = MG.sys.wanderers.spriteOf(w);
    const row = MG.ui.dom.h("div", { class: "row", style: { borderColor: rar.color, cursor: "pointer" }, on: { click: () => openWanderRecruit(w) } },
      MG.ui.dom.h("div", { style: { textAlign: "center" } },
        MG.ui.dom.icon(spr, 30),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, color: rar.color, fontWeight: 700 } }, rar.name)),
      MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } },
          w.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } },
            MG.data.hunters.classes[w.cls].name + "・Lv" + w.level),
          w.stars > 1 ? MG.ui.dom.h("span", { class: "rar" + Math.min(6, w.stars + 2), style: { marginLeft: 4, fontSize: 9 } }, "★".repeat(w.stars)) : null),
        MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 2 } },
          MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9 } }, "…"),
          MG.ui.dom.h("div", { class: "pbar", style: { height: 4, flex: 1 } }, MG.ui.dom.h("i", { style: { width: "100%" } })),
          MG.ui.dom.h("span", null)),
        MG.ui.dom.h("div", { style: { fontSize: 10, color: "var(--gold)", marginTop: 2 } })),
      MG.ui.dom.h("button", { class: "btn sm", on: { click: (e) => { e.stopPropagation(); openWanderRecruit(w); } } }, "招募"));
    return {
      row,
      stateEl: row.children[1].children[1].children[0],
      moodBar: row.children[1].children[1].children[1].children[0],
      hpWrap: row.children[1].children[1].children[2],
      bubbleWrap: row.children[1].children[2],
      costBtn: row.children[2]
    };
  }
  function updateWanderRow(cell, w) {
    const st = S();
    cell.stateEl.textContent = MG.sys.wanderers.stateLabel(w) + "・心情 " + Math.round(w.mood);
    cell.moodBar.style.width = Math.max(0, w.mood) + "%";
    cell.hpWrap.innerHTML = "";
    if (w.hp < w.maxHp) {
      cell.hpWrap.appendChild(MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9 } }, "HP " + Math.round(w.hp / w.maxHp * 100) + "%"));
    }
    cell.bubbleWrap.innerHTML = "";
    if (w.bubble) {
      cell.bubbleWrap.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 13, color: "var(--gold)", marginTop: 2 } }, w.bubble.icon + " " + w.bubble.text));
    }
    const cost = MG.sys.wanderers.recruitCost(w);
    const can = MG.sys.wanderers.canRecruit(w);
    cell.costBtn.className = "btn sm " + (can.ok ? "gold" : "");
    cell.costBtn.disabled = !can.ok;
    cell.costBtn.textContent = "招募 " + MG.util.fmt(cost) + "金";
  }
  // 流浪英雄戰力（與副本勝率同公式）
  function wandererPower(w) {
    const cls = D.classes[w.cls];
    const g = 1 + (w.level - 1) * 0.08;
    const atk = cls.base.atk * g, hp = (cls.base.hp + cls.grow.hp * (w.level - 1)) * g, def = cls.base.def * g;
    return atk * 3 + hp * 0.2 + def * 2;
  }
  function filteredWanderers() {
    const st = S();
    let list = (st.wanderers || []).filter(w => !w.dead);
    if (filter === "formation") list = list.filter(w => w.state === "hunt"); // 出戰中=出戰中
    else if (filter !== "all") list = list.filter(w => w.cls === filter);
    return [...list].sort((a, b) => sort === "level" ? b.level - a.level
      : sort === "rarity" ? (b.rarity - a.rarity) || (b.level - a.level)
      : wandererPower(b) - wandererPower(a));
  }
  function renderWanderers() {
    if (!wanderEl) return;
    const st = S();
    const list = filteredWanderers();
    if (!list.length) {
      wanderEl.innerHTML = "";
      wanderRows = {};
      wanderEl.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, textAlign: "center", padding: "4px 0" } },
        filter === "all" ? "流浪英雄會在村中徘徊……（升級酒館可提升來訪者品質）" : "沒有符合條件的流浪英雄"));
      return;
    }
    // 移除已離開的流浪者
    for (const uid in wanderRows) {
      if (!list.some(w => w.uid === uid)) {
        wanderRows[uid].row.remove();
        delete wanderRows[uid];
      }
    }
    // 建立新列 / 更新既有列（保留節點；依排序 appendChild 移動順序 → hover 不抖動、排序即時生效）
    for (const w of list) {
      let cell = wanderRows[w.uid];
      if (!cell) {
        cell = buildWanderRow(w);
        wanderRows[w.uid] = cell;
      }
      wanderEl.appendChild(cell.row); // 已存在則移動到正確位置
      updateWanderRow(cell, w);
    }
  }
  function openWanderRecruit(w) {
    const rar = MG.config.RARITY[w.rarity - 1];
    const cost = MG.sys.wanderers.recruitCost(w);
    const m = MG.ui.dom.modal("流浪英雄詳情", null, { icon: MG.sys.wanderers.spriteOf(w) });
    m.panel.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 12 } },
      MG.ui.dom.icon(MG.sys.wanderers.spriteOf(w), 48),
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 17, marginTop: 4 } }, w.name,
        MG.ui.dom.h("span", { class: "rar" + w.rarity, style: { marginLeft: 4, fontSize: 12 } }, MG.ui.dom.stars(w.rarity))),
      MG.ui.dom.h("div", { class: "sub" }, rar.name + "・" + MG.data.hunters.classes[w.cls].name + "・Lv " + w.level),
      MG.ui.dom.h("div", { style: { fontSize: 12, color: "var(--dim)", marginTop: 6 } },
        "「" + (w.bubble ? w.bubble.text : "帶上我吧，我會證明自己的價值！") + "」")));
    // 各項素質
    const stat = (label, val, color) => MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 } },
      MG.ui.dom.h("span", { style: { color: "var(--dim)" } }, label),
      MG.ui.dom.h("span", { style: { fontWeight: 800, color: color || "var(--text)" } }, val));
    const panel = MG.ui.dom.h("div", { class: "panel2", style: { padding: "6px 10px", marginBottom: 10 } });
    panel.appendChild(stat("戰力", MG.util.fmt(Math.round(wandererPower(w))), "var(--gold)"));
    panel.appendChild(stat("生命", w.maxHp + " / " + w.maxHp, "var(--good)"));
    panel.appendChild(stat("心情", Math.round(w.mood) + " / 100", Math.round(w.mood) > 60 ? "var(--good)" : "var(--bad)"));
    panel.appendChild(stat("狩獵歸來金幣", "+" + MG.util.fmt(w.wallet || 0) + " 金", "var(--gold)"));
    panel.appendChild(stat("素材機率", Math.round((w.type ? w.type.matChance : 0) * 100) + "%", "#c792ea"));
    panel.appendChild(stat("狀態", MG.sys.wanderers.stateLabel(w.state || "idle")));
    m.panel.appendChild(panel);
    m.panel.appendChild(MG.ui.dom.h("button", {
      class: "btn gold", style: { width: "100%" },
      disabled: !MG.sys.wanderers.canRecruit(w).ok,
      on: { click: () => { const h = MG.sys.wanderers.recruit(w.uid); if (h) { m.close(); view = "kingdom"; applyView(); renderWanderers(); renderList(); MG.ui.screens.tick(); } } }
    }, "招募（" + MG.util.fmt(cost) + " 金幣）"));
    // 驅逐：請他永遠離開村莊
    m.panel.appendChild(MG.ui.dom.h("button", {
      class: "btn sm danger", style: { width: "100%", marginTop: 6 },
      on: { click: () => {
        MG.ui.dom.confirm("驅逐流浪英雄", "確定要請「" + w.name + "」離開村莊嗎？他將永遠不再回來。", () => {
          if (MG.sys.wanderers.dismiss(w.uid)) {
            MG.ui.dom.toast("已請「" + w.name + "」離開村莊", "", "icon_sword");
            m.close();
            renderWanderers();
          }
        }, { danger: true });
      } }
    }, "驅逐"));
    m.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "關閉"));
  }
  /* 建築分頁：王國頁的建築選項獨立成頁 */
  const screen = {
    render(root) {
      root.innerHTML = "";
      // 領地英雄 / 流浪英雄 切換
      const viewRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 8, padding: "8px 10px 0" } });
      const mkViewChip = (id, label) => MG.ui.dom.h("button", {
        class: "btn sm" + (view === id ? " gold" : " ghost"), style: { flex: 1 },
        on: { click: () => { view = id; applyView(); } }
      }, label);
      const chipKingdom = mkViewChip("kingdom", "領地英雄");
      const chipWanderer = mkViewChip("wanderer", "流浪英雄");
      viewBtnEls = [chipKingdom, chipWanderer];
      viewRow.appendChild(chipKingdom);
      viewRow.appendChild(chipWanderer);
      root.appendChild(viewRow);
      // sticky filter + sort bar
      const sticky = MG.ui.dom.h("div", { style: { position: "sticky", top: 0, zIndex: 6, background: "var(--bg)", padding: "8px 10px 2px", borderBottom: "2px solid var(--line)" } });
      const filterRow = MG.ui.dom.h("div", { class: "list-scroll", style: { padding: "0 0 6px" } });
      const chipDefs = [["all", "全部"], ["formation", "出戰中"]].concat(Object.keys(D.classes).map(c => [c, D.classes[c].name]));
      const filterChips = chipDefs.map(([id, label]) => MG.ui.dom.h("div", { class: "chip" + (filter === id ? " on" : ""), on: { click: () => { filter = id; syncFilterChips(); renderList(); renderWanderers(); } } }, label));
      filterChips.forEach(c => filterRow.appendChild(c));
      const sortRow = MG.ui.dom.h("div", { class: "list-scroll", style: { padding: "0 0 4px" } });
      const sortDefs = [["power", "戰力排序"], ["level", "等級排序"], ["rarity", "稀有度排序"]];
      const sortChips = sortDefs.map(([id, label]) => MG.ui.dom.h("div", { class: "chip" + (sort === id ? " on" : ""), on: { click: () => { sort = id; syncSortChips(); renderList(); renderWanderers(); } } }, label));
      sortChips.forEach(c => sortRow.appendChild(c));
      // 選中態即時同步（金底+粗體+光暈）
      const syncFilterChips = () => filterChips.forEach((c, i) => c.className = "chip" + (filter === chipDefs[i][0] ? " on" : ""));
      const syncSortChips = () => sortChips.forEach((c, i) => c.className = "chip" + (sort === sortDefs[i][0] ? " on" : ""));
      sticky.appendChild(filterRow);
      sticky.appendChild(sortRow);
      statusEl = MG.ui.dom.h("div", null);
      sticky.appendChild(statusEl);
      root.appendChild(sticky);
      // 領地英雄區
      listWrapEl = MG.ui.dom.h("div", null);
      listEl = MG.ui.dom.h("div", { style: { padding: "4px 10px 0" } });
      listWrapEl.appendChild(listEl);
      root.appendChild(listWrapEl);
      // 流浪英雄區（招募後成為領地英雄）
      wanderWrapEl = MG.ui.dom.h("div", { style: { display: "none" } },
        MG.ui.dom.h("div", { class: "section-h", style: { margin: "6px 10px 2px" } },
          MG.ui.dom.h("span", { class: "t" }, "流浪英雄 · 招募後成為領地英雄")));
      wanderEl = MG.ui.dom.h("div", { style: { padding: "0 10px 90px" } });
      wanderWrapEl.appendChild(wanderEl);
      root.appendChild(wanderWrapEl);
      wanderRows = {};
      renderWanderers();
      // recruit FAB
      fabWrapEl = MG.ui.dom.h("div", { style: { position: "fixed", bottom: "calc(var(--nav-h) + env(safe-area-inset-bottom) + 12px)", left: 0, right: 0, maxWidth: "480px", margin: "0 auto", padding: "0 14px", zIndex: 40 } },
        MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, on: { click: openRecruit } },
          MG.ui.dom.icon("icon_recruit", 18), "招募英雄"));
      root.appendChild(fabWrapEl);
      applyView();
      renderList(true);
    },
    refresh: () => { renderList(); renderWanderers(); }
  };
  function applyView() {
    // 切換顯示：領地英雄（名冊+FAB）或 流浪英雄（流浪卡片）
    const showKingdom = view === "kingdom";
    if (listWrapEl) listWrapEl.style.display = showKingdom ? "" : "none";
    if (wanderWrapEl) wanderWrapEl.style.display = showKingdom ? "none" : "";
    if (fabWrapEl) fabWrapEl.style.display = showKingdom ? "" : "none";
    // 切換按鈕選中態同步（金=選中 / ghost=未選中）
    if (viewBtnEls) viewBtnEls.forEach((b, i) => {
      const active = view === (i === 0 ? "kingdom" : "wanderer");
      b.className = "btn sm" + (active ? " gold" : " ghost");
    });
  }
  MG.ui.screens.register("hunters", screen);
  return screen;
})();
