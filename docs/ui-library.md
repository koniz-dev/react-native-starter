# React Native Paper

This starter template includes **React Native Paper**, a Material Design 3 component library for React Native.

## Why React Native Paper?

- **Material Design 3**: Implements the latest Material Design guidelines
- **Well-maintained**: Active development and community support
- **Comprehensive**: Wide range of components (buttons, cards, inputs, dialogs, etc.)
- **TypeScript**: Full TypeScript support with excellent type definitions

## Installation

React Native Paper is already installed. If you need to reinstall:

```bash
npm install react-native-paper react-native-vector-icons
```

## Quick Start

The setup is already configured in `app/_layout.tsx`. The theme automatically follows your system's light/dark mode preference.

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

## Customization

Edit `constants/Theme.ts` to customize colors, fonts, and roundness. See `docs/react-native-paper-implementation.md` for details.

## Learn More

- **[React Native Paper Documentation](https://callstack.github.io/react-native-paper/)** - Official docs
- **[Component Examples](https://callstack.github.io/react-native-paper/docs/components/overview)** - Component gallery
- **[Theme Customization](https://callstack.github.io/react-native-paper/docs/guides/theming)** - Advanced theming guide

For implementation details, see `docs/react-native-paper-implementation.md`.

