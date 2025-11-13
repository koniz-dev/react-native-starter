/**
 * Authentication Service
 * Handles login, logout, and token management
 */
import { setItem, removeItem, getItem, STORAGE_KEYS } from './storage';
import api from './api';

export interface LoginCredentials {
  email: string;
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

/**
 * Authentication service for handling login/logout
 */
export const authService = {
  /**
   * Login with email and password
   * Stores the auth token in storage for automatic API requests
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { token, user } = response.data;

    // Store token - API client will automatically add it to requests
    await setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await setItem(STORAGE_KEYS.USER_DATA, user);

    return response.data;
  },

  /**
   * Logout - removes auth token and user data
   */
  logout: async (): Promise<void> => {
    await removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await removeItem(STORAGE_KEYS.USER_DATA);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
    return token !== null;
  },

  /**
   * Get current user data from storage
   */
  getCurrentUser: async () => {
    return getItem<AuthResponse['user']>(STORAGE_KEYS.USER_DATA);
  },
};
