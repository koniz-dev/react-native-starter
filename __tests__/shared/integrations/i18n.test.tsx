import { act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import {
  createDictionaryI18n,
  getLocale,
  i18nSeam,
  interpolate,
  t,
  type Translations,
} from '@/shared/i18n';
import { en } from '@/shared/i18n/en';
import { configureIntegrations } from '@/shared/integrations/setup';
import { authService } from '@/shared/session/authService';
import { setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { secureStore } from '@/testing';

/** A pseudo-locale that wraps every English string, to spot hard-coded text. */
const pseudo: Translations = Object.fromEntries(
  Object.entries(en).map(([key, value]) => [key, `[${value}]`])
) as Translations;

describe('i18n seam', () => {
  afterEach(() => i18nSeam.reset());

  it('defaults to English', () => {
    expect(getLocale()).toBe('en');
    expect(t('tabs.home')).toBe('Home');
  });

  it('fills placeholders and leaves unknown ones untouched', () => {
    expect(t('home.session.signedIn', { name: 'Emily' })).toBe(
      'Signed in as Emily'
    );
    // @demo remove-block-start
    expect(t('explore.listTitle', { count: 3 })).toBe('Todos (3)');
    // @demo remove-block-end
    expect(interpolate('Hi {name} {missing}', { name: 'A' })).toBe(
      'Hi A {missing}'
    );
    // Only the params' own keys, not the object prototype's.
    expect(interpolate('{constructor}{toString}', { name: 'A' })).toBe(
      '{constructor}{toString}'
    );
  });

  it('switches every key when another dictionary is registered', () => {
    i18nSeam.set(createDictionaryI18n('x-pseudo', pseudo));
    expect(getLocale()).toBe('x-pseudo');
    expect(t('login.title')).toBe('[Welcome Back]');
  });

  it('the shipped screens read their strings through the seam', async () => {
    // Register the app's providers first: rendering ./app runs
    // configureIntegrations(), which would replace this test's one.
    configureIntegrations();
    i18nSeam.set(createDictionaryI18n('x-pseudo', pseudo));

    const app = renderRouter('./app', { initialUrl: '/' });
    expect(await screen.findByText('[Not signed in]')).toBeTruthy();
    expect(screen.getByText('[Sign in]')).toBeTruthy();
    expect(screen.getByText('[Home]')).toBeTruthy();
    // @demo remove-block-start
    expect(screen.getByText('[Explore]')).toBeTruthy();
    // @demo remove-block-end

    app.unmount();
    renderRouter('./app', { initialUrl: '/login' });
    expect(await screen.findByText('[Welcome Back]')).toBeTruthy();
    expect(screen.getByText('[Sign in to continue]')).toBeTruthy();
    expect(screen.getByText('[Sign In]')).toBeTruthy();
    // Paper's Back button would say "Back" in English otherwise.
    expect(screen.getByTestId('auth-back').props.accessibilityLabel).toBe(
      '[Back]'
    );
  });

  it("labels the protected group's Back button through the seam", async () => {
    configureIntegrations();
    i18nSeam.set(createDictionaryI18n('x-pseudo', pseudo));
    const user = { id: 1, email: 'e@example.com', name: 'E' };
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, user);
    jest.spyOn(authService, 'fetchProfile').mockResolvedValue(user);

    renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('[View profile]');
    act(() => router.navigate('/profile'));
    expect(
      (await screen.findByTestId('protected-back')).props.accessibilityLabel
    ).toBe('[Back]');
  });
});
