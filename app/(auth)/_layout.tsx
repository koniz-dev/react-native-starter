import { Stack } from 'expo-router';

// Render errors in this group's screens show a themed fallback with
// "Try again" and "Go home" and are reported (components/ErrorBoundary.tsx).
export { RouteErrorBoundary as ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Auth layout for authentication screens
 * Groups auth-related screens together
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
