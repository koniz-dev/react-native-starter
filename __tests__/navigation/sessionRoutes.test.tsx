import { act, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/auth';
import { defaultUnauthorizedHandler } from '@/services/session';
import { ApiError } from '@/services/apiError';
import { setItem, STORAGE_KEYS } from '@/services/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore.set(key, value);
    return Promise.resolve();
  }),
  getItemAsync: jest.fn((key: string) =>
    Promise.resolve(mockSecureStore.get(key) ?? null)
  ),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureStore.delete(key);
    return Promise.resolve();
  }),
}));

const user = { id: 1, email: 'emily@example.com', name: 'Emily Johnson' };

async function storeSession() {
  mockSecureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
  await setItem(STORAGE_KEYS.USER_DATA, user);
}

describe('session-guarded routes', () => {
  beforeEach(async () => {
    mockSecureStore.clear();
    await AsyncStorage.clear();
    jest.restoreAllMocks();
    // The profile screen reloads the user from the auth backend on open.
    jest.spyOn(authService, 'fetchProfile').mockResolvedValue(user);
  });

  it('restores a stored session on cold start, including a deep link into the protected group', async () => {
    await storeSession();
    const app = renderRouter('./app', { initialUrl: '/profile' });

    expect(await screen.findByText('emily@example.com')).toBeTruthy();
    expect(app.getPathname()).toBe('/profile');
  });

  it('redirects a signed-out deep link into the protected group to Home', async () => {
    const app = renderRouter('./app', { initialUrl: '/profile' });

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
    expect(screen.queryByText('emily@example.com')).toBeNull();
  });

  it('keeps signed-in users out of the login screen', async () => {
    await storeSession();
    const app = renderRouter('./app', { initialUrl: '/login' });

    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });

  it('signing in updates every consumer and leaves the login screen', async () => {
    jest.spyOn(authService, 'login').mockImplementation(async () => {
      await storeSession();
      return { token: 'stored-token', user };
    });
    const app = renderRouter('./app', { initialUrl: '/login' });
    await screen.findByText('Welcome Back');

    fireEvent.changeText(screen.getByTestId('login-username'), 'emilys');
    fireEvent.changeText(screen.getByTestId('login-password'), 'emilyspass');
    fireEvent.press(screen.getByText('Sign In'));

    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(app.getPathname()).toBe('/');

    act(() => router.push('/profile'));
    expect(await screen.findByText('emily@example.com')).toBeTruthy();
  });

  it('the protected group has a back button to the screen that opened it', async () => {
    await storeSession();
    const app = renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('Signed in as Emily Johnson');

    fireEvent.press(screen.getByTestId('profile-button'));
    expect(await screen.findByText('emily@example.com')).toBeTruthy();
    expect(app.getPathname()).toBe('/profile');

    fireEvent.press(screen.getByTestId('protected-back'));
    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });

  it('signing out from the protected screen returns to Home signed out', async () => {
    await storeSession();
    const app = renderRouter('./app', { initialUrl: '/profile' });
    await screen.findByText('emily@example.com');

    fireEvent.press(screen.getByTestId('profile-logout'));

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
    expect(mockSecureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
  });

  it('a session-expired event (API 401) signs out and leaves the protected group', async () => {
    await storeSession();
    const app = renderRouter('./app', { initialUrl: '/profile' });
    await screen.findByText('emily@example.com');

    await act(async () => {
      await defaultUnauthorizedHandler();
    });

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });

  it('opening the protected screen with an expired token signs out and returns Home', async () => {
    await storeSession();
    // What the HTTP client does on a 401 from GET /auth/me (see
    // __tests__/services/httpClient.test.ts): run the unauthorized handler,
    // then reject.
    jest.spyOn(authService, 'fetchProfile').mockImplementation(async () => {
      await defaultUnauthorizedHandler();
      throw new ApiError('Invalid/Expired Token!', {
        code: 'unauthorized',
        status: 401,
      });
    });
    const app = renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('Signed in as Emily Johnson');

    fireEvent.press(screen.getByTestId('profile-button'));

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
    expect(mockSecureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
  });

  it('shows a non-401 refresh failure on the protected screen and stays signed in', async () => {
    await storeSession();
    jest.spyOn(authService, 'fetchProfile').mockRejectedValue(
      new ApiError('Network error: check your connection', {
        code: 'network',
      })
    );
    const app = renderRouter('./app', { initialUrl: '/profile' });

    expect(
      await screen.findByText(
        'Could not refresh your profile: Network error: check your connection'
      )
    ).toBeTruthy();
    expect(app.getPathname()).toBe('/profile');
    expect(screen.getByText('emily@example.com')).toBeTruthy();
  });
});
