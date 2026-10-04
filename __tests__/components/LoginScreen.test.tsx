import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

const mockFocus = jest.fn();

jest.mock('react-native-paper', () => {
  const actual = jest.requireActual('react-native-paper');
  const ReactNative = jest.requireActual('react-native');
  const React = jest.requireActual('react');

  return {
    ...actual,
    TextInput: React.forwardRef(function MockTextInput(
      { testID, ...props }: { testID?: string },
      ref: React.Ref<unknown>
    ) {
      React.useImperativeHandle(ref, () => ({
        focus: () => mockFocus(testID),
      }));
      return React.createElement(ReactNative.View, { testID, ...props });
    }),
    Button: ({
      children,
      onPress,
      testID,
    }: {
      children: React.ReactNode;
      onPress: () => void;
      testID?: string;
    }) => React.createElement(ReactNative.Text, { onPress, testID }, children),
    Snackbar: ({
      children,
      visible,
    }: {
      children: React.ReactNode;
      visible: boolean;
    }) =>
      visible ? React.createElement(ReactNative.Text, null, children) : null,
  };
});

import LoginScreen from '@/app/(auth)/login';
import { router } from 'expo-router';
import { authService } from '@/services/auth';

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

describe('<LoginScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits the documented demo credentials and enters the tabs route', async () => {
    jest.spyOn(authService, 'login').mockResolvedValue({
      token: 'demo-token',
      user: { id: 1, email: 'demo@example.com', name: 'Demo User' },
    });
    const { getByTestId, getByText } = render(<LoginScreen />, {
      wrapper: TestWrapper,
    });

    fireEvent.changeText(getByTestId('login-username'), 'emilys');
    fireEvent.changeText(getByTestId('login-password'), 'emilyspass');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'emilys',
        password: 'emilyspass',
      });
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('keeps the user on the login screen and shows a clear request error', async () => {
    jest
      .spyOn(authService, 'login')
      .mockRejectedValue(new Error('Invalid credentials'));
    const { getByTestId, getByText } = render(<LoginScreen />, {
      wrapper: TestWrapper,
    });

    fireEvent.changeText(getByTestId('login-username'), 'emilys');
    fireEvent.changeText(getByTestId('login-password'), 'wrong-password');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
    });
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('moves from username to password with the next key', () => {
    const { getByTestId } = render(<LoginScreen />, { wrapper: TestWrapper });
    const username = getByTestId('login-username');

    expect(username.props.returnKeyType).toBe('next');
    fireEvent(username, 'submitEditing');

    expect(mockFocus).toHaveBeenCalledWith('login-password');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('submits the form from the password return key', async () => {
    jest.spyOn(authService, 'login').mockResolvedValue({
      token: 'demo-token',
      user: { id: 1, email: 'demo@example.com', name: 'Demo User' },
    });
    const { getByTestId } = render(<LoginScreen />, { wrapper: TestWrapper });
    const password = getByTestId('login-password');

    fireEvent.changeText(getByTestId('login-username'), 'emilys');
    fireEvent.changeText(password, 'emilyspass');
    expect(password.props.returnKeyType).toBe('go');
    fireEvent(password, 'submitEditing');

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'emilys',
        password: 'emilyspass',
      });
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('wraps the form in a keyboard-avoiding container', () => {
    const { UNSAFE_getByType } = render(<LoginScreen />, {
      wrapper: TestWrapper,
    });

    expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe(
      Platform.OS === 'ios' ? 'padding' : 'height'
    );
  });
});
