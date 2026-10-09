import React from 'react';
import { KeyboardAvoidingView, Platform, Text } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';

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

import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { renderWithProviders } from '@/testing';
import { useSession } from '@/shared/session/SessionProvider';
import { authService } from '@/shared/session/authService';

/** Shows the provider's session status so tests can see sign-in take effect. */
function SessionProbe() {
  const { session } = useSession();
  return <Text testID="session-probe">{session.status}</Text>;
}

const renderLogin = () =>
  renderWithProviders(
    <>
      <LoginScreen />
      <SessionProbe />
    </>,
    { withSession: true }
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
    const { getByTestId, getByText } = renderLogin();

    fireEvent.changeText(getByTestId('login-username'), 'emilys');
    fireEvent.changeText(getByTestId('login-password'), 'emilyspass');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'emilys',
        password: 'emilyspass',
      });
      expect(getByTestId('session-probe').props.children).toBe('signedIn');
    });
  });

  it('keeps the user on the login screen and shows a clear request error', async () => {
    jest
      .spyOn(authService, 'login')
      .mockRejectedValue(new Error('Invalid credentials'));
    const { getByTestId, getByText } = renderLogin();

    fireEvent.changeText(getByTestId('login-username'), 'emilys');
    fireEvent.changeText(getByTestId('login-password'), 'wrong-password');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
    });
    expect(getByTestId('session-probe').props.children).toBe('signedOut');
  });

  it.each([
    ['both fields are empty', '', ''],
    ['the password is empty', 'emilys', ''],
    ['the username is empty', '', 'emilyspass'],
  ])(
    'asks for both fields and does not sign in when %s',
    async (_case, username, password) => {
      const login = jest.spyOn(authService, 'login');
      const { getByTestId, getByText, findByText } = renderLogin();

      fireEvent.changeText(getByTestId('login-username'), username);
      fireEvent.changeText(getByTestId('login-password'), password);
      fireEvent.press(getByText('Sign In'));

      expect(await findByText('Please fill in all fields')).toBeTruthy();
      expect(login).not.toHaveBeenCalled();
      expect(getByTestId('session-probe').props.children).toBe('signedOut');
    }
  );

  it('moves from username to password with the next key', () => {
    const { getByTestId } = renderLogin();
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
    const { getByTestId } = renderLogin();
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
      expect(getByTestId('session-probe').props.children).toBe('signedIn');
    });
  });

  it('wraps the form in a keyboard-avoiding container', () => {
    const { UNSAFE_getByType } = renderLogin();

    expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe(
      Platform.OS === 'ios' ? 'padding' : 'height'
    );
  });
});
