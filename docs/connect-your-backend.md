# Connect Your Backend

The starter talks to two base URLs: the **API** (`EXPO_PUBLIC_API_URL`, your
app's data) and the **auth backend** (`EXPO_PUBLIC_AUTH_API_URL`, sign-in).
They can be the same server. Connecting yours takes three steps: set the
URLs, write an auth adapter, and add endpoints for your features.

## 1. Point the app at your servers

In `.env` for development, and in the EAS build profile (or `eas env:create`)
for preview and production builds:

```bash
EXPO_PUBLIC_USE_DEMO_BACKENDS=false
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_AUTH_API_URL=https://auth.example.com
# Optional: other first-party hosts that may receive the token
EXPO_PUBLIC_API_TRUSTED_ORIGINS=https://files.example.com
```

The values are validated at startup; outside development they must be
`https`. All variables: [Environment Variables](environment-variables.md).

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

This example is for a backend that differs from the starter's defaults in the
usual ways:

- `POST /sessions` takes `{ email, password }` and returns only tokens:
  `{ "access_token", "refresh_token" }`; the user comes from `GET /me`;
- `POST /sessions/refresh` rotates the refresh token: it returns a new pair,
  and the old refresh token stops working;
- `DELETE /sessions` revokes a refresh token.

```ts
// features/auth/myBackendAdapter.ts
import { Platform } from 'react-native';
import type { AuthAdapter } from '@/shared/session/authService';
import {
  createMemoryTokenStore,
  createSecureTokenStore,
} from '@/shared/session/tokenStore';

interface Tokens {
  access_token: string;
  refresh_token: string;
}

interface MyUser {
  uuid: string;
  email: string;
  full_name?: string;
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
    const { data: tokens } = await http.post<Tokens>('/sessions', {
      email: username,
      password,
    });
    // No user in the response: load it with the new token. Pass the token
    // yourself; it isn't stored until login returns.
    const { data: user } = await http.get<MyUser>('/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    await refreshTokens.set(tokens.refresh_token);
    return { token: tokens.access_token, user };
  },

  // Required: your payload -> { id, email, name }; throw if it's incomplete.
  normalizeUser: raw => {
    const user = raw as Partial<MyUser>;
    if (!user.uuid || !user.email) {
      throw new Error('The sign-in response did not include the user');
    }
    return {
      id: user.uuid,
      email: user.email,
      name: user.full_name ?? user.email,
    };
  },

  // Optional: reload the user (the Profile screen calls it).
  fetchUser: async ({ authenticated }) =>
    (await authenticated.get<MyUser>('/me')).data,

  // Optional: a new access token on a 401, or null to sign the user out.
  refresh: async ({ public: http }) => {
    const refreshToken = await refreshTokens.get();
    if (!refreshToken) return null;
    try {
      const { data } = await http.post<Tokens>('/sessions/refresh', {
        refresh_token: refreshToken,
      });
      // Rotation: keep the new refresh token; the old one no longer works.
      await refreshTokens.set(data.refresh_token);
      return data.access_token;
    } catch (error) {
      // The user is signed out next, so drop the rejected refresh token.
      await refreshTokens.clear();
      throw error;
    }
  },

  // Optional: end the session on the backend. Runs on sign-out while the
  // access token is still stored; if it throws, the user is signed out anyway.
  logout: async ({ authenticated }) => {
    const refreshToken = await refreshTokens.get();
    await refreshTokens.clear();
    if (refreshToken) {
      await authenticated.delete('/sessions', {
        data: { refresh_token: refreshToken },
      });
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
(if any), then clears the stored session. Nothing in `shared/` changes.
Until an adapter is registered, sign-in fails with "Sign-in is not
configured".

### Your backend's field names

The Login screen sends `LoginCredentials`, `{ username, password }`, whatever
your backend calls them; map them in `login`, as the example does with
`email: username`. To label the field "Email", change `'login.username'` in
`shared/i18n/en.ts`; for the email keyboard and autofill, also set
`keyboardType="email-address"` and `autoComplete="email"` on the
`login-username` field in `features/auth/screens/LoginScreen.tsx`.

### A login response without the user

`login` must return the user payload. If the login response doesn't include
it, request it with the new access token in an explicit `Authorization`
header, as the example does. Don't use the `authenticated` client for this:
it sends the stored token, and there is none until `login` returns.

### Refresh tokens

- **Storage.** Keep the refresh token in a store from
  `shared/session/tokenStore.ts`: `createSecureTokenStore(key)` (Keychain /
  Keystore) on native and `createMemoryTokenStore()` on web, where
  `shared/storage/secureStorage.ts` throws. Use a key other than the access
  token's.
- **Rotation.** If your backend issues a new refresh token on every refresh,
  store it in `refresh`, as the example does. The HTTP client shares one
  refresh between concurrent 401s, so a rotated token is used only once.
- **Revocation.** Revoke and delete it in `logout`. Delete it before the
  request, so a failed request doesn't leave it on the device.

### Error messages

A failed request rejects with an `ApiError` whose message comes from the
response body when it has one: a string `message` or `error` field, or the
`message` of an envelope like `{ "error": { "code": "...", "message": "..." } }`.
The Login screen shows that message, for example on a wrong password. For
another shape, map it in your adapter: catch the error and throw one with the
message you want.

`__tests__/shared/session/realBackendAdapter.test.ts` runs this example,
taken from this page, against a fake backend with these shapes.

Screens read the session with `useSession()`:

```tsx
import { Button, Text } from 'react-native-paper';
import { useSession } from '@/shared/session/SessionProvider';

export function AccountRow() {
  const { session, signOut } = useSession();
  if (session.status !== 'signedIn') return null;
  return (
    <>
      <Text>{session.user?.name}</Text>
      <Button onPress={signOut}>Log out</Button>
    </>
  );
}
```

Screens that need a signed-in user go in `app/(app)/`; the root layout only
shows that group while signed in. See
[Conventions](conventions.md#project-structure).

## 3. Add endpoints for a feature

Build endpoints on the shared API client in the feature's `api/` folder:

```ts
// features/posts/api/postsApi.ts
import { api } from '@/shared/http/api';

export interface Post {
  id: number;
  title: string;
}

export const postsApi = {
  list: async (): Promise<Post[]> => (await api.get<Post[]>('/posts')).data,
  create: async (title: string): Promise<Post> =>
    (await api.post<Post>('/posts', { title })).data,
};
```

and load them in a screen with `useFetch` (loading, a typed `ApiError`, refetch;
the `signal` cancels the request when the screen goes away). This screen shows
the loading state, then the error with a Retry button, or the list:

```tsx
// features/posts/screens/PostsScreen.tsx
import { Button, Text } from 'react-native-paper';
import { api } from '@/shared/http/api';
import { useFetch } from '@/shared/lib/useFetch';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';

interface Post {
  id: number;
  title: string;
}

export function PostsScreen() {
  const { data, loading, error, refetch } = useFetch(
    async signal => (await api.get<Post[]>('/posts', { signal })).data
  );

  if (loading && !data) return <LoadingScreen message="Loading posts..." />;
  if (error)
    return <Button onPress={refetch}>{`${error.message}. Retry`}</Button>;
  return (
    <>
      {data?.map(post => (
        <Text key={post.id}>{post.title}</Text>
      ))}
    </>
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
