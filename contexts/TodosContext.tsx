/**
 * Todos Context
 * Production-ready todos context with TypeScript, CRUD operations,
 * async operations, and proper error handling. Uses useReducer for complex state.
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { todosApi } from '@/services/api';
import type { Todo } from '@/types/api';

// ============================================================================
// Types
// ============================================================================

interface TodosState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

type TodosAction =
  | { type: 'TODOS_FETCH_START' }
  | { type: 'TODOS_FETCH_SUCCESS'; payload: { todos: Todo[] } }
  | { type: 'TODOS_FETCH_FAILURE'; payload: { error: string } }
  | { type: 'TODO_ADD_START' }
  | { type: 'TODO_ADD_SUCCESS'; payload: { todo: Todo } }
  | { type: 'TODO_ADD_FAILURE'; payload: { error: string } }
  | { type: 'TODO_UPDATE_START' }
  | { type: 'TODO_UPDATE_SUCCESS'; payload: { todo: Todo } }
  | { type: 'TODO_UPDATE_FAILURE'; payload: { error: string } }
  | { type: 'TODO_DELETE_START' }
  | { type: 'TODO_DELETE_SUCCESS'; payload: { id: number } }
  | { type: 'TODO_DELETE_FAILURE'; payload: { error: string } }
  | { type: 'CLEAR_ERROR' };

export interface TodosContextValue extends TodosState {
  fetchTodos: () => Promise<void>;
  addTodo: (todo: Omit<Todo, 'id'>) => Promise<Todo | null>;
  updateTodo: (id: number, updates: Partial<Todo>) => Promise<Todo | null>;
  deleteTodo: (id: number) => Promise<void>;
  clearError: () => void;
  refetch: () => Promise<void>;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: TodosState = {
  todos: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

// ============================================================================
// Reducer
// ============================================================================

function todosReducer(state: TodosState, action: TodosAction): TodosState {
  switch (action.type) {
    case 'TODOS_FETCH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'TODOS_FETCH_SUCCESS':
      return {
        ...state,
        todos: action.payload.todos,
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
      };

    case 'TODOS_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };

    case 'TODO_ADD_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'TODO_ADD_SUCCESS':
      return {
        ...state,
        todos: [...state.todos, action.payload.todo],
        isLoading: false,
        error: null,
      };

    case 'TODO_ADD_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };

    case 'TODO_UPDATE_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'TODO_UPDATE_SUCCESS':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.todo.id ? action.payload.todo : todo
        ),
        isLoading: false,
        error: null,
      };

    case 'TODO_UPDATE_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };

    case 'TODO_DELETE_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'TODO_DELETE_SUCCESS':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload.id),
        isLoading: false,
        error: null,
      };

    case 'TODO_DELETE_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const TodosContext = createContext<TodosContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface TodosProviderProps {
  children: ReactNode;
  autoFetch?: boolean; // Option to auto-fetch on mount
}

export function TodosProvider({
  children,
  autoFetch = false,
}: TodosProviderProps) {
  const [state, dispatch] = useReducer(todosReducer, initialState);

  // Auto-fetch todos on mount if enabled
  useEffect(() => {
    if (autoFetch && state.todos.length === 0 && !state.isLoading) {
      fetchTodos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  // Fetch all todos
  const fetchTodos = useCallback(async () => {
    dispatch({ type: 'TODOS_FETCH_START' });

    try {
      const todos = await todosApi.getAll();
      dispatch({
        type: 'TODOS_FETCH_SUCCESS',
        payload: { todos },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch todos. Please try again.';
      dispatch({
        type: 'TODOS_FETCH_FAILURE',
        payload: { error: errorMessage },
      });
      throw error; // Re-throw to allow component-level error handling
    }
  }, []);

  // Add a new todo
  const addTodo = useCallback(
    async (todoData: Omit<Todo, 'id'>): Promise<Todo | null> => {
      dispatch({ type: 'TODO_ADD_START' });

      try {
        // Note: JSONPlaceholder API doesn't actually create todos,
        // so we'll simulate it by generating an ID and adding to local state
        // In a real app, you'd call: const newTodo = await todosApi.create(todoData);
        const newTodo: Todo = {
          ...todoData,
          id: Date.now(), // Temporary ID generation
        };

        dispatch({
          type: 'TODO_ADD_SUCCESS',
          payload: { todo: newTodo },
        });

        return newTodo;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to add todo. Please try again.';
        dispatch({
          type: 'TODO_ADD_FAILURE',
          payload: { error: errorMessage },
        });
        throw error;
      }
    },
    []
  );

  // Update an existing todo
  const updateTodo = useCallback(
    async (id: number, updates: Partial<Todo>): Promise<Todo | null> => {
      dispatch({ type: 'TODO_UPDATE_START' });

      try {
        // Note: JSONPlaceholder API doesn't actually update todos,
        // so we'll simulate it by updating local state
        // In a real app, you'd call: const updatedTodo = await todosApi.update(id, updates);
        const existingTodo = state.todos.find(todo => todo.id === id);

        if (!existingTodo) {
          throw new Error(`Todo with id ${id} not found`);
        }

        const updatedTodo: Todo = {
          ...existingTodo,
          ...updates,
        };

        dispatch({
          type: 'TODO_UPDATE_SUCCESS',
          payload: { todo: updatedTodo },
        });

        return updatedTodo;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to update todo. Please try again.';
        dispatch({
          type: 'TODO_UPDATE_FAILURE',
          payload: { error: errorMessage },
        });
        throw error;
      }
    },
    [state.todos]
  );

  // Delete a todo
  const deleteTodo = useCallback(async (id: number): Promise<void> => {
    dispatch({ type: 'TODO_DELETE_START' });

    try {
      // Note: JSONPlaceholder API doesn't actually delete todos,
      // so we'll simulate it by removing from local state
      // In a real app, you'd call: await todosApi.delete(id);
      dispatch({
        type: 'TODO_DELETE_SUCCESS',
        payload: { id },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to delete todo. Please try again.';
      dispatch({
        type: 'TODO_DELETE_FAILURE',
        payload: { error: errorMessage },
      });
      throw error;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Refetch (alias for fetchTodos for consistency with useFetch hook)
  const refetch = useCallback(async () => {
    await fetchTodos();
  }, [fetchTodos]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: TodosContextValue = React.useMemo(
    () => ({
      ...state,
      fetchTodos,
      addTodo,
      updateTodo,
      deleteTodo,
      clearError,
      refetch,
    }),
    [state, fetchTodos, addTodo, updateTodo, deleteTodo, clearError, refetch]
  );

  return (
    <TodosContext.Provider value={contextValue}>
      {children}
    </TodosContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Hook to access todos context
 * @throws Error if used outside TodosProvider
 */
export function useTodos(): TodosContextValue {
  const context = useContext(TodosContext);

  if (context === undefined) {
    throw new Error('useTodos must be used within a TodosProvider');
  }

  return context;
}
