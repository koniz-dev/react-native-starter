# System Bars

Learn how to handle and customize system bars (status bar and navigation bar) for safe areas and edge-to-edge layout in your Expo project.

## Overview

System bars include the status bar (top) and navigation bar (bottom on Android). Customizing these bars is important for creating a polished app experience, especially with edge-to-edge layouts.

## Status Bar

The status bar displays system information like time, battery, and network status.

### Installation

```bash
npx expo install expo-status-bar
```

### Basic Usage

```tsx
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      {/* Your app content */}
    </>
  );
}
```

### Status Bar Styles

- `auto` - Automatically chooses light or dark based on system theme
- `light` - Light content (for dark backgrounds)
- `dark` - Dark content (for light backgrounds)

### Platform-Specific Configuration

You can configure the status bar in `app.json`:

```json
{
  "expo": {
    "android": {
      "statusBar": {
        "barStyle": "dark-content",
        "backgroundColor": "#ffffff"
      }
    },
    "ios": {
      "statusBar": {
        "barStyle": "dark-content"
      }
    }
  }
}
```

## Navigation Bar (Android Only)

The navigation bar appears at the bottom of Android devices.

### Installation

```bash
npx expo install expo-navigation-bar
```

### Basic Usage

```tsx
import { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';

export default function App() {
  useEffect(() => {
    // Set navigation bar style
    NavigationBar.setStyle('dark');
  }, []);

  return (
    // Your app content
  );
}
```

### Navigation Bar Styles

- `light` - Light navigation bar
- `dark` - Dark navigation bar
- `auto` - Automatically chooses based on system theme

### Control Visibility

```tsx
import * as NavigationBar from 'expo-navigation-bar';

// Hide navigation bar
NavigationBar.setVisibilityAsync('hidden');

// Show navigation bar
NavigationBar.setVisibilityAsync('visible');
```

## Edge-to-Edge Layout

Edge-to-edge layout allows your app content to extend behind system bars for a modern, immersive experience.

### Enable Edge-to-Edge

In `app.json`:

```json
{
  "expo": {
    "android": {
      "edgeToEdgeEnabled": true
    }
  }
}
```

### Handle Overlaps with Safe Areas

When using edge-to-edge, use `react-native-safe-area-context` to handle overlaps:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return <SafeAreaView style={{ flex: 1 }}>{/* Your content */}</SafeAreaView>;
}
```

### Important Notes

With edge-to-edge enabled on Android:

- Features from `expo-navigation-bar` that depend on an opaque navigation bar are unavailable
- Only style and visibility can be customized
- Other properties will no-op and warn

## Best Practices

1. **Use Safe Areas**: Always use `SafeAreaView` or `useSafeAreaInsets` when using edge-to-edge
2. **Test on Multiple Devices**: System bars behave differently on various devices
3. **Consider Dark Mode**: Use `auto` style to adapt to system theme
4. **Platform Differences**: iOS and Android handle system bars differently

## References

- [Expo: System Bars](https://docs.expo.dev/develop/user-interface/system-bars/)
- [expo-status-bar Documentation](https://docs.expo.dev/versions/latest/sdk/status-bar/)
- [expo-navigation-bar Documentation](https://docs.expo.dev/versions/latest/sdk/navigation-bar/)
- [Safe Areas Guide](safe-areas.md)
