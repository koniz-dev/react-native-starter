import { renderRouter, screen } from 'expo-router/testing-library';

// Simulate a build without .env: no demo flag and no backend URLs.
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
  });
});
