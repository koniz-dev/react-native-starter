import { act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { unstable_settings } from '@/app/_layout';

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

describe('initial route', () => {
  test('anchors the root stack on the tabs group', () => {
    expect(unstable_settings.initialRouteName).toBe('(tabs)');
  });

  test('/ renders the Home tab', async () => {
    const app = renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Session')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
    expect(screen.queryByText('Welcome Back')).toBeNull();
  });

  test('/login renders the Login screen', async () => {
    const app = renderRouter('./app', { initialUrl: '/login' });

    expect(await screen.findByText('Welcome Back')).toBeTruthy();
    expect(app.getPathname()).toBe('/login');
  });

  test('going back from a deep-linked /login returns to Home', async () => {
    const app = renderRouter('./app', { initialUrl: '/login' });
    await screen.findByText('Welcome Back');

    expect(router.canGoBack()).toBe(true);
    act(() => router.back());

    expect(await screen.findByText('Session')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });
});
