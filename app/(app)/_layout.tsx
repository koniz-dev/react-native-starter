import { StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { Appbar } from 'react-native-paper';
import { t } from '@/shared/i18n';

// Render errors in this group's screens show a themed fallback with
// "Try again" and "Go home" and are reported (shared/ui/ErrorBoundary.tsx).
export { RouteErrorBoundary as ErrorBoundary } from '@/shared/ui/ErrorBoundary';

/**
 * Screens that require a signed-in user. The root layout wraps this group in
 * <Stack.Protected guard={signedIn}>: when the session ends, a user here goes
 * back to the screen below the group, and a deep link into the group lands
 * on Home. While signed out, router.navigate() to a screen here does nothing,
 * so links to it check the session first (docs/conventions.md). Add new
 * protected screens to this folder.
 */
export default function ProtectedLayout() {
  return (
    <Stack
      screenOptions={{
        // The first screen also needs a way back out of this group. Read
        // history only on press, once navigation has settled, so every screen
        // returns to its caller or falls back to Home without a stale snapshot.
        headerLeft: () => (
          <Appbar.BackAction
            accessibilityLabel={t('common.back')}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/')
            }
            style={styles.back}
            testID="protected-back"
          />
        ),
      }}
    >
      <Stack.Screen name="profile" options={{ title: t('profile.title') }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  back: {
    marginStart: -8,
  },
});
