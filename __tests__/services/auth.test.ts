jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

import type { InternalAxiosRequestConfig } from 'axios';
import { authApi, authService } from '@/services/auth';
import * as storage from '@/services/storage';
import * as SecureStore from 'expo-secure-store';

describe('authService.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(storage, 'setItem').mockResolvedValue(undefined);
    jest.spyOn(storage, 'removeItem').mockResolvedValue(undefined);
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValue(true);
  });

  it('normalizes the demo response and persists the session after a successful login', async () => {
    jest.spyOn(authApi, 'post').mockResolvedValue({
      data: {
        accessToken: 'demo-token',
        id: 1,
        email: 'emily.johnson@x.dummyjson.com',
        firstName: 'Emily',
        lastName: 'Johnson',
      },
    });

    await expect(
      authService.login({ username: 'emilys', password: 'emilyspass' })
    ).resolves.toEqual({
      token: 'demo-token',
      user: {
        id: 1,
        email: 'emily.johnson@x.dummyjson.com',
        name: 'Emily Johnson',
      },
    });

    expect(authApi.post).toHaveBeenCalledWith('/auth/login', {
      username: 'emilys',
      password: 'emilyspass',
      expiresInMins: 60,
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth_token',
      'demo-token'
    );
    expect(storage.setItem).toHaveBeenCalledWith('user_data', {
      id: 1,
      email: 'emily.johnson@x.dummyjson.com',
      name: 'Emily Johnson',
    });
  });

  it('rejects an incomplete response without persisting a session', async () => {
    jest.spyOn(authApi, 'post').mockResolvedValue({ data: { id: 1 } });

    await expect(
      authService.login({ username: 'emilys', password: 'wrong-password' })
    ).rejects.toThrow('access token');

    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('does not persist a session when the login request fails', async () => {
    jest
      .spyOn(authApi, 'post')
      .mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      authService.login({ username: 'emilys', password: 'wrong-password' })
    ).rejects.toThrow('Invalid credentials');

    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('does not authenticate when protected storage is unavailable', async () => {
    jest.spyOn(authApi, 'post').mockResolvedValue({
      data: { accessToken: 'demo-token', id: 1, email: 'demo@example.com' },
    });
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValue(false);

    await expect(
      authService.login({ username: 'emilys', password: 'emilyspass' })
    ).rejects.toThrow('Secure storage is unavailable');

    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('reads and deletes only the token through protected storage', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('demo-token');

    await expect(authService.isAuthenticated()).resolves.toBe(true);
    await authService.logout();

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    expect(storage.removeItem).toHaveBeenCalledWith('user_data');
  });
});

describe('authApi cookie handling', () => {
  const originalAdapter = authApi.defaults.adapter;

  afterEach(() => {
    authApi.defaults.adapter = originalAdapter;
    jest.restoreAllMocks();
  });

  it('does not store or send cookies for auth requests', () => {
    expect(authApi.defaults.withCredentials).toBe(false);
  });

  it('sends the login request with withCredentials disabled', async () => {
    jest.spyOn(storage, 'setItem').mockResolvedValue(undefined);
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValue(true);
    let requestConfig: InternalAxiosRequestConfig | undefined;
    authApi.defaults.adapter = async config => {
      requestConfig = config;
      return {
        data: {
          accessToken: 'demo-token',
          id: 1,
          email: 'emily.johnson@x.dummyjson.com',
          firstName: 'Emily',
          lastName: 'Johnson',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    await authService.login({ username: 'emilys', password: 'emilyspass' });

    expect(requestConfig?.url).toBe('/auth/login');
    expect(requestConfig?.withCredentials).toBe(false);
  });
});
