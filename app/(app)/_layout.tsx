import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Appbar } from 'react-native-paper';
import { t } from '@/i18n';

// Render errors in this group's screens show a themed fallback with
// "Try again" and "Go home" and are reported (components/ErrorBoundary.tsx).
export { RouteErrorBoundary as ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Screens that require a signed-in user. The root layout wraps this group in
 * <Stack.Protected guard={signedIn}>, so a signed-out user (including after
 * a session expires) is sent back to Home, and deep links into the group are
 * redirected the same way. Add new protected screens to this folder.
 */
export default function ProtectedLayout() {
  return (
    <Stack
      screenOptions={({ route, navigation }) => {
        // This stack starts at the group's first screen, so the header has no
        // back button of its own; add one that returns to the screen that
        // opened the group. Later screens keep the default back button.
        const isFirst = navigation.getState().routes[0]?.key === route.key;
        if (!isFirst || !navigation.canGoBack()) return {};
        return {
          headerLeft: () => (
            <Appbar.BackAction
              onPress={() => navigation.goBack()}
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
    marginLeft: -8,
  },
});
