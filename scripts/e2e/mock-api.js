#!/usr/bin/env node
/**
 * Local API for the Maestro flows (scripts/e2e/run.sh starts it), so a flow
 * can check an error state without a real backend failing. A flow switches
 * the mode (.maestro/scripts/set-api-mode.js):
 *
 *   POST /__mode/ok      each route in ROUTES answers; others 404
 *   POST /__mode/error   every request returns 503 {"message": "Service unavailable"}
 *   GET  /__mode         the current mode (run.sh checks it is this mock)
 *
 * The flows need no other server, so a run doesn't depend on the network.
 *
 * Add the routes your flows need to ROUTES, or point the app at your own
 * backend or mock with E2E_API_URL (docs/testing.md#your-backend-or-mock).
 *
 * It listens on 127.0.0.1 only. A route that throws answers 500 and the
 * mock keeps running.
 *
 * Usage: node scripts/e2e/mock-api.js [port]   (default 9999)
 */
const http = require('http');

const port = Number(process.argv[2] ?? 9999);
let mode = 'ok';

// @demo remove-block-start
// The demo account (features/demo-auth), as DummyJSON returns it.
const DEMO_USER = {
  id: 1,
  email: 'emily.johnson@x.dummyjson.com',
  firstName: 'Emily',
  lastName: 'Johnson',
};
const DEMO_TOKEN = 'e2e-demo-token';
// What GET /auth/me returns: another first name than the login's, so a flow
// can tell the user was reloaded rather than read from the cache.
const RELOADED_USER = { ...DEMO_USER, firstName: 'Em' };
// @demo remove-block-end

/**
 * `METHOD /path` (query string ignored) → the JSON body of a 200, or a
 * function of the request and its parsed JSON body that returns
 * `[status, body]`.
 */
const ROUTES = {
  // @demo remove-block-start
  // The demo's Explore tab (features/demo-todos).
  'GET /todos': Array.from({ length: 12 }, (_, index) => ({
    userId: 1,
    id: index + 1,
    title: `e2e todo ${index + 1}`,
    completed: index === 0,
  })),
  // The demo sign-in (features/demo-auth/dummyJsonAdapter.ts).
  'POST /auth/login': (_req, body) =>
    body.username === 'emilys' && body.password === 'emilyspass'
      ? [200, { ...DEMO_USER, accessToken: DEMO_TOKEN }]
      : [400, { message: 'Invalid credentials' }],
  'GET /auth/me': req =>
    req.headers.authorization === `Bearer ${DEMO_TOKEN}`
      ? [200, RELOADED_USER]
      : [401, { message: 'Invalid or expired token' }],
  // @demo remove-block-end
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

/** The request's JSON body if it is an object, else {}. */
function parseJson(text) {
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
}

http
  .createServer((req, res) => {
    let text = '';
    req.on('data', chunk => (text += chunk));
    req.on('end', () => {
      const path = (req.url ?? '/').split('?')[0];
      if (req.method === 'GET' && path === '/__mode') {
        return send(res, 200, { mode });
      }
      const modeMatch = /^\/__mode\/(ok|error)$/.exec(path);
      if (req.method === 'POST' && modeMatch) {
        mode = modeMatch[1];
        process.stdout.write(`mode=${mode}\n`);
        return send(res, 200, { mode });
      }
      process.stdout.write(`${req.method} ${req.url} mode=${mode}\n`);
      if (mode === 'error') {
        return send(res, 503, { message: 'Service unavailable' });
      }
      const route = ROUTES[`${req.method} ${path}`];
      if (route === undefined) return send(res, 404, { message: 'Not found' });
      if (typeof route !== 'function') return send(res, 200, route);
      try {
        const [status, body] = route(req, parseJson(text));
        send(res, status, body);
      } catch (error) {
        process.stdout.write(`route failed: ${error.stack}\n`);
        send(res, 500, { message: 'Mock route failed' });
      }
    });
  })
  .on('error', error => {
    process.stderr.write(`mock API: ${error.message}\n`);
    process.exit(1);
  })
  .listen(port, '127.0.0.1', () =>
    process.stdout.write(`mock API on 127.0.0.1:${port}\n`)
  );
