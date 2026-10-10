// Screenshots of Home, the showcase snackbar, Login, and Explore in light and dark mode.
const { chromium } = require('playwright-core');
const OUT = process.argv[2];
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({
      viewport: { width: 430, height: 900 },
      colorScheme: scheme,
    });
    const errors = [];
    page.on('console', m => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.goto('http://localhost:5051/');
    await page.getByText('Not signed in').waitFor();
    await page.getByText('Contained', { exact: true }).click();
    await page.getByText('Contained pressed').waitFor();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${scheme}-home-snackbar.png` });
    await page.getByText('Try authentication demo').click();
    await page.getByText('Welcome Back').waitFor();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${scheme}-login.png` });
    await page.goto('http://localhost:5051/explore');
    await page.getByText(/^Todos \(/).waitFor({ timeout: 20000 });
    await page.screenshot({ path: `${OUT}/${scheme}-explore.png` });
    console.log(
      `${scheme}: home + snackbar "Contained pressed", login, explore rendered; console errors: ${errors.length ? errors.join(' | ') : '(none)'}`
    );
    await page.close();
  }
  await browser.close();
})().catch(e => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
