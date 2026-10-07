/**
 * API Service
 * The app's API client and the demo endpoints that use it. All HTTP rules
 * (config, timeout, token origins, ApiError, 401 handling) live in
 * services/httpClient.ts.
 */
import { getConfig } from '@/config/env';
import { createHttpClient } from './httpClient';

export { getOrigin, getTrustedTokenOrigins } from './httpClient';

const api = createHttpClient({
  getBaseURL: () => getConfig().apiUrl,
  authenticated: true,
});

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
