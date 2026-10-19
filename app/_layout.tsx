import { PaperProvider } from 'react-native-paper';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { getNavigationTheme, getTheme } from '@/shared/ui/theme';
import {
  router,
  Stack,
  ThemeProvider,
  useRootNavigationState,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { ConfigErrorScreen } from '@/shared/ui/ConfigErrorScreen';
import { configResult } from '@/shared/config/env';
import { configureIntegrations } from '@/shared/integrations/setup';
import { useScreenTracking } from '@/shared/integrations/useScreenTracking';
import { SessionProvider, useSession } from '@/shared/session/SessionProvider';
import { t } from '@/shared/i18n';
import { logger } from '@/shared/lib/logger';

// Register integration providers before the first screen renders. A
// provider that fails to start (or reads invalid config) is logged; it must
// not keep the app, or its configuration error screen, from rendering.
try {
  configureIntegrations();
} catch (error) {
  logger.error('Configuring integrations failed', error);
}

// Keep the native splash screen up until the stored session has been read.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Anchor the root stack on the tabs so that a launch URL that does not match a
// route (as Expo Go sends on Android) falls back to Home rather than to the
// alphabetically first group, and so that Back from a deep-linked /login
// returns to Home instead of exiting the app.
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    // With invalid config there is no session to wait for.
    if (!configResult.success) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  return (
    <PaperProvider theme={theme}>
      {/* Inside the theme provider, so the fallback follows light/dark. */}
      <ErrorBoundary>
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
      </ErrorBoundary>
    </PaperProvider>
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
  useScreenTracking({ enabled: session.status !== 'loading' });
  useNoExtraHome(session.status);

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
      {/* The title is the iOS back label on screens pushed over the tabs. */}
      <Stack.Screen name="(tabs)" options={{ title: t('tabs.home') }} />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Screen
        name="+not-found"
        options={{ title: t('notFound.title') }}
      />
    </Stack>
  );
}

/** The root stack's route groups that a session guard can send a user out of. */
const GUARDED_GROUPS = new Set(['(auth)', '(app)']);

/**
 * Takes the user back to the screen below when the session guards send them
 * Home. Expo Router 58 sends a user out of a guarded group (signing in on
 * Login, signing out or a session that ends on Profile, a deep link the guard
 * refuses) with replace('/'): a new Home takes the group's place on top of
 * the stack, instead of the user going back to where they were. Back
 * (Android) or the edge swipe (iOS) would then show that screen, or Home
 * again, and each sign-in or sign-out would add one more Home.
 *
 * Only that replacement is undone: after the session changed, a Home on its
 * first tab in the place where a guarded group just was. The app's own
 * navigation stays, except a replace('/') at that moment, which looks the
 * same (docs/conventions.md says to use dismissTo('/') then). A new guarded
 * group goes in GUARDED_GROUPS.
 */
function useNoExtraHome(status: string) {
  // The root stack is the first route's state, under Expo Router's own root.
  const stack = useRootNavigationState()?.routes[0]?.state;
  const top = stack?.routes[stack.index ?? 0];
  const tab = top?.state?.routes[top.state.index ?? 0]?.name ?? 'index';
  const length = stack?.routes.length ?? 0;
  const before = useRef<{ name?: string; length: number }>({ length: 0 });
  const sessionChanged = useRef(false);
  useEffect(() => {
    sessionChanged.current = true;
  }, [status]);
  useEffect(() => {
    const previous = before.current;
    before.current = { name: top?.name, length };
    const inGroup =
      previous.name !== undefined && GUARDED_GROUPS.has(previous.name);
    if (!inGroup) {
      // The stack moved with another screen on top: a session change before
      // this had no guarded group to send the user out of.
      sessionChanged.current = false;
      return;
    }
    if (top?.name === previous.name) return;
    const guardsRedirect =
      sessionChanged.current &&
      top?.name === '(tabs)' &&
      tab === 'index' &&
      length === previous.length;
    // Answered either way: the guarded group has left the top. Needed when it
    // left for the other group, where the reset above doesn't run.
    sessionChanged.current = false;
    if (guardsRedirect) router.dismiss();
  }, [top?.name, tab, length]);
}
