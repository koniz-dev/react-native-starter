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

/** Empties the store and restores the default (available, stateful) behavior. */
export function resetSecureStore(): void {
  secureStore.clear();
  secureStoreModule.isAvailableAsync
    .mockReset()
    .mockImplementation(() => Promise.resolve(true));
  secureStoreModule.setItemAsync
    .mockReset()
    .mockImplementation((key: string, value: string) => {
      secureStore.set(key, value);
      return Promise.resolve();
    });
  secureStoreModule.getItemAsync
    .mockReset()
    .mockImplementation((key: string) =>
      Promise.resolve(secureStore.get(key) ?? null)
    );
  secureStoreModule.deleteItemAsync
    .mockReset()
    .mockImplementation((key: string) => {
      secureStore.delete(key);
      return Promise.resolve();
    });
}
