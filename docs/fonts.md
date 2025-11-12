# Custom Fonts

## System Fonts (Default - Recommended)

React Native Paper uses **system fonts by default**, which provides a native look and feel:

- **iOS**: SF Pro Display / SF Pro Text

- **Android**: Roboto

- **Web**: System UI fonts

**This is the recommended approach for most apps** - no additional setup needed, excellent performance, and native appearance.

## Adding Custom Fonts (Optional)

If your brand requires specific fonts, follow these steps:

### Step 1: Add Font Files

Place your font files in `assets/fonts/`:

```
assets/
└── fonts/
    ├── Inter-Regular.ttf
    ├── Inter-Bold.ttf
    ├── Inter-SemiBold.ttf
    └── ...
```

### Step 2: Load Fonts in Root Layout

Update `app/_layout.tsx`:

```tsx
import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { getTheme } from '@/constants/Theme';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
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
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
```

### Step 3: Configure Paper Theme

Edit `constants/Theme.ts` to use your custom fonts:

```tsx
const fontConfig = {
  displayLarge: {
    fontFamily: 'Inter-Bold',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'Inter-Bold',
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  headlineLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 32,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  titleLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  bodyLarge: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    // ... existing colors
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 4,
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    // ... existing colors
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 4,
};
```

## Using Google Fonts

For Google Fonts, use the `@expo-google-fonts` package:

```bash
npx expo install expo-font @expo-google-fonts/inter
```

Then load in `app/_layout.tsx`:

```tsx
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // ... rest of the code
}
```

Reference in `constants/Theme.ts`:

```tsx
const fontConfig = {
  bodyMedium: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    fontWeight: '400' as const,
  },
  headlineMedium: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    fontWeight: '400' as const,
  },
  // ... other variants
};
```

## Popular Font Choices

- **[Inter](https://rsms.me/inter/)**: Modern, clean, excellent for UI text

- **[Roboto](https://fonts.google.com/specimen/Roboto)**: Material Design standard

- **[Poppins](https://fonts.google.com/specimen/Poppins)**: Friendly, geometric

- **[Montserrat](https://fonts.google.com/specimen/Montserrat)**: Bold, attention-grabbing

- **[Open Sans](https://fonts.google.com/specimen/Open+Sans)**: Neutral, highly readable

## Material Design Typography Scale

React Native Paper follows Material Design 3 typography scale:

| Variant          | Default Size | Usage                        |
| ---------------- | ------------ | ---------------------------- |
| `displayLarge`   | 57px         | Large, short, important text |
| `displayMedium`  | 45px         | High-emphasis text           |
| `headlineLarge`  | 32px         | High-emphasis headlines      |
| `headlineMedium` | 28px         | Medium-emphasis headlines    |
| `titleLarge`     | 22px         | Medium-emphasis titles       |
| `bodyLarge`      | 16px         | Longer text passages         |
| `bodyMedium`     | 14px         | Default body text            |
| `labelLarge`     | 14px         | Button text, labels          |

## Troubleshooting

**Fonts not loading:**

- Verify font file paths are correct

- Check font files are in `assets/fonts/` directory

- Ensure `useFonts()` is in root layout

- Wait for `fontsLoaded` before rendering

**Fonts look different on platforms:**

- Use same font files across platforms

- Avoid platform-specific font names

- Test on both iOS and Android

**Performance issues:**

- Only load font weights you actually use

- Avoid loading too many font families

- Consider system fonts for better performance

## Learn More

- **[Expo Custom Fonts Guide](https://docs.expo.dev/guides/using-custom-fonts/)** - Official Expo documentation

- **[React Native Paper Fonts](https://callstack.github.io/react-native-paper/docs/guides/fonts)** - Paper theming guide

- **[Material Design Typography](https://m3.material.io/styles/typography/overview)** - Design system guidelines

- **[@expo-google-fonts](https://github.com/expo/google-fonts)** - Google Fonts for Expo

- **[Google Fonts](https://fonts.google.com/)** - Free font library
