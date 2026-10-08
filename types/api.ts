/**
 * API Types
 * TypeScript interfaces for API responses and errors
 */

// Todo interface matching JSONPlaceholder API
export interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}
