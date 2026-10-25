const { chromium } = require(process.argv[2] + '/node_modules/playwright-core');
const out = process.argv[3];
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  for (const scheme of ['light', 'dark']) {
    const p = await b.newPage({ viewport: { width: 1280, height: 1000 }, colorScheme: scheme });
    await p.goto('https://github.com/koniz-dev/react-native-starter', { waitUntil: 'networkidle' });
    const readme = p.locator('article.markdown-body').first();
    await readme.waitFor();
    await p.waitForTimeout(2000);
    const imgs = await readme.locator('img').evaluateAll((els) => els.map((e) => [e.getAttribute('alt'), e.naturalWidth]));
    console.log(scheme, JSON.stringify(imgs));
    await readme.screenshot({ path: `${out}/github-readme-${scheme}.png` });
    const box = await readme.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width }; });
    await p.screenshot({ path: `${out}/github-top-${scheme}.png`, fullPage: true, clip: { x: box.x, y: box.y, width: box.width, height: 1150 } });
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
