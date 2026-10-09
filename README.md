# React Native Starter

An Expo (SDK 57) and React Native starter that is **production-ready by
configuration, not by installation**: the foundation (routing, session,
HTTP, storage, theming, error reporting, i18n, test setup) is in place, every
third-party service sits behind a typed seam with a no-op or console
default, and pointing it at your backend and providers is configuration and
small adapters, not a rewrite. It ships no credentialed services.

## Quick start

```bash
npm ci                 # Node 24 (.nvmrc) or 22.13+
cp .env.example .env   # turns on the public demo backends
npm start              # then press i, a, or w, or scan the QR code with Expo Go
```

Details, platforms, and troubleshooting: [Getting Started](docs/getting-started.md).

## What you get

- **Expo Router** with a tab layout, a signed-out-only `(auth)` group, and a
  signed-in-only `(app)` group guarded by `Stack.Protected`
  ([Conventions](docs/conventions.md#project-structure)).
- **Session and auth**: one `SessionProvider`, a backend-agnostic
  `AuthAdapter`, the token in the iOS Keychain / Android Keystore (memory only
  on web), and 401 handling ([Connect Your Backend](docs/connect-your-backend.md)).
- **HTTP client** with timeouts, typed `ApiError`s, and the token sent only to
  trusted origins ([API and Storage](docs/api-and-storage.md)).
- **Validated configuration**: environment variables checked with zod at
  startup, three build variants, EAS profiles
  ([Environment Variables](docs/environment-variables.md),
  [Make It Yours](docs/make-it-yours.md)).
- **React Native Paper** (Material Design 3) with one brand theme, light and
  dark ([UI and Theming](docs/ui-and-theming.md)).
- **Seams** for analytics, feature flags, push, OTA updates, error reporting,
  and i18n ([Plug In a Provider](docs/plug-in-a-provider.md),
  [Error Reporting and Logging](docs/error-reporting.md)).
- **Tests**: Jest and React Native Testing Library with shared mocks,
  full-app routing tests, and a coverage threshold in CI
  ([Testing](docs/testing.md)).
- **A removable demo**: DummyJSON sign-in, a Todos API example, and a
  component showcase; `npm run remove-demo` deletes them
  ([Remove the Demo](docs/remove-demo.md)).

Demo sign-in (with the demo backends on): `emilys` / `emilyspass`.

## Documentation

Start with [docs/README.md](docs/README.md). The usual path:

1. [Getting Started](docs/getting-started.md): install, run, scripts.
2. [Make It Yours](docs/make-it-yours.md): everything to change for your app.
3. [Connect Your Backend](docs/connect-your-backend.md): auth adapter, API, env.
4. [Remove the Demo](docs/remove-demo.md).

## State management

The session lives in `SessionProvider`; the starter adds no store library.
[Recipe: State Management](docs/recipes/state-management.md) shows Zustand,
Redux Toolkit, Jotai, and React Context on top of it.

## License

[MIT](LICENSE)
