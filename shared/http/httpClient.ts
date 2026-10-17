/**
 * HTTP client factory. Every axios instance in the app is created here so they
 * share one set of rules:
 *
 * - base URL and timeout come from validated config (shared/config/env.ts), read per
 *   request so importing a client never reads configuration;
 * - the auth token is attached only for trusted origins (see
 *   getTrustedTokenOrigins);
 * - every failure rejects with an ApiError (shared/http/apiError.ts);
 * - a 401 on a request that carried the stored token tries the optional
 *   token refresh once, then runs the unauthorized handler (default: clear
 *   the session and emit session-expired; see shared/session/session.ts). A
 *   401 for a token that is no longer the stored one is retried with the
 *   current token instead; a 401 on any other request, or on a request sent
 *   before the user signed out or in, is just an error;
 * - failures are logged through the logger without bodies, headers, or query
 *   strings, at the level from requestFailureLogLevel.
 */
import axios, {
  CanceledError,
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { Platform } from 'react-native';
import { getConfig } from '@/shared/config/env';
import { logger } from '@/shared/lib/logger';
import { toApiError, type ApiErrorCode } from './apiError';
import { getTokenStore } from '@/shared/session/tokenStore';
import {
  getSessionGeneration,
  getUnauthorizedHandler,
  refreshAccessToken,
} from '@/shared/session/session';

/**
 * The log level for a failed request. The server answered a 4xx or 5xx: the
 * caller gets the ApiError and shows it, so `info` keeps it visible in
 * development and preview without a LogBox toast over the screen. No answer
 * (network, timeout) or an unexpected error: `warn`. Canceled by the caller,
 * e.g. on unmount: `debug`.
 */
export function requestFailureLogLevel(
  code: ApiErrorCode
): 'debug' | 'info' | 'warn' {
  switch (code) {
    case 'client':
    case 'server':
    case 'unauthorized':
      return 'info';
    case 'canceled':
      return 'debug';
    default:
      return 'warn';
  }
}

export interface HttpClientOptions {
  /** Base URL, read from config when each request is made. */
  getBaseURL: () => string;
  /**
   * Attach the stored auth token to requests whose origin is trusted, and
   * handle 401s on those requests. Off for the auth client itself, where a
   * 401 means "wrong credentials", not "session expired".
   */
  authenticated?: boolean;
  /**
   * With `authenticated`: on a 401 for the stored token, refresh it and then
   * run the unauthorized handler (the default). Off for the client handed to
   * the refresh itself: a 401 there just fails, so the refresh fails instead
   * of waiting for itself.
   */
  handleUnauthorized?: boolean;
  /** Passed to axios; React Native defaults it to true (stores cookies). */
  withCredentials?: boolean;
}

/** No backslash, whitespace, or control character (code points 0–32, 127). */
function isPlainAuthority(authority: string): boolean {
  for (const char of authority) {
    const code = char.charCodeAt(0);
    if (char === '\\' || code <= 0x20 || code === 0x7f) return false;
  }
  return true;
}

/**
 * Returns the normalized origin (`scheme://host[:port]`, lowercase, default
 * ports dropped) of an absolute URL, or null if the URL is not absolute.
 * Parsed by hand because React Native's URL implementation is incomplete.
 *
 * Fails closed: a URL whose authority contains a backslash, whitespace, or a
 * control character returns null, because browsers and Android's OkHttp
 * read those differently (`https://evil\\@auth.example.com` goes to `evil`),
 * so it can't be trusted with the token.
 */
export function getOrigin(url: string): string | null {
  const match = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)/i.exec(url);
  const [, rawScheme, authority] = match ?? [];
  if (!rawScheme || !authority || !isPlainAuthority(authority)) {
    return null;
  }
  const rawHost = authority.slice(authority.lastIndexOf('@') + 1);
  if (!rawHost || rawHost.startsWith(':')) {
    return null;
  }
  const scheme = rawScheme.toLowerCase();
  let host = rawHost.toLowerCase();
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
  /** The stored token this client attached, if any. */
  _sentToken?: string;
  /** The token to attach on a retry instead of the stored one. */
  _retryToken?: string;
  /** The token the refresh returned for this request's retry. */
  _refreshedToken?: string;
  /** Set after one retry, so a second 401 is not retried. */
  _retried?: boolean;
  /** The session generation when the request was first sent. */
  _generation?: number;
};

/**
 * A URL's path as the server reads it: no query or fragment, percent-decoded
 * segment by segment, `.` and `..` resolved. iOS reports the response's URL
 * serialized (`/users/José` as `/users/Jos%C3%A9`, `\` as `%5C`), so both
 * sides are compared in this form. A redirect that changes only the query
 * isn't seen; authenticated endpoints shouldn't redirect at all.
 */
function pathOf(url: string): string {
  const raw = url
    .split(/[?#]/)[0]!
    .replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, '');
  const segments: string[] = [];
  for (const segment of raw.split('/').slice(1)) {
    if (segment === '..') segments.pop();
    else if (segment !== '.') {
      try {
        segments.push(decodeURIComponent(segment));
      } catch {
        segments.push(segment);
      }
    }
  }
  return `/${segments.join('/')}`;
}

/** An internationalized host, which the platform may report as punycode. */
const isIdn = (origin: string) => /[^ -~]|xn--/i.test(origin);

/**
 * Whether an iOS request followed a redirect: its response came from another
 * URL than the one requested. iOS drops the Authorization header when it
 * follows a redirect, even to the same origin, so such a 401 says nothing
 * about the token. Android and the web keep the header on a same-origin
 * redirect (and a cross-origin one never had it), so their 401s count.
 */
function followedRedirect(error: AxiosError, requested: string): boolean {
  if (Platform.OS !== 'ios') return false;
  const final = (error.request as { responseURL?: unknown } | undefined)
    ?.responseURL;
  if (typeof final !== 'string' || !final) return false;
  const [from, to] = [getOrigin(requested), getOrigin(final)];
  if (!from || !to) return false;
  if (from !== to && !isIdn(from) && !isIdn(to)) return true;
  return pathOf(final) !== pathOf(requested);
}

/** `METHOD path` for logs, without the query string or fragment. */
function describe(config: InternalAxiosRequestConfig | undefined): string {
  if (!config) return 'request';
  const path = (config.url ?? '').split(/[?#]/)[0];
  return `${(config.method ?? 'get').toUpperCase()} ${path}`;
}

export function createHttpClient(options: HttpClientOptions): AxiosInstance {
  const client = axios.create({
    headers: { 'Content-Type': 'application/json' },
    withCredentials: options.withCredentials,
  });

  client.interceptors.request.use(async config => {
    config.baseURL ??= options.getBaseURL();
    // The JSON default would make axios serialize a FormData body as JSON.
    // React Native sends multipart with this type and adds the boundary;
    // on the web, axios drops it so the browser sets it with the boundary.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      config.headers.setContentType('multipart/form-data');
    }
    // axios's default timeout is 0 (none); 0 here means "not set by caller".
    config.timeout ||= getConfig().apiTimeoutMs;

    const retriable = config as RetriableConfig;
    // A retry reuses the first attempt's headers: drop the token it carried,
    // so a retry without one doesn't send the old one.
    if (retriable._sentToken) delete config.headers.Authorization;
    retriable._sentToken = undefined;
    if (!options.authenticated) {
      return config;
    }
    const origin = getOrigin(client.getUri(config));
    if (!origin || !getTrustedTokenOrigins().has(origin)) {
      return config;
    }
    // Before the token is read: if the session changes during the read,
    // the request belongs to the session it started in, not the next one.
    const generation = getSessionGeneration();
    const token = retriable._retryToken ?? (await getTokenStore().get());
    retriable._retryToken = undefined;
    if (!retriable._retried) {
      retriable._generation = generation;
    } else if (retriable._generation !== getSessionGeneration()) {
      // The session this request belongs to ended before its retry was sent
      // (signed out, or in as someone else): don't send it for the new one.
      throw new CanceledError('The session changed; the request was not sent');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      retriable._sentToken = token;
    }
    return config;
  });

  const fail = (error: unknown, config?: InternalAxiosRequestConfig) => {
    const apiError = toApiError(error);
    logger[requestFailureLogLevel(apiError.code)](
      `API ${describe(config)} failed: ${apiError.code}${
        apiError.status ? ` (${apiError.status})` : ''
      }`
    );
    return Promise.reject(apiError);
  };

  client.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const sentToken = config?._sentToken;
    if (
      !config ||
      !sentToken ||
      error.response?.status !== 401 ||
      options.handleUnauthorized === false
    ) {
      return fail(error, config);
    }
    // Sent in a session that has ended since: the 401 says nothing about the
    // current one, and the request must not run on its behalf.
    const sameSession = () => config._generation === getSessionGeneration();
    if (!sameSession()) return fail(error, config);
    if (followedRedirect(error, client.getUri(config))) {
      logger.warn(
        `API ${describe(config)} got a 401 after it was redirected; the session is kept (iOS drops the token on redirects)`,
        { status: 401 }
      );
      return fail(error, config);
    }

    // Only the current token can be refreshed or ended. If the stored token
    // changed meanwhile (another request refreshed it), retry with it; if
    // it's gone, there is no session to end.
    let current: string | null;
    try {
      current = await getTokenStore().get();
    } catch (readError) {
      // Such as the Keychain while the device is locked: without the stored
      // token nothing can be decided, so keep the session and fail the request.
      logger.warn('Reading the token after a 401 failed', {
        error: toApiError(readError).message,
      });
      return fail(error, config);
    }
    const currentSession =
      current === sentToken || sentToken === config._refreshedToken;
    if (!currentSession) {
      if (current && !config._retried && sameSession()) {
        config._retried = true;
        return client.request(config);
      }
      return fail(error, config);
    }

    if (!config._retried) {
      let newToken: string | null;
      try {
        newToken = await refreshAccessToken();
      } catch (refreshError) {
        // Offline, timed out, or the server failed: the session may still be
        // valid, so keep it and report this request as failed.
        return fail(refreshError, config);
      }
      if (newToken) {
        config._retried = true;
        config._retryToken = newToken;
        config._refreshedToken = newToken;
        return client.request(config);
      }
    }
    // The refresh found the session ended meanwhile: nothing left to end.
    if (!sameSession()) return fail(error, config);
    try {
      await getUnauthorizedHandler()();
    } catch (handlerError) {
      // The request still fails with its ApiError.
      logger.error('The unauthorized handler failed', handlerError);
    }
    return fail(error, config);
  });

  return client;
}
