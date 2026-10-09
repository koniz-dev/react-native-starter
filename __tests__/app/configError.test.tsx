import { renderRouter, screen } from 'expo-router/testing-library';

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
