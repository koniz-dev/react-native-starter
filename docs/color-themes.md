# Color Themes

The starter has one theme system: React Native Paper's Material Design 3
theme, defined in [`constants/Theme.ts`](../constants/Theme.ts). The app
follows the system light/dark setting.

## How it fits together

- `palette` in `constants/Theme.ts` holds the brand colors for light and dark
  mode (primary, containers, background, surface, text). `lightTheme` and
  `darkTheme` merge them over Paper's `MD3LightTheme` / `MD3DarkTheme`.
- `app/_layout.tsx` reads `useColorScheme()`, picks the theme with
  `getTheme(scheme)`, and passes it to `PaperProvider`.
- React Navigation draws screen backgrounds, headers, and the tab bar itself,
  so `getNavigationTheme(theme)` derives a navigation theme (`background`,
  `card`, `text`, `border`, `primary`) from the Paper theme for expo-router's
  `ThemeProvider`.
- `getTabBarColors(theme)` gives the tab bar its background and border
  (`surface` / `outlineVariant`) and tints (`primary` for the active tab,
  `onSurfaceVariant` for the others); `app/(tabs)/_layout.tsx` applies them.
- The status bar icons follow the theme (`StatusBar style` in
  `app/_layout.tsx`).

## Using theme colors

Read colors from Paper's theme, not from hard-coded values:

```tsx
import { useTheme } from 'react-native-paper';

export default function MyComponent() {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.surface }}>
      <Text style={{ color: theme.colors.onSurface }}>Hello</Text>
    </View>
  );
}
```

Paper components (`Text`, `Button`, `Card`, ...) already use the theme. ESLint
`react-native/no-color-literals` rejects color literals in styles.

## Rebranding

Edit `palette` in `constants/Theme.ts`. Keep each `on*` color readable on its
pair: `__tests__/constants/theme.test.ts` checks WCAG AA contrast (4.5:1) for
the brand pairs and for `primary` on the background in both modes. Material's
[theme builder](https://material-foundation.github.io/material-theme-builder/)
can generate a full set of MD3 roles from one brand color.

## Manual theme switching

The starter follows the system setting. To let users choose, keep their
choice in state (and storage), and pass it to `getTheme` instead of the
system scheme in `app/_layout.tsx`:

```tsx
const systemScheme = useColorScheme();
const [preference, setPreference] = useState<'system' | 'light' | 'dark'>(
  'system'
);
const scheme = preference === 'system' ? systemScheme : preference;
const theme = getTheme(scheme === 'dark' ? 'dark' : 'light');
```

## App configuration

`app.config.ts` sets `userInterfaceStyle: 'automatic'` so the native system
UI follows the device setting. Use `'light'` or `'dark'` to force one mode.

## References

- [React Native Paper: Theming](https://callstack.github.io/react-native-paper/docs/guides/theming)
- [Expo: Color Themes](https://docs.expo.dev/develop/user-interface/color-themes/)
- [React Native: useColorScheme](https://reactnative.dev/docs/usecolorscheme)
