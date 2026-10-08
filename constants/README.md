# Constants

## Theme.ts

The app's only theme: React Native Paper's Material Design 3 theme with the
starter's brand colors (`palette`), plus helpers that derive the navigation
theme (`getNavigationTheme`) and tab bar colors (`getTabBarColors`) from it.

```tsx
import { useTheme } from 'react-native-paper';

export default function MyComponent() {
  const theme = useTheme();
  return <Text style={{ color: theme.colors.primary }}>Hello</Text>;
}
```

To rebrand, edit `palette` in `Theme.ts`; `__tests__/constants/theme.test.ts`
checks that text colors keep WCAG AA contrast. See
[Color Themes](../docs/color-themes.md).
