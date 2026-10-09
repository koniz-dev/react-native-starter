# How-To Guides

Quick guides for common development tasks. Each section includes a brief explanation and code example.

## How to Add a New Screen

Screens live in their feature; `app/` holds a one-line route file that
re-exports them (see [Conventions](conventions.md#project-structure)).

**Example:** a Settings screen.

```tsx
// features/settings/screens/SettingsScreen.tsx
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';

export function SettingsScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="headlineMedium">Settings</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
```

```tsx
// app/settings.tsx (the route: /settings)
export { SettingsScreen as default } from '@/features/settings/screens/SettingsScreen';
```

Put it in `app/(app)/` instead to make it reachable only while signed in.

**Navigate to it:**

```tsx
import { router } from 'expo-router';

router.push('/settings');
```

**Nested routes:** Create folders like `app/settings/account.tsx` → `/settings/account`

See [Expo Router docs](https://docs.expo.dev/router/introduction/) for advanced routing.

## How to Add a New Component

Put it in the feature that uses it (`features/<name>/components/`), or in
`shared/ui/` if several features share it.

**Example:** Create `shared/ui/CustomButton.tsx`:

```tsx
import { Button as PaperButton } from 'react-native-paper';
import type { ButtonProps } from 'react-native-paper';

export function CustomButton(props: ButtonProps) {
  return <PaperButton {...props} />;
}
```

**Use it:**

```tsx
import { CustomButton } from '@/shared/ui/CustomButton';

<CustomButton mode="contained" onPress={() => {}}>
  Click me
</CustomButton>;
```

Follow [Code Conventions](conventions.md) for naming and structure.

## How to Add API Endpoints

Build endpoints for a feature on the shared `api` client, in the feature's
`api/` folder (as `features/demo-todos/api/todosApi.ts` does).

**Example:** `features/posts/api/postsApi.ts`:

```tsx
import { api } from '@/shared/http/api';

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

**Use it:**

```tsx
import { postsApi } from '@/features/posts/api/postsApi';

const posts = await postsApi.getAll();
```

The API client adds the auth token from the token store to requests for trusted origins only. See [API and Storage](api-and-storage.md#which-hosts-receive-the-token) for details.

## How to Add Custom Hooks

Put it in `features/<name>/hooks/`, or in `shared/lib/` if it is generic.

**Example:** Create `shared/lib/useToggle.ts`:

```tsx
import { useState, useCallback } from 'react';

export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle] as const;
}
```

**Use it:**

```tsx
import { useToggle } from '@/shared/lib/useToggle';

const [isOpen, toggle] = useToggle(false);
```

See `shared/lib/useFetch.ts` for a more complex example with loading and error states.

## How to Use Constants

Theme colors come from Paper (`shared/ui/theme.ts`); storage keys from `shared/storage/storage.ts`.

**Theme (React Native Paper):**

```tsx
import { useTheme } from 'react-native-paper';

const theme = useTheme();
// Access theme.colors.primary, theme.colors.background, etc.
```

**Storage Keys:**

```tsx
import { STORAGE_KEYS } from '@/shared/storage/storage';

await setItem(STORAGE_KEYS.AUTH_TOKEN, 'token');
```

## How to Handle Navigation

Expo Router provides navigation via `expo-router`.

**Navigate:**

```tsx
import { router } from 'expo-router';

// Push new screen
router.push('/profile');

// Replace current screen
router.replace('/login');

// Go back
router.back();

// Navigate with params
router.push({
  pathname: '/user',
  params: { id: 123 },
});
```

**Read params:**

```tsx
import { useLocalSearchParams } from 'expo-router';

export default function UserScreen() {
  const { id } = useLocalSearchParams();
  // Use id
}
```

**Tab navigation:** Files in `app/(tabs)/` automatically become tabs. See `app/(tabs)/_layout.tsx`.

## How to Add New Dependencies

Use `npx expo install` for Expo-compatible packages:

```bash
npx expo install expo-image
```

For regular npm packages:

```bash
npm install lodash
npm install --save-dev @types/lodash  # If TypeScript types available
```

**Check compatibility:** Use [React Native Directory](https://reactnative.directory/) to find compatible packages.

**After installing:** Run `npm run lint` to check for issues.

## How to Use the Storage Service

Store and retrieve data with type safety:

```tsx
import {
  setItem,
  getItem,
  removeItem,
  STORAGE_KEYS,
} from '@/shared/storage/storage';

// Store data
await setItem(STORAGE_KEYS.USER_DATA, { id: 1, name: 'John' });

// Retrieve data
const user = await getItem<User>(STORAGE_KEYS.USER_DATA);

// Remove data
await removeItem(STORAGE_KEYS.USER_DATA);
```

See [API and Storage](api-and-storage.md) for complete examples.

## How to Use the useFetch Hook

Fetch data with automatic loading and error states:

```tsx
import { useFetch } from '@/shared/lib/useFetch';
import { todosApi } from '@/features/demo-todos/api/todosApi';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';

export default function TodosScreen() {
  const { data, loading, error, refetch } = useFetch(() => todosApi.getAll());

  if (loading) return <LoadingScreen />;
  if (error) return <Text>Error: {error}</Text>;
  if (!data) return null;

  return <TodoList todos={data} />;
}
```

**Refetch on dependency change:**

```tsx
// fetchUser is your own endpoint, e.g. api.get(`/users/${id}`)
const { data } = useFetch(() => fetchUser(userId), [userId]);
```

## How to Handle Errors

**Global error boundary:** Already set up in `app/_layout.tsx`. Unhandled errors are caught automatically.

**API errors:**

```tsx
import { todosApi } from '@/features/demo-todos/api/todosApi';
import type { ApiError } from '@/shared/http/apiError';

try {
  const todos = await todosApi.getAll();
} catch (error) {
  const apiError = error as ApiError;
  console.error(apiError.message, apiError.status);
}
```

**Component errors:** Wrap components in try/catch or use error boundaries for specific sections.

## How to Customize Theme

Edit `shared/ui/theme.ts` to customize React Native Paper theme:

```tsx
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee', // Your brand color
    // Add more custom colors
  },
  roundness: 8, // Adjust border radius
};
```

Edit `palette` in `shared/ui/theme.ts` for app-specific colors. See [Color Themes](color-themes.md) for details.

## How to Add Authentication

Authentication is split into a backend-agnostic foundation and an adapter for
your backend:

- **Auth service:** `shared/session/authService.ts` - the `AuthAdapter`
  interface, `setAuthAdapter()`, and login/logout/token storage
- **Session state:** `shared/session/SessionProvider.tsx` - the single source of truth,
  mounted in `app/_layout.tsx`; read it anywhere with `useSession()`
- **Screens:** `features/auth/screens/` - Login (route `app/(auth)/login.tsx`,
  signed out only) and Profile (route `app/(app)/profile.tsx`, signed in only)
- **Home** (`features/home/screens/HomeScreen.tsx`) shows "Signed in as …" with
  **View profile** and **Log out**, or "Not signed in" with **Sign in**
- **Demo adapter:** `features/demo-auth/dummyJsonAdapter.ts` for DummyJSON,
  registered in `shared/integrations/setup.ts`

**To use it:**

1. **Try the demo** with `EXPO_PUBLIC_USE_DEMO_BACKENDS=true`: tap **Sign in**
   on Home and use `emilys` / `emilyspass` (the login screen shows them only
   with the demo backends on). **View profile** opens the protected screen;
   restart the app and the session is still there (on web a reload signs out,
   see [API and Storage](api-and-storage.md#why-the-token-is-not-persisted-on-web)).
   **Log out** deletes the token and the stored profile.

2. **Connect your backend** by setting `EXPO_PUBLIC_AUTH_API_URL` and writing
   an adapter. The foundation calls it with HTTP clients for that URL
   (`public` has no token; `authenticated` sends the stored token and signs
   the user out on a 401):

```ts
// features/auth/myBackendAdapter.ts
import type { AuthAdapter } from '@/shared/session/authService';

export const myBackendAuthAdapter: AuthAdapter = {
  // Required: credentials -> access token + your backend's user payload.
  login: async (credentials, { public: http }) => {
    const { data } = await http.post('/sessions', credentials);
    return { token: data.access_token, user: data.user };
  },
  // Required: your payload -> { id, email, name }; throw if it's incomplete.
  normalizeUser: raw => {
    const user = raw as { uuid: string; email: string; full_name?: string };
    return {
      id: user.uuid,
      email: user.email,
      name: user.full_name ?? user.email,
    };
  },
  // Optional: reload the user (the profile screen calls it).
  fetchUser: async ({ authenticated }) => (await authenticated.get('/me')).data,
  // Optional: get a new access token on a 401, or null to sign out.
  refresh: async ({ public: http }) => {
    const refreshToken = await loadRefreshToken(); // your storage
    if (!refreshToken) return null;
    const { data } = await http.post('/sessions/refresh', { refreshToken });
    return data.access_token;
  },
};
```

Then register it in `shared/integrations/setup.ts`, replacing the demo:

```ts
import { setAuthAdapter } from '@/shared/session/authService';
import { myBackendAuthAdapter } from '@/features/auth/myBackendAdapter';

setAuthAdapter(myBackendAuthAdapter); // inside configureIntegrations()
```

The service validates the token, stores it in the token store and the
normalized user in AsyncStorage, and registers `refresh` (if any) as the HTTP
client's refresh handler; nothing in `shared/` needs to change. Without a
registered adapter, sign-in fails with "Sign-in is not configured".

3. **Read the session or sign in/out in any screen:**

```tsx
import { useSession } from '@/shared/session/SessionProvider';

const { session, signIn, signOut } = useSession();
// session.status: 'loading' | 'signedIn' | 'signedOut'; session.user?.name
await signIn({ username, password }); // rejects with an ApiError on failure
await signOut();
```

Every consumer re-renders when the session changes: sign-in, sign-out, and a
session that expires because the API returned 401 (see
[Expired sessions](api-and-storage.md#expired-sessions-401)).

4. **Add a protected screen** by creating it in `app/(app)/` and listing it in
   `app/(app)/_layout.tsx`. The root layout guards the group:

```tsx
// app/_layout.tsx (RootNavigator)
<Stack>
  <Stack.Screen name="(tabs)" />
  <Stack.Protected guard={!signedIn}>
    <Stack.Screen name="(auth)" />
  </Stack.Protected>
  <Stack.Protected guard={signedIn}>
    <Stack.Screen name="(app)" />
  </Stack.Protected>
</Stack>
```

When the guard is false, the group's screens can't be opened: deep links and
`router.push` into them land on Home, and a user who signs out (or whose session
expires) on a protected screen is sent back to Home. Signing in removes the
login screen the same way, so it needs no navigation code. The root layout
renders routes only after the stored session has been read (the splash screen
stays up meanwhile), so a cold-start deep link into `(app)` works for a
signed-in user.

The group has its own stack, so its first screen would have no header back
button; `app/(app)/_layout.tsx` adds one that returns to the screen that opened
the group. The example profile screen also reloads the user from the auth
backend (`refreshUser()`, `GET /auth/me` with the token), which is where an
expired token shows up as a 401.

Once stored, the API client adds the token to requests for trusted origins (the auth backend by default). See [API and Storage](api-and-storage.md#which-hosts-receive-the-token).

## See Also

- [Getting Started](getting-started.md) - Initial setup
- [Code Conventions](conventions.md) - Project standards
- [API and Storage](api-and-storage.md) - Backend integration
- [Expo Router Docs](https://docs.expo.dev/router/introduction/) - Navigation details
