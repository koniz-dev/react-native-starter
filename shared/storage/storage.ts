/**
 * Storage Service
 * AsyncStorage wrapper with JSON serialization and TypeScript support
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/shared/lib/logger';

// Common storage keys used across the app
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  /** Set on the first launch; AsyncStorage is deleted with the app. */
  INSTALL_MARKER: 'install_marker',
} as const;

/**
 * Store a value in AsyncStorage with JSON serialization
 */
export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    logger.error(`Error storing ${key}`, error);
    throw error;
  }
}

/**
 * Retrieve a value from AsyncStorage with JSON deserialization. Resolves to
 * null when the key is absent, the read fails, or the value isn't JSON (both
 * logged); use hasItem where "unreadable" must not count as "absent".
 */
export async function getItem<T>(key: string): Promise<T | null> {
  let jsonValue: string | null;
  try {
    jsonValue = await AsyncStorage.getItem(key);
  } catch (error) {
    logger.error(`Error retrieving ${key}`, error);
    return null;
  }
  if (jsonValue == null) return null;
  try {
    return JSON.parse(jsonValue) as T;
  } catch {
    // The parser's message can quote the value (V8 does): leave it out.
    logger.error(`Error retrieving ${key}`, new Error('not valid JSON'));
    return null;
  }
}

/**
 * Whether a value is stored under `key` (valid JSON or not). Rejects when
 * the read fails, so a caller never mistakes an unreadable store for an
 * empty one.
 */
export async function hasItem(key: string): Promise<boolean> {
  return (await AsyncStorage.getItem(key)) !== null;
}

/**
 * Remove a specific item from AsyncStorage
 */
export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logger.error(`Error removing ${key}`, error);
    throw error;
  }
}
