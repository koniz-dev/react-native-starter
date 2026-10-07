import { PaperProvider } from 'react-native-paper';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { getNavigationTheme, getTheme } from '@/constants/Theme';
import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConfigErrorScreen } from '@/components/ConfigErrorScreen';
import { configResult } from '@/config/env';
import { configureIntegrations } from '@/integrations/setup';
import { useScreenTracking } from '@/integrations/useScreenTracking';
import { SessionProvider, useSession } from '@/providers/SessionProvider';

// Register integration providers before the first screen renders.
configureIntegrations();

// Keep the native splash screen up until the stored session has been read.
SplashScreen.preventAutoHideAsync().catch(() => {});

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
  useScreenTracking();

  useEffect(() => {
    // With invalid config there is no session to wait for.
    if (!configResult.success) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  return (
    <ErrorBoundary>
      <PaperProvider theme={theme}>
        <ThemeProvider value={getNavigationTheme(theme)}>
          {/* Dark icons on the light theme, light icons on the dark theme. */}
          <StatusBar style={theme.dark ? 'light' : 'dark'} />
          {configResult.success ? (
            <SessionProvider>
              <RootNavigator />
            </SessionProvider>
          ) : (
            <ConfigErrorScreen issues={configResult.issues} />
          )}
        </ThemeProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}

/**
 * Route groups guarded by the session: (app) only when signed in, (auth) only
 * when signed out. Nothing renders until the stored session has been read, so
 * a cold-start deep link into (app) isn't redirected before the session is
 * restored; the native splash screen stays up meanwhile.
 */
function RootNavigator() {
  const { session } = useSession();
  const signedIn = session.status === 'signedIn';

  useEffect(() => {
    if (session.status !== 'loading') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [session.status]);

  if (session.status === 'loading') {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
