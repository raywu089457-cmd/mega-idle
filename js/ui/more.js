/* 放置王國 MEGA IDLE — more screen: quests, achievements, codex, check-in, shop, altar, settings (slice B5 owns) */
"use strict";
MG.ui = MG.ui || {};
MG.ui.more = (function () {
  const QD = MG.data.quests;
  const S = () => MG.game.state;
  const screen = {
    render(root) {
      root.innerHTML = "";
      // v258 磁磚自訂排序（settings.tileOrder — 缺省=現行順序；編輯模式 ↑↓ 微調）
      const TILE_DEFS = [
        ["icon_quest", "任務", () => openQuests(), "daily", "主線/每日/每週任務與領獎"],
        ["icon_ach", "成就", () => openAch(), "ach", "長期目標階梯，達成領鑽石"],
        ["icon_codex", "圖鑑", () => openCodex(), "codex", "魔物/裝備/素材收集里程碑"],
        ["icon_check", "每日簽到", () => openCheckin(), "checkin", "每月 30 天簽到，滿月慶典大獎"],
        ["icon_shop", "商城", () => openShop(), null, "鑽石購買招募券/靈藥/神器"],
        ["icon_honor", "競技場", () => openArena(), "arena", "10 人天梯，週結算領鑽石"],
        ["icon_honor", "王者競技場", () => openRoyal(), "royal", "三隊制週迴圈，積分換王者幣"],
        ["icon_honor", "榮譽商店", () => openHonorShop(), null, "榮譽兌換稀有資源（週限）"],
        ["icon_chest", "限時活動", () => openEvents(), "events", "週輪換狩獵/討伐祭，點數兌好康"],
        ["icon_sword", "試煉秘境", () => openDungeon(), "dungeon", "每日 3 次高額金幣/經驗副本"],
        ["icon_castle", "公會", () => openGuild(), null, "捐獻升科技，每週首領戰"],
        ["icon_skull", "世界首領", () => openWorldboss(), "worldboss", "每日 3 次討伐，總傷里程碑"],
        ["icon_skull", "無盡深淵", () => openAbyss(), "abyss", "無限挑戰，深層里程碑＋週結算"],
        ["icon_tower", "元素試煉", () => openTower(), "tower", "每週 15 層元素關卡"],
        ["icon_recruit", "七日豪禮", () => openWelcome(), "welcome", "新手七日任務，最終自選傳說"],
        ["icon_tower", "奇境迷宮", () => openMaze(), "maze", "週限 roguelike，路線選擇"],
        ["icon_chest", "委託遠征營", () => openExpedition(), "exped", "板凳英雄定時委託，牆鐘結算"],
        ["icon_settings", "設定", () => openSettings(), null, "聲音/自動喝水/通知/存檔管理"],
        ["icon_scroll", "更新歷史", () => openChangelog(), null, "版本紀錄與更新內容"]
      ];
      const st = S();
      const byName = {};
      for (const d of TILE_DEFS) byName[d[1]] = d;
      let editMode = false;
      const grid = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 } });
      const renderGrid = () => {
        grid.innerHTML = "";
        const cur = (S().settings && Array.isArray(S().settings.tileOrder)) ? S().settings.tileOrder : [];
        const curList = [];
        const seen2 = {};
        for (const n of cur) { if (byName[n] && !seen2[n]) { curList.push(byName[n]); seen2[n] = 1; } }
        for (const d of TILE_DEFS) if (!seen2[d[1]]) curList.push(d);
        for (let i = 0; i < curList.length; i++) {
          const d = curList[i];
          const cell = MG.ui.dom.h("div", { style: { position: "relative" } }, tile(d[0], d[1], d[2], d[3], d[4]));
          if (editMode) {
            cell.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 2, marginTop: 2 } },
              MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1, minHeight: 24, padding: 0, fontSize: 10 }, on: { click: () => { moveTile(i, -1); renderGrid(); } } }, "▲"),
              MG.ui.dom.h("button", { class: "btn sm", style: { flex: 1, minHeight: 24, padding: 0, fontSize: 10 }, on: { click: () => { moveTile(i, 1); renderGrid(); } } }, "▼")));
          }
          grid.appendChild(cell);
        }
      };
      const moveTile = (i, d) => {
        const cur = (S().settings && Array.isArray(S().settings.tileOrder)) ? S().settings.tileOrder : [];
        const list = [];
        const seen3 = {};
        for (const n of cur) { if (byName[n] && !seen3[n]) { list.push(n); seen3[n] = 1; } }
        for (const dd of TILE_DEFS) if (!seen3[dd[1]]) list.push(dd[1]);
        const j = i + d;
        if (j < 0 || j >= list.length) return;
        const tmp = list[i]; list[i] = list[j]; list[j] = tmp;
        S().settings.tileOrder = list;
        MG.core.save.save(); // v258：走存檔系統（含 normalize 過濾兜底）
      };
      renderGrid();
      const sortBtn = MG.ui.dom.h("button", { class: "btn sm", style: { marginLeft: "auto", minHeight: 26, padding: "2px 10px", fontSize: 10 }, on: { click: () => { editMode = !editMode; sortBtn.textContent = editMode ? "完成" : "排序 ▸"; renderGrid(); } } }, "排序 ▸"); // v258FIX：標籤隨 editMode 更新（原固定「排序 ▸」）
      root.appendChild(MG.ui.dom.h("div", { style: { padding: "12px 12px 80px" } },
        MG.ui.dom.h("div", { class: "title", style: { marginBottom: 12, display: "flex", alignItems: "center", gap: 8 } }, "冒險手冊", sortBtn),
        grid));
    },
    refresh() {
      // v164 紅點：可領取來源顯示紅點（2Hz tick 呼叫）
      if (!MG.sys.badges) return;
      const b = MG.sys.badges.check();
      // v236 語意分流：claim（可領取）= 紅點、soft（每日/週期次數型）= 藍點 — 終結恆亮紅點疲勞
      // v246：wbweek（每週討伐里程碑可領）claim 優先於 worldboss soft；tower 歸 soft
      const map = { daily: b.daily || b.weekly, ach: b.ach, checkin: b.checkin, events: b.events, abyss: b.abyss, welcome: b.welcome, worldboss: b.wbweek ? "c" : b.worldboss ? "s" : "", codex: b.codex, arena: b.arena, dungeon: b.dungeon, tower: b.tower ? "s" : "", royal: b.royal ? "s" : "", maze: b.maze ? "s" : "", exped: b.exped ? "s" : "" }; // v231；v261 王者；v265 迷宮；v271 遠征 soft
      const titles = { worldboss: "免費次數可用", arena: "免費次數可用", dungeon: "免費次數可用", tower: "本週元素試煉未通關", royal: "本週王者競技場可挑戰", maze: "本週奇境迷宮可探索", exped: "委託遠征營有空閒欄位/待結算" };
      for (const k in map) {
        const el = document.querySelector('[data-badge="' + k + '"]');
        if (el) {
          const v = map[k];
          el.style.display = v ? "" : "none";
          el.style.background = v === "c" ? "#ff5c5c" : v === "s" ? "#4da3ff" : "";
          el.title = v === "s" ? (titles[k] || "可用") : ""; // v246FIX：非 soft 時清 title（原殘留「免費次數可用」）
        }
      }
    }
  };
  /* v171 UI/UX：功能磁磚（2 欄網格，紅點掛在圖示右上） */
  function tile(ic, name, cb, badgeKey, tip) {
    return MG.ui.dom.h("div", {
      class: "row", style: { padding: "12px 6px 10px", flexDirection: "column", gap: 6, textAlign: "center", cursor: "pointer" },
      title: tip || "",
      on: { click: cb }
    },
      MG.ui.dom.h("div", { style: { position: "relative" } },
        MG.ui.dom.icon(ic, 30),
        badgeKey ? MG.ui.dom.h("span", { "data-badge": badgeKey, style: { position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#ff5c5c", border: "1px solid #14121f", display: "none" } }) : null),
      MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, name));
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
  /* v150 競技場：10 人天梯、每日 5 次挑戰、每週一結算重置 */
  /* v240 防守編隊編輯：從名冊選 5 人（允許與出戰隊重疊 — 只讀快照戰力；dangling 過濾）
     v240FIX：onClose 回呼 — 編輯後重繪底層競技場彈窗（原顯示舊陣容） */
  function openDefenseEditor(onClose) {
    const st = S();
    const A = MG.sys.arena;
    const m = MG.ui.dom.modal("防守編隊", null, { icon: "icon_honor", onClose: () => { if (onClose) onClose(); } });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    function render() {
      const picked = A.defenseIds();
      body.innerHTML = "";
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 8, textAlign: "center" } },
        "離線期間的防守陣容（每日最多 3 波挑戰）。防守結果不影響你的名次 — 純防禦榮譽收入。"));
      // v255 一鍵最強 5 人（依戰力排序填防守隊 — 與手動同契約）
      body.appendChild(MG.ui.dom.h("button", {
        class: "btn sm blue", style: { width: "100%", marginBottom: 8, minHeight: 30 },
        on: { click: () => {
          const top5 = st.hunters.slice().sort((a, b) => MG.sys.hunters.power(b) - MG.sys.hunters.power(a)).slice(0, 5).map(h => h.id);
          A.setDefenseTeam(top5);
          MG.ui.dom.toast("防守隊已設為最強 5 人", "good", "icon_honor");
          render();
        } }
      }, "自動最強 5 人"));
      const heroes = st.hunters;
      if (!heroes.length) { body.appendChild(MG.ui.dom.h("div", { class: "empty" }, "尚無英雄")); return; }
      body.appendChild(MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, maxHeight: 320, overflowY: "auto" } },
        heroes.map(h => {
          const on = picked.includes(h.id);
          return MG.ui.dom.h("div", { class: "row", style: { padding: "5px 7px", opacity: on ? 1 : 0.55, cursor: "pointer" }, on: { click: () => {
            const cur = A.defenseIds();
            if (on) A.setDefenseTeam(cur.filter(id => id !== h.id));
            else if (cur.length < 5) A.setDefenseTeam(cur.concat(h.id));
            else MG.ui.dom.toast("防守編隊最多 5 人", "bad", "icon_honor");
            render();
          } } },
            MG.ui.dom.icon(MG.data.hunters.classes[h.cls].icon, 20),
            MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 11 } }, h.name),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9 } }, MG.data.hunters.classes[h.cls].name + "・" + MG.util.fmt(MG.sys.hunters.power(h)) + " 戰力")),
            on ? MG.ui.dom.h("span", { style: { color: "var(--good)", fontWeight: 900 } }, "✓") : null);
        })));
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, textAlign: "center", marginTop: 8 } },
        "已選 " + picked.length + "/5 · 防守戰力 " + MG.util.fmt(A.defensePower())));
    }
    render();
  }
  function openArena() {
    const st = S();
    const A = MG.sys.arena;
    A.ensure();
    const m = MG.ui.dom.modal("競技場", null, { wide: true, icon: "icon_honor" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    function doFight(i) {
      const r = A.fight(i);
      if (!r.ok) { MG.ui.dom.toast(r.reason, "bad", "icon_honor"); return; }
      const parts = [];
      if (r.win) parts.push("勝利！名次升至第 " + r.rank + " 名");
      else parts.push("敗北，名次維持第 " + r.rank + " 名");
      if (r.gems) parts.push("+" + r.gems + " 鑽石");
      if (r.honor) parts.push("+" + r.honor + " 榮譽");
      MG.core.audio.SFX.victory();
      MG.ui.dom.toast(parts.join("　"), r.win ? "good" : "bad", "icon_honor");
      render();
    }
    function render() {
      const ar = st.arena;
      body.innerHTML = "";
      body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid var(--line)", padding: "8px 10px", borderRadius: 8, marginBottom: 8, fontSize: 12 } },
        MG.ui.dom.h("span", { style: { fontWeight: 900, fontSize: 14 } }, "我的名次：第 " + ar.rank + " 名"),
        MG.ui.dom.h("span", { class: "sub" }, "今日挑戰剩 " + A.fightsLeft() + " 次 · 結算剩 " + MG.util.fmtClock(weeklyLeft()))));
      // v240 競技場防守：防守編隊（離線被幻影挑戰 — 排名零影響）＋防守紀錄
      {
        const dp = A.defensePower();
        const defNames = A.defenseIds().map(id => { const h = st.hunters.find(x => x.id === id); return h ? h.name : null; }).filter(Boolean);
        body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(154,216,240,.07)", border: "1px solid var(--line)", padding: "6px 10px", borderRadius: 8, marginBottom: 6, fontSize: 11, flexWrap: "wrap", gap: 4 } },
          MG.ui.dom.h("span", { style: { fontWeight: 800 } },
            "防守編隊" + (defNames.length ? "：" + defNames.join("・") : "（未設定 — 離線不防守）"),
            MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 6 } }, "戰力 " + MG.util.fmt(dp))),
          MG.ui.dom.h("button", { class: "btn sm", style: { minHeight: 26, padding: "2px 10px" }, on: { click: () => openDefenseEditor(render) } }, "編輯防守")));
        if (ar.defLog && ar.defLog.length) {
          body.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", borderRadius: 8, padding: "6px 10px", marginBottom: 8, fontSize: 10 } },
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, marginBottom: 3 } }, "防守紀錄（離線期間的挑戰者）："),
            ar.defLog.slice(-6).reverse().map(l => MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "1px 0" } },
              MG.ui.dom.h("span", null, "「" + l.name + "」來襲"),
              MG.ui.dom.h("span", { style: { fontWeight: 800, color: l.win ? "var(--good)" : "var(--dim)" } }, l.win ? "擊退 +" + l.honor + " 榮譽" : "落敗 +" + l.honor + " 榮譽")))));
        }
      }
      // v219：本週最佳名次＋結算預估（非線性名次獎勵 — 週中衝榜的價值可見；v219FIX 取用匯出常數避免與結算脫鉤）
      {
        const br = ar.bestRank || A.SIZE;
        const winB = Math.min(A.WINS_BONUS_MAX, (ar.wins || 0) * A.WINS_BONUS_PER);
        const est = A.rankReward(br) + winB;
        body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,209,102,.07)", border: "1px solid var(--line)", padding: "6px 10px", borderRadius: 8, marginBottom: 8, fontSize: 11 } },
          MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "本週最佳：第 " + br + " 名 · 勝 " + (ar.wins || 0) + " 場"),
          MG.ui.dom.h("span", { class: "sub" }, "結算預估 +" + est + " 鑽（名次 " + A.rankReward(br) + " ＋ 勝場 " + winB + "）")));
      }
      // v198 QoL：掃蕩剩餘次數（自動打最高勝率的可挑戰對手，彙總回報）
      const fl = A.fightsLeft();
      body.appendChild(MG.ui.dom.h("button", {
        class: "btn sm " + (fl > 0 ? "gold" : ""), style: { width: "100%", marginBottom: 8 }, disabled: fl <= 0,
        on: { click: () => {
          let wins = 0, gems = 0, done = 0;
          while (A.fightsLeft() > 0) {
            let best = -1, bestChance = -1;
            for (let j = 0; j < A.SIZE; j++) {
              if (!A.canChallenge(j)) continue;
              const c = A.winChance(j);
              if (c > bestChance) { bestChance = c; best = j; }
            }
            if (best < 0) break;
            const r = A.fight(best);
            if (!r.ok) break;
            done++; if (r.win) wins++; gems += r.gems || 0;
          }
          MG.ui.dom.toast(done > 0 ? "掃蕩完成：" + wins + " 勝 " + (done - wins) + " 敗" + (gems ? "，+" + gems + " 鑽石" : "") : "今日已無挑戰次數", done > 0 ? "good" : "", "icon_honor");
          render();
        } }
      }, fl > 0 ? "掃蕩剩餘 " + fl + " 次（自動挑最高勝率）" : "今日次數已用完"));
      (ar.opps || []).forEach((opp, i) => {
        const cls = MG.data.hunters.classes[opp.cls];
        const can = A.canChallenge(i);
        const isMe = i + 1 === ar.rank;
        body.appendChild(MG.ui.dom.h("div", {
          style: { display: "flex", gap: 8, alignItems: "center", padding: "7px 8px", background: isMe ? "rgba(255,209,102,.12)" : "var(--panel2)", border: "1px solid " + (isMe ? "var(--gold)" : "var(--line)"), borderRadius: 8, marginBottom: 5 },
          title: (isMe ? "我的幻影（第 " + ar.rank + " 名）" : "#" + (i + 1) + " " + opp.name + "（" + cls.name + " ★" + opp.rarity + "）戰力 " + MG.util.fmt(opp.power)) + (opp.defeated ? " — 本週已擊敗" : can ? " — 勝率 " + Math.round(A.winChance(i) * 100) + "%" : " — 今日已挑戰")
        },
          MG.ui.dom.h("span", { style: { width: 26, fontWeight: 900, color: i === 0 ? "var(--gold)" : "var(--dim)", textAlign: "center" } }, i === 0 ? "👑" : "#" + (i + 1)),
          MG.ui.dom.icon(cls.icon, 20),
          MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, opp.name,
              MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, cls.name + " ★" + opp.rarity)),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "戰力 " + MG.util.fmt(opp.power))),
          opp.defeated ? MG.ui.dom.h("span", { style: { color: "#57c96b", fontWeight: 900, fontSize: 11 } }, "✓ 已擊敗")
            : MG.ui.dom.h("button", {
                class: "btn sm " + (can ? "gold" : ""), style: { minHeight: 30, padding: "2px 10px" },
                disabled: !can,
                on: { click: () => doFight(i) }
              }, "挑戰 " + Math.round(A.winChance(i) * 100) + "%")));
      });
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 6, fontSize: 10 } },
        "每日打滿 " + A.DAILY_REWARD_N + " 場 +" + A.DAILY_REWARD + " 鑽石 · 週結算依名次發放鑽石"));
    }
    render();
  }
  /* v200 每日世界首領：3 次出戰、傷害里程碑自動領獎、擊殺發大獎 */
  function openWorldboss() {
    const st = S();
    const W = MG.sys.worldboss;
    const m = MG.ui.dom.modal("世界首領", null, { wide: true, icon: "icon_skull" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    function render() {
      const i = W.info();
      body.innerHTML = "";
      body.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid var(--r5)", borderRadius: 8, padding: "10px 12px", marginBottom: 8 } },
        MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 14, color: "var(--r5)" } },
          MG.ui.dom.h("span", null, "深淵魔主" + (i.killed ? "（今日已討伐）" : "")),
          MG.ui.dom.h("span", null, Math.round(i.pct * 100) + "%")),
        MG.ui.dom.h("div", { class: "pbar", style: { height: 8, marginTop: 6 } }, MG.ui.dom.h("i", { style: { width: Math.round(i.pct * 100) + "%", background: "linear-gradient(90deg,#e05c5c,#ff9f43)" } })),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 4 } },
          "生命 " + MG.util.fmt(i.hp) + " / " + MG.util.fmt(i.maxHp) + " · 累積傷害 " + MG.util.fmt(i.dmg) + " · 出戰剩 " + W.left() + "/" + W.ATTACKS + " 次（午夜重置）")));
      // v245 每週討伐戰：週出戰次數里程碑（週回訪錨點 — 進行中手動領、跨週自動結算）
      {
        const wi = W.weekInfo();
        const wkLeft = W.ATTACKS * 7 - wi.atk;
        body.appendChild(MG.ui.dom.h("div", { style: { background: "rgba(255,209,102,.06)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", margin: "0 0 8px", fontSize: 11 } },
          MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", fontWeight: 800, marginBottom: 4 } },
            MG.ui.dom.h("span", null, "每週討伐（週一重置）"),
            MG.ui.dom.h("span", { class: "sub" }, "本週 " + wi.atk + "/21 場" + (wkLeft > 0 ? "・還可打 " + wkLeft + " 場" : "・全勤達成"))),
          // v329：週討伐進度條
          MG.ui.dom.h("div", { class: "pbar", style: { height: 6, marginBottom: 6 } }, MG.ui.dom.h("i", { style: { width: Math.min(100, Math.round(wi.atk / 21 * 100)) + "%" } })),
          W.WEEK_MILESTONES.map(ms => {
            const key = "w" + ms.atk;
            const done = wi.claimed[key];
            const ready = !done && wi.atk >= ms.atk;
            return MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0", opacity: done ? 0.55 : 1 } },
              MG.ui.dom.h("span", null, "出戰 " + ms.atk + " 場", MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 9 } }, rewardText(ms.r))),
              done ? MG.ui.dom.h("span", { style: { fontSize: 10, color: "#57c96b", fontWeight: 800 } }, "✓ 已領")
                : ready ? MG.ui.dom.h("button", { class: "btn sm", style: { minHeight: 24, padding: "2px 8px" }, on: { click: () => {
                    // v245FIX：領取前重新驗證（modal 開著跨週 — 舊按鈕的 wi 是孤兒物件 → 重複發獎）
                    const fresh = W.weekInfo();
                    const fkey = "w" + ms.atk;
                    if (fresh.claimed[fkey] || fresh.atk < ms.atk) { render(); return; }
                    fresh.claimed[fkey] = true;
                    MG.sys.meta.grantReward(ms.r);
                    MG.ui.dom.toast("討伐里程碑獎勵已領取！", "good", "icon_skull");
                    render();
                  } } }, "領取")
                : MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9 } }, "還差 " + (ms.atk - wi.atk) + " 場"))
          })));
      }
      body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 6 } },
        MG.ui.dom.h("button", {
          class: "btn gold", style: { flex: 2 },
          disabled: W.left() <= 0,
          on: { click: () => {
            const r = W.attack();
            if (!r.ok) { MG.ui.dom.toast(r.reason, "bad", "icon_skull"); return; }
            const parts = ["造成傷害 " + MG.util.fmt(r.dmg)];
            if (r.rewards.length) parts.push("里程碑獎勵：" + r.rewards.map(x => x.txt).join("、"));
            if (r.killBonus) parts.push("速殺獎勵 +" + r.killBonus + " 鑽");
            if (r.killed) parts.push("世界首領討伐成功！明日更強的魔主降臨");
            MG.ui.dom.toast(parts.join("　"), r.killed ? "good" : "", "icon_skull");
            render();
          } }
        }, W.left() > 0 ? "出戰（造成約 " + MG.util.fmt(Math.max(100, Math.round(W.teamPower() * 30))) + " 傷害）" : (i.killed ? "今日已討伐，明日再戰" : "今日次數已用完")),
        // v213 QoL：一鍵出戰全部（每日 3 次逐點的最後漏網 — 與競技場/秘境掃蕩對稱）
        MG.ui.dom.h("button", {
          class: "btn sm gold", style: { flex: 1, minHeight: 34 },
          disabled: W.left() <= 0,
          on: { click: () => {
            let done = 0, dmg = 0, rewards = [], killed = false, killBonus = 0; // v213FIX：done 實際成功數（擊殺提前結束不虛報）
            for (let i = 0; i < 3; i++) {
              const r = W.attack();
              if (!r.ok) break;
              done++; dmg += r.dmg;
              if (r.rewards.length) rewards = rewards.concat(r.rewards);
              killed = killed || r.killed;
              killBonus += r.killBonus || 0;
            }
            const parts = ["一鍵出戰 ×" + done + "：總傷 " + MG.util.fmt(dmg)];
            if (rewards.length) parts.push("里程碑獎勵：" + rewards.map(x => x.txt).join("、"));
            if (killBonus) parts.push("速殺獎勵 +" + killBonus + " 鑽"); // v219
            if (killed) parts.push("世界首領討伐成功！明日更強的魔主降臨");
            MG.ui.dom.toast(parts.join("　"), killed ? "good" : "", "icon_skull");
            render();
          } }
        }, "一鍵出戰 ×" + W.left())));
      body.appendChild(MG.ui.dom.h("div", { style: { fontSize: 10, color: "var(--dim)", margin: "8px 2px 4px", fontWeight: 800 } }, "總傷里程碑（自動領取）"));
      for (const ms of W.MILESTONES) {
        const key = String(ms.pct);
        const done = !!i.claimed[key];
        const reached = i.dmg >= i.maxHp * ms.pct;
        const txt = ms.dynamic ? "金幣＋素材包" : Object.keys(ms.r).map(k => (k === "gems" ? "鑽石 " : k === "ticket" ? "招募券 " : "榮譽 ") + ms.r[k]).join("・");
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 6, opacity: done ? 0.65 : reached ? 1 : 0.5 }, title: "總傷達 " + Math.round(ms.pct * 100) + "%（目前 " + MG.util.fmt(i.dmg) + " / " + MG.util.fmt(i.maxHp) + "）— 獎勵：" + txt + (done ? "（已領取）" : reached ? "（達標自動領取）" : "（未達標）") },
          MG.ui.dom.icon("icon_chest", 16),
          MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } }, "總傷達 " + Math.round(ms.pct * 100) + "%"),
          MG.ui.dom.h("span", { style: { fontWeight: 800, fontSize: 11, color: done ? "#57c96b" : "var(--dim2)" } }, done ? "✓ 已領" : txt)));
      }
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 8, fontSize: 10 } },
        "每日 3 次免費出戰，傷害依隊伍戰力判定；魔主血量隨你的戰力成長"));
    }
    render();
  }
  /* v205 榮譽商店：每週限量商品（ISO 週重置）— 榮譽在強化滿級後的持續消耗點 */
  function openHonorShop() {
    const st = S();
    const H = MG.sys.honorshop;
    const m = MG.ui.dom.modal("榮譽商店", null, { icon: "icon_honor" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    function render() {
      body.innerHTML = "";
      body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid var(--line)", padding: "8px 10px", borderRadius: 8, marginBottom: 8, fontSize: 12 } },
        MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "持有榮譽"),
        MG.ui.dom.h("span", { style: { fontWeight: 900, color: "var(--gold)" } }, MG.util.fmt(st.currencies.honor || 0)),
        MG.ui.dom.h("span", { class: "sub" }, "週一重置庫存")));
      for (const it of H.list()) {
        const left = it.stock - it.sold;
        const can = left > 0 && (st.currencies.honor || 0) >= it.price;
        body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 8, marginBottom: 6 }, title: it.name + "（" + it.price + " 榮譽・本週限 " + left + " 次）" + (left <= 0 ? " — 已售罄" : can ? " — 可兌換" : " — 榮譽不足") },
          MG.ui.dom.icon(it.icon, 22),
          MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, it.name,
              MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "限 " + left + " 次/週")),
            MG.ui.dom.h("div", { style: { fontSize: 11, color: "var(--gold)", fontWeight: 800 } }, it.price + " 榮譽")),
          MG.ui.dom.h("button", {
            class: "btn sm " + (can ? "gold" : ""), style: { minHeight: 30, padding: "2px 10px" }, disabled: !can,
            on: { click: () => { const r = H.redeem(it.id); MG.ui.dom.toast(r.ok ? "兌換成功：" + r.name : r.reason, r.ok ? "good" : "bad", it.icon); render(); } }
          }, left > 0 ? "兌換" : "已售罄")));
      }
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 6, fontSize: 10 } },
        "榮譽來源：昇華／世界首領／競技場／公會首領／每日任務"));
    }
    render();
  }
  /* v152 限時活動：每週輪換（狩獵祭/討伐祭）、點數里程碑 + 活動商店 */
  function openEvents() {
    const st = S();
    const EV = MG.sys.events;
    const m = MG.ui.dom.modal("限時活動", null, { wide: true, icon: "icon_chest" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    function render() {
      const cur = EV.current();
      body.innerHTML = "";
      // 活動頭部
      body.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid var(--gold)", borderRadius: 8, padding: "10px 12px", marginBottom: 8 } },
        MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
          MG.ui.dom.h("span", { style: { fontWeight: 900, fontSize: 15, color: "var(--gold)" } }, cur.name),
          MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10 } }, "重置剩 " + MG.util.fmtClock(weeklyLeft()))),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginTop: 2 } }, cur.desc),
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 16, marginTop: 6, color: "var(--text)" } },
          "活動點數 ", MG.ui.dom.h("span", { style: { color: "var(--gold)", fontVariantNumeric: "tabular-nums" } }, MG.util.fmt(cur.pts)))));
      // 里程碑
      const next = EV.MILESTONES.find(x => !st.events.milestones[x.pts]);
      if (next) {
        const pct = Math.min(100, cur.pts / next.pts * 100);
        body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "里程碑")));
        body.appendChild(MG.ui.dom.h("div", { class: "pbar", style: { height: 8, margin: "0 2px 6px" } }, MG.ui.dom.h("i", { style: { width: pct + "%" } })));
        body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, margin: "0 2px 6px" } },
          "下一個里程碑：" + next.pts + " 點（" + MG.util.fmt(cur.pts) + " / " + next.pts + "）"));
      }
      // v208 QoL：活動里程碑全部領取
      {
        const claimable = EV.MILESTONES.filter(ms => !st.events.milestones[ms.pts] && (cur.pts || 0) >= ms.pts).length;
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: "6px 8px", marginBottom: 6 } },
          MG.ui.dom.icon("icon_quest", 18),
          MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } },
            "里程碑獎勵", MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, claimable ? "可領取 " + claimable + " 項" : "暫無可領取")),
          MG.ui.dom.h("button", {
            class: "btn sm " + (claimable ? "gold" : ""), disabled: !claimable,
            on: { click: () => { const n = EV.claimAllMilestones(); if (n > 0) { MG.ui.dom.toast("里程碑獎勵已全數領取（" + n + " 項）！", "good", "icon_quest"); render(); } } }
          }, "全部領取")));
      }
      for (const ms of EV.MILESTONES) {
        const claimed = st.events.milestones[ms.pts];
        const ready = cur.pts >= ms.pts && !claimed;
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 7, opacity: claimed ? 0.55 : 1 }, title: "活動點數達 " + ms.pts + "（目前 " + cur.pts + "）— 獎勵：" + rewardText(ms.r) + (claimed ? "（已領取）" : ready ? "（可領取）" : "（尚差 " + Math.max(0, ms.pts - cur.pts) + " 點）") },
          MG.ui.dom.icon("icon_chest", 20),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, "達到 " + ms.pts + " 點"),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, rewardText(ms.r))),
          MG.ui.dom.h("button", { class: "btn sm " + (ready ? "gold" : ""), disabled: !ready, on: { click: () => { if (EV.claimMilestone(ms.pts)) { MG.ui.dom.toast("里程碑獎勵已領取！", "good", "icon_quest"); render(); } } } }, claimed ? "已領" : "領取")));
      }
      // 活動商店
      body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "活動商店")));
      for (const s of EV.SHOP) {
        const bought = st.events.redeemed[s.id] || 0;
        const soldOut = bought >= s.stock;
        const left = Math.max(0, s.stock - bought);
        const stock = Math.min(left, Math.floor(cur.pts / s.cost)); // v228：可兌數 clamp（庫存∩餘額）
        // v228：活動商店批量兌換（stock 2-5 週重置 — 每週掃貨摩擦最大）
        const bulk = shopBulkBtn({ stock, label: "兌換", onRedeem: () => EV.redeem(s.id), refresh: () => render() });
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 7 }, title: s.name + "（" + s.cost + " 活動點" + (s.stock ? "・本週限兌 " + left + " 次" : "") + "）" + (soldOut ? " — 已售罄" : " — 持有 " + cur.pts + " 點") },
          MG.ui.dom.icon(s.icon, 20),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, s.name),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, s.cost + " 點" + (s.stock ? " · 限兌 " + left + " 次" : ""))),
          soldOut ? MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10 } }, "售罄") : bulk.wrap));
      }
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 6, fontSize: 10 } },
        "活動點數每週重置，記得在週一前用完！"));
    }
    render();
  }
  /* v154 試煉秘境：每日副本（金幣/經驗/素材，每日 3 次） */
  function openDungeon() {
    const st = S();
    const D = MG.sys.dungeon;
    const m = MG.ui.dom.modal("試煉秘境", null, { wide: true, icon: "icon_sword" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    function render() {
      body.innerHTML = "";
      body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid var(--line)", padding: "8px 10px", borderRadius: 8, marginBottom: 8, fontSize: 12 } },
        MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "每日 3 次挑戰，午夜重置"),
        MG.ui.dom.h("span", { class: "sub" }, "剩 " + MG.util.fmtClock(msToMidnight()))));
      // v198 QoL：一鍵掃蕩剩餘次數（所有秘境）
      {
        const totalLeft = D.DEFS.reduce((a, d) => a + D.left(d.id), 0);
        body.appendChild(MG.ui.dom.h("button", {
          class: "btn sm " + (totalLeft > 0 ? "gold" : ""), style: { width: "100%", marginBottom: 8 }, disabled: totalLeft <= 0,
          on: { click: () => {
            let runs = 0, wins = 0, gold = 0, exp = 0;
            for (const def of D.DEFS) {
              if (!D.unlocked(def.id)) continue; // v198FIX：未解鎖秘境跳過（run 會拒絕，不能 break 中斷整批）
              while (D.left(def.id) > 0) {
                const r = D.run(def.id);
                if (!r.ok) break;
                runs++; if (r.win) wins++;
                gold += r.gold || 0; exp += r.exp || 0;
              }
            }
            MG.ui.dom.toast(runs > 0 ? "秘境掃蕩：" + wins + "/" + runs + " 勝" + (gold ? "，金幣 +" + MG.util.fmt(gold) : "") + (exp ? "，經驗 +" + MG.util.fmt(exp) : "") : "今日秘境次數已用完", runs > 0 ? "good" : "", "icon_goldbag");
            render();
          } }
        }, totalLeft > 0 ? "一鍵掃蕩剩餘 " + totalLeft + " 次" : "今日次數已用完"));
      }
      for (const def of D.DEFS) {
        const unlocked = D.unlocked(def.id);
        const left = D.left(def.id);
        const r = def.reward(st);
        const rewardTxt = r.gold ? "金幣 " + MG.util.fmt(r.gold) : r.exp ? "經驗 " + MG.util.fmt(r.exp) : "素材 9 種各 ×" + r.mats;
        const can = unlocked && left > 0;
        body.appendChild(MG.ui.dom.h("div", {
          style: { display: "flex", gap: 8, alignItems: "center", padding: "9px 10px", background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 8, marginBottom: 6, opacity: unlocked ? 1 : 0.55 },
          title: def.name + " — " + def.desc + "。獎勵：" + rewardTxt + "（剩 " + left + "/" + D.ENTRIES + " 次）" + (unlocked ? (can ? " — 勝率 " + Math.round(D.winChance(def.id) * 100) + "%" : " — 今日已用完") : " — 抵達第 " + (def.unlockRegion + 1) + " 區域解鎖")
        },
          MG.ui.dom.icon(def.icon, 22),
          MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, def.name,
              MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "剩 " + left + "/" + D.ENTRIES + " 次")),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, def.desc),
            MG.ui.dom.h("div", { style: { fontSize: 11, color: "var(--gold)", fontWeight: 800, marginTop: 2 } }, "獎勵：" + rewardTxt)),
          unlocked
            ? MG.ui.dom.h("button", {
                class: "btn sm " + (can ? "gold" : ""), style: { minHeight: 30, padding: "2px 10px" },
                disabled: !can,
                on: { click: () => doRun(def.id) }
              }, left > 0 ? "挑戰 " + Math.round(D.winChance(def.id) * 100) + "%" : "已用完")
            : MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9 } }, "抵達第 " + (def.unlockRegion + 1) + " 區域解鎖")));
      }
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 6, fontSize: 10 } },
        "勝率依隊伍戰力判定，敗北仍可得 30% 安慰獎勵"));
    }
    function doRun(id) {
      const r = D.run(id);
      if (!r.ok) { MG.ui.dom.toast(r.reason, "bad", "icon_sword"); return; }
      const parts = [r.win ? "秘境攻略成功！" : "挑戰失敗（安慰獎 30%）"];
      if (r.gold) parts.push("金幣 +" + MG.util.fmt(r.gold));
      if (r.exp) parts.push("經驗 +" + MG.util.fmt(r.exp));
      if (r.mats) parts.push("素材 +" + r.mats + "（每種）");
      MG.ui.dom.toast(parts.join("　"), r.win ? "good" : "", "icon_goldbag");
      render();
    }
    render();
  }
  /* v156 公會：捐獻升級、科技樹、每週首領 */
  function openGuild() {
    const st = S();
    const G = MG.sys.guild;
    const m = MG.ui.dom.modal("公會", null, { wide: true, icon: "icon_castle" });
    const tabs = MG.ui.dom.h("div", { style: { display: "flex", gap: 6, marginBottom: 8 } });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(tabs);
    m.panel.appendChild(body);
    let tab = "tech";
    function render() {
      const g = G.ensure();
      tabs.innerHTML = "";
      body.innerHTML = "";
      for (const [id, label] of [["tech", "公會科技"], ["boss", "每週首領"]]) {
        tabs.appendChild(MG.ui.dom.h("div", { class: "chip" + (tab === id ? " on" : ""), on: { click: () => { tab = id; MG.core.audio.SFX.click(); render(); } } }, label));
      }
      if (tab === "tech") {
        const pct = Math.min(100, g.exp / G.expNeed(g.level) * 100);
        const don = g.donated || 0;
        body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 8, alignItems: "center", background: "var(--panel2)", border: "1px solid var(--line)", padding: "8px 10px", borderRadius: 8, marginBottom: 8 } },
          MG.ui.dom.icon("icon_castle", 22),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, "梅根公會 Lv" + g.level + (g.level >= G.MAX_LEVEL ? "（滿級）" : "")),
            MG.ui.dom.h("div", { class: "pbar", style: { height: 6, marginTop: 4 } }, MG.ui.dom.h("i", { style: { width: pct + "%" } })),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, marginTop: 2 } }, "經驗 " + MG.util.fmt(g.exp) + " / " + MG.util.fmt(G.expNeed(g.level)) + " · 捐獻剩 " + (G.DONATIONS - don) + " 次（午夜重置）")),
          MG.ui.dom.h("button", {
            class: "btn sm " + (don < G.DONATIONS && g.level < G.MAX_LEVEL ? "gold" : ""), style: { minHeight: 30 },
            disabled: don >= G.DONATIONS || g.level >= G.MAX_LEVEL,
            on: { click: () => { const r = G.donate(); MG.ui.dom.toast(r.ok ? "捐獻 " + MG.util.fmt(r.cost) + " 金，公會經驗 +" + r.gain : r.reason, r.ok ? "good" : "bad", "icon_castle"); render(); } }
          }, "捐獻 " + MG.util.fmt(G.donateCost()) + "金"),
          // v198 QoL：捐獻×剩餘（一鍵捐滿今日額度）
          MG.ui.dom.h("button", {
            class: "btn sm " + (don < G.DONATIONS && g.level < G.MAX_LEVEL ? "gold" : ""), style: { minHeight: 30 },
            disabled: don >= G.DONATIONS || g.level >= G.MAX_LEVEL,
            on: { click: () => {
              const target = G.DONATIONS - (g.donated || 0); // v198FIX：快照目標數（donate 會遞增 donated，迴圈條件不可引用可變值）
              let n = 0, total = 0, gain = 0;
              for (let i = 0; i < target; i++) {
                const r = G.donate();
                if (!r.ok) break;
                n++; total += r.cost; gain += r.gain;
              }
              MG.ui.dom.toast(n > 0 ? "捐獻 ×" + n + "（" + MG.util.fmt(total) + " 金），公會經驗 +" + gain : (g.level >= G.MAX_LEVEL ? "公會已滿級" : "今日捐獻已滿或金幣不足"), n > 0 ? "good" : "bad", "icon_castle");
              render();
            } }
          }, "捐獻×" + Math.max(0, G.DONATIONS - don)),
          // v220 盛宴捐獻：每日 1 次、成本 ×5、經驗 ×4（10→20 升級曲線壓縮）
          MG.ui.dom.h("button", {
            class: "btn sm " + (g.feastDay !== MG.util.today() && g.level < G.MAX_LEVEL ? "gold" : ""), style: { minHeight: 30 },
            disabled: g.feastDay === MG.util.today() || g.level >= G.MAX_LEVEL,
            title: "盛宴捐獻：金幣 ×5、經驗 ×4（每日 1 次）",
            on: { click: () => { const r = G.donateFeast(); MG.ui.dom.toast(r.ok ? "盛宴捐獻 " + MG.util.fmt(r.cost) + " 金，公會經驗 +" + r.gain : r.reason, r.ok ? "good" : "bad", "icon_castle"); render(); } }
          }, "盛宴 " + MG.util.fmt(G.donateCost() * 5) + "金")));
        for (const line of G.TECH_LINES) {
          const lvl = g.tech[line] || 0;
          const cost = G.techCost(line);
          const can = lvl < g.level && lvl < G.MAX_LEVEL && st.currencies.gold >= cost; // v220：上限隨公會等級（10→20）
          // v220FIX：顯示與 effects 同源的累計加成（下一級邊際率依區間）
          const nextFx = G.techFx(line, lvl + 1);
          const fxTxt = "每級 +" + (nextFx * 100).toFixed(1) + "%" + (line === "crit" ? "（暴擊率）" : "") + (lvl >= 10 ? "（Lv10 後減半）" : "");
          body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 7 }, title: G.TECH_NAMES[line] + "（Lv " + lvl + "/" + g.level + "）— " + fxTxt + "・目前總加成 +" + (G.techTotal(line, lvl) * 100).toFixed(1) + "%" },
            MG.ui.dom.icon(G.TECH_ICONS[line], 20),
            MG.ui.dom.h("div", { class: "grow" },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, G.TECH_NAMES[line],
                MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "Lv " + lvl + "/" + g.level)),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, fxTxt + " · 目前 +" + (G.techTotal(line, lvl) * 100).toFixed(1) + "%")),
            MG.ui.dom.h("button", {
              class: "btn sm " + (can ? "gold" : ""), style: { minHeight: 30 },
              disabled: !can,
              on: { click: () => { const r = G.buyTech(line); MG.ui.dom.toast(r.ok ? G.TECH_NAMES[line] + "升至 Lv" + r.lvl + "！" : r.reason, r.ok ? "good" : "bad", "icon_enhance"); render(); } }
            }, lvl >= g.level && lvl < G.MAX_LEVEL ? "需公會 Lv" + (lvl + 1) : lvl >= G.MAX_LEVEL ? "滿級" : MG.util.fmt(cost) + "金"),
            // v233 科技連升（生涯 120 次點擊 → 每線 1 次；影子模擬＋>3 級 confirm 防誤觸 — v208 建築連升同構）
            lvl < g.level && lvl < G.MAX_LEVEL ? MG.ui.dom.h("button", {
              class: "btn sm", style: { minHeight: 30, padding: "2px 8px" }, title: "連升到金幣不足或上限",
              on: { click: () => {
                const pv = G.bulkBuyTechPreview(line);
                if (pv.count <= 0) { MG.ui.dom.toast("金幣不足以連升", "bad", "icon_enhance"); return; }
                const run = () => {
                  const r = G.bulkBuyTech(line);
                  MG.ui.dom.toast(r.ok ? G.TECH_NAMES[line] + "連升 " + r.done + " 級（Lv " + (r.lvl - r.done) + "→" + r.lvl + "，花費 " + MG.util.fmt(r.cost) + " 金）" : "無法連升", r.ok ? "good" : "bad", "icon_enhance");
                  render();
                };
                if (pv.count > 3) MG.ui.dom.confirm("科技連升 ×" + pv.count, "「" + G.TECH_NAMES[line] + "」連升 " + pv.count + " 級（Lv " + pv.from + "→" + pv.to + "），共花費約 " + MG.util.fmt(pv.cost) + " 金。確定？", run, { okText: "連升" });
                else run();
              } }
            }, "連升") : null));
        }
        // v234 遠古科技：公會 Lv20 後的金幣永續消耗端（每線 Lv1-10、+0.5%/級 — 全滿里程碑 +500 鑽）；v269 第二階梯 Lv11-20（+0.25%/級 — 全滿 +1000 鑽）
        if (g.level >= G.MAX_LEVEL) {
          body.appendChild(MG.ui.dom.h("div", { class: "section-h", style: { margin: "10px 0 2px" } },
            MG.ui.dom.h("span", { class: "t" }, "遠古科技（Lv" + G.MAX_LEVEL + "）")));
          body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, margin: "0 2px 6px" } },
            "金幣的長線投資：第一階 Lv1-10（+0.5%/級）・第二階 Lv11-20（+0.25%/級）；第一階全滿 +500 鑽・全滿 +1000 鑽石。"));
          for (const line of G.TECH_LINES) {
            const alvl = (g.ancient && g.ancient[line]) || 0;
            const acost = G.ancientCost(alvl + 1);
            const acan = alvl < G.MAX_ANCIENT && st.currencies.gold >= acost;
            body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 7 }, title: G.TECH_NAMES[line] + "（遠古 Lv " + alvl + "/" + G.MAX_ANCIENT + "）— 每級 +" + (G.ancientFx(line, alvl + 1) * 100).toFixed(1) + "%・目前總加成 +" + (G.ancientTotal(line, alvl) * 100).toFixed(1) + "%" },
              MG.ui.dom.icon(G.TECH_ICONS[line], 20),
              MG.ui.dom.h("div", { class: "grow" },
                MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, G.TECH_NAMES[line],
                  MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "遠古 Lv " + alvl + "/" + G.MAX_ANCIENT)),
                MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "每級 +" + (G.ancientFx(line, alvl + 1) * 100).toFixed(1) + "% · 目前 +" + (G.ancientTotal(line, alvl) * 100).toFixed(1) + "%")), // v269：下一級 fx 依階層顯示
              MG.ui.dom.h("button", {
                class: "btn sm " + (acan ? "gold" : ""), style: { minHeight: 30 },
                disabled: !acan,
                on: { click: () => { const r = G.buyAncient(line); MG.ui.dom.toast(r.ok ? "遠古「" + G.TECH_NAMES[line] + "」升至 Lv" + r.lvl + "！" : r.reason, r.ok ? "good" : "bad", "icon_enhance"); render(); } }
              }, alvl >= G.MAX_ANCIENT ? "滿級" : MG.util.fmt(acost) + "金")));
          }
          if (g.ancientDone) body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, textAlign: "center", marginTop: 6 } },
            "遠古科技第一階全滿 +500 鑽石（全 6 線 Lv10）。")); // v269 中性文案（無階梯閘門 — 單線 Lv10 即可續買第二階）
          if (g.ancientDone2) body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, textAlign: "center", marginTop: 2 } },
            "遠古科技全滿 — 王國的力量已臻化境。"));
        }
      } else {
        const bi = G.bossInfo();
        const dmgPer = Math.max(100, G.teamPower() * 30);
        body.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid var(--r5)", borderRadius: 8, padding: "10px 12px", marginBottom: 8 } },
          MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 14, color: "var(--r5)" } },
            MG.ui.dom.h("span", null, "公會首領"),
            MG.ui.dom.h("span", null, Math.round(bi.pct * 100) + "%")),
          MG.ui.dom.h("div", { class: "pbar", style: { height: 8, marginTop: 6 } }, MG.ui.dom.h("i", { style: { width: Math.round(bi.pct * 100) + "%", background: "linear-gradient(90deg,#e05c5c,#ff9f43)" } })),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 4 } },
            "生命 " + MG.util.fmt(bi.hp) + " / " + MG.util.fmt(bi.maxHp) + " · 累積傷害 " + MG.util.fmt(bi.dmg)),
          // v220 週首領弱點（元素克制加成 — 每週輪換）
          (g.boss.weak && g.boss.weak.length) ? MG.ui.dom.h("div", { style: { fontSize: 10, marginTop: 2, fontWeight: 800, color: "var(--gold)" } },
            "本週弱點：" + g.boss.weak.map(el => (MG.config.ELEMENTS[el] || {}).name || el).join("・") + "（編隊含剋制元素 → 出戰傷害最高 ×1.5）") : null,
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 2 } }, "結算剩 " + MG.util.fmtClock(weeklyLeft()) + " · 傷害跨次累積，擊殺發放最終大獎")));
        for (const ms of G.BOSS_MILESTONES) {
          const done = bi.claimed[String(ms.pct)];
          const reached = bi.dmg >= bi.maxHp * ms.pct;
          body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 7, opacity: done ? 0.6 : reached ? 1 : 0.5 }, title: "總傷達 " + Math.round(ms.pct * 100) + "%（目前 " + MG.util.fmt(bi.dmg) + " / " + MG.util.fmt(bi.maxHp) + "）— 獎勵：" + rewardText(ms.r) + (done ? "（已領取）" : reached ? "（達標自動領取）" : "（未達標）") },
            MG.ui.dom.icon("icon_skull", 18),
            MG.ui.dom.h("div", { class: "grow" },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, "總傷達 " + Math.round(ms.pct * 100) + "%"),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, rewardText(ms.r))),
            MG.ui.dom.h("span", { style: { fontWeight: 900, fontSize: 11, color: done ? "#57c96b" : "var(--dim2)" } }, done ? "✓ 已領" : reached ? "出戰自動領取" : "")));
        }
        // v238 QoL：首領連戰（每週衝里程碑 5-15 次同質點擊 → 1 次；影子模擬＋confirm 防誤觸）
        const bp = G.bulkAttackBossPreview();
        const bossRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 6, marginTop: 8 } },
          MG.ui.dom.h("button", {
            class: "btn gold", style: { flex: 1 },
            on: { click: () => {
              const r = G.attackBoss();
              const parts = ["造成傷害 " + MG.util.fmt(r.dmg)];
              if (r.rewards.length) parts.push("里程碑獎勵 x" + r.rewards.length);
              if (r.killed) parts.push("首領擊殺！");
              MG.ui.dom.toast(parts.join("　"), r.killed ? "good" : "", "icon_skull");
              render();
            } }
          }, "出戰（" + MG.util.fmt(bp.dmg) + " 傷）"),
          bi.pct < 1 ? MG.ui.dom.h("button", {
            class: "btn sm", style: { flex: 1, whiteSpace: "nowrap" }, title: "連戰至下一個里程碑（上限 20 次）",
            on: { click: () => {
              const run = () => {
                const r = G.bulkAttackBoss(bp.need);
                MG.ui.dom.toast("連戰 ×" + r.done + "：總傷 " + MG.util.fmt(bp.dmg * r.done) + (r.msTotal ? "・里程碑 x" + r.msTotal : "") + (r.kills ? "・擊殺 " + r.kills : ""), r.kills ? "good" : "", "icon_skull");
                render();
              };
              if (bp.need > 3) MG.ui.dom.confirm("首領連戰 ×" + bp.need, "連戰至下一個里程碑（約 " + bp.need + " 次出戰" + (bp.need >= 20 ? "，達上限 20 次未達里程碑時自動停止" : "") + "，傷害固定無消耗）。確定？", run, { okText: "連戰" });
              else run();
            } }
          }, "連戰 ×" + bp.need) : null);
        body.appendChild(bossRow);
        body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 6, fontSize: 10 } },
          "出戰無次數限制，傷害依隊伍戰力計算"));
      }
    }
    render();
  }
  /* v160 無盡深淵：真實戰鬥爬塔（深度=關卡），每 10 層首領，最佳層數里程碑 */
  function openAbyss() {
    const st = S();
    const A = MG.sys.abyss;
    const m = MG.ui.dom.modal("無盡深淵", null, { wide: true, icon: "icon_skull", onClose: stopAbyssPoll });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    let poll = null;
    function stopAbyssPoll() { if (poll) { clearInterval(poll); poll = null; } }
    function render() {
      const fs = A.fightState();
      body.innerHTML = "";
      // 頭部：層數資訊
      body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid var(--line)", padding: "8px 10px", borderRadius: 8, marginBottom: 8, fontSize: 12 } },
        MG.ui.dom.h("span", { style: { fontWeight: 900, fontSize: 14 } }, fs.inAbyss ? "第 " + fs.stage + " 層" : "尚未踏入深淵"),
        MG.ui.dom.h("span", { class: "sub" }, "最佳 " + fs.best + " 層" + (A.unlocked() ? "" : " · 擊敗第 5 區域 BOSS 解鎖"))));
      if (!A.unlocked()) {
        body.appendChild(MG.ui.dom.h("div", { class: "empty" }, "擊敗第 5 區域（深淵裂谷）的 BOSS 後\n無盡深淵的大門才會開啟"));
        m.panel.appendChild(body);
        return;
      }
      // 戰況區
      // v223 決策資訊：下個里程碑距離/獎勵、建議戰力 vs 隊伍戰力（三色 — 深淵從盲爬變目標驅動）
      {
        const nm = A.nextMilestone();
        // v223FIX：不在深淵內時用「下一場會打的層」(enter 恢復 max(1, best)) — 原用普通關卡 stage 誤導
        const rec = A.suggestedPower(fs.inAbyss ? st.hunt.stage : Math.max(1, fs.best));
        const tp = MG.sys.guild.teamPower ? MG.sys.guild.teamPower() : 0;
        const ratio = rec > 0 ? tp / rec : 1;
        const color = ratio >= 1 ? "#57c96b" : ratio >= 0.7 ? "#ffd166" : "#ff5c5c";
        const label = ratio >= 1 ? "穩過" : ratio >= 0.7 ? "吃力" : "建議先強化";
        body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid var(--line)", padding: "6px 10px", borderRadius: 8, marginBottom: 8, fontSize: 10 } },
          MG.ui.dom.h("span", null, nm ? "下個里程碑：第 " + nm.floor + " 層（距 " + nm.dist + " 層）・" + rewardText(nm.r) : "里程碑已全數達成"),
          MG.ui.dom.h("span", { style: { fontWeight: 800, color } }, "建議戰力 " + MG.util.fmt(rec) + "（" + label + "）")));
      }
      if (fs.inAbyss && fs.monster) {
        const pct = Math.max(0, Math.min(100, fs.monster.hp / fs.monster.maxHp * 100));
        body.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid " + (fs.monster.boss ? "var(--r5)" : "var(--line)"), borderRadius: 8, padding: "9px 10px", marginBottom: 8 }, title: (fs.monster.boss ? "深淵領主（每 10 層鎮守）" : "第 " + fs.stage + " 層魔物") + " — 擊敗推進；全軍倒下回村休整" },
          MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 13, color: fs.monster.boss ? "var(--r5)" : "var(--text)" } },
            MG.ui.dom.h("span", null, fs.monster.name + (fs.monster.boss ? " ☠" : "")),
            MG.ui.dom.h("span", null, Math.round(pct) + "%")),
          MG.ui.dom.h("div", { class: "pbar", style: { height: 7, marginTop: 5 } }, MG.ui.dom.h("i", { style: { width: pct + "%", background: fs.monster.boss ? "linear-gradient(90deg,#e05c5c,#ff9f43)" : "" } })),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 3 } },
            "生命 " + MG.util.fmt(fs.monster.hp) + " / " + MG.util.fmt(fs.monster.maxHp) + " · 隊伍存活 " + fs.team)));
      } else if (fs.inAbyss && fs.resting) {
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 9, marginBottom: 8 } },
          MG.ui.dom.icon("icon_skull", 20),
          MG.ui.dom.h("div", { class: "grow" }, MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, "全軍覆沒，休整中…"),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, fs.restLeft + " 秒後自動再戰（開啟自動續戰或連續挑戰時）")),
          MG.ui.dom.h("button", { class: "btn sm blue", on: { click: () => { st.hunt.restUntil = 0; st.hunt.dispatchIds = MG.sys.hunters.teamOf().filter(id => id && st.hunters.some(h => h.id === id)); MG.sys.battle.reset(); MG.ui.dom.toast("即刻再戰！", "good", "icon_sword"); render(); } } }, "立即再戰")));
      } else if (!fs.inAbyss) {
        body.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 8, padding: "9px 10px", marginBottom: 8 } },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, "獎勵隨深度成長（金幣／經驗／虛空碎片／神話殘片）"),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "每 10 層有深淵領主鎮守；最佳層數跨週保留，里程碑獎勵首通領取")));
      }
      // 里程碑
      body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "首通里程碑")));
      // v208 QoL：深淵里程碑全部領取
      {
        const claimable = A.visibleMilestones().filter(ms => !st.abyss.claimed[ms.floor] && fs.best >= ms.floor).length; // v239：含生成值
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: "6px 8px", marginBottom: 6 } },
          MG.ui.dom.icon("icon_quest", 18),
          MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } },
            "里程碑獎勵", MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, claimable ? "可領取 " + claimable + " 項" : "暫無可領取")),
          MG.ui.dom.h("button", {
            class: "btn sm " + (claimable ? "gold" : ""), disabled: !claimable,
            on: { click: () => { const n = A.claimAll(); if (n > 0) { MG.ui.dom.toast("里程碑獎勵已全數領取（" + n + " 項）！", "good", "icon_quest"); render(); } } }
          }, "全部領取")));
      }
      // v215 深淵商店（碎片兌換深淵限定神器＋素材包 — 週限量）
      {
        const st2 = S();
        const matsTxt = (cost) => Object.keys(cost).map(m => MG.util.fmt(cost[m]) + " " + ((MG.config.MATS[m] || {}).name || m)).join("・");
        body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "深淵商店")));
        body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, margin: "0 2px 6px" } },
          "持有：虛空碎片 " + MG.util.fmt(st2.mats.void || 0) + " ・ 神話殘片 " + MG.util.fmt(st2.mats.myth || 0) + "（深淵擊殺掉落，週一重置限量）"));
        for (const it of A.shopList()) {
          const ownedArt = it.art && st2.artifacts && st2.artifacts.owned && st2.artifacts.owned[it.art]; // v215FIX：已擁有標記（跨週不重兌）
          const can = !it.locked && !ownedArt && it.sold < it.stock && Object.keys(it.cost).every(m => (st2.mats[m] || 0) >= it.cost[m]); // v264 深度門檻
          body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 6, marginBottom: 4, opacity: ownedArt || it.sold >= it.stock || it.locked ? 0.55 : 1 }, title: it.name + " — " + it.desc + "（" + matsTxt(it.cost) + "・本週 " + it.sold + "/" + it.stock + "）" + (ownedArt ? " — 已擁有" : it.locked ? " — 需深度 " + it.minBest + "+" : it.sold >= it.stock ? " — 已兌完" : " — 可兌換") },
            MG.ui.dom.icon(it.icon, 18),
            MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, it.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 9 } }, it.sold + "/" + it.stock + (it.badge && it.stock > 2 ? "（深度解鎖）" : "") + (it.locked ? "（深度 " + it.minBest + "+ 解鎖）" : ""))),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9 } }, it.desc)),
            MG.ui.dom.h("button", { class: "btn sm " + (can ? "gold" : ""), disabled: !can, on: { click: () => { const r = A.shopRedeem(it.id); if (!r.ok) MG.ui.dom.toast(r.reason, "bad", it.icon); render(); } } },
              ownedArt ? "已擁有" : (it.locked ? "深度不足" : (it.sold >= it.stock ? "已兌" : matsTxt(it.cost))))));
        }
        // v229 素材兌換：T3 素材長期消耗端（週限 10 次 — 價隨王國等級指數縮放）
        {
          const ex = st2.matsEx || { week: "", n: 0 };
          const exWk = MG.sys.meta.weekKey();
          const exN = ex.week === exWk ? (ex.n || 0) : 0;
          const exLeft = Math.max(0, MG.sys.meta.matsExCap() - exN); // v239：上限隨深淵深度縮放
          body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 6, alignItems: "center", margin: "2px 2px 8px", flexWrap: "wrap" } },
            MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10 } }, "素材兌金幣（剩 " + exLeft + " 次/週）："),
            ["void", "myth"].map(t => {
              const cost = t === "void" ? 50 : 100;
              const has = (st2.mats[t] || 0) >= cost; // v238FIX：fallback 鈕引用（原宣告被批量化移除 → exLeft<=0/碎片不足時 ReferenceError 崩潰深淵頁）
              // v238 QoL：兌換批量（週限 10 次逐次點擊 → 1 次 stepper；exchangeMats 週 key/次數/餘額三重守衛）
              const exBulk = exLeft > 0 && has ? shopBulkBtn({
                stock: Math.min(exLeft, Math.floor((st2.mats[t] || 0) / cost)),
                label: t === "void" ? "虛空" : "神話",
                onRedeem: () => MG.sys.meta.exchangeMats(t, true), // v238：批量靜音（單擊路徑不變）
                refresh: render
              }) : null;
              return exBulk ? exBulk.wrap : MG.ui.dom.h("button", {
                class: "btn sm " + (has && exLeft > 0 ? "gold" : ""), style: { fontSize: 10, padding: "3px 8px" },
                disabled: !has || exLeft <= 0,
                on: { click: () => { const r = MG.sys.meta.exchangeMats(t); if (!r.ok) MG.ui.dom.toast(r.reason, "bad", "mat_crystal"); render(); } }
              }, t === "void" ? "虛空 ×50" : "神話 ×100");
            })));
        }
      }
      for (const ms of A.visibleMilestones()) { // v239：表值 + 生成值（每檔個別行/領取鈕）
        const claimed = st.abyss.claimed[ms.floor];
        const ready = fs.best >= ms.floor && !claimed;
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 7, opacity: claimed ? 0.55 : 1 }, title: "抵達第 " + ms.floor + " 層（目前最深 " + fs.best + " 層）— 獎勵：" + rewardText(ms.r) + (claimed ? "（已領取）" : ready ? "（可領取）" : "（未達標）") },
          MG.ui.dom.icon("icon_skull", 18),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, "抵達第 " + ms.floor + " 層"),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, rewardText(ms.r))),
          MG.ui.dom.h("button", { class: "btn sm " + (ready ? "gold" : ""), disabled: !ready, on: { click: () => { if (A.claim(ms.floor)) { MG.ui.dom.toast("里程碑獎勵已領取！", "good", "icon_quest"); render(); } } } }, claimed ? "已領" : "領取")));
      }
      // 行動列
      if (fs.inAbyss) {
        body.appendChild(MG.ui.dom.h("button", { class: "btn blue", style: { width: "100%", marginTop: 8 }, on: { click: () => { A.leave(); render(); } } }, "離開深淵（回到原本區域）"));
        // v258 連續挑戰 toggle（深淵內開啟 — 滅團休息後自動再戰；leave 清除）
        const ab = st.abyss || {};
        body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 8 } },
          MG.ui.dom.h("div", { class: "sub", style: { flex: 1, fontSize: 11 } }, "連續挑戰：滅團休息後自動再戰（每週結算/里程碑不受影響）"),
          MG.ui.dom.h("button", { class: "btn sm" + (ab.autoRetry ? " gold" : ""), style: { minHeight: 28, padding: "2px 12px" }, on: { click: () => { const a2 = A.ensure(); a2.autoRetry = !a2.autoRetry; MG.ui.dom.toast(a2.autoRetry ? "連續挑戰已開啟 — 滅團自動再戰" : "連續挑戰已關閉", a2.autoRetry ? "good" : "", "icon_skull"); render(); } } }, ab.autoRetry ? "✓ 連續挑戰" : "連續挑戰")));
      } else {
        // v258 一鍵踏入並連戰（enter + autoRetry 一擊完成）
        body.appendChild(MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%", marginTop: 8 }, title: "進入無盡深淵挑戰（層數越高獎勵越好・滅團回村）", on: { click: () => { const r = A.enter(); MG.ui.dom.toast(r.ok ? "踏入無盡深淵，第 " + r.stage + " 層" : r.reason, r.ok ? "good" : "bad", "icon_skull"); if (r.ok) render(); } } }, "踏入深淵" + (fs.best ? "（從第 " + fs.best + " 層續戰）" : "")));
        body.appendChild(MG.ui.dom.h("button", { class: "btn sm gold", style: { width: "100%", marginTop: 6 }, title: "踏入深淵並開啟連續挑戰（滅團休息後自動再戰）", on: { click: () => { const r = A.enter(); if (!r.ok) { MG.ui.dom.toast(r.reason, "bad", "icon_skull"); return; } const a2 = A.ensure(); a2.autoRetry = true; MG.ui.dom.toast("踏入深淵並開啟連續挑戰 — 滅團自動再戰", "good", "icon_skull"); render(); } } }, "踏入並連續挑戰"));
      }
    }
    render();
    poll = setInterval(render, 500); // 戰況輪詢（modal 關閉即清除）
  }
  /* v263 一鍵例行巡檢 runner：批次迴圈自 modal 閉包提升（今日待辦 inline 執行共用 — 與 modal 內按鈕同契約）
     全走既有 sys 原子契約；回傳彙總物件，toast 由呼叫端發（單一彙總） */
  function runSweepArena() {
    const A = MG.sys.arena;
    let wins = 0, gems = 0, done = 0;
    while (A.fightsLeft() > 0) {
      let best = -1, bestChance = -1;
      for (let j = 0; j < A.SIZE; j++) {
        if (!A.canChallenge(j)) continue;
        const c = A.winChance(j);
        if (c > bestChance) { bestChance = c; best = j; }
      }
      if (best < 0) break;
      const r = A.fight(best);
      if (!r.ok) break;
      done++; if (r.win) wins++; gems += r.gems || 0;
    }
    return { done, wins, gems, txt: done > 0 ? wins + " 勝 " + (done - wins) + " 敗" + (gems ? "，+" + gems + " 鑽石" : "") : "" };
  }
  function runSweepDungeon() {
    const D = MG.sys.dungeon;
    let runs = 0, wins = 0, gold = 0, exp = 0;
    for (const def of D.DEFS) {
      if (!D.unlocked(def.id)) continue;
      while (D.left(def.id) > 0) {
        const r = D.run(def.id);
        if (!r.ok) break;
        runs++; if (r.win) wins++;
        gold += r.gold || 0; exp += r.exp || 0;
      }
    }
    return { runs, wins, gold, exp, txt: runs > 0 ? wins + "/" + runs + " 勝" + (gold ? "，金幣 +" + MG.util.fmt(gold) : "") + (exp ? "，經驗 +" + MG.util.fmt(exp) : "") : "" };
  }
  function runSweepWorldboss() {
    const W = MG.sys.worldboss;
    let done = 0, dmg = 0, killed = false, killBonus = 0;
    for (let i = 0; i < 3; i++) {
      const r = W.attack();
      if (!r.ok) break;
      done++; dmg += r.dmg;
      killed = killed || r.killed;
      killBonus += r.killBonus || 0;
    }
    return { done, dmg, killed, killBonus, txt: done > 0 ? "出戰 ×" + done + "：總傷 " + MG.util.fmt(dmg) + (killBonus ? "・速殺 +" + killBonus + " 鑽" : "") + (killed ? "・討伐成功！" : "") : "" };
  }
  function runAutoTower() {
    const T = MG.sys.tower;
    const st = S();
    const ids = MG.sys.hunters.formationIds ? MG.sys.hunters.formationIds() : [];
    const prog = T.progress ? T.progress() : { all: true };
    if (!ids.length || prog.all) return { done: 0, txt: "" };
    const res = T.autoClimb(ids);
    if (!res.ok) return { done: 0, txt: (res.stopped && res.stopped.reason) || res.reason || "" };
    return {
      done: res.climbed.length, honor: res.honor, gems: res.gems, stopped: res.stopped,
      txt: "×" + res.climbed.length + " 層・+" + res.honor + " 榮譽" + (res.gems ? "・+" + res.gems + " 鑽石" : "") + (res.stopped ? "・卡第 " + res.stopped.layer + " 層" : "・全通！")
    };
  }
  function runSweepRoyal() {
    const R = MG.sys.royal;
    if (!R.unlocked()) return { wins: 0, losses: 0, gain: 0, maxStreak: 0, txt: "" }; // v263FIX：未解鎖不執行（王國 Lv12 gate）
    let wins = 0, losses = 0, score0 = (S().royal || {}).score || 0, maxStreak = 0;
    while (R.fightsLeft() > 0) {
      const r = R.challenge();
      if (!r.ok) break;
      if (r.won) wins++; else losses++;
      maxStreak = Math.max(maxStreak, (S().royal || {}).streak || 0);
    }
    const gain = ((S().royal || {}).score || 0) - score0;
    return { wins, losses, gain, maxStreak, txt: wins + losses > 0 ? wins + " 勝 " + losses + " 敗・積分 +" + gain + (maxStreak > 0 ? "・最高連勝 " + maxStreak : "") : "" };
  }
  function runAbyssFight() {
    const A = MG.sys.abyss;
    const st = S();
    if (A.inAbyss()) { const a2 = A.ensure(); a2.autoRetry = true; return { done: 1, txt: "已開啟連續挑戰（深淵內）" }; }
    const r = A.enter();
    if (!r.ok) return { done: 0, txt: r.reason };
    const a2 = A.ensure(); a2.autoRetry = true;
    return { done: 1, txt: "踏入深淵並開啟連續挑戰" };
  }
  function openRoyal() {
    const st = S();
    const R = MG.sys.royal;
    if (!R.unlocked()) { // v261：王國 Lv12 解鎖 gate（changelog 承諾落地）
      const m0 = MG.ui.dom.modal("王者競技場", null, { icon: "icon_honor" });
      m0.panel.appendChild(MG.ui.dom.h("div", { class: "empty" }, "王國 Lv12 解鎖\n三隊制週迴圈 PvP — 多隊投資的每週回報"));
      return;
    }
    const m = MG.ui.dom.modal("王者競技場", null, { icon: "icon_honor" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    function render() {
      R.ensure();
      R.reanchorIfNeeded(st.royal);
      const r = st.royal;
      body.innerHTML = "";
      // v261 上週結算週報
      if (r.lastWeek) {
        body.appendChild(MG.ui.dom.h("div", { style: { background: "rgba(255,209,102,.08)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 8px", marginBottom: 8, fontSize: 11 } },
          "上週結算：積分 " + r.lastWeek.score + " → +" + r.lastWeek.coins + " 王者幣" + (r.lastWeek.bonus > 0 ? "（含分檔 +" + r.lastWeek.bonus + "）" : "")));
      }
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, textAlign: "center", marginBottom: 6 } },
        "三隊制週迴圈：出戰 3 隊對決幻影（各隊 3 戰 2 勝）— 週積分結算王者幣。持有 " + MG.util.fmt(st.currencies.royalCoins || 0) + " 幣・置換石 " + (st.currencies.swapStone || 0)));
      // v261 分檔進度（3/9/15 → +15/+30/+50 — RANK_BONUS 揭露）；v264FIX：以勝場分 tierScore 計（保底不灌爆分檔）
      {
        const ts = r.tierScore || 0;
        const tier = ts >= 15 ? 0 : ts >= 9 ? 1 : ts >= 3 ? 2 : null;
        const next = tier === null ? 3 : tier === 2 ? 9 : tier === 1 ? 15 : null;
        const pct = next ? Math.min(100, Math.round(ts / next * 100)) : 100;
        body.appendChild(MG.ui.dom.h("div", { style: { marginBottom: 8 } },
          MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 } },
            MG.ui.dom.h("span", null, "本週積分 " + r.score + (next ? "（勝場分 " + ts + "，距分檔 " + next + " 還差 " + Math.max(0, next - ts) + "）" : "（勝場分 " + ts + "，已達最高分檔）")),
            MG.ui.dom.h("span", { class: "sub" }, tier !== null ? "分檔 +" + [50, 30, 15][tier] : "分檔：3→+15・9→+30・15→+50")), // v261FIX：RANK_BONUS 值內聯
          MG.ui.dom.h("div", { class: "pbar", style: { height: 6 } }, MG.ui.dom.h("i", { style: { width: pct + "%" } })),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, marginTop: 2 } }, "連勝 " + r.streak + " 場（勝場 +3 幣＋連勝加成）")));
      }
      // 隊選擇 chips（v255 編隊批量複用 — 挑 3 隊；v261 選隊真正生效）
      const teamRow = MG.ui.dom.h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 } });
      for (let n = 0; n < 5; n++) {
        const unlocked = n < MG.sys.hunters.teamsUnlocked();
        const on = r.teamIds.includes(n);
        teamRow.appendChild(MG.ui.dom.h("div", {
          class: "chip" + (on ? " on" : ""), style: unlocked ? {} : { opacity: 0.55 },
          on: { click: () => {
            if (!unlocked) return;
            const cur = r.teamIds.slice();
            if (on) { if (cur.length > 1) r.teamIds = cur.filter(x => x !== n); }
            else if (cur.length < 3) { r.teamIds = cur.concat(n); }
            else MG.ui.dom.toast("最多出戰 3 隊（先取消一隊）", "bad", "icon_honor");
            render();
          } }
        }, "第 " + (n + 1) + " 隊" + (on ? " ✓" : "")));
      }
      body.appendChild(teamRow);
      // 挑戰按鈕
      const left = R.fightsLeft();
      const maxTeam = MG.sys.hunters.teamsUnlocked();
      body.appendChild(MG.ui.dom.h("button", {
        class: "btn gold", style: { width: "100%", marginBottom: 8 },
        disabled: r.teamIds.length !== 3 || left <= 0 || r.teamIds.some(n => n >= maxTeam), // v260FIX：鎖定隊不可出戰
        on: { click: () => {
          const res = R.challenge();
          if (!res.ok) { MG.ui.dom.toast(res.reason, "bad", "icon_honor"); return; }
          const lines = res.results.map(x => "第 " + x.team + " 隊 " + (x.win ? "勝" : "敗") + "（勝率 " + x.chance + "%）").join("・");
          MG.ui.dom.toast((res.won ? "🏆 三隊 2 勝！" : "惜敗 — ") + lines + "・本週積分 " + res.score, res.won ? "good" : "bad", "icon_honor");
          render();
        } }
      }, "挑戰幻影（剩 " + left + " 次/日・本週積分 " + r.score + "）"));
      // v268 一鍵挑戰剩餘次數：與 v198 競技場掃蕩對稱 — modal 內批量（複用 runSweepRoyal — v263 harness 驗證契約）
      if (left > 0) {
        const sweepReady = r.teamIds.length === 3 && !r.teamIds.some(n => n >= maxTeam);
        body.appendChild(MG.ui.dom.h("button", {
          class: "btn" + (sweepReady ? " gold" : ""), style: { width: "100%", marginBottom: 8 },
          disabled: !sweepReady,
          on: { click: () => {
            const res = runSweepRoyal();
            MG.ui.dom.toast(res.wins + res.losses > 0 ? "一鍵挑戰：" + res.txt : "今日次數已用完", res.wins + res.losses > 0 ? "good" : "", "icon_honor");
            render();
          } }
        }, "⚔ 一鍵挑戰剩餘 " + left + " 次"));
      }
      // v261 戰果面板（挑戰結果在 modal 內渲染 — toast 摘要保留）
      if (r.lastResults) {
        const rr = r.lastResults;
        body.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", borderRadius: 8, padding: "6px 8px", marginBottom: 8, fontSize: 11 } },
          "上次挑戰：" + rr.results.map(x => "第 " + x.team + " 隊 " + (x.win ? "✓" : "✗") + "（" + x.chance + "%）").join("・") + " → " + (rr.won ? "勝利" : "惜敗")));
      }
      // 幻影資訊
      for (let i = 0; i < 3; i++) {
        const o = r.opps[i];
        body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,.06)" } },
          MG.ui.dom.h("span", null, "幻影第 " + (i + 1) + " 隊（對我方第 " + ((r.teamIds[i] !== undefined ? r.teamIds[i] : i) + 1) + " 隊）" + (o.defeated ? " ✓" : "")), // v261FIX：與 teamPowerOf fallback 一致
          MG.ui.dom.h("span", { class: "sub" }, "戰力 " + MG.util.fmt(o.power) + "・我方勝率 " + Math.round(R.winChance(i) * 100) + "%")));
      }
      // 王者商店（週限）
      body.appendChild(MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 13, color: "var(--gold)", margin: "10px 0 5px" } },
        "王者商店", MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10, color: "var(--dim)" } }, "週一重置")));
      for (const d of R.shopList()) {
        const can = d.sold < d.stock && (st.currencies.royalCoins || 0) >= d.price;
        body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0", opacity: d.sold >= d.stock ? 0.5 : 1 }, title: d.name + "（" + d.price + " 王者幣・本週限購 " + d.sold + "/" + d.stock + "）" + (d.sold >= d.stock ? " — 本週售罄" : can ? " — 可兌換" : " — 王者幣不足") },
          MG.ui.dom.icon(d.icon, 20),
          MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } }, d.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, d.price + " 幣・本週 " + d.sold + "/" + d.stock)),
          MG.ui.dom.h("button", { class: "btn sm " + (can ? "gold" : ""), style: { flexShrink: 0, minHeight: 26 }, disabled: !can, on: { click: () => { const r2 = R.shopBuy(d.id); MG.ui.dom.toast(r2.ok ? "兌換成功：" + r2.name : r2.reason, r2.ok ? "good" : "bad", d.icon); render(); } } }, d.sold >= d.stock ? "售罄" : "兌換")));
      }
    }
    render();
  }
  /* v271 委託遠征營：板凳定時委託板 — 每日 6 張委託（品質/需求戰力確定性種子）、4-6 欄位、
     派遣 1-3 名空閒英雄（總戰力 ≥ 需求保證成功、職業匹配效率加成）、牆鐘完成自動發放、提前召回 50% */
  function openExpedition() {
    const st = S();
    const E = MG.sys.expedition;
    if (!E.unlocked()) {
      const m0 = MG.ui.dom.modal("委託遠征營", null, { icon: "icon_chest" });
      m0.panel.appendChild(MG.ui.dom.h("div", { class: "empty" }, "王國 Lv16 解鎖\n板凳英雄定時委託 — 閒置戰力換每日資源"));
      return;
    }
    const m = MG.ui.dom.modal("委託遠征營", null, { icon: "icon_chest" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    // 派遣選擇（任務 idx → 選 1-3 名空閒英雄）
    const pickTask = (taskIdx) => {
      const t = E.tasks()[taskIdx];
      const freeSlot = E.progress().list.findIndex(s => !s);
      if (freeSlot < 0) { MG.ui.dom.toast("欄位已滿 — 先召回或等完成", "bad", "icon_chest"); return; }
      const avail = (st.hunters || []).filter(h => !E.isBusy(h) && !(st.hunt.dispatchIds || []).includes(h.id) && !(st.formation || []).includes(h.id));
      avail.sort((a, b) => MG.sys.hunters.power(b) - MG.sys.hunters.power(a));
      const m2 = MG.ui.dom.modal("派遣 — " + t.name, null, { icon: "icon_chest" });
      const b2 = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4 } });
      const picked = [];
      const update = () => {
        b2.innerHTML = "";
        for (const h of avail) {
          const sel = picked.includes(h.id);
          b2.appendChild(MG.ui.dom.h("div", {
            style: { fontSize: 10, padding: "4px 6px", borderRadius: 6, border: "1px solid " + (sel ? "var(--gold)" : "var(--line)"), background: "var(--panel2)", cursor: "pointer", textAlign: "center" },
            on: { click: () => { const i = picked.indexOf(h.id); if (i >= 0) picked.splice(i, 1); else if (picked.length < 3) picked.push(h.id); else MG.ui.dom.toast("最多派遣 3 名", "bad", "icon_chest"); update(); } }
          }, h.name, MG.ui.dom.h("div", { class: "sub", style: { fontSize: 8 } }, "Lv" + h.level + "・戰力 " + MG.util.fmt(MG.sys.hunters.power(h)) + (sel ? " ✓" : ""))));
        }
        if (!avail.length) b2.appendChild(MG.ui.dom.h("div", { class: "sub", style: { gridColumn: "1 / -1", fontSize: 10, textAlign: "center" } }, "沒有可派遣的空閒英雄"));
        b2.appendChild(MG.ui.dom.h("button", {
          class: "btn gold", style: { gridColumn: "1 / -1", minHeight: 32 },
          on: { click: () => {
            if (!picked.length) { MG.ui.dom.toast("至少選 1 名英雄", "bad", "icon_chest"); return; }
            const r = E.dispatch(freeSlot, taskIdx, picked);
            MG.ui.dom.toast(r.ok ? "已派遣！" + t.hours + "h 後自動結算" : r.reason, r.ok ? "good" : "bad", "icon_chest");
            m2.close();
            render();
            MG.ui.screens.refreshAll();
          } }
        }, "派遣（" + picked.length + "/3）"));
      };
      update();
      m2.panel.appendChild(b2);
    };
    function render() {
      E.ensure();
      const p = E.progress();
      body.innerHTML = "";
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, textAlign: "center", marginBottom: 6 } },
        "每日委託（同天同圖可分享）· 欄位 " + p.list.length + "（王國 Lv20/24 擴充）· 完成自動發放・召回領 50%"));
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginBottom: 3 } }, "今日委託（品質 × 時長效率 → 獎勵錨 U = 5000×1.35^(kl-1)）"));
      // 任務列（點擊派遣 — v271FIX：派遣中標記用名稱匹配（槽存快照 — 跨日後 taskIdx 錯位））
      for (const t of p.tasks) {
        const slotIdx = p.list.findIndex(s => s && s.name === t.name);
        body.appendChild(MG.ui.dom.h("div", {
          style: { display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,.06)", cursor: slotIdx < 0 ? "pointer" : "default", opacity: slotIdx >= 0 ? 0.7 : 1 },
          on: slotIdx < 0 ? { click: () => pickTask(t.idx) } : {},
          title: "「" + t.name + "」品質 " + t.qual + " ×" + t.qualMul + (t.cls ? "・需職業：" + MG.data.hunters.classes[t.cls].name : "") + "・時長 " + t.hours + "h" + (slotIdx >= 0 ? "（已派遣，剩 " + MG.util.fmtClock(Math.max(0, p.list[slotIdx].until - Date.now())) + "）" : " — 點擊派遣空閒英雄（總戰力 ≥ " + MG.util.fmt(t.need) + " 保證成功）")
        },
          MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } },
            MG.ui.dom.h("span", { style: { fontWeight: 800 } }, t.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 9 } },
              "[" + t.qual + " ×" + t.qualMul + "]" + (t.cls ? "・需" + MG.data.hunters.classes[t.cls].name : "") + "・" + t.hours + "h")),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9 } }, "需求戰力 " + MG.util.fmt(t.need) + (slotIdx >= 0 ? "・已派遣" : "・點擊派遣"))),
          slotIdx >= 0 ? MG.ui.dom.h("span", { style: { fontSize: 9, color: "var(--gold)" } }, "⏳ " + MG.util.fmtClock(Math.max(0, p.list[slotIdx].until - Date.now()))) : null));
      }
      // 欄位（派遣中 + 召回）
      body.appendChild(MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 12, color: "var(--gold)", margin: "8px 0 4px" } }, "遠征欄位"));
      const slotRow = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 } });
      for (let i = 0; i < p.list.length; i++) {
        const s = p.list[i];
        if (!s) {
          slotRow.appendChild(MG.ui.dom.h("div", { style: { minHeight: 46, borderRadius: 8, border: "1px dashed var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--dim)" } }, "空欄位"));
          continue;
        }
        const t = { name: s.name, hours: s.hours }; // v271FIX：槽快照（跨日後 tasks() 無此任務）
        const done = Date.now() >= s.until;
        slotRow.appendChild(MG.ui.dom.h("div", { style: { minHeight: 46, borderRadius: 8, border: "1px solid " + (done ? "#57c96b" : "var(--gold)"), background: "var(--panel2)", padding: "4px 6px", fontSize: 10 } },
          MG.ui.dom.h("div", { style: { fontWeight: 800 } }, t.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 9 } }, done ? "✓ 已結算" : MG.util.fmtClock(Math.max(0, s.until - Date.now())))),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9 } }, "戰力 " + MG.util.fmt(s.total) + "・效率 ×" + s.eff.toFixed(1) + (done ? "・獎勵已入袋" : "")),
          done ? null : MG.ui.dom.h("button", { class: "btn sm", style: { minHeight: 22, marginTop: 3 }, on: { click: () => { const r = E.recall(i); MG.ui.dom.toast(r.ok ? "提前召回「" + r.name + "」+金幣 " + MG.util.fmt(r.gold) : r.reason, r.ok ? "good" : "bad", "icon_chest"); render(); MG.ui.screens.refreshAll(); } } }, "召回(50%)")));
      }
      body.appendChild(slotRow);
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, textAlign: "center", marginTop: 8 } },
        "派遣規則：1-3 名空閒英雄・總戰力 ≥ 需求保證成功・職業匹配效率 ×1.1-1.3・遠征中不可編隊/共鳴/置換/遣散"));
    }
    render();
  }
  /* v265 奇境迷宮：週限 roguelike — 路線條列（分支三選一）＋節點推進（戰鬥/寶箱/事件/首領）＋增益列＋里程碑 */
  function openMaze() {
    const st = S();
    const MZ = MG.sys.maze;
    if (!MZ.unlocked()) {
      const m0 = MG.ui.dom.modal("奇境迷宮", null, { icon: "icon_tower" });
      m0.panel.appendChild(MG.ui.dom.h("div", { class: "empty" }, "王國 Lv14 解鎖\n每週一次的構築實驗：路線選擇＋三選一增益"));
      return;
    }
    const m = MG.ui.dom.modal("奇境迷宮", null, { icon: "icon_tower" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    function render() {
      MZ.ensure();
      const p = MZ.progress();
      body.innerHTML = "";
      // v266 週一倒數（週限重置錨 — fmtClock 同構）
      const wkLeft = Math.max(0, MG.sys.honorshop.weekKey() ? (() => {
        const d = new Date();
        const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7) + 7);
        return monday - Date.now();
      })() : 0);
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, textAlign: "center", color: "var(--dim)", marginBottom: 4 } },
        "距週一重置 " + MG.util.fmtClock(wkLeft) + (p.finished ? "・本週已全通" : "・第 " + (p.layer + 1) + " 層・節點 " + (p.node + 1) + "/12")));
      // v266 里程碑標記（已領 ✓／下一目標高亮）
      {
        const msKeys = Object.keys(MZ.MILESTONES).map(Number).sort((a, b) => a - b);
        body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" } },
          msKeys.map(n => {
            const done = p.node >= n;
            const next = n === msKeys.find(k => k > p.node); // v266FIX：僅下一個目標高亮（原全體未達成都高亮）
            return MG.ui.dom.h("span", { style: { fontSize: 9, padding: "2px 6px", borderRadius: 4, background: done ? "rgba(87,201,107,.15)" : next ? "rgba(255,209,102,.12)" : "var(--panel2)", border: "1px solid " + (done ? "#57c96b" : next ? "var(--gold2)" : "var(--line)"), color: done ? "#57c96b" : next ? "var(--gold)" : "var(--dim)" } },
              "節點 " + n + (done ? " ✓" : next ? "（還差 " + (n - p.node) + "）" : ""));
          })));
      }
      // v266 本層路線選擇（層入口且未選 — 真·三選一）
      const layer = Math.min(MZ.LAYERS - 1, Math.floor(p.node / MZ.NODES_PER_LAYER));
      const idx = p.node % MZ.NODES_PER_LAYER;
      const branchPicked = st.maze.branch[layer] !== undefined;
      if (!p.finished && idx === 0 && !branchPicked) {
        body.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid var(--gold)", borderRadius: 8, padding: "8px 10px", marginBottom: 8 } },
          MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 12, color: "var(--gold)", marginBottom: 4 } }, "選擇本層路線（第 " + (layer + 1) + " 層）"),
          MG.ui.dom.h("div", { style: { display: "flex", gap: 6 } },
            MZ.branchOptions(layer).map(bo => MG.ui.dom.h("button", {
              class: "btn sm", style: { flex: 1, minHeight: 44, flexDirection: "column", gap: 2 },
              on: { click: () => { const r = MZ.pickBranch(layer, bo.rot); MG.ui.dom.toast(r.ok ? "已選擇路線" + (bo.rot + 1) : r.reason, r.ok ? "good" : "bad", "icon_tower"); render(); } }
            },
              MG.ui.dom.h("span", { style: { fontSize: 11, fontWeight: 800 } }, "路線 " + (bo.rot + 1)),
              MG.ui.dom.h("span", { style: { fontSize: 9, opacity: 0.8 } }, bo.seq.map(t => t === "boss" ? "首領" : t === "fight" ? "戰" : t === "chest" ? "箱" : "事").join("→")))))));
      }
      // 增益列
      const boonTxt = Object.keys(p.boons).length
        ? Object.keys(p.boons).map(k => MZ.BOONS[k].name + " ×" + p.boons[k] + "（+" + MZ.BOONS[k].mul[p.boons[k] - 1] + "%）").join("・")
        : "尚未獲得增益";
      body.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", borderRadius: 8, padding: "6px 8px", marginBottom: 8, fontSize: 11 }, title: Object.keys(p.boons).length ? Object.keys(p.boons).map(k => "增益「" + MZ.BOONS[k].name + "」×" + p.boons[k] + "（每層 +" + MZ.BOONS[k].mul[p.boons[k] - 1] + "%・同系最多 ×3）").join("｜") : "尚未獲得增益 — 事件節點可選擇增益" },
        MG.ui.dom.h("div", { style: { fontWeight: 800 } }, "增益：" + boonTxt, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontWeight: 400 } }, "總乘數 ×" + MZ.totalMul().toFixed(2)))));
      // 當前節點操作
      if (!p.finished) {
        const t = MZ.nodeType(layer, idx);
        body.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", border: "1px solid var(--gold)", borderRadius: 8, padding: "8px 10px", marginBottom: 8 } },
          MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 12, color: "var(--gold)" } }, "節點 " + (p.node + 1) + "：" + (t === "boss" ? "層末首領" : t === "fight" ? "戰鬥" : t === "chest" ? "寶箱" : "事件")),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, margin: "2px 0 6px" } }, MZ.nodeDesc(layer, idx) + (t === "fight" || t === "boss" ? "・勝率 " + Math.round(MZ.winChance(layer) * 100) + "%" : t === "chest" ? "・" + MZ.chestContents(layer, idx).map(([m, q]) => (MG.config.MATS[m] || {}).name + " ×" + q).join("・") : "")), // v266 寶箱具名預告
          t === "event" ? (() => {
            const opts = MZ.boonOptions();
            return MG.ui.dom.h("div", { style: { display: "flex", gap: 6 } },
              opts.map(k => {
                const full = (p.boons[k] || 0) >= 3; // v266FIX：已滿系禁用＋只顯示「已滿」（原「下次 +25%（已滿）」矛盾且仍可點）
                return MG.ui.dom.h("button", {
                  class: "btn sm", style: { flex: 1, minHeight: 30, flexDirection: "column", gap: 1, opacity: full ? 0.55 : 1 },
                  disabled: full ? true : undefined,
                  on: { click: () => { const r = MZ.boonPick(k); MG.ui.dom.toast(r.ok ? "獲得增益：" + MZ.BOONS[k].name + " ×" + (MZ.progress().boons[k] || 0) : r.reason, r.ok ? "good" : "bad", "icon_tower"); if (r.ok) { MZ.advance(); render(); } } }
                },
                  MG.ui.dom.h("span", { style: { fontWeight: 800 } }, MZ.BOONS[k].name + (full ? "（已滿）" : "")),
                  MG.ui.dom.h("span", { style: { fontSize: 9, opacity: 0.8 } }, full ? "本系已達上限" : "下次 +" + MZ.BOONS[k].mul[Math.min(2, p.boons[k] || 0)] + "%・同系最多 ×3"));
              }));
          })() : MG.ui.dom.h("button", {
            class: "btn gold", style: { width: "100%" },
            on: { click: () => {
              const r = MZ.advance();
              MG.ui.dom.toast(r.ok ? (r.finished ? "全通！大獎已發（+300 鑽・徽章碎片 ×2）" : "推進至節點 " + r.node) : r.reason, r.ok ? "good" : "bad", "icon_tower");
              render();
            } }
          }, t === "boss" ? "挑戰首領" : t === "fight" ? "挑戰" : "開啟寶箱")));
      }
      // 里程碑價值行（靜態說明）
      body.appendChild(MG.ui.dom.h("div", { style: { fontSize: 10, color: "var(--dim)", marginTop: 4 } },
        "里程碑：節點 3/6/9/12 → 虛空 10/15/20/25・書 2/3/4/5・T3 1/2/3/4；全通 +300 鑽・徽章碎片 ×2"));
      // 路線預覽（當前層 4 節點型別 — v266 高亮所選分支）
      body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" } },
        [0, 1, 2, 3].map(i => {
          const t = MZ.nodeType(layer, i);
          const done = p.node > layer * 4 + i;
          return MG.ui.dom.h("span", { style: { fontSize: 10, padding: "2px 8px", borderRadius: 4, background: done ? "rgba(87,201,107,.15)" : "var(--panel2)", border: "1px solid " + (done ? "#57c96b" : "var(--line)"), color: done ? "#57c96b" : "var(--dim)" } },
            (t === "boss" ? "首領" : t === "fight" ? "戰" : t === "chest" ? "箱" : "事") + (done ? " ✓" : ""));
        })));
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, textAlign: "center", marginTop: 6 } },
        branchPicked ? "本層路線已選定（同週全玩家相同 — 可分享攻略）；失敗可調整編隊重試" : "每層入口可選路線（先拿箱子還是先拿增益）"));
    }
    render();
  }
  /* v162 七日豪禮：新手七日任務鏈，最終獎勵自選傳說英雄 */
  function openWelcome() {
    const st = S();
    const W = MG.sys.welcome;
    const m = MG.ui.dom.modal("七日豪禮", null, { wide: true, icon: "icon_chest" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    function render() {
      const items = W.list();
      const done = items.filter(x => x.claimed).length;
      body.innerHTML = "";
      body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid var(--gold)", padding: "8px 10px", borderRadius: 8, marginBottom: 8, fontSize: 12 } },
        MG.ui.dom.h("span", { style: { fontWeight: 900, fontSize: 14, color: "var(--gold)" } }, "第 " + (W.unlockedDays() + 1) + " 天"),
        MG.ui.dom.h("span", { class: "sub" }, "已領 " + done + " / " + items.length + " 項 · 最終獎勵：自選傳說英雄")),
        // v330：總體進度條
        MG.ui.dom.h("div", { class: "pbar", style: { height: 5, marginBottom: 8 } }, MG.ui.dom.h("i", { style: { width: Math.min(100, Math.round(done / items.length * 100)) + "%" } })));
      // v218 QoL：七日豪禮全部領取（回鍋玩家一次可領多天 — 與 v203/v208 claim-all 模式對稱）
      {
        const claimable = items.filter(q => W.canClaim(q.id) && !q.claimed).length;
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: "6px 8px", marginBottom: 6 } },
          MG.ui.dom.icon("icon_chest", 18),
          MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } },
            "七日豪禮", MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, claimable ? "可領取 " + claimable + " 項" : "暫無可領取")),
          MG.ui.dom.h("button", {
            class: "btn sm " + (claimable ? "gold" : ""), disabled: !claimable,
            on: { click: () => {
              const r = W.claimAll();
              if (r.n > 0) MG.ui.dom.toast("七日豪禮已領取 " + r.n + " 項！", "good", "icon_chest");
              if (r.legend) { pickLegend("d7"); return; } // D7 傳說保留選角
              render();
            } }
          }, "全部領取" + (claimable ? " (" + claimable + ")" : ""))));
      }
      for (const q of items) {
        const ready = W.canClaim(q.id);
        const pct = Math.min(100, q.cur / q.req.target * 100);
        const dayBadge = MG.ui.dom.h("div", { style: { width: 34, fontWeight: 900, fontSize: 13, color: q.day === 6 ? "var(--gold)" : "var(--dim)", textAlign: "center" } }, "D" + (q.day + 1));
        const growBox = MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } },
            q.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, q.reward.legend ? "自選傳說英雄！" : rewardText(q.reward))),
          q.unlocked ? MG.ui.dom.h("div", { class: "pbar", style: { height: 5, marginTop: 4 } }, MG.ui.dom.h("i", { style: { width: pct + "%" } })) : null,
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, marginTop: 2 } }, q.unlocked ? q.cur + " / " + q.req.target : "第 " + (q.day + 1) + " 天解鎖"));
        const btn = MG.ui.dom.h("button", { class: "btn sm " + (ready ? "gold" : ""), style: { minHeight: 30 }, disabled: !ready, on: { click: () => {
          const r = W.claim(q.id);
          if (!r.ok) { MG.ui.dom.toast(r.reason, "bad", "icon_chest"); return; }
          if (r.legend) { pickLegend(q.id); return; }
          MG.ui.dom.toast("獎勵已領取！", "good", "icon_chest");
          render();
        } } }, q.claimed ? "已領" : (q.unlocked ? "領取" : "🔒"));
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 8, marginBottom: 6, opacity: q.claimed ? 0.55 : q.unlocked ? 1 : 0.45 }, title: "第 " + (q.day + 1) + " 天「" + q.name + "」（" + (q.unlocked ? q.cur + "/" + q.req.target : "待解鎖") + "）— 獎勵：" + (q.reward.legend ? "自選傳說英雄！" : rewardText(q.reward)) + (q.claimed ? "（已領取）" : ready ? "（可領取）" : "") }, dayBadge, growBox, btn));
      }
    }
    /* 自選傳說英雄（第 7 天） */
    function pickLegend(qid) {
      const L = MG.data.hunters.LEGENDS || {};
      const pm = MG.ui.dom.modal("選擇傳說英雄", null, { wide: true, icon: "icon_recruit" });
      pm.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 8, textAlign: "center" } },
        "從八位傳說英雄中選擇一位加入王國（固定名字與專屬被動）"));
      for (const lid of Object.keys(L)) {
        const ld = L[lid];
        const cls = MG.data.hunters.classes[ld.cls];
        pm.panel.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 8, marginBottom: 6, cursor: "pointer" }, on: { click: () => {
          const r = MG.sys.welcome.createLegend(lid);
          MG.ui.dom.toast(r.ok ? "傳說英雄「" + r.name + "」加入王國！" : r.reason, r.ok ? "good" : "bad", "icon_recruit");
          if (r.ok) { pm.close(); render(); }
        } } },
          MG.ui.dom.icon(cls.icon, 24),
          MG.ui.dom.h("div", { class: "grow" },
            MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 13, color: "var(--gold)" } }, "✦ " + ld.name),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, cls.name + " · " + ld.passive.name + "：" + ld.passive.desc),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, fontStyle: "italic" } }, "「" + ld.flavor + "」"))));
      }
    }
    render();
  }
  /* quests */
  function msToMidnight() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1).getTime() - n.getTime();
  }
  /* v151：距離下週一 00:00 的毫秒數 */
  function weeklyLeft() {
    const n = new Date();
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    const day = d.getDay() || 7; // 1=Mon … 7=Sun
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (8 - day)).getTime() - n.getTime();
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
      for (const [id, label] of [["main", "主線"], ["daily", "每日"], ["weekly", "每週"]]) {
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
      } else if (t === "weekly") {
        MG.sys.meta.ensureWeekly();
        const wk = st.quests.weekly;
        const claimable = wk.list.filter(w => {
          if (w.done) return false;
          const def = QD.WEEKLY_POOL.find(x => x.id === w.id);
          // v214FIX：動態目標（與 claimAllWeekly 判定一致 — 原固定 target 使 w7 縮放後按鈕誤亮）
          return def && (w.prog || 0) >= (MG.sys.meta.questTarget ? MG.sys.meta.questTarget(def) : def.req.target);
        }).length;
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: "6px 8px", marginBottom: 6 } },
          MG.ui.dom.icon("icon_speed", 16),
          MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } }, "每週任務於週一重置",
            MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, "剩 " + MG.util.fmtClock(weeklyLeft()))),
          MG.ui.dom.h("button", {
            class: "btn sm " + (claimable ? "gold" : ""), disabled: !claimable,
            on: { click: () => { if (MG.sys.meta.claimAllWeekly()) { MG.ui.dom.toast("每週獎勵已全數領取！", "good", "icon_quest"); show("weekly"); } } }
          }, "全部領取" + (claimable ? " (" + claimable + ")" : ""))));
        for (const w of wk.list) {
          const def = QD.WEEKLY_POOL.find(x => x.id === w.id);
          if (!def) continue;
          const tgt = MG.sys.meta.questTarget ? MG.sys.meta.questTarget(def) : def.req.target; // v214：動態目標
          const cur = Math.min(tgt, w.prog || 0);
          const done = w.done || cur >= tgt;
          body.appendChild(MG.ui.dom.h("div", { class: "row", style: { marginBottom: 6, padding: 8 }, title: def.name + "（進度 " + cur + "/" + tgt + "）— 獎勵：" + rewardText(MG.sys.meta.scaleQuestGold(def.reward, 1.3)) + "・週一重置" },
            MG.ui.dom.h("div", { class: "grow" },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, def.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, rewardText(MG.sys.meta.scaleQuestGold(def.reward, 1.3)))),
              MG.ui.dom.h("div", { class: "pbar", style: { height: 6, marginTop: 4 } }, MG.ui.dom.h("i", { style: { width: (cur / tgt * 100) + "%" } })),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, marginTop: 2 } }, cur + " / " + tgt)),
            // v226 任務「前往」深鏈（未完成時顯示）
            !done ? MG.ui.dom.h("button", { class: "btn sm ghost", style: { minHeight: 26, padding: "0 8px", fontSize: 9 }, on: { click: () => { m.close(); questGoTo(def.req.type); } } }, "前往") : null,
            MG.ui.dom.h("button", { class: "btn sm " + (done && !w.done ? "gold" : ""), disabled: !done || w.done, on: { click: () => { if (MG.sys.meta.claimWeekly(w.id)) { MG.ui.dom.toast("獎勵已領取！", "good", "icon_quest"); show("weekly"); } } } }, w.done ? "已領" : "領取")));
        }
      } else {
        const claimable = st.quests.daily.list.filter(d => {
          if (d.done) return false;
          const def = QD.DAILY_POOL.find(x => x.id === d.id);
          return def && (d.prog || 0) >= def.req.target; // v214FIX：日進度判定
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
          const cur = Math.min(def.req.target, d.prog || 0); // v214FIX：日進度（非終身統計）
          const done = d.done || cur >= def.req.target;
          body.appendChild(MG.ui.dom.h("div", { class: "row", style: { marginBottom: 6, padding: 8 }, title: def.name + "（進度 " + cur + "/" + def.req.target + "）— 獎勵：" + rewardText(MG.sys.meta.scaleQuestGold(def.reward)) + "・午夜重置" },
            MG.ui.dom.h("div", { class: "grow" },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, def.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, rewardText(MG.sys.meta.scaleQuestGold(def.reward)))),
              MG.ui.dom.h("div", { class: "pbar", style: { height: 6, marginTop: 4 } }, MG.ui.dom.h("i", { style: { width: (cur / def.req.target * 100) + "%" } })),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, marginTop: 2 } }, cur + " / " + def.req.target)),
            // v226 任務「前往」深鏈（未完成時顯示）
            !done ? MG.ui.dom.h("button", { class: "btn sm ghost", style: { minHeight: 26, padding: "0 8px", fontSize: 9 }, on: { click: () => { m.close(); questGoTo(def.req.type); } } }, "前往") : null,
            MG.ui.dom.h("button", { class: "btn sm " + (done && !d.done ? "gold" : ""), disabled: !done || d.done, on: { click: () => { if (MG.sys.meta.claimDaily(d.id)) { MG.ui.dom.toast("獎勵已領取！", "good", "icon_quest"); show("daily"); } } } }, d.done ? "已領" : "領取")));
        }
      }
    }
    show("main");
  }
  /* v226 任務「前往」深鏈：req.type → 目標畫面/功能（任務列零導航的解法） */
  function questGoTo(type) {
    const scr = MG.ui.screens;
    const M = MG.ui.more;
    switch (type) {
      case "kill": case "stage": case "boss": case "gold": case "mat": case "item":
        scr.show("hunt"); break; // 擊殺/推關/金幣/素材/裝備 → 狩獵
      case "enhance": scr.show("equipment"); break;
      case "recruit": if (MG.ui.hunters && MG.ui.hunters.openRecruit) MG.ui.hunters.openRecruit(); else scr.show("hunters"); break;
      case "levelup": case "promote": case "starup": case "star6": case "hunterlvl": case "set": case "gem":
        scr.show("hunters"); break;
      case "login": M.openCheckin(); break;
      case "arena": M.openArena(); break;
      case "dungeon": M.openDungeon(); break;
      case "kingdom": case "building": scr.show("kingdom"); break;
      case "awaken": M.openAltar(); break;
      case "welcome": if (M.openWelcome) M.openWelcome(); else scr.show("more"); break;
      case "codex": scr.show("more"); break;
      default: scr.show("hunt");
    }
  }
  /* v228 限量商店批量兌換：stepper（−/xN/+）＋「兌換 ×N」鈕 — 迴圈單兌至庫存/貨幣不足（守衛天然生效） */
  function shopBulkBtn(opts) {
    const { stock, onRedeem, refresh, label, confirmOver } = opts;
    const max = Math.max(0, stock);
    let qty = Math.min(1, max);
    const qtyEl = MG.ui.dom.h("button", { class: "chip", style: { minWidth: 34, justifyContent: "center", padding: "2px 6px", minHeight: 26, fontWeight: 900, fontSize: 12, color: "var(--gold)", flexShrink: 0 }, on: { click: () => {
      const v = prompt(label + " 數量（1-" + Math.max(1, max) + "）", String(qty)); // v238FIX：prompt 標籤隨語境
      const n = parseInt(v, 10);
      if (!isNaN(n) && n >= 1 && n <= Math.max(1, max)) { qty = Math.min(n, max); sync(); }
    } } }, "x" + qty);
    const btn = MG.ui.dom.h("button", {
      class: "btn sm " + (max > 0 ? "gold" : ""), style: { flexShrink: 0, whiteSpace: "nowrap" },
      disabled: max <= 0,
      on: { click: () => {
        const run = () => {
          let done = 0;
          for (let i = 0; i < qty; i++) { const r = onRedeem(); if (!r || !r.ok) break; done++; }
          MG.ui.dom.toast(done > 0 ? label + " ×" + done + " 完成" : "庫存或資源不足", done > 0 ? "good" : "bad", "icon_chest");
          if (done > 0) refresh();
        };
        // v238：confirmOver — RNG 批量（裝備連製）大額前確認（v208 模式）；v238FIX：文案不拼接成本
        if (confirmOver && qty > confirmOver) MG.ui.dom.confirm(label + " ×" + qty, "將連續執行 " + qty + " 次「" + label + "」，資源不足時自動停止。確定？", run, { okText: "執行" });
        else run();
      } }
    }, label + (max > 0 ? " ×" + qty : ""));
    const step = (txt, fn, disabled) => MG.ui.dom.h("button", { class: "chip", style: { padding: "2px 8px", minHeight: 26, flexShrink: 0 }, disabled, on: { click: fn } }, txt);
    // v228FIX：qty 變動同步按鈕標籤（原顯示 ×1 卻實際兌換 ×N）；max<=0 停用 stepper
    const sync = () => {
      qtyEl.textContent = "x" + qty;
      btn.textContent = label + (max > 0 ? " ×" + qty : "");
      dec.disabled = max <= 0;
      inc.disabled = max <= 0;
      qtyEl.disabled = max <= 0;
    };
    const dec = step("−", () => { qty = Math.max(1, qty - 1); sync(); }, max <= 0);
    const inc = step("+", () => { qty = Math.min(max || 1, qty + 1); sync(); }, max <= 0);
    return { wrap: MG.ui.dom.h("div", { style: { display: "flex", gap: 4, alignItems: "center", flexShrink: 0 } }, dec, qtyEl, inc, btn) };
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
      // v333：成就總體進度條
      MG.ui.dom.h("div", { class: "pbar", style: { height: 5, marginTop: 4 } }, MG.ui.dom.h("i", { style: { width: Math.min(100, Math.round(claimed / QD.ACH.length * 100)) + "%" } })),
      MG.ui.dom.h("button", {
        class: "btn sm " + (claimable ? "gold" : ""), disabled: !claimable,
        on: { click: () => { if (MG.sys.meta.claimAllAch()) { MG.ui.dom.toast("成就獎勵已全數領取！", "good", "icon_ach"); openAch(); m.close(); } } }
      }, "全部領取")));
    for (const a of QD.ACH) {
      const done = st.achievements[a.id];
      const ready = MG.sys.meta.achClaimable(a);
      body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 8, opacity: done ? 0.5 : 1 }, title: a.name + " — " + a.desc + "。獎勵：" + rewardText(a.reward) + (done ? "（已領取）" : ready ? "（可領取）" : "（未達成）") },
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
      // v332：完成度進度條
      MG.ui.dom.h("div", { class: "pbar", style: { height: 6, marginTop: 4 } }, MG.ui.dom.h("i", { style: { width: Math.min(100, Math.floor(pct * 100)) + "%" } })),
      MG.ui.dom.h("div", { class: "pbar", style: { marginTop: 4 } }, MG.ui.dom.h("i", { style: { width: (pct * 100) + "%" } })));
    m.panel.appendChild(head);
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    // v203 QoL：圖鑑全部領取（魔物/總完成度/英雄收集里程碑）
    {
      const claimable = MG.sys.meta.codexClaimableCount();
      body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: "6px 8px", marginBottom: 6 } },
        MG.ui.dom.icon("icon_codex", 18),
        MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } },
          "里程碑獎勵", MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, claimable ? "可領取 " + claimable + " 項" : "暫無可領取")),
        MG.ui.dom.h("button", {
          class: "btn sm " + (claimable ? "gold" : ""), disabled: !claimable,
          on: { click: () => { const n = MG.sys.meta.claimAllCodex(); if (n > 0) { MG.ui.dom.toast("圖鑑獎勵已全數領取（" + n + " 項）！", "good", "icon_codex"); openCodex(); m.close(); } } }
        }, "全部領取")));
    }
    // total milestones
    for (const t of QD.CODEX_TOTAL) {
      if (pct * 100 < t.pct - 25) continue;
      const key = "t:" + t.pct;
      const claimed = MG.sys.meta.codexMilestoneClaimed(key);
      const ready = pct * 100 >= t.pct;
      body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 7 }, title: "圖鑑完成度達 " + t.pct + "%（目前 " + Math.floor(pct * 100) + "%）— " + t.fx + "。獎勵：" + rewardText(t.r) + (claimed ? "（已領取）" : ready ? "（可領取）" : "（未達標）") },
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, "圖鑑 " + t.pct + "%：" + t.fx),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, rewardText(t.r))),
        MG.ui.dom.h("button", { class: "btn sm " + (ready && !claimed ? "gold" : ""), disabled: !ready || claimed, on: { click: () => { if (MG.sys.meta.claimCodexMilestone(key)) { MG.ui.dom.toast("圖鑑獎勵已領取！", "good", "icon_codex"); openCodex(); m.close(); } } } }, claimed ? "已領" : "領取")));
    }
    // v180 英雄圖鑑：職業收集里程碑（累計獲得含已遣散；加成自動生效、獎勵手動領取）
    body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "英雄收集")));
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { padding: "0 4px 6px", fontSize: 11 } },
      "累計獲得英雄（含已遣散）達標後：該職業全體永久攻擊加成，最多 +10%"));
    for (const c of Object.keys(MG.data.hunters.classes)) {
      const cls = MG.data.hunters.classes[c];
      const count = MG.sys.meta.heroCodexCount(c);
      const bonus = MG.sys.meta.heroCodexAtkBonus(c);
      const row = MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", background: "var(--panel2)", borderRadius: 8, marginBottom: 4 }, title: cls.name + " — 累計獲得 " + count + " 位（含已遣散）" + (bonus ? "・全體" + cls.name + "攻擊 +" + Math.round(bonus * 100) + "%（永久）" : "・每達里程碑永久 +2% 攻擊（最多 +10%）") },
        MG.ui.dom.icon(cls.icon, 18),
        MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
          MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 11 } },
            MG.ui.dom.h("span", null, cls.name), MG.ui.dom.h("span", { style: { color: bonus ? "var(--gold)" : "var(--dim)" } }, "已獲 " + count + " 位" + (bonus ? "・攻 +" + Math.round(bonus * 100) + "%" : ""))),
          MG.ui.dom.h("div", { style: { display: "flex", gap: 3, marginTop: 3 } },
            (QD.HERO_CODEX_MILESTONES || []).map(ms => {
              const claimed = MG.sys.meta.heroCodexClaimed(c, ms.n);
              const ready = count >= ms.n && !claimed;
              return MG.ui.dom.h("button", {
                class: "btn sm", style: { padding: "2px 6px", minHeight: 22, fontSize: 9 },
                disabled: !ready, on: { click: () => { if (MG.sys.meta.claimHeroCodex(c, ms.n)) { MG.ui.dom.toast(cls.name + "圖鑑獎勵已領取！", "good", "icon_codex"); openCodex(); m.close(); } } }
              }, (claimed ? "✓" : "") + ms.n + "位 " + rewardText(ms.r));
            }))));
      body.appendChild(row);
    }
    body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "魔物討伐")));
    // v336：魔物搜索（名稱/區域即時過濾 — 農素材找怪不翻頁）
    const searchBox = MG.ui.dom.h("input", { type: "text", placeholder: "搜尋魔物名稱或區域…", style: { width: "100%", boxSizing: "border-box", padding: "6px 8px", marginBottom: 6, background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--text)", fontSize: 12, borderRadius: 6 } });
    body.appendChild(searchBox);
    const codexBody = MG.ui.dom.h("div", null);
    body.appendChild(codexBody);
    function renderCodex(q) {
      codexBody.innerHTML = "";
      for (const r of MG.data.monsters.regions) {
        const all = [].concat(r.monsters, [r.boss]);
        const matches = q ? all.filter(mo => mo.name.includes(q) || r.name.includes(q)) : all;
        if (!matches.length) continue;
        codexBody.appendChild(MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 11, color: "var(--gold)", margin: "8px 2px 4px" } }, "◆ " + r.name));
        for (const mo of matches) {
        const kills = MG.sys.meta.codexMonsterKills(mo.id);
        const last = QD.CODEX_MONSTER_MILESTONES[QD.CODEX_MONSTER_MILESTONES.length - 1];
        const next = QD.CODEX_MONSTER_MILESTONES.find(x => kills < x.kills) || last;
        // v246 圖鑑深鏈：「位於」＋一鍵前往（已解鎖區；深淵無固定魔物不顯示）
        const ri = MG.data.monsters.regions.indexOf(r);
        const stage = r.abyss ? null : MG.sys.loot.stageOfMonster(ri, mo.id);
        const unlocked = r.abyss ? false : ri <= (st.stats.maxRegionReached || 0);
        codexBody.appendChild(MG.ui.dom.h("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", background: "var(--panel2)", borderRadius: 8, marginBottom: 4, flexWrap: "wrap" }, title: mo.name + "（" + r.name + "・" + ((MG.config.ELEMENTS[r.element] || {}).name || "") + "屬性）" + (r.boss && mo.id === r.boss.id ? " — 區域 BOSS，掉寶率提升" : "") }, // v256FIX：flexWrap（位於+掉落+里程碑鈕窄屏不溢出）
          MG.ui.dom.icon(mo.sprite, 18),
          MG.ui.dom.h("div", { class: "grow", style: { fontSize: 11 } },
            mo.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4 } }, "討伐 " + kills + " / 下階 " + next.kills),
            MG.ui.dom.h("div", { class: "pbar", style: { height: 4, marginTop: 3 } }, MG.ui.dom.h("i", { style: { width: Math.min(100, kills / next.kills * 100) + "%" } })),
            mo.flavor ? MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, color: "var(--dim)", marginTop: 2, fontStyle: "italic" } }, "「" + mo.flavor + "」") : null),
          stage && unlocked ? MG.ui.dom.h("button", { class: "btn sm", style: { minHeight: 24, padding: "2px 8px", flexShrink: 0 }, on: { click: () => { m.close(); MG.ui.hunt.gotoMonster(ri, stage); } } }, "位於:" + (mo.id === r.boss.id ? "BOSS" : "第 " + stage + " 關")) : null,
          // v256 掉落一覽：此怪掉落（dropInfoOf 與實戰同源 — 農材料決策前置資訊）
          stage && unlocked ? MG.ui.dom.h("button", { class: "btn sm", style: { minHeight: 24, padding: "2px 8px", flexShrink: 0 }, on: { click: () => {
            const di = MG.sys.loot.dropInfoOf(ri, stage);
            if (!di) return;
            const dm = MG.ui.dom.modal(mo.name + " 掉落一覽", null, { icon: mo.sprite });
            const dl = di.drops.map(d => MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, borderBottom: "1px solid rgba(255,255,255,.06)" } },
              MG.ui.dom.h("span", null, "素材：" + d.name),
              MG.ui.dom.h("span", { style: { fontWeight: 800, color: "var(--gold)" } }, Math.round(d.c * 100) + "%"))); // v256FIX：elite 欄位恆 false（scaledMonster 無 opts）— 改靜態註記
            if (!di.boss) dl.push(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9, padding: "3px 0", color: "var(--dim)" } },
              "此怪約 22% 以精英現身：素材機率 ×3・裝備 30%・藥水 18%・寶石/書 ×3"));
            dl.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 } },
              MG.ui.dom.h("span", null, "生命/魔力藥水"),
              MG.ui.dom.h("span", { style: { fontWeight: 800 } }, Math.round(di.potRate * 100) + "%")));
            dl.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 } },
              MG.ui.dom.h("span", null, "裝備 / 寶石 / 技能書"),
              MG.ui.dom.h("span", { style: { fontWeight: 800 } }, (di.eqRate >= 1 ? "100%（BOSS保證）" : Math.round(di.eqRate * 100) + "%") + " / " + Math.round(di.gemRate * 100) + "% / " + Math.round(di.bookRate * 100) + "%")));
            if (di.boss) dl.push(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, color: "var(--r5)" } },
              MG.ui.dom.h("span", null, "BOSS額外"),
              MG.ui.dom.h("span", { style: { fontWeight: 800 } }, "寶石×1・每日首殺 榮譽+2（重複討伐不再給）・招募券 " + Math.round(di.bossTicket * 100) + "%・書 " + Math.round(di.bossBook * 100) + "%"))); // v256FIX：榮譽限定每日首殺
            dm.panel.appendChild(MG.ui.dom.h("div", { style: { background: "var(--panel2)", borderRadius: 8, padding: "8px 10px", fontSize: 12, lineHeight: 1.8 } }, dl));
          } } }, "掉落 ▸") : null,
          milestonesRow("m:" + mo.id, kills)));
        }
      }
    }
    renderCodex("");
    searchBox.addEventListener("input", () => renderCodex(searchBox.value.trim()));
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
    {
      const matRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 4, flexWrap: "wrap" } });
      for (const [mid, md] of Object.entries(MG.config.MATS)) {
        const have = !!st.codex.mats[mid];
        matRow.appendChild(MG.ui.dom.h("div", {
          title: md.name + "（" + MG.config.tierLabel(md.tier) + "）— " + (md.desc || "") + "。來源：" + (md.src || "分解裝備・離線獎勵") + (have ? "（已發現）" : "（尚未發現）"),
          style: { width: 44, height: 44, borderRadius: 8, border: "1px solid " + (have ? "var(--gold)" : "var(--line)"), background: have ? "rgba(255,209,102,0.12)" : "var(--panel2)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }
        }, MG.ui.dom.icon(md.icon, 18), MG.ui.dom.h("div", { style: { fontSize: 7, color: have ? "var(--gold)" : "var(--dim)", maxWidth: 40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, md.name)));
      }
      body.appendChild(matRow);
    }
    function milestonesRow(key, kills) {
      const rowEl = MG.ui.dom.h("div", { style: { display: "flex", gap: 3 } });
      for (const ms of QD.CODEX_MONSTER_MILESTONES) {
        const k = key + ":" + ms.kills;
        const claimed = MG.sys.meta.codexMilestoneClaimed(k);
        const ready = kills >= ms.kills && !claimed;
        rowEl.appendChild(MG.ui.dom.h("button", {
          class: "btn sm", style: { padding: "2px 6px", minHeight: 24, fontSize: 9 },
          title: "討伐 " + ms.kills + " 隻 — 獎勵：" + rewardText(ms.r) + (claimed ? "（已領取）" : ready ? "（可領取）" : "（尚差 " + Math.max(0, ms.kills - kills) + " 隻）"),
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
    // v334：月進度條
    m.panel.appendChild(MG.ui.dom.h("div", { class: "pbar", style: { height: 5, margin: "4px 14px 0" } }, MG.ui.dom.h("i", { style: { width: Math.min(100, Math.round(day / 30 * 100)) + "%" } })));
    const grid = MG.ui.dom.h("div", { style: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 } });
    for (let i = 0; i < 30; i++) {
      const def = QD.CHECKIN[i];
      const r = def.r;
      const claimed = st.checkin.days[i];
      const today = i === day;
      grid.appendChild(MG.ui.dom.h("div", {
        title: "第 " + (i + 1) + " 天" + (def.name ? " · " + def.name : "") + " — 獎勵：" + rewardText(r) + (claimed ? "（已領取）" : i === day ? "（今日可簽）" : i < day ? "（錯過）" : "（未到期）"),
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
        let goldCost = Math.floor(60 * tierSel * rarSel);
        if (MG.sys.meta && MG.sys.meta.traditionEffects) goldCost = Math.floor(goldCost * (1 - MG.sys.meta.traditionEffects().forge)); // v169 鍛造傳統
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
        // v238 QoL：裝備連製（套裝收集/批量打造 — RNG 所以 >5 次 confirm 防誤觸；addToInventory 失敗=背包滿即停）
        // v238FIX：stock 計入背包剩餘格（原高估 — 接近滿包時預覽 ×N 誤導）
        const invLeft = MG.sys.equipment.inventoryCap ? MG.sys.equipment.inventoryCap() - st.inventory.items.length : 999;
        const gearBulk = can ? shopBulkBtn({
          stock: Math.min(Math.floor(st.currencies.gold / goldCost), Math.floor((st.mats[matA] || 0) / costA), Math.floor((st.mats[matB] || 0) / costB), invLeft),
          label: "連製", confirmOver: 5,
          onRedeem: () => {
            const opts = { tier: tierSel, rarity: rarSel };
            if (cat === "weapon") { opts.slot = "weapon"; opts.wtype = slotSel; }
            else opts.slot = slotSel;
            if (setSel !== "none") opts.set = setSel;
            const it = MG.sys.equipment.gen(opts);
            st.currencies.gold -= goldCost;
            st.mats[matA] -= costA;
            st.mats[matB] -= costB;
            const ok = MG.sys.equipment.addToInventory(it);
            if (!ok) { st.currencies.gold += goldCost; st.mats[matA] += costA; st.mats[matB] += costB; } // 背包滿退回本件資源
            return { ok };
          },
          refresh: redraw
        }) : null;
        const craftBtnRow = MG.ui.dom.h("div", { style: { display: "flex", gap: 6 } },
          MG.ui.dom.h("button", { class: "btn gold", style: { flex: 1 }, disabled: !can, on: { click: () => {
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
          } } }, "打造（" + MG.util.fmt(goldCost) + " 金）"),
          gearBulk ? gearBulk.wrap : null);
        content.appendChild(craftBtnRow);
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
          // v238 QoL：寶石批量融合（堆疊 9+ 顆連點 → 1 次 stepper；gemFuse 逐次守衛）
          const bulk = canFuse && q >= 6 ? shopBulkBtn({
            stock: Math.floor(q / 3), label: "融合",
            onRedeem: () => {
              const out = MG.sys.equipment.gemFuse(g.defId, 3, true); // v238：批量靜音
              return out ? { ok: true } : { ok: false };
            },
            refresh: renderGem
          }) : null;
          const rowEl = MG.ui.dom.h("div", { class: "row", style: { marginBottom: 6 }, title: gd.name + " " + MG.config.tierLabel(g.tier) + "：鑲嵌效果 " + effect + "（持有 x" + q + "）— 3 顆同階融合升一階" },
            MG.ui.dom.icon("gem_" + kind, 22),
            MG.ui.dom.h("div", { class: "grow" },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, gd.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, MG.config.tierLabel(g.tier) + " x" + q)),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, effect)),
            MG.ui.dom.h("button", { class: "btn sm " + (canFuse ? "gold" : ""), disabled: !canFuse, on: { click: () => {
              const out = MG.sys.equipment.gemFuse(g.defId, 3);
              if (out) { MG.ui.dom.toast("融合成功：" + gd.name + " " + MG.config.tierLabel(out.tier) + "！", "good", "gem_" + kind); renderGem(); }
            } } }, "融合"),
            bulk ? bulk.wrap : null); // v238：批量融合 stepper
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
        // v238 QoL：道具批量製作（藥水每日補給 10-30 瓶 → 1 次 stepper；迴圈單製守衛至資源不足）
        const maxN = Math.min(
          Math.floor(st.currencies.gold / r.gold),
          ...Object.entries(r.mats).map(([k, n]) => Math.floor((st.mats[k] || 0) / n))
        );
        const bulk = can && maxN > 1 ? shopBulkBtn({
          stock: maxN, label: "製作",
          onRedeem: () => {
            if (st.currencies.gold < r.gold) return { ok: false };
            for (const k in r.mats) { if ((st.mats[k] || 0) < r.mats[k]) return { ok: false }; }
            for (const k in r.mats) st.mats[k] -= r.mats[k];
            st.currencies.gold -= r.gold;
            const have2 = st.inventory.items.find(i => i.defId === r.id);
            if (have2) have2.qty = (have2.qty || 0) + 1;
            else st.inventory.items.push({ uid: MG.util.uid(), defId: r.id, tier: 1, qty: 1, gems: [], enhance: 0 });
            return { ok: true };
          },
          refresh: renderItem
        }) : null;
        content.appendChild(MG.ui.dom.h("div", { class: "row", style: { marginBottom: 6 }, title: r.name + "（持有 x" + qty + "）— 成本：" + MG.util.fmt(r.gold) + " 金＋" + Object.entries(r.mats).map(([k, n]) => (MG.config.MATS[k] || {}).name + " ×" + n).join("・") + "。" + ({ item_pot_hp: "立即恢復全隊 50% 生命", item_pot_mp: "立即恢復全隊 50% 魔力", item_pot_atk: "30 分鐘全隊攻擊 +30%", item_pot_gold: "30 分鐘擊殺金幣 +50%", item_pot_exp: "30 分鐘擊殺經驗 +50%", item_hourglass: "60 秒戰鬥速度 ×2" }[r.id] || "") },
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
          } } }, "製作"),
          bulk ? bulk.wrap : null)); // v238：批量製作 stepper（僅可批量時顯示）
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
    const buyBtn = MG.ui.dom.h("button", { class: "btn gold", style: { width: "100%" }, title: "購買 " + MG.config.tierLabel(maxTier) + " 隨機裝備（" + (slotSel === "all" ? "隨機部位" : slotSel === "acc" ? "飾品（項鍊/戒指/護符）" : "武器或防具") + "）— 稀有度依機率",
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
    // v159 每日特惠（午夜刷新，確定性輪換）
    const dealsBox = MG.ui.dom.h("div", { style: { marginBottom: 10 } });
    bodyWrap.appendChild(dealsBox);
    function renderDeals() {
      const deals = MG.sys.market.deals();
      dealsBox.innerHTML = "";
      dealsBox.appendChild(MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 13, color: "var(--gold)", marginBottom: 5 } },
        "每日特惠", MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10, color: "var(--dim)" } }, "午夜刷新")));
      // v243 QoL：一鍵買齊（每日 4-8 次逐件點擊 → 1 次決策；影子模擬總價＋confirm 防誤觸）
      {
        const M = MG.sys.market;
        const ds = M.deals();
        let n = 0, total = 0;
        for (const d of ds) {
          const left = Math.max(0, d.stock - d.sold);
          if (left > 0 && st.currencies.gold >= d.price) { n += left; total += d.price * left; }
        }
        if (n > 0) {
          dealsBox.appendChild(MG.ui.dom.h("button", {
            class: "btn sm gold", style: { width: "100%", marginBottom: 5 },
            on: { click: () => {
              const run = () => {
                let done = 0, cost = 0;
                for (const d of M.deals()) {
                  for (let i = 0; i < d.stock - d.sold; i++) {
                    const r = M.buy(d.id);
                    if (!r.ok) break;
                    done++; cost += d.price;
                  }
                }
                MG.ui.dom.toast(done > 0 ? "特惠買齊 ×" + done + "・花費 " + MG.util.fmt(cost) + " 金" : "沒有可購買的特惠", done > 0 ? "good" : "bad", "icon_shop");
                renderDeals();
              };
              if (total > 50000) MG.ui.dom.confirm("買齊剩餘特惠 ×" + n, "將購買剩餘 " + n + " 項特惠（約 " + MG.util.fmt(total) + " 金，依序至售罄或金幣不足）。確定？", run, { okText: "買齊" });
              else run();
            } }
          }, "買齊剩餘 ×" + n + "（約 " + MG.util.fmt(total) + " 金）"));
        }
      }
      for (const d of deals) {
        const can = d.sold < d.stock && st.currencies.gold >= d.price;
        dealsBox.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 7, marginBottom: 5, border: "1px solid rgba(255,209,102,.4)" }, title: d.name + "（" + MG.util.fmt(d.price) + " 金・限購 " + (d.stock - d.sold) + " 次）" + (d.sold >= d.stock ? " — 已售罄" : can ? " — 可購買" : " — 金幣不足") },
          MG.ui.dom.icon(d.icon, 22),
          MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, d.name,
              MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "限購 " + (d.stock - d.sold) + " 次")),
            MG.ui.dom.h("div", { style: { fontSize: 11 } },
              // v184：動態價 ≥ 原價時不顯示刪除線/折扣（避免「-328%」怪異顯示）
              d.price < d.base ? MG.ui.dom.h("span", { style: { color: "var(--dim)", textDecoration: "line-through", marginRight: 4 } }, MG.util.fmt(d.base) + "金") : null,
              MG.ui.dom.h("span", { style: { color: "#ff9f43", fontWeight: 900 } }, MG.util.fmt(d.price) + "金",
                d.price < d.base ? MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9, marginLeft: 3 } }, "-" + Math.round((1 - d.price / d.base) * 100) + "%") : MG.ui.dom.h("span", { class: "sub", style: { fontSize: 9, marginLeft: 3 } }, "動態價")))),
          MG.ui.dom.h("button", { class: "btn sm " + (can ? "gold" : ""), style: { flexShrink: 0 }, disabled: !can, on: { click: () => { const r = MG.sys.market.buy(d.id); MG.ui.dom.toast(r.ok ? "購買成功：" + r.name : r.reason, r.ok ? "good" : "bad", d.icon); renderDeals(); } } }, d.sold >= d.stock ? "售罄" : "購買")));
      }
    }
    renderDeals();
    // v259 週限兌換（金幣週常消耗端 — 價格錨 U=5000×1.35^(kl-1)；98B 遠古完成後金幣目標續航）
    {
      const wb = MG.ui.dom.h("div", { style: { margin: "10px 0" } });
      bodyWrap.appendChild(wb);
      function renderWeekly() {
        const wl = MG.sys.market.goldWeeklyList();
        wb.innerHTML = "";
        wb.appendChild(MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 13, color: "var(--gold)", marginBottom: 5 } },
          "週限兌換", MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10, color: "var(--dim)" } }, "週一重置 — 金幣換資源（深淵農金的新出口）")));
        for (const d of wl) {
          const can = d.sold < d.stock && st.currencies.gold >= d.price;
          wb.appendChild(MG.ui.dom.h("div", { class: "row", style: { alignItems: "center", opacity: d.sold >= d.stock ? 0.5 : 1 }, title: d.name + "（" + MG.util.fmt(d.price) + " 金幣・本週 " + d.sold + "/" + d.stock + "）" + (d.sold >= d.stock ? " — 本週售罄" : can ? " — 可兌換" : " — 金幣不足") },
            MG.ui.dom.icon(d.icon, 24),
            MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
              MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, d.name),
              MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, MG.util.fmt(d.price) + " 金幣・本週 " + d.sold + "/" + d.stock)),
            MG.ui.dom.h("button", {
              class: "btn sm " + (can ? "gold" : ""), style: { flexShrink: 0, minHeight: 28 },
              disabled: !can,
              on: { click: () => { const r = MG.sys.market.goldWeeklyBuy(d.id); MG.ui.dom.toast(r.ok ? "兌換成功：" + r.name : r.reason, r.ok ? "good" : "bad", d.icon); renderWeekly(); } }
            }, d.sold >= d.stock ? "售罄" : "兌換")));
        }
      }
      renderWeekly();
    }
    bodyWrap.appendChild(MG.ui.dom.h("div", { style: { borderTop: "1px solid var(--line)", margin: "2px 0 8px", paddingTop: 8 } }));
    // v259FIX：renderShopList 的 render() 會清空傳入容器 — 特惠/週限區與貨品共用 bodyWrap 時被整段清掉（結構潛伏問題）
    const shopBox = MG.ui.dom.h("div", null);
    bodyWrap.appendChild(shopBox);
    renderShopList(shopBox, st, s => s.price.gold !== undefined, "市場貨品（金幣購買，市場等級提升解鎖更多）：");
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
  /* v197 昇華儀式演出：全屏紫金神光（昇華是重置一切的至重時刻）；演出結束後 callback（開傳統選擇） */
  function showAwakenCeremony(honor, done) {
    const rm = !!(S().settings && S().settings.reducedMotion);
    const root = document.getElementById("overlay-root");
    if (rm || !root) { done(); return; }
    const ovl = MG.ui.dom.h("div", {
      style: { position: "fixed", inset: 0, zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(18,10,38,0.62)", cursor: "pointer" },
      on: { click: finish }
    });
    const card = MG.ui.dom.h("div", { style: { position: "relative", width: 250, textAlign: "center", padding: "30px 18px 22px", borderRadius: 14, background: "linear-gradient(180deg,#241a42,#151226)", border: "2px solid #b08aff", boxShadow: "0 10px 40px rgba(0,0,0,0.7), 0 0 30px rgba(176,138,255,.45)", overflow: "hidden" } },
      MG.ui.dom.h("div", { class: "summon-rays summon-rays-gold", style: { opacity: 0.8 } }),
      MG.ui.dom.h("div", { class: "summon-ring summon-ring-gold" }),
      MG.ui.dom.h("div", { style: { position: "relative", zIndex: 1, animation: "summon-pop .5s cubic-bezier(.2,.9,.3,1.25) both" } },
        MG.ui.dom.h("div", { style: { width: 84, height: 84, margin: "0 auto 10px", borderRadius: "50%", background: "radial-gradient(circle, rgba(176,138,255,.4), rgba(176,138,255,.06) 70%)", border: "2px solid #b08aff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 26px rgba(176,138,255,.6)" } },
          MG.ui.dom.icon("icon_honor", 50)),
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 20, color: "#ffd166", letterSpacing: 3, textShadow: "0 0 14px rgba(255,209,102,.7)" } }, "昇 華 完 成"),
        MG.ui.dom.h("div", { style: { fontSize: 12, color: "#c8b8f0", marginTop: 5 } }, "王國歸零，力量永存"),
        MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 15, color: "var(--gold)", marginTop: 10 } }, "＋" + MG.util.fmt(honor) + " 榮譽"),
        MG.ui.dom.h("div", { style: { fontSize: 10, color: "#8d84b8", marginTop: 4 } }, "攻擊 / 金幣 +25%・經驗 +5%（永久）"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10, marginTop: 12 } }, "點擊繼續")));
    ovl.appendChild(card);
    root.appendChild(ovl);
    const t = setTimeout(finish, 2400);
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(t);
      if (ovl.parentNode) ovl.parentNode.removeChild(ovl);
      done();
    }
  }
  /* altar / awakening */  /* altar / awakening */  /* altar / awakening */
  function openAltar() {
    const st = S();
    const m = MG.ui.dom.modal("昇華祭壇", null, { icon: "b_altar" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    const aw = st.awakenings || 0;
    const nextHonor = Math.floor((100 + 25 * Math.min(aw, 10)) * MG.sys.buildings.effects().honorMul); // v224：榮譽封頂
    const atkPct = Math.round((0.25 * Math.min(aw, 5) + 0.05 * Math.max(0, aw - 5)) * 100); // v224：漸減後實際加成
    body.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", marginBottom: 8 } },
      MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 15 } }, "昇華次數：" + aw),
      MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11 } }, "每次昇華：攻擊 +25%、金幣 +25%、經驗 +5%（永久；第 6 次起各 +5%/+1%）"),
      aw > 0 ? MG.ui.dom.h("div", { style: { fontSize: 11, color: "var(--gold)", marginTop: 2 } }, "目前加成：攻擊 +" + atkPct + "%、金幣 +" + atkPct + "%、經驗 +" + Math.round((0.05 * Math.min(aw, 5) + 0.01 * Math.max(0, aw - 5)) * 100) + "%") : null));
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
      on: { click: () => MG.ui.dom.confirm("進行昇華", "昇華將重置英雄、建築、金幣與副本進度，換取永久的昇華之力。確定要獻上一切嗎？", () => { const honor = MG.sys.meta.awaken(); if (honor) { m.close(); MG.ui.screens.refreshAll(); showAwakenCeremony(honor, () => openTraditionPick()); } }, { danger: true, okText: "昇華！" }) }
    }, "進行昇華"));
    body.appendChild(MG.ui.dom.h("div", { style: { textAlign: "center", fontSize: 11, color: "var(--gold)", marginTop: 6, marginBottom: 4 } },
      "下次昇華預估獲得：" + MG.util.fmt(nextHonor) + " 榮譽"));
    body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "昇華傳統")));
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } },
      "每次昇華後自選一項傳統永久疊加（上限 10 級）— 構築你的昇華路線"));
    for (const [type, def] of Object.entries(MG.sys.meta.TRADITIONS || {})) {
      const lvl = MG.sys.meta.traditionLevel(type);
      body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 6, marginBottom: 4 }, title: def.name + "（Lv " + lvl + "/10）— " + def.desc },
        MG.ui.dom.icon(def.icon, 18),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, def.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "Lv " + lvl + "/10")),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, def.desc))));
    }
    body.appendChild(MG.ui.dom.h("div", { class: "section-h" }, MG.ui.dom.h("span", { class: "t" }, "榮譽強化")));    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 6 } }, "持有榮譽：" + MG.util.fmt(st.currencies.honor) + "（BOSS與昇華獲得）"));
    for (const [type, name, desc] of [["dmg", "力量印記", "攻擊 +10%/級"], ["gold", "財富印記", "金幣 +10%/級"], ["exp", "智慧印記", "經驗 +5%/級"]]) {
      const lvl = st.honorLvls[type] || 0;
      const cost = MG.sys.meta.honorCost(type);
      body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 8 }, title: name + "（Lv " + lvl + "/5）— " + desc + "（目前 +" + MG.sys.meta.honorBonus(type) + "%）" },
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "Lv " + lvl + "/5")),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, desc + "（目前 +" + MG.sys.meta.honorBonus(type) + "%）")),
        MG.ui.dom.h("button", { class: "btn sm " + (cost >= 0 && st.currencies.honor >= cost ? "gold" : ""), disabled: cost < 0 || st.currencies.honor < cost, on: { click: () => { if (MG.sys.meta.buyHonor(type)) { MG.ui.dom.toast(name + "升級！", "good", "icon_honor"); openAltar(); m.close(); } } } }, cost < 0 ? "已滿級" : MG.util.fmt(cost) + " 榮譽")));
    }
  }
  /* v169 昇華傳統選擇：昇華完成後自選一項永久疊加 */
  function openTraditionPick() {
    const M = MG.sys.meta;
    const m = MG.ui.dom.modal("選擇昇華傳統", null, { wide: true, icon: "icon_castle" });
    m.panel.appendChild(MG.ui.dom.h("div", { class: "sub", style: { fontSize: 11, marginBottom: 8, textAlign: "center" } },
      "歷經輪迴的王者，選擇一項傳統銘刻於王國血脈（永久疊加，每項上限 10 級）"));
    for (const [type, def] of Object.entries(M.TRADITIONS || {})) {
      const lvl = M.traditionLevel(type);
      const full = lvl >= 10;
      m.panel.appendChild(MG.ui.dom.h("div", {
        class: "row", style: { padding: 9, marginBottom: 6, opacity: full ? 0.55 : 1, cursor: "pointer" },
        on: { click: () => {
          if (full) { MG.ui.dom.toast("此傳統已滿級", "bad", "icon_castle"); return; }
          if (M.pickTradition(type)) {
            MG.ui.dom.toast("「" + def.name + "」升至 Lv" + (lvl + 1) + "！", "good", "icon_castle");
            m.close();
          }
        } }
      },
        MG.ui.dom.icon(def.icon, 22),
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 13, color: "var(--gold)" } }, def.name, MG.ui.dom.h("span", { class: "sub", style: { marginLeft: 4, fontSize: 10 } }, "Lv " + lvl + "/10")),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, def.desc))));
    }
    m.panel.appendChild(MG.ui.dom.h("button", { class: "btn m-close-btn", on: { click: () => m.close() } }, "稍後再選"));
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
        MG.ui.dom.h("div", { class: "grow", style: { fontWeight: 800, fontSize: 13 } },
          c.title,
          // v337：最新版本角標
          c === shown[0] ? MG.ui.dom.h("span", { style: { marginLeft: 6, fontSize: 9, fontWeight: 900, color: "#0a2a10", background: "#57c96b", borderRadius: 4, padding: "0 5px", lineHeight: "14px", verticalAlign: "middle" } }, "最新") : null),
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
    const toggle = (label, key, cb, tip) => {
      // 方框勾選（v130 取代 iOS 切換開關）
      const row = MG.ui.dom.h("div", { class: "row", title: tip || "", on: { click: () => { pressFx(row); st.settings[key] = !st.settings[key]; MG.core.audio.SFX.click(); cb && cb(); renderRow(); } } },
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
    body.appendChild(toggle("音效", "sound", () => MG.core.audio.refreshMusic(), "戰鬥/點擊/獎勵音效開關"));
    body.appendChild(toggle("音樂", "music", () => MG.core.audio.refreshMusic(), "背景音樂開關"));
    body.appendChild(toggle("減少動畫效果", "reducedMotion", null, "停用戰鬥動畫與慶祝演出（省電/易讀性）"));
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
      // v144：下載 .json 存檔檔（檔案傳輸最方便：LINE/Email/雲端碟）
      MG.core.save.exportSave().then((code) => {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const blob = new Blob([code], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "mega-idle-save-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + ".txt";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        MG.ui.dom.toast("存檔檔已下載！", "good", "icon_check");
      });
    } } },
      MG.ui.dom.icon("icon_offline", 18),
      MG.ui.dom.h("div", { class: "grow" },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, "下載存檔檔"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "存成 .txt 檔案，用 LINE/Email 傳到新裝置"))));
body.appendChild(MG.ui.dom.h("div", { class: "row", on: { click: (e) => {
      pressFx(e.currentTarget);
      // v144：從檔案匯入（讀取下載的 .txt 存檔檔）
      const fi = document.createElement("input");
      fi.type = "file";
      fi.accept = ".txt,.json,.mgsave";
      fi.onchange = () => {
        const f = fi.files && fi.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          MG.core.save.importSave(String(rd.result)).then((ok) => {
            if (ok) { MG.ui.dom.toast("匯入成功！", "good", "icon_check"); m.close(); MG.ui.screens.refreshAll(); }
            else MG.ui.dom.toast("匯入失敗", "bad", "icon_close");
          });
        };
        rd.readAsText(f);
      };
      fi.click();
    } } },
      MG.ui.dom.icon("icon_chest", 18),
      MG.ui.dom.h("div", { class: "grow" },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13 } }, "從檔案匯入"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "選擇 .txt 存檔檔繼續冒險"))));
    body.appendChild(MG.ui.dom.h("div", { class: "row", on: { click: (e) => { pressFx(e.currentTarget); MG.ui.dom.confirm("清空存檔並重新開始", "將刪除王國的所有進度（英雄、裝備、建築、金幣），重新展開旅程。此操作無法復原！", () => { MG.core.save.reset(); MG.ui.dom.toast("王國已重建，旅程重新開始！", "", "icon_offline"); }) } } },
      MG.ui.dom.icon("icon_close", 18),
      MG.ui.dom.h("div", { class: "grow" },
        MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 13, color: "var(--bad)" } }, "清空存檔並重新開始"),
        MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "刪除全部進度，從零打造王國"))));
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 10, fontSize: 10 } }, "放置王國 MEGA IDLE v" + MG.config.VERSION));
  }
  /* v230 元素試煉塔：每週重置元素爬塔 — 啟用元素相剋（層弱點）＋5 隊編制（頂部快速切隊） */
  function openTower() {
    const st = S();
    const T = MG.sys.tower;
    const m = MG.ui.dom.modal("元素試煉塔", null, { wide: true, icon: "icon_tower" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    function teamBtn(n) {
      const active = (st.activeTeam || 0) === n;
      return MG.ui.dom.h("button", {
        class: "chip" + (active ? " on" : ""), style: { flexShrink: 0, minHeight: 24 },
        on: { click: () => { MG.sys.hunters.setActiveTeam(n); render(); } }
      }, "隊" + (n + 1));
    }
    function render() {
      const t = T.ensure();
      const prog = T.progress();
      const ids = MG.sys.hunters.teamOf().filter(Boolean);
      const tp = ids.reduce((a, id) => { const h = st.hunters.find(x => x.id === id); return a + (h ? MG.sys.hunters.power(h) : 0); }, 0);
      body.innerHTML = "";
      // 頭部：進度＋週重置
      body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel2)", border: "1px solid var(--line)", padding: "8px 10px", borderRadius: 8, marginBottom: 8, fontSize: 12 } },
        MG.ui.dom.h("span", { style: { fontWeight: 900, fontSize: 14 } }, "本週進度 " + prog.cleared + "/" + prog.total),
        MG.ui.dom.h("span", { class: "sub" }, "每週一重置 · 層元素每週輪換")));
      // 編隊列：已解鎖隊快速切換＋戰力（v230FIX：只顯示 teamsUnlocked 內的隊 — 原 5 鈕恆渲染，未解鎖隊點擊靜默無效）
      body.appendChild(MG.ui.dom.h("div", { style: { display: "flex", gap: 4, alignItems: "center", marginBottom: 4, flexWrap: "wrap" } },
        MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10 } }, "出戰編隊："),
        Array.from({ length: MG.sys.hunters.teamsUnlocked ? MG.sys.hunters.teamsUnlocked() : 1 }, (_, n) => teamBtn(n)),
        MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10, marginLeft: "auto" } }, "戰力 " + MG.util.fmt(tp))));
      // v233 自動挑戰至卡關（每週 15 次點擊 → 1 次；首敗即停 — 換隊決策保留；失敗無懲罰零損失）
      if (!prog.all && ids.length) {
        const nxt = prog.next;
        body.appendChild(MG.ui.dom.h("button", {
          class: "btn sm blue", style: { width: "100%", marginBottom: 6 },
          on: { click: () => {
            const res = T.autoClimb(ids);
            if (res.ok) {
              const ms = res.climbed.includes(5) || res.climbed.includes(10) || res.climbed.includes(15) ? "（含里程碑鑽石）" : "";
              MG.ui.dom.toast("自動挑戰 ×" + res.climbed.length + "（第 " + nxt + "→" + (res.climbed[res.climbed.length - 1]) + " 層）・+" + res.honor + " 榮譽" + (res.gems ? "・+" + res.gems + " 鑽石" : "") + ms + (res.stopped ? "・卡在第 " + res.stopped.layer + " 層" : "・全數通關！"), res.ok ? "good" : "bad", "icon_tower");
            } else MG.ui.dom.toast((res.stopped && res.stopped.reason) || res.reason || "無可挑戰的層", "bad", "icon_tower"); // v233FIX：首敗顯示失敗原因（原誤報「無可挑戰的層」）
            render();
          } }
        }, "自動挑戰（至卡關）"));
      }
      if (prog.all) {
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 9, marginBottom: 8, border: "1px solid var(--gold)" } },
          MG.ui.dom.icon("icon_tower", 20),
          MG.ui.dom.h("div", { class: "grow" }, MG.ui.dom.h("div", { style: { fontWeight: 900, fontSize: 13, color: "var(--gold)" } }, "本週 15 層全數通關！"),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, "週一重置後可再次攀登 — 元素弱點會重新輪換"))));
      }
      // 層列表（順序挑戰）
      for (let layer = 1; layer <= T.LAYERS; layer++) {
        const weak = T.layerWeak(layer);
        const elDef = MG.config.ELEMENTS[weak] || { name: "?", color: "#888" };
        const done = !!t.cleared[layer];
        const locked = layer > 1 && !t.cleared[layer - 1];
        const can = !done && !locked && ids.length > 0;
        const wc = T.winChance(layer, ids);
        const r = T.reward(layer);
        const rTxt = [r.honor + " 榮譽", "素材 ×" + r.mats + "（九種）", r.ms ? "里程碑 " + r.ms.gems + " 鑽石" : null].filter(Boolean).join("・");
        const color = wc >= 0.55 ? "#57c96b" : wc >= 0.42 ? "#ffd166" : "#ff5c5c"; // v230FIX：綠 ≥55%（全剋制隊專屬 — 公式上限 ~57.7%）；原 ≥70% 數學不可達
        body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 6, marginBottom: 4, opacity: done || locked ? 0.55 : 1 }, title: "第 " + layer + " 層 · " + elDef.name + "屬性" + (done ? "（已通關）" : locked ? "（尚未解鎖）" : "（勝率 " + Math.round(wc * 100) + "%）") + " — 獎勵：" + rTxt },
          MG.ui.dom.h("span", { style: { width: 24, height: 24, borderRadius: 5, background: done ? "var(--good)" : elDef.color, color: "#14121f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0 } }, done ? "✓" : String(layer)),
          MG.ui.dom.h("div", { class: "grow", style: { minWidth: 0 } },
            MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, "第 " + layer + " 層 · " + elDef.name + "屬性" + (r.ms ? " ⭐" : "")),
            MG.ui.dom.h("div", { class: "sub", style: { fontSize: 9 } }, rTxt)),
          done ? MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10 } }, "已通關")
            : locked ? MG.ui.dom.h("span", { class: "sub", style: { fontSize: 10 } }, "尚未解鎖")
            : MG.ui.dom.h("div", { style: { display: "flex", gap: 4, alignItems: "center" } },
              MG.ui.dom.h("span", { style: { fontSize: 10, fontWeight: 800, color } }, Math.round(wc * 100) + "%"),
              MG.ui.dom.h("button", {
                class: "btn sm " + (can ? "gold" : ""), style: { whiteSpace: "nowrap" }, disabled: !can,
                on: { click: () => {
                  const res = T.challenge(layer, ids);
                  if (res.ok) MG.ui.dom.toast("通關第 " + layer + " 層！+" + res.honor + " 榮譽" + (res.gems ? "・+" + res.gems + " 鑽石" : "") + "・素材 ×" + res.mats, "good", "icon_tower");
                  else MG.ui.dom.toast(res.reason || "挑戰失敗", res.win ? "good" : "bad", "icon_tower");
                  render();
                } }
              }, "挑戰"))));
      }
      body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 8, fontSize: 10 } },
        "勝率 = 出戰戰力（剋制英雄 ×1.5）/（+推薦戰力）— 剋制層弱點元素的英雄更強；失敗無懲罰可無限重試"));
    }
    render();
  }
  /* v231 資源取得導覽：點頂欄金幣/鑽石 → 來源清單（市面放置標準「點資源→跳商店」—
     強化/訓練/招募失敗的「資源不足」死胡同給出下一步） */
  function openResourceGuide(type) {
    const st = S();
    const titleMap = { gold: "金幣取得途徑", gems: "鑽石取得途徑", honor: "榮譽取得途徑", ticket: "招募券取得途徑", book: "魔法書取得途徑", royalCoins: "王者幣取得途徑", swapStone: "置換石取得途徑" }; // v261 新貨幣
    const iconMap = { gold: "icon_coin", gems: "icon_gem", honor: "icon_honor", ticket: "icon_recruit", book: "icon_book", royalCoins: "icon_honor", swapStone: "icon_honor" };
    const m = MG.ui.dom.modal(titleMap[type] || "資源取得途徑", null, { icon: iconMap[type] || "icon_coin" });
    const body = MG.ui.dom.h("div", null);
    m.panel.appendChild(body);
    // v246：honor/ticket/book 來源導覽補完（v231 只覆蓋金幣/鑽石 — 三種來源最不直觀的貨幣）
    const rows = type === "gems" ? [
      ["每日簽到", "每天登入免費領", () => openCheckin()],
      ["每日任務／成就", "任務目標達標給鑽石", () => openQuests()],
      ["競技場", "爬排名週結算領鑽石", () => openArena()],
      ["無盡深淵", "里程碑首通＋每週深度結算", () => openAbyss()],
      ["元素試煉塔", "每週 15 層里程碑給鑽石", () => openTower()],
      ["世界首領", "每日擊殺里程碑領鑽石", () => openWorldboss()],
      ["限時活動", "每週活動點數兌鑽石", () => openEvents()],
      ["每日特惠", "商城金幣/鑽石限量商品", () => openMarket()]
    ] : type === "gold" ? [
      ["狩獵副本", "派遣英雄掛機產金幣", () => { MG.ui.screens.show("hunt"); }],
      ["每日任務", "任務目標達標給金幣", () => openQuests()],
      ["市場／每日特惠", "限購商品與材料", () => openMarket()],
      ["公會捐獻", "捐金幣換公會經驗＋科技", () => openGuild()],
      ["試煉秘境", "每日 3 次高額金幣副本", () => openDungeon()],
      ["素材兌換", "虛空/神話碎片換金幣", () => openAbyss()]
    ] : type === "honor" ? [
      ["昇華祭壇", "昇華王國換取大量榮譽", () => { MG.ui.more.openAltar(); }],
      ["競技場", "挑戰爬榜＋週結算給榮譽", () => openArena()],
      ["世界首領", "每日擊殺里程碑給榮譽", () => openWorldboss()],
      ["公會首領", "每週出戰里程碑給榮譽", () => openGuild()],
      ["每日任務", "每日任務達標給榮譽", () => openQuests()],
      ["榮譽商店", "消耗榮譽兌換資源", () => openHonorShop()]
    ] : type === "ticket" ? [
      ["主線任務", "推進主線領招募券", () => openQuests()],
      ["成就", "成就階梯給招募券", () => openQuests()],
      ["每日簽到", "簽到天數給招募券", () => openCheckin()],
      ["限時活動", "活動商店兌招募券", () => openEvents()],
      ["區域首殺", "每區 BOSS 首殺給券", () => { MG.ui.screens.show("hunt"); }],
      ["商城", "鑽石直接購買招募券", () => openShop()]
    ] : [
      ["狩獵 BOSS", "BOSS 20% 機率掉落魔法書", () => { MG.ui.screens.show("hunt"); }],
      ["精英怪", "精英怪掉落魔法書", () => { MG.ui.screens.show("hunt"); }],
      ["每日特惠", "魔法書 ×2 限購（16,000 金起）", () => openMarket()],
      ["榮譽商店", "300 榮譽兌魔法書（週限）", () => openHonorShop()]
    ];
    for (const [name, desc, go] of rows) {
      body.appendChild(MG.ui.dom.h("div", { class: "row", style: { padding: 7 } },
        MG.ui.dom.h("div", { class: "grow" },
          MG.ui.dom.h("div", { style: { fontWeight: 800, fontSize: 12 } }, name),
          MG.ui.dom.h("div", { class: "sub", style: { fontSize: 10 } }, desc)),
        // v231FIX：先關導覽再深鏈（原目標 modal 疊在導覽上、狩獵頁被遮罩擋住無法互動）
        MG.ui.dom.h("button", { class: "btn sm blue", on: { click: () => { m.close(); go(); } } }, "前往")));
    }
    body.appendChild(MG.ui.dom.h("div", { class: "sub", style: { textAlign: "center", marginTop: 8, fontSize: 10 } },
      "持有：" + ({ gems: MG.util.fmt(st.currencies.gems) + " 鑽石", gold: MG.util.fmt(st.currencies.gold) + " 金幣", honor: MG.util.fmt(st.currencies.honor) + " 榮譽", ticket: MG.util.fmt(st.currencies.ticket) + " 招募券", book: MG.util.fmt(st.currencies.book) + " 魔法書", royalCoins: MG.util.fmt(st.currencies.royalCoins || 0) + " 王者幣", swapStone: MG.util.fmt(st.currencies.swapStone || 0) + " 置換石" }[type] || "")));
  }
  MG.ui.screens.register("more", screen);
  return { ...screen, openSettings, openShop, openMarket, openAltar, openForge, openRenameDialog, openEquipNotifyRules, openChangelog,
    openQuests, openCheckin, openArena, openDungeon, openGuild, openWorldboss, openEvents, openTower, openRoyal, openMaze, openAbyss, openExpedition, openResourceGuide, runSweepArena, runSweepDungeon, runSweepWorldboss, runAutoTower, runSweepRoyal, runAbyssFight }; // v271 遠征營 // v271：openAbyss 補匯出（v263 待辦深淵行與世界地圖入口共用）// v263 例行 runner // v196；v261 王者競技場匯出：今日待辦快捷；v226：世界首領/活動補匯出（深鏈）；v230：元素試煉塔；v231：資源導覽
})();
