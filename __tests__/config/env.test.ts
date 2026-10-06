import { DEMO_BACKENDS, parseEnv, type RawEnv } from '@/config/env';

const valid: RawEnv = {
  EXPO_PUBLIC_APP_ENV: 'production',
  EXPO_PUBLIC_API_URL: 'https://api.example.com',
  EXPO_PUBLIC_AUTH_API_URL: 'https://auth.example.com',
};

function issuesOf(raw: RawEnv, isDevBuild = false) {
  const result = parseEnv(raw, isDevBuild);
  return result.success ? [] : result.issues;
}

describe('parseEnv', () => {
  it('accepts a complete production configuration', () => {
    expect(parseEnv(valid, false)).toEqual({
      success: true,
      config: {
        appEnv: 'production',
        useDemoBackends: false,
        apiUrl: 'https://api.example.com',
        authApiUrl: 'https://auth.example.com',
        apiTrustedOrigins: [],
      },
    });
  });

  it('reports every missing required URL when demo backends are off', () => {
    expect(issuesOf({ EXPO_PUBLIC_APP_ENV: 'production' })).toEqual([
      expect.objectContaining({ variable: 'EXPO_PUBLIC_API_URL' }),
      expect.objectContaining({ variable: 'EXPO_PUBLIC_AUTH_API_URL' }),
    ]);
  });

  it('treats an empty value (KEY=) as missing', () => {
    expect(issuesOf({ ...valid, EXPO_PUBLIC_API_URL: '  ' })).toEqual([
      expect.objectContaining({
        variable: 'EXPO_PUBLIC_API_URL',
        message: expect.stringContaining('is required'),
      }),
    ]);
  });

  it('rejects a URL that is not absolute http(s)', () => {
    expect(
      issuesOf({ ...valid, EXPO_PUBLIC_API_URL: 'api.example.com' })
    ).toEqual([
      expect.objectContaining({
        variable: 'EXPO_PUBLIC_API_URL',
        message: expect.stringContaining('absolute http(s) URL'),
      }),
    ]);
  });

  it('rejects http outside development and allows it in development', () => {
    const httpApi = { ...valid, EXPO_PUBLIC_API_URL: 'http://api.example.com' };
    expect(issuesOf(httpApi)).toEqual([
      expect.objectContaining({
        variable: 'EXPO_PUBLIC_API_URL',
        message: expect.stringContaining('https outside development'),
      }),
    ]);
    expect(
      issuesOf({ ...httpApi, EXPO_PUBLIC_APP_ENV: 'preview' })
    ).toHaveLength(1);
    expect(
      issuesOf({ ...httpApi, EXPO_PUBLIC_APP_ENV: 'development' })
    ).toEqual([]);
  });

  it('fills missing URLs from the demo backends only when the flag is on', () => {
    const result = parseEnv({ EXPO_PUBLIC_USE_DEMO_BACKENDS: 'true' }, true);
    expect(result).toEqual({
      success: true,
      config: expect.objectContaining({
        useDemoBackends: true,
        apiUrl: DEMO_BACKENDS.apiUrl,
        authApiUrl: DEMO_BACKENDS.authApiUrl,
      }),
    });
    expect(
      issuesOf({ EXPO_PUBLIC_USE_DEMO_BACKENDS: 'false' }, true)
    ).toHaveLength(2);
  });

  it('prefers explicit URLs over the demo backends', () => {
    const result = parseEnv(
      { ...valid, EXPO_PUBLIC_USE_DEMO_BACKENDS: 'true' },
      false
    );
    expect(result.success && result.config.apiUrl).toBe(
      'https://api.example.com'
    );
  });

  it('defaults the app environment from the build type', () => {
    const base = { EXPO_PUBLIC_USE_DEMO_BACKENDS: 'true' };
    const dev = parseEnv(base, true);
    const release = parseEnv(base, false);
    expect(dev.success && dev.config.appEnv).toBe('development');
    expect(release.success && release.config.appEnv).toBe('production');
  });

  it('rejects unknown values for enums and booleans', () => {
    expect(
      issuesOf({ ...valid, EXPO_PUBLIC_APP_ENV: 'staging' }).map(
        issue => issue.variable
      )
    ).toEqual(['EXPO_PUBLIC_APP_ENV']);
    expect(
      issuesOf({ ...valid, EXPO_PUBLIC_USE_DEMO_BACKENDS: 'yes' }).map(
        issue => issue.variable
      )
    ).toEqual(['EXPO_PUBLIC_USE_DEMO_BACKENDS']);
  });

  it('parses and validates trusted origins', () => {
    const ok = parseEnv(
      {
        ...valid,
        EXPO_PUBLIC_API_TRUSTED_ORIGINS:
          ' https://a.example.com , ,https://b.example.com ',
      },
      false
    );
    expect(ok.success && ok.config.apiTrustedOrigins).toEqual([
      'https://a.example.com',
      'https://b.example.com',
    ]);
    expect(
      issuesOf({ ...valid, EXPO_PUBLIC_API_TRUSTED_ORIGINS: 'not-a-url' })
    ).toEqual([
      expect.objectContaining({ variable: 'EXPO_PUBLIC_API_TRUSTED_ORIGINS' }),
    ]);
    expect(
      issuesOf({
        ...valid,
        EXPO_PUBLIC_API_TRUSTED_ORIGINS: 'http://a.example.com',
      })
    ).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('https outside development'),
      }),
    ]);
  });
});

describe('getConfig', () => {
  it('throws a ConfigError naming the variables when configuration is invalid', () => {
    const previous = process.env.EXPO_PUBLIC_USE_DEMO_BACKENDS;
    delete process.env.EXPO_PUBLIC_USE_DEMO_BACKENDS;
    try {
      jest.isolateModules(() => {
        const env =
          jest.requireActual<typeof import('@/config/env')>('@/config/env');
        expect(env.configResult.success).toBe(false);
        expect(() => env.getConfig()).toThrow(env.ConfigError);
        expect(() => env.getConfig()).toThrow(/EXPO_PUBLIC_API_URL/);
      });
    } finally {
      process.env.EXPO_PUBLIC_USE_DEMO_BACKENDS = previous;
    }
  });
});
