import type { AxiosRequestConfig } from 'axios';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

import api from '@/services/api';
import * as secureStorage from '@/services/secureStorage';

jest.mock('@/services/secureStorage', () => ({
  getSecureItem: jest.fn(),
}));

describe('api interceptors', () => {
  beforeEach(() => jest.clearAllMocks());

  it('injects the protected token into an outgoing request', async () => {
    jest.mocked(secureStorage.getSecureItem).mockResolvedValue('demo-token');
    let receivedConfig: AxiosRequestConfig | undefined;

    await api.get('/protected', {
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

    expect(receivedConfig?.headers?.Authorization).toBe('Bearer demo-token');
  });

  it('rejects a normalized API error', async () => {
    const error = Object.assign(new Error('Unavailable'), {
      response: { status: 503, data: { message: 'Try again' } },
    });

    await expect(
      api.get('/unavailable', { adapter: async () => Promise.reject(error) })
    ).rejects.toEqual({
      message: 'Unavailable',
      status: 503,
      data: { message: 'Try again' },
    });
  });
});
