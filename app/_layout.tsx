import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { getTheme } from '@/constants/Theme';
import { Stack } from 'expo-router';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

