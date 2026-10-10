// Web smoke for issue 26 (release readiness), against the exported web build
// served at BASE. Usage: node web-smoke.js <out-dir> [base-url]
// Home, Back from /login, Explore (first request answered 503, then Retry
// loads the list), demo sign-in and logout, reload signs out (in-memory token
// on web), and dark mode. Needs playwright-core and Google Chrome.
const { chromium } = require('playwright-core');

const OUT = process.argv[2];
const BASE = process.argv[3] ?? 'http://localhost:5070';
const log = (...a) => console.log(...a);

async function shot(page, name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  log('  screenshot', `${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const newPage = async colorScheme => {
    const context = await browser.newContext({
      viewport: { width: 430, height: 900 },
      colorScheme,
    });
    const page = await context.newPage();
    page.on('console', m => {
      if (m.type() === 'error') errors.push(m.text());
    });
    return page;
  };

  const page = await newPage('light');

  log('1. Home');
  await page.goto(BASE + '/');
  await page.getByText('Not signed in').waitFor();
  await shot(page, 'web-01-home');

  log('2. /login, then Back returns Home');
  await page.getByTestId('sign-in-button').click();
  await page.getByText('Welcome Back').waitFor();
  log('  at', new URL(page.url()).pathname);
  await page.goBack();
  await page.getByText('Not signed in').waitFor();
  log('  back at', new URL(page.url()).pathname);

  log('3. Explore: 503, then Retry loads the list');
  let failNext = true;
  await page.route('**/todos**', async route => {
    if (failNext) {
      failNext = false;
      log('  answering', route.request().url(), 'with 503');
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Service unavailable' }),
      });
    }
    return route.continue();
  });
  await page.getByText('Explore', { exact: true }).click();
  await page.getByText('Service unavailable').waitFor({ timeout: 20000 });
  await shot(page, 'web-02-explore-error');
  await page.getByText('Retry', { exact: true }).click();
  await page.getByText(/^Todos \(\d+\)$/).waitFor({ timeout: 20000 });
  log('  list:', await page.getByText(/^Todos \(\d+\)$/).textContent());
  await shot(page, 'web-03-explore-after-retry');

  log('4. Sign in with the demo account');
  await page.goto(BASE + '/');
  await page.getByTestId('sign-in-button').click();
  await page.getByText('Welcome Back').waitFor();
  await page.getByTestId('login-username').click();
  await page.keyboard.type('emilys', { delay: 30 });
  await page.keyboard.press('Enter');
  await page.keyboard.type('emilyspass', { delay: 30 });
  await shot(page, 'web-04-login-filled');
  await page.keyboard.press('Enter');
  await page.getByText(/^Signed in as /).waitFor({ timeout: 20000 });
  log('  ', await page.getByText(/^Signed in as /).textContent());
  await shot(page, 'web-05-signed-in');

  log('5. Reload: the in-memory token is gone, so signed out (documented)');
  await page.reload();
  await page.getByText('Not signed in').waitFor({ timeout: 20000 });
  log('  after reload: Not signed in');

  log('6. Sign in again, log out');
  await page.getByTestId('sign-in-button').click();
  await page.getByTestId('login-username').click();
  await page.keyboard.type('emilys', { delay: 30 });
  await page.getByTestId('login-password').click();
  await page.keyboard.type('emilyspass', { delay: 30 });
  await page.getByText('Sign In', { exact: true }).click();
  await page.getByText(/^Signed in as /).waitFor({ timeout: 20000 });
  await page.getByText('Log out').click();
  await page.getByText('Not signed in').waitFor();
  log('  logged out');

  log('7. Dark mode');
  const dark = await newPage('dark');
  await dark.goto(BASE + '/');
  await dark.getByText('Not signed in').waitFor();
  await shot(dark, 'web-06-dark-home');
  await dark.getByText('Explore', { exact: true }).click();
  await dark.getByText(/^Todos \(\d+\)$/).waitFor({ timeout: 20000 });
  await shot(dark, 'web-07-dark-explore');

  log(
    'console errors:',
    errors.length ? '\n  ' + errors.join('\n  ') : '(none)'
  );
  await browser.close();
  log('WEB SMOKE PASSED');
})().catch(e => {
  console.error('WEB SMOKE FAILED:', e.message);
  process.exit(1);
});
