/**
 * HTTP client factory. Every axios instance in the app is created here so they
 * share one set of rules:
 *
 * - base URL and timeout come from validated config (config/env.ts), read per
 *   request so importing a client never reads configuration;
 * - the auth token is attached only for trusted origins (see
 *   getTrustedTokenOrigins);
 * - every failure rejects with an ApiError (services/apiError.ts);
 * - a 401 on an authenticated request tries the optional token refresh once,
 *   then runs the unauthorized handler (default: clear the session and emit
 *   session-expired; see services/session.ts);
 * - failures are logged through the logger without bodies or headers.
 */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getConfig } from '@/config/env';
import { logger } from '@/utils/logger';
import { toApiError } from './apiError';
import { getTokenStore } from './tokenStore';
import { getUnauthorizedHandler, refreshAccessToken } from './session';

export interface HttpClientOptions {
  /** Base URL, read from config when each request is made. */
  getBaseURL: () => string;
  /**
   * Attach the stored auth token to requests whose origin is trusted, and
   * handle 401s on those requests. Off for the auth client itself, where a
   * 401 means "wrong credentials", not "session expired".
   */
  authenticated?: boolean;
  /** Passed to axios; React Native defaults it to true (stores cookies). */
  withCredentials?: boolean;
}

/**
 * Returns the normalized origin (`scheme://host[:port]`, lowercase, default
 * ports dropped) of an absolute URL, or null if the URL is not absolute.
 * Parsed by hand because React Native's URL implementation is incomplete.
 */
export function getOrigin(url: string): string | null {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#@]+@)?([^/?#]+)/i.exec(url);
  if (!match) {
    return null;
  }
  const scheme = match[1].toLowerCase();
  let host = match[3].toLowerCase();
  if (
    (scheme === 'https' && host.endsWith(':443')) ||
    (scheme === 'http' && host.endsWith(':80'))
  ) {
    host = host.slice(0, host.lastIndexOf(':'));
  }
  return `${scheme}://${host}`;
}

/**
 * Origins that may receive the bearer token. The token is issued by the auth
 * backend, so by default only its origin (EXPO_PUBLIC_AUTH_API_URL) is
 * trusted; add other first-party hosts, such as an API on a separate domain,
 * to EXPO_PUBLIC_API_TRUSTED_ORIGINS (comma-separated). Requests to any other
 * origin, including absolute URLs, are sent without the Authorization header.
 * In the demo, the JSONPlaceholder API is a different third party from
 * DummyJSON and therefore never receives the token.
 */
export function getTrustedTokenOrigins(): ReadonlySet<string> {
  const { authApiUrl, apiTrustedOrigins } = getConfig();
  return new Set(
    [authApiUrl, ...apiTrustedOrigins]
      .map(getOrigin)
      .filter((origin): origin is string => origin !== null)
  );
}

type RetriableConfig = InternalAxiosRequestConfig & {
  /** Set after one refresh-and-retry, so a second 401 is not retried. */
  _retriedAfterRefresh?: boolean;
};

function describe(config: InternalAxiosRequestConfig | undefined): string {
  if (!config) return 'request';
  return `${(config.method ?? 'get').toUpperCase()} ${config.url ?? ''}`;
}

export function createHttpClient(options: HttpClientOptions): AxiosInstance {
  const client = axios.create({
    headers: { 'Content-Type': 'application/json' },
    withCredentials: options.withCredentials,
  });

  client.interceptors.request.use(async config => {
    config.baseURL ??= options.getBaseURL();
    // axios's default timeout is 0 (none); 0 here means "not set by caller".
    config.timeout ||= getConfig().apiTimeoutMs;

    if (!options.authenticated) {
      return config;
    }
    const origin = getOrigin(client.getUri(config));
    if (!origin || !getTrustedTokenOrigins().has(origin)) {
      return config;
    }
    const token = await getTokenStore().get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const sentToken = Boolean(config?.headers?.Authorization);

    if (
      options.authenticated &&
      config &&
      sentToken &&
      error.response?.status === 401
    ) {
      if (!config._retriedAfterRefresh) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          config._retriedAfterRefresh = true;
          config.headers.Authorization = `Bearer ${newToken}`;
          return client.request(config);
        }
      }
      await getUnauthorizedHandler()();
    }

    const apiError = toApiError(error);
    logger.warn(
      `API ${describe(config)} failed: ${apiError.code}${
        apiError.status ? ` (${apiError.status})` : ''
      }`
    );
    return Promise.reject(apiError);
  });

  return client;
}
