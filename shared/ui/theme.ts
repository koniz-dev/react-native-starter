/**
 * The app's single theme: React Native Paper's Material Design 3 theme with
 * the starter's brand colors. Paper components, the navigation theme, and the
 * tab bar all read from it; there is no second color system.
 *
 * To rebrand, change `palette` below (keep each `on*` color readable on its
 * pair; the theme tests check contrast). Fonts: see docs/ui-and-theming.md#fonts.
 */
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

/** Brand colors per mode, merged over Paper's MD3 baseline. */
const palette = {
  light: {
    primary: '#0a7ea4',
    onPrimary: '#ffffff',
    primaryContainer: '#c2e8ff',
    onPrimaryContainer: '#001e2c',
    secondaryContainer: '#cfe6f1',
    onSecondaryContainer: '#081e27',
    // Action color on inverse surfaces (e.g. the snackbar's button).
    inversePrimary: '#78d1f5',
    background: '#ffffff',
    surface: '#ffffff',
    onBackground: '#11181c',
    onSurface: '#11181c',
  },
  dark: {
    primary: '#78d1f5',
    onPrimary: '#003549',
    primaryContainer: '#004c69',
    onPrimaryContainer: '#c2e8ff',
    secondaryContainer: '#344a53',
    onSecondaryContainer: '#cfe6f1',
    inversePrimary: '#00668a',
    background: '#151718',
    surface: '#151718',
    onBackground: '#ecedee',
    onSurface: '#ecedee',
  },
} as const;

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, ...palette.light },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: { ...MD3DarkTheme.colors, ...palette.dark },
};

/** The Paper theme for a color scheme (light when the scheme is unknown). */
export function getTheme(colorScheme: 'light' | 'dark' | null): MD3Theme {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

/**
 * React Navigation theme derived from a Paper theme, so navigator chrome
 * (screen backgrounds, headers, the tab bar) follows the same light/dark
 * palette as Paper components.
 */
export function getNavigationTheme(theme: MD3Theme): Theme {
  const base = theme.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.dark,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
      notification: theme.colors.error,
    },
  };
}

/** Tab bar colors for a Paper theme. */
export function getTabBarColors(theme: MD3Theme) {
  return {
    background: theme.colors.surface,
    border: theme.colors.outlineVariant,
    active: theme.colors.primary,
    inactive: theme.colors.onSurfaceVariant,
  };
}
