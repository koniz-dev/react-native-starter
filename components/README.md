# Components

This directory contains reusable React Native components.

## Quick Start

### ThemedText

A text component that automatically adapts to light and dark color schemes.

**Create `components/ThemedText.tsx`:**

```tsx
import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
```

### ThemedView

A view component that automatically adapts to light and dark color schemes.

**Create `components/ThemedView.tsx`:**

```tsx
import { View, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background'
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
```

## Usage

```tsx
import { ThemedText, ThemedView } from '@/components/ThemedText';

export default function MyScreen() {
  return (
    <ThemedView>
      <ThemedText type="title">Welcome!</ThemedText>
      <ThemedText>This text adapts to light/dark mode</ThemedText>
    </ThemedView>
  );
}
```

## Error and Loading Components

### ErrorBoundary

A React Error Boundary component that catches JavaScript errors in child components and displays a fallback UI.

**Usage:**

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>;
```

See [Error and Loading Guide](../docs/error-and-loading.md#errorboundary) for complete documentation.

### LoadingScreen

A simple, reusable loading component with centered activity indicator and optional message.

**Usage:**

```tsx
import { LoadingScreen } from '@/components/LoadingScreen';

<LoadingScreen message="Loading data..." />;
```

See [Error and Loading Guide](../docs/error-and-loading.md#loadingscreen) for complete documentation.
