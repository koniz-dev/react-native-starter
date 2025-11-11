# Color Themes

Learn how to implement light and dark color themes in your Expo and React Native app.

## Overview

Color themes allow your app to adapt to the user's system preferences (light or dark mode) or provide manual theme switching.

## Using System Color Scheme

React Native provides `useColorScheme` hook to detect the system color scheme:

```tsx
import { useColorScheme } from 'react-native';

export default function App() {
  const colorScheme = useColorScheme(); // 'light' | 'dark' | null
  
  return (
    <View style={{ 
      backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' 
    }}>
      {/* Your content */}
    </View>
  );
}
```

## Defining Color Constants

Create a `Colors` constant with light and dark variants:

```tsx
// constants/Colors.ts
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
```

## Using Colors with Hook

Create a custom hook to easily access theme colors:

```tsx
// hooks/useThemeColor.ts
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
```

### Usage

```tsx
import { useThemeColor } from '@/hooks/useThemeColor';

export default function MyComponent() {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  
  return (
    <View style={{ backgroundColor }}>
      <Text style={{ color: textColor }}>Hello</Text>
    </View>
  );
}
```

## Themed Components

Create reusable components that automatically adapt to themes:

```tsx
// components/ThemedText.tsx
import { Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  return <Text style={[{ color }, style]} {...rest} />;
}
```

## Manual Theme Switching

To allow users to manually switch themes, use a context:

```tsx
// contexts/ThemeContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme() ?? 'light';
  const [theme, setTheme] = useState<Theme>('auto');
  
  const actualTheme = theme === 'auto' ? systemTheme : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

## App Configuration

Configure theme in `app.json`:

```json
{
  "expo": {
    "userInterfaceStyle": "automatic"
  }
}
```

Options:
- `"automatic"` - Follows system theme
- `"light"` - Always light mode
- `"dark"` - Always dark mode

## Best Practices

1. **Define Colors Early**: Set up your color system before building components
2. **Use Semantic Names**: Name colors by purpose (text, background) not by color (black, white)
3. **Test Both Themes**: Always test your app in both light and dark modes
4. **Consider Accessibility**: Ensure sufficient contrast ratios
5. **Provide Overrides**: Allow components to override theme colors when needed

## References

- [Expo: Color Themes](https://docs.expo.dev/develop/user-interface/color-themes/)
- [React Native: useColorScheme](https://reactnative.dev/docs/usecolorscheme)
- [Material Design: Dark Theme](https://material.io/design/color/dark-theme.html)
- [Apple Human Interface Guidelines: Dark Mode](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/dark-mode/)

