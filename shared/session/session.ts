/**
 * Session lifecycle shared by the HTTP clients and the auth UI: clearing the
 * stored session, the session-expired event, and the hooks the HTTP client
 * calls on a 401. Kept separate from shared/session/authService.ts so the HTTP client can
 * use it without importing the auth service (which is itself built on the
 * HTTP client).
 */
import { isTransient, toApiError } from '@/shared/http/apiError';
import {
  hasItem,
  removeItem,
  setItem,
  STORAGE_KEYS,
} from '@/shared/storage/storage';
import { getTokenStore } from './tokenStore';

let sessionGeneration = 0;

/**
 * A number that changes whenever a session starts or ends. Work that began
 * in one session (such as a token refresh) compares it before storing
 * anything, so a sign-out isn't undone by a refresh that finishes later.
 */
export function getSessionGeneration(): number {
  return sessionGeneration;
}

/** Marks the start of a new session (sign-in). */
export function startNewSession(): void {
  sessionGeneration += 1;
}

/** Removes the stored token (token store) and profile (AsyncStorage). */
export async function clearStoredSession(): Promise<void> {
  sessionGeneration += 1;
  await getTokenStore().clear();
  await removeItem(STORAGE_KEYS.USER_DATA);
}

/**
 * Clears a session left by a previous install. iOS keeps Keychain items when
 * an app is deleted, so a reinstall would start with the old token but no
 * stored user (AsyncStorage goes with the app). On the first launch after an
 * install, with no install marker and no stored user in AsyncStorage, the
 * stored session is cleared before it is read; then the marker is written.
 * An existing install that predates the marker keeps its stored user, so it
 * stays signed in. If AsyncStorage can't be read, this rejects and clears
 * nothing: an unreadable store is not a fresh install.
 */
export async function clearSessionFromPreviousInstall(): Promise<void> {
  if (await hasItem(STORAGE_KEYS.INSTALL_MARKER)) return;
  if (!(await hasItem(STORAGE_KEYS.USER_DATA))) {
    await clearStoredSession();
  }
  await setItem(STORAGE_KEYS.INSTALL_MARKER, true);
}

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/**
 * Subscribes to session expiry (the API rejected the stored token and it
 * could not be refreshed). Returns an unsubscribe function.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export function emitSessionExpired(): void {
  for (const listener of [...sessionExpiredListeners]) {
    listener();
  }
}

/**
 * Called when an authenticated request gets a 401 that a token refresh did
 * not fix. The default clears the stored session and emits session-expired.
 */
export type UnauthorizedHandler = () => Promise<void>;

export const defaultUnauthorizedHandler: UnauthorizedHandler = async () => {
  try {
    await clearStoredSession();
  } finally {
    // Even if clearing failed part way, the app must leave the session.
    emitSessionExpired();
  }
};

let unauthorizedHandler: UnauthorizedHandler = defaultUnauthorizedHandler;

export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | null
): void {
  unauthorizedHandler = handler ?? defaultUnauthorizedHandler;
}

export function getUnauthorizedHandler(): UnauthorizedHandler {
  return unauthorizedHandler;
}

/**
 * Optional token refresh. It should obtain a new access token (for example
 * with a refresh token), store it with getTokenStore().set(), and return it;
 * return null when the session can't be refreshed. If it throws, a network,
 * timeout, server, or canceled error keeps the session (the request fails
 * with that error), as does a 408 or 429 (`isTransient` in
 * shared/http/apiError.ts); any other error counts as "can't refresh". The HTTP client retries
 * the failed request once with the new token. No refresh handler is set by
 * default, so a 401 goes straight to the unauthorized handler.
 */
export type RefreshTokenHandler = () => Promise<string | null>;

let refreshTokenHandler: RefreshTokenHandler | null = null;
/** The refresh in flight, and the session generation it was started in. */
let refreshInFlight: {
  generation: number;
  promise: Promise<string | null>;
} | null = null;

export function setRefreshTokenHandler(
  handler: RefreshTokenHandler | null
): void {
  refreshTokenHandler = handler;
}

/**
 * Runs the refresh handler, sharing one in-flight refresh between concurrent
 * 401s. Resolves to the new token, or null if there is no handler, the
 * session can't be refreshed, or the session ended while refreshing. Rejects
 * with an ApiError when the refresh failed for a transient reason (network,
 * timeout, 5xx, canceled, 408, 429), so the caller keeps the session.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshTokenHandler) return null;
  const generation = sessionGeneration;
  // Join a refresh only if it belongs to this session: one started before a
  // sign-out (or a new sign-in) resolves null and must not speak for it.
  let inFlight = refreshInFlight;
  if (inFlight?.generation !== generation) {
    const started = {
      generation,
      promise: refreshTokenHandler().catch((error: unknown) => {
        // Says nothing about the session (try again later), or no session.
        const apiError = toApiError(error);
        if (isTransient(apiError)) throw apiError;
        return null;
      }),
    };
    inFlight = refreshInFlight = started;
    void started.promise
      .catch(() => undefined)
      .finally(() => {
        if (refreshInFlight === started) refreshInFlight = null;
      });
  }
  const token = await inFlight.promise;
  return generation === sessionGeneration ? token : null;
}
