# State Management with Zustand

Learn how to use Zustand for state management in this React Native starter. Zustand provides a simple, lightweight alternative to Redux and Context API with minimal boilerplate.

## Overview

Zustand is a small, fast, and scalable state management solution. It's designed to be:

- **Simple** - Minimal API, easy to learn
- **Unopinionated** - No providers or complex setup required
- **TypeScript-first** - Full type safety out of the box
- **Performant** - Only re-renders components that use changed state
- **Flexible** - Works with middleware for persistence, devtools, etc.

## Why Zustand?

This starter includes Zustand as a state management option because:

### Advantages over Redux

- **Less boilerplate** - No actions, reducers, or action creators needed
- **No provider required** - Works globally without wrapping your app
- **Simpler mental model** - Direct state updates, no dispatching
- **Smaller bundle size** - ~1KB vs Redux's ~10KB+
- **Better TypeScript support** - Types are inferred automatically

### Advantages over Context API

- **Better performance** - Only subscribes to specific state slices
- **No provider hell** - No need to wrap components in providers
- **Easier async operations** - Built-in support for async actions
- **Middleware support** - Persistence, devtools, etc. out of the box
- **Selective subscriptions** - Components only re-render when their data changes

## Project Structure

Stores are organized in the `stores/` directory:

```
stores/
├── useAuthStore.ts       # Authentication store with persistence
├── useTodosStore.ts      # Todos store with CRUD operations
└── index.ts              # Central export point
```

## Basic Usage

### Creating a Store

A Zustand store is created using the `create` function:

```typescript
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterState>(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 })),
}));
```

### Using a Store in Components

Simply import and use the hook - no provider needed:

```tsx
import { useCounterStore } from '@/stores';

export default function CounterScreen() {
  const count = useCounterStore(state => state.count);
  const increment = useCounterStore(state => state.increment);
  const decrement = useCounterStore(state => state.decrement);

  return (
    <View>
      <Text>Count: {count}</Text>
      <Button onPress={increment}>Increment</Button>
      <Button onPress={decrement}>Decrement</Button>
    </View>
  );
}
```

### Using Selectors

For better performance, use selectors to subscribe only to specific state:

```tsx
// Only re-renders when count changes
const count = useCounterStore(state => state.count);

// Or use the entire store (re-renders on any change)
const { count, increment } = useCounterStore();
```

## Auth Store

The auth store (`stores/useAuthStore.ts`) manages authentication state with persistence.

### Features

- User and token state
- Login/logout actions
- Automatic persistence to AsyncStorage
- Loading and error states
- Integration with `authService`

### Usage

```tsx
import { useAuthStore, useIsAuthenticated } from '@/stores';

export default function LoginScreen() {
  const login = useAuthStore(state => state.login);
  const loading = useAuthStore(state => state.loading);
  const error = useAuthStore(state => state.error);
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = async () => {
    try {
      await login({ email, password });
      // Navigate to app
    } catch (err) {
      // Error is set in store
    }
  };

  return (
    // Your UI
  );
}
```

### Available Selectors

```tsx
import {
  useAuthUser, // Get user object
  useAuthToken, // Get auth token
  useIsAuthenticated, // Boolean: is user logged in?
  useAuthLoading, // Loading state
  useAuthError, // Error message
} from '@/stores';
```

### Persistence

The auth store automatically persists `user` and `token` to AsyncStorage using Zustand's `persist` middleware. The data is restored when the app restarts.

## Todos Store

The todos store (`stores/useTodosStore.ts`) manages todos with CRUD operations.

### Features

- Todos array state
- Fetch, add, update, delete operations
- Loading and error states
- Integration with `todosApi`
- Computed selectors (completed, pending, counts)

### Usage

```tsx
import {
  useTodos,
  useTodosLoading,
  useTodosError,
  useTodosStore,
} from '@/stores';

export default function TodosScreen() {
  const todos = useTodos();
  const loading = useTodosLoading();
  const error = useTodosError();
  const fetchTodos = useTodosStore(state => state.fetchTodos);
  const addTodo = useTodosStore(state => state.addTodo);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return (
    // Your UI
  );
}
```

### Available Selectors

```tsx
import {
  useTodos, // All todos array
  useTodosLoading, // Loading state
  useTodosError, // Error message
  useCompletedTodos, // Filtered: completed todos
  usePendingTodos, // Filtered: pending todos
  useTodosCount, // Total count
  useCompletedTodosCount, // Completed count
} from '@/stores';
```

## Async Operations

Zustand handles async operations naturally - just make your actions async:

```typescript
export const useTodosStore = create<TodosState>(set => ({
  todos: [],
  loading: false,
  error: null,

  fetchTodos: async () => {
    set({ loading: true, error: null });
    try {
      const data = await todosApi.getAll();
      set({ todos: data, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch',
      });
    }
  },
}));
```

## Persistence

Zustand's `persist` middleware automatically saves state to storage and restores it on app restart.

### Basic Persistence

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      // Your state and actions
    }),
    {
      name: 'auth-storage', // Storage key
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Partial Persistence

Only persist specific fields:

```typescript
persist(
  set => ({
    // State
  }),
  {
    name: 'auth-storage',
    storage: createJSONStorage(() => AsyncStorage),
    // Only persist user and token, not loading/error
    partialize: state => ({
      user: state.user,
      token: state.token,
    }),
  }
);
```

## Selectors and Computed Values

Selectors allow you to compute derived state and improve performance:

### Inline Selectors

```tsx
// Component only re-renders when completedTodos changes
const completedTodos = useTodosStore(state =>
  state.todos.filter(todo => todo.completed)
);
```

### Reusable Selectors

Export selectors from your store file:

```typescript
// In useTodosStore.ts
export const useCompletedTodos = () =>
  useTodosStore(state => state.todos.filter(todo => todo.completed));

// In component
import { useCompletedTodos } from '@/stores';
const completed = useCompletedTodos();
```

## TypeScript Best Practices

### Type Your Store

Always define an interface for your store state:

```typescript
interface MyStoreState {
  // State
  data: string[];
  loading: boolean;

  // Actions
  fetchData: () => Promise<void>;
  setData: (data: string[]) => void;
}

export const useMyStore = create<MyStoreState>(set => ({
  // Implementation
}));
```

### Type Actions

Actions can be typed explicitly:

```typescript
interface AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}
```

### Infer Types from Store

Zustand automatically infers types from your store definition, so you get full type safety:

```typescript
// TypeScript knows login takes LoginCredentials
const login = useAuthStore(state => state.login);
login({ email: 'test@example.com', password: 'pass' }); // ✅ Type-safe
```

## Integration with Services

Stores integrate seamlessly with existing service layers:

```typescript
import { authService } from '@/services/auth';

export const useAuthStore = create<AuthState>(set => ({
  login: async (credentials: LoginCredentials) => {
    set({ loading: true });
    try {
      const response = await authService.login(credentials);
      set({ user: response.user, token: response.token, loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },
}));
```

This keeps your business logic in services and state management in stores.

## Creating New Stores

### Step 1: Define State Interface

```typescript
interface MyStoreState {
  // State properties
  items: Item[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
}
```

### Step 2: Create Store

```typescript
import { create } from 'zustand';
import { myService } from '@/services/myService';

export const useMyStore = create<MyStoreState>(set => ({
  // Initial state
  items: [],
  loading: false,
  error: null,

  // Actions
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const data = await myService.getAll();
      set({ items: data, loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  addItem: (item: Item) => {
    set(state => ({ items: [...state.items, item] }));
  },

  removeItem: (id: string) => {
    set(state => ({
      items: state.items.filter(item => item.id !== id),
    }));
  },
}));
```

### Step 3: Export from Index

```typescript
// stores/index.ts
export { useMyStore } from './useMyStore';
```

### Step 4: Use in Components

```tsx
import { useMyStore } from '@/stores';

export default function MyScreen() {
  const items = useMyStore(state => state.items);
  const fetchItems = useMyStore(state => state.fetchItems);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    // Your UI
  );
}
```

## Middleware

Zustand supports middleware for additional functionality:

### Persist Middleware

Already covered above - saves state to storage.

### Devtools Middleware (Development)

```typescript
import { devtools } from 'zustand/middleware';

export const useMyStore = create<MyStoreState>()(
  devtools(
    set => ({
      // Your store
    }),
    { name: 'MyStore' }
  )
);
```

### Combine Middleware

```typescript
import { persist, devtools } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      set => ({
        // Your store
      }),
      { name: 'auth-storage' }
    ),
    { name: 'AuthStore' }
  )
);
```

## Performance Optimization

### Use Selectors

Always use selectors to subscribe only to needed state:

```tsx
// ✅ Good - only re-renders when user changes
const user = useAuthStore(state => state.user);

// ❌ Bad - re-renders on any state change
const { user } = useAuthStore();
```

### Shallow Comparison

For object/array selectors, use shallow comparison:

```typescript
import { shallow } from 'zustand/shallow';

const { todos, loading } = useTodosStore(
  state => ({ todos: state.todos, loading: state.loading }),
  shallow
);
```

### Memoize Computed Values

For expensive computations:

```typescript
import { useMemo } from 'react';

const expensiveValue = useMemo(() => computeExpensiveValue(todos), [todos]);
```

## When to Use Zustand vs Other Solutions

### Use Zustand When:

- ✅ You need global state shared across many components
- ✅ You want minimal boilerplate
- ✅ You need persistence
- ✅ You want better performance than Context API
- ✅ You prefer a simple, direct API

### Use Context API When:

- ✅ State is only needed in a small component tree
- ✅ You want to avoid external dependencies
- ✅ State is mostly static (theme, config)

### Use Local State When:

- ✅ State is only needed in one component
- ✅ State doesn't need to be shared
- ✅ Simple form inputs or UI state

### Use Redux When:

- ✅ You need time-travel debugging
- ✅ You have complex state logic with middleware
- ✅ Your team is already familiar with Redux
- ✅ You need Redux ecosystem tools

## Common Patterns

### Optimistic Updates

Update UI immediately, then sync with server:

```typescript
addTodo: async (todo: Omit<Todo, 'id'>) => {
  // Optimistically add to state
  const tempId = Date.now();
  set(state => ({
    todos: [...state.todos, { ...todo, id: tempId }],
  }));

  try {
    // Sync with server
    const created = await todosApi.create(todo);
    // Replace temp with real data
    set(state => ({
      todos: state.todos.map(t =>
        t.id === tempId ? created : t
      ),
    }));
  } catch (err) {
    // Rollback on error
    set(state => ({
      todos: state.todos.filter(t => t.id !== tempId),
    }));
  }
},
```

### Reset Store

Add a reset action:

```typescript
reset: () => {
  set({
    items: [],
    loading: false,
    error: null,
  });
},
```

### Conditional Actions

```typescript
fetchIfEmpty: async () => {
  const state = useMyStore.getState();
  if (state.items.length === 0) {
    await state.fetchItems();
  }
},
```

## Troubleshooting

### Store Not Updating

- Check that you're using selectors correctly
- Ensure actions call `set()` with new state
- Verify middleware isn't blocking updates

### Persistence Not Working

- Check AsyncStorage permissions
- Verify storage key is unique
- Check `partialize` function if using it

### Type Errors

- Ensure store interface matches implementation
- Check that actions match their type signatures
- Verify imports are correct

## Resources

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Zustand TypeScript Guide](https://github.com/pmndrs/zustand#typescript)

## Summary

Zustand provides a simple, powerful way to manage state in React Native apps:

- ✅ No provider needed - works globally
- ✅ Minimal boilerplate - just create and use
- ✅ TypeScript support - full type safety
- ✅ Persistence - built-in middleware
- ✅ Performance - selective subscriptions
- ✅ Simple API - easy to learn and use

The stores in this starter (`useAuthStore` and `useTodosStore`) demonstrate real-world patterns you can adapt for your own needs.
