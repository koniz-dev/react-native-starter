# Issue 30 verification — HTTP foundation

Verified on 2026-10-07.

## Change

- `services/httpClient.ts`: `createHttpClient({ getBaseURL, authenticated, withCredentials })`.
  Every client gets the base URL and timeout from validated config (read per
  request), the trusted-origin token rule from #27 (moved here and re-exported
  from `services/api.ts`), `ApiError` rejections, 401 handling, and logging of
  method, path, code, and status through `utils/logger.ts` (no headers or
  bodies). `api` (`authenticated: true`) and `authApi` (not authenticated,
  `withCredentials: false`) are both built from it.
- `services/apiError.ts`: `class ApiError extends Error` with `code`, `status`,
  and `data`, and `toApiError(unknown)`. The message prefers the server's
  `message`/`error` field.
- `services/session.ts`: `clearStoredSession()`, `onSessionExpired()` and
  `emitSessionExpired()`, a replaceable unauthorized handler (the default clears
  the session and emits session-expired), and an optional refresh-token handler
  (none by default; concurrent 401s share one refresh). `authService.logout()`
  uses `clearStoredSession()`.
- `hooks/useAuthSession.ts` re-reads the session on session-expired.
- `config/env.ts`: `EXPO_PUBLIC_API_TIMEOUT_MS` (1000–120000 ms, default
  15000), as noted on this issue from #28.
- `ApiError` moved from `types/api.ts` to `services/apiError.ts`; `useFetch`
  and docs updated.
- Docs: `docs/api-and-storage.md` (factory, error codes, expired sessions and
  refresh), the environment variables table, `.env.example`, and the
  `docs/how-to.md` import path.

## Deviation: an extra error code

Criterion 2 listed `network | timeout | unauthorized | server | canceled | unknown`.
A `client` code was added for HTTP 4xx other than 401 (400, 403, 404, 422, …),
which would otherwise be reported as `unknown` or `server`. The wrong-password
case in this issue (HTTP 400 from DummyJSON) is one of them.

## Acceptance criteria

| #   | Criterion                                                                                                                                                     | Evidence                                                                                                                                                                                                                                                                                                                                                                  | Result                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 1   | A `createHttpClient` factory applies base URL and timeout from config, the token-origin rule, error normalization, and logging; every client is built from it | `services/httpClient.ts`, `services/api.ts`, `services/auth.ts`; test "applies the configured timeout and base URL"                                                                                                                                                                                                                                                       | PASS                          |
| 2   | `ApiError` with `status`, `code`, `data`, and `toApiError`; both clients reject with it; login shows the server's message                                     | `services/apiError.ts`; tests "rejects wrong credentials with the server message…" and the `toApiError` cases; [iOS: "Invalid credentials"](uat/ios-01-wrong-password-server-message.png)                                                                                                                                                                                 | PASS (plus the `client` code) |
| 3   | On 401 from an authenticated request: one unauthorized handler (default clears token and profile, emits session-expired); optional refresh tried once         | Tests: "clears the session and emits session-expired…", "refreshes once and retries…", "does not refresh twice…", "shares one refresh between concurrent 401s", "leaves the session alone for a 401 on a request sent without a token", "runs a custom unauthorized handler…"; Home test "switches to signed out when the API reports the session expired"; iOS run below | PASS                          |
| 4   | Tests: timeout, network, 401 clears and emits, refresh success retries once, refresh failure clears                                                           | [05-http-foundation-tests.log](05-http-foundation-tests.log) (57 tests across the HTTP client, API client, Home, and config)                                                                                                                                                                                                                                              | PASS                          |
| 5   | Docs cover the factory, error codes, and 401/refresh hooks                                                                                                    | `docs/api-and-storage.md` "Setup", "Error Handling", "Expired sessions (401)"                                                                                                                                                                                                                                                                                             | PASS                          |
| 6   | Gates pass locally and in CI                                                                                                                                  | [01](01-lint.log) (0 errors; 6 existing `ThemedText.tsx` warnings, removed by #35), [02](02-type-check.log), [03](03-test-ci.log) (19 suites / 134 tests), [04](04-format-check.log); CI run in the closing comment                                                                                                                                                       | PASS                          |

## Device run (iOS 18.6 simulator, Expo Go)

API pointed at a local server whose response mode was switched with a flag
file, with that origin trusted and a 3 s timeout ([log](uat/ios-run.log)):

| Scenario                                                                                                      | Result                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wrong password (DummyJSON, HTTP 400)                                                                          | Snackbar shows the server message "Invalid credentials" ([screen](uat/ios-01-wrong-password-server-message.png)); XCUITest `testWrongPasswordShowsServerMessage` passed                                                |
| Signed in ([screen](uat/ios-02-signed-in.png)), then the API returns 401 for a request that carried the token | Explore shows "Token expired" ([screen](uat/ios-03-explore-401-token-expired.png)); the Expo Go Keychain item count drops from 3 to 2; Home shows "Not signed in" ([screen](uat/ios-04-home-signed-out-after-401.png)) |
| API responds after 8 s                                                                                        | Explore shows "The request timed out" after 3 s ([screen](uat/ios-05-explore-timeout.png))                                                                                                                             |

Metro shows the client's log lines with method, path, code, and status only:
`API POST /auth/login failed: client (400)`,
`API GET /todos failed: unauthorized (401)`, `API GET /todos failed: timeout`.

Home also re-reads the session when it regains focus, so on the device the
signed-out state could come from either path; the Jest test
"switches to signed out when the API reports the session expired" isolates
the event path.

The issue could not be claimed at the start because GitHub's API returned
errors; it was claimed once the API recovered, before this verification.
