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
        menuRow("icon_shop", "商店", "靈藥、招募券與寶袋", () => openShop()),
        menuRow("icon_chest", "素材總覽", "全部素材持有量與獲取管道", () => openMats()),
        menuRow("icon_train", "覺醒祭壇", "輪迴之力，永久強化", () => openAltar()),
        menuRow("icon_settings", "設定", "音效、存檔與其他", () => openSettings()),
        menuRow("icon_book", "關於王國", "梅根的傳說", () => openAbout())));
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
  /* shop */
  function openShop() {
    const st = S();
    const m = MG.ui.dom.modal("商店", null, {});
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    if ((st.buildings.market || 0) < 1) body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 12 } }, "建造「市場」後開放更多貨品。"));
    for (const s of QD.SHOP) {
      const owned = MG.sys.meta.shopOwned(s.id);
      const unit = s.price.gems !== undefined ? s.price.gems : s.price.gold;
      const isGems = s.price.gems !== undefined;
      const price = isGems ? MG.util.fmt(s.price.gems) + " 鑽石" : MG.util.fmt(s.price.gold) + " 金";
      const funds = isGems ? st.currencies.gems : st.currencies.gold;
      const bulkable = !s.oneTime && !owned;
      const row = MG.ui.dom.h("div", { class: "row" },
        MG.ui.dom.icon(s.icon, 24),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, s.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, ownedQty(s))),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, s.desc + (s.badge && !owned ? "　【" + s.badge + "】" : ""))));
      if (!bulkable) {
        const can = owned ? false : funds >= unit;
        row.appendChild(MG.ui.dom.h("button", { class: "btn sm " + (can ? "gold" : ""), disabled: !can, on: { click: () => { if (MG.sys.meta.buyShop(s.id)) { MG.ui.dom.toast("購買成功：" + s.name, "good", s.icon); openShop(); m.close(); } } } }, owned ? "已擁有" : price));
      } else {
        // 批量購買：[-] [xN] [+] + 總價按鈕
        let qty = 1;
        const qtyEl = MG.ui.dom.h("button", { class: "chip", style: { minWidth: 34, justifyContent: "center", padding: "2px 6px", minHeight: 28, fontWeight: 900, fontSize: 12, color: "var(--gold)" }, title: "點擊手動輸入數量", on: { click: () => {
          const v = prompt("輸入購買數量（1-99）", String(qty));
          const n = parseInt(v, 10);
          if (!isNaN(n) && n >= 1 && n <= 99) { qty = Math.floor(n); refresh(); }
        } } }, "x1");
        const stepBtn = (txt, fn) => MG.ui.dom.h("button", { class: "chip", style: { padding: "2px 9px", minHeight: 28 }, on: { click: fn } }, txt);
        const dec = stepBtn("−", () => { qty = Math.max(1, qty - 1); refresh(); });
        const inc = stepBtn("+", () => { qty = Math.min(99, qty + 1); refresh(); });
        const btn = MG.ui.dom.h("button", { class: "btn sm gold", on: { click: () => {
          const n = MG.sys.meta.buyShopN(s.id, qty);
          MG.ui.dom.toast(n > 0 ? "購買成功：" + s.name + " ×" + n : "金幣/鑽石不足", n > 0 ? "good" : "bad", s.icon);
          if (n > 0) { openShop(); m.close(); }
        } } }, price);
        row.appendChild(dec);
        row.appendChild(qtyEl);
        row.appendChild(inc);
        row.appendChild(btn);
        function refresh() {
          qtyEl.textContent = "x" + qty;
          const total = unit * qty;
          btn.textContent = qty > 1 ? "x" + qty + " · " + MG.util.fmt(total) + (isGems ? " 鑽石" : " 金") : price;
          btn.disabled = funds < unit; // 至少買得起 1 個才可點（批量會自動停在不夠處）
        }
      }
      body.appendChild(row);
    }
    function ownedQty(s) {
      if (s.oneTime) return s.badge || s.qty;
      if (s.get.pot) {
        const item = st.inventory.items.find(i => i.defId === "item_pot_" + s.get.pot);
        const q = item ? (item.qty || 1) : 0;
        const key = "pot" + (s.get.pot === "atk" ? "Atk" : s.get.pot === "gold" ? "Gold" : "Exp");
        if (st.buffs[key] && st.buffs[key] > Date.now()) return "使用中";
        return q ? "持有 x" + q : s.qty;
      }
      if (s.get.ticket) return "持有 x" + (st.currencies.ticket || 0);
      if (s.get.boost) return (st.buffs.boostUntil || 0) > Date.now() ? "使用中" : s.qty;
      if (s.get.hourglass) {
        const item = st.inventory.items.find(i => i.defId === "item_hourglass");
        const q = item ? (item.qty || 1) : 0;
        if ((st.buffs.boostUntil || 0) > Date.now()) return "使用中";
        return q ? "持有 x" + q : s.qty;
      }
      return s.qty;
    }
  }
  /* altar / awakening */
  function openAltar() {
    const st = S();
    const m = MG.ui.dom.modal("覺醒祭壇", null, { icon: "b_altar" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    const aw = st.awakenings || 0;
    const nextHonor = Math.floor((100 + 25 * aw) * MG.sys.buildings.effects().honorMul);
    body.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 8 } },
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 15 } }, "覺醒次數：" + aw),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "每次覺醒：攻擊 +25%、金幣 +25%、經驗 +5%（永久）"),
      aw > 0 ? MG.ui.dom.h("div", { style: { fontSize: 11, color: "var(--gold)", marginTop: 2 } }, "目前加成：攻擊 +" + (aw * 25) + "%、金幣 +" + (aw * 25) + "%、經驗 +" + (aw * 5) + "%") : null));
    const can = MG.sys.meta.canAwaken();
    const BLDN = { castle: "王城", guild: "酒館", training: "訓練場", forge: "鐵匠鋪" };
    body.appendChild(MG.ui.dom.h("div", { class: "panel2", style: { padding: 8, marginBottom: 8, fontSize: 11 } },
      MG.ui.dom.h("div", { style: { fontWeight: 800, marginBottom: 2 } }, "覺醒條件"),
      MG.ui.dom.h("div", null, "・抵達第 35 關：" + (st.stats.maxStage >= 35 ? "✓" : "✗ 目前 " + st.stats.maxStage)),
      MG.ui.dom.h("div", null, "・3 座建築達 Lv10（王城／公會／訓練場／鐵匠鋪）："),
      MG.ui.dom.h("div", { style: { paddingLeft: 10, fontSize: 10, color: "var(--dim)" } },
        ["castle", "guild", "training", "forge"].map(id => BLDN[id] + " " + (st.buildings[id] || 0) + "/10").join("　"))));
    body.appendChild(MG.ui.dom.h("button", {
      class: "btn pink", style: { width: "100%" },
      disabled: !can,
      on: { click: () => MG.ui.dom.confirm("進行覺醒", "覺醒將重置獵人、建築、金幣與狩獵進度，換取永久的覺醒之力。確定要獻上一切嗎？", () => { MG.sys.meta.awaken(); m.close(); MG.ui.screens.refreshAll(); }, { danger: true, okText: "覺醒！" }) }
    }, "進行覺醒"));
    body.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", fontSize: 11, color: "var(--gold)", marginTop: 6, marginBottom: 4 } },
      "下次覺醒預估獲得：" + MG.util.fmt(nextHonor) + " 榮譽"));
    body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "榮譽強化")));
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } }, "持有榮譽：" + MG.util.fmt(st.currencies.honor) + "（首領與覺醒獲得）"));
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
  /* materials overview */
  const MAT_SRC = {
    iron: "灰燼洞穴掉落・分解裝備・離線",
    herb: "翠綠草原/幽暗森林・分解・離線",
    leather: "翠綠草原/灰燼洞穴/冰封高原・分解・離線",
    crystal: "幽暗森林/蒼穹之塔・分解・離線",
    ember: "烈焰火山・分解・離線",
    ice: "冰封高原・分解・離線",
    poison: "黃沙荒漠/詛咒沼澤・分解・離線",
    void: "詛咒沼澤/深淵裂谷・分解・離線",
    myth: "蒼穹之塔/神話之域・分解・離線"
  };
  function openMats() {
    const st = S();
    const body = MG.ui.dom.h("div", null,
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } },
        "素材用於建築升級、獵人突破與裝備合成。所有素材皆可從「分解裝備」與「離線獎勵」獲得，後期區域也會少量掉落前期素材。"),
      ...Object.keys(MG.config.MATS).map(mid => {
        const d = MG.config.MATS[mid];
        return MG.ui.dom.h("div", { class: "row", style: { padding: 8 } },
          MG.ui.dom.icon(d.icon, 22),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, d.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "T" + d.tier)),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, MAT_SRC[mid] || "")),
          MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 13, color: "var(--gold)" } }, MG.util.fmt(st.mats[mid] || 0)));
      }));
    MG.ui.dom.modal("素材總覽", body, { wide: true, icon: "icon_chest" });
  }
  /* settings */
  function openSettings() {
    const st = S();
    const m = MG.ui.dom.modal("設定", null, {});
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    const toggle = (label, key, cb) => {
      // iOS 樣式切換方塊：51×31 軌道 + 27px 圓鈕 + 完整動畫（彈性滑動+拉伸+按壓）
      const IOS_ON = "#34c759", IOS_OFF = "rgba(120,120,128,0.32)";
      const row = MG.ui.dom.h("div", { class: "row", on: { click: () => { pressFx(row); st.settings[key] = !st.settings[key]; MG.core.audio.SFX.click(); cb && cb(); renderRow(); } } },
        MG.ui.dom.h("div", { class: "grow", style: { fontWeight: 800, fontSize: 13 } }, label),
        MG.ui.dom.h("div", { style: { width: 51, height: 31, borderRadius: 16, background: st.settings[key] ? IOS_ON : IOS_OFF, position: "relative", transition: "background .2s ease", flex: "0 0 auto", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.04)" } },
          MG.ui.dom.h("div", { class: "ios-knob", style: { position: "absolute", top: 2, left: st.settings[key] ? 22 : 2, width: 27, height: 27, borderRadius: 14, background: "#ffffff", transition: "left .28s cubic-bezier(.3,1.4,.4,1)", boxShadow: "0 3px 8px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.16)" } })));
      function renderRow() {
        const track = row.querySelector("div:last-child");
        const knob = track.querySelector(".ios-knob");
        track.style.background = st.settings[key] ? IOS_ON : IOS_OFF;
        knob.style.left = st.settings[key] ? "22px" : "2px";
        // iOS 滑動拉伸動畫（重啟以連續觸發）
        knob.style.animation = "none";
        void knob.offsetWidth;
        knob.style.animation = (st.settings[key] ? "iosKnobOn" : "iosKnobOff") + " .32s cubic-bezier(.3,1.2,.4,1)";
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
    body.appendChild(MG.ui.dom.h("div", { class: "row", on: { click: (e) => { pressFx(e.currentTarget); MG.ui.dom.confirm("清空存檔並重新開始", "將刪除王國的所有進度（獵人、裝備、建築、金幣），重新展開旅程。此操作無法復原！", () => { MG.core.save.reset(); MG.ui.dom.toast("王國已重建，旅程重新開始！", "", "icon_offline"); }) } } },
      MG.ui.dom.icon("icon_close", 18),
      MG.ui.dom.h("div", { class: "grow" },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13, color: "var(--bad)" } }, "清空存檔並重新開始"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "刪除全部進度，從零打造王國"))));
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 10, fontSize: 10 } }, "放置王國 MEGA IDLE v" + MG.config.VERSION));
  }
  function openAbout() {
    const m = MG.ui.dom.modal("關於王國", null, { icon: "icon_castle" });
    m.panel.appendChild(MG.ui.dom.h("div", { style: { fontSize: 13, color: "var(--dim)", lineHeight: 1.7, padding: "0 4px" } },
      "祖父曾是這片大陸上最偉大的獵人王。他留下的，只有一座頹敗的王城、一本破舊的酒館帳本，與一句話：\n\n「梅根的獵人，從不低頭。」\n\n你繼承了這座王國。招募獵人、討伐魔物、鍛造神器，讓酒館的名字，重新響徹十個狩獵場。\n\n魔物會越來越強，但你的王國，也會越來越偉大。\n\n—— 放置王國 MEGA IDLE · 原創像素冒險"));
  }
  MG.ui.screens.register("more", screen);
  return { ...screen, openSettings, openShop, openAltar };
})();
