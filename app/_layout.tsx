import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';
import { getTheme } from '@/constants/Theme';

function RootLayoutContent() {
  const { actualTheme } = useAppTheme();
  const theme = getTheme(actualTheme);

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

