# State Management with Redux Toolkit

This guide covers Redux Toolkit implementation in this React Native starter project. Redux Toolkit is the modern, recommended way to use Redux with less boilerplate and better TypeScript support.

## Table of Contents

- [Why Redux Toolkit?](#why-redux-toolkit)
- [When to Use Redux](#when-to-use-redux)
- [Store Architecture](#store-architecture)
- [Creating New Slices](#creating-new-slices)
- [Async Operations with Thunks](#async-operations-with-thunks)
- [Using Typed Hooks](#using-typed-hooks)
- [Best Practices](#best-practices)
- [Integration with Services](#integration-with-services)
- [Performance Considerations](#performance-considerations)
- [Migration from Local State](#migration-from-local-state)

## Why Redux Toolkit?

Redux Toolkit was chosen for this branch because it:

1. **Reduces Boilerplate** - Less code compared to traditional Redux
2. **TypeScript First** - Excellent TypeScript support out of the box
3. **Best Practices Built-in** - Includes Redux DevTools, immutability checks, and more
4. **Modern Approach** - Uses Immer for immutable updates (write "mutating" code safely)
5. **Async Handling** - Built-in support for async operations with `createAsyncThunk`
6. **Production Ready** - Battle-tested and widely adopted

### Comparison with Other Solutions

| Solution          | Best For                                 | Trade-offs                               |
| ----------------- | ---------------------------------------- | ---------------------------------------- |
| **Redux Toolkit** | Complex state, large apps, team projects | More setup, learning curve               |
| **Zustand**       | Lightweight global state                 | Less tooling, smaller ecosystem          |
| **Context API**   | Simple global state, theme, auth         | Performance issues with frequent updates |
| **Local State**   | Component-specific state                 | Doesn't scale for shared state           |

## When to Use Redux

Use Redux Toolkit when:

- ✅ **Complex State Logic** - State shared across many components
- ✅ **Large Applications** - Multiple developers, need for predictable state
- ✅ **Time Travel Debugging** - Redux DevTools for debugging
- ✅ **State Persistence** - Need to persist state across app restarts
- ✅ **Middleware Needs** - Logging, analytics, API calls
- ✅ **Team Collaboration** - Standardized state management patterns

**Don't use Redux for:**

- ❌ Simple component state (use `useState`)
- ❌ Small apps with minimal shared state
- ❌ When Context API is sufficient

## Store Architecture

### Directory Structure

```
store/
├── index.ts              # Store configuration & exports
├── hooks.ts              # Typed hooks (useAppDispatch, useAppSelector)
└── slices/
    ├── authSlice.ts      # Authentication state
    └── todosSlice.ts     # Todos CRUD operations
```

### Store Configuration

The store is configured in `store/index.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import todosReducer from './slices/todosSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    todos: todosReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Key Points:**

- `configureStore` automatically sets up Redux DevTools
- Includes default middleware (thunk, immutability checks)
- TypeScript types are inferred from the store

### Provider Setup

The Redux Provider wraps your app in `app/_layout.tsx`:

```typescript
import { Provider } from 'react-redux';
import { store } from '@/store';

export default function RootLayout() {
  return (
    <Provider store={store}>
      {/* Your app */}
    </Provider>
  );
}
```

## Creating New Slices

A slice is a collection of Redux reducer logic and actions for a single feature.

### Basic Slice Example

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

interface CounterState {
  value: number;
}

const initialState: CounterState = {
  value: 0,
};

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: state => {
      state.value += 1; // Immer makes this safe!
    },
    decrement: state => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export const selectCount = (state: RootState) => state.counter.value;
export default counterSlice.reducer;
```

### Steps to Add a New Slice

1. **Create the slice file** in `store/slices/yourSlice.ts`
2. **Define the state interface**
3. **Create the slice** with `createSlice`
4. **Export actions and selectors**
5. **Add reducer to store** in `store/index.ts`
6. **Use in components** with typed hooks

### Adding to Store

Update `store/index.ts`:

```typescript
import yourReducer from './slices/yourSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    todos: todosReducer,
    yourFeature: yourReducer, // Add here
  },
});
```

## Async Operations with Thunks

Use `createAsyncThunk` for async operations like API calls.

### Basic Async Thunk

```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/services/api';

export const fetchUserAsync = createAsyncThunk<
  User, // Return type
  number, // Argument type (userId)
  { rejectValue: string } // Reject value type
>('user/fetchUser', async (userId, { rejectWithValue }) => {
  try {
    const user = await api.getUser(userId);
    return user;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to fetch user'
    );
  }
});
```

### Handling Thunk States

```typescript
const userSlice = createSlice({
  name: 'user',
  initialState: { user: null, loading: false, error: null },
  reducers: {
    // Sync reducers here
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUserAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user';
      });
  },
});
```

### Using Async Thunks in Components

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserAsync, selectUser } from '@/store/slices/userSlice';

function UserProfile({ userId }: { userId: number }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(state => state.user.loading);

  useEffect(() => {
    dispatch(fetchUserAsync(userId));
  }, [dispatch, userId]);

  if (loading) return <LoadingScreen />;
  return <Text>{user?.name}</Text>;
}
```

## Using Typed Hooks

Always use the typed hooks from `store/hooks.ts` instead of plain React Redux hooks.

### Typed Dispatch

```typescript
import { useAppDispatch } from '@/store/hooks';
import { loginAsync } from '@/store/slices/authSlice';

function LoginScreen() {
  const dispatch = useAppDispatch();

  const handleLogin = () => {
    dispatch(loginAsync({ email, password }));
    // TypeScript knows the exact action types!
  };
}
```

### Typed Selectors

```typescript
import { useAppSelector } from '@/store/hooks';
import { selectUser, selectIsAuthenticated } from '@/store/slices/authSlice';

function ProfileScreen() {
  // Using exported selectors (recommended)
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Or inline selectors (also type-safe)
  const loading = useAppSelector(state => state.auth.loading);

  return <Text>{user?.name}</Text>;
}
```

### Selector Best Practices

1. **Export selectors from slices** - Makes them reusable
2. **Use memoized selectors** - For complex computations, use `reselect`
3. **Keep selectors simple** - Extract complex logic to separate functions

```typescript
// In slice file
export const selectCompletedTodos = (state: RootState) =>
  state.todos.todos.filter(todo => todo.completed);

// In component
const completedTodos = useAppSelector(selectCompletedTodos);
```

## Best Practices

### 1. Keep Slices Focused

Each slice should manage one domain of state:

```typescript
// ✅ Good: Focused slice
const authSlice = createSlice({
  name: 'auth',
  // Only auth-related state
});

// ❌ Bad: Too broad
const appSlice = createSlice({
  name: 'app',
  // Auth, todos, settings, etc. - too much!
});
```

### 2. Normalize State Shape

For complex data, normalize the state:

```typescript
// ✅ Good: Normalized
interface UsersState {
  byId: Record<number, User>;
  allIds: number[];
}

// ❌ Bad: Nested arrays
interface UsersState {
  users: User[]; // Hard to update individual users
}
```

### 3. Use Selectors for Derived State

```typescript
// ✅ Good: Selector for derived state
export const selectActiveTodos = (state: RootState) =>
  state.todos.todos.filter(todo => !todo.completed);

// ❌ Bad: Storing derived state
// Don't store both todos and activeTodos in state
```

### 4. Handle Loading and Error States

Always include loading and error states:

```typescript
interface MyState {
  data: Data | null;
  loading: boolean;
  error: string | null;
}
```

### 5. Don't Mutate State Directly

Redux Toolkit uses Immer, so you can write "mutating" code, but only inside reducers:

```typescript
// ✅ Good: Inside reducer (Immer handles immutability)
reducers: {
  addTodo: (state, action) => {
    state.todos.push(action.payload); // Safe!
  },
}

// ❌ Bad: Outside reducer
dispatch(addTodo(newTodo));
state.todos.push(newTodo); // Don't do this!
```

### 6. Use Action Creators

Always use action creators, not plain objects:

```typescript
// ✅ Good
dispatch(loginAsync({ email, password }));

// ❌ Bad
dispatch({ type: 'auth/login', payload: { email, password } });
```

## Integration with Services

Redux slices should integrate with existing service layers, not duplicate API logic.

### Pattern: Service Layer → Redux Slice

```typescript
// services/api.ts - API logic
export const todosApi = {
  getAll: async () => {
    const response = await api.get('/todos');
    return response.data;
  },
};

// store/slices/todosSlice.ts - Redux logic
import { todosApi } from '@/services/api';

export const fetchTodosAsync = createAsyncThunk(
  'todos/fetchTodos',
  async () => {
    return await todosApi.getAll(); // Use service, don't duplicate
  }
);
```

### Benefits

- ✅ **Separation of Concerns** - API logic separate from state logic
- ✅ **Reusability** - Services can be used outside Redux
- ✅ **Testability** - Test services and slices independently
- ✅ **Maintainability** - Change API without touching Redux code

## Performance Considerations

### 1. Memoization with Reselect

For expensive computations, use `reselect`:

```bash
npm install reselect
```

```typescript
import { createSelector } from 'reselect';

const selectTodos = (state: RootState) => state.todos.todos;

export const selectExpensiveComputation = createSelector(
  [selectTodos],
  todos => {
    // Expensive computation only runs when todos change
    return todos.map(/* complex transformation */);
  }
);
```

### 2. Avoid Unnecessary Re-renders

Use specific selectors instead of selecting entire state:

```typescript
// ❌ Bad: Component re-renders on any state change
const state = useAppSelector(state => state);

// ✅ Good: Only re-renders when auth.user changes
const user = useAppSelector(selectUser);
```

### 3. Batch Updates

Redux Toolkit automatically batches updates, but you can also use `unstable_batchedUpdates` for multiple dispatches:

```typescript
import { unstable_batchedUpdates } from 'react-native';

unstable_batchedUpdates(() => {
  dispatch(action1());
  dispatch(action2());
  dispatch(action3());
});
```

### 4. Normalize Large Lists

For large lists, normalize state to avoid re-rendering entire lists:

```typescript
// Instead of: todos: Todo[]
// Use: { byId: Record<number, Todo>, allIds: number[] }
```

## Migration from Local State

### Step-by-Step Migration

1. **Identify shared state** - State used in multiple components
2. **Create slice** - Move state logic to Redux slice
3. **Update components** - Replace `useState` with Redux hooks
4. **Test thoroughly** - Ensure behavior is unchanged

### Example Migration

**Before (Local State):**

```typescript
function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await authService.login({ email, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
}
```

**After (Redux):**

```typescript
function LoginScreen() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(selectAuth);

  const handleLogin = () => {
    dispatch(loginAsync({ email, password }));
  };
}
```

## Common Patterns

### Pattern 1: Optimistic Updates

```typescript
reducers: {
  toggleTodo: (state, action: PayloadAction<number>) => {
    const todo = state.todos.find(t => t.id === action.payload);
    if (todo) {
      todo.completed = !todo.completed; // Optimistic update
    }
  },
},
extraReducers: builder => {
  builder.addCase(updateTodoAsync.fulfilled, (state, action) => {
    // Sync with server response
    const index = state.todos.findIndex(t => t.id === action.payload.id);
    if (index !== -1) {
      state.todos[index] = action.payload;
    }
  });
}
```

### Pattern 2: Cache Invalidation

```typescript
interface TodosState {
  todos: Todo[];
  lastFetched: number | null;
}

// In component
useEffect(() => {
  const fiveMinutes = 5 * 60 * 1000;
  const shouldRefetch = !lastFetched || Date.now() - lastFetched > fiveMinutes;

  if (shouldRefetch) {
    dispatch(fetchTodosAsync());
  }
}, []);
```

### Pattern 3: Conditional Fetching

```typescript
useEffect(() => {
  if (todos.length === 0 && !loading) {
    dispatch(fetchTodosAsync());
  }
}, [todos.length, loading, dispatch]);
```

## Troubleshooting

### Issue: Component Not Re-rendering

**Solution:** Check selector - make sure it's selecting the right state:

```typescript
// Verify selector returns expected value
const value = useAppSelector(state => state.yourSlice.value);
console.log('Current value:', value);
```

### Issue: TypeScript Errors

**Solution:** Ensure you're using typed hooks:

```typescript
// ✅ Correct
import { useAppDispatch, useAppSelector } from '@/store/hooks';

// ❌ Wrong
import { useDispatch, useSelector } from 'react-redux';
```

### Issue: State Not Persisting

**Solution:** Redux state doesn't persist by default. Use `redux-persist` if needed:

```bash
npm install redux-persist
```

## Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Redux Toolkit TypeScript Guide](https://redux-toolkit.js.org/usage/usage-with-typescript)
- [React Redux Hooks](https://react-redux.js.org/api/hooks)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

## Summary

Redux Toolkit provides a powerful, type-safe solution for managing complex state in React Native applications. By following the patterns and best practices outlined in this guide, you can build maintainable, scalable applications with predictable state management.

Remember:

- Use Redux for shared, complex state
- Keep slices focused and small
- Integrate with existing services
- Use typed hooks for type safety
- Follow best practices for performance

Happy coding! 🚀
