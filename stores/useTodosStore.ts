/**
 * Todos Store
 * Zustand store for todos state management
 * Includes CRUD operations and async fetching
 */
import { create } from 'zustand';
import { todosApi } from '@/services/api';
import type { Todo } from '@/types/api';

interface TodosState {
  // State
  todos: Todo[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTodos: () => Promise<void>;
  fetchTodosByUserId: (userId: number) => Promise<void>;
  addTodo: (todo: Omit<Todo, 'id'>) => Promise<void>;
  updateTodo: (id: number, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Todos store with async operations
 * Integrates with todosApi service
 */
export const useTodosStore = create<TodosState>(set => ({
  // Initial state
  todos: [],
  loading: false,
  error: null,

  // Fetch all todos
  fetchTodos: async () => {
    set({ loading: true, error: null });
    try {
      const data = await todosApi.getAll();
      set({
        todos: data,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch todos.';
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  // Fetch todos by user ID
  fetchTodosByUserId: async (userId: number) => {
    set({ loading: true, error: null });
    try {
      const data = await todosApi.getByUserId(userId);
      set({
        todos: data,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch todos.';
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  // Add a new todo (optimistic update)
  addTodo: async (todoData: Omit<Todo, 'id'>) => {
    set({ loading: true, error: null });
    try {
      // For demo purposes, we'll create a temporary ID
      // In a real app, this would come from the API response
      const tempId = Date.now();
      const newTodo: Todo = {
        ...todoData,
        id: tempId,
      };

      // Optimistically add to state
      set(state => ({
        todos: [...state.todos, newTodo],
        loading: false,
      }));

      // In a real app, you would call the API here:
      // const created = await todosApi.create(todoData);
      // Then update with the real ID from the response
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add todo.';
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  // Update an existing todo
  updateTodo: async (id: number, updates: Partial<Todo>) => {
    set({ loading: true, error: null });
    try {
      // Optimistically update in state
      set(state => ({
        todos: state.todos.map(todo =>
          todo.id === id ? { ...todo, ...updates } : todo
        ),
        loading: false,
      }));

      // In a real app, you would call the API here:
      // await todosApi.update(id, updates);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update todo.';
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  // Delete a todo
  deleteTodo: async (id: number) => {
    set({ loading: true, error: null });
    try {
      // Optimistically remove from state
      set(state => ({
        todos: state.todos.filter(todo => todo.id !== id),
        loading: false,
      }));

      // In a real app, you would call the API here:
      // await todosApi.delete(id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete todo.';
      set({
        loading: false,
        error: errorMessage,
      });
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },

  // Reset store to initial state
  reset: () => {
    set({
      todos: [],
      loading: false,
      error: null,
    });
  },
}));

// Selectors for computed values
export const useTodos = () => useTodosStore(state => state.todos);
export const useTodosLoading = () => useTodosStore(state => state.loading);
export const useTodosError = () => useTodosStore(state => state.error);
export const useCompletedTodos = () =>
  useTodosStore(state => state.todos.filter(todo => todo.completed));
export const usePendingTodos = () =>
  useTodosStore(state => state.todos.filter(todo => !todo.completed));
export const useTodosCount = () => useTodosStore(state => state.todos.length);
export const useCompletedTodosCount = () =>
  useTodosStore(state => state.todos.filter(todo => todo.completed).length);

