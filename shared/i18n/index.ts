/**
 * Internationalization seam. The default serves the English dictionary in
 * shared/i18n/en.ts. To add languages, either register another dictionary with
 * `createDictionaryI18n` or plug in a library such as i18next in
 * shared/integrations/setup.ts; see docs/plug-in-a-provider.md.
 */
import { createSeam } from '@/shared/integrations/seam';
import { en, type TranslationKey, type Translations } from './en';

export type { TranslationKey, Translations } from './en';

export type TranslationParams = Record<string, string | number>;

export interface I18n {
  /** BCP 47 tag of the active language, e.g. "en". */
  locale: string;
  /** The string for `key`, with `{name}` placeholders filled from `params`. */
  t(key: TranslationKey, params?: TranslationParams): string;
}

/** Replaces `{name}` placeholders; unknown placeholders are left as-is. */
export function interpolate(
  template: string,
  params?: TranslationParams
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

export function createDictionaryI18n(
  locale: string,
  dictionary: Translations
): I18n {
  return {
    locale,
    t: (key, params) => interpolate(dictionary[key] ?? key, params),
  };
}

export const englishI18n = createDictionaryI18n('en', en);

export const i18nSeam = createSeam<I18n>(englishI18n);

/** Translates `key` with the active i18n implementation. */
export const t = (key: TranslationKey, params?: TranslationParams): string =>
  i18nSeam.get().t(key, params);

/** The active locale. */
export const getLocale = (): string => i18nSeam.get().locale;
