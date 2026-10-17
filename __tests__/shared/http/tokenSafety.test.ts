/**
 * Where the token goes, and when a 401 may refresh or end the session.
 */
import {
  AxiosError,
  CanceledError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';
import { inspect } from 'util';
import { Platform } from 'react-native';
import { ApiError, toApiError } from '@/shared/http/apiError';
import { createHttpClient, getOrigin } from '@/shared/http/httpClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onSessionExpired,
  refreshAccessToken,
  setRefreshTokenHandler,
  setUnauthorizedHandler,
} from '@/shared/session/session';
import { getTokenStore, setTokenStore } from '@/shared/session/tokenStore';
import {
  authRefreshClients,
  authService,
  setAuthAdapter,
} from '@/shared/session/authService';
import { getItem, setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { getConfig } from '@/shared/config/env';
import { logger } from '@/shared/lib/logger';
import { secureStore } from '@/testing';

jest.mock('@/shared/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

function response(config: InternalAxiosRequestConfig, status: number) {
  return { config, status, data: {}, statusText: String(status), headers: {} };
}

function httpError(config: InternalAxiosRequestConfig, status: number) {
  return new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_REQUEST',
    config,
    undefined,
    response(config, status)
  );
}

function networkError(config?: InternalAxiosRequestConfig) {
  return new AxiosError('Network Error', 'ERR_NETWORK', config);
}

function authenticatedClient(adapter: AxiosAdapter) {
  const client = createHttpClient({
    getBaseURL: () => getConfig().authApiUrl,
    authenticated: true,
  });
  client.defaults.adapter = adapter;
  return client;
}

async function signIn(token = 't1') {
  secureStore.set(STORAGE_KEYS.AUTH_TOKEN, token);
  await setItem(STORAGE_KEYS.USER_DATA, { id: 1, email: 'e@x.com', name: 'E' });
}

/** A promise with its resolve function, to control when a step finishes. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => (resolve = r));
  return { promise, resolve };
}

describe('token safety', () => {
  let expired: jest.Mock;
  let unsubscribe: () => void;

  beforeEach(() => {
    setRefreshTokenHandler(null);
    setUnauthorizedHandler(null);
    setAuthAdapter(null);
    expired = jest.fn();
    unsubscribe = onSessionExpired(expired);
  });

  afterEach(() => unsubscribe());

  it('ignores a 401 from an untrusted origin that got its own Authorization header', async () => {
    await signIn('t1');
    const refresh = jest.fn(async () => {
      secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 't2');
      return 't2';
    });
    setRefreshTokenHandler(refresh);
    const seen: unknown[] = [];
    const client = authenticatedClient(async config => {
      seen.push(config.headers.Authorization);
      throw httpError(config, 401);
    });

    await expect(
      client.get('https://third-party.example.net/v1/x', {
        headers: { Authorization: 'Bearer THIRD-PARTY-KEY' },
      })
    ).rejects.toMatchObject({ code: 'unauthorized' });

    expect(seen).toEqual(['Bearer THIRD-PARTY-KEY']);
    expect(refresh).not.toHaveBeenCalled();
    expect(expired).not.toHaveBeenCalled();
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('t1');
  });

  it.each([
    'https://evil.example\\@auth.example.com/x',
    'https://evil.example\\.auth.example.com/x',
    'https://auth.exa\tmple.com/x',
    'https://auth.example.com\n/x',
    'https://auth.example.com /x',
  ])('treats %j as untrusted', async url => {
    expect(getOrigin(url)).toBeNull();
    await signIn('t1');
    const seen: unknown[] = [];
    const client = createHttpClient({
      getBaseURL: () => 'https://auth.example.com',
      authenticated: true,
    });
    client.defaults.adapter = async config => {
      seen.push(config.headers.Authorization);
      return response(config, 200);
    };
    await client.get(url);
    expect(seen).toEqual([undefined]);
  });

  const statusError = (status: number) =>
    new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
      status,
      statusText: String(status),
      data: {},
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

  it.each([
    ['a network', 'network', () => networkError()],
    [
      'a timeout',
      'timeout',
      () => new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED'),
    ],
    ['a canceled', 'canceled', () => new CanceledError('canceled')],
    ['a server', 'server', () => statusError(503)],
    ['a 408', 'client', () => statusError(408)],
    ['a 429 (rate limited)', 'client', () => statusError(429)],
  ])(
    'keeps the session when the refresh fails with %s error',
    async (_label, code, failure) => {
      await signIn('t1');
      setRefreshTokenHandler(async () => {
        throw failure();
      });
      const client = authenticatedClient(async config => {
        throw httpError(config, 401);
      });

      await expect(client.get('/me')).rejects.toMatchObject({ code });
      expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('t1');
      expect(expired).not.toHaveBeenCalled();
    }
  );

  it('keeps the session when the 401 came after a redirect, which iOS follows without the token', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    await signIn('t1');
    const refresh = jest.fn(async () => 't2');
    setRefreshTokenHandler(refresh);
    const client = authenticatedClient(async config => {
      const error = httpError(config, 401);
      // What XMLHttpRequest reports after following /notes -> /notes/.
      error.request = { responseURL: `${client.getUri(config)}/` };
      throw error;
    });

    const error = await client.get('/notes').catch((e: unknown) => e);
    expect(error).toMatchObject({ code: 'unauthorized' });
    expect(refresh).not.toHaveBeenCalled();
    expect(expired).not.toHaveBeenCalled();
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('t1');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('redirected'),
      expect.anything()
    );
  });

  it.each([['/users/José'], ['/notes/a b'], ['/notes/{id}'], ['/a/./b']])(
    'on iOS, still refreshes a 401 at %s that the platform reports encoded (no redirect)',
    async path => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      await signIn('t1');
      const refresh = jest.fn(async () => 't2');
      setRefreshTokenHandler(refresh);
      const client = authenticatedClient(async config => {
        if (config.headers.Authorization === 'Bearer t2') {
          return response(config, 200);
        }
        const error = httpError(config, 401);
        // The same URL, serialized the way the platform reports it.
        error.request = { responseURL: new URL(client.getUri(config)).href };
        throw error;
      });

      await client.get(path);
      expect(refresh).toHaveBeenCalledTimes(1);
    }
  );

  it('on Android, ends the session for a 401 after a same-origin redirect (the token was sent)', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    await signIn('t1');
    const client = authenticatedClient(async config => {
      const error = httpError(config, 401);
      error.request = { responseURL: `${client.getUri(config)}/` };
      throw error;
    });

    await client.get('/notes').catch(() => undefined);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('still ends the session for a 401 at the requested URL', async () => {
    await signIn('t1');
    const client = authenticatedClient(async config => {
      const error = httpError(config, 401);
      error.request = { responseURL: client.getUri(config) };
      throw error;
    });

    await client.get('/notes').catch(() => undefined);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBeUndefined();
  });

  it('keeps the session, and fails with an ApiError, when the token cannot be read after a 401', async () => {
    await signIn('t1');
    const refresh = jest.fn(async () => 't2');
    setRefreshTokenHandler(refresh);
    const client = authenticatedClient(async config => {
      // Such as the Keychain once the device is locked.
      jest
        .spyOn(getTokenStore(), 'get')
        .mockRejectedValueOnce(new Error('User interaction is not allowed.'));
      throw httpError(config, 401);
    });

    const error = await client.get('/me').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'unauthorized' });
    expect(logger.warn).toHaveBeenCalledWith(
      'Reading the token after a 401 failed',
      { error: 'User interaction is not allowed.' }
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('t1');
    expect(expired).not.toHaveBeenCalled();
  });

  it('retries with the current token, without refreshing, when the 401 was for an older one', async () => {
    await signIn('t1');
    const refresh = jest.fn(async () => 'never');
    setRefreshTokenHandler(refresh);
    const seen: unknown[] = [];
    const client = authenticatedClient(async config => {
      seen.push(config.headers.Authorization);
      if (config.headers.Authorization === 'Bearer t1') {
        // Another request refreshed the token while this one was in flight.
        secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 't2');
        throw httpError(config, 401);
      }
      return response(config, 200);
    });

    await expect(client.get('/me')).resolves.toMatchObject({ status: 200 });
    expect(seen).toEqual(['Bearer t1', 'Bearer t2']);
    expect(refresh).not.toHaveBeenCalled();
    expect(expired).not.toHaveBeenCalled();
  });

  it('does not end a newer session for a 401 sent with a token that is gone', async () => {
    await signIn('t1');
    const client = authenticatedClient(async config => {
      // The user signed out and in again while this request was in flight.
      secureStore.delete(STORAGE_KEYS.AUTH_TOKEN);
      throw httpError(config, 401);
    });

    await expect(client.get('/me')).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(expired).not.toHaveBeenCalled();
  });

  it('retries with the token the refresh returned', async () => {
    await signIn('t1');
    // A handler that returns the token without storing it.
    setRefreshTokenHandler(async () => 't2');
    const seen: unknown[] = [];
    const client = authenticatedClient(async config => {
      seen.push(config.headers.Authorization);
      if (config.headers.Authorization === 'Bearer t1') {
        throw httpError(config, 401);
      }
      return response(config, 200);
    });

    await expect(client.get('/me')).resolves.toMatchObject({ status: 200 });
    expect(seen).toEqual(['Bearer t1', 'Bearer t2']);
  });

  it('does not store a refreshed token after the user signed out', async () => {
    await signIn('t1');
    const finishRefresh = deferred<string>();
    setAuthAdapter({
      login: async () => ({ token: 'x', user: {} }),
      normalizeUser: () => ({ id: 1, email: 'e@x.com', name: 'E' }),
      refresh: () => finishRefresh.promise,
    });

    const refreshing = refreshAccessToken();
    await authService.logout();
    finishRefresh.resolve('t2');

    await expect(refreshing).resolves.toBeNull();
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
  });
});

describe('work that outlives its session', () => {
  let expired: jest.Mock;
  let unsubscribe: () => void;

  /** Signs in through the service, as a user with the given token and id. */
  function useAdapter(extra: Partial<Parameters<typeof setAuthAdapter>[0]>) {
    setAuthAdapter({
      login: async ({ username }) => ({
        token: `token-${username}`,
        user: { id: username, email: `${username}@x.com` },
      }),
      normalizeUser: raw => {
        const user = raw as { id: string; email: string };
        return { id: user.id, email: user.email, name: user.email };
      },
      ...extra,
    });
  }

  const signInAs = (username: string) =>
    authService.login({ username, password: 'p' });

  beforeEach(() => {
    setRefreshTokenHandler(null);
    setUnauthorizedHandler(null);
    setTokenStore(null);
    expired = jest.fn();
    unsubscribe = onSessionExpired(expired);
  });

  afterEach(() => {
    unsubscribe();
    setTokenStore(null);
    setAuthAdapter(null);
  });

  it("doesn't end the next user's session when an old refresh finds nothing to refresh", async () => {
    const finishRefresh = deferred<string>();
    useAdapter({ refresh: () => finishRefresh.promise });
    await signInAs('A');
    const client = authenticatedClient(async config => {
      throw httpError(config, 401);
    });

    const request = client.get('/me');
    // The 401 started a refresh; meanwhile A signs out and B signs in.
    await new Promise(resolve => setTimeout(resolve, 0));
    await authService.logout();
    await signInAs('B');
    finishRefresh.resolve('token-A2');

    await expect(request).rejects.toMatchObject({ code: 'unauthorized' });
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('token-B');
    expect(expired).not.toHaveBeenCalled();
  });

  it("doesn't let the next user's 401 join an earlier user's refresh", async () => {
    const refreshes: ReturnType<typeof deferred<string>>[] = [];
    useAdapter({
      refresh: () => {
        const next = deferred<string>();
        refreshes.push(next);
        return next.promise;
      },
    });
    await signInAs('A');
    let calls = 0;
    const client = authenticatedClient(async config => {
      calls += 1;
      if (calls <= 2) throw httpError(config, 401);
      return response(config, 200);
    });

    const first = client.get('/a').catch(() => undefined);
    await new Promise(resolve => setTimeout(resolve, 0));
    await authService.logout();
    await signInAs('B');
    const second = client.get('/b');
    await new Promise(resolve => setTimeout(resolve, 0));

    // B's 401 started its own refresh; A's finishes and is discarded.
    expect(refreshes).toHaveLength(2);
    refreshes[0]?.resolve('token-A2');
    refreshes[1]?.resolve('token-B2');
    await first;

    await expect(second).resolves.toMatchObject({ status: 200 });
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('token-B2');
    expect(expired).not.toHaveBeenCalled();
  });

  it('rejects with an ApiError and ends the session even if clearing it fails', async () => {
    useAdapter({});
    await signInAs('A');
    jest
      .spyOn(AsyncStorage, 'removeItem')
      .mockRejectedValueOnce(new Error('disk full'));
    const client = authenticatedClient(async config => {
      throw httpError(config, 401);
    });

    const error = await client.get('/me').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'unauthorized' });
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(jest.mocked(logger.error)).toHaveBeenCalledWith(
      'The unauthorized handler failed',
      expect.any(Error)
    );
  });

  it("doesn't replay an earlier user's request with the next user's token", async () => {
    useAdapter({});
    await signInAs('A');
    const seen: unknown[] = [];
    const client = authenticatedClient(async config => {
      seen.push(config.headers.Authorization);
      if (seen.length === 1) {
        // A signs out (the backend revokes the token) and B signs in.
        await authService.logout();
        await signInAs('B');
        throw httpError(config, 401);
      }
      return response(config, 200);
    });

    await expect(client.post('/orders', { item: 1 })).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(seen).toEqual(['Bearer token-A']);
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('token-B');
    expect(expired).not.toHaveBeenCalled();
  });

  it("doesn't refresh for a 401 sent in an earlier session with the same token", async () => {
    const refresh = jest.fn(async () => 'token-A2');
    useAdapter({ refresh });
    await signInAs('A');
    const client = authenticatedClient(async config => {
      // A signs out and in again, and the backend issues the same token.
      await authService.logout();
      await signInAs('A');
      throw httpError(config, 401);
    });

    await expect(client.get('/me')).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(refresh).not.toHaveBeenCalled();
    expect(expired).not.toHaveBeenCalled();
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('token-A');
  });

  it('signs out, never waits forever, when the refresh itself gets a 401', async () => {
    // A backend that wants the old access token with the refresh token.
    useAdapter({
      refresh: async ({ authenticated }) => {
        await authenticated.post('/sessions/refresh');
        return 'token-A2';
      },
    });
    await signInAs('A');
    const original = authRefreshClients.authenticated.defaults.adapter;
    const rejectAll: AxiosAdapter = async config => {
      throw httpError(config, 401);
    };
    authRefreshClients.authenticated.defaults.adapter = rejectAll;
    const client = authenticatedClient(rejectAll);

    try {
      await expect(client.get('/me')).rejects.toMatchObject({
        code: 'unauthorized',
      });
      expect(expired).toHaveBeenCalledTimes(1);
      expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
      // The next session's 401 isn't stuck behind it either.
      await signInAs('B');
      await expect(client.get('/me')).rejects.toMatchObject({
        code: 'unauthorized',
      });
      expect(expired).toHaveBeenCalledTimes(2);
    } finally {
      authRefreshClients.authenticated.defaults.adapter = original;
    }
  });

  it("doesn't send a retry once its session has ended", async () => {
    useAdapter({});
    await signInAs('A');
    const store = getTokenStore();
    let reads = 0;
    setTokenStore({
      ...store,
      get: async () => {
        reads += 1;
        // The retry reads the token after the user signed out.
        if (reads === 3) await authService.logout();
        return store.get();
      },
    });
    const seen: unknown[] = [];
    const client = authenticatedClient(async config => {
      seen.push(config.headers.Authorization);
      // Another request refreshed the token while this one was in flight.
      await store.set('token-A2');
      throw httpError(config, 401);
    });

    await expect(client.get('/me')).rejects.toMatchObject({ code: 'canceled' });
    expect(seen).toEqual(['Bearer token-A']);
  });

  it("doesn't replay a request as the next user when the session changed while its token was read", async () => {
    useAdapter({});
    await signInAs('A');
    const store = getTokenStore();
    const read = deferred<string | null>();
    let first = true;
    setTokenStore({
      ...store,
      get: () => {
        if (!first) return store.get();
        first = false;
        return read.promise;
      },
    });
    const seen: unknown[] = [];
    const client = authenticatedClient(async config => {
      seen.push(config.headers.Authorization);
      throw httpError(config, 401);
    });

    const request = client.get('/me').catch((e: unknown) => e);
    // While A's token is being read, A signs out and B signs in.
    await new Promise(resolve => setTimeout(resolve, 0));
    await authService.logout();
    await signInAs('B');
    read.resolve('token-A');

    await expect(request).resolves.toMatchObject({ code: 'unauthorized' });
    expect(seen).toEqual(['Bearer token-A']);
    expect(expired).not.toHaveBeenCalled();
  });

  it('sends a retry without a token as just that, not with the old header', async () => {
    useAdapter({});
    await signInAs('A');
    const store = getTokenStore();
    const reads = ['token-A', 'token-A2', null];
    setTokenStore({ ...store, get: async () => reads.shift() ?? null });
    const seen: unknown[] = [];
    const client = authenticatedClient(async config => {
      seen.push(config.headers.Authorization);
      if (seen.length === 1) throw httpError(config, 401);
      return response(config, 200);
    });

    await client.get('/me');
    expect(seen).toEqual(['Bearer token-A', undefined]);
  });

  it.each([
    ['signed out', async () => undefined, null],
    ['signed in as someone else', () => signInAs('B'), 'B'],
  ])(
    "doesn't store a profile that loads after the user %s",
    async (_, next, storedId) => {
      const finishFetch = deferred<unknown>();
      useAdapter({ fetchUser: () => finishFetch.promise });
      await signInAs('A');

      const loading = authService.fetchProfile();
      await authService.logout();
      await next();
      finishFetch.resolve({ id: 'A', email: 'A@x.com' });

      await expect(loading).resolves.toBeNull();
      const stored = await getItem<{ id: string }>(STORAGE_KEYS.USER_DATA);
      expect(stored?.id ?? null).toBe(storedId);
    }
  );

  it('leaves no token behind when storing the profile at sign-in fails', async () => {
    useAdapter({});
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error('storage full'));

    await expect(signInAs('A')).rejects.toThrow('storage full');
    expect(await authService.isAuthenticated()).toBe(false);
  });
});

describe('request failure logs', () => {
  it('leave out the query string and fragment', async () => {
    const client = authenticatedClient(async config => {
      throw new AxiosError('Bad', 'ERR_BAD_REQUEST', config, undefined, {
        ...response(config, 400),
      });
    });
    await expect(
      client.get('/reset?token=SECRET-TOKEN#frag')
    ).rejects.toMatchObject({ code: 'client' });
    expect(jest.mocked(logger.info)).toHaveBeenCalledWith(
      'API GET /reset failed: client (400)'
    );
  });
});

describe('ApiError cause', () => {
  it('keeps no headers, request body, or query string', () => {
    const config = {
      method: 'post',
      url: '/auth/login?access_token=SECRET-QUERY&next=%2Fhome#frag',
      headers: { Authorization: 'Bearer SECRET-TOKEN' },
      data: '{"username":"u","password":"hunter2"}',
    } as unknown as InternalAxiosRequestConfig;

    for (const error of [httpError(config, 400), networkError(config)]) {
      const dump = inspect(toApiError(error), { depth: 20, showHidden: true });
      expect(dump).not.toMatch(/SECRET-TOKEN|hunter2|SECRET-QUERY|frag/);
      expect(dump).toContain('/auth/login');
    }
  });
});
