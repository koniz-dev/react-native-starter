/**
 * Explore Screen
 * Example screen demonstrating API integration with loading, error, and success states
 * Shows both useFetch hook pattern and Context API pattern for state management
 */
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button, useTheme, Divider } from 'react-native-paper';
import { todosApi } from '@/services/api';
import { useFetch } from '@/hooks/useFetch';
import { useTodos } from '@/contexts';
import { LoadingScreen } from '@/components/LoadingScreen';
import type { Todo } from '@/types/api';

export default function ExploreScreen() {
  const theme = useTheme();
  const [showContextExample, setShowContextExample] = useState(false);

  // Pattern 1: Use useFetch hook to simplify data fetching
  const {
    data: todos,
    loading,
    error,
    refetch,
  } = useFetch<Todo[]>(async () => {
    const data = await todosApi.getAll();
    // Limit to 10 todos for demo
    return data.slice(0, 10);
  });

  // Pattern 2: Use TodosContext for global state management
  const {
    todos: contextTodos,
    isLoading: contextLoading,
    error: contextError,
    fetchTodos,
    refetch: contextRefetch,
  } = useTodos();

  // Fetch todos from context when switching to context example
  useEffect(() => {
    if (showContextExample && contextTodos.length === 0 && !contextLoading) {
      fetchTodos();
    }
  }, [showContextExample, contextTodos.length, contextLoading, fetchTodos]);

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
            State Management Examples
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Compare useFetch hook vs Context API patterns
          </Text>
        </View>

        {/* Toggle Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode={showContextExample ? 'outlined' : 'contained'}
            onPress={() => setShowContextExample(!showContextExample)}
            icon={showContextExample ? 'hook' : 'account-switch'}
          >
            {showContextExample
              ? 'Show useFetch Pattern'
              : 'Show Context Pattern'}
          </Button>
        </View>

        <Divider style={styles.divider} />

        {!showContextExample ? (
          // Pattern 1: useFetch Hook
          <>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Pattern 1: useFetch Hook
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Local state management with custom hook
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
                {todos.slice(0, 10).map(todo => (
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
          </>
        ) : (
          // Pattern 2: Context API
          <>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Pattern 2: Context API
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Global state management with React Context
              </Text>
            </View>

            {/* Retry Button */}
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={contextRefetch}
                disabled={contextLoading}
                icon="refresh"
              >
                {contextLoading ? 'Loading...' : 'Refetch from Context'}
              </Button>
            </View>

            {/* Error State */}
            {contextError && !contextLoading && (
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
                    {contextError}
                  </Text>
                </Card.Content>
              </Card>
            )}

            {/* Success State - Todo List from Context */}
            {!contextLoading &&
              !contextError &&
              contextTodos &&
              contextTodos.length > 0 && (
                <View style={styles.todosContainer}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Todos from Context ({contextTodos.length})
                  </Text>
                  {contextTodos.slice(0, 10).map(todo => (
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
            {!contextLoading &&
              !contextError &&
              contextTodos &&
              contextTodos.length === 0 && (
                <View style={styles.centerContainer}>
                  <Text variant="bodyMedium">No todos found</Text>
                </View>
              )}
          </>
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
  divider: {
    marginVertical: 24,
  },
  sectionHeader: {
    marginBottom: 16,
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
