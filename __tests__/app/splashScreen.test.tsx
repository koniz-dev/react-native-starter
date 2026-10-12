import * as SplashScreen from 'expo-splash-screen';
import { renderRouter, screen } from 'expo-router/testing-library';
import { authService } from '@/shared/session/authService';
import { setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { secureStore } from '@/testing';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

describe('the native splash screen', () => {
  beforeEach(() => {
    jest.mocked(SplashScreen.hideAsync).mockClear();
  });

  it('stays up while the stored session is read, then hides once', async () => {
    renderRouter('./app', { initialUrl: '/' });
    // Rendered, but the session is still loading: nothing is shown yet.
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

    expect(await screen.findByText('Not signed in')).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });

  it('hides for a restored session too', async () => {
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    const user = { id: 1, email: 'e@example.com', name: 'Emily' };
    await setItem(STORAGE_KEYS.USER_DATA, user);
    jest.spyOn(authService, 'fetchProfile').mockResolvedValue(user);

    renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Signed in as Emily')).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });
});
