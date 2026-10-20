import { screen } from '@testing-library/react-native';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';
import { getTheme } from '@/shared/ui/theme';
import { renderWithProviders, setColorScheme } from '@/testing';

const background = () =>
  screen
    .getByTestId('loading-screen')
    .props.style.find(
      (style: unknown) =>
        typeof style === 'object' &&
        style !== null &&
        'backgroundColor' in style
    ).backgroundColor;

describe('renderWithProviders', () => {
  it('uses the scheme setColorScheme() set', async () => {
    setColorScheme('dark');
    await renderWithProviders(<LoadingScreen />);
    expect(background()).toBe(getTheme('dark').colors.background);
  });

  it('uses the scheme it is given over the system one', async () => {
    setColorScheme('dark');
    await renderWithProviders(<LoadingScreen />, { scheme: 'light' });
    expect(background()).toBe(getTheme('light').colors.background);
  });
});
