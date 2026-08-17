// v574 診斷 4: (1) zoom no-op 像素驗證 (2) 名牌漂移精確量測 (minimap 白框讀取 offX/offY)
const { chromium } = require('C:/Users/ray/AppData/Roaming/npm/node_modules/playwright');
const fs = require('fs');
const PORT = process.argv[2] || 8123;

const isoX = (c, r) => 464 + (c - r) * 16, isoY = (c, r) => 8 + (c + r) * 8;

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(e.message));
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
    return true;
  });
  await page.evaluate(() => MG.ui.screens.show('map'));
  await page.waitForTimeout(700);

  // 拖到中心 (真實拖曳)
  const wrap = await page.evaluate(() => {
    const cv = [...document.querySelectorAll('canvas')].find(cv => cv.width === 460);
    const r = cv.parentElement.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  const doPan = async (dx, dy) => {
    await page.mouse.move(wrap.x + 200, wrap.y + 200);
    await page.mouse.down();
    await page.mouse.move(wrap.x + 200 + dx, wrap.y + 200 + dy, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(150);
  };
  await doPan(140, 90);   // 往右下滑 → 看東南模式群
  const dbg = await page.evaluate(() => ({
    active: document.querySelector('.screen.active') ? (document.querySelector('.screen.active').id || '?') : null,
    canvases: [...document.querySelectorAll('canvas')].map(c => c.width + 'x' + c.height),
    labels: [...document.querySelectorAll('.map-label')].length
  }));
  console.log('state:', JSON.stringify(dbg));

  // (1) zoom 實驗: 同視角 zoom1 vs zoom2 畫布像素 buffer 比較
  const canvasSig = () => page.evaluate(() => {
    const cv = [...document.querySelectorAll('canvas')].find(c => c.width >= 400);
    if (!cv) return 'NO-CANVAS';
    const ctx = cv.getContext('2d');
    const img = ctx.getImageData(0, 0, cv.width, cv.height);
        // 每 4096 byte 採樣壓縮簽名
    let sig = '';
    for (let p = 0; p < img.data.length; p += 4096) sig += String(img.data[p] >> 4);
    return sig;
  });
  const z1 = await canvasSig();
  const zoomBtn = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => (b.title || '').includes('地圖縮放')); if (b) b.click(); return !!b; });
  await zoomBtn();
  await page.waitForTimeout(250);
  const z2 = await canvasSig();
  let same = z1 === z2;
  let zoomState = await page.evaluate(() => [...document.querySelectorAll('button')].find(b => (b.title || '').includes('地圖縮放')).title);
  console.log('== zoom1 vs zoom2 canvas 簽名 identical:', same, '(zoom 鈕 title:', zoomState + ')');
  console.log('   z1 len:', z1.length, 'z2 len:', z2.length);
  // 名牌位置在 zoom2 是否移動?
  const lz1 = await page.evaluate(() => [...document.querySelectorAll('.map-label')].map(el => [el.textContent.trim().slice(0, 6), el.style.left, el.style.top]));
  await zoomBtn();  // 1.5 → 回 1
  await page.waitForTimeout(250);
  const lz0 = await page.evaluate(() => [...document.querySelectorAll('.map-label')].map(el => [el.textContent.trim().slice(0, 6), el.style.left, el.style.top]));
  console.log('== zoom2 名牌 left/top =='); console.log(lz1.map(r => r.join(' | ')).join('\n'));
  console.log('== zoom1 名牌 left/top =='); console.log(lz0.map(r => r.join(' | ')).join('\n'));
  await zoomBtn(); // 1 → 1.5
  await page.waitForTimeout(200);
  await zoomBtn(); // 1.5 → 2
  await page.waitForTimeout(200);
  const z2b = await canvasSig();
  console.log('== zoom2 (再點兩次) identical to zoom1:', Buffer.from(z1).equals(Buffer.from(z2b)));
  // 回 zoom1
  await zoomBtn(); await page.waitForTimeout(200);
  await zoomBtn(); await page.waitForTimeout(200);

  // (2) 漂移精確量測: 讀 minimap 白框矩形 → offX/offY
  const readMM = await page.evaluate(() => {
    const mm = [...document.querySelectorAll('canvas')].find(c => c.width === 96);
    const ctx = mm.getContext('2d');
    const img = ctx.getImageData(0, 0, 96, 60).data;
    let minX = 99, minY = 99, maxX = 0, maxY = 0, cnt = 0;
    for (let y = 0; y < 60; y++) for (let x = 0; x < 96; x++) {
      const p = (y * 96 + x) * 4;
      // 白框 (255,255,255) 或接近
      if (img[p] > 200 && img[p + 1] > 200 && img[p + 2] > 200) {
        cnt++;
        if (x < minX) minX = x; if (y < minY) minY = y;
        if (x > maxX) maxX = x; if (y > maxY) maxY = y;
      }
    }
    return { minX, minY, maxX, maxY, cnt };
  });
  // 白框含 0.5px 偏移: vx = offX*kx + 0.5 ⇒ offX = (minX - 0.5 + ... ) 用 minX 解
  const kx = 96 / 1216, ky = 60 / 608;
  const offX = (readMM.minX - 0.5) / kx;
  const offY = (readMM.minY - 0.5) / ky;
  console.log('\n== minimap 白框 ==', JSON.stringify(readMM), '→ offX', Math.round(offX), 'offY', Math.round(offY));

  // 名牌漂移: placed - (anchor - off)
  const lbl = await page.evaluate(() => [...document.querySelectorAll('.map-label')].map(el => ({ txt: el.textContent.trim(), left: parseFloat(el.style.left), top: parseFloat(el.style.top) })));
  const A = [{ n: '村莊', x: isoX(8.5, 20.5), y: isoY(8.5, 13), below: false }];
  const C = [[19, 20.5], [14, 13.5], [17.5, 11.5], [21.5, 8.5], [25.5, 5.5], [29.5, 4.5], [33.5, 5.5], [37.5, 4.5], [41, 3.5], [44, 2]];
  for (let i = 0; i < 10; i++) A.push({ n: '區' + i, x: isoX(C[i][0], C[i][1]), y: isoY(C[i][0], C[i][1]) - 52, below: false });
  const M = [[23, 16], [29, 17], [34, 21], [38, 26], [29, 26], [19, 27], [24, 22], [33, 25], [23, 26], [32, 19]];
  const MN = ['競技場', '王者競技場', '試煉秘境', '世界首領', '元素試煉塔', '奇境迷宮', '公會盛宴', '限時活動', '無盡深淵', '委託遠征營'];
  for (let i = 0; i < 10; i++) A.push({ n: MN[i], x: isoX(M[i][0], M[i][1]), y: isoY(M[i][0], M[i][1]) + (i % 2 ? 26 : -46), below: !!(i % 2) });
  const rows = [];
  for (let i = 0; i < A.length; i++) {
    const natX = A[i].x - offX, natY = A[i].y - offY;
    const dx = Math.round(lbl[i].left - natX), dy = Math.round(lbl[i].top - natY);
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) rows.push({ n: A[i].n, dx, dy });
  }
  console.log('== 名牌漂移 (px; dx 含水平夾緊) ==');
  console.log(JSON.stringify(rows, null, 1));
  await page.screenshot({ path: 'progress/v574-diag-drift.png' }).catch(() => {});
  console.log('errs:', errs.length ? errs.slice(0, 10) : 'ZERO');
  await browser.close();
})();