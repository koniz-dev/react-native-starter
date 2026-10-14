import { renderRouter, screen } from 'expo-router/testing-library';
import * as setup from '@/shared/integrations/setup';
import { logger } from '@/shared/lib/logger';

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

describe('integration setup that throws', () => {
  it('is logged, and the app still shows the configuration error screen', async () => {
    // A provider registered in configureIntegrations() that reads the
    // (invalid) configuration, e.g. a DSN from getConfig().
    const failure = new Error('Invalid configuration: EXPO_PUBLIC_API_URL');
    jest.spyOn(setup, 'configureIntegrations').mockImplementation(() => {
      throw failure;
    });
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => {});

    // Loads app/_layout.tsx for the first time in this file.
    renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Configuration error')).toBeTruthy();
    expect(logError).toHaveBeenCalledWith(
      'Configuring integrations failed',
      failure
    );
  });
});
