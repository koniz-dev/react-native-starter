import {
  AxiosError,
  AxiosHeaders,
  CanceledError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, toApiError } from '@/shared/http/apiError';
import { createHttpClient } from '@/shared/http/httpClient';
import {
  onSessionExpired,
  setRefreshTokenHandler,
  setUnauthorizedHandler,
} from '@/shared/session/session';
import {
  authClients,
  authService,
  setAuthAdapter,
  type AuthAdapter,
} from '@/shared/session/authService';

const authApi = authClients.public;

/** Minimal adapter: POST /auth/login → { accessToken, id, email }. */
const testAuthAdapter: AuthAdapter = {
  login: async (credentials, { public: http }) => {
    const { data } = await http.post('/auth/login', credentials);
    return { token: data.accessToken, user: data };
  },
  normalizeUser: raw => {
    const data = raw as { id: number; email: string };
    return { id: data.id, email: data.email, name: data.email };
  },
};
import { getItem, setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { DEFAULT_API_TIMEOUT_MS, getConfig } from '@/shared/config/env';
import { secureStore } from '@/testing';

jest.mock('@/shared/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const user = { id: 1, email: 'e@example.com', name: 'Emily' };

function response(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown = {}
) {
  return { config, status, data, statusText: String(status), headers: {} };
}

function httpError(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown = {}
) {
  return new AxiosError(
    `Request failed with status code ${status}`,
    status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST',
    config,
    undefined,
    response(config, status, data)
  );
}

/** A client whose base URL is the auth origin, so the token is attached. */
function authenticatedClient(adapter: AxiosAdapter) {
  const client = createHttpClient({
    getBaseURL: () => getConfig().authApiUrl,
    authenticated: true,
  });
  client.defaults.adapter = adapter;
  return client;
}

async function signIn(token = 'old-token') {
  secureStore.set(STORAGE_KEYS.AUTH_TOKEN, token);
  await setItem(STORAGE_KEYS.USER_DATA, user);
}

describe('createHttpClient', () => {
  let expired: jest.Mock;
  let unsubscribe: () => void;

  beforeEach(async () => {
    setRefreshTokenHandler(null);
    setUnauthorizedHandler(null);
    expired = jest.fn();
    unsubscribe = onSessionExpired(expired);
  });

  afterEach(() => unsubscribe());

  it('applies the configured timeout and base URL', async () => {
    let seen: InternalAxiosRequestConfig | undefined;
    const client = authenticatedClient(async config => {
      seen = config;
      return response(config, 200);
    });
    await client.get('/ping');
    expect(seen?.timeout).toBe(DEFAULT_API_TIMEOUT_MS);
    expect(seen?.baseURL).toBe(getConfig().authApiUrl);
  });

  it('maps a timeout to code "timeout"', async () => {
    const client = authenticatedClient(async config => {
      throw new AxiosError(
        'timeout of 15000ms exceeded',
        'ECONNABORTED',
        config
      );
    });
    await expect(client.get('/slow')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'timeout',
    });
  });

  it('maps a request without a response to code "network"', async () => {
    const client = authenticatedClient(async config => {
      throw new AxiosError('Network Error', 'ERR_NETWORK', config);
    });
    const rejection = client.get('/offline');
    await expect(rejection).rejects.toBeInstanceOf(ApiError);
    await expect(rejection).rejects.toMatchObject({ code: 'network' });
  });

  it('maps an aborted request to code "canceled"', async () => {
    const client = authenticatedClient(async config => {
      throw new CanceledError(undefined, undefined, config);
    });
    await expect(client.get('/aborted')).rejects.toMatchObject({
      code: 'canceled',
    });
  });

  it('clears the session and emits session-expired on a 401 with no refresh handler', async () => {
    await signIn();
    const client = authenticatedClient(async config => {
      throw httpError(config, 401, { message: 'Token expired' });
    });

    await expect(client.get('/me')).rejects.toMatchObject({
      code: 'unauthorized',
      status: 401,
      message: 'Token expired',
    });
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    expect(await getItem(STORAGE_KEYS.USER_DATA)).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('refreshes once and retries the request with the new token', async () => {
    await signIn('old-token');
    setRefreshTokenHandler(async () => {
      secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'new-token');
      return 'new-token';
    });
    const seenTokens: unknown[] = [];
    const client = authenticatedClient(async config => {
      seenTokens.push(config.headers.Authorization);
      if (config.headers.Authorization === 'Bearer old-token') {
        throw httpError(config, 401);
      }
      return response(config, 200, { ok: true });
    });

    await expect(client.get('/me')).resolves.toMatchObject({
      data: { ok: true },
    });
    expect(seenTokens).toEqual(['Bearer old-token', 'Bearer new-token']);
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('new-token');
    expect(await getItem(STORAGE_KEYS.USER_DATA)).toEqual(user);
    expect(expired).not.toHaveBeenCalled();
  });

  it('clears the session when the refresh handler fails', async () => {
    await signIn();
    setRefreshTokenHandler(async () => {
      throw new Error('refresh token revoked');
    });
    const client = authenticatedClient(async config => {
      throw httpError(config, 401);
    });

    await expect(client.get('/me')).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('does not refresh twice when the retried request is rejected again', async () => {
    await signIn();
    const refresh = jest.fn(async () => 'new-token');
    setRefreshTokenHandler(refresh);
    let calls = 0;
    const client = authenticatedClient(async config => {
      calls += 1;
      throw httpError(config, 401);
    });

    await expect(client.get('/me')).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(calls).toBe(2);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('shares one refresh between concurrent 401s', async () => {
    await signIn('old-token');
    const refresh = jest.fn(async () => {
      secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'new-token');
      return 'new-token';
    });
    setRefreshTokenHandler(refresh);
    const client = authenticatedClient(async config => {
      if (config.headers.Authorization === 'Bearer old-token') {
        throw httpError(config, 401);
      }
      return response(config, 200);
    });

    await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('leaves the session alone for a 401 on a request sent without a token', async () => {
    const client = authenticatedClient(async config => {
      throw httpError(config, 401);
    });
    await expect(client.get('/public')).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(expired).not.toHaveBeenCalled();
  });

  it('runs a custom unauthorized handler instead of the default', async () => {
    await signIn();
    const handler = jest.fn(async () => {});
    setUnauthorizedHandler(handler);
    const client = authenticatedClient(async config => {
      throw httpError(config, 401);
    });
    await expect(client.get('/me')).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(true);
  });
});

describe('auth client', () => {
  const originalAdapter = authApi.defaults.adapter;

  beforeEach(async () => {
    setAuthAdapter(testAuthAdapter);
  });

  afterEach(() => {
    authApi.defaults.adapter = originalAdapter;
    setAuthAdapter(null);
  });

  it('rejects wrong credentials with the server message and keeps any session', async () => {
    await signIn();
    const expired = jest.fn();
    const unsubscribe = onSessionExpired(expired);
    authApi.defaults.adapter = async config => {
      throw httpError(config, 400, { message: 'Invalid credentials' });
    };

    await expect(
      authService.login({ username: 'emilys', password: 'wrong' })
    ).rejects.toMatchObject({
      name: 'ApiError',
      code: 'client',
      status: 400,
      message: 'Invalid credentials',
    });
    expect(expired).not.toHaveBeenCalled();
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(true);
    unsubscribe();
  });

  it('never sends a token to the auth backend', async () => {
    await signIn();
    let authorization: unknown = 'unset';
    authApi.defaults.adapter = async config => {
      authorization = config.headers.Authorization;
      return response(config, 200, {
        accessToken: 't',
        id: 1,
        email: 'e@example.com',
      });
    };
    await authService.login({ username: 'emilys', password: 'emilyspass' });
    expect(authorization).toBeUndefined();
  });
});

describe('toApiError', () => {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

  it.each([
    [401, 'unauthorized'],
    [403, 'client'],
    [404, 'client'],
    [422, 'client'],
    [500, 'server'],
    [503, 'server'],
  ])('maps HTTP %d to %s', (status, code) => {
    expect(toApiError(httpError(config, status)).code).toBe(code);
  });

  it('prefers the server message, then axios, for HTTP errors', () => {
    expect(
      toApiError(httpError(config, 400, { message: 'Bad input' })).message
    ).toBe('Bad input');
    expect(toApiError(httpError(config, 400, { error: 'Nope' })).message).toBe(
      'Nope'
    );
    expect(toApiError(httpError(config, 400, 'plain body')).message).toBe(
      'Request failed with status code 400'
    );
  });

  it('reads the message of an error envelope', () => {
    const envelope = {
      error: {
        code: 'invalid_credentials',
        message: 'Wrong email or password',
      },
    };
    expect(toApiError(httpError(config, 422, envelope))).toMatchObject({
      code: 'client',
      status: 422,
      message: 'Wrong email or password',
      data: envelope,
    });
    // An envelope without a usable message falls back to axios's.
    expect(
      toApiError(httpError(config, 422, { error: { code: 'x' } })).message
    ).toBe('Request failed with status code 422');
    expect(
      toApiError(httpError(config, 422, { error: { message: 42 } })).message
    ).toBe('Request failed with status code 422');
  });

  it('wraps non-axios errors as unknown and returns ApiErrors unchanged', () => {
    const existing = new ApiError('x', { code: 'timeout' });
    expect(toApiError(existing)).toBe(existing);
    expect(toApiError(new Error('boom'))).toMatchObject({
      code: 'unknown',
      message: 'boom',
    });
    expect(toApiError('weird')).toMatchObject({ code: 'unknown' });
  });
});
