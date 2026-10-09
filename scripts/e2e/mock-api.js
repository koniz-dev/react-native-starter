#!/usr/bin/env node
/**
 * Local API for the Maestro flows (scripts/e2e/run.sh starts it). Serves
 * GET /todos, and lets a flow switch the response mode:
 *
 *   POST /__mode/ok      GET /todos returns 12 todos
 *   POST /__mode/error   GET /todos returns 503 {"message": "Service unavailable"}
 *
 * Usage: node scripts/e2e/mock-api.js [port]   (default 9999)
 */
const http = require('http');

const port = Number(process.argv[2] ?? 9999);
let mode = 'ok';

const todos = Array.from({ length: 12 }, (_, index) => ({
  userId: 1,
  id: index + 1,
  title: `e2e todo ${index + 1}`,
  completed: index === 0,
}));

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

http
  .createServer((req, res) => {
    const modeMatch = /^\/__mode\/(ok|error)$/.exec(req.url ?? '');
    if (req.method === 'POST' && modeMatch) {
      mode = modeMatch[1];
      process.stdout.write(`mode=${mode}\n`);
      return send(res, 200, { mode });
    }
    if (req.method === 'GET' && req.url?.startsWith('/todos')) {
      process.stdout.write(`GET ${req.url} mode=${mode}\n`);
      return mode === 'error'
        ? send(res, 503, { message: 'Service unavailable' })
        : send(res, 200, todos);
    }
    send(res, 404, { message: 'Not found' });
  })
  .listen(port, () => process.stdout.write(`mock API on :${port}\n`));
