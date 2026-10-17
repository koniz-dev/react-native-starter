/**
 * In-memory expo-secure-store for tests. jest.setup.ts installs it for every
 * test file and empties it before each test. Inspect or seed it directly:
 *
 *   secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
 *   expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
 *
 * The module functions are jest.fn()s, so tests can still override one call,
 * e.g. jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(error).
 */
export const secureStore = new Map<string, string>();

export const secureStoreModule = {
  isAvailableAsync: jest.fn(),
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
};

/** expo-secure-store's own key check, which runs before the native module. */
function checkKey(key: string): Promise<void> {
  return /^[\w.-]+$/.test(key)
    ? Promise.resolve()
    : Promise.reject(
        new Error(
          'Invalid key provided to SecureStore. Keys must not be empty and contain only alphanumeric characters, ".", "-", and "_".'
        )
      );
}

/** expo-secure-store's value check, which runs after the key check. */
function checkValue(value: unknown): Promise<void> {
  return typeof value === 'string'
    ? Promise.resolve()
    : Promise.reject(
        new Error(
          'Invalid value provided to SecureStore. Values must be strings; consider JSON-encoding your values if they are serializable.'
        )
      );
}

/** Empties the store and restores the default (available, stateful) behavior. */
export function resetSecureStore(): void {
  secureStore.clear();
  secureStoreModule.isAvailableAsync
    .mockReset()
    .mockImplementation(() => Promise.resolve(true));
  secureStoreModule.setItemAsync
    .mockReset()
    .mockImplementation((key: string, value: string) =>
      checkKey(key)
        .then(() => checkValue(value))
        .then(() => {
          secureStore.set(key, value);
        })
    );
  secureStoreModule.getItemAsync
    .mockReset()
    .mockImplementation((key: string) =>
      checkKey(key).then(() => secureStore.get(key) ?? null)
    );
  secureStoreModule.deleteItemAsync
    .mockReset()
    .mockImplementation((key: string) =>
      checkKey(key).then(() => {
        secureStore.delete(key);
      })
    );
}
