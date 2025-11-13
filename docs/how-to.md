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

The API client automatically adds auth tokens from storage. See [API and Storage](api-and-storage.md) for details.

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

**Colors:**

```tsx
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

const colorScheme = useColorScheme();
const colors = Colors[colorScheme ?? 'light'];
```

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
npx expo install react-native-vector-icons
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
import { userApi } from '@/services/api';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function UsersScreen() {
  const { data, loading, error, refetch } = useFetch(() => userApi.getAll());

  if (loading) return <LoadingScreen />;
  if (error) return <Text>Error: {error}</Text>;
  if (!data) return null;

  return <UserList users={data} />;
}
```

**Refetch on dependency change:**

```tsx
const { data } = useFetch(() => userApi.getById(userId), [userId]);
```

## How to Handle Errors

**Global error boundary:** Already set up in `app/_layout.tsx`. Unhandled errors are caught automatically.

**API errors:**

```tsx
import { todosApi } from '@/services/api';
import type { ApiError } from '@/types/api';

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

Edit `constants/Colors.ts` for app-specific colors. See [Color Themes](color-themes.md) for details.

## How to Add Authentication

**A complete authentication example is included in the starter!**

- **Auth service:** `services/auth.ts` - Handles login, logout, and token management
- **Login screen:** `app/(auth)/login.tsx` - Complete login form with error handling

**To use it:**

1. **Update the API endpoint** in `services/auth.ts` to match your backend:

```tsx
// Change this line in services/auth.ts
const response = await api.post<AuthResponse>('/auth/login', credentials);
```

2. **Navigate to login screen:**

```tsx
import { router } from 'expo-router';

router.push('/(auth)/login');
```

3. **Check authentication status:**

```tsx
import { authService } from '@/services/auth';

const isAuthenticated = await authService.isAuthenticated();
if (!isAuthenticated) {
  router.replace('/(auth)/login');
}
```

4. **Logout:**

```tsx
await authService.logout();
router.replace('/(auth)/login');
```

The API client automatically adds the token to requests once stored. See [API and Storage](api-and-storage.md) for details.

## See Also

- [Getting Started](getting-started.md) - Initial setup
- [Code Conventions](conventions.md) - Project standards
- [API and Storage](api-and-storage.md) - Backend integration
- [Expo Router Docs](https://docs.expo.dev/router/introduction/) - Navigation details
