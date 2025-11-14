# State Management with React Context API

This guide covers advanced React Context patterns for state management in React Native applications. The Context API is a built-in React feature that provides a way to share state across components without prop drilling.

## Table of Contents

- [Why Context API?](#why-context-api)
- [When to Use Context vs Other Solutions](#when-to-use-context-vs-other-solutions)
- [Context Best Practices](#context-best-practices)
- [Creating Contexts](#creating-contexts)
- [useReducer Pattern](#usereducer-pattern)
- [Performance Optimization](#performance-optimization)
- [TypeScript Patterns](#typescript-patterns)
- [Custom Hooks for Context](#custom-hooks-for-context)
- [Provider Composition](#provider-composition)
- [Integration with Services](#integration-with-services)
- [Common Pitfalls](#common-pitfalls)
- [When to Split Contexts](#when-to-split-contexts)

## Why Context API?

The Context API is ideal for:

- **Global state** that needs to be accessed by many components
- **Theme and UI preferences** (dark mode, language, etc.)
- **Authentication state** (user, token, login status)
- **Feature-specific state** (shopping cart, form state, etc.)
- **Avoiding prop drilling** through multiple component levels

### Advantages

- ✅ **Built-in** - No external dependencies
- ✅ **TypeScript support** - Full type safety
- ✅ **Simple API** - Easy to understand and use
- ✅ **React DevTools** - Built-in debugging support
- ✅ **Lightweight** - No bundle size impact

### Limitations

- ⚠️ **Re-render performance** - All consumers re-render when context value changes
- ⚠️ **Not for high-frequency updates** - Better for relatively stable state
- ⚠️ **No middleware** - Unlike Redux, no built-in middleware support
- ⚠️ **No time-travel debugging** - No built-in devtools like Redux DevTools

## When to Use Context vs Other Solutions

### Use Context API When:

- State is needed by many components at different nesting levels
- State updates are infrequent (auth, theme, user preferences)
- You want a simple solution without external dependencies
- State is domain-specific (auth, todos, cart)

### Use Redux/Zustand When:

- You need time-travel debugging
- State updates are very frequent
- You need middleware (logging, persistence, etc.)
- Complex state logic with many reducers
- Large applications with many developers

### Use Local State When:

- State is only needed in one component
- State doesn't need to be shared
- Simple form state or UI state

## Context Best Practices

### 1. Split Contexts by Domain

**❌ Bad:** One giant context for everything

```tsx
// Don't do this
const AppContext = createContext({
  user: null,
  todos: [],
  theme: 'light',
  cart: [],
  // ... everything
});
```

**✅ Good:** Separate contexts by domain

```tsx
// Separate contexts
const AuthContext = createContext({...});
const TodosContext = createContext({...});
const ThemeContext = createContext({...});
```

### 2. Use Custom Hooks

**❌ Bad:** Direct context consumption

```tsx
function Component() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('...');
  return <div>{context.user.name}</div>;
}
```

**✅ Good:** Custom hook with error handling

```tsx
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function Component() {
  const { user } = useAuth();
  return <div>{user.name}</div>;
}
```

### 3. Memoize Context Values

**❌ Bad:** New object on every render

```tsx
function Provider({ children }) {
  const [state, setState] = useState({...});
  return (
    <Context.Provider value={{ state, setState }}>
      {children}
    </Context.Provider>
  );
}
```

**✅ Good:** Memoized value

```tsx
function Provider({ children }) {
  const [state, setState] = useState({...});
  const value = useMemo(
    () => ({ state, setState }),
    [state]
  );
  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}
```

### 4. Use useReducer for Complex State

**❌ Bad:** Multiple useState calls

```tsx
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [token, setToken] = useState(null);
// ... many more
```

**✅ Good:** useReducer for related state

```tsx
const [state, dispatch] = useReducer(authReducer, initialState);
```

## Creating Contexts

### Basic Context Structure

```tsx
// 1. Define types
interface ContextState {
  // state properties
}

interface ContextValue extends ContextState {
  // actions
}

// 2. Create context
const Context = createContext<ContextValue | undefined>(undefined);

// 3. Create provider
export function Provider({ children }: { children: ReactNode }) {
  // state management
  const value: ContextValue = {
    // state and actions
  };
  
  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
}

// 4. Create custom hook
export function useContext() {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useContext must be used within Provider');
  }
  return context;
}
```

### Example: AuthContext

See `contexts/AuthContext.tsx` for a complete example with:

- TypeScript types
- useReducer for state management
- Async operations (login, logout)
- Error handling
- Initialization from storage
- Memoized context value

## useReducer Pattern

`useReducer` is ideal for complex state with multiple related values and actions.

### Benefits

- **Centralized logic** - All state updates in one place
- **Predictable updates** - Actions clearly define state changes
- **Easier testing** - Reducer is a pure function
- **Better performance** - Single state update instead of multiple

### Pattern

```tsx
// 1. Define state
interface State {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// 2. Define actions
type Action =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User } }
  | { type: 'LOGIN_FAILURE'; payload: { error: string } }
  | { type: 'LOGOUT' };

// 3. Create reducer
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload.user, loading: false };
    case 'LOGIN_FAILURE':
      return { ...state, error: action.payload.error, loading: false };
    case 'LOGOUT':
      return { ...state, user: null };
    default:
      return state;
  }
}

// 4. Use in provider
function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const user = await authService.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: { error: error.message } });
    }
  };
  
  return (
    <Context.Provider value={{ ...state, login }}>
      {children}
    </Context.Provider>
  );
}
```

## Performance Optimization

### 1. Split Contexts by Update Frequency

If you have state that updates frequently and state that doesn't, split them:

```tsx
// Slow-changing state
const UserContext = createContext({ user: null });

// Fast-changing state
const UIContext = createContext({ theme: 'light' });
```

### 2. Memoize Context Value

Always memoize the context value to prevent unnecessary re-renders:

```tsx
const value = useMemo(
  () => ({
    state,
    actions: {
      login,
      logout,
      // ...
    },
  }),
  [state, login, logout] // Include all dependencies
);
```

### 3. Memoize Actions with useCallback

Memoize action functions to keep context value stable:

```tsx
const login = useCallback(async (credentials) => {
  // ...
}, []); // Empty deps if no external dependencies

const logout = useCallback(async () => {
  // ...
}, []);
```

### 4. Split State and Actions

For very large contexts, consider splitting state and actions:

```tsx
// State context (updates frequently)
const StateContext = createContext(state);

// Actions context (stable)
const ActionsContext = createContext(actions);
```

### 5. Use React.memo for Consumers

Memoize components that consume context to prevent unnecessary re-renders:

```tsx
const TodoItem = React.memo(({ todo }) => {
  const { updateTodo } = useTodos();
  // ...
});
```

## TypeScript Patterns

### Strong Typing

```tsx
// Define state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Define context value interface
interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Create typed context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
```

### Type-Safe Actions

```tsx
// Use discriminated unions for actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: { error: string } }
  | { type: 'LOGOUT' };

// Type-safe reducer
function authReducer(
  state: AuthState,
  action: AuthAction
): AuthState {
  // TypeScript knows the shape of each action
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      // action.payload is { user: User; token: string }
      return { ...state, user: action.payload.user };
    // ...
  }
}
```

## Custom Hooks for Context

Always create custom hooks for context consumption:

### Benefits

- **Error handling** - Throws if used outside provider
- **Type safety** - Ensures context is defined
- **Clean API** - Simple import and usage
- **Consistency** - Same pattern across all contexts

### Pattern

```tsx
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
```

### Usage

```tsx
function Component() {
  const { user, login, logout } = useAuth();
  // TypeScript knows all properties are defined
}
```

## Provider Composition

### Nesting Providers

```tsx
function RootLayout() {
  return (
    <ErrorBoundary>
      <PaperProvider>
        <AuthProvider>
          <TodosProvider>
            <App />
          </TodosProvider>
        </AuthProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}
```

### Provider Composition Helper

For cleaner code with many providers:

```tsx
function composeProviders(...providers) {
  return ({ children }) =>
    providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    );
}

const AppProviders = composeProviders(
  AuthProvider,
  TodosProvider,
  ThemeProvider
);

function RootLayout() {
  return (
    <AppProviders>
      <App />
    </AppProviders>
  );
}
```

## Integration with Services

Contexts should integrate with existing services, not replace them:

### Pattern

```tsx
// Context uses service, doesn't duplicate logic
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // Use existing service
      const response = await authService.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: { error: error.message } });
    }
  }, []);
  
  // ...
}
```

### Benefits

- **Separation of concerns** - Services handle API, context handles state
- **Reusability** - Services can be used outside context
- **Testability** - Services can be tested independently
- **Consistency** - Same service used everywhere

## Common Pitfalls

### 1. Creating Context Value on Every Render

**❌ Bad:**

```tsx
<Context.Provider value={{ state, setState }}>
```

**✅ Good:**

```tsx
const value = useMemo(() => ({ state, setState }), [state]);
<Context.Provider value={value}>
```

### 2. Not Memoizing Actions

**❌ Bad:**

```tsx
const login = async (credentials) => { /* ... */ };
const value = useMemo(() => ({ login }), [state]);
```

**✅ Good:**

```tsx
const login = useCallback(async (credentials) => { /* ... */ }, []);
const value = useMemo(() => ({ login }), [login]);
```

### 3. Using Context for Everything

**❌ Bad:** Context for local component state

```tsx
const [isOpen, setIsOpen] = useState(false);
// Don't put this in context if only one component needs it
```

**✅ Good:** Context for shared state

```tsx
// Only use context for state that needs to be shared
const { user } = useAuth(); // Shared across app
```

### 4. Not Handling Provider Missing

**❌ Bad:**

```tsx
const context = useContext(AuthContext);
// context might be undefined!
```

**✅ Good:**

```tsx
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 5. Putting Everything in One Context

**❌ Bad:**

```tsx
const AppContext = createContext({
  user: null,
  todos: [],
  theme: 'light',
  // ... everything
});
```

**✅ Good:**

```tsx
// Split by domain
const AuthContext = createContext({...});
const TodosContext = createContext({...});
const ThemeContext = createContext({...});
```

## When to Split Contexts

### Split When:

1. **Different update frequencies** - Auth updates rarely, UI updates frequently
2. **Different domains** - Auth, todos, theme are separate concerns
3. **Different consumers** - Not all components need all state
4. **Performance** - Large context causes unnecessary re-renders

### Keep Together When:

1. **Closely related** - State that always changes together
2. **Same consumers** - Components always need both pieces
3. **Simple state** - Small, simple state doesn't need splitting

## Example: Complete Context Implementation

See the following files for complete, production-ready examples:

- `contexts/AuthContext.tsx` - Authentication context with useReducer
- `contexts/TodosContext.tsx` - Todos context with CRUD operations
- `contexts/index.ts` - Clean exports

### Usage Example

```tsx
// In a component
import { useAuth, useTodos } from '@/contexts';

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth();
  const { todos, fetchTodos, addTodo } = useTodos();
  
  // Use context values and actions
}
```

## Summary

React Context API is a powerful tool for state management when used correctly:

- ✅ Split contexts by domain
- ✅ Use useReducer for complex state
- ✅ Memoize context values and actions
- ✅ Create custom hooks for consumption
- ✅ Integrate with existing services
- ✅ Handle errors and edge cases
- ✅ Optimize for performance

When used with these patterns, Context API can handle most state management needs in React Native applications without external dependencies.

