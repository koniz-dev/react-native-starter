// #91 on the web: the upload route posts a FormData; the echo server reports
// what arrived. Usage: node web-upload-91.js <out-dir> <base-url>
const { chromium } = require('playwright-core');
(async () => {
  const [OUT, BASE] = process.argv.slice(2);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  const sent = [];
  page.on('request', r => { if (r.url().includes('/upload')) sent.push(`${r.method()} ${r.headers()['content-type']}`); });
  await page.goto(`${BASE}/upload-check`);
  await page.locator('[data-testid=upload]').click();
  const result = page.getByText(/^(multipart:|failed:)/);
  await result.waitFor({ timeout: 20000 });
  const text = await result.textContent();
  console.log('request:', sent.join(' | '));
  console.log('result:', text);
  await page.screenshot({ path: `${OUT}/web-upload.png` });
  await browser.close();
  const ok = text === 'multipart:true type:multipart/form-data parts:title:hello,avatar:png';
  console.log(ok ? 'WEB UPLOAD PASSED' : 'WEB UPLOAD FAILED');
  process.exitCode = ok ? 0 : 1;
})();
