import * as SecureStore from 'expo-secure-store';
import { secureStore } from '@/testing';

describe('the expo-secure-store mock', () => {
  it('rejects a key the real module rejects, as it would on a device', async () => {
    for (const key of ['user:token', 'auth token', '']) {
      await expect(SecureStore.setItemAsync(key, 'v')).rejects.toThrow(
        'Invalid key provided to SecureStore'
      );
      await expect(SecureStore.getItemAsync(key)).rejects.toThrow(
        'Invalid key provided to SecureStore'
      );
      await expect(SecureStore.deleteItemAsync(key)).rejects.toThrow(
        'Invalid key provided to SecureStore'
      );
    }
    expect(secureStore.size).toBe(0);
  });

  it('stores, reads, and deletes a valid key', async () => {
    await SecureStore.setItemAsync('auth_token.v-2', 'abc');
    await expect(SecureStore.getItemAsync('auth_token.v-2')).resolves.toBe(
      'abc'
    );
    await SecureStore.deleteItemAsync('auth_token.v-2');
    expect(secureStore.has('auth_token.v-2')).toBe(false);
  });
});
