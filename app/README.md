# App Directory

This directory contains your app's navigation using Expo Router's file-based routing system.

## About Expo Router

Expo Router is the recommended navigation solution for Expo projects. It's built on top of React Navigation and provides:

- File-based routing that turns files into routes
- Type-safe routes with automatic TypeScript support
- Automatic deep linking configuration
- Lazy bundling in development
- Static rendering for web
- Full access to React Navigation APIs when needed

> **Note:** React Native doesn't include built-in navigation. Expo Router is built on top of React Navigation, so you get all the power of React Navigation with the convenience of file-based routing.

## File-Based Routing

The file structure of the `app` directory determines your app's navigation:

- **Files** become routes
- **Folders** create URL segments
- **Special files**:
  - `_layout.tsx` - Layout component for a route segment
  - `index.tsx` - Default route for a folder
  - `(group)` - Route groups (folders wrapped in parentheses don't create URL segments)

## Getting Started

1. Create your first route by adding `app/index.tsx`:

```tsx
import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View>
      <Text>Welcome!</Text>
    </View>
  );
}
```

2. Create a root layout in `app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
```

## Examples

### Simple Stack Navigation

```
app/
  _layout.tsx      # Root layout
  index.tsx        # Home screen (/)
  about.tsx        # About screen (/about)
  profile/
    index.tsx      # Profile screen (/profile)
    settings.tsx   # Settings screen (/profile/settings)
```

### Tab Navigation

```
app/
  _layout.tsx      # Root layout
  (tabs)/
    _layout.tsx    # Tab navigator layout
    index.tsx      # Home tab
    explore.tsx    # Explore tab
    profile.tsx    # Profile tab
```

## Learn More

- [Expo Router Introduction](https://docs.expo.dev/router/introduction/)
- [Create Pages - File-based Routing](https://docs.expo.dev/router/create-pages/)

