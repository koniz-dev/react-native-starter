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
 * Retrieve a value from AsyncStorage with JSON deserialization
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
  } catch (error) {
    logger.error(`Error retrieving ${key}`, error);
    return null;
  }
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
