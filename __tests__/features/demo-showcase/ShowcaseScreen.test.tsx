import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ShowcaseScreen } from '@/features/demo-showcase/screens/ShowcaseScreen';
import { renderWithProviders } from '@/testing';

// The screen sets its header through <Stack.Screen>, which needs a navigator.
jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));

describe('<ShowcaseScreen />', () => {
  it.each([
    ['Contained', 'Contained pressed'],
    ['Outlined', 'Outlined pressed'],
    ['Ok', 'Card: Ok pressed'],
    ['Show Snackbar', 'This is a snackbar message!'],
  ])('pressing %s shows "%s" in the snackbar', async (button, message) => {
    renderWithProviders(<ShowcaseScreen />);
    expect(screen.queryByText(message)).toBeNull();

    fireEvent.press(screen.getByText(button));

    expect(await screen.findByText(message)).toBeTruthy();
  });

  it('closes the snackbar with Dismiss', async () => {
    renderWithProviders(<ShowcaseScreen />);
    fireEvent.press(screen.getByText('Show Snackbar'));
    expect(await screen.findByText('This is a snackbar message!')).toBeTruthy();

    fireEvent.press(screen.getByText('Dismiss'));

    // Well before the snackbar's own 3-second timeout.
    await waitFor(() =>
      expect(screen.queryByText('This is a snackbar message!')).toBeNull()
    );
  });
});
