# Agent Instructions

This is an Expo (SDK 57) and React Native app built from a starter: Expo
Router, TypeScript strict, React Native Paper (Material Design 3), Jest and
React Native Testing Library, and Maestro end-to-end flows. Follow these
instructions when you change the code; the linked docs have the details.

<!-- @maintainer remove-block-start -->

> **Maintaining the starter itself?** Only if `docs/maintainers/` exists and
> `git remote get-url origin` is the upstream repository named in
> `docs/maintainers/README.md`, also follow that file. Otherwise ignore
> `docs/maintainers/` and `scripts/maintainers/`: they are the starter's own
> process, not this project's (`scripts/maintainer-files.json` lists the
> files, which can be deleted).

<!-- @maintainer remove-block-end -->

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
- Demo code lives in `features/demo-*`, the Explore and showcase routes, and
  between `@demo remove-block-start` / `@demo remove-block-end` markers.
  Don't build on it; `npm run remove-demo` deletes it
  ([Remove the Demo](docs/remove-demo.md)).

Details: [Conventions](docs/conventions.md#project-structure).

## Conventions

- **Exports:** named exports; only route files in `app/` use default exports.
- **Names:** PascalCase files for components and screens
  (`SettingsScreen.tsx`), `useThing.ts` for hooks, camelCase for other
  modules.
- **Imports:** `@/` for anything outside the current feature, relative within
  it; `import type` for types.
- **Types:** strict, `noUncheckedIndexedAccess`, no `any`. Validate data at
  the edges (config with zod, API payloads in adapters).
- **Styles:** `StyleSheet.create` at the bottom of the file; colors from the
  Paper theme (`useTheme()`), never literals.
- **Text:** every user-facing string goes in `shared/i18n/en.ts` and is read
  with `t()`; the keys are typed.
- **Logging:** `logger` from `@/shared/lib/logger`, never `console`.
- **Errors:** catch async errors where you can show something; pass the rest
  to `logger.error`. Route groups have error boundaries.
- **Comments:** say why, not what; keep doc comments on exported APIs.

Lint enforces most of these as errors. Details:
[Conventions](docs/conventions.md#code-style),
[UI and Theming](docs/ui-and-theming.md).

## Adding things

- **A feature or screen:** create `features/<name>/screens/<Name>Screen.tsx`
  (a named export), then a one-line route file that re-exports it as the
  default: `app/<name>.tsx` for `/<name>`, `app/(app)/<name>.tsx` to require
  sign-in, or a file in `app/(tabs)/` for a tab. Add its strings to
  `shared/i18n/en.ts` and its tests under `__tests__/features/<name>/`.
  See [Adding a screen](docs/conventions.md#adding-a-screen) and
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
- **App state** beyond the session: see
  [State Management](docs/recipes/state-management.md); persist preferences
  with the wrappers in `shared/storage/`.

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
  `eas.json` ([Make It Yours](docs/make-it-yours.md)).

## Gates

Before you call a change done, run:

```bash
npm run lint && npm run type-check && npm run test:ci
```

CI also runs `npm run format:check`, `npm run docs:check` (compiles the
docs' snippets and checks their paths), `npm run audit:check`, and a web
export. Run `npm run docs:check` when you change docs. For flows on a device,
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
- [Make It Yours](docs/make-it-yours.md): app identity, icons, variants.
- [Connect Your Backend](docs/connect-your-backend.md): URLs, auth adapter,
  endpoints.
- [Remove the Demo](docs/remove-demo.md).
- [Conventions](docs/conventions.md): structure, navigation, code style.
- [API and Storage](docs/api-and-storage.md),
  [Environment Variables](docs/environment-variables.md),
  [UI and Theming](docs/ui-and-theming.md),
  [Error Reporting](docs/error-reporting.md),
  [Plug In a Provider](docs/plug-in-a-provider.md),
  [Testing](docs/testing.md),
  [State Management](docs/recipes/state-management.md).
