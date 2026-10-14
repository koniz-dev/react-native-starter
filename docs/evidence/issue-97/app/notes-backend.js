// Pocket Notes' dev backend, with the shapes docs/connect-your-backend.md
// describes: { data } envelopes, a tokens-only login plus GET /me, rotating
// refresh tokens, revoke by refresh token, and short-lived access tokens.
// Usage: node scripts/notes-backend/server.js [port] [accessTtlSeconds]
const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.argv[2] ?? 4300);
const ACCESS_TTL_MS = Number(process.argv[3] ?? 60) * 1000;
const USER = {
  uuid: 'u-1',
  email: 'ada@example.com',
  full_name: 'Ada Lovelace',
  password: 'secret123',
};

const access = new Map(); // token -> expires at
const refresh = new Set();
const notes = [
  {
    id: 'n1',
    title: 'Groceries',
    body: 'Milk, eggs, bread',
    updated_at: '2026-10-14T09:00:00Z',
  },
  {
    id: 'n2',
    title: 'Ideas',
    body: 'A notes app built on the starter',
    updated_at: '2026-10-14T10:00:00Z',
  },
];
let avatar = null; // { type, bytes, version }
const stats = { refreshes: 0, expired401: 0 };

const id = () => crypto.randomBytes(12).toString('hex');
const issue = () => {
  const pair = { access_token: `a-${id()}`, refresh_token: `r-${id()}` };
  access.set(pair.access_token, Date.now() + ACCESS_TTL_MS);
  refresh.add(pair.refresh_token);
  return pair;
};
const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};
const fail = (res, status, code, message) =>
  send(res, status, { error: { code, message } });

function authed(req) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
  const expires = access.get(token);
  if (!expires) return 'missing';
  if (expires < Date.now()) return 'expired';
  return 'ok';
}

function parseMultipart(body, type) {
  const boundary = /boundary=([^;]+)/.exec(type)?.[1];
  if (!boundary) return [];
  return body
    .toString('latin1')
    .split(`--${boundary}`)
    .filter(part => /content-disposition/i.test(part))
    .map(part => {
      const head = part.slice(0, part.indexOf('\r\n\r\n'));
      const data = part.slice(part.indexOf('\r\n\r\n') + 4, -2);
      return {
        name: /name="([^"]+)"/i.exec(head)?.[1],
        filename: /filename="([^"]+)"/i.exec(head)?.[1],
        type: /content-type:\s*([^\r\n]+)/i.exec(head)?.[1],
        bytes: Buffer.from(data, 'latin1'),
      };
    });
}

http
  .createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const path = new URL(req.url, 'http://x').pathname;
      const json = () => {
        try {
          return JSON.parse(body.toString() || '{}');
        } catch {
          return {};
        }
      };
      const log = status =>
        console.log(
          `${new Date().toISOString()} ${req.method} ${path} ${status} auth=${authed(req)}`
        );
      if (req.method === 'OPTIONS') return send(res, 204, '');

      // Test controls (not part of a real backend).
      if (path === '/__expire' && req.method === 'POST') {
        for (const key of access.keys()) access.set(key, 0);
        log(204);
        return send(res, 204, '');
      }
      if (path === '/__stats') {
        return send(res, 200, {
          ...stats,
          liveRefreshTokens: refresh.size,
          notes: notes.length,
          avatar: avatar && { type: avatar.type, size: avatar.bytes.length },
        });
      }

      if (path === '/sessions' && req.method === 'POST') {
        const { email, password } = json();
        if (email !== USER.email || password !== USER.password) {
          log(422);
          return fail(
            res,
            422,
            'invalid_credentials',
            'Wrong email or password'
          );
        }
        log(201);
        return send(res, 201, { data: issue() });
      }
      if (path === '/sessions/refresh' && req.method === 'POST') {
        if (!refresh.delete(json().refresh_token)) {
          log(401);
          return fail(
            res,
            401,
            'invalid_refresh',
            'Refresh token revoked or unknown'
          );
        }
        stats.refreshes += 1;
        log(200);
        return send(res, 200, { data: issue() });
      }
      if (path === '/sessions/revoke' && req.method === 'POST') {
        refresh.delete(json().refresh_token);
        log(204);
        return send(res, 204, '');
      }
      if (path.startsWith('/avatars/') && req.method === 'GET' && avatar) {
        return send(res, 200, avatar.bytes, avatar.type);
      }

      const state = authed(req);
      if (state !== 'ok') {
        if (state === 'expired') stats.expired401 += 1;
        log(401);
        return fail(res, 401, 'token_expired', 'Your session expired');
      }
      const user = {
        uuid: USER.uuid,
        email: USER.email,
        full_name: USER.full_name,
      };
      if (path === '/me' && req.method === 'GET') {
        log(200);
        return send(res, 200, {
          data: {
            ...user,
            avatar_url: avatar ? `/avatars/${avatar.version}` : null,
          },
        });
      }
      if (path === '/me/avatar' && req.method === 'POST') {
        const file = parseMultipart(
          body,
          req.headers['content-type'] ?? ''
        ).find(part => part.name === 'avatar' && part.filename);
        if (!file || !/^image\//.test(file.type ?? '')) {
          log(422);
          return fail(
            res,
            422,
            'invalid_avatar',
            'Send an image in the "avatar" field'
          );
        }
        avatar = { type: file.type, bytes: file.bytes, version: id() };
        log(200);
        return send(res, 200, {
          data: {
            avatar_url: `/avatars/${avatar.version}`,
            size: file.bytes.length,
          },
        });
      }
      if (path === '/notes' && req.method === 'GET') {
        log(200);
        return send(res, 200, { data: notes });
      }
      if (path === '/notes' && req.method === 'POST') {
        const { title, body: text } = json();
        if (typeof title !== 'string' || !title.trim()) {
          log(422);
          return fail(res, 422, 'invalid_note', 'A note needs a title');
        }
        const note = {
          id: `n${notes.length + 1}`,
          title: title.trim(),
          body: String(text ?? ''),
          updated_at: new Date().toISOString(),
        };
        notes.unshift(note);
        log(201);
        return send(res, 201, { data: note });
      }
      const match = /^\/notes\/([\w-]+)$/.exec(path);
      if (match && req.method === 'GET') {
        const note = notes.find(n => n.id === match[1]);
        if (!note) {
          log(404);
          return fail(res, 404, 'not_found', 'No such note');
        }
        log(200);
        return send(res, 200, { data: note });
      }
      log(404);
      return fail(res, 404, 'not_found', `${req.method} ${path}`);
    });
  })
  .listen(PORT, '0.0.0.0', () =>
    console.log(
      `Pocket Notes backend on :${PORT}, access tokens live ${ACCESS_TTL_MS / 1000}s`
    )
  );
