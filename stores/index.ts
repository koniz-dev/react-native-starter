/**
 * Stores Index
 * Central export point for all Zustand stores
 * Provides clean import paths for consumers
 */

// Auth store
export {
  useAuthStore,
  useAuthUser,
  useAuthToken,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
} from './useAuthStore';

// Todos store
export {
  useTodosStore,
  useTodos,
  useTodosLoading,
  useTodosError,
  useCompletedTodos,
  usePendingTodos,
  useTodosCount,
  useCompletedTodosCount,
} from './useTodosStore';

