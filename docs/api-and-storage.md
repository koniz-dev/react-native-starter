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
[`shared/http/httpClient.ts`](../shared/http/httpClient.ts): the API client
(`shared/http/api.ts`, base URL `EXPO_PUBLIC_API_URL`) and the auth client
(`authClients` in `shared/session/authService.ts`, base URL `EXPO_PUBLIC_AUTH_API_URL`). The
factory gives every client the same behavior:

- base URL and timeout from validated config (`EXPO_PUBLIC_API_TIMEOUT_MS`,
  default 15 s), read per request;
- the auth token attached only for trusted origins (see
  [Which hosts receive the token](#which-hosts-receive-the-token));
- every failure rejected as an `ApiError` (see [Error Handling](#error-handling));
- 401 handling with an optional token refresh (see
  [Expired sessions (401)](#expired-sessions-401));
- failures logged through `shared/lib/logger.ts` as method, path, code, and status,
  without headers or bodies.

To add a client for another backend, create it with the factory:

```ts
import { createHttpClient } from '@/shared/http/httpClient';
import { getConfig } from '@/shared/config/env';

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

The value is validated by `shared/config/env.ts`. JSONPlaceholder
(`https://jsonplaceholder.typicode.com`) is used only when
`EXPO_PUBLIC_USE_DEMO_BACKENDS=true`; otherwise a missing URL shows the
configuration error screen. See [Environment Variables](environment-variables.md).

### Usage

#### Using Example Endpoints

```tsx
import { todosApi } from '@/features/demo-todos/api/todosApi';

// The demo endpoint behind the Explore tab
const todos = await todosApi.getAll();
```

#### Custom Requests

Use the default export for custom API calls:

```tsx
import api from '@/shared/http/api';

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

The auth token goes through a `TokenStore` (`shared/session/tokenStore.ts`); the
user profile and cached data use AsyncStorage. The store is picked by
platform:

| Platform      | Token store                                        | After restart / reload |
| ------------- | -------------------------------------------------- | ---------------------- |
| iOS / Android | iOS Keychain / Android Keystore (Expo SecureStore) | Still signed in        |
| Web           | Memory only (`createMemoryTokenStore()`)           | Signed out             |

#### Why the token is not persisted on web

A browser has no storage that the page's scripts can read but injected
scripts cannot: anything in `localStorage`, `sessionStorage`, IndexedDB, or a
non-httpOnly cookie can be read by an XSS payload. Keeping the token in
memory limits it to the open page, at the cost of signing the user out on
reload. On a reload the stored profile (in `localStorage`) is cleared too, so
no user data outlives the session.

For sessions that survive a reload on web, the usual approach is an httpOnly,
`Secure`, `SameSite` cookie set by your backend, which scripts cannot read.
That is a backend change: send requests with `withCredentials: true` to that
origin, and register a store that reflects the cookie session instead of
holding a token, for example:

```ts
import { setTokenStore, type TokenStore } from '@/shared/session/tokenStore';

const cookieSessionStore: TokenStore = {
  persistent: true,
  get: async () => ((await hasCookieSession()) ? 'cookie' : null), // your check
  set: async () => {}, // the server sets the cookie
  clear: async () => {
    await callLogoutEndpoint(); // the server clears the cookie
  },
};
setTokenStore(cookieSessionStore);
```

With a cookie session there is no bearer token to attach, so also adjust the
`authenticated` clients in `shared/http/httpClient.ts`.

#### Using the token store

The API client adds the stored token to requests automatically:

1. `authService.login()` stores the token with `getTokenStore().set(token)`.
2. The token is added as `Authorization: Bearer <token>` only to requests whose
   origin is trusted (see "Which hosts receive the token" below).
3. `authService.logout()` (or a 401, see below) clears the token and the
   stored profile.

To use the store directly:

```tsx
import { getTokenStore } from '@/shared/session/tokenStore';

const token = await getTokenStore().get(); // null when signed out
const survivesRestart = getTokenStore().persistent; // false on web
```

#### Which hosts receive the token

The bearer token is issued by the auth backend, so `shared/http/api.ts` attaches it
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

The `authClients` in `shared/session/authService.ts` are therefore created with `withCredentials: false`:
auth requests neither store nor send cookies (iOS sets `HTTPShouldHandleCookies = NO`,
Android uses `CookieJar.NO_COOKIES`), and the token lives only in the token store. If
your backend authenticates with cookie sessions instead of bearer tokens, this is the
setting to revisit.

### Error Handling

Every client rejects with `ApiError` (`shared/http/apiError.ts`), an `Error`
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
import { todosApi } from '@/features/demo-todos/api/todosApi';
import { ApiError, toApiError } from '@/shared/http/apiError';

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

If your backend issues refresh tokens, implement `refresh` in your
`AuthAdapter` (see [How to Add Authentication](how-to.md#how-to-add-authentication)).
`setAuthAdapter()` registers it as the refresh handler and stores the token it
returns; return `null` when the session can't be refreshed:

```ts
export const myBackendAuthAdapter: AuthAdapter = {
  // ...login, normalizeUser
  refresh: async ({ public: http }) => {
    const refreshToken = await loadRefreshToken(); // your storage
    if (!refreshToken) return null;
    const { data } = await http.post('/auth/refresh', { refreshToken });
    return data.accessToken;
  },
};
```

`setRefreshTokenHandler()` in `shared/session/session.ts` is the lower-level
hook behind it; `setAuthAdapter()` replaces whatever handler was set before.

To react differently when a session can't be recovered (for example, navigate
to the login screen), replace the default with `setUnauthorizedHandler()`; call
`clearStoredSession()` and `emitSessionExpired()` from `shared/session/session.ts` if
you still want that behavior. Subscribe anywhere with `onSessionExpired()`.

### Adding New Endpoints

Create new API modules following the pattern:

```tsx
// shared/http/api.ts

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

The storage service (`shared/storage/storage.ts`) provides a simple wrapper around AsyncStorage with:

- JSON serialization/deserialization
- TypeScript generic support
- Common storage keys constant

### Usage

#### Store Data

```tsx
import { setItem, STORAGE_KEYS } from '@/shared/storage/storage';

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
import { getItem, STORAGE_KEYS } from '@/shared/storage/storage';

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
import { removeItem, STORAGE_KEYS } from '@/shared/storage/storage';

// Remove specific item
await removeItem(STORAGE_KEYS.AUTH_TOKEN);

// Clear all storage
import { clear } from '@/shared/storage/storage';
await clear();
```

### Storage Keys

Use predefined keys from `STORAGE_KEYS` constant:

```tsx
import { STORAGE_KEYS } from '@/shared/storage/storage';

STORAGE_KEYS.AUTH_TOKEN; // 'auth_token'
STORAGE_KEYS.USER_DATA; // 'user_data'
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
import { todosApi } from '@/features/demo-todos/api/todosApi';
import { getItem, setItem } from '@/shared/storage/storage';
import type { Todo } from '@/features/demo-todos/types';

const TODOS_CACHE_KEY = 'todos';

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
      const cached = await getItem<Todo[]>(TODOS_CACHE_KEY);
      if (cached) {
        setTodos(cached);
      }

      // Fetch from API
      const data = await todosApi.getAll();
      setTodos(data);

      // Cache results
      await setItem(TODOS_CACHE_KEY, data);
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

2. **Update API types** in `features/demo-todos/types.ts` to match your backend responses

3. **Update endpoint functions** in `shared/http/api.ts` to match your API structure

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
