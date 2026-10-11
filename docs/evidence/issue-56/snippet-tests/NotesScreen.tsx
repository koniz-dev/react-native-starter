// features/notes/screens/NotesScreen.tsx
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSession } from '@/shared/session/SessionProvider';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';

const strings = { 'notes.signedOut': 'Sign in to see your notes', 'notes.signIn': 'Sign in' };
const t = (key: keyof typeof strings) => strings[key];
import { Text as ListText } from 'react-native-paper';
function NotesList() { return <ListText>The notes list</ListText>; }

export function NotesScreen() {
  const theme = useTheme();
  const { session } = useSession();
  if (session.status === 'loading') return <LoadingScreen />;
  if (session.status === 'signedOut') {
    return (
      <SafeAreaView
        style={[styles.prompt, { backgroundColor: theme.colors.background }]}
      >
        <Text>{t('notes.signedOut')}</Text>
        <Button mode="contained" onPress={() => router.push('/login')}>
          {t('notes.signIn')}
        </Button>
      </SafeAreaView>
    );
  }
  return <NotesList />;
}

const styles = StyleSheet.create({
  prompt: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
});
