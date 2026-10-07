import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Text,
  Surface,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useSession } from '@/providers/SessionProvider';
import { t } from '@/i18n';

export default function HomeScreen() {
  const theme = useTheme();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const { session, signOut } = useSession();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            React Native Paper
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Material Design 3 Components
          </Text>
          <View style={styles.session}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
              testID="session-status"
            >
              {session.status === 'loading'
                ? t('home.session.checking')
                : session.status === 'signedIn'
                  ? t('home.session.signedIn', {
                      name:
                        session.user?.name ??
                        t('home.session.signedInFallbackName'),
                    })
                  : t('home.session.signedOut')}
            </Text>
            {session.status === 'signedIn' ? (
              <View style={styles.sessionActions}>
                <Button
                  mode="contained-tonal"
                  onPress={() => router.push('/profile')}
                  style={styles.authDemoButton}
                  testID="profile-button"
                >
                  {t('home.session.viewProfile')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={signOut}
                  style={styles.authDemoButton}
                  testID="logout-button"
                >
                  {t('home.session.logOut')}
                </Button>
              </View>
            ) : (
              <Button
                mode="outlined"
                onPress={() => router.push('/(auth)/login')}
                style={styles.authDemoButton}
                disabled={session.status === 'loading'}
              >
                {t('home.session.tryDemo')}
              </Button>
            )}
          </View>
        </View>

        {/* Text Variants */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Text Variants
          </Text>
          <Text variant="headlineSmall">Headline Small</Text>
          <Text variant="titleLarge">Title Large</Text>
          <Text variant="bodyLarge">Body Large</Text>
          <Text variant="bodyMedium">Body Medium</Text>
        </View>

        {/* Buttons */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Buttons
          </Text>
          <View style={styles.buttonRow}>
            <Button mode="contained" onPress={() => {}}>
              Contained
            </Button>
            <Button mode="outlined" onPress={() => {}}>
              Outlined
            </Button>
            <Button mode="text" onPress={() => {}}>
              Text
            </Button>
          </View>
        </View>

        {/* Card */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Card
          </Text>
          <Card>
            <Card.Content>
              <Text variant="titleLarge">Card Title</Text>
              <Text variant="bodyMedium" style={styles.cardText}>
                This is a card component from React Native Paper.
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => {}}>Cancel</Button>
              <Button onPress={() => {}}>Ok</Button>
            </Card.Actions>
          </Card>
        </View>

        {/* Surface */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Surface
          </Text>
          <Surface
            style={[
              styles.surface,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
            elevation={2}
          >
            <Text variant="bodyMedium" style={styles.surfaceText}>
              Surface component with elevation
            </Text>
          </Surface>
        </View>

        {/* Snackbar Example */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Snackbar (Toast)
          </Text>
          <Text variant="bodyMedium" style={styles.snackbarDescription}>
            React Native Paper includes a Snackbar component for showing
            toast-like messages. No additional libraries needed!
          </Text>
          <Button
            mode="contained"
            onPress={() => setSnackbarVisible(true)}
            style={styles.snackbarButton}
          >
            Show Snackbar
          </Button>
        </View>
      </ScrollView>

      {/* Snackbar */}
      {/* Note: You may see a warning about useNativeDriver - this is harmless in Expo
          and the Snackbar will fall back to JS-based animations automatically */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        This is a snackbar message!
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  session: {
    marginTop: 16,
    alignItems: 'center',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  authDemoButton: {
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
  },
  cardText: {
    marginTop: 8,
  },
  surface: {
    padding: 16,
    borderRadius: 8,
  },
  surfaceText: {
    textAlign: 'center',
  },
  snackbarDescription: {
    marginBottom: 12,
    opacity: 0.7,
  },
  snackbarButton: {
    marginTop: 8,
  },
});
