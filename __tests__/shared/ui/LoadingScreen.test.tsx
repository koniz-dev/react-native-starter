import { StyleSheet } from 'react-native';
import { screen } from '@testing-library/react-native';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';
import { getTheme } from '@/shared/ui/theme';
import { renderWithProviders } from '@/testing';

describe('<LoadingScreen />', () => {
  it.each(['light', 'dark'] as const)(
    'shows a progress indicator and the message in the %s theme',
    scheme => {
      const theme = getTheme(scheme);
      renderWithProviders(<LoadingScreen message="Loading data..." />, {
        scheme,
      });

      expect(screen.getByRole('progressbar')).toBeTruthy();
      const message = screen.getByText('Loading data...');
      expect(StyleSheet.flatten(message.props.style).color).toBe(
        theme.colors.onSurfaceVariant
      );
      expect(
        StyleSheet.flatten(screen.getByTestId('loading-screen').props.style)
          .backgroundColor
      ).toBe(theme.colors.background);
    }
  );

  it('shows only the indicator without a message', () => {
    renderWithProviders(<LoadingScreen />);

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.queryByText(/./)).toBeNull();
  });
});
