import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';
import type { ConfigIssue } from '@/config/env';

interface ConfigErrorScreenProps {
  issues: ConfigIssue[];
}

/**
 * Shown instead of the app when environment configuration is invalid, so a
 * misconfigured build fails visibly instead of calling the wrong backend.
 */
export function ConfigErrorScreen({ issues }: ConfigErrorScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="config-error-screen"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Configuration error
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.body, { color: theme.colors.onSurfaceVariant }]}
        >
          The environment variables for this build are missing or invalid. Fix
          them in your .env file (see .env.example) or build profile, then
          restart the app.
        </Text>
        {issues.map(issue => (
          <View
            key={`${issue.variable}:${issue.message}`}
            style={[styles.issue, { borderColor: theme.colors.error }]}
          >
            <Text variant="titleSmall" style={{ color: theme.colors.error }}>
              {issue.variable}
            </Text>
            <Text variant="bodyMedium">{issue.message}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  body: {
    marginBottom: 24,
  },
  issue: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
});
