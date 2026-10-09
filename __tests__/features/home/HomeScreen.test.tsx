import { act, fireEvent } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  return { router: { push: jest.fn(), replace: jest.fn() } };
});

import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { getItem, setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { defaultUnauthorizedHandler } from '@/shared/session/session';
import { renderWithProviders, secureStore } from '@/testing';

describe('<HomeScreen /> session', () => {
  const user = { id: 1, email: 'emily@example.com', name: 'Emily Johnson' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows the signed-out state with the sign-in entry', async () => {
    const { findByText, getByText, queryByText } = renderWithProviders(
      <HomeScreen />,
      { withSession: true }
    );

    expect(await findByText('Not signed in')).toBeTruthy();
    expect(getByText('Sign in')).toBeTruthy();
    expect(queryByText('Log out')).toBeNull();

    fireEvent.press(getByText('Sign in'));
    expect(router.push).toHaveBeenCalledWith('/login');
  });

  test('shows the signed-in user from the stored session', async () => {
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, user);

    const { findByText, getByText, queryByText } = renderWithProviders(
      <HomeScreen />,
      { withSession: true }
    );

    expect(await findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(getByText('Log out')).toBeTruthy();
    expect(queryByText('Sign in')).toBeNull();
  });

  test('logging out clears the session and returns to the signed-out state', async () => {
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, user);
    const { findByText, getByText } = renderWithProviders(<HomeScreen />, {
      withSession: true,
    });
    await findByText('Signed in as Emily Johnson');

    fireEvent.press(getByText('Log out'));

    expect(await findByText('Not signed in')).toBeTruthy();
    expect(getByText('Sign in')).toBeTruthy();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      STORAGE_KEYS.AUTH_TOKEN
    );
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    expect(await getItem(STORAGE_KEYS.USER_DATA)).toBeNull();
  });

  test('treats a secure storage failure as signed out', async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockRejectedValueOnce(new Error('Keychain unavailable'));

    const { findByText } = renderWithProviders(<HomeScreen />, {
      withSession: true,
    });

    expect(await findByText('Not signed in')).toBeTruthy();
  });

  test('switches to signed out when the API reports the session expired', async () => {
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, user);
    const { findByText } = renderWithProviders(<HomeScreen />, {
      withSession: true,
    });
    await findByText('Signed in as Emily Johnson');

    await act(async () => {
      await defaultUnauthorizedHandler();
    });

    expect(await findByText('Not signed in')).toBeTruthy();
    expect(secureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
  });
});

// @demo remove-block-start
describe('<HomeScreen /> examples', () => {
  test.each([
    ['Todos (API example)', '/explore'],
    ['Component showcase', '/showcase'],
  ])('"%s" opens %s', async (title, route) => {
    const { findByText, getByText } = renderWithProviders(<HomeScreen />, {
      withSession: true,
    });
    await findByText('Not signed in');

    fireEvent.press(getByText(title));

    expect(router.push).toHaveBeenCalledWith(route);
  });
});
// @demo remove-block-end
