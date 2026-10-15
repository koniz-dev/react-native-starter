import { AccessibilityInfo, Platform } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ShowcaseScreen } from '@/features/demo-showcase/screens/ShowcaseScreen';
import { renderWithProviders } from '@/testing';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';

// The screen sets its header through <Stack.Screen>, which needs a navigator.
const mockScreenOptions = jest.fn();
jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: unknown }) => {
      mockScreenOptions(options);
      return null;
    },
  },
}));

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

  it('shows a header with a back button, and titles the browser tab', () => {
    renderWithProviders(<ShowcaseScreen />);
    expect(mockScreenOptions).toHaveBeenCalledWith({
      headerShown: true,
      title: 'Component showcase',
    });
    expect(screen.UNSAFE_getByType(DocumentTitle).props.title).toBe(
      'Component showcase'
    );
  });

  it('announces the snackbar on iOS, which has no live regions', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const os = jest.replaceProperty(Platform, 'OS', 'ios');
    renderWithProviders(<ShowcaseScreen />);

    fireEvent.press(screen.getByText('Contained'));

    await waitFor(() =>
      expect(announce).toHaveBeenCalledWith('Contained pressed')
    );
    os.restore();
    announce.mockRestore();
  });

  it('marks each section title as a heading', () => {
    renderWithProviders(<ShowcaseScreen />);
    for (const name of ['Buttons', 'Snackbar (Toast)']) {
      expect(screen.getByRole('header', { name })).toBeTruthy();
    }
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
