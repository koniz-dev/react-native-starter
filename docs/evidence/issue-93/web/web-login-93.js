// #93 on the web export: autocomplete token, field-specific messages, and a
// repeated empty-field error clearing then reappearing in the live region.
const { chromium } = require('playwright-core');
const OUT = process.argv[2];
const BASE = process.argv[3] ?? 'http://localhost:5070';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  const fail = m => { console.log('FAIL', m); process.exitCode = 1; };
  await page.goto(`${BASE}/login`);
  await page.getByText('Welcome Back').waitFor();
  const ac = await page.locator('input[type=password]').getAttribute('autocomplete');
  console.log('password autocomplete:', ac); if (ac !== 'current-password') fail('autocomplete');
  const live = page.locator('[aria-live=polite]').filter({ hasText: /Please|^$/ }).first();
  const submit = page.getByText('Sign In', { exact: true });
  await submit.click();
  await page.getByText('Please fill in all fields').waitFor();
  console.log('both empty:', await page.getByText('Please fill in all fields').count() === 1 ? 'Please fill in all fields' : '?');
  // The region empties, then shows the message again on a second press.
  const seen = [];
  await page.exposeFunction('record', t => seen.push(t));
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('[aria-live=polite]')].find(e => e.textContent.includes('Please'));
    new MutationObserver(() => window.record(el.textContent)).observe(el, { subtree: true, childList: true, characterData: true });
  });
  await submit.click();
  await page.waitForTimeout(600);
  console.log('live region on 2nd press:', JSON.stringify(seen));
  if (!(seen.includes('') && seen.at(-1) === 'Please fill in all fields')) fail('repeat');
  await page.locator('input').first().click();
  await page.keyboard.type('emily');
  await submit.click();
  await page.getByText('Please enter your password').waitFor();
  console.log('username only: Please enter your password');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/web-93-password-missing.png` });
  await browser.close();
  console.log(process.exitCode ? 'WEB #93 FAILED' : 'WEB #93 PASSED');
})();
