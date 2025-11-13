/**
 * Explore Screen
 * Example screen demonstrating API integration with loading, error, and success states
 * Uses the useFetch hook for simplified data fetching
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { todosApi } from '@/services/api';
import { useFetch } from '@/hooks/useFetch';
import { LoadingScreen } from '@/components/LoadingScreen';
import type { Todo } from '@/types/api';

export default function ExploreScreen() {
  const theme = useTheme();
  
  // Use useFetch hook to simplify data fetching
  const { data: todos, loading, error, refetch } = useFetch<Todo[]>(
    async () => {
      const data = await todosApi.getAll();
      // Limit to 10 todos for demo
      return data.slice(0, 10);
    }
  );

  // Show full-screen loading on initial load
  if (loading && !todos && !error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <LoadingScreen message="Loading todos..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            API Example
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Fetching todos from JSONPlaceholder API
          </Text>
        </View>

        {/* Retry Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={refetch}
            disabled={loading}
            icon="refresh"
          >
            {loading ? 'Loading...' : 'Retry'}
          </Button>
        </View>

        {/* Error State */}
        {error && !loading && (
          <Card
            style={[
              styles.errorCard,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Card.Content>
              <Text
                variant="titleMedium"
                style={[styles.errorTitle, { color: theme.colors.error }]}
              >
                Error
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onErrorContainer }}
              >
                {error}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Success State - Todo List */}
        {!loading && !error && todos && todos.length > 0 && (
          <View style={styles.todosContainer}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Todos ({todos.length})
            </Text>
            {todos.map(todo => (
              <Card key={todo.id} style={styles.todoCard}>
                <Card.Content>
                  <View style={styles.todoHeader}>
                    <Text
                      variant="titleSmall"
                      style={[
                        styles.todoTitle,
                        todo.completed && styles.completedTodo,
                      ]}
                    >
                      {todo.title}
                    </Text>
                    {todo.completed && (
                      <Text
                        variant="labelSmall"
                        style={[
                          styles.completedBadge,
                          { color: theme.colors.primary },
                        ]}
                      >
                        ✓ Done
                      </Text>
                    )}
                  </View>
                  <Text variant="bodySmall" style={styles.todoMeta}>
                    User ID: {todo.userId} • ID: {todo.id}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && todos && todos.length === 0 && (
          <View style={styles.centerContainer}>
            <Text variant="bodyMedium">No todos found</Text>
          </View>
        )}
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
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorCard: {
    marginBottom: 24,
  },
  errorTitle: {
    marginBottom: 8,
  },
  todosContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  todoCard: {
    marginBottom: 12,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  todoTitle: {
    flex: 1,
    marginRight: 8,
  },
  completedTodo: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  completedBadge: {
    fontWeight: '600',
  },
  todoMeta: {
    opacity: 0.6,
  },
});
