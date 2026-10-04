import { StatusBar as NativeStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { renderRouter, screen } from 'expo-router/testing-library';

// The login route imports the auth service, which loads both storage modules.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

const mockColorScheme = jest.fn<'light' | 'dark', []>(() => 'light');
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

describe.each([
  ['light', 'dark', 'dark-content'],
  ['dark', 'light', 'light-content'],
] as const)(
  'status bar in %s mode',
  (scheme, expectedStyle, expectedBarStyle) => {
    beforeEach(() => {
      mockColorScheme.mockReturnValue(scheme);
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
