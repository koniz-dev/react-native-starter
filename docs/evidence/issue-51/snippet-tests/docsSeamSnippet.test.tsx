import { act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { analyticsSeam, type Analytics } from '@/shared/integrations/analytics';
import { configureIntegrations } from '@/shared/integrations/setup';

const provider: Analytics = {
  track: jest.fn(),
  screen: jest.fn(),
  identify: jest.fn(),
};

beforeEach(() => {
  configureIntegrations(); // the app's providers first
  analyticsSeam.set(provider); // then this test's mock
});
afterEach(() => analyticsSeam.reset());

it('reports a screen view for each route', async () => {
  renderRouter('./app', { initialUrl: '/' });
  await screen.findByText('Not signed in');
  expect(provider.screen).toHaveBeenLastCalledWith('/');

  act(() => router.push('/login'));
  await screen.findByText('Welcome Back');
  expect(provider.screen).toHaveBeenLastCalledWith('/login');
});
