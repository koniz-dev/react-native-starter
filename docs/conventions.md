# Code Conventions

Project standards and best practices for maintaining consistency.

## File Naming

- **Components:** PascalCase - `Button.tsx`, `UserProfile.tsx`
- **Hooks:** camelCase with `use` prefix - `useFetch.ts`, `useToggle.ts`
- **Services/Utils:** camelCase - `api.ts`, `storage.ts`, `formatDate.ts`
- **Types:** camelCase - `api.ts`, `user.ts`
- **Constants:** PascalCase - `Colors.ts`, `Theme.ts`
- **Screens:** PascalCase (Expo Router auto-converts) - `index.tsx` → `/`, `profile.tsx` → `/profile`

## Import Order

Organize imports in this order:

1. React and React Native
2. Third-party libraries
3. Expo packages
4. Local absolute imports (`@/`)
5. Relative imports (`./`, `../`)
6. Types (with `type` keyword)

**Example:**

```tsx
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useFetch } from '@/hooks/useFetch';
import { userApi } from '@/services/api';
import { LoadingScreen } from '@/components/LoadingScreen';

import type { User } from '@/types/api';
```

## Component Structure

Follow this structure for components:

```tsx
// 1. Imports
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

// 2. Types/Interfaces (if needed)
interface Props {
  title: string;
  onPress: () => void;
}

// 3. Component
export function CustomButton({ title, onPress }: Props) {
  // 4. Hooks
  const [loading, setLoading] = useState(false);

  // 5. Handlers
  const handlePress = async () => {
    setLoading(true);
    await onPress();
    setLoading(false);
  };

  // 6. Render
  return (
    <Button onPress={handlePress} loading={loading}>
      {title}
    </Button>
  );
}

// 7. Styles (at bottom)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

## TypeScript Usage

**Always type function parameters and return values:**

```tsx
// Good
function getUser(id: number): Promise<User> {
  return userApi.getById(id);
}

// Avoid
function getUser(id) {
  return userApi.getById(id);
}
```

**Use interfaces for object shapes:**

```tsx
interface User {
  id: number;
  name: string;
  email: string;
}
```

**Use `type` for unions and intersections:**

```tsx
type Status = 'loading' | 'success' | 'error';
type UserWithRole = User & { role: string };
```

**Prefer `interface` for extensible types, `type` for unions/intersections.**

## Comments Guidelines

**Document public APIs:**

```tsx
/**
 * Fetches user data with automatic loading and error handling.
 * @param userId - The user ID to fetch
 * @returns Object with data, loading, error, and refetch function
 */
export function useUser(userId: number) {
  // Implementation
}
```

**Explain "why", not "what":**

```tsx
// Good: Explains reasoning
// Use ref to avoid stale closure in async callback
const mountedRef = useRef(true);

// Avoid: States the obvious
// Set loading to true
setLoading(true);
```

**Remove commented-out code** - Use git history instead.

## Folder Organization

**Keep related files together:**

```
components/
  Button/
    Button.tsx
    Button.test.tsx
    index.ts
```

**Or flat structure for simple components:**

```
components/
  Button.tsx
  Card.tsx
  LoadingScreen.tsx
```

**Group by feature when appropriate:**

```
features/
  auth/
    LoginScreen.tsx
    authService.ts
    types.ts
  todos/
    TodosScreen.tsx
    todosApi.ts
    types.ts
```

**Current structure (starter template):**

- `app/` - Screens (Expo Router)
- `components/` - Reusable UI components
- `hooks/` - Custom React hooks
- `services/` - API and storage
- `types/` - TypeScript definitions
- `constants/` - App constants

## Component Patterns

**Use functional components with hooks:**

```tsx
// Good
export function UserCard({ user }: { user: User }) {
  return <Text>{user.name}</Text>;
}

// Avoid class components
```

**Extract complex logic to custom hooks:**

```tsx
// Good
function UserScreen({ userId }: { userId: number }) {
  const { data, loading } = useUser(userId);
  // Render
}

// Avoid: Complex logic in component
function UserScreen({ userId }: { userId: number }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // 50 lines of fetch logic...
}
```

## Styling

**Use StyleSheet.create for performance:**

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
```

**Use theme colors from React Native Paper:**

```tsx
import { useTheme } from 'react-native-paper';

const theme = useTheme();
<View style={{ backgroundColor: theme.colors.background }} />;
```

**Avoid inline styles for complex objects** - Use StyleSheet.

## Error Handling

**Always handle async errors:**

```tsx
// Good
try {
  const data = await api.getData();
} catch (error) {
  console.error('Failed to fetch:', error);
  // Show user-friendly error
}

// Avoid
const data = await api.getData(); // Unhandled promise rejection
```

**Use error boundaries for component errors:**

```tsx
<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>
```

## Testing

**Name test files:** `ComponentName.test.tsx` or `ComponentName.spec.tsx`

**Use descriptive test names:**

```tsx
describe('useFetch', () => {
  it('should return loading state initially', () => {
    // Test
  });
});
```

## Git Commit Messages

**Format:** `type: description`

**Types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Tests
- `chore:` - Maintenance

**Example:** `feat: add user profile screen`

## Summary

- **Files:** PascalCase for components, camelCase for utilities
- **Imports:** React → Libraries → Local → Types
- **Components:** Imports → Types → Component → Styles
- **TypeScript:** Type everything, prefer interfaces for objects
- **Comments:** Document public APIs, explain "why"
- **Organization:** Group by feature or keep flat
- **Patterns:** Functional components, extract logic to hooks
- **Styling:** StyleSheet.create, use theme colors
- **Errors:** Always handle async errors

Follow these conventions for consistency and maintainability.

## See Also

- [Getting Started](getting-started.md) - Project setup
- [How-To Guides](how-to.md) - Common tasks
- [React Native Paper Docs](https://callstack.github.io/react-native-paper/) - Component library
