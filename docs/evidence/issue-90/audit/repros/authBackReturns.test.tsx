import { Text } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';

function Settings() {
  return <Text>Settings screen</Text>;
}

test('Back from Login returns to the screen that opened it, not Home', async () => {
  const app = renderRouter(
    { appDir: './app', overrides: { settings: Settings } },
    { initialUrl: '/' }
  );
  await screen.findByText('Not signed in');
  act(() => router.push('/settings'));
  await screen.findByText('Settings screen');
  act(() => router.push('/login'));
  await screen.findByText('Welcome Back');

  fireEvent.press(screen.getByTestId('auth-back'));

  expect(await screen.findByText('Settings screen')).toBeTruthy();
  expect(app.getPathname()).toBe('/settings');
});
