/**
 * Logger Utility
 *
 * Provides consistent error and warning logging following Expo/React Native best practices.
 *
 * Based on Expo documentation: https://docs.expo.dev/debugging/errors-and-warnings/
 *
 * - console.error() triggers Redbox errors (fatal errors)
 * - console.warn() triggers Yellowbox warnings (non-fatal warnings)
 *
 * @example
 * ```ts
 * import { logger } from '@/utils/logger';
 *
 * // Log a warning (Yellowbox)
 * logger.warn('Deprecated API will be removed in v2');
 *
 * // Log an error (Redbox)
 * logger.error('Failed to fetch data', error);
 *
 * // Log info (development only)
 * logger.info('User logged in', { userId: 123 });
 * ```
 */

type LogContext = Record<string, unknown> | Error | null;

/**
 * Logger utility with consistent formatting
 */
export const logger = {
  /**
   * Log a warning message (triggers Yellowbox in Expo)
   * Use for non-critical issues that should be addressed
   *
   * @param message - Warning message
   * @param context - Optional context object or error
   */
  warn: (message: string, context?: LogContext) => {
    if (__DEV__) {
      if (context instanceof Error) {
        console.warn(`⚠️ ${message}`, context);
      } else if (context) {
        console.warn(`⚠️ ${message}`, context);
      } else {
        console.warn(`⚠️ ${message}`);
      }
    }
  },

  /**
   * Log an error message (triggers Redbox in Expo)
   * Use for critical errors that need immediate attention
   *
   * @param message - Error message
   * @param error - Error object or context
   */
  error: (message: string, error?: Error | LogContext) => {
    if (error instanceof Error) {
      console.error(`❌ ${message}`, error);
      if (__DEV__ && error.stack) {
        console.error('Stack trace:', error.stack);
      }
    } else if (error) {
      console.error(`❌ ${message}`, error);
    } else {
      console.error(`❌ ${message}`);
    }
  },

  /**
   * Log an info message (development only)
   *
   * @param message - Info message
   * @param context - Optional context object
   */
  info: (message: string, context?: LogContext) => {
    if (__DEV__) {
      if (context) {
        console.log(`ℹ️ ${message}`, context);
      } else {
        console.log(`ℹ️ ${message}`);
      }
    }
  },

  /**
   * Log a debug message (development only)
   *
   * @param message - Debug message
   * @param context - Optional context object
   */
  debug: (message: string, context?: LogContext) => {
    if (__DEV__) {
      if (context) {
        console.log(`🐛 ${message}`, context);
      } else {
        console.log(`🐛 ${message}`);
      }
    }
  },
};

/**
 * Helper to format API errors for logging
 *
 * @param error - API error object
 * @returns Formatted error message
 */
export function formatApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const apiError = error as {
      message?: string;
      status?: number;
      data?: unknown;
    };
    if (apiError.message) {
      return apiError.status
        ? `[${apiError.status}] ${apiError.message}`
        : apiError.message;
    }
  }

  return 'An unknown error occurred';
}

/**
 * Helper to log API errors consistently
 *
 * @param message - Error message prefix
 * @param error - API error object
 */
export function logApiError(message: string, error: unknown) {
  const formattedError = formatApiError(error);
  logger.error(
    `${message}: ${formattedError}`,
    error instanceof Error ? error : undefined
  );
}
