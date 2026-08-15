// mega-idle 即時直播 — 追蹤輪換迴圈的 session 檔,把 JSONL 轉成人類可讀的活動流
// 用法: node watch-live.js [session檔路徑] (省略則自動找最新 mega-idle session)
const fs = require("fs");
const path = require("path");
const os = require("os");

const SESSIONS_DIR = path.join(os.homedir(), ".omp", "agent", "sessions");

function findSession() {
  let dirs = [];
  try { dirs = fs.readdirSync(SESSIONS_DIR); } catch { return null; }
  let newest = null, newestTime = 0;
  for (const d of dirs) {
    const full = path.join(SESSIONS_DIR, d);
    let files = [];
    try { files = fs.readdirSync(full); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith(".jsonl")) continue;
      const p = path.join(full, f);
      let st; try { st = fs.statSync(p); } catch { continue; }
      if (st.mtimeMs > newestTime) { newestTime = st.mtimeMs; newest = p; }
    }
  }
  return newest;
}

let file = process.argv[2] || findSession();
if (!file) { console.error("找不到 mega-idle session 檔(輪換迴圈尚未產生 session?)"); process.exit(1); }
console.log("追蹤: " + file + "\n" + "─".repeat(60));

function parseLine(ln) {
  let o; try { o = JSON.parse(ln); } catch { return null; }
  const ts = (o.timestamp || "").slice(11, 19);
  const m = o.message;
  if (!m || !m.content) return null;
  const out = [];
  if (typeof m.content === "string") {
    if (m.content.trim()) out.push(["訊息", m.content.trim().slice(0, 400)]);
  } else if (Array.isArray(m.content)) {
    for (const b of m.content) {
      if (!b || typeof b !== "object") continue;
      const t = b.type;
      if (t === "thinking") out.push(["思考", String(b.thinking || "").slice(0, 400)]);
      else if (t === "text") out.push(["agent", String(b.text || "").slice(0, 400)]);
      else if (t === "toolCall") {
        const name = b.name || b.toolName || "?";
        const args = b.arguments || b.input || {};
        out.push(["工具", `${name} ${JSON.stringify(args).slice(0, 250)}`]);
      }
      else if (t === "toolResult") out.push(["結果", String(b.result || b.error || "").slice(0, 400)]);
    }
  }
  return out.length ? { ts, out } : null;
}

function fmt(kind, text) {
  const tag = { 思考: "[思考]", agent: "[agent]", 工具: "[工具]", 結果: "[結果]", 訊息: "[訊息]" }[kind] || "[?]";
  return `${tag} ${text}`;
}

let pos = 0;
try { pos = fs.statSync(file).size; } catch (e) { console.error("讀檔失敗:", e.message); process.exit(1); }

// 初始:印最後 20 行(不含空行)
try {
  const data = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  for (const ln of data.slice(-20)) {
    const p = parseLine(ln);
    if (p) for (const [k, v] of p.out) console.log(fmt(k, v));
  }
} catch {}

// 每 1.5 秒增量讀取新行
setInterval(() => {
  let st; try { st = fs.statSync(file); } catch { console.error("\n檔案消失,agent 可能重啟中(新 session 產生後重跑 watch-live.js)"); process.exit(1); }
  if (st.size < pos) pos = 0;
  if (st.size === pos) return;
  let buf;
  try {
    const fd = fs.openSync(file, "r");
    buf = Buffer.alloc(st.size - pos);
    fs.readSync(fd, buf, 0, buf.length, pos);
    fs.closeSync(fd);
  } catch { return; }
  pos = st.size;
  for (const ln of buf.toString("utf8").split("\n")) {
    if (!ln.trim()) continue;
    const p = parseLine(ln);
    if (p) for (const [k, v] of p.out) console.log(fmt(k, v));
  }
}, 1500);
