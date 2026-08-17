// v574 驗證 A:縮放真實放大 + 名牌對齊 + 各縮放重疊量測
const { chromium } = require('C:/Users/ray/AppData/Roaming/npm/node_modules/playwright');
const fs = require('fs');
const PORT = process.argv[2] || 8123;

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.MG && MG.game.state && MG.ui.map, null, { timeout: 20000 });
  await page.evaluate(() => {
    MG.core.save.save = () => {};
    const st = MG.game.state;
    st.stats.maxRegionReached = 9;
    st.stats.maxStageByRegion = {};
    for (let i = 0; i < 10; i++) st.stats.maxStageByRegion[i] = 10;
    st.kingdom.level = 20; st.hunt.region = 2;
    st.worldboss = { attacks: 1, killed: false };
    st.events = { pts: 100, current: true, milestones: {} };
    st.wanderers = st.wanderers || [];
    if (!st.wanderers.some(w => w.state === 'exped')) st.wanderers.push({ id: 'dx', name: '測試', state: 'exped', dead: false, expUntil: Date.now() + 3600000, expReward: { gold: 1 } });
    return true;
  });
  await page.evaluate(() => { if (MG.ui.tutorial) MG.ui.tutorial.hide(); MG.ui.screens.show('map'); });
  await page.waitForTimeout(700);

  const zoomBtn = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => (b.title || '').includes('地圖縮放')); if (b) b.click(); return b ? b.textContent : null; });
  const canvasSig = (step) => page.evaluate((step) => {
    const cv = [...document.querySelectorAll('canvas')].find(c => c.width >= 200 && c.height >= 200);
    if (!cv) return 'NO-CANVAS';
    const ctx = cv.getContext('2d');
    const img = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let sig = cv.width + 'x' + cv.height + ':';
    for (let p = 0; p < img.length; p += 8192) sig += String(img[p] >> 4) + String(img[p + 1] >> 4);
    // 取每幀第一列像素作「世界內容簽名」: 第一列 = 世界頂端內容
    return sig;
  }, step);
  const sigs = {};
  sigs.z1 = await canvasSig(1);
  await zoomBtn(); await page.waitForTimeout(250);   // → 1.5
  sigs.z15 = await canvasSig(1.5);
  await zoomBtn(); await page.waitForTimeout(250);   // → 2
  sigs.z2 = await canvasSig(2);
  console.log('backing sizes:', sigs.z1.split(':')[0], sigs.z15.split(':')[0], sigs.z2.split(':')[0]);
  console.log('z1==z15 內容:', sigs.z1 === sigs.z15, '| z1==z2:', sigs.z1 === sigs.z2);

  // 名牌對齊: 讀 minimap 白框 → offX/offY → 名牌 placed vs natural 位移 (全名牌平均)
  const readOff = async () => {
    const st2 = await page.evaluate(() => {
      const mm = [...document.querySelectorAll('canvas')].find(c => c.width === 96);
      const d = mm.getContext('2d').getImageData(0, 0, 96, 60).data;
      // 白框: 找像素列最上方連續白 (minY 起 2px 內 >= 4 白)
      let minY = 99, minX = 99, maxX = 0;
      for (let y = 0; y < 60; y++) {
        let cnt = 0, firstX = 99, lastX = 0;
        for (let x = 0; x < 96; x++) {
          const p = (y * 96 + x) * 4;
          const isWhite = d[p] > 200 && d[p + 1] > 200 && d[p + 2] > 200;
          if (isWhite) { cnt++; if (x < firstX) firstX = x; if (x > lastX) lastX = x; }
        }
        if (cnt > 2 && y < minY) { minY = y; minYcnt = cnt; }
        if (cnt >= 30) { // 白框的水平邊
          if (y < minY) { minY = y; }
        }
      }
      return { n: 1 };
    });
    // 簡化: 用所有名牌的自然對齊誤差來驗證 — 名牌 left 應 = (anchor.x - offX)*kx; 無法知 offX → 改驗「名牌自身間距」
    return null;
  };

  // 名牌對齊驗證: 在地標密集的東南區, 名牌中心應與地標圖示 (canvas 白/金像素) 對齊 —
  // 改由名牌 rect 推算: 名牌元素 left/top = placed CSS; 地標世界座標已知 × kx ⇒ 需要 offX。
  // 直接利用「名牌 textContent 對應名稱」+「名牌寬度中心」; offX 可從「任一名牌的 horizontal clamp 未觸發」時反推:
  // placed_left = (anchor - offX)*kx ⇔ offX = anchor - placed_left/kx — 名牌大多未被水平推 (dx=0), 取眾數
  const kxNow = await page.evaluate(() => {
    const cw = document.querySelector('.map-label').parentElement.clientWidth;
    // VW 由 canvas backing / dpr 推: backing width = VW * min(1.5, dpr); headless dpr=1
    const cv = [...document.querySelectorAll('canvas')].find(c => c.width >= 200);
    return { cw, VW: cv.width, ch: cv.clientHeight };
  });
  console.log('wrap cw:', kxNow.cw, 'canvas backing:', kxNow.VW, '→ CSS 每世界 px =', (kxNow.cw / kxNow.VW).toFixed(3));

  // 掃描全部縮放層級: 每級拖曳瀏覽 4 個方向 + 量測重疊
  const measure = () => page.evaluate(() => {
    const els = [...document.querySelectorAll('.map-label')];
    const rs = els.map(el => { const r = el.getBoundingClientRect(); return { txt: el.textContent.trim(), l: r.left, t: r.top, r_: r.right, b: r.bottom, fs: getComputedStyle(el).fontSize }; });
    let oc = 0; const pairs = [];
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], b = rs[j];
      const ox = Math.min(a.r_, b.r_) - Math.max(a.l, b.l);
      const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (ox > 0.5 && oy > 0.5) { oc++; pairs.push([a.txt.slice(0, 8), b.txt.slice(0, 8), Math.round(ox) + 'x' + Math.round(oy)]); }
    }
    return { oc, pairs, shrunk: rs.filter(r => r.fs === '10px').map(r => r.txt.slice(0, 10)) };
  });

  const wrap = await page.evaluate(() => {
    const cv = [...document.querySelectorAll('canvas')].find(c => c.width >= 200);
    const r = cv.parentElement.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  // zoom 2 下拖曳到東南模式群並量測
  const drag = async (dx, dy) => {
    await page.mouse.move(wrap.x + 180, wrap.y + 200);
    await page.mouse.down();
    await page.mouse.move(wrap.x + 180 + dx, wrap.y + 200 + dy, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(180);
  };
  // zoom 2
  const m2 = [];
  for (const [dx, dy] of [[300, 60], [500, 160], [-150, 40], [60, 320]]) {
    await drag(dx, dy);
    m2.push(await measure());
  }
  console.log('\n== zoom2 拖曳 4 向 名牌重疊 ==');
  m2.forEach((m, i) => console.log(i, JSON.stringify({ oc: m.oc, pairs: m.pairs, shrunk: m.shrunk })));
  await page.screenshot({ path: 'progress/v574-zoom2-se.png' });

  // 回 zoom1 掃
  await zoomBtn(); await page.waitForTimeout(200);  // 2 → 1
  const m1 = [];
  for (const [dx, dy] of [[60, 20], [300, 80], [-200, -80], [80, 300]]) {
    await drag(dx, dy);
    m1.push(await measure());
  }
  console.log('\n== zoom1 拖曳 4 向 名牌重疊 ==');
  m1.forEach((m, i) => console.log(i, JSON.stringify({ oc: m.oc, pairs: m.pairs, shrunk: m.shrunk })));

  // zoom1.5
  await zoomBtn(); await page.waitForTimeout(200);  // 1 → 1.5
  const m15 = [];
  for (const [dx, dy] of [[150, 60], [400, 120], [-100, -60], [100, 260]]) {
    await drag(dx, dy);
    m15.push(await measure());
  }
  console.log('\n== zoom1.5 拖曳 4 向 名牌重疊 ==');
  m15.forEach((m, i) => console.log(i, JSON.stringify({ oc: m.oc, pairs: m.pairs, shrunk: m.shrunk })));
  await page.screenshot({ path: 'progress/v574-zoom15-se.png' });

  console.log('\nerrs:', errs.length ? errs.slice(0, 10) : 'ZERO');
  await browser.close();
})();