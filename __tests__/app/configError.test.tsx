import * as SplashScreen from 'expo-splash-screen';
import { renderRouter, screen } from 'expo-router/testing-library';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// Simulate a build without .env: no backend URLs.
jest.mock('@/shared/config/env', () => {
  const actual = jest.requireActual('@/shared/config/env');
  const configResult = actual.parseEnv({}, true);
  return {
    ...actual,
    configResult,
    getConfig: () => {
      throw new actual.ConfigError(configResult.issues);
    },
  };
});

describe('startup with invalid configuration', () => {
  test('shows the configuration error screen instead of the app', async () => {
    renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Configuration error')).toBeTruthy();
    expect(screen.getByText('EXPO_PUBLIC_API_URL')).toBeTruthy();
    expect(screen.getByText('EXPO_PUBLIC_AUTH_API_URL')).toBeTruthy();
    expect(screen.queryByText('Session')).toBeNull();
    // Otherwise the splash would cover the error screen.
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });
});
