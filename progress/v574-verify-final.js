// v574 驗證 C:zoom2 名牌/熱區對齊 + 互動 + 縮放全階重疊掃描 (乾淨存檔,零注入錯誤)
const { chromium } = require('C:/Users/ray/AppData/Roaming/npm/node_modules/playwright');
const fs = require('fs');
const PORT = process.argv[2] || 8123;
const isoX = (c, r) => 464 + (c - r) * 16, isoY = (c, r) => 8 + (c + r) * 8;

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.MG && MG.game.state && MG.ui.map, null, { timeout: 20000 });
  await page.evaluate(() => {
    MG.core.save.save = () => {};   // 防 autosave 覆寫
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

  const zoomBtn = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(b => (b.title || '').includes('地圖縮放')); if (b) b.click(); return b ? b.textContent : ''; });
  const readOff = () => page.evaluate(() => {
    const mm = [...document.querySelectorAll('canvas')].find(c => c.width === 96);
    const d = mm.getContext('2d').getImageData(0, 0, 96, 60).data;
    let best = { len: 0, x: 99, y: 99 };
    for (let y = 0; y < 60; y++) for (let x = 0; x < 96; x++) {
      const q = (y * 96 + x) * 4;
      if (d[q] > 200 && d[q + 1] > 200 && d[q + 2] > 200) {
        let run = 1; while (x + run < 96) { const z = (y * 96 + x + run) * 4; if (d[z] > 200 && d[z + 1] > 200 && d[z + 2] > 200) run++; else break; }
        if (run >= 14 && (y < best.y || (y === best.y && x < best.x))) best = { len: run, x, y };
        x += run;
      }
    }
    return best;
  });
  const kxm = 96 / 1216, kym = 60 / 608;
  const jumpTo = async (wx, wy) => {
    const mm = await page.evaluate(() => { const c = [...document.querySelectorAll('canvas')].find(c => c.width === 96); const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    await page.mouse.click(mm.x + (wx / 1216) * mm.w, mm.y + (wy / 608) * mm.h);
    await page.waitForTimeout(300);
    const f = await readOff();
    return { offX: (f.x - 0.5) / kxm, offY: (f.y - 0.5) / kym };
  };
  const measure = () => page.evaluate(() => {
    const els = [...document.querySelectorAll('.map-label')];
    const wrapR = els[0].parentElement.parentElement.getBoundingClientRect();
    const out = { labels: [], overlaps: [], inView: 0, shrunk: [] };
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const fs = getComputedStyle(el).fontSize;
      out.labels.push({ txt: el.textContent.trim(), l: Math.round(r.left - wrapR.left), t: Math.round(r.top - wrapR.top), w: Math.round(r.width), h: Math.round(r.height), fs });
      if (fs === '10px') out.shrunk.push(el.textContent.trim().slice(0, 10));
      if (r.left >= wrapR.left - 2 && r.right <= wrapR.right + 2 && r.top >= wrapR.top - 2 && r.bottom <= wrapR.bottom + 2) out.inView++;
    }
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 0.5 && oy > 0.5) out.overlaps.push([els[i].textContent.trim().slice(0, 8), els[j].textContent.trim().slice(0, 8), Math.round(ox) + 'x' + Math.round(oy)]);
    }
    return out;
  });

  // ===== 1) zoom2 東南群: 跳轉 + 對齊 + 重疊
  await zoomBtn(); await page.waitForTimeout(200);   // 1.5
  await zoomBtn(); await page.waitForTimeout(250);   // 2
  const o = await jumpTo(120, 450);   // 元素塔/世界首領 中間 (zoom2 之後 offY 中心 450-125)
  console.log('zoom2 offXY:', Math.round(o.offX), Math.round(o.offY));
  const m = await measure();
  console.log('inView:', m.inView, '/ 21 | 重疊:', m.overlaps.length ? JSON.stringify(m.overlaps) : '0', '| shrunk:', JSON.stringify(m.shrunk));
  // 對齊: 名牌中心 vs 地標投影
  const cw2 = 452, VW2 = 230;   // CSS 每世界 px = cw/VW
  const kx2 = cw2 / VW2;
  const alignCheck = (name, anchorX, anchorY) => {
    const lb = m.labels.find(l => l.txt.includes(name));
    if (!lb) return console.log(name, '找不到');
    const expX = (anchorX - o.offX) * kx2, expY = (anchorY - o.offY) * kx2;
    const cx = lb.l + lb.w / 2, cy = lb.t + lb.h / 2;
    console.log(`${name}: placed(${Math.round(cx)},${Math.round(cy)}) vs 投影(${Math.round(expX)},${Math.round(expY)}) 誤差 ${Math.round(Math.abs(cx - expX))},${Math.round(Math.abs(cy - expY))}px`);
  };
  alignCheck('世界首領', isoX(38, 26), isoY(38, 26) + 26);
  alignCheck('元素試煉塔', isoX(29, 26), isoY(29, 26) - 46);
  alignCheck('王者競技場', isoX(29, 17), isoY(29, 17) + 26);
  alignCheck('委託遠征營', isoX(32, 19), isoY(32, 19) + 26);
  await page.screenshot({ path: 'progress/v574-zoom2-se.png' });

  // ===== 2) zoom2 互動: 點區域名牌 → 副本; 點競技場熱區 → modal
  const regionLb = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.map-label')];
    const wrapR = els[0].parentElement.parentElement.getBoundingClientRect();
    const el = els.find(e => e.textContent.includes('翠綠草原'));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (regionLb) {
    await page.mouse.click(regionLb.x, regionLb.y);
    await page.waitForTimeout(500);
    const huntShown = await page.evaluate(() => !!document.querySelector('.screen[style*="display: block"]') && !!(window.MG && MG.sys.battle.get() && MG.sys.battle.get().phase !== undefined) || (()=>{const F=MG.sys.battle.get(); return F&&F.r===0&&F.n===1;})());
    console.log('zoom2 點「翠綠草原」→ 進入副本關卡:', huntShown);
    await page.evaluate(() => MG.ui.screens.show('map'));
    await page.waitForTimeout(400);
    console.log('返回地圖後 zoom 保留 (canvas):', await page.evaluate(() => [...document.querySelectorAll('canvas')].find(c => c.width < 400 && c.width > 100) ? '230x250 保留' : 'MISS'));
    // 熱區: 競技場 (模式入口)
    const arenaHit = await page.evaluate(() => {
      const hits = [...document.querySelectorAll('.map-hit')];
      const wrapR = hits[0].parentElement.parentElement.getBoundingClientRect();
      // 競技場熱區 = 第 11 個 hit (村莊 1 + 10 區 + 10 模式, 模式 idx0=arena)
      // 熱區順序: 村莊,10 區,10 模式 → arena 是 [11]
      const el = [...document.querySelectorAll('.map-hit')][11];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      // 推到競技場視口 (x=464+(23-16)*16=576, y=8+39*8=320)
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, title: el.title };
    });
    // 跳轉到競技場再點
    await jumpTo(isoX(23, 16), isoY(23, 16));
    const ah2 = await page.evaluate(() => {
      const hits = [...document.querySelectorAll('.map-hit')];
      const el = hits[11];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (ah2) {
      await page.mouse.click(ah2.x, ah2.y);
      await page.waitForTimeout(500);
      const modal = await page.evaluate(() => !!document.querySelector('.modal, [class*="modal"]'));
      console.log('zoom2 競技場熱區點擊 → modal 開啟:', modal);
      await page.evaluate(() => MG.ui.screens.show('map'));
      await page.waitForTimeout(300);
    }
  }

  // ===== 3) 縮小降級強制觸發 (zoom2 世界首領 pin 人為撐寬造成必然重疊)
  const shrink = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.map-label')].find(e => e.textContent.includes('世界首領'));
    if (el) { el.style.fontSize = '30px'; el.style.padding = '10px 24px'; }
    return true;
  });
  await page.waitForTimeout(80);   // placeLabels 未重跑 → 手動觸發一次捲動
  // 觸發重排: 拖曳一下
  const wrap = await page.evaluate(() => {
    const cv = [...document.querySelectorAll('canvas')].find(c => c.width === 230);
    const r = cv.parentElement.getBoundingClientRect();
    return { x: r.left, y: r.top };
  });
  await page.mouse.move(wrap.x + 120, wrap.y + 120);
  await page.mouse.down();
  await page.mouse.move(wrap.x + 125, wrap.y + 125, { steps: 3 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  const m2 = await measure();
  console.log('縮小降級: shrunk =', JSON.stringify(m2.shrunk), '| 殘留重疊:', m2.overlaps.length ? JSON.stringify(m2.overlaps) : '0');

  // ===== 4) 全階重疊掃描: zoom1/1.5/2 各 6 視角拖曳
  for (const [z, zname] of [[1, '1'], [1.5, '1.5'], [2, '2']]) {
    // 回到希望層級
    let cur = await page.evaluate(() => parseInt(([...document.querySelectorAll('button')].find(b => (b.title || '').includes('地圖縮放')) || {}).textContent.replace(/[^\d.]/g, '') || '1', 10) || 1);
    while (cur !== z) { await zoomBtn(); await page.waitForTimeout(150); cur = cur >= 2 ? 1 : (cur === 1 ? 1.5 : 2); }
    let maxOc = 0, maxPairs = [];
    for (const [dx, dy] of [[60, 30], [400, 150], [-300, -120], [100, 380], [-500, 60], [250, -200]]) {
      await page.mouse.move(wrap.x + 150, wrap.y + 180);
      await page.mouse.down();
      await page.mouse.move(wrap.x + 150 + dx, wrap.y + 180 + dy, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(180);
      const mm = await measure();
      if (mm.overlaps.length > maxOc) { maxOc = mm.overlaps.length; maxPairs = mm.overlaps; }
    }
    console.log(`zoom${zname} 6 視角: max 重疊 =`, maxOc, JSON.stringify(maxPairs));
  }

  console.log('\nerrs:', errs.length ? errs.slice(0, 10) : 'ZERO');
  await browser.close();
})();