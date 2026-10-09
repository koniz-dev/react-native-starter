import { List } from 'react-native-paper';
import { router } from 'expo-router';
import { t } from '@/shared/i18n';

/** Demo: Home's links to the example screens. */
export function ExampleLinks() {
  return (
    <List.Section>
      <List.Subheader>{t('home.examples.title')}</List.Subheader>
      <List.Item
        title={t('home.examples.todos')}
        description={t('home.examples.todosDescription')}
        left={props => <List.Icon {...props} icon="format-list-checks" />}
        onPress={() => router.push('/explore')}
        testID="example-todos"
      />
      <List.Item
        title={t('home.examples.showcase')}
        description={t('home.examples.showcaseDescription')}
        left={props => <List.Icon {...props} icon="palette" />}
        onPress={() => router.push('/showcase')}
        testID="example-showcase"
      />
    </List.Section>
  );
}
