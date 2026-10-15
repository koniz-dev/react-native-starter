import { act, fireEvent, waitFor, within } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native-paper';

jest.mock('expo-router', () => {
  return { router: { navigate: jest.fn(), replace: jest.fn() } };
});

import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';
import { getItem, setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { defaultUnauthorizedHandler } from '@/shared/session/session';
import { setAuthAdapter } from '@/shared/session/authService';
import { logger } from '@/shared/lib/logger';
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
    expect(router.navigate).toHaveBeenCalledWith('/login');
  });

  test('names a signed-in session without a stored profile generically', async () => {
    // An install that predates the profile: a token, the install marker, and
    // no stored user.
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.INSTALL_MARKER, true);

    const { findByText } = renderWithProviders(<HomeScreen />, {
      withSession: true,
    });

    expect(await findByText('Signed in as your account')).toBeTruthy();
  });

  test('names a user with an empty name generically', async () => {
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, { ...user, name: '' });

    const { findByText } = renderWithProviders(<HomeScreen />, {
      withSession: true,
    });

    expect(await findByText('Signed in as your account')).toBeTruthy();
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

  test('shows Log out loading and disabled while the backend signs out', async () => {
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, user);
    let finish!: () => void;
    setAuthAdapter({
      login: async () => ({ token: 't', user }),
      normalizeUser: raw => raw as typeof user,
      logout: () => new Promise<void>(resolve => (finish = resolve)),
    });
    const { findByText, getByTestId } = renderWithProviders(<HomeScreen />, {
      withSession: true,
    });
    await findByText('Signed in as Emily Johnson');

    fireEvent.press(getByTestId('logout-button'));

    // Disabled, with Paper's loading indicator in place of the label's icon.
    await waitFor(() => expect(getByTestId('logout-button')).toBeDisabled());
    expect(
      within(getByTestId('logout-button')).UNSAFE_getByType(ActivityIndicator)
    ).toBeTruthy();
    await act(async () => finish());
    expect(await findByText('Not signed in')).toBeTruthy();
    setAuthAdapter(null);
  });

  test('treats a secure storage failure as signed out', async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockRejectedValueOnce(new Error('Keychain unavailable'));
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => {});

    const { findByText } = renderWithProviders(<HomeScreen />, {
      withSession: true,
    });

    expect(await findByText('Not signed in')).toBeTruthy();
    expect(logError).toHaveBeenCalledWith(
      'Restoring the session failed',
      expect.any(Error)
    );
    logError.mockRestore();
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

describe('<HomeScreen /> titles', () => {
  test('marks the heading and names the browser tab', async () => {
    const view = renderWithProviders(<HomeScreen />, { withSession: true });
    await view.findByText('Not signed in');
    expect(view.getByRole('header', { name: 'Welcome' })).toBeTruthy();
    expect(view.UNSAFE_getByType(DocumentTitle).props.title).toBe('Home');
  });
});

// @demo remove-block-start
describe('<HomeScreen /> examples', () => {
  test.each([
    ['Todos (API example)', '/explore'],
    ['Component showcase', '/showcase'],
  ])('"%s" opens %s', async (title, route) => {
    const { findByText, getByText, getByRole } = renderWithProviders(
      <HomeScreen />,
      { withSession: true }
    );
    await findByText('Not signed in');

    fireEvent.press(getByText(title));

    expect(router.navigate).toHaveBeenCalledWith(route);
    // A screen reader announces it as something to press.
    expect(
      getByRole('button', { name: new RegExp(title.replace(/[()]/g, '.')) })
    ).toBeTruthy();
  });
});
// @demo remove-block-end
