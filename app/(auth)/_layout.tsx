import { StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Appbar } from 'react-native-paper';
import { t } from '@/shared/i18n';

// Render errors in this group's screens show a themed fallback with
// "Try again" and "Go home" and are reported (shared/ui/ErrorBoundary.tsx).
export { RouteErrorBoundary as ErrorBoundary } from '@/shared/ui/ErrorBoundary';

/**
 * Screens for signed-out users. The header has only a back button, so the
 * user can always leave: back to the screen that opened sign-in, or Home
 * when the screen was opened directly (a deep link or a web URL). Each
 * screen names the browser tab itself with <DocumentTitle>: Expo Router
 * turns off React Navigation's document title.
 */
export default function AuthLayout() {
  const router = useRouter();
  return (
    <Stack
      screenOptions={{
        headerTitle: '',
        headerShadowVisible: false,
        headerLeft: () => (
          <Appbar.BackAction
            accessibilityLabel={t('common.back')}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/')
            }
            style={styles.back}
            testID="auth-back"
          />
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  back: {
    marginStart: -8,
  },
});
