/**
 * The single error type every HTTP client in the app rejects with.
 */
import axios, { type AxiosError } from 'axios';

export type ApiErrorCode =
  /** No response: offline, DNS failure, connection refused, CORS. */
  | 'network'
  /** The request exceeded the configured timeout. */
  | 'timeout'
  /** HTTP 401. */
  | 'unauthorized'
  /** Another HTTP 4xx (validation, not found, forbidden, ...). */
  | 'client'
  /** HTTP 5xx. */
  | 'server'
  /** The request was aborted by the caller. */
  | 'canceled'
  /** Anything else, including non-HTTP errors. */
  | 'unknown';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly data?: unknown;

  constructor(
    message: string,
    options: {
      code: ApiErrorCode;
      status?: number;
      data?: unknown;
      cause?: unknown;
    }
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.code = options.code;
    this.status = options.status;
    // Not enumerable: error reporters that copy an error's own fields into
    // the report (e.g. Sentry's ExtraErrorData) would send the response
    // body, which may hold personal data. Code still reads `error.data`.
    this.data = options.data;
    Object.defineProperty(this, 'data', { enumerable: false });
  }
}

/**
 * The message in a JSON error body, if any: a string `message` or `error`
 * field, or the `message` of an envelope such as
 * `{ "error": { "code": "invalid_credentials", "message": "..." } }`.
 */
export function serverMessage(data: unknown): string | undefined {
  if (data && typeof data === 'object') {
    const body = data as { message?: unknown; error?: unknown };
    if (typeof body.message === 'string' && body.message) return body.message;
    if (typeof body.error === 'string' && body.error) return body.error;
    if (body.error && typeof body.error === 'object') {
      const nested = (body.error as { message?: unknown }).message;
      if (typeof nested === 'string' && nested) return nested;
    }
  }
  return undefined;
}

function codeForStatus(status: number): ApiErrorCode {
  if (status === 401) return 'unauthorized';
  if (status >= 500) return 'server';
  if (status >= 400) return 'client';
  return 'unknown';
}

/**
 * What an ApiError keeps of the axios error it replaces: no headers (the
 * Authorization token) and no request body (a password), since errors reach
 * logs and the error reporter. The URL loses its query string and fragment.
 */
interface RequestSummary {
  name: string;
  message: string;
  code?: string;
  method?: string;
  url?: string;
}

function summarize(error: AxiosError): RequestSummary {
  return {
    name: error.name,
    message: error.message,
    ...(error.code && { code: error.code }),
    ...(error.config?.method && {
      method: error.config.method.toUpperCase(),
    }),
    ...(error.config?.url && { url: error.config.url.split(/[?#]/)[0] }),
  };
}

/**
 * Converts anything thrown by a request into an ApiError. The message prefers
 * the server's own message (e.g. "Invalid credentials") over axios's generic
 * "Request failed with status code 400". For axios errors, `cause` is a
 * RequestSummary, not the axios error.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const cause = summarize(error);
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return new ApiError('The request was canceled', {
        code: 'canceled',
        cause,
      });
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('The request timed out', {
        code: 'timeout',
        cause,
      });
    }
    const response = error.response;
    if (!response) {
      return new ApiError('Network error: check your connection', {
        code: 'network',
        cause,
      });
    }
    return new ApiError(
      serverMessage(response.data) ??
        error.message ??
        `Request failed with status ${response.status}`,
      {
        code: codeForStatus(response.status),
        status: response.status,
        data: response.data,
        cause,
      }
    );
  }

  if (error instanceof Error) {
    return new ApiError(error.message, { code: 'unknown', cause: error });
  }
  return new ApiError('An unexpected error occurred', {
    code: 'unknown',
    cause: error,
  });
}
