// mega-idle 品質多軌自動迴圈觸發器 — 每 30 秒檢查,空閒時執行一輪【執行→K3 評審】兩段式
// 模型分工(省 K3):執行代理用 flash(PI_MODEL_EXEC,粗活:診斷/實作/驗證/提交),
//   每輪跑完由 K3 評審(PI_MODEL_JUDGE,只讀)依「報告+progress/ 截圖+git diff」判 合格/不合格;
//   不合格 → 有限次修正輪(沿用原 [vN],不再 +1 快取),合格或達上限後才由觸發器推進狀態行。
// 軌道輪換: progress/improvement-log.md 狀態行(循環/輪次/當前主題)決定;5 軌道依序輪換。
// 防重疊:  progress/goal-loop.lock(存在且新鮮 = busy,跳過;過舊 = 死鎖,接管)
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const LOG = path.join(ROOT, "progress", "improvement-log.md");
const LOCK = path.join(ROOT, "progress", "goal-loop.lock");
const THEME_FILE = path.join(ROOT, "theme.txt");

// ---- 模型分工:執行代理(flash 粗活)＋評審(K3 只讀閘門) ----
const EXEC_MODEL = process.env.PI_MODEL_EXEC || "opencode-go"; // flash 級執行
const JUDGE_MODEL = process.env.PI_MODEL_JUDGE || "kimi-k3";   // K3 級評審
const JUDGE_PROMPT = "prompts/goal-judge.md";

// ---- 5 條品質軌道。改動順序/增刪軌道只改這裡 ----
const TRACKS = [
  { id: "balance",     name: "遊戲數值平衡",       prompt: "prompts/goal-balance.md" },
  { id: "village-art", name: "村莊與王國美術優化", prompt: "prompts/goal-village-art.md" },
  { id: "battle-art",  name: "戰鬥畫面美術優化",   prompt: "prompts/goal-battle-art.md" },
  { id: "qol",         name: "QoL 與 UX",          prompt: "prompts/goal-qol.md" },
  { id: "theotown",    name: "TheoTown 世界地圖",  prompt: "prompts/goal-theotown.md" }
];
const THEOTOWN_SUBS = [
  "TheoTown 建築與地標",
  "TheoTown 村莊生活感與街道",
  "TheoTown 地形・道路與環境",
  "TheoTown 海洋・氛圍與動態",
  "TheoTown 技術對齊與稽核"
];
const N = TRACKS.length;

const LOCK_STALE_MS = 150 * 60 * 1000;   // 執行＋評審可能超過 90 分鐘 → 保守 150
const CYCLE_MS = 30000;
const EXEC_TIMEOUT = 150 * 60 * 1000;
const JUDGE_TIMEOUT = 20 * 60 * 1000;
const COOLDOWN_MS = 60 * 60 * 1000;      // 連續額度失敗 → 冷卻
const HARD_RETRY_MS = 5 * 60 * 1000;     // 除額度外失敗 → 等 5 分鐘重試同輪
const MAX_JUDGE_RETRY = 2;               // 評審不合格修正輪上限
const MAX_HARD_FAILS = 3;                // 同輪執行連敗 → 標記跳過並推進(防死鎖)
const QUOTA_RE = /(429|quota|rate.?limit|insufficient|額度|限流|too many|402)/i;

const VERDICT = R => path.join(ROOT, "progress", `goal-judge-${R}.md`);
const FEEDBACK = R => path.join(ROOT, "progress", `round-${R}-feedback.md`);
const RECORD_HEAD = "<!-- 每輪記錄從這裡往下附加";

// ---------- 軌道排程 ----------
const mod5 = x => ((x % 5) + 5) % 5;
const trackOf = R => TRACKS[mod5(R)];
const cycleOf = R => Math.floor(R / N) + 1;
const theotownSubIndex = R => mod5(Math.floor(R / N) - 1); // TheoTown 子主題逐次遞進(接續舊制 R=4)
const themeDisplay = R => {
  const tr = trackOf(R);
  return tr.id === "theotown" ? `【TheoTown 世界地圖】(${THEOTOWN_SUBS[theotownSubIndex(R)]})` : `【${tr.name}】`;
};
function themeText(R) {
  const tr = trackOf(R);
  const cycle = cycleOf(R);
  const head = `本輪軌道:【${tr.name}】(全局輪次 ${R}・循環 ${cycle})`;
  if (tr.id === "theotown") {
    const sub = THEOTOWN_SUBS[theotownSubIndex(R)];
    return head +
      `\n本輪子主題:【${sub}】(TheoTown 軌道第 ${theotownSubIndex(R) + 1}/5 子主題)` +
      `\n任務:在 prompts/goal-theotown.md 主題池之「${sub}」範圍內,找出讓玩家想玩更久的一項改善並實作。` +
      `\n禁止:子主題外改動。`;
  }
  return head +
    `\n任務:在 ${tr.prompt} 範圍內,找出讓玩家想玩更久的一項改善並實作,依該 prompt 的驗證協議驗證。` +
    `\n禁止:軌道外改動(其他軌道見 loop-trigger.js TRACKS)。`;
}

// ---------- 狀態 ----------
function readState() {
  try {
    const t = fs.readFileSync(LOG, "utf8");
    return {
      cycle: +(t.match(/循環:(\d+)/) || [0, 1])[1],
      round: +(t.match(/輪次:(\d+)/) || [0, 0])[1]
    };
  } catch { return { cycle: 1, round: 0 }; }
}
function writeState(state, file = LOG) {
  try {
    let t = fs.readFileSync(file, "utf8");
    t = t.replace(/循環:\d+/, "循環:" + state.cycle);
    t = t.replace(/輪次:\d+/, "輪次:" + state.round);
    t = t.replace(/當前主題:.*/, "當前主題:" + state.theme);
    t = t.replace(/下一主題:.*/, "下一主題:" + state.next);
    fs.writeFileSync(file, t);
  } catch (e) { console.log(new Date().toISOString(), "[warn] writeState:", e.message); }
}
function lockInfo() {
  try {
    const st = fs.statSync(LOCK);
    return { age: Date.now() - st.mtimeMs, txt: fs.readFileSync(LOCK, "utf8").slice(0, 200) };
  } catch { return null; }
}

// ---------- 失敗分類(改善 1:不再把「任何非零 exit」當缺額度) ----------
// 額度特徵(429/quota/限流…) → 'quota'(降級/冷卻);其餘失敗(工具錯/timeout/spawn 爆)→ 'hard'(不降級);
// status 0 → 'ok'。
function classify(r) {
  if (!r) return "hard";
  const out = ((r.stdout || "") + (r.stderr || "")).slice(-4000);
  if (QUOTA_RE.test(out)) return "quota";
  if (r.status === 0) return "ok";
  return "hard";
}

// ---------- 評審判決與修正回饋 ----------
function readVerdict(R, file = VERDICT(R)) {
  try {
    const t = fs.readFileSync(file, "utf8");
    return { pass: /評審判決\s*[:：]\s*(合格|PASS)/i.test(t), text: t };
  } catch { return null; }
}
function writeFeedback(R, verdictText, file = FEEDBACK(R)) {
  const head =
    "── 評審修正輪(自動產生:上一輪經 K3 評審判定不合格)──\n" +
    "本次為修正輪,範圍仍限本軌道。規則:\n" +
    "- 只修正評審指出的問題(下方原文);\n" +
    "- 版本保持上一輪的 [vN](見 improvement-log 最上段):更新該 [vN] 條目,不新增版本號;\n" +
    "- index.html 快取維持已 +1 的狀態(不再 +1);\n" +
    "- improvement-log 的 [vN] 條目補一行「(vN 修正:...)」;\n" +
    "- 依原軌道 prompt 驗證協議重驗後 git commit(訊息含「修正」);\n" +
    "- 不更動狀態行(輪次由觸發器在評審通過後推進)。\n\n" +
    "── 評審修正回饋(原文,見 progress/goal-judge-" + R + ".md)──\n" + verdictText;
  fs.writeFileSync(file, head, "utf8");
}

// ---------- 單輪編排:執行(flash)→ 評審(K3)→ 判決 ----------
function runRoundOnce(R, deps = {}) {
  const log = deps.log || ((...a) => console.log(...a));
  const ts = () => new Date().toISOString();
  const P = Object.assign({
    log: LOG, theme: THEME_FILE, verdict: VERDICT, feedback: FEEDBACK
  }, deps.paths || {});
  const exists = deps.exists || (p => fs.existsSync(p));
  const readFile = deps.readFile || fs.readFileSync;
  const writeFile = deps.writeFile || fs.writeFileSync;
  const unlink = deps.unlink || (p => { try { fs.unlinkSync(p); } catch {} });
  const spawn = deps.spawn || ((tag, args, timeout) =>
    spawnSync("omp.cmd", args, { cwd: ROOT, encoding: "utf8", timeout, shell: true, maxBuffer: 32 * 1024 * 1024 }));

  const tr = trackOf(R);
  const next = trackOf(R + 1);
  writeFile(P.theme, themeText(R), "utf8");
  writeState({ cycle: cycleOf(R), round: R, theme: themeDisplay(R), next: next.name }, P.log);

  // 1) 執行代理(flash)
  const execArgs = ["launch", "-p", "@" + tr.prompt, "@theme.txt"];
  if (EXEC_MODEL) execArgs.push("--model", EXEC_MODEL);
  const isFix = exists(P.feedback(R));
  if (isFix) execArgs.push("@" + P.feedback(R));
  log(ts(), `[exec-start] ${tr.name} R=${R} model=${EXEC_MODEL}${isFix ? " (評審修正輪)" : ""}`);
  const er = spawn("exec", execArgs, EXEC_TIMEOUT);
  const ek = classify(er);
  if (ek !== "ok") {
    log(ts(), `[exec-fail/${ek}] R=${R} exit=${er && er.status} ${(String((er && er.stderr) || (er && er.stdout) || "").slice(-600)).replace(/\n/g, " ")}`);
    return { kind: ek };
  }
  log(ts(), `[exec-done] R=${R} exit=0`);

  // 2) 評審(K3,只讀)
  const judgeArgs = ["launch", "-p", "@" + JUDGE_PROMPT, "@theme.txt"];
  if (JUDGE_MODEL) judgeArgs.push("--model", JUDGE_MODEL);
  unlink(P.verdict(R));
  log(ts(), `[judge-start] R=${R} model=${JUDGE_MODEL}`);
  let jr = spawn("judge", judgeArgs, JUDGE_TIMEOUT);
  const jk = classify(jr);
  let verdict = readVerdict(R, P.verdict(R));
  if (jk !== "ok" || !verdict) {
    log(ts(), `[judge-fail/${jk}] R=${R} 重試評審一次`);
    jr = spawn("judge", judgeArgs, JUDGE_TIMEOUT);
    verdict = readVerdict(R, P.verdict(R));
    if (!verdict) {
      log(ts(), `[judge-void] R=${R} 評審未產出判決,採計通過並前進(避免死鎖)`);
      return { kind: "fail-accept" };
    }
  }
  log(ts(), `[judge-done] R=${R} pass=${verdict.pass}`);
  if (verdict.pass) return { kind: "pass" };
  writeFeedback(R, verdict.text, P.feedback(R));
  return { kind: "fail-retry" };
}

// ---------- 狀態推進(輪次+1,由觸發器擁有) ----------
function advance(deps = {}) {
  const log = deps.log || console.log;
  const P = Object.assign({ log: LOG, theme: THEME_FILE }, deps.paths || {});
  const writeFile = deps.writeFile || fs.writeFileSync;
  const st = readState();
  const R = st.round + 1;
  const next = trackOf(R + 1);
  writeState({ cycle: cycleOf(R), round: R, theme: themeDisplay(R), next: next.name }, P.log);
  writeFile(P.theme, themeText(R), "utf8");
  log(new Date().toISOString(), `[advance] 輪次 -> ${R} 下一軌道: ${trackOf(R).name}`);
}

// ---------- 同輪執行連敗 → 標記跳過並推進(不讓被下毒的回合卡死迴圈) ----------
function writeSkipMarker(R, tail, deps = {}) {
  const P = Object.assign({ log: LOG }, deps.paths || {});
  const readFile = deps.readFile || fs.readFileSync;
  const writeFile = deps.writeFile || fs.writeFileSync;
  try {
    const t = readFile(P.log, "utf8");
    const marker = `\n---\n### [skip R${R}] ${trackOf(R).name} — 執行代理連敗 ${MAX_HARD_FAILS} 次,由觸發器標記跳過並推進\n尾輸出:${(tail || "").slice(0, 300)}\n---\n`;
    const i = t.indexOf(RECORD_HEAD);
    const n = t.indexOf("-->", i);
    writeFile(P.log, t.slice(0, n + 3) + marker + t.slice(n + 3), "utf8");
  } catch (e) { console.log(new Date().toISOString(), "[warn] writeSkipMarker:", e.message); }
}

// ---------- dry-run(只用於預覽,不改任何檔案) ----------
function dryRun(offset = 0) {
  const st = readState();
  const R = st.round + offset;
  const tr = trackOf(R);
  console.log("── dry-run(僅預覽,不寫檔/不 spawn) ──");
  console.log("狀態行讀到: 循環=" + st.cycle + " 輪次=" + st.round);
  console.log("將執行: 全局輪次 " + R + " 循環 " + cycleOf(R));
  console.log("軌道: " + tr.id + " — " + tr.name + (tr.id === "theotown" ? ` (子主題: ${THEOTOWN_SUBS[theotownSubIndex(R)]})` : ""));
  console.log("執行代理(flash): omp.cmd launch -p @" + tr.prompt + " @theme.txt" + (EXEC_MODEL ? " --model " + EXEC_MODEL : ""));
  console.log("評審(K3): omp.cmd launch -p @" + JUDGE_PROMPT + " @theme.txt" + (JUDGE_MODEL ? " --model " + JUDGE_MODEL : ""));
  console.log("修正輪上限: " + MAX_JUDGE_RETRY + " 回;評審閘門: 合格才推進狀態行");
  console.log("theme.txt 內容:\n" + themeText(R));
}

// ---------- 主迴圈 ----------
async function main() {
  if (process.argv.includes("--dry")) { dryRun(0); return; }
  if (process.argv.includes("--dry-next")) { dryRun(1); return; }
  const log = (...a) => console.log(new Date().toISOString(), ...a);
  console.log(new Date().toISOString(), "trigger started, cycle", CYCLE_MS / 1000 + "s, tracks:", TRACKS.map(t => t.name).join(" → "));
  console.log(new Date().toISOString(), `model role: executor=${EXEC_MODEL} (flash) → judge=${JUDGE_MODEL} (K3), judge retry ×${MAX_JUDGE_RETRY}`);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let lastRound = -1, judgeAttempts = 0, quotaStreak = 0, hardStreak = 0, lastQuotaAt = 0;

  while (true) {
    const lk = lockInfo();
    if (lk) {
      if (lk.age > LOCK_STALE_MS) {
        log("[stale-lock] age", Math.round(lk.age / 60000) + "m, removing:", lk.txt);
        try { fs.unlinkSync(LOCK); } catch {}
      } else {
        await sleep(CYCLE_MS);
        continue;
      }
    }
    // 額度冷卻:連續 ≥3 次 → 停 COOLDOWN_MS(避免空轉燒 API)
    if (quotaStreak >= 3) {
      const wait = COOLDOWN_MS - (Date.now() - lastQuotaAt);
      if (wait > 0) {
        log(`[cooldown] quotaStreak=${quotaStreak}, 等待 ${Math.round(wait / 60000)} 分鐘`);
        await sleep(Math.min(wait, CYCLE_MS * 2));
        continue;
      }
      quotaStreak = 0;
    }
    const st = readState();
    const R = st.round;
    if (R !== lastRound) { lastRound = R; judgeAttempts = 0; }

    fs.writeFileSync(LOCK, new Date().toISOString() + " trigger pid=" + process.pid + " globalRound=" + R);
    const out = runRoundOnce(R);
    try { fs.unlinkSync(LOCK); } catch {}

    switch (out.kind) {
      case "quota": // 額度失敗:不因「實作寫壞」而誤判 → 只有真正額度特徵才進這
        quotaStreak++; hardStreak = 0; lastQuotaAt = Date.now();
        log(`[quota] streak=${quotaStreak} / 3 → 冷卻後自動重試同輪 R=${R}`);
        break;
      case "hard": // 真實失敗(工具錯/spawn)不降級;連敗跳過
        hardStreak++; quotaStreak = 0;
        if (hardStreak >= MAX_HARD_FAILS) {
          log(`[skip] R=${R} 執行連敗 ${MAX_HARD_FAILS} 次,標記跳過並推進`);
          writeSkipMarker(R, "");
          hardStreak = 0; judgeAttempts = 0;
          advance();
        } else {
          log(`[hard] R=${R} hardStreak=${hardStreak} / ${MAX_HARD_FAILS}, ${HARD_RETRY_MS / 60000} 分鐘後重試同輪`);
          await sleep(HARD_RETRY_MS);
        }
        break;
      case "fail-retry": // 評審不合格:開修正輪(附回饋);達上限採計前進
        judgeAttempts++; quotaStreak = 0; hardStreak = 0;
        if (judgeAttempts >= MAX_JUDGE_RETRY) {
          log(`[fail-accept] R=${R} 評審修正達上限 ${MAX_JUDGE_RETRY} 回,採計並前進(見 progress/goal-judge-${R}.md 回饋)`);
          advance();
        } else {
          log(`[fix] R=${R} 評審不合格,修正輪 ${judgeAttempts}/${MAX_JUDGE_RETRY}(回饋已寫 round-${R}-feedback.md)`);
          await sleep(CYCLE_MS);
        }
        break;
      case "pass":
      case "fail-accept":
        quotaStreak = 0; hardStreak = 0; judgeAttempts = 0;
        log(`[${out.kind === "pass" ? "pass" : "accept"}] R=${R} ${out.kind === "pass" ? "評審合格" : "評審採計"} → 推進`);
        advance();
        break;
    }
    await sleep(CYCLE_MS);
  }
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}

module.exports = {
  TRACKS, THEOTOWN_SUBS, N, EXEC_MODEL, JUDGE_MODEL, JUDGE_PROMPT,
  MAX_JUDGE_RETRY, MAX_HARD_FAILS, QUOTA_RE,
  readState, writeState, themeText, themeDisplay, trackOf, cycleOf, theotownSubIndex,
  classify, readVerdict, writeFeedback, runRoundOnce, advance, writeSkipMarker, dryRun,
  VERDICT, FEEDBACK
};
