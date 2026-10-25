<div align="center">

# React Native Starter

**A production-ready Expo and React Native template that you configure, not rebuild.**

Routing, session, HTTP, secure storage, theming, error reporting, i18n, and
tests are already wired. Every third-party service sits behind a small typed
seam, so pointing the app at your backend and providers takes configuration
and a few adapters, not a rewrite.

[![CI](https://github.com/koniz-dev/react-native-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/koniz-dev/react-native-starter/actions/workflows/ci.yml)
[![Audit](https://github.com/koniz-dev/react-native-starter/actions/workflows/audit.yml/badge.svg)](https://github.com/koniz-dev/react-native-starter/actions/workflows/audit.yml)
[![Release](https://img.shields.io/github/v/release/koniz-dev/react-native-starter)](https://github.com/koniz-dev/react-native-starter/releases)
[![Expo SDK 57](https://img.shields.io/badge/Expo_SDK-57-000020?logo=expo)](https://docs.expo.dev/)
![iOS | Android | Web](https://img.shields.io/badge/platforms-iOS_%7C_Android_%7C_Web-blue)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](tsconfig.json)
[![MIT license](https://img.shields.io/github/license/koniz-dev/react-native-starter)](LICENSE)

[**Use this template**](https://github.com/koniz-dev/react-native-starter/generate)
· [Getting Started](docs/getting-started.md)
· [Documentation](docs/README.md)
· [Releases](https://github.com/koniz-dev/react-native-starter/releases)

</div>

<!-- @demo remove-block-start -->

<p align="center">
  <img src="https://raw.githubusercontent.com/koniz-dev/react-native-starter/readme-assets/ios-home-light.png" width="200" alt="Home screen in light mode on an iPhone">
  <img src="https://raw.githubusercontent.com/koniz-dev/react-native-starter/readme-assets/ios-explore-light.png" width="200" alt="The Todos API example loading data in light mode">
  <img src="https://raw.githubusercontent.com/koniz-dev/react-native-starter/readme-assets/ios-showcase-dark.png" width="200" alt="The React Native Paper component showcase in dark mode">
  <img src="https://raw.githubusercontent.com/koniz-dev/react-native-starter/readme-assets/ios-login-dark.png" width="200" alt="The sign-in screen in dark mode">
</p>

<p align="center"><sub>The removable demo on the iOS Simulator, in light and dark mode.
The same code runs on Android and on the web.</sub></p>

<!-- @demo remove-block-end -->

## Why this starter

- **Configure, don't rebuild.** Validated config, an HTTP client with timeouts
  and 401 handling, secure token storage, an error boundary and logger, build
  variants, and CI already work. You extend them instead of adding parallel
  systems.
- **No vendor lock-in.** Analytics, feature flags, push, OTA updates, error
  reporting, and i18n each have a typed seam with a no-op or console default.
  Adding a provider is one adapter, registered in one file.
- **Tested like a product.** Unit and full-app routing tests with coverage
  thresholds, Maestro flows on iOS and Android, and docs whose code snippets
  compile in CI.
- **Yours in one command.** `npm run init-project` sets your app's name and
  IDs and removes the template's text. The starter ships no credentialed
  services.

## Quick start

```bash
npm ci                 # Node 24 (.nvmrc); 24.3+ or 22.13+ also work
cp .env.example .env   # then see Getting Started for the backend URLs
npm start              # then press i, a, or w, or scan the QR code with Expo Go
```

<!-- @init remove-block-start -->

Made a repository from this template? Run `npm run init-project` first: it
sets your app's name and IDs and removes what belongs to the template
([Getting Started](docs/getting-started.md#make-it-your-project-first)).

<!-- @init remove-block-end -->

Details, platforms, and troubleshooting: [Getting Started](docs/getting-started.md).

## What you get

| Area                 | What is in place                                                                                                               | Docs                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Navigation**       | Expo Router with tabs, a signed-out-only `(auth)` group, and a signed-in-only `(app)` group guarded by `Stack.Protected`       | [Conventions](docs/conventions.md#project-structure)                                         |
| **Session and auth** | One `SessionProvider`, a backend-agnostic `AuthAdapter`, the token in the iOS Keychain / Android Keystore (memory only on web) | [Connect Your Backend](docs/connect-your-backend.md)                                         |
| **HTTP**             | Timeouts, typed `ApiError`s, 401 handling, and the token sent only to trusted origins                                          | [API and Storage](docs/api-and-storage.md)                                                   |
| **Configuration**    | Environment variables validated with zod at startup, three build variants, EAS profiles                                        | [Environment Variables](docs/environment-variables.md), [App Config](docs/app-config.md)     |
| **UI**               | React Native Paper (Material Design 3) with one brand theme, light and dark                                                    | [UI and Theming](docs/ui-and-theming.md)                                                     |
| **Services**         | Seams for analytics, feature flags, push, OTA updates, error reporting, and i18n                                               | [Plug In a Provider](docs/plug-in-a-provider.md), [Error Reporting](docs/error-reporting.md) |
| **Tests**            | Jest and React Native Testing Library with shared mocks, full-app routing tests, and Maestro end-to-end flows                  | [Testing](docs/testing.md)                                                                   |

<!-- @demo remove-block-start -->

**A removable demo** shows the pieces working together: DummyJSON sign-in, a
Todos API example with loading, error, and retry states, and a component
showcase. `npm run remove-demo` deletes it
([Remove the Demo](docs/remove-demo.md)). Demo sign-in, with the demo backends
on: `emilys` / `emilyspass`.

<!-- @demo remove-block-end -->

## Tech stack

| Layer      | Choice                                                     |
| ---------- | ---------------------------------------------------------- |
| Framework  | Expo SDK 57, React Native 0.86, React 19                   |
| Navigation | Expo Router (file-based routes)                            |
| UI         | React Native Paper 5 (Material Design 3)                   |
| Language   | TypeScript in strict mode, with `noUncheckedIndexedAccess` |
| Validation | zod 4, for config and API payloads                         |
| Testing    | Jest, React Native Testing Library, Maestro                |
| Tooling    | ESLint 9, Prettier, Expo Doctor, GitHub Actions            |

## Project structure

```
app/              Expo Router routes only: layouts and one-line route files
features/<name>/  one folder per feature: screens/, components/, api/, hooks/, types.ts
shared/           the foundation: config, http, session, storage, ui, lib, integrations, i18n
__tests__/        tests, mirroring the tree
testing/          shared test helpers (render with providers, mocks)
.maestro/         end-to-end flows
```

Dependencies point one way, `app/` → `features/` → `shared/`, and lint
enforces it. See [Conventions](docs/conventions.md).

## Quality gates

Every push to `main` and every pull request runs, in CI:

- lint (zero warnings), format, and strict type-checking;
- the test suite with coverage thresholds (95% of statements and lines in
  `app/`, `features/`, and `shared/`);
- `npm run docs:check`: every TypeScript snippet in the docs compiles, and
  every path and script they name exists;
- Expo Doctor, a production web export, and the iOS and Android bundles.

The Audit workflow checks dependencies for high and critical advisories on
the same events and weekly, and CodeQL scans the code. Manual workflows run the
Maestro flows on an Android emulator and an iOS simulator. Run the same gates
locally:

```bash
npm run lint && npm run type-check && npm run test:ci
```

## Documentation

Start with [docs/README.md](docs/README.md). The usual path:

1. [Getting Started](docs/getting-started.md): install, run, scripts.
2. [Make It Yours](docs/make-it-yours.md): everything to change for your app.
3. [Connect Your Backend](docs/connect-your-backend.md): auth adapter, API, env.

<!-- @demo remove-block-start -->

4. [Remove the Demo](docs/remove-demo.md).

<!-- @demo remove-block-end -->

## State management

The session lives in `SessionProvider`; the starter adds no store library.
[Recipe: State Management](docs/recipes/state-management.md) shows Zustand,
Redux Toolkit, Jotai, and React Context on top of it.

<!-- @init remove-block-start -->

## Support

The starter is in maintenance mode: it takes security fixes, regressions,
compatibility updates, and documentation fixes
([Support Policy](https://github.com/koniz-dev/react-native-starter/blob/maintainers/support-policy.md)).
It targets the stable Expo SDK that the store's Expo Go runs; to ask for an
upgrade or report a bug, [open an issue](https://github.com/koniz-dev/react-native-starter/issues).
Report a vulnerability privately from the repository's **Security** tab.

<!-- @init remove-block-end -->

## License

[MIT](LICENSE)
