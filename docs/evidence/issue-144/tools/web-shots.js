const { chromium } = require(process.argv[2] + '/node_modules/playwright-core');
const out = process.argv[3];
const base = 'http://localhost:5070';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, colorScheme: scheme });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log('pageerror', e.message));
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${out}/web-${scheme}-home.png` });
    await page.goto(base + '/login', { waitUntil: 'networkidle' });
    await page.getByLabel('Username').click();
    await page.keyboard.type('emilys');
    await page.getByLabel('Password').click();
    await page.keyboard.type('emilyspass');
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByText(/^Signed in as/).waitFor({ timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${out}/web-${scheme}-signed-in.png` });
    await page.getByText('View profile').click();
    await page.getByText('Email', { exact: true }).waitFor({ timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/web-${scheme}-profile.png` });
    await page.goBack();
    await page.getByText('Explore', { exact: true }).click();
    await page.getByText(/^Todos \(/).waitFor({ timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/web-${scheme}-explore.png` });
    await ctx.close();
  }
  await browser.close();
  console.log('done');
})().catch((e) => { console.error(e); process.exit(1); });
