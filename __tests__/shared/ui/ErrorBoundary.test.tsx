import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { getTheme } from '@/shared/ui/theme';
import {
  errorReporterSeam,
  type ErrorReporter,
} from '@/shared/integrations/errorReporter';
import { setColorScheme } from '@/testing';

// The app's routes load the auth service, which loads both storage modules.
// Lets a test make the root layout's session provider throw while rendering,
// to reach the app-level boundary instead of a route boundary.
let mockSessionProviderThrows = false;
jest.mock('@/shared/session/SessionProvider', () => {
  const actual = jest.requireActual('@/shared/session/SessionProvider');
  return {
    ...actual,
    SessionProvider: (props: { children: ReactNode }) => {
      if (mockSessionProviderThrows) {
        throw new Error('Session provider exploded');
      }
      return actual.SessionProvider(props);
    },
  };
});

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) {
    throw new Error('Boom from a screen');
  }
  return <Text>Recovered</Text>;
}

function backgroundOf(testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style)
    .backgroundColor;
}

describe('error boundaries', () => {
  let reporter: jest.Mocked<ErrorReporter>;

  beforeEach(() => {
    shouldThrow = true;
    mockSessionProviderThrows = false;
    reporter = {
      captureException: jest.fn(),
      captureMessage: jest.fn(),
      setUser: jest.fn(),
    };
    errorReporterSeam.set(reporter);
    // React and the logger print the caught error; keep the test output clean.
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorReporterSeam.reset();
    jest.restoreAllMocks();
  });

  describe.each(['light', 'dark'] as const)('in %s mode', scheme => {
    const theme = getTheme(scheme);

    beforeEach(() => {
      setColorScheme(scheme);
    });

    it('a route boundary catches a throwing screen, reports it, and renders a themed fallback', async () => {
      renderRouter(
        { appDir: './app', overrides: { '(tabs)/boom': Bomb } },
        { initialUrl: '/boom' }
      );

      expect(await screen.findByText('Something went wrong')).toBeTruthy();
      expect(screen.getByText('Boom from a screen')).toBeTruthy();
      expect(backgroundOf('error-fallback')).toBe(theme.colors.background);
      expect(
        StyleSheet.flatten(screen.getByText('Something went wrong').props.style)
          .color
      ).toBe(theme.colors.onErrorContainer);
      expect(reporter.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Boom from a screen' }),
        expect.objectContaining({
          message: 'Render error caught by a route error boundary',
        })
      );
    });

    it('the app boundary sits inside the theme provider and reports with the component stack', async () => {
      mockSessionProviderThrows = true;
      renderRouter('./app', { initialUrl: '/' });

      expect(await screen.findByText('Session provider exploded')).toBeTruthy();
      expect(backgroundOf('error-fallback')).toBe(theme.colors.background);
      expect(
        StyleSheet.flatten(screen.getByText('Something went wrong').props.style)
          .color
      ).toBe(theme.colors.onErrorContainer);
      expect(reporter.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Session provider exploded' }),
        {
          message: 'Render error caught by the app error boundary',
          extra: { componentStack: expect.stringContaining('SessionProvider') },
        }
      );
    });
  });

  it('"Go home" on a route boundary returns to Home', async () => {
    const app = renderRouter(
      { appDir: './app', overrides: { '(tabs)/boom': Bomb } },
      { initialUrl: '/boom' }
    );
    await screen.findByText('Something went wrong');

    fireEvent.press(screen.getByTestId('error-go-home'));

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });

  it('"Try again" on a route boundary re-renders the screen', async () => {
    renderRouter(
      { appDir: './app', overrides: { '(tabs)/boom': Bomb } },
      { initialUrl: '/boom' }
    );
    await screen.findByText('Something went wrong');

    shouldThrow = false;
    fireEvent.press(screen.getByTestId('error-retry'));

    expect(await screen.findByText('Recovered')).toBeTruthy();
  });

  describe('app boundary', () => {
    function renderBoundary() {
      return render(
        <PaperProvider theme={getTheme('light')}>
          <ErrorBoundary>
            <Bomb />
          </ErrorBoundary>
        </PaperProvider>
      );
    }

    it('"Try again" re-renders the children', () => {
      renderBoundary();
      expect(screen.getByText('Something went wrong')).toBeTruthy();

      shouldThrow = false;
      fireEvent.press(screen.getByTestId('error-retry'));

      expect(screen.getByText('Recovered')).toBeTruthy();
    });

    it('"Go home" navigates to Home and re-renders', () => {
      const replace = jest
        .spyOn(router, 'replace')
        .mockImplementation(() => {});
      renderBoundary();

      shouldThrow = false;
      fireEvent.press(screen.getByTestId('error-go-home'));

      expect(replace).toHaveBeenCalledWith('/');
      expect(screen.getByText('Recovered')).toBeTruthy();
    });

    it('renders a custom fallback, which can reset the boundary', () => {
      render(
        <PaperProvider theme={getTheme('light')}>
          <ErrorBoundary
            fallback={(error, reset) => (
              <Text onPress={reset} testID="custom-fallback">
                {`Custom: ${error.message}`}
              </Text>
            )}
          >
            <Bomb />
          </ErrorBoundary>
        </PaperProvider>
      );

      expect(screen.getByText('Custom: Boom from a screen')).toBeTruthy();
      expect(screen.queryByText('Something went wrong')).toBeNull();
      expect(reporter.captureException).toHaveBeenCalledTimes(1);

      shouldThrow = false;
      fireEvent.press(screen.getByTestId('custom-fallback'));
      expect(screen.getByText('Recovered')).toBeTruthy();
    });

    it('renders its children when nothing throws', () => {
      shouldThrow = false;
      renderBoundary();

      expect(screen.getByText('Recovered')).toBeTruthy();
      expect(reporter.captureException).not.toHaveBeenCalled();
    });

    it('reports in every build, with the component stack', () => {
      renderBoundary();

      expect(reporter.captureException).toHaveBeenCalledTimes(1);
      expect(reporter.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Boom from a screen' }),
        {
          message: 'Render error caught by the app error boundary',
          extra: { componentStack: expect.stringContaining('Bomb') },
        }
      );
    });
  });
});
