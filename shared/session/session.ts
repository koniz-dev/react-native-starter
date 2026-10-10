/**
 * Session lifecycle shared by the HTTP clients and the auth UI: clearing the
 * stored session, the session-expired event, and the hooks the HTTP client
 * calls on a 401. Kept separate from shared/session/authService.ts so the HTTP client can
 * use it without importing the auth service (which is itself built on the
 * HTTP client).
 */
import {
  getItem,
  removeItem,
  setItem,
  STORAGE_KEYS,
} from '@/shared/storage/storage';
import { getTokenStore } from './tokenStore';

/** Removes the stored token (token store) and profile (AsyncStorage). */
export async function clearStoredSession(): Promise<void> {
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
 * stays signed in.
 */
export async function clearSessionFromPreviousInstall(): Promise<void> {
  if ((await getItem<boolean>(STORAGE_KEYS.INSTALL_MARKER)) !== null) return;
  if ((await getItem<unknown>(STORAGE_KEYS.USER_DATA)) === null) {
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
  await clearStoredSession();
  emitSessionExpired();
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
 * with a refresh token), store it with getTokenStore().set(), and return it; return
 * null when the session can't be refreshed. The HTTP client retries the
 * failed request once with the new token. No refresh handler is set by
 * default, so a 401 goes straight to the unauthorized handler.
 */
export type RefreshTokenHandler = () => Promise<string | null>;

let refreshTokenHandler: RefreshTokenHandler | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setRefreshTokenHandler(
  handler: RefreshTokenHandler | null
): void {
  refreshTokenHandler = handler;
}

/**
 * Runs the refresh handler, sharing one in-flight refresh between concurrent
 * 401s. Resolves to the new token, or null if there is no handler or the
 * refresh failed.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshTokenHandler) return null;
  refreshInFlight ??= refreshTokenHandler()
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}
