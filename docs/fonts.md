# Fonts

Learn how to add custom fonts to your Expo project.

## Overview

Custom fonts can enhance your app's branding and readability. Expo supports both system fonts and custom fonts.

## Using System Fonts

React Native provides access to system fonts on both iOS and Android. You can use them directly:

```tsx
import { Text, StyleSheet } from 'react-native';

export default function App() {
  return <Text style={styles.text}>Hello World</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'System', // iOS
    // or
    fontFamily: 'Roboto', // Android default
  },
});
```

## Adding Custom Fonts

### Step 1: Add Font Files

1. Create a `assets/fonts/` directory
2. Add your font files (`.ttf`, `.otf`, `.woff`, `.woff2`)
3. Common formats: `.ttf` (TrueType) and `.otf` (OpenType)

### Step 2: Load Fonts

Expo automatically loads fonts from the `assets/fonts/` directory. However, you may need to explicitly load them:

```tsx
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    // Your app content
  );
}
```

### Step 3: Use Custom Fonts

```tsx
import { Text, StyleSheet } from 'react-native';

export default function App() {
  return <Text style={styles.text}>Hello World</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
});
```

## Font Loading with Expo Router

If you're using Expo Router, load fonts in your root layout:

```tsx
// app/_layout.tsx
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return <Stack />;
}
```

## Installation

```bash
npx expo install expo-font expo-splash-screen
```

## Best Practices

1. **Font Formats**: Use `.ttf` or `.otf` for best compatibility
2. **Font Weights**: Include multiple weights (Regular, Bold, SemiBold, etc.)
3. **Font Loading**: Always check if fonts are loaded before rendering
4. **Performance**: Only load fonts you actually use
5. **File Size**: Optimize font files to reduce app size

## Common Font Sources

- [Google Fonts](https://fonts.google.com/)
- [Font Squirrel](https://www.fontsquirrel.com/)
- [Adobe Fonts](https://fonts.adobe.com/)

## References

- [Expo: Fonts](https://docs.expo.dev/develop/user-interface/fonts/)
- [expo-font Documentation](https://docs.expo.dev/versions/latest/sdk/font/)
- [React Native: Text Component](https://reactnative.dev/docs/text)
