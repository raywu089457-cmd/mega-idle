// v572 UI 回歸 + 截圖流程: fresh → hunt fight → parked state → resume toast → core flow
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => errs.push('reqfail: ' + r.url()));
const shots = [];
const fs = require('fs');

// fresh save
await tab.goto('http://127.0.0.1:8123/index.html?v=596', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2000));
await tab.evaluate('(() => { MG.core.save.reset(); MG.core.save.save(); MG.ui.screens.show("hunt"); return true; })()');
await new Promise(r => setTimeout(r, 600));

// dispatch starting hero via UI 派遣視窗
const snap1 = await tab.observe();
// find 派遣 button
const shot1 = await tab.screenshot({ silent: true });
shots.push(shot1);

return JSON.stringify({ errs: errs.slice(0, 10), shot1, title: snap1.title || '' });