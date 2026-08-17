// v574 驗證 B: zoom2 東南密集群 — 名牌可見性/重疊/縮小降級 + 對齊精確量測
const { chromium } = require('C:/Users/ray/AppData/Roaming/npm/node_modules/playwright');
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
    st.wanderers = st.wanderers || [];
    if (!st.wanderers.some(w => w.state === 'exped')) st.wanderers.push({ id: 'dx', name: '測試', state: 'exped', dead: false, expUntil: Date.now() + 3600000, expReward: { gold: 1 } });
    return true;
  });
  await page.evaluate(() => { if (MG.ui.tutorial) MG.ui.tutorial.hide(); MG.ui.screens.show('map'); });
  await page.waitForTimeout(600);

  const zoomBtn = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => (b.title || '').includes('地圖縮放')); if (b) b.click(); });
  await zoomBtn(); await page.waitForTimeout(150);   // 1.5
  await zoomBtn(); await page.waitForTimeout(200);   // 2

  // 讀 minimap 白框: 找最長水平白 run 的列 → 視口上緣
  const readOff = () => page.evaluate(() => {
    const mm = [...document.querySelectorAll('canvas')].find(c => c.width === 96);
    const d = mm.getContext('2d').getImageData(0, 0, 96, 60).data;
    let best = { len: 0, x: 0, y: 0 };
    for (let y = 0; y < 60; y++) {
      for (let x = 0; x < 96; x++) {
        const p = (y * 96 + x) * 4;
        if (d[p] > 200 && d[p + 1] > 200 && d[p + 2] > 200) {
          let run = 1;
          while (x + run < 96) {
            const q = (y * 96 + x + run) * 4;
            if (d[q] > 200 && d[q + 1] > 200 && d[q + 2] > 200) run++; else break;
          }
          if (run > best.len) best = { len: run, x, y };
          x += run;
        }
      }
    }
    return best;
  });
  const kx = 96 / 1216, ky = 60 / 608;
  const b1 = await readOff();
  const offX = (b1.x - 0.5) / kx, offY = (b1.y - 0.5) / ky;

  // 拖曳到東南 (元素塔/世界首領 之間)
  const wrap = await page.evaluate(() => {
    const cv = [...document.querySelectorAll('canvas')].find(c => c.width === 230 || c.width === 306);
    const r = cv.parentElement.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  const drag = async (dx, dy) => {
    await page.mouse.move(wrap.x + 150, wrap.y + 180);
    await page.mouse.down();
    await page.mouse.move(wrap.x + 150 + dx, wrap.y + 180 + dy, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(250);
  };
  // zoom2 初始視角=村莊。世界座標目標: 元素塔(48,440)/世界首領(192,512)
  // 世界→minimap: fx = wx/BASE_W
  const tgt = { wx: 120, wy: 470 };
  const t0 = await readOff();
  // 用 minimap 點擊跳轉: mm 座標 = (wx/BASE_W)*96
  const mm = await page.evaluate(() => {
    const c = [...document.querySelectorAll('canvas')].find(c => c.width === 96);
    const r = c.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  await page.mouse.click(mm.x + (tgt.wx / 1216) * mm.w, mm.y + (tgt.wy / 608) * mm.h);
  await page.waitForTimeout(300);
  const b2 = await readOff();
  const offX2 = (b2.x - 0.5) / kx, offY2 = (b2.y - 0.5) / ky;
  console.log('jump 前 offXY:', Math.round(offX), Math.round(offY), '| 後:', Math.round(offX2), Math.round(offY2));

  // 量測: 全部名牌 rect + 對齊誤差 (placed center vs anchor 投影), 視口內名牌
  const m = await page.evaluate((o) => {
    const els = [...document.querySelectorAll('.map-label')];
    const wrapR = els[0].parentElement.parentElement.getBoundingClientRect();
    const out = { labels: [], overlaps: [], inView: 0 };
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const fs = getComputedStyle(el).fontSize;
      out.labels.push({ txt: el.textContent.trim(), l: Math.round(r.left - wrapR.left), t: Math.round(r.top - wrapR.top),
        w: Math.round(r.width), h: Math.round(r.height), fs });
      const inV = r.left >= wrapR.left - 2 && r.right <= wrapR.right + 2 && r.top >= wrapR.top - 2 && r.bottom <= wrapR.bottom + 2;
      if (inV) out.inView++;
    }
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 0.5 && oy > 0.5) out.overlaps.push([els[i].textContent.trim().slice(0, 7), els[j].textContent.trim().slice(0, 7), Math.round(ox) + 'x' + Math.round(oy)]);
    }
    return out;
  }, { offX2, offY2 });
  console.log('zoom2 東南: inView 名牌', m.inView, '/ 21, 重疊', m.overlaps.length, JSON.stringify(m.overlaps));
  console.log('名牌清單 (wrap 相對):');
  m.labels.forEach(l => console.log(' ', l.txt.slice(0, 16).padEnd(17), `(${l.l},${l.t}) ${l.w}x${l.h} fs=${l.fs}`));
  await page.screenshot({ path: 'progress/v574-zoom2-se-cluster.png' });

  // 對齊檢查: 世界首領名牌中心 vs 地標投影
  const kxCss = 452 / 230;
  const wb = m.labels.find(l => l.txt.includes('世界首領'));
  const expX = (192 - offX2) * kxCss, expY = (538 - offY2) * kxCss; // 錨點 y = isoY+26 (below)
  console.log('\n世界首領: placed center (', Math.round(wb.l + wb.w / 2), Math.round(wb.t + wb.h / 2), ') vs 地標投影 (', Math.round(expX), Math.round(expY), ') 誤差', Math.round(Math.abs(wb.l + wb.w / 2 - expX)), Math.round(Math.abs(wb.t + wb.h / 2 - expY)), 'px');
  const ele = m.labels.find(l => l.txt.includes('元素試煉塔'));
  const expXe = (48 - offX2) * kxCss, expYe = (394 - offY2) * kxCss; // above: y = isoY-46
  console.log('元素塔: placed center (', Math.round(ele.l + ele.w / 2), Math.round(ele.t + ele.h / 2), ') vs 投影 (', Math.round(expXe), Math.round(expYe), ') 誤差', Math.round(Math.abs(ele.l + ele.w / 2 - expXe)), Math.round(Math.abs(ele.t + ele.h / 2 - expYe)), 'px');

  // 縮小降級觸發測試: 移動到「無盡深淵/公會盛宴/奇境迷宮」三叢 + 王者/秘境 同 x 帶
  await page.mouse.click(mm.x + (0 / 1216) * mm.w, mm.y + (420 / 608) * mm.h);
  await page.waitForTimeout(300);
  const m2 = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.map-label')];
    const wrapR = els[0].parentElement.parentElement.getBoundingClientRect();
    const out = { overlaps: [], shrunk: [], inView: 0 };
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const fs = getComputedStyle(el).fontSize;
      if (fs === '10px') out.shrunk.push(el.textContent.trim().slice(0, 12));
      if (r.left >= wrapR.left - 2 && r.right <= wrapR.right + 2 && r.top >= wrapR.top - 2 && r.bottom <= wrapR.bottom + 2) out.inView++;
    }
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 0.5 && oy > 0.5) out.overlaps.push([els[i].textContent.trim().slice(0, 7), els[j].textContent.trim().slice(0, 7)]);
    }
    return out;
  });
  console.log('\n無盡深淵區: inView', m2.inView, '重疊', JSON.stringify(m2.overlaps), 'shrunk:', JSON.stringify(m2.shrunk));

  // 縮小降級強制驗證 (單元): 直接把「世界首領」名牌寬度模擬放大 → 需要 shrink 觸發 — 改用手動把字體設 30px 觸發
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.map-label')].find(e => e.textContent.includes('世界首領'));
    if (el) { el.style.fontSize = '28px'; el.style.padding = '8px 20px'; }
  });
  await page.waitForTimeout(60);
  const m3 = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.map-label')];
    const out = { overlaps: [], shrunk: [] };
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const fs = getComputedStyle(el).fontSize;
      if (fs === '10px') out.shrunk.push(el.textContent.trim().slice(0, 12));
    }
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 0.5 && oy > 0.5) out.overlaps.push([els[i].textContent.trim().slice(0, 7), els[j].textContent.trim().slice(0, 7), Math.round(ox) + 'x' + Math.round(oy)]);
    }
    return out;
  });
  console.log('28px 世界首領手動撐寬 → shrink 觸發:', JSON.stringify(m3.shrunk), '殘留重疊:', JSON.stringify(m3.overlaps));

  console.log('errs:', errs.length ? errs.slice(0, 10) : 'ZERO');
  await browser.close();
})();