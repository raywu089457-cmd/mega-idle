// v574 診斷 3:真拖曳捲動掃描 — 全地圖 30 視角, 名牌重疊 + 漂移
const { chromium } = require('C:/Users/ray/AppData/Roaming/npm/node_modules/playwright');
const fs = require('fs');
const PORT = process.argv[2] || 8123;

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
  await page.evaluate(() => MG.ui.screens.show('map'));
  await page.waitForTimeout(700);

  const wrap = await page.evaluate(() => {
    const w = [...document.querySelectorAll('div')].find(d => d.style.position === 'relative' && d.querySelector('canvas[width="460"]') && d.className === '');
    const r = w.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  console.log('wrap rect:', JSON.stringify(wrap));
  // 驗證拖曳會移動: drag 左 200px, 比較 canvas 截圖
  const snapCanvas = async () => {
    const c = await page.evaluate(() => {
      const cv = [...document.querySelectorAll('canvas')].find(cv => cv.width === 460 || cv.width === 690);
      if (!cv) return null;
      const r = cv.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    });
    if (!c) return null;
    return page.screenshot({ clip: c });
  };
  const s0 = await snapCanvas();
  await page.mouse.move(wrap.x + 200, wrap.y + 200);
  await page.mouse.down();
  await page.mouse.move(wrap.x + 60, wrap.y + 240, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  const s1 = await snapCanvas();
  console.log('drag moved canvas:', !Buffer.from(s0).equals(Buffer.from(s1)));

  const measureView = () => page.evaluate(() => {
    const els = [...document.querySelectorAll('.map-label')];
    const rs = els.map(el => { const r = el.getBoundingClientRect(); return { txt: el.textContent.trim(), l: r.left, t: r.top, r_: r.right, b: r.bottom }; });
    let oc = 0; const pairs = [];
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], b = rs[j];
      const ox = Math.min(a.r_, b.r_) - Math.max(a.l, b.l);
      const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (ox > 0.5 && oy > 0.5) { oc++; pairs.push([a.txt, b.txt, Math.round(ox) + 'x' + Math.round(oy)]); }
    }
    // 視口內名牌 (wrap 內)
    const wr = document.querySelector('.map-label').parentElement.parentElement.getBoundingClientRect();
    const inside = rs.filter(r => r.l >= wr.left - 1 && r.r_ <= wr.right + 1 && r.t >= wr.top - 1 && r.b <= wr.bottom + 1);
    return { oc, pairs, visible: inside.length, all: rs.length, wrapH: Math.round(wr.height), wrapW: Math.round(wr.width) };
  });

  // 漂移: 對當前視角, 名牌錨點世界座標已知。offX/offY 由 minmap 白框反推不可行 → 改法:
  // 名牌 placed(top) - 名牌錨點世界 y = pushY - offY (常數 offY 對全部名牌相同);
  // 名牌間「相對」drift 不受 offY 影響: 名牌 i 與 j 的 placed 差 vs natural 差比較
  const driftPairs = () => page.evaluate((anchors) => {
    const els = [...document.querySelectorAll('.map-label')];
    const out = [];
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const ai = anchors[i], aj = anchors[j];
      if (ai.y > aj.y) continue; // 只算一次方向
      const natDy = aj.y - ai.y;
      const placedDy = parseFloat(els[j].style.top) - parseFloat(els[i].style.top);
      const shrink = parseFloat(els[j].style.left) - parseFloat(els[i].style.left);
      const natDx = aj.x - ai.x;
      if (Math.abs(placedDy - natDy) > 24 || Math.abs(shrink - natDx) > 40) {
        out.push({ a: els[i].textContent.trim().slice(0, 8), b: els[j].textContent.trim().slice(0, 8), natDy: Math.round(natDy), placedDy: Math.round(placedDy), natDx: Math.round(natDx), placedDx: Math.round(shrink) });
      }
    }
    return out;
  }, JSON.parse(
    // 錨點清單 (與 map.js 同構)
    (() => {
      const isoX = (c, r) => 464 + (c - r) * 16, isoY = (c, r) => 8 + (c + r) * 8;
      const A = [{ n: '村莊', x: isoX(8.5, 20.5), y: isoY(8.5, 13) }];
      const C = [[19, 20.5], [14, 13.5], [17.5, 11.5], [21.5, 8.5], [25.5, 5.5], [29.5, 4.5], [33.5, 5.5], [37.5, 4.5], [41, 3.5], [44, 2]];
      for (let i = 0; i < 10; i++) A.push({ n: 'r' + i, x: isoX(C[i][0], C[i][1]), y: isoY(C[i][0], C[i][1]) - 52 });
      const M = [[23, 16], [29, 17], [34, 21], [38, 26], [29, 26], [19, 27], [24, 22], [33, 25], [23, 26], [32, 19]];
      for (let i = 0; i < 10; i++) A.push({ n: 'm' + i, x: isoX(M[i][0], M[i][1]), y: isoY(M[i][0], M[i][1]) + (i % 2 ? 26 : -46) });
      return JSON.stringify(A);
    })()
  ));

  // 掃描: 從初始視角(村莊)開始, 逐步拖到右下 + 左上 + 右上, 每步量測
  const resets = [[0, 0], [1000, 40], [0, 0], [1000, 40], [300, 400]];
  let worst = { oc: 0 }; const rows = [];
  for (const [tx, ty] of [[-400, -120], [-700, -180], [200, 40], [700, 120], [0, 0]]) {
    // 大拖動至目標方向
    await page.mouse.move(wrap.x + 300, wrap.y + 250);
    await page.mouse.down();
    await page.mouse.move(wrap.x + 300 + tx, wrap.y + 250 + ty, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    const m = await measureView();
    const dp = await driftPairs();
    rows.push({ tx, ty, oc: m.oc, pairs: m.pairs, drift: dp.length, visible: m.visible, wrapH: m.wrapH });
    if (m.oc > worst.oc) worst = { ...m, tx, ty };
    // 截圖每點
    await page.screenshot({ path: `progress/v574-diag-v${tx}_${ty}.png` }).catch(() => {});
  }
  console.log('rows:', JSON.stringify(rows, null, 1));
  console.log('worst:', JSON.stringify(worst, null, 1));
  console.log('errs:', errs.length ? errs.slice(0, 10) : 'ZERO');
  await browser.close();
})();