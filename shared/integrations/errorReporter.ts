/**
 * Error-reporting seam. The logger forwards every `logger.error` here, in
 * every build, and the error boundaries report render errors here. The
 * default writes one line per report to the console and sends nothing
 * anywhere. Plug a provider (Sentry, Bugsnag, ...) in shared/integrations/setup.ts;
 * see docs/error-reporting.md.
 */
import { createSeam } from './seam';

export type ErrorReportLevel = 'error' | 'warning' | 'info';

export interface ErrorReportContext {
  /** The log message the error was reported with. */
  message?: string;
  /**
   * Extra data, already redacted by the logger (no auth headers; no response
   * bodies outside development). Render errors carry `componentStack`.
   */
  extra?: Record<string, unknown>;
}

export interface ErrorReportUser {
  id: string;
}

export interface ErrorReporter {
  /** Reports a thrown value, usually an Error with its stack. */
  captureException(error: unknown, context?: ErrorReportContext): void;
  /** Reports a message that has no Error attached. */
  captureMessage(
    message: string,
    level?: ErrorReportLevel,
    context?: ErrorReportContext
  ): void;
  /** Attaches later reports to a user, or clears it with null. */
  setUser(user: ErrorReportUser | null): void;
}

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

const isDevelopmentBuild = () => typeof __DEV__ !== 'undefined' && __DEV__;

/**
 * Default reporter: in development builds, one console line per report, so
 * the forwarding is visible. Release builds write nothing here: the logger
 * has already written the error at its level (EXPO_PUBLIC_LOG_LEVEL,
 * including `silent`), and this does not repeat it.
 */
export const consoleErrorReporter: ErrorReporter = {
  captureException: (error, context) => {
    if (!isDevelopmentBuild()) return;
    console.info(
      `[error-reporter] exception: ${describe(error)}${
        context?.message ? ` (${context.message})` : ''
      }`
    );
  },
  captureMessage: (message, level = 'error') => {
    if (!isDevelopmentBuild()) return;
    console.info(`[error-reporter] ${level}: ${message}`);
  },
  // Nothing to attach the user to; a real provider tags later reports.
  setUser: () => {},
};

export const errorReporterSeam =
  createSeam<ErrorReporter>(consoleErrorReporter);

/** The active error reporter. */
export const getErrorReporter = (): ErrorReporter => errorReporterSeam.get();

/** Registers a provider's reporter (call it from shared/integrations/setup.ts). */
export const setErrorReporter = (reporter: ErrorReporter): void =>
  errorReporterSeam.set(reporter);
