# Issue #140: recipe for a second language

Branch `sdk-58`, commit fc671e2: [`docs/recipes/localization.md`](https://github.com/koniz-dev/react-native-starter/blob/fc671e2/docs/recipes/localization.md). Non-security work ships with the SDK 58 merge (#134).

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Adds a second dictionary, selects it from the device locale with `expo-localization`, falls back to English, covers RTL with `I18nManager` (including the reload it needs) | PASS | Arabic `ar.ts` (`satisfies Partial<Translations>`), `locale.ts` (`pickLanguage()` over `getLocales()` in preference order, English otherwise; per-key fallback by merging over `en`; `I18nManager.allowRTL`/`forceRTL` when the direction differs, applying from the next launch, or at once with `expo-updates`' `reloadAsync()`; `lang`/`dir` on the web page). The config plugin's `supportedLocales` is recommended, and `supportsRTL`/`forcesRTL` left unset: checked in expo-localization 58.0.5's source (iOS `setRTLPreferences`/`resolveRTL`, Android `setRTLFromStringResources`) and React Native's `RCTI18nUtil.m` (iOS takes the direction from the app's language). `recipe-behaviour.log` / `localeBehaviour.test.ts`: the blocks, extracted verbatim and run with `getLocales` mocked, pick `ar`, `en`, or fall back as listed, serve English for untranslated keys, request RTL for Arabic and LTR for a Hebrew phone falling back to English, leave a matching direction alone, and set `lang`/`dir` on the web. |
| 2 | A test pattern that fails when a dictionary misses a key from `en.ts` (say so if the type already enforces it) | PASS | The recipe says `Translations` enforces it once a dictionary is typed `Translations`, with a real `tsc` error (shortened), and gives `dictionaries.test.ts` for any dictionary (also JSON), which also checks placeholders. `recipe-behaviour.log`: the partial dictionary fails "has every key" listing what is left; a complete one typed `Translations` passes `tsc` and both tests; dropping `{name}` from one string fails the placeholder test. |
| 3 | Code blocks pass `npm run docs:check`; `docs/README.md` and `docs/plug-in-a-provider.md` link it | PASS | `gates.log` (750 tests, docs:check 50 snippets, "No problems.") and CI 40189048619 on fc671e2 (same counts, no skipped block); Audit 40189048452 green. `expo-localization` 58.0.5 is pinned in `docs/recipes/`. Linked from `docs/README.md`, AGENTS.md, and the i18n section of Plug In a Provider. |

## Recipes lifecycle

`recipes-lifecycle.log`: after `remove-demo` the recipe stays, has no demo word left, and docs:check passes; `init-project --remove-recipes` removes it and every link (Plug In a Provider's link sits in an `@recipes` block, and the file was added to init-project's `RECIPE_MARKED_FILES`); `--keep-recipes` keeps the recipe and its links. The first draft quoted a `tsc` error naming `tabs.explore`, a demo key; `removeDemo.test.ts` caught it, and the quote now uses a key that stays.

Not verified here: the direction change on a device (it needs a native build with an RTL language).
