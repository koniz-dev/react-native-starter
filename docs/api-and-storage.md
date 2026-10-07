# API and Storage

Learn how to use the API client and storage utilities for backend integration.

## Overview

This project includes minimal, unopinionated utilities for:

- **API calls** - Axios-based client with interceptors
- **Local storage** - AsyncStorage wrapper with JSON serialization

These are simple foundations you can build upon, not a complete API layer.

## API Client

### Setup

Every HTTP client is created with `createHttpClient()` from
[`services/httpClient.ts`](../services/httpClient.ts): the API client
(`services/api.ts`, base URL `EXPO_PUBLIC_API_URL`) and the auth client
(`authApi` in `services/auth.ts`, base URL `EXPO_PUBLIC_AUTH_API_URL`). The
factory gives every client the same behavior:

- base URL and timeout from validated config (`EXPO_PUBLIC_API_TIMEOUT_MS`,
  default 15 s), read per request;
- the auth token attached only for trusted origins (see
  [Which hosts receive the token](#which-hosts-receive-the-token));
- every failure rejected as an `ApiError` (see [Error Handling](#error-handling));
- 401 handling with an optional token refresh (see
  [Expired sessions (401)](#expired-sessions-401));
- failures logged through `utils/logger.ts` as method, path, code, and status,
  without headers or bodies.

To add a client for another backend, create it with the factory:

```ts
import { createHttpClient } from '@/services/httpClient';
import { getConfig } from '@/config/env';

export const paymentsApi = createHttpClient({
  getBaseURL: () => getConfig().apiUrl, // or a new validated variable
  authenticated: true, // attach the token (trusted origins only) and handle 401s
});
```

### Configuration

Set your API URL in `.env`:

```bash
EXPO_PUBLIC_API_URL=https://api.example.com
```

The value is validated by `config/env.ts`. JSONPlaceholder
(`https://jsonplaceholder.typicode.com`) is used only when
`EXPO_PUBLIC_USE_DEMO_BACKENDS=true`; otherwise a missing URL shows the
configuration error screen. See [Environment Variables](environment-variables.md).

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

Authentication tokens are stored through `services/secureStorage.ts`, which uses the
native iOS Keychain / Android Keystore via Expo SecureStore. General-purpose values
such as user profile data and cached Todos continue to use AsyncStorage. SecureStore is
not available for this starter's web flow; on web, `isAuthenticated()` returns false
until an adopter supplies an appropriate web authentication strategy.

The API client automatically adds authentication tokens from secure storage:

1. Store a token using the secure storage service:

```tsx
import { setSecureItem } from '@/services/secureStorage';
import { STORAGE_KEYS } from '@/services/storage';

await setSecureItem(STORAGE_KEYS.AUTH_TOKEN, 'your-token-here');
```

2. The token is added as `Authorization: Bearer <token>` only to requests whose
   origin is trusted (see "Which hosts receive the token" below).

3. Remove token on logout (or call `authService.logout()`, which also removes the
   stored profile):

```tsx
import { removeSecureItem } from '@/services/secureStorage';
import { STORAGE_KEYS } from '@/services/storage';

await removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
```

#### Which hosts receive the token

The bearer token is issued by the auth backend, so `services/api.ts` attaches it
only when a request's resolved origin (`scheme://host[:port]`, compared
case-insensitively, default ports ignored) is in `getTrustedTokenOrigins()`:

- by default, only the origin of `EXPO_PUBLIC_AUTH_API_URL`;
- plus any origins listed in `EXPO_PUBLIC_API_TRUSTED_ORIGINS`
  (comma-separated), for example an API on a separate first-party domain:

```bash
EXPO_PUBLIC_API_TRUSTED_ORIGINS=https://api.example.com,https://files.example.com
```

Requests to any other origin, including absolute URLs passed to `api`, go out
without the `Authorization` header. If your API and auth server share one host,
no extra configuration is needed. In the demo, JSONPlaceholder
(`EXPO_PUBLIC_API_URL`) is a different third party from DummyJSON, so it never
receives the DummyJSON token.

#### Cookies from the auth server

React Native's `XMLHttpRequest` defaults `withCredentials` to `true`, so without an
explicit setting the native cookie store (iOS `NSHTTPCookieStorage`, Android's OkHttp
cookie jar) keeps any cookies the login response sets. The DummyJSON demo sets
`accessToken` and `refreshToken` cookies, which would leave a second, unprotected copy
of the token on the device that `logout()` doesn't clear.

`authApi` in `services/auth.ts` is therefore created with `withCredentials: false`:
auth requests neither store nor send cookies (iOS sets `HTTPShouldHandleCookies = NO`,
Android uses `CookieJar.NO_COOKIES`), and the token lives only in secure storage. If
your backend authenticates with cookie sessions instead of bearer tokens, this is the
setting to revisit.

### Error Handling

Every client rejects with `ApiError` (`services/apiError.ts`), an `Error`
subclass, so `error.message` is always safe to show. The message prefers the
server's own `message` (or `error`) field, so a failed login shows
"Invalid credentials" rather than "Request failed with status code 400".

| `code`         | When                                                      |
| -------------- | --------------------------------------------------------- |
| `network`      | No response: offline, DNS failure, connection refused     |
| `timeout`      | The request took longer than `EXPO_PUBLIC_API_TIMEOUT_MS` |
| `unauthorized` | HTTP 401                                                  |
| `client`       | Any other HTTP 4xx                                        |
| `server`       | HTTP 5xx                                                  |
| `canceled`     | The caller aborted the request (`AbortController`)        |
| `unknown`      | Anything else                                             |

```tsx
import { todosApi } from '@/services/api';
import { ApiError, toApiError } from '@/services/apiError';

try {
  const todos = await todosApi.getAll();
} catch (error) {
  const apiError = toApiError(error); // already an ApiError for HTTP calls
  if (apiError.code === 'network') {
    // show an offline state
  }
  apiError.status; // HTTP status, if there was a response
  apiError.data; // response body, if any
}
```

`toApiError(unknown)` converts anything (axios errors, plain `Error`s, other
values) into an `ApiError`, so screens and hooks can handle one shape.

### Expired sessions (401)

When a request that carried the auth token gets a 401:

1. If a refresh handler is registered, it runs once (concurrent 401s share one
   refresh). If it returns a new token, the request is retried once with it.
2. Otherwise, or if the refresh fails or the retry gets another 401, the
   unauthorized handler runs. The default clears the stored token and profile
   and emits `session-expired`; `SessionProvider` listens for it, so every screen shows
   "Not signed in" right away.
3. The request still rejects with an `ApiError` whose `code` is
   `unauthorized`.

A 401 from the auth client itself (wrong credentials) or on a request sent
without a token does not touch the session.

Register a refresh handler (for example in `integrations/setup.ts`) if your
backend issues refresh tokens. It must store the new access token and return
it, or return `null`:

```ts
import { setRefreshTokenHandler } from '@/services/session';
import { setSecureItem } from '@/services/secureStorage';
import { STORAGE_KEYS } from '@/services/storage';
import { authApi } from '@/services/auth';

setRefreshTokenHandler(async () => {
  const { data } = await authApi.post('/auth/refresh', {
    refreshToken: await getStoredRefreshToken(), // your storage
  });
  await setSecureItem(STORAGE_KEYS.AUTH_TOKEN, data.accessToken);
  return data.accessToken;
});
```

To react differently when a session can't be recovered (for example, navigate
to the login screen), replace the default with `setUnauthorizedHandler()`; call
`clearStoredSession()` and `emitSessionExpired()` from `services/session.ts` if
you still want that behavior. Subscribe anywhere with `onSessionExpired()`.

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
if (user) {
  logger.debug('Restored user', { id: user.id });
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
      logger.error('Failed to load todos', error);
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
