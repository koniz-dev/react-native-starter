/**
 * Authentication Service
 * Handles login, logout, and token management
 */
import { getConfig } from '@/config/env';
import { createHttpClient } from './httpClient';
import { clearStoredSession } from './session';
import { setItem, getItem, STORAGE_KEYS } from './storage';
import { getSecureItem, setSecureItem } from './secureStorage';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

interface DemoAuthResponse {
  accessToken?: string;
  token?: string;
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  user?: AuthResponse['user'];
}

// The auth backend's own client. Not `authenticated`: a 401 here means wrong
// credentials, not an expired session. withCredentials is off because React
// Native's XMLHttpRequest defaults it to true, so the native cookie store would
// keep any token cookies the auth server sets (DummyJSON sets
// accessToken/refreshToken); the token belongs in secure storage only.
export const authApi = createHttpClient({
  getBaseURL: () => getConfig().authApiUrl,
  withCredentials: false,
});

function normalizeAuthResponse(data: DemoAuthResponse): AuthResponse {
  const token = data.accessToken || data.token;

  if (!token) {
    throw new Error(
      'The authentication response did not include an access token'
    );
  }

  if (data.user) {
    return { token, user: data.user };
  }

  if (!data.id || !data.email) {
    throw new Error(
      'The authentication response did not include user information'
    );
  }

  return {
    token,
    user: {
      id: data.id,
      email: data.email,
      name:
        [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email,
    },
  };
}

/**
 * Authentication service for handling login/logout
 */
export const authService = {
  /**
   * Login with username and password
   * Stores the auth token in storage for automatic API requests
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await authApi.post<DemoAuthResponse>('/auth/login', {
      ...credentials,
      expiresInMins: 60,
    });
    const authResponse = normalizeAuthResponse(response.data);
    const { token, user } = authResponse;

    // Store token - API client will automatically add it to requests
    await setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await setItem(STORAGE_KEYS.USER_DATA, user);

    return authResponse;
  },

  /**
   * Logout - removes auth token and user data
   */
  logout: async (): Promise<void> => {
    await clearStoredSession();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    return token !== null;
  },

  /**
   * Get current user data from storage
   */
  getCurrentUser: async () => {
    return getItem<AuthResponse['user']>(STORAGE_KEYS.USER_DATA);
  },
};
