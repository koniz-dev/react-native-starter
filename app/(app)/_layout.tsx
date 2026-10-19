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
      screenOptions={({ route, navigation }) => {
        // This stack starts at the group's first screen, so the header has no
        // back button of its own; add one that returns to the screen that
        // opened the group, or Home when there is none. It decides when
        // pressed: these options are read once, before the stack below has
        // settled. Later screens keep the default back button.
        const isFirst = navigation.getState().routes[0]?.key === route.key;
        if (!isFirst) return {};
        return {
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
        };
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
