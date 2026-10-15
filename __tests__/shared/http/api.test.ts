import type * as ApiModule from '@/shared/http/api';
import { AxiosError, AxiosHeaders, type AxiosRequestConfig } from 'axios';
import { ApiError } from '@/shared/http/apiError';

import { api, getOrigin, getTrustedTokenOrigins } from '@/shared/http/api';
import { getConfig } from '@/shared/config/env';

const authBaseURL = getConfig().authApiUrl;
import * as secureStorage from '@/shared/storage/secureStorage';

jest.mock('@/shared/storage/secureStorage', () => ({
  getSecureItem: jest.fn(),
}));

describe('api interceptors', () => {
  beforeEach(() => jest.clearAllMocks());

  it('injects the protected token into an outgoing request', async () => {
    jest.mocked(secureStorage.getSecureItem).mockResolvedValue('test-token');
    let receivedConfig: AxiosRequestConfig | undefined;

    await api.get(`${authBaseURL}/auth/me`, {
      adapter: async config => {
        receivedConfig = config;
        return {
          config,
          data: {},
          headers: {},
          status: 200,
          statusText: 'OK',
        };
      },
    });

    expect(receivedConfig?.headers?.Authorization).toBe('Bearer test-token');
  });

  it('rejects with an ApiError carrying the server message and status', async () => {
    const error = new AxiosError(
      'Request failed with status code 503',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        status: 503,
        data: { message: 'Try again' },
        statusText: 'Service Unavailable',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    );

    const rejection = api.get('/unavailable', {
      adapter: async () => Promise.reject(error),
    });
    await expect(rejection).rejects.toBeInstanceOf(ApiError);
    await expect(rejection).rejects.toMatchObject({
      message: 'Try again',
      code: 'server',
      status: 503,
      data: { message: 'Try again' },
    });
  });
});

describe('request bodies', () => {
  async function send(data: unknown) {
    let received: AxiosRequestConfig | undefined;
    await api.post('/upload', data, {
      adapter: async config => {
        received = config;
        return { config, data: {}, headers: {}, status: 200, statusText: 'OK' };
      },
    });
    return {
      body: received?.data,
      contentType: String(received?.headers?.['Content-Type']),
    };
  }

  it('sends a FormData body untouched, as multipart', async () => {
    const form = new FormData();
    form.append('title', 'hello');
    form.append('file', {
      uri: 'file:///photo.jpg',
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    const { body, contentType } = await send(form);

    expect(body).toBe(form);
    expect(contentType).toBe('multipart/form-data');
  });

  it('sends an object as JSON', async () => {
    await expect(send({ title: 'hello' })).resolves.toEqual({
      body: '{"title":"hello"}',
      contentType: 'application/json',
    });
  });
});

function captureRequest(url: string) {
  let received: AxiosRequestConfig | undefined;
  return api
    .get(url, {
      adapter: async config => {
        received = config;
        return { config, data: {}, headers: {}, status: 200, statusText: 'OK' };
      },
    })
    .then(() => received);
}

describe('token origin allow-list', () => {
  const authOrigin = getOrigin(authBaseURL) ?? '';
  const apiOrigin = getOrigin(getConfig().apiUrl) ?? '';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(secureStorage.getSecureItem).mockResolvedValue('test-token');
  });

  it('trusts only the auth backend origin by default', () => {
    expect([...getTrustedTokenOrigins()]).toEqual([authOrigin]);
  });

  it('does not send the auth token to the separate API host', async () => {
    expect(apiOrigin).not.toBe(authOrigin);
    const config = await captureRequest('/notes');
    expect(config?.headers?.Authorization).toBeUndefined();
    expect(secureStorage.getSecureItem).not.toHaveBeenCalled();
  });

  it('attaches the token to the auth origin, with or without the default port', async () => {
    const config = await captureRequest(`${authOrigin}:443/auth/me`);
    expect(config?.headers?.Authorization).toBe('Bearer test-token');
  });

  it('does not attach or read the token for another origin', async () => {
    const config = await captureRequest('https://attacker.example/collect');
    expect(config?.headers?.Authorization).toBeUndefined();
    expect(secureStorage.getSecureItem).not.toHaveBeenCalled();
  });

  it('does not attach the token to a look-alike host', async () => {
    const config = await captureRequest(`${authOrigin}.attacker.example/x`);
    expect(config?.headers?.Authorization).toBeUndefined();
  });

  it('sends no Authorization header when no token is stored', async () => {
    jest.mocked(secureStorage.getSecureItem).mockResolvedValue(null);
    const config = await captureRequest(`${authOrigin}/auth/me`);
    expect(config?.headers?.Authorization).toBeUndefined();
  });

  it('trusts origins listed in EXPO_PUBLIC_API_TRUSTED_ORIGINS, including the API', async () => {
    const previous = process.env.EXPO_PUBLIC_API_TRUSTED_ORIGINS;
    process.env.EXPO_PUBLIC_API_TRUSTED_ORIGINS = ` ${apiOrigin.toUpperCase()}:443 , ,https://cdn.example.com `;
    try {
      let isolatedApi: typeof ApiModule | undefined;
      let isolatedSecure: typeof secureStorage | undefined;
      jest.isolateModules(() => {
        isolatedSecure = jest.requireMock('@/shared/storage/secureStorage');
        isolatedApi = jest.requireActual('@/shared/http/api');
      });
      const origins = isolatedApi!.getTrustedTokenOrigins();
      expect(origins.has(apiOrigin)).toBe(true);
      expect(origins.has('https://cdn.example.com')).toBe(true);
      expect(origins.size).toBe(3);

      jest
        .mocked(isolatedSecure!.getSecureItem)
        .mockResolvedValue('test-token');
      let received: AxiosRequestConfig | undefined;
      await isolatedApi!.api.get('/notes', {
        adapter: async config => {
          received = config;
          return {
            config,
            data: {},
            headers: {},
            status: 200,
            statusText: 'OK',
          };
        },
      });
      expect(received?.headers?.Authorization).toBe('Bearer test-token');
    } finally {
      process.env.EXPO_PUBLIC_API_TRUSTED_ORIGINS = previous;
    }
  });
});

describe('getOrigin', () => {
  it.each([
    ['https://API.Example.com/v1?x=1', 'https://api.example.com'],
    ['https://api.example.com:443/v1', 'https://api.example.com'],
    ['http://localhost:80', 'http://localhost'],
    ['http://localhost:3000/x', 'http://localhost:3000'],
    ['https://user:pass@api.example.com/x', 'https://api.example.com'],
    ['/relative/path', null],
    ['', null],
    ['https://:443', null],
    ['https://user@/v1', null],
  ])('%s -> %s', (url, expected) => {
    expect(getOrigin(url)).toBe(expected);
  });
});
