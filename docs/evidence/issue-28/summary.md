# Issue 28 verification — validated environment config

Verified on 2026-10-06.

## Change

- `config/env.ts` (new) is the only module that reads `process.env`. It reads
  each `EXPO_PUBLIC_*` variable by full name (Expo inlines only full
  references), validates with a zod schema, and exposes `configResult`
  (parsed once; never throws), `getConfig()` (throws `ConfigError`), and
  `parseEnv(raw, isDevBuild)` for tests.
  - `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_AUTH_API_URL`: absolute http(s) URLs,
    required unless `EXPO_PUBLIC_USE_DEMO_BACKENDS=true`, in which case missing
    ones use JSONPlaceholder / DummyJSON.
  - `EXPO_PUBLIC_APP_ENV`: `development` | `preview` | `production`, defaulting
    from `__DEV__`. Outside development every URL and trusted origin must be
    https.
  - `EXPO_PUBLIC_API_TRUSTED_ORIGINS` (from #27) is now validated here.
- Services read configuration lazily (`config.baseURL ??= getConfig()...` in
  request interceptors; `getTrustedTokenOrigins()`), because Expo Router
  imports every route at startup and an import-time read would crash before
  the error screen renders.
- `app/_layout.tsx` renders `components/ConfigErrorScreen.tsx` instead of the
  app when `configResult` fails, listing each variable and problem.
- ESLint `no-restricted-properties` rejects `process.env` outside
  `config/env.ts`, `__tests__/`, and `jest.setup.env.js`.
- `jest.setup.env.js` (in `jest.setupFiles`) sets the demo flag, like a fresh
  checkout after `cp .env.example .env`.
- `.env.example` turns the demo flag on and leaves real URLs empty; `.env` is
  now gitignored (it was not before; only `.env*.local` was).
- Docs: `docs/environment-variables.md` rewritten around the real variables,
  rules, precedence (checked against `@expo/env`), and how to add a variable;
  getting-started makes the `.env` step required; README quick start and
  api-and-storage updated.

Not included: a request timeout value. The timeout is introduced together
with the HTTP client factory in #30, which will add its variable to this
schema.

## Acceptance criteria

| #   | Criterion                                                             | Evidence                                                                                                                                                                                                           | Result                                          |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| 1   | One typed module reads `process.env`, parsing every variable with zod | `config/env.ts`; `grep process.env` outside it finds nothing in app code                                                                                                                                           | PASS (timeout value deferred to #30, see above) |
| 2   | Demo URLs only with an explicit flag; otherwise missing values fail   | Tests "reports every missing required URL…", "fills missing URLs from the demo backends only when the flag is on"; [no-.env screen](uat/ios-01-no-env-config-error.png)                                            | PASS                                            |
| 3   | Non-https rejected outside development                                | Test "rejects http outside development and allows it in development"; [production + http screen](uat/ios-02-production-http-rejected.png)                                                                          | PASS                                            |
| 4   | Validation failure renders a clear startup error screen               | Test `__tests__/navigation/configError.test.tsx` (renders the app router with no config → error screen lists both variables, app hidden); iOS screenshots above                                                    | PASS                                            |
| 5   | ESLint forbids `process.env` outside the config module                | [06-eslint-process-env-probe.log](06-eslint-process-env-probe.log): a probe file reading `process.env` fails with `no-restricted-properties`; `npm run lint` has 0 errors                                          | PASS                                            |
| 6   | Tests: valid, missing, invalid URL, http in production, demo flag     | [05-config-tests.log](05-config-tests.log): 28 tests across config, startup screen, and API client                                                                                                                 | PASS                                            |
| 7   | `docs/environment-variables.md` rewritten around real variables       | The doc; invented variables (`EXPO_PUBLIC_API_KEY`, `EXPO_PUBLIC_ENABLE_ANALYTICS`, `types/env.d.ts`, `eas secret`) removed                                                                                        | PASS                                            |
| 8   | Gates pass locally and in CI                                          | [01](01-lint.log) (0 errors; 6 existing `ThemedText.tsx` warnings, removed by #35), [02](02-type-check.log), [03](03-test-ci.log) (14 suites / 91 tests), [04](04-format-check.log); CI run in the closing comment | PASS                                            |

## Device runs (Expo Go 57.0.9)

| Configuration                                                         | Result                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No `.env` (fresh checkout), iOS 18.6                                  | [Configuration error](uat/ios-01-no-env-config-error.png) naming `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_AUTH_API_URL`                                                                                                                                                               |
| `EXPO_PUBLIC_APP_ENV=production`, `EXPO_PUBLIC_API_URL=http://…`, iOS | [Configuration error](uat/ios-02-production-http-rejected.png): "must use https outside development (APP_ENV is production)"                                                                                                                                                        |
| `cp .env.example .env`, iOS                                           | [Explore loads JSONPlaceholder](uat/ios-03-demo-config-explore.png); log out → [signed out](uat/ios-04-demo-config-signed-out.png); sign in through the login screen (XCUITest) → [signed in](uat/ios-05-demo-config-signed-in.png), i.e. auth requests use the configured auth URL |
| `cp .env.example .env`, Android 17 / API 37                           | [Explore loads](uat/android-01-demo-config-explore.png)                                                                                                                                                                                                                             |
