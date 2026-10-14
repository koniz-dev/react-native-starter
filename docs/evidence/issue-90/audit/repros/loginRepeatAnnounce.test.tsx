import { AccessibilityInfo, Platform } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { renderWithProviders } from '@/testing';

test('a second submit with the field still empty is announced again (iOS)', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
  const view = renderWithProviders(<LoginScreen />, { withSession: true });
  fireEvent.changeText(view.getByTestId('login-username'), 'emily');
  fireEvent.press(view.getByTestId('login-submit'));
  await view.findByText('Please fill in all fields');
  fireEvent.press(view.getByTestId('login-submit'));
  await waitFor(() => expect(announce).toHaveBeenCalledTimes(2));
});
