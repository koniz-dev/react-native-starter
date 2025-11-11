# Safe Areas

Learn how to add safe areas for screen components inside your Expo project.

## Overview

Creating a safe area ensures your app screen's content is positioned correctly and doesn't get overlapped by notches, status bars, home indicators, and other interface elements.

## Installation

`react-native-safe-area-context` is already installed as a peer dependency of Expo Router. If you need to install it separately:

```bash
npx expo install react-native-safe-area-context
```

## Using SafeAreaView

The simplest way to handle safe areas is using the `SafeAreaView` component:

```tsx
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Content is in safe area.</Text>
    </SafeAreaView>
  );
}
```

`SafeAreaView` is a regular `<View>` with safe area insets applied as extra padding or margin.

## Using useSafeAreaInsets Hook

For more control, use the `useSafeAreaInsets` hook:

```tsx
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Text>Content is in safe area.</Text>
    </View>
  );
}
```

### Insets Object

The hook provides insets in the following object:

```tsx
{
  top: number,    // Top safe area inset
  right: number, // Right safe area inset
  bottom: number, // Bottom safe area inset
  left: number   // Left safe area inset
}
```

## With Expo Router

Expo Router automatically sets up `SafeAreaProvider`, so you can use `SafeAreaView` or `useSafeAreaInsets` directly in your routes.

## Without Expo Router

If you're not using Expo Router, wrap your app with `SafeAreaProvider`:

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return <SafeAreaProvider>{/* Your app content */}</SafeAreaProvider>;
}
```

## Edge-to-Edge Layout

When using edge-to-edge layout (especially on Android), safe areas become crucial:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Your content extends to edges but respects safe areas */}
    </SafeAreaView>
  );
}
```

## Web Support

For web, set up `SafeAreaProvider` as described above. If you're doing server-side rendering (SSR), see the [Web SSR section](https://github.com/th3rdwave/react-native-safe-area-context#web-ssr) in the library's documentation.

## Best Practices

1. **Always Use Safe Areas**: Especially important on devices with notches
2. **Test on Multiple Devices**: Safe areas vary by device
3. **Combine with Edge-to-Edge**: Use safe areas when enabling edge-to-edge layout
4. **Consider Orientation**: Safe areas change when device rotates

## References

- [Expo: Safe Areas](https://docs.expo.dev/develop/user-interface/safe-areas/)
- [react-native-safe-area-context Documentation](https://github.com/th3rdwave/react-native-safe-area-context)
- [React Navigation: Safe Areas](https://reactnavigation.org/docs/handling-safe-area/)
