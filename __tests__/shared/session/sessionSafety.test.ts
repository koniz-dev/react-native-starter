import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authService, setAuthAdapter } from '@/shared/session/authService';
import type * as SessionModule from '@/shared/session/session';
import {
  defaultUnauthorizedHandler,
  getSessionToken,
  onSessionExpired,
  refreshAccessToken,
} from '@/shared/session/session';
import { getTokenStore, setTokenStore } from '@/shared/session/tokenStore';
import { getItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { secureStore } from '@/testing';
import { logger } from '@/shared/lib/logger';
import { createHttpClient } from '@/shared/http/httpClient';
import { getConfig } from '@/shared/config/env';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => (resolve = done));
  return { promise, resolve };
}

const login = (username: string) =>
  authService.login({ username, password: 'p' });

beforeEach(() => {
  setAuthAdapter({
    login: async ({ username }) => ({
      token: `token-${username}`,
      user: { id: username, email: `${username}@x.com`, name: username },
    }),
    normalizeUser: raw => raw as { id: string; email: string; name: string },
    refresh: async () => 'token-A2',
    fetchUser: async () => ({ id: 'A', email: 'A@x.com', name: 'Updated A' }),
  });
});

afterEach(() => {
  setTokenStore(null);
  setAuthAdapter(null);
});

it.each([false, true])(
  'serializes a pending refresh write before logout (next sign-in: %s)',
  async signInAgain => {
    await login('A');
    const store = getTokenStore();
    const writing = deferred<void>();
    const release = deferred<void>();
    setTokenStore({
      ...store,
      set: async token => {
        if (token === 'token-A2') {
          writing.resolve();
          await release.promise;
        }
        await store.set(token);
      },
    });

    const refreshing = refreshAccessToken();
    await writing.promise;
    const signingOut = authService.logout();
    // Wait until logout has invalidated this session, without releasing the
    // slow write. HTTP and restore must already refuse the stored token.
    await Promise.resolve();
    await expect(getSessionToken()).resolves.toBeNull();
    const signingIn = signInAgain ? login('B') : Promise.resolve(null);
    release.resolve();
    await Promise.all([refreshing, signingOut, signingIn]);

    expect(await refreshing).toBeNull();
    expect(await store.get()).toBe(signInAgain ? 'token-B' : null);
    expect(await authService.isAuthenticated()).toBe(signInAgain);
    expect((await authService.getCurrentUser())?.id ?? null).toBe(
      signInAgain ? 'B' : null
    );
  }
);

it('keeps a failed token deletion invalidated and still removes the profile', async () => {
  await login('A');
  jest
    .mocked(SecureStore.deleteItemAsync)
    .mockRejectedValueOnce(new Error('locked'));

  await expect(authService.logout()).rejects.toThrow('locked');

  expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('token-A');
  expect(await getSessionToken()).toBeNull();
  expect(await authService.isAuthenticated()).toBe(false);
  expect(await getItem(STORAGE_KEYS.USER_DATA)).toBeNull();
  expect(await getItem(STORAGE_KEYS.SESSION_INVALIDATED)).toBe(true);
  const sent = jest.fn();
  const client = createHttpClient({
    getBaseURL: () => getConfig().authApiUrl,
    authenticated: true,
  });
  client.defaults.adapter = async config => {
    sent(config.headers.Authorization);
    return { config, data: {}, headers: {}, status: 200, statusText: 'OK' };
  };
  await client.get('/me');
  expect(sent).toHaveBeenCalledWith(undefined);
});

it('does not clear a new sign-in when an older token write fails', async () => {
  const store = getTokenStore();
  const writing = deferred<void>();
  const release = deferred<void>();
  const failure = new Error('old write failed');
  setTokenStore({
    ...store,
    set: async token => {
      if (token === 'token-A') {
        writing.resolve();
        await release.promise;
        throw failure;
      }
      await store.set(token);
    },
  });

  const first = login('A').catch((error: unknown) => error);
  await writing.promise;
  const second = login('B');
  await Promise.resolve();
  release.resolve();
  await second;

  expect(await first).toBe(failure);
  expect(await getSessionToken()).toBe('token-B');
  expect(await authService.getCurrentUser()).toMatchObject({ id: 'B' });
});

it('does not let a pending profile write or queued refresh overwrite the next session', async () => {
  await login('A');
  const writing = deferred<void>();
  const release = deferred<void>();
  const write = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
  jest
    .mocked(AsyncStorage.setItem)
    .mockImplementationOnce(async (key, value) => {
      writing.resolve();
      await release.promise;
      await write(key, value);
    });

  const fetching = authService.fetchProfile();
  await writing.promise;
  const refreshing = refreshAccessToken();
  await Promise.resolve();
  const signingOut = authService.logout();
  await Promise.resolve();
  const signingIn = login('B');
  release.resolve();
  await Promise.all([fetching, refreshing, signingOut, signingIn]);

  expect(await fetching).toBeNull();
  expect(await refreshing).toBeNull();
  expect(await getSessionToken()).toBe('token-B');
  expect(await authService.getCurrentUser()).toMatchObject({ id: 'B' });
  expect(SecureStore.setItemAsync).not.toHaveBeenCalledWith(
    'auth_token',
    'token-A2'
  );
});

it('blocks restoration after a fresh module load and retries deleting the token', async () => {
  await login('A');
  jest
    .mocked(SecureStore.deleteItemAsync)
    .mockRejectedValueOnce(new Error('locked'));
  await expect(authService.logout()).rejects.toThrow('locked');

  let freshSession!: typeof SessionModule;
  jest.isolateModules(() => {
    freshSession = jest.requireActual('@/shared/session/session');
  });
  // The new module has no in-memory invalidation; only the durable marker
  // prevents the token still in Keychain from being restored.
  expect(await freshSession.getSessionToken()).toBeNull();
  await freshSession.clearStoredSession();
  expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
  expect(await getItem(STORAGE_KEYS.SESSION_INVALIDATED)).toBeNull();
});

it('allows a new sign-in after a failed deletion without reviving the old token', async () => {
  await login('A');
  jest
    .mocked(SecureStore.deleteItemAsync)
    .mockRejectedValueOnce(new Error('locked'));
  await expect(authService.logout()).rejects.toThrow('locked');

  await login('B');

  expect(await getSessionToken()).toBe('token-B');
  expect(await authService.getCurrentUser()).toMatchObject({ id: 'B' });
  expect(await getItem(STORAGE_KEYS.SESSION_INVALIDATED)).toBeNull();
});

it('still deletes the token when saving the invalidation marker fails', async () => {
  const error = jest.spyOn(logger, 'error').mockImplementation(() => {});
  await login('A');
  jest
    .spyOn(AsyncStorage, 'setItem')
    .mockRejectedValueOnce(new Error('disk full'));

  await expect(authService.logout()).rejects.toThrow('disk full');

  expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
  expect(await authService.isAuthenticated()).toBe(false);
  expect(await getItem(STORAGE_KEYS.USER_DATA)).toBeNull();
  expect(error).toHaveBeenCalledWith(
    'Error storing session_invalidated',
    expect.any(Error)
  );
});

it('does not expire a new session while an older clear is waiting for storage', async () => {
  await login('A');
  const deleting = deferred<void>();
  const release = deferred<void>();
  const store = getTokenStore();
  setTokenStore({
    ...store,
    clear: async () => {
      deleting.resolve();
      await release.promise;
      await store.clear();
    },
  });
  const expired = jest.fn();
  const unsubscribe = onSessionExpired(expired);
  try {
    const expiring = defaultUnauthorizedHandler();
    await deleting.promise;
    const signingIn = login('B');
    // login starts its generation after the adapter answers.
    await Promise.resolve();
    release.resolve();
    await Promise.all([expiring, signingIn]);

    expect(expired).not.toHaveBeenCalled();
    expect(await getSessionToken()).toBe('token-B');
    expect(await authService.getCurrentUser()).toMatchObject({ id: 'B' });
  } finally {
    unsubscribe();
  }
});
