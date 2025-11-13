/**
 * ErrorBoundary Component
 * React Error Boundary that catches JavaScript errors in child component tree
 * and displays a fallback UI with error information.
 */
import React, { Component, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Button, Text, useTheme } from 'react-native-paper';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary catches errors in child components and displays a fallback UI.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} onReset={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI component
 */
function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.colors.errorContainer },
        ]}
      >
        <Card.Content>
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.onErrorContainer }]}
          >
            Something went wrong
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.message, { color: theme.colors.onErrorContainer }]}
          >
            {error.message || 'An unexpected error occurred'}
          </Text>
          {__DEV__ && error.stack && (
            <Text
              variant="bodySmall"
              style={[styles.stackTrace, { color: theme.colors.onErrorContainer }]}
            >
              {error.stack}
            </Text>
          )}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={onReset}
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
          >
            Try Again
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
  stackTrace: {
    marginTop: 16,
    fontFamily: 'monospace',
    fontSize: 12,
    opacity: 0.8,
  },
});

