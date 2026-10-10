// Web smoke for issue 36: Home, showcase route, Explore tab, demo sign-in and logout.
const { chromium } = require('playwright-core');
const OUT = process.argv[2];
const BASE = 'http://localhost:5052';
const log = (...a) => console.log(...a);
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
  const errors = [];
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(BASE + '/');
  await page.getByText('Not signed in').waitFor();
  await page.screenshot({ path: `${OUT}/web-01-home.png` });
  log('Home: session card and example links');
  await page.getByText('Component showcase', { exact: true }).click();
  await page.getByText('Material Design 3 Components').waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/web-02-showcase.png` });
  log('Showcase opened at', new URL(page.url()).pathname);
  await page.goBack();
  await page.getByText('Todos (API example)').click();
  await page.getByText(/^Todos \(/).waitFor({ timeout: 20000 });
  await page.screenshot({ path: `${OUT}/web-03-explore.png` });
  log('Explore opened at', new URL(page.url()).pathname);
  await page.goto(BASE + '/');
  await page.getByTestId('sign-in-button').click();
  await page.getByText('Welcome Back').waitFor();
  await page.getByTestId('login-username').click();
  await page.keyboard.type('emilys', { delay: 30 });
  await page.getByTestId('login-password').click();
  await page.keyboard.type('emilyspass', { delay: 30 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/web-04-login-demo-hint.png` });
  log(
    'Login shows the demo hint:',
    await page.getByTestId('demo-credentials-hint').isVisible()
  );
  await page.getByText('Sign In', { exact: true }).click();
  await page.getByText(/^Signed in as /).waitFor({ timeout: 20000 });
  await page.screenshot({ path: `${OUT}/web-05-signed-in.png` });
  log(
    'Signed in via the DummyJSON adapter:',
    await page.getByText(/^Signed in as /).textContent()
  );
  await page.getByText('Log out').click();
  await page.getByText('Not signed in').waitFor();
  log('Logged out');
  log('console errors:', errors.length ? errors.join(' | ') : '(none)');
  await browser.close();
})().catch(e => {
  console.error('SMOKE FAILED:', e.message);
  process.exit(1);
});
