# Testing Guide

Learn how to write and run unit tests for your React Native Expo app using Jest and React Native Testing Library.

## Overview

This project uses [Jest](https://jestjs.io/) as the testing framework and [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) for testing React Native components. The setup follows [Expo's official testing documentation](https://docs.expo.dev/develop/unit-testing/).

## Quick Start

### Running Tests

```bash
# Run tests in watch mode (recommended for development)
npm run test

# Run tests once (for CI/CD)
npm run test:ci

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are organized in the `__tests__` directory, mirroring the source code structure:

```
__tests__/
├── utils/
│   └── sum.test.ts              # Utility function tests
└── components/
    ├── LoadingScreen.test.tsx   # Reusable component tests (from components/)
    └── HomeScreen.test.tsx      # Screen tests (from app/)
```

**Organization:**

- `__tests__/utils/` - Tests for pure utility functions
- `__tests__/components/` - Tests for all React components, including:
  - Reusable components from `components/` directory
  - Screen components from `app/` directory (Expo Router routes)

This structure keeps tests organized while maintaining simplicity.

## Writing Tests

### Utility Function Tests

Test pure functions and utilities without React components:

```typescript
// __tests__/utils/sum.test.ts
import { sum } from '@/utils/sum';

describe('sum utility function', () => {
  test('adds two positive numbers correctly', () => {
    expect(sum(2, 3)).toBe(5);
  });

  test('adds negative numbers correctly', () => {
    expect(sum(-1, -2)).toBe(-3);
  });

  test('adds positive and negative numbers correctly', () => {
    expect(sum(5, -3)).toBe(2);
  });

  test('handles zero correctly', () => {
    expect(sum(0, 0)).toBe(0);
    expect(sum(5, 0)).toBe(5);
  });
});
```

### Component Tests

Test React Native components with React Native Testing Library. Components using `react-native-paper` need to be wrapped with `PaperProvider`:

```typescript
// __tests__/components/LoadingScreen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { LoadingScreen } from '@/components/LoadingScreen';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider theme={MD3LightTheme}>{children}</PaperProvider>
);

describe('<LoadingScreen />', () => {
  test('renders without crashing', () => {
    const { toJSON } = render(<LoadingScreen />, { wrapper: TestWrapper });
    expect(toJSON()).toBeTruthy();
  });

  test('displays message when provided', () => {
    const message = 'Loading data...';
    const { getByText } = render(
      <LoadingScreen message={message} />,
      { wrapper: TestWrapper }
    );
    getByText(message);
  });

  test('does not display message when not provided', () => {
    const { queryByText } = render(<LoadingScreen />, { wrapper: TestWrapper });
    expect(queryByText(/loading/i)).toBeNull();
  });
});
```

### Screen Tests

For screens from the `app/` directory that use `SafeAreaView` or other context providers, wrap them with both `SafeAreaProvider` and `PaperProvider`:

```typescript
// __tests__/components/HomeScreen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import HomeScreen from '@/app/(tabs)/index';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <PaperProvider theme={MD3LightTheme}>
      {children}
    </PaperProvider>
  </SafeAreaProvider>
);

describe('<HomeScreen />', () => {
  test('renders correctly with title', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: TestWrapper });
    getByText('React Native Paper');
    getByText('Material Design 3 Components');
  });

  test('renders all text variants section', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: TestWrapper });
    getByText('Text Variants');
    getByText('Headline Small');
    getByText('Title Large');
  });

  test('renders buttons section', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: TestWrapper });
    getByText('Buttons');
    getByText('Contained');
    getByText('Outlined');
    getByText('Text');
  });
});
```

**Note:** Screens are placed in `__tests__/components/` alongside reusable component tests for consistency.

## Testing Library Queries

React Native Testing Library provides several query methods:

- `getByText` - Find element by text (throws if not found)
- `getByTestId` - Find element by testID
- `queryByText` - Find element by text (returns null if not found)
- `findByText` - Find element asynchronously
- `getAllByText` - Find all elements matching text

See the [React Native Testing Library documentation](https://callstack.github.io/react-native-testing-library/docs/api-queries) for all available queries.

## Best Practices

### 1. Test User Behavior, Not Implementation

Focus on what users see and interact with:

```typescript
// ✅ Good: Test what the user sees
test('displays error message', () => {
  const { getByText } = render(<ErrorComponent error="Something went wrong" />);
  getByText('Something went wrong');
});

// ❌ Avoid: Testing implementation details
test('has error state', () => {
  const { getByTestId } = render(<ErrorComponent />);
  expect(getByTestId('error-state')).toBeTruthy();
});
```

### 2. Use Descriptive Test Names

Make test names clear about what they're testing:

```typescript
// ✅ Good
test('displays loading message when data is fetching', () => { ... });

// ❌ Avoid
test('test loading', () => { ... });
```

### 3. Keep Tests Simple

Each test should verify one thing:

```typescript
// ✅ Good: One assertion per test
test('adds positive numbers', () => {
  expect(sum(2, 3)).toBe(5);
});

test('adds negative numbers', () => {
  expect(sum(-1, -2)).toBe(-3);
});
```

### 4. Provide Required Context

Wrap components with necessary providers based on their dependencies:

```typescript
// Components using react-native-paper need PaperProvider
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider theme={MD3LightTheme}>{children}</PaperProvider>
);

// Components using SafeAreaView need SafeAreaProvider
import { SafeAreaProvider } from 'react-native-safe-area-context';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    {children}
  </SafeAreaProvider>
);

// Components using both need both providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider initialMetrics={{...}}>
    <PaperProvider theme={MD3LightTheme}>
      {children}
    </PaperProvider>
  </SafeAreaProvider>
);
```

## Common Patterns

### Testing Async Operations

```typescript
test('loads data on mount', async () => {
  const { findByText } = render(<DataComponent />);
  await findByText('Data loaded');
});
```

### Testing User Interactions

```typescript
import { fireEvent } from '@testing-library/react-native';

test('calls onPress when button is pressed', () => {
  const onPress = jest.fn();
  const { getByText } = render(<Button onPress={onPress}>Click me</Button>);

  fireEvent.press(getByText('Click me'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

### Snapshot Testing

While snapshot tests are available, Expo recommends end-to-end tests for UI testing. See the [E2E tests guide](https://docs.expo.dev/develop/eas-workflows/e2e-tests/) for more information.

## Configuration

Jest configuration is in `package.json`:

```json
{
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg))"
    ]
  }
}
```

## Dependencies

The testing setup uses:

- `jest` - Testing framework
- `jest-expo` - Jest preset for Expo projects
- `@testing-library/react-native` - React Native component testing utilities
- `react-test-renderer` - Peer dependency (automatically managed, don't import directly)

## Resources

- [Expo: Unit Testing](https://docs.expo.dev/develop/unit-testing/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
