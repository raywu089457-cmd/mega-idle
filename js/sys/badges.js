/* 放置王國 MEGA IDLE — 紅點提示（v164，slice Main 延伸）
   市面放置英雄標準 UX：可領取獎勵的來源以紅點標記（更多選單列＋底部「更多」頁籤），
   驅動每日回訪。全部為唯讀判定（除簽到 ensure），2Hz tick 呼叫成本極低。 */
"use strict";
MG.sys = MG.sys || {};
MG.sys.badges = (function () {
  const S = () => MG.game.state;

  /* 回傳各來源紅點狀態（true = 有可領取） */
  function check() {
    const st = S();
    if (!st || !st.quests) return {};
    const M = MG.sys.meta;
    const out = {};
    // 每日任務（進度達標未領）
    out.daily = (st.quests.daily.list || []).some(d => {
      if (d.done) return false;
      const def = MG.data.quests.DAILY_POOL.find(x => x.id === d.id);
      return def && (d.prog || 0) >= def.req.target; // v214FIX：日進度判定
    });
    // 每週任務
    out.weekly = ((st.quests.weekly && st.quests.weekly.list) || []).some(w => {
      if (w.done) return false;
      const def = MG.data.quests.WEEKLY_POOL.find(x => x.id === w.id);
      return def && (w.prog || 0) >= (M.questTarget ? M.questTarget(def) : def.req.target); // v214：動態目標
    });
    // 成就
    out.ach = MG.data.quests.ACH.some(a => M.achClaimable(a));
    // 每日簽到（今天未領且未滿 30 天）
    M.ensureCheckin();
    const day = M.checkinDay();
    out.checkin = day < 30 && !st.checkin.days[day];
    // 七日豪禮
    out.welcome = MG.sys.welcome ? MG.sys.welcome.list().some(q => !q.claimed && MG.sys.welcome.canClaim(q.id)) : false;
    // 限時活動里程碑（手動領取）
    out.events = (MG.sys.events && st.events) ? MG.sys.events.MILESTONES.some(ms => !st.events.milestones[ms.pts] && (st.events.pts || 0) >= ms.pts) : false;
    // 無盡深淵里程碑
    out.abyss = (MG.sys.abyss && st.abyss) ? MG.sys.abyss.MILESTONES.some(ms => !st.abyss.claimed[ms.floor] && (st.abyss.best || 0) >= ms.floor) : false;
    // v200 每日世界首領（有剩餘出戰次數）
    out.worldboss = (MG.sys.worldboss && st.worldboss) ? MG.sys.worldboss.left() > 0 : false;
    // v203 圖鑑里程碑可領（魔物/總完成度/英雄收集）
    out.codex = (MG.sys.meta && MG.sys.meta.codexClaimableCount) ? MG.sys.meta.codexClaimableCount() > 0 : false;
    // v211 每日次數型（競技場 5 次／試煉秘境 3 次 — 免費次數 = 每日沉沒資源，與 worldboss 對稱）
    out.arena = (MG.sys.arena && st.arena) ? MG.sys.arena.fightsLeft() > 0 : false;
    out.dungeon = (MG.sys.dungeon && st.dungeon) ? MG.sys.dungeon.DEFS.some(d => MG.sys.dungeon.unlocked(d.id) && MG.sys.dungeon.left(d.id) > 0) : false;
    // v211 裝備可強化（背包未穿戴、鍛造場開放、強化未滿、金幣足夠 — 成長動作主動曝光）
    // v211FIX：僅強化型裝備（藥水/寶石也有 enhance:0 欄位 — slotOf 過濾避免紅點恆亮）
    if (MG.sys.equipment && st.inventory) {
      const worn = new Set();
      for (const h of st.hunters || []) for (const s in (h.equip || {})) if (h.equip[s]) worn.add(h.equip[s]);
      out.eq = st.inventory.items.some(it =>
        MG.config.SLOTS.includes(MG.sys.equipment.slotOf(it)) &&
        !worn.has(it.uid) && MG.sys.equipment.canEnhance(it));
    } else out.eq = false;
    // v216 流浪英雄可招募（免費英雄＋升星肥料來源 — 玩家不開英雄頁完全無感；canRecruit 純判定 — 名冊滿/金幣不足熄滅）
    out.wanderer = (MG.sys.wanderers && (st.wanderers || []).length) ? (st.wanderers || []).some(w => !w.dead && MG.sys.wanderers.canRecruit(w).ok) : false;
    // v231 元素試煉塔週重置（每週唯一零提醒的可領回報 — 週一重置後未全通即亮；progress 自建 st.tower 舊檔安全）
    out.tower = (MG.sys.tower) ? MG.sys.tower.progress().cleared < MG.sys.tower.LAYERS : false;
    // v261 王者競技場（soft 藍點 — 已解鎖且免費次數可用；與競技場 v211 同構）
    out.royal = (MG.sys.royal && st.kingdom && (st.kingdom.level || 1) >= 12) ? MG.sys.royal.fightsLeft() > 0 : false;
    // v265 奇境迷宮（soft 藍點 — 已解鎖且本週未全通）
    out.maze = (MG.sys.maze && st.kingdom && (st.kingdom.level || 1) >= 14) ? !MG.sys.maze.progress().finished : false;
    // v271 委託遠征營（soft 藍點 — 已解鎖且有完成待領/空槽可派）
    out.exped = (MG.sys.expedition && st.kingdom && (st.kingdom.level || 1) >= 16) ? (() => {
      try {
        const p = MG.sys.expedition.progress();
        return p.list.some(s => s && Date.now() >= s.until) || p.list.some(s => !s);
      } catch (e) { return false; }
    })() : false;
    // v235 英雄碎片合成可達成（碎片達任一合成門檻且週限未滿 — 遣散死資產轉化行動提示）
    out.synth = (MG.sys.hunters && MG.sys.hunters.synthPreview) ? (() => { const p = MG.sys.hunters.synthPreview(); return p.can4 || p.can5; })() : false;
    // v241 背包接近上限（≥cap-5 — 掉落將被靜默分解/丟棄的臨界警示；整理即滅）
    out.invFull = (st.inventory && st.inventory.items) ? st.inventory.items.length >= (MG.sys.equipment.inventoryCap() - 5) : false;
    // v236 紅點語意分流：claim 類（可領取 — 稀缺性紅點）vs soft 類（每日免費次數 — 常駐提醒藍點）
    // soft = arena/dungeon/worldboss（v211 每日次數型 — 每天重置後恆亮，紅點疲勞源）
    // v246 紅點語意補齊：每週討伐里程碑可領 = claim 紅；元素試煉塔（每週重置進度提醒 — 與每日次數型同構的週期型）歸入 soft 藍
    out.wbweek = (MG.sys.worldboss && st.worldboss) ? (() => { const wi = MG.sys.worldboss.weekInfo(); return wi.milestones.some(ms => wi.atk >= ms.atk && !wi.claimed["w" + ms.atk]); })() : false;
    out.claim = out.daily || out.weekly || out.ach || out.checkin || out.welcome || out.events || out.abyss || out.codex || out.eq || out.wanderer || out.wbweek || out.synth;
    out.soft = out.arena || out.dungeon || out.worldboss || out.tower || out.royal || out.maze || out.exped; // v265；v271 遠征
    out.any = out.claim || out.soft;
    return out;
  }
  return { check };
})();
