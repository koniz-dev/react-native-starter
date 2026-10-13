/**
 * Demo: the Explore tab. Loads todos from JSONPlaceholder with useFetch and
 * shows the loading, error (with retry), and success states.
 */
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button, useTheme } from 'react-native-paper';
import { todosApi } from '../api/todosApi';
import { useFetch } from '@/shared/lib/useFetch';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';
import type { Todo } from '../types';
import { t } from '@/shared/i18n';
import { errorMessage } from '@/shared/http/errorMessage';
import { logger } from '@/shared/lib/logger';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';
import { useAnnouncement } from '@/shared/ui/useAnnouncement';

export function TodosScreen() {
  const theme = useTheme();

  // Use useFetch hook to simplify data fetching
  const {
    data: todos,
    loading,
    error,
    refetch,
  } = useFetch<Todo[]>(async signal => {
    const data = await todosApi.getAll(signal);
    // Limit to 10 todos for demo
    return data.slice(0, 10);
  });

  const errorText =
    error && !loading
      ? `${t('explore.errorTitle')}. ${errorMessage(error)}`
      : null;
  useAnnouncement(errorText);
  useEffect(() => {
    // Not a server answer (e.g. a payload that failed validation): the user
    // sees a generic message, the developer the reason.
    if (error?.code === 'unknown') logger.error('Loading todos failed', error);
  }, [error]);

  // Show full-screen loading on initial load
  if (loading && !todos && !error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <DocumentTitle title={t('tabs.explore')} />
        <LoadingScreen message={t('explore.loading')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <DocumentTitle title={t('tabs.explore')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text
            variant="headlineMedium"
            style={styles.title}
            accessibilityRole="header"
          >
            {t('explore.title')}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {t('explore.subtitle')}
          </Text>
        </View>

        {/* Retry Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => void refetch()}
            disabled={loading}
            icon="refresh"
          >
            {loading
              ? t('explore.retrying')
              : error
                ? t('explore.retry')
                : t('explore.reload')}
          </Button>
        </View>

        {/* Error State, in a live region that stays mounted so it is announced */}
        <View accessibilityLiveRegion="polite" testID="explore-status">
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
                  {t('explore.errorTitle')}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onErrorContainer }}
                >
                  {errorMessage(error)}
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Success State - Todo List, kept while reloading */}
        {!error && todos && todos.length > 0 && (
          <View style={styles.todosContainer}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('explore.listTitle', { count: todos.length })}
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
                        {t('explore.done')}
                      </Text>
                    )}
                  </View>
                  <Text variant="bodySmall" style={styles.todoMeta}>
                    {t('explore.todoMeta', {
                      userId: todo.userId,
                      id: todo.id,
                    })}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!error && todos && todos.length === 0 && (
          <View style={styles.centerContainer}>
            <Text variant="bodyMedium">{t('explore.empty')}</Text>
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
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
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
