import {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { parseEnv } from '@/shared/config/env';
import { getOrigin } from '@/shared/http/httpClient';
import {
  authClients,
  authService,
  setAuthAdapter,
} from '@/shared/session/authService';
import {
  onSessionExpired,
  setRefreshTokenHandler,
  setUnauthorizedHandler,
} from '@/shared/session/session';
import { STORAGE_KEYS, setItem } from '@/shared/storage/storage';
import { secureStore } from '@/testing';

function response(config: InternalAxiosRequestConfig, status: number) {
  return { config, status, data: {}, statusText: String(status), headers: {} };
}
function httpError(config: InternalAxiosRequestConfig, status: number) {
  return new AxiosError('x', 'ERR_BAD_REQUEST', config, undefined, response(config, status));
}

describe('F1 refresh through the authenticated client', () => {
  const original = authClients.authenticated.defaults.adapter;
  afterEach(() => {
    authClients.authenticated.defaults.adapter = original;
    setAuthAdapter(null);
    setRefreshTokenHandler(null);
    setUnauthorizedHandler(null);
  });

  it('settles (fails) instead of hanging when the refresh call itself gets a 401', async () => {
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'expired');
    await setItem(STORAGE_KEYS.USER_DATA, { id: 1, email: 'e', name: 'e' });
    // Every request with the expired token is a 401, including the refresh
    // call, which this adapter sends on the authenticated client (e.g. a
    // backend that wants the old access token alongside the refresh token).
    authClients.authenticated.defaults.adapter = async config => {
      throw httpError(config, 401);
    };
    setAuthAdapter({
      login: async () => ({ token: 't', user: {} }),
      normalizeUser: () => ({ id: 1, email: 'e', name: 'e' }),
      fetchUser: async ({ authenticated }) => (await authenticated.get('/me')).data,
      refresh: async ({ authenticated }) => {
        const { data } = await authenticated.post('/refresh');
        return (data as { token: string }).token;
      },
    });
    const expired = jest.fn();
    const off = onSessionExpired(expired);
    const outcome = await Promise.race([
      authService.fetchProfile().then(
        () => 'resolved',
        () => 'rejected'
      ),
      new Promise(resolve => setTimeout(() => resolve('HUNG'), 1000)),
    ]);
    off();
    expect({ outcome, expired: expired.mock.calls.length }).toEqual({
      outcome: 'rejected',
      expired: 1,
    });
  });
});

describe('F2 EXPO_PUBLIC_APP_ENV= (empty)', () => {
  it('counts as not set, like every other variable', () => {
    const result = parseEnv(
      {
        EXPO_PUBLIC_APP_ENV: '',
        EXPO_PUBLIC_API_URL: 'https://api.example.com',
        EXPO_PUBLIC_AUTH_API_URL: 'https://auth.example.com',
      },
      false
    );
    expect(result.success ? 'ok' : result.issues).toBe('ok');
  });
  it('tolerates surrounding whitespace, like every other variable', () => {
    const result = parseEnv(
      {
        EXPO_PUBLIC_APP_ENV: 'production ',
        EXPO_PUBLIC_API_URL: 'https://api.example.com ',
        EXPO_PUBLIC_AUTH_API_URL: 'https://auth.example.com',
      },
      false
    );
    expect(result.success ? 'ok' : result.issues).toBe('ok');
  });
});

describe('F3 env accepts an auth URL the token origin check rejects', () => {
  it.each(['https://auth.example.com /v1', 'https://auth example.com'])(
    '%j',
    url => {
      const result = parseEnv(
        {
          EXPO_PUBLIC_APP_ENV: 'production',
          EXPO_PUBLIC_API_URL: 'https://api.example.com',
          EXPO_PUBLIC_AUTH_API_URL: url,
        },
        false
      );
      // Either reject it at startup, or the token origin must be usable.
      expect(!result.success || getOrigin(url) !== null).toBe(true);
    }
  );
});

describe('F4 cold-start restore failure', () => {
  it('is logged', async () => {
    const { logger } = jest.requireActual('@/shared/lib/logger') as typeof import('@/shared/lib/logger');
    const error = jest.spyOn(logger, 'error').mockImplementation(() => {});
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('keystore'));
    const { SessionProvider, useSession } = jest.requireActual('@/shared/session/SessionProvider') as typeof import('@/shared/session/SessionProvider');
    const { render, screen } = await import('@testing-library/react-native');
    const React = await import('react');
    const { Text } = await import('react-native');
    function Status() {
      return React.createElement(Text, null, useSession().session.status);
    }
    await setItem(STORAGE_KEYS.USER_DATA, { id: 1, email: 'e', name: 'e' });
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'tok');
    render(React.createElement(SessionProvider, null, React.createElement(Status)));
    await screen.findByText('signedOut');
    // The token is still stored (not cleared), yet the user sees signed out,
    // and nothing was logged or reported.
    expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('tok');
    expect(error.mock.calls.length + warn.mock.calls.length).toBeGreaterThan(0);
  });
});
