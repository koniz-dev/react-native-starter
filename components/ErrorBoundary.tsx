/**
 * Error boundaries.
 *
 * - `ErrorBoundary` wraps the whole app in app/_layout.tsx (inside the theme
 *   provider, so the fallback follows light/dark mode). It catches render
 *   errors that no route boundary handled.
 * - `RouteErrorBoundary` is exported as `ErrorBoundary` from the route group
 *   layouts; Expo Router renders it in place of the group when one of its
 *   screens throws.
 *
 * Both report through the logger, which forwards to the error-reporting seam
 * in every build, and both offer "Try again" and "Go home".
 */
import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { router, type ErrorBoundaryProps } from 'expo-router';
import { t } from '@/i18n';
import { logger } from '@/utils/logger';

/** Navigates to Home. Safe to call before navigation is ready. */
function goHome() {
  try {
    router.replace('/');
  } catch (error) {
    logger.warn('Go home failed', { error });
  }
}

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Render error caught by the app error boundary', error, {
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  resetError = () => {
    this.setState({ error: null });
  };

  goHomeAndReset = () => {
    goHome();
    this.resetError();
  };

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.resetError);
    return (
      <ErrorFallback
        error={error}
        onRetry={this.resetError}
        onGoHome={this.goHomeAndReset}
      />
    );
  }
}

/**
 * Route-level boundary for Expo Router. Export it from a layout:
 * `export { RouteErrorBoundary as ErrorBoundary } from '@/components/ErrorBoundary';`
 */
export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    logger.error('Render error caught by a route error boundary', error);
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      onRetry={() => {
        void retry();
      }}
      onGoHome={() => {
        goHome();
        void retry();
      }}
    />
  );
}

export function ErrorFallback({
  error,
  onRetry,
  onGoHome,
}: {
  error: Error;
  onRetry: () => void;
  onGoHome: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="error-fallback"
    >
      <Card
        style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}
      >
        <Card.Content>
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.onErrorContainer }]}
          >
            {t('errorBoundary.title')}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.message, { color: theme.colors.onErrorContainer }]}
          >
            {error.message || t('errorBoundary.fallbackMessage')}
          </Text>
          {__DEV__ && error.stack ? (
            <ScrollView style={styles.stackScroll}>
              <Text
                variant="bodySmall"
                style={[
                  styles.stackTrace,
                  { color: theme.colors.onErrorContainer },
                ]}
              >
                {error.stack}
              </Text>
            </ScrollView>
          ) : null}
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined" onPress={onGoHome} testID="error-go-home">
            {t('errorBoundary.goHome')}
          </Button>
          <Button
            mode="contained"
            onPress={onRetry}
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            testID="error-retry"
          >
            {t('errorBoundary.retry')}
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  message: {
    marginBottom: 16,
  },
  stackScroll: {
    maxHeight: 200,
  },
  stackTrace: {
    // 'monospace' is not a font family on iOS.
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 12,
    opacity: 0.8,
  },
});
