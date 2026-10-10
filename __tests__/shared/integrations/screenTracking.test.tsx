import { act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { analyticsSeam, type Analytics } from '@/shared/integrations/analytics';
import { configureIntegrations } from '@/shared/integrations/setup';

describe('screen tracking', () => {
  afterEach(() => analyticsSeam.reset());

  it('reports a screen view for the initial route and each navigation', async () => {
    const provider: Analytics = {
      track: jest.fn(),
      screen: jest.fn(),
      identify: jest.fn(),
    };
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
});
