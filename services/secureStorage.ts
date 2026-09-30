import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function isSecureStorageAvailable(): Promise<boolean> {
  return Platform.OS !== 'web' && (await SecureStore.isAvailableAsync());
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (!(await isSecureStorageAvailable())) {
    throw new Error('Secure storage is unavailable on this platform');
  }

  await SecureStore.setItemAsync(key, value);
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (!(await isSecureStorageAvailable())) {
    return null;
  }

  return SecureStore.getItemAsync(key);
}

export async function removeSecureItem(key: string): Promise<void> {
  if (!(await isSecureStorageAvailable())) {
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
