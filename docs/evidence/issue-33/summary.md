# Issue 33 verification — vendor-neutral integration seams

Verified on 2026-10-07.

## Change

- `integrations/seam.ts`: `createSeam(default)` gives each integration a typed
  slot with `get()`, `set()`, and `reset()`.
- Seams with credential-free defaults:
  - `integrations/analytics.ts`: `track`, `screen`, `identify`; the default logs
    at debug level through `utils/logger.ts` (development only).
    `integrations/useScreenTracking.ts`, mounted in `app/_layout.tsx`, reports a
    screen view on every Expo Router path change.
  - `integrations/featureFlags.ts`: `isEnabled`, `getValue`, typed by the
    static defaults in `config/featureFlags.ts`.
  - `integrations/pushNotifications.ts`: `requestPermission`, `getToken`,
    `onNotification`; the default reports `not-configured`.
  - `integrations/updates.ts`: `checkForUpdate`, `apply`; the default never
    finds an update.
  - `i18n/`: `t(key, params)` and `getLocale()`, an English dictionary with a
    typed key set (`i18n/en.ts`), `{name}` interpolation, and
    `createDictionaryI18n` for more languages.
- `integrations/setup.ts` (`configureIntegrations()`, called from
  `app/_layout.tsx` before the first render) is the single place to register
  provider adapters.
- All strings on the shipped screens now come from `t()`: tab titles, the Home
  session card, login, Explore, the error boundary fallback, and the
  configuration error screen. The Paper component showcase on Home is demo
  content and keeps literal text (it moves to a removable demo route in #36).
  The login demo hint is now plain text, dropping the iOS-invalid
  `fontFamily: 'monospace'` style.
- `docs/integrations.md`: the seams, their defaults, and example adapters
  (PostHog, a remote-flag reader, expo-notifications, expo-updates,
  dictionary/i18next), marked as examples that are not installed. Linked from
  README and `docs/README.md`.

## Acceptance criteria

| #   | Criterion                                                                                                                                                                                                                                                                   | Evidence                                                                                                                                                                                                                                                                                                                         | Result |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Typed seams with defaults, registered at the root, replaceable without restructuring: analytics (screen views wired to Expo Router), feature flags (static config), push (no-op "not configured"), updates (no-op), i18n (typed English dictionary used by shipped screens) | Modules above; `integrations/setup.ts`; tests in row 2                                                                                                                                                                                                                                                                           | PASS   |
| 2   | Unit test for each default and a docs page with example adapters                                                                                                                                                                                                            | [05-integration-tests.log](05-integration-tests.log): 12 tests, covering every default, provider replacement and reset, screen tracking through the real router (`/` then `/explore`), i18n interpolation, and a pseudo-locale render showing Home, the tabs, and Login read their strings from the seam; `docs/integrations.md` | PASS   |
| 3   | No new dependency that needs an account, key, or native config                                                                                                                                                                                                              | `package.json` / `package-lock.json` unchanged in this change                                                                                                                                                                                                                                                                    | PASS   |
| 4   | Gates pass locally and in CI                                                                                                                                                                                                                                                | [01](01-lint.log) (0 errors; the 6 existing `ThemedText.tsx` warnings, removed by #35), [02](02-type-check.log), [03](03-test-ci.log) (18 suites / 111 tests), [04](04-format-check.log); CI run in the closing comment                                                                                                          | PASS   |

## Device smoke (iOS 18.6 simulator, Expo Go)

Metro logged a screen view for each route change made with deep links
([log](uat/ios-metro-analytics.log)): `[analytics] screen /`, then
`[analytics] screen /explore`. Explore rendered every translated string,
including those with parameters ("Todos (10)", "User ID: 1 • ID: 1",
"✓ Done") ([screenshot](uat/ios-explore-i18n.png)).
