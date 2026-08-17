// v574 診斷:名牌防碰撞現況 — 全解鎖存檔, 縮放 1x, 全地圖採樣視口, 量測名牌重疊
// 用法: node progress/v574-diag-labels.js [port]
const { chromium } = require('C:/Users/ray/AppData/Roaming/npm/node_modules/playwright');
const fs = require('fs');
const PORT = process.argv[2] || 8123;

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,   // headless=new 語義 (playwright 新版 headless 即 new)
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));

  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.MG && MG.game && MG.game.state && MG.ui && MG.ui.map, null, { timeout: 20000 });

  // 注入全解鎖中後期存檔 (直接改內存 state; beforeunload autosave 會覆寫 → patch save)
  await page.evaluate(() => {
    const orig = MG.core.save.save.bind(MG.core.save);
    MG.core.save.save = () => {};
    const st = MG.game.state;
    st.stats.maxRegionReached = 9;
    st.stats.maxStageByRegion = {};
    for (let i = 0; i < 10; i++) st.stats.maxStageByRegion[i] = 10;
    st.stats.maxStage = 100;
    st.kingdom.level = 20;
    st.currencies.gold = 5e9;
    st.currencies.gems = 5000;
    st.currencies.honor = 3000;
    st.hunt.region = 2;
    // 世界首領倒數 pin 需要 left()
    if (MG.sys.worldboss && MG.sys.worldboss.left && !MG.sys.worldboss.left()) {
      // 給一次剩餘戰數 (模擬已打 1 場)
      try {
        const wb = st.worldboss || (st.worldboss = {});
        if (typeof wb.left === 'number') wb.left = 2;
      } catch (e) {}
    }
    return true;
  });

  // 開地圖
  await page.evaluate(() => MG.ui.screens.show('map'));
  await page.waitForTimeout(600);

  const measure = () => page.evaluate(() => {
    const els = [...document.querySelectorAll('.map-label')];
    const rs = els.map(el => {
      const r = el.getBoundingClientRect();
      return { txt: el.textContent.trim(), l: r.left, t: r.top, r_: r.right, b: r.bottom, w: r.width, h: r.height };
    });
    const pairs = [];
    let overlapCount = 0;
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], b = rs[j];
      const ox = Math.min(a.r_, b.r_) - Math.max(a.l, b.l);
      const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (ox > 0.5 && oy > 0.5) { overlapCount++; pairs.push({ a: a.txt, b: b.txt, ox: Math.round(ox), oy: Math.round(oy) }); }
    }
    // 視口外名牌 (水平夾緊只有 x; 被下推出視口的 y)
    const outOfView = rs.filter(r => r.b > window.innerHeight - 50 || r.t < -2).map(r => ({ txt: r.txt, t: Math.round(r.t), b: Math.round(r.b) }));
    return { n: els.length, overlapCount, pairs, outOfView };
  });

  // 1) 初始視角 (村莊)
  const initial = await measure();
  console.log('== 初始視角 (村莊) ==');
  console.log(JSON.stringify(initial, null, 1));

  // 2) 全地圖採樣: 點擊小地圖 (96x60) 格點 — 11x5 網格
  let worst = { overlapCount: 0 };
  const mm = await page.evaluate(() => {
    const c = document.querySelector('canvas[title*="小地圖"]') || [...document.querySelectorAll('canvas')].find(c => c.width === 96);
    const r = c.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  let scans = [];
  for (let gy = 1; gy <= 5; gy++) {
    for (let gx = 1; gx <= 11; gx++) {
      const fx = gx / 12, fy = gy / 6;
      await page.mouse.click(mm.x + fx * mm.w, mm.y + fy * mm.h);
      await page.waitForTimeout(120);
      const m = await measure();
      scans.push({ fx: +fx.toFixed(2), fy: +fy.toFixed(2), overlapCount: m.overlapCount, maxOv: Math.max(...m.pairs.map(p => Math.min(p.ox, p.oy)), 0), out: m.outOfView.length });
      if (m.overlapCount > worst.overlapCount) worst = { ...m, fx, fy };
    }
  }
  console.log('== 全地圖 55 採樣 ==');
  console.log('worst:', JSON.stringify({ fx: worst.fx, fy: worst.fy, overlapCount: worst.overlapCount, pairs: worst.pairs, outOfView: worst.outOfView }, null, 1));
  console.log('掃描表:', JSON.stringify(scans));

  // 3) 熱區密集區: 東南角 (模式地標群: 世界首領/元素試煉塔/限時活動/無盡深淵/公會盛宴/迷宮)
  await page.mouse.click(mm.x + (26.5/1216) * mm.w, mm.y + (26/608) * mm.h);
  await page.waitForTimeout(300);
  const se = await measure();
  console.log('== 東南海域模式地標群 ==');
  console.log(JSON.stringify(se, null, 1));
  await page.screenshot({ path: 'progress/v574-diag-se-cluster.png' });

  // 4) 西北村莊+草原帶
  await page.mouse.click(mm.x + (18/1216) * mm.w, mm.y + (17/608) * mm.h);
  await page.waitForTimeout(300);
  const nw = await measure();
  console.log('== 西北村莊+草原帶 ==');
  console.log(JSON.stringify(nw, null, 1));
  await page.screenshot({ path: 'progress/v574-diag-nw-cluster.png' });

  console.log('errs:', errs.length ? errs.slice(0, 10) : 'ZERO');
  await browser.close();
})();