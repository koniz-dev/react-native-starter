import { renderRouter, screen } from 'expo-router/testing-library';
import {
  createDictionaryI18n,
  getLocale,
  i18nSeam,
  interpolate,
  t,
  type Translations,
} from '@/i18n';
import { en } from '@/i18n/en';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

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
    expect(t('explore.listTitle', { count: 3 })).toBe('Todos (3)');
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
    expect(screen.getByText('[Try authentication demo]')).toBeTruthy();
    expect(screen.getByText('[Home]')).toBeTruthy();
    expect(screen.getByText('[Explore]')).toBeTruthy();

    app.unmount();
    renderRouter('./app', { initialUrl: '/login' });
    expect(await screen.findByText('[Welcome Back]')).toBeTruthy();
    expect(screen.getByText('[Sign in to continue]')).toBeTruthy();
    expect(screen.getByText('[Sign In]')).toBeTruthy();
  });
});
