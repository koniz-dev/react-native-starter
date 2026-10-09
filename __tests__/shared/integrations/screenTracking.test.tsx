import { act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { analyticsSeam, type Analytics } from '@/shared/integrations/analytics';

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

describe('screen tracking', () => {
  afterEach(() => analyticsSeam.reset());

  it('reports a screen view for the initial route and each navigation', async () => {
    const provider: Analytics = {
      track: jest.fn(),
      screen: jest.fn(),
      identify: jest.fn(),
    };
    analyticsSeam.set(provider);

    renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('Not signed in');
    expect(provider.screen).toHaveBeenLastCalledWith('/');

    act(() => router.push('/login'));
    await screen.findByText('Welcome Back');
    expect(provider.screen).toHaveBeenLastCalledWith('/login');
  });
});
