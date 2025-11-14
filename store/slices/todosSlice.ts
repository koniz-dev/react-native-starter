/**
 * Todos Slice
 *
 * Manages todos state with CRUD operations.
 * Integrates with the existing todosApi for API calls.
 *
 * This slice demonstrates:
 * - Async operations with createAsyncThunk
 * - Synchronous reducers for local state updates
 * - Error handling
 * - Loading states
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { todosApi } from '@/services/api';
import type { Todo } from '@/types/api';
import type { RootState } from '../index';

/**
 * Todos State Interface
 */
interface TodosState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null; // Timestamp for cache invalidation
}

/**
 * Initial State
 */
const initialState: TodosState = {
  todos: [],
  loading: false,
  error: null,
  lastFetched: null,
};

/**
 * Async Thunk: Fetch All Todos
 *
 * Fetches all todos from the API.
 */
export const fetchTodosAsync = createAsyncThunk<
  Todo[],
  void,
  { rejectValue: string }
>('todos/fetchTodos', async (_, { rejectWithValue }) => {
  try {
    const todos = await todosApi.getAll();
    return todos;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch todos.';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Async Thunk: Fetch Todos by User ID
 *
 * Fetches todos filtered by user ID.
 */
export const fetchTodosByUserIdAsync = createAsyncThunk<
  Todo[],
  number,
  { rejectValue: string }
>('todos/fetchTodosByUserId', async (userId, { rejectWithValue }) => {
  try {
    const todos = await todosApi.getByUserId(userId);
    return todos;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch todos.';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Async Thunk: Fetch Todo by ID
 *
 * Fetches a single todo by ID and adds/updates it in the state.
 */
export const fetchTodoByIdAsync = createAsyncThunk<
  Todo,
  number,
  { rejectValue: string }
>('todos/fetchTodoById', async (id, { rejectWithValue }) => {
  try {
    const todo = await todosApi.getById(id);
    return todo;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch todo.';
    return rejectWithValue(errorMessage);
  }
});

/**
 * Todos Slice
 */
const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    /**
     * Add a new todo locally
     *
     * Note: In a real app, you'd typically create an async thunk
     * that calls the API and then updates the state.
     */
    addTodo: (state, action: PayloadAction<Todo>) => {
      state.todos.push(action.payload);
    },
    /**
     * Update an existing todo
     */
    updateTodo: (state, action: PayloadAction<Todo>) => {
      const index = state.todos.findIndex(
        todo => todo.id === action.payload.id
      );
      if (index !== -1) {
        state.todos[index] = action.payload;
      }
    },
    /**
     * Delete a todo by ID
     */
    deleteTodo: (state, action: PayloadAction<number>) => {
      state.todos = state.todos.filter(todo => todo.id !== action.payload);
    },
    /**
     * Toggle todo completion status
     */
    toggleTodo: (state, action: PayloadAction<number>) => {
      const todo = state.todos.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    /**
     * Clear all todos
     */
    clearTodos: state => {
      state.todos = [];
      state.lastFetched = null;
    },
    /**
     * Clear error state
     */
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Fetch all todos
    builder
      .addCase(fetchTodosAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodosAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchTodosAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch todos';
      });

    // Fetch todos by user ID
    builder
      .addCase(fetchTodosByUserIdAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodosByUserIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.todos = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchTodosByUserIdAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch todos';
      });

    // Fetch todo by ID
    builder
      .addCase(fetchTodoByIdAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodoByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        const existingIndex = state.todos.findIndex(
          todo => todo.id === action.payload.id
        );
        if (existingIndex !== -1) {
          state.todos[existingIndex] = action.payload;
        } else {
          state.todos.push(action.payload);
        }
        state.error = null;
      })
      .addCase(fetchTodoByIdAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch todo';
      });
  },
});

/**
 * Actions
 */
export const {
  addTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
  clearTodos,
  clearError,
} = todosSlice.actions;

/**
 * Selectors
 *
 * Use these selectors to access todos state in components.
 */
export const selectTodos = (state: RootState) => state.todos.todos;
export const selectTodosLoading = (state: RootState) => state.todos.loading;
export const selectTodosError = (state: RootState) => state.todos.error;
export const selectTodosLastFetched = (state: RootState) =>
  state.todos.lastFetched;

/**
 * Memoized selectors (using Reselect pattern)
 * These are simple examples - for complex selectors, consider using reselect library
 */
export const selectCompletedTodos = (state: RootState) =>
  state.todos.todos.filter(todo => todo.completed);

export const selectIncompleteTodos = (state: RootState) =>
  state.todos.todos.filter(todo => !todo.completed);

export const selectTodoById = (state: RootState, id: number) =>
  state.todos.todos.find(todo => todo.id === id);

/**
 * Reducer
 */
export default todosSlice.reducer;
