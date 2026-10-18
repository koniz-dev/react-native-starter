import { AccessibilityInfo, Animated, Platform } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
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
    jest.replaceProperty(Platform, 'OS', 'ios');
    renderWithProviders(<ShowcaseScreen />);

    fireEvent.press(screen.getByText('Contained'));

    await waitFor(() =>
      expect(announce).toHaveBeenCalledWith('Contained pressed')
    );
  });

  it('announces the same message again when pressed again while it shows', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    jest.replaceProperty(Platform, 'OS', 'ios');
    renderWithProviders(<ShowcaseScreen />);

    fireEvent.press(screen.getByText('Contained'));
    await waitFor(() => expect(announce).toHaveBeenCalledTimes(1));
    fireEvent.press(screen.getByText('Contained'));

    await waitFor(() => expect(announce).toHaveBeenCalledTimes(2));
    expect(announce).toHaveBeenLastCalledWith('Contained pressed');
  });

  it('marks each section title as a heading', () => {
    renderWithProviders(<ShowcaseScreen />);
    for (const name of ['Buttons', 'Snackbar (Toast)']) {
      expect(screen.getByRole('header', { name })).toBeTruthy();
    }
  });

  describe('with animations that take their time, as on a device', () => {
    // Jest doesn't run native-driver animations on a device's schedule (a
    // 100 ms fade ends after about a second), which hid a repeat press
    // leaving the snackbar hidden (#130). Here an animation ends a frame
    // after its duration, as its end comes back from the UI thread.
    beforeEach(() => {
      jest.spyOn(Animated, 'timing').mockImplementation(((
        value: Animated.Value,
        config: { toValue: number; duration?: number }
      ) => ({
        start: (callback?: (result: { finished: boolean }) => void) => {
          setTimeout(
            () => {
              value.setValue(config.toValue);
              callback?.({ finished: true });
            },
            (config.duration ?? 0) + 16
          );
        },
        stop: () => {},
        reset: () => {},
      })) as unknown as typeof Animated.timing);
    });

    // Short act() slices, so React renders each update when it happens, as
    // on a device; one long act() would batch them.
    const wait = async (ms: number) => {
      for (let elapsed = 0; elapsed < ms; elapsed += 10) {
        await act(() => new Promise<void>(resolve => setTimeout(resolve, 10)));
      }
    };
    const shown = (text: string) => screen.queryByText(text) !== null;

    it('keeps showing the snackbar after the same button is pressed again', async () => {
      renderWithProviders(<ShowcaseScreen />);
      await wait(300);

      fireEvent.press(screen.getByText('Contained'));
      await wait(500);
      expect(shown('Contained pressed')).toBe(true);

      fireEvent.press(screen.getByText('Contained'));
      await wait(600);
      expect(shown('Contained pressed')).toBe(true);

      fireEvent.press(screen.getByText('Outlined'));
      await wait(600);
      expect(shown('Outlined pressed')).toBe(true);
    });

    it('closes the snackbar with Dismiss', async () => {
      renderWithProviders(<ShowcaseScreen />);
      await wait(300);
      fireEvent.press(screen.getByText('Show Snackbar'));
      await wait(400);
      expect(shown('This is a snackbar message!')).toBe(true);

      fireEvent.press(screen.getByText('Dismiss'));

      // Its fade-out, well before the snackbar's own 3-second timeout.
      await wait(300);
      expect(shown('This is a snackbar message!')).toBe(false);
    });
  });
});
