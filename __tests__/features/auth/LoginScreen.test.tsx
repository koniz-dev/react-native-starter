import { ApiError } from '@/shared/http/apiError';
import React from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';

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
      disabled,
      loading,
    }: {
      children: React.ReactNode;
      onPress: () => void;
      testID?: string;
      disabled?: boolean;
      loading?: boolean;
    }) =>
      React.createElement(
        ReactNative.Text,
        {
          onPress,
          testID,
          accessibilityState: { disabled: !!disabled, busy: !!loading },
        },
        children
      ),
  };
});

import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { renderWithProviders } from '@/testing';
import { useSession } from '@/shared/session/SessionProvider';
import { authService } from '@/shared/session/authService';
import { logger } from '@/shared/lib/logger';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';

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

/** Renders and waits until the provider has read the (empty) stored session. */
async function renderLoginReady() {
  const view = renderLogin();
  await waitFor(() =>
    expect(view.getByTestId('session-probe').props.children).toBe('signedOut')
  );
  return view;
}

describe('<LoginScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits once when the keyboard and the button both fire', async () => {
    let finish!: () => void;
    const login = jest.spyOn(authService, 'login').mockImplementation(
      () =>
        new Promise(resolve => {
          finish = () =>
            resolve({
              token: 'test-token',
              user: { id: 1, email: 'user@example.com', name: 'Test User' },
            });
        })
    );
    const { getByTestId, getByText } = renderLogin();
    fireEvent.changeText(getByTestId('login-username'), 'emily');
    fireEvent.changeText(getByTestId('login-password'), 'secret-pass');

    fireEvent(getByTestId('login-password'), 'submitEditing');
    fireEvent(getByTestId('login-password'), 'submitEditing');
    fireEvent.press(getByText('Sign In'));
    finish();

    await waitFor(() =>
      expect(getByTestId('session-probe').props.children).toBe('signedIn')
    );
    expect(login).toHaveBeenCalledTimes(1);
  });

  it('can sign in again after a failed attempt', async () => {
    const login = jest
      .spyOn(authService, 'login')
      .mockRejectedValueOnce(
        new ApiError('Request failed', {
          code: 'unauthorized',
          status: 401,
          data: { message: 'Invalid credentials' },
        })
      )
      .mockResolvedValueOnce({
        token: 'test-token',
        user: { id: 1, email: 'user@example.com', name: 'Test User' },
      });
    const { getByTestId, getByText, findByText } = renderLogin();
    fireEvent.changeText(getByTestId('login-username'), 'emily');
    fireEvent.changeText(getByTestId('login-password'), 'wrong');
    fireEvent.press(getByText('Sign In'));
    expect(await findByText('Invalid credentials')).toBeTruthy();

    fireEvent.changeText(getByTestId('login-password'), 'right');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() =>
      expect(getByTestId('session-probe').props.children).toBe('signedIn')
    );
    expect(login).toHaveBeenCalledTimes(2);
  });

  it('shows the button busy and disabled, and clears the last error, while signing in', async () => {
    let finish!: () => void;
    jest.spyOn(authService, 'login').mockImplementation(
      () =>
        new Promise(resolve => {
          finish = () =>
            resolve({
              token: 'test-token',
              user: { id: 1, email: 'user@example.com', name: 'Test User' },
            });
        })
    );
    const { getByTestId, findByText, queryByText } = renderLogin();
    const submit = getByTestId('login-submit');
    expect(submit.props.accessibilityState).toEqual({
      disabled: false,
      busy: false,
    });
    fireEvent.press(submit);
    expect(await findByText('Please fill in all fields')).toBeTruthy();

    fireEvent.changeText(getByTestId('login-username'), 'emily');
    fireEvent.changeText(getByTestId('login-password'), 'secret-pass');
    fireEvent.press(submit);

    await waitFor(() =>
      expect(getByTestId('login-submit').props.accessibilityState).toEqual({
        disabled: true,
        busy: true,
      })
    );
    expect(queryByText('Please fill in all fields')).toBeNull();
    finish();
    await waitFor(() =>
      expect(getByTestId('session-probe').props.children).toBe('signedIn')
    );
  });

  it('marks only the field that is empty', async () => {
    const { getByTestId, getByText, findByText } = renderLogin();
    fireEvent.changeText(getByTestId('login-username'), 'emily');
    fireEvent.press(getByText('Sign In'));

    expect(await findByText('Please enter your password')).toBeTruthy();
    expect(getByTestId('login-username').props.error).toBe(false);
    expect(getByTestId('login-password').props.error).toBe(true);
  });

  it('masks the password and titles the screen for screen readers and the browser tab', async () => {
    const { getByTestId, getByRole, UNSAFE_getByType } =
      await renderLoginReady();
    expect(UNSAFE_getByType(DocumentTitle).props.title).toBe('Sign in');
    expect(getByTestId('login-password').props).toMatchObject({
      secureTextEntry: true,
      autoComplete: 'current-password',
    });
    expect(getByTestId('login-username').props.autoComplete).toBe('username');
    expect(getByRole('header', { name: 'Welcome Back' })).toBeTruthy();
  });

  it('labels the fields for screen readers and turns off autocorrect', async () => {
    const { getByTestId } = await renderLoginReady();
    for (const [id, label, type] of [
      ['login-username', 'Username', 'username'],
      ['login-password', 'Password', 'password'],
    ] as const) {
      expect(getByTestId(id).props).toMatchObject({
        accessibilityLabel: label,
        autoCorrect: false,
        spellCheck: false,
        textContentType: type,
      });
    }
  });

  it('submits the entered credentials and signs in', async () => {
    jest.spyOn(authService, 'login').mockResolvedValue({
      token: 'test-token',
      user: { id: 1, email: 'user@example.com', name: 'Test User' },
    });
    const { getByTestId, getByText } = renderLogin();

    fireEvent.changeText(getByTestId('login-username'), 'emily');
    fireEvent.changeText(getByTestId('login-password'), 'secret-pass');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'emily',
        password: 'secret-pass',
      });
      expect(getByTestId('session-probe').props.children).toBe('signedIn');
    });
  });

  it('keeps the user on the login screen and shows the server message for a rejected sign-in', async () => {
    jest.spyOn(authService, 'login').mockRejectedValue(
      new ApiError('Request failed with status code 401', {
        code: 'unauthorized',
        status: 401,
        data: { message: 'Invalid credentials' },
      })
    );
    const { getByTestId, getByText } = renderLogin();

    fireEvent.changeText(getByTestId('login-username'), 'emily');
    fireEvent.changeText(getByTestId('login-password'), 'wrong-password');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
    });
    expect(getByTestId('session-probe').props.children).toBe('signedOut');
  });

  it.each([
    ['ios', 1],
    // Android and the web read the error's live region themselves.
    ['android', 0],
    ['web', 0],
  ] as const)(
    'announces a failed sign-in to the screen reader (%s)',
    async (os, announcements) => {
      jest.replaceProperty(Platform, 'OS', os);
      const announce = jest.spyOn(
        AccessibilityInfo,
        'announceForAccessibility'
      );
      jest.spyOn(authService, 'login').mockRejectedValue(
        new ApiError('Request failed', {
          code: 'unauthorized',
          status: 401,
          data: { message: 'Invalid credentials' },
        })
      );
      const { getByTestId, getByText } = renderLogin();
      expect(getByTestId('login-error').props.accessibilityLiveRegion).toBe(
        'polite'
      );

      fireEvent.changeText(getByTestId('login-username'), 'emily');
      fireEvent.changeText(getByTestId('login-password'), 'wrong-password');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() =>
        expect(getByText('Invalid credentials')).toBeTruthy()
      );
      expect(announce).toHaveBeenCalledTimes(announcements);
      if (announcements) {
        expect(announce).toHaveBeenCalledWith('Invalid credentials');
      }
    }
  );

  it('says the same empty-field error again on a second try (iOS and live region)', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const { getByTestId, getByText, findByText } = renderLogin();
    const shown = () => getByTestId('login-error').props.children;

    fireEvent.press(getByText('Sign In'));
    expect(await findByText('Please fill in all fields')).toBeTruthy();
    fireEvent.press(getByText('Sign In'));
    // Cleared for a moment, so the live region changes, then shown again.
    expect(shown()).toBe('');
    await waitFor(() => expect(shown()).toBe('Please fill in all fields'));

    expect(announce).toHaveBeenCalledTimes(2);
  });

  it('clears the empty-field marks once both fields are filled', async () => {
    jest
      .spyOn(authService, 'login')
      .mockRejectedValue(new ApiError('Network Error', { code: 'network' }));
    const { getByTestId, getByText, findByText } = renderLogin();

    fireEvent.press(getByText('Sign In'));
    expect(await findByText('Please fill in all fields')).toBeTruthy();
    expect(getByTestId('login-username').props.error).toBe(true);
    expect(getByTestId('login-password').props.error).toBe(true);

    fireEvent.changeText(getByTestId('login-username'), 'emily');
    fireEvent.changeText(getByTestId('login-password'), 'secret-pass');
    fireEvent.press(getByText('Sign In'));

    expect(
      await findByText('No connection. Check your network and try again.')
    ).toBeTruthy();
    expect(getByTestId('login-username').props.error).toBe(false);
    expect(getByTestId('login-password').props.error).toBe(false);
  });

  it.each([
    [
      'a network error',
      new ApiError('Network Error', { code: 'network' }),
      'No connection. Check your network and try again.',
    ],
    [
      'a developer error (no AuthAdapter)',
      new Error('Sign-in is not configured: register an AuthAdapter'),
      'Login failed. Please try again.',
    ],
  ])(
    'shows a translated message, not developer text, for %s',
    async (_case, failure, shown) => {
      const logged = jest.spyOn(logger, 'error').mockImplementation(() => {});
      jest.spyOn(authService, 'login').mockRejectedValue(failure);
      const { getByTestId, getByText, queryByText } = renderLogin();

      fireEvent.changeText(getByTestId('login-username'), 'emily');
      fireEvent.changeText(getByTestId('login-password'), 'secret-pass');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => expect(getByText(shown)).toBeTruthy());
      expect(queryByText(/register an AuthAdapter|Network Error/)).toBeNull();
      // A developer error is logged with its reason; a request error isn't.
      expect(logged).toHaveBeenCalledTimes(failure instanceof ApiError ? 0 : 1);
      logged.mockRestore();
    }
  );

  it.each([
    ['both fields are empty', '', '', 'Please fill in all fields'],
    ['the password is empty', 'emily', '', 'Please enter your password'],
    ['the username is empty', '', 'secret-pass', 'Please enter your username'],
    [
      'the username is only spaces',
      '   ',
      'secret-pass',
      'Please enter your username',
    ],
  ])(
    'names what is missing and does not sign in when %s',
    async (_case, username, password, message) => {
      const login = jest.spyOn(authService, 'login');
      const { getByTestId, getByText, findByText } = renderLogin();

      fireEvent.changeText(getByTestId('login-username'), username);
      fireEvent.changeText(getByTestId('login-password'), password);
      fireEvent.press(getByText('Sign In'));

      expect(await findByText(message)).toBeTruthy();
      expect(login).not.toHaveBeenCalled();
      expect(getByTestId('session-probe').props.children).toBe('signedOut');
    }
  );

  it('moves from username to password with the next key', async () => {
    const { getByTestId } = await renderLoginReady();
    const username = getByTestId('login-username');

    expect(username.props.returnKeyType).toBe('next');
    fireEvent(username, 'submitEditing');

    expect(mockFocus).toHaveBeenCalledWith('login-password');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('submits the form from the password return key', async () => {
    jest.spyOn(authService, 'login').mockResolvedValue({
      token: 'test-token',
      user: { id: 1, email: 'user@example.com', name: 'Test User' },
    });
    const { getByTestId } = renderLogin();
    const password = getByTestId('login-password');

    fireEvent.changeText(getByTestId('login-username'), 'emily');
    fireEvent.changeText(password, 'secret-pass');
    expect(password.props.returnKeyType).toBe('go');
    fireEvent(password, 'submitEditing');

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'emily',
        password: 'secret-pass',
      });
      expect(getByTestId('session-probe').props.children).toBe('signedIn');
    });
  });

  it.each([
    ['ios', 'padding'],
    ['android', 'height'],
  ] as const)(
    'wraps the form in a keyboard-avoiding container (%s: %s)',
    async (os, behavior) => {
      jest.replaceProperty(Platform, 'OS', os);
      const { UNSAFE_getByType } = await renderLoginReady();

      expect(UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe(
        behavior
      );
    }
  );
});
