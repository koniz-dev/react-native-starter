import { act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { unstable_settings } from '@/app/_layout';

describe('initial route', () => {
  test('anchors the root stack on the tabs group', () => {
    expect(unstable_settings.anchor).toBe('(tabs)');
  });

  test('/ renders the Home tab', async () => {
    const app = await renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Session')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
    expect(screen.queryByText('Welcome Back')).toBeNull();
  });

  test('/login renders the Login screen', async () => {
    const app = await renderRouter('./app', { initialUrl: '/login' });

    expect(await screen.findByText('Welcome Back')).toBeTruthy();
    expect(app.getPathname()).toBe('/login');
  });

  test('going back from a deep-linked /login returns to Home', async () => {
    const app = await renderRouter('./app', { initialUrl: '/login' });
    await screen.findByText('Welcome Back');

    expect(router.canGoBack()).toBe(true);
    await act(() => router.back());

    expect(await screen.findByText('Session')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });
});
