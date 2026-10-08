// Web smoke for issue 34: sign in, session shown, no token in web storage,
// reload -> signed out, sign in again, log out. Uses the system Chrome.
const { chromium } = require('playwright-core');
const OUT = process.argv[2];
const BASE = 'http://localhost:5050';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function storageDump(page) {
  return page.evaluate(() => ({
    localStorage: Object.fromEntries(Object.entries(localStorage)),
    sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
    cookie: document.cookie,
  }));
}
function containsToken(dump, token) {
  return JSON.stringify(dump).includes(token);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
  const consoleErrors = [];
  page.on('console', m => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  let token = null;
  page.on('response', async r => {
    if (r.url().endsWith('/auth/login') && r.request().method() === 'POST') {
      log('POST /auth/login ->', r.status());
      try {
        token = (await r.json()).accessToken || null;
      } catch {}
    }
  });

  await page.goto(BASE + '/');
  await page.getByText('Not signed in').waitFor();
  await page.screenshot({ path: `${OUT}/web-01-home-signed-out.png` });
  log('Home shows "Not signed in"');

  const signIn = async shot => {
    await page.getByText('Try authentication demo').click();
    await page.getByText('Welcome Back').waitFor();
    // Type like a user; Paper's floating labels animate on input.
    await page.getByTestId('login-username').click();
    await page.keyboard.type('emilys', { delay: 30 });
    await page.getByTestId('login-password').click();
    await page.keyboard.type('emilyspass', { delay: 30 });
    if (shot) {
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUT}/${shot}` });
    }
    await page.getByText('Sign In', { exact: true }).click();
    await page.getByText(/^Signed in as /).waitFor({ timeout: 20000 });
  };

  await signIn('web-02-login-filled.png');
  const who = await page.getByText(/^Signed in as /).textContent();
  log(`Signed in; Home shows "${who}" at ${new URL(page.url()).pathname}`);
  await page.screenshot({ path: `${OUT}/web-03-signed-in.png` });

  const dump = await storageDump(page);
  log('token received from server:', token ? 'yes' : 'no');
  log(
    'token found in localStorage/sessionStorage/cookies:',
    containsToken(dump, token)
  );
  log(
    'localStorage keys:',
    Object.keys(dump.localStorage).join(', ') || '(none)'
  );
  log(
    'sessionStorage keys:',
    Object.keys(dump.sessionStorage).join(', ') || '(none)'
  );

  await page.getByText('View profile').click();
  await page.getByText('Profile', { exact: true }).first().waitFor();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/web-04-profile.png` });
  log('Profile opened at', new URL(page.url()).pathname);
  await page.goBack();
  await page.getByText(/^Signed in as /).waitFor();

  await page.reload();
  await page.getByText('Not signed in').waitFor();
  await page.screenshot({ path: `${OUT}/web-05-after-reload-signed-out.png` });
  const afterReload = await storageDump(page);
  log(
    'After reload: Home shows "Not signed in"; localStorage keys:',
    Object.keys(afterReload.localStorage).join(', ') || '(none)'
  );

  await signIn(null);
  log('Signed in again');
  await page.getByText('Log out').click();
  await page.getByText('Not signed in').waitFor();
  await page.screenshot({ path: `${OUT}/web-06-logged-out.png` });
  const afterLogout = await storageDump(page);
  log(
    'After logout: Home shows "Not signed in"; localStorage keys:',
    Object.keys(afterLogout.localStorage).join(', ') || '(none)'
  );

  log(
    'console errors:',
    consoleErrors.length ? consoleErrors.join(' | ') : '(none)'
  );
  await browser.close();
})().catch(e => {
  console.error('SMOKE FAILED:', e.message);
  process.exit(1);
});
