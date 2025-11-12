# React Native Paper

This starter template includes **React Native Paper**, a Material Design 3 component library for React Native.

## Why React Native Paper?

- **Material Design 3**: Implements the latest Material Design guidelines
- **Well-maintained**: Active development and community support
- **Comprehensive**: Wide range of components (buttons, cards, inputs, dialogs, etc.)
- **TypeScript**: Full TypeScript support with excellent type definitions

## What's Included

- **PaperProvider** configured in `app/_layout.tsx`
- **Theme system** in `constants/Theme.ts` connected to `Colors.ts`
- **Automatic light/dark mode** support via system preference
- **Example components** in `app/(tabs)/index.tsx`

## Quick Start

### Using Components

Import components from `react-native-paper`:

```tsx
import { Button, Card, Text, Surface } from 'react-native-paper';

export default function MyScreen() {
  return (
    <View>
      <Text variant="headlineMedium">Hello World</Text>
      <Button mode="contained" onPress={() => console.log('Pressed')}>
        Press me
      </Button>
      <Card>
        <Card.Content>
          <Text variant="titleLarge">Card Title</Text>
          <Text variant="bodyMedium">Card content</Text>
        </Card.Content>
      </Card>
    </View>
  );
}
```

### Using the Theme

Access the theme using the `useTheme()` hook:

```tsx
import { useTheme } from 'react-native-paper';

export default function MyComponent() {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.primary }}>Themed text</Text>
    </View>
  );
}
```

## Theme Customization

Edit `constants/Theme.ts` to customize your theme:

### Colors

```tsx
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0a7ea4', // Your primary color
    background: '#fff', // Background color
    surface: '#fff', // Surface color
    // Add more custom colors as needed
  },
};
```

### Roundness

```tsx
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 8, // Adjust border radius (default is 4)
};
```

### Fonts

Customize fonts using the `configureFonts` helper:

```tsx
const fontConfig = {
  displayLarge: {
    fontFamily: 'YourCustomFont',
    fontSize: 57,
    fontWeight: '400',
  },
  // Configure other text variants...
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
};
```

See the [official theming guide](https://callstack.github.io/react-native-paper/docs/guides/theming) for more options.

## Removing React Native Paper

If you prefer a different UI library:

1. **Uninstall packages:**

```bash
   npm uninstall react-native-paper react-native-vector-icons
```

2. **Remove from `app/_layout.tsx`:**
   - Remove `PaperProvider` wrapper
   - Remove `getTheme` and theme-related imports

3. **Delete theme configuration:**

```bash
   rm constants/Theme.ts
```

4. **Update your components:**
   - Replace Paper component imports with your preferred library
   - Update the example screen in `app/(tabs)/index.tsx`

## Learn More

- **[React Native Paper Documentation](https://callstack.github.io/react-native-paper/)** - Official docs
- **[Component Examples](https://callstack.github.io/react-native-paper/docs/components/overview)** - Browse all components
- **[Theme Customization](https://callstack.github.io/react-native-paper/docs/guides/theming)** - Advanced theming guide
- **[Material Design 3](https://m3.material.io/)** - Design system guidelines
