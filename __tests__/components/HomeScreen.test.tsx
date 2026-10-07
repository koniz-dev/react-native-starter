import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore.set(key, value);
    return Promise.resolve();
  }),
  getItemAsync: jest.fn((key: string) =>
    Promise.resolve(mockSecureStore.get(key) ?? null)
  ),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureStore.delete(key);
    return Promise.resolve();
  }),
}));

jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  return {
    router: { push: jest.fn(), replace: jest.fn() },
    useFocusEffect: (effect: () => void) => React.useEffect(effect, [effect]),
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import HomeScreen from '@/app/(tabs)/index';
import { getItem, setItem, STORAGE_KEYS } from '@/services/storage';
import { defaultUnauthorizedHandler } from '@/services/session';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <PaperProvider theme={MD3LightTheme}>{children}</PaperProvider>
  </SafeAreaProvider>
);

describe('<HomeScreen />', () => {
  test('renders correctly with title', async () => {
    const { getByText, findByText } = render(<HomeScreen />, {
      wrapper: TestWrapper,
    });
    await findByText('Not signed in');

    getByText('React Native Paper');
    getByText('Material Design 3 Components');
  });

  test('renders all text variants section', async () => {
    const { getByText, findByText } = render(<HomeScreen />, {
      wrapper: TestWrapper,
    });
    await findByText('Not signed in');

    getByText('Text Variants');
    getByText('Headline Small');
    getByText('Title Large');
  });

  test('renders buttons section', async () => {
    const { getByText, findByText } = render(<HomeScreen />, {
      wrapper: TestWrapper,
    });
    await findByText('Not signed in');

    getByText('Buttons');
    getByText('Contained');
    getByText('Outlined');
    getByText('Text');
  });
});

describe('<HomeScreen /> session', () => {
  const user = { id: 1, email: 'emily@example.com', name: 'Emily Johnson' };

  beforeEach(async () => {
    mockSecureStore.clear();
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('shows the signed-out state with the entry to the login demo', async () => {
    const { findByText, getByText, queryByText } = render(<HomeScreen />, {
      wrapper: TestWrapper,
    });

    expect(await findByText('Not signed in')).toBeTruthy();
    expect(getByText('Try authentication demo')).toBeTruthy();
    expect(queryByText('Log out')).toBeNull();
  });

  test('shows the signed-in user from the stored session', async () => {
    mockSecureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, user);

    const { findByText, getByText, queryByText } = render(<HomeScreen />, {
      wrapper: TestWrapper,
    });

    expect(await findByText('Signed in as Emily Johnson')).toBeTruthy();
    expect(getByText('Log out')).toBeTruthy();
    expect(queryByText('Try authentication demo')).toBeNull();
  });

  test('logging out clears the session and returns to the signed-out state', async () => {
    mockSecureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, user);
    const { findByText, getByText } = render(<HomeScreen />, {
      wrapper: TestWrapper,
    });
    await findByText('Signed in as Emily Johnson');

    fireEvent.press(getByText('Log out'));

    expect(await findByText('Not signed in')).toBeTruthy();
    expect(getByText('Try authentication demo')).toBeTruthy();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      STORAGE_KEYS.AUTH_TOKEN
    );
    expect(mockSecureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
    expect(await getItem(STORAGE_KEYS.USER_DATA)).toBeNull();
  });

  test('treats a secure storage failure as signed out', async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockRejectedValueOnce(new Error('Keychain unavailable'));

    const { findByText } = render(<HomeScreen />, { wrapper: TestWrapper });

    expect(await findByText('Not signed in')).toBeTruthy();
  });

  test('switches to signed out when the API reports the session expired', async () => {
    mockSecureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, user);
    const { findByText } = render(<HomeScreen />, { wrapper: TestWrapper });
    await findByText('Signed in as Emily Johnson');

    await act(async () => {
      await defaultUnauthorizedHandler();
    });

    expect(await findByText('Not signed in')).toBeTruthy();
    expect(mockSecureStore.has(STORAGE_KEYS.AUTH_TOKEN)).toBe(false);
  });
});
