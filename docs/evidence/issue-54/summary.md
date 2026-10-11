# Issue 54 verification — LogBox toasts for handled request failures

Verified on 2026-10-11 on `main` at
[`65fd3ea`](https://github.com/koniz-dev/react-native-starter/commit/65fd3ea).

## Change

- **`shared/http/httpClient.ts`.** The failed-request log line is the same
  (method, path, code, status), but its level now comes from the new
  `requestFailureLogLevel(code)`:

  | `ApiError` code                    | Level   | Why                                                                        |
  | ---------------------------------- | ------- | -------------------------------------------------------------------------- |
  | `client`, `server`, `unauthorized` | `info`  | The server answered. The caller gets the `ApiError` and shows it           |
  | `network`, `timeout`, `unknown`    | `warn`  | As before: no answer, or an unexpected error                               |
  | `canceled`                         | `debug` | The app aborted the request itself, e.g. `useFetch` when a screen unmounts |

  With the default levels, `info` is written in development and preview and
  hidden in production (`warn`). `console.info` doesn't raise a LogBox toast.
  None of these goes to the error reporter, as before.

- **`docs/error-reporting.md`.** A new "Failed requests" section has the table,
  what each level shows by default, why answered failures aren't `warn`, and
  how to change it (`EXPO_PUBLIC_LOG_LEVEL=warn`, or `logger.error` where a
  failure is a real error). `docs/api-and-storage.md` links it.

- **`__tests__/shared/lib/logger.test.ts`.** A new "failed requests" block:
  - For each of the seven codes, a request through a real `createHttpClient`
    and the real logger, as a development build. It checks which `console`
    method writes the line and that no other method is called. Only
    `network`, `timeout`, and `unknown` reach `console.warn`.
  - For each code, whether the line is shown in development, preview, and
    production.

## Acceptance criteria

| #   | Criterion                                                                                                                                                                                                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Result |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | A handled 4xx/5xx no longer raises a LogBox toast in development but still reaches the logger at a level `EXPO_PUBLIC_LOG_LEVEL` can show; network, timeout, unexpected as before; levels decided and documented | The table above. On the emulator, Metro prints the same lines at the new level: before, `WARN  API POST /auth/login failed: client (400)` ([log](uat/before-fix-metro.log)); after, `INFO  API POST /auth/login failed: client (400)` and `INFO  API GET /todos failed: server (503)` ([log](uat/after-fix-metro.log)). `network`, `timeout`, and `unknown` stay at `warn` (the tests below)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | PASS   |
| 2   | The logger's tests cover the level per case; `docs/error-reporting.md` says what is logged and at which level                                                                                                    | The 14 new tests in [gate-test-ci.log](gate-test-ci.log) (268 tests). [Error Reporting → Failed requests](https://github.com/koniz-dev/react-native-starter/blob/65fd3ea/docs/error-reporting.md#failed-requests)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | PASS   |
| 3   | On the emulator (Expo Go), a wrong password shows the Login Snackbar unobstructed, and after a handled 503 the tab bar can be tapped                                                                             | Android emulator (API 37), Expo Go, demo auth (DummyJSON answers 400 to a wrong password) and the e2e mock API in error mode for Explore. Flow [handled-failures.yaml](uat/flows/handled-failures.yaml), run with [run.sh](uat/run.sh). **Before the fix** ([log](uat/before-fix-maestro.log)): the flow fails, as the toast "API POST /auth/login failed: client (400)" covers the Snackbar. With the toast checks made optional ([flow](uat/flows/handled-failures-optional.yaml), [log](uat/before-fix-full-maestro.log)), the toast is still there on Home and a tap on Explore doesn't switch tabs. [Before screenshots](uat/screenshots-before-sheet.png). **After the fix** ([log](uat/after-fix-maestro.log)): the flow passes. The Snackbar "Invalid credentials" is unobstructed, and no toast appears 5 s later. Explore shows "Service unavailable" with Retry and no toast, and one tap on Home switches tabs. [After screenshots](uat/screenshots-after-sheet.png), each checked | PASS   |
| 4   | Gates pass; CI green                                                                                                                                                                                             | [lint](gate-lint.log), [type-check](gate-type-check.log), [format:check](gate-format-check.log), [docs:check](gate-docs-check.log), [test:ci](gate-test-ci.log). CI run 38137521741 on `65fd3ea`: success ([log](github-actions-ci-38137521741.log))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | PASS   |

## Notes

- **Why `info`, not `debug`.** Preview builds default to `info`, so a tester
  still sees answered failures in the device log there. Production (`warn`)
  hides them, which is what the old `warn` line plus the production default
  could not do without hiding network failures too.
- **Timing in the flow.** The Login Snackbar lasts 4 s, so the flow takes
  its screenshot as soon as the Snackbar appears, then checks for a toast
  again 5 s later: a LogBox toast stays until it is closed.
- **The UAT logs** contain the public demo username `emilys` and the
  deliberately wrong password `wrongpass`. They contain no tokens.
