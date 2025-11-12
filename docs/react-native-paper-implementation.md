# React Native Paper Integration

## Overview

This starter uses React Native Paper for Material Design 3 components. The theme automatically follows the system light/dark mode preference.

## What's Included

- **PaperProvider** configured in `app/_layout.tsx`
- **Theme system** in `constants/Theme.ts` connected to `Colors.ts`
- **Automatic light/dark mode** support via system preference
- **Example components** in `app/(tabs)/index.tsx`

## Basic Usage

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
    </View>
  );
}
```

Access the theme using the `useTheme()` hook:

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

## Theme Customization

Edit `constants/Theme.ts` to customize:

**Colors:**
```tsx
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0a7ea4',        // Your primary color
    background: '#fff',        // Background color
    // Add more custom colors
  },
};
```

**Roundness:**
```tsx
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 8, // Adjust border radius (default is 4)
};
```

**Fonts:**
```tsx
const fontConfig = {
  // Customize font families
  // See: https://callstack.github.io/react-native-paper/docs/guides/theming#customizing-fonts
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
/>
```

See the [React Native Paper documentation](https://callstack.github.io/react-native-paper/docs/components/overview) for all available components.

## Learn More

- [React Native Paper Documentation](https://callstack.github.io/react-native-paper/)
- [Material Design 3 Guidelines](https://m3.material.io/)
- [Theme Customization Guide](https://callstack.github.io/react-native-paper/docs/guides/theming)

