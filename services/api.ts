/**
 * API Service
 * Axios instance with interceptors for authentication and error handling
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { STORAGE_KEYS } from './storage';
import { getSecureItem } from './secureStorage';
import type { ApiError } from '@/types/api';
import { getConfig } from '@/config/env';

// Create Axios instance. The base URL comes from validated config and is
// applied per request (see the request interceptor), so importing this module
// never reads configuration.
const api: AxiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Returns the normalized origin (`scheme://host[:port]`, lowercase, default
 * ports dropped) of an absolute URL, or null if the URL is not absolute.
 * Parsed by hand because React Native's URL implementation is incomplete.
 */
export function getOrigin(url: string): string | null {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#@]+@)?([^/?#]+)/i.exec(url);
  if (!match) {
    return null;
  }
  const scheme = match[1].toLowerCase();
  let host = match[3].toLowerCase();
  if (
    (scheme === 'https' && host.endsWith(':443')) ||
    (scheme === 'http' && host.endsWith(':80'))
  ) {
    host = host.slice(0, host.lastIndexOf(':'));
  }
  return `${scheme}://${host}`;
}

/**
 * Origins that may receive the bearer token. The token is issued by the auth
 * backend, so by default only its origin (EXPO_PUBLIC_AUTH_API_URL) is
 * trusted; add other first-party hosts, such as an API on a separate domain,
 * to EXPO_PUBLIC_API_TRUSTED_ORIGINS (comma-separated). Requests to any other
 * origin, including absolute URLs passed to `api`, are sent without the
 * Authorization header. In the demo, the JSONPlaceholder API is a different
 * third party from DummyJSON and therefore never receives the token.
 */
export function getTrustedTokenOrigins(): ReadonlySet<string> {
  const { authApiUrl, apiTrustedOrigins } = getConfig();
  return new Set(
    [authApiUrl, ...apiTrustedOrigins]
      .map(getOrigin)
      .filter((origin): origin is string => origin !== null)
  );
}

// Request interceptor: add the auth token only for trusted origins
api.interceptors.request.use(
  async config => {
    config.baseURL ??= getConfig().apiUrl;

    const origin = getOrigin(api.getUri(config));
    if (!origin || !getTrustedTokenOrigins().has(origin)) {
      return config;
    }

    const token = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors globally
api.interceptors.response.use(
  response => {
    return response;
  },
  (error: AxiosError) => {
    // Format error for consistent error handling
    const apiError: ApiError = {
      message: error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };

    // Log error for debugging
    console.error('API Error:', apiError);

    return Promise.reject(apiError);
  }
);

// Example API endpoints using JSONPlaceholder mock API

/**
 * User API endpoints
 */
export const userApi = {
  // Get all users
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID
  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
};

/**
 * Todos API endpoints
 */
export const todosApi = {
  // Get all todos
  getAll: async () => {
    const response = await api.get('/todos');
    return response.data;
  },

  // Get todos by user ID
  getByUserId: async (userId: number) => {
    const response = await api.get(`/todos?userId=${userId}`);
    return response.data;
  },

  // Get todo by ID
  getById: async (id: number) => {
    const response = await api.get(`/todos/${id}`);
    return response.data;
  },
};

// Export the configured Axios instance for custom requests
export default api;
