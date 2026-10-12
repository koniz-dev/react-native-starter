import fs from 'fs';
import path from 'path';
import type * as EnvModule from '@/shared/config/env';
import {
  DEFAULT_API_TIMEOUT_MS,
  parseEnv,
  readRawEnv,
  type RawEnv,
} from '@/shared/config/env';
// @demo remove-block-start
import { DEMO_BACKENDS } from '@/shared/config/env';
// @demo remove-block-end

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
        // @demo remove-block-start
        useDemoBackends: false,
        // @demo remove-block-end
        apiUrl: 'https://api.example.com',
        authApiUrl: 'https://auth.example.com',
        apiTrustedOrigins: [],
        apiTimeoutMs: DEFAULT_API_TIMEOUT_MS,
        logLevel: 'warn',
      },
    });
  });

  it('accepts base URLs with a path prefix', () => {
    const result = parseEnv(
      {
        ...valid,
        EXPO_PUBLIC_API_URL: 'https://example.com/api/v1',
        EXPO_PUBLIC_AUTH_API_URL: 'https://example.com/auth/',
      },
      false
    );
    expect(result.success && result.config).toMatchObject({
      apiUrl: 'https://example.com/api/v1',
      authApiUrl: 'https://example.com/auth/',
    });
  });

  it('parses and validates the API timeout', () => {
    const ok = parseEnv(
      { ...valid, EXPO_PUBLIC_API_TIMEOUT_MS: '30000' },
      false
    );
    expect(ok.success && ok.config.apiTimeoutMs).toBe(30000);
    for (const bad of ['abc', '500', '999999', '1.5']) {
      expect(
        issuesOf({ ...valid, EXPO_PUBLIC_API_TIMEOUT_MS: bad }).map(
          issue => issue.variable
        )
      ).toEqual(['EXPO_PUBLIC_API_TIMEOUT_MS']);
    }
  });

  it('defaults the log level per environment and accepts an override', () => {
    const levelFor = (raw: RawEnv) => {
      const result = parseEnv(raw, false);
      return result.success ? result.config.logLevel : null;
    };
    const devUrls = {
      EXPO_PUBLIC_API_URL: 'http://localhost:3000',
      EXPO_PUBLIC_AUTH_API_URL: 'http://localhost:3001',
    };

    expect(levelFor({ ...devUrls, EXPO_PUBLIC_APP_ENV: 'development' })).toBe(
      'debug'
    );
    expect(levelFor({ ...valid, EXPO_PUBLIC_APP_ENV: 'preview' })).toBe('info');
    expect(levelFor(valid)).toBe('warn');
    expect(levelFor({ ...valid, EXPO_PUBLIC_LOG_LEVEL: 'error' })).toBe(
      'error'
    );
    expect(levelFor({ ...valid, EXPO_PUBLIC_LOG_LEVEL: 'silent' })).toBe(
      'silent'
    );
    expect(issuesOf({ ...valid, EXPO_PUBLIC_LOG_LEVEL: 'verbose' })).toEqual([
      {
        variable: 'EXPO_PUBLIC_LOG_LEVEL',
        message: 'must be debug, info, warn, error, or silent',
      },
    ]);
  });

  it('reports every missing required URL', () => {
    expect(issuesOf({ EXPO_PUBLIC_APP_ENV: 'production' })).toEqual([
      {
        variable: 'EXPO_PUBLIC_API_URL',
        message: 'is required (set it in .env; see .env.example)',
      },
      {
        variable: 'EXPO_PUBLIC_AUTH_API_URL',
        message: 'is required (set it in .env; see .env.example)',
      },
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

  // @demo remove-block-start
  it('fills missing URLs from the demo backends only when the flag is on', () => {
    const result = parseEnv({ EXPO_PUBLIC_USE_DEMO_BACKENDS: 'true' }, true);
    expect(result).toEqual({
      success: true,
      config: expect.objectContaining({
        useDemoBackends: true,
        apiUrl: DEMO_BACKENDS.EXPO_PUBLIC_API_URL,
        authApiUrl: DEMO_BACKENDS.EXPO_PUBLIC_AUTH_API_URL,
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

  it('rejects a demo backends switch that is not true or false', () => {
    expect(
      issuesOf({ ...valid, EXPO_PUBLIC_USE_DEMO_BACKENDS: 'yes' }).map(
        issue => issue.variable
      )
    ).toEqual(['EXPO_PUBLIC_USE_DEMO_BACKENDS']);
  });
  // @demo remove-block-end

  it('defaults the app environment from the build type', () => {
    const base = {
      EXPO_PUBLIC_API_URL: 'https://api.example.com',
      EXPO_PUBLIC_AUTH_API_URL: 'https://auth.example.com',
    };
    const dev = parseEnv(base, true);
    const release = parseEnv(base, false);
    expect(dev.success && dev.config.appEnv).toBe('development');
    expect(release.success && release.config.appEnv).toBe('production');
  });

  it('rejects an unknown app environment', () => {
    expect(
      issuesOf({ ...valid, EXPO_PUBLIC_APP_ENV: 'staging' }).map(
        issue => issue.variable
      )
    ).toEqual(['EXPO_PUBLIC_APP_ENV']);
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

describe('readRawEnv', () => {
  // Expo inlines each process.env.EXPO_PUBLIC_* by its full name, so a typo
  // there silently drops the setting.
  it('reads every variable by its own name', () => {
    const keys = Object.keys(readRawEnv());
    const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    try {
      for (const key of keys) process.env[key] = `value-of-${key}`;
      const raw = readRawEnv();
      for (const key of keys) expect(raw[key]).toBe(`value-of-${key}`);
    } finally {
      for (const key of keys) {
        if (saved[key] === undefined) delete process.env[key];
        else process.env[key] = saved[key];
      }
    }
  });

  it('reads exactly the variables .env.example documents', () => {
    const example = fs.readFileSync(
      path.join(__dirname, '../../../.env.example'),
      'utf8'
    );
    const documented = [...example.matchAll(/^#? ?(EXPO_PUBLIC_[A-Z_]+)=/gm)]
      .map(match => match[1])
      .sort();
    expect(Object.keys(readRawEnv()).sort()).toEqual(documented);
  });
});

describe('getConfig', () => {
  it('throws a ConfigError naming the variables when configuration is invalid', () => {
    const previous = process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_API_URL;
    try {
      jest.isolateModules(() => {
        const env = jest.requireActual<typeof EnvModule>('@/shared/config/env');
        expect(env.configResult.success).toBe(false);
        expect(() => env.getConfig()).toThrow(env.ConfigError);
        expect(() => env.getConfig()).toThrow(/EXPO_PUBLIC_API_URL/);
      });
    } finally {
      process.env.EXPO_PUBLIC_API_URL = previous;
    }
  });
});
