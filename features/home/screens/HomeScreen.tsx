import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useSession } from '@/shared/session/SessionProvider';
import { t } from '@/shared/i18n';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';
// @demo remove-block-start
// eslint-disable-next-line project/import-boundaries -- the demo is removable (npm run remove-demo)
import { ExampleLinks } from '@/features/demo-showcase/components/ExampleLinks';
// @demo remove-block-end

/** Home: the session card, with sign-in, profile, and sign-out. */
export function HomeScreen() {
  const theme = useTheme();
  const { session, signOut } = useSession();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <DocumentTitle title={t('tabs.home')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          variant="headlineMedium"
          style={styles.title}
          accessibilityRole="header"
        >
          {t('home.title')}
        </Text>

        <Card mode="outlined" style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">{t('home.session.title')}</Text>
            <Text
              variant="bodyMedium"
              style={[styles.status, { color: theme.colors.onSurfaceVariant }]}
              testID="session-status"
            >
              {/* Never 'loading' here: the root layout renders nothing
                  until the stored session has been read. */}
              {session.status === 'signedIn'
                ? t('home.session.signedIn', {
                    name:
                      session.user?.name ??
                      t('home.session.signedInFallbackName'),
                  })
                : t('home.session.signedOut')}
            </Text>
          </Card.Content>
          <Card.Actions>
            {session.status === 'signedIn' ? (
              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={() => void signOut()}
                  testID="logout-button"
                >
                  {t('home.session.logOut')}
                </Button>
                <Button
                  mode="contained-tonal"
                  onPress={() => router.navigate('/profile')}
                  testID="profile-button"
                >
                  {t('home.session.viewProfile')}
                </Button>
              </View>
            ) : (
              <Button
                mode="contained"
                onPress={() => router.navigate('/login')}
                testID="sign-in-button"
              >
                {t('home.session.signIn')}
              </Button>
            )}
          </Card.Actions>
        </Card>

        {/* @demo remove-block-start */}
        <ExampleLinks />
        {/* @demo remove-block-end */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
  },
  status: {
    marginTop: 4,
  },
  // Wraps at large text sizes instead of overflowing the card.
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
