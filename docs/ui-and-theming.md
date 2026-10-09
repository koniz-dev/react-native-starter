# UI and Theming

The UI is built with [React Native Paper](https://callstack.github.io/react-native-paper/)
(Material Design 3). There is one theme system: Paper's theme, defined in
`shared/ui/theme.ts`, and the app follows the system light/dark setting.

## How it fits together

- `palette` in `shared/ui/theme.ts` holds the brand colors for light and dark
  mode (primary and containers, inverse primary, background, surface, text);
  `lightTheme` and `darkTheme` merge it over Paper's MD3 themes.
- `app/_layout.tsx` reads `useColorScheme()`, picks the theme with
  `getTheme(scheme)`, and passes it to `PaperProvider`.
- React Navigation draws screen backgrounds, headers, and the tab bar itself,
  so `getNavigationTheme(theme)` derives its theme from the Paper theme, and
  `getTabBarColors(theme)` gives the tab bar `surface` / `outlineVariant` and
  `primary` / `onSurfaceVariant` tints.
- The status bar icons follow the theme: `app/_layout.tsx` renders
  `<StatusBar style={theme.dark ? 'light' : 'dark'} />`. `expo-system-ui`
  applies `userInterfaceStyle: 'automatic'` from `app.config.ts` in native
  builds. Expo Go manages the status bar itself, so check contrast in a
  native build too.
- The error fallback renders inside `PaperProvider`, so it is themed as well.

## Using the theme

Use Paper components, and read colors from the theme instead of literals
(ESLint `react-native/no-color-literals` rejects color literals in styles):

```tsx
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

export function Banner({ onDismiss }: { onDismiss: () => void }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: theme.colors.primaryContainer },
      ]}
    >
      <Text style={{ color: theme.colors.onPrimaryContainer }}>Saved</Text>
      <Button onPress={onDismiss}>Dismiss</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 16, borderRadius: 8 },
});
```

The Component showcase (`features/demo-showcase/screens/ShowcaseScreen.tsx`,
opened from Home) shows text variants, buttons, cards, surfaces, and the
snackbar under the app theme. Paper's component docs:
[callstack.github.io/react-native-paper](https://callstack.github.io/react-native-paper/docs/components/ActivityIndicator).

## Rebranding

Edit `palette` in `shared/ui/theme.ts`. Keep each `on*` color readable on its
pair: `__tests__/shared/ui/theme.test.ts` checks WCAG AA contrast (4.5:1) for
the brand pairs, `primary` on the background, and `inversePrimary` on the
inverse surface, in both modes. Cards and surfaces keep MD3's neutral
elevation tints; the
[Material theme builder](https://material-foundation.github.io/material-theme-builder/)
can generate a full set of MD3 roles from one brand color.

To let users choose light or dark instead of following the system, keep
their choice in state (and storage) and pass it to `getTheme`:

```tsx
import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme } from '@/shared/ui/theme';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<'system' | 'light' | 'dark'>(
    'system'
  );
  const scheme = preference === 'system' ? systemScheme : preference;
  return {
    theme: getTheme(scheme === 'dark' ? 'dark' : 'light'),
    setPreference,
  };
}
```

## Fonts

The starter uses the platform's system fonts. To use your own, add the font
files to the project (for example in a new assets/fonts folder), load them before rendering, and give Paper the
family:

```tsx
import { useFonts } from 'expo-font';
import {
  configureFonts,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';

// In app/_layout.tsx, before rendering (keep the splash screen up until loaded):
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Inter: require('../assets/fonts/Inter-Regular.ttf'),
  });
  return loaded;
}

// In shared/ui/theme.ts, for both themes:
export const lightThemeWithInter: MD3Theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: { fontFamily: 'Inter' } }),
};
```

See [Expo: fonts](https://docs.expo.dev/develop/user-interface/fonts/).

## Safe areas

Screens wrap their content in `SafeAreaView` from
`react-native-safe-area-context`. A screen under a navigation header excludes
the top edge (`edges={['bottom', 'left', 'right']}`), as the showcase does.
See [Expo: safe areas](https://docs.expo.dev/develop/user-interface/safe-areas/).

## Checking dark mode

- iOS Simulator: `xcrun simctl ui booted appearance dark`.
- Android emulator: `adb shell cmd uimode night yes`.
- Jest: `setColorScheme('dark')` from `@/testing` ([Testing](testing.md)).

## More

- [Expo: color themes](https://docs.expo.dev/develop/user-interface/color-themes/)
- [Expo: system bars](https://docs.expo.dev/develop/user-interface/system-bars/)
- [Expo: animation](https://docs.expo.dev/develop/user-interface/animation/)
  (`react-native-reanimated` is installed)
- [Expo: assets](https://docs.expo.dev/develop/user-interface/assets/)
