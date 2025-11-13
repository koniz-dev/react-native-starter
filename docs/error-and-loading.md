# Error and Loading Handling

This guide covers common patterns for handling errors and loading states in React Native apps using minimal, reusable utilities.

## Overview

This starter provides three main utilities for error and loading handling:

1. **ErrorBoundary** - Catches JavaScript errors in component trees
2. **LoadingScreen** - Simple reusable loading component
3. **useFetch** - Generic hook for data fetching with automatic loading/error states

All utilities use React Native Paper components and follow Material Design 3 patterns.

## ErrorBoundary

The `ErrorBoundary` component catches JavaScript errors anywhere in the child component tree and displays a fallback UI instead of crashing the app.

### When to Use

- Wrap top-level routes or major feature sections
- Protect critical parts of your app from unexpected errors
- Provide user-friendly error messages instead of white screens

### Basic Usage

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Custom Fallback UI

You can provide a custom fallback component:

```tsx
<ErrorBoundary
  fallback={(error, resetError) => (
    <View>
      <Text>Custom error: {error.message}</Text>
      <Button onPress={resetError}>Try Again</Button>
    </View>
  )}
>
  <YourComponent />
</ErrorBoundary>
```

### Features

- **Automatic error catching** - Catches errors in child components
- **Development logging** - Logs errors to console in development mode
- **Stack traces** - Shows stack traces in development only
- **Reset functionality** - "Try Again" button to reset error state
- **Theme support** - Uses React Native Paper theme colors

### Important Notes

- Error boundaries only catch errors in:
  - Render methods
  - Lifecycle methods
  - Constructors of components below them
- They do NOT catch errors in:
  - Event handlers (use try/catch)
  - Async code (use try/catch)
  - Errors during server-side rendering
  - Errors thrown in the error boundary itself

## LoadingScreen

A simple, reusable loading component that displays a centered activity indicator with an optional message.

### Usage

```tsx
import { LoadingScreen } from '@/components/LoadingScreen';

function MyScreen() {
  if (loading) {
    return <LoadingScreen message="Loading data..." />;
  }
  // ... rest of component
}
```

### Props

- `message?: string` - Optional message to display below the indicator

### Features

- **Centered layout** - Automatically centers content
- **Theme support** - Uses theme colors from React Native Paper
- **Minimal design** - Simple and clean

## useFetch Hook

A generic custom hook that simplifies data fetching with automatic loading and error state management.

### Basic Usage

```tsx
import { useFetch } from '@/hooks/useFetch';
import { userApi } from '@/services/api';
import { LoadingScreen } from '@/components/LoadingScreen';

function UserList() {
  const { data, loading, error, refetch } = useFetch<User[]>(
    () => userApi.getAll()
  );

  if (loading) return <LoadingScreen message="Loading users..." />;
  if (error) return <Text>Error: {error}</Text>;
  if (!data) return <Text>No data</Text>;

  return (
    <View>
      {data.map(user => (
        <Text key={user.id}>{user.name}</Text>
      ))}
      <Button onPress={refetch}>Refresh</Button>
    </View>
  );
}
```

### With Dependencies

Refetch automatically when dependencies change:

```tsx
const { data, loading, error } = useFetch<User>(
  () => userApi.getById(userId),
  [userId] // Refetch when userId changes
);
```

### Return Values

- `data: T | null` - The fetched data
- `loading: boolean` - Whether a fetch is in progress
- `error: string | null` - Error message if fetch failed
- `refetch: () => Promise<void>` - Function to manually refetch data

### Features

- **TypeScript generics** - Full type safety with `useFetch<T>`
- **Automatic cleanup** - Prevents state updates after unmount
- **Error handling** - Automatically catches and formats errors
- **Loading state** - Manages loading state automatically
- **Dependency tracking** - Optional dependency array for refetching

### Example: Explore Screen

See `app/(tabs)/explore.tsx` for a complete example using `useFetch` with todos API.

## Snackbar/Toast Patterns

React Native Paper includes a built-in `Snackbar` component that works great for toast-like messages. No additional libraries needed!

### Basic Usage

```tsx
import { useState } from 'react';
import { Snackbar, Button } from 'react-native-paper';

function MyScreen() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onPress={() => setVisible(true)}>Show Message</Button>
      
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setVisible(false),
        }}
      >
        This is a snackbar message!
      </Snackbar>
    </>
  );
}
```

### With Action Button

```tsx
<Snackbar
  visible={visible}
  onDismiss={() => setVisible(false)}
  action={{
    label: 'Undo',
    onPress: () => {
      // Handle undo action
    },
  }}
>
  Item deleted
</Snackbar>
```

### Positioning

```tsx
<Snackbar
  visible={visible}
  onDismiss={() => setVisible(false)}
  wrapperStyle={{ bottom: 100 }} // Custom position
>
  Custom positioned snackbar
</Snackbar>
```

### Example

See `app/(tabs)/index.tsx` for a complete Snackbar example.

## Best Practices

### Error Handling

1. **Use ErrorBoundary for component errors** - Wrap major sections
2. **Use try/catch for async operations** - Event handlers, API calls
3. **Show user-friendly messages** - Don't expose technical details
4. **Provide recovery actions** - "Try Again" buttons, retry logic

### Loading States

1. **Show loading immediately** - Don't delay feedback
2. **Use LoadingScreen for full-screen loading** - Initial data loads
3. **Use inline indicators for partial loading** - Button states, list items
4. **Consider skeleton screens** - For better perceived performance (advanced)

### Data Fetching

1. **Use useFetch for simple cases** - Most API calls
2. **Consider React Query for complex cases** - Caching, background updates
3. **Handle empty states** - Show "No data" messages
4. **Provide refresh functionality** - Pull-to-refresh, manual refresh buttons

### Snackbar Usage

1. **Use for non-critical messages** - Success, info, warnings
2. **Keep messages short** - One line when possible
3. **Auto-dismiss for success** - 2-3 seconds
4. **Require action for errors** - Let user dismiss manually
5. **One snackbar at a time** - Don't stack multiple messages

## Common Patterns

### Global Error Boundary

Wrap your root component:

```tsx
// app/_layout.tsx or App.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Loading with Error Handling

```tsx
const { data, loading, error, refetch } = useFetch<User[]>(
  () => userApi.getAll()
);

if (loading) return <LoadingScreen />;
if (error) {
  return (
    <Card>
      <Card.Content>
        <Text>Error: {error}</Text>
        <Button onPress={refetch}>Retry</Button>
      </Card.Content>
    </Card>
  );
}
```

### Snackbar for API Success

```tsx
const [snackbarVisible, setSnackbarVisible] = useState(false);

const handleSave = async () => {
  try {
    await saveData();
    setSnackbarVisible(true);
  } catch (error) {
    // Handle error
  }
};

return (
  <>
    <Button onPress={handleSave}>Save</Button>
    <Snackbar
      visible={snackbarVisible}
      onDismiss={() => setSnackbarVisible(false)}
    >
      Data saved successfully!
    </Snackbar>
  </>
);
```

## Summary

These utilities provide a solid foundation for error and loading handling:

- **ErrorBoundary** - Catches component errors gracefully
- **LoadingScreen** - Simple, reusable loading UI
- **useFetch** - Simplifies data fetching with automatic state management
- **Snackbar** - Built-in toast messages from React Native Paper

Keep it simple, and build on top of these patterns as your app grows!

