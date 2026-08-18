// ⚠️ 非生產工具(archive) — 不得作為品質迴圈的視覺判讀依據!
// 品質迴圈(prompts/*)的視覺閘門一律走 harness 影像工具(inspect_image → vision 角色 = K3 級);
// 本檔為本地 Ollama qwen2.5vl 7B 開發期粗判工具,能力非 K3 級,孤兒未接線,僅供手動實驗。
// 用法: node vision-review.mjs <image.png> [model]
import fs from 'node:fs';

const IMG = process.argv[2];
const MODEL = process.argv[3] || 'qwen2.5vl:7b';
if (!IMG) { console.log('usage: node vision-review.mjs <image.png> [model]'); process.exit(1); }

const b64 = fs.readFileSync(IMG).toString('base64');
const QUESTION = `這是遊戲美術管線生成的候選素材圖。請用最簡短的方式回答以下四項（每項一行，格式：項目: 是/否/描述）：
1. 主體是否像一個完整的遊戲角色/物品（有清楚輪廓，不是雜訊或亂畫）？
2. 是否有明顯的黑色描邊（像素畫風格）？
3. 背景是否乾淨（無多餘雜物、文字、浮水印）？
4. 整體顏色是否簡潔（不超過約 8-10 種明顯色）？
最後一行給出總評：可用/勉強/不可用（一句話理由）`;

const t0 = Date.now();
const r = await fetch('http://127.0.0.1:11434/api/chat', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: QUESTION, images: [b64] }], stream: false })
});
const j = await r.json();
console.log('[' + Math.round((Date.now() - t0) / 1000) + 's] ' + IMG);
console.log(j.message ? j.message.content : JSON.stringify(j).slice(0, 200));
