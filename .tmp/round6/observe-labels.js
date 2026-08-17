// 觀察地圖名牌:注入存檔 → 開地圖 → 回報名牌矩形/重疊
const seed = require('fs').readFileSync('.tmp/round6/seed-save.js', 'utf8');
await page.goto('http://127.0.0.1:8123/index.html?v=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.evaluate(seed);
await page.reload({ waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1200));
await page.evaluate(() => { if (MG.sys && MG.sys.save) MG.sys.save.save = () => {}; });
await page.evaluate(() => { MG.ui.screens.show('map'); });
await new Promise(r => setTimeout(r, 1200));
const report = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.map-label')];
  const rects = els.map(el => {
    const r = el.getBoundingClientRect();
    return { text: el.textContent.trim(), left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height), locked: el.classList.contains('locked') };
  });
  const overlaps = [];
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ox > 2 && oy > 2) overlaps.push({ a: a.text, b: b.text, ox, oy });
  }
  return { count: rects.length, rects, overlaps };
});
console.log(JSON.stringify(report, null, 1));
