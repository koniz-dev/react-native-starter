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

/**
 * Default reporter: one console line per report, so the forwarding is visible
 * in development and in device logs. The logger has already written the
 * full error to the console at this point, so this does not repeat it.
 */
export const consoleErrorReporter: ErrorReporter = {
  captureException: (error, context) =>
    console.info(
      `[error-reporter] exception: ${describe(error)}${
        context?.message ? ` (${context.message})` : ''
      }`
    ),
  captureMessage: (message, level = 'error') =>
    console.info(`[error-reporter] ${level}: ${message}`),
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
