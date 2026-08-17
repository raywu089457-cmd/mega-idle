const { chromium } = require('C:/Users/ray/AppData/Roaming/npm/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.MG && MG.game.state, null, { timeout: 20000 });
  await page.evaluate(() => { MG.core.save.save = () => {}; MG.ui.screens.show('map'); });
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => [...document.querySelectorAll('canvas')].map((c, i) => ({
    i, w: c.width, h: c.height, cssW: c.clientWidth, cssH: c.clientHeight, visible: !!(c.offsetWidth || c.offsetHeight || c.getClientRects().length)
  })));
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})();