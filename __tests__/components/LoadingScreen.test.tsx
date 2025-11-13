import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

import { LoadingScreen } from '@/components/LoadingScreen';

// Mock ActivityIndicator to avoid animation issues in tests
jest.mock('react-native-paper', () => {
  const actual = jest.requireActual('react-native-paper');
  return {
    ...actual,
    ActivityIndicator: () => null,
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider theme={MD3LightTheme}>{children}</PaperProvider>
);

describe('<LoadingScreen />', () => {
  test('renders without crashing', () => {
    const result = render(<LoadingScreen />, { wrapper: TestWrapper });
    expect(result).toBeTruthy();
  });

  test('displays message when provided', () => {
    const message = 'Loading data...';
    const { getByText } = render(<LoadingScreen message={message} />, {
      wrapper: TestWrapper,
    });

    getByText(message);
  });

  test('does not display message when not provided', () => {
    const { queryByText } = render(<LoadingScreen />, { wrapper: TestWrapper });

    expect(queryByText(/loading/i)).toBeNull();
  });
});

