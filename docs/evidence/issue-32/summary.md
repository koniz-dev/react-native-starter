# Issue 32 verification — error-reporting seam and logger

Verified on 2026-10-07.

## Change

- `integrations/errorReporter.ts`: `ErrorReporter` (`captureException`,
  `captureMessage`, `setUser`), the default `consoleErrorReporter` (one
  `[error-reporter] …` console line per report; `setUser` is a no-op), and
  `errorReporterSeam` (the same `createSeam` as the other seams) with
  `setErrorReporter()` to register a provider. `SessionProvider` sets the user id on sign-in and clears it on
  sign-out or expiry.
- `utils/logger.ts` rewritten: `debug` / `info` / `warn` / `error`, a
  minimum console level read on every call, redaction (`redact()`), and
  `logger.error` forwarding to the reporter in every build, at any level,
  even when the reporter throws. `createLogger(getSettings)` for tests.
  The unused `formatApiError` / `logApiError` helpers were removed.
- `config/env.ts`: `EXPO_PUBLIC_LOG_LEVEL` (`debug|info|warn|error|silent`),
  default `debug` / `info` / `warn` for development / preview / production.
  Documented in `.env.example` and `docs/environment-variables.md`.
- `services/storage.ts`: its four `console.error` calls now use the logger.
  ESLint `no-console` is an error everywhere except `utils/logger.ts`,
  `integrations/errorReporter.ts`, tests, and scripts.
- `components/ErrorBoundary.tsx`: the app boundary reports through the logger
  in all builds with `extra.componentStack` (it logged only in `__DEV__`
  before), moved inside `PaperProvider` in `app/_layout.tsx`, and its
  fallback has "Try again" and "Go home". `RouteErrorBoundary` is exported as
  `ErrorBoundary` from `app/(tabs)`, `app/(auth)`, and `app/(app)` layouts.
- Docs: new `docs/error-reporting.md` (logger, redaction, seam, boundaries, a
  Sentry adapter example that is not installed); `docs/integrations.md`
  table; `docs/error-and-loading.md`, `docs/expo-debugging-notes.md`,
  `docs/conventions.md`, `docs/api-and-storage.md` no longer show `console`
  in app code; `docs/README.md` index.
- Jest `testTimeout` raised to 15 s (`package.json`, explained in
  `docs/testing.md`): the first full-app render in a test file loads every
  route module and passed 5 s under parallel workers several times while this
  issue was tested (the i18n and session-route cold-start tests; both pass in
  about 1.5 s alone).

## Acceptance criteria

| #   | Criterion                                                                                                                                                                       | Evidence                                                                                                                                                                                                                                                                                                                                                             | Result |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Typed `ErrorReporter` with console default and `setErrorReporter()` registration; the logger forwards errors in every build                                                     | `integrations/errorReporter.ts` (`setErrorReporter()`, a shorthand for `errorReporterSeam.set()`); test "setErrorReporter registers a provider"; logger tests "reports an Error…", "also forwards in development", "writes nothing to the console when silent" (still reports), "the default reporter writes one console line" in [05](05-logger-boundary-tests.log) | PASS   |
| 2   | Levels with a per-environment minimum (from config); `Authorization` and response bodies redacted outside development                                                           | `config/env.ts`; tests "defaults the log level per environment and accepts an override", "writes only messages at or above the minimum level", "always redacts auth headers…", "redacts response bodies outside development only", "reduces Errors to name, message, code, and status…", "redacts what the logger writes outside development"                        | PASS   |
| 3   | Every `console.*` in app code replaced by the logger; `no-console` is an error except in the logger and reporter default                                                        | [06-no-console.log](06-no-console.log): a probe `console.log` in `services/storage.ts` fails lint, the logger and reporter pass, and no `console.*` calls remain in app code                                                                                                                                                                                         | PASS   |
| 4   | `ErrorBoundary` reports in all builds with component stack, renders inside the theme provider (dark mode), offers "Go home"; route-level boundaries exported from group layouts | `components/ErrorBoundary.tsx`, `app/_layout.tsx`, the three group layouts; boundary tests in [05](05-logger-boundary-tests.log); [07](07-mutation-boundary-outside-theme.log): with the boundary moved back outside `PaperProvider`, both the light and dark app-boundary tests fail (fallback gets Paper's default background)                                     | PASS   |
| 5   | Jest: logger → reporter in production mode; redaction; boundary catches a throwing child, reports, renders a themed fallback in light/dark, recovers                            | [05-logger-boundary-tests.log](05-logger-boundary-tests.log): 19 logger, 9 boundary, 13 config tests. Boundary tests render the real app with a throwing route added (`(tabs)/boom`) in light and dark, check the fallback's background and title colors against the theme, the report, "Go home" (back to `/`), and "Try again"                                     | PASS   |
| 6   | Docs page shows how to plug in a provider (example adapter, not installed)                                                                                                      | `docs/error-reporting.md` "Plugging in a provider"                                                                                                                                                                                                                                                                                                                   | PASS   |
| 7   | Gates pass locally and in CI                                                                                                                                                    | [01](01-lint.log) (0 errors; 6 existing `ThemedText.tsx` warnings, removed by #35), [02](02-type-check.log), [03](03-test-ci.log) (21 suites / 149 tests; earlier, three consecutive full runs passed after the timeout change), [04](04-format-check.log); production web export builds ([08](08-web-export-production.log)); CI run in the closing comment         | PASS   |

## Not verified on a device

The criteria are Jest and toolchain criteria; no simulator run was made. The
fallback's colors are checked as theme tokens in Jest; how it looks on a
device is a visual judgment outside this issue.
