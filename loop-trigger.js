// mega-idle 品質多軌自動迴圈觸發器 — 每 30 秒檢查,空閒時執行一輪【取證→規劃→實作→評審】四段式
// 模型分工:flash(取證/實作) + K3 256K(規劃/評審) — K3 僅花在判斷(規劃新設計/評分/評審/稽核),不花在機械執行;
//   PI_MODEL_DIAG(取證) / PI_MODEL_EXEC(實作) = flash, PI_MODEL_PLAN(規劃) / PI_MODEL_JUDGE(評審) = K3 256K;
//   K3 額度耗盡(429/quota) → 自動 fallback 至 PI_K3_FALLBACK(默認 glm-5.3),重試一次;
//   每輪跑完由 K3 評審(PI_MODEL_JUDGE,只讀)依「報告+progress/ 截圖+git diff」判 合格/不合格;
//   不合格 → 有限次修正輪(沿用原 [vN],不再 +1 快取),合格或達上限後才由觸發器推進狀態行。
// 軌道輪換: progress/improvement-log.md 狀態行(循環/輪次/當前主題)決定;4 軌道依序輪換。
// 防重疊:  progress/goal-loop.lock(存在且新鮮 = busy,跳過;過舊 = 死鎖,接管)
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const LOG = path.join(ROOT, "progress", "improvement-log.md");
const LOCK = path.join(ROOT, "progress", "goal-loop.lock");
const THEME_FILE = path.join(ROOT, "theme.txt");

// ---- 模型分工:flash(取證/實作) + K3 256K(規劃/評審) — K3 僅花在判斷,不花在機械執行。
// 需完整 "provider/model" spec(裸 provider 名 fuzzy 解不出);:high = K3 高推理;
// flash = mimo-v2.5-pro(快/執行力強), K3 256K = kimi-code(深推理/規劃/評審)。
const DIAG_MODEL = process.env.PI_MODEL_DIAG || "opencode-go/mimo-v2.5-pro";          // 取證:flash(採集證據)
const PLAN_MODEL = process.env.PI_MODEL_PLAN || "kimi-code/k3-256k:high";           // 規劃:K3(決定做哪件事)
const EXEC_MODEL = process.env.PI_MODEL_EXEC || "opencode-go/mimo-v2.5-pro";          // 實作:flash(機械執行)
const JUDGE_MODEL = process.env.PI_MODEL_JUDGE || "kimi-code/k3-256k:high";         // 評審:K3(驗收判斷)
const K3_FALLBACK = process.env.PI_K3_FALLBACK || "zai/glm-5.3:high";               // K3 額度耗盡時的 fallback
const DIAG_PROMPT = "prompts/goal-diagnose.md";   // 取證(flash)
const PLAN_PROMPT = "prompts/goal-planner.md";    // 規劃(K3)
const JUDGE_PROMPT = "prompts/goal-judge.md";     // 評審:K3(驗收)
const BASE_PROMPT = "prompts/goal-base.md";       // 共通基底(與軌道 prompt 拼接)

// ---- 4 條品質軌道(使用者 v627 決策:TheoTown 世界地圖已從遊戲移除,軌道同步撤除)。改動順序/增刪軌道只改這裡 ----
// type: 用於 base prompt 的驗證 b/f 軌道專屬路由; timeout: 單輪執行超時(ms)
const TRACKS = [
  { id: "battle-art",  name: "戰鬥畫面美術優化",   prompt: "prompts/goal-battle-art.md",  type: "battle-art",  timeout: 120 * 60 * 1000 },
  { id: "balance",     name: "遊戲數值平衡",       prompt: "prompts/goal-balance.md",     type: "balance",     timeout: 90 * 60 * 1000 },
  { id: "village-art", name: "村莊與王國美術優化", prompt: "prompts/goal-village-art.md", type: "village-art", timeout: 120 * 60 * 1000 },
  { id: "qol",         name: "QoL 與 UX",          prompt: "prompts/goal-qol.md",         type: "qol",         timeout: 60 * 60 * 1000 }
];
const N = TRACKS.length;

// ---------- prompt 拼接:base + track → temp file ----------
const COMBINED_PROMPT = path.join(ROOT, ".tmp", "combined-prompt.md");
function composePrompt(trackPrompt) {
  const base = fs.readFileSync(path.join(ROOT, BASE_PROMPT), "utf8");
  const track = fs.readFileSync(path.join(ROOT, trackPrompt), "utf8");
  // 在 base 的「## 軌道專屬內容」標記處插入軌道內容
  const marker = "## 軌道專屬內容";
  const idx = base.indexOf(marker);
  const combined = idx >= 0
    ? base.slice(0, idx) + track + "\n\n---\n" + base.slice(idx + marker.length)
    : base + "\n\n---\n\n" + track; // fallback:直接附加
  fs.mkdirSync(path.join(ROOT, ".tmp"), { recursive: true });
  fs.writeFileSync(COMBINED_PROMPT, combined, "utf8");
}

const LOCK_STALE_MS = 30 * 60 * 1000;    // PID 死→立即接管; PID 活但 30 分鐘無更新→強制接管(heartbeat 每階段刷新)
const CYCLE_MS = 15000;                  // 15 秒(原 30 秒 — 空閒時更快接手)
const EXEC_TIMEOUT = 60 * 60 * 1000;     // 60 分鐘(原 150 — flash 正常 10-15 分鐘,60 分鐘已含安全邊際)
const JUDGE_TIMEOUT = 10 * 60 * 1000;    // 10 分鐘(原 20 — 評審只需讀報告+截圖)
const COOLDOWN_MS = +(process.env.PI_LOOP_COOLDOWN_MS ?? 900000); // 15 分鐘(原 1 小時 — 額度恢復通常 5-10 分鐘)
const HARD_RETRY_MS = 2 * 60 * 1000;     // 2 分鐘(原 5 — API 斷線通常幾秒就恢復)
const MAX_JUDGE_RETRY = 2;               // 評審不合格修正輪上限
const MAX_HARD_FAILS = 3;                // 同輪執行連敗 → 標記跳過並推進(防死鎖)
const QUOTA_RE = /(429|quota|rate.?limit|insufficient|額度|限流|too many|402)/i;

const EVIDENCE = R => path.join(ROOT, "progress", `round-${R}-evidence.md`);   // 取證代理產出
const PLAN = R => path.join(ROOT, "progress", `round-${R}-plan.md`);           // 規劃閘門(K3)產出
const VERDICT = R => path.join(ROOT, "progress", `goal-judge-${R}.md`);
const FEEDBACK = R => path.join(ROOT, "progress", `round-${R}-feedback.md`);
const RECORD_HEAD = "<!-- 每輪記錄從這裡往下附加";

// ---------- 軌道排程 ----------
const modN = x => ((x % N) + N) % N;
const trackOf = R => TRACKS[modN(R)];
const cycleOf = R => Math.floor(R / N) + 1;
const themeDisplay = R => `【${trackOf(R).name}】`;
function themeText(R) {
  const tr = trackOf(R);
  const cycle = cycleOf(R);
  const nextVN = peekNextVN(); // 自動計算下一個版本號,agent 只讀不猜
  const head = `本輪軌道:【${tr.name}】(全局輪次 ${R}・循環 ${cycle})`;
  return head +
    `\n任務:在 ${tr.prompt} 範圍內,找出讓玩家想玩更久的一項改善並實作,依該 prompt 的驗證協議驗證。` +
    `\n禁止:軌道外改動(其他軌道見 loop-trigger.js TRACKS)。` +
    `\n下一個版本號:v${nextVN}(agent 直接使用,不要自己計算)`;
}

// ---------- 自動計算下一個版本號(I:消除 agent 自數 vN 的錯誤) ----------
function peekNextVN() {
  try {
    const t = fs.readFileSync(LOG, "utf8");
    const m = t.match(/\[v(\d+)\]/);
    return m ? +m[1] + 1 : 1;
  } catch { return 1; }
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
    const txt = fs.readFileSync(LOCK, "utf8").slice(0, 200);
    // 從 lock 檔解析 PID: "2026-... trigger pid=12345 globalRound=27"
    const pidMatch = txt.match(/pid=(\d+)/);
    const pid = pidMatch ? +pidMatch[1] : 0;
    // 檢查 PID 是否仍存活(Windows: process.kill(pid, 0) 不可靠,改用 tasklist)
    let alive = false;
    if (pid > 0) {
      try {
        // cross-platform: kill(pid, 0) 拋錯 = 死了; 不拋 = 活著
        process.kill(pid, 0);
        alive = true;
      } catch { alive = false; }
    }
    return { age: Date.now() - st.mtimeMs, txt, pid, alive };
  } catch { return null; }
}

// ---------- 失敗分類(改善 1:不再把「任何非-zero exit」當缺額度) ----------
// 額度特徵(429/quota/限流…) → 'quota'(降級/冷卻);其餘失敗(工具錯/timeout/spawn 爆)→ 'hard'(不降級);
// status 0 → 'ok'。
function classify(r) {
  if (!r) return "hard";
  const out = ((r.stdout || "") + (r.stderr || "")).slice(-4000);
  if (QUOTA_RE.test(out)) return "quota";
  if (r.status === 0) return "ok";
  return "hard";
}

// ---------- K3 fallback:額度失敗時自動切 fallback 模型重試一次 ----------
function spawnWithFallback(tag, args, timeout, model, fallbackModel, log, spawnFn) {
  // 先用主模型
  let r = spawnFn(tag, args, timeout);
  let k = classify(r);
  if (k !== "quota" || !fallbackModel || model === fallbackModel) return { r, k, usedModel: model };
  // 額度失敗 → 替換 --model 參數為 fallback 重試
  log(new Date().toISOString(), `[${tag}-fallback] ${model} 額度失敗,切 ${fallbackModel} 重試`);
  const fbArgs = args.map((a, i) => (args[i - 1] === "--model" ? fallbackModel : a));
  r = spawnFn(tag, fbArgs, timeout);
  k = classify(r);
  return { r, k, usedModel: fallbackModel };
}

// ---------- 評審判決與修正回饋 ----------
function readVerdict(R, file = VERDICT(R)) {
  try {
    const t = fs.readFileSync(file, "utf8");
    return { pass: /評審判決\s*[:：]\s*(合格|PASS)/i.test(t), text: t };
  } catch { return null; }
}
function writeFeedback(R, verdictText, file = FEEDBACK(R)) {
  // J: 修正輪使用 vN-fixM 格式,破瀏覽器快取但不算新版本
  const currentVN = (() => {
    try {
      const t = fs.readFileSync(LOG, "utf8");
      const m = t.match(/\[v(\d+)\]/);
      return m ? +m[1] : 0;
    } catch { return 0; }
  })();
  // 計算本輪第幾個修正輪(讀 feedback 檔名計數)
  const fixNum = (() => {
    try {
      const dir = path.join(ROOT, "progress");
      const files = fs.readdirSync(dir).filter(f => f.includes(`round-${R}-feedback`));
      return files.length + 1;
    } catch { return 1; }
  })();
  const fixTag = `v${currentVN}-fix${fixNum}`;
  const head =
    "── 評審修正輪(自動產生:上一輪經 K3 評審判定不合格)──\n" +
    "本次為修正輪,範圍仍限本軌道。規則:\n" +
    "- 只修正評審指出的問題(下方原文);\n" +
    `- 版本號使用 ${fixTag}(破瀏覽器快取,但不算新版本);\n` +
    `- index.html 快取 ?v= 改為 ${fixTag}(破快取);\n` +
    `- changelog.js 在原 [v${currentVN}] 條目下補「(${fixTag}:修正內容)」;\n` +
    `- improvement-log 的 [v${currentVN}] 條目補「(${fixTag}:...)」;\n` +
    "- 依原軌道 prompt 驗證協議重驗後 git commit(訊息含「修正」);\n" +
    "- 不更動狀態行(輪次由觸發器在評審通過後推進)。\n\n" +
    "── 評審修正回饋(原文,見 progress/goal-judge-" + R + ".md)──\n" + verdictText;
  fs.writeFileSync(file, head, "utf8");
}

// ---------- heartbeat:刷新 lock 時間戳(防止長執行被誤判 stale) ----------
function touchLock() {
  try {
    const now = new Date().toISOString();
    fs.writeFileSync(LOCK, now + " trigger pid=" + process.pid + " heartbeat", "utf8");
  } catch {}
}

// ---------- 單輪編排:取證 → 規劃 → 實作 → 評審(全 K3)----------
function runRoundOnce(R, deps = {}) {
  const log = deps.log || ((...a) => console.log(...a));
  const ts = () => new Date().toISOString();
  const P = Object.assign({
    log: LOG, theme: THEME_FILE, evidence: EVIDENCE, plan: PLAN, verdict: VERDICT, feedback: FEEDBACK
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
  const failTail = r => String((r && r.stderr) || (r && r.stdout) || "").slice(-600).replace(/\n/g, " ");
  const isFix = exists(P.feedback(R));

  // —— 前端:取證 → 規劃(P:合併為一次 K3 調用,省一次 session 往返) ——
  const hasPlan = exists(P.plan(R));
  if (!isFix && !hasPlan) {
    // P: 取證+規劃合併 — K3 同時收集證據並決定方案
    // 取證代理仍用 flash 採集瀏覽器證據,但規劃閘門合併到同一 prompt
    unlink(P.evidence(R)); unlink(P.plan(R));

    // Step 1: flash 取證(開瀏覽器/模擬,收集證據包)
    touchLock();
    const diagArgs = ["launch", "-p", "@" + DIAG_PROMPT, "@theme.txt"];
    if (DIAG_MODEL) diagArgs.push("--model", DIAG_MODEL);
    log(ts(), `[diag-start] ${tr.name} R=${R} model=${DIAG_MODEL}`);
    const dr = spawn("diagnose", diagArgs, EXEC_TIMEOUT);
    const dk = classify(dr);
    if (dk !== "ok" || !exists(P.evidence(R))) {
      log(ts(), `[diag-fail/${dk}] R=${R} ${failTail(dr)}`);
      return { kind: dk };
    }
    log(ts(), `[diag-done] R=${R} evidence ok`);

    // Step 2: K3 規劃(讀取證據包,決定方案)
    touchLock();
    const planArgs = ["launch", "-p", "@" + PLAN_PROMPT, "@theme.txt"];
    if (PLAN_MODEL) planArgs.push("--model", PLAN_MODEL);
    log(ts(), `[plan-start] R=${R} model=${PLAN_MODEL}`);
    let { r: pr, k: pk, usedModel: planUsed } = spawnWithFallback("plan", planArgs, JUDGE_TIMEOUT, PLAN_MODEL, K3_FALLBACK, log, spawn);
    let planOK = exists(P.plan(R)) && /本輪選題/.test(String(readFile(P.plan(R), "utf8")));
    if (pk !== "ok" || !planOK) {
      log(ts(), `[plan-fail/${pk}] R=${R} 重試規劃一次`);
      ({ r: pr, k: pk, usedModel: planUsed } = spawnWithFallback("plan", planArgs, JUDGE_TIMEOUT, planUsed, planUsed === PLAN_MODEL ? K3_FALLBACK : null, log, spawn));
      planOK = exists(P.plan(R)) && /本輪選題/.test(String(readFile(P.plan(R), "utf8")));
      if (pk === "quota") return { kind: "quota" };
      if (!planOK) {
        log(ts(), `[plan-void] R=${R} 規劃無效,視為 hard(觸發器重跑前端)`);
        return { kind: "hard" };
      }
    }
    log(ts(), `[plan-done] R=${R} plan ok (model=${planUsed})`);
  }

  // —— 中段:實作(附 K3 方案;修正輪再附評審回饋) ——
  // @file 路徑必須相對且不含空格(本機專案在 "Claude code" 含空格 → 絕對路徑會被 @ 展開切斷)
  const rplan = path.relative(ROOT, P.plan(R)).replace(/\\/g, "/");
  const rfb = isFix ? path.relative(ROOT, P.feedback(R)).replace(/\\/g, "/") : null;
  // 拼接 base + track prompt → .tmp/combined-prompt.md,避免 agent 讀兩份檔
  composePrompt(tr.prompt); // 寫入 COMBINED_PROMPT
  const rcombined = path.relative(ROOT, COMBINED_PROMPT).replace(/\\/g, "/");
  const implArgs = ["launch", "-p", "@" + rcombined, "@theme.txt", "@" + rplan];
  if (EXEC_MODEL) implArgs.push("--model", EXEC_MODEL);
  if (rfb) implArgs.push("@" + rfb);
  touchLock();
  log(ts(), `[impl-start] ${tr.name} R=${R} model=${EXEC_MODEL}${isFix ? " (評審修正輪)" : ""}`);
  const ir = spawn("impl", implArgs, tr.timeout || EXEC_TIMEOUT);
  const ik = classify(ir);
  if (ik !== "ok") {
    log(ts(), `[impl-fail/${ik}] R=${R} exit=${ir && ir.status} ${failTail(ir)}`);
    return { kind: ik };
  }
  log(ts(), `[impl-done] R=${R} exit=0`);

  // —— 後段:評審(K3,只讀;額度失敗自動切 fallback) ——
  const judgeArgs = ["launch", "-p", "@" + JUDGE_PROMPT, "@theme.txt"];
  if (JUDGE_MODEL) judgeArgs.push("--model", JUDGE_MODEL);
  touchLock();
  unlink(P.verdict(R));
  log(ts(), `[judge-start] R=${R} model=${JUDGE_MODEL}`);
  let { r: jr, k: jk, usedModel: judgeUsed } = spawnWithFallback("judge", judgeArgs, JUDGE_TIMEOUT, JUDGE_MODEL, K3_FALLBACK, log, spawn);
  let verdict = readVerdict(R, P.verdict(R));
  if (jk !== "ok" || !verdict) {
    log(ts(), `[judge-fail/${jk}] R=${R} 重試評審一次`);
    ({ r: jr, k: jk, usedModel: judgeUsed } = spawnWithFallback("judge", judgeArgs, JUDGE_TIMEOUT, judgeUsed, judgeUsed === JUDGE_MODEL ? K3_FALLBACK : null, log, spawn));
    verdict = readVerdict(R, P.verdict(R));
    if (!verdict) {
      log(ts(), `[judge-void] R=${R} 評審未產出判決,採計通過並前進(避免死鎖)`);
      return { kind: "fail-accept" };
    }
  }
  log(ts(), `[judge-done] R=${R} pass=${verdict.pass} (model=${judgeUsed})`);
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
  // Q: 每次推進時更新品質儀表板
  updateDashboard(deps);
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

// ---------- 品質儀表板(Q:跨輪次趨勢追蹤) ----------
function updateDashboard(deps = {}) {
  const readFile = deps.readFile || fs.readFileSync;
  const writeFile = deps.writeFile || fs.writeFileSync;
  try {
    const t = readFile(LOG, "utf8");
    // 統計最近 20 輪的評審分數、修正輪比例、各軌道完成數
    const rounds = [];
    const re = /### \[(v\d+(?:-fix\d+)?)\] 軌道:【(.+?)】\(全局輪次 (\d+)/g;
    let m;
    while ((m = re.exec(t)) !== null) {
      rounds.push({ tag: m[1], track: m[2], round: +m[3] });
    }
    const recent = rounds.slice(0, 20);
    if (recent.length === 0) return;

    // 各軌道完成數
    const trackCounts = {};
    for (const r of recent) {
      trackCounts[r.track] = (trackCounts[r.track] || 0) + 1;
    }

    // 修正輪比例(含 -fix 的標籤)
    const fixRounds = recent.filter(r => r.tag.includes("-fix")).length;
    const fixRate = Math.round((fixRounds / recent.length) * 100);

    // 最近 5 輪摘要
    const last5 = recent.slice(0, 5).map(r => `${r.tag} ${r.track}`).join(" / ");

    // 品質儀表板區段
    const dashboard =
      "\n## 品質儀表板(自動更新)\n" +
      `- 最近 ${recent.length} 輪統計:\n` +
      `- 修正輪比例: ${fixRate}% (${fixRounds}/${recent.length})\n` +
      `- 各軌道完成: ${Object.entries(trackCounts).map(([k, v]) => `${k}:${v}`).join(" / ")}\n` +
      `- 最近 5 輪: ${last5}\n` +
      `- 更新時間: ${new Date().toISOString()}\n`;

    // 替換或追加儀表板區段
    const dashRe = /## 品質儀表板\(自動更新\)[\s\S]*?(?=\n## |\n---|\n### |$)/;
    if (dashRe.test(t)) {
      writeFile(LOG, t.replace(dashRe, dashboard.trim()), "utf8");
    } else {
      // 在 RECORD_HEAD 之前插入
      const idx = t.indexOf(RECORD_HEAD);
      if (idx >= 0) {
        writeFile(LOG, t.slice(0, idx) + dashboard + "\n" + t.slice(idx), "utf8");
      }
    }
  } catch (e) { console.log(new Date().toISOString(), "[warn] updateDashboard:", e.message); }
}

// ---------- dry-run(只用於預覽,不改任何檔案) ----------
function dryRun(offset = 0) {
  const st = readState();
  const R = st.round + offset;
  const tr = trackOf(R);
  console.log("── dry-run(僅預覽,不寫檔/不 spawn) ──");
  console.log("狀態行讀到: 循環=" + st.cycle + " 輪次=" + st.round);
  console.log("將執行: 全局輪次 " + R + " 循環 " + cycleOf(R));
  console.log("軌道: " + tr.id + " — " + tr.name);
  console.log("[1/4] 取證(flash): omp.cmd launch -p @" + DIAG_PROMPT + " @theme.txt" + (DIAG_MODEL ? " --model " + DIAG_MODEL : "") + " → progress/round-" + R + "-evidence.md");
  console.log("[2/4] 規劃(K3):    omp.cmd launch -p @" + PLAN_PROMPT + " @theme.txt" + (PLAN_MODEL ? " --model " + PLAN_MODEL : "") + " → progress/round-" + R + "-plan.md");
  console.log("[3/4] 實作(flash): omp.cmd launch -p @" + tr.prompt + " @theme.txt @progress/round-" + R + "-plan.md" + (EXEC_MODEL ? " --model " + EXEC_MODEL : "") + "(+(修正輪) @round-" + R + "-feedback.md)");
  console.log("[4/4] 評審(K3):    omp.cmd launch -p @" + JUDGE_PROMPT + " @theme.txt" + (JUDGE_MODEL ? " --model " + JUDGE_MODEL : "") + " → progress/goal-judge-" + R + ".md");
  console.log("修正輪上限: " + MAX_JUDGE_RETRY + " 回;合格才推進狀態行");
  console.log("theme.txt 內容:\n" + themeText(R));
}

// ---------- 主迴圈 ----------
async function main() {
  if (process.argv.includes("--dry")) { dryRun(0); return; }
  if (process.argv.includes("--dry-next")) { dryRun(1); return; }
  const log = (...a) => console.log(new Date().toISOString(), ...a);
  console.log(new Date().toISOString(), "trigger started, cycle", CYCLE_MS / 1000 + "s, tracks:", TRACKS.map(t => t.name).join(" → "));
  console.log(new Date().toISOString(), `model role: diag=${DIAG_MODEL}(flash) plan=${PLAN_MODEL}(K3) exec=${EXEC_MODEL}(flash) judge=${JUDGE_MODEL}(K3), judge retry ×${MAX_JUDGE_RETRY}`);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let lastRound = -1, judgeAttempts = 0, quotaStreak = 0, hardStreak = 0, lastQuotaAt = 0;

  // ── signal handler:清理 lock 後退出(防止 terminal 關閉/SIGTERM 時 lock 洩漏) ──
  let shuttingDown = false;
  const cleanup = (sig) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log("[signal] " + sig + ", 清理 lock 並退出");
    try { fs.unlinkSync(LOCK); } catch {}
    process.exit(0);
  };
  process.on("SIGINT", () => cleanup("SIGINT"));
  process.on("SIGTERM", () => cleanup("SIGTERM"));
  process.on("exit", () => { try { fs.unlinkSync(LOCK); } catch {} });
  // 防止未捕獲例外殺死行程(記錄後繼續)
  process.on("uncaughtException", (err) => {
    log("[uncaughtException] 非致命,繼續:", (err && err.stack || err).toString().slice(0, 400).replace(/\n/g, " "));
    try { fs.unlinkSync(LOCK); } catch {}
  });
  process.on("unhandledRejection", (err) => {
    log("[unhandledRejection] 非致命,繼續:", (err && err.stack || err).toString().slice(0, 400).replace(/\n/g, " "));
    try { fs.unlinkSync(LOCK); } catch {}
  });

  while (true) {
    try {
    const lk = lockInfo();
    if (lk) {
      // PID 死了 → 立即接管(不管 age); PID 活著 → 等
      if (!lk.alive) {
        log("[dead-lock] pid=" + lk.pid + " 已死, age=" + Math.round(lk.age / 60000) + "m, 接管");
        try { fs.unlinkSync(LOCK); } catch {}
      } else if (lk.age > LOCK_STALE_MS) {
        log("[stale-lock] pid=" + lk.pid + " 仍活但 age=" + Math.round(lk.age / 60000) + "m > " + (LOCK_STALE_MS / 60000) + "m, 強制接管");
        try { fs.unlinkSync(LOCK); } catch {}
      } else {
        await sleep(CYCLE_MS);
        continue;
      }
    }
    // 額度冷卻:quota case 已 sleep COOLDOWN_MS;此處防禦重啟後的殘留 streak
    if (quotaStreak >= 3 && COOLDOWN_MS > 0) {
      const wait = COOLDOWN_MS - (Date.now() - lastQuotaAt);
      if (wait > 0) {
        log(`[cooldown-resume] 冷卻中,剩餘 ${Math.round(wait / 60000)} 分鐘`);
        await sleep(Math.min(wait, 60000));
        continue;
      }
      quotaStreak = 0;
    }
    const st = readState();
    const R = st.round;
    if (R !== lastRound) { lastRound = R; judgeAttempts = 0; }

    fs.writeFileSync(LOCK, new Date().toISOString() + " trigger pid=" + process.pid + " globalRound=" + R);
    let out;
    try {
      out = runRoundOnce(R);
    } catch (e) {
      // 韌性:輪內例外絕不讓 lock 洩漏造成 150 分鐘死鎖 — 記 log 後按 hard 重試同輪
      log("[round-crash]", R, (e && e.stack || e).toString().slice(0, 800).replace(/\n/g, " "));
      out = { kind: "hard" };
    } finally {
      try { fs.unlinkSync(LOCK); } catch {}
    }

    switch (out.kind) {
      case "quota": // 額度失敗:不因「實作寫壞」而誤判 → 只有真正額度特徵才進這
        quotaStreak++; hardStreak = 0; lastQuotaAt = Date.now();
        log(`[quota] streak=${quotaStreak} → 冷卻 ${Math.round(COOLDOWN_MS / 60000)} 分鐘後重試 R=${R}`);
        if (COOLDOWN_MS > 0) await sleep(COOLDOWN_MS);
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
    } catch (loopErr) {
      // 最外層防護:任何未捕獲的例外都不讓主迴圈退出(清理 lock 後繼續)
      try { fs.unlinkSync(LOCK); } catch {}
      log("[loop-crash] 未捕獲例外,30 秒後繼續:", (loopErr && loopErr.stack || loopErr).toString().slice(0, 600).replace(/\n/g, " "));
    }
    await sleep(CYCLE_MS);
  }
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}

module.exports = {
  TRACKS, N, DIAG_MODEL, PLAN_MODEL, EXEC_MODEL, JUDGE_MODEL, DIAG_PROMPT, PLAN_PROMPT, JUDGE_PROMPT,
  MAX_JUDGE_RETRY, MAX_HARD_FAILS, QUOTA_RE,
  readState, writeState, themeText, themeDisplay, trackOf, cycleOf, peekNextVN,
  classify, readVerdict, writeFeedback, runRoundOnce, advance, writeSkipMarker, dryRun, updateDashboard,
  EVIDENCE, PLAN, VERDICT, FEEDBACK
};
