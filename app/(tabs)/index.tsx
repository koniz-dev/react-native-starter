import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, Surface, useTheme } from 'react-native-paper';

export default function HomeScreen() {
  const theme = useTheme();

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
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Material Design 3 Components
          </Text>
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

        {/* Card */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Card
          </Text>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge">Card Title</Text>
              <Text variant="bodyMedium" style={styles.cardText}>
                This is a card component from React Native Paper.
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => console.log('Cancel')}>Cancel</Button>
              <Button onPress={() => console.log('Ok')}>Ok</Button>
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
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 4,
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
});
