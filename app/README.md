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

### Nested Routing with Route Groups

Route groups (folders wrapped in parentheses) allow you to organize routes without affecting the URL structure. This is useful for separating authentication and main app flows:

```
app/
  _layout.tsx           # Root layout
  (auth)/
    _layout.tsx         # Auth stack layout
    login.tsx           # Login screen (/login)
    register.tsx        # Register screen (/register)
  (main)/
    _layout.tsx         # Main app layout
    home.tsx            # Home screen (/home)
    profile.tsx         # Profile screen (/profile)
```

**Example: Auth Layout (`app/(auth)/_layout.tsx`)**

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
```

**Example: Main Layout (`app/(main)/_layout.tsx`)**

```tsx
import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
```

### Dynamic Routes with Parameters

Use square brackets `[param]` to create dynamic routes that accept parameters:

```
app/
  _layout.tsx
  (main)/
    _layout.tsx
    product/
      [id].tsx         # Product detail (/product/123)
      [id]/
        reviews.tsx    # Product reviews (/product/123/reviews)
```

**Example: Dynamic Route (`app/(main)/product/[id].tsx`)**

```tsx
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();

  return (
    <View>
      <Text>Product ID: {id}</Text>
    </View>
  );
}
```

**Example: Nested Dynamic Route (`app/(main)/product/[id]/reviews.tsx`)**

```tsx
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ProductReviews() {
  const { id } = useLocalSearchParams();

  return (
    <View>
      <Text>Reviews for Product {id}</Text>
    </View>
  );
}
```

### Tab + Stack Navigation Combination

Combine bottom tabs with stack navigation for a complete navigation structure. Tabs contain stacks, allowing nested navigation within each tab:

```
app/
  _layout.tsx                    # Root layout
  (tabs)/
    _layout.tsx                  # Tab navigator (bottom tabs)
    index.tsx                    # Home tab (/)
    explore.tsx                  # Explore tab (/explore)
    profile/
      _layout.tsx                # Stack navigator for profile tab
      index.tsx                  # Profile screen (/profile)
      settings.tsx               # Settings screen (/profile/settings)
      edit.tsx                   # Edit profile (/profile/edit)
    shop/
      _layout.tsx                # Stack navigator for shop tab
      index.tsx                  # Shop screen (/shop)
      product/
        [id].tsx                 # Product detail (/shop/product/123)
```

**Example: Root Layout (`app/_layout.tsx`)**

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Example: Tab Layout (`app/(tabs)/_layout.tsx`)**

```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Example: Profile Stack Layout (`app/(tabs)/profile/_layout.tsx`)**

```tsx
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: 'Profile',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'My Profile',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Profile',
        }}
      />
    </Stack>
  );
}
```

**Example: Shop Stack Layout (`app/(tabs)/shop/_layout.tsx`)**

```tsx
import { Stack } from 'expo-router';

export default function ShopLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: 'Shop',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Products',
        }}
      />
      <Stack.Screen
        name="product/[id]"
        options={{
          title: 'Product Details',
        }}
      />
    </Stack>
  );
}
```

**Navigation Example: Navigating from Tab to Stack Screen**

```tsx
import { View, Button } from 'react-native';
import { router } from 'expo-router';

export default function ProfileScreen() {
  return (
    <View>
      <Button
        title="Go to Settings"
        onPress={() => router.push('/profile/settings')}
      />
      <Button
        title="Edit Profile"
        onPress={() => router.push('/profile/edit')}
      />
    </View>
  );
}
```

## Learn More

- [Expo Router Introduction](https://docs.expo.dev/router/introduction/)
- [Create Pages - File-based Routing](https://docs.expo.dev/router/create-pages/)
