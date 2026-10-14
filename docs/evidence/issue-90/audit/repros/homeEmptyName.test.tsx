jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { renderWithProviders, secureStore } from '@/testing';

test('a user whose name is empty is named with the fallback', async () => {
  secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
  await setItem(STORAGE_KEYS.USER_DATA, { id: 'u1', email: 'a@b.c', name: '' });
  const view = renderWithProviders(<HomeScreen />, { withSession: true });
  const status = await view.findByTestId('session-status');
  await view.findByText(/Signed in as/);
  expect(view.getByTestId('session-status')).toHaveTextContent('Signed in as your account');
});
