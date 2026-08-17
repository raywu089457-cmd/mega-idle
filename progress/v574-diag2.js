// v574 診斷 2:pin 開啟 + 推擠漂移量測 + zoom no-op 驗證
const { chromium } = require('C:/Users/ray/AppData/Roaming/npm/node_modules/playwright');
const fs = require('fs');
const PORT = process.argv[2] || 8123;
const isoX = (c, r) => 464 + (c - r) * 16;   // 與 map.js 同構 (XO=448)
const isoY = (c, r) => 8 + (c + r) * 8;

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true, args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.MG && MG.game && MG.game.state && MG.ui && MG.ui.map, null, { timeout: 20000 });

  await page.evaluate(() => {
    MG.core.save.save = () => {};
    const st = MG.game.state;
    st.stats.maxRegionReached = 9;
    st.stats.maxStageByRegion = {};
    for (let i = 0; i < 10; i++) st.stats.maxStageByRegion[i] = 10;
    st.kingdom.level = 20;
    st.hunt.region = 2;
    // 世界首領 pin: attacked 1 of 3 → 剩2戰
    st.worldboss = st.worldboss || {};
    st.worldboss.attacks = 1; st.worldboss.killed = false;
    st.worldboss.week = MG.util.today ? MG.util.today() : 'x';
    // events pin
    st.events = st.events || {};
    st.events.pts = 100; st.events.current = true;
    if (!st.events.milestones) st.events.milestones = {};
    // exped pin
    st.wanderers = st.wanderers || [];
    st.wanderers.push({ id: 'dx', name: '測試', state: 'exped', dead: false, expUntil: Date.now() + 3600000, expReward: { gold: 1 } });
    return true;
  });
  await page.evaluate(() => MG.ui.screens.show('map'));
  await page.waitForTimeout(700);

  // 標籤清單: 文字 + 錨點(世界) + 下方旗標
  const dump = () => page.evaluate(() => {
    const els = [...document.querySelectorAll('.map-label')];
    return els.map(el => ({ txt: el.textContent.trim(), left: parseFloat(el.style.left), top: parseFloat(el.style.top) }));
  });

  const mm = await page.evaluate(() => {
    const c = [...document.querySelectorAll('canvas')].find(c => c.width === 96);
    const r = c.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });

  // 名牌資料: 複製 map.js 錨點順序 (村莊, 10 區, 10 模式)
  const ANCHORS = [];
  ANCHORS.push({ name: '村莊', x: isoX(8.5, 20.5), y: isoY(8.5, 13), below: false });
  const CENTERS = [
    { c: 19, r: 20.5 }, { c: 14, r: 13.5 }, { c: 17.5, r: 11.5 }, { c: 21.5, r: 8.5 }, { c: 25.5, r: 5.5 },
    { c: 29.5, r: 4.5 }, { c: 33.5, r: 5.5 }, { c: 37.5, r: 4.5 }, { c: 41, r: 3.5 }, { c: 44, r: 2 }];
  for (let i = 0; i < 10; i++) {
    const b = CENTERS[i];
    ANCHORS.push({ name: '區' + i, x: isoX(b.c, b.r), y: isoY(b.c, b.r) - 52, below: false });
  }
  const MODES = [
    { id: 'arena', name: '競技場', c: 23, r: 16 }, { id: 'royal', name: '王者競技場', c: 29, r: 17 },
    { id: 'dungeon', name: '試煉秘境', c: 34, r: 21 }, { id: 'worldboss', name: '世界首領', c: 38, r: 26 },
    { id: 'tower', name: '元素試煉塔', c: 29, r: 26 }, { id: 'maze', name: '奇境迷宮', c: 19, r: 27 },
    { id: 'guild', name: '公會盛宴', c: 24, r: 22 }, { id: 'events', name: '限時活動', c: 33, r: 25 },
    { id: 'abyss', name: '無盡深淵', c: 23, r: 26 }, { id: 'exped', name: '委託遠征營', c: 32, r: 19 }];
  for (let i = 0; i < 10; i++) {
    const m = MODES[i];
    ANCHORS.push({ name: m.name, x: isoX(m.c, m.r), y: isoY(m.c, m.r) + (i % 2 ? 26 : -46), below: !!(i % 2) });
  }

  const measureView = async () => {
    const data = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.map-label')];
      const rs = els.map(el => { const r = el.getBoundingClientRect(); return { txt: el.textContent.trim(), l: r.left, t: r.top, r_: r.right, b: r.bottom }; });
      let oc = 0; const pairs = [];
      for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
        const a = rs[i], b = rs[j];
        const ox = Math.min(a.r_, b.r_) - Math.max(a.l, b.l);
        const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
        if (ox > 0.5 && oy > 0.5) { oc++; pairs.push([a.txt, b.txt, Math.round(ox) + 'x' + Math.round(oy)]); }
      }
      return { oc, pairs, labels: els.map(el => ({ txt: el.textContent.trim(), left: parseFloat(el.style.left), top: parseFloat(el.style.top) })) };
    });
    return data;
  };

  // 名牌文字含 pin?
  const before = await dump();
  console.log('== 名牌文字 (pin 開啟) ==');
  console.log(before.map(l => l.txt).join('\n'));

  // 全圖掃描 + 漂移
  let worst = { oc: 0 }, maxDrift = { d: 0 };
  const driftRows = [];
  for (let gy = 1; gy <= 5; gy++) for (let gx = 1; gx <= 11; gx++) {
    const fx = gx / 12, fy = gy / 6;
    await page.mouse.click(mm.x + fx * mm.w, mm.y + fy * mm.h);
    await page.waitForTimeout(100);
    const m = await measureView();
    if (m.oc > worst.oc) worst = { ...m, fx, fy };
    // 漂移: 名牌 placed vs natural (需要 offX/offY — 從 minmap 反推不可靠, 改從名牌自然位置 vs 顯示位置: 名牌 anchor 世界座標已知, displayed = placed + off)
    // placed(style.left) = (anchor - offX) + pushX; 故 pushX = placed - (anchor - offX)。offX 未知 → 用名牌文字對應錨點前後次序近似：直接量「名牌間相對距離失真」
    if (m.labels.length === ANCHORS.length) {
      for (let i = 0; i < m.labels.length; i++) {
        const natY = (ANCHORS[i].y);      // 世界座標 (offY 未知, 但名牌自身 top = (anchor-offY)+pushY)
        // 用同名牌兩次測量? 不行。改用: 與」自然位置」的 y 位移 = 無法直接得。
      }
    }
  }
  console.log('\n== 55 採樣掃描 (pin 開啟) ==');
  console.log('worst:', JSON.stringify({ fx: worst.fx, fy: worst.fy, oc: worst.oc, pairs: worst.pairs }, null, 1));

  // 漂移量測: 對某視角, 名牌 placed(top) vs 自然 (anchor - offY)。offY 由小地圖點擊公式推得: offY = clamp(fy*BASE_H - VH/2)
  // 直接用 clamp 公式重算 offX/offY
  const BASE_W = 1216, BASE_H = 608, VW = 460, VH = 500;
  const cw = await page.evaluate(() => document.querySelector('canvas[width="' + 690 + '"]') ? 690 : 0);
  // 相對於 wrap 的 CSS 座標: getBoundingClientRect 已含 #app 偏移, 漂移只看相對位移 → 用 style.left/top 即 wrap 相對
  // offX 重算 (zoom1): offX = clamp(fx*BASE_W - VW/2, 0, BASE_W-cwCss); wrap css 寬度
  await page.mouse.click(mm.x + (0.5) * mm.w, mm.y + (0.5) * mm.h);  // 中心
  await page.waitForTimeout(150);
  const cwCss = await page.evaluate(() => document.querySelector('.map-label').parentElement.clientWidth || 0);
  console.log('\nwrap CSS 寬:', cwCss);
  // 測量: 逐名牌 placed vs natural 位移 (需要 offX/offY → 由 minimap 白框反推? 直接改讀 canvas 視口: 名牌元素是 wrap 子層)
  // 用「名牌錨點世界座標已知 + style.left/top = placed」→ 相對自然位移 = style - (anchor - off)
  // 已知 off = (0.5*BASE_W - VW/2) clamp → offX = 0.5*1216 - 230 = 378; offY = 0.5*608 - 250 = 54
  const offX = Math.max(0, Math.min(BASE_W - cwCss, 0.5 * BASE_W - VW / 2));
  const offY = Math.max(0, Math.min(BASE_H - cwCss * (500 / 460), 0.5 * BASE_H - VH / 2));
  const center = await page.evaluate(() => [...document.querySelectorAll('.map-label')].map(el => ({ txt: el.textContent.trim(), left: parseFloat(el.style.left), top: parseFloat(el.style.top) })));
  let driftMax = 0, driftRows2 = [];
  for (let i = 0; i < Math.min(center.length, ANCHORS.length); i++) {
    const natX = ANCHORS[i].x - offX, natY = ANCHORS[i].y - offY;
    const dx = center[i].left - natX, dy = center[i].top - natY;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) driftRows2.push({ name: ANCHORS[i].name, dx: Math.round(dx), dy: Math.round(dy) });
    driftMax = Math.max(driftMax, Math.abs(dy));
  }
  console.log('\n== 中心視角 名牌漂移 (placed - natural) ==');
  console.log(JSON.stringify(driftRows2, null, 1));
  console.log('max |dy|:', Math.round(driftMax));

  // zoom no-op 驗證: 同視角 zoom=1 vs zoom=2 截圖 (canvas 截圖像素比較)
  await page.mouse.click(mm.x + 0.25 * mm.w, mm.y + 0.33 * mm.h);
  await page.waitForTimeout(200);
  const shot1 = await page.screenshot({ clip: await page.evaluate(() => { const c = document.querySelector('.map-label').parentElement.parentElement; const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; }) });
  fs.writeFileSync('progress/v574-zoom1.png', shot1);
  // 點縮放鈕 (title 地圖縮放)
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => (b.title || '').includes('地圖縮放')); if (b) b.click(); });
  await page.waitForTimeout(300);
  const shot2 = await page.screenshot({ clip: await page.evaluate(() => { const c = document.querySelector('.map-label').parentElement.parentElement; const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; }) });
  fs.writeFileSync('progress/v574-zoom2.png', shot2);
  const same = Buffer.from(shot1).equals(Buffer.from(shot2));
  console.log('\n== zoom 1 vs zoom 2 截圖 identical:', same, '==');

  // zoom 2 下名牌對齊檢查: 名牌 nowrap 無縮放 → 如果 zoom 放大 content, 名牌需跟著放大/重新定位
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => (b.title || '').includes('地圖縮放')); if (b) b.click(); });  // back to 1
  await page.waitForTimeout(200);
  console.log('errs:', errs.length ? errs.slice(0, 10) : 'ZERO');
  await browser.close();
})();