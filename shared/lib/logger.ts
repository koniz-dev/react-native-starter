/**
 * The app's logger. App code logs through it instead of `console` (ESLint
 * `no-console` enforces this).
 *
 * - Levels: debug < info < warn < error. Messages below the configured
 *   minimum (EXPO_PUBLIC_LOG_LEVEL; by default debug in development, info in
 *   preview, warn in production) are not written to the console.
 * - `logger.error` is also forwarded to the error-reporting seam
 *   (shared/integrations/errorReporter.ts) in every build, whatever the level.
 * - Context is redacted before it is written or reported: auth headers,
 *   cookies, tokens, and passwords always; response bodies (`data`, `body`)
 *   and Error extras outside development.
 *
 * @example
 * ```ts
 * logger.debug('Cache hit', { key });
 * logger.warn('Retrying request', { attempt });
 * logger.error('Failed to save settings', error, { key });
 * ```
 */
import { configResult, type LogLevel } from '@/shared/config/env';
import { getErrorReporter } from '@/shared/integrations/errorReporter';

export type LogContext = Record<string, unknown>;

export interface LoggerSettings {
  /** Minimum level written to the console. */
  minLevel: LogLevel;
  /**
   * Development keeps response bodies and Error stacks in logs, and writes
   * the original Error to the console.
   */
  development: boolean;
}

export interface Logger {
  debug(message: string, context?: LogContext | null): void;
  info(message: string, context?: LogContext | null): void;
  warn(message: string, context?: LogContext | null): void;
  /** Writes at error level and reports `error` (if any) to the error reporter. */
  error(message: string, error?: unknown, context?: LogContext | null): void;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

const REDACTED = '[redacted]';
/**
 * Keys whose values are secrets, matched anywhere in the key and in any case
 * (`newPassword`, `x-auth-token`, `client_secret`, ...). It errs on the side
 * of redacting.
 */
const SECRET_KEY =
  /authoriz|authenticat|cookie|pass(word|code|phrase)|passwd|^pwd$|secret|token|api[-_]?key|access[-_]?key|mfa|^pin$|jwt|session[-_]?id|private[-_]?key|credential|verifier|signature|cvv|cvc/i;
/**
 * Secret words too short to match inside a key, matched against its words
 * (`authCode`, `otp_code`, `refresh`) so `author`, `rootPath`, and
 * `refreshing` are kept.
 */
const SECRET_WORD = /^(auth(?!or)[a-z0-9]*|otp[a-z0-9]*|[th]otp|refresh)$/;

function isSecretKey(key: string): boolean {
  if (SECRET_KEY.test(key)) return true;
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .some(word => SECRET_WORD.test(word));
}
const BODY_KEY = /^(data|body)$/i;
/**
 * Keys whose string values are URLs (by how the key ends, so `linkText` is
 * not one): logged without the query or fragment.
 */
const URL_KEY = /(ur[il]|href|link|endpoint|location)$/i;
const MAX_DEPTH = 5;

const UNREADABLE = '[unreadable]';

/** A property's value, or a marker if its getter throws. */
function read(object: object, key: string): unknown {
  try {
    return (object as Record<string, unknown>)[key];
  } catch {
    return UNREADABLE;
  }
}

/**
 * Returns a copy of `value` that is safe to log or send to a reporter:
 * secret keys are always replaced, bodies are replaced unless `development`,
 * and Errors are reduced to name, message, code, status (plus stack in
 * development, since an Error's own fields may hold request data).
 */
export function redact(value: unknown, development: boolean): unknown {
  // The objects on the path from the root: only those make a cycle, so an
  // object referenced twice elsewhere is still logged in full.
  const ancestors = new WeakSet<object>();

  const walk = (current: unknown, depth: number): unknown => {
    if (current === null || typeof current !== 'object') return current;
    if (ancestors.has(current)) return '[circular]';
    if (depth >= MAX_DEPTH) return '[truncated]';
    ancestors.add(current);
    try {
      return walkObject(current, depth);
    } catch {
      // A revoked Proxy, for example: logging must never throw.
      return UNREADABLE;
    } finally {
      ancestors.delete(current);
    }
  };

  const walkObject = (current: object, depth: number): unknown => {
    if (current instanceof Error) {
      const { code, status } = current as Error & {
        code?: unknown;
        status?: unknown;
      };
      return {
        name: current.name,
        message: current.message,
        ...(code !== undefined && { code }),
        ...(status !== undefined && { status }),
        ...(development && current.stack && { stack: current.stack }),
      };
    }
    if (Array.isArray(current) || current instanceof Set) {
      return Array.from(current, item => walk(item, depth + 1));
    }
    if (current instanceof Date) {
      return Number.isNaN(current.getTime())
        ? 'Invalid Date'
        : current.toISOString();
    }
    if (typeof URL !== 'undefined' && current instanceof URL) {
      // Like request logs: no query string or fragment.
      return current.href.split(/[?#]/)[0];
    }
    const entries: [string, unknown][] =
      current instanceof Map
        ? Array.from(current, ([key, item]) => [String(key), item])
        : Object.keys(current).map(key => [key, read(current, key)]);

    const result: Record<string, unknown> = {};
    for (const [key, item] of entries) {
      if (isSecretKey(key)) {
        result[key] = REDACTED;
      } else if (!development && BODY_KEY.test(key)) {
        result[key] = REDACTED;
      } else if (typeof item === 'string' && URL_KEY.test(key)) {
        // A query string can carry a token (?access_token=...).
        result[key] = item.split(/[?#]/)[0];
      } else {
        result[key] = walk(item, depth + 1);
      }
    }
    return result;
  };

  return walk(value, 0);
}

/** Settings from validated config, or build defaults if config is invalid. */
export function settingsFromConfig(): LoggerSettings {
  if (configResult.success) {
    return {
      minLevel: configResult.config.logLevel,
      development: configResult.config.appEnv === 'development',
    };
  }
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  return { minLevel: isDev ? 'debug' : 'warn', development: isDev };
}

/**
 * Creates a logger. `getSettings` is read on every call, so tests (and apps)
 * can change it without recreating the logger.
 */
export function createLogger(
  getSettings: () => LoggerSettings = settingsFromConfig
): Logger {
  const write = (
    level: Exclude<LogLevel, 'silent'>,
    message: string,
    details: unknown[]
  ) => {
    const { minLevel } = getSettings();
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    const args = [message, ...details.filter(item => item !== undefined)];
    if (level === 'error') console.error(...args);
    else if (level === 'warn') console.warn(...args);
    else if (level === 'info') console.info(...args);
    else console.debug(...args);
  };

  const contextFor = (context: LogContext | null | undefined) =>
    context ? redact(context, getSettings().development) : undefined;

  return {
    debug: (message, context) => write('debug', message, [contextFor(context)]),
    info: (message, context) => write('info', message, [contextFor(context)]),
    warn: (message, context) => write('warn', message, [contextFor(context)]),
    error: (message, error, context) => {
      const { development } = getSettings();
      const extra = contextFor(context) as LogContext | undefined;
      // In development the console gets the Error itself (LogBox shows its
      // stack); elsewhere only its redacted summary.
      const printable =
        error === undefined
          ? undefined
          : development && error instanceof Error
            ? error
            : redact(error, development);
      write('error', message, [printable, extra]);

      try {
        const reporter = getErrorReporter();
        if (error instanceof Error) {
          reporter.captureException(error, { message, extra });
        } else if (error !== undefined) {
          reporter.captureMessage(message, 'error', {
            message,
            extra: { ...extra, error: redact(error, development) },
          });
        } else {
          reporter.captureMessage(message, 'error', { message, extra });
        }
      } catch {
        // A failing reporter must never break the caller.
      }
    },
  };
}

export const logger: Logger = createLogger();
