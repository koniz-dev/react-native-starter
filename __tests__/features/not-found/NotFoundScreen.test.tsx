import { fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

describe('unknown routes', () => {
  it('show the themed not-found screen, which leads Home', async () => {
    const app = renderRouter('./app', { initialUrl: '/no-such-screen' });

    expect(await screen.findByText('Page not found')).toBeTruthy();
    expect(screen.queryByText(/Unmatched Route|Sitemap/)).toBeNull();
    expect(screen.getByRole('header', { name: 'Page not found' })).toBeTruthy();

    fireEvent.press(screen.getByTestId('not-found-home'));
    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(app.getPathname()).toBe('/');
  });
});
