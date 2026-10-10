import { act, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { authService } from '@/shared/session/authService';
import { defaultUnauthorizedHandler } from '@/shared/session/session';
import { ApiError } from '@/shared/http/apiError';
import {
  getItem,
  removeItem,
  setItem,
  STORAGE_KEYS,
} from '@/shared/storage/storage';
import { secureStore } from '@/testing';

const user = { id: 1, email: 'emily@example.com', name: 'Emily Johnson' };

async function storeSession() {
  secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
  await setItem(STORAGE_KEYS.USER_DATA, user);
}

describe('session-guarded routes', () => {
  beforeEach(async () => {
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
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
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
    // __tests__/shared/http/httpClient.test.ts): run the unauthorized handler,
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
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
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

describe('first launch after an install', () => {
  // iOS keeps the Keychain (the token) when an app is deleted; AsyncStorage,
  // with the install marker and the stored user, goes with the app.
  beforeEach(async () => {
    await removeItem(STORAGE_KEYS.INSTALL_MARKER);
  });

  it('clears a token left by a previous install and starts signed out', async () => {
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'previous-install-token');

    renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(screen.queryByText(/Signed in as/)).toBeNull();
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    await expect(getItem(STORAGE_KEYS.INSTALL_MARKER)).resolves.toBe(true);
  });

  it('restores the session on later launches (the marker is set)', async () => {
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'previous-install-token');
    const first = renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByText('Not signed in')).toBeTruthy();
    first.unmount();

    // Sign in, then relaunch: still signed in.
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, user);
    renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('stored-token');
  });

  it('keeps an existing session from before the marker existed', async () => {
    // An app updated to this version: no marker yet, but its stored user is
    // there, so this is not a fresh install.
    await storeSession();

    renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('stored-token');
    await expect(getItem(STORAGE_KEYS.INSTALL_MARKER)).resolves.toBe(true);
  });
});
