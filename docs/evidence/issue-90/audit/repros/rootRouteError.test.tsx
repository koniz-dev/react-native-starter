import { Text } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) throw new Error('Boom from a root-level screen');
  return <Text>Recovered</Text>;
}

beforeEach(() => {
  shouldThrow = true;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test('a root-level route (app/<name>.tsx) that throws: Go home', async () => {
  const app = renderRouter(
    { appDir: './app', overrides: { boom: Bomb } },
    { initialUrl: '/' }
  );
  await screen.findByText('Not signed in');
  act(() => router.push('/boom'));
  expect(await screen.findByText('Something went wrong')).toBeTruthy();
  // Is it the app-level boundary (whole app replaced) or a route one?
  expect(screen.queryByTestId('tab-home', { includeHiddenElements: true })).toBeNull();
  fireEvent.press(screen.getByTestId('error-go-home'));
  expect(await screen.findByText('Not signed in')).toBeTruthy();
  expect(app.getPathname()).toBe('/');
});

test('a root-level route that throws on a cold deep link: Go home', async () => {
  const app = renderRouter(
    { appDir: './app', overrides: { boom: Bomb } },
    { initialUrl: '/boom' }
  );
  expect(await screen.findByText('Something went wrong')).toBeTruthy();
  fireEvent.press(screen.getByTestId('error-go-home'));
  expect(await screen.findByText('Not signed in')).toBeTruthy();
  expect(app.getPathname()).toBe('/');
});
