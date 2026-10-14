import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { logger } from '@/shared/lib/logger';
import { SessionProvider, useSession } from '@/shared/session/SessionProvider';
import { STORAGE_KEYS, setItem } from '@/shared/storage/storage';
import { secureStore } from '@/testing';

function Status() {
  return <Text>{useSession().session.status}</Text>;
}

it('F4 a failed cold-start restore is logged', async () => {
  const error = jest.spyOn(logger, 'error').mockImplementation(() => {});
  const warn = jest.spyOn(logger, 'warn').mockImplementation(() => {});
  await setItem(STORAGE_KEYS.USER_DATA, { id: 1, email: 'e', name: 'e' });
  secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'tok');
  jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('keystore'));
  render(
    <SessionProvider>
      <Status />
    </SessionProvider>
  );
  await screen.findByText('signedOut');
  expect(secureStore.get(STORAGE_KEYS.AUTH_TOKEN)).toBe('tok');
  expect(error.mock.calls.length + warn.mock.calls.length).toBeGreaterThan(0);
});
