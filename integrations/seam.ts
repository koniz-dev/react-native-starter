/**
 * A replaceable implementation slot for one integration (analytics, feature
 * flags, push, updates, i18n). Each seam starts with a working default that
 * needs no account or native setup; `integrations/setup.ts` is the one place
 * where an app swaps in a real provider.
 */
export interface Seam<T> {
  /** The active implementation. */
  get(): T;
  /** Replaces the active implementation. */
  set(implementation: T): void;
  /** Restores the default implementation (useful in tests). */
  reset(): void;
}

export function createSeam<T>(defaultImplementation: T): Seam<T> {
  let current = defaultImplementation;
  return {
    get: () => current,
    set: implementation => {
      current = implementation;
    },
    reset: () => {
      current = defaultImplementation;
    },
  };
}
