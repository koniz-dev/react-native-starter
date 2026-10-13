import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

interface LoadingScreenProps {
  message?: string;
}

/**
 * LoadingScreen displays a centered loading indicator with optional message.
 *
 * @example
 * ```tsx
 * <LoadingScreen message={t('posts.loading')} /> // a key in shared/i18n/en.ts
 * ```
 */
export function LoadingScreen({ message }: LoadingScreenProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="loading-screen"
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message && (
        <Text
          variant="bodyMedium"
          style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
        >
          {message}
        </Text>
      )}
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
  message: {
    marginTop: 16,
  },
});
