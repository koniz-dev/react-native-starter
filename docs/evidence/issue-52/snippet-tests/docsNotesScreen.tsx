// features/notes/screens/NotesScreen.tsx
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import { t } from '@/shared/i18n';
import { useSession } from '@/shared/session/SessionProvider';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';

function NotesList() {
  return <Text>notes list</Text>;
}

export function NotesScreen() {
  const { session } = useSession();
  if (session.status === 'loading') return <LoadingScreen />;
  if (session.status === 'signedOut') {
    return (
      <SafeAreaView style={styles.prompt}>
        <Text>{t('home.session.signedOut')}</Text>
        <Button mode="contained" onPress={() => router.push('/login')}>
          {t('home.session.signIn')}
        </Button>
      </SafeAreaView>
    );
  }
  return <NotesList />;
}

const styles = StyleSheet.create({
  prompt: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
});
