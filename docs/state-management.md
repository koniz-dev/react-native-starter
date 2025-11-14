# State Management with Jotai

This guide explains how to use Jotai for state management in this React Native starter project.

## Why Jotai?

Jotai is a primitive and flexible state management library for React that uses an atomic approach. Unlike traditional state management libraries like Redux or Zustand, Jotai:

- **Atomic State**: State is split into small, independent pieces called "atoms"
- **Composable**: Atoms can be combined to create derived state
- **Minimal Re-renders**: Components only re-render when the specific atoms they use change
- **TypeScript First**: Excellent TypeScript support out of the box
- **No Boilerplate**: No actions, reducers, or providers needed for simple cases
- **Flexible**: Works with async operations, derived state, and complex state patterns

## Atomic State Concept

In Jotai, state is managed through **atoms** - small, independent pieces of state. Think of atoms as individual state variables that can be:

- **Primitive atoms**: Store simple values (strings, numbers, objects, arrays)
- **Derived atoms**: Computed from other atoms (automatically update when dependencies change)
- **Async atoms**: Handle asynchronous operations
- **Write-only atoms**: Actions that update state

### Example: Atomic Composition

```typescript
// Primitive atom
const countAtom = atom(0);

// Derived atom - automatically updates when countAtom changes
const doubledAtom = atom(get => get(countAtom) * 2);

// Write-only atom - action to increment
const incrementAtom = atom(null, (get, set) => {
  set(countAtom, get(countAtom) + 1);
});
```

## Creating Atoms

Atoms are defined in the `atoms/` directory, organized by feature.

### Primitive Atoms

Primitive atoms store simple values:

```typescript
import { atom } from 'jotai';

// String atom
export const tokenAtom = atom<string | null>(null);

// Object atom
export const userAtom = atom<{ id: number; name: string } | null>(null);

// Array atom
export const todosAtom = atom<Todo[]>([]);
```

### Derived Atoms

Derived atoms compute values from other atoms. They automatically update when dependencies change:

```typescript
import { atom } from 'jotai';
import { tokenAtom } from './authAtoms';

// Derived atom - computed from tokenAtom
export const isAuthenticatedAtom = atom(get => {
  const token = get(tokenAtom);
  return token !== null && token.length > 0;
});
```

### Async Atoms

Async atoms handle asynchronous operations like API calls:

```typescript
import { atom } from 'jotai';
import { todosApi } from '@/services/api';

export const fetchTodosAtom = atom(async (get, set) => {
  set(todosLoadingAtom, true);
  set(todosErrorAtom, null);

  try {
    const todos = await todosApi.getAll();
    set(todosAtom, todos);
    set(todosLoadingAtom, false);
    return todos;
  } catch (error) {
    set(todosErrorAtom, error.message);
    set(todosLoadingAtom, false);
    throw error;
  }
});
```

### Write-Only Atoms (Actions)

Write-only atoms are used for actions that update state:

```typescript
import { atom } from 'jotai';

// Login action atom
export const loginAtom = atom(
  null, // read function (not used for write-only atoms)
  async (get, set, credentials: { email: string; password: string }) => {
    const response = await authService.login(credentials);
    set(userAtom, response.user);
    set(tokenAtom, response.token);
    return response;
  }
);

// Logout action atom
export const logoutAtom = atom(null, async (get, set) => {
  await authService.logout();
  set(userAtom, null);
  set(tokenAtom, null);
});
```

## Using Atoms in Components

Jotai provides three main hooks for using atoms in components:

### `useAtom` - Read and Write

Use when you need both read and write access:

```typescript
import { useAtom } from 'jotai';
import { todosAtom } from '@/atoms';

function TodoList() {
  const [todos, setTodos] = useAtom(todosAtom);

  return (
    <View>
      {todos.map(todo => (
        <Text key={todo.id}>{todo.title}</Text>
      ))}
    </View>
  );
}
```

### `useAtomValue` - Read-Only

Use when you only need to read the value (prevents unnecessary re-renders):

```typescript
import { useAtomValue } from 'jotai';
import { todosAtom, todosLoadingAtom } from '@/atoms';

function TodoList() {
  const todos = useAtomValue(todosAtom);
  const loading = useAtomValue(todosLoadingAtom);

  if (loading) return <Text>Loading...</Text>;

  return (
    <View>
      {todos.map(todo => (
        <Text key={todo.id}>{todo.title}</Text>
      ))}
    </View>
  );
}
```

### `useSetAtom` - Write-Only

Use when you only need to update the value (for actions):

```typescript
import { useSetAtom } from 'jotai';
import { loginAtom, fetchTodosAtom } from '@/atoms';

function LoginButton() {
  const login = useSetAtom(loginAtom);
  const fetchTodos = useSetAtom(fetchTodosAtom);

  const handleLogin = async () => {
    try {
      await login({ email, password });
      await fetchTodos();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <Button onPress={handleLogin}>Login</Button>;
}
```

## Example: Auth Flow

Here's a complete example of using Jotai for authentication:

```typescript
// atoms/authAtoms.ts
import { atom } from 'jotai';
import { authService } from '@/services/auth';

export const userAtom = atom<{ id: number; email: string } | null>(null);
export const tokenAtom = atom<string | null>(null);

export const isAuthenticatedAtom = atom(get => {
  const token = get(tokenAtom);
  return token !== null;
});

export const loginAtom = atom(
  null,
  async (get, set, credentials: { email: string; password: string }) => {
    const response = await authService.login(credentials);
    set(userAtom, response.user);
    set(tokenAtom, response.token);
    return response;
  }
);

export const logoutAtom = atom(null, async (get, set) => {
  await authService.logout();
  set(userAtom, null);
  set(tokenAtom, null);
});
```

```typescript
// app/(auth)/login.tsx
import { useSetAtom } from 'jotai';
import { loginAtom } from '@/atoms';

export default function LoginScreen() {
  const login = useSetAtom(loginAtom);

  const handleLogin = async () => {
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (error) {
      // Handle error
    }
  };

  // ... rest of component
}
```

## Example: Todos with Loading and Error States

```typescript
// atoms/todosAtoms.ts
import { atom } from 'jotai';
import { todosApi } from '@/services/api';

export const todosAtom = atom<Todo[]>([]);
export const todosLoadingAtom = atom<boolean>(false);
export const todosErrorAtom = atom<string | null>(null);

export const fetchTodosAtom = atom(async (get, set) => {
  set(todosLoadingAtom, true);
  set(todosErrorAtom, null);

  try {
    const todos = await todosApi.getAll();
    set(todosAtom, todos);
    set(todosLoadingAtom, false);
    return todos;
  } catch (error) {
    set(todosErrorAtom, error.message);
    set(todosLoadingAtom, false);
    throw error;
  }
});
```

```typescript
// app/(tabs)/explore.tsx
import { useAtomValue, useSetAtom } from 'jotai';
import {
  todosAtom,
  todosLoadingAtom,
  todosErrorAtom,
  fetchTodosAtom,
} from '@/atoms';

export default function ExploreScreen() {
  const todos = useAtomValue(todosAtom);
  const loading = useAtomValue(todosLoadingAtom);
  const error = useAtomValue(todosErrorAtom);
  const fetchTodos = useSetAtom(fetchTodosAtom);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // ... rest of component
}
```

## Best Practices

### 1. Organize Atoms by Feature

Keep related atoms together in feature-specific files:

```
atoms/
├── authAtoms.ts      # Auth-related atoms
├── todosAtoms.ts     # Todos-related atoms
└── index.ts          # Export all atoms
```

### 2. Use Derived Atoms for Computed Values

Instead of computing values in components, create derived atoms:

```typescript
// ✅ Good: Derived atom
export const completedTodosCountAtom = atom(get => {
  const todos = get(todosAtom);
  return todos.filter(todo => todo.completed).length;
});

// ❌ Avoid: Computing in component
function TodoList() {
  const todos = useAtomValue(todosAtom);
  const completedCount = todos.filter(todo => todo.completed).length; // Recomputes on every render
}
```

### 3. Use Appropriate Hooks

- `useAtomValue` for read-only access (prevents unnecessary re-renders)
- `useSetAtom` for write-only access (actions)
- `useAtom` only when you need both read and write

### 4. Keep Atoms Small and Focused

Each atom should represent a single piece of state:

```typescript
// ✅ Good: Separate atoms
export const todosAtom = atom<Todo[]>([]);
export const todosLoadingAtom = atom<boolean>(false);
export const todosErrorAtom = atom<string | null>(null);

// ❌ Avoid: Combined atom
export const todosStateAtom = atom({
  todos: [],
  loading: false,
  error: null,
});
```

### 5. Use TypeScript for Type Safety

Always type your atoms:

```typescript
// ✅ Good: Typed atom
export const userAtom = atom<{ id: number; email: string } | null>(null);

// ❌ Avoid: Untyped atom
export const userAtom = atom(null);
```

## Jotai vs Redux/Zustand

### Jotai vs Redux

| Feature        | Jotai                | Redux                               |
| -------------- | -------------------- | ----------------------------------- |
| Boilerplate    | Minimal              | High (actions, reducers, selectors) |
| Learning Curve | Low                  | Medium-High                         |
| Bundle Size    | Small (~3KB)         | Medium (~12KB)                      |
| TypeScript     | Excellent            | Good                                |
| DevTools       | Available            | Excellent                           |
| Best For       | Small to medium apps | Large, complex apps                 |

### Jotai vs Zustand

| Feature     | Jotai                          | Zustand                |
| ----------- | ------------------------------ | ---------------------- |
| Philosophy  | Atomic state                   | Single store           |
| Re-renders  | Granular (only affected atoms) | Store-level            |
| Composition | Derived atoms                  | Computed in components |
| Bundle Size | Small (~3KB)                   | Small (~1KB)           |
| Best For    | Composable state               | Simple global state    |

## When to Use Jotai

Use Jotai when:

- ✅ You want minimal boilerplate
- ✅ You need granular re-renders
- ✅ You prefer composable, atomic state
- ✅ You're building a small to medium app
- ✅ You want excellent TypeScript support

Consider alternatives when:

- ❌ You need Redux DevTools integration
- ❌ You're building a very large, complex app (Redux might be better)
- ❌ You prefer a single store approach (Zustand might be simpler)
- ❌ You need middleware for complex async flows

## Resources

- [Jotai Documentation](https://jotai.org/)
- [Jotai GitHub](https://github.com/pmndrs/jotai)
- [Jotai TypeScript Guide](https://jotai.org/docs/basics/typescript)
