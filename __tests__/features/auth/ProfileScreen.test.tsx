import { AccessibilityInfo, Platform } from 'react-native';
import { AxiosError } from 'axios';
import { renderRouter, screen } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';
import { act, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '@/features/auth/screens/ProfileScreen';
import { ApiError } from '@/shared/http/apiError';
import {
  authClients,
  authService,
  setAuthAdapter,
} from '@/shared/session/authService';
import { configureIntegrations } from '@/shared/integrations/setup';
import { getConfig } from '@/shared/config/env';
import { logger } from '@/shared/lib/logger';
import { setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { renderWithProviders, secureStore } from '@/testing';
import { documentTitles } from '@/testing/documentTitle';

// DocumentTitle renders nothing on native; this one shows its title.
jest.mock('@/shared/ui/DocumentTitle', () =>
  jest.requireActual('@/testing/documentTitle')
);

async function signInWithoutProfile() {
  secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
  await setItem(STORAGE_KEYS.INSTALL_MARKER, true);
}

describe('<ProfileScreen />', () => {
  afterEach(() => {
    setAuthAdapter(null);
    jest.restoreAllMocks();
  });

  it('shows placeholders until a profile is known', async () => {
    await signInWithoutProfile();
    jest.spyOn(authService, 'fetchProfile').mockResolvedValue(null);

    const { findByTestId, queryByTestId, getAllByText } =
      await renderWithProviders(<ProfileScreen />, { withSession: true });

    await findByTestId('profile-logout');
    await waitForRefresh(queryByTestId);
    expect(getAllByText('Not available')).toHaveLength(2);
  });

  it('names the browser tab', async () => {
    await signInWithoutProfile();
    jest.spyOn(authService, 'fetchProfile').mockResolvedValue(null);

    const view = await renderWithProviders(<ProfileScreen />, {
      withSession: true,
    });

    await view.findByTestId('profile-logout');
    await waitForRefresh(view.queryByTestId);
    expect(documentTitles()).toEqual(['Profile']);
  });

  it('shows the placeholder for an empty name', async () => {
    await signInWithoutProfile();
    await setItem(STORAGE_KEYS.USER_DATA, {
      id: 1,
      email: 'emily@example.com',
      name: ' ',
    });
    jest.spyOn(authService, 'fetchProfile').mockResolvedValue(null);

    const { findByText, getByText } = await renderWithProviders(
      <ProfileScreen />,
      {
        withSession: true,
      }
    );

    expect(await findByText('emily@example.com')).toBeTruthy();
    expect(getByText('Not available')).toBeTruthy();
  });

  it('shows and announces a failed reload in a live region', async () => {
    await signInWithoutProfile();
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    jest
      .spyOn(authService, 'fetchProfile')
      .mockRejectedValue(new ApiError('Network Error', { code: 'network' }));

    const { findByTestId } = await renderWithProviders(<ProfileScreen />, {
      withSession: true,
    });

    const error = await findByTestId('profile-error');
    const status = await findByTestId('profile-status');
    const message =
      'Could not refresh your profile: No connection. Check your network and try again.';
    expect(error).toHaveTextContent(message);
    expect(status.props.accessibilityLiveRegion).toBe('polite');
    expect(status).toContainElement(error);
    expect(announce).toHaveBeenCalledWith(message);
  });

  it('shows an unauthorized refresh failure when the session remains signed in', async () => {
    await signInWithoutProfile();
    jest
      .spyOn(authService, 'fetchProfile')
      .mockRejectedValue(new ApiError('Expired', { code: 'unauthorized' }));

    const { findByTestId, queryByTestId } = await renderWithProviders(
      <ProfileScreen />,
      { withSession: true }
    );

    await findByTestId('profile-logout');
    await waitForRefresh(queryByTestId);
    expect(await findByTestId('profile-error')).toHaveTextContent(
      'Could not refresh your profile: Something went wrong. Please try again.'
    );
  });

  it.each(['redirect', 'token-read'])(
    'shows and announces a 401 retained by the HTTP client (%s)',
    async reason => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      const announce = jest.spyOn(
        AccessibilityInfo,
        'announceForAccessibility'
      );
      const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
      await seedProfileSession();
      const original = authClients.authenticated.defaults.adapter;
      authClients.authenticated.defaults.adapter = async config => {
        if (reason === 'token-read') {
          jest
            .mocked(SecureStore.getItemAsync)
            .mockRejectedValueOnce(new Error('Keychain locked'));
        }
        throw new AxiosError(
          'Unauthorized',
          'ERR_BAD_REQUEST',
          config,
          reason === 'redirect'
            ? { responseURL: `${getConfig().authApiUrl}/auth/me/` }
            : undefined,
          {
            config,
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            data: { message: 'Please try again.' },
          }
        );
      };
      try {
        const app = await renderRouter('./app', { initialUrl: '/profile' });
        const message = 'Could not refresh your profile: Please try again.';
        expect(await screen.findByTestId('profile-error')).toHaveTextContent(
          message
        );
        await waitForRefresh(screen.queryByTestId);
        expect(app.getPathname()).toBe('/profile');
        expect(screen.getByText('Cached profile')).toBeTruthy();
        expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('stored-token');
        expect(
          screen.getByTestId('profile-status').props.accessibilityLiveRegion
        ).toBe('polite');
        expect(announce).toHaveBeenCalledWith(message);
        expect(warn).toHaveBeenCalledWith(
          reason === 'redirect'
            ? expect.stringContaining('401 after a redirect')
            : 'Reading the token after a 401 failed',
          reason === 'redirect' ? { status: 401 } : { error: 'Keychain locked' }
        );
      } finally {
        authClients.authenticated.defaults.adapter = original;
      }
    }
  );

  it('leaves Profile without announcing a refresh error when a 401 actually expires the session', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await seedProfileSession();
    const original = authClients.authenticated.defaults.adapter;
    authClients.authenticated.defaults.adapter = async config => {
      throw new AxiosError('Expired', 'ERR_BAD_REQUEST', config, undefined, {
        config,
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        data: { message: 'Session expired' },
      });
    };
    try {
      const app = await renderRouter('./app', { initialUrl: '/profile' });
      expect(await screen.findByText('Not signed in')).toBeTruthy();
      expect(app.getPathname()).toBe('/');
      expect(screen.queryByTestId('profile-error')).toBeNull();
      expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
      expect(announce).not.toHaveBeenCalledWith(
        expect.stringContaining('Could not refresh your profile')
      );
    } finally {
      authClients.authenticated.defaults.adapter = original;
    }
  });

  it('shows a labeled indicator while reloading', async () => {
    await signInWithoutProfile();
    const pending: (() => void)[] = [];
    jest
      .spyOn(authService, 'fetchProfile')
      .mockImplementation(
        () => new Promise(resolve => pending.push(() => resolve(null)))
      );
    const { findByLabelText, queryByTestId } = await renderWithProviders(
      <ProfileScreen />,
      { withSession: true }
    );

    expect(await findByLabelText('Refreshing your profile')).toBeTruthy();
    await act(async () => pending.forEach(finish => finish()));
    await waitForRefresh(queryByTestId);
  });

  it('logs a reload that failed for a reason other than the server', async () => {
    await signInWithoutProfile();
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => {});
    const failure = new Error('The profile did not match the schema');
    jest.spyOn(authService, 'fetchProfile').mockRejectedValue(failure);

    const { findByTestId } = await renderWithProviders(<ProfileScreen />, {
      withSession: true,
    });

    expect(await findByTestId('profile-error')).toHaveTextContent(
      /Something went wrong/
    );
    expect(logged).toHaveBeenCalledWith(
      'Refreshing the profile failed',
      failure
    );
  });
});

/** Uses the real session service and HTTP client, with only the backend replaced. */
async function seedProfileSession(): Promise<void> {
  configureIntegrations();
  const user = { id: 1, name: 'Cached profile', email: 'cached@example.com' };
  setAuthAdapter({
    login: async () => ({ token: 'unused', user }),
    normalizeUser: () => user,
    fetchUser: async ({ authenticated }) => {
      const { data } = await authenticated.get<unknown>('/auth/me');
      return data;
    },
  });
  await signInWithoutProfile();
  await setItem(STORAGE_KEYS.USER_DATA, user);
}

/** Waits until the screen's refresh has settled (the spinner is gone). */
async function waitForRefresh(
  queryByTestId: (id: string) => unknown
): Promise<void> {
  await waitFor(() => expect(queryByTestId('profile-refreshing')).toBeNull());
}
