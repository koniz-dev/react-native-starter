import { act, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';

describe('unknown routes', () => {
  it('show the themed not-found screen, which leads Home', async () => {
    const app = renderRouter('./app', { initialUrl: '/no-such-screen' });

    expect(await screen.findByText('Page not found')).toBeTruthy();
    expect(screen.queryByText(/Unmatched Route|Sitemap/)).toBeNull();
    expect(screen.getByRole('header', { name: 'Page not found' })).toBeTruthy();
    // Home, under it in the stack, has its own (shown when it has focus).
    expect(
      screen.UNSAFE_getAllByType(DocumentTitle).map(node => node.props.title)
    ).toContain('Page not found');

    fireEvent.press(screen.getByTestId('not-found-home'));
    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
    // Back to the Home the stack is anchored on, not a second one on top.
    expect(
      screen.getAllByTestId('session-status', { includeHiddenElements: true })
    ).toHaveLength(1);
  });

  it('lead Home after the app navigated there, not back one screen', async () => {
    const app = renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('Not signed in');
    act(() => router.push('/login'));
    await screen.findByText('Welcome Back');
    act(() => router.push('/no-such-screen'));
    await screen.findByText('Page not found');

    fireEvent.press(screen.getByTestId('not-found-home'));

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });
});
