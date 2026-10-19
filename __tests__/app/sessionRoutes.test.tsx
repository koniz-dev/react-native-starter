import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { authService } from '@/shared/session/authService';
import {
  useSession,
  type SessionContextValue,
} from '@/shared/session/SessionProvider';
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

  it('the protected back button returns to the screen that opened it, not Home', async () => {
    function Settings() {
      return <Text>Settings screen</Text>;
    }
    await storeSession();
    const app = await renderRouter(
      { appDir: './app', overrides: { settings: Settings } },
      { initialUrl: '/' }
    );
    await screen.findByText('Signed in as Emily Johnson');
    await act(() => router.push('/settings'));
    await screen.findByText('Settings screen');
    await act(() => router.push('/profile'));
    await screen.findByText('emily@example.com');

    await fireEvent.press(screen.getByTestId('protected-back'));

    expect(await screen.findByText('Settings screen')).toBeTruthy();
    expect(app.getPathname()).toBe('/settings');
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

  describe('leaves a single Home below', () => {
    // Expo Router 58 sends a user out of a guarded group with replace('/'),
    // which would stack a new Home over the one at the bottom: Back (Android)
    // or the edge swipe (iOS) would then show Home again.
    const rootRoutes = (app: { getRouterState(): unknown }) =>
      (
        app.getRouterState() as {
          routes: { state?: { routes: { name: string }[] } }[];
        }
      ).routes[0]?.state?.routes.map(route => route.name);

    it('after signing in and out, again and again', async () => {
      jest.spyOn(authService, 'login').mockImplementation(async () => {
        await storeSession();
        return { token: 'stored-token', user };
      });
      const app = await renderRouter('./app', { initialUrl: '/' });
      await screen.findByText('Not signed in');

      for (let round = 0; round < 2; round++) {
        await fireEvent.press(screen.getByTestId('sign-in-button'));
        await screen.findByText('Welcome Back');
        await fireEvent.changeText(
          screen.getByTestId('login-username'),
          'emily'
        );
        await fireEvent.changeText(
          screen.getByTestId('login-password'),
          'pass'
        );
        await fireEvent.press(screen.getByTestId('login-submit'));
        expect(
          await screen.findByText('Signed in as Emily Johnson')
        ).toBeTruthy();
        expect(rootRoutes(app)).toEqual(['(tabs)']);

        await fireEvent.press(screen.getByTestId('profile-button'));
        await screen.findByText('emily@example.com');
        await fireEvent.press(screen.getByTestId('profile-logout'));
        expect(await screen.findByText('Not signed in')).toBeTruthy();
        expect(rootRoutes(app)).toEqual(['(tabs)']);
      }
      expect(router.canGoBack()).toBe(false);
    });

    describe('over a screen that opened Login or Profile', () => {
      function Settings() {
        return <Text>Settings screen</Text>;
      }
      const openOverSettings = async (path: '/login' | '/profile') => {
        const app = await renderRouter(
          { appDir: './app', overrides: { settings: Settings } },
          { initialUrl: '/' }
        );
        await screen.findByText(/Not signed in|Signed in as/);
        await act(() => router.push('/settings'));
        await screen.findByText('Settings screen');
        await act(() => router.push(path));
        return app;
      };

      it.each([
        ['navigate', () => router.navigate('/')],
        ['push', () => router.push('/')],
      ])('still lets that screen %s to Home', async (_, go) => {
        const app = await renderRouter(
          { appDir: './app', overrides: { settings: Settings } },
          { initialUrl: '/' }
        );
        await screen.findByText('Not signed in');
        await act(() => router.push('/settings'));
        await screen.findByText('Settings screen');

        await act(go);

        expect(await screen.findByText('Not signed in')).toBeTruthy();
        expect(app.getPathname()).toBe('/');
      });

      it('still lets Profile push Home', async () => {
        await storeSession();
        const app = await renderRouter('./app', { initialUrl: '/' });
        await screen.findByText('Signed in as Emily Johnson');
        await act(() => router.push('/profile'));
        await screen.findByText('emily@example.com');

        await act(() => router.push('/'));

        expect(
          await screen.findByText('Signed in as Emily Johnson')
        ).toBeTruthy();
        expect(app.getPathname()).toBe('/');
      });

      // @demo remove-block-start
      it('still lets that screen replace itself with a tab', async () => {
        const app = await renderRouter(
          { appDir: './app', overrides: { settings: Settings } },
          { initialUrl: '/' }
        );
        await screen.findByText('Not signed in');
        await act(() => router.push('/settings'));
        await screen.findByText('Settings screen');

        await act(() => router.replace('/explore'));

        expect(app.getPathname()).toBe('/explore');
      });
      // @demo remove-block-end

      it("leaves Profile's own replace with Home alone", async () => {
        await storeSession();
        const app = await openOverSettings('/profile');
        await screen.findByText('emily@example.com');

        await act(() => router.replace('/'));

        expect(
          await screen.findByText('Signed in as Emily Johnson')
        ).toBeTruthy();
        expect(app.getPathname()).toBe('/');
      });

      // @demo remove-block-start
      it.each([
        ['Profile', '/profile' as const, true],
        ['Login', '/login' as const, false],
      ])(
        "leaves %s's own replace with a tab alone",
        async (_, path, signedIn) => {
          if (signedIn) await storeSession();
          const app = await openOverSettings(path);
          await screen.findByText(
            signedIn ? 'emily@example.com' : 'Welcome Back'
          );

          await act(() => router.replace('/explore'));

          expect(app.getPathname()).toBe('/explore');
        }
      );
      // @demo remove-block-end

      it('signing in returns to that screen', async () => {
        jest.spyOn(authService, 'login').mockImplementation(async () => {
          await storeSession();
          return { token: 'stored-token', user };
        });
        const app = await openOverSettings('/login');
        await screen.findByText('Welcome Back');
        await fireEvent.changeText(
          screen.getByTestId('login-username'),
          'emily'
        );
        await fireEvent.changeText(
          screen.getByTestId('login-password'),
          'pass'
        );
        await fireEvent.press(screen.getByTestId('login-submit'));

        expect(await screen.findByText('Settings screen')).toBeTruthy();
        expect(app.getPathname()).toBe('/settings');
        expect(rootRoutes(app)).toEqual(['(tabs)', 'settings']);
      });

      it.each([
        [
          'signing out',
          () => fireEvent.press(screen.getByTestId('profile-logout')),
        ],
        [
          'a session that expires',
          () => act(() => defaultUnauthorizedHandler()),
        ],
      ])('%s on Profile returns to that screen', async (_, end) => {
        await storeSession();
        const app = await openOverSettings('/profile');
        await screen.findByText('emily@example.com');

        await end();

        expect(await screen.findByText('Settings screen')).toBeTruthy();
        expect(app.getPathname()).toBe('/settings');
        expect(rootRoutes(app)).toEqual(['(tabs)', 'settings']);
      });
    });

    describe("the app's own navigation around a session change", () => {
      // A screen that holds the session, to sign in or out from a test.
      let session: SessionContextValue | undefined;
      function Holder({ label }: { label: string }) {
        session = useSession();
        return <Text>{label}</Text>;
      }
      const Settings = () => <Holder label="Settings screen" />;
      const Settings2 = () => <Holder label="Settings2 screen" />;
      const credentials = { username: 'emily', password: 'pass' };
      beforeEach(() => {
        session = undefined;
        jest.spyOn(authService, 'login').mockImplementation(async () => {
          await storeSession();
          return { token: 'stored-token', user };
        });
      });

      it.each([
        ['signing out', () => session?.signOut()],
        ['a session that expires', () => defaultUnauthorizedHandler()],
      ])(
        '%s on a second (app) screen above Profile leaves one Home',
        async (_, end) => {
          await storeSession();
          const app = await renderRouter(
            { appDir: './app', overrides: { '(app)/settings2': Settings2 } },
            { initialUrl: '/' }
          );
          await screen.findByText('Signed in as Emily Johnson');
          await act(() => router.push('/profile'));
          await screen.findByText('emily@example.com');
          await act(() => router.push('/settings2'));
          await screen.findByText('Settings2 screen');

          await act(async () => {
            await end();
          });

          expect(await screen.findByText('Not signed in')).toBeTruthy();
          expect(rootRoutes(app)).toEqual(['(tabs)']);
        }
      );

      it.each([
        [
          'replace a root screen',
          () => router.replace('/settings2'),
          '/settings2',
        ],
        ['push Home', () => router.push('/'), '/'],
      ])('signing in, then at once to %s, gets there', async (_, go, path) => {
        const app = await renderRouter(
          {
            appDir: './app',
            overrides: { settings: Settings, settings2: Settings2 },
          },
          { initialUrl: '/' }
        );
        await screen.findByText('Not signed in');
        await act(() => router.push('/settings'));
        await screen.findByText('Settings screen');
        await act(() => router.push('/login'));
        await screen.findByText('Welcome Back');

        await act(async () => {
          await session?.signIn(credentials);
          go();
        });

        await waitFor(() => expect(app.getPathname()).toBe(path));
      });

      // @demo remove-block-start
      it('signing in, then at once replacing Login with a tab, gets there', async () => {
        const app = await renderRouter(
          { appDir: './app', overrides: { settings: Settings } },
          { initialUrl: '/' }
        );
        await screen.findByText('Not signed in');
        await act(() => router.push('/settings'));
        await screen.findByText('Settings screen');
        await act(() => router.push('/login'));
        await screen.findByText('Welcome Back');

        await act(async () => {
          await session?.signIn(credentials);
          router.replace('/explore');
        });

        await waitFor(() => expect(app.getPathname()).toBe('/explore'));
      });
      // @demo remove-block-end

      it.each([
        ['signing in on Login', '/login' as const, false],
        ['signing out on Profile', '/profile' as const, true],
      ])(
        '%s, then at once dismissTo Home, gets Home',
        async (_, path, signedIn) => {
          if (signedIn) await storeSession();
          const app = await renderRouter(
            { appDir: './app', overrides: { settings: Settings } },
            { initialUrl: '/' }
          );
          await screen.findByText(/Not signed in|Signed in as/);
          await act(() => router.push('/settings'));
          await screen.findByText('Settings screen');
          await act(() => router.push(path));
          await screen.findByText(
            signedIn ? 'emily@example.com' : 'Welcome Back'
          );

          await act(async () => {
            if (signedIn) await session?.signOut();
            else await session?.signIn(credentials);
            router.dismissTo('/');
          });

          await waitFor(() => expect(app.getPathname()).toBe('/'));
          expect(rootRoutes(app)).toEqual(['(tabs)']);
        }
      );

      it('signing out on another screen leaves its own replace with Home alone', async () => {
        await storeSession();
        const app = await renderRouter(
          { appDir: './app', overrides: { settings: Settings } },
          { initialUrl: '/' }
        );
        await screen.findByText('Signed in as Emily Johnson');
        await act(() => router.push('/settings'));
        await screen.findByText('Settings screen');
        await act(async () => {
          await session?.signOut();
        });

        await act(() => router.replace('/'));

        expect(await screen.findByText('Not signed in')).toBeTruthy();
        expect(rootRoutes(app)).toEqual(['(tabs)', '(tabs)']);
      });
    });

    it.each([
      ['/profile', false],
      ['/login', true],
    ])(
      'after a cold-start deep link to %s that the guard refuses',
      async (url, signedIn) => {
        if (signedIn) await storeSession();
        const app = await renderRouter('./app', { initialUrl: url });

        expect(
          await screen.findByText(
            signedIn ? 'Signed in as Emily Johnson' : 'Not signed in'
          )
        ).toBeTruthy();
        expect(rootRoutes(app)).toEqual(['(tabs)']);
        expect(router.canGoBack()).toBe(false);
      }
    );
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
