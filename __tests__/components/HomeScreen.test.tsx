import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

import HomeScreen from '@/app/(tabs)/index';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <PaperProvider theme={MD3LightTheme}>{children}</PaperProvider>
  </SafeAreaProvider>
);

describe('<HomeScreen />', () => {
  test('renders correctly with title', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: TestWrapper });

    getByText('React Native Paper');
    getByText('Material Design 3 Components');
  });

  test('renders all text variants section', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: TestWrapper });

    getByText('Text Variants');
    getByText('Headline Small');
    getByText('Title Large');
  });

  test('renders buttons section', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: TestWrapper });

    getByText('Buttons');
    getByText('Contained');
    getByText('Outlined');
    getByText('Text');
  });
});
