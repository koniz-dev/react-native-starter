/**
 * Explore Screen
 * Example screen demonstrating API integration with loading, error, and success states
 * Uses Zustand store for state management (alternative to useFetch hook)
 */
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import {
  useTodosStore,
  useTodos,
  useTodosLoading,
  useTodosError,
} from '@/stores';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function ExploreScreen() {
  const theme = useTheme();

  // Use Zustand store for todos state management
  // No provider needed - Zustand works globally!
  const todos = useTodos();
  const loading = useTodosLoading();
  const error = useTodosError();
  const fetchTodos = useTodosStore(state => state.fetchTodos);
  const clearError = useTodosStore(state => state.clearError);

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Limit to 10 todos for demo (computed selector)
  const displayedTodos = todos.slice(0, 10);

  // Show full-screen loading on initial load
  if (loading && todos.length === 0 && !error) {
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
            Fetching todos from JSONPlaceholder API using Zustand
          </Text>
        </View>

        {/* Retry Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={fetchTodos}
            disabled={loading}
            icon="refresh"
          >
            {loading ? 'Loading...' : 'Retry'}
          </Button>
          {error && (
            <Button
              mode="text"
              onPress={clearError}
              style={styles.clearButton}
            >
              Clear Error
            </Button>
          )}
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
        {!loading && !error && displayedTodos && displayedTodos.length > 0 && (
          <View style={styles.todosContainer}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Todos ({displayedTodos.length} of {todos.length} total)
            </Text>
            {displayedTodos.map(todo => (
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
            <Text
              variant="bodySmall"
              style={[styles.note, { color: theme.colors.onSurfaceVariant }]}
            >
              State managed with Zustand - no provider needed!
            </Text>
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
  clearButton: {
    marginTop: 8,
  },
  note: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});
