// mega-idle 品質多軌自動迴圈觸發器 — 每 30 秒檢查,空閒時啟動一輪 omp -p
// 軌道輪換: progress/improvement-log.md 狀態行(循環/輪次/當前主題)決定本輪軌道
//   5 條軌道依序:數值平衡 → 村莊與王國美術 → 戰鬥畫面美術 → QoL 與 UX → TheoTown 世界地圖
//   每輪 prompt 檔在 prompts/goal-<track>.md;TheoTown 軌內部另有 5 子主題輪換
// 防重疊:  progress/goal-loop.lock(存在且新鮮 = busy,跳過;過舊 = 死鎖,接管)
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const LOG = path.join(ROOT, "progress", "improvement-log.md");
const LOCK = path.join(ROOT, "progress", "goal-loop.lock");
const THEME_FILE = path.join(ROOT, "theme.txt");

// ---- 5 條品質軌道(全域輪換)。改動順序/增刪軌道只改這裡 ----
const TRACKS = [
  { id: "balance",     name: "遊戲數值平衡",       prompt: "prompts/goal-balance.md" },
  { id: "village-art", name: "村莊與王國美術優化", prompt: "prompts/goal-village-art.md" },
  { id: "battle-art",  name: "戰鬥畫面美術優化",   prompt: "prompts/goal-battle-art.md" },
  { id: "qol",         name: "QoL 與 UX",          prompt: "prompts/goal-qol.md" },
  { id: "theotown",    name: "TheoTown 世界地圖",  prompt: "prompts/goal-theotown.md" }
];
// TheoTown 軌內部的 5 子主題(自訂順序,art-rules 只涵蓋地圖美術)
const THEOTOWN_SUBS = [
  "TheoTown 建築與地標",
  "TheoTown 村莊生活感與街道",
  "TheoTown 地形・道路與環境",
  "TheoTown 海洋・氛圍與動態",
  "TheoTown 技術對齊與稽核"
];
const LOCK_STALE_MS = 90 * 60 * 1000; // 一輪超過 90 分鐘視為死鎖
const CYCLE_MS = 30000;

// ---- K3 額度 fallback 鏈:第一級用 bat 的 PI_MODEL(kimi-k3),失敗降級 opencode-go ----
const MODEL_CHAIN = [null, "opencode-go"];
let modelIdx = 0;          // 目前模型級別
let failStreak = 0;        // 連續失敗次數
const RETRY_MS = 5 * 60 * 1000;      // 失敗後等 5 分鐘重試(限流可能恢復)
const COOLDOWN_MS = 60 * 60 * 1000;  // 連續 3 次失敗 → 冷卻 60 分鐘
const QUOTA_RE = /(429|quota|rate.?limit|insufficient|額度|限流|too many)/i;

function isQuotaFailure(r) {
  const out = ((r.stdout || "") + (r.stderr || "")).slice(-4000);
  return r.status !== 0 || QUOTA_RE.test(out);
}

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

// ---- 軌道排程:全域輪次 R → 軌道(TRACKS[R % N]);TheoTown 軌內部子主題逐次遞進 ----
const N = TRACKS.length;
const mod5 = x => ((x % 5) + 5) % 5;               // N=5 正模
const trackOf = R => TRACKS[mod5(R)];
const cycleOf = R => Math.floor(R / N) + 1;
// TheoTown 子主題:上次消耗於舊制 R=4(子主題 4),故從 R=9 起接續子主題 0 循環
const theotownSubIndex = R => mod5(Math.floor(R / N) - 1);
// 本輪任務文案(寫入 theme.txt,agent 必讀)
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

function runRound() {
  const st = readState();
  const R = st.round;
  const tr = trackOf(R);
  const cycle = cycleOf(R);
  const next = trackOf(R + 1);
  const themeTag = tr.id === "theotown" ? `【TheoTown 世界地圖】` : `【${tr.name}】`;
  writeState({ cycle, round: R, theme: themeTag + (tr.id === "theotown" ? `(${THEOTOWN_SUBS[theotownSubIndex(R)]})` : ""), next: next.name });
  fs.writeFileSync(THEME_FILE, themeText(R));
  const model = MODEL_CHAIN[modelIdx];
  const args = ["launch", "-p", "@" + tr.prompt, "@theme.txt"];
  if (model) args.push("--model", model);
  console.log(new Date().toISOString(), `[start] ${tr.name} (cycle ${cycle}, global round ${R})` +
    (model ? ` [降級模型: ${model}]` : " [主模型 kimi-k3]"));
  let r = null;
  try {
    r = spawnSync("omp.cmd", args,
      { cwd: ROOT, encoding: "utf8", timeout: 120 * 60 * 1000, shell: true, maxBuffer: 16 * 1024 * 1024 });
  } catch (e) {
    console.log(new Date().toISOString(), "[error]", e.message);
  }
  if (!r) { failStreak++; console.log(new Date().toISOString(), "[fail] spawn 異常"); }
  else if (isQuotaFailure(r)) {
    failStreak++;
    console.log(new Date().toISOString(), `[fail] exit=${r.status} 額度/錯誤特徵, failStreak=${failStreak}, 當前模型級=${modelIdx}`);
    if (modelIdx < MODEL_CHAIN.length - 1) { modelIdx++; failStreak = 0; console.log(new Date().toISOString(), `[fallback] 降級至 ${MODEL_CHAIN[modelIdx]}`); }
    else console.log(new Date().toISOString(), `[fallback] 已到最低級,冷卻 ${COOLDOWN_MS / 60000} 分鐘後重試`);
  } else {
    failStreak = 0;
    if (modelIdx > 0) { modelIdx = 0; console.log(new Date().toISOString(), "[recover] 恢復主模型 kimi-k3"); }
    console.log(new Date().toISOString(), `[done] exit=${r.status} ${(r.stdout || "").slice(-300).replace(/\n/g, " ")}`);
  }
  try { fs.unlinkSync(LOCK); } catch {} // 即使失敗也釋放 lock,下輪重試
}

// ---- dry-run:列印「將執行的一輪」的 theme.txt 與 launch args,不改任何檔案 ----
// 狀態行輪次 = 將執行的一輪(agent 完成後才 +1),故預覽 R = st.round;
// --dry 預覽本輪, --dry-next 預覽下一輪
function dryRun(offset = 0) {
  const st = readState();
  const R = st.round + offset;
  const tr = trackOf(R);
  console.log("── dry-run(僅預覽,不寫檔/不 spawn) ──");
  console.log("狀態行讀到: 循環=" + st.cycle + " 輪次=" + st.round);
  console.log("將執行: 全局輪次 " + R + " 循環 " + cycleOf(R));
  console.log("軌道: " + tr.id + " — " + tr.name);
  if (tr.id === "theotown") console.log("  子主題(" + theotownSubIndex(R) + "): " + THEOTOWN_SUBS[theotownSubIndex(R)]);
  console.log("prompt 檔: " + tr.prompt);
  const args = ["launch", "-p", "@" + tr.prompt, "@theme.txt"];
  if (modelIdx > 0) args.push("--model", MODEL_CHAIN[modelIdx]);
  console.log("launch args: omp.cmd " + args.join(" "));
  console.log("theme.txt 內容:\n" + themeText(R));
}

(async () => {
  if (process.argv.includes("--dry-next")) { dryRun(1); return; }
  if (process.argv.includes("--dry")) { dryRun(0); return; }
  console.log(new Date().toISOString(), "trigger started, cycle", CYCLE_MS / 1000 + "s, tracks:", TRACKS.map(t => t.name).join(" → "));
  console.log(new Date().toISOString(), "model fallback chain:", (MODEL_CHAIN.map((m, i) => i + ":" + (m || "kimi-k3(env)"))).join(" → "));
  let lastFailAt = 0;
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
    // 失敗冷卻:連續失敗 ≥3 次 → 等 COOLDOWN_MS 再試(避免空轉燒 API)
    if (failStreak >= 3) {
      const wait = COOLDOWN_MS - (Date.now() - lastFailAt);
      if (wait > 0) {
        console.log(new Date().toISOString(), `[cooldown] failStreak=${failStreak}, 等待 ${Math.round(wait / 60000)} 分鐘`);
        await new Promise(r => setTimeout(r, Math.min(wait, CYCLE_MS * 2)));
        continue;
      }
      failStreak = 0;
      modelIdx = 0; // 冷卻結束恢復主模型
    }
    fs.writeFileSync(LOCK, new Date().toISOString() + " trigger pid=" + process.pid);
    runRound();
    lastFailAt = Date.now();
    await new Promise(r => setTimeout(r, CYCLE_MS));
  }
})().catch(e => { console.error(e); process.exit(1); });
