import { I18nManager, Platform } from 'react-native';

const mockLocales = jest.fn();
jest.mock('expo-localization', () => ({ getLocales: () => mockLocales() }));

const tags = (...codes: string[]) =>
  codes.map(code => ({ languageCode: code, languageTag: code }));

beforeEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
});

function load(isRTL: boolean) {
  const rn = require('react-native');
  Object.defineProperty(rn.I18nManager, 'isRTL', { value: isRTL, configurable: true });
  const allow = jest.spyOn(rn.I18nManager, 'allowRTL').mockImplementation(() => {});
  const force = jest.spyOn(rn.I18nManager, 'forceRTL').mockImplementation(() => {});
  const i18n = require('@/shared/i18n');
  const { configureLocale, pickLanguage } = require('@/shared/i18n/locale');
  return { i18n, configureLocale, pickLanguage, allow, force };
}

it.each([
  [['ar', 'en'], 'ar'],
  [['fr', 'ar'], 'ar'],
  [['he', 'en'], 'en'],
  [['en', 'ar'], 'en'],
  [['ja'], 'en'],
  [[null as unknown as string], 'en'],
])('picks %j -> %s', (codes, expected) => {
  mockLocales.mockReturnValue(tags(...codes));
  expect(load(false).pickLanguage()).toBe(expected);
});

it('serves Arabic with English for untranslated keys, and asks for RTL', () => {
  mockLocales.mockReturnValue(tags('ar'));
  const { i18n, configureLocale, allow, force } = load(false);
  configureLocale();
  expect(i18n.getLocale()).toBe('ar');
  expect(i18n.t('tabs.home')).toBe('الرئيسية');
  expect(i18n.t('home.session.signIn')).toBe('Sign in');
  expect(allow).toHaveBeenCalledWith(true);
  expect(force).toHaveBeenCalledWith(true);
});

it('asks for LTR when the device is RTL but the app falls back to English', () => {
  mockLocales.mockReturnValue(tags('he'));
  const { i18n, configureLocale, allow, force } = load(true);
  configureLocale();
  expect(i18n.getLocale()).toBe('en');
  expect(allow).toHaveBeenCalledWith(false);
  expect(force).toHaveBeenCalledWith(false);
});

it('leaves the direction alone when it already matches', () => {
  mockLocales.mockReturnValue(tags('ar'));
  const { configureLocale, force } = load(true);
  configureLocale();
  expect(force).not.toHaveBeenCalled();
});

it('sets lang and dir on the web page', () => {
  mockLocales.mockReturnValue(tags('ar'));
  const os = Platform.OS;
  Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  const page = { lang: '', dir: '' };
  (globalThis as unknown as { document: unknown }).document = { documentElement: page };
  try {
    const { configureLocale, force } = load(false);
    configureLocale();
    expect(page).toEqual({ lang: 'ar', dir: 'rtl' });
    expect(force).not.toHaveBeenCalled();
  } finally {
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
    delete (globalThis as unknown as { document?: unknown }).document;
  }
});
void I18nManager;
