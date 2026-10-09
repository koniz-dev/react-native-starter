import { StatusBar as NativeStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { renderRouter, screen } from 'expo-router/testing-library';
import { setColorScheme } from '@/testing';

// The login route imports the auth service, which loads both storage modules.
describe.each([
  ['light', 'dark', 'dark-content'],
  ['dark', 'light', 'light-content'],
] as const)(
  'status bar in %s mode',
  (scheme, expectedStyle, expectedBarStyle) => {
    beforeEach(() => {
      setColorScheme(scheme);
    });

    test(`uses ${expectedStyle} icons`, async () => {
      renderRouter('./app', { initialUrl: '/' });
      await screen.findByText('Not signed in');

      expect(screen.UNSAFE_getByType(StatusBar).props.style).toBe(
        expectedStyle
      );
      expect(screen.UNSAFE_getByType(NativeStatusBar).props.barStyle).toBe(
        expectedBarStyle
      );
    });
  }
);
