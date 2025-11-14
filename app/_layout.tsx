import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { getTheme } from '@/constants/Theme';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { store } from '@/store';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme ?? null);

  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <PaperProvider theme={theme}>
          <Stack screenOptions={{ headerShown: false }} />
        </PaperProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
