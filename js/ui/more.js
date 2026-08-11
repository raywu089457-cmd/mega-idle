/* 放置王國 MEGA IDLE — more screen: quests, achievements, codex, check-in, shop, altar, settings (slice B5 owns) */
"use strict";
MG.ui = MG.ui || {};
MG.ui.more = (function () {
  const QD = MG.data.quests;
  const S = () => MG.game.state;
  const screen = {
    render(root) {
      root.innerHTML = "";
      root.appendChild(MG.ui.dom.h("div", { style: { padding: "12px 12px 80px" } },
        MG.ui.dom.h("div", { class: "title", style: { marginBottom: 12 } }, "冒險手冊"),
        menuRow("icon_quest", "任務", "主線與每日任務", () => openQuests()),
        menuRow("icon_ach", "成就", "長期目標與榮耀", () => openAch()),
        menuRow("icon_codex", "圖鑑", "魔物、裝備、素材收藏", () => openCodex()),
        menuRow("icon_check", "每日簽到", "30 天豪華獎勵", () => openCheckin()),
        menuRow("icon_shop", "商城", "課金裝備（鑽石購買）", () => openShop()),
        
        menuRow("icon_settings", "設定", "音效、存檔與其他", () => openSettings()),
        menuRow("icon_scroll", "更新歷史", "展開式更新紀錄（全部版本）", () => openChangelog())));
    },
    refresh() { }
  };
  function menuRow(ic, name, desc, cb) {
    return MG.ui.dom.h("div", { class: "row", on: { click: cb } },
      MG.ui.dom.icon(ic, 26),
      MG.ui.dom.h("div", { class: "grow" },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 14 } }, name),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, desc)),
      MG.ui.dom.h("span", { style: { color: "var(--dim2)" } }, "›"));
  }
  /* 按壓回饋：點擊瞬間的「動作中」閃光（500ms 後移除） */
  function pressFx(el) {
    if (!el) return;
    el.classList.remove("acting");
    void el.offsetWidth; // restart animation
    el.classList.add("acting");
    clearTimeout(el._fxT);
    el._fxT = setTimeout(() => el.classList.remove("acting"), 520);
  }
  /* quests */
  function msToMidnight() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1).getTime() - n.getTime();
  }
  function openQuests() {
    const st = S();
    const m = MG.ui.dom.modal("任務", null, {});
    const tabs = MG.ui.dom.h("div", { style: { display: "flex", gap: 6, marginBottom: 8 } });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(tabs); m.panel.appendChild(body);
    function show(t) {
      tabs.innerHTML = "";
      body.innerHTML = "";
      for (const [id, label] of [["main", "主線"], ["daily", "每日"]]) {
        tabs.appendChild(MG.ui.dom.h("div", { class: "chip" + (t === id ? " on" : ""), on: { click: () => show(id) } }, label));
      }
      if (t === "main") {
        body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6, padding: "0 2px" } },
          "完成目標推進主線，主線進度 " + st.quests.mainIdx + " / " + QD.MAIN.length));
        for (let i = 0; i < QD.MAIN.length; i++) {
          const q = QD.MAIN[i];
          const done = i < st.quests.mainIdx;
          const active = i === st.quests.mainIdx;
          const cur = done ? q.req.target : active ? MG.sys.meta.questCur(q.req) : 0;
          body.appendChild(MG.ui.dom.h("div", {
            style: { padding: "8px", borderRadius: 8, background: "var(--panel2)", border: "1px solid " + (active ? "var(--gold)" : "var(--line)"), marginBottom: 6, opacity: done ? 0.55 : 1 }
          },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } },
              done ? "✓ " : "", q.name,
              MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, rewardText(q.reward))),
            active ? MG.ui.dom.h("div", { class: "pbar", style: { height: 6, marginTop: 4 } }, MG.ui.dom.h("i", { style: { width: Math.min(100, cur / q.req.target * 100) + "%" } })) : null));
        }
      } else {
        const claimable = st.quests.daily.list.filter(d => {
          if (d.done) return false;
          const def = QD.DAILY_POOL.find(x => x.id === d.id);
          return def && MG.sys.meta.questCur(def.req) >= def.req.target;
        }).length;
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: "6px 8px", marginBottom: 6 } },
          MG.ui.dom.icon("icon_speed", 16),
          MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } }, "每日任務於午夜重置",
            MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, "剩 " + MG.util.fmtClock(msToMidnight()))),
          MG.ui.dom.h("button", {
            class: "btn sm " + (claimable ? "gold" : ""), disabled: !claimable,
            on: { click: () => { if (MG.sys.meta.claimAllDaily()) { MG.ui.dom.toast("每日獎勵已全數領取！", "good", "icon_quest"); show("daily"); } } }
          }, "全部領取" + (claimable ? " (" + claimable + ")" : ""))));
        for (const d of st.quests.daily.list) {
          const def = QD.DAILY_POOL.find(x => x.id === d.id);
          if (!def) continue;
          const cur = Math.min(def.req.target, MG.sys.meta.questCur(def.req));
          const done = d.done || cur >= def.req.target;
          body.appendChild(MG.ui.dom.h("div", { class: "row", style: { marginBottom: 6, padding: 8 } },
            MG.ui.dom.h("div", { class: "grow" },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, def.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, rewardText(def.reward))),
              MG.ui.dom.h("div", { class: "pbar", style: { height: 6, marginTop: 4 } }, MG.ui.dom.h("i", { style: { width: (cur / def.req.target * 100) + "%" } })),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, marginTop: 2 } }, cur + " / " + def.req.target)),
            MG.ui.dom.h("button", { class: "btn sm " + (done && !d.done ? "gold" : ""), disabled: !done || d.done, on: { click: () => { if (MG.sys.meta.claimDaily(d.id)) { MG.ui.dom.toast("獎勵已領取！", "good", "icon_quest"); show("daily"); } } } }, d.done ? "已領" : "領取")));
        }
      }
    }
    show("main");
  }
  function rewardText(r) {
    const parts = [];
    if (r.gold) parts.push(MG.util.fmt(r.gold) + " 金");
    if (r.gems) parts.push(r.gems + " 鑽石");
    if (r.honor) parts.push(r.honor + " 榮譽");
    if (r.ticket) parts.push("招募券 x" + r.ticket);
    if (r.pot) parts.push(MG.config.BUFF_NAMES[r.pot]);
    return parts.join("、");
  }
  /* achievements */
  function openAch() {
    const st = S();
    const m = MG.ui.dom.modal("成就", null, {});
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    const claimed = Object.keys(st.achievements).length;
    const claimable = QD.ACH.filter(a => MG.sys.meta.achClaimable(a)).length;
    body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: "6px 8px", marginBottom: 6 } },
      MG.ui.dom.icon("icon_ach", 18),
      MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } },
        "已達成 " + claimed + " / " + QD.ACH.length + " 項",
        MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, claimable ? "可領取 " + claimable + " 項" : "暫無可領取")),
      MG.ui.dom.h("button", {
        class: "btn sm " + (claimable ? "gold" : ""), disabled: !claimable,
        on: { click: () => { if (MG.sys.meta.claimAllAch()) { MG.ui.dom.toast("成就獎勵已全數領取！", "good", "icon_ach"); openAch(); m.close(); } } }
      }, "全部領取")));
    for (const a of QD.ACH) {
      const done = st.achievements[a.id];
      const ready = MG.sys.meta.achClaimable(a);
      body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 8, opacity: done ? 0.5 : 1 } },
        MG.ui.dom.icon("icon_ach", 22),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, a.name),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, a.desc + "　" + rewardText(a.reward))),
        MG.ui.dom.h("button", { class: "btn sm " + (ready ? "gold" : ""), disabled: !ready || done, on: { click: () => { if (MG.sys.meta.claimAch(a.id)) { MG.ui.dom.toast("成就達成！", "good", "icon_ach"); openAch(); m.close(); } } } }, done ? "已領" : "領取")));
    }
  }
  /* codex */
  function openCodex() {
    const st = S();
    const pct = MG.sys.meta.codexPct();
    const m = MG.ui.dom.modal("圖鑑", null, {});
    const head = MG.ui.dom.h("div", { style: { marginBottom: 8 } },
      MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 13 } },
        MG.ui.dom.h("span", null, "完成度"), MG.ui.dom.h("span", { style: { color: "var(--gold)" } }, Math.floor(pct * 100) + "%")),
      MG.ui.dom.h("div", { class: "pbar", style: { marginTop: 4 } }, MG.ui.dom.h("i", { style: { width: (pct * 100) + "%" } })));
    m.panel.appendChild(head);
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    // total milestones
    for (const t of QD.CODEX_TOTAL) {
      if (pct * 100 < t.pct - 25) continue;
      const key = "t:" + t.pct;
      const claimed = MG.sys.meta.codexMilestoneClaimed(key);
      const ready = pct * 100 >= t.pct;
      body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 7 } },
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, "圖鑑 " + t.pct + "%：" + t.fx),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, rewardText(t.r))),
        MG.ui.dom.h("button", { class: "btn sm " + (ready && !claimed ? "gold" : ""), disabled: !ready || claimed, on: { click: () => { if (MG.sys.meta.claimCodexMilestone(key)) { MG.ui.dom.toast("圖鑑獎勵已領取！", "good", "icon_codex"); openCodex(); m.close(); } } } }, claimed ? "已領" : "領取")));
    }
    body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "魔物討伐")));
    for (const r of MG.data.monsters.regions) {
      const all = [].concat(r.monsters, [r.boss]);
      body.appendChild(MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 11, color: "var(--gold)", margin: "8px 2px 4px" } }, "◆ " + r.name));
      for (const mo of all) {
        const kills = MG.sys.meta.codexMonsterKills(mo.id);
        const last = QD.CODEX_MONSTER_MILESTONES[QD.CODEX_MONSTER_MILESTONES.length - 1];
        const next = QD.CODEX_MONSTER_MILESTONES.find(x => kills < x.kills) || last;
        body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", background: "var(--panel2)", borderRadius: 8, marginBottom: 4 } },
          MG.ui.dom.icon(mo.sprite, 18),
          MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } },
            mo.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, "討伐 " + kills + " / 下階 " + next.kills),
            MG.ui.dom.h("div", { class: "pbar", style: { height: 4, marginTop: 3 } }, MG.ui.dom.h("i", { style: { width: Math.min(100, kills / next.kills * 100) + "%" } })),
            mo.flavor ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, color: "var(--dim)", marginTop: 2, fontStyle: "italic" } }, "「" + mo.flavor + "」") : null),
          milestonesRow("m:" + mo.id, kills)));
      }
    }
    body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "裝備收集")));
    const itemCount = Object.keys(st.codex.items).length;
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { padding: "0 4px 6px", fontSize: 11 } }, "已收集 " + itemCount + " / 70 種裝備（各部位 × 各階級）"));
    const slots = [["weapon", "劍刃"], ["helmet", "護盔"], ["armor", "戰甲"], ["boots", "戰靴"], ["necklace", "項墜"], ["ring", "指環"], ["charm", "護符"]];
    for (const [slot, noun] of slots) {
      const row = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "34px repeat(10, 1fr)", gap: 3, marginBottom: 3, alignItems: "center" } });
      row.appendChild(MG.ui.dom.h("div", { style: { fontSize: 9, color: "var(--dim)" } }, noun));
      for (let t = 1; t <= 10; t++) {
        const have = !!st.codex.items[slot + "_" + t];
        row.appendChild(MG.ui.dom.h("div", {
          title: "第 " + t + " 階" + noun,
          style: { aspectRatio: "1", borderRadius: 4, border: "1px solid " + (have ? "var(--gold)" : "var(--line)"), background: have ? "rgba(255,209,102,0.12)" : "var(--panel2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: have ? "var(--gold)" : "var(--dim)" }
        }, have ? "✓" : t));
      }
      body.appendChild(row);
    }
    body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "素材發現")));
    const matCount = Object.keys(st.codex.mats).length;
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { padding: "0 4px", fontSize: 11 } }, "已發現 " + matCount + " / 9 種素材"));
    function milestonesRow(key, kills) {
      const rowEl = MG.ui.dom.h("div", { style: { display: "flex", gap: 3 } });
      for (const ms of QD.CODEX_MONSTER_MILESTONES) {
        const k = key + ":" + ms.kills;
        const claimed = MG.sys.meta.codexMilestoneClaimed(k);
        const ready = kills >= ms.kills && !claimed;
        rowEl.appendChild(MG.ui.dom.h("button", {
          class: "btn sm", style: { padding: "2px 6px", minHeight: 24, fontSize: 9 },
          disabled: !ready && !claimed,
          on: { click: () => { if (MG.sys.meta.claimCodexMilestone(k)) { MG.ui.dom.toast("圖鑑獎勵已領取！", "good", "icon_codex"); openCodex(); m.close(); } } }
        }, claimed ? "✓" : ms.kills));
      }
      return rowEl;
    }
  }
  /* check-in */
  function openCheckin() {
    const st = S();
    const m = MG.ui.dom.modal("每日簽到", null, {});
    const day = MG.sys.meta.checkinDay();
    const grid = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 } });
    for (let i = 0; i < 30; i++) {
      const def = QD.CHECKIN[i];
      const r = def.r;
      const claimed = st.checkin.days[i];
      const today = i === day;
      grid.appendChild(MG.ui.dom.h("div", {
        title: "第 " + (i + 1) + " 天" + (def.name ? " · " + def.name : ""),
        style: {
          aspectRatio: "1", borderRadius: 8, border: "2px solid " + (today ? "var(--gold)" : claimed ? "var(--good)" : "var(--line)"),
          background: claimed ? "rgba(126,231,135,0.12)" : "var(--panel2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: claimed ? 0.6 : 1
        }
      },
        MG.ui.dom.h("div", { style: { fontSize: def.name ? 7 : 9, color: def.name ? "var(--gold)" : "var(--dim)", fontWeight: def.name ? 800 : 400, whiteSpace: "nowrap" } }, def.name || "D" + (i + 1)),
        MG.ui.dom.icon(checkinIcon(r), 14),
        claimed ? MG.ui.dom.h("div", { style: { fontSize: 9, color: "var(--good)" } }, "✓") : null));
    }
    m.panel.appendChild(grid);
    m.panel.appendChild(MG.ui.dom.h("button", {
      class: "btn gold", style: { width: "100%", marginTop: 10 },
      disabled: day >= 30 || st.checkin.days[day],
      on: { click: () => { if (MG.sys.meta.claimCheckin()) { MG.ui.dom.toast("簽到成功！", "good", "icon_check"); openCheckin(); m.close(); } } }
    }, day >= 30 ? "本月簽到完成！" : st.checkin.days[day] ? "明日再來" : "簽到第 " + (day + 1) + " 天"));
    function checkinIcon(r) {
      if (r.ticket) return "icon_ticket";
      if (r.gems) return "icon_gem";
      return "icon_coin";
    }
  }
    /* 更名券（v125）：選擇更改王國或英雄名稱，輸入新名（消耗 1 張） */
    function openRenameDialog() {
      const st = S();
      if ((st.currencies.renameTicket || 0) < 1) { MG.ui.dom.toast("沒有更名券，可在商城或市場購買", "bad", "icon_scroll"); return; }
      const m = MG.ui.dom.modal("更名", null, { icon: "icon_scroll" });
      m.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginBottom: 10 } },
        "持有更名券 x" + (st.currencies.renameTicket || 0) + "。要更改哪種名稱？（1-12 字）"));
      const mkBtn = (label, sub, fn) => m.panel.appendChild(MG.ui.dom.h("button", { class: "btn", style: { width: "100%", marginBottom: 8, justifyContent: "flex-start" }, on: { click: () => { m.close(); fn(); } } },
        MG.ui.dom.h("div", { style: { textAlign: "left" } },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 14 } }, label),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, sub))));
      mkBtn("王國名稱", "目前：「" + (st.kingdomName || "梅根王國") + "」", () => renameInput("王國名稱", st.kingdomName || "梅根王國", (name) => {
        st.kingdomName = name;
        MG.ui.dom.toast("王國更名為「" + name + "」！", "good", "icon_castle");
      }));
      if (st.hunters.length) {
        mkBtn("英雄名稱", "目前名冊共 " + st.hunters.length + " 名英雄", pickHeroRename);
      }
      m.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "取消"));
    }
    function pickHeroRename() {
      const st = S();
      const m = MG.ui.dom.modal("選擇要更名的英雄", null, { icon: "icon_recruit" });
      for (const h of st.hunters) {
        const cls = MG.data.hunters.classes[h.cls] || {};
        m.panel.appendChild(MG.ui.dom.h("div", { class: "row", on: { click: () => { m.close(); renameInput("英雄名稱", h.name, (name) => { h.name = name; MG.ui.dom.toast("「" + name + "」更名完成！", "good", "icon_recruit"); }); } } },
          MG.ui.dom.icon(cls.icon, 22),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, h.name),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, (cls.name || h.cls) + " Lv" + h.level))));
      }
      m.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "取消"));
    }
    function renameInput(title, cur, onOk) {
      const st = S();
      if ((st.currencies.renameTicket || 0) < 1) { MG.ui.dom.toast("沒有更名券", "bad", "icon_scroll"); return; }
      const m = MG.ui.dom.modal(title, null, { icon: "icon_scroll" });
      const input = MG.ui.dom.h("input", {
        type: "text", maxlength: 12, value: cur,
        style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "2px solid var(--line)", background: "var(--panel2)", color: "var(--text)", fontSize: 15, marginBottom: 10 },
        on: { keydown: (e) => { if (e.key === "Enter") confirm(); } }
      });
      m.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { marginBottom: 6 } }, "輸入新名稱（1-12 字，消耗 1 張更名券）"));
      m.panel.appendChild(input);
      m.panel.appendChild(MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, on: { click: confirm } }, "確定更名"));
      setTimeout(() => { try { input.focus(); } catch (e) {} }, 60);
      function confirm() {
        const name = (input.value || "").trim();
        if (name.length < 1 || name.length > 12) { MG.ui.dom.toast("名稱需為 1-12 個字元", "bad", "icon_scroll"); return; }
        st.currencies.renameTicket = (st.currencies.renameTicket || 0) - 1;
        onOk(name);
        m.close();
      }
    }
/* 裝備商店（v136）：自由裝備製作 + 寶石融合 + 道具製作 */
  function openForge() {
    const st = S();
    const m = MG.ui.dom.modal("裝備商店", null, { icon: "b_forge" });
    const body = m.panel;
    let tab = "gear";
    const tabRow = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 } });
    const tabDefs = [["gear", "裝備製作"], ["gem", "寶石製作"], ["item", "道具製作"]];
    const tabChips = tabDefs.map(([id, label]) => MG.ui.dom.h("div", { class: "chip" + (tab === id ? " on" : ""), on: { click: () => { tab = id; syncTabs(); render(); } } }, label));
    tabChips.forEach(c => tabRow.appendChild(c));
    body.appendChild(tabRow);
    const content = MG.ui.dom.h("div", null);
    body.appendChild(content);
    function syncTabs() { tabChips.forEach((c, i) => c.className = "chip" + (tab === tabDefs[i][0] ? " on" : "")); }
    function render() { if (tab === "gear") renderGear(); else if (tab === "gem") renderGem(); else renderItem(); }

    /* ---- 裝備製作器：類別→部位/種類→套裝→稀有度→階級 ---- */
    function renderGear() {
      const maxTier = Math.min(9, st.stats.maxTierReached || 1);
      let cat = "weapon", slotSel = "sword", setSel = "none", rarSel = 3, tierSel = maxTier;
      const CATS = {
        weapon: { name: "武器", slots: [["sword", "劍"], ["bow", "弓"], ["staff", "杖"], ["dagger", "匕首"], ["greatsword", "大劍"], ["mace", "錘"]], slotKey: "wtype" },
        armor: { name: "防具", slots: [["helmet", "頭盔"], ["armor", "護甲"], ["boots", "靴子"]], slotKey: "slot" },
        acc: { name: "飾品", slots: [["necklace", "項鍊"], ["ring", "戒指"], ["charm", "護符"]], slotKey: "slot" }
      };
      function redraw() {
        content.innerHTML = "";
        content.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } },
          "打造專屬裝備（階級與稀有度越高成本越高）。"));
        const section = (t) => content.appendChild(MG.ui.dom.h("div", { class: "section-h", style: { margin: "6px 0 4px" } }, MG.ui.dom.h("span", { class: "t" }, t)));
        const row = () => MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 } });
        const chip = (on, label, click) => MG.ui.dom.h("div", { class: "chip" + (on ? " on" : ""), style: { fontSize: 12 }, on: { click } }, label);
        // 類別
        section("類別");
        const cRow = row();
        Object.keys(CATS).forEach(k => cRow.appendChild(chip(cat === k, CATS[k].name, () => { cat = k; slotSel = CATS[k].slots[0][0]; redraw(); })));
        content.appendChild(cRow);
        // 部位/種類
        section(CATS[cat].name === "武器" ? "武器種類" : "部位");
        const sRow = row();
        CATS[cat].slots.forEach(([id, label]) => sRow.appendChild(chip(slotSel === id, label, () => { slotSel = id; redraw(); })));
        content.appendChild(sRow);
        // 套裝
        section("套裝");
        const setRow = row();
        setRow.appendChild(chip(setSel === "none", "非套裝", () => { setSel = "none"; redraw(); }));
        Object.keys(MG.data.equipment.sets || {}).forEach(k => setRow.appendChild(chip(setSel === k, (MG.data.equipment.sets[k] || {}).name || k, () => { setSel = k; redraw(); })));
        content.appendChild(setRow);
        // 稀有度
        section("稀有度");
        const rRow = row();
        MG.config.RARITY.forEach((r, i) => rRow.appendChild(chip(rarSel === i + 1, "★" + (i + 1) + " " + r.name, () => { rarSel = i + 1; redraw(); })));
        content.appendChild(rRow);
        // 階級
        section("階級");
        const tRow = row();
        for (let t = 1; t <= maxTier; t++) tRow.appendChild(chip(tierSel === t, MG.config.tierLabel(t), () => { tierSel = t; redraw(); }));
        content.appendChild(tRow);
        // 成本
        const goldCost = Math.floor(60 * tierSel * rarSel);
        const matPool = (MG.sys.loot.region(tierSel - 1) || {}).mats || [];
        const matA = matPool[0] || "iron", matB = matPool[1] || "herb";
        const costA = rarSel + 2, costB = rarSel;
        const mkMat = (id, n) => {
          const have = st.mats[id] || 0;
          return MG.ui.dom.h("span", { style: have >= n ? {} : { color: "#ff6b6b", fontWeight: 700 } }, (MG.config.MATS[id] || {}).name + " " + have + "/" + n);
        };
        const costBox = MG.ui.dom.h("div", { class: "panel2", style: { padding: "8px 10px", margin: "6px 0 10px", fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 } },
          MG.ui.dom.h("div", null,
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, MG.config.tierLabel(tierSel) + " " + (CATS[cat].slots.find(x => x[0] === slotSel) || [])[1] + (setSel !== "none" ? "・" + ((MG.data.equipment.sets[setSel] || {}).name || setSel) : "") + "・" + MG.config.RARITY[rarSel - 1].name),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } },
              "金幣 " + MG.util.fmt(goldCost) + "　" )),
          MG.ui.dom.h("div", { style: { display: "flex", gap: 8 } }, mkMat(matA, costA), mkMat(matB, costB)));
        content.appendChild(costBox);
        const can = st.currencies.gold >= goldCost && (st.mats[matA] || 0) >= costA && (st.mats[matB] || 0) >= costB;
        content.appendChild(MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, disabled: !can, on: { click: () => {
          const opts = { tier: tierSel, rarity: rarSel };
          if (cat === "weapon") { opts.slot = "weapon"; opts.wtype = slotSel; }
          else opts.slot = slotSel;
          if (setSel !== "none") opts.set = setSel;
          const it = MG.sys.equipment.gen(opts);
          st.currencies.gold -= goldCost;
          st.mats[matA] -= costA;
          st.mats[matB] -= costB;
          MG.sys.equipment.addToInventory(it);
          MG.core.audio.SFX.enhance();
          MG.ui.dom.toast("打造完成：" + MG.sys.equipment.nameOf(it) + "！", "good", "icon_hammer");
          redraw();
        } } }, "打造（" + MG.util.fmt(goldCost) + " 金）"));
      }
      redraw();
    }
    /* ---- 寶石製作：3 顆同階融合升階 ---- */
    function renderGem() {
      content.innerHTML = "";
      const GEMS2 = MG.data.equipment.GEMS;
      const gs = st.inventory.items.filter(i => !!GEMS2[(i.defId || "").split("_")[0]]);
      content.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } },
        "融合 3 顆同階寶石 → 1 顆更高階（寶石工坊等級影響成功率與上限）。"));
      if (!gs.length) { content.appendChild(MG.ui.dom.h("div", { class: "empty" }, "尚未獲得寶石")); return; }
      const byKind = {};
      for (const g of gs) {
        const k = g.defId.split("_")[0];
        (byKind[k] = byKind[k] || []).push(g);
      }
      for (const kind of Object.keys(byKind)) {
        const gd = MG.data.equipment.GEMS[kind];
        const list = byKind[kind];
        content.appendChild(MG.ui.dom.h("div", { class: "section-h", style: { margin: "8px 0 4px" } }, MG.ui.dom.h("span", { class: "t" }, gd.name)));
        for (const g of list) {
          const q = g.qty || 1;
          const canFuse = q >= 3;
          const effect = gd.desc + " +" + (gd.stat === "crit" ? Math.round(gd.val(g.tier) * 100) + "%" : Math.round(gd.val(g.tier)));
          const rowEl = MG.ui.dom.h("div", { class: "row", style: { marginBottom: 6 } },
            MG.ui.dom.icon("gem_" + kind, 22),
            MG.ui.dom.h("div", { class: "grow" },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, gd.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, MG.config.tierLabel(g.tier) + " x" + q)),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, effect)),
            MG.ui.dom.h("button", { class: "btn sm " + (canFuse ? "gold" : ""), disabled: !canFuse, on: { click: () => {
              const out = MG.sys.equipment.gemFuse(g.defId, 3);
              if (out) { MG.ui.dom.toast("融合成功：" + gd.name + " " + MG.config.tierLabel(out.tier) + "！", "good", "gem_" + kind); renderGem(); }
            } } }, "融合"));
          content.appendChild(rowEl);
        }
      }
    }
    /* ---- 道具製作：藥水/靈藥/沙漏 ---- */
    function renderItem() {
      content.innerHTML = "";
      const recipes = [
        { id: "item_pot_hp", name: "生命藥水", icon: "icon_pot_hp", gold: 200, mats: { herb: 5 } },
        { id: "item_pot_mp", name: "魔力藥水", icon: "icon_pot_mp", gold: 200, mats: { herb: 5 } },
        { id: "item_pot_atk", name: "攻擊靈藥", icon: "icon_pot_atk", gold: 500, mats: { iron: 10 } },
        { id: "item_pot_gold", name: "金幣靈藥", icon: "icon_pot_gold", gold: 600, mats: { crystal: 8 } },
        { id: "item_pot_exp", name: "智慧靈藥", icon: "icon_pot_exp", gold: 700, mats: { ember: 8 } },
        { id: "item_hourglass", name: "加速沙漏", icon: "icon_hourglass", gold: 1000, mats: { void: 12, crystal: 12 } }
      ];
      content.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } },
        "消耗素材製作消耗品（與商店/掉落互補）。"));
      for (const r of recipes) {
        const have = st.inventory.items.find(i => i.defId === r.id);
        const qty = have ? (have.qty || 1) : 0;
        const goldOk = st.currencies.gold >= r.gold;
        const matTxt = Object.entries(r.mats).map(([k, n]) => {
          const h = st.mats[k] || 0;
          return MG.ui.dom.h("span", { style: h >= n ? {} : { color: "#ff6b6b", fontWeight: 700 } }, (MG.config.MATS[k] || {}).name + " " + h + "/" + n);
        });
        const can = goldOk && Object.entries(r.mats).every(([k, n]) => (st.mats[k] || 0) >= n);
        content.appendChild(MG.ui.dom.h("div", { class: "row", style: { marginBottom: 6 } },
          MG.ui.dom.icon(r.icon, 22),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, r.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "持有 x" + qty)),
            MG.ui.dom.h("div", { style: { display: "flex", gap: 8, fontSize: 10, color: "var(--dim)", marginTop: 2 } },
              MG.ui.dom.h("span", { style: goldOk ? {} : { color: "#ff6b6b", fontWeight: 700 } }, MG.util.fmt(r.gold) + " 金"), matTxt)),
          MG.ui.dom.h("button", { class: "btn sm " + (can ? "gold" : ""), disabled: !can, on: { click: () => {
            st.currencies.gold -= r.gold;
            for (const k in r.mats) st.mats[k] -= r.mats[k];
            const have2 = st.inventory.items.find(i => i.defId === r.id);
            if (have2) have2.qty = (have2.qty || 0) + 1;
            else st.inventory.items.push({ uid: MG.util.uid(), defId: r.id, tier: 1, qty: 1, gems: [], enhance: 0 });
            MG.core.audio.SFX.buy();
            MG.ui.dom.toast("製作完成：" + r.name + " x1", "good", r.icon);
            renderItem();
          } } }, "製作")));
      }
    }
    render();
  }
  /* 商城（v126）：鑽石購買的道具（招募券/寶袋/更名券等）+ 課金裝備 */
  function openShop() {
    const st = S();
    const m = MG.ui.dom.modal("商城", null, { icon: "icon_gem" });
    const bodyWrap = MG.ui.dom.h("div", null);
    m.panel.appendChild(bodyWrap);
    bodyWrap.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } },
      "商城貨品（鑽石購買）："));
    renderShopList(bodyWrap, st, s => s.price.gems !== undefined, "商城貨品（鑽石購買）：");
    // 課金裝備（鑽石）
    const maxTier = Math.min(9, st.stats.maxTierReached || 1);
    let slotSel = "all";
    bodyWrap.appendChild(MG.ui.dom.h("div", { class: "section-h", style: { margin: "10px 0 6px" } },
      MG.ui.dom.h("span", { class: "t" }, "課金裝備")));
    const slotRow = MG.ui.dom.h("div", { class: "list-scroll", style: { marginBottom: 8 } });
    const slotDefs = [["all", "全部"], ["weapon", "武器"], ["armor", "防具"], ["acc", "飾品"]];
    const slotChips = slotDefs.map(([id, label]) => MG.ui.dom.h("div", { class: "chip" + (slotSel === id ? " on" : ""), on: { click: () => { slotSel = id; slotChips.forEach((c2, k) => c2.className = "chip" + (slotSel === slotDefs[k][0] ? " on" : "")); } } }, label));
    slotChips.forEach(c => slotRow.appendChild(c));
    bodyWrap.appendChild(slotRow);
    const cost = Math.floor(40 * Math.pow(maxTier, 2));
    const buyBtn = MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" },
      on: { click: () => {
        if (st.currencies.gems < cost) { MG.ui.dom.toast("鑽石不足（需 " + MG.util.fmt(cost) + " 鑽石）", "bad", "icon_gem"); return; }
        // 飾品 = 項鍊/戒指/護符 三選一；全部 = 隨機部位
        let slot = slotSel;
        if (slot === "all") slot = undefined;
        else if (slot === "acc") slot = MG.util.pick(["necklace", "ring", "charm"]);
        const it = MG.sys.equipment.gen({ tier: maxTier, cls: undefined, slot });
        if (!MG.sys.equipment.addToInventory(it)) {
          MG.ui.dom.toast("背包已滿，無法購買（可先拆解或強化裝備）", "bad", "icon_hammer");
          return;
        }
        st.currencies.gems -= cost;
        MG.core.audio.SFX.buy();
        MG.ui.dom.toast("購得「" + MG.sys.equipment.nameOf(it) + "」！", "good", "icon_" + MG.sys.equipment.slotOf(it));
      } } }, "購買隨機裝備　" + MG.util.fmt(cost) + " 鑽石");
    bodyWrap.appendChild(buyBtn);
    bodyWrap.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 6 } },
      "稀有度依機率（高階裝備機率較低），已放入背包；也可從背包穿戴給英雄。"));
  }
  /* 村莊市場（v126）：金幣購買的道具（藥水/材料包等） */
  function openMarket() {
    const st = S();
    const m = MG.ui.dom.modal("村莊市場", null, { icon: "b_market" });
    const bodyWrap = MG.ui.dom.h("div", null);
    m.panel.appendChild(bodyWrap);
    bodyWrap.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } },
      "市場貨品（金幣購買，市場等級提升解鎖更多）："));
    renderShopList(bodyWrap, st, s => s.price.gold !== undefined, "市場貨品（金幣購買，市場等級提升解鎖更多）：");
  }
  /* 共享道具列（商城/市場皆用）：依 filter 顯示 SHOP 清單 */
  function renderShopList(bodyWrap, st, filter, title) {
    const shopQty = {};
    const items = MG.data.quests.SHOP.filter(filter);
    function render() {
      const body = bodyWrap;
      body.innerHTML = "";
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } },
        title));
      for (const s of items) {
        const owned = MG.sys.meta.shopOwned(s.id);
        const unit = s.price.gems !== undefined ? s.price.gems : s.price.gold;
        const isGems = s.price.gems !== undefined;
        const price = isGems ? MG.util.fmt(s.price.gems) + " 鑽石" : MG.util.fmt(s.price.gold) + " 金";
        const funds = isGems ? st.currencies.gems : st.currencies.gold;
        const bulkable = !s.oneTime && !owned && !s.use;
        const row = MG.ui.dom.h("div", { class: "row", style: { alignItems: "center" } },
          MG.ui.dom.icon(s.icon, 24),
          MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
              s.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, ownedQty(s))),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
              s.desc + (s.badge && !owned ? "　【" + s.badge + "】" : ""))));
        if (!bulkable) {
          const can = owned ? false : funds >= unit;
          row.appendChild(MG.ui.dom.h("button", { class: "btn sm " + (can ? "gold" : ""), style: { flexShrink: 0, whiteSpace: "nowrap" }, disabled: !can, on: { click: () => { if (MG.sys.meta.buyShop(s.id)) { MG.ui.dom.toast("購買成功：" + s.name, "good", s.icon); render(); } } } }, owned ? "已擁有" : price));
          // 可使用的商品（更名券）：持有時顯示使用按鈕
          if (s.use && (st.currencies.renameTicket || 0) > 0) {
            row.appendChild(MG.ui.dom.h("button", { class: "btn sm blue", style: { flexShrink: 0, whiteSpace: "nowrap" }, on: { click: () => openRenameDialog() } }, "使用 x" + (st.currencies.renameTicket || 0)));
          }
        } else {
          // 批量購買：[-] [xN] [+] + 總價按鈕（數量變動不重繪，僅更新文字）
          let qty = shopQty[s.id] || 1;
          const qtyEl = MG.ui.dom.h("button", { class: "chip", style: { minWidth: 40, flexShrink: 0, justifyContent: "center", padding: "2px 6px", minHeight: 28, fontWeight: 900, fontSize: 12, color: "var(--gold)" }, title: "點擊手動輸入數量", on: { click: () => {
            const v = prompt("輸入購買數量（1-99）", String(qty));
            const n = parseInt(v, 10);
            if (!isNaN(n) && n >= 1 && n <= 99) { qty = Math.floor(n); shopQty[s.id] = qty; refresh(); }
          } } }, "x1");
          const stepBtn = (txt, fn) => MG.ui.dom.h("button", { class: "chip", style: { padding: "2px 9px", minHeight: 28, flexShrink: 0 }, on: { click: fn } }, txt);
          const dec = stepBtn("−", () => { qty = Math.max(1, qty - 1); shopQty[s.id] = qty; refresh(); });
          const inc = stepBtn("+", () => { qty = Math.min(99, qty + 1); shopQty[s.id] = qty; refresh(); });
          const btn = MG.ui.dom.h("button", { class: "btn sm gold", style: { flexShrink: 0, whiteSpace: "nowrap", minWidth: 0 }, on: { click: () => {
            const n = MG.sys.meta.buyShopN(s.id, qty);
            MG.ui.dom.toast(n > 0 ? "購買成功：" + s.name + " ×" + n : "金幣/鑽石不足", n > 0 ? "good" : "bad", s.icon);
            if (n > 0) render();
          } } }, price);
          row.appendChild(dec);
          row.appendChild(qtyEl);
          row.appendChild(inc);
          row.appendChild(btn);
          function refresh() {
            qtyEl.textContent = "x" + qty;
            const total = unit * qty;
            btn.textContent = qty > 1 ? "x" + qty + " · " + MG.util.fmt(total) + (isGems ? " 鑽石" : " 金") : price;
            btn.disabled = funds < unit;
          }
        }
        body.appendChild(row);
      }
      if (!items.length) body.appendChild(MG.ui.dom.h("div", { class: "empty" }, "目前沒有貨品"));
    }
    function ownedQty(s) {
      if (s.oneTime) return s.badge || s.qty;
      if (s.get.pot) {
        const item = st.inventory.items.find(i => i.defId === "item_pot_" + s.get.pot);
        const q = item ? (item.qty || 1) : 0;
        const key = "pot" + (s.get.pot === "atk" ? "Atk" : s.get.pot === "gold" ? "Gold" : s.get.pot === "exp" ? "Exp" : "Mp");
        if (st.buffs[key] && st.buffs[key] > Date.now()) return "使用中";
        return q ? "持有 x" + q : s.qty;
      }
      if (s.get.ticket) return "持有 x" + (st.currencies.ticket || 0);
      if (s.get.renameTicket) return "持有 x" + (st.currencies.renameTicket || 0);
      if (s.get.boost) return (st.buffs.boostUntil || 0) > Date.now() ? "使用中" : s.qty;
      if (s.get.hourglass) {
        const item = st.inventory.items.find(i => i.defId === "item_hourglass");
        const q = item ? (item.qty || 1) : 0;
        if ((st.buffs.boostUntil || 0) > Date.now()) return "使用中";
        return q ? "持有 x" + q : s.qty;
      }
      return s.qty;
    }
    render();
  }
  /* altar / awakening */  /* altar / awakening */  /* altar / awakening */
  function openAltar() {
    const st = S();
    const m = MG.ui.dom.modal("昇華祭壇", null, { icon: "b_altar" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    const aw = st.awakenings || 0;
    const nextHonor = Math.floor((100 + 25 * aw) * MG.sys.buildings.effects().honorMul);
    body.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 8 } },
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 15 } }, "昇華次數：" + aw),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "每次昇華：攻擊 +25%、金幣 +25%、經驗 +5%（永久）"),
      aw > 0 ? MG.ui.dom.h("div", { style: { fontSize: 11, color: "var(--gold)", marginTop: 2 } }, "目前加成：攻擊 +" + (aw * 25) + "%、金幣 +" + (aw * 25) + "%、經驗 +" + (aw * 5) + "%") : null));
    const can = MG.sys.meta.canAwaken();
    const BLDN = { castle: "王城", guild: "酒館", training: "訓練場", forge: "鐵匠鋪" };
    const cave = MG.sys.loot.region(2);
    const caveStage = (st.stats.maxStageByRegion || {})[2] || 0;
    body.appendChild(MG.ui.dom.h("div", { class: "panel2", style: { padding: 8, marginBottom: 8, fontSize: 11 } },
      MG.ui.dom.h("div", { style: { fontWeight: 800, marginBottom: 2 } }, "昇華條件"),
      MG.ui.dom.h("div", null, "・抵達第 3 大關「" + cave.name + "」第 5 波：" + (caveStage >= 5 ? "✓" : "✗ " + (caveStage > 0 ? "目前第 " + caveStage + " 波" : "尚未抵達"))),
      MG.ui.dom.h("div", null, "・3 座建築達 Lv10（王城／公會／訓練場／鐵匠鋪）："),
      MG.ui.dom.h("div", { style: { paddingLeft: 10, fontSize: 10, color: "var(--dim)" } },
        ["castle", "guild", "training", "forge"].map(id => BLDN[id] + " " + (st.buildings[id] || 0) + "/10").join("　"))));
    // v136：犧牲清單（高亮警告）——昇華將重置的一切
    {
      const hCount = (st.hunters || []).length;
      const itCount = (st.inventory.items || []).length;
      const matKinds = Object.keys(st.mats || {}).filter(k => (st.mats[k] || 0) > 0).length;
      const bldLv = Object.entries(st.buildings || {}).reduce((a, [, lv]) => a + (lv || 0), 0);
      const sac = MG.ui.dom.h("div", { style: { border: "2px solid #e05c5c", background: "rgba(224,92,92,0.12)", borderRadius: 10, padding: "8px 10px", marginBottom: 8, fontSize: 11 } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 12, color: "#ff9c9c", marginBottom: 3 } }, "⚠ 昇華將犧牲以下所有東西"),
        MG.ui.dom.h("div", { style: { color: "#ffb4b4", lineHeight: 1.7 } },
          MG.ui.dom.h("div", null, "・英雄 " + hCount + " 名全部解散（等級與星級歸零）"),
          MG.ui.dom.h("div", null, "・所有裝備／寶石／道具共 " + itCount + " 件全部消失"),
          MG.ui.dom.h("div", null, "・金幣 " + MG.util.fmt(st.currencies.gold) + " 與 " + matKinds + " 種素材全部清空"),
          MG.ui.dom.h("div", null, "・建築重置為初始（目前合計 Lv" + bldLv + " 歸零），王國 Lv" + st.kingdom.level + " 重置"),
          MG.ui.dom.h("div", null, "・副本進度回到第 1 大關第 1 波" + (st.hunt.region > 0 || st.hunt.stage > 1 ? "（目前第 " + (st.hunt.region + 1) + " 大關第 " + st.hunt.stage + " 波）" : ""))));
      body.appendChild(sac);
    }
    body.appendChild(MG.ui.dom.h("button", {
      class: "btn pink", style: { width: "100%" },
      disabled: !can,
      on: { click: () => MG.ui.dom.confirm("進行昇華", "昇華將重置英雄、建築、金幣與副本進度，換取永久的昇華之力。確定要獻上一切嗎？", () => { MG.sys.meta.awaken(); m.close(); MG.ui.screens.refreshAll(); }, { danger: true, okText: "昇華！" }) }
    }, "進行昇華"));
    body.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", fontSize: 11, color: "var(--gold)", marginTop: 6, marginBottom: 4 } },
      "下次昇華預估獲得：" + MG.util.fmt(nextHonor) + " 榮譽"));
    body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "榮譽強化")));
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } }, "持有榮譽：" + MG.util.fmt(st.currencies.honor) + "（BOSS與昇華獲得）"));
    for (const [type, name, desc] of [["dmg", "力量印記", "攻擊 +10%/級"], ["gold", "財富印記", "金幣 +10%/級"], ["exp", "智慧印記", "經驗 +5%/級"]]) {
      const lvl = st.honorLvls[type] || 0;
      const cost = MG.sys.meta.honorCost(type);
      body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 8 } },
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "Lv " + lvl + "/5")),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, desc + "（目前 +" + MG.sys.meta.honorBonus(type) + "%）")),
        MG.ui.dom.h("button", { class: "btn sm " + (cost >= 0 && st.currencies.honor >= cost ? "gold" : ""), disabled: cost < 0 || st.currencies.honor < cost, on: { click: () => { if (MG.sys.meta.buyHonor(type)) { MG.ui.dom.toast(name + "升級！", "good", "icon_honor"); openAltar(); m.close(); } } } }, cost < 0 ? "已滿級" : MG.util.fmt(cost) + " 榮譽")));
    }
  }
  /* 更新歷史：展開式列表（收合=版本號+標題、展開=更新內容） */
  function openChangelog() {
    const m = MG.ui.dom.modal("更新歷史", null, { icon: "icon_scroll" });
    const body = m.panel;
    const list = MG.data.changelog || [];
    if (!list.length) {
      body.appendChild(MG.ui.dom.h("div", { class: "empty" }, "尚無更新紀錄"));
      return;
    }
    // v136：預設顯示最新 20 條，更早版本收合
    const SHOW = 20;
    const shown = list.slice(0, SHOW);
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6, textAlign: "center" } },
      "最近 " + shown.length + " 個版本（點擊展開詳細內容）"));
    for (const c of shown) {
      const arrow = MG.ui.dom.h("span", { style: { color: "var(--dim2)", fontSize: 11, width: 14, textAlign: "center" } }, "▸");
      // 更易讀：每條以「・」開頭、項目符號色點、行距 1.6
      const detail = MG.ui.dom.h("div", { style: { display: "none", padding: "2px 10px 12px 14px" } },
        ...c.notes.map(n => MG.ui.dom.h("div", { style: { fontSize: 12, color: "var(--dim)", lineHeight: 1.6, paddingLeft: 12, position: "relative", marginTop: 3 } },
          MG.ui.dom.h("span", { style: { position: "absolute", left: 0, top: 7, width: 4, height: 4, borderRadius: "50%", background: "var(--gold2)" } }), n)));
      let open = false;
      const row = MG.ui.dom.h("div", { class: "row", style: { padding: "9px 10px", cursor: "pointer", marginBottom: 6 }, on: { click: () => {
        open = !open;
        detail.style.display = open ? "" : "none";
        arrow.textContent = open ? "▾" : "▸";
        MG.core.audio.SFX.click();
      } } },
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 12, color: "var(--gold)", background: "rgba(255,209,102,.12)", borderRadius: 6, padding: "2px 7px", marginRight: 8, whiteSpace: "nowrap" } }, c.v),
        MG.ui.dom.h("div", { class: "grow", style: { fontWeight: 800, fontSize: 13 } }, c.title),
        arrow);
      body.appendChild(row);
      body.appendChild(detail);
    }
    if (list.length > SHOW) {
      const more = list.length - SHOW;
      const extra = MG.ui.dom.h("div", { style: { display: "none", padding: "2px 10px 12px 14px" } },
        ...list.slice(SHOW).map(c => MG.ui.dom.h("div", { style: { fontSize: 12, color: "var(--dim)", lineHeight: 1.6, paddingLeft: 12, position: "relative", marginTop: 3 } },
          MG.ui.dom.h("span", { style: { position: "absolute", left: 0, top: 7, width: 4, height: 4, borderRadius: "50%", background: "var(--dim2)" } }), c.v + "　" + c.title)));
      let extraOpen = false;
      const moreRow = MG.ui.dom.h("div", { class: "row", style: { padding: "9px 10px", cursor: "pointer", opacity: 0.75 }, on: { click: () => {
        extraOpen = !extraOpen;
        extra.style.display = extraOpen ? "" : "none";
        MG.core.audio.SFX.click();
      } } },
        MG.ui.dom.h("div", { class: "grow", style: { fontWeight: 800, fontSize: 12, color: "var(--dim)" } }, "更早 " + more + " 個版本（僅版本與標題）"),
        MG.ui.dom.h("span", { style: { color: "var(--dim2)", fontSize: 11 } }, extraOpen ? "▾" : "▸"));
      body.appendChild(moreRow);
      body.appendChild(extra);
    }
  }
  /* 裝備掉落通知規則（v136）：稀有度/套裝/部位多選 */
  function openEquipNotifyRules() {
    const st = S();
    const nf = st.settings.notify;
    if (!nf.equipRules) nf.equipRules = { rarity: {}, sets: {}, slots: {} };
    const rules = nf.equipRules;
    if (!rules.rarity) rules.rarity = {};
    if (!rules.sets) rules.sets = {};
    if (!rules.slots) rules.slots = {};
    const m = MG.ui.dom.modal("裝備通知設定", null, { icon: "icon_chest" });
    const body = m.panel;
    const sections = [];
    const mkChip = (on, label, onClick) => MG.ui.dom.h("div", { class: "chip" + (on ? " on" : ""), style: { fontSize: 11 }, on: { click: onClick } }, label);
    function render() {
      body.innerHTML = "";
      const section = (t) => body.appendChild(MG.ui.dom.h("div", { class: "section-h", style: { margin: "6px 0 4px" } }, MG.ui.dom.h("span", { class: "t" }, t)));
      const row = () => MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 } });
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 4 } },
        "勾選要通知的條件（未勾選任何 = 全部通知）："));
      section("稀有度");
      const rRow = row();
      MG.config.RARITY.forEach((r, i) => rRow.appendChild(mkChip(!!rules.rarity[i + 1], "★" + (i + 1), () => { rules.rarity[i + 1] = !rules.rarity[i + 1]; render(); })));
      body.appendChild(rRow);
      section("套裝");
      const sRow = row();
      sRow.appendChild(mkChip(!!rules.sets.none, "無套裝", () => { rules.sets.none = !rules.sets.none; render(); }));
      Object.keys(ED2().sets || {}).forEach(k => sRow.appendChild(mkChip(!!rules.sets[k], (ED2().sets[k] || {}).name || k, () => { rules.sets[k] = !rules.sets[k]; render(); })));
      body.appendChild(sRow);
      section("部位");
      const slRow = row();
      MG.config.SLOTS.forEach(sl => slRow.appendChild(mkChip(!!rules.slots[sl], MG.config.SLOT_NAMES[sl], () => { rules.slots[sl] = !rules.slots[sl]; render(); })));
      body.appendChild(slRow);
      body.appendChild(MG.ui.dom.h("button", { class: "btn gold m-close-btn", on: { click: () => m.close() } }, "完成"));
    }
    function ED2() { return MG.data.equipment; }
    render();
  }
  /* settings */
  function openSettings() {
    const st = S();
    const m = MG.ui.dom.modal("設定", null, {});
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    const toggle = (label, key, cb) => {
      // 方框勾選（v130 取代 iOS 切換開關）
      const row = MG.ui.dom.h("div", { class: "row", on: { click: () => { pressFx(row); st.settings[key] = !st.settings[key]; MG.core.audio.SFX.click(); cb && cb(); renderRow(); } } },
        MG.ui.dom.h("div", { class: "grow", style: { fontWeight: 800, fontSize: 13 } }, label),
        MG.ui.dom.h("div", { class: "chk" + (st.settings[key] ? " on" : "") }, st.settings[key] ? "✓" : ""));
      function renderRow() {
        const c = row.querySelector(".chk");
        c.className = "chk" + (st.settings[key] ? " on" : "");
        c.textContent = st.settings[key] ? "✓" : "";
      }
      return row;
    };
    const section = t => body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, t)));
    section("聲音與顯示");
    body.appendChild(toggle("音效", "sound", () => MG.core.audio.refreshMusic()));
    body.appendChild(toggle("音樂", "music", () => MG.core.audio.refreshMusic()));
    body.appendChild(toggle("減少動畫效果", "reducedMotion"));
    section("冒險");
    body.appendChild(MG.ui.dom.h("div", { class: "row", on: { click: (e) => { pressFx(e.currentTarget); MG.ui.tutorial.start(true); m.close(); } } },
      MG.ui.dom.icon("icon_book", 18),
      MG.ui.dom.h("div", { class: "grow" },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, "重播教學"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "重新引導王國運作方式"))));
    section("自動喝水");
    // 自動喝水：開關（預設 50%）＋ 閾值 chips（30/50/70/90）
    const autoPot = (label, key, icon) => {
      const ap = st.settings.autoPotion;
      const row = MG.ui.dom.h("div", { class: "row", on: { click: () => { pressFx(row); ap[key] = ap[key] > 0 ? 0 : 50; MG.core.audio.SFX.click(); render(); } } },
        MG.ui.dom.icon(icon, 18),
        MG.ui.dom.h("div", { class: "grow", style: { fontWeight: 800, fontSize: 13 } }, label,
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, ap[key] > 0 ? "低於 " + ap[key] + "% 自動飲用" : "關閉（手動飲用）")),
        MG.ui.dom.h("div", { class: "chk" + (ap[key] > 0 ? " on" : "") }, ap[key] > 0 ? "✓" : ""));
      const chipRow = MG.ui.dom.h("div", { class: "list-scroll", style: { padding: "0 10px 8px", display: ap[key] > 0 ? "" : "none" } });
      const mkChip = v => MG.ui.dom.h("div", { class: "chip" + (ap[key] === v ? " on" : ""), on: { click: () => { ap[key] = v; MG.core.audio.SFX.click(); render(); } } }, v + "%");
      const chips = [30, 50, 70, 90].map(mkChip);
      chips.forEach(c => chipRow.appendChild(c));
      function render() {
        row.querySelector(".sub").textContent = ap[key] > 0 ? "低於 " + ap[key] + "% 自動飲用" : "關閉（手動飲用）";
        const c = row.lastElementChild; // 最後一個 child = 勾選框
        c.className = "chk" + (ap[key] > 0 ? " on" : "");
        c.textContent = ap[key] > 0 ? "✓" : "";
        chipRow.style.display = ap[key] > 0 ? "" : "none";
        chips.forEach(c => c.className = "chip" + (ap[key] === parseInt(c.textContent, 10) ? " on" : ""));
      }
      body.appendChild(row);
      body.appendChild(chipRow);
    };
    autoPot("自動喝生命藥水", "hp", "icon_pot_hp");
    autoPot("自動喝魔力藥水", "mp", "icon_pot_mp");
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, padding: "0 10px 4px" } }, "任一陣營英雄低於閾值時自動消耗藥水（1 秒冷卻，連續飲用直到達標）"));
    section("通知");
    // 戰利品通知：可獨立選擇哪些物品掉落要跳出通知
    const notifyRow = (label, key, icon) => {
      const row = MG.ui.dom.h("div", { class: "row", on: { click: () => { pressFx(row); st.settings.notify[key] = !st.settings.notify[key]; MG.core.audio.SFX.click(); renderN(); } } },
        MG.ui.dom.icon(icon, 18),
        MG.ui.dom.h("div", { class: "grow", style: { fontWeight: 800, fontSize: 13 } }, label),
        MG.ui.dom.h("div", { class: "chk" + (st.settings.notify[key] ? " on" : "") }, st.settings.notify[key] ? "✓" : ""));
      function renderN() {
        const c = row.lastElementChild;
        c.className = "chk" + (st.settings.notify[key] ? " on" : "");
        c.textContent = st.settings.notify[key] ? "✓" : "";
      }
      body.appendChild(row);
    };
    notifyRow("生命/魔力藥水掉落通知", "potion", "icon_pot_hp");
    // v136 裝備掉落通知：開關 + 左側設定按鈕（稀有度/套裝/部位多選）
    {
      const eqRow = MG.ui.dom.h("div", { class: "row", on: { click: () => { pressFx(eqRow); st.settings.notify.equip = !st.settings.notify.equip; MG.core.audio.SFX.click(); renderN(); } } },
        MG.ui.dom.icon("icon_chest", 18),
        MG.ui.dom.h("div", { class: "grow", style: { fontWeight: 800, fontSize: 13 } }, "裝備掉落通知"),
        MG.ui.dom.h("button", { class: "btn sm", style: { padding: "2px 10px", minHeight: 26 }, on: { click: (e) => { e.stopPropagation(); openEquipNotifyRules(); } } }, "設定"),
        MG.ui.dom.h("div", { class: "chk" + (st.settings.notify.equip ? " on" : "") }, st.settings.notify.equip ? "✓" : ""));
      body.appendChild(eqRow);
      function renderN() {
        const c = eqRow.lastElementChild;
        c.className = "chk" + (st.settings.notify.equip ? " on" : "");
        c.textContent = st.settings.notify.equip ? "✓" : "";
      }
    }
    notifyRow("寶石掉落通知", "gem", "icon_gem");
    notifyRow("技能書掉落通知", "book", "icon_book");
    section("存檔管理");
    body.appendChild(MG.ui.dom.h("div", { class: "row", on: { click: (e) => {
      pressFx(e.currentTarget);
      const code = MG.core.save.exportSave();
      const showCode = () => prompt("自動複製失敗 — 請手動複製存檔碼：", code);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => MG.ui.dom.toast("存檔碼已複製！", "good", "icon_check")).catch(showCode);
      } else showCode();
    } } },
      MG.ui.dom.icon("icon_scroll", 18),
      MG.ui.dom.h("div", { class: "grow" },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, "匯出存檔"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "複製存檔碼以備份冒險"))));
    body.appendChild(MG.ui.dom.h("div", { class: "row", on: { click: (e) => {
      pressFx(e.currentTarget);
      const code = prompt("貼上存檔碼以匯入：");
      if (code && MG.core.save.importSave(code)) { MG.ui.dom.toast("匯入成功！", "good", "icon_check"); m.close(); MG.ui.screens.refreshAll(); }
      else MG.ui.dom.toast("匯入失敗", "bad", "icon_close");
    } } },
      MG.ui.dom.icon("icon_plus", 18),
      MG.ui.dom.h("div", { class: "grow" },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, "匯入存檔"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "貼上存檔碼繼續冒險"))));
    body.appendChild(MG.ui.dom.h("div", { class: "row", on: { click: (e) => { pressFx(e.currentTarget); MG.ui.dom.confirm("清空存檔並重新開始", "將刪除王國的所有進度（英雄、裝備、建築、金幣），重新展開旅程。此操作無法復原！", () => { MG.core.save.reset(); MG.ui.dom.toast("王國已重建，旅程重新開始！", "", "icon_offline"); }) } } },
      MG.ui.dom.icon("icon_close", 18),
      MG.ui.dom.h("div", { class: "grow" },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13, color: "var(--bad)" } }, "清空存檔並重新開始"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "刪除全部進度，從零打造王國"))));
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 10, fontSize: 10 } }, "放置王國 MEGA IDLE v" + MG.config.VERSION));
  }
  MG.ui.screens.register("more", screen);
  return { ...screen, openSettings, openShop, openMarket, openAltar, openForge, openRenameDialog, openEquipNotifyRules, openChangelog };
})();
