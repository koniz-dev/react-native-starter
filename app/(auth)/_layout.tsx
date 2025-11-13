import { Stack } from 'expo-router';

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
