# How-To Guides

Quick guides for common development tasks. Each section includes a brief explanation and code example.

## How to Add a New Screen

Expo Router uses file-based routing. Create a new file in `app/` to create a route.

**Example:** Create `app/profile.tsx`:

```tsx
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';

export default function ProfileScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="headlineMedium">Profile</Text>
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

**Navigate to it:**

```tsx
import { router } from 'expo-router';

router.push('/profile');
```

**Nested routes:** Create folders like `app/settings/account.tsx` → `/settings/account`

See [Expo Router docs](https://docs.expo.dev/router/introduction/) for advanced routing.

## How to Add a New Component

Create a new file in `components/` directory.

**Example:** Create `components/Button.tsx`:

```tsx
import { Button as PaperButton } from 'react-native-paper';
import type { ButtonProps } from 'react-native-paper';

export function CustomButton(props: ButtonProps) {
  return <PaperButton {...props} />;
}
```

**Use it:**

```tsx
import { CustomButton } from '@/components/Button';

<CustomButton mode="contained" onPress={() => {}}>
  Click me
</CustomButton>;
```

Follow [Code Conventions](conventions.md) for naming and structure.

## How to Add API Endpoints

Add new endpoint functions to `services/api.ts` or create a new service file.

**Example:** Add posts API to `services/api.ts`:

```tsx
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
import { postsApi } from '@/services/api';

const posts = await postsApi.getAll();
```

The API client adds the auth token from secure storage to requests for trusted origins only. See [API and Storage](api-and-storage.md#which-hosts-receive-the-token) for details.

## How to Add Custom Hooks

Create a new file in `hooks/` directory.

**Example:** Create `hooks/useToggle.ts`:

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
import { useToggle } from '@/hooks/useToggle';

const [isOpen, toggle] = useToggle(false);
```

See `hooks/useFetch.ts` for a more complex example with loading and error states.

## How to Use Constants

Import constants from `constants/` directory.

**Theme (React Native Paper):**

```tsx
import { useTheme } from 'react-native-paper';

const theme = useTheme();
// Access theme.colors.primary, theme.colors.background, etc.
```

**Storage Keys:**

```tsx
import { STORAGE_KEYS } from '@/services/storage';

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
import { setItem, getItem, removeItem, STORAGE_KEYS } from '@/services/storage';

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
import { useFetch } from '@/hooks/useFetch';
import { todosApi } from '@/services/api';
import { LoadingScreen } from '@/components/LoadingScreen';

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
import { todosApi } from '@/services/api';
import type { ApiError } from '@/services/apiError';

try {
  const todos = await todosApi.getAll();
} catch (error) {
  const apiError = error as ApiError;
  console.error(apiError.message, apiError.status);
}
```

**Component errors:** Wrap components in try/catch or use error boundaries for specific sections.

## How to Customize Theme

Edit `constants/Theme.ts` to customize React Native Paper theme:

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

Edit `palette` in `constants/Theme.ts` for app-specific colors. See [Color Themes](color-themes.md) for details.

## How to Add Authentication

**A complete authentication example is included in the starter!**

- **Auth service:** `services/auth.ts` - login, logout, and token storage
- **Session state:** `providers/SessionProvider.tsx` - the single source of truth,
  mounted in `app/_layout.tsx`; read it anywhere with `useSession()`
- **Login screen:** `app/(auth)/login.tsx` - shown only while signed out
- **Protected screens:** `app/(app)/` - shown only while signed in (example:
  `app/(app)/profile.tsx`)
- **Home** (`app/(tabs)/index.tsx`) shows "Signed in as …" with **View profile**
  and **Log out**, or "Not signed in" with **Try authentication demo**

**To use it:**

1. **Try the runnable demo** from the Home tab's **Try authentication demo** button.
   Sign in with username `emilys` and password `emilyspass`. Home then shows who is
   signed in and **View profile** opens the protected screen; restart the app and
   the session is still there. **Log out** deletes the token from secure storage
   and the profile from AsyncStorage.

2. **Connect your backend** by setting `EXPO_PUBLIC_AUTH_API_URL` and adapting the
   request/response mapping in `services/auth.ts` to match its authentication contract:

```tsx
const response = await authApi.post<DemoAuthResponse>('/auth/login', {
  ...credentials,
  expiresInMins: 60,
});
```

3. **Read the session or sign in/out in any screen:**

```tsx
import { useSession } from '@/providers/SessionProvider';

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
