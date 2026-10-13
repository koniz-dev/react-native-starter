import AsyncStorage from '@react-native-async-storage/async-storage';

import * as loggerModule from '@/shared/lib/logger';
import {
  getItem,
  hasItem,
  removeItem,
  setItem,
} from '@/shared/storage/storage';

describe('storage', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it('serializes and restores a value', async () => {
    await setItem('profile', { id: 1, name: 'Test' });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'profile',
      JSON.stringify({ id: 1, name: 'Test' })
    );
    await expect(getItem('profile')).resolves.toEqual({ id: 1, name: 'Test' });
  });

  it('returns null for a missing key', async () => {
    await expect(getItem('missing')).resolves.toBeNull();
  });

  it('removes the requested key', async () => {
    await removeItem('profile');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('profile');
  });

  describe('when AsyncStorage fails', () => {
    const failure = new Error('disk full');
    let logError: jest.SpyInstance;

    beforeEach(() => {
      logError = jest
        .spyOn(loggerModule.logger, 'error')
        .mockImplementation(() => {});
    });

    it('setItem logs the error and rethrows it', async () => {
      jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(failure);

      await expect(setItem('profile', { id: 1 })).rejects.toBe(failure);
      expect(logError).toHaveBeenCalledWith('Error storing profile', failure);
    });

    it('getItem logs the error and returns null', async () => {
      jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(failure);

      await expect(getItem('profile')).resolves.toBeNull();
      expect(logError).toHaveBeenCalledWith(
        'Error retrieving profile',
        failure
      );
    });

    it('getItem logs a malformed value without quoting it, and returns null', async () => {
      await AsyncStorage.setItem('bad-json', 'tok_4111111111111111');

      await expect(getItem('bad-json')).resolves.toBeNull();
      expect(logError).toHaveBeenCalledWith(
        'Error retrieving bad-json',
        new Error('not valid JSON')
      );
      expect(JSON.stringify(logError.mock.calls)).not.toContain('4111');
    });

    it('hasItem rejects instead of reporting an unreadable key as absent', async () => {
      jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(failure);
      await expect(hasItem('profile')).rejects.toBe(failure);

      await AsyncStorage.setItem('bad-json', '{');
      await expect(hasItem('bad-json')).resolves.toBe(true);
      await expect(hasItem('missing')).resolves.toBe(false);
    });

    it('removeItem logs the error and rethrows it', async () => {
      jest.mocked(AsyncStorage.removeItem).mockRejectedValueOnce(failure);

      await expect(removeItem('profile')).rejects.toBe(failure);
      expect(logError).toHaveBeenCalledWith('Error removing profile', failure);
    });
  });
});
