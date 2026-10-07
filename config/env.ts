/**
 * Validated environment configuration.
 *
 * This is the only module that reads `process.env`. Expo inlines each
 * `process.env.EXPO_PUBLIC_*` reference at build time, so every variable is
 * read by its full name below. The values are parsed once, when this module
 * loads; parsing never throws. The root layout checks `configResult` and
 * shows a startup error screen when it fails, and services read values
 * lazily through `getConfig()`, so an invalid configuration can't crash the
 * app before that screen renders.
 */
import { z } from 'zod';

export type AppEnv = 'development' | 'preview' | 'production';

/** Minimum level the logger writes to the console (see utils/logger.ts). */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/** Console log level per environment when EXPO_PUBLIC_LOG_LEVEL is not set. */
export const DEFAULT_LOG_LEVELS: Record<AppEnv, LogLevel> = {
  development: 'debug',
  preview: 'info',
  production: 'warn',
};

export interface AppConfig {
  appEnv: AppEnv;
  /** True when the public demo backends fill in missing URLs. */
  useDemoBackends: boolean;
  apiUrl: string;
  authApiUrl: string;
  /** Extra origins allowed to receive the auth token (see services/api.ts). */
  apiTrustedOrigins: string[];
  /** Request timeout for the HTTP clients, in milliseconds. */
  apiTimeoutMs: number;
  /** Minimum level the logger writes to the console. */
  logLevel: LogLevel;
}

/** Public demo backends, used only when EXPO_PUBLIC_USE_DEMO_BACKENDS=true. */
export const DEMO_BACKENDS = {
  apiUrl: 'https://jsonplaceholder.typicode.com',
  authApiUrl: 'https://dummyjson.com',
} as const;

export type RawEnv = Record<string, string | undefined>;

/** Reads the variables this app uses. Each must be referenced by full name. */
export function readRawEnv(): RawEnv {
  return {
    EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
    EXPO_PUBLIC_USE_DEMO_BACKENDS: process.env.EXPO_PUBLIC_USE_DEMO_BACKENDS,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_AUTH_API_URL: process.env.EXPO_PUBLIC_AUTH_API_URL,
    EXPO_PUBLIC_API_TRUSTED_ORIGINS:
      process.env.EXPO_PUBLIC_API_TRUSTED_ORIGINS,
    EXPO_PUBLIC_API_TIMEOUT_MS: process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
    EXPO_PUBLIC_LOG_LEVEL: process.env.EXPO_PUBLIC_LOG_LEVEL,
  };
}

/** Empty strings count as "not set", which is how dotenv reports `KEY=`. */
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform(value => (value ? value : undefined));

const isHttpUrl = (value: string) => /^https?:\/\/[^/?#\s]+/i.test(value);

const urlField = optionalString.refine(
  value => value === undefined || isHttpUrl(value),
  { message: 'must be an absolute http(s) URL, e.g. https://api.example.com' }
);

const schema = z.object({
  EXPO_PUBLIC_APP_ENV: z
    .enum(['development', 'preview', 'production'], {
      message: 'must be development, preview, or production',
    })
    .optional(),
  EXPO_PUBLIC_USE_DEMO_BACKENDS: optionalString.refine(
    value => value === undefined || value === 'true' || value === 'false',
    { message: 'must be true or false' }
  ),
  EXPO_PUBLIC_API_URL: urlField,
  EXPO_PUBLIC_AUTH_API_URL: urlField,
  EXPO_PUBLIC_API_TRUSTED_ORIGINS: optionalString,
  EXPO_PUBLIC_API_TIMEOUT_MS: optionalString.refine(
    value =>
      value === undefined ||
      (/^\d+$/.test(value) && Number(value) >= 1000 && Number(value) <= 120000),
    {
      message: 'must be a whole number of milliseconds between 1000 and 120000',
    }
  ),
  EXPO_PUBLIC_LOG_LEVEL: optionalString.refine(
    value =>
      value === undefined ||
      ['debug', 'info', 'warn', 'error', 'silent'].includes(value),
    { message: 'must be debug, info, warn, error, or silent' }
  ),
});

/** Default request timeout when EXPO_PUBLIC_API_TIMEOUT_MS is not set. */
export const DEFAULT_API_TIMEOUT_MS = 15000;

export interface ConfigIssue {
  variable: string;
  message: string;
}

export type ConfigResult =
  | { success: true; config: AppConfig }
  | { success: false; issues: ConfigIssue[] };

/**
 * Parses raw environment values into an AppConfig, or returns every problem
 * found. `isDevBuild` defaults the app environment when EXPO_PUBLIC_APP_ENV
 * is not set (development for dev builds, production otherwise).
 */
export function parseEnv(raw: RawEnv, isDevBuild: boolean): ConfigResult {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map(issue => ({
        variable: String(issue.path[0] ?? 'environment'),
        message: issue.message,
      })),
    };
  }

  const env = parsed.data;
  const appEnv: AppEnv =
    env.EXPO_PUBLIC_APP_ENV ?? (isDevBuild ? 'development' : 'production');
  const useDemoBackends = env.EXPO_PUBLIC_USE_DEMO_BACKENDS === 'true';
  const issues: ConfigIssue[] = [];

  const requireUrl = (
    variable: 'EXPO_PUBLIC_API_URL' | 'EXPO_PUBLIC_AUTH_API_URL',
    demoUrl: string
  ): string => {
    const value = env[variable] ?? (useDemoBackends ? demoUrl : undefined);
    if (!value) {
      issues.push({
        variable,
        message:
          'is required (set it in .env, or set EXPO_PUBLIC_USE_DEMO_BACKENDS=true to use the public demo backends)',
      });
      return '';
    }
    if (appEnv !== 'development' && !/^https:\/\//i.test(value)) {
      issues.push({
        variable,
        message: `must use https outside development (APP_ENV is ${appEnv})`,
      });
    }
    return value;
  };

  const apiUrl = requireUrl('EXPO_PUBLIC_API_URL', DEMO_BACKENDS.apiUrl);
  const authApiUrl = requireUrl(
    'EXPO_PUBLIC_AUTH_API_URL',
    DEMO_BACKENDS.authApiUrl
  );

  const apiTrustedOrigins = (env.EXPO_PUBLIC_API_TRUSTED_ORIGINS ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  for (const origin of apiTrustedOrigins) {
    if (!isHttpUrl(origin)) {
      issues.push({
        variable: 'EXPO_PUBLIC_API_TRUSTED_ORIGINS',
        message: `"${origin}" is not an absolute http(s) URL`,
      });
    } else if (appEnv !== 'development' && !/^https:\/\//i.test(origin)) {
      issues.push({
        variable: 'EXPO_PUBLIC_API_TRUSTED_ORIGINS',
        message: `"${origin}" must use https outside development`,
      });
    }
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }
  return {
    success: true,
    config: {
      appEnv,
      useDemoBackends,
      apiUrl,
      authApiUrl,
      apiTrustedOrigins,
      apiTimeoutMs: env.EXPO_PUBLIC_API_TIMEOUT_MS
        ? Number(env.EXPO_PUBLIC_API_TIMEOUT_MS)
        : DEFAULT_API_TIMEOUT_MS,
      logLevel:
        (env.EXPO_PUBLIC_LOG_LEVEL as LogLevel | undefined) ??
        DEFAULT_LOG_LEVELS[appEnv],
    },
  };
}

/** The result of parsing this build's environment, computed once at load. */
export const configResult: ConfigResult = parseEnv(
  readRawEnv(),
  typeof __DEV__ !== 'undefined' && __DEV__
);

export class ConfigError extends Error {
  constructor(public readonly issues: ConfigIssue[]) {
    super(
      `Invalid configuration: ${issues
        .map(issue => `${issue.variable} ${issue.message}`)
        .join('; ')}`
    );
    this.name = 'ConfigError';
  }
}

/**
 * Returns the validated configuration. Throws ConfigError if it is invalid;
 * the root layout shows the startup error screen before any caller runs.
 */
export function getConfig(): AppConfig {
  if (!configResult.success) {
    throw new ConfigError(configResult.issues);
  }
  return configResult.config;
}
