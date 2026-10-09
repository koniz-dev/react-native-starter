import type { InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  authClients,
  authService,
  getAuthAdapter,
  notConfiguredAuthAdapter,
  setAuthAdapter,
  type AuthAdapter,
} from '@/shared/session/authService';
import { refreshAccessToken } from '@/shared/session/session';
import * as storage from '@/shared/storage/storage';

const user = { id: 7, email: 'ada@example.com', name: 'Ada Lovelace' };

/** A backend whose login returns { jwt, profile: { uid, mail, displayName } }. */
function fakeAdapter(overrides: Partial<AuthAdapter> = {}): AuthAdapter {
  return {
    login: jest.fn(async () => ({
      token: 'fake-token',
      user: { uid: 7, mail: 'ada@example.com', displayName: 'Ada Lovelace' },
    })),
    normalizeUser: jest.fn((raw: unknown) => {
      const data = raw as { uid?: number; mail?: string; displayName?: string };
      if (!data.uid || !data.mail) throw new Error('incomplete user');
      return { id: data.uid, email: data.mail, name: data.displayName ?? '' };
    }),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.spyOn(storage, 'setItem').mockResolvedValue(undefined);
  jest.spyOn(storage, 'removeItem').mockResolvedValue(undefined);
  jest.mocked(SecureStore.isAvailableAsync).mockResolvedValue(true);
});

afterEach(() => setAuthAdapter(null));

describe('authService with an adapter', () => {
  it('signs in through the adapter and stores the token and normalized user', async () => {
    const adapter = fakeAdapter();
    setAuthAdapter(adapter);

    await expect(
      authService.login({ username: 'ada', password: 'secret' })
    ).resolves.toEqual({ token: 'fake-token', user });

    expect(adapter.login).toHaveBeenCalledWith(
      { username: 'ada', password: 'secret' },
      authClients
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth_token',
      'fake-token'
    );
    expect(storage.setItem).toHaveBeenCalledWith('user_data', user);
  });

  it('rejects a response without a token and stores nothing', async () => {
    setAuthAdapter(
      fakeAdapter({ login: async () => ({ token: '', user: { uid: 7 } }) })
    );

    await expect(
      authService.login({ username: 'ada', password: 'secret' })
    ).rejects.toThrow('access token');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('rejects an incomplete user and stores nothing', async () => {
    setAuthAdapter(
      fakeAdapter({ login: async () => ({ token: 't', user: { uid: 7 } }) })
    );

    await expect(
      authService.login({ username: 'ada', password: 'secret' })
    ).rejects.toThrow('incomplete user');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('passes on a failed login and stores nothing', async () => {
    setAuthAdapter(
      fakeAdapter({
        login: async () => {
          throw new Error('Invalid credentials');
        },
      })
    );

    await expect(
      authService.login({ username: 'ada', password: 'wrong' })
    ).rejects.toThrow('Invalid credentials');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('does not sign in when protected storage is unavailable', async () => {
    setAuthAdapter(fakeAdapter());
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValue(false);

    await expect(
      authService.login({ username: 'ada', password: 'secret' })
    ).rejects.toThrow('Secure storage is unavailable');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('reads and deletes only the token through protected storage', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('fake-token');

    await expect(authService.isAuthenticated()).resolves.toBe(true);
    await authService.logout();

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    expect(storage.removeItem).toHaveBeenCalledWith('user_data');
  });

  it('reloads the user with fetchUser when the adapter has it', async () => {
    setAuthAdapter(
      fakeAdapter({
        fetchUser: async () => ({ uid: 7, mail: 'ada@example.com' }),
      })
    );

    await expect(authService.fetchProfile()).resolves.toEqual({
      id: 7,
      email: 'ada@example.com',
      name: '',
    });
    expect(storage.setItem).toHaveBeenCalledWith('user_data', {
      id: 7,
      email: 'ada@example.com',
      name: '',
    });
  });

  it('returns the stored user when the adapter cannot fetch one', async () => {
    setAuthAdapter(fakeAdapter());
    jest.spyOn(storage, 'getItem').mockResolvedValue(user);

    await expect(authService.fetchProfile()).resolves.toEqual(user);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("uses the adapter's refresh as the HTTP client's refresh handler and stores the new token", async () => {
    const refresh = jest.fn(async () => 'refreshed-token');
    setAuthAdapter(fakeAdapter({ refresh }));

    await expect(refreshAccessToken()).resolves.toBe('refreshed-token');
    expect(refresh).toHaveBeenCalledWith(authClients);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth_token',
      'refreshed-token'
    );

    setAuthAdapter(fakeAdapter());
    await expect(refreshAccessToken()).resolves.toBeNull();
  });
});

describe('without an adapter', () => {
  it('reports that sign-in is not configured', async () => {
    setAuthAdapter(null);

    expect(getAuthAdapter()).toBe(notConfiguredAuthAdapter);
    await expect(
      authService.login({ username: 'ada', password: 'secret' })
    ).rejects.toThrow('Sign-in is not configured');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});

describe('auth backend clients', () => {
  const originalAdapter = authClients.public.defaults.adapter;

  afterEach(() => {
    authClients.public.defaults.adapter = originalAdapter;
  });

  it('neither store nor send cookies', () => {
    expect(authClients.public.defaults.withCredentials).toBe(false);
    expect(authClients.authenticated.defaults.withCredentials).toBe(false);
  });

  it('send the login request with withCredentials disabled', async () => {
    let requestConfig: InternalAxiosRequestConfig | undefined;
    authClients.public.defaults.adapter = async config => {
      requestConfig = config;
      return {
        data: { token: 't' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    setAuthAdapter(
      fakeAdapter({
        login: async (credentials, { public: http }) => {
          const { data } = await http.post<{ token: string }>(
            '/session',
            credentials
          );
          return { token: data.token, user: { uid: 7, mail: 'a@b.c' } };
        },
      })
    );

    await authService.login({ username: 'ada', password: 'secret' });

    expect(requestConfig?.url).toBe('/session');
    expect(requestConfig?.withCredentials).toBe(false);
  });
});
