# Documentation

Guides for this starter. Each topic has one page; for general Expo and React
Native topics, the pages link to the official documentation.

## Start here

- [Getting Started](getting-started.md): install, run, scripts, troubleshooting.
- [Make It Yours](make-it-yours.md): app identity, icons, variants, theme, and
  everything else to change.
- [Connect Your Backend](connect-your-backend.md): URLs, an auth adapter, and
  endpoints.
- [Remove the Demo](remove-demo.md): strip the demo features.

## Guides

- [Plug In a Provider](plug-in-a-provider.md): analytics, feature flags, push,
  OTA updates, i18n.
- [Error Reporting and Logging](error-reporting.md): logger, error reporter,
  error boundaries.
- [UI and Theming](ui-and-theming.md): Paper, the brand theme, dark mode,
  fonts, safe areas.

## Recipes

- [State Management](recipes/state-management.md): Zustand, Redux Toolkit,
  Jotai, or React Context next to the session provider.

## Reference

- [Conventions](conventions.md): project structure, navigation, where code
  goes, code style.
- [API and Storage](api-and-storage.md): HTTP clients, errors, token handling,
  401s, storage.
- [Environment Variables](environment-variables.md): every `EXPO_PUBLIC_*`
  variable and its validation.
- [Testing](testing.md): test layout, shared setup, coverage, end-to-end
  flows.

`npm run docs:check` compiles every TypeScript snippet in these pages against
the code and checks every path, link, and `npm run` script they mention; CI
runs it.
