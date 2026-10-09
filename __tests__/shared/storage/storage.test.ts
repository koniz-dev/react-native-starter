import AsyncStorage from '@react-native-async-storage/async-storage';

import { getItem, removeItem, setItem } from '@/shared/storage/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

describe('storage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('serializes and restores a value', async () => {
    await setItem('profile', { id: 1, name: 'Demo' });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'profile',
      JSON.stringify({ id: 1, name: 'Demo' })
    );
    await expect(getItem('profile')).resolves.toEqual({ id: 1, name: 'Demo' });
  });

  it('returns null for a missing or malformed value', async () => {
    await expect(getItem('missing')).resolves.toBeNull();
    await AsyncStorage.setItem('bad-json', '{');
    await expect(getItem('bad-json')).resolves.toBeNull();
  });

  it('removes the requested key', async () => {
    await removeItem('profile');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('profile');
  });
});
