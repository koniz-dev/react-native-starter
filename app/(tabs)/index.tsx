import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, Surface, useTheme, IconButton } from 'react-native-paper';
import { useAppTheme } from '@/contexts/ThemeContext';

export default function HomeScreen() {
  const { themeMode, setThemeMode, actualTheme } = useAppTheme();
  const theme = useTheme();

  const toggleTheme = () => {
    if (themeMode === 'auto') {
      setThemeMode(actualTheme === 'light' ? 'dark' : 'light');
    } else if (themeMode === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('light');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text variant="headlineMedium" style={styles.title}>
              React Native Paper
            </Text>
            <IconButton
              icon={actualTheme === 'dark' ? 'brightness-7' : 'brightness-3'}
              size={24}
              onPress={toggleTheme}
              mode="contained"
            />
          </View>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Material Design 3 Components
          </Text>
          <Text variant="bodySmall" style={[styles.modeText, { color: theme.colors.onSurfaceVariant }]}>
            Current mode: {actualTheme} {themeMode !== 'auto' && `(manual)`}
          </Text>
        </View>

        {/* Themed Button Examples */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Buttons
          </Text>
          <View style={styles.buttonRow}>
            <Button mode="contained" onPress={() => console.log('Pressed')}>
              Contained
            </Button>
            <Button mode="outlined" onPress={() => console.log('Pressed')}>
              Outlined
            </Button>
            <Button mode="text" onPress={() => console.log('Pressed')}>
              Text
            </Button>
          </View>
        </View>

        {/* Card Example */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Cards
          </Text>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge">Card Title</Text>
              <Text variant="bodyMedium" style={styles.cardText}>
                This is a card component from React Native Paper. Cards are great for displaying
                grouped information.
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => console.log('Cancel')}>Cancel</Button>
              <Button onPress={() => console.log('Ok')}>Ok</Button>
            </Card.Actions>
          </Card>
        </View>

        {/* Surface Example */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Surface
          </Text>
          <Surface style={[styles.surface, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
            <Text variant="bodyMedium" style={styles.surfaceText}>
              Surface component with elevation. This provides a Material Design elevation effect.
            </Text>
          </Surface>
        </View>

        {/* Custom Styled Example */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Custom Styled
          </Text>
          <Button
            mode="contained"
            onPress={() => console.log('Custom pressed')}
            style={styles.customButton}
            labelStyle={styles.customButtonLabel}
          >
            Custom Styled Button
          </Button>
        </View>

        {/* Theme Toggle Example */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Theme Toggle
          </Text>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge">Switch Theme</Text>
              <Text variant="bodyMedium" style={styles.cardText}>
                Tap the sun/moon icon in the header to toggle between light and dark themes.
                The theme preference is stored in memory and will reset to system default on app restart.
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button
                mode={themeMode === 'light' ? 'contained' : 'outlined'}
                onPress={() => setThemeMode('light')}
              >
                Light
              </Button>
              <Button
                mode={themeMode === 'dark' ? 'contained' : 'outlined'}
                onPress={() => setThemeMode('dark')}
              >
                Dark
              </Button>
              <Button
                mode={themeMode === 'auto' ? 'contained' : 'outlined'}
                onPress={() => setThemeMode('auto')}
              >
                Auto
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </ScrollView>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 4,
  },
  modeText: {
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
    gap: 8,
  },
  card: {
    marginBottom: 8,
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
  customButton: {
    marginTop: 8,
  },
  customButtonLabel: {
    paddingVertical: 4,
  },
});

