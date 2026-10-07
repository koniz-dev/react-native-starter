import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Button,
  List,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSession } from '@/providers/SessionProvider';
import { toApiError } from '@/services/apiError';
import { t } from '@/i18n';

/**
 * Example protected screen: only reachable while signed in. On open it
 * reloads the user from the auth backend with the stored token; if the token
 * has expired, the API's 401 signs the user out and the route guard returns
 * them to Home.
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const { session, signOut, refreshUser } = useSession();
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = session.user;

  useEffect(() => {
    let active = true;
    refreshUser()
      .catch(err => {
        const apiError = toApiError(err);
        // A 401 signs out; the guard navigates away, so there is nothing to show.
        if (active && apiError.code !== 'unauthorized') {
          setError(apiError.message);
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
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text variant="bodyMedium" style={styles.intro}>
        {t('profile.intro')}
      </Text>
      {refreshing && (
        <ActivityIndicator style={styles.status} testID="profile-refreshing" />
      )}
      {error && (
        <Text
          variant="bodyMedium"
          style={[styles.status, { color: theme.colors.error }]}
          testID="profile-error"
        >
          {t('profile.refreshFailed', { message: error })}
        </Text>
      )}
      <List.Item
        title={t('profile.name')}
        description={user?.name ?? '—'}
        left={props => <List.Icon {...props} icon="account" />}
      />
      <List.Item
        title={t('profile.email')}
        description={user?.email ?? '—'}
        left={props => <List.Icon {...props} icon="email" />}
      />
      <Button
        mode="outlined"
        onPress={signOut}
        style={styles.button}
        testID="profile-logout"
      >
        {t('home.session.logOut')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
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
