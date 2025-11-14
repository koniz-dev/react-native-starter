/**
 * Contexts Index
 * Central export point for all contexts and their hooks
 */

// Auth Context
export { AuthProvider, useAuth } from './AuthContext';
export type { AuthContextValue } from './AuthContext';

// Todos Context
export { TodosProvider, useTodos } from './TodosContext';
export type { TodosContextValue } from './TodosContext';
