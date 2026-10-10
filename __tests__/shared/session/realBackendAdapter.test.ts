/**
 * Runs the example AuthAdapter in docs/connect-your-backend.md (taken from
 * the page itself, so the documented code is what is tested) against a fake
 * backend with the shapes that page describes: a tokens-only login plus
 * GET /me, rotating refresh tokens, an error envelope, and revocation on
 * logout. The requests go through the real auth clients, session service,
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

const ROOT = path.resolve(__dirname, '../../..');
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
  fs.symlinkSync(
    path.join(ROOT, 'node_modules'),
    path.join(snippetDir, 'node_modules')
  );
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
    const response = {
      data,
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
      if (!state.validRefresh.delete(refresh_token ?? '')) {
        return respond(config, 401, failure('invalid_refresh', 'Revoked'));
      }
      return respond(config, 200, issue());
    }
    if (method === 'DELETE' && url === '/sessions') {
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

describe('the documented AuthAdapter against a non-DummyJSON backend', () => {
  it('signs in with a tokens-only response, loading the user from /me', async () => {
    await expect(signIn()).resolves.toEqual({
      token: 'access-1',
      user: { id: 'u-1', email: 'ada@example.com', name: 'Ada Lovelace' },
    });

    expect(backend.requests.slice(0, 2)).toEqual([
      {
        method: 'POST',
        url: '/sessions',
        authorization: undefined,
        body: { email: 'ada@example.com', password: 'secret' },
      },
      {
        method: 'GET',
        url: '/me',
        authorization: 'Bearer access-1',
        body: undefined,
      },
    ]);
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('access-1');
    expect(secureStore.get(REFRESH_KEY)).toBe('refresh-1');
  });

  it("shows the envelope's message for a wrong password and stores nothing", async () => {
    await expect(
      authService.login({ username: 'ada@example.com', password: 'nope' })
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'Wrong email or password',
    });
    expect(secureStore.size).toBe(0);
  });

  it('refreshes on a 401 with rotation, keeping only the newest refresh token', async () => {
    await signIn();
    backend.state.validAccess.clear(); // the access token expires

    await expect(authService.fetchProfile()).resolves.toMatchObject({
      id: 'u-1',
    });
    expect(backend.requests.filter(r => r.url === '/sessions/refresh')).toEqual(
      [expect.objectContaining({ body: { refresh_token: 'refresh-1' } })]
    );
    expect(backend.requests.at(-1)).toMatchObject({
      url: '/me',
      authorization: 'Bearer access-2',
    });
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('access-2');
    expect(secureStore.get(REFRESH_KEY)).toBe('refresh-2');

    // The next expiry uses the rotated token (refresh-1 no longer works).
    backend.state.validAccess.clear();
    await authService.fetchProfile();
    expect(secureStore.get(REFRESH_KEY)).toBe('refresh-3');
  });

  it('signs out and drops the refresh token when the refresh is rejected', async () => {
    await signIn();
    backend.state.validAccess.clear();
    backend.state.validRefresh.clear(); // revoked elsewhere

    await expect(authService.fetchProfile()).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    expect(secureStore.has(REFRESH_KEY)).toBe(false);
  });

  it('revokes the refresh token on logout, with the access token still sent', async () => {
    await signIn();

    await authService.logout();

    expect(backend.requests.at(-1)).toEqual({
      method: 'DELETE',
      url: '/sessions',
      authorization: 'Bearer access-1',
      body: { refresh_token: 'refresh-1' },
    });
    expect(backend.state.validRefresh.has('refresh-1')).toBe(false);
    expect(secureStore.size).toBe(0);
  });

  it('signs out locally when the backend is unreachable on logout', async () => {
    await signIn();
    backend.state.down = true;

    await expect(authService.logout()).resolves.toBeUndefined();

    expect(backend.requests.at(-1)).toMatchObject({
      method: 'DELETE',
      url: '/sessions',
    });
    expect(secureStore.size).toBe(0);
  });
});
