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
  });

  it('switches every key when another dictionary is registered', () => {
    i18nSeam.set(createDictionaryI18n('x-pseudo', pseudo));
    expect(getLocale()).toBe('x-pseudo');
    expect(t('login.title')).toBe('[Welcome Back]');
  });

  it('the shipped screens read their strings through the seam', async () => {
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
  });
});
