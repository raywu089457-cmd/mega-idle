/* v623 驗證：南廣場 3 攤 SR 糖果化重繪 — 像素斷言＋確定性＋回歸＋截圖
   用法: node progress/v623-verify-stalls.js  */
const fs = require('fs');
const { chromium } = require('C:/Users/ray/AppData/Roaming/npm/node_modules/playwright');
const PORT = 8123;
const isoX = (c, r) => 464 + (c - r) * 16, isoY = (c, r) => 8 + (c + r) * 8;
const STALLS = [[7.0, 23.0], [9.4, 23.0], [8.2, 24.4]];
const OUT = 'progress/';

const INIT = `(() => {
  window.__errs = [];
  window.addEventListener('error', e => window.__errs.push('err:' + e.message));
  window.addEventListener('unhandledrejection', e => window.__errs.push('rej:' + (e.reason && e.reason.message || e.reason)));
  const orig = CanvasRenderingContext2D.prototype.drawImage;
  window.__baseC = null;
  CanvasRenderingContext2D.prototype.drawImage = function (img, ...rest) {
    if (img && img.width === 1216 && img.height === 608 && !window.__baseC) window.__baseC = img;
    return orig.call(this, img, ...rest);
  };
})()`;

const INJECT = `(() => {
  const skip = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '略過');
  if (skip) skip.click();                                  // 關閉教學覆層(新檔自動彈出)
  const st = MG.game.state;
  st.tutorial = 99;
  st.stats.maxRegionReached = 9;
  st.kingdom.level = 12;
  MG.core.save.save = () => {};
  MG.ui.screens.show('map');
  return true;
})()`;

/* base 畫布像素斷言 + 裁切 dataURL */
const ASSERT = `(() => {
  const c = window.__baseC;
  if (!c) return { fatal: 'no base canvas captured' };
  const g = c.getContext('2d');
  const stalls = ${JSON.stringify(STALLS)};
  const isoX = ${isoX.toString()}, isoY = ${isoY.toString()};
  const lum = (r, gg, b) => 0.299 * r + 0.587 * gg + 0.114 * b;
  const per = [];
  for (const [sc, sr] of stalls) {
    const sx = Math.round(isoX(sc, sr)), sy = Math.round(isoY(sc, sr));
    const x0 = sx - 8, y0 = sy - 15, w = 17, h = 19;
    const d = g.getImageData(x0, y0, w, h).data;
    let pureBlack = 0, darkLow = 0, redFam = 0, stripeA = 0, stripeB = 0, wood = 0;
    const lv = new Set();
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], gg = d[i + 1], b = d[i + 2];
      const L = lum(r, gg, b);
      if ((r === 0 && gg === 0 && b === 0) || (r === 16 && gg === 16 && b === 24) || (r === 20 && gg === 18 && b === 31)) pureBlack++;
      if (L < 89) darkLow++;
      if (r >= 200 && gg >= 60 && gg <= 180 && b >= 60 && b <= 180) redFam++;
      if (r >= 240 && gg >= 100 && gg <= 175 && b >= 85 && b <= 165) stripeA++;
      if (r >= 200 && r < 240 && gg < 120 && b < 115 && gg >= 55 && b >= 50) stripeB++;
      if (r > gg && gg > b && r >= 150 && r <= 235 && (r - b) > 40 && L >= 140 && L <= 200) wood++;
      lv.add(((r >> 4) << 8) | ((gg >> 4) << 4) | (b >> 4));
    }
    // asset 剪影內 darkLow（棚頂 3 列＋櫃台 5 列,不含地面/陰影）— G2/G3 硬性
    let silDark = 0;
    const sil = [[sx - 7, sy - 13, 14, 3], [sx - 6, sy - 7, 12, 6]];
    for (const [rx, ry, rw, rh] of sil) {
      const dd = g.getImageData(rx, ry, rw, rh).data;
      for (let i = 0; i < dd.length; i += 4) if (lum(dd[i], dd[i + 1], dd[i + 2]) < 89) silDark++;
    }
    // 地面對照組（攤位左側同 y 帶,無 asset 處）
    const cd = g.getImageData(sx - 26, sy - 15, 12, 19).data;
    let ctrlDark = 0;
    for (let i = 0; i < cd.length; i += 4) if (lum(cd[i], cd[i + 1], cd[i + 2]) < 89) ctrlDark++;
    // 貼地影取樣 (sx+1..sx+3, sy+1..sy+2)
    const sd = g.getImageData(sx + 1, sy + 1, 3, 2).data;
    const shadow = [];
    for (let i = 0; i < sd.length; i += 4) shadow.push([sd[i], sd[i + 1], sd[i + 2], Math.round(lum(sd[i], sd[i + 1], sd[i + 2]))]);
    per.push({ sx, sy, pureBlack, darkLow, silDark, ctrlDark, redFam, stripeA, stripeB, wood, uniq4: lv.size, shadow });
  }
  // 整張 base FNV 哈希（確定性跨 reload 比對）
  const all = g.getImageData(0, 0, c.width, c.height).data;
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < all.length; i += 997) { hash ^= all[i]; hash = (hash * 16777619) >>> 0; }
  // 4x 裁切（最近鄰）：三攤全區 + 單攤
  function crop(x, y, w, h, scale) {
    const t = document.createElement('canvas'); t.width = w * scale; t.height = h * scale;
    const tg = t.getContext('2d'); tg.imageSmoothingEnabled = false;
    tg.drawImage(c, x, y, w, h, 0, 0, w * scale, h * scale);
    return t.toDataURL('image/png');
  }
  // 並排：攤位 4x + 西街燈柱 4x
  function sideBySide() {
    const s = 4, cw = 80, ch = 56;
    const t = document.createElement('canvas'); t.width = cw * s * 2 + 24; t.height = ch * s + 16;
    const tg = t.getContext('2d'); tg.imageSmoothingEnabled = false;
    tg.fillStyle = '#222'; tg.fillRect(0, 0, t.width, t.height);
    tg.drawImage(c, 190, 224, cw, ch, 0, 8, cw * s, ch * s);          // 攤位區
    tg.drawImage(c, 96, 198, cw, ch, cw * s + 24, 8, cw * s, ch * s);  // 西燈柱區
    return t.toDataURL('image/png');
  }
  return {
    per, hash,
    cropStalls4x: crop(190, 224, 80, 56, 4),
    cropStall0_6x: crop(196, 230, 26, 24, 6),
    sideBySide: sideBySide()
  };
})()`;

function saveDataURL(u, path) {
  fs.writeFileSync(path, Buffer.from(u.split(',')[1], 'base64'));
}

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true, args: ['--no-sandbox']
  });
  const report = { consoleErrs: [], pageErrs: [], steps: [] };
  const step = (name, ok, extra) => { report.steps.push({ name, ok, extra }); console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (extra ? ' — ' + JSON.stringify(extra) : '')); };

  // ---------- 桌機 1280×800 ----------
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx1.newPage();
  page.on('console', m => { if (m.type() === 'error') report.consoleErrs.push('[desktop] ' + m.text()); });
  page.on('pageerror', e => report.pageErrs.push('[desktop] ' + e.message));
  await page.addInitScript(INIT);
  await page.goto('http://127.0.0.1:' + PORT + '/index.html?v=623', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.MG && MG.game && MG.game.state, null, { timeout: 20000 });
  await page.evaluate(INJECT);
  await page.waitForFunction(() => !!window.__baseC, null, { timeout: 10000 });
  await page.waitForTimeout(600);

  const r1 = await page.evaluate(ASSERT);
  if (r1.fatal) { console.log('FATAL', r1.fatal); await browser.close(); process.exit(1); }
  report.hashDesktop = r1.hash;
  saveDataURL(r1.cropStalls4x, OUT + 'v623-crop-stalls-4x.png');
  saveDataURL(r1.cropStall0_6x, OUT + 'v623-crop-stall0-6x.png');
  saveDataURL(r1.sideBySide, OUT + 'v623-stalls-vs-lamps-4x.png');

  // 像素斷言
  let allOk = true;
  r1.per.forEach((p, i) => {
    // ⑤貼地影：平均暖向(avgR≥avgB-2)非純黑、平均 lum 60..115;stall1 被候選1白團(b_tt_demo,已裁決排除)覆壓,僅資訊
    const n6 = p.shadow.length;
    const avg = p.shadow.reduce((a, c) => [a[0] + c[0] / n6, a[1] + c[1] / n6, a[2] + c[2] / n6, a[3] + c[3] / n6], [0, 0, 0, 0]);
    const shadowOk = avg[3] >= 60 && avg[3] <= 115 && avg[0] >= avg[2] - 2 && p.shadow.every(([r, g, b]) => !(r === 0 && g === 0 && b === 0));
    const checks = {
      '①pureBlack=0': p.pureBlack === 0,
      '①silhouette darkLow=0': p.silDark === 0,
      '②redFam>=30': p.redFam >= 30,
      '②stripeA>=8': p.stripeA >= 8,
      '②stripeB>=8': p.stripeB >= 8,
      '③wood>=30': p.wood >= 30,
      '④uniq4>=40': p.uniq4 >= 40,
      '⑤shadow warm/soft': i === 1 ? true : shadowOk
    };
    const ok = Object.values(checks).every(Boolean);
    if (!ok) allOk = false;
    step('stall' + i + ' pixels', ok, { ...p, checks });
  });

  // 地圖 1× 桌機截圖
  await page.screenshot({ path: OUT + 'v623-map-1x-desktop.png' });

  // 縮放循環 1×→1.5×→2×→1×
  for (let z = 0; z < 3; z++) {
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const b = btns.find(x => (x.title || '').includes('地圖縮放'));
      if (b) b.click();
    });
    await page.waitForTimeout(250);
  }
  step('zoom cycle 1/1.5/2', report.consoleErrs.length === 0 && report.pageErrs.length === 0);

  // 核心流程回歸（桌機）
  const seq = ['kingdom', 'hunt', 'hunters', 'equipment', 'buildings', 'more', 'map'];
  for (const s of seq) {
    await page.evaluate(id => MG.ui.screens.show(id), s);
    await page.waitForTimeout(350);
  }
  // 模式入口：點地圖上模式地標名牌（競技場）
  await page.evaluate(() => MG.ui.screens.show('map'));
  await page.waitForTimeout(400);
  const modeClicked = await page.evaluate(() => {
    const els = [...document.querySelectorAll('#stage *')];
    const el = els.find(e => e.textContent && e.textContent.includes('競技場') && !e.querySelector('*'));
    if (el) { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); el.click(); return el.textContent; }
    return null;
  });
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.evaluate(() => MG.ui.screens.show('hunt'));
  await page.waitForTimeout(600);
  step('core flow regression (desktop)', report.consoleErrs.length === 0 && report.pageErrs.length === 0, { modeClicked });

  // 10s soak
  await page.waitForTimeout(10000);
  step('10s soak (desktop)', report.consoleErrs.length === 0 && report.pageErrs.length === 0);

  // ---------- 確定性：reload 後 base 哈希一致 ----------
  await page.goto('http://127.0.0.1:' + PORT + '/index.html?v=623', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.MG && MG.game && MG.game.state, null, { timeout: 20000 });
  await page.evaluate(INJECT);
  await page.waitForFunction(() => !!window.__baseC, null, { timeout: 10000 });
  await page.waitForTimeout(400);
  const r2 = await page.evaluate(`(() => { const g = window.__baseC.getContext('2d'); const all = g.getImageData(0,0,1216,608).data; let h = 2166136261>>>0; for (let i=0;i<all.length;i+=997){h^=all[i];h=(h*16777619)>>>0;} return h; })()`);
  step('determinism: base hash reload-equal', r2 === r1.hash, { h1: r1.hash, h2: r2 });

  // ---------- reducedMotion 雙幀哈希 ----------
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html?v=623', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.MG && MG.game && MG.game.state, null, { timeout: 20000 });
  await page.evaluate(INJECT);
  await page.waitForFunction(() => !!window.__baseC, null, { timeout: 10000 });
  await page.waitForTimeout(400);
  const frameHash = `(() => { const cv = document.querySelector('#stage canvas'); if (!cv) return -1; const g = cv.getContext('2d'); const d = g.getImageData(0,0,cv.width,cv.height).data; let h = 2166136261>>>0; for (let i=0;i<d.length;i+=251){h^=d[i];h=(h*16777619)>>>0;} return h; })()`;
  const rmA = await page.evaluate(frameHash);
  await page.waitForTimeout(800);
  const rmB = await page.evaluate(frameHash);
  // rm 下 base 哈希也要一致
  const r3 = await page.evaluate(`(() => { const g = window.__baseC.getContext('2d'); const all = g.getImageData(0,0,1216,608).data; let h = 2166136261>>>0; for (let i=0;i<all.length;i+=997){h^=all[i];h=(h*16777619)>>>0;} return h; })()`);
  const rmErrs = await page.evaluate(() => window.__errs);
  // 顯示層雙幀不納入合格判據：街道小人/旗幟為既有動態層(非本輪改動),隨時間移動屬預期;
  // 本輪改動全在靜態烘焙層,確定性由「跨 reload base 哈希逐位元一致」承擔(見上一步與 rmBase)
  step('reducedMotion: base hash equal across loads', r3 === r1.hash, { rmBase: r3, rmFrameA: rmA, rmFrameB: rmB, frameStableInfo: rmA === rmB });
  step('reducedMotion: zero page errors', rmErrs.length === 0, rmErrs);
  await ctx1.close();

  // ---------- 行動 390×844 DPR2 ----------
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mp = await ctx2.newPage();
  mp.on('console', m => { if (m.type() === 'error') report.consoleErrs.push('[mobile] ' + m.text()); });
  mp.on('pageerror', e => report.pageErrs.push('[mobile] ' + e.message));
  await mp.addInitScript(INIT);
  await mp.goto('http://127.0.0.1:' + PORT + '/index.html?v=623', { waitUntil: 'domcontentloaded' });
  await mp.waitForFunction(() => window.MG && MG.game && MG.game.state, null, { timeout: 20000 });
  await mp.evaluate(INJECT);
  await mp.waitForFunction(() => !!window.__baseC, null, { timeout: 10000 });
  await mp.waitForTimeout(600);
  await mp.screenshot({ path: OUT + 'v623-map-1x-mobile.png' });
  for (const s of ['kingdom', 'hunt', 'hunters', 'equipment', 'buildings', 'more', 'map', 'hunt']) {
    await mp.evaluate(id => MG.ui.screens.show(id), s);
    await mp.waitForTimeout(300);
  }
  await mp.waitForTimeout(6000);
  const mobErrs = await mp.evaluate(() => window.__errs);
  step('mobile core flow + soak', report.consoleErrs.filter(e => e.includes('mobile')).length === 0 && mobErrs.length === 0, mobErrs);
  await ctx2.close();

  await browser.close();
  report.ok = report.steps.every(s => s.ok) && report.consoleErrs.length === 0 && report.pageErrs.length === 0;
  report.consoleErrsAll = report.consoleErrs; report.pageErrsAll = report.pageErrs;
  fs.writeFileSync(OUT + 'v623-verify-report.json', JSON.stringify(report, null, 2));
  console.log('=== OVERALL: ' + (report.ok ? 'ALL PASS' : 'FAILURES') + ' ===');
  console.log('consoleErrs:', report.consoleErrs.length, 'pageErrs:', report.pageErrs.length);
  if (report.consoleErrs.length) console.log(report.consoleErrs.slice(0, 5));
  if (report.pageErrs.length) console.log(report.pageErrs.slice(0, 5));
  process.exit(report.ok ? 0 : 1);
})();
