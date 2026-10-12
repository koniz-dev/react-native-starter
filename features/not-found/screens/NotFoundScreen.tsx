import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Text, useTheme } from 'react-native-paper';
import { t } from '@/shared/i18n';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';

/**
 * Shown for a URL no route matches: an outdated deep link, or a mistyped
 * address on the web. Replaces expo-router's development "Unmatched Route"
 * page, which is unthemed, English-only, and links to the sitemap.
 */
export function NotFoundScreen() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <DocumentTitle title={t('notFound.title')} />
      <View style={styles.body}>
        <Text
          variant="headlineSmall"
          style={styles.title}
          accessibilityRole="header"
        >
          {t('notFound.title')}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('notFound.message')}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.dismissTo('/')}
          testID="not-found-home"
        >
          {t('notFound.goHome')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  body: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    marginBottom: 24,
    textAlign: 'center',
  },
});
