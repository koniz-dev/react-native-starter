# React Native Paper

Learn how to use React Native Paper, a Material Design 3 component library for React Native.

## Overview

This starter template includes **React Native Paper**, a popular Material Design 3 component library for React Native. Paper provides:

- **Material Design 3 (MD3)** components out of the box
- **Light and dark mode** support
- **TypeScript** support
- **Accessible** components following Material Design guidelines
- **Customizable** themes and components

## Why React Native Paper?

React Native Paper was chosen for this starter because:

1. **Material Design 3**: Implements the latest Material Design guidelines
2. **Well-maintained**: Active development and community support
3. **Comprehensive**: Wide range of components (buttons, cards, inputs, dialogs, etc.)
4. **Themeable**: Easy to customize colors, fonts, and styling
5. **TypeScript**: Full TypeScript support with excellent type definitions

## Installation

React Native Paper is already installed in this project. If you need to reinstall:

```bash
npm install react-native-paper react-native-vector-icons
```

For React Native CLI projects, you may also need to link native dependencies. Expo projects handle this automatically.

## Basic Setup

The setup is already configured in `app/_layout.tsx`:

```tsx
import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { getTheme } from '@/constants/Theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <PaperProvider theme={theme}>
      {/* Your app content */}
    </PaperProvider>
  );
}
```

The `PaperProvider` wraps your app and provides the theme to all Paper components. It automatically adapts to light/dark mode based on the system preference.

## Theme Configuration

The theme is configured in `constants/Theme.ts` and connects with the existing `constants/Colors.ts`:

```tsx
import { getTheme } from '@/constants/Theme';
import { useColorScheme } from 'react-native';

const colorScheme = useColorScheme();
const theme = getTheme(colorScheme);
```

### Customizing the Theme

Edit `constants/Theme.ts` to customize:

**Colors:**
```tsx
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0a7ea4',        // Your primary color
    background: '#fff',        // Background color
    surface: '#fff',           // Surface color
    // Add more custom colors
  },
};
```

**Fonts:**
```tsx
const fontConfig = {
  // Customize font families
  // See: https://callstack.github.io/react-native-paper/docs/guides/theming#customizing-fonts
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
};
```

**Roundness:**
```tsx
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 8, // Adjust border radius (default is 4)
};
```

## Using Components

### Basic Usage

Import components from `react-native-paper`:

```tsx
import { Button, Card, Text } from 'react-native-paper';

export default function MyScreen() {
  return (
    <View>
      <Text variant="headlineMedium">Hello World</Text>
      <Button mode="contained" onPress={() => console.log('Pressed')}>
        Press me
      </Button>
    </View>
  );
}
```

### Using the Theme

Access the theme in your components:

```tsx
import { useTheme } from 'react-native-paper';

export default function MyComponent() {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.primary }}>
        Themed text
      </Text>
    </View>
  );
}
```

### Example Components

See `app/(tabs)/index.tsx` for examples of:

- **Button**: Contained, outlined, and text variants
- **Card**: With content and actions
- **Surface**: With elevation
- **Text**: Different variants (headline, title, body)
- **Custom styling**: Overriding default styles

## Available Components

React Native Paper provides many components:

- **Buttons**: Button, IconButton, FAB
- **Cards**: Card
- **Text**: Text with variants
- **Inputs**: TextInput, SearchBar
- **Navigation**: BottomNavigation, Tabs
- **Feedback**: Snackbar, Banner, Dialog
- **Layout**: Surface, Divider, List
- **And more**: Checkbox, RadioButton, Switch, Chip, Avatar, etc.

See the [official documentation](https://callstack.github.io/react-native-paper/docs/components/overview) for a complete list.

## Adding More Components

1. **Import the component:**
   ```tsx
   import { TextInput, Switch } from 'react-native-paper';
   ```

2. **Use it in your component:**
   ```tsx
   <TextInput
     label="Email"
     value={email}
     onChangeText={setEmail}
     mode="outlined"
   />
   ```

3. **Customize with theme:**
   ```tsx
   const theme = useTheme();
   <TextInput
     style={{ backgroundColor: theme.colors.surfaceVariant }}
     // ... other props
   />
   ```

## Light/Dark Mode

The theme automatically switches based on the system preference via `useColorScheme()`. The `PaperProvider` in `app/_layout.tsx` handles this automatically.

To manually control the theme, you can:

1. Create a theme context (see `docs/color-themes.md`)
2. Pass a custom theme to `PaperProvider`
3. Use the `useTheme()` hook to access theme values

## Removing React Native Paper

If you want to use a different UI library:

1. Remove the dependency:
   ```bash
   npm uninstall react-native-paper react-native-vector-icons
   ```

2. Remove `PaperProvider` from `app/_layout.tsx`

3. Replace Paper components with your preferred library

4. Optionally remove `constants/Theme.ts` if not needed

## Resources

- **[React Native Paper Documentation](https://callstack.github.io/react-native-paper/)** - Official docs
- **[Material Design 3](https://m3.material.io/)** - Material Design guidelines
- **[Component Examples](https://callstack.github.io/react-native-paper/docs/components/overview)** - Component gallery
- **[Theme Customization](https://callstack.github.io/react-native-paper/docs/guides/theming)** - Advanced theming guide
- **[GitHub Repository](https://github.com/callstack/react-native-paper)** - Source code and issues

## Best Practices

1. **Use theme colors**: Always use `theme.colors` instead of hardcoded colors
2. **Leverage variants**: Use Text variants (headline, title, body) for consistent typography
3. **Follow Material Design**: Paper components follow MD3 guidelines - use them as intended
4. **Customize thoughtfully**: Override styles only when necessary
5. **Test both themes**: Always test your app in both light and dark modes

## Troubleshooting

### Deprecation Warnings

You may see deprecation warnings in the console:

- **`props.pointerEvents is deprecated`**: This warning comes from React Native Paper's internal components (like `PaperProvider`). It's a known issue and doesn't affect functionality. It will be fixed in future library updates.

- **`"shadow*" style props are deprecated. Use "boxShadow"`**: This warning appears because React Native Paper's Button and other components use shadow props that are deprecated on web. These warnings are harmless and don't affect functionality. They'll be resolved when the library updates to use `boxShadow` for web compatibility.

These warnings are expected with the current version of React Native Paper and React Native's web support. They don't impact app functionality and can be safely ignored until the library is updated.

