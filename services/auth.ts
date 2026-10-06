/**
 * Authentication Service
 * Handles login, logout, and token management
 */
import axios from 'axios';
import { getConfig } from '@/config/env';
import { setItem, removeItem, getItem, STORAGE_KEYS } from './storage';
import {
  getSecureItem,
  removeSecureItem,
  setSecureItem,
} from './secureStorage';

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

export const authApi = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  // React Native's XMLHttpRequest defaults withCredentials to true, so the
  // native cookie store would keep any token cookies the auth server sets
  // (DummyJSON sets accessToken/refreshToken). The token belongs in secure
  // storage only, so don't store or send cookies for auth requests.
  withCredentials: false,
});

// The base URL comes from validated config, applied per request so that
// importing this module never reads configuration.
authApi.interceptors.request.use(config => {
  config.baseURL ??= getConfig().authApiUrl;
  return config;
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
    await removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    await removeItem(STORAGE_KEYS.USER_DATA);
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
