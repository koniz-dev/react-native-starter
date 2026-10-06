import type { ExpoConfig } from 'expo/config';
import appConfig from '../../app.config';

function resolve(env: Record<string, string | undefined>): ExpoConfig {
  const previous = { ...process.env };
  Object.assign(process.env, env);
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
  }
  try {
    return appConfig({
      config: {},
      projectRoot: '',
      staticConfigPath: null,
      packageJsonPath: null,
    });
  } finally {
    process.env = previous;
  }
}

describe('app.config.ts variants', () => {
  it.each([
    [
      undefined,
      'RN Starter (Dev)',
      'com.example.rnstarter.dev',
      'rnstarter-dev',
    ],
    [
      'development',
      'RN Starter (Dev)',
      'com.example.rnstarter.dev',
      'rnstarter-dev',
    ],
    [
      'preview',
      'RN Starter (Preview)',
      'com.example.rnstarter.preview',
      'rnstarter-preview',
    ],
    ['production', 'RN Starter', 'com.example.rnstarter', 'rnstarter'],
  ])('APP_VARIANT=%s', (variant, name, bundleId, scheme) => {
    const config = resolve({
      APP_VARIANT: variant,
      APP_BUILD_NUMBER: undefined,
    });
    expect(config.name).toBe(name);
    expect(config.scheme).toBe(scheme);
    expect(config.ios?.bundleIdentifier).toBe(bundleId);
    expect(config.android?.package).toBe(bundleId);
    expect(config.extra?.appVariant).toBe(variant ?? 'development');
  });

  it('gives each variant a distinct bundle ID and scheme', () => {
    const configs = ['development', 'preview', 'production'].map(variant =>
      resolve({ APP_VARIANT: variant })
    );
    expect(new Set(configs.map(c => c.android?.package)).size).toBe(3);
    expect(new Set(configs.map(c => c.scheme)).size).toBe(3);
  });

  it('uses APP_BUILD_NUMBER for the iOS build number and Android version code', () => {
    const config = resolve({
      APP_VARIANT: 'production',
      APP_BUILD_NUMBER: '42',
    });
    expect(config.ios?.buildNumber).toBe('42');
    expect(config.android?.versionCode).toBe(42);
  });

  it('rejects an unknown variant or an invalid build number', () => {
    expect(() => resolve({ APP_VARIANT: 'staging' })).toThrow(/APP_VARIANT/);
    expect(() =>
      resolve({ APP_VARIANT: 'production', APP_BUILD_NUMBER: '0' })
    ).toThrow(/APP_BUILD_NUMBER/);
  });

  it('configures the splash screen with light and dark backgrounds', () => {
    const plugins = resolve({ APP_VARIANT: 'production' }).plugins ?? [];
    const splash = plugins.find(
      plugin => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
    ) as [string, Record<string, unknown>] | undefined;
    expect(splash?.[1]).toMatchObject({
      image: './assets/splash-icon.png',
      backgroundColor: expect.any(String),
      dark: { backgroundColor: expect.any(String) },
    });
  });
});
