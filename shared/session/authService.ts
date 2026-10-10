/**
 * Backend-agnostic authentication.
 *
 * The auth service stores the token (token store) and the user profile
 * (AsyncStorage) and drives the session; how credentials become a token and
 * what the user payload looks like is up to an AuthAdapter. To use your
 * backend, write an adapter (see docs/connect-your-backend.md)
 * and register it with setAuthAdapter() in shared/integrations/setup.ts.
 * Until one is registered, sign-in fails with a "not configured" error.
 */
import type { AxiosInstance } from 'axios';
import { getConfig } from '@/shared/config/env';
import { toApiError } from '@/shared/http/apiError';
import { createHttpClient } from '@/shared/http/httpClient';
import { logger } from '@/shared/lib/logger';
import { getItem, setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { clearStoredSession, setRefreshTokenHandler } from './session';
import { getTokenStore } from './tokenStore';

export interface LoginCredentials {
  username: string;
  password: string;
}

/** The signed-in user as the app sees it, whatever the backend returns. */
export interface AuthUser {
  id: number | string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

/** HTTP clients for the auth backend (EXPO_PUBLIC_AUTH_API_URL). */
export interface AuthClients {
  /** No token; a 401 here is a wrong password, not an expired session. */
  public: AxiosInstance;
  /** Sends the stored token; a 401 here signs the user out. */
  authenticated: AxiosInstance;
}

export interface AuthAdapter {
  /** Exchanges credentials for an access token and the backend's user payload. */
  login(
    credentials: LoginCredentials,
    clients: AuthClients
  ): Promise<{ token: string; user: unknown }>;
  /** Maps the backend's user payload to AuthUser; throws if it is incomplete. */
  normalizeUser(raw: unknown): AuthUser;
  /** Loads the current user with the stored token (used by the profile screen). */
  fetchUser?(clients: AuthClients): Promise<unknown>;
  /**
   * Obtains a new access token, e.g. with a refresh token the adapter keeps;
   * null when the session can't be refreshed. Called once on a 401.
   */
  refresh?(clients: AuthClients): Promise<string | null>;
  /**
   * Ends the session on the backend and drops what the adapter keeps, e.g.
   * revokes and deletes a refresh token. Called on sign-out while the access
   * token is still stored; if it fails, the failure is logged and the user is
   * signed out anyway.
   */
  logout?(clients: AuthClients): Promise<void>;
}

/** Default until an adapter is registered: sign-in reports it isn't set up. */
export const notConfiguredAuthAdapter: AuthAdapter = {
  login: async () => {
    throw new Error(
      'Sign-in is not configured: register an AuthAdapter in shared/integrations/setup.ts.'
    );
  },
  normalizeUser: () => {
    throw new Error('Sign-in is not configured.');
  },
};

// withCredentials is off because React Native's XMLHttpRequest defaults it to
// true, so the native cookie store would keep any token cookies the auth
// server sets; the token belongs in the token store only.
const clients: AuthClients = {
  public: createHttpClient({
    getBaseURL: () => getConfig().authApiUrl,
    withCredentials: false,
  }),
  authenticated: createHttpClient({
    getBaseURL: () => getConfig().authApiUrl,
    authenticated: true,
    withCredentials: false,
  }),
};

/** The auth backend clients (exported for tests and custom calls). */
export const authClients: Readonly<AuthClients> = clients;

let adapter: AuthAdapter = notConfiguredAuthAdapter;

/**
 * Registers the adapter for your auth backend. If it can refresh tokens, it
 * also becomes the HTTP client's refresh handler.
 */
export function setAuthAdapter(next: AuthAdapter | null): void {
  adapter = next ?? notConfiguredAuthAdapter;
  const refresh = adapter.refresh?.bind(adapter);
  setRefreshTokenHandler(
    refresh
      ? async () => {
          const token = await refresh(clients);
          if (token) await getTokenStore().set(token);
          return token;
        }
      : null
  );
}

export function getAuthAdapter(): AuthAdapter {
  return adapter;
}

export const authService = {
  /** Signs in through the adapter and stores the token and profile. */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const result = await adapter.login(credentials, clients);
    if (typeof result.token !== 'string' || !result.token) {
      throw new Error(
        'The authentication response did not include an access token'
      );
    }
    const user = adapter.normalizeUser(result.user);

    await getTokenStore().set(result.token);
    await setItem(STORAGE_KEYS.USER_DATA, user);
    return { token: result.token, user };
  },

  /**
   * Signs out: lets the adapter end the session on the backend, then removes
   * the token and the stored profile, even if the adapter failed.
   */
  logout: async (): Promise<void> => {
    try {
      await adapter.logout?.(clients);
    } catch (error) {
      // Often just offline; not worth an error report.
      logger.warn('Signing out on the auth backend failed', {
        error: toApiError(error).message,
      });
    }
    await clearStoredSession();
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await getTokenStore().get();
    return token !== null;
  },

  /** The stored profile, or null. */
  getCurrentUser: async () => getItem<AuthUser>(STORAGE_KEYS.USER_DATA),

  /**
   * Reloads the user from the backend when the adapter supports it (and
   * stores it); otherwise returns the stored profile. Rejects with an
   * ApiError; a 401 also clears the session.
   */
  fetchProfile: async (): Promise<AuthUser | null> => {
    if (!adapter.fetchUser) {
      return authService.getCurrentUser();
    }
    const user = adapter.normalizeUser(await adapter.fetchUser(clients));
    await setItem(STORAGE_KEYS.USER_DATA, user);
    return user;
  },
};
