// Web smoke against the exported web build, with no npm packages: Node 24's
// built-in WebSocket drives Google Chrome over the DevTools protocol, and a
// small static server (SPA fallback) serves the export.
// Usage: node web-smoke-cdp.js <dist-dir> <out-dir> <chrome-profile-dir>
// Same steps as issue-147's web-smoke.js (playwright-core): Home, Back from
// /login, not-found, the Showcase link, Explore (first request answered 503,
// then Retry), demo sign-in and logout, reload signs out (in-memory token on
// web), and dark mode.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const [DIST, OUT, PROFILE] = process.argv.slice(2);
const PORT = 5070;
const DEBUG_PORT = 9333;
const BASE = `http://localhost:${PORT}`;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const log = (...a) => console.log(...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(DIST, decodeURIComponent(new URL(req.url, BASE).pathname));
  const file = p.startsWith(DIST) && fs.existsSync(p) && fs.statSync(p).isFile()
    ? p : path.join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

let ws;
let nextId = 1;
const pending = new Map();
const listeners = [];
function send(method, params = {}, sessionId) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject, method }));
}

async function newPage(colorScheme) {
  const { browserContextId } = await send('Target.createBrowserContext');
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  const page = { s, sessionId, errors, routes: [] };
  listeners.push(msg => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map(a => a.value ?? a.description).join(' '));
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      errors.push(msg.params.entry.text);
    }
    if (msg.method === 'Fetch.requestPaused') {
      const { requestId, request } = msg.params;
      const route = page.routes.find(r => r.test(request.url));
      if (route) route.handle(requestId, request);
      else s('Fetch.continueRequest', { requestId });
    }
  });
  await s('Page.enable');
  await s('Runtime.enable');
  await s('Log.enable');
  await s('Emulation.setDeviceMetricsOverride',
    { width: 430, height: 900, deviceScaleFactor: 1, mobile: false });
  await s('Emulation.setEmulatedMedia',
    { features: [{ name: 'prefers-color-scheme', value: colorScheme }] });
  return page;
}

async function route(page, test, handle) {
  page.routes.push({ test, handle });
  await page.s('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
}
async function unroute(page) {
  page.routes = [];
  await page.s('Fetch.disable');
}

async function evaluate(page, fn, ...args) {
  const r = await page.s('Runtime.evaluate', {
    expression: `(${fn})(...${JSON.stringify(args)})`,
    returnByValue: true, awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'evaluate failed');
  return r.result.value;
}

// The deepest visible element whose whitespace-normalized text matches
// (exact string or regex source), or the element with data-testid.
function findInPage(kind, value, flags) {
  const visible = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  let el = null;
  if (kind === 'testid') {
    el = [...document.querySelectorAll(`[data-testid="${value}"]`)].find(visible) ?? null;
  } else {
    const re = kind === 're' ? new RegExp(value, flags) : null;
    const norm = e => (e.textContent ?? '').replace(/\s+/g, ' ').trim();
    const ok = e => (re ? re.test(norm(e)) : norm(e) === value);
    const all = [...document.body.querySelectorAll('*')].filter(e => ok(e) && visible(e));
    el = all.find(e => ![...e.querySelectorAll('*')].some(c => ok(c) && visible(c))) ?? null;
  }
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, text: (el.textContent ?? '').trim() };
}
const sel = v => (v instanceof RegExp ? ['re', v.source, v.flags] : ['text', v]);

async function waitFor(page, v, timeout = 10000) {
  const [kind, value, flags] = typeof v === 'object' && v.testid ? ['testid', v.testid] : sel(v);
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const hit = await evaluate(page, findInPage, kind, value, flags);
    if (hit) return hit;
    await sleep(150);
  }
  throw new Error(`timed out waiting for ${kind} ${value}`);
}
async function waitUntil(page, fn, what, timeout = 10000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await evaluate(page, fn)) return;
    await sleep(150);
  }
  throw new Error(`timed out waiting for ${what}`);
}
async function click(page, v, timeout) {
  const { x, y } = await waitFor(page, v, timeout);
  await page.s('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await page.s('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await page.s('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}
async function type(page, text) {
  for (const ch of text) {
    await page.s('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch });
    await page.s('Input.dispatchKeyEvent', { type: 'keyUp', key: ch });
    await sleep(30);
  }
}
async function pressEnter(page) {
  const k = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 };
  await page.s('Input.dispatchKeyEvent', { type: 'keyDown', ...k, text: '\r' });
  await page.s('Input.dispatchKeyEvent', { type: 'keyUp', ...k });
}
async function goto(page, url) {
  await page.s('Page.navigate', { url });
  await waitUntil(page, () => document.readyState === 'complete', `load of ${url}`, 20000);
}
const pathname = page => evaluate(page, () => location.pathname);
const title = page => evaluate(page, () => document.title);
async function shot(page, name) {
  await sleep(800);
  const { data } = await page.s('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(data, 'base64'));
  log('  screenshot', `${name}.png`);
}

const errors = [];
let chrome;
async function main() {
  await new Promise(r => server.listen(PORT, r));
  chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check',
    'about:blank'], { stdio: 'ignore' });
  let version;
  for (let i = 0; i < 50 && !version; i++) {
    await sleep(200);
    version = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`).then(r => r.json(), () => null);
  }
  if (!version) throw new Error('Chrome did not start');
  log('browser:', version.Browser);
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message}`));
      else p.resolve(msg.result);
    } else listeners.forEach(l => l(msg));
  };

  const page = await newPage('light');

  log('1. Home');
  await goto(page, BASE + '/');
  await waitFor(page, 'Not signed in', 20000);
  await waitUntil(page, () => document.title === 'Home', 'title Home');
  log('  title:', JSON.stringify(await title(page)));
  await shot(page, 'web-01-home');

  log('2. /login, then Back returns Home');
  await click(page, { testid: 'sign-in-button' });
  await waitFor(page, 'Welcome Back');
  await waitUntil(page, () => document.title === 'Sign in', 'title Sign in');
  log('  at', await pathname(page), 'title:', JSON.stringify(await title(page)));
  await evaluate(page, () => history.back());
  await waitFor(page, 'Not signed in');
  log('  browser back at', await pathname(page));
  await click(page, { testid: 'sign-in-button' });
  await waitFor(page, 'Welcome Back');
  await click(page, { testid: 'auth-back' });
  await waitFor(page, 'Not signed in');
  log('  header back at', await pathname(page));

  log('2b. An unknown URL shows the not-found screen, which leads Home');
  await goto(page, BASE + '/no-such-page');
  await waitFor(page, 'Page not found', 20000);
  if (await evaluate(page, () => /Unmatched Route|Sitemap/.test(document.body.innerText))) {
    throw new Error('expo-router development page shown');
  }
  await shot(page, 'web-00-not-found');
  await click(page, { testid: 'not-found-home' });
  await waitFor(page, 'Not signed in');
  log('  home at', await pathname(page));

  log('2c. The example links are buttons; Showcase names the tab');
  const buttons = await evaluate(page, () => [...document.querySelectorAll('[role="button"]')]
    .filter(e => /Component showcase/.test(e.getAttribute('aria-label') ?? e.textContent ?? '')).length);
  if (buttons !== 1) throw new Error(`the Showcase link is not one button (${buttons})`);
  await click(page, /Component showcase/);
  await waitFor(page, 'React Native Paper', 20000);
  await waitUntil(page, () => document.title === 'Component showcase', 'title Component showcase');
  log('  title on /showcase:', await title(page));
  await shot(page, 'web-00b-showcase');
  await goto(page, BASE + '/');
  await waitFor(page, 'Not signed in', 20000);

  log('3. Explore: 503, then Retry loads the list');
  let failNext = true;
  await route(page, url => /todos/.test(url), (requestId, request) => {
    if (failNext && request.method !== 'OPTIONS') {
      failNext = false;
      log('  answering', request.url, 'with 503');
      return page.s('Fetch.fulfillRequest', {
        requestId, responseCode: 503,
        responseHeaders: [{ name: 'content-type', value: 'application/json' },
          { name: 'access-control-allow-origin', value: '*' }],
        body: Buffer.from(JSON.stringify({ message: 'Service unavailable' })).toString('base64'),
      });
    }
    return page.s('Fetch.continueRequest', { requestId });
  });
  await click(page, 'Explore');
  await waitFor(page, 'The server had a problem. Please try again later.', 20000);
  await shot(page, 'web-02-explore-error');
  await click(page, 'Retry');
  const list = await waitFor(page, /^Todos \(\d+\)$/, 20000);
  log('  list:', list.text);
  // After a successful load, the button reloads (it said Retry only after the error).
  await waitFor(page, 'Reload', 5000);
  log('  button after success: Reload');
  await shot(page, 'web-03-explore-after-retry');
  await unroute(page);

  log('4. Sign in with the demo account');
  await goto(page, BASE + '/');
  await click(page, { testid: 'sign-in-button' }, 20000);
  await waitFor(page, 'Welcome Back');
  await click(page, { testid: 'login-username' });
  await type(page, 'emilys');
  await pressEnter(page);
  await type(page, 'emilyspass');
  await shot(page, 'web-04-login-filled');
  await pressEnter(page);
  log('  ', (await waitFor(page, /^Signed in as /, 20000)).text);
  await shot(page, 'web-05-signed-in');

  log('5. Reload: the in-memory token is gone, so signed out (documented)');
  await page.s('Page.reload');
  await waitFor(page, 'Not signed in', 20000);
  log('  after reload: Not signed in');

  log('6. Sign in again, log out');
  await click(page, { testid: 'sign-in-button' });
  await click(page, { testid: 'login-username' });
  await type(page, 'emilys');
  await click(page, { testid: 'login-password' });
  await type(page, 'emilyspass');
  await click(page, 'Sign In');
  await waitFor(page, /^Signed in as /, 20000);
  await click(page, 'Log out');
  await waitFor(page, 'Not signed in');
  log('  logged out');

  log('7. Dark mode');
  const dark = await newPage('dark');
  // Before the app's script runs, the page already has the dark background.
  await route(dark, url => url.includes('/_expo/static/js/'),
    requestId => dark.s('Fetch.failRequest', { requestId, errorReason: 'Aborted' }));
  await goto(dark, BASE + '/');
  const before = await evaluate(dark, () => getComputedStyle(document.body).backgroundColor);
  log('  background before the app renders:', before);
  if (before !== 'rgb(21, 23, 24)') throw new Error('page is not dark before JS');
  await unroute(dark);
  await goto(dark, BASE + '/');
  await waitFor(dark, 'Not signed in', 20000);
  await shot(dark, 'web-06-dark-home');
  await click(dark, 'Explore');
  await waitFor(dark, /^Todos \(\d+\)$/, 20000);
  await shot(dark, 'web-07-dark-explore');

  log('console errors:', errors.length ? '\n  ' + errors.join('\n  ') : '(none)');
  log('WEB SMOKE PASSED');
}

main().catch(e => {
  console.error('WEB SMOKE FAILED:', e.message);
  process.exitCode = 1;
}).finally(() => {
  ws?.close();
  chrome?.kill();
  server.close();
});
