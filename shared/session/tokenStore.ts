/**
 * Where the auth token lives.
 *
 * - iOS / Android: the platform keychain / keystore via expo-secure-store,
 *   so the session survives app restarts.
 * - Web: memory only. Browsers have no storage that page scripts can read
 *   but an XSS payload cannot, so the token is not written to localStorage or
 *   sessionStorage; a reload signs the user out. For sessions that survive a
 *   reload on web, have your backend set an httpOnly cookie and register a
 *   matching store with setTokenStore() (see docs/api-and-storage.md).
 */
import { Platform } from 'react-native';
import {
  getSecureItem,
  removeSecureItem,
  setSecureItem,
} from '@/shared/storage/secureStorage';
import { STORAGE_KEYS } from '@/shared/storage/storage';

export interface TokenStore {
  /** The stored token, or null when signed out. */
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
  /** True when the token survives an app restart or page reload. */
  readonly persistent: boolean;
}

/** Native store backed by expo-secure-store. */
export function createSecureTokenStore(
  key: string = STORAGE_KEYS.AUTH_TOKEN
): TokenStore {
  return {
    persistent: true,
    get: () => getSecureItem(key),
    set: token => setSecureItem(key, token),
    clear: () => removeSecureItem(key),
  };
}

/** In-memory store: the token is lost when the page or app is reloaded. */
export function createMemoryTokenStore(): TokenStore {
  let token: string | null = null;
  return {
    persistent: false,
    get: async () => token,
    set: async value => {
      token = value;
    },
    clear: async () => {
      token = null;
    },
  };
}

/** The default store for a platform: memory on web, secure storage elsewhere. */
export function createTokenStore(
  platform: typeof Platform.OS = Platform.OS
): TokenStore {
  return platform === 'web'
    ? createMemoryTokenStore()
    : createSecureTokenStore();
}

const defaultTokenStore = createTokenStore();
let currentTokenStore: TokenStore = defaultTokenStore;

/** The active token store. */
export function getTokenStore(): TokenStore {
  return currentTokenStore;
}

/** Replaces the token store, or restores the platform default with null. */
export function setTokenStore(store: TokenStore | null): void {
  currentTokenStore = store ?? defaultTokenStore;
}
