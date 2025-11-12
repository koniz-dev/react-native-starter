/**
 * API Service
 * Axios instance with interceptors for authentication and error handling
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { getItem } from './storage';
import { STORAGE_KEYS } from './storage';
import type { ApiError } from '@/types/api';

// Get base URL from environment variable
const baseURL =
  process.env.EXPO_PUBLIC_API_URL || 'https://jsonplaceholder.typicode.com';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token to requests
api.interceptors.request.use(
  async config => {
    // Get auth token from storage
    const token = await getItem<string>(STORAGE_KEYS.AUTH_TOKEN);

    // Add token to Authorization header if available
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
