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
- **Automatic light/dark mode** support (follows system preference)
- **Example components** in `app/(tabs)/index.tsx`

## Quick Start

The setup is already configured. The theme automatically follows your system's light/dark mode preference.

### Using Components

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

Edit `constants/Theme.ts` to customize:

### Colors

```tsx
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0a7ea4', // Your primary color
    background: '#fff', // Background color
    // Add more custom colors
  },
};
```

### Roundness & Fonts

```tsx
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 8, // Adjust border radius (default is 4)
  fonts: configureFonts({ config: fontConfig }),
};
```

## Adding More Components

Import and use components directly:

```tsx
import { TextInput, Switch } from 'react-native-paper';

<TextInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  mode="outlined"
/>;
```

See the [React Native Paper documentation](https://callstack.github.io/react-native-paper/docs/components/overview) for all available components.

## Removing React Native Paper

If you want to use a different UI library:

1. Remove the dependency:

   ```bash
   npm uninstall react-native-paper react-native-vector-icons
   ```

2. Remove `PaperProvider` from `app/_layout.tsx`

3. Replace Paper components with your preferred library

4. Optionally remove `constants/Theme.ts` if not needed

## Learn More

- **[React Native Paper Documentation](https://callstack.github.io/react-native-paper/)** - Official docs
- **[Component Examples](https://callstack.github.io/react-native-paper/docs/components/overview)** - Component gallery
- **[Theme Customization](https://callstack.github.io/react-native-paper/docs/guides/theming)** - Advanced theming guide
- **[Material Design 3 Guidelines](https://m3.material.io/)** - Material Design guidelines
