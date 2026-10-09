import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { ShowcaseScreen } from '@/features/demo-showcase/screens/ShowcaseScreen';
import { lightTheme } from '@/shared/ui/theme';

// The screen sets its header through <Stack.Screen>, which needs a navigator.
jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));

const Wrapper = ({ children }: { children: ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <PaperProvider theme={lightTheme}>{children}</PaperProvider>
  </SafeAreaProvider>
);

describe('<ShowcaseScreen />', () => {
  it('renders the component sections', () => {
    render(<ShowcaseScreen />, { wrapper: Wrapper });

    for (const text of [
      'React Native Paper',
      'Material Design 3 Components',
      'Text Variants',
      'Headline Small',
      'Buttons',
      'Card',
      'Surface',
      'Snackbar (Toast)',
    ]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it.each([
    ['Contained', 'Contained pressed'],
    ['Outlined', 'Outlined pressed'],
    ['Ok', 'Card: Ok pressed'],
    ['Show Snackbar', 'This is a snackbar message!'],
  ])('pressing %s shows "%s" in the snackbar', async (button, message) => {
    render(<ShowcaseScreen />, { wrapper: Wrapper });
    expect(screen.queryByText(message)).toBeNull();

    fireEvent.press(screen.getByText(button));

    expect(await screen.findByText(message)).toBeTruthy();
  });
});
