import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';
import { analyticsSeam, type Analytics } from '@/shared/integrations/analytics';
import { configureIntegrations } from '@/shared/integrations/setup';
import { setAuthAdapter, type AuthAdapter } from '@/shared/session/authService';
import { NotesScreen } from './docsNotesScreen';
import { useAnalyticsIdentity } from './docsUseAnalyticsIdentity';

const adapter: AuthAdapter = {
  login: async () => ({ token: 't', user: { id: 42, email: 'a@b.c', name: 'Ada' } }),
  normalizeUser: raw => raw as { id: number; email: string; name: string },
};
const analytics: Analytics = { track: jest.fn(), screen: jest.fn(), identify: jest.fn() };

function NotesWithIdentity() {
  useAnalyticsIdentity();
  return <NotesScreen />;
}

beforeEach(() => {
  configureIntegrations();
  setAuthAdapter(adapter);
  analyticsSeam.set(analytics);
});
afterEach(() => { setAuthAdapter(null); analyticsSeam.reset(); });

it('a sign-in-only tab: prompt, sign in, back on the tab with the list; identify follows the session', async () => {
  const app = renderRouter({ appDir: './app', overrides: { '(tabs)/notes': NotesWithIdentity } }, { initialUrl: '/notes' });
  expect(await screen.findByText('Not signed in')).toBeTruthy();
  expect(screen.queryByText('notes list')).toBeNull();
  expect(analytics.identify).toHaveBeenLastCalledWith(null);

  fireEvent.press(screen.getByText('Sign in'));
  expect(await screen.findByText('Welcome Back')).toBeTruthy();
  fireEvent.changeText(screen.getByTestId('login-username'), 'ada');
  fireEvent.changeText(screen.getByTestId('login-password'), 'secret');
  fireEvent.press(screen.getByText('Sign In'));

  expect(await screen.findByText('notes list')).toBeTruthy();
  expect(app.getPathname()).toBe('/notes');
  expect(analytics.identify).toHaveBeenLastCalledWith('42');
});
void Text;
