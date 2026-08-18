"use strict";
// 品質迴圈監控資料饋送器(只讀 watcher) — 每 4 秒把迴圈現況寫成 progress/loop-state.json,
// 供 progress/monitor.html 輪詢顯示。不 spawn agent、不改任何檔案、不干擾正在跑的 trigger。
const fs = require("fs"), path = require("path"), { spawnSync } = require("child_process");

const ROOT = __dirname;
const LOG = path.join(ROOT, "progress", "improvement-log.md");
const THEME = path.join(ROOT, "theme.txt");
const LOCK = path.join(ROOT, "progress", "goal-loop.lock");
const STATE = path.join(ROOT, "progress", "loop-state.json");
const E = R => path.join(ROOT, "progress", `round-${R}-evidence.md`);
const PL = R => path.join(ROOT, "progress", `round-${R}-plan.md`);
const V = R => path.join(ROOT, "progress", `goal-judge-${R}.md`);
const F = R => path.join(ROOT, "progress", `round-${R}-feedback.md`);
const STAGES = [
  { no: 1, name: "取證", role: "flash", model: "opencode-go/deepseek-v4-flash", desc: "開瀏覽器/模擬,收集候選證據包(不選題)" },
  { no: 2, name: "規劃", role: "K3", model: "kimi-code/k3-256k", desc: "讀證據包,決定只做哪一件事並給方案" },
  { no: 3, name: "實作", role: "flash", model: "opencode-go/deepseek-v4-flash", desc: "依 K3 方案實作/自驗/commit" },
  { no: 4, name: "評審", role: "K3", model: "kimi-code/k3-256k", desc: "看報告+截圖+diff 判合格/不合格" }
];

function rd(p) { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } }
function mt(p) { try { return fs.statSync(p).mtimeMs; } catch { return null; } }
function art(m) { return m ? { exists: true, writtenAt: Math.round(m) } : { exists: false, writtenAt: null }; }

function themeInfo() {
  const t = rd(THEME);
  return {
    track: (t.match(/本輪軌道:【(.+?)】/) || [])[1] || null,
    round: +(t.match(/全局輪次 (\d+)/) || [0, null])[1],
    cycle: +(t.match(/循環 (\d+)/) || [0, null])[1],
    sub: (t.match(/本輪子主題:【(.+?)】/) || [])[1] || null
  };
}
function stateLine() {
  const t = rd(LOG);
  return {
    round: (t.match(/輪次:(\d+)/) || [])[1] ?? null,
    cycle: (t.match(/循環:(\d+)/) || [])[1] ?? null,
    cur: (t.match(/當前主題:(.+)/) || [])[1] || null,
    next: (t.match(/下一主題:(.+)/) || [])[1] || null
  };
}
function topReport() {
  const i = rd(LOG).indexOf("### [");
  if (i < 0) return null;
  const m = rd(LOG).slice(i).split("\n")[0].match(/### \[([^\]]+)\]\s*(.*)/);
  return m ? { tag: m[1], title: m[2] } : null;
}
// git 只在 improvement-log 變動時重跑(每秒寫不 spawn git)
let _lastCommit = null, _lastGitLogMtime = null;
function lastCommit() {
  const lm = mt(LOG);
  if (_lastCommit && lm === _lastGitLogMtime) return _lastCommit;
  const r = spawnSync("git", ["log", "-1", "--format=%h|%s"], { cwd: ROOT, encoding: "utf8", timeout: 5000 });
  _lastGitLogMtime = lm;
  if (r.status !== 0) { _lastCommit = null; return null; }
  const [h, ...s] = (r.stdout || "").trim().split("|");
  _lastCommit = { hash: h, subject: (s || []).join("|") };
  return _lastCommit;
}

// 實作→評審 的分界推測:plan 存在且之後 improvement-log 冒出新的 vN 報告(=實作已 commit)→ 評審階段
let judgePhase = false, topSeen = null;

function build() {
  const ti = themeInfo(), sl = stateLine();
  const R = ti.round ?? (sl.round != null ? +sl.round : 0);
  const ev = mt(E(R)), pl = mt(PL(R)), vd = mt(V(R)), fb = mt(F(R));
  const lockMtime = mt(LOCK);
  const lockActive = !!lockMtime;
  const lockAgeSec = lockActive && lockMtime ? Math.max(0, Math.round((Date.now() - lockMtime) / 1000)) : null;

  const tr = topReport();
  if (tr && tr.tag !== topSeen) { if (topSeen !== null && pl && !vd) judgePhase = true; topSeen = tr.tag; }
  else if (!pl || vd) judgePhase = false;

  let stage = null, status = "idle";
  if (lockActive) {
    if (!ev) { stage = STAGES[0]; status = "running"; }
    else if (!pl) { stage = STAGES[1]; status = "running"; }
    else if (vd) { stage = STAGES[3]; status = /評審判決\s*[:：]\s*(合格|PASS)/i.test(rd(V(R))) ? "pass" : "fail"; }
    else if (judgePhase) { stage = STAGES[3]; status = "running"; }
    else { stage = STAGES[2]; status = "running"; }
  }

  const vtxt = vd ? rd(V(R)) : "";
  const state = {
    updatedAt: new Date().toISOString(),
    cycle: ti.cycle ?? sl.cycle, round: R,
    track: ti.track, subTheme: ti.sub, nextTrack: sl.next,
    lock: { active: lockActive, ageSec: lockAgeSec, pid: (rd(LOCK).match(/pid=(\d+)/) || [])[1] || null },
    stage: stage ? { no: stage.no, name: stage.name, role: stage.role, model: stage.model, desc: stage.desc, status, max: 4 }
                  : { no: 0, name: "等待下一輪", role: null, model: null, status: "idle", max: 4 },
    phaseNote: judgePhase ? "已見新 vN commit,評審(K3)進行中(推測)" : null,
    artifacts: { evidence: art(ev), plan: art(pl), verdict: art(vd), feedback: art(fb) },
    verdict: { status: vd ? (/評審判決\s*[:：]\s*(合格|PASS)/i.test(vtxt) ? "合格" : "不合格") : "無", pass: /評審判決\s*[:：]\s*(合格|PASS)/i.test(vtxt), text: vtxt.slice(0, 160) },
    fixRound: !!fb,
    topReport: tr,
    lastCommit: lastCommit()
  };
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2), "utf8");
}

setInterval(() => { try { build(); } catch (e) { console.error(new Date().toISOString(), e.message); } }, 1000);
build();
console.log(new Date().toISOString(), "monitor-feed started (1s) → progress/loop-state.json");
