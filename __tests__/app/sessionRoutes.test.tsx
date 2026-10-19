import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { configureIntegrations } from '@/shared/integrations/setup';
import { errorReporterSeam } from '@/shared/integrations/errorReporter';
import { logger } from '@/shared/lib/logger';

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
    const app = await renderRouter('./app', { initialUrl: '/profile' });

    expect(await screen.findByText('emily@example.com')).toBeTruthy();
    expect(app.getPathname()).toBe('/profile');
  });

  it('redirects a signed-out deep link into the protected group to Home', async () => {
    const app = await renderRouter('./app', { initialUrl: '/profile' });

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
    expect(screen.queryByText('emily@example.com')).toBeNull();
  });

  it('shows the user the profile screen reloaded from the backend', async () => {
    await storeSession();
    jest.spyOn(authService, 'fetchProfile').mockResolvedValue({
      ...user,
      email: 'emily.new@example.com',
    });
    await renderRouter('./app', { initialUrl: '/profile' });

    expect(await screen.findByText('emily.new@example.com')).toBeTruthy();
    expect(screen.queryByText('emily@example.com')).toBeNull();
  });

  it('ties error reports to the signed-in user, and unties them on sign-out', async () => {
    configureIntegrations();
    const reporter = {
      captureException: jest.fn(),
      captureMessage: jest.fn(),
      setUser: jest.fn(),
    };
    errorReporterSeam.set(reporter);
    try {
      await storeSession();
      await renderRouter('./app', { initialUrl: '/' });
      expect(
        await screen.findByText('Signed in as Emily Johnson')
      ).toBeTruthy();
      expect(reporter.setUser).toHaveBeenLastCalledWith({ id: '1' });

      await fireEvent.press(screen.getByTestId('logout-button'));
      expect(await screen.findByText('Not signed in')).toBeTruthy();
      expect(reporter.setUser).toHaveBeenLastCalledWith(null);
    } finally {
      errorReporterSeam.reset();
    }
  });

  it('offers a way back from Login, even when it was opened directly', async () => {
    const app = await renderRouter('./app', { initialUrl: '/login' });
    await screen.findByText('Welcome Back');

    await fireEvent.press(screen.getByTestId('auth-back'));

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });

  it('returns from Login to the screen that opened it, not Home', async () => {
    function Settings() {
      return <Text>Settings screen</Text>;
    }
    const app = await renderRouter(
      { appDir: './app', overrides: { settings: Settings } },
      { initialUrl: '/' }
    );
    await screen.findByText('Not signed in');
    await act(() => router.push('/settings'));
    await screen.findByText('Settings screen');
    await act(() => router.push('/login'));
    await screen.findByText('Welcome Back');

    await fireEvent.press(screen.getByTestId('auth-back'));

    expect(await screen.findByText('Settings screen')).toBeTruthy();
    expect(app.getPathname()).toBe('/settings');
  });

  it('goes Home from Login when there is nothing to go back to', async () => {
    await renderRouter('./app', { initialUrl: '/login' });
    await screen.findByText('Welcome Back');
    jest.spyOn(router, 'canGoBack').mockReturnValue(false);
    const back = jest.spyOn(router, 'back');
    const replace = jest.spyOn(router, 'replace');

    await fireEvent.press(screen.getByTestId('auth-back'));

    expect(replace).toHaveBeenCalledWith('/');
    expect(back).not.toHaveBeenCalled();
  });

  it('goes Home from Profile when there is nothing to go back to', async () => {
    await storeSession();
    await renderRouter('./app', { initialUrl: '/profile' });
    await screen.findByText('emily@example.com');
    jest.spyOn(router, 'canGoBack').mockReturnValue(false);
    const back = jest.spyOn(router, 'back');
    const replace = jest.spyOn(router, 'replace');

    await fireEvent.press(screen.getByTestId('protected-back'));

    expect(replace).toHaveBeenCalledWith('/');
    expect(back).not.toHaveBeenCalled();
  });

  it('opens Login once for a double tap, so one Back returns Home', async () => {
    const app = await renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('Not signed in');

    // Both taps land before the new screen covers the button.
    const signIn = screen.getByTestId('sign-in-button');
    await fireEvent.press(signIn);
    await fireEvent.press(signIn);
    await screen.findByText('Welcome Back');
    await fireEvent.press(screen.getByTestId('auth-back'));

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });

  it('opens Profile once for a double tap, and loads it once', async () => {
    await storeSession();
    const app = await renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('Signed in as Emily Johnson');

    const viewProfile = screen.getByTestId('profile-button');
    await fireEvent.press(viewProfile);
    await fireEvent.press(viewProfile);
    expect(await screen.findByText('emily@example.com')).toBeTruthy();
    expect(authService.fetchProfile).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('protected-back'));

    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });

  it('keeps signed-in users out of the login screen', async () => {
    await storeSession();
    const app = await renderRouter('./app', { initialUrl: '/login' });

    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });

  it('signing in updates every consumer and leaves the login screen', async () => {
    jest.spyOn(authService, 'login').mockImplementation(async () => {
      await storeSession();
      return { token: 'stored-token', user };
    });
    const app = await renderRouter('./app', { initialUrl: '/login' });
    await screen.findByText('Welcome Back');

    await fireEvent.changeText(screen.getByTestId('login-username'), 'emily');
    await fireEvent.changeText(
      screen.getByTestId('login-password'),
      'secret-pass'
    );
    await fireEvent.press(screen.getByText('Sign In'));

    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(app.getPathname()).toBe('/');

    await act(() => router.push('/profile'));
    expect(await screen.findByText('emily@example.com')).toBeTruthy();
  });

  it('the protected group has a back button to the screen that opened it', async () => {
    await storeSession();
    const app = await renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('Signed in as Emily Johnson');

    await fireEvent.press(screen.getByTestId('profile-button'));
    expect(await screen.findByText('emily@example.com')).toBeTruthy();
    expect(app.getPathname()).toBe('/profile');

    await fireEvent.press(screen.getByTestId('protected-back'));
    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });

  it('signing out from the protected screen returns to Home signed out', async () => {
    await storeSession();
    const app = await renderRouter('./app', { initialUrl: '/profile' });
    await screen.findByText('emily@example.com');

    await fireEvent.press(screen.getByTestId('profile-logout'));

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
  });

  it('a session-expired event (API 401) signs out and leaves the protected group', async () => {
    await storeSession();
    const app = await renderRouter('./app', { initialUrl: '/profile' });
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
    const app = await renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('Signed in as Emily Johnson');

    await fireEvent.press(screen.getByTestId('profile-button'));

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
    const app = await renderRouter('./app', { initialUrl: '/profile' });

    expect(
      await screen.findByText(
        'Could not refresh your profile: No connection. Check your network and try again.'
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

    await renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(screen.queryByText(/Signed in as/)).toBeNull();
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    await expect(getItem(STORAGE_KEYS.INSTALL_MARKER)).resolves.toBe(true);
  });

  it('restores the session on later launches (the marker is set)', async () => {
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'previous-install-token');
    const first = await renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByText('Not signed in')).toBeTruthy();
    await first.unmount();

    // Sign in, then relaunch: still signed in.
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, user);
    await renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('stored-token');
  });

  it('keeps the token, and logs why, when the store cannot be read at launch', async () => {
    await setItem(STORAGE_KEYS.INSTALL_MARKER, true);
    await storeSession();
    const failure = new Error('database is locked');
    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(failure);
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => {});

    const first = await renderRouter('./app', { initialUrl: '/' });
    // This launch can't tell, so it starts signed out, without clearing.
    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('stored-token');
    expect(logError).toHaveBeenCalledWith(
      'Restoring the session failed',
      failure
    );
    await first.unmount();

    await renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
  });

  it('restores a session whose stored profile is not valid without that profile', async () => {
    configureIntegrations();
    const reporter = {
      captureException: jest.fn(),
      captureMessage: jest.fn(),
      setUser: jest.fn(),
    };
    errorReporterSeam.set(reporter);
    try {
      await setItem(STORAGE_KEYS.INSTALL_MARKER, true);
      secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, '"legacy-profile"');

      await renderRouter('./app', { initialUrl: '/' });

      expect(await screen.findByText('Signed in as your account')).toBeTruthy();
      expect(reporter.setUser).toHaveBeenLastCalledWith(null);
    } finally {
      errorReporterSeam.reset();
    }
  });

  it('keeps an existing session from before the marker existed', async () => {
    // An app updated to this version: no marker yet, but its stored user is
    // there, so this is not a fresh install.
    await storeSession();

    await renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('stored-token');
    await expect(getItem(STORAGE_KEYS.INSTALL_MARKER)).resolves.toBe(true);
  });
});
