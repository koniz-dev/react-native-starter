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
import { Stack } from 'expo-router';
import { t } from '@/shared/i18n';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';
import { useAnnouncement } from '@/shared/ui/useAnnouncement';

/**
 * Demo: a tour of React Native Paper components under the app theme. Opened
 * from Home ("Component showcase"); remove it with the rest of the demo.
 */
export function ShowcaseScreen() {
  const theme = useTheme();
  // The showcase buttons report presses through the snackbar. Each press is
  // a new notice: its id remounts the Snackbar (hiding and showing the same
  // one again races Paper's fade-out and can leave it hidden), and repeats
  // the iOS announcement for the same text.
  const [notice, setNotice] = useState<{ text: string; id: number }>();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const notify = (text: string) => () => {
    setNotice(current => ({ text, id: (current?.id ?? 0) + 1 }));
    setSnackbarVisible(true);
  };
  // Paper's Snackbar is a live region, which iOS doesn't have.
  useAnnouncement(snackbarVisible ? notice?.text : null, notice?.id);

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{ headerShown: true, title: t('showcase.title') }}
      />
      <DocumentTitle title={t('showcase.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text
            variant="headlineMedium"
            style={styles.title}
            accessibilityRole="header"
          >
            {t('showcase.heading')}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {t('showcase.subheading')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text
            variant="titleMedium"
            style={styles.sectionTitle}
            accessibilityRole="header"
          >
            {t('showcase.textVariants')}
          </Text>
          <Text variant="headlineSmall">{t('showcase.headlineSmall')}</Text>
          <Text variant="titleLarge">{t('showcase.titleLarge')}</Text>
          <Text variant="bodyLarge">{t('showcase.bodyLarge')}</Text>
          <Text variant="bodyMedium">{t('showcase.bodyMedium')}</Text>
        </View>

        <View style={styles.section}>
          <Text
            variant="titleMedium"
            style={styles.sectionTitle}
            accessibilityRole="header"
          >
            {t('showcase.buttons')}
          </Text>
          <View style={styles.buttonRow}>
            {(['contained', 'outlined', 'text'] as const).map(mode => {
              const label = t(`showcase.button.${mode}`);
              return (
                <Button
                  key={mode}
                  mode={mode}
                  onPress={notify(t('showcase.pressed', { name: label }))}
                >
                  {label}
                </Button>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            variant="titleMedium"
            style={styles.sectionTitle}
            accessibilityRole="header"
          >
            {t('showcase.card')}
          </Text>
          <Card>
            <Card.Content>
              <Text variant="titleLarge">{t('showcase.cardTitle')}</Text>
              <Text variant="bodyMedium" style={styles.cardText}>
                {t('showcase.cardBody')}
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button
                onPress={notify(
                  t('showcase.cardPressed', { name: t('showcase.cancel') })
                )}
              >
                {t('showcase.cancel')}
              </Button>
              <Button
                onPress={notify(
                  t('showcase.cardPressed', { name: t('showcase.ok') })
                )}
              >
                {t('showcase.ok')}
              </Button>
            </Card.Actions>
          </Card>
        </View>

        <View style={styles.section}>
          <Text
            variant="titleMedium"
            style={styles.sectionTitle}
            accessibilityRole="header"
          >
            {t('showcase.surface')}
          </Text>
          <Surface
            style={[
              styles.surface,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
            elevation={2}
          >
            <Text variant="bodyMedium" style={styles.surfaceText}>
              {t('showcase.surfaceBody')}
            </Text>
          </Surface>
        </View>

        <View style={styles.section}>
          <Text
            variant="titleMedium"
            style={styles.sectionTitle}
            accessibilityRole="header"
          >
            {t('showcase.snackbar')}
          </Text>
          <Text variant="bodyMedium" style={styles.snackbarDescription}>
            {t('showcase.snackbarBody')}
          </Text>
          <Button
            mode="contained"
            onPress={notify(t('showcase.snackbarMessage'))}
            style={styles.snackbarButton}
          >
            {t('showcase.snackbarButton')}
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        key={notice?.id}
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        // Paper calls onDismiss after the action.
        action={{ label: t('common.dismiss') }}
      >
        {notice?.text}
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
