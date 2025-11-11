# Hooks

This directory contains React Hooks that allow sharing common behavior between components.

## Quick Start

### useThemeColor

A hook that returns a color based on the current theme (light or dark mode).

**Create `hooks/useThemeColor.ts`:**

```tsx
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

## Usage

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

### Custom Colors

You can also provide custom colors for light and dark modes:

```tsx
const customColor = useThemeColor(
  { light: '#000000', dark: '#ffffff' },
  'text'
);
```
