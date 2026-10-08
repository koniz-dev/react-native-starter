# Hooks

This directory contains React Hooks that share behavior between components.
For theme colors use Paper's `useTheme()`.

## Session

The authentication session is React context, not a hook in this folder: use
`useSession()` from [`providers/SessionProvider.tsx`](../providers/SessionProvider.tsx).
See [How to Add Authentication](../docs/how-to.md#how-to-add-authentication).

## Data Fetching Hook

### useFetch

A generic hook for data fetching with automatic loading and error state management.

**Usage:**

```tsx
import { useFetch } from '@/hooks/useFetch';
import { todosApi } from '@/services/api';

const { data, loading, error, refetch } = useFetch(() => todosApi.getAll());
```

See [Error and Loading Guide](../docs/error-and-loading.md#usefetch-hook) for complete documentation and examples.
