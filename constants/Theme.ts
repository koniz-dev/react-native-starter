import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { Colors } from './Colors';

/**
 * React Native Paper Theme Configuration
 *
 * This file connects React Native Paper's Material Design 3 (MD3) theme
 * with the app's existing color system defined in Colors.ts.
 *
 * The theme automatically adapts to light/dark mode based on the system preference.
 *
 * Customization Examples:
 * - Colors: Modify the colors object to match your brand
 * - Fonts: Use configureFonts() to customize typography
 * - Roundness: Adjust the roundness value for border radius
 */

const fontConfig = {
  // You can customize fonts here if needed
  // See: https://callstack.github.io/react-native-paper/docs/guides/theming#customizing-fonts
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Connect with existing Colors.ts
    primary: Colors.light.tint,
    background: Colors.light.background,
    surface: Colors.light.background,
    onSurface: Colors.light.text,
    onBackground: Colors.light.text,
    // You can add more custom colors here
    // Example: error: '#B00020', success: '#4CAF50'
  },
  fonts: configureFonts({ config: fontConfig }),
  // Adjust roundness for border radius (default is 4)
  roundness: 4,
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Connect with existing Colors.ts
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    surface: Colors.dark.background,
    onSurface: Colors.dark.text,
    onBackground: Colors.dark.text,
    // You can add more custom colors here
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 4,
};

/**
 * Get theme based on color scheme
 * @param colorScheme - 'light' | 'dark' | null
 * @returns MD3Theme
 */
export function getTheme(colorScheme: 'light' | 'dark' | null): MD3Theme {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

