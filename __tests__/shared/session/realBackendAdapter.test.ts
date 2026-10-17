/**
 * Runs the example AuthAdapter in docs/connect-your-backend.md (taken from
 * the page itself, so the documented code is what is tested) against a fake
 * backend with the shapes that page describes: success responses in a
 * `{ data }` envelope, a tokens-only login plus GET /me, rotating refresh
 * tokens, an error envelope, and revocation on logout. The requests go
 * through the real auth clients, session service, and token stores.
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
import * as SecureStore from 'expo-secure-store';
import {
  authClients,
  authRefreshClients,
  authService,
  setAuthAdapter,
  type AuthAdapter,
} from '@/shared/session/authService';
import {
  defaultUnauthorizedHandler,
  onSessionExpired,
} from '@/shared/session/session';
import { STORAGE_KEYS } from '@/shared/storage/storage';
import { secureStore } from '@/testing';
import { linkDependencies } from '@/testing/projectCopy';

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
    /** Holds the refresh endpoint's answer (after rotating) until it resolves. */
    refreshGate: null as Promise<void> | null,
    /** Holds the revoke endpoint's answer until it resolves. */
    revokeGate: null as Promise<void> | null,
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
      const tokens = issue();
      // The backend has rotated the tokens; the answer is still on its way.
      await state.refreshGate;
      return respond(config, 200, tokens);
    }
    if (method === 'POST' && url === '/sessions/revoke') {
      // The refresh token is the credential; no access token needed.
      state.validRefresh.delete(refresh_token ?? '');
      await state.revokeGate;
      return respond(config, 204, null);
    }
    return respond(config, 404, failure('not_found', `${method} ${url}`));
  };
  return { adapter, requests, state };
}

let backend: ReturnType<typeof fakeBackend>;
const allClients = [
  authClients.public,
  authClients.authenticated,
  authRefreshClients.authenticated,
];
const originalAdapters = allClients.map(client => client.defaults.adapter);
let expired: jest.Mock;
let unsubscribe: () => void;

beforeEach(() => {
  backend = fakeBackend();
  for (const client of allClients) client.defaults.adapter = backend.adapter;
  setAuthAdapter(myBackendAuthAdapter);
  expired = jest.fn();
  unsubscribe = onSessionExpired(expired);
});

afterEach(() => {
  allClients.forEach((client, index) => {
    client.defaults.adapter = originalAdapters[index];
  });
  setAuthAdapter(null);
  unsubscribe();
});

const signIn = () =>
  authService.login({ username: 'ada@example.com', password: 'secret' });

describe('the documented AuthAdapter against a backend of another shape', () => {
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

  it.each([
    ['without the envelope', { access_token: 'a', refresh_token: 'r' }],
    ['without a refresh token', { data: { access_token: 'a' } }],
  ])(
    'rejects a login response %s with a readable message and stores nothing',
    async (_case, body) => {
      backend.state.nextBody = body;

      const error: unknown = await signIn().catch(caught => caught);

      expect(error).toMatchObject({
        message: 'Unexpected response from the server',
      });
      expect((error as Error).cause).toBeInstanceOf(Error); // zod's details
      expect(secureStore.size).toBe(0);
      expect(backend.requests.map(r => r.url)).toEqual(['/sessions']);
    }
  );

  it('rejects a user payload without the required fields', async () => {
    await signIn();
    backend.state.nextBody = { data: { email: 'ada@example.com' } };

    await expect(authService.fetchProfile()).rejects.toMatchObject({
      message: 'Unexpected response from the server',
    });
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

  it('keeps the session and the refresh token when the refresh fails offline', async () => {
    await signIn();
    backend.state.validAccess.clear();
    backend.state.refreshDown = true;

    await expect(authService.fetchProfile()).rejects.toMatchObject({
      code: 'network',
    });
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('access-1');
    expect(secureStore.get(REFRESH_KEY)).toBe('refresh-1');

    // Back online, the next request refreshes and succeeds.
    backend.state.refreshDown = false;
    await expect(authService.fetchProfile()).resolves.toMatchObject({
      email: expect.any(String),
    });
    expect(secureStore.get(REFRESH_KEY)).toBe('refresh-2');
  });

  it.each([
    ['read', 'getItemAsync'],
    ['stored', 'setItemAsync'],
  ] as const)(
    'keeps the session when the refresh token cannot be %s (a locked Keychain)',
    async (_case, call) => {
      await signIn();
      backend.state.validAccess.clear();
      const mock = jest.mocked(SecureStore[call]);
      const real = mock.getMockImplementation()!;
      mock.mockImplementation((async (key: string, value?: string) => {
        if (key === REFRESH_KEY)
          throw new Error('User interaction is not allowed.');
        return (real as (k: string, v?: string) => Promise<unknown>)(
          key,
          value
        );
      }) as never);

      await authService.fetchProfile().catch(() => undefined);
      mock.mockImplementation(real as never);

      expect(expired).not.toHaveBeenCalled();
      expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(true);
      expect(secureStore.get(REFRESH_KEY)).toBe('refresh-1');
    }
  );

  it("leaves the next session's refresh token alone when it signs in while logout reads the token", async () => {
    await signIn();
    let answerRevoke!: () => void;
    backend.state.revokeGate = new Promise(resolve => (answerRevoke = resolve));
    const getItem = jest.mocked(SecureStore.getItemAsync);
    const real = getItem.getMockImplementation()!;
    let holdRead = false;
    let releaseRead: (() => void) | undefined;
    getItem.mockImplementation((async (key: string) => {
      if (key === REFRESH_KEY && holdRead) {
        holdRead = false;
        await new Promise<void>(resolve => (releaseRead = resolve));
      }
      return real(key);
    }) as never);

    const loggingOut = authService.logout();
    await new Promise(resolve => setTimeout(resolve, 0));
    // The revoke returns; logout reads the stored token again, slowly...
    holdRead = true;
    answerRevoke();
    for (let i = 0; i < 20 && !releaseRead; i++) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    // ...and meanwhile the session expires and the user signs in again.
    await defaultUnauthorizedHandler();
    await signIn();
    releaseRead!();
    await loggingOut;

    expect(secureStore.get(REFRESH_KEY)).toBe('refresh-2');
    expect(backend.state.validRefresh).toEqual(new Set(['refresh-2']));
  });

  it('keeps no refresh token when a refresh stores its rotated token after logout cleared', async () => {
    await signIn();
    backend.state.validAccess.clear();
    const setItem = jest.mocked(SecureStore.setItemAsync);
    const real = setItem.getMockImplementation()!;
    let releaseWrite: (() => void) | undefined;
    setItem.mockImplementation((async (key: string, value: string) => {
      if (key === REFRESH_KEY && value === 'refresh-2') {
        // The refresh passed its checks; its write is slow...
        await new Promise<void>(resolve => (releaseWrite = resolve));
      }
      return real(key, value);
    }) as never);

    const profile = authService.fetchProfile().catch((e: unknown) => e);
    for (let i = 0; i < 20 && !releaseWrite; i++) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    // ...and meanwhile the user signs out completely.
    await authService.logout();
    releaseWrite!();
    await profile;

    expect(secureStore.get(REFRESH_KEY)).toBeUndefined();
    expect(backend.state.validRefresh.size).toBe(0);
  });

  it('signs out and still clears the refresh token while the Keychain stays locked for reads', async () => {
    await signIn();
    const getItem = jest.mocked(SecureStore.getItemAsync);
    const real = getItem.getMockImplementation()!;
    getItem.mockImplementation((async (key: string) => {
      if (key === REFRESH_KEY) {
        throw new Error('User interaction is not allowed.');
      }
      return real(key);
    }) as never);

    await expect(authService.logout()).resolves.toBeUndefined();
    getItem.mockImplementation(real);
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    expect(secureStore.has(REFRESH_KEY)).toBe(false);
  });

  it("a refresh rejected after a sign-out + sign-in keeps the new session's refresh token", async () => {
    await signIn();
    backend.state.validAccess.clear();
    const realAdapter = backend.adapter;
    let releaseRefresh!: () => void;
    const held = new Promise<void>(r => (releaseRefresh = r));
    const delayed: typeof realAdapter = async config => {
      if (config.url === '/sessions/refresh') await held; // request still on the wire
      return realAdapter(config);
    };
    for (const client of allClients) client.defaults.adapter = delayed;

    const profile = authService.fetchProfile().catch((e: unknown) => e);
    for (let i = 0; i < 20; i++) await new Promise(r => setTimeout(r, 0));
    await authService.logout(); // revokes refresh-1
    await signIn(); // refresh-2 stored
    expect(secureStore.get(REFRESH_KEY)).toBe('refresh-2');
    releaseRefresh(); // server: refresh-1 revoked -> 401 -> adapter clears
    await profile;
    for (let i = 0; i < 20; i++) await new Promise(r => setTimeout(r, 0));
    expect(secureStore.get(REFRESH_KEY)).toBe('refresh-2');
  });

  it('revokes the refresh token on logout', async () => {
    await signIn();

    await authService.logout();

    expect(backend.requests.at(-1)).toEqual({
      method: 'POST',
      url: '/sessions/revoke',
      authorization: undefined,
      body: { refresh_token: 'refresh-1' },
    });
    expect(backend.state.validRefresh.has('refresh-1')).toBe(false);
    expect(secureStore.size).toBe(0);
  });

  it('revokes the refresh token on logout after the access token expired', async () => {
    await signIn();
    backend.state.validAccess.clear();

    await authService.logout();

    expect(backend.requests.map(r => r.url)).toEqual([
      '/sessions',
      '/me',
      '/sessions/revoke',
    ]);
    expect(backend.state.validRefresh.size).toBe(0);
    expect(secureStore.size).toBe(0);
    expect(expired).not.toHaveBeenCalled();
  });

  it('keeps the next session when a slow logout finishes after the user signed in again', async () => {
    await signIn();
    let answer!: () => void;
    backend.state.revokeGate = new Promise(resolve => (answer = resolve));

    const loggingOut = authService.logout();
    // The revoke is on its way; meanwhile the session expires and the user
    // signs in again.
    await new Promise(resolve => setTimeout(resolve, 0));
    await defaultUnauthorizedHandler();
    await signIn();
    answer();
    await loggingOut;

    expect(secureStore.get('auth_token')).toBe('access-2');
    expect(secureStore.get('refresh_token')).toBe('refresh-2');
    expect(backend.state.validRefresh).toEqual(new Set(['refresh-2']));
  });

  it('revokes, and keeps nothing from, a refresh that finishes after logout', async () => {
    await signIn();
    backend.state.validAccess.clear();
    let answer!: () => void;
    backend.state.refreshGate = new Promise(resolve => (answer = resolve));

    const profile = authService.fetchProfile().catch((error: unknown) => error);
    // The refresh is on its way; meanwhile the user signs out.
    await new Promise(resolve => setTimeout(resolve, 0));
    await authService.logout();
    answer();

    await expect(profile).resolves.toMatchObject({ code: 'unauthorized' });
    expect(secureStore.size).toBe(0);
    expect(backend.state.validRefresh.size).toBe(0);
    expect(backend.requests.at(-1)).toMatchObject({
      url: '/sessions/revoke',
      body: { refresh_token: 'refresh-2' },
    });
  });

  it('leaves no refresh token when a refresh rotates while logout revokes', async () => {
    await signIn();
    backend.state.validAccess.clear();
    let answerRefresh!: () => void;
    backend.state.refreshGate = new Promise(
      resolve => (answerRefresh = resolve)
    );
    let answerRevoke!: () => void;
    backend.state.revokeGate = new Promise(resolve => (answerRevoke = resolve));

    // A 401 starts a refresh; the backend rotates refresh-1 to refresh-2.
    const profile = authService.fetchProfile().catch((error: unknown) => error);
    await new Promise(resolve => setTimeout(resolve, 0));
    // The user signs out: the revoke of refresh-1 is on its way when the
    // refresh answer arrives and stores refresh-2.
    const loggingOut = authService.logout();
    await new Promise(resolve => setTimeout(resolve, 0));
    answerRefresh();
    // The refresh sees the sign-out and revokes its rotated token too.
    answerRevoke();
    await profile;
    await loggingOut;

    expect(secureStore.get(REFRESH_KEY)).toBeUndefined();
    expect(secureStore.get('auth_token')).toBeUndefined();
    expect(backend.state.validRefresh.size).toBe(0);
  });

  it('leaves no live refresh token when a refresh starts while logout is running', async () => {
    await signIn();
    backend.state.validAccess.clear();
    const getItem = jest.mocked(SecureStore.getItemAsync);
    const realGet = getItem.getMockImplementation()!;
    const holds: Promise<void>[] = [];
    getItem.mockImplementation((async (key: string, options: unknown) => {
      if (key === REFRESH_KEY && holds.length) await holds.shift();
      return (realGet as (k: string, o: unknown) => Promise<string | null>)(
        key,
        options
      );
    }) as never);
    const gate = () => {
      let open!: () => void;
      const p = new Promise<void>(r => (open = r));
      return { p, open };
    };
    const tick = async () => {
      for (let i = 0; i < 20; i++) await new Promise(r => setTimeout(r, 0));
    };

    const logoutGet = gate();
    const refreshGet = gate();
    holds.push(logoutGet.p, refreshGet.p);
    const refreshAnswer = gate();
    backend.state.refreshGate = refreshAnswer.p;
    const revokeAnswer = gate();
    backend.state.revokeGate = revokeAnswer.p;

    // The user taps sign out (signOuts += 1; reading the refresh token).
    const loggingOut = authService.logout();
    await tick();
    // Meanwhile a screen's request gets a 401: a refresh starts.
    const profile = authService.fetchProfile().catch((e: unknown) => e);
    await tick();
    refreshGet.open();
    await tick(); // the refresh reaches the server first: refresh-1 -> refresh-2
    logoutGet.open();
    await tick(); // then logout revokes refresh-1
    // Both now re-read the stored refresh token at about the same time.
    const reads = gate();
    holds.push(reads.p, reads.p);
    revokeAnswer.open();
    await tick();
    refreshAnswer.open();
    await tick();
    reads.open();
    await loggingOut;
    await profile;
    await tick();

    expect(secureStore.get(REFRESH_KEY)).toBeUndefined();
    expect(backend.state.validRefresh.size).toBe(0);
  });

  it('signs out locally when the backend is unreachable on logout', async () => {
    await signIn();
    backend.state.down = true;

    await expect(authService.logout()).resolves.toBeUndefined();

    expect(backend.requests.at(-1)).toMatchObject({
      method: 'POST',
      url: '/sessions/revoke',
    });
    expect(secureStore.size).toBe(0);
  });
});
