// Pocket Notes on the web export: sign in from the Notes tab, create a note,
// survive an expired access token, upload a profile photo, sign out.
// Usage: node web-check.js <out-dir> <app-url> <backend-url> <image>
const { chromium } = require(process.env.PW ?? 'playwright-core');
const [OUT, APP, BACKEND, IMAGE] = process.argv.slice(2);
const log = (...a) => console.log(...a);

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  const shot = async name => {
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${name}.png` });
  };
  const byId = id => page.locator(`[data-testid="${id}"]`).last();

  await page.goto(`${APP}/notes`);
  await page.getByText('Sign in to see your notes').waitFor();
  log('1. Notes tab signed out: prompt shown');
  await byId('notes-sign-in').click();
  await page.getByText('Welcome Back').waitFor();
  await byId('login-username').click();
  await page.keyboard.type('ada@example.com');
  await byId('login-password').click();
  await page.keyboard.type('secret123');
  await byId('login-submit').click();
  await page.getByText('Groceries').first().waitFor({ timeout: 20000 });
  log('2. Signed in, back on the tab with the list');
  await shot('web-notes-list');

  await byId('notes-new').click();
  await byId('note-title-input').click();
  await page.keyboard.type('From the web');
  await byId('note-save').click();
  await byId('note-title').waitFor();
  log('3. Created:', await byId('note-title').textContent(), 'at', new URL(page.url()).pathname);
  await shot('web-note-created');

  await fetch(`${BACKEND}/__expire`, { method: 'POST' });
  // In-app navigation only: a page load signs out on the web (memory token).
  await byId('protected-back').click();
  await byId('note-n1').click();
  await page.getByText('Milk, eggs, bread').last().waitFor({ timeout: 20000 });
  const stats = await (await fetch(`${BACKEND}/__stats`)).json();
  log('4. After every access token expired, the note loaded; refreshes:', stats.refreshes);
  if (!(stats.refreshes >= 1)) throw new Error('no refresh');
  await shot('web-after-refresh');

  await byId('protected-back').click();
  await byId('tab-home').click();
  await byId('profile-button').click();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    byId('avatar-change').click(),
  ]);
  await chooser.setFiles(IMAGE);
  await page.getByText('Photo updated').waitFor({ timeout: 20000 });
  const after = await (await fetch(`${BACKEND}/__stats`)).json();
  log('5. Photo uploaded:', JSON.stringify(after.avatar));
  await shot('web-photo-updated');

  await byId('profile-logout').click();
  await page.getByText('Not signed in').waitFor();
  log('6. Signed out');
  await browser.close();
  log('console errors:', errors.join(' | ') || 'none');
})().catch(error => {
  console.error('FAILED', error.message);
  process.exitCode = 1;
});
