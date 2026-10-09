import { Platform } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { setAuthAdapter, type AuthAdapter } from '@/shared/session/authService';
import { configureIntegrations } from '@/shared/integrations/setup';
import { getItem, STORAGE_KEYS } from '@/shared/storage/storage';
import {
  createMemoryTokenStore,
  createSecureTokenStore,
  createTokenStore,
  getTokenStore,
  setTokenStore,
} from '@/shared/session/tokenStore';

beforeEach(async () => {
  jest.clearAllMocks();
  setTokenStore(null);
});

afterEach(() => {
  jest.restoreAllMocks();
  setTokenStore(null);
});

describe('secure token store (iOS / Android)', () => {
  it('stores, reads, and clears the token in SecureStore', async () => {
    const store = createSecureTokenStore();

    expect(store.persistent).toBe(true);
    await expect(store.get()).resolves.toBeNull();
    await store.set('abc');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'abc');
    await expect(store.get()).resolves.toBe('abc');
    await store.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    await expect(store.get()).resolves.toBeNull();
  });

  it('refuses to store a token when secure storage is unavailable', async () => {
    jest.mocked(SecureStore.isAvailableAsync).mockResolvedValueOnce(false);

    await expect(createSecureTokenStore().set('abc')).rejects.toThrow(
      'Secure storage is unavailable on this platform'
    );
  });
});

describe('memory token store (web)', () => {
  it('keeps the token in memory only', async () => {
    const store = createMemoryTokenStore();

    expect(store.persistent).toBe(false);
    await expect(store.get()).resolves.toBeNull();
    await store.set('abc');
    await expect(store.get()).resolves.toBe('abc');
    await store.clear();
    await expect(store.get()).resolves.toBeNull();

    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });

  it('does not share the token between instances (a reload starts empty)', async () => {
    const beforeReload = createMemoryTokenStore();
    await beforeReload.set('abc');

    await expect(createMemoryTokenStore().get()).resolves.toBeNull();
  });
});

describe('platform selection', () => {
  it.each([
    ['web', false],
    ['ios', true],
    ['android', true],
  ] as const)('%s uses a persistent store: %s', (platform, persistent) => {
    expect(createTokenStore(platform).persistent).toBe(persistent);
  });

  it('the default store follows Platform.OS', () => {
    jest.isolateModules(() => {
      jest.replaceProperty(Platform, 'OS', 'web');
      const isolated = jest.requireActual('@/shared/session/tokenStore');
      expect(isolated.getTokenStore().persistent).toBe(false);
    });
    jest.isolateModules(() => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      const isolated = jest.requireActual('@/shared/session/tokenStore');
      expect(isolated.getTokenStore().persistent).toBe(true);
    });
  });

  it('setTokenStore replaces the store and null restores the default', () => {
    const custom = createMemoryTokenStore();
    const original = getTokenStore();

    setTokenStore(custom);
    expect(getTokenStore()).toBe(custom);
    setTokenStore(null);
    expect(getTokenStore()).toBe(original);
  });
});

describe('auth flow with the web token store', () => {
  const testAdapter: AuthAdapter = {
    login: async () => ({
      token: 'web-token',
      user: { id: 1, email: 'emily@example.com', name: 'Emily Johnson' },
    }),
    normalizeUser: raw => raw as { id: number; email: string; name: string },
  };

  beforeEach(() => {
    // Run the app's own registration first, then use this test's adapter.
    configureIntegrations();
    setAuthAdapter(testAdapter);
  });

  afterEach(() => setAuthAdapter(null));

  it('signs in, shows the session, logs out, and a reload returns to signed out', async () => {
    setTokenStore(createTokenStore('web'));

    const app = renderRouter('./app', { initialUrl: '/login' });
    await screen.findByText('Welcome Back');
    fireEvent.changeText(screen.getByTestId('login-username'), 'emilys');
    fireEvent.changeText(screen.getByTestId('login-password'), 'emilyspass');
    fireEvent.press(screen.getByText('Sign In'));

    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
    await expect(getTokenStore().get()).resolves.toBe('web-token');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('logout-button'));
    expect(await screen.findByText('Not signed in')).toBeTruthy();
    await expect(getTokenStore().get()).resolves.toBeNull();
    app.unmount();

    // Sign in again, then "reload": a fresh in-memory store and a new app.
    renderRouter('./app', { initialUrl: '/login' });
    await screen.findByText('Welcome Back');
    fireEvent.changeText(screen.getByTestId('login-username'), 'emilys');
    fireEvent.changeText(screen.getByTestId('login-password'), 'emilyspass');
    fireEvent.press(screen.getByText('Sign In'));
    await screen.findByText('Signed in as Emily Johnson');
    expect(await getItem(STORAGE_KEYS.USER_DATA)).not.toBeNull();
    screen.unmount();

    setTokenStore(createTokenStore('web'));
    renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    // The profile left in AsyncStorage (localStorage on web) is removed too.
    expect(await getItem(STORAGE_KEYS.USER_DATA)).toBeNull();
  });
});
