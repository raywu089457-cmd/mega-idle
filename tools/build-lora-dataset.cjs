// 方案 4（備用）：從遊戲自家美術提取 LoRA 訓練集
// 每個 sprite 渲染 4x PNG（幀 0）＋文字描述，輸出到 dev/lora-dataset/{domain}/{name}.png + .txt
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = 'C:/Users/ray/Desktop/Claude code/mega-idle/dev/lora-dataset';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 640 } });
  await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const skip = page.locator('text=略過');
  if (await skip.count()) await skip.click();
  await page.waitForTimeout(400);

  const result = await page.evaluate(async () => {
    const art = window.MG.art || {};
    const sprites = MG.data.sprites;
    const out = [];
    for (const domain of Object.keys(art)) {
      for (const name of Object.keys(art[domain])) {
        let s;
        try { s = sprites.get(name); } catch (e) { continue; }
        if (!s || !s.frames || !s.frames.length) continue;
        const rows = s.frames[0];
        const h = rows.length, w = rows[0].length;
        if (w > 64 || h > 64) continue;              // 只取小 sprite（16-48px）
        const scale = Math.max(2, Math.floor(64 / Math.max(w, h)));
        const c = document.createElement('canvas');
        c.width = w * scale; c.height = h * scale;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const ch = rows[y][x];
          if (ch === '.') continue;
          const col = s.pal[ch];
          g.fillStyle = col;
          g.fillRect(x * scale, y * scale, scale, scale);
        }
        out.push({ domain, name, w, h, dataUrl: c.toDataURL('image/png') });
      }
    }
    return out;
  });

  let n = 0;
  for (const it of result) {
    const dir = path.join(OUT, it.domain);
    fs.mkdirSync(dir, { recursive: true });
    const b64 = it.dataUrl.split(',')[1];
    fs.writeFileSync(path.join(dir, it.name + '.png'), Buffer.from(b64, 'base64'));
    // 描述：由 sprite 名稱生成（kohya 訓練用）
    const label = it.name.replace(/^(m_|b_|h_|icon_|fx_)/, '').replace(/_/g, ' ');
    const caption = `pixel art sprite of ${label}, ${it.domain} style, 16-bit retro game asset, black outline, limited palette, front view`;
    fs.writeFileSync(path.join(dir, it.name + '.txt'), caption);
    n++;
  }
  console.log('exported', n, 'sprites to', OUT);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
