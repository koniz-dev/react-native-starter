import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { getTheme } from '@/constants/Theme';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { TodosProvider } from '@/contexts/TodosContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme ?? null);

  return (
    <ErrorBoundary>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <TodosProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </TodosProvider>
        </AuthProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}
