# Hooks

This directory contains React Hooks that allow sharing common behavior between components.

## Quick Start

### useThemeColor

A hook that returns a color based on the current theme (light or dark mode).

Shipped as [`useThemeColor.ts`](useThemeColor.ts).

```tsx
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
```

## Usage

```tsx
import { useThemeColor } from '@/hooks/useThemeColor';

export default function MyComponent() {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={{ backgroundColor }}>
      <Text style={{ color: textColor }}>Hello</Text>
    </View>
  );
}
```

### Custom Colors

You can also provide custom colors for light and dark modes:

```tsx
const customColor = useThemeColor(
  { light: '#000000', dark: '#ffffff' },
  'text'
);
```

## Session Hook

### useAuthSession

Shipped as [`useAuthSession.ts`](useAuthSession.ts). Reads the authentication session
through `authService`: `status` is `'loading'`, `'signedIn'` (token present in secure
storage; `user` is the stored profile, or `null` if none), or `'signedOut'`. A storage
failure counts as signed out. `logout()` calls `authService.logout()` and re-reads the
session. The hook reads once on mount; call `refresh()` from `useFocusEffect` so a screen
updates after the user signs in elsewhere (see `app/(tabs)/index.tsx`).

## Data Fetching Hook

### useFetch

A generic hook for data fetching with automatic loading and error state management.

**Usage:**

```tsx
import { useFetch } from '@/hooks/useFetch';
import { userApi } from '@/services/api';

const { data, loading, error, refetch } = useFetch<User[]>(() =>
  userApi.getAll()
);
```

See [Error and Loading Guide](../docs/error-and-loading.md#usefetch-hook) for complete documentation and examples.
