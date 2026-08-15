// mega-idle 製作人輪換制觸發器 — 每 30 秒檢查,空閒時啟動一輪 omp -p
// 輪換狀態: progress/improvement-log.md 狀態行(循環/輪次)
// 防重疊:  progress/goal-loop.lock(存在且新鮮 = busy,跳過;過舊 = 死鎖,接管)
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const LOG = path.join(ROOT, "progress", "improvement-log.md");
const LOCK = path.join(ROOT, "progress", "goal-loop.lock");
const THEME_FILE = path.join(ROOT, "theme.txt");
const THEMES = ["玩法機制與耐玩性", "UI/UX 與品質", "等角地圖", "動作與戰鬥呈現", "數值平衡與留存"];
const LOCK_STALE_MS = 90 * 60 * 1000; // 一輪超過 90 分鐘視為死鎖
const CYCLE_MS = 30000;

function readState() {
  try {
    const t = fs.readFileSync(LOG, "utf8");
    const cycle = (t.match(/循環:(\d+)/) || [0, 1])[1];
    const round = (t.match(/輪次:(\d+)/) || [0, 0])[1];
    return { cycle: +cycle, round: +round };
  } catch { return { cycle: 1, round: 0 }; }
}

function writeState(state) {
  try {
    let t = fs.readFileSync(LOG, "utf8");
    t = t.replace(/循環:\d+/, "循環:" + state.cycle);
    t = t.replace(/輪次:\d+/, "輪次:" + state.round);
    t = t.replace(/當前主題:.*/, "當前主題:" + state.theme);
    t = t.replace(/下一主題:.*/, "下一主題:" + state.next);
    fs.writeFileSync(LOG, t);
  } catch (e) { console.log(new Date().toISOString(), "[warn] writeState:", e.message); }
}

function lockInfo() {
  try {
    const st = fs.statSync(LOCK);
    return { age: Date.now() - st.mtimeMs, txt: fs.readFileSync(LOCK, "utf8").slice(0, 200) };
  } catch { return null; }
}

const themeOf = r => THEMES[r % THEMES.length];
const nextOf = r => THEMES[(r + 1) % THEMES.length];

function runRound() {
  const st = readState();
  const theme = themeOf(st.round);
  const cycle = Math.floor(st.round / THEMES.length) + 1;
  writeState({ cycle, round: st.round, theme, next: nextOf(st.round) });
  fs.writeFileSync(THEME_FILE,
    `本輪主題:【${theme}】(循環 ${cycle}・第 ${(st.round % THEMES.length) + 1} 輪)\n` +
    `任務:在 goal-prompt.md 主題池之「${theme}」範圍內,找出讓玩家想玩更久的一項改善並實作。\n` +
    `禁止:主題外改動。`);
  console.log(new Date().toISOString(), `[start] ${theme} (cycle ${cycle}, round ${st.round})`);
  try {
    const r = spawnSync("omp.cmd", ["launch", "-p", "@goal-prompt.md", "@theme.txt"],
      { cwd: ROOT, encoding: "utf8", timeout: 120 * 60 * 1000, shell: true, maxBuffer: 16 * 1024 * 1024 });
    console.log(new Date().toISOString(), `[done] exit=${r.status} ${(r.stdout || "").slice(-400).replace(/\n/g, " ")}`);
  } catch (e) {
    console.log(new Date().toISOString(), "[error]", e.message);
  }
  try { fs.unlinkSync(LOCK); } catch {} // 即使失敗也釋放 lock,下輪重試
}

(async () => {
  console.log(new Date().toISOString(), "trigger started, cycle", CYCLE_MS / 1000 + "s, themes:", THEMES.join(" → "));
  while (true) {
    const lk = lockInfo();
    if (lk) {
      if (lk.age > LOCK_STALE_MS) {
        console.log(new Date().toISOString(), "[stale-lock] age", Math.round(lk.age / 60000) + "m, removing:", lk.txt);
        try { fs.unlinkSync(LOCK); } catch {}
      } else {
        await new Promise(r => setTimeout(r, CYCLE_MS));
        continue;
      }
    }
    fs.writeFileSync(LOCK, new Date().toISOString() + " trigger pid=" + process.pid);
    runRound();
    await new Promise(r => setTimeout(r, CYCLE_MS));
  }
})().catch(e => { console.error(e); process.exit(1); });
