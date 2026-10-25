# Recipe: A Second Language

The app reads every string through `t()` from `shared/i18n/en.ts`, behind
the i18n seam (`shared/i18n/index.ts`). This recipe adds a second
language end to end: a dictionary, picking it from the device's languages
with `expo-localization`, falling back to English, and switching the layout
to right-to-left for a language like Arabic. The example adds Arabic (`ar`);
for a left-to-right language, skip the RTL parts.

Where the pieces go:

```
shared/i18n/ar.ts                          the Arabic dictionary
shared/i18n/locale.ts                      picks the language and direction at startup
shared/integrations/setup.ts               calls configureLocale()
__tests__/shared/i18n/dictionaries.test.ts fails on a missing key or placeholder
```

## Install

```bash
npx expo install expo-localization
```

It works in Expo Go. In a build, also add its config plugin to `plugins` in
`app.config.ts` with your languages, then rebuild:
`['expo-localization', { supportedLocales: { ios: ['en', 'ar'], android: ['en', 'ar'] } }]`.
It lists them in the system's per-app language settings (Android 13+,
iOS), and on iOS it is what makes the app count as localized in Arabic:
iOS decides the layout direction from the app's language, so without it an
Arabic phone gets a left-to-right layout until the direction below applies.
Don't set its `supportsRTL` or `forcesRTL` options: a value set there is
applied again at every launch and overrides the direction this recipe
chooses. Left unset, expo-localization allows RTL on the first launch and
then leaves the direction to the app.

## Add the dictionary

```ts
// shared/i18n/ar.ts
import type { Translations } from '@/shared/i18n';

/**
 * Arabic. `satisfies Partial<Translations>` rejects a key that en.ts doesn't
 * have (a typo, or one en.ts dropped); a key not translated yet falls back
 * to English, and the dictionaries test lists it.
 */
export const ar = {
  'tabs.home': 'الرئيسية',
  'home.title': 'مرحبًا',
  'login.title': 'مرحبًا بعودتك',
} satisfies Partial<Translations>;
```

Keep each `{placeholder}` from the English string: `t()` fills it by name.

Once the dictionary is complete, you can make type-checking enforce it: type
it `export const ar: Translations = { ... }`. `Translations` requires every
key in `en.ts`, so `npm run type-check` then fails as soon as `en.ts` gains
a key that `ar.ts` lacks (the type in the message is shortened here):

```
shared/i18n/ar.ts(3,14): error TS2741: Property '"login.title"' is missing in type '{ 'tabs.home': string; …; 'configError.body': string; }' but required in type 'Translations'.
```

A dictionary that isn't TypeScript (JSON from a translation service) gets
no such check; the test below covers both.

## Pick the language and direction

<!-- docs-check: requires expo-localization -->

```ts
// shared/i18n/locale.ts
import { I18nManager, Platform } from 'react-native';
import { getLocales } from 'expo-localization';
import {
  createDictionaryI18n,
  i18nSeam,
  type Translations,
} from '@/shared/i18n';
import { en } from '@/shared/i18n/en';

declare const ar: Partial<Translations>; // import { ar } from './ar';

/** The languages besides English, by language code. */
export const DICTIONARIES: Record<string, Partial<Translations>> = { ar };

/** Languages written right to left, among those the app has. */
const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur']);

/** The first of the user's preferred languages the app has, else English. */
export function pickLanguage(): string {
  for (const { languageCode } of getLocales()) {
    if (languageCode === 'en') return 'en';
    if (languageCode && languageCode in DICTIONARIES) return languageCode;
  }
  return 'en';
}

/**
 * Serves the dictionary for the device's languages and sets the layout
 * direction to match. Runs once at startup, before the first screen.
 */
export function configureLocale(): void {
  const language = pickLanguage();
  const dictionary = DICTIONARIES[language];
  if (dictionary) {
    // A key not translated yet shows the English string.
    i18nSeam.set(createDictionaryI18n(language, { ...en, ...dictionary }));
  }

  const rtl = RTL_LANGUAGES.has(language);
  if (Platform.OS === 'web') {
    const page = globalThis.document.documentElement;
    page.lang = language;
    page.dir = rtl ? 'rtl' : 'ltr';
  } else if (I18nManager.isRTL !== rtl) {
    // The native layout direction is read at launch, so this applies from
    // the next start.
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
}
```

Call it first in `configureIntegrations()` (`shared/integrations/setup.ts`),
which runs before the first screen renders: import `configureLocale` from
`@/shared/i18n/locale` and call `configureLocale();` right after the
`configured` check.

How the pieces behave:

- **Fallback.** The user's languages are tried in their order of
  preference; the first one the app has wins, and otherwise English. Within
  a language, an untranslated key shows English.
- **Direction.** On a phone set to Arabic, the layout is right to left from
  the first launch (expo-localization allows RTL, and on iOS the config
  plugin's `supportedLocales` makes Arabic the app's language).
  When the direction has to change (a phone set to Hebrew, which the app
  falls back to English for; or a user who switches between Arabic and
  English), `I18nManager` stores the new direction and it applies from the
  next launch. To apply it at once, reload the app after `forceRTL`: with
  `expo-updates` installed, `reloadAsync()` from `expo-updates` does that in
  release builds.
- **A language change while the app runs.** `configureLocale()` runs once.
  If you let users change the language in the app, or need to follow the
  system setting without a restart, call it again and re-render the app
  (`useLocales()` from expo-localization changes when the system language
  does).
- **Web.** `I18nManager` has no effect there; the `lang` and `dir`
  attributes on the page set the language and direction instead.

## Lay out for both directions

React Native mirrors the layout in RTL: `flexDirection: 'row'` runs right
to left, and `start` / `end` styles (`marginStart`, `paddingEnd`, `start`,
`borderEndWidth`) follow the direction. The shipped screens use those;
use them in yours, never `left` / `right` (or `marginLeft`), which stay put.
An icon that points somewhere (a back or next arrow) must flip; Paper's
`Appbar.BackAction` already does.

To check a screen, set the direction in a development build:
`I18nManager.forceRTL(true)`, reload, and look at it; then `forceRTL(false)`.
On the web, set `dir="rtl"` on the `html` element in the browser's
developer tools.

## Test the dictionaries

The type covers a TypeScript dictionary once it is typed `Translations`;
this test covers every dictionary, however it is typed or loaded, and also
fails when a translation drops or renames a `{placeholder}`:

```ts
// __tests__/shared/i18n/dictionaries.test.ts
import type { Translations } from '@/shared/i18n';
import { en } from '@/shared/i18n/en';

declare const DICTIONARIES: Record<string, Partial<Translations>>; // import { DICTIONARIES } from '@/shared/i18n/locale';

const placeholders = (text: string) => text.match(/\{\w+\}/g)?.sort() ?? [];

describe.each(Object.entries(DICTIONARIES))(
  'the %s dictionary',
  (_, dictionary) => {
    it('has every key in en.ts', () => {
      const missing = Object.keys(en).filter(key => !(key in dictionary));
      expect(missing).toEqual([]);
    });

    it('keeps the placeholders of each English string', () => {
      for (const [key, text] of Object.entries(dictionary)) {
        expect([key, placeholders(text)]).toEqual([
          key,
          placeholders(en[key as keyof typeof en]),
        ]);
      }
    });
  }
);
```

While a dictionary is still being translated, the first test lists what is
left; when it passes, type the dictionary `Translations`.

## Dates and numbers

Format them with the active language, so they match the strings:
`new Intl.DateTimeFormat(getLocale()).format(date)` and
`new Intl.NumberFormat(getLocale()).format(value)`, with `getLocale` from
`@/shared/i18n`. Hermes supports `Intl` on both platforms.
