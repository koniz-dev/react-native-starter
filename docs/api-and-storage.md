# API and Storage

Learn how to use the API client and storage utilities for backend integration.

## Overview

This project includes minimal, unopinionated utilities for:

- **API calls** - Axios-based client with interceptors
- **Local storage** - AsyncStorage wrapper with JSON serialization

These are simple foundations you can build upon, not a complete API layer.

## API Client

### Setup

The API client is configured in `services/api.ts` with:

- Base URL from environment variable (`EXPO_PUBLIC_API_URL`)
- Request interceptor for authentication tokens
- Response interceptor for error handling
- Default JSON headers

### Configuration

Set your API URL in `.env`:

```bash
EXPO_PUBLIC_API_URL=https://api.example.com
```

The client defaults to JSONPlaceholder (`https://jsonplaceholder.typicode.com`) if no URL is set.

### Usage

#### Using Example Endpoints

```tsx
import { todosApi, userApi } from '@/services/api';

// Fetch all todos
const todos = await todosApi.getAll();

// Fetch todos by user ID
const userTodos = await todosApi.getByUserId(1);

// Fetch all users
const users = await userApi.getAll();
```

#### Custom Requests

Use the default export for custom API calls:

```tsx
import api from '@/services/api';

// GET request
const response = await api.get('/custom-endpoint');
const data = response.data;

// POST request
const response = await api.post('/custom-endpoint', {
  name: 'John',
  email: 'john@example.com',
});
```

### Authentication

The API client automatically adds authentication tokens from storage:

1. Store token using storage service:

```tsx
import { setItem, STORAGE_KEYS } from '@/services/storage';

await setItem(STORAGE_KEYS.AUTH_TOKEN, 'your-token-here');
```

2. Token is automatically added to `Authorization: Bearer <token>` header on all requests.

3. Remove token on logout:

```tsx
import { removeItem, STORAGE_KEYS } from '@/services/storage';

await removeItem(STORAGE_KEYS.AUTH_TOKEN);
```

### Error Handling

Errors are automatically formatted with consistent structure:

```tsx
import { todosApi } from '@/services/api';
import type { ApiError } from '@/types/api';

try {
  const todos = await todosApi.getAll();
} catch (error) {
  const apiError = error as ApiError;
  console.error(apiError.message); // Error message
  console.error(apiError.status); // HTTP status code
  console.error(apiError.data); // Response data
}
```

### Adding New Endpoints

Create new API modules following the pattern:

```tsx
// services/api.ts

export const postsApi = {
  getAll: async () => {
    const response = await api.get('/posts');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  create: async (post: { title: string; body: string }) => {
    const response = await api.post('/posts', post);
    return response.data;
  },
};
```

## Storage Service

### Overview

The storage service (`services/storage.ts`) provides a simple wrapper around AsyncStorage with:

- JSON serialization/deserialization
- TypeScript generic support
- Common storage keys constant

### Usage

#### Store Data

```tsx
import { setItem, STORAGE_KEYS } from '@/services/storage';

// Store simple value
await setItem(STORAGE_KEYS.AUTH_TOKEN, 'token-123');

// Store object
await setItem(STORAGE_KEYS.USER_DATA, {
  id: 1,
  name: 'John',
  email: 'john@example.com',
});
```

#### Retrieve Data

```tsx
import { getItem, STORAGE_KEYS } from '@/services/storage';

// Get with type safety
const token = await getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
const user = await getItem<User>(STORAGE_KEYS.USER_DATA);

// Check if value exists
if (token) {
  console.log('Token:', token);
}
```

#### Remove Data

```tsx
import { removeItem, STORAGE_KEYS } from '@/services/storage';

// Remove specific item
await removeItem(STORAGE_KEYS.AUTH_TOKEN);

// Clear all storage
import { clear } from '@/services/storage';
await clear();
```

### Storage Keys

Use predefined keys from `STORAGE_KEYS` constant:

```tsx
import { STORAGE_KEYS } from '@/services/storage';

STORAGE_KEYS.AUTH_TOKEN; // 'auth_token'
STORAGE_KEYS.USER_DATA; // 'user_data'
STORAGE_KEYS.SETTINGS; // 'settings'
```

Add custom keys as needed:

```tsx
const CUSTOM_KEY = 'my_custom_key';
await setItem(CUSTOM_KEY, { data: 'value' });
```

## Example: Complete Flow

Here's a complete example combining API and storage:

```tsx
import { useState, useEffect } from 'react';
import { todosApi } from '@/services/api';
import { getItem, setItem, STORAGE_KEYS } from '@/services/storage';
import type { Todo } from '@/types/api';

function TodosScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    setLoading(true);
    try {
      // Check cache first
      const cached = await getItem<Todo[]>(STORAGE_KEYS.TODOS);
      if (cached) {
        setTodos(cached);
      }

      // Fetch from API
      const data = await todosApi.getAll();
      setTodos(data);

      // Cache results
      await setItem(STORAGE_KEYS.TODOS, data);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Your UI here
  );
}
```

## Replacing Mock API with Real Backend

To switch from JSONPlaceholder to your real backend:

1. **Update `.env` file:**

```bash
EXPO_PUBLIC_API_URL=https://api.yourbackend.com
```

2. **Update API types** in `types/api.ts` to match your backend responses

3. **Update endpoint functions** in `services/api.ts` to match your API structure

4. **Test authentication flow** - ensure tokens are stored and sent correctly

The interceptors and error handling will work the same way with your real backend.

## Best Practices

1. **Always handle errors** - Use try/catch blocks around API calls
2. **Show loading states** - Provide user feedback during API calls
3. **Type your responses** - Use TypeScript interfaces for API responses
4. **Cache when appropriate** - Use storage for offline support or faster loads
5. **Keep it simple** - These utilities are minimal by design; add complexity only when needed

## See Also

- [Getting Started](getting-started.md) - Initial setup and project overview
- [How-To Guides](how-to.md) - Common tasks including adding API endpoints
- [Code Conventions](conventions.md) - Project standards and best practices
- [Environment Variables Guide](environment-variables.md) - How to configure environment variables
- [Store Data Guide](store-data.md) - More information on data persistence
