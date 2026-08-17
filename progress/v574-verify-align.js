// v574 驗證 D:對齊 (median 反推 offX/offY) + 視口內互動 + 強制縮小降級 + 全階重疊
const { chromium } = require('C:/Users/ray/AppData/Roaming/npm/node_modules/playwright');
const PORT = process.argv[2] || 8123;
const isoX = (c, r) => 464 + (c - r) * 16, isoY = (c, r) => 8 + (c + r) * 8;

const ANCHORS = [];
(() => {
  ANCHORS.push({ n: '村莊', x: isoX(8.5, 20.5), y: isoY(8.5, 13), below: false });
  const C = [[19, 20.5], [14, 13.5], [17.5, 11.5], [21.5, 8.5], [25.5, 5.5], [29.5, 4.5], [33.5, 5.5], [37.5, 4.5], [41, 3.5], [44, 2]];
  for (let i = 0; i < 10; i++) ANCHORS.push({ n: '區' + i, x: isoX(C[i][0], C[i][1]), y: isoY(C[i][0], C[i][1]) - 52, below: false });
  const M = [[23, 16], [29, 17], [34, 21], [38, 26], [29, 26], [19, 27], [24, 22], [33, 25], [23, 26], [32, 19]];
  const MN = ['競技場', '王者競技場', '試煉秘境', '世界首領', '元素試煉塔', '奇境迷宮', '公會盛宴', '限時活動', '無盡深淵', '委託遠征營'];
  for (let i = 0; i < 10; i++) ANCHORS.push({ n: MN[i], x: isoX(M[i][0], M[i][1]), y: isoY(M[i][0], M[i][1]) + (i % 2 ? 26 : -46), below: !!(i % 2) });
})();

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
    if (MG.ui.tutorial) MG.ui.tutorial.hide();
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

  const zoomBtn = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => (b.title || '').includes('地圖縮放')); if (b) b.click(); });
  const jumpTo = async (wx, wy) => {
    const mm = await page.evaluate(() => { const c = [...document.querySelectorAll('canvas')].find(c => c.width === 96); const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await page.mouse.click(mm.x + (wx / 1216) * mm.w, mm.y + (wy / 608) * mm.h);
    await page.waitForTimeout(300);
  };
  const drag = async (dx, dy) => {
    const wrap = await page.evaluate(() => { const cv = [...document.querySelectorAll('canvas')].find(c => c.width <= 306); const r = cv.parentElement.getBoundingClientRect(); return { x: r.left, y: r.top }; });
    await page.mouse.move(wrap.x + 160, wrap.y + 200);
    await page.mouse.down();
    await page.mouse.move(wrap.x + 160 + dx, wrap.y + 200 + dy, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(200);
  };
  const snap = () => page.evaluate(() => ({
    labels: [...document.querySelectorAll('.map-label')].map(el => { const r = el.getBoundingClientRect(); return { txt: el.textContent.trim(), l: r.left, t: r.top, w: r.width, h: r.height, fs: getComputedStyle(el).fontSize }; }),
    wrap: (() => { const r = document.querySelector('.map-label').parentElement.parentElement.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()
  }));

  const analyze = (s, zoom, label='') => {
    const kx = s.wrap.w / (460 / zoom), ky = s.wrap.h / (500 / zoom);
    // 反推 offX/offY: 取未 clamp 未推的候選 (名牌中心 = (anchor - off)*k + w/2)
    const candX = [], candY = [];
    for (let i = 0; i < Math.min(s.labels.length, ANCHORS.length); i++) {
      const lb = s.labels[i], a = ANCHORS[i];
      candX.push(a.x - (lb.l - s.wrap.l + lb.w / 2) / kx);
      candY.push(a.y - (lb.t - s.wrap.t + lb.h / 2) / ky);
    }
    candX.sort((a, b) => a - b); candY.sort((a, b) => a - b);
    const offX = candX[Math.floor(candX.length / 2)], offY = candY[Math.floor(candY.length / 2)];
    const errsList = [];
    let maxErr = 0;
    for (let i = 0; i < ANCHORS.length; i++) {
      const lb = s.labels[i], a = ANCHORS[i];
      const expX = (a.x - offX) * kx, expY = (a.y - offY) * ky;
      const cx = lb.l - s.wrap.l + lb.w / 2, cy = lb.t - s.wrap.t + lb.h / 2;
      const ex = Math.abs(cx - expX), ey = Math.abs(cy - expY);
      // 名牌在視口內才看對齊 (clamp/推擠只影響視口外)
      const inView = lb.l >= s.wrap.l - 2 && lb.l + lb.w <= s.wrap.l + s.wrap.w + 2 && lb.t >= s.wrap.t - 2 && lb.t + lb.h <= s.wrap.t + s.wrap.h + 2;
      if (inView) { if (ex + ey > maxErr) maxErr = ex + ey; if (ex > 6 || ey > 6) errsList.push(`${a.n}:Δ${Math.round(ex)},${Math.round(ey)}`); }
    }
    // 重疊
    const overlaps = [];
    for (let i = 0; i < s.labels.length; i++) for (let j = i + 1; j < s.labels.length; j++) {
      const a = s.labels[i], b = s.labels[j];
      const inV = a.l >= s.wrap.l - 2 && a.l + a.w <= s.wrap.l + s.wrap.w + 2 && a.t >= s.wrap.t - 2 && a.t + a.h <= s.wrap.t + s.wrap.h + 2;
      const inV2 = b.l >= s.wrap.l - 2 && b.l + b.w <= s.wrap.l + s.wrap.w + 2 && b.t >= s.wrap.t - 2 && b.t + b.h <= s.wrap.t + s.wrap.h + 2;
      if (!inV || !inV2) continue;
      const ox = Math.min(a.l + a.w, b.l + b.w) - Math.max(a.l, b.l);
      const oy = Math.min(a.t + a.h, b.t + b.h) - Math.max(a.t, b.t);
      if (ox > 0.5 && oy > 0.5) overlaps.push(`${a.txt.slice(0, 7)}↔${b.txt.slice(0, 7)}${Math.round(ox)}x${Math.round(oy)}`);
    }
    console.log(`[${label}] zoom${zoom} off=(${Math.round(offX)},${Math.round(offY)}) 視口內名牌 ${s.labels.filter(l => l.l >= s.wrap.l - 2 && l.l + l.w <= s.wrap.l + s.wrap.w + 2 && l.t >= s.wrap.t - 2 && l.t + l.h <= s.wrap.t + s.wrap.h + 2).length} 對齊離群:${errsList.length ? JSON.stringify(errsList) : '0'} maxErr=${Math.round(maxErr)}px 重疊:${overlaps.length ? JSON.stringify(overlaps) : '0'}`);
    return { offX, offY };
  };

  // ===== zoom2: 東南群對齊 =====
  await zoomBtn(); await page.waitForTimeout(200);
  await zoomBtn(); await page.waitForTimeout(250);
  await jumpTo(120, 430);
  await drag(40, 30);
  analyze(await snap(), 2, '東南群');

  // 拖曳環繞整個東南 + 沿海
  for (const [dx, dy] of [[-60, -20], [80, -40], [-120, 60], [200, -20]]) {
    await drag(dx, dy);
    analyze(await snap(), 2, '週邊');
  }

  // ===== zoom1 全套視角 =====
  await zoomBtn(); await page.waitForTimeout(200);  // 2→1
  for (const [dx, dy] of [[0, 0], [-300, -150], [400, 200], [-100, -60], [600, 100], [-500, 300]]) {
    if (dx || dy) await drag(dx, dy);
    analyze(await snap(), 1, 'zoom1 全域');
  }

  // ===== 縮小降級強制觸發 (zoom2, 世界首領 pin 視口內撐寬) =====
  await zoomBtn(); await page.waitForTimeout(200);  // 1→1.5
  await zoomBtn(); await page.waitForTimeout(250);  // 1.5→2
  await jumpTo(120, 430);                            // 東南群
  await drag(30, 20);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.map-label')].find(e => e.textContent.includes('世界首領'));
    if (el) { el.style.fontSize = '26px'; el.style.padding = '6px 16px'; }
    return true;
  });
  await drag(8, 5);    // 觸發重排
  const s3 = await snap();
  const shrunk = s3.labels.filter(l => l.fs === '10px').map(l => l.txt.slice(0, 10));
  const pin = s3.labels.find(l => l.txt.includes('世界首領'));
  console.log('[縮小降級] shrunk:', JSON.stringify(shrunk), '| pin fontSize:', pin ? pin.fs : 'N/A', '| 視口內重疊:', analyze(s3, 2, '縮小後').overlaps);

  // ===== zoom2 視口內互動: 點翠綠草原名牌 → 副本 =====
  await jumpTo(isoX(19, 20.5), isoY(19, 20.5));   // 翠綠草原
  await page.waitForTimeout(200);
  const rp = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.map-label')].find(e => e.textContent.includes('翠綠草原'));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const wrapR = el.parentElement.parentElement.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, inWrap: r.left >= wrapR.left - 2 && r.right <= wrapR.right + 2 && r.top >= wrapR.top - 2 && r.bottom <= wrapR.bottom + 2 };
  });
  console.log('[互動] zoom2 翠綠草原名牌在視口內:', rp ? rp.inWrap : false);
  if (rp && rp.inWrap) {
    await page.mouse.click(rp.x, rp.y);
    await page.waitForTimeout(600);
    const entered = await page.evaluate(() => {
      const F = MG.sys.battle.get();
      return F ? 'r' + F.r + 'n' + F.n : 'NO-F';
    });
    console.log('[互動] 點擊後進入副本:', entered, '| 地圖收起:', await page.evaluate(() => !document.querySelector('canvas[title*=\"小地圖\"]') || getComputedStyle([...document.querySelectorAll('canvas')].find(c => c.width === 96).parentElement.parentElement.parentElement).display === 'none'));
    await page.evaluate(() => MG.ui.screens.show('map'));
    await page.waitForTimeout(400);
  }
  // 返回地圖後再點競技場熱區 (zoom2 保留)
  await jumpTo(isoX(23, 16), isoY(23, 16));
  const ah = await page.evaluate(() => {
    const hits = [...document.querySelectorAll('.map-hit')];
    const el = hits[11];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const wrapR = el.parentElement.parentElement.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, inWrap: r.left >= wrapR.left - 2 && r.right <= wrapR.right + 2 && r.top >= wrapR.top - 2 && r.bottom <= wrapR.bottom + 2 };
  });
  console.log('[互動] zoom2 競技場熱區在視口內:', ah ? ah.inWrap : false);
  if (ah && ah.inWrap) {
    await page.mouse.click(ah.x, ah.y);
    await page.waitForTimeout(500);
    console.log('[互動] 競技場熱區 → modal:', await page.evaluate(() => !!document.querySelector('.modal')) || await page.evaluate(() => document.body.innerText.includes('競技場')));
    await page.evaluate(() => { const c = [...document.querySelectorAll('.modal button, .modal .btn, [class*=close]')]; if (c.length) c[0].click(); });
    await page.waitForTimeout(300);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => (b.title || '').includes('返回')); if (b) b.click(); });
    await page.waitForTimeout(300);
  }

  console.log('errs:', errs.length ? errs.slice(0, 10) : 'ZERO');
  await browser.close();
})();