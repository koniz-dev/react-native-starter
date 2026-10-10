// __tests__/shared/http/sameOrigin.test.ts
import { api } from '@/shared/http/api';
import { STORAGE_KEYS } from '@/shared/storage/storage';
import { secureStore } from '@/testing';


const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

it('sends the stored token to an API on the auth origin', async () => {
  secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
  let authorization: unknown;
  api.defaults.adapter = async config => {
    authorization = config.headers.Authorization;
    return { data: [], status: 200, statusText: 'OK', headers: {}, config };
  };

  await api.get('/notes');

  expect(authorization).toBe('Bearer stored-token');
});
