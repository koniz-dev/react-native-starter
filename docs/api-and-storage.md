# API and Storage

Reference for the HTTP and storage layer in `shared/`. For the steps to point
the app at your servers, see [Connect Your Backend](connect-your-backend.md).

## HTTP clients

Every client is created with `createHttpClient()` from
[`shared/http/httpClient.ts`](../shared/http/httpClient.ts):

- `api` in `shared/http/api.ts`: base URL `EXPO_PUBLIC_API_URL`, sends the
  token, handles 401s;
- `authClients.public` and `authClients.authenticated` in
  `shared/session/authService.ts`: base URL `EXPO_PUBLIC_AUTH_API_URL`, given
  to the AuthAdapter.

The factory gives every client the same behavior:

- base URL and timeout from validated config (`EXPO_PUBLIC_API_TIMEOUT_MS`,
  default 15 s), read per request;
- the token attached only for [trusted origins](#which-hosts-receive-the-token);
- every failure rejected as an [`ApiError`](#errors);
- [401 handling](#expired-sessions-401) with an optional refresh;
- failures logged as method, path, code, and status, without headers or
  bodies.

A client for another backend:

```ts
import { createHttpClient } from '@/shared/http/httpClient';
import { getConfig } from '@/shared/config/env';

export const paymentsApi = createHttpClient({
  getBaseURL: () => getConfig().apiUrl, // or a new validated variable
  authenticated: true, // attach the token (trusted origins only), handle 401s
});
```

## Errors

Every client rejects with `ApiError` (`shared/http/apiError.ts`), an `Error`
subclass, so `error.message` is always safe to show. The message prefers the
server's own `message` (or `error`) field, so a failed login shows "Invalid
credentials" rather than "Request failed with status code 400".

| `code`         | When                                                      |
| -------------- | --------------------------------------------------------- |
| `network`      | No response: offline, DNS failure, connection refused     |
| `timeout`      | The request took longer than `EXPO_PUBLIC_API_TIMEOUT_MS` |
| `unauthorized` | HTTP 401                                                  |
| `client`       | Any other HTTP 4xx                                        |
| `server`       | HTTP 5xx                                                  |
| `canceled`     | The caller aborted the request (`AbortController`)        |
| `unknown`      | Anything else                                             |

```ts
import { api } from '@/shared/http/api';
import { toApiError } from '@/shared/http/apiError';

export async function loadProfile(): Promise<string> {
  try {
    const { data } = await api.get<{ name: string }>('/me');
    return data.name;
  } catch (error) {
    const apiError = toApiError(error); // already an ApiError for HTTP calls
    if (apiError.code === 'network') return 'Offline';
    throw apiError; // apiError.status and apiError.data are set if there was a response
  }
}
```

`toApiError(unknown)` turns anything (axios errors, plain `Error`s, other
values) into an `ApiError`.

## Which hosts receive the token

The token is issued by the auth backend, so the HTTP client attaches it only
when a request's resolved origin (`scheme://host[:port]`, case-insensitive,
default ports ignored) is trusted:

- the origin of `EXPO_PUBLIC_AUTH_API_URL`;
- the origins in `EXPO_PUBLIC_API_TRUSTED_ORIGINS` (comma-separated), for
  example your API on a separate first-party domain.

Requests to any other origin, including absolute URLs passed to `api`, go out
without the `Authorization` header. `getTrustedTokenOrigins()` returns the
set.

<!-- @demo remove-block-start -->

In the demo, JSONPlaceholder (`EXPO_PUBLIC_API_URL`) is a different third
party from DummyJSON, so it never receives the DummyJSON token.

<!-- @demo remove-block-end -->

## Cookies from the auth server

React Native's `XMLHttpRequest` defaults `withCredentials` to `true`, so the
native cookie store would keep any cookies a login response sets (some
backends set the tokens as cookies as well as in the body), leaving a second
copy of the token that logout doesn't clear. The auth clients are therefore created with
`withCredentials: false`: they neither store nor send cookies. If your
backend authenticates with cookie sessions instead of bearer tokens, this is
the setting to revisit.

## Expired sessions (401)

When a request that carried the token gets a 401:

1. If a refresh handler is registered (an AuthAdapter's `refresh`), it runs
   once; concurrent 401s share one refresh. With a new token, the request is
   retried once.
2. Otherwise, or if the refresh fails or the retry gets another 401, the
   unauthorized handler runs. The default clears the stored token and
   profile and emits session-expired; `SessionProvider` listens, so the route
   guards send the user to Home, signed out.
3. The request still rejects with an `ApiError` with `code: 'unauthorized'`.

A 401 on the auth backend's `public` client (a wrong password) or on a
request sent without a token does not touch the session.

To react differently, replace the unauthorized handler, and subscribe
anywhere to session expiry:

```ts
import {
  clearStoredSession,
  emitSessionExpired,
  onSessionExpired,
  setUnauthorizedHandler,
} from '@/shared/session/session';
import { logger } from '@/shared/lib/logger';

setUnauthorizedHandler(async () => {
  logger.warn('Session expired');
  await clearStoredSession(); // what the default does
  emitSessionExpired();
});

const unsubscribe = onSessionExpired(() => {
  // e.g. show a "please sign in again" message
});
unsubscribe();
```

## Token store

The token goes through a `TokenStore` (`shared/session/tokenStore.ts`),
picked by platform:

| Platform      | Token store                                        | After restart / reload |
| ------------- | -------------------------------------------------- | ---------------------- |
| iOS / Android | iOS Keychain / Android Keystore (Expo SecureStore) | Still signed in        |
| Web           | Memory only (`createMemoryTokenStore()`)           | Signed out             |

### After a reinstall

iOS keeps Keychain items when an app is deleted, but deletes its AsyncStorage.
Without a check, a reinstalled app would start with the previous install's
token and no stored user, and show a signed-in session the user never
started. So on the first launch after an install, before the session is
restored, `clearSessionFromPreviousInstall()` (`shared/session/session.ts`)
looks for an install marker (`STORAGE_KEYS.INSTALL_MARKER`) in AsyncStorage.
If there is no marker and no stored user, it deletes the stored token. Then
it writes the marker, and later launches restore the session as usual. An app
updated from a version without the marker still has its stored user, so it
stays signed in. On Android, the Keystore data goes with the app, so the
check only matters on iOS.

The check clears only the access token and the stored user. Anything your
adapter keeps in secure storage, such as a refresh token, also survives a
reinstall on iOS. It isn't used, because `refresh` runs only after a request
with a token gets a 401, and the next `login` overwrites it. To delete it
anyway, clear it at the start of `login`.

### Why the token is not persisted on web

A browser has no storage that the page's scripts can read but injected
scripts cannot: anything in `localStorage`, `sessionStorage`, IndexedDB, or a
non-httpOnly cookie can be read by an XSS payload. Keeping the token in
memory limits it to the open page, at the cost of signing the user out on
reload. On that reload the stored profile (in `localStorage`) is cleared too.

For sessions that survive a reload on web, have your backend set an
httpOnly, `Secure`, `SameSite` cookie, send requests with
`withCredentials: true` to that origin, and register a store that reflects
the cookie session instead of holding a token:

```ts
import { setTokenStore, type TokenStore } from '@/shared/session/tokenStore';

// Placeholders for your own code:
declare function hasCookieSession(): Promise<boolean>;
declare function callLogoutEndpoint(): Promise<void>;

const cookieSessionStore: TokenStore = {
  persistent: true,
  get: async () => ((await hasCookieSession()) ? 'cookie-session' : null),
  set: async () => {}, // the server sets the cookie
  clear: async () => {
    await callLogoutEndpoint(); // the server clears the cookie
  },
};
setTokenStore(cookieSessionStore);
```

With a cookie session there is no bearer token to attach, so also adjust the
`authenticated` clients.

## Storage

`shared/storage/storage.ts` wraps AsyncStorage (`localStorage` on web) with
JSON serialization. It is for non-secret data; the token never goes here.

```ts
import {
  getItem,
  removeItem,
  setItem,
  STORAGE_KEYS,
} from '@/shared/storage/storage';

interface Settings {
  notifications: boolean;
}

export async function example() {
  await setItem<Settings>('settings', { notifications: true }); // logs and rethrows on failure
  const settings = await getItem<Settings>('settings'); // null if missing, malformed, or on failure
  await removeItem('settings');
  return { settings, userKey: STORAGE_KEYS.USER_DATA };
}
```

`STORAGE_KEYS` holds the keys the foundation uses (`AUTH_TOKEN`,
`USER_DATA`, `INSTALL_MARKER`); keep your own keys in your feature. For secrets use
`shared/storage/secureStorage.ts` (Expo SecureStore; unavailable on web). For
a token that must also work on web, such as a refresh token, use a store from
`shared/session/tokenStore.ts` instead (secure storage on native, memory on
web); see
[Connect Your Backend](connect-your-backend.md#refresh-tokens).
For larger or relational data, see
[Expo: store data](https://docs.expo.dev/develop/user-interface/store-data/)
(SQLite, MMKV).

## Loading data in screens

`useFetch(fetchFn, deps)` (`shared/lib/useFetch.ts`) loads data for a screen
and returns `{ data, loading, error, refetch }`:

- `fetchFn` receives an `AbortSignal`; pass it to the request. The request
  is aborted when `deps` change, on `refetch`, and on unmount, and only the
  latest request updates state, so an outdated response never overwrites a
  newer one.
- `error` is an `ApiError` (`code`, `status`, `message`), or `null`.
- `deps` works like a hook's dependency list; the latest `fetchFn` is always
  used, so an inline function is fine.

```tsx
import { Text } from 'react-native-paper';
import { api } from '@/shared/http/api';
import { useFetch } from '@/shared/lib/useFetch';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';

export function UserName({ userId }: { userId: number }) {
  const { data, loading, error } = useFetch(
    async signal =>
      (await api.get<{ name: string }>(`/users/${userId}`, { signal })).data,
    [userId]
  );
  if (loading && !data) return <LoadingScreen />;
  if (error?.code === 'network') return <Text>You are offline.</Text>;
  if (error) return <Text>{error.message}</Text>;
  return <Text>{data?.name}</Text>;
}
```

`LoadingScreen` (`shared/ui/LoadingScreen.tsx`) is a centered progress
indicator with an optional message. A whole list screen, with loading, an
error with Retry, and the list, is in
[Connect Your Backend](connect-your-backend.md#3-add-endpoints-for-a-feature),
and its test in [Testing](testing.md#network).

### When to use a data library instead

Keep `useFetch` while each screen loads its own data once and a refetch
button is enough. Adopt [TanStack Query](https://tanstack.com/query/latest)
or [SWR](https://swr.vercel.app/) when you need any of:

- a cache shared between screens (the same data shown in two places, instant
  back navigation);
- background refetching (on focus, on reconnect, on an interval) or
  pagination and infinite lists;
- mutations with cache updates or optimistic UI;
- request deduplication and retries.

To migrate gradually, keep the `useFetch` result shape and swap the
implementation, so screens don't change. With TanStack Query (install it and
wrap the app in a `QueryClientProvider` inside `SessionProvider`):

<!-- docs-check: requires @tanstack/react-query -->

```ts
// shared/lib/useQueryFetch.ts
import { useQuery } from '@tanstack/react-query';
import { toApiError } from '@/shared/http/apiError';
import type { UseFetchResult } from '@/shared/lib/useFetch';

export function useQueryFetch<T>(
  queryKey: readonly unknown[],
  fetchFn: (signal: AbortSignal) => Promise<T>
): UseFetchResult<T> {
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchFn(signal),
  });
  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error ? toApiError(query.error) : null,
    refetch: async () => {
      await query.refetch();
    },
  };
}
```

Then `useFetch(fetchFn, [userId])` becomes
`useQueryFetch(['user', userId], fetchFn)`. Clear the query cache on sign-out
(`queryClient.clear()`) the way the
[state-management recipes](recipes/state-management.md) reset their stores.
