import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  List,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSession } from '@/shared/session/SessionProvider';
import { toApiError } from '@/shared/http/apiError';
import { errorMessage } from '@/shared/http/errorMessage';
import { t } from '@/shared/i18n';
import { logger } from '@/shared/lib/logger';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';
import { useAnnouncement } from '@/shared/ui/useAnnouncement';

/**
 * Example protected screen: only reachable while signed in. On open it
 * reloads the user from the auth backend with the stored token; if the token
 * has expired, the API's 401 signs the user out and the route guard returns
 * them to Home.
 */
export function ProfileScreen() {
  const theme = useTheme();
  const { session, signOut, signingOut, refreshUser } = useSession();
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = session.user;
  const errorText = error && t('profile.refreshFailed', { message: error });
  useAnnouncement(errorText);

  useEffect(() => {
    let active = true;
    refreshUser()
      .catch(err => {
        const apiError = toApiError(err);
        // Not a server answer (e.g. a profile that fails validation): the
        // user sees a generic message, the developer the reason.
        if (apiError.code === 'unknown') {
          logger.error('Refreshing the profile failed', err);
        }
        // A 401 signs out; the guard navigates away, so there is nothing to show.
        if (active && apiError.code !== 'unauthorized') {
          setError(errorMessage(apiError));
        }
      })
      .finally(() => {
        if (active) setRefreshing(false);
      });
    return () => {
      active = false;
    };
  }, [refreshUser]);

  return (
    // Under the stack's header: the header covers the top inset.
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <DocumentTitle title={t('profile.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodyMedium" style={styles.intro}>
          {t('profile.intro')}
        </Text>
        {refreshing && (
          <ActivityIndicator
            style={styles.status}
            accessibilityLabel={t('profile.refreshing')}
            testID="profile-refreshing"
          />
        )}
        {/* A live region that stays mounted, so its new text is announced. */}
        <View accessibilityLiveRegion="polite" testID="profile-status">
          {errorText && (
            <Text
              variant="bodyMedium"
              style={[styles.status, { color: theme.colors.error }]}
              testID="profile-error"
            >
              {errorText}
            </Text>
          )}
        </View>
        <List.Item
          title={t('profile.name')}
          description={user?.name.trim() || t('profile.unknown')}
          left={props => (
            <View aria-hidden>
              <List.Icon {...props} icon="account" />
            </View>
          )}
        />
        <List.Item
          title={t('profile.email')}
          description={user?.email.trim() || t('profile.unknown')}
          left={props => (
            <View aria-hidden>
              <List.Icon {...props} icon="email" />
            </View>
          )}
        />
        <Button
          mode="outlined"
          onPress={() => void signOut()}
          loading={signingOut}
          disabled={signingOut}
          style={styles.button}
          testID="profile-logout"
        >
          {t('home.session.logOut')}
        </Button>
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
  intro: {
    marginBottom: 8,
  },
  status: {
    marginVertical: 8,
  },
  button: {
    marginTop: 24,
  },
});
