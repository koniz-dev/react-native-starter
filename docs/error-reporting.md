# Error Reporting and Logging

App code logs through one logger, and errors flow from it to one
error-reporting seam. The starter ships no crash-reporting SDK: by default
reports go to the console. To send them to Sentry, Bugsnag, or similar,
install the provider and register an adapter; no other code changes.

```
logger.error(...) ──┐
ErrorBoundary ──────┼──► getErrorReporter() ──► console (default) or your provider
route ErrorBoundary ┘
```

## Logger

`shared/lib/logger.ts` exports `logger` with four levels:

```ts
import { logger } from '@/shared/lib/logger';
import { setItem } from '@/shared/storage/storage';

export async function saveSettings(
  key: string,
  value: object,
  attempt: number
) {
  logger.debug('Saving settings', { key });
  if (attempt > 1) logger.warn('Retrying save', { attempt });
  try {
    await setItem(key, value);
    logger.info('Settings saved', { key });
  } catch (error) {
    logger.error('Failed to save settings', error, { key }); // also reported
  }
}
```

- **Minimum level.** Messages below it are not written to the console. It
  comes from `EXPO_PUBLIC_LOG_LEVEL` (`debug`, `info`, `warn`, `error`, or
  `silent`); when unset, it is `debug` in development, `info` in preview, and
  `warn` in production (see [Environment variables](environment-variables.md)).
- **Errors are reported in every build.** `logger.error` always forwards to
  the error reporter, whatever the console level: an `Error` goes to
  `captureException`, anything else to `captureMessage`. Warnings are not
  reported.
- **Redaction.** Context objects are copied before they are written or
  reported:
  - always: `Authorization`, `Cookie`, `Set-Cookie`, `password`, `secret`,
    `token`, `accessToken`, `refreshToken`, `idToken`, `apiKey` values become
    `[redacted]`;
  - outside development: `data` and `body` values (response bodies) become
    `[redacted]`, and an `Error` is reduced to its name, message, `code`, and
    `status`.

  The `Error` passed to `captureException` is the original object, so the
  provider gets its stack. If your errors carry sensitive fields, strip them in
  the adapter (or the provider's `beforeSend`).

- **No `console` in app code.** ESLint `no-console` is an error everywhere
  except `shared/lib/logger.ts` and the default reporter.

The HTTP client logs failed requests as method, path, error code, and status
only (see [API and Storage](api-and-storage.md)).

## Error reporter seam

`shared/integrations/errorReporter.ts`:

```ts
interface ErrorReporter {
  captureException(error: unknown, context?: ErrorReportContext): void;
  captureMessage(
    message: string,
    level?: 'error' | 'warning' | 'info',
    context?: ErrorReportContext
  ): void;
  setUser(user: { id: string } | null): void;
}

interface ErrorReportContext {
  message?: string; // the log message
  extra?: Record<string, unknown>; // redacted context; render errors add componentStack
}
```

The default, `consoleErrorReporter`, writes one `[error-reporter] …` line per
report and ignores `setUser`. `SessionProvider` calls `setUser({ id })` on
sign-in and `setUser(null)` on sign-out or expiry; only the user id is sent.

A reporter that throws never breaks the caller; the logger catches it.

## Error boundaries

`shared/ui/ErrorBoundary.tsx` has two boundaries, both reporting through
the logger (and so through the seam) in every build:

- **`ErrorBoundary`** wraps the app in `app/_layout.tsx`, inside
  `PaperProvider`, so its fallback follows light and dark mode. It reports
  the error with `extra.componentStack`.
- **`RouteErrorBoundary`** is exported as `ErrorBoundary` from each group
  layout (`app/(tabs)/_layout.tsx`, `app/(auth)/_layout.tsx`,
  `app/(app)/_layout.tsx`). Expo Router renders it in place of the group
  when one of its screens throws while rendering. Add the same line to new
  layouts:

  ```ts
  export { RouteErrorBoundary as ErrorBoundary } from '@/shared/ui/ErrorBoundary';
  ```

Both fallbacks offer **Try again** (render the same screen again) and **Go
home** (navigate to `/`, then render again). The stack trace is shown only in
development. Boundaries catch errors thrown while rendering; errors in event
handlers and async code should be caught and passed to `logger.error`.

## Plugging in a provider

Install the provider's SDK yourself, then register an adapter in
`shared/integrations/setup.ts`, which runs once before the first screen renders.
This example is for Sentry's React Native SDK, which is not installed here:
the adapter takes the part of the SDK it uses, so it compiles in this repo
(`npm run docs:check`). Check Sentry's current documentation for the API.

```ts
// shared/integrations/adapters/sentry.ts
import type { ErrorReporter } from '@/shared/integrations/errorReporter';

/** The part of @sentry/react-native this adapter uses
 * (pass `import * as Sentry from '@sentry/react-native'`). */
export interface SentryLike {
  captureException(
    error: unknown,
    context?: { extra?: Record<string, unknown> }
  ): unknown;
  captureMessage(
    message: string,
    context?: {
      level?: 'error' | 'warning' | 'info';
      extra?: Record<string, unknown>;
    }
  ): unknown;
  setUser(user: { id: string } | null): void;
}

export function createSentryErrorReporter(Sentry: SentryLike): ErrorReporter {
  return {
    captureException: (error, context) => {
      Sentry.captureException(error, {
        extra: { message: context?.message, ...context?.extra },
      });
    },
    captureMessage: (message, level = 'error', context) => {
      Sentry.captureMessage(message, { level, extra: context?.extra });
    },
    setUser: user => {
      Sentry.setUser(user ? { id: user.id } : null);
    },
  };
}
```

Then, in `configureIntegrations()` in `shared/integrations/setup.ts`:

```ts
import {
  setErrorReporter,
  type ErrorReporter,
} from '@/shared/integrations/errorReporter';

// import * as Sentry from '@sentry/react-native';
// import { createSentryErrorReporter } from './adapters/sentry';
declare const Sentry: { init(options: { dsn: string }): void };
declare function createSentryErrorReporter(sentry: unknown): ErrorReporter;

Sentry.init({ dsn: 'https://example@o0.ingest.sentry.io/0' }); // e.g. from an EXPO_PUBLIC_ variable in shared/config/env.ts
setErrorReporter(createSentryErrorReporter(Sentry));
```

Native crashes (outside JavaScript) and source-map upload are configured in
the provider's SDK and build setup, not through this seam.

## Testing

Replace the reporter with a mock and restore the default afterwards:

```ts
import { errorReporterSeam } from '@/shared/integrations/errorReporter';

const reporter = {
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
};
beforeEach(() => errorReporterSeam.set(reporter));
afterEach(() => errorReporterSeam.reset());
```

`createLogger(() => settings)` builds a logger with fixed settings, for
example `{ minLevel: 'warn', development: false }` to test production
behavior. See `__tests__/shared/lib/logger.test.ts` and
`__tests__/shared/ui/ErrorBoundary.test.tsx`.
