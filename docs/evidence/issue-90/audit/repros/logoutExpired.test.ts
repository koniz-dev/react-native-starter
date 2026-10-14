/**
 * Runs the example AuthAdapter in docs/connect-your-backend.md (taken from
 * the page itself, so the documented code is what is tested) against a fake
 * backend with the shapes that page describes: success responses in a
 * `{ data }` envelope, a tokens-only login plus GET /me, rotating refresh
 * tokens, an error envelope, and revocation on logout. The requests go through the real auth clients, session service,
 * and token stores.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { AxiosError, AxiosHeaders } from 'axios';
import {
  authClients,
  authService,
  setAuthAdapter,
  type AuthAdapter,
} from '@/shared/session/authService';
import { STORAGE_KEYS } from '@/shared/storage/storage';
import { secureStore } from '@/testing';
import { linkDependencies } from '@/testing/projectCopy';

const ROOT = path.resolve(__dirname, '../..');
const DOC = path.join(ROOT, 'docs/connect-your-backend.md');
const SNIPPET_START = '// features/auth/myBackendAdapter.ts';

const snippetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-adapter-'));
afterAll(() => fs.rmSync(snippetDir, { recursive: true, force: true }));

/** Writes the doc's adapter snippet to a temp module and loads it. */
function loadDocumentedAdapter(): { myBackendAuthAdapter: AuthAdapter } {
  const doc = fs.readFileSync(DOC, 'utf8');
  const start = doc.indexOf(SNIPPET_START);
  if (start < 0) throw new Error(`${DOC}: no "${SNIPPET_START}" snippet`);
  const code = doc.slice(start, doc.indexOf('\n```', start));
  // The compiled module needs this repo's packages (Babel helpers).
  linkDependencies(snippetDir);
  const file = path.join(snippetDir, 'myBackendAdapter.ts');
  fs.writeFileSync(file, code);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(file);
}

const { myBackendAuthAdapter } = loadDocumentedAdapter();
const REFRESH_KEY = 'refresh_token';

interface Request {
  method: string;
  url: string;
  authorization: string | undefined;
  body: unknown;
}

/** The backend: one account, rotating refresh tokens, revocable sessions. */
function fakeBackend() {
  const requests: Request[] = [];
  const state = {
    issued: 0,
    validAccess: new Set<string>(),
    validRefresh: new Set<string>(),
    down: false,
    /** Only the refresh endpoint is unreachable (a flaky network). */
    refreshDown: false,
    /** Replaces the next success body, for a backend of another shape. */
    nextBody: undefined as unknown,
  };
  const issue = () => {
    state.issued += 1;
    const pair = {
      access_token: `access-${state.issued}`,
      refresh_token: `refresh-${state.issued}`,
    };
    state.validAccess.add(pair.access_token);
    state.validRefresh.add(pair.refresh_token);
    return pair;
  };
  const respond = (
    config: InternalAxiosRequestConfig,
    status: number,
    data: unknown
  ): AxiosResponse | never => {
    const body =
      status >= 400 || data === null
        ? data
        : state.nextBody !== undefined
          ? state.nextBody
          : { data };
    if (status < 400) state.nextBody = undefined;
    const response = {
      data: body,
      status,
      statusText: String(status),
      headers: {},
      config,
    };
    if (status < 400) return response;
    throw new AxiosError(
      `Request failed with status code ${status}`,
      'ERR_BAD_REQUEST',
      config,
      null,
      { ...response, headers: new AxiosHeaders() }
    );
  };
  const failure = (code: string, message: string) => ({
    error: { code, message },
  });

  const adapter: AxiosAdapter = async config => {
    const body: unknown =
      typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const authorization = config.headers.Authorization as string | undefined;
    const method = (config.method ?? 'get').toUpperCase();
    const url = config.url ?? '';
    requests.push({ method, url, authorization, body });
    if (state.down) {
      throw new AxiosError('Network Error', 'ERR_NETWORK', config);
    }
    const bearer = authorization?.replace(/^Bearer /, '');
    const { email, password, refresh_token } = (body ?? {}) as Record<
      string,
      string
    >;

    if (method === 'POST' && url === '/sessions') {
      return email === 'ada@example.com' && password === 'secret'
        ? respond(config, 201, issue())
        : respond(
            config,
            422,
            failure('invalid_credentials', 'Wrong email or password')
          );
    }
    if (method === 'GET' && url === '/me') {
      return bearer && state.validAccess.has(bearer)
        ? respond(config, 200, {
            uuid: 'u-1',
            email: 'ada@example.com',
            full_name: 'Ada Lovelace',
          })
        : respond(config, 401, failure('token_expired', 'Token expired'));
    }
    if (method === 'POST' && url === '/sessions/refresh') {
      if (state.refreshDown) {
        throw new AxiosError('Network Error', 'ERR_NETWORK', config);
      }
      if (!state.validRefresh.delete(refresh_token ?? '')) {
        return respond(config, 401, failure('invalid_refresh', 'Revoked'));
      }
      return respond(config, 200, issue());
    }
    if (method === 'DELETE' && url === '/sessions') {
      if (!bearer || !state.validAccess.has(bearer)) {
        return respond(config, 401, failure('token_expired', 'Token expired'));
      }
      state.validRefresh.delete(refresh_token ?? '');
      if (bearer) state.validAccess.delete(bearer);
      return respond(config, 204, null);
    }
    return respond(config, 404, failure('not_found', `${method} ${url}`));
  };
  return { adapter, requests, state };
}

let backend: ReturnType<typeof fakeBackend>;
const originalAdapters = {
  public: authClients.public.defaults.adapter,
  authenticated: authClients.authenticated.defaults.adapter,
};

beforeEach(() => {
  backend = fakeBackend();
  authClients.public.defaults.adapter = backend.adapter;
  authClients.authenticated.defaults.adapter = backend.adapter;
  setAuthAdapter(myBackendAuthAdapter);
});

afterEach(() => {
  authClients.public.defaults.adapter = originalAdapters.public;
  authClients.authenticated.defaults.adapter = originalAdapters.authenticated;
  setAuthAdapter(null);
});

const signIn = () =>
  authService.login({ username: 'ada@example.com', password: 'secret' });

import { onSessionExpired } from '@/shared/session/session';

it('F5 revokes the refresh token on logout even when the access token has expired', async () => {
  await signIn();
  backend.state.validAccess.clear(); // access token expired (e.g. app idle for an hour)
  const expired = jest.fn();
  const off = onSessionExpired(expired);

  await authService.logout();
  off();

  console.log(JSON.stringify(backend.requests.slice(2), null, 1));
  console.log('session-expired emitted:', expired.mock.calls.length);
  expect(backend.state.validRefresh.has('refresh-1')).toBe(false);
});
