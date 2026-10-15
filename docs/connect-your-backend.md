# Connect Your Backend

The app talks to two base URLs: the **API** (`EXPO_PUBLIC_API_URL`, your
app's data) and the **auth backend** (`EXPO_PUBLIC_AUTH_API_URL`, sign-in).
They can be the same server. Connecting yours takes three steps: set the
URLs, write an auth adapter, and add endpoints for your features.

## 1. Point the app at your servers

In `.env` for development, and in the EAS build profile (or `eas env:create`)
for preview and production builds:

```bash
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_AUTH_API_URL=https://auth.example.com
# The token goes only to the auth backend's origin and these: list your API
# here when it is on another origin, or its requests go without the token.
EXPO_PUBLIC_API_TRUSTED_ORIGINS=https://api.example.com
```

The values are validated at startup; outside development they must be
`https`. When the API and the auth backend are the same server, leave
`EXPO_PUBLIC_API_TRUSTED_ORIGINS` empty. All variables:
[Environment Variables](environment-variables.md).

Both URLs may include a path prefix, such as
`https://example.com/api/v1`: requests keep it, so `api.get('/notes')` goes
to `https://example.com/api/v1/notes`. Write endpoint paths relative to that
prefix. Only the origin (scheme, host, and port) decides which requests carry
the token.

### A backend on your computer

In development, `http` URLs are allowed, but `localhost` means the device
itself:

- **iOS Simulator and web:** `http://localhost:<port>` reaches your computer.
- **Android emulator:** use `http://10.0.2.2:<port>` (the emulator's alias for
  your computer), or run `adb reverse tcp:<port> tcp:<port>` once per boot and
  keep `http://localhost:<port>`.
- **A phone on the same Wi-Fi:** use your computer's LAN address, such as
  `http://192.168.1.20:<port>`, and have the server listen on all interfaces
  (`0.0.0.0`), not only `localhost`.

Restart Metro after changing `.env`.

**Preview and production builds** reject `http` URLs, and Android release
builds also block cleartext traffic. To try such a build against a backend
that isn't deployed yet:

- **Use an HTTPS tunnel** to your local server (a tunneling service gives it
  a public `https` URL with a trusted certificate). This is the simplest
  option, and it works on real devices.
- **Or put a local TLS proxy in front of it, with your own CA**, and make the
  device trust that CA.
  - **iOS Simulator:** `xcrun simctl keychain booted add-root-cert ca.pem`.
  - **Android:** since Android 7, apps don't trust user-installed CAs, so the
    CA has to be in the system store. That needs an emulator image you can
    root: a `google_apis` image (not `google_apis_playstore`), started with
    `-writable-system`, then `adb root`, `adb remount`, and the CA copied to
    `/system/etc/security/cacerts/`.

A deployed staging backend with a real certificate avoids all of this.

## 2. Sign-in: write an AuthAdapter

`shared/session/authService.ts` handles the session: it stores the token
(Keychain / Keystore, memory on web), stores the user, signs out on a 401, and
drives the route guards. What your backend's sign-in looks like is up to an
**AuthAdapter**, which gets HTTP clients for `EXPO_PUBLIC_AUTH_API_URL`:
`public` sends no token (a 401 there is a wrong password); `authenticated`
sends the stored token (a 401 there signs the user out).

This example is for a backend with the shapes real backends commonly use:

- every success response is wrapped in an envelope: `{ "data": ... }`;
- `POST /sessions` takes `{ email, password }` and returns only tokens:
  `{ "data": { "access_token", "refresh_token" } }`; the user comes from
  `GET /me`;
- `POST /sessions/refresh` rotates the refresh token: it returns a new pair,
  and the old refresh token stops working;
- `POST /sessions/revoke` takes `{ refresh_token }` and revokes it; it
  needs no access token.

The adapter checks every payload with zod before it uses it, as the
[conventions](conventions.md#code-style) ask: a typed `http.post<Tokens>()`
alone is only a cast, and a payload of another shape would fail later with a
less useful error.

```ts
// features/auth/myBackendAdapter.ts
import { Platform } from 'react-native';
import { z } from 'zod';
import { isTransient, toApiError } from '@/shared/http/apiError';
import type { AuthAdapter } from '@/shared/session/authService';
import {
  createMemoryTokenStore,
  createSecureTokenStore,
} from '@/shared/session/tokenStore';

const TokensSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

const UserSchema = z.object({
  uuid: z.string(),
  email: z.string(),
  full_name: z.string().optional(),
});

/**
 * The content of a `{ "data": ... }` response, checked against `schema`. A
 * mismatch throws a readable message; zod's details stay in `cause`.
 */
function unwrap<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = z.object({ data: schema }).safeParse(body);
  if (!result.success) {
    throw new Error('Unexpected response from the server', {
      cause: result.error,
    });
  }
  return result.data.data;
}

// The refresh token is stored like the access token: in the Keychain /
// Keystore on native, in memory on web (secure storage isn't available there).
export const refreshTokens =
  Platform.OS === 'web'
    ? createMemoryTokenStore()
    : createSecureTokenStore('refresh_token');

export const myBackendAuthAdapter: AuthAdapter = {
  // Required: credentials -> access token + your backend's user payload.
  // The Login form's username field holds the email here.
  login: async ({ username, password }, { public: http }) => {
    const tokens = unwrap(
      TokensSchema,
      (await http.post('/sessions', { email: username, password })).data
    );
    // No user in the response: load it with the new token. Pass the token
    // yourself; it isn't stored until login returns.
    const user = unwrap(
      UserSchema,
      (
        await http.get('/me', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
      ).data
    );
    await refreshTokens.set(tokens.refresh_token);
    return { token: tokens.access_token, user };
  },

  // Required: your payload -> { id, email, name }; throw if it's incomplete.
  // It also reads the user stored by an earlier version of the app.
  normalizeUser: raw => {
    const result = UserSchema.safeParse(raw);
    if (!result.success) {
      throw new Error('The sign-in response did not include the user');
    }
    const user = result.data;
    return {
      id: user.uuid,
      email: user.email,
      name: user.full_name ?? user.email,
    };
  },

  // Optional: reload the user (the Profile screen calls it).
  fetchUser: async ({ authenticated }) =>
    unwrap(UserSchema, (await authenticated.get('/me')).data),

  // Optional: a new access token on a 401, or null to sign the user out.
  // Throwing a transient error (network, timeout, server, canceled, 408, or
  // 429) keeps the session; any other error signs the user out.
  refresh: async ({ public: http }) => {
    const refreshToken = await refreshTokens.get();
    if (!refreshToken) return null;
    try {
      const tokens = unwrap(
        TokensSchema,
        (
          await http.post('/sessions/refresh', {
            refresh_token: refreshToken,
          })
        ).data
      );
      // Signed out (or in again) while this ran: the new tokens belong to
      // no session. Revoke the refresh token instead of keeping it.
      if ((await refreshTokens.get()) !== refreshToken) {
        await http
          .post('/sessions/revoke', { refresh_token: tokens.refresh_token })
          .catch(() => undefined);
        return null;
      }
      // Rotation: keep the new refresh token; the old one no longer works.
      await refreshTokens.set(tokens.refresh_token);
      return tokens.access_token;
    } catch (error) {
      const apiError = toApiError(error);
      // Offline, timed out, canceled, rate limited, or a server error: the
      // session is kept, so keep the refresh token and try again later.
      if (isTransient(apiError)) throw apiError;
      // Anything else signs the user out next: drop the refresh token.
      await refreshTokens.clear();
      return null;
    }
  },

  // Optional: end the session on the backend. Runs on sign-out; if it
  // throws, the user is signed out anyway. The refresh token is the
  // credential, so this works after the access token has expired.
  logout: async ({ public: http }) => {
    const refreshToken = await refreshTokens.get();
    try {
      if (refreshToken) {
        await http.post('/sessions/revoke', { refresh_token: refreshToken });
      }
    } finally {
      // Unless someone signed in while the request ran: that refresh token
      // is the new session's.
      if ((await refreshTokens.get()) === refreshToken) {
        await refreshTokens.clear();
      }
    }
  },
};
```

Register it in `shared/integrations/setup.ts`, inside
`configureIntegrations()`:

```ts
import { setAuthAdapter, type AuthAdapter } from '@/shared/session/authService';

declare const myBackendAuthAdapter: AuthAdapter; // from the file above

setAuthAdapter(myBackendAuthAdapter);
```

<!-- @demo remove-block-start -->

Until you remove the demo, `setup.ts` registers the DummyJSON adapter
there; replace that registration with yours.

<!-- @demo remove-block-end -->

The service rejects a missing token, stores the token and the normalized
user, and registers `refresh` (if any) as the HTTP client's refresh handler,
which is tried once per 401 before signing out. On sign-out it calls `logout`
(if any), then clears the stored session, unless that session ended while
`logout` ran (it expired, and the user may have signed in again). Nothing in
`shared/` changes.
Until an adapter is registered, Login shows "Login failed. Please try
again." and the reason, "Sign-in is not configured: register an AuthAdapter
in shared/integrations/setup.ts.", goes to the log (the console in
development, and the error reporter).

### Your backend's field names

The Login screen sends `LoginCredentials`, `{ username, password }`, whatever
your backend calls them; map them in `login`, as the example does with
`email: username`. To label the field "Email", change `'login.username'` in
`shared/i18n/en.ts`; for the email keyboard and autofill, also set
`keyboardType="email-address"` and `autoComplete="email"` on the
`login-username` field in `features/auth/screens/LoginScreen.tsx`. Two
tests in `__tests__/features/auth/LoginScreen.test.tsx` pin the label and
`autoComplete`; update them with it.

### More fields on the user

The signed-in user the app keeps is `AuthUser` (`id`, `email`, `name`) in
`shared/session/authService.ts`. To keep another field, such as an avatar
URL, add it there in three places:

- the `AuthUser` interface;
- `StoredUserSchema`, as an optional field, so a profile stored by an
  earlier version of the app still validates;
- your adapter's `normalizeUser`, which maps it from your payload.

Screens then read it from `useSession().session.user`. Data that changes
often, or that only one screen needs, is better loaded by that screen from
your API (with `useFetch`) than stored in the session.

### Testing your adapter

`__tests__/shared/session/realBackendAdapter.test.ts` tests the example
above, taken from this page. Once your adapter has its own file, such as
`features/auth/<backend>Adapter.ts`, point the test at it, or `test:ci`
fails the coverage threshold on your file: delete `loadDocumentedAdapter()`
and the imports only it uses, and import your adapter in its place. Then
change the test's fake backend to your API's shapes.

### A login response without the user

`login` must return the user payload. If the login response doesn't include
it, request it with the new access token in an explicit `Authorization`
header, as the example does. Don't use the `authenticated` client for this:
it sends the stored token, and there is none until `login` returns.

### Refresh tokens

- **Storage.** Keep the refresh token in a store from
  `shared/session/tokenStore.ts`: `createSecureTokenStore(key)` (Keychain /
  Keystore) on native and `createMemoryTokenStore()` on web, where
  `shared/storage/secureStorage.ts` can't store anything (`setSecureItem`
  throws). Use a key other than the access token's.
- **Rotation.** If your backend issues a new refresh token on every refresh,
  store it in `refresh`, as the example does. The HTTP client shares one
  refresh between concurrent 401s, and a 401 for a request sent with an older
  access token is retried with the current one instead of refreshing again,
  so a rotated token is used only once.
- **Failures.** Throw a transient error (`isTransient` in
  `shared/http/apiError.ts`: its `code` is `network`, `timeout`, `server`
  (a 5xx), or `canceled`, or its status is 408 or 429) and the session is
  kept; the original request fails with that error. Anything else, `null` or
  any other error (another 4xx, a response that fails validation), means the
  refresh token was rejected: the user is signed out, so drop the refresh
  token first, as the example does.
- **Sign-out during a refresh.** The service discards an access token from a
  refresh that finishes after the user signed out (or in again), but it
  can't see the refresh token your adapter stores. Before storing a rotated
  one, check that the stored refresh token is still the one this refresh
  used; if not, the session it belonged to is over, so revoke the new one,
  as the example does.
- **Revocation.** Revoke and delete it in `logout`. Revoke with the refresh
  token through the `public` client, as the example does: the access token
  has often expired by the time the user signs out, and the refresh token
  alone identifies the session. Delete it in `finally`, so a failed request doesn't leave it on the
  device, but only if it is still the one you revoked: a slow sign-out can
  finish after the user signed in again.
- **Sessions that end without a sign-out.** When a session ends another
  way (a 401 that a successful refresh didn't fix, or a reinstall on iOS,
  where the service clears the access token the Keychain kept), `logout`
  isn't called, so the refresh token stays stored. It is never used while
  signed out and is replaced at the next sign-in; to revoke it sooner,
  revoke and delete a stored refresh token at the start of `login`.
- **Clients.** `refresh` gets clients where a 401 on `authenticated` fails
  the refresh (the user is signed out) instead of starting another refresh.
  Make its requests through these clients, not the app's `api` client.

### Error messages

A failed request rejects with an `ApiError` whose message comes from the
response body when it has one: a string `message` or `error` field, or the
`message` of an envelope like `{ "error": { "code": "...", "message": "..." } }`.
The Login screen shows that message, for example on a wrong password. For
another shape, map it in your adapter: catch the error and throw one with the
message you want.

`__tests__/shared/session/realBackendAdapter.test.ts` runs this example,
taken from this page, against a fake backend with these shapes. It reads
the snippet that starts with `// features/auth/myBackendAdapter.ts`, so it
fails if you edit that snippet or delete this page; see
[Testing your adapter](#testing-your-adapter).

Screens read the session with `useSession()`:

```tsx
import { Button, Text } from 'react-native-paper';
import { t } from '@/shared/i18n';
import { useSession } from '@/shared/session/SessionProvider';

export function AccountRow() {
  const { session, signOut } = useSession();
  if (session.status !== 'signedIn') return null;
  return (
    <>
      <Text>{session.user?.name}</Text>
      <Button onPress={() => void signOut()}>{t('home.session.logOut')}</Button>
    </>
  );
}
```

Screens that need a signed-in user go in `app/(app)/`; the root layout only
shows that group while signed in. See
[Conventions](conventions.md#project-structure).

## 3. Add endpoints for a feature

Build endpoints on the shared API client in the feature's `api/` folder, and
check each payload with zod there, so a screen only sees data of the shape it
expects:

```ts
// features/posts/api/postsApi.ts
import { z } from 'zod';
import { api } from '@/shared/http/api';

const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
});

export type Post = z.infer<typeof PostSchema>;

/** `body` checked against `schema`; a mismatch throws a readable message. */
function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error('Unexpected response from the server', {
      cause: result.error,
    });
  }
  return result.data;
}

export const postsApi = {
  list: async (signal?: AbortSignal): Promise<Post[]> =>
    parse(z.array(PostSchema), (await api.get('/posts', { signal })).data),
  create: async (title: string): Promise<Post> =>
    parse(PostSchema, (await api.post('/posts', { title })).data),
};
```

If your API wraps responses in an envelope such as `{ "data": [...] }`,
parse the envelope and return its content, as `unwrap` does in the sign-in
example. When several features share it, the helper can live in
`shared/http/`.

Load them in a screen with `useFetch` (loading, a typed `ApiError`, refetch;
the `signal` cancels the request when the screen goes away). This screen shows
the loading state, then the error (in words the user can act on) with a
Try again button, or the list:

```tsx
// features/posts/screens/PostsScreen.tsx
import { useEffect } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { errorMessage } from '@/shared/http/errorMessage';
import { t } from '@/shared/i18n';
import { logger } from '@/shared/lib/logger';
import { useFetch } from '@/shared/lib/useFetch';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';
import { useAnnouncement } from '@/shared/ui/useAnnouncement';

// From ../api/postsApi.ts above.
declare const postsApi: {
  list(signal?: AbortSignal): Promise<{ id: number; title: string }[]>;
};

export function PostsScreen() {
  const { data, loading, error, refetch } = useFetch(signal =>
    postsApi.list(signal)
  );
  const message = error && errorMessage(error);
  useAnnouncement(message);
  useEffect(() => {
    // Not a server answer (e.g. a payload that fails the schema): the user
    // sees a generic message, the developer the reason.
    if (error?.code === 'unknown') logger.error('Loading posts failed', error);
  }, [error]);

  if (loading && !data) return <LoadingScreen />;
  return (
    <View>
      <View accessibilityLiveRegion="polite">
        {message && <Text>{message}</Text>}
      </View>
      {error && (
        <Button onPress={() => void refetch()}>{t('common.tryAgain')}</Button>
      )}
      {data?.map(post => (
        <Text key={post.id}>{post.title}</Text>
      ))}
    </View>
  );
}
```

The client sends the stored token only to the auth backend's origin and the
origins in `EXPO_PUBLIC_API_TRUSTED_ORIGINS`, rejects with a typed
`ApiError` (`network`, `timeout`, `unauthorized`, `client`, `server`, ...),
and logs failures without headers or bodies. Details:
[API and Storage](api-and-storage.md). To test the screen's states in order,
hold each request open as in [Testing](testing.md#network).

## Sessions on web

On web the token is kept in memory only, so a reload signs the user out. For
sessions that survive a reload, use an httpOnly cookie set by your backend;
see [API and Storage](api-and-storage.md#why-the-token-is-not-persisted-on-web).

## Then

<!-- @demo remove-block-start -->

- [Remove the Demo](remove-demo.md) to drop the DummyJSON adapter and the
  example screens.

<!-- @demo remove-block-end -->

- Test your adapter against a fake backend like
  `__tests__/shared/session/realBackendAdapter.test.ts` does
  ([Testing](testing.md)).
