// Contact sheet of screenshots: node sheet.js <out.png> <cols> <img>...
// (captions are the file names). Needs playwright-core and Google Chrome.
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const [out, cols, ...imgs] = process.argv.slice(2);
(async () => {
  const cells = imgs.map(f => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}"><figcaption>${path.basename(f)}</figcaption></figure>`).join('');
  const html = `<html><body style="margin:0;background:#888;font:12px sans-serif"><div style="display:grid;grid-template-columns:repeat(${cols},300px);gap:6px;padding:6px">${cells}</div><style>figure{margin:0;background:#fff}img{width:300px;display:block}figcaption{padding:2px 4px}</style></body></html>`;
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage({ viewport: { width: cols * 306 + 6, height: 400 } });
  await p.setContent(html);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
