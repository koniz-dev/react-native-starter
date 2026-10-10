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

## 2. Sign-in: write an AuthAdapter

`shared/session/authService.ts` handles the session: it stores the token
(Keychain / Keystore, memory on web), stores the user, signs out on a 401, and
drives the route guards. What your backend's sign-in looks like is up to an
**AuthAdapter**, which gets HTTP clients for `EXPO_PUBLIC_AUTH_API_URL`:
`public` sends no token (a 401 there is a wrong password); `authenticated`
sends the stored token (a 401 there signs the user out).

```ts
// features/auth/myBackendAdapter.ts
import type { AuthAdapter } from '@/shared/session/authService';

// Placeholders for your own code:
declare function loadRefreshToken(): Promise<string | null>;
declare function saveRefreshToken(token: string): Promise<void>;

interface MyUser {
  uuid: string;
  email: string;
  full_name?: string;
}

export const myBackendAuthAdapter: AuthAdapter = {
  // Required: credentials -> access token + your backend's user payload.
  login: async (credentials, { public: http }) => {
    const { data } = await http.post<{
      access_token: string;
      refresh_token: string;
      user: MyUser;
    }>('/sessions', credentials);
    await saveRefreshToken(data.refresh_token);
    return { token: data.access_token, user: data.user };
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
    const refreshToken = await loadRefreshToken();
    if (!refreshToken) return null;
    const { data } = await http.post<{ access_token: string }>(
      '/sessions/refresh',
      { refreshToken }
    );
    return data.access_token;
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
which is tried once per 401 before signing out. Nothing in `shared/` changes.
Until an adapter is registered, sign-in fails with "Sign-in is not
configured".

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

- Test your adapter like `__tests__/shared/session/authService.test.ts` does
  with its fake adapter ([Testing](testing.md)).
