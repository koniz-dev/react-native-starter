import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { getNavigationTheme, getTheme } from '@/constants/Theme';
import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConfigErrorScreen } from '@/components/ConfigErrorScreen';
import { configResult } from '@/config/env';

// Anchor the root stack on the tabs so that a launch URL that does not match a
// route (as Expo Go sends on Android) falls back to Home rather than to the
// alphabetically first group, and so that Back from a deep-linked /login
// returns to Home instead of exiting the app.
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <ErrorBoundary>
      <PaperProvider theme={theme}>
        <ThemeProvider value={getNavigationTheme(theme)}>
          {/* Dark icons on the light theme, light icons on the dark theme. */}
          <StatusBar style={theme.dark ? 'light' : 'dark'} />
          {configResult.success ? (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
            </Stack>
          ) : (
            <ConfigErrorScreen issues={configResult.issues} />
          )}
        </ThemeProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}
