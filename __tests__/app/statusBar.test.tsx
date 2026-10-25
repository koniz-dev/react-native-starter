import { StatusBar as NativeStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { renderRouter, screen } from 'expo-router/testing-library';
import { setColorScheme } from '@/testing';

// The test renderer keeps only host elements: record the props expo's
// StatusBar is given, and still render it.
jest.mock('expo-status-bar', () => {
  const actual = jest.requireActual('expo-status-bar');
  const { createElement } = jest.requireActual('react');
  return {
    ...actual,
    StatusBar: jest.fn((props: object) =>
      createElement(actual.StatusBar, props)
    ),
  };
});

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
      const nativeRender = jest.spyOn(NativeStatusBar.prototype, 'render');
      await renderRouter('./app', { initialUrl: '/' });
      await screen.findByText('Not signed in');

      expect(jest.mocked(StatusBar).mock.lastCall?.[0].style).toBe(
        expectedStyle
      );
      // The props React Native's StatusBar renders with.
      const native = nativeRender.mock.contexts.at(-1) as NativeStatusBar;
      expect(native.props.barStyle).toBe(expectedBarStyle);
    });
  }
);
