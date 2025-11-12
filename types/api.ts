/**
 * API Types
 * TypeScript interfaces for API responses and errors
 */

// User interface matching JSONPlaceholder API
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
}

// Todo interface matching JSONPlaceholder API
export interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}

// API error response structure
export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}
