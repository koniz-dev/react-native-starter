/**
 * Where the token goes, and when a 401 may refresh or end the session.
 */
import {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';
import { inspect } from 'util';
import { toApiError } from '@/shared/http/apiError';
import { createHttpClient, getOrigin } from '@/shared/http/httpClient';
import {
  onSessionExpired,
  refreshAccessToken,
  setRefreshTokenHandler,
  setUnauthorizedHandler,
} from '@/shared/session/session';
import { authService, setAuthAdapter } from '@/shared/session/authService';
import { setItem, STORAGE_KEYS } from '@/shared/storage/storage';
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

  it.each([
    ['network', () => networkError()],
    [
      'timeout',
      () => new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED'),
    ],
    [
      'server',
      () =>
        new AxiosError(
          'Request failed',
          'ERR_BAD_RESPONSE',
          undefined,
          undefined,
          {
            status: 503,
            statusText: '503',
            data: {},
            headers: {},
            config: {} as InternalAxiosRequestConfig,
          }
        ),
    ],
  ])(
    'keeps the session when the refresh fails with a %s error',
    async (code, failure) => {
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
  it('keeps no headers or request body', () => {
    const config = {
      method: 'post',
      url: '/auth/login?next=%2Fhome',
      headers: { Authorization: 'Bearer SECRET-TOKEN' },
      data: '{"username":"u","password":"hunter2"}',
    } as unknown as InternalAxiosRequestConfig;

    for (const error of [httpError(config, 400), networkError(config)]) {
      const dump = inspect(toApiError(error), { depth: 20, showHidden: true });
      expect(dump).not.toMatch(/SECRET-TOKEN|hunter2/);
      expect(dump).toContain('/auth/login');
    }
  });
});
