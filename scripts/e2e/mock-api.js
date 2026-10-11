#!/usr/bin/env node
/**
 * Local API for the Maestro flows (scripts/e2e/run.sh starts it), so a flow
 * can check an error state without a real backend failing. A flow switches
 * the mode (.maestro/scripts/set-api-mode.js):
 *
 *   POST /__mode/ok      each route in ROUTES returns its body; others 404
 *   POST /__mode/error   every request returns 503 {"message": "Service unavailable"}
 *
 * Add the routes your flows need to ROUTES, or point the app at your own
 * backend or mock with E2E_API_URL (docs/testing.md#your-backend-or-mock).
 *
 * Usage: node scripts/e2e/mock-api.js [port]   (default 9999)
 */
const http = require('http');

const port = Number(process.argv[2] ?? 9999);
let mode = 'ok';

/** `METHOD /path` (query string ignored) → JSON body for a 200. */
const ROUTES = {
  // @demo remove-block-start
  // The demo's Explore tab (features/demo-todos).
  'GET /todos': Array.from({ length: 12 }, (_, index) => ({
    userId: 1,
    id: index + 1,
    title: `e2e todo ${index + 1}`,
    completed: index === 0,
  })),
  // @demo remove-block-end
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

http
  .createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0];
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
    const body = ROUTES[`${req.method} ${path}`];
    if (body !== undefined) return send(res, 200, body);
    send(res, 404, { message: 'Not found' });
  })
  .listen(port, () => process.stdout.write(`mock API on :${port}\n`));
