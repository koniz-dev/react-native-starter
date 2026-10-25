# Agent Instructions

This is an Expo (SDK 58) and React Native app: Expo
Router, TypeScript strict, React Native Paper (Material Design 3), Jest and
React Native Testing Library, and Maestro end-to-end flows. Follow these
instructions when you change the code; the linked docs have the details.

## Project structure

```
app/            Expo Router routes only: layouts and one-line route files
features/<name>/  one folder per feature: screens/, components/, api/, hooks/, types.ts
shared/         the foundation: config, http, session, storage, ui, lib, integrations, i18n
__tests__/      tests, mirroring the tree (app/, features/<name>/, shared/<area>/)
testing/        shared test helpers (render with providers, mocks)
.maestro/       end-to-end flows
```

- Dependency direction: `app/` → `features/` → `shared/`. `shared/` never
  imports a feature; the one exception is `shared/integrations/setup.ts`, the
  composition root that registers adapters. Features don't import each
  other's internals.

<!-- @demo remove-block-start -->

- Demo code lives in `features/demo-*`, the Explore and showcase routes, and
  between `@demo` markers (`remove-block-start` / `remove-block-end`). Don't
  build on it; `npm run remove-demo` deletes it
  ([Remove the Demo](docs/remove-demo.md)).

<!-- @demo remove-block-end -->

Details: [Conventions](docs/conventions.md#project-structure).

## Conventions

- **Exports:** named exports; only route files in `app/` use default exports.
- **Names:** PascalCase files for components and screens
  (`SettingsScreen.tsx`), `useThing.ts` for hooks, camelCase for other
  modules.
- **Imports:** `@/` for anything outside the current feature, relative within
  it; `import type` for types.
- **Types:** strict, `noUncheckedIndexedAccess`, no `any`. Validate data at
  the edges with zod: config, and API payloads in adapters and `api/`
  modules.
- **Styles:** `StyleSheet.create` at the bottom of the file; colors from the
  Paper theme (`useTheme()`), never literals.
- **Text:** every user-facing string goes in `shared/i18n/en.ts` and is read
  with `t()`; the keys are typed.
- **Logging:** `logger` from `@/shared/lib/logger`, never `console`.
- **Errors:** catch async errors where you can show something; pass the rest
  to `logger.error`. Route groups have error boundaries.
- **Comments:** say why, not what; keep doc comments on exported APIs.

Lint enforces the exports, imports (including the dependency direction),
types, colors, logging, and unhandled promises as errors; names, style
placement, and `t()` are by review. Details:
[Conventions](docs/conventions.md#code-style),
[UI and Theming](docs/ui-and-theming.md).

## Adding things

- **A feature or screen:** create `features/<name>/screens/<Name>Screen.tsx`
  (a named export), then a one-line route file that re-exports it as the
  default: `app/<name>.tsx` for `/<name>`, `app/(app)/<name>.tsx` to require
  sign-in, or a file in `app/(tabs)/` for a tab. Add its strings to
  `shared/i18n/en.ts` and its tests under `__tests__/features/<name>/`.
  `npm run new-feature -- <name> [--route public|signed-in|tab]` scaffolds
  all of these. See [Adding a screen](docs/conventions.md#adding-a-screen) and
  [Navigation](docs/conventions.md#navigation).
- **An endpoint:** typed functions in `features/<name>/api/`, built on the
  app client in `shared/http/api.ts`; load data in screens with `useFetch`
  from `shared/lib/useFetch.ts`. See
  [Connect Your Backend](docs/connect-your-backend.md#3-add-endpoints-for-a-feature)
  and [API and Storage](docs/api-and-storage.md).
- **Sign-in against your backend:** an `AuthAdapter` registered in
  `shared/integrations/setup.ts`
  ([Connect Your Backend](docs/connect-your-backend.md#2-sign-in-write-an-authadapter)).
- **A third-party service** (analytics, feature flags, push, OTA updates,
  error reporting, i18n): write an adapter for the existing seam in
  `shared/integrations/` and register it in `shared/integrations/setup.ts`.
  Don't call the SDK from features. See
  [Plug In a Provider](docs/plug-in-a-provider.md) and
  [Error Reporting](docs/error-reporting.md#plugging-in-a-provider).
- **App state** beyond the session: persist preferences with the wrappers
  in `shared/storage/`.

<!-- @recipes remove-block-start -->

- **A store library:** see
  [State Management](docs/recipes/state-management.md) (Zustand, Redux
  Toolkit, Jotai, React Context).

<!-- @recipes remove-block-end -->

## Configuration and environment

- `shared/config/env.ts` is the only module that reads `process.env`. A new
  variable is `EXPO_PUBLIC_*`, read by its full name in `readRawEnv()`,
  validated with zod, added to `.env.example`, and documented in
  [Environment Variables](docs/environment-variables.md). Code reads values
  through `getConfig()`.
- Never hard-code URLs, keys, or environment-specific values elsewhere, and
  never commit `.env`. `EXPO_PUBLIC_*` values ship in the app bundle, so they
  must not be secrets.
- App name, IDs, icons, and build variants live in `app.config.ts` and
  `eas.json` ([App Config](docs/app-config.md)).

## Gates

Before you call a change done, run:

```bash
npm run lint && npm run type-check && npm run test:ci
```

CI also runs `npm run format:check`, `npm run docs:check` (compiles and lints
the docs' snippets and checks their paths), `npm run doctor` (Expo Doctor
against the installed SDK), a web export, and an iOS and Android bundle
(which catches a broken import in a platform file); the Audit workflow runs
`npm run audit:check`. Run `npm run docs:check` when you change
docs; name a file that doesn't exist yet with a placeholder
([docs/README.md](docs/README.md)). For flows on a device,
`npm run test:e2e:ios` or `npm run test:e2e:android` runs the Maestro flows;
add a flow in `.maestro/` for a new user journey. Test new behavior, not only
rendering: see [Testing](docs/testing.md).

Keep commits small and single-purpose.

## Design principles

- **Production-ready by configuration.** Core concerns (validated config,
  HTTP client with timeouts and 401 handling, secure token storage, error
  boundary and logger, build variants, CI) already work; extend them rather
  than adding parallel systems.
- **Vendor-neutral seams.** Every external service sits behind a small typed
  seam with a no-op or console default, so adding a provider never means
  restructuring code.
- **No dead code.** One theming system, one HTTP client, no unused
  components or utilities.

## Docs map

- [Getting Started](docs/getting-started.md): install, run, scripts,
  troubleshooting.
- [App Config](docs/app-config.md): app identity, build variants, icons.
- [Connect Your Backend](docs/connect-your-backend.md): URLs, auth adapter,
  endpoints.

<!-- @demo remove-block-start -->

- [Remove the Demo](docs/remove-demo.md).

<!-- @demo remove-block-end -->

- [Conventions](docs/conventions.md): structure, navigation, code style.
- [API and Storage](docs/api-and-storage.md),
  [Environment Variables](docs/environment-variables.md),
  [UI and Theming](docs/ui-and-theming.md),
  [Error Reporting](docs/error-reporting.md),
  [Plug In a Provider](docs/plug-in-a-provider.md),
  [Testing](docs/testing.md).

<!-- @recipes remove-block-start -->

- [State Management](docs/recipes/state-management.md): store library
  recipes.
- [Certificate Pinning](docs/recipes/certificate-pinning.md): public-key
  pinning for the API hosts.
- [A Second Language](docs/recipes/localization.md): device locale,
  fallback, and RTL.

<!-- @recipes remove-block-end -->
