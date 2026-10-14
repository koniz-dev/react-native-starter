import { Text } from 'react-native';
import { act } from '@testing-library/react-native';
import { router, Slot } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { analyticsSeam, type Analytics } from '@/shared/integrations/analytics';
import { configureIntegrations } from '@/shared/integrations/setup';
import { useScreenTracking } from '@/shared/integrations/useScreenTracking';
import { logger } from '@/shared/lib/logger';

function fakeAnalytics(): Analytics {
  return { track: jest.fn(), screen: jest.fn(), identify: jest.fn() };
}

describe('screen tracking', () => {
  afterEach(() => analyticsSeam.reset());

  it('reports a screen view for the initial route and each navigation', async () => {
    const provider = fakeAnalytics();
    // Register the app's providers first: rendering ./app runs
    // configureIntegrations(), which would replace this test's one.
    configureIntegrations();
    analyticsSeam.set(provider);

    renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('Not signed in');
    expect(provider.screen).toHaveBeenLastCalledWith('/');

    act(() => router.push('/login'));
    await screen.findByText('Welcome Back');
    expect(provider.screen).toHaveBeenLastCalledWith('/login');
  });

  /** A small app with a dynamic route, tracked like app/_layout.tsx does. */
  function TrackedLayout() {
    useScreenTracking();
    return <Slot />;
  }
  const app = {
    _layout: TrackedLayout,
    index: () => <Text>Home</Text>,
    '(account)/reset/[token]': () => <Text>Reset</Text>,
  };

  it('names a dynamic route by its pattern, never by the values in the URL', async () => {
    const provider = fakeAnalytics();
    analyticsSeam.set(provider);

    renderRouter(app, { initialUrl: '/reset/SECRET-RESET-TOKEN' });
    await screen.findByText('Reset');

    expect(provider.screen).toHaveBeenCalledWith('/reset/[token]');
    expect(JSON.stringify(jest.mocked(provider.screen).mock.calls)).not.toMatch(
      /SECRET/
    );
  });

  it('logs a provider that throws, and the app keeps working', async () => {
    const failure = new Error('analytics SDK not ready');
    analyticsSeam.set({
      ...fakeAnalytics(),
      screen: () => {
        throw failure;
      },
    });
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => {});

    renderRouter(app, { initialUrl: '/' });
    await screen.findByText('Home');
    act(() => router.push('/reset/abc'));

    expect(await screen.findByText('Reset')).toBeTruthy();
    expect(logError).toHaveBeenCalledWith(
      'Analytics failed to record a screen view',
      failure
    );
  });
});
